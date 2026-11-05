package test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SlyOtis/dndcs/internal/handler"
	"github.com/labstack/echo/v4"
)

func TestTheAIProxyCarriesTheCallersOwnKey(t *testing.T) {
	requireStack(t)
	ensureProfile(t, dungeonMaster, "testy@dndcs.local")
	ensureProfile(t, player, "pip@dndcs.local")
	var seen *http.Request
	var sent string
	stub := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = r
		body, _ := io.ReadAll(r.Body)
		sent = string(body)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"p1","status":"starting"}`))
	}))
	defer stub.Close()
	t.Setenv("REPLICATE_ENDPOINT", stub.URL)

	if status, answer := call(t, dungeonMaster, http.MethodPut, "/", `{"replicate_api_key":"r8_owner"}`, nil, handler.PutProfileDetails); status != http.StatusOK {
		t.Fatalf("PutProfileDetails: %d %+v", status, answer.Error)
	}
	proxy := func(actor string) *httptest.ResponseRecorder {
		e := echo.New()
		req := httptest.NewRequest(http.MethodPost, "/api/ai/models/meta/llama/predictions", nil)
		req.Body = io.NopCloser(strings.NewReader(`{"input":{"prompt":"hi"}}`))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		ctx := e.NewContext(req, rec)
		ctx.SetParamNames("*")
		ctx.SetParamValues("models/meta/llama/predictions")
		if actor == "dm" {
			ctx.Set("user_id", dungeonMaster)
		} else {
			ctx.Set("user_id", player)
		}
		if err := handler.PostAI(ctx); err != nil {
			t.Fatalf("PostAI: %v", err)
		}
		return rec
	}
	rec := proxy("dm")
	if rec.Code != http.StatusCreated || rec.Body.String() != `{"id":"p1","status":"starting"}` {
		t.Fatalf("proxied answer: %d %s", rec.Code, rec.Body.String())
	}
	if seen == nil || seen.URL.Path != "/models/meta/llama/predictions" || seen.Header.Get("Authorization") != "Bearer r8_owner" || sent != `{"input":{"prompt":"hi"}}` {
		t.Fatalf("upstream call: %+v %q", seen, sent)
	}
	seen = nil
	if rec := proxy("player"); rec.Code != http.StatusPreconditionFailed || seen != nil {
		t.Fatalf("a player without a key reached Replicate: %d", rec.Code)
	}
}
