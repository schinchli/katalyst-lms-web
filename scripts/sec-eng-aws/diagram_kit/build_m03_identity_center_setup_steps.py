"""m03-identity-center-setup-steps ("Getting started with IAM Identity Center") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). Four setup steps: turn on the service ->
choose your identity source -> set up access to accounts -> set up access to applications.
Official IAM Identity Center / Directory Service / Organizations icons; laptop drawn.
"""
from aws_style import Diagram, P

INK = "#232F3E"
PURPLE = "#330066"
IIC = "Arch_AWS-IAM-Identity-Center_32.svg"
DIR = "Res_AWS-Directory-Service_AWS-Managed-Microsoft-AD_48.svg"
OU = "Res_AWS-Organizations_Organizational-Unit_48.svg"
ACCT = "Res_AWS-Organizations_Account_48.svg"

d = Diagram("Getting started with IAM Identity Center", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 760, 4)

CARDS = [
    (58, "#E9EDF2", "Turn on the\nservice.", "Turn on IAM Identity\nCenter in\nyour organization."),
    (298, "#ECECEC", "Choose your\nidentity source.",
     "Connect to your\non-premises Active\nDirectory or use a\nbuilt-in directory."),
    (538, "#F3E8F7", "Set up access to\naccounts.",
     "Grant users and\ngroups IAM Identity\nCenter access to\nspecific AWS\naccounts."),
    (778, "#E9EDF2", "Set up access to\napplications.",
     "Permit users to access\napplications from\nwithin their portal."),
]


def arrow(cid, x1, x2, y):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=block;endSize=5;startArrow=none;html=1;rounded=0;'
        f'strokeColor={PURPLE};strokeWidth=3.5;" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')


def laptop(cx, cy):
    # screen with a checklist
    d._cell("lpscr", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=3;",
            cx - 34, cy, 68, 46)
    for i, yy in enumerate((cy + 10, cy + 22, cy + 34)):
        d._cell(f"lpck{i}", f"rounded=0;html=1;fillColor={INK};strokeColor=none;", cx - 26, yy - 4, 8, 8)
        d.cells.append(
            f'<mxCell id="lpln{i}" style="endArrow=none;html=1;strokeColor={INK};strokeWidth=3;" '
            f'edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{cx - 12}" y="{yy}" as="sourcePoint"/><mxPoint x="{cx + 24}" y="{yy}" as="targetPoint"/></mxGeometry></mxCell>')
    d._cell("lpbase", f"shape=trapezoid;direction=north;html=1;fillColor={INK};strokeColor=none;",
            cx - 46, cy + 46, 92, 12)


for i, (x, fill, header, body) in enumerate(CARDS):
    cx = x + 100
    d.text(x - 6, 110, 212, 48, header, size=19, bold=True, color=INK, align="center")
    d._cell(f"card{i}", f"rounded=0;html=1;fillColor={fill};strokeColor=none;", x, 178, 200, 300)
    d.text(x + 6, 350, 188, 120, body, size=16, align="center")
    if i < 3:
        arrow(f"ar{i}", x + 206, x + 234, 320)

# icons per card (upper area)
d.svg_icon("s1", 126, 226, 64, 64, IIC, "")
d.svg_icon("s2", 366, 226, 64, 64, DIR, "")
d.svg_icon("s3a", 590, 250, 44, 44, ACCT, "")
d.svg_icon("s3b", 632, 222, 48, 44, OU, "")
laptop(878, 232)

res = d.save("m03-identity-center-setup-steps")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-identity-center-setup-steps"))
