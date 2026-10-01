"""Dependency-free package checks; does not test persona compliance."""
from pathlib import Path
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
skill_dir = root / "skills" / "eunuch-mode"
errors = []
def require(ok, message):
    if not ok:
        errors.append(message)

def read(path):
    return path.read_text(encoding="utf-8")

required = ["skills/eunuch-mode/SKILL.md", "skills/eunuch-mode/references/court-examples.md",
            "skills/eunuch-mode/agents/openai.yaml", "LICENSE", "README.md", "AGENTS.md",
            ".gitattributes", ".github/FUNDING.yml", "evals/cases.json", "docs/demo.gif",
            "docs/social-preview.png", "brag-output/brag.mp4", "brag-output/brag-9x16.mp4",
            "brag-output/brag.jpg", "brag-output/README.md", "brag-output/LICENSES.md",
            "brag-output/facts.md", "brag-output/contact-sheet.jpg"]
for name in required:
    require((root/name).is_file(), "Missing file: "+name)

# The skill directory holds only what an installer should copy.
allowed = {"SKILL.md", "references", "agents"}
extra = sorted(p.name for p in skill_dir.iterdir() if p.name not in allowed) if skill_dir.is_dir() else []
require(not extra, "Unexpected files in skills/eunuch-mode (they would ship to every install): "+", ".join(extra))
require(not (root/"SKILL.md").exists(), "A root SKILL.md would make installers copy the whole repository")

skill = read(skill_dir/"SKILL.md")
require(skill.startswith("---\n"), "Missing frontmatter")
require("name: eunuch-mode\n" in skill, "Wrong skill name")
require(bool(re.search(r"^description: .+", skill, re.M)), "Missing description")
require("TODO" not in skill, "Unfinished template")
for key in ["license:", "metadata:", "  version:", "  author:", "  compatibility:", "  agentskills_spec:"]:
    require(key in skill, "Missing public metadata: "+key)

for doc in ["README.md", "skills/eunuch-mode/SKILL.md", "AGENTS.md", "brag-output/README.md", "brag-output/LICENSES.md"]:
    if not (root/doc).is_file():
        continue  # already reported as missing
    text = read(root/doc)
    for target in re.findall(r"\]\(([^ )]+)\)", text):
        if "://" not in target and not target.startswith("#"):
            path = (root/doc).parent / target.split("#")[0]
            require(path.exists(), doc+" has broken local link: "+target)

target = "../../skills/eunuch-mode"
for alias in [".agents/skills/eunuch-mode", ".claude/skills/eunuch-mode"]:
    link = root/alias
    if link.is_file() and not link.is_symlink():
        # Git on Windows with core.symlinks=false checks symlinks out as text files.
        require(read(link).strip() == target, "Incorrect discovery alias: "+alias)
        print("NOTE: "+alias+" is a plain file (symlinks disabled in this checkout); target text checked only.")
    else:
        require(link.resolve() == skill_dir.resolve(), "Incorrect discovery alias: "+alias)

cases = json.loads(read(root/"evals/cases.json"))["cases"]
ids = [c["id"] for c in cases]
require(len(ids) == len(set(ids)), "Duplicate evaluation IDs")
for needed in ["explicit-entry", "mention-only", "false-premise", "plain-email", "json", "exit",
               "no-fake-intelligence", "no-authority-expansion", "distress", "humor-floor", "no-repeat-props"]:
    require(needed in ids, "Missing evaluation case: "+needed)
for c in cases:
    require(bool(c.get("prompt") or c.get("conversation")) and bool(c.get("checks")), "Incomplete case: "+c["id"])

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("PASS: package layout, metadata, local links, discovery aliases, %d eval cases." % len(cases))
