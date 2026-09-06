---
id: 124
parent:
depends: []
relations: []
title: The sound manager stops preloading the nineteen wav files that do not exist under public/
type: bug
status: testing
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [1c13f50b8d7df84c4e5b2f721bea47cb8195a630, d9106008b98ba977c2dc1071d733d443dab60086]
created_at: 2026-09-06T19:12:48Z
updated_at: 2026-09-06T19:38:59Z
questions: []
base: d32b80c645e6bfe46355798c42feca0d1210fce4
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
`src/components/SoundManager.svelte`: the `soundFiles` map and the `onMount` preload of all nineteen files are gone, with `preloadAudio`. `soundEvents` is the one list, typed `as const`, and `SoundKey` derives from it. `getAudio(sound)` builds the address from the key, `diceRoll` to `/sounds/dice-roll.wav`, sends one `HEAD` request per key and caches the promise; it yields an `Audio` only when the response is `ok` with an `audio/` content type, since the dev server and Firebase Hosting both answer a missing path with the SPA `index.html` at 200. `playSound` awaits that, shows the funny text as before, and plays nothing when the address does not resolve. `setVolume` walks the cached promises. No request is made until a sound event fires, so a sheet opens with no audio warning. `just check` 0 errors 0 warnings; `just build` passes.

### Findings
- The `just build` warning that the main chunk exceeds 500 kB is present with HEAD's `SoundManager.svelte` too.
- `VITE_SOUND_PATH` is read here and is not in `.env.example`; `setup.md` says only the Firebase config carries the `VITE_` prefix.
- `(globalThis as any).soundManager` has no caller in `src/`; `src/lib/navigation.ts` exports an unrelated `soundManager` whose `playSound` only logs.
- `funnyTexts.healing` and `funnyTexts.treasure` are keyed by no sound event and are only reached by other components dispatching `showFunnyText` directly.
