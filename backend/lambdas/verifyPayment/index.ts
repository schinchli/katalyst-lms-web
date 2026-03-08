/**
 * verifyPayment Lambda
 * ─────────────────────
 * POST /payment/verify
 * Headers: Authorization: <Cognito ID Token>
 *
 * Body: {
 *   razorpay_payment_id: string
 *   razorpay_order_id:   string
 *   razorpay_signature:  string
 *   purchaseType:        'subscription' | 'course'
 *   plan?:               'annual' | 'monthly'
 *   courseId?:           string
 * }
 *
 * 1. Verifies HMAC-SHA256 signature
 * 2. Writes purchase record to DynamoDB lms-purchases table
 * 3a. If subscription: updates Cognito custom:subscription = 'premium'
 * 3b. If course: appends courseId to Cognito custom:unlockedCourses JSON array
 * 4. Emits EventBridge event lms.purchase.completed
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createHmac, randomUUID } from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { z } from 'zod';

const RAZORPAY_KEY_SECRET  = process.env.RAZORPAY_KEY_SECRET ?? '';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';
const PURCHASES_TABLE      = process.env.DYNAMODB_TABLE_PURCHASES ?? 'lms-purchases';
const EVENT_BUS_NAME       = process.env.EVENT_BUS_NAME ?? 'lms-events';

const cognito  = new CognitoIdentityProviderClient({});
const dynamo   = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBus = new EventBridgeClient({});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type':                 'application/json',
};

// ── Input schema ─────────────────────────────────────────────────────────────

const VerifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
  purchaseType:        z.enum(['subscription', 'course']),
  plan:                z.enum(['annual', 'monthly']).optional(),
  courseId:            z.string().optional(),
  amount:              z.number().int().positive().optional(),
});

// ── Signature verification ────────────────────────────────────────────────────

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const payload  = `${orderId}|${paymentId}`;
  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return expected === signature;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  // Auth check
  const userId    = event.requestContext.authorizer?.claims?.sub;
  const userEmail = event.requestContext.authorizer?.claims?.email;
  if (!userId || !userEmail) {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Parse + validate body
  let parsed;
  try {
    parsed = VerifySchema.parse(JSON.parse(event.body ?? '{}'));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  // Verify Razorpay signature
  const valid = verifyRazorpaySignature(
    parsed.razorpay_order_id,
    parsed.razorpay_payment_id,
    parsed.razorpay_signature,
  );

  if (!valid) {
    console.warn('[verifyPayment] Invalid signature for user:', userId);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Payment signature verification failed' }),
    };
  }

  const purchaseId = randomUUID();

  // Write purchase record to DynamoDB
  try {
    await dynamo.send(new PutCommand({
      TableName: PURCHASES_TABLE,
      Item: {
        PK:                 userId,
        SK:                 purchaseId,
        purchaseType:       parsed.purchaseType,
        courseId:           parsed.courseId ?? null,
        plan:               parsed.plan ?? null,
        amount:             parsed.amount ?? 0,
        razorpayPaymentId:  parsed.razorpay_payment_id,
        razorpayOrderId:    parsed.razorpay_order_id,
        status:             'completed',
        createdAt:          new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.error('[verifyPayment] DynamoDB write failed:', err);
    // Non-fatal — continue with Cognito update
  }

  let unlockedCourses: string[] | undefined;
  let subscription: string | undefined;

  if (COGNITO_USER_POOL_ID) {
    try {
      if (parsed.purchaseType === 'subscription') {
        // Update subscription attribute
        await cognito.send(new AdminUpdateUserAttributesCommand({
          UserPoolId:     COGNITO_USER_POOL_ID,
          Username:       userEmail,
          UserAttributes: [{ Name: 'custom:subscription', Value: 'premium' }],
        }));
        subscription = 'premium';
      } else if (parsed.purchaseType === 'course' && parsed.courseId) {
        // Read existing unlocked courses
        let existing: string[] = [];
        try {
          const userResp = await cognito.send(new AdminGetUserCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username:   userEmail,
          }));
          const attr = userResp.UserAttributes?.find((a) => a.Name === 'custom:unlockedCourses');
          if (attr?.Value) existing = JSON.parse(attr.Value) as string[];
        } catch {
          // If attribute doesn't exist yet, start with empty array
        }

        const updated = [...new Set([...existing, parsed.courseId])];
        await cognito.send(new AdminUpdateUserAttributesCommand({
          UserPoolId:     COGNITO_USER_POOL_ID,
          Username:       userEmail,
          UserAttributes: [{ Name: 'custom:unlockedCourses', Value: JSON.stringify(updated) }],
        }));
        unlockedCourses = updated;
      }
    } catch (err) {
      // Log but don't fail — client will also persist locally
      console.error('[verifyPayment] Cognito update failed:', err);
    }
  }

  // Emit EventBridge event
  try {
    await eventBus.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EVENT_BUS_NAME,
        Source:       'lms',
        DetailType:   'lms.purchase.completed',
        Detail: JSON.stringify({
          userId,
          purchaseId,
          purchaseType:      parsed.purchaseType,
          courseId:          parsed.courseId,
          plan:              parsed.plan,
          razorpayPaymentId: parsed.razorpay_payment_id,
        }),
      }],
    }));
  } catch (err) {
    console.error('[verifyPayment] EventBridge emit failed:', err);
  }

  console.info('[verifyPayment] Purchase completed for user:', userId, '| type:', parsed.purchaseType);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      verified:        true,
      purchaseId,
      purchaseType:    parsed.purchaseType,
      courseId:        parsed.courseId,
      unlockedCourses,
      subscription,
      paymentId:       parsed.razorpay_payment_id,
    }),
  };
};
