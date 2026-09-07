---
id: 138
parent:
depends: [111]
relations: [111]
title: The command palette stays closed on the sign in and sign up pages
type: bug
status: doing
session: 8dec51df-8b9f-47a4-9877-00e448df3116
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T20:12:27Z
updated_at: 2026-09-07T15:00:30Z
questions: []
images: []
base: 4997cd6df25b515bb0ee0f16b0f3dea9a09e21ae
---

## Intent
The 110 walk: `/login` and `/signup` carry no search button, since neither renders inside `Shell`, yet Cmd K opens the command palette signed out with signed in commands on it. 111 mounted `Search` and the window keydown at the root in `App.svelte`, and `globalEvents.ts` gates the shortcut on `anyDialogOpen` and on the focused field but not on the session.

## Scope
`src/App.svelte`, `src/lib/globalEvents.ts`, `src/components/search/Search.svelte`. Runs after 111, which owns the same wiring.


## Goal
Cmd K on `/login` and `/signup` opens nothing, Cmd K after sign in opens the palette, and `just gate` is clean.
