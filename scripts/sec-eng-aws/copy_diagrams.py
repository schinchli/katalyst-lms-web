#!/usr/bin/env python3
"""
Copy recreated diagram PNGs into the LMS notes asset folders (web + mobile).
Covers both diagram sets:
  - diagrams_curated.json     (original 22, M02/M03; fallback = embedded image)
  - diagrams_curated_v2.json  (new 26, M01/M04-M08; fallback = whole-slide render)
Prefer the draw.io recreation (diagrams/png/<slug>.png); fall back to the source
image so every note reference resolves.
"""
import json, shutil
from pathlib import Path

HERE = Path(__file__).parent
EXTRACT = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
PNG_DIR = HERE / "diagrams" / "png"
ORIG_DIR = EXTRACT / "images"
WHOLE_DIR = EXTRACT / "slides_whole"
WEB = Path("/Users/schinchli/Documents/Projects/lms/apps/web/public/sec-eng-aws/notes")
MOBILE = Path("/Users/schinchli/Documents/Projects/lms/mobile/assets/images/sec-eng-aws/notes")


def entries():
    out = []
    c1 = json.load(open(EXTRACT / "diagrams_curated.json"))["items"]
    c1.append({"slug": "m02-cross-account-assumerole", "file": "M02_s022_i1.png"})
    for it in c1:
        out.append((it["slug"], ORIG_DIR / it["file"]))
    c2 = json.load(open(EXTRACT / "diagrams_curated_v2.json"))
    for it in c2:
        out.append((it["slug"], WHOLE_DIR / f'{it["module"]}_s{it["slide_no"]:03d}.png'))
    return out


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    MOBILE.mkdir(parents=True, exist_ok=True)
    recreated = fallback = miss = 0
    for slug, src_fallback in entries():
        rec = PNG_DIR / f"{slug}.png"
        if rec.exists():
            src = rec; recreated += 1
        elif src_fallback.exists():
            src = src_fallback; fallback += 1
            print(f"  fallback (no recreation): {slug}")
        else:
            print(f"  MISSING both: {slug}"); miss += 1; continue
        shutil.copy2(src, WEB / f"{slug}.png")
        shutil.copy2(src, MOBILE / f"{slug}.png")
    print(f"\n{recreated} recreated + {fallback} fallback copied to web+mobile notes/ ({miss} missing)")


if __name__ == "__main__":
    main()
