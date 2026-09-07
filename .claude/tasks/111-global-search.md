---
id: 111
parent:
depends: []
relations: [138]
title: Cmd or Ctrl K opens the search dialog on every page and the top bar carries a search button
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [b079e38c30723a95ca6449120036e681cbdb45f9, f8a5d41c710eddf728712b5862a54f48f6f50e93, 02c18b8917c8e4b4a30bbc86c9d672f12ecb4add]
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-07T08:42:27Z
questions: []
base: f301e68d9d164beb849903552dcd3fb755b383d3
agent: a35f466f328615425
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
`src/lib/globalEvents.ts` drops the `GlobalEventContext` and `initializeGlobalEvents` indirection and exports `handleGlobalKeydown` directly. It reads `uiStore` and `sidebarStore` with `get`, so no caller passes snapshots. Cmd or Ctrl K is matched first, before the dialog and input-field guards, and calls `uiStore.toggleSearchDialog`, so a second press closes the dialog and the press lands from inside the focused search input. Escape checks `isSearchDialogOpen` before the input-field guard, so it closes the dialog while the input holds focus. The chat shortcut toggles `sidebarStore` itself instead of the no-op `toggleChat` `CharacterPage` was passing. Undo and redo are unchanged apart from `event.key.toLowerCase()`, which makes the Cmd Shift Z redo path match.

`src/App.svelte` mounts `<Search />` beside `<EffectDefs />` and binds `<svelte:window onkeydown={handleGlobalKeydown} />`, so both live once at the root and reach every routed page. The comment over `page()` at line 17 is gone; `code.md` forbids comments.

`src/pages/CharacterPage.svelte` loses the `Search` import and mount, the `initializeGlobalEvents` import and call, the `onMount` cleanup return and the now unused `isSearchDialogOpen` import. Its `dialogState` context and `Dialogs` mount are untouched.

`src/components/ui/Shell.svelte` carries a `Sigil` holding `Glyph name="search"` between the `tools` snippet and `dnd-shell-split`, calling `uiStore.toggleSearchDialog`. `dnd-shell-split` is now unconditional because the search sigil is always drawn; it was previously tied to `tools`. `searchKey` reads `navigator.userAgent` for `Cmd K` or `Ctrl K` and the title is `Search {searchKey}`.

`src/components/search/Search.svelte` loses the six comments over `isOpen`, the `commands` list, the `executeCommand` close, and the three `$effect` blocks; `components.md` allows no comment in a component.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the only note is the pre-existing 500 kB chunk-size advisory.

Outside this task, in the same files and not this task's work: `requireSignIn` and the `page()` loader wrapper in `src/App.svelte:14-29`, the `svelte:boundary`, `failed` snippet, loading snippet and `NotFoundPage` fallback at `src/App.svelte:124-149`, the `Shell`, `Portrait` and frame-picker rewrite of `src/pages/CharacterPage.svelte`, and the `Field`, `Ornament` and `rite` rebuild of the dialog markup in `src/components/search/Search.svelte`. Commit `b079e38` and base `f301e68` no longer exist: the branch was squashed by hand into `f247649 Local work in progress`, which carries all of it, so the unclaimed hunks can no longer be separated from the claimed ones.

`Search` mounted at the root no longer sits under a page's `dialogState` context, so opening it no longer sets `anyDialogOpen`. `BaseDialog` already guards `dialogContext` for undefined, so no page throws.

`src/components/search/Search.svelte` still holds a hardcoded sample command list whose shortcuts read `Ctrl+K`, `Ctrl+L`, `Ctrl+Z`, `Ctrl+Y` regardless of platform. Out of scope, it is the later command-list task.

`src/lib/navigation.ts` exports `createDialogState`, which nothing calls now that `uiStore` owns dialog state.

The four `ReplicateLogItem | RollLogItem` narrowing errors `test/111/20260906T230057Z-just-gate.md` recorded were in `src/lib/chat.spec.ts`, which task 103 owns and this scope does not name. They are gone from the tree: `just check` at head is 88 files, 0 errors, 0 warnings.
