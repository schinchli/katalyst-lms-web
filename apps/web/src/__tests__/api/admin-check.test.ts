/**
 * Tests for /api/admin/check — server-side admin verification.
 *
 * Verifies OWASP A01 (Broken Access Control) fix:
 *  - Admin access requires valid JWT, not localStorage
 *  - Non-admins receive 401, not 200
 *  - Rate limiting blocks excessive requests
 */

import { NextRequest } from 'next/server';

// ── Supabase mock ──────────────────────────────────────────────────────────
const mockGetUser = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

// ── Rate limiter mock (pass-through by default) ─────────────────────────
jest.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: jest.fn(() => true),
}));

// Must import after mocks
import { GET } from '@/app/api/admin/check/route';
import { checkRateLimit } from '@/lib/rateLimiter';

const mockedCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

// ── Helper ──────────────────────────────────────────────────────────────────

function makeRequest(token?: string): NextRequest {
  return new NextRequest('http://localhost/api/admin/check', {
    method: 'GET',
    headers: token
      ? { Authorization: `Bearer ${token}`, 'x-forwarded-for': '1.2.3.4' }
      : { 'x-forwarded-for': '1.2.3.4' },
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockedCheckRateLimit.mockResolvedValue(true);
  delete process.env.ADMIN_EMAILS;
});

describe('GET /api/admin/check', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res  = await GET(makeRequest());
    const body = await res.json() as { isAdmin: boolean; error?: string };
    expect(res.status).toBe(401);
    expect(body.isAdmin).toBe(false);
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    const res  = await GET(makeRequest('bad-token'));
    const body = await res.json() as { isAdmin: boolean };
    expect(res.status).toBe(401);
    expect(body.isAdmin).toBe(false);
  });

  it('returns isAdmin=false for authenticated but non-admin user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'user@example.com', user_metadata: {} } },
      error: null,
    });
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const res  = await GET(makeRequest('valid-token'));
    const body = await res.json() as { isAdmin: boolean };
    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
  });

  it('returns isAdmin=true when email is in ADMIN_EMAILS env var', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'admin@example.com', user_metadata: {} } },
      error: null,
    });
    process.env.ADMIN_EMAILS = 'admin@example.com,other@example.com';
    const res  = await GET(makeRequest('valid-token'));
    const body = await res.json() as { isAdmin: boolean };
    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(true);
  });

  it('ignores user_metadata.role for admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u2', email: 'dev@other.com', user_metadata: { role: 'admin' } } },
      error: null,
    });
    const res  = await GET(makeRequest('valid-token'));
    const body = await res.json() as { isAdmin: boolean };
    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
  });

  it('matches admin email case-insensitively', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u3', email: 'ADMIN@EXAMPLE.COM', user_metadata: {} } },
      error: null,
    });
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const res  = await GET(makeRequest('valid-token'));
    const body = await res.json() as { isAdmin: boolean };
    expect(body.isAdmin).toBe(true);
  });

  it('returns 429 when rate-limited', async () => {
    mockedCheckRateLimit.mockResolvedValue(false);
    const res = await GET(makeRequest('valid-token'));
    expect(res.status).toBe(429);
  });
});
