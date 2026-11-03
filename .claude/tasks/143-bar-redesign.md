---
id: 143
parent: 139
depends: [140, 130]
relations: []
title: The top bar is redesigned whole from the second reference set
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-08T09:39:38Z
questions: []
images: []
scope: [src/components/ui/Shell.svelte, src/app.css]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user: the top bar needs to be redesigned completely. `Shell.svelte` draws a 68px bar holding the menu handle, back, title, the page's nav and tools, search, the profile chip and the chat handle, on a gradient with a hairline under it. It reads as a toolbar, not as part of the fantasy screen, and it is the one element on every page.

## Scope
`src/components/ui/Shell.svelte`, the bar and its handles; the `tools` snippet contract stays so no page changes. Not `Sigil.svelte`, which 130 unifies. Runs after 130 and 140.


## Goal
The bar on every page matches the reference the README names, no page changed to keep working, no pixel literal remains in the bar's styles, and `just gate` is clean.
