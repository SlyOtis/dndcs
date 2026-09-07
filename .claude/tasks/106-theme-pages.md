---
id: 106
parent:
depends: []
relations: []
title: Carry the gothic language onto the remaining pages
type: task
status: done
session:
review:
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [959cf3cc97bdfaaef9164ed9d1a2c0c49acfdc75, f6653512726c84b6fceb1b18877bb3b9947e4af4]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:25Z
questions: [q-012]
base: 8f4236eb81694b4812d9369bc4a3ee32b31f666b
agent: lcp-worker-106
---

## Intent
The gothic pass reached the shared primitives, the dialogs and the left drawer. The pages themselves still carry the older page-level styling, so the app reads as two design languages depending on the screen.

## Scope
`src/pages/MainPage.svelte`, `src/pages/CampaignPage.svelte`, `src/pages/CharacterCreatePage.svelte`, `src/pages/CharacterClassPage.svelte`, `src/pages/CharacterRacePage.svelte`, `src/pages/CampaignCreatePage.svelte`, `src/pages/SourcePage.svelte`, `src/pages/UserPage.svelte`, and per q-012 the fifteen files under `src/components/ui/` the landing carried: `Shell.svelte`, `Glyph.svelte` and `Portrait.svelte` authored new, `Banner.svelte`, `Button.svelte`, `Card.svelte`, `Field.svelte`, `Frame.svelte`, `Ornament.svelte`, `Panel.svelte`, `Rail.svelte`, `Sigil.svelte`, `Slot.svelte`, `Stat.svelte` and `StoredImage.svelte` redrawn. Nothing else under `src/components/`.


## Goal
No page carries a literal colour or a magic pixel size, no text character is used as an icon, no page scrolls horizontally at any width, and `just gate` is clean.
