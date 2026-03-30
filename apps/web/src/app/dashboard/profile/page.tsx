'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import type { QuizResult, ReferralInfo } from '@/types';
import { deleteAllQuizResults, getQuizResults, getUserProfile, saveUserProfile } from '@/lib/db';
import { PLATFORM_THEME_PRESETS, normalizePlatformTheme } from '@/lib/platformTheme';
import {
  THEME_PACKS,
  FONT_OPTIONS,
  FONT_SIZES,
  DEFAULT_THEME_PREFS,
  normalizeThemePrefs,
  applyThemePrefs,
  applyFontSize,
  type AppThemePrefs,
} from '@/lib/themePacks';
import { fetchUserTheme, saveUserTheme } from '@/lib/userTheme';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';

function getLocalResults(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('quiz-results') || '[]') as QuizResult[];
  } catch {
    return [];
  }
}

function score(result: QuizResult) {
  return Math.round((result.score / result.totalQuestions) * 100);
}

export default function ProfilePage() {
  const router = useRouter();
  const { config } = usePlatformExperience();
  const { isPro } = useSubscription();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Focused learner');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<AppThemePrefs>(DEFAULT_THEME_PREFS);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [platformThemeName, setPlatformThemeName] = useState('Deep Navy');
  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setResults(getLocalResults());

    try {
      const raw = localStorage.getItem('katalyst-theme');
      const next = raw ? normalizeThemePrefs(JSON.parse(raw)) : DEFAULT_THEME_PREFS;
      setTheme(next);
      if (!next.usePlatform) applyThemePrefs(next);
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem('katalyst-platform-theme-cache');
      const presetId = normalizePlatformTheme(raw ? JSON.parse(raw) : null).presetId;
      setPlatformThemeName(PLATFORM_THEME_PRESETS.find((item) => item.id === presetId)?.label ?? 'Deep Navy');
    } catch {
      // ignore
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthUserId(user.id);

      // Fetch referral info
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.access_token) return;
        try {
          const res = await fetch('/api/referral', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const body = await res.json() as { ok: boolean; code?: string; referredCount?: number; coinsEarned?: number };
          if (body.ok && body.code) {
            setReferral({ code: body.code, referredCount: body.referredCount ?? 0, coinsEarned: body.coinsEarned ?? 0 });
          }
        } catch { /* non-fatal */ }
      });
      setEmail(user.email || '');
      const profile = await getUserProfile(user.id);
      setName(profile?.name || (user.user_metadata?.name as string | undefined) || localStorage.getItem('profile-name') || 'Learner');
      setRole(profile?.role || localStorage.getItem('profile-role') || 'Focused learner');

      const remoteResults = await getQuizResults(user.id);
      if (remoteResults.length > 0) setResults(remoteResults);

      fetchUserTheme(user.id)
        .then((prefs) => {
          setTheme(prefs);
          if (!prefs.usePlatform) applyThemePrefs(prefs);
        })
        .catch(() => {});
    });
  }, []);

  const completedCount = useMemo(() => new Set(results.map((item) => item.quizId)).size, [results]);
  const average = results.length ? Math.round(results.reduce((sum, item) => sum + score(item), 0) / results.length) : 0;
  const studyHours = Math.max(0, Math.floor(results.reduce((sum, item) => sum + item.timeTaken, 0) / 3600));

  const handleSave = async () => {
    localStorage.setItem('profile-name', name);
    localStorage.setItem('profile-email', email);
    localStorage.setItem('profile-role', role);
    localStorage.setItem('katalyst-theme', JSON.stringify(theme));

    applyFontSize(theme.fontSize);
    if (!theme.usePlatform) applyThemePrefs(theme);

    await supabase.auth.updateUser({ data: { name }, email: email || undefined });
    if (authUserId) {
      await saveUserProfile(authUserId, { name, role });
      await saveUserTheme(authUserId, theme);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleShareReferral = async () => {
    if (!referral) return;
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referral.code}`;
    const text = `Join me on Katalyst for AWS & GenAI certification prep! Use my referral code ${referral.code} to get started: ${link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text, url: link }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(link).catch(() => {});
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referral) return;
    await navigator.clipboard.writeText(referral.code).catch(() => {});
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const handleResetHistory = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    localStorage.removeItem('quiz-results');
    setResults([]);
    if (authUserId) await deleteAllQuizResults(authUserId).catch(() => {});
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setDeleteError('Session expired. Please log in again.');
        setDeleteLoading(false);
        return;
      }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json() as { ok: boolean; error?: string };
      if (!body.ok) {
        setDeleteError(body.error ?? 'Deletion failed. Please try again.');
        setDeleteLoading(false);
        return;
      }
      // Clear local data and sign out before redirect
      localStorage.clear();
      await supabase.auth.signOut();
      router.push('/login?deleted=1');
    } catch {
      setDeleteError('An unexpected error occurred. Please try again.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <div className="dc-grid" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center' }}>
          <div style={{ width: 132, height: 132, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))', display: 'grid', placeItems: 'center', fontSize: 46, fontWeight: 700 }}>
            {(name || email || 'L').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="dc-chip">{isPro ? 'Premium member' : 'Free learner'}</div>
            <h1 style={{ margin: '16px 0 10px', fontSize: 'clamp(32px, 4.2vw, 50px)', lineHeight: 1.03 }}>{name || 'Learner'}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: 18 }}>{email || 'No email set'}</div>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{role}</div>
          </div>
          <div className="dc-card" style={{ padding: 20, minWidth: 240 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Current platform theme</div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 700 }}>{platformThemeName}</div>
            <div style={{ marginTop: 10, color: 'var(--text-secondary)' }}>End users can override this with their own theme pack below.</div>
          </div>
        </div>

        <div className="dc-kpi-grid" style={{ marginTop: 24 }}>
          {[
            { label: 'Courses completed', value: String(completedCount), tone: 'var(--text)' },
            { label: 'Average score', value: `${average}%`, tone: 'var(--primary)' },
            { label: 'Study hours', value: `${studyHours}`, tone: '#ffd84d' },
            { label: 'Course library', value: String(quizzes.length), tone: 'var(--platform-premium-accent)' },
          ].map((item) => (
            <div key={item.label} className="dc-card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{item.label}</div>
              <div style={{ marginTop: 10, fontSize: 34, fontWeight: 700, color: item.tone }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {config.widgets.showProfileOffer && (
        <section className="dc-card" style={{ padding: 26 }}>
          <div className="dc-grid" style={{ gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
            <div>
              <h2 className="dc-section-title" style={{ fontSize: 34 }}>{config.copy.profileOfferTitle}</h2>
              <p className="dc-section-subtitle" style={{ color: 'var(--platform-profile-offer-accent)', fontWeight: 700 }}>{config.copy.profileOfferSubtitle}</p>
            </div>
            <button className="btn-primary">{isPro ? 'Manage plan' : 'Upgrade now'}</button>
          </div>
        </section>
      )}

      {referral && (
        <section className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 22, marginBottom: 4 }}>Refer a Friend</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Share your code and earn coins when friends sign up.
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              readOnly
              value={referral.code}
              className="admin-field-input"
              style={{ fontFamily: 'monospace', letterSpacing: '0.12em', fontWeight: 700, maxWidth: 180, cursor: 'text' }}
            />
            <button className="settings-btn-ghost" aria-label="Copy referral code" onClick={handleCopyReferralCode}>
              {referralCopied ? 'Copied!' : 'Copy code'}
            </button>
            <button className="btn-primary" aria-label="Share referral link" onClick={handleShareReferral}>
              Share link
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div className="dc-card" style={{ padding: '12px 20px', display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{referral.referredCount}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Friends referred</div>
            </div>
            <div className="dc-card" style={{ padding: '12px 20px', display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#ffd84d' }}>{referral.coinsEarned} ⚡</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Coins earned</div>
            </div>
          </div>
        </section>
      )}

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Profile details</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Full name</div>
              <input value={name} onChange={(event) => setName(event.target.value)} className="admin-field-input" />
            </label>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Email</div>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="admin-field-input" />
            </label>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Role / headline</div>
              <input value={role} onChange={(event) => setRole(event.target.value)} className="admin-field-input" />
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleSave}>{saved ? 'Saved' : 'Save profile'}</button>
              <button className="settings-btn-ghost" onClick={handleResetHistory}>{confirmReset ? 'Confirm reset history' : 'Reset quiz history'}</button>
            </div>
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Appearance</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Theme pack</div>
              <select value={theme.themeId} onChange={(event) => setTheme((prev) => ({ ...prev, themeId: event.target.value, usePlatform: false }))} className="admin-field-input">
                {THEME_PACKS.map((pack) => <option key={pack.id} value={pack.id}>{pack.label}</option>)}
              </select>
            </label>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Heading font</div>
              <select value={theme.fontFamily} onChange={(event) => setTheme((prev) => ({ ...prev, fontFamily: event.target.value, usePlatform: false }))} className="admin-field-input">
                {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <div>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Text size</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {FONT_SIZES.map((size) => {
                  const active = theme.fontSize === size.value;
                  return (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, fontSize: size.value, usePlatform: false }))}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--primary-light)' : 'var(--surface)',
                        color: active ? 'var(--primary-text)' : 'var(--text)',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontSize: size.value === '14' ? 13 : size.value === '16' ? 15 : 18,
                      }}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                Medium (16px) follows W3C / WCAG body text guidelines
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={theme.usePlatform} onChange={(event) => setTheme((prev) => ({ ...prev, usePlatform: event.target.checked }))} />
              Use platform theme by default
            </label>
            <button
              className="settings-btn-ghost"
              onClick={() => {
                localStorage.setItem('katalyst-theme', JSON.stringify(theme));
                applyFontSize(theme.fontSize);
                if (!theme.usePlatform) applyThemePrefs(theme);
              }}
            >
              Preview locally
            </button>
          </div>
        </div>
      </section>

      {/* ── Danger Zone ────────────────────────────────────────────────────── */}
      <section className="dc-card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 18 }}>
        <h2 className="dc-section-title" style={{ fontSize: 22, color: '#EF4444' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Deleting your account is permanent and cannot be undone. All your quiz history, progress, and profile data will be erased immediately.
        </p>
        {!showDeleteModal ? (
          <button
            className="settings-btn-ghost"
            style={{ borderColor: '#EF4444', color: '#EF4444' }}
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(''); }}
          >
            Delete Account
          </button>
        ) : (
          <div style={{ display: 'grid', gap: 14, maxWidth: 460 }}>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 14, lineHeight: 1.6 }}>
              This action is irreversible. Type <strong>DELETE</strong> below to confirm you want to permanently delete your account.
            </div>
            <input
              className="admin-field-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              style={{ borderColor: deleteConfirmText === 'DELETE' ? '#EF4444' : undefined }}
            />
            {deleteError && (
              <div style={{ color: '#EF4444', fontSize: 13 }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                style={{ background: '#EF4444', borderColor: '#EF4444' }}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading ? 'Deleting…' : 'Permanently delete my account'}
              </button>
              <button
                className="settings-btn-ghost"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeleteError(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
