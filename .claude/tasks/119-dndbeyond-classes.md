---
id: 119
parent:
depends: []
relations: []
title: One script pulls every class, its full content and its images from D&D Beyond into a local reference set
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: []
created_at: 2026-09-06T19:09:43Z
updated_at: 2026-09-06T19:09:44Z
questions: []
---

## Intent
The class documents under `public/sources/classes/` were authored from memory: 107 wrote the level features, 109 drew emblems, and neither had the source text or the official art beside it to check against. D&D Beyond is the reference the table uses, and its class pages carry what the documents lack: the full description, every feature by level with its wording, the class table, the subclasses with their features, and the artwork. A local copy of that, fetched once per class by one script, is what an author reads while writing a document. It is reference, not data: nothing in it ships, and no document is generated from it.

## Scope
`scripts/reference.sh`, one recipe `reference <kind>` in `justfile`, and `reference/` at the repo root, added to `.gitignore` beside `media/`. Not `public/sources/**`: the documents stay authored, and no fetched text or image is copied under `public/`. Not `src/**`. The set is copyrighted material under D&D Beyond's terms, which forbid redistribution, so it lives on the machine that fetched it and is never committed, deployed or placed where `just build` can reach it.

## Order
1. dndcs: `scripts/reference.sh <kind>` in bash, `curl` and `jq`, following the stack rule. For `classes` it reads D&D Beyond's class listing, then for every class fetches the page and writes `reference/dndbeyond/classes/<slug>/` holding the page text as markdown with headings kept, the class table, every feature under its level, every subclass with its features, and every image the page carries as a file next to it with its original name. If `curl` is refused by the site's bot check, `playwright-cli` at `/opt/homebrew/bin/playwright-cli` drives the page instead; the script decides once and says which it used.
2. dndcs: the script takes the kind as its one argument so `races` in 120 and anything after it are a case, not a copy. A slug already on disk is skipped unless `--refresh` is given.
3. dndcs: `just reference classes` runs it. `reference/` in `.gitignore`.
4. verify: `just reference classes`, then `ls reference/dndbeyond/classes` and count files per class.

## Done when
`just reference classes` fills a folder per class D&D Beyond lists, every class in `public/sources/classes/index.json` that D&D Beyond has a page for among them, each folder holding the markdown and at least one image, `git status` shows nothing under `reference/`, and `just gate` is clean.

## Summary
