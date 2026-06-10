#!/usr/bin/env python3
"""
Render WHOLE slides (complete as-is diagrams, not fragmented icons) from the
Security Engineering on AWS PPTX decks, sourced strictly from PPTX via LibreOffice.

Pipeline: PPTX --(soffice headless)--> PDF --(pdftoppm)--> per-slide PNG.
Output: _extracted/slides_whole/<MODULE>_s<NNN>.png  (page N = slide N)
"""
import glob, os, subprocess, shutil, sys, re
from pathlib import Path

SRC = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS")
OUT = SRC / "_extracted" / "slides_whole"
PDF_DIR = SRC / "_extracted" / "pdf_from_pptx"
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"
DPI = 150

def module_id(p):
    m = re.match(r"(M\d{2})_", os.path.basename(p))
    return m.group(1) if m else os.path.basename(p)[:3]

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(glob.glob(str(SRC / "M*_*.pptx")))
    files = [f for f in files if not os.path.basename(f).startswith("~$")]
    only = sys.argv[1:]
    if only:
        files = [f for f in files if module_id(f) in only]
    total = 0
    for f in files:
        mod = module_id(f)
        base = os.path.splitext(os.path.basename(f))[0]
        pdf = PDF_DIR / f"{base}.pdf"
        # 1) PPTX -> PDF via LibreOffice (strictly PPTX-sourced)
        subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf",
                        "--outdir", str(PDF_DIR), f],
                       check=True, capture_output=True)
        if not pdf.exists():
            print(f"  !! PDF not produced for {mod}"); continue
        # 2) PDF -> per-slide PNG
        tmp_prefix = OUT / f"{mod}_tmp"
        subprocess.run(["pdftoppm", "-r", str(DPI), "-png", str(pdf), str(tmp_prefix)],
                       check=True, capture_output=True)
        # 3) normalise names to <MOD>_s<NNN>.png
        pages = sorted(OUT.glob(f"{mod}_tmp-*.png"))
        for pth in pages:
            n = int(re.search(r"-(\d+)\.png$", pth.name).group(1))
            pth.rename(OUT / f"{mod}_s{n:03d}.png")
        print(f"{mod}: {len(pages)} slides rendered")
        total += len(pages)
    print(f"\nTotal whole-slide PNGs: {total} -> {OUT}")

if __name__ == "__main__":
    main()
