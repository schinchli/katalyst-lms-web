/**
 * learningPathSync (web) — reads/writes the learner's active path + completed
 * steps to user_profiles.learning_pref, the same jsonb the mobile app syncs.
 * RLS ("own user_profiles") scopes every row to the signed-in user. Fails soft.
 */
import { supabase } from './supabase';

export interface LearningPref {
  activePathId: string | null;
  completedStepIds: string[];
}

export async function fetchLearningPref(): Promise<LearningPref | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('learning_pref')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data?.learning_pref) return null;
    const p = data.learning_pref as Partial<LearningPref>;
    return {
      activePathId: p.activePathId ?? null,
      completedStepIds: Array.isArray(p.completedStepIds) ? p.completedStepIds : [],
    };
  } catch {
    return null;
  }
}

/** Set the active path in the cloud (preserves existing completed steps). */
export async function setActivePathRemote(activePathId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const current = await fetchLearningPref();
    await supabase.from('user_profiles')
      .update({ learning_pref: { activePathId, completedStepIds: current?.completedStepIds ?? [] } })
      .eq('id', user.id);
  } catch {
    /* offline — no-op */
  }
}

/** Union a completed step into the cloud pref (keeps active path). */
export async function markStepDoneRemote(stepId: string): Promise<void> {
  await syncCompletedStepsRemote([stepId]);
}

/**
 * Union a batch of completed steps into the cloud pref in ONE write
 * (keeps the active path and steps from other paths). Skips the write
 * when the remote set already contains every id.
 */
export async function syncCompletedStepsRemote(stepIds: string[]): Promise<void> {
  if (stepIds.length === 0) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const current = await fetchLearningPref();
    const remote = new Set(current?.completedStepIds ?? []);
    if (stepIds.every((id) => remote.has(id))) return;
    const steps = [...new Set([...remote, ...stepIds])];
    await supabase.from('user_profiles')
      .update({ learning_pref: { activePathId: current?.activePathId ?? null, completedStepIds: steps } })
      .eq('id', user.id);
  } catch {
    /* offline — no-op */
  }
}
