/**
 * Learning Zone types — maps `tbl_learning`, `tbl_learning_question` tables
 * from Quiz Online V-7.1.6.
 * Content stored in S3: /learning/{categoryId}/{moduleId}.json
 */

export type LearningModuleStatus = 'active' | 'inactive' | 'draft';

/** Learning module (video course) — maps `tbl_learning` table */
export interface LearningModule {
  id: string;
  categoryId: string;
  languageId: string;
  title: string;
  youtubeVideoId?: string;     // YouTube embed ID
  content: string;             // Rich text / HTML course content
  pdfUrl?: string;             // S3 URL to supplementary PDF
  status: LearningModuleStatus;
  createdAt: string;
  updatedAt: string;
}

/** Quiz question tied to a learning module — maps `tbl_learning_question` */
export interface LearningQuestion {
  id: string;
  learningModuleId: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
}

/** User's learning progress */
export interface LearningProgress {
  userId: string;
  moduleId: string;
  isCompleted: boolean;
  quizScore?: number;
  completedAt?: string;
}
