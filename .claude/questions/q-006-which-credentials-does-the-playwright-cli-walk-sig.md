---
id: q-006
task: 118
parent:
relations: []
files: [.env.example, src/pages/LoginPage.svelte]
status: done
asked_by: worker
created_at: 2026-09-06T18:33:12Z
answered_at: 2026-09-06T18:37:46Z
session:
question: Which credentials does the playwright-cli walk sign in with: two keys added to .env and .env.example, an existing Firebase account the user names, or a storage state the user saves once by hand with playwright-cli state-save and the walk loads with state-load?
why: `## Order` step 1 signs in with "the credentials the environment provides", but nothing provides any. `.env` carries only the six `VITE_FIREBASE_*` keys and `VITE_REPLICATE_API_KEY`, `.env.example` the same six, no `TEST_`, `E2E_` or `PLAYWRIGHT_` key exists anywhere in the repo or `.claude/`, and `LoginPage.svelte` signs in through `signInWithEmailAndPassword` against the live project with no emulator. The sign-in step is a different script under each answer: `fill` on `#login-email` and `#login-password` from two env keys, the same with a named account, or `state-load` of a file the user made once and no login form at all. Without an account that owns a character named Testy and a campaign, step 5, the recipe running green against `just dev`, cannot be met and `## Done when` cannot be verified from here.
answer: Two env keys. Add an email key and a password key to .env and .env.example, without a VITE_ prefix since they are secrets that never enter the bundle. The walk fills #login-email and #login-password from them against the live project. The account behind them owns a character named Testy and a campaign, so step 5 can run green against just dev.
updated_at: 2026-09-07T12:39:08Z
---
