"""m02-cross-account-assumerole — pixel-faithful recreation of the course slide
"AnyCompany cross-account access example".

Canvas 1000x562 (16:9). Coordinates + colours measured directly from the original slide
(slides/m02-cross-account-assumerole.png, 2001x1125 -> scale 1000/2001). Official AWS
Icon-package icons only (user, IAM Role, AWS STS, Temporary-Security-Credential, S3).
Slide chrome (aws logo, copyright, page number) intentionally omitted.
"""
from aws_style import Diagram, P, compare

# Colours sampled from the slide
MAGENTA = "#8C1060"     # AnyCompany box + its connector lines (measured #80-90,10,60-96)
STEP = P.BADGE          # numbered step arrows + badges (measured #330066)

d = Diagram("", width=1000, height=562)

# Title (top-left, matches slide wording + position)
d.text(28, 8, 900, 40, "AnyCompany cross-account access example", size=31, bold=True)
# Decorative purple underline beneath the title
d._cell("rule", f"rounded=0;fillColor={MAGENTA};strokeColor=none;", 28, 46, 636, 3)


# ---- local edge helper (custom logic stays in the build script) -------------
def edge(src, tgt, color=STEP, width=2, dashed=False, arrow="block", start="none",
         sx=None, sy=None, tx=None, ty=None, points=None):
    st = (f"endArrow={arrow};startArrow={start};html=1;strokeColor={color};"
          f"strokeWidth={width};rounded=0;")
    if dashed:
        st += "dashed=1;dashPattern=6 4;"
    if sx is not None:
        st += f"exitX={sx};exitY={sy};exitDx=0;exitDy=0;"
    if tx is not None:
        st += f"entryX={tx};entryY={ty};entryDx=0;entryDy=0;"
    pts = ""
    if points:
        arr = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in points)
        pts = f'<Array as="points">{arr}</Array>'
    d.cells.append(
        f'<mxCell id="{d._id("e")}" style="{st}" edge="1" parent="1" '
        f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry">'
        f'{pts}</mxGeometry></mxCell>')


# ---- nodes ------------------------------------------------------------------
# AnyCompany magenta box (center-left)
d._cell("anyco", f"rounded=0;whiteSpace=wrap;html=1;fillColor={MAGENTA};strokeColor=none;"
        "fontColor=#FFFFFF;fontSize=16;fontStyle=1;fontFamily=Amazon Ember;",
        100, 131, 96, 40, "AnyCompany")

# Development account user: María (top-middle) + Production account user: John (below)
d.svg_icon("maria", 204, 48, 50, 50, "user", "Development account\nuser: María")
d.svg_icon("john", 204, 383, 50, 50, "user", "Production account\nuser: John")

# AWS STS (clock icon), middle
d.svg_icon("sts", 331, 118, 46, 46,
           "Res_AWS-Identity-Access-Management_AWS-STS_48.svg", "STS")

# Temporary security credentials (key icon), top-right
d.svg_icon("creds", 773, 48, 48, 48,
           "Res_AWS-Identity-Access-Management_Temporary-Security-Credential_48.svg", "")
d.text(733, 95, 154, 36, "Temporary security\ncredentials", size=13, align="center")

# DevOnlyRole (IAM Role icon), bottom-right; label sits to the RIGHT (as on slide)
d.svg_icon("role", 638, 175, 48, 48,
           "Res_AWS-Identity-Access-Management_Role_48.svg", "")
d.text(692, 188, 110, 22, "DevOnlyRole", size=13)

# John's S3 bucket (bottom-left)
d.svg_icon("s3", 60, 397, 48, 48,
           "Arch_Amazon-Simple-Storage-Service_48.svg", "John's S3 bucket")

# Edge labels (code-style names on the step arrows)
d.text(266, 104, 90, 18, "AssumeRole", size=13)
d.text(483, 200, 85, 18, "CreateRole", size=13)

# ---- step badges ------------------------------------------------------------
d.badge(562, 197, "1", size=26, cid="b1")
d.badge(245, 116, "2", size=26, cid="b2")
d.badge(717, 55, "3", size=26, cid="b3")
d.badge(49, 50, "4", size=26, cid="b4")

# ---- arrows -----------------------------------------------------------------
# AnyCompany -> users (magenta structural connectors, no arrowhead)
edge("anyco", "maria", color=MAGENTA, width=3, sx=1, sy=0.2, tx=0, ty=1)
edge("anyco", "john", color=MAGENTA, width=3, sx=1, sy=0.8, tx=0, ty=0.3)

# 1  CreateRole : badge1 -> DevOnlyRole
edge("b1", "role", sx=1, sy=0.5, tx=0, ty=0.5)
# 2  AssumeRole : badge2 -> STS
edge("b2", "sts", sx=1, sy=0.5, tx=0, ty=0.5)
# 3  STS issues temp creds, returned to María : key -> María (arrow points left)
edge("creds", "maria", sx=0, sy=0.5, tx=1, ty=0.4)
# 4  María uses temp creds against John's S3 bucket (dashed, routed across the top)
edge("maria", "s3", dashed=True, sx=0.5, sy=0, tx=0.5, ty=0,
     points=[(229, 38), (84, 38)])

res = d.save("m02-cross-account-assumerole")
print("built:", res.get("src"), "\nweb  :", res.get("web_png"))
print("cmp  :", compare("m02-cross-account-assumerole"))
