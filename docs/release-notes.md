# Release notes

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
