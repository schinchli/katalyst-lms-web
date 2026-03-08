'use client';
import { useState, useEffect } from 'react';

// ── Theme ─────────────────────────────────────────────────────────────────────
interface AppTheme {
  primaryColor: string;
  primaryLight: string;
  fontFamily:   string;
  fontSize:     string;
  timezone:     string;
}

const DEFAULT_THEME: AppTheme = {
  primaryColor: '#7367F0', primaryLight: '#EBE9FD',
  fontFamily: 'Public Sans', fontSize: '14',
  timezone: 'Asia/Kolkata',
};

const PRESET_COLORS = [
  { label: 'Violet (Default)', value: '#7367F0', light: '#EBE9FD' },
  { label: 'Sky Blue',         value: '#0EA5E9', light: '#E0F2FE' },
  { label: 'Teal',             value: '#14B8A6', light: '#CCFBF1' },
  { label: 'Emerald',          value: '#10B981', light: '#D1FAE5' },
  { label: 'Rose',             value: '#F43F5E', light: '#FFE4E6' },
  { label: 'Amber',            value: '#F59E0B', light: '#FEF3C7' },
  { label: 'Orange',           value: '#F97316', light: '#FFEDD5' },
  { label: 'Indigo',           value: '#6366F1', light: '#EEF2FF' },
  { label: 'Slate',            value: '#64748B', light: '#F1F5F9' },
];

const FONT_OPTIONS = [
  { label: 'Public Sans (Default)', value: 'Public Sans' },
  { label: 'Inter',                 value: 'Inter'       },
  { label: 'DM Sans',               value: 'DM Sans'     },
  { label: 'Nunito',                value: 'Nunito'      },
  { label: 'Poppins',               value: 'Poppins'     },
];

const FONT_SIZES = [
  { label: 'Small',  value: '13' },
  { label: 'Medium', value: '14' },
  { label: 'Large',  value: '15' },
  { label: 'XL',     value: '16' },
];

function applyTheme(t: AppTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary',       t.primaryColor);
  root.style.setProperty('--primary-light', t.primaryLight);
  root.style.setProperty('--primary-text',  t.primaryColor);
  root.style.fontSize = `${t.fontSize}px`;
  if (t.fontFamily !== 'Public Sans') {
    const id = `gf-${t.fontFamily.replace(/\s/g, '-')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id; link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/\s/g, '+')}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = `'${t.fontFamily}', sans-serif`;
  } else {
    document.body.style.fontFamily = '';
  }
}

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
  subtext:        'Unlock all {remaining} remaining questions and every exam domain. Join 10,000+ learners who passed with Katalyst Pro.',
  proCtaLabel:    '⭐ Upgrade to Pro — ₹999/yr',
  courseCtaLabel: '🔓 Unlock this quiz — ₹{price}',
  skipCtaLabel:   'Continue without answers',
};

export default function SettingsPage() {
  const [theme,         setTheme]         = useState<AppTheme>(DEFAULT_THEME);
  const [themeSaved,    setThemeSaved]    = useState(false);

  const [adsense,       setAdsense]       = useState<AdSenseConfig>(DEFAULT_ADSENSE);
  const [adsenseSaved,  setAdsenseSaved]  = useState(false);

  const [upsell,        setUpsell]        = useState<UpsellConfig>(DEFAULT_UPSELL);
  const [upsellSaved,   setUpsellSaved]   = useState(false);

  useEffect(() => {
    // Load saved theme
    try {
      const raw = localStorage.getItem('katalyst-theme');
      if (raw) setTheme({ ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<AppTheme>) });
    } catch { /* ignore */ }

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
  }, []);

  // ── Theme helpers ────────────────────────────────────────────────────────────
  const pickPreset = (color: typeof PRESET_COLORS[number]) => {
    const next = { ...theme, primaryColor: color.value, primaryLight: color.light };
    setTheme(next);
    applyTheme(next); // live preview immediately
  };

  const pickCustomColor = (hex: string) => {
    // Derive a light version (hex + 20% alpha approximation for swatch)
    const next = { ...theme, primaryColor: hex, primaryLight: hex + '20' };
    setTheme(next);
    applyTheme(next);
  };

  const saveTheme = () => {
    localStorage.setItem('katalyst-theme', JSON.stringify(theme));
    applyTheme(theme);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.setItem('katalyst-theme', JSON.stringify(DEFAULT_THEME));
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

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

  return (
    <div className="page-content">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customise theme, branding, ads, and app messaging</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ═══ COLOR THEME & BRANDING ════════════════════════════════════════ */}
        <div className="card" style={{ padding: 24 }}>
          <h2 className="settings-section-title">Color Theme & Branding</h2>
          <p className="settings-section-sub">
            Changes apply instantly across all dashboard pages. Save to persist after refresh.
          </p>

          {/* Live preview strip */}
          <div className="settings-preview-strip" style={{ background: theme.primaryLight }}>
            <span style={{ color: theme.primaryColor, fontWeight: 700 }}>Live preview</span>
            <button
              className="btn-primary"
              style={{ background: theme.primaryColor, fontSize: 12, padding: '6px 16px' }}
            >
              Sample button
            </button>
            <span style={{ color: theme.primaryColor, fontWeight: 600, fontSize: 13 }}>Link text</span>
          </div>

          {/* Preset swatches */}
          <div className="settings-field">
            <label className="settings-label">Preset Colors</label>
            <div className="settings-swatches">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  className={`settings-swatch${theme.primaryColor === c.value ? ' active' : ''}`}
                  style={{ background: c.value }}
                  onClick={() => pickPreset(c)}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="settings-field">
            <label className="settings-label">Custom Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => pickCustomColor(e.target.value)}
                className="settings-color-input"
                title="Pick any color"
              />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {theme.primaryColor}
              </span>
            </div>
          </div>

          {/* Font family */}
          <div className="settings-field">
            <label className="settings-label">Font Family</label>
            <select
              className="settings-select"
              value={theme.fontFamily}
              onChange={(e) => {
                const next = { ...theme, fontFamily: e.target.value };
                setTheme(next);
                applyTheme(next);
              }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div className="settings-field">
            <label className="settings-label">Font Size</label>
            <div className="settings-pill-row">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.value}
                  className={`settings-pill${theme.fontSize === s.value ? ' active' : ''}`}
                  onClick={() => {
                    const next = { ...theme, fontSize: s.value };
                    setTheme(next);
                    applyTheme(next);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn-primary" onClick={saveTheme}>
              {themeSaved ? '✓ Saved' : 'Save Appearance'}
            </button>
            <button className="settings-btn-ghost" onClick={resetTheme}>
              Reset to defaults
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
