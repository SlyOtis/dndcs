---
id: 140
parent: 139
depends: []
relations: []
title: A second reference set is gathered from fantasy UI online and its vocabulary written into the inspiration README
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-06T21:24:26Z
questions: []
images: []
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
