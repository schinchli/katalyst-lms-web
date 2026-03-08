/**
 * Vuexy Web (Student Portal) — Theme Config (Child Theme Override)
 * Same structure as admin but configured for student-facing UX.
 */

const themeConfig = {
  templateName:  'Katalyst',
  mode:          'system' as const,
  skin:          'default' as const,
  semiDark:      false,
  layout:        'vertical' as const,
  layoutPadding: 24,
  navbar: {
    type:         'fixed',
    contentWidth: 'wide',    // full-width for student portal
    floating:     false,
    detached:     false,
    blur:         true,
  },
  contentWidth: 'wide',
  footer: {
    type:         'static',
    contentWidth: 'wide',
    detached:     false,
  },
  disableRipple: false,
  toastPosition: 'top-right',
}

export default themeConfig
