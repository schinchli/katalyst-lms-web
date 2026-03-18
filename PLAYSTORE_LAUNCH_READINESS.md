# Google Play Store Launch Readiness — Katalyst LMS
> **Date:** 2026-03-18 | **Target Track:** Internal Testing → Closed Alpha → Production

---

## Hard Blockers (must fix before first submission)

| # | Blocker | Action Required |
|---|---------|----------------|
| 1 | EAS `projectId` is empty in `app.json` | Run `eas init` and paste the returned ID |
| 2 | `google-play-service-account.json` missing | Create service account in Play Console → download JSON → place in `mobile/` (gitignored) |
| 3 | `serviceAccountKeyPath` in `eas.json` is a placeholder | Update to correct path after step 2 |
| 4 | Android keystore not yet generated | EAS generates on first build; back up immediately to 1Password |
| 5 | `versionCode` not managed | Set `autoIncrement: true` in `eas.json` production profile ← **already done** |

---

## Pre-Submission Checklist

### Technical

- [x] `android.buildType: "app-bundle"` in `eas.json` production profile
- [x] Target SDK 34+ (React Native 0.81 targets API 35)
- [x] Minimal permissions (4 only — no dangerous permissions)
- [x] 16KB page size compliant (RN 0.81 + all native modules)
- [x] No hardcoded secrets in code
- [x] Hermes engine enabled
- [ ] `eas init` — fill `app.json extra.eas.projectId`
- [ ] `google-play-service-account.json` placed and path updated in `eas.json`
- [ ] Run: `eas build --platform android --profile production`
- [ ] Test production build on physical Android device (API 35)
- [ ] Test on low-end device (2 GB RAM, older CPU)

### Play Console Metadata

- [ ] **Short description** (80 chars max): `Master AWS & AI certifications with adaptive quizzes, flashcards, and a live leaderboard.`
- [ ] **Full description** (4000 chars max): See `STORE_LISTING_CONTENT.md`
- [ ] **Feature graphic** (1024×500px): Create with Figma / Canva
- [ ] **App icon** (512×512px): Use `assets/icon.png` (already 1024×1024 — export at 512)
- [ ] **Screenshots** (phone, minimum 2): See `SCREENSHOT_CAPTURE_PLAN.md`
- [ ] Content rating questionnaire completed (Educational → no violence/sex/ads to minors)
- [ ] **Data Safety section** filled out (see below)
- [ ] Privacy policy URL live: `https://lms-amber-two.vercel.app/privacy`

### Data Safety Declaration

The following must be declared in Play Console → Data Safety:

| Data Type | Collected? | Shared? | Purpose |
|-----------|-----------|---------|---------|
| Email address | Yes | No | Account creation / auth |
| Name | Yes | No | Profile display |
| User-generated content (quiz answers) | Yes | No | Progress tracking |
| App interactions (quiz history, scores) | Yes | No | Progress/leaderboard |
| Advertising ID | Yes | Third-party (AdMob) | Ad personalisation |
| Approximate location | No | — | — |
| Precise location | No | — | — |
| Financial info | Yes (purchase history) | No | Subscription management |

Data is encrypted in transit (HTTPS). User can delete account via Settings → Delete Account (to be implemented).

---

## Release Ladder

```
Internal Testing (≤100 testers) → first build
    ↓ (2-day soak, zero crashes)
Closed Testing / Alpha (invite list)
    ↓ (7-day soak, crash-free rate ≥ 98%)
Open Testing / Beta (public opt-in)
    ↓ (7-day soak)
Production (10% → 50% → 100% over 7 days)
```

---

## Post-Launch Monitoring

- Android Vitals: crash rate < 1%, ANR rate < 0.47%
- Pause rollout trigger: crash rate > 2% OR ANR rate > 0.47%
- OTA fix via `eas update --branch production` for JS-only regressions
- Emergency rollback: `eas update:rollback --branch production`

---

## Commands

```bash
# Build production AAB
cd mobile && eas build --platform android --profile production

# Submit to Play Store (internal track)
eas submit --platform android --profile production

# OTA update (no store review)
eas update --branch production --message "Fix: <description>"
```

---

## Known Gaps (Post-Launch)

- In-app purchases via Google Play Billing (StoreKit equivalent) — Razorpay is web-only
- For digital subscriptions on Android, Google Play Billing API is required (guideline 9.4)
- Current plan: Android users subscribe via web browser → deeplink back to app
- This is compliant for now but limits conversion rate; native IAP is P0 post-launch
