"""m02-iam-security-evaluation-flow ("IAM components and flow") — pixel-faithful recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Inside the AWS Cloud, User/Group/Role plus
attached policies (AWS managed / customer-managed / inline) feed Identity-based permissions;
together with Resource-based permissions they flow into Additional security controls within a
service. A pink dashed boundary groups the identity elements; a tall purple arrow on the left
marks the logical flow of security evaluation. Official AWS icons: IAM, user, users, role.
"""
from aws_style import Diagram, P

MAROON = "#6B1E4E"
VIOLET = "#7B61FF"
PINK = "#D81B60"
RED = "#C7253E"
IAM = "Arch_AWS-Identity-and-Access-Management_48.svg"
ROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"

d = Diagram("IAM components and flow", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 540, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def checklist(cid, x, y):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;",
            x, y, 32, 42)
    cx = x + 9
    for ry in (y + 10, y + 22):
        seg(f"{cid}a{ry}", cx, ry, cx + 4, ry + 4)
        seg(f"{cid}b{ry}", cx + 4, ry + 4, cx + 12, ry - 5)
    rx = y + 33
    seg(f"{cid}x1", cx, rx - 4, cx + 11, rx + 5)
    seg(f"{cid}x2", cx + 11, rx - 4, cx, rx + 5)


def fat_arrow(cid, x, y, w, h, direction):
    d._cell(cid, f"shape=singleArrow;direction={direction};html=1;fillColor={VIOLET};"
            "strokeColor=none;arrowWidth=0.6;arrowHead=0.55;", x, y, w, h)


# ---- left: logical-flow arrow + rotated label -------------------------------
fat_arrow("flow", 102, 150, 30, 372, "south")
d._cell("flowlbl", "text;html=1;horizontal=0;align=center;verticalAlign=middle;fontSize=18;"
        "fontFamily=Amazon Ember;fontColor=#232F3E;", 52, 180, 40, 320,
        "Logical flow of security evaluation")

# ---- AWS Cloud box ----------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;",
        158, 138, 822, 384)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 170, 150, 30, 24, "aws")
d.text(206, 150, 130, 24, "AWS Cloud", size=15)

# ---- pink dashed boundary (groups identity elements) ------------------------
d._cell("dash", f"rounded=1;arcSize=8;html=1;fillColor=none;strokeColor={PINK};strokeWidth=3;"
        "dashed=1;dashPattern=8 5;", 330, 162, 634, 272)

# ---- AWS IAM icon + label ---------------------------------------------------
d.svg_icon("iam", 300, 176, 52, 52, IAM, "")
d._cell("iamlbl", "rounded=0;html=1;fillColor=#FFFFFF;strokeColor=#C9C9C9;strokeWidth=1;"
        "fontColor=#232F3E;fontStyle=1;fontSize=13;fontFamily=Amazon Ember;align=center;",
        292, 232, 70, 44, "AWS\nIAM")

# ---- User / Group / Role + down arrows --------------------------------------
d.text(366, 158, 90, 24, "User", size=16, align="center")
d.svg_icon("user", 388, 184, 48, 48, "user", "")
d.text(450, 158, 90, 24, "Group", size=16, align="center")
d.svg_icon("group", 466, 186, 56, 46, "users", "")
d.text(540, 158, 90, 24, "Role", size=16, align="center")
d.svg_icon("role", 558, 184, 48, 48, ROLE, "")
fat_arrow("d_user", 400, 244, 24, 36, "south")
fat_arrow("d_group", 482, 244, 24, 36, "south")
fat_arrow("d_role", 570, 244, 24, 36, "south")

# ---- middle row: resource + identity permission boxes -----------------------
d._cell("resperm", f"rounded=1;arcSize=14;html=1;fillColor=#FFFFFF;strokeColor={MAROON};"
        "strokeWidth=3;fontColor=#232F3E;fontSize=14;fontFamily=Amazon Ember;align=center;"
        "verticalAlign=middle;", 184, 296, 148, 86, "Resource-based\npermissions")
d.text(330, 318, 36, 42, "+", size=34, bold=True, color="#7D8998", align="center")
d._cell("idperm", f"rounded=1;arcSize=14;html=1;fillColor=#FFFFFF;strokeColor={MAROON};"
        "strokeWidth=3;fontColor=#232F3E;fontSize=19;fontFamily=Amazon Ember;align=center;"
        "verticalAlign=middle;", 372, 296, 350, 86, "Identity-based permissions")

# ---- policy + managed/customer/inline (right) -------------------------------
d.text(730, 300, 70, 24, "Policy", size=16, align="left")
checklist("polchk", 742, 326)
d.text(810, 286, 150, 110,
       "AWS\nmanaged\n‑‑‑‑‑‑‑‑\nCustomer‑\nmanaged\n‑‑‑‑‑‑‑‑\nInline", size=13, align="left")
fat_arrow("p_arrow", 716, 326, 28, 24, "west")

# ---- down arrows to the bottom box ------------------------------------------
fat_arrow("d_res", 232, 384, 26, 40, "south")
fat_arrow("d_id", 520, 384, 26, 40, "south")

# ---- bottom: additional security controls -----------------------------------
d._cell("addsec", f"rounded=1;arcSize=12;html=1;fillColor=#FFFFFF;strokeColor={VIOLET};"
        "strokeWidth=3;fontColor=#232F3E;fontSize=20;fontFamily=Amazon Ember;align=center;"
        "verticalAlign=middle;", 184, 430, 624, 72, "Additional security controls within a service")

res = d.save("m02-iam-security-evaluation-flow")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m02-iam-security-evaluation-flow"))
