---
id: q-009
task: 135
parent:
relations: []
files: [src/components/chat/Chat.svelte, src/components/MenuPanel.svelte, src/components/MainMenu.svelte, src/pages/CampaignPage.svelte]
status: open
asked_by: worker
created_at: 2026-09-06T22:06:04Z
answered_at:
---

## Question
Should 135 land its four scope paths as they stand, sweeping the uncommitted work another session left in them into the #135 commit, or should the tree be landed by hand first so 135 lands on top? src/components/chat/Chat.svelte and src/components/MenuPanel.svelte are rewritten against an uncommitted src/lib/chat.ts (getChatLog) and src/lib/types.ts, and src/pages/CampaignPage.svelte and src/components/MainMenu.svelte are modified against HEAD 195e21a too, so task.sh land, which stages the scope paths whole, would commit that work under #135 in a commit that does not build alone.?

## Why it blocks

`task.sh land` runs `git add` on the scope paths whole, and its own guard says the scope exists so land never sweeps up work another session left in the tree. Every path `## Scope` names was already modified against HEAD `195e21a` before 135 took it: `Chat.svelte` imports `getChatLog` from an uncommitted `src/lib/chat.ts`, `MenuPanel.svelte` is the drawer rewrite, and `CampaignPage.svelte` and `MainMenu.svelte` carry edits outside the task. A `#135` commit of those four files would attribute another session's work to this task and would not build on its own, and hand staging only 135's hunks hand rolls a step the tooling owns. The code for 135 is written and `just check` and `just build` pass on the working tree; only the landing waits.
<what cannot be decided without this>
## Answer
