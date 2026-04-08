'use client';
export const dynamic = 'force-dynamic';

/**
 * Battle Lobby — foundation layer.
 * Supabase Realtime is used as the transport for opponent signalling.
 * TODO: persist battle sessions to Supabase battles table once migration is applied.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { BattleSession, BattleStatus, BattleParticipant } from '@/types';
import { quizzes } from '@/data/quizzes';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';

// ── Realtime broadcast event payloads ────────────────────────────────────────

interface ScoreUpdatePayload {
  participants: BattleParticipant[];
}

interface ProgressUpdatePayload {
  currentQuestionIdx: number;
}

interface FinishPayload {
  participants: BattleParticipant[];
}

type BattleBroadcast =
  | { event: 'join';             payload: { userId: string } }
  | { event: 'start';            payload: { quizId: string } }
  | { event: 'score_update';     payload: ScoreUpdatePayload }
  | { event: 'progress_update';  payload: ProgressUpdatePayload }
  | { event: 'finish';           payload: FinishPayload };

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function pickRandomFreeQuiz(): string {
  const free = quizzes.filter((q) => !q.isPremium && q.enabled !== false);
  if (free.length === 0) return quizzes[0]?.id ?? '';
  return free[Math.floor(Math.random() * free.length)]?.id ?? '';
}

// TODO: persist battle sessions to Supabase battles table once migration is applied
function saveBattleLocally(session: BattleSession) {
  try {
    localStorage.setItem(`battle-session-${session.id}`, JSON.stringify(session));
  } catch { /* best-effort */ }
}

type BattleType = 'one_vs_one' | 'group' | 'random';

const MODE_CARDS: Array<{
  type: BattleType;
  title: string;
  description: string;
  icon: string;
  color: string;
  maxPlayers: string;
}> = [
  {
    type: 'random',
    title: '1v1 Random Battle',
    description: 'Get matched with a random opponent instantly. A free quiz is selected automatically.',
    icon: '⚡',
    color: 'var(--warning)',
    maxPlayers: '2 players',
  },
  {
    type: 'one_vs_one',
    title: '1v1 Challenge',
    description: 'Challenge a friend directly. Share your invite code and start when they join.',
    icon: '⚔️',
    color: 'var(--error)',
    maxPlayers: '2 players',
  },
  {
    type: 'group',
    title: 'Group Battle',
    description: 'Compete with up to 8 players. Share the code and start when your group is ready.',
    icon: '🏟️',
    color: '#7367F0',
    maxPlayers: '2–8 players',
  },
];

// ── Lobby overlay ─────────────────────────────────────────────────────────────

function BattleLobbyOverlay({
  session,
  onClose,
  onStartQuiz,
}: {
  session: BattleSession;
  onClose: () => void;
  onStartQuiz: (quizId: string) => void;
}) {
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [waitTimeout, setWaitTimeout] = useState(false);

  // Live score state — updated by score_update broadcasts during active gameplay
  const [liveParticipants, setLiveParticipants] = useState<BattleParticipant[]>(session.participants);
  // Progress state — updated by progress_update broadcasts
  const [liveQuestionIdx, setLiveQuestionIdx] = useState(session.currentQuestionIdx);
  // Whether the battle has finished (via finish broadcast)
  const [battleFinished, setBattleFinished] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep liveParticipants in sync if the parent session prop changes (e.g. after polling)
  useEffect(() => {
    setLiveParticipants(session.participants);
  }, [session.participants]);

  useEffect(() => {
    const channelName = `battle-${session.id}`;
    const ch = supabase.channel(channelName, { config: { broadcast: { self: false } } });

    // Existing: opponent joins the waiting room
    ch.on('broadcast', { event: 'join' }, (msg: { payload?: { userId?: string } }) => {
      if (msg.payload?.userId && msg.payload.userId !== session.hostUserId) {
        setOpponentJoined(true);
      }
    });
    // Live score update — any participant just answered a question
    ch.on('broadcast', { event: 'score_update' }, (msg: { payload?: { participants?: BattleParticipant[] } }) => {
      if (Array.isArray(msg.payload?.participants)) {
        setLiveParticipants(msg.payload.participants as BattleParticipant[]);
      }
    });
    // Question index advanced — all participants should be on the same question
    ch.on('broadcast', { event: 'progress_update' }, (msg: { payload?: { currentQuestionIdx?: number } }) => {
      if (typeof msg.payload?.currentQuestionIdx === 'number') {
        setLiveQuestionIdx(msg.payload.currentQuestionIdx);
      }
    });
    // Battle finished — show final scores to all participants simultaneously
    ch.on('broadcast', { event: 'finish' }, (msg: { payload?: { participants?: BattleParticipant[] } }) => {
      if (Array.isArray(msg.payload?.participants)) {
        setLiveParticipants(msg.payload.participants as BattleParticipant[]);
      }
      setBattleFinished(true);
    });
    ch.subscribe();

    channelRef.current = ch;

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (session.type === 'random') {
      timer = setTimeout(() => setWaitTimeout(true), 30_000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(ch);
    };
  }, [session.id, session.type, session.hostUserId]);

  /**
   * broadcastScore — call this after a successful answer API response.
   * Sends score_update and (when the question index advances) progress_update
   * to all participants on the channel.
   */
  const broadcastScore = useCallback((updatedSession: BattleSession) => {
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: 'broadcast',
      event: 'score_update',
      payload: { participants: updatedSession.participants } satisfies ScoreUpdatePayload,
    });
    // If the question index changed, broadcast that too
    if (updatedSession.currentQuestionIdx !== liveQuestionIdx) {
      void ch.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: { currentQuestionIdx: updatedSession.currentQuestionIdx } satisfies ProgressUpdatePayload,
      });
    }
    // If session is now finished, broadcast final results
    if (updatedSession.status === 'finished') {
      void ch.send({
        type: 'broadcast',
        event: 'finish',
        payload: { participants: updatedSession.participants } satisfies FinishPayload,
      });
    }
  }, [liveQuestionIdx]);

  const canStart = opponentJoined || (session.type === 'random' && waitTimeout) || session.type === 'group';

  const handleStart = () => {
    if (channelRef.current) {
      void channelRef.current.send({ type: 'broadcast', event: 'start', payload: { quizId: session.quizId } });
    }
    onStartQuiz(session.quizId);
  };

  const quizTitle = quizzes.find((q) => q.id === session.quizId)?.title ?? session.quizId;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20, padding: 32,
        maxWidth: 440, width: '90%', boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {battleFinished ? 'Battle Results' : 'Battle Lobby'}
          </h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Invite code (1v1 + group) — only shown while waiting */}
        {session.inviteCode && !battleFinished && (
          <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Invite Code</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 8, color: '#7367F0', fontFamily: 'monospace' }}>{session.inviteCode}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>Share this code with your opponent</div>
          </div>
        )}

        {/* Quiz */}
        <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Quiz</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{quizTitle}</div>
        </div>

        {/* Live score table — visible once there are participants (during and after battle) */}
        {liveParticipants.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {battleFinished ? 'Final Scores' : 'Live Scores'}
              {!battleFinished && liveQuestionIdx > 0 && (
                <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  — Q{liveQuestionIdx + 1}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...liveParticipants]
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => (
                  <div
                    key={p.userId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8,
                      background: rank === 0 ? '#7367F012' : 'var(--bg)',
                      border: `1px solid ${rank === 0 ? '#7367F030' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: rank === 0 ? '#7367F0' : 'var(--text-secondary)', minWidth: 16 }}>
                        #{rank + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      {battleFinished && p.finishedAt && (
                        <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>
                      )}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: rank === 0 ? '#7367F0' : 'var(--text)' }}>
                      {p.score}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Status — hidden once battle is finished */}
        {!battleFinished && (
          <div style={{
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: opponentJoined ? '#28C76F12' : '#FF9F4312', borderRadius: 10,
            border: `1px solid ${opponentJoined ? '#28C76F40' : '#FF9F4340'}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: opponentJoined ? 'var(--success)' : 'var(--warning)' }}>
              {opponentJoined
                ? 'Opponent joined! Ready to battle.'
                : waitTimeout
                ? 'No opponent found. You can play solo instead.'
                : session.type === 'random'
                ? 'Looking for an opponent…'
                : session.type === 'group'
                ? `Waiting for players to join with code ${session.inviteCode ?? ''}…`
                : `Waiting for opponent to join with code ${session.inviteCode ?? ''}…`}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {battleFinished ? (
            <button
              onClick={onClose}
              style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#7367F0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Close
            </button>
          ) : (
            <>
              {canStart && (
                <button
                  onClick={handleStart}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: '#7367F0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {waitTimeout && !opponentJoined ? 'Play Solo Instead' : 'Start Battle!'}
                </button>
              )}
              <button
                onClick={onClose}
                style={{ padding: '0 16px', height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/*
          broadcastScore is passed down via context / prop drilling when the quiz
          player submits an answer. For this foundation layer the function is defined
          here and exposed on the window so the quiz page can call it if it detects a
          battle session in progress. This avoids any new files or architectural changes.
          Safe to ignore in non-battle quiz sessions.
        */}
        <BroadcastScoreRegistrar broadcastScore={broadcastScore} />
      </div>
    </div>
  );
}

/**
 * Registers the broadcastScore helper on the window so the quiz page can call
 * it after a successful answer submission without requiring prop-drilling through
 * the router or a new shared context file.
 *
 * The window property is cleaned up when the overlay unmounts.
 */
function BroadcastScoreRegistrar({
  broadcastScore,
}: {
  broadcastScore: (updatedSession: BattleSession) => void;
}) {
  useEffect(() => {
    // Attach under a namespaced key to avoid collisions
    (window as Window & { __katalystBroadcastScore?: (s: BattleSession) => void }).__katalystBroadcastScore = broadcastScore;
    return () => {
      delete (window as Window & { __katalystBroadcastScore?: (s: BattleSession) => void }).__katalystBroadcastScore;
    };
  }, [broadcastScore]);
  return null;
}

// ── Join dialog ───────────────────────────────────────────────────────────────

function JoinByCodeDialog({ onJoin, onClose }: { onJoin: (code: string) => void; onClose: () => void }) {
  const [code, setCode] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, maxWidth: 360, width: '90%' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text)', fontSize: 17 }}>Join a Battle</h3>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="6-character code"
          maxLength={6}
          aria-label="Invite code"
          style={{
            width: '100%', height: 48, borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)', fontSize: 20, fontWeight: 700,
            fontFamily: 'monospace', textAlign: 'center', letterSpacing: 8, outline: 'none',
            padding: '0 16px', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            disabled={code.length < 6}
            onClick={() => code.length === 6 && onJoin(code)}
            style={{
              flex: 1, height: 44, borderRadius: 10, border: 'none',
              background: code.length === 6 ? '#7367F0' : 'var(--bg)',
              color: code.length === 6 ? '#fff' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            Join
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0 14px', height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BattlesPage() {
  const router = useRouter();
  useManagedQuizContentVersion();
  const [activeLobby, setActiveLobby] = useState<BattleSession | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const userIdRef = useRef<string>('guest');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) userIdRef.current = data.user.id;
    });
  }, []);

  const createSession = (type: BattleType): BattleSession => {
    const quizId = pickRandomFreeQuiz();
    const self: BattleParticipant = { userId: userIdRef.current, name: 'You', score: 0, answers: {} };
    const session: BattleSession = {
      id: generateId(),
      type,
      status: 'waiting' as BattleStatus,
      quizId,
      hostUserId: userIdRef.current,
      players: [],
      participants: [self],
      questionIds: [],
      currentQuestionIdx: 0,
      currentQuestionIndex: 0,
      inviteCode: type !== 'random' ? generateInviteCode() : undefined,
    };
    saveBattleLocally(session);
    return session;
  };

  const handleJoinByCode = (code: string) => {
    // TODO: look up session by code in Supabase battles table once migration is applied
    const session = createSession('one_vs_one');
    const sessionWithCode: BattleSession = { ...session, inviteCode: code };
    saveBattleLocally(sessionWithCode);
    setShowJoinDialog(false);
    setActiveLobby(sessionWithCode);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, fontFamily: "'Public Sans', sans-serif" }}>
      {/* Lobby overlay */}
      {activeLobby && (
        <BattleLobbyOverlay
          session={activeLobby}
          onClose={() => setActiveLobby(null)}
          onStartQuiz={(quizId) => { setActiveLobby(null); router.push(`/dashboard/quiz/${quizId}`); }}
        />
      )}
      {/* Join dialog */}
      {showJoinDialog && (
        <JoinByCodeDialog onJoin={handleJoinByCode} onClose={() => setShowJoinDialog(false)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Battle Modes</h1>
        <button
          onClick={() => setShowJoinDialog(true)}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Join by Code
        </button>
      </div>
      <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Challenge others in real-time quiz battles powered by Supabase Realtime
      </p>

      {/* Mode cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
        {MODE_CARDS.map((card) => (
          <div key={card.type} style={{
            background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ height: 4, background: card.color }} />
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{card.title}</h3>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{card.description}</p>
              <div style={{ fontSize: 11, fontWeight: 600, color: card.color, marginBottom: 20, letterSpacing: 0.3 }}>
                {card.maxPlayers}
              </div>
              <button
                onClick={() => setActiveLobby(createSession(card.type))}
                style={{
                  width: '100%', height: 42, borderRadius: 10, border: 'none',
                  background: card.color, color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Start
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{
        padding: '16px 18px', borderRadius: 12, background: '#7367F012',
        border: '1px solid #7367F030', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#7367F0' }}>Foundation Layer:</strong>{' '}
        Battle sessions use Supabase Realtime for live opponent signalling.
        Full game loop (live scoring, question sync, final leaderboard) will be completed in a future update once the Supabase battles table migration is applied.
      </div>
    </div>
  );
}
