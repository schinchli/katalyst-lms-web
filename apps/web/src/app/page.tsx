'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Shared nav + footer ────────────────────────────────────────────────────────

function FpNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fp-nav">
      <Link href="/" className="fp-nav-brand">
        <div className="fp-nav-logo">K</div>
        <span className="fp-nav-name">Katalyst</span>
      </Link>

      {/* Desktop nav */}
      <div className={`fp-nav-links${open ? ' open' : ''}`}>
        <a href="#features" className="fp-nav-link" onClick={() => setOpen(false)}>Features</a>
        <a href="#pricing"  className="fp-nav-link" onClick={() => setOpen(false)}>Pricing</a>
        <a href="#faq"      className="fp-nav-link" onClick={() => setOpen(false)}>FAQ</a>
        <Link href="/about" className="fp-nav-link" onClick={() => setOpen(false)}>About</Link>
      </div>

      <div className="fp-nav-actions">
        <Link href="/login"  className="fp-btn-ghost">Sign in</Link>
        <Link href="/signup" className="fp-btn-primary">Get started free</Link>
        <button className="fp-hamburger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>
    </nav>
  );
}

function FpFooter() {
  return (
    <footer className="fp-footer">
      <div className="fp-footer-inner">
        <div>
          <Link href="/" className="fp-nav-brand" style={{ textDecoration: 'none' }}>
            <div className="fp-nav-logo">K</div>
            <span className="fp-nav-name">Katalyst</span>
          </Link>
          <p className="fp-footer-brand-desc">
            Master AWS &amp; cloud certifications with 400+ practice questions, daily challenges,
            and a real-time leaderboard. Free to start — Pro unlocks everything.
          </p>
        </div>
        <div>
          <div className="fp-footer-col-title">Product</div>
          <a href="#features" className="fp-footer-link">Features</a>
          <a href="#pricing"  className="fp-footer-link">Pricing</a>
          <a href="#faq"      className="fp-footer-link">FAQ</a>
          <Link href="/dashboard/quizzes" className="fp-footer-link">Browse Quizzes</Link>
        </div>
        <div>
          <div className="fp-footer-col-title">Company</div>
          <Link href="/about"        className="fp-footer-link">About</Link>
          <Link href="/privacy"      className="fp-footer-link">Privacy Policy</Link>
          <Link href="/terms"        className="fp-footer-link">Terms of Service</Link>
          <Link href="/delete-account" className="fp-footer-link">Delete Account</Link>
        </div>
        <div>
          <div className="fp-footer-col-title">Support</div>
          <a href="mailto:support@katalysthq.app" className="fp-footer-link">support@katalysthq.app</a>
          <Link href="/instructions" className="fp-footer-link">Instructions</Link>
          <Link href="/login"        className="fp-footer-link">Sign in</Link>
          <Link href="/signup"       className="fp-footer-link">Create account</Link>
        </div>
      </div>
      <div className="fp-footer-bottom">
        <span className="fp-footer-copy">© {new Date().getFullYear()} Katalyst. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/privacy" className="fp-footer-link" style={{ margin: 0 }}>Privacy</Link>
          <Link href="/terms"   className="fp-footer-link" style={{ margin: 0 }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What certifications does Katalyst cover?',
    a: 'Katalyst currently covers AWS Certified Cloud Practitioner (CLF-C02) with 195 questions across 5 domain-specific sub-quizzes, plus 14 GenAI and cloud technology categories. More certifications (SAA-C03, AI Practitioner) are on the roadmap.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes — free users can attempt every quiz with a 25-question Fisher-Yates shuffled subset. No credit card required. Upgrade to Pro for unlimited access to all questions, including the full 195-question CLF-C02 exam.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Yes. Katalyst is available on Android (Google Play) and iOS (App Store). The mobile app syncs your progress, daily streaks, coins, and leaderboard rank in real time with the web portal.',
  },
  {
    q: 'How is Pro different from the free tier?',
    a: 'Pro removes the 25-question cap, giving you the full question bank (195 CLF-C02 + all GenAI questions). Pro also removes all ads, gives access to detailed performance analytics per domain, and gets priority support.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We accept all major cards and UPI via Razorpay (India) and Stripe (international). Subscriptions are ₹999/year or ₹149/month. Individual quiz unlocks are also available if you only want a specific certification track.',
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="fp-section-full" style={{ background: 'var(--surface)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div className="fp-tag">FAQ</div>
        <h2 className="fp-section-title">Frequently asked questions</h2>
        <p className="fp-section-sub">Everything you need to know about Katalyst and how it works.</p>
        <div className="fp-faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className="fp-faq-item">
              <button
                className={`fp-faq-q${openIdx === i ? ' open' : ''}`}
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                {f.q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openIdx === i && <p className="fp-faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="fp-root">
      <FpNav />

      {/* ── Hero ── */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="fp-hero">
          <div>
            <div className="fp-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Cloud Certification Prep
            </div>
            <h1 className="fp-hero-title">
              Master <span>AWS &amp; Cloud</span>{' '}
              Certifications
            </h1>
            <p className="fp-hero-desc">
              400+ expertly crafted practice questions for AWS CLF-C02, GenAI, and more.
              Practice with instant explanations, track your score across domains, and pass
              your exam with confidence.
            </p>
            <div className="fp-hero-actions">
              <Link href="/signup" className="fp-btn-hero">Start for free →</Link>
              <a href="#pricing" className="fp-btn-outline">View pricing</a>
            </div>
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1,2,3,4,5].map((n) => (
                  <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="#FF9F43" stroke="#FF9F43" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', marginLeft: 4 }}>4.8</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No credit card required</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Free forever plan</span>
            </div>
          </div>

          <div className="fp-hero-visual">
            {/* Mock quiz card */}
            <div className="fp-hero-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>CLF-C02 · Q 12 of 195</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: 'rgba(40,199,111,0.1)', padding: '3px 8px', borderRadius: 6 }}>28s</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '62%', background: 'var(--primary)', borderRadius: 2 }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5, margin: '0 0 14px' }}>
                Which AWS service provides a managed relational database in the cloud?
              </p>
              {['Amazon DynamoDB', 'Amazon RDS', 'Amazon Redshift', 'Amazon ElastiCache'].map((opt, i) => (
                <div
                  key={opt}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${i === 1 ? 'var(--success)' : 'var(--border)'}`,
                    background: i === 1 ? 'rgba(40,199,111,0.08)' : 'var(--bg)',
                    fontSize: 13,
                    color: i === 1 ? 'var(--success)' : 'var(--text)',
                    fontWeight: i === 1 ? 600 : 400,
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {i === 1 && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {opt}
                </div>
              ))}
            </div>
            {/* Stats row */}
            <div className="fp-hero-stat-row">
              <div className="fp-hero-stat">
                <div className="fp-hero-stat-val">400+</div>
                <div className="fp-hero-stat-lbl">Questions</div>
              </div>
              <div className="fp-hero-stat">
                <div className="fp-hero-stat-val">14+</div>
                <div className="fp-hero-stat-lbl">Topics</div>
              </div>
              <div className="fp-hero-stat">
                <div className="fp-hero-stat-val" style={{ fontSize: 20 }}>4.8★</div>
                <div className="fp-hero-stat-lbl">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="fp-section">
        <div className="fp-tag">Features</div>
        <h2 className="fp-section-title">Everything you need to pass</h2>
        <p className="fp-section-sub">Built for serious learners who want to pass their cloud certification — not just browse flashcards.</p>
        <div className="fp-features-grid">
          {[
            { icon: '📚', color: 'rgba(115,103,240,0.12)', title: '400+ Practice Questions', desc: 'Full CLF-C02 question bank (195 Qs across 5 domain sub-quizzes) plus 14 GenAI and cloud technology categories.' },
            { icon: '⚡', color: 'rgba(255,159,67,0.12)', title: 'Daily Challenges', desc: 'Fresh daily quiz keeps your streak alive and surfaces weak spots before they cost you on exam day.' },
            { icon: '💡', color: 'rgba(0,207,232,0.12)', title: 'Instant Explanations', desc: 'Every answer comes with a detailed explanation so you understand the why, not just the what.' },
            { icon: '🏆', color: 'rgba(255,159,67,0.12)', title: 'Leaderboard & XP', desc: 'Earn coins, climb the leaderboard, and compete globally. Gamified progress keeps you consistently motivated.' },
            { icon: '📱', color: 'rgba(40,199,111,0.12)', title: 'iOS & Android App', desc: 'Study on the go. The mobile app syncs streaks, bookmarks, and progress in real time with the web portal.' },
            { icon: '📊', color: 'rgba(115,103,240,0.12)', title: 'Performance Analytics', desc: 'Track your score across all domains. Identify weak areas, review bookmarked questions, and measure improvement.' },
          ].map((f) => (
            <div key={f.title} className="fp-feature-card">
              <div className="fp-feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <div className="fp-feature-title">{f.title}</div>
              <p className="fp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="fp-section-sm">
          <div className="fp-stats-grid">
            {[
              { val: '400+', lbl: 'Practice questions', color: 'var(--primary)' },
              { val: '14+',  lbl: 'Exam topic categories', color: 'var(--info)' },
              { val: '4.8',  lbl: 'Average app rating', color: 'var(--warning)' },
              { val: '100%', lbl: 'Server-side validated scores', color: 'var(--success)' },
            ].map((s) => (
              <div key={s.lbl} className="fp-stat-card">
                <div className="fp-stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="fp-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="fp-section" style={{ textAlign: 'center' }}>
        <div className="fp-tag">Pricing</div>
        <h2 className="fp-section-title">Simple, honest pricing</h2>
        <p className="fp-section-sub" style={{ margin: '0 auto 48px' }}>
          Start free — no card required. Upgrade to Pro when you&apos;re ready for the full question bank.
        </p>
        <div className="fp-pricing-grid">
          {/* Free */}
          <div className="fp-pricing-card">
            <div className="fp-pricing-tier">Free</div>
            <div className="fp-pricing-price">₹0<span>/forever</span></div>
            <div className="fp-pricing-period">No credit card required</div>
            <div className="fp-pricing-divider" />
            <ul className="fp-pricing-list">
              {[
                '25 questions per quiz attempt',
                'All 14+ topic categories',
                'Daily quiz & streak tracking',
                'Leaderboard participation',
                'Mobile app (iOS & Android)',
                'Basic progress tracking',
              ].map((item) => (
                <li key={item} className="fp-pricing-item">
                  <span className="fp-pricing-item-check">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
              {[
                'Unlimited questions',
                'Ad-free experience',
              ].map((item) => (
                <li key={item} className="fp-pricing-item" style={{ opacity: 0.45 }}>
                  <span className="fp-pricing-item-dash">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="fp-btn-outline" style={{ display: 'block', textAlign: 'center' }}>
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="fp-pricing-card featured">
            <div className="fp-pricing-badge">Most popular</div>
            <div className="fp-pricing-tier" style={{ color: 'var(--primary)' }}>Pro</div>
            <div className="fp-pricing-price">₹999<span>/year</span></div>
            <div className="fp-pricing-period">or ₹149/month · cancel anytime</div>
            <div className="fp-pricing-divider" />
            <ul className="fp-pricing-list">
              {[
                'Everything in Free',
                'Unlimited questions per quiz',
                'Full 195-question CLF-C02 exam',
                'All GenAI & cloud topic questions',
                'Ad-free experience',
                'Domain-level performance analytics',
                'Priority support',
              ].map((item) => (
                <li key={item} className="fp-pricing-item">
                  <span className="fp-pricing-item-check">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="fp-btn-primary" style={{ display: 'block', textAlign: 'center' }}>
              Start Pro — ₹999/year
            </Link>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '10px 0 0', textAlign: 'center' }}>
              Individual quiz unlock also available
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── CTA band ── */}
      <section className="fp-cta-band">
        <h2 className="fp-cta-title">Ready to start your cloud journey?</h2>
        <p className="fp-cta-sub">Join thousands of learners preparing for AWS &amp; cloud certifications.</p>
        <Link href="/signup" className="fp-btn-cta">Get started for free →</Link>
      </section>

      <FpFooter />
    </div>
  );
}
