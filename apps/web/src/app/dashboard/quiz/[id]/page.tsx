'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { useSubscription } from '@/hooks/useSubscription';
import { AdBanner } from '@/components/AdBanner';
import type { QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { getQuizResults } from '@/lib/db';
import { usePlatformExperience } from '@/components/PlatformExperienceProvider';
import { usePayment } from '@/hooks/usePayment';
import type { PaymentSuccessResult, Gateway } from '@/hooks/usePayment';
import { useManagedQuizContentVersion } from '@/components/ManagedQuizContentProvider';
import { DEFAULT_SYSTEM_FEATURES, resolveDailyQuiz, type SystemFeaturesConfig } from '@/lib/systemFeatures';

const DIFF_COLOR: Record<string, string> = { beginner: '#28C76F', intermediate: '#FF9F43', advanced: '#FF4C51' };
const CERT_COLOR: Record<string, string> = {
  foundational: '#28C76F', associate: '#00BAD1', professional: '#FF9F43', specialty: '#7367F0',
};
const Q_TIME = 30;

type Phase = 'intro' | 'quiz' | 'results' | 'upsell';
type PaywallTab = 'course' | 'pro';
type GatewayTab = 'razorpay' | 'stripe';

interface UpsellConfig {
  freeLimit:      number;
  headline:       string;
  subtext:        string;
  proCtaLabel:    string;
  courseCtaLabel: string;
  skipCtaLabel:   string;
}
const DEFAULT_UPSELL: UpsellConfig = {
  freeLimit: 25,
  headline: "You've completed the free preview — {n} questions",
  subtext: 'Unlock all {remaining} remaining questions, deeper explanations, and the full certification path. Current score: {score}.',
  proCtaLabel: 'Unlock all {total} questions',
  courseCtaLabel: 'Unlock this course for ₹{price}',
  skipCtaLabel: 'Browse other quizzes',
};
function interpolate(tpl: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v), tpl);
}
// ─────────────────────────────────────────────────────────────────────────────

function saveResultLocally(result: QuizResult) {
  try {
    const prev: QuizResult[] = JSON.parse(localStorage.getItem('quiz-results') || '[]');
    const next = [...prev.filter((r) => r.quizId !== result.quizId), result];
    localStorage.setItem('quiz-results', JSON.stringify(next));
  } catch {}
}

// SVGs
const CheckSvg = ({ color = '#28C76F' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const QuestionSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ClockSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const StarSvg = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FF9F43' : 'none'} stroke="#FF9F43" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const UsersSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const PlaySvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const LayersSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);

export default function QuizPage() {
  useManagedQuizContentVersion();
  const { config: platformConfig } = usePlatformExperience();
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const quiz      = quizzes.find((q) => q.id === id);
  const questions = quizQuestions[id ?? ''] ?? [];

  const [phase,       setPhase]       = useState<Phase>('intro');
  const [idx,         setIdx]         = useState(0);
  const [answers,     setAnswers]     = useState<Record<string, string>>({});
  const [feedback,    setFeedback]    = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(Q_TIME);
  const [score,       setScore]       = useState(0);
  const [pointScore,  setPointScore]  = useState(0);
  const [showPaywall,   setShowPaywall]  = useState(false);
  const [paywallTab,    setPaywallTab]   = useState<PaywallTab>('course');
  const [gatewayTab,    setGatewayTab]   = useState<GatewayTab>('razorpay');
  const [paymentError,  setPaymentError] = useState('');
  const [countryCode,   setCountryCode]  = useState<string>('IN');
  const [authUserId,      setAuthUserId]      = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<typeof questions>([]);
  const [upsellCfg,       setUpsellCfg]       = useState<UpsellConfig>(DEFAULT_UPSELL);
  const [studentCount,    setStudentCount]    = useState<number | null>(null);
  const [systemFeatures,  setSystemFeatures]  = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizStartTs = useRef<number>(0); // unix ms when quiz started
  const { isPro, unlockedCourses, canAccess, upgradeToPremium, unlockCourse } = useSubscription();
  const correctPoints = quiz?.correctScore ?? 1;
  const wrongPoints = quiz?.wrongScore ?? 0;
  const fixedQuestionCount = Math.max(0, quiz?.fixedQuestionCount ?? 0);
  const questionPool = useMemo(
    () => (fixedQuestionCount > 0 ? questions.slice(0, Math.min(fixedQuestionCount, questions.length)) : questions),
    [fixedQuestionCount, questions],
  );

  const onPaymentSuccess = useCallback((result: PaymentSuccessResult) => {
    setShowPaywall(false);
    setPaymentError('');
    if (result.purchaseType === 'subscription') {
      upgradeToPremium(result.plan);
    } else if (result.purchaseType === 'course' && result.courseId) {
      unlockCourse(result.courseId);
    }
    // If user was at upsell checkpoint, advance to full quiz
    if (phase === 'upsell') startQuiz(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, upgradeToPremium, unlockCourse]);

  const { initiatePayment, loading: paymentLoading } = usePayment({
    onSuccess: onPaymentSuccess,
    onError:   (msg) => setPaymentError(msg),
  });

  // Detect country → set default gateway
  useEffect(() => {
    fetch('/api/payment/country')
      .then((r) => r.json())
      .then((d: { country?: string }) => {
        const code = d.country ?? 'IN';
        setCountryCode(code);
        setGatewayTab(code === 'IN' ? 'razorpay' : 'stripe');
      })
      .catch(() => {}); // best-effort
  }, []);

  // Whether this user is on the free tier for this quiz
  const isFreeUser = !isPro && !unlockedCourses.includes(id ?? '');

  useEffect(() => {
    setUpsellCfg({
      freeLimit: platformConfig.layout.paywallFreeLimit,
      headline: platformConfig.copy.paywallHeadline,
      subtext: platformConfig.copy.paywallSubtext,
      proCtaLabel: platformConfig.copy.paywallProCta,
      courseCtaLabel: platformConfig.copy.paywallCourseCta,
      skipCtaLabel: platformConfig.copy.paywallSkipCta,
    });
  }, [platformConfig]);

  useEffect(() => {
    fetch('/api/system-features')
      .then((response) => response.json() as Promise<{ config?: SystemFeaturesConfig }>)
      .then((body) => setSystemFeatures(body.config ?? DEFAULT_SYSTEM_FEATURES))
      .catch(() => setSystemFeatures(DEFAULT_SYSTEM_FEATURES));
  }, []);

  // Fetch real student count for this quiz
  useEffect(() => {
    if (!id) return;
    fetch(`/api/quizzes/stats?quiz_id=${id}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; studentCount?: number }) => {
        if (d.ok && typeof d.studentCount === 'number') setStudentCount(d.studentCount);
      })
      .catch(() => { /* best-effort */ });
  }, [id]);

  // Resolve auth userId + load prior result from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthUserId(user.id);
      const supabaseResults = await getQuizResults(user.id);
      if (supabaseResults.length > 0) {
        // Merge Supabase results into localStorage so downstream reads stay consistent
        try {
          const prev: QuizResult[] = JSON.parse(localStorage.getItem('quiz-results') || '[]');
          const merged = [
            ...prev.filter((r) => !supabaseResults.find((s) => s.quizId === r.quizId)),
            ...supabaseResults,
          ];
          localStorage.setItem('quiz-results', JSON.stringify(merged));
        } catch { /* best-effort */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentQ = activeQuestions[idx];
  const isLast   = idx === activeQuestions.length - 1;
  const dailyQuiz = useMemo(() => resolveDailyQuiz(systemFeatures, quizzes.filter((item) => item.enabled !== false)), [systemFeatures]);
  const isDailyQuiz = dailyQuiz?.id === quiz?.id;
  const isTrueFalseQuiz = questionPool.length > 0 && questionPool.every((question) => question.options.length === 2);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase !== 'quiz' || feedback) { stopTimer(); return; }
    setTimeLeft(Q_TIME);
    timerRef.current = setInterval(() => setTimeLeft((t) => {
      if (t <= 1) { stopTimer(); void handleNext(); return Q_TIME; }
      return t - 1;
    }), 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, feedback]);

  const handleAnswer = (optionId: string) => {
    if (feedback) return;
    stopTimer();
    setAnswers((a) => ({ ...a, [currentQ.id]: optionId }));
    if (optionId === currentQ.correctOptionId) {
      setScore((s) => s + 1);
      setPointScore((s) => s + correctPoints);
    } else {
      setPointScore((s) => s + wrongPoints);
    }
    setFeedback(true);
  };

  const handleNext = async () => {
    setFeedback(false);
    if (isLast) {
      const finalScore = Object.keys(answers).reduce((s, qId) => {
        const q = activeQuestions.find((q) => q.id === qId);
        return q && answers[qId] === q.correctOptionId ? s + 1 : s;
      }, 0);
      const finalPointScore = Object.entries(answers).reduce((sum, [qId, answer]) => {
        const q = activeQuestions.find((question) => question.id === qId);
        if (!q) return sum;
        return sum + (answer === q.correctOptionId ? correctPoints : wrongPoints);
      }, 0);
      const startedAt = quizStartTs.current > 0
        ? new Date(quizStartTs.current).toISOString()
        : new Date().toISOString();

      // Submit server-side for validation + score calculation
      let serverScore = finalScore;
      let serverPointScore = finalPointScore;
      let serverTimeTaken = quizStartTs.current > 0
        ? Math.round((Date.now() - quizStartTs.current) / 1000) : 0;
      let serverCompletedAt = new Date().toISOString();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const res = await fetch('/api/quiz-submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ quizId: id!, answers, startedAt }),
          });
          if (res.ok) {
            const d = await res.json() as { ok: boolean; score: number; pointScore?: number; totalQuestions: number; timeTaken: number; completedAt: string };
            if (d.ok) {
              serverScore       = d.score;
              serverPointScore  = d.pointScore ?? serverPointScore;
              serverTimeTaken   = d.timeTaken;
              serverCompletedAt = d.completedAt;
            }
          }
        } catch { /* best-effort — still show results */ }
      }

      const result: QuizResult = {
        quizId:         id!,
        score:          serverScore,
        totalQuestions: activeQuestions.length,
        timeTaken:      serverTimeTaken,
        answers,
        completedAt:    serverCompletedAt,
      };
      saveResultLocally(result);
      setScore(serverScore);
      setPointScore(serverPointScore);
      // Free users who only saw the limited set → upsell; everyone else → results
      const hitFreeLimit = isFreeUser && questionPool.length > activeQuestions.length;
      setPhase(hitFreeLimit ? 'upsell' : 'results');
    } else {
      setIdx((i) => i + 1);
    }
  };

  const startQuiz = (forceAllQuestions = false) => {
    // Free users get a random subset; Pro / unlocked users get every question
    const shouldLimit = !forceAllQuestions && isFreeUser && questionPool.length > upsellCfg.freeLimit;
    let qs = questionPool;
    if (shouldLimit) {
      // Fisher-Yates shuffle → take first freeLimit
      const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
      qs = shuffled.slice(0, upsellCfg.freeLimit);
    }
    setActiveQuestions(qs);
    quizStartTs.current = Date.now();
    setIdx(0); setAnswers({}); setFeedback(false); setScore(0); setPointScore(0); setPhase('quiz');
  };

  // ── Payment handlers ──────────────────────────────────────────────────────

  const handleCourseUnlock = (gateway?: Gateway) => {
    if (!quiz?.price || !id) return;
    setPaymentError('');
    const gw: Gateway = gateway ?? gatewayTab;
    void initiatePayment({ type: 'course', courseId: id }, gw, id);
  };

  const handleSubscription = (plan: 'annual' | 'monthly', gateway?: Gateway) => {
    setPaymentError('');
    const gw: Gateway = gateway ?? gatewayTab;
    void initiatePayment({ type: 'subscription', plan }, gw, id);
  };

  if (!quiz || questionPool.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Quiz not found</h2>
        <button onClick={() => router.push('/dashboard/quizzes')} className="btn-primary">Back to Quizzes</button>
      </div>
    );
  }


  const accent = quiz.certLevel ? CERT_COLOR[quiz.certLevel] : (DIFF_COLOR[quiz.difficulty] ?? '#7367F0');
  const diffStars = { beginner: 1, intermediate: 2, advanced: 3 }[quiz.difficulty] ?? 1;

  // ── INTRO (Course landing page) ───────────────────────────────────────────
  if (phase === 'intro') {
    const catLabel = quiz.examCode ?? (quiz.category.charAt(0).toUpperCase() + quiz.category.slice(1).replace('-', ' '));
    const isPremiumLocked = quiz.isPremium && !canAccess(quiz.id);

    return (
      <div className="course-lp">
        {/* Back */}
        <div className="course-lp-back">
          <button onClick={() => router.back()} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Courses
          </button>
        </div>

        {/* Hero banner */}
        <div className="course-hero" style={{ background: accent + '10' }}>
          <div className="course-hero-left">
            <div className="course-hero-tags">
              <span className="course-tag" style={{ background: accent + '18', color: accent }}>{quiz.difficulty.toUpperCase()}</span>
              {quiz.certLevel && (
                <span className="course-cert-tag" style={{ background: accent }}>{quiz.certLevel}</span>
              )}
              <span className="course-tag" style={{ background: 'var(--primary-light)', color: 'var(--primary-text)' }}>{catLabel}</span>
              {isDailyQuiz ? <span className="course-tag" style={{ background: 'rgba(255,216,77,0.16)', color: '#ffd84d' }}>{systemFeatures.dailyQuizLabel}</span> : null}
              {isTrueFalseQuiz ? <span className="course-tag" style={{ background: accent + '18', color: accent }}>TRUE / FALSE</span> : null}
            </div>
            <h1 className="course-hero-title">{quiz.title}</h1>
            <p className="course-hero-desc">{quiz.description}</p>
            <div className="course-rating">
              <span className="course-rating-stars">
                {[1,2,3,4,5].map((n) => <StarSvg key={n} filled={n <= 4} />)}
              </span>
              <span style={{ fontWeight: 700, color: '#FF9F43' }}>4.8</span>
              {studentCount !== null && (
                <span style={{ color: 'var(--text-secondary)' }}>({studentCount.toLocaleString()} students)</span>
              )}
              <span style={{ color: 'var(--text-secondary)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)' }}>{questionPool.length} questions</span>
              <span style={{ color: 'var(--text-secondary)' }}>·</span>
              <span style={{ color: 'var(--text-secondary)' }}>{quiz.duration}m duration</span>
              {isTrueFalseQuiz ? (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>·</span>
                  <span style={{ color: 'var(--text-secondary)' }}>2-option mode</span>
                </>
              ) : null}
            </div>
            {isDailyQuiz ? (
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,216,77,0.24)', background: 'rgba(255,216,77,0.08)', color: '#ffe89a', fontSize: 14, lineHeight: 1.6 }}>
                Today&apos;s featured quiz. Complete it now to keep your daily progress surfaces updated.
              </div>
            ) : null}
          </div>
          <div className="course-hero-icon">
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64, boxShadow: `0 8px 32px ${accent}30`,
            }}>📖</div>
          </div>
        </div>

        {/* Body */}
        <div className="course-lp-body">
          {/* Main column */}
          <div className="course-main">
            {/* Ad — before curriculum */}
            <AdBanner format="horizontal" />

            {/* Curriculum */}
            <div className="course-section">
              <div className="course-section-hd">
                Course Curriculum
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 8 }}>
                  {questionPool.length} questions
                </span>
              </div>
              <div className="course-section-bd">
                {questionPool.map((q, i) => (
                  <div key={q.id} className="curr-item">
                    <div className="curr-num" style={{ background: accent + '15', color: accent }}>{i + 1}</div>
                    <div className="curr-text">
                      {q.text.length > 100 ? q.text.slice(0, 100) + '…' : q.text}
                    </div>
                    <div className="curr-time">30s</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="course-section">
              <div className="course-section-hd">What&apos;s Included</div>
              <div className="course-section-bd" style={{ paddingBottom: 8 }}>
                {[
                  '30 seconds per question with auto-advance timer',
                  'Instant feedback with detailed explanations',
                  'Score tracking and performance history',
                  'Practice mode — retry as many times as you like',
                  `${questionPool.length} expertly crafted practice questions`,
                  `Scoring: +${correctPoints} / ${wrongPoints >= 0 ? '+' : ''}${wrongPoints}`,
                  ...(isTrueFalseQuiz ? ['True/False mode with two-option questions'] : []),
                ].map((f) => (
                  <div key={f} className="feature-item">
                    <span className="feature-check"><CheckSvg /></span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Ad — after What's Included */}
            <AdBanner format="rectangle" />

            {/* About this course */}
            <div className="course-section">
              <div className="course-section-hd">About This Course</div>
              <div style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 12px' }}>{quiz.description}</p>
                <p style={{ margin: 0 }}>
                  This practice set is aligned with the <strong style={{ color: 'var(--text)' }}>{quiz.examCode ?? quiz.title}</strong> exam
                  objectives and covers the key concepts you need to master for your chosen track.
                  Each question includes a detailed explanation to reinforce your understanding.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="course-sidebar">
            <div className="course-enroll-card">
              {/* Preview */}
              <div className="course-enroll-preview" style={{ background: accent + '15' }}>
                <div style={{ fontSize: 60 }}>📖</div>
              </div>

              {/* Start / Unlock button */}
              {isPremiumLocked ? (
                <button
                  className="btn-enroll"
                  style={{ background: '#FF9F43', boxShadow: '0 4px 16px #FF9F4344', marginBottom: 8 }}
                  onClick={() => { setPaywallTab('course'); setShowPaywall(true); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    🔒 Unlock — ₹{quiz.price}
                  </span>
                </button>
              ) : (
                <button
                  className="btn-enroll"
                  style={{ background: accent, boxShadow: `0 4px 16px ${accent}44`, marginBottom: 16 }}
                  onClick={() => startQuiz()}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <PlaySvg /> {isFreeUser ? `Start Free — ${Math.min(upsellCfg.freeLimit, questionPool.length)} Questions` : 'Start Practice'}
                  </span>
                </button>
              )}

              {/* Pro shortcut */}
              {isPremiumLocked && !isPro && (
                <button
                  style={{ width: '100%', height: 40, borderRadius: 10, background: 'transparent', border: '1.5px solid #FF9F43', color: '#FF9F43', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16, fontFamily: 'inherit' }}
                  onClick={() => { setPaywallTab('pro'); setShowPaywall(true); }}
                >
                  ⭐ Go Pro — All Access {countryCode === 'IN' ? '₹999/yr' : '$9.99/yr'}
                </button>
              )}

              {/* Paywall modal */}
              {showPaywall && (
                <div
                  style={{ position: 'fixed', inset: 0, background: 'rgba(47,43,61,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                  onClick={() => setShowPaywall(false)}
                >
                  <div
                    style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: 32, maxWidth: 500, width: '100%', paddingBottom: 48, maxHeight: '90vh', overflowY: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>Unlock Access</div>
                      <button onClick={() => { setShowPaywall(false); setPaymentError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
                    </div>

                    {/* Error */}
                    {paymentError && (
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,76,81,0.08)', border: '1px solid rgba(255,76,81,0.25)', color: '#FF4C51', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                        {paymentError}
                      </div>
                    )}

                    {/* Purchase type tabs */}
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                      {(['course', 'pro'] as PaywallTab[]).map((tab) => (
                        <button key={tab} onClick={() => setPaywallTab(tab)} style={{ flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: paywallTab === tab ? 'var(--surface)' : 'transparent', color: paywallTab === tab ? 'var(--primary)' : 'var(--text-secondary)', boxShadow: paywallTab === tab ? 'var(--shadow)' : 'none' }}>
                          {tab === 'course' ? 'Unlock This Quiz' : 'Go Pro — All Access'}
                        </button>
                      ))}
                    </div>

                    {/* Gateway selector */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Payment method {countryCode === 'IN' ? '🇮🇳 India' : '🌍 International'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setGatewayTab('razorpay')}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${gatewayTab === 'razorpay' ? '#7367F0' : 'var(--border)'}`, background: gatewayTab === 'razorpay' ? 'var(--primary-light)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: gatewayTab === 'razorpay' ? 'var(--primary-text)' : 'var(--text)' }}>Razorpay</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>INR · UPI, cards, netbanking</div>
                        </button>
                        <button
                          onClick={() => setGatewayTab('stripe')}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${gatewayTab === 'stripe' ? '#635BFF' : 'var(--border)'}`, background: gatewayTab === 'stripe' ? 'rgba(99,91,255,0.08)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: gatewayTab === 'stripe' ? '#635BFF' : 'var(--text)' }}>Stripe</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>USD · Global cards</div>
                        </button>
                      </div>
                    </div>

                    {/* ── Course unlock ── */}
                    {paywallTab === 'course' && (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                            {gatewayTab === 'razorpay' ? `₹${quiz.price}` : `$${((quiz.price ?? 499) / 80).toFixed(2)}`}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>one-time · permanent access</div>
                        </div>
                        {[`${questionPool.length} practice questions for ${quiz.title}`, 'Instant feedback with detailed explanations', 'Unlimited retries', 'Score history saved to your profile'].map((f) => (
                          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ color: '#28C76F', fontWeight: 700 }}>✓</span>
                            <span style={{ fontSize: 13, color: 'var(--text)' }}>{f}</span>
                          </div>
                        ))}
                        <button
                          style={{ width: '100%', height: 52, borderRadius: 12, background: gatewayTab === 'stripe' ? '#635BFF' : accent, color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: paymentLoading ? 'wait' : 'pointer', marginTop: 20, fontFamily: 'inherit', opacity: paymentLoading ? 0.7 : 1 }}
                          onClick={() => handleCourseUnlock()}
                          disabled={paymentLoading}
                        >
                          {paymentLoading
                            ? (gatewayTab === 'stripe' ? 'Redirecting to Stripe…' : 'Opening Razorpay…')
                            : (gatewayTab === 'razorpay' ? `Unlock via Razorpay ₹${quiz.price}` : `Unlock via Stripe $${((quiz.price ?? 499) / 80).toFixed(2)}`)}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, marginBottom: 0 }}>
                          Or <button style={{ background: 'none', border: 'none', color: '#FF9F43', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }} onClick={() => setPaywallTab('pro')}>Go Pro for all quizzes →</button>
                        </p>
                      </>
                    )}

                    {/* ── Pro subscription ── */}
                    {paywallTab === 'pro' && (
                      <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, marginTop: 0 }}>
                          All 5 CLF-C02 quizzes · upcoming certification tracks · Pro badge.
                        </p>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                          <div style={{ flex: 1, border: '2px solid #FF9F43', borderRadius: 12, padding: 16, textAlign: 'center', background: '#FF9F4310' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43', textTransform: 'uppercase', letterSpacing: 1 }}>Annual</div>
                            <div style={{ fontSize: 22, fontWeight: 800, margin: '4px 0' }}>
                              {gatewayTab === 'razorpay' ? '₹999' : '$9.99'}
                              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/yr</span>
                            </div>
                            <div style={{ background: '#FF9F43', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>Save 44%</div>
                          </div>
                          <div style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Monthly</div>
                            <div style={{ fontSize: 22, fontWeight: 800, margin: '4px 0' }}>
                              {gatewayTab === 'razorpay' ? '₹149' : '$1.99'}
                              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span>
                            </div>
                          </div>
                        </div>
                        {['All 5 CLF-C02 quizzes (195 questions)', 'Security & Technology domains', 'Upcoming certification content', 'Advanced analytics & insights'].map((f) => (
                          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ color: '#28C76F', fontWeight: 700 }}>✓</span>
                            <span style={{ fontSize: 13, color: 'var(--text)' }}>{f}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                          <button
                            style={{ flex: 1, height: 52, borderRadius: 12, background: gatewayTab === 'stripe' ? '#635BFF' : '#FF9F43', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: paymentLoading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: paymentLoading ? 0.7 : 1 }}
                            onClick={() => handleSubscription('annual', gatewayTab)}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? '…' : `⭐ ${gatewayTab === 'razorpay' ? '₹999/yr' : '$9.99/yr'}`}
                          </button>
                          <button
                            style={{ flex: 1, height: 52, borderRadius: 12, background: 'transparent', color: gatewayTab === 'stripe' ? '#635BFF' : '#FF9F43', fontSize: 14, fontWeight: 700, border: `1.5px solid ${gatewayTab === 'stripe' ? '#635BFF' : '#FF9F43'}`, cursor: paymentLoading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: paymentLoading ? 0.7 : 1 }}
                            onClick={() => handleSubscription('monthly', gatewayTab)}
                            disabled={paymentLoading}
                          >
                            {gatewayTab === 'razorpay' ? '₹149/mo' : '$1.99/mo'}
                          </button>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
                          Secure payment via {gatewayTab === 'razorpay' ? 'Razorpay · UPI, cards, netbanking' : 'Stripe · All major cards worldwide'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="course-meta-list">
                {[
                  { icon: <QuestionSvg />, key: 'Questions',  val: String(questionPool.length) },
                  { icon: <ClockSvg />,    key: 'Duration',   val: `${quiz.duration} min` },
                  { icon: <LayersSvg />,   key: 'Difficulty', val: quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1) },
                  { icon: <UsersSvg />,    key: 'Students',   val: studentCount !== null ? studentCount.toLocaleString() : '–' },
                  { icon: <CheckSvg />,    key: 'Pass Score',  val: '70%' },
                ].map((m) => (
                  <div key={m.key} className="course-meta-row">
                    <span className="course-meta-key" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{m.icon}</span>{m.key}
                    </span>
                    <span className="course-meta-val">{m.val}</span>
                  </div>
                ))}
              </div>

              {/* Difficulty stars */}
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                {[1,2,3].map((n) => (
                  <span key={n} style={{ color: n <= diffStars ? accent : 'var(--border)', fontSize: 20 }}>★</span>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)} Level
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const maxPoints = Math.max(1, activeQuestions.length * correctPoints);
    const pct    = Math.max(0, Math.round((pointScore / maxPoints) * 100));
    const passed = pct >= 70;
    return (
      <div style={{ padding: '40px 32px', maxWidth: 700, margin: '0 auto' }}>
        {isDailyQuiz ? (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, border: `1px solid ${passed ? 'rgba(81,207,102,0.28)' : 'rgba(255,216,77,0.24)'}`, background: passed ? 'rgba(81,207,102,0.08)' : 'rgba(255,216,77,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: passed ? 'var(--platform-success-accent)' : '#ffd84d' }}>
              {systemFeatures.dailyQuizLabel}
            </div>
            <div style={{ marginTop: 6, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {passed ? 'Daily quiz completed successfully. Your result now feeds the app’s daily progress surfaces.' : 'Daily quiz attempt saved. Retry to improve today’s featured result.'}
            </div>
          </div>
        ) : null}
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Scoreboard</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ width: 140, height: 140, borderRadius: 70, background: (passed ? '#28C76F' : '#FF4C51') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 110, height: 110, borderRadius: 55, background: passed ? '#D1F7E2' : '#FFE5E6', border: `4px solid ${passed ? '#28C76F' : '#FF4C51'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: passed ? '#28C76F' : '#FF4C51', lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: passed ? '#28C76F' : '#FF4C51', letterSpacing: 1 }}>{passed ? 'PASS' : 'FAIL'}</div>
            </div>
          </div>
          <h2 style={{ margin: '16px 0 4px' }}>{passed ? 'Great job! 🎉' : 'Keep Practicing'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{quiz.title} · {passed ? 'You passed!' : '70% needed to pass'}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Correct', val: score,                                                color: '#28C76F' },
            { label: 'Wrong',   val: Object.keys(answers).length - score,                  color: '#FF4C51' },
            { label: 'Points',  val: pointScore,                                            color: accent },
            { label: 'Skipped', val: activeQuestions.length - Object.keys(answers).length,  color: 'var(--text-secondary)' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ad — between results and action buttons */}
        <AdBanner format="horizontal" />

        {/* Ad — between results and action buttons */}
        <AdBanner format="horizontal" />

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => startQuiz()} style={{ flex: 1, height: 48, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-text)', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none' }}>Retry Quiz</button>
          <button onClick={() => router.push('/dashboard/quizzes')} style={{ flex: 1, height: 48, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none' }}>All Quizzes</button>
        </div>
      </div>
    );
  }

  // ── UPSELL (free-limit checkpoint) ────────────────────────────────────────
  if (phase === 'upsell') {
    const maxPoints = Math.max(1, activeQuestions.length * correctPoints);
    const pct       = activeQuestions.length > 0 ? Math.max(0, Math.round((pointScore / maxPoints) * 100)) : 0;
    const passed    = pct >= 70;
    const remaining = questionPool.length - activeQuestions.length;
    const vars      = { n: String(activeQuestions.length), remaining: String(remaining), score: `${pct}%`, total: String(questionPool.length), price: String(quiz.price ?? 499) };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar — progress shows how far through the FULL quiz they'd be */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard/quizzes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            ← Quizzes
          </button>
          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#FF9F43', width: `${(activeQuestions.length / questionPool.length) * 100}%`, borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 12, color: '#FF9F43', fontWeight: 700, minWidth: 72, textAlign: 'right' }}>
            {activeQuestions.length} / {questionPool.length} Q
          </span>
        </div>

        {/* Main upsell card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
          <div className="upsell-card">

            {/* Score ring + checkpoint badge */}
            <div className="upsell-top-row">
              <div className="upsell-score-ring" style={{ borderColor: passed ? '#28C76F' : '#FF9F43' }}>
                <div className="upsell-score-pct" style={{ color: passed ? '#28C76F' : '#FF9F43' }}>{pct}%</div>
                <div className="upsell-score-sub">free zone</div>
              </div>
              <div className="upsell-checkpoint">
                <div className="upsell-checkpoint-icon">🎯</div>
                <div className="upsell-checkpoint-label">Free Checkpoint</div>
                <div className="upsell-checkpoint-sub">Question {activeQuestions.length} of {activeQuestions.length} completed</div>
              </div>
            </div>

            {/* Headline + subtext */}
            <h2 className="upsell-headline">{interpolate(upsellCfg.headline, vars)}</h2>
            <p className="upsell-subtext">{interpolate(upsellCfg.subtext, vars)}</p>

            {/* Locked content stats */}
            <div className="upsell-locked-bar">
              {[
                { num: remaining, lbl: 'Questions locked' },
                { num: 4,         lbl: 'Full domains' },
                { num: 90,        lbl: 'Min exam time' },
              ].map((s, i) => (
                <div key={i} className="upsell-locked-stat">
                  <div className="upsell-locked-num">🔒 {s.num}</div>
                  <div className="upsell-locked-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Gateway toggle on upsell screen */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['razorpay', 'stripe'] as GatewayTab[]).map((gw) => (
                <button
                  key={gw}
                  onClick={() => setGatewayTab(gw)}
                  style={{ flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${gatewayTab === gw ? (gw === 'stripe' ? '#635BFF' : '#7367F0') : 'var(--border)'}`, background: gatewayTab === gw ? (gw === 'stripe' ? 'rgba(99,91,255,0.1)' : 'var(--primary-light)') : 'transparent', color: gatewayTab === gw ? (gw === 'stripe' ? '#635BFF' : 'var(--primary-text)') : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {gw === 'razorpay' ? 'Razorpay (₹ INR)' : 'Stripe ($ USD)'}
                </button>
              ))}
            </div>

            {/* Primary CTA — Pro */}
            <button
              className="upsell-pro-btn"
              onClick={() => handleSubscription('annual', gatewayTab)}
              disabled={paymentLoading}
              style={{ opacity: paymentLoading ? 0.7 : undefined, cursor: paymentLoading ? 'wait' : undefined }}
            >
              {paymentLoading
                ? (gatewayTab === 'stripe' ? 'Redirecting to Stripe…' : 'Opening Razorpay…')
                : interpolate(upsellCfg.proCtaLabel, vars)}
            </button>

            {/* Monthly option */}
            <button
              style={{ width: '100%', height: 40, borderRadius: 10, background: 'transparent', border: '1.5px solid #FF9F43', color: '#FF9F43', fontSize: 13, fontWeight: 700, cursor: paymentLoading ? 'wait' : 'pointer', fontFamily: 'inherit', marginTop: 8, opacity: paymentLoading ? 0.7 : 1 }}
              onClick={() => handleSubscription('monthly', gatewayTab)}
              disabled={paymentLoading}
            >
              {gatewayTab === 'razorpay' ? 'Or ₹149/month — cancel anytime' : 'Or $1.99/month — cancel anytime'}
            </button>

            {/* Divider */}
            <div className="upsell-divider"><span>or</span></div>

            {/* Secondary CTA — Individual quiz unlock (only if quiz has a price) */}
            {(quiz.price ?? 0) > 0 && (
              <button
                className="upsell-course-btn"
                onClick={() => handleCourseUnlock()}
                disabled={paymentLoading}
                style={{ opacity: paymentLoading ? 0.7 : undefined, cursor: paymentLoading ? 'wait' : undefined }}
              >
                {interpolate(upsellCfg.courseCtaLabel, vars)}
              </button>
            )}

            {/* Payment error notice */}
            {paymentError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,76,81,0.08)', border: '1px solid rgba(255,76,81,0.25)', color: '#FF4C51', fontSize: 13, margin: '12px 0', lineHeight: 1.5, textAlign: 'left' }}>
                {paymentError}
              </div>
            )}

            {/* Ad between CTAs and skip link */}
            <div style={{ margin: '16px 0 8px' }}>
              <AdBanner format="horizontal" />
            </div>

            {/* Skip */}
            <button
              className="upsell-skip-btn"
              onClick={() => router.push('/dashboard/quizzes')}
            >
              {upsellCfg.skipCtaLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  const timerColor = timeLeft <= 10 ? '#FF4C51' : timeLeft <= 20 ? '#FF9F43' : '#28C76F';
  const userAnswer = answers[currentQ.id];
  const isCorrect  = userAnswer === currentQ.correctOptionId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/dashboard/quizzes')} style={{ color: 'var(--text-secondary)', fontSize: 20 }}>✕</button>
        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: accent, width: `${((idx + 1) / activeQuestions.length) * 100}%`, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>{idx + 1} / {activeQuestions.length}</span>
      </div>

      {/* Timer bar */}
      <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: timerColor, width: `${(timeLeft / Q_TIME) * 100}%`, borderRadius: 3, transition: 'width 1s linear, background 0.3s' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: timerColor, minWidth: 36, textAlign: 'right' }}>{timeLeft}s</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#28C76F', marginLeft: 8 }}>Pts {pointScore}</span>
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 24, color: 'var(--text)' }}>{currentQ.text}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ.options.map((opt) => {
              const isSelected = userAnswer === opt.id;
              const isRight    = opt.id === currentQ.correctOptionId;
              let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--text)';
              if (feedback) {
                if (isRight)         { bg = '#D1F7E2'; border = '#28C76F'; color = '#0F6B35'; }
                else if (isSelected) { bg = '#FFE5E6'; border = '#FF4C51'; color = '#B52D2E'; }
              } else if (isSelected) {
                bg = 'var(--primary-light)'; border = 'var(--primary)'; color = 'var(--primary-text)';
              }
              return (
                <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={feedback} style={{ padding: '14px 18px', borderRadius: 10, textAlign: 'left', background: bg, border: `1.5px solid ${border}`, color, fontSize: 14, cursor: feedback ? 'default' : 'pointer', fontWeight: isSelected || (feedback && isRight) ? 600 : 400, transition: 'all 0.15s', fontFamily: 'inherit' }}>
                  {opt.text}
                </button>
              );
            })}
          </div>
          {feedback && currentQ.explanation && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: isCorrect ? '#D1F7E2' : '#FFE5E6', border: `1px solid ${isCorrect ? '#28C76F44' : '#FF4C5144'}`, fontSize: 13, color: isCorrect ? '#0F6B35' : '#B52D2E', lineHeight: 1.6 }}>
              <strong>{isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}</strong>{currentQ.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '16px 24px', display: 'flex', gap: 12 }}>
        {idx > 0 && (
          <button onClick={() => { setFeedback(true); setIdx((i) => i - 1); }} style={{ flex: 1, height: 48, borderRadius: 10, border: `1.5px solid var(--primary-text)`, background: 'transparent', color: 'var(--primary-text)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Previous</button>
        )}
        {feedback ? (
          <button onClick={handleNext} style={{ flex: 1, height: 48, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>{isLast ? 'See Results →' : 'Next Question →'}</button>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Select an answer above</div>
        )}
      </div>
    </div>
  );
}
