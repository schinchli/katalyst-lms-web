/**
 * quizSubmit Lambda — Unit Tests
 * ─────────────────────────────
 * Tests: calculateRewards, input validation, DynamoDB writes, EventBridge emit, auth guard
 */

import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const ddbMock = mockClient(DynamoDBDocumentClient);
const ebMock  = mockClient(EventBridgeClient);

// ── Import handler AFTER mocks are set up ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler, calculateRewards } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<unknown>;
  calculateRewards: (score: number, total: number, difficulty?: string) => {
    pct: number; passed: boolean; coins: number; xp: number;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeEvent(overrides: Record<string, unknown> = {}): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'POST',
    body: JSON.stringify({
      quizId:         'quiz-aws-clf-c02',
      answers:        { q1: 'a', q2: 'b' },
      timeTaken:      300,
      score:          8,
      totalQuestions: 10,
      difficulty:     'beginner',
    }),
    requestContext: {
      authorizer: { claims: { sub: 'user-001' } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
    ...overrides,
  };
}

beforeEach(() => {
  ddbMock.reset();
  ebMock.reset();
  ddbMock.on(PutCommand).resolves({});
  ddbMock.on(UpdateCommand).resolves({});
  ebMock.on(PutEventsCommand).resolves({});
});

// ═══════════════════════════════════════════════════════════════════════════════
// calculateRewards — pure function tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('calculateRewards', () => {
  test('beginner 100% → passes, correct coins + xp', () => {
    const r = calculateRewards(10, 10, 'beginner');
    expect(r.pct).toBe(100);
    expect(r.passed).toBe(true);
    expect(r.coins).toBe(10 * 10 + 20 + 50); // 170
    expect(r.xp).toBe(100);
  });

  test('intermediate 80% → passes, 1.5× xp multiplier', () => {
    const r = calculateRewards(8, 10, 'intermediate');
    expect(r.pct).toBe(80);
    expect(r.passed).toBe(true);
    expect(r.coins).toBe(8 * 10 + 20); // 100
    expect(r.xp).toBe(Math.round(80 * 1.5)); // 120
  });

  test('advanced 70% → passes (boundary), 2× xp multiplier', () => {
    const r = calculateRewards(7, 10, 'advanced');
    expect(r.pct).toBe(70);
    expect(r.passed).toBe(true);
    expect(r.coins).toBe(7 * 10 + 20); // 90
    expect(r.xp).toBe(Math.round(70 * 2)); // 140
  });

  test('69% → fails, 0 coins, 0 xp', () => {
    const r = calculateRewards(69, 100, 'beginner');
    expect(r.passed).toBe(false);
    expect(r.coins).toBe(0);
    expect(r.xp).toBe(0);
  });

  test('0 score → fails', () => {
    const r = calculateRewards(0, 10, 'intermediate');
    expect(r.pct).toBe(0);
    expect(r.passed).toBe(false);
  });

  test('defaults to beginner multiplier when difficulty omitted', () => {
    const withDefault  = calculateRewards(10, 10);
    const withBeginner = calculateRewards(10, 10, 'beginner');
    expect(withDefault).toEqual(withBeginner);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// handler — auth
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — authentication', () => {
  test('returns 401 when no authorizer claims', async () => {
    const event = makeEvent({
      requestContext: { authorizer: undefined } as unknown as APIGatewayProxyEvent['requestContext'],
    });
    const res = await handler(event, {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toMatchObject({ error: 'Unauthorized' });
  });

  test('returns 401 when sub is missing from claims', async () => {
    const event = makeEvent({
      requestContext: {
        authorizer: { claims: {} },
      } as unknown as APIGatewayProxyEvent['requestContext'],
    });
    const res = await handler(event, {}) as { statusCode: number };
    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// handler — validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — input validation', () => {
  test('returns 400 on invalid JSON body', async () => {
    const event = makeEvent({ body: 'not-json' });
    const res = await handler(event, {}) as { statusCode: number };
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when quizId is missing', async () => {
    const body = { answers: {}, timeTaken: 60, score: 5, totalQuestions: 10 };
    const event = makeEvent({ body: JSON.stringify(body) });
    const res = await handler(event, {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Validation error/);
  });

  test('returns 400 when score is negative', async () => {
    const body = { quizId: 'q1', answers: {}, timeTaken: 60, score: -1, totalQuestions: 10 };
    const event = makeEvent({ body: JSON.stringify(body) });
    const res = await handler(event, {}) as { statusCode: number };
    expect(res.statusCode).toBe(400);
  });

  test('returns 400 when totalQuestions is zero', async () => {
    const body = { quizId: 'q1', answers: {}, timeTaken: 60, score: 0, totalQuestions: 0 };
    const event = makeEvent({ body: JSON.stringify(body) });
    const res = await handler(event, {}) as { statusCode: number };
    expect(res.statusCode).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// handler — happy path
// ═══════════════════════════════════════════════════════════════════════════════

describe('handler — successful submission', () => {
  test('returns 200 with correct shape', async () => {
    const res = await handler(makeEvent(), {}) as { statusCode: number; body: string };
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toMatchObject({
      quizId:         'quiz-aws-clf-c02',
      score:          8,
      totalQuestions: 10,
      pct:            80,
      passed:         true,
    });
    expect(body.attemptId).toBeDefined();
    expect(body.completedAt).toBeDefined();
    expect(typeof body.coinsEarned).toBe('number');
    expect(typeof body.xpEarned).toBe('number');
  });

  test('PutCommand called once (quiz attempt written)', async () => {
    await handler(makeEvent(), {});
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 1);
  });

  test('UpdateCommand called once (user statistics upserted)', async () => {
    await handler(makeEvent(), {});
    expect(ddbMock).toHaveReceivedCommandTimes(UpdateCommand, 1);
  });

  test('EventBridge PutEventsCommand called with correct source + detail-type', async () => {
    await handler(makeEvent(), {});
    expect(ebMock).toHaveReceivedCommandTimes(PutEventsCommand, 1);
    const call = ebMock.commandCalls(PutEventsCommand)[0];
    const entry = call.args[0].input.Entries?.[0];
    expect(entry?.Source).toBe('lms');
    expect(entry?.DetailType).toBe('lms.quiz.submitted');
  });

  test('EventBridge detail contains userId + quizId', async () => {
    await handler(makeEvent(), {});
    const call = ebMock.commandCalls(PutEventsCommand)[0];
    const detail = JSON.parse(call.args[0].input.Entries?.[0]?.Detail ?? '{}');
    expect(detail.userId).toBe('user-001');
    expect(detail.quizId).toBe('quiz-aws-clf-c02');
  });

  test('CORS header present on 200', async () => {
    const res = await handler(makeEvent(), {}) as { headers: Record<string, string> };
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  test('CORS header present on 401', async () => {
    const event = makeEvent({
      requestContext: { authorizer: undefined } as unknown,
    });
    const res = await handler(event, {}) as { headers: Record<string, string> };
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
