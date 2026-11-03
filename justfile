set dotenv-load
set export

default:
    @just --list

install:
    cd web && pnpm install
    go mod download

env:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ ! -f .env ]; then
        echo ".env is missing. Copy .env.example to .env and fill in the values."
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

build: build-web build-server

build-web: env
    rm -rf web/dist web/node_modules/.vite
    cd web && pnpm build

build-server:
    sh scripts/build-server.sh

build-db:
    sh scripts/build-db.sh

build-docker:
    docker build --build-arg GH_REPO_TOKEN="$GH_REPO_TOKEN" --build-arg IMAGE_VERSION="$SERVER_VERSION" --secret id=node_auth_token,env=NODE_AUTH_TOKEN -t "$APP_NAME" .

dev: env
    sh scripts/dev.sh

dev-db:
    sh scripts/dev-db.sh

dev-server:
    sh scripts/dev-server.sh

dev-web:
    cd web && pnpm dev

preview: build-web
    cd web && pnpm preview

check:
    cd web && pnpm check

test:
    cd web && pnpm test
    go test ./...

vet:
    go vet ./...

walk:
    bash web/test/walk.sh

gate:
    just check
    just test
    just build
    just vet

migrate *args:
    smig {{args}} --schema=./database/migrate.yml --db-dir=./database

update:
    cd web && pnpm update --latest

clean:
    sh scripts/clean.sh

deploy env='tst' version='':
    sh scripts/deploy.sh {{env}} {{version}}

rules:
    firebase deploy --only firestore:rules,firestore:indexes

firebase-deploy: gate rules
    firebase deploy --only hosting

reference kind *ARGS:
    bash web/scripts/reference.sh {{kind}} {{ARGS}}

storage-rules:
    firebase deploy --only storage:rules
