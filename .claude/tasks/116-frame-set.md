---
id: 116
parent: 112
depends: [115, 140]
relations: [127]
title: The portrait frame set gains the complex gothic frame designs
type: epic
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T16:22:55Z
updated_at: 2026-09-08T09:39:45Z
questions: []
scope: [src/components/ui/Portrait.svelte, src/components/FrameDialog.svelte]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The q-003 answer: the frame dialog 115 built is the right home for the choice, but the set it offers is too thin. `PORTRAIT_FRAMES` in `src/components/ui/Portrait.svelte` holds five plain silhouettes, lancet, ogee, shield and their kin. The gothic inspiration sheets carry the ornate borders the user wants to pick from.

## Scope
`src/components/ui/Portrait.svelte`, `src/components/FrameDialog.svelte`. Not `src/lib/dialogs/frame.ts`, not the crown.


## Goal
The frame dialog on Testy offers the five plain frames and the new ornate ones, each renders the portrait through its frame on the crown when picked, and `just gate` is clean.
