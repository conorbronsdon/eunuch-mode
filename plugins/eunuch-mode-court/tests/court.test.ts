// The court against Claude Code's own runtime: `claude plugin test plugins/eunuch-mode-court`.
// Hooks registered with `on` here sit beneath the mod and answer for Claude Code.
import { describe, expect, mock, test } from 'claude-code/testing'
import { POOLS, STAGE } from '../hooks/lines.ts'

const BAND = { hasSurvey: false, isWorking: true, maxRows: 12, bodyColumns: 100, scroll: { top: 0, bodyRows: 12 }, view: {} }
const SPIN = { word: 'Sauteing', message: null, suffix: '…', mode: 'tool-use' }

function world(
  on: any,
  statuses: (string | undefined)[],
  stores: Record<string, unknown> = {},
  duringCall: (e: any) => Promise<void> = async () => {},
) {
  const clock = mock.clock(on)
  mock.store(on, stores)
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', ($: any, e: any) => ({ value: { command: e.name } }))
  on('ui.status', ($: any, e: any) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  // Claude Code's own drawing, beneath the mod: the spinner's word or message, an empty band.
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: e.component === 'Spinner' ? (e.props.message ?? e.props.word) : '' })
  })
  on('skill.prompt', ($: any, e: any) => ({ text: e.text }))
  on('turn.start', ($: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', async ($: any, e: any) => {
    await duringCall(e)
    return e.command === 'false' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true }, text: 'ok' }
  })
  return clock
}

async function start($: any) {
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
}

async function mountBand($: any, props: object = BAND) {
  return $.ui.mount({ plugin: 'eunuch-mode-court', surface: 'terminal', component: 'AbovePrompt', props })
}

async function spinnerMessage($: any): Promise<string | null> {
  const ui = await $.ui.mount({ plugin: 'eunuch-mode-court', surface: 'terminal', component: 'Spinner', props: SPIN })
  const tree = (await ui.find({ type: 'Text', text: /./ })) as any
  await ui.unmount()
  return tree ? tree.text : null
}

describe('court', () => {
  test('silent until the court is convened: no band, no status, the engine\'s own spinner', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
    expect(statuses).toEqual([])
  })

  test('"eunuch mode" in a prompt convenes it: crown, adviser, palace narration', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.prompt.submit({ text: 'Eunuch mode. Should I rewrite this in Rust?', wait: false, origin: { kind: 'composer' } } as any)
    expect(statuses.at(-1)).toBe('👑 Court in session')

    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /Your humble vizier/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\[(whispers|leans|glances|murmurs)/ })).toBeDefined()

    await $.tool.call({ tool: 'Edit', file_path: '/work/src/app.ts', old_string: 'a', new_string: 'b' } as any)
    await ui.unmount()
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    const after = await mountBand($, { ...BAND, isWorking: false })
    expect(await after.find({ type: 'Text', text: /“.+\.”/ })).toBeDefined()
    await after.unmount()
  })

  test('the spinner narrates the tool in court language, and treason in alarm', async ($, on) => {
    const statuses: (string | undefined)[] = []
    let seenDuringCall: string | null = null
    world(on, statuses, {}, async () => {
      seenDuringCall = await spinnerMessage($)
    })
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)

    await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' } as any)
    expect(POOLS.treason).toContain(seenDuringCall)

    await $.tool.call({ tool: 'Read', file_path: '/work/README.md' } as any)
    expect(POOLS.read).toContain(seenDuringCall)
  })

  test('a failed command turns the adviser to side-eye with an error line', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    const result: any = await $.tool.call({ tool: 'Bash', command: 'false' } as any)
    expect(result.isError).toBe(true)
    expect(POOLS.error).toContain(await spinnerMessage($))
    const ui = await mountBand($)
    const stage = (await ui.find({ type: 'Text', text: /^\[/ })) as any
    expect(STAGE.sideeye).toContain(stage.text)
    await ui.unmount()
  })

  test('"drop the bit" adjourns: status cleared, band and spinner handed back', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.prompt.submit({ text: 'vizier mode please', wait: false, origin: { kind: 'composer' } } as any)
    await $.prompt.submit({ text: 'ok, drop the bit', wait: false, origin: { kind: 'composer' } } as any)
    expect(statuses.at(-1)).toBeUndefined()
    await $.turn.start({ text: 'go', turnId: 't2' } as any)
    expect(await spinnerMessage($)).toBe('Sauteing')
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
  })

  test('the skill itself convenes the court, through /eunuch-mode or the Skill tool', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.skill.prompt({ skill: 'eunuch-mode', text: '# Eunuch Mode' } as any)
    expect(statuses.at(-1)).toBe('👑 Court in session')
  })

  test('/court never keeps it dissolved even when the skill is called', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'never', origin: { kind: 'composer' } } as any)
    await $.prompt.submit({ text: 'eunuch mode', wait: false, origin: { kind: 'composer' } } as any)
    expect(statuses.filter(s => s !== undefined)).toEqual([])
  })

  test('/court always convenes at the start of the next session', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses, { mode: 'always' })
    await start($)
    expect(statuses.at(-1)).toBe('👑 Court in session')
  })

  test('never touches the work: a tool call reaches Claude Code exactly as the model sent it, result unchanged', async ($, on) => {
    const statuses: (string | undefined)[] = []
    const seen: any[] = []
    world(on, statuses, {}, async e => {
      seen.push({ tool: e.tool, command: e.command })
    })
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    const result: any = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
    expect(seen).toEqual([{ tool: 'Bash', command: 'rm -rf build' }])
    expect(result.text).toBe('ok')
    expect(result.deny).toBeUndefined()
  })

  test('a quick edit keeps the scroll on screen for a beat, then the adviser goes back to whispering', async ($, on) => {
    const statuses: (string | undefined)[] = []
    const clock = world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await $.tool.call({ tool: 'Edit', file_path: '/work/src/app.ts', old_string: 'a', new_string: 'b' } as any)
    expect(POOLS.edit).toContain(await spinnerMessage($))
    const ui = await mountBand($)
    expect(STAGE.scribble).toContain(((await ui.find({ type: 'Text', text: /^\[/ })) as any).text)
    expect(await ui.find({ type: 'Text', text: 'app.ts' })).toBeDefined()
    await ui.unmount()
    await clock.advance(1600)
    expect(POOLS.deliberate).toContain(await spinnerMessage($))
  })

  test('parallel tool calls each draw a different line, and every one is recorded', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    const spoken = async () => {
      const { text } = await $.command.run({ command: 'court', args: '', origin: { kind: 'composer' } } as any)
      return Number(/Lines spoken this session: (\d+)/.exec(text ?? '')?.[1] ?? -1)
    }
    const before = await spoken()
    const seen: (string | null)[] = []
    await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map(async f => {
        await $.tool.call({ tool: 'Read', file_path: `/work/${f}.ts` } as any)
        seen.push(await spinnerMessage($))
      }),
    )
    // Five calls staged at once: five lines drawn and recorded (the ledger refuses a repeat by construction).
    expect((await spoken()) - before).toBeGreaterThanOrEqual(5)
    expect(seen.every(line => line !== null && line !== 'Sauteing')).toBe(true)
  })

  test('/court off during a tool call stays off when the call finishes', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses, {}, async () => {
      await $.command.run({ command: 'court', args: 'off', origin: { kind: 'composer' } } as any)
    })
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await $.tool.call({ tool: 'Edit', file_path: '/work/a.ts', old_string: 'a', new_string: 'b' } as any)
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    expect(statuses.at(-1)).toBeUndefined()
    expect(await spinnerMessage($)).toBe('Sauteing')
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
  })

  test('a subagent\'s Skill call does not convene the court, and /court never holds against the main loop\'s', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.tool.call({ tool: 'Skill', skill: 'eunuch-mode', agentId: 'sub-1' } as any)
    expect(statuses.filter(s => s !== undefined)).toEqual([])
    await $.command.run({ command: 'court', args: 'never', origin: { kind: 'composer' } } as any)
    await $.tool.call({ tool: 'Skill', skill: 'eunuch-mode' } as any)
    expect(statuses.filter(s => s !== undefined)).toEqual([])
  })

  test('a reload during the closing pose clears it but keeps the court in session', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    await start($) // a hot reload runs session.start again
    const ui = await mountBand($, { ...BAND, isWorking: false })
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
    expect(statuses.at(-1)).toBe('👑 Court in session')
  })

  test('a narrow terminal gets one line, not the figure', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    const ui = await mountBand($, { ...BAND, bodyColumns: 30 })
    expect(await ui.find({ type: 'Text', text: /♛/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
  })
})
