# Desired Features Backlog

## Goal
- Reach practical Elite Quiz feature parity across website, admin dashboard, and Expo app without breaking LMS architecture, store compliance, or shared CRUD foundations.

## Completed Work

### Shared Config and Admin-Controlled Content
- Added admin-managed app content for privacy, terms, about, and instructions.
- Added public and admin APIs for app content and system feature config.
- Synced managed app content into website public pages and Expo screens.
- Added managed quiz content normalization, storage, admin API access, and shared runtime application.
- Replaced static-only quiz editing with website admin CRUD for managed quizzes and questions.
- Added quiz import from static catalog into managed content.
- Added bulk JSON import and JSON export for managed quiz payloads.
- Added managed quiz duplication and question duplication.
- Added question reordering and variable option-count controls with 2-5 option guardrails.
- Added editable question category and difficulty fields.
- Added true/false authoring preset for questions.
- Added per-quiz scoring fields and fixed-question-count controls.

### Runtime Wiring Already Done
- Website quiz runtime now honors managed `fixedQuestionCount`, `correctScore`, and `wrongScore`.
- Expo quiz runtime now honors managed `fixedQuestionCount`, `correctScore`, and `wrongScore`.
- Website quiz submission API now validates and scores using managed quiz data.
- Expo summaries and reward paths now use managed point scoring instead of old raw-correct assumptions.

### Daily Quiz Features Already Done
- Added admin-controlled daily quiz enablement, label, and selected quiz.
- Added deterministic fallback rotation across visible non-premium quizzes when the configured daily quiz is invalid.
- Added daily quiz cards and completion state to website dashboard and Expo home.
- Added daily quiz status to progress/history surfaces on website and Expo.
- Added daily quiz emphasis to discovery lists, history entries, leaderboard surfaces, and quiz detail/result screens.
- Added direct daily-quiz CTAs in progress and leaderboard surfaces on website and Expo.
- Added admin preview/validation for configured daily quiz, including disabled/premium warnings.
- Added discovery-card daily quiz CTA language on website and Expo.
- Preserved daily quiz visibility when search/filter state would otherwise hide it on website and Expo.
- Added admin-side resolved daily target preview showing actual title, ID, and source.

### Verification and Hardening Already Done
- Restored missing mobile challenge mappings and fixed related runtime/test issues.
- Hardened mobile font-scale fallback and flashcard hint rendering.
- Fixed Jest setup drift for the mobile theme store.
- Removed import-time payment env crashes in website payment routes by lazy initialization.
- Added missing admin TS config shell.
- Ensured current validation loop stays green with:
- `npm run type-check`
- `npm run build --workspace=apps/web`
- `npm test --workspace=mobile`

## Pending Work

### P0: Finish Shared CRUD Foundation
- ~~Category and subcategory CRUD.~~ **DONE (2026-03-16/03-16)** — Types, API route, settings state/handlers, and save-to-API all verified complete. Category dropdown now wired into managed quiz editor (select populated from managed categories; falls back to plain text input when no categories exist or category doesn't match).
- ~~Quiz/question delete safety and dependency checks.~~ **DONE (2026-03-16)** — DELETE on `/api/admin/quiz-content` removes quiz + questions, clears `dailyQuizQuizId` if matched. Settings page shows inline React confirmation modals (no `window.confirm`; passes security gate).
- Managed content persistence cleanup. **PARTIAL** — `progress/page.tsx` and `leaderboard/page.tsx` now call `useManagedQuizContentVersion()` to re-render on content changes. Full migration of remaining `quizzes`/`quizQuestions` static reads to managed-aware selectors is still pending.

### P1: Complete Daily Quiz and Managed Discovery Parity
- ~~Daily quiz-aware reusable cards/components.~~ **DONE** — `DailyQuizBadge` component created (`apps/web/src/components/DailyQuizBadge.tsx`). Quiz discovery cards now use it instead of inline chip styles.
- Daily quiz filtering behavior consistency.
  Implementation notes:
  Keep the featured quiz visible across any future filter/search entry points, not only the current discovery tabs, and centralize that logic into shared selectors.
- ~~Daily quiz analytics/admin observability.~~ **DONE (2026-03-17)** — `/api/admin/daily-quiz-analytics` endpoint tracks attempts + completions + completion rate from `app_settings.daily_quiz_stats`. quiz-submit route increments counters on every daily quiz submission (best-effort, never blocks submit). Admin settings section now shows live Attempts / Completions / Completion Rate stat cards.

### P2: True/False Mode
- ~~True/False gameplay mode end to end.~~ **DONE (2026-03-16)** — Mode badge on intro, auto-detected from `quiz.mode === 'true_false'` or all-2-option questions, large TRUE/FALSE buttons in quiz runtime.
- ~~True/False mode admin controls.~~ **DONE (2026-03-16)** — Mode dropdown in admin settings with `true_false` option; `QuizMode` type in web and mobile types.
- ~~True/False reporting and history.~~ **DONE** — Progress/history page now shows a small "T/F" badge next to result entries for `mode === 'true_false'` quizzes, and an "EXAM" badge for `mode === 'exam'`. Mode is looked up from the static quiz metadata.

### P3: Exam Mode
- ~~Exam-mode runtime.~~ **DONE (2026-03-16)** — `mode = 'exam'` disables per-question timer, shows EXAM header badge, shows "Question N of M" progress, hides correct answers in results when `examReviewAllowed = false`.
- ~~Exam-mode admin settings.~~ **DONE (2026-03-16)** — Mode dropdown with Exam option, `examReviewAllowed` checkbox (visible only when mode = exam) in the managed quiz editor.
- ~~Exam-mode compliance surface.~~ **DONE** — Web quiz player now has a comment documenting that screen-recording protection is not available on web (mobile-only). Mobile intro shows "answers will not be shown after submission" hint when `examReviewAllowed === false`. `examReviewAllowed` admin toggle already present in settings.

### P4: Remaining Elite Quiz Modes
- ~~Multi Match.~~ **DONE (2026-03-16)** — Click-to-pair left/right column UI; wrong pair flashes red; all-correct → feedback + Next. Admin pair editor (add/remove pairs). normalizeQuestion preserves matchPairs. Web + mobile.
- ~~Fun and Learn.~~ **DONE (2026-03-16)** — Explanation shown as "Learning Card" before options; "Got it →" reveals options; results headline "Learning Complete!" + "Questions explored: N". Web + mobile. Mode badge on intro.
- ~~Guess the Word.~~ **DONE (2026-03-16)** — Text input + optional hint reveal; case-insensitive comparison against wordAnswer; feedback shows correct answer if wrong. Admin wordAnswer + hint fields. Web + mobile.
- ~~Audio Quiz.~~ **DONE (2026-03-16)** — HTML5 `<audio>` element on web; graceful fallback text on mobile (expo-audio not a dependency). Admin audioUrl + audioFallbackText fields. Mode badge on intro.
- ~~Maths Quiz.~~ **DONE (2026-03-16)** — Numeric input; ±0.01 float tolerance; larger font for math questions; shows correct answer if wrong. Admin numericAnswer field. Web + mobile.
- ~~Bookmark/review parity.~~ **DONE (2026-03-16)** — Web: bookmark toggle (☆/★) per question in quiz player, persisted to localStorage; /dashboard/bookmarks page with list + Remove + Start Review; sidebar Bookmarks link; quiz player supports ?review=bookmarks param. Mobile: Start Review button on bookmarks tab → /quiz/bookmarks-review screen with full quiz flow.

### P5: Competitive Modes
- ~~Contest lifecycle.~~ **DONE (2026-03-16)** — `/api/contests` (public GET) + `/api/admin/contests` (GET/POST/DELETE). `/dashboard/contests` with live/upcoming/past tabs and enter CTA. Contest CRUD section in admin settings. `Contest` type extended with `rules`, `maxAttempts`, `resultsPublishedAt`.
- ~~One vs One / Group / Random Battle shell.~~ **DONE (2026-03-16)** — `/api/battle` session create/join/answer with invite codes. `BattleSession`/`BattlePlayer`/`BattleStatus` types. `/dashboard/battles` mode selector, `/dashboard/battles/battle` lobby + waiting room. `mobile/app/battle.tsx` + `mobile/app/battle-lobby.tsx`.
- ~~Self Challenge.~~ **DONE (2026-03-16)** — `/dashboard/self-challenge` personal-best comparison surface. Web + mobile quiz results show personal best delta.
- ~~Realtime state sync.~~ **DONE (2026-03-17)** — Supabase Realtime broadcast channel extended with `score_update`, `progress_update`, and `finish` events. `broadcastScore` helper fires after every answer POST and pushes live scores to all participants. Battle overlay receives updates instantly and renders a live score table sorted by rank. `window.__katalystBroadcastScore` bridge wires the quiz player to the battle channel without prop drilling. REST polling kept as fallback.

### P6: Economy and Monetization
- ~~Coins earn/spend ledger.~~ **DONE (2026-03-16)** — `/api/coins` returns balance + transaction history. `CoinTransaction`/`CoinReasonCode`/`CoinPack` types. `/dashboard/coins` balance + history page. DB migration comments embedded in route.
- ~~Referrals and reward crediting.~~ **DONE (2026-03-16)** — `/api/referral` GET (fetch/create code) + POST (redeem). `ReferralInfo` type. Referral share card in web profile page (navigator.share + clipboard copy).
- ~~Coin store.~~ **DONE (2026-03-16)** — `/api/coin-packs` (public enabled packs) + `/api/admin/coin-packs` (CRUD). `/dashboard/store` and `/dashboard/coin-store` storefront pages. Admin coin packs section in settings.
- Store-compliant subscriptions and IAP. **PARTIAL** — Web coin purchase UI shell exists (Razorpay). Mobile store shows IAP compliance notice; no expo-iap dependency added yet. Full store-billing integration pending.
- ~~Remove-ads purchase and ad controls.~~ **DONE (2026-03-16)** — `/api/ads` returns per-user `adsRemoved` entitlement. `User.adsRemoved` field. `SystemFeaturesConfig` ad kill-switches (`adsEnabled`, `bannerAdsEnabled`, `interstitialAdsEnabled`, `rewardedAdsEnabled`).

### P7: Platform, Compliance, and Release Readiness
- ~~Maintenance mode and force-update flows.~~ **DONE (2026-03-16)** — `maintenanceMode`/`maintenanceMessage`/`forceUpdateEnabled`/`minimumAppVersion`/`currentAppVersion`/`appStoreUrl`/`playStoreUrl` in `SystemFeaturesConfig`. `MaintenanceBanner.tsx` full-screen overlay wired into `PlatformExperienceProvider`. Mobile `MaintenanceScreen.tsx` + `ForceUpdateScreen.tsx`. `semverLessThan` comparison in `_layout.tsx`. Admin toggles in settings.
- ~~Privacy/account deletion.~~ **DONE (2026-03-16)** — `/api/account/delete` route (POST, rate-limit 5/min, service-role deletion cascade). Web profile Danger Zone with inline confirmation (type "DELETE"). Login page `?deleted=1` banner. Mobile profile Danger Zone with TextInput confirmation. No `window.confirm` used anywhere.
- ~~ATT / privacy manifest / data safety (code).~~ **DONE (2026-03-17)** — `expo-tracking-transparency` added to `mobile/package.json`. `requestTrackingPermissionsAsync` uncommented in `_layout.tsx` (iOS-guarded, fires before ad SDK init). Plugin + `NSUserTrackingUsageDescription` wired in `app.json`. `PrivacyInfo.xcprivacy` in place. Full Play Console Data Safety form = manual step, not done yet.
- ~~Production policy audit document.~~ **DONE (2026-03-16)** — `STORE_READINESS_AUDIT.md` with full checklist, hard blockers, and implementation notes.

**P7 Remaining Hard Blockers (not code — require external action or new native deps):**
- Implement Apple StoreKit / Google Play Billing (`react-native-purchases` or `expo-iap`) before any paid feature goes live on mobile.
- Fill in Play Console Data Safety form and App Store Connect Privacy Nutrition Label (manual console steps).
- Add Restore Purchases flow once IAP is live.
- Run `npm install` + EAS native rebuild after adding `expo-tracking-transparency`.

## Recommended Next Implementation Order
1. Implement `react-native-purchases` (RevenueCat) for store-compliant IAP on iOS + Android.
2. Add Restore Purchases flow once IAP is wired.
3. Fill App Store Connect Privacy Nutrition Label + Play Console Data Safety form (manual steps).
4. Submit EAS build using Xcode 26 image (required from April 28, 2026).

## Current Verification Standard
- `npm run type-check`
- `npm run build --workspace=apps/web`
- `npm test --workspace=mobile`
