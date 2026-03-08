# LMS Project — Commands & Prompts Reference

> Generated: 2026-02-27
> Project: AWS GenAI Prep (Katalyst) — Monorepo (Mobile + Web + Admin)

---

## Project Structure

```
/Users/schinchli/Documents/Projects/lms/
├── mobile/          ← Expo SDK 54 React Native app (primary active app)
├── apps/web/        ← Next.js 16 student portal (Vuexy child theme)
├── apps/admin/      ← Next.js 16 admin panel (Vuexy child theme)
├── packages/
│   ├── shared-types/    ← TypeScript interfaces for all entities
│   └── theme/           ← Vuexy design tokens
├── backend/lambdas/     ← AWS Lambda stubs (quizSubmit, progressFetch, purchaseValidate)
├── infrastructure/cdk/  ← AWS CDK stacks (empty)
└── turbo.json           ← Turborepo task config
```

---

## 1. Setup Commands

### Initial Install (Root Monorepo)
```bash
# Install all workspace dependencies from monorepo root
npm install
```

### Mobile Only
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npm install
```

### Environment Setup (Mobile)
```bash
# Copy env template (only needed once)
cp /Users/schinchli/Documents/Projects/lms/mobile/.env.example \
   /Users/schinchli/Documents/Projects/lms/mobile/.env
# Then fill in real values in .env (Cognito IDs, AdMob IDs, etc.)
```

---

## 2. Development — Start the App

### Mobile (Expo Dev Server) — PRIMARY
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npx expo start
# OR with npm:
npm start
```

**Options:**
```bash
npx expo start --port 8081        # Specific port (currently running here)
npx expo start --ios              # Open iOS Simulator immediately
npx expo start --android          # Open Android emulator immediately
npx expo start --web              # Open in browser (Metro web)
npx expo start --clear            # Clear Metro bundler cache (use if weird errors)
npx expo start --tunnel           # Use ngrok tunnel (for physical device on different network)
```

**Once server is running:**
- Press `i` → open iOS Simulator
- Press `a` → open Android emulator
- Press `w` → open in browser
- Press `r` → reload app
- Press `m` → toggle menu
- Scan QR code with Expo Go (iOS/Android)

### Web Portal (Next.js 16.1.6 — Student Portal)
```bash
cd /Users/schinchli/Documents/Projects/lms/apps/web
npx next dev --port 3000   # http://localhost:3000

# Run in background (persistent across terminal sessions)
nohup npx next dev --port 3000 > /tmp/web-dev.log 2>&1 &
```

### Elite Quiz PHP Admin Panel
```bash
cd /Users/schinchli/Documents/Projects/elite-quiz-admin/php-admin
php -S localhost:8080 router.php   # http://localhost:8080
# Credentials: admin / admin123

# Run in background
nohup php -S localhost:8080 router.php > /tmp/elite-quiz-admin.log 2>&1 &

# MySQL DB: elite_quiz_238 (root, no password — local Homebrew MySQL)
```

### Admin App (Next.js — scaffold only)
```bash
cd /Users/schinchli/Documents/Projects/lms/apps/admin
npm run dev        # http://localhost:3001 (or next available port)
```

### All Apps (Turborepo parallel)
```bash
cd /Users/schinchli/Documents/Projects/lms
npm run dev        # Starts all workspaces in parallel via Turborepo
```

---

## 3. Testing

### Run All Tests (Mobile)
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npm test                   # Run once (--passWithNoTests)
npm run test:watch         # Watch mode
```

### Run Specific Test File
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npx jest __tests__/themeStore.test.ts
npx jest __tests__/QuizCard.test.tsx
```

### Run Tests with Coverage
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npx jest --coverage
```

---

## 4. Type Checking

### Mobile
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile
npm run typecheck          # tsc --noEmit
```

### All Workspaces (Turborepo)
```bash
cd /Users/schinchli/Documents/Projects/lms
npm run type-check         # Runs type-check across all packages
```

---

## 5. Linting & Code Quality

```bash
# From monorepo root (all packages)
npm run lint

# Mobile only
cd /Users/schinchli/Documents/Projects/lms/mobile
npx eslint .
```

---

## 6. Build Commands

### Mobile — Expo / EAS Builds
```bash
cd /Users/schinchli/Documents/Projects/lms/mobile

# Development build (EAS — installs EAS Dev Client on device)
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview build (internal distribution, sideload APK/IPA)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Production build (App Store / Play Store)
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production    # Both simultaneously
```

### Web/Admin
```bash
cd /Users/schinchli/Documents/Projects/lms/apps/web
npm run build      # Next.js production build
npm start          # Serve production build

cd /Users/schinchli/Documents/Projects/lms/apps/admin
npm run build
npm start
```

### All (Turborepo)
```bash
cd /Users/schinchli/Documents/Projects/lms
npm run build
```

---

## 7. EAS Update (OTA Hotfix — no store review)

```bash
cd /Users/schinchli/Documents/Projects/lms/mobile

# Push OTA update to production channel
eas update --branch production --message "Fix: description of fix"

# Push to preview/staging
eas update --branch preview --message "Test: feature description"

# Emergency rollback
eas update:rollback --branch production

# List updates
eas update:list --branch production
```

---

## 8. EAS Submit (Store Submission)

```bash
cd /Users/schinchli/Documents/Projects/lms/mobile

# Submit to App Store (iOS)
eas submit --platform ios --profile production

# Submit to Google Play (Android)
eas submit --platform android --profile production
```

---

## 9. Expo Doctor & Diagnostics

```bash
cd /Users/schinchli/Documents/Projects/lms/mobile

# Check for SDK compatibility issues (run before every build)
npx expo-doctor

# Check which packages have updates
npx expo install --check

# Fix package versions to match SDK expectations
npx expo install --fix

# Generate QR code for sharing dev build URL
python3 scripts/qr.py
```

---

## 10. Cleanup & Cache

```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear all build outputs (Turborepo)
cd /Users/schinchli/Documents/Projects/lms
npm run clean

# Clear npm cache
npm cache clean --force

# Hard reset — delete and reinstall node_modules
rm -rf /Users/schinchli/Documents/Projects/lms/mobile/node_modules
cd /Users/schinchli/Documents/Projects/lms/mobile && npm install
```

---

## 11. iOS Native Build (Xcode)

```bash
cd /Users/schinchli/Documents/Projects/lms/mobile

# Run on iOS simulator (bypasses EAS, local build)
npx expo run:ios

# Run on Android emulator (local build)
npx expo run:android

# Open Xcode project
open ios/Katalyst.xcodeproj
```

---

## 12. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Check status
git status

# Stage and commit
git add mobile/app/... mobile/components/...
git commit -m "feat: your feature description"

# Push and open PR (develop branch for staging)
git push origin feature/your-feature-name

# Tag a production release
git tag v1.0.0 && git push --tags
```

---

## 13. App Status (as of 2026-02-27)

| Component | URL | Status |
|-----------|-----|--------|
| Expo dev server (mobile) | exp://192.168.0.10:8082 | ✅ Running |
| Next.js web portal | http://localhost:3000 | ✅ Running |
| Elite Quiz PHP admin | http://localhost:8080 | ✅ Running (admin / admin123) |
| TypeScript check | — | ✅ Zero errors |
| .env file | — | ✅ Present (placeholder values) |
| node_modules | — | ✅ Installed |
| Jest tests | — | ✅ 218/218 passing |

---

## 14. Feature Status Summary

### ✅ Complete
- Quiz player (MCQ, 30s timer, instant feedback)
- 50/50 and Skip lifelines
- Question bookmarking & reporting
- Flashcard mode (3D flip, Reanimated v4)
- Review mode (post-quiz walkthrough)
- Category filter (12 categories)
- 7 quizzes with 70 questions (Bedrock, RAG, Agents, Prompt Eng, Security, Monitoring, MLOps)
- XP, Coins, Level system (10 levels: Novice → Grandmaster)
- Badge achievements (5 types)
- Daily streak tracking
- Leaderboard (mock data, top 15)
- Daily Quiz auto-selection
- Challenge Arena (vs CPU)
- Contest/Tournament screen
- Progress screen (per-category bars, best score, recent results)
- Bottom tab navigation (NativeTabs)
- Search (full-text across all questions)
- Auth screens (mocked — Cognito pending)
- 6 theme presets (Purple, Teal, Emerald, Amber, Rose, Indigo)
- AdMob banner + interstitial stubs
- Premium gate modal

### 🚧 In Progress / Planned
- 5 quizzes need questions (Guardrails, Multi-LLM Routing, Orchestration, Evaluation, GenAI Mega Quiz)
- AWS Cognito auth integration
- Dark mode unlock
- RevenueCat subscription integration
- AWS Lambda backend (quizSubmit, progressFetch, purchaseValidate)
- DynamoDB for user state
- S3 + CloudFront for content delivery
- AWS CDK infrastructure stacks
- EAS Dev Client build (for real AdMob)

---

## 15. Key File Paths

| Purpose | Path |
|---------|------|
| Mobile app root | `/Users/schinchli/Documents/Projects/lms/mobile/` |
| Expo config | `mobile/app.config.ts` |
| EAS config | `mobile/eas.json` |
| Env template | `mobile/.env.example` |
| Env file | `mobile/.env` |
| Routes | `mobile/app/` |
| Components | `mobile/components/` |
| Zustand stores | `mobile/stores/` |
| Quiz data | `mobile/data/quizzes.ts` |
| Shared types | `packages/shared-types/src/` |
| Theme tokens | `packages/theme/src/tokens.ts` |
| Dev commandments | `mobile/CLAUDE.md` |
| Feature checklist | `mobile/FEATURES.md` |

---

## 16. Environment Variables Reference

```bash
# Required for mobile app (mobile/.env)
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_EAS_PROJECT_ID=<your-eas-project-id>
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_API_URL=https://dev.api.awslearn.app
EXPO_PUBLIC_CLOUDFRONT_URL=https://dev.cdn.awslearn.app
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_ADMOB_IOS_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

---

## 17. Turborepo Tasks

```bash
# From monorepo root
npm run build        # turbo run build (respects ^build dependencies)
npm run dev          # turbo run dev --parallel (all apps simultaneously)
npm run type-check   # turbo run type-check
npm run lint         # turbo run lint
npm run clean        # turbo run clean
```
