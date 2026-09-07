---
id: 124
parent:
depends: []
relations: []
title: The sound manager stops preloading the nineteen wav files that do not exist under public/
type: bug
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [1c13f50b8d7df84c4e5b2f721bea47cb8195a630, d9106008b98ba977c2dc1071d733d443dab60086]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-07T10:53:28Z
questions: []
base: d32b80c645e6bfe46355798c42feca0d1210fce4
---

## Intent
The 110 walk: `SoundManager.svelte` preloads nineteen `.wav` files, `dice-roll.wav`, `critical-hit.wav`, `level-up.wav` and the rest, none of which exist anywhere under `public/`, so every sheet logs nineteen warnings. `src/lib/soundboard.ts` is the working audio path and plays uploaded clips from `audioData`.

## Scope
`src/components/SoundManager.svelte`. Not `src/lib/soundboard.ts`, not `public/`.

## Findings
- The `just build` warning that the main chunk exceeds 500 kB is present with HEAD's `SoundManager.svelte` too.
- `VITE_SOUND_PATH` is read here and is not in `.env.example`; `setup.md` says only the Firebase config carries the `VITE_` prefix.
- `(globalThis as any).soundManager` has no caller in `src/`; `src/lib/navigation.ts` exports an unrelated `soundManager` whose `playSound` only logs.
- `funnyTexts.healing` and `funnyTexts.treasure` are keyed by no sound event and are only reached by other components dispatching `showFunnyText` directly.

## Goal
Testy's sheet logs no missing audio warning, and `just gate` is clean.
