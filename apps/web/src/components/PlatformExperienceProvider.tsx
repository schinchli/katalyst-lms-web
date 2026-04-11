'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applyPlatformThemePreset } from '@/lib/platformTheme';
import { applyQuizCatalogOverrides } from '@/lib/quizCatalog';
import {
  applyPlatformExperience,
  DEFAULT_PLATFORM_EXPERIENCE,
  normalizePlatformExperience,
  PLATFORM_EXPERIENCE_CACHE_KEY,
  type PlatformExperienceConfig,
} from '@/lib/platformExperience';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import { MaintenanceBanner } from './MaintenanceBanner';

interface PlatformExperienceContextValue {
  config: PlatformExperienceConfig;
  systemFeatures: SystemFeaturesConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlatformExperienceContext = createContext<PlatformExperienceContextValue>({
  config: DEFAULT_PLATFORM_EXPERIENCE,
  systemFeatures: DEFAULT_SYSTEM_FEATURES,
  loading: true,
  refresh: async () => {},
});

export function PlatformExperienceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformExperienceConfig>(DEFAULT_PLATFORM_EXPERIENCE);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [platformRes, quizCatalogRes, systemFeaturesRes] = await Promise.all([
        fetch('/api/platform-config'),
        fetch('/api/quiz-catalog'),
        fetch('/api/system-features'),
      ]);
      const platformBody = await platformRes.json() as { ok?: boolean; config?: unknown };
      const quizCatalogBody = await quizCatalogRes.json() as { ok?: boolean; overrides?: unknown };
      const systemFeaturesBody = await systemFeaturesRes.json() as { ok?: boolean; config?: unknown };
      const next = normalizePlatformExperience(platformBody?.config);
      applyQuizCatalogOverrides(quizCatalogBody?.overrides);
      setConfig(next);
      setSystemFeatures(normalizeSystemFeatures(systemFeaturesBody?.config));
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

  const value = useMemo(() => ({ config, systemFeatures, loading, refresh: load }), [config, systemFeatures, loading]);

  return (
    <PlatformExperienceContext.Provider value={value}>
      {systemFeatures.maintenanceMode ? (
        <MaintenanceBanner message={systemFeatures.maintenanceMessage} />
      ) : (
        children
      )}
    </PlatformExperienceContext.Provider>
  );
}

export function usePlatformExperience() {
  return useContext(PlatformExperienceContext);
}
