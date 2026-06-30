'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';

type BattleType = 'random' | 'one_vs_one' | 'group';

const MODES: { type: BattleType; title: string; description: string; icon: string; players: string; accent: string }[] = [
  { type: 'random', title: '1v1 Random Battle', description: 'Get matched with a random opponent instantly.', icon: '⚡', players: '2 players', accent: 'var(--warning)' },
  { type: 'one_vs_one', title: '1v1 Challenge', description: 'Challenge a friend with a private invite code.', icon: '⚔️', players: '2 players', accent: 'var(--error)' },
  { type: 'group', title: 'Group Battle', description: 'Compete with up to 8 players at once.', icon: '🏟️', players: '2–8 players', accent: 'var(--primary)' },
];

export default function BattlesPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Quiz Battles</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Go head-to-head on a timed quiz. Pick a mode to start.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {MODES.map((m) => (
          <Link
            key={m.type}
            href={`/dashboard/battle-lobby?type=${m.type}`}
            className="vx-card"
            style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ height: 4, background: m.accent }} />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="vx-avatar-sm vx-avatar-primary" style={{ borderRadius: 12, fontSize: 24, flexShrink: 0 }}>{m.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.players}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{m.description}</p>
              <span style={{ marginTop: 'auto', fontSize: 13, fontWeight: 600, color: m.accent }}>Start →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="vx-card" style={{ marginTop: 20, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Quiz battles run on a timed format. Stay focused and answer as fast as you can!
        </p>
      </div>
    </div>
  );
}
