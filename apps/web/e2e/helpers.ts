import type { Page } from '@playwright/test';

/** Inject a fake authenticated session so we can test protected pages */
export async function injectFakeSession(page: Page) {
  await page.addInitScript(() => {
    // Minimal Supabase session stub — makes supabase.auth.getUser() resolve
    const fakeUser = {
      id: 'test-user-123',
      email: 'test@katalyst.dev',
      user_metadata: { name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const fakeSession = {
      access_token: 'fake-token',
      refresh_token: 'fake-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: fakeUser,
    };
    // Patch localStorage with a supabase session key
    const key = 'sb-katalyst-auth-token';
    localStorage.setItem(key, JSON.stringify({ currentSession: fakeSession, expiresAt: Date.now() + 3600000 }));
    // Also set profile data
    localStorage.setItem('profile-name', 'Test User');
    localStorage.setItem('profile-email', 'test@katalyst.dev');
    localStorage.setItem('profile-role', 'AWS Learner');
  });
}

/** Inject realistic quiz results into localStorage */
export async function injectQuizResults(page: Page) {
  await page.addInitScript(() => {
    const today = new Date().toISOString();
    const results = [
      {
        quizId: 'clf-c02-cloud-concepts',
        score: 22,
        totalQuestions: 29,
        timeTaken: 720,
        answers: {},
        completedAt: today,
      },
      {
        quizId: 'clf-c02-billing',
        score: 28,
        totalQuestions: 34,
        timeTaken: 840,
        answers: {},
        completedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
      },
    ];
    localStorage.setItem('quiz-results', JSON.stringify(results));
  });
}

/** Skip the Supabase auth redirect by injecting a bypass cookie/flag */
export async function bypassAuth(page: Page) {
  await page.addInitScript(() => {
    // Mock supabase auth to return a user immediately so layout.tsx doesn't redirect
    (window as unknown as Record<string, unknown>).__KATALYST_TEST__ = true;
  });
}
