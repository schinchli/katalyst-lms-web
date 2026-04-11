import type { Metadata } from 'next';
import Link from 'next/link';
import FpNav from '@/components/FpNav';
import FpFooter from '@/components/FpFooter';

export const metadata: Metadata = {
  title: 'Delete Account — Katalyst',
  description: 'How to permanently delete your Katalyst account and all associated data.',
};

export default function DeleteAccountPage() {
  return (
    <div className="fp-root">
      <FpNav />

      <div className="fp-legal">
        <div className="fp-legal-header">
          <div className="fp-tag" style={{ marginBottom: 12 }}>Account</div>
          <h1 className="fp-legal-title">Delete Your Account</h1>
          <p className="fp-legal-meta">
            This page exists to comply with Google Play and Apple App Store account deletion requirements.
          </p>
        </div>

        <h2>How to delete your account</h2>
        <p>You can delete your Katalyst account directly from the app in a few steps:</p>
        <ol>
          <li>Open the <strong>Katalyst app</strong> on your device.</li>
          <li>Tap <strong>Profile</strong> in the bottom navigation bar.</li>
          <li>Scroll down to <strong>Danger Zone</strong>.</li>
          <li>Tap <strong>Delete Account</strong>.</li>
          <li>Type <code>DELETE</code> to confirm, then tap the confirmation button.</li>
        </ol>
        <p>Your account and all associated data will be permanently deleted. This action cannot be undone.</p>

        <h2>What gets deleted</h2>
        <p>When you delete your account, the following data is permanently removed within 30 days:</p>
        <ul>
          <li>Your profile information (name, email, display name, role)</li>
          <li>All quiz history, scores, and progress records</li>
          <li>Coin balance, streak data, and leaderboard ranking</li>
          <li>Bookmarked questions and review submissions</li>
          <li>Your authentication account record (you will be signed out immediately)</li>
        </ul>
        <p>
          Payment records may be retained for up to 7 years as required by applicable tax and financial
          regulations. See our <Link href="/privacy">Privacy Policy</Link> for full data retention details.
        </p>

        <h2>If you cannot access the app</h2>
        <p>
          If you are unable to sign in or access the app, you can request account deletion by email:
        </p>
        <ul>
          <li>Send an email to <a href="mailto:support@katalysthq.app">support@katalysthq.app</a></li>
          <li>Use the subject line: <strong>Account Deletion Request</strong></li>
          <li>Include the email address registered to your Katalyst account so we can verify and action the request</li>
        </ul>
        <p>We will process your deletion request within 30 days of receipt.</p>

        <h2>Subscription cancellation</h2>
        <p>
          Deleting your account does not automatically cancel an active subscription processed through
          Razorpay or Stripe. To avoid future charges, please cancel your subscription before deleting
          your account, or contact <a href="mailto:support@katalysthq.app">support@katalysthq.app</a> to
          request cancellation as part of your deletion.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/privacy" className="fp-btn-ghost" style={{ fontSize: 13 }}>Privacy Policy</Link>
          <Link href="/terms"   className="fp-btn-ghost" style={{ fontSize: 13 }}>Terms of Service</Link>
          <Link href="/"        className="fp-btn-ghost" style={{ fontSize: 13 }}>Back to Home</Link>
        </div>
      </div>

      <FpFooter />
    </div>
  );
}
