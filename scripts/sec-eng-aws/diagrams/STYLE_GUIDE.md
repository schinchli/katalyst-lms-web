# draw.io diagram recreation — style guide (Security Engineering on AWS)

Goal: faithfully recreate AWS course architecture/flow diagrams in draw.io, matching
the original layout, labels, arrows, numbered steps, and AWS color language.

## Workflow (per diagram — DO ALL STEPS)
1. **Read the original** image with the Read tool: `_extracted/images/<file>` (renders visually).
2. Author a `.drawio` file at `diagrams/src/<slug>.drawio`.
3. Export: `drawio -x -f png --scale 2 --border 10 -o diagrams/png/<slug>.png diagrams/src/<slug>.drawio --no-sandbox`
4. **Read your exported PNG** and compare to the original. Fix overlaps, wrong icons, missing nodes/arrows/step-numbers, wrong colors.
5. Iterate steps 2–4 until it faithfully matches. Then move on.

Base dir for all paths: `/Users/schinchli/Documents/Projects/lms/scripts/sec-eng-aws`
Originals dir: `/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted/images`

## Approved reference example
`diagrams/src/m02-cross-account-assumerole.drawio` — study it. Same canvas approach,
purple step badges, white-background edge labels, AWS resourceIcon sprites.

## VERIFIED sprite names (these RENDER correctly in the CLI — use only these)
Format: `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.<NAME>;` with a `fillColor`.
| Need | resIcon NAME | fillColor |
|---|---|---|
| S3 bucket | `s3` or `bucket` | `#7AA116` (green) |
| IAM role (hat) | `role` | `#DD344C` (red) |
| IAM (lock/card) | `identity_and_access_management` | `#DD344C` |
| Key / credentials | `key_management_service` | `#DD344C` |
| Certificate / Private CA | `certificate_manager` | `#DD344C` |
| Directory Service / AD | `directory_service` | `#DD344C` |

Plain shapes (NOT resourceIcon — use `shape=mxgraph.aws4.<NAME>` directly), color via fillColor:
| Need | shape NAME | fillColor |
|---|---|---|
| Single user | `user` | `#DD344C` (red, to match decks) or `#232F3E` |
| Group of users | `users` | `#232F3E` |

### Icons WITHOUT a reliable sprite — render as a labeled rounded box instead
AWS STS, Cognito, Organizations, Control Tower, Service Catalog, SCP, IdP, generic
"AWS account/OU" — use a rounded rect: `rounded=1;whiteSpace=wrap;html=1;fillColor=<color>;strokeColor=none;fontColor=#FFFFFF;fontStyle=1;`
AWS service colors: security/identity red `#DD344C`; management/governance `#E7157B` or `#CD2264`;
generic AWS dark `#232F3E`; brand purple boxes (companies/emphasis) `#7C3AED`.
Boundary/cloud containers: `rounded=1;fillColor=none;strokeColor=#232F3E;dashed=0;verticalAlign=top;` with a label like "AWS Cloud" / "OU=Dev". Use dashed for logical boundaries (e.g. Organization boundary): `dashed=1;strokeColor=#DD344C`.

## Conventions
- Canvas: pageWidth ~1000, pageHeight sized to content. direction top→bottom or left→right per original.
- Numbered step badges: `ellipse;fillColor=#3B1E66;strokeColor=none;fontColor=#FFFFFF;fontSize=13;fontStyle=1;` 26x26, value = the number. Place ON/near the relevant arrow but NOT overlapping its label.
- Edge labels: add `labelBackgroundColor=#FFFFFF;` and use an offset `<mxGeometry relative="1" as="geometry"><mxPoint x="0" y="-16" as="offset"/></mxGeometry>` so the text sits clear of badges/lines.
- Arrows: solid `endArrow=block;strokeColor=#3B1E66;strokeWidth=2;`; dashed for "returns/optional" `dashed=1`. Structural (no head) `endArrow=none;strokeColor=#7C3AED;strokeWidth=2;`.
- Escape `&` as `&amp;`, `'` as `&#39;`, accented chars as entities, `<br>` as `&lt;br&gt;` inside value attrs.
- Icon nodes use `verticalLabelPosition=bottom;verticalAlign=top;align=center;` so labels sit under the icon.

## Output requirement
Each diagram must end with BOTH files present and the PNG visually faithful:
- `diagrams/src/<slug>.drawio`
- `diagrams/png/<slug>.png`
Return a short list of which slugs you completed and any you could not match well.
