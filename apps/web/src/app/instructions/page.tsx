import type { Metadata } from 'next';
import Link from 'next/link';
import FpNav from '@/components/FpNav';
import FpFooter from '@/components/FpFooter';

export const metadata: Metadata = {
  title: 'How to Use LearnKloud — Instructions',
  description: 'Learn how to get the most out of LearnKloud — quizzes, daily challenges, the leaderboard, and Pro features.',
};

export default function InstructionsPage() {
  return (
    <div className="fp-root">
      <FpNav />

      <div className="fp-legal">
        <div className="fp-legal-header">
          <div className="fp-tag" style={{ marginBottom: 12 }}>Guide</div>
          <h1 className="fp-legal-title">How to Use LearnKloud</h1>
          <p className="fp-legal-meta">Everything you need to get the most out of your certification prep</p>
        </div>

        <h2>1. Getting started</h2>
        <ol>
          <li><strong>Create a free account</strong> at <Link href="/signup">learnkloud.today/signup</Link> or download the mobile app.</li>
          <li>Set your <strong>display name and role</strong> in your Profile — this is how you appear on the leaderboard.</li>
          <li>Go to <strong>Dashboard → Quizzes</strong> to browse all available topics.</li>
          <li>Start with the <strong>AWS CLF-C02 Cloud Concepts</strong> quiz if you&apos;re new to cloud.</li>
        </ol>

        <h2>2. Taking a quiz</h2>
        <ul>
          <li>Each quiz starts with an intro screen showing the topic, number of questions, and time limit.</li>
          <li>Tap or click <strong>Start Quiz</strong> when you&apos;re ready.</li>
          <li>Select your answer and tap <strong>Submit Answer</strong> to see the explanation immediately.</li>
          <li>Use the <strong>bookmark icon</strong> to save questions you want to review later.</li>
          <li>At the end, your score, XP earned, and coins are shown on the results screen.</li>
          <li>Tap <strong>Review Answers</strong> to go through every question with its full explanation.</li>
        </ul>
        <p>
          <strong>Free tier:</strong> Each quiz attempt uses a shuffled 25-question subset from the full bank.
          Upgrade to Pro to unlock unlimited questions per attempt.
        </p>

        <h2>3. Daily challenge</h2>
        <ul>
          <li>A new quiz is featured every day on the <strong>Dashboard</strong> home and the <strong>Leaderboard</strong> page.</li>
          <li>Completing the daily quiz earns bonus XP and extends your streak.</li>
          <li>Your streak resets if you miss a day — come back daily to keep it going.</li>
        </ul>

        <h2>4. Leaderboard</h2>
        <ul>
          <li>Open <strong>Dashboard → Leaderboard</strong> to see your rank against other learners.</li>
          <li>Switch between <strong>Today</strong>, <strong>Monthly</strong>, and <strong>All Time</strong> views.</li>
          <li>Your score is calculated from quiz points. The more quizzes you complete, the higher you climb.</li>
          <li>The leaderboard updates in real time — complete a quiz to see your rank change immediately.</li>
        </ul>

        <h2>5. Coins &amp; XP</h2>
        <ul>
          <li><strong>XP (experience points)</strong> are earned for every correct answer and for completing quizzes.</li>
          <li><strong>Coins</strong> accumulate with quiz completions and streaks.</li>
          <li>Both metrics feed into your leaderboard score and profile stats.</li>
        </ul>

        <h2>6. Pro features</h2>
        <p>Upgrade to <strong>LearnKloud Pro</strong> to unlock:</p>
        <ul>
          <li>Unlimited questions per quiz attempt (no 25-question cap)</li>
          <li>The full 195-question CLF-C02 mock exam</li>
          <li>All GenAI and cloud topic questions without restriction</li>
          <li>Ad-free experience across web and mobile</li>
          <li>Domain-level performance analytics</li>
          <li>Priority support</li>
        </ul>
        <p>
          Go to <strong>Dashboard → Profile</strong> and tap <strong>Upgrade to Pro</strong>, or
          visit <Link href="/#pricing">our pricing page</Link>.
        </p>

        <h2>7. Mobile app</h2>
        <ul>
          <li>Download LearnKloud from the <strong>Google Play Store</strong> or <strong>Apple App Store</strong>.</li>
          <li>Sign in with the same account you use on the web — all progress, streaks, and coins sync automatically.</li>
          <li>The mobile app supports offline caching of your recent quiz sessions.</li>
        </ul>

        <h2>8. Getting help</h2>
        <p>
          If you run into any issues or have questions, contact us at{' '}
          <a href="mailto:support@learnkloud.today">support@learnkloud.today</a>.
          We typically respond within 24 hours.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/dashboard"   className="fp-btn-ghost" style={{ fontSize: 13 }}>Go to Dashboard</Link>
          <Link href="/signup"      className="fp-btn-ghost" style={{ fontSize: 13 }}>Create account</Link>
          <Link href="/privacy"     className="fp-btn-ghost" style={{ fontSize: 13 }}>Privacy Policy</Link>
          <Link href="/"            className="fp-btn-ghost" style={{ fontSize: 13 }}>Back to Home</Link>
        </div>
      </div>

      <FpFooter />
    </div>
  );
}
