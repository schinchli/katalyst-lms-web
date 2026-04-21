# Changelog

All notable changes to the Katalyst LMS platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Pending
- CDK infrastructure (DynamoDB tables, Cognito, API Gateway)
- Stripe/purchase flow (purchaseValidate Lambda full implementation)
- Push notifications (Expo + SNS)
- Streak tracking + badge engine

---

## [0.10.3] — 2026-04-21 — Web Auth Hardening: OTP Verify + Middleware Route Protection

### Added

- **`/verify-email` page** — 6-digit OTP entry with paste support, auto-advance, resend, expiry errors; matches mobile verify screen UX
- **Next.js `middleware.ts`** — edge-level route guard: `/dashboard/**` requires auth (redirects to `/login?next=...`); auth pages redirect authenticated users to `/dashboard`
- **`@supabase/ssr`** — replaced `createClient` with `createBrowserClient` (cookie-based sessions) enabling server-side auth reads in middleware
- **Login banners** — `?verified=1` (email confirmed) and `?reset=success` (password updated) contextual feedback
- **`?next=` redirect** — login page honours the destination preserved by middleware
- **E2E test suite** — `apps/web/e2e/auth-flows.spec.ts`: 22 test cases covering route protection (TC-RP), signup (TC-SU), OTP verification (TC-VE), login (TC-LI), authenticated redirects (TC-AU), password reset (TC-PR)

### Changed

- Signup no longer shows inline "confirm" state — redirects to `/verify-email?email=...`
- Supabase auth config: `enable_confirmations=true`, `mailer_otp_length=6`, `mailer_otp_exp=3600`, email template updated to say "60 minutes"

---

## [0.10.2] — 2026-04-21 — Disposable Email Block + Docs Sync

### Added

- **Disposable email validation** — 30+ throwaway providers blocked at signup on both mobile and web; server-side gate added to `/api/sync-user` (422) to catch any client bypass
- **Email format validation** — regex check before Supabase call on mobile signup
- **Shared util** — `apps/web/src/lib/emailValidation.ts` (`isDisposableEmail`, `isValidEmailFormat`) used by signup page and sync-user route

### Docs

- `FEATURES.md` — added Mobile Auth section tracking all auth screens + v0.10.0/v0.10.1 fixes
- `FEATURE_IMPLEMENTATION_LOG.md` — full 2026-04-21 session log added
- `.claude/skills/mobile-auth.md` — new skill documenting auth store patterns, AuthGuard rules, guest flow, drawer logic, OTA discipline

---

## [0.10.1] — 2026-04-21 — Auth Reliability + Home Screen Spacing

### Fixed (Mobile)

- **Drawer Login/Logout toggle** — `signInUser` and `onAuthStateChange` now always set `step: 'authenticated'` on successful sign-in, even when the `user_profiles` fetch times out or fails; drawer now correctly shows "Log Out" for authenticated users
- **Continue as Guest** — `setGuestUser()` now followed by `router.replace('/(tabs)')` on both login and signup screens; guest navigation no longer silently no-ops

### Changed (Mobile)

- **Home screen spacing** — `gap` increased from 12→18, `paddingTop` from 12→20; horizontal padding now adapts to device width via `useWindowDimensions` (16px on small phones, 20px on standard, 24px on large screens)

---

## [0.10.0] — 2026-04-21 — Premium Auth UI Redesign

### Changed (Mobile)

- **Premium input fields** — all 4 auth screens (login, signup, forgot-password, verify) replace boxed `Input` components with borderless tinted-background fields; each field has a prefix icon (mail, lock, user, hash) and password fields have an eye-toggle for show/hide
- **Gradient CTA buttons** — "Sign In", "Get Started", "Send Reset Code", "Reset Password", "Verify Email" buttons now use a horizontal `LinearGradient` (brand colours) instead of flat solid fill
- **Google sign-in button** — Feather `globe` icon and "Continue with Google" text replaced with a proper `#4285F4` Google G badge and "Google" label; no EN language chip
- **Verify screen flattened** — was still using the old coloured hero card + elevated form card pattern; now matches the flat layout of the other 3 auth screens
- **Uniform auth layout** — all 4 screens share identical structure: icon/logo mark · heading · subheading · borderless inputs · gradient CTA · footer links; `gap: 28` scroll container, `borderRadius: 16` inputs, `borderRadius: 20` icon circles

### Fixed (Mobile)

- **EN language chip removed** — was a leftover from old hero-card design; no language indicator appears anywhere on auth screens
- **No more "two boxes"** — email + password inputs no longer render as hard-bordered cards on Android

---

## [0.9.0] — 2026-04-20 — Mobile UX Polish: Navigation, Flashcard Memory Flow & Auth

### Added (Mobile)

- **Flashcard memory buttons** — flip a card to reveal "Still learning ↻" (orange) and "I knew it ✓" (green) action buttons; known cards are removed from the active queue immediately
- **Flashcard review screen** — tapping Finish after the last card opens a full review screen showing:
  - Stats banner: Total cards · You know (green) · To learn (orange)
  - Mastery progress bar with percentage
  - ↻ Still Learning list — each card has a per-card ✓ button to mark known inline
  - ✓ I Knew It list (dimmed) — cards already mastered this session
- **Flashcard complete screen** — once all cards are known (via practice or Mark All Known), shows a trophy, full stats banner, progress bar, and two CTAs: Restart Flashcards / Go to Home
- **Flashcard bulk actions** — "Mark All Known" button in review footer completes the entire pack in one tap; "Practice Again" reruns only the still-learning subset
- **Flashcard AsyncStorage persistence** — known set persisted per filter pack using `flashcards-known-{filter}` key; survives app restarts
- **Login/Logout in hamburger drawer** — drawer footer shows Log In (primary blue) for guest/unauthenticated users and Log Out (red) for authenticated users; Login closes drawer and navigates to auth screen
- **Quiz equal-width buttons** — Previous and Check/Next buttons in quiz nav are now equal width (`flex: 1`) for a consistent tap target
- **Home screen "See All →" link** — quizzes section header now has a tappable See All → link routing to the Quizzes tab
- **Reduced home screen spacing** — top padding reduced from 58 px to 12 px; gaps tightened for a denser, cleaner layout

### Fixed (Mobile)

- **Guest auth redirect bug** — `AuthGuard` was bouncing guest users (`isAuthenticated: true, step: 'guest'`) back to `/(tabs)` immediately when they tapped Log In from the profile page or hamburger; fixed by allowing `step === 'guest'` users through to `/(auth)` routes
- **Navigation hamburger overlap** — replaced floating absolute-positioned trigger (hardcoded `top: insets.top + 88`) with a proper `AppHeader` component that lives above the `<Tabs>` in the layout; eliminates overlap with "Hi Guest" / page title area
- **Drawer state centralised** — extracted drawer open/close/toggle into a Zustand `drawerStore`; `AppHeader` and `MobileLeftDrawer` share the same store, eliminating duplicate state and stale-closure bugs

### Added (P6 — Economy and Monetisation, 2026-03-16)
- **P6 — Economy and Monetisation (2026-03-16)**
  - **Coin Ledger API** — quiz-submit awards coins after each attempt: `quiz_complete` (score × correctScore), `perfect_score` (+10), `daily_quiz` (+5); inserts into `coin_transactions` table and calls `increment_user_coins` RPC on `user_profiles`
  - **Remove-Ads Entitlement** — new `GET /api/ads` returns per-user `adsRemoved` flag from `user_profiles.ads_removed`; `AdBanner.tsx` and `AdBanner.native.tsx` check global kill-switch (`systemFeatures.adsEnabled + bannerAdsEnabled`) AND per-user entitlement before rendering
  - **SystemFeaturesConfig ad controls** — added `adsEnabled`, `bannerAdsEnabled`, `interstitialAdsEnabled`, `rewardedAdsEnabled` (all default `true`) with matching `DEFAULT_SYSTEM_FEATURES` and `normalizeSystemFeatures` handlers
  - **Progress page coin balance** — coin balance KPI card + last-5 transaction feed with reason labels and link to `/dashboard/coins`
  - **Mobile IAP notice** — "Premium Subscription" panel in profile tab explaining App Store / Google Play billing and "Restore Purchases" button (placeholder until `expo-iap` integration); no Razorpay calls for digital goods on mobile
  - **Referral system** — `GET /api/referral` derives code from userId; web profile page shows share card with `navigator.share` + clipboard fallback
  - **Coin store** — admin coin packs CRUD via `GET/POST /api/admin/coin-packs`; public packs via `GET /api/coin-packs`; admin Settings UI; web `/dashboard/store` page; mobile coin store screen with compliance notice
- **Admin-managed quiz premium/free overrides** using `app_settings.key = quiz_catalog_overrides`
  - New admin API: `GET/POST /api/admin/quiz-catalog`
  - New public API: `GET /api/quiz-catalog`
  - New shared merge layer: `apps/web/src/lib/quizCatalog.ts`
  - Mobile startup sync now applies admin quiz overrides before the app renders the catalog
  - Web dashboard settings page now exposes a per-quiz premium toggle and price field

### Changed
- CLF-C02 gating policy now defaults to:
  - `clf-c02-full-exam` premium
  - `clf-c02-cloud-concepts`, `clf-c02-security`, `clf-c02-technology`, `clf-c02-billing` free
- Quiz gating is no longer treated as hardcoded catalog data only; admin overrides can change it without editing source files

---

## [0.7.0] — 2026-03-08 — Freemium Gating, AdSense, Upsell & Admin Messaging

### Added
- **Free plan question limit** — free users get 25 randomly shuffled questions per quiz (Fisher-Yates shuffle); Pro and individually-unlocked users get all questions; `startQuiz(forceAllQuestions)` param avoids React state timing race on post-purchase start
- **Upsell checkpoint screen** (`phase: 'upsell'`) — shown after free user completes question 25 instead of results:
  - Progress bar showing `25 / N` in gold to visualise locked content
  - Score ring (green ≥70%, amber <70%) so users see their partial performance
  - "Locked content" stats strip: questions locked, full domains, exam time
  - Admin-editable headline + body copy with `{n}`, `{remaining}`, `{score}`, `{total}`, `{price}` interpolation variables
  - Pro CTA (amber gradient) + monthly option + individual quiz unlock (when `quiz.price > 0`) + skip link
  - AdBanner injected between CTAs and skip — monetises non-converting free users
- **Google AdSense integration** (`src/components/AdBanner.tsx`):
  - Instant adblocker detection via `useLayoutEffect` — synchronous, zero delay, no API calls wasted
  - Bait element (`.adsbox`) — targeted by all major filter lists (EasyList, uBlock, Brave)
  - AdSense script injected only after confirming no blocker (`adBlocked === false`)
  - `script.onload` callback replaces arbitrary `setTimeout(300)` for ad push
  - Adblocker notice: shield icon, "How to whitelist" toggle with step-by-step instructions for uBlock Origin, AdBlock Plus, Brave; "Go Ad-Free — Pro ₹999/yr" CTA
  - Pro users never see ads; `dismissed` state lets users close the notice
  - Ad slots: quiz intro (horizontal before curriculum + rectangle after What's Included), quiz results (horizontal before action buttons), quizzes list (horizontal before and after quiz grid)
- **Admin Dashboard — Messaging Editor** (`/dashboard/admin`):
  - Editable fields: free question limit, headline copy, body copy, Pro CTA label, Course CTA label, Skip link label
  - Variable reference panel showing available interpolation tokens
  - Save → persists to `localStorage('katalyst-admin-msgs')` immediately
  - Reset to defaults button
  - Changes propagate to all quiz pages on next load
- **Dashboard — Certification Milestone Goal**:
  - Pick any cert + target date → countdown timer (days remaining)
  - On-track / Ahead / Behind status badge based on expected vs actual progress
  - Two comparison bars: your pace vs expected pace
  - Persisted in `localStorage('katalyst-milestone')`
- **Dashboard — 7-Day Activity Strip**: coloured dots for each of the last 7 days; "Done today" pill; timezone-aware via `Intl.DateTimeFormat`
- **Dashboard — Motivational Quotes**: rotating cloud-agnostic quotes (by day of month) replace the static date subtitle; all SIL-OFL-safe, no AWS-specific copy
- **Profile — Appearance Settings**:
  - 9 preset colour swatches (Violet, Sky, Teal, Emerald, Rose, Amber, Orange, Indigo, Slate) — live CSS variable injection
  - 5 OFL-licensed fonts: Public Sans, Inter, DM Sans, Nunito, Poppins — loaded from Google Fonts on demand
  - 4 font size presets (13 / 14 / 15 / 16 px)
  - 16 IANA timezone options for activity tracking — auto-detects browser timezone on first load
  - Theme persisted to `localStorage('katalyst-theme')`; applied on every dashboard page load via `layout.tsx` `useEffect`
- **Playwright E2E test suite** (`apps/web/e2e/`):
  - `playwright.config.ts` — Chromium, base URL `:8080`, retain-on-failure traces
  - `01-auth.spec.ts` — login form, blank validation, bad credentials, redirect, signup
  - `02-dashboard.spec.ts` — login UI, unauthenticated redirect, `/api/sync-user` 401
  - `03-authenticated.spec.ts` — full dashboard, quizzes, quiz engine, learn, progress, profile, dark mode, sidebar nav, security (requires `TEST_EMAIL` + `TEST_PASSWORD` env vars; graceful skip without them)
- **Supabase quiz results merge** — on quiz page load, Supabase results merged into `localStorage` so all downstream reads stay consistent

### Changed
- **Quiz `timeTaken`** — was hardcoded `0`; now tracked with `quizStartTs = useRef<number>(0)` recording `Date.now()` on `startQuiz()` and computing delta on finish
- **Learn page — YouTube thumbnails** — replaced SVG gradient placeholders with real `img.youtube.com/vi/{id}/mqdefault.jpg` URLs + `onError` opacity fallback
- **Learn page — Quiz CTA dark mode** — hardcoded `#EBF9FF` gradient replaced with `var(--primary-light)`
- **Quiz data — premium split**:
  - Premium (paid): `clf-c02-full-exam` (195Q, ₹499)
  - Free (ad-supported, 25Q limit): all other quizzes — Cloud Concepts, Security, Technology, Billing
- **Activity strip timezone** — `toISOString().split('T')[0]` (UTC) replaced with `Intl.DateTimeFormat('en-CA', { timeZone })` for correct IST/non-UTC date matching

### Fixed
- Post-payment `startQuiz()` now passes `forceAllQuestions = true` to bypass stale `isFreeUser` value before React state propagates
- `useLayoutEffect` bait-element detection prevents any AdSense network request when an adblocker is active

---

## [0.4.0] — 2026-03-01 — Tests + CI/CD

### Added
- **49 Jest unit tests** across 3 Lambda functions (100% statement coverage, 93.8% branch)
  - `quizSubmit`: 21 tests — `calculateRewards` pure function (6), auth (2), validation (4), happy path (9)
  - `progressFetch`: 10 tests — auth, data present, new user zero-state
  - `leaderboardFetch`: 18 tests — auth, period routing, table selection, rank/isCurrentUser, headers
- **GitHub Actions CI workflow** (`.github/workflows/ci.yml`) — 4 parallel jobs:
  - `backend-tests`: Jest + coverage report artifact
  - `web-type-check`: `tsc --noEmit` for Next.js app
  - `web-build`: `next build` smoke test
  - `mobile-type-check`: `tsc --noEmit` for Expo app
  - `ci-passed` gate: all jobs must pass before merge
- `jest.config.ts` + `tsconfig.json` in backend with coverage thresholds
- `calculateRewards` exported from `quizSubmit/index.ts` for unit testing

### Fixed
- `learn/page.tsx` — curly apostrophe U+2019 replaced with straight quote (TS1002 unterminated string)
- `learn/page.tsx` line 215 — invalid CSS `align` property replaced with `alignItems`

---

## [0.3.0] — 2026-02-28 — Katalyst Web Portal UI Overhaul

### Added
- **Vuexy design system** — Public Sans font, full CSS token set (`--primary: #7367F0`, `--text: #4B465C`, etc.)
- **Katalyst rebrand** — name, "K" logo mark, "Quiz Platform" sub-label throughout
- **Dashboard page** (`/dashboard`) — 4 stat cards (Time Spent, Hours, Test Results, Completed), "Courses You Are Taking" section, "Suggested For You" cards, Upcoming Webinar widget with inline SVG illustration, Course Completion bar
- **Quizzes page** — CSS class migration from inline styles, cert-level filter pills with accent colors
- **Course landing page** (`/dashboard/quiz/[id]`) — Vuexy Academy Course Details layout: hero banner, curriculum accordion, "What's Included" section, sidebar enroll card with meta table
- **Profile page** — gradient banner SVG, avatar initial, stats row (quizzes/avg/hours), edit form, danger zone
- **Progress page** — Vuexy stat cards, quiz history table with pass/fail badges
- **Dark mode** — `data-theme="dark"` on `<html>`, Moon/Sun SVG icons, `localStorage` persistence
- **Sidebar live search** — filters `quizzes[]` array by title/description/category/examCode, dropdown with up to 8 results + accent colors, outside-click dismiss
- **Learn / Media Player page** (`/dashboard/learn`) — YouTube iframe embed, playlist sidebar (5 AWS videos), chapters accordion, quiz CTA card

### Changed
- All inline `style={{}}` props migrated to `className` with `globals.css` component classes
- `themeConfig.ts` `templateName` → `'Katalyst'`
- `layout.tsx` title → `'Katalyst — Quiz Platform'`, added Google Fonts preconnect

---

## [0.2.0] — 2026-02-20 — Event-Driven Leaderboard + 8 New Quizzes

### Added
- **leaderboardFetch Lambda** — daily / monthly / alltime periods, top-20 entries, `isCurrentUser` flag, `Cache-Control: max-age=60`
- **EventBridge integration** in `quizSubmit` — emits `lms.quiz.submitted` event for async processors
- **8 new AWS certification quizzes** (80 questions):
  - AWS Certified AI Practitioner (AIF-C01)
  - AWS Certified Machine Learning Engineer – Associate (MLA-C01)
  - AWS Certified Data Engineer – Associate (DEA-C01)
  - AWS Certified Advanced Networking – Specialty (ANS-C01)
  - AWS Certified Security – Specialty (SCS-C02)
  - AWS Certified Database – Specialty (DBS-C01)
  - AWS Certified SAP on AWS – Specialty (PAS-C01)
  - AWS Cloud Practitioner Essentials (CLF-C02 extended)
- **14 total quiz categories** with 220+ questions across all certification tracks

---

## [0.1.0] — 2026-02-10 — MVP Backend Lambdas + Auth

### Added
- **quizSubmit Lambda** — validates input (Zod), writes `lms-quiz-attempts` + `lms-user-statistics` (atomic ADD), returns `{ attemptId, score, pct, passed, coinsEarned, xpEarned }`
- **progressFetch Lambda** — parallel DynamoDB fetch (statistics + last 10 attempts), zero-state for new users
- **purchaseValidate Lambda** (stub) — endpoint scaffolded
- **API Gateway** — `POST /quiz/submit`, `GET /progress`, `GET /leaderboard` with Cognito JWT authorizer
- **Cognito auth** (mobile + web) — sign-up / sign-in / confirm flows
- **Reward calculation** — `calculateRewards(score, total, difficulty)` with beginner/intermediate/advanced multipliers, perfect-score bonus

### Foundation
- Next.js 15 App Router web portal
- Expo SDK 54 React Native mobile app
- Turborepo monorepo (`apps/web`, `apps/mobile`, `packages/shared-types`, `packages/theme`)
- 12 core AWS quizzes, 130 questions (CLF-C02, SAA-C03, SAP-C02, DVA-C02, SCS-C02, ANS-C01, MLS-C01, DAS-C01, DOP-C02, GenAI/Bedrock series)
