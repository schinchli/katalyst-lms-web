"""m03-identity-center-ad-connector ("IAM Identity Center and AD Connector") — recreation.

Canvas 1000x562 (~x0.5 from the 2001x1125 slide). On-premises users/groups in an Active
Directory are connected via AD Connector to IAM Identity Center, which grants (1) managed
permissions to AWS accounts (OU=Dev / OU=Prod in AWS Organizations), (2) business cloud
applications, and (3) customer SAML-available applications. Official AD Connector + IIC icons.
"""
from aws_style import Diagram, P

INK = "#232F3E"
WIRE = "#3B4654"
ORANGE = "#E8830C"
DEEP = "#330066"
ADC = "Res_AWS-Directory-Service_AD-Connector_48.svg"
IIC = "Arch_AWS-IAM-Identity-Center_32.svg"
SERVERS = "Res_Servers_48_Light.svg"

d = Diagram("IAM Identity Center and AD Connector", width=1000, height=562)
d._cell("rule", "rounded=0;html=1;fillColor=#8C4FFF;strokeColor=none;", 38, 78, 740, 4)


def wire(cid, pts, w=2, head="block"):
    mid = "".join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
    d.cells.append(
        f'<mxCell id="{cid}" style="endArrow={head};endSize=6;startArrow=none;html=1;rounded=0;'
        f'strokeColor={WIRE};strokeWidth={w};" edge="1" parent="1">'
        f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
        f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
        f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')


def badge(cid, x, y, n):
    d._cell(cid, f"ellipse;html=1;fillColor={DEEP};strokeColor=none;fontColor=#FFFFFF;"
            "fontStyle=1;fontSize=15;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, 32, 32, n)


def accounts(cid, x, y):
    for i in range(2, -1, -1):
        d._cell(f"{cid}{i}", f"rounded=0;html=1;fillColor=#FFFFFF;strokeColor={ORANGE};strokeWidth=2.5;",
                x + i * 9, y + i * 9, 38, 38)


def applbox(cid, x, y, w, label):
    d._cell(cid, "rounded=1;arcSize=18;html=1;fillColor=#FFFFFF;strokeColor=#C9C9C9;strokeWidth=1.5;"
            f"fontColor={INK};fontSize=16;fontFamily=Amazon Ember;align=center;verticalAlign=middle;",
            x, y, w, 78, label)


# ---- corporate data center --------------------------------------------------
d._cell("cdc", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 36, 200, 278, 252)
d._cell("bldg", "rounded=0;html=1;fillColor=#5B6B7B;strokeColor=none;", 50, 214, 28, 26)
d.text(86, 214, 220, 26, "Corporate data center", size=16, align="left")
d.svg_icon("users", 78, 296, 62, 52, "users", "")
d.text(46, 354, 130, 70, "On-premises\nusers and\ngroups", size=15, align="center")
d._cell("addb", "shape=cylinder3;html=1;backgroundOutline=1;size=10;fillColor=#FFFFFF;"
        f"strokeColor={INK};strokeWidth=2;", 206, 296, 36, 48)
d.svg_icon("adsrv", 244, 302, 40, 40, SERVERS, "")
d.text(190, 354, 120, 70, "Active\nDirectory\nserver", size=15, align="center")

# ---- AWS Cloud box ----------------------------------------------------------
d._cell("cloud", "rounded=0;html=1;fillColor=none;strokeColor=#232F3E;strokeWidth=1.5;", 330, 108, 422, 424)
d._cell("awschip", "rounded=0;html=1;fillColor=#232F3E;strokeColor=none;fontColor=#FFFFFF;"
        "fontSize=11;fontStyle=1;fontFamily=Amazon Ember;", 344, 122, 30, 24, "aws")
d.text(380, 122, 130, 24, "AWS Cloud", size=15)

# accounts box (1)
d._cell("acctbox", "rounded=1;arcSize=8;html=1;fillColor=none;strokeColor=#C9C9C9;strokeWidth=1.5;",
        398, 150, 300, 192)
badge("b1", 384, 148, "1")
accounts("ouDev", 470, 178)
d.text(440, 246, 120, 24, "OU=Dev", size=16, bold=True, align="center")
accounts("ouProd", 600, 178)
d.text(572, 246, 120, 24, "OU=Prod", size=16, bold=True, align="center")
d.text(418, 278, 264, 48, "AWS accounts managed\nin AWS Organizations", size=16, align="center")

# AD Connector + IAM Identity Center
d.svg_icon("adc", 378, 396, 56, 56, ADC, "")
d.text(346, 456, 120, 48, "AD\nConnector", size=15, align="center")
d.svg_icon("iic", 506, 394, 64, 64, IIC, "")
d.text(474, 460, 140, 48, "IAM Identity\nCenter", size=15, align="center")
d.text(392, 350, 130, 70, "Managed\npermissions to\nAWS accounts", size=15, align="center")

# ---- right-hand application targets -----------------------------------------
badge("b2", 786, 244, "2")
applbox("bapp", 800, 250, 184, "Business cloud applications")
badge("b3", 786, 396, "3")
applbox("samlapp", 800, 402, 184, "Customer SAML-available\napplications")

# ---- arrows -----------------------------------------------------------------
wire("ad2adc", [(280, 332), (388, 420)])                 # AD server -> AD Connector
wire("adc2iic", [(436, 424), (506, 424)])                # AD Connector -> IIC
wire("iic2acct", [(540, 394), (540, 342)])               # IIC -> accounts (managed permissions)
wire("iic2bapp", [(572, 408), (798, 296)])               # IIC -> business apps
wire("iic2saml", [(572, 432), (798, 440)])               # IIC -> SAML apps

res = d.save("m03-identity-center-ad-connector")
print("built:", res.get("src"))
from aws_style import compare
print("cmp  :", compare("m03-identity-center-ad-connector"))
