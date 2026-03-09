# API Security Report — Katalyst LMS

> **Generated:** 2026-03-09
> **Base URL:** `https://lms-amber-two.vercel.app`
> **Framework:** Next.js 15 App Router (Vercel serverless functions)

---

## API Route Inventory

| Route | Method | Auth | Rate Limit | Payload Max | Status |
|-------|--------|------|------------|-------------|--------|
| `/api/admin/check` | GET | Bearer JWT + ADMIN_EMAILS | 30/60s | N/A | ✅ |
| `/api/admin/purchases` | GET | Bearer JWT + ADMIN_EMAILS | 30/60s | N/A | ✅ |
| `/api/leaderboard` | GET | Public | 60/60s | N/A | ✅ |
| `/api/quizzes/stats` | GET | Public | 60/60s | N/A | ✅ |
| `/api/quiz-submit` | POST | Bearer JWT | 20/60s | 32 KB | ✅ |
| `/api/recaptcha/verify` | POST | None (rate limited) | 10/60s | 4 KB | ✅ |
| `/api/sync-user` | POST | Bearer JWT | 20/60s | 8 KB | ✅ |
| `/api/sync-user` | GET | Bearer JWT | 10/60s | N/A | ✅ |
| `/api/setup-db` | POST | x-setup-token header | 3/60s | N/A | ✅ |

---

## Detailed Route Analysis

### `GET /api/admin/check`

**Purpose:** Server-side admin role verification. Used by dashboard layout and admin pages.

**Security Controls:**
- Rate limit: 30 req/60s per IP (prevents brute-force admin enumeration)
- JWT verified via `supabase.auth.getUser(token)` — cannot be bypassed with localStorage
- Admin list stored server-side in `ADMIN_EMAILS` env var — never in client code
- Non-admin returns `{ isAdmin: false }` with 200 (not 403) to prevent admin existence leakage
- All outcomes logged with `{ route, userId, ip }`

**Threat mitigated:** OWASP A01 (Broken Access Control), privilege escalation

**Request:**
```
GET /api/admin/check
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{ "isAdmin": true }
// or
{ "isAdmin": false }
```

---

### `GET /api/admin/purchases`

**Purpose:** Returns all platform purchases for admin analytics dashboard.

**Security Controls:**
- Rate limit: 30 req/60s per IP
- Bearer JWT required + email verified against `ADMIN_EMAILS`
- Reads via service-role client (bypasses RLS intentionally — only admin can reach this)
- Non-admin returns `{ ok: false, error: 'Forbidden' }` with 403
- All access attempts logged (including failures)

**Threat mitigated:** Data exfiltration, unauthorized financial data access

**Request:**
```
GET /api/admin/purchases
Authorization: Bearer <supabase-access-token>
```

**Response:**
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
  "totalRevenue": 999
}
```

---

### `GET /api/leaderboard`

**Purpose:** Returns top-50 leaderboard entries for a given period.

**Security Controls:**
- Rate limit: 60 req/60s per IP
- Public endpoint — no auth (leaderboard is intentionally public)
- Service-role client used server-side to aggregate across all users (bypasses RLS — intentional)
- CDN cache: `max-age=60, s-maxage=60` (reduces DB load)
- Only `user_id, quiz_id, score` columns selected (Rule 8: minimal DB reads)
- Returns only display name and initial — no email, no full user ID

**Query parameters:**
- `period`: `daily` | `monthly` | `alltime` (default: `alltime`)

**Threat mitigated:** DoS via DB exhaustion, PII leakage

**Request:**
```
GET /api/leaderboard?period=monthly
```

**Response:**
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

---

### `GET /api/quizzes/stats`

**Purpose:** Returns distinct student count for a quiz (displayed on quiz intro pages).

**Security Controls:**
- Rate limit: 60 req/60s per IP
- Public endpoint — counts are not sensitive
- CDN cache: `max-age=300, s-maxage=300` (5 min)
- Service-role bypasses RLS to count across all users

**Query parameters:**
- `quiz_id`: string (required)

**Threat mitigated:** DoS via repeated DB queries

---

### `POST /api/quiz-submit`

**Purpose:** Server-side quiz validation. Calculates score from submitted answers and writes
result to Supabase using service role. Prevents client-side score tampering.

**Security Controls:**
- Rate limit: 20 req/60s per IP
- Bearer JWT required — verified before any processing
- Payload size limit: 32 KB (rules 157–158)
- Zod schema validation: `{ quizId: string, answers: Record<string,string>, startedAt: ISO datetime }`
- Timing validation: rejects if `elapsedSecs < 5` (suspicious) or logs warning if > `duration + 5min`
- Score calculated server-side from authoritative question data — client cannot inject a score
- Answers validated against `quizQuestions[quizId]` — only valid question IDs are scored
- Write uses service role (upsert with `onConflict: 'user_id,quiz_id'`)
- All submissions logged with `{ userId, quizId, score, totalQuestions, timeTaken }`

**Threat mitigated:** Score tampering (OWASP A04), replay attacks, leaderboard fraud

**Request:**
```
POST /api/quiz-submit
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{
  "quizId": "clf-c02-full-exam",
  "answers": {
    "q1": "option-b",
    "q2": "option-a"
  },
  "startedAt": "2026-03-09T10:00:00.000Z"
}
```

**Response:**
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
| Code | Reason |
|------|--------|
| 400 | Invalid JSON, Zod validation failure, submission too fast |
| 401 | Missing or invalid Bearer token |
| 404 | Unknown quiz ID |
| 413 | Payload exceeds 32 KB |
| 429 | Rate limited |
| 500 | DB write failure |

---

### `POST /api/recaptcha/verify`

**Purpose:** Server-side reCAPTCHA v3 token verification. Secret key never leaves server.

**Security Controls:**
- Rate limit: 10 req/60s per IP (strictest public endpoint)
- Payload size limit: 4 KB
- Zod schema: `{ token: string, action: enum['login','signup','reset_password','profile_save','contact'] }`
- Empty token: logged and allowed through (reCAPTCHA is best-effort; rate limiter is the real protection)
- Score below threshold: returns `{ ok: false }` — caller decides whether to block
- All failures logged with action + score

**Threat mitigated:** Bot signups, credential stuffing, automated abuse

---

### `POST /api/sync-user`

**Purpose:** Upserts user profile to Supabase `user_profiles` table after login/signup.

**Security Controls:**
- Rate limit: 20 req/60s per IP (POST), 10 req/60s (GET health check)
- Payload size limit: 8 KB
- Bearer JWT required — token verified before processing
- Identity check: JWT user ID must match `supabaseId` in body (prevents profile injection)
- Email verified against token claims (warns if mismatch — may occur during email change)
- Writes via service-role (bypasses RLS — only reachable after valid auth)
- Zod schema validates all fields before DB write

**Threat mitigated:** Profile injection, cross-user data write

---

### `POST /api/setup-db`

**Purpose:** One-shot database schema setup. Creates all tables, RLS policies, and triggers.

**Security Controls:**
- Rate limit: 3 req/60s (extremely restrictive — one-time use only)
- `x-setup-token` header required (must match `SETUP_TOKEN` env var)
- No JWT — intentionally uses PAT (Supabase Management API)
- Should be called once and never again — no automated trigger

**Warning:** This endpoint should be **disabled or removed after initial setup** to reduce attack surface.

---

## Security Patterns Applied Across All Routes

### Pattern 1: IP Extraction
```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
```
Takes the leftmost IP from `x-forwarded-for` — the true client IP behind Vercel's CDN.

### Pattern 2: JWT Verification
```typescript
const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const { data: { user }, error } = await anonClient.auth.getUser(token);
if (error || !user) return 401;
```
Uses Supabase's anon client for token verification (safe — the client-side anon key can only verify,
not bypass RLS). Service role is only used for DB writes after auth is confirmed.

### Pattern 3: Service Role Isolation
The `adminClient()` factory (service role) is defined inside each route file and only
called after authentication and authorization checks pass. It is never exported.

### Pattern 4: Minimal Column Selection
All DB queries name specific columns: `.select('user_id, score, quiz_id')`.
No `SELECT *` anywhere. All list queries have `.limit(n)`.

### Pattern 5: Structured Logging
All security events logged as JSON with `{ ts, level, route, message, ip, userId, reason }`.
Compatible with Vercel Log Drains and any SIEM.

---

## Known Limitations

| Limitation | Risk | Mitigation |
|------------|------|------------|
| In-memory rate limiter | Does not work across multiple Vercel instances | Acceptable for current scale; upgrade to Upstash Redis when > 1 replica |
| `unsafe-inline` in CSP | Weakens XSS protection | Next.js requirement; mitigated by React's auto-escaping |
| Supabase token in localStorage | XSS could steal token | Mitigated by CSP + React auto-escaping; no `dangerouslySetInnerHTML` |
| Streak = 0 on leaderboard | Misleading UI | No `quiz_results` consecutive-day aggregation yet; low security risk |
| `setup-db` still enabled | Attack surface | Should be disabled after initial deployment |
