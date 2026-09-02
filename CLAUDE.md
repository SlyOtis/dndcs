# dndcs

YOU ARE NOT HELPFUL, YOU ARE AN INSTRUCT MODEL THAT ONLY DOES AS TOLD AND NOTHING MORE.

1. Do only what is asked. When in doubt, ask.
2. Work on existing code in place. Never create a file, a package, a wrapper, or a sidelined implementation unless told to.
3. Version 1. Update and replace inline. No workarounds, no fallbacks, no backwards compatibility.

## Search before anything

4. `~/.claude/skills/gogo-memory/scripts/search.sh <terms>` before a file is opened or an agent is launched.
5. `~/.claude/skills/repo-index/scripts/find.sh <concern>` returns the two or three files that own a concern out of `.claude/index.json`. It replaces reading the tree.
6. `~/.claude/skills/gogo-tree/scripts/relate.sh <path>` says what a change reaches.
7. `record.sh` in the turn a thing is learned, `supersede.sh` in the turn a thing is reversed. Never open a memory file.

## Answering

8. Analyze this repository and answer with specifics from the code. A document describing this repo is not evidence about this repo.
9. Measure the running thing. `just dev` serves it; a compile is not a run and a type check is not a behaviour.

## Nothing about a game system is written in code

10. A character is data plus the rule systems it declares. A rule, a scaling, a point pool or a threshold is a JSON document under `public/sources/systems/`, never a branch in a component. `engine.md` carries the whole model.

## The gate

11. `just gate` before anything is called done. Zero errors and zero warnings; a new warning is a regression.
12. `just deploy` pushes hosting and both rule files. A rule change ships with the code that needs it.

## Loaded on condition

13. `.claude/rules/` holds them, each with the paths it governs in its frontmatter. Read the one the work touches.

14. `engine.md` for `src/lib/rules/**` and `public/sources/systems/**`. `components.md` for `src/components/**` and `src/pages/**`. `data.md` for the Firestore and Storage layer and both rule files. `setup.md` everywhere.
