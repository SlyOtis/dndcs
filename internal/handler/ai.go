package handler

import (
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/nimling/nimbody/respond"
	sdb "github.com/nimling/samna-auth-middleware/v2/disciple/sdb"
)

func PostAI(ctx echo.Context) error {
	actorID, ok := ctx.Get("user_id").(uuid.UUID)
	if !ok {
		return respond.Error(ctx, http.StatusUnauthorized, "Unauthorized")
	}
	rctx := ctx.Request().Context()
	secrets, err := sdb.Instance().GetSecrets(rctx, actorID, sdb.ACCESS_READ, nil, 0)
	if err != nil {
		ctx.Logger().Errorf("PostAI: %v", err)
		return respond.ErrorInternal(ctx)
	}
	key := "replicate_api_key:" + actorID.String()
	var token string
	for _, secret := range secrets {
		if secret.Key != key {
			continue
		}
		token, err = secret.Resolve(rctx, sdb.Instance().DB, actorID)
		if err != nil {
			ctx.Logger().Errorf("PostAI: %v", err)
			return respond.ErrorInternal(ctx)
		}
	}
	if token == "" {
		return respond.Error(ctx, http.StatusPreconditionFailed, "Add your Replicate key on your profile first")
	}
	endpoint := strings.TrimSuffix(os.Getenv("REPLICATE_ENDPOINT"), "/")
	if endpoint == "" {
		endpoint = "https://api.replicate.com/v1"
	}
	target := endpoint + "/" + strings.TrimPrefix(ctx.Param("*"), "/")
	if query := ctx.Request().URL.RawQuery; query != "" {
		target += "?" + query
	}
	limit, err := strconv.ParseInt(os.Getenv("FILE_MAX_BYTES"), 10, 64)
	if err != nil || limit <= 0 {
		limit = 256 << 20
	}
	var body io.Reader
	if ctx.Request().Method != http.MethodGet {
		body = http.MaxBytesReader(ctx.Response(), ctx.Request().Body, limit)
	}
	outbound, err := http.NewRequestWithContext(rctx, ctx.Request().Method, target, body)
	if err != nil {
		return respond.Error(ctx, http.StatusBadRequest, "Invalid request")
	}
	outbound.Header.Set("Authorization", "Bearer "+token)
	for _, name := range []string{"Content-Type", "Prefer", "Accept"} {
		if value := ctx.Request().Header.Get(name); value != "" {
			outbound.Header.Set(name, value)
		}
	}
	answer, err := http.DefaultClient.Do(outbound)
	if err != nil {
		ctx.Logger().Errorf("PostAI: %v", err)
		return respond.Error(ctx, http.StatusBadGateway, "Replicate did not answer")
	}
	defer answer.Body.Close()
	contentType := answer.Header.Get("Content-Type")
	if contentType == "" {
		contentType = echo.MIMEApplicationJSON
	}
	return ctx.Stream(answer.StatusCode, contentType, answer.Body)
}
