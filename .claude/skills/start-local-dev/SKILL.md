---
name: start-local-dev
description: Start Quillborne locally (the database, the blob store, the Go service and the Vite dev server), signed in as the debug user and without anyone else's secrets. Use when the user says "start local dev", "run it locally", "start the app" or "spin it up", or when a local run does not come up.
---

# Start local dev

Bring the whole stack up with `just dev` and hand the user a working address. Work from the repository root and
take the steps in order. Each step starts with the check that decides whether it is needed, so on a machine that
has run this before, every step through 5 is a check that passes.

Never print `.env`, because it holds the seed. Check a key by its name and length only.

The commands are for macOS. On Linux, install with the package manager, and use `sed -i` for `sed -i ''` and
`xdg-open` for `open`.

## Ask the user

Run the checks first, then ask in one message only the questions they raised. The answer in brackets is the
default when the user says to just do it.

1. A tool is missing. Install it? [yes, with the commands in step 1]
2. `air` is in Go's bin folder but not on `PATH`. Add `export PATH="$PATH:$(go env GOPATH)/bin"` to their shell
   profile? [yes]
3. Docker is installed but not running. Start it? [yes, `open -a Docker` or `open -a OrbStack`]
4. Something already listens on the service, database or blob port. Stop it? [yes when it is an old Quillborne run,
   otherwise ask what it is first]
5. Run it in your session, or will they run `just dev` in their own terminal to get the logs and Ctrl-C? [your
   session]
6. Open it in the browser when it is up? [yes]

## 1. Tools

Docker, which must be running (`docker info`), Go at the `go` line of `go.mod`, node, pnpm, just and air. Look for
air in `$(go env GOPATH)/bin` as well as on `PATH`, and export that folder in your own shell either way.

```sh
brew install just
go install github.com/air-verse/air@latest
```

Do not run `just install` for this. It also installs the Azure CLI, playwright-cli and the private `sauth` CLI, which
a local run never uses, and `sauth` installs only with read access to it.

## 2. Keys

```sh
[ -f .env ] || cp .env.example .env
grep -q '^SAUTH_DEBUG_PRIVATE_SEED=$' .env && sed -i '' "s/^SAUTH_DEBUG_PRIVATE_SEED=$/SAUTH_DEBUG_PRIVATE_SEED=$(openssl rand -hex 32)/" .env
just env
```

The seed belongs to this machine: 64 hex characters that encrypt the keys players save in the local database. When
it is empty, saving a key answers 500. `SAUTH_APP_SECRET`, `GH_REPO_TOKEN` and `SERVER_VERSION` stay empty.
`SAUTH_DEBUG_USER_ID` signs every request in as Testy McTestface and skips Samna Auth, and the nimling modules the
build and the migrations pull are public.

## 3. Web dependencies

```sh
[ -d web/node_modules ] || (cd web && pnpm install)
```

## 4. Database image

```sh
docker image inspect quillborne-db > /dev/null 2>&1 || just build-db
```

The migrations are baked into the image. Run `just build-db` again when anything under `database/` changed after
the image was built: compare `docker image inspect -f '{{.Created}}' quillborne-db` with
`git log -1 --format=%cI -- database`.

## 5. Ports

The service listens on `SERVER_PORT` (4290), Postgres on `PGPORT` (5490) and Azurite on 10000. Check each with
`lsof -nP -iTCP:<port> -sTCP:LISTEN`. An old run leaves the `quillborne-db` and `quillborne-blob` containers
behind, which `docker rm -f quillborne-db quillborne-blob` clears. Vite wants 5173 and takes the next free port
when 5173 is held, so read its address from its output rather than assuming one.

## 6. Start

Run `just dev` in the background with Go's bin folder on `PATH`. It starts Postgres and migrates it, Azurite, the
service under air and Vite. Ctrl-C, a SIGINT to its process group, stops all four and removes the containers and
the database volume.

Wait for Vite's `Local:` line and for the service port to answer, then measure through Vite's address:

```sh
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:<vite port>/api/auth/me
```

200 means the web, the proxy, the service, the database and the debug sign in all work.

## 7. Hand over

Tell the user:

- the address, and that they are signed in as Testy McTestface
- that the database starts empty on every `just dev` and is removed when it stops
- that Go changes rebuild and web changes hot reload
- that the AI features need their own Replicate key, saved on `/user`, and that everything else works without one
- when it runs in your session, that it stops when the session ends

## When it does not come up

- `Image quillborne-db not found`: go back to step 4.
- `air: not found`: Go's bin folder is not on `PATH`.
- A port is already in use: go back to step 5.
- The dev server answers 504 Outdated Optimize Dep after `just gate` or `just build`: both remove
  `web/node_modules/.vite`, so restart `just dev`.
- Saving a key answers 500: the seed is empty. Go back to step 2, then restart `just dev`.
- `pnpm dev` opens Brave on 5173 when Brave is installed and not running, even after Vite moved to another port.
  Ignore it and use Vite's address.
