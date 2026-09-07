---
id: 131
parent: 127
depends: [114]
relations: []
title: Every roll button on the sheet is one design drawn from the forged HUD sigil buttons
type: task
status: testing
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [d0ab00ec951f29253cfee118b3683bbf6f04367b]
created_at: 2026-09-06T19:29:48Z
updated_at: 2026-09-07T10:53:30Z
questions: []
images: []
agent: ab6c8aa47d7e961be
base: a3010bf1ea031c8cb84e76649f96969c97115e9a
---

## Intent
The user, on a screenshot of the skills table's Bonus column: these buttons need to be better. Each is a raw `<button class="medieval-button">` in `Skills.svelte`, an olive rounded square holding the bonus, a class shared with `SoundBoard.svelte`. `ActionAttack.svelte` rolls to hit and damage from its own `button-content` and `button-ornament` markup, and `Senses`, `Special`, `MainTabs` and `InventoryTab` carry raw buttons of their own. `components.md`: `Button` is the only button, and `docs/inspiration/README.md` gives `8.png`, the forged HUD's circular sigil buttons, as the reference `Sigil` carries.

## Scope
`src/components/character_sheet/Skills.svelte`, `src/components/character_sheet/Senses.svelte`, `src/components/character_sheet/Special.svelte`, `src/components/character_sheet/main_tabs/MainTabs.svelte`, `src/components/character_sheet/main_tabs/InventoryTab.svelte`, `src/components/character_sheet/main_tabs/ActionAttack.svelte`. Not SoundBoard.svelte, and no primitive is edited. Runs after 114, which owns the tab tables.


## Goal
`grep -rn "<button" src/components/character_sheet/` returns nothing, every roll control on Testy's sheet has the same outline and tone, a roll from each still posts to the log, and `just gate` is clean.
