/**
 * POST /api/sync-user
 *
 * Bridges Supabase auth → Elite Quiz Admin MySQL (tbl_users).
 * Called from the dashboard layout on every authenticated session.
 *
 * Security: verifies the Supabase access token server-side before
 * touching MySQL.  The supabaseId in the body MUST match the token's
 * owner — prevents impersonation and unauthorised writes.
 *
 * Body (JSON):
 *   {
 *     supabaseId:   string   // Supabase user UUID
 *     email:        string
 *     name:         string
 *     accessToken:  string   // Supabase session JWT (verified server-side)
 *     createdAt:    string   // ISO date string
 *     quizResults?: Array<{ quizId, score, totalQuestions, timeTaken }>
 *   }
 *
 * Returns:
 *   { ok: true, userId: number, action: 'created' | 'updated' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }               from '@supabase/supabase-js';
import mysql                          from 'mysql2/promise';
import { checkRateLimit }             from '@/lib/rateLimiter';
import { logger }                     from '@/lib/logger';
import { SyncUserSchema }             from '@/lib/schemas';

function getDb() {
  return mysql.createConnection({
    host:           process.env.ADMIN_DB_HOST     ?? 'localhost',
    user:           process.env.ADMIN_DB_USER     ?? 'root',
    password:       process.env.ADMIN_DB_PASSWORD ?? '',
    database:       process.env.ADMIN_DB_NAME     ?? 'elite_quiz_238',
    connectTimeout: 3000,
  });
}

/** Short refer code derived from UUID (8 uppercase hex chars). */
function shortCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/**
 * Verify a Supabase JWT server-side.
 * Returns the authenticated user or null if the token is invalid/expired.
 */
async function verifyToken(accessToken: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await client.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const ROUTE = '/api/sync-user';
  const ip    = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (!checkRateLimit(`sync-user:${ip}`, 20, 60_000)) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let db;
  try {
    // ── 1. Parse + Zod validate body ──────────────────────────────────────
    let raw: unknown;
    try { raw = await req.json(); }
    catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = SyncUserSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn(ROUTE, 'validation_failed', { ip, reason: JSON.stringify(parsed.error.flatten()) });
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { supabaseId, email, name, accessToken, createdAt, quizResults } = parsed.data;

    // ── 2. Authenticate — verify JWT and confirm identity ──────────────────
    const tokenUser = await verifyToken(accessToken);
    if (!tokenUser || tokenUser.id !== supabaseId) {
      logger.authFail(ROUTE, 'token_mismatch', { ip, userId: supabaseId });
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (tokenUser.email && tokenUser.email !== email) {
      logger.authFail(ROUTE, 'email_mismatch', { ip, userId: supabaseId });
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ── 3. Sanitise inputs ─────────────────────────────────────────────────
    const displayName = (name?.trim())
      ? name.trim().slice(0, 100)
      : email.split('@')[0].slice(0, 100);

    const referCode = shortCode(supabaseId);
    const regDate   = (typeof createdAt === 'string' && createdAt)
      ? new Date(createdAt).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    // ── 5. Connect to MySQL ────────────────────────────────────────────────
    db = await getDb();

    // ── 6. Upsert tbl_users ────────────────────────────────────────────────
    const [existing] = await db.execute(
      'SELECT id FROM tbl_users WHERE firebase_id = ?',
      [supabaseId],
    ) as mysql.RowDataPacket[][];

    let userId: number;
    let action: 'created' | 'updated';

    if (existing.length > 0) {
      userId = existing[0].id as number;
      // NOTE: api_token column intentionally NOT updated — raw JWTs must
      //       not be persisted long-term.  Use a hashed reference if needed.
      await db.execute(
        `UPDATE tbl_users SET name = ?, email = ?, status = 1 WHERE firebase_id = ?`,
        [displayName, email, supabaseId],
      );
      action = 'updated';
    } else {
      const [result] = await db.execute(
        `INSERT INTO tbl_users
           (firebase_id, name, email, mobile, type, profile, coins,
            refer_code, remove_ads, status, date_registered, api_token,
            app_language, web_language)
         VALUES (?, ?, ?, '', 'user', '', 0, ?, 0, 1, ?, '', 'en', 'en')`,
        [supabaseId, displayName, email, referCode, regDate],
      ) as mysql.ResultSetHeader[];
      userId = (result as unknown as { insertId: number }).insertId;
      action = 'created';
    }

    // ── 7. Sync quiz stats ─────────────────────────────────────────────────
    if (Array.isArray(quizResults) && quizResults.length > 0) {
      // Already validated by Zod — safe to use directly
      const validResults = quizResults;

      const totalAnswered = validResults.reduce((s, r) => s + r.totalQuestions, 0);
      const totalCorrect  = validResults.reduce((s, r) => s + r.score, 0);
      const ratio         = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

      const [statsExisting] = await db.execute(
        'SELECT id FROM tbl_users_statistics WHERE user_id = ?',
        [userId],
      ) as mysql.RowDataPacket[][];

      if (statsExisting.length > 0) {
        await db.execute(
          `UPDATE tbl_users_statistics
           SET questions_answered = ?, correct_answers = ?, ratio1 = ?
           WHERE user_id = ?`,
          [totalAnswered, totalCorrect, ratio, userId],
        );
      } else {
        await db.execute(
          `INSERT INTO tbl_users_statistics
             (user_id, questions_answered, correct_answers, strong_category,
              ratio1, weak_category, ratio2, best_position, date_created)
           VALUES (?, ?, ?, 0, ?, 0, 0, 0, NOW())`,
          [userId, totalAnswered, totalCorrect, ratio],
        );
      }
    }

    await db.end();
    logger.info(ROUTE, 'sync_complete', { ip, userId: supabaseId, action });
    return NextResponse.json({ ok: true, userId, action });

  } catch (err: unknown) {
    if (db) await db.end().catch(() => {});
    logger.error(ROUTE, 'unhandled_error', { ip, reason: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/sync-user — health check (requires auth header)
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(`sync-user-get:${ip}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let db;
  try {
    db = await getDb();
    const [rows] = await db.execute('SELECT COUNT(*) as n FROM tbl_users') as mysql.RowDataPacket[][];
    await db.end();
    return NextResponse.json({ ok: true, totalUsers: (rows as Array<{ n: number }>)[0].n });
  } catch {
    if (db) await db.end().catch(() => {});
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
