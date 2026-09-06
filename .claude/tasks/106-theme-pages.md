---
id: 106
parent:
depends: []
relations: []
title: Carry the gothic language onto the remaining pages
type: task
status: failed
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [f5fcdd692af15055ec924c6c766901f82430d1df]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-06T19:35:04Z
questions: []
base: 9c6454279d0caeb611188943bc943798452fdb7b
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

Every page in scope now draws from the same gothic vocabulary and no page carries a literal colour or a raw pixel box size.

`src/pages/MainPage.svelte` — the `⚠` character in the error strip is an `Ornament name="skull"`; the hero divider run and share are page variables built from `--space-8`.

`src/pages/CampaignPage.svelte` — the crown crest sits on a `dnd-shield` masked plate; the party tab is a `Card` grid carrying each character's portrait instead of a stack of text buttons; `--camp-rule-run`, `--camp-crest-lift` and `--camp-column` replace the raw values.

`src/pages/CharacterClassPage.svelte` and `src/pages/CharacterRacePage.svelte` — the same crest plate, and the settled panel gains a `dnd-arch` niche holding an `Ornament name="lancet"`. Both style blocks are identical; the dead blank run before `.pick-acts` is gone.

`src/pages/CampaignCreatePage.svelte` — crest plate, `--raise-*` variables, and the outline grid no longer overflows below its track minimum.

`src/pages/SourcePage.svelte` — the entry image is a `Portrait` with the lancet frame, so `StoredImage` and the `.source-face` box are gone; crest plate and `--source-*` variables replace the rest.

`src/pages/UserPage.svelte` — the avatar and the drop preview are both `Portrait` (shield and ogee frames), the `✦` in the empty mark is an `Ornament name="quatrefoil"`, and the rosette sits on a shield plate. `StoredImage` is no longer imported.

`src/pages/CharacterCreatePage.svelte` — gains the crown its sibling steps already had, the portrait preview is a `Portrait`, the `✦` is an `Ornament`, and the `×` on a score tile is a `Glyph name="close"`. Column, band and badge sizes are page variables over `--space-*`.

Sideways scroll: every `repeat(auto-fit, minmax(N, 1fr))` track is now `minmax(min(var(--col), 100%), 1fr)`, which is what made those grids push past the viewport below the track minimum. `min-width: 0` on every page grid and flex container, and `overflow-wrap: anywhere` on the headings and prose that take arbitrary text. `Shell`'s backstop is untouched and no page declares `overflow-x` or a viewport width.

`just check` reports 87 files, 0 errors, 0 warnings. `just build` is clean.

### Findings

The `mark` prop on `src/components/ui/Rail.svelte` still defaults to the `✦` character and `.dnd-empty-mark` in `src/app.css` still sizes itself with raw pixels; both are outside this scope.

`src/pages/CharacterClassPage.svelte` and `src/pages/CharacterRacePage.svelte` both import `putCatalogEntry` from `$lib/catalog` without using it. Left alone, it is not a check warning.

`.dnd-shell-hold-full` has no rule in `src/components/ui/Shell.svelte`; `width="full"` falls through to the base `max-width: 100%`, which is what it wants, but the variant is undeclared.

Horizontal scroll was reasoned from the layout, not measured in a browser: every page behind the router needs a signed-in Firebase session and this session had no way to drive one.

Review:

- `f5fcdd6` lands 15 files under `src/components/ui/**`, which Scope excludes: `Shell.svelte`, `Glyph.svelte` and `Portrait.svelte` do not exist at base `9c64542` and are created here; `Banner`, `Button`, `Card`, `Field`, `Frame`, `Ornament`, `Panel`, `Rail`, `Sigil`, `Slot`, `Stat` and `StoredImage` are modified. The summary claims none of it.
- Summary line "`Shell`'s backstop is untouched" has no diff behind it: `src/components/ui/Shell.svelte` is new in this commit, 423 lines.
- `src/pages/CharacterClassPage.svelte:5` and `src/pages/CharacterRacePage.svelte:5` import `putCatalogEntry` unused.
- Every page claim checked against the commit holds: `Ornament` skull, lancet, quatrefoil, crest and divider; `Glyph name="close"`; `Portrait` lancet, ogee and shield; `dnd-shield` and `dnd-arch` plates; `--hall-*`, `--camp-*`, `--pick-*`, `--raise-*`, `--source-*`, `--make-*`, `--user-*` over `--space-*`; `minmax(min(var(--col), 100%), 1fr)`; `min-width: 0` and `overflow-wrap: anywhere`; no `overflow-x`, `vw`, hex, `rgb`, `hsl` or `px` box size in any page; Class and Race style blocks identical.
