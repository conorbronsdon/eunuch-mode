// Generative mode (optional, off by default): a model writes fresh spinner
// lines for the current activity. Pure data and functions, no `$`: what goes
// into a request, what comes back out of one, and when a call is allowed.
//
// Privacy: a request carries only the activity kind, the tool's name, a file
// extension and a command's verb, each checked against a strict pattern.
// Never a path, a file name, a file's contents, a command's arguments, the
// user's prompt or anything from the transcript.

import type { Activity } from './lines.ts'

/** The default model: Claude Code's alias for the current Sonnet, resolved like `--model sonnet`. */
export const DEFAULT_MODEL = 'sonnet'
export const MAX_CALLS_PER_SESSION = 100
export const MIN_INTERVAL_MS = 4000
/** Bounds the background call; the canned line is already on screen, so nothing waits on it. */
export const TIMEOUT_MS = 3000
export const MAX_TOKENS = 40
export const MAX_LINE = 60

/** Everything about an action that may leave the machine. */
export type ActivitySummary = {
  activity: Activity
  tool: string
  /** A file extension such as `.ts`, or null. */
  ext: string | null
  /** A command's verb such as `pytest` or `git push`, or null. */
  verb: string | null
}

// Only well-known programs are named, and only their well-known subcommands:
// an unknown program (a script called `payroll`) or an unknown second word (a
// file, a script name, a secret) is never sent.
const COMMON = ['install', 'add', 'remove', 'run', 'test', 'build', 'publish', 'update', 'init']
const SUBCOMMANDS: Readonly<Record<string, readonly string[]>> = {
  git: ['push', 'pull', 'commit', 'status', 'log', 'diff', 'add', 'rebase', 'merge', 'checkout', 'switch', 'branch', 'fetch', 'clone', 'reset', 'revert', 'stash', 'tag', 'cherry-pick', 'restore', 'show', 'blame', 'init', 'clean', 'apply', 'bisect', 'worktree'],
  gh: ['pr', 'issue', 'repo', 'release', 'run', 'workflow', 'api', 'auth'],
  npm: [...COMMON, 'i', 'ci', 'exec', 'outdated', 'audit', 'version'],
  pnpm: [...COMMON, 'i', 'exec', 'dlx', 'outdated', 'audit'],
  yarn: [...COMMON, 'dlx', 'outdated', 'audit'],
  bun: [...COMMON, 'i', 'x'],
  cargo: [...COMMON, 'check', 'clippy', 'fmt', 'bench', 'doc', 'nextest', 'clean'],
  docker: ['build', 'run', 'compose', 'ps', 'pull', 'push', 'exec', 'images', 'logs', 'stop', 'start', 'rm', 'rmi'],
  kubectl: ['get', 'apply', 'describe', 'logs', 'delete', 'rollout', 'exec', 'port-forward', 'scale'],
  go: ['build', 'test', 'run', 'get', 'mod', 'vet', 'fmt', 'install', 'generate'],
  uv: ['run', 'add', 'sync', 'pip', 'venv', 'lock', 'tool'],
  pip: ['install', 'uninstall', 'freeze', 'list', 'show'],
  pip3: ['install', 'uninstall', 'freeze', 'list', 'show'],
  poetry: ['add', 'install', 'run', 'lock', 'update', 'build', 'publish'],
  dotnet: ['build', 'test', 'run', 'restore', 'publish', 'add'],
  terraform: ['plan', 'apply', 'init', 'destroy', 'fmt', 'validate', 'import'],
  helm: ['install', 'upgrade', 'list', 'template', 'uninstall', 'rollback'],
  claude: ['plugin', 'mcp', 'update'],
}
const PROGRAMS = new Set([
  ...Object.keys(SUBCOMMANDS),
  'python', 'python3', 'node', 'deno', 'ruby', 'java', 'javac', 'php', 'perl', 'swift', 'rustc', 'rustup', 'tsc', 'npx', 'pnpx', 'bunx',
  'pytest', 'jest', 'vitest', 'mocha', 'rspec', 'tox', 'nox', 'phpunit', 'ctest', 'playwright',
  'make', 'cmake', 'ninja', 'bazel', 'gradle', 'gradlew', 'mvn', 'webpack', 'vite', 'esbuild', 'rollup', 'next',
  'eslint', 'prettier', 'ruff', 'black', 'flake8', 'mypy', 'pylint', 'biome', 'rubocop', 'gofmt', 'golangci-lint', 'shellcheck',
  'ls', 'cat', 'head', 'tail', 'grep', 'rg', 'find', 'fd', 'sed', 'awk', 'sort', 'uniq', 'wc', 'diff', 'echo', 'printf', 'cd', 'pwd',
  'mkdir', 'rm', 'cp', 'mv', 'touch', 'chmod', 'ln', 'tar', 'zip', 'unzip', 'which', 'env', 'export', 'sleep', 'jq', 'yq', 'xargs', 'tee',
  'curl', 'wget', 'ssh', 'scp', 'rsync', 'ping', 'psql', 'mysql', 'sqlite3', 'redis-cli', 'mongosh', 'prisma', 'alembic',
  'podman', 'wrangler', 'vercel', 'netlify', 'fly', 'flyctl', 'aws', 'gcloud', 'az', 'ansible', 'pulumi', 'tofu',
  'brew', 'apt', 'apt-get', 'choco', 'scoop', 'winget', 'gem', 'bundle', 'composer', 'conda',
  'get-childitem', 'get-content', 'set-content', 'remove-item', 'copy-item', 'move-item', 'select-string', 'invoke-webrequest',
])
// Claude Code's own tools; a plugin's custom tool is sent as "a tool".
const TOOLS = new Set([
  'Bash', 'PowerShell', 'Read', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'NotebookRead', 'Grep', 'Glob', 'LSP',
  'WebFetch', 'WebSearch', 'Agent', 'Task', 'SendMessage', 'Workflow', 'TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList',
  'TaskGet', 'AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode', 'Skill', 'ToolSearch', 'ListMcpResourcesTool', 'ReadMcpResourceTool',
])
const EXT = /^\.[a-z0-9]{1,6}$/

/** The verb of a shell command's first simple command: `git push`, `pytest`; null for a program nobody knows. */
export function verbOf(firstSegment: string): string | null {
  const words = firstSegment.trim().split(/\s+/)
  const head = (words[0] ?? '').toLowerCase()
  if (!PROGRAMS.has(head)) return null
  const second = (words[1] ?? '').toLowerCase()
  if (SUBCOMMANDS[head]?.includes(second)) return `${head} ${second}`
  return head
}

/** The summary of a tool call that a request may carry. */
export function summarize(
  activity: Activity,
  tool: string,
  input: Readonly<Record<string, unknown>>,
  segments: (command: string) => string[],
): ActivitySummary {
  const safeTool = tool.startsWith('mcp__') ? 'an external tool' : TOOLS.has(tool) ? tool : 'a tool'
  const path = input.file_path ?? input.notebook_path ?? input.path
  let ext: string | null = null
  if (typeof path === 'string') {
    const name = path.split(/[\\/]/).pop() ?? ''
    const dot = name.lastIndexOf('.')
    const candidate = dot > 0 ? name.slice(dot).toLowerCase() : ''
    ext = EXT.test(candidate) ? candidate : null
  }
  let verb: string | null = null
  if ((tool === 'Bash' || tool === 'PowerShell') && typeof input.command === 'string') {
    const first = segments(input.command)[0]
    verb = first ? verbOf(first) : null
  }
  return { activity, tool: safeTool, ext, verb }
}

/** The one user message a request sends: built from the summary alone. */
export function promptFor(summary: ActivitySummary): string {
  const parts = [`Activity: ${summary.activity}`, `Tool: ${summary.tool}`]
  if (summary.verb) parts.push(`Command: ${summary.verb}`)
  if (summary.ext) parts.push(`File type: ${summary.ext}`)
  return `${parts.join('. ')}.\nWrite one new spinner line for this.`
}

/** Treachery's aside: only the kind of grievance travels, never what was done or where. */
export function asidePrompt(grievance: string): string {
  const kind = /^[a-z-]{2,20}$/.test(grievance) ? grievance : 'a misstep'
  return `The ruler just committed a small coding sin: ${kind}.\nWrite one whispered aside from the adviser, who stays fawning to the ruler's face but is quietly keeping a ledger of grievances and plotting a comically doomed coup. Same rules as a spinner line.`
}

/** The voice rules, sent as the system prompt. */
export const SYSTEM = [
  'You write one spinner line for a coding agent\'s terminal, narrated by an obsequious adviser at a fictional composite palace court.',
  'The line describes what the agent is doing right now, translated into palace business: envoys, scrolls, archives, guards, the treasury, the royal food taster, ministries and keepers.',
  'Rules:',
  '- One line, at most 55 characters, sentence case, no quotation marks, no trailing punctuation, no emoji.',
  '- Present participle or short present-tense clause, like: Dispatching the palace guards / Consulting the archives / The royal food taster samples the code.',
  '- Tasteful palace intrigue: the joke is bureaucracy, flattery and court politics.',
  '- Never mention eunuchs or bodies, never joke about castration, gender or sexuality, no slurs, no real people, no real countries, cultures, religions or historical dynasties.',
  '- No violence beyond comic palace guards; nothing crude.',
  'Reply with the line only.',
].join('\n')

const BANNED = /eunuch|castrat|gelding|testic|genital|manhood|penis|sex|rape|kill|blood|slave|harem|sultan|caliph|emperor of|china|chinese|ottoman|persia|byzant|arab|turk|jew|muslim|christian|hindu|god\b|allah|trump|biden|musk|altman|amodei|nazi|hitler/i

/** Cleans a reply into a spinner line, or rejects it (null). */
export function filterLine(raw: string): string | null {
  let text = raw.trim()
  if (/[\r\n]/.test(text)) return null
  text = text.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '').trim()
  text = text.replace(/(?:\.\.\.|…|[.!;:,])+$/, '').trim()
  if (text.length < 8 || text.length > MAX_LINE) return null
  if (!/^[A-Z]/.test(text)) return null
  if (!/^[A-Za-z0-9 ,?'’\-]+$/.test(text)) return null
  if (BANNED.test(text)) return null
  if (/https?:|www\.|[/\\]/.test(text)) return null
  return text
}

/** What the session's generative bookkeeping holds. */
export type GenState = {
  calls: number
  fallbacks: number
  lastAt: number
  inflight: boolean
  inputTokens: number
  outputTokens: number
  /** Generated lines not yet spoken, by activity. */
  cache: Record<string, string[]>
  /** The last few lines the model wrote, for /court generative status. */
  recent: string[]
}

export const EMPTY_GEN: GenState = { calls: 0, fallbacks: 0, lastAt: 0, inflight: false, inputTokens: 0, outputTokens: 0, cache: {}, recent: [] }

/** Whether a call may start now: under the cap, past the interval, none in flight, and none banked for this activity. */
export function mayCall(gen: GenState, activity: Activity | 'aside', now: number): boolean {
  if (gen.inflight) return false
  if (gen.calls >= MAX_CALLS_PER_SESSION) return false
  if (gen.calls > 0 && now - gen.lastAt < MIN_INTERVAL_MS) return false
  return (gen.cache[activity]?.length ?? 0) === 0
}

/** Takes a banked generated line for an activity that nobody has heard, if there is one. */
export function takeBanked(gen: GenState, activity: Activity | 'aside', used: ReadonlySet<string>): { line: string | null; gen: GenState } {
  const banked = (gen.cache[activity] ?? []).filter(line => !used.has(line))
  if (banked.length === 0) return { line: null, gen: { ...gen, cache: { ...gen.cache, [activity]: [] } } }
  const [line, ...rest] = banked
  return { line: line!, gen: { ...gen, cache: { ...gen.cache, [activity]: rest } } }
}
