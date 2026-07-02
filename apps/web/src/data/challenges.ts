// ─── Challenge target scores (% to beat) per quiz ────────────────────────────
// Represents the "CPU opponent score" in Challenge Arena mode.
// Kept in sync with mobile/data/challenges.ts (shared source of truth).
export const CHALLENGE_SCORES: Record<string, number> = {
  // Security Engineering on AWS — specialty modules
  'sec-eng-aws-m01':               76,
  'sec-eng-aws-m02':               78,
  'sec-eng-aws-m03':               78,
  'sec-eng-aws-m04':               80,
  'sec-eng-aws-m05':               79,
  'sec-eng-aws-m06':               80,
  'sec-eng-aws-m07':               77,
  'sec-eng-aws-m08':               81,
  // Architecting on AWS — associate modules
  'arch-quiz-m01':                 68,
  'arch-quiz-m02':                 70,
  'arch-quiz-m03':                 70,
  'arch-quiz-m04':                 69,
  'arch-quiz-m05':                 70,
  'arch-quiz-m06':                 71,
  'arch-quiz-m07':                 72,
  'arch-quiz-m08':                 71,
  'arch-quiz-m09':                 72,
  'arch-quiz-m10':                 73,
  'arch-quiz-m11':                 72,
  'arch-quiz-m12':                 73,
  'arch-quiz-m13':                 74,
  'bedrock-fundamentals':          70,
  'bedrock-advanced':              65,
  'rag-knowledge-bases':           70,
  'prompt-engineering':            75,
  'security-compliance':           70,
  'mlops-sagemaker':               70,
  'ai-agents':                     70,
  'cost-optimization':             72,
  'serverless':                    70,
  'networking':                    68,
  'databases':                     70,
  // CLF-C02 — Cloud Practitioner Essentials modules
  'aws-intro':                     60,
  'compute-cloud':                 64,
  'global-infra':                  63,
  'networking-clf':                65,
  'storage-databases':             65,
  'security-clf-m06':              66,
  'monitoring-analytics':          62,
  'pricing-support':               61,
  'migration-innovation':          63,
  'clf-c02-cloud-concepts':        67,
  'clf-c02-security':              72,
  'clf-c02-technology':            74,
  'clf-c02-billing':               66,
  // AIF-C01 — professional tier, higher baselines
  'aip-c01-rag-foundations':       78,
  'aip-c01-security-governance':   80,
  'aip-c01-agents-ops':            76,
};

// ─── CPU display names ────────────────────────────────────────────────────────
export const CPU_NAMES: Record<string, string> = {
  'sec-eng-aws-m01':               'SecurityScout',
  'sec-eng-aws-m02':               'AccessSentinel',
  'sec-eng-aws-m03':               'AccountGuard',
  'sec-eng-aws-m04':               'KeyVaultOps',
  'sec-eng-aws-m05':               'DataDefender',
  'sec-eng-aws-m06':               'EdgeShield',
  'sec-eng-aws-m07':               'LogWatcher',
  'sec-eng-aws-m08':               'ThreatResponder',
  'arch-quiz-m01':                 'ArchPilot',
  'arch-quiz-m02':                 'AccountArchitect',
  'arch-quiz-m03':                 'NetworkPlanner',
  'arch-quiz-m04':                 'ComputeCrafter',
  'arch-quiz-m05':                 'StorageStrategist',
  'arch-quiz-m06':                 'DatabaseDesigner',
  'arch-quiz-m07':                 'ScaleMonitor',
  'arch-quiz-m08':                 'AutomationAce',
  'arch-quiz-m09':                 'ContainerCaptain',
  'arch-quiz-m10':                 'HybridRouter',
  'arch-quiz-m11':                 'ServerlessSage',
  'arch-quiz-m12':                 'EdgeArchitect',
  'arch-quiz-m13':                 'RecoveryPlanner',
  'bedrock-fundamentals':          'CloudBot v3',
  'bedrock-advanced':              'AdvancedAI Pro',
  'rag-knowledge-bases':           'VectorBot',
  'prompt-engineering':            'PromptGenius',
  'security-compliance':           'SecureAI',
  'mlops-sagemaker':               'MLOpsBot',
  'ai-agents':                     'AgentCore',
  'cost-optimization':             'CostBot Pro',
  'serverless':                    'LambdaMind',
  'networking':                    'NetBot',
  'databases':                     'DataBot',
  'aws-intro':                     'CloudStarter',
  'compute-cloud':                 'ComputeCoach',
  'global-infra':                  'RegionRunner',
  'networking-clf':                'SubnetSensei',
  'storage-databases':             'StorageGuide',
  'security-clf-m06':              'SecurityBuddy',
  'monitoring-analytics':          'MetricsMate',
  'pricing-support':               'PricingPal',
  'migration-innovation':          'MigrationMentor',
  'clf-c02-cloud-concepts':        'ConceptPilot',
  'clf-c02-security':              'ShieldOps',
  'clf-c02-technology':            'TechStacker',
  'clf-c02-billing':               'BudgetBot',
  'aip-c01-rag-foundations':       'VectorSage',
  'aip-c01-security-governance':   'GuardrailsBot',
  'aip-c01-agents-ops':            'AgentForge',
};

/** CPU target score to beat for a quiz (defaults to 70%). */
export function challengeTarget(quizId: string): number {
  return CHALLENGE_SCORES[quizId] ?? 70;
}

/** CPU opponent display name for a quiz (defaults to 'BotAI'). */
export function cpuName(quizId: string): string {
  return CPU_NAMES[quizId] ?? 'BotAI';
}
