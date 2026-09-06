---
id: 136
parent:
depends: []
relations: [118]
title: The playwright-cli and playwright MCP output folders are gitignored
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: []
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-06T19:49:27Z
questions: []
images: []
---

## Intent
The 110 walk: `.playwright-cli/` and `.playwright-mcp/` are written into the repo root by the two playwright drivers and are not ignored, so every walk leaves them in `git status`.

## Scope
`.gitignore`.

## Order
1. dndcs: `.playwright-cli/` and `.playwright-mcp/` in `.gitignore`, beside `media/`.
2. verify: `git status` after a walk shows neither folder.

## Done when
`git status` shows neither folder after `just walk`, and `just gate` is clean.

## Summary
