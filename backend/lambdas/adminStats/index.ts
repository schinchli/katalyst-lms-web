/**
 * adminStats Lambda
 * ──────────────────
 * GET /admin/stats
 * Protected at API Gateway level (not at Lambda level here).
 *
 * Scans lms-purchases table and returns aggregated revenue stats.
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const PURCHASES_TABLE = process.env.DYNAMODB_TABLE_PURCHASES ?? 'lms-purchases';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type':                 'application/json',
};

export interface Purchase {
  PK: string;
  SK: string;
  purchaseType: 'subscription' | 'course';
  courseId?: string;
  plan?: string;
  amount: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalPurchases: number;
  subscriptions: number;
  courseUnlocks: number;
  recentPurchases: Purchase[];
}

// ── Exported for testability ──────────────────────────────────────────────────

export function aggregatePurchases(items: Purchase[]): AdminStats {
  const completed = items.filter((p) => p.status === 'completed');

  return {
    totalRevenue:    completed.reduce((sum, p) => sum + (p.amount ?? 0), 0),
    totalPurchases:  completed.length,
    subscriptions:   completed.filter((p) => p.purchaseType === 'subscription').length,
    courseUnlocks:   completed.filter((p) => p.purchaseType === 'course').length,
    recentPurchases: completed
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export const handler: APIGatewayProxyHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamo.send(new ScanCommand({ TableName: PURCHASES_TABLE }));
    const items  = (result.Items ?? []) as Purchase[];
    const stats  = aggregatePurchases(items);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(stats),
    };
  } catch (err) {
    console.error('[adminStats] DynamoDB scan failed:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch stats' }),
    };
  }
};
