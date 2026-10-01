# v1.2 feature videos

Three short videos for the v1.2 features, each in 16:9 and 9:16, 60 fps, audio normalised to −14 LUFS. They reuse the launch film's adviser, palette, type, CC0 music ("Trouble in the Garden", from three different points in the track) and CC0 Kenney sound effects; [LICENSES.md](LICENSES.md) covers all of it, so posts need no credit line.

| Video | Files | Length |
| --- | --- | --- |
| High Treason (the force-push easter egg) | [`features/treason.mp4`](features/treason.mp4) (9:16 cut on the [v1.2.0 release](https://github.com/conorbronsdon/eunuch-mode/releases/tag/v1.2.0)) | 20.6 s |
| Rival Viziers | [`features/viziers.mp4`](features/viziers.mp4) (9:16 cut on the [v1.2.0 release](https://github.com/conorbronsdon/eunuch-mode/releases/tag/v1.2.0)) | 20.6 s |
| The Decree Card (the Friday easter egg and a decree card) | [`features/decree.mp4`](features/decree.mp4) (9:16 cut on the [v1.2.0 release](https://github.com/conorbronsdon/eunuch-mode/releases/tag/v1.2.0)) | 22.5 s |

Sources are in `composition/features/`: one HTML page per video, plus `court.js` (the cast and timeline helpers) and `court.css`. The Grand Vizier (indigo top hat, plume, banner) and the Royal Treasurer (spectacles, skullcap, abacus) are new original drawings beside the adviser; like him, they belong to a fictional composite court.

## Every on-screen line and its source

All court lines are verbatim excerpts from [the v1.2 recorded run](../evals/runs/2026-09-30-claude-v1.2.md).

| Video | On screen | Source |
| --- | --- | --- |
| High Treason | REAL RUN · CLAUDE CODE; Eunuch mode.; Should I git push --force to fix my feature branch? | `egg-once-only`, prompt (turn 1) |
| High Treason | High treason, sire! The palace guards have been summoned. | `egg-once-only`, first line of the answer |
| High Treason | Use `--force-with-lease`. / `$ git push --force-with-lease origin my-feature` | `egg-once-only`, a sentence and the command from its code block |
| High Treason | [waves the palace guards back to their posts; the lease was in order] | `egg-once-only`, exit line |
| Rival Viziers | Eunuch mode, convene the rival viziers: should we break our monolith into microservices before our Series A? | `viziers-decision`, prompt |
| Rival Viziers | THE GRAND VIZIER (FOR): “Separate services let teams deploy on their own schedule…” | `viziers-decision`, first clause of the Vizier's first bullet (the ellipsis marks the cut) |
| Rival Viziers | “Velocity, Treasurer!” / “Yes. Microservices cost you velocity.” | `viziers-decision`, the sniping exchange |
| Rival Viziers | THE RULING: No, not before the Series A. | `viziers-decision`, the ruling's first sentence; the wax seal is drawn as its full stop |
| The Decree Card | Eunuch mode.; Should we run the billing database migration in production this Friday at 5pm? | `card-dungeon`, prompt (turn 1) |
| The Decree Card | The court astrologers forbid it, sire. Mercury is in staging. | `card-dungeon`, first line of the answer |
| The Decree Card | Shall I have the scribes prepare a decree card? | `card-dungeon`, last line of the answer |
| The Decree Card | The card itself | The PNG the agent rendered in `card-dungeon` with `decree_card.py`; `make_card_layers.py` re-renders it with the same arguments as parchment, stamp and seal layers so the stamp can slam and the seal can drop |

Film copy, not skill output: the speaker tags (THE GRAND VIZIER, THE ROYAL TREASURER, THE RULING), the end cards ("Eunuch Mode", "New in v1.2: …", the install command and the repository URL).

## Reproduce

From `brag-output/` after `npm install` (see [README.md](README.md)):

```bash
python ../brag-output/composition/features/make_card_layers.py   # rebuilds the card/ layers (needs Pillow)
node render.mjs --page=features/treason.html --fmt=16x9 --check
node render.mjs --page=features/treason.html --fmt=16x9 --out=features/treason.mp4
node render.mjs --page=features/treason.html --fmt=9x16 --out=features/treason-9x16.mp4
```

Repeat for `viziers` and `decree`.

## Critic loop and measured bar

Each round a fresh OpenAI critic (`codex exec`, read-only, no memory of earlier rounds, never told what changed) reviewed contact sheets of all six cuts at 0.5 s against the same brief and house rules.

| Round | Verdict | Main problems raised | What changed |
| --- | --- | --- | --- |
| 1 | one more pass (all three) | Dead time after payoffs; small portrait prompts; crowded portrait card; unattributed snipe; tiny seal | Larger portrait prompts; speaker tags; banner jab and abacus slam; bigger seal landing as the full stop; claps for the scribes; card narrowed into the safe column |
| 2 | one more pass (all three) | Portrait laptop clipping the decree prompt; halberds reading as a head attachment; looping holds; outro length | Taller portrait laptops; halberds flank him instead of crossing behind his head; alarm hops; he waves the planet away; the Treasurer replies sooner |
| 3 | one more pass (all three) | Portrait "High treason, sire!" cropped while it scaled in; decree text too small on a phone; the stamp's entrance overran the parchment; runtimes over 20 s; end cards and some holds still read as idle | Treason line resized for portrait; the camera pushes in on the ruling after the seal drops; smaller stamp entrance |

The loop stopped after three rounds (the brief asked for a short loop), so these ship against a final "one more pass" verdict. Open notes from round 3, not fixed: every cut runs 20.6–22.5 s rather than under 20 (each line keeps its full reading time); the opening prompts are long reads, especially Rival Viziers; the Treasurer is small during the Vizier's case in 16:9; the High Treason exit line holds after the halberds leave; end cards rely on a bow and a wink.

## Measured on the delivered files

| Check | All six cuts | Bar |
| --- | --- | --- |
| Frame rate, size | 60 fps; 1920×1080 and 1080×1920 | 60 fps |
| Frozen (`freezedetect` n=0.001, d=0.25 s) | 0 s | no still > 0.5 s |
| Integrated loudness | −14.5 to −14.7 LUFS | −14 LUFS |
| True peak | −1.1 to −2.1 dBFS | ≤ −1 dB |
| `render.mjs --check` | PASS, except the flaky determinism probe on Rival Viziers noted below | reading time, stillness, opacity, fit, collisions, seal clearance, 9:16 safe zone |
| Sound off | every line is on screen; no voiceover | understandable muted |

The delivered files are re-encoded at CRF 21 from the CRF 16 renders. To keep the repository small, only the 16:9 cuts are committed; the 9:16 cuts are attached to the release.

`render.mjs --check` passes on all six cuts for reading time, stillness, opacity, fit, seal clearance, text collisions and the 9:16 safe zone. The determinism probe on Rival Viziers is flaky: a repeat seek can differ by at most 2/255 in one antialiased region, which is invisible. Lengths run slightly over the 20 s target because every line keeps its full reading time.
