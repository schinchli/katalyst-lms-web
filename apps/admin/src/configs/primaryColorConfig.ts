/**
 * Vuexy Admin Panel — Primary Color Config (Child Theme Override)
 *
 * Defines the 5 selectable primary colors for the admin theme customizer.
 * The first entry is the default (active) color.
 *
 * All values use Vuexy's exact color system format.
 * Vuexy purple (#7367F0) is kept as default to match the LMS brand.
 */

export type PrimaryColorConfig = {
  name:  string
  light: string
  main:  string
  dark:  string
}

const primaryColorConfig: PrimaryColorConfig[] = [
  // Default — Vuexy purple (matches @lms/theme token: app-primary)
  { name: 'primary-1', light: '#8F85F3', main: '#7367F0', dark: '#675DD8' },

  // AWS orange — matches app-aws token
  { name: 'primary-2', light: '#FFB84D', main: '#FF9900', dark: '#E68900' },

  // Blue (informational tone)
  { name: 'primary-3', light: '#29CCE5', main: '#00BAD1', dark: '#009EAF' },

  // Green (success tone)
  { name: 'primary-4', light: '#48D68B', main: '#28C76F', dark: '#1FAF5B' },

  // Rose
  { name: 'primary-5', light: '#FF7880', main: '#FF4C51', dark: '#E63339' },
]

export default primaryColorConfig
