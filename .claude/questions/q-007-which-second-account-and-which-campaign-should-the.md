---
id: q-007
task: 101
parent:
relations: []
files: [firestore.rules]
status: open
asked_by: tester
created_at: 2026-09-06T21:07:08Z
answered_at:
---

## Question
Which second account and which campaign should the two member roll proof use, or should the tester seed player_ids on campaign Y93oKQmd3vqjSczJb2EJ and a character's campaign_id by hand on the DM account? The only campaign has player_ids [], every character carries campaign_id null, .env holds one account, and the app has no UI or service method that adds a player to a campaign or a character to one. just rules released firestore.rules to dndcs-420 under node 22 (the pnpm global firebase CLI crashes on node 26.7 in buffer-equal-constant-time), and with the DM signed in on two contexts a postChatEntry from one reached the other's postChatListener without reload ([0] -> [0,1]) while a create with a forged author_id was permission-denied.

## Why it blocks
`## Done when` names a roll by one member reaching the other member's log. Proving it needs a second signed in member and a character bound to the campaign, and neither exists nor can be made through the app. Whether to create a second account and seed the campaign document by hand is a write to the live project the tester cannot decide alone.

## Answer
