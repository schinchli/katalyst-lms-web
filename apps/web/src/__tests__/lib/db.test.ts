/**
 * Tests for Supabase CRUD helpers (db.ts).
 * Uses thenable chain mocks that mirror Supabase's query builder pattern.
 */

import type { QuizResult } from '@/types';

// ── Build a thenable chainable query mock ──────────────────────────────────

function makeQueryChain(resolveValue: unknown) {
  const chain: Record<string, jest.Mock> & { then: jest.Mock; catch: jest.Mock } = {
    select:  jest.fn().mockReturnThis(),
    eq:      jest.fn().mockReturnThis(),
    order:   jest.fn().mockReturnThis(),
    limit:   jest.fn().mockReturnThis(),
    single:  jest.fn().mockResolvedValue(resolveValue),
    upsert:  jest.fn().mockResolvedValue(resolveValue),
    insert:  jest.fn().mockResolvedValue(resolveValue),
    delete:  jest.fn().mockReturnThis(),
    // Thenable so `await chain` resolves to resolveValue
    then:    jest.fn((resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve)),
    catch:   jest.fn((reject: (e: unknown) => unknown) => Promise.resolve(resolveValue).catch(reject)),
  };
  return chain;
}

const supabaseMock = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));

import {
  getQuizResults,
  saveQuizResult,
  deleteAllQuizResults,
  getUserProfile,
  saveUserProfile,
  getSubscription,
  saveSubscription,
  getUnlockedCourses,
  unlockCourse,
  getPurchases,
  recordPurchase,
} from '@/lib/db';

const USER_ID = 'user-abc-123';

const dbResultRow = {
  quiz_id:         'quiz-1',
  score:           8,
  total_questions: 10,
  time_taken:      120,
  answers:         { q1: 'a' },
  completed_at:    '2026-03-01T00:00:00Z',
};

const quizResult: QuizResult = {
  quizId:         'quiz-1',
  score:          8,
  totalQuestions: 10,
  timeTaken:      120,
  answers:        { q1: 'a' },
  completedAt:    '2026-03-01T00:00:00Z',
};

// ── Quiz Results ───────────────────────────────────────────────────────────

describe('getQuizResults', () => {
  it('returns mapped quiz results on success', async () => {
    const chain = makeQueryChain({ data: [dbResultRow], error: null });
    supabaseMock.from.mockReturnValue(chain);
    const results = await getQuizResults(USER_ID);
    expect(supabaseMock.from).toHaveBeenCalledWith('quiz_results');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ quizId: 'quiz-1', score: 8, totalQuestions: 10 });
  });

  it('returns empty array on Supabase error', async () => {
    const chain = makeQueryChain({ data: null, error: new Error('db error') });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getQuizResults(USER_ID)).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const chain = makeQueryChain({ data: null, error: null });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getQuizResults(USER_ID)).toEqual([]);
  });
});

describe('saveQuizResult', () => {
  it('calls upsert on quiz_results with correct mapped fields', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await saveQuizResult(USER_ID, quizResult);
    expect(supabaseMock.from).toHaveBeenCalledWith('quiz_results');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, quiz_id: 'quiz-1', score: 8, total_questions: 10 }),
      { onConflict: 'user_id,quiz_id' },
    );
  });
});

describe('deleteAllQuizResults', () => {
  it('calls delete on quiz_results table', async () => {
    const chain = makeQueryChain({ error: null });
    chain.delete.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    supabaseMock.from.mockReturnValue(chain);
    await deleteAllQuizResults(USER_ID);
    expect(supabaseMock.from).toHaveBeenCalledWith('quiz_results');
    expect(chain.delete).toHaveBeenCalled();
  });
});

// ── User Profile ───────────────────────────────────────────────────────────

describe('getUserProfile', () => {
  it('returns profile on success', async () => {
    const chain = makeQueryChain(null);
    chain.single.mockResolvedValue({ data: { name: 'Alice', role: 'Student' }, error: null });
    supabaseMock.from.mockReturnValue(chain);
    const profile = await getUserProfile(USER_ID);
    expect(profile).toEqual({ name: 'Alice', role: 'Student' });
  });

  it('returns null on error', async () => {
    const chain = makeQueryChain(null);
    chain.single.mockResolvedValue({ data: null, error: new Error('not found') });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getUserProfile(USER_ID)).toBeNull();
  });
});

describe('saveUserProfile', () => {
  it('calls upsert on user_profiles with correct fields', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await saveUserProfile(USER_ID, { name: 'Bob', role: 'Engineer' });
    expect(supabaseMock.from).toHaveBeenCalledWith('user_profiles');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: USER_ID, name: 'Bob', role: 'Engineer' }),
      { onConflict: 'id' },
    );
  });
});

// ── Subscription ───────────────────────────────────────────────────────────

describe('getSubscription', () => {
  it('returns subscription on success', async () => {
    const chain = makeQueryChain(null);
    chain.single.mockResolvedValue({ data: { tier: 'premium', plan: 'annual' }, error: null });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getSubscription(USER_ID)).toEqual({ tier: 'premium', plan: 'annual' });
  });

  it('returns null on error', async () => {
    const chain = makeQueryChain(null);
    chain.single.mockResolvedValue({ data: null, error: new Error('no sub') });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getSubscription(USER_ID)).toBeNull();
  });

  it('returns plan as undefined when null in DB', async () => {
    const chain = makeQueryChain(null);
    chain.single.mockResolvedValue({ data: { tier: 'free', plan: null }, error: null });
    supabaseMock.from.mockReturnValue(chain);
    const sub = await getSubscription(USER_ID);
    expect(sub?.plan).toBeUndefined();
  });
});

describe('saveSubscription', () => {
  it('upserts with tier and plan', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await saveSubscription(USER_ID, 'premium', 'annual');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, tier: 'premium', plan: 'annual' }),
      { onConflict: 'user_id' },
    );
  });

  it('upserts with null plan when not provided', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await saveSubscription(USER_ID, 'free');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ plan: null }),
      { onConflict: 'user_id' },
    );
  });
});

// ── Unlocked Courses ───────────────────────────────────────────────────────

describe('getUnlockedCourses', () => {
  it('returns array of course ids', async () => {
    const chain = makeQueryChain({
      data: [{ course_id: 'course-1' }, { course_id: 'course-2' }], error: null,
    });
    supabaseMock.from.mockReturnValue(chain);
    const courses = await getUnlockedCourses(USER_ID);
    expect(courses).toEqual(['course-1', 'course-2']);
  });

  it('returns empty array on error', async () => {
    const chain = makeQueryChain({ data: null, error: new Error('err') });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getUnlockedCourses(USER_ID)).toEqual([]);
  });
});

describe('unlockCourse', () => {
  it('calls upsert on unlocked_courses', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await unlockCourse(USER_ID, 'course-99');
    expect(supabaseMock.from).toHaveBeenCalledWith('unlocked_courses');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, course_id: 'course-99' }),
      { onConflict: 'user_id,course_id' },
    );
  });
});

// ── Purchases ──────────────────────────────────────────────────────────────

describe('getPurchases', () => {
  it('returns mapped purchases on success', async () => {
    const dbRow = {
      id: 'p1', purchase_type: 'subscription', course_id: null,
      course_name: null, plan: 'annual', amount: 999,
      purchased_at: '2026-03-01T00:00:00Z',
    };
    const chain = makeQueryChain({ data: [dbRow], error: null });
    supabaseMock.from.mockReturnValue(chain);
    const purchases = await getPurchases(USER_ID);
    expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({ purchaseType: 'subscription', plan: 'annual', amount: 999 });
  });

  it('returns empty array on error', async () => {
    const chain = makeQueryChain({ data: null, error: new Error('err') });
    supabaseMock.from.mockReturnValue(chain);
    expect(await getPurchases(USER_ID)).toEqual([]);
  });
});

describe('recordPurchase', () => {
  it('calls insert on purchases table with correct fields', async () => {
    const chain = makeQueryChain({ error: null });
    supabaseMock.from.mockReturnValue(chain);
    await recordPurchase(USER_ID, {
      purchaseType: 'course',
      courseId:     'course-1',
      courseName:   'Test Course',
      amount:       299,
      date:         '2026-03-01T00:00:00Z',
    });
    expect(supabaseMock.from).toHaveBeenCalledWith('purchases');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, purchase_type: 'course', amount: 299 }),
    );
  });
});
