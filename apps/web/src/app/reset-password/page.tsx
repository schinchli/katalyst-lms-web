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

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(47,43,61,0.12)',
    border: '1px solid var(--border)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'Public Sans', sans-serif" }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7367F0 0%, #9e95f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>K</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Katalyst</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supercharge Your Career. Learn Skills Faster.</div>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Check your email</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" style={{ color: '#7367F0', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Forgot password?</h1>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)' }}>Enter your email and we&apos;ll send a reset link.</p>

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@example.com" style={inputStyle}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF4C5114', border: '1px solid #FF4C5140', color: '#FF4C51', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{ padding: '11px', borderRadius: 8, marginTop: 4, background: loading ? 'var(--primary-light)' : '#7367F0', color: loading ? 'var(--primary-text)' : '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Verifying…' : 'Send reset link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
              <Link href="/login" style={{ color: '#7367F0', fontWeight: 600, textDecoration: 'none' }}>Back to sign in</Link>
            </p>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
              Protected by reCAPTCHA —{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>Privacy</a>
              {' & '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>Terms</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
