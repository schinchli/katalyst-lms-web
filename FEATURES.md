# Katalyst LMS — Features

> **Platform:** AWS Cloud & Generative AI Certification Preparation
> **Stack:** Next.js 16 (web) · Expo SDK 54 (mobile) · Supabase (auth + DB) · Vercel · Turborepo
> **Last updated:** 2026-05-08

---

## Live Features

### Web Auth (`apps/web/src/app/(auth)/`)

| Screen / Route | Details |
|----------------|---------|
| Login `/login` | Email + password, Supabase Auth, reCAPTCHA v3 |
| Signup `/signup` | Name/email/password, min-12/upper/lower/number/special, email confirmation flow |
| Verify Email `/verify-email` | 6-digit OTP, resend code |
| Reset Password `/reset-password` | Email → magic link |
| Update Password `/update-password` | Set new password after email link |

### Web Dashboard Pages (`apps/web/src/app/dashboard/`)

| Page | Route | Details |
|------|-------|---------|
| Home | `/dashboard` | Stat cards (time, hours, score, completed), certification milestone goal + countdown + pace bars, 7-day activity strip (timezone-aware), rotating motivational quotes |
| Quizzes | `/dashboard/quizzes` | CLF-C02 domain filter pills, completion badges, premium lock indicator, sidebar search |
| Quiz Engine | `/dashboard/quiz/[id]` | Multi-phase: intro → quiz → upsell (free) / results (pro); 30s per-question timer; answer feedback + explanations; actual `timeTaken` tracking |
| Free Plan Gating | `/dashboard/quiz/[id]` | 25 randomly shuffled questions for free users; upsell checkpoint screen with score ring, locked-content stats, Pro/course CTAs |
| Learn | `/dashboard/learn` | YouTube embed, AWS playlist, chapters accordion |
| Learn Article | `/dashboard/learn/[slug]` | Sanity CMS article rendering (Portable Text) |
| Progress | `/dashboard/progress` | Stat cards, completion bar, full quiz history table with Supabase sync |
| Leaderboard | `/dashboard/leaderboard` | daily/monthly/alltime periods, top-50, coin + streak display |
| Flashcards | `/dashboard/flashcards` | Deck selector, flip cards, mark known/unknown, progress ring |
| Battles | `/dashboard/battles` | Real-time quiz battle lobby + match (prototype via app_settings) |
| Contests | `/dashboard/contests` | Active contest list, join/view |
| Coin Store | `/dashboard/coin-store` | Coin pack listings, purchase flow |
| Coins | `/dashboard/coins` | Coin balance + transaction history |
| Bookmarks | `/dashboard/bookmarks` | Saved questions across quizzes |
| Store | `/dashboard/store` | Premium upgrade + coin purchase hub |
| Self Challenge | `/dashboard/self-challenge` | Solo timed challenge mode |
| Payment Success | `/dashboard/payment-success` | Post-checkout confirmation |
| Profile | `/dashboard/profile` | 9 colour swatches, 5 fonts, 4 font sizes, 16 IANA timezones, live CSS variable preview; saved to user_profiles |
| Settings | `/dashboard/settings` | Admin-only: platform theme, system feature flags, AdSense config, upsell copy |
| Admin | `/dashboard/admin` | Revenue/purchase stats, customer list, orders |
| Admin Orders | `/dashboard/admin/orders` | Order list + detail (`/admin/orders/[orderId]`) |
| Admin Customers | `/dashboard/admin/customers` | Customer management |
| Admin Products | `/dashboard/admin/products` | Product / quiz-pack management |
| Admin Reviews | `/dashboard/admin/reviews` | Review moderation queue |
| Admin Ecommerce | `/dashboard/admin/ecommerce` | Conversion + revenue metrics |
| Admin Quiz Builder | `/dashboard/admin/quiz-builder` | Quiz CRUD — add/edit/delete questions without code deploy |

### Web Global Features

| Feature | Details |
|---------|---------|
| Dark Mode | `data-theme="dark"` server-side default (no FOUC), Moon/Sun toggle, localStorage persistence |
| Sidebar Search | Live search across all quizzes by title/description/category/examCode |
| Google AdSense | Adblocker detection via `useLayoutEffect` (zero delay); AdSense injected only when clean; Pro users ad-free |
| Platform Theme | Admin selects theme via `app_settings.platform_theme`; white-label copy via `mobile_experience_config` |
| User Theme Packs | User overrides platform theme → saved to `user_profiles.theme_pref`, synced across devices |
| Maintenance Mode | `system_feature_flags.maintenanceMode` → `MaintenanceBanner` component |
| Managed Content | Hero, testimonials, FAQs editable from admin without code deploy (`app_content` in app_settings) |
| Sanity CMS | Article content for Learn section; Sanity Studio at `/studio` |
| reCAPTCHA v3 | Best-effort bot protection on login, signup, reset, profile save |
| Admin Guard | JWT + `ADMIN_EMAILS` server-side; Settings/Admin pages redirect non-admins |

### Web Payment

| Feature | Details |
|---------|---------|
| Stripe Checkout | USD subscriptions + course unlocks; server-side Checkout Session; webhook HMAC-verified |
| Razorpay | INR ₹999/yr / ₹149/mo + per-quiz unlock; order create + HMAC verify |
| Country detection | `/api/payment/country` auto-selects INR or USD pricing |
| Access grant | Webhook/verify writes to `subscriptions` + `unlocked_courses` via service role |
| Account deletion | Self-serve via `/delete-account` + `/api/account/delete` |

### Backend Lambdas (`backend/lambdas/`)

| Lambda | Endpoint | Description |
|--------|----------|-------------|
| `quizSubmit` | `POST /quiz/submit` | Validates, saves attempt + stats to DynamoDB, emits EventBridge `lms.quiz.submitted` |
| `progressFetch` | `GET /progress` | Returns `UserStatistics` + last 10 attempts (parallel DynamoDB fetch) |
| `leaderboardFetch` | `GET /leaderboard?period=` | Top-20 for daily / monthly / alltime |
| `adminStats` | `GET /admin/stats` | Scans `lms-purchases` → revenue aggregation |
| `createOrder` | `POST /payment/create-order` | Razorpay order creation |
| `verifyPayment` | `POST /payment/verify` | HMAC verify → DynamoDB write → Cognito attribute update → EventBridge |

**EventBridge processors:** `analyticsProcessor`, `badgeProcessor`, `streakProcessor`

### Supabase Edge Functions (`supabase/functions/`)

Mirror of the Lambda layer: `quiz-submit`, `progress-fetch`, `leaderboard-fetch`, `admin-stats`, `create-order`, `verify-payment` — all deployed to the same Supabase project.

### Quiz Content (Web)

| Quiz | Exam | Questions | Access |
|------|------|-----------|--------|
| AWS Quick Start | CLF-C02 | 5 | Free (no limit) |
| CLF-C02: Cloud Concepts | CLF-C02 | 29 | Free (25Q limit) |
| CLF-C02: Billing, Pricing & Support | CLF-C02 | 34 | Free (25Q limit) |
| CLF-C02: Security & Compliance | CLF-C02 | 42 | Free (25Q limit) |
| CLF-C02: Technology | CLF-C02 | 90 | Free (25Q limit) |
| CLF-C02 Full Practice Exam | CLF-C02 | 195 | Premium (admin override) |
| **Total** | | **395** | |

### Quiz Content (Mobile — additional)

11 GenAI category quizzes (10Q each): Bedrock Fundamentals, Bedrock Advanced, RAG & Knowledge Bases, AI Agents on AWS, Prompt Engineering, Security & Compliance, MLOps & SageMaker, Cost Optimization, Serverless, Networking, Databases

4 AIP-C01 quizzes: Full Exam, RAG Foundations, Security & Governance, Agents & Ops

**Mobile total: 20 quiz entries, 670 questions**

### Mobile App (`mobile/`)

| Screen | Details |
|--------|---------|
| Auth | Login (email+password + Google), Signup, Forgot Password (2-stage), Verify (6-digit OTP) |
| Home (tabs/index) | Featured quiz, daily quiz badge, quick-start CTAs |
| Quizzes | Full quiz catalogue with category filter, premium badge, progress indicators |
| Quiz Engine | Multi-phase: intro → quiz → results/review; flashcard mode; bookmarks during quiz |
| Bookmark Review | Review bookmarked questions with full answer feedback |
| Learn | Video playlist + articles (from Sanity) |
| Progress | Streak tracker, XP bar, level system, quiz history |
| Profile | Theme pack selector, subscription status, logout |
| Bookmarks | Saved question browser across all quizzes |
| Search | Full-text search across quiz metadata |
| Leaderboard | daily/monthly/alltime tabs, coin + streak display |
| Learning Path | Track selector + ordered steps with completion state |
| Flashcards | Deck picker, flip cards, known/unknown sorting, progress ring |
| Battle | Real-time matchmaking lobby + live quiz battle |
| Contest | Join/play active contests |
| Self Challenge | Solo timed quiz challenge |
| Coin Store | Buy coin packs |
| Coin History | Transaction log |
| Admin Settings | Feature flag + platform config editor (admin only) |
| Force Update | Blocking screen when `minimumAppVersion` is exceeded |
| Maintenance | Blocking screen when `maintenanceMode` is active |

### Testing & CI/CD

| Item | Details |
|------|---------|
| Backend Jest | 82 tests, 6 suites — 98% statements, 87% branches, 100% functions |
| Web Jest | 34 tests, 3 suites — admin-check, db helpers, rate limiter |
| Mobile Jest | authStore, bookmarkStore, Badge, Button unit tests |
| Playwright E2E | 15 spec files — auth, dashboard, quiz engine, flashcards, security headers, responsive, performance, score flow |
| GitHub Actions | 5-job CI: security-gate → backend-tests / web-type-check / mobile-type-check → web-build → E2E → ci-passed gate |
| Branch protection | `ci-passed` gate required before merge to `main` |
| CodeQL | SAST on every push + weekly |
| TruffleHog | Secret scan on every push + PR |
| Dependabot | Weekly vulnerability alerts + auto-fix PRs |

---

## Planned Features

### Phase 2 — Content Expansion

- [ ] Multi-cloud quiz library: Azure, GCP, Nvidia, Kubernetes
- [ ] Dynamic search across all providers with real-time filtering
- [ ] Full AIP-C01 question bank on web (currently mobile-only)
- [ ] Sanity CMS articles fully wired to `/dashboard/learn` with slug routing

### Phase 3 — Payments (Production)

- [ ] Stripe live keys + full webhook coverage (subscription cancel, refund)
- [ ] Razorpay live keys + webhook verification
- [ ] Subscription management page (cancel, billing history)
- [ ] Per-user purchase history page

### Phase 4 — Gamification

- [ ] Daily quiz engine (backend `dailyQuizEnabled` flag exists, frontend pending)
- [ ] Badge engine fully wired to UI (backend processor exists)
- [ ] Streak milestones + XP level-up notifications
- [ ] Coin economy: earn via quiz completion, spend in coin store

### Phase 5 — Production Infrastructure

- [ ] CDK deployment (DynamoDB tables, Cognito, API Gateway, EventBridge)
- [ ] Custom domain + CloudFront
- [ ] EAS Build + App Store + Play Store submission (Play Console docs in `docs/store/`)
- [ ] CloudWatch dashboards + error alerting

### Phase 6 — Social & Competition

- [ ] Battle system (production): dedicated `battle_sessions` Supabase table, real-time via Supabase Realtime
- [ ] Contests (production): timed public contests with leaderboard
- [ ] Referral system: referral code generation, reward on signup
- [ ] Global leaderboard with friend/follow
