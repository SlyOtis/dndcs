---
description: The stack, the keys, the environment, the commands, and what a deploy ships
paths:
  - "**"
---

## Stack

dndcs is a hosted Samna service. A Go service in `cmd/` and `internal/` (Echo, Bun, `samna-auth-middleware` as a disciple) owns the data and the access, and serves the Svelte app from `web/dist` on the same port. Players sign in through Samna Auth, the table's data lives in Postgres migrated by smig, claims decide who reads and writes every row, and live changes reach the table as server-sent events over Postgres `LISTEN` and `NOTIFY`. Its home is dndcs.dugr.no, a Nimtech internal app on tst.

The web lives in `web/`: `web/src` is the app, `web/public` the static sources and art, `web/test` the walk and its specs. `just dev` starts the database, the service on `SERVER_PORT` and the Vite dev server, and Vite proxies `/api` to the service.

The Vite dev server carries two middlewares of its own. The `/replicate` proxy reaches the Replicate API without CORS. The `/media/` store reads and writes originals under `web/media/`, which is gitignored, with `ETag`, `If-None-Match` and byte ranges, so audio and video stream. Both exist only under `just dev`.

The `firebase` package is still a dependency of the web, and `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` and the `rules`, `storage-rules` and `firebase-deploy` recipes are still in the repo. Nothing in the app reads or writes Firestore.

pnpm only. Never npm, never yarn.

## Keys

Every key lives in `.env`, which is ignored. `.env.example` names every key the code reads and carries no values.

- `SERVER_*`: the service's name, version, port, html path, allowed origins, log level, environment, and `SERVER_OWNER_ID`, the Knights of the Cauldron organization in Samna Auth that owns every row.
- `PG*`: the Postgres connection the service and smig use.
- `SAUTH_ENDPOINT`, `SAUTH_APP_SLUG`, `SAUTH_REDIRECT_URI`, `SAUTH_PAGE_REDIRECT`: the Samna Auth prophet and the app this service signs in as. Locally that is the `dndcs-dev` app on tst.
- `SAUTH_DEBUG_USER_ID`: set, the service signs every request in as that user and the `debug` migration step seeds the identity, so a local run needs no browser login. Empty on tst.
- `GH_REPO_TOKEN`: reads the private `samna-auth-middleware` module and its claimius migrations in the build and in smig. Never named `GITHUB_TOKEN` or `GH_TOKEN`.
- `WALK_EMAIL`, `WALK_PASSWORD`: the browser walk's account.
- `VITE_FIREBASE_*`: the six Firebase values `just env` still requires.

The secrets are `SAUTH_APP_SECRET`, `PGPASSWORD`, `GH_REPO_TOKEN` and `WALK_PASSWORD`. A secret is never committed and never gets a `VITE_` prefix, because a `VITE_` value is inlined into the bundle.

A per player key belongs in that player's profile details, edited on `/user` and readable through the API only with write on the profile, which only its owner holds. `web/src/lib/integrations.ts` is the one list of services, what each is for and which profile field holds its key. Add a service there before writing code that calls it.

## Commands

- `just env` fails when `.env` is missing a key `.env.example` names. `just dev`, `just build` and `just build-web` depend on it.
- `just dev-db` builds and runs the local Postgres and migrates it. `just dev` runs it together with the service and the web; `just dev-server` and `just dev-web` run one each.
- `just migrate <args>` runs smig against `database/migrate.yml` on the local database only. No recipe reaches a deployed database; the image's migrate target is what a deploy runs.
- `just gate` runs check, test, build and vet: svelte-check, vitest, `go test ./...`, the web and server builds, and `go vet`. Zero errors and zero warnings; a new warning is a regression.
- `just deploy` cuts the next patch with sbump and pushes its `-tst` tag for the deploy workflow; the repo's only workflow today is `firebase-hosting-pull-request.yml`, so nothing answers that tag yet. `just deploy prd <tag>` releases a tag to prd through `sbump release`, only on the user's word for that tag.
- `just build-docker` builds the image: the web, the server and the migrate target.

Never hand roll a step the justfile owns.

## Tests

`vitest` for the web and `go test` for the service, both run by `just test`. The rules engine is the tested surface on the web: the parser, the resolver, the bridge and the store. A new system or a new formula ships with a case.

Every route ships with a Go test of who may and who may not reach it, the way `test/go/access_test.go` proves that a player reads a campaign only once seated and a hidden roll reaches the DM alone. Every stream ships with a test of what it delivers to whom, the way `test/go/stream_test.go` proves a hidden roll never reaches a player's stream.

A file named `*.spec.ts` is a test. A fixture is `*.fixture.ts` and never carries the test suffix.
