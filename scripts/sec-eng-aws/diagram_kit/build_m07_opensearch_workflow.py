"""m07-opensearch-workflow ("OpenSearch Service workflow") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). A stylized pipeline: Collection (cluster of
documents) -> Aggregation -> Transformation (funnel) -> an OpenSearch analysis node (chart +
magnifier) that feeds two outcome circles — Analysis (Search / Index / Monitor) and Dashboards
(Visualization / Data correlation). Conceptual slide; drawn shapes, no AWS service icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
DPUR = "#3B1E70"
PINKC = "#C98BDB"
PURPC = "#6E5BD6"
DMAG = "#8E1A5B"
ARC1 = "#C77DD6"
ARC2 = "#7A5BD6"

d = Diagram("OpenSearch Service workflow", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 96, 920, 4)


def line(cid, pts, color=DPUR, w=4, head="none"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=9;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def note(cid, x, y, w=34, h=42, color="#5A4F8C"):
    d._cell(cid, f"shape=note;size=9;html=1;fillColor=#FFFFFF;strokeColor={color};strokeWidth=2;", x, y, w, h)
    for i in range(3):
        d._cell(f"{cid}l{i}", f"rounded=0;html=1;fillColor={color};strokeColor=none;", x + 6, y + 12 + i * 8, w - 14, 2)


def paren(cid, x, glyph, color):
    d._cell(cid, f"text;html=1;align=center;verticalAlign=middle;fontSize=150;fontStyle=1;"
            f"fontColor={color};fontFamily=Amazon Ember;", x, 150, 46, 210, glyph)


# ---- Collection cluster -----------------------------------------------------
d._cell("dot1", f"ellipse;html=1;fillColor={PURPC};strokeColor=none;", 64, 246, 26, 26)
d._cell("dot2", f"ellipse;html=1;fillColor={PINKC};strokeColor=none;", 168, 218, 20, 20)
d._cell("dot3", f"ellipse;html=1;fillColor={PURPC};strokeColor=none;", 170, 300, 18, 18)
note("nA", 92, 214)
note("nB", 132, 252)
note("nC", 102, 292)
d.text(40, 360, 170, 30, "Collection", size=22, align="center")

# ---- decorative brackets ----------------------------------------------------
paren("brc1", 196, ")", ARC1)
paren("brc2", 236, "(", ARC2)
paren("brc3", 438, ")", ARC2)
paren("brc4", 478, "(", ARC2)

# ---- Transformation funnel circle -------------------------------------------
d._cell("pinkc", f"ellipse;html=1;fillColor={PINKC};strokeColor=none;", 286, 180, 150, 150)
note("fn1", 348, 206, 28, 34, INK)
d._cell("funnel", f"shape=trapezoid;direction=south;html=1;fillColor=none;strokeColor={INK};strokeWidth=3;", 336, 244, 50, 30)
d._cell("fstem", f"rounded=0;html=1;fillColor=none;strokeColor={INK};strokeWidth=3;", 354, 274, 14, 22)

# ---- OpenSearch analysis node -----------------------------------------------
d._cell("purpc", f"ellipse;html=1;fillColor={PURPC};strokeColor=none;", 524, 180, 150, 150)
for cid, bx, by, bh in (("bar1", 560, 268, 40), ("bar2", 576, 250, 58), ("bar3", 612, 256, 52), ("bar4", 630, 276, 32)):
    d._cell(cid, "rounded=0;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=3;", bx, by, 11, bh)
d._cell("mglens", "ellipse;html=1;fillColor=none;strokeColor=#FFFFFF;strokeWidth=4;", 584, 268, 38, 38)
d.cells.append('<mxCell id="mghandle" style="endArrow=none;html=1;strokeColor=#FFFFFF;strokeWidth=5;rounded=1;" '
               'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
               '<mxPoint x="616" y="300" as="sourcePoint"/><mxPoint x="632" y="316" as="targetPoint"/></mxGeometry></mxCell>')

# ---- outcome circles --------------------------------------------------------
d._cell("anc", f"ellipse;html=1;fillColor={DMAG};strokeColor=none;fontColor=#FFFFFF;fontStyle=1;"
        "fontSize=21;fontFamily=Amazon Ember;align=center;verticalAlign=middle;", 706, 96, 162, 162, "Analysis")
d.text(884, 128, 116, 110, "•  Search\n•  Index\n•  Monitor", size=20, align="left")
d._cell("dbc", f"ellipse;html=1;fillColor={DMAG};strokeColor=none;fontColor=#FFFFFF;fontStyle=1;"
        "fontSize=21;fontFamily=Amazon Ember;align=center;verticalAlign=middle;", 706, 324, 162, 162, "Dashboards")
d.text(880, 368, 120, 80, "•  Visualization\n•  Data\n   correlation", size=18, align="left")

# ---- pipeline arrows + outcome connectors -----------------------------------
d.text(160, 392, 190, 30, "Aggregation", size=22, align="center")
d.text(340, 440, 240, 30, "Transformation", size=22, align="center")
line("a_ca", [(98, 392), (98, 412), (160, 412)], head="block")       # Collection -> Aggregation
line("a_at", [(255, 426), (255, 460), (340, 460)], head="block")     # Aggregation -> Transformation
line("a_tp", [(560, 452), (560, 332)], head="block")                 # Transformation -> analysis node
line("c_an", [(656, 222), (724, 180)], color=DMAG, w=4)              # node -> Analysis
line("c_db", [(656, 290), (730, 366)], color=DMAG, w=4)              # node -> Dashboards

res = d.save("m07-opensearch-workflow")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m07-opensearch-workflow"))
