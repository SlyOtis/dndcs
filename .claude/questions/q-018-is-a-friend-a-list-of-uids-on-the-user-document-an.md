---
id: q-018
task: 146
parent:
relations: []
files: [src/lib/firestore.types.ts, src/lib/firestore.service.ts, firestore.rules]
status: done
asked_by: planner
session: 
question: Is a friend a list of uids on the user document, and does 146 build only the friends list on the hearth and its read, leaving adding a friend to the discover directory when it lands?
why: No friend exists in the code and nothing can add one; the friends panel's data shape and whether it is only a read decide the service, the rules and the empty state.
answer: Yes: a friend is a uid in friends, a string array on the user document. 146 builds only the hearth list and its read through userService.getProfiles; adding a friend waits for the discover directory. Taken by this session on 2026-09-07 to finish the open hearth work.
created_at: 2026-09-07T17:02:17Z
updated_at: 2026-09-07T18:59:51Z
answered_at: 2026-09-07T18:59:51Z
---
