# Play Store Submission Checklist — Katalyst LMS

## Repo Checks
- [x] `mobile/app.json` has Android package name
- [x] `mobile/eas.json` production build type is `app-bundle`
- [x] `mobile/eas.json` production profile has `autoIncrement: true`
- [x] Android permissions are minimal in `mobile/app.json`
- [x] Play credentials path is standardized to `mobile/credentials/google-play-service-account.json`
- [x] Play credentials path is gitignored
- [x] Store listing docs exist
- [x] Screenshot plan exists
- [x] Security audit exists

## Required Local Steps Before Submission
- [ ] Run `eas init` in `mobile/`
- [ ] Fill `expo.extra.eas.projectId` in `mobile/app.json`
- [ ] Add Play service account JSON at `mobile/credentials/google-play-service-account.json`
- [ ] Run `npm run doctor --workspace=mobile` on a machine with npm registry access
- [ ] Run `npm run type-check`
- [ ] Run `npm run build --workspace=apps/web`
- [ ] Run `npm test --workspace=mobile`
- [ ] Run `cd mobile && eas build --platform android --profile production`
- [ ] Install and test the release build on a physical Android device

## Required Play Console Steps
- [ ] Create app in Play Console
- [ ] Upload internal testing AAB
- [ ] Complete App content section
- [ ] Complete Data safety section
- [ ] Complete Content rating questionnaire
- [ ] Upload app icon
- [ ] Upload feature graphic
- [ ] Upload screenshots based on `SCREENSHOT_CAPTURE_PLAN.md`
- [ ] Paste listing text from `STORE_LISTING_CONTENT.md`
- [ ] Add privacy policy URL

## Go / No-Go
- Go only if all local steps pass and no blocker remains in `PLAYSTORE_LAUNCH_READINESS.md`
