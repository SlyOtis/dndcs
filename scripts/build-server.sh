#!/bin/sh
set -e

go build -ldflags "-X github.com/SlyOtis/dndcs/internal/version.Version=$SERVER_VERSION" -o "./bin/${APP_NAME:-dndcs}" ./cmd
