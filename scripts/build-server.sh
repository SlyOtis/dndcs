#!/bin/sh
set -e

go build -ldflags "-X github.com/SlyOtis/quillborne/internal/version.Version=$SERVER_VERSION" -o "./bin/${APP_NAME:-quillborne}" ./cmd
