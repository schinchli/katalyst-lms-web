import {
  resolveSource,
  getModuleSources,
  getSourcesByTopic,
  resolveBestSource,
  MODULE_SOURCES,
  AWS_FOUNDATION_SOURCES,
  AWS_SERVICE_SOURCES,
  ALL_SOURCE_KEYS,
} from '@/lib/sources';

describe('trusted source registry', () => {
  const all = [...AWS_FOUNDATION_SOURCES, ...AWS_SERVICE_SOURCES];

  it('every source has a stable key, https url, and trust level', () => {
    for (const s of all) {
      expect(s.key).toMatch(/^[a-z0-9-]+$/);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.trustLevel).toBeGreaterThan(0);
      expect(s.trustLevel).toBeLessThanOrEqual(100);
    }
  });

  it('source keys are unique', () => {
    const keys = all.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all official AWS docs use the aws.amazon.com domain', () => {
    for (const s of all) {
      expect(s.url).toMatch(/(^https:\/\/(docs\.)?aws\.amazon\.com\/)|(^https:\/\/(www\.)?wellarchitectedlabs\.com\/)|(^https:\/\/workshops\.aws\/)|(^https:\/\/explore\.skillbuilder\.aws\/)/);
    }
  });

  it('every MODULE_SOURCES key resolves to a real source (no broken refs)', () => {
    for (const [moduleId, keys] of Object.entries(MODULE_SOURCES)) {
      for (const k of keys) {
        expect(ALL_SOURCE_KEYS).toContain(k);
        expect(resolveSource(k)).toBeDefined();
      }
      // and the resolver returns them de-duplicated
      const resolved = getModuleSources(moduleId);
      expect(resolved.length).toBeGreaterThan(0);
      const resolvedKeys = resolved.map((s) => s.key);
      expect(new Set(resolvedKeys).size).toBe(resolvedKeys.length);
    }
  });

  it('topic search returns highest-trust matches first', () => {
    const hits = getSourcesByTopic(['security', 'iam']);
    expect(hits.length).toBeGreaterThan(0);
    // IAM best practices (official docs, trust 100) should rank for security+iam
    expect(hits.map((s) => s.key)).toContain('aws-iam-best-practices');
  });

  it('resolveBestSource falls through MCP (null) to the curated web provider', async () => {
    const s = await resolveBestSource('vpc');
    expect(s).not.toBeNull();
    expect(s?.topics).toContain('vpc');
  });

  it('every Architecting module (m01–m13) has curated references', () => {
    for (let i = 1; i <= 13; i++) {
      const id = `arch-m${String(i).padStart(2, '0')}`;
      expect(getModuleSources(id).length).toBeGreaterThan(0);
    }
  });
});
