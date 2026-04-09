'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizzes } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import type { QuizResult } from '@/types';
import { deleteAllQuizResults, getQuizResults, getUserProfile, saveUserProfile } from '@/lib/db';
import {
  DEFAULT_THEME_PREFS,
  normalizeThemePrefs,
  applyThemePrefs,
  type AppThemePrefs,
} from '@/lib/themePacks';
import { fetchUserTheme } from '@/lib/userTheme';
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
  useManagedQuizContentVersion();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Focused learner');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<AppThemePrefs>(DEFAULT_THEME_PREFS);
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

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthUserId(user.id);
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

    await supabase.auth.updateUser({ data: { name }, email: email || undefined });
    if (authUserId) {
      await saveUserProfile(authUserId, { name, role });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
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
      try { localStorage.clear(); } catch { /* quota or private-mode edge case */ }
      await supabase.auth.signOut();
      router.push('/login?deleted=1');
    } catch {
      setDeleteError('An unexpected error occurred. Please try again.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-content">
      {/* User card — Vuexy pattern */}
      <div className="vx-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--primary-light)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
            {(name || email || 'L').charAt(0).toUpperCase()}
          </div>
          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{name || 'Learner'}</h5>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{email || 'No email set'}</div>
            <span style={{ background: isPro ? 'rgba(40,199,111,0.16)' : 'var(--primary-light)', color: isPro ? 'var(--success)' : 'var(--primary)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {isPro ? 'Premium' : 'Free plan'}
            </span>
          </div>
        </div>

        {/* Stats row — Vuexy avatar+icon pattern */}
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          {[
            {
              label: 'Courses completed', value: String(completedCount), avatarClass: 'vx-avatar-primary',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
            },
            {
              label: 'Average score', value: `${average}%`, avatarClass: 'vx-avatar-info',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
            },
            {
              label: 'Study hours', value: `${studyHours}h`, avatarClass: 'vx-avatar-warning',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            },
            {
              label: 'Course library', value: String(quizzes.length), avatarClass: 'vx-avatar-success',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
            },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className={`vx-avatar ${item.avatarClass}`}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {config.widgets.showProfileOffer && (
        <section className="vx-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h5 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{config.copy.profileOfferTitle}</h5>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{config.copy.profileOfferSubtitle}</p>
            </div>
            <button className="btn-primary">{isPro ? 'Manage plan' : 'Upgrade now'}</button>
          </div>
        </section>
      )}

      {/* Profile details — full width */}
      <div className="vx-card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 18px' }}>Profile details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Full name</div>
            <input value={name} onChange={(event) => setName(event.target.value)} className="admin-field-input" />
          </label>
          <label>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Email</div>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="admin-field-input" />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Role / headline</div>
            <input value={role} onChange={(event) => setRole(event.target.value)} className="admin-field-input" />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleSave}>{saved ? 'Saved ✓' : 'Save profile'}</button>
            <button className="settings-btn-ghost" onClick={handleResetHistory}>{confirmReset ? 'Confirm reset history' : 'Reset quiz history'}</button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <section className="vx-card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.3)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)', margin: '0 0 8px' }}>Danger Zone</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Deleting your account is permanent and cannot be undone. All your quiz history, progress, and profile data will be erased immediately.
        </p>
        {!showDeleteModal ? (
          <button
            className="settings-btn-ghost"
            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(''); }}
          >
            Delete Account
          </button>
        ) : (
          <div style={{ display: 'grid', gap: 14, maxWidth: 460 }}>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', fontSize: 14, lineHeight: 1.6 }}>
              This action is irreversible. Type <strong>DELETE</strong> below to confirm you want to permanently delete your account.
            </div>
            <input
              className="admin-field-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              style={{ borderColor: deleteConfirmText === 'DELETE' ? 'var(--error)' : undefined }}
            />
            {deleteError && (
              <div style={{ color: 'var(--error)', fontSize: 13 }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                style={{ background: 'var(--error)', borderColor: 'var(--error)' }}
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
