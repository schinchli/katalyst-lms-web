/**
 * GET /api/coins
 *
 * Returns the authenticated user's coin transaction history and current balance.
 *
 * DB migration required:
 * CREATE TABLE coin_transactions (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users NOT NULL,
 *   amount integer NOT NULL,
 *   reason text NOT NULL,
 *   reference_id text,
 *   created_at timestamptz DEFAULT now()
 * );
 * ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users see own transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
 * CREATE POLICY "service role full access" ON coin_transactions USING (true) WITH CHECK (true);
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { checkRateLimit }           from '@/lib/rateLimiter';
import { logger }                   from '@/lib/logger';
import type { CoinTransaction }     from '@/types';

const ROUTE = '/api/coins';

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await checkRateLimit(`coins:${ip}`, 30, 60_000))) {
    logger.rateLimited(ROUTE, ip);
    return NextResponse.json({ ok: false, error: 'Too many requests' }, {
      status: 429, headers: { 'Retry-After': '60' },
    });
  }

  // Verify JWT
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await anonClient().auth.getUser(token);
  if (authError || !user) {
    logger.warn(ROUTE, 'invalid_token', { ip });
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminClient();

  // Try fetching transactions — gracefully handle case where table doesn't exist yet
  const { data: txRows, error: txError } = await db
    .from('coin_transactions')
    .select('id, amount, reason, reference_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (txError) {
    // Table likely not yet migrated — fall back to profile balance
    const { data: profileRow } = await db
      .from('user_profiles')
      .select('coins')
      .eq('id', user.id)
      .maybeSingle();

    const balance = (profileRow as { coins?: number } | null)?.coins ?? 0;

    return NextResponse.json({
      ok: true,
      transactions: [] as CoinTransaction[],
      balance,
      note: 'coin_transactions table not yet migrated',
    });
  }

  // Compute balance from transactions (authoritative) or fall back to profile
  const balance = txRows
    ? txRows.reduce((sum, row) => sum + (row.amount as number), 0)
    : 0;

  const transactions: CoinTransaction[] = (txRows ?? []).map((row) => ({
    id:          row.id as string,
    userId:      user.id,
    amount:      row.amount as number,
    reason:      row.reason as CoinTransaction['reason'],
    referenceId: row.reference_id as string | undefined,
    createdAt:   row.created_at as string,
  }));

  return NextResponse.json({ ok: true, transactions, balance });
}
