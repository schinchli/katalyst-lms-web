#!/usr/bin/env python3
"""
Copy recreated diagram PNGs into the LMS asset folders (web + mobile).
For any curated slug whose draw.io recreation is missing, fall back to the
original extracted slide image so every note reference resolves.
"""
import json, shutil
from pathlib import Path

HERE = Path(__file__).parent
EXTRACT = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
PNG_DIR = HERE / "diagrams" / "png"
ORIG_DIR = EXTRACT / "images"
WEB = Path("/Users/schinchli/Documents/Projects/lms/apps/web/public/sec-eng-aws/notes")
MOBILE = Path("/Users/schinchli/Documents/Projects/lms/mobile/assets/images/sec-eng-aws/notes")

def main():
    WEB.mkdir(parents=True, exist_ok=True)
    MOBILE.mkdir(parents=True, exist_ok=True)
    curated = json.load(open(EXTRACT / "diagrams_curated.json"))["items"]
    # include the already-approved first diagram too
    curated.append({"slug": "m02-cross-account-assumerole", "file": "M02_s022_i1.png"})
    recreated = fallback = 0
    for it in curated:
        slug = it["slug"]; src_recreated = PNG_DIR / f"{slug}.png"
        dst_name = f"{slug}.png"
        if src_recreated.exists():
            src = src_recreated; recreated += 1; tag = "recreated"
        else:
            src = ORIG_DIR / it["file"]; fallback += 1; tag = "ORIGINAL-fallback"
            dst_name = f"{slug}.png"  # keep slug name even for fallback
        shutil.copy2(src, WEB / dst_name)
        shutil.copy2(src, MOBILE / dst_name)
        print(f"  {slug:42s} <- {tag}")
    print(f"\nCopied {recreated} recreated + {fallback} fallback diagrams to web + mobile.")

if __name__ == "__main__":
    main()
