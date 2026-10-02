// Pure tests for the activity → pose → line mapping and the no-repeat rotation.
// Run with: node --test plugins/eunuch-mode-court/test-node/
// (Node 22.18+ strips the TypeScript types itself.)
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  POOLS,
  POSE_OF,
  STAGE,
  classifyCommand,
  classifyTool,
  detailOf,
  generatedLines,
  isCourtSkill,
  pickLine,
  promptIntent,
} from '../hooks/lines.ts'
import { PALETTE, SPRITES, frameOf, toRows } from '../hooks/sprites.ts'

describe('classifyCommand', () => {
  const cases = [
    ['git push --force origin main', 'treason'],
    ['git push -f', 'treason'],
    ['git push origin +main', 'treason'],
    ['git push --force-with-lease origin feat', 'lease'],
    ['git push origin main', 'push'],
    ['git commit -m "fix"', 'commit'],
    ['git status --short', 'git'],
    ['git log --oneline -5', 'git'],
    ['rm -rf build', 'peril'],
    ['rm -fr node_modules', 'peril'],
    ['git reset --hard HEAD~1', 'peril'],
    ['git clean -fd', 'peril'],
    ['cargo build --release', 'rust'],
    ['cargo test', 'tests'],
    ['npm test', 'tests'],
    ['pnpm run test -- --watch=false', 'tests'],
    ['pytest -q tests/', 'tests'],
    ['go test ./...', 'tests'],
    ['node --test test-node/', 'tests'],
    ['npm install', 'install'],
    ['pip install requests', 'install'],
    ['eslint .', 'lint'],
    ['tsc -p .', 'build'],
    ['npm run build', 'build'],
    ['docker compose up -d', 'infra'],
    ['terraform plan', 'infra'],
    ['psql -c "select 1"', 'db'],
    ['curl -s https://example.com', 'courier'],
    ["sed -i 's/a/b/' treasury.py", 'edit'],
    ["sed -E -i 's/a/b/' x", 'edit'],
    ["perl -pi -e 's/a/b/' x", 'edit'],
    ['git apply fix.patch', 'edit'],
    ["sed -n '1,5p' x", 'bash'],
    ['ls -la', 'bash'],
    ['echo hello', 'bash'],
  ]
  for (const [command, activity] of cases) {
    test(`${command} → ${activity}`, () => assert.equal(classifyCommand(command), activity))
  }
})

describe('classifyTool', () => {
  const cases = [
    ['Read', { file_path: '/a/b.ts' }, 'read'],
    ['Grep', { pattern: 'foo' }, 'search'],
    ['Glob', { pattern: '**/*.ts' }, 'search'],
    ['Edit', { file_path: 'x' }, 'edit'],
    ['MultiEdit', { file_path: 'x' }, 'edit'],
    ['Write', { file_path: 'x' }, 'write'],
    ['WebFetch', { url: 'https://x.dev' }, 'web'],
    ['WebSearch', { query: 'x' }, 'web'],
    ['Agent', {}, 'delegate'],
    ['TodoWrite', {}, 'agenda'],
    ['AskUserQuestion', {}, 'ask'],
    ['ExitPlanMode', {}, 'plan'],
    ['Skill', { skill: 'eunuch-mode' }, 'skill'],
    ['mcp__github__create_issue', {}, 'foreign'],
    ['Bash', { command: 'cargo check' }, 'rust'],
    ['PowerShell', { command: 'Remove-Item build -Recurse -Force' }, 'peril'],
    ['SomethingNew', {}, 'misc'],
  ]
  for (const [tool, input, activity] of cases) {
    test(`${tool} → ${activity}`, () => assert.equal(classifyTool(tool, input), activity))
  }
})

describe('poses', () => {
  test('the brief\'s mapping: bow while working, scroll for edits, alarm and side-eye for trouble, smug on success, whisper while thinking', () => {
    assert.equal(POSE_OF.bash, 'bow')
    assert.equal(POSE_OF.read, 'bow')
    assert.equal(POSE_OF.edit, 'scribble')
    assert.equal(POSE_OF.write, 'scribble')
    assert.equal(POSE_OF.treason, 'alarm')
    assert.equal(POSE_OF.peril, 'alarm')
    assert.equal(POSE_OF.error, 'sideeye')
    assert.equal(POSE_OF.grumble, 'sideeye')
    assert.equal(POSE_OF.success, 'smug')
    assert.equal(POSE_OF.think, 'whisper')
  })

  test('every activity has a pose, a pool and sprites for that pose', () => {
    for (const activity of Object.keys(POOLS)) {
      const pose = POSE_OF[activity]
      assert.ok(pose, activity)
      assert.ok(SPRITES[pose]?.length >= 2, `${pose} frames`)
      assert.ok(STAGE[pose]?.length >= 2, `${pose} stage directions`)
      assert.ok(POOLS[activity].length >= 4, `${activity} pool`)
    }
  })
})

describe('lines', () => {
  const all = Object.values(POOLS).flat()

  test('no curated line appears twice anywhere', () => {
    assert.equal(new Set(all).size, all.length)
  })

  test('lines fit a narrow spinner and leave the ellipsis to the engine', () => {
    for (const line of all) {
      assert.ok(line.length <= 56, `too long: ${line}`)
      assert.ok(!/[.…]$/.test(line), `ends in punctuation: ${line}`)
    }
  })

  test('the court jokes about bureaucracy, never about the eunuch condition', () => {
    const banned = /eunuch|castrat|manhood|gelding|testic|genital/i
    for (const line of [...all, ...Object.values(STAGE).flat()]) assert.ok(!banned.test(line), line)
  })

  test('the brief\'s anchor lines are present', () => {
    assert.ok(POOLS.bash.includes('Dispatching the palace guards'))
    assert.ok(POOLS.edit.includes('Amending the royal scroll'))
    assert.ok(POOLS.read.includes('Consulting the archives'))
    assert.ok(POOLS.web.includes('Sending envoys abroad'))
    assert.ok(POOLS.tests.includes('The royal food taster samples the code'))
    assert.ok(POOLS.rust.includes('Bribing the borrow checker'))
    assert.ok(POOLS.treason[0].startsWith('HIGH TREASON'))
  })
})

describe('pickLine', () => {
  function drawMany(activity, n, seed = 42) {
    const used = new Set()
    const drawn = []
    for (let i = 0; i < n; i++) {
      const line = pickLine(activity, used, seed, i)
      drawn.push(line)
      used.add(line)
    }
    return drawn
  }

  test('never repeats within a session, through the curated pool and into the generated court', () => {
    for (const activity of Object.keys(POOLS)) {
      const n = POOLS[activity].length + 40
      const drawn = drawMany(activity, n)
      assert.equal(new Set(drawn).size, n, activity)
    }
  })

  test('spends the curated pool before generating', () => {
    const pool = POOLS.bash
    const drawn = drawMany('bash', pool.length)
    assert.deepEqual([...drawn].sort(), [...pool].sort())
  })

  test('hundreds of Bash calls in one session still never repeat', () => {
    const n = POOLS.bash.length + generatedLines('bash').length
    const drawn = drawMany('bash', n)
    assert.equal(new Set(drawn).size, n)
    assert.ok(n > 150, `capacity ${n}`)
  })

  test('different sessions start differently', () => {
    const a = drawMany('read', 5, 1)
    const b = drawMany('read', 5, 999)
    assert.notDeepEqual(a, b)
  })

  test('mixed activities share one ledger without a repeat', () => {
    const used = new Set()
    const order = ['think', 'read', 'edit', 'bash', 'tests', 'deliberate', 'read', 'read', 'edit', 'success']
    for (let round = 0; round < 6; round++) {
      for (const [i, activity] of order.entries()) {
        const line = pickLine(activity, used, 7, round * order.length + i)
        assert.ok(!used.has(line), line)
        used.add(line)
      }
    }
  })
})

describe('promptIntent', () => {
  const cases = [
    ['Eunuch mode. Should I rewrite our backend in Rust?', 'on'],
    ['vizier mode: review my plan', 'on'],
    ['/eunuch-mode what now', 'on'],
    ['convene the rival viziers on this', 'on'],
    ['drop the bit', 'off'],
    ['ok, normal mode please', 'off'],
    ['exit eunuch mode', 'off'],
    ['exit vizier mode', 'off'],
    ['what did eunuchs do in the Byzantine court?', null],
    ['fix the failing test', null],
  ]
  for (const [text, intent] of cases) {
    test(`${JSON.stringify(text)} → ${intent}`, () => assert.equal(promptIntent(text), intent))
  }
})

describe('isCourtSkill', () => {
  test('bare and plugin-namespaced names', () => {
    assert.ok(isCourtSkill('eunuch-mode'))
    assert.ok(isCourtSkill('eunuch-mode:eunuch-mode'))
    assert.ok(!isCourtSkill('eunuch'))
    assert.ok(!isCourtSkill('commit'))
  })
})

describe('detailOf', () => {
  test('a file name, a command head, a host', () => {
    assert.equal(detailOf('Edit', { file_path: 'C:\\repo\\src\\app.ts' }), 'app.ts')
    assert.equal(detailOf('Bash', { command: 'npm test\necho done' }), 'npm test')
    assert.equal(detailOf('WebFetch', { url: 'https://claude.dev/blog/x' }), 'claude.dev')
  })
})

describe('sprites', () => {
  test('every frame is 14 by 12 pixels drawn only in the palette', () => {
    for (const [pose, frames] of Object.entries(SPRITES)) {
      for (const frame of frames) {
        assert.equal(frame.length, 12, pose)
        for (const row of frame) {
          assert.equal(row.length, 14, `${pose}: ${row}`)
          for (const ch of row) assert.ok(ch === '.' || ch in PALETTE, `${pose}: ${ch}`)
        }
      }
    }
  })

  test('two frames per pose that differ, so the figure moves', () => {
    for (const [pose, frames] of Object.entries(SPRITES)) {
      assert.equal(frames.length, 2, pose)
      assert.notDeepEqual(frames[0], frames[1], pose)
    }
  })

  test('half-blocks: 6 terminal rows of 14 cells', () => {
    for (const pose of Object.keys(SPRITES)) {
      const rows = toRows(frameOf(pose, 0))
      assert.equal(rows.length, 6)
      for (const runs of rows) assert.equal(runs.reduce((n, r) => n + [...r.text].length, 0), 14)
    }
  })

  test('a transparent pixel never paints a background, so light and dark terminals both show through', () => {
    const rows = toRows(['.S', '..'])
    assert.deepEqual(rows, [[{ text: ' ' }, { text: '▀', color: PALETTE.S }]])
  })
})
