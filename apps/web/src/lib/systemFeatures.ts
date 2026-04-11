export const SYSTEM_FEATURES_KEY = 'system_feature_flags';

export interface SystemFeaturesConfig {
  dailyQuizEnabled: boolean;
  dailyQuizQuizId: string;
  dailyQuizLabel: string;
  answerReviewEnabled: boolean;
  optionEEnabled: boolean;
  // Maintenance mode
  maintenanceMode: boolean;
  maintenanceMessage: string;
  // Force update
  forceUpdateEnabled: boolean;
  minimumAppVersion: string;
  currentAppVersion: string;
  appStoreUrl: string;
  playStoreUrl: string;
  // Ad controls — global kill-switches (individual adsRemoved flag lives in user_profiles)
  adsEnabled: boolean;
  bannerAdsEnabled: boolean;
  interstitialAdsEnabled: boolean;
  rewardedAdsEnabled: boolean;
  // Feature flags — hidden features (toggle to re-enable)
  leaderboardEnabled: boolean;
}

export const DEFAULT_SYSTEM_FEATURES: SystemFeaturesConfig = {
  dailyQuizEnabled: false,
  dailyQuizQuizId: '',
  dailyQuizLabel: 'Daily Quiz',
  answerReviewEnabled: true,
  optionEEnabled: false,
  maintenanceMode: false,
  maintenanceMessage: 'We are performing scheduled maintenance. Please check back soon.',
  forceUpdateEnabled: false,
  minimumAppVersion: '1.0.0',
  currentAppVersion: '1.0.0',
  appStoreUrl: '',
  playStoreUrl: '',
  adsEnabled: true,
  bannerAdsEnabled: true,
  interstitialAdsEnabled: true,
  rewardedAdsEnabled: true,
  // Hidden features — set to false to hide, toggle in Admin → Settings → Feature Flags
  leaderboardEnabled: false,
};

export function normalizeSystemFeatures(value: unknown): SystemFeaturesConfig {
  const raw = (value ?? {}) as Partial<SystemFeaturesConfig>;

  return {
    dailyQuizEnabled: typeof raw.dailyQuizEnabled === 'boolean' ? raw.dailyQuizEnabled : DEFAULT_SYSTEM_FEATURES.dailyQuizEnabled,
    dailyQuizQuizId: typeof raw.dailyQuizQuizId === 'string' ? raw.dailyQuizQuizId : DEFAULT_SYSTEM_FEATURES.dailyQuizQuizId,
    dailyQuizLabel: typeof raw.dailyQuizLabel === 'string' && raw.dailyQuizLabel.trim() ? raw.dailyQuizLabel : DEFAULT_SYSTEM_FEATURES.dailyQuizLabel,
    answerReviewEnabled: typeof raw.answerReviewEnabled === 'boolean' ? raw.answerReviewEnabled : DEFAULT_SYSTEM_FEATURES.answerReviewEnabled,
    optionEEnabled: typeof raw.optionEEnabled === 'boolean' ? raw.optionEEnabled : DEFAULT_SYSTEM_FEATURES.optionEEnabled,
    maintenanceMode: typeof raw.maintenanceMode === 'boolean' ? raw.maintenanceMode : DEFAULT_SYSTEM_FEATURES.maintenanceMode,
    maintenanceMessage: typeof raw.maintenanceMessage === 'string' && raw.maintenanceMessage.trim() ? raw.maintenanceMessage : DEFAULT_SYSTEM_FEATURES.maintenanceMessage,
    forceUpdateEnabled: typeof raw.forceUpdateEnabled === 'boolean' ? raw.forceUpdateEnabled : DEFAULT_SYSTEM_FEATURES.forceUpdateEnabled,
    minimumAppVersion: typeof raw.minimumAppVersion === 'string' && raw.minimumAppVersion.trim() ? raw.minimumAppVersion : DEFAULT_SYSTEM_FEATURES.minimumAppVersion,
    currentAppVersion: typeof raw.currentAppVersion === 'string' && raw.currentAppVersion.trim() ? raw.currentAppVersion : DEFAULT_SYSTEM_FEATURES.currentAppVersion,
    appStoreUrl: typeof raw.appStoreUrl === 'string' ? raw.appStoreUrl : DEFAULT_SYSTEM_FEATURES.appStoreUrl,
    playStoreUrl: typeof raw.playStoreUrl === 'string' ? raw.playStoreUrl : DEFAULT_SYSTEM_FEATURES.playStoreUrl,
    adsEnabled: typeof raw.adsEnabled === 'boolean' ? raw.adsEnabled : DEFAULT_SYSTEM_FEATURES.adsEnabled,
    bannerAdsEnabled: typeof raw.bannerAdsEnabled === 'boolean' ? raw.bannerAdsEnabled : DEFAULT_SYSTEM_FEATURES.bannerAdsEnabled,
    interstitialAdsEnabled: typeof raw.interstitialAdsEnabled === 'boolean' ? raw.interstitialAdsEnabled : DEFAULT_SYSTEM_FEATURES.interstitialAdsEnabled,
    rewardedAdsEnabled: typeof raw.rewardedAdsEnabled === 'boolean' ? raw.rewardedAdsEnabled : DEFAULT_SYSTEM_FEATURES.rewardedAdsEnabled,
    leaderboardEnabled: typeof raw.leaderboardEnabled === 'boolean' ? raw.leaderboardEnabled : DEFAULT_SYSTEM_FEATURES.leaderboardEnabled,
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
