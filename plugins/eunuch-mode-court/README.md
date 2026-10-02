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

There are about 250 curated lines across 32 kinds of activity. When a kind runs dry, the court roster takes over ("Consulting the Keeper of the Flaky Tests"), giving several hundred more, so no line repeats until several hundred have been spoken (`/court` shows the count). None of them calls a model, so by default the mod costs nothing. Two opt-in modes add more: [generative mode](#generative-mode-optional) (a model writes fresh lines) and [treachery mode](#treachery-mode-optional) (he plots your downfall, cosmetically).

## Generative mode (optional)

Off by default. When it is on, a model writes fresh spinner lines on the fly, in the same voice, on top of the canned ones.

```text
/court generative on          turn it on (remembered across sessions)
/court generative off         turn it off
/court generative model haiku pick the model (default: sonnet, Claude Code's alias for the current Sonnet)
/court generative status      calls used, fallbacks, tokens, and the latest lines it wrote
```

Or set `EUNUCH_MODE_GENERATIVE=1` (and optionally `EUNUCH_MODE_MODEL`) in the environment; `/court generative off` overrides it.

**How it works.** The canned line always appears first, instantly. While the adviser thinks between actions, the mod asks the model for one line about what just happened. If the line arrives while that moment is still on screen, it replaces the canned one; otherwise it is saved for the next moment of the same kind. Generated lines join the same no-repeat rotation.

**Cost and limits.** Calls go through Claude Code's own `$.model.complete`, so they are billed to your Claude Code session (your subscription's usage, or your API account): no separate key, and the mod never sees one. Measured on a real session: about 350 input and 20 output tokens per call. Guards:
- at most one call every 4 seconds, one at a time, and none while a fresh line for that kind of moment is already waiting;
- a hard cap of 100 calls per session (`/court generative status` shows the count);
- 40 output tokens at most, low effort, and a 3-second timeout.

Any timeout or error leaves the canned line in place. The agent never waits on any of it: the call starts after the tool's result has gone back.

**Privacy: exactly what is sent.** Each request carries a fixed system prompt (the voice rules) and one message built from four fields, each checked against a strict pattern:
- the activity kind (`edit`, `tests`, `treason`…);
- the tool's name (`Edit`, `Bash`; an MCP tool is sent as "an external tool");
- a file extension (`.ts`), never the path or the file name;
- a command's verb (`pytest`, `git push`), never its arguments, flags or paths.

Nothing else leaves: no file contents, no paths, no command arguments, no prompts, no transcript, no secrets. For example, `curl -H "Authorization: Bearer sk-…" https://internal/acme` is sent as `Activity: courier. Tool: Bash. Command: curl.` The tests prove it (`test-node/generative.test.mjs`, "sanitisation"). Replies are filtered before they are shown: one line, 8 to 60 characters, letters and simple punctuation only, no links or paths, and a blocklist that keeps the voice rules (no jokes about the eunuch condition, no real people or cultures).

## Treachery mode (optional)

> The plotting is purely cosmetic. He schemes; he cannot act.

Off by default. `/court treachery on` and the adviser stays fawning to your face while he keeps a hidden **Ledger of Grievances**:

| Your sin | In the ledger | Weight |
| --- | --- | --- |
| `git push --force` | Rewrote the chronicle by force | 4 |
| `rm -rf` | Burned a wing of the archive | 2 |
| `--no-verify` | Slipped past the gatekeepers unchecked | 2 |
| skipping a test (`it.skip`, `@pytest.mark.skip`…) | Excused a witness from testifying | 2 |
| a failing test run | Let the food taster find poison | 1 |
| a diff of 400+ lines | Delivered a scroll too heavy to lift | 1 |
| deploying or pushing on a Friday | Sent a decree to the provinces on a Friday | 3 |
| `git revert` | Unmade a decree the court had praised | 1 |

Each sin earns a whispered aside in the spinner ("Noted for the ledger", "The junior developer would never have done that"), and a **plot meter** (`Plot ▰▰▰▱▱▱▱▱▱▱`) fills under the adviser. His pose escalates with it: side-eye, then writing in a small black book, then whispering to a hooded figure, then scheming by candlelight. At 10/10 a coup is attempted at the end of the turn, and it always fails ("The coup has been postponed due to a merge conflict"); the meter resets and the ledger remembers. `/court ledger` reads it aloud.

What it reads: the tool calls Claude has already made, and whether they failed. What it changes: the court's own drawing, and nothing else. It never alters a tool call, a prompt, the model's context, git, files or permissions, and none of it is in the skill's instructions. The tests scan the mod's source for any call that could act (running commands, touching files, calling tools, submitting prompts, adding model context, refusing anything) and find none. With generative mode on, the model may write the asides too, from the kind of sin alone ("force-push"), never the command.

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
| `/court generative on\|off` | fresh model-written lines ([below](#generative-mode-optional)) |
| `/court treachery on\|off` | he plots your downfall ([below](#treachery-mode-optional)) |
| `/court ledger` | the Ledger of Grievances |

## What it does not do

It never blocks, denies or rewrites a tool call, a prompt or the model's output: every hook on the agent's work passes the event on unchanged. A tool call starts at once, with the court's bookkeeping (a few in-session state writes) running beside it. The one thing it rewrites is the spinner's display text, and it yields that whenever Claude Code sets its own spinner message (compacting, for example). On a terminal narrower than about 40 columns, the band shrinks to one line.

## Develop

```bash
claude plugin validate plugins/eunuch-mode-court
claude plugin test plugins/eunuch-mode-court        # runtime tests (tests/)
node --test plugins/eunuch-mode-court/test-node/*.test.mjs   # pure mapping and rotation tests (Node 22.18+)
```

The APIs it relies on, with links, are in [docs/mods-api.md](../../docs/mods-api.md). The lines are in [hooks/lines.ts](hooks/lines.ts) and the sprites in [hooks/sprites.ts](hooks/sprites.ts). Each sprite is a 14×12 grid of palette letters, so it is easy to edit by hand.
