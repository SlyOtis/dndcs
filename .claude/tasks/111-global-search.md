---
id: 111
parent:
depends: []
relations: [138]
title: Cmd or Ctrl K opens the search dialog on every page and the top bar carries a search button
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [b079e38c30723a95ca6449120036e681cbdb45f9, f8a5d41c710eddf728712b5862a54f48f6f50e93, 02c18b8917c8e4b4a30bbc86c9d672f12ecb4add, fc26e0f6592060d848b3d5deabb3b8d6b5dfc000]
created_at: 2026-09-05T15:41:58Z
updated_at: 2026-09-07T14:01:37Z
questions: []
base: f301e68d9d164beb849903552dcd3fb755b383d3
agent: a35f466f328615425
---

## Intent
Cmd or Ctrl K, and the search dialog it opens, exist only on the character sheet: `initializeGlobalEvents` is called from `CharacterPage`'s `onMount` and `<Search />` is mounted there alone. On `/main`, `/user`, a campaign or a source page the shortcut does nothing and there is no button to open search. Nimpress binds the shortcut once at its app root and its header carries the button; this app does the same.

## Scope
`src/App.svelte`, `src/components/ui/Shell.svelte`, `src/lib/globalEvents.ts`, `src/pages/CharacterPage.svelte`, `src/components/search/Search.svelte`. Not the dialog's command list, which is a later task. Not `src/lib/stores/ui.store.ts`, which already carries `openSearchDialog`, `closeSearchDialog` and `toggleSearchDialog`.


## Goal
On `/main`, `/user`, `/campaign/:id` and `/character/:id`: Cmd K opens the search dialog, Cmd K again or Escape closes it, and the bar button does the same. `just gate` is clean.
