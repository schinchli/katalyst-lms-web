# Quick Reference Card for Claude Code
## Essential Commands & Patterns

> **Print this:** Keep handy during development  
> **Updated:** February 27, 2026

---

## 🚀 GETTING STARTED

### 1. Read These First (30 minutes)
```bash
# Priority order
1. CLAUDE_COMMANDMENTS.md (20 commandments)
2. IMPLEMENTATION_GUIDE_DETAILED.md (task breakdown)
3. VUEXY_WIDGET_CATALOG.md (UI components)
```

### 2. Start Implementation
```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/task-1.1-aws-infrastructure

# Work on subtask
# ... code, test, commit ...

# Push after each subtask
git push origin feature/task-1.1-aws-infrastructure
```

---

## 📋 TDD WORKFLOW (MANDATORY)

```bash
# 1. RED - Write failing test
npm test -- --watch

# 2. GREEN - Write minimal code to pass
# ... implement feature ...

# 3. REFACTOR - Improve code quality
# ... clean up, optimize ...

# 4. COMMIT - Save progress
git add .
git commit -m "feat(scope): description"

# 5. PUSH - Backup to remote
git push origin <branch-name>
```

---

## 🧪 TESTING COMMANDS

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.test.ts

# Run with coverage
npm test -- --coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Lint and fix
npm run lint -- --fix

# Full check (before commit)
npm run typecheck && npm run lint && npm test
```

---

## 📦 PROJECT STRUCTURE

```
lms/
├── mobile/                    # Expo SDK 54 app
│   ├── app/                  # Expo Router screens
│   ├── components/           # React Native components
│   ├── stores/               # Zustand stores
│   ├── data/                 # Mock data (remove in Phase 1)
│   └── __tests__/            # Jest tests
├── apps/
│   ├── web/                  # Next.js student portal
│   └── admin/                # Next.js admin panel
├── packages/
│   ├── ui/                   # Shared Vuexy components
│   ├── core/                 # Shared logic, API, types
│   └── config/               # ESLint, TS, Prettier
├── backend/
│   ├── lambdas/              # AWS Lambda functions
│   │   ├── quizSubmit/
│   │   ├── progressFetch/
│   │   └── purchaseValidate/
│   └── events/               # EventBridge processors
│       ├── streakProcessor/
│       ├── badgeProcessor/
│       └── analyticsProcessor/
└── infrastructure/
    └── cdk/                  # AWS CDK stacks
```

---

## 🎨 VUEXY COLOR TOKENS

```typescript
// Always use these (never hardcode hex)
const colors = {
  primary: '#7367F0',
  success: '#28C76F',
  danger: '#EA5455',
  warning: '#FF9F43',
  info: '#00CFE8',
  
  // Light variants (12% opacity)
  lightPrimary: 'rgba(115, 103, 240, 0.12)',
  lightSuccess: 'rgba(40, 199, 111, 0.12)',
  
  // Surface
  surface: '#FFFFFF',
  background: '#F8F7FA',
  text: '#4B465C',
  textSecondary: '#A8AAAE',
};
```

---

## 🔒 SECURITY CHECKLIST

```typescript
// ✅ DO
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token);

import { z } from 'zod';
const schema = z.object({ email: z.string().email() });
const validated = schema.parse(input);

// ❌ DON'T
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('authToken', token); // INSECURE!

const email = req.body.email; // NO VALIDATION!
```

---

## 📱 EXPO SDK 54 RULES

```typescript
// ✅ USE THESE
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';
import { VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

// ❌ NEVER USE THESE (DEPRECATED)
import { FlatList } from 'react-native'; // Use FlashList
import { Image } from 'react-native'; // Use expo-image
import { Animated } from 'react-native'; // Use Reanimated v4
import { Video, Audio } from 'expo-av'; // REMOVED in SDK 55
```

---

## 🎯 COMMON PATTERNS

### 1. Create a New Component

```typescript
// packages/ui/src/Card/StatCard.tsx
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'primary' | 'success' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant = 'primary',
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className={`avatar bg-light-${variant} rounded`}>
            {icon}
          </div>
          <div className="ms-3">
            <h2 className="fw-bolder mb-0">{value}</h2>
            <p className="card-text">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 2. Create a Lambda Function

```typescript
// backend/lambdas/quizSubmit/index.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';

const SubmissionSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string()),
  timeTaken: z.number().positive(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 1. Validate input
    const body = JSON.parse(event.body || '{}');
    const submission = SubmissionSchema.parse(body);
    
    // 2. Get user from JWT
    const userId = event.requestContext.authorizer?.claims.sub;
    
    // 3. Process submission
    const result = await processQuiz(userId, submission);
    
    // 4. Return response
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### 3. Create a Zustand Store

```typescript
// mobile/stores/exampleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExampleState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      reset: () => set({ count: 0 }),
    }),
    {
      name: 'example-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 4. Write a Test

```typescript
// __tests__/exampleStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useExampleStore } from '../stores/exampleStore';

describe('ExampleStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useExampleStore.getState().reset();
  });

  test('increments count', () => {
    const { result } = renderHook(() => useExampleStore());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  test('decrements count', () => {
    const { result } = renderHook(() => useExampleStore());
    
    act(() => {
      result.current.increment();
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(0);
  });
});
```

---

## 🚫 FORBIDDEN PATTERNS

```typescript
// ❌ NEVER DO THIS
const data: any = fetchData(); // NO 'any' type
console.log('Debug:', data); // NO console.log in production
const color = '#7367F0'; // NO hardcoded colors
await AsyncStorage.setItem('token', jwt); // NO sensitive data in AsyncStorage

// ✅ DO THIS INSTEAD
const data: UserData = fetchData();
logger.info('Debug:', data);
const color = colors.primary;
await SecureStore.setItemAsync('token', jwt);
```

---

## 📊 COMMIT MESSAGE FORMAT

```bash
# Format: <type>(<scope>): <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation only
style:    # Code style (formatting, no logic change)
refactor: # Code refactoring
test:     # Adding tests
chore:    # Build process, dependencies

# Examples
git commit -m "feat(auth): add Cognito authentication"
git commit -m "fix(quiz): correct score calculation"
git commit -m "test(stores): add 100% coverage for authStore"
git commit -m "docs(readme): update installation instructions"
```

---

## 🔍 DEBUGGING COMMANDS

```bash
# Mobile
npx expo start --clear
npx expo-doctor
npx react-native log-ios
npx react-native log-android

# Backend
npx cdk synth
npx cdk diff
aws logs tail /aws/lambda/quizSubmit --follow

# Web
npm run dev
npm run build
npm run start
```

---

## 📈 PERFORMANCE TARGETS

```typescript
// Mobile
- App launch: < 2s (cold start)
- Quiz load: < 500ms
- API response: < 300ms (p95)
- Crash-free rate: > 98%

// Web
- Lighthouse: ≥ 90 (all categories)
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1

// Backend
- Lambda cold start: < 1s
- Lambda warm: < 100ms
- DynamoDB read: < 10ms
```

---

## 🎯 PHASE 1 PRIORITIES (CRITICAL)

```bash
# Week 1-2: Foundation
1. ✅ Set up AWS CDK project
2. ✅ Create DynamoDB tables
3. ✅ Create S3 buckets
4. ✅ Configure Cognito
5. ✅ Implement authentication

# Week 3-4: Core Backend
6. ✅ Build quizSubmit Lambda
7. ✅ Build progressFetch Lambda
8. ✅ Integrate mobile with backend
9. ✅ Remove all mock data
10. ✅ 100% test coverage
```

---

## 📞 HELP & RESOURCES

### Documentation
- Full Implementation Plan: `LMS_IMPLEMENTATION_PLAN.md`
- Detailed Tasks: `IMPLEMENTATION_GUIDE_DETAILED.md`
- Coding Standards: `CLAUDE_COMMANDMENTS.md`
- Security Audit: `SECURITY_AUDIT_REPORT.md`
- UI Components: `VUEXY_WIDGET_CATALOG.md`

### External Resources
- Expo Docs: https://docs.expo.dev/
- AWS CDK: https://docs.aws.amazon.com/cdk/
- Vuexy Demo: https://demos.pixinvent.com/vuexy-html-admin-template/
- TanStack Query: https://tanstack.com/query/latest

### Community
- Expo Discord: https://chat.expo.dev/
- Stack Overflow: Tag with `expo`, `react-native`, `aws-cdk`

---

## ✅ BEFORE EVERY COMMIT

```bash
# Run this checklist
[ ] npm run typecheck  # No TypeScript errors
[ ] npm run lint       # No ESLint warnings
[ ] npm test           # All tests pass
[ ] git status         # Review changes
[ ] git diff           # Check diff
[ ] git add .          # Stage changes
[ ] git commit -m "feat(scope): description"
[ ] git push origin <branch>
```

---

## 🎉 DEFINITION OF DONE

A task is DONE when:
- [ ] Code written and tested
- [ ] All tests passing (100% coverage for new code)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes (zero warnings)
- [ ] Code reviewed (if team)
- [ ] Committed with proper message
- [ ] Pushed to remote branch
- [ ] Documentation updated (if needed)

---

**Keep this handy!** Print or bookmark for quick reference during development.

**Last Updated:** February 27, 2026  
**Version:** 1.0
