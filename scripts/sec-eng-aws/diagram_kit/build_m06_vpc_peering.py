"""m06-vpc-peering ("VPC peering use case") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Two regulated-workload VPCs (Financials in
AWS Account 1, Confidential in AWS Account 2) each peer with a central log-processing VPC in
AWS Account 3 via VPC peering connections. Official VPC peering icon; VPC chips drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
PEER = "Res_Amazon-VPC_Peering-Connection_48.svg"

d = Diagram("VPC peering use case", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 400, 4)


def arrow(cid, pts, w=4, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={INK};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def account(cid, x, y, w, h, name, vpc_label):
    d._cell(cid, "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", x, y, w, h)
    d._cell(cid + "chip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
            "fontSize=10;fontStyle=1;fontFamily=Amazon Ember;", x + 12, y + 12, 28, 22, "aws")
    d.text(x + 46, y + 12, w - 60, 24, name, size=15, align="left")
    vx, vy, vw, vh = x + 26, y + 46, w - 52, h - 62
    d._cell(cid + "vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", vx, vy, vw, vh)
    d._cell(cid + "vchip", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", vx + 8, vy + 8, 26, 26)
    d.text(vx + 42, vy + 10, 80, 24, "VPC", size=16, color=GREEN, align="left")
    d.text(vx + 30, vy + 44, vw - 40, 70, vpc_label, size=17, align="center")


account("a1", 196, 118, 300, 206, "AWS Account 1", "Regulated\nworkload:\nFinancials")
account("a2", 560, 118, 300, 206, "AWS Account 2", "Regulated\nworkload:\nConfidential")
account("a3", 376, 356, 300, 188, "AWS Account 3", "Central VPC\n(log processing)")

# ---- VPC peering connections ------------------------------------------------
d.svg_icon("peer1", 244, 372, 56, 56, PEER, "")
d.text(218, 432, 110, 48, "VPC\npeer", size=16, align="center")
d.svg_icon("peer2", 760, 372, 56, 56, PEER, "")
d.text(734, 432, 110, 48, "VPC\npeer", size=16, align="center")

# Account 1 VPC -> peer1 -> Account 3 VPC
arrow("a1peer", [(232, 280), (232, 400), (244, 400)])
arrow("peer3a", [(300, 400), (340, 400), (340, 446), (402, 446)])
# Account 2 VPC -> peer2 -> Account 3 VPC
arrow("a2peer", [(824, 280), (824, 400), (816, 400)])
arrow("peer3b", [(760, 400), (716, 400), (716, 446), (660, 446)])

res = d.save("m06-vpc-peering")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m06-vpc-peering"))
