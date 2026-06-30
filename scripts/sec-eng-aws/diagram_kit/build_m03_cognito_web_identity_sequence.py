"""m03-cognito-web-identity-sequence ("Authentication workflow") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). UML-style sequence across four lifelines:
Device, Web IdPs, Amazon Cognito identity pools, AWS STS. Login -> GetID -> Validation ->
GetCredentialsForIdentity -> Validation -> AssumeRoleWithWebIdentity, returning temporary
credentials to the device. Official Cognito + STS icons; phone/cloud glyphs drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
BLUE = "#1E6FB8"
RED = "#C7253E"
GRAY = "#9AA1A9"
COG = "Arch_Amazon-Cognito_32.svg"
STS = "Res_AWS-Identity-Access-Management_AWS-STS_48.svg"

D, W, C, S = 150, 375, 610, 850   # lifeline x positions

d = Diagram("Authentication workflow", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 470, 4)


def msg(cid, x1, x2, y, label="", color=RED, boxed=False):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=classic;endSize=8;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth=2.5;" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')
    if label:
        midx = (x1 + x2) / 2
        fill = "#FFFFFF" if boxed else "none"
        stroke = "#C9C9C9" if boxed else "none"
        d._cell(cid + "L", f"rounded=0;html=1;fillColor={fill};strokeColor={stroke};"
                f"fontColor={INK};fontSize=16;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
                midx - 120, y - 26, 240, 22, label)


# ---- lifelines + headers ----------------------------------------------------
for x in (D, W, C, S):
    d.cells.append(
        f'<mxCell id="ll{x}" style="endArrow=none;html=1;strokeColor={GRAY};strokeWidth=2;" '
        'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x}" y="178" as="sourcePoint"/><mxPoint x="{x}" y="534" as="targetPoint"/></mxGeometry></mxCell>')

# Device (phone)
d._cell("phone", f"rounded=1;arcSize=22;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2;",
        D - 18, 104, 36, 62)
d._cell("phscr", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=1;", D - 12, 116, 24, 36)
d.text(D - 70, 172, 140, 24, "Device", size=16, bold=True, align="center")
# Web IdPs (cloud + up/down arrows)
d._cell("cloud", f"shape=cloud;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2;", W - 38, 108, 76, 54)
d.text(W - 14, 122, 14, 24, "↑", size=16, align="center")
d.text(W + 2, 122, 14, 24, "↓", size=16, align="center")
d.text(W - 80, 172, 160, 24, "Web IdPs", size=16, bold=True, align="center")
# Cognito
d.svg_icon("cog", C - 35, 104, 70, 70, COG, "")
d.text(C - 110, 172, 220, 44, "Amazon Cognito\nidentity pools", size=16, bold=True, align="center")
# STS
d.svg_icon("sts", S - 26, 106, 52, 62, STS, "")
d.text(S - 80, 172, 160, 24, "AWS STS", size=16, bold=True, align="center")

# ---- messages ---------------------------------------------------------------
msg("m1", D, W, 222, "Login", BLUE)
msg("m2", W, D, 252, "", BLUE)
msg("m3", D, C, 300, "GetID", RED, boxed=True)
msg("m4", C, W, 332, "Validation", RED)
msg("m5", C, D, 362, "", RED)
msg("m6", D, C, 414, "GetCredentialsForIdentity", RED, boxed=True)
msg("m7", C, W, 446, "Validation", RED)
msg("m8", C, S, 482, "AssumeRoleWithWebIdentity", INK)
msg("m9", S, C, 508, "", INK)
msg("m10", C, D, 528, "", RED)

res = d.save("m03-cognito-web-identity-sequence")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-cognito-web-identity-sequence"))
