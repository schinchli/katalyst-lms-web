import { quizzes } from '@/data/quizzes';

export const QUIZ_CATALOG_OVERRIDES_KEY = 'quiz_catalog_overrides';

export interface QuizCatalogOverride {
  isPremium?: boolean;
  price?: number;
  enabled?: boolean;
}

export type QuizCatalogOverrides = Record<string, QuizCatalogOverride>;

const BASE_QUIZ_FLAGS = Object.fromEntries(
  quizzes.map((quiz) => [
    quiz.id,
    {
      isPremium: quiz.isPremium,
      price: quiz.price,
    },
  ]),
) as Record<string, { isPremium: boolean; price?: number }>;

export function normalizeQuizCatalogOverrides(value: unknown): QuizCatalogOverrides {
  if (!value || typeof value !== 'object') return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([quizId, raw]) => {
      if (!raw || typeof raw !== 'object') return [];
      const override = raw as Record<string, unknown>;
      const next: QuizCatalogOverride = {};

      if (typeof override.isPremium === 'boolean') next.isPremium = override.isPremium;
      if (typeof override.price === 'number' && !Number.isNaN(override.price)) {
        next.price = Math.max(0, Math.round(override.price));
      }
      if (typeof override.enabled === 'boolean') next.enabled = override.enabled;

      return Object.keys(next).length > 0 ? [[quizId, next] as const] : [];
    }),
  );
}

export function applyQuizCatalogOverrides(value: unknown) {
  const overrides = normalizeQuizCatalogOverrides(value);

  quizzes.forEach((quiz) => {
    const base = BASE_QUIZ_FLAGS[quiz.id] ?? { isPremium: quiz.isPremium, price: quiz.price };
    const override = overrides[quiz.id];
    const isPremium = override?.isPremium ?? base.isPremium;
    const price = override?.price ?? base.price;
    const enabled = override?.enabled ?? true;

    quiz.isPremium = isPremium;
    quiz.enabled = enabled;
    if (isPremium) {
      quiz.price = price && price > 0 ? price : 149;
    } else {
      quiz.price = 0;
    }
  });

  return overrides;
}
