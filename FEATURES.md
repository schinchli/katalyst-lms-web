# Katalyst LMS — Features

> **Platform:** AWS Cloud & Generative AI Certification Preparation
> **Stack:** Next.js 15 (web) · Expo SDK 54 (mobile) · AWS Lambda + DynamoDB (backend)

---

## ✅ Live Features

### Web Portal (`apps/web`)
| Feature | Route | Details |
|---------|-------|---------|
| Dashboard | `/dashboard` | Stat cards (time, hours, score, completed), certification milestone goal + countdown + pace bars, 7-day activity strip (timezone-aware), rotating motivational quotes |
| Quiz Library | `/dashboard/quizzes` | CLF-C02 domain filter pills, completion badges, premium lock indicator |
| Course Landing Page | `/dashboard/quiz/[id]` | Hero banner, curriculum (full list), what's included, sidebar enroll card, "Start Free — 25 Questions" label for free users |
| Quiz Engine | `/dashboard/quiz/[id]` | Multi-phase: intro → quiz → upsell (free) / results (pro), 30s per-question timer, answer feedback + explanations, actual timeTaken tracking |
| Free Plan Gating | `/dashboard/quiz/[id]` | 25 randomly shuffled questions for free users; upsell checkpoint screen with score ring, locked-content stats, Pro/course CTAs, ad slot |
| Freemium Paywall | `/dashboard/quiz/[id]` | Razorpay-ready course unlock (per-quiz) + Pro subscription (₹999/yr, ₹149/mo); `useSubscription` hook — Supabase + localStorage |
| Progress Tracker | `/dashboard/progress` | Stat cards, overall completion bar, full quiz history table with Supabase sync |
| Learn / Media Player | `/dashboard/learn` | YouTube embed with real thumbnail URLs, 5-video AWS playlist, chapters accordion, dark-mode-safe CTA |
| Profile — Appearance | `/dashboard/profile` | 9 colour swatches, 5 OFL-licensed fonts, 4 font sizes, 16 IANA timezones — live CSS variable preview; saved to localStorage |
| Dark Mode | Global | `data-theme="dark"`, Moon/Sun toggle, localStorage persistence; theme applied on every dashboard mount via layout.tsx |
| Sidebar Search | Global | Live search across all quizzes by title/description/category/examCode |
| Admin Dashboard | `/dashboard/admin` | Revenue/purchase stats, upsell messaging editor (headline, body, CTAs, free question limit) with variable tokens — JWT-verified server-side |
| Google AdSense | Quiz + Quizzes pages | Adblocker detection via `useLayoutEffect` (synchronous, zero delay, no wasted API calls); AdSense script injected only when confirmed clean; adblocker notice with step-by-step whitelist guide + Pro upsell; Pro users ad-free |
| E2E Test Suite | `apps/web/e2e/` | Playwright: auth, dashboard, quizzes, quiz engine, learn, progress, profile, dark mode, sidebar navigation, security — graceful skip without credentials |

### Backend Lambdas (`backend/lambdas/`)
| Lambda | Endpoint | Description |
|--------|----------|-------------|
| quizSubmit | `POST /quiz/submit` | Validates, saves attempt, updates stats, emits EventBridge event |
| progressFetch | `GET /progress` | Returns statistics + last 10 attempts (parallel DynamoDB fetch) |
| leaderboardFetch | `GET /leaderboard?period=` | Top-20 for daily / monthly / alltime periods |
| purchaseValidate | `POST /purchase/validate` | Stub — Stripe webhook handler (pending) |

### Quiz Content
| Quiz | Exam Code | Questions | Access |
|------|-----------|-----------|--------|
| CLF-C02 Full Practice Exam | CLF-C02 | 195 | Premium ₹499 |
| CLF-C02: Cloud Concepts | CLF-C02 | 29 | Free (25Q limit) |
| CLF-C02: Security & Compliance | CLF-C02 | 42 | Free (25Q limit) |
| CLF-C02: Technology | CLF-C02 | 90 | Free (25Q limit) |
| CLF-C02: Billing, Pricing & Support | CLF-C02 | 34 | Free (25Q limit) |
| AWS Quick Start | CLF-C02 | 5 | Free (no limit) |
| **Total** | | **395** | |

### Testing & CI/CD
| Item | Details |
|------|---------|
| Jest tests | 82 tests, 6 suites |
| Coverage | 100% statements, 100% functions |
| Playwright E2E | 3 spec files — auth, dashboard/security, full authenticated flow |
| GitHub Actions | 4-job CI: backend tests, web type-check, web build, mobile type-check |
| Branch protection | `ci-passed` gate required before merge |

---

## 🚧 Planned Features

### Phase 2 — Content Expansion
- [ ] Multi-cloud quiz library: Azure, GCP, Nvidia, Kubernetes (brand filter + per-brand domain filters)
- [ ] Dynamic search across all providers with real-time filtering
- [ ] Quiz CRUD in admin (add/edit/delete questions without code deploy)

### Phase 3 — Payments (Production)
- [ ] Razorpay live keys + webhook verification
- [ ] Subscription management page (cancel, billing history)
- [ ] purchaseValidate Lambda full implementation

### Phase 4 — Gamification
- [ ] Daily/weekly streak tracking
- [ ] Badge engine (perfect score, streak milestones, first quiz)
- [ ] Leaderboard page connected to live DynamoDB Lambda

### Phase 5 — Production Infrastructure
- [ ] CDK deployment (DynamoDB tables, Cognito, API Gateway, EventBridge)
- [ ] Custom domain + CloudFront
- [ ] EAS Build + App Store submission
- [ ] CloudWatch dashboards + error alerting
