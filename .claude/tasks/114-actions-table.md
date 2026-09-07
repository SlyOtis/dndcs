---
id: 114
parent: 112
depends: [113]
relations: []
title: The actions and inventory tables fit their columns at every width
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [165841af5ccbeebc99d4b995983206d940b1834c]
created_at: 2026-09-05T15:41:59Z
updated_at: 2026-09-07T10:53:27Z
questions: []
agent: lcp-worker-114
base: 57d079d606f529c9a96735f1b3ac30b67751201e
---

## Intent
The actions list in `ActionsTab.svelte` lays a row out on `grid-template-columns: auto auto auto auto 1fr`. With Testy's Hand Cannon Attack the name wraps over three lines, the header's last column is cut to a single letter, and the No ammo badge sits over the range cell instead of in its own.

## Scope
`src/components/character_sheet/main_tabs/ActionsTab.svelte`, `src/components/character_sheet/main_tabs/ActionAttack.svelte`, `src/components/character_sheet/main_tabs/ActionSpecial.svelte`, `src/components/character_sheet/main_tabs/InventoryTab.svelte`, `src/components/character_sheet/main_tabs/MainTabs.svelte`. Not the character page.

## Findings
`## Scope` named four of its five files by bare filename, so `task.sh scope` parsed only `ActionsTab.svelte`, and it parsed `src/pages/CharacterPage.svelte` out of the sentence that forbids it, granting the worker the one file the task excludes. The five names are unchanged, written as full paths, and the exclusion now reads "Not the character page."

`ActionSpecial.svelte` and `MainTabs.svelte` are in `## Scope` and were not touched. A special action is a flex column of a heading and a paragraph, not a table, and nothing there clips. `MainTabs.svelte` `.content` carries `max-height: 540px`, a literal that owns the tab panel's height and is unrelated to column fit.

`just build` runs `rm -rf node_modules/.vite`, which strands a dev server that is already running on stale optimised dep hashes: the one on 5173 answers 504 for every dep and cannot recover without a restart. The measurement above ran against `just preview` on 4173 instead.

## Goal
On Testy no action or inventory name occupies more than one line, every column header reads in full, no badge overlaps a cell, and `just gate` is clean.
