---
id: 130
parent:
depends: []
relations: [135]
title: Every tool in the bar is one sigil design drawn from the forged HUD reference
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [19d1fd18b57f6f92d8ac4481d597e90188a1f7c5]
created_at: 2026-09-06T19:28:07Z
updated_at: 2026-09-07T10:53:30Z
questions: []
agent: lcp-worker-130
base: c3147a5da0b9ac4d69a391f7a75aafae72df253f
---

## Intent
The user, on a screenshot of the sheet's bar: the five tool buttons read as random, a chamfered plate, a star, a cusped shield, a lobed quatrefoil and a ring side by side, and they need to be the same. `Sigil.svelte` offers `frame` and `tone` as props and every call site picks its own: `CharacterPage` passes plate, star, cusped and lobed for export, level up, import and theme, `Shell` passes cusped for the menu handle, ring for search and lobed for the chat handle. `docs/inspiration/README.md` names the reference for these: `8.png`, the forged HUD, with circular elemental sigil buttons, carried by `Sigil.svelte`.

## Scope
`src/components/ui/Sigil.svelte`, `src/components/ui/Shell.svelte`, the `tools` snippet in `src/pages/CharacterPage.svelte` and `src/pages/MainPage.svelte`. Not the sigils outside the bar: the dialog close, the chat send and the panel create buttons keep their frames until asked.


## Goal
On the hearth and on the sheet every sigil in the bar has the same outline, rim and tone, no `frame=` or `tone=` is passed from a bar call site, the reference is the forged HUD, and `just gate` is clean.
