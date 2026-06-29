"""m01-shared-responsibility-ec2 — pixel-faithful recreation of the course slide.

This slide is the AWS Shared Responsibility Model for Amazon EC2: a STACKED layered
chart (not an architecture diagram). Six purple "customer responsibility" rows on top,
two orange "AWS responsibility" rows below, a tall IAM bar on the right (purple CUSTOMER
IAM over orange AWS IAM), two legend chevrons top-left, and supporting text labels.

The slide contains NO AWS service icons, so none are placed (icons would be invented).
All geometry + colours were measured from the original with PIL (scale = 1000/2001).
Slide chrome omitted: AWS logo, copyright footer, page number.
"""
from aws_style import Diagram, P, compare

# ---- measured colours (sampled pixel-exact from the slide) ------------------
PURPLE = "#330066"   # customer-responsibility rows + CUSTOMER IAM + legend chevron
ORANGE = "#ED7D31"   # AWS-responsibility rows + AWS IAM + legend chevron
GRAD_L = "#330066"   # title underline gradient start (purple)
GRAD_R = "#AB40A4"   # title underline gradient end (magenta)

d = Diagram("", width=1000, height=562)   # title drawn manually (custom size/position)

# ---- title + gradient underline ---------------------------------------------
d.text(38, 30, 880, 40, "Responsibility varies based on AWS usage (Amazon EC2)",
       size=25, bold=True)
d._cell("uline", f"rounded=0;whiteSpace=wrap;html=1;fillColor={GRAD_L};"
        f"gradientColor={GRAD_R};gradientDirection=east;strokeColor=none;",
        30, 84, 770, 5)


def row(cid, x, y, w, h, label, fill):
    """A solid responsibility row: filled rect + centred white bold uppercase label."""
    st = (f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=none;"
          f"fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;verticalAlign=middle;"
          f"fontFamily=Amazon Ember;spacingLeft=6;spacingRight=6;")
    d._cell(cid, st, x, y, w, h, label)


def chevron(cid, x, y, w, h, label, fill):
    """Right-pointing ribbon arrow (legend marker) with centred white label."""
    st = (f"shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;size=14;"
          f"fillColor={fill};strokeColor=none;fontColor=#FFFFFF;fontStyle=1;fontSize=12;"
          f"align=center;verticalAlign=middle;fontFamily=Amazon Ember;")
    d._cell(cid, st, x, y, w, h, label)


def vbar(cid, x, y, w, h, label, fill):
    """Vertical IAM bar: filled rect + rotated (vertical) white bold label."""
    st = (f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=none;"
          f"fontColor=#FFFFFF;fontStyle=1;fontSize=11;align=center;verticalAlign=middle;"
          f"fontFamily=Amazon Ember;horizontal=0;")
    d._cell(cid, st, x, y, w, h, label)


# ---- legend chevrons (top-left) ---------------------------------------------
chevron("legA", 20, 105, 232, 37, "Customer Responsibility", PURPLE)
chevron("legB", 20, 148, 232, 37, "AWS Responsibility", ORANGE)

# ---- stacked responsibility rows (column x=338, w=312) ----------------------
SX, SW = 338, 312
rows = [
    ("r1", 110, 37, "CUSTOMER DATA", PURPLE),
    ("r2", 156, 37, "PLATFORM & APPLICATION MANAGEMENT", PURPLE),
    ("r3", 202, 37, "OS, NETWORK, FIREWALL CONFIGURATION", PURPLE),
    ("r4", 248, 37, "NETWORK TRAFFIC PROTECTION", PURPLE),
    ("r5", 293, 37, "SERVER-SIDE ENCRYPTION", PURPLE),
    ("r6", 340, 38, "CLIENT-SIDE DATA ENCRYPTION / INTEGRITY", PURPLE),
    ("r7", 386, 37, "COMPUTE / STORAGE / DATABASE / NETWORK", ORANGE),
    ("r8", 431, 38, "HARDWARE/AWS GLOBAL INFRASTRUCTURE", ORANGE),
]
for cid, y, h, label, fill in rows:
    row(cid, SX, y, SW, h, label, fill)

# ---- IAM bar (right of the stack, x=665, w=68) ------------------------------
vbar("iam_cust", 665, 110, 68, 268, "CUSTOMER IAM", PURPLE)   # spans the 6 purple rows
vbar("iam_aws", 665, 386, 68, 83, "AWS IAM", ORANGE)          # spans the 2 orange rows

# ---- supporting text labels --------------------------------------------------
d.text(95, 356, 130, 22, "Amazon EC2", size=13, align="center")
d.text(429, 482, 130, 42, "Infrastructure\nServices", size=13, align="center")
d.text(756, 244, 168, 84, "More Customizable\n\n+\n\nMore Customer\nResponsibility",
       size=13, align="center")

res = d.save("m01-shared-responsibility-ec2")
print("built:", res.get("src"), "\nweb  :", res.get("web_png"))
print("cmp  :", compare("m01-shared-responsibility-ec2"))
