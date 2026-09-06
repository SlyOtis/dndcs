---
id: 131
parent: 127
depends: [114]
relations: []
title: Every roll button on the sheet is one design drawn from the forged HUD sigil buttons
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-06T19:29:50Z
questions: []
images: []
---

## Intent
The user, on a screenshot of the skills table's Bonus column: these buttons need to be better. Each is a raw `<button class="medieval-button">` in `Skills.svelte`, an olive rounded square holding the bonus, a class shared with `SoundBoard.svelte`. `ActionAttack.svelte` rolls to hit and damage from its own `button-content` and `button-ornament` markup, and `Senses`, `Special`, `MainTabs` and `InventoryTab` carry raw buttons of their own. `components.md`: `Button` is the only button, and `docs/inspiration/README.md` gives `8.png`, the forged HUD's circular sigil buttons, as the reference `Sigil` carries.

## Scope
`src/components/character_sheet/Skills.svelte`, `Senses.svelte`, `Special.svelte`, `main_tabs/MainTabs.svelte`, `main_tabs/InventoryTab.svelte`, `main_tabs/ActionAttack.svelte`. Not `SoundBoard.svelte`, not `src/components/ui/**`. Runs after 114, which owns the tab tables.

## Order
1. dndcs: read `docs/inspiration/8.png` and its README entry before changing anything.
2. dndcs: every control on the sheet that rolls, a skill bonus, a save, a sense, an attack's to hit and damage, is one design, a `Sigil` or a `Button` from the primitives carrying the number as its glyph, with the same hover, focus and pressed reading everywhere; no raw `<button>` and no `medieval-button` remains under `character_sheet/`.
3. dndcs: the number stays legible at the size the skills table grants it and the row height does not grow.
4. verify: `just gate`, then `just dev` on Testy: roll a skill, a save and an attack.

## Done when
`grep -rn "<button" src/components/character_sheet/` returns nothing, every roll control on Testy's sheet has the same outline and tone, a roll from each still posts to the log, and `just gate` is clean.

## Summary
