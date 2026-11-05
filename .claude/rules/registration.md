---
description: The login and redirect pages dndcs serves from the samna_auth prophet, the files that hold them and how a deploy uploads them
paths: ["deploy/sauth/**"]
---

# Registration

1. dndcs is the app `dndcs` on the tst prophet, auth.tst.dugr.no, and `dndcs-dev` on the tst prophet for a local run (`setup.md`). There is no prd app. The app, its organization Knights of the Cauldron, claims, clients and codes are written through `sauth` as a signed in user on the user's word, never seeded and never from a pipeline, and nothing about them is stored here: the live state is `sauth app manifest --app dndcs` and `sauth app page get --app dndcs`.
2. `deploy/sauth/pages/login.html` and `deploy/sauth/pages/redirect.html` are the login and redirect pages of the app, Go html/templates the prophet renders at sign in and after it (the `sauth` skill), and the only files of the app this repo holds. They carry the table's own look: the palette, the fonts and the `Ornament` and `Sigil` vectors of `web/src`.
3. The `page` job of `.github/workflows/azure-deploy.yml` uploads both files on every tst deploy to `vars.SAUTH_ENDPOINT`, as the client `secrets.SAUTH_CLIENT_ID` and `secrets.SAUTH_CLIENT_SECRET` of the `tst` GitHub environment: the `samna_client` `dndcs-deploy` of the `dndcs` app, holding the service claim `dndcs Deploy` with write on Knights of the Cauldron, its secret never in a file. The job never runs for prd. The command per kind, from the repo root, is `sauth app page replace <kind> --app dndcs --data "$(jq -n --rawfile t deploy/sauth/pages/<kind>.html '{kind:"<kind>",template:$t}')" --yes`.
4. By hand, from the repo root under a `sauth login` session on tst, on the user's word. Login: `sauth --global --config tst app page replace login --app dndcs --data "$(jq -n --rawfile t deploy/sauth/pages/login.html '{kind:"login",template:$t}')" --yes`.
5. Redirect: `sauth --global --config tst app page replace redirect --app dndcs --data "$(jq -n --rawfile t deploy/sauth/pages/redirect.html '{kind:"redirect",template:$t}')" --yes`.
6. The local app takes the same commands with `--app dndcs-dev`.
7. A page is rendered against sample data before it is stored, and a 400 names the template error with its line. `sauth --global --config tst api POST /api/app/dndcs/page/<kind>/preview --data "$(jq -n --rawfile t deploy/sauth/pages/<kind>.html '{template:$t,providers:"active"}')"` renders one without storing it; a login preview takes `providers` as `none`, `active` or `inactive`, and `panel`, `error` and `login_hint`, a redirect preview `user`.
8. `sauth --global --config tst app page get --app dndcs --json` reads what is live; its `template` is the file, byte for byte. The login page is served at `https://auth.tst.dugr.no/login/dndcs`.
