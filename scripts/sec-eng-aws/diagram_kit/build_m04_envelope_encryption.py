"""m04-envelope-encryption ("Envelope encryption performed by AWS") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). AWS KMS: a root key encrypts a data key
(producing an encrypted data key). The application requests a data key, encrypts plaintext
data with it, and Amazon S3 stores the encrypted data alongside the encrypted data key.
Key / padlock / document glyphs are drawn (generic line-art, matching the slide).
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
RED = "#D32F2F"
GRAY = "#5B6470"
GREEN = "#1E8E6F"

d = Diagram("Envelope encryption performed by AWS", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 740, 4)


def key_glyph(cid, x, y, color, locked=False):
    d._cell(cid + "r", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=4;", x, y + 4, 18, 18)
    d._cell(cid + "s", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 16, y + 11, 26, 4)
    d._cell(cid + "t1", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 36, y + 15, 4, 8)
    d._cell(cid + "t2", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 42, y + 15, 4, 10)
    if locked:
        padlock(cid + "lk", x - 2, y + 18, color)


def padlock(cid, x, y, color):
    d._cell(cid + "b", f"rounded=1;arcSize=20;html=1;fillColor={color};strokeColor=none;", x, y + 8, 16, 13)
    d._cell(cid + "s", f"shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
            f"strokeColor={color};strokeWidth=2.5;", x + 3, y, 10, 10)


def document(cid, x, y, locked=False):
    d._cell(cid, f"shape=note;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2;size=12;", x, y, 50, 60)
    for i in range(4):
        d.cells.append(
            f'<mxCell id="{cid}l{i}" style="endArrow=none;html=1;strokeColor={INK};strokeWidth=1.5;" '
            f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x + 8}" y="{y + 18 + i * 9}" as="sourcePoint"/>'
            f'<mxPoint x="{x + 38}" y="{y + 18 + i * 9}" as="targetPoint"/></mxGeometry></mxCell>')
    if locked:
        padlock(cid + "lk", x + 34, y + 32, INK)


def arrow(cid, pts, color=PURPLE, w=4, head="block", curved=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    cv = "curved=1;" if curved else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow=none;html=1;rounded=0;{cv}'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def doublearrow(cid, x, y, w=70):
    d._cell(cid + "bar", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=none;", x + 14, y, w - 28, 22)
    d._cell(cid + "l", f"triangle;direction=west;html=1;fillColor={PURPLE};strokeColor=none;", x, y - 8, 18, 38)
    d._cell(cid + "r", f"triangle;direction=east;html=1;fillColor={PURPLE};strokeColor=none;", x + w - 18, y - 8, 18, 38)


# ---- AWS KMS box ------------------------------------------------------------
d.text(34, 286, 24, 44, "+", size=34, bold=True, align="center")
d._cell("kms", "rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 70, 150, 250, 366)
d.text(214, 248, 110, 24, "AWS KMS", size=16, align="left")
key_glyph("rk", 150, 196, RED)
d.text(110, 240, 130, 24, "Root key", size=15, align="center")
arrow("rk2dk", [(160, 214), (120, 260), (152, 300)], color=PURPLE, w=8, curved=True)
key_glyph("dk", 150, 300, GRAY)
d.text(110, 344, 130, 24, "Data key", size=15, align="center")
arrow("dk2edk", [(168, 322), (168, 396)], color=PURPLE, w=5)
key_glyph("edk", 150, 404, "#7E57C2", locked=True)
d.text(74, 452, 200, 24, "Encrypted data key", size=15, align="center")

# ---- KMS <-> app double arrow -----------------------------------------------
doublearrow("da1", 334, 300)
d.text(322, 358, 118, 70, "Application\nrequests data key\nfor encryption", size=15, align="center")

# ---- Example application box ------------------------------------------------
d.text(456, 146, 180, 48, "Example\napplication", size=18, bold=True, align="center")
d._cell("app", "rounded=0;html=1;fillColor=none;strokeColor=#9AA1A9;strokeWidth=1.5;", 442, 200, 206, 316)
d._cell("appin", "rounded=1;arcSize=6;html=1;fillColor=none;strokeColor=#9AA1A9;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 470, 228, 150, 264)
document("pt", 520, 238)
d._cell("cube", "rounded=0;html=1;fillColor=none;strokeColor=#D45B2B;strokeWidth=2;", 484, 264, 28, 28)
d.text(488, 300, 120, 44, "Plaintext\ndata", size=15, align="center")
d.text(534, 344, 24, 30, "+", size=26, bold=True, align="center")
key_glyph("dk2", 520, 384, GRAY)
d.text(490, 424, 120, 24, "Data key", size=15, align="center")

# ---- app -> S3 arrow --------------------------------------------------------
d._cell("sa_bar", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=none;", 664, 300, 44, 22)
d._cell("sa_h", f"triangle;direction=east;html=1;fillColor={PURPLE};strokeColor=none;", 706, 292, 20, 38)
d.text(656, 350, 116, 110, "Encrypted\ndata and\nencrypted\ndata key are\nstored", size=15, align="center")

# ---- Amazon S3 box ----------------------------------------------------------
d._cell("s3", "rounded=0;html=1;fillColor=none;strokeColor=#1E8E6F;strokeWidth=2;", 772, 196, 208, 320)
d.text(786, 206, 140, 24, "Amazon S3", size=16, align="left")
d._cell("s3in", "rounded=1;arcSize=6;html=1;fillColor=none;strokeColor=#1E8E6F;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 800, 242, 152, 262)
document("edoc", 852, 250, locked=True)
d.text(820, 314, 120, 44, "Encrypted\ndata", size=15, align="center")
key_glyph("ekey", 852, 388, "#7E57C2", locked=True)
d.text(812, 428, 140, 44, "Encrypted\ndata key", size=15, align="center")

res = d.save("m04-envelope-encryption")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m04-envelope-encryption"))
