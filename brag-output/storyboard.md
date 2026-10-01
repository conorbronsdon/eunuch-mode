# Storyboard: The Petition Desk (as built)

**The character.** The adviser is an original character drawn in SVG inside `composition/index.html`: a bald, soft-faced palace functionary with heavy-lidded, sly eyes and a small smirk. He wears a layered claret robe with a teal inner panel, gold trim and a chain of office. The court is a fictional composite, so no single real-world culture's dress is the joke.
- Expression states: heavy-lidded side-eye, a knowing glance at the viewer, eyes closed in a fawning smile, a whisper ("o" mouth, hand raised), and a wink.
- Hand states: steepled, raised to whisper, folded, a flat stop palm.
- Motion: glides in, leans to whisper, bows, folds his arms.

He is the recurring thread. The red wax seal (the carried object) lives on his chain of office; when it leaves to punctuate a scene, its mount is visibly empty, and it returns home after the prompt. The humour is palace intrigue about flattery and bureaucracy, never about his body.

**The story.** A developer at a laptop wants to "Rewrite it in Rust." The adviser slides in at his shoulder and whispers "Most judicious, sire." Then the real run answers:
- the courtly entrance, while he bows;
- "No, not this sprint.", with his arms folded;
- a palace metaphor that carries the advice;
- his exit line, as he bows and rolls the flattered petition back up, unread.

**Look and sound.**
- Palette: ink #16120E, manila #E8D5A3, vellum #F3E6C4, wax #9E1B20, gold #E2BE74, robe claret #7D1F2E, teal #1F4E4A.
- Type: IM Fell English (the court's voice), Special Elite (petitions), JetBrains Mono (the laptop, prompt and install line).
- Music: "Trouble in the Garden" (Augmentality / Brandon Morris, CC0), about 117 BPM. The band enters on the whisper at 0.5 s.

**Timing.** Scene lengths come from the reading rule (every line still and fully visible for at least max(1.2 s, words / 3.3 + 0.6 s), counted after it lands), snapped to half-beats. `node render.mjs --check` prints the exact windows. Total: 30.2 s.

| # | Time (s) | On screen | Purpose | Exit | Adviser / seal |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.0–4.6 | Frame one: a developer (from behind) at a laptop showing the real prompt: REAL RUN · CLAUDE CODE, "Eunuch mode.", "Should I rewrite our working Node backend in Rust this sprint?". From frame one the adviser is already at the developer's shoulder, hand cupped, eyes on him; he leans right into the developer's ear and whispers; a dashed whisper balloon reads "Most judicious, sire." The developer turns toward him and nods, flattered; the adviser checks the reaction, then slides a sly glance at the viewer. | Hook: the character, the premise and proof of a real run, together | The seal pops off his chain and swells to fill the frame | Glides in, whispers, checks the developer, side-eye to camera |
| 2 | 4.6–9.2 | "The throne does well to ask before it marches, sire." rises as one block under a gold ornament; the developer's head returns in the foreground; the adviser bows to him, conspicuously too deep, as the camera pushes in, checks whether the developer bought it (the developer nods), catches us watching (a startled look), snaps instantly back to piety, then gives us a held, lopsided side-eye; the camera eases back out as he gives the viewer a raised-brow look and rubs his steepled hands | The flattery (signature 1) | Hard cut on the beat | The seal returns to his chest |
| 2b | 9.2–10.2 | The glance: a close-up of his face alone, no text. Away from the developer he slides his eyes to us, one brow down, smirking: the scheme, shared with the viewer | The emotional hinge between flattery and candour | Hard cut on the beat | His chain of office |
| 3 | 10.2–12.9 | Manila: "No," in wax red, "not this sprint"; he looms closer and larger, arms folded, holding direct eye contact with a flat mouth and one lowered brow, and slowly shakes his head; the smirk returns only after the verdict lands | The turn (signature 2): the ceremony was flattery; this is the advice | "No," drops, the page tears in two, he slips out | The seal leaves his chest to become the full stop |
| 4 | 12.8–17.9 | "A working Node backend is a loyal province that pays its taxes." A large castle is drawn, un-drawn and redrawn as a server rack with blinking lights (the drawing is the lead subject; the server lands with a punch, boots with every light going green, and the camera pushes in); the skill's own gloss appears beneath | The palace metaphor doing real work | Sheet slides off left | Seal pins the sheet's corner |
| 5 | 17.9–23.8 | "[The Minister of Borrow Checkers bows and rolls his scroll back up, unread.]" drops in as one block. The petition is pushed toward him; a sharp reframe closes on his outstretched flat palm stopping it dead, face turned away, eyes shut (he will not read it); at once a roller briskly winds the petition (stamped MOST JUDICIOUS) shut from the top, growing into a fat rolled scroll; a close view pushes in on the sealed roll as he gives a dismissive little bow, then tosses the sealed petition over his shoulder just as the line finishes | The callback (signature 3): he does exactly what his line says | The petition flies out of frame; he glides to the end card | Seal closes the rolled petition |
| 6 | 23.8–30.2 | Two beats: "Eunuch Mode" drops in and he presents it with a small bow (tagline "A palace adviser for your AI assistant."); then `$ npx skills add conorbronsdon/eunuch-mode` slams in as he steps forward, larger in frame, presenting it with an open palm, and github.com/conorbronsdon/eunuch-mode follows | Name, what it is, CTA; in 9:16 the text sits on top and he fills the lower half, his face just below the URL | Audio fades | Arms folded, smug; he settles into a final knowing wink; seal is the final full stop |

Ambient motion (candle glow, dust, a slow desk drift and film grain) keeps holds alive. So does one purposeful action per hold: the caret, the glance, the bow, the blinking server lights, the winding roller and the wink. The text itself stays still.
