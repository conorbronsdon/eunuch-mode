// Eunuch Mode court: while the eunuch-mode skill is on, the palace adviser
// stands above the prompt in pixel art, the spinner narrates each action in
// court language, and the status line reads "👑 Court in session".
//
// Every hook observes and passes the event on with next(e). The only thing
// it rewrites is the spinner's display text; it never blocks, denies or
// changes a tool call, a prompt or the model's output, and it makes no model
// calls (all narration is curated text in lines.ts).

import type { EngineInterface, On, Timer } from 'claude-code'
import type { CourtLedger, CourtScene } from '../types'
import { POSE_OF, classifyTool, detailOf, isCourtSkill, pickLine, promptIntent, stageFor, type Activity } from './lines.ts'
import { frameOf, toRows } from './sprites.ts'

const SCENE = { plugin: 'eunuch-mode-court', key: 'scene' } as const
const LEDGER = { plugin: 'eunuch-mode-court', key: 'ledger' } as const
const FRAME = { plugin: 'eunuch-mode-court', key: 'frame' } as const

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
  pose: 'portrait',
  line: null,
  stage: null,
  detail: null,
  linger: false,
}

let ticker: Timer | null = null
let lingerTimer: Timer | null = null
let afterTool: Timer | null = null
// Which scene is newest, so a delayed return to thinking never overwrites a later action.
let staged = { seq: 0, at: 0 }

async function sceneOf($: EngineInterface): Promise<CourtScene> {
  const { value } = await $.state.get(SCENE)
  return value ?? IDLE
}

async function patchScene($: EngineInterface, patch: Partial<CourtScene>): Promise<CourtScene> {
  const next = { ...(await sceneOf($)), ...patch }
  await $.state.set(SCENE, next)
  return next
}

async function modeOf($: EngineInterface): Promise<Mode> {
  const stored = await $.store.get(MODE_KEY)
  return stored === 'always' || stored === 'never' ? stored : 'skill'
}

/** Draws a line no one has heard this session; retries if another hook drew at the same moment. */
async function drawLine($: EngineInterface, activity: Activity): Promise<{ line: string; count: number }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { value, version } = await $.state.get(LEDGER)
    const ledger: CourtLedger = value ?? { seed: 1, count: 0, used: [] }
    const line = pickLine(activity, new Set(ledger.used), ledger.seed, ledger.count)
    const written = await $.state.set(
      LEDGER,
      { seed: ledger.seed, count: ledger.count + 1, used: [...ledger.used, line] },
      { ifVersion: version },
    )
    if (written.isSet) return { line, count: ledger.count }
  }
  return { line: pickLine(activity, new Set(), Date.now(), 0), count: 0 }
}

/** Sets the scene for an activity: its pose, a fresh line and a stage direction. Returns its sequence number. */
async function stage($: EngineInterface, activity: Activity, detail: string | null): Promise<number> {
  afterTool?.cancel()
  afterTool = null
  const seq = ++staged.seq
  staged = { seq, at: await $.clock.now() }
  const { line, count } = await drawLine($, activity)
  const pose = POSE_OF[activity]
  await patchScene($, { pose, line, stage: stageFor(pose, count), detail })
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

function stopTicker(): void {
  ticker?.cancel()
  ticker = null
}

async function convene($: EngineInterface): Promise<void> {
  const scene = await sceneOf($)
  if (!scene.active) await $.state.set(SCENE, { ...IDLE, active: true })
  $.ui.status(STATUS_TEXT)
}

async function adjourn($: EngineInterface): Promise<void> {
  stopTicker()
  lingerTimer?.cancel()
  lingerTimer = null
  await $.state.set(SCENE, IDLE)
  $.ui.status(undefined)
}

/** Runs an observer without ever letting it break the event it watches. */
async function quietly(work: () => Promise<void>): Promise<void> {
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
      const { value: ledger } = await $.state.get(LEDGER)
      if (!ledger) await $.state.set(LEDGER, { seed: (await $.clock.now()) >>> 0, count: 0, used: [] })
      const mode = await modeOf($)
      const scene = await sceneOf($)
      if (mode === 'never') await adjourn($)
      else if (mode === 'always' || scene.active) await convene($)
    })
    return result
  })

  on('command.run', { command: 'court' }, async ($, e) => {
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
    return { text: `${COURT_HELP}\n\nNow: ${scene.active ? 'in session' : 'adjourned'} (mode: ${mode}).` }
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
      const scene = await sceneOf($)
      if (!scene.active) return
      lingerTimer?.cancel()
      lingerTimer = null
      await patchScene($, { linger: false })
      await stage($, 'think', null)
      startTicker($)
    })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const isMain = !e.agentId
    let seq = 0
    await quietly(async () => {
      if (e.tool === 'Skill' && isCourtSkill(String((e as { skill?: unknown }).skill ?? ''))) await convene($)
      if (!isMain || !(await sceneOf($)).active) return
      const input = e as unknown as Record<string, unknown>
      seq = await stage($, classifyTool(e.tool, input), detailOf(e.tool, input))
    })
    const result = await next(e)
    if (seq !== 0) {
      await quietly(async () => {
        if (!(await sceneOf($)).active || staged.seq !== seq) return
        if (result.isError) {
          await stage($, 'error', null)
          return
        }
        // Let a quick action (an edit takes milliseconds) stay on screen long enough to be seen.
        const wait = MIN_SHOW_MS - ((await $.clock.now()) - staged.at)
        if (wait <= 0) {
          await stage($, 'deliberate', null)
          return
        }
        afterTool = $.clock.after(wait, () => {
          if (staged.seq === seq) void stage($, 'deliberate', null).catch(() => {})
        })
      })
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await quietly(async () => {
      if (e.agentId) return
      stopTicker()
      afterTool?.cancel()
      afterTool = null
      const scene = await sceneOf($)
      if (!scene.active) return
      await stage($, e.reason === 'answer' ? 'success' : 'grumble', null)
      await patchScene($, { linger: true })
      lingerTimer?.cancel()
      lingerTimer = $.clock.after(LINGER_MS, () => {
        void patchScene($, { linger: false, pose: 'portrait', line: null, stage: null, detail: null }).catch(() => {})
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
    if (props.bodyColumns < SPRITE_COLUMNS + 24 || props.maxRows < SPRITE_ROWS) {
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

    const lines = [
      Text({
        wrap: 'truncate-end',
        children: [
          Text({ color: TITLE_COLOR, bold: true, children: 'Your humble vizier' }),
          Text({ dimColor: true, children: '  · court in session' }),
        ],
      }),
      Text({ italic: true, wrap: 'truncate-end', children: stageText }),
    ]
    if (scene.linger && scene.line) lines.push(Text({ wrap: 'truncate-end', children: `“${scene.line}.”` }))
    else if (scene.detail) lines.push(Text({ dimColor: true, wrap: 'truncate-middle', children: scene.detail }))

    return Box({
      flexDirection: 'row',
      paddingX: 1,
      children: [
        Box({ flexDirection: 'column', flexShrink: 0, width: SPRITE_COLUMNS, children: figure }),
        Box({ flexDirection: 'column', paddingTop: 1, marginLeft: 2, flexShrink: 1, children: lines }),
      ],
    })
  })

  on('session.end', async ($, e, next) => {
    stopTicker()
    lingerTimer?.cancel()
    return next(e)
  })
}
