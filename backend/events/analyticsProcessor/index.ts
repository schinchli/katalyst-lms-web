/**
 * analyticsProcessor Lambda
 * ──────────────────────────
 * Triggered by EventBridge rule: lms.quiz.submitted
 * Upserts the user's leaderboard entry across daily, monthly, and global tables.
 *
 * Table schemas (from CDK DynamoDBTables construct):
 *   lms-leaderboard-daily   PK: date  (String, YYYY-MM-DD),  SK: score (Number)
 *   lms-leaderboard-monthly PK: month (String, YYYY-MM),     SK: score (Number)
 *   lms-leaderboard-global  PK: pk    (String, 'ALL'),        SK: score (Number)
 *
 * Strategy: Store the user's CUMULATIVE total score.
 * First delete the old entry (if it exists), then put the new one.
 */

import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { QuizSubmittedEvent } from '../streakProcessor/index';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const LEADERBOARD_DAILY_TABLE   = process.env.LEADERBOARD_DAILY_TABLE   ?? 'lms-leaderboard-daily';
const LEADERBOARD_MONTHLY_TABLE = process.env.LEADERBOARD_MONTHLY_TABLE ?? 'lms-leaderboard-monthly';
const LEADERBOARD_GLOBAL_TABLE  = process.env.LEADERBOARD_GLOBAL_TABLE  ?? 'lms-leaderboard-global';
const USER_STATISTICS_TABLE     = process.env.USER_STATISTICS_TABLE     ?? 'lms-user-statistics';

export const handler = async (
  event: EventBridgeEvent<'lms.quiz.submitted', QuizSubmittedEvent>,
): Promise<void> => {
  const { userId, pct, completedAt } = event.detail;

  // Fetch user's current cumulative stats
  const { Item: stats } = await ddb.send(new GetCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
  }));

  const displayName: string = stats?.displayName ?? `User-${userId.slice(0, 6)}`;
  const totalCoins: number  = stats?.totalCoins ?? 0;
  const totalXP: number     = stats?.totalXP ?? 0;

  // Cumulative score = total XP (increases monotonically)
  const newScore = totalXP;

  const dateStr  = completedAt.slice(0, 10); // YYYY-MM-DD
  const monthStr = completedAt.slice(0, 7);  // YYYY-MM

  async function upsert(tableName: string, pk: string, pkField: string) {
    // Find and delete the user's previous entry in this partition
    const existing = await ddb.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: `${pkField} = :pk`,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':pk': pk, ':uid': userId },
      Limit: 10,
    }));

    for (const item of (existing.Items ?? [])) {
      await ddb.send(new DeleteCommand({
        TableName: tableName,
        Key: { [pkField]: pk, score: item.score },
      }));
    }

    // Put new entry
    await ddb.send(new PutCommand({
      TableName: tableName,
      Item: {
        [pkField]:    pk,
        score:        newScore,
        userId,
        displayName,
        coins:        totalCoins,
        xp:           totalXP,
        pct,
        updatedAt:    completedAt,
      },
    }));
  }

  await Promise.all([
    upsert(LEADERBOARD_DAILY_TABLE,   dateStr,  'date'),
    upsert(LEADERBOARD_MONTHLY_TABLE, monthStr, 'month'),
    upsert(LEADERBOARD_GLOBAL_TABLE,  'ALL',    'pk'),
  ]);

  console.log(`[analyticsProcessor] userId=${userId} score=${newScore} date=${dateStr}`);
};
