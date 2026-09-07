---
id: 107
parent:
depends: []
relations: [108, 109]
title: Author level features for the thirteen core classes
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [engine]
commits: [1031c428f1d4ed52cf88518710643b3dc39ffd8e]
created_at: 2026-09-05T15:10:52Z
updated_at: 2026-09-07T10:53:25Z
questions: []
base: 9c6454279d0caeb611188943bc943798452fdb7b
---

## Intent
The thirteen core classes were authored with identity, hit die, primary ability, saving throws and prose, and `features: []`. The detail page at `/sources/classes/:id` groups features into a panel per level and says plainly that nothing is written down. Gunslinger is the worked example of a full document.

## Scope
`public/sources/classes/artificer.json`, `public/sources/classes/barbarian.json`, `public/sources/classes/bard.json`, `public/sources/classes/cleric.json`, `public/sources/classes/druid.json`, `public/sources/classes/fighter.json`, `public/sources/classes/monk.json`, `public/sources/classes/paladin.json`, `public/sources/classes/ranger.json`, `public/sources/classes/rogue.json`, `public/sources/classes/sorcerer.json`, `public/sources/classes/warlock.json`, `public/sources/classes/wizard.json`, `public/sources/classes/index.json`. Not `gunslinger.json`. No source, no component.
## Findings

`public/sources/classes/index.json` was untracked in git, so the thirteen class documents had no committed index listing them. It is unchanged in content and landed with this task, which is why it is named in `## Scope`.

`## Scope` read `public/sources/classes/*.json` except `gunslinger.json`. `scope_of` in `task.sh` resolves a glob to the directory, so `land` would have swept the uncommitted `gunslinger.json` edit another session left in the tree. The section now names the fourteen paths one by one and the exclusion holds.

`gunslinger.json` carries uncommitted changes from another session and was left alone.

`just build` warns that two chunks exceed 500 kB. It is pre-existing and unrelated: these documents are static assets under `public/` and are never bundled.

## Goal
No core class carries an empty `features` array, and `/sources/classes/:id` shows features grouped by level for each.
