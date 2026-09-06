---
id: 111
parent:
depends: []
relations: [138]
title: Cmd or Ctrl K opens the search dialog on every page and the top bar carries a search button
type: task
status: failed
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [b079e38c30723a95ca6449120036e681cbdb45f9]
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-06T20:12:27Z
questions: []
base: f301e68d9d164beb849903552dcd3fb755b383d3
---

## Intent
Cmd or Ctrl K, and the search dialog it opens, exist only on the character sheet: `initializeGlobalEvents` is called from `CharacterPage`'s `onMount` and `<Search />` is mounted there alone. On `/main`, `/user`, a campaign or a source page the shortcut does nothing and there is no button to open search. Nimpress binds the shortcut once at its app root and its header carries the button; this app does the same.

## Scope
`src/App.svelte`, `src/components/ui/Shell.svelte`, `src/lib/globalEvents.ts`, `src/pages/CharacterPage.svelte`, `src/components/search/Search.svelte`. Not the dialog's command list, which is a later task. Not `src/lib/stores/ui.store.ts`, which already carries `openSearchDialog`, `closeSearchDialog` and `toggleSearchDialog`.

## Order
1. dndcs: mount `Search` and the global keydown once at the root in `src/App.svelte`, the way `/Users/slyotis/Projects/nimtech/nimpress/src/layout/App.svelte` binds `onKey` on `svelte:window`, so every routed page has it. Take the mount and the `initializeGlobalEvents` call out of `CharacterPage`; undo, redo and the chat shortcut move with them and keep working on the sheet.
2. dndcs: the shortcut toggles, so a second press closes the dialog. Escape closes it as it does now.
3. dndcs: a search `Sigil` holding `Glyph name="search"` in the `Shell` bar, between `tools` and the split, on every page, calling `uiStore.toggleSearchDialog`. Its title names the shortcut.
4. verify: `just gate`.

## Done when
On `/main`, `/user`, `/campaign/:id` and `/character/:id`: Cmd K opens the search dialog, Cmd K again or Escape closes it, and the bar button does the same. `just gate` is clean.

## Summary
Empty on the board: the worker wrote its summary to the literal path `.claude/tasks/111-*.md`, which is untracked.

### Findings
1. `.claude/tasks/111-global-search.md` `## Summary` is empty; the summary sits in `.claude/tasks/111-*.md`. Move it here, then `rm '/Users/slyotis/Projects/slytech/dndcs/.claude/tasks/111-*.md'`.
2. `src/App.svelte:14-31` `requireSignIn` route guards and the `page()` loader wrapper are neither in the task nor in the summary.
3. `src/App.svelte:17` a comment; `code.md` forbids comments.
4. `src/App.svelte:125-149` `svelte:boundary`, the failed snippet, the loading snippet and the `NotFoundPage` fallback are unclaimed; `src/pages/NotFoundPage.svelte` is not in commit b079e38, so the commit does not build from a clean checkout.
5. `src/pages/CharacterPage.svelte:95-190` the page is rewritten onto `Shell`, `Portrait` and a frame picker; the summary claims only the `Search` mount and `initializeGlobalEvents` were removed. `$info.imageFrame` at 127 and 144 is not on the character type at b079e38.
6. `src/components/search/Search.svelte:93-127` the dialog markup is rebuilt on `Field`, `Ornament` and `rite` classes with new styles; unclaimed and outside the task.
7. Commit b079e38 lands other tasks' in-progress edits in the scope files: 538 insertions where the claim covers `globalEvents.ts`, the `Search` mount in `App.svelte`, the `Shell` sigil and the `CharacterPage` removals. Land only the claimed hunks.
