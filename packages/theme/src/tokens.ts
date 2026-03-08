/**
 * @lms/theme — Vuexy Design Tokens
 *
 * Single source of truth. All color/spacing/radius values derive from Vuexy v10.11.1.
 * Updating Vuexy? Only change values here — all apps inherit automatically.
 *
 * Vuexy source of truth:
 *   nextjs-version › typescript-version › src/@core/theme/colorSchemes.ts
 *   html-version › scss/_bootstrap-extended/_variables.scss
 */

// ─── Core Brand ─────────────────────────────────────────────────────────────
export const PRIMARY   = '#7367F0'; // Vuexy purple
export const SECONDARY = '#808390';
export const SUCCESS   = '#28C76F';
export const WARNING   = '#FF9F43';
export const ERROR     = '#FF4C51';
export const INFO      = '#00BAD1';
export const AWS       = '#FF9900'; // AWS orange (non-Vuexy brand)

// ─── Light Theme ────────────────────────────────────────────────────────────
export const light = {
  primary:         PRIMARY,
  secondary:       SECONDARY,
  success:         SUCCESS,
  warning:         WARNING,
  error:           ERROR,
  info:            INFO,
  aws:             AWS,

  background:      '#F8F7FA',   // Vuexy light bg
  surface:         '#FFFFFF',
  surfaceBorder:   '#DBDADE',   // Vuexy table-border

  text:            '#23212A',   // Vuexy heading-color
  textSecondary:   '#6A6B76',   // Vuexy text-muted

  primaryLight:    '#EBE9FD',   // primary at 10% opacity on white
  successTint:     '#D1F7E2',   // success at 10% on white
  warningTint:     '#FEF3C7',
  errorTint:       '#FFE5E6',   // error at 10% on white

  tabIconDefault:  '#9EA1BA',
  tabIconSelected: PRIMARY,
} as const;

// ─── Dark Theme ─────────────────────────────────────────────────────────────
export const dark = {
  primary:         PRIMARY,     // primary stays same in dark
  secondary:       SECONDARY,
  success:         SUCCESS,
  warning:         WARNING,
  error:           ERROR,
  info:            INFO,
  aws:             AWS,

  background:      '#25293C',   // Vuexy dark main bg
  surface:         '#2F3349',   // Vuexy dark card bg
  surfaceBorder:   '#4B4F66',   // Vuexy dark divider

  text:            '#E3E7FA',   // Vuexy dark heading
  textSecondary:   '#9EA1BA',   // Vuexy dark muted

  primaryLight:    '#43406B',   // primary-light in dark context
  successTint:     '#0B3324',
  warningTint:     '#3D2A00',
  errorTint:       '#3D0F12',

  tabIconDefault:  '#6A6B76',
  tabIconSelected: PRIMARY,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const typography = {
  fontSans: ['Inter', 'system-ui', 'sans-serif'],
  fontMono: ['SpaceMono', 'Courier New', 'monospace'],

  // Scale (px, mirrors Tailwind defaults)
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
// Mirrors Tailwind 4px base scale
export const spacing = {
  '0':    0,
  '0.5':  2,
  '1':    4,
  '1.5':  6,
  '2':    8,
  '2.5':  10,
  '3':    12,
  '3.5':  14,
  '4':    16,
  '5':    20,
  '6':    24,
  '7':    28,
  '8':    32,
  '10':   40,
  '12':   48,
  '14':   56,
  '16':   64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const radius = {
  sm:   6,   // rounded-md
  md:   8,   // rounded-lg
  lg:  12,   // rounded-xl
  xl:  16,   // rounded-2xl
  '2xl': 24, // rounded-3xl
  full: 9999,
} as const;

// ─── Combined (backwards compat with Colors.ts) ──────────────────────────────
export const Colors = { light, dark };
export type ThemeColors = typeof light;
export type ColorScheme = 'light' | 'dark';
