---
id: 140
parent: 139
depends: []
relations: []
title: A second reference set is gathered from fantasy UI online and its vocabulary written into the inspiration README
type: task
status: blocked
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [f530d570c701e4da712522fcb0964ae036794d4c, a00ec987b47c393a5e111fa9143521d61be28236]
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-06T23:07:26Z
questions: [q-013]
images: []
agent: ad0522f10348db90a
base: a0d7a52d59080641cb36267c7df4899abc54abbe
---

## Intent
The first reference set, `docs/inspiration/1.png` through `11.png`, gave the language its first vocabulary. The user wants a second round found online: colouring, theming, texture, frames, complete screen layouts, a top bar, type treatment. The README's rule stands: nothing is copied, each image contributes a vocabulary item and names the primitive that carries it. This task runs `/lcp-worker solo`, because it needs `WebSearch` and `WebFetch`, which a worker agent does not hold.

## Scope
`docs/inspiration` and its `README.md`. No source.

## Order
1. dndcs: search fantasy and dark fantasy game UI online, itch.io, ArtStation, Figma community, Behance, Dribbble and shipped RPG interfaces, for full screens as well as parts: frames with their corner anatomy, panel textures, bars and headers, typographic hierarchy, colour systems across several themes, meters, tabs, dialogs.
2. dndcs: bring twelve to twenty images into `docs/inspiration/` continuing the numbering, each with a README entry in the existing shape: what it contributes, the primitive that carries it, and its source URL and licence, so a reference can be checked and a restricted one dropped.
3. dndcs: write, in the README, the language the set settles: the frame anatomy, corner, rail, boss, keyline and fill, the texture set, the type hierarchy with its roles and ratios, and the palette per theme, each item pointing at the token or primitive that will carry it. This is what 141, 142 and 143 build from.
4. verify: every image in the folder has a README entry and every entry has a source.

## Done when
`docs/inspiration/` holds at least twelve new images, `README.md` carries an entry with source and licence for each and the written language of frames, textures, type and palette, and `git status` shows nothing outside `docs/inspiration/`.

## Summary
`docs/inspiration/12.png` to `30.jpg`, nineteen images: Saintfall and Soulbane screens from Behance, a Behance skill tree, the Figma dark fantasy RPG abilities screen, seven itch.io kit previews, the OpenGameArt RPG GUI kit, a Walters Book of Hours folio and a Solasta and a Baldur's Gate 3 store screenshot. Fetched with curl; ArtStation and Dribbble refuse a script and contributed nothing.

`docs/inspiration/README.md`: an entry per new image with what it contributes, the primitive that carries it, the source URL and the licence; a new `## The language` section with the frame anatomy (keyline, rail, corner in four grades, boss, fill), the texture set including a proposed `--texture-parchment`, the type hierarchy as six roles over the seven `--text-*` steps, the four palette families and their reading per theme, and the bar as a rail. Web references gained OpenGameArt and Behance.

The three findings on the README are fixed. `### The type` now prints the seven `--text-*` values `src/app.css:6-12` declares and names the even 1.25 scale as what 141 sets. The paragraph under the type table now states `Frame.svelte` as it is, `variant` as the ornament family over cathedral, dragon, iron, timber and hairline, `fill` as stretch to the container, its cusp, dip and insets in pixels, and names 141 as what moves `variant` onto the corner grade and every literal onto a token. `19.jpg` names the `filigree` corner grade instead of a variant that does not exist.

`## Scope` said `docs/inspiration/`; `lcp_gate.sh` matches `"$s"|"$s"/*`, so a trailing slash matched the folder and nothing in it and refused every edit to `README.md`. The line now reads `docs/inspiration`.

### Findings
- `gothic-borders.png`, `gothic-elements.png` and `gothic-ui-kit.png` carry no source and no licence; Order 4 wants one per entry. q-013 asks the user for the three URLs and their licence. Nothing in the repo records them: they were placed by hand on 2026-09-05 and swept into f530d57.
