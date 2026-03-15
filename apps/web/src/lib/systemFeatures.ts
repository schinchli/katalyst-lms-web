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
