"""icons.py — resolve and embed OFFICIAL AWS Architecture Icons (SVG) from the
AWS Icon-package. No hand-drawn shapes: every service/group/resource icon in a diagram
comes from this package, exactly as AWS ships it.

Used icons are copied into diagram_kit/aws_icons/lib/ so builds are self-contained and
committable. Each is embedded into the .drawio as an SVG data-URI image shape.
"""
import os, glob, base64, shutil, urllib.parse

PACKAGE = "/Users/schinchli/Downloads/Icon-package_04302026.4705b90f5aa45b019271a2699e9ce9b97b941ee1"
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, "aws_icons", "lib")
os.makedirs(LIB, exist_ok=True)

# Explicit, exact filenames for the icons we place (basename -> matched in the package).
# Prefer Service icons (Arch_*) for services, Group icons for containers, Res_* for resources.
ALIAS = {
    "user": "Res_User_48_Light.svg",
    "users": "Res_Users_48_Light.svg",
    "internet-gateway": "Res_Amazon-VPC_Internet-Gateway_48.svg",
    "ec2": "Arch_Amazon-EC2_48.svg",
    "dynamodb": "Arch_Amazon-DynamoDB_48.svg",        # cylinder + lightning bolt
    "database": "Arch_Amazon-DynamoDB_48.svg",
    "rds": "Arch_Amazon-RDS_48.svg",
    "public-subnet": "Public-subnet_32.svg",          # official subnet group corner icon
    "private-subnet": "Private-subnet_32.svg",
    "vpc": "Virtual-private-cloud-VPC_32.svg",
}

_INDEX = None
def _index():
    """basename(lower) -> full path, prefer _Light over _Dark, prefer larger size."""
    global _INDEX
    if _INDEX is None:
        _INDEX = {}
        for p in glob.glob(os.path.join(PACKAGE, "**", "*.svg"), recursive=True):
            b = os.path.basename(p)
            key = b.lower()
            if key not in _INDEX or ("_dark" in _INDEX[key].lower() and "_dark" not in key):
                _INDEX[key] = p
    return _INDEX


def resolve(name: str) -> str:
    """Return the package path for an icon key (alias) or a filename substring."""
    idx = _index()
    fn = ALIAS.get(name, name)
    if fn.lower() in idx:
        return idx[fn.lower()]
    # substring fallback
    hits = [p for b, p in idx.items() if name.lower().replace(" ", "-") in b]
    if not hits:
        raise KeyError(f"icon not found: {name}")
    return sorted(hits, key=len)[0]


def _best_png(svg_path: str) -> str:
    """Highest-res PNG for an icon (the drawio CLI rasterises PNG, not embedded SVG).
    Prefer the @5x asset, then same-name PNG, then any size."""
    base = svg_path[:-4]
    stem = os.path.basename(base).rsplit("_", 1)[0]
    pool = glob.glob(os.path.join(PACKAGE, "**", f"{stem}_*@5x.png"), recursive=True)
    if pool:
        return sorted(pool)[0]
    if os.path.exists(base + ".png"):
        return base + ".png"
    pool = glob.glob(os.path.join(PACKAGE, "**", f"{stem}_*.png"), recursive=True)
    if pool:
        return sorted(pool, key=len)[-1]
    raise FileNotFoundError(f"no PNG for {svg_path}")


def ensure_local(name: str) -> str:
    """Copy the icon (SVG + chosen PNG) into aws_icons/lib/ and return the PNG path."""
    src = resolve(name)
    png = _best_png(src)
    for f in (src, png):
        dst = os.path.join(LIB, os.path.basename(f))
        if not os.path.exists(dst):
            shutil.copy2(f, dst)
    return os.path.join(LIB, os.path.basename(png))


def data_uri(name: str) -> str:
    """drawio image data-URI. NOTE: drawio splits styles on ';', so the standard
    'data:image/png;base64,' form breaks the style — drawio uses 'data:image/png,<b64>'
    (comma, base64 implied)."""
    with open(ensure_local(name), "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:image/png,{b64}"


if __name__ == "__main__":
    for k in ["user", "internet-gateway", "ec2", "database", "public-subnet", "private-subnet", "vpc"]:
        print(f"{k:18} -> {os.path.basename(resolve(k))}")
