"""Render a court decree as a shareable PNG card: parchment, a red wax seal and a stamp.

    python decree_card.py --stamp dungeon --decree "Do not deploy on Friday." --out decree.png
    python decree_card.py --stamp approved --petition "Should I add tests?" --decree "Yes. Start with the payment path."

Stamps: approved, deferred, dungeon (TO THE DUNGEON). Needs Python 3.9+ and Pillow
(`python -m pip install Pillow`). Uses only the bundled IM FELL English font (SIL OFL 1.1,
assets/OFL-IMFellEnglish.txt). The same text always renders the same image (on the same Pillow version).
"""
import argparse
import hashlib
import math
import random
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont
except ImportError:
    sys.exit("The scribes need Pillow: python -m pip install Pillow")

HERE = Path(__file__).resolve().parent
FONT = HERE.parent / "assets" / "IMFellEnglish-subset.ttf"
SIZES = {"portrait": (1080, 1350), "square": (1080, 1080), "landscape": (1600, 900)}
STAMPS = {  # label, ink colour
    "approved": ("APPROVED", (31, 92, 74)),
    "deferred": ("DEFERRED", (150, 98, 30)),
    "dungeon": ("TO THE DUNGEON", (158, 27, 32)),
}
INK, MUTED, WAX = (22, 18, 14), (104, 84, 56), (158, 27, 32)
FOOTER = "github.com/conorbronsdon/eunuch-mode"
SWAPS = {"’": "'", "‘": "'", "“": '"', "”": '"'}


def clean(text, limit):
    """Keep characters the subset font carries; strip accents rather than draw empty boxes."""
    text = " ".join((text or "").split())
    out = []
    for ch in text:
        if ord(ch) < 127 or ch in "–—…" or ch in SWAPS:
            out.append(SWAPS.get(ch, ch))
        else:
            base = unicodedata.normalize("NFKD", ch).encode("ascii", "ignore").decode()
            out.append(base)
    text = "".join(out).strip()
    words = text.split()
    if len(words) > limit:
        text = " ".join(words[:limit]).rstrip(",;:") + "…"
    return text


def font(size):
    return ImageFont.truetype(str(FONT), size)


def noise(size, sigma, rng):
    """Seeded Gaussian-ish noise (Image.effect_noise is not reproducible)."""
    w, h = size
    small = Image.frombytes("L", (w // 2 + 1, h // 2 + 1), rng.randbytes((w // 2 + 1) * (h // 2 + 1)))
    img = small.resize((w, h), Image.NEAREST)
    return img.point(lambda v: max(0, min(255, int(128 + (v - 128) * sigma / 74))))


def split_long(draw, text, fnt, width):
    """Break any single word wider than the line (a long URL, say) into pieces that fit."""
    out = []
    for word in text.split():
        while draw.textlength(word, font=fnt) > width and len(word) > 1:
            cut = len(word)
            while cut > 1 and draw.textlength(word[:cut], font=fnt) > width:
                cut -= 1
            out.append(word[:cut])
            word = word[cut:]
        out.append(word)
    return out


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in split_long(draw, text, fnt, width):
        trial = (line + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def fit(draw, text, width, height, hi, lo, spacing=1.18):
    for size in range(hi, lo - 1, -2):
        fnt = font(size)
        lines = wrap(draw, text, fnt, width)
        if len(lines) * size * spacing <= height and all(draw.textlength(l, font=fnt) <= width for l in lines):
            return fnt, lines, size
    # Still too long at the smallest size: keep the lines that fit and end with an ellipsis.
    fnt = font(lo)
    lines = wrap(draw, text, fnt, width)
    keep = max(1, int(height // (lo * spacing)))
    if len(lines) > keep:
        lines = lines[:keep]
        while lines[-1] and draw.textlength(lines[-1] + "…", font=fnt) > width:
            lines[-1] = lines[-1].rsplit(" ", 1)[0] if " " in lines[-1] else lines[-1][:-1]
        lines[-1] += "…"
    return fnt, lines, lo


def tracked(draw, xy, text, fnt, fill, track, anchor_center=True):
    """Draw letter-spaced text centred on xy[0]."""
    widths = [draw.textlength(c, font=fnt) for c in text]
    total = sum(widths) + track * (len(text) - 1)
    x = xy[0] - total / 2 if anchor_center else xy[0]
    for c, w in zip(text, widths):
        draw.text((x, xy[1]), c, font=fnt, fill=fill)
        x += w + track
    return total


def parchment(w, h, rng):
    base = Image.new("RGB", (w, h), (236, 220, 178))
    # large soft mottling
    small = Image.new("L", (w // 40 + 2, h // 40 + 2))
    small.putdata([rng.randint(0, 255) for _ in range(small.width * small.height)])
    mottle = small.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(30))
    dark = Image.new("RGB", (w, h), (205, 176, 122))
    base = Image.composite(dark, base, mottle.point(lambda v: int(v * 0.55)))
    # fine fibre grain
    grain = noise((w, h), 22, rng).filter(ImageFilter.GaussianBlur(0.6))
    base = Image.blend(base, Image.merge("RGB", (grain, grain, grain)), 0.06)
    # burnt edges: radial vignette
    vig = Image.radial_gradient("L").resize((w, h)).point(lambda v: max(0, v - 120) * 2)
    edge = Image.new("RGB", (w, h), (150, 104, 52))
    return Image.composite(edge, base, vig.filter(ImageFilter.GaussianBlur(40)))


def deckle_mask(w, h, inset, rng):
    """A parchment silhouette with a torn, irregular edge."""
    pts = []
    def side(x0, y0, x1, y1, n):
        for i in range(n):
            t = i / n
            j = rng.uniform(-9, 9) + math.sin(t * 17 + rng.random()) * 3
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            if y0 == y1:
                pts.append((x, y + j))
            else:
                pts.append((x + j, y))
    a, b, c, d = inset, w - inset, inset, h - inset
    side(a, c, b, c, 70); side(b, c, b, d, 90); side(b, d, a, d, 70); side(a, d, a, c, 90)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(1.2))


def stamp(label, colour, scale, rng):
    """A rotated rubber stamp with a double border and worn ink."""
    fnt = font(int(64 * scale))
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    track = int(6 * scale)
    tw = sum(probe.textlength(c, font=fnt) for c in label) + track * (len(label) - 1)
    pad_x, pad_y = int(46 * scale), int(26 * scale)
    bw, bh = int(tw + pad_x * 2), int(64 * scale + pad_y * 2 + 10 * scale)
    m = Image.new("L", (bw + 40, bh + 40), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((20, 20, 20 + bw, 20 + bh), radius=int(14 * scale), outline=255, width=int(9 * scale))
    d.rounded_rectangle((20 + int(16 * scale), 20 + int(16 * scale), 20 + bw - int(16 * scale), 20 + bh - int(16 * scale)),
                        radius=int(8 * scale), outline=255, width=max(2, int(3 * scale)))
    tracked(d, ((bw + 40) / 2, 20 + pad_y - int(2 * scale)), label, fnt, 255, track)
    # worn ink: knock out speckles and a few dry streaks
    wear = noise(m.size, 90, rng).point(lambda v: 0 if v > 168 else 255)
    m = ImageChops.multiply(m, wear.filter(ImageFilter.GaussianBlur(0.8)).point(lambda v: 255 if v > 110 else 0))
    sd = ImageDraw.Draw(m)
    for _ in range(5):
        y = rng.randint(30, m.height - 30)
        sd.line((rng.randint(0, 40), y, m.width - rng.randint(0, 40), y + rng.randint(-6, 6)), fill=0, width=rng.randint(1, 3))
    m = m.filter(ImageFilter.GaussianBlur(0.7)).rotate(rng.uniform(-14, -9), resample=Image.BICUBIC, expand=True)
    ink = Image.new("RGBA", m.size, colour + (0,))
    ink.putalpha(m.point(lambda v: int(v * 0.88)))
    return ink


def seal(radius, rng):
    """A red wax seal with an irregular rim, a pressed ring and a crowned monogram."""
    s = 3  # supersample
    r = radius * s
    size = int(r * 2.6)
    cx = cy = size / 2
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # ribbons behind the wax
    rib = ImageDraw.Draw(img)
    for ang, col in ((-0.35, (110, 26, 40)), (0.3, (125, 31, 46))):
        x0, y0 = cx + math.sin(ang) * r * 0.2, cy
        x1, y1 = cx + math.sin(ang) * r * 1.15, cy + r * 1.25
        wdt = r * 0.32
        rib.polygon([(x0 - wdt / 2, y0), (x0 + wdt / 2, y0), (x1 + wdt / 2, y1), (x1, y1 - wdt * 0.45), (x1 - wdt / 2, y1)], fill=col + (255,))
    # blob outline
    pts = []
    n = 120
    phases = [rng.random() * 6.28 for _ in range(4)]
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + 0.035 * math.sin(a * 5 + phases[0]) + 0.025 * math.sin(a * 9 + phases[1]) + 0.012 * math.sin(a * 23 + phases[2])
        if rng.random() < 0.08:
            k += rng.uniform(0.02, 0.06)
        pts.append((cx + math.cos(a) * r * k, cy + math.sin(a) * r * k))
    blob = Image.new("L", (size, size), 0)
    ImageDraw.Draw(blob).polygon(pts, fill=255)
    blob = blob.filter(ImageFilter.GaussianBlur(s * 1.5))
    # shading: lit from the upper left
    shade = Image.new("RGB", (size, size), WAX)
    lg = Image.radial_gradient("L").resize((int(r * 2.4), int(r * 2.4)))
    light = Image.new("L", (size, size), 255)
    light.paste(lg, (int(cx - r * 1.45), int(cy - r * 1.45)))
    dark = Image.new("RGB", (size, size), (92, 12, 18))
    shade = Image.composite(dark, Image.new("RGB", (size, size), (196, 46, 44)), light)
    d = ImageDraw.Draw(shade)
    # pressed well and ring
    d.ellipse((cx - r * 0.72, cy - r * 0.72, cx + r * 0.72, cy + r * 0.72), fill=(128, 20, 26))
    d.ellipse((cx - r * 0.72, cy - r * 0.72, cx + r * 0.72, cy + r * 0.72), outline=(214, 70, 62), width=int(s * 3))
    d.ellipse((cx - r * 0.62, cy - r * 0.62, cx + r * 0.62, cy + r * 0.62), outline=(84, 10, 16), width=int(s * 2))
    # crown
    cw, ch = r * 0.62, r * 0.26
    top = cy - r * 0.36
    crown = [(cx - cw / 2, top + ch), (cx - cw / 2, top), (cx - cw / 4, top + ch * 0.55), (cx, top - ch * 0.25),
             (cx + cw / 4, top + ch * 0.55), (cx + cw / 2, top), (cx + cw / 2, top + ch)]
    d.polygon([(x + s * 2, y + s * 2) for x, y in crown], fill=(80, 8, 14))
    d.polygon(crown, fill=(206, 62, 56))
    for px in (cx - cw / 2, cx, cx + cw / 2):
        py = top - ch * 0.25 if px == cx else top
        d.ellipse((px - s * 5, py - s * 5, px + s * 5, py + s * 5), fill=(220, 84, 72))
    mono = font(int(r * 0.62))
    for off, col in ((s * 3, (80, 8, 14)), (0, (214, 70, 62))):
        d.text((cx + off, cy + r * 0.2 + off), "EM", font=mono, fill=col, anchor="mm")
    # specular highlight
    hl = Image.new("L", (size, size), 0)
    ImageDraw.Draw(hl).ellipse((cx - r * 0.8, cy - r * 0.85, cx - r * 0.1, cy - r * 0.45), fill=70)
    shade = Image.composite(Image.new("RGB", (size, size), (255, 200, 190)), shade, hl.filter(ImageFilter.GaussianBlur(s * 10)))
    wax = shade.convert("RGBA")
    wax.putalpha(blob)
    img = Image.alpha_composite(img, wax)
    return img.resize((size // s, size // s), Image.LANCZOS)


def drop_shadow(layer, offset, blur, opacity):
    a = layer.getchannel("A").point(lambda v: int(v * opacity)).filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", layer.size, (40, 20, 10, 0))
    sh.putalpha(a)
    out = Image.new("RGBA", (layer.width + offset * 2, layer.height + offset * 2), (0, 0, 0, 0))
    out.alpha_composite(sh, (offset * 2, offset * 2))
    out.alpha_composite(layer, (offset, offset))
    return out


def render(decree, stamp_key, petition="", title="Imperial Decree", signed="By order of the court", size="portrait"):
    w, h = SIZES[size]
    k = min(w, h) / 1080
    seed = int(hashlib.sha256("|".join([decree, stamp_key, petition, title, size]).encode()).hexdigest()[:12], 16)
    rng = random.Random(seed)
    canvas = Image.new("RGBA", (w, h), (22, 18, 14, 255))
    # the desk behind the parchment
    desk = noise((w, h), 14, rng).filter(ImageFilter.GaussianBlur(2))
    canvas = Image.composite(Image.new("RGBA", (w, h), (44, 32, 24, 255)), canvas, desk.point(lambda v: int(v * 0.5)))
    inset = int(34 * k)
    paper = parchment(w, h, rng).convert("RGBA")
    mask = deckle_mask(w, h, inset, rng)
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(18 * k)).point(lambda v: int(v * 0.7)))
    canvas.alpha_composite(shadow, (int(6 * k), int(10 * k)))
    paper.putalpha(mask)
    canvas.alpha_composite(paper)
    d = ImageDraw.Draw(canvas)

    margin = int(110 * k)
    x0, x1 = margin, w - margin
    y = int(96 * k)
    # header
    head = font(int(30 * k))
    tracked(d, (w / 2, y), "BY ORDER OF THE THRONE", head, MUTED, int(7 * k))
    y += int(52 * k)
    tfont = font(int(84 * k)) if size != "landscape" else font(int(72 * k))
    title = clean(title, 6) or "Imperial Decree"
    while d.textlength(title, font=tfont) > (x1 - x0) and tfont.size > 40:
        tfont = font(tfont.size - 4)
    d.text((w / 2, y), title, font=tfont, fill=INK, anchor="ma")
    y += int(tfont.size * 1.12)
    # ornament rule
    cxm = w / 2
    d.line((x0 + 40 * k, y + 14 * k, cxm - 26 * k, y + 14 * k), fill=MUTED, width=max(1, int(2 * k)))
    d.line((cxm + 26 * k, y + 14 * k, x1 - 40 * k, y + 14 * k), fill=MUTED, width=max(1, int(2 * k)))
    d.polygon([(cxm, y + 2 * k), (cxm + 12 * k, y + 14 * k), (cxm, y + 26 * k), (cxm - 12 * k, y + 14 * k)], fill=WAX)
    y += int(58 * k)

    petition = clean(petition, 24)
    if petition:
        pf = font(int(31 * k))
        plines = wrap(d, "On the petition: “" + petition + "”", pf, x1 - x0)[:3]
        for line in plines:
            d.text((w / 2, y), line, font=pf, fill=MUTED, anchor="ma")
            y += int(31 * k * 1.25)
        y += int(26 * k)

    decree = clean(decree, 60) or "The court has spoken."
    label, colour = STAMPS[stamp_key]
    st = stamp(label, colour, k * (0.95 if stamp_key != "dungeon" else 0.86), rng)
    footer_zone = int((300 if size != "landscape" else 210) * k)
    if size == "landscape":
        body_w, body_h, bx = int((x1 - x0) * 0.66), h - footer_zone - y, x0
    else:  # leave room for the stamp under the decree
        body_w, body_h, bx = x1 - x0, h - footer_zone - y - int(st.height * 0.85), None
    bf, blines, bsize = fit(d, decree, body_w, body_h, int(92 * k), int(26 * k))
    lh = bsize * 1.18
    by = y + max(0, (body_h - len(blines) * lh) / 2)
    for line in blines:
        if bx is None:
            d.text((w / 2, by), line, font=bf, fill=INK, anchor="ma")
        else:
            d.text((bx, by), line, font=bf, fill=INK)
        by += lh

    # stamp under (or beside) the decree, seal at lower right
    if size == "landscape":
        sx, sy2 = int(w * 0.70), int(h * 0.30)
    else:
        sx, sy2 = int(w / 2 - st.width / 2 + rng.uniform(-40, 40) * k), int(by + 6 * k)
    canvas.alpha_composite(st, (max(0, min(w - st.width, sx)), max(0, sy2)))
    se = drop_shadow(seal(int(92 * k), rng), int(8 * k), 10 * k, 0.55)
    canvas.alpha_composite(se, (int(w - margin - se.width * 0.78), int(h - se.height * 0.86 - 46 * k)))
    d = ImageDraw.Draw(canvas)

    # signature line, lower left
    sf = font(int(28 * k))
    sy = h - int((170 if size != "landscape" else 120) * k)
    d.line((x0, sy, x0 + 300 * k, sy), fill=MUTED, width=max(1, int(2 * k)))
    # a quick quill flourish above the line
    fl = []
    for i in range(700):  # a looping hand that trails off
        t = i / 699 * 8.5 * math.pi
        amp = 1 - i / 1100
        fl.append((x0 + 24 * k + t * 8 * k - math.sin(t) * 17 * k * amp,
                   sy - 36 * k - math.cos(t) * 22 * k * amp - math.sin(t * 0.5) * 4 * k))
    d.line(fl, fill=INK, width=max(2, int(3 * k)), joint="curve")
    d.line([(x0 + 6 * k, sy - 8 * k), (x0 + 130 * k, sy - 16 * k), (x0 + 270 * k, sy - 9 * k)], fill=INK, width=max(1, int(2 * k)), joint="curve")
    d.text((x0, sy + 12 * k), clean(signed, 8), font=sf, fill=MUTED)

    # repository line, small, on the parchment's lower edge
    ff = font(int(22 * k))
    d = ImageDraw.Draw(canvas)
    d.text((x0, h - int(66 * k)), FOOTER, font=ff, fill=MUTED)
    return canvas.convert("RGB")


def main():
    p = argparse.ArgumentParser(description="Render a court decree as a PNG card.")
    p.add_argument("--decree", required=True, help="the ruling, up to about 40 words")
    p.add_argument("--stamp", choices=sorted(STAMPS), default="approved")
    p.add_argument("--petition", default="", help="the question being ruled on (optional, short)")
    p.add_argument("--title", default="Imperial Decree")
    p.add_argument("--signed", default="By order of the court", help="the line under the signature")
    p.add_argument("--size", choices=sorted(SIZES), default="portrait")
    p.add_argument("--out", default="decree.png")
    a = p.parse_args()
    if not FONT.is_file():
        sys.exit("Missing bundled font: " + str(FONT))
    img = render(a.decree, a.stamp, a.petition, a.title, a.signed, a.size)
    img.save(a.out, optimize=True)
    print("The scribes have sealed " + a.out)


if __name__ == "__main__":
    main()
