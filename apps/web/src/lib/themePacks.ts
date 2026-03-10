export interface ThemeModeTokens {
  primary: string;
  primaryLight: string;
  primaryText: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAccent: string;
}

export interface ThemePack {
  id: string;
  label: string;
  emoji: string;
  light: ThemeModeTokens;
  dark: ThemeModeTokens;
}

export interface AppThemePrefs {
  themeId: string;
  fontFamily: string;
  fontSize: string;
  timezone: string;
}

export const THEME_PACKS: ThemePack[] = [
  {
    id: 'aurora',
    label: 'Neon Aurora',
    emoji: '🌈',
    light: { primary: '#6C5BFF', primaryLight: '#F0EDFF', primaryText: '#4C3BE4', gradientFrom: '#6C5BFF', gradientTo: '#36E5F0', gradientAccent: '#A855F7' },
    dark:  { primary: '#8B7BFF', primaryLight: '#2F2557', primaryText: '#BAAEFF', gradientFrom: '#7C6CFF', gradientTo: '#3DDFF0', gradientAccent: '#C084FC' },
  },
  {
    id: 'ocean',
    label: 'Ocean Glass',
    emoji: '🌊',
    light: { primary: '#0EA5E9', primaryLight: '#E0F7FF', primaryText: '#026AA2', gradientFrom: '#0EA5E9', gradientTo: '#2DD4BF', gradientAccent: '#60A5FA' },
    dark:  { primary: '#38BDF8', primaryLight: '#113042', primaryText: '#7DD3FC', gradientFrom: '#0369A1', gradientTo: '#0F766E', gradientAccent: '#1D4ED8' },
  },
  {
    id: 'forest',
    label: 'Forest Mint',
    emoji: '🌿',
    light: { primary: '#10B981', primaryLight: '#DCFCE7', primaryText: '#047857', gradientFrom: '#10B981', gradientTo: '#84CC16', gradientAccent: '#14B8A6' },
    dark:  { primary: '#34D399', primaryLight: '#153A33', primaryText: '#6EE7B7', gradientFrom: '#047857', gradientTo: '#3F6212', gradientAccent: '#0F766E' },
  },
  {
    id: 'sunset',
    label: 'Sunset Coral',
    emoji: '🌇',
    light: { primary: '#F97316', primaryLight: '#FFEDD5', primaryText: '#C2410C', gradientFrom: '#F97316', gradientTo: '#FB7185', gradientAccent: '#F59E0B' },
    dark:  { primary: '#FB923C', primaryLight: '#3D2819', primaryText: '#FDBA74', gradientFrom: '#C2410C', gradientTo: '#BE185D', gradientAccent: '#D97706' },
  },
  {
    id: 'midnight',
    label: 'Midnight Cyan',
    emoji: '🌌',
    light: { primary: '#1D4ED8', primaryLight: '#DBEAFE', primaryText: '#1E3A8A', gradientFrom: '#1E3A8A', gradientTo: '#22D3EE', gradientAccent: '#0EA5E9' },
    dark:  { primary: '#60A5FA', primaryLight: '#1B2D4D', primaryText: '#93C5FD', gradientFrom: '#0F172A', gradientTo: '#155E75', gradientAccent: '#0284C7' },
  },
  {
    id: 'sand',
    label: 'Sandstone Calm',
    emoji: '🏜️',
    light: { primary: '#0F766E', primaryLight: '#CCFBF1', primaryText: '#115E59', gradientFrom: '#F5E6D3', gradientTo: '#E6D2BF', gradientAccent: '#0EA5E9' },
    dark:  { primary: '#2DD4BF', primaryLight: '#173533', primaryText: '#5EEAD4', gradientFrom: '#2A1F1A', gradientTo: '#3B2B24', gradientAccent: '#0F766E' },
  },
  {
    id: 'rose',
    label: 'Rose Quartz',
    emoji: '🌸',
    light: { primary: '#EC4899', primaryLight: '#FCE7F3', primaryText: '#BE185D', gradientFrom: '#EC4899', gradientTo: '#A78BFA', gradientAccent: '#F43F5E' },
    dark:  { primary: '#F472B6', primaryLight: '#3C2031', primaryText: '#F9A8D4', gradientFrom: '#9D174D', gradientTo: '#6D28D9', gradientAccent: '#BE185D' },
  },
  {
    id: 'slate',
    label: 'Slate Minimal',
    emoji: '🪨',
    light: { primary: '#475569', primaryLight: '#F1F5F9', primaryText: '#334155', gradientFrom: '#94A3B8', gradientTo: '#CBD5E1', gradientAccent: '#64748B' },
    dark:  { primary: '#94A3B8', primaryLight: '#24303F', primaryText: '#CBD5E1', gradientFrom: '#0F172A', gradientTo: '#334155', gradientAccent: '#475569' },
  },
];

export const FONT_OPTIONS = [
  { label: 'Space Grotesk (Default)', value: 'Space Grotesk' },
  { label: 'Inter', value: 'Inter' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Nunito', value: 'Nunito' },
];

export const FONT_SIZES = [
  { label: 'Small', value: '13' },
  { label: 'Medium', value: '14' },
  { label: 'Large', value: '15' },
  { label: 'X-Large', value: '16' },
];

export const DEFAULT_THEME_PREFS: AppThemePrefs = {
  themeId: 'aurora',
  fontFamily: 'Space Grotesk',
  fontSize: '14',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function resolveThemePack(themeId?: string): ThemePack {
  return THEME_PACKS.find((p) => p.id === themeId) ?? THEME_PACKS[0];
}

export function normalizeThemePrefs(raw: unknown): AppThemePrefs {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME_PREFS;
  const r = raw as Record<string, unknown>;
  return {
    themeId: typeof r.themeId === 'string' ? r.themeId : DEFAULT_THEME_PREFS.themeId,
    fontFamily: typeof r.fontFamily === 'string' ? r.fontFamily : DEFAULT_THEME_PREFS.fontFamily,
    fontSize: typeof r.fontSize === 'string' ? r.fontSize : DEFAULT_THEME_PREFS.fontSize,
    timezone: typeof r.timezone === 'string' ? r.timezone : DEFAULT_THEME_PREFS.timezone,
  };
}

export function applyThemePrefs(prefs: AppThemePrefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme') === 'dark';
  const pack = resolveThemePack(prefs.themeId);
  const tokens = dark ? pack.dark : pack.light;

  root.style.setProperty('--primary', tokens.primary);
  root.style.setProperty('--primary-light', tokens.primaryLight);
  root.style.setProperty('--primary-text', tokens.primaryText);
  root.style.setProperty('--gradient-from', tokens.gradientFrom);
  root.style.setProperty('--gradient-to', tokens.gradientTo);
  root.style.setProperty('--gradient-accent', tokens.gradientAccent);
  root.style.fontSize = `${prefs.fontSize}px`;

  const baseFonts = ['Space Grotesk', 'Inter', 'DM Sans', 'Sora', 'Poppins', 'Nunito'];
  const selected = prefs.fontFamily || DEFAULT_THEME_PREFS.fontFamily;
  const body = document.body;
  if (baseFonts.includes(selected)) {
    const id = `gf-${selected.replace(/\s/g, '-')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${selected.replace(/\s/g, '+')}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }
  body.style.fontFamily = `'${selected}', sans-serif`;
}
