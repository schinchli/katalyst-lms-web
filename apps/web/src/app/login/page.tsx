'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { DEFAULT_PLATFORM_EXPERIENCE, normalizePlatformExperience } from '@/lib/platformExperience';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { execute: recaptcha } = useRecaptcha();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState(DEFAULT_PLATFORM_EXPERIENCE.copy);
  const [accountDeleted, setAccountDeleted] = useState(false);

  useEffect(() => {
    if (searchParams.get('deleted') === '1') {
      setAccountDeleted(true);
    }
    fetch('/api/platform-config')
      .then((res) => res.json())
      .then((body: { config?: unknown }) => setCopy(normalizePlatformExperience(body.config).copy))
      .catch(() => {});
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await recaptcha('login');
      if (token) {
        const res = await fetch('/api/recaptcha/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'login' }),
        });
        const check = await res.json() as { ok: boolean };
        if (!check.ok) {
          setError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch {
      // reCAPTCHA is best-effort
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session?.user) {
      const user = data.session.user;
      fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: user.id,
          email: user.email ?? '',
          name: (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? '',
          accessToken: data.session.access_token,
          createdAt: user.created_at,
          quizResults: [],
        }),
      }).catch(() => {});
    }

    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel — decorative brand area (hidden on mobile) */}
      <div style={{ flex: 1, display: 'none', background: 'linear-gradient(135deg, #2F3349 0%, #25293C 100%)', position: 'relative', overflow: 'hidden' }}
        className="auth-cover-panel">
        {/* Background shapes */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 60%, rgba(115,103,240,0.25) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,207,232,0.06)', border: '1px solid rgba(0,207,232,0.12)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>LearnKloud</div>
          </div>

          <h1 style={{ margin: '0 0 18px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#fff' }}>
            {copy.authHeadline}
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            {copy.authSubheadline}
          </p>

          {/* Feature points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'AWS & GenAI certification preparation',
              '400+ practice questions across all domains',
              'Track streaks, scores, and progress',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(115,103,240,0.3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9289FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' }}
        className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo (mobile only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Welcome back! 👋</h4>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Sign in to continue your learning path, streaks, and certification practice.
          </p>

          {accountDeleted && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(40,199,111,0.1)', border: '1px solid rgba(40,199,111,0.25)', color: 'var(--success)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span>Your account has been permanently deleted.</span>
              <button type="button" onClick={() => setAccountDeleted(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Email or Username</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-field-input"
                required
                placeholder="Enter your email"
                autoFocus
              />
            </label>

            <label>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Password</span>
                <Link href="/reset-password" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-field-input"
                required
                placeholder="············"
              />
            </label>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(234,84,85,0.1)', border: '1px solid rgba(234,84,85,0.25)', color: 'var(--error)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, minHeight: 48, fontSize: 15 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            New on our platform?{' '}
            <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
