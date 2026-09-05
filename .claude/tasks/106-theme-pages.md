---
id: 106
parent:
depends: []
relations: []
title: Carry the gothic language onto the remaining pages
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-05T15:10:52Z
questions: []
---

## Intent
The gothic pass reached the shared primitives, the dialogs and the left drawer. The pages themselves still carry the older page-level styling, so the app reads as two design languages depending on the screen.

## Scope
`src/pages/MainPage.svelte`, `src/pages/CampaignPage.svelte`, `src/pages/CharacterCreatePage.svelte`, `src/pages/CharacterClassPage.svelte`, `src/pages/CharacterRacePage.svelte`, `src/pages/CampaignCreatePage.svelte`, `src/pages/SourcePage.svelte`, `src/pages/UserPage.svelte`. Not `src/components/ui/**`, which is done.

## Order
1. dndcs: read `docs/inspiration/gothic-borders.png`, `gothic-ui-kit.png` and `gothic-elements.png` before changing anything.
2. dndcs: carry the language onto each page: the `Ornament` gothic vectors, the `--mask-arch` and `--mask-shield` tokens, `Portrait` for any portrait, `Glyph` inside any `Sigil`, and page-scoped variables mapped from app tokens rather than raw values.
3. dndcs: no page may scroll sideways. `Shell` holds the backstop and a page must not defeat it.
4. verify: `just gate`.

## Done when
No page carries a literal colour or a magic pixel size, no text character is used as an icon, no page scrolls horizontally at any width, and `just gate` is clean.

## Summary
