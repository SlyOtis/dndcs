---
id: 137
parent:
depends: [122]
relations: [122]
title: An unknown character id shows an empty sheet with one message instead of the fixture and permission errors
type: bug
status: testing
blocked_from:
github:
assignee: Martin Ottersland
repos: [dndcs]
skills: [components]
commits: [7e35384beb73c8377f51930f5467114cb5f5b443]
created_at: 2026-09-06T20:12:27Z
updated_at: 2026-09-07T09:13:20Z
questions: []
images: []
agent: ae33abd8e37d60435
base: 107422c0a5a9739fb6272af6a8d881fb1769e9a3
---

## Intent
The 110 walk: `/character/<unknown id>` keeps the fixture Lucky Lars on screen for good and logs a Firestore permissions error plus two scope errors. `CharacterPage.svelte` calls `getCharacter(route.params.id)`, applies the document when one comes back, and on failure only logs `Character did not load`; nothing on the page changes. 122 removes the fixture, so after it an unknown id shows an empty store and the same three errors.

## Scope
`src/pages/CharacterPage.svelte`, `src/lib/firestore.service.ts` for `getCharacter`. Not `firestore.rules`: a denied read is the right answer for another user's character. Runs after 122, which owns the same load path.

## Order
1. dndcs: when `getCharacter` rejects or returns no document, the sheet renders one message in the page's language, the character was not found or is not yours, inside `Shell`, with the way back to the hearth, and renders no board, no tabs and no drawer content.
2. dndcs: the denied read is handled, not logged as an error, and the two scope errors that follow it do not occur because nothing downstream runs on a character that never loaded.
3. verify: `just gate`, then `just dev` and open `/character/does-not-exist` with the console open.

## Done when
`/character/does-not-exist` shows the one message and the way back, the console carries no error, Testy's sheet still loads, and `just gate` is clean.

## Summary
`src/lib/firestore.service.ts`: `getCharacter` puts a `.catch` on the `getDoc`. A `FirebaseError` with code `permission-denied` becomes `null`, every other code still rejects, and the existence check is now `!characterSnap?.exists()`. `FirebaseError` is a type-only import from `firebase/app`. A denied read is now the same answer as a missing document, `null`, for every caller.

`src/pages/CharacterPage.svelte`: `missing` is a second `$state(false)`, set when the promise resolves without `document.character` and in the `.catch`, which no longer calls `console.error`. The `menu` and `chat` snippets moved out of the `Shell` body to the top of the markup and are passed as props, `menu={missing ? undefined : menu}` and the same for `chat`; `Shell` draws an `aside` and its toggle only when the snippet is given, so a missing character has no drawer and no drawer handle. The body is `{#if missing}` a `sheet-lost` block, one `<p>` reading `That character was not found, or it is not yours.` and a primary `Button` reading `Back to the hearth` that navigates to `/main`, `{:else if loaded}` the crown and the grid as before. `sheet-lost` and `sheet-lost-note` are two new rules in the page's `<style>`, tokens only, the same shape `NotFoundPage.svelte` uses for `.lost`.

The three errors the 110 walk logged were one `Character did not load` from this page and two `Campaign scope did not resolve` from `postCampaignScope` in `src/lib/chat.ts:162`, which calls the same `getCharacter` on every `/character/` route change. Nothing in `chat.ts` was touched: with `getCharacter` resolving `null` on a denied read, `postCampaignScope` takes its `.then` branch and sets `currentCampaignId` to `null`. Confirmed against `.playwright-cli/console-2026-09-06T20-00-23-536Z.log`, which is the walk's capture of all three.

`just check` is 88 files, 0 errors, 0 warnings. `just build` is clean; the only note is the pre-existing 500 kB chunk-size advisory.

Noticed outside `## Scope`: the `tools` snippet still draws Export, Level up, Import sources and Change theme on the bar when the character is missing. `## Order` names the board, the tabs and the drawers and not the bar, so they were left.
