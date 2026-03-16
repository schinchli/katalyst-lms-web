/**
 * Battle API — foundation/prototype using app_settings for session storage.
 *
 * NOTE: This is a prototype approach using app_settings (no extra Supabase table needed).
 * For a production real-time battle system, migrate to a dedicated `battle_sessions` table:
 *
 * -- SQL migration (run when moving beyond prototype):
 * CREATE TABLE battle_sessions (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   mode         TEXT NOT NULL CHECK (mode IN ('one_vs_one','group','random')),
 *   status       TEXT NOT NULL DEFAULT 'waiting'
 *                CHECK (status IN ('waiting','active','finished','abandoned')),
 *   quiz_id      TEXT NOT NULL,
 *   host_user_id TEXT NOT NULL,
 *   invite_code  TEXT UNIQUE NOT NULL,
 *   players      JSONB NOT NULL DEFAULT '[]',
 *   current_question_index INT NOT NULL DEFAULT 0,
 *   started_at   TIMESTAMPTZ,
 *   finished_at  TIMESTAMPTZ,
 *   created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
 * -- Policy: authenticated users can read sessions they are part of
 * CREATE POLICY "players_can_read" ON battle_sessions
 *   FOR SELECT USING (host_user_id = auth.uid()
 *     OR players @> jsonb_build_array(jsonb_build_object('userId', auth.uid()::text)));
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimiter';
import type { BattleSession, BattlePlayer, BattleStatus } from '@/types';

const BATTLE_SESSIONS_KEY = 'battle_sessions';
const SESSION_TTL_MS      = 2 * 60 * 60 * 1000; // 2 hours — auto-expire old sessions

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function verifyAuth(req: NextRequest) {
  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const { data: { user }, error } = await anonClient().auth.getUser(token);
  if (error || !user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  return { ok: true as const, user };
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSessionId(): string {
  return `battle-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

async function loadSessions(db: ReturnType<typeof adminClient>): Promise<BattleSession[]> {
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', BATTLE_SESSIONS_KEY)
    .maybeSingle();
  if (!data?.value || !Array.isArray(data.value)) return [];
  // Prune expired sessions
  const cutoff = Date.now() - SESSION_TTL_MS;
  return (data.value as BattleSession[]).filter((s) => {
    if (s.finishedAt || s.status === 'finished' || s.status === 'abandoned') {
      const ts = s.finishedAt ? new Date(s.finishedAt).getTime() : 0;
      return ts > cutoff;
    }
    return true;
  });
}

async function saveSessions(db: ReturnType<typeof adminClient>, sessions: BattleSession[]): Promise<void> {
  await db.from('app_settings').upsert(
    { key: BATTLE_SESSIONS_KEY, value: sessions },
    { onConflict: 'key' },
  );
}

// ── GET — fetch session state ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`battle-get:${ip}`, 60, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyAuth(req);
  if (!authResult.ok) return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ ok: false, error: 'sessionId required' }, { status: 400 });

  const db       = adminClient();
  const sessions = await loadSessions(db);
  const session  = sessions.find((s) => s.id === sessionId);
  if (!session)   return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });

  return NextResponse.json({ ok: true, session });
}

// ── POST — create / join / answer actions ─────────────────────────────────
const createSchema = z.object({
  action:  z.literal('create'),
  mode:    z.enum(['one_vs_one', 'group', 'random']),
  quizId:  z.string().min(1),
  playerName: z.string().min(1).max(60).optional(),
});

const joinSchema = z.object({
  action:     z.literal('join'),
  inviteCode: z.string().min(1),
  playerName: z.string().min(1).max(60).optional(),
});

const answerSchema = z.object({
  action:        z.literal('answer'),
  sessionId:     z.string().min(1),
  questionIndex: z.number().int().min(0),
  optionId:      z.string().min(1),
});

const readySchema = z.object({
  action:    z.literal('ready'),
  sessionId: z.string().min(1),
});

const startSchema = z.object({
  action:    z.literal('start'),
  sessionId: z.string().min(1),
});

const bodySchema = z.discriminatedUnion('action', [
  createSchema, joinSchema, answerSchema, readySchema, startSchema,
]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await checkRateLimit(`battle-post:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 8_192) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
  }

  const authResult = await verifyAuth(req);
  if (!authResult.ok) return NextResponse.json({ ok: false, error: authResult.error }, { status: authResult.status });
  const { user } = authResult;

  let rawBody: unknown = null;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const db       = adminClient();
  const sessions = await loadSessions(db);

  // ── create ──────────────────────────────────────────────────────────────
  if (parsed.data.action === 'create') {
    const { mode, quizId, playerName } = parsed.data;
    const sessionId  = generateSessionId();
    const inviteCode = generateInviteCode();
    const host: BattlePlayer = {
      userId:        user.id,
      name:          playerName ?? user.email?.split('@')[0] ?? 'Host',
      score:         0,
      answeredCount: 0,
      isHost:        true,
      isReady:       false,
    };
    const newSession: BattleSession = {
      id:                   sessionId,
      mode,
      status:               'waiting',
      quizId,
      hostUserId:           user.id,
      players:              [host],
      currentQuestionIndex: 0,
      inviteCode,
    };
    await saveSessions(db, [...sessions, newSession]);
    return NextResponse.json({ ok: true, sessionId, inviteCode, session: newSession });
  }

  // ── join ─────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'join') {
    const { inviteCode, playerName } = parsed.data;
    const idx = sessions.findIndex((s) => s.inviteCode === inviteCode && s.status === 'waiting');
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: 'Room not found or already started' }, { status: 404 });
    }
    const session = sessions[idx];
    if (session.players.some((p) => p.userId === user.id)) {
      // Rejoining — return current state
      return NextResponse.json({ ok: true, sessionId: session.id, session });
    }
    const maxPlayers = session.mode === 'one_vs_one' ? 2 : 10;
    if (session.players.length >= maxPlayers) {
      return NextResponse.json({ ok: false, error: 'Room is full' }, { status: 409 });
    }
    const player: BattlePlayer = {
      userId:        user.id,
      name:          playerName ?? user.email?.split('@')[0] ?? 'Player',
      score:         0,
      answeredCount: 0,
      isHost:        false,
      isReady:       false,
    };
    const updated: BattleSession = { ...session, players: [...session.players, player] };
    sessions[idx] = updated;
    await saveSessions(db, sessions);
    return NextResponse.json({ ok: true, sessionId: updated.id, session: updated });
  }

  // ── ready ─────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'ready') {
    const { sessionId } = parsed.data;
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    const session = sessions[idx];
    const updatedPlayers: BattlePlayer[] = session.players.map((p) =>
      p.userId === user.id ? { ...p, isReady: true } : p,
    );
    sessions[idx] = { ...session, players: updatedPlayers };
    await saveSessions(db, sessions);
    return NextResponse.json({ ok: true, session: sessions[idx] });
  }

  // ── start ─────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'start') {
    const { sessionId } = parsed.data;
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    const session = sessions[idx];
    if (session.hostUserId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Only the host can start' }, { status: 403 });
    }
    if (session.players.length < 1) {
      return NextResponse.json({ ok: false, error: 'Need at least 1 player' }, { status: 400 });
    }
    sessions[idx] = {
      ...session,
      status:    'active' as BattleStatus,
      startedAt: new Date().toISOString(),
    };
    await saveSessions(db, sessions);
    return NextResponse.json({ ok: true, session: sessions[idx] });
  }

  // ── answer ─────────────────────────────────────────────────────────────────
  if (parsed.data.action === 'answer') {
    const { sessionId, questionIndex, optionId } = parsed.data;
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    const session = sessions[idx];
    if (session.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'Session is not active' }, { status: 400 });
    }
    // NOTE: Answer scoring here is best-effort without DB quiz question lookup.
    // In production, fetch question from DB and verify correctOptionId server-side.
    const updatedPlayers: BattlePlayer[] = session.players.map((p) => {
      if (p.userId !== user.id) return p;
      return { ...p, answeredCount: Math.max(p.answeredCount, questionIndex + 1) };
    });
    // Advance currentQuestionIndex if all players answered
    const allAnswered = updatedPlayers.every((p) => p.answeredCount > questionIndex);
    const nextIndex   = allAnswered ? questionIndex + 1 : session.currentQuestionIndex;
    sessions[idx] = { ...session, players: updatedPlayers, currentQuestionIndex: nextIndex };
    await saveSessions(db, sessions);
    return NextResponse.json({ ok: true, session: sessions[idx], answeredOptionId: optionId });
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
