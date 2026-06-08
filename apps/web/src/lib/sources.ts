/**
 * Trusted content-source abstraction.
 * ────────────────────────────────────────────────────────────────────────────
 * Every generated or curated content block can point at a *traceable* source.
 * Sources are resolved through a single abstraction so the backing provider is
 * swappable:
 *
 *   - `web`  (active)  — curated official AWS documentation URLs (this file),
 *                        optionally hydrated at runtime via fetch/WebFetch.
 *   - `mcp`  (future)  — a live AWS Documentation MCP server. When connected,
 *                        implement `mcpProvider` and flip DEFAULT_PROVIDER.
 *
 * Resolution order (Phase 12): MCP → ingested (RAG) → curated registry.
 * Curated official AWS docs always win on trust_level over generic web.
 *
 * The curated registry below is the source of truth and needs no database.
 * The Supabase `content_sources` table (migration 017) is an optional cache
 * for dynamically-fetched sources and is not required for this module to work.
 */

export type SourceType = 'aws_docs' | 'aws_blog' | 'mcp' | 'ingested' | 'manual';

export interface TrustedSource {
  /** Stable lookup key, e.g. 'aws-well-architected'. */
  key: string;
  title: string;
  sourceType: SourceType;
  url: string;
  /** 100 official docs · 80 blog · 60 ingested · 40 web · 20 manual. */
  trustLevel: number;
  /** AWS services / topics this source covers (for matching to lessons). */
  topics?: string[];
}

const t = (
  key: string,
  title: string,
  url: string,
  sourceType: SourceType = 'aws_docs',
  trustLevel = 100,
  topics: string[] = [],
): TrustedSource => ({ key, title, url, sourceType, trustLevel, topics });

// ── Foundational AWS references (cross-cutting) ─────────────────────────────
export const AWS_FOUNDATION_SOURCES: TrustedSource[] = [
  t('aws-well-architected', 'AWS Well-Architected Framework', 'https://aws.amazon.com/architecture/well-architected/', 'aws_docs', 100, ['well-architected', 'pillars', 'architecture']),
  t('aws-well-architected-labs', 'AWS Well-Architected Labs', 'https://www.wellarchitectedlabs.com/', 'aws_docs', 95, ['well-architected', 'hands-on']),
  t('aws-architecture-center', 'AWS Architecture Center', 'https://aws.amazon.com/architecture/', 'aws_docs', 100, ['architecture', 'reference-architecture']),
  t('aws-prescriptive-guidance', 'AWS Prescriptive Guidance', 'https://aws.amazon.com/prescriptive-guidance/', 'aws_docs', 95, ['patterns', 'guidance', 'migration']),
  t('aws-caf', 'AWS Cloud Adoption Framework', 'https://aws.amazon.com/cloud-adoption-framework/', 'aws_docs', 95, ['migration', 'adoption', 'caf']),
  t('aws-security-learning', 'AWS Security Learning', 'https://aws.amazon.com/security/security-learning/', 'aws_docs', 95, ['security']),
  t('aws-builders-library', 'Amazon Builders’ Library', 'https://aws.amazon.com/builders-library/', 'aws_blog', 90, ['operations', 'reliability', 'best-practices']),
  t('aws-workshops', 'AWS Workshops', 'https://workshops.aws/', 'aws_docs', 90, ['hands-on', 'lab']),
  t('aws-skill-builder', 'AWS Skill Builder', 'https://explore.skillbuilder.aws/', 'aws_docs', 90, ['training', 'certification']),
  t('aws-iam-best-practices', 'IAM Security Best Practices', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', 'aws_docs', 100, ['iam', 'security', 'identity']),
];

// ── Per-service official documentation roots ────────────────────────────────
export const AWS_SERVICE_SOURCES: TrustedSource[] = [
  t('doc-vpc', 'Amazon VPC User Guide', 'https://docs.aws.amazon.com/vpc/latest/userguide/', 'aws_docs', 100, ['vpc', 'networking', 'subnet']),
  t('doc-ec2', 'Amazon EC2 Documentation', 'https://docs.aws.amazon.com/ec2/', 'aws_docs', 100, ['ec2', 'compute']),
  t('doc-s3', 'Amazon S3 User Guide', 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/', 'aws_docs', 100, ['s3', 'storage', 'object']),
  t('doc-ebs', 'Amazon EBS User Guide', 'https://docs.aws.amazon.com/ebs/latest/userguide/', 'aws_docs', 100, ['ebs', 'storage', 'block']),
  t('doc-efs', 'Amazon EFS User Guide', 'https://docs.aws.amazon.com/efs/latest/ug/', 'aws_docs', 100, ['efs', 'storage', 'file']),
  t('doc-rds', 'Amazon RDS User Guide', 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/', 'aws_docs', 100, ['rds', 'database', 'relational']),
  t('doc-aurora', 'Amazon Aurora User Guide', 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/', 'aws_docs', 100, ['aurora', 'database']),
  t('doc-dynamodb', 'Amazon DynamoDB Developer Guide', 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/', 'aws_docs', 100, ['dynamodb', 'database', 'nosql']),
  t('doc-iam', 'AWS IAM User Guide', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/', 'aws_docs', 100, ['iam', 'security', 'identity']),
  t('doc-organizations', 'AWS Organizations User Guide', 'https://docs.aws.amazon.com/organizations/latest/userguide/', 'aws_docs', 100, ['organizations', 'security', 'governance']),
  t('doc-cloudwatch', 'Amazon CloudWatch User Guide', 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/', 'aws_docs', 100, ['cloudwatch', 'monitoring']),
  t('doc-cloudtrail', 'AWS CloudTrail User Guide', 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/', 'aws_docs', 100, ['cloudtrail', 'monitoring', 'audit']),
  t('doc-cloudformation', 'AWS CloudFormation User Guide', 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/', 'aws_docs', 100, ['cloudformation', 'automation', 'iac']),
  t('doc-beanstalk', 'AWS Elastic Beanstalk Developer Guide', 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/', 'aws_docs', 100, ['beanstalk', 'automation', 'deploy']),
  t('doc-ecs', 'Amazon ECS Developer Guide', 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/', 'aws_docs', 100, ['ecs', 'containers']),
  t('doc-eks', 'Amazon EKS User Guide', 'https://docs.aws.amazon.com/eks/latest/userguide/', 'aws_docs', 100, ['eks', 'containers', 'kubernetes']),
  t('doc-fargate', 'AWS Fargate User Guide', 'https://docs.aws.amazon.com/AmazonECS/latest/userguide/what-is-fargate.html', 'aws_docs', 100, ['fargate', 'containers', 'serverless']),
  t('doc-lambda', 'AWS Lambda Developer Guide', 'https://docs.aws.amazon.com/lambda/latest/dg/', 'aws_docs', 100, ['lambda', 'serverless', 'compute']),
  t('doc-apigateway', 'Amazon API Gateway Developer Guide', 'https://docs.aws.amazon.com/apigateway/latest/developerguide/', 'aws_docs', 100, ['apigateway', 'serverless', 'api']),
  t('doc-sqs', 'Amazon SQS Developer Guide', 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/', 'aws_docs', 100, ['sqs', 'serverless', 'messaging']),
  t('doc-sns', 'Amazon SNS Developer Guide', 'https://docs.aws.amazon.com/sns/latest/dg/', 'aws_docs', 100, ['sns', 'serverless', 'messaging']),
  t('doc-route53', 'Amazon Route 53 Developer Guide', 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/', 'aws_docs', 100, ['route53', 'edge', 'dns']),
  t('doc-cloudfront', 'Amazon CloudFront Developer Guide', 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/', 'aws_docs', 100, ['cloudfront', 'edge', 'cdn']),
  t('doc-directconnect', 'AWS Direct Connect User Guide', 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/', 'aws_docs', 100, ['directconnect', 'networking', 'hybrid']),
  t('doc-transitgateway', 'AWS Transit Gateway Guide', 'https://docs.aws.amazon.com/vpc/latest/tgw/', 'aws_docs', 100, ['transitgateway', 'networking']),
  t('doc-vpn', 'AWS Site-to-Site VPN Guide', 'https://docs.aws.amazon.com/vpn/latest/s2svpn/', 'aws_docs', 100, ['vpn', 'networking', 'hybrid']),
  t('doc-backup', 'AWS Backup Developer Guide', 'https://docs.aws.amazon.com/aws-backup/latest/devguide/', 'aws_docs', 100, ['backup', 'recovery', 'reliability']),
  t('doc-shield', 'AWS Shield Developer Guide', 'https://docs.aws.amazon.com/waf/latest/developerguide/shield-chapter.html', 'aws_docs', 100, ['shield', 'security', 'ddos']),
  t('doc-waf', 'AWS WAF Developer Guide', 'https://docs.aws.amazon.com/waf/latest/developerguide/', 'aws_docs', 100, ['waf', 'security']),
  t('doc-kms', 'AWS KMS Developer Guide', 'https://docs.aws.amazon.com/kms/latest/developerguide/', 'aws_docs', 100, ['kms', 'security', 'encryption']),
  t('doc-guardduty', 'Amazon GuardDuty User Guide', 'https://docs.aws.amazon.com/guardduty/latest/ug/', 'aws_docs', 100, ['guardduty', 'security']),
];

const ALL_SOURCES: TrustedSource[] = [...AWS_FOUNDATION_SOURCES, ...AWS_SERVICE_SOURCES];
const BY_KEY = new Map(ALL_SOURCES.map((s) => [s.key, s]));

// ── Per-module curated references (the "Official AWS References" sections) ────
// Maps a lesson/module id → ordered source keys to display on that lesson.
export const MODULE_SOURCES: Record<string, string[]> = {
  // Architecting on AWS
  'arch-m01': ['aws-well-architected', 'aws-architecture-center', 'aws-skill-builder'],
  'arch-m02': ['aws-iam-best-practices', 'doc-iam', 'doc-organizations', 'aws-security-learning'],
  'arch-m03': ['doc-vpc', 'aws-architecture-center', 'aws-well-architected'],
  'arch-m04': ['doc-ec2', 'aws-well-architected', 'aws-builders-library'],
  'arch-m05': ['doc-s3', 'doc-ebs', 'doc-efs', 'aws-architecture-center'],
  'arch-m06': ['doc-rds', 'doc-aurora', 'doc-dynamodb', 'aws-architecture-center'],
  'arch-m07': ['doc-cloudwatch', 'doc-cloudtrail', 'aws-builders-library'],
  'arch-m08': ['doc-cloudformation', 'doc-beanstalk', 'aws-prescriptive-guidance'],
  'arch-m09': ['doc-ecs', 'doc-eks', 'doc-fargate', 'aws-architecture-center'],
  'arch-m10': ['doc-transitgateway', 'doc-directconnect', 'doc-vpn', 'doc-vpc'],
  'arch-m11': ['doc-lambda', 'doc-apigateway', 'doc-sqs', 'doc-sns'],
  'arch-m12': ['doc-route53', 'doc-cloudfront', 'aws-architecture-center'],
  'arch-m13': ['doc-backup', 'aws-well-architected', 'aws-prescriptive-guidance'],
  // CLF-C02
  'clf-c02-m01': ['aws-well-architected', 'aws-architecture-center'],
  'clf-c02-m02': ['doc-ec2', 'doc-lambda', 'doc-ecs'],
  'clf-c02-m03': ['aws-architecture-center', 'aws-well-architected'],
  'clf-c02-m04': ['doc-vpc', 'doc-route53', 'doc-cloudfront'],
  'clf-c02-m05': ['doc-s3', 'doc-rds', 'doc-dynamodb'],
  'clf-c02-m06': ['aws-iam-best-practices', 'doc-iam', 'aws-security-learning'],
  'clf-c02-m07': ['doc-cloudwatch', 'doc-cloudtrail'],
  'clf-c02-m08': ['aws-skill-builder', 'aws-architecture-center'],
  'clf-c02-m09': ['aws-caf', 'aws-prescriptive-guidance'],
};

// ── Resolution API ──────────────────────────────────────────────────────────

export function resolveSource(key: string): TrustedSource | undefined {
  return BY_KEY.get(key);
}

/** Ordered, de-duplicated sources curated for a lesson/module. */
export function getModuleSources(moduleId: string): TrustedSource[] {
  const keys = MODULE_SOURCES[moduleId] ?? [];
  const seen = new Set<string>();
  const out: TrustedSource[] = [];
  for (const k of keys) {
    const s = BY_KEY.get(k);
    if (s && !seen.has(s.key)) { seen.add(s.key); out.push(s); }
  }
  return out;
}

/** Best-trust sources whose topics intersect the query terms. */
export function getSourcesByTopic(terms: string[], limit = 5): TrustedSource[] {
  const wanted = new Set(terms.map((x) => x.toLowerCase()));
  return ALL_SOURCES
    .map((s) => ({ s, hits: (s.topics ?? []).filter((tp) => wanted.has(tp)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.s.trustLevel - a.s.trustLevel)
    .slice(0, limit)
    .map((x) => x.s);
}

// ── Swappable provider backend ──────────────────────────────────────────────
// Resolution order is MCP → ingested → curated. Today only the curated/web
// provider is active. When an AWS Documentation MCP server is connected, add
// `mcpProvider` and prepend it to PROVIDERS.

export interface SourceProvider {
  name: 'mcp' | 'web';
  /** Return a fresh source for a service/topic, or null if it can't. */
  resolve(query: string): Promise<TrustedSource | null>;
}

/** Curated/web provider — resolves against the in-repo registry (no network). */
export const webProvider: SourceProvider = {
  name: 'web',
  async resolve(query: string) {
    const hits = getSourcesByTopic(query.split(/\s+/), 1);
    return hits[0] ?? null;
  },
};

/**
 * MCP provider. The AWS Documentation MCP server (awslabs.aws-documentation-mcp-server,
 * configured in .mcp.json) is integrated at INGEST time, not request time:
 *   scripts/mcp-client.mjs      — stdio client for the MCP server
 *   scripts/ingest-aws-docs.mjs — fetches official docs via MCP → embeds → RAG
 *                                 (corpus 'aws-docs', with source_url + retrieved_at)
 *
 * The deployed app (Vercel) cannot spawn the uvx MCP process per request, so at
 * runtime official AWS doc content is served from the ingested 'aws-docs' RAG
 * corpus (Ask-AI / search already include it). This provider therefore resolves
 * the canonical curated URL synchronously and lets RAG supply the live content.
 */
export const mcpProvider: SourceProvider = {
  name: 'mcp',
  async resolve(query: string) {
    // Map a topic query to the curated official doc URL that the MCP ingest used.
    const hits = getSourcesByTopic(query.split(/\s+/), 1);
    const s = hits[0];
    return s && s.sourceType === 'aws_docs' ? { ...s, sourceType: 'mcp', trustLevel: 100 } : null;
  },
};

const PROVIDERS: SourceProvider[] = [mcpProvider, webProvider];

/** Resolve the best available source for a free-text service/topic query. */
export async function resolveBestSource(query: string): Promise<TrustedSource | null> {
  for (const p of PROVIDERS) {
    const r = await p.resolve(query);
    if (r) return r;
  }
  return null;
}

export const ALL_SOURCE_KEYS = ALL_SOURCES.map((s) => s.key);
