"""m06-vpc-endpoint ("VPC endpoint overview") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Side-by-side comparison: WITHOUT VPC
endpoints, private-subnet servers reach CloudWatch over the internet (servers -> NAT gateway
-> internet gateway -> internet); WITH a VPC endpoint, traffic to CloudWatch stays on the AWS
network (servers -> VPC endpoint -> CloudWatch). Official NAT / IGW / VPC endpoint icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
BLUE = "#147EBA"
ORANGE = "#E8830C"
PUBFILL = "#E6F2E0"
PRIVFILL = "#DCEAF5"
NAT = "Res_Amazon-VPC_NAT-Gateway_48.svg"
IGW = "Res_Amazon-VPC_Internet-Gateway_48.svg"
VPE = "Res_Amazon-VPC_Endpoints_48.svg"

d = Diagram("VPC endpoint overview", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 420, 4)


def arrow(cid, pts, w=2, head="classic"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={INK};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def chip(cid, x, y, color, s=22):
    d._cell(cid, f"rounded=0;html=1;fillColor={color};strokeColor=none;", x, y, s, s)
    d._cell(cid + "b", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", x + s * 0.32, y + s * 0.46, s * 0.36, s * 0.3)
    d._cell(cid + "s", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
            f"strokeColor=#FFFFFF;strokeWidth=1.5;", x + s * 0.36, y + s * 0.24, s * 0.28, s * 0.28)


def subnet(cid, x, y, w, h, label, kind):
    fill = PUBFILL if kind == "pub" else PRIVFILL
    cc = GREEN if kind == "pub" else BLUE
    d._cell(cid, f"rounded=0;html=1;fillColor={fill};strokeColor=none;", x, y, w, h)
    chip(cid + "c", x + 10, y + 10, cc)
    d.text(x + 40, y + 8, w - 50, 24, label, size=15, color=BLUE, align="left")


def servers(cid, x, y):
    for i in range(2, -1, -1):
        d._cell(f"{cid}{i}", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={ORANGE};strokeWidth=2;",
                x + i * 8, y + i * 8, 30, 30)


def aws_vpc(cid, bx, by, bw, bh, vx, vy, vw, vh):
    d._cell(cid + "cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", bx, by, bw, bh)
    d._cell(cid + "chip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
            "fontSize=10;fontStyle=1;fontFamily=Amazon Ember;", bx + 12, by + 12, 28, 22, "aws")
    d.text(bx + 46, by + 12, 130, 22, "AWS Cloud", size=15)
    d._cell(cid + "vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", vx, vy, vw, vh)
    chip(cid + "vc", vx + 10, vy + 10, GREEN, s=24)
    d.text(vx + 42, vy + 10, 80, 24, "VPC", size=16, color=GREEN, align="left")


# ---- headers ----------------------------------------------------------------
d.text(96, 116, 320, 28, "Without VPC Endpoints", size=20, bold=True, align="left")
arrow("hdr", [(400, 128), (566, 128)], w=5, head="block")
d.text(596, 116, 320, 28, "With VPC Endpoints", size=20, bold=True, align="left")
d.cells.append('<mxCell id="divider" style="endArrow=none;html=1;strokeColor=#232F3E;strokeWidth=4;'
               'dashed=1;dashPattern=4 5;" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
               '<mxPoint x="528" y="160" as="sourcePoint"/><mxPoint x="528" y="540" as="targetPoint"/></mxGeometry></mxCell>')

# ---- LEFT: without VPC endpoints --------------------------------------------
aws_vpc("L", 52, 158, 456, 384, 84, 230, 300, 300)
d.text(316, 196, 130, 24, "CloudWatch", size=16, align="left")
subnet("Lpub", 104, 286, 170, 104, "Public subnet", "pub")
d.svg_icon("Lnat", 158, 312, 42, 42, NAT, "")
d.text(118, 358, 140, 24, "NAT gateway", size=14, align="center")
subnet("Lpriv", 104, 404, 170, 118, "Private subnet", "priv")
servers("Lsrv", 150, 438)
d.text(118, 486, 140, 24, "Servers", size=14, align="center")
d.svg_icon("Ligw", 316, 372, 42, 42, IGW, "")
d.text(286, 416, 110, 48, "Internet\ngateway", size=14, align="center")
d._cell("inet", "shape=cloud;html=1;fillColor=#FFFFFF;strokeColor=#232F3E;strokeWidth=2;", 414, 296, 70, 50)
d.text(376, 350, 130, 24, "Internet", size=15, align="center")
arrow("Lsn", [(168, 438), (168, 358)])               # servers -> NAT
arrow("Lni", [(200, 332), (316, 392)])               # NAT -> IGW
arrow("Lii", [(358, 388), (414, 330)])               # IGW -> internet
arrow("Lic", [(448, 296), (448, 210), (380, 210)])   # internet -> CloudWatch

# ---- RIGHT: with VPC endpoints ----------------------------------------------
aws_vpc("R", 556, 158, 424, 384, 588, 230, 300, 300)
d.text(816, 196, 130, 24, "CloudWatch", size=16, align="left")
subnet("Rpub", 608, 286, 200, 104, "Public subnet", "pub")
d.svg_icon("Rnat", 678, 312, 42, 42, NAT, "")
d.text(636, 358, 140, 24, "NAT gateway", size=14, align="center")
subnet("Rpriv", 608, 404, 248, 118, "Private subnet", "priv")
servers("Rsrv", 632, 446)
d.text(600, 492, 140, 24, "Servers", size=14, align="center")
d.svg_icon("rvpe", 768, 446, 42, 42, VPE, "")
d.text(720, 418, 140, 24, "VPC endpoint", size=14, align="center")
arrow("Rsv", [(696, 466), (766, 466)])               # servers -> VPC endpoint
arrow("Rvc", [(810, 462), (940, 462), (940, 210)])   # VPC endpoint -> CloudWatch

res = d.save("m06-vpc-endpoint")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m06-vpc-endpoint"))
