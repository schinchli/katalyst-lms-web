/**
 * @lms/theme — NativeWind / Tailwind CSS config
 *
 * Import into any app's tailwind.config.js:
 *   const { vuexyColors, vuexyExtend } = require('@lms/theme/tailwind');
 *
 * All color tokens derive from Vuexy v10.11.1 design system.
 * Naming convention:
 *   app-{semantic}-{modifier?}
 *   app-bg            → background (light)
 *   app-bg-dark       → background (dark) — used with dark: prefix
 */

// ─── Semantic color tokens ────────────────────────────────────────────────────
const vuexyColors = {
  // Primary (Vuexy purple — same in light + dark)
  'app-primary': '#7367F0',

  // Backgrounds
  'app-bg':           '#F8F7FA',  // light
  'app-bg-dark':      '#25293C',  // dark

  // Surface (card backgrounds)
  'app-surface':      '#FFFFFF',  // light
  'app-surface-dark': '#2F3349',  // dark

  // Borders / dividers
  'app-border':       '#DBDADE',  // light
  'app-border-dark':  '#4B4F66',  // dark

  // Text — primary
  'app-text':         '#23212A',  // light
  'app-text-dark':    '#E3E7FA',  // dark

  // Text — secondary / muted
  'app-muted':        '#6A6B76',  // light
  'app-muted-dark':   '#9EA1BA',  // dark

  // Primary light (tinted backgrounds for icons, selected states)
  'app-primary-faint':      '#EBE9FD',  // light
  'app-primary-faint-dark': '#43406B',  // dark

  // Status (same hex in both modes)
  'app-success':      '#28C76F',
  'app-success-tint': '#D1F7E2',  // 10% success on white bg
  'app-warning':      '#FF9F43',
  'app-warning-tint': '#FEF3C7',
  'app-error':        '#FF4C51',
  'app-error-tint':   '#FFE5E6',  // 10% error on white bg
  'app-info':         '#00BAD1',

  // Brand
  'app-aws':          '#FF9900',

  // Tab bar icons
  'app-tab-inactive': '#9EA1BA',
};

// ─── Full extend block ─────────────────────────────────────────────────────────
const vuexyExtend = {
  colors: vuexyColors,
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['SpaceMono', 'Courier New', 'monospace'],
  },
  borderRadius: {
    // Vuexy uses 6px as base border-radius
    DEFAULT: '6px',
    sm:   '6px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    '2xl': '20px',
    '3xl': '24px',
  },
};

module.exports = { vuexyColors, vuexyExtend };
