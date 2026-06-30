"""m03-control-tower-landing-zone ("AnyCompany unified environment") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A unified AWS Control Tower landing zone:
management account + Control Tower over AWS Organizations and IAM Identity Center; Security OU
(logging/audit) and Workload OU (OU AnyCompany + OU Example Corp -> non-prod/prod accounts).
Official AWS Organizations / Control Tower / Identity Center icons.
"""
from aws_style import Diagram, P

WIRE = "#3B4654"
MGMT = "Res_AWS-Organizations_Management-Account_48.svg"
ORG = "Arch_AWS-Organizations_48.svg"
OU = "Res_AWS-Organizations_Organizational-Unit_48.svg"
ACCT = "Res_AWS-Organizations_Account_48.svg"
CT = "Arch_AWS-Control-Tower_48.svg"
IIC = "Arch_AWS-IAM-Identity-Center_32.svg"

d = Diagram("AnyCompany unified environment", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 640, 4)


def wire(cid, pts, w=2, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow=none;html=1;rounded=0;'
        f'strokeColor={WIRE};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def split(cid, px, py, children_cx, top_y, bus_y):
    wire(cid + "0", [(px, py), (px, bus_y)], head="none")
    wire(cid + "b", [(min(children_cx), bus_y), (max(children_cx), bus_y)], head="none")
    for i, cx in enumerate(children_cx):
        wire(f"{cid}{i}", [(cx, bus_y), (cx, top_y)])


d._cell("box", "rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 168, 92, 824, 446)

# ---- level 0: management account + Control Tower -----------------------------
d.svg_icon("mgmt", 184, 104, 42, 42, MGMT, "")
d.text(234, 104, 220, 44, "Unified\nmanagement account", size=15, align="left")
d.svg_icon("ct", 594, 100, 52, 52, CT, "")
d.text(656, 114, 200, 24, "AWS Control Tower", size=16, align="left")

# ---- level 1: Organizations + IAM Identity Center ---------------------------
d.svg_icon("org", 424, 190, 52, 52, ORG, "")
d.text(378, 246, 150, 24, "AWS Organizations", size=15, align="center")
d.svg_icon("iic", 834, 190, 52, 52, IIC, "")
d.text(788, 246, 150, 24, "IAM Identity Center", size=15, align="center")
split("ct_", 620, 152, [450, 860], 190, 174)

# ---- level 2: Security OU + Workload OU -------------------------------------
d.svg_icon("secou", 240, 294, 48, 44, OU, "")
d.text(298, 306, 110, 24, "Security OU", size=15, align="left")
d.svg_icon("wlou", 613, 294, 48, 44, OU, "")
d.text(600, 340, 110, 40, "Workload\nOU", size=15, align="center")
split("org_", 450, 242, [264, 637], 294, 272)

# ---- level 3: intermediate workload OUs -------------------------------------
d.svg_icon("ouany", 497, 366, 44, 40, OU, "")
d.text(440, 408, 160, 24, "OU AnyCompany", size=15, align="center")
d.svg_icon("ouex", 733, 366, 44, 40, OU, "")
d.text(680, 408, 160, 24, "OU Example Corp", size=15, align="center")
split("wl_", 637, 338, [519, 755], 366, 356)

# ---- level 4: accounts ------------------------------------------------------
accts = [("alog", 210, "Logging\naccount"), ("aaud", 318, "Audit\naccount"),
         ("anpa", 466, "Non-prod\naccount"), ("apra", 572, "Prod\naccount"),
         ("anpe", 694, "Non-prod\naccount"), ("apre", 816, "Prod\naccount")]
for cid, cx, label in accts:
    d.svg_icon(cid, cx - 21, 446, 42, 42, ACCT, "")
    d.text(cx - 56, 490, 112, 42, label, size=14, align="center")

# Security OU -> logging/audit ; OU AnyCompany -> non-prod/prod ; OU Example -> non-prod/prod
split("sec_", 264, 338, [210, 318], 446, 426)
split("any_", 519, 406, [466, 572], 446, 428)
split("ex_", 755, 406, [694, 816], 446, 428)

res = d.save("m03-control-tower-landing-zone")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-control-tower-landing-zone"))
