---
id: 136
parent:
depends: []
relations: [118]
title: The playwright-cli and playwright MCP output folders are gitignored
type: task
status: review
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: [d845d1f03ebd7c70f72d262883abf6821696f113]
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-06T19:50:56Z
questions: []
images: []
base: 057a5a7295a6a37e8a3a48a93ea987b803c1ab99
---

## Intent
The 110 walk: `.playwright-cli/` and `.playwright-mcp/` are written into the repo root by the two playwright drivers and are not ignored, so every walk leaves them in `git status`.

## Scope
`./.gitignore`.

## Order
1. dndcs: `.playwright-cli/` and `.playwright-mcp/` in `.gitignore`, beside `reference/`.
2. verify: `git status` after a walk shows neither folder.

## Done when
`git status` shows neither folder after `just walk`, and `just gate` is clean.

## Summary
`.gitignore`: `.playwright-cli/` and `.playwright-mcp/` appended after `reference/`. `git check-ignore` matches both folders and `git status` no longer lists them.

### Findings
`.gitignore` has no `media/` entry and `git check-ignore media` matches nothing, though `setup.md` says `media/` is gitignored. The Order said "beside `media/`"; it now says `reference/`, the line that exists.
