# Katalyst LMS

**AWS & GenAI Certification Prep Platform**

Katalyst is a full-stack Learning Management System for AWS Cloud and GenAI certification
preparation. It includes a quiz engine, live leaderboard, progress tracking, freemium paywall,
and an admin dashboard — secured from client to database with a zero-trust posture.

**Live:** https://lms-amber-two.vercel.app

---

## Stack

| Layer | Technology |
|-------|-----------|
| Web portal | Next.js 15 App Router (TypeScript) |
| Styling | Vuexy design system (CSS-only replica, no package) |
| Auth | Supabase Auth (email + password + email confirmation) |
| Database | Supabase PostgreSQL + Row Level Security |
| Bot protection | Google reCAPTCHA v3 |
| Deployment | Vercel (serverless functions) |
| Mobile | Expo SDK 54 / React Native 0.81 (submodule) |
| Backend | AWS Lambda + TypeScript (implemented, future integration) |
| Monorepo | Turborepo |

---

## Repository Structure

```
lms/
├── apps/
│   └── web/                          # Next.js 15 web portal
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/              # Vercel serverless API routes
│       │   │   │   ├── admin/
│       │   │   │   │   ├── check/        GET  — admin role check
│       │   │   │   │   └── purchases/    GET  — all-platform purchases
│       │   │   │   ├── leaderboard/      GET  — public leaderboard
│       │   │   │   ├── quiz-submit/      POST — server-side score validation
│       │   │   │   ├── quizzes/stats/    GET  — student count per quiz
│       │   │   │   ├── recaptcha/verify/ POST — reCAPTCHA v3 verification
│       │   │   │   ├── setup-db/         POST — one-shot DB schema setup
│       │   │   │   └── sync-user/        POST/GET — profile sync
│       │   │   ├── dashboard/
│       │   │   │   ├── admin/            admin analytics (admin-only)
│       │   │   │   ├── leaderboard/      live leaderboard
│       │   │   │   ├── learn/            learning resources
│       │   │   │   ├── profile/          user profile + appearance theme
│       │   │   │   ├── progress/         quiz progress + history
│       │   │   │   ├── quiz/[id]/        quiz engine (intro → quiz → results)
│       │   │   │   ├── quizzes/          quiz catalogue + search
│       │   │   │   └── settings/         admin: AdSense + upsell copy
│       │   │   ├── login/               sign in
│       │   │   ├── signup/              sign up
│       │   │   ├── reset-password/      password reset request
│       │   │   └── update-password/     set new password (from email link)
│       │   ├── components/
│       │   │   └── AdBanner.tsx         Google AdSense banner
│       │   ├── data/
│       │   │   ├── quizzes.ts           quiz metadata + question registry
│       │   │   └── clf-c02-questions.ts CLF-C02 question bank (195 Qs)
│       │   ├── hooks/
│       │   │   ├── useSubscription.ts   freemium subscription state
│       │   │   └── useRecaptcha.ts      reCAPTCHA v3 hook
│       │   ├── lib/
│       │   │   ├── db.ts                Supabase CRUD helpers (client-side)
│       │   │   ├── logger.ts            structured JSON logger
│       │   │   ├── rateLimiter.ts       in-memory rate limiter
│       │   │   ├── recaptcha.ts         reCAPTCHA server-side verify
│       │   │   ├── schemas.ts           shared Zod schemas
│       │   │   └── supabase.ts          Supabase client (anon key)
│       │   └── types.ts                 shared TypeScript types
│       ├── next.config.ts              security headers + config
│       └── package.json
├── backend/lambdas/                   AWS Lambda functions (future)
│   ├── quizSubmit/
│   ├── progressFetch/
│   └── leaderboardFetch/
├── mobile/                            Expo app (git submodule)
├── supabase/migrations/               DB migration SQL
├── SECURITY_AUDIT.md                  300-rule compliance audit
├── THREAT_MODEL.md                    STRIDE threat model
├── SECURITY_HEADERS.md                HTTP security headers docs
├── API_SECURITY_REPORT.md             per-route security analysis
└── vercel.json                        Vercel build config
```

---

## API Routes

All routes are serverless functions on Vercel.
**Base URL:** `https://lms-amber-two.vercel.app`

---

### `GET /api/admin/check`

Verifies whether the authenticated user has admin access.
Used by dashboard layout and all admin-guarded pages on every mount.

| Property | Value |
|----------|-------|
| Auth | Bearer JWT (Supabase access token) |
| Rate limit | 30 req / 60 s per IP |
| Payload | None |

**Request:**
```http
GET /api/admin/check
Authorization: Bearer <access_token>
```

**Responses:**
```json
200  { "isAdmin": true }
200  { "isAdmin": false }
401  { "ok": false, "error": "Unauthorized" }
429  { "ok": false, "error": "Too many requests" }
```

**Security:** JWT verified via `supabase.auth.getUser()`. Admin set is read from
`ADMIN_EMAILS` env var — never from localStorage or client state.

---

### `GET /api/admin/purchases`

Returns all platform purchases for admin analytics. Only accessible to admins.

| Property | Value |
|----------|-------|
| Auth | Bearer JWT + email in `ADMIN_EMAILS` |
| Rate limit | 30 req / 60 s per IP |
| Payload | None |

**Request:**
```http
GET /api/admin/purchases
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "ok": true,
  "purchases": [
    {
      "id": "uuid",
      "userId": "uuid",
      "purchaseType": "subscription",
      "plan": "annual",
      "amount": 999,
      "date": "2026-03-01T00:00:00Z"
    }
  ],
  "totalRevenue": 9990
}
```

**Error responses:** 401 (bad token), 403 (not admin), 429 (rate limited), 500 (DB error)

---

### `GET /api/leaderboard`

Returns the top-50 ranked users for a given time period. Public endpoint.

| Property | Value |
|----------|-------|
| Auth | None (public) |
| Rate limit | 60 req / 60 s per IP |
| CDN cache | `max-age=60, s-maxage=60` |

**Query parameters:**
| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `period` | No | `daily`, `monthly`, `alltime` | `alltime` |

**Request:**
```http
GET /api/leaderboard?period=monthly
```

**Response 200:**
```json
{
  "ok": true,
  "entries": [
    {
      "rank": 1,
      "userId": "uuid",
      "name": "Alex C.",
      "avatarInitial": "A",
      "score": 850,
      "coins": 340,
      "streak": 0,
      "quizzesCompleted": 5
    }
  ]
}
```

**Implementation:** Aggregates `quiz_results` by `user_id`, joins `user_profiles`.
Service-role client used server-side to bypass RLS for public aggregate.

---

### `GET /api/quizzes/stats`

Returns the count of distinct students who have attempted a quiz.

| Property | Value |
|----------|-------|
| Auth | None (public) |
| Rate limit | 60 req / 60 s per IP |
| CDN cache | `max-age=300, s-maxage=300` (5 min) |

**Query parameters:**
| Param | Required |
|-------|----------|
| `quiz_id` | Yes |

**Request:**
```http
GET /api/quizzes/stats?quiz_id=clf-c02-full-exam
```

**Response 200:**
```json
{ "ok": true, "studentCount": 142 }
```

**Error responses:** 400 (missing `quiz_id`), 429 (rate limited), 500 (DB error)

---

### `POST /api/quiz-submit`

**Critical security endpoint.** Receives quiz answers, validates timing, calculates
score server-side from authoritative data, and writes to Supabase. The client
cannot inject or forge a score.

| Property | Value |
|----------|-------|
| Auth | Bearer JWT (required) |
| Rate limit | 20 req / 60 s per IP |
| Payload max | 32 KB |

**Request:**
```http
POST /api/quiz-submit
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quizId":    "clf-c02-full-exam",
  "answers":   { "clf-q1": "opt-b", "clf-q2": "opt-a" },
  "startedAt": "2026-03-09T10:00:00.000Z"
}
```

**Zod schema:**
```typescript
{
  quizId:    z.string().min(1).max(100),
  answers:   z.record(z.string(), z.string()),
  startedAt: z.string().datetime({ offset: true }),
}
```

**Response 200:**
```json
{
  "ok": true,
  "score": 42,
  "totalQuestions": 195,
  "timeTaken": 3600,
  "completedAt": "2026-03-09T11:00:00.000Z"
}
```

**Error responses:**
| Code | Cause |
|------|-------|
| 400 | Invalid JSON / Zod failure / elapsed < 5 seconds (suspicious) |
| 401 | Missing or invalid Bearer token |
| 404 | Unknown `quizId` |
| 413 | Payload > 32 KB |
| 429 | Rate limited |
| 500 | DB write failure |

**Security flow:**
1. Verify JWT → get `user.id`
2. Check `Content-Length` ≤ 32 KB
3. Parse + Zod validate body
4. Verify `quizId` exists in `quizQuestions`
5. Validate timing: reject if elapsed < 5s; warn if > duration + 5 min
6. Calculate score from `quizQuestions[quizId][i].correctOptionId`
7. Write via service-role: `upsert({ user_id, quiz_id, score, ... }, { onConflict: 'user_id,quiz_id' })`
8. Return verified `{ score, totalQuestions, timeTaken, completedAt }`

---

### `POST /api/recaptcha/verify`

Verifies a reCAPTCHA v3 token server-side. The reCAPTCHA secret key never
leaves the server.

| Property | Value |
|----------|-------|
| Auth | None (rate-limited) |
| Rate limit | 10 req / 60 s per IP |
| Payload max | 4 KB |

**Request:**
```http
POST /api/recaptcha/verify
Content-Type: application/json

{
  "token":  "03AGdBq...",
  "action": "signup"
}
```

**Zod schema:**
```typescript
{
  token:  z.string(),
  action: z.enum(['login', 'signup', 'reset_password', 'profile_save', 'contact'])
}
```

**Response 200:**
```json
{ "ok": true, "score": 0.9 }
{ "ok": false, "error": "score_too_low" }
{ "ok": true, "score": 0, "note": "recaptcha_skipped" }
```

**Note:** An empty `token` (reCAPTCHA unavailable) returns `ok: true` — reCAPTCHA
is best-effort. The caller decides whether to block on `ok: false`.

---

### `POST /api/sync-user`

Upserts user profile to Supabase `user_profiles` after login or signup.

| Property | Value |
|----------|-------|
| Auth | Bearer JWT (required) |
| Rate limit | 20 req / 60 s per IP |
| Payload max | 8 KB |

**Request:**
```http
POST /api/sync-user
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "supabaseId":  "uuid",
  "email":       "user@example.com",
  "name":        "Jane Smith",
  "accessToken": "<supabase-access-token>",
  "createdAt":   "2026-03-09T10:00:00Z"
}
```

**Response 200:** `{ "ok": true }`

**Error responses:** 400 (validation), 401 (JWT mismatch), 413 (payload > 8 KB), 429 (rate limited)

---

### `GET /api/sync-user`

Health check — returns total platform user count. Authenticated endpoint.

| Property | Value |
|----------|-------|
| Auth | Bearer JWT |
| Rate limit | 10 req / 60 s per IP |

**Response 200:** `{ "ok": true, "totalUsers": 47 }`

---

### `POST /api/setup-db`

One-shot database schema initialization. Creates all tables, RLS policies, triggers.

| Property | Value |
|----------|-------|
| Auth | `x-setup-token` header |
| Rate limit | 3 req / 60 s per IP |

**Warning:** Disable or remove after initial setup. Increases attack surface if left enabled.

---

## Database Schema

All tables have Row Level Security enabled. Policies use `auth.uid()`.

### `user_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | FK → `auth.users.id` |
| `name` | TEXT | Display name |
| `role` | TEXT | e.g. "AWS Learner" |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**RLS:** SELECT + UPDATE for `auth.uid() = id`

### `quiz_results`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID | FK → `auth.users.id` |
| `quiz_id` | TEXT | e.g. "clf-c02-full-exam" |
| `score` | INTEGER | Server-calculated only |
| `total_questions` | INTEGER | |
| `time_taken` | INTEGER | seconds |
| `answers` | JSONB | `{ questionId: optionId }` |
| `completed_at` | TIMESTAMPTZ | |

**Unique:** `(user_id, quiz_id)` — upsert on retake
**RLS:** SELECT + INSERT + UPDATE for `auth.uid() = user_id`

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID UNIQUE | FK → `auth.users.id` |
| `tier` | TEXT | `'free'` or `'premium'` |
| `plan` | TEXT | `'annual'` or `'monthly'` |
| `started_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `unlocked_courses`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID | FK → `auth.users.id` |
| `course_id` | TEXT | quiz ID |
| `unlocked_at` | TIMESTAMPTZ | |

**Unique:** `(user_id, course_id)`

### `purchases`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID | FK → `auth.users.id` |
| `purchase_type` | TEXT | `'subscription'` or `'course'` |
| `course_id` | TEXT | nullable |
| `amount` | INTEGER | INR |
| `purchased_at` | TIMESTAMPTZ | |

**RLS:** SELECT for `auth.uid() = user_id`; writes via service role only

### `profiles` (mobile read model)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `subscription_tier` | TEXT | synced by trigger |
| `unlocked_courses` | TEXT[] | synced by trigger |
| `updated_at` | TIMESTAMPTZ | |

---

## Environment Variables

| Variable | Client/Server | Required | Purpose |
|----------|---------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Yes | JWT verification (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes | DB writes bypassing RLS |
| `ADMIN_EMAILS` | Server only | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Client | Yes | reCAPTCHA v3 site key |
| `RECAPTCHA_SECRET_KEY` | Server only | Yes | reCAPTCHA v3 secret |
| `SETUP_TOKEN` | Server only | Setup only | `/api/setup-db` auth |
| `SUPABASE_PROJECT_REF` | Server only | Setup only | Supabase project reference |
| `SUPABASE_ACCESS_TOKEN` | Server only | Setup only | Supabase Management API PAT |
| `RAZORPAY_KEY_ID` | Client | Future | Razorpay checkout |
| `RAZORPAY_KEY_SECRET` | Server only | Future | Payment signature verification |

---

## Quiz Content

### CLF-C02 — AWS Cloud Practitioner (195 Questions)

| Quiz ID | Title | Questions | Duration | Access |
|---------|-------|-----------|----------|--------|
| `clf-c02-cloud-concepts` | Cloud Concepts | 29 | 30 min | **Free** |
| `clf-c02-billing` | Billing & Pricing | 34 | 35 min | **Free** |
| `clf-c02-security` | Security & Compliance | 42 | 45 min | Premium |
| `clf-c02-technology` | Technology & Services | 90 | 90 min | Premium |
| `clf-c02-full-exam` | Full Practice Exam | 195 | 90 min | Premium |

### Freemium Model

- Free users: first 25 questions of any quiz, then paywall
- Pro: ₹999/year or ₹149/month (Razorpay — coming soon)
- Course unlock: individual quiz (one-time fee per quiz)

---

## Security

| Document | Contents |
|----------|---------|
| [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) | 300-rule compliance audit, section-by-section |
| [`THREAT_MODEL.md`](./THREAT_MODEL.md) | STRIDE analysis, attack scenarios, accepted risks |
| [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md) | All HTTP security headers explained |
| [`API_SECURITY_REPORT.md`](./API_SECURITY_REPORT.md) | Per-route auth, rate limits, validation |

### Key Properties

| Control | Implementation |
|---------|---------------|
| Server-side score validation | `/api/quiz-submit` calculates from authoritative `quizQuestions` |
| Admin access | JWT + `ADMIN_EMAILS` server-side; localStorage never trusted |
| RLS | All 6 tables: enabled with `auth.uid()` policies |
| Rate limiting | All 9 routes: 10–60 req/min per IP (in-memory) |
| Payload limits | 4 KB / 8 KB / 32 KB per route |
| HSTS | 2 years, includeSubDomains, preload |
| CSP | Strict allowlist, `frame-ancestors 'none'`, `object-src 'none'` |
| Password strength | Min 12 chars, upper + lower + number + special required |
| Bot protection | reCAPTCHA v3 on login, signup, reset, profile save |
| Structured logging | JSON `{ ts, level, route, message, ip, userId, reason }` |

---

## Local Development

```bash
git clone https://github.com/schinchli/katalyst-lms-web.git lms
cd lms/apps/web
npm install --legacy-peer-deps
cp .env.example .env.local   # fill in Supabase + reCAPTCHA keys
npm run dev                  # → http://localhost:3000
```

### Pre-commit checks (required)
```bash
cd apps/web && npx tsc --noEmit          # zero TypeScript errors
cd backend   && npm test                  # 49 Jest tests passing
git diff --cached | grep -iE "(service_role|secret|password|token)"  # no secrets
```

### Deploy
```bash
cd ~/Documents/Projects/lms
vercel --prod --yes
```

---

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md).
