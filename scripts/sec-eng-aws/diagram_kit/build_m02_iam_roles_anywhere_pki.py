"""m02-iam-roles-anywhere-pki ("AWS Identity and Access Management Roles Anywhere") —
pixel-faithful recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). IAM Roles Anywhere lets a workload outside
AWS use an X.509 certificate (issued by AWS Private CA, trusted by a trust anchor) to assume
an IAM role via the rolesanywhere.amazonaws.com service principal. Centre = PKI infrastructure;
left = IAM role + trust-policy scroll; right = trust anchor + your workload.
Official AWS icons: IAM role, ACM certificate, Private CA, servers.
"""
from aws_style import Diagram, P

PURPLE = "#330066"
MONO = "Courier New"
ROLE = "Res_AWS-Identity-Access-Management_Role_48.svg"
CERT = "Res_AWS-Certificate-Manager_Certificate-Authority_48.svg"
PCA = "Arch_AWS-Private-Certificate-Authority_32.svg"
SERVERS = "Res_Servers_48_Light.svg"

d = Diagram("", width=1000, height=562)
d.text(36, 20, 950, 44, "AWS Identity and Access Management Roles Anywhere", size=27, bold=True)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 70, 900, 4)


def line(cid, pts, color=PURPLE, w=3, dashed=False, head="none"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    dash = "dashed=1;dashPattern=2 4;" if dashed else ""
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;'
        f'rounded=0;strokeColor={color};strokeWidth={w};{dash}" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry">'
        f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


# ---- centre: PKI infrastructure pill ----------------------------------------
d._cell("pki", f"rounded=1;arcSize=18;html=1;fillColor={PURPLE};strokeColor=none;"
        "fontColor=#FFFFFF;fontStyle=1;fontSize=22;fontFamily=Amazon Ember;align=center;"
        "verticalAlign=middle;", 372, 298, 256, 58, "PKI infrastructure")

# X.509 certificate (top) composed into PKI
d.svg_icon("cert", 454, 148, 64, 54, CERT, "")
d.text(378, 206, 240, 26, "X.509 certificate", size=18, align="center")
line("c2pki", [(500, 232), (500, 298)], w=4)
# AWS Private CA (bottom) composed into PKI
d.svg_icon("pca", 470, 398, 54, 54, PCA, "")
d.text(356, 454, 290, 44, "AWS Private Certificate\nAuthority", size=18, align="center")
line("ca2pki", [(500, 356), (500, 398)], w=4)

# ---- left: IAM role + trust-policy scroll + service principal ---------------
d.text(40, 122, 430, 30, "rolesanywhere.amazonaws.com", size=20, align="left")
d.text(70, 164, 120, 26, "Allow", size=18, align="left")
d._cell("scroll", "rounded=1;arcSize=6;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;"
        "strokeWidth=2;", 62, 194, 304, 116)
d._cell("roll1", "ellipse;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;strokeWidth=2;",
        348, 186, 16, 16)
d._cell("roll2", "ellipse;html=1;fillColor=#FFFFFF;strokeColor=#9AA1A9;strokeWidth=2;",
        64, 302, 16, 16)
d._cell("acts", f"rounded=0;whiteSpace=pre;html=1;fillColor=none;strokeColor=none;align=left;"
        f"verticalAlign=top;fontColor=#1A1A1A;fontSize=16;fontFamily={MONO};spacingLeft=8;"
        "spacingTop=8;", 80, 206, 280, 96,
        "sts:AssumeRole\nsts:SetSourceIdentity\nsts:TagSession")
d.svg_icon("role", 92, 358, 56, 56, ROLE, "")
d.text(44, 418, 150, 26, "IAM role", size=18, align="center")

# ---- right: trust anchor + your workload ------------------------------------
d.text(700, 128, 220, 28, "Trust anchor", size=20, align="center")
d.svg_icon("workload", 852, 316, 66, 66, SERVERS, "")
d.text(792, 398, 190, 26, "Your workload", size=18, align="center")

# ---- dotted trust connectors (inverted V's) ---------------------------------
line("ra2role", [(300, 158), (120, 356)], dashed=True, w=3)   # principal -> IAM role
line("ra2pki", [(330, 168), (372, 316)], dashed=True, w=3)    # principal -> PKI
line("ta2pki", [(800, 162), (628, 316)], dashed=True, w=3)    # trust anchor -> PKI
line("ta2wl", [(812, 162), (884, 314)], dashed=True, w=3)     # trust anchor -> workload

res = d.save("m02-iam-roles-anywhere-pki")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m02-iam-roles-anywhere-pki"))
