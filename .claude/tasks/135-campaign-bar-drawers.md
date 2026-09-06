---
id: 135
parent:
depends: [105]
relations: [130]
title: The campaign bar carries the menu and chat toggles so the navigator and chat open on the campaign page
type: task
status: staged
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: []
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-06T19:49:27Z
questions: []
images: []
---

## Intent
The 110 walk on The Shadow of Blackwood: the campaign bar has no menu and no chat toggle, so the navigator drawer never opens on the page meant to fill it. `Shell` renders a handle only when a page passes the `menu` or `chat` snippet, and `CampaignPage.svelte` passes `nav` alone. `CharacterPage` passes `MenuPanel` and `Chat`, but `MenuPanel` reads `getContext('character')` and `Chat` reads the `dialogState` context, neither of which the campaign page provides.

## Scope
`src/pages/CampaignPage.svelte`, `src/components/MenuPanel.svelte`, `src/components/MainMenu.svelte`, `src/components/chat/Chat.svelte`. Not `src/components/ui/Shell.svelte`, which already draws the handles. Runs after 105, which fills the drawer's encounter section from the same campaign.

## Order
1. dndcs: the campaign page passes `menu` and `chat` to `Shell`, so both handles render in its bar in the same design 130 gives the bar.
2. dndcs: the drawer and the chat render on a page with a campaign and no character: the character-only sections of `MenuPanel` stay out of the way rather than throwing on a missing context, the chat scopes to the campaign the way it already scopes off the route, and the dialog state context exists on the page.
3. verify: `just gate`, then `just dev` on The Shadow of Blackwood, open the drawer and the chat, post a message.

## Done when
On the campaign page both handles show in the bar, the drawer opens with the encounter section live, the chat opens and a posted message lands in the campaign's log, the console is clean, and `just gate` is clean.

## Summary
