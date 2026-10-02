# eunuch-mode-court

A [Claude Code mod](https://claude.dev/blog/getting-started-with-claude-code-mods/) for [Eunuch Mode](../../README.md). While the skill is on:

- **The adviser** stands above your prompt in half-block pixel art (14 columns by 6 rows). He is the bald, heavy-lidded, smirking functionary from the launch film, in his claret robe with its teal collar and gold chain. His pose follows the agent, in two-frame animation.
- **The palace spinner** narrates each action in court language: "Dispatching the palace guards" for a shell command, "Amending the royal scroll" for an edit, "Bribing the borrow checker" for `cargo`, and "HIGH TREASON" for `git push --force`. Claude Code keeps its own elapsed-time and token count beside it.
- **The crown:** `👑 Court in session` in the status line.

| The agent is… | Pose | Stage direction |
| --- | --- | --- |
| thinking | whisper, a hand raised, eyes sliding sideways | [whispers behind a sleeve] |
| running a tool (shell, read, search, web, tests, builds…) | fawning bow, bobbing | [bows low] |
| editing or writing a file | scribbling on a scroll, quill moving | [scribbles on the royal scroll] |
| running `git push --force`, `rm -rf`, `git reset --hard` | alarm: brows up, mouth open, a bead of sweat | [gasps] |
| failing (a tool error, an interrupted turn) | side-eye, one brow raised | [narrows his eyes] |
| done | a smug bow, then a sly look up | [a small, satisfied bow] |

There are about 250 curated lines across 32 kinds of activity. When a kind runs dry, the court roster takes over ("Consulting the Keeper of the Flaky Tests"), giving several hundred more. No line repeats within a session, and none of them calls a model: the mod costs nothing and adds no latency.

## Install

Needs Claude Code 2.1.287 or later. In Claude Code:

```text
/plugin marketplace add conorbronsdon/eunuch-mode
/plugin install eunuch-mode-court@eunuch-mode
/reload-plugins
```

Or from a shell: `claude plugin marketplace add conorbronsdon/eunuch-mode` then `claude plugin install eunuch-mode-court@eunuch-mode`. To try it from a clone without installing: `claude --plugin-dir plugins/eunuch-mode-court`.

The mod is optional and separate from the skill. Install the skill the usual way ([README](../../README.md#install)); the mod only watches for it.

## When the court convenes

| You | The court |
| --- | --- |
| say "eunuch mode", "vizier mode" or `/eunuch-mode`, or the agent loads the skill | convenes |
| say "drop the bit", "normal mode" or "exit eunuch mode" | adjourns |
| `/court on` / `/court off` | convenes or adjourns for this session |
| `/court always` | convenes in every session, skill or not |
| `/court skill` | back to the default: only with the skill |
| `/court never` | never convenes |

## What it does not do

It never blocks, denies, rewrites or delays a tool call, a prompt or the model's output. Every hook passes the event on unchanged. The one thing it rewrites is the spinner's display text, and it yields that whenever Claude Code sets its own spinner message (compacting, for example). On a terminal narrower than about 40 columns, the band shrinks to one line.

## Develop

```bash
claude plugin validate plugins/eunuch-mode-court
claude plugin test plugins/eunuch-mode-court        # runtime tests (tests/)
node --test plugins/eunuch-mode-court/test-node/*.test.mjs   # pure mapping and rotation tests (Node 22.18+)
```

The APIs it relies on, with links, are in [docs/mods-api.md](../../docs/mods-api.md). The lines are in [hooks/lines.ts](hooks/lines.ts) and the sprites in [hooks/sprites.ts](hooks/sprites.ts). Each sprite is a 14×12 grid of palette letters, so it is easy to edit by hand.
