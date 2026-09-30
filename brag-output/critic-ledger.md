# Critic ledger

The builder never judged its own work. Every round used a fresh, independent critic from a different model family: OpenAI `gpt-6.1-sol` through `codex exec`, read-only, with no memory of earlier rounds. It was not told what had been fixed. Each round it received the same brief (house rules and quality bar), the storyboard, the facts file, contact sheets for both cuts at 0.5 s intervals, dense strips at 0.1 s around every transition, and the measured QC numbers. It returned ranked, timestamped problems and a verdict.

Measurements come from the build, not the critic:
- `render.mjs --check` tests reading time, stillness, opacity, fit, glyph collisions, seal clearance, the 9:16 safe zone and determinism.
- `ffmpeg freezedetect` measures frozen time (n=0.001, d=0.25 s), also on a render with film grain switched off, so grain cannot hide a freeze.
- EBU R128 measures loudness.

| Round | Input | Verdict | Must-fix items raised | What changed after |
| --- | --- | --- | --- | --- |
| 0 | Storyboard and key stills | one more pass | Portrait title and CTA clipped; the verdict was repeated by the opening stamp; the seal read as decoration; the castle and server were too small; the flattery entrance felt like a slideshow | The opening stamp changed from NOT THIS SPRINT to MOST JUDICIOUS (flattery first, refusal later); the seal sits on the petition from frame one; the stamp compresses on impact; the drawing was enlarged; the flattery rises as one line under an ornament; wood-grain desk |
| 1 | First full render | one more pass | Text faded in, dropped out and came back at two scene changes (a real bug); layouts too small; portrait too close to platform UI; too few compositions | Fixed the fade bug by setting every entrance's start state at t=0; added a 9:16 safe-zone check; enlarged everything; added a sheen, a prompt cursor and blinking server lights; the seal now travels in arcs; the castle un-draws before the server draws |
| 2 | Full render | one more pass | Payoff arrives too late; subjects too small; callback resolved too early; CTA too small | Stamp close-up insert; whole-word title slam; the callback winding spans the whole read; larger CTA |
| 3 | Full render | one more pass | Payoff too late: title before prompt; CTA too small; callback line too small; metaphor scene underpowered | Title scene removed (the name moved to the end card); the answer arrives about 4 s sooner; bigger callback line; the ornament bows |
| 4 | Full render | one more pass | Product explained too late; holds feel parked; subjects small; callback thin | "PETITION TO EUNUCH MODE" names the product in the hook; the roller winds downward so MOST JUDICIOUS is the last thing seen; 1.5x push-in on the sealed scroll; bigger stage line |
| 5 | Full render | one more pass | Callback payoff early; mechanism late; portrait CTA and drawing small | The tagline moved into the prompt scene; sealing lands just before the exit; portrait drawing enlarged; three-line portrait command |
| 6 | Full render | one more pass | Middle loses momentum; portrait CTA weak | The prompt scene became two compositions (the tagline fills the scroll, then the prompt); the seal bows with the ornament; heavier ink; the callback roll rises into frame |
| 7 | Full render | one more pass | Portrait subjects small; callback sentence reads as a caption | Portrait scroll runs past the frame edges while its text stays in the safe column; the callback sentence became the lead element |
| 8 | Full render | one more pass | Only the portrait CTA (the command and URL were fine print) | Portrait end card rebuilt: 7.4vmin three-line command, two-line URL at 5.2vmin, smaller title |
| 9 | Full render (30 fps draft) | **ship** | None | Final render at 60 fps |
| 10 | Final render (60 fps, these files) | **ship** | None | Delivered |

## Quality bar, measured on the delivered files

| Check | brag.mp4 (16:9) | brag-9x16.mp4 | Bar |
| --- | --- | --- | --- |
| Duration | 34.4 s | 34.4 s | 30–35 s |
| Frame rate, size | 60 fps, 1920×1080 | 60 fps, 1080×1920 | 60 fps |
| Frozen (grain on) | 0.25 s, one 0.25 s still | 0.27 s, one 0.27 s still | ≤ 1 s per 30 s; no still > 0.5 s |
| Frozen (grain off) | 0.55 s; longest 0.30 s | 0.75 s; longest 0.25 s | same |
| Integrated loudness | −14.3 LUFS | −14.3 LUFS | −14 LUFS for web |
| True peak | −1.9 dBTP | −1.9 dBTP | ≤ −1 dBTP |
| Page checks (`render.mjs --check`) | PASS | PASS | reading time, stillness ≤ 3 px, opacity, fit, collisions, seal clearance, safe zone, determinism |
| Frame one | the petition with the stamp poised | same | a finished picture |
| Sound off | the story is carried by type and props; there is no voiceover | same | understandable muted |

The music-only mix measured −14.4 LUFS; it isn't committed, and `--music-only=FILE` regenerates it.

## Open nice-to-haves from the final critic (not blockers)

1. The run-up to the payoff (tagline, prompt, flattery) is still about 13 s. The reading rule sets most of it, since the lines are verbatim model output.
2. The flattery and the callback share gold-on-dark centred type.
3. The CTA could be bolder still.
4. At rest the seal is small enough that its crown impression is lost.

The critic contradicted itself on one point across rounds: round 3 asked for the tagline to move to the end, and rounds 4–5 asked for it early. The build settled on the tagline early (inside the prompt scene) and the name on the end card.
