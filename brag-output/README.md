# Launch film: The Petition Desk

A 34-second launch film for Eunuch Mode in two cuts: [`brag.mp4`](brag.mp4) (16:9, 1920×1080, for the README and GitHub) and [`brag-9x16.mp4`](brag-9x16.mp4) (1080×1920, for X, TikTok and Shorts). Both are 60 fps with audio normalised to −14 LUFS.

A developer's petition ("Rewrite it in Rust.") is stamped MOST JUDICIOUS. Then the real adviser answers: a courtly entrance, "No, not this sprint.", a palace metaphor that carries the advice, and an exit line in character, as the flattered petition is rolled back up, unread. A single red wax seal travels through every scene.

Every line attributed to the skill is a verbatim excerpt from one recorded run of v1.1.0 on Claude Opus 5.5. [facts.md](facts.md) lists each on-screen line and its source; the full transcript is in [../evals/runs/2026-09-30-claude-v1.1.md](../evals/runs/2026-09-30-claude-v1.1.md).

- [storyboard.md](storyboard.md): scenes, purpose, transitions and the carried seal
- [critic-ledger.md](critic-ledger.md): the independent critic's rounds and the measured quality bar
- [contact-sheet.jpg](contact-sheet.jpg): the 16:9 cut, one frame every 0.5 s
- [LICENSES.md](LICENSES.md): music, sound effects, fonts and runtime licences, plus the attribution line to use when posting

## Reproduce

Requires Node.js 22+, FFmpeg on `PATH` and an installed Chrome or Chromium (set `CHROME_PATH` if it is not found).

```bash
cd brag-output
npm install
node render.mjs --fmt=16x9 --check          # reading time, stillness, text fit, seal clearance, determinism
node render.mjs --fmt=9x16 --check
node render.mjs --fmt=16x9 --out=brag.mp4
node render.mjs --fmt=9x16 --out=brag-9x16.mp4
```

The page is a pure function of time: `window.seek(t)` positions one paused GSAP timeline, and `render.mjs` screenshots each frame and pipes it to FFmpeg. Scene lengths are computed from the reading rule (every line stays still for at least max(1.2 s, words ÷ 3.3 + 0.6 s)) and snapped to the music's half-beats.
