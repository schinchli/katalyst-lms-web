# Katalyst LMS — Feature Manifest

> Cheap-to-read inventory of built user-facing features and where they live.
> Read THIS first (instead of re-auditing the codebase) when scoping LMS work.
> Last verified: 2026-06-30. Source of truth for code = the two knowledge graphs
> (see "Graph" at the bottom) — query them before reading files.

## Web ↔ Mobile parity (current)

| Feature | Web route | Mobile route | Backend / data |
|---|---|---|---|
| Auth (login/signup/verify/reset) | `/login` `/signup` `/verify-email` `/reset-password` | `(auth)/*` | Supabase Auth |
| Dashboard home | `/dashboard` | `(tabs)/index` | quiz-results, system-features |
| Quizzes catalog + player | `/dashboard/quizzes` `/dashboard/quiz/[id]` | `(tabs)/quizzes` `quiz/[id]` | quiz-catalog, quiz-submit |
| Flashcards | `/dashboard/flashcards[/slug]` | `flashcards` | flashcard-progress |
| Learning paths | `/dashboard/learning-paths[/id]` | `learning-path` | local + quiz-results |
| Module notes (+ diagrams) | `/dashboard/learning-paths/notes/[moduleId]` | `module-notes` | served from web /public (Vercel) |
| Leaderboard | `/dashboard/leaderboard` | `leaderboard` | /api/leaderboard |
| Bookmarks | `/dashboard/bookmarks` | `(tabs)/bookmarks` | /api/bookmarks |
| Self-challenge (beat-the-CPU) | `/dashboard/self-challenge` | `challenge` | client-only (data/challenges) |
| **Battles** (random/1v1/group) | `/dashboard/battles` `/dashboard/battle-lobby` | `battle` `battle-lobby` | simulated/local (no realtime backend) |
| Contests | `/dashboard/contests` | `contest` | /api/contests (join coin-spend = NOT built) |
| Coins (balance + history) | `/dashboard/coins` | `coin-history` | /api/coins |
| Exam coach / study planner | `/dashboard/exam-coach` | `exam-coach` | localStorage (lib/examHabit) |
| Quiz reviews (rate + comment) | quiz intro/results | quiz results (`components/QuizReviews`) | /api/quiz-reviews/[id] |
| Ask AI (RAG) | global `components/AskAI` | `components/ui/AskAISheet` | /api/rag/ask |
| Cloud news | dashboard home `components/CloudNews` | `(tabs)/index` widget | /api/cloud-news |
| Learn / articles | `/dashboard/learn[/slug]` | `(tabs)/learn` | Sanity + /api/articles |
| Profile / account delete | `/dashboard/profile` | `(tabs)/profile` | /api/account/delete |
| Admin (quiz/catalog/flags/etc.) | `/dashboard/settings` `/dashboard/admin/*` | `admin-settings` | /api/admin/* (ADMIN_EMAILS) |

## NOT built (payment money-flow only — deferred by decision)

| Gap | Why deferred |
|---|---|
| Coin store / buying coins | needs payment money-flow (create-order/Stripe/verify → grant coins) |
| Mobile in-app payment (IAP) | Apple/Google IAP compliance (mobile CLAUDE.md §13.6) |
| Contest "join" coin-spend deduction | depends on the same coin money-flow backend |
| Real-time multiplayer battles | current battles are simulated; true PvP needs Supabase Realtime + matchmaking + schema |

## Feature flags (admin-controlled, app_settings)
`maintenanceMode` · `adsEnabled` (+ banner/interstitial/rewarded) · `dailyQuizEnabled` (+ quizId/label) · `leaderboardEnabled` · `answerReviewEnabled` · `forceUpdateVersion`.
Premium: per-quiz `isPremium` + `quiz_catalog_overrides` (single source of truth, applied web + mobile).

## Graph (query before reading files — saves tokens)
- Root graph (web/backend/admin): `.code-review-graph/graph.db` — `uvx code-review-graph <cmd>`
- Mobile graph (nested repo): `mobile/.code-review-graph/graph.db` — `uvx code-review-graph build --repo mobile` to refresh
- Auto-update hooks (`.claude/settings.json`) run `uvx code-review-graph update` on every Edit/Write.
- MCP `code-review-graph` is pre-approved (`enabledMcpjsonServers`) — loads when Claude Code is launched **from the LMS dir**.
- Also: Understand-Anything graph helper — `node scripts/graph-query.mjs find|file|deps|layer`.
