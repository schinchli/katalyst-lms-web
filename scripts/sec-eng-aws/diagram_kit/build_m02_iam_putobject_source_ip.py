"""m02-iam-putobject-source-ip ("Identity-based policies and resource-based policies") —
pixel-faithful recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). An IAM identity at source IP 198.51.100.1
issues s3:PutObject to BucketX; the resource-based bucket policy DENYs (Principal "*",
Action s3:*) when the source IP is NOT in 203.0.113.0/24 — shown by the red prohibition sign.
Two JSON policy blocks are the main content (monospace); official S3 + user icons.
"""
from aws_style import Diagram, P

PURPLE = "#4A1A6B"
MONO = "Courier New"
S3 = "Arch_Amazon-Simple-Storage-Service_48.svg"

d = Diagram("", width=1000, height=562)
d.text(36, 24, 960, 44, "Identity-based policies and resource-based policies",
       size=28, bold=True)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 74, 924, 4)


def code(cid, x, y, w, h, text, size=13, fill="none", stroke="none"):
    # preserve JSON indentation: HTML collapses leading spaces, so use nbsp
    text = text.replace(' ', chr(160))
    st = (f"rounded=0;whiteSpace=pre;html=1;fillColor={fill};strokeColor={stroke};"
          f"align=left;verticalAlign=top;fontColor=#1A1A1A;fontSize={size};"
          f"fontFamily={MONO};spacingLeft=8;spacingTop=6;")
    d._cell(cid, st, x, y, w, h, text)


def arrow(cid, pts, color=PURPLE, w=5, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=5;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- identity-based policy (top-left JSON) -----------------------------------
identity = (
    '{\n'
    '    "Version": "2012-10-17",\n'
    '    "Statement": [{\n'
    '        "Effect": "Allow",\n'
    '        "Action": ["s3:PutObject", "s3:GetObject"],\n'
    '        "Resource": "arn:aws:s3:::BUCKETX/*"\n'
    '    }]\n'
    '}')
code("idpol", 36, 100, 560, 180, identity, size=13)

# ---- IAM identity (bottom-left) ---------------------------------------------
d.svg_icon("iam", 64, 372, 56, 56, "user", "")
d.text(36, 432, 230, 26, "IAM identity", size=17, align="left")
d.text(36, 458, 260, 26, "Source: 198.51.100.1", size=17, align="left")

# s3:PutObject request arrow (identity -> up)
arrow("putreq", [(150, 404), (300, 404), (300, 300)], color=PURPLE, w=6)
d.text(232, 410, 150, 24, "s3:PutObject", size=16, bold=True, color=PURPLE)

# ---- BucketX (top-right) + prohibition sign ---------------------------------
d.svg_icon("bucket", 902, 110, 58, 58, S3, "")
d.text(872, 172, 120, 24, "BucketX", size=17, align="center")

# red prohibition sign above the resource policy box
d._cell("noring", "ellipse;html=1;fillColor=none;strokeColor=#D32F2F;strokeWidth=7;",
        612, 178, 60, 60)
arrow("nobar", [(626, 192), (658, 224)], color="#D32F2F", w=7, head="none")

# deny arrow pointing down into the resource policy box
arrow("denyarr", [(636, 150), (708, 150), (708, 250)], color=PURPLE, w=5)

# ---- resource-based (bucket) policy box (right, gray) ------------------------
resource = (
    '{\n'
    '    "Version": "2012-10-17",\n'
    '    "Statement": [{\n'
    '        "Effect": "Deny",\n'
    '        "Principal": "*"\n'
    '        "Action": "s3:*",\n'
    '        "Resource": "arn:aws:s3:::BUCKETX/*",\n'
    '        "Condition": {\n'
    '            "NotIpAddress": {\n'
    '                "aws:SourceIp": "203.0.113.0/24"\n'
    '            }\n'
    '        }\n'
    '    }]\n'
    '}')
code("respol", 456, 252, 536, 286, resource, size=12, fill="#ECECEC", stroke="#C9C9C9")

res = d.save("m02-iam-putobject-source-ip")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m02-iam-putobject-source-ip"))
