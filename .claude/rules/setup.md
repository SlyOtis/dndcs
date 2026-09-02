---
description: Keys, the environment, the commands, and what a deploy pushes
paths:
  - "**"
---

## Stack

Frontend only and static. Vite builds to `dist`, Firebase Hosting serves it, Firestore and Storage hold everything. There is no server and none is to be added.

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
