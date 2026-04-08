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
      // reCAPTCHA is best-effort here
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
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="dc-hero auth-hero">
          <div className="auth-brand">
            <div className="sidebar-logo-icon">K</div>
            <div>
              <div className="auth-brand-name">Katalyst</div>
              <div style={{ color: 'var(--text-secondary)' }}>Skill system for builders</div>
            </div>
          </div>

          <div className="auth-hero-body">
            <div className="dc-chip">Katalyst design system</div>
            <h1 className="auth-headline">{copy.authHeadline}</h1>
            <p className="auth-subheadline">{copy.authSubheadline}</p>
            <div className="auth-features">
              {[
                'Richer dark dashboard theme across web and mobile',
                'Scrollable course rails and editorial resources',
                'Admin-controlled copy, colors, widgets, and layout counts',
              ].map((item) => (
                <div key={item} className="auth-feature-item">
                  <span className="auth-feature-dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dc-card auth-card">
          {accountDeleted && (
            <div className="auth-alert auth-alert-success">
              <span>Your account has been deleted. All data has been permanently removed.</span>
              <button type="button" onClick={() => setAccountDeleted(false)} className="auth-alert-close">×</button>
            </div>
          )}
          <div className="dc-chip">Log in</div>
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-subtitle">Sign in to continue your learning path, streaks, and certification practice.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              <div className="auth-label">Email</div>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-field-input" required placeholder="you@example.com" />
            </label>
            <label>
              <div className="auth-label-row">
                <span className="auth-label">Password</span>
                <Link href="/reset-password" className="auth-forgot">Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="admin-field-input" required placeholder="••••••••" />
            </label>

            {error && <div className="auth-alert auth-alert-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading} style={{ minHeight: 52 }} aria-label="Sign in">
              {loading ? 'Verifying…' : 'Get back in'}
            </button>
          </form>

          <p className="auth-footer-text">
            Need an account? <Link href="/signup" className="auth-link">Create one</Link>
          </p>
        </section>
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
