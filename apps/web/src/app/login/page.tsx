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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#00152D' }}>
      <div style={{ width: '100%', maxWidth: 1180, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24 }}>
        <section className="dc-hero" style={{ padding: 36, minHeight: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
            <div style={{ width: 52, height: 52, borderRadius: 18, background: 'linear-gradient(135deg, var(--gradient-from), var(--gradient-to))', display: 'grid', placeItems: 'center', color: '#00152D', fontWeight: 800 }}>K</div>
            <div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Katalyst</div>
              <div style={{ color: 'var(--text-secondary)' }}>Skill system for builders</div>
            </div>
          </div>

          <div style={{ maxWidth: 620, marginTop: 80 }}>
            <div className="dc-chip">Katalyst design system</div>
            <h1 style={{ margin: '22px 0 14px', fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 0.96, color: '#fff' }}>{copy.authHeadline}</h1>
            <p style={{ margin: 0, fontSize: 22, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{copy.authSubheadline}</p>
            <div style={{ marginTop: 34, display: 'grid', gap: 12 }}>
              {[
                'Richer dark dashboard theme across web and mobile',
                'Scrollable course rails and editorial resources',
                'Admin-controlled copy, colors, widgets, and layout counts',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dc-card" style={{ padding: 34, alignSelf: 'center' }}>
          {accountDeleted && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(40,199,111,0.12)', border: '1px solid rgba(40,199,111,0.3)', color: '#28C76F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>Your account has been deleted. All data has been permanently removed.</span>
              <button
                type="button"
                onClick={() => setAccountDeleted(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#28C76F', fontWeight: 700, fontSize: 16 }}
              >
                ×
              </button>
            </div>
          )}
          <div className="dc-chip">Log in</div>
          <h2 style={{ margin: '18px 0 8px', fontSize: 34, fontWeight: 700, color: 'var(--text)' }}>Welcome back</h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>Sign in to continue your learning path, streaks, and certification practice.</p>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Email</div>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-field-input" required placeholder="you@example.com" />
            </label>
            <label>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Password</span>
                <Link href="/reset-password" style={{ color: 'var(--primary-text)', fontSize: 13 }}>Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="admin-field-input" required placeholder="••••••••" />
            </label>

            {error && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.24)', color: '#e9ddff' }}>{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading} style={{ minHeight: 52 }}>
              {loading ? 'Verifying…' : 'Get back in'}
            </button>
          </form>

          <p style={{ marginTop: 24, color: 'var(--text-secondary)' }}>
            Need an account? <Link href="/signup" style={{ color: 'var(--primary-text)', fontWeight: 700 }}>Create one</Link>
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
