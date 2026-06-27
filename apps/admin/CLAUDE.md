# Katalyst LMS — Admin App · Claude Code Instructions

> Scope: `apps/admin/` only. Inherits the root `../../CLAUDE.md`.
> Stack: Next.js (App Router) + Vuexy/Katalyst theme. Part of the Turborepo monorepo.

---

## ⚡ TOKEN-LEAN BUILD MODE (MANDATORY)

When building, type-checking, or iterating on the Admin app, **minimise token consumption**.
Follow these rules every time:

### 1. Build only the admin app — never the whole monorepo
```bash
# CORRECT — scoped to admin, no fan-out across web/mobile
npm run build  --workspace apps/admin
npm run type-check --workspace apps/admin
# or, with turbo, filter to just this package (use the package name, not the path):
npx turbo run build --filter=@lms/admin
```
🚫 Do NOT run a root `turbo build` / `next build` for the whole repo to test an admin change.

### 2. Stream-trim build output — read tails, not full logs
- Pipe long output to a file and read only the tail / errors:
  ```bash
  npm run build --workspace apps/admin 2>&1 | tail -30
  npm run build --workspace apps/admin 2>&1 | grep -E "error|Error|failed|✓ Compiled" | head -40
  ```
- Never paste a full Next.js build log into context. Capture → grep → read only what failed.

### 3. Type-check before build
`tsc --noEmit` is far cheaper than a full Next build. Run `type-check` first; only run `build`
once types are clean. This catches most issues without the bundler pass.

### 4. Don't re-read what you just wrote
After Edit/Write, trust the tool result. Do not re-Read the file to "verify" — the harness
already tracks state. Re-reading large generated/theme files burns tokens for nothing.

### 5. Touch the smallest surface
- Edit single files with targeted `Edit`; avoid rewriting whole theme/config files.
- The Vuexy theme under `src/@custom/theme` is large and generated — reference it, don't reprint it.
- Use `grep`/`find` to locate symbols instead of reading whole directories.

### 6. Cache-aware iteration
Next.js `.next/` and turbo cache make repeat builds cheap — do NOT `rm -rf .next` between
iterations unless a cache corruption is proven. Let the incremental cache do its job.

### 7. One verification pass, then stop
Build once, confirm green, stop. No speculative re-builds, no "let me also check…" sweeps
unless an error actually appears.

---

## Layout
| Path | Purpose |
|------|---------|
| `src/@custom/theme` | Vuexy → Katalyst theme (generated — reference, don't reprint) |
| `src/configs` | App configuration |
| `scripts/setup-vuexy.sh` · `sync-vuexy.sh` | Theme ingestion from Vuexy source |

## Scripts
`dev` · `build` · `start` · `lint` · `type-check` · `setup-vuexy` · `sync-vuexy`

Always prefer `--workspace apps/admin` (npm) or `--filter=@lms/admin` (turbo) so commands
never fan out across `apps/web` and `mobile`.
