# LMS vs Elite Quiz Audit

Date: 2026-03-15

## Verification status

- `npm run type-check`: passing
- `npm test --workspace=mobile`: passing
- `npm run build --workspace=apps/web`: passing

These checks confirm the repository is in a healthier state than it was at the start of the audit. They do not prove full product parity, production readiness, or store approval.

## What was fixed during this audit

- Restored mobile challenge coverage for all currently free quizzes in [mobile/data/challenges.ts](/Users/schinchli/Documents/Projects/lms/mobile/data/challenges.ts).
- Hardened mobile font scaling against unhydrated or unexpected theme state in [mobile/hooks/useFontScale.ts](/Users/schinchli/Documents/Projects/lms/mobile/hooks/useFontScale.ts).
- Aligned flashcard hint rendering with the tested UX in [mobile/components/quiz/FlashCard.tsx](/Users/schinchli/Documents/Projects/lms/mobile/components/quiz/FlashCard.tsx).
- Updated mobile Jest theme-store mocks to reflect the current theme model in [mobile/jest.setup.ts](/Users/schinchli/Documents/Projects/lms/mobile/jest.setup.ts).
- Prevented import-time payment route crashes by lazy-initializing Stripe and Supabase admin clients in:
  - [apps/web/src/lib/stripe.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/lib/stripe.ts)
  - [apps/web/src/app/api/payment/create-order/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/payment/create-order/route.ts)
  - [apps/web/src/app/api/payment/stripe/create-session/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/payment/stripe/create-session/route.ts)
  - [apps/web/src/app/api/payment/verify/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/payment/verify/route.ts)
  - [apps/web/src/app/api/payment/stripe/verify/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/payment/stripe/verify/route.ts)
  - [apps/web/src/app/api/payment/stripe/webhook/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/payment/stripe/webhook/route.ts)
- Added a minimal admin TypeScript input so workspace checks stop failing for an empty config shell:
  - [apps/admin/tsconfig.json](/Users/schinchli/Documents/Projects/lms/apps/admin/tsconfig.json)
  - [apps/admin/placeholder.ts](/Users/schinchli/Documents/Projects/lms/apps/admin/placeholder.ts)

## Major audit findings

### 1. Elite Quiz feature parity is not present

Elite Quiz documents support for audio quiz, exam mode, fun-and-learn, guess-the-word, maths quiz, multi-match, group battle, one-vs-one battle, random battle, self challenge, and true/false variants. That scope is described in [overview.md](/Users/schinchli/Documents/Projects/Elite quiz v.2.3.8/elite_quiz_doc-2.3.7/docs/features/overview.md) and is not matched by the LMS route surface.

Current LMS mobile routes are limited to quiz, flashcards, challenge, contest, leaderboard, bookmarks, progress, learn, profile, and auth screens in [mobile/app](/Users/schinchli/Documents/Projects/lms/mobile/app). Current LMS web routes are limited to dashboard, quizzes, quiz detail/player, progress, leaderboard, learn, profile, admin, and settings in [apps/web/src/app](/Users/schinchli/Documents/Projects/lms/apps/web/src/app).

There is no implemented LMS equivalent for:

- Audio quiz
- Exam-specific flow distinct from standard quiz
- Fun-and-learn
- Guess-the-word
- Maths quiz
- Multi-match / ordering
- Real-time group battle
- One-vs-one live battle
- Random battle matchmaking
- True/false mode as a distinct product flow

### 2. Quiz content and capability wiring are still statically hardcoded

The current LMS still hardcodes quiz metadata and question banks in:

- [apps/web/src/data/quizzes.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/data/quizzes.ts)
- [apps/web/src/data/clf-c02-questions.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/data/clf-c02-questions.ts)
- [mobile/data/quizzes.ts](/Users/schinchli/Documents/Projects/lms/mobile/data/quizzes.ts)
- [mobile/data/clf-c02-questions.ts](/Users/schinchli/Documents/Projects/lms/mobile/data/clf-c02-questions.ts)

Admin-side CRUD for full quiz/question/category management is not implemented. The current admin settings only manage quiz access overrides and presentation config through:

- [apps/web/src/app/dashboard/settings/page.tsx](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/dashboard/settings/page.tsx)
- [apps/web/src/app/api/admin/quiz-catalog/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/admin/quiz-catalog/route.ts)
- [apps/web/src/app/api/admin/mobile-config/route.ts](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/api/admin/mobile-config/route.ts)

The repo itself also acknowledges missing quiz CRUD in [FEATURES.md](/Users/schinchli/Documents/Projects/lms/FEATURES.md).

### 3. Several mobile capabilities are still mock, fallback, or stubbed

The mobile app still contains non-production behavior that blocks any claim of full functionality:

- Ads are placeholders, not real AdMob integrations, in [mobile/components/ads/AdBanner.native.tsx](/Users/schinchli/Documents/Projects/lms/mobile/components/ads/AdBanner.native.tsx).
- Interstitial ads are still a TODO in [mobile/hooks/useInterstitialAd.native.ts](/Users/schinchli/Documents/Projects/lms/mobile/hooks/useInterstitialAd.native.ts).
- Leaderboard falls back to mock data when the backend is unavailable in [mobile/hooks/useLeaderboard.ts](/Users/schinchli/Documents/Projects/lms/mobile/hooks/useLeaderboard.ts), with mock data defined in [mobile/data/leaderboard.ts](/Users/schinchli/Documents/Projects/lms/mobile/data/leaderboard.ts).
- Auth still supports a demo credential path and guest mode in [mobile/stores/authStore.ts](/Users/schinchli/Documents/Projects/lms/mobile/stores/authStore.ts).
- Mobile app config still defaults `functionsUrl` to a hardcoded Supabase endpoint in [mobile/config/appConfig.ts](/Users/schinchli/Documents/Projects/lms/mobile/config/appConfig.ts).

### 4. Apple / Google digital purchase compliance is not met

The mobile app currently opens Razorpay web checkout for premium subscriptions and course unlocks in [mobile/services/razorpayService.ts](/Users/schinchli/Documents/Projects/lms/mobile/services/razorpayService.ts).

That is a direct problem for App Store review if the app is selling digital learning content/features inside iOS. Apple requires in-app purchase for digital goods/services consumed in the app. This is not a minor polish issue; it is a hard review blocker.

There is also no restore-purchases flow present in the mobile route surface.

### 5. Store compliance and privacy readiness are incomplete

The repo does not currently demonstrate the minimum store-readiness evidence for a data-collecting, monetized mobile app:

- No `NSUserTrackingUsageDescription` is present in [ios/lms/Info.plist](/Users/schinchli/Documents/Projects/lms/ios/lms/Info.plist) even though the app is structured around ads and monetization.
- No in-app privacy policy or terms route is present in `mobile/app`.
- No account-deletion flow is discoverable in `mobile/app` or `mobile/stores`.
- Store metadata and policy URLs are not represented in [mobile/app.json](/Users/schinchli/Documents/Projects/lms/mobile/app.json).

This means the repository does not support a defensible claim that Apple App Store or Google Play policy requirements are fully covered.

### 6. Admin parity with Elite Quiz admin does not exist

Elite Quiz ships a broader admin system with battle/contest management and quiz content management. LMS currently has only a limited admin dashboard/settings experience in:

- [apps/web/src/app/dashboard/admin/page.tsx](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/dashboard/admin/page.tsx)
- [apps/web/src/app/dashboard/settings/page.tsx](/Users/schinchli/Documents/Projects/lms/apps/web/src/app/dashboard/settings/page.tsx)

There is no LMS admin implementation for:

- Question CRUD
- Category/subcategory CRUD
- Contest CRUD
- Battle management
- Daily quiz scheduling
- Quiz type management
- Content upload/import flows

## Conclusion

The LMS repository is now in a better engineering state than it was before this audit because the core verification gates pass. But it is not feature-complete relative to Elite Quiz, it still contains static hardcoded quiz/content paths, several mobile capabilities are still stubbed or mock-backed, and the current mobile payment path is not App Store-compliant for digital goods.

It would be inaccurate to call this app “100% functional”, “fully safe”, or “ready for Apple and Google Play submission” in its current state.

## Recommended next workstreams

1. Replace static quiz/question files with real content CRUD backed by Supabase or the AWS backend.
2. Decide which Elite Quiz modes are truly required, then implement route-by-route parity for the missing ones.
3. Remove demo/guest fallbacks for production builds and eliminate hardcoded environment defaults.
4. Replace mobile Razorpay digital purchases with store-compliant IAP/subscription flows.
5. Add privacy policy, terms, account deletion, restore purchases, ATT/privacy disclosures, and final console metadata before any store submission.
