"""m02-access-key-rotation ("User access keys") — recreated with the toolkit + official
IAM user icon. CLI/SDK/key glyphs are generic on the slide (no AWS service icon), so they
are reproduced as simple shapes. Canvas 16:9."""
from aws_style import Diagram, P

d = Diagram("User access keys", width=1000, height=562)
PURPLE = P.BADGE          # #330066
GRAY = "#7D8998"
GREEN = "#E8F4D8"

# Title underline rule (purple)
d._cell("rule", f"rounded=0;html=1;fillColor={PURPLE};strokeColor=none;", 38, 78, 250, 4)

# IAM user (official icon) -> arrow -> CLI / SDK circles
d.svg_icon("iamuser", 110, 110, 52, 52, "user", "IAM user")
d._cell("arr1", f"shape=singleArrow;html=1;fillColor={GRAY};strokeColor=none;arrowWidth=0.5;arrowHead=0.6;",
        195, 122, 60, 30)
d._cell("cli", "ellipse;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;fontSize=15;fontStyle=1;fontFamily=Amazon Ember;",
        272, 104, 62, 62, "C:\\")
d._cell("sdk", "ellipse;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;fontSize=14;fontStyle=1;fontFamily=Amazon Ember;",
        340, 104, 62, 62, "SDK")

# Green callout (numbered narrative)
d._cell("callout", f"rounded=0;whiteSpace=wrap;html=1;fillColor={GREEN};strokeColor=none;"
        "align=left;verticalAlign=top;fontColor=#232F3E;fontSize=13;fontFamily=Amazon Ember;spacing=8;",
        560, 90, 380, 96,
        "3. AnyCompany creates user access keys for developers to use with the AWS CLI and AWS SDK.")

# Gray down-arrow to the key boxes
d._cell("arr2", f"shape=singleArrow;direction=south;html=1;fillColor={GRAY};strokeColor=none;arrowWidth=0.5;arrowHead=0.7;",
        288, 196, 34, 60)

def key_glyph(cid, x, y):
    # simple black key: ring (bow) + shaft + teeth
    d._cell(cid + "b", "ellipse;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=4;", x, y + 4, 18, 18)
    d._cell(cid + "s", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;", x + 17, y + 11, 26, 4)
    d._cell(cid + "t1", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;", x + 36, y + 15, 4, 7)
    d._cell(cid + "t2", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;", x + 42, y + 15, 4, 9)

def key_box(cid, x, title, akid, secret, active):
    border = "dashed=0" if active else "dashed=1;dashPattern=4 3"
    d.text(x + 70, 250, 200, 20, title, size=13, align="center")
    d._cell(cid, f"rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor={GRAY};strokeWidth=1;{border};",
            x, 272, 320, 84)
    key_glyph(cid + "k", x + 22, 304)
    d.text(x + 70, 286, 240, 20, f"Access Key ID: {akid}", size=11)
    d.text(x + 70, 320, 240, 20, f"Secret Access Key: {secret}", size=11)
    st = "ACTIVE" if active else "INACTIVE"
    d.text(x, 362, 320, 20, f"Status: {st}", size=12, bold=True, align="center")

key_box("k1", 60, "Key #1", "A2IAI5EXAMPLE", "wJalrFE/KbEKxE", active=False)
key_box("k2", 560, "Key #2", "AEEAI4EXAMPLE", "Kma7FEKbE87/EY", active=True)

d.text(40, 398, 600, 20, "Delete the inactive key when you are sure it is not needed.", size=12)

d.save("m02-access-key-rotation")
