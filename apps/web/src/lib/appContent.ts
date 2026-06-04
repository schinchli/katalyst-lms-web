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
  appName: 'LearnKloud.Today',
  supportEmail: 'support@learnkloud.today',
  privacyPolicy: `Last updated: March 2026

LearnKloud is committed to protecting your privacy. This policy explains how we collect, use, and protect your information.

INFORMATION WE COLLECT
• Email address and display name (for account creation)
• Quiz answers, scores, and progress history (to track learning)
• App usage data such as session duration (to improve the service)
• Purchase and entitlement records where applicable

HOW WE USE YOUR DATA
• To provide and personalise your learning experience
• To sync your progress across devices
• To send important account-related notifications
• To display your position on the leaderboard

DATA SHARING
We do not sell your personal data. We share data only with Supabase (infrastructure) and Razorpay (payments).

YOUR RIGHTS
You may request access, correction, or deletion of your data at any time via Settings → Delete Account or by emailing support@learnkloud.today.`,
  termsAndConditions: `Last updated: March 2026

By using LearnKloud, you agree to these Terms. If you do not agree, do not use the service.

ACCOUNTS
You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your credentials.

SUBSCRIPTIONS & PAYMENTS
• Free tier: limited questions and features
• Premium tier: full access via monthly or annual subscription
• Payments processed securely by Razorpay
• Subscriptions auto-renew unless cancelled before renewal

ACCEPTABLE USE
You agree not to abuse quizzes, attempt to circumvent payments, or use the platform for any unlawful purpose. Accounts may be suspended for fraud, abuse, or chargeback disputes.

CONTACT
support@learnkloud.today`,
  aboutUs: `LearnKloud.Today helps learners build cloud, AI, and certification skills through guided practice, quiz-based learning, and real-time progress tracking.

Our content covers AWS certifications (CLF-C02, SAA-C03), AI/ML foundations, and hands-on cloud engineering — structured to get you exam-ready efficiently.

We believe effective learning comes from doing: short quizzes, spaced repetition, and instant explanations that stick.`,
  instructions: `Getting started:

1. Create a free account or sign in.
2. Pick a quiz or follow a Learning Path from My Track.
3. Answer questions and review explanations — wrong answers are learning moments.
4. Bookmark tricky questions to revisit them from the Bookmarks screen.
5. Track your streak, XP, and leaderboard rank in the Growth tab.
6. Challenge the CPU or battle other learners for bonus coins.
7. Upgrade to Premium only if you need full access to all question banks.`,
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
