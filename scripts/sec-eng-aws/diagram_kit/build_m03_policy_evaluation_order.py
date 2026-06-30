"""m03-policy-evaluation-order ("Evaluation of SCPs") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). An explicit Deny is evaluated first, then
the policy-precedence chevron runs: Organizations SCPs -> Resource-based policies ->
Identity-based policies -> IAM permission boundaries -> Session policies.
"""
from aws_style import Diagram, P

CHEV = "#3A0F66"
PURPLE = "#330066"

d = Diagram("Evaluation of SCPs", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 420, 4)

# ---- Deny evaluation diamond + down arrow -----------------------------------
d._cell("deny", "rhombus;whiteSpace=wrap;html=1;fillColor=#E6D9F5;strokeColor=#6A1B9A;"
        "strokeWidth=2;fontColor=#232F3E;fontStyle=1;fontSize=20;fontFamily=Amazon Ember;",
        66, 104, 248, 168, "Deny\nevaluation")
d.cells.append(
    f'<mxCell id="denyarr" style="endArrow=block;endSize=4;html=1;rounded=0;'
    f'strokeColor={PURPLE};strokeWidth=5;" edge="1" parent="1">'
    '<mxGeometry relative="1" as="geometry">'
    '<mxPoint x="190" y="272" as="sourcePoint"/>'
    '<mxPoint x="190" y="322" as="targetPoint"/></mxGeometry></mxCell>')

# ---- policy-precedence chevron band -----------------------------------------
segs = [
    ("Organizations\nSCPs", 70, 196),
    ("Resource-\nbased\npolicies", 246, 190),
    ("Identity-\nbased\npolicies", 416, 190),
    ("IAM\npermission\nboundaries", 586, 200),
    ("Session\npolicies", 766, 200),
]
for i, (label, x, w) in enumerate(segs):
    d._cell(f"seg{i}", "shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;"
            f"size=22;fillColor={CHEV};strokeColor=#FFFFFF;strokeWidth=2;fontColor=#FFFFFF;"
            "fontSize=17;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, 324, w, 100, label)

res = d.save("m03-policy-evaluation-order")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-policy-evaluation-order"))
