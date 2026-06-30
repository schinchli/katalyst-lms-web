"""m08-automated-response-arch ("Security Hub Automated Response and Remediation architecture").

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Administrator account: AWS Config -> Security
Hub -> Findings drive a Security Hub custom action / EventBridge rules into the default event bus,
an Orchestrator (Step Functions) workflow (assumed via Orchestrator admin IAM role) that notifies
an SNS topic and invokes the Member account's ASR member stack — control-runbook SSM documents
(scoped by IAM roles + a remediation KMS key) that remediate customer resources (Lambda, S3,
other). Official AWS service + resource icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
DASH = "#5A6B86"
CONFIG = "Arch_AWS-Config_48.svg"
SHUB = "Arch_AWS-Security-Hub_48.svg"
SHRED = "#D5314B"
EBRULE = "Res_Amazon-EventBridge_Rule_48.svg"
EBBUS = "Res_Amazon-EventBridge_Default-Event-Bus_48.svg"
IAMROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"
SFN = "Arch_AWS-Step-Functions_48.svg"
SNS = "Arch_Amazon-Simple-Notification-Service_48.svg"
SSMDOC = "Res_AWS-Systems-Manager_Documents_48.svg"
KMS = "Arch_AWS-Key-Management-Service_48.svg"
LAMBDA = "Arch_AWS-Lambda_48.svg"
S3 = "Arch_Amazon-Simple-Storage-Service_48.svg"

d = Diagram("Security Hub Automated Response and Remediation architecture", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 86, 920, 4)


def arrow(cid, pts, w=1.8, head="classic"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={INK};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def awschip(cid, x, y):
    d._cell(cid, "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
            "fontSize=9;fontStyle=1;fontFamily=Amazon Ember;", x, y, 26, 20, "aws")


def badge(cid, x, y, n):
    d._cell(cid, "ellipse;html=1;fillColor=#000000;strokeColor=none;fontColor=#FFFFFF;fontStyle=1;"
            "fontSize=12;fontFamily=Amazon Ember;align=center;verticalAlign=middle;", x, y, 24, 24, n)


def shield(cid, x, y, s=42):
    # red shield + exclamation (the Security-Hub Finding sprite breaks drawio SVG export)
    d._cell(cid + "b", f"rounded=1;arcSize=30;html=1;fillColor={SHRED};strokeColor=none;", x, y, s, int(s * 0.62))
    d._cell(cid + "p", f"shape=triangle;direction=south;html=1;fillColor={SHRED};strokeColor=none;",
            x + s * 0.12, y + s * 0.40, s * 0.76, s * 0.5)
    d._cell(cid + "e", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", x + s / 2 - 2, y + 8, 4, int(s * 0.34))
    d._cell(cid + "d", "ellipse;html=1;fillColor=#FFFFFF;strokeColor=none;", x + s / 2 - 2.5, y + 8 + int(s * 0.40), 5, 5)


def cube(cid, x, y, s=40):
    # hand-drawn wireframe cube (drawio's shape=cube breaks SVG export)
    o = 9
    d._cell(cid + "f", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=2;", x, y + o, s - o, s - o)
    for a, b in (((x, y + o), (x + o, y)), ((x + s - o, y + o), (x + s, y)),
                 ((x + s - o, y + s), (x + s, y + s - o))):
        d.cells.append(
            f'<mxCell id="{cid}{a[0]}{b[1]}" style="endArrow=none;html=1;strokeColor=#232F3E;strokeWidth=2;" '
            f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{a[0]}" y="{a[1]}" as="sourcePoint"/><mxPoint x="{b[0]}" y="{b[1]}" as="targetPoint"/></mxGeometry></mxCell>')
    d._cell(cid + "t", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=2;", x + o, y, s - o, s - o)


# ---- account boxes ----------------------------------------------------------
d._cell("admin", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 20, 118, 556, 422)
awschip("ac", 30, 128)
d.text(62, 128, 300, 20, "Administrator account", size=14, align="left")
d._cell("member", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 588, 118, 408, 422)
awschip("mc", 598, 128)
d.text(630, 124, 360, 30, "Member Account (admin account can also be\nmember)", size=13, align="left")

# gray detective column (admin)
d._cell("gcol", "rounded=0;html=1;fillColor=#F0F0F0;strokeColor=none;", 30, 150, 126, 384)
d.svg_icon("config", 80, 158, 44, 44, CONFIG, "")
d.text(40, 204, 110, 20, "AWS Config", size=14, align="center")
badge("b1", 132, 168, "1")
d.svg_icon("shub", 80, 256, 44, 44, SHUB, "")
d.text(40, 302, 110, 36, "AWS Security\nHub", size=14, align="center")
shield("find", 82, 404)
d.text(40, 450, 110, 20, "Findings", size=14, align="center")

# ASR admin stack
d._cell("asradm", f"rounded=0;html=1;fillColor=none;strokeColor={DASH};strokeWidth=1.5;dashed=1;dashPattern=6 4;", 170, 150, 400, 384)
d.text(170, 158, 400, 20, "ASR Administrator Stack", size=14, align="center")
d.svg_icon("custom", 240, 232, 44, 44, CONFIG, "")
d.text(196, 278, 140, 36, "Security Hub\nCustom action", size=14, align="center")
d.svg_icon("bus", 322, 326, 44, 44, EBBUS, "")
d.text(296, 372, 100, 54, "Default\nEventBridge\nBus", size=14, align="center")
badge("b2", 286, 396, "2")
d.svg_icon("ruleT", 384, 232, 42, 42, EBRULE, "")
d.text(316, 196, 200, 36, "Manual Remediation\nEventBridge Rule", size=13, align="center")
d.svg_icon("ruleB", 398, 404, 42, 42, EBRULE, "")
d.text(330, 452, 200, 36, "Manual Remediation\nEventBridge Rule", size=13, align="center")
d.svg_icon("role3", 500, 156, 42, 42, IAMROLE, "")
d.text(456, 196, 160, 36, "Orchestrator\nadmin IAM Role", size=13, align="center")
badge("b3", 548, 162, "3")
d.svg_icon("wf", 500, 250, 46, 46, SFN, "")
d.text(458, 296, 140, 36, "Orchestrator\nWorkflow", size=14, align="center")
d.svg_icon("sns", 500, 400, 46, 46, SNS, "")
d.text(456, 446, 150, 36, "Amazon SNS\nTopic", size=14, align="center")
badge("b5", 470, 388, "5")

# ASR member stack
d._cell("asrmem", f"rounded=0;html=1;fillColor=none;strokeColor={DASH};strokeWidth=1.5;dashed=1;dashPattern=6 4;", 598, 150, 270, 384)
d.text(598, 158, 270, 20, "ASR Member Stack", size=14, align="center")
d.svg_icon("mrole1", 642, 200, 40, 40, IAMROLE, "")
d.text(600, 240, 130, 36, "Orchestrator\nadmin IAM Role", size=13, align="center")
d.svg_icon("mrole2", 782, 200, 40, 40, IAMROLE, "")
d.text(740, 240, 130, 36, "Orchestrator\nadmin IAM Role", size=13, align="center")
d.svg_icon("ssm1", 642, 300, 40, 40, SSMDOC, "")
d.text(596, 342, 140, 36, "Control Runbook\nSSM Document", size=13, align="center")
d.svg_icon("ssm2", 782, 300, 40, 40, SSMDOC, "")
d.text(736, 342, 140, 36, "Control Runbook\nSSM Document", size=13, align="center")
badge("b4", 838, 290, "4")
d.svg_icon("kms", 782, 404, 42, 42, KMS, "")
d.text(736, 450, 140, 36, "Remediation KMS\nKey", size=13, align="center")

# customer resources column
d._cell("cust", "rounded=0;html=1;fillColor=#F0F0F0;strokeColor=none;", 882, 150, 110, 384)
d.text(888, 158, 100, 36, "Customer\nresources", size=14, align="center")
d.svg_icon("lambda", 902, 206, 40, 40, LAMBDA, "")
d.text(884, 246, 110, 36, "AWS Lambda\nFunction", size=13, align="center")
d.svg_icon("s3", 902, 300, 40, 40, S3, "")
d.text(884, 342, 110, 20, "Amazon S3", size=13, align="center")
cube("other", 904, 396)
d.text(884, 440, 110, 36, "Other\nresources", size=13, align="center")

# ---- arrows -----------------------------------------------------------------
arrow("a_cs", [(102, 204), (102, 254)])                       # Config -> Security Hub
arrow("a_sf", [(102, 302), (102, 402)])                       # Security Hub -> Findings
arrow("a_fc", [(126, 420), (205, 420), (205, 254), (238, 254)])  # Findings -> Custom action
arrow("a_fb", [(126, 432), (300, 432), (300, 370)])           # Findings -> Default bus
arrow("a_crt", [(286, 250), (382, 250)])                      # Custom action -> Rule top
arrow("a_bus_rb", [(360, 360), (398, 420)])                   # bus -> Rule bottom
arrow("a_rt_wf", [(428, 252), (498, 262)])                    # Rule top -> Workflow
arrow("a_rb_wf", [(442, 420), (522, 420), (522, 298)])        # Rule bottom -> Workflow
arrow("a_role_wf", [(521, 198), (521, 248)])                  # admin IAM role -> Workflow
arrow("a_wf_sns", [(523, 298), (523, 398)])                   # Workflow -> SNS
# cross-account
arrow("a_role_x", [(544, 176), (640, 176), (640, 200)])       # admin role -> member role1
arrow("a_role12", [(684, 220), (780, 220)])                   # member role1 -> role2
arrow("a_r1_ssm", [(662, 242), (662, 298)])                   # role1 -> SSM doc1
arrow("a_r2_ssm", [(802, 242), (802, 298)])                   # role2 -> SSM doc2
arrow("a_wf_ssm", [(548, 274), (662, 274), (662, 300)])       # Workflow -> SSM doc1
arrow("a_ssm12", [(684, 320), (780, 320)])                    # SSM doc1 -> SSM doc2
arrow("a_ssm_s3", [(824, 320), (900, 320)])                   # SSM doc2 -> customer resources
arrow("a_ssm_kms", [(802, 342), (802, 402)])                  # SSM doc2 -> KMS key
arrow("a_l_s3", [(922, 248), (922, 298)])                     # Lambda -> S3
arrow("a_s3_other", [(922, 342), (922, 394)])                 # S3 -> Other

res = d.save("m08-automated-response-arch")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m08-automated-response-arch"))
