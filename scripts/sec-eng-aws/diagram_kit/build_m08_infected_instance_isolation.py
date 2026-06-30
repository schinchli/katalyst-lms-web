"""m08-infected-instance-isolation ("Infected instance example: Isolation") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A VPC public subnet (in AZ A) behind an internet
gateway + Application Load Balancer runs an Auto Scaling group of two Web-SG instances; an infected
instance is moved into an Isolated SG, with an Amazon EBS volume alongside. Right column: isolate
via a separate security group and protect from termination via disableApiTermination, with the two
modify-instance-attribute CLI commands. Official VPC/ELB/ASG/EBS icons; EC2 chips drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
GREEN = "#1E8E14"
ORANGE = "#ED7100"
RED = "#C7253E"
BLUE = "#147EBA"
PURPLE = "#7A3FC4"
IGW = "Res_Amazon-VPC_Internet-Gateway_48.svg"
ALB = "Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg"
ASG = "Res_Amazon-EC2_Auto-Scaling_48.svg"
EBS = "Res_Amazon-Elastic-Block-Store_Volume_48.svg"

d = Diagram("Infected instance example: Isolation", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 84, 700, 4)


def arrow(cid, pts, w=1.8, head="classic", color=INK):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def chip(cid, x, y, s=40):
    d._cell(cid, f"rounded=1;arcSize=12;html=1;fillColor=none;strokeColor={ORANGE};strokeWidth=2.5;", x, y, s, s)
    d._cell(cid + "i", f"rounded=0;html=1;fillColor=none;strokeColor={ORANGE};strokeWidth=2;", x + 8, y + 8, s - 16, s - 16)
    for k in range(3):
        lx = x + 8 + k * ((s - 16) // 2)
        d._cell(f"{cid}t{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", lx, y - 4, 3, 4)
        d._cell(f"{cid}b{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", lx, y + s, 3, 4)
        d._cell(f"{cid}l{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", x - 4, y + 8 + k * ((s - 16) // 2), 4, 3)
        d._cell(f"{cid}r{k}", f"rounded=0;html=1;fillColor={ORANGE};strokeColor=none;", x + s, y + 8 + k * ((s - 16) // 2), 4, 3)


def sadface(cid, x, y, s=46):
    chip(cid, x, y, s)
    cx = x + s / 2
    d._cell(cid + "f", f"ellipse;html=1;fillColor=#FFFFFF;strokeColor={PURPLE};strokeWidth=2;", x + 7, y + 7, s - 14, s - 14)
    d._cell(cid + "e1", f"ellipse;html=1;fillColor={PURPLE};strokeColor=none;", cx - 8, y + 16, 4, 4)
    d._cell(cid + "e2", f"ellipse;html=1;fillColor={PURPLE};strokeColor=none;", cx + 4, y + 16, 4, 4)
    d._cell(cid + "m", f"shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;strokeColor={PURPLE};strokeWidth=2;", cx - 7, y + 28, 14, 7)


# ---- VPC + AZ + subnet ------------------------------------------------------
d._cell("vpc", f"rounded=0;html=1;fillColor=none;strokeColor={GREEN};strokeWidth=1.5;", 40, 130, 668, 388)
d._cell("vchip", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", 50, 140, 24, 24)
d._cell("vcloud", "shape=cloud;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=1.2;", 54, 145, 16, 12)
d.text(82, 140, 90, 24, "VPC", size=16, color=GREEN, align="left")

d.svg_icon("igw", 248, 108, 46, 46, IGW, "")
d.text(304, 112, 200, 24, "Internet gateway", size=15, align="left")

d._cell("az", f"rounded=0;html=1;fillColor=none;strokeColor={BLUE};strokeWidth=1.5;dashed=1;dashPattern=4 4;", 70, 176, 568, 320)
d.text(330, 470, 240, 24, "Availability Zone A", size=16, color=BLUE, align="center")
d.svg_icon("alb", 248, 200, 46, 46, ALB, "")
d.text(312, 196, 140, 70, "Application\nLoad\nBalancer", size=15, align="left")
arrow("igw_alb", [(271, 156), (271, 200)])

d._cell("pub", "rounded=0;html=1;fillColor=#EAF4E6;strokeColor=none;", 92, 272, 472, 206)
d._cell("plock", f"rounded=0;html=1;fillColor={GREEN};strokeColor=none;", 102, 282, 22, 22)
d._cell("plb", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", 109, 293, 8, 7)
d._cell("pls", "shape=mxgraph.basic.half_circle;direction=north;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=1.5;", 110, 287, 6, 6)
d.text(132, 282, 200, 22, "Public subnet", size=16, color=GREEN, align="left")

# Auto Scaling group
d._cell("asg", f"rounded=0;html=1;fillColor=none;strokeColor={ORANGE};strokeWidth=1.5;dashed=1;dashPattern=4 4;", 110, 320, 348, 142)
d._cell("sg1", f"rounded=0;html=1;fillColor=none;strokeColor={RED};strokeWidth=2;", 128, 332, 96, 110)
chip("c1", 156, 350)
d.text(128, 410, 96, 22, "Web SG", size=15, color=RED, align="center")
d._cell("sg2", f"rounded=0;html=1;fillColor=none;strokeColor={RED};strokeWidth=2;", 244, 332, 96, 110)
chip("c2", 272, 350)
d.text(244, 410, 96, 22, "Web SG", size=15, color=RED, align="center")
d.svg_icon("asgicon", 424, 432, 26, 26, ASG, "")
d.text(150, 446, 270, 22, "Auto Scaling group", size=15, color=ORANGE, align="center")

# Isolated SG
d._cell("isg", f"rounded=0;html=1;fillColor=none;strokeColor={BLUE};strokeWidth=2;", 474, 332, 84, 120)
sadface("sad", 490, 346)
d.text(474, 400, 84, 44, "Isolated\nSG", size=15, color=BLUE, align="center")

# EBS volume
d.svg_icon("ebs", 590, 360, 46, 46, EBS, "")
d.text(560, 408, 110, 44, "Amazon EBS\nvolume", size=15, align="center")

# ALB -> instances (split)
arrow("alb_c1", [(265, 248), (265, 300), (176, 300), (176, 332)], color="#7A2E8E")
arrow("alb_c2", [(277, 248), (292, 300), (292, 332)], color="#7A2E8E")

# ---- right column: bullets + CLI --------------------------------------------
d.text(740, 132, 252, 60, "•  Isolate the instance by placing\n    it in a separate security group.", size=15, align="left")
d.text(740, 210, 256, 130, "•  Protect the instance from\n    accidental termination with the\n    <b>disableApiTermination</b>\n    attribute. (See the following\n    API command.)", size=15, align="left")
d._cell("cli", "text;html=1;align=left;verticalAlign=top;fontFamily=Courier New;fontSize=12;fontColor=#3A3A3A;whiteSpace=pre;",
        740, 360, 256, 80,
        "&gt; aws ec2 modify-instance-\nattribute --instance-id i-\na123 --groups sg-isolated")
d._cell("cli2", "text;html=1;align=left;verticalAlign=top;fontFamily=Courier New;fontSize=12;fontColor=#3A3A3A;whiteSpace=pre;",
        740, 442, 256, 110,
        "&gt; aws ec2 modify-instance-\nattribute --instance-id i-\na123 --attribute\ndisableApiTermination --\nvalue true")

res = d.save("m08-infected-instance-isolation")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m08-infected-instance-isolation"))
