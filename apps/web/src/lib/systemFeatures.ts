export const SYSTEM_FEATURES_KEY = 'system_feature_flags';

export interface SystemFeaturesConfig {
  dailyQuizEnabled: boolean;
  dailyQuizQuizId: string;
  dailyQuizLabel: string;
  answerReviewEnabled: boolean;
  optionEEnabled: boolean;
}

export const DEFAULT_SYSTEM_FEATURES: SystemFeaturesConfig = {
  dailyQuizEnabled: false,
  dailyQuizQuizId: '',
  dailyQuizLabel: 'Daily Quiz',
  answerReviewEnabled: true,
  optionEEnabled: false,
};

export function normalizeSystemFeatures(value: unknown): SystemFeaturesConfig {
  const raw = (value ?? {}) as Partial<SystemFeaturesConfig>;

  return {
    dailyQuizEnabled: typeof raw.dailyQuizEnabled === 'boolean' ? raw.dailyQuizEnabled : DEFAULT_SYSTEM_FEATURES.dailyQuizEnabled,
    dailyQuizQuizId: typeof raw.dailyQuizQuizId === 'string' ? raw.dailyQuizQuizId : DEFAULT_SYSTEM_FEATURES.dailyQuizQuizId,
    dailyQuizLabel: typeof raw.dailyQuizLabel === 'string' && raw.dailyQuizLabel.trim() ? raw.dailyQuizLabel : DEFAULT_SYSTEM_FEATURES.dailyQuizLabel,
    answerReviewEnabled: typeof raw.answerReviewEnabled === 'boolean' ? raw.answerReviewEnabled : DEFAULT_SYSTEM_FEATURES.answerReviewEnabled,
    optionEEnabled: typeof raw.optionEEnabled === 'boolean' ? raw.optionEEnabled : DEFAULT_SYSTEM_FEATURES.optionEEnabled,
  };
}

export interface DailyQuizCandidate {
  id: string;
  enabled?: boolean;
  isPremium?: boolean;
}

function getUtcDaySeed(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000;
}

export function resolveDailyQuiz<T extends DailyQuizCandidate>(
  config: SystemFeaturesConfig,
  quizzes: T[],
  date = new Date(),
) {
  if (!config.dailyQuizEnabled || quizzes.length === 0) return null;

  const visible = quizzes.filter((quiz) => quiz.enabled !== false);
  if (visible.length === 0) return null;

  const configured = config.dailyQuizQuizId
    ? visible.find((quiz) => quiz.id === config.dailyQuizQuizId) ?? null
    : null;

  if (configured) return configured;

  const fallbackPool = visible.filter((quiz) => !quiz.isPremium);
  const rotationPool = fallbackPool.length > 0 ? fallbackPool : visible;
  const index = getUtcDaySeed(date) % rotationPool.length;
  return rotationPool[index] ?? null;
}
