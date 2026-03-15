import { supabaseAdmin } from '@/lib/supabaseServer';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Verifies the Bearer JWT and returns the Supabase user, or null if invalid/missing. */
export async function getAuthUser(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

/** Returns true if the email is in ADMIN_EMAILS env var. */
export function isAdmin(email?: string | null): boolean {
  return adminEmails.includes((email ?? '').toLowerCase());
}

type AuthUser = NonNullable<Awaited<ReturnType<typeof getAuthUser>>>;
type VerifyResult =
  | { ok: true;  user: AuthUser }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Verifies JWT and checks admin access in one call.
 * Returns { ok: true, user } or an error shape ready to pass to NextResponse.json().
 */
export async function verifyAdmin(req: Request): Promise<VerifyResult> {
  const user = await getAuthUser(req);
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };
  if (!isAdmin(user.email)) return { ok: false, status: 403, error: 'Forbidden' };
  return { ok: true, user };
}
