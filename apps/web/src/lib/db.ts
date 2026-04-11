/**
 * db.ts — Supabase CRUD helpers
 * All dashboard data (quiz results, profile, subscription, purchases) goes through here.
 * localStorage is kept as an offline/unauthenticated fallback.
 */

import { supabase } from './supabase';
import type { QuizResult } from '@/types';

export interface PurchaseRecord {
  id:           string;
  purchaseType: 'subscription' | 'course';
  courseId?:    string;
  courseName?:  string;
  plan?:        string;
  amount:       number;
  date:         string;
}

// ── Quiz Results ────────────────────────────────────────────────────────────

export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('quiz_id, score, total_questions, time_taken, answers, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    quizId:         row.quiz_id as string,
    score:          row.score as number,
    totalQuestions: row.total_questions as number,
    timeTaken:      row.time_taken as number,
    answers:        row.answers as Record<string, string>,
    completedAt:    row.completed_at as string,
  }));
}

export async function saveQuizResult(userId: string, result: QuizResult): Promise<void> {
  await supabase.from('quiz_results').upsert(
    {
      user_id:         userId,
      quiz_id:         result.quizId,
      score:           result.score,
      total_questions: result.totalQuestions,
      time_taken:      result.timeTaken,
      answers:         result.answers,
      completed_at:    result.completedAt,
    },
    { onConflict: 'user_id,quiz_id' },
  );
}

export async function deleteAllQuizResults(userId: string): Promise<void> {
  await supabase.from('quiz_results').delete().eq('user_id', userId);
}

// ── User Profile ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<{ name: string; role: string } | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('name, role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return { name: (data.name as string) ?? '', role: (data.role as string) ?? 'Student' };
}

export async function saveUserProfile(userId: string, profile: { name?: string; role?: string }): Promise<void> {
  await supabase.from('user_profiles').upsert(
    { id: userId, ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  );
}

// ── Subscription ────────────────────────────────────────────────────────────

export async function getSubscription(userId: string): Promise<{ tier: 'free' | 'premium'; plan?: string } | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, plan')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return { tier: data.tier as 'free' | 'premium', plan: (data.plan as string) ?? undefined };
}

export async function saveSubscription(userId: string, tier: 'free' | 'premium', plan?: string): Promise<void> {
  await supabase.from('subscriptions').upsert(
    {
      user_id:    userId,
      tier,
      plan:       plan ?? null,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

// ── Unlocked Courses ────────────────────────────────────────────────────────

export async function getUnlockedCourses(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('unlocked_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((row) => row.course_id as string);
}

export async function unlockCourse(userId: string, courseId: string): Promise<void> {
  await supabase.from('unlocked_courses').upsert(
    { user_id: userId, course_id: courseId, unlocked_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' },
  );
}

// ── Purchases ───────────────────────────────────────────────────────────────

export async function getPurchases(userId: string): Promise<PurchaseRecord[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, purchase_type, course_id, course_name, plan, amount, purchased_at')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return data.map((row) => ({
    id:           row.id as string,
    purchaseType: row.purchase_type as 'subscription' | 'course',
    courseId:     (row.course_id as string) ?? undefined,
    courseName:   (row.course_name as string) ?? undefined,
    plan:         (row.plan as string) ?? undefined,
    amount:       row.amount as number,
    date:         row.purchased_at as string,
  }));
}

export async function recordPurchase(userId: string, purchase: Omit<PurchaseRecord, 'id'>): Promise<void> {
  await supabase.from('purchases').insert({
    user_id:       userId,
    purchase_type: purchase.purchaseType,
    course_id:     purchase.courseId ?? null,
    course_name:   purchase.courseName ?? null,
    plan:          purchase.plan ?? null,
    amount:        purchase.amount,
    purchased_at:  purchase.date,
  });
}

// ── localStorage Migration (run once on first login) ───────────────────────

const MIGRATION_KEY = 'learnkloud-migrated';

export async function migrateFromLocalStorage(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

  try {
    // 1. Quiz results
    const rawResults = localStorage.getItem('quiz-results');
    if (rawResults) {
      const results: QuizResult[] = JSON.parse(rawResults);
      await Promise.all(results.map((r) => saveQuizResult(userId, r)));
    }

    // 2. Profile
    const name = localStorage.getItem('profile-name');
    const role = localStorage.getItem('profile-role');
    if (name || role) {
      await saveUserProfile(userId, {
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
      });
    }

    // 3. Subscription
    const subRaw = localStorage.getItem('learnkloud-subscription');
    if (subRaw === 'premium') {
      await saveSubscription(userId, 'premium');
    }

    // 4. Unlocked courses
    const unlockedRaw = localStorage.getItem('learnkloud-unlocked-courses');
    if (unlockedRaw) {
      const courseIds: string[] = JSON.parse(unlockedRaw);
      await Promise.all(courseIds.map((courseId) => unlockCourse(userId, courseId)));
    }

    // 5. Purchases
    const purchasesRaw = localStorage.getItem('learnkloud-purchases');
    if (purchasesRaw) {
      const purchases: PurchaseRecord[] = JSON.parse(purchasesRaw);
      await Promise.all(purchases.map((p) => recordPurchase(userId, p)));
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch {
    // best-effort — never crash the app
  }
}
