import type { Metadata } from 'next';
import Link from 'next/link';
import FpNav from '@/components/FpNav';
import FpFooter from '@/components/FpFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — LearnKloud',
  description: 'Terms and conditions for using the LearnKloud cloud certification preparation platform.',
};

export default function TermsPage() {
  const updated = 'April 11, 2026';
  return (
    <div className="fp-root">
      <FpNav />

      <div className="fp-legal">
        <div className="fp-legal-header">
          <div className="fp-tag" style={{ marginBottom: 12 }}>Legal</div>
          <h1 className="fp-legal-title">Terms of Service</h1>
          <p className="fp-legal-meta">Last updated: {updated} · By using LearnKloud you agree to these terms</p>
        </div>

        {/* Table of contents */}
        <div className="fp-legal-toc">
          <div className="fp-legal-toc-title">Contents</div>
          <ol className="fp-legal-toc">
            <li><a href="#t1">Acceptance of terms</a></li>
            <li><a href="#t2">Eligibility</a></li>
            <li><a href="#t3">Account registration</a></li>
            <li><a href="#t4">Acceptable use</a></li>
            <li><a href="#t5">Subscriptions &amp; payments</a></li>
            <li><a href="#t6">Refund policy</a></li>
            <li><a href="#t7">Intellectual property</a></li>
            <li><a href="#t8">User content</a></li>
            <li><a href="#t9">Disclaimers</a></li>
            <li><a href="#t10">Limitation of liability</a></li>
            <li><a href="#t11">Indemnification</a></li>
            <li><a href="#t12">Termination</a></li>
            <li><a href="#t13">Governing law</a></li>
            <li><a href="#t14">Changes to terms</a></li>
            <li><a href="#t15">Contact</a></li>
          </ol>
        </div>

        <h2 id="t1">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the LearnKloud web portal, iOS app, or Android app (collectively, the
          &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and
          our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the Service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and LearnKloud
          (&quot;LearnKloud&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
        </p>

        <h2 id="t2">2. Eligibility</h2>
        <p>
          You must be at least 13 years old (or 16 in the EU/EEA) to use the Service. By creating an account
          you represent that you meet this age requirement and that all information you provide is accurate.
          If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to
          these Terms on your behalf.
        </p>

        <h2 id="t3">3. Account Registration</h2>
        <ul>
          <li>You must provide a valid email address and create a strong password (minimum 12 characters, including upper and lowercase letters, a number, and a special character).</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</li>
          <li>You may not share your account, create multiple accounts to circumvent restrictions, or impersonate any other person.</li>
          <li>Notify us immediately at <a href="mailto:support@katalysthq.app">support@katalysthq.app</a> if you believe your account has been compromised.</li>
        </ul>

        <h2 id="t4">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
          <li>Scrape, crawl, or systematically download question content, explanations, or other Service data.</li>
          <li>Attempt to reverse-engineer, decompile, or extract the question bank or scoring logic.</li>
          <li>Share exam questions publicly in a way that violates third-party certification exam confidentiality agreements.</li>
          <li>Use automated bots, scripts, or tools to manipulate quiz scores, leaderboard rankings, or coin balances.</li>
          <li>Upload, transmit, or distribute malware, spam, or harmful content through the review or feedback features.</li>
          <li>Attempt to gain unauthorised access to our systems, databases, or other users&apos; accounts.</li>
          <li>Use the Service in any way that could impair its performance or interfere with other users&apos; enjoyment.</li>
        </ul>

        <h2 id="t5">5. Subscriptions &amp; Payments</h2>
        <h3>5.1 Free tier</h3>
        <p>
          The free tier provides access to all quiz topics with a 25-question shuffled subset per attempt.
          No payment is required. Features available to free users may change at our discretion with reasonable
          notice.
        </p>
        <h3>5.2 Pro subscription</h3>
        <p>
          Pro subscriptions are available on a monthly (₹149/month or equivalent) or annual (₹999/year or
          equivalent) basis. Pro unlocks unlimited questions across the full question bank and removes advertisements.
        </p>
        <h3>5.3 Individual quiz unlocks</h3>
        <p>
          Selected quizzes may be unlocked as a one-time purchase at a price set by us and visible before checkout.
        </p>
        <h3>5.4 Billing</h3>
        <ul>
          <li>Subscriptions auto-renew at the end of each billing period unless cancelled before the renewal date.</li>
          <li>You authorise us to charge the payment method on file for the applicable fee at each renewal.</li>
          <li>All prices are inclusive of applicable taxes unless otherwise stated.</li>
          <li>Payment is processed by Razorpay (India) or Stripe (international). We do not store your full card details.</li>
        </ul>
        <h3>5.5 Cancellation</h3>
        <p>
          You may cancel your subscription at any time. Cancellation takes effect at the end of the current
          billing period; you retain Pro access until that date. To cancel, contact
          <a href="mailto:support@katalysthq.app"> support@katalysthq.app</a> or use the cancellation flow
          in your subscription management portal.
        </p>

        <h2 id="t6">6. Refund Policy</h2>
        <p>
          <strong>Annual subscriptions:</strong> A full refund is available within 7 days of purchase if you
          have not accessed premium content. After 7 days, no refund is issued.
        </p>
        <p>
          <strong>Monthly subscriptions:</strong> No refund once a monthly billing cycle has begun.
        </p>
        <p>
          <strong>Individual quiz unlocks:</strong> Non-refundable once the premium quiz content has been accessed.
        </p>
        <p>
          To request a refund, email <a href="mailto:support@katalysthq.app">support@katalysthq.app</a> with
          your order ID and reason. We reserve the right to approve or deny refund requests at our discretion.
        </p>

        <h2 id="t7">7. Intellectual Property</h2>
        <p>
          All content on the Service — including but not limited to quiz questions, answer explanations, code,
          graphics, logos, and the LearnKloud name — is owned by or licensed to LearnKloud and is protected by
          copyright, trademark, and other intellectual property laws.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable licence to access and use the Service for
          your personal, non-commercial educational purposes. You may not reproduce, distribute, modify,
          create derivative works from, or publicly display any content from the Service without our prior
          written consent.
        </p>

        <h2 id="t8">8. User Content</h2>
        <p>
          You may submit quiz reviews and ratings through the Service (&quot;User Content&quot;). By submitting
          User Content you grant us a worldwide, royalty-free licence to use, display, and moderate it within
          the Service. You represent that your User Content does not infringe any third-party rights and is
          not false, misleading, defamatory, or abusive.
        </p>
        <p>
          We reserve the right to remove User Content that violates these Terms without notice.
        </p>

        <h2 id="t9">9. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
          KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          LearnKloud does not guarantee that: (a) the Service will be error-free or uninterrupted; (b) any
          defects will be corrected; (c) practice questions will guarantee a passing score on any third-party
          certification exam. Exam syllabi and question formats are controlled by the respective certification
          bodies and may change without notice.
        </p>

        <h2 id="t10">10. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LEARNKLOUD AND ITS DIRECTORS, EMPLOYEES, AGENTS,
          AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES — INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL — ARISING OUT OF OR IN CONNECTION WITH YOUR
          USE OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, EVEN IF
          WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED
          THE GREATER OF (A) THE AMOUNT YOU PAID TO LEARNKLOUD IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) ₹500.
        </p>

        <h2 id="t11">11. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless LearnKloud and its affiliates from and against any
          claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of
          your use of the Service, your User Content, or your violation of these Terms.
        </p>

        <h2 id="t12">12. Termination</h2>
        <p>
          We may suspend or terminate your account at any time if we reasonably believe you have violated
          these Terms. Upon termination you lose access to the Service and any unused portion of a paid
          subscription. Sections 7, 9, 10, 11, and 13 survive termination.
        </p>
        <p>
          You may delete your account at any time via the app (Profile → Danger Zone → Delete Account) or
          by visiting <Link href="/delete-account">learnkloud.today/delete-account</Link>.
        </p>

        <h2 id="t13">13. Governing Law &amp; Dispute Resolution</h2>
        <p>
          These Terms are governed by the laws of India. Any dispute arising from these Terms or the Service
          shall first be attempted to be resolved by good-faith negotiation. If unresolved within 30 days,
          disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
        </p>

        <h2 id="t14">14. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material changes by
          email or in-app notice at least 14 days before they take effect. Your continued use of the Service
          after the effective date constitutes acceptance of the updated Terms.
        </p>

        <h2 id="t15">15. Contact</h2>
        <p>For questions about these Terms, contact us at:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@katalysthq.app">support@katalysthq.app</a></li>
          <li><strong>Legal queries:</strong> <a href="mailto:legal@katalysthq.app">legal@katalysthq.app</a></li>
        </ul>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/privacy"        className="fp-btn-ghost" style={{ fontSize: 13 }}>Privacy Policy</Link>
          <Link href="/delete-account" className="fp-btn-ghost" style={{ fontSize: 13 }}>Delete Account</Link>
          <Link href="/"               className="fp-btn-ghost" style={{ fontSize: 13 }}>Back to Home</Link>
        </div>
      </div>

      <FpFooter />
    </div>
  );
}
