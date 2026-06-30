"""m07-vpc-flow-logs-cloudwatch ("Publishing VPC Flow logs to CloudWatch") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A VPC with two subnets (each holding two
elastic network interfaces around a compute instance) has VPC Flow logs activated on one subnet
and on one elastic network interface. Flow logs are published to Amazon CloudWatch Logs, fanning
out into per-ENI log streams (Elastic Network Interface 1 / Network Interface 2 / Network
Interface 4). Official ENI / Flow-Logs / CloudWatch-Logs icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
ORANGE = "#ED7100"
PURPLE = "#5A4FCF"
MAGENTA = "#8C1D5B"
ENI = "Res_Amazon-VPC_Elastic-Network-Interface_48.svg"
FLOW = "Res_Amazon-VPC_Flow-Logs_48.svg"
CWL = "Res_Amazon-CloudWatch_Logs_48.svg"

d = Diagram("Publishing VPC Flow logs to CloudWatch", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 660, 4)


def arrow(cid, pts, w=2, head="classic", color=INK):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=7;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def lockchip(cid, x, y):
    d._cell(cid, f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", x, y, 20, 20)
    d._cell(cid + "b", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", x + 7, y + 10, 7, 6)
    d._cell(cid + "s", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
            "strokeColor=#FFFFFF;strokeWidth=1.5;", x + 8, y + 5, 5, 6)


def chip(cid, x, y):
    s = 34
    d._cell(cid, f"rounded=1;arcSize=12;html=1;fillColor=none;strokeColor={ORANGE};strokeWidth=2.5;", x, y, s, s)
    d._cell(cid + "i", f"rounded=0;html=1;fillColor=none;strokeColor={ORANGE};strokeWidth=2;", x + 8, y + 8, s - 16, s - 16)
    for k in range(3):
        lx = x + 8 + k * 9
        d._cell(f"{cid}t{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", lx, y - 4, 3, 4)
        d._cell(f"{cid}b{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", lx, y + s, 3, 4)
        d._cell(f"{cid}l{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", x - 4, y + 8 + k * 9, 4, 3)
        d._cell(f"{cid}r{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", x + s, y + 8 + k * 9, 4, 3)


def note(cid, x, y):
    d._cell(cid, "shape=note;size=8;html=1;fillColor=#FFFFFF;strokeColor=#5A5A5A;strokeWidth=1.5;", x, y, 28, 36)
    for i, ly in enumerate((y + 9, y + 16, y + 23, y + 30)):
        d._cell(f"{cid}l{i}", "rounded=0;html=1;fillColor=#8A8A8A;strokeColor=none;", x + 5, ly, 16, 2)


def tube(cid, x, y, color, n=5):
    d._cell(cid, f"rounded=1;arcSize=40;html=1;fillColor=none;strokeColor={color};strokeWidth=3;", x, y, 252, 60)
    for i in range(n):
        note(f"{cid}n{i}", x + 14 + i * 46, y + 12)


# ---- VPC box ----------------------------------------------------------------
d._cell("vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", 70, 198, 300, 262)
d._cell("vchip", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", 80, 208, 26, 26)
d._cell("vcloud", "shape=cloud;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=1.5;", 85, 214, 16, 12)
d.text(114, 208, 90, 26, "VPC", size=17, color=GREEN, align="left")

# top subnet (flow logs on one subnet)
d._cell("sub1", "rounded=0;html=1;fillColor=none;strokeColor=#1E8E14;strokeWidth=1.5;dashed=1;dashPattern=5 4;", 92, 244, 256, 96)
lockchip("s1lock", 100, 252)
d.svg_icon("eni1", 116, 268, 40, 40, ENI, "")
d.text(108, 308, 56, 22, "ENI1", size=15, color="#7A2E8E", align="center")
chip("chip1", 192, 270)
d.svg_icon("eni2", 268, 268, 40, 40, ENI, "")
d.text(260, 308, 56, 22, "ENI2", size=15, color="#7A2E8E", align="center")

# bottom subnet (flow logs on one ENI)
d._cell("sub2", "rounded=0;html=1;fillColor=none;strokeColor=#1E8E14;strokeWidth=1.5;dashed=1;dashPattern=5 4;", 92, 352, 256, 96)
lockchip("s2lock", 100, 360)
d.svg_icon("eni3", 116, 376, 40, 40, ENI, "")
d.text(108, 416, 56, 22, "ENI3", size=15, color="#232F3E", align="center")
chip("chip2", 192, 378)
d.svg_icon("eni4", 268, 376, 40, 40, ENI, "")
d.text(260, 416, 56, 22, "ENI4", size=15, color="#7A2E8E", align="center")

# activation callouts
d.text(70, 150, 360, 24, "VPC Flow logs activated on <b>one subnet</b>", size=16, align="left")
arrow("a_sub", [(220, 178), (220, 244)], w=4, color="#3B1E70", head="block")
d.text(40, 476, 420, 48, "VPC Flow logs activated on one <b>elastic network</b>\n<b>interface</b>", size=16, align="center")
arrow("a_eni", [(220, 470), (220, 448)], w=4, color="#3B1E70", head="block")

# ---- VPC Flow logs publisher ------------------------------------------------
d.svg_icon("flow", 346, 320, 46, 46, FLOW, "")
d.text(388, 322, 70, 70, "VPC\nFlow\nlogs", size=15, align="left")
arrow("pub", [(392, 343), (470, 343)], w=5, color="#3B1E70", head="block")

# ---- CloudWatch Logs --------------------------------------------------------
d.svg_icon("cwl", 488, 318, 46, 46, CWL, "")
d.text(456, 280, 120, 40, "Amazon\nCloudWatch Logs", size=15, align="center")

# ---- right: per-ENI log streams ---------------------------------------------
d._cell("streams", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 596, 196, 308, 300)
tube("t1", 614, 222, ORANGE)
tube("t2", 614, 312, PURPLE)
tube("t3", 614, 402, MAGENTA)
d.text(910, 220, 86, 90, "Elastic\nNetwork\nInterface 1\nlog stream", size=14, align="left")
d.text(910, 318, 86, 90, "Network\nInterface  2\nlog stream", size=14, align="left")
d.text(910, 408, 86, 90, "Network\nInterface 4\nlog stream", size=14, align="left")
arrow("f1", [(556, 338), (614, 252)])
arrow("f2", [(556, 343), (614, 342)])
arrow("f3", [(556, 348), (614, 432)])

res = d.save("m07-vpc-flow-logs-cloudwatch")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m07-vpc-flow-logs-cloudwatch"))
