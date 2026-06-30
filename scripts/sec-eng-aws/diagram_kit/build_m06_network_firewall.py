"""m06-network-firewall ("Network Firewall overview") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Connectivity options (Transit Gateway, VPN
Gateway, Direct Connect, internet gateway) route through an AWS Network Firewall endpoint in a
VPC that creates policies, blocks/filters traffic, and monitors it before reaching private /
public subnets. Firewall Manager + AWS Organizations manage multiple deployments; firewall
activity is published to S3, CloudWatch, and partner solutions. Official AWS icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
BLUE = "#147EBA"
RED = "#C7253E"
TGW = "Arch_AWS-Transit-Gateway_48.svg"
VPN = "Res_Amazon-VPC_VPN-Gateway_48.svg"
DX = "Arch_AWS-Direct-Connect_48.svg"
IGW = "Res_Amazon-VPC_Internet-Gateway_48.svg"
ORG = "Arch_AWS-Organizations_48.svg"
FWM = "Arch_AWS-Firewall-Manager_48.svg"
S3 = "Arch_Amazon-Simple-Storage-Service_48.svg"
CW = "Arch_Amazon-CloudWatch_48.svg"
MKT = "Arch_AWS-Marketplace_Dark_32.svg"

d = Diagram("Network Firewall overview", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 540, 4)


def arrow(cid, pts, w=2, head="classic", color=INK):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def seg(cid, x1, y1, x2, y2, color, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;html=1;strokeColor={color};strokeWidth={w};" '
        f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/><mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def lockchip(cid, x, y, color):
    d._cell(cid, f"rounded=0;html=1;fillColor={color};strokeColor=none;", x, y, 24, 24)
    d._cell(cid + "b", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", x + 8, y + 12, 8, 7)
    d._cell(cid + "s", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
            "strokeColor=#FFFFFF;strokeWidth=1.5;", x + 9, y + 6, 6, 7)


def policy(cid, x, y):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=2.5;", x, y, 32, 42)
    for i, ry in enumerate((y + 8, y + 20)):
        seg(f"{cid}a{i}", x + 8, ry + 3, x + 12, ry + 7, RED, 2.5); seg(f"{cid}b{i}", x + 12, ry + 7, x + 24, ry - 2, RED, 2.5)
    seg(f"{cid}x1", x + 8, y + 30, x + 22, y + 40, RED, 2.5); seg(f"{cid}x2", x + 22, y + 30, x + 8, y + 40, RED, 2.5)


def funnel(cid, x, y):
    d._cell(cid, f"ellipse;html=1;fillColor=none;strokeColor={RED};strokeWidth=2.5;", x, y, 44, 44)
    d._cell(cid + "f", f"shape=trapezoid;direction=south;html=1;fillColor=none;strokeColor={RED};strokeWidth=2.5;", x + 10, y + 10, 24, 14)
    d._cell(cid + "st", f"rounded=0;html=1;fillColor={RED};strokeColor=none;", x + 20, y + 24, 4, 12)


def monitor(cid, x, y):
    d._cell(cid, f"shape=cloud;html=1;fillColor=none;strokeColor=#5A4F8C;strokeWidth=2.5;", x, y, 52, 40)
    d._cell(cid + "mc", f"ellipse;html=1;fillColor=none;strokeColor=#5A4F8C;strokeWidth=2.5;", x + 28, y + 22, 16, 16)
    seg(cid + "mh", x + 42, y + 36, x + 50, y + 44, "#5A4F8C", 2.5)


# ---- left: connectivity options ---------------------------------------------
d._cell("conbox", "rounded=0;html=1;fillColor=#F0F0F0;strokeColor=none;", 44, 116, 182, 424)
opts = [(TGW, 132, "AWS Transit Gateway"), (VPN, 222, "VPN Gateway"),
        (DX, 312, "AWS Direct Connect"), (IGW, 402, "Internet gateway")]
for icon, y, label in opts:
    d.svg_icon(f"c_{y}", 112, y, 46, 46, icon, "")
    d.text(46, y + 50, 178, 24, label, size=15, align="center")

# ---- manage deployments -----------------------------------------------------
d.text(430, 112, 560, 28, "Manage Multiple Firewall Deployments", size=18, bold=True, align="left")
d.svg_icon("org", 534, 150, 52, 52, ORG, "")
d.text(470, 206, 180, 24, "AWS Organizations", size=15, align="center")
d.svg_icon("fwm", 726, 150, 52, 52, FWM, "")
d.text(672, 206, 180, 24, "Firewall Manager", size=15, align="center")

# ---- VPC firewall -----------------------------------------------------------
d._cell("vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", 320, 256, 620, 192)
d._cell("vchip", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", 332, 268, 24, 24)
d.text(364, 270, 80, 24, "VPC", size=16, color=GREEN, align="left")
d.text(248, 344, 92, 48, "Firewall\nendpoint", size=15, align="center")
d._cell("fwinner", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 372, 298, 380, 128)
policy("pol", 422, 312)
d.text(382, 358, 130, 24, "Create a policy", size=15, align="center")
funnel("fun", 556, 312)
d.text(518, 358, 130, 24, "Block and filter", size=15, align="center")
monitor("mon", 668, 314)
d.text(648, 358, 100, 24, "Monitor", size=15, align="center")
d.text(556, 426, 280, 24, "Publish firewall activity", size=17, bold=True, align="center")

# ---- right: subnets ---------------------------------------------------------
d._cell("priv", "rounded=0;html=1;fillColor=#DCEAF5;strokeColor=none;", 832, 268, 130, 58)
lockchip("privc", 840, 282, BLUE)
d.text(872, 274, 90, 48, "Private\nsubnet", size=15, color=BLUE, align="left")
d._cell("pub", "rounded=0;html=1;fillColor=#E6F2E0;strokeColor=none;", 832, 348, 130, 58)
lockchip("pubc", 840, 362, GREEN)
d.text(872, 354, 90, 48, "Public\nsubnet", size=15, color=GREEN, align="left")
arrow("conin", [(240, 340), (318, 340)])
arrow("conout", [(318, 396), (240, 396)])
arrow("toPriv", [(942, 296), (1000, 296)] if False else [(944, 296), (998, 296)])
arrow("vpcPriv", [(880, 340), (830, 340)])

# ---- bottom: publish targets ------------------------------------------------
arrow("pubact", [(646, 448), (646, 458)])
d.svg_icon("s3", 436, 458, 50, 50, S3, "")
d.text(366, 512, 200, 48, "Amazon Simple Storage\nService (Amazon S3)", size=15, align="center")
d.svg_icon("cw", 620, 458, 50, 50, CW, "")
d.text(560, 512, 170, 24, "Amazon CloudWatch", size=15, align="center")
d.svg_icon("mkt", 792, 458, 50, 50, MKT, "")
d.text(730, 512, 180, 48, "Integrated\nPartner Solutions", size=15, align="center")

res = d.save("m06-network-firewall")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m06-network-firewall"))
