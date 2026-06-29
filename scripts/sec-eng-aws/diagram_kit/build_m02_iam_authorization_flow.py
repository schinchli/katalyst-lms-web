"""m02-iam-authorization-flow ("Granting access review") — pixel-faithful recreation.

Canvas 1000x562. Measured from slides/m02-iam-authorization-flow.png (2001x1125, ~x0.5).
A staircase: User -> Authentication -> access-request document, then magenta ribbon arrows
cascade down through four evaluation bands: Authorization (identity- & resource-based
policies) -> Actions/operations -> Resources -> Effect (ALLOW / DENY).
Official AWS icons for EC2 / IAM role / S3; the credential-keys glyph is drawn (no sprite).
"""
from aws_style import Diagram, P

RED = "#C7253E"
PURPLE = "#6B1E66"     # top-row block arrows
MAGENTA = "#C2268C"    # big cascade ribbon arrows
BAND = "#9AA1A9"
ROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"
S3 = "Arch_Amazon-Simple-Storage-Service_48.svg"

d = Diagram("Granting access review", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 460, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def checklist(cid, x, y):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;",
            x, y, 30, 40)
    cx = x + 9
    for ry in (y + 9, y + 20):
        seg(f"{cid}a{ry}", cx, ry, cx + 4, ry + 4)
        seg(f"{cid}b{ry}", cx + 4, ry + 4, cx + 11, ry - 4)
    rx = y + 31
    seg(f"{cid}x1", cx, rx - 4, cx + 10, rx + 5)
    seg(f"{cid}x2", cx + 10, rx - 4, cx, rx + 5)


def key(cid, x, y, color=RED):
    """small key glyph: ring + shaft + two teeth."""
    d._cell(cid + "r", f"ellipse;html=1;fillColor=none;strokeColor={color};strokeWidth=3;",
            x, y, 14, 14)
    d._cell(cid + "s", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 13, y + 5, 22, 3)
    d._cell(cid + "t1", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 29, y + 8, 3, 6)
    d._cell(cid + "t2", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 34, y + 8, 3, 6)


def block_arrow(cid, x, y):
    d._cell(cid, f"shape=singleArrow;html=1;fillColor={PURPLE};strokeColor=none;"
            "arrowWidth=0.55;arrowHead=0.6;", x, y, 44, 22)


def ribbon(cid, x1, y1, x2, y2, bow):
    """thick magenta cascade arrow: out to `bow` x, down, back left into the next band."""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=block;endSize=2.4;startArrow=none;html=1;'
        f'rounded=1;strokeColor={MAGENTA};strokeWidth=15;" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/>'
        f'<Array as="points"><mxPoint x="{bow}" y="{y1}"/><mxPoint x="{bow}" y="{y2}"/></Array>'
        f'</mxGeometry></mxCell>')


# ---- top row: User -> Authentication -> access-request doc -------------------
d.svg_icon("user", 196, 118, 50, 50, "user", "User")
block_arrow("ba1", 262, 132)
key("k1", 318, 126)
key("k2", 326, 138)
d.text(286, 176, 130, 22, "Authentication", size=15, align="center")
block_arrow("ba2", 392, 132)
d._cell("doc", "shape=note;html=1;fillColor=#FFFFFF;strokeColor=#232F3E;strokeWidth=2;size=18;"
        "verticalAlign=middle;align=center;fontColor=#232F3E;fontSize=12;fontFamily=Amazon Ember;",
        444, 92, 112, 126, "Actions\n‑‑‑‑‑\nResources\n‑‑‑‑‑\nRequest info")
d.text(566, 120, 110, 60, "Send access\nrequest", size=15, align="left")

# ---- band 1: Authorization --------------------------------------------------
d.text(64, 250, 150, 30, "Authorization", size=18, align="left")
d._cell("b1", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={BAND};strokeWidth=1;",
        232, 232, 446, 70)
checklist("cl1", 256, 248)
d.text(296, 250, 120, 40, "Identity‑\nbased policies", size=14, align="left")
checklist("cl2", 432, 248)
d.text(470, 250, 120, 40, "Resource‑\nbased policies", size=14, align="left")
d.text(626, 256, 30, 24, "...", size=20, align="left")

# ---- band 2: Actions / operations -------------------------------------------
d.text(64, 322, 220, 44, "Actions (console) or\noperations (CLI, API)", size=18, align="left")
d._cell("b2", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={BAND};strokeWidth=1;",
        290, 314, 458, 64)
d.text(312, 332, 130, 24, "RunInstances", size=15, align="left")
d.text(470, 332, 120, 24, "CreateRole", size=15, align="left")
d.text(606, 332, 130, 24, "CreateBucket", size=15, align="left")

# ---- band 3: Resources ------------------------------------------------------
d.text(296, 418, 110, 30, "Resources", size=18, align="left")
d._cell("b3", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={BAND};strokeWidth=1;",
        406, 390, 416, 72)
d.svg_icon("ec2", 428, 406, 40, 40, "ec2", "")
d.text(474, 414, 90, 24, "Instance", size=15, align="left")
d.svg_icon("role", 584, 405, 42, 42, ROLE, "")
d.text(632, 414, 60, 24, "Role", size=15, align="left")
d.svg_icon("s3", 712, 406, 40, 40, S3, "")
d.text(758, 414, 90, 24, "S3 bucket", size=15, align="left")

# ---- band 4: Effect ---------------------------------------------------------
d.text(466, 500, 90, 30, "Effect", size=18, align="left")
d._cell("b4", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={BAND};strokeWidth=1;",
        556, 478, 334, 58)
d.text(600, 494, 130, 26, "ALLOW", size=17, bold=True, align="left")
d.text(758, 494, 110, 26, "DENY", size=17, bold=True, align="left")

# ---- magenta cascade ribbons (staircase, stepping right each level) ---------
ribbon("r1", 562, 198, 680, 252, 738)
ribbon("r2", 678, 296, 750, 336, 816)
ribbon("r3", 748, 374, 824, 414, 892)
ribbon("r4", 822, 456, 892, 500, 958)

res = d.save("m02-iam-authorization-flow")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m02-iam-authorization-flow"))
