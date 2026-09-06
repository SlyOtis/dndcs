---
id: 119
parent:
depends: []
relations: []
title: One script pulls every class, its full content and its images from D&D Beyond into a local reference set
type: task
status: done
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: []
commits: [e35601ca717571b16e0f75aaefe6f75f74580eb8]
created_at: 2026-09-06T19:09:43Z
updated_at: 2026-09-06T21:19:53Z
questions: []
base: 6674294702e4cfaa6b99d5adcac48e707689beeb
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
`scripts/reference.sh <kind> [--refresh]`: bash, `curl`, `jq`, one awk pass for HTML to markdown. Reads the listing, and for every `/<kind>/<id>-<slug>` link writes `reference/dndbeyond/<kind>/<id>-<slug>/<id>-<slug>.md` and every image the content carries under its original name. The folder is D&D Beyond's URL slug because the listing carries a 2024 and a 2014 page per core class. Headings, tables, lists, bold, italic and sidebars are kept. The driver is decided on the first fetch and printed: `curl`, or `playwright-cli` when curl is refused; this run went through `curl`. A link that lands off a class page is reported as `skip <slug>: not a class page`. `kind` is a `case`.

`justfile`: `reference kind *ARGS`. `.gitignore`: `reference/`. `land` took only `scripts/reference.sh`; `justfile` and `.gitignore` are committed beside it.

38 links, 25 class folders each with markdown and one image, nothing under `reference/` in `git status`. `just check` and `just build` clean; the chunk size warning in build predates this task.

### Findings
- 13 links redirect to `marketplace.dndbeyond.com`: illrigger, warden, treasure-hunter, captain, scholar, messenger, champion, gunslinger, both artificers, monster-hunter, pugilist, kindred. `artificer` and `gunslinger` from `index.json` have no public page.
- Anonymous pages carry one free subclass per class; the rest sit behind a purchase.
- `.gitignore` has no `media/` line and no `media/` folder exists.
- The first run, before the redirect check, left empty folders for the 13 marketplace links: `rm -r reference/dndbeyond/classes/{2289517-illrigger,2297348-warden,2297349-treasure-hunter,2297350-captain,2297351-scholar,2297352-messenger,2297353-champion,2498109-gunslinger,252717-artificer,2566877-monster-hunter,2656866-artificer,2717895-pugilist,2854543-kindred}`
