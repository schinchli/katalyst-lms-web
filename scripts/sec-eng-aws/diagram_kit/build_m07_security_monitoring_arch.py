"""m07-security-monitoring-arch ("Security monitoring example architecture") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Investigative & detective services (Trusted
Advisor, Security Hub, GuardDuty) plus CloudTrail feed an Amazon EventBridge event -> EventBridge
rule -> Lambda function -> Amazon Data Firehose -> insights/analytics/threat-intelligence tools.
VPC Flow Logs and application logs flow into CloudWatch / CloudWatch Logs, which also routes to
Firehose. Official AWS service + resource icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
MAG = "#B0084D"
TADV = "Arch_AWS-Trusted-Advisor_48.svg"
SHUB = "Arch_AWS-Security-Hub_48.svg"
GD = "Arch_Amazon-GuardDuty_48.svg"
EBEV = "Res_Amazon-EventBridge-Event_48.svg"
EBRULE = "Res_Amazon-EventBridge_Rule_48.svg"
LAM = "Arch_AWS-Lambda_48.svg"
FH = "Arch_Amazon-Data-Firehose_48.svg"
CT = "Arch_AWS-CloudTrail_48.svg"
CW = "Arch_Amazon-CloudWatch_48.svg"
CWL = "Res_Amazon-CloudWatch_Logs_48.svg"
VFL = "Res_Amazon-VPC_Flow-Logs_48.svg"

d = Diagram("Security monitoring example architecture", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 92, 920, 4)


def arrow(cid, pts, w=2, head="classic", color=INK):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=7;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def gear(cid, x, y):
    d._cell(cid, "ellipse;html=1;fillColor=none;strokeColor=#5A4FCF;strokeWidth=2.5;", x, y, 40, 40)
    d._cell(cid + "i", "ellipse;html=1;fillColor=none;strokeColor=#5A4FCF;strokeWidth=2.5;", x + 13, y + 13, 14, 14)
    for k, (dx, dy) in enumerate(((20, -3), (20, 40), (-3, 20), (40, 20), (5, 5), (33, 5), (5, 33), (33, 33))):
        d._cell(f"{cid}t{k}", "rounded=0;html=1;fillColor=#5A4FCF;strokeColor=none;", x + dx - 2, y + dy - 2, 5, 5)


def window(cid, x, y, w, h):
    d._cell(cid, "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=#232F3E;strokeWidth=2;", x, y, w, h)
    d._cell(cid + "bar", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1;", x, y, w, 14)
    for i in range(3):
        d._cell(f"{cid}d{i}", "ellipse;html=1;fillColor=#232F3E;strokeColor=none;", x + 5 + i * 7, y + 5, 4, 4)
    d._cell(cid + "ch", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", x + 8, y + 22, w - 40, h - 32)


# ---- detective services box -------------------------------------------------
d._cell("box", "rounded=0;html=1;fillColor=#F0F0F0;strokeColor=#5A5A5A;strokeWidth=1.5;", 30, 118, 230, 222)
d.svg_icon("tadv", 60, 132, 52, 52, TADV, "")
d.text(40, 188, 110, 48, "AWS Trusted\nAdvisor", size=15, align="center")
d.svg_icon("shub", 174, 132, 52, 52, SHUB, "")
d.text(158, 188, 100, 48, "AWS Security\nHub", size=15, align="center")
d.svg_icon("gd", 110, 236, 52, 52, GD, "")
d.text(70, 292, 150, 24, "Amazon GuardDuty", size=15, align="center")
d.text(40, 348, 210, 48, "<b>Investigative and</b>\n<b>Detective services</b>", size=16, align="center")

# ---- top pipeline -----------------------------------------------------------
d.svg_icon("ebev", 432, 130, 54, 54, EBEV, "")
d.text(392, 188, 140, 70, "Amazon\nEventBridge\nevent", size=15, align="center")
d.svg_icon("ebrule", 542, 130, 54, 54, EBRULE, "")
d.text(502, 188, 140, 70, "Amazon\nEventBridge\nrule", size=15, align="center")
d.svg_icon("lam", 642, 130, 52, 52, LAM, "")
d.text(606, 188, 120, 48, "Lambda\nfunction", size=15, align="center")
d.svg_icon("fh", 738, 128, 54, 54, FH, "")
d.text(700, 188, 130, 48, "Amazon Data\nFirehose", size=15, align="center")
window("win", 872, 130, 96, 68)
d.text(852, 204, 150, 70, "Insights, analytics,\nand threat\nintelligence tools", size=15, align="center")

arrow("p0", [(260, 158), (426, 158)])
arrow("p1", [(490, 157), (538, 157)])
arrow("p2", [(598, 157), (638, 157)])
arrow("p3", [(696, 156), (734, 156)])
arrow("p4", [(794, 156), (866, 156)])

# ---- lower sources ----------------------------------------------------------
d.svg_icon("ct", 332, 296, 52, 52, CT, "")
d.text(300, 352, 150, 24, "AWS CloudTrail", size=15, align="center")
arrow("ct_ev", [(358, 296), (358, 250), (460, 250), (460, 186)])

# CloudWatch Logs container
d._cell("cwbox", f"rounded=0;html=1;fillColor=none;strokeColor={MAG};strokeWidth=2;", 456, 316, 250, 208)
d.svg_icon("cw", 554, 282, 52, 52, CW, "")
d.text(612, 346, 180, 24, "Amazon CloudWatch", size=16, align="left")
d.svg_icon("cwl1", 556, 384, 46, 46, CWL, "")
d.svg_icon("cwl2", 556, 444, 46, 46, CWL, "")
d.text(500, 496, 200, 24, "CloudWatch Logs", size=16, align="center")

d.svg_icon("vfl", 350, 384, 46, 46, VFL, "")
d.text(250, 388, 110, 48, "VPC Flow\nLogs", size=15, align="center")
gear("appg", 352, 444)
d.text(228, 454, 130, 24, "Application logs", size=15, align="center")
arrow("vfl_cw", [(400, 407), (552, 407)])
arrow("app_cw", [(396, 464), (552, 464)])

# logs pipeline -> Firehose
arrow("cw_fh", [(706, 400), (846, 400), (846, 230), (765, 230), (765, 184)])

res = d.save("m07-security-monitoring-arch")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m07-security-monitoring-arch"))
