/**
 * leaderboardFetch Lambda
 * ───────────────────────
 * GET /leaderboard?period=daily|monthly|alltime
 * Headers: Authorization: Bearer <Cognito ID Token>
 *
 * Returns top-20 entries for the requested period.
 *
 * Table schemas (from CDK DynamoDBTables construct):
 *   lms-leaderboard-daily   PK: date  (String),  SK: score (Number)
 *   lms-leaderboard-monthly PK: month (String),  SK: score (Number)
 *   lms-leaderboard-global  PK: pk    (String),  SK: score (Number)
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const LEADERBOARD_DAILY_TABLE   = process.env.LEADERBOARD_DAILY_TABLE   ?? 'lms-leaderboard-daily';
const LEADERBOARD_MONTHLY_TABLE = process.env.LEADERBOARD_MONTHLY_TABLE ?? 'lms-leaderboard-monthly';
const LEADERBOARD_GLOBAL_TABLE  = process.env.LEADERBOARD_GLOBAL_TABLE  ?? 'lms-leaderboard-global';

type Period = 'daily' | 'monthly' | 'alltime';

function ok(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=60',
    },
    body: JSON.stringify(body),
  };
}

function err(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: message }),
  };
}

function getTableConfig(period: Period): { tableName: string; pk: string; pkField: string } {
  const now = new Date().toISOString();
  switch (period) {
    case 'daily':
      return { tableName: LEADERBOARD_DAILY_TABLE,   pk: now.slice(0, 10), pkField: 'date' };
    case 'monthly':
      return { tableName: LEADERBOARD_MONTHLY_TABLE, pk: now.slice(0, 7),  pkField: 'month' };
    case 'alltime':
    default:
      return { tableName: LEADERBOARD_GLOBAL_TABLE,  pk: 'ALL',            pkField: 'pk' };
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  if (!userId) return err(401, 'Unauthorized');

  const period = (event.queryStringParameters?.period ?? 'alltime') as Period;
  if (!['daily', 'monthly', 'alltime'].includes(period)) {
    return err(400, 'Invalid period. Use daily, monthly, or alltime');
  }

  const { tableName, pk, pkField } = getTableConfig(period);

  // Query top-20, sorted by score descending
  const result = await ddb.send(new QueryCommand({
    TableName:              tableName,
    KeyConditionExpression: `${pkField} = :pk`,
    ExpressionAttributeValues: { ':pk': pk },
    ScanIndexForward:       false, // descending score
    Limit:                  20,
  }));

  const entries = (result.Items ?? []).map((item, idx) => ({
    rank:          idx + 1,
    userId:        item.userId,
    name:          item.displayName ?? `User-${(item.userId as string).slice(0, 6)}`,
    avatarInitial: ((item.displayName ?? 'U') as string)[0].toUpperCase(),
    score:         item.score ?? 0,
    coins:         item.coins ?? 0,
    xp:            item.xp ?? 0,
    streak:        item.streak ?? 0,
    quizzesCompleted: item.quizzesCompleted ?? 0,
    isCurrentUser: item.userId === userId,
  }));

  return ok({ period, entries, userRank: null });
};
