# LMS Platform — Architecture

> AWS GenAI Prep · Monorepo · Vuexy v10.11.1 Child Theme · Expo EAS CI/CD

---

## 1. Repository Structure

```
lms/
├── mobile/                   Expo React Native app (iOS + Android)
├── apps/
│   ├── admin/                Vuexy Next.js — Admin control panel
│   └── web/                  Vuexy Next.js — Student web portal
├── packages/
│   ├── theme/                Single source of truth: Vuexy design tokens
│   └── shared-types/         TypeScript interfaces (27 Quiz Online entities)
├── backend/
│   └── lambdas/              AWS Lambda functions (52 API endpoints)
├── infrastructure/
│   └── cdk/                  AWS CDK stacks (DynamoDB, Lambda, API GW, S3, Cognito)
├── docs/                     Architecture docs
└── .github/workflows/        EAS Build + Update CI/CD
```

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Mobile** | Expo SDK 54, React Native 0.81.5 | iOS + Android — `exp://192.168.0.10:8082` |
| **Mobile UI** | NativeWind v4 (Tailwind) | Vuexy tokens via `app-*` colors |
| **Web Portal** | Next.js 16.1.6 (Turbopack) | Custom Vuexy-styled — `http://localhost:3000` |
| **PHP Admin Panel** | CodeIgniter 3 + MySQL | Elite Quiz v2.3.8 — `http://localhost:8080` |
| **Admin Panel (planned)** | Vuexy Next.js 16 + MUI 7 + TailwindCSS 4 | Child theme scaffold ready |
| **State (mobile)** | Zustand v5 | auth, quiz, progress, bookmark, theme stores |
| **State (web)** | localStorage | quiz-results, profile-name, profile-email |
| **API** | AWS API Gateway REST + Lambda | TypeScript (planned) |
| **Database** | DynamoDB (multi-table) | Planned — see DATABASE-SCHEMA.md |
| **Content** | S3 + CloudFront | Quiz JSON, Learning PDFs (planned) |
| **Auth** | AWS Cognito | Planned — currently mocked |
| **CI/CD** | EAS Build + EAS Update | GitHub Actions |
| **Ads** | Google AdMob | react-native-google-mobile-ads v14 (stub) |
| **Monorepo** | npm workspaces + Turborepo | shared packages |

---

## 3. Vuexy Parent-Child Theme Architecture

### The Problem
Vuexy ships updates. We need to pick up bug fixes and component improvements without
overwriting our customizations.

### The Solution: Strict File Ownership

```
src/@core/           ← VUEXY OWNED (never edit)
src/@layouts/        ← VUEXY OWNED (never edit)
src/components/      ← VUEXY OWNED (never edit)

src/@custom/         ← OUR CODE (all customizations here)
src/configs/         ← OUR OVERRIDES (themeConfig.ts, primaryColorConfig.ts)
src/app/             ← OUR PAGES (Next.js App Router routes)
src/views/           ← OUR VIEW COMPONENTS
src/hooks/           ← OUR HOOKS
src/lib/             ← OUR UTILITIES
```

### Update Workflow
```bash
# 1. Place new Vuexy release alongside repo:
#    ../vuexy-admin-v10.12.0/

# 2. Run sync script:
cd apps/admin && npm run sync-vuexy

# 3. Review the diff (only @core / @layouts / components change):
git diff src/@core src/@layouts src/components

# 4. Update our overrides if Vuexy changed APIs:
#    Edit src/@custom/theme/overrides.ts if needed

# 5. Ship:
npm run dev  # verify
git commit -m "chore: sync Vuexy v10.12.0"
```

### Mobile: Vuexy Token Bridge
Vuexy has no React Native variant. We bridge via:
1. **`packages/theme/src/tokens.ts`** — Vuexy hex values as TypeScript constants
2. **`mobile/tailwind.config.js`** — `app-*` semantic color tokens for NativeWind
3. **`mobile/global.css`** — `--vx-*` CSS variables for dynamic color access

When Vuexy changes a color: update `packages/theme/src/tokens.ts` → copy values to
`mobile/tailwind.config.js` and `mobile/constants/Colors.ts`.

---

## 4. CSS Strategy — One Design System Across All Platforms

### Web (admin + web portal)
- **All styles from Vuexy** — MUI 7 component system + TailwindCSS 4 utilities
- Zero custom CSS files. Overrides only via:
  - `src/configs/themeConfig.ts` (layout/skin/mode settings)
  - `src/configs/primaryColorConfig.ts` (5 brand colors)
  - `src/@custom/theme/overrides.ts` (MUI component overrides)

### Mobile
- **All styles via NativeWind v4** using Vuexy `app-*` color tokens
- Zero inline style objects except for:
  - Truly dynamic values (e.g. `ProgressBar` fill width as `%`)
  - Props passed to non-NativeWind APIs (icon colors, React Navigation styles)
- Dark mode: `dark:` prefix + system `prefers-color-scheme`
- `useThemeColors()` kept only for non-NativeWind props (icon color, tab bar)

### Design Token Flow
```
packages/theme/src/tokens.ts   ← Vuexy canonical values (single source of truth)
         │
         ├──► mobile/tailwind.config.js     app-* colors for NativeWind
         ├──► mobile/constants/Colors.ts    JS object for icon colors
         ├──► mobile/global.css             CSS variables
         ├──► apps/admin/src/configs/primaryColorConfig.ts
         └──► apps/web/src/configs/primaryColorConfig.ts
```

---

## 5. Feature Parity with Quiz Online V-7.1.6

All 43 screens and 52 API endpoints from Quiz Online V-7.1.6 are mapped.
See `packages/shared-types/` for all entity definitions.

### Quiz Modes
| Mode | Quiz Online | Status |
|------|------------|--------|
| Practice | ✅ | ✅ mobile/app/quiz/[id].tsx |
| Daily Quiz | ✅ | Phase 2 |
| Self-Challenge | ✅ | Phase 2 |
| 1v1 Battle | ✅ | Phase 3 (WebSocket API Gateway) |
| vs-AI/Robot | ✅ | Phase 3 |
| Tournament/Contest | ✅ | Phase 2 |

### Features
| Feature | Status |
|---------|--------|
| Categories + Subcategories | Phase 2 (S3 JSON content) |
| Difficulty Levels (1-3) | Data model ready |
| Learning Zone (video courses) | Phase 2 |
| Bookmarks | Phase 2 |
| Coin/Reward System | Phase 2 |
| Leaderboards (daily/monthly/global) | Phase 2 |
| Question Reporting | Phase 2 |
| Multi-language | Phase 3 |
| Push Notifications | Phase 2 (SNS) |
| Admin Panel | Vuexy Next.js scaffold ready |
| Google Ads | ✅ AdMob integrated |
| Premium Categories | Phase 2 (Cognito JWT claims) |

---

## 6. AWS Infrastructure

```
CloudFront (cdn.awslearn.app)
    ├── S3 (quiz content: /quizzes/, /questions/, /learning/)
    └── API Gateway (api.awslearn.app)
            ├── POST /quiz/submit       → Lambda: quizSubmit
            ├── GET  /progress          → Lambda: progressFetch
            ├── POST /purchase/validate → Lambda: purchaseValidate
            ├── GET  /leaderboard/*     → Lambda: leaderboard
            ├── WS   /battle            → Lambda: battle (WebSocket)
            └── ...52 endpoints total

Cognito User Pool → JWT → API Gateway authorizer

DynamoDB: lms-users, lms-quiz-attempts, lms-user-statistics,
          lms-leaderboard-*, lms-bookmarks, lms-battle-stats,
          lms-contests, lms-contest-leaderboard

EventBridge: S3 PutObject → streakProcessor, badgeProcessor, analyticsProcessor
```

---

## 7. EAS CI/CD

### Channels
| Channel | Branch trigger | Purpose |
|---------|---------------|---------|
| `development` | local | Dev client build with hot reload |
| `preview` | develop | Internal testing (TestFlight/Internal) |
| `production` | main | Store releases + OTA updates |

### OTA vs Native Build Decision
- JS/CSS/content changes → `eas update` (instant, no store review)
- New native permissions / SDK upgrades → `eas build` (store review required)
- GitHub Actions triggers `eas update` automatically on every push to `main`

### Required GitHub Secrets
```
EXPO_TOKEN                    EAS authentication
PROD_API_URL                  Production API Gateway URL
PROD_CLOUDFRONT_URL           Production CloudFront URL
COGNITO_USER_POOL_ID          AWS Cognito user pool ID
COGNITO_CLIENT_ID             AWS Cognito app client ID
```

---

## 8. Security

### Web Portal (Next.js)
HTTP security headers applied via `next.config.ts`:
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — restricts script/style/connect sources to `self`
- `frame-ancestors 'none'` — blocks embedding in iframes

### PHP Admin Panel (CodeIgniter 3)
- CSRF protection: `csrf_protection = TRUE` (built-in CI)
- File uploads: extension allowlist + path traversal regex + CI input sanitization
- All error output: wrapped with `htmlspecialchars(ENT_QUOTES, UTF-8)`
- Input handling: `$this->input->post()` (never raw `$_POST` for DB queries)
- Auth: bcrypt-hashed passwords, session-based login

### Mobile
- No secrets or API keys in source (all via `process.env` / EAS build secrets)
- Auth tokens: `expo-secure-store` (never AsyncStorage)
- All async errors handled (no unhandled promise rejections)

---

## 9. Light / Dark Theme

### Mobile
- Automatic via system `prefers-color-scheme` (NativeWind `dark:` prefix)
- User override: Settings screen → Appearance (Phase 2: store preference in Cognito attributes)

### Web Portal (Next.js)
- CSS variables for both light and dark modes in `globals.css` (`--bg`, `--surface`, `--text`, `--primary`, etc.)
- `primaryText` token: per-accent WCAG AA compliant text colour (light + dark variants)
- User toggle: planned (currently light by default)

### Admin Web (Vuexy — planned)
- Vuexy Settings Context manages `mode: 'system' | 'light' | 'dark'`
- Stored in browser cookie — persists across sessions
- Built-in Vuexy theme customizer panel (top-right gear icon)
- Default: `mode: 'system'` in our `themeConfig.ts`
