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
- Daily quiz analytics/admin observability. **PARTIAL** — Admin settings section shows a "coming soon" placeholder. Backend attempt-count tracking not yet built.

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
- Contest lifecycle.
  Implementation notes:
  Add admin CRUD for contests, publication windows, entry rules, and results surfaces on both website and Expo.
- One vs One Battle, Group Battle, Random Battle, Self Challenge.
  Implementation notes:
  Define battle/session models, invitation or matchmaking flows, question synchronization, score updates, timeout handling, and end-state reconciliation.
- Realtime state sync.
  Implementation notes:
  Choose backend transport and state model for multiplayer events, then build leaderboard/battle updates without relying on static or local-only state.

### P6: Economy and Monetization
- Coins earn/spend ledger.
  Implementation notes:
  Replace local-only reward assumptions with backend ledgering, reason codes, anti-duplication checks, and visible transaction history.
- Referrals and reward crediting.
  Implementation notes:
  Add referral codes, redemption rules, abuse prevention, and admin visibility into referral conversion/reward issuance.
- Coin store.
  Implementation notes:
  Build admin-managed packs, storefront UI, purchase verification, and balance updates from a single backend source of truth.
- Store-compliant subscriptions and IAP.
  Implementation notes:
  Remove non-compliant mobile digital purchase flows, move mobile digital goods/subscriptions to App Store / Play billing where required, and keep website payment flows segmented appropriately.
- Remove-ads purchase and ad controls.
  Implementation notes:
  Build entitlement-aware ad rendering with admin toggles for banner/interstitial/rewarded placements and safe fallback behavior when ads are disabled.

### P7: Platform, Compliance, and Release Readiness
- Maintenance mode and force-update flows.
  Implementation notes:
  Add shared remote config support, blocking and non-blocking update messaging, and environment-safe rollout controls.
- Privacy/account deletion evidence.
  Implementation notes:
  Provide visible in-app deletion path, privacy disclosures, and support/contact routing required for store review.
- ATT / privacy manifest / data safety completion.
  Implementation notes:
  Audit tracking usage, SDK manifests, consent flows, and store-declared data collection against actual runtime behavior.
- Production policy audit.
  Implementation notes:
  Re-check App Store and Play Store rules after monetization changes, especially around digital goods, ads, user-generated content, and account management.

## Recommended Next Implementation Order
1. Finish category/subcategory CRUD and remaining managed-content selectors.
2. Add explicit quiz mode metadata, then complete true/false mode end to end.
3. Build exam mode on top of the same mode metadata.
4. Move to remaining single-player modes before multiplayer/battle systems.
5. Replace mobile digital purchases with store-compliant IAP/subscription flows before calling the app store-ready.

## Current Verification Standard
- `npm run type-check`
- `npm run build --workspace=apps/web`
- `npm test --workspace=mobile`
