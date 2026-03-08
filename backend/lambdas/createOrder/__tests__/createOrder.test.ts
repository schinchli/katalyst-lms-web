/**
 * createOrder Lambda — Unit Tests
 */

import * as https from 'https';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock https.request before importing handler
jest.mock('https');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<{
    statusCode: number;
    body: string;
  }>;
};

function makeEvent(body: Record<string, unknown>, userId = 'user-123'): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'POST',
    body: JSON.stringify(body),
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
  };
}

function mockRazorpaySuccess() {
  const mockReq = {
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
  (https.request as jest.Mock).mockImplementation((_opts, callback) => {
    const res = {
      on: (event: string, cb: (chunk?: string) => void) => {
        if (event === 'data') cb(JSON.stringify({ id: 'order_abc123', amount: 99900, currency: 'INR' }));
        if (event === 'end') cb();
      },
      statusCode: 200,
    };
    callback(res);
    return mockReq;
  });
}

function mockRazorpayFailure() {
  const mockReq = {
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  };
  (https.request as jest.Mock).mockImplementation((_opts, callback) => {
    const res = {
      on: (event: string, cb: (chunk?: string) => void) => {
        if (event === 'data') cb(JSON.stringify({ error: 'Bad Request' }));
        if (event === 'end') cb();
      },
      statusCode: 400,
    };
    callback(res);
    return mockReq;
  });
}

beforeEach(() => { jest.clearAllMocks(); });

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('auth guard', () => {
  it('returns 401 when no auth context', async () => {
    const res = await handler({ body: '{}', requestContext: {} as APIGatewayProxyEvent['requestContext'] }, {});
    expect(res.statusCode).toBe(401);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
  it('returns 400 for missing purchaseType', async () => {
    const res = await handler(makeEvent({ amount: 99900 }), {});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid purchaseType', async () => {
    const res = await handler(makeEvent({ purchaseType: 'gift', amount: 99900 }), {});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for zero amount', async () => {
    const res = await handler(makeEvent({ purchaseType: 'subscription', plan: 'annual', amount: 0 }), {});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing amount', async () => {
    const res = await handler(makeEvent({ purchaseType: 'subscription', plan: 'annual' }), {});
    expect(res.statusCode).toBe(400);
  });
});

// ── Subscription order ────────────────────────────────────────────────────────

describe('subscription order', () => {
  it('creates annual subscription order', async () => {
    mockRazorpaySuccess();
    const res = await handler(makeEvent({ purchaseType: 'subscription', plan: 'annual', amount: 99900 }), {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.orderId).toBe('order_abc123');
    expect(body.purchaseType).toBe('subscription');
    expect(body.plan).toBe('annual');
  });

  it('creates monthly subscription order', async () => {
    mockRazorpaySuccess();
    const res = await handler(makeEvent({ purchaseType: 'subscription', plan: 'monthly', amount: 14900 }), {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.purchaseType).toBe('subscription');
    expect(body.plan).toBe('monthly');
  });
});

// ── Course unlock order ────────────────────────────────────────────────────────

describe('course unlock order', () => {
  it('creates course unlock order with courseId in response', async () => {
    mockRazorpaySuccess();
    const res = await handler(makeEvent({ purchaseType: 'course', courseId: 'clf-c02-cloud-concepts', amount: 14900 }), {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.purchaseType).toBe('course');
    expect(body.courseId).toBe('clf-c02-cloud-concepts');
    expect(body.orderId).toBe('order_abc123');
  });

  it('creates course unlock for full exam', async () => {
    mockRazorpaySuccess();
    const res = await handler(makeEvent({ purchaseType: 'course', courseId: 'clf-c02-full-exam', amount: 49900 }), {});
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.courseId).toBe('clf-c02-full-exam');
  });
});

// ── Razorpay error ────────────────────────────────────────────────────────────

describe('razorpay error handling', () => {
  it('returns 502 when Razorpay returns error status', async () => {
    mockRazorpayFailure();
    const res = await handler(makeEvent({ purchaseType: 'subscription', plan: 'annual', amount: 99900 }), {});
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body)).toHaveProperty('error');
  });
});
