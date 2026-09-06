---
id: 143
parent: 139
depends: [140, 130]
relations: []
title: The top bar is redesigned whole from the second reference set
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-06T21:24:27Z
questions: []
images: []
---

## Intent
The user: the top bar needs to be redesigned completely. `Shell.svelte` draws a 68px bar holding the menu handle, back, title, the page's nav and tools, search, the profile chip and the chat handle, on a gradient with a hairline under it. It reads as a toolbar, not as part of the fantasy screen, and it is the one element on every page.

## Scope
`src/components/ui/Shell.svelte`, the bar and its handles; the `tools` snippet contract stays so no page changes. Not `Sigil.svelte`, which 130 unifies. Runs after 130 and 140.

## Order
1. dndcs: read the bars and headers 140 wrote into `docs/inspiration/README.md` and the images it cites before changing anything.
2. dndcs: the bar redesigned whole from that reference: its ground, frame, crest, the seat of the title, the placement and grouping of handles, tools, search and profile, at a height that is a token and not a pixel literal, in every theme.
3. dndcs: every page still renders its nav and tools through the same snippets and the drawers still open from the same handles.
4. verify: `just gate`, then `just dev` on the hearth, the sheet and a campaign under each theme, drawers open and closed.

## Done when
The bar on every page matches the reference the README names, no page changed to keep working, no pixel literal remains in the bar's styles, and `just gate` is clean.

## Summary
