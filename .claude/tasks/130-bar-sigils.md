---
id: 130
parent:
depends: []
relations: [135]
title: Every tool in the bar is one sigil design drawn from the forged HUD reference
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [19d1fd18b57f6f92d8ac4481d597e90188a1f7c5]
created_at: 2026-09-06T19:28:07Z
updated_at: 2026-09-06T22:52:44Z
questions: []
agent: lcp-worker-130
base: c3147a5da0b9ac4d69a391f7a75aafae72df253f
---

## Intent
The user, on a screenshot of the sheet's bar: the five tool buttons read as random, a chamfered plate, a star, a cusped shield, a lobed quatrefoil and a ring side by side, and they need to be the same. `Sigil.svelte` offers `frame` and `tone` as props and every call site picks its own: `CharacterPage` passes plate, star, cusped and lobed for export, level up, import and theme, `Shell` passes cusped for the menu handle, ring for search and lobed for the chat handle. `docs/inspiration/README.md` names the reference for these: `8.png`, the forged HUD, with circular elemental sigil buttons, carried by `Sigil.svelte`.

## Scope
`src/components/ui/Sigil.svelte`, `src/components/ui/Shell.svelte`, the `tools` snippet in `src/pages/CharacterPage.svelte` and `src/pages/MainPage.svelte`. Not the sigils outside the bar: the dialog close, the chat send and the panel create buttons keep their frames until asked.

## Order
1. dndcs: read `docs/inspiration/8.png` and its entry in `docs/inspiration/README.md` before changing anything.
2. dndcs: one frame and one tone for every sigil in the bar, the two drawer handles, search and every page tool, drawn from the forged HUD's circular sigil buttons; the design is decided once in `Sigil` or in the bar and no bar call site passes `frame` or `tone` to make it so.
3. dndcs: the glyph inside is the only thing that differs between two bar tools; hover, focus and pressed read the same on all of them.
4. verify: `just gate`, then `just dev` on the hearth and on Testy's sheet.

## Done when
On the hearth and on the sheet every sigil in the bar has the same outline, rim and tone, no `frame=` or `tone=` is passed from a bar call site, the reference is the forged HUD, and `just gate` is clean.

## Summary
`src/components/ui/Sigil.svelte`: the `ring` trace is now the forged HUD's circular sigil button, a 44 radius circle capped by a diamond point at the top and the bottom, replacing the plain circle. `.dnd-sigil-trace` carries the forged bevel, a one pixel `--metal-edge` top light over a `--shade` drop. The dead `.dnd-sigil-ring` and `.dnd-sigil-face` rules, their `--sigil-edge`, `--sigil-cusp` and `--sigil-point` custom properties and the `.dnd-sigil-active` rule that only fed them are gone; nothing in the markup ever carried those classes. `frame` and `tone` stay as props, defaulted `ring` and `metal`, so the design is decided once in the component.

`src/components/ui/Shell.svelte`: the menu handle drops `frame="cusped"`, search drops `frame="ring"`, the chat handle drops `tone="verdigris"` and `frame="lobed"`.

`src/pages/CharacterPage.svelte`: the four `tools` sigils drop `frame="plate"`, `tone="ember" frame="star"`, `tone="verdigris" frame="cusped"` and `frame="lobed"`. `src/pages/MainPage.svelte`: the theme sigil drops `frame="lobed"`.

Every bar sigil is now `size="sm"` and nothing else, so the `Glyph` inside is the only difference, and hover, focus, pressed and disabled were already on `.dnd-sigil` alone. `just check` is 0 errors 0 warnings over 88 files, `just build` is clean apart from the pre-existing chunk size note.

The sigils outside the bar keep their frames: `BaseDialog` close is `cusped`, `Chat` send is `star`, `CharactersPanel` create is `star` and `CampaignsPanel` create is `plate`. Outside `## Scope`, noted not changed: `Chat.svelte` lines 278 and 287 hold two more sigils whose props were not read for this task.
