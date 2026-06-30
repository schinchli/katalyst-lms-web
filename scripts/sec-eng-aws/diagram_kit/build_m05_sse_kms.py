"""m05-sse-kms ("Server-side encryption with AWS KMS") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). SSE-KMS: plaintext data is sent to Amazon S3
over HTTPS; (1) S3 obtains a data key from AWS KMS, (2) the data key is encrypted with a KMS
key, (3) the encrypted data and encrypted data key are stored in the S3 bucket. Buckets / docs
/ key / lock glyphs are drawn; flow split across the KMS (red dashed) and S3 (magenta dashed) zones.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#4A148C"
BADGE = "#4A148C"
RED = "#D32F2F"
MAG = "#B0117A"
GREEN = "#3A9B35"
GRAY = "#8A929B"

d = Diagram("Server-side encryption with AWS KMS", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 700, 4)


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=15;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 32, 32, n)


def line(cid, pts, color=PURPLE, w=4, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def doc(cid, x, y, color=INK, locked=False):
    d._cell(cid, f"shape=note;html=1;fillColor=#FFFFFF;strokeColor={color};strokeWidth=2;size=10;", x, y, 44, 54)
    for i in range(3):
        d.cells.append(
            f'<mxCell id="{cid}l{i}" style="endArrow=none;html=1;strokeColor={color};strokeWidth=1.5;" '
            f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x + 7}" y="{y + 18 + i * 9}" as="sourcePoint"/>'
            f'<mxPoint x="{x + 33}" y="{y + 18 + i * 9}" as="targetPoint"/></mxGeometry></mxCell>')
    if locked:
        d._cell(cid + "kb", f"rounded=1;arcSize=20;html=1;fillColor={color};strokeColor=none;", x + 6, y + 26, 16, 13)
        d._cell(cid + "ks", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
                f"strokeColor={color};strokeWidth=2.5;", x + 9, y + 18, 10, 10)


def key_glyph(cid, x, y, color):
    d._cell(cid + "r", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=4;", x, y + 4, 16, 16)
    d._cell(cid + "s", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 14, y + 10, 22, 4)
    d._cell(cid + "t1", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 30, y + 14, 4, 8)


def bucket(cid, x, y, w, h, color):
    d._cell(cid, f"shape=trapezoid;direction=south;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x, y + 8, w, h - 8)
    d._cell(cid + "top", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x, y, w, 16)


# ---- top: AWS KMS zone (red dashed) -----------------------------------------
d._cell("kmszone", f"rounded=1;arcSize=4;html=1;fillColor=none;strokeColor={RED};strokeWidth=2.5;"
        "dashed=1;dashPattern=8 5;", 180, 108, 790, 180)
badge("b1", 214, 126, "1")
d.text(252, 118, 250, 48, "Amazon S3 obtains the\ndata key from KMS.", size=16, align="left")
badge("b2", 498, 126, "2")
d.text(536, 118, 250, 48, "The data key is encrypted with\nan KMS key.", size=16, align="left")
d.text(228, 200, 120, 24, "Data key", size=16, align="center")
d.text(596, 200, 120, 24, "KMS key", size=16, align="center")
key_glyph("kms", 884, 168, GRAY)
d.text(852, 220, 130, 24, "AWS KMS", size=16, align="center")

# ---- left: plaintext data -> Amazon S3 --------------------------------------
doc("pt", 80, 352, INK)
d.text(54, 412, 110, 48, "Data\n(Plaintext)", size=17, align="center")
d._cell("https", f"shape=singleArrow;html=1;fillColor={INK};strokeColor=none;arrowWidth=0.62;arrowHead=0.5;"
        "fontColor=#FFFFFF;fontStyle=1;fontSize=18;fontFamily=Amazon Ember;", 158, 366, 112, 40, "HTTPS")
bucket("s3gray", 292, 350, 54, 58, GRAY)
d.text(266, 412, 120, 24, "Amazon S3", size=16, align="center")

# ---- bottom: S3 bucket zone (magenta dashed) --------------------------------
d._cell("s3zone", f"rounded=1;arcSize=4;html=1;fillColor=none;strokeColor={MAG};strokeWidth=2.5;"
        "dashed=1;dashPattern=8 5;", 300, 300, 668, 208)
d._cell("dkbox", "rounded=1;arcSize=10;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;strokeWidth=1.5;", 430, 350, 200, 120)
doc("dk", 548, 372, INK)
d.text(444, 420, 100, 24, "Data key", size=16, align="center")
bucket("s3green", 752, 340, 150, 130, GREEN)
doc("edoc", 786, 366, "#7E57C2", locked=True)
d.text(836, 420, 110, 24, "Data key", size=16, align="center")
d._cell("dklock", f"rounded=1;arcSize=20;html=1;fillColor={MAG};strokeColor=none;", 820, 426, 16, 13)

# data key / KMS key lines down into the data-key box
line("dkline", [(300, 228), (300, 338), (480, 338), (480, 350)])
line("kmsline", [(640, 228), (640, 332), (540, 332), (540, 350)])
line("dk2bucket", [(630, 412), (748, 412)])

# ---- step 3 -----------------------------------------------------------------
badge("b3", 522, 472, "3")
d.text(560, 464, 380, 48, "Encrypted data and an encrypted data key are\nstored in an S3 bucket.", size=16, align="left")

res = d.save("m05-sse-kms")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m05-sse-kms"))
