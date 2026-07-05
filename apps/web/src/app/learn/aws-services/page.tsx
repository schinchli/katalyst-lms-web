import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AWS_SERVICE_CARDS, SERVICE_CATEGORIES, servicesForPath, pathsWithServices,
  type AwsServiceCard,
} from '@/data/awsServiceCards';
import { LEARNING_PATHS } from '@/data/learningPaths';

export const metadata: Metadata = {
  title: 'AWS Services Explained — What, Why, When, Where, How | LearnKloud',
  description:
    'Every AWS service on the AI Practitioner (AIF-C01) exam explained through five questions: what it is, why it exists, when to use it, where it fits, and how to integrate it — with official AWS documentation links.',
  keywords: ['AWS services explained', 'AIF-C01 services', 'AWS AI Practitioner', 'Amazon Bedrock', 'Amazon SageMaker', 'AWS exam services'],
  alternates: { canonical: '/learn/aws-services' },
  openGraph: {
    title: 'AWS Services Explained — the W5 Guide',
    description: 'What · Why · When · Where · How for every AIF-C01 service, with official AWS links.',
    type: 'website',
    url: '/learn/aws-services',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  'Generative AI': '✨',
  'ML Platform (SageMaker)': '🧠',
  'AI Services': '🤖',
  'Data & Analytics': '🗄️',
  'Security & Governance': '🛡️',
  'Compute & Cost': '⚙️',
};

function ServiceCardTile({ svc }: { svc: AwsServiceCard }) {
  return (
    <Link
      href={`/learn/aws-services/${svc.id}`}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px',
        border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none',
        background: 'var(--surface, #fff)',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{svc.name}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{svc.tagline}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {svc.what.length > 150 ? `${svc.what.slice(0, 147)}…` : svc.what}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
        What · Why · When · Where · How →
      </span>
    </Link>
  );
}

export default async function AwsServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path: selectedPath } = await searchParams;
  const validPathIds = pathsWithServices();
  const active = selectedPath && validPathIds.includes(selectedPath) ? selectedPath : null;
  const activePathMeta = active ? LEARNING_PATHS.find((p) => p.id === active) : null;

  const cards = active ? servicesForPath(active) : AWS_SERVICE_CARDS;
  const selectorPaths = LEARNING_PATHS.filter((p) => validPathIds.includes(p.id));

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px' }}>
      <nav style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        <Link href="/learn" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Study hub</Link> · AWS services
      </nav>

      <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2 }}>
        AWS Services, Explained in Five Questions
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 760 }}>
        Every service card answers the questions that actually matter when you meet a new AWS service:
        <strong> What</strong> is it, <strong>why</strong> does it exist, <strong>when</strong> should you
        pick it, <strong>where</strong> does it sit in an architecture, and <strong>how</strong> do you
        integrate it — plus exam-angle tips and links to the official AWS documentation and blogs.
        Coverage is tuned to the AWS Certified AI Practitioner (AIF-C01) exam.
      </p>

      {/* ── Learning-path selector ── */}
      <section style={{ margin: '26px 0' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
          Show services for your learning path
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/learn/aws-services"
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none',
              border: '1px solid var(--border)',
              background: !active ? 'var(--primary)' : 'transparent',
              color: !active ? '#fff' : 'var(--text-secondary)',
            }}
          >
            All services ({AWS_SERVICE_CARDS.length})
          </Link>
          {selectorPaths.map((p) => (
            <Link
              key={p.id}
              href={`/learn/aws-services?path=${p.id}`}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                border: `1px solid ${active === p.id ? p.color : 'var(--border)'}`,
                background: active === p.id ? p.color : 'transparent',
                color: active === p.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {p.certCode} ({servicesForPath(p.id).length})
            </Link>
          ))}
        </div>
        {activePathMeta && (
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 12 }}>
            The <strong>{cards.length} services</strong> below are the ones the{' '}
            <strong>{activePathMeta.certName}</strong> path expects you to know.{' '}
            <Link href={`/dashboard/learning-paths/${activePathMeta.id}`} style={{ color: 'var(--primary)' }}>
              Open the study path →
            </Link>
          </p>
        )}
      </section>

      {/* ── Category-grouped cards ── */}
      {SERVICE_CATEGORIES.map((cat) => {
        const items = cards.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} style={{ marginTop: 34 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>
              {CATEGORY_ICONS[cat]} {cat} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>· {items.length}</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
              {items.map((svc) => <ServiceCardTile key={svc.id} svc={svc} />)}
            </div>
          </section>
        );
      })}

      <p style={{ marginTop: 40, fontSize: 13, color: 'var(--text-secondary)' }}>
        Preparing for the exam? Start the{' '}
        <Link href="/learn/aws-certified-ai-practitioner" style={{ color: 'var(--primary)' }}>
          AI Practitioner study guide
        </Link>{' '}
        or jump into the{' '}
        <Link href="/dashboard/learning-paths/aip-c01" style={{ color: 'var(--primary)' }}>
          AIF-C01 learning path
        </Link>.
      </p>
    </main>
  );
}
