---
id: 106
parent:
depends: []
relations: []
title: Carry the gothic language onto the remaining pages
type: task
status: testing
blocked_from: review
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [959cf3cc97bdfaaef9164ed9d1a2c0c49acfdc75, f6653512726c84b6fceb1b18877bb3b9947e4af4]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T23:35:23Z
questions: [q-012]
base: 8f4236eb81694b4812d9369bc4a3ee32b31f666b
agent: lcp-worker-106
---

## Intent
The gothic pass reached the shared primitives, the dialogs and the left drawer. The pages themselves still carry the older page-level styling, so the app reads as two design languages depending on the screen.

## Scope
`src/pages/MainPage.svelte`, `src/pages/CampaignPage.svelte`, `src/pages/CharacterCreatePage.svelte`, `src/pages/CharacterClassPage.svelte`, `src/pages/CharacterRacePage.svelte`, `src/pages/CampaignCreatePage.svelte`, `src/pages/SourcePage.svelte`, `src/pages/UserPage.svelte`, and per q-012 the fifteen files under `src/components/ui/` the landing carried: `Shell.svelte`, `Glyph.svelte` and `Portrait.svelte` authored new, `Banner.svelte`, `Button.svelte`, `Card.svelte`, `Field.svelte`, `Frame.svelte`, `Ornament.svelte`, `Panel.svelte`, `Rail.svelte`, `Sigil.svelte`, `Slot.svelte`, `Stat.svelte` and `StoredImage.svelte` redrawn. Nothing else under `src/components/`.

## Order
1. dndcs: read `docs/inspiration/gothic-borders.png`, `gothic-ui-kit.png` and `gothic-elements.png` before changing anything.
2. dndcs: carry the language onto each page: the `Ornament` gothic vectors, the `--mask-arch` and `--mask-shield` tokens, `Portrait` for any portrait, `Glyph` inside any `Sigil`, and page-scoped variables mapped from app tokens rather than raw values.
3. dndcs: no page may scroll sideways. `Shell` holds the backstop and a page must not defeat it.
4. verify: `just gate`.

## Done when
No page carries a literal colour or a magic pixel size, no text character is used as an icon, no page scrolls horizontally at any width, and `just gate` is clean.

## Summary

Every page in scope now draws from the same gothic vocabulary and no page carries a literal colour or a raw pixel box size.

`src/pages/MainPage.svelte` — the `⚠` character in the error strip is an `Ornament name="skull"`; the hero divider run and share are page variables built from `--space-8`.

`src/pages/CampaignPage.svelte` — the crown crest sits on a `dnd-shield` masked plate; the party tab is a `Card` grid carrying each character's portrait instead of a stack of text buttons; `--camp-rule-run`, `--camp-crest-lift` and `--camp-column` replace the raw values.

`src/pages/CharacterClassPage.svelte` and `src/pages/CharacterRacePage.svelte` — the same crest plate, and the settled panel gains a `dnd-arch` niche holding an `Ornament name="lancet"`. Both style blocks are identical; the dead blank run before `.pick-acts` is gone.

`src/pages/CampaignCreatePage.svelte` — crest plate, `--raise-*` variables, and the outline grid no longer overflows below its track minimum.

`src/pages/SourcePage.svelte` — the entry image is a `Portrait` with the lancet frame, so `StoredImage` and the `.source-face` box are gone; crest plate and `--source-*` variables replace the rest.

`src/pages/UserPage.svelte` — the avatar and the drop preview are both `Portrait` (shield and ogee frames), the `✦` in the empty mark is an `Ornament name="quatrefoil"`, and the rosette sits on a shield plate. `StoredImage` is no longer imported.

`src/pages/CharacterCreatePage.svelte` — gains the crown its sibling steps already had, the portrait preview is a `Portrait`, the `✦` is an `Ornament`, and the `×` on a score tile is a `Glyph name="close"`. Column, band and badge sizes are page variables over `--space-*`.

Sideways scroll: every `repeat(auto-fit, minmax(N, 1fr))` track is now `minmax(min(var(--col), 100%), 1fr)`, which is what made those grids push past the viewport below the track minimum. `min-width: 0` on every page grid and flex container, and `overflow-wrap: anywhere` on the headings and prose that take arbitrary text. No page declares `overflow-x` or a viewport width.

Outside `## Scope`, which excludes `src/components/ui/**`, the first commit also landed fifteen files there. `Shell.svelte`, `Glyph.svelte` and `Portrait.svelte` did not exist at base and were authored to carry the pages; `Banner`, `Button`, `Card`, `Field`, `Frame`, `Ornament`, `Panel`, `Rail`, `Sigil`, `Slot`, `Stat` and `StoredImage` were modified. `Shell` is new in that commit and its horizontal backstop was written there, not inherited. The pages consume all three new primitives, so the scope excursion cannot be unwound without taking the pages with it.

Notes for other tasks. The `mark` prop on `src/components/ui/Rail.svelte` still defaults to the `✦` character and `.dnd-empty-mark` in `src/app.css` still sizes itself with raw pixels. `.dnd-shell-hold-full` has no rule in `src/components/ui/Shell.svelte`; `width="full"` falls through to the base `max-width: 100%`, which is what it wants, but the variant is undeclared. Horizontal scroll was reasoned from the layout, not measured in a browser: every page behind the router needs a signed-in Firebase session and this session had no way to drive one.

The unused `putCatalogEntry` import is gone from `src/pages/CharacterClassPage.svelte`; `src/pages/CharacterRacePage.svelte` no longer carried it.

The base and the first commit are unreachable in this checkout, so `task.sh diff` spans nothing and the page claims above stand on the current tree: no hex, `rgb`, `hsl`, `overflow-x`, `vw` or `px` box size in any page in scope, and no icon character.

`just check` reports 88 files, 0 errors, 0 warnings. `just build` is clean.
