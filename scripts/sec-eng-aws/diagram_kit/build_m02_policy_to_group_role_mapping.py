"""m02-policy-to-group-role-mapping ("Customer-managed policies") — pixel-faithful
recreation of the course slide.

Canvas 1000x562 (16:9). Coordinates measured from slides/m02-policy-to-group-role-mapping.png
(2001x1125 -> scale 1000/2001 ~= 0.5). The slide's left half is the architecture; the
right-half bullet list is slide narration (lives in the app, not the diagram).

Four customer-managed policy documents (red checklist glyphs) attach to principals inside
AWS Account A: two IAM groups (Res_Users) and two IAM roles (Res_Role, red hard-hat).
Official AWS Icon-package icons for groups/roles; the policy checklist is a drawn glyph
(no AWS sprite matches the slide's red checklist card).
"""
from aws_style import Diagram, P, compare

RED = "#C7253E"        # policy checklist border + marks (measured)
ARROW = "#5A6470"      # thin gray connector arrows
INK = P.INK

d = Diagram("Customer-managed policies", width=1000, height=562)
# purple title underline
d._cell("rule", f"rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 560, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    """A bare line segment (no arrowheads) via sourcePoint/targetPoint."""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def arrow(cid, x1, y1, x2, y2, color=ARROW, w=2):
    """A thin open-headed arrow segment (policy/group connectors on the slide)."""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=open;endSize=10;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def policy(cid, x, y, label):
    """Red checklist policy card: white box + red border, two red checks + one red X,
    label centred below."""
    w, h = 40, 50
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;",
            x, y, w, h)
    rows = [y + 11, y + 25, y + 39]
    cx = x + 13
    # row 1 + 2: check marks (short down-right, long up-right)
    for ry in rows[:2]:
        seg(f"{cid}c{ry}a", cx, ry, cx + 5, ry + 5)
        seg(f"{cid}c{ry}b", cx + 5, ry + 5, cx + 14, ry - 6)
    # row 3: X mark
    rx = rows[2]
    seg(f"{cid}x1", cx, rx - 5, cx + 13, rx + 6)
    seg(f"{cid}x2", cx + 13, rx - 5, cx, rx + 6)
    d.text(x - 40, y + h + 2, w + 80, 22, label, size=14, align="center")


# ---- outer AWS Cloud box -----------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;"
        "verticalAlign=top;align=left;", 80, 118, 446, 396)
# aws logo chip + "AWS Cloud" label, top-left inside the box
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 92, 130, 30, 24, "aws")
d.text(128, 130, 150, 24, "AWS Cloud", size=15)

# ---- dashed AWS Account A box ------------------------------------------------
d._cell("acctA", "rounded=1;arcSize=6;html=1;fillColor=none;strokeColor=#232F3E;"
        "strokeWidth=1.5;dashed=1;dashPattern=4 4;", 300, 138, 124, 360)
d.text(430, 296, 92, 44, "AWS\nAccount A", size=15, align="left")

# ---- principals inside Account A --------------------------------------------
# two IAM groups (Res_Users — dark 3-person glyph)
d.svg_icon("ltdgrp", 332, 150, 56, 44, "users", "")
d.text(312, 196, 100, 38, "LtdAdmin\nGroup", size=14, align="center")
d.svg_icon("admgrp", 332, 246, 56, 44, "users", "")
d.text(312, 292, 100, 22, "Admin Group", size=14, align="center")
# two IAM roles (red hard-hat)
d.svg_icon("rbooks", 336, 322, 48, 48, "Res_AWS-Identity-Access-Management_Role_48.svg", "")
d.text(312, 372, 100, 38, "Role\nbooks-app", size=14, align="center")
d.svg_icon("rec2", 336, 412, 48, 48, "Res_AWS-Identity-Access-Management_Role_48.svg", "")
d.text(312, 462, 100, 22, "Role EC2-app", size=14, align="center")

# ---- policy checklist cards (left column) -----------------------------------
policy("p1", 134, 158, "LtdAdmin-mfa")
policy("p2", 134, 246, "AcctAdmin-mfa")
policy("p3", 134, 330, "EC2Access")
policy("p4", 134, 416, "DynamoDBAccess")

# ---- attachment arrows (policy right edge -> principal left edge) ------------
# top two map straight across
arrow("a1", 176, 178, 326, 170)   # LtdAdmin-mfa  -> LtdAdmin Group
arrow("a2", 176, 266, 326, 266)   # AcctAdmin-mfa -> Admin Group
# EC2Access -> Role books-app
arrow("a3", 176, 350, 328, 344)   # EC2Access -> books-app
# DynamoDBAccess -> Role books-app (steep) and -> Role EC2-app (shallow)
arrow("a4", 176, 440, 328, 352)   # DynamoDBAccess -> books-app
arrow("a5", 176, 452, 330, 436)   # DynamoDBAccess -> EC2-app

res = d.save("m02-policy-to-group-role-mapping")
print("built:", res.get("src"))
print("cmp  :", compare("m02-policy-to-group-role-mapping"))
