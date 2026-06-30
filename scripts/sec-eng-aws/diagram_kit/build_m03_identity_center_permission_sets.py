"""m03-identity-center-permission-sets ("AWS access through permission sets") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Permission set 1 (assigned to users A & B)
and permission set 2 (assigned to user B only) each bundle policies; in the AWS access portal
they surface as roles. User A sees one role; user B sees both but assumes one at a time.
Official IAM Identity Center icon; red checklist + role-hat glyphs.
"""
from aws_style import Diagram, P

INK = "#232F3E"
RED = "#C7253E"
WIRE = "#3B4654"
PURPLE = "#6A1B9A"
IIC = "Arch_AWS-IAM-Identity-Center_32.svg"
ROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"

d = Diagram("AWS access through permission sets", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 700, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=2.5):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def checklist(cid, x, y):
    w, h = 28, 36
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=2.5;", x, y, w, h)
    cx = x + 8
    for ry in (y + 8, y + 18):
        seg(f"{cid}a{ry}", cx, ry, cx + 3, ry + 3)
        seg(f"{cid}b{ry}", cx + 3, ry + 3, cx + 10, ry - 4)
    rx = y + 28
    seg(f"{cid}x1", cx, rx - 4, cx + 9, rx + 4)
    seg(f"{cid}x2", cx + 9, rx - 4, cx, rx + 4)


def wire(cid, pts, color=WIRE, w=2, head="block", dashed=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=6 4;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};{dash}" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- Permission set 1 -------------------------------------------------------
d.text(150, 134, 240, 24, "Permission set 1", size=17, bold=True)
d._cell("ps1", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 150, 158, 350, 158)
d.svg_icon("iic1", 118, 204, 54, 54, IIC, "")
d.text(14, 210, 106, 48, "Assigned to\nuser A and B", size=15, bold=True, color=PURPLE, align="center")
d.text(280, 170, 120, 24, "Policies", size=16, align="center")
checklist("p1a", 286, 204)
d.text(252, 244, 100, 40, "AWS\nmanaged", size=14, align="center")
checklist("p1b", 376, 204)
d.text(342, 244, 100, 40, "AWS\nmanaged", size=14, align="center")

# ---- Permission set 2 -------------------------------------------------------
d.text(150, 338, 240, 24, "Permission set 2", size=17, bold=True)
d._cell("ps2", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;"
        "dashed=1;dashPattern=4 4;", 150, 362, 350, 158)
d.svg_icon("iic2", 118, 408, 54, 54, IIC, "")
d.text(20, 414, 106, 48, "Assigned to\nuser B only", size=15, bold=True, color=PURPLE, align="center")
d.text(280, 374, 120, 24, "Policies", size=16, align="center")
checklist("p2a", 256, 408)
d.text(222, 448, 100, 40, "AWS\nmanaged", size=14, align="center")
checklist("p2b", 336, 408)
d.text(302, 448, 100, 40, "AWS\nmanaged", size=14, align="center")
checklist("p2c", 416, 408)
d.text(384, 448, 100, 24, "Custom", size=14, align="center")

# ---- AWS access portal ------------------------------------------------------
d._cell("portal", "rounded=0;html=1;fillColor=none;strokeColor=#C7253E;strokeWidth=2;", 520, 150, 272, 380)
d.svg_icon("pchip", 532, 160, 30, 30, IIC, "")
d.text(572, 162, 200, 26, "AWS access portal", size=16, align="left")
d.text(556, 200, 200, 44, "Database\nadministrators", size=16, align="center")
d.svg_icon("role1", 628, 250, 54, 46, ROLE, "")
d.text(556, 300, 200, 44, "Role from\npermission set 1", size=16, align="center")
d.svg_icon("role2", 628, 398, 54, 46, ROLE, "")
d.text(556, 448, 200, 44, "Role from\npermission set 2", size=16, align="center")

# ---- users ------------------------------------------------------------------
d.text(800, 174, 90, 24, "User A", size=16, bold=True, align="left")
d.svg_icon("userA", 822, 198, 50, 50, "user", "")
d.text(880, 206, 116, 44, "Can only see\none role", size=16, align="left")
d.text(800, 358, 90, 24, "User B", size=16, bold=True, align="left")
d.svg_icon("userB", 822, 382, 50, 50, "user", "")
d.text(880, 378, 120, 66, "Can see both roles\nbut only choose\none at a time", size=16, align="left")

# ---- mappings ---------------------------------------------------------------
wire("ps1role", [(500, 240), (626, 268)])                        # PS1 -> role 1
wire("ps2role", [(500, 438), (626, 418)])                        # PS2 -> role 2
wire("uaRole1", [(820, 244), (686, 268)], dashed=True)           # User A -> role 1
wire("ubRole1", [(820, 400), (686, 288)], dashed=True)           # User B -> role 1
wire("ubRole2", [(820, 410), (686, 418)], dashed=True)           # User B -> role 2

res = d.save("m03-identity-center-permission-sets")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-identity-center-permission-sets"))
