---
description: The apps dndcs registers in samna_auth, the files that declare them and how they are applied
paths: ["deploy/sauth/**"]
---

# Registration

1. dndcs owns `dndcs-dev` on the tst prophet `https://auth.tst.dugr.no`, owned by Knights of the Cauldron under Playground. `deploy/sauth/tst.json` declares it, and nothing else does. `dndcs`, the app dndcs.dugr.no signs in as, is not live on tst or prd yet; when it is registered, its entry goes in `deploy/sauth/tst.json` beside `dndcs-dev`.
2. A file names its `endpoint`, the `system` app `sauth`, the `root` organization and `apps`. An entry carries `slug`, `name`, `description`, `connection`, `redirect_uris`, `sync_uri`, `organization` as `{name, parent}` and `default_claim`, and where the app has them `style`, `pages`, `providers`, `organizations`, `links`, `claims`, `app_claim`, `drop_claims`, `people`, `clients`, `codes` and `templates`. The field reference is the `sauth` skill, `sauth help`. A page sits in `deploy/sauth/pages/` and a template in `deploy/sauth/templates/`, named by a path relative to the file.
3. Confirm the environment, then `just sauth-app <env> --plan`, `just sauth-app <env>`, and `just sauth-app <env> --plan` again, which shows zero changes. A plan that shows a change on an app that is live means the file is wrong: fix the file, never the live app. Without a session, `sauth login --endpoint <endpoint>` first.
4. A new app secret or client secret is printed once. The `SAUTH_APP_SECRET` of `dndcs` goes into the `sauth-app-secret` container app secret that `just apps tst` renders from the ignored `.env.tst`, that of `dndcs-dev` into the ignored `.env`; never into a committed file, a chat or a log. A lost secret is rotated with `sauth app secret create --app <slug>`, never recovered.
5. The apply is an operator action: never from a pipeline, a migration or a seed. A file here never declares another repo's app. `sauth app manifest --app <slug> --declared` prints a live app in this format.
