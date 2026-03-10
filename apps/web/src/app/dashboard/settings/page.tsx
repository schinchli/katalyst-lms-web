'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  PLATFORM_THEME_PRESETS,
  DEFAULT_PLATFORM_THEME,
  normalizePlatformTheme,
  applyPlatformThemePreset,
  type PlatformThemeConfig,
} from '@/lib/platformTheme';

// ── AdSense config ────────────────────────────────────────────────────────────
const ADSENSE_KEY = 'katalyst-adsense-config';

interface AdSenseConfig { pubId: string; slotH: string; slotR: string; }

const DEFAULT_ADSENSE: AdSenseConfig = { pubId: '', slotH: '', slotR: '' };

// ── Upsell messaging ──────────────────────────────────────────────────────────
const ADMIN_MSGS_KEY = 'katalyst-admin-msgs';

interface UpsellConfig {
  freeLimit:      number;
  headline:       string;
  subtext:        string;
  proCtaLabel:    string;
  courseCtaLabel: string;
  skipCtaLabel:   string;
}

const DEFAULT_UPSELL: UpsellConfig = {
  freeLimit:      25,
  headline:       'You\'ve completed the free preview — {n} questions',
  subtext:        'Unlock all {remaining} remaining questions and every exam domain to ace the exam. Your score so far: {score}.',
  proCtaLabel:    '⭐ Upgrade to Pro — ₹999/yr',
  courseCtaLabel: '🔓 Unlock this quiz — ₹{price}',
  skipCtaLabel:   'Continue without answers',
};

export default function SettingsPage() {
  const router = useRouter();
  const [authorized,    setAuthorized]    = useState(false);
  const [accessToken,   setAccessToken]   = useState<string>('');

  const [adsense,       setAdsense]       = useState<AdSenseConfig>(DEFAULT_ADSENSE);
  const [adsenseSaved,  setAdsenseSaved]  = useState(false);

  const [upsell,        setUpsell]        = useState<UpsellConfig>(DEFAULT_UPSELL);
  const [upsellSaved,   setUpsellSaved]   = useState(false);
  const [platformTheme, setPlatformTheme] = useState<PlatformThemeConfig>(DEFAULT_PLATFORM_THEME);
  const [themeSaved,    setThemeSaved]    = useState(false);

  useEffect(() => {
    // Admin guard — redirect non-admins immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) { router.replace('/dashboard'); return; }
      setAccessToken(session.access_token);
      try {
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const d = await res.json() as { isAdmin?: boolean };
        if (!d.isAdmin) { router.replace('/dashboard'); return; }
        setAuthorized(true);
      } catch { router.replace('/dashboard'); }
    });

    // Load saved adsense
    try {
      const raw = localStorage.getItem(ADSENSE_KEY);
      if (raw) setAdsense({ ...DEFAULT_ADSENSE, ...(JSON.parse(raw) as Partial<AdSenseConfig>) });
    } catch { /* ignore */ }

    // Load saved upsell messaging
    try {
      const raw = localStorage.getItem(ADMIN_MSGS_KEY);
      if (raw) setUpsell({ ...DEFAULT_UPSELL, ...(JSON.parse(raw) as Partial<UpsellConfig>) });
    } catch { /* ignore */ }

    // Load current platform theme config
    fetch('/api/theme')
      .then((r) => r.json())
      .then((d: { ok?: boolean; theme?: unknown }) => {
        if (!d?.ok) return;
        setPlatformTheme(normalizePlatformTheme(d.theme));
      })
      .catch(() => { /* ignore */ });
  }, []);

  // ── AdSense helpers ──────────────────────────────────────────────────────────
  const saveAdsense = () => {
    localStorage.setItem(ADSENSE_KEY, JSON.stringify(adsense));
    setAdsenseSaved(true);
    setTimeout(() => setAdsenseSaved(false), 2000);
  };

  // ── Upsell helpers ───────────────────────────────────────────────────────────
  const saveUpsell = () => {
    localStorage.setItem(ADMIN_MSGS_KEY, JSON.stringify(upsell));
    setUpsellSaved(true);
    setTimeout(() => setUpsellSaved(false), 2000);
  };

  const resetUpsell = () => {
    setUpsell(DEFAULT_UPSELL);
    localStorage.setItem(ADMIN_MSGS_KEY, JSON.stringify(DEFAULT_UPSELL));
    setUpsellSaved(true);
    setTimeout(() => setUpsellSaved(false), 2000);
  };

  const savePlatformTheme = async () => {
    if (!accessToken) return;
    const res = await fetch('/api/admin/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(platformTheme),
    });
    if (!res.ok) return;
    applyPlatformThemePreset(platformTheme.presetId);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  if (!authorized) return null;

  return (
    <div className="page-content">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Admin: manage ads and app messaging</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ═══ PLATFORM THEME ═══════════════════════════════════════════════ */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h2 className="settings-section-title">Platform Theme (Global)</h2>
          <p className="settings-section-sub">
            Admin-controlled theme applied across web and mobile apps for all users.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {PLATFORM_THEME_PRESETS.map((preset) => {
              const active = platformTheme.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setPlatformTheme({ presetId: preset.id })}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-light)' : 'var(--bg)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ height: 48, borderRadius: 10, background: preset.heroPreview, marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{preset.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>{preset.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    {preset.headingFont} / {preset.bodyFont} · {preset.buttonStyle}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="settings-actions">
            <button className="btn-primary" onClick={savePlatformTheme}>
              {themeSaved ? '✓ Saved' : 'Save Global Theme'}
            </button>
          </div>
        </div>

        {/* ═══ GOOGLE ADSENSE ════════════════════════════════════════════════ */}
        <div className="card" style={{ padding: 24 }}>
          <h2 className="settings-section-title">Google AdSense</h2>
          <p className="settings-section-sub">
            Enter your AdSense publisher ID and slot IDs. Changes take effect on next page load.
            Pro users never see ads.
          </p>

          <div className="settings-field">
            <label className="settings-label">Publisher ID</label>
            <input
              className="admin-field-input"
              placeholder="ca-pub-XXXXXXXXXXXXXXXXX"
              value={adsense.pubId}
              onChange={(e) => setAdsense({ ...adsense, pubId: e.target.value })}
            />
            <span className="settings-hint">Found in AdSense → Account → Publisher ID</span>
          </div>

          <div className="settings-field">
            <label className="settings-label">Horizontal / Leaderboard Slot ID</label>
            <input
              className="admin-field-input"
              placeholder="1111111111"
              value={adsense.slotH}
              onChange={(e) => setAdsense({ ...adsense, slotH: e.target.value })}
            />
            <span className="settings-hint">Used in quiz intro, results, and quizzes list</span>
          </div>

          <div className="settings-field">
            <label className="settings-label">Rectangle / Square Slot ID</label>
            <input
              className="admin-field-input"
              placeholder="2222222222"
              value={adsense.slotR}
              onChange={(e) => setAdsense({ ...adsense, slotR: e.target.value })}
            />
            <span className="settings-hint">Used after &ldquo;What&apos;s Included&rdquo; section</span>
          </div>

          <div className="settings-actions">
            <button className="btn-primary" onClick={saveAdsense}>
              {adsenseSaved ? '✓ Saved' : 'Save AdSense Config'}
            </button>
          </div>
        </div>

        {/* ═══ APP MESSAGING ═════════════════════════════════════════════════ */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h2 className="settings-section-title">Upsell Messaging</h2>
          <p className="settings-section-sub">
            Customise the paywall copy shown to free users after their 25 preview questions.
          </p>

          {/* Variable reference */}
          <div className="settings-var-ref">
            <span className="settings-var-ref-title">Available variables:</span>
            {[
              ['{n}', 'Free question limit'],
              ['{remaining}', 'Locked question count'],
              ['{score}', 'User\'s score'],
              ['{total}', 'Total questions in quiz'],
              ['{price}', 'Quiz unlock price (₹)'],
            ].map(([v, d]) => (
              <span key={v} className="settings-var-chip">
                <code>{v}</code> {d}
              </span>
            ))}
          </div>

          <div className="settings-msg-grid">
            <div className="settings-field">
              <label className="settings-label">Free Question Limit</label>
              <input
                type="number"
                min={5}
                max={100}
                className="admin-field-input"
                value={upsell.freeLimit}
                onChange={(e) => setUpsell({ ...upsell, freeLimit: Number(e.target.value) })}
                style={{ width: 100 }}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Headline</label>
              <input
                className="admin-field-input"
                value={upsell.headline}
                onChange={(e) => setUpsell({ ...upsell, headline: e.target.value })}
              />
            </div>

            <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
              <label className="settings-label">Subtext / Body</label>
              <textarea
                className="admin-field-textarea"
                rows={3}
                value={upsell.subtext}
                onChange={(e) => setUpsell({ ...upsell, subtext: e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Pro CTA Label</label>
              <input
                className="admin-field-input"
                value={upsell.proCtaLabel}
                onChange={(e) => setUpsell({ ...upsell, proCtaLabel: e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Course CTA Label</label>
              <input
                className="admin-field-input"
                value={upsell.courseCtaLabel}
                onChange={(e) => setUpsell({ ...upsell, courseCtaLabel: e.target.value })}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Skip Link Label</label>
              <input
                className="admin-field-input"
                value={upsell.skipCtaLabel}
                onChange={(e) => setUpsell({ ...upsell, skipCtaLabel: e.target.value })}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn-primary" onClick={saveUpsell}>
              {upsellSaved ? '✓ Saved' : 'Save Messaging'}
            </button>
            <button className="settings-btn-ghost" onClick={resetUpsell}>
              Reset to defaults
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
