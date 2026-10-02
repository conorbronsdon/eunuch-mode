// The adviser from the launch film (bald, heavy-lidded, a smirk, a claret robe
// over a teal collar, a gold chain with a red jewel) as half-block pixel art.
// Each sprite is 14 pixels wide and 12 tall; every terminal cell holds two
// pixels stacked (▀ with a foreground and background colour), so a sprite
// draws in 14 columns and 6 rows. Pure data, no `$`.

import type { Pose } from './lines.ts'

/** The film's palette, nudged so every colour reads on a dark and a light terminal. */
export const PALETTE: Readonly<Record<string, string>> = {
  S: '#dfae86', // skin
  s: '#b8835c', // skin shadow
  H: '#f4d6b6', // scalp highlight
  E: '#2a1a12', // pupil, ink
  W: '#fbf4ea', // eye white
  L: '#6e3b2a', // heavy lid, brow
  M: '#8a3a2c', // mouth
  C: '#e39482', // blush
  R: '#a3222a', // claret robe
  r: '#6e0f13', // robe shadow
  T: '#23615a', // teal collar
  G: '#d8ad4a', // gold chain
  J: '#e5453c', // jewel
  P: '#f3e6c8', // parchment
  p: '#c4ab7c', // parchment edge
  Q: '#f7f3ea', // quill feather
  B: '#7fc4ee', // a bead of sweat
}

const ROBE = ['...GTTTTTTG...', '.RRRGTTTTGRRR.', 'RRRRRGJJGRRRRR', 'rRRRRRSSRRRRRr']

/** Two frames per pose; the band alternates them while a turn runs. */
export const SPRITES: Readonly<Record<Pose, readonly (readonly string[])[]>> = {
  // The film's portrait: side-eye under heavy lids, a one-sided smirk.
  portrait: [
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSWEESSWEESs.',
      '.sSCSSSsSSMSs.',
      '..SSSSMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSSSSSSSSSSs.',
      '.sSCSSSsSSMSs.',
      '..SSSSMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
  ],
  // Working: a fawning bow, eyes lowered, bobbing a pixel deeper.
  bow: [
    [
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSCSSSsSSCSs.',
      '..SSSSMMSSSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
    [
      '..............',
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSCSSSsSSCSs.',
      '...SSSMMSSS...',
      ...ROBE,
    ],
  ],
  // Edits: head down over a scroll, the quill moving along the line.
  scribble: [
    [
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSCSSSsSSCSs.',
      '..SSSSMMSSSSQ.',
      '...SSSSSSSSQQ.',
      '...GTTTTTTGQ..',
      '.RpPPPPPPPEPp.',
      'RRpPEEPEEPPPpR',
      'rRSppppppppSRr',
    ],
    [
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSCSSSsSSCSs.',
      '..SSSSMMSSSS..',
      '...SSSSSSSS..Q',
      '...GTTTTTTG.QQ',
      '.RpPPPPPPPPPEp',
      'RRpPEEPEEPEEpR',
      'rRSppppppppSRr',
    ],
  ],
  // Thinking: eyes slid sideways, a hand raised to hide the whisper.
  whisper: [
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSEEWSSEEWSs.',
      '.sSCSSSsSsSSs.',
      '..SSSSMsSSsS..',
      '...SSSSsSSs...',
      '...GTTTsSSsR..',
      '.RRRGTTRRRRRR.',
      'RRRRRGJJGRRRRR',
      'rRRRRRRRRRRRRr',
    ],
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSSSSSSSSSSs.',
      '.sSCSSSsSsSSs.',
      '..SSSSMsSSsS..',
      '...SSSSsSSs...',
      '...GTTTsSSsR..',
      '.RRRGTTRRRRRR.',
      'RRRRRGJJGRRRRR',
      'rRRRRRRRRRRRRr',
    ],
  ],
  // Peril: brows up, eyes wide, mouth open, a bead of sweat.
  alarm: [
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '.BSLLSSSSLLS..',
      'BBSSSSSSSSSSs.',
      '.sWEWSSSSWEWs.',
      '.sSCSSSsSSCSs.',
      '..SSSSEESSSS..',
      '...SSSEESSS...',
      ...ROBE,
    ],
    [
      '....SSSSSS....',
      '..SSHHSSSSS...',
      '..SLLSSSSLLSB.',
      '.sSSSSSSSSSBB.',
      '.sWEWSSSSWEWs.',
      '.sSCSSSsSSCSs.',
      '..SSSSEESSSS..',
      '...SSSEESSS...',
      ...ROBE,
    ],
  ],
  // Errors: one brow raised, pupils hard to the side, lips pressed flat.
  sideeye: [
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSLLS..',
      '.sSLLLSSSSSSs.',
      '.sSSWESSSWWEs.',
      '.sSCSSSsSSCSs.',
      '..SSSMMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
    [
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSLLS..',
      '.sSLLLSSSSSSs.',
      '.sSEWSSSSEWWs.',
      '.sSCSSSsSSCSs.',
      '..SSSMMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
  ],
  // Success: a small bow with eyes shut in satisfaction, then a sly look up.
  smug: [
    [
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSSSS..',
      '.sSLLLSSLLLSs.',
      '.sSCSSSsSSMSs.',
      '..SSSSMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
    [
      '..............',
      '....SSSSSS....',
      '...SHHSSSSS...',
      '..SSSSSSSLLS..',
      '.sSLLLSSWWESs.',
      '.sSCSSSsSSMSs.',
      '..SSSSMMMMSS..',
      '...SSSSSSSS...',
      ...ROBE,
    ],
  ],
}

/** One run of cells drawn in the same colours. */
export type Run = { text: string; color?: string; backgroundColor?: string }

/**
 * A sprite as terminal rows of coloured runs: each cell is two stacked
 * pixels, drawn as `▀` (top in the foreground, bottom in the background),
 * `▄` when only the bottom is set, `█` when both match, and a space when
 * both are transparent, so the terminal's own background shows through.
 */
export function toRows(sprite: readonly string[]): Run[][] {
  const rows: Run[][] = []
  for (let y = 0; y < sprite.length; y += 2) {
    const top = sprite[y] ?? ''
    const bottom = sprite[y + 1] ?? ''
    const width = Math.max(top.length, bottom.length)
    const runs: Run[] = []
    for (let x = 0; x < width; x++) {
      const t = PALETTE[top[x] ?? '.']
      const b = PALETTE[bottom[x] ?? '.']
      let cell: Run
      if (!t && !b) cell = { text: ' ' }
      else if (t && !b) cell = { text: '▀', color: t }
      else if (!t && b) cell = { text: '▄', color: b }
      else if (t === b) cell = { text: '█', color: t }
      else cell = { text: '▀', color: t, backgroundColor: b }
      const last = runs[runs.length - 1]
      if (last && last.color === cell.color && last.backgroundColor === cell.backgroundColor && (cell.text === last.text.slice(-1) || cell.text === ' ')) {
        last.text += cell.text
      } else {
        runs.push(cell)
      }
    }
    rows.push(runs)
  }
  return rows
}

/** The frame of a pose to draw at a given tick. */
export function frameOf(pose: Pose, tick: number): readonly string[] {
  const frames = SPRITES[pose]
  return frames[Math.abs(tick) % frames.length]!
}
