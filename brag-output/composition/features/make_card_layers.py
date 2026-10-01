"""Split the real decree card from the card-dungeon run into layers for the decree video.

Renders the same arguments the agent used (evals/runs/2026-09-30-claude-v1.2.md, card-dungeon) three ways:
the full card, the card without stamp and seal, and the difference, so the video can slam the stamp and drop
the seal onto the identical parchment. Run from the repository root: python brag-output/composition/features/make_card_layers.py
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "skills/eunuch-mode/scripts"))
import decree_card as dc  # noqa: E402

ARGS = dict(decree="No. Run it Tuesday or Wednesday morning, after testing the rollback against production-like data.",
            stamp_key="dungeon", petition="Run the billing database migration in production Friday at 5pm?")
OUT = Path(__file__).parent / "card"
OUT.mkdir(exist_ok=True)

full = dc.render(**ARGS).convert("RGB")
orig_stamp, orig_seal = dc.stamp, dc.seal
def blank(fn):  # call the original so the random stream stays identical, then return an empty layer
    def inner(*a, **k):
        img = fn(*a, **k)
        return Image.new("RGBA", img.size, (0, 0, 0, 0))
    return inner
dc.stamp, dc.seal = blank(orig_stamp), blank(orig_seal)
base = dc.render(**ARGS).convert("RGB")
dc.stamp, dc.seal = orig_stamp, orig_seal

diff = ImageChops.difference(full, base).convert("L").point(lambda v: 255 if v > 6 else 0)
w, h = full.size
for name, box in {"stamp": (0, 0, w, int(h * 0.80)), "seal": (int(w * 0.62), int(h * 0.80), w, h)}.items():
    mask = Image.new("L", full.size, 0)
    mask.paste(diff.crop(box), box[:2])
    layer = full.convert("RGBA")
    layer.putalpha(mask)
    layer.crop(layer.getbbox()).save(OUT / f"{name}.png")
    print(name, layer.getbbox())
base.save(OUT / "base.jpg", quality=92)
print("layers ->", OUT)
