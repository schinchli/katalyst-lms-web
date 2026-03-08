'use client';
/**
 * useRecaptcha — loads reCAPTCHA v3 script once and exposes an execute() fn.
 * Usage:
 *   const { execute } = useRecaptcha();
 *   const token = await execute('login');
 */

import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready(cb: () => void): void;
      execute(siteKey: string, opts: { action: string }): Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export function useRecaptcha() {
  useEffect(() => {
    if (typeof window === 'undefined' || !SITE_KEY) return;
    if (document.getElementById('recaptcha-v3-script')) return;
    const s = document.createElement('script');
    s.id    = 'recaptcha-v3-script';
    s.src   = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const execute = useCallback(async (action: string): Promise<string> => {
    if (!SITE_KEY) return '';
    try {
      // Wait up to 5 s for grecaptcha to initialise (script loads async)
      await new Promise<void>((res) => {
        if (typeof window.grecaptcha !== 'undefined') { res(); return; }
        const script = document.getElementById('recaptcha-v3-script');
        if (script) {
          script.addEventListener('load', () => res(), { once: true });
          setTimeout(res, 5_000);
        } else {
          res();
        }
      });
      if (typeof window.grecaptcha === 'undefined') return '';
      return await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try { resolve(await window.grecaptcha.execute(SITE_KEY, { action })); }
          catch (err) { reject(err); }
        });
      });
    } catch {
      // reCAPTCHA unavailable (CSP, adblocker, domain not whitelisted, etc.)
      // Return empty — server allows through; rate limiter is the real protection.
      return '';
    }
  }, []);

  return { execute };
}
