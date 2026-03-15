# Desired Features Backlog

## Goal
- Reach functional parity with the Elite Quiz reference where it is compatible with the LMS product direction, web app architecture, Expo app constraints, and Apple/Google store policies.

## P0: Current Functional Foundation
- Replace static quiz-only configuration with admin-managed quiz and question content.
- Keep website, admin dashboard, and Expo app in sync from shared backend settings.
- Ensure all POST routes have rate limits and payload limits.
- Remove mobile-only compliance blockers for digital purchases.
- Keep feature work behind stable CRUD and shared config primitives.

## P1: Content and Admin CRUD
- Managed quiz CRUD for create, update, delete.
- Question CRUD inside managed quizzes.
- Import existing static quizzes into managed content.
- Bulk import flow for quiz/question payloads.
- Category and subcategory CRUD.
- Per-quiz scoring, duration, visibility, and fixed-question settings.
- Daily quiz content assignment from managed quiz pool.

## P2: Core Elite Quiz Modes
- True/False mode.
- Daily quiz completion and history.
- Exam mode with exam-specific controls.
- Multi Match mode.
- Fun and Learn mode.
- Guess the Word mode.
- Audio quiz mode.
- Maths quiz mode.
- Bookmark parity and review flows.

## P3: Competitive Modes
- Contest lifecycle and admin management.
- One vs one battle.
- Group battle.
- Random battle.
- Self challenge.
- Realtime leaderboard and battle state sync.

## P4: Economy and Monetization
- Coins earn/spend flows.
- Referrals and reward crediting.
- Coin store.
- Store-compliant IAP / subscriptions.
- Remove-ads purchase.
- Banner, interstitial, and rewarded ad controls.

## P5: Platform, Compliance, and Store Readiness
- Maintenance mode and force update flows.
- App/privacy/account deletion evidence.
- ATT/privacy manifest review.
- Screenshot / recording restrictions for exam mode where allowed.
- App Store compliant digital purchase flows.
- Play Store policy alignment and production asset checks.

## Active Next Smallest Task
- Add “import existing quiz into managed content” from the website admin settings page so static quizzes can be converted into editable managed records without manual re-entry.
