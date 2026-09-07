---
id: q-014
task: 129
parent:
relations: []
files: [test/walk.sh]
status: done
asked_by: reviewer
created_at: 2026-09-06T23:11:06Z
answered_at: 2026-09-06T23:26:31Z
session:
question: Can the vite dev server on 5173, PID 14729, be restarted so the walk can be proven, given its node_modules/.vite/deps was deleted underneath it and every module request now answers 504 Outdated Optimize Dep?
why: `## Done when` has two halves. `just gate` is clean, verified. The other half, the walk through sign in, cannot be run: the server on 5173 was not started by the loop, so `task.sh serve stop` refuses it, and every module it serves answers 504, so `just walk` times out on `/login` before sign in is reached and fails four pages, `test/129/20260906T230945Z-just-walk.md`. Nothing in `test/walk.sh` causes that and no worker edit fixes it, so the run is neither a pass nor a finding until the server is fresh.
answer: Yes. Kill PID 14729, then bring the server up through task.sh serve so the loop owns it and task.sh serve stop works, and rerun just walk against the fresh server. The 504s are stale optimize deps, not a defect in test/walk.sh, so the walk half of 129 is neither passed nor failed until it runs clean.
updated_at: 2026-09-07T12:39:08Z
---
