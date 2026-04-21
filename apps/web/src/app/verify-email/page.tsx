'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function VerifyEmailContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const email       = params.get('email') ?? '';

  const [code,     setCode]     = useState(['', '', '', '', '', '']);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resent,   setResent]   = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...code];
    text.split('').forEach((d, i) => { next[i] = d; });
    setCode(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    e.preventDefault();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.join('');
    if (token.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    if (!email) { setError('Email address missing. Please sign up again.'); return; }

    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    setLoading(false);

    if (err) {
      setError(err.message.includes('expired') || err.message.includes('invalid')
        ? 'Invalid or expired code. Request a new one below.'
        : err.message);
      return;
    }

    router.push('/dashboard');
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (err) { setError(err.message); return; }
    setResent(true);
    setCode(['', '', '', '', '', '']);
    setTimeout(() => setResent(false), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div
        style={{ flex: 1, display: 'none', background: 'linear-gradient(135deg, #2F3349 0%, #25293C 100%)', position: 'relative', overflow: 'hidden' }}
        className="auth-cover-panel"
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 40%, rgba(115,103,240,0.22) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(115,103,240,0.08)', border: '1px solid rgba(115,103,240,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '18%', left: '8%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(40,199,111,0.06)', border: '1px solid rgba(40,199,111,0.12)' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '48px 52px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>LearnKloud</div>
          </div>
          <h1 style={{ margin: '0 0 18px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, color: '#fff' }}>
            Verify your email 🔐
          </h1>
          <p style={{ margin: '0 0 48px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            We sent a 6-digit code to confirm your identity and secure your account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Check your inbox or spam folder', 'Code expires in 60 minutes', 'Request a new code any time'].map(item => (
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

      {/* Right panel */}
      <div
        style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: 'var(--surface)' }}
        className="auth-form-panel"
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="auth-mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>K</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>LearnKloud</div>
          </div>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(115,103,240,0.12)', border: '2px solid rgba(115,103,240,0.25)', display: 'grid', placeItems: 'center', marginBottom: 24 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="2,4 12,13 22,4"/>
            </svg>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Check your email</h4>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We sent a 6-digit verification code to
          </p>
          <p style={{ margin: '0 0 28px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {email || 'your email address'}
          </p>

          {resent && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(40,199,111,0.1)', border: '1px solid rgba(40,199,111,0.25)', color: 'var(--success)', fontSize: 13 }}>
              New code sent — check your inbox.
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Enter verification code</div>
              <div style={{ display: 'flex', gap: 10 }} onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{
                      width: 52,
                      height: 56,
                      textAlign: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      borderRadius: 12,
                      border: `2px solid ${digit ? 'var(--primary)' : 'var(--border, #DBDADE)'}`,
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                      caretColor: 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(234,84,85,0.1)', border: '1px solid rgba(234,84,85,0.25)', color: 'var(--error)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading || code.join('').length !== 6} style={{ minHeight: 48, fontSize: 15 }}>
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            {"Didn't receive the code? "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 14, padding: 0 }}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </div>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Wrong email?{' '}
            <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up again</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
