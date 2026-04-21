'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { DEFAULT_PLATFORM_EXPERIENCE, normalizePlatformExperience } from '@/lib/platformExperience';
import { isDisposableEmail } from '@/lib/emailValidation';


export default function SignupPage() {
  const router = useRouter();
  const { execute: recaptcha } = useRecaptcha();
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

    if (isDisposableEmail(email)) return setError('Disposable email addresses are not allowed. Please use your real email.');
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

    // Email already confirmed (e.g. email confirmation disabled in dev) — go straight in
    if (data.session) {
      router.push('/dashboard');
      return;
    }

    // Email confirmation required — send user to OTP entry page
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel — brand/decorative */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #2F3349 0%, #25293C 100%)', position: 'relative', overflow: 'hidden' }}
        className="auth-cover-panel">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(115,103,240,0.22) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '25%', right: '12%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(40,199,111,0.06)', border: '1px solid rgba(40,199,111,0.12)' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'AWS CLF-C02 and GenAI certification tracks',
              'Practice cards designed for momentum',
              'Admin-managed content, theme, and layout',
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

      {/* Right panel — form */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' }}
        className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Create an account 🚀</h4>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Join the platform and start your certification prep journey.
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Full name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="admin-field-input" placeholder="Jane Smith" />
            </label>
            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="admin-field-input" required placeholder="you@example.com" />
            </label>
            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Password</div>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="admin-field-input" required placeholder="12+ chars, upper/lower/number/symbol" />
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Min. 12 characters with upper, lower, number, and symbol.</div>
            </label>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(234,84,85,0.1)', border: '1px solid rgba(234,84,85,0.25)', color: 'var(--error)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, minHeight: 48, fontSize: 15 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
