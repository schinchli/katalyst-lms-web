/**
 * Quiz domain types — maps `category`, `subcategory`, `question`,
 * `tbl_maths_question`, `tbl_level`, `tbl_bookmark`, `daily_quiz`,
 * `daily_quiz_user`, `question_reports` tables from Quiz Online V-7.1.6
 */

// ─── Category / Subcategory ───────────────────────────────────────────────────

export type CategoryType = 'quiz' | 'learning';
export type CategoryPlan = 'free' | 'paid';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'multiple_choice' | 'true_false';
export type DifficultyLevel = 1 | 2 | 3; // 1=easy, 2=medium, 3=hard

/**
 * Quiz category — maps `category` table.
 * Content stored in S3: /categories/{languageId}.json
 */
export interface Category {
  id: string;
  languageId: string;
  name: string;
  type: CategoryType;
  imageUrl?: string;
  rowOrder: number;
  plan: CategoryPlan;
  amount: number;             // Price if paid (in coins)
  status: 'active' | 'inactive';
  createdAt: string;
}

/** Subcategory — maps `subcategory` table */
export interface Subcategory {
  id: string;
  categoryId: string;         // FK to Category
  languageId: string;
  name: string;
  imageUrl?: string;
  rowOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ─── Question ─────────────────────────────────────────────────────────────────

export interface QuestionOption {
  id: 'a' | 'b' | 'c' | 'd' | 'e';
  text: string;
}

/**
 * Question — maps `question` + `tbl_maths_question` tables.
 * Stored in S3: /questions/{categoryId}/{subcategoryId}.json
 */
export interface Question {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  languageId: string;
  imageUrl?: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];   // 4 or 5 options
  correctOptionId: 'a' | 'b' | 'c' | 'd' | 'e';
  difficultyLevel: DifficultyLevel;
  explanation?: string;        // Note / explanation shown after answer
  isMathQuestion?: boolean;   // From tbl_maths_question
  createdAt: string;
}

// ─── Quiz metadata (our LMS format) ──────────────────────────────────────────

/**
 * Quiz — composite of Category + metadata.
 * This is the format used in the mobile app.
 */
export type CertLevel = 'foundational' | 'associate' | 'professional' | 'specialty';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  questionCount: number;
  duration: number;            // minutes
  isPremium: boolean;
  icon: string;                // Feather icon name
  certLevel?: CertLevel;
  examCode?: string;
  enabled?: boolean;
  fixedQuestionCount?: number;
  correctScore?: number;
  wrongScore?: number;
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

// ─── Daily Quiz ───────────────────────────────────────────────────────────────

/** Daily quiz — maps `daily_quiz` table */
export interface DailyQuiz {
  id: string;
  languageId: string;
  questionIds: string[];
  publishedDate: string;       // YYYY-MM-DD
}

/** Tracks which users completed daily quiz — maps `daily_quiz_user` */
export interface DailyQuizCompletion {
  id: string;
  userId: string;
  completedDate: string;       // YYYY-MM-DD
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/** Bookmarked questions — maps `tbl_bookmark` table */
export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  isBookmarked: boolean;
  createdAt: string;
}

// ─── Level Progress ───────────────────────────────────────────────────────────

/** Level progress per category/subcategory — maps `tbl_level` table */
export interface LevelProgress {
  id: string;
  userId: string;
  categoryId: string;
  subcategoryId?: string;
  level: DifficultyLevel;      // Current level reached (1-3)
  updatedAt: string;
}

// ─── Question Reports ─────────────────────────────────────────────────────────

/** User-reported question issues — maps `question_reports` table */
export interface QuestionReport {
  id: string;
  questionId: string;
  userId: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}
