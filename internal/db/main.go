package db

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

type DB struct {
	*bun.DB
}

var db DB

func Init(logger echo.Logger) error {
	values := map[string]string{}
	for _, key := range []string{"PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"} {
		value, ok := os.LookupEnv(key)
		if !ok || value == "" {
			return errors.New(key + " not set")
		}
		values[key] = value
	}

	sslMode := os.Getenv("PGSSLMODE")
	if sslMode == "" {
		sslMode = "verify-full"
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", values["PGUSER"], values["PGPASSWORD"], values["PGHOST"], values["PGPORT"], values["PGDATABASE"], sslMode)
	logger.Infof("database postgres://%s:*****@%s:%s/%s?sslmode=%s", values["PGUSER"], values["PGHOST"], values["PGPORT"], values["PGDATABASE"], sslMode)

	sqlDB := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetConnMaxLifetime(2 * time.Minute)
	sqlDB.SetConnMaxIdleTime(15 * time.Second)

	db = DB{DB: bun.NewDB(sqlDB, pgdialect.New())}
	db.RegisterModel((*TagObject)(nil))
	return nil
}

func Instance() *DB {
	return &db
}
