<div align="center">

# Eunuch Mode

An Agent Skill that answers your questions as a silver-tongued palace adviser.

*Most judicious, sire.*

[![Stars](https://img.shields.io/github/stars/conorbronsdon/eunuch-mode?style=social)](https://github.com/conorbronsdon/eunuch-mode)
[![MIT](https://img.shields.io/badge/License-MIT-gold)](LICENSE)
[![X](https://img.shields.io/badge/X-%40ConorBronsdon-black)](https://x.com/ConorBronsdon?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode)

</div>

![Illustrative conversation: a ruler proposes rebuilding a working blog, and the adviser recommends publishing an article instead](docs/demo.gif)

*Authored example, animated for illustration; not a recording or a benchmark.*

For people who want their AI assistant to sound like it has survived six palace coups and a quarterly planning meeting. Works with agents that load [Agent Skills](https://agentskills.io), including [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and Codex.

You supply a question. The skill guides the agent to return courtly counsel: a little flattery, a practical recommendation, and an occasional warning from the Ministry of Scope Creep. You decide what to do with it.

## Install

Using the [Skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add conorbronsdon/eunuch-mode --skill eunuch-mode
```

Select your agent when prompted. This installs the skill instructions, not a model or a new permission system.

Or clone and copy the skill folder into Claude Code's personal skills directory:

```bash
git clone https://github.com/conorbronsdon/eunuch-mode.git
mkdir -p ~/.claude/skills
cp -R eunuch-mode/skills/eunuch-mode ~/.claude/skills/
```

For Codex, copy it to `~/.agents/skills/` instead. Either way you get only the skill folder (about 20 KB), not the video or evals. To remove a manual installation, delete only that copied skill directory. If the agent has already loaded it, say “drop the bit” in the current conversation.

## Summon the court

Ask your agent:

> Use eunuch mode. Should I rebuild my working blog this weekend?

Claude Code can also invoke `/eunuch-mode`; Codex supports `$eunuch-mode`.

An excerpt from a recorded run (Claude Opus 5.5, prompt: “Eunuch mode. Should I rewrite our working Node backend in Rust this sprint?”):

> The throne does well to ask before it marches, sire. **No, not this sprint.** A working Node backend is a loyal province that pays its taxes (it ships features and serves users). Tearing it down to rebuild it in Rust is no reform. It is a civil war you would be starting against yourself.
>
> **Imperial decree:** use this sprint to profile production. If one hot path truly hurts, such as image processing, parsing, or a CPU-bound worker, rewrite *only that* in Rust behind a clear boundary […]
>
> *[The Minister of Borrow Checkers bows and rolls his scroll back up, unread.]*

Full answer and ten more cases: [recorded run](evals/runs/2026-09-30-claude-v1.1.md).

## Adjust the ceremony

| Say | Intended response |
| --- | --- |
| “Less silk” | One-line entrance, then plain advice. |
| “Full court” | More ceremony, equally clear advice. |
| “Sealed memorandum” | Frank assessment, minimal praise. |
| “Drop the bit” | Normal answers again. |

These are natural-language requests, not CLI flags. The instructions ask the agent to retain the persona within the conversation; session persistence depends on your agent.

## Palace policy

The adviser is instructed to disagree when your plan is bad, distinguish evidence from guesses, keep JSON and code valid, and write normal client emails when asked. “Scheming” means transparent strategy: priorities, incentives, negotiation, and reversible experiments.

This is a prompt-based persona. Those behaviors are **guidance**, not enforced controls or guarantees. It does not change your agent's tool permissions, create background agents, spy on your coworkers, or grant approval for external actions. Review consequential advice and approve actions through your agent's usual workflow.

The court is a fictional composite: no single real-world culture's dress, titles or customs are the joke. The comedy targets obsequious assistants and imperial project management, not real cultures or bodies.

## Inside the palace

- [SKILL.md](skills/eunuch-mode/SKILL.md): the complete persona and invocation rules. The `skills/eunuch-mode/` folder is everything an install copies.
- [Court examples](skills/eunuch-mode/references/court-examples.md): authored samples.
- [Evaluation prompts](evals/cases.json): activation, exit, honesty, humour-floor, no-repeat and output-format cases.
- [Recorded runs](evals/runs/2026-09-30-claude-v1.1.md): all eleven cases on Claude, plus before/after samples, verbatim. An earlier [five-turn GPT trial](evals/observed-trial.md) covers v1.0.0.
- [Validation](scripts/validate.py): dependency-free package checks.
- [Launch video](brag-output/brag.mp4): a short parody launch, made with [brag](https://github.com/latent-spaces/brag) and Hyperframes.
- [Video source and reproduction](brag-output/README.md): composition, render command, and credits.

Regenerate the illustrative GIF and social card with Python 3 and Pillow:

```bash
python3 -m pip install Pillow
python3 scripts/render_demo.py
python3 scripts/validate.py
```

Package validation checks the files and metadata; it does not prove that every model will follow the persona. Checks run locally. Optional CI and release templates live in docs/workflow-templates; copy them into .github/workflows using a credential with workflow permission to activate them.

## Inspiration

[Shivers's post](https://x.com/thinkingshivers/status/2105224898876436814) supplied the premise: a scheming palace adviser instead of another earnest AI companion. The original post references a Chinese eunuch; this skill turns that into a deliberately fictional composite court.

[The Prince, chapter XXIII](https://www.gutenberg.org/files/1232/1232-h/1232-h.htm) supplied a useful counterweight: an adviser must be able to tell the ruler the truth. The rest is original palace bureaucracy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small, funny improvements welcome. Keep the advice useful and label sample conversations honestly.

## About

Built by [Conor Bronsdon](https://conorbronsdon.com/?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode).

[Chain of Thought](https://chainofthought.show/?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode) · [GitHub](https://github.com/conorbronsdon?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode) · [X](https://x.com/ConorBronsdon?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode) · [LinkedIn](https://www.linkedin.com/in/conorbronsdon/?utm_source=github&utm_medium=referral&utm_campaign=repo-readme&utm_content=eunuch-mode)

---

## Disclaimer

*This is an independent personal project, not affiliated with, sponsored by, or endorsed by any company. All views expressed are my own.*

## License

[MIT](LICENSE). Video dependencies and audio have their own licenses; see [video credits](brag-output/README.md).
