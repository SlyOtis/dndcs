# Quillborne

The table's character sheet and campaign book. Players build and play characters from rule systems written as
JSON (`web/public/sources/systems/`). The table shares campaigns: the roll log and chat, maps, lore, parties,
encounters and music.

A Go service (`cmd/`, `internal/`) owns the data in Postgres and serves the Svelte app in `web/`. Players sign in
through Samna Auth.

## Run it locally

A local run needs nobody else's secrets and no sign in. Every request is signed in as a seeded debug user,
Testy McTestface.

### 1. Tools

- Docker, running
- Go at the `go` line of `go.mod`
- Node and pnpm
- just and air:

```sh
brew install just
go install github.com/air-verse/air@latest
echo 'export PATH="$PATH:$(go env GOPATH)/bin"' >> ~/.zshrc && source ~/.zshrc
```

`just install` also installs the Azure CLI, playwright-cli and the private `sauth` CLI. A local run needs none of
them, and `sauth` installs only with read access to it.

### 2. Configure

```sh
cp .env.example .env
sed -i '' "s/^SAUTH_DEBUG_PRIVATE_SEED=$/SAUTH_DEBUG_PRIVATE_SEED=$(openssl rand -hex 32)/" .env
cd web && pnpm install && cd ..
```

`.env.example` carries the working local value of every other key. The keys it leaves empty:

| Key                        | Locally                                                                                        |
|----------------------------|------------------------------------------------------------------------------------------------|
| `SAUTH_DEBUG_PRIVATE_SEED` | Your own, generated above. It encrypts the keys players save. Empty, saving a key answers 500. |
| `SAUTH_APP_SECRET`         | Empty. Only the real sign in and the Samna Auth sync use it, and the debug user skips both.    |
| `GH_REPO_TOKEN`            | Empty. The nimling modules the build and the migrations pull are public.                       |
| `SERVER_VERSION`           | Empty. The service reports `dev`.                                                              |

### 3. Build the database image

```sh
just build-db
```

The migrations are baked into the image. Rebuild it after any change under `database/`.

### 4. Run

```sh
just dev
```

It starts Postgres on `PGPORT` and migrates it, the Azurite blob store on 10000, the service on `SERVER_PORT`
under air, which rebuilds on every Go change, and Vite with hot reload, which proxies `/api` to the service. Open
the address Vite prints, http://localhost:5173 unless that port is taken. Ctrl-C stops all four.

`just dev-db`, `just dev-blob`, `just dev-server` and `just dev-web` run one each.

### Good to know

- The database starts empty on every `just dev` and is removed when it stops. The seed holds Testy and a second
  player, Pip.
- The AI features (character import, class analysis, chat and transcription) call Replicate with the player's own
  key, saved on `/user`. Without one they answer "Add your Replicate key on your profile first". Everything else
  works without one.

## Test

```sh
just test
just gate
```

`just test` runs vitest and `go test ./...`. The Go tests need the database and the blob store from `just dev`,
and skip without them. `just gate` runs check, test, build and vet. It must end with zero errors and zero warnings
before a pull request is ready.

## Ship

A merge to `main` deploys to tst through `.github/workflows/azure-deploy.yml`. There is no deploy command. How work
reaches `main` is in `.claude/rules/workflow.md`.
