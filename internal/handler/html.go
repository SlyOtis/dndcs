package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
)

func GetHTML(root string) echo.HandlerFunc {
	index := filepath.Join(root, "index.html")
	return func(ctx echo.Context) error {
		path := filepath.Join(root, filepath.Clean("/"+ctx.Request().URL.Path))
		if strings.HasPrefix(path, root) {
			if info, err := os.Stat(path); err == nil && !info.IsDir() {
				return ctx.File(path)
			}
		}
		if strings.HasPrefix(ctx.Request().URL.Path, "/api/") {
			return ctx.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
		}
		return ctx.File(index)
	}
}
