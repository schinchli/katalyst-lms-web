import type { Metadata } from 'next';
import Link from 'next/link';
import FpNav from '@/components/FpNav';
import FpFooter from '@/components/FpFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Katalyst',
  description: 'How Katalyst collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  const updated = 'April 11, 2026';
  return (
    <div className="fp-root">
      <FpNav />

      <div className="fp-legal">
        <div className="fp-legal-header">
          <div className="fp-tag" style={{ marginBottom: 12 }}>Legal</div>
          <h1 className="fp-legal-title">Privacy Policy</h1>
          <p className="fp-legal-meta">Last updated: {updated} · Effective immediately for new users</p>
        </div>

        {/* Table of contents */}
        <div className="fp-legal-toc">
          <div className="fp-legal-toc-title">Contents</div>
          <ol className="fp-legal-toc">
            <li><a href="#s1">Information we collect</a></li>
            <li><a href="#s2">How we use your information</a></li>
            <li><a href="#s3">Information sharing &amp; third parties</a></li>
            <li><a href="#s4">Data retention</a></li>
            <li><a href="#s5">Security</a></li>
            <li><a href="#s6">Your rights</a></li>
            <li><a href="#s7">Children&apos;s privacy</a></li>
            <li><a href="#s8">Cookies &amp; tracking</a></li>
            <li><a href="#s9">Advertising</a></li>
            <li><a href="#s10">International transfers</a></li>
            <li><a href="#s11">Changes to this policy</a></li>
            <li><a href="#s12">Contact us</a></li>
          </ol>
        </div>

        <p>
          Katalyst (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Katalyst web application at{' '}
          <a href="https://learnkloud.today">learnkloud.today</a> and the Katalyst mobile app on iOS and
          Android (collectively, the &quot;Service&quot;). This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our Service. Please read this carefully.
          If you disagree with the terms, please discontinue use of the Service.
        </p>

        <h2 id="s1">1. Information We Collect</h2>

        <h3>1.1 Information you provide directly</h3>
        <ul>
          <li><strong>Account registration:</strong> Full name, email address, and password when you create an account.</li>
          <li><strong>Profile:</strong> Display name, role (e.g., &quot;Developer&quot;, &quot;Student&quot;), and optional profile preferences you set within the app.</li>
          <li><strong>Payment information:</strong> When you purchase a Pro subscription or individual quiz unlock, payment is processed by Razorpay (India) or Stripe (international). We do <em>not</em> store your card number, CVV, or full payment details on our servers — only the order ID, amount, currency, status, and gateway reference returned by the payment processor.</li>
          <li><strong>Quiz activity:</strong> Your answers, scores, time taken, bookmarked questions, and review submissions for each quiz attempt.</li>
          <li><strong>Reviews and feedback:</strong> Star ratings and written comments you submit for quizzes.</li>
          <li><strong>Support communications:</strong> Emails or messages you send to support@katalysthq.app.</li>
        </ul>

        <h3>1.2 Information collected automatically</h3>
        <ul>
          <li><strong>Device information:</strong> Device type, operating system version, app version, and unique device identifiers (on mobile).</li>
          <li><strong>Usage data:</strong> Pages visited, quiz sessions started/completed, features used, tap/click events, session duration, and in-app navigation paths.</li>
          <li><strong>Log data:</strong> IP address, browser type, referring URL, and timestamps of requests to our servers.</li>
          <li><strong>Performance data:</strong> Crash reports and error logs collected to diagnose and fix issues.</li>
        </ul>

        <h3>1.3 Information from third-party services</h3>
        <ul>
          <li><strong>Google OAuth / Apple Sign-In:</strong> If you sign in using a social provider, we receive your name, email address, and profile picture URL from that provider.</li>
          <li><strong>reCAPTCHA:</strong> Google reCAPTCHA v3 runs on auth forms to detect abusive traffic; Google may collect device and behaviour signals as part of this.</li>
        </ul>

        <h2 id="s2">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Create and manage your account and authenticate your identity.</li>
          <li>Provide the quiz, leaderboard, daily-challenge, and progress-tracking features of the Service.</li>
          <li>Process payments and verify subscription or unlock entitlements.</li>
          <li>Personalise your experience (e.g., remembering your dark-mode preference, last quiz, bookmark list).</li>
          <li>Send transactional emails (email confirmation, password reset, payment receipts). We do <em>not</em> send marketing emails unless you have explicitly opted in.</li>
          <li>Monitor, debug, and improve the reliability and performance of the Service.</li>
          <li>Detect and prevent fraud, abuse, and security incidents.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2 id="s3">3. Information Sharing &amp; Third Parties</h2>
        <p>We do not sell your personal data. We share data only in the following circumstances:</p>

        <h3>3.1 Service providers we use</h3>
        <ul>
          <li><strong>Supabase</strong> — Database, authentication, and file storage. Data is stored in Supabase-managed PostgreSQL instances. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.</li>
          <li><strong>Vercel</strong> — Web hosting and serverless function execution. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>.</li>
          <li><strong>Razorpay</strong> — Payment processing for Indian customers. <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay Privacy Policy</a>.</li>
          <li><strong>Stripe</strong> — Payment processing for international customers. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>.</li>
          <li><strong>Google reCAPTCHA</strong> — Bot and abuse detection on auth forms. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.</li>
          <li><strong>Google AdSense</strong> — Advertising displayed to free-tier users. Google may use cookies and device identifiers to show personalised ads. See Section 9 for more detail.</li>
          <li><strong>Expo / EAS</strong> — Mobile app build and over-the-air update delivery for iOS and Android.</li>
        </ul>

        <h3>3.2 Legal requirements</h3>
        <p>We may disclose your information if required by law, court order, or government authority, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</p>

        <h3>3.3 Business transfers</h3>
        <p>In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before your data becomes subject to a different privacy policy.</p>

        <h2 id="s4">4. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. Quiz results and progress data are
          retained indefinitely to power your progress history and leaderboard ranking. If you delete your account,
          we delete or anonymise your personal information within 30 days, except where retention is required by law
          (e.g., payment records retained for 7 years for tax compliance).
        </p>
        <p>
          You can request account deletion at any time via <strong>Profile → Danger Zone → Delete Account</strong> in
          the app, or by visiting <Link href="/delete-account">learnkloud.today/delete-account</Link>.
        </p>

        <h2 id="s5">5. Security</h2>
        <p>We implement industry-standard security measures, including:</p>
        <ul>
          <li>All data in transit is encrypted via TLS 1.2+.</li>
          <li>All data at rest is encrypted at the storage layer (Supabase/Vercel).</li>
          <li>Row-Level Security (RLS) policies on every database table — users can only access their own records.</li>
          <li>Passwords are hashed using bcrypt via Supabase Auth; we never store plaintext passwords.</li>
          <li>Rate limiting on all API endpoints to prevent brute-force attacks.</li>
          <li>Security headers (HSTS, CSP, X-Frame-Options, etc.) on all web responses.</li>
        </ul>
        <p>
          Despite these measures, no system is completely secure. If you discover a security vulnerability,
          please report it to <a href="mailto:security@katalysthq.app">security@katalysthq.app</a>.
        </p>

        <h2 id="s6">6. Your Rights</h2>
        <p>Depending on your location, you may have the following rights:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Ask us to correct inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated personal data.</li>
          <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
          <li><strong>Objection / Restriction:</strong> Object to or restrict certain types of processing.</li>
          <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, email <a href="mailto:privacy@katalysthq.app">privacy@katalysthq.app</a>.
          We will respond within 30 days. EU/EEA residents may also lodge a complaint with their local data
          protection authority.
        </p>

        <h2 id="s7">7. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed at children under the age of 13 (or 16 in the EU/EEA). We do not
          knowingly collect personal information from children. If you believe a child has provided us with
          personal data without parental consent, please contact us at{' '}
          <a href="mailto:privacy@katalysthq.app">privacy@katalysthq.app</a> and we will promptly delete it.
        </p>

        <h2 id="s8">8. Cookies &amp; Tracking</h2>
        <p>The Katalyst web portal uses the following types of storage:</p>
        <ul>
          <li><strong>localStorage:</strong> Stores your theme preference, quiz progress, profile settings, and session tokens. This data never leaves your device except as part of API calls to our servers.</li>
          <li><strong>Session cookies:</strong> Supabase sets a secure, HTTP-only session cookie to maintain your authenticated session.</li>
          <li><strong>Third-party cookies:</strong> Google AdSense and reCAPTCHA may set cookies or use browser fingerprinting signals. You can opt out of personalised advertising via Google&apos;s ad settings at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>.</li>
        </ul>
        <p>The mobile app does not use browser cookies. It uses secure device storage for session tokens.</p>

        <h2 id="s9">9. Advertising</h2>
        <p>
          Free-tier users see advertisements served by Google AdSense. These ads may be personalised based
          on your browsing history and interests as inferred by Google. To opt out of personalised ads:
        </p>
        <ul>
          <li>Visit <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a> to manage your Google ad personalisation settings.</li>
          <li>Install an ad blocker or use the &quot;Whitelist this site&quot; flow shown when an ad blocker is detected.</li>
          <li>Upgrade to a Katalyst Pro subscription — Pro members see no ads.</li>
        </ul>
        <p>
          Katalyst is a participant in the Google AdSense program. Google&apos;s use of advertising cookies
          is governed by the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
        </p>

        <h2 id="s10">10. International Data Transfers</h2>
        <p>
          Katalyst is operated from India. If you access the Service from outside India, your information
          may be transferred to and processed in India and the United States (Vercel, Supabase infrastructure).
          By using the Service you consent to this transfer. We rely on standard contractual clauses and
          Supabase&apos;s Data Processing Addendum where required by applicable law.
        </p>

        <h2 id="s11">11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the
          &quot;Last updated&quot; date at the top and, for material changes, notify you by email or
          in-app notice. Your continued use of the Service after changes are posted constitutes acceptance
          of the revised policy.
        </p>

        <h2 id="s12">12. Contact Us</h2>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or your data, contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:privacy@katalysthq.app">privacy@katalysthq.app</a></li>
          <li><strong>Support:</strong> <a href="mailto:support@katalysthq.app">support@katalysthq.app</a></li>
          <li><strong>Account deletion:</strong> <Link href="/delete-account">learnkloud.today/delete-account</Link></li>
        </ul>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/terms" className="fp-btn-ghost" style={{ fontSize: 13 }}>Terms of Service</Link>
          <Link href="/delete-account" className="fp-btn-ghost" style={{ fontSize: 13 }}>Delete Account</Link>
          <Link href="/" className="fp-btn-ghost" style={{ fontSize: 13 }}>Back to Home</Link>
        </div>
      </div>

      <FpFooter />
    </div>
  );
}
