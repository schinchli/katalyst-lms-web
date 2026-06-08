/**
 * RAG-assisted recommendation engine.
 * ────────────────────────────────────────────────────────────────────────────
 * Works across ALL AWS learning paths. Pure, testable ranking logic that turns
 * a learner's progress (notes read · quiz scores · flashcard confidence) into
 * categorised "what to study next" recommendations, each with a reason, a CTA,
 * and — where relevant — an official AWS reading link.
 *
 * "Related Concepts" + extra "AWS Official Reading" come from RAG at request
 * time (see /api/recommendations); everything else is derived here from the
 * learning-path graph so it is deterministic and unit-testable.
 */
import { LEARNING_PATHS, type LearningPath } from '@/data/learningPaths';
import { getModuleSources } from '@/lib/sources';

export type RecCategory =
  | 'continue'            // Continue Learning
  | 'study_next'          // Study Next
  | 'review'             // Review Before Continuing
  | 'practice_flashcards' // Practice Flashcards
  | 'take_quiz'           // Take Quiz
  | 'deep_dive'           // Architecture Deep Dive
  | 'lab'                 // Hands-On Lab
  | 'aws_reading'         // AWS Official Reading
  | 'related';            // Related Concepts

export interface Recommendation {
  category: RecCategory;
  title: string;
  reason: string;
  difficulty?: string;
  estimatedMinutes?: number;
  /** In-app deep link. */
  link: string;
  cta: string;
  /** Optional official source link (AWS docs / labs). */
  sourceUrl?: string;
  sourceTitle?: string;
  moduleId?: string;
  pathId?: string;
  score: number; // ranking score, higher = more relevant
}

export interface ProgressContext {
  /** moduleIds whose reading notes have been opened. */
  notesRead: Set<string>;
  /** quizId → percent score (0–100). */
  quizPct: Map<string, number>;
  /** deckId → { known, total } flashcard confidence. */
  flashConfidence: Map<string, { known: number; total: number }>;
}

// ── Per-module knowledge-graph metadata (services + Well-Architected pillars) ─
// Topic graph (Phase 8): prereq/next come from path order; services/pillars are
// curated here. Used for ranking + "Related Concepts" seeding.
const MODULE_META: Record<string, { services: string[]; pillars: string[] }> = {
  'arch-m01': { services: ['well-architected'], pillars: ['Operational Excellence', 'Cost Optimization'] },
  'arch-m02': { services: ['iam', 'organizations'], pillars: ['Security'] },
  'arch-m03': { services: ['vpc'], pillars: ['Security', 'Reliability'] },
  'arch-m04': { services: ['ec2'], pillars: ['Performance Efficiency', 'Cost Optimization'] },
  'arch-m05': { services: ['s3', 'ebs', 'efs'], pillars: ['Cost Optimization', 'Reliability'] },
  'arch-m06': { services: ['rds', 'dynamodb', 'aurora'], pillars: ['Reliability', 'Performance Efficiency'] },
  'arch-m07': { services: ['cloudwatch', 'cloudtrail'], pillars: ['Operational Excellence'] },
  'arch-m08': { services: ['cloudformation'], pillars: ['Operational Excellence'] },
  'arch-m09': { services: ['ecs', 'eks', 'fargate'], pillars: ['Performance Efficiency'] },
  'arch-m10': { services: ['transitgateway', 'directconnect'], pillars: ['Reliability', 'Security'] },
  'arch-m11': { services: ['lambda', 'sqs', 'sns'], pillars: ['Cost Optimization', 'Operational Excellence'] },
  'arch-m12': { services: ['route53', 'cloudfront'], pillars: ['Performance Efficiency'] },
  'arch-m13': { services: ['backup'], pillars: ['Reliability'] },
};

export function moduleServices(moduleId: string): string[] {
  return MODULE_META[moduleId]?.services ?? [];
}
export function modulePillars(moduleId: string): string[] {
  return MODULE_META[moduleId]?.pillars ?? [];
}

// ── Path → ordered module units (notes + flashcard + quiz grouped) ───────────
export interface ModuleUnit {
  moduleId: string;        // flashcard/notes resourceId
  pathId: string;
  pathName: string;
  order: number;
  notesStepId?: string;
  flashStepId?: string;
  quizId?: string;         // quiz step resourceId
  title: string;
  difficulty: string;
}

/** Walk a path's ordered steps and group them into per-module units. */
export function pathUnits(path: LearningPath): ModuleUnit[] {
  const units: ModuleUnit[] = [];
  let current: ModuleUnit | null = null;
  let order = 0;
  for (const step of path.steps) {
    if (step.type === 'notes' || step.type === 'flashcard') {
      const mid = step.resourceId;
      if (!current || current.moduleId !== mid) {
        current = {
          moduleId: mid, pathId: path.id, pathName: path.certName, order: order++,
          title: step.title.replace(/^(Read:|Module \d+:)\s*/, '').trim(),
          difficulty: path.difficulty,
        };
        units.push(current);
      }
      if (step.type === 'notes') current.notesStepId = step.id;
      if (step.type === 'flashcard') current.flashStepId = step.id;
    } else if (step.type === 'quiz' && current && !current.quizId) {
      current.quizId = step.resourceId;
    }
  }
  return units;
}

const FLASH_DONE_THRESHOLD = 1;   // ≥1 known card = practiced
const WEAK_QUIZ_PCT = 70;         // below this = needs review

function notesLink(moduleId: string) { return `/dashboard/learning-paths/notes/${moduleId}`; }
function flashLink(moduleId: string) { return `/dashboard/flashcards/${moduleId}`; }
function quizLink(quizId: string) { return `/dashboard/quiz/${quizId}`; }

// ── The engine ───────────────────────────────────────────────────────────────
export function buildRecommendations(ctx: ProgressContext, maxPerCategory = 4): Recommendation[] {
  const recs: Recommendation[] = [];
  const paths = LEARNING_PATHS;

  // Score each path by how engaged the learner is (to pick "Continue").
  const pathEngagement = new Map<string, number>();
  for (const path of paths) {
    const units = pathUnits(path);
    let done = 0;
    for (const u of units) {
      if (u.notesStepId && ctx.notesRead.has(u.moduleId)) done++;
      if (u.quizId && ctx.quizPct.has(u.quizId)) done++;
      if ((ctx.flashConfidence.get(u.moduleId)?.known ?? 0) >= FLASH_DONE_THRESHOLD) done++;
    }
    pathEngagement.set(path.id, done);
  }
  const activePath = [...pathEngagement.entries()].sort((a, b) => b[1] - a[1])[0];
  const hasAnyProgress = (activePath?.[1] ?? 0) > 0;

  for (const path of paths) {
    const units = pathUnits(path);
    const engaged = pathEngagement.get(path.id) ?? 0;

    // First incomplete unit drives "Continue" / "Study Next".
    const firstIncomplete = units.find((u) => {
      const readDone = u.notesStepId ? ctx.notesRead.has(u.moduleId) : true;
      const quizDone = u.quizId ? ctx.quizPct.has(u.quizId) : true;
      return !(readDone && quizDone);
    });

    for (const u of units) {
      const readDone = u.notesStepId ? ctx.notesRead.has(u.moduleId) : false;
      const quizPct = u.quizId ? ctx.quizPct.get(u.quizId) : undefined;
      const flash = ctx.flashConfidence.get(u.moduleId);
      const srcs = getModuleSources(u.moduleId);
      const topSrc = srcs[0];

      // 1) Review weak areas — quiz below threshold.
      if (quizPct !== undefined && quizPct < WEAK_QUIZ_PCT) {
        recs.push({
          category: 'review', title: `Review: ${u.title}`,
          reason: `You scored ${quizPct}% on this quiz — re-read the notes and retake to lock it in.`,
          link: u.notesStepId ? notesLink(u.moduleId) : quizLink(u.quizId!),
          cta: 'Review notes', moduleId: u.moduleId, pathId: path.id,
          difficulty: u.difficulty, sourceUrl: topSrc?.url, sourceTitle: topSrc?.title,
          score: 100 - quizPct + 60,
        });
      }

      // 2) Take quiz — module read but quiz not taken.
      if (readDone && u.quizId && quizPct === undefined) {
        recs.push({
          category: 'take_quiz', title: `Quiz: ${u.title}`,
          reason: `You've read ${u.title} — test yourself with scenario questions.`,
          link: quizLink(u.quizId), cta: 'Take quiz', moduleId: u.moduleId, pathId: path.id,
          difficulty: u.difficulty, estimatedMinutes: 10, score: 55,
        });
      }

      // 3) Practice flashcards — not yet practiced.
      if ((flash?.known ?? 0) < FLASH_DONE_THRESHOLD && u.flashStepId) {
        recs.push({
          category: 'practice_flashcards', title: `Practice: ${u.title}`,
          reason: readDone
            ? `Reinforce ${u.title} with spaced-repetition flashcards.`
            : `Warm up on ${u.title} with flashcards before the deep read.`,
          link: flashLink(u.moduleId), cta: 'Practice flashcards', moduleId: u.moduleId, pathId: path.id,
          difficulty: u.difficulty, estimatedMinutes: 8, score: readDone ? 45 : 30,
        });
      }

      // 8) AWS official reading — for the active/next topic.
      if (topSrc && (u === firstIncomplete || !readDone) && engaged > 0) {
        recs.push({
          category: 'aws_reading', title: topSrc.title,
          reason: `Official AWS documentation for ${u.title}.`,
          link: topSrc.url, cta: 'Read on AWS', moduleId: u.moduleId, pathId: path.id,
          sourceUrl: topSrc.url, sourceTitle: topSrc.title, score: 40,
        });
      }
    }

    // 0) Continue / Study Next — only for the active path + next ones.
    if (firstIncomplete) {
      const isActive = path.id === activePath?.[0] && hasAnyProgress;
      recs.push({
        category: isActive ? 'continue' : 'study_next',
        title: isActive ? `Continue: ${firstIncomplete.title}` : `Start: ${path.certName}`,
        reason: isActive
          ? `Pick up where you left off in ${path.certName}.`
          : `${path.certName} — ${path.steps.length} steps across ${units.length} module${units.length === 1 ? '' : 's'}.`,
        link: firstIncomplete.notesStepId ? notesLink(firstIncomplete.moduleId)
          : firstIncomplete.quizId ? quizLink(firstIncomplete.quizId) : flashLink(firstIncomplete.moduleId),
        cta: isActive ? 'Continue' : 'Start path',
        moduleId: firstIncomplete.moduleId, pathId: path.id, difficulty: path.difficulty,
        score: isActive ? 200 : 20,
      });
    }
  }

  // Rank within category, cap per category, drop dupes by (category, link).
  const seen = new Set<string>();
  const byCat = new Map<RecCategory, Recommendation[]>();
  for (const r of recs.sort((a, b) => b.score - a.score)) {
    const k = `${r.category}|${r.link}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const arr = byCat.get(r.category) ?? [];
    if (arr.length < maxPerCategory) { arr.push(r); byCat.set(r.category, arr); }
  }
  return [...byCat.values()].flat();
}

export const CATEGORY_META: Record<RecCategory, { label: string; icon: string; order: number }> = {
  continue:            { label: 'Continue Learning',      icon: '▶️', order: 0 },
  review:              { label: 'Review Weak Areas',      icon: '🔁', order: 1 },
  take_quiz:           { label: 'Take a Quiz',            icon: '📝', order: 2 },
  practice_flashcards: { label: 'Practice Flashcards',    icon: '🃏', order: 3 },
  study_next:          { label: 'Study Next',             icon: '📚', order: 4 },
  aws_reading:         { label: 'AWS Official Reading',   icon: '📖', order: 5 },
  deep_dive:           { label: 'Architecture Deep Dive', icon: '🏛️', order: 6 },
  lab:                 { label: 'Hands-On Lab',           icon: '🧪', order: 7 },
  related:             { label: 'Related Concepts',       icon: '🔗', order: 8 },
};
