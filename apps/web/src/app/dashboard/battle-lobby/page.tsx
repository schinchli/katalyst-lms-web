'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { quizzes } from '@/data/quizzes';

type BattleType = 'random' | 'one_vs_one' | 'group';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}
function pickRandomFreeQuiz(): string {
  const free = quizzes.filter((q) => !q.isPremium && q.enabled !== false);
  if (free.length === 0) return quizzes[0]?.id ?? '';
  return free[Math.floor(Math.random() * free.length)]?.id ?? '';
}

function BattleLobby() {
  const router = useRouter();
  const params = useSearchParams();
  const battleType = ((params.get('type') as BattleType) ?? 'random');

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string>('');
  const [timedOut, setTimedOut] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const isRandom = battleType === 'random';
  const isGroup = battleType === 'group';

  // Client-only init (avoids SSR hydration mismatch from Math.random).
  useEffect(() => {
    setQuizId(pickRandomFreeQuiz());
    if (battleType !== 'random') setInviteCode(generateInviteCode());
  }, [battleType]);

  // Simulated matchmaking timeout for random battles (mirrors mobile).
  useEffect(() => {
    if (battleType !== 'random') return;
    const t = setTimeout(() => setTimedOut(true), 30_000);
    return () => clearTimeout(t);
  }, [battleType]);

  const quizTitle = quizzes.find((q) => q.id === quizId)?.title ?? quizId;
  const canStart = timedOut || isGroup;
  const accent = timedOut ? 'var(--warning)' : isGroup ? 'var(--primary)' : 'var(--warning)';
  const statusText = timedOut
    ? 'No opponent found. Play solo instead?'
    : isRandom
    ? 'Looking for an opponent…'
    : isGroup
    ? `Waiting for players to join with code ${inviteCode ?? ''}…`
    : `Waiting for opponent to join with code ${inviteCode ?? ''}…`;

  const start = () => { if (quizId) router.push(`/dashboard/quiz/${quizId}`); };
  const join = () => { if (joinCode.length === 6 && quizId) router.push(`/dashboard/quiz/${quizId}`); };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/dashboard/battles" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Battle Lobby</h1>
      </div>

      {/* Invite code */}
      {inviteCode && (
        <div className="vx-card" style={{ padding: 22, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Invite code</div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 10, color: 'var(--primary)', margin: '6px 0' }}>{inviteCode}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Share this with your opponent</div>
        </div>
      )}

      {/* Quiz info */}
      <div className="vx-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Quiz</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{quizTitle || '—'}</div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`, background: `color-mix(in srgb, ${accent} 12%, transparent)`, marginBottom: 16 }}>
        <span style={{ fontSize: 14 }}>{timedOut ? '⏰' : '🔄'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{statusText}</span>
      </div>

      {/* Join by code */}
      {!isRandom && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Have someone else&apos;s code? Join their battle:</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter code"
              maxLength={6}
              style={{ flex: 1, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', padding: '0 14px', font: 'inherit', fontSize: 16, letterSpacing: 4, textAlign: 'center' }}
            />
            <button type="button" onClick={join} disabled={joinCode.length < 6} className="btn-primary" style={{ width: 80, opacity: joinCode.length < 6 ? 0.6 : 1 }}>
              Join
            </button>
          </div>
        </div>
      )}

      {/* Start */}
      {canStart && (
        <button type="button" onClick={start} className="btn-primary" style={{ width: '100%', height: 52, fontSize: 16 }}>
          ▶ {timedOut ? 'Play Solo Instead' : 'Start Battle!'}
        </button>
      )}

      <div className="vx-card" style={{ marginTop: 16, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Quiz battles run on a timed format. Stay focused and answer as fast as you can!
        </p>
      </div>
    </div>
  );
}

export default function BattleLobbyPage() {
  return (
    <Suspense fallback={<div className="vx-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>}>
      <BattleLobby />
    </Suspense>
  );
}
