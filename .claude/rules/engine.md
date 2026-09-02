---
description: How a character is defined, layered and calculated, and how a component reaches the result
paths:
  - "src/lib/rules/**"
  - "public/sources/systems/**"
  - "src/components/character_sheet/**"
---

## The spec

A rule system is a JSON document under `public/sources/systems/`. It declares `attributes`, `proficiencyTiers`, `skills`, `saves`, `senses`, `pools`, `derived`, `progression` and `panels`. `src/lib/rules/spec.types.ts` is the shape.

Nothing about 5e is hard coded in a component. A character is data plus the systems it declares.

## The formula language

Every number is an expression evaluated by `src/lib/rules/expression.ts` against a flat scope of numbers. Arithmetic, comparisons, ternaries, and `floor`, `ceil`, `round`, `abs`, `sign`, `min`, `max`, `clamp`, `pow`. No `eval`, no code in a system file.

Scope names are `level`, `prof`, `attr.<id>`, `mod.<id>`, `skill.<id>`, `save.<id>`, `sense.<id>`, `pool.<id>.max`, `derived.<id>`, `bonus.<id>` and `step.<key>`. A missing `bonus.` or `step.` name is zero, so an optional input never breaks a system.

A skill or save with no `modifier` of its own uses `mod.<attribute> + prof * tier`, where `tier` is the multiplier of the character's proficiency tier for that entry.

## Layering

`extends` names the systems a document sits on. `getMergedSystem` merges by `id`, so an overlay that redefines `armorClass` replaces it rather than adding a second one. `getSystemStack` applies a list left to right, then a character's own overlay last.

A character can therefore add an attribute, a skill or a point pool nobody else has, and `dnd5e` stays untouched for everyone else.

## Resolving

`getResolvedCharacter` builds a node per computed value and resolves each on demand, so declaration order does not matter. A loop throws `RuleCycleError` rather than hanging. An attribute is clamped to its declared range and the level to `progression.maxLevel`.

## The bridge

`src/lib/rules/sheet.ts` maps the stored `Character` onto the engine input. `getAttributeId` and `getSkillId` turn display titles into system ids, so a display name never reaches a formula. It resolves once to learn the modifiers, then recovers the armour, hit point, initiative and speed bonuses from the stored totals, so nothing double counts.

## Reaching it from a component

`CharacterPage` provides `getRulesStore(chStore)` on the `rules` context. A component reads `$rules.resolved` and takes the value from `attributes`, `skills`, `saves`, `senses`, `pools` or `derived`, falling back to the stored number while the system loads.

`RulePanels` draws every panel the bespoke layout does not. A system that adds a pool or a derived value appears on the sheet with no code change, so never author a component for one.

## Adding a system

A JSON file plus a case in `src/lib/rules/derive.spec.ts`. Never a branch in a component.
