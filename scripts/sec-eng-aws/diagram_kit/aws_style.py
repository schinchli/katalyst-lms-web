"""
aws_style.py — offline draw.io component engine for Security Engineering on AWS diagrams.

Why this exists: every course diagram is assembled from the SAME tested building blocks
(VPC, subnet+lock, EC2, database, IGW, user, purple step badges, double-headed flows)
styled to match the official AWS course slides. Building from components instead of
hand-writing mxGraph XML makes diagrams fast, accurate, visually uniform, and cheap to
generate — no trial-and-error on sprite names or colours.

Only VERIFIED resourceIcon sprites are used (they render under the headless drawio CLI).
The subnet padlock is drawn from primitives (coloured square + white body + shackle ring)
so it ALWAYS renders — the aws4 group_public_subnet/group_private_subnet grIcons do NOT
render headless, so we never rely on them.

Palette + conventions are extracted from the real slides — see STYLE_RULES.md.

Usage (per diagram, ~25 lines):
    from aws_style import Diagram, P
    d = Diagram("Data flow diagram example")
    d.vpc(120,110,890,470, cidr="VPC 10.0.0.0/16")
    d.az(180,150,800,365, "Availability Zone A")
    d.user(42,168, "User")
    d.icon("igw", 38,358, "internet_gateway", P.NETWORK, "Internet\\ngateway", size=52)
    d.subnet(240,268,220,220, "Public subnet", kind="public")
    d.icon("web", 322,360, "ec2", P.COMPUTE, "Web Server")
    ...
    d.flow("igw","web"); d.badge(48,370,"A")
    d.save("m01-data-flow-diagram")   # writes .drawio, exports png+svg, copies to app
"""
from __future__ import annotations
import os, subprocess, shutil, html
import icons as _icons   # official AWS Icon-package resolver/embedder

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.dirname(HERE)                                   # scripts/sec-eng-aws
SRC_DIR = os.path.join(SEC, "diagrams", "src")
PNG_DIR = os.path.join(SEC, "diagrams", "png")
SVG_DIR = os.path.join(SEC, "diagrams", "svg")
REPO = os.path.dirname(os.path.dirname(SEC))                  # lms repo root
WEB_NOTES = os.path.join(REPO, "apps", "web", "public", "sec-eng-aws", "notes")
MOBILE_NOTES = os.path.join(REPO, "mobile", "assets", "images", "sec-eng-aws", "notes")
SLIDES = os.path.join(REPO, "apps", "web", "public", "sec-eng-aws", "slides")


class P:
    """Verified AWS palette (hex) — sampled pixel-exact from the course slides."""
    INK = "#232F3E"            # AWS Squid Ink — title, body text, arrows, user
    BADGE = "#330066"          # step-badge purple — A/B/C and 1/2/3 (measured #330066)
    COMPUTE = "#ED7100"        # EC2 / compute orange
    NETWORK = "#8C4FFF"        # VPC networking purple (IGW, NAT, etc.)
    STORAGE = "#7AA116"        # S3 / storage green
    VPC_GREEN = "#248814"      # VPC border + label green (measured #248814)
    PUB_FILL = "#EAF3E7"       # public subnet fill (measured #EAF3E7)
    PUB_ACCENT = "#248814"     # public subnet lock square (green, measured #248814)
    PRIV_FILL = "#E6F2F8"      # private subnet fill (measured #E6F2F8)
    PRIV_ACCENT = "#147EBA"    # private subnet lock square (blue, measured #147EBA)
    AZ_BLUE = "#007CBC"        # availability-zone dashed border (measured #007CBC)
    DB_BLUE = "#527FFF"        # database blue
    DB_PURPLE = "#6A30A8"      # database gradient (blue->purple)
    SECURITY = "#DD344C"       # security/identity red (KMS, IAM, guard rails)
    WHITE = "#FFFFFF"

# resourceIcon sprite names verified to render under the headless drawio CLI.
VERIFIED_ICONS = {
    "user", "internet_gateway", "ec2", "database", "s3", "bucket", "lambda",
    "vpc", "elastic_load_balancing", "rds", "dynamodb", "cloudwatch",
    "cloudtrail", "simple_notification_service", "simple_queue_service",
    "key_management_service", "identity_and_access_management", "role",
    "certificate_manager", "directory_service", "secrets_manager",
}


def esc(v: str) -> str:
    """Escape a label for an mxCell value attribute; \\n -> line break."""
    return html.escape(v, quote=True).replace("\n", "&#10;")


class Diagram:
    def __init__(self, title: str, width: int = 1040, height: int = 640):
        self.cells: list[str] = []
        self.w, self.h = width, height
        self._n = 0
        # Full-page white background so the export bbox == the page (direct pixel mapping
        # to the slide, not a cropped content bbox).
        self._cell("bg", "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=none;",
                   0, 0, width, height)
        if title:
            self.text(38, 30, 760, 48, title, size=35, bold=True)

    def _id(self, prefix="c") -> str:
        self._n += 1
        return f"{prefix}{self._n}"

    # ---- primitives ---------------------------------------------------------
    def _cell(self, cid, style, x, y, w, h, value=""):
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(value)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return cid

    def text(self, x, y, w, h, value, size=14, bold=False, color=P.INK, align="left"):
        st = (f"text;html=1;align={align};verticalAlign=middle;fontSize={size};"
              f"fontFamily=Amazon Ember;fontColor={color};{'fontStyle=1;' if bold else ''}")
        return self._cell(self._id("t"), st, x, y, w, h, value)

    # ---- containers ---------------------------------------------------------
    def vpc(self, x, y, w, h, label="VPC", cidr=None):
        # The slide draws the VPC as a plain thin green box with a green "VPC" text
        # label top-left — NO cloud icon. Match that exactly.
        st = (f"rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor={P.VPC_GREEN};"
              f"strokeWidth=1;verticalAlign=top;align=left;fontColor={P.VPC_GREEN};"
              "fontSize=15;fontStyle=1;fontFamily=Amazon Ember;spacingLeft=12;spacingTop=8;")
        self._cell("vpc", st, x, y, w, h, label)
        if cidr:
            self.text(x + 60, y + h - 36, 220, 24, cidr, size=14)

    def az(self, x, y, w, h, label):
        st = (f"rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor={P.AZ_BLUE};"
              "strokeWidth=1;dashed=1;dashPattern=4 3;verticalAlign=top;align=center;"
              f"fontColor={P.INK};fontSize=15;fontFamily=Amazon Ember;spacingTop=8;")
        return self._cell(self._id("az"), st, x, y, w, h, label)

    def subnet(self, x, y, w, h, label, kind="public"):
        """Light subnet box + the OFFICIAL AWS subnet group icon (green padlock = public,
        teal padlock = private) in the top-left. No hand-drawn shapes, no dark fills."""
        pub = kind == "public"
        fill = P.PUB_FILL if pub else P.PRIV_FILL
        key = "public-subnet" if pub else "private-subnet"
        self._cell(self._id("sn"),
                   f"rounded=0;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=none;",
                   x, y, w, h)
        # group icon + title anchored at the TOP-LEFT corner (matched to the slide inset)
        self.svg_icon(self._id("snicon"), x + 10, y + 9, 26, 26, key, label="")
        self.text(x + 42, y + 9, w - 50, 26, label, size=13)

    # ---- OFFICIAL AWS icons (from the Icon-package) -------------------------
    def svg_icon(self, cid, x, y, w, h, key, label="", label_below=True, label_size=13):
        """Place an official AWS icon (SVG from the Icon-package) as an image shape.
        `key` is an icons.ALIAS key or a filename substring. No hand-drawing."""
        uri = _icons.data_uri(key)
        lblpos = ("verticalLabelPosition=bottom;verticalAlign=top;"
                  if label_below else "verticalLabelPosition=middle;verticalAlign=middle;")
        st = (f"shape=image;html=1;aspect=fixed;imageAspect=0;{lblpos}align=center;"
              f"fontColor={P.INK};fontSize={label_size};fontFamily=Amazon Ember;"
              f"labelBackgroundColor=none;image={uri};")
        return self._cell(cid, st, x, y, w, h, label)

    # ---- icons / nodes ------------------------------------------------------
    def icon(self, cid, x, y, resicon, color, label, size=56, boxed=True):
        """An AWS service icon with label below.
        boxed=True  -> resourceIcon (filled category square): EC2, database, S3, Lambda…
        boxed=False -> plain glyph (no square): user (outline person), internet_gateway
                       (purple circle), NAT, etc. — matches the line-art icons on the slides."""
        if resicon not in VERIFIED_ICONS:
            return self.box(cid, x, y, size, size, label, color)   # safe fallback
        if boxed:
            shape = f"shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{resicon};"
        else:
            shape = f"shape=mxgraph.aws4.{resicon};"
        st = ("sketch=0;outlineConnect=0;fontColor=" + P.INK + ";gradientColor=none;"
              f"fillColor={color};strokeColor=none;verticalLabelPosition=bottom;"
              "verticalAlign=top;align=center;html=1;fontSize=13;aspect=fixed;" + shape)
        return self._cell(cid, st, x, y, size, size, label)

    def box(self, cid, x, y, w, h, label, color):
        """Labelled rounded box for services without a verified sprite."""
        st = (f"rounded=1;whiteSpace=wrap;html=1;fillColor={color};strokeColor=none;"
              "fontColor=#FFFFFF;fontStyle=1;fontSize=12;align=center;verticalAlign=middle;")
        return self._cell(cid, st, x, y, w, h, label)

    def db_icon(self, cid, x, y, label, size=56):
        """The course 'database' icon: blue->purple gradient square + white 3-disk
        cylinder + white lightning bolt (no single aws4 sprite matches, so composite)."""
        self._cell(cid + "_bg",
                   f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor={P.DB_BLUE};"
                   f"gradientColor={P.DB_PURPLE};gradientDirection=north;strokeColor=none;",
                   x, y, size, size)
        cw, ch = int(size * 0.40), int(size * 0.46)
        self._cell(cid + "_cyl",
                   "shape=cylinder3;html=1;boundedLbl=1;backgroundOutline=1;size=7;"
                   "fillColor=none;strokeColor=#FFFFFF;strokeWidth=1;",
                   int(x + size * 0.20), int(y + size * 0.28), cw, ch)
        # white lightning bolt (polyline) on the right
        p = [(0.70, 0.28), (0.58, 0.52), (0.70, 0.52), (0.58, 0.74)]
        pts = [(int(x + size * a), int(y + size * b)) for a, b in p]
        arr = "".join(f'<mxPoint x="{px_}" y="{py_}"/>' for px_, py_ in pts[1:-1])
        self.cells.append(
            f'<mxCell id="{cid}_bolt" style="endArrow=none;html=1;strokeColor=#FFFFFF;'
            f'strokeWidth=3;rounded=0;" edge="1" parent="1"><mxGeometry relative="1" '
            f'as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
            f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
            f'<Array as="points">{arr}</Array></mxGeometry></mxCell>')
        # centred label below
        self.text(x - 40, y + size + 2, size + 80, 56, label, size=13, align="center")
        return cid

    def user(self, x, y, label="User", size=44):
        # plain (unboxed) -> outline person, exactly like the slide (no dark square)
        return self.icon("user", x, y, "user", P.INK, label, size, boxed=False)

    # ---- badges / flows -----------------------------------------------------
    def badge(self, x, y, text, color=None, size=44, cid=None):
        st = (f"ellipse;whiteSpace=wrap;html=1;fillColor={color or P.BADGE};strokeColor=none;"
              "fontColor=#FFFFFF;fontSize=15;fontStyle=1;fontFamily=Amazon Ember;")
        return self._cell(cid or self._id("b"), st, x, y, size, size, text)

    def flow(self, src, tgt, double=True, sx=1, sy=0.5, tx=0, ty=0.5):
        """Double-headed data-flow arrow between two node ids."""
        start = "startArrow=block;" if double else "startArrow=none;"
        st = (f"endArrow=block;{start}html=1;strokeColor={P.INK};strokeWidth=1;"
              f"exitX={sx};exitY={sy};exitDx=0;exitDy=0;entryX={tx};entryY={ty};entryDx=0;entryDy=0;")
        self.cells.append(
            f'<mxCell id="{self._id("e")}" style="{st}" edge="1" parent="1" '
            f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')

    def link(self, src, tgt, sx=0.5, sy=1, tx=0.5, ty=0):
        """Plain connector (no arrowheads), e.g. user → gateway."""
        st = (f"endArrow=none;html=1;strokeColor={P.INK};strokeWidth=1;"
              f"exitX={sx};exitY={sy};exitDx=0;exitDy=0;entryX={tx};entryY={ty};entryDx=0;entryDy=0;")
        self.cells.append(
            f'<mxCell id="{self._id("e")}" style="{st}" edge="1" parent="1" '
            f'source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>')

    # ---- output -------------------------------------------------------------
    def xml(self) -> str:
        body = "\n        ".join(self.cells)
        return (
            '<mxfile host="app.diagrams.net">\n'
            f'  <diagram id="d" name="diagram">\n'
            f'    <mxGraphModel dx="1000" dy="700" grid="0" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" '
            f'pageHeight="{self.h}" math="0" shadow="0">\n      <root>\n'
            '        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n'
            f'        {body}\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n')

    def save(self, slug: str, copy_to_app: bool = True, export: bool = True) -> dict:
        os.makedirs(SRC_DIR, exist_ok=True)
        src = os.path.join(SRC_DIR, f"{slug}.drawio")
        with open(src, "w") as f:
            f.write(self.xml())
        out = {"src": src}
        if export:
            out.update(render(slug, copy_to_app=copy_to_app))
        return out


def render(slug: str, copy_to_app: bool = True) -> dict:
    """Export <slug>.drawio to PNG + SVG and (optionally) copy into web + mobile."""
    for d in (PNG_DIR, SVG_DIR):
        os.makedirs(d, exist_ok=True)
    src = os.path.join(SRC_DIR, f"{slug}.drawio")
    png = os.path.join(PNG_DIR, f"{slug}.png")
    svg = os.path.join(SVG_DIR, f"{slug}.svg")
    env = dict(os.environ, ELECTRON_DISABLE_SANDBOX="1")
    subprocess.run(["drawio", "-x", "-f", "png", "--scale", "2", "--border", "0",
                    "-o", png, src, "--no-sandbox"], check=True, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["drawio", "-x", "-f", "svg", "--border", "0",
                    "-o", svg, src, "--no-sandbox"], check=True, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    out = {"png": png, "svg": svg}
    if copy_to_app:
        os.makedirs(WEB_NOTES, exist_ok=True)
        shutil.copy2(png, os.path.join(WEB_NOTES, f"{slug}.png"))
        shutil.copy2(svg, os.path.join(WEB_NOTES, f"{slug}.svg"))
        if os.path.isdir(MOBILE_NOTES):
            shutil.copy2(png, os.path.join(MOBILE_NOTES, f"{slug}.png"))
        out["web_png"] = os.path.join(WEB_NOTES, f"{slug}.png")
    return out


def compare(slug: str) -> str | None:
    """Stitch the original slide + the recreation side-by-side for visual QA.
    Returns the comparison PNG path, or None if PIL/original unavailable."""
    orig = os.path.join(SLIDES, f"{slug}.png")
    recreated = os.path.join(PNG_DIR, f"{slug}.png")
    if not (os.path.exists(orig) and os.path.exists(recreated)):
        return None
    try:
        from PIL import Image
    except ImportError:
        return None
    a, b = Image.open(orig).convert("RGB"), Image.open(recreated).convert("RGB")
    tw = 900
    a = a.resize((tw, int(a.height * tw / a.width)))
    b = b.resize((tw, int(b.height * tw / b.width)))
    canvas = Image.new("RGB", (tw, a.height + b.height + 30), "white")
    canvas.paste(a, (0, 0))
    canvas.paste(b, (0, a.height + 30))
    out = os.path.join(PNG_DIR, f"{slug}__compare.png")
    canvas.save(out)
    return out
