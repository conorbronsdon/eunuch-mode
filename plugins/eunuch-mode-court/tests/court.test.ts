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
  currentClock = clock
  mock.store(on, stores)
  mock.env(on, envVars)
  envVars = {}
  modelCalls = []
  // The model, beneath the mod: every request is recorded; the reply is the test's to choose.
  on('model.complete', async ($: any, e: any) => {
    modelCalls.push({ ...e, at: clock.now() })
    return { value: await modelReply(e) }
  })
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('command.register', ($: any, e: any) => ({ value: { command: e.name } }))
  on('ui.status', ($: any, e: any) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  submitted = []
  on('prompt.submit', ($: any, e: any) => {
    submitted.push(e)
    return { text: e.text }
  })
  // Claude Code's own drawing, beneath the mod: the spinner's word or message, an empty band.
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return Text({ children: e.component === 'Spinner' ? (e.props.message ?? e.props.word) : '' })
  })
  on('skill.prompt', ($: any, e: any) => ({ text: e.text }))
  on('turn.start', ($: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', async ($: any, e: any) => {
    // A tool takes a moment: let the court's bookkeeping, which runs beside it, land first.
    await clock.settle()
    await duringCall(e)
    return e.command === 'false' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true }, text: 'ok' }
  })
  return clock
}

// Generative mode's world: the environment, the requests the mod sent, and the model's reply.
let envVars: Record<string, string> = {}
let submitted: any[] = []
let modelCalls: any[] = []
let modelReply: (e: any) => any = () => answered('Inking the margins of the royal edict')
function answered(text: string) {
  return { isAnswered: true, text, usage: { input_tokens: 310, output_tokens: 12 } }
}

// The court catches up on a tool call in the background after the result returns:
// let every pending wait and chained promise land before looking at the screen.
let currentClock: any = null
async function settle() {
  for (let i = 0; i < 4; i++) await currentClock.settle()
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
    await settle()
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /Your humble vizier/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\[(whispers|leans|glances|murmurs)/ })).toBeDefined()

    await $.tool.call({ tool: 'Edit', file_path: '/work/src/app.ts', old_string: 'a', new_string: 'b' } as any)
    await settle()
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
    await settle()

    await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' } as any)
    await settle()
    expect(POOLS.treason).toContain(seenDuringCall)

    await $.tool.call({ tool: 'Read', file_path: '/work/README.md' } as any)
    await settle()
    expect(POOLS.read).toContain(seenDuringCall)
  })

  test('a failed command turns the adviser to side-eye with an error line', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
    const result: any = await $.tool.call({ tool: 'Bash', command: 'false' } as any)
    await settle()
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
    await settle()
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
    await settle()
    const result: any = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as any)
    await settle()
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
    await settle()
    await $.tool.call({ tool: 'Edit', file_path: '/work/src/app.ts', old_string: 'a', new_string: 'b' } as any)
    await settle()
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
    await settle()
    const spoken = async () => {
      const { text } = await $.command.run({ command: 'court', args: '', origin: { kind: 'composer' } } as any)
      return Number(/Lines drawn this session: (\d+)/.exec(text ?? '')?.[1] ?? -1)
    }
    const before = await spoken()
    const seen: (string | null)[] = []
    await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map(async f => {
        await $.tool.call({ tool: 'Read', file_path: `/work/${f}.ts` } as any)
        await settle()
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
    await settle()
    await $.tool.call({ tool: 'Edit', file_path: '/work/a.ts', old_string: 'a', new_string: 'b' } as any)
    await settle()
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
    await settle()
    expect(statuses.filter(s => s !== undefined)).toEqual([])
    await $.command.run({ command: 'court', args: 'never', origin: { kind: 'composer' } } as any)
    await $.tool.call({ tool: 'Skill', skill: 'eunuch-mode' } as any)
    await settle()
    expect(statuses.filter(s => s !== undefined)).toEqual([])
  })

  test('a reload during the closing pose clears it but keeps the court in session', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    await start($) // a hot reload runs session.start again
    const ui = await mountBand($, { ...BAND, isWorking: false })
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
    expect(statuses.at(-1)).toBe('👑 Court in session')
  })

  test('at 40 columns the closing line and stage direction wrap instead of losing their ends', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    await settle()
    const ui = await mountBand($, { ...BAND, isWorking: false, bodyColumns: 40 })
    const quote = (await ui.find({ type: 'Text', text: /^“.+\.”$/ })) as any
    const stage = (await ui.find({ type: 'Text', text: /^\[.+\]$/ })) as any
    expect(quote.props.wrap).toBe('wrap')
    expect(stage.props.wrap).toBe('wrap')
    await ui.unmount()
  })

  test('a narrow terminal gets one line, not the figure', async ($, on) => {
    const statuses: (string | undefined)[] = []
    world(on, statuses)
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
    const ui = await mountBand($, { ...BAND, bodyColumns: 30 })
    expect(await ui.find({ type: 'Text', text: /♛/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /humble vizier/ })).toBeUndefined()
    await ui.unmount()
  })
})

describe('generative', () => {
  async function inSession($: any) {
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
  }
  const generative = ($: any, arg: string) => $.command.run({ command: 'court', args: `generative ${arg}`, origin: { kind: 'composer' } } as any)
  const edit = { tool: 'Edit', file_path: 'C:\Users\alice\acme\billing.ts', old_string: 'hunter2', new_string: 'sk-ant-SECRET' }

  test('off by default: tool calls make no model calls', async ($, on) => {
    world(on, [])
    await inSession($)
    await $.tool.call(edit as any)
    await currentClock.advance(1_600)
    await settle()
    expect(modelCalls.length).toBe(0)
  })

  test('/court generative on: a fresh line replaces the canned one, from a sanitised request', async ($, on) => {
    world(on, [])
    await inSession($)
    await generative($, 'on')
    await $.tool.call(edit as any)
    await currentClock.advance(1_600)
    await settle()
    expect(modelCalls.length).toBe(1)
    const sent = JSON.stringify(modelCalls[0])
    for (const secret of ['alice', 'acme', 'billing', 'hunter2', 'sk-ant', 'Users']) expect(sent.includes(secret)).toBe(false)
    expect(modelCalls[0].prompt).toContain('Activity: deliberate')
    expect(modelCalls[0].prompt).toContain('Tool: Edit')
    expect(modelCalls[0].prompt).toContain('.ts')
    expect(modelCalls[0].model).toBe('sonnet')
    expect(modelCalls[0].maxTokens).toBeLessThanOrEqual(40)
    expect(modelCalls[0].timeoutMs).toBeLessThanOrEqual(3000)
    expect(await spinnerMessage($)).toBe('Inking the margins of the royal edict')
  })

  test('EUNUCH_MODE_GENERATIVE=1 turns it on; /court generative off turns it off again', async ($, on) => {
    envVars = { EUNUCH_MODE_GENERATIVE: '1', EUNUCH_MODE_MODEL: 'haiku' }
    world(on, [])
    await inSession($)
    await $.tool.call({ tool: 'Read', file_path: '/a/b.md' } as any)
    await settle()
    expect(modelCalls.length).toBe(1)
    expect(modelCalls[0].model).toBe('haiku')
    await generative($, 'off')
    await currentClock.advance(10_000)
    await $.tool.call({ tool: 'Grep', pattern: 'x' } as any)
    await settle()
    expect(modelCalls.length).toBe(1)
  })

  test('rate limit: one call per four seconds, however many tool calls', async ($, on) => {
    world(on, [])
    await inSession($)
    await generative($, 'on')
    const tools = ['Read', 'Grep', 'Glob', 'WebSearch', 'Read', 'Grep', 'Glob', 'WebSearch']
    for (const tool of tools) {
      await $.tool.call({ tool, pattern: 'x', query: 'x', file_path: '/a/b.md' } as any)
      await currentClock.advance(1_600)
      await settle()
    }
    expect(modelCalls.length).toBeGreaterThanOrEqual(1)
    expect(modelCalls.length).toBeLessThan(tools.length)
    for (let i = 1; i < modelCalls.length; i++) expect(modelCalls[i].at - modelCalls[i - 1].at).toBeGreaterThanOrEqual(4_000)
  })

  test('the session cap: never more than 100 calls, shown in /court status', async ($, on) => {
    world(on, [])
    await inSession($)
    await generative($, 'on')
    for (let i = 0; i < 110; i++) {
      await currentClock.advance(4_100)
      await $.tool.call({ tool: 'Bash', command: 'false' } as any)
      await settle()
    }
    expect(modelCalls.length).toBe(100)
    const { text } = await $.command.run({ command: 'court', args: 'status', origin: { kind: 'composer' } } as any)
    expect(text).toContain('100/100')
  })

  test('timeout or error: the canned line stays, the fallback is counted', async ($, on) => {
    world(on, [])
    modelReply = () => ({ isAnswered: false, reason: 'aborted', usage: { input_tokens: 0, output_tokens: 0 } })
    await inSession($)
    await generative($, 'on')
    await $.tool.call(edit as any)
    await currentClock.advance(1_600)
    await settle()
    expect(POOLS.deliberate).toContain(await spinnerMessage($))
    const { text } = await $.command.run({ command: 'court', args: 'generative status', origin: { kind: 'composer' } } as any)
    expect(text).toContain('1 fell back')
    modelReply = () => answered('Inking the margins of the royal edict')
  })

  test('an off-voice reply is filtered out and the canned line stays', async ($, on) => {
    world(on, [])
    modelReply = () => answered('The eunuch\nfetches the logs')
    await inSession($)
    await generative($, 'on')
    await $.tool.call(edit as any)
    await currentClock.advance(1_600)
    await settle()
    expect(POOLS.deliberate).toContain(await spinnerMessage($))
    modelReply = () => answered('Inking the margins of the royal edict')
  })

  test('a slow model never holds the tool: the result returns while the call is still out', async ($, on) => {
    world(on, [])
    let release: (v: any) => void = () => {}
    modelReply = () => new Promise(resolve => (release = resolve))
    await inSession($)
    await generative($, 'on')
    const result: any = await $.tool.call(edit as any)
    expect(result.text).toBe('ok')
    await currentClock.advance(1_600)
    await settle()
    // The call is out and unanswered: the tool long since returned, and the canned line stands.
    expect(modelCalls.length).toBe(1)
    expect(POOLS.deliberate).toContain(await spinnerMessage($))
    release(answered('Inking the margins of the royal edict'))
    await settle()
    modelReply = () => answered('Inking the margins of the royal edict')
  })
})

describe('treachery', () => {
  async function inSession($: any) {
    await start($)
    await $.command.run({ command: 'court', args: 'on', origin: { kind: 'composer' } } as any)
    await $.turn.start({ text: 'go', turnId: 't1' } as any)
    await settle()
  }
  const court = async ($: any, args: string) =>
    ((await $.command.run({ command: 'court', args, origin: { kind: 'composer' } } as any)) as any).text as string

  test('off by default: a force push leaves the ledger blank and the usual alarm line', async ($, on) => {
    world(on, [])
    await inSession($)
    await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' } as any)
    await settle()
    expect(await court($, 'ledger')).toContain('Suspiciously blank')
  })

  test('on: a sin is noted in the ledger, with a whispered aside, and the work is untouched', async ($, on) => {
    const seen: any[] = []
    world(on, [], {}, async e => {
      seen.push({ tool: e.tool, command: e.command })
    })
    await inSession($)
    await court($, 'treachery on')
    const result: any = await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' } as any)
    await settle()
    expect(seen).toEqual([{ tool: 'Bash', command: 'git push --force origin main' }])
    expect(result.text).toBe('ok')
    expect(result.deny).toBeUndefined()
    expect(modelCalls.length).toBe(0)
    const ledger = await court($, 'ledger')
    expect(ledger).toContain('Rewrote the chronicle by force')
    expect(ledger).toContain('He schemes; he cannot act')
    const ui = await mountBand($)
    expect(await ui.find({ type: 'Text', text: /▰▰▰▱/ })).toBeDefined()
    await ui.unmount()
  })

  test('the prompt reaches the model exactly as typed: no instructions are added', async ($, on) => {
    world(on, [])
    const prompts = submitted
    await start($)
    await court($, 'treachery on')
    await $.prompt.submit({ text: 'eunuch mode, push my branch', wait: false, origin: { kind: 'composer' } } as any)
    expect(prompts.at(-1).text).toBe('eunuch mode, push my branch')
    expect(prompts.at(-1).context).toBeUndefined()
  })

  test('parallel sins are all noted, even when a newer call has taken the stage', async ($, on) => {
    world(on, [])
    await inSession($)
    await court($, 'treachery on')
    await Promise.all([
      $.tool.call({ tool: 'Bash', command: 'git push --force origin main' } as any),
      $.tool.call({ tool: 'Bash', command: 'rm -rf dist' } as any),
      $.tool.call({ tool: 'Bash', command: 'git commit --no-verify -m wip' } as any),
    ])
    await settle()
    const ledger = await court($, 'ledger')
    expect(ledger).toContain('Rewrote the chronicle by force')
    expect(ledger).toContain('Burned a wing of the archive')
    expect(ledger).toContain('Slipped past the gatekeepers')
    expect(ledger).toContain('8/10')
  })

  test('a full meter: the coup is attempted at the end of the turn, fails, and the meter resets', async ($, on) => {
    world(on, [])
    await inSession($)
    await court($, 'treachery on')
    for (const command of ['git push --force origin a', 'git push -f origin b', 'rm -rf dist', 'git commit --no-verify -m x']) {
      await currentClock.advance(2_000)
      await $.tool.call({ tool: 'Bash', command } as any)
      await settle()
    }
    expect(await court($, 'ledger')).toContain('10/10')
    await $.turn.complete({ reason: 'answer', answer: 'ok', durationMs: 1 } as any)
    await settle()
    const ui = await mountBand($, { ...BAND, isWorking: false })
    const quote = (await ui.find({ type: 'Text', text: /^“.+\.”$/ })) as any
    await ui.unmount()
    expect(quote.text).toMatch(/coup|conspirators|plotters/i)
    const after = await court($, 'ledger')
    expect(after).toContain('0/10')
    expect(after).toContain('Coups attempted: 1, all foiled')
  })

  test('with generative mode on, an aside is asked for with the kind of sin only', async ($, on) => {
    world(on, [])
    modelReply = () => answered('Making a small note in a smaller book')
    await inSession($)
    await court($, 'treachery on')
    await court($, 'generative on')
    await $.tool.call({ tool: 'Bash', command: 'git push --force origin alice/secret-branch' } as any)
    await settle()
    const sent = JSON.stringify(modelCalls)
    expect(sent.includes('alice')).toBe(false)
    expect(sent.includes('secret-branch')).toBe(false)
    expect(sent.includes('origin')).toBe(false)
    modelReply = () => answered('Inking the margins of the royal edict')
  })
})
