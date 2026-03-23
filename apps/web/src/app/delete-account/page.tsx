import Link from 'next/link';

export default function DeleteAccountPage() {
  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
        <span className="dc-chip">Katalyst LMS</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>
          Delete Account
        </h1>
        <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          This page exists for Google Play account deletion compliance and explains how a user can permanently
          delete their Katalyst account and associated data.
        </p>
      </section>

      <section>
        <div className="dc-card" style={{ padding: 28, display: 'grid', gap: 22 }}>
          <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: 15, whiteSpace: 'pre-wrap' }}>
            {`How to delete your account

1. Open the Katalyst app.
2. Go to Profile.
3. Scroll to Danger Zone.
4. Tap Delete Account.
5. Type DELETE and confirm.

What gets deleted
• Profile information
• Quiz history and progress
• Coin and referral records where applicable
• Authentication account record

If you cannot access the app
Email support@katalysthq.app from your registered email address and request account deletion. Include the email address tied to your Katalyst account so support can verify the request.

Deletion result
Account deletion is permanent and cannot be undone.`}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/privacy" className="btn-primary" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" className="btn-primary" style={{ textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
