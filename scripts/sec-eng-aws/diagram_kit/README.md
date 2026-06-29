# Security Engineering on AWS — Diagram Kit (offline)

Generate course architecture diagrams **fast, accurately, and cheaply** by assembling them
from tested AWS components instead of hand-writing draw.io XML. Built to match the original
course slides 1:1 and to feed the LMS notes pages (diagram + per-step write-up, responsive).

## Files
| File | Purpose |
|---|---|
| `aws_style.py` | The engine — `Diagram` class + verified components (`vpc`, `az`, `subnet`, `icon`, `user`, `badge`, `flow`, `link`) + `render`/`compare`/`save`. |
| `STYLE_RULES.md` | The rules extracted from the real slides (palette, layout, icons, badges). Read first. |
| `build_m01_data_flow.py` | Worked example — the m01 data-flow diagram. Copy this as the template for new diagrams. |

## Why it's token-lean & accurate
- One diagram ≈ **~25 lines** of component calls vs ~200 lines of raw XML.
- Only **verified** sprite names are used; unknown services fall back to a labelled box — no
  render guesswork, no black boxes, no trial-and-error on colours.
- `compare(slug)` stitches **original-slide-over-recreation** into one PNG so a single Read
  verifies fidelity — no back-and-forth.

## Workflow (per diagram)
```bash
cd scripts/sec-eng-aws/diagram_kit
# 1. Read the original slide: apps/web/public/sec-eng-aws/slides/<slug>.png
# 2. Write build_<slug>.py using aws_style components (copy build_m01_data_flow.py)
python3 build_<slug>.py          # writes .drawio, exports PNG+SVG, copies to web+mobile, builds __compare.png
# 3. Read diagrams/png/<slug>__compare.png — fix anything that differs, rerun.
```

Then add the step write-up in `apps/web/src/data/sec-eng-aws-notes.ts` on the matching section:
```ts
diagramFormat: "svg",
diagramSteps: [
  { label: "A", kind: "flow",     title: "...", detail: "..." },
  { label: "1", kind: "boundary", title: "...", detail: "..." },
],
```
The notes page renders the SVG responsively with the step panel beneath it.

## Requirements
- `drawio` CLI on PATH (`/opt/homebrew/bin/drawio`). Exports run headless (`--no-sandbox`).
- `Pillow` (optional) for `compare()`; without it, Read the original and recreation separately.

## Rollout status
- [x] **m01-data-flow-diagram** — built from the kit, matches the slide (green/blue subnet locks).
- [ ] M02–M08 (46 diagrams) — same workflow, one `build_<slug>.py` each.

See `STYLE_RULES.md` §8 for the per-diagram checklist.
