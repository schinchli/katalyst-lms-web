/**
 * verifyPayment Lambda — Unit Tests
 */

import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createHmac } from 'crypto';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const ddbMock     = mockClient(DynamoDBDocumentClient);
const cognitoMock = mockClient(CognitoIdentityProviderClient);
const ebMock      = mockClient(EventBridgeClient);

process.env.RAZORPAY_KEY_SECRET  = 'test-secret';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';
process.env.DYNAMODB_TABLE_PURCHASES = 'lms-purchases-test';
process.env.EVENT_BUS_NAME       = 'lms-events-test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler, verifyRazorpaySignature } = require('../index') as {
  handler: (event: Partial<APIGatewayProxyEvent>, ctx: Partial<Context>) => Promise<{
    statusCode: number;
    body: string;
  }>;
  verifyRazorpaySignature: (orderId: string, paymentId: string, signature: string) => boolean;
};

function makeSignature(orderId: string, paymentId: string): string {
  return createHmac('sha256', 'test-secret').update(`${orderId}|${paymentId}`).digest('hex');
}

function makeEvent(body: Record<string, unknown>, userId = 'user-abc', email = 'user@test.com'): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: 'POST',
    body: JSON.stringify(body),
    requestContext: {
      authorizer: { claims: { sub: userId, email } },
    } as unknown as APIGatewayProxyEvent['requestContext'],
  };
}

const VALID_ORDER_ID   = 'order_123';
const VALID_PAYMENT_ID = 'pay_456';
const VALID_SIGNATURE  = makeSignature(VALID_ORDER_ID, VALID_PAYMENT_ID);

beforeEach(() => {
  ddbMock.reset();
  cognitoMock.reset();
  ebMock.reset();
  ddbMock.on(PutCommand).resolves({});
  cognitoMock.on(AdminUpdateUserAttributesCommand).resolves({});
  cognitoMock.on(AdminGetUserCommand).resolves({ UserAttributes: [] });
  ebMock.on(PutEventsCommand).resolves({});
});

// ── verifyRazorpaySignature unit ──────────────────────────────────────────────

describe('verifyRazorpaySignature', () => {
  it('returns true for correct signature', () => {
    expect(verifyRazorpaySignature(VALID_ORDER_ID, VALID_PAYMENT_ID, VALID_SIGNATURE)).toBe(true);
  });

  it('returns false for wrong signature', () => {
    expect(verifyRazorpaySignature(VALID_ORDER_ID, VALID_PAYMENT_ID, 'bad-sig')).toBe(false);
  });
});

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('auth guard', () => {
  it('returns 401 when no userId', async () => {
    const res = await handler({ body: '{}', requestContext: {} as APIGatewayProxyEvent['requestContext'] }, {});
    expect(res.statusCode).toBe(401);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
  it('returns 400 for missing razorpay fields', async () => {
    const res = await handler(makeEvent({ purchaseType: 'subscription' }), {});
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid purchaseType', async () => {
    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'invalid',
    }), {});
    expect(res.statusCode).toBe(400);
  });
});

// ── Signature check ───────────────────────────────────────────────────────────

describe('signature verification', () => {
  it('returns 400 for invalid signature', async () => {
    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  'bad-signature',
      purchaseType:        'subscription',
      plan:                'annual',
      amount:              99900,
    }), {});
    expect(res.statusCode).toBe(400);
  });
});

// ── Subscription flow ─────────────────────────────────────────────────────────

describe('subscription purchase', () => {
  it('returns verified:true and updates Cognito subscription', async () => {
    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'subscription',
      plan:                'annual',
      amount:              99900,
    }), {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.verified).toBe(true);
    expect(body.purchaseType).toBe('subscription');
    expect(body.subscription).toBe('premium');

    expect(cognitoMock).toHaveReceivedCommandWith(AdminUpdateUserAttributesCommand, {
      UserAttributes: [{ Name: 'custom:subscription', Value: 'premium' }],
    });
  });

  it('writes purchase record to DynamoDB', async () => {
    await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'subscription',
      plan:                'monthly',
      amount:              14900,
    }), {});

    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: 'lms-purchases-test',
    });
  });

  it('emits EventBridge event', async () => {
    await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'subscription',
      plan:                'annual',
      amount:              99900,
    }), {});

    expect(ebMock).toHaveReceivedCommandWith(PutEventsCommand, {
      Entries: expect.arrayContaining([
        expect.objectContaining({ DetailType: 'lms.purchase.completed' }),
      ]),
    });
  });
});

// ── Course unlock flow ────────────────────────────────────────────────────────

describe('course unlock purchase', () => {
  it('returns verified:true with unlockedCourses', async () => {
    cognitoMock.on(AdminGetUserCommand).resolves({
      UserAttributes: [{ Name: 'custom:unlockedCourses', Value: '["clf-c02-security"]' }],
    });

    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'course',
      courseId:            'clf-c02-cloud-concepts',
      amount:              14900,
    }), {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.verified).toBe(true);
    expect(body.purchaseType).toBe('course');
    expect(body.courseId).toBe('clf-c02-cloud-concepts');
    expect(body.unlockedCourses).toContain('clf-c02-cloud-concepts');
    expect(body.unlockedCourses).toContain('clf-c02-security'); // previously unlocked
  });

  it('deduplicates courseId if already unlocked', async () => {
    cognitoMock.on(AdminGetUserCommand).resolves({
      UserAttributes: [{ Name: 'custom:unlockedCourses', Value: '["clf-c02-cloud-concepts"]' }],
    });

    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'course',
      courseId:            'clf-c02-cloud-concepts',
      amount:              14900,
    }), {});

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const count = body.unlockedCourses.filter((c: string) => c === 'clf-c02-cloud-concepts').length;
    expect(count).toBe(1);
  });

  it('updates Cognito unlockedCourses attribute', async () => {
    cognitoMock.on(AdminGetUserCommand).resolves({ UserAttributes: [] });

    await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'course',
      courseId:            'clf-c02-billing',
      amount:              14900,
    }), {});

    expect(cognitoMock).toHaveReceivedCommandWith(AdminUpdateUserAttributesCommand, {
      UserAttributes: [{ Name: 'custom:unlockedCourses', Value: JSON.stringify(['clf-c02-billing']) }],
    });
  });

  it('succeeds even when Cognito is not configured (no COGNITO_USER_POOL_ID)', async () => {
    const orig = process.env.COGNITO_USER_POOL_ID;
    process.env.COGNITO_USER_POOL_ID = '';

    const res = await handler(makeEvent({
      razorpay_payment_id: VALID_PAYMENT_ID,
      razorpay_order_id:   VALID_ORDER_ID,
      razorpay_signature:  VALID_SIGNATURE,
      purchaseType:        'course',
      courseId:            'clf-c02-billing',
      amount:              14900,
    }), {});

    expect(res.statusCode).toBe(200);
    process.env.COGNITO_USER_POOL_ID = orig;
  });
});
