/**
 * awsServiceCards — data-integrity contract.
 * These cards render public SEO pages and feed the RAG corpus, so every
 * field must be present, slugs unique, links official-AWS-only, and every
 * referenced learning path must actually exist.
 */
import {
  AWS_SERVICE_CARDS, SERVICE_CATEGORIES, getServiceCard, servicesForPath, pathsWithServices,
} from '@/data/awsServiceCards';
import { LEARNING_PATHS } from '@/data/learningPaths';

const W5_FIELDS = ['what', 'why', 'when', 'where', 'how'] as const;

describe('awsServiceCards data integrity', () => {
  it('has a substantial catalogue', () => {
    expect(AWS_SERVICE_CARDS.length).toBeGreaterThanOrEqual(40);
  });

  it('slugs are unique and URL-safe', () => {
    const ids = AWS_SERVICE_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('every card answers all five questions with real prose', () => {
    for (const c of AWS_SERVICE_CARDS) {
      for (const f of W5_FIELDS) {
        expect(c[f].length).toBeGreaterThan(60);
      }
      expect(c.tagline.length).toBeGreaterThan(10);
      expect(c.examTips.length).toBeGreaterThanOrEqual(2);
      expect(c.integrations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('external links point ONLY at official AWS properties', () => {
    const OFFICIAL = /^https:\/\/(docs\.aws\.amazon\.com|aws\.amazon\.com|awsdocs-neuron\.readthedocs-hosted\.com)\//;
    for (const c of AWS_SERVICE_CARDS) {
      expect(c.docsUrl).toMatch(OFFICIAL);
      expect(c.blogUrl).toMatch(OFFICIAL);
    }
  });

  it('every referenced learning path exists', () => {
    const valid = new Set(LEARNING_PATHS.map((p) => p.id));
    for (const c of AWS_SERVICE_CARDS) {
      expect(c.paths.length).toBeGreaterThan(0);
      for (const pid of c.paths) expect(valid.has(pid)).toBe(true);
    }
  });

  it('every card belongs to a declared category', () => {
    const cats = new Set(SERVICE_CATEGORIES);
    for (const c of AWS_SERVICE_CARDS) expect(cats.has(c.category)).toBe(true);
  });

  it('AI Practitioner path has strong coverage (the exam this targets)', () => {
    expect(servicesForPath('aip-c01').length).toBeGreaterThanOrEqual(35);
  });

  it('helpers behave', () => {
    expect(getServiceCard('amazon-bedrock')?.name).toBe('Amazon Bedrock');
    expect(getServiceCard('nope')).toBeUndefined();
    expect(pathsWithServices()).toEqual(expect.arrayContaining(['aip-c01', 'clf-c02', 'mla-c01']));
  });

  it('no source-material leakage: content never references third-party courseware', () => {
    const banned = /tutorials\s*dojo|study guide pdf|cheat sheet pdf/i;
    for (const c of AWS_SERVICE_CARDS) {
      const all = [c.what, c.why, c.when, c.where, c.how, c.tagline, ...c.examTips].join(' ');
      expect(all).not.toMatch(banned);
    }
  });
});
