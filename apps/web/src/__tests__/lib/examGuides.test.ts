/**
 * examGuides — integrity of the exam-guide data extracted from the official
 * AWS PDFs, and its grounding of the recommendation catalog.
 */
import { EXAM_GUIDES, getExamGuide, examGuideText } from '@/data/examGuides';
import { quizzes } from '@/data/quizzes';
import { LEARNING_PATHS } from '@/data/learningPaths';

describe('EXAM_GUIDES integrity', () => {
  it('covers all 12 current AWS certifications', () => {
    expect(Object.keys(EXAM_GUIDES)).toHaveLength(12);
  });

  it('every exam has domains whose scored weights sum to 100%', () => {
    for (const guide of Object.values(EXAM_GUIDES)) {
      const total = guide.domains.reduce((s, d) => s + d.weight, 0);
      expect({ code: guide.code, total: Math.round(total) }).toEqual({ code: guide.code, total: 100 });
      expect(guide.domains.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every exam has task statements from its guide', () => {
    for (const guide of Object.values(EXAM_GUIDES)) {
      const tasks = guide.domains.reduce((s, d) => s + d.tasks.length, 0);
      expect({ code: guide.code, hasTasks: tasks > 0 }).toEqual({ code: guide.code, hasTasks: true });
    }
  });

  it('SAA-C03 matches the official guide (spot check)', () => {
    const saa = EXAM_GUIDES['SAA-C03'];
    expect(saa.domains.map((d) => d.name)).toEqual([
      'Design Secure Architectures',
      'Design Resilient Architectures',
      'Design High-Performing Architectures',
      'Design Cost-Optimized Architectures',
    ]);
    expect(saa.domains[0].weight).toBe(30);
  });
});

describe('exam-code resolution across the app', () => {
  it('resolves repo-internal aliases (AIP-C01 → AI Practitioner)', () => {
    expect(getExamGuide('AIP-C01')?.code).toBe('AIF-C01');
  });

  it('every quiz examCode resolves to an exam guide', () => {
    const codes = Array.from(new Set(quizzes.map((q) => q.examCode).filter(Boolean))) as string[];
    // Non-certification tracks (internal codes) are allowed to have no guide
    const unresolved = codes.filter((c) => !getExamGuide(c) && /^[A-Z]{3}-C\d{2}$/.test(c));
    expect(unresolved).toEqual([]);
  });

  it('cert-backed learning paths resolve to guides', () => {
    for (const path of LEARNING_PATHS) {
      if (/^[A-Z]{3}-C\d{2}$/.test(path.certCode)) {
        expect({ path: path.id, hasGuide: Boolean(getExamGuide(path.certCode)) })
          .toEqual({ path: path.id, hasGuide: true });
      }
    }
  });

  it('examGuideText yields weighted domain text for embedding', () => {
    const text = examGuideText('SCS-C03');
    expect(text).toContain('Infrastructure Security');
    expect(text).toContain('Identity and Access Management');
    // highest-weight domain listed first
    expect(text.indexOf('Infrastructure Security')).toBeLessThan(text.indexOf('Threat Detection'));
    expect(examGuideText('NOT-A-CODE')).toBe('');
  });
});
