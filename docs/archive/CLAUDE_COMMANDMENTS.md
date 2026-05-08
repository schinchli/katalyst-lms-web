# CLAUDE CODE COMMANDMENTS FOR LMS PLATFORM
## Complete Development Guidelines for Web, iOS & Android

> **Last Updated:** February 27, 2026  
> **Applies To:** All AI-assisted development on this LMS project  
> **Status:** Living document - update after each major change

---

## 🎯 MISSION STATEMENT

Build a production-ready AWS GenAI Learning & Certification Platform with:
- **Mobile-first** design (iOS + Android via Expo SDK 54)
- **Web portal** for desktop learners (Next.js 16 + Vuexy)
- **Admin panel** for content management (Vuexy Next.js)
- **Serverless backend** (AWS Lambda + DynamoDB + S3)
- **Event-driven architecture** (EventBridge for async workflows)
- **Monetization-ready** (AdMob + RevenueCat subscriptions)

---

## 📐 ARCHITECTURE COMMANDMENTS

### 1. Monorepo Structure is Sacred

```
lms/
├── mobile/              ← Expo SDK 54 (React Native 0.81, React 19.1)
├── apps/
│   ├── web/            ← Next.js 16 student portal
│   └── admin/          ← Next.js 16 admin panel
├── packages/
│   ├── ui/             ← Shared Vuexy components
│   ├── core/           ← Shared logic, types, API clients
│   └── config/         ← ESLint, TypeScript, Tailwind configs
├── backend/
│   ├── lambdas/        ← AWS Lambda functions
│   └── events/         ← EventBridge processors
└── infrastructure/
    └── cdk/            ← AWS CDK stacks
```

**RULES:**
- ✅ Apps import from packages, NEVER the reverse
- ✅ All shared logic goes in `packages/core`
- ✅ All UI components go in `packages/ui`
- ✅ Use `turbo run build --filter=...` for affected builds only
- ❌ NEVER create circular dependencies
- ❌ NEVER duplicate code across apps

---

### 2. S3-First, Event-Driven Architecture

**Content Delivery:**
- Quiz JSON files → S3 → CloudFront
- Learning videos/PDFs → S3 → CloudFront signed URLs
- Quiz results → S3 append-only (audit trail)

**Data Flow:**
```
User submits quiz
  ↓
Lambda: quizSubmit → S3 + DynamoDB
  ↓
EventBridge event emitted
  ↓
Async processors: streakProcessor, badgeProcessor, analyticsProcessor
  ↓
DynamoDB updated (badges, leaderboards, stats)
```

**RULES:**
- ✅ Use S3 for all content (quizzes, media, results)
- ✅ Use DynamoDB only for user state and aggregations
- ✅ Use EventBridge for all async workflows
- ✅ Keep Lambda execution < 300ms average
- ❌ NEVER store quiz content in DynamoDB
- ❌ NEVER chain Lambdas synchronously

---

### 3. Vuexy Design System is Law

**Mobile:**
- Use Vuexy color tokens via NativeWind: `app-primary`, `app-surface`, `app-text`
- All components must match Vuexy aesthetic
- Dark mode via `dark:` prefix (NativeWind v4)

**Web (admin + portal):**
- Use Vuexy MUI 7 components exclusively
- All colors from `primaryColorConfig.ts`
- Never edit `src/@core/` or `src/@layouts/` (Vuexy-owned)
- All customizations in `src/@custom/` only

**RULES:**
- ✅ Use Vuexy tokens for all colors, spacing, typography
- ✅ Support light + dark mode everywhere
- ✅ Extend Vuexy components, never rebuild from scratch
- ❌ NEVER hardcode hex colors
- ❌ NEVER introduce third-party UI libraries (shadcn, Ant Design, etc.)

---

### 4. Expo SDK 54 Best Practices

**Mandatory Packages:**
- `expo-router` v6 for file-based routing (NOT React Navigation)
- `react-native-reanimated` v4 for ALL animations (NOT Animated core)
- `@shopify/flash-list` for ALL lists (NOT FlatList)
- `expo-image` for ALL images (NOT Image from react-native)
- `expo-secure-store` for tokens (NOT AsyncStorage)
- `expo-video` + `expo-audio` (NOT expo-av - deprecated)

**DEPRECATED - NEVER USE:**
- ❌ `expo-av` → Use `expo-video` + `expo-audio`
- ❌ `expo-background-fetch` → Use `expo-background-task`
- ❌ `FlatList` → Use `FlashList`
- ❌ `Animated` from react-native → Use `Reanimated` v4
- ❌ Legacy file-system API → Use new object API

**RULES:**
- ✅ New Architecture is MANDATORY (never disable)
- ✅ React Compiler is ON by default (never disable)
- ✅ Use `NativeTabs` for bottom navigation
- ✅ Enable `typedRoutes` in `app.config.ts`
- ✅ Run `npx expo-doctor` before every commit
- ❌ NEVER use Expo Go for team development (use Dev Client)

---

### 5. TypeScript Strict Mode is Non-Negotiable

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**RULES:**
- ✅ Every function has explicit return types
- ✅ Every parameter has explicit types
- ✅ Use `unknown` instead of `any`, then narrow with type guards
- ✅ All async functions handle errors (no unhandled rejections)
- ❌ `any` type is FORBIDDEN (will fail CI)
- ❌ `console.log` is FORBIDDEN in production (use `packages/core/logger`)

---

### 6. Authentication & Security

**Cognito Integration:**
- User Pool with custom attributes: `isPremium`, `subscriptionExpiry`
- JWT tokens stored in `expo-secure-store` (mobile) or httpOnly cookies (web)
- Token refresh handled automatically by Amplify
- MFA optional for admin users

**Security Checklist:**
- [ ] All API calls require valid JWT
- [ ] Rate limiting: 100 req/min per user
- [ ] Certificate pinning for production API calls
- [ ] `expo-app-integrity` for device attestation
- [ ] WAF enabled on API Gateway
- [ ] All secrets in EAS build secrets (never in code)
- [ ] CloudTrail logging enabled
- [ ] IAM policies follow least privilege

**RULES:**
- ✅ Validate all user inputs with Zod schemas
- ✅ Sanitize all outputs (prevent XSS)
- ✅ Use parameterized queries (prevent SQL injection)
- ❌ NEVER store secrets in code or .env files
- ❌ NEVER trust client-side data without server validation

---

### 7. Performance Targets

**Mobile:**
- App launch: < 2 seconds (cold start)
- Quiz load: < 500ms
- API response: < 300ms (p95)
- Crash-free rate: > 98%
- Bundle size: < 50MB (iOS), < 30MB (Android)

**Web:**
- Lighthouse score: ≥ 90 (all categories)
- FCP: < 1.5s on 4G
- LCP: < 2.5s
- CLS: < 0.1
- TTI: < 3.5s

**Backend:**
- Lambda cold start: < 1s
- Lambda warm execution: < 100ms
- DynamoDB read latency: < 10ms
- S3 CloudFront cache hit rate: > 90%

**RULES:**
- ✅ Use dynamic imports for code splitting
- ✅ Implement React Query cache persistence
- ✅ Lazy load images with blurhash placeholders
- ✅ Prefetch next likely screen on idle
- ❌ NEVER load all quizzes at once (use pagination)
- ❌ NEVER make uncached API calls in render loops

---

### 8. Testing Requirements

**Unit Tests:**
- All stores (Zustand): 100% coverage
- All utility functions: 100% coverage
- All API clients: 100% coverage
- Target: 80% overall coverage

**Integration Tests:**
- Quiz submission flow
- Authentication flow
- Progress calculation
- Badge awarding logic

**E2E Tests (Maestro/Detox):**
- Signup → Login → Take Quiz → View Results
- Premium purchase flow
- Offline quiz submission queue

**RULES:**
- ✅ Write tests alongside new code (not after)
- ✅ Run `turbo run test --filter=[affected]` before commit
- ✅ Mock external APIs (Cognito, S3, DynamoDB)
- ❌ NEVER skip tests to "save time"
- ❌ NEVER commit failing tests

---

### 9. Accessibility (WCAG 2.1 AA)

**Requirements:**
- All interactive elements: ≥ 44×44px tap targets
- Color contrast: ≥ 4.5:1 for text, ≥ 3:1 for UI elements
- All images have meaningful `alt` text
- Full keyboard navigation on web
- Screen reader support (VoiceOver, TalkBack)
- Support system font scaling (up to 200%)

**RULES:**
- ✅ Test with VoiceOver (iOS) and TalkBack (Android)
- ✅ Add `accessibilityLabel` to all Pressable components
- ✅ Use semantic HTML on web (button, nav, main, etc.)
- ✅ Provide text alternatives for all visual information
- ❌ NEVER convey information by color alone
- ❌ NEVER claim WCAG compliance without manual testing

---

### 10. Monetization Strategy

**Ad Placements:**
- Banner: Sticky bottom (320×50 mobile, 728×90 web)
- Interstitial: Route transitions (max 1 per 3 minutes)
- Native: Every 5th item in quiz list
- Rewarded: Opt-in to unlock premium content

**Subscription Tiers:**
- Free: 5 quizzes, ads, no offline mode
- Premium ($9.99/month): All quizzes, ad-free, offline mode, priority support

**RULES:**
- ✅ Ad slots designed at layout time (not afterthought)
- ✅ GDPR consent before any ad SDK initialization
- ✅ Minimum 48px spacing between ads and buttons
- ✅ Clear value exchange for rewarded ads
- ❌ NEVER show interstitial mid-quiz
- ❌ NEVER auto-play video ads

---

### 11. Backend Lambda Best Practices

**Structure:**
```typescript
// backend/lambdas/quizSubmit/index.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';

const SubmissionSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string()),
  timeTaken: z.number().positive(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Parse and validate input
    const body = JSON.parse(event.body || '{}');
    const submission = SubmissionSchema.parse(body);
    
    // 2. Get user ID from JWT
    const userId = event.requestContext.authorizer?.claims.sub;
    
    // 3. Process submission
    const result = await processQuizSubmission(userId, submission);
    
    // 4. Write to S3 + DynamoDB
    await Promise.all([
      writeToS3(userId, result),
      writeToDynamoDB(userId, result),
    ]);
    
    // 5. Emit EventBridge event
    await emitEvent('QuizSubmitted', { userId, result });
    
    // 6. Return response
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

**RULES:**
- ✅ Single responsibility per Lambda
- ✅ Validate all inputs with Zod
- ✅ Use environment variables for config
- ✅ Emit EventBridge events for async work
- ✅ Return within 300ms (p95)
- ❌ NEVER call other Lambdas synchronously
- ❌ NEVER store secrets in code

---

### 12. EAS Build & Deployment

**Build Profiles:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "ios": { "image": "macos-15-xcode-26" }
    }
  }
}
```

**Deployment Flow:**
```
feature/* → development build (local testing)
develop → preview build (internal testing)
main → production build (store submission)
```

**RULES:**
- ✅ Use Xcode 26 for iOS builds (April 28, 2026 deadline)
- ✅ Android: always `.aab` for store, `.apk` for sideload
- ✅ Verify 16KB page size compliance (Android)
- ✅ Test on physical devices before submission
- ✅ Staged rollout: 10% → 50% → 100%
- ❌ NEVER submit without TestFlight/Internal Testing first
- ❌ NEVER skip `npx expo-doctor` check

---

### 13. Admin Panel Guidelines

**Content Management:**
- Quiz CRUD: Create, edit, publish, unpublish
- Question editor: WYSIWYG with preview
- Bulk import: CSV/JSON upload
- Media library: Upload images/videos to S3

**User Management:**
- View all users with search/filter
- Display stats (quizzes completed, average score)
- Ban/unban users
- Grant/revoke premium access
- Export user data (GDPR)

**Analytics:**
- Daily active users
- Quiz completion rates
- Revenue metrics
- Top performing quizzes
- Category popularity

**RULES:**
- ✅ Use Vuexy DataGrid for all tables
- ✅ Implement role-based access control (admin-only Cognito group)
- ✅ Add audit logging for all admin actions
- ✅ Validate all inputs server-side
- ❌ NEVER expose admin endpoints without authentication
- ❌ NEVER allow SQL injection in search queries

---

### 14. CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: EAS Build & Deploy
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: turbo run lint typecheck test --filter=[affected]
  
  build-mobile:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/eas-build-action@v1
        with:
          profile: production
          platform: all
  
  deploy-web:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: turbo run build --filter=web
      - uses: amondnet/vercel-action@v25
```

**RULES:**
- ✅ Run lint + typecheck + test on every PR
- ✅ Auto-deploy to staging on merge to develop
- ✅ Require manual approval for production
- ✅ Use Turborepo remote caching
- ❌ NEVER push directly to main
- ❌ NEVER skip CI checks

---

### 15. Monitoring & Observability

**Sentry Configuration:**
```typescript
// mobile/app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Strip PII
    delete event.user?.email;
    return event;
  },
});
```

**CloudWatch Alarms:**
- Lambda error rate > 1%
- API Gateway 5xx rate > 0.5%
- DynamoDB throttled requests > 10
- Lambda duration p95 > 300ms
- Cognito failed login attempts > 100/min

**RULES:**
- ✅ Set up alerts to Slack/PagerDuty
- ✅ Monitor crash-free rate (target: > 98%)
- ✅ Track business metrics (quiz completions, revenue)
- ✅ Enable X-Ray tracing for all Lambdas
- ❌ NEVER ignore production errors
- ❌ NEVER log PII (emails, names, addresses)

---

### 16. App Store Submission Checklist

**iOS (App Store Connect):**
- [ ] Bundle ID matches exactly
- [ ] All `NSXxxUsageDescription` strings are clear
- [ ] Screenshots: 6.9" iPhone (required), 12.9" iPad (if supported)
- [ ] Privacy policy URL live and accessible
- [ ] Export compliance answered
- [ ] TestFlight internal tested by ≥ 2 people
- [ ] Demo account provided in review notes
- [ ] No placeholder content or "coming soon" buttons

**Android (Play Console):**
- [ ] Target SDK = 35 (Android 15)
- [ ] Build type = `app-bundle` (NOT apk)
- [ ] All `.so` libraries 16KB page-size compliant
- [ ] Data Safety section fully completed
- [ ] Content rating questionnaire completed
- [ ] Internal Testing tested by ≥ 2 people
- [ ] Feature graphic (1024×500px) uploaded

**RULES:**
- ✅ Test on physical devices before submission
- ✅ Provide test credentials if login required
- ✅ Start with 10% rollout, monitor for 24h
- ✅ Pause if crash rate > 2% or 1-star spike
- ❌ NEVER submit without internal testing
- ❌ NEVER reuse build numbers

---

### 17. Code Review Standards

**Before Requesting Review:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] PR description explains what and why
- [ ] Screenshots/video for UI changes

**Reviewer Checklist:**
- [ ] Code follows project conventions
- [ ] No security vulnerabilities
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] Tests cover new functionality
- [ ] Documentation updated if needed

**RULES:**
- ✅ All PRs require ≥ 1 approval
- ✅ Address all review comments before merge
- ✅ Keep PRs small (< 500 lines)
- ✅ Squash commits before merge
- ❌ NEVER merge your own PR
- ❌ NEVER approve without testing locally

---

### 18. Documentation Requirements

**Code Documentation:**
- All public functions have JSDoc comments
- Complex algorithms have inline comments
- README in each package explaining purpose
- API endpoints documented with examples

**User Documentation:**
- In-app help screens
- FAQ page on website
- Video tutorials for key features
- Troubleshooting guide

**Developer Documentation:**
- Architecture diagrams (draw.io)
- Database schema (dbdiagram.io)
- API reference (OpenAPI spec)
- Deployment runbook

**RULES:**
- ✅ Update docs in same PR as code changes
- ✅ Keep README files up to date
- ✅ Document all environment variables
- ✅ Maintain CHANGELOG.md
- ❌ NEVER leave TODO comments without tickets
- ❌ NEVER assume code is self-documenting

---

### 19. Error Handling Patterns

**Mobile:**
```typescript
// Good: Specific error handling
try {
  const result = await api.submitQuiz(submission);
  return result;
} catch (error) {
  if (error instanceof NetworkError) {
    // Queue for retry when online
    await offlineQueue.add(submission);
    showToast('Saved offline. Will sync when connected.');
  } else if (error instanceof ValidationError) {
    showToast('Invalid submission. Please check your answers.');
  } else {
    Sentry.captureException(error);
    showToast('Something went wrong. Please try again.');
  }
}
```

**Backend:**
```typescript
// Good: Structured error responses
try {
  const result = await processQuiz(submission);
  return { statusCode: 200, body: JSON.stringify(result) };
} catch (error) {
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
  console.error('Unexpected error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
}
```

**RULES:**
- ✅ Catch errors at appropriate boundaries
- ✅ Provide user-friendly error messages
- ✅ Log errors with context (user ID, request ID)
- ✅ Retry transient failures (network, rate limits)
- ❌ NEVER swallow errors silently
- ❌ NEVER expose stack traces to users

---

### 20. Feature Flags

**Implementation:**
```typescript
// packages/core/flags.ts
export const FLAGS = {
  ENABLE_1V1_BATTLE: process.env.ENABLE_1V1_BATTLE === 'true',
  ENABLE_VIDEO_LEARNING: process.env.ENABLE_VIDEO_LEARNING === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
};

// Usage
if (FLAGS.ENABLE_1V1_BATTLE) {
  return <BattleMode />;
}
```

**RULES:**
- ✅ Gate all unfinished features with flags
- ✅ Use environment-specific flags (dev/staging/prod)
- ✅ Remove flags after feature is stable
- ✅ Document flag purpose and removal date
- ❌ NEVER comment out code (use flags instead)
- ❌ NEVER ship with debug flags enabled

---

## 🚨 CRITICAL DEADLINES

### April 28, 2026: Xcode 26 Requirement
- **Impact:** All iOS submissions MUST use Xcode 26
- **Action:** Update `eas.json` production profile NOW
- **Test:** Run preview build with Xcode 26 immediately

### November 1, 2025: Android 16KB Page Size (ALREADY PASSED)
- **Impact:** All Android submissions MUST be 16KB compliant
- **Status:** SDK 54 + RN 0.81 is compliant
- **Action:** Verify all third-party native libraries

---

## 📞 ESCALATION PATHS

### Build Failures
1. Check `npx expo-doctor` output
2. Review EAS build logs
3. Test locally with `eas build --local`
4. Post in Expo Discord #help

### App Store Rejections
1. Read rejection reason carefully
2. Check App Store Review Guidelines
3. Fix issue and resubmit with explanation
4. If unclear, request clarification from reviewer

### Production Incidents
1. Check Sentry for crash reports
2. Review CloudWatch logs and alarms
3. Roll back via `eas update:rollback` if needed
4. Post-mortem within 24 hours

---

## ✅ DEFINITION OF DONE

A feature is DONE when:
- [ ] Code is merged to main
- [ ] All tests passing (unit + integration + E2E)
- [ ] TypeScript strict mode passes
- [ ] ESLint + Prettier passes
- [ ] Accessibility audit passes
- [ ] Performance targets met
- [ ] Documentation updated
- [ ] Deployed to staging and tested
- [ ] Product owner approved
- [ ] Monitoring/alerts configured

---

## 🎓 LEARNING RESOURCES

- [Expo SDK 54 Docs](https://docs.expo.dev/)
- [React Native 0.81 Docs](https://reactnative.dev/)
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [Vuexy Documentation](https://demos.pixinvent.com/vuexy-nextjs-admin-template/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)

---

**Document Version:** 1.0  
**Effective Date:** February 27, 2026  
**Review Cycle:** Monthly  
**Owner:** Engineering Team

---

## 🔄 CHANGELOG

### v1.0 (2026-02-27)
- Initial commandments document
- Consolidated from CLAUDE.md, ARCHITECTURE.md, STEERING.md
- Added specific task breakdowns
- Added critical deadlines section
