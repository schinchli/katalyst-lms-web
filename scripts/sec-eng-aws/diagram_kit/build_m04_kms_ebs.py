"""m04-kms-ebs ("AWS KMS example with Amazon EBS") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). EBS encryption with KMS: (1) the encrypted
data key is stored with the encrypted data on the EBS volume, (2) the hypervisor retrieves it,
(3) a request to AWS KMS decrypts the data key (root key -> data key), and (4) the decrypted
data key in memory encrypts/decrypts EBS data. Key/lock glyphs drawn; server + volume drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
BADGE = "#4A148C"
RED = "#D32F2F"
GRAY = "#5B6470"
GREEN = "#1E8E14"

d = Diagram("AWS KMS example with Amazon EBS", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 620, 4)


def key_glyph(cid, x, y, color, locked=False):
    d._cell(cid + "r", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=4;", x, y + 4, 18, 18)
    d._cell(cid + "s", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 16, y + 11, 26, 4)
    d._cell(cid + "t1", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 36, y + 15, 4, 8)
    d._cell(cid + "t2", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 42, y + 15, 4, 10)
    if locked:
        d._cell(cid + "lkb", f"rounded=1;arcSize=20;html=1;fillColor=#1B3A5C;strokeColor=none;", x - 6, y + 18, 18, 14)
        d._cell(cid + "lks", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
                "strokeColor=#1B3A5C;strokeWidth=2.5;", x - 2, y + 9, 11, 11)


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=16;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 36, 36, n)


def arrow(cid, pts, color=PURPLE, w=5, head="block", both=False, dashed=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    start = "block" if both else "none"
    dash = "dashed=1;dashPattern=4 4;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow={start};startSize=5;html=1;rounded=0;{dash}'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- Amazon EBS volume ------------------------------------------------------
d.text(360, 100, 160, 48, "Amazon EBS\nvolume", size=17, align="center")
d._cell("ebs", f"shape=cube;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=3;size=14;", 392, 150, 92, 92)

# ---- Server -----------------------------------------------------------------
d._cell("srv", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=3;", 404, 372, 70, 116)
for i in range(3):
    d.cells.append(
        f'<mxCell id="srvl{i}" style="endArrow=none;html=1;strokeColor={INK};strokeWidth=2;" '
        f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="414" y="{392 + i * 11}" as="sourcePoint"/><mxPoint x="464" y="{392 + i * 11}" as="targetPoint"/></mxGeometry></mxCell>')
d.text(390, 492, 98, 24, "Server", size=17, align="center")

# ---- AWS KMS box ------------------------------------------------------------
d._cell("kms", f"rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 720, 118, 262, 382)
d.text(872, 132, 110, 24, "AWS KMS", size=16, align="left")
key_glyph("edk", 820, 150, RED, locked=True)
d.text(776, 206, 200, 48, "Encrypted data\nkey", size=16, align="center")
arrow("edk_rk", [(836, 262), (836, 296)], color="#7E57C2", w=3, both=True, dashed=True)
key_glyph("rk", 820, 300, RED)
d.text(820, 348, 130, 24, "Root key", size=16, align="center")
key_glyph("dk", 820, 404, GRAY)
d.text(820, 452, 130, 24, "Data key", size=16, align="center")

# ---- numbered flow ----------------------------------------------------------
# 1: KMS encrypted data key -> EBS volume
arrow("s1", [(818, 200), (490, 200)])
badge("b1", 500, 150, "1")
d.text(544, 124, 180, 60, "Encrypted data key\nis stored with\nencrypted data.", size=15, align="left")
# 2: EBS -> Server
arrow("s2", [(420, 244), (420, 372)])
badge("b2", 352, 290, "2")
d.text(14, 268, 200, 96, "Encrypted data key\nis retrieved by the\nhypervisor hosting\nthe EC2 instance.", size=16, align="left")
# 4: Server <-> EBS
arrow("s4", [(458, 372), (458, 244)], both=True)
badge("b4", 404, 290, "4")
d.text(488, 274, 300, 48, "Decrypted data key in memory is\nused to encrypt or decrypt data.", size=16, align="left")
# 3: Server -> KMS data key
arrow("s3", [(478, 424), (818, 424)])
badge("b3", 506, 444, "3")
d.text(552, 436, 260, 70, "Request is made to AWS KMS,\nand data key is decrypted and\nreturned.", size=15, align="left")

res = d.save("m04-kms-ebs")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m04-kms-ebs"))
