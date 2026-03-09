'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import type { QuizResult } from '@/types';
import { getQuizResults, saveUserProfile, getUserProfile, deleteAllQuizResults } from '@/lib/db';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
}

const DIFF_COLOR: Record<string, string> = { beginner: '#28C76F', intermediate: '#FF9F43', advanced: '#FF4C51' };

// ── Appearance / Theme ────────────────────────────────────────────────────────
interface AppTheme {
  primaryColor: string;
  primaryLight: string;
  fontFamily:   string;
  fontSize:     string;
  timezone:     string; // IANA timezone, e.g. 'Asia/Kolkata'
}

const DEFAULT_THEME: AppTheme = {
  primaryColor: '#7367F0', primaryLight: '#EBE9FD',
  fontFamily: 'Public Sans', fontSize: '14',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// Common timezones grouped for usability
const TIMEZONES = [
  { label: 'UTC',                          value: 'UTC'                      },
  { label: 'IST — India (UTC+5:30)',        value: 'Asia/Kolkata'             },
  { label: 'GST — Gulf (UTC+4)',            value: 'Asia/Dubai'               },
  { label: 'SGT — Singapore (UTC+8)',       value: 'Asia/Singapore'           },
  { label: 'CST — China (UTC+8)',           value: 'Asia/Shanghai'            },
  { label: 'JST — Japan (UTC+9)',           value: 'Asia/Tokyo'               },
  { label: 'AEST — Sydney (UTC+10)',        value: 'Australia/Sydney'         },
  { label: 'GMT — London (UTC+0)',          value: 'Europe/London'            },
  { label: 'CET — Central Europe (UTC+1)', value: 'Europe/Berlin'            },
  { label: 'EET — Eastern Europe (UTC+2)', value: 'Europe/Helsinki'          },
  { label: 'MSK — Moscow (UTC+3)',          value: 'Europe/Moscow'            },
  { label: 'EST — New York (UTC-5)',        value: 'America/New_York'         },
  { label: 'CST — Chicago (UTC-6)',         value: 'America/Chicago'          },
  { label: 'MST — Denver (UTC-7)',          value: 'America/Denver'           },
  { label: 'PST — Los Angeles (UTC-8)',     value: 'America/Los_Angeles'      },
  { label: 'BRT — São Paulo (UTC-3)',       value: 'America/Sao_Paulo'        },
];

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

// All fonts below are free under SIL Open Font License — safe for web & mobile
const FONT_OPTIONS = [
  { label: 'Public Sans (Default)', value: 'Public Sans' }, // modern, clean, great readability
  { label: 'Inter',                 value: 'Inter'       }, // best UI font, used by Figma/Linear
  { label: 'DM Sans',               value: 'DM Sans'     }, // geometric, clean, highly legible
  { label: 'Nunito',                value: 'Nunito'      }, // rounded, friendly, easy on eyes
  { label: 'Poppins',               value: 'Poppins'     }, // geometric, bold-friendly
];

const FONT_SIZES = [
  { label: 'Small',            value: '13' },
  { label: 'Medium (Default)', value: '14' },
  { label: 'Large',            value: '15' },
  { label: 'X-Large',          value: '16' },
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

export default function ProfilePage() {
  const [results,      setResults]      = useState<QuizResult[]>([]);
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [role,         setRole]         = useState('AWS Learner');
  const [saved,        setSaved]        = useState(false);
  const [authUserId,   setAuthUserId]   = useState<string | null>(null);
  const [theme,        setTheme]        = useState<AppTheme>(DEFAULT_THEME);
  const [confirmReset, setConfirmReset] = useState(false);
  const { isPro, unlockedCourses } = useSubscription();

  useEffect(() => {
    setResults(getLocalResults());
    setRole(localStorage.getItem('profile-role') || 'AWS Learner');

    // Load and apply saved appearance theme
    try {
      const raw = localStorage.getItem('katalyst-theme');
      const saved = raw ? (JSON.parse(raw) as AppTheme) : DEFAULT_THEME;
      setTheme(saved);
      applyTheme(saved);
    } catch { /* ignore */ }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setAuthUserId(user.id);
        const supabaseName = (user.user_metadata?.name as string | undefined)
                          ?? user.email?.split('@')[0]
                          ?? 'Learner';

        // Load profile from Supabase, fallback to localStorage
        const profile = await getUserProfile(user.id);
        setName(profile?.name || localStorage.getItem('profile-name') || supabaseName);
        setRole(profile?.role || localStorage.getItem('profile-role') || 'AWS Learner');
        setEmail(localStorage.getItem('profile-email') || user.email || '');

        // Load quiz results from Supabase
        const supabaseResults = await getQuizResults(user.id);
        if (supabaseResults.length > 0) {
          setResults(supabaseResults);
          try { localStorage.setItem('quiz-results', JSON.stringify(supabaseResults)); } catch { /* best-effort */ }
        }
      } else {
        setName(localStorage.getItem('profile-name')  || 'Learner');
        setEmail(localStorage.getItem('profile-email') || '');
      }
    });
  }, []);

  const handleSave = async () => {
    localStorage.setItem('profile-name',  name);
    localStorage.setItem('profile-email', email);
    localStorage.setItem('profile-role',  role);
    localStorage.setItem('katalyst-theme', JSON.stringify(theme));
    applyTheme(theme);
    // Sync name + email to Supabase auth so it's persisted across devices
    await supabase.auth.updateUser({ data: { name }, email: email || undefined });
    if (authUserId) await saveUserProfile(authUserId, { name, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  function updateTheme(patch: Partial<AppTheme>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next); // live preview
  }

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    setConfirmReset(false);
    localStorage.removeItem('quiz-results');
    if (authUserId) await deleteAllQuizResults(authUserId).catch(() => { /* best-effort */ });
    setResults([]);
  };

  const completed  = new Set(results.map((r) => r.quizId));
  const avgScore   = results.length ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.totalQuestions) * 100), 0) / results.length) : 0;
  const level      = Math.max(1, Math.floor(completed.size / 3));
  const totalSecs  = results.reduce((s, r) => s + (r.timeTaken ?? 0), 0);
  const totalHrs   = Math.floor(totalSecs / 3600);
  const initial    = name.charAt(0).toUpperCase() || 'L';

  return (
    <div className="page-content profile-page">
      {/* Profile card */}
      <div className="profile-card">
        {/* Banner with name overlay */}
        <div className="profile-banner">
          <div className="profile-banner-bg">
            <svg width="100%" height="220" viewBox="0 0 900 220" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5A52D5" />
                  <stop offset="60%" stopColor="#7367F0" />
                  <stop offset="100%" stopColor="#9e95f5" />
                </linearGradient>
              </defs>
              <rect width="900" height="220" fill="url(#bannerGrad)" />
              <circle cx="820" cy="40"  r="90"  fill="white" opacity="0.07" />
              <circle cx="750" cy="180" r="130" fill="white" opacity="0.05" />
              <circle cx="100" cy="10"  r="70"  fill="white" opacity="0.06" />
              <circle cx="200" cy="200" r="50"  fill="white" opacity="0.04" />
              {[30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,510,540,570,600,630,660,690,720,750,780,810,840,870].map((x) =>
                [40,80,120,160,200].map((y) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="white" opacity="0.2" />
                ))
              )}
            </svg>
          </div>
          {/* Name / role text — white on the purple gradient */}
          <div style={{ position: 'absolute', bottom: 52, left: 148, right: 28 }}>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 3px', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>{name || email}</h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, margin: 0 }}>{role}</p>
          </div>
        </div>

        {/* Avatar + badges row */}
        <div className="profile-avatar-row">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-avatar-info">
            <div className="profile-badges">
              <span className="profile-badge" style={isPro ? { background: '#FF9F4318', color: '#FF9F43', fontWeight: 700 } : { background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {isPro ? '⭐ Pro' : 'Free Plan'}
              </span>
              <span className="profile-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-text)' }}>Level {level}</span>
              <span className="profile-badge" style={{ background: '#28C76F18', color: '#28C76F' }}>{completed.size} Completed</span>
              {avgScore > 0 && (
                <span className="profile-badge" style={{ background: '#FF9F4318', color: '#FF9F43' }}>Avg {avgScore}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="profile-stats-row">
          <div className="profile-stat-cell">
            <div className="profile-stat-val" style={{ color: 'var(--primary)' }}>{completed.size}</div>
            <div className="profile-stat-lbl">Quizzes Done</div>
          </div>
          <div className="profile-stat-cell">
            <div className="profile-stat-val" style={{ color: '#FF9F43' }}>{avgScore}%</div>
            <div className="profile-stat-lbl">Avg Score</div>
          </div>
          <div className="profile-stat-cell">
            <div className="profile-stat-val" style={{ color: '#28C76F' }}>{Math.max(totalHrs, results.length > 0 ? 1 : 0)}h</div>
            <div className="profile-stat-lbl">Study Hours</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* About */}
        <div className="info-card">
          <div className="info-card-header">About</div>
          <div className="info-card-body">
            <div className="info-row">
              <span className="info-label">Full Name</span>
              <span className="info-value">{name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{email || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value">{role}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Level</span>
              <span className="info-value">Level {level} — AWS Learner</span>
            </div>
            <div className="info-row">
              <span className="info-label">Subscription</span>
              <span className="info-value" style={isPro ? { color: '#FF9F43', fontWeight: 700 } : {}}>
                {isPro ? '⭐ Pro — Unlimited access' : `Free — ${unlockedCourses.length} course${unlockedCourses.length !== 1 ? 's' : ''} unlocked`}
              </span>
            </div>
            {!isPro && unlockedCourses.length > 0 && (
              <div className="info-row" style={{ alignItems: 'flex-start' }}>
                <span className="info-label">Unlocked</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {unlockedCourses.map((cId) => {
                    const q = quizzes.find((quiz) => quiz.id === cId);
                    return (
                      <span key={cId} className="info-value" style={{ fontSize: 12 }}>
                        ✓ {q?.title ?? cId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Platform</span>
              <span className="info-value">Katalyst Quiz Platform</span>
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="info-card">
          <div className="info-card-header">Recent Activity</div>
          <div className="info-card-body">
            {results.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No quizzes taken yet.</p>
            ) : (
              results.slice(-5).reverse().map((r, i) => {
                const q    = quizzes.find((q) => q.id === r.quizId);
                const pct  = Math.round((r.score / r.totalQuestions) * 100);
                const pass = pct >= 70;
                const accent = q ? (DIFF_COLOR[q.difficulty] ?? '#7367F0') : '#7367F0';
                return (
                  <div key={i} className="info-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                    <span className="info-label" style={{ fontSize: 12 }}>{q?.title ?? r.quizId}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: pass ? '#28C76F' : '#FF4C51' }}>{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="info-card" style={{ marginTop: 20 }}>
        <div className="info-card-header">Appearance</div>
        <div className="info-card-body">

          {/* Color theme */}
          <div className="form-field" style={{ marginBottom: 20 }}>
            <label className="form-label">Primary Color</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => updateTheme({ primaryColor: c.value, primaryLight: c.light })}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c.value, border: 'none', cursor: 'pointer',
                    outline: theme.primaryColor === c.value ? `3px solid ${c.value}` : '3px solid transparent',
                    outlineOffset: 2,
                    boxShadow: theme.primaryColor === c.value ? `0 0 0 5px ${c.value}22` : 'none',
                    transition: 'box-shadow 0.15s, outline 0.15s',
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              Selected: <strong style={{ color: theme.primaryColor }}>{PRESET_COLORS.find((c) => c.value === theme.primaryColor)?.label ?? theme.primaryColor}</strong>
            </div>
          </div>

          {/* Font family */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-field">
              <label className="form-label">Font Family</label>
              <select
                className="form-input"
                value={theme.fontFamily}
                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                style={{ fontFamily: `'${theme.fontFamily}', sans-serif` }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', sans-serif` }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div className="form-field">
              <label className="form-label">Font Size</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {FONT_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateTheme({ fontSize: s.value })}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 'var(--radius)',
                      border: `1.5px solid ${theme.fontSize === s.value ? theme.primaryColor : 'var(--border)'}`,
                      background: theme.fontSize === s.value ? theme.primaryColor + '15' : 'var(--bg)',
                      color: theme.fontSize === s.value ? theme.primaryColor : 'var(--text-secondary)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {s.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="form-field" style={{ marginTop: 16 }}>
            <label className="form-label">Timezone — used for daily activity tracker</label>
            <select
              className="goal-select"
              value={theme.timezone}
              onChange={(e) => updateTheme({ timezone: e.target.value })}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Auto-detected: <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius)', background: theme.primaryLight, border: `1px solid ${theme.primaryColor}33` }}>
            <span style={{ fontSize: parseInt(theme.fontSize), fontFamily: `'${theme.fontFamily}', sans-serif`, color: theme.primaryColor, fontWeight: 700 }}>
              Preview: {theme.fontFamily} · {theme.fontSize}px · </span>
            <span style={{ fontSize: parseInt(theme.fontSize), fontFamily: `'${theme.fontFamily}', sans-serif`, color: 'var(--text)' }}>
              The quick brown fox jumps over the lazy dog.
            </span>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Changes apply live immediately. Click <strong>Save Changes</strong> below to persist across sessions.
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="info-card" style={{ marginTop: 20 }}>
        <div className="info-card-header">Edit Profile</div>
        <div className="info-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-field">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-field" style={{ maxWidth: 300 }}>
            <label className="form-label">Role / Title</label>
            <input className="form-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. AWS Solutions Architect" />
          </div>
          <button className="btn-primary" onClick={handleSave}>{saved ? '✓ Saved!' : 'Save Changes'}</button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="info-card" style={{ marginTop: 20, borderColor: '#FF4C5133' }}>
        <div className="info-card-header" style={{ color: '#FF4C51' }}>Danger Zone</div>
        <div className="info-card-body">
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Reset your quiz progress. All scores and completions will be permanently deleted.
          </p>
          {confirmReset ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Are you sure? This cannot be undone.</span>
              <button className="btn-danger" onClick={handleReset}>Yes, delete everything</button>
              <button className="settings-btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn-danger" onClick={handleReset}>Reset All Progress</button>
          )}
        </div>
      </div>
    </div>
  );
}
