'use client';
import { useState } from 'react';
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

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== password2) { setError('Passwords do not match.'); return; }

    setLoading(true);

    // ── reCAPTCHA v3 verification ─────────────────────────────────────────
    try {
      const token = await recaptcha('reset_password');
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
    } catch {
      setError('Security check failed. Please try again.');
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/login?reset=success');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: "'Public Sans', sans-serif" }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(47,43,61,0.12)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7367F0 0%, #9e95f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>K</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Katalyst</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supercharge Your Career. Learn Skills Faster.</div>
          </div>
        </div>

        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Set new password</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-secondary)' }}>Must be at least 8 characters.</p>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required placeholder="••••••••" style={inputStyle} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF4C5114', border: '1px solid #FF4C5140', color: '#FF4C51', fontSize: 13 }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ padding: '11px', borderRadius: 8, marginTop: 4, background: loading ? 'var(--primary-light)' : '#7367F0', color: loading ? 'var(--primary-text)' : '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
          Protected by reCAPTCHA —{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>Privacy</a>
          {' & '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>Terms</a>
        </p>
      </div>
    </div>
  );
}
