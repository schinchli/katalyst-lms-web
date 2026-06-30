"""m05-s3-access-points ("Bucket access using Amazon S3 access points") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Admin connects to the bucket directly via the
bucket hostname; Sales and Developers connect via distinct S3 access point hostnames, each
governed by its own access point policy, before reaching the bucket policy on the S3 bucket.
Official users icon; policy (checklist+key) and S3 bucket glyphs drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
MAG = "#B0117A"
GREEN = "#3A9B35"
RED = "#C2185B"

d = Diagram("Bucket access using Amazon S3 access points", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 820, 4)


def seg(cid, x1, y1, x2, y2, color, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def darrow(cid, x1, x2, y, color=PURPLE, w=5):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=block;endSize=5;startArrow=block;startSize=5;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')


def policy_icon(cid, x, y, color):
    # checklist card (X, X, check) + a key disc
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={color};strokeWidth=3;", x, y, 36, 46)
    cx = x + 9
    seg(f"{cid}x1a", cx, y + 8, cx + 10, y + 18, RED, 3); seg(f"{cid}x1b", cx + 10, y + 8, cx, y + 18, RED, 3)
    seg(f"{cid}x2a", cx, y + 20, cx + 10, y + 30, RED, 3); seg(f"{cid}x2b", cx + 10, y + 20, cx, y + 30, RED, 3)
    seg(f"{cid}ca", cx, y + 36, cx + 4, y + 40, GREEN, 3); seg(f"{cid}cb", cx + 4, y + 40, cx + 11, y + 30, GREEN, 3)
    d._cell(cid + "kc", f"ellipse;html=1;fillColor=#FFFFFF;strokeColor={color};strokeWidth=3;", x + 28, y + 16, 30, 30)
    d._cell(cid + "kr", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x + 34, y + 24, 9, 9)
    d._cell(cid + "ks", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 42, y + 27, 12, 3)


def bucket(cid, x, y, w, h, color):
    d._cell(cid, f"shape=trapezoid;direction=south;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x, y + 10, w, h - 10)
    d._cell(cid + "t", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x, y, w, 18)
    d._cell(cid + "tri", f"triangle;direction=north;html=1;fillColor=none;strokeColor={color};strokeWidth=2;", x + 20, y + 36, 18, 16)
    d._cell(cid + "sq", f"rounded=0;html=1;fillColor=none;strokeColor={color};strokeWidth=2;", x + 22, y + 58, 16, 16)
    d._cell(cid + "ci", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=2;", x + 52, y + 56, 18, 18)


# ---- user groups ------------------------------------------------------------
groups = [("Admin", 150), ("Sales", 296), ("Developers", 430)]
for name, y in groups:
    d.svg_icon(f"u_{name}", 80, y, 64, 52, "users", "")
    d.text(56, y + 56, 120, 24, name, size=17, align="center")

# ---- Admin -> bucket directly -----------------------------------------------
d.text(296, 138, 620, 48, "Bucket hostname:\nDOC-EXAMPLE-BUCKET.s3.us-west-2.amazonaws.com",
       size=17, bold=True, align="left")
darrow("admA", 220, 698, 184)

# ---- Sales / Developers -> access point policies ----------------------------
policy_icon("apSales", 560, 296, MAG)
policy_icon("apDev", 560, 430, MAG)
darrow("salesA", 160, 556, 322)
darrow("devA", 160, 556, 456)
d.text(286, 350, 660, 48, "AP hostname:\nsales-123456789012.s3-accesspoint.us-west-2.amazonaws.com",
       size=17, bold=True, align="left")
d.text(286, 484, 660, 48, "AP hostname:\ndev-123456789012.s3-accesspoint.us-west-2.amazonaws.com",
       size=17, bold=True, align="left")
d.text(400, 226, 200, 48, "Access point\npolicies", size=18, bold=True, align="center")
d.cells.append(
    f'<mxCell id="apptr" style="endArrow=block;endSize=5;html=1;rounded=0;strokeColor={MAG};strokeWidth=3;" '
    'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
    '<mxPoint x="572" y="250" as="sourcePoint"/><mxPoint x="572" y="296" as="targetPoint"/>'
    '<Array as="points"><mxPoint x="540" y="250"/><mxPoint x="540" y="280"/><mxPoint x="572" y="280"/></Array></mxGeometry></mxCell>')

# ---- Bucket policy / S3 bucket (green dashed) -------------------------------
d._cell("bpzone", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=3;"
        "dashed=1;dashPattern=8 5;", 700, 150, 270, 384)
d.text(740, 168, 200, 26, "Bucket policy", size=18, bold=True, align="center")
policy_icon("bp", 776, 210, GREEN)
bucket("s3b", 776, 330, 100, 110, GREEN)
d.text(706, 452, 260, 48, "S3 bucket\nDOC-EXAMPLE-BUCKET", size=17, align="center")

res = d.save("m05-s3-access-points")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m05-s3-access-points"))
