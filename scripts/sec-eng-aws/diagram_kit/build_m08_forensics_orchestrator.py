"""m08-forensics-orchestrator ("AWS solutions: Automated Forensics Orchestrator for Amazon EC2").

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A title panel (purple->magenta gradient with a
lightbulb) plus bullets: the solution is activated from Security Hub via a custom action, and AWS
Step Functions performs forensic triaging, acquisition, and investigation. Title/text slide;
drawn lightbulb, no AWS service icons.
"""
from aws_style import Diagram, P

INK = "#1A2B3C"
PINK = "#F2789F"
ORANGE = "#F5A05A"

# title lives inside the left panel, so suppress the auto-rendered top heading
d = Diagram("", width=1000, height=562)


def seg(cid, x1, y1, x2, y2, color, w=4):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;html=1;rounded=1;strokeColor={color};strokeWidth={w};" '
        f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/><mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


# ---- left title panel -------------------------------------------------------
d._cell("panel", "rounded=0;html=1;fillColor=#4A2A8C;gradientColor=#C13A9C;gradientDirection=east;strokeColor=none;", 0, 0, 372, 562)
d.text(20, 56, 332, 260, "<b>AWS solutions:</b>\n<b>Automated</b>\n<b>Forensics</b>\n<b>Orchestrator for</b>\n<b>Amazon EC2</b>",
       size=24, color="#FFFFFF", align="center")

# lightbulb (white outline) + colored rays
d._cell("bulb", "ellipse;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=4;", 148, 326, 76, 76)
d._cell("neck", "rounded=0;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=4;", 168, 398, 36, 26)
seg("th1", 170, 410, 202, 410, "#FFFFFF", 3)
seg("th2", 172, 420, 200, 420, "#FFFFFF", 3)
seg("filv", 186, 360, 186, 398, "#FFFFFF", 4)
seg("filh", 172, 372, 200, 372, "#FFFFFF", 4)
rays = [(186, 300, 186, 318, PINK), (240, 318, 252, 306, ORANGE), (262, 364, 282, 364, ORANGE),
        (240, 410, 252, 422, ORANGE), (132, 318, 120, 306, PINK), (110, 364, 90, 364, PINK),
        (132, 410, 120, 422, PINK), (228, 340, 244, 330, ORANGE)]
for i, (x1, y1, x2, y2, c) in enumerate(rays):
    seg(f"ray{i}", x1, y1, x2, y2, c, 4)

# ---- right bullets ----------------------------------------------------------
d.text(404, 64, 580, 90, "•  This solution is activated from Security\n    Hub through a custom action.", size=23, color=INK, align="left")
d.text(404, 180, 580, 90, "•  AWS Step Functions performs the\n    following operations:", size=23, color=INK, align="left")
subs = [(300, "Forensic triaging"), (360, "Forensic acquisition"), (420, "Forensic investigation")]
for y, t in subs:
    d.text(440, y, 24, 30, "•", size=20, color=INK, align="left")
    d.text(470, y, 460, 30, t, size=21, color=INK, align="left")

res = d.save("m08-forensics-orchestrator")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m08-forensics-orchestrator"))
