import type { Metadata } from 'next';
import Link from 'next/link';
import { CERT_GUIDES, certGuideSeoTitle, type CertGuide } from '@/data/certGuides';

export const metadata: Metadata = {
  title: 'AWS Certification Study Notes & Free Practice Tests | LearnKloud',
  description: 'Free, structured AWS certification study guides — Cloud Practitioner, AI Practitioner, Solutions Architect, Security, Machine Learning, and Professional. Study notes, practice tests, flashcards, and hands-on labs.',
  keywords: ['AWS certification', 'AWS study notes', 'AWS practice tests', 'CLF-C02', 'AIF-C01', 'SAA-C03', 'SCS-C02', 'SAP-C02', 'hands-on labs'],
  alternates: { canonical: '/learn' },
  openGraph: {
    title: 'AWS Certification Study Notes & Free Practice Tests',
    description: 'Structured AWS study guides with practice tests, flashcards, and hands-on labs.',
    type: 'website',
    url: '/learn',
  },
};

const LEVEL_ORDER: CertGuide['level'][] = ['Foundational', 'Associate', 'Professional', 'Specialty'];

export default function LearnIndexPage() {
  const byLevel = LEVEL_ORDER.map((level) => ({ level, guides: CERT_GUIDES.filter((g) => g.level === level) })).filter((g) => g.guides.length);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: 'var(--primary)', textTransform: 'uppercase' }}>Free study hub</p>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: 'var(--text)', margin: '6px 0 10px', lineHeight: 1.15 }}>
          AWS Certification Study Notes &amp; Practice Tests
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 720, lineHeight: 1.6 }}>
          Structured, exam-guide-aligned study notes, practice tests, flashcards, and free hands-on labs for every major AWS certification — from Cloud Practitioner to Professional and Specialty.
        </p>
      </header>

      {/* ── AWS service W5 explainers ── */}
      <Link href="/learn/aws-services" style={{ display: 'block', padding: '20px 22px', border: '2px solid var(--primary)', borderRadius: 14, textDecoration: 'none', marginBottom: 30, background: 'linear-gradient(135deg, rgba(115,103,240,0.06), transparent)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: 'var(--primary)', textTransform: 'uppercase' }}>New · Service explainers</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '4px 0 6px' }}>AWS Services in Five Questions</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          What · Why · When · Where · How for every service on the AI Practitioner exam — filter by your learning path, with official AWS documentation links. →
        </div>
      </Link>

      {byLevel.map(({ level, guides }) => (
        <section key={level} style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>{level}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {guides.map((g) => (
              <Link key={g.slug} href={`/learn/${g.slug}`} style={{ display: 'block', padding: 18, border: '1px solid var(--border)', borderRadius: 14, textDecoration: 'none', background: 'var(--bg)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{g.code}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '4px 0 6px' }}>{g.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{certGuideSeoTitle(g)}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
        Ready to practice? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a free account</Link> to take the quizzes and track your progress.
      </p>
    </main>
  );
}
