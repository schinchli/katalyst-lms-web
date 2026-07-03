/**
 * Tests for the cross-device learning-path sync layer (learningPathSync.ts).
 * Web and mobile share user_profiles.learning_pref — these tests pin the
 * union/skip semantics that keep progress consistent across devices.
 */

const supabaseMock = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));

import {
  fetchLearningPref,
  setActivePathRemote,
  syncCompletedStepsRemote,
} from '@/lib/learningPathSync';

const USER = { id: 'user-1' };

function mockSelectChain(learningPref: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { learning_pref: learningPref }, error: null }),
  };
}

function mockUpdateChain() {
  const chain = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: USER } });
});

describe('fetchLearningPref', () => {
  it('normalizes a stored pref', async () => {
    supabaseMock.from.mockReturnValue(mockSelectChain({ activePathId: 'clf-c02', completedStepIds: ['s1', 's2'] }));
    const pref = await fetchLearningPref();
    expect(pref).toEqual({ activePathId: 'clf-c02', completedStepIds: ['s1', 's2'] });
  });

  it('returns null when signed out', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });
    expect(await fetchLearningPref()).toBeNull();
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('tolerates a malformed pref (non-array steps)', async () => {
    supabaseMock.from.mockReturnValue(mockSelectChain({ activePathId: 'x', completedStepIds: 'oops' }));
    const pref = await fetchLearningPref();
    expect(pref).toEqual({ activePathId: 'x', completedStepIds: [] });
  });
});

describe('setActivePathRemote', () => {
  it('writes the new path while preserving completed steps', async () => {
    const update = mockUpdateChain();
    supabaseMock.from
      .mockReturnValueOnce(mockSelectChain({ activePathId: 'old', completedStepIds: ['s1'] }))
      .mockReturnValueOnce(update);

    await setActivePathRemote('sap-c02');

    expect(update.update).toHaveBeenCalledWith({
      learning_pref: { activePathId: 'sap-c02', completedStepIds: ['s1'] },
    });
  });
});

describe('syncCompletedStepsRemote', () => {
  it('unions new steps with the remote set in one write', async () => {
    const update = mockUpdateChain();
    supabaseMock.from
      .mockReturnValueOnce(mockSelectChain({ activePathId: 'clf-c02', completedStepIds: ['s1'] }))
      .mockReturnValueOnce(update);

    await syncCompletedStepsRemote(['s2', 's3']);

    expect(update.update).toHaveBeenCalledWith({
      learning_pref: { activePathId: 'clf-c02', completedStepIds: ['s1', 's2', 's3'] },
    });
  });

  it('skips the write when remote already has every id', async () => {
    supabaseMock.from.mockReturnValueOnce(mockSelectChain({ activePathId: 'clf-c02', completedStepIds: ['s1', 's2'] }));

    await syncCompletedStepsRemote(['s1', 's2']);

    // Only the read — no update call
    expect(supabaseMock.from).toHaveBeenCalledTimes(1);
  });

  it('no-ops on an empty batch', async () => {
    await syncCompletedStepsRemote([]);
    expect(supabaseMock.auth.getUser).not.toHaveBeenCalled();
  });

  it('never loses steps completed for OTHER paths', async () => {
    const update = mockUpdateChain();
    supabaseMock.from
      .mockReturnValueOnce(mockSelectChain({ activePathId: 'mla-c01', completedStepIds: ['other-path-s9'] }))
      .mockReturnValueOnce(update);

    await syncCompletedStepsRemote(['s1']);

    const written = update.update.mock.calls[0][0].learning_pref;
    expect(written.completedStepIds).toContain('other-path-s9');
    expect(written.completedStepIds).toContain('s1');
    expect(written.activePathId).toBe('mla-c01');
  });
});
