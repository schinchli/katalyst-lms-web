"""m03-control-tower-account-provisioning ("AWS Control Tower use case") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Nikki (security engineer) and the
AWSAccountFactory group sign in through IAM Identity Center; Control Tower + Service Catalog
(Account Factory) provision a New OU, apply Control Tower controls, and create an Account
inside AWS Organizations. Official AWS icons; numbered steps 1-3.
"""
from aws_style import Diagram, P

VIOLET = "#8C4FFF"
DEEP = "#330066"
MAG = "#C2185B"
ORG = "Arch_AWS-Organizations_48.svg"
OU = "Res_AWS-Organizations_Organizational-Unit_48.svg"
ACCT = "Res_AWS-Organizations_Account_48.svg"
CT = "Arch_AWS-Control-Tower_48.svg"
IIC = "Arch_AWS-IAM-Identity-Center_32.svg"
SC = "Arch_AWS-Service-Catalog_48.svg"

d = Diagram("AWS Control Tower use case", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 480, 4)


def wire(cid, pts, color=VIOLET, w=3.5, head="block", dashed=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=6 5;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};{dash}" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={DEEP};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=16;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 34, 34, n)


def controls(cid, x, y):
    d._cell(cid + "b", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={MAG};strokeWidth=2;", x + 8, y, 34, 44)
    d._cell(cid + "f", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={MAG};strokeWidth=2;", x, y + 8, 34, 44)
    for i, yy in enumerate((y + 18, y + 28, y + 38)):
        d.cells.append(
            f'<mxCell id="{cid}l{i}" style="endArrow=none;html=1;strokeColor={MAG};strokeWidth=2;" '
            f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x + 7}" y="{yy}" as="sourcePoint"/><mxPoint x="{x + 27}" y="{yy}" as="targetPoint"/></mxGeometry></mxCell>')


# ---- actors -----------------------------------------------------------------
d.svg_icon("nikki", 118, 198, 60, 60, "user", "")
d.text(70, 262, 160, 44, "Nikki,\nsecurity engineer", size=16, align="center")
badge("b1", 192, 220, "1")
d.svg_icon("group", 116, 372, 66, 54, "users", "")
d.text(60, 430, 200, 44, "AWSAccountFactory\ngroup", size=16, align="center")
badge("b3", 226, 396, "3")

# ---- IAM Identity Center ----------------------------------------------------
d.svg_icon("iic", 292, 286, 64, 64, IIC, "")
d.text(252, 354, 144, 44, "IAM Identity\nCenter", size=16, align="center")

# ---- Control Tower + Service Catalog ----------------------------------------
d.svg_icon("ct", 472, 210, 60, 60, CT, "")
d.text(428, 276, 150, 44, "AWS Control\nTower", size=16, align="center")
badge("b2", 538, 246, "2")
d.svg_icon("sc", 472, 396, 60, 60, SC, "")
d.text(428, 462, 150, 44, "AWS Service\nCatalog", size=16, align="center")

# ---- AWS Organizations box --------------------------------------------------
d._cell("orgbox", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 720, 212, 244, 320)
d.text(730, 182, 220, 24, "AWS Organizations", size=16, align="left")
d.svg_icon("orgchip", 908, 222, 40, 40, ORG, "")
d.svg_icon("newou", 748, 234, 46, 42, OU, "")
d.text(812, 246, 130, 24, "New OU", size=15, align="left")
controls("ctrl", 750, 310)
d.text(812, 312, 140, 60, "AWS Control\nTower\ncontrols", size=14, align="left")
d.svg_icon("acct", 748, 424, 40, 40, ACCT, "")
d.text(812, 436, 130, 24, "Account", size=15, align="left")
wire("oudown", [(771, 276), (771, 310)], color="#3B4654", w=2)
wire("ctrldown", [(771, 372), (771, 424)], color="#3B4654", w=2)

# ---- flow arrows ------------------------------------------------------------
wire("a1", [(226, 222), (324, 222), (324, 286)], color=VIOLET)                 # Nikki -> IIC
wire("a3", [(260, 400), (324, 400), (324, 352)], color=DEEP)                    # group -> IIC
wire("iic_ct", [(358, 300), (470, 250)], color=VIOLET)                          # IIC -> Control Tower
wire("iic_sc", [(358, 342), (470, 420)], color=DEEP)                            # IIC -> Service Catalog
wire("ct_ou", [(536, 248), (720, 252)], color=VIOLET)                           # CT -> New OU
wire("ct_ctrl", [(536, 262), (720, 334)], color=VIOLET)                         # CT -> controls
wire("af", [(502, 278), (502, 396)], color=DEEP, dashed=True)                   # CT -> SC (Account Factory)
d.text(516, 318, 120, 44, "Account\nFactory", size=15, align="left")
wire("sc_acct", [(532, 430), (720, 444)], color=DEEP)                           # SC -> Account

res = d.save("m03-control-tower-account-provisioning")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-control-tower-account-provisioning"))
