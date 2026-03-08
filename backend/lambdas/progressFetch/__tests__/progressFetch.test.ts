/**
 * progressFetch Lambda — Unit Tests
 * ─────────────────────────────────
 * Tests: auth guard, happy path with data, empty state (new user), parallel fetch
 */

import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<unknown>;
};

function makeEvent(userId?: string): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'GET',
    requestContext: {
      authorizer: userId ? { claims: { sub: userId } } : undefined,
    } as unknown as APIGatewayProxyEvent['requestContext'],
    queryStringParameters: null,
  };
}

const MOCK_STATS = {
  userId:        'user-001',
  totalQuizzes:  5,
  totalCoins:    250,
  totalXP:       400,
  totalCorrect:  38,
  totalAnswered: 50,
  lastActiveAt:  '2025-03-01T10:00:00.000Z',
};

const MOCK_ATTEMPTS = [
  { userId: 'user-001', attemptId: 'a1', quizId: 'quiz-clf', score: 8, totalQuestions: 10, pct: 80 },
  { userId: 'user-001', attemptId: 'a2', quizId: 'quiz-saa', score: 7, totalQuestions: 10, pct: 70 },
];

beforeEach(() => {
  ddbMock.reset();
});

// ═══════════════════════════════════════════════════════════════════════════════
// auth guard
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — authentication', () => {
  test('returns 401 when no claims', async () => {
    const res = await handler(makeEvent(), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Unauthorized' });
  });

  test('CORS header present on 401', async () => {
    const res = await handler(makeEvent(), {}) as { headers: Record<string, string> };
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// happy path — user has data
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — user with existing data', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand).resolves({ Item: MOCK_STATS });
    ddbMock.on(QueryCommand).resolves({ Items: MOCK_ATTEMPTS });
  });

  test('returns 200 with statistics and recentAttempts', async () => {
    const res = await handler(makeEvent('user-001'), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.statistics).toMatchObject({ userId: 'user-001', totalQuizzes: 5 });
    expect(body.recentAttempts).toHaveLength(2);
  });

  test('statistics contains all expected fields', async () => {
    const res = await handler(makeEvent('user-001'), {}) as { statusCode: number; body: string };
    const { statistics } = JSON.parse(res.body);
    expect(statistics).toMatchObject({
      totalQuizzes:  5,
      totalCoins:    250,
      totalXP:       400,
      totalCorrect:  38,
      totalAnswered: 50,
    });
  });

  test('recentAttempts sorted newest-first (ScanIndexForward=false)', async () => {
    await handler(makeEvent('user-001'), {});
    const queryCall = ddbMock.commandCalls(QueryCommand)[0];
    expect(queryCall.args[0].input.ScanIndexForward).toBe(false);
  });

  test('query limited to 10 most recent attempts', async () => {
    await handler(makeEvent('user-001'), {});
    const queryCall = ddbMock.commandCalls(QueryCommand)[0];
    expect(queryCall.args[0].input.Limit).toBe(10);
  });

  test('GetCommand and QueryCommand called in parallel (both called once)', async () => {
    await handler(makeEvent('user-001'), {});
    expect(ddbMock).toHaveReceivedCommandTimes(GetCommand, 1);
    expect(ddbMock).toHaveReceivedCommandTimes(QueryCommand, 1);
  });

  test('CORS header present on 200', async () => {
    const res = await handler(makeEvent('user-001'), {}) as { headers: Record<string, string> };
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// new user — no data in DynamoDB
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — new user with no data', () => {
  beforeEach(() => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
  });

  test('returns 200 with zero-value statistics', async () => {
    const res = await handler(makeEvent('new-user'), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(200);
    const { statistics } = JSON.parse(res.body);
    expect(statistics.totalQuizzes).toBe(0);
    expect(statistics.totalCoins).toBe(0);
    expect(statistics.totalXP).toBe(0);
    expect(statistics.lastActiveAt).toBeNull();
  });

  test('returns empty recentAttempts array', async () => {
    const res = await handler(makeEvent('new-user'), {}) as { statusCode: number; body: string };
    const { recentAttempts } = JSON.parse(res.body);
    expect(recentAttempts).toEqual([]);
  });
});
