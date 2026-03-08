/**
 * Vuexy Admin Panel — MUI Component Overrides (Child Theme Layer)
 *
 * Place ALL our custom MUI component overrides here.
 * Vuexy's base overrides live in src/@core/theme/overrides/ — DO NOT edit those.
 *
 * This file is merged with Vuexy's overrides in src/@core/theme/index.ts.
 * Add the merge call in the theme factory:
 *
 *   import customOverrides from '@custom/theme/overrides'
 *   const theme = { ...vuexyTheme, components: { ...vuexyTheme.components, ...customOverrides } }
 *
 * Example override:
 */

import type { Components, Theme } from '@mui/material'

export const customOverrides = (theme: Theme): Components<Theme> => ({
  // ── Example: Quiz result chip custom style ────────────────────────────────
  MuiChip: {
    styleOverrides: {
      root: {
        // Vuexy uses rounded-md (6px) — keep consistent
        borderRadius: 6,
      },
    },
  },

  // ── Custom badge for difficulty levels ────────────────────────────────────
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontSize: '0.7rem',
        height: 18,
        minWidth: 18,
      },
    },
  },

  // Add additional overrides below as needed.
  // The parent (Vuexy) theme handles all base component styling.
})
