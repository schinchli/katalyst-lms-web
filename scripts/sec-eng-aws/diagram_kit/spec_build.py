"""spec_build.py — turn a vision spec (from ollama_vision) into AWS-styled draw.io using
the deterministic toolkit. The toolkit guarantees official icons + AWS styling even when
the local model's positions are approximate. Grid 12x7 -> 1000x562 canvas.
"""
from aws_style import Diagram, P
import icons as _icons

COLW, ROWH, X0, Y0 = 78, 70, 30, 70   # grid cell -> pixels

# spec "service" keyword -> official Icon-package alias / filename substring
SERVICE_ICON = {
    "ec2": "ec2", "s3": "Arch_Amazon-Simple-Storage-Service", "kms": "Arch_AWS-Key-Management-Service",
    "iam": "Arch_AWS-Identity-and-Access-Management", "rds": "Arch_Amazon-RDS",
    "dynamodb": "Arch_Amazon-DynamoDB", "lambda": "Arch_AWS-Lambda",
    "internet_gateway": "internet-gateway", "nat_gateway": "Res_Amazon-VPC_NAT-Gateway",
    "vpc_endpoint": "Res_Amazon-VPC_Endpoints", "cloudwatch": "Arch_Amazon-CloudWatch",
    "cloudtrail": "Arch_AWS-CloudTrail", "sns": "Arch_Amazon-Simple-Notification-Service",
    "sqs": "Arch_Amazon-Simple-Queue-Service", "elb": "Arch_Elastic-Load-Balancing",
    "user": "user", "ebs": "Res_Amazon-Elastic-Block-Store", "cloudhsm": "Arch_AWS-CloudHSM",
    "secrets_manager": "Arch_AWS-Secrets-Manager",
}


def _xy(col, row):
    return X0 + int(col) * COLW, Y0 + int(row) * ROWH


def build_from_spec(slug: str, spec: dict) -> dict:
    d = Diagram(spec.get("title", ""), width=1000, height=562)
    centers = {}   # node label -> (cx, cy) for edge routing

    for i, c in enumerate(spec.get("containers", [])):
        x, y = _xy(c.get("col", 0), c.get("row", 0))
        w = max(1, int(c.get("cols", 2))) * COLW
        h = max(1, int(c.get("rows", 2))) * ROWH
        kind = (c.get("kind") or "box").lower()
        label = c.get("label", "")
        if kind == "vpc":
            d.vpc(x, y, w, h, label=label or "VPC")
        elif kind in ("availability_zone", "az"):
            d.az(x, y, w, h, label or "Availability Zone")
        elif "public" in kind:
            d.subnet(x, y, w, h, label or "Public subnet", kind="public")
        elif "private" in kind:
            d.subnet(x, y, w, h, label or "Private subnet", kind="private")
        else:  # account / region / generic box -> thin labelled boundary
            d._cell(f"ct{i}", "rounded=0;whiteSpace=wrap;html=1;fillColor=none;"
                    f"strokeColor={P.INK};strokeWidth=1;dashed=1;dashPattern=4 3;"
                    "verticalAlign=top;align=left;fontColor=#232F3E;fontSize=13;"
                    "fontFamily=Amazon Ember;spacingLeft=8;spacingTop=6;", x, y, w, h, label)

    for i, n in enumerate(spec.get("nodes", [])):
        x, y = _xy(n.get("col", 0), n.get("row", 0))
        label = n.get("label", "")
        svc = (n.get("service") or "").lower().strip()
        key = SERVICE_ICON.get(svc)
        try:
            if key:
                d.svg_icon(f"n{i}", x, y, 52, 52, key, label)
            else:
                _icons.resolve(svc); d.svg_icon(f"n{i}", x, y, 52, 52, svc, label)
        except Exception:
            d.box(f"n{i}", x, y, 90, 44, label or svg_fallback(svc), P.NETWORK)
        centers[label] = (x + 26, y + 26)

    for i, e in enumerate(spec.get("edges", [])):
        a = centers.get(e.get("from")); b = centers.get(e.get("to"))
        if not (a and b):
            continue
        start = "startArrow=block;" if e.get("both") else "startArrow=none;"
        d.cells.append(
            f'<mxCell id="e{i}" style="endArrow=block;{start}html=1;strokeColor={P.INK};'
            f'strokeWidth=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{a[0]}" y="{a[1]}" as="sourcePoint"/>'
            f'<mxPoint x="{b[0]}" y="{b[1]}" as="targetPoint"/></mxGeometry></mxCell>')

    return d.save(slug)


def svg_fallback(svc):
    return (svc or "service").replace("_", " ").title()
