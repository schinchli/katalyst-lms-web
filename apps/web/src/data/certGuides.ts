/**
 * certGuides — public, SEO-oriented catalog of AWS certification study hubs.
 *
 * Powers the indexable /learn/* pages (open, no auth). Each guide maps to an
 * in-app learning path (where one exists) and links free hands-on labs from
 * github.com/schinchli/cloud-certification-exam-prep for practice.
 */
export interface CertLab {
  title: string;
  url: string;
}

export interface CertGuide {
  /** URL slug — used in /learn/<slug>. */
  slug: string;
  /** Official exam code (e.g. AIF-C01). */
  code: string;
  /** Official certification name (e.g. AWS Certified AI Practitioner). */
  name: string;
  /** Level for grouping/progression. */
  level: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
  /** In-app learning-path id (LEARNING_PATHS), if the app has content for it. */
  pathId?: string;
  /** One-line SEO meta description. */
  description: string;
  /** What the guide covers — shown on the page + used for keywords. */
  topics: string[];
  /** Free hands-on labs to practice. */
  labs: CertLab[];
  /** Suggested next certification slug (progression ladder). */
  next?: string;
}

const EXAM_PREP = 'https://github.com/schinchli/cloud-certification-exam-prep/tree/main/AWS';
const SECURITY_LABS: CertLab[] = [
  { title: 'AWS KMS Masterclass — Encryption, Key Rotation & Multi-Region Keys', url: `${EXAM_PREP}/security-labs/AWS%20KMS%20Masterclass%20-%20Encryption%2C%20Key%20Rotation%2C%20and%20Multi-Region%20Keys%20(Hands-On%20Lab)` },
  { title: 'CloudFront + WAF Edge Security', url: `${EXAM_PREP}/security-labs/CloudFront%20WAF%20Edge%20Security` },
  { title: 'Securing RDS Credentials with KMS & Secrets Manager (Zero-Downtime Rotation)', url: `${EXAM_PREP}/security-labs/Securing%20RDS%20Database%20Credentials%20with%20AWS%20KMS%20and%20Secrets%20Manager%20(Hands-On%2C%20Zero-Downtime%20Rotation)` },
];
const AWS_WORKSHOPS: CertLab = { title: 'AWS Workshops — official guided hands-on labs', url: 'https://workshops.aws/' };
const SKILL_BUILDER: CertLab = { title: 'AWS Skill Builder — free labs & learning plans', url: 'https://skillbuilder.aws/' };

export const CERT_GUIDES: CertGuide[] = [
  {
    slug: 'aws-certified-cloud-practitioner',
    code: 'CLF-C02',
    name: 'AWS Certified Cloud Practitioner',
    level: 'Foundational',
    pathId: 'clf-c02',
    description: 'Free AWS Certified Cloud Practitioner (CLF-C02) study notes, module-by-module reading, flashcards, and practice tests. Start your AWS journey.',
    topics: ['Cloud concepts', 'Security & compliance', 'Core AWS services (EC2, S3, VPC, RDS)', 'Billing, pricing & support', 'Well-Architected basics'],
    labs: [AWS_WORKSHOPS, SKILL_BUILDER],
    next: 'aws-certified-ai-practitioner',
  },
  {
    slug: 'aws-certified-ai-practitioner',
    code: 'AIF-C01',
    name: 'AWS Certified AI Practitioner',
    level: 'Foundational',
    pathId: 'aip-c01',
    description: 'Free AWS Certified AI Practitioner (AIF-C01) study notes and practice tests. Learn generative AI, Amazon Bedrock, RAG, prompt engineering, and responsible AI.',
    topics: ['Fundamentals of AI/ML & generative AI', 'Amazon Bedrock & foundation models', 'RAG & knowledge bases', 'Prompt engineering', 'Responsible AI, security & governance'],
    labs: [{ title: 'AWS GenAI Practitioner study guide (AIF-C01)', url: `${EXAM_PREP}/AIF-C01-GenAI-Practitioner` }, AWS_WORKSHOPS],
    next: 'aws-certified-solutions-architect-associate',
  },
  {
    slug: 'aws-certified-solutions-architect-associate',
    code: 'SAA-C03',
    name: 'AWS Certified Solutions Architect – Associate',
    level: 'Associate',
    pathId: 'architect',
    description: 'Free AWS Certified Solutions Architect Associate (SAA-C03) study notes and practice tests. Design resilient, secure, high-performing, cost-optimized architectures.',
    topics: ['Designing resilient architectures', 'High-performing architectures', 'Secure applications & networks', 'Cost-optimized architectures', 'VPC, EC2, S3, RDS, Aurora, DynamoDB'],
    labs: [AWS_WORKSHOPS, SKILL_BUILDER],
    next: 'aws-certified-machine-learning-associate',
  },
  {
    slug: 'aws-certified-security-specialty',
    code: 'SCS-C02',
    name: 'AWS Certified Security – Specialty',
    level: 'Specialty',
    pathId: 'sec-eng-aws',
    description: 'Free AWS Certified Security Specialty (SCS-C02) study notes, hands-on KMS/WAF/Secrets Manager labs, and practice tests covering identity, data protection, and incident response.',
    topics: ['Threat detection & incident response', 'Identity & access management', 'Infrastructure & edge security', 'Data protection (KMS, encryption)', 'Logging, monitoring & governance'],
    labs: [...SECURITY_LABS, { title: 'AWS Security Specialty study guide', url: `${EXAM_PREP}/SCS-C02-Security-Specialty` }],
  },
  {
    slug: 'aws-certified-machine-learning-associate',
    code: 'MLA-C01',
    name: 'AWS Certified Machine Learning – Associate',
    level: 'Associate',
    pathId: 'mla-c01',
    description: 'Free AWS Machine Learning study notes and practice guidance — data engineering, model training, deployment, and MLOps on Amazon SageMaker.',
    topics: ['Data engineering & feature engineering', 'Model training & tuning', 'ML deployment & MLOps', 'Amazon SageMaker', 'Monitoring & responsible ML'],
    labs: [{ title: 'AWS ML study guide (MLS-C01 / MLA-C01)', url: `${EXAM_PREP}/MLS-C01-ML-Specialty` }, AWS_WORKSHOPS],
    next: 'aws-certified-solutions-architect-professional',
  },
  {
    slug: 'aws-certified-solutions-architect-professional',
    code: 'SAP-C02',
    name: 'AWS Certified Solutions Architect – Professional',
    level: 'Professional',
    pathId: 'sap-c02',
    description: 'Free AWS Solutions Architect Professional (SAP-C02) study notes across 16 domains — accounts, networking, migrations, disaster recovery, and cost control.',
    topics: ['Multi-account & organizations', 'Advanced networking', 'Migrations & modernization', 'Disaster recovery & resilience', 'Cost control & governance'],
    labs: [{ title: 'AWS SAP-C02 study guide (16 domains)', url: `${EXAM_PREP}/SAP-C02` }, AWS_WORKSHOPS],
  },
];

export function certGuideSeoTitle(g: CertGuide): string {
  return `${g.name} (${g.code}) Study Notes and Practice Tests`;
}

export function getCertGuide(slug: string): CertGuide | undefined {
  return CERT_GUIDES.find((g) => g.slug === slug);
}
