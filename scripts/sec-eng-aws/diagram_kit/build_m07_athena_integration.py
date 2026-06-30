"""m07-athena-integration ("Athena automated integration") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Lists three predefined Athena security-
monitoring queries (VpcFlowLogsRejectedTCPTraffic, VpcFlowLogsRejectedTraffic,
VpcFlowLogsSshRdpTraffic) over a three-step flow: Amazon Athena -> AWS CloudFormation template
-> Start to query. Official Athena + CloudFormation architecture icons; magnifier drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
MAG = "#A4286A"
ATHENA = "Arch_Amazon-Athena_48.svg"
CFN = "Arch_AWS-CloudFormation_48.svg"

d = Diagram("Athena automated integration", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 660, 4)


def arrow(cid, x1, x2, y):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=block;endSize=8;startArrow=none;html=1;rounded=0;'
        f'strokeColor=#3B1E70;strokeWidth=4;" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y}" as="sourcePoint"/><mxPoint x="{x2}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')


# ---- bullet copy ------------------------------------------------------------
d.text(48, 96, 920, 60, "•  Some predefined queries that can be useful in security monitoring include the\n     following:", size=20, align="left")

subs = [
    (172, "VpcFlowLogsRejectedTCPTraffic:", " Identifies rejected TCP connections based on your security\ngroups or network ACLs"),
    (256, "VpcFlowLogsRejectedTraffic:", " Identifies all traffic rejected by security groups or network\nACLs"),
    (340, "VpcFlowLogsSshRdpTraffic:", " Identifies all SSH and RDP traffic"),
]
for y, name, rest in subs:
    d.text(96, y, 20, 24, "•", size=16, align="left")
    d.text(120, y, 870, 60, f'<b><font color="{MAG}">{name}</font></b>{rest}', size=16, align="left")

# ---- 3-step flow ------------------------------------------------------------
d.svg_icon("athena", 176, 384, 78, 78, ATHENA, "")
d.text(120, 470, 190, 24, "Amazon Athena", size=16, align="center")
arrow("a1", 272, 432, 423)
d.svg_icon("cfn", 446, 384, 78, 78, CFN, "")
d.text(376, 470, 220, 48, "AWS CloudFormation\ntemplate", size=16, align="center")
arrow("a2", 542, 700, 423)

# magnifier ("Start to query")
d._cell("mglens", "ellipse;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=4;", 724, 386, 64, 64)
d._cell("mglens2", "ellipse;html=1;fillColor=none;strokeColor=#8C4FFF;strokeWidth=2;", 734, 396, 44, 44)
d.cells.append('<mxCell id="mghandle" style="endArrow=none;html=1;strokeColor=#232F3E;strokeWidth=6;rounded=1;" '
               'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
               '<mxPoint x="780" y="442" as="sourcePoint"/><mxPoint x="804" y="466" as="targetPoint"/></mxGeometry></mxCell>')
d.text(690, 478, 180, 24, "Start to query", size=16, align="center")

res = d.save("m07-athena-integration")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m07-athena-integration"))
