---
id: 119
parent:
depends: []
relations: []
title: One script pulls every class, its full content and its images from D&D Beyond into a local reference set
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [e35601ca717571b16e0f75aaefe6f75f74580eb8]
created_at: 2026-09-06T19:09:43Z
updated_at: 2026-09-07T10:53:27Z
questions: []
base: 6674294702e4cfaa6b99d5adcac48e707689beeb
---

## Intent
The class documents under `public/sources/classes/` were authored from memory: 107 wrote the level features, 109 drew emblems, and neither had the source text or the official art beside it to check against. D&D Beyond is the reference the table uses, and its class pages carry what the documents lack: the full description, every feature by level with its wording, the class table, the subclasses with their features, and the artwork. A local copy of that, fetched once per class by one script, is what an author reads while writing a document. It is reference, not data: nothing in it ships, and no document is generated from it.

## Scope
`scripts/reference.sh`, one recipe `reference <kind>` in `justfile`, and `reference/` at the repo root, added to `.gitignore` beside `media/`. Not `public/sources/**`: the documents stay authored, and no fetched text or image is copied under `public/`. Not `src/**`. The set is copyrighted material under D&D Beyond's terms, which forbid redistribution, so it lives on the machine that fetched it and is never committed, deployed or placed where `just build` can reach it.

## Findings
- 13 links redirect to `marketplace.dndbeyond.com`: illrigger, warden, treasure-hunter, captain, scholar, messenger, champion, gunslinger, both artificers, monster-hunter, pugilist, kindred. `artificer` and `gunslinger` from `index.json` have no public page.
- Anonymous pages carry one free subclass per class; the rest sit behind a purchase.
- `.gitignore` has no `media/` line and no `media/` folder exists.
- The first run, before the redirect check, left empty folders for the 13 marketplace links: `rm -r reference/dndbeyond/classes/{2289517-illrigger,2297348-warden,2297349-treasure-hunter,2297350-captain,2297351-scholar,2297352-messenger,2297353-champion,2498109-gunslinger,252717-artificer,2566877-monster-hunter,2656866-artificer,2717895-pugilist,2854543-kindred}`

## Goal
`just reference classes` fills a folder per class D&D Beyond lists, every class in `public/sources/classes/index.json` that D&D Beyond has a page for among them, each folder holding the markdown and at least one image, `git status` shows nothing under `reference/`, and `just gate` is clean.
