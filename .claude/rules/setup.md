---
description: Keys, the environment, the commands, and what a deploy pushes
paths:
  - "**"
---

## Stack

Every player runs their own copy: clone the repo, `just dev`, and the app is theirs on localhost. Firestore holds what the table shares. There is no hosted server and none is to be added, but the dev server each player runs is part of the product, not scaffolding.

It carries two things the browser cannot do alone. The `/replicate` proxy reaches the API without CORS. The `/media/` store reads and writes real files under `media/`, which is gitignored, with `ETag`, `If-None-Match` and byte ranges, so an original never leaves the machine that made it and audio and video stream.

`just build` still produces a static `dist`, and Firebase Hosting still serves it, but a hosted visitor has no proxy and no media store. AI and full size media need the local client.

pnpm only. Never npm, never yarn.

## Keys

Every key lives in `.env`, which is ignored. `.env.example` names the six Firebase values a build needs and carries no values.

`VITE_` prefixed values are inlined into the bundle. Only the Firebase config belongs there. A secret never gets a `VITE_` prefix.

A per player key belongs on their user document and is edited on `/user`. `src/lib/integrations.ts` is the one list of services, what each is for and which profile field holds its key. Add a service there before writing code that calls it.

## Commands

- `just env` fails when `.env` is missing a key. `just dev` and `just build` both depend on it.
- `just gate` runs check, test and build. Zero errors and zero warnings; a new warning is a regression.
- `just deploy` runs the gate, then pushes hosting, `firestore.rules` and `storage.rules`.

Never hand roll a step the justfile owns.

## Tests

`vitest`, run by `just test`. The rules engine is the tested surface: the parser, the resolver, the bridge and the store. A new system or a new formula ships with a case.

A file named `*.spec.ts` is a test. A fixture is `*.fixture.ts` and never carries the test suffix.
