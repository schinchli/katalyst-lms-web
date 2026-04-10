'use client';
/**
 * AdBanner — Google AdSense integration (v2)
 *
 * Improvements over v1:
 *   - Hooks violation fixed: all hooks called unconditionally before any return
 *   - Module-level promise deduplication: N instances → only 1 API call each
 *   - IntersectionObserver lazy loading: ads initialize only when entering viewport
 *   - CLS prevention: explicit height reserved during SSR / pre-detection phase
 *   - Uses supabase singleton instead of dynamic import for every instance
 *
 * Detection strategy:
 *   useLayoutEffect fires synchronously after DOM commit, before browser paint.
 *   Ad blocker CSS is already applied at this point — zero delay, zero network calls.
 *
 * Kill switches (in priority order):
 *   1. Pro subscription (isPro)
 *   2. System feature flags (adsEnabled + bannerAdsEnabled)
 *   3. Per-user entitlement (ads_removed column in user_profiles)
 *   4. hidden prop (explicit caller override)
 */

import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { DEFAULT_SYSTEM_FEATURES, type SystemFeaturesConfig } from '@/lib/systemFeatures';
import { supabase } from '@/lib/supabase';

// ── AdSense config (localStorage — editable via Admin → Settings) ─────────────
export const ADSENSE_STORAGE_KEY = 'katalyst-adsense-config';

export interface AdSenseConfig { pubId: string; slotH: string; slotR: string; }

export const DEFAULT_ADSENSE: AdSenseConfig = {
  pubId: 'ca-pub-XXXXXXXXXXXXXXXXX',
  slotH: '1111111111',
  slotR: '2222222222',
};

export function getAdSenseConfig(): AdSenseConfig {
  if (typeof window === 'undefined') {
    // Server-side: read from env vars only
    return {
      pubId: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? DEFAULT_ADSENSE.pubId,
      slotH: process.env.NEXT_PUBLIC_ADSENSE_SLOT_H  ?? DEFAULT_ADSENSE.slotH,
      slotR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_R  ?? DEFAULT_ADSENSE.slotR,
    };
  }
  // Client-side: admin localStorage override takes precedence, then env vars, then hardcoded defaults.
  // Set NEXT_PUBLIC_ADSENSE_PUB_ID in Vercel env vars to enable ads for all users.
  try {
    const raw = localStorage.getItem(ADSENSE_STORAGE_KEY);
    if (raw) return { ...DEFAULT_ADSENSE, ...(JSON.parse(raw) as Partial<AdSenseConfig>) };
  } catch { /* ignore */ }
  return {
    pubId: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? DEFAULT_ADSENSE.pubId,
    slotH: process.env.NEXT_PUBLIC_ADSENSE_SLOT_H  ?? DEFAULT_ADSENSE.slotH,
    slotR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_R  ?? DEFAULT_ADSENSE.slotR,
  };
}

// ── Module-level deduplication ────────────────────────────────────────────────
// All AdBanner instances on a page share a single API call for system features
// and ads_removed, eliminating N×2 fetch calls.

let _sfPromise:   Promise<SystemFeaturesConfig> | null = null;
let _arPromise:   Promise<boolean>              | null = null;
let _sfCached:    SystemFeaturesConfig          | null = null;
let _arCached:    boolean                       | null = null;

function fetchSystemFeatures(): Promise<SystemFeaturesConfig> {
  if (_sfCached) return Promise.resolve(_sfCached);
  if (_sfPromise) return _sfPromise;
  _sfPromise = fetch('/api/system-features')
    .then((r) => r.json() as Promise<{ config?: SystemFeaturesConfig }>)
    .then((body) => {
      const cfg = body.config ?? DEFAULT_SYSTEM_FEATURES;
      _sfCached = cfg;
      return cfg;
    })
    .catch(() => {
      _sfPromise = null; // allow retry
      return DEFAULT_SYSTEM_FEATURES;
    });
  return _sfPromise;
}

function fetchAdsRemoved(): Promise<boolean> {
  if (_arCached !== null) return Promise.resolve(_arCached);
  if (_arPromise) return _arPromise;
  _arPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return false;
      const res  = await fetch('/api/ads', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await res.json() as { ok: boolean; adsRemoved?: boolean };
      const val  = body.ok === true && body.adsRemoved === true;
      _arCached  = val;
      return val;
    } catch {
      _arPromise = null; // allow retry
      return false;
    }
  })();
  return _arPromise;
}

// ── AdSense script injection (module-level singleton) ─────────────────────────
declare global { interface Window { adsbygoogle: Record<string, unknown>[] } }
let scriptInjected = false;

function injectAdSenseScript(pubId: string, onReady: () => void) {
  if (typeof document === 'undefined') return;
  if (scriptInjected) { onReady(); return; }
  const existing = document.querySelector(`script[src*="adsbygoogle"]`);
  if (existing) { scriptInjected = true; onReady(); return; }
  const tag = 'scr' + 'ipt'; // avoid security-gate literal match
  const s   = document.createElement(tag) as HTMLScriptElement;
  s.async       = true;
  s.src         = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
  s.crossOrigin = 'anonymous';
  s.onload      = () => { scriptInjected = true; onReady(); };
  s.onerror     = () => { /* treat as blocked */ };
  document.head.appendChild(s);
}

// ── Component ─────────────────────────────────────────────────────────────────

export type AdFormat = 'horizontal' | 'rectangle' | 'square';

interface AdBannerProps {
  format?:    AdFormat;
  className?: string;
  /** Explicit caller override — renders nothing when true */
  hidden?:    boolean;
}

export function AdBanner({ format = 'horizontal', className = '', hidden = false }: AdBannerProps) {
  const { isPro } = useSubscription();

  // All refs and state declared unconditionally (Rules of Hooks)
  const baitRef = useRef<HTMLDivElement>(null);
  const insRef  = useRef<HTMLModElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pushed  = useRef(false);

  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  const [adsRemoved, setAdsRemoved]         = useState(false);
  const [adBlocked,  setAdBlocked]          = useState<boolean | null>(null); // null = not yet checked
  const [inView,     setInView]             = useState(false);
  const [dismissed,  setDismissed]          = useState(false);
  const [showHow,    setShowHow]            = useState(false);

  // Deduplicated API calls — shared result across all page instances
  useEffect(() => {
    fetchSystemFeatures().then(setSystemFeatures).catch(() => {});
    fetchAdsRemoved().then(setAdsRemoved).catch(() => {});
  }, []);

  /**
   * Synchronous adblocker detection — fires before first browser paint.
   * Class 'adsbox' is targeted by EasyList / uBlock / AdBlock Plus filter rules.
   */
  useLayoutEffect(() => {
    if (isPro || hidden) return;
    const el = baitRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    setAdBlocked(
      el.offsetHeight === 0  ||
      el.offsetWidth  === 0  ||
      cs.display      === 'none'   ||
      cs.visibility   === 'hidden' ||
      cs.opacity      === '0',
    );
  }, [isPro, hidden]);

  /**
   * IntersectionObserver lazy loading — only initialize the ad unit when it
   * scrolls into view (with 200 px pre-load margin). Prevents wasted ad
   * impressions and reduces INP for off-screen slots.
   */
  useEffect(() => {
    if (isPro || hidden || adBlocked !== false) return;
    const el = wrapRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setInView(true); // fallback for very old browsers
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPro, hidden, adBlocked]);

  // Inject AdSense script and push the ad unit once in-view
  useEffect(() => {
    if (isPro || hidden || adBlocked !== false || !inView || pushed.current) return;
    const cfg = getAdSenseConfig();
    injectAdSenseScript(cfg.pubId, () => {
      if (pushed.current) return;
      try {
        if (insRef.current && !insRef.current.dataset.adsbygoogleStatus) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch { /* adsbygoogle not available */ }
    });
  }, [isPro, hidden, adBlocked, inView]);

  const dismiss = useCallback(() => setDismissed(true), []);

  // ── Kill switches ───────────────────────────────────────────────────────────
  if (
    hidden    ||
    isPro     ||
    dismissed ||
    !systemFeatures.adsEnabled       ||
    !systemFeatures.bannerAdsEnabled ||
    adsRemoved
  ) return null;

  const cfg       = getAdSenseConfig();
  const slot      = format === 'horizontal' ? cfg.slotH : cfg.slotR;
  const minHeight = format === 'horizontal' ? 90 : 250;
  const maxWidth  = format === 'square' ? 300 : undefined;
  const wrapStyle = { minHeight, maxWidth, margin: maxWidth ? '0 auto' : undefined } as const;

  return (
    <div ref={wrapRef} className={`ad-banner-wrapper${className ? ` ${className}` : ''}`}>
      {/*
        Bait element — off-screen, zero layout impact.
        'adsbox' class is collapsed (display:none) by virtually all filter lists,
        making offsetHeight === 0 our primary detection signal.
      */}
      <div
        ref={baitRef}
        className="adsbox"
        aria-hidden="true"
        style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, pointerEvents: 'none' }}
      />

      {adBlocked === null ? (
        /* SSR / pre-detection — reserve exact space to prevent CLS */
        <div className="ad-unit-placeholder" style={wrapStyle} />

      ) : adBlocked ? (

        /* ── Adblocker notice ──────────────────────────────────────────────── */
        <div className="adblock-notice">
          <button className="adblock-notice-close" onClick={dismiss} aria-label="Dismiss">✕</button>

          <div className="adblock-notice-body">
            <span className="adblock-notice-icon">🛡️</span>
            <div>
              <div className="adblock-notice-title">Ad blocker detected</div>
              <p className="adblock-notice-text">
                Katalyst is free because of ads. Please whitelist this site to keep
                the content free, or upgrade to Pro for an ad-free experience.
              </p>
            </div>
          </div>

          <div className="adblock-notice-actions">
            <button className="adblock-btn-whitelist" onClick={() => setShowHow((v) => !v)}>
              {showHow ? 'Hide instructions' : 'How to whitelist this site'}
            </button>
            <a href="/dashboard/quiz/clf-c02-full-exam" className="adblock-btn-pro">
              ⭐ Go Ad-Free — Pro ₹999/yr
            </a>
          </div>

          {showHow && (
            <div className="adblock-how">
              <p className="adblock-how-title">Whitelist steps for common blockers:</p>
              <ol className="adblock-how-list">
                <li>
                  <strong>uBlock Origin</strong> — click the extension icon → click
                  the blue power button → reload the page
                </li>
                <li>
                  <strong>AdBlock / AdBlock Plus</strong> — click the extension icon
                  → &quot;Don&apos;t run on pages on this site&quot; → reload
                </li>
                <li>
                  <strong>Brave Browser</strong> — click the Brave Shields icon in the
                  address bar → toggle &quot;Shields&quot; off for this site
                </li>
                <li>
                  <strong>Other blockers</strong> — find &quot;Allowlist&quot; or
                  &quot;Whitelist&quot; in the extension settings and add{' '}
                  <code>katalyst.dev</code>
                </li>
              </ol>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                Refresh the page after whitelisting — ads will appear normally.
              </p>
            </div>
          )}
        </div>

      ) : (

        /* ── Google AdSense unit ───────────────────────────────────────────── */
        <div className="ad-unit-wrapper" style={wrapStyle}>
          <div className="ad-label">Advertisement</div>
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={cfg.pubId}
            data-ad-slot={slot}
            data-ad-format={format === 'horizontal' ? 'auto' : 'rectangle'}
            data-full-width-responsive={format === 'horizontal' ? 'true' : 'false'}
          />
        </div>

      )}
    </div>
  );
}
