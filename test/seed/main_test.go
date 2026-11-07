package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func isRouted(router *echo.Echo, method, target string) bool {
	parts := strings.Split(target, "/")
	for _, route := range router.Routes() {
		pattern := strings.Split(route.Path, "/")
		if route.Method != method || len(pattern) != len(parts) {
			continue
		}
		matched := true
		for i := range pattern {
			if !strings.HasPrefix(pattern[i], ":") && pattern[i] != parts[i] {
				matched = false
				break
			}
		}
		if matched {
			return true
		}
	}
	return false
}

func TestEveryStepReachesAMountedRouteWithWhatEarlierStepsSaved(t *testing.T) {
	router := getRouter()
	refs, err := getUsers(fixtures, func(string) string { return uuid.NewString() })
	if err != nil {
		t.Fatal(err)
	}
	files, err := getStepFiles(fixtures)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) == 0 {
		t.Fatal("no step files")
	}
	for _, file := range files {
		for index, one := range file.Steps {
			where := fmt.Sprintf("%s step %d", file.Name, index+1)
			if _, ok := refs[one.As]; !ok {
				t.Fatalf("%s: as %q names no user", where, one.As)
			}
			call, err := getExpanded(one.Call, refs)
			if err != nil {
				t.Fatalf("%s: %v", where, err)
			}
			body, err := getExpanded(string(one.Body), refs)
			if err != nil {
				t.Fatalf("%s: %v", where, err)
			}
			if body != "" && !json.Valid([]byte(body)) {
				t.Fatalf("%s: the body is not JSON once expanded", where)
			}
			method, target, _ := strings.Cut(call, " ")
			if !isRouted(router, method, target) {
				t.Fatalf("%s: %s reaches no mounted route", where, call)
			}
			if one.Save != "" {
				refs[one.Save] = uuid.NewString()
			}
		}
	}
}
