"""m03-federation-saml-oidc-trust ("Federated users") — recreation of the slide diagram.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A corporate data center (identity provider
+ identity store) establishes a SAML 2.0 / OpenID Connect (OIDC) trust with AWS; federated
users then access AWS via the console, CLI, or API. The two slide bullets are section
narration (notes body). Official AWS "users" icon; AWS logo + DB cylinder drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
MAG = "#C2268C"

d = Diagram("Federated users", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 360, 4)


def box(cid, x, y, w, h, fill="#FFFFFF", stroke=INK, sw=1.5, dashed=False, dp="4 4"):
    dash = f"dashed=1;dashPattern={dp};" if dashed else ""
    d._cell(cid, f"rounded=0;html=1;fillColor={fill};strokeColor={stroke};strokeWidth={sw};{dash}",
            x, y, w, h)


def wire(cid, pts, color=PURPLE, w=4, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- Corporate data center --------------------------------------------------
box("cdc", 108, 150, 440, 320)
d._cell("bldg", "rounded=0;html=1;fillColor=#5B6B7B;strokeColor=none;", 124, 164, 30, 28)
d._cell("bw1", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", 130, 170, 6, 6)
d._cell("bw2", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", 142, 170, 6, 6)
d._cell("bw3", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", 130, 182, 6, 6)
d._cell("bw4", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=none;", 142, 182, 6, 6)
d.text(162, 164, 280, 28, "Corporate data center", size=16, align="left")

# identity provider + mapping boxes
d.text(126, 286, 130, 26, "Identity provider", size=16, align="left")
box("idp", 300, 286, 66, 34)
for i, yy in enumerate((250, 288, 326)):
    box(f"idpm{i}", 424, yy, 50, 28)
    wire(f"idpl{i}", [(390, 303), (412, 303), (412, yy + 14), (424, yy + 14)], color=MAG, w=2, head="none")
wire("idp_bus", [(366, 303), (390, 303)], color=MAG, w=2, head="none")

# identity store (dashed boundary + DB + users)
d.text(126, 388, 110, 44, "Identity\nstore", size=16, align="left")
box("idstore", 268, 366, 214, 96, dashed=True, stroke=PURPLE, sw=3, dp="8 5")
d._cell("db", "shape=cylinder3;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#FFFFFF;"
        "strokeColor=#232F3E;strokeWidth=2;", 300, 380, 50, 68)
d.svg_icon("users", 372, 396, 52, 46, "users", "")

# ---- Trust (SAML / OIDC) double arrow ---------------------------------------
d.text(556, 230, 210, 48, "SAML 2.0 or OpenID\nConnect (OIDC)", size=16, align="center")
d._cell("tbar", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=none;fontColor=#FFFFFF;"
        "fontStyle=1;fontSize=18;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
        592, 296, 128, 32, "Trust")
d._cell("tl", f"triangle;direction=west;html=1;fillColor={PURPLE};strokeColor=none;", 566, 290, 28, 44)
d._cell("tr", f"triangle;direction=east;html=1;fillColor={PURPLE};strokeColor=none;", 718, 290, 28, 44)

# ---- AWS ---------------------------------------------------------------------
d._cell("aws", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontStyle=1;fontSize=46;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
        780, 188, 170, 170, "aws")
d.cells.append(
    '<mxCell id="smile" style="endArrow=classic;startArrow=none;html=1;rounded=1;'
    'strokeColor=#FF9900;strokeWidth=4;curved=1;" edge="1" parent="1">'
    '<mxGeometry relative="1" as="geometry"><mxPoint x="838" y="312" as="sourcePoint"/>'
    '<mxPoint x="906" y="306" as="targetPoint"/>'
    '<Array as="points"><mxPoint x="872" y="328"/></Array></mxGeometry></mxCell>')

# ---- access path (identity store -> AWS) ------------------------------------
wire("access", [(482, 414), (864, 414), (864, 360)])
d.text(556, 420, 330, 48, "Access through AWS Management\nConsole, AWS CLI, or API", size=16, align="left")

res = d.save("m03-federation-saml-oidc-trust")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-federation-saml-oidc-trust"))
