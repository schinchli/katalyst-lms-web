/**
 * Contest / tournament types — maps `contest`, `contest_questions`,
 * `contest_leaderboard`, `contest_prize` tables from Quiz Online V-7.1.6
 */

export type ContestStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/** Contest/tournament — maps `contest` table */
export interface Contest {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  startDate: string;           // ISO 8601 date
  endDate: string;             // ISO 8601 date
  entryFeeCoins: number;       // 0 = free entry
  hasPrize: boolean;
  prizes: ContestPrize[];
  status: ContestStatus;
  createdAt: string;
}

/** Prize tiers — maps `contest_prize` table */
export interface ContestPrize {
  position: number;            // 1st, 2nd, 3rd, etc.
  coinsAwarded: number;
}

/** Contest-specific question — maps `contest_questions` table */
export interface ContestQuestion {
  id: string;
  contestId: string;
  imageUrl?: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation?: string;
}

/** User's contest leaderboard entry — maps `contest_leaderboard` table */
export interface ContestLeaderboardEntry {
  id: string;
  userId: string;
  contestId: string;
  questionsAttempted: number;
  correctAnswers: number;
  score: number;
  rank?: number;
  updatedAt: string;
}
