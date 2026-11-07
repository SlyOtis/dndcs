package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"

	"github.com/SlyOtis/quillborne/internal/db"
	"github.com/SlyOtis/quillborne/internal/handler"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
)

//go:embed *.json
var fixtures embed.FS

const usersFile = "users.json"

// The seeder sets the acting user itself; the service never reads this header.
const actorHeader = "Seed-User-ID"

type step struct {
	As   string          `json:"as"`
	Call string          `json:"call"`
	Body json.RawMessage `json:"body"`
	Save string          `json:"save"`
}

type stepFile struct {
	Name  string
	Steps []step
}

func main() {
	if os.Getenv("SAUTH_DEBUG_USER_ID") == "" {
		fmt.Fprintln(os.Stderr, "seed: SAUTH_DEBUG_USER_ID is empty; the local test data goes only into a local debug database")
		os.Exit(1)
	}
	e := echo.New()
	if err := db.Init(e.Logger); err != nil {
		fmt.Fprintln(os.Stderr, "seed: postgres:", err)
		os.Exit(1)
	}
	if _, err := sdb.Init(e.Logger); err != nil {
		fmt.Fprintln(os.Stderr, "seed: samna auth db:", err)
		os.Exit(1)
	}
	if err := postSeed(fixtures, getRouter(), os.Getenv); err != nil {
		fmt.Fprintln(os.Stderr, "seed:", err)
		os.Exit(1)
	}
}

func getRouter() *echo.Echo {
	e := echo.New()
	handler.PutRoutes(e.Group("/api"), func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			actorID, err := uuid.Parse(ctx.Request().Header.Get(actorHeader))
			if err != nil {
				return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": "no seed user"})
			}
			ctx.Set("user_id", actorID)
			return next(ctx)
		}
	})
	return e
}

func getUsers(fsys fs.FS, env func(string) string) (map[string]string, error) {
	raw, err := fs.ReadFile(fsys, usersFile)
	if err != nil {
		return nil, err
	}
	users := map[string]string{}
	if err := json.Unmarshal([]byte(os.Expand(string(raw), env)), &users); err != nil {
		return nil, fmt.Errorf("%s: %w", usersFile, err)
	}
	for name, id := range users {
		if _, err := uuid.Parse(id); err != nil {
			return nil, fmt.Errorf("%s: %s is not a user id: %q", usersFile, name, id)
		}
	}
	return users, nil
}

func getStepFiles(fsys fs.FS) ([]stepFile, error) {
	names, err := fs.Glob(fsys, "*.json")
	if err != nil {
		return nil, err
	}
	files := make([]stepFile, 0, len(names))
	for _, name := range names {
		if name == usersFile {
			continue
		}
		raw, err := fs.ReadFile(fsys, name)
		if err != nil {
			return nil, err
		}
		file := stepFile{Name: name}
		if err := json.Unmarshal(raw, &file.Steps); err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
		files = append(files, file)
	}
	return files, nil
}

func getExpanded(text string, refs map[string]string) (string, error) {
	missing := ""
	expanded := os.Expand(text, func(name string) string {
		value, ok := refs[name]
		if !ok && missing == "" {
			missing = name
		}
		return value
	})
	if missing != "" {
		return "", fmt.Errorf("${%s} names no user and no saved step", missing)
	}
	return expanded, nil
}

func postSeed(fsys fs.FS, router *echo.Echo, env func(string) string) error {
	refs, err := getUsers(fsys, env)
	if err != nil {
		return err
	}
	files, err := getStepFiles(fsys)
	if err != nil {
		return err
	}
	for _, file := range files {
		for index, one := range file.Steps {
			if err := postStep(router, refs, one); err != nil {
				return fmt.Errorf("%s step %d (%s): %w", file.Name, index+1, one.Call, err)
			}
		}
		fmt.Printf("seed: %s, %d steps\n", file.Name, len(file.Steps))
	}
	return nil
}

func postStep(router *echo.Echo, refs map[string]string, one step) error {
	actorID, ok := refs[one.As]
	if !ok {
		return fmt.Errorf("as %q names no user", one.As)
	}
	call, err := getExpanded(one.Call, refs)
	if err != nil {
		return err
	}
	method, target, ok := strings.Cut(call, " ")
	if !ok {
		return fmt.Errorf("call must be a method and a path")
	}
	body, err := getExpanded(string(one.Body), refs)
	if err != nil {
		return err
	}
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set(actorHeader, actorID)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code >= http.StatusMultipleChoices {
		return fmt.Errorf("answered %d: %s", rec.Code, strings.TrimSpace(rec.Body.String()))
	}
	if one.Save == "" {
		return nil
	}
	var answer struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &answer); err != nil || answer.Data.ID == "" {
		return fmt.Errorf("no id to save as %s in %s", one.Save, rec.Body.String())
	}
	refs[one.Save] = answer.Data.ID
	return nil
}
