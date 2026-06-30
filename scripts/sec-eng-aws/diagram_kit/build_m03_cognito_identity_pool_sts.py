"""m03-cognito-identity-pool-sts ("Identity pools overview") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Amazon Cognito identity pools federate
multiple IdPs (Facebook/Google/Amazon/SAML/OpenID/developer-authenticated). Flow:
(1) user signs in with IdP credentials, (2) permissions returned via an AWS STS role,
(3) user accesses AWS services. Official Cognito icon; AWS logo drawn.
"""
from aws_style import Diagram, P

PURPLE = "#330066"
BADGE = "#330066"
COG = "Arch_Amazon-Cognito_32.svg"

d = Diagram("Identity pools overview", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 440, 4)


def wire(cid, pts, color="#5A6470", w=2, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=7;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=15;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 30, 30, n)


# ---- IdP table --------------------------------------------------------------
cols = [("Facebook", 110), ("Google", 92), ("Amazon", 96), ("SAML", 84), ("OpenID", 96)]
x = 178
for i, (name, w) in enumerate(cols):
    d._cell(f"c{i}", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=#FFFFFF;strokeWidth=1.5;"
            "fontColor=#FFFFFF;fontSize=17;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, 128, w, 84, name)
    x += w
d._cell("cdev", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=#FFFFFF;strokeWidth=1.5;"
        "fontColor=#FFFFFF;fontStyle=1;fontSize=16;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
        x, 128, 180, 84, "Developer-\nauthenticated\nidentities")
table_l, table_r = 178, x + 180

# brace converging table -> Cognito
cx = (table_l + table_r) / 2
wire("br1", [(table_l, 214), (cx, 280), (cx, 320)], color=PURPLE, w=4, head="none")
wire("br2", [(table_r, 214), (cx, 280)], color=PURPLE, w=4, head="none")

# ---- Cognito identity pools -------------------------------------------------
d.svg_icon("cog", cx - 40, 320, 80, 80, COG, "")
d.text(cx + 52, 336, 220, 48, "Amazon Cognito\nidentity pools", size=17, align="left")

# ---- bottom flow ------------------------------------------------------------
d.svg_icon("user", 118, 410, 58, 58, "user", "User")
d._cell("aws", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontStyle=1;fontSize=34;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
        826, 404, 120, 120, "aws")
d.cells.append(
    '<mxCell id="smile" style="endArrow=classic;startArrow=none;html=1;rounded=1;'
    'strokeColor=#FF9900;strokeWidth=3;curved=1;" edge="1" parent="1">'
    '<mxGeometry relative="1" as="geometry"><mxPoint x="866" y="486" as="sourcePoint"/>'
    '<mxPoint x="918" y="482" as="targetPoint"/>'
    '<Array as="points"><mxPoint x="892" y="498"/></Array></mxGeometry></mxCell>')

# step 1: sign-in (user -> cognito)
wire("s1", [(196, 420), (cx - 44, 372)])
d.text(150, 348, 160, 44, "Sign-in with\nIdP credentials.", size=15, align="center")
badge("b1", 196, 410, "1")
# step 2: permissions back (cognito -> user)
wire("s2", [(cx - 44, 388), (188, 452)])
d.text(360, 408, 220, 66, "Permissions received by\nAWS Security Token\nService (AWS STS) role.", size=15, align="center")
badge("b2", 408, 360, "2")
# step 3: access to AWS (user -> aws)
wire("s3", [(196, 488), (820, 488)])
d.text(620, 446, 160, 44, "Access to AWS\nservices", size=15, align="center")
badge("b3", 542, 474, "3")

res = d.save("m03-cognito-identity-pool-sts")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-cognito-identity-pool-sts"))
