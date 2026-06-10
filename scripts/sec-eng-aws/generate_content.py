#!/usr/bin/env python3
"""
Generate module notes + quiz questions + flashcards for the Security Engineering
on AWS course, GROUNDED in the extracted slide text (no invention).

Per teachable module (M01-M08) calls OpenAI once with the module's slide text and
returns strict JSON. Output: _extracted/generated/<moduleId>.json
"""
import os, sys, json, re
from pathlib import Path
import importlib.util

HERE = Path(__file__).parent
EXTRACT = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
GEN = EXTRACT / "generated"
GEN.mkdir(exist_ok=True)
GEN_MODEL = "gpt-4o-mini"

# reuse env loader from ingest_rag
spec = importlib.util.spec_from_file_location("ig", HERE / "ingest_rag.py")
ig = importlib.util.module_from_spec(spec); spec.loader.exec_module(ig)

# teachable modules -> (moduleId, default title)
MODULES = {
    "M01": ("sec-eng-m01", "Security on AWS"),
    "M02": ("sec-eng-m02", "Identity and Access Management"),
    "M03": ("sec-eng-m03", "Account Management and Provisioning"),
    "M04": ("sec-eng-m04", "Secrets Management"),
    "M05": ("sec-eng-m05", "Data Security"),
    "M06": ("sec-eng-m06", "Infrastructure and Edge Protection"),
    "M07": ("sec-eng-m07", "Logging and Monitoring"),
    "M08": ("sec-eng-m08", "Responding to Threats"),
}


def slide_text_for(module):
    out = []
    with open(EXTRACT / "slides.jsonl") as f:
        for line in f:
            s = json.loads(line)
            if s["module"] != module:
                continue
            body = "\n".join(x for x in [s.get("title", ""), s.get("text", ""), s.get("notes", "")] if x).strip()
            if len(body) >= 30:
                out.append(f"--- slide {s['slide_no']} ---\n{body}")
    return "\n\n".join(out)


SCHEMA_HINT = """Return ONLY valid JSON with this exact shape:
{
  "title": "<concise module title>",
  "subtitle": "<one-line description>",
  "readingMinutes": <int 10-20>,
  "intro": "<2-4 sentence intro paragraph>",
  "sections": [
    {"heading": "<section heading>",
     "body": "<2-4 paragraphs, markdown allowed, use \\n\\n between paragraphs; **bold** for key terms>",
     "keyPoints": ["<takeaway>", "<takeaway>", "<takeaway>"]}
  ],
  "examTips": ["<exam-relevant tip>", "..."],
  "flashcards": [{"front": "<term or question>", "back": "<concise definition/answer>"}],
  "quiz": [
    {"text": "<scenario question>",
     "options": ["<opt A>", "<opt B>", "<opt C>", "<opt D>"],
     "correctIndex": <0-3>,
     "explanation": "<why the answer is correct>",
     "difficulty": "intermediate"}
  ]
}
Provide 5-7 sections, 4-6 examTips, exactly 14 flashcards, and exactly 8 quiz questions."""


def generate(module, slide_text):
    from openai import OpenAI
    oa = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    sys_prompt = (
        "You are an AWS security curriculum author. You write study material for the "
        "official 'Security Engineering on AWS' course. Ground EVERYTHING strictly in the "
        "provided slide text — do not invent services or facts not supported by the slides. "
        "Write clear, exam-relevant content for cloud security engineers. " + SCHEMA_HINT
    )
    user = f"SLIDE TEXT for this module:\n\n{slide_text[:14000]}"
    resp = oa.chat.completions.create(
        model=GEN_MODEL,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": sys_prompt},
                  {"role": "user", "content": user}],
    )
    return json.loads(resp.choices[0].message.content)


def main():
    ig.load_env(ig.ENV_FILE)
    only = sys.argv[1:] if len(sys.argv) > 1 else list(MODULES.keys())
    for mod in only:
        mid, default_title = MODULES[mod]
        text = slide_text_for(mod)
        print(f"{mod} ({mid}): {len(text)} chars of slide text -> generating ...")
        data = generate(mod, text)
        data["moduleId"] = mid
        if not data.get("title"):
            data["title"] = default_title
        data["sourceModule"] = mod
        out = GEN / f"{mid}.json"
        json.dump(data, open(out, "w"), indent=2, ensure_ascii=False)
        nsec = len(data.get("sections", [])); nq = len(data.get("quiz", [])); nf = len(data.get("flashcards", []))
        print(f"   -> {out.name}: {nsec} sections, {nq} quiz Qs, {nf} flashcards")


if __name__ == "__main__":
    main()
