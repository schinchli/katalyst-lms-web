#!/usr/bin/env python3
"""Build legible contact sheets of candidate diagram slides for fast visual triage.
12 thumbnails per sheet (3 cols x 4 rows), each labeled <MOD> s<NN> (score).
Reads _extracted/shortlist.json + slides_whole/, writes _extracted/contact/."""
import json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SRC = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
WHOLE = SRC / "slides_whole"
OUT = SRC / "contact"
OUT.mkdir(exist_ok=True)
COLS, ROWS = 3, 4
THUMB_W = 500
PER = COLS * ROWS

def font(sz):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", sz)
    except Exception:
        return ImageFont.load_default()

def main():
    short = json.load(open(SRC / "shortlist.json"))
    sheets = 0
    for mod, cands in short.items():
        items = sorted(cands, key=lambda c: c["slide_no"])
        for page in range((len(items) + PER - 1) // PER):
            chunk = items[page*PER:(page+1)*PER]
            # measure a sample thumb height (16:9 ~ 0.5625)
            cell_w, lbl_h = THUMB_W, 26
            cell_h = int(THUMB_W * 0.5625) + lbl_h
            sheet = Image.new("RGB", (COLS*cell_w, ROWS*cell_h), "white")
            d = ImageDraw.Draw(sheet)
            for idx, c in enumerate(chunk):
                r, col = divmod(idx, COLS)
                x, y = col*cell_w, r*cell_h
                p = WHOLE / f"{mod}_s{c['slide_no']:03d}.png"
                if p.exists():
                    im = Image.open(p).convert("RGB")
                    im.thumbnail((cell_w, cell_h-lbl_h))
                    sheet.paste(im, (x, y+lbl_h))
                d.rectangle([x, y, x+cell_w-1, y+lbl_h-1], fill="#1A1A2E")
                d.text((x+6, y+5), f"{mod} s{c['slide_no']}  (score {c['score']}, img{c['imgs']} conn{c['connectors']})",
                       fill="white", font=font(15))
                d.rectangle([x, y, x+cell_w-1, y+cell_h-1], outline="#CCCCCC")
            outp = OUT / f"{mod}_sheet{page+1}.png"
            sheet.save(outp)
            sheets += 1
            print(f"{outp.name}: {len(chunk)} thumbs")
    print(f"\n{sheets} contact sheets -> {OUT}")

if __name__ == "__main__":
    main()
