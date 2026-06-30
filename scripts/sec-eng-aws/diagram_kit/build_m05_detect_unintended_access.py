"""m05-detect-unintended-access ("Use case: Detect unintended access") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). IAM Access Analyzer for S3 events (via
EventBridge) and a scheduled EventBridge event trigger a Lambda and an AWS Step Functions state
machine (Submit scan -> Check status -> Create findings) that scans S3 buckets with Amazon
Macie, records state in DynamoDB, and reports findings to AWS Security Hub. Official AWS icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
BADGE = "#4A148C"
SF = "#B0117A"
IAA = "Res_AWS-Identity-Access-Management_IAM-Access-Analyzer_48.svg"
LAMBDA = "Arch_AWS-Lambda_48.svg"
DDB = "Arch_Amazon-DynamoDB_48.svg"
S3 = "Arch_Amazon-Simple-Storage-Service_48.svg"
MACIE = "Arch_Amazon-Macie_48.svg"
SHUB = "Arch_AWS-Security-Hub_48.svg"
STEPFN = "Arch_AWS-Step-Functions_48.svg"

d = Diagram("Use case: Detect unintended access", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 660, 4)


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=14;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 30, 30, n)


def arrow(cid, pts, color=INK, w=2, head="classic", dashed=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=4 4;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=7;startArrow=none;html=1;rounded=0;{dash}'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- top row ----------------------------------------------------------------
d.svg_icon("iaa", 110, 148, 52, 52, IAA, "")
d.text(72, 206, 160, 48, "IAM Access\nAnalyzer for S3", size=15, align="center")
d.text(248, 206, 150, 48, "Amazon\nEventBridge", size=15, align="center")
d.svg_icon("lambda", 446, 148, 52, 52, LAMBDA, "")
d.text(410, 206, 140, 48, "AWS Lambda\nfunction", size=15, align="center")
d.svg_icon("ddb", 612, 148, 52, 52, DDB, "")
d.text(560, 124, 160, 24, "Amazon DynamoDB", size=15, align="center")
d.svg_icon("s3", 846, 148, 52, 52, S3, "")
d.text(818, 124, 120, 24, "S3 bucket", size=15, align="center")
d.text(948, 152, 120, 48, "Shared\nexternally", size=15, bold=True, align="left")
badge("b1", 432, 124, "1")
arrow("t1", [(164, 174), (240, 174)])
arrow("t2", [(398, 174), (444, 174)])
arrow("t3", [(500, 174), (610, 174)])
arrow("sx", [(940, 174), (902, 174)], color=BADGE, w=4)

# ---- AWS Step Functions box -------------------------------------------------
d._cell("sfbox", f"rounded=0;html=1;fillColor=none;strokeColor={SF};strokeWidth=2.5;", 400, 290, 380, 252)
d.svg_icon("sfchip", 414, 300, 30, 30, STEPFN, "")
d.text(452, 302, 220, 24, "AWS Step Functions", size=16, color=SF, align="left")
d.svg_icon("l_submit", 618, 344, 48, 48, LAMBDA, "")
d.text(508, 356, 120, 24, "Submit scan", size=16, align="center")
d.svg_icon("l_check", 618, 424, 48, 48, LAMBDA, "")
d.text(508, 436, 120, 24, "Check status", size=16, align="center")
d.svg_icon("l_find", 618, 496, 48, 48, LAMBDA, "")
d.text(560, 544, 160, 24, "Create findings", size=16, align="center")

# ---- triggers + targets -----------------------------------------------------
d.text(266, 432, 140, 70, "Scheduled\nEventBridge\nevent", size=15, align="center")
badge("b2", 360, 360, "2")
arrow("sched", [(394, 375), (400, 375)])
d.svg_icon("macie", 852, 344, 52, 52, MACIE, "")
d.text(816, 402, 130, 24, "Amazon Macie", size=15, align="center")
badge("b3", 758, 360, "3")
arrow("toMacie", [(668, 368), (850, 368)])
badge("b4", 872, 300, "4")
arrow("macieS3", [(878, 344), (878, 202)])
d.svg_icon("shub", 300, 496, 52, 52, SHUB, "")
d.text(262, 552, 130, 24, "AWS Security Hub", size=15, align="center")
badge("b8", 446, 506, "8")
arrow("toShub", [(614, 520), (354, 520)])

# ---- step-machine internal flow + DynamoDB dashed links ---------------------
arrow("submit_check", [(642, 392), (642, 424)])
arrow("check_find", [(642, 472), (642, 496)])
badge("b6", 556, 466, "6")
arrow("ddb_submit", [(640, 202), (640, 344)], dashed=True, head="none")
badge("b5", 750, 436, "5")
arrow("check_ddb", [(666, 448), (730, 448), (730, 360)], dashed=True, head="none")
badge("b7", 694, 500, "7")
arrow("find_ddb", [(666, 516), (700, 516), (700, 360)], dashed=True, head="none")

res = d.save("m05-detect-unintended-access")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m05-detect-unintended-access"))
