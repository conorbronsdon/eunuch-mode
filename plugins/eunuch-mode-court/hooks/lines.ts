// The court's narration: which activity a tool call is, which pose the
// adviser takes for it, and a curated line for the spinner that never repeats
// within a session. Pure data and functions, no `$`, so it is tested directly.

export type Pose = 'portrait' | 'bow' | 'scribble' | 'whisper' | 'alarm' | 'sideeye' | 'smug'

export type Activity =
  | 'think'
  | 'deliberate'
  | 'bash'
  | 'git'
  | 'commit'
  | 'push'
  | 'treason'
  | 'lease'
  | 'peril'
  | 'tests'
  | 'rust'
  | 'build'
  | 'install'
  | 'lint'
  | 'infra'
  | 'db'
  | 'courier'
  | 'read'
  | 'search'
  | 'edit'
  | 'write'
  | 'web'
  | 'delegate'
  | 'agenda'
  | 'ask'
  | 'plan'
  | 'skill'
  | 'foreign'
  | 'misc'
  | 'error'
  | 'success'
  | 'grumble'

/** The pose the adviser holds while each activity runs. */
export const POSE_OF: Record<Activity, Pose> = {
  think: 'whisper',
  deliberate: 'whisper',
  plan: 'whisper',
  bash: 'bow',
  git: 'bow',
  commit: 'bow',
  push: 'bow',
  lease: 'bow',
  tests: 'bow',
  rust: 'bow',
  build: 'bow',
  install: 'bow',
  lint: 'bow',
  infra: 'bow',
  db: 'bow',
  courier: 'bow',
  read: 'bow',
  search: 'bow',
  web: 'bow',
  delegate: 'bow',
  agenda: 'bow',
  ask: 'bow',
  skill: 'bow',
  foreign: 'bow',
  misc: 'bow',
  edit: 'scribble',
  write: 'scribble',
  treason: 'alarm',
  peril: 'alarm',
  error: 'sideeye',
  grumble: 'sideeye',
  success: 'smug',
}

/** Stage directions drawn beside the figure, one list per pose. */
export const STAGE: Record<Pose, readonly string[]> = {
  portrait: ['[regards you with heavy-lidded approval]', '[folds his hands and waits]'],
  bow: ['[bows low]', '[bows lower still]', '[a fawning bow]', '[bows, eyes on the floor]', '[an obliging bow]'],
  scribble: ['[scribbles on the royal scroll]', '[dips the quill]', '[blots the ink]', '[scratches out a line]'],
  whisper: ['[whispers behind a sleeve]', '[leans in]', '[glances at the doors]', '[murmurs a confidence]'],
  alarm: ['[gasps]', '[drops the quill]', '[clutches his chain of office]', '[calls for the guards]'],
  sideeye: ['[narrows his eyes]', '[a long sideways look]', '[purses his lips]', '[notes this in a private ledger]'],
  smug: ['[a small, satisfied bow]', '[smirks into his sleeve]', '[accepts the credit graciously]', '[bows with quiet triumph]'],
}

/**
 * Curated lines, written for the spinner: no trailing ellipsis (the engine
 * draws one), short enough for a narrow terminal, and none repeated within a
 * session (pickLine). Fictional composite court; the joke is the adviser's
 * obsequiousness and the palace bureaucracy.
 */
export const POOLS: Record<Activity, readonly string[]> = {
  think: [
    'Whispering behind a silk sleeve',
    'Consulting the court astrologers',
    'Weighing the factions',
    'Pacing the long gallery',
    'Reading the omens in the tea leaves',
    'Counting the chairs at the council table',
    'Listening at the tapestry',
    'Arranging the petitions by peril',
    'Rehearsing a deep bow',
    'Composing a flattering preamble',
    'Drafting three plans and a fourth in secret',
    'Asking the palace cat for its opinion',
  ],
  deliberate: [
    'Mulling the dispatch',
    'Turning the matter over like a coin',
    'Comparing notes with the scribes',
    'Studying the map of the realm',
    'Sorting the useful from the merely loud',
    'Murmuring to the chamberlain',
    'Choosing the next move with care',
    'Polishing the counsel',
    'Testing the floorboards for creaks',
    'Smoothing the robe of state',
    'Deciding which minister to blame',
    'Folding the memorandum just so',
  ],
  bash: [
    'Dispatching the palace guards',
    'Sending a runner to the kitchens',
    'Summoning the night watch',
    'Ringing for a footman',
    'Issuing orders to the garrison',
    'Waking the stable boys',
    'Setting the court machinery in motion',
    'Sending word down the servants\' stair',
    'Rousing the palace engineers',
    'Instructing the gatekeeper',
    'Relaying a command through four corridors',
    'Commissioning a small errand',
  ],
  git: [
    'Consulting the royal genealogists',
    'Unrolling the family tree of the realm',
    'Reading the chronicles of past reigns',
    'Asking who touched the throne last',
    'Tracing the line of succession',
    'Comparing the old charter with the new',
    'Auditing the royal lineage',
    'Checking the ledger of decrees',
  ],
  commit: [
    'Pressing the royal seal into wax',
    'Entering the decree into the chronicle',
    'Witnessing the decree before the court',
    'Signing in the presence of the scribes',
    'Committing the edict to the archives',
    'Fixing the decree in the permanent record',
  ],
  push: [
    'Sending the herald to the outer provinces',
    'Dispatching the decree by royal courier',
    'Proclaiming the edict from the balcony',
    'Posting the decree on the city gates',
    'Riding out with the latest edict',
    'Delivering the scrolls to the far garrison',
  ],
  treason: [
    'HIGH TREASON. The palace guards have been summoned',
    'Treason in the throne room! Seal the gates',
    'The chronicle is being rewritten by force. Guards!',
    'A forced succession! Fetch the royal historian',
    'Sedition at the remote! Sound the bells',
  ],
  lease: [
    'A cautious force, sire: the lease is checked first',
    'Forcing the gate, but only after knocking',
    'Rewriting the chronicle with the archivist\'s consent',
    'A careful coup, approved by the lease',
  ],
  peril: [
    'The Royal Archivist faints',
    'Burning the old scrolls. The archivist weeps',
    'Razing a wing of the palace',
    'Sweeping the throne room clean, history and all',
    'Clearing the vaults. Nobody look',
    'The court braces for the demolition',
  ],
  tests: [
    'The royal food taster samples the code',
    'The taster takes a cautious bite',
    'Testing the bridge before the king crosses',
    'The taster asks for a second helping',
    'Holding the trial of the code',
    'Calling witnesses for the defence',
    'The jury of assertions deliberates',
    'Checking the banquet for poison',
    'The taster chews thoughtfully',
    'Inspecting the guard at every gate',
  ],
  rust: [
    'Bribing the borrow checker',
    'Negotiating with the borrow checker',
    'Petitioning the lifetime magistrates',
    'Forging the iron crown in the royal smithy',
    'Appeasing the borrow checker with gifts',
    'Awaiting the borrow checker\'s verdict',
    'Explaining ownership to the court, again',
    'Letting the forge run hot',
  ],
  build: [
    'The palace masons lay the foundations',
    'Raising the scaffolding',
    'Assembling the royal carriage',
    'Hammering the decree into bronze',
    'Firing the kilns',
    'Building a new wing of the palace',
    'Fitting the stones together',
    'The architects unroll the plans',
  ],
  install: [
    'Importing exotic goods through customs',
    'Welcoming a caravan of dependencies',
    'Checking the cargo at the harbour',
    'Unloading crates from foreign ports',
    'Haggling with the merchants',
    'Signing for a delivery of strange goods',
    'Inspecting the tribute for curses',
    'Stocking the royal larder',
  ],
  lint: [
    'The master of etiquette inspects the code',
    'Correcting the court\'s posture',
    'Straightening every tapestry',
    'Enforcing the dress code',
    'Measuring the hems of the robes',
    'Reminding the code of its manners',
  ],
  infra: [
    'Loading the royal shipping containers',
    'Mustering the fleet',
    'Surveying the outer provinces',
    'Commissioning a new fortress',
    'Inspecting the garrisons of the cloud',
    'Moving the court to its summer palace',
    'Charting the trade routes',
  ],
  db: [
    'Descending to the treasury vaults',
    'Counting the coins in the strongroom',
    'Consulting the keeper of the ledgers',
    'Reconciling the royal accounts',
    'Moving the treasure between vaults',
    'Opening the census rolls',
  ],
  courier: [
    'Sending a pigeon to a neighbouring kingdom',
    'A courier gallops to the border',
    'Knocking on a foreign gate',
    'Requesting an audience abroad',
    'Fetching word from beyond the walls',
  ],
  read: [
    'Consulting the archives',
    'Unrolling an ancient scroll',
    'Blowing the dust off a ledger',
    'Studying the royal records',
    'Reading the fine print of a treaty',
    'Turning the brittle pages',
    'Squinting at a faded charter',
    'Opening the sealed correspondence',
    'Perusing the minutes of the last council',
    'Holding a scroll up to the candle',
    'Reviewing the inventory of the armoury',
    'Reading the treaty twice, as a precaution',
  ],
  search: [
    'Sending the archivists through the stacks',
    'Combing the scrolls for a name',
    'Searching every drawer in the chancery',
    'Following the index to the third cellar',
    'Turning the library upside down',
    'Asking every clerk in the building',
    'Hunting through the petitions',
    'Checking the cross-references',
    'Sifting the correspondence',
    'Scanning the shelves by lamplight',
  ],
  edit: [
    'Amending the royal scroll',
    'Correcting the decree with a steady hand',
    'Scraping the parchment clean of an error',
    'Inserting a clause',
    'Revising the edict before anyone notices',
    'Tidying the margins',
    'Striking a line from the record',
    'Adjusting the wording, subtly',
    'Annotating the charter',
    'Mending a torn scroll',
    'Updating the law of the land',
    'Making the decree say what it meant',
  ],
  write: [
    'Drafting a fresh decree',
    'Unrolling a blank scroll',
    'Inscribing a new charter',
    'Dictating to the royal scribe',
    'Composing an edict from nothing',
    'Founding a new archive',
    'Copying out the proclamation',
    'Penning a document for the ages',
  ],
  web: [
    'Sending envoys abroad',
    'Dispatching a spy to foreign lands',
    'Consulting the travelling scholars',
    'Reading the foreign gazettes',
    'Asking the ambassadors what they know',
    'Gathering rumours from the ports',
    'Sending a scout over the mountains',
    'Collecting dispatches from abroad',
    'Studying a map of distant kingdoms',
    'Interviewing a merchant just off the boat',
  ],
  delegate: [
    'Dispatching a trusted envoy',
    'Assigning the task to a junior minister',
    'Sending a deputy with full powers',
    'Delegating, as all great viziers do',
    'Appointing a special commission',
    'Entrusting the matter to a loyal clerk',
  ],
  agenda: [
    'Updating the royal agenda',
    'Reordering the petitions',
    'Crossing an item off the list',
    'Pinning a new task to the council board',
    'Revising the order of business',
    'Making the list look shorter',
  ],
  ask: [
    'Awaiting the pleasure of the throne',
    'Presenting the options on a velvet cushion',
    'Bowing and awaiting your word',
    'Holding the petition up for your ruling',
  ],
  plan: [
    'Convening the war council',
    'Unrolling the campaign maps',
    'Moving the little flags around',
    'Drafting the grand strategy',
    'Plotting in broad daylight',
  ],
  skill: [
    'Summoning a specialist to court',
    'Sending for the expert from the far tower',
    'Unlocking the cabinet of rare techniques',
    'Fetching the right minister for the job',
  ],
  foreign: [
    'Receiving foreign dignitaries',
    'Exchanging gifts with a neighbouring court',
    'Negotiating a treaty with an outside power',
    'Hosting an embassy in the east wing',
    'Translating a letter from a foreign court',
    'Opening a sealed diplomatic pouch',
  ],
  misc: [
    'Attending to palace business',
    'Seeing to a small matter',
    'Handling it discreetly',
    'Pulling a quiet lever',
    'Running an errand for the throne',
    'Tending to the machinery of state',
  ],
  error: [
    'The guards report a disturbance in the east wing',
    'A messenger returns with grave news',
    'Something has gone amiss in the kitchens',
    'The plan has met the realm',
    'A wheel has come off the royal carriage',
    'The scroll came back with corrections',
    'A small fire in the west tower',
    'The bridge was not tested first',
    'An unwelcome dispatch has arrived',
    'The court pretends not to notice',
  ],
  success: [
    'The petition is granted, sire',
    'Done, sire, and nobody was beheaded',
    'The realm is served',
    'A triumph, sire, if I may say so',
    'All is in order, sire',
    'Executed flawlessly, as you foresaw',
    'The court applauds, politely',
    'Your will is done, sire',
    'Another victory for the throne',
    'It is finished, and it is good',
  ],
  grumble: [
    'Not our finest hour, sire',
    'The court will speak of this in whispers',
    'We shall call it a learning experience',
    'A setback, sire. Merely a setback',
    'I have quietly blamed the Ministry of Scope Creep',
    'The chroniclers have been told to omit this',
    'Another day, sire, another plan',
  ],
}

/**
 * Offices and ministries from the skill's court roster
 * (skills/eunuch-mode/references/court-roster.md), extended. Once a curated
 * pool runs dry, the generator pairs these with templates so the line stays
 * fresh for hundreds of tool calls before anything repeats.
 */
export const OFFICES: readonly string[] = [
  'the Ministry of Scope Creep',
  'the Ministry of the Eternal Draft',
  'the Ministry of the Slipping Date',
  'the Ministry of Quiet Rollbacks',
  'the Ministry of the Orphaned Flag',
  'the Ministry of Dependency Weather',
  'the Ministry of the Third Environment',
  'the Ministry of the Stale Cache',
  'the Ministry of Merge Weather',
  'the Ministry of Estimate Folklore',
  'the Ministry of the Unowned Service',
  'the Ministry of Localhost Confidence',
  'the Ministry of the Forgotten Cron',
  'the Ministry of the Cloud Invoice',
  'the Keeper of the Flaky Tests',
  'the Custodian of the Unfinished README',
  'the Warden of the TODO Comment',
  'the Chamberlain of the Rebase',
  'the Keeper of the Lockfile',
  'the Keeper of the Migration Scrolls',
  'the Custodian of the Warning Log',
  'the Keeper of the Retry Loop',
  'the Warden of the Shadow Config',
  'the Royal Taster of Release Candidates',
  'the Herald of the Breaking Change',
  'the Archivist of Abandoned Branches',
  'the Lord Steward of the Seed Script',
  'the Master of the Demo Script',
  'the Keeper of the Spare Laptop Charger',
  'the Royal Archivist',
  'the Treasury Abacus',
  'a very tired herald',
]

const TEMPLATES: Record<'work' | 'scribe' | 'think' | 'alarm' | 'trouble' | 'win', readonly string[]> = {
  work: [
    'Consulting {o}',
    'Sending a note to {o}',
    'Requesting the seal of {o}',
    'Waiting on {o}',
    'Clearing it with {o}',
  ],
  scribe: ['Amending the scroll for {o}', 'Taking dictation from {o}', 'Correcting a clause for {o}'],
  think: ['Weighing the advice of {o}', 'Overruling {o}, quietly', 'Taking {o} aside for a word'],
  alarm: ['Alerting {o}', 'Hiding the evidence from {o}'],
  trouble: ['{O} files a complaint', '{O} demands an inquiry', 'Blaming {o}, discreetly'],
  win: ['{O} sends congratulations', 'Accepting the thanks of {o}'],
}

const FAMILY: Record<Activity, keyof typeof TEMPLATES> = {
  think: 'think',
  deliberate: 'think',
  plan: 'think',
  edit: 'scribe',
  write: 'scribe',
  treason: 'alarm',
  peril: 'alarm',
  error: 'trouble',
  grumble: 'trouble',
  success: 'win',
  bash: 'work',
  git: 'work',
  commit: 'work',
  push: 'work',
  lease: 'work',
  tests: 'work',
  rust: 'work',
  build: 'work',
  install: 'work',
  lint: 'work',
  infra: 'work',
  db: 'work',
  courier: 'work',
  read: 'work',
  search: 'work',
  web: 'work',
  delegate: 'work',
  agenda: 'work',
  ask: 'work',
  skill: 'work',
  foreign: 'work',
  misc: 'work',
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** Every generated line for an activity's family, in a stable order. */
export function generatedLines(activity: Activity): string[] {
  const out: string[] = []
  for (const t of TEMPLATES[FAMILY[activity]]) {
    for (const o of OFFICES) out.push(t.replace('{o}', o).replace('{O}', capitalize(o)))
  }
  return out
}

/** A small deterministic hash: the same seed and turn pick the same line. */
function mix(a: number, b: number): number {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

// Generated lines that suit any ordinary action, the overflow once an
// activity's own pool and family are spent.
const NEUTRAL: readonly Activity[] = ['bash', 'think', 'edit']

/**
 * The next line for `activity`, never one in `used`: the curated pool first,
 * then the generated court lines for its family, then the neutral generated
 * lines. Only when all of those are spent (hundreds of calls) does it start
 * the curated pool again, so a session that long hears a repeat.
 *
 * @param seed varies the order between sessions
 * @param count how many lines the session has drawn, so equal states still advance
 */
export function pickLine(activity: Activity, used: ReadonlySet<string>, seed: number, count: number): string {
  const tiers: (() => readonly string[])[] = [
    () => POOLS[activity],
    () => generatedLines(activity),
    () => NEUTRAL.flatMap(generatedLines),
  ]
  for (const tier of tiers) {
    const candidates = tier().filter(line => !used.has(line))
    if (candidates.length > 0) return candidates[mix(seed, count) % candidates.length]!
  }
  const pool = POOLS[activity]
  return pool[mix(seed, count) % pool.length]!
}

/** How many draws of one activity a session gets before any line repeats. */
export function capacityOf(activity: Activity): number {
  return new Set([...POOLS[activity], ...generatedLines(activity), ...NEUTRAL.flatMap(generatedLines)]).size
}

/** The stage direction for a pose, cycling through its list. */
export function stageFor(pose: Pose, count: number): string {
  const list = STAGE[pose]
  return list[count % list.length]!
}

// A command's activity is decided by the first rule any of its simple
// commands matches, so the dangerous ones come first. The alarm rules (lease,
// treason, peril) and the other git rules are anchored to the start of a
// simple command, so `echo "git push --force"` or `rg "rm -rf"` alarms nobody,
// and a dry run (`git clean -n`) is not peril. They read the command text
// only: narration, not a policy (the mod never blocks anything).
const BASH_RULES: ReadonlyArray<readonly [Activity, RegExp]> = [
  ['lease', /^git\s+push\b.*--force-with-lease\b/],
  ['treason', /^git\s+push(?!.*\s(?:--dry-run|-[a-zA-Z]*n)\b).*(?:\s--force(?![-\w])|\s-[a-zA-Z]*f\b|\s\+\S+)/],
  ['peril', /^rm\s+(?:\S+\s+)*-[a-zA-Z]*(?:r[a-zA-Z]*f|f[a-zA-Z]*r)|^rm\s+(?:.*\s)?(?:-r|--recursive)\s(?:.*\s)?(?:-f|--force)\b|^rm\s+(?:.*\s)?(?:-f|--force)\s(?:.*\s)?(?:-r|--recursive)\b|^git\s+reset\s+(?:.*\s)?--hard\b|^git\s+clean(?!.*\s-[a-zA-Z]*n)(?!.*--dry-run)\s+(?:.*\s)?-[a-zA-Z]*f|^Remove-Item\b(?!.*-WhatIf\b).*-Recurse/i],
  ['edit', /^sed\s+(?:-\S+\s+)*-[a-zA-Z]*i|^sed\s+(?:.*\s)?--in-place\b|^perl\s+-[a-zA-Z]*p[a-zA-Z]*i|^patch\b|^git\s+apply\b/],
  ['commit', /^git\s+(?:commit|tag)\b/],
  ['push', /^git\s+push\b|^gh\s+(?:pr\s+create|release\s+create)\b/],
  ['tests', /\b(?:pytest|jest|vitest|mocha|rspec|phpunit|ctest|tox|nox|playwright\s+test|go\s+test|cargo\s+(?:test|nextest)|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|dotnet\s+test|mvn\s+test|gradle\w*\s+test|plugin\s+test|unittest)\b|\bnode\s+--test\b/],
  ['rust', /\b(?:cargo|rustc|rustup|clippy)\b/],
  ['install', /\b(?:npm\s+(?:i|install|ci|add)|pnpm\s+(?:i|install|add)|yarn\s+(?:add|install)|bun\s+(?:i|install|add)|pip3?\s+install|uv\s+(?:add|sync|pip)|poetry\s+(?:add|install)|apt(?:-get)?\s+install|brew\s+install|gem\s+install|go\s+get|choco\s+install|scoop\s+install|winget\s+install)\b/],
  ['lint', /\b(?:eslint|prettier|ruff|black|flake8|mypy|pylint|biome|rubocop|gofmt|golangci-lint|stylelint|shellcheck|tsc\s+--noEmit)\b/],
  ['build', /\b(?:make|cmake|ninja|tsc|webpack|vite\s+build|esbuild|rollup|gradle\w*|mvn|go\s+build|dotnet\s+build|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?build|next\s+build|swift\s+build|bazel)\b/],
  ['infra', /\b(?:docker|podman|kubectl|helm|terraform|tofu|pulumi|ansible|wrangler|vercel|fly|aws|gcloud|az)\b/],
  ['db', /\b(?:psql|mysql|sqlite3|mongosh|redis-cli|prisma|alembic|knex|sequelize|migrate)\b/],
  ['courier', /\b(?:curl|wget|http|xh|Invoke-WebRequest|Invoke-RestMethod)\b/],
  ['git', /^(?:git|gh)\b/],
]

/**
 * A command's simple commands, with quoted text and comments blanked and
 * leading `sudo`, `env` and VAR=value prefixes dropped.
 */
export function segmentsOf(command: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]!
    if (quote === "'") {
      if (ch === "'") {
        quote = null
        current += ch
      }
      continue
    }
    if (quote === '"') {
      if (ch === '\\') i++
      else if (ch === '"') {
        quote = null
        current += ch
      }
      continue
    }
    if (ch === '\\') {
      current += command.slice(i, i + 2)
      i++
    } else if (ch === "'" || ch === '"') {
      quote = ch
      current += ch
    } else if (ch === '#' && (current === '' || /\s$/.test(current))) {
      while (i + 1 < command.length && command[i + 1] !== '\n') i++
    } else if (ch === ';' || ch === '|' || ch === '&' || ch === '\n') {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
    .map(part => part.trim().replace(/^(?:(?:sudo|env|command|exec|time|nohup)\s+|[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, ''))
    .filter(part => part.length > 0)
}

/** The activity a Bash (or PowerShell) command is narrated as. */
export function classifyCommand(command: string): Activity {
  const segments = segmentsOf(command)
  for (const [activity, pattern] of BASH_RULES) if (segments.some(part => pattern.test(part))) return activity
  return 'bash'
}

/** The activity a tool call is narrated as, from its name and input. */
export function classifyTool(tool: string, input: Readonly<Record<string, unknown>>): Activity {
  if (tool === 'Bash' || tool === 'PowerShell') return classifyCommand(String(input.command ?? ''))
  if (tool.startsWith('mcp__')) return 'foreign'
  switch (tool) {
    case 'Read':
    case 'NotebookRead':
    case 'LSP':
      return 'read'
    case 'Grep':
    case 'Glob':
    case 'ToolSearch':
    case 'ListMcpResourcesTool':
    case 'ReadMcpResourceTool':
      return 'search'
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return 'edit'
    case 'Write':
      return 'write'
    case 'WebFetch':
    case 'WebSearch':
      return 'web'
    case 'Agent':
    case 'Task':
    case 'SendMessage':
    case 'Workflow':
      return 'delegate'
    case 'TodoWrite':
    case 'TaskCreate':
    case 'TaskUpdate':
    case 'TaskList':
    case 'TaskGet':
      return 'agenda'
    case 'AskUserQuestion':
      return 'ask'
    case 'EnterPlanMode':
    case 'ExitPlanMode':
      return 'plan'
    case 'Skill':
      return 'skill'
    default:
      return 'misc'
  }
}

/** A short label for what the call touches: a file name or the command's head. */
export function detailOf(tool: string, input: Readonly<Record<string, unknown>>): string | null {
  const path = input.file_path ?? input.notebook_path ?? input.path
  if (typeof path === 'string' && path.length > 0) return path.split(/[\\/]/).filter(Boolean).pop() ?? null
  if ((tool === 'Bash' || tool === 'PowerShell') && typeof input.command === 'string') {
    const head = input.command.trim().split('\n')[0] ?? ''
    return head.length > 48 ? `${head.slice(0, 47)}…` : head
  }
  if (typeof input.pattern === 'string') return input.pattern.length > 40 ? `${input.pattern.slice(0, 39)}…` : input.pattern
  if (typeof input.url === 'string') {
    const m = /^https?:\/\/([^/]+)/.exec(input.url)
    return m ? m[1]! : null
  }
  if (typeof input.query === 'string') return input.query.length > 40 ? `${input.query.slice(0, 39)}…` : input.query
  return null
}

// What the person types that starts or ends the court, mirroring the skill's
// own triggers in skills/eunuch-mode/SKILL.md.
const OFF = /\b(?:drop the bit|normal mode|exit (?:eunuch|vizier) mode|leave (?:eunuch|vizier) mode|(?:eunuch|vizier) mode off)\b/i
const ON = /(?:^|\s)\/eunuch-mode\b|\b(?:eunuch|vizier) mode\b|\brival viziers\b/i

/** Whether a prompt turns the court on, off, or leaves it as it is. */
export function promptIntent(text: string): 'on' | 'off' | null {
  if (OFF.test(text)) return 'off'
  if (ON.test(text)) return 'on'
  return null
}

/** Whether a skill name is the eunuch-mode skill, bare or namespaced by a plugin. */
export function isCourtSkill(name: string): boolean {
  return /(?:^|:)eunuch-mode$/i.test(name.trim())
}
