"""Dependency-free package checks; does not test persona compliance."""
from pathlib import Path
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
errors = []
def require(ok, message):
    if not ok:
        errors.append(message)

required = ["SKILL.md", "LICENSE", "README.md", "AGENTS.md", ".gitattributes",
            ".github/FUNDING.yml", "agents/openai.yaml", "references/court-examples.md",
            "evals/cases.json", "docs/demo.gif", "docs/social-preview.png",
            "brag-output/brag.mp4", "brag-output/README.md"]
for name in required:
    require((root/name).is_file(), "Missing file: "+name)

skill = (root/"SKILL.md").read_text()
require(skill.startswith("---\n"), "Missing frontmatter")
require("name: eunuch-mode\n" in skill, "Wrong skill name")
require(bool(re.search(r"^description: .+", skill, re.M)), "Missing description")
require("TODO" not in skill, "Unfinished template")
for key in ["license:", "metadata:", "  version:", "  author:", "  compatibility:", "  agentskills_spec:"]:
    require(key in skill, "Missing public metadata: "+key)
for doc in ["README.md", "SKILL.md", "AGENTS.md", "brag-output/README.md"]:
    text = (root/doc).read_text()
    for target in re.findall(r"\]\(([^ )]+)\)", text):
        if "://" not in target and not target.startswith("#"):
            path = (root/doc).parent / target.split("#")[0]
            require(path.exists(), doc+" has broken local link: "+target)
for alias in [".agents/skills/eunuch-mode", ".claude/skills/eunuch-mode"]:
    require((root/alias).resolve() == root, "Incorrect discovery alias: "+alias)
cases = json.loads((root/"evals/cases.json").read_text())
require(len(cases["cases"]) == 9, "Expected nine evaluation cases")
require(len({c["id"] for c in cases["cases"]}) == 9, "Duplicate evaluation IDs")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("PASS: package metadata, required files, local links, discovery aliases, 9 eval cases.")
