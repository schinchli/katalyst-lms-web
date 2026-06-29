# AWS Diagram Style Rules — Security Engineering on AWS

Extracted from the **original course slides** (`apps/web/public/sec-eng-aws/slides/*.png`).
These are the rules `aws_style.py` encodes. Follow them for every diagram so the whole
course looks uniform and matches AWS's own decks.

> **Golden rule:** the original slide is the source of truth. Generate → run `compare(slug)`
> → check the side-by-side → fix only what differs (nomenclature, layout, icon size/colour).

## 1. Mode & background
- **Light mode only.** White canvas. No dark/black filled boxes anywhere — subnets are
  light tints, never dark. (This was an explicit requirement.)

## 2. Palette (verified, in `P`)
| Token | Hex | Use |
|---|---|---|
| `INK` | `#232F3E` | title, body text, arrows, the user glyph |
| `BADGE` | `#3B1E66` | step badges — A/B/C **and** 1/2/3 (deep AWS-training purple, solid, no border) |
| `COMPUTE` | `#ED7100` | EC2 / compute icons |
| `NETWORK` | `#8C4FFF` | VPC networking (Internet gateway, NAT, ELB) |
| `STORAGE` | `#7AA116` | S3 / storage |
| `VPC_GREEN` | `#248814` | VPC border + label |
| `PUB_FILL` / `PUB_ACCENT` | `#E8F5E9` / `#7AA116` | public subnet fill + **green** lock |
| `PRIV_FILL` / `PRIV_ACCENT` | `#E6F2F8` / `#00A4D9` | private subnet fill + **blue** lock |
| `AZ_BLUE` | `#00A4D9` | Availability Zone dashed border |
| `DB_BLUE` | `#527FFF` | database |
| `SECURITY` | `#DD344C` | security/identity emphasis (KMS, IAM, guard rails) |

## 3. Layout conventions
- Canvas ~`1040 × 640` for a single horizontal flow; grow height for vertical flows.
- **Top→bottom or left→right** to match the original's reading direction.
- Title: top-left, `#232F3E`, bold, `fontSize=26`, exact slide wording (don't rename).
- VPC: official `group_vpc` shape — green border + cloud icon + "VPC" label; CIDR bottom-left.
- Availability Zone: dashed blue box, label centred at top.
- **Subnets: `d.subnet(...)`** — light fill + a coloured padlock (green public / blue private)
  drawn from primitives. NEVER use `group_public_subnet`/`group_private_subnet` grIcons —
  they do **not** render under the headless CLI (the lock vanishes).

## 4. Icons
- Use `d.icon(id, x, y, resicon, colour, label)` — only sprite names in `VERIFIED_ICONS`
  render headless. Unknown service → `d.box(...)` labelled rounded box in the category colour
  (per the original style guide: STS, Cognito, Organizations, Control Tower, SCP, IdP, etc.).
- **boxed vs unboxed (critical):** services on the slides are filled category squares
  (EC2 orange, DB blue) → `boxed=True` (default). Line-art icons (the **user** = outline
  person, the **Internet gateway** = purple outline circle, NAT, etc.) are NOT squares →
  call with `boxed=False` (plain glyph). Using a boxed user/gateway produces a dark/purple
  "black box", which is wrong. `d.user(...)` is already unboxed.
  Note: plain glyphs need a real `fillColor` (e.g. `P.INK`, `P.NETWORK`); `fillColor=none`
  renders blank under the CLI.
- Icon size: **56×56** for services, **44×44** for the user, **52×52** for the gateway.
- Labels sit **under** the icon (`verticalLabelPosition=bottom`).

## 5. Badges & flows
- Step badges: `d.badge(x, y, "A")` — 32px, solid `#3B1E66`, white bold text, **no border**.
  A/B/C label data flows (on the arrows); 1/2/3 label trust boundaries (free-floating, as on
  the slide). Both are the same purple — the slide does not colour-separate them.
- Data flow arrows: `d.flow(src, tgt)` — double-headed, `#232F3E`, 1.5px.
- Plain connectors (user→gateway): `d.link(src, tgt)` — no arrowheads.

## 6. App write-up (the "explain steps under the diagram" requirement)
- The diagram stays faithful to the slide; the **step explanations live in the app**, in
  `sec-eng-aws-notes.ts` on the section: `diagramFormat: "svg"`, `diagramSteps: DiagramStep[]`.
- Each `DiagramStep` = `{ label, title, detail, kind }` where `kind` is `"flow"` (A/B/C) or
  `"boundary"` (1/2/3). Detail must **accurately match what the badge points to** in the diagram.
- The notes page renders SVG responsively + a step panel (purple flow badge / red boundary badge).

## 7. Output pipeline (handled by `save`/`render`)
- Writes `diagrams/src/<slug>.drawio`, exports `diagrams/png/<slug>.png` (scale 2) and
  `diagrams/svg/<slug>.svg`, copies both into `apps/web/public/sec-eng-aws/notes/` and the PNG
  into `mobile/assets/images/sec-eng-aws/notes/`.
- Slug = the `diagram` id used in `sec-eng-aws-notes.ts` (e.g. `m02-cross-account-assumerole`).

## 8. Per-diagram checklist (do every time, no exceptions)
1. Open the original: `apps/web/public/sec-eng-aws/slides/<slug>.png` (Read it).
2. Write a short build script using `aws_style` components.
3. `save(slug)` → `compare(slug)` → Read the `__compare.png`.
4. Fix nomenclature, layout, icon size/colour until it matches. Then move on.
