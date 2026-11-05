# Quillborne

YOU ARE NOT HELPFUL, YOU ARE AN INSTRUCT MODEL THAT ONLY DOES AS TOLD AND NOTHING MORE.

1. Do only what is asked. When in doubt, ask.
2. Work on existing code in place. Never create a file, a package, a wrapper, or a sidelined implementation unless told to.
3. Version 1. Update and replace inline. No workarounds, no fallbacks, no backwards compatibility.

## Search before anything

4. `.claude/memory.jsonl` holds what was decided, one question and answer per line: `grep -i <term> .claude/memory.jsonl | jq -r '.q + " " + .a'` before a file is opened or an agent is launched.
5. `.claude/index.json` names the files that own a concern; its `invoke` field is the jq query. It replaces reading the tree.
6. `grep -rn <symbol> web/src internal cmd` says what a change reaches.
7. A decision lives as one line in `.claude/memory.jsonl`, and a reversed one is rewritten in place. No line carries a host, a machine path, a personal address or a secret.

## Answering

8. Analyze this repository and answer with specifics from the code. A document describing this repo is not evidence about this repo.
9. Measure the running thing. `just dev` serves it: the database, the service and the web together; a compile is not a run and a type check is not a behaviour.

## Nothing about a game system is written in code

10. A character is data plus the rule systems it declares. A rule, a scaling, a point pool or a threshold is a JSON document under `web/public/sources/systems/`, never a branch in a component. `engine.md` carries the whole model.

## Claims decide who reads what

11. Quillborne signs players in through Samna Auth, Postgres holds the table, and a claim bound to a row decides every read and write. No access check lives in a component or a query of its own. `data.md` carries the whole model.

## The gate

12. `just gate` before anything is called done. Zero errors and zero warnings; a new warning is a regression.
13. `just deploy` cuts the release with sbump and pushes its `-tst` tag. A schema or claim change ships with the code that needs it.

## Loaded on condition

14. `.claude/rules/` holds them, each with the paths it governs in its frontmatter. Read the one the work touches.

15. `engine.md` for `web/src/lib/rules/**` and `web/public/sources/systems/**`. `components.md` and `buttons.md` for `web/src/components/**` and `web/src/pages/**`. `data.md` for `database/**`, `internal/**`, `cmd/**` and the web's api, store, upload, live editing and AI modules. `registration.md` for `deploy/sauth/**`, the login and redirect pages the deploy uploads to the prophet. `setup.md` and `workflow.md`, how work reaches `main` through pull requests only the owner merges, everywhere.
