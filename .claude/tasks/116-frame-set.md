---
id: 116
parent: 112
depends: [115, 140]
relations: [127]
title: The portrait frame set gains the complex gothic frame designs
type: epic
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T16:22:55Z
updated_at: 2026-09-06T21:24:25Z
questions: []
---

## Intent
The q-003 answer: the frame dialog 115 built is the right home for the choice, but the set it offers is too thin. `PORTRAIT_FRAMES` in `src/components/ui/Portrait.svelte` holds five plain silhouettes, lancet, ogee, shield and their kin. The gothic inspiration sheets carry the ornate borders the user wants to pick from.

## Scope
`src/components/ui/Portrait.svelte`, `src/components/FrameDialog.svelte`. Not `src/lib/dialogs/frame.ts`, not the crown.

## Order
1. dndcs: read `docs/inspiration/gothic-borders.png`, `gothic-ui-kit.png` and `gothic-elements.png` before drawing anything.
2. dndcs: add the complex frame designs from those sheets to `PORTRAIT_FRAMES`, each a vector frame in the `Portrait` masks and strokes the existing five already use, each with an `id` and a `title`. The plain five stay.
3. dndcs: the frame dialog lays the larger set out so every frame is legible at its tile size and the dialog does not exceed the viewport height without scrolling inside `BaseDialog`.
4. verify: `just gate`.

## Done when
The frame dialog on Testy offers the five plain frames and the new ornate ones, each renders the portrait through its frame on the crown when picked, and `just gate` is clean.

## Summary
