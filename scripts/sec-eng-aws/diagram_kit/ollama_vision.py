"""ollama_vision.py — extract a structured diagram spec from a slide image using a LOCAL
vision model (Ollama, Metal-accelerated). Zero Claude tokens. Returns a dict spec that
spec_build.py turns into AWS-styled draw.io. Weak local models are approximate, so the
spec uses a coarse 12x7 GRID (easier than pixel coords) and the toolkit does the styling.
"""
import base64, json, urllib.request, os

OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = os.environ.get("VISION_MODEL", "llava:7b")

PROMPT = """You are analyzing an AWS architecture diagram. Reply with ONLY a JSON object,
no prose. Use a coarse grid: columns 0-11 (left->right), rows 0-6 (top->bottom).
Schema:
{
 "title": "<the slide title text>",
 "containers": [ {"kind":"vpc|availability_zone|public_subnet|private_subnet|account|region|box",
                  "label":"<text>", "col":<0-11>, "row":<0-6>, "cols":<width 1-12>, "rows":<height 1-7>} ],
 "nodes": [ {"service":"<aws service e.g. ec2, s3, kms, iam, rds, dynamodb, lambda, internet_gateway,
              nat_gateway, vpc_endpoint, cloudwatch, cloudtrail, sns, sqs, elb, user, ebs, cloudhsm,
              secrets_manager>", "label":"<text>", "col":<0-11>, "row":<0-6>} ],
 "edges": [ {"from":"<node label>", "to":"<node label>", "both":<true/false>} ]
}
List every box/VPC/subnet as a container and every AWS icon as a node. Be concise."""


def extract_spec(image_path: str, model: str = MODEL) -> dict:
    b64 = base64.b64encode(open(image_path, "rb").read()).decode("ascii")
    payload = {"model": model, "prompt": PROMPT, "images": [b64],
               "stream": False, "format": "json", "options": {"temperature": 0}}
    req = urllib.request.Request(f"{OLLAMA}/api/generate",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        resp = json.loads(r.read())
    raw = resp.get("response", "{}")
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError:
        # salvage the first {...} block
        a, b = raw.find("{"), raw.rfind("}")
        spec = json.loads(raw[a:b + 1]) if a >= 0 else {"title": "", "containers": [], "nodes": [], "edges": []}
    spec.setdefault("title", ""); spec.setdefault("containers", [])
    spec.setdefault("nodes", []); spec.setdefault("edges", [])
    return spec


if __name__ == "__main__":
    import sys
    print(json.dumps(extract_spec(sys.argv[1]), indent=2))
