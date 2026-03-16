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
- ~~Category and subcategory CRUD.~~ **DONE (2026-03-16)** — Admin categories API route, `ManagedCategory`/`ManagedSubcategory` types, `normalizeManagedCategories()`, and full category management UI in settings (add, delete, subcategories).
- ~~Quiz/question delete safety and dependency checks.~~ **DONE (2026-03-16)** — DELETE endpoint on `/api/admin/quiz-content` with daily-quiz reference clearing, `window.confirm` delete buttons in settings UI.
- Managed content persistence cleanup.
  Implementation notes:
  Audit remaining places that still read directly from static `quizzes` / `quizQuestions` at runtime and switch them to managed-content-aware selectors first, falling back to static only where migration is incomplete.

### P1: Complete Daily Quiz and Managed Discovery Parity
- Daily quiz-aware reusable cards/components.
  Implementation notes:
  Extend shared card/list components to accept `isDailyQuiz`, `dailyActionLabel`, and `dailyCompleted` props so the same state is not manually duplicated in each screen.
- Daily quiz filtering behavior consistency.
  Implementation notes:
  Keep the featured quiz visible across any future filter/search entry points, not only the current discovery tabs, and centralize that logic into shared selectors.
- Daily quiz analytics/admin observability.
  Implementation notes:
  Add admin-facing counts for how many attempts today hit the resolved daily quiz and whether traffic is using configured selection or fallback rotation.

### P2: True/False Mode
- ~~True/False gameplay mode end to end.~~ **DONE (2026-03-16)** — Mode badge on intro, auto-detected from `quiz.mode === 'true_false'` or all-2-option questions, large TRUE/FALSE buttons in quiz runtime.
- ~~True/False mode admin controls.~~ **DONE (2026-03-16)** — Mode dropdown in admin settings with `true_false` option; `QuizMode` type in web and mobile types.
- True/False reporting and history.
  Implementation notes:
  Make progress/history surfaces distinguish true/false attempts from standard MCQ attempts where Elite Quiz parity expects separate mode identity.

### P3: Exam Mode
- ~~Exam-mode runtime.~~ **DONE (2026-03-16)** — `mode = 'exam'` disables per-question timer, shows EXAM header badge, shows "Question N of M" progress, hides correct answers in results when `examReviewAllowed = false`.
- ~~Exam-mode admin settings.~~ **DONE (2026-03-16)** — Mode dropdown with Exam option, `examReviewAllowed` checkbox (visible only when mode = exam) in the managed quiz editor.
- Exam-mode compliance surface.
  Implementation notes:
  Apply platform-safe screen-protection behaviors where supported and document unsupported cases clearly instead of implying protection that does not exist.

### P4: Remaining Elite Quiz Modes
- Multi Match.
  Implementation notes:
  Add managed question schema for match pairs, runtime UI for drag/select matching, answer validation, scoring, and admin CRUD/import support.
- Fun and Learn.
  Implementation notes:
  Add content type that emphasizes explanation-first progression and post-answer learning blocks rather than standard scoreboard-first quiz flow.
- Guess the Word.
  Implementation notes:
  Add per-question character/word payloads, hint handling, answer entry UI, and result validation across web and Expo.
- Audio Quiz.
  Implementation notes:
  Add audio asset support, preload/playback controls, accessibility fallback text, and admin upload/reference fields.
- Maths Quiz.
  Implementation notes:
  Add numeric answer support, formatted question rendering, and validation paths that are not limited to current option-based MCQ assumptions.
- Bookmark/review parity.
  Implementation notes:
  Finish bookmark management across every quiz surface and ensure bookmarked questions can be reviewed in a dedicated mode, not only toggled ad hoc.

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
