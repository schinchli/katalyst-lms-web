import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AWS_SERVICE_CARDS, getServiceCard } from '@/data/awsServiceCards';
import { LEARNING_PATHS } from '@/data/learningPaths';

export function generateStaticParams() {
  return AWS_SERVICE_CARDS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const svc = getServiceCard(id);
  if (!svc) return { title: 'Service not found | LearnKloud' };
  const title = `${svc.name} — What, Why, When, Where, How`;
  return {
    title: `${title} | LearnKloud`,
    description: `${svc.name} explained for the AWS AI Practitioner exam: ${svc.tagline} ${svc.what.slice(0, 100)}…`,
    keywords: [svc.name, 'AWS', 'AIF-C01', 'AI Practitioner', 'when to use', 'how to integrate'],
    alternates: { canonical: `/learn/aws-services/${svc.id}` },
    openGraph: { title, description: svc.tagline, type: 'article', url: `/learn/aws-services/${svc.id}` },
  };
}

const W5: { key: 'what' | 'why' | 'when' | 'where' | 'how'; label: string; icon: string }[] = [
  { key: 'what',  label: 'What is it?',            icon: '❓' },
  { key: 'why',   label: 'Why does it exist?',     icon: '💡' },
  { key: 'when',  label: 'When should you use it?', icon: '⏱️' },
  { key: 'where', label: 'Where does it fit?',     icon: '🗺️' },
  { key: 'how',   label: 'How do you integrate it?', icon: '🔌' },
];

export default async function ServiceLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = getServiceCard(id);
  if (!svc) notFound();

  const relatedPaths = LEARNING_PATHS.filter((p) => svc.paths.includes(p.id));
  const related = AWS_SERVICE_CARDS.filter((c) => c.category === svc.category && c.id !== svc.id).slice(0, 4);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        <Link href="/learn" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Study hub</Link>
        {' · '}
        <Link href="/learn/aws-services" style={{ color: 'var(--primary)', textDecoration: 'none' }}>AWS services</Link>
        {' · '}{svc.category}
      </nav>

      <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>
        {svc.name}
      </h1>
      <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 18px' }}>
        {svc.tagline}
      </p>

      {/* Official links up top — deep reading on AWS properties */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <a href={svc.docsUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          📖 Official AWS documentation ↗
        </a>
        <a href={svc.blogUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          📰 Official AWS blog ↗
        </a>
      </div>

      {/* ── The five questions ── */}
      {W5.map(({ key, label, icon }) => (
        <section key={key} style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            {icon} {label}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {svc[key]}
          </p>
        </section>
      ))}

      {/* ── Commonly wired to ── */}
      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>🧩 Commonly integrated with</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {svc.integrations.map((name) => {
            const target = AWS_SERVICE_CARDS.find((c) => c.name === name || c.name.startsWith(name));
            return target ? (
              <Link key={name} href={`/learn/aws-services/${target.id}`}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 16, padding: '6px 12px' }}>
                {name}
              </Link>
            ) : (
              <span key={name} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: '6px 12px' }}>
                {name}
              </span>
            );
          })}
        </div>
      </section>

      {/* ── Exam angle ── */}
      <section style={{ marginTop: 26, border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>🎯 Exam angle (AIF-C01)</h2>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {svc.examTips.map((tip, i) => (
            <li key={i} style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{tip}</li>
          ))}
        </ul>
      </section>

      {/* ── Study this service in a path ── */}
      {relatedPaths.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>📚 Study it in a learning path</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {relatedPaths.map((p) => (
              <Link key={p.id} href={`/dashboard/learning-paths/${p.id}`}
                style={{ textDecoration: 'none', border: '1px solid var(--border)', borderLeft: `4px solid ${p.color}`, borderRadius: 10, padding: '14px 16px', display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: p.color }}>{p.certCode}</span>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '2px 0' }}>{p.certName}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Flashcards, notes & quizzes covering this service →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Related services ── */}
      {related.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
            More in {svc.category}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {related.map((c) => (
              <Link key={c.id} href={`/learn/aws-services/${c.id}`}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
                {c.name} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
