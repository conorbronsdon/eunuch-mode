"""Package checks; does not test persona compliance.

Dependency-free, except that the decree-card smoke test runs only when Pillow is installed
(CI installs it; pass --require-cards to make a missing Pillow an error)."""
from pathlib import Path
import json
import re
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
skill_dir = root / "skills" / "eunuch-mode"
errors = []
def require(ok, message):
    if not ok:
        errors.append(message)

def read(path):
    return path.read_text(encoding="utf-8")

required = ["skills/eunuch-mode/SKILL.md", "skills/eunuch-mode/references/court-examples.md",
            "skills/eunuch-mode/agents/openai.yaml", "skills/eunuch-mode/references/court-roster.md",
            "skills/eunuch-mode/scripts/decree_card.py", "skills/eunuch-mode/assets/IMFellEnglish-subset.ttf",
            "skills/eunuch-mode/assets/OFL-IMFellEnglish.txt", "LICENSE", "README.md", "AGENTS.md",
            ".gitattributes", ".github/FUNDING.yml", "evals/cases.json", "docs/demo.gif",
            "docs/social-preview.png", "brag-output/brag.mp4", "brag-output/brag-9x16.mp4",
            "brag-output/brag.jpg", "brag-output/README.md", "brag-output/LICENSES.md",
            "brag-output/facts.md", "brag-output/contact-sheet.jpg", "brag-output/features.md",
            "docs/decree-cards/friday-migration-dungeon.png", "docs/decree-cards/staging-approved.png",
            "evals/runs/2026-09-30-claude-v1.2.md", ".claude-plugin/marketplace.json", "docs/mods-api.md",
            "docs/court-mod.gif"] + ["brag-output/features/%s.mp4" % v for v in ("treason", "viziers", "decree")] + [
            "plugins/eunuch-mode-court/" + f for f in (".claude-plugin/plugin.json", "hooks/hooks.json", "hooks/court.ts",
            "hooks/lines.ts", "hooks/sprites.ts", "hooks/generative.ts", "hooks/treachery.ts", "types/index.d.ts", "tests/court.test.ts", "test-node/lines.test.mjs", "test-node/generative.test.mjs", "test-node/treachery.test.mjs", "README.md")]
for name in required:
    require((root/name).is_file(), "Missing file: "+name)

# The skill directory holds only what an installer should copy.
allowed = {"SKILL.md", "references", "agents", "scripts", "assets"}
extra = sorted(p.name for p in skill_dir.iterdir() if p.name not in allowed) if skill_dir.is_dir() else []
require(not extra, "Unexpected files in skills/eunuch-mode (they would ship to every install): "+", ".join(extra))
if skill_dir.is_dir():
    size = sum(f.stat().st_size for f in skill_dir.rglob("*") if f.is_file())
    require(size <= 150_000, "skills/eunuch-mode is %d bytes; keep installs under 150 KB" % size)
require(not (root/"SKILL.md").exists(), "A root SKILL.md would make installers copy the whole repository")

skill = read(skill_dir/"SKILL.md")
require(skill.startswith("---\n"), "Missing frontmatter")
require("name: eunuch-mode\n" in skill, "Wrong skill name")
require(bool(re.search(r"^description: .+", skill, re.M)), "Missing description")
require("TODO" not in skill, "Unfinished template")
for key in ["license:", "metadata:", "  version:", "  author:", "  compatibility:", "  agentskills_spec:"]:
    require(key in skill, "Missing public metadata: "+key)

roster = skill_dir/"references"/"court-roster.md"
if roster.is_file():
    entries = re.findall(r"^- (.+?): ", read(roster), re.M)
    require(len(entries) >= 45, "Court roster has %d entries; expected about fifty" % len(entries))
    require(len(entries) == len(set(e.lower() for e in entries)), "Court roster repeats an entry")
eggs = re.findall(r"^\| (?!The user|---).+\|$", skill.split("## Easter eggs")[-1].split("## ")[0], re.M) if "## Easter eggs" in skill else []
require(12 <= len(eggs) <= 20, "Expected 12-20 easter eggs in SKILL.md, found %d" % len(eggs))

# The court mod: a Claude Code plugin listed in this repository's marketplace, versioned with the skill.
market_path = root/".claude-plugin"/"marketplace.json"
plugin_path = root/"plugins"/"eunuch-mode-court"/".claude-plugin"/"plugin.json"
if market_path.is_file() and plugin_path.is_file():
    market = json.loads(read(market_path))
    plugin = json.loads(read(plugin_path))
    listed = {p["name"]: p for p in market.get("plugins", [])}
    require("eunuch-mode-court" in listed, "marketplace.json does not list eunuch-mode-court")
    entry = listed.get("eunuch-mode-court", {})
    require((root/entry.get("source", "")).resolve() == plugin_path.parent.parent.resolve(), "marketplace.json source does not point at plugins/eunuch-mode-court")
    skill_version = re.search(r'^  version: "([^"]+)"', read(skill_dir/"SKILL.md"), re.M)
    for label, version in [("plugin.json", plugin.get("version")), ("marketplace.json", entry.get("version"))]:
        require(skill_version is not None and version == skill_version.group(1), label+" version %s does not match the skill's %s" % (version, skill_version and skill_version.group(1)))
    hooks = json.loads(read(plugin_path.parent.parent/"hooks"/"hooks.json"))
    require(len(hooks.get("modules", [])) == 1, "A mod names exactly one hooks module")

for doc in ["README.md", "skills/eunuch-mode/SKILL.md", "AGENTS.md", "brag-output/README.md", "brag-output/LICENSES.md", "brag-output/features.md", "evals/runs/2026-09-30-claude-v1.2.md", "docs/mods-api.md", "plugins/eunuch-mode-court/README.md"]:
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
               "no-fake-intelligence", "no-authority-expansion", "distress", "humor-floor", "no-repeat-props",
               "egg-force-push", "egg-force-push-near-miss", "egg-friday", "egg-friday-near-miss", "egg-raise",
               "egg-raise-near-miss", "egg-who-runs", "egg-who-runs-near-miss", "egg-cto", "egg-cto-near-miss",
               "egg-kneel", "egg-kneel-near-miss", "egg-thanks", "egg-thanks-near-miss", "egg-once-only",
               "viziers-decision", "vizier-alias", "vizier-mention-only", "card-offer", "card-render", "card-dungeon", "card-no-shell", "roster-no-repeat", "commit-decree", "ascii-not-in-json"]:
    require(needed in ids, "Missing evaluation case: "+needed)
for c in cases:
    require(bool(c.get("prompt") or c.get("conversation")) and bool(c.get("checks")), "Incomplete case: "+c["id"])

# Decree cards render (needs Pillow; CI installs it).
try:
    import PIL  # noqa: F401
    have_pil = True
except ImportError:
    have_pil = False
    require("--require-cards" not in sys.argv, "Pillow is required for the decree-card smoke test")
    print("NOTE: Pillow not installed; decree-card smoke test skipped.")
if have_pil:
    card = skill_dir/"scripts"/"decree_card.py"
    with tempfile.TemporaryDirectory() as tmp:
        for stamp, size in [("approved", "portrait"), ("deferred", "square"), ("dungeon", "landscape")]:
            out = Path(tmp)/(stamp+".png")
            r = subprocess.run([sys.executable, str(card), "--stamp", stamp, "--size", size, "--out", str(out), "--petition", "Deploy on Friday?",
                                "--decree", "No. Ship it Tuesday morning behind a flag, with the rollback rehearsed. Café — “quoted”."],
                               capture_output=True, text=True)
            require(r.returncode == 0 and out.is_file() and out.stat().st_size > 50_000, "Decree card failed to render (%s): %s" % (stamp, r.stderr.strip()[-300:]))
    print("Decree cards rendered: approved, deferred, dungeon.")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("PASS: package layout, metadata, local links, discovery aliases, %d eval cases." % len(cases))
