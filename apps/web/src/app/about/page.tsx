import type { Metadata } from 'next';
import Link from 'next/link';
import FpNav from '@/components/FpNav';
import FpFooter from '@/components/FpFooter';

export const metadata: Metadata = {
  title: 'About — Katalyst',
  description: 'Katalyst is a cloud certification prep platform with 400+ practice questions for AWS CLF-C02, GenAI, and more.',
};

export default function AboutPage() {
  return (
    <div className="fp-root">
      <FpNav />

      {/* Hero */}
      <section className="fp-section" style={{ textAlign: 'center', paddingBottom: 0 }}>
        <div className="fp-tag">About Katalyst</div>
        <h1 className="fp-section-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
          Built to help you pass — not just practice
        </h1>
        <p className="fp-section-sub" style={{ maxWidth: 640, margin: '0 auto 48px' }}>
          Katalyst is a cloud certification prep platform that combines a rigorous question bank,
          real-time leaderboard, and daily challenges to turn casual studying into consistent progress.
        </p>
      </section>

      {/* Mission cards */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="fp-section-sm">
          <div className="fp-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {[
              { icon: '🎯', title: 'Our mission', desc: 'Make cloud certification accessible to everyone — whether you\'re switching careers, upskilling at work, or chasing your first AWS badge.' },
              { icon: '🔬', title: 'Our approach', desc: 'Every question is authored with a clear explanation. Understanding the why beats memorising the what — especially for scenario-based AWS exams.' },
              { icon: '🌐', title: 'Our reach', desc: 'Katalyst runs on web and mobile (iOS + Android). Your streak, coins, and progress sync in real time across every device you use.' },
            ].map((c) => (
              <div key={c.title} className="fp-feature-card">
                <div className="fp-feature-icon" style={{ background: 'rgba(115,103,240,0.12)' }}>{c.icon}</div>
                <div className="fp-feature-title">{c.title}</div>
                <p className="fp-feature-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we cover */}
      <section className="fp-section">
        <div className="fp-tag">Coverage</div>
        <h2 className="fp-section-title">What Katalyst covers today</h2>
        <p className="fp-section-sub">More certifications are on the roadmap — here&apos;s what you can prep for right now.</p>
        <div className="fp-features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {[
            { icon: '☁️', color: 'rgba(14,165,233,0.12)', title: 'AWS CLF-C02', desc: '195 questions across 5 domain sub-quizzes: Cloud Concepts, Security, Technology, Billing, and a full mock exam.' },
            { icon: '🤖', color: 'rgba(115,103,240,0.12)', title: 'Generative AI', desc: '14 topic categories covering LLMs, prompt engineering, RAG, embeddings, fine-tuning, and responsible AI.' },
            { icon: '📅', color: 'rgba(255,159,67,0.12)', title: 'Daily Challenges', desc: 'A fresh daily quiz keeps your streak alive and keeps weak areas surfaced before exam day.' },
            { icon: '🚀', color: 'rgba(40,199,111,0.12)', title: 'Coming soon', desc: 'AWS SAA-C03, AWS AI Practitioner (AIF-C01), and additional GenAI certification tracks are in development.' },
          ].map((c) => (
            <div key={c.title} className="fp-feature-card">
              <div className="fp-feature-icon" style={{ background: c.color }}>{c.icon}</div>
              <div className="fp-feature-title">{c.title}</div>
              <p className="fp-feature-desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="fp-section-sm">
          <div className="fp-stats-grid">
            {[
              { val: '400+', lbl: 'Practice questions', color: 'var(--primary)' },
              { val: '14+',  lbl: 'Topic categories', color: 'var(--info)' },
              { val: '4.8★', lbl: 'Average app rating', color: 'var(--warning)' },
              { val: '2',    lbl: 'Platforms (web + mobile)', color: 'var(--success)' },
            ].map((s) => (
              <div key={s.lbl} className="fp-stat-card">
                <div className="fp-stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="fp-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section className="fp-cta-band">
        <h2 className="fp-cta-title">Questions or feedback?</h2>
        <p className="fp-cta-sub">We&apos;d love to hear from you — whether it&apos;s a question, a bug report, or a feature idea.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:support@katalysthq.app" className="fp-btn-cta">Contact support</a>
          <Link href="/signup" className="fp-btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}>
            Get started free
          </Link>
        </div>
      </section>

      {/* Legal footer strip */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/privacy"      className="fp-footer-link" style={{ margin: 0 }}>Privacy Policy</Link>
        <Link href="/terms"        className="fp-footer-link" style={{ margin: 0 }}>Terms of Service</Link>
        <Link href="/delete-account" className="fp-footer-link" style={{ margin: 0 }}>Delete Account</Link>
        <Link href="/instructions" className="fp-footer-link" style={{ margin: 0 }}>Instructions</Link>
      </div>

      <FpFooter />
    </div>
  );
}
