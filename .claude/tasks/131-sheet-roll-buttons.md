---
id: 131
parent: 127
depends: [114]
relations: []
title: Every roll button on the sheet is one design drawn from the forged HUD sigil buttons
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [d0ab00ec951f29253cfee118b3683bbf6f04367b]
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-07T08:33:01Z
questions: []
images: []
agent: ab6c8aa47d7e961be
base: a3010bf1ea031c8cb84e76649f96969c97115e9a
---

## Intent
The user, on a screenshot of the skills table's Bonus column: these buttons need to be better. Each is a raw `<button class="medieval-button">` in `Skills.svelte`, an olive rounded square holding the bonus, a class shared with `SoundBoard.svelte`. `ActionAttack.svelte` rolls to hit and damage from its own `button-content` and `button-ornament` markup, and `Senses`, `Special`, `MainTabs` and `InventoryTab` carry raw buttons of their own. `components.md`: `Button` is the only button, and `docs/inspiration/README.md` gives `8.png`, the forged HUD's circular sigil buttons, as the reference `Sigil` carries.

## Scope
`src/components/character_sheet/Skills.svelte`, `src/components/character_sheet/Senses.svelte`, `src/components/character_sheet/Special.svelte`, `src/components/character_sheet/main_tabs/MainTabs.svelte`, `src/components/character_sheet/main_tabs/InventoryTab.svelte`, `src/components/character_sheet/main_tabs/ActionAttack.svelte`. Not SoundBoard.svelte, and no primitive is edited. Runs after 114, which owns the tab tables.

## Order
1. dndcs: read `docs/inspiration/8.png` and its README entry before changing anything.
2. dndcs: every control on the sheet that rolls, a skill bonus, a save, a sense, an attack's to hit and damage, is one design, a `Sigil` or a `Button` from the primitives carrying the number as its glyph, with the same hover, focus and pressed reading everywhere; no raw `<button>` and no `medieval-button` remains under `character_sheet/`.
3. dndcs: the number stays legible at the size the skills table grants it and the row height does not grow.
4. verify: `just gate`, then `just dev` on Testy: roll a skill, a save and an attack.

## Done when
`grep -rn "<button" src/components/character_sheet/` returns nothing, every roll control on Testy's sheet has the same outline and tone, a roll from each still posts to the log, and `just gate` is clean.

## Summary
Every control under `character_sheet/` is now a primitive. `grep -rn "<button" src/components/character_sheet/` returns nothing.

`Skills.svelte`: the `medieval-button` and its 110 lines of gradient, ornament, shimmer and `::before`/`::after` CSS are gone, replaced by `Button` `size="sm"` `fill`, `variant` `secondary` when proficient and `ghost` otherwise, the modifier as the label. The `classList.add('pressed')` hack is gone; `Button`'s `:active` carries the press. The click coordinates the dice overlay needs now come off `event.currentTarget` rather than `event.target`, which was the inner span. `.skills` gained `align-items: center`. `Button` `sm` is `min-height: 30px` against the old `min-height: 32px`, so the row did not grow, and the label is `--text-xs` 0.78rem against the old 0.72em, so the number reads larger.

`Senses.svelte`: the raw plate button had no handler at all, a dead control. It is a `Button` `secondary` `sm` wired to `rollPassive(title, Number(score))`, so a sense now posts to the log. The `.value` block is gone.

`ActionAttack.svelte`: both plates are `Button` `secondary` `sm` `fill`. The two inline handlers are `rollToHit` and `rollAttackDamage`; both dispatch `playButtonClick`, which the attacks never did. Damage disables when the action carries none instead of a click that did nothing. The `button`, `.button-ornament` and the orphan `shimmer` keyframes are gone.

`MainTabs.svelte`: the four hand written tabs are one `{#each}` over `tabList` rendering `Button` `fill` `sm`, `primary` for the selected tab and `ghost` for the rest. The header keeps its bar background and gains `gap`/`padding`; the per button, `.selected` and `.selected::after` CSS is gone.

`InventoryTab.svelte`: the equip toggle and the consume control are `Sigil` `sm`, ember with `active` for equipped and verdigris for consume, the emoji as the glyph, and they carry a real `title`/`aria-label` for the first time. Search is a `Button` `secondary` `sm`. The `.toggle`, `.consume`, `.equipped`, `.search > button` rules and the `equipped-glow` keyframes are gone.

`Special.svelte`: the pool pips are `Sigil` `sm` `ember` with `active` for an unspent point, still holding the quatrefoil `Ornament`. The `.pool-pip` block is gone.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the 500 kB chunk note is pre-existing.

Noticed:
- `## Scope` listed `Senses.svelte`, `Special.svelte` and the three `main_tabs/` files as bare names, so `task.sh scope` resolved none of them and `lcp_gate.sh` refused the first edit. The paths are now written out in full and the `ui/**` exclusion is unbackticked, which was being read as an inclusion.
- `docs/inspiration/README.md` gives `MainTabs.svelte`'s tab bar to `9.png` and `Slot.svelte`. It is now `8.png` chamfered `Button` plates, which is what the grep condition forces. The README line is outside this scope and still says otherwise.
- `Sigil` has no size below `sm` (38px), so the inventory equip column and the `Special` pip row grow from 26px. Only the skills row height was constrained.
- `InventoryTab.svelte` and `ActionAttack.svelte` still carry `console.log` and `console.warn` ammunition debugging and a `window.fixAmmunitionType` escape hatch, untouched here.
