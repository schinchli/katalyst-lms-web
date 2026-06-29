"""review.py — token-free QA. Build a Chrome page (original | recreation | overlay) for
the given slugs and print numeric diff scores. You review visually in the browser; the
model never has to read the images. Usage: python3 review.py slug1 slug2 ...
"""
import sys, os, shutil, subprocess
import diff as _diff

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(SEC))
SLIDES = os.path.join(REPO, "apps", "web", "public", "sec-eng-aws", "slides")
PNG = os.path.join(SEC, "diagrams", "png")
REVIEW = os.path.join(SEC, "diagrams", "review")
os.makedirs(REVIEW, exist_ok=True)

slugs = sys.argv[1:]
cards = []
for slug in slugs:
    recr = os.path.join(PNG, f"{slug}.png")
    if not os.path.exists(recr):
        print(f"{slug}: MISSING recreation"); continue
    score = _diff.make(slug, PNG)
    for src, name in [(os.path.join(SLIDES, f"{slug}.png"), f"{slug}_o.png"),
                      (recr, f"{slug}_r.png"),
                      (os.path.join(PNG, f"{slug}__overlay.png"), f"{slug}_d.png")]:
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(REVIEW, name))
    print(f"{slug}: diff={score}")
    cards.append((slug, score))

rows = "\n".join(
    f'''<section><h2>{s} <span class="score">diff {sc}</span></h2>
    <div class="r"><figure><figcaption>Original</figcaption><img src="{s}_o.png"></figure>
    <figure><figcaption>Recreation</figcaption><img src="{s}_r.png"></figure>
    <figure><figcaption>Overlay (red=orig · green=mine · yellow=match)</figcaption><img src="{s}_d.png"></figure></div></section>'''
    for s, sc in cards)

html = f"""<!doctype html><html><head><meta charset="utf-8"><title>Diagram review</title>
<style>body{{font-family:'Amazon Ember',system-ui,sans-serif;margin:0;background:#f4f4f7;color:#232F3E}}
h1{{padding:14px 20px;margin:0;background:#fff;border-bottom:1px solid #e2e0e8;font-size:18px}}
section{{margin:16px;background:#fff;border:1px solid #e2e0e8;border-radius:10px;padding:12px 16px}}
h2{{font-size:15px;margin:0 0 10px}} .score{{font-size:12px;color:#147a3d;font-weight:700;margin-left:8px}}
.r{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}}@media(max-width:1100px){{.r{{grid-template-columns:1fr}}}}
figure{{margin:0}} figcaption{{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}}
img{{width:100%;height:auto;border:1px solid #eee;border-radius:6px;background:#fff}}</style></head>
<body><h1>Security Engineering diagrams — review ({len(cards)})</h1>{rows}</body></html>"""
out = os.path.join(REVIEW, "index.html")
open(out, "w").write(html)
subprocess.run(["open", "-a", "Google Chrome", out])
print("opened", out)
