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
    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(SITE_KEY, { action });
          resolve(token);
        } catch (err) {
          reject(err);
        }
      });
    });
  }, []);

  return { execute };
}
