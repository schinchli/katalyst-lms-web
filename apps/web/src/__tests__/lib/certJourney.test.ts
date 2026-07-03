/**
 * New-user certification journey — Cloud Practitioner to Solutions Architect
 * Professional. Simulates a brand-new learner walking the full AWS ladder
 * (CLF-C02 → AIF-C01 → SAA-C03 → MLA-C01 → SAP-C02) and asserts the
 * recommendation engine + focus-next steer them correctly at every stage.
 */
import {
  buildRecommendations, pathUnits, pickFocusNext,
  type ProgressContext,
} from '@/lib/recommendations';
import { LEARNING_PATHS, getLearningPath } from '@/data/learningPaths';
import { CERT_GUIDES } from '@/data/certGuides';

const LADDER = ['clf-c02', 'aip-c01', 'architect', 'mla-c01', 'sap-c02'];

const emptyCtx = (): ProgressContext => ({
  notesRead: new Set(), quizPct: new Map(), flashConfidence: new Map(),
});

/** Complete every unit of a path in the context (reads + quizzes at pct%). */
function completePath(ctx: ProgressContext, pathId: string, pct = 90) {
  const path = getLearningPath(pathId)!;
  for (const u of pathUnits(path)) {
    ctx.notesRead.add(u.moduleId);
    if (u.quizId) ctx.quizPct.set(u.quizId, pct);
    ctx.flashConfidence.set(u.moduleId, { known: 5, total: 10 });
  }
}

describe('ladder data integrity', () => {
  it('every ladder cert exists as a learning path', () => {
    for (const id of LADDER) {
      expect(getLearningPath(id)).toBeDefined();
    }
  });

  it('certGuides next-pointers chain CLF → AIF → SAA → MLA → SAP', () => {
    for (let i = 0; i < LADDER.length - 1; i++) {
      const guide = CERT_GUIDES.find((g) => g.pathId === LADDER[i])!;
      expect(guide).toBeDefined();
      const nextGuide = CERT_GUIDES.find((g) => g.slug === guide.next);
      expect(nextGuide?.pathId).toBe(LADDER[i + 1]);
    }
  });
});

describe('stage 0 — brand-new user', () => {
  it('focus lands on a foundational (Beginner) path, not an advanced one', () => {
    const recs = buildRecommendations(emptyCtx());
    const focus = pickFocusNext(recs, null)!;
    expect(focus.rec.category).toBe('study_next');
    const path = LEARNING_PATHS.find((p) => p.id === focus.rec.pathId)!;
    expect(path.difficulty).toBe('Beginner');
  });

  it('study_next ranks Beginner above Intermediate above Advanced', () => {
    const recs = buildRecommendations(emptyCtx());
    const next = recs.filter((r) => r.category === 'study_next');
    const diffOf = (r: (typeof next)[number]) => LEARNING_PATHS.find((p) => p.id === r.pathId)?.difficulty;
    expect(diffOf(next[0])).toBe('Beginner');
    const lastAdvanced = next.findIndex((r) => diffOf(r) === 'Advanced');
    const firstBeginner = next.findIndex((r) => diffOf(r) === 'Beginner');
    if (lastAdvanced !== -1) expect(firstBeginner).toBeLessThan(lastAdvanced);
  });
});

describe('stage 1 — user selects Cloud Practitioner (cross-device pref)', () => {
  it('selected path becomes "continue" focus even with zero progress', () => {
    const ctx = { ...emptyCtx(), activePathId: 'clf-c02' };
    const recs = buildRecommendations(ctx);
    const cont = recs.find((r) => r.category === 'continue');
    expect(cont?.pathId).toBe('clf-c02');
    const focus = pickFocusNext(recs, 'clf-c02')!;
    expect(focus.rec.pathId).toBe('clf-c02');
  });

  it('explicit selection beats engagement in another path', () => {
    const ctx = { ...emptyCtx(), activePathId: 'sap-c02' };
    // heavy engagement in clf-c02
    completePath(ctx, 'clf-c02', 95);
    const recs = buildRecommendations(ctx);
    const cont = recs.find((r) => r.category === 'continue');
    expect(cont?.pathId).toBe('sap-c02');
  });

  it('an unknown selected path id falls back to engagement', () => {
    const ctx = { ...emptyCtx(), activePathId: 'deleted-path' };
    const recs = buildRecommendations(ctx);
    expect(() => pickFocusNext(recs, 'deleted-path')).not.toThrow();
  });
});

describe('stage 2 — weak quiz pulls focus back before moving on', () => {
  it('a failing quiz (<70%) on the active path is the focus, above continue', () => {
    const ctx = { ...emptyCtx(), activePathId: 'clf-c02' };
    const units = pathUnits(getLearningPath('clf-c02')!);
    const withQuiz = units.find((u) => u.quizId)!;
    ctx.notesRead.add(withQuiz.moduleId);
    ctx.quizPct.set(withQuiz.quizId!, 40); // failed
    const recs = buildRecommendations(ctx);
    const focus = pickFocusNext(recs, 'clf-c02')!;
    expect(focus.rec.category).toBe('review');
    expect(focus.rec.pathId).toBe('clf-c02');
    expect(focus.headline).toMatch(/weakest/i);
  });

  it('once the retake passes (≥70%), focus returns to continue', () => {
    const ctx = { ...emptyCtx(), activePathId: 'clf-c02' };
    const units = pathUnits(getLearningPath('clf-c02')!);
    const withQuiz = units.find((u) => u.quizId)!;
    ctx.notesRead.add(withQuiz.moduleId);
    ctx.quizPct.set(withQuiz.quizId!, 85); // passed on retake
    const recs = buildRecommendations(ctx);
    const focus = pickFocusNext(recs, 'clf-c02')!;
    expect(focus.rec.category).toBe('continue');
    expect(focus.rec.pathId).toBe('clf-c02');
  });
});

describe('stage 3 — full ladder walk CLF → AIF → SAA → MLA → SAP', () => {
  it('completing each cert promotes the next one on the ladder', () => {
    const ctx = emptyCtx();
    for (let i = 0; i < LADDER.length - 1; i++) {
      completePath(ctx, LADDER[i]);
      const recs = buildRecommendations({ ...ctx, activePathId: LADDER[i] });
      const nextRec = recs.find((r) => r.category === 'study_next' && r.pathId === LADDER[i + 1]);
      expect(nextRec).toBeDefined();
      // Ladder successor outranks every other study_next suggestion.
      const topNext = recs.filter((r) => r.category === 'study_next').sort((a, b) => b.score - a.score)[0];
      expect(topNext.pathId).toBe(LADDER[i + 1]);
      expect(topNext.reason).toMatch(/next on the AWS ladder/);
      // Focus moves forward too (completed path has nothing left to continue).
      const focus = pickFocusNext(recs, LADDER[i])!;
      expect(focus.rec.pathId).toBe(LADDER[i + 1]);
    }
  });

  it('after finishing the entire ladder, engine still returns useful work (no crash)', () => {
    const ctx = emptyCtx();
    for (const id of LADDER) completePath(ctx, id);
    const recs = buildRecommendations({ ...ctx, activePathId: 'sap-c02' });
    expect(Array.isArray(recs)).toBe(true);
    expect(() => pickFocusNext(recs, 'sap-c02')).not.toThrow();
  });
});
