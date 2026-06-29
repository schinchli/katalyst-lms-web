"""m01-threat-modeling-process — pixel-faithful recreation of the course slide.

Canvas 1000x562 (16:9). Coordinates + colours measured directly from the original slide
with PIL (scale = 1000/2001 = 0.49975). The slide is a horizontal 4-step process flow:
each step = an official AWS line-art icon over a two-line caption, joined by chunky purple
single-headed block arrows. No copyright/footer/page-number/aws-logo (intentional omission).

Sampled from the original:
  - purple arrows / badges  = #330066 (R51 G0 B102)  -> P.BADGE
  - title + caption ink     = #232F3E                -> P.INK
  - rule line gradient      = #340A5E (left) -> #9389D0 (right)  [dark-purple -> lavender]

Icons are official AWS Resource icons (Res_*_48_Light) — closest line-art matches to the
slide's generic glyphs; no hand-drawn shapes (per STYLE_RULES.md):
  person  -> Res_User       | data-flow table -> Res_Data-Table
  sliders -> Res_Gear       | vulnerability doc -> Res_Document
"""
from aws_style import Diagram, P, esc, compare

d = Diagram("Threat modeling process", width=1000, height=562)

# --- gradient rule line under the title (dark-purple -> lavender, left to right) --------
d._cell("rule",
        "rounded=0;html=1;fillColor=#330066;gradientColor=#9389D0;gradientDirection=east;"
        "strokeColor=none;",
        30, 84, 941, 4)

# --- 4 process steps: icon centre x (measured), shared icon vertical centre ~298 --------
STEP_CX = [160, 376, 601, 814]
ICON = 100                         # square footprint ~ slide glyph size
ICON_Y = 298 - ICON // 2           # vertical centre 298 -> top 248

steps = [
    ("user",                    "Assign a\nsecurity POC."),
    ("Res_Data-Table_48_Light.svg", "Fill out a data\nflow table."),
    ("Res_Gear_48_Light.svg",       "Perform a threat\nmodeling session."),
    ("Res_Document_48_Light.svg",   "Document\nvulnerabilities."),
]

for i, (cx, (key, _)) in enumerate(zip(STEP_CX, steps)):
    d.svg_icon(f"step{i}", cx - ICON // 2, ICON_Y, ICON, ICON, key, label="")

# captions (two lines, centred under each icon) — INK, Amazon Ember
for cx, (_, caption) in zip(STEP_CX, steps):
    d.text(cx - 110, 368, 220, 56, caption, size=20, align="center")

# --- 3 chunky purple single-headed block arrows between the steps ----------------------
ARROW_CX = [255, 483, 737]
AW, AH = 46, 46
for i, cx in enumerate(ARROW_CX):
    d.cells.append(
        f'<mxCell id="arr{i}" value="" style="shape=singleArrow;direction=east;html=1;'
        f'fillColor={P.BADGE};strokeColor=none;arrowWidth=0.62;arrowSize=0.55;" '
        f'vertex="1" parent="1"><mxGeometry x="{cx - AW // 2}" y="{298 - AH // 2}" '
        f'width="{AW}" height="{AH}" as="geometry"/></mxCell>')

res = d.save("m01-threat-modeling-process")
print("built:", res.get("src"), "\nweb  :", res.get("web_png"))
print("cmp  :", compare("m01-threat-modeling-process"))
