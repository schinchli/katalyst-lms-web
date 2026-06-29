"""diff.py — objective fidelity check for a recreated diagram vs its original slide.
Writes a red/green superimposition (red=original, green=recreation, yellow=match) and
prints a difference score (lower = closer). Usage: python3 diff.py <slug>"""
import sys, os
from PIL import Image, ImageChops
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(SEC))
SLIDES = os.path.join(REPO, "apps", "web", "public", "sec-eng-aws", "slides")
PNG = os.path.join(SEC, "diagrams", "png")


def make(slug: str, outdir: str = PNG) -> int:
    orig = Image.open(os.path.join(SLIDES, f"{slug}.png")).convert("RGB")
    recr = Image.open(os.path.join(PNG, f"{slug}.png")).convert("RGB")
    W, H = orig.size
    recr = recr.resize((W, H))
    o = np.array(orig.convert("L")); r = np.array(recr.convert("L"))
    ov = np.zeros((H, W, 3), np.uint8); ov[..., 0] = 255 - o; ov[..., 1] = 255 - r
    Image.fromarray(ov).save(os.path.join(outdir, f"{slug}__overlay.png"))
    return int(np.array(ImageChops.difference(orig, recr)).sum(2).mean())


if __name__ == "__main__":
    print("diff score:", make(sys.argv[1]))
