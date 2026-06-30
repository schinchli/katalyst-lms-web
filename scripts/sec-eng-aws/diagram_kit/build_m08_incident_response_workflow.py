"""m08-incident-response-workflow ("Incident response workflows") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A gray block arrow carries five sequential
incident-response stages: Establish control -> Determine impact -> Recover as needed ->
Investigate root cause -> Improve. Conceptual slide; drawn shapes, no AWS service icons.
"""
from aws_style import Diagram, P

PURPLE = "#3D1566"
GRAY = "#D4D1DC"

d = Diagram("Incident response workflows", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 96, 920, 4)

# ---- gray block arrow -------------------------------------------------------
d._cell("arrow", f"shape=singleArrow;direction=east;arrowWidth=0.74;arrowSize=0.26;html=1;"
        f"fillColor={GRAY};strokeColor=none;", 118, 160, 844, 248)

# ---- five stage boxes -------------------------------------------------------
stages = [
    (132, "Establish\ncontrol"),
    (290, "Determine\nimpact"),
    (448, "Recover as\nneeded"),
    (606, "Investigate\nroot cause"),
    (766, "Improve"),
]
for i, (x, label) in enumerate(stages):
    d._cell(f"s{i}", f"rounded=1;arcSize=16;html=1;fillColor={PURPLE};strokeColor=none;"
            "fontColor=#FFFFFF;fontStyle=1;fontSize=20;fontFamily=Amazon Ember;"
            "align=center;verticalAlign=middle;whiteSpace=wrap;", x, 209, 150, 150, label)

res = d.save("m08-incident-response-workflow")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m08-incident-response-workflow"))
