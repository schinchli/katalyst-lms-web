# Apple App Store Launch Readiness — Katalyst LMS
> **Date:** 2026-03-18 | **Xcode 26 deadline: April 28, 2026**

---

## Hard Blockers (must fix before first submission)

| # | Blocker | Action Required |
|---|---------|----------------|
| 1 | EAS `projectId` empty in `app.json` | Run `eas init` |
| 2 | `appleId` is `"TODO"` in `eas.json` | Fill with Apple ID email |
| 3 | `ascAppId` is `"TODO"` in `eas.json` | Create app record in App Store Connect → copy numeric ID |
| 4 | `appleTeamId` is `"TODO"` in `eas.json` | Found in Apple Developer → Membership → Team ID |
| 5 | Apple Developer Program enrollment ($99/yr) | Enrol at developer.apple.com |
| 6 | App Store Connect app record not yet created | Create in App Store Connect before first `eas submit` |
| 7 | ATT prompt (`expo-tracking-transparency`) not called | Add `requestTrackingPermissionsAsync()` to `_layout.tsx` on app start |

---

## Xcode 26 Requirement (Hard Deadline: April 28, 2026)

`eas.json` production profile already has:
```json
"ios": {
  "image": "macos-15-xcode-26"
}
```
✅ Deadline met in configuration. Verify by running a preview build before April 28.

---

## Pre-Submission Checklist

### Technical

- [x] `ios.bundleIdentifier` set in `app.json`: `com.katalysthq.app`
- [x] `NSUserTrackingUsageDescription` in `app.json ios.infoPlist`
- [x] Portrait-only orientation
- [x] Splash screen configured
- [x] `eas.json` production `ios.image: "macos-15-xcode-26"` set
- [ ] Apple Developer Program enrolled
- [ ] App Store Connect app record created (bundle ID registered)
- [ ] `appleId`, `ascAppId`, `appleTeamId` filled in `eas.json`
- [ ] `eas init` — fill `app.json extra.eas.projectId`
- [ ] `expo-tracking-transparency`: call `requestTrackingPermissionsAsync()` on launch
- [ ] TestFlight internal build tested on physical iPhone
- [ ] TestFlight internal build tested on oldest supported iOS (iOS 16 min, iOS 18 recommended)
- [ ] Run: `eas build --platform ios --profile production`

### App Store Connect Metadata

- [ ] **App name**: `Katalyst — AWS & AI Prep`
- [ ] **Subtitle** (30 chars): `Cloud certification quizzes`
- [ ] **Description**: See `STORE_LISTING_CONTENT.md`
- [ ] **Keywords** (100 chars): `aws,cloud,certification,quiz,CLF-C02,AI,machine learning,exam prep,flashcards,leaderboard`
- [ ] **Support URL**: `https://lms-amber-two.vercel.app/support`
- [ ] **Privacy policy URL**: `https://lms-amber-two.vercel.app/privacy`
- [ ] **Screenshots**: 6.9" iPhone required (see `SCREENSHOT_CAPTURE_PLAN.md`)
- [ ] **Age rating**: 4+ (Educational, no objectionable content)
- [ ] Export compliance: Uses standard HTTPS encryption → No export issue
- [ ] Test credentials for App Review (provide in notes): guest@awslearn.app / GuestDemo123

### App Review Notes (pre-fill in ASC)

```
Test account credentials:
- Email: guest@awslearn.app (or create a new account in the signup screen)
- To test as guest: tap "Continue as guest" on the login screen

Key flows to review:
1. Sign up → verify email → dashboard
2. Take a free quiz (Home tab → any quiz card)
3. View leaderboard (Growth tab)
4. View profile and streak (Profile tab)

Note: Payment/subscription features require a Razorpay test environment.
The app can be fully evaluated without purchasing.
```

---

## IAP / Guideline 3.1.1 Compliance

**Current approach**: Subscription purchase via web Razorpay (redirects to `https://lms-amber-two.vercel.app`)

- Apple guideline 3.1.1 requires **all digital content purchases within the app** to use Apple IAP
- External payment links for subscriptions will be **rejected** if the purchase button is inside the app
- **Compliant workaround**: Remove the upgrade/subscribe button from the iOS app entirely; users must go to the web to subscribe → app recognises their subscription on next login via Supabase sync
- **Long-term**: Implement StoreKit 2 via `expo-iap` or RevenueCat (P0 post-launch)

---

## Release Ladder

```
TestFlight Internal (≤100 testers, immediate)
    ↓ (2-day soak, zero crashes)
TestFlight External (≤10,000, requires Apple review ~24h)
    ↓ (7-day soak)
App Store (phased rollout 1% → 5% → 10% → 50% → 100%)
```

---

## Commands

```bash
# Build for TestFlight
cd mobile && eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production

# OTA update (JS-only, no App Store review)
eas update --branch production --message "Fix: <description>"
```

---

## Privacy Nutrition Label (required in ASC)

| Data Type | Used | Linked to User | Tracking |
|-----------|------|---------------|---------|
| Email | ✅ | ✅ | No |
| Name | ✅ | ✅ | No |
| User content (quiz answers) | ✅ | ✅ | No |
| Usage data (quiz history) | ✅ | ✅ | No |
| Device ID / Ad ID | ✅ (AdMob) | No | ✅ (requires ATT) |
| Location | ❌ | — | — |
| Health | ❌ | — | — |
| Financial | ✅ (purchase history) | ✅ | No |
