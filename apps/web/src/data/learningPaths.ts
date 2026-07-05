import { INGESTED_PATHS } from './ingestedCertPaths';

/**
 * Learning Path definitions — sequenced step-by-step content tracks
 * for each AWS/GenAI certification target.
 *
 * Each step has a type (video | flashcard | quiz), a resourceId that
 * maps to PLAYLIST[id], flashcard category, or quiz id, and
 * estimated minutes to complete.
 */

export type StepType = 'video' | 'flashcard' | 'quiz' | 'notes' | 'lab' | 'cheatsheet';

export interface LearningStep {
  id: string;
  type: StepType;
  resourceId: string;   // video.id | flashcard category | quiz.id | (external step: label)
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  icon: string;         // Feather icon name
  why: string;          // short explanation of why this step matters
  url?: string;         // external link for 'lab' / 'cheatsheet' steps (opens in browser)
}

export interface LearningPath {
  id: string;
  certCode: string;
  certName: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalHours: number;
  color: string;        // accent hex for this track
  steps: LearningStep[];
}

export const LEARNING_PATHS: LearningPath[] = [
  ...INGESTED_PATHS,
  {
    id: 'sec-eng-aws',
    certCode: 'SCS-C03',
    certName: 'Security Engineering on AWS',
    tagline: 'Official Security Engineering on AWS curriculum — read, drill, and test across eight modules covering identity, data protection, infrastructure, monitoring, and incident response.',
    difficulty: 'Advanced',
    totalHours: 14,
    color: '#DD344C',
    steps: [
      // ── Module 1: Security Overview ──
      {
        id: 'seceng-m01-notes', type: 'notes', resourceId: "sec-eng-m01",
        title: "Read: Security Overview",
        subtitle: "Detailed notes · Understanding security fundamentals in the AWS Cloud",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m01-flash', type: 'flashcard', resourceId: "sec-eng-m01",
        title: "Module 1: Security Overview",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m01-quiz', type: 'quiz', resourceId: "sec-eng-aws-m01",
        title: "Quiz: Security Overview",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 2: Access and Authorizations on AWS ──
      {
        id: 'seceng-m02-notes', type: 'notes', resourceId: "sec-eng-m02",
        title: "Read: Access and Authorizations on AWS",
        subtitle: "Detailed notes · Understanding IAM and API security on AWS",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m02-flash', type: 'flashcard', resourceId: "sec-eng-m02",
        title: "Module 2: Access and Authorizations on AWS",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m02-quiz', type: 'quiz', resourceId: "sec-eng-aws-m02",
        title: "Quiz: Access and Authorizations on AWS",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 3: Account Management and Provisioning on AWS ──
      {
        id: 'seceng-m03-notes', type: 'notes', resourceId: "sec-eng-m03",
        title: "Read: Account Management and Provisioning on AWS",
        subtitle: "Detailed notes · Understanding multi-account management and security on AWS.",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m03-flash', type: 'flashcard', resourceId: "sec-eng-m03",
        title: "Module 3: Account Management and Provisioning on AWS",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m03-quiz', type: 'quiz', resourceId: "sec-eng-aws-m03",
        title: "Quiz: Account Management and Provisioning on AWS",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 4: Managing Keys and Secrets on AWS ──
      {
        id: 'seceng-m04-notes', type: 'notes', resourceId: "sec-eng-m04",
        title: "Read: Managing Keys and Secrets on AWS",
        subtitle: "Detailed notes · Learn to manage keys, certificates, and secrets using AWS se",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m04-flash', type: 'flashcard', resourceId: "sec-eng-m04",
        title: "Module 4: Managing Keys and Secrets on AWS",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m04-quiz', type: 'quiz', resourceId: "sec-eng-aws-m04",
        title: "Quiz: Managing Keys and Secrets on AWS",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 5: Data Security ──
      {
        id: 'seceng-m05-notes', type: 'notes', resourceId: "sec-eng-m05",
        title: "Read: Data Security",
        subtitle: "Detailed notes · Protecting data at rest and after use in AWS.",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m05-flash', type: 'flashcard', resourceId: "sec-eng-m05",
        title: "Module 5: Data Security",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m05-quiz', type: 'quiz', resourceId: "sec-eng-aws-m05",
        title: "Quiz: Data Security",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 6: Infrastructure and Edge Protection ──
      {
        id: 'seceng-m06-notes', type: 'notes', resourceId: "sec-eng-m06",
        title: "Read: Infrastructure and Edge Protection",
        subtitle: "Detailed notes · Understanding AWS services for securing infrastructure and e",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m06-flash', type: 'flashcard', resourceId: "sec-eng-m06",
        title: "Module 6: Infrastructure and Edge Protection",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m06-quiz', type: 'quiz', resourceId: "sec-eng-aws-m06",
        title: "Quiz: Infrastructure and Edge Protection",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 7: Monitoring and Collecting Logs on AWS ──
      {
        id: 'seceng-m07-notes', type: 'notes', resourceId: "sec-eng-m07",
        title: "Read: Monitoring and Collecting Logs on AWS",
        subtitle: "Detailed notes · Understanding AWS log management and monitoring techniques.",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m07-flash', type: 'flashcard', resourceId: "sec-eng-m07",
        title: "Module 7: Monitoring and Collecting Logs on AWS",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m07-quiz', type: 'quiz', resourceId: "sec-eng-aws-m07",
        title: "Quiz: Monitoring and Collecting Logs on AWS",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
      // ── Module 8: Responding to Threats ──
      {
        id: 'seceng-m08-notes', type: 'notes', resourceId: "sec-eng-m08",
        title: "Read: Responding to Threats",
        subtitle: "Detailed notes · Understanding incident response in AWS",
        estimatedMinutes: 15, icon: 'book-open',
        why: 'Read the grounded module notes with architecture diagrams before drilling and testing.',
      },
      {
        id: 'seceng-m08-flash', type: 'flashcard', resourceId: "sec-eng-m08",
        title: "Module 8: Responding to Threats",
        subtitle: "14 cards · key terms and services",
        estimatedMinutes: 12, icon: 'layers',
        why: 'Reinforce the module\u2019s core terms and AWS services with spaced repetition.',
      },
      {
        id: 'seceng-m08-quiz', type: 'quiz', resourceId: "sec-eng-aws-m08",
        title: "Quiz: Responding to Threats",
        subtitle: '8 questions · 16 min',
        estimatedMinutes: 16, icon: 'check-square',
        why: 'Validate the module with scenario questions in the SCS-C03 exam style.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  // AWS Cloud Practitioner — CLF-C02
  // ─────────────────────────────────────────────────────────────
  {
    id: 'clf-c02',
    certCode: 'CLF-C02',
    certName: 'AWS Cloud Practitioner',
    tagline: 'Official AWS Cloud Practitioner Essentials curriculum — read, drill, and test across 9 modules, then consolidate by domain before the full exam.',
    difficulty: 'Beginner',
    totalHours: 11,
    color: '#FF9F43',
    steps: [
      // ── Module 1: Introduction to AWS ──────────────────────────────────────
      {
        id: 'clf-m01-notes',
        type: 'notes',
        resourceId: 'clf-c02-m01',
        title: 'Read: Introduction to AWS',
        subtitle: 'Detailed notes · cloud models, 6 benefits, global infrastructure',
        estimatedMinutes: 12,
        icon: 'book-open',
        why: 'Start here. Detailed reading with architecture diagrams builds the mental model the flashcards and quiz then reinforce.',
      },
      {
        id: 'clf-m01-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m01',
        title: 'Module 1: Introduction to AWS',
        subtitle: '6 cards · Cloud models, benefits, client-server',
        estimatedMinutes: 15,
        icon: 'cloud',
        why: 'Understand why cloud computing exists and the three deployment models before touching any AWS service.',
      },
      {
        id: 'clf-m01-quiz',
        type: 'quiz',
        resourceId: 'aws-intro',
        title: 'Quiz: Introduction to AWS',
        subtitle: '5 questions · 10 min',
        estimatedMinutes: 10,
        icon: 'check-square',
        why: 'Validate cloud fundamentals — these questions mirror the Domain 1 style of the actual CLF-C02 exam.',
      },
      // ── Module 2: Compute in the Cloud ─────────────────────────────────────
      {
        id: 'clf-m02-notes',
        type: 'notes',
        resourceId: 'clf-c02-m02',
        title: 'Read: Compute in the Cloud',
        subtitle: 'Detailed notes · EC2, pricing, scaling, containers, Lambda',
        estimatedMinutes: 18,
        icon: 'book-open',
        why: 'Compute is the largest exam topic. Read the full breakdown — with load-balancing and compute-spectrum diagrams — before drilling.',
      },
      {
        id: 'clf-m02-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m02',
        title: 'Module 2: Compute in the Cloud',
        subtitle: '10 cards · EC2, Lambda, ELB, containers',
        estimatedMinutes: 20,
        icon: 'cpu',
        why: 'Compute is the largest module — EC2 instance types, pricing models, Auto Scaling, Lambda, and container services all appear on the exam.',
      },
      {
        id: 'clf-m02-quiz',
        type: 'quiz',
        resourceId: 'compute-cloud',
        title: 'Quiz: Compute in the Cloud',
        subtitle: '7 questions · 12 min',
        estimatedMinutes: 12,
        icon: 'check-square',
        why: 'EC2 pricing and Lambda are consistently tested — cover them before moving to infrastructure topics.',
      },
      // ── Module 3: Global Infrastructure ────────────────────────────────────
      {
        id: 'clf-m03-notes',
        type: 'notes',
        resourceId: 'clf-c02-m03',
        title: 'Read: Global Infrastructure & Reliability',
        subtitle: 'Detailed notes · Regions, AZs, Edge Locations, provisioning',
        estimatedMinutes: 14,
        icon: 'book-open',
        why: 'Regions and AZs underpin every high-availability design. Read this before drilling — the diagrams make the hierarchy click.',
      },
      {
        id: 'clf-m03-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m03',
        title: 'Module 3: Global Infrastructure',
        subtitle: '5 cards · Regions, AZs, Edge Locations',
        estimatedMinutes: 12,
        icon: 'globe',
        why: 'Regions and AZs underpin every high-availability design. Understanding the global infrastructure is foundational for all remaining modules.',
      },
      {
        id: 'clf-m03-quiz',
        type: 'quiz',
        resourceId: 'global-infra',
        title: 'Quiz: Global Infrastructure',
        subtitle: '5 questions · 10 min',
        estimatedMinutes: 10,
        icon: 'check-square',
        why: 'Questions about Regions, AZs, and Edge Locations appear in multiple CLF-C02 domains.',
      },
      // ── Module 4: Networking ────────────────────────────────────────────────
      {
        id: 'clf-m04-notes',
        type: 'notes',
        resourceId: 'clf-c02-m04',
        title: 'Read: Networking',
        subtitle: 'Detailed notes · VPC, subnets, security groups vs NACLs, Route 53',
        estimatedMinutes: 16,
        icon: 'book-open',
        why: 'VPC is where every workload runs. The VPC architecture diagram and the stateful-vs-stateless firewall section are exam gold.',
      },
      {
        id: 'clf-m04-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m04',
        title: 'Module 4: Networking',
        subtitle: '6 cards · VPC, Route 53, CloudFront, Direct Connect',
        estimatedMinutes: 15,
        icon: 'git-branch',
        why: 'VPC is the foundation every AWS workload runs inside. Security Groups vs Network ACLs is a classic exam distinction.',
      },
      {
        id: 'clf-m04-quiz',
        type: 'quiz',
        resourceId: 'networking-clf',
        title: 'Quiz: Networking',
        subtitle: '5 questions · 10 min',
        estimatedMinutes: 10,
        icon: 'check-square',
        why: 'VPC, subnets, and DNS routing questions appear across Domain 2 and Domain 3.',
      },
      // ── Module 5: Storage & Databases ──────────────────────────────────────
      {
        id: 'clf-m05-notes',
        type: 'notes',
        resourceId: 'clf-c02-m05',
        title: 'Read: Storage & Databases',
        subtitle: 'Detailed notes · EBS, S3 classes, EFS, RDS, DynamoDB, Redshift',
        estimatedMinutes: 18,
        icon: 'book-open',
        why: 'Choosing the right storage type and database family is heavily tested. Read the comparisons before the drill.',
      },
      {
        id: 'clf-m05-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m05',
        title: 'Module 5: Storage & Databases',
        subtitle: '7 cards · S3 classes, EBS, EFS, RDS, DynamoDB',
        estimatedMinutes: 18,
        icon: 'database',
        why: 'Choosing the right storage class and database type is a core skill tested throughout Domain 3.',
      },
      {
        id: 'clf-m05-quiz',
        type: 'quiz',
        resourceId: 'storage-databases',
        title: 'Quiz: Storage & Databases',
        subtitle: '6 questions · 12 min',
        estimatedMinutes: 12,
        icon: 'check-square',
        why: 'S3 storage classes and database selection (RDS vs DynamoDB vs Redshift) are heavily tested.',
      },
      // ── Module 6: Security ──────────────────────────────────────────────────
      {
        id: 'clf-m06-notes',
        type: 'notes',
        resourceId: 'clf-c02-m06',
        title: 'Read: Security',
        subtitle: 'Detailed notes · Shared Responsibility, IAM, Organizations, services',
        estimatedMinutes: 18,
        icon: 'book-open',
        why: 'Security is ~30% of the exam — the largest domain. The Shared Responsibility Model diagram alone is worth several marks.',
      },
      {
        id: 'clf-m06-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m06',
        title: 'Module 6: Security',
        subtitle: '7 cards · Shared Responsibility, IAM, GuardDuty, KMS',
        estimatedMinutes: 18,
        icon: 'shield',
        why: 'Security is Domain 2 at 30% of the exam — the largest domain. The Shared Responsibility Model is the most-tested concept on CLF-C02.',
      },
      {
        id: 'clf-m06-quiz',
        type: 'quiz',
        resourceId: 'security-clf-m06',
        title: 'Quiz: Security',
        subtitle: '6 questions · 12 min',
        estimatedMinutes: 12,
        icon: 'check-square',
        why: 'Shared Responsibility, IAM policies, WAF vs Shield, and GuardDuty all appear on the actual exam.',
      },
      // ── Module 7: Monitoring & Analytics ───────────────────────────────────
      {
        id: 'clf-m07-notes',
        type: 'notes',
        resourceId: 'clf-c02-m07',
        title: 'Read: Monitoring & Analytics',
        subtitle: 'Detailed notes · CloudWatch, CloudTrail, Trusted Advisor',
        estimatedMinutes: 10,
        icon: 'book-open',
        why: 'CloudWatch (performance) vs CloudTrail (audit) is a classic exam trap. The notes make the distinction stick.',
      },
      {
        id: 'clf-m07-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m07',
        title: 'Module 7: Monitoring & Analytics',
        subtitle: '3 cards · CloudWatch, CloudTrail, Trusted Advisor',
        estimatedMinutes: 10,
        icon: 'bar-chart-2',
        why: 'CloudWatch (monitoring) vs CloudTrail (auditing) is a key distinction that trips up many candidates.',
      },
      {
        id: 'clf-m07-quiz',
        type: 'quiz',
        resourceId: 'monitoring-analytics',
        title: 'Quiz: Monitoring & Analytics',
        subtitle: '3 questions · 8 min',
        estimatedMinutes: 8,
        icon: 'check-square',
        why: 'Concise but targeted — ensure you can differentiate CloudWatch, CloudTrail, and Trusted Advisor use cases.',
      },
      // ── Module 8: Pricing & Support ────────────────────────────────────────
      {
        id: 'clf-m08-notes',
        type: 'notes',
        resourceId: 'clf-c02-m08',
        title: 'Read: Pricing & Support',
        subtitle: 'Detailed notes · pricing models, Free Tier, cost tools, support plans',
        estimatedMinutes: 15,
        icon: 'book-open',
        why: 'Domain 4 (Billing & Pricing). Know the cost tools and the support tiers — including which plan includes a TAM.',
      },
      {
        id: 'clf-m08-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m08',
        title: 'Module 8: Pricing & Support',
        subtitle: '5 cards · Pricing models, Cost Explorer, Support plans',
        estimatedMinutes: 15,
        icon: 'dollar-sign',
        why: 'Domain 4 (Billing & Pricing) = 12% of the exam. Support plan tiers and the difference between Cost Explorer and Budgets are commonly tested.',
      },
      {
        id: 'clf-m08-quiz',
        type: 'quiz',
        resourceId: 'pricing-support',
        title: 'Quiz: Pricing & Support',
        subtitle: '5 questions · 10 min',
        estimatedMinutes: 10,
        icon: 'check-square',
        why: 'Savings Plans vs Reserved Instances and the TAM availability in Enterprise Support are reliable exam questions.',
      },
      // ── Module 9: Migration & Innovation ───────────────────────────────────
      {
        id: 'clf-m09-notes',
        type: 'notes',
        resourceId: 'clf-c02-m09',
        title: 'Read: Migration & Innovation',
        subtitle: 'Detailed notes · CAF, the 6 R’s, Snow Family, AI services',
        estimatedMinutes: 15,
        icon: 'book-open',
        why: 'The CAF perspectives, the migration R’s, and the AI service line-up are specific recall items. Read before the final drills.',
      },
      {
        id: 'clf-m09-flash',
        type: 'flashcard',
        resourceId: 'clf-c02-m09',
        title: 'Module 9: Migration & Innovation',
        subtitle: '6 cards · CAF, 7 Rs, Snow Family, SageMaker',
        estimatedMinutes: 15,
        icon: 'trending-up',
        why: 'The AWS CAF 6 perspectives and the 7 Rs migration strategies are specific exam knowledge — memorise them before the final quizzes.',
      },
      {
        id: 'clf-m09-quiz',
        type: 'quiz',
        resourceId: 'migration-innovation',
        title: 'Quiz: Migration & Innovation',
        subtitle: '5 questions · 10 min',
        estimatedMinutes: 10,
        icon: 'check-square',
        why: 'Snow Family, Rehost vs Refactor, and CAF perspectives are tested in Domain 3 Technology.',
      },
      // ── Phase 2: Domain Consolidation (larger banks, exam-style weighting) ───
      // After learning all 9 modules, reinforce with domain-aligned question banks.
      {
        id: 'clf-flash1',
        type: 'flashcard',
        resourceId: 'aws-practitioner',
        title: 'Full Review: AWS Practitioner Flashcards',
        subtitle: 'Cross-module review of all key services',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Consolidate all 9 modules in one pass. These cards span every domain — a fast reset before tackling the full question banks.',
      },
      {
        id: 'clf-q1',
        type: 'quiz',
        resourceId: 'clf-c02-cloud-concepts',
        title: 'Domain 1: Cloud Concepts (Full Bank)',
        subtitle: '29 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'cloud',
        why: 'Domain 1 = 24% of the exam. Full question bank covering value proposition, design principles, and migration benefits — more depth than Module 1.',
      },
      {
        id: 'clf-q2a',
        type: 'quiz',
        resourceId: 'security-compliance',
        title: 'Domain 2: Security Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'shield',
        why: 'Domain 2 = 30% of the exam — the highest-weighted domain. This warm-up anchors the Shared Responsibility Model and IAM before the full 42-question bank.',
      },
      {
        id: 'clf-q2',
        type: 'quiz',
        resourceId: 'clf-c02-security',
        title: 'Domain 2: Security & Compliance (Full Bank)',
        subtitle: '42 questions · 35 min',
        estimatedMinutes: 35,
        icon: 'lock',
        why: 'Domain 2 = 30% of the exam. Full bank: IAM, GuardDuty, Shield, KMS, WAF, Artifact, Inspector, and the Shared Responsibility Model.',
      },
      {
        id: 'clf-q3a',
        type: 'quiz',
        resourceId: 'serverless',
        title: 'Domain 3: Serverless & Compute',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'zap',
        why: 'Lambda, Fargate, and serverless patterns are heavily tested. These 10 questions fill gaps left by the EC2-heavy Module 2 quiz.',
      },
      {
        id: 'clf-q3b',
        type: 'quiz',
        resourceId: 'networking',
        title: 'Domain 3: Networking Deep-Dive',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'git-branch',
        why: 'VPC, Route 53, CloudFront, and Direct Connect from a Domain 3 exam perspective — scenario-style questions beyond Module 4.',
      },
      {
        id: 'clf-q3c',
        type: 'quiz',
        resourceId: 'databases',
        title: 'Domain 3: Databases Deep-Dive',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'database',
        why: 'RDS, DynamoDB, Aurora, Redshift, and ElastiCache — choosing the right database for a given scenario is a core Domain 3 skill.',
      },
      {
        id: 'clf-q3',
        type: 'quiz',
        resourceId: 'clf-c02-technology',
        title: 'Domain 3: Technology Services (Full Bank)',
        subtitle: '90 questions · 60 min',
        estimatedMinutes: 60,
        icon: 'cpu',
        why: 'Domain 3 = 34% of the exam — the largest domain. This 90-question bank covers every testable AWS service across all 8 tasks in Domain 3.',
      },
      {
        id: 'clf-q4a',
        type: 'quiz',
        resourceId: 'cost-optimization',
        title: 'Domain 4: Cost Optimisation Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'trending-down',
        why: 'Pricing model selection — On-Demand vs Reserved vs Spot vs Savings Plans — is always tested. These 10 questions sharpen that intuition.',
      },
      {
        id: 'clf-q4',
        type: 'quiz',
        resourceId: 'clf-c02-billing',
        title: 'Domain 4: Billing & Pricing (Full Bank)',
        subtitle: '34 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'dollar-sign',
        why: 'Domain 4 = 12% of the exam. Full bank: pricing models, Cost Explorer, Budgets, Support tiers, Free Tier, and consolidated billing.',
      },
      {
        id: 'clf-q-final',
        type: 'quiz',
        resourceId: 'clf-c02-full-exam',
        title: 'Full Practice Exam — CLF-C02',
        subtitle: '195 questions · 90 min',
        estimatedMinutes: 90,
        icon: 'award',
        why: 'Complete simulation of the real CLF-C02 exam. Weighted across all 4 domains. Aim for ≥ 72% before booking your certification date.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // AWS AI Practitioner — AIF-C01
  // ─────────────────────────────────────────────────────────────
  {
    id: 'aip-c01',
    certCode: 'AIF-C01',
    certName: 'AWS AI Practitioner',
    tagline: 'Master generative AI on AWS and pass AIF-C01',
    difficulty: 'Intermediate',
    totalHours: 10,
    color: '#7367F0',
    steps: [
      {
        id: 'aip-v1',
        type: 'video',
        resourceId: 'bedrock-intro',
        title: 'Amazon Bedrock Introduction',
        subtitle: "A Beginner's Guide to Amazon Bedrock",
        estimatedMinutes: 22,
        icon: 'play-circle',
        why: 'Amazon Bedrock is the core service tested across all AIF-C01 domains.',
      },
      {
        id: 'aip-v2',
        type: 'video',
        resourceId: 'rag-bedrock',
        title: 'RAG with Amazon Bedrock',
        subtitle: 'Building RAG Applications with Amazon Bedrock',
        estimatedMinutes: 19,
        icon: 'play-circle',
        why: 'RAG is heavily tested — accounts for ~20% of AIF-C01 questions.',
      },
      {
        id: 'aip-flash1',
        type: 'flashcard',
        resourceId: 'aip-c01',
        title: 'AIF-C01 Flashcards',
        subtitle: '20 key concepts & definitions',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Memorise RAG techniques, Bedrock APIs, and governance concepts.',
      },
      {
        id: 'aip-q1',
        type: 'quiz',
        resourceId: 'aip-c01-rag-foundations',
        title: 'RAG & Bedrock Foundations',
        subtitle: '30 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'database',
        why: 'Knowledge Bases, chunking strategies, and embedding models.',
      },
      {
        id: 'aip-v3',
        type: 'video',
        resourceId: 'bedrock-agents',
        title: 'Amazon Bedrock Agents',
        subtitle: 'Build AI Agents — 15 min',
        estimatedMinutes: 16,
        icon: 'play-circle',
        why: 'Agents & orchestration is a key AIF-C01 section. Watch before the next quiz.',
      },
      {
        id: 'aip-q2',
        type: 'quiz',
        resourceId: 'aip-c01-agents-ops',
        title: 'Agents, MLOps & Advanced Patterns',
        subtitle: '28 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'zap',
        why: 'Multi-agent collaboration, AppConfig routing, SageMaker Neo.',
      },
      {
        id: 'aip-q3',
        type: 'quiz',
        resourceId: 'aip-c01-security-governance',
        title: 'Security & Governance',
        subtitle: '27 questions · 20 min',
        estimatedMinutes: 20,
        icon: 'shield',
        why: 'Guardrails, IAM, model invocation logging, and A2I review.',
      },
      {
        id: 'aip-q-final',
        type: 'quiz',
        resourceId: 'aip-c01-full-exam',
        title: 'Full Practice Exam',
        subtitle: '85 questions · 90 min',
        estimatedMinutes: 90,
        icon: 'award',
        why: 'Complete exam simulation — aim for ≥70% before booking.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // AWS Fundamentals A to Z — Comprehensive Beginner Track
  // ─────────────────────────────────────────────────────────────
  {
    id: 'aws-fundamentals-az',
    certCode: 'AWS-101',
    certName: 'AWS Fundamentals A to Z',
    tagline: 'Learn the A to Z of Amazon Web Services — from IAM and Compute to Databases, Routing, VPC, and the Well-Architected Framework',
    difficulty: 'Beginner',
    totalHours: 14,
    color: '#7367F0',
    steps: [
      // Section 1 — Foundation concepts
      {
        id: 'az-flash-intro',
        type: 'flashcard',
        resourceId: 'aws-practitioner',
        title: 'AWS Core Services Flashcards',
        subtitle: 'Key services, terms, and definitions',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Build a mental map of AWS services — EC2, S3, IAM, VPC, RDS — before diving into each domain.',
      },
      // Section 2 — Fundamental Building Blocks
      {
        id: 'az-q-cloud-concepts',
        type: 'quiz',
        resourceId: 'clf-c02-cloud-concepts',
        title: 'Cloud Concepts & Global Infrastructure',
        subtitle: '29 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'cloud',
        why: 'Covers cloud value proposition, Availability Zones, Regions, and the AWS global network — the building blocks every service depends on.',
      },
      // Section 3 — IAM
      {
        id: 'az-q-security',
        type: 'quiz',
        resourceId: 'security-compliance',
        title: 'Identity & Access Management (IAM)',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'user-check',
        why: 'IAM is the backbone of every AWS architecture — users, roles, policies, and the Shared Responsibility Model.',
      },
      // Section 4 — Full Security & Compliance
      {
        id: 'az-q-security-full',
        type: 'quiz',
        resourceId: 'clf-c02-security',
        title: 'Security & Compliance Deep Dive',
        subtitle: '42 questions · 35 min',
        estimatedMinutes: 35,
        icon: 'shield',
        why: 'GuardDuty, Shield, KMS, Inspector, WAF, and CloudTrail — security spans every layer of AWS.',
      },
      // Section 5 — Compute
      {
        id: 'az-q-serverless',
        type: 'quiz',
        resourceId: 'serverless',
        title: 'Compute: EC2, Lambda & ECS',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'cpu',
        why: 'EC2 instance types, Lambda serverless patterns, ECS containers, and Elastic Load Balancers — the engine room of AWS.',
      },
      // Section 6 — Storage
      {
        id: 'az-q-tech-storage',
        type: 'quiz',
        resourceId: 'clf-c02-technology',
        title: 'Storage, Compute & Technology Services',
        subtitle: '90 questions · 75 min',
        estimatedMinutes: 75,
        icon: 'hard-drive',
        why: 'S3, EBS, EFS, Snowball, Storage Gateway, and the full Domain 3 technology surface — the largest exam domain at 34%.',
      },
      // Section 7 — Databases
      {
        id: 'az-q-databases',
        type: 'quiz',
        resourceId: 'databases',
        title: 'Database Offerings',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'database',
        why: 'RDS, DynamoDB, Aurora, Redshift, ElastiCache, and Neptune — matching the right DB type to the use case is a core exam skill.',
      },
      // Section 8+9 — Routing & VPC
      {
        id: 'az-q-networking',
        type: 'quiz',
        resourceId: 'networking',
        title: 'Routing, VPC & Networking',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'git-branch',
        why: 'Route 53, CloudFront, Direct Connect, VPC subnets, peering, NAT Gateways — routing traffic correctly is fundamental to every AWS solution.',
      },
      // Section 10 — Well-Architected Framework
      {
        id: 'az-q-cost',
        type: 'quiz',
        resourceId: 'cost-optimization',
        title: 'Well-Architected Framework & Billing',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-circle',
        why: 'The 6 pillars — Operational Excellence, Security, Reliability, Performance, Cost, and Sustainability — guide every AWS architecture decision.',
      },
      // Section 11 — Billing / Conclusion
      {
        id: 'az-q-billing',
        type: 'quiz',
        resourceId: 'clf-c02-billing',
        title: 'Conclusion: Billing, Pricing & Support',
        subtitle: '30 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'award',
        why: 'Wrap up with pricing models (On-Demand, Reserved, Spot), Cost Explorer, Savings Plans, AWS Support tiers, and Trusted Advisor — the final domain of AWS fundamentals.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // GenAI Foundations track (no cert, skill builder)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'genai-foundations',
    certCode: 'GenAI',
    certName: 'GenAI Foundations',
    tagline: 'Build practical generative AI skills on AWS',
    difficulty: 'Beginner',
    totalHours: 5,
    color: '#28C76F',
    steps: [
      {
        id: 'gf-v1',
        type: 'video',
        resourceId: 'bedrock-intro',
        title: 'Amazon Bedrock Introduction',
        subtitle: 'Foundation models, APIs, and use cases',
        estimatedMinutes: 22,
        icon: 'play-circle',
        why: 'Start with the platform that powers all AWS GenAI workloads.',
      },
      {
        id: 'gf-v2',
        type: 'video',
        resourceId: 'prompt-engineering',
        title: 'Prompt Engineering',
        subtitle: 'Prompt Engineering for AWS GenAI',
        estimatedMinutes: 28,
        icon: 'play-circle',
        why: 'Writing effective prompts is the single highest-leverage GenAI skill.',
      },
      {
        id: 'gf-q1',
        type: 'quiz',
        resourceId: 'bedrock-fundamentals',
        title: 'Bedrock Fundamentals Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Validate your Bedrock foundations before moving to advanced topics.',
      },
      {
        id: 'gf-flash1',
        type: 'flashcard',
        resourceId: 'genai-practitioner',
        title: 'GenAI Practitioner Flashcards',
        subtitle: 'Key GenAI terms and concepts',
        estimatedMinutes: 15,
        icon: 'layers',
        why: 'Reinforce terminology: embeddings, RAG, hallucination, grounding.',
      },
      {
        id: 'gf-v3',
        type: 'video',
        resourceId: 'rag-bedrock',
        title: 'RAG Applications on AWS',
        subtitle: 'Knowledge Bases + OpenSearch',
        estimatedMinutes: 19,
        icon: 'play-circle',
        why: 'RAG is the dominant pattern for enterprise GenAI — learn it hands-on.',
      },
      {
        id: 'gf-q2',
        type: 'quiz',
        resourceId: 'rag-knowledge-bases',
        title: 'RAG & Knowledge Bases Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Test your RAG fundamentals before the agents section.',
      },
      {
        id: 'gf-q3',
        type: 'quiz',
        resourceId: 'prompt-engineering',
        title: 'Prompt Engineering Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Confirm you can write optimised prompts across model families.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  // Architecting on AWS — SAA-C03 (associate)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'architect',
    certCode: 'SAA-C03',
    certName: 'Architecting on AWS',
    tagline: 'The full Architecting on AWS course — 13 modules from fundamentals to disaster recovery. Read, drill, and test with scenario questions grounded in the official curriculum.',
    difficulty: 'Intermediate',
    totalHours: 6,
    color: '#00CFE8',
    steps: [
      // ── Module 1: Architecting Fundamentals ──
      {
        id: 'arch-m01-notes', type: 'notes', resourceId: 'arch-m01',
        title: 'Read: Architecting Fundamentals', subtitle: 'Study notes · Architecting Fundamentals',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Architecting Fundamentals concepts and key services before drilling.',
      },
      {
        id: 'arch-m01-flash', type: 'flashcard', resourceId: 'arch-m01',
        title: 'Module 1: Architecting Fundamentals', subtitle: '8 cards · Architecting Fundamentals',
        estimatedMinutes: 8, icon: 'home',
        why: 'Lock in the Architecting Fundamentals terms and services with spaced repetition.',
      },
      {
        id: 'arch-m01-quiz', type: 'quiz', resourceId: 'arch-quiz-m01',
        title: 'Quiz: Architecting Fundamentals', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Architecting Fundamentals with associate-level scenario questions.',
      },
      // ── Module 2: Account Security ──
      {
        id: 'arch-m02-notes', type: 'notes', resourceId: 'arch-m02',
        title: 'Read: Account Security', subtitle: 'Study notes · Account Security',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Account Security concepts and key services before drilling.',
      },
      {
        id: 'arch-m02-flash', type: 'flashcard', resourceId: 'arch-m02',
        title: 'Module 2: Account Security', subtitle: '8 cards · Account Security',
        estimatedMinutes: 8, icon: 'lock',
        why: 'Lock in the Account Security terms and services with spaced repetition.',
      },
      {
        id: 'arch-m02-quiz', type: 'quiz', resourceId: 'arch-quiz-m02',
        title: 'Quiz: Account Security', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Account Security with associate-level scenario questions.',
      },
      // ── Module 3: Networking 1 ──
      {
        id: 'arch-m03-notes', type: 'notes', resourceId: 'arch-m03',
        title: 'Read: Networking 1', subtitle: 'Study notes · Networking 1',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Networking 1 concepts and key services before drilling.',
      },
      {
        id: 'arch-m03-flash', type: 'flashcard', resourceId: 'arch-m03',
        title: 'Module 3: Networking 1', subtitle: '8 cards · Networking 1',
        estimatedMinutes: 8, icon: 'git-branch',
        why: 'Lock in the Networking 1 terms and services with spaced repetition.',
      },
      {
        id: 'arch-m03-quiz', type: 'quiz', resourceId: 'arch-quiz-m03',
        title: 'Quiz: Networking 1', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Networking 1 with associate-level scenario questions.',
      },
      // ── Module 4: Compute ──
      {
        id: 'arch-m04-notes', type: 'notes', resourceId: 'arch-m04',
        title: 'Read: Compute', subtitle: 'Study notes · Compute',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Compute concepts and key services before drilling.',
      },
      {
        id: 'arch-m04-flash', type: 'flashcard', resourceId: 'arch-m04',
        title: 'Module 4: Compute', subtitle: '8 cards · Compute',
        estimatedMinutes: 8, icon: 'cpu',
        why: 'Lock in the Compute terms and services with spaced repetition.',
      },
      {
        id: 'arch-m04-quiz', type: 'quiz', resourceId: 'arch-quiz-m04',
        title: 'Quiz: Compute', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Compute with associate-level scenario questions.',
      },
      // ── Module 5: Storage ──
      {
        id: 'arch-m05-notes', type: 'notes', resourceId: 'arch-m05',
        title: 'Read: Storage', subtitle: 'Study notes · Storage',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Storage concepts and key services before drilling.',
      },
      {
        id: 'arch-m05-flash', type: 'flashcard', resourceId: 'arch-m05',
        title: 'Module 5: Storage', subtitle: '8 cards · Storage',
        estimatedMinutes: 8, icon: 'hard-drive',
        why: 'Lock in the Storage terms and services with spaced repetition.',
      },
      {
        id: 'arch-m05-quiz', type: 'quiz', resourceId: 'arch-quiz-m05',
        title: 'Quiz: Storage', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Storage with associate-level scenario questions.',
      },
      // ── Module 6: Database Services ──
      {
        id: 'arch-m06-notes', type: 'notes', resourceId: 'arch-m06',
        title: 'Read: Database Services', subtitle: 'Study notes · Database Services',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Database Services concepts and key services before drilling.',
      },
      {
        id: 'arch-m06-flash', type: 'flashcard', resourceId: 'arch-m06',
        title: 'Module 6: Database Services', subtitle: '8 cards · Database Services',
        estimatedMinutes: 8, icon: 'database',
        why: 'Lock in the Database Services terms and services with spaced repetition.',
      },
      {
        id: 'arch-m06-quiz', type: 'quiz', resourceId: 'arch-quiz-m06',
        title: 'Quiz: Database Services', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Database Services with associate-level scenario questions.',
      },
      // ── Module 7: Monitoring & Scaling ──
      {
        id: 'arch-m07-notes', type: 'notes', resourceId: 'arch-m07',
        title: 'Read: Monitoring & Scaling', subtitle: 'Study notes · Monitoring & Scaling',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Monitoring & Scaling concepts and key services before drilling.',
      },
      {
        id: 'arch-m07-flash', type: 'flashcard', resourceId: 'arch-m07',
        title: 'Module 7: Monitoring & Scaling', subtitle: '8 cards · Monitoring & Scaling',
        estimatedMinutes: 8, icon: 'bar-chart-2',
        why: 'Lock in the Monitoring & Scaling terms and services with spaced repetition.',
      },
      {
        id: 'arch-m07-quiz', type: 'quiz', resourceId: 'arch-quiz-m07',
        title: 'Quiz: Monitoring & Scaling', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Monitoring & Scaling with associate-level scenario questions.',
      },
      // ── Module 8: Automation ──
      {
        id: 'arch-m08-notes', type: 'notes', resourceId: 'arch-m08',
        title: 'Read: Automation', subtitle: 'Study notes · Automation',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Automation concepts and key services before drilling.',
      },
      {
        id: 'arch-m08-flash', type: 'flashcard', resourceId: 'arch-m08',
        title: 'Module 8: Automation', subtitle: '8 cards · Automation',
        estimatedMinutes: 8, icon: 'settings',
        why: 'Lock in the Automation terms and services with spaced repetition.',
      },
      {
        id: 'arch-m08-quiz', type: 'quiz', resourceId: 'arch-quiz-m08',
        title: 'Quiz: Automation', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Automation with associate-level scenario questions.',
      },
      // ── Module 9: Containers ──
      {
        id: 'arch-m09-notes', type: 'notes', resourceId: 'arch-m09',
        title: 'Read: Containers', subtitle: 'Study notes · Containers',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Containers concepts and key services before drilling.',
      },
      {
        id: 'arch-m09-flash', type: 'flashcard', resourceId: 'arch-m09',
        title: 'Module 9: Containers', subtitle: '8 cards · Containers',
        estimatedMinutes: 8, icon: 'box',
        why: 'Lock in the Containers terms and services with spaced repetition.',
      },
      {
        id: 'arch-m09-quiz', type: 'quiz', resourceId: 'arch-quiz-m09',
        title: 'Quiz: Containers', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Containers with associate-level scenario questions.',
      },
      // ── Module 10: Networking 2 ──
      {
        id: 'arch-m10-notes', type: 'notes', resourceId: 'arch-m10',
        title: 'Read: Networking 2', subtitle: 'Study notes · Networking 2',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Networking 2 concepts and key services before drilling.',
      },
      {
        id: 'arch-m10-flash', type: 'flashcard', resourceId: 'arch-m10',
        title: 'Module 10: Networking 2', subtitle: '8 cards · Networking 2',
        estimatedMinutes: 8, icon: 'globe',
        why: 'Lock in the Networking 2 terms and services with spaced repetition.',
      },
      {
        id: 'arch-m10-quiz', type: 'quiz', resourceId: 'arch-quiz-m10',
        title: 'Quiz: Networking 2', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Networking 2 with associate-level scenario questions.',
      },
      // ── Module 11: Serverless ──
      {
        id: 'arch-m11-notes', type: 'notes', resourceId: 'arch-m11',
        title: 'Read: Serverless', subtitle: 'Study notes · Serverless',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Serverless concepts and key services before drilling.',
      },
      {
        id: 'arch-m11-flash', type: 'flashcard', resourceId: 'arch-m11',
        title: 'Module 11: Serverless', subtitle: '8 cards · Serverless',
        estimatedMinutes: 8, icon: 'zap',
        why: 'Lock in the Serverless terms and services with spaced repetition.',
      },
      {
        id: 'arch-m11-quiz', type: 'quiz', resourceId: 'arch-quiz-m11',
        title: 'Quiz: Serverless', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Serverless with associate-level scenario questions.',
      },
      // ── Module 12: Edge Services ──
      {
        id: 'arch-m12-notes', type: 'notes', resourceId: 'arch-m12',
        title: 'Read: Edge Services', subtitle: 'Study notes · Edge Services',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Edge Services concepts and key services before drilling.',
      },
      {
        id: 'arch-m12-flash', type: 'flashcard', resourceId: 'arch-m12',
        title: 'Module 12: Edge Services', subtitle: '8 cards · Edge Services',
        estimatedMinutes: 8, icon: 'radio',
        why: 'Lock in the Edge Services terms and services with spaced repetition.',
      },
      {
        id: 'arch-m12-quiz', type: 'quiz', resourceId: 'arch-quiz-m12',
        title: 'Quiz: Edge Services', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Edge Services with associate-level scenario questions.',
      },
      // ── Module 13: Backup & Recovery ──
      {
        id: 'arch-m13-notes', type: 'notes', resourceId: 'arch-m13',
        title: 'Read: Backup & Recovery', subtitle: 'Study notes · Backup & Recovery',
        estimatedMinutes: 8, icon: 'book-open',
        why: 'Study the Backup & Recovery concepts and key services before drilling.',
      },
      {
        id: 'arch-m13-flash', type: 'flashcard', resourceId: 'arch-m13',
        title: 'Module 13: Backup & Recovery', subtitle: '8 cards · Backup & Recovery',
        estimatedMinutes: 8, icon: 'refresh-cw',
        why: 'Lock in the Backup & Recovery terms and services with spaced repetition.',
      },
      {
        id: 'arch-m13-quiz', type: 'quiz', resourceId: 'arch-quiz-m13',
        title: 'Quiz: Backup & Recovery', subtitle: 'Scenario questions · 10 min',
        estimatedMinutes: 10, icon: 'check-square',
        why: 'Test Backup & Recovery with associate-level scenario questions.',
      },
    ],
  },
];

// ── MLA-C01 exam-domain steps (from the ingested study guide, corpus 'mla-c01') ──
// Notes → flashcards → quiz per official exam domain, appended to the ML
// Engineer path ahead of the external cheat-sheet/lab steps.
const MLA_DOMAIN_META = [
  { n: 1, weight: '28%', title: 'Data Preparation for ML', sub: 'Ingest, transform, and validate data' },
  { n: 2, weight: '26%', title: 'ML Model Development', sub: 'Choose, train, tune, and evaluate models' },
  { n: 3, weight: '22%', title: 'Deployment & Orchestration', sub: 'Serve models and automate ML pipelines' },
  { n: 4, weight: '24%', title: 'Monitoring, Maintenance & Security', sub: 'Keep models healthy, cheap, and locked down' },
];
const MLA_C01_DOMAIN_STEPS: LearningStep[] = MLA_DOMAIN_META.flatMap(({ n, weight, title, sub }) => [
  {
    id: `mla-d0${n}-notes`, type: 'notes' as StepType, resourceId: `mla-d0${n}`,
    title: `Read: Domain ${n} — ${title}`,
    subtitle: `Exam-domain notes · ${weight} of the exam`,
    estimatedMinutes: 14, icon: 'book-open',
    why: `${sub} — grounded in the MLA-C01 study guide.`,
  },
  {
    id: `mla-d0${n}-flash`, type: 'flashcard' as StepType, resourceId: `mla-d0${n}`,
    title: `Drill: Domain ${n} flashcards`,
    subtitle: `12 cards · ${title}`,
    estimatedMinutes: 10, icon: 'layers',
    why: 'Lock in the domain terminology before testing yourself.',
  },
  {
    id: `mla-d0${n}-quiz`, type: 'quiz' as StepType, resourceId: `mla-c01-d${n}`,
    title: `Quiz: Domain ${n} — ${title}`,
    subtitle: '10 scenario questions',
    estimatedMinutes: 20, icon: 'check-circle',
    why: 'Scenario questions in the style the exam actually asks.',
  },
]).concat([
  {
    id: 'mla-full-practice', type: 'quiz' as StepType, resourceId: 'mla-c01-full-practice',
    title: 'Full Practice Exam: all four domains',
    subtitle: '40 questions · 60 minutes',
    estimatedMinutes: 60, icon: 'award',
    why: 'Simulate the full exam across every domain before booking it.',
  },
]);
for (const p of LEARNING_PATHS) {
  if (p.id === 'mla-c01' && !p.steps.some((s) => s.id === 'mla-d01-notes')) {
    p.steps.push(...MLA_C01_DOMAIN_STEPS);
  }
}

// ── External reference steps: hands-on labs + cheat sheets ───────────────────
// Sourced from github.com/schinchli/cloud-certification-exam-prep. Appended to
// the relevant paths so learners see practice labs + quick-reference guides
// inline in their certification path (opens in the browser).
const EXAM_PREP_REPO = 'https://github.com/schinchli/cloud-certification-exam-prep/tree/main/AWS';
const EXTERNAL_STEPS: Record<string, LearningStep[]> = {
  'sec-eng-aws': [
    { id: 'sec-cheatsheet', type: 'cheatsheet', resourceId: 'sheet-scs', title: 'SCS-C02 Study Guide (cheat sheet)', subtitle: 'Quick reference', estimatedMinutes: 20, icon: 'clipboard', why: 'Condensed exam-domain reference for fast review.', url: `${EXAM_PREP_REPO}/SCS-C02-Security-Specialty` },
    { id: 'sec-lab-kms', type: 'lab', resourceId: 'lab-kms', title: 'Lab: KMS Encryption, Rotation & Multi-Region Keys', subtitle: 'Hands-on', estimatedMinutes: 45, icon: 'terminal', why: 'Practice envelope encryption + key rotation on real AWS.', url: `${EXAM_PREP_REPO}/security-labs/AWS%20KMS%20Masterclass%20-%20Encryption%2C%20Key%20Rotation%2C%20and%20Multi-Region%20Keys%20(Hands-On%20Lab)` },
    { id: 'sec-lab-waf', type: 'lab', resourceId: 'lab-waf', title: 'Lab: CloudFront + WAF Edge Security', subtitle: 'Hands-on', estimatedMinutes: 40, icon: 'terminal', why: 'Build edge protection with WAF managed rules.', url: `${EXAM_PREP_REPO}/security-labs/CloudFront%20WAF%20Edge%20Security` },
    { id: 'sec-lab-secrets', type: 'lab', resourceId: 'lab-secrets', title: 'Lab: RDS Credentials with KMS & Secrets Manager', subtitle: 'Hands-on', estimatedMinutes: 45, icon: 'terminal', why: 'Zero-downtime secret rotation for RDS.', url: `${EXAM_PREP_REPO}/security-labs/Securing%20RDS%20Database%20Credentials%20with%20AWS%20KMS%20and%20Secrets%20Manager%20(Hands-On%2C%20Zero-Downtime%20Rotation)` },
  ],
  'aip-c01': [
    { id: 'aip-cheatsheet', type: 'cheatsheet', resourceId: 'sheet-aif', title: 'AIF-C01 Study Guide (cheat sheet)', subtitle: 'Quick reference', estimatedMinutes: 20, icon: 'clipboard', why: 'Bedrock, RAG, prompt engineering + responsible AI in one sheet.', url: `${EXAM_PREP_REPO}/AIF-C01-GenAI-Practitioner` },
    { id: 'aip-lab', type: 'lab', resourceId: 'lab-aip', title: 'AWS Workshops — Generative AI labs', subtitle: 'Hands-on', estimatedMinutes: 60, icon: 'terminal', why: 'Build with Bedrock + knowledge bases in guided labs.', url: 'https://workshops.aws/' },
  ],
  'mla-c01': [
    { id: 'mla-cheatsheet', type: 'cheatsheet', resourceId: 'sheet-mla', title: 'ML Study Guide (cheat sheet)', subtitle: 'Quick reference', estimatedMinutes: 20, icon: 'clipboard', why: 'Data engineering, modeling + MLOps quick reference.', url: `${EXAM_PREP_REPO}/MLS-C01-ML-Specialty` },
    { id: 'mla-lab', type: 'lab', resourceId: 'lab-mla', title: 'AWS Workshops — SageMaker labs', subtitle: 'Hands-on', estimatedMinutes: 60, icon: 'terminal', why: 'Train + deploy models in guided SageMaker labs.', url: 'https://workshops.aws/' },
  ],
  'sap-c02': [
    { id: 'sap-cheatsheet', type: 'cheatsheet', resourceId: 'sheet-sap', title: 'SAP-C02 Study Guide (16 domains)', subtitle: 'Quick reference', estimatedMinutes: 25, icon: 'clipboard', why: 'All 16 professional domains in one reference.', url: `${EXAM_PREP_REPO}/SAP-C02` },
    { id: 'sap-lab', type: 'lab', resourceId: 'lab-sap', title: 'AWS Workshops — advanced architecture labs', subtitle: 'Hands-on', estimatedMinutes: 60, icon: 'terminal', why: 'Multi-account, networking + DR hands-on practice.', url: 'https://workshops.aws/' },
  ],
};
for (const p of LEARNING_PATHS) {
  const extra = EXTERNAL_STEPS[p.id];
  if (extra && !p.steps.some((s) => s.id === extra[0].id)) p.steps.push(...extra);
}

export function getLearningPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}
