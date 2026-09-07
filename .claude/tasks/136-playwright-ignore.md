---
id: 136
parent:
depends: []
relations: [118]
title: The playwright-cli and playwright MCP output folders are gitignored
type: task
status: done
session:
review:
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [test]
commits: [d845d1f03ebd7c70f72d262883abf6821696f113]
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-07T10:53:31Z
questions: []
images: []
base: 057a5a7295a6a37e8a3a48a93ea987b803c1ab99
---

## Intent
The 110 walk: `.playwright-cli/` and `.playwright-mcp/` are written into the repo root by the two playwright drivers and are not ignored, so every walk leaves them in `git status`.

## Scope
`./.gitignore`.

## Findings
`.gitignore` has no `media/` entry and `git check-ignore media` matches nothing, though `setup.md` says `media/` is gitignored. The Order said "beside `media/`"; it now says `reference/`, the line that exists.

## Goal
`git status` shows neither folder after `just walk`, and `just gate` is clean.
