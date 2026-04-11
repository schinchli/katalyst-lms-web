'use client';

import { useEffect, useState } from 'react';
import { NextStudio } from 'next-sanity/studio';
import { supabase } from '@/lib/supabase';
import config from '../../../../sanity.config';

export default function StudioPage() {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setStatus('denied'); return; }
      try {
        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        setStatus(res.ok ? 'allowed' : 'denied');
      } catch {
        setStatus('denied');
      }
    });
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Public Sans, sans-serif', color: '#4B465C' }}>
        Checking access…
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Public Sans, sans-serif', gap: 16 }}>
        <div style={{ fontSize: 32 }}>🔒</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#4B465C' }}>Admin access required</h2>
        <p style={{ margin: 0, color: '#A5A3AE', fontSize: 14 }}>Sign in with an admin account to access the Katalyst Studio.</p>
        <a href="/dashboard" style={{ marginTop: 8, padding: '10px 20px', background: '#7367F0', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Go to Dashboard
        </a>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
