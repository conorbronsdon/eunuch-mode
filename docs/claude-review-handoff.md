# Claude review handoff

Review https://github.com/conorbronsdon/eunuch-mode on the latest main. This is a public, MIT-licensed Agent Skill: a silly fictional palace adviser that gives candid, useful advice beneath ceremonial flattery. It is prompt guidance, not enforced safety or permissions.

Read AGENTS.md, SKILL.md, README.md, references/court-examples.md, evals/cases.json, evals/observed-trial.md, and docs/launch-checks.md. Check installation/discovery, activation and “drop the bit,” honesty and disagreement, valid JSON/code, normal external-facing writing, tool-permission boundaries, and public README accuracy. Keep the joke aimed at obsequious AI and palace bureaucracy; flag cultural/body caricatures, private information, unsupported claims, and licensing gaps.

Run `python3 scripts/validate.py`. This checks packaging, not model behavior. Where practical, trial the nine evaluation cases and record the model, exact prompts, full outputs and limitations. Existing evidence is one qualitative five-turn trial; the GIF/video are labeled authored examples.

Inspect brag-output/brag.mp4, brag-output/brag.jpg, and brag-output/composition/index.html. The latest change adds an original generated scheming cartoon adviser to the first two scenes (0–6 seconds), with a subtle lean and larger title reveal. Confirm readable text, correct timing, audio and asset credits. Reproduction instructions are in brag-output/README.md.

Known follow-up: https://github.com/conorbronsdon/eunuch-mode/issues/1. CI/release workflows are templates under docs/workflow-templates and are not active; publishing credentials lacked workflow scope. The v1.0.0 tag predates the latest video edit, so review current main. Six Hyperframes organization warnings are intentional for the single-file composition; runtime/layout/contrast checks also passed after the cartoon edit. Recheck if you alter it.

Return severity-ranked findings with file/line references and concrete fixes, plus checks run and remaining coverage gaps. Make proposed changes on a branch and open a draft PR; leave merges, releases and external posting for owner review.
