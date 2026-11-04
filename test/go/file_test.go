package test

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SlyOtis/dndcs/internal/handler"
	"github.com/SlyOtis/dndcs/internal/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func requireBlob(t *testing.T) {
	t.Helper()
	requireStack(t)
	if err := storage.Init(context.Background()); err != nil {
		t.Skip("no local blob store, run just dev-blob first: " + err.Error())
	}
}

func raw(t *testing.T, actor uuid.UUID, method, target, body string, headers map[string]string, run echo.HandlerFunc) *httptest.ResponseRecorder {
	t.Helper()
	e := echo.New()
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	for name, value := range headers {
		req.Header.Set(name, value)
	}
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)
	ctx.Set("user_id", actor)
	if err := run(ctx); err != nil {
		t.Fatalf("%s %s: %v", method, target, err)
	}
	return rec
}

func postStoredFile(t *testing.T, actor uuid.UUID, content string) string {
	t.Helper()
	path := "users/" + actor.String() + "/files/" + uuid.NewString() + ".ogg"
	if status, answer := call(t, actor, http.MethodPost, "/api/file", `{"path":"`+path+`","name":"theme.ogg","type":"audio/ogg"}`, nil, handler.PostFile); status != http.StatusCreated {
		t.Fatalf("PostFile: %d %+v", status, answer.Error)
	}
	rec := raw(t, actor, http.MethodPut, "/api/file/data?path="+path, content, map[string]string{"Content-Type": "audio/ogg"}, handler.PutFileData)
	if rec.Code != http.StatusOK {
		t.Fatalf("PutFileData: %d %s", rec.Code, rec.Body.String())
	}
	return path
}

func TestAFileIsStoredAndStreamedWithItsEtagAndRanges(t *testing.T) {
	requireBlob(t)
	ensureProfile(t, dungeonMaster, "testy@dndcs.local")
	content := "0123456789abcdef"
	path := postStoredFile(t, dungeonMaster, content)
	digest := sha256.Sum256([]byte(content))
	etag := `"` + base64.RawURLEncoding.EncodeToString(digest[:]) + `"`

	full := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", nil, handler.GetFileData)
	if full.Code != http.StatusOK || full.Body.String() != content {
		t.Fatalf("full read: %d %q", full.Code, full.Body.String())
	}
	if full.Header().Get("ETag") != etag || full.Header().Get("Accept-Ranges") != "bytes" || full.Header().Get("Content-Type") != "audio/ogg" {
		t.Fatalf("headers: %v", full.Header())
	}
	if again := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", map[string]string{"If-None-Match": etag}, handler.GetFileData); again.Code != http.StatusNotModified {
		t.Fatalf("If-None-Match: %d", again.Code)
	}
	part := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", map[string]string{"Range": "bytes=2-5"}, handler.GetFileData)
	if part.Code != http.StatusPartialContent || part.Body.String() != "2345" || part.Header().Get("Content-Range") != "bytes 2-5/16" {
		t.Fatalf("range: %d %q %s", part.Code, part.Body.String(), part.Header().Get("Content-Range"))
	}
	tail := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", map[string]string{"Range": "bytes=-3"}, handler.GetFileData)
	if tail.Code != http.StatusPartialContent || tail.Body.String() != "def" {
		t.Fatalf("suffix range: %d %q", tail.Code, tail.Body.String())
	}
	if bad := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", map[string]string{"Range": "bytes=40-50"}, handler.GetFileData); bad.Code != http.StatusRequestedRangeNotSatisfiable {
		t.Fatalf("unsatisfiable range: %d", bad.Code)
	}
	if head := raw(t, dungeonMaster, http.MethodHead, "/api/file/data?path="+path, "", nil, handler.GetFileData); head.Code != http.StatusOK || head.Body.Len() != 0 || head.Header().Get("Content-Length") != "16" {
		t.Fatalf("head: %d %d %s", head.Code, head.Body.Len(), head.Header().Get("Content-Length"))
	}
}

func TestAFileIsReadOnlyByThoseItsClaimsReach(t *testing.T) {
	requireBlob(t)
	ensureProfile(t, dungeonMaster, "testy@dndcs.local")
	ensureProfile(t, player, "pip@dndcs.local")
	campaignID := postCampaign(t)
	path := "campaigns/" + campaignID + "/files/" + uuid.NewString() + ".png"
	if status, answer := call(t, dungeonMaster, http.MethodPost, "/api/file", `{"path":"`+path+`","name":"map.png","type":"image/png","campaign_id":"`+campaignID+`"}`, nil, handler.PostFile); status != http.StatusCreated {
		t.Fatalf("PostFile: %d %+v", status, answer.Error)
	}
	if rec := raw(t, dungeonMaster, http.MethodPut, "/api/file/data?path="+path, "map bytes", nil, handler.PutFileData); rec.Code != http.StatusOK {
		t.Fatalf("PutFileData: %d", rec.Code)
	}
	if rec := raw(t, player, http.MethodGet, "/api/file/data?path="+path, "", nil, handler.GetFileData); rec.Code == http.StatusOK {
		t.Fatalf("a player away from the table read the campaign file")
	}
	seatPlayer(t, campaignID)
	if rec := raw(t, player, http.MethodGet, "/api/file/data?path="+path, "", nil, handler.GetFileData); rec.Code != http.StatusOK || rec.Body.String() != "map bytes" {
		t.Fatalf("a seated player was refused the campaign file: %d", rec.Code)
	}
	if rec := raw(t, player, http.MethodPut, "/api/file/data?path="+path, "overwritten", nil, handler.PutFileData); rec.Code == http.StatusOK {
		t.Fatalf("a player overwrote the dungeon master's file")
	}
	if status, _ := call(t, dungeonMaster, http.MethodDelete, "/api/file?path="+path, "", nil, handler.DeleteFile); status != http.StatusOK {
		t.Fatalf("DeleteFile: %d", status)
	}
	if rec := raw(t, dungeonMaster, http.MethodGet, "/api/file/data?path="+path, "", nil, handler.GetFileData); rec.Code != http.StatusNotFound {
		t.Fatalf("a deleted file still streams: %d", rec.Code)
	}
}

func TestAFileOverTheLimitIsRefused(t *testing.T) {
	requireBlob(t)
	ensureProfile(t, dungeonMaster, "testy@dndcs.local")
	t.Setenv("FILE_MAX_BYTES", "8")
	path := "users/" + dungeonMaster.String() + "/files/" + uuid.NewString() + ".ogg"
	if status, answer := call(t, dungeonMaster, http.MethodPost, "/api/file", `{"path":"`+path+`","name":"long.ogg","type":"audio/ogg"}`, nil, handler.PostFile); status != http.StatusCreated {
		t.Fatalf("PostFile: %d %+v", status, answer.Error)
	}
	if rec := raw(t, dungeonMaster, http.MethodPut, "/api/file/data?path="+path, "far more than eight bytes", nil, handler.PutFileData); rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("an oversized file was stored: %d", rec.Code)
	}
}
