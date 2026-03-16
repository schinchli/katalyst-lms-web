'use client';
export const dynamic = 'force-dynamic';

/**
 * Battle Lobby — foundation layer.
 * Real-time sync uses polling (fetch every 3s) rather than WebSockets — this is
 * a prototype/foundation. For production, replace polling with Supabase Realtime
 * channels subscribing to a `battle_sessions` table.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { quizzes } from '@/data/quizzes';
import type { BattleSession } from '@/types';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

type Mode = 'one_vs_one' | 'group' | 'random';
type Screen = 'lobby' | 'waiting';

const MODE_LABELS: Record<Mode, { label: string; icon: string; desc: string }> = {
  one_vs_one: { label: '1v1 Duel',   icon: '⚔️',  desc: 'Challenge one opponent head-to-head.' },
  group:      { label: 'Group',       icon: '👥',  desc: 'Up to 10 players in one room.' },
  random:     { label: 'Random Match',icon: '🎲',  desc: 'Get matched with a random player.' },
};

const POLL_INTERVAL_MS = 3_000;

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function BattlePage() {
  useManagedQuizContentVersion();
  const router = useRouter();

  const [screen,      setScreen]      = useState<Screen>('lobby');
  const [mode,        setMode]        = useState<Mode>('one_vs_one');
  const [quizId,      setQuizId]      = useState(quizzes[0]?.id ?? '');
  const [inviteInput, setInviteInput] = useState('');
  const [session,     setSession]     = useState<BattleSession | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [userId,      setUserId]      = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve userId on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollSession = useCallback(async (sessionId: string) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const d = await apiFetch<{ ok: boolean; session?: BattleSession }>(
        `/api/battle?sessionId=${sessionId}`, token, { method: 'GET' },
      );
      if (d.ok && d.session) setSession(d.session);
    } catch { /* best-effort */ }
  }, []);

  // Start polling when on waiting screen
  useEffect(() => {
    if (screen === 'waiting' && session?.id) {
      const id = session.id;
      pollRef.current = setInterval(() => { void pollSession(id); }, POLL_INTERVAL_MS);
      return () => stopPoll();
    }
    return stopPoll;
  }, [screen, session?.id, pollSession, stopPoll]);

  // Redirect to quiz when session becomes active
  useEffect(() => {
    if (session?.status === 'active' && session.quizId) {
      stopPoll();
      router.push(`/dashboard/quiz/${session.quizId}`);
    }
  }, [session?.status, session?.quizId, router, stopPoll]);

  const createRoom = async () => {
    setLoading(true); setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const d = await apiFetch<{ ok: boolean; sessionId?: string; inviteCode?: string; session?: BattleSession }>(
        '/api/battle', token,
        { method: 'POST', body: JSON.stringify({ action: 'create', mode, quizId }) },
      );
      if (!d.ok || !d.session) throw new Error('Failed to create room');
      setSession(d.session);
      setScreen('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    const code = inviteInput.trim().toUpperCase();
    if (!code) { setError('Enter an invite code'); return; }
    setLoading(true); setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const d = await apiFetch<{ ok: boolean; sessionId?: string; session?: BattleSession }>(
        '/api/battle', token,
        { method: 'POST', body: JSON.stringify({ action: 'join', inviteCode: code }) },
      );
      if (!d.ok || !d.session) throw new Error('Room not found or already started');
      setSession(d.session);
      setScreen('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const setReady = async () => {
    if (!session?.id) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      const d = await apiFetch<{ ok: boolean; session?: BattleSession }>(
        '/api/battle', token,
        { method: 'POST', body: JSON.stringify({ action: 'ready', sessionId: session.id }) },
      );
      if (d.ok && d.session) setSession(d.session);
    } catch { /* best-effort */ }
  };

  const startBattle = async () => {
    if (!session?.id) return;
    setLoading(true); setError('');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const d = await apiFetch<{ ok: boolean; session?: BattleSession }>(
        '/api/battle', token,
        { method: 'POST', body: JSON.stringify({ action: 'start', sessionId: session.id }) },
      );
      if (!d.ok) throw new Error('Failed to start battle');
      if (d.session) setSession(d.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = () => {
    stopPoll();
    setSession(null);
    setScreen('lobby');
    setError('');
  };

  const isHost = session?.hostUserId === userId;
  const myPlayer = session?.players.find((p) => p.userId === userId);

  // ── Waiting Room ──────────────────────────────────────────────────────────
  if (screen === 'waiting' && session) {
    return (
      <div className="page-content" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={leaveRoom} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 16 }}>
            ← Leave Room
          </button>
          <h1 style={{ margin: '0 0 6px' }}>Waiting Room</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
            Share the invite code with friends. Host starts the battle.
          </p>
        </div>

        {/* Invite code */}
        {session.inviteCode && (
          <div style={{ background: 'var(--surface)', border: '2px dashed var(--primary)', borderRadius: 14, padding: 24, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 8 }}>Invite Code</div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: 6, color: 'var(--primary)', fontFamily: 'monospace' }}>{session.inviteCode}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Share this code with your opponents</div>
          </div>
        )}

        {/* Players list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
            Players ({session.players.length})
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 8 }}>
              [{MODE_LABELS[session.mode].label}]
            </span>
          </div>
          {session.players.map((p) => (
            <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: p.isHost ? 'var(--primary-light)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: p.isHost ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{p.isHost ? '👑 Host' : 'Player'}</div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: p.isReady ? '#28C76F18' : 'var(--bg)',
                color: p.isReady ? '#28C76F' : 'var(--text-secondary)',
              }}>
                {p.isReady ? '✓ Ready' : 'Not ready'}
              </div>
            </div>
          ))}
        </div>

        {/* Note: polling every 3s instead of WebSockets */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 16, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
          ℹ️ Player list refreshes every 3 seconds. Real-time WebSocket sync is planned for a future release.
        </div>

        {error && (
          <div style={{ color: '#FF4C51', fontSize: 13, marginBottom: 12, padding: '10px 14px', background: '#FF4C5108', borderRadius: 8, border: '1px solid #FF4C5130' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {!myPlayer?.isReady && (
            <button onClick={setReady} style={{ flex: 1, height: 44, borderRadius: 10, background: '#28C76F18', border: '1.5px solid #28C76F', color: '#28C76F', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✓ Mark Ready
            </button>
          )}
          {isHost && (
            <button
              onClick={startBattle}
              disabled={loading || session.players.length < 1}
              style={{ flex: 1, height: 44, borderRadius: 10, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Starting…' : '▶ Start Battle'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-content" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(24px, 4vw, 36px)' }}>Battle Arena</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15 }}>
          Challenge others to a real-time quiz duel. Create a room or join with an invite code.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Create Room */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Create Room</h2>

          {/* Mode selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Battle Mode</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.entries(MODE_LABELS) as [Mode, typeof MODE_LABELS[Mode]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 10,
                    border: `1.5px solid ${mode === key ? 'var(--primary)' : 'var(--border)'}`,
                    background: mode === key ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{val.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: mode === key ? 'var(--primary-text)' : 'var(--text)' }}>{val.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>{val.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quiz selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Quiz</div>
            <select
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="admin-field-input"
              style={{ width: '100%' }}
            >
              {quizzes.filter((q) => q.enabled !== false).map((q) => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ color: '#FF4C51', fontSize: 13, marginBottom: 12, padding: '10px 14px', background: '#FF4C5108', borderRadius: 8, border: '1px solid #FF4C5130' }}>{error}</div>
          )}

          <button
            onClick={createRoom}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', height: 44, borderRadius: 10, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating…' : '🚀 Create Room'}
          </button>
        </div>

        {/* Join Room */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Join Room</h2>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            Enter the 6-character invite code shared by your host.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 8 }}>Invite Code</div>
            <input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              style={{
                width: '100%', height: 48, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: 6,
                fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') void joinRoom(); }}
            />
          </div>

          <button
            onClick={joinRoom}
            disabled={loading || !inviteInput.trim()}
            style={{ width: '100%', height: 44, borderRadius: 10, background: inviteInput.trim() ? '#28C76F' : 'var(--bg)', border: `1.5px solid ${inviteInput.trim() ? '#28C76F' : 'var(--border)'}`, color: inviteInput.trim() ? '#fff' : 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: loading || !inviteInput.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Joining…' : '🔑 Join Room'}
          </button>

          {/* Info box */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Foundation note:</strong> Battle mode is in early access. Real-time sync is via polling every 3s. Full WebSocket support is planned.
          </div>
        </div>
      </div>
    </div>
  );
}
