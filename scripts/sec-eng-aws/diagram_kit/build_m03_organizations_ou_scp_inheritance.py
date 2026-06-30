"""m03-organizations-ou-scp-inheritance ("AWS Organizations design example") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). SCPs attached at the organization root are
inherited down the hierarchy: root management account -> OU A/B/C -> nested OUs -> member
accounts. A red dashed "organization-level boundary" wraps the OU A subtree; red SCP
checklists at each tier show inheritance. Official AWS Organizations icons (OU, account,
management account, org logo).
"""
from aws_style import Diagram, P

RED = "#C7253E"
MAG = "#C2268C"
WIRE = "#5A6470"
ORG = "Arch_AWS-Organizations_48.svg"
OU = "Res_AWS-Organizations_Organizational-Unit_48.svg"
ACCT = "Res_AWS-Organizations_Account_48.svg"
MGMT = "Res_AWS-Organizations_Management-Account_48.svg"

d = Diagram("", width=1000, height=562)
d.text(36, 18, 940, 44, "AWS Organizations design example", size=30, bold=True)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 70, 900, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def wire(cid, pts, color=WIRE, w=2, dashed=False, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=4 4;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};{dash}" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def scp(cid, x, y, w=32, h=42):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;", x, y, w, h)
    cx = x + w * 0.28
    sc = h / 42.0
    for ry in (y + 10 * sc, y + 22 * sc):
        seg(f"{cid}a{int(ry)}", cx, ry, cx + 4 * sc, ry + 4 * sc)
        seg(f"{cid}b{int(ry)}", cx + 4 * sc, ry + 4 * sc, cx + 12 * sc, ry - 5 * sc)
    rx = y + 33 * sc
    seg(f"{cid}x1", cx, rx - 4 * sc, cx + 11 * sc, rx + 5 * sc)
    seg(f"{cid}x2", cx + 11 * sc, rx - 4 * sc, cx, rx + 5 * sc)


# ---- outer AWS Organizations box --------------------------------------------
d._cell("orgbox", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;",
        70, 110, 905, 420)
d.svg_icon("orgchip", 84, 124, 42, 42, ORG, "")
d.text(134, 126, 200, 24, "AWS Organizations", size=17, align="left")
d.text(210, 156, 320, 24, "Organization-level boundary", size=17, align="left")

# ---- management account + tree to OU A/B/C ----------------------------------
d.svg_icon("mgmt", 560, 122, 46, 46, MGMT, "")
d.text(614, 120, 250, 44, "Organization root\nmanagement account", size=15, align="left")
d.svg_icon("ouA", 300, 244, 50, 46, OU, "")
d.text(356, 256, 70, 24, "OU A", size=16, align="left")
d.svg_icon("ouB", 560, 244, 50, 46, OU, "")
d.text(616, 256, 70, 24, "OU B", size=16, align="left")
d.svg_icon("ouC", 800, 244, 50, 46, OU, "")
d.text(856, 256, 70, 24, "OU C", size=16, align="left")
# root -> bus -> OUs
wire("t0", [(583, 168), (583, 212)], head="none")
wire("tbus", [(325, 212), (825, 212)], head="none")
wire("tA", [(325, 212), (325, 244)])
wire("tB", [(585, 212), (585, 244)])
wire("tC", [(825, 212), (825, 244)])

# ---- org-level SCP -> OU A ---------------------------------------------------
scp("scp0", 205, 230, 36, 48)
d.text(132, 286, 250, 40, "SCPs are inherited by OUs\nand member accounts", size=14, align="left")
wire("scp0a", [(243, 254), (300, 266)])

# ---- red dashed organization-level boundary ---------------------------------
d._cell("bound", f"rounded=0;html=1;fillColor=none;strokeColor={RED};strokeWidth=2.5;"
        "dashed=1;dashPattern=8 5;", 112, 200, 360, 308)

# ---- Nested OUs band --------------------------------------------------------
d._cell("nband", "rounded=1;arcSize=6;html=1;fillColor=#F3ECFB;strokeColor=#9AA1A9;"
        "strokeWidth=1;dashed=1;dashPattern=4 3;", 200, 352, 720, 92)
d.text(928, 384, 80, 40, "Nested\nOUs", size=16, align="left")
nested = {"A": [305, 405], "B": [525, 585, 645], "C": [765, 825, 885]}
parent_cx = {"A": 325, "B": 585, "C": 825}
for grp, xs in nested.items():
    for i, cx in enumerate(xs):
        d.svg_icon(f"n{grp}{i}", cx - 22, 368, 44, 40, OU, "")
    # parent OU down to a local bus, then to each nested OU
    wire(f"nb{grp}", [(min(xs), 345), (max(xs), 345)], head="none")
    wire(f"np{grp}", [(parent_cx[grp], 292), (parent_cx[grp], 345)], head="none")
    for i, cx in enumerate(xs):
        wire(f"nd{grp}{i}", [(cx, 345), (cx, 368)])
scp("scpN", 214, 372, 26, 34)
wire("scpNa", [(240, 388), (282, 388)], color=RED, dashed=True)

# ---- Member accounts band ---------------------------------------------------
d._cell("mband", "rounded=1;arcSize=6;html=1;fillColor=#E6F4F1;strokeColor=#9AA1A9;"
        "strokeWidth=1;dashed=1;dashPattern=4 3;", 200, 458, 720, 72)
d.text(928, 486, 110, 40, "Member\naccounts", size=16, align="left")
accts = [300, 400, 500]
for i, cx in enumerate(accts):
    d.svg_icon(f"acct{i}", cx - 20, 470, 40, 40, ACCT, "")
# OU A's two nested OUs feed the three member accounts
wire("mb", [(300, 452), (500, 452)], head="none")
wire("mp1", [(305, 408), (305, 452)], head="none")
wire("mp2", [(405, 408), (405, 452)], head="none")
for i, cx in enumerate(accts):
    wire(f"md{i}", [(cx, 452), (cx, 470)])
scp("scpM", 214, 474, 26, 34)
wire("scpMa", [(240, 490), (280, 490)], color=RED, dashed=True)

res = d.save("m03-organizations-ou-scp-inheritance")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-organizations-ou-scp-inheritance"))
