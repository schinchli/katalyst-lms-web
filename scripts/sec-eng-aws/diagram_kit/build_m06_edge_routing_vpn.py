"""m06-edge-routing-vpn ("Edge-to-edge routing through VPN connection") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). VPC A peers with VPC B; VPC B reaches the
corporate data center via a virtual private gateway -> VPN -> customer gateway. The question
"can VPC A communicate with corporate through VPC B?" is answered No — edge-to-edge routing is
not supported (shown by the dashed "?" arrow). Official VPC peering / VPN / customer gateway icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
PEER = "Res_Amazon-VPC_Peering-Connection_48.svg"
VPGW = "Res_Amazon-VPC_VPN-Gateway_48.svg"
CGW = "Res_Amazon-VPC_Customer-Gateway_48.svg"

d = Diagram("Edge-to-edge routing through VPN connection", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 880, 4)


def line(cid, pts, color=INK, w=2, head="none", dashed=False, both=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=8 6;" if dashed else ""
    start = "block" if both else "none"
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=8;startArrow={start};startSize=8;html=1;rounded=0;{dash}'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def vpc(cid, x, y, w, h, label):
    d._cell(cid, f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", x, y, w, h)
    d._cell(cid + "c", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", x + 10, y + 10, 24, 24)
    d.text(x + 42, y + 10, 80, 24, "VPC", size=15, color=GREEN, align="left")
    d.text(x, y + h / 2, w, 30, label, size=24, align="center")


# ---- left: question + answer ------------------------------------------------
d._cell("qbox", "rounded=0;html=1;fillColor=#F0F0F0;strokeColor=#C9C9C9;strokeWidth=1;", 40, 128, 322, 292)
d.text(64, 150, 280, 240, "Can VPC A\ncommunicate with\ncorporate through\nVPC B?", size=27, bold=True, align="left")
d.text(40, 436, 120, 40, "No", size=30, bold=True, align="left")
d.text(56, 492, 300, 60, "•   Edge-to-edge routing\n     is not supported.", size=22, align="left")

# ---- AWS Cloud --------------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 400, 128, 420, 404)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=10;fontStyle=1;fontFamily=Amazon Ember;", 412, 140, 28, 22, "aws")
d.text(448, 140, 130, 22, "AWS Cloud", size=15)
vpc("vpcA", 420, 172, 200, 158, "VPC A")
vpc("vpcB", 558, 350, 200, 158, "VPC B")
d.svg_icon("peer", 470, 296, 54, 54, PEER, "")
d.text(444, 280, 70, 48, "VPC\npeer", size=15, align="center")
d.svg_icon("vpgw", 718, 348, 50, 50, VPGW, "")
d.text(672, 404, 150, 48, "Virtual private\ngateway", size=15, align="center")
line("aPeer", [(508, 330), (508, 296)])
line("peerB", [(508, 350), (508, 388), (558, 388)])

# ---- corporate data center + customer gateway -------------------------------
d._cell("cdc", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 858, 128, 122, 220)
d._cell("bldg", "rounded=0;html=1;fillColor=#5B6B7B;strokeColor=none;", 868, 140, 24, 22)
d.text(900, 138, 90, 48, "Corporate\ndata center", size=15, align="left")
d.svg_icon("cgw", 838, 234, 50, 50, CGW, "")
d.text(806, 290, 130, 48, "Customer\ngateway", size=15, align="center")
line("vpn", [(744, 348), (744, 260), (838, 260)])           # VPGW -> customer gateway (VPN)
line("cgw_cdc", [(888, 260), (920, 260), (920, 348)])       # customer gateway -> corporate

# ---- the "?" dashed edge-to-edge question -----------------------------------
line("q", [(620, 250), (858, 250)], dashed=True, head="block", both=True, w=4)
d.text(700, 210, 60, 30, "?", size=26, bold=True, align="center")

res = d.save("m06-edge-routing-vpn")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m06-edge-routing-vpn"))
