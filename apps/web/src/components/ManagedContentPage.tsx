'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AppContentConfig } from '@/lib/appContent';

type ContentKey = 'privacyPolicy' | 'termsAndConditions' | 'aboutUs' | 'instructions';

const TITLES: Record<ContentKey, string> = {
  privacyPolicy: 'Privacy Policy',
  termsAndConditions: 'Terms & Conditions',
  aboutUs: 'About Us',
  instructions: 'How To Play',
};

const FALLBACK: Partial<Record<ContentKey, string>> = {
  privacyPolicy: `Last updated: March 2026

LearnKloud ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the LearnKloud app and website (collectively, "the Service").

1. INFORMATION WE COLLECT
We collect the following information when you create an account or use the Service:
• Email address and display name (for account creation and personalisation)
• Quiz answers, scores, and progress history (to track your learning)
• App usage data such as session duration and features used (to improve the Service)
• Purchase and entitlement records where applicable (to manage premium access)

2. HOW WE USE YOUR INFORMATION
• To provide and operate the Service
• To personalise your learning experience and show relevant content
• To display your progress and position on the leaderboard
• To send important account-related notifications (no marketing without consent)
• To show advertisements (you can opt out of personalised ads via device settings)

3. DATA SHARING
We do not sell your personal data. We share data only with:
• Supabase (database and authentication infrastructure)
• Razorpay (payment processing — subject to Razorpay's privacy policy)

4. DATA RETENTION
Your account data is retained as long as your account is active. You may request deletion of your account and all associated data at any time via Settings → Delete Account or the public deletion instructions page at https://lms-amber-two.vercel.app/delete-account.

5. SECURITY
All data is transmitted over HTTPS. Authentication tokens are stored in the device's secure enclave (iOS Keychain / Android Keystore). We do not store passwords in plain text.

6. CHILDREN'S PRIVACY
The Service is not directed at children under 13. We do not knowingly collect data from children under 13.

7. YOUR RIGHTS
You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@learnkloudhq.app, use the in-app account deletion feature, or follow the web instructions at https://lms-amber-two.vercel.app/delete-account.

8. CHANGES TO THIS POLICY
We may update this policy. We will notify you of material changes via the app or email. Continued use after changes constitutes acceptance.

9. CONTACT
LearnKloud LMS | support@learnkloudhq.app`,

  termsAndConditions: `Last updated: March 2026

Please read these Terms and Conditions ("Terms") carefully before using LearnKloud.

1. ACCEPTANCE OF TERMS
By accessing or using LearnKloud, you agree to be bound by these Terms. If you do not agree, do not use the Service.

2. DESCRIPTION OF SERVICE
LearnKloud provides cloud and AI certification exam preparation content including practice quizzes, flashcards, and learning resources. The Service is provided "as is" for educational purposes.

3. ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to create an account. You agree to provide accurate information and keep it up to date.

4. SUBSCRIPTIONS AND PAYMENTS
• Free tier: access to a limited set of questions and features
• Premium tier: full access to all content, available as monthly or annual subscription
• Payments are processed securely by Razorpay
• Subscriptions auto-renew unless cancelled before the renewal date
• Refunds are handled in accordance with applicable law and store policies

5. INTELLECTUAL PROPERTY
All content on LearnKloud — including questions, explanations, course materials, and software — is owned by or licensed to LearnKloud. You may not copy, distribute, or create derivative works without written permission.

6. PROHIBITED CONDUCT
You agree not to:
• Attempt to circumvent access controls or share account credentials
• Scrape, reverse-engineer, or reproduce the quiz content
• Use the Service for any unlawful purpose
• Misrepresent your identity or affiliation

7. DISCLAIMERS
LearnKloud is an independent prep resource and is not affiliated with or endorsed by Amazon Web Services, Google, Microsoft, or any certification body. Passing scores on practice quizzes do not guarantee passing scores on official exams.

8. LIMITATION OF LIABILITY
To the maximum extent permitted by law, LearnKloud shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service.

9. TERMINATION
We may suspend or terminate your account if you violate these Terms. You may delete your account at any time via Settings → Delete Account or via the public instructions at https://lms-amber-two.vercel.app/delete-account.

10. CHANGES TO TERMS
We may modify these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.

11. GOVERNING LAW
These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bangalore, Karnataka.

12. CONTACT
LearnKloud LMS | support@learnkloudhq.app`,
};

export function ManagedContentPage({ contentKey }: { contentKey: ContentKey }) {
  const [content, setContent] = useState<AppContentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/app-content')
      .then((response) => response.json() as Promise<{ content?: AppContentConfig }>)
      .then((body) => setContent(body.content ?? null))
      .finally(() => setLoading(false));
  }, []);

  const title = TITLES[contentKey];
  const body = useMemo(
    () => content?.[contentKey] || FALLBACK[contentKey] || '',
    [content, contentKey],
  );

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <span className="dc-chip">{content?.appName ?? 'LearnKloud LMS'}</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>{title}</h1>
        <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          Managed from admin settings and shared across the website and mobile app.
        </p>
      </section>

      <section>
        <div className="dc-card" style={{ padding: 28 }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading content…</p>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.8, fontSize: 15 }}>
              {body}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/privacy" className="btn-primary" style={{ textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" className="btn-primary" style={{ textDecoration: 'none' }}>Terms</Link>
            <Link href="/about" className="btn-primary" style={{ textDecoration: 'none' }}>About</Link>
            <Link href="/instructions" className="btn-primary" style={{ textDecoration: 'none' }}>Instructions</Link>
            <Link href="/delete-account" className="btn-primary" style={{ textDecoration: 'none' }}>Delete Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
