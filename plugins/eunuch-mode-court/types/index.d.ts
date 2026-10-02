// The state this mod keeps in the host for the session ($.state), so it
// survives a hot reload. `scene` is what the band and the spinner draw from;
// `ledger` is bookkeeping no drawing reads, so writing it redraws nothing;
// `frame` is the animation tick, kept apart so a tick never races a scene change.

export type CourtPose = 'portrait' | 'bow' | 'scribble' | 'whisper' | 'alarm' | 'sideeye' | 'smug'

export type CourtScene = {
  /** Whether the court is in session (the skill is on, or /court on). */
  active: boolean
  /** The adviser's pose. */
  pose: CourtPose
  /** The spinner's narration while a turn runs, or the closing line after it. */
  line: string | null
  /** The stage direction beside the figure. */
  stage: string | null
  /** What the current call touches: a file name or a command's head. */
  detail: string | null
  /** True for a few seconds after a turn ends, while the closing pose shows. */
  linger: boolean
}

export type CourtLedger = {
  /** Varies the order of lines between sessions. */
  seed: number
  /** Lines drawn so far this session. */
  count: number
  /** Every line already used this session, so none repeats. */
  used: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'eunuch-mode-court': { scene: CourtScene; ledger: CourtLedger; frame: number }
  }
}
