/**
 * streakProcessor Lambda
 * ──────────────────────
 * Triggered by EventBridge rule: lms.quiz.submitted
 * Calculates and updates user's daily streak in lms-user-statistics.
 *
 * Event payload (detail):
 *   { userId, quizId, score, totalQuestions, pct, passed, completedAt, timeTaken }
 */

import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_STATISTICS_TABLE = process.env.USER_STATISTICS_TABLE ?? 'lms-user-statistics';

export interface QuizSubmittedEvent {
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  pct: number;
  passed: boolean;
  completedAt: string; // ISO string
  timeTaken: number;
}

function toDateStr(isoDate: string): string {
  return isoDate.slice(0, 10); // YYYY-MM-DD
}

function yesterday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const handler = async (
  event: EventBridgeEvent<'lms.quiz.submitted', QuizSubmittedEvent>,
): Promise<void> => {
  const { userId, completedAt } = event.detail;
  const todayStr = toDateStr(completedAt);

  // Fetch current statistics to get lastActiveAt for streak calculation
  const { Item: stats } = await ddb.send(new GetCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
  }));

  const lastActiveAt: string | null = stats?.lastActiveAt ?? null;
  const lastDateStr = lastActiveAt ? toDateStr(lastActiveAt) : null;

  // Streak logic:
  // - Same day → no change (already counted by quizSubmit Lambda)
  // - Yesterday → streak continued (already handled by quizSubmit)
  // - Anything else → already handled, streakProcessor just validates & sets reset flag
  // Primary streak update is in quizSubmit; this processor does extended validation.
  let currentStreak: number = stats?.currentStreak ?? 0;
  let longestStreak: number = stats?.longestStreak ?? 0;

  if (lastDateStr === null) {
    // First quiz ever
    currentStreak = 1;
  } else if (lastDateStr === todayStr) {
    // Already played today — no change needed
    return;
  } else if (lastDateStr === yesterday(todayStr)) {
    // Consecutive day
    currentStreak += 1;
  } else {
    // Streak broken
    currentStreak = 1;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  await ddb.send(new UpdateCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
    UpdateExpression: 'SET currentStreak = :streak, longestStreak = :longest',
    ExpressionAttributeValues: {
      ':streak':  currentStreak,
      ':longest': longestStreak,
    },
  }));

  console.log(`[streakProcessor] userId=${userId} streak=${currentStreak} longest=${longestStreak}`);
};
