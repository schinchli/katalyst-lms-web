'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLATFORM_THEME_PRESETS, applyPlatformThemePreset } from '@/lib/platformTheme';
import {
  applyPlatformExperience,
  DEFAULT_PLATFORM_EXPERIENCE,
  normalizePlatformExperience,
  type PlatformExperienceConfig,
} from '@/lib/platformExperience';

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<PlatformExperienceConfig>(DEFAULT_PLATFORM_EXPERIENCE);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) {
        router.replace('/dashboard');
        return;
      }

      setAccessToken(session.access_token);
      try {
        const authRes = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const authBody = await authRes.json() as { isAdmin?: boolean };
        if (!authBody.isAdmin) {
          router.replace('/dashboard');
          return;
        }
        setAuthorized(true);

        const configRes = await fetch('/api/admin/mobile-config', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const configBody = await configRes.json() as { config?: unknown };
        setConfig(normalizePlatformExperience(configBody.config));
      } catch {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const saveConfig = async () => {
    if (!accessToken) return;

    const next = normalizePlatformExperience(config);
    const [platformRes, themeRes] = await Promise.all([
      fetch('/api/admin/mobile-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(next),
      }),
      fetch('/api/admin/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ presetId: next.theme.platformPreset }),
      }),
    ]);

    if (!platformRes.ok || !themeRes.ok) return;

    setConfig(next);
    applyPlatformExperience(next);
    applyPlatformThemePreset(next.theme.platformPreset);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!authorized) return null;

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <span className="dc-chip">Admin controls</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>Website experience settings</h1>
        <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          Control the web and mobile presentation from a shared platform config: theme preset, screen copy, visible widgets, course counts, article volume, and paywall behavior.
        </p>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Theme preset</h2>
          <div className="dc-grid" style={{ gap: 12, marginTop: 20 }}>
            {PLATFORM_THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setConfig((prev) => ({ ...prev, theme: { ...prev.theme, platformPreset: preset.id } }))}
                style={{
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 18,
                  border: `1px solid ${config.theme.platformPreset === preset.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: config.theme.platformPreset === preset.id ? 'var(--primary-light)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--text)',
                }}
              >
                <div style={{ height: 54, borderRadius: 14, background: preset.heroPreview, marginBottom: 10 }} />
                <div style={{ fontWeight: 700 }}>{preset.label}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Layout counts</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Featured courses', 'featuredCourseCount'],
              ['Popular courses', 'popularCourseCount'],
              ['Practice courses', 'practiceCourseCount'],
              ['Articles visible', 'resourcesArticleCount'],
              ['Free paywall limit', 'paywallFreeLimit'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <input
                  className="admin-field-input"
                  type="number"
                  value={config.layout[key as keyof PlatformExperienceConfig['layout']] as number}
                  onChange={(event) => setConfig((prev) => ({
                    ...prev,
                    layout: {
                      ...prev.layout,
                      [key]: Number(event.target.value || 0),
                    },
                  }))}
                />
              </label>
            ))}

            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Home action layout</div>
              <select
                className="admin-field-input"
                value={config.layout.homeActionsStyle}
                onChange={(event) => setConfig((prev) => ({ ...prev, layout: { ...prev.layout, homeActionsStyle: event.target.value as 'grid' | 'stack' } }))}
              >
                <option value="grid">Grid</option>
                <option value="stack">Stack</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Core copy</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Home hero title', 'homeHeroTitle'],
              ['Home hero subtitle', 'homeHeroSubtitle'],
              ['Quizzes subtitle', 'quizzesSubtitle'],
              ['Learn subtitle', 'learnSubtitle'],
              ['Progress subtitle', 'progressSubtitle'],
              ['Offer title', 'profileOfferTitle'],
              ['Offer subtitle', 'profileOfferSubtitle'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <textarea
                  className="admin-field-input"
                  value={config.copy[key as keyof PlatformExperienceConfig['copy']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, copy: { ...prev.copy, [key]: event.target.value } }))}
                  style={{ minHeight: 96 }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Paywall copy</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Headline', 'paywallHeadline'],
              ['Body copy', 'paywallSubtext'],
              ['Pro CTA', 'paywallProCta'],
              ['Course CTA', 'paywallCourseCta'],
              ['Skip CTA', 'paywallSkipCta'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <textarea
                  className="admin-field-input"
                  value={config.copy[key as keyof PlatformExperienceConfig['copy']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, copy: { ...prev.copy, [key]: event.target.value } }))}
                  style={{ minHeight: key === 'paywallSubtext' ? 120 : 72 }}
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Color controls</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Hero course surface', 'homeHeroCourseBg'],
              ['Premium accent', 'premiumAccent'],
              ['Profile offer accent', 'profileOfferAccent'],
              ['Hero gradient from', 'heroGradientFrom'],
              ['Hero gradient to', 'heroGradientTo'],
              ['Hero gradient accent', 'heroGradientAccent'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <input
                  className="admin-field-input"
                  value={config.colors[key as keyof PlatformExperienceConfig['colors']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: event.target.value } }))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Widget visibility</h2>
          <div className="dc-grid" style={{ gap: 12, marginTop: 20 }}>
            {Object.entries(config.widgets).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(event) => setConfig((prev) => ({ ...prev, widgets: { ...prev.widgets, [key]: event.target.checked } }))}
                />
                {key}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={saveConfig}>{saved ? 'Saved' : 'Save platform config'}</button>
          <button className="settings-btn-ghost" onClick={() => setConfig(DEFAULT_PLATFORM_EXPERIENCE)}>Reset defaults</button>
          <span style={{ color: 'var(--text-secondary)' }}>These settings feed the shared platform config used by web and mobile.</span>
        </div>
      </section>
    </div>
  );
}
