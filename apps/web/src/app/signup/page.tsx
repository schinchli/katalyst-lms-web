'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { DEFAULT_PLATFORM_EXPERIENCE, normalizePlatformExperience } from '@/lib/platformExperience';

type SignupStep = 'form' | 'confirm';

export default function SignupPage() {
  const router = useRouter();
  const { execute: recaptcha } = useRecaptcha();
  const [step, setStep] = useState<SignupStep>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState(DEFAULT_PLATFORM_EXPERIENCE.copy);

  useEffect(() => {
    fetch('/api/platform-config')
      .then((res) => res.json())
      .then((body: { config?: unknown }) => setCopy(normalizePlatformExperience(body.config).copy))
      .catch(() => {});
  }, []);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 12) return setError('Password must be at least 12 characters.');
    if (!/[A-Z]/.test(password)) return setError('Password must contain at least one uppercase letter.');
    if (!/[a-z]/.test(password)) return setError('Password must contain at least one lowercase letter.');
    if (!/[0-9]/.test(password)) return setError('Password must contain at least one number.');
    if (!/[^A-Za-z0-9]/.test(password)) return setError('Password must contain at least one special character.');

    setLoading(true);

    try {
      const token = await recaptcha('signup');
      if (token) {
        const res = await fetch('/api/recaptcha/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'signup' }),
        });
        const check = await res.json() as { ok: boolean };
        if (!check.ok) {
          setError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch {
      // best-effort
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split('@')[0] },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      return;
    }

    setStep('confirm');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#00152D' }}>
      <div style={{ width: '100%', maxWidth: 1180, display: 'grid', gridTemplateColumns: '1fr 0.92fr', gap: 24 }}>
        <section className="dc-hero" style={{ padding: 36, minHeight: 720 }}>
          <div className="dc-chip">Start your path</div>
          <h1 style={{ margin: '22px 0 14px', fontSize: 'clamp(48px, 7vw, 78px)', lineHeight: 0.95, color: '#fff' }}>{copy.authHeadline}</h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: 22, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{copy.authSubheadline}</p>

          <div style={{ marginTop: 40, display: 'grid', gap: 16 }}>
            {[
              'Practice cards and course rails designed for momentum',
              'Admin-managed content, theme, and screen layout controls',
              'Cleaner premium gating and stronger social proof sections',
            ].map((item) => (
              <div key={item} className="dc-card" style={{ padding: 18, background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="dc-card" style={{ padding: 34, alignSelf: 'center' }}>
          {step === 'confirm' ? (
            <div style={{ textAlign: 'center' }}>
              <div className="dc-chip">Check your inbox</div>
              <h2 style={{ margin: '18px 0 10px', fontSize: 34, fontWeight: 700 }}>Confirm your email</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>. Open it, then return here to continue into the dashboard.
              </p>
              <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: 24, textDecoration: 'none' }}>
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="dc-chip">Create account</div>
              <h2 style={{ margin: '18px 0 10px', fontSize: 34, fontWeight: 700 }}>Join the platform</h2>
              <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Create your account to unlock the redesigned home, course rails, growth dashboard, and editorial learning flow.
              </p>

              <form onSubmit={handleSignup} style={{ display: 'grid', gap: 16 }}>
                <label>
                  <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Full name</div>
                  <input value={name} onChange={(event) => setName(event.target.value)} className="admin-field-input" placeholder="Jane Smith" />
                </label>
                <label>
                  <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Email</div>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="admin-field-input" required placeholder="you@example.com" />
                </label>
                <label>
                  <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Password</div>
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="admin-field-input" required placeholder="12+ chars, upper/lower/number/symbol" />
                </label>

                {error && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(139,92,246,0.16)', border: '1px solid rgba(139,92,246,0.24)', color: '#e9ddff' }}>{error}</div>}

                <button type="submit" className="btn-primary" disabled={loading} style={{ minHeight: 52 }}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p style={{ marginTop: 24, color: 'var(--text-secondary)' }}>
                Already have an account? <Link href="/login" style={{ color: 'var(--primary-text)', fontWeight: 700 }}>Sign in</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
