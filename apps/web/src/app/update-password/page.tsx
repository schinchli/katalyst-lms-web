'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { execute: recaptcha } = useRecaptcha();
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) { setError('Password must be at least 12 characters.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter.'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain at least one special character.'); return; }
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setLoading(true);

    // ── reCAPTCHA v3 — best-effort, never blocks the user ────────────────
    try {
      const token = await recaptcha('reset_password');
      if (token) {
        const res   = await fetch('/api/recaptcha/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token, action: 'reset_password' }),
        });
        const check = await res.json() as { ok: boolean };
        if (!check.ok) {
          setError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch { /* reCAPTCHA unavailable — continue; rate limiter protects */ }

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/login?reset=success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel — decorative brand area (hidden on mobile) */}
      <div
        style={{ flex: 1, display: 'none', background: 'linear-gradient(135deg, #2F3349 0%, #25293C 100%)', position: 'relative', overflow: 'hidden' }}
        className="auth-cover-panel"
      >
        {/* Background shapes */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(115,103,240,0.22) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '18%', left: '12%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '22%', right: '8%', width: 170, height: 170, borderRadius: '50%', background: 'rgba(0,207,232,0.06)', border: '1px solid rgba(0,207,232,0.12)' }} />
        <div style={{ position: 'absolute', top: '55%', left: '35%', width: 90, height: 90, borderRadius: '50%', background: 'rgba(115,103,240,0.05)', border: '1px solid rgba(115,103,240,0.10)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>LearnKloud</div>
          </div>

          <h1 style={{ margin: '0 0 18px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#fff' }}>
            Set your new password 🛡️
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            Choose a strong password to keep your account secure.
          </p>

          {/* Feature points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Minimum 12 characters required',
              'Mix of upper, lower, numbers & symbols',
              'reCAPTCHA protected',
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
      <div
        style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' }}
        className="auth-form-panel"
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo (mobile only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Reset Password 🔑</h4>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your new password must be different from previously used passwords.
          </p>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>New Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-field-input"
                required
                placeholder="12+ chars, upper/lower/number/symbol"
              />
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Min. 12 characters with upper, lower, number, and symbol.</div>
            </label>

            <label>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Confirm Password</div>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
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
              {loading ? 'Updating…' : 'Set new password'}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
