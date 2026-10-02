# The Claude Code mods API this mod uses

Claude Code mods were announced on 2026-10-01 ([@ClaudeDevs](https://x.com/ClaudeDevs/status/2105721434807083061)). The API is new and, by Anthropic's own note, "can change between releases". This page records exactly what `plugins/eunuch-mode-court/` relies on, where each piece is documented, and which build it was checked against, so a breaking change is easy to find.

**Checked against:** Claude Code **2.1.287** (the first release with mods on by default), on 2026-10-01. `claude plugin validate` and `claude plugin test` both pass on that build.

## Sources

- [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/) (Addy Osmani, claude.dev blog, 2026-10-01; [Markdown version](https://claude.dev/blog/getting-started-with-claude-code-mods.md)): the plugin layout, `register(on)`, the hook shape, `$.state`, `ui.render` on `AbovePrompt`, `claude plugin validate` / `test`, and marketplace install.
- [anthropics/claude-code `mods/`](https://github.com/anthropics/claude-code/tree/main/mods): the built-in mods' source (`diff`, `agents-md`, `telemetry`, `sec-default`), their tests, and a published `types/claude-code.d.ts`. That copy is older than 2.1.287 (it has no `$.state`), so it was used for patterns only.
- **The authority for a given build:** the declarations Claude Code writes into `.claude-plugin/types/` each time it loads a mod (`claude-code/index.d.ts`, `claude-code-tools/index.d.ts`). They are per-build, so this repo ignores them; load the mod once (`claude --plugin-dir plugins/eunuch-mode-court`) to regenerate them. Every signature below was read from the 2.1.287 copy.
- [Claude Code plugin docs](https://code.claude.com/docs): plugin and marketplace manifests.

## Packaging

| Piece | What it is | Source |
| --- | --- | --- |
| `.claude-plugin/plugin.json` | A normal plugin manifest. `"types": "./types/index.d.ts"` names the state contract. | Blog, steps 1 and 3 |
| `hooks/hooks.json` | `{ "modules": ["./court.ts"] }`: exactly one hooks module per mod. | Blog, step 1 |
| `hooks/court.ts` | Exports `register(on)`. TypeScript is loaded directly; sibling files are imported with `import … from './lines.ts'` (dynamic `import()` is refused). | Blog; built-in `diff` mod; `claude plugin test` error text |
| `types/index.d.ts` | `declare module 'claude-code' { interface PluginState { 'eunuch-mode-court': { scene; ledger; frame } } }`. `claude plugin validate` refuses an undeclared state key. | Blog, step 3 |
| `.claude-plugin/marketplace.json` (repo root) | Lists the plugin with `"source": "./plugins/eunuch-mode-court"`. | Blog, step 6 and "Sharing your mod" |

## Hooks

Every hook has the shape `on(event, matcher?, async ($, e, next) => …)` and forms a middleware chain. This mod only **observes** (`const r = await next(e); …; return r`) or **rewrites display props** (`next({ ...e, props })`); it never answers an event without calling `next`.

| Event | Used for | Notes from the 2.1.287 types |
| --- | --- | --- |
| `session.start` | Registers `/court`, seeds the line ledger, restores the persisted mode. | Fires again on every hot reload, so state lives in `$.state`, not module variables. |
| `prompt.submit` | "eunuch mode", "vizier mode", `/eunuch-mode` convene; "drop the bit", "normal mode", "exit eunuch mode" adjourn. | `e.text` is the prompt as the model will read it. Passed on unchanged. |
| `skill.prompt` | Convenes when the `eunuch-mode` skill is expanded. | Raised for `/name`, the Skill tool, or a subagent preload. `e.skill` is the name. |
| `turn.start` / `turn.complete` | Thinking pose at the start; smug or side-eye at the end, by `e.reason` (`answer`, `aborted`, `refusal`, `error`). | `e.agentId` is set for subagent loops; the mod ignores those. |
| `tool.call` | Classifies the call (tool name plus Bash command text), sets the pose and line; after `next(e)`, `result.isError` switches to side-eye. | The tool's input is spread on `e` (`e.command`, `e.file_path`). |
| `command.run` `{ command: 'court' }` | `/court on`, `off`, `always`, `skill`, `never`. | Registered with `$.command.register({ name, description, argumentHint, immediate: true })`. |
| `ui.render` `{ component: 'Spinner' }` | Replaces the spinner's text with the court line. | Props `word`, `message`, `suffix`, `mode`. Rewriting `message` keeps the engine's ellipsis and its `(12s · 300 tokens)` parenthetical. The mod yields whenever the engine sets its own `message`. |
| `ui.render` `{ component: 'AbovePrompt' }` | Draws the adviser and his stage direction. | Props `hasSurvey`, `isWorking`, `maxRows`, `bodyColumns`, `view`. Returning `next(e)` gives the band back. |

## `$` calls

| Call | Used for |
| --- | --- |
| `$.ui.resolve(e)` | `Box` and `Text` constructors for the surface being drawn. |
| `Text({ color, backgroundColor, bold, italic, dimColor, wrap })` | Hex colours are accepted (`'#a3222a'`); the sprite is drawn with `▀`/`▄`/`█` half-blocks, two pixels per cell. |
| `Box({ flexDirection, paddingX, marginLeft, width, flexShrink, justifyContent, key })` | Layout; props outside the allowlist fail validation and the engine draws its own component instead. |
| `$.ui.status(text \| undefined)` | Pins `👑 Court in session` under the prompt; `undefined` clears it. One per plugin. |
| `$.state.get(ref)` / `$.state.set(ref, value, { ifVersion })` | Session state that survives hot reload. A `get` inside a render hook subscribes it, so a later `set` redraws without `$.ui.invalidate`. `ifVersion` makes the no-repeat ledger safe when parallel tool calls draw lines at once. |
| `$.store.get` / `$.store.set` | The `/court always / skill / never` preference, kept across sessions. |
| `$.clock.every(ms, fn)` / `$.clock.after(ms, fn)` | The two-frame animation while a turn runs; the closing pose lingering eight seconds after it ends. A hot reload cancels pending timers. |
| `$.clock.now()` | Seeds the line order so sessions differ. |
| `$.command.register(spec)` | `/court`. |

## Testing

- `claude plugin validate plugins/eunuch-mode-court` lists the hooks, calls and state the module uses.
- `claude plugin test plugins/eunuch-mode-court` runs `tests/court.test.ts` against the real runtime. Hooks the test registers sit beneath the mod and answer for Claude Code; `mock.clock(on)` and `mock.store(on, …)` come from `claude-code/testing`; `$.ui.mount({ plugin, surface, component, props })` renders a component and `ui.find({ type, text })` inspects it.
- `node --test plugins/eunuch-mode-court/test-node/*.test.mjs` tests the pure mapping and rotation with no Claude Code install. Node 22.18+ strips the TypeScript types itself. This is what CI runs.

## Availability

- Mods need Claude Code 2.1.287 or later. Installed plugins' hooks modules load only while the server-side rollout flag (`tengu_plugin_hooks_modules`) is on for your account; on a build that has cached it off, `claude plugin test` says so ("the rollout switch served off"), and running any session refreshes the cache.
- `disableAllHooks`, `allowManagedHooksOnly` and safe mode turn installed mods off.
- In 2.1.287 both `Spinner` and `AbovePrompt` are raised on the terminal and desktop surfaces. This mod was run and recorded in the terminal only; the desktop app is untested.
- There is no `--live` mode: every line is canned, so the mod never calls a model.
