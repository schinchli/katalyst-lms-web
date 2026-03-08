# Vuexy Child Theme Guide

## The Rule (memorize this)

```
src/@core/           → NEVER TOUCH (Vuexy core)
src/@layouts/        → NEVER TOUCH (Vuexy layouts)
src/components/      → NEVER TOUCH (Vuexy base components)

src/@custom/         → ALL OUR CODE LIVES HERE
src/configs/         → OUR OVERRIDES ONLY (2 files)
src/app/             → OUR PAGES (App Router)
```

## Adding a New Page

```
# Create our page — uses Vuexy layout automatically
apps/admin/src/app/[locale]/lms/categories/page.tsx

# Import Vuexy components (read-only usage)
import { Card, CardContent } from '@mui/material'

# Import our custom components
import { QuizTable } from '@custom/components/QuizTable'
```

## Adding a Custom Component

```
# Always in @custom/
apps/admin/src/@custom/components/QuizTable.tsx
apps/admin/src/@custom/components/LeaderboardChart.tsx

# These build ON TOP of Vuexy components
import { DataGrid } from '@mui/x-data-grid'  # Vuexy compatible
```

## Overriding a MUI Component Style

```typescript
// src/@custom/theme/overrides.ts  — DO NOT edit src/@core/theme/overrides/

export const customOverrides = (theme: Theme) => ({
  MuiTableCell: {
    styleOverrides: {
      root: {
        // Our custom table cell styling
        padding: '12px 16px',
      },
    },
  },
})
```

Then in your theme setup (called ONCE, in src/@custom/theme/index.ts):
```typescript
import { customOverrides } from './overrides'
// Merge with Vuexy's base theme
```

## Changing Primary Color

Edit `src/configs/primaryColorConfig.ts` — change the `main` value of the first entry:
```typescript
{ name: 'primary-1', light: '#8F85F3', main: '#7367F0', dark: '#675DD8' }
//                                              ↑ change this
```

## Changing Layout Defaults

Edit `src/configs/themeConfig.ts`:
```typescript
layout: 'horizontal',  // change from 'vertical'
semiDark: true,        // dark sidebar, light content
```

## Updating Vuexy (When New Version Ships)

```bash
# 1. Download new Vuexy version alongside the repo
# 2. Run sync script
cd apps/admin
npm run sync-vuexy

# 3. Check for breaking changes in @core API
git diff src/@core

# 4. Fix any broken imports in src/@custom/ (rare)
# 5. Run dev server and verify
npm run dev
```

## Mobile: Using Vuexy Colors in React Native

```typescript
// ✅ Use NativeWind classes (preferred)
<View className="bg-app-primary rounded-xl p-4" />

// ✅ Use Colors.ts for icon/non-NativeWind props
import { useThemeColors } from '@/hooks/useThemeColor'
const colors = useThemeColors()
<Feather name="star" color={colors.primary} />

// ❌ Never hardcode hex values
<View style={{ backgroundColor: '#7367F0' }} />

// ❌ Never use old Colors values (they're now Vuexy-aligned)
// ❌ Never add new inline style objects
```

## Token Update Checklist (when Vuexy changes a color)

1. Update `packages/theme/src/tokens.ts` ← single source of truth
2. Copy updated hex values to `mobile/tailwind.config.js` (app-* entries)
3. Copy updated hex values to `mobile/constants/Colors.ts`
4. Copy updated hex values to `mobile/global.css` (--vx-* variables)
5. Verify admin/web (they use Vuexy's colorSchemes.ts directly — no change needed)
