#!/bin/sh
set -e

go build -ldflags "-X github.com/SlyOtis/quillborne/internal/version.Version=$(git rev-parse --short=12 HEAD)" -o "./bin/${APP_NAME:-quillborne}" ./cmd
