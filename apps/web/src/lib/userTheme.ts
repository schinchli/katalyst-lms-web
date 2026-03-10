import { supabase } from '@/lib/supabase';
import {
  DEFAULT_THEME_PREFS,
  normalizeThemePrefs,
  type AppThemePrefs,
} from '@/lib/themePacks';

export async function fetchUserTheme(userId: string): Promise<AppThemePrefs> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('theme_pref')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.theme_pref) return DEFAULT_THEME_PREFS;
  return normalizeThemePrefs(data.theme_pref);
}

export async function saveUserTheme(userId: string, prefs: AppThemePrefs): Promise<void> {
  await supabase
    .from('user_profiles')
    .update({ theme_pref: prefs })
    .eq('id', userId);
}
