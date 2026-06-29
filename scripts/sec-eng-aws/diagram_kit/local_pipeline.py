"""local_pipeline.py — fully OFFLINE diagram generation. For each slug:
  local vision model (Ollama) -> structured spec -> AWS-styled draw.io (toolkit) -> diff score.
Zero Claude tokens. Runs slugs concurrently (the orchestration is parallel; on an 8 GB Mac
Ollama serialises inference, but the renders/diffs overlap). Caches each spec to spec_cache/.

Usage: python3 local_pipeline.py m04-kms-ebs m06-vpc-endpoint ...
"""
import sys, os, json, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import ollama_vision, spec_build, diff

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(SEC))
SLIDES = os.path.join(REPO, "apps", "web", "public", "sec-eng-aws", "slides")
CACHE = os.path.join(HERE, "spec_cache")
os.makedirs(CACHE, exist_ok=True)


def process(slug: str, refresh=False) -> dict:
    t0 = time.time()
    slide = os.path.join(SLIDES, f"{slug}.png")
    cache = os.path.join(CACHE, f"{slug}.json")
    if os.path.exists(cache) and not refresh:
        spec = json.load(open(cache))
    else:
        spec = ollama_vision.extract_spec(slide)
        json.dump(spec, open(cache, "w"), indent=2)
    spec_build.build_from_spec(slug, spec)
    score = diff.make(slug)
    return {"slug": slug, "score": score,
            "nodes": len(spec.get("nodes", [])), "containers": len(spec.get("containers", [])),
            "secs": round(time.time() - t0, 1)}


def run(slugs, workers=2):
    results = []
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(process, s): s for s in slugs}
        for f in as_completed(futs):
            try:
                r = f.result(); results.append(r)
                print(f"  {r['slug']}: diff={r['score']} nodes={r['nodes']} "
                      f"containers={r['containers']} ({r['secs']}s)")
            except Exception as e:
                print(f"  {futs[f]}: ERROR {e}")
    return results


if __name__ == "__main__":
    slugs = [a for a in sys.argv[1:] if not a.startswith("-")]
    workers = 1 if "--serial" in sys.argv else 2
    print(f"offline pipeline: {len(slugs)} slug(s), {workers} worker(s), model={ollama_vision.MODEL}")
    run(slugs, workers)
