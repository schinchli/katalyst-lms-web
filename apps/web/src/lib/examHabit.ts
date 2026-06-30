/**
 * Exam-habit study planner logic — readiness scoring + streaks.
 * Ported from mobile/utils/examHabit.ts (shared algorithm; kept in sync).
 */
import type { LearningPath } from '@/data/learningPaths';
import type { QuizResult } from '@/types';

export type StudyEffort = 'light' | 'focused' | 'deep';

export interface StudySession {
  id: string;
  dateKey: string;
  minutes: number;
  effort: StudyEffort;
  stepId?: string;
  note?: string;
  loggedAt: string;
}

export interface ExamHabitPlan {
  pathId: string;
  examDate: string;
  dailyMinutes: number;
  startedAt: string;
  sessions: StudySession[];
}

export interface ExamReadiness {
  score: number;
  status: 'needs_data' | 'on_track' | 'at_risk' | 'ready';
  statusLabel: string;
  summary: string;
  daysUntilExam: number;
  pathCompletion: number;
  adherence: number;
  consistency: number;
  averageQuizScore: number | null;
  averageDailyMinutes: number;
  projectedReadyDate: string | null;
  suggestedExamDate: string | null;
  shouldPushDate: boolean;
}

const DAY_MS = 86_400_000;

function resultPercent(result: QuizResult): number {
  return result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).getTime();
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateKey(date = new Date()) {
  return formatDateKey(date);
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function isValidExamDate(dateKey: string, reference = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const timestamp = parseDateKey(dateKey);
  return Number.isFinite(timestamp)
    && formatDateKey(new Date(timestamp)) === dateKey
    && timestamp >= parseDateKey(formatDateKey(reference));
}

export function studyStreak(sessions: StudySession[], referenceDateKey: string) {
  const days = new Set(sessions.map((session) => session.dateKey));
  let streak = 0;
  let cursor = referenceDateKey;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

interface ReadinessInput {
  plan: ExamHabitPlan;
  path: LearningPath;
  completedStepIds: string[];
  results: QuizResult[];
  referenceDateKey: string;
}

export function calculateExamReadiness({
  plan,
  path,
  completedStepIds,
  results,
  referenceDateKey,
}: ReadinessInput): ExamReadiness {
  const pathQuizIds = new Set(path.steps.filter((step) => step.type === 'quiz').map((step) => step.resourceId));
  const passedQuizIds = new Set(
    results
      .filter((result) => pathQuizIds.has(result.quizId) && resultPercent(result) >= 70)
      .map((result) => result.quizId),
  );
  const completedIds = new Set(completedStepIds);
  const totalPathMinutes = Math.max(1, path.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0));
  const completedMinutes = path.steps.reduce((sum, step) => {
    const complete = step.type === 'quiz' ? passedQuizIds.has(step.resourceId) : completedIds.has(step.id);
    return sum + (complete ? step.estimatedMinutes : 0);
  }, 0);
  const pathCompletion = completedMinutes / totalPathMinutes;

  const startedDateKey = plan.startedAt.slice(0, 10);
  const activeDays = Math.max(1, Math.floor((parseDateKey(referenceDateKey) - parseDateKey(startedDateKey)) / DAY_MS) + 1);
  const relevantSessions = plan.sessions.filter((session) => session.dateKey >= startedDateKey && session.dateKey <= referenceDateKey);
  const loggedMinutes = relevantSessions.reduce((sum, session) => sum + session.minutes, 0);
  const studyDays = new Set(relevantSessions.map((session) => session.dateKey)).size;
  const adherence = Math.min(1, loggedMinutes / Math.max(1, plan.dailyMinutes * activeDays));
  const consistency = Math.min(1, studyDays / activeDays);
  const averageDailyMinutes = Math.round(loggedMinutes / activeDays);

  const quizResults = results.filter((result) => pathQuizIds.has(result.quizId));
  const averageQuizScore = quizResults.length
    ? Math.round(quizResults.reduce((sum, result) => sum + resultPercent(result), 0) / quizResults.length)
    : null;
  const quizSignal = averageQuizScore === null ? 0.5 : averageQuizScore / 100;
  const score = Math.round((pathCompletion * 0.45 + adherence * 0.25 + consistency * 0.15 + quizSignal * 0.15) * 100);

  const daysUntilExam = Math.max(0, Math.ceil((parseDateKey(plan.examDate) - parseDateKey(referenceDateKey)) / DAY_MS));
  const remainingMinutes = Math.max(0, totalPathMinutes - completedMinutes);
  const paceMinutes = averageDailyMinutes > 0 ? averageDailyMinutes : 0;
  const projectedDays = paceMinutes > 0 ? Math.ceil(remainingMinutes / paceMinutes) : null;
  const projectedReadyDate = projectedDays === null ? null : addDays(referenceDateKey, projectedDays);
  const readyByExam = projectedReadyDate !== null && parseDateKey(projectedReadyDate) <= parseDateKey(plan.examDate);
  const ready = pathCompletion >= 0.9 && (averageQuizScore ?? 0) >= 70;
  const shouldPushDate = !ready && (projectedReadyDate === null || !readyByExam || (daysUntilExam <= 14 && score < 60));
  const suggestedExamDate = shouldPushDate
    ? addDays(projectedReadyDate ?? referenceDateKey, 7)
    : null;

  if (ready) {
    return {
      score, status: 'ready', statusLabel: 'Exam ready',
      summary: 'Your path completion and quiz scores meet the readiness target.',
      daysUntilExam, pathCompletion, adherence, consistency, averageQuizScore,
      averageDailyMinutes, projectedReadyDate, suggestedExamDate: null, shouldPushDate: false,
    };
  }
  if (relevantSessions.length === 0) {
    return {
      score, status: 'needs_data', statusLabel: 'Building estimate',
      summary: 'Log today\'s study effort to start a reliable exam-date forecast.',
      daysUntilExam, pathCompletion, adherence, consistency, averageQuizScore,
      averageDailyMinutes, projectedReadyDate: null, suggestedExamDate: null, shouldPushDate: false,
    };
  }
  if (shouldPushDate) {
    return {
      score, status: 'at_risk', statusLabel: 'Date at risk',
      summary: `At your current pace, consider moving the exam to ${suggestedExamDate}.`,
      daysUntilExam, pathCompletion, adherence, consistency, averageQuizScore,
      averageDailyMinutes, projectedReadyDate, suggestedExamDate, shouldPushDate,
    };
  }
  return {
    score, status: 'on_track', statusLabel: 'On track',
    summary: `Your current pace projects readiness by ${projectedReadyDate}.`,
    daysUntilExam, pathCompletion, adherence, consistency, averageQuizScore,
    averageDailyMinutes, projectedReadyDate, suggestedExamDate: null, shouldPushDate: false,
  };
}
