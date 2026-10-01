# Critic ledger

The builder never judged its own work. Every round used a fresh, independent critic from a different model family: OpenAI `gpt-6.1-sol` via `codex exec`, read-only, with no memory of earlier rounds. The critic was never told what had been fixed. Each round it received:
- the same brief: the house rules, the quality bar, and from version 2 the owner's character direction;
- the storyboard and the facts file;
- contact sheets for both cuts at 0.5 s;
- dense strips at 0.1 s around each transition;
- the measured QC numbers.

It returned ranked, timestamped problems and a verdict.

The measurements come from the build, not the critic:
- `render.mjs --check` tests reading time, stillness, opacity, fit, glyph collisions, seal clearance, the 9:16 safe zone and determinism. Collisions cover text against text, the seal and the character; the character test is a hit test on his painted pixels.
- `ffmpeg freezedetect` (n=0.001, d=0.25 s) runs on each cut, including a render with film grain off, so grain cannot hide a freeze.
- EBU R128 loudness is measured on each cut.

## Version 2: the character (current)

Owner direction (2026-09-30):
- The film needs an eunuch character within the first couple of screens for emotional pull and amusement.
- He must be original and drawn in code: bald, soft round face, heavy-lidded sly eyes and a smirk, in a layered robe from a fictional composite court.
- The audio must need no credit.

The adviser was built as an SVG with expression states (heavy-lidded side-eye, glance to camera, closed-eye fawning smile, whisper, flat refusal, wink) and hand states (steepled, whispering, folded, stop palm). The music changed to a CC0 track.

| Round | Verdict | Main must-fix raised | What changed after |
| --- | --- | --- | --- |
| 1 | one more pass | Payoff too late; too few compositions | The real prompt moved onto the developer's laptop in the hook; the separate prompt scroll was cut; the tagline moved to the end card; callback acting added |
| 2 | one more pass | Portrait prompt clipped by the bezel; holds parked; refusal acting weak | Portrait laptop resized; head-shake "no"; calculating glance after the bow; thicker castle/server strokes |
| 3 | one more pass | Too few developments; whisper reads as a symbol; callback carried by the caption | Developer moved closer and nods; palm-up refusal with the head turned away; shorter seal wipe |
| 4 | one more pass | Few framing changes; entrances lack weight | Flattery and stage direction enter as single typographic moves; close view on the sealed roll; end title drops in |
| 5 | one more pass | Middle loses the character; holds | Bigger "No" framing; flat mouth and lowered brow; dominant castle drawing; curtain call |
| 6 | one more pass | Holds lack consequential beats | Two-beat end card; camera eases out after the bow; server punch and push-in |
| 7 | one more pass | Callback payoff thin; repeated staging | The sealed petition is tossed over his shoulder |
| 8 | one more pass | Repeated staging | Developer returns in the flattery scene; refusal palm; he presents the command |
| 9 | one more pass | Callback gives the petition too much authority; holds | Palm stops the petition dead; the server boots green; one final beat (wink) |
| 10 | one more pass | Two flattery beats in a row; repeated grammar | Excessive bow; reframes on the palm and on the command |
| 11 | one more pass | Same hierarchy throughout; callback framing | New close-up "glance" shot between flattery and "No"; hook starts with more of his face |
| 12 | one more pass | Stop gesture reads like the whisper hand | New flat stop-palm pose; tighter whisper |
| 13 | one more pass | Portrait staging weak; seal read as two objects | The seal lives on his chain (empty mount when away); brisker roll; portrait character higher |
| 14 | one more pass | "No" face too friendly; portrait end loses him | Direct eye contact, flat mouth and lowered brow on "No"; portrait end card restaged (text top, him large below); collision check switched to painted-pixel hit testing |
| 15 | one more pass | Hook relationship; dead air after the toss | Frame one already mid-whisper; a "caught us watching" beat; the toss lands as the line finishes; softer sheen |
| 16 | **ship** | None | Final render at 60 fps |
| Final (60 fps, these files) | **ship** | None | Delivered |

Open nice-to-haves from the final critic, not blockers:
- The callback splits attention between the caption and the action.
- The opening compositions are closely related.
- He could carry more physical weight in his poses.
- The landscape end card could be bolder.
- The server finish is still diagrammatic.

## Quality bar, measured on the delivered files

| Check | brag.mp4 (16:9) | brag-9x16.mp4 | Bar |
| --- | --- | --- | --- |
| Duration | 30.2 s | 30.2 s | 30–35 s |
| Frame rate, size | 60 fps, 1920×1080 | 60 fps, 1080×1920 | 60 fps |
| Frozen (grain on) | 0 s | 0.25 s; longest 0.25 s | ≤ 1 s per 30 s; no still > 0.5 s |
| Frozen (grain off) | 0 s | 0.55 s; longest 0.30 s | same |
| Integrated loudness | −14.6 LUFS | −14.6 LUFS | −14 LUFS for web |
| True peak | −1.4 dBTP | −1.4 dBTP | ≤ −1 dBTP |
| Page checks (`render.mjs --check`) | PASS | PASS | reading time, stillness ≤ 3 px, opacity, fit, collisions (text, seal, character), seal clearance, safe zone, determinism |
| Frame one | the adviser at the developer's shoulder, mid-whisper, the real prompt on screen | same | a finished picture |
| Sound off | type, props and the character's acting carry it; no voiceover | same | understandable muted |

The music-only mix measured −14.7 LUFS (`--music-only=FILE` regenerates it).

## Version 1: The Petition Desk without a character (superseded)

Version 1 ran 11 rounds; rounds 9 and 10 said ship. Conor's review ("not bad, but it needs to show some sort of eunuch character... it lacks emotional pull and amusement without it") led to version 2. Version 1 used "Sneaky Snitch" by Kevin MacLeod (CC BY 4.0), which needs a credit; version 2 replaced it with a CC0 track.
