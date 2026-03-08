/**
 * recaptcha.ts — server-side reCAPTCHA v3 token verification.
 * Call verifyRecaptcha() inside API routes only — secret key is server-side.
 */

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE  = 0.5; // 0.0 = bot, 1.0 = human

export interface RecaptchaResult {
  ok:      boolean;
  score:   number;
  action?: string;
  error?:  string;
}

export async function verifyRecaptcha(
  token:          string,
  expectedAction: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, score: 0, error: 'RECAPTCHA_SECRET_KEY not configured' };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ secret, response: token }),
    });

    const data = await res.json() as {
      success:      boolean;
      score:        number;
      action?:      string;
      'error-codes'?: string[];
    };

    if (!data.success) {
      return { ok: false, score: 0, error: (data['error-codes'] ?? ['unknown']).join(', ') };
    }

    // Verify the action matches what we expect (prevents token reuse across forms)
    if (data.action && data.action !== expectedAction) {
      return { ok: false, score: data.score, error: 'action_mismatch' };
    }

    if (data.score < MIN_SCORE) {
      return { ok: false, score: data.score, error: 'score_too_low' };
    }

    return { ok: true, score: data.score, action: data.action };
  } catch {
    return { ok: false, score: 0, error: 'verification_request_failed' };
  }
}
