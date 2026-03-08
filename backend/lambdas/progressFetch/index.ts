/**
 * progressFetch Lambda
 * ────────────────────
 * GET /progress
 * Headers: Authorization: Bearer <Cognito ID Token>
 *
 * Returns: {
 *   statistics: UserStatistics
 *   recentAttempts: QuizAttempt[]  (last 10)
 * }
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const QUIZ_ATTEMPTS_TABLE   = process.env.QUIZ_ATTEMPTS_TABLE   ?? 'lms-quiz-attempts';
const USER_STATISTICS_TABLE = process.env.USER_STATISTICS_TABLE ?? 'lms-user-statistics';

// ── Response helpers ──────────────────────────────────────────────────────────

function ok(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

// ── Handler ───────────────────────────────────────────────────────────────────

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  if (!userId) return err(401, 'Unauthorized');

  // Fetch statistics and recent attempts in parallel
  const [statsResult, attemptsResult] = await Promise.all([
    ddb.send(new GetCommand({
      TableName: USER_STATISTICS_TABLE,
      Key: { userId },
    })),
    ddb.send(new QueryCommand({
      TableName:              QUIZ_ATTEMPTS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward:       false,  // newest first
      Limit:                  10,
    })),
  ]);

  const statistics = statsResult.Item ?? {
    userId,
    totalQuizzes:  0,
    totalCoins:    0,
    totalXP:       0,
    totalCorrect:  0,
    totalAnswered: 0,
    lastActiveAt:  null,
  };

  const recentAttempts = attemptsResult.Items ?? [];

  return ok({ statistics, recentAttempts });
};
