---
id: 140
parent: 139
depends: []
relations: []
title: A second reference set is gathered from fantasy UI online and its vocabulary written into the inspiration README
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [26b632a98c8ac029cbf421aac8a1bd05950f4b64]
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-06T21:45:52Z
questions: []
images: []
agent: a6d5fee1901136faa
base: 6961342f8538591e029c4b347f415702218b0fce
---

## Intent
The first reference set, `docs/inspiration/1.png` through `11.png`, gave the language its first vocabulary. The user wants a second round found online: colouring, theming, texture, frames, complete screen layouts, a top bar, type treatment. The README's rule stands: nothing is copied, each image contributes a vocabulary item and names the primitive that carries it. This task runs `/lcp-worker solo`, because it needs `WebSearch` and `WebFetch`, which a worker agent does not hold.

## Scope
`docs/inspiration/` and its `README.md`. No source.

## Order
1. dndcs: search fantasy and dark fantasy game UI online, itch.io, ArtStation, Figma community, Behance, Dribbble and shipped RPG interfaces, for full screens as well as parts: frames with their corner anatomy, panel textures, bars and headers, typographic hierarchy, colour systems across several themes, meters, tabs, dialogs.
2. dndcs: bring twelve to twenty images into `docs/inspiration/` continuing the numbering, each with a README entry in the existing shape: what it contributes, the primitive that carries it, and its source URL and licence, so a reference can be checked and a restricted one dropped.
3. dndcs: write, in the README, the language the set settles: the frame anatomy, corner, rail, boss, keyline and fill, the texture set, the type hierarchy with its roles and ratios, and the palette per theme, each item pointing at the token or primitive that will carry it. This is what 141, 142 and 143 build from.
4. verify: every image in the folder has a README entry and every entry has a source.

## Done when
`docs/inspiration/` holds at least twelve new images, `README.md` carries an entry with source and licence for each and the written language of frames, textures, type and palette, and `git status` shows nothing outside `docs/inspiration/`.

## Summary
`docs/inspiration/12.png` to `30.jpg`, nineteen images: Saintfall and Soulbane screens from Behance, a Behance skill tree, the Figma dark fantasy RPG abilities screen, seven itch.io kit previews, the OpenGameArt RPG GUI kit, a Walters Book of Hours folio and a Solasta and a Baldur's Gate 3 store screenshot. Fetched with curl; ArtStation and Dribbble refuse a script and contributed nothing.

`docs/inspiration/README.md`: an entry per new image with what it contributes, the primitive that carries it, the source URL and the licence; a new `## The language` section with the frame anatomy (keyline, rail, corner in four grades, boss, fill), the texture set including a proposed `--texture-parchment`, the type hierarchy as six roles over the seven `--text-*` steps at a 1.25 ratio, the four palette families and their reading per theme, and the bar as a rail. Web references gained OpenGameArt and Behance.

### Findings
- `gothic-borders.png`, `gothic-elements.png` and `gothic-ui-kit.png` were untracked in the folder with no entry; each now has one, with source marked as not recorded. The user knows where they came from and the three lines want the URL and licence filled in.
- Licences: `28` is CC0, `26` CC-BY 3.0, `17` Figma Community CC BY 4.0, `22` a free single entity licence; the Behance, Steam and paid itch.io images are all rights reserved and are references to look at, never assets.
- The tree carried modifications outside `docs/inspiration/` before this task was taken; none are this task's.
- Docs only, nothing to build or lint.
