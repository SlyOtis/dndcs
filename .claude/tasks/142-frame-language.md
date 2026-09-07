---
id: 142
parent: 139
depends: [140]
relations: []
title: Frames, panels and textures are rebuilt from the second reference set and no frame renders broken
type: task
status: staged
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-07T10:53:32Z
questions: []
images: []
---

## Intent
The user: lots of broken design on the panel frames, and colouring, texture and completeness need to be far better. `Frame.svelte` carries five variants and thirty four pixel literals, `Panel.svelte` three, and `Ornament.svelte` the corner and rail vectors; frames misalign at their corners, clip their rails and read flat because the textures are three tokens applied unevenly.

## Scope
`src/components/ui/Frame.svelte`, `Panel.svelte`, `Ornament.svelte`, `Card.svelte`, `Stat.svelte`, `Slot.svelte`, `Meter.svelte`, `Banner.svelte`, and the texture, ground, metal and shadow tokens in `src/app.css`. Not `Shell.svelte`, which is 143, and not `Sigil.svelte`, which is 130.


## Goal
Every frame and panel renders whole with aligned corners at 1280 and 2000 wide under all five themes, `grep -rn "[0-9]px" src/components/ui/Frame.svelte src/components/ui/Panel.svelte` returns only hairlines, and `just gate` is clean.
