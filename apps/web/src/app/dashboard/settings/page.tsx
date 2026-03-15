'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { quizQuestions, quizzes } from '@/data/quizzes';
import { DEFAULT_APP_CONTENT, normalizeAppContent, type AppContentConfig } from '@/lib/appContent';
import { applyQuizCatalogOverrides, normalizeQuizCatalogOverrides, type QuizCatalogOverrides } from '@/lib/quizCatalog';
import { PLATFORM_THEME_PRESETS, applyPlatformThemePreset } from '@/lib/platformTheme';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import {
  applyManagedQuizContent,
  normalizeManagedQuizContent,
  type ManagedQuizContent,
} from '@/lib/managedQuizContent';
import type { Question, Quiz } from '@/types';
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
        router.replace('/dashboard');
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

        const [configRes, quizCatalogRes, appContentRes, systemFeaturesRes, quizContentRes] = await Promise.all([
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
        ]);
        const configBody = await configRes.json() as { config?: unknown };
        const quizCatalogBody = await quizCatalogRes.json() as { overrides?: unknown };
        const appContentBody = await appContentRes.json() as { content?: unknown };
        const systemFeaturesBody = await systemFeaturesRes.json() as { config?: unknown };
        const quizContentBody = await quizContentRes.json() as { content?: unknown };
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
      } catch {
        router.replace('/dashboard');
      }
    });
  }, [router]);

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

  if (!authorized) return null;

  return (
    <div className="page-content dc-shell">
      <section className="dc-hero" style={{ padding: 30 }}>
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
                  background: config.theme.platformPreset === preset.id ? 'var(--primary-light)' : 'rgba(255,255,255,0.02)',
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
                <div key={quiz.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.02)' }}>
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

          <div style={{ marginTop: 18, padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
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
              <div style={{ marginTop: 10, color: '#ff8e8e', fontSize: 13 }}>{bulkImportError}</div>
            ) : null}
          </div>

          <div className="dc-grid" style={{ gridTemplateColumns: '280px 1fr', gap: 18, marginTop: 20 }}>
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              {managedQuizList.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 18, padding: 18, color: 'var(--text-secondary)' }}>
                  No managed quizzes yet.
                </div>
              ) : managedQuizList.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => setSelectedManagedQuizId(quiz.id)}
                  style={{
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 18,
                    border: `1px solid ${selectedManagedQuiz?.id === quiz.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedManagedQuiz?.id === quiz.id ? 'var(--primary-light)' : 'rgba(255,255,255,0.02)',
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{quiz.title}</div>
                  <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{quiz.id}</div>
                  <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>{(managedQuizContent.questions[quiz.id] ?? []).length} questions</div>
                </button>
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
                    <input className="admin-field-input" value={selectedManagedQuiz.category} onChange={(event) => updateManagedQuiz(selectedManagedQuiz.id, { category: event.target.value })} />
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>Questions</h4>
                  <button className="settings-btn-ghost" onClick={() => addManagedQuestion(selectedManagedQuiz.id)}>Add question</button>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  {selectedManagedQuestions.map((question, questionIndex) => (
                    <div key={question.id} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text)' }}>Question {questionIndex + 1}</strong>
                        <button className="settings-btn-ghost" onClick={() => deleteManagedQuestion(selectedManagedQuiz.id, question.id)}>Delete</button>
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
                        <label>
                          <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Correct option</div>
                          <select className="admin-field-input" value={question.correctOptionId} onChange={(event) => updateManagedQuestion(selectedManagedQuiz.id, question.id, { correctOptionId: event.target.value })}>
                            {question.options.map((option) => (
                              <option key={option.id} value={option.id}>{option.id.toUpperCase()}</option>
                            ))}
                          </select>
                        </label>
                        <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                          {question.options.map((option) => (
                            <label key={option.id}>
                              <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 13 }}>Option {option.id.toUpperCase()}</div>
                              <input className="admin-field-input" value={option.text} onChange={(event) => updateManagedOption(selectedManagedQuiz.id, question.id, option.id, event.target.value)} />
                            </label>
                          ))}
                        </div>
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
                {quizzes.filter((quiz) => (quizOverrides[quiz.id]?.enabled ?? quiz.enabled ?? true)).map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </select>
            </label>
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
    </div>
  );
}
