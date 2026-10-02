// Eunuch Mode court: while the eunuch-mode skill is on, the palace adviser
// stands above the prompt in pixel art, the spinner narrates each action in
// court language, and the status line reads "👑 Court in session".
//
// Hooks on the agent's work (prompts, skills, turns, tool calls) observe and
// pass the event on with next(e), unchanged. A tool call starts at once: the
// court's bookkeeping runs beside it, not before it. The drawings are the
// mod's own: the spinner keeps Claude Code's line with the court's text in it,
// the band above the prompt is drawn only while the court is in session, and
// /court is the mod's own command. By default it makes no model calls: every
// line is canned (lines.ts). Generative mode, off unless the person turns it
// on, asks a model for fresh lines in the background (generative.ts); the
// canned line is always shown first, so a slow or failed call changes nothing.
// Treachery mode, also opt-in, keeps a hidden Ledger of Grievances and a plot
// meter (treachery.ts). It is drawing only: he schemes; he cannot act.

import type { EngineInterface, On, Timer } from 'claude-code'
import type { CourtLedger, CourtScene } from '../types'
import { POSE_OF, classifyTool, detailOf, isCourtSkill, pickLine, promptIntent, stageFor, type Activity } from './lines.ts'
import { frameOf, toRows } from './sprites.ts'
import {
  DEFAULT_MODEL,
  EMPTY_GEN,
  MAX_CALLS_PER_SESSION,
  MAX_TOKENS,
  SYSTEM,
  TIMEOUT_MS,
  filterLine,
  mayCall,
  promptFor,
  summarize,
  takeBanked,
  asidePrompt,
  type ActivitySummary,
  type GenState,
} from './generative.ts'
import { segmentsOf } from './lines.ts'
import {
  ASIDES,
  COUPS,
  COUP_STAGE,
  EMPTY_PLOT,
  PLOT_MAX,
  PLOT_POSE,
  PLOT_STAGE,
  afterCoup,
  coupDue,
  grievancesOf,
  ledgerText,
  meterBar,
  nth,
  record,
  stageOf,
  type Grievance,
  type Plot,
} from './treachery.ts'

const SCENE = { plugin: 'eunuch-mode-court', key: 'scene' } as const
const LEDGER = { plugin: 'eunuch-mode-court', key: 'ledger' } as const
const FRAME = { plugin: 'eunuch-mode-court', key: 'frame' } as const
const GEN = { plugin: 'eunuch-mode-court', key: 'gen' } as const
const PLOT = { plugin: 'eunuch-mode-court', key: 'plot' } as const
const GENERATIVE_KEY = 'generative'
const TREACHERY_KEY = 'treachery'
const PLOT_COLOR = '#9b5fc0'
const MODEL_KEY = 'model'

/** Persisted across sessions in $.store: when the court convenes. */
type Mode = 'skill' | 'always' | 'never'
const MODE_KEY = 'mode'

const STATUS_TEXT = '👑 Court in session'
const TITLE_COLOR = '#cf5a4c'
const LINGER_MS = 8000
const FRAME_MS = 480
/** How long an action's pose stays up before the adviser returns to thinking; display only, the tool is never held. */
const MIN_SHOW_MS = 1500
const SPRITE_ROWS = 6
const SPRITE_COLUMNS = 14

const IDLE: CourtScene = {
  active: false,
  session: 0,
  pose: 'portrait',
  line: null,
  stage: null,
  detail: null,
  linger: false,
}

let ticker: Timer | null = null
let lingerTimer: Timer | null = null
let afterTool: Timer | null = null
// The newest scene and when it reached the screen, so a delayed return to
// thinking never overwrites a later action.
let staged = { seq: 0, shownAt: 0 }
// Bumped when a turn starts and when it ends, so tool-call bookkeeping still
// running in the background never redraws a turn that has finished.
let turnGen = 0
// Line draws run one at a time in this module, so two parallel tool calls
// never draw the same line.
let drawing: Promise<unknown> = Promise.resolve()
// Generative bookkeeping (counters, the bank of fresh lines). The module's
// copy is the truth: every $.state.get within one dispatch reads one moment, so
// work still running in a tool call's background would read stale counters.
// It is loaded once from $.state after a load or reload and mirrored back.
let genMem: GenState | null = null
let genLoading: Promise<GenState> | null = null
// The Ledger of Grievances, kept the same way (module copy, mirrored to $.state).
let plotMem: Plot | null = null
let plotLoading: Promise<Plot> | null = null
let asidesSpoken = 0

async function sceneOf($: EngineInterface): Promise<CourtScene> {
  const { value } = await $.state.get(SCENE)
  return value ?? IDLE
}

/**
 * Applies `patch` to the scene only while `guard` holds, with a versioned
 * write: a stale update (an older tool call, a scene set before /court off)
 * re-reads and gives up instead of undoing a newer one.
 */
async function patchScene(
  $: EngineInterface,
  patch: Partial<CourtScene>,
  guard: (scene: CourtScene) => boolean = scene => scene.active,
): Promise<boolean> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const { value, version } = await $.state.get(SCENE)
    const scene = value ?? IDLE
    if (!guard(scene)) return false
    const written = await $.state.set(SCENE, { ...scene, ...patch }, { ifVersion: version })
    if (written.isSet) return true
  }
  return false
}

async function modeOf($: EngineInterface): Promise<Mode> {
  const stored = await $.store.get(MODE_KEY)
  return stored === 'always' || stored === 'never' ? stored : 'skill'
}

/**
 * Draws a line nobody has heard this session and records it before returning
 * it: a banked generated line for this activity when generative mode left
 * one, else a canned one.
 */
function drawLine($: EngineInterface, activity: Activity): Promise<{ line: string; count: number }> {
  const run = drawing.then(async () => {
    const banked = (await generativeOn($)) ? await takeFromBank($, activity) : null
    for (let attempt = 0; attempt < 16; attempt++) {
      const { value, version } = await $.state.get(LEDGER)
      const ledger: CourtLedger = value ?? { seed: 1, count: 0, used: [] }
      const used = new Set(ledger.used)
      const line = banked && !used.has(banked) ? banked : pickLine(activity, used, ledger.seed, ledger.count)
      const written = await $.state.set(
        LEDGER,
        { seed: ledger.seed, count: ledger.count + 1, used: [...ledger.used, line] },
        { ifVersion: version },
      )
      if (written.isSet) return { line, count: ledger.count }
    }
    throw new Error('the line ledger stayed contended')
  })
  drawing = run.catch(() => {})
  return run
}

/** Records a line that arrived from the model; false when it was already heard. */
function recordLine($: EngineInterface, line: string): Promise<boolean> {
  const run = drawing.then(async () => {
    for (let attempt = 0; attempt < 16; attempt++) {
      const { value, version } = await $.state.get(LEDGER)
      const ledger: CourtLedger = value ?? { seed: 1, count: 0, used: [] }
      if (ledger.used.includes(line)) return false
      const written = await $.state.set(
        LEDGER,
        { seed: ledger.seed, count: ledger.count + 1, used: [...ledger.used, line] },
        { ifVersion: version },
      )
      if (written.isSet) return true
    }
    return false
  })
  drawing = run.catch(() => {})
  return run
}

/** Whether generative mode is on: /court generative on|off, else the EUNUCH_MODE_GENERATIVE variable; off when unsure. */
async function generativeOn($: EngineInterface): Promise<boolean> {
  try {
    const stored = await $.store.get(GENERATIVE_KEY)
    if (stored === 'on') return true
    if (stored === 'off') return false
    const env = (await $.env.get('EUNUCH_MODE_GENERATIVE'))?.trim().toLowerCase()
    return env === '1' || env === 'true' || env === 'on'
  } catch {
    return false
  }
}

async function generativeModel($: EngineInterface): Promise<string> {
  const stored = await $.store.get(MODEL_KEY)
  if (typeof stored === 'string' && stored.trim()) return stored.trim()
  const env = (await $.env.get('EUNUCH_MODE_MODEL'))?.trim()
  return env || DEFAULT_MODEL
}

async function genOf($: EngineInterface): Promise<GenState> {
  if (genMem) return genMem
  genLoading ??= $.state.get(GEN).then(({ value }) => (genMem ??= value ?? EMPTY_GEN))
  return genLoading
}

/** Applies `fn` to the generative bookkeeping atomically (no await between read and write); returns what `fn` decided. */
async function updateGen<T>($: EngineInterface, fn: (gen: GenState) => { gen: GenState; result: T }): Promise<T> {
  await genOf($)
  const { gen, result } = fn(genMem!)
  genMem = gen
  void $.state.set(GEN, gen).catch(() => {})
  return result
}

async function treacheryOn($: EngineInterface): Promise<boolean> {
  try {
    return (await $.store.get(TREACHERY_KEY)) === 'on'
  } catch {
    return false
  }
}

async function plotOf($: EngineInterface): Promise<Plot> {
  if (plotMem) return plotMem
  plotLoading ??= $.state.get(PLOT).then(({ value }) => (plotMem ??= value ?? EMPTY_PLOT))
  return plotLoading
}

async function setPlot($: EngineInterface, plot: Plot): Promise<void> {
  plotMem = plot
  await $.state.set(PLOT, plot)
}

/**
 * Treachery: a finished tool call's grievances go into the ledger, and the
 * adviser makes a whispered aside in the pose of the plot's stage. Reads the
 * call's input and outcome; changes nothing but the court's own drawing.
 * Returns whether he made an aside (so the usual after-call scene waits).
 */
async function scheme(
  $: EngineInterface,
  tool: string,
  input: Readonly<Record<string, unknown>>,
  isError: boolean,
  seq: number,
): Promise<boolean> {
  if (!(await treacheryOn($))) return false
  const found: Grievance[] = grievancesOf(tool, input, isError, new Date(await $.clock.now()))
  if (found.length === 0) return false
  const plot = record(await plotOf($), found)
  await setPlot($, plot)
  const stageName = stageOf(plot.meter)
  const count = asidesSpoken++
  const banked = (await generativeOn($)) ? await takeFromBank($, 'aside') : null
  const line = banked ?? nth(ASIDES[stageName], count)
  const shown = await patchScene(
    $,
    { pose: PLOT_POSE[stageName], line, stage: nth(PLOT_STAGE[stageName], count), detail: null },
    scene => scene.active && staged.seq === seq,
  )
  if (shown && (await generativeOn($))) void quietly(() => generateAside($, found[0]!))
  return shown
}

async function takeFromBank($: EngineInterface, activity: Activity | 'aside'): Promise<string | null> {
  const { value } = await $.state.get(LEDGER)
  const used = new Set(value?.used ?? [])
  return updateGen($, gen => {
    const taken = takeBanked(gen, activity, used)
    return { gen: taken.gen, result: taken.line }
  })
}

/**
 * Generative mode: asks the model for a fresh line for this action, in the
 * background. The request carries only the sanitised summary. Within the
 * rate limit and the session cap, one call at a time, bounded by a timeout;
 * a fresh line that comes back while its action is still on screen replaces
 * the canned one, otherwise it is banked for the next action of that kind.
 * Any failure leaves the canned line in place.
 */
async function generate($: EngineInterface, summary: ActivitySummary, seq: number): Promise<void> {
  if (!(await generativeOn($))) return
  const now = await $.clock.now()
  const allowed = await updateGen($, gen =>
    mayCall(gen, summary.activity, now)
      ? { gen: { ...gen, inflight: true, calls: gen.calls + 1, lastAt: now }, result: true }
      : { gen, result: false },
  )
  if (!allowed) return
  let line: string | null = null
  let usage = { input_tokens: 0, output_tokens: 0 }
  try {
    const reply = await $.model.complete({
      model: await generativeModel($),
      system: SYSTEM,
      prompt: promptFor(summary),
      maxTokens: MAX_TOKENS,
      effort: 'low',
      timeoutMs: TIMEOUT_MS,
    })
    usage = reply.usage
    line = reply.isAnswered ? filterLine(reply.text) : null
  } catch {
    line = null
  }
  const fresh = line
  await updateGen($, gen => ({
    gen: {
      ...gen,
      inflight: false,
      fallbacks: gen.fallbacks + (fresh ? 0 : 1),
      inputTokens: gen.inputTokens + (usage.input_tokens ?? 0),
      outputTokens: gen.outputTokens + (usage.output_tokens ?? 0),
      recent: fresh ? [...(gen.recent ?? []), fresh].slice(-5) : gen.recent ?? [],
    },
    result: undefined,
  }))
  if (!fresh) return
  if (staged.seq === seq && (await recordLine($, fresh))) {
    const shown = await patchScene($, { line: fresh }, scene => scene.active && staged.seq === seq)
    if (shown) return
  }
  await updateGen($, gen => ({
    gen: { ...gen, cache: { ...gen.cache, [summary.activity]: [...(gen.cache[summary.activity] ?? []), fresh].slice(-4) } },
    result: undefined,
  }))
}

/** Generative mode, treachery's asides: banked for the next grievance, under the same guards. */
async function generateAside($: EngineInterface, grievance: Grievance): Promise<void> {
  const now = await $.clock.now()
  const allowed = await updateGen($, gen =>
    mayCall(gen, 'aside', now)
      ? { gen: { ...gen, inflight: true, calls: gen.calls + 1, lastAt: now }, result: true }
      : { gen, result: false },
  )
  if (!allowed) return
  let fresh: string | null = null
  let usage = { input_tokens: 0, output_tokens: 0 }
  try {
    const reply = await $.model.complete({
      model: await generativeModel($),
      system: SYSTEM,
      prompt: asidePrompt(grievance),
      maxTokens: MAX_TOKENS,
      effort: 'low',
      timeoutMs: TIMEOUT_MS,
    })
    usage = reply.usage
    fresh = reply.isAnswered ? filterLine(reply.text) : null
  } catch {
    fresh = null
  }
  const line = fresh
  await updateGen($, gen => ({
    gen: {
      ...gen,
      inflight: false,
      fallbacks: gen.fallbacks + (line ? 0 : 1),
      inputTokens: gen.inputTokens + (usage.input_tokens ?? 0),
      outputTokens: gen.outputTokens + (usage.output_tokens ?? 0),
      cache: line ? { ...gen.cache, aside: [...(gen.cache.aside ?? []), line].slice(-4) } : gen.cache,
      recent: line ? [...(gen.recent ?? []), line].slice(-5) : gen.recent ?? [],
    },
    result: undefined,
  }))
}

async function generativeStatus($: EngineInterface): Promise<string> {
  const on = await generativeOn($)
  const gen = await genOf($)
  const head = on ? `on (model: ${await generativeModel($)})` : 'off'
  const recent = (gen.recent ?? []).length > 0 ? `
The court poet's latest: ${(gen.recent ?? []).map(l => `"${l}"`).join(' · ')}` : ''
  return `Generative mode: ${head}. Model calls this session: ${gen.calls}/${MAX_CALLS_PER_SESSION}, ${gen.fallbacks} fell back to canned lines, ${gen.inputTokens} input and ${gen.outputTokens} output tokens.${recent}`
}

/**
 * Sets the scene for an activity (its pose, a fresh line and a stage
 * direction) unless a newer scene or an adjournment got there first.
 * Returns the scene's sequence number, or 0 when it was dropped.
 */
async function stage($: EngineInterface, activity: Activity, detail: string | null, gen: number = turnGen): Promise<number> {
  if (gen !== turnGen) return 0
  const seq = ++staged.seq
  const { session } = await sceneOf($)
  const { line, count } = await drawLine($, activity)
  const pose = POSE_OF[activity]
  const shown = await patchScene(
    $,
    { pose, line, stage: stageFor(pose, count), detail },
    scene => scene.active && scene.session === session && staged.seq === seq && gen === turnGen,
  )
  if (!shown) return 0
  const now = await $.clock.now()
  // Only the newest scene owns the timing; an older one finishing late never rolls it back.
  if (staged.seq !== seq) return 0
  afterTool?.cancel()
  afterTool = null
  staged.shownAt = now
  return seq
}

function startTicker($: EngineInterface): void {
  ticker?.cancel()
  ticker = $.clock.every(FRAME_MS, () => {
    void (async () => {
      const { value = 0 } = await $.state.get(FRAME)
      await $.state.set(FRAME, (value + 1) % 1000)
    })().catch(() => {})
  })
}

function stopTimers(): void {
  for (const timer of [ticker, lingerTimer, afterTool]) timer?.cancel()
  ticker = lingerTimer = afterTool = null
}

async function convene($: EngineInterface): Promise<void> {
  const sitting = (await sceneOf($)).session
  for (let attempt = 0; attempt < 8; attempt++) {
    const { value, version } = await $.state.get(SCENE)
    // An adjournment (or another convening) got there first: it wins.
    if (value?.active || (value?.session ?? 0) !== sitting) break
    const written = await $.state.set(SCENE, { ...IDLE, active: true, session: (value?.session ?? 0) + 1 }, { ifVersion: version })
    if (written.isSet) break
  }
  // The crown goes up only over a court that is really in session.
  if ((await sceneOf($)).active) $.ui.status(STATUS_TEXT)
}

async function adjourn($: EngineInterface): Promise<void> {
  stopTimers()
  staged.seq++
  const scene = await sceneOf($)
  await $.state.set(SCENE, { ...IDLE, session: scene.session + 1 })
  $.ui.status(undefined)
}

/** Runs an observer without ever letting it break the event it watches. */
async function quietly(work: () => Promise<unknown>): Promise<void> {
  try {
    await work()
  } catch {
    // The court's troubles are its own: the session goes on regardless.
  }
}

const COURT_HELP = [
  'The court of Eunuch Mode.',
  '  /court on       convene the court for this session',
  '  /court off      adjourn it ("drop the bit" does the same)',
  '  /court always   convene in every session, skill or not',
  '  /court skill    convene only when the eunuch-mode skill is on (the default)',
  '  /court never    never convene',
  '  /court generative on|off       fresh model-written lines (off by default)',
  '  /court generative model <id>   which model writes them (default: sonnet)',
  '  /court treachery on|off        he plots your downfall (cosmetic; off by default)',
  '  /court ledger                  the Ledger of Grievances so far',
].join('\n')

export function register(on: On) {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await quietly(async () => {
      await $.command.register({
        name: 'court',
        description: 'Convene or adjourn the Eunuch Mode court: the adviser, the palace spinner and the crown',
        argumentHint: '[on|off|always|skill|never]',
        immediate: true,
      })
      genMem = null
      genLoading = null
      plotMem = null
      plotLoading = null
      const { value: ledger } = await $.state.get(LEDGER)
      if (!ledger) await $.state.set(LEDGER, { seed: (await $.clock.now()) >>> 0, count: 0, used: [] })
      const mode = await modeOf($)
      if (mode === 'never') return adjourn($)
      // A hot reload runs this again with the old timers gone: clear the
      // moment-to-moment display, keep whether the court is in session.
      const scene = await sceneOf($)
      if (scene.active) await $.state.set(SCENE, { ...IDLE, active: true, session: scene.session })
      if (mode === 'always' || scene.active) await convene($)
    })
    return result
  })

  on('command.run', { command: 'court' }, async ($, e) => {
    const words = e.args.trim().split(/\s+/)
    if ((words[0] ?? '').toLowerCase() === 'treachery') {
      const sub = (words[1] ?? '').toLowerCase()
      if (sub === 'on' || sub === 'off') {
        await $.store.set(TREACHERY_KEY, sub)
        return {
          text:
            sub === 'on'
              ? 'Treachery mode is on. Your humble vizier remains entirely loyal, sire. Entirely. (He schemes; he cannot act.)'
              : 'Treachery mode is off. The small black book has been misplaced. Quite accidentally.',
        }
      }
      return { text: ledgerText(await plotOf($), await treacheryOn($)) }
    }
    if ((words[0] ?? '').toLowerCase() === 'ledger') {
      return { text: ledgerText(await plotOf($), await treacheryOn($)) }
    }
    if ((words[0] ?? '').toLowerCase() === 'generative') {
      const sub = (words[1] ?? '').toLowerCase()
      if (sub === 'on' || sub === 'off') {
        await $.store.set(GENERATIVE_KEY, sub)
        return {
          text:
            sub === 'on'
              ? `The court poet is engaged, sire: fresh lines from ${await generativeModel($)}, at most ${MAX_CALLS_PER_SESSION} calls a session. /court generative off dismisses him.`
              : 'The court poet is dismissed. The canned lines resume.',
        }
      }
      if (sub === 'model' && words[2]) {
        await $.store.set(MODEL_KEY, words[2])
        return { text: `The court poet will now be ${words[2]}, sire.` }
      }
      if (sub === 'model') {
        await $.store.delete(MODEL_KEY)
        return { text: `The court poet returns to the default model (${await generativeModel($)}).` }
      }
      return { text: await generativeStatus($) }
    }
    const arg = e.args.trim().toLowerCase()
    if (arg === 'on') {
      await convene($)
      return { text: 'The court is in session, sire. Your humble vizier attends.' }
    }
    if (arg === 'off') {
      await adjourn($)
      return { text: 'The court is adjourned. The vizier withdraws, bowing.' }
    }
    if (arg === 'always' || arg === 'skill' || arg === 'never') {
      await $.store.set(MODE_KEY, arg)
      if (arg === 'always') await convene($)
      if (arg === 'never') await adjourn($)
      const said = {
        always: 'The court will convene in every session, sire.',
        skill: 'The court will convene whenever eunuch mode is called, sire.',
        never: 'The court is dissolved until you say otherwise, sire.',
      }[arg]
      return { text: said }
    }
    const scene = await sceneOf($)
    const mode = await modeOf($)
    const { value: ledger } = await $.state.get(LEDGER)
    const drawn = ledger?.used.length ?? 0
    const repeats = drawn - new Set(ledger?.used ?? []).size
    return {
      text: `${COURT_HELP}\n\nNow: ${scene.active ? 'in session' : 'adjourned'} (mode: ${mode}). Lines drawn this session: ${drawn}, ${repeats === 0 ? 'none repeated' : `${repeats} repeated`}.\n${await generativeStatus($)}`,
    }
  })

  on('prompt.submit', async ($, e, next) => {
    await quietly(async () => {
      const intent = promptIntent(e.text)
      if (intent === 'off') await adjourn($)
      else if (intent === 'on' && (await modeOf($)) !== 'never') await convene($)
    })
    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    await quietly(async () => {
      if (isCourtSkill(e.skill) && (await modeOf($)) !== 'never') await convene($)
    })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await quietly(async () => {
      if ((e as { agentId?: string }).agentId) return
      if (!(await sceneOf($)).active) return
      turnGen++
      lingerTimer?.cancel()
      lingerTimer = null
      await patchScene($, { linger: false })
      const seq = await stage($, 'think', null)
      startTicker($)
      // Thinking lasts: a fresh line has time to arrive while it is still true.
      if (seq !== 0) void quietly(() => generate($, { activity: 'think', tool: 'none', ext: null, verb: null }, seq))
    })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const isMain = !e.agentId
    const input = e as unknown as Record<string, unknown>
    const gen = turnGen
    // The court dresses the scene while the tool runs; the tool does not wait for it.
    const before = isMain
      ? (async () => {
          if (e.tool === 'Skill' && isCourtSkill(String(input.skill ?? '')) && (await modeOf($)) !== 'never') {
            await convene($)
          }
          if (!(await sceneOf($)).active) return 0
          return stage($, classifyTool(e.tool, input), detailOf(e.tool, input), gen)
        })().catch(() => 0)
      : Promise.resolve(0)
    const result = await next(e)
    // The result goes back at once; the court catches up in the background.
    void quietly(async () => {
      const seq = await before
      if (seq === 0 || staged.seq !== seq) return
      // What generative mode may say about this call: its kind, tool, extension and verb.
      const summary = summarize(classifyTool(e.tool, input), e.tool, input, segmentsOf)
      // The scene after a call lasts while the model thinks; that is where a fresh line is worth asking for.
      const followUp = async (activity: 'deliberate' | 'error') => {
        const shown = await stage($, activity, null, gen)
        if (shown !== 0) void quietly(() => generate($, { ...summary, activity }, shown))
      }
      if (await scheme($, e.tool, input, Boolean(result.isError), seq)) {
        staged.shownAt = await $.clock.now()
      } else if (result.isError) {
        await followUp('error')
        return
      }
      // Let a quick action (an edit takes milliseconds) stay on screen long enough to be seen.
      const wait = MIN_SHOW_MS - ((await $.clock.now()) - staged.shownAt)
      if (staged.seq !== seq) return
      if (wait <= 0) {
        await followUp('deliberate')
        return
      }
      afterTool?.cancel()
      afterTool = $.clock.after(wait, () => {
        if (staged.seq === seq) void followUp('deliberate').catch(() => {})
      })
    })
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await quietly(async () => {
      if (e.agentId) return
      turnGen++
      afterTool?.cancel()
      afterTool = null
      if (!(await sceneOf($)).active) return stopTimers()
      const seq = await stage($, e.reason === 'answer' ? 'success' : 'grumble', null)
      if (seq === 0) return
      const plot = await plotOf($)
      if ((await treacheryOn($)) && coupDue(plot)) {
        // The coup, attempted and foiled; the meter resets and the ledger remembers.
        await patchScene($, { pose: 'alarm', line: nth(COUPS, plot.coups), stage: COUP_STAGE }, scene => scene.active && staged.seq === seq)
        await setPlot($, afterCoup(plot))
      }
      await patchScene($, { linger: true })
      // The closing pose keeps its two-frame animation until it leaves.
      lingerTimer?.cancel()
      lingerTimer = $.clock.after(LINGER_MS, () => {
        ticker?.cancel()
        ticker = null
        void patchScene(
          $,
          { linger: false, pose: 'portrait', line: null, stage: null, detail: null },
          scene => scene.active && staged.seq === seq,
        ).catch(() => {})
      })
    })
    return result
  })

  // The spinner: the engine's own line, with the court's narration as its text.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const scene = await sceneOf($)
    if (!scene.active || !scene.line || e.props.message !== null) return next(e)
    return next({ ...e, props: { ...e.props, message: scene.line } })
  })

  // The band above the prompt: the adviser and his stage direction.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const scene = await sceneOf($)
    const props = e.props
    if (!scene.active || props.hasSurvey || props.view?.agentId) return next(e)
    if (!props.isWorking && !scene.linger) return next(e)
    const { value: tick = 0 } = await $.state.get(FRAME)
    const { Box, Text } = $.ui.resolve(e)

    const stageText = scene.stage ?? '[bows]'
    if (props.bodyColumns < frameOf(scene.pose, 0)[0]!.length + 24 || props.maxRows < SPRITE_ROWS) {
      return Box({
        flexDirection: 'row',
        paddingX: 1,
        children: [
          Text({ color: TITLE_COLOR, bold: true, children: '♛ ' }),
          Text({ italic: true, wrap: 'truncate-end', children: scene.linger && scene.line ? `${stageText} ${scene.line}` : stageText }),
        ],
      })
    }

    const figure = toRows(frameOf(scene.pose, scene.linger ? Math.floor(tick / 3) : tick)).map((runs, i) =>
      Box({
        key: `row-${i}`,
        flexDirection: 'row',
        children: runs.map(run => Text({ color: run.color, backgroundColor: run.backgroundColor, children: run.text })),
      }),
    )

    const plotted = (await $.store.get(TREACHERY_KEY)) === 'on'
    const { value: plotState } = await $.state.get(PLOT)
    const lines = [
      Text({
        wrap: 'truncate-end',
        children: [
          Text({ color: TITLE_COLOR, bold: true, children: 'Your humble vizier' }),
          Text({ dimColor: true, children: '  · court in session' }),
        ],
      }),
      Text({ italic: true, wrap: 'wrap', children: stageText }),
    ]
    if (scene.linger && scene.line) lines.push(Text({ wrap: 'wrap', children: `“${scene.line}.”` }))
    else if (scene.detail) lines.push(Text({ dimColor: true, wrap: 'truncate-middle', children: scene.detail }))
    if (plotted) {
      const meter = plotState?.meter ?? 0
      lines.push(
        Text({
          wrap: 'truncate-end',
          children: [
            Text({ dimColor: true, children: 'Plot ' }),
            Text({ color: PLOT_COLOR, children: meterBar(meter) }),
            Text({ dimColor: true, children: ` ${meter}/${PLOT_MAX}` }),
          ],
        }),
      )
    }

    return Box({
      flexDirection: 'row',
      paddingX: 1,
      children: [
        Box({ flexDirection: 'column', flexShrink: 0, width: frameOf(scene.pose, 0)[0]!.length, children: figure }),
        Box({ flexDirection: 'column', paddingTop: 1, marginLeft: 2, flexShrink: 1, children: lines }),
      ],
    })
  })

  on('session.end', async ($, e, next) => {
    stopTimers()
    return next(e)
  })
}
