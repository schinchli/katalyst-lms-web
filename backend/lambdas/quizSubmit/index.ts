/**
 * quizSubmit Lambda
 * ─────────────────
 * POST /quiz/submit
 * Headers: Authorization: Bearer <Cognito ID Token>
 *
 * Body: {
 *   quizId: string (uuid)
 *   answers: Record<string, string>  (questionId → answerId)
 *   timeTaken: number (seconds)
 *   score: number
 *   totalQuestions: number
 * }
 *
 * Writes to DynamoDB: lms-quiz-attempts + lms-user-statistics
 * Returns: { attemptId, score, totalQuestions, pct, passed, coinsEarned, xpEarned }
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eb  = new EventBridgeClient({});

const QUIZ_ATTEMPTS_TABLE   = process.env.QUIZ_ATTEMPTS_TABLE ?? 'lms-quiz-attempts';
const USER_STATISTICS_TABLE = process.env.USER_STATISTICS_TABLE ?? 'lms-user-statistics';
const EVENT_BUS_NAME        = process.env.EVENT_BUS_NAME ?? 'lms-events';
const PASS_THRESHOLD_PCT    = 70;

// ── Input schema ─────────────────────────────────────────────────────────────

const SubmissionSchema = z.object({
  quizId:         z.string().min(1),
  answers:        z.record(z.string()),
  timeTaken:      z.number().nonnegative(),
  score:          z.number().int().nonnegative(),
  totalQuestions: z.number().int().positive(),
  difficulty:     z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

// ── Reward calculation (must mirror mobile progressStore logic) ───────────────

export function calculateRewards(score: number, totalQuestions: number, difficulty: string = 'beginner') {
  const pct    = Math.round((score / totalQuestions) * 100);
  const passed = pct >= PASS_THRESHOLD_PCT;

  const diffMult = difficulty === 'advanced' ? 2 : difficulty === 'intermediate' ? 1.5 : 1;
  const coins    = passed
    ? score * 10
      + 20
      + (score === totalQuestions ? 50 : 0)
    : 0;
  const xp = passed ? Math.round(pct * diffMult) : 0;

  return { pct, passed, coins, xp };
}

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
  // 1. Auth — Cognito Authorizer injects claims
  const userId = event.requestContext.authorizer?.claims?.sub as string | undefined;
  if (!userId) return err(401, 'Unauthorized');

  // 2. Parse & validate body
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(event.body ?? '{}');
  } catch {
    return err(400, 'Invalid JSON body');
  }

  const parsed = SubmissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return err(400, `Validation error: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }

  const { quizId, answers, timeTaken, score, totalQuestions, difficulty } = parsed.data;
  const { pct, passed, coins, xp } = calculateRewards(score, totalQuestions, difficulty);

  const attemptId   = randomUUID();
  const completedAt = new Date().toISOString();

  // 3. Write quiz attempt
  await ddb.send(new PutCommand({
    TableName: QUIZ_ATTEMPTS_TABLE,
    Item: {
      userId,
      attemptId,
      quizId,
      answers,
      timeTaken,
      score,
      totalQuestions,
      pct,
      passed,
      completedAt,
    },
  }));

  // 4. Upsert user statistics (atomic increments)
  await ddb.send(new UpdateCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
    UpdateExpression: `
      ADD totalQuizzes     :one,
          totalCoins       :coins,
          totalXP          :xp,
          totalCorrect     :correct,
          totalAnswered    :total
      SET lastActiveAt     = :now
    `,
    ExpressionAttributeValues: {
      ':one':     1,
      ':coins':   coins,
      ':xp':      xp,
      ':correct': score,
      ':total':   totalQuestions,
      ':now':     completedAt,
    },
  }));

  // 5. Emit event for async processors (streak, badges, leaderboard)
  await eb.send(new PutEventsCommand({
    Entries: [{
      EventBusName: EVENT_BUS_NAME,
      Source:       'lms',
      DetailType:   'lms.quiz.submitted',
      Detail:       JSON.stringify({
        userId, quizId, score, totalQuestions, pct, passed, completedAt, timeTaken,
      }),
    }],
  }));

  // 6. Return result
  return ok({
    attemptId,
    quizId,
    score,
    totalQuestions,
    pct,
    passed,
    coinsEarned: coins,
    xpEarned:    xp,
    completedAt,
  });
};
