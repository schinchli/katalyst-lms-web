"""m02-permissions-boundary-effective — the "effective permissions" concept graphic from
the "Policy types (1 of 2)" slide (right column). The slide's three-column text is section
narration (lives in the notes body); the *diagram* is the intersection visual:

    effective permissions = identity-based policy  ∩  permissions boundary

Recreated centred/enlarged (not pixel-mapped to the slide, which is mostly text) so it
stands alone on the notes page. Two overlapping rounded rectangles; their intersection is a
dark checklist (the effective permissions), with an arrow labelled "Effective permissions".
"""
from aws_style import Diagram, P

IDENT = "#4A1A6B"      # identity-based policy box border (dark indigo)
BOUND = "#8C1060"      # permissions boundary box border (maroon)
OVER = "#6A1B5A"       # overlap fill (dark magenta)
OVER2 = "#3F1238"      # overlap gradient bottom
ARROW = "#2E1A6B"      # effective-permissions arrow

d = Diagram("Effective permissions", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 360, 4)


def seg(cid, pts, color, w=6):
    """Polyline (check mark) from a list of points."""
    arr = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=1;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{arr}</Array></mxGeometry></mxCell>')


def check(cid, x, y, color, s=1.0, w=6):
    """A bold check mark anchored at top-left, scaled by s."""
    seg(cid, [(x, y + 12 * s), (x + 9 * s, y + 22 * s), (x + 26 * s, y - 4 * s)], color, w)


# ---- two overlapping policy rectangles --------------------------------------
# permissions boundary (lower-left), drawn first so the overlap square sits on top
d._cell("bound", f"rounded=1;arcSize=10;html=1;fillColor=#FFFFFF;strokeColor={BOUND};"
        "strokeWidth=3;", 290, 250, 380, 220)
d.text(304, 408, 170, 44, "Permissions\nboundary", size=18, align="left")
# identity-based policy (upper-right)
d._cell("ident", f"rounded=1;arcSize=10;html=1;fillColor=#FFFFFF;strokeColor={IDENT};"
        "strokeWidth=3;", 470, 120, 380, 220)
d.text(636, 134, 200, 44, "Identity-based\npolicy", size=18, align="left")

# ---- intersection: the effective-permissions checklist ----------------------
d._cell("overlap", f"rounded=1;arcSize=14;html=1;fillColor={OVER};gradientColor={OVER2};"
        "gradientDirection=south;strokeColor=none;", 486, 196, 150, 210)
# three white checks inside the overlap
check("ov1", 520, 232, "#FFFFFF", s=1.1, w=8)
check("ov2", 520, 286, "#FFFFFF", s=1.1, w=8)
check("ov3", 520, 340, "#FFFFFF", s=1.1, w=8)

# black checks: one in the identity box (top), one in the boundary box (bottom)
check("id_chk", 690, 168, "#111111", s=1.1, w=8)
check("bd_chk", 540, 372, "#111111", s=1.1, w=8)

# ---- effective-permissions arrow + label ------------------------------------
d.cells.append(
    '<mxCell id="effarrow" style="endArrow=open;endSize=14;startArrow=none;html=1;'
    f'rounded=0;strokeColor={ARROW};strokeWidth=4;" edge="1" parent="1">'
    '<mxGeometry relative="1" as="geometry">'
    '<mxPoint x="858" y="320" as="sourcePoint"/>'
    '<mxPoint x="642" y="320" as="targetPoint"/></mxGeometry></mxCell>')
d.text(648, 414, 240, 26, "Effective permissions", size=17, bold=True, color="#6B2FA0")

res = d.save("m02-permissions-boundary-effective")
print("built:", res.get("src"))
