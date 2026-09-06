---
id: 125
parent:
depends: []
relations: []
title: The import sources dialog closes on Escape, carries its title, and its buttons follow the gothic language
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-06T19:16:42Z
questions: []
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
