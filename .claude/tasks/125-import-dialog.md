---
id: 125
parent:
depends: []
relations: []
title: The import sources dialog closes on Escape, carries its title, and its buttons follow the gothic language
type: task
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [073bb8b535f6677c340af3183ca6ff926217324d]
created_at: 2026-09-06T19:12:49Z
updated_at: 2026-09-06T21:31:06Z
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
`src/components/CharacterSourceImport.svelte`, landed in `073bb8b`: both dialogs are a `BaseDialog` (`Character Sources`, `Import Character Source`) with the same `width` and `zIndex` as `ThemeDialog.svelte` and `FrameDialog.svelte`, so Escape, the backdrop and `#dialog-title` come from the shell; the hand rolled backdrop, header, close button and their handlers are gone. The outer dialog stays hidden while the inner is open, since `BaseDialog` listens on `window` for Escape. Every button is `Button` (import primary with `Glyph sources`, rebuild and export secondary with `Glyph export`, remove danger `sm` with `Glyph close`, done secondary `sm`). The empty state is an `Ornament lancet` niche, each source row an `Ornament rune`; `getFileIcon` and every emoji are gone. The file input sits in a `Field` (`#source-file`) inside a drop region with `role="region"` and an `aria-label`. The per source checkbox stays a checkbox with an `aria-label`, styled from tokens outside a `Field` the way `CampaignStory.svelte` does. The style block is tokens only; `1px` and `640px` are the values `ThemeDialog.svelte` carries.

Source reading in the same file: `pdfjs-dist`, `getFileType`, `extractTextFromPDF`, `fileToBase64`, `processWithReplicate` and the size checks are replaced by `getSource`, `getSourceKind` and `SOURCE_ACCEPT` from `$lib/sources` and `aiService.postClassProgression` from `$lib/ai`, so an image is read to text by `aiService.postImageReading` before the class prompt. These are the modules `src/pages/CharacterCreatePage.svelte`, `CharacterRacePage.svelte` and `CharacterClassPage.svelte` import at `HEAD`. The schema build and export are untouched.

`src/lib/dialogs/sourceImport.ts`: unchanged.

`just check`: 88 files, 0 errors, 0 warnings. `just build`: clean apart from the rolldown chunk size warning for `index` and `sources`, which predates the task.

### Findings

- `src/lib/sources.ts` and `src/lib/catalog.ts` are untracked and `src/lib/ai.ts` (`postPrediction`, `postImageReading`) is modified in the working tree, while `src/pages/CharacterClassPage.svelte`, `CharacterRacePage.svelte` and `CharacterCreatePage.svelte` at `HEAD` (`f5fcdd6`) already import them. The branch, not `073bb8b`, resolves only on the working tree. Committing those files is outside `## Scope` and was not done.
- Reverting the file to its own `pdfjs-dist` and Replicate calls would put a second source reader beside `src/lib/sources.ts`, which CLAUDE.md 2 forbids; not done.
