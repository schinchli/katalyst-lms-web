'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import type { CoinPack } from '@/types';

export default function StorePage() {
  const [packs, setPacks]     = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');

  useEffect(() => {
    fetch('/api/coin-packs')
      .then((r) => r.json())
      .then((body: { ok: boolean; packs?: CoinPack[] }) => {
        if (body.ok) setPacks(body.packs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = (pack: CoinPack) => {
    // TODO: wire to payment gateway once coin crediting is implemented
    setToast(`Purchase flow coming soon — digital goods payment integration in progress for "${pack.label}".`);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ fontSize: 38 }}>🏪</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700 }}>Coin Store</h1>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Buy coins to unlock contests, courses, and more.</div>
          </div>
        </div>
      </section>

      {toast && (
        <div className="dc-card" style={{ padding: '14px 18px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, color: 'var(--primary-text)', fontSize: 14 }}>
          ℹ️ {toast}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '32px 0', textAlign: 'center' }}>Loading packs…</div>
      ) : packs.length === 0 ? (
        <div className="dc-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
          <div>No coin packs available right now. Check back soon!</div>
        </div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
          {packs.map((pack) => (
            <div key={pack.id} className="dc-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
              {pack.popular && (
                <div style={{
                  position: 'absolute', top: -10, right: 14,
                  background: '#FF9F43', color: '#fff',
                  fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 20,
                }}>
                  Popular
                </div>
              )}
              <div style={{ fontSize: 32, textAlign: 'center' }}>⚡</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ffd84d' }}>{pack.coins.toLocaleString()}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>coins</div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, textAlign: 'center', color: 'var(--text)' }}>{pack.label}</div>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                ₹{pack.priceInr.toLocaleString()} / ${pack.priceUsd.toFixed(2)} USD
              </div>
              <button
                className="btn-primary"
                style={{ marginTop: 4 }}
                onClick={() => handleBuy(pack)}
              >
                Buy now
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
