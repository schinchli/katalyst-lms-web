# Play Store Deployment Handoff — Katalyst LMS

## What is already done
- Release/readiness docs are prepared.
- Store listing text is prepared in `STORE_LISTING_CONTENT.md`.
- Screenshot shot list is prepared in `SCREENSHOT_CAPTURE_PLAN.md`.
- Submission checklist is prepared in `PLAYSTORE_SUBMISSION_CHECKLIST.md`.
- Repo validation is green:
  - `npm run type-check`
  - `npm run build --workspace=apps/web`
  - `npm test --workspace=mobile`
- Android release config is set for AAB production builds in `mobile/eas.json`.

## What still needs your account or Play Console access
1. Activate or complete Google Play Console setup/payment.
2. Create a Google Play service account JSON key.
3. Link the Expo/EAS project so `extra.eas.projectId` is filled.
4. Run the first production Android build.
5. Upload the AAB and listing assets in Play Console.

## Exact command sequence

### 1. Initialize EAS project
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
eas init
```

Expected result:
- Expo writes a real `projectId`
- Update `mobile/app.json` if it is not auto-written

### 2. Add Play service account key
Place the downloaded JSON here:
```bash
/Users/schinchli/Documents/Projects/lms/mobile/credentials/google-play-service-account.json
```

The repo is already configured to expect that path and ignore it in git.

### 3. Optional doctor check
```bash
cd /Users/schinchli/Documents/Projects/lms
npm run doctor --workspace=mobile
```

If this fails only because of offline/npm registry access, rerun on a normal internet-connected machine.

### 4. Build production Android AAB
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
eas build --platform android --profile production
```

### 5. Test the release build
Verify on a real Android device:
- login/signup
- guest flow
- quiz start and completion
- leaderboard
- daily quiz
- privacy/terms/about pages
- account deletion flow
- external web payment/deeplink paths if used

### 6. Submit to internal track
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
eas submit --platform android --profile production
```

## Play Console assets/content to upload
- App name / short description / full description:
  - `STORE_LISTING_CONTENT.md`
- Screenshots and feature graphic:
  - `SCREENSHOT_CAPTURE_PLAN.md`
- Privacy policy URL:
  - `https://lms-amber-two.vercel.app/privacy`

## Go / No-Go
- Go when:
  - `projectId` is filled
  - service account JSON exists
  - production AAB builds successfully
  - release build passes device smoke test
  - Play Console assets and disclosures are uploaded
- No-Go if any of those are still incomplete
