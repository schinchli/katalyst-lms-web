export const APP_CONTENT_KEY = 'managed_app_content';

export interface AppContentConfig {
  appName: string;
  supportEmail: string;
  privacyPolicy: string;
  termsAndConditions: string;
  aboutUs: string;
  instructions: string;
}

export const DEFAULT_APP_CONTENT: AppContentConfig = {
  appName: 'Katalyst LMS',
  supportEmail: 'support@example.com',
  privacyPolicy: `We respect your privacy.

We collect account and usage data needed to operate the learning platform, sync progress, and improve the product. We do not sell personal data.

If you need help with your data or account, contact support.`,
  termsAndConditions: `By using this app, you agree to use the platform lawfully and not attempt to abuse quizzes, payments, or account systems.

Premium purchases unlock access according to the plan or course you buy. Access may be suspended for fraud, abuse, or chargeback disputes.`,
  aboutUs: `Katalyst LMS helps learners build cloud, AI, and certification skills through guided practice, quiz-based learning, and progress tracking.`,
  instructions: `How to use the app:

1. Create an account or sign in.
2. Choose a quiz or learning path.
3. Complete questions, review explanations, and track progress.
4. Use bookmarks, flashcards, and challenge modes to revise.
5. Upgrade only if you need premium content.`,
};

export function normalizeAppContent(value: unknown): AppContentConfig {
  const raw = (value ?? {}) as Partial<AppContentConfig>;

  return {
    appName: typeof raw.appName === 'string' && raw.appName.trim() ? raw.appName : DEFAULT_APP_CONTENT.appName,
    supportEmail: typeof raw.supportEmail === 'string' && raw.supportEmail.trim() ? raw.supportEmail : DEFAULT_APP_CONTENT.supportEmail,
    privacyPolicy: typeof raw.privacyPolicy === 'string' && raw.privacyPolicy.trim() ? raw.privacyPolicy : DEFAULT_APP_CONTENT.privacyPolicy,
    termsAndConditions: typeof raw.termsAndConditions === 'string' && raw.termsAndConditions.trim() ? raw.termsAndConditions : DEFAULT_APP_CONTENT.termsAndConditions,
    aboutUs: typeof raw.aboutUs === 'string' && raw.aboutUs.trim() ? raw.aboutUs : DEFAULT_APP_CONTENT.aboutUs,
    instructions: typeof raw.instructions === 'string' && raw.instructions.trim() ? raw.instructions : DEFAULT_APP_CONTENT.instructions,
  };
}
