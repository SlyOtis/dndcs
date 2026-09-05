---
id: q-001
task: 110
parent:
relations: []
files: [src/App.svelte]
status: answered
asked_by: worker
created_at: 2026-09-05T15:25:15Z
answered_at: 2026-09-05T15:37:41Z
---

## Question
Should 110 run solo in the main conversation with the Chrome extension paired, or should it carry a headless driver a worker agent can run instead?

## Why it blocks
Every line of ## Order needs a rendered page: pairing the extension, walking the screens, reading the console, measuring horizontal scroll, uploading a portrait, rolling dice. A worker agent has no mcp__claude-in-chrome__* tools; the tool set is fixed before the browser connection completes, so no part of the walk can run here. Either the main conversation holds the task solo with the browser paired, or the repo gains a driver the agent can call from bash, and that driver is a different task with a different scope.

## Answer

Run 110 solo in the main conversation with the Chrome extension paired. The walk needs a rendered page and a signed-in Firebase session, and the main conversation is the only context that holds the mcp__claude-in-chrome__* tools, so no headless driver is added and no new task is created.
