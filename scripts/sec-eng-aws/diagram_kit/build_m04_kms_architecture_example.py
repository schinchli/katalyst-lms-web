"""m04-kms-architecture-example ("Architecture example") — CloudHSM cluster recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Inside an Amazon VPC, two applications with
the CloudHSM client connect (each to both) CloudHSM instances that form a cluster. The slide's
right-hand bullets are section narration (notes body). Official EC2 / CloudHSM / VPC icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
BLUE = "#147EBA"
SUBNET = "#E3F0F8"
HSM = "Arch_AWS-CloudHSM_48.svg"
EC2 = "Arch_Amazon-EC2_48.svg"

d = Diagram("Architecture example", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 430, 4)


def wire(cid, x1, y1, x2, y2):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=classic;endSize=7;startArrow=none;html=1;rounded=0;'
        f'strokeColor={INK};strokeWidth=2;" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def lockchip(cid, x, y):
    d._cell(cid, f"rounded=0;html=1;fillColor={BLUE};strokeColor=none;", x, y, 30, 30)
    d._cell(cid + "b", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", x + 9, y + 14, 12, 9)
    d._cell(cid + "s", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;"
            "strokeColor=#FFFFFF;strokeWidth=2;", x + 11, y + 7, 8, 9)


# ---- AWS Cloud + VPC --------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 60, 110, 880, 424)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 74, 124, 30, 24, "aws")
d.text(110, 124, 130, 24, "AWS Cloud", size=15)
d._cell("vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=2;", 110, 162, 800, 352)
d._cell("vpcchip", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", 124, 176, 30, 30)
d.text(164, 178, 200, 26, "Amazon VPC", size=16, bold=True, color=GREEN, align="left")

# ---- application subnets (left) ---------------------------------------------
for i, y in enumerate((218, 366)):
    d._cell(f"app{i}", f"rounded=0;html=1;fillColor={SUBNET};strokeColor=#147EBA;strokeWidth=1.5;"
            "dashed=1;dashPattern=4 3;", 176, y, 290, 130)
    lockchip(f"lk{i}", 190, y + 12)
    d.svg_icon(f"ec2_{i}", 300, y + 22, 48, 48, EC2, "")
    d.text(196, y + 78, 250, 44, "Application with\nCloudHSM client", size=16, align="center")

# ---- cluster (right) --------------------------------------------------------
d.text(770, 184, 110, 24, "Cluster", size=16, align="center")
d._cell("cluster", "rounded=0;html=1;fillColor=#F2F2F2;strokeColor=#232F3E;strokeWidth=1.5;"
        "dashed=1;dashPattern=6 4;", 560, 210, 300, 286)
for i, (y, label) in enumerate([(218, "CloudHSM\ninstance 1"), (366, "CloudHSM\ninstance 2")]):
    d._cell(f"hsmbox{i}", "rounded=0;html=1;fillColor=none;strokeColor=#147EBA;strokeWidth=1.5;"
            "dashed=1;dashPattern=4 3;", 576, y, 268, 122)
    d.svg_icon(f"hsm{i}", 690, y + 14, 52, 52, HSM, "")
    d.text(680, y + 70, 160, 44, label, size=16, align="center")

# ---- crossing connections (each app -> both HSM instances) ------------------
wire("a0h0", 350, 290, 686, 252)   # app1 -> HSM1
wire("a0h1", 350, 300, 686, 408)   # app1 -> HSM2
wire("a1h0", 350, 412, 686, 268)   # app2 -> HSM1
wire("a1h1", 350, 438, 686, 420)   # app2 -> HSM2

res = d.save("m04-kms-architecture-example")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m04-kms-architecture-example"))
