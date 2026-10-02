# Release notes

## v1.3.0: The court mod

The adviser now has a body, on your screen.

**A Claude Code mod** (`eunuch-mode-court`, installed with `/plugin`). While eunuch mode is on:

- **The adviser** stands above your prompt in half-block pixel art: bald, heavy-lidded, smirking, in the claret robe from the launch film. He bows while tools run, scribbles on a scroll for edits, whispers while the model thinks, side-eyes a failed command, panics at `git push --force` or `rm -rf`, and finishes with a smug bow.
- **The palace spinner** narrates each action: "Dispatching the palace guards", "Amending the royal scroll", "The royal food taster samples the code", "Bribing the borrow checker". About 250 curated lines, extended by the court roster, so no line repeats until several hundred have been spoken. No model calls.
- **The crown:** `👑 Court in session` in the status line.

It follows the skill: "eunuch mode" convenes the court and "drop the bit" adjourns it. `/court on|off|always|skill|never` overrides that. It never blocks or changes a tool call, a prompt or the model's output.

```text
/plugin marketplace add conorbronsdon/eunuch-mode
/plugin install eunuch-mode-court@eunuch-mode
/reload-plugins
```

Needs Claude Code 2.1.287 or later. Tested with `claude plugin validate`, 15 runtime tests (`claude plugin test`) and 104 pure tests in CI. It was recorded in a real terminal session; the desktop app is untested. The skill itself is unchanged apart from its version number, and the mod is optional.

## v1.2.0: The court expands

The court has hired staff.

**Rival viziers.** Say "convene the rival viziers" and the Grand Vizier argues for your bold plan, the Royal Treasurer argues against it, and the adviser rules: yes, no or yes-if, with a next step. From the recorded run, on microservices before a Series A:

> *Grand Vizier:* "Velocity, Treasurer!" *Treasurer:* "Yes. Microservices cost you velocity."

**Decree cards.** After a clear ruling, an agent that can run shell commands offers once: "Shall I have the scribes prepare a decree card?" Yes renders a PNG with a red wax seal and an APPROVED, DEFERRED or TO THE DUNGEON stamp (Python + Pillow, bundled OFL font). Two real cards from the run are attached.

**Eighteen easter eggs.** Each fires once per conversation, and only on a genuine trigger. Try `git push --force` ("High treason, sire! The palace guards have been summoned."), a Friday deploy ("The court astrologers forbid it, sire. Mercury is in staging."), or asking for a 5% raise. Near misses (raising a Python exception) stay quiet, and the full advice always follows.

**A court roster.** About fifty ministries, offices and honorifics, so the gags vary and never repeat within a conversation.

**Also:** "vizier mode" as a politer alias; commit-message decrees on request (one `Decreed-by:` trailer, nothing else); one optional ASCII prop in Full court; and code identifiers stay plain.

**Evals.** 36 cases, including seven easter eggs each tested against a near miss, and a verbatim recorded run on Claude Opus 5.5. CI now renders sample decree cards.

**Three feature videos** (16:9 and 9:16 attached): High Treason, Rival Viziers and The Decree Card. Every line is from the recorded run. Music: "Trouble in the Garden" by Augmentality (CC0); sound effects by Kenney (CC0).

The skill folder grows from about 20 KB to about 110 KB, mostly the card font.

## v1.0.0

Eunuch Mode v1.0.0 turns an Agent Skills-compatible assistant into a fictional palace adviser.

- Explicit invocation and exit; less silk, full court, and sealed memorandum styles.
- Courtly flattery paired with candid recommendations.
- Nine reusable evaluation cases and one recorded five-turn trial.
- Reproducible illustrative GIF, social card, and a 22-second launch video.

This is prompt guidance, not enforced behavior or an authorization system.
