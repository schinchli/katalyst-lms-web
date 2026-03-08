/**
 * badgeProcessor Lambda
 * ─────────────────────
 * Triggered by EventBridge rule: lms.quiz.submitted
 * Evaluates badge conditions and awards new badges.
 * Badges stored as a JSON array in lms-user-statistics.badges
 *
 * Event payload (detail):
 *   { userId, quizId, score, totalQuestions, pct, passed, completedAt, timeTaken }
 */

import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { QuizSubmittedEvent } from '../streakProcessor/index';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_STATISTICS_TABLE = process.env.USER_STATISTICS_TABLE ?? 'lms-user-statistics';

// Badge definitions — must mirror mobile progressStore
type BadgeId =
  | 'first-quiz'
  | 'perfect-score'
  | 'seven-day-streak'
  | 'speed-demon'
  | 'category-master'
  | 'half-way'
  | 'quiz-marathon';

interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

const BADGE_META: Record<BadgeId, { name: string; description: string; icon: string }> = {
  'first-quiz':       { name: 'First Step',      description: 'Complete your first quiz',           icon: 'star' },
  'perfect-score':    { name: 'Perfect Score',   description: 'Score 100% on any quiz',             icon: 'award' },
  'seven-day-streak': { name: '7-Day Streak',    description: 'Practice 7 days in a row',           icon: 'zap' },
  'speed-demon':      { name: 'Speed Demon',     description: 'Finish a quiz in under 60 seconds',  icon: 'wind' },
  'category-master':  { name: 'Category Master', description: 'Complete all quizzes in a category', icon: 'layers' },
  'half-way':         { name: 'Half Way There',  description: 'Complete 6 or more quizzes',         icon: 'trending-up' },
  'quiz-marathon':    { name: 'Quiz Marathon',   description: 'Complete all 12 quizzes',            icon: 'flag' },
};

const TOTAL_QUIZ_COUNT = 13; // 12 core + 1 mega

export const handler = async (
  event: EventBridgeEvent<'lms.quiz.submitted', QuizSubmittedEvent>,
): Promise<void> => {
  const { userId, quizId, score, totalQuestions, passed, completedAt, timeTaken } = event.detail;

  // Load current user stats
  const { Item: stats } = await ddb.send(new GetCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
  }));

  const currentBadges: Badge[] = stats?.badges ?? [];
  const earned = new Set(currentBadges.map((b) => b.id));
  const totalQuizzes: number = stats?.totalQuizzes ?? 0;
  const currentStreak: number = stats?.currentStreak ?? 0;

  const newBadges: Badge[] = [];

  function award(id: BadgeId) {
    if (!earned.has(id)) {
      newBadges.push({ id, ...BADGE_META[id], earnedAt: completedAt });
      earned.add(id);
    }
  }

  // Evaluate badge conditions
  if (totalQuizzes === 1 && passed)                           award('first-quiz');
  if (score === totalQuestions)                               award('perfect-score');
  if (currentStreak >= 7)                                     award('seven-day-streak');
  if (timeTaken > 0 && timeTaken < 60 && passed)             award('speed-demon');
  if (totalQuizzes >= 6 && passed)                            award('half-way');
  if (totalQuizzes >= TOTAL_QUIZ_COUNT && passed)             award('quiz-marathon');
  // category-master requires a leaderboard/attempts query — omit for now

  if (newBadges.length === 0) return;

  const updatedBadges = [...currentBadges, ...newBadges];
  const badgeCoins = newBadges.length * 100;

  await ddb.send(new UpdateCommand({
    TableName: USER_STATISTICS_TABLE,
    Key: { userId },
    UpdateExpression: 'SET badges = :badges ADD totalCoins :coins',
    ExpressionAttributeValues: {
      ':badges': updatedBadges,
      ':coins':  badgeCoins,
    },
  }));

  console.log(`[badgeProcessor] userId=${userId} awarded=[${newBadges.map((b) => b.id).join(',')}]`);
};
