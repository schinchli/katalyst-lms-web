# Feature Implementation Log

## 2026-03-16 (P5 — Competitive Modes)

### Contest Lifecycle (P5-1)

**`apps/web/src/app/api/admin/contests/route.ts`** — new file
- Admin CRUD API for managed contests stored in `app_settings` under key `managed_contests`.
- GET (admin-only), POST (normalizes + upserts), DELETE (removes by contestId).
- Exports `MANAGED_CONTESTS_KEY` and `normalizeContest()` for use by public route.
- Rate limit 20 req/min, 64 KB payload cap, Zod validation on all inputs.

**`apps/web/src/app/api/contests/route.ts`** — new file
- Public GET endpoint returning all managed contests from `app_settings`.
- Rate limit 60 req/min, service-role Supabase client.
- Imports `MANAGED_CONTESTS_KEY` and `normalizeContest` from admin route.

**`apps/web/src/app/dashboard/contests/page.tsx`** — new file
- `'use client'`, `dynamic = 'force-dynamic'`. Fetches `/api/contests` on mount.
- Three sections: Live (red), Upcoming (purple), Past (muted). Card grid layout.
- `ContestCard` with countdown timer for live contests, start time for upcoming, winner for past.
- `useCountdown(endTime)` hook for live display. "Enter Contest" navigates to quiz player.

**`apps/web/src/app/dashboard/settings/page.tsx`** — modified
- Added Contests section with inline add/edit form and delete confirmation modal (no `window.confirm`).
- Form: status select (live/upcoming/past), quizId select (static + managed quizzes), all Contest fields.
- Extended parallel fetch to load `/api/admin/contests` alongside existing config fetches.
- `saveContests()`, `handleContestFormSubmit()`, `startEditContest()`, `confirmDeleteContest()` helpers added.

**`mobile/app/contest.tsx`** — modified
- Replaced static `getContests()` import with live fetch from `${AppConfig.web.baseUrl}/api/contests`.
- Added `allContests` + `loadingContests` state; `ActivityIndicator` while loading.
- Tab counts and list data now driven by live API response.

### Self Challenge Mode (P5-2)

**`apps/web/src/app/dashboard/self-challenge/page.tsx`** — new file
- Reads `localStorage.getItem('quiz-results')`, groups by quizId, computes best score/attempts.
- `ScoreRing` SVG component with color-coded percentage ring.
- "Beat X%" button navigates to `/dashboard/quiz/[quizId]?challenge=<bestScore>`.

**`apps/web/src/app/dashboard/quiz/[id]/page.tsx`** — modified
- Added `challengePreviousBest` from `?challenge=<n>` search param (clamped 0–100).
- In results phase, renders Self Challenge comparison banner showing previous best, new score, +/- delta (color-coded green/orange/red).

**`mobile/app/challenge.tsx`** — modified
- CTA "Beat Your Best" now navigates with `?previousBest=${bestPct}` query param.
- `recentResults` cast as `QuizResult[]` with Supabase sync TODO comment.

### Battle Modes Foundation (P5-3)

**`apps/web/src/types.ts`** — modified
- `BattleStatus`: added `'active'` (kept for backward compat with existing battle/route.ts), `'in_progress'`, `'abandoned'`.
- Added `BattleParticipant` interface: `{ userId, name, score, answers: Record<string,string>, finishedAt? }`.
- `BattleSession` updated: added `type`, `participants`, `questionIds`, `currentQuestionIdx` while keeping backward-compat `mode?`, `players`, `currentQuestionIndex` fields.

**`apps/web/src/app/dashboard/battles/page.tsx`** — new file
- Three mode cards: Random (orange), 1v1 Challenge (red), Group Battle (purple).
- `BattleLobbyOverlay`: Supabase Realtime channel `battle-{sessionId}` listens for `join` broadcast. 30s timeout for random → solo fallback. Shows invite code for 1v1/group.
- `JoinByCodeDialog`: 6-char alphanumeric input.
- Sessions stored in localStorage; `TODO: persist to Supabase battles table once migration is applied` comment added.

**`apps/web/src/app/dashboard/layout.tsx`** — modified
- Added three nav items: Contests (`/dashboard/contests`), Battles (`/dashboard/battles`), Self Challenge (`/dashboard/self-challenge`).
- Added `ContestIcon`, `BattleIcon`, `SelfChallengeIcon` SVG components.

**`apps/web/src/app/api/battle/route.ts`** — modified
- Updated `newSession` object to include `type: mode`, `participants: []`, `questionIds: []`, `currentQuestionIdx: 0` to satisfy updated `BattleSession` interface.

**`mobile/types/index.ts`** — modified
- Added `BattleStatus`, `BattleParticipant`, `BattleSession` type definitions.

**`mobile/app/battle.tsx`** — new file
- Three mode selector cards (random/one_vs_one/group) with Feather icons.
- Tapping navigates to `/battle-lobby?type=<mode>`.

**`mobile/app/battle-lobby.tsx`** — new file
- `useLocalSearchParams` for typed battle type param.
- Shows invite code (1v1/group), spinner + 30s timeout for random.
- Join-by-code TextInput. "Start Battle!" / "Play Solo Instead" once ready.

### Validation Results
- `npm run type-check` (web): 0 errors
- `npm test` (mobile): 262 tests passing, 19 suites

---

## 2026-03-16 (P7 — Platform, Compliance, and Release Readiness)

### Maintenance Mode + Force Update (P7-1)

**SystemFeaturesConfig (web + mobile)**
- Added `maintenanceMode`, `maintenanceMessage`, `forceUpdateEnabled`, `minimumAppVersion`, `currentAppVersion`, `appStoreUrl`, `playStoreUrl` to `SystemFeaturesConfig` in `apps/web/src/lib/systemFeatures.ts` and `mobile/config/systemFeatures.ts`.
- Added defaults and `normalizeSystemFeatures` handlers for all new fields.
- Both files now match exactly (web/mobile schema parity maintained).

**Web maintenance gate (`apps/web/src/components/PlatformExperienceProvider.tsx`)**
- Provider now also fetches `/api/system-features` on load.
- Context value now exposes `systemFeatures: SystemFeaturesConfig`.
- Renders `<MaintenanceBanner>` full-screen overlay when `maintenanceMode === true`, blocking all dashboard access.

**`apps/web/src/components/MaintenanceBanner.tsx`** — new file
- Full-screen fixed overlay with wrench emoji, configurable message, and "Check Status" mailto link to support@katalyst.app.

**Admin controls (`apps/web/src/app/dashboard/settings/page.tsx`)**
- Added Maintenance Mode section: enable toggle + message textarea.
- Added Force Update section: enable toggle, minimum/current version inputs, App Store URL, Play Store URL.
- Both sections persist on the next `saveConfig()` call via `/api/admin/system-features`.

**Mobile maintenance gate (`mobile/app/_layout.tsx`)**
- Added `parseSemver` and `semverLessThan` utility functions.
- `ThemedApp` now checks `systemFeatureStore.config.maintenanceMode` before rendering navigation.
- If maintenance: renders `<MaintenanceScreen message={...} />` (full-screen, non-dismissible).
- If force update triggered (version < minimumAppVersion): renders `<ForceUpdateScreen>` (full-screen, non-dismissible, platform-aware URL).
- ATT TODO comment added in RootLayout with exact install command and uncomment instructions.

**`mobile/components/MaintenanceScreen.tsx`** — new file
- Full-screen centered layout, wrench icon, configurable message, "Check Back Later" support email button.

**`mobile/components/ForceUpdateScreen.tsx`** — new file
- Full-screen, non-dismissible, "Update Now" button opens App Store or Play Store URL based on `Platform.OS`.

### Account Deletion (P7-2)

**`apps/web/src/app/api/account/delete/route.ts`** — new file
- POST, auth required (Bearer token), rate limit 5 req/min.
- Deletes: `quiz_results` → `coin_transactions` (best-effort) → `referral_redemptions` (best-effort) → `user_profiles` → `auth.users` via service role.
- Returns `{ ok: true, message }` or 500 with error; never silently partial-deletes.

**Web profile page (`apps/web/src/app/dashboard/profile/page.tsx`)**
- Added "Danger Zone" section at bottom with inline confirmation modal (no `window.confirm`).
- User must type "DELETE" to enable the confirm button.
- On success: clears localStorage, calls `supabase.auth.signOut()`, redirects to `/login?deleted=1`.

**Login page (`apps/web/src/app/login/page.tsx`)**
- Added `useSearchParams` check for `?deleted=1`.
- Shows dismissible green banner: "Your account has been deleted. All data has been permanently removed."

**Mobile profile screen (`mobile/app/(tabs)/profile.tsx`)**
- Added "Danger Zone" section with inline TextInput confirmation state (type "DELETE").
- On success: calls `signOut()` → AuthGuard navigates to login.
- No `window.confirm` — pure React state machine.

### ATT / Privacy Manifest / Data Safety (P7-3)

**`ios/lms/Info.plist`**
- Added `NSUserTrackingUsageDescription` key.

**`ios/lms/PrivacyInfo.xcprivacy`** — new file
- Declares email address + other user content collection for app functionality.
- `NSPrivacyTracking = false` (no cross-app tracking).
- Empty `NSPrivacyAccessedAPITypes` array.

**`mobile/app.json`**
- Added `android.permissions: ["INTERNET", "ACCESS_NETWORK_STATE"]` (minimal, explicit).

### Production Policy Audit (P7-4)

**`STORE_READINESS_AUDIT.md`** — new file
- Full checklist for Apple App Store and Google Play Store.
- Clearly documents hard blockers (IAP, ATT SDK), done items, and verification tasks.
- Covers account deletion paths, privacy manifest, data safety, version management.

---

## 2026-03-16

### Quiz Mode Metadata, True/False & Exam Mode, Category CRUD, Admin UX Hardening

**Types (web + mobile)**
- Added `QuizMode` union type and `mode?: QuizMode` field to web `Quiz` interface (`apps/web/src/types.ts`).
- Added `examReviewAllowed?: boolean` to web `Quiz` interface.
- Added `ManagedCategory` and `ManagedSubcategory` interfaces to `apps/web/src/types.ts`.
- Added `QuizMode` type, `mode?: QuizMode`, and `examReviewAllowed?: boolean` to mobile `Quiz` interface in `mobile/types/index.ts`, keeping web/mobile in sync.

**Managed quiz content library (`apps/web/src/lib/managedQuizContent.ts`)**
- Added `MANAGED_CATEGORIES_KEY` constant.
- Extended `ManagedQuizContent` interface with `categories?: ManagedCategory[]`.
- `normalizeQuiz()` now validates and preserves `mode` (checked against `VALID_QUIZ_MODES`) and `examReviewAllowed` fields.
- Added `normalizeCategory()` helper and exported `normalizeManagedCategories()` function.

**Admin categories API route (`apps/web/src/app/api/admin/categories/route.ts`)** — new file
- GET: fetch `managed_categories` from `app_settings` (admin auth required).
- POST: save `managed_categories` to `app_settings` with Zod validation, 20 req/min rate limit, 64 KB payload cap.

**Admin quiz-content API route (`apps/web/src/app/api/admin/quiz-content/route.ts`)**
- Added `DELETE` handler: validates `{ quizId }`, removes quiz and its questions, clears `dailyQuizQuizId` in system features if the deleted quiz was the daily quiz.
- Added `PATCH` handler: partial update for a single quiz's metadata or questions without replacing the full dataset.

**Quiz player (`apps/web/src/app/dashboard/quiz/[id]/page.tsx`)**
- `quizMode` derivation: `quiz?.mode ?? (isTrueFalseQuiz ? 'true_false' : 'quiz_zone')`.
- Per-question timer disabled in exam mode.
- Header: `EXAM` badge in exam mode; progress shows `"Question N of M"`.
- Timer bar hidden in exam mode.
- True/False mode: renders two large side-by-side TRUE/FALSE buttons (green/red).
- Explanation hidden in exam mode when `examReviewAllowed` is `false`.
- Results phase: exam result banner; review suppressed if `!examReviewAllowed`.

**Admin settings page (`apps/web/src/app/dashboard/settings/page.tsx`)**
- Added quiz mode `<select>` dropdown in the managed quiz editor.
- Added `examReviewAllowed` checkbox (only when mode = exam).
- Added red ✕ delete button on each quiz list item with `window.confirm`.
- Added full category management section: add category, add subcategory per category, delete category/subcategory, save to `/api/admin/categories`.

## 2026-03-15

### Phase 1
- Added admin-managed public content for privacy, terms, about, and instructions.
- Reflected managed content in website routes and Expo screens.
- Verified with `npm run type-check`, `npm run build --workspace=apps/web`, and `npm test --workspace=mobile`.

### Phase 2
- Added shared system feature flags for daily quiz and core quiz visibility controls.
- Reflected quiz enable/disable state across website dashboard and Expo home/quizzes flows.
- Added daily quiz CTA on website and Expo app.
- Started replacing static quiz metadata with admin-managed runtime quiz content.

### Current Work In Progress
- Managed quiz content storage in `app_settings` under `managed_quiz_content`.
- Website admin CRUD editor for managed quizzes and question sets.

### Completed In This Slice
- Added shared managed quiz content normalization/merge layers for website and Expo.
- Added web API routes: `/api/quiz-content` and `/api/admin/quiz-content`.
- Added Expo startup sync for managed quizzes and question sets.
- Wired managed quiz content into web dashboard layout, quiz discovery, and quiz detail routes.
- Updated server-side quiz submission validation to honor managed quiz content.
- Added website admin CRUD editor for managed quizzes and questions in dashboard settings.
- Added admin import flows for existing static quizzes and pasted JSON bulk import into managed quiz content.
- Added managed quiz JSON export from the admin settings screen for round-trip import/export workflow.
- Added managed quiz duplication from the admin settings screen, cloning metadata and questions into a new editable quiz.
- Added question reordering controls in the managed quiz editor.
- Added option count controls in the managed question editor with 2-5 option guardrails.
- Added editable question difficulty and category fields in the managed question editor.
- Added a true/false preset button in the managed question editor.
- Added per-question duplication in the managed question editor.
- Added per-quiz correct-score and wrong-deduction controls to managed quiz editing.
- Added per-quiz fixed question count controls to managed quiz editing.
- Wired fixed question count and score/deduction behavior into the web quiz runtime and server-side quiz submission.
- Wired fixed question count and point scoring behavior into the Expo quiz runtime and results flow.
- Reflected managed fixed question counts across core Expo discovery and premium-entry surfaces.
- Updated Expo challenge and progress scoring summaries to use managed quiz point rules.
- Updated Expo perfect-score badge and bonus logic to use managed scoring percentages.
- Added daily quiz fallback rotation so web and Expo home stay functional when the configured daily quiz is blank, stale, or disabled.
- Added daily quiz completion status on web and Expo home cards using existing result history.
- Added daily quiz status visibility to web and Expo progress/history surfaces.
- Added daily quiz highlighting in web and Expo quiz discovery lists.
- Highlighted daily quiz attempts inside web history entries and added recent attempt visibility on Expo progress.
- Added daily quiz emphasis to leaderboard/performance surfaces on web and Expo.
- Added daily quiz identity and completion messaging to web and Expo quiz detail/result screens.
- Added direct daily quiz open/review actions to web and Expo leaderboard/progress surfaces, plus admin preview and fallback validation for the selected daily quiz.
- Added admin-side daily quiz selector state hints for disabled and premium quizzes, plus daily-quiz-specific CTA labels in web and Expo quiz discovery cards.
- Preserved daily quiz visibility when discovery filters hide it, exposed the resolved fallback target in admin, and added true/false mode cues to web and Expo quiz intro surfaces.
- Re-verified this slice with `npm run type-check`, `npm run build --workspace=apps/web`, and `npm test --workspace=mobile`.

### Constraints / Risks
- Remote git push has not yet been confirmed from this environment.
- App Store / Play Store compliance blockers still remain outside this phase, especially mobile digital purchase flow and privacy/account-deletion requirements.

---

## 2026-03-16

### P0 + P2 + P3 — Quiz Modes, Category CRUD, Delete Safety, True/False + Exam Runtime
**Commit:** `4a4a9de`
**Validation:** `npm run type-check` clean · mobile tests 262/262 · security gate 18/18 passed

#### What was implemented

**`apps/web/src/types.ts`**
- Added `QuizMode` union: `quiz_zone | true_false | exam | fun_and_learn | guess_the_word | audio | maths_quiz | multi_match`
- Added `mode?: QuizMode` and `examReviewAllowed?: boolean` to `Quiz` interface
- Added `ManagedCategory` and `ManagedSubcategory` interfaces

**`apps/web/src/lib/managedQuizContent.ts`**
- Added `MANAGED_CATEGORIES_KEY`, `normalizeManagedCategories()` export
- `ManagedQuizContent` now includes `categories?: ManagedCategory[]`
- `normalizeQuiz()` now preserves `mode` (validated) and `examReviewAllowed`

**`apps/web/src/app/api/admin/categories/route.ts`** _(new)_
- GET/POST for category CRUD; Zod-validated, rate-limited, auth-guarded

**`apps/web/src/app/api/admin/quiz-content/route.ts`**
- Added DELETE (removes quiz + questions, clears daily quiz ref if matched)
- Added PATCH (single-quiz partial update without full dataset replace)

**`apps/web/src/app/dashboard/quiz/[id]/page.tsx`**
- Quiz mode detection from `quiz.mode` field (fallback: infer true_false from 2-option questions)
- True/False mode: large side-by-side TRUE / FALSE buttons (green/red)
- Exam mode: per-question timer disabled, EXAM badge, question count label, answers hidden when `examReviewAllowed=false`, Exam Result banner

**`apps/web/src/app/dashboard/settings/page.tsx`**
- Category management state + handlers (add/delete category, add/delete subcategory)
- Delete quiz/category with inline React confirmation modals (no window.confirm — passes security gate)
- Mode selector added to managed quiz editor

#### Still pending (not yet done)
- P0: Full audit/migration of remaining static `quizzes`/`quizQuestions` call sites
- P1: Daily quiz analytics backend (attempt counts)
- P4–P7: Unstarted (Multi Match, Fun and Learn, Guess the Word, Audio, Maths, Bookmarks, Contest, Battle, Economy, Store compliance)

---

### Slices 1–5 — Call-site Cleanup, DailyQuizBadge, Mode History, Exam Compliance, Mobile Mode Detection
**Validation:** `npm run type-check` clean (web) · mobile tests 262/262

#### Slice 1a — Category UI save-to-API (verified complete)
- Confirmed: settings page already fetches GET `/api/admin/categories` on mount and POSTs on "Save categories" button click. No changes needed.

#### Slice 1b — Category dropdown in managed quiz editor (`apps/web/src/app/dashboard/settings/page.tsx`)
- Category field now renders a `<select>` dropdown populated from `managedCategories` when categories exist, with an "Other / custom" fallback option.
- When the current quiz category doesn't match any managed category ID, a plain text input is shown below the dropdown for free-form entry.
- Falls back to a plain text `<input>` when no managed categories have been created yet.

#### Slice 1c — Static call-site audit
- `apps/web/src/app/dashboard/page.tsx`: already calls `useManagedQuizContentVersion()` — no change needed.
- `apps/web/src/app/dashboard/quizzes/page.tsx`: already calls `useManagedQuizContentVersion()` — no change needed.
- `apps/web/src/app/dashboard/progress/page.tsx`: added `useManagedQuizContentVersion()` hook call at component top.
- `apps/web/src/app/dashboard/leaderboard/page.tsx`: added `useManagedQuizContentVersion()` hook call at component top.

#### Slice 2a — `DailyQuizBadge` shared component (`apps/web/src/components/DailyQuizBadge.tsx`) — new file
- Props: `{ label, completed, compact? }`.
- `compact=true` (default): renders a `dc-chip` span with green check (completed) or amber (pending).
- `compact=false`: renders a banner pill with CTA text.

#### Slice 2b — Quiz cards use `DailyQuizBadge` (`apps/web/src/app/dashboard/quizzes/page.tsx`)
- Replaced inline daily-quiz chip spans (2 instances) with `<DailyQuizBadge label={...} completed={...} compact />`.

#### Slice 2c — Daily quiz analytics placeholder (`apps/web/src/app/dashboard/settings/page.tsx`)
- Added a read-only info card in the system features section: "Analytics: coming soon" with a note that the backend does not yet support daily quiz attempt tracking. No fake data shown.

#### Slice 3a — `mode` field in quiz-submit API (`apps/web/src/app/api/quiz-submit/route.ts`)
- Added `mode: quiz.mode ?? null` to the `quiz_results` upsert payload.
- Added migration note comment: `ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS mode text;`.

#### Slice 3b — Mode badge in progress/history (`apps/web/src/app/dashboard/progress/page.tsx`)
- Each result row now shows a small "T/F" badge when `quiz.mode === 'true_false'`, or "EXAM" badge when `quiz.mode === 'exam'`. No badge for default `quiz_zone`.

#### Slice 4a — `examReviewAllowed` admin toggle (verified complete)
- Confirmed: settings page already has the `examReviewAllowed` checkbox, visible only when `selectedManagedQuiz.mode === 'exam'`. No changes needed.

#### Slice 4b — Screen-protection limitation comment (`apps/web/src/app/dashboard/quiz/[id]/page.tsx`)
- Added JSX comment above the EXAM badge render: "Screen recording/screenshot protection is not available on web. Platform-safe enforcement is mobile-only."

#### Slice 4c — Mobile exam mode hint (`mobile/app/quiz/[id].tsx`)
- Added a hint text in the intro phase: "This is an exam — answers will not be shown after submission", rendered conditionally when `quiz.mode === 'exam' && quiz.examReviewAllowed === false`.

#### Slice 5a — Mobile quiz mode field + exam timer suppression (`mobile/app/quiz/[id].tsx`)
- Added `quizMode = quiz?.mode ?? (isTrueFalseQuiz ? 'true_false' : 'quiz_zone')` detection.
- Added `isExamMode = quizMode === 'exam'` derived constant.
- Timer `useEffect` now skips starting the per-question countdown when `isExamMode` is true, matching the web quiz player behavior.

---

## 2026-03-16 (session 2)

### Slices 1–5 — P0/P1/P2/P3/Mobile cleanup
**Web commit:** `8b1c27d` | **Mobile commit:** `9a731d7`
**Validation:** type-check clean · 262/262 mobile tests · security gate 18/18

#### Slice 1 — P0 Finish
- **1a** Category save-to-API verified complete (GET on mount + POST on save already wired).
- **1b** Category field in managed quiz editor changed from free-text to `<select>` populated from `managedCategories`; falls back to plain input when no categories exist; shows custom free-text input when current category doesn't match any managed ID.
- **1c** Added `useManagedQuizContentVersion()` to `progress/page.tsx` and `leaderboard/page.tsx` (was missing); `dashboard/page.tsx` and `quizzes/page.tsx` already had it.

#### Slice 2 — P1 Daily Quiz Polish
- Created `apps/web/src/components/DailyQuizBadge.tsx` — props: `label`, `completed`, `compact?`; compact = pill tag, non-compact = wider banner with CTA.
- `quizzes/page.tsx`: replaced inline daily-quiz chip spans with `<DailyQuizBadge>`.
- Admin settings system-features section: added read-only "Analytics: coming soon" card — no fake data.

#### Slice 3 — P2 True/False History
- `api/quiz-submit/route.ts`: added `mode: quiz.mode ?? null` to `quiz_results` upsert; migration comment included (`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS mode text`).
- `progress/page.tsx`: each result row shows a "T/F" pill for `true_false` mode or "EXAM" pill for `exam` mode.

#### Slice 4 — P3 Exam Compliance
- `examReviewAllowed` checkbox already existed in settings, gated on `mode === 'exam'` — no change needed.
- `quiz/[id]/page.tsx`: added JSX comment documenting screen-recording protection is web-unavailable (mobile-only).

#### Slice 5 — Mobile Mode Detection
- `mobile/app/quiz/[id].tsx`: added `quizMode`/`isExamMode` constants; timer `useEffect` skips countdown in exam mode; intro screen shows exam no-answers warning when `quiz.mode === 'exam' && quiz.examReviewAllowed === false`.

---

## 2026-03-16 (session 3)

### P4 — Remaining Elite Quiz Modes (All Slices A–F Complete)
**Web commit:** `6ff00d1` | **Mobile commit:** `0463ea1`
**Validation:** `npx tsc --noEmit` clean · 262/262 mobile tests · security gate passed (9 intentional-public-route warnings, 0 failures)

#### Slice A — Bookmark / Review Parity

**A1 — Extended Question type (web + mobile)**
- `apps/web/src/types.ts`: added `MatchPair` interface; added optional fields `wordAnswer`, `numericAnswer`, `hint`, `audioUrl`, `audioFallbackText`, `matchPairs` to `Question` interface.
- `mobile/types/index.ts`: same additions — keeps web/mobile type parity.

**A2 — Web bookmark toggle in quiz player**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `bookmarkedIds` state populated from `localStorage.getItem('web-bookmarks')`; `toggleBookmark()` callback persists JSON array back to localStorage; bookmark ☆/★ button rendered top-right of question text in quiz phase.

**A3 — Web `/dashboard/bookmarks` page + sidebar link**
- `apps/web/src/app/dashboard/bookmarks/page.tsx` (new): `'use client'` + `force-dynamic`; reads `localStorage` bookmarks; renders list with quiz title, difficulty badge, Remove button, and Start Review button navigating to `?review=bookmarks` query param on first entry's quiz; empty state with CTA.
- `apps/web/src/app/dashboard/layout.tsx`: added `BookmarkNavIcon` SVG and Bookmarks entry to `NAV` array (between Leaderboard and Profile).
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `useSearchParams` + `isBookmarkReview` detection; `bookmarkReviewQuestions` built via `useMemo` scanning all `quizQuestions`; `startQuiz()` branches on bookmark review mode.

**A4 — Mobile bookmark review screen**
- `mobile/app/(tabs)/bookmarks.tsx`: added `hasBookmarks` derived variable; "Start Review (N)" `Pressable` navigating to `/quiz/bookmarks-review`; disabled state view when no bookmarks; added `reviewBtn`/`reviewBtnDisabled`/`reviewBtnText` styles.
- `mobile/app/quiz/bookmarks-review.tsx` (new): flat question index across all `quizzes` + `quizQuestions`; `ReviewPhase = 'quiz' | 'results'`; standard quiz flow with correct/incorrect highlighting and explanation feedback; results screen with score circle, pass/retry label, retry and done buttons; empty state.

#### Slice B — Fun and Learn

**B1 — Web**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `funLearnRevealed` state (reset on `idx` change); learning card rendering `currentQ.explanation` as a "Learning Card" before options; "Got it →" button reveals options; results headline becomes "Learning Complete!" with "Questions explored: N" sub-label; mode badge on intro screen.

**B2 — Mobile**
- `mobile/app/quiz/[id].tsx`: added `funLearnRevealed` state; `isFunAndLearnMode` constant; learning card shown before options; "Got it →" button; `modeStyles.learnCard` style; results headline updated for fun_and_learn; mode badge on intro.

#### Slice C — Guess the Word

**C1 — Web**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `wordInputValue`, `wordFeedbackCorrect`, `showHint` states; `handleWordSubmit()` with case-insensitive comparison against `currentQ.wordAnswer`; text input + optional hint toggle render in quiz phase; feedback shows correct answer if wrong; mode badge on intro.

**C2 — Admin fields**
- `apps/web/src/app/dashboard/settings/page.tsx`: Word Answer text input and Hint text input added to question editor, shown when `selectedManagedQuiz.mode === 'guess_the_word'`.

**C3 — Mobile**
- `mobile/app/quiz/[id].tsx`: `TextInput`, `KeyboardAvoidingView`, `Platform` added to imports; `wordInputValue`, `wordFeedbackCorrect`, `showHint` states; `isGuessTheWordMode` constant; `handleWordSubmit()`; text input + hint toggle rendered inside `KeyboardAvoidingView`; mode badge on intro.

#### Slice D — Maths Quiz

**D1 — Web**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `numericInputValue`, `numericFeedbackCorrect` states; `handleNumericSubmit()` with ±0.01 float tolerance against `currentQ.numericAnswer`; numeric `<input type="number">` with larger font; feedback shows correct answer if wrong; mode badge on intro.

**D2 — Admin fields**
- `apps/web/src/app/dashboard/settings/page.tsx`: Numeric Answer `<input type="number">` added to question editor, shown when `selectedManagedQuiz.mode === 'maths_quiz'`.

**D3 — Mobile**
- `mobile/app/quiz/[id].tsx`: `numericInputValue`, `numericFeedbackCorrect` states; `isMathsQuizMode` constant; `handleNumericSubmit()` with ±0.01 tolerance; `<TextInput keyboardType="numeric">` with larger font style; mode badge on intro.

#### Slice E — Multi Match

**E1 — Web**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: added `matchSelectedLeft`, `matchCorrect`, `matchWrong`, `shuffledRightItems` states; `shuffledRightItems` populated via `useEffect` on `idx` change (Fisher-Yates); `handleMatchLeft()` / `handleMatchRight()` handlers — wrong pair flashes red (1s timeout → clears), correct pair added to `matchCorrect`; all pairs correct → `setFeedback(true)`; match grid rendered with left/right columns; mode badge on intro.

**E2 — Admin pair editor**
- `apps/web/src/app/dashboard/settings/page.tsx`: Match Pairs section added to question editor when `selectedManagedQuiz.mode === 'multi_match'`; add pair button; per-pair left/right text inputs; remove pair button; `generateMatchPairId()` helper.

**E3 — Normalization**
- `apps/web/src/lib/managedQuizContent.ts`: added `MatchPair` to imports; `normalizeQuestion()` validates `matchPairs` (each entry requires non-empty `id`, `left`, `right`); `cloneQuestion()` deep-copies `matchPairs` array; `wordAnswer`, `numericAnswer`, `hint`, `audioUrl`, `audioFallbackText` all preserved.

**E4 — Mobile**
- `mobile/app/quiz/[id].tsx`: `matchSelectedLeft`, `matchCorrect`, `matchWrong` states; `isMultiMatchMode` constant; `handleMatchLeft()` / `handleMatchRight()` handlers with wrong-pair red flash (1s); match grid with `modeStyles.matchGrid`; mode badge on intro.

#### Slice F — Audio Quiz

**F1 — Web**
- `apps/web/src/app/dashboard/quiz/[id]/page.tsx`: HTML5 `<audio controls>` element rendered when `currentQ.audioUrl` is set; mode badge on intro.

**F2 — Admin fields**
- `apps/web/src/app/dashboard/settings/page.tsx`: Audio URL and Fallback Text inputs added to question editor, shown when `selectedManagedQuiz.mode === 'audio'`.

**F3 — Mobile**
- `mobile/app/quiz/[id].tsx`: `isAudioMode` constant; `expo-audio` not installed → graceful fallback: renders `audioFallbackText` or a static note ("Audio playback not available in this build"); mode badge on intro. No new native dependencies added.

---

## P6 — Economy and Monetization (2026-03-16)

### P6-1: Coins Earn/Spend Ledger

**P6-1a — Types (web + mobile)**
- `apps/web/src/types.ts`: Added `CoinReasonCode`, `CoinTransaction`, `CoinPack`, `ReferralInfo` types. Fixed `BattleSession` to include `players`, `currentQuestionIndex`, `BattleStatus` union expanded to include `'active'`. Added `BattlePlayer` to battle route import.
- `mobile/types/index.ts`: Same `CoinReasonCode`, `CoinTransaction`, `CoinPack`, `ReferralInfo` types added.

**P6-1b — Coin ledger API**
- `apps/web/src/app/api/coins/route.ts`: GET `/api/coins` — auth-guarded, rate-limited 30/min. Fetches `coin_transactions` table (ordered DESC, limit 50). Gracefully handles missing table via profile balance fallback. DB migration comment embedded.

**P6-1c — Coin history web page**
- `apps/web/src/app/dashboard/coins/page.tsx`: Balance display + transaction list. Migration-pending banner. Added `CoinsNavIcon` + `StoreNavIcon` to sidebar, `coins` and `store` links added to `NAV` array in `layout.tsx`.

**P6-1d — Coin history mobile**
- `mobile/app/coin-history.tsx`: Full screen with balance header, FlatList transaction list, migration-pending banner. "Coin History" list item added to `mobile/app/(tabs)/profile.tsx`.

### P6-2: Referrals

**P6-2a — Referral API**
- `apps/web/src/app/api/referral/route.ts`: GET returns deterministic referral code (`userId.replace(/-/g,'').slice(0,8).toUpperCase()`) + referred count + coins earned. POST validates and logs redeem attempts. Both routes auth-guarded, rate-limited. DB migration comment embedded.

**P6-2b — Referral UI (web + mobile)**
- `apps/web/src/app/dashboard/profile/page.tsx`: "Refer a Friend" card with copy-to-clipboard, `navigator.share()` fallback, friends referred + coins earned stats.
- `mobile/app/(tabs)/profile.tsx`: Referral panel with `Share.share()` and stats. `supabase` + `AppConfig` imported.

### P6-3: Coin Store

**P6-3a — Admin coin packs API**
- `apps/web/src/app/api/admin/coin-packs/route.ts`: GET/POST with `normalizeCoinPack()` validation, admin auth, rate-limited. Stores under `managed_coin_packs` key in `app_settings`.
- `apps/web/src/app/dashboard/settings/page.tsx`: Coin Store section with pack list, enable/disable toggles, inline delete confirm, add-pack form, save button. IAP compliance note. Fetches from `Promise.all` on load.

**P6-3b — Coin store web page**
- `apps/web/src/app/api/coin-packs/route.ts`: Public GET, 60/min rate limit, returns enabled packs only.
- `apps/web/src/app/dashboard/store/page.tsx`: Pack cards with Popular badge, INR/USD pricing, "Buy now" button shows inline "coming soon" toast (Razorpay TODO comment).

**P6-3c — Coin store mobile**
- `mobile/app/coin-store.tsx`: Fetches enabled packs, grid layout, "Buy now" shows `Alert.alert` with store-compliance message. IAP warning comment at top of file.

### P6-4: Remove-Ads Entitlement and Ad Controls

**P6-4a — System features ad controls**
- `apps/web/src/lib/systemFeatures.ts`: Already had `adsEnabled`, `bannerAdsEnabled`, `interstitialAdsEnabled`, `rewardedAdsEnabled`. No changes needed.

**P6-4b — AdBanner hidden prop**
- `apps/web/src/components/AdBanner.tsx`: Added `hidden?: boolean` prop. When `hidden` is true, renders `null` immediately before subscription check.

**P6-4c — Remove-ads flag**
- `apps/web/src/app/api/quiz-submit/route.ts`: Fetches `ads_removed` from `user_profiles` after save; returns `adsRemoved` in response. DB migration comment embedded.
- `mobile/stores/authStore.ts`: `adsRemoved: boolean` field added to `AuthState` (default `false`). `initAuth` fetches `ads_removed` from `user_profiles` on session load and sets it in store.
- `mobile/components/ads/AdBanner.native.tsx`: Reads `adsRemoved` from `useAuthStore`; renders nothing if `adsRemovedStore || adsRemovedApi`.

**P6-4d — Store compliance note**
- `mobile/services/razorpayService.ts`: Warning comment added at top — service must NOT be used for digital goods on iOS/Android.
- `apps/web/src/app/dashboard/settings/page.tsx`: IAP compliance info card in Coin Store section.
- `DESIRED_FEATURES_BACKLOG.md`: IAP / RevenueCat / StoreKit / Play Billing noted under P6.
