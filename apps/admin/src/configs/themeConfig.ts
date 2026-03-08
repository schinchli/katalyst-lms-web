/**
 * Vuexy Admin Panel — Theme Configuration (Child Theme Override)
 *
 * This file OVERRIDES values from Vuexy's default themeConfig.
 * It is the ONLY file in src/ that modifies Vuexy defaults.
 *
 * Parent:  vuexy-admin-v10.11.1/nextjs-version/.../src/configs/themeConfig.ts
 * Child:   This file — our overrides applied on top
 *
 * When Vuexy updates themeConfig shape: update ONLY the structure here,
 * not the values (our values stay as-is).
 */

import type { Mode, Skin, Layout } from '@core/types'

interface Config {
  templateName: string
  mode:         Mode
  skin:         Skin
  semiDark:     boolean
  layout:       Layout
  layoutPadding: number
  navbar: {
    type:         string
    contentWidth: string
    floating:     boolean
    detached:     boolean
    blur:         boolean
  }
  contentWidth: string
  footer: {
    type:         string
    contentWidth: string
    detached:     boolean
  }
  disableRipple:  boolean
  toastPosition:  string
}

const themeConfig: Config = {
  // ── Our custom template name ──────────────────────────────────────────────
  templateName: 'AWS GenAI Prep — Admin',

  // ── Mode: respect user preference, default to system ─────────────────────
  mode: 'system',       // 'system' | 'light' | 'dark'

  // ── Skin: default (no border) ─────────────────────────────────────────────
  skin: 'default',      // 'default' | 'bordered'

  // ── Semi-dark navbar with light content ───────────────────────────────────
  semiDark: false,

  // ── Layout: vertical sidebar ──────────────────────────────────────────────
  layout: 'vertical',   // 'vertical' | 'collapsed' | 'horizontal'

  layoutPadding: 24,

  navbar: {
    type:         'fixed',
    contentWidth: 'compact',
    floating:     true,
    detached:     true,
    blur:         true,
  },

  contentWidth: 'compact',

  footer: {
    type:         'static',
    contentWidth: 'compact',
    detached:     true,
  },

  disableRipple:  false,
  toastPosition:  'top-right',
}

export default themeConfig
