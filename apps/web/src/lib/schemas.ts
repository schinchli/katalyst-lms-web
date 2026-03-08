/**
 * schemas.ts — Zod validation schemas for all API route inputs.
 * Import the relevant schema in each route and call .safeParse() before use.
 */

import { z } from 'zod';

// ── /api/sync-user ────────────────────────────────────────────────────────────

const QuizResultSchema = z.object({
  quizId:         z.string().min(1),
  score:          z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  timeTaken:      z.number().int().min(0).optional(),
});

export const SyncUserSchema = z.object({
  supabaseId:   z.string().uuid(),
  email:        z.string().email(),
  name:         z.string().max(100).optional(),
  accessToken:  z.string().min(10),
  createdAt:    z.string().datetime({ offset: true }).optional(),
  quizResults:  z.array(QuizResultSchema).max(500).optional(),
});

export type SyncUserInput = z.infer<typeof SyncUserSchema>;

// ── /api/admin/check — GET, no body; token validated via header ───────────────
// No body schema needed — input is the Authorization header only.

// ── /api/setup-db — guarded by x-setup-token header ─────────────────────────
// No body schema needed — no request body expected.
