/**
 * Settings & notifications types — maps `settings`, `notifications`,
 * `languages`, `tbl_fcm_key` tables from Quiz Online V-7.1.6
 */

export type SettingKey =
  | 'system_configurations'
  | 'privacy_policy'
  | 'terms_conditions'
  | 'about_us'
  | 'instructions'
  | 'update_terms';

/** App setting — maps `settings` table */
export interface AppSetting {
  id: string;
  key: SettingKey;
  value: string;               // JSON string or HTML depending on key
  updatedAt: string;
}

/** System config JSON structure (stored under key `system_configurations`) */
export interface SystemConfig {
  timezone: string;
  appVersion: string;
  minAppVersionIos: string;
  minAppVersionAndroid: string;

  // Feature flags
  dailyQuizEnabled: boolean;
  contestEnabled: boolean;
  learningZoneEnabled: boolean;
  battleEnabled: boolean;
  selfChallengeEnabled: boolean;
  mathsEnabled: boolean;

  // Coin rewards
  earnCoinPerCorrectAnswer: number;
  referralBonusCoins: number;
  welcomeBonusCoins: number;

  // Ad config
  adsEnabled: boolean;
  interstitialAdInterval: number; // every N questions

  // AWS config
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cloudfrontUrl: string;
  apiBaseUrl: string;
}

/** Push notification — maps `notifications` table */
export interface Notification {
  id: string;
  title: string;
  message: string;
  targetUsers: 'all' | string;  // 'all' or specific user ID
  type: NotificationType;
  typeId?: string;              // Related entity ID (quiz, contest, etc.)
  imageUrl?: string;
  sentAt: string;
}

export type NotificationType =
  | 'general'
  | 'new_contest'
  | 'daily_quiz'
  | 'battle_invite'
  | 'badge_earned'
  | 'level_up';

/** Supported language — maps `languages` table */
export interface Language {
  id: string;
  name: string;
  code: string;                 // ISO 639-1 (en, hi, ar, fr, etc.)
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}
