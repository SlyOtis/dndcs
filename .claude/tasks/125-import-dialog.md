---
id: 125
parent:
depends: []
relations: []
title: The import sources dialog closes on Escape, carries its title, and its buttons follow the gothic language
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [073bb8b535f6677c340af3183ca6ff926217324d]
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-07T10:53:29Z
questions: []
base: d32b80c645e6bfe46355798c42feca0d1210fce4
---

## Intent
The user, on a screenshot of the Character Sources dialog: it looks horrible and does not match the design at all. `CharacterSourceImport.svelte` predates the gothic pass and never moved onto the primitives: it draws its own `.backdrop` with `role="dialog"` on the backdrop element and no `#dialog-title`, ignores Escape, uses raw `<button>` elements in orange, green and teal with emoji for icons, a books emoji as the empty state, and a hand rolled inner import dialog. `components.md`: `BaseDialog` is the only dialog shell, `Button` the only button, `Field` wraps every form control.

## Scope
`src/components/CharacterSourceImport.svelte`, `src/lib/dialogs/sourceImport.ts`. Not the source parsing and the structured data build inside it, which keep their behaviour.

## Findings

- `src/lib/sources.ts` and `src/lib/catalog.ts` are untracked and `src/lib/ai.ts` (`postPrediction`, `postImageReading`) is modified in the working tree, while `src/pages/CharacterClassPage.svelte`, `CharacterRacePage.svelte` and `CharacterCreatePage.svelte` at `HEAD` (`f5fcdd6`) already import them. The branch, not `073bb8b`, resolves only on the working tree. Committing those files is outside `## Scope` and was not done.
- Reverting the file to its own `pdfjs-dist` and Replicate calls would put a second source reader beside `src/lib/sources.ts`, which CLAUDE.md 2 forbids; not done.

## Goal
The dialog opens from the bar in the same language as the theme and frame dialogs, closes on Escape, carries `#dialog-title`, contains no emoji, no raw `<button>` and no literal colour, imports a class JSON as before, and `just gate` is clean.
