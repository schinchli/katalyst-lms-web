import { quizQuestions, quizzes } from '@/data/quizzes';
import type { Question, Quiz } from '@/types';

export const MANAGED_QUIZ_CONTENT_KEY = 'managed_quiz_content';

export interface ManagedQuizContent {
  quizzes: Quiz[];
  questions: Record<string, Question[]>;
}

const BASE_QUIZZES: Quiz[] = quizzes.map((quiz) => ({ ...quiz }));
const BASE_QUESTIONS: Record<string, Question[]> = Object.fromEntries(
  Object.entries(quizQuestions).map(([quizId, items]) => [
    quizId,
    items.map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option })),
    })),
  ]),
);

function cloneQuestion(question: Question): Question {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

function normalizeQuestion(raw: unknown, quizId: string, index: number): Question | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<Question>;
  const text = typeof value.text === 'string' ? value.text.trim() : '';
  if (!text) return null;

  const options = Array.isArray(value.options)
    ? value.options
        .map((option, optionIndex) => {
          if (!option || typeof option !== 'object') return null;
          const item = option as { id?: string; text?: string };
          const optionText = typeof item.text === 'string' ? item.text.trim() : '';
          if (!optionText) return null;
          const fallbackId = ['a', 'b', 'c', 'd', 'e'][optionIndex] ?? `opt-${optionIndex + 1}`;
          return {
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : fallbackId,
            text: optionText,
          };
        })
        .filter((option): option is Question['options'][number] => Boolean(option))
    : [];

  if (options.length < 2) return null;

  const correctOptionId =
    typeof value.correctOptionId === 'string' && options.some((option) => option.id === value.correctOptionId)
      ? value.correctOptionId
      : options[0].id;

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `${quizId}-question-${index + 1}`,
    text,
    options,
    correctOptionId,
    explanation: typeof value.explanation === 'string' ? value.explanation : '',
    difficulty:
      value.difficulty === 'beginner' || value.difficulty === 'intermediate' || value.difficulty === 'advanced'
        ? value.difficulty
        : 'beginner',
    category: typeof value.category === 'string' && value.category.trim() ? value.category.trim() : undefined,
    quizId,
  };
}

function normalizeQuiz(raw: unknown, index: number): Quiz | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<Quiz>;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!id || !title) return null;

  return {
    id,
    title,
    description: typeof value.description === 'string' ? value.description : '',
    category: typeof value.category === 'string' && value.category.trim() ? value.category.trim() : 'general',
    difficulty:
      value.difficulty === 'beginner' || value.difficulty === 'intermediate' || value.difficulty === 'advanced'
        ? value.difficulty
        : 'beginner',
    questionCount: typeof value.questionCount === 'number' && Number.isFinite(value.questionCount) ? Math.max(0, Math.round(value.questionCount)) : 0,
    duration: typeof value.duration === 'number' && Number.isFinite(value.duration) ? Math.max(1, Math.round(value.duration)) : 10,
    isPremium: typeof value.isPremium === 'boolean' ? value.isPremium : false,
    price: typeof value.price === 'number' && Number.isFinite(value.price) ? Math.max(0, Math.round(value.price)) : 0,
    icon: typeof value.icon === 'string' && value.icon.trim() ? value.icon.trim() : 'book',
    certLevel:
      value.certLevel === 'foundational' || value.certLevel === 'associate' || value.certLevel === 'professional' || value.certLevel === 'specialty'
        ? value.certLevel
        : undefined,
    examCode: typeof value.examCode === 'string' && value.examCode.trim() ? value.examCode.trim() : undefined,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    provider: typeof value.provider === 'string' && value.provider.trim() ? value.provider.trim() : undefined,
  };
}

export function normalizeManagedQuizContent(value: unknown): ManagedQuizContent {
  if (!value || typeof value !== 'object') {
    return { quizzes: [], questions: {} };
  }

  const raw = value as { quizzes?: unknown; questions?: unknown };
  const nextQuizzes = Array.isArray(raw.quizzes)
    ? raw.quizzes
        .map((quiz, index) => normalizeQuiz(quiz, index))
        .filter((quiz): quiz is Quiz => Boolean(quiz))
    : [];

  const nextQuestions = !raw.questions || typeof raw.questions !== 'object'
    ? {}
    : Object.fromEntries(
        Object.entries(raw.questions as Record<string, unknown>).map(([quizId, items]) => [
          quizId,
          Array.isArray(items)
            ? items
                .map((question, index) => normalizeQuestion(question, quizId, index))
                .filter((question): question is Question => Boolean(question))
            : [],
        ]),
      );

  return {
    quizzes: nextQuizzes,
    questions: nextQuestions,
  };
}

export function buildManagedQuizDataset(value: unknown): ManagedQuizContent {
  const managed = normalizeManagedQuizContent(value);
  const quizMap = new Map(BASE_QUIZZES.map((quiz) => [quiz.id, { ...quiz }] as const));
  const questionMap = new Map<string, Question[]>(
    Object.entries(BASE_QUESTIONS).map(([quizId, items]) => [quizId, items.map(cloneQuestion)]),
  );
  const managedIds: string[] = [];

  managed.quizzes.forEach((quiz) => {
    quizMap.set(quiz.id, { ...quiz });
    managedIds.push(quiz.id);
  });

  Object.entries(managed.questions).forEach(([quizId, items]) => {
    questionMap.set(quizId, items.map(cloneQuestion));
  });

  const orderedQuizzes = [
    ...BASE_QUIZZES.map((quiz) => quizMap.get(quiz.id) ?? { ...quiz }),
    ...managedIds
      .filter((quizId) => !BASE_QUIZZES.some((quiz) => quiz.id === quizId))
      .map((quizId) => quizMap.get(quizId))
      .filter((quiz): quiz is Quiz => Boolean(quiz)),
  ].map((quiz) => {
    const questions = questionMap.get(quiz.id);
    return {
      ...quiz,
      questionCount: questions?.length ?? quiz.questionCount,
      price: quiz.isPremium ? Math.max(0, quiz.price ?? 0) : 0,
      enabled: quiz.enabled ?? true,
    };
  });

  return {
    quizzes: orderedQuizzes,
    questions: Object.fromEntries(
      Array.from(questionMap.entries()).map(([quizId, items]) => [quizId, items.map(cloneQuestion)]),
    ),
  };
}

export function applyManagedQuizContent(value: unknown) {
  const dataset = buildManagedQuizDataset(value);
  quizzes.splice(0, quizzes.length, ...dataset.quizzes.map((quiz) => ({ ...quiz })));

  Object.keys(quizQuestions).forEach((quizId) => {
    if (!(quizId in dataset.questions)) {
      delete quizQuestions[quizId];
    }
  });

  Object.entries(dataset.questions).forEach(([quizId, items]) => {
    quizQuestions[quizId] = items.map(cloneQuestion);
  });

  return dataset;
}
