# Threat Model — Katalyst LMS

> **Framework:** STRIDE + MITRE ATT&CK (web)
> **Last updated:** 2026-03-09
> **Application:** Katalyst — AWS Certification Quiz Platform
> **Deployment:** Vercel (Next.js 15) + Supabase (PostgreSQL + Auth)

---

## Assets to Protect

| Asset | Sensitivity | Impact if Compromised |
|-------|-------------|----------------------|
| User credentials (passwords) | Critical | Account takeover, impersonation |
| Supabase service role key | Critical | Full DB read/write bypass RLS |
| Quiz questions + correct answers | High | Competitive advantage, cheating |
| Quiz scores / leaderboard data | High | Leaderboard fraud, reputation damage |
| User email addresses | High | Phishing, spam, GDPR liability |
| Purchase records | High | Financial fraud, chargeback disputes |
| Admin access | High | Platform takeover, data exfiltration |
| reCAPTCHA secret key | Medium | Bot protection bypass |
| Upsell copy / pricing | Low | Competitor intelligence |

---

## Trust Boundaries

```
[Browser / Client]
  ↕ HTTPS only (HSTS enforced)
[Vercel Edge / CDN]
  ↕ Server-to-server (internal)
[Next.js API Routes (Vercel Functions)]
  ↕ Supabase REST API (HTTPS)
[Supabase PostgreSQL + Auth]
```

- **Browser → API:** Untrusted. All input validated server-side.
- **API → Supabase:** Trusted. Service-role key used only after auth confirmed.
- **Browser → Supabase (client):** Uses anon key only. RLS enforces row ownership.

---

## Threat Actors

| Actor | Motivation | Capability |
|-------|------------|------------|
| Casual cheater | Pass AWS exam without studying | Low — browser console tricks |
| Leaderboard abuser | Top rank for clout | Medium — automated scripts |
| Credential thief | Sell accounts | Medium — credential stuffing |
| Competitor | Scrape question bank | Medium — automated scraping |
| Malicious user | Data exfiltration, defacement | High — XSS, injection attempts |
| Automated bot | Abuse free tier | High — script-based |

---

## STRIDE Analysis

### S — Spoofing

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Admin impersonation | Forge `isAdmin: true` in localStorage | Admin status verified server-side via JWT + `ADMIN_EMAILS` env var |
| Token replay | Reuse captured JWT | Supabase short-lived access tokens (1 hour); refresh token rotation |
| Account impersonation | Use stolen credentials | reCAPTCHA v3 + rate limiting on login (30/60s) |
| Email spoofing on signup | Register with someone else's email | Email verification required (Supabase enforced) |

---

### T — Tampering

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Score manipulation | POST fake score via browser console | `/api/quiz-submit` calculates score server-side; client answer is irrelevant |
| Answer injection | Submit extra question IDs | Server validates only IDs that exist in authoritative `quizQuestions[id]` |
| Timestamp manipulation | Set `startedAt` to past to fake fast completion | Server calculates elapsed time; rejects < 5s submissions |
| DB direct write | Use anon key to write arbitrary scores | RLS policies: users can only write rows where `user_id = auth.uid()` |
| Request body inflation | Send >32KB payload to OOM the function | Content-Length checked; 413 returned on overage |
| Upsell message injection | Edit localStorage `katalyst-admin-msgs` | Affects only local experience; no server trust of this value |

---

### R — Repudiation

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Deny quiz submission | Claim score was not submitted | All quiz submissions logged with `{ userId, quizId, score, ip, ts }` |
| Deny purchase | Dispute payment | Purchase records in `purchases` table with Razorpay order ID (future) |
| Deny admin action | Admin denies making changes | Admin page actions logged; future: admin audit log table |

---

### I — Information Disclosure

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Error messages revealing internals | Trigger a 500 and read stack trace | All errors caught; generic message returned; details logged server-side only |
| User email enumeration | Test if email exists during signup/login | Supabase returns generic "invalid credentials" on failed login |
| Leaderboard exposes user IDs | Read API response | Name is truncated ("Alex C."); user ID is the Supabase UUID (non-guessable) |
| Service role key in client bundle | Grep client JS | `SUPABASE_SERVICE_ROLE_KEY` never in `NEXT_PUBLIC_*`; server-only files only |
| API key in git history | `git log --all -S "service_role"` | Pre-commit check in CLAUDE.md; secrets in Vercel env vars only |
| Referrer header leaking quiz IDs | Navigate from quiz to external site | `Referrer-Policy: strict-origin-when-cross-origin` — only origin sent cross-origin |

---

### D — Denial of Service

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Rate limit exhaustion | Flood any API endpoint | Per-IP rate limits on all routes (10–60 req/min) |
| DB query exhaustion | Call `/api/leaderboard` repeatedly | 60-second CDN cache; in-memory rate limiter |
| Memory exhaustion (rate limiter) | Create thousands of unique IPs | Rate limiter evicts expired entries every 5 minutes |
| Large payload attack | Send 100MB body to quiz-submit | Content-Length checked; 413 returned |
| Signup flood | Create thousands of accounts | reCAPTCHA v3 + 10 req/min on `/api/recaptcha/verify` |

---

### E — Elevation of Privilege

| Threat | Attack Vector | Control |
|--------|--------------|---------|
| Access admin panel | Browse to `/dashboard/admin` | Supabase JWT required + email in `ADMIN_EMAILS` checked server-side |
| Access all purchases | Call `/api/admin/purchases` | JWT + admin email check; returns 403 for non-admins |
| Upgrade own subscription | Write `tier: 'premium'` to Supabase directly | RLS policy on `subscriptions`: only service-role can write (client anon key blocked) |
| Unlock premium quiz without paying | Set `katalyst-unlocked-courses` in localStorage | Server validates subscription on quiz-submit; UI lock is UX-only, not security |

---

## Attack Scenarios (Prioritized)

### Scenario 1: Leaderboard Fraud (HIGH — MITIGATED)
**Before fix:** User opens browser console, calls `saveQuizResult(userId, { score: 195, ... })`.
Fake score appears on leaderboard. Leaderboard is meaningless.

**After fix:** `saveQuizResult()` client function still exists for localStorage only.
All Supabase writes go through `/api/quiz-submit`. Server recalculates score from
authoritative question data. Fake scores are impossible.

**Residual risk:** A user could technically submit the correct answer for each question if they
had the full answer key. This is a knowledge-based attack, not a technical exploit.

---

### Scenario 2: Admin Panel Access (HIGH — MITIGATED)
**Attack:** Attacker sets `isAdmin = true` in localStorage or intercepts client-side admin check.
**Control:** Dashboard layout calls `/api/admin/check` with Bearer token on mount.
Admin pages redirect to `/dashboard` if not verified. localStorage value is never trusted.

---

### Scenario 3: Service Role Key Theft (CRITICAL — PROTECTED)
**Attack:** Attacker finds `SUPABASE_SERVICE_ROLE_KEY` in git history or client bundle.
**Control:** Key is server-only (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix).
Vercel env vars are never in the deployed bundle. Pre-commit grep required in CLAUDE.md.

---

### Scenario 4: Mass Scraping of Questions (MEDIUM — PARTIAL)
**Attack:** Bot iterates through all quiz IDs and extracts questions + correct answers.
**Control:** Questions are in the client-side JavaScript bundle (public). The correct answers
(`correctOptionId`) are also in the bundle — this is a known trade-off for a client-rendered quiz.
**Accepted risk:** Question bank is the product, not a secret. Security through obscurity is not
relied upon. The value of Katalyst is explanation quality + UX, not secret answers.

---

### Scenario 5: Account Takeover via Credential Stuffing (MEDIUM — MITIGATED)
**Attack:** Attacker uses leaked email:password combinations from other breaches.
**Controls:**
- reCAPTCHA v3 on login (score threshold enforcement)
- Rate limit: 30 req/min per IP on login
- Supabase Auth handles lockout after N failed attempts (configurable in Supabase dashboard)
- HSTS prevents SSL stripping on first visit

---

## Accepted Risks

| Risk | Justification |
|------|--------------|
| Correct answers in client bundle | Quiz app requires client-side answer validation for instant feedback UX. Answers are visible to determined users. Value proposition is learning + explanations, not secret answer protection. |
| `unsafe-inline` in CSP | Next.js 15 App Router requirement. Mitigated by React's automatic JSX escaping and no `dangerouslySetInnerHTML`. |
| In-memory rate limiter | Single-instance deployment on Vercel Hobby/Pro. If auto-scaled, rate limits could be bypassed across instances. Acceptable until traffic justifies Redis. |
| localStorage tokens | Supabase JS v2 default. Mitigated by CSP. Upgrade path: migrate to `@supabase/ssr` with cookie-based sessions. |
| Streak = 0 in leaderboard | Cosmetic — no security impact. |
