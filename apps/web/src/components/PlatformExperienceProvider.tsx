'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyPlatformThemePreset } from '@/lib/platformTheme';
import {
  applyPlatformExperience,
  DEFAULT_PLATFORM_EXPERIENCE,
  normalizePlatformExperience,
  PLATFORM_EXPERIENCE_CACHE_KEY,
  type PlatformExperienceConfig,
} from '@/lib/platformExperience';

interface PlatformExperienceContextValue {
  config: PlatformExperienceConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlatformExperienceContext = createContext<PlatformExperienceContextValue>({
  config: DEFAULT_PLATFORM_EXPERIENCE,
  loading: true,
  refresh: async () => {},
});

export function PlatformExperienceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformExperienceConfig>(DEFAULT_PLATFORM_EXPERIENCE);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform-config');
      const body = await res.json() as { ok?: boolean; config?: unknown };
      const next = normalizePlatformExperience(body?.config);
      setConfig(next);
      applyPlatformExperience(next);
      applyPlatformThemePreset(next.theme.platformPreset);
    } catch {
      setConfig((prev) => {
        applyPlatformExperience(prev);
        return prev;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLATFORM_EXPERIENCE_CACHE_KEY);
      if (raw) {
        const cached = normalizePlatformExperience(JSON.parse(raw));
        setConfig(cached);
        applyPlatformExperience(cached);
        applyPlatformThemePreset(cached.theme.platformPreset);
      } else {
        applyPlatformExperience(DEFAULT_PLATFORM_EXPERIENCE);
        applyPlatformThemePreset(DEFAULT_PLATFORM_EXPERIENCE.theme.platformPreset);
      }
    } catch {
      applyPlatformExperience(DEFAULT_PLATFORM_EXPERIENCE);
      applyPlatformThemePreset(DEFAULT_PLATFORM_EXPERIENCE.theme.platformPreset);
    }

    void load();
  }, []);

  const value = useMemo(() => ({ config, loading, refresh: load }), [config, loading]);

  return (
    <PlatformExperienceContext.Provider value={value}>
      {children}
    </PlatformExperienceContext.Provider>
  );
}

export function usePlatformExperience() {
  return useContext(PlatformExperienceContext);
}
