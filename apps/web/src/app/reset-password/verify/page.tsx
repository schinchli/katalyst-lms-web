'use client';
/**
 * /reset-password/verify
 *
 * Step 2 of the password-reset flow. Supabase emails a 6-digit recovery OTP
 * to the user; this page accepts the email + OTP + new password, calls
 * supabase.auth.verifyOtp({ type: 'recovery' }) to redeem the code (which
 * opens a session), then supabase.auth.updateUser({ password }) to set the
 * new credential. Redirects to /login?reset=success on success.
 *
 * Pre-fills email from ?email= query param (passed by /reset-password after
 * the OTP is sent).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function isValidPassword(p: string): string | null {
  if (p.length < 12)            return 'Password must be at least 12 characters.';
  if (!/[A-Z]/.test(p))         return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(p))         return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(p))         return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(p))  return 'Password must contain at least one special character.';
  return null;
}

export default function ResetPasswordVerifyPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,     setEmail]     = useState(() => searchParams.get('email') ?? '');
  const [otp,       setOtp]       = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    const q = searchParams.get('email');
    if (q && q !== email) setEmail(q);
  }, [searchParams, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    const pwError = isValidPassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setLoading(true);

    // 1. Redeem the OTP — type: 'recovery' (not 'signup'). On success Supabase
    //    issues a session so the next updateUser call is authorized.
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type:  'recovery',
    });
    if (verifyErr) {
      setLoading(false);
      setError(verifyErr.message || 'Invalid or expired code.');
      return;
    }

    // 2. Set the new password on the now-authenticated session.
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message || 'Failed to update password.');
      return;
    }

    router.push('/login?reset=success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* Left panel — decorative brand area */}
      <div
        style={{ flex: 1, display: 'none', background: 'linear-gradient(135deg, #2F3349 0%, #25293C 100%)', position: 'relative', overflow: 'hidden' }}
        className="auth-cover-panel"
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(115,103,240,0.22) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>LearnKloud</div>
          </div>
          <h1 style={{ margin: '0 0 18px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#fff' }}>
            Enter your reset code 🔢
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            Paste the 6-digit code from your email and set a new password.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Code expires in 30 minutes',
              'Minimum 12 characters, mixed case + symbol',
              'Single-use — re-request a new code if needed',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
          </div>

          <h4 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
            Reset your password
          </h4>
          <p style={{ margin: '0 0 28px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
            Paste the 6-digit code we sent to your inbox, then choose a new password.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="rpv-email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Email</label>
              <input
                id="rpv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card-bg, var(--bg))',
                  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="rpv-otp" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>6-digit code</label>
              <input
                id="rpv-otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                autoComplete="one-time-code"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card-bg, var(--bg))',
                  color: 'var(--text)', fontSize: 18, fontFamily: 'inherit',
                  letterSpacing: '0.4em', textAlign: 'center', fontWeight: 600,
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="rpv-pw" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>New password</label>
              <input
                id="rpv-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 12 characters"
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card-bg, var(--bg))',
                  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label htmlFor="rpv-pw2" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Confirm new password</label>
              <input
                id="rpv-pw2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card-bg, var(--bg))',
                  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(231,76,60,0.08)',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 8, padding: '10px 14px', color: '#c0392b',
                fontSize: 13, marginBottom: 14,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating…' : 'Reset password'}
            </button>
          </form>

          <p style={{ marginTop: 22, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Didn&apos;t get a code? <Link href="/reset-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Request a new one</Link>
          </p>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
