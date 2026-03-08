/**
 * API contract types — maps all 52 endpoints from Quiz Online V-7.1.6 api-v2.php
 * AWS implementation: API Gateway REST → Lambda → DynamoDB/S3
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;          // DynamoDB pagination token
  total: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  mobile?: string;
  authProvider: 'email' | 'google' | 'facebook' | 'phone';
  referralCode?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  mobile?: string;
  profileImageBase64?: string;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface GetQuestionsRequest {
  categoryId?: string;
  subcategoryId?: string;
  difficultyLevel?: 1 | 2 | 3;
  questionType?: 'multiple_choice' | 'true_false';
  limit?: number;
  languageId?: string;
  isMaths?: boolean;
}

export interface SubmitQuizRequest {
  quizId: string;
  answers: Record<string, string>; // questionId → selectedOptionId
  timeTaken: number;
  mode: 'practice' | 'self_challenge' | 'daily' | 'battle' | 'contest';
}

export interface SubmitQuizResponse {
  score: number;
  totalQuestions: number;
  coinsEarned: number;
  passed: boolean;
  newBadges: string[];
  newLevel?: number;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface GetLeaderboardRequest {
  type: 'daily' | 'monthly' | 'global';
  limit?: number;
  nextToken?: string;
  period?: string;             // YYYY-MM for monthly, YYYY-MM-DD for daily
}

export interface UpdateLeaderboardScoreRequest {
  score: number;
  type: 'daily' | 'monthly' | 'global';
}

// ─── Battle ───────────────────────────────────────────────────────────────────

export interface CreateRoomRequest {
  categoryId: string;
  questionCount: number;
  roomType: 'public' | 'private';
}

export interface JoinRoomRequest {
  roomId?: string;
  roomCode?: string;           // For private rooms
}

export interface InviteFriendRequest {
  targetUserId: string;
  roomId: string;
}

export interface BattleResultRequest {
  roomId: string;
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  isDrawn: boolean;
  player1Score: number;
  player2Score: number;
}

// ─── Contest ──────────────────────────────────────────────────────────────────

export interface UpdateContestScoreRequest {
  contestId: string;
  questionsAttempted: number;
  correctAnswers: number;
  score: number;
}

// ─── Coins ────────────────────────────────────────────────────────────────────

export interface UpdateCoinsRequest {
  amount: number;              // positive = add, negative = deduct
  transactionType: string;
  description?: string;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export interface SetBookmarkRequest {
  questionId: string;
  isBookmarked: boolean;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface UpdateUserStatisticsRequest {
  questionsAnswered?: number;
  correctAnswers?: number;
  strongCategoryId?: string;
  weakCategoryId?: string;
}

// ─── Self-Challenge ───────────────────────────────────────────────────────────

export interface SelfChallengeRequest {
  categoryId: string;
  subcategoryId?: string;
  questionCount: number;
  difficultyLevel?: 1 | 2 | 3;
}
