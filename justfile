default:
    @just --list

install:
    pnpm install

env:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ ! -f .env ]; then
        echo ".env is missing. Copy .env.example to .env and fill in the Firebase values."
        exit 1
    fi
    missing=0
    while read -r key; do
        [ -z "$key" ] && continue
        if ! grep -qE "^${key}=.+" .env; then
            echo "missing or empty in .env: $key"
            missing=1
        fi
    done < <(grep -oE '^VITE_[A-Z_]+' .env.example)
    if [ "$missing" -ne 0 ]; then exit 1; fi
    echo ".env carries every key .env.example names"

dev: env
    pnpm dev

build: env
    rm -rf dist node_modules/.vite
    pnpm build

preview: build
    pnpm preview

check:
    pnpm check

test:
    pnpm test

walk:
    bash test/walk.sh

gate:
    just check
    just test
    just build

update:
    pnpm update --latest

rules:
    firebase deploy --only firestore:rules,firestore:indexes

deploy: gate
    firebase deploy --only hosting,firestore:rules,firestore:indexes

storage-rules:
    firebase deploy --only storage:rules

reference kind *ARGS:
    bash scripts/reference.sh {{kind}} {{ARGS}}
