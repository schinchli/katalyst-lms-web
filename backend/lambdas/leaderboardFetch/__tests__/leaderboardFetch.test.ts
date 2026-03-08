/**
 * leaderboardFetch Lambda — Unit Tests
 * ─────────────────────────────────────
 * Tests: auth, period routing (daily/monthly/alltime), rank assignment,
 *        isCurrentUser flag, Cache-Control header, invalid period guard
 */

import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<unknown>;
};

const CURRENT_USER_ID = 'user-current';

function makeEvent(period?: string, userId = CURRENT_USER_ID): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'GET',
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    queryStringParameters: period ? { period } : null,
  };
}

const MOCK_ENTRIES = [
  { userId: 'user-001',      displayName: 'Alice', score: 950, coins: 500, xp: 1000, streak: 7, quizzesCompleted: 12 },
  { userId: CURRENT_USER_ID, displayName: 'Me',    score: 800, coins: 400, xp: 850,  streak: 3, quizzesCompleted: 8 },
  { userId: 'user-003',      displayName: 'Bob',   score: 700, coins: 300, xp: 700,  streak: 1, quizzesCompleted: 5 },
];

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(QueryCommand).resolves({ Items: MOCK_ENTRIES });
});

// ═══════════════════════════════════════════════════════════════════════════════
// auth guard
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — authentication', () => {
  test('returns 401 when no claims', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      requestContext: { authorizer: undefined } as unknown as APIGatewayProxyEvent['requestContext'],
      queryStringParameters: null,
    };
    const res = await handler(event, {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Unauthorized' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// period validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — period parameter', () => {
  test('returns 400 for invalid period', async () => {
    const res = await handler(makeEvent('weekly'), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid period/);
  });

  test('defaults to alltime when period omitted', async () => {
    const res = await handler(makeEvent(), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).period).toBe('alltime');
  });

  test('accepts "daily"',   async () => { expect((await handler(makeEvent('daily'),   {}) as { statusCode: number; body: string }).statusCode).toBe(200); });
  test('accepts "monthly"', async () => { expect((await handler(makeEvent('monthly'), {}) as { statusCode: number; body: string }).statusCode).toBe(200); });
  test('accepts "alltime"', async () => { expect((await handler(makeEvent('alltime'), {}) as { statusCode: number; body: string }).statusCode).toBe(200); });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DynamoDB routing — correct table queried per period
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — DynamoDB table routing', () => {
  test('daily period queries lms-leaderboard-daily', async () => {
    await handler(makeEvent('daily'), {});
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.TableName).toBe('lms-leaderboard-daily');
  });

  test('monthly period queries lms-leaderboard-monthly', async () => {
    await handler(makeEvent('monthly'), {});
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.TableName).toBe('lms-leaderboard-monthly');
  });

  test('alltime period queries lms-leaderboard-global', async () => {
    await handler(makeEvent('alltime'), {});
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.TableName).toBe('lms-leaderboard-global');
  });

  test('results sorted descending (ScanIndexForward=false)', async () => {
    await handler(makeEvent('alltime'), {});
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.ScanIndexForward).toBe(false);
  });

  test('limit capped at 20', async () => {
    await handler(makeEvent('alltime'), {});
    expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.Limit).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// response shape
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — response shape', () => {
  test('entries array has correct length', async () => {
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    expect(entries).toHaveLength(3);
  });

  test('rank starts at 1 and increments correctly', async () => {
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    expect(entries[0].rank).toBe(1);
    expect(entries[1].rank).toBe(2);
    expect(entries[2].rank).toBe(3);
  });

  test('isCurrentUser flag set correctly', async () => {
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    expect(entries[0].isCurrentUser).toBe(false);
    expect(entries[1].isCurrentUser).toBe(true);
    expect(entries[2].isCurrentUser).toBe(false);
  });

  test('avatarInitial derived from displayName', async () => {
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    expect(entries[0].avatarInitial).toBe('A');
    expect(entries[1].avatarInitial).toBe('M');
  });

  test('fallback name used when displayName missing', async () => {
    ddbMock.reset();
    ddbMock.on(QueryCommand).resolves({ Items: [{ userId: 'user-xyz', score: 100 }] });
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    expect(entries[0].name).toMatch(/^User-/);
  });

  test('entry contains score, coins, xp, streak, quizzesCompleted', async () => {
    const { entries } = JSON.parse((await handler(makeEvent(), {}) as { body: string }).body);
    const e = entries[0];
    expect(typeof e.score).toBe('number');
    expect(typeof e.coins).toBe('number');
    expect(typeof e.xp).toBe('number');
    expect(typeof e.streak).toBe('number');
    expect(typeof e.quizzesCompleted).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// response headers
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — response headers', () => {
  test('Cache-Control set to max-age=60 on 200', async () => {
    const res = await handler(makeEvent(), {}) as { headers: Record<string, string> };
    expect(res.headers['Cache-Control']).toBe('max-age=60');
  });

  test('CORS header present on 200', async () => {
    const res = await handler(makeEvent(), {}) as { headers: Record<string, string> };
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// empty leaderboard
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — empty leaderboard', () => {
  test('returns empty entries array when no data', async () => {
    ddbMock.reset();
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const res = await handler(makeEvent(), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).entries).toEqual([]);
  });
});
