---
id: 125
parent:
depends: []
relations: []
title: The import sources dialog closes on Escape, carries its title, and its buttons follow the gothic language
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [073bb8b535f6677c340af3183ca6ff926217324d]
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-06T19:21:04Z
questions: []
base: d32b80c645e6bfe46355798c42feca0d1210fce4
---

## Intent
The user, on a screenshot of the Character Sources dialog: it looks horrible and does not match the design at all. `CharacterSourceImport.svelte` predates the gothic pass and never moved onto the primitives: it draws its own `.backdrop` with `role="dialog"` on the backdrop element and no `#dialog-title`, ignores Escape, uses raw `<button>` elements in orange, green and teal with emoji for icons, a books emoji as the empty state, and a hand rolled inner import dialog. `components.md`: `BaseDialog` is the only dialog shell, `Button` the only button, `Field` wraps every form control.

## Scope
`src/components/CharacterSourceImport.svelte`, `src/lib/dialogs/sourceImport.ts`. Not the source parsing and the structured data build inside it, which keep their behaviour.

## Order
1. dndcs: read `docs/inspiration/README.md` and the three gothic sheets before changing anything.
2. dndcs: the outer sources dialog and the inner import dialog are each a `BaseDialog`, titled, closing on Escape and on the backdrop, the way `ThemeDialog.svelte` and `FrameDialog.svelte` are.
3. dndcs: every button is `Button`, every icon a `Glyph` or an `Ornament`, every input a `Field`, the empty state an `Ornament` niche rather than an emoji, and no literal colour or fixed pixel size remains; the copy stays.
4. verify: `just gate`, then `just dev`, open the dialog from the bar and import a class JSON.

## Done when
The dialog opens from the bar in the same language as the theme and frame dialogs, closes on Escape, carries `#dialog-title`, contains no emoji, no raw `<button>` and no literal colour, imports a class JSON as before, and `just gate` is clean.

## Summary
`src/components/CharacterSourceImport.svelte`: both dialogs are a `BaseDialog` (`Character Sources`, `Import Character Source`), so Escape, the backdrop and `#dialog-title` come from the shell; the hand rolled backdrop, header, close button and their key and click handlers are gone. The outer dialog stays hidden while the inner is open, as before, since `BaseDialog` listens on `window` for Escape. Every button is `Button` (import primary with `Glyph sources`, rebuild and export secondary with `Glyph export`, remove danger `sm` with `Glyph close`, done secondary `sm`). The empty state is an `Ornament lancet` niche. Each source row carries an `Ornament rune`; `getFileIcon` and every emoji are gone. The file input sits in a `Field` (`#source-file`) inside a drop region with `role="region"` and an `aria-label`. The per source checkbox stays a checkbox with an `aria-label`, styled from tokens, outside a `Field` the way `CampaignStory.svelte` does it, since `Field` stretches its input to full width. The style block is tokens only; the two `1px` and `640px` values are the same ones `ThemeDialog.svelte` carries. Source parsing, the schema build and export are untouched.

`src/lib/dialogs/sourceImport.ts`: unchanged; nothing in the dialog conversion reached it.

### Findings

`just build` prints the rolldown chunk size warning for `index` and `sources`, which this change does not touch.
