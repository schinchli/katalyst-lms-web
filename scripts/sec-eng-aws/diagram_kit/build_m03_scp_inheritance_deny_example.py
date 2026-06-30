"""m03-scp-inheritance-deny-example ("Service control policies") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). The default SCP (FullAWSAccess) attached at
the ROOT OU is inherited by OU 1 and OU 2. OU 1 keeps the default state (nothing attached);
OU 2 also has Deny_DeleteLogs attached, so log-deletion actions are denied. Official AWS
Organizations OU icons; JSON policy bodies shown as monospace.
"""
from aws_style import Diagram, P

RED = "#C7253E"
PURPLE = "#330066"
MAG = "#C2185B"
DEEP = "#4A148C"
MONO = "Courier New"
OU = "Res_AWS-Organizations_Organizational-Unit_48.svg"

d = Diagram("Service control policies", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 470, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def wire(cid, pts, color=PURPLE, w=4, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def checklist(cid, x, y, w=38, h=48):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;", x, y, w, h)
    cx = x + w * 0.26
    sc = h / 48.0
    for ry in (y + 12 * sc, y + 24 * sc):
        seg(f"{cid}a{int(ry)}", cx, ry, cx + 5 * sc, ry + 5 * sc)
        seg(f"{cid}b{int(ry)}", cx + 5 * sc, ry + 5 * sc, cx + 14 * sc, ry - 6 * sc)
    rx = y + 38 * sc
    seg(f"{cid}x1", cx, rx - 5 * sc, cx + 13 * sc, rx + 6 * sc)
    seg(f"{cid}x2", cx + 13 * sc, rx - 5 * sc, cx, rx + 6 * sc)


def code(cid, x, y, w, h, text, size=13):
    text = text.replace(" ", chr(160))
    d._cell(cid, f"rounded=0;whiteSpace=pre;html=1;fillColor=none;strokeColor=none;align=left;"
            f"verticalAlign=top;fontColor=#26124A;fontSize={size};fontFamily={MONO};"
            "spacingLeft=4;spacingTop=2;", x, y, w, h, text)


# ---- Default SCP (top-left) -> ROOT OU --------------------------------------
d.text(66, 112, 420, 26, "Default SCP: FullAWSAccess", size=18, bold=True)
d._cell("scpbox", "rounded=0;html=1;fillColor=#ECECEC;strokeColor=#C9C9C9;strokeWidth=1;",
        66, 148, 300, 126)
code("scpjson", 78, 158, 200, 110,
     '{\n  "Effect": "Allow",\n  "Action": "*",\n  "Resource": "*"\n}', size=15)
checklist("scpchk", 286, 176, 38, 48)
wire("toroot", [(366, 210), (536, 156)])

# ---- ROOT OU + tree ---------------------------------------------------------
d.text(514, 88, 140, 24, "ROOT OU", size=16, bold=True)
d.svg_icon("root", 540, 114, 54, 50, OU, "")
d.svg_icon("ou1", 380, 232, 50, 46, OU, "")
d.text(312, 246, 64, 24, "OU 1", size=16, bold=True)
d.svg_icon("ou2", 740, 232, 50, 46, OU, "")
d.text(798, 246, 64, 24, "OU 2", size=16, bold=True)
wire("r0", [(567, 164), (567, 210)], head="none")
wire("rbus", [(405, 210), (765, 210)], head="none")
wire("rA", [(405, 210), (405, 232)])
wire("rC", [(765, 210), (765, 232)])

# ---- OU 1 state (teal, default) ---------------------------------------------
d._cell("box1", "rounded=0;html=1;fillColor=#E0F2F1;strokeColor=none;", 58, 296, 424, 240)
d.text(76, 312, 400, 24, "Inherited: FullAWSAccess", size=17, bold=True, color=MAG)
d.text(76, 340, 400, 24, "Attached: None", size=17, bold=True, color=DEEP)
d._cell("def", "text;html=1;align=left;verticalAlign=middle;fontSize=16;fontStyle=2;"
        "fontFamily=Amazon Ember;fontColor=#333333;", 76, 498, 200, 26, "Default state")

# ---- OU 2 state (gray, Deny_DeleteLogs) -------------------------------------
d._cell("box2", "rounded=0;html=1;fillColor=#ECECEC;strokeColor=none;", 558, 296, 424, 240)
d.text(576, 312, 400, 24, "Inherited: FullAWSAccess", size=17, bold=True, color=MAG)
d.text(576, 340, 400, 24, "Attached: Deny_DeleteLogs", size=17, bold=True, color=DEEP)
code("denyjson", 576, 374, 404, 156,
     '{\n  "Effect": "Deny",\n  "Action": [\n      "ec2:DeleteFlowLogs",\n'
     '      "logs:DeleteLogGroup",\n      "logs:DeleteLogStream" ]\n  "Resource": "*"\n}', size=14)

# ---- highlight star (near OU 2) ---------------------------------------------
d._cell("star", "shape=mxgraph.basic.star;html=1;fillColor=#FFD400;strokeColor=#E53935;"
        "strokeWidth=2;", 916, 268, 74, 74)

res = d.save("m03-scp-inheritance-deny-example")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-scp-inheritance-deny-example"))
