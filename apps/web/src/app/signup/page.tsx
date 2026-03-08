'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';

type SignupStep = 'form' | 'confirm';

export default function SignupPage() {
  const router = useRouter();
  const { execute: recaptcha } = useRecaptcha();
  const [step,     setStep]     = useState<SignupStep>('form');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    // ── reCAPTCHA v3 — best-effort, never blocks the user ────────────────
    try {
      const token = await recaptcha('signup');
      if (token) {
        const res   = await fetch('/api/recaptcha/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token, action: 'signup' }),
        });
        const check = await res.json() as { ok: boolean };
        if (!check.ok) {
          setError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
    } catch { /* reCAPTCHA unavailable — continue; rate limiter protects */ }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split('@')[0] },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    // If session exists, email confirmation is disabled — go straight to dashboard
    if (data.session) {
      router.push('/dashboard');
      return;
    }

    // Otherwise show "check your email" screen
    setStep('confirm');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: "'Public Sans', sans-serif",
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(47,43,61,0.12)',
        border: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #7367F0 0%, #9e95f5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 20,
          }}>K</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Katalyst</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supercharge Your Career. Learn Skills Faster.</div>
          </div>
        </div>

        {step === 'confirm' ? (
          /* ── Email confirmation screen ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Check your email</h1>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Click the link to activate your account, then sign in below.
            </p>
            <Link
              href="/login"
              style={{
                display: 'block', padding: '11px', borderRadius: 8, textAlign: 'center',
                background: '#7367F0', color: '#fff', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          /* ── Sign up form ── */
          <>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Create account</h1>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)' }}>Start your AWS prep journey today</p>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  style={inputStyle}
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: '#FF4C5114', border: '1px solid #FF4C5140',
                  color: '#FF4C51', fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px', borderRadius: 8, marginTop: 4,
                  background: loading ? 'var(--primary-light)' : '#7367F0',
                  color: loading ? 'var(--primary-text)' : '#fff',
                  fontSize: 14, fontWeight: 600, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#7367F0', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
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
