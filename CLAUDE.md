# Katalyst LMS — Claude Code Instructions

> **Last Updated:** 2026-03-08
> **Platform:** AWS Cloud & GenAI Certification Prep (Katalyst)
> **Branch:** `feature/task-2-event-driven-leaderboard`

---

## Project Overview

**Katalyst** is a full-stack LMS for AWS Cloud and GenAI certification preparation.

| Layer | Tech | Location |
|-------|------|----------|
| Web portal | Next.js 15 App Router | `apps/web/` |
| Mobile app | Expo SDK 54 (React Native 0.81) | `mobile/` |
| Backend | AWS Lambda + TypeScript | `backend/lambdas/` |
| Infra (planned) | AWS CDK | `infrastructure/cdk/` |
| Monorepo | Turborepo | root |

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/data/quizzes.ts` | Quiz metadata registry (all quiz entries + quizQuestions map) |
| `apps/web/src/data/clf-c02-questions.ts` | CLF-C02 questions (195 Qs, 4 domain arrays + combined) |
| `apps/web/src/app/globals.css` | Vuexy design system CSS (tokens + component classes) |
| `apps/web/src/app/dashboard/layout.tsx` | Sidebar, search, dark mode, nav |
| `backend/lambdas/quizSubmit/index.ts` | Quiz submission Lambda |
| `backend/lambdas/progressFetch/index.ts` | Progress fetch Lambda |
| `backend/lambdas/leaderboardFetch/index.ts` | Leaderboard Lambda |
| `CHANGELOG.md` | Version history |
| `FEATURES.md` | Feature matrix (done + planned) |
| `EXECUTION_TRACKER.md` | Detailed task progress |

---

## Development Commands

```bash
# Web portal (from apps/web/)
npm run dev          # Next.js dev server on :3000
npm run type-check   # tsc --noEmit

# Backend tests (from backend/)
npm test             # Jest — 49 tests
npm run test:coverage  # With lcov report

# Monorepo (from root lms/)
npm run dev          # All workspaces parallel
npm run build        # Turborepo build
```

---

## Git Structure

**Repo root:** `~` (home directory) → `How-to-Become-an-AWS-Solutions-Architect.git`

| Path | Tracking |
|------|----------|
| `apps/web/`, `backend/`, `packages/`, `ios/`, `docs/` | Regular tracked files |
| `mobile/` | **Git submodule** → `katalyst-mobile.git` (has its own commits + remote) |
| `apps/web/.next/` | Ignored (build cache — in `.gitignore`) |
| `.kiro/` | Ignored (IDE config — in `.gitignore`) |

### Pre-Commit Checklist (run every time)
1. `npx tsc --noEmit` from `apps/web/` — zero errors required
2. `npm test` from `backend/` — all 49 tests must pass
3. Check for untracked files: `git status --short Documents/Projects/lms/ | grep "^??" | grep -v ".next/"` — must be empty
4. For mobile changes: commit inside `mobile/` separately, then update the submodule pointer here

### .gitignore Coverage
The `lms/.gitignore` excludes: `node_modules/`, `.next/`, `.kiro/`, `.expo/`, `dist/`, `build/`, `ios/Pods/`, `android/`, `coverage/`, `.env*`, `*.tsbuildinfo`

---

## Architecture Decisions

### Design System
- **Vuexy** admin template used as visual reference (NOT installed — replicated via CSS)
- **Public Sans** font (Google Fonts), weights 300–700
- CSS tokens: `--primary: #7367F0`, `--text: #4B465C`, `--bg: #F8F7FA`
- All structural styling in `globals.css` via class names
- Only data-driven values (accent color per quiz difficulty) as inline styles

### Quiz Data
- Quiz metadata lives in `apps/web/src/data/quizzes.ts` — `Quiz[]` array + `quizQuestions` record
- Large question sets (CLF-C02, etc.) go in **separate files** and are imported — do NOT inline in `quizzes.ts`
- Each quiz: `{ id, title, category, certLevel, difficulty, examCode, questionCount, duration, questions[] }`
- Quiz results persisted to `localStorage` (`quiz-results` key)
- Profile persisted to `localStorage` (`profile-name`, `profile-email`, `profile-role`)
- Current counts: **400+ questions**, 14 GenAI categories, CLF-C02 (195 Qs across 5 sub-quizzes)

### Backend Lambdas
- Auth via Cognito JWT Authorizer — `event.requestContext.authorizer?.claims?.sub`
- All handlers follow: auth check → parse/validate (Zod) → DynamoDB writes → EventBridge → response
- CORS header `Access-Control-Allow-Origin: *` on ALL responses (including errors)
- `calculateRewards` exported for unit testing

### EventBridge
- Event bus name: `lms-events` (env var `EVENT_BUS_NAME`)
- Event: `{ Source: 'lms', DetailType: 'lms.quiz.submitted', Detail: {...} }`

---

## Testing Standards

- Framework: Jest + ts-jest
- Mock library: `aws-sdk-client-mock` + `aws-sdk-client-mock-jest`
- Coverage targets: statements ≥90%, functions 100%, lines ≥90%, branches ≥80%
- **Current:** 49 tests, 100% statements/functions/lines, 93.8% branches
- Test files: `lambdas/<name>/__tests__/<name>.test.ts`

---

## Vercel Deployment

**Repo:** `katalyst-lms-web` (standalone, at `Documents/Projects/lms/`)
**URL:** `https://lms-amber-two.vercel.app`
**Build:** `cd apps/web && npm run build` | Install: `cd apps/web && npm install --legacy-peer-deps`

### Deploy Command
```bash
# From Documents/Projects/lms/
vercel --prod --yes
# Never use --archive=tgz — if you need it, the .vercelignore is broken
```

### CRITICAL — What Gets Uploaded (54 files only)
Vercel receives **only** `apps/web/src/`, `apps/web/` config files, and `vercel.json`.
Everything else is blocked by `.vercelignore`.

### What `.vercelignore` Excludes (NEVER remove these)
| Excluded | Reason |
|---|---|
| `apps/admin/` | Not a web deployment |
| `packages/` | Not imported by `apps/web` |
| `backend/` | AWS Lambda — separate deployment |
| `mobile/` | Expo/React Native — not web |
| `infrastructure/` | AWS CDK — separate deployment |
| `ios/`, `supabase/`, `frontend/`, `docs/` | Not needed at build time |
| `apps/web/e2e/`, `apps/web/scripts/` | Test/tooling only |
| `apps/web/jest.config.ts`, `playwright.config.ts` | Test config |
| `**/__tests__/`, `**/*.test.ts`, `**/*.spec.*` | All test files |
| `**/node_modules/`, `apps/web/.next/` | Rebuilt on Vercel |
| `apps/web/src/data/*_backup_*` | Data backups |
| `*.md`, `turbo.json`, `app.json` | Docs/Expo/monorepo config |
| `.github/`, `.vscode/`, `.kiro/`, `.DS_Store` | IDE/CI/OS noise |

### If Upload Exceeds ~100 Files — Red Flag
The `.vercelignore` is misconfigured or a new folder was added without excluding it.
**Do not use `--archive=tgz` as a workaround** — fix `.vercelignore` first.

### Deploying New Folders
When adding a new top-level folder to the repo, **immediately decide**:
- Is it needed by `apps/web` at build time? If NO → add it to `.vercelignore` before committing.

### Admin Access (Settings page)
- Settings nav item is only shown when `isAdmin === true` (set by `/api/admin/check`)
- `ADMIN_EMAILS` env var in Vercel controls who is admin (currently `schinchli@gmail.com`)
- Settings page has its own server-side guard — non-admins are redirected to `/dashboard`

---

## CI/CD

GitHub Actions: `.github/workflows/ci.yml`
- Triggers on PR/push to `main`, `develop`, `feature/**`
- Jobs: `backend-tests` → `web-type-check` → `web-build` + `mobile-type-check` → `ci-passed` gate

---

## Coding Rules

1. **No new files unless necessary** — edit existing files first
2. **Types over `any`** — always use proper TypeScript types
3. **No inline styles for structure** — use CSS classes in `globals.css`
4. **All lambda responses include CORS header** — no exceptions
5. **Zod for all Lambda input validation** — no manual checks
6. **Export pure functions** for testability (`calculateRewards`, etc.)
7. **No `console.log` in production code** — use structured logging if needed
8. **Update CHANGELOG.md** after every significant feature
9. **Run `npm test` before any commit** to backend
10. **Run `npx tsc --noEmit`** before any commit to web/mobile
11. **Large question sets** → separate `*-questions.ts` file, import into `quizzes.ts`
12. **Check git coverage** before every commit (see Pre-Commit Checklist above)

---

## What NOT To Do

- Do NOT install Vuexy package — replicate styles via CSS
- Do NOT add new npm packages without checking if existing ones suffice
- Do NOT commit without running tests
- Do NOT use `style={{}}` for structural layout — use `className`
- Do NOT hardcode AWS resource names — use environment variables
- Do NOT skip CORS headers on Lambda responses
- Do NOT inline large question arrays directly in `quizzes.ts` — use separate import files
- Do NOT commit `.next/` build cache or `node_modules/`
- Do NOT `git add .` from `~` root — always add specific `Documents/Projects/lms/` paths
- **Do NOT deploy to Vercel with `--archive=tgz`** — that flag masks a broken `.vercelignore`; fix the ignore rules instead
- **Do NOT push test files, data backups, docs, backend, mobile, or infra to Vercel** — only `apps/web/` source belongs there
- **Do NOT add a new folder without updating `.vercelignore`** — decide at creation time whether Vercel needs it
