export type PlatformThemePresetId = 'datacamp' | 'aurora' | 'sandstone' | 'midnight';

export interface PlatformThemeConfig {
  presetId: PlatformThemePresetId;
}

export interface PlatformThemePreset {
  id: PlatformThemePresetId;
  label: string;
  description: string;
  heroPreview: string;
  buttonStyle: string;
  headingFont: string;
  bodyFont: string;
}

export const PLATFORM_THEME_KEY = 'platform_theme';
export const PLATFORM_THEME_CACHE_KEY = 'katalyst-platform-theme-cache';

export const PLATFORM_THEME_PRESETS: PlatformThemePreset[] = [
  {
    id: 'datacamp',
    label: 'DataCamp Night',
    description: 'Deep navy dashboards with green-violet highlights and cleaner learning rails.',
    heroPreview: 'linear-gradient(135deg, #00152D 0%, #00ED64 18%, #3D7BFF 62%, #6F44FF 100%)',
    buttonStyle: 'Rounded, bold green',
    headingFont: 'Sora',
    bodyFont: 'Inter',
  },
  {
    id: 'aurora',
    label: 'Neon Aurora',
    description: 'Energetic launch style with magenta-blue-cyan gradients.',
    heroPreview: 'linear-gradient(145deg, #C084FC 0%, #0EA5E9 55%, #22D3EE 100%)',
    buttonStyle: 'Pill, glow',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
  },
  {
    id: 'sandstone',
    label: 'Sandstone Calm',
    description: 'Warm, low-glare study mode for long reading sessions.',
    heroPreview: 'linear-gradient(135deg, #F5E6D3 0%, #E6D2BF 100%)',
    buttonStyle: 'Solid teal',
    headingFont: 'Sora',
    bodyFont: 'Inter',
  },
  {
    id: 'midnight',
    label: 'Midnight Focus',
    description: 'High-contrast dashboard style with cyan accents.',
    heroPreview: 'radial-gradient(circle at 24% 20%, #22D3EE55 0%, #0F172A 58%)',
    buttonStyle: 'Squared cyan',
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
];

export const DEFAULT_PLATFORM_THEME: PlatformThemeConfig = { presetId: 'datacamp' };

export function normalizePlatformTheme(raw: unknown): PlatformThemeConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_PLATFORM_THEME;
  const presetId = (raw as { presetId?: unknown }).presetId;
  if (presetId === 'datacamp' || presetId === 'aurora' || presetId === 'sandstone' || presetId === 'midnight') {
    return { presetId };
  }
  return DEFAULT_PLATFORM_THEME;
}

export function applyPlatformThemePreset(presetId: PlatformThemePresetId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-platform-theme', presetId);
  try {
    localStorage.setItem(PLATFORM_THEME_CACHE_KEY, JSON.stringify({ presetId }));
  } catch {
    // best-effort cache
  }
}
