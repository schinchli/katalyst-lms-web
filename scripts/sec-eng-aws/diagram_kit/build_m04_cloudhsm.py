"""m04-cloudhsm ("Using CloudHSM") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). The AWS Management Console and AWS CLI manage
CloudHSM (1); your applications use it for crypto operations (2); and CloudHSM activity is
logged to Amazon CloudWatch and CloudTrail (3). Official CloudHSM / CloudWatch / CloudTrail /
gear icons; console / CLI / app glyphs drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
BADGE = "#330066"
HSM = "Arch_AWS-CloudHSM_48.svg"
CW = "Arch_Amazon-CloudWatch_48.svg"
CT = "Arch_AWS-CloudTrail_48.svg"
GEAR = "Res_Gear_48_Light.svg"

d = Diagram("Using CloudHSM", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 360, 4)


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={BADGE};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=15;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 32, 32, n)


def arrow(cid, pts, color=PURPLE, w=4, head="classic", both=False):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    start = "classic" if both else "none"
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow={start};startSize=6;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def window(cid, x, y, w=70, h=58):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2.5;", x, y, w, h)
    d._cell(cid + "bar", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=1.5;", x, y, w, 12)
    for i in range(3):
        d._cell(f"{cid}d{i}", f"ellipse;html=1;fillColor={INK};strokeColor=none;", x + 6 + i * 7, y + 4, 4, 4)


def appglyph(cid, x, y):
    pos = [(0, 0), (1, 0), (0, 1), (1, 1)]
    labels = ["O", "DB", "T", "@"]
    for i, (gx, gy) in enumerate(pos):
        d._cell(f"{cid}{i}", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=2;"
                f"fontColor={INK};fontSize=14;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
                x + gx * 40, y + gy * 40, 36, 36, labels[i])


# ---- left: Console + CLI ----------------------------------------------------
window("con", 196, 150)
d.svg_icon("congear", 210, 160, 42, 42, GEAR, "")
d.text(150, 214, 200, 48, "AWS Management\nConsole", size=18, align="center")
window("cli", 196, 320)
d.text(212, 342, 40, 24, ">_", size=18, bold=True, align="left")
d.text(140, 384, 220, 48, "AWS Command Line\nInterface (AWS CLI)", size=18, align="center")
arrow("br1", [(266, 178), (360, 178), (360, 210)], head="none")
arrow("br2", [(266, 348), (360, 348), (360, 226)], head="none")
badge("b1", 344, 202, "1")
arrow("toHSM", [(380, 218), (478, 218)])

# ---- CloudHSM ---------------------------------------------------------------
d.text(486, 150, 160, 24, "CloudHSM", size=18, align="center")
d.svg_icon("hsm", 502, 186, 64, 64, HSM, "")

# ---- Your applications ------------------------------------------------------
appglyph("apps", 494, 384)
d.text(454, 470, 160, 24, "Your applications", size=18, align="center")
arrow("s2", [(534, 384), (534, 256)], both=True)
badge("b2", 518, 300, "2")

# ---- CloudWatch + CloudTrail (logging) --------------------------------------
arrow("hsm2log", [(566, 218), (640, 218)])
badge("b3", 636, 202, "3")
arrow("toCW", [(668, 210), (812, 200)])
arrow("toCT", [(668, 226), (668, 360), (812, 360)])
d.svg_icon("cw", 820, 168, 60, 60, CW, "")
d.text(786, 232, 200, 24, "Amazon CloudWatch", size=18, align="center")
d.svg_icon("ct", 820, 330, 60, 60, CT, "")
d.text(800, 394, 160, 24, "CloudTrail", size=18, align="center")

res = d.save("m04-cloudhsm")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m04-cloudhsm"))
