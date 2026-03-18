# Google Play Store Launch Readiness — Katalyst LMS
> **Date:** 2026-03-18 | **Current Status:** Not yet ready to submit | **Target Track:** Internal Testing → Closed Alpha → Production

---

## Hard Blockers (must fix before first submission)

| # | Blocker | Action Required |
|---|---------|----------------|
| 1 | EAS `projectId` is empty in `app.json` | Run `eas init` and paste the returned ID |
| 2 | Google Play service account key missing | Create service account in Play Console → download JSON → place at `mobile/credentials/google-play-service-account.json` |
| 3 | First production AAB has not been built and smoke-tested | Run the production build, install on a physical Android device, and verify auth, payments, ads, deletion, and update flows |
| 4 | Android keystore not yet generated | EAS generates on first build; back up immediately to 1Password |
| 5 | Play Console metadata/assets not yet uploaded | Upload screenshots, icon, feature graphic, content rating answers, and Data Safety disclosure |

---

## Pre-Submission Checklist

### Technical

- [x] `android.buildType: "app-bundle"` in `eas.json` production profile
- [x] Target SDK 34+ (React Native 0.81 targets API 35)
- [x] Minimal permissions (2 explicit Android permissions in Expo config; no dangerous permissions requested)
- [x] 16KB page size compliant (RN 0.81 + all native modules)
- [x] No hardcoded secrets in code
- [x] Hermes engine enabled
- [x] Submit path points to `./credentials/google-play-service-account.json`
- [x] Local mobile repo ignores Play credentials and signing artifacts
- [x] `npm run doctor --workspace=mobile` is available as part of release checks
- [ ] `eas init` — fill `app.json extra.eas.projectId`
- [ ] `mobile/credentials/google-play-service-account.json` created from Play Console service account
- [ ] Run: `npm run doctor --workspace=mobile` (current environment is offline, so this must be re-run on a machine with npm registry access)
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

Data is encrypted in transit (HTTPS). User can delete account via Settings → Delete Account.

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
# Expo health check
cd mobile && npm run doctor

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

---

## Repo-Side Ready vs External Blockers

### Ready in repo
- Android package name is set in `mobile/app.json`
- Production AAB build type is set in `mobile/eas.json`
- `autoIncrement` is enabled in `mobile/eas.json`
- Minimal Android permissions are declared in `mobile/app.json`
- Launch/readiness docs exist:
  - `PLAYSTORE_LAUNCH_READINESS.md`
  - `STORE_LISTING_CONTENT.md`
  - `SCREENSHOT_CAPTURE_PLAN.md`
  - `SECURITY_AUDIT_AND_HARDENING.md`

### Still blocked outside repo
- EAS project must be initialized so `app.json` gets a real `extra.eas.projectId`
- Play Console service account JSON must be created and added locally
- First production AAB must be built and tested on a real Android device
- Play Console listing assets and disclosures must be uploaded
