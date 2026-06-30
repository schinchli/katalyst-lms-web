"""m03-control-tower-account-structure ("AnyCompany and Example Corp merger") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Two account structures side by side:
LEFT  = AnyCompany (AWS Organizations -> OU A/OU B -> production / non-production accounts).
RIGHT = Example Corp governed by AWS Control Tower (Organizations + IAM Identity Center;
Security OU -> logging/audit, Workload OU -> non-production/production).
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

d = Diagram("AnyCompany and Example Corp merger", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 800, 4)


def wire(cid, pts, w=2, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={WIRE};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- boxes ------------------------------------------------------------------
d._cell("lbox", "rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 28, 108, 444, 424)
d._cell("rbox", "rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 488, 108, 484, 424)

# ===== LEFT: AnyCompany =======================================================
d.svg_icon("Lmgmt", 44, 124, 42, 42, MGMT, "")
d.text(94, 124, 200, 44, "AnyCompany\nmanagement account", size=15, align="left")
d.svg_icon("Lorg", 196, 200, 52, 52, ORG, "")
d.text(150, 256, 150, 24, "AWS Organizations", size=15, align="center")
d.svg_icon("LouA", 110, 318, 46, 42, OU, "")
d.text(96, 364, 80, 24, "OU A", size=15, align="center")
d.svg_icon("LouB", 308, 318, 46, 42, OU, "")
d.text(294, 364, 80, 24, "OU B", size=15, align="center")
d.svg_icon("Lprod", 114, 422, 38, 38, ACCT, "")
d.text(80, 462, 110, 44, "Production\naccount", size=15, align="center")
d.svg_icon("Lnp", 312, 422, 38, 38, ACCT, "")
d.text(272, 462, 130, 44, "Non-production\naccount", size=15, align="center")
wire("Lt0", [(222, 252), (222, 286)], head="none")
wire("Ltbus", [(133, 286), (331, 286)], head="none")
wire("LtA", [(133, 286), (133, 318)])
wire("LtB", [(331, 286), (331, 318)])
wire("Lpa", [(133, 360), (133, 422)])
wire("Lnpa", [(331, 360), (331, 422)])

# ===== RIGHT: Example Corp (Control Tower) ===================================
d.svg_icon("Rmgmt", 506, 124, 42, 42, MGMT, "")
d.text(556, 124, 180, 44, "Example Corp\nmanagement account", size=14, align="left")
d.svg_icon("ct", 724, 122, 46, 46, CT, "")
d.text(778, 130, 180, 24, "AWS Control Tower", size=14, align="left")
d.svg_icon("Rorg", 632, 206, 48, 48, ORG, "")
d.text(590, 260, 140, 24, "AWS Organizations", size=14, align="center")
d.svg_icon("iic", 814, 206, 48, 48, IIC, "")
d.text(776, 260, 140, 24, "IAM Identity Center", size=14, align="center")
wire("Rt0", [(747, 168), (747, 188)], head="none")
wire("Rtbus", [(656, 188), (838, 188)], head="none")
wire("RtOrg", [(656, 188), (656, 206)])
wire("RtIIC", [(838, 188), (838, 206)])
# Security OU + Workload OU
d.svg_icon("secou", 572, 308, 44, 40, OU, "")
d.text(620, 320, 110, 24, "Security OU", size=14, align="left")
d.svg_icon("wlou", 772, 308, 44, 40, OU, "")
d.text(820, 320, 110, 24, "Workload OU", size=14, align="left")
wire("Ro0", [(656, 254), (656, 286)], head="none")
wire("Robus", [(594, 286), (794, 286)], head="none")
wire("RoS", [(594, 286), (594, 308)])
wire("RoW", [(794, 286), (794, 308)])
# leaf accounts
leaves = [("Rlog", 540, "Logging\naccount"), ("Raud", 642, "Audit\naccount"),
          ("Rnp", 742, "Non-production\naccount"), ("Rprod", 852, "Production\naccount")]
for cid, cx, label in leaves:
    d.svg_icon(cid, cx, 408, 36, 36, ACCT, "")
    d.text(cx - 36, 448, 108, 44, label, size=13, align="center")
# security OU -> logging/audit
wire("Rsb", [(558, 366), (660, 366)], head="none")
wire("Rs0", [(594, 348), (594, 366)], head="none")
wire("RsL", [(558, 366), (558, 408)])
wire("RsA", [(660, 366), (660, 408)])
# workload OU -> non-prod/prod
wire("Rwb", [(760, 366), (870, 366)], head="none")
wire("Rw0", [(794, 348), (794, 366)], head="none")
wire("RwN", [(760, 366), (760, 408)])
wire("RwP", [(870, 366), (870, 408)])

res = d.save("m03-control-tower-account-structure")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-control-tower-account-structure"))
