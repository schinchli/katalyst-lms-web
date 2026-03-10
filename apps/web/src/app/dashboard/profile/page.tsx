'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import type { QuizResult } from '@/types';
import { getQuizResults, saveUserProfile, getUserProfile, deleteAllQuizResults } from '@/lib/db';
import { PLATFORM_THEME_PRESETS, normalizePlatformTheme } from '@/lib/platformTheme';
import {
  THEME_PACKS,
  FONT_OPTIONS,
  FONT_SIZES,
  DEFAULT_THEME_PREFS,
  normalizeThemePrefs,
  applyThemePrefs,
  type AppThemePrefs,
} from '@/lib/themePacks';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('quiz-results') || '[]'); } catch { return []; }
}

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

const USER_PREFS_KEY = 'katalyst-user-prefs';

export default function ProfilePage() {
  const [results,      setResults]      = useState<QuizResult[]>([]);
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [role,         setRole]         = useState('AWS Learner');
  const [saved,        setSaved]        = useState(false);
  const [authUserId,   setAuthUserId]   = useState<string | null>(null);
  const [theme,        setTheme]        = useState<AppThemePrefs>(DEFAULT_THEME_PREFS);
  const [timezone,     setTimezone]     = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [platformName, setPlatformName] = useState('Neon Aurora');
  const [confirmReset, setConfirmReset] = useState(false);
  const { isPro, unlockedCourses } = useSubscription();

  useEffect(() => {
    setResults(getLocalResults());
    setRole(localStorage.getItem('profile-role') || 'AWS Learner');

    try {
      const raw = localStorage.getItem('katalyst-theme');
      const prefs = raw ? normalizeThemePrefs(JSON.parse(raw)) : DEFAULT_THEME_PREFS;
      setTheme(prefs);
      setTimezone(prefs.timezone);
      if (!prefs.usePlatform) applyThemePrefs(prefs);
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem('katalyst-platform-theme-cache');
      const t = normalizePlatformTheme(raw ? JSON.parse(raw) : null);
      const preset = PLATFORM_THEME_PRESETS.find((p) => p.id === t.presetId);
      if (preset) setPlatformName(preset.label);
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
    const nextTheme = { ...theme, timezone };
    localStorage.setItem('katalyst-theme', JSON.stringify(nextTheme));
    if (!nextTheme.usePlatform) applyThemePrefs(nextTheme);
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify({ timezone }));
    // Sync name + email to Supabase auth so it's persisted across devices
    await supabase.auth.updateUser({ data: { name }, email: email || undefined });
    if (authUserId) await saveUserProfile(authUserId, { name, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  function updateTheme(patch: Partial<AppThemePrefs>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    if (!next.usePlatform) applyThemePrefs(next); // live preview
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
                  <stop offset="0%" stopColor="var(--gradient-from)" />
                  <stop offset="60%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--gradient-to)" />
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
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Theme Mode</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => updateTheme({ usePlatform: true })}
                className="btn"
                style={{
                  flex: 1,
                  borderColor: theme.usePlatform ? 'var(--primary)' : 'var(--border)',
                  background: theme.usePlatform ? 'var(--primary-light)' : 'var(--bg)',
                  color: 'var(--text)',
                }}
              >
                Use Platform ({platformName})
              </button>
              <button
                onClick={() => updateTheme({ usePlatform: false })}
                className="btn"
                style={{
                  flex: 1,
                  borderColor: !theme.usePlatform ? 'var(--primary)' : 'var(--border)',
                  background: !theme.usePlatform ? 'var(--primary-light)' : 'var(--bg)',
                  color: 'var(--text)',
                }}
              >
                Custom
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              Platform theme is admin default; choose Custom to override on this device.
            </div>
          </div>

          {!theme.usePlatform && (
            <>
              <div className="form-field" style={{ marginBottom: 16 }}>
                <label className="form-label">Theme Pack</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginTop: 6 }}>
                  {THEME_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      title={pack.label}
                      onClick={() => updateTheme({ themeId: pack.id })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 12,
                        border: `1.5px solid ${theme.themeId === pack.id ? pack.light.primary : 'var(--border)'}`,
                        background: theme.themeId === pack.id ? `${pack.light.primary}18` : 'var(--bg)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{pack.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{pack.label}</span>
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: pack.light.gradientFrom }} />
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: pack.light.gradientTo }} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

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

                <div className="form-field">
                  <label className="form-label">Font Size</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {FONT_SIZES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => updateTheme({ fontSize: s.value })}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 'var(--radius)',
                          border: `1.5px solid ${theme.fontSize === s.value ? 'var(--primary)' : 'var(--border)'}`,
                          background: theme.fontSize === s.value ? 'var(--primary-light)' : 'var(--bg)',
                          color: theme.fontSize === s.value ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {s.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-field">
            <label className="form-label">Timezone — used for daily activity tracker</label>
            <select
              className="goal-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Auto-detected: <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>
            </div>
          </div>
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
