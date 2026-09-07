---
id: 140
parent: 139
depends: []
relations: []
title: A second reference set is gathered from fantasy UI online and its vocabulary written into the inspiration README
type: task
status: review
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [f530d570c701e4da712522fcb0964ae036794d4c, a00ec987b47c393a5e111fa9143521d61be28236, 1f7677bc179e2403a583d5c6b24b0bcaa6e8eaa5]
created_at: 2026-09-06T21:24:24Z
updated_at: 2026-09-07T08:29:03Z
questions: [q-013]
images: []
agent: ad0522f10348db90a
base: a0d7a52d59080641cb36267c7df4899abc54abbe
---

## Intent
The first reference set, `docs/inspiration/1.png` through `11.png`, gave the language its first vocabulary. The user wants a second round found online: colouring, theming, texture, frames, complete screen layouts, a top bar, type treatment. Nothing is copied; an image is a reference to look at. q-013: the folder is images only and carries no README, and a reference that needs a source is replaced by a similar image found on the web that has one. This task runs `/lcp-worker solo`, because it needs `WebSearch` and `WebFetch`, which a worker agent does not hold.

## Scope
`docs/inspiration`. No source.

## Order
1. dndcs: search fantasy and dark fantasy game UI online, itch.io, ArtStation, Figma community, Behance, Dribbble and shipped RPG interfaces, for full screens as well as parts: frames with their corner anatomy, panel textures, bars and headers, typographic hierarchy, colour systems across several themes, meters, tabs, dialogs.
2. dndcs: bring twelve to twenty images into `docs/inspiration` continuing the numbering. Where a reference needs a source, search the web for a similar image that has one rather than keeping one whose origin cannot be checked.
3. verify: `docs/inspiration` holds images and nothing else.

## Done when
`docs/inspiration` holds at least twelve images beyond `11.png`, carries no `README.md`, and `git status` shows nothing outside `docs/inspiration`.

## Summary
`docs/inspiration/12.png` to `30.jpg`, nineteen images: Saintfall and Soulbane screens from Behance, a Behance skill tree, the Figma dark fantasy RPG abilities screen, seven itch.io kit previews, the OpenGameArt RPG GUI kit, a Walters Book of Hours folio and a Solasta and a Baldur's Gate 3 store screenshot. Fetched with curl; ArtStation and Dribbble refuse a script and contributed nothing.

`docs/inspiration/README.md` carried an entry per image and the written language of frames, textures, type and palette. Commit a00ec98 fixed the three review findings on it: `### The type` printed the seven `--text-*` values `src/app.css:6-12` declares instead of an invented 1.25 scale, the paragraph under the type table stated `Frame.svelte` as it is, and `19.jpg` named the `filigree` corner grade instead of a variant that does not exist.

q-013 then answered that the folder carries no README at all and is images only, which voids Orders 2, 3 and 4 as they stood and the licence per entry condition in `## Done when`. `## Intent`, `## Scope`, `## Order` and `## Done when` are rewritten to that answer. The user removed the file and 1f7677b lands the deletion, 293 lines. `docs/inspiration` is thirty three images and nothing else.

`## Scope` said `docs/inspiration/`; `lcp_gate.sh` matches a changed path with `case "$rel" in "$s"|"$s"/*`, so a trailing slash matched the folder and nothing in it and refused every edit to `README.md`. The line now reads `docs/inspiration`.

`base` `6961342` and `commits` `26b632a` were both dangling, the branch having been rewritten under the task. They are now `a0d7a52` and `f530d57`, the real first landing.

Outside `## Scope`, noticed and not touched. `test/sigils.spec.ts:249` reads `docs/inspiration/README.md` and asserts on the `8.png` block; that test now reads a file that is not there and fails. Twelve task files name the README as required reading before work starts, 125, 127, 130, 131, 132, 133, 134, 145 and 139, and 141, 142 and 143 name the frame anatomy, type hierarchy and bar that 140 wrote into it as what they build from. The task `title` still says the vocabulary is written into the README.
