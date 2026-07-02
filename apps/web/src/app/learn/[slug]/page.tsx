import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CERT_GUIDES, getCertGuide, certGuideSeoTitle } from '@/data/certGuides';

export function generateStaticParams() {
  return CERT_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getCertGuide(slug);
  if (!g) return { title: 'Certification not found | LearnKloud' };
  const title = certGuideSeoTitle(g);
  return {
    title: `${title} | LearnKloud`,
    description: g.description,
    keywords: [g.code, g.name, 'AWS certification', 'study notes', 'practice tests', 'hands-on labs'],
    alternates: { canonical: `/learn/${g.slug}` },
    openGraph: { title, description: g.description, type: 'article', url: `/learn/${g.slug}` },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function CertGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getCertGuide(slug);
  if (!g) notFound();

  const nextGuide = g.next ? getCertGuide(g.next) : undefined;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        <Link href="/learn" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Study hub</Link> · {g.level}
      </nav>

      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{g.code}</p>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '6px 0 12px', lineHeight: 1.2 }}>
        {certGuideSeoTitle(g)}
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{g.description}</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <Link href={g.pathId ? '/signup' : '/signup'} className="btn-primary" style={{ textDecoration: 'none' }}>
          Start free practice tests
        </Link>
        <Link href="/learn" className="btn-secondary" style={{ textDecoration: 'none' }}>All certifications</Link>
      </div>

      <Section title="What you'll study">
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text)', lineHeight: 1.9 }}>
          {g.topics.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Section>

      <Section title="Hands-on labs">
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 10px' }}>Practice on real AWS with free, step-by-step labs:</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          {g.labs.map((lab) => (
            <li key={lab.url}>
              <a href={lab.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{lab.title} ↗</a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Study notes & practice tests">
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          {g.pathId
            ? <>This certification has a full in-app learning path — module-by-module study notes, spaced-repetition flashcards, and timed practice tests. <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a free account</Link> to start.</>
            : <>Detailed study notes for this exam are available in the open-source guide. <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</Link> to be notified when in-app practice tests launch.</>}
        </p>
      </Section>

      {nextGuide && (
        <Section title="Recommended next">
          <Link href={`/learn/${nextGuide.slug}`} style={{ display: 'inline-block', padding: 14, border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', background: 'var(--bg)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Next: {nextGuide.code}</span>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{nextGuide.name} →</span>
          </Link>
        </Section>
      )}
    </main>
  );
}
