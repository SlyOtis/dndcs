#!/bin/sh
set -e

if [ ! -f web/dist/index.html ]; then
    just build-web
fi

SERVER_HTML_PATH="${SERVER_HTML_PATH:-./web/dist}" air
