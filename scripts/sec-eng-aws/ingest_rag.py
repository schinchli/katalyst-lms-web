#!/usr/bin/env python3
"""
Ingest Security Engineering on AWS content into the LMS RAG store.

Embeds with OpenAI text-embedding-3-small (1536-d) and upserts into the
Supabase `knowledge_chunks` table, idempotent on (corpus, content_hash) —
matching the existing /api/admin/rag-ingest pipeline.

Usage:
  python3 ingest_rag.py slides         # ingest extracted PPTX slides
  python3 ingest_rag.py file <path>    # ingest a JSON file of rows
                                       # [{corpus,source_type,title,content,metadata}]
"""
import os, sys, json, hashlib, time
from pathlib import Path

EXTRACT = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
ENV_FILE = Path("/Users/schinchli/Documents/Projects/lms/apps/web/.env.local")
EMBED_MODEL = "text-embedding-3-small"
CORPUS_SLIDES = "sec-eng-aws"


def load_env(p: Path):
    if not p.exists():
        return
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        # tolerate stray literal escapes that exist in this repo's .env.local
        v = v.replace("\\n", "").replace("\\r", "").strip()
        os.environ.setdefault(k.strip(), v)


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def build_slide_rows():
    rows = []
    with open(EXTRACT / "slides.jsonl") as f:
        for line in f:
            s = json.loads(line)
            body = "\n".join(x for x in [s.get("text", ""), s.get("notes", "")] if x).strip()
            if len(body) < 40:           # skip near-empty title/section slides
                continue
            mod = s["module"]
            title = (s.get("title") or "").strip()
            if len(title) < 3 or title.isdigit():
                # fall back to first meaningful line of the slide body
                first = next((ln.strip() for ln in s.get("text", "").splitlines()
                              if len(ln.strip()) >= 4 and not ln.strip().isdigit()), "")
                title = first[:120] or f"{mod} slide {s['slide_no']}"
            content = f"[{mod} · slide {s['slide_no']}] {title}\n{body}"[:4000]
            rows.append({
                "corpus": CORPUS_SLIDES,
                "source_type": "slide",
                "title": title[:200],
                "content": content,
                "metadata": {
                    "module": mod,
                    "slide_no": s["slide_no"],
                    "deck": s["deck"],
                    "course": "Security Engineering on AWS",
                },
            })
    return rows


def ingest(rows, batch=50):
    """Embed via OpenAI, upsert into knowledge_chunks.

    Backend: uses supabase-py when available (run with ./.venv/bin/python after
    `pip install -r requirements.txt`); otherwise falls back to Supabase PostgREST
    via httpx (which ships with openai), so it still works under system python
    where PEP 668 blocks `pip install supabase`.
    """
    from openai import OpenAI

    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_SECRET_KEY"]
    oa = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    # Pick the upsert backend once.
    try:
        from supabase import create_client
        sb = create_client(url, key)

        def do_upsert(payload):
            sb.table("knowledge_chunks").upsert(payload, on_conflict="corpus,content_hash").execute()
        backend = "supabase-py"
        client_cm = None
    except Exception:
        import httpx
        rest = f"{url}/rest/v1/knowledge_chunks?on_conflict=corpus,content_hash"
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        client_cm = httpx.Client(timeout=60)

        def do_upsert(payload):
            resp = client_cm.post(rest, headers=headers, json=payload)
            if resp.status_code >= 300:
                raise RuntimeError(f"{resp.status_code} {resp.text[:300]}")
        backend = "httpx/PostgREST"

    # de-dupe within this run on content_hash
    uniq = {}
    for r in rows:
        h = sha256(r["content"])
        r["content_hash"] = h
        uniq[(r["corpus"], h)] = r
    rows = list(uniq.values())

    total = len(rows)
    inserted = errors = 0
    by_corpus = {}
    print(f"Embedding + upserting {total} chunks via {backend} ...")
    try:
        for i in range(0, total, batch):
            chunk = rows[i:i + batch]
            try:
                emb = oa.embeddings.create(model=EMBED_MODEL, input=[c["content"] for c in chunk])
            except Exception as e:
                print(f"  embed error batch {i}: {e}")
                errors += len(chunk)
                continue
            payload = []
            for c, e in zip(chunk, emb.data):
                payload.append({
                    "corpus": c["corpus"],
                    "source_type": c["source_type"],
                    "content_hash": c["content_hash"],
                    "title": c["title"],
                    "content": c["content"],
                    # pgvector accepts the bracketed text literal; cast is reliable both ways
                    "embedding": "[" + ",".join(f"{x:.6f}" for x in e.embedding) + "]",
                    "metadata": c["metadata"],
                })
            try:
                do_upsert(payload)
                inserted += len(payload)
                for c in chunk:
                    by_corpus[c["corpus"]] = by_corpus.get(c["corpus"], 0) + 1
            except Exception as e:
                print(f"  upsert error batch {i}: {e}")
                errors += len(payload)
            print(f"  {min(i+batch,total)}/{total}")
            time.sleep(0.15)
    finally:
        if client_cm is not None:
            client_cm.close()
    print(f"\nDone. upserted={inserted} errors={errors}")
    print("per corpus:", json.dumps(by_corpus, indent=2))


def main():
    load_env(ENV_FILE)
    mode = sys.argv[1] if len(sys.argv) > 1 else "slides"
    if mode == "slides":
        rows = build_slide_rows()
        print(f"Built {len(rows)} slide chunks from PPTX extraction.")
        ingest(rows)
    elif mode == "file":
        rows = json.load(open(sys.argv[2]))
        print(f"Loaded {len(rows)} rows from {sys.argv[2]}.")
        ingest(rows)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
