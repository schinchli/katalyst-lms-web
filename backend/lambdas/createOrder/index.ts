/**
 * createOrder Lambda
 * ──────────────────
 * POST /payment/create-order
 * Headers: Authorization: <Cognito ID Token>
 *
 * Body: {
 *   purchaseType: 'subscription' | 'course'
 *   plan?:        'annual' | 'monthly'     — required when purchaseType = 'subscription'
 *   courseId?:    string                   — required when purchaseType = 'course'
 *   amount:       number                   — paise
 *   currency?:    string
 * }
 *
 * Creates a Razorpay order and returns the order details to the client.
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import * as https from 'https';

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID ?? '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type':                 'application/json',
};

// ── Input schema ─────────────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  purchaseType: z.enum(['subscription', 'course']),
  plan:         z.enum(['annual', 'monthly']).optional(),
  courseId:     z.string().optional(),
  amount:       z.number().int().positive(),    // paise
  currency:     z.string().default('INR'),
});

// ── Razorpay API call ─────────────────────────────────────────────────────────

async function razorpayCreateOrder(
  amount: number,
  currency: string,
  receipt: string,
): Promise<{ id: string; amount: number; currency: string }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ amount, currency, receipt });
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const options = {
      hostname: 'api.razorpay.com',
      path:     '/v1/orders',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Razorpay error: ${data}`));
          }
        } catch {
          reject(new Error('Failed to parse Razorpay response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  // Auth check
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Parse + validate body
  let parsed;
  try {
    parsed = CreateOrderSchema.parse(JSON.parse(event.body ?? '{}'));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const receiptSuffix = parsed.purchaseType === 'course' && parsed.courseId
    ? `course-${parsed.courseId.slice(0, 20)}`
    : `sub-${parsed.plan ?? 'annual'}`;
  const receipt = `katalyst-${receiptSuffix}-${userId.slice(0, 8)}-${Date.now()}`;

  try {
    const order = await razorpayCreateOrder(parsed.amount, parsed.currency, receipt);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        orderId:      order.id,
        amount:       order.amount,
        currency:     order.currency,
        keyId:        RAZORPAY_KEY_ID,
        purchaseType: parsed.purchaseType,
        plan:         parsed.plan,
        courseId:     parsed.courseId,
      }),
    };
  } catch (err) {
    console.error('[createOrder] Razorpay error:', err);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Payment provider error. Please try again.' }),
    };
  }
};
