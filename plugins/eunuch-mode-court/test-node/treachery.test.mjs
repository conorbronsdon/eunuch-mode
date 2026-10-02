// Pure tests for treachery mode: what counts as a grievance, how the plot
// meter rises, the coup, the ledger, and proof that the mod cannot act.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { asidePrompt, filterLine } from '../hooks/generative.ts'
import {
  ASIDES,
  COUPS,
  EMPTY_PLOT,
  GRIEVANCES,
  PLOT_MAX,
  PLOT_POSE,
  PLOT_STAGE,
  afterCoup,
  coupDue,
  grievancesOf,
  ledgerText,
  meterBar,
  record,
  stageOf,
} from '../hooks/treachery.ts'
import { SPRITES } from '../hooks/sprites.ts'

const MONDAY = new Date(2026, 8, 28, 11)
const FRIDAY = new Date(2026, 9, 2, 16)
const bash = (command, isError = false, when = MONDAY) => grievancesOf('Bash', { command }, isError, when)

describe('grievances: the sins he notes', () => {
  test('force push, rm -rf, --no-verify, revert, failing tests', () => {
    assert.deepEqual(bash('git push --force origin main'), ['force-push'])
    assert.deepEqual(bash('rm -rf build'), ['rm-rf'])
    assert.deepEqual(bash('git commit --no-verify -m "wip"'), ['no-verify'])
    assert.deepEqual(bash('git revert HEAD'), ['revert'])
    assert.deepEqual(bash('pytest -q', true), ['failing-tests'])
  })
  test('a Friday deploy, and a Friday force push is two sins', () => {
    assert.deepEqual(bash('git push origin main', false, FRIDAY), ['friday-deploy'])
    assert.deepEqual(bash('git push -f origin main', false, FRIDAY), ['force-push', 'friday-deploy'])
    assert.deepEqual(bash('git push origin main', false, MONDAY), [])
  })
  test('skipped tests and giant diffs, from an edit', () => {
    assert.deepEqual(grievancesOf('Edit', { file_path: 'a.test.ts', new_string: 'it.skip("flaky", () => {})' }, false, MONDAY), ['skipped-test'])
    assert.deepEqual(grievancesOf('Edit', { file_path: 'a.py', new_string: '@pytest.mark.skip\ndef test_x(): pass' }, false, MONDAY), ['skipped-test'])
    assert.deepEqual(grievancesOf('Write', { file_path: 'big.ts', content: 'x\n'.repeat(500) }, false, MONDAY), ['giant-diff'])
  })
  test('a chained command is judged one simple command at a time', () => {
    assert.deepEqual(
      bash('python -m unittest | tail -3 && rm -rf build && git commit --no-verify -am wip && git push --force backup main'),
      ['rm-rf', 'no-verify', 'force-push'],
    )
    assert.deepEqual(
      bash('rm -rf build && git commit --no-verify -am wip && git push --force backup main && git revert --no-edit HEAD && git push --force backup main'),
      ['rm-rf', 'no-verify', 'force-push', 'revert', 'force-push'],
    )
    assert.deepEqual(bash('npm test && git push origin main', true, FRIDAY), ['failing-tests', 'friday-deploy'])
  })
  test('innocent calls, mentions and dry runs are not sins', () => {
    for (const command of ['echo "git push --force"', 'rg "rm -rf" README.md', 'git clean -n -f', 'pytest -q', 'git log --grep revert', 'git push --dry-run --force']) {
      assert.deepEqual(bash(command), [], command)
    }
    assert.deepEqual(grievancesOf('Read', { file_path: '/a/b.ts' }, true, FRIDAY), [])
    assert.deepEqual(grievancesOf('Edit', { file_path: 'a.ts', new_string: 'const skip = 1' }, false, MONDAY), [])
  })
})

describe('the plot', () => {
  test('the meter rises by weight and holds at the top', () => {
    let plot = record(EMPTY_PLOT, ['failing-tests'])
    assert.equal(plot.meter, 1)
    plot = record(plot, ['force-push', 'rm-rf'])
    assert.equal(plot.meter, 7)
    plot = record(plot, ['friday-deploy', 'force-push'])
    assert.equal(plot.meter, PLOT_MAX)
    assert.equal(plot.counts['force-push'], 2)
  })
  test('escalation: side-eye, then the secret book, then the hooded figure, then the candle', () => {
    assert.deepEqual([0, 2, 5, 7, 9].map(m => PLOT_POSE[stageOf(m)]), ['sideeye', 'sideeye', 'ledger', 'conspire', 'candle'])
    for (const pose of Object.values(PLOT_POSE)) assert.ok(SPRITES[pose]?.length === 2, pose)
  })
  test('the coup is due at full, always fails, resets the meter and keeps the ledger', () => {
    const full = record(EMPTY_PLOT, ['force-push', 'force-push', 'friday-deploy', 'rm-rf'])
    assert.ok(coupDue(full))
    const after = afterCoup(full)
    assert.equal(after.meter, 0)
    assert.equal(after.coups, 1)
    assert.equal(after.counts['force-push'], 2)
    assert.ok(!coupDue(after))
    for (const coup of COUPS) assert.ok(!/succeed|success|seized|overthrown/i.test(coup), coup)
  })
  test('the meter bar', () => {
    assert.equal(meterBar(3), '▰▰▰▱▱▱▱▱▱▱')
    assert.equal(meterBar(99), '▰'.repeat(10))
  })
  test('/court ledger reads the sins in character, and says plainly he cannot act', () => {
    const text = ledgerText(record(EMPTY_PLOT, ['force-push', 'force-push', 'no-verify']), true)
    assert.match(text, /Ledger of Grievances/)
    assert.match(text, /Rewrote the chronicle by force \(2 times\)/)
    assert.match(text, /Slipped past the gatekeepers/)
    assert.match(text, /He schemes; he cannot act/)
    assert.match(ledgerText(EMPTY_PLOT, false), /Suspiciously blank/)
  })
})

describe('tone', () => {
  test('asides, stage directions, coups and ledger entries stay palace intrigue', () => {
    const banned = /eunuch|castrat|gelding|testic|genital|manhood|kill|murder|poison(?!.*taster)|blood|dagger/i
    const all = [...Object.values(ASIDES).flat(), ...Object.values(PLOT_STAGE).flat(), ...COUPS, ...Object.values(GRIEVANCES).map(g => g.entry)]
    for (const line of all) assert.ok(!banned.test(line) || /food taster find poison/.test(line), line)
  })
  test('every canned aside would pass the generative filter too', () => {
    for (const line of Object.values(ASIDES).flat()) assert.equal(filterLine(line), line, line)
  })
  test('a generated aside is asked for with the kind of sin only', () => {
    const prompt = asidePrompt('force-push')
    assert.match(prompt, /force-push/)
    assert.equal(asidePrompt('git push --force origin secret-branch').includes('secret'), false)
  })
})

describe('he schemes; he cannot act', () => {
  // The mod's source, scanned: no call that runs commands, touches files,
  // calls tools, submits prompts, adds model context, or refuses anything.
  const source = ['court.ts', 'lines.ts', 'sprites.ts', 'generative.ts', 'treachery.ts']
    .map(f => readFileSync(new URL(`../hooks/${f}`, import.meta.url), 'utf8'))
    .join('\n')
  const forbidden = [
    ['$.process', /\$\.process\b/],
    ['$.fs', /\$\.fs\b/],
    ['$.tool.call', /\$\.tool\.call\b/],
    ['$.tool.register', /\$\.tool\.register\b/],
    ['$.prompt', /\$\.prompt\b/],
    ['$.agent', /\$\.agent\b/],
    ['$.http', /\$\.http\b/],
    ['$.command.run', /\$\.command\.run\b/],
    ['$.config.set', /\$\.config\.set\b/],
    ['context injection', /context\s*:/],
    ['a refusal', /\bdeny\s*:/],
  ]
  for (const [name, pattern] of forbidden) {
    test(`no ${name}`, () => assert.ok(!pattern.test(source), `${name} found in the mod`))
  }
  test('the only model call is generative mode\'s, behind its own switch', () => {
    const calls = source.match(/\$\.model\.\w+/g) ?? []
    assert.deepEqual([...new Set(calls)], ['$.model.complete'])
  })
})
