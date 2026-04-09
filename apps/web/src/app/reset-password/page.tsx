'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function ResetPasswordPage() {
  const { execute: recaptcha } = useRecaptcha();
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setSuccess(true);
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
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '18%', left: '8%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,207,232,0.06)', border: '1px solid rgba(0,207,232,0.12)' }} />
        <div style={{ position: 'absolute', top: '60%', right: '25%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(115,103,240,0.05)', border: '1px solid rgba(115,103,240,0.10)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Katalyst</div>
          </div>

          <h1 style={{ margin: '0 0 18px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#fff' }}>
            Forgot your password? 🔒
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            No worries — enter your email and we&apos;ll send a secure reset link.
          </p>

          {/* Feature points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Secure link sent to your inbox',
              'Link expires in 24 hours for safety',
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
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Katalyst</div>
          </div>

          {success ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(115,103,240,0.12)', border: '2px solid rgba(115,103,240,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
              </div>
              <h4 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Check your inbox</h4>
              <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
                We sent a password reset link to
              </p>
              <p style={{ margin: '0 0 28px', fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{email}</p>
              <Link href="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', minWidth: 160 }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h4 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Forgot Password? 🔒</h4>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <label>
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Email</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-field-input"
                    required
                    placeholder="you@example.com"
                    autoFocus
                  />
                </label>

                {error && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(234,84,85,0.1)', border: '1px solid rgba(234,84,85,0.25)', color: 'var(--error)', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, minHeight: 48, fontSize: 15 }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
