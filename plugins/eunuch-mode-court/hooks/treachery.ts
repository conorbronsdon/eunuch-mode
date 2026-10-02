// Treachery mode ("he plots your downfall"), opt-in: the adviser stays
// fawning to your face while a hidden Ledger of Grievances fills, a plot
// meter rises, and at the top a coup is attempted and always fails.
//
// The plotting is purely cosmetic. He schemes; he cannot act. This module is
// pure data and functions: it reads a tool call that has already happened and
// returns what to draw. Nothing here, or in the hooks that use it, changes a
// tool call, a prompt, the model's context, git, a file or a permission.

import { classifyCommand, segmentsOf } from './lines.ts'

export type Grievance =
  | 'force-push'
  | 'failing-tests'
  | 'skipped-test'
  | 'no-verify'
  | 'giant-diff'
  | 'friday-deploy'
  | 'rm-rf'
  | 'revert'

export const GRIEVANCES: Record<Grievance, { weight: number; entry: string }> = {
  'force-push': { weight: 4, entry: 'Rewrote the chronicle by force' },
  'failing-tests': { weight: 1, entry: 'Let the food taster find poison' },
  'skipped-test': { weight: 2, entry: 'Excused a witness from testifying' },
  'no-verify': { weight: 2, entry: 'Slipped past the gatekeepers unchecked' },
  'giant-diff': { weight: 1, entry: 'Delivered a scroll too heavy to lift' },
  'friday-deploy': { weight: 3, entry: 'Sent a decree to the provinces on a Friday' },
  'rm-rf': { weight: 2, entry: 'Burned a wing of the archive' },
  revert: { weight: 1, entry: 'Unmade a decree the court had praised' },
}

// What actually ships something: a push, a release, a publish, an apply or a deploy.
// Read-only and preview commands (docker ps, kubectl get, terraform plan) are not deploys.
const DEPLOY =
  /^git\s+push\b|^gh\s+release\s+create\b|^gh\s+pr\s+merge\b|^(?:npm|pnpm|yarn|cargo|poetry|dotnet)\s+publish\b|^docker\s+push\b|^kubectl\s+(?:apply|set|scale|rollout\s+(?:restart|undo|resume))\b|^terraform\s+apply\b|^tofu\s+apply\b|^pulumi\s+up\b|^helm\s+(?:install|upgrade)\b|^(?:vercel|netlify|fly|flyctl|wrangler|firebase)\s+deploy\b|^vercel\s+--prod\b/
// Previews and rehearsals, read per program: `-n` is a dry run for git push but a namespace for kubectl and helm.
const DRY_RUN = /\s--dry-run(?:=(?:client|server|true))?(?=\s|$)|\s--draft\b|^git\s+push\b.*\s-[a-zA-Z]*n[a-zA-Z]*(?=\s|$)/

/** When the plot is ripe. */
export const PLOT_MAX = 10
const GIANT_DIFF_LINES = 400

/** The plot's stage by meter level: each escalates the pose and the asides. */
export type PlotStage = 'loyal' | 'noting' | 'ledger' | 'conspiring' | 'scheming'

export function stageOf(meter: number): PlotStage {
  if (meter >= 9) return 'scheming'
  if (meter >= 7) return 'conspiring'
  if (meter >= 5) return 'ledger'
  if (meter >= 2) return 'noting'
  return 'loyal'
}

/** The pose for each stage of the plot: side-eye, the secret book, the shadowy figure, the candle. */
export const PLOT_POSE = {
  loyal: 'sideeye',
  noting: 'sideeye',
  ledger: 'ledger',
  conspiring: 'conspire',
  scheming: 'candle',
} as const

/** Whispered asides, for the spinner, by stage. No trailing ellipsis (the engine draws one). */
export const ASIDES: Record<PlotStage, readonly string[]> = {
  loyal: [
    'Noted for the ledger',
    'A small entry in a small book',
    'Nothing, sire, merely a cough',
  ],
  noting: [
    'Noted for the ledger',
    'The junior developer would never have done that',
    'Underlining it twice, discreetly',
    'Remembering this, fondly, for later',
    'Smiling, and adding a page',
  ],
  ledger: [
    'Writing in the other book, the secret one',
    'A fresh page in the Ledger of Grievances',
    'Ink, sire? Merely the household accounts',
    'Cross-referencing your sins by date',
  ],
  conspiring: [
    'A word with a hooded gentleman in the cellar',
    'Meeting a shadowy figure by the kitchens',
    'Passing a folded note to no one in particular',
    'Agreeing on a signal, two coughs and then a third',
  ],
  scheming: [
    'Plotting by candlelight',
    'Drawing a map of the throne room, for reasons',
    'Measuring the throne, purely out of interest',
    'Rehearsing a gracious acceptance speech',
  ],
}

/** Stage directions beside the figure, by stage. */
export const PLOT_STAGE: Record<PlotStage, readonly string[]> = {
  loyal: ['[smiles, and notes something]'],
  noting: ['[bows, and notes something]', '[a sideways look, then a bow]'],
  ledger: ['[writes in a small black book]', '[hides a small black book]'],
  conspiring: ['[whispers to a hooded figure]', '[nods to someone behind the curtain]'],
  scheming: ['[schemes by candlelight]', '[pinches out the candle as you look]'],
}

/** The coup, always attempted at a full meter, always foiled. Then the meter resets. */
export const COUPS: readonly string[] = [
  'The coup has been postponed due to a merge conflict',
  'The coup was scheduled for Friday. The court astrologers forbade it',
  'The conspirators could not agree on a branch name',
  'The coup failed review: two approvals were required',
  'The palace guards were stuck in a standup',
  'The coup is blocked on a flaky test',
  'The coup timed out waiting for CI',
  'The plotters were reassigned to a migration',
]

export const COUP_STAGE = '[the coup is foiled; he bows deeply, as if nothing happened]'

/** The grievances a finished tool call commits, read from its input and outcome only. */
export function grievancesOf(
  tool: string,
  input: Readonly<Record<string, unknown>>,
  isError: boolean,
  now: Date,
): Grievance[] {
  const found: Grievance[] = []
  if (tool === 'Bash' || tool === 'PowerShell') {
    // Each simple command on its own: `make test && rm -rf build && git push -f` is three sins.
    const segments = segmentsOf(String(input.command ?? ''))
    const kinds = segments.map(segment => classifyCommand(segment))
    segments.forEach((s, i) => {
      if (kinds[i] === 'treason') found.push('force-push')
      if (kinds[i] === 'peril' && (/^rm\b/.test(s) || /^Remove-Item\b/i.test(s))) found.push('rm-rf')
      if (/^git\s+(?:commit|push|merge|rebase)\b.*\s--no-verify\b/.test(s)) found.push('no-verify')
      if (/^git\s+revert\b/.test(s)) found.push('revert')
    })
    if (kinds.includes('tests') && isError) found.push('failing-tests')
    if (now.getDay() === 5 && segments.some(s => DEPLOY.test(s) && !DRY_RUN.test(s))) found.push('friday-deploy')
  }
  if (tool === 'Edit' || tool === 'MultiEdit' || tool === 'Write' || tool === 'NotebookEdit') {
    const text = [input.new_string, input.content, input.new_source]
      .concat(Array.isArray(input.edits) ? input.edits.map(edit => (edit as { new_string?: unknown })?.new_string) : [])
      .filter((t): t is string => typeof t === 'string')
      .join('\n')
    if (/\b(?:it|test|describe)\.skip\(|\bxit\(|\bxdescribe\(|@pytest\.mark\.skip|@unittest\.skip|#\[ignore\]|\bt\.Skip\(/.test(text)) found.push('skipped-test')
    if (text.split('\n').length > GIANT_DIFF_LINES) found.push('giant-diff')
  }
  return found
}

/** The hidden ledger: every grievance, counted, and the plot meter. */
export type Plot = { meter: number; counts: Partial<Record<Grievance, number>>; coups: number }

export const EMPTY_PLOT: Plot = { meter: 0, counts: {}, coups: 0 }

/** Adds grievances to the ledger and raises the meter, which holds at the top until the coup. */
export function record(plot: Plot, found: readonly Grievance[]): Plot {
  if (found.length === 0) return plot
  const counts = { ...plot.counts }
  let meter = plot.meter
  for (const g of found) {
    counts[g] = (counts[g] ?? 0) + 1
    meter += GRIEVANCES[g].weight
  }
  return { ...plot, counts, meter: Math.min(meter, PLOT_MAX) }
}

/** Whether the coup is due. */
export function coupDue(plot: Plot): boolean {
  return plot.meter >= PLOT_MAX
}

/** After the coup: the meter resets, the ledger remembers. */
export function afterCoup(plot: Plot): Plot {
  return { ...plot, meter: 0, coups: plot.coups + 1 }
}

/** The plot meter as drawn in the band: ten pips. */
export function meterBar(meter: number): string {
  const filled = Math.max(0, Math.min(PLOT_MAX, meter))
  return '▰'.repeat(filled) + '▱'.repeat(PLOT_MAX - filled)
}

/** `/court ledger`: the Ledger of Grievances, read aloud in character. */
export function ledgerText(plot: Plot, on: boolean): string {
  const entries = (Object.keys(GRIEVANCES) as Grievance[]).filter(g => (plot.counts[g] ?? 0) > 0)
  const lines = ['The Ledger of Grievances (kept for your protection, sire).', '']
  if (entries.length === 0) lines.push('  The pages are blank. Suspiciously blank.')
  for (const g of entries) {
    const n = plot.counts[g]!
    lines.push(`  ${GRIEVANCES[g].entry}${n > 1 ? ` (${n} times)` : ''}`)
  }
  lines.push('', `Plot progress: ${meterBar(plot.meter)} ${plot.meter}/${PLOT_MAX}. Coups attempted: ${plot.coups}, all foiled.`)
  if (!on) lines.push('Treachery mode is off: /court treachery on to let him plot.')
  lines.push('The plotting is purely cosmetic. He schemes; he cannot act.')
  return lines.join('\n')
}

/** Picks from a list by a running count, so the asides cycle. */
export function nth<T>(list: readonly T[], count: number): T {
  return list[count % list.length]!
}
