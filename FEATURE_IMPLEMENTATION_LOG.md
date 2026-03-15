# Feature Implementation Log

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
- Re-verified this slice with `npm run type-check`, `npm run build --workspace=apps/web`, and `npm test --workspace=mobile`.

### Constraints / Risks
- Remote git push has not yet been confirmed from this environment.
- App Store / Play Store compliance blockers still remain outside this phase, especially mobile digital purchase flow and privacy/account-deletion requirements.
