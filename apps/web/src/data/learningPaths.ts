/**
 * Learning Path definitions — sequenced step-by-step content tracks
 * for each AWS/GenAI certification target.
 *
 * Each step has a type (video | flashcard | quiz), a resourceId that
 * maps to PLAYLIST[id], flashcard category, or quiz id, and
 * estimated minutes to complete.
 */

export type StepType = 'video' | 'flashcard' | 'quiz';

export interface LearningStep {
  id: string;
  type: StepType;
  resourceId: string;   // video.id | flashcard category | quiz.id
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  icon: string;         // Feather icon name
  why: string;          // short explanation of why this step matters
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
  // ─────────────────────────────────────────────────────────────
  // AWS Cloud Practitioner — CLF-C02
  // ─────────────────────────────────────────────────────────────
  {
    id: 'clf-c02',
    certCode: 'CLF-C02',
    certName: 'AWS Cloud Practitioner',
    tagline: 'Official AWS T&C 2025 curriculum — 9 modules, 82 diagrams, 55 flashcards, 47 MCQs, instructor notes',
    difficulty: 'Beginner',
    totalHours: 18,
    color: '#FF9F43',
    steps: [
      // ── Module 1: Introduction to AWS ──────────────────────────────────────
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
      // ── Domain review quizzes ───────────────────────────────────────────────
      {
        id: 'clf-flash1',
        type: 'flashcard',
        resourceId: 'aws-practitioner',
        title: 'AWS Practitioner Flashcards',
        subtitle: 'Key concepts, services, and definitions',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Memorise the most frequently tested AWS terms before tackling domain questions.',
      },
      {
        id: 'clf-q1',
        type: 'quiz',
        resourceId: 'clf-c02-cloud-concepts',
        title: 'Cloud Concepts',
        subtitle: '29 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'cloud',
        why: 'Domain 1 (Tasks 1.1–1.4) = 24% of the exam. Covers cloud value proposition, design principles, and migration benefits.',
      },
      {
        id: 'clf-q2a',
        type: 'quiz',
        resourceId: 'security-compliance',
        title: 'Security Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'shield',
        why: 'Domain 2 warm-up — builds shared responsibility and IAM intuition before the full 42-question set.',
      },
      {
        id: 'clf-q2',
        type: 'quiz',
        resourceId: 'clf-c02-security',
        title: 'Security & Compliance',
        subtitle: '42 questions · 35 min',
        estimatedMinutes: 35,
        icon: 'lock',
        why: 'Domain 2 (Tasks 2.1–2.4) = 30% of the exam. IAM, GuardDuty, Shield, KMS, and the Shared Responsibility Model.',
      },
      {
        id: 'clf-q3a',
        type: 'quiz',
        resourceId: 'serverless',
        title: 'Compute Warm-Up (Serverless)',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'zap',
        why: 'Domain 3 warm-up — Task 3.3 focus: Lambda, Fargate, and serverless compute patterns.',
      },
      {
        id: 'clf-q3b',
        type: 'quiz',
        resourceId: 'networking',
        title: 'Networking Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'globe',
        why: 'Domain 3 warm-up — Tasks 3.2 + 3.5 focus: VPC, Route 53, CloudFront, and AWS global infrastructure.',
      },
      {
        id: 'clf-q3c',
        type: 'quiz',
        resourceId: 'databases',
        title: 'Database Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'database',
        why: 'Domain 3 warm-up — Task 3.4 focus: RDS, DynamoDB, and choosing the right database service.',
      },
      {
        id: 'clf-q3',
        type: 'quiz',
        resourceId: 'clf-c02-technology',
        title: 'Technology & Services',
        subtitle: '90 questions · 60 min',
        estimatedMinutes: 60,
        icon: 'cpu',
        why: 'Domain 3 (Tasks 3.1–3.8) = 34% of the exam — the largest domain. Covers EC2, S3, Lambda, RDS, VPC, and global services.',
      },
      {
        id: 'clf-q4a',
        type: 'quiz',
        resourceId: 'cost-optimization',
        title: 'Billing Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'trending-down',
        why: 'Domain 4 warm-up — pricing models, Reserved vs Spot vs On-Demand, and cost optimisation strategies.',
      },
      {
        id: 'clf-q4',
        type: 'quiz',
        resourceId: 'clf-c02-billing',
        title: 'Billing & Pricing',
        subtitle: '34 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'dollar-sign',
        why: 'Domain 4 (Tasks 4.1–4.3) = 12% of the exam. Pricing models, Support plans, and the AWS Free Tier.',
      },
      {
        id: 'clf-q-final',
        type: 'quiz',
        resourceId: 'clf-c02-full-exam',
        title: 'Full Practice Exam',
        subtitle: '195 questions · 90 min',
        estimatedMinutes: 90,
        icon: 'award',
        why: 'Integration exam covering all 4 domains. Aim for ≥70% before booking the real CLF-C02.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // AWS AI Practitioner — AIP-C01
  // ─────────────────────────────────────────────────────────────
  {
    id: 'aip-c01',
    certCode: 'AIP-C01',
    certName: 'AWS AI Practitioner',
    tagline: 'Master generative AI on AWS and pass AIP-C01',
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
        why: 'Amazon Bedrock is the core service tested across all AIP-C01 domains.',
      },
      {
        id: 'aip-v2',
        type: 'video',
        resourceId: 'rag-bedrock',
        title: 'RAG with Amazon Bedrock',
        subtitle: 'Building RAG Applications with Amazon Bedrock',
        estimatedMinutes: 19,
        icon: 'play-circle',
        why: 'RAG is heavily tested — accounts for ~20% of AIP-C01 questions.',
      },
      {
        id: 'aip-flash1',
        type: 'flashcard',
        resourceId: 'aip-c01',
        title: 'AIP-C01 Flashcards',
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
        why: 'Agents & orchestration is a key AIP-C01 section. Watch before the next quiz.',
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
];

export function getLearningPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}
