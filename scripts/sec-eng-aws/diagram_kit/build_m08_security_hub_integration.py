"""m08-security-hub-integration ("Security Hub integration") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A set of finding sources (Amazon Macie, IAM
Access Analyzer, AWS Systems Manager Patch Manager, Amazon Inspector, Amazon GuardDuty, AWS
partner network, AWS Firewall Manager, AWS Config) feed AWS Security Hub, from which you
investigate findings and take remediation actions (dashboard). Official AWS icons where the slide
shows them; text-only sources rendered as labels (as in the slide).
"""
from aws_style import Diagram, P

INK = "#232F3E"
ARROW = "#3B1466"
IAA = "Res_AWS-Identity-Access-Management_IAM-Access-Analyzer_48.svg"
PATCH = "Res_AWS-Systems-Manager_Patch-Manager_48.svg"
CONFIG = "Arch_AWS-Config_48.svg"

d = Diagram("Security Hub integration", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 84, 920, 4)

# ---- sources box ------------------------------------------------------------
d._cell("box", f"rounded=1;arcSize=4;html=1;fillColor=none;strokeColor=#9AA3AD;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 40, 128, 470, 396)

# text-only sources (left column: Macie top, Inspector middle, Firewall bottom)
d.text(56, 196, 130, 50, "Amazon\nMacie", size=16, align="center")
d.text(56, 318, 130, 50, "Amazon\nInspector", size=16, align="center")
d.text(196, 318, 130, 50, "Amazon\nGuardDuty", size=16, align="center")
d.text(48, 452, 150, 50, "AWS Firewall\nManager", size=16, align="center")

# IAM Access Analyzer
d.svg_icon("iaa", 232, 150, 50, 50, IAA, "")
d.text(170, 206, 180, 50, "IAM\nAccess Analyzer", size=16, align="center")
# SSM Patch Manager
d.svg_icon("patch", 358, 172, 52, 52, PATCH, "")
d.text(300, 230, 180, 74, "AWS Systems\nManager Patch\nManager", size=16, align="center")
# AWS Config
d.svg_icon("config", 210, 392, 50, 50, CONFIG, "")
d.text(160, 448, 150, 26, "AWS Config", size=16, align="center")

# AWS partner network (wordmark + text)
d.text(330, 336, 70, 30, "<b>aws</b>", size=22, color="#252F3E", align="left")
d._cell("smile", "shape=mxgraph.basic.half_circle;direction=south;html=1;fillColor=none;strokeColor=#FF9900;strokeWidth=3;", 336, 360, 40, 12)
d.text(404, 332, 110, 44, "partner\nnetwork", size=15, color="#5A6B7B", align="left")

# ---- block arrows + Security Hub --------------------------------------------
d._cell("arr1", f"shape=singleArrow;direction=east;arrowWidth=0.7;arrowSize=0.4;html=1;fillColor={ARROW};strokeColor=none;", 524, 286, 70, 64)
d.text(600, 300, 170, 70, "AWS Security\nHub", size=22, align="center")
d._cell("arr2", f"shape=singleArrow;direction=east;arrowWidth=0.7;arrowSize=0.4;html=1;fillColor={ARROW};strokeColor=none;", 772, 286, 70, 64)

# ---- dashboard window -------------------------------------------------------
d.text(800, 140, 200, 70, "Investigate findings and take\nremediation actions.", size=20, align="center")
WX, WY, WW, WH = 856, 230, 130, 150
d._cell("win", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=#7B6FBF;strokeWidth=2;", WX, WY, WW, WH)
d._cell("winbar", "rounded=0;html=1;fillColor=none;strokeColor=#7B6FBF;strokeWidth=1.5;", WX, WY, WW, 18)
for i in range(3):
    d._cell(f"wd{i}", "ellipse;html=1;fillColor=#5A4F8C;strokeColor=none;", WX + 8 + i * 9, WY + 6, 5, 5)
d._cell("chartbox", "rounded=0;html=1;fillColor=none;strokeColor=#7B6FBF;strokeWidth=1.5;", WX + 30, WY + 34, WW - 44, 56)
d.cells.append(f'<mxCell id="spark" style="endArrow=none;html=1;strokeColor=#232F3E;strokeWidth=2;rounded=0;" edge="1" parent="1">'
               f'<mxGeometry relative="1" as="geometry"><mxPoint x="{WX+38}" y="{WY+62}" as="sourcePoint"/>'
               f'<mxPoint x="{WX+112}" y="{WY+62}" as="targetPoint"/><Array as="points">'
               f'<mxPoint x="{WX+46}" y="{WY+48}"/><mxPoint x="{WX+54}" y="{WY+70}"/><mxPoint x="{WX+64}" y="{WY+46}"/>'
               f'<mxPoint x="{WX+74}" y="{WY+68}"/><mxPoint x="{WX+86}" y="{WY+48}"/><mxPoint x="{WX+98}" y="{WY+66}"/>'
               f'</Array></mxGeometry></mxCell>')

res = d.save("m08-security-hub-integration")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m08-security-hub-integration"))
