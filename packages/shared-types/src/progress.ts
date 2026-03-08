/**
 * Progress / statistics types — maps `users_statistics`, `daily_leaderboard`,
 * `monthly_leaderboard` tables and quiz result tracking from Quiz Online V-7.1.6
 */

// ─── Quiz Results ──────────────────────────────────────────────────────────────

/** Single quiz attempt result */
export interface QuizResult {
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;           // seconds
  answers: Record<string, string>; // questionId → selectedOptionId
  completedAt: string;         // ISO 8601
  // Stored in S3: /results/{userId}/{quizId}/{completedAt}.json
}

// ─── User Statistics ──────────────────────────────────────────────────────────

/**
 * Aggregated user statistics — maps `users_statistics` table.
 * Stored in DynamoDB `lms-user-statistics` table.
 */
export interface UserStatistics {
  userId: string;
  questionsAnswered: number;
  correctAnswers: number;
  strongCategoryId?: string;   // Category user performs best in
  strongCategoryRatio?: number; // 0-100 success rate
  weakCategoryId?: string;
  weakCategoryRatio?: number;
  bestLeaderboardPosition?: number;
  updatedAt: string;
}

// ─── User Progress (mobile app state) ────────────────────────────────────────

/** In-app progress state (Zustand store) */
export interface Progress {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  recentResults: QuizResult[];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeId =
  | 'first_quiz'
  | 'perfect_score'
  | 'ten_quizzes'
  | 'week_streak'
  | 'bedrock_master'
  | 'battle_winner'
  | 'daily_champion'
  | 'speed_demon';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;                // Feather icon name
  earnedAt: string;
}

// ─── Leaderboards ─────────────────────────────────────────────────────────────

export type LeaderboardType = 'daily' | 'monthly' | 'global';

/** Leaderboard entry — maps `daily_leaderboard` / `monthly_leaderboard` tables */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImageUrl?: string;
  score: number;
  leaderboardType: LeaderboardType;
  period?: string;             // YYYY-MM for monthly, YYYY-MM-DD for daily
  updatedAt: string;
}

/** Paginated leaderboard response */
export interface Leaderboard {
  type: LeaderboardType;
  period?: string;
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry; // Current user's position (may not be in top N)
  totalParticipants: number;
}
