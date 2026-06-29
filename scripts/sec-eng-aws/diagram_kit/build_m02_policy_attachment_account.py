"""m02-policy-attachment-account ("Inline policies") — pixel-faithful recreation.

Canvas 1000x562. Measured from slides/m02-policy-attachment-account.png (2001x1125, ~x0.5).
Inline policies are embedded one-to-one in a principal, so each row is a white card holding:
policy name + red checklist glyph + principal icon (IAM group / IAM role) + principal name.
All four rows sit inside the dashed AWS Account A box, inside the AWS Cloud box.
Right-hand bullet list is section narration (lives in the notes body).
"""
from aws_style import Diagram, P

RED = "#C7253E"
ROW = "#9AA1A9"   # row card border (thin gray)

d = Diagram("Inline policies", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 360, 4)


def seg(cid, x1, y1, x2, y2, color=RED, w=3):
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow=none;startArrow=none;html=1;rounded=0;'
        f'strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
        f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/></mxGeometry></mxCell>')


def checklist(cid, x, y):
    """Small red checklist policy glyph (no label) — two checks + one X."""
    w, h = 34, 44
    d._cell(cid, f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={RED};strokeWidth=3;",
            x, y, w, h)
    cx = x + 10
    for ry in (y + 10, y + 22):
        seg(f"{cid}c{ry}a", cx, ry, cx + 4, ry + 4)
        seg(f"{cid}c{ry}b", cx + 4, ry + 4, cx + 12, ry - 5)
    rx = y + 34
    seg(f"{cid}x1", cx, rx - 4, cx + 11, rx + 5)
    seg(f"{cid}x2", cx + 11, rx - 4, cx, rx + 5)


# ---- containers --------------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;",
        80, 118, 446, 400)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 92, 130, 30, 24, "aws")
d.text(128, 130, 130, 24, "AWS Cloud", size=15)
d.text(250, 130, 180, 24, "AWS Account A", size=15)
d._cell("acctA", "rounded=1;arcSize=4;html=1;fillColor=none;strokeColor=#232F3E;"
        "strokeWidth=1.5;dashed=1;dashPattern=4 4;", 118, 158, 392, 348)


# ---- four embedded (policy + principal) rows --------------------------------
def row(i, y, policy_name, icon_key, principal, kind):
    d._cell(f"row{i}", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={ROW};strokeWidth=1;",
            132, y, 364, 74)
    d.text(146, y, 150, 74, policy_name, size=14, align="left")
    checklist(f"chk{i}", 300, y + 15)
    if kind == "group":
        d.svg_icon(f"ico{i}", 350, y + 14, 54, 44, icon_key, "")
    else:
        d.svg_icon(f"ico{i}", 354, y + 13, 46, 46, icon_key, "")
    d.text(410, y, 86, 74, principal, size=14, align="left")


ROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"
row(1, 166, "LtdAdmin-mfa", "users", "LtdAdmin\nGroup", "group")
row(2, 250, "AcctAdmin-mfa", "users", "Admin\nGroup", "group")
row(3, 334, "DynamoDBAccess", ROLE, "Role\nbooks-app", "role")
row(4, 418, "DynamoDBAccess\n(Copy)", ROLE, "Role\nEC2-app", "role")

res = d.save("m02-policy-attachment-account")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m02-policy-attachment-account"))
