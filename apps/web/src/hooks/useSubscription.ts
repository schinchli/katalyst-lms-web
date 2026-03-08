'use client';
/**
 * useSubscription
 * ───────────────
 * Tracks Pro subscription + per-course unlock state.
 * Reads from Supabase when authenticated; falls back to localStorage for
 * unauthenticated / offline use. Writes to both on every mutation.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getSubscription,
  saveSubscription,
  getUnlockedCourses,
  unlockCourse as dbUnlockCourse,
  getPurchases,
  recordPurchase as dbRecordPurchase,
} from '@/lib/db';
import type { PurchaseRecord } from '@/lib/db';

export type { PurchaseRecord };

const SUBSCRIPTION_KEY = 'katalyst-subscription';
const UNLOCKED_KEY     = 'katalyst-unlocked-courses';
const PURCHASES_KEY    = 'katalyst-purchases';

export function useSubscription() {
  const [userId,          setUserId]          = useState<string | null>(null);
  const [isPro,           setIsPro]           = useState(false);
  const [unlockedCourses, setUnlockedCourses] = useState<string[]>([]);

  // Resolve auth + load from Supabase (fallback: localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);

        // Load subscription from Supabase
        const sub = await getSubscription(user.id);
        if (sub) {
          setIsPro(sub.tier === 'premium');
          if (sub.tier === 'premium') localStorage.setItem(SUBSCRIPTION_KEY, 'premium');
        } else {
          // fall back to localStorage
          setIsPro(localStorage.getItem(SUBSCRIPTION_KEY) === 'premium');
        }

        // Load unlocked courses from Supabase
        const courses = await getUnlockedCourses(user.id);
        if (courses.length > 0) {
          setUnlockedCourses(courses);
          localStorage.setItem(UNLOCKED_KEY, JSON.stringify(courses));
        } else {
          try {
            const stored = localStorage.getItem(UNLOCKED_KEY);
            setUnlockedCourses(stored ? (JSON.parse(stored) as string[]) : []);
          } catch {
            setUnlockedCourses([]);
          }
        }
      } else {
        // unauthenticated — localStorage only
        setIsPro(localStorage.getItem(SUBSCRIPTION_KEY) === 'premium');
        try {
          const stored = localStorage.getItem(UNLOCKED_KEY);
          setUnlockedCourses(stored ? (JSON.parse(stored) as string[]) : []);
        } catch {
          setUnlockedCourses([]);
        }
      }
    });
  }, []);

  const canAccess = useCallback((quizId: string): boolean => {
    return isPro || unlockedCourses.includes(quizId);
  }, [isPro, unlockedCourses]);

  const upgradeToPremium = useCallback((plan?: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SUBSCRIPTION_KEY, 'premium');
    setIsPro(true);
    if (userId) saveSubscription(userId, 'premium', plan).catch(() => { /* best-effort */ });
  }, [userId]);

  const unlockCourse = useCallback((courseId: string) => {
    if (typeof window === 'undefined') return;
    setUnlockedCourses((prev) => {
      if (prev.includes(courseId)) return prev;
      const next = [...prev, courseId];
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(next));
      if (userId) dbUnlockCourse(userId, courseId).catch(() => { /* best-effort */ });
      return next;
    });
  }, [userId]);

  const recordPurchase = useCallback((purchase: PurchaseRecord) => {
    if (typeof window === 'undefined') return;
    try {
      const prev: PurchaseRecord[] = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
      localStorage.setItem(PURCHASES_KEY, JSON.stringify([...prev, purchase]));
    } catch {
      // best-effort
    }
    if (userId) {
      const { id: _id, ...rest } = purchase;
      void _id;
      dbRecordPurchase(userId, rest).catch(() => { /* best-effort */ });
    }
  }, [userId]);

  return { userId, isPro, unlockedCourses, canAccess, upgradeToPremium, unlockCourse, recordPurchase };
}
