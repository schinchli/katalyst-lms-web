"""m03-cognito-adaptive-auth-risk ("Adaptive authentication") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Cognito adaptive auth maps a risk level to a
response: Low risk -> Allow, Medium risk -> Optional MFA (+ notify), High risk -> Require MFA
(+ notify). Recreated as the settings table (radio per action + a Notify-users checkbox). The
slide bullet is section narration (notes body).
"""
from aws_style import Diagram, P

INK = "#232F3E"
BLUE = "#1565C0"
PURPLE = "#4A148C"
LINE = "#D5D9DE"

COLS = [("Allow", 322), ("Optional MFA", 482), ("Require MFA", 642), ("Block", 776), ("Notify users", 886)]
ROWS = [("Low risk", 250), ("Medium risk", 330), ("High risk", 410)]

d = Diagram("Adaptive authentication", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 540, 4)


def seg(cid, x1, y1, x2, y2, color, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def radio(cid, cx, cy, selected):
    d._cell(cid, f"ellipse;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;strokeWidth=2;",
            cx - 13, cy - 13, 26, 26)
    if selected:
        d._cell(cid + "f", f"ellipse;html=1;fillColor={BLUE};strokeColor=none;",
                cx - 6, cy - 6, 12, 12)


def checkbox(cid, cx, cy, checked):
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;strokeWidth=2;",
            cx - 13, cy - 13, 26, 26)
    if checked:
        seg(f"{cid}a", cx - 7, cy, cx - 1, cy + 7, PURPLE, 3)
        seg(f"{cid}b", cx - 1, cy + 7, cx + 9, cy - 8, PURPLE, 3)


# ---- card -------------------------------------------------------------------
d._cell("card", "rounded=1;arcSize=4;html=1;fillColor=#FFFFFF;strokeColor=#C9C9C9;strokeWidth=1.5;",
        70, 150, 860, 340)

# headers
for name, cx in COLS:
    d.text(cx - 90, 184, 180, 26, name, size=18, bold=True, align="center")

# rows
for r, (rlabel, ry) in enumerate(ROWS):
    d.text(110, ry - 14, 130, 28, rlabel, size=18, align="left")
    if r > 0:
        seg(f"sep{r}", 100, ry - 40, 900, ry - 40, LINE, 1)

# selections: row -> selected action index (0..3); notify checked?
selected_action = [0, 1, 2]          # Allow, Optional MFA, Require MFA
notify_checked = [False, True, True]
for r, (_, ry) in enumerate(ROWS):
    for c in range(4):               # 4 radio columns
        radio(f"rad{r}{c}", COLS[c][1], ry, selected_action[r] == c)
    checkbox(f"chk{r}", COLS[4][1], ry, notify_checked[r])

res = d.save("m03-cognito-adaptive-auth-risk")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-cognito-adaptive-auth-risk"))
