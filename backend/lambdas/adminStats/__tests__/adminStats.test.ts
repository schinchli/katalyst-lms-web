/**
 * adminStats Lambda — Unit Tests
 */

import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler, aggregatePurchases } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<{
    statusCode: number;
    body: string;
  }>;
  aggregatePurchases: (items: unknown[]) => {
    totalRevenue: number;
    totalPurchases: number;
    subscriptions: number;
    courseUnlocks: number;
    recentPurchases: Array<{ createdAt: string; [key: string]: unknown }>;
  };
};

const MOCK_PURCHASES = [
  {
    PK: 'user-1', SK: 'purchase-1',
    purchaseType: 'subscription', plan: 'annual', amount: 99900,
    razorpayPaymentId: 'pay_1', razorpayOrderId: 'order_1',
    status: 'completed', createdAt: '2026-03-01T10:00:00Z',
  },
  {
    PK: 'user-2', SK: 'purchase-2',
    purchaseType: 'course', courseId: 'clf-c02-cloud-concepts', amount: 14900,
    razorpayPaymentId: 'pay_2', razorpayOrderId: 'order_2',
    status: 'completed', createdAt: '2026-03-02T09:00:00Z',
  },
  {
    PK: 'user-3', SK: 'purchase-3',
    purchaseType: 'course', courseId: 'clf-c02-security', amount: 19900,
    razorpayPaymentId: 'pay_3', razorpayOrderId: 'order_3',
    status: 'completed', createdAt: '2026-03-02T11:00:00Z',
  },
  {
    PK: 'user-4', SK: 'purchase-4',
    purchaseType: 'subscription', plan: 'monthly', amount: 14900,
    razorpayPaymentId: 'pay_4', razorpayOrderId: 'order_4',
    status: 'pending', createdAt: '2026-03-02T12:00:00Z',  // not completed
  },
];

beforeEach(() => { ddbMock.reset(); });

// ── aggregatePurchases unit tests ─────────────────────────────────────────────

describe('aggregatePurchases', () => {
  it('counts only completed purchases', () => {
    const stats = aggregatePurchases(MOCK_PURCHASES);
    expect(stats.totalPurchases).toBe(3);  // excludes pending
  });

  it('sums revenue from completed purchases only', () => {
    const stats = aggregatePurchases(MOCK_PURCHASES);
    expect(stats.totalRevenue).toBe(99900 + 14900 + 19900);
  });

  it('counts subscriptions correctly', () => {
    const stats = aggregatePurchases(MOCK_PURCHASES);
    expect(stats.subscriptions).toBe(1);
  });

  it('counts course unlocks correctly', () => {
    const stats = aggregatePurchases(MOCK_PURCHASES);
    expect(stats.courseUnlocks).toBe(2);
  });

  it('returns recentPurchases sorted by createdAt desc (max 20)', () => {
    const stats = aggregatePurchases(MOCK_PURCHASES);
    expect(stats.recentPurchases[0].createdAt).toBe('2026-03-02T11:00:00Z');
    expect(stats.recentPurchases.length).toBeLessThanOrEqual(20);
  });

  it('handles empty purchase list', () => {
    const stats = aggregatePurchases([]);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalPurchases).toBe(0);
    expect(stats.subscriptions).toBe(0);
    expect(stats.courseUnlocks).toBe(0);
    expect(stats.recentPurchases).toHaveLength(0);
  });
});

// ── handler integration tests ─────────────────────────────────────────────────

describe('handler', () => {
  it('returns aggregated stats on success', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: MOCK_PURCHASES });

    const res = await handler({} as Partial<APIGatewayProxyEvent>, {} as Partial<Context>);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.totalPurchases).toBe(3);
    expect(body.totalRevenue).toBe(99900 + 14900 + 19900);
    expect(body.subscriptions).toBe(1);
    expect(body.courseUnlocks).toBe(2);
    expect(Array.isArray(body.recentPurchases)).toBe(true);
  });

  it('returns 500 when DynamoDB scan fails', async () => {
    ddbMock.on(ScanCommand).rejects(new Error('DynamoDB error'));

    const res = await handler({} as Partial<APIGatewayProxyEvent>, {} as Partial<Context>);
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toHaveProperty('error');
  });

  it('returns empty stats when no purchases exist', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });

    const res = await handler({} as Partial<APIGatewayProxyEvent>, {} as Partial<Context>);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.totalPurchases).toBe(0);
    expect(body.totalRevenue).toBe(0);
  });

  it('includes CORS headers', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });
    const res = await handler({} as Partial<APIGatewayProxyEvent>, {} as Partial<Context>);
    expect(res.statusCode).toBe(200);
  });
});
