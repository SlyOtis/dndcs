---
id: 139
parent:
depends: [140, 141, 142, 143]
relations: []
title: A second design round: the fantasy UI language is researched again and carried through tokens, type, frames and the bar
type: epic
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
updated_at: 2026-09-08T09:39:52Z
questions: []
images: []
agent: lcp-worker-139
scope: [src/app.css]
base: b56157768c1dd382cdf366edde993b9455cb12e6
---

## Intent
The user, after the first gothic pass and the 110 walk: the panel frames are broken in many places, text size is not handled and does not follow the theme, the top bar needs a complete redesign, and everything looks weird. Colouring, theming, texture, frames, design and completeness all need to be far better, starting with a new round of fantasy UI inspiration found online. The first round produced eleven images and the vocabulary in `docs/inspiration/README.md`; the primitives under `src/components/ui/` carry it unevenly, `Frame.svelte` alone holds thirty four pixel literals, and `src/app.css` declares five `--text-*` steps and three `--font-*` faces that the components mostly bypass with their own `rem` sizes.

## Scope
`docs/inspiration/`, `src/app.css`, `src/components/ui/**`. The pages and the sheet follow through 127 and its subs, which now depend on this round.


## Goal
140, 141, 142 and 143 are done.
