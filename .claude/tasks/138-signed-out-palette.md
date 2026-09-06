---
id: 138
parent:
depends: [111]
relations: [111]
title: The command palette stays closed on the sign in and sign up pages
type: bug
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T20:12:27Z
updated_at: 2026-09-06T20:13:44Z
questions: []
images: []
---

## Intent
The 110 walk: `/login` and `/signup` carry no search button, since neither renders inside `Shell`, yet Cmd K opens the command palette signed out with signed in commands on it. 111 mounted `Search` and the window keydown at the root in `App.svelte`, and `globalEvents.ts` gates the shortcut on `anyDialogOpen` and on the focused field but not on the session.

## Scope
`src/App.svelte`, `src/lib/globalEvents.ts`, `src/components/search/Search.svelte`. Runs after 111, which owns the same wiring.

## Order
1. dndcs: the search shortcut and the palette do nothing while `isAuthenticated` is false; the undo, redo and chat shortcuts follow the same gate since none has a meaning signed out.
2. dndcs: signing in and then pressing Cmd K opens the palette without a reload.
3. verify: `just gate`, then `just dev` on `/login`: Cmd K, then sign in, then Cmd K.

## Done when
Cmd K on `/login` and `/signup` opens nothing, Cmd K after sign in opens the palette, and `just gate` is clean.

## Summary
