# Katalyst LMS

**AWS & GenAI Certification Prep Platform**

Katalyst is a full-stack LMS for AWS Cloud and GenAI certification preparation. It includes a quiz engine, flashcards, live leaderboard, battles, contests, coin economy, progress tracking, freemium paywall, and an admin dashboard — secured from client to database with a zero-trust posture.

**Live:** https://lms-amber-two.vercel.app

---

## Stack

| Layer | Technology |
|-------|-----------|
| Web portal | Next.js 16 App Router (TypeScript) |
| Styling | Vuexy design system (CSS-only replica, no package) |
| Auth | Supabase Auth (email + password + email confirmation) |
| Database | Supabase PostgreSQL + Row Level Security (15 tables) |
| Bot protection | Google reCAPTCHA v3 |
| Deployment | Vercel (serverless functions) |
| Mobile | Expo SDK 54 / React Native 0.81 (git submodule → `katalyst-mobile.git`) |
| Backend (Lambda) | AWS Lambda + TypeScript (6 functions, EventBridge, DynamoDB) |
| Edge functions | Supabase Edge Functions (mirrors Lambda layer) |
| Payments | Stripe Checkout + Razorpay (server-side, both supported) |
| CMS | Sanity v3 (articles / learn section) |
| Monorepo | Turborepo |

---

## Repository Structure

```
lms/
├── apps/
│   ├── web/                           # Next.js 16 web portal (deployed to Vercel)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/              # 53 Vercel serverless API routes (see API Routes below)
│   │   │   │   ├── dashboard/        # 20 dashboard pages + layouts
│   │   │   │   ├── login/            sign in
│   │   │   │   ├── signup/           sign up
│   │   │   │   ├── verify-email/     6-digit OTP confirmation
│   │   │   │   ├── reset-password/   password reset request
│   │   │   │   ├── update-password/  set new password (from email link)
│   │   │   │   ├── about/            about page
│   │   │   │   ├── privacy/          privacy policy
│   │   │   │   ├── terms/            terms of service
│   │   │   │   ├── instructions/     app instructions
│   │   │   │   ├── delete-account/   self-serve account deletion
│   │   │   │   └── studio/           Sanity Studio (CMS)
│   │   │   ├── components/           AdBanner, DailyQuizBadge, ErrorBoundary,
│   │   │   │                         FpFooter, FpNav, LoadingSpinner,
│   │   │   │                         MaintenanceBanner, ManagedContentPage,
│   │   │   │                         ManagedQuizContentProvider, PlatformExperienceProvider
│   │   │   ├── data/
│   │   │   │   ├── quizzes.ts        quiz metadata registry (6 CLF-C02 quizzes)
│   │   │   │   ├── clf-c02-questions.ts  CLF-C02 question bank (195 Qs)
│   │   │   │   ├── aip-c01-questions.ts  AIP-C01 question bank
│   │   │   │   └── flashcards.ts     flashcard decks
│   │   │   ├── hooks/
│   │   │   │   ├── useSubscription.ts   freemium subscription state
│   │   │   │   ├── useRecaptcha.ts      reCAPTCHA v3 hook
│   │   │   │   └── usePayment.ts        payment flow hook
│   │   │   └── lib/
│   │   │       ├── quizCatalog.ts       admin override merge layer
│   │   │       ├── rateLimiter.ts       in-memory per-IP rate limiter
│   │   │       ├── supabase.ts          Supabase client (cookie-based sessions)
│   │   │       ├── stripe.ts            Stripe singleton + price IDs
│   │   │       ├── systemFeatures.ts    feature-flag schema + defaults
│   │   │       ├── platformExperience.ts  white-label copy + theme config
│   │   │       ├── platformTheme.ts     platform-level theme presets
│   │   │       ├── themePacks.ts        user theme packs
│   │   │       ├── appContent.ts        managed static content schema
│   │   │       ├── managedQuizContent.ts  admin-managed quiz content schema
│   │   │       ├── profanityFilter.ts   review moderation
│   │   │       ├── logger.ts            structured JSON logging
│   │   │       ├── sanityClient.ts      Sanity GROQ client
│   │   │       ├── schemas.ts           shared Zod schemas
│   │   │       ├── emailValidation.ts   disposable email + format check
│   │   │       └── db.ts                Supabase CRUD helpers + localStorage fallback
│   │   ├── schemas/                  Sanity document schemas (article)
│   │   ├── e2e/                      15 Playwright spec files
│   │   ├── next.config.ts            security headers + CSP config
│   │   └── package.json
│   └── admin/                        # Vuexy admin panel (config only, not yet deployed)
│
├── backend/
│   ├── lambdas/                      6 AWS Lambda functions
│   │   ├── quizSubmit/               POST /quiz/submit
│   │   ├── progressFetch/            GET /progress
│   │   ├── leaderboardFetch/         GET /leaderboard
│   │   ├── adminStats/               GET /admin/stats
│   │   ├── createOrder/              POST /payment/create-order (Razorpay)
│   │   └── verifyPayment/            POST /payment/verify (Razorpay + HMAC)
│   └── events/                       3 EventBridge processors
│       ├── analyticsProcessor/       lms.quiz.submitted analytics aggregation
│       ├── badgeProcessor/           badge award on quiz events
│       └── streakProcessor/          daily streak tracking
│
├── supabase/
│   ├── functions/                    6 Edge Functions (mirrors Lambda layer)
│   │   ├── quiz-submit/
│   │   ├── progress-fetch/
│   │   ├── leaderboard-fetch/
│   │   ├── admin-stats/
│   │   ├── create-order/
│   │   └── verify-payment/
│   ├── migrations/                   13 SQL migration files
│   └── proxy/                        Supabase reverse proxy worker
│
├── packages/
│   ├── shared-types/                 @lms/shared-types — 27-table TypeScript interface set
│   │   └── src/  user, quiz, progress, battle, contest, learning, settings, api
│   └── theme/                        @lms/theme — design tokens + Tailwind config
│
├── mobile/                           Expo SDK 54 app (git submodule → katalyst-mobile.git)
│   ├── app/
│   │   ├── (auth)/                   login, signup, forgot-password, verify
│   │   ├── (tabs)/                   index, quizzes, learn, progress, profile, bookmarks, search
│   │   ├── quiz/[id].tsx             mobile quiz engine
│   │   ├── quiz/bookmarks-review.tsx bookmark review mode
│   │   ├── flashcards.tsx            flashcard study mode
│   │   ├── leaderboard.tsx           live leaderboard (daily/monthly/alltime)
│   │   ├── learning-path.tsx         guided learning path
│   │   ├── battle.tsx                real-time quiz battle
│   │   ├── battle-lobby.tsx          battle matchmaking
│   │   ├── contest.tsx               quiz contest mode
│   │   ├── challenge.tsx             self-challenge mode
│   │   ├── coin-store.tsx            coin shop
│   │   ├── coin-history.tsx          transaction history
│   │   ├── admin-settings.tsx        admin config screen
│   │   └── dev-config.tsx            dev environment switcher
│   ├── components/                   QuestionView, FlashCard, QuizCard, AppHeader,
│   │                                 AppTabBar, Badge, BadgeCelebrationModal, Button,
│   │                                 Card, DailyLimitModal, Input, MobileLeftDrawer,
│   │                                 PremiumGateModal, ProgressBar, AdBanner,
│   │                                 ForceUpdateScreen, MaintenanceScreen,
│   │                                 ManagedContentScreen
│   ├── stores/                       authStore, quizStore, progressStore, bookmarkStore,
│   │                                 drawerStore, learningPathStore, platformConfigStore,
│   │                                 systemFeatureStore, rateLimitStore, themeStore
│   ├── services/                     apiService, quizCatalogService, appContentService,
│   │                                 systemFeatureService, platformConfigService,
│   │                                 themeSyncService, managedQuizContentService, articlesService
│   ├── data/                         quizzes (20 entries), clf-c02-questions, aip-c01-questions,
│   │                                 flashcards, learningPaths, videos, examGuides, challenges,
│   │                                 contests, leaderboard
│   └── config/                       supabase, quizCatalog, appConfig, appContent,
│                                     systemFeatures, platformExperience, managedQuizContent,
│                                     themePresets, experience, db
│
├── infrastructure/cdk/               AWS CDK stack (planned deployment)
│   ├── lib/constructs/               api-gateway, cloudfront, cognito, dynamodb-tables,
│   │                                 event-handlers, s3-buckets
│   └── test/                         CDK construct unit tests
│
├── docs/
│   ├── ARCHITECTURE.md               system architecture overview
│   ├── DESIRED_FEATURES_BACKLOG.md   planned phases + backlog
│   ├── QUIZ_BUILDER_INTEGRATION.md   admin quiz builder design
│   ├── STEERING.md                   product steering notes
│   ├── VUEXY_WIDGET_CATALOG.md       design system reference
│   ├── store/                        Play Store + App Store submission docs
│   └── archive/                      superseded planning docs
│
├── scripts/
│   ├── security-gate.sh              13-check gate (quick / ci / full)
│   ├── install-hooks.sh              pre-commit + pre-push hooks
│   └── deploy.sh                     full gate + vercel --prod --yes
│
├── .github/workflows/                ci.yml, codeql.yml, eas-update.yml,
│                                     secret-scan.yml, type-check.yml
├── SECURITY_AUDIT.md                 300-rule compliance audit
├── THREAT_MODEL.md                   STRIDE threat model
├── SECURITY_HEADERS.md               HTTP security headers reference
├── API_SECURITY_REPORT.md            per-route security analysis
└── vercel.json                       Vercel build + routing config
```

---

## API Routes

All 53 routes are Vercel serverless functions. Base URL: `https://lms-amber-two.vercel.app`

### Public Routes (no auth required)

| Method | Route | Description | Rate limit |
|--------|-------|-------------|-----------|
| GET | `/api/leaderboard?period=` | Top-50 by daily/monthly/alltime | 60/min |
| GET | `/api/quiz-catalog` | Admin-managed premium/free overrides | 60/min |
| GET | `/api/quizzes/stats?quiz_id=` | Student count per quiz | 60/min |
| GET | `/api/platform-config` | Platform theme + white-label config | 60/min |
| GET | `/api/system-features` | Feature flags (maintenance, ads, daily quiz) | 60/min |
| GET | `/api/app-content` | Managed static content (hero, testimonials, FAQs) | 60/min |
| GET | `/api/contests` | Active contest list | 60/min |
| GET | `/api/theme` | Platform theme preset | 60/min |
| GET | `/api/coin-packs` | Available coin pack listings | 60/min |
| GET/POST | `/api/articles` | Sanity CMS articles (public read) | 60/min |
| GET | `/api/articles/[slug]` | Single article by slug | 60/min |
| POST | `/api/recaptcha/verify` | reCAPTCHA v3 token verification | 10/min |
| GET | `/api/payment/country` | Detect user country for pricing | 60/min |
| POST | `/api/payment/stripe/webhook` | Stripe webhook (HMAC-verified) | 10/min |

### Authenticated Routes (Bearer JWT required)

| Method | Route | Description | Rate limit |
|--------|-------|-------------|-----------|
| POST | `/api/quiz-submit` | Score calculation + Supabase write | 20/min |
| POST/GET | `/api/sync-user` | Upsert/check user profile | 20/min |
| GET | `/api/quiz-content?quizId=` | Full question set for a quiz | 30/min |
| GET/POST/DELETE | `/api/bookmarks` | Bookmark questions | 60/min |
| GET/POST | `/api/flashcard-progress` | Known card IDs per deck | 60/min |
| GET/POST | `/api/coins` | Coin balance + transaction history | 30/min |
| POST | `/api/payment/create-order` | Razorpay order creation | 10/min |
| POST | `/api/payment/verify` | Razorpay HMAC verify + grant access | 10/min |
| POST | `/api/payment/stripe/create-session` | Stripe Checkout Session | 10/min |
| GET | `/api/payment/stripe/verify` | Verify Stripe session post-redirect | 10/min |
| GET/POST | `/api/battle` | Battle session create/join/status | 30/min |
| GET | `/api/quiz-reviews/[id]` | Fetch reviews for a quiz | 30/min |
| GET | `/api/referral` | Referral code + stats | 30/min |
| DELETE | `/api/account/delete` | Self-serve account deletion | 3/min |
| GET | `/api/ads` | Ad config for current user | 30/min |

### Admin Routes (admin JWT required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/check` | Verify admin role |
| GET/POST | `/api/admin/quiz-catalog` | Quiz premium/free + price overrides |
| GET/POST | `/api/admin/quiz-content` | Manage quiz question content |
| GET/POST | `/api/admin/quiz-builder` | Quiz CRUD (list + create) |
| GET/PUT/DELETE | `/api/admin/quiz-builder/[quizId]` | Single quiz management |
| GET/POST/DELETE | `/api/admin/quiz-builder/[quizId]/questions` | Question CRUD |
| GET | `/api/admin/purchases` | All-platform purchase analytics |
| GET | `/api/admin/customers` | Customer list |
| GET | `/api/admin/orders` | Order list |
| GET/PUT | `/api/admin/orders/[orderId]` | Single order management |
| GET | `/api/admin/ecommerce-stats` | Revenue + conversion metrics |
| GET | `/api/admin/daily-quiz-analytics` | Daily quiz engagement data |
| GET/POST | `/api/admin/system-features` | Feature flag management |
| GET/POST | `/api/admin/theme` | Platform theme override |
| GET/POST | `/api/admin/app-content` | Static content editor |
| GET/POST | `/api/admin/categories` | Quiz category management |
| GET/POST | `/api/admin/coin-packs` | Coin pack configuration |
| GET/POST | `/api/admin/contests` | Contest CRUD |
| GET/POST | `/api/admin/reviews` | Quiz review list + moderation |
| GET | `/api/admin/pending-reviews` | Unmoderated review queue |
| POST | `/api/admin/moderate-review` | Approve/reject review |
| GET/POST | `/api/admin/mobile-config` | Mobile platform experience editor |
| POST | `/api/admin/grant-access` | Manually grant premium/course to user |

### Setup Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/setup-db` | One-shot DB schema init (`x-setup-token` auth) |

---

## Database Schema (Supabase PostgreSQL)

All tables have Row Level Security enabled. 13 migration files.

| Table | Key Columns | RLS |
|-------|-------------|-----|
| `user_profiles` | id (PK), name, role, subscription, theme_pref | user owns row |
| `quiz_results` | id, user_id, quiz_id, score, total_questions, time_taken, answers, mode | user owns row; upsert on (user_id, quiz_id) |
| `subscriptions` | id, user_id (UNIQUE), tier, plan, started_at | user reads own; service role writes |
| `unlocked_courses` | id, user_id, course_id; UNIQUE (user_id, course_id) | user reads own |
| `purchases` | id, user_id, purchase_type, course_id, amount, purchased_at | user reads own |
| `profiles` | id, subscription_tier, unlocked_courses (TEXT[]) | user owns row |
| `quiz_attempts` | id, user_id, quiz_id, score, pct, passed, time_taken | user owns row |
| `user_statistics` | user_id (PK), total_quizzes, total_coins, total_xp, streak_days | user owns row |
| `badges` | id, user_id, badge_type, earned_at | user reads own |
| `bookmarks` | (user_id, quiz_id) composite PK | user owns row |
| `flashcard_progress` | (user_id, deck_id) composite PK, known_ids TEXT[] | user owns row |
| `quiz_reviews` | id, user_id, quiz_id, rating, body, moderated | user reads approved + own |
| `orders` | id, user_id, amount, status, provider, provider_order_id | user reads own |
| `app_settings` | key (PK), value (JSONB), updated_at | read-all; write service role only |

**Key `app_settings` entries:**

| Key | Purpose |
|-----|---------|
| `quiz_catalog_overrides` | Admin-managed premium flags + prices per quiz ID |
| `platform_theme` | Active platform theme preset |
| `system_feature_flags` | Feature flags (maintenance, ads, daily quiz, leaderboard, etc.) |
| `mobile_experience_config` | White-label copy + layout for mobile home screen |
| `app_content` | Managed static content (hero, testimonials, FAQs, banners) |

---

## Quiz Content

### Web Quiz Registry (6 quizzes, 395 questions)

| Quiz ID | Title | Questions | Access |
|---------|-------|-----------|--------|
| `aws-quick-start` | AWS Quick Start Quiz | 5 | Free (no limit) |
| `clf-c02-cloud-concepts` | CLF-C02: Cloud Concepts | 29 | Free (25Q limit) |
| `clf-c02-billing` | CLF-C02: Billing, Pricing & Support | 34 | Free (25Q limit) |
| `clf-c02-security` | CLF-C02: Security & Compliance | 42 | Free (25Q limit) |
| `clf-c02-technology` | CLF-C02: Technology | 90 | Free (25Q limit) |
| `clf-c02-full-exam` | CLF-C02 Full Practice Exam | 195 | Premium (admin override) |

### Mobile Quiz Registry (20 quizzes, 670 questions)

Includes 11 GenAI category quizzes (Bedrock, RAG, AI Agents, Prompt Engineering, etc.) + all 5 CLF-C02 sub-quizzes + 4 AIP-C01 quizzes (Full Exam, RAG Foundations, Security & Governance, Agents & Ops).

### Freemium Model

- Free users: first 25 questions of any non-free quiz → paywall checkpoint
- **Stripe:** USD subscription (global) — server-side Checkout Session
- **Razorpay:** INR subscription ₹999/yr | ₹149/mo; per-quiz unlock (backend Lambda)
- Course unlock: individual quiz at admin-set price
- Pro users: ad-free, full question access, review mode

---

## Backend Lambdas (AWS)

| Lambda | Endpoint | Description |
|--------|----------|-------------|
| `quizSubmit` | `POST /quiz/submit` | Validates answers, writes to DynamoDB, emits EventBridge `lms.quiz.submitted` |
| `progressFetch` | `GET /progress` | Returns `UserStatistics` + last 10 `QuizAttempt[]` (parallel DynamoDB fetch) |
| `leaderboardFetch` | `GET /leaderboard?period=` | Top-20 for daily / monthly / alltime from 3 DynamoDB tables |
| `adminStats` | `GET /admin/stats` | Scans `lms-purchases` → revenue aggregation |
| `createOrder` | `POST /payment/create-order` | Creates Razorpay order, returns `{ orderId, amount, currency }` |
| `verifyPayment` | `POST /payment/verify` | HMAC-SHA256 verify → writes `lms-purchases` → updates Cognito attributes → emits `lms.purchase.completed` |

**EventBridge processors:** `analyticsProcessor` (quiz analytics), `badgeProcessor` (award badges), `streakProcessor` (daily streak update)

---

## Supabase Edge Functions

Mirror of the Lambda layer, deployed to the same Supabase project. Same 6 endpoints: `quiz-submit`, `progress-fetch`, `leaderboard-fetch`, `admin-stats`, `create-order`, `verify-payment`.

---

## Testing

| Suite | Location | Count | Coverage |
|-------|----------|-------|---------|
| Backend Jest | `backend/lambdas/` | 82 tests, 6 suites | 98% stmts, 87% branches, 100% funcs |
| Web Jest | `apps/web/src/__tests__/` | 34 tests, 3 suites | admin-check, db helpers, rate limiter |
| Playwright E2E | `apps/web/e2e/` | 15 spec files | auth, dashboard, quiz, flashcards, security, responsive, performance |
| Mobile Jest | `mobile/__tests__/` | authStore, bookmarkStore, Badge, Button | — |

---

## CI/CD

GitHub Actions at `.github/workflows/`:

| Workflow | Triggers | Jobs |
|----------|----------|------|
| `ci.yml` | PR/push to main, develop, feature/** | Security Gate → Backend Tests + Web TypeCheck + Mobile TypeCheck → Web Build → E2E → CI Passed gate |
| `type-check.yml` | PR/push | Web TypeScript check only |
| `eas-update.yml` | Push to main | EAS Update (OTA push to mobile) |
| `codeql.yml` | Push + weekly | CodeQL SAST (JavaScript/TypeScript) |
| `secret-scan.yml` | Push + PR | TruffleHog secret scan |

**Branch protection on `main`:** 5 required CI checks, 1 PR review, CODEOWNERS, linear history, no force push.

---

## Environment Variables

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Yes | JWT verification (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes | DB writes bypassing RLS |
| `ADMIN_EMAILS` | Server only | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Client | Yes | reCAPTCHA v3 site key |
| `RECAPTCHA_SECRET_KEY` | Server only | Yes | reCAPTCHA v3 secret |
| `STRIPE_SECRET_KEY` | Server only | Payments | Stripe server-side client |
| `STRIPE_WEBHOOK_SECRET` | Server only | Payments | Stripe webhook HMAC |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Payments | Stripe checkout redirect |
| `RAZORPAY_KEY_ID` | Client | Payments | Razorpay checkout |
| `RAZORPAY_KEY_SECRET` | Server only | Payments | Razorpay HMAC verify |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Both | CMS | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Both | CMS | Sanity dataset (production) |
| `SANITY_API_TOKEN` | Server only | CMS | Sanity write token |
| `EXPO_PUBLIC_WEB_URL` | Mobile | Yes | Web portal base URL for API calls |
| `SETUP_TOKEN` | Server only | Setup only | `/api/setup-db` auth |

---

## Security

| Document | Contents |
|----------|---------|
| [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) | 300-rule compliance audit |
| [`THREAT_MODEL.md`](./THREAT_MODEL.md) | STRIDE analysis, attack scenarios |
| [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md) | HTTP security headers explained |
| [`API_SECURITY_REPORT.md`](./API_SECURITY_REPORT.md) | Per-route auth, rate limits, validation |
| [`SECURITY.md`](./SECURITY.md) | Vulnerability reporting policy |

### Key Controls

| Control | Implementation |
|---------|---------------|
| Server-side score validation | `/api/quiz-submit` recalculates from `quizQuestions` — client score ignored |
| Admin access | JWT + `ADMIN_EMAILS` server-side; localStorage never trusted |
| RLS | 14 Supabase tables: RLS enabled + `auth.uid()` policies |
| Rate limiting | All 53 API routes: 3–60 req/min per IP (in-memory) |
| Payload limits | 4 KB / 8 KB / 32 KB per route |
| HSTS | 2 years, includeSubDomains, preload |
| CSP | Strict allowlist, `frame-ancestors 'none'`, `object-src 'none'` |
| Password | Min 12 chars, upper + lower + number + special |
| Bot protection | reCAPTCHA v3 on login, signup, reset, profile save |
| Structured logging | JSON `{ ts, level, route, message, ip, userId, reason }` |
| Stripe webhooks | HMAC-SHA256 signature verify before any access grant |
| Razorpay payments | HMAC-SHA256 signature verify before any access grant |

---

## Security Gate

`scripts/security-gate.sh` — 13 checks, 3 modes.

| Trigger | Mode | Extra checks |
|---------|------|-------------|
| `git commit` | `--quick` | TypeScript, secrets, XSS, rate limits, payload limits, mock data, untracked files, passwords, headers, RLS, `.vercelignore` |
| `git push` | `--ci` | Above + npm audit + backend Jest |
| `bash scripts/deploy.sh` | `--full` | Above + Next.js build |

```bash
bash scripts/security-gate.sh --quick
bash scripts/security-gate.sh --ci
bash scripts/security-gate.sh --full
```

---

## Local Development

```bash
git clone https://github.com/schinchli/katalyst-lms-web.git lms
cd lms
npm install                        # also installs git hooks via "prepare"
cd apps/web
cp .env.example .env.local         # fill in Supabase + Stripe + reCAPTCHA keys
npm run dev                        # → http://localhost:8080
```

### Run tests

```bash
# Backend (from lms/)
cd backend && npm test

# Web (from apps/web/)
npm test

# Web E2E
npx playwright test

# TypeScript
cd apps/web && npx tsc --noEmit
```

### Deploy

```bash
cd ~/Documents/Projects/lms
bash scripts/deploy.sh             # full security gate + vercel --prod --yes
```

---

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md).
