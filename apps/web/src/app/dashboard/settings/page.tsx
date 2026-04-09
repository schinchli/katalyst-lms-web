'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { quizQuestions, quizzes } from '@/data/quizzes';
import { DEFAULT_APP_CONTENT, normalizeAppContent, type AppContentConfig } from '@/lib/appContent';
import { applyQuizCatalogOverrides, normalizeQuizCatalogOverrides, type QuizCatalogOverrides } from '@/lib/quizCatalog';
import { PLATFORM_THEME_PRESETS, applyPlatformThemePreset } from '@/lib/platformTheme';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import {
  applyManagedQuizContent,
  normalizeManagedQuizContent,
  normalizeManagedCategories,
  type ManagedQuizContent,
} from '@/lib/managedQuizContent';
import type { CoinPack, Contest, ContestStatus, ManagedCategory, ManagedSubcategory, MatchPair, Question, Quiz, QuizMode } from '@/types';
import { normalizeContest } from '@/app/api/admin/contests/route';
import {
  applyPlatformExperience,
  DEFAULT_PLATFORM_EXPERIENCE,
  normalizePlatformExperience,
  type PlatformExperienceConfig,
} from '@/lib/platformExperience';

const EMPTY_MANAGED_CONTENT: ManagedQuizContent = { quizzes: [], questions: {} };

interface QuizImportBundle extends Partial<Quiz> {
  questions?: Question[];
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function createManagedQuiz(seed = ''): Quiz {
  const slug = toSlug(seed) || `managed-quiz-${Date.now()}`;
  return {
    id: slug,
    title: seed || 'New managed quiz',
    description: '',
    category: 'general',
    difficulty: 'beginner',
    questionCount: 1,
    duration: 10,
    isPremium: false,
    price: 0,
    icon: 'book',
    enabled: true,
    fixedQuestionCount: 0,
    correctScore: 1,
    wrongScore: 0,
  };
}

function getUniqueManagedQuizId(baseId: string, existingIds: string[]) {
  if (!existingIds.includes(baseId)) return baseId;
  let counter = 2;
  while (existingIds.includes(`${baseId}-${counter}`)) {
    counter += 1;
  }
  return `${baseId}-${counter}`;
}

function createManagedQuestion(quizId: string, index: number): Question {
  return {
    id: `${quizId}-question-${index + 1}`,
    text: '',
    correctOptionId: 'a',
    explanation: '',
    quizId,
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
  };
}

function getNextOptionId(options: Question['options']) {
  const candidates = ['a', 'b', 'c', 'd', 'e'];
  return candidates.find((candidate) => !options.some((option) => option.id === candidate)) ?? `opt-${options.length + 1}`;
}

function buildTrueFalseOptions() {
  return [
    { id: 'a', text: 'True' },
    { id: 'b', text: 'False' },
  ];
}

function generateMatchPairId() {
  return `pair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function mergeManagedQuizContent(current: ManagedQuizContent, incoming: ManagedQuizContent): ManagedQuizContent {
  const quizMap = new Map(current.quizzes.map((quiz) => [quiz.id, quiz] as const));
  incoming.quizzes.forEach((quiz) => {
    quizMap.set(quiz.id, quiz);
  });

  return {
    quizzes: Array.from(quizMap.values()),
    questions: {
      ...current.questions,
      ...incoming.questions,
    },
  };
}

function parseBulkManagedQuizImport(source: string): ManagedQuizContent {
  const parsed = JSON.parse(source) as unknown;

  if (Array.isArray(parsed)) {
    const bundles = parsed as QuizImportBundle[];
    const normalized = normalizeManagedQuizContent({
      quizzes: bundles.map(({ questions: _questions, ...quiz }) => quiz),
      questions: Object.fromEntries(
        bundles.map((bundle) => [bundle.id ?? '', bundle.questions ?? []]).filter(([quizId]) => Boolean(quizId)),
      ),
    });
    return normalized;
  }

  if (parsed && typeof parsed === 'object') {
    const value = parsed as { quizzes?: unknown; questions?: unknown; questionsList?: unknown };
    if ('quizzes' in value || 'questions' in value) {
      return normalizeManagedQuizContent(value);
    }

    if ('id' in value || 'title' in value) {
      const bundle = value as QuizImportBundle;
      return normalizeManagedQuizContent({
        quizzes: [{ ...bundle, questionCount: Array.isArray(bundle.questions) ? bundle.questions.length : bundle.questionCount }],
        questions: {
          [String(bundle.id ?? '')]: bundle.questions ?? value.questionsList ?? [],
        },
      });
    }
  }

  throw new Error('Unsupported import format. Use a managed content object, a single quiz bundle, or an array of quiz bundles.');
}

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<PlatformExperienceConfig>(DEFAULT_PLATFORM_EXPERIENCE);
  const [quizOverrides, setQuizOverrides] = useState<QuizCatalogOverrides>({});
  const [appContent, setAppContent] = useState<AppContentConfig>(DEFAULT_APP_CONTENT);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [managedQuizContent, setManagedQuizContent] = useState<ManagedQuizContent>(EMPTY_MANAGED_CONTENT);
  const [selectedManagedQuizId, setSelectedManagedQuizId] = useState('');
  const [importSourceQuizId, setImportSourceQuizId] = useState('');
  const [bulkImportValue, setBulkImportValue] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState<Record<string, { name: string; description: string }>>({});
  const [pendingDeleteQuizId, setPendingDeleteQuizId] = useState<string | null>(null);
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null);
  // ── Contests ────────────────────────────────────────────────────────────────
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestsSaved, setContestsSaved] = useState(false);
  const [pendingDeleteContestId, setPendingDeleteContestId] = useState<string | null>(null);
  const [contestForm, setContestForm] = useState<Partial<Contest> & { id: string }>({
    id: '', title: '', description: '', status: 'upcoming', quizId: '', quizTitle: '',
    category: 'general', icon: 'award', entryFee: 0, prizeCoins: 0,
    startTime: '', endTime: '', participants: 0, maxParticipants: 100,
  });
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  // ── Coin packs ──────────────────────────────────────────────────────────────
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [coinPacksSaved, setCoinPacksSaved] = useState(false);
  const [pendingDeletePackId, setPendingDeletePackId] = useState<string | null>(null);
  // ── Daily quiz analytics ─────────────────────────────────────────────────
  const [dailyAnalytics, setDailyAnalytics] = useState<{
    quizId: string;
    dailyEnabled: boolean;
    attempts: number;
    completions: number;
    completionRate: number;
    lastUpdated: string;
  } | null>(null);
  const [newPackForm, setNewPackForm] = useState<Omit<CoinPack, 'id'>>({
    label: '', coins: 100, priceInr: 99, priceUsd: 1.19, popular: false, enabled: true,
  });
  const managedContentFields: Array<{ label: string; key: keyof AppContentConfig; multiline: boolean }> = [
    { label: 'App name', key: 'appName', multiline: false },
    { label: 'Support email', key: 'supportEmail', multiline: false },
    { label: 'Privacy policy', key: 'privacyPolicy', multiline: true },
    { label: 'Terms & conditions', key: 'termsAndConditions', multiline: true },
    { label: 'About us', key: 'aboutUs', multiline: true },
    { label: 'How to play', key: 'instructions', multiline: true },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) {
        router.replace('/login');
        return;
      }

      setAccessToken(session.access_token);
      try {
        const authRes = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const authBody = await authRes.json() as { isAdmin?: boolean };
        if (!authBody.isAdmin) {
          router.replace('/dashboard');
          return;
        }
        setAuthorized(true);

        const [configRes, quizCatalogRes, appContentRes, systemFeaturesRes, quizContentRes, categoriesRes, contestsRes, coinPacksRes, dailyAnalyticsRes] = await Promise.all([
          fetch('/api/admin/mobile-config', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/quiz-catalog', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/app-content', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/system-features', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/quiz-content', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/categories', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/contests', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/coin-packs', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/admin/daily-quiz-analytics', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);
        const configBody = await configRes.json() as { config?: unknown };
        const quizCatalogBody = await quizCatalogRes.json() as { overrides?: unknown };
        const appContentBody = await appContentRes.json() as { content?: unknown };
        const systemFeaturesBody = await systemFeaturesRes.json() as { config?: unknown };
        const quizContentBody = await quizContentRes.json() as { content?: unknown };
        const categoriesBody = await categoriesRes.json() as { categories?: unknown };
        const contestsBody = await contestsRes.json() as { contests?: unknown };
        const coinPacksBody = await coinPacksRes.json() as { ok?: boolean; packs?: unknown };
        const dailyAnalyticsBody = await dailyAnalyticsRes.json() as {
          ok?: boolean;
          quizId?: string;
          dailyEnabled?: boolean;
          attempts?: number;
          completions?: number;
          completionRate?: number;
          lastUpdated?: string;
        };
        setConfig(normalizePlatformExperience(configBody.config));
        const nextOverrides = normalizeQuizCatalogOverrides(quizCatalogBody.overrides);
        setQuizOverrides(nextOverrides);
        setAppContent(normalizeAppContent(appContentBody.content));
        setSystemFeatures(normalizeSystemFeatures(systemFeaturesBody.config));
        const nextManagedContent = normalizeManagedQuizContent(quizContentBody.content);
        setManagedQuizContent(nextManagedContent);
        setSelectedManagedQuizId(nextManagedContent.quizzes[0]?.id ?? '');
        applyManagedQuizContent(nextManagedContent);
        applyQuizCatalogOverrides(nextOverrides);
        setManagedCategories(normalizeManagedCategories(categoriesBody.categories));
        const rawContests = Array.isArray(contestsBody.contests) ? contestsBody.contests : [];
        setContests(rawContests.map(normalizeContest).filter((c): c is Contest => c !== null));
        setCoinPacks(Array.isArray(coinPacksBody.packs) ? coinPacksBody.packs as CoinPack[] : []);
        if (dailyAnalyticsBody.ok) {
          setDailyAnalytics({
            quizId:        dailyAnalyticsBody.quizId        ?? '',
            dailyEnabled:  dailyAnalyticsBody.dailyEnabled  ?? false,
            attempts:      dailyAnalyticsBody.attempts      ?? 0,
            completions:   dailyAnalyticsBody.completions   ?? 0,
            completionRate: dailyAnalyticsBody.completionRate ?? 0,
            lastUpdated:   dailyAnalyticsBody.lastUpdated   ?? '',
          });
        }
      } catch {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const dailyQuizCatalog = useMemo(
    () => quizzes.map((quiz) => ({ ...quiz, ...(quizOverrides[quiz.id] ?? {}) })),
    [quizOverrides],
  );
  const configuredDailyQuiz = useMemo(
    () => (systemFeatures.dailyQuizQuizId ? dailyQuizCatalog.find((quiz) => quiz.id === systemFeatures.dailyQuizQuizId) ?? null : null),
    [dailyQuizCatalog, systemFeatures.dailyQuizQuizId],
  );
  const resolvedDailyQuiz = useMemo(
    () => resolveDailyQuiz(systemFeatures, dailyQuizCatalog),
    [dailyQuizCatalog, systemFeatures],
  );
  const dailyQuizFallsBack = Boolean(
    systemFeatures.dailyQuizEnabled
      && systemFeatures.dailyQuizQuizId
      && (!configuredDailyQuiz || configuredDailyQuiz.enabled === false),
  );
  const dailyQuizIsPremium = Boolean(configuredDailyQuiz?.isPremium);
  const resolvedDailyQuizSource = !systemFeatures.dailyQuizEnabled
    ? 'disabled'
    : configuredDailyQuiz && !dailyQuizFallsBack
      ? 'configured'
      : resolvedDailyQuiz
        ? 'fallback rotation'
        : 'none';

  const saveConfig = async () => {
    if (!accessToken) return;

    const next = normalizePlatformExperience(config);
    const normalizedManagedQuizContent = normalizeManagedQuizContent(managedQuizContent);
    const [platformRes, themeRes, quizRes, appContentRes, systemFeaturesRes, managedQuizRes] = await Promise.all([
      fetch('/api/admin/mobile-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(next),
      }),
      fetch('/api/admin/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ presetId: next.theme.platformPreset }),
      }),
      fetch('/api/admin/quiz-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(quizOverrides),
      }),
      fetch('/api/admin/app-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(appContent),
      }),
      fetch('/api/admin/system-features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(systemFeatures),
      }),
      fetch('/api/admin/quiz-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(normalizedManagedQuizContent),
      }),
    ]);

    if (!platformRes.ok || !themeRes.ok || !quizRes.ok || !appContentRes.ok || !systemFeaturesRes.ok || !managedQuizRes.ok) return;

    setConfig(next);
    applyPlatformExperience(next);
    applyPlatformThemePreset(next.theme.platformPreset);
    setManagedQuizContent(normalizedManagedQuizContent);
    applyManagedQuizContent(normalizedManagedQuizContent);
    applyQuizCatalogOverrides(quizOverrides);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const managedQuizList = useMemo(() => managedQuizContent.quizzes, [managedQuizContent]);
  const selectedManagedQuiz = managedQuizList.find((quiz) => quiz.id === selectedManagedQuizId) ?? managedQuizList[0] ?? null;
  const selectedManagedQuestions = selectedManagedQuiz ? managedQuizContent.questions[selectedManagedQuiz.id] ?? [] : [];
  const importableQuizzes = useMemo(
    () => quizzes.filter((quiz) => !managedQuizList.some((managedQuiz) => managedQuiz.id === quiz.id)),
    [managedQuizList],
  );

  const updateManagedQuiz = (quizId: string, patch: Partial<Quiz>) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      quizzes: prev.quizzes.map((quiz) => {
        if (quiz.id !== quizId) return quiz;
        const nextQuiz = { ...quiz, ...patch };
        const questions = prev.questions[quizId];
        return { ...nextQuiz, questionCount: questions?.length ?? nextQuiz.questionCount };
      }),
    }));
  };

  const renameManagedQuizId = (quizId: string, nextIdRaw: string) => {
    const nextId = toSlug(nextIdRaw);
    if (!nextId || nextId === quizId) return;

    setManagedQuizContent((prev) => {
      if (prev.quizzes.some((quiz) => quiz.id === nextId)) return prev;
      const nextQuizzes = prev.quizzes.map((quiz) => (
        quiz.id === quizId ? { ...quiz, id: nextId } : quiz
      ));
      const nextQuestions = Object.fromEntries(
        Object.entries(prev.questions).map(([key, items]) => {
          if (key !== quizId) return [key, items];
          return [
            nextId,
            items.map((question, index) => ({
              ...question,
              id: question.id.startsWith(`${quizId}-question-`) ? `${nextId}-question-${index + 1}` : question.id,
              quizId: nextId,
            })),
          ];
        }),
      );

      return { quizzes: nextQuizzes, questions: nextQuestions };
    });
    setSelectedManagedQuizId(nextId);
  };

  const addManagedQuiz = () => {
    const quiz = createManagedQuiz(`Managed Quiz ${managedQuizList.length + 1}`);
    setManagedQuizContent((prev) => ({
      quizzes: [...prev.quizzes, quiz],
      questions: {
        ...prev.questions,
        [quiz.id]: [createManagedQuestion(quiz.id, 0)],
      },
    }));
    setSelectedManagedQuizId(quiz.id);
  };

  const importExistingQuiz = () => {
    if (!importSourceQuizId) return;

    const sourceQuiz = quizzes.find((quiz) => quiz.id === importSourceQuizId);
    if (!sourceQuiz) return;

    const sourceQuestions = quizQuestions[sourceQuiz.id] ?? [];
    setManagedQuizContent((prev) => ({
      quizzes: [
        ...prev.quizzes,
        {
          ...sourceQuiz,
          questionCount: sourceQuestions.length || sourceQuiz.questionCount,
          enabled: sourceQuiz.enabled ?? true,
        },
      ],
      questions: {
        ...prev.questions,
        [sourceQuiz.id]: sourceQuestions.map((question) => ({
          ...question,
          options: question.options.map((option) => ({ ...option })),
        })),
      },
    }));
    setSelectedManagedQuizId(sourceQuiz.id);
    setImportSourceQuizId('');
  };

  const duplicateManagedQuiz = (quizId: string) => {
    const sourceQuiz = managedQuizList.find((quiz) => quiz.id === quizId);
    if (!sourceQuiz) return;

    const nextId = getUniqueManagedQuizId(`${quizId}-copy`, managedQuizList.map((quiz) => quiz.id));
    const sourceQuestions = managedQuizContent.questions[quizId] ?? [];

    setManagedQuizContent((prev) => ({
      quizzes: [
        ...prev.quizzes,
        {
          ...sourceQuiz,
          id: nextId,
          title: `${sourceQuiz.title} Copy`,
          questionCount: sourceQuestions.length || sourceQuiz.questionCount,
        },
      ],
      questions: {
        ...prev.questions,
        [nextId]: sourceQuestions.map((question, index) => ({
          ...question,
          id: `${nextId}-question-${index + 1}`,
          quizId: nextId,
          options: question.options.map((option) => ({ ...option })),
        })),
      },
    }));
    setSelectedManagedQuizId(nextId);
  };

  const deleteManagedQuiz = (quizId: string) => {
    setManagedQuizContent((prev) => ({
      quizzes: prev.quizzes.filter((quiz) => quiz.id !== quizId),
      questions: Object.fromEntries(Object.entries(prev.questions).filter(([key]) => key !== quizId)),
    }));
    if (selectedManagedQuizId === quizId) {
      const nextQuiz = managedQuizList.find((quiz) => quiz.id !== quizId);
      setSelectedManagedQuizId(nextQuiz?.id ?? '');
    }
  };

  const updateManagedQuestion = (quizId: string, questionId: string, patch: Partial<Question>) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [quizId]: (prev.questions[quizId] ?? []).map((question) => (
          question.id === questionId ? { ...question, ...patch } : question
        )),
      },
    }));
  };

  const updateManagedOption = (quizId: string, questionId: string, optionId: string, text: string) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [quizId]: (prev.questions[quizId] ?? []).map((question) => (
          question.id === questionId
            ? {
                ...question,
                options: question.options.map((option) => (
                  option.id === optionId ? { ...option, text } : option
                )),
              }
            : question
        )),
      },
    }));
  };

  const addManagedOption = (quizId: string, questionId: string) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [quizId]: (prev.questions[quizId] ?? []).map((question) => {
          if (question.id !== questionId || question.options.length >= 5) return question;
          return {
            ...question,
            options: [
              ...question.options,
              { id: getNextOptionId(question.options), text: '' },
            ],
          };
        }),
      },
    }));
  };

  const applyTrueFalsePreset = (quizId: string, questionId: string) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [quizId]: (prev.questions[quizId] ?? []).map((question) => (
          question.id === questionId
            ? {
                ...question,
                options: buildTrueFalseOptions(),
                correctOptionId: question.correctOptionId === 'b' ? 'b' : 'a',
              }
            : question
        )),
      },
    }));
  };

  const removeManagedOption = (quizId: string, questionId: string, optionId: string) => {
    setManagedQuizContent((prev) => ({
      ...prev,
      questions: {
        ...prev.questions,
        [quizId]: (prev.questions[quizId] ?? []).map((question) => {
          if (question.id !== questionId || question.options.length <= 2) return question;
          const nextOptions = question.options.filter((option) => option.id !== optionId);
          const nextCorrectOptionId = question.correctOptionId === optionId
            ? nextOptions[0]?.id ?? question.correctOptionId
            : question.correctOptionId;
          return {
            ...question,
            options: nextOptions,
            correctOptionId: nextCorrectOptionId,
          };
        }),
      },
    }));
  };

  const addManagedQuestion = (quizId: string) => {
    setManagedQuizContent((prev) => {
      const nextQuestions = [...(prev.questions[quizId] ?? []), createManagedQuestion(quizId, prev.questions[quizId]?.length ?? 0)];
      return {
        quizzes: prev.quizzes.map((quiz) => (
          quiz.id === quizId ? { ...quiz, questionCount: nextQuestions.length } : quiz
        )),
        questions: {
          ...prev.questions,
          [quizId]: nextQuestions,
        },
      };
    });
  };

  const deleteManagedQuestion = (quizId: string, questionId: string) => {
    setManagedQuizContent((prev) => {
      const nextQuestions = (prev.questions[quizId] ?? []).filter((question) => question.id !== questionId);
      return {
        quizzes: prev.quizzes.map((quiz) => (
          quiz.id === quizId ? { ...quiz, questionCount: nextQuestions.length } : quiz
        )),
        questions: {
          ...prev.questions,
          [quizId]: nextQuestions,
        },
      };
    });
  };

  const duplicateManagedQuestion = (quizId: string, questionId: string) => {
    setManagedQuizContent((prev) => {
      const items = [...(prev.questions[quizId] ?? [])];
      const index = items.findIndex((question) => question.id === questionId);
      if (index === -1) return prev;

      const source = items[index];
      const duplicate: Question = {
        ...source,
        id: `${quizId}-question-${items.length + 1}`,
        text: `${source.text}${source.text ? ' (Copy)' : ''}`,
        options: source.options.map((option) => ({ ...option })),
      };
      items.splice(index + 1, 0, duplicate);

      return {
        quizzes: prev.quizzes.map((quiz) => (
          quiz.id === quizId ? { ...quiz, questionCount: items.length } : quiz
        )),
        questions: {
          ...prev.questions,
          [quizId]: items,
        },
      };
    });
  };

  const moveManagedQuestion = (quizId: string, questionId: string, direction: 'up' | 'down') => {
    setManagedQuizContent((prev) => {
      const items = [...(prev.questions[quizId] ?? [])];
      const index = items.findIndex((question) => question.id === questionId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;

      const [item] = items.splice(index, 1);
      items.splice(targetIndex, 0, item);

      return {
        ...prev,
        questions: {
          ...prev.questions,
          [quizId]: items,
        },
      };
    });
  };

  const bulkImportManagedContent = () => {
    if (!bulkImportValue.trim()) return;

    try {
      const imported = parseBulkManagedQuizImport(bulkImportValue);
      const merged = mergeManagedQuizContent(managedQuizContent, imported);
      setManagedQuizContent(merged);
      setSelectedManagedQuizId(imported.quizzes[0]?.id ?? selectedManagedQuizId);
      setBulkImportValue('');
      setBulkImportError('');
    } catch (error) {
      setBulkImportError(error instanceof Error ? error.message : 'Failed to import JSON.');
    }
  };

  const exportManagedQuizContent = () => {
    const payload = JSON.stringify(normalizeManagedQuizContent(managedQuizContent), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `managed-quiz-content-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteManagedQuizWithConfirm = (quizId: string) => {
    setPendingDeleteQuizId(quizId);
  };

  const confirmDeleteQuiz = () => {
    if (pendingDeleteQuizId) { deleteManagedQuiz(pendingDeleteQuizId); }
    setPendingDeleteQuizId(null);
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || `cat-${Date.now()}`;
    const uniqueId = managedCategories.some((c) => c.id === id) ? `${id}-${Date.now()}` : id;
    setManagedCategories((prev) => [
      ...prev,
      { id: uniqueId, name, description: newCategoryDescription.trim() || undefined, subcategories: [] },
    ]);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const deleteCategory = (categoryId: string) => {
    setPendingDeleteCategoryId(categoryId);
  };

  const confirmDeleteCategory = () => {
    if (pendingDeleteCategoryId) { setManagedCategories((prev) => prev.filter((c) => c.id !== pendingDeleteCategoryId)); }
    setPendingDeleteCategoryId(null);
  };

  const addSubcategory = (categoryId: string) => {
    const input = newSubcategoryInputs[categoryId];
    const name = input?.name.trim() ?? '';
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || `sub-${Date.now()}`;
    setManagedCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const existing = cat.subcategories ?? [];
        const uniqueId = existing.some((s) => s.id === id) ? `${id}-${Date.now()}` : id;
        const sub: ManagedSubcategory = {
          id: uniqueId,
          name,
          description: input?.description.trim() || undefined,
          categoryId,
        };
        return { ...cat, subcategories: [...existing, sub] };
      }),
    );
    setNewSubcategoryInputs((prev) => ({ ...prev, [categoryId]: { name: '', description: '' } }));
  };

  const deleteSubcategory = (categoryId: string, subId: string) => {
    setManagedCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : { ...cat, subcategories: (cat.subcategories ?? []).filter((s) => s.id !== subId) },
      ),
    );
  };

  const saveCategories = async () => {
    if (!accessToken) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ categories: managedCategories }),
    });
    if (res.ok) {
      setCategoriesSaved(true);
      setTimeout(() => setCategoriesSaved(false), 1800);
    }
  };

  // ── Contest helpers ─────────────────────────────────────────────────────────
  const saveContests = async (updated: Contest[]) => {
    if (!accessToken) return;
    const res = await fetch('/api/admin/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ contests: updated }),
    });
    if (!res.ok) return;
    setContests(updated);
    setContestsSaved(true);
    setTimeout(() => setContestsSaved(false), 1800);
  };

  const handleContestFormSubmit = () => {
    const normalized = normalizeContest(contestForm);
    if (!normalized) return;
    if (editingContestId) {
      const updated = contests.map((c) => (c.id === editingContestId ? normalized : c));
      void saveContests(updated);
    } else {
      // Check for duplicate id
      if (contests.some((c) => c.id === normalized.id)) return;
      void saveContests([...contests, normalized]);
    }
    setEditingContestId(null);
    setContestForm({
      id: '', title: '', description: '', status: 'upcoming', quizId: '', quizTitle: '',
      category: 'general', icon: 'award', entryFee: 0, prizeCoins: 0,
      startTime: '', endTime: '', participants: 0, maxParticipants: 100,
    });
  };

  const startEditContest = (contest: Contest) => {
    setEditingContestId(contest.id);
    setContestForm({ ...contest });
  };

  const confirmDeleteContest = () => {
    if (!pendingDeleteContestId) return;
    const updated = contests.filter((c) => c.id !== pendingDeleteContestId);
    void saveContests(updated);
    setPendingDeleteContestId(null);
  };

  const STATUS_BADGE_COLORS: Record<ContestStatus, { bg: string; color: string }> = {
    live:     { bg: '#EA545518', color: 'var(--error)' },
    upcoming: { bg: '#7367F018', color: '#7367F0' },
    past:     { bg: 'var(--bg)', color: 'var(--text-secondary)' },
  };

  if (!authorized) return null;

  return (
    <div className="page-content dc-shell">
      {/* Inline delete-contest confirmation */}
      {pendingDeleteContestId && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-scrim)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--error)' }}>Delete Contest</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete &quot;{contests.find((c) => c.id === pendingDeleteContestId)?.title ?? pendingDeleteContestId}&quot;? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPendingDeleteContestId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={confirmDeleteContest} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Inline delete-quiz confirmation */}
      {pendingDeleteQuizId && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-scrim)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--error)' }}>Delete Quiz</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete &quot;{managedQuizList.find((q) => q.id === pendingDeleteQuizId)?.title ?? pendingDeleteQuizId}&quot;? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPendingDeleteQuizId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={confirmDeleteQuiz} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Inline delete-category confirmation */}
      {pendingDeleteCategoryId && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-scrim)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--error)' }}>Delete Category</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete &quot;{managedCategories.find((c) => c.id === pendingDeleteCategoryId)?.name ?? pendingDeleteCategoryId}&quot;? All subcategories will also be removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPendingDeleteCategoryId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={confirmDeleteCategory} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <section className="dc-hero">
        <span className="dc-chip">Admin controls</span>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.03 }}>Website experience settings</h1>
        <p style={{ margin: 0, maxWidth: 780, color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.8 }}>
          Control the web and mobile presentation from a shared platform config: theme preset, screen copy, visible widgets, course counts, article volume, and paywall behavior.
        </p>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Theme preset</h2>
          <div className="dc-grid" style={{ gap: 12, marginTop: 20 }}>
            {PLATFORM_THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setConfig((prev) => ({ ...prev, theme: { ...prev.theme, platformPreset: preset.id } }))}
                style={{
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 18,
                  border: `1px solid ${config.theme.platformPreset === preset.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: config.theme.platformPreset === preset.id ? 'var(--primary-light)' : 'var(--overlay-xs)',
                  color: 'var(--text)',
                }}
              >
                <div style={{ height: 54, borderRadius: 14, background: preset.heroPreview, marginBottom: 10 }} />
                <div style={{ fontWeight: 700 }}>{preset.label}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Layout counts</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Featured courses', 'featuredCourseCount'],
              ['Popular courses', 'popularCourseCount'],
              ['Practice courses', 'practiceCourseCount'],
              ['Articles visible', 'resourcesArticleCount'],
              ['Free paywall limit', 'paywallFreeLimit'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <input
                  className="admin-field-input"
                  type="number"
                  value={config.layout[key as keyof PlatformExperienceConfig['layout']] as number}
                  onChange={(event) => setConfig((prev) => ({
                    ...prev,
                    layout: {
                      ...prev.layout,
                      [key]: Number(event.target.value || 0),
                    },
                  }))}
                />
              </label>
            ))}

            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Home action layout</div>
              <select
                className="admin-field-input"
                value={config.layout.homeActionsStyle}
                onChange={(event) => setConfig((prev) => ({ ...prev, layout: { ...prev.layout, homeActionsStyle: event.target.value as 'grid' | 'stack' } }))}
              >
                <option value="grid">Grid</option>
                <option value="stack">Stack</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Quiz access controls</h2>
          <p className="dc-section-subtitle">Mark any quiz as free or premium and set the one-time unlock price. These overrides feed the shared quiz catalog used by the mobile app and the web dashboard.</p>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {quizzes.map((quiz) => {
              const effective = {
                isPremium: quizOverrides[quiz.id]?.isPremium ?? quiz.isPremium,
                price: quizOverrides[quiz.id]?.price ?? quiz.price ?? 0,
                enabled: quizOverrides[quiz.id]?.enabled ?? quiz.enabled ?? true,
              };

              return (
                <div key={quiz.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--overlay-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{quiz.title}</div>
                      <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{quiz.id} · {quiz.examCode ?? quiz.category}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                      <input
                        type="checkbox"
                        checked={effective.isPremium}
                        onChange={(event) => setQuizOverrides((prev) => ({
                          ...prev,
                          [quiz.id]: {
                            ...prev[quiz.id],
                            isPremium: event.target.checked,
                            enabled: prev[quiz.id]?.enabled ?? quiz.enabled ?? true,
                            price: event.target.checked ? (prev[quiz.id]?.price ?? quiz.price ?? 149) : 0,
                          },
                        }))}
                      />
                      Premium
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                      <input
                        type="checkbox"
                        checked={effective.enabled}
                        onChange={(event) => setQuizOverrides((prev) => ({
                          ...prev,
                          [quiz.id]: {
                            ...prev[quiz.id],
                            enabled: event.target.checked,
                            isPremium: prev[quiz.id]?.isPremium ?? quiz.isPremium,
                            price: prev[quiz.id]?.price ?? quiz.price ?? 0,
                          },
                        }))}
                      />
                      Visible
                    </label>
                  </div>

                  <div className="dc-grid" style={{ gridTemplateColumns: '1fr 140px', gap: 12, marginTop: 14 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{quiz.description}</div>
                    <label>
                      <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Price (INR)</div>
                      <input
                        className="admin-field-input"
                        type="number"
                        min={0}
                        disabled={!effective.isPremium}
                        value={effective.price}
                        onChange={(event) => {
                          const nextPrice = Number(event.target.value || 0);
                          setQuizOverrides((prev) => ({
                            ...prev,
                            [quiz.id]: {
                              ...prev[quiz.id],
                              isPremium: effective.isPremium,
                              price: Math.max(0, nextPrice),
                            },
                          }));
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Core copy</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Home hero title', 'homeHeroTitle'],
              ['Home hero subtitle', 'homeHeroSubtitle'],
              ['Quizzes subtitle', 'quizzesSubtitle'],
              ['Learn subtitle', 'learnSubtitle'],
              ['Progress subtitle', 'progressSubtitle'],
              ['Offer title', 'profileOfferTitle'],
              ['Offer subtitle', 'profileOfferSubtitle'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <textarea
                  className="admin-field-input"
                  value={config.copy[key as keyof PlatformExperienceConfig['copy']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, copy: { ...prev.copy, [key]: event.target.value } }))}
                  style={{ minHeight: 96 }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Paywall copy</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Headline', 'paywallHeadline'],
              ['Body copy', 'paywallSubtext'],
              ['Pro CTA', 'paywallProCta'],
              ['Course CTA', 'paywallCourseCta'],
              ['Skip CTA', 'paywallSkipCta'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <textarea
                  className="admin-field-input"
                  value={config.copy[key as keyof PlatformExperienceConfig['copy']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, copy: { ...prev.copy, [key]: event.target.value } }))}
                  style={{ minHeight: key === 'paywallSubtext' ? 120 : 72 }}
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 className="dc-section-title" style={{ fontSize: 28 }}>Managed quizzes</h2>
              <p className="dc-section-subtitle">Create or override quiz/question sets stored in Supabase and reflected on the website plus Expo app.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="admin-field-input"
                value={importSourceQuizId}
                onChange={(event) => setImportSourceQuizId(event.target.value)}
                style={{ minWidth: 220 }}
              >
                <option value="">Import existing quiz</option>
                {importableQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </select>
              <button className="settings-btn-ghost" onClick={importExistingQuiz} disabled={!importSourceQuizId}>Import quiz</button>
              <button className="settings-btn-ghost" onClick={exportManagedQuizContent} disabled={managedQuizList.length === 0}>Export JSON</button>
              <button className="settings-btn-ghost" onClick={addManagedQuiz}>Add managed quiz</button>
            </div>
          </div>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--overlay-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>Bulk import JSON</div>
                <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Accepts a managed content object, a single quiz bundle, or an array of quiz bundles. Imported quizzes overwrite matching IDs.
                </div>
              </div>
              <button className="settings-btn-ghost" onClick={bulkImportManagedContent} disabled={!bulkImportValue.trim()}>
                Import JSON
              </button>
            </div>
            <textarea
              className="admin-field-input"
              value={bulkImportValue}
              onChange={(event) => {
                setBulkImportValue(event.target.value);
                if (bulkImportError) setBulkImportError('');
              }}
              placeholder={'{\n  "id": "sample-quiz",\n  "title": "Sample Quiz",\n  "description": "Imported quiz",\n  "category": "general",\n  "difficulty": "beginner",\n  "duration": 10,\n  "icon": "book",\n  "questions": [\n    {\n      "id": "sample-q1",\n      "text": "Question text",\n      "correctOptionId": "a",\n      "options": [\n        { "id": "a", "text": "Option A" },\n        { "id": "b", "text": "Option B" }\n      ]\n    }\n  ]\n}'}
              style={{ minHeight: 220, marginTop: 14, fontFamily: 'monospace' }}
            />
            {bulkImportError ? (
              <div style={{ marginTop: 10, color: 'var(--error)', fontSize: 13 }}>{bulkImportError}</div>
            ) : null}
          </div>

          <div className="dc-grid" style={{ gridTemplateColumns: '280px 1fr', gap: 18, marginTop: 20 }}>
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              {managedQuizList.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 18, padding: 18, color: 'var(--text-secondary)' }}>
                  No managed quizzes yet.
                </div>
              ) : managedQuizList.map((quiz) => (
                <div key={quiz.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setSelectedManagedQuizId(quiz.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 14,
                      borderRadius: 18,
                      border: `1px solid ${selectedManagedQuiz?.id === quiz.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedManagedQuiz?.id === quiz.id ? 'var(--primary-light)' : 'var(--overlay-xs)',
                      color: 'var(--text)',
                    }}
                  >
                    <div style={{ fontWeight: 700, paddingRight: 28 }}>{quiz.title}</div>
                    <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{quiz.id}</div>
                    <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>{(managedQuizContent.questions[quiz.id] ?? []).length} questions{quiz.mode ? ` · ${quiz.mode.replace('_', ' ')}` : ''}</div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteManagedQuizWithConfirm(quiz.id); }}
                    title="Delete quiz"
                    style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(255,76,81,0.12)', color: 'var(--error)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {selectedManagedQuiz ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 22, color: 'var(--text)' }}>{selectedManagedQuiz.title}</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="settings-btn-ghost" onClick={() => duplicateManagedQuiz(selectedManagedQuiz.id)}>Duplicate quiz</button>
                    <button className="settings-btn-ghost" onClick={() => deleteManagedQuiz(selectedManagedQuiz.id)}>Delete quiz</button>
                  </div>
                </div>

                <div className="dc-grid" style={{ gap: 14 }}>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Quiz title</div>
                    <input className="admin-field-input" value={selectedManagedQuiz.title} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { title: event.target.value })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Quiz slug / ID</div>
                    <input className="admin-field-input" value={selectedManagedQuiz.id} onChange={(event) => renameManagedQuizId(selectedManagedQuiz.id, event.target.value)} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Description</div>
                    <textarea className="admin-field-input" value={selectedManagedQuiz.description} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { description: event.target.value })} style={{ minHeight: 90 }} />
                  </label>
                </div>

                <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Category</div>
                    {managedCategories.length > 0 ? (
                      <select
                        className="admin-field-input"
                        value={managedCategories.some((c) => c.id === selectedManagedQuiz.category) ? selectedManagedQuiz.category : '__other__'}
                        onChange={(event) => {
                          if (event.target.value !== '__other__') {
                            updateManagedQuiz(selectedManagedQuiz.id, { category: event.target.value });
                          }
                        }}
                      >
                        {managedCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        <option value="__other__">Other / custom</option>
                      </select>
                    ) : (
                      <input className="admin-field-input" value={selectedManagedQuiz.category} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { category: event.target.value })} />
                    )}
                    {managedCategories.length > 0 && !managedCategories.some((c) => c.id === selectedManagedQuiz.category) && (
                      <input
                        className="admin-field-input"
                        style={{ marginTop: 8 }}
                        placeholder="Custom category value"
                        value={selectedManagedQuiz.category}
                        onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { category: event.target.value })}
                      />
                    )}
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Difficulty</div>
                    <select className="admin-field-input" value={selectedManagedQuiz.difficulty} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { difficulty: event.target.value as Quiz['difficulty'] })}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Duration (min)</div>
                    <input className="admin-field-input" type="number" min={1} value={selectedManagedQuiz.duration} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { duration: Math.max(1, Number(event.target.value || 1)) })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Icon</div>
                    <input className="admin-field-input" value={selectedManagedQuiz.icon} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { icon: event.target.value })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Exam code</div>
                    <input className="admin-field-input" value={selectedManagedQuiz.examCode ?? ''} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { examCode: event.target.value || undefined })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Price (INR)</div>
                    <input className="admin-field-input" type="number" min={0} value={selectedManagedQuiz.price ?? 0} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { price: Math.max(0, Number(event.target.value || 0)) })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Correct answer score</div>
                    <input className="admin-field-input" type="number" value={selectedManagedQuiz.correctScore ?? 1} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { correctScore: Number(event.target.value || 0) })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Wrong answer deduction</div>
                    <input className="admin-field-input" type="number" value={selectedManagedQuiz.wrongScore ?? 0} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { wrongScore: Number(event.target.value || 0) })} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Fixed question count</div>
                    <input
                      className="admin-field-input"
                      type="number"
                      min={0}
                      value={selectedManagedQuiz.fixedQuestionCount ?? 0}
                      onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { fixedQuestionCount: Math.max(0, Number(event.target.value || 0)) })}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                    <input type="checkbox" checked={selectedManagedQuiz.isPremium} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { isPremium: event.target.checked, price: event.target.checked ? (selectedManagedQuiz.price ?? 149) : 0 })} />
                    Premium
                  </label>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                    <input type="checkbox" checked={selectedManagedQuiz.enabled ?? true} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { enabled: event.target.checked })} />
                    Visible
                  </label>
                  {selectedManagedQuiz.mode === 'exam' && (
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                      <input
                        type="checkbox"
                        checked={selectedManagedQuiz.examReviewAllowed !== false}
                        onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { examReviewAllowed: event.target.checked })}
                      />
                      Show correct answers after exam
                    </label>
                  )}
                </div>

                <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                  <label>
                    <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Quiz mode</div>
                    <select
                      className="admin-field-input"
                      value={selectedManagedQuiz.mode ?? ''}
                      onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { mode: event.target.value ? event.target.value as QuizMode : undefined })}
                    >
                      <option value="">Quiz Zone (default)</option>
                      <option value="true_false">True / False</option>
                      <option value="exam">Exam</option>
                      <option value="fun_and_learn">Fun and Learn</option>
                      <option value="guess_the_word">Guess the Word</option>
                      <option value="audio">Audio Quiz</option>
                      <option value="maths_quiz">Maths Quiz</option>
                      <option value="multi_match">Multi Match</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>Questions</h4>
                  <button className="settings-btn-ghost" onClick={() => addManagedQuestion(selectedManagedQuiz.id)}>Add question</button>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  {selectedManagedQuestions.map((question, questionIndex) => (
                    <div key={question.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--overlay-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text)' }}>Question {questionIndex + 1}</strong>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            className="settings-btn-ghost"
                            onClick={() => duplicateManagedQuestion(selectedManagedQuiz.id, question.id)}
                          >
                            Duplicate
                          </button>
                          <button
                            className="settings-btn-ghost"
                            onClick={() => moveManagedQuestion(selectedManagedQuiz.id, question.id, 'up')}
                            disabled={questionIndex === 0}
                          >
                            Move up
                          </button>
                          <button
                            className="settings-btn-ghost"
                            onClick={() => moveManagedQuestion(selectedManagedQuiz.id, question.id, 'down')}
                            disabled={questionIndex === selectedManagedQuestions.length - 1}
                          >
                            Move down
                          </button>
                          <button className="settings-btn-ghost" onClick={() => deleteManagedQuestion(selectedManagedQuiz.id, question.id)}>Delete</button>
                        </div>
                      </div>
                      <div className="dc-grid" style={{ gap: 12, marginTop: 14 }}>
                        <label>
                          <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Question ID</div>
                          <input className="admin-field-input" value={question.id} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { id: event.target.value })} />
                        </label>
                        <label>
                          <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Prompt</div>
                          <textarea className="admin-field-input" value={question.text} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { text: event.target.value })} style={{ minHeight: 90 }} />
                        </label>
                        <label>
                          <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Explanation</div>
                          <textarea className="admin-field-input" value={question.explanation ?? ''} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { explanation: event.target.value })} style={{ minHeight: 72 }} />
                        </label>
                        <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                          <label>
                            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Question difficulty</div>
                            <select
                              className="admin-field-input"
                              value={question.difficulty ?? 'beginner'}
                              onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { difficulty: event.target.value as Question['difficulty'] })}
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </label>
                          <label>
                            <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Question category</div>
                            <input
                              className="admin-field-input"
                              value={question.category ?? ''}
                              onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { category: event.target.value || undefined })}
                            />
                          </label>
                        </div>
                        <label>
                          <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Correct option</div>
                          <select className="admin-field-input" value={question.correctOptionId} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { correctOptionId: event.target.value })}>
                            {question.options.map((option) => (
                              <option key={option.id} value={option.id}>{option.id.toUpperCase()}</option>
                            ))}
                          </select>
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            {question.options.length} options
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              className="settings-btn-ghost"
                              onClick={() => applyTrueFalsePreset(selectedManagedQuiz.id, question.id)}
                            >
                              True / False
                            </button>
                            <button
                              className="settings-btn-ghost"
                              onClick={() => addManagedOption(selectedManagedQuiz.id, question.id)}
                              disabled={question.options.length >= 5}
                            >
                              Add option
                            </button>
                          </div>
                        </div>
                        <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                          {question.options.map((option) => (
                            <div key={option.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Option {option.id.toUpperCase()}</div>
                                <button
                                  className="settings-btn-ghost"
                                  onClick={() => removeManagedOption(selectedManagedQuiz.id, question.id, option.id)}
                                  disabled={question.options.length <= 2}
                                >
                                  Remove
                                </button>
                              </div>
                              <input className="admin-field-input" value={option.text} onChange={(event) => updateManagedOption(selectedManagedQuiz.id, question.id, option.id, event.target.value)} />
                            </div>
                          ))}
                        </div>

                        {/* ── Mode-specific fields ── */}
                        {(selectedManagedQuiz.mode === 'guess_the_word') && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', letterSpacing: 0.5 }}>✏️ Guess the Word</div>
                            <label>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Word Answer (correct text, case-insensitive)</div>
                              <input className="admin-field-input" value={question.wordAnswer ?? ''} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { wordAnswer: event.target.value || undefined })} placeholder="e.g. Elastic" />
                            </label>
                            <label>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Hint (optional)</div>
                              <input className="admin-field-input" value={question.hint ?? ''} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { hint: event.target.value || undefined })} placeholder="e.g. It starts with 'E'" />
                            </label>
                          </div>
                        )}

                        {(selectedManagedQuiz.mode === 'maths_quiz') && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🔢 Maths Quiz</div>
                            <label>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Numeric Answer (±0.01 tolerance)</div>
                              <input
                                type="number"
                                className="admin-field-input"
                                value={question.numericAnswer ?? ''}
                                onChange={(event) => {
                                  const v = parseFloat(event.target.value);
                                  updateManagedQuestion(selectedManagedQuiz.id, question.id, { numericAnswer: Number.isFinite(v) ? v : undefined });
                                }}
                                placeholder="e.g. 42"
                              />
                            </label>
                          </div>
                        )}

                        {(selectedManagedQuiz.mode === 'audio') && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🎧 Audio Quiz</div>
                            <label>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Audio URL</div>
                              <input className="admin-field-input" value={question.audioUrl ?? ''} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { audioUrl: event.target.value || undefined })} placeholder="https://…/audio.mp3" />
                            </label>
                            <label>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Fallback Text (when audio unavailable)</div>
                              <input className="admin-field-input" value={question.audioFallbackText ?? ''} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { audioFallbackText: event.target.value || undefined })} placeholder="Description of the audio content" />
                            </label>
                          </div>
                        )}

                        {(selectedManagedQuiz.mode === 'multi_match') && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🔗 Match Pairs</div>
                              <button
                                className="settings-btn-ghost"
                                onClick={() => {
                                  const newPair: MatchPair = { id: generateMatchPairId(), left: '', right: '' };
                                  updateManagedQuestion(selectedManagedQuiz.id, question.id, {
                                    matchPairs: [...(question.matchPairs ?? []), newPair],
                                  });
                                }}
                              >
                                + Add Pair
                              </button>
                            </div>
                            {(question.matchPairs ?? []).map((pair, pairIdx) => (
                              <div key={pair.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 24 }}>#{pairIdx + 1}</div>
                                <input
                                  className="admin-field-input"
                                  placeholder="Left"
                                  value={pair.left}
                                  onChange={(event) => {
                                    const next = (question.matchPairs ?? []).map((p) => p.id === pair.id ? { ...p, left: event.target.value } : p);
                                    updateManagedQuestion(selectedManagedQuiz.id, question.id, { matchPairs: next });
                                  }}
                                  style={{ flex: 1 }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 16 }}>→</span>
                                <input
                                  className="admin-field-input"
                                  placeholder="Right"
                                  value={pair.right}
                                  onChange={(event) => {
                                    const next = (question.matchPairs ?? []).map((p) => p.id === pair.id ? { ...p, right: event.target.value } : p);
                                    updateManagedQuestion(selectedManagedQuiz.id, question.id, { matchPairs: next });
                                  }}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  className="settings-btn-ghost"
                                  onClick={() => {
                                    const next = (question.matchPairs ?? []).filter((p) => p.id !== pair.id);
                                    updateManagedQuestion(selectedManagedQuiz.id, question.id, { matchPairs: next.length > 0 ? next : undefined });
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            {(question.matchPairs ?? []).length === 0 && (
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No pairs yet. Click "+ Add Pair" to add match pairs.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedManagedQuestions.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border)', borderRadius: 18, padding: 16, color: 'var(--text-secondary)' }}>
                      Add at least one question before saving this quiz.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div style={{ border: '1px dashed var(--border)', borderRadius: 18, padding: 18, color: 'var(--text-secondary)' }}>
                Select a managed quiz or create a new one.
              </div>
            )}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>System features</h2>
          <p className="dc-section-subtitle">Daily quiz and shared quiz behavior controls.</p>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={systemFeatures.dailyQuizEnabled}
                onChange={(event) => setSystemFeatures((prev) => ({ ...prev, dailyQuizEnabled: event.target.checked }))}
              />
              Enable Daily Quiz
            </label>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Daily quiz label</div>
              <input
                className="admin-field-input"
                value={systemFeatures.dailyQuizLabel}
                onChange={(event) => setSystemFeatures((prev) => ({ ...prev, dailyQuizLabel: event.target.value }))}
              />
            </label>
            <label>
              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Featured daily quiz</div>
              <select
                className="admin-field-input"
                value={systemFeatures.dailyQuizQuizId}
                onChange={(event) => setSystemFeatures((prev) => ({ ...prev, dailyQuizQuizId: event.target.value }))}
              >
                <option value="">Select a quiz</option>
                {dailyQuizCatalog.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                    {quiz.enabled === false ? ' [disabled]' : ''}
                    {quiz.isPremium ? ' [premium]' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--overlay-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Daily quiz preview
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>
                    {resolvedDailyQuiz?.title ?? 'No daily quiz will be shown'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    className="dc-chip"
                    style={{
                      background: dailyQuizFallsBack ? 'rgba(255, 216, 77, 0.16)' : 'rgba(81, 207, 102, 0.16)',
                      color: dailyQuizFallsBack ? 'var(--color-xp)' : 'var(--platform-success-accent)',
                    }}
                  >
                    {dailyQuizFallsBack ? 'Fallback rotation active' : 'Selection valid'}
                  </span>
                  {dailyQuizIsPremium ? (
                    <span className="dc-chip" style={{ background: 'rgba(255, 216, 77, 0.16)', color: 'var(--color-xp)' }}>
                      Premium daily quiz
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                {!systemFeatures.dailyQuizEnabled
                  ? 'Daily quiz is disabled. Home and discovery surfaces will not feature a quiz until this is turned back on.'
                  : dailyQuizFallsBack
                    ? 'The selected quiz is missing or disabled, so the app will rotate across visible non-premium quizzes for today instead.'
                    : dailyQuizIsPremium
                      ? 'A premium quiz is configured as the daily quiz. This is allowed, but it can turn the featured daily slot into a paywall unless the user has access.'
                    : configuredDailyQuiz
                      ? `Configured quiz ID: ${configuredDailyQuiz.id}${configuredDailyQuiz.isPremium ? ' · premium quiz selected' : ''}`
                      : 'No specific quiz selected. The app will rotate across visible non-premium quizzes by date.'}
              </div>
              {resolvedDailyQuiz ? (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--overlay-xs)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Resolved daily target
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text)', fontWeight: 700 }}>{resolvedDailyQuiz.title}</div>
                  <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                    {resolvedDailyQuiz.id} · source: {resolvedDailyQuizSource}
                  </div>
                </div>
              ) : null}
            </div>
            <div style={{ padding: 14, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--overlay-xs)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Daily quiz analytics
              </div>
              {dailyAnalytics === null ? (
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Loading analytics…
                </div>
              ) : !dailyAnalytics.dailyEnabled || !dailyAnalytics.quizId ? (
                <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Daily quiz is disabled — enable it above to start tracking attempts.
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--overlay-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Attempts</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{dailyAnalytics.attempts}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--overlay-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Completions</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{dailyAnalytics.completions}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--overlay-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Completion rate</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{Math.round(dailyAnalytics.completionRate * 100)}%</div>
                  </div>
                  {dailyAnalytics.lastUpdated ? (
                    <div style={{ gridColumn: '1 / -1', marginTop: 2, color: 'var(--text-secondary)', fontSize: 12 }}>
                      Quiz: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{dailyAnalytics.quizId}</span>
                      {' · '}Last submission: {new Date(dailyAnalytics.lastUpdated).toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ gridColumn: '1 / -1', marginTop: 2, color: 'var(--text-secondary)', fontSize: 12 }}>
                      Quiz: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{dailyAnalytics.quizId}</span>
                      {' · '}No submissions yet
                    </div>
                  )}
                </div>
              )}
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={systemFeatures.answerReviewEnabled}
                onChange={(event) => setSystemFeatures((prev) => ({ ...prev, answerReviewEnabled: event.target.checked }))}
              />
              Enable answer review
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={systemFeatures.optionEEnabled}
                onChange={(event) => setSystemFeatures((prev) => ({ ...prev, optionEEnabled: event.target.checked }))}
              />
              Enable option E
            </label>

            {/* ── Hidden features — feature flag log ─────────────────────── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4, display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Hidden Features</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Toggle features that have been temporarily hidden. Off = hidden from all users.
              </div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={systemFeatures.leaderboardEnabled}
                  onChange={(event) => setSystemFeatures((prev) => ({ ...prev, leaderboardEnabled: event.target.checked }))}
                />
                Leaderboard — hidden 2026-04-09 (pending data quality review)
              </label>
            </div>

            {/* ── Maintenance mode ───────────────────────────────────────── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4, display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Maintenance Mode</div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={systemFeatures.maintenanceMode}
                  onChange={(event) => setSystemFeatures((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
                />
                Enable maintenance mode (blocks all dashboard access on web + mobile)
              </label>
              <label>
                <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Maintenance message</div>
                <textarea
                  className="admin-field-input"
                  value={systemFeatures.maintenanceMessage}
                  onChange={(event) => setSystemFeatures((prev) => ({ ...prev, maintenanceMessage: event.target.value }))}
                  style={{ minHeight: 72 }}
                />
              </label>
            </div>

            {/* ── Force update ───────────────────────────────────────────── */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4, display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Force Update</div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={systemFeatures.forceUpdateEnabled}
                  onChange={(event) => setSystemFeatures((prev) => ({ ...prev, forceUpdateEnabled: event.target.checked }))}
                />
                Enable force update (blocks users below minimum version)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Minimum app version</div>
                  <input
                    className="admin-field-input"
                    value={systemFeatures.minimumAppVersion}
                    onChange={(event) => setSystemFeatures((prev) => ({ ...prev, minimumAppVersion: event.target.value }))}
                    placeholder="1.0.0"
                  />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Current app version</div>
                  <input
                    className="admin-field-input"
                    value={systemFeatures.currentAppVersion}
                    onChange={(event) => setSystemFeatures((prev) => ({ ...prev, currentAppVersion: event.target.value }))}
                    placeholder="1.0.0"
                  />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>App Store URL (iOS)</div>
                  <input
                    className="admin-field-input"
                    value={systemFeatures.appStoreUrl}
                    onChange={(event) => setSystemFeatures((prev) => ({ ...prev, appStoreUrl: event.target.value }))}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Play Store URL (Android)</div>
                  <input
                    className="admin-field-input"
                    value={systemFeatures.playStoreUrl}
                    onChange={(event) => setSystemFeatures((prev) => ({ ...prev, playStoreUrl: event.target.value }))}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Managed content</h2>
          <p className="dc-section-subtitle">
            These sections reflect on the website public pages and the Expo app screens.
          </p>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {managedContentFields.map((field) => (
              <label key={field.key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{field.label}</div>
                {field.multiline ? (
                  <textarea
                    className="admin-field-input"
                    value={appContent[field.key]}
                    onChange={(event) => setAppContent((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    style={{ minHeight: 140 }}
                  />
                ) : (
                  <input
                    className="admin-field-input"
                    value={appContent[field.key]}
                    onChange={(event) => setAppContent((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 className="dc-section-title" style={{ fontSize: 28 }}>Category management</h2>
              <p className="dc-section-subtitle">Create categories and subcategories to organise quizzes in the mobile app and web portal.</p>
            </div>
            <button className="btn-primary" onClick={saveCategories} style={{ whiteSpace: 'nowrap' }}>
              {categoriesSaved ? 'Saved ✓' : 'Save categories'}
            </button>
          </div>

          <div className="dc-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
            {/* Add category form */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--overlay-xs)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Add category</div>
              <div className="dc-grid" style={{ gap: 10 }}>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Name</div>
                  <input className="admin-field-input" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Cloud Fundamentals" />
                </label>
                <label>
                  <div style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13 }}>Description (optional)</div>
                  <input className="admin-field-input" value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)} placeholder="Short description" />
                </label>
              </div>
              <button className="settings-btn-ghost" style={{ marginTop: 12 }} onClick={addCategory} disabled={!newCategoryName.trim()}>
                Add category
              </button>
            </div>

            {/* Category list */}
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              {managedCategories.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 18, padding: 18, color: 'var(--text-secondary)' }}>
                  No categories yet. Add one on the left.
                </div>
              ) : managedCategories.map((cat) => (
                <div key={cat.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--overlay-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                      <div style={{ marginTop: 2, color: 'var(--text-secondary)', fontSize: 12 }}>{cat.id}</div>
                      {cat.description ? <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{cat.description}</div> : null}
                    </div>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      style={{ height: 30, padding: '0 10px', borderRadius: 8, border: 'none', background: 'rgba(255,76,81,0.12)', color: 'var(--error)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Subcategories */}
                  {(cat.subcategories ?? []).length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(cat.subcategories ?? []).map((sub) => (
                        <span key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary-text)', fontSize: 12, fontWeight: 600 }}>
                          {sub.name}
                          <button
                            onClick={() => deleteSubcategory(cat.id, sub.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12, padding: 0, lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add subcategory */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="admin-field-input"
                      style={{ flex: 1, fontSize: 12 }}
                      placeholder="New subcategory name"
                      value={newSubcategoryInputs[cat.id]?.name ?? ''}
                      onChange={(e) => setNewSubcategoryInputs((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value, description: prev[cat.id]?.description ?? '' } }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addSubcategory(cat.id); }}
                    />
                    <button
                      className="settings-btn-ghost"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => addSubcategory(cat.id)}
                      disabled={!(newSubcategoryInputs[cat.id]?.name.trim())}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dc-settings-grid">
        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Color controls</h2>
          <div className="dc-grid" style={{ gap: 14, marginTop: 20 }}>
            {[
              ['Hero course surface', 'homeHeroCourseBg'],
              ['Premium accent', 'premiumAccent'],
              ['Profile offer accent', 'profileOfferAccent'],
              ['Hero gradient from', 'heroGradientFrom'],
              ['Hero gradient to', 'heroGradientTo'],
              ['Hero gradient accent', 'heroGradientAccent'],
            ].map(([label, key]) => (
              <label key={key}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
                <input
                  className="admin-field-input"
                  value={config.colors[key as keyof PlatformExperienceConfig['colors']] as string}
                  onChange={(event) => setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: event.target.value } }))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="dc-card" style={{ padding: 24 }}>
          <h2 className="dc-section-title" style={{ fontSize: 28 }}>Widget visibility</h2>
          <div className="dc-grid" style={{ gap: 12, marginTop: 20 }}>
            {Object.entries(config.widgets).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(event) => setConfig((prev) => ({ ...prev, widgets: { ...prev.widgets, [key]: event.target.checked } }))}
                />
                {key}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={saveConfig}>{saved ? 'Saved' : 'Save platform config'}</button>
          <button className="settings-btn-ghost" onClick={() => setConfig(DEFAULT_PLATFORM_EXPERIENCE)}>Reset defaults</button>
          <span style={{ color: 'var(--text-secondary)' }}>These settings feed the shared platform config used by web and mobile.</span>
        </div>
      </section>

      {/* ── Contests ──────────────────────────────────────────────────────── */}
      <section className="dc-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 className="dc-section-title" style={{ fontSize: 20, marginBottom: 4 }}>Contests</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>Manage live, upcoming, and past contests shown to users.</p>
          </div>
          {contestsSaved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Saved</span>}
        </div>

        {/* Existing contests list */}
        {contests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {contests.map((contest) => {
              const badge = STATUS_BADGE_COLORS[contest.status];
              return (
                <div key={contest.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {contest.status}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contest.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {new Date(contest.startTime).toLocaleDateString()} – {new Date(contest.endTime).toLocaleDateString()} · Fee: {contest.entryFee} coins · Prize: {contest.prizeCoins} coins · {contest.participants}/{contest.maxParticipants} participants
                    </div>
                  </div>
                  <button onClick={() => startEditContest(contest)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => setPendingDeleteContestId(contest.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#FF4C5114', color: 'var(--error)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit form */}
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
            {editingContestId ? 'Edit Contest' : 'Add Contest'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'ID (slug)', key: 'id', type: 'text' },
              { label: 'Title', key: 'title', type: 'text' },
              { label: 'Description', key: 'description', type: 'text' },
              { label: 'Entry Fee (coins)', key: 'entryFee', type: 'number' },
              { label: 'Prize Coins', key: 'prizeCoins', type: 'number' },
              { label: 'Max Participants', key: 'maxParticipants', type: 'number' },
              { label: 'Icon (Feather name)', key: 'icon', type: 'text' },
              { label: 'Category', key: 'category', type: 'text' },
              { label: 'Quiz Title', key: 'quizTitle', type: 'text' },
              { label: 'Start Time', key: 'startTime', type: 'datetime-local' },
              { label: 'End Time', key: 'endTime', type: 'datetime-local' },
              { label: 'Max Attempts', key: 'maxAttempts', type: 'number' },
            ].map(({ label, key, type }) => (
              <label key={key}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</div>
                <input
                  className="admin-field-input"
                  type={type}
                  value={String(contestForm[key as keyof typeof contestForm] ?? '')}
                  disabled={key === 'id' && !!editingContestId}
                  onChange={(e) => setContestForm((prev) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                />
              </label>
            ))}
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Rules</div>
              <textarea
                className="admin-field-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                value={String(contestForm.rules ?? '')}
                onChange={(e) => setContestForm((prev) => ({ ...prev, rules: e.target.value }))}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Status</div>
              <select
                className="admin-field-input"
                value={contestForm.status ?? 'upcoming'}
                onChange={(e) => setContestForm((prev) => ({ ...prev, status: e.target.value as ContestStatus }))}
              >
                <option value="live">Live</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>Quiz ID</div>
              <select
                className="admin-field-input"
                value={contestForm.quizId ?? ''}
                onChange={(e) => {
                  const q = managedQuizList.find((mq) => mq.id === e.target.value) ?? quizzes.find((mq) => mq.id === e.target.value);
                  setContestForm((prev) => ({ ...prev, quizId: e.target.value, quizTitle: q?.title ?? prev.quizTitle ?? '' }));
                }}
              >
                <option value="">— select quiz —</option>
                {[...quizzes, ...managedQuizList.filter((mq) => !quizzes.some((q) => q.id === mq.id))].map((q) => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn-primary" onClick={handleContestFormSubmit}>
              {editingContestId ? 'Update Contest' : 'Add Contest'}
            </button>
            {editingContestId && (
              <button className="settings-btn-ghost" onClick={() => {
                setEditingContestId(null);
                setContestForm({
                  id: '', title: '', description: '', status: 'upcoming', quizId: '', quizTitle: '',
                  category: 'general', icon: 'award', entryFee: 0, prizeCoins: 0,
                  startTime: '', endTime: '', participants: 0, maxParticipants: 100,
                });
              }}>Cancel</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Coin Store ──────────────────────────────────────────────────────── */}
      <section className="dc-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 className="dc-section-title" style={{ fontSize: 20, marginBottom: 4 }}>Coin Store</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>Manage coin packs available for purchase in the store.</p>
          </div>
          {coinPacksSaved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Saved</span>}
        </div>

        {/* IAP compliance note */}
        <div style={{ padding: '12px 16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          ℹ️ <strong>Store compliance note:</strong> Mobile digital goods (coin packs, remove ads, subscriptions) require App Store / Play Store In-App Purchase integration. Web payments via Razorpay/Stripe remain available for web users.
        </div>

        {/* Existing packs list */}
        {coinPacks.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {coinPacks.map((pack) => (
              <div key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{pack.label}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {pack.coins.toLocaleString()} coins · ₹{pack.priceInr} / ${pack.priceUsd} USD
                    {pack.popular ? <span style={{ marginLeft: 6, background: '#FF9F4322', color: 'var(--warning)', fontWeight: 700, fontSize: 10, padding: '1px 7px', borderRadius: 10 }}>Popular</span> : null}
                    {!pack.enabled ? <span style={{ marginLeft: 6, background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 10, padding: '1px 7px', borderRadius: 10 }}>Disabled</span> : null}
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={pack.enabled}
                    onChange={() => setCoinPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, enabled: !p.enabled } : p))}
                  />
                  Enabled
                </label>
                {pendingDeletePackId === pack.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
                      onClick={() => {
                        setCoinPacks((prev) => prev.filter((p) => p.id !== pack.id));
                        setPendingDeletePackId(null);
                      }}
                    >Confirm delete</button>
                    <button
                      style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                      onClick={() => setPendingDeletePackId(null)}
                    >Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setPendingDeletePackId(pack.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#FF4C5114', color: 'var(--error)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add pack form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
          {([
            { key: 'label'   as const, label: 'Label',       type: 'text',   value: newPackForm.label },
            { key: 'coins'   as const, label: 'Coins',       type: 'number', value: String(newPackForm.coins) },
            { key: 'priceInr'as const, label: 'Price INR',   type: 'number', value: String(newPackForm.priceInr) },
            { key: 'priceUsd'as const, label: 'Price USD',   type: 'number', value: String(newPackForm.priceUsd) },
          ]).map(({ key, label, type, value }) => (
            <label key={key}>
              <div style={{ marginBottom: 5, color: 'var(--text-secondary)', fontSize: 12 }}>{label}</div>
              <input
                type={type}
                className="admin-field-input"
                value={value}
                onChange={(e) => setNewPackForm((prev) => ({
                  ...prev,
                  [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                }))}
              />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={newPackForm.popular ?? false} onChange={(e) => setNewPackForm((prev) => ({ ...prev, popular: e.target.checked }))} />
            Popular
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={newPackForm.enabled} onChange={(e) => setNewPackForm((prev) => ({ ...prev, enabled: e.target.checked }))} />
            Enabled
          </label>
          <button
            className="settings-btn-ghost"
            onClick={() => {
              if (!newPackForm.label.trim() || newPackForm.coins <= 0) return;
              const id = newPackForm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `pack-${Date.now()}`;
              const uniqueId = coinPacks.some((p) => p.id === id) ? `${id}-${Date.now()}` : id;
              setCoinPacks((prev) => [...prev, { ...newPackForm, id: uniqueId }]);
              setNewPackForm({ label: '', coins: 100, priceInr: 99, priceUsd: 1.19, popular: false, enabled: true });
            }}
          >
            + Add Pack
          </button>
        </div>

        <button
          className="btn-primary"
          onClick={async () => {
            try {
              const res = await fetch('/api/admin/coin-packs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ packs: coinPacks }),
              });
              const body = await res.json() as { ok?: boolean };
              if (body.ok) { setCoinPacksSaved(true); setTimeout(() => setCoinPacksSaved(false), 2000); }
            } catch { /* non-fatal */ }
          }}
        >
          Save Coin Packs
        </button>
      </section>
    </div>
  );
}
