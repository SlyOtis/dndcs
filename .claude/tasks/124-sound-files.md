---
id: 124
parent:
depends: []
relations: []
title: The sound manager stops preloading the nineteen wav files that do not exist under public/
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:16:41Z
questions: []
---

## Intent
The 110 walk: `SoundManager.svelte` preloads nineteen `.wav` files, `dice-roll.wav`, `critical-hit.wav`, `level-up.wav` and the rest, none of which exist anywhere under `public/`, so every sheet logs nineteen warnings. `src/lib/soundboard.ts` is the working audio path and plays uploaded clips from `audioData`.

## Scope
`src/components/SoundManager.svelte`. Not `src/lib/soundboard.ts`, not `public/`.

## Order
1. dndcs: `SoundManager` preloads no file that does not exist; the static list of nineteen names goes, and a sound is played only from an address that resolves.
2. verify: `just gate`, then `just dev` and open Testy's sheet with the console open.

## Done when
Testy's sheet logs no missing audio warning, and `just gate` is clean.

## Summary
