package handler

import (
	"net/http"

	"github.com/SlyOtis/dndcs/internal/db"
	"github.com/SlyOtis/dndcs/internal/version"
	"github.com/labstack/echo/v4"
)

func GetHealthLiveness(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func GetHealthReadiness(ctx echo.Context) error {
	if err := db.Instance().PingContext(ctx.Request().Context()); err != nil {
		return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"status": "database unavailable"})
	}
	return ctx.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func GetVersion(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, map[string]string{"version": version.Version})
}
