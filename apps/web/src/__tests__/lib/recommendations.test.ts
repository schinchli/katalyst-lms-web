import {
  buildRecommendations, pathUnits, moduleServices, modulePillars,
  CATEGORY_META, type ProgressContext,
} from '@/lib/recommendations';
import { LEARNING_PATHS } from '@/data/learningPaths';

const emptyCtx = (): ProgressContext => ({
  notesRead: new Set(), quizPct: new Map(), flashConfidence: new Map(),
});

describe('recommendation engine', () => {
  it('groups every path into ordered module units with a moduleId and title', () => {
    for (const p of LEARNING_PATHS) {
      const units = pathUnits(p);
      expect(units.length).toBeGreaterThan(0);
      units.forEach((u, i) => {
        expect(u.moduleId).toBeTruthy();
        expect(u.title).toBeTruthy();
        expect(u.order).toBe(i);
      });
    }
  });

  it('a fresh learner gets "Study Next" entries (path starters) and no errors', () => {
    const recs = buildRecommendations(emptyCtx());
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.category === 'study_next')).toBe(true);
    // every rec has a link, cta, reason and finite score
    for (const r of recs) {
      expect(r.link).toBeTruthy();
      expect(r.cta).toBeTruthy();
      expect(r.reason).toBeTruthy();
      expect(Number.isFinite(r.score)).toBe(true);
    }
  });

  it('reading a module then surfaces a "Take Quiz" recommendation for it', () => {
    const ctx = emptyCtx();
    ctx.notesRead.add('arch-m04'); // read Compute notes, quiz not taken
    const recs = buildRecommendations(ctx);
    const takeQuiz = recs.filter((r) => r.category === 'take_quiz');
    expect(takeQuiz.some((r) => r.moduleId === 'arch-m04')).toBe(true);
  });

  it('a low quiz score surfaces a "Review" recommendation citing the score', () => {
    const ctx = emptyCtx();
    ctx.quizPct.set('arch-quiz-m04', 45); // failed Compute quiz
    const recs = buildRecommendations(ctx);
    const review = recs.find((r) => r.category === 'review' && r.moduleId === 'arch-m04');
    expect(review).toBeDefined();
    expect(review!.reason).toMatch(/45%/);
  });

  it('an active path produces a "Continue" recommendation ranked highest', () => {
    const ctx = emptyCtx();
    ctx.notesRead.add('arch-m01');
    ctx.quizPct.set('arch-quiz-m01', 90);
    const recs = buildRecommendations(ctx);
    const cont = recs.find((r) => r.category === 'continue');
    expect(cont).toBeDefined();
    expect(cont!.pathId).toBe('architect');
  });

  it('AWS official reading recs carry a real https source url', () => {
    const ctx = emptyCtx();
    ctx.notesRead.add('arch-m02');
    const recs = buildRecommendations(ctx);
    const reading = recs.filter((r) => r.category === 'aws_reading');
    for (const r of reading) {
      expect(r.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('exposes service + pillar metadata for ranking', () => {
    expect(moduleServices('arch-m02')).toContain('iam');
    expect(modulePillars('arch-m02')).toContain('Security');
    expect(Object.keys(CATEGORY_META)).toContain('related');
  });
});
