---
id: 135
parent:
depends: [105]
relations: [130]
title: The campaign bar carries the menu and chat toggles so the navigator and chat open on the campaign page
type: task
status: failed
blocked_from: doing
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [f247649a4b324a2def80d2335de7d42c73a4bc6f]
created_at: 2026-09-06T19:47:50Z
updated_at: 2026-09-07T08:59:26Z
questions: [q-009]
images: []
agent: a9104dffa8eefa0ec
base: c1d3a5d5830a435e42e4c0ee3888ae9f10f83e87
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

Landed in `f247649` with the rest of the wave touching these files, the way q-009 was answered. `base` was `195e21a`, a sha no longer in the repo, and is restamped to `c1d3a5d`, the parent of the wave commit.

- `src/pages/CampaignPage.svelte`: imports `MenuPanel` and `Chat`, sets the `dialogState` context the way `MainPage` does, and passes `menu` and `chat` snippets to `Shell` so both handles render in the bar.
- `src/components/MenuPanel.svelte`: `getContext<CharacterContext | undefined>` so a page without a character store does not throw; the soundboard view and its `onNavigateToSoundboard` are offered only when `soundBoard` exists.
- `src/components/MainMenu.svelte`: `onNavigateToSoundboard` is optional and the Table section renders only when it is given.
- `src/components/chat/Chat.svelte`: untouched; `getChatLog` in `src/lib/chat.ts` already scopes off `/campaign/:id`.

`just check` 0 errors 0 warnings, `just build` passes with the pre-existing chunk size notice.

### Findings

1. `src/lib/chat.ts:333` rewrites the poll url to `replicate/predictions/...` with no leading slash, so on `/campaign/:id` it resolves to `/campaign/replicate/...`, misses the proxy, and `res.json()` parses index.html. A typed message never leaves "Thinking about it", never reaches the campaign log, and the console takes three SyntaxErrors. Make it `/replicate`. test/135/20260907T085915Z-campaign-chat-post.md
2. Widen `## Scope` to `src/lib/chat.ts`, which `## Done when` reaches through the chat drawer.

Handles, drawer, live encounter section and `/roll` into the campaign log all hold. `just gate` clean, test/135/20260907T085900Z-just-gate.md
