"""m04-secrets-manager ("Using Secrets Manager") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Clients (mobile apps / websites / services)
reach API Gateway over the internet (1); API Gateway invokes a Lambda function (2); Lambda
retrieves database credentials from AWS Secrets Manager (3) and connects to the Amazon RDS
database (4). Official API Gateway / Lambda / Secrets Manager / RDS / gear icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
BADGE = "#330066"
RED = "#D32F2F"
APIGW = "Arch_Amazon-API-Gateway_48.svg"
LAMBDA = "Arch_AWS-Lambda_48.svg"
SM = "Arch_AWS-Secrets-Manager_48.svg"
RDS = "Arch_Amazon-RDS_48.svg"
GEAR = "Res_Gear_48_Light.svg"

d = Diagram("Using Secrets Manager", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 470, 4)


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=15;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 32, 32, n)


def arrow(cid, pts, color=INK, w=2, head="classic", both=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    start = "classic" if both else "none"
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=7;startArrow={start};startSize=7;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def key_glyph(cid, x, y, color):
    d._cell(cid + "r", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=4;", x, y + 4, 16, 16)
    d._cell(cid + "s", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 14, y + 10, 24, 4)
    d._cell(cid + "t1", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 32, y + 14, 4, 8)
    d._cell(cid + "t2", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 38, y + 14, 4, 10)


# ---- clients ----------------------------------------------------------------
d._cell("phone", f"rounded=1;arcSize=24;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2.5;", 214, 150, 40, 64)
d._cell("phscr", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=1;", 220, 160, 28, 40)
d.text(174, 222, 130, 48, "Mobile\napps", size=18, align="center")
d._cell("brow", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2.5;", 196, 286, 66, 50)
d._cell("browbar", f"rounded=0;html=1;fillColor={INK};strokeColor=none;", 196, 286, 66, 10)
d.text(176, 342, 130, 24, "Websites", size=18, align="center")
d.svg_icon("gear", 210, 378, 52, 52, GEAR, "")
d.text(176, 436, 130, 24, "Services", size=18, align="center")

# bracket -> badge 1 -> API Gateway
arrow("br1", [(258, 182), (300, 182), (300, 288)], head="none")
arrow("br2", [(266, 310), (300, 310)], head="none")
arrow("br3", [(258, 404), (300, 404), (300, 320)], head="none")
badge("b1", 286, 282, "1")
arrow("toapi", [(322, 298), (560, 298)], color=PURPLE, w=5, head="classic")
d.text(470, 330, 130, 24, "Internet", size=18, align="center")

# ---- AWS Cloud box ----------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 540, 128, 440, 384)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 554, 142, 30, 24, "aws")
d.text(590, 142, 130, 24, "AWS Cloud", size=15)
d.text(706, 140, 260, 24, "AWS Secrets Manager", size=17, align="left")

# row of services
d.svg_icon("apigw", 566, 270, 56, 56, APIGW, "")
d.text(536, 332, 116, 48, "API\nGateway", size=16, align="center")
d.svg_icon("lambda", 716, 270, 56, 56, LAMBDA, "")
d.text(686, 332, 116, 70, "AWS\nLambda\nfunction", size=16, align="center")
d.svg_icon("rds", 866, 270, 56, 56, RDS, "")
d.text(836, 332, 116, 70, "Amazon\nRDS\ndatabase", size=16, align="center")
d.svg_icon("sm", 796, 162, 56, 56, SM, "")
key_glyph("dbk", 862, 178, RED)
d.text(908, 168, 120, 48, "Database\ncredentials", size=16, align="left")

# ---- numbered flows ---------------------------------------------------------
# 2: API Gateway <-> Lambda
arrow("s2a", [(626, 282), (712, 282)])
arrow("s2b", [(712, 306), (626, 306)])
badge("b2", 654, 266, "2")
# 4: Lambda <-> RDS
arrow("s4a", [(776, 282), (862, 282)])
arrow("s4b", [(862, 306), (776, 306)])
badge("b4", 804, 290, "4")
# 3: Lambda <-> Secrets Manager <-> RDS (V)
arrow("s3a", [(748, 268), (804, 220)], both=True)
arrow("s3b", [(848, 220), (888, 268)], both=True)
badge("b3", 806, 206, "3")

res = d.save("m04-secrets-manager")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m04-secrets-manager"))
