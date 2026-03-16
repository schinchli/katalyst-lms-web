export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'premium';
  unlockedCourses?: string[];
  createdAt: string;
}

export type CertLevel = 'foundational' | 'associate' | 'professional' | 'specialty';

export type QuizMode =
  | 'quiz_zone'
  | 'true_false'
  | 'exam'
  | 'fun_and_learn'
  | 'guess_the_word'
  | 'audio'
  | 'maths_quiz'
  | 'multi_match';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: QuizCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  duration: number; // minutes
  isPremium: boolean;
  price?: number;   // INR one-time unlock price
  icon: string;
  certLevel?: CertLevel;
  examCode?: string;
  enabled?: boolean;
  fixedQuestionCount?: number;
  correctScore?: number;
  wrongScore?: number;
  /** Cloud provider — 'aws' | 'azure' | 'gcp' | 'nvidia' | 'kubernetes' | ... */
  provider?: string;
  /** Quiz mode — determines UI rendering and timer behavior */
  mode?: QuizMode;
  /** Exam mode: if false, correct answers are NOT shown in results */
  examReviewAllowed?: boolean;
}

export interface ManagedCategory {
  id: string;
  name: string;
  description?: string;
  subcategories?: ManagedSubcategory[];
}

export interface ManagedSubcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  explanation?: string;
  correctOptionId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  quizId?: string;
  wordAnswer?: string;           // Guess the Word / Maths Quiz: correct text/numeric answer
  numericAnswer?: number;        // Maths Quiz: exact numeric answer
  hint?: string;                 // Guess the Word: optional hint shown on demand
  audioUrl?: string;             // Audio Quiz: URL to audio clip (admin-set)
  audioFallbackText?: string;    // Audio Quiz: accessibility text when audio unavailable
  matchPairs?: MatchPair[];      // Multi Match: array of left/right pairs
}

export interface Option {
  id: string;
  text: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // seconds
  answers: Record<string, string>; // questionId -> selectedOptionId
  completedAt: string;
}

export interface Progress {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  badges: Badge[];
  recentResults: QuizResult[];
  // Coin economy + level system (Elite Quiz parity)
  coins: number;
  totalCoinsEarned: number;
  xp: number;
  level: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarInitial: string;
  score: number;       // total score points
  coins: number;
  streak: number;
  quizzesCompleted: number;
  isCurrentUser?: boolean;
}

export type ContestStatus = 'live' | 'upcoming' | 'past';

export interface Contest {
  id: string;
  title: string;
  description: string;
  status: ContestStatus;
  quizId: string;
  quizTitle: string;
  category: string;
  icon: string;
  entryFee: number;    // coins
  prizeCoins: number;
  startTime: string;   // ISO
  endTime: string;     // ISO
  participants: number;
  maxParticipants: number;
  topScore?: number;
  winner?: string;
}

export type BadgeId =
  | 'first-quiz'
  | 'perfect-score'
  | 'seven-day-streak'
  | 'speed-demon'
  | 'category-master'
  | 'half-way'
  | 'quiz-marathon';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export type QuizCategory =
  | 'bedrock'
  | 'rag'
  | 'agents'
  | 'guardrails'
  | 'prompt-eng'
  | 'routing'
  | 'security'
  | 'monitoring'
  | 'orchestration'
  | 'mlops'
  | 'evaluation'
  | 'cost-optimization'
  | 'serverless'
  | 'general'
  // AWS Certifications
  | 'clf-c02'
  | 'aif-c01'
  | 'saa-c03'
  | 'dva-c02'
  | 'soa-c03'
  | 'dea-c01'
  | 'mla-c01'
  | 'sap-c02'
  | 'dop-c02'
  | 'aip-c01'
  | 'ans-c01'
  | 'scs-c03'
  | 'pas-c01'
  | 'mls-c01'
  | (string & {});
