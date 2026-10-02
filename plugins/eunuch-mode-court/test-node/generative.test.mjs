// Pure tests for generative mode: what a request may carry, what a reply may
// become, and when a call is allowed. No model is called.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  EMPTY_GEN,
  MAX_CALLS_PER_SESSION,
  MIN_INTERVAL_MS,
  SYSTEM,
  filterLine,
  mayCall,
  promptFor,
  summarize,
  takeBanked,
  verbOf,
} from '../hooks/generative.ts'
import { classifyTool, segmentsOf } from '../hooks/lines.ts'

const sum = (tool, input) => summarize(classifyTool(tool, input), tool, input, segmentsOf)

describe('sanitisation: what may leave the machine', () => {
  const secrets = [
    'C:\\Users\\alice\\secret-project\\billing.ts',
    '/home/alice/clients/acme/payroll.py',
    'sk-ant-api03-SECRETSECRET',
    'hunter2',
    'prod-db.internal',
    'acme',
    'payroll',
    'billing',
    'alice',
  ]
  const calls = [
    ['Edit', { file_path: 'C:\\Users\\alice\\secret-project\\billing.ts', old_string: 'hunter2', new_string: 'sk-ant-api03-SECRETSECRET' }],
    ['Read', { file_path: '/home/alice/clients/acme/payroll.py' }],
    ['Write', { file_path: '/home/alice/clients/acme/payroll.py', content: 'password = "hunter2"' }],
    ['Bash', { command: 'curl -H "Authorization: Bearer sk-ant-api03-SECRETSECRET" https://prod-db.internal/acme' }],
    ['Bash', { command: 'git push --force origin alice/payroll' }],
    ['Bash', { command: 'pytest /home/alice/clients/acme/tests -k billing' }],
    ['Bash', { command: 'ANTHROPIC_API_KEY=sk-ant-api03-SECRETSECRET python payroll.py' }],
    ['Bash', { command: '/home/alice/bin/deploy-acme.sh --password hunter2' }],
    ['Grep', { pattern: 'hunter2', path: '/home/alice/clients/acme' }],
    ['WebFetch', { url: 'https://prod-db.internal/acme?token=hunter2', prompt: 'summarise billing for alice' }],
    ['mcp__acme_billing__charge', { customer: 'alice', amount: 100 }],
  ]
  for (const [tool, input] of calls) {
    test(`${tool} ${JSON.stringify(input).slice(0, 50)}…: no path, argument, secret or prompt reaches the payload`, () => {
      const payload = promptFor(sum(tool, input)) + '\n' + SYSTEM
      for (const secret of secrets) assert.ok(!payload.toLowerCase().includes(secret.toLowerCase()), `${secret} leaked: ${payload}`)
    })
  }

  test('the summary keeps only the activity, tool, extension and verb', () => {
    assert.deepEqual(sum('Edit', { file_path: '/home/alice/x/billing.ts' }), { activity: 'edit', tool: 'Edit', ext: '.ts', verb: null })
    assert.deepEqual(sum('Bash', { command: 'git push --force origin main' }), { activity: 'treason', tool: 'Bash', ext: null, verb: 'git push' })
    assert.deepEqual(sum('Bash', { command: 'pytest -q tests/' }), { activity: 'tests', tool: 'Bash', ext: null, verb: 'pytest' })
    assert.deepEqual(sum('Bash', { command: 'cd /srv/app && cargo build' }), { activity: 'rust', tool: 'Bash', ext: null, verb: 'cd' })
    assert.equal(sum('mcp__acme__charge', {}).tool, 'an external tool')
  })

  test('verbs that are paths, flags or odd words are dropped', () => {
    assert.equal(verbOf('./scripts/run.sh --x'), null)
    assert.equal(verbOf('/usr/bin/python x'), null)
    assert.equal(verbOf('git --no-pager log'), 'git')
    assert.equal(verbOf('npm run build'), 'npm run')
    assert.equal(verbOf('docker compose up'), 'docker compose')
  })

  test('a file name that is all extension, or a long one, is not an extension', () => {
    assert.equal(sum('Read', { file_path: '/a/.env' }).ext, null)
    assert.equal(sum('Read', { file_path: '/a/b.superlongext' }).ext, null)
  })
})

describe('the voice rules', () => {
  test('the system prompt sets the court, the limits and the taboos', () => {
    assert.match(SYSTEM, /fictional composite palace court/)
    assert.match(SYSTEM, /Never mention eunuchs or bodies/)
    assert.match(SYSTEM, /no slurs, no real people/)
  })
})

describe('filterLine: what a reply may become', () => {
  const ok = [
    ['Petitioning the archivists for the ledger', 'Petitioning the archivists for the ledger'],
    ['"Summoning the keeper of the build."', 'Summoning the keeper of the build'],
    ['The royal taster eyes the test suite…', 'The royal taster eyes the test suite'],
  ]
  for (const [raw, line] of ok) test(`keeps ${JSON.stringify(raw)}`, () => assert.equal(filterLine(raw), line))
  const bad = [
    'Two lines\nof text',
    'lowercase start is off-voice',
    'Short',
    'A'.repeat(61),
    'The eunuch fetches the logs',
    'Consulting the sultan about the build',
    'Sending envoys to https://example.com',
    'Checking C:/secret/path for clues',
    'Dispatching guards 🛡️',
    'Reading <script> in the archive',
  ]
  for (const raw of bad) test(`rejects ${JSON.stringify(raw).slice(0, 40)}`, () => assert.equal(filterLine(raw), null))
})

describe('mayCall: rate limit, cap, one in flight, cache by activity', () => {
  test('the first call is allowed', () => assert.ok(mayCall(EMPTY_GEN, 'edit', 1000)))
  test('not within the minimum interval', () => {
    const gen = { ...EMPTY_GEN, calls: 1, lastAt: 10_000 }
    assert.ok(!mayCall(gen, 'read', 10_000 + MIN_INTERVAL_MS - 1))
    assert.ok(mayCall(gen, 'read', 10_000 + MIN_INTERVAL_MS))
  })
  test('never two at once', () => assert.ok(!mayCall({ ...EMPTY_GEN, inflight: true }, 'edit', 1e9)))
  test('never past the session cap', () => {
    assert.ok(!mayCall({ ...EMPTY_GEN, calls: MAX_CALLS_PER_SESSION }, 'edit', 1e9))
    assert.ok(mayCall({ ...EMPTY_GEN, calls: MAX_CALLS_PER_SESSION - 1 }, 'edit', 1e9))
  })
  test('not while a fresh line for that activity is banked', () => {
    const gen = { ...EMPTY_GEN, cache: { edit: ['Inking the margins of the edict'] } }
    assert.ok(!mayCall(gen, 'edit', 1e9))
    assert.ok(mayCall(gen, 'read', 1e9))
  })
  test('a hundred-call session stops at the cap', () => {
    let gen = EMPTY_GEN
    let t = 0
    let made = 0
    for (let i = 0; i < 500; i++) {
      t += MIN_INTERVAL_MS
      if (mayCall(gen, 'bash', t)) {
        made++
        gen = { ...gen, calls: gen.calls + 1, lastAt: t }
      }
    }
    assert.equal(made, MAX_CALLS_PER_SESSION)
  })
})

describe('takeBanked: generated lines join the no-repeat rotation', () => {
  test('takes the first unheard line and drops heard ones', () => {
    const gen = { ...EMPTY_GEN, cache: { edit: ['Heard already', 'Fresh from the poet'] } }
    const taken = takeBanked(gen, 'edit', new Set(['Heard already']))
    assert.equal(taken.line, 'Fresh from the poet')
    assert.deepEqual(taken.gen.cache.edit, [])
  })
  test('nothing banked: null', () => assert.equal(takeBanked(EMPTY_GEN, 'edit', new Set()).line, null))
})
