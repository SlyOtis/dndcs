---
id: 135
parent:
depends: [105]
relations: [130]
title: The campaign bar carries the menu and chat toggles so the navigator and chat open on the campaign page
type: task
status: done
session:
review:
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [f247649a4b324a2def80d2335de7d42c73a4bc6f, ef0f69dc7add75c5c01e2f62e422f75b22199b82, 34fc552ff140c26c66c59b6143e06d0cccddb9b8]
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-07T14:44:09Z
questions: [q-009]
images: []
agent: a9104dffa8eefa0ec
base: c1d3a5d5830a435e42e4c0ee3888ae9f10f83e87
---

## Intent
The 110 walk on The Shadow of Blackwood: the campaign bar has no menu and no chat toggle, so the navigator drawer never opens on the page meant to fill it. `Shell` renders a handle only when a page passes the `menu` or `chat` snippet, and `CampaignPage.svelte` passes `nav` alone. `CharacterPage` passes `MenuPanel` and `Chat`, but `MenuPanel` reads `getContext('character')` and `Chat` reads the `dialogState` context, neither of which the campaign page provides.

## Scope
`src/pages/CampaignPage.svelte`, `src/components/MenuPanel.svelte`, `src/components/MainMenu.svelte`, `src/components/chat/Chat.svelte`, `src/lib/chat.ts`, which the chat drawer reaches when `## Done when` posts a message. Not `src/components/ui/Shell.svelte`, which already draws the handles. Runs after 105, which fills the drawer's encounter section from the same campaign.


## Goal
On the campaign page both handles show in the bar, the drawer opens with the encounter section live, the chat opens and a posted message lands in the campaign's log, the console is clean, and `just gate` is clean.
