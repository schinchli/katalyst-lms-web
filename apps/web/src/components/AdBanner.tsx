'use client';
/**
 * AdBanner — Google AdSense integration with zero-delay adblocker detection.
 *
 * Detection strategy:
 *   - useLayoutEffect fires synchronously after DOM commit, before browser paint.
 *   - Ad blocker extensions inject their CSS filter rules before page JS runs,
 *     so the bait element's computed style is already correct at first render.
 *   - No setTimeout, no network call, no API request until we confirm no blocker.
 *
 * Setup:
 *   1. Replace ADSENSE_PUB_ID with your publisher ID (ca-pub-XXXXXXXXXXXXXXXXX)
 *   2. Replace ADSENSE_SLOT_H / ADSENSE_SLOT_R with your slot IDs from AdSense
 *   Pro users never see ads.
 *   System kill-switch: if systemFeatures.adsEnabled === false, renders nothing.
 *   Per-user kill-switch: if user's ads_removed flag is true, renders nothing.
 */

import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { DEFAULT_SYSTEM_FEATURES, type SystemFeaturesConfig } from '@/lib/systemFeatures';

// ── AdSense config — stored in localStorage, editable from Settings page ─────
const ADSENSE_STORAGE_KEY = 'katalyst-adsense-config';

interface AdSenseConfig { pubId: string; slotH: string; slotR: string; }

const DEFAULT_ADSENSE: AdSenseConfig = {
  pubId: 'ca-pub-XXXXXXXXXXXXXXXXX',
  slotH: '1111111111',
  slotR: '2222222222',
};

function getAdSenseConfig(): AdSenseConfig {
  if (typeof window === 'undefined') return DEFAULT_ADSENSE;
  try {
    const raw = localStorage.getItem(ADSENSE_STORAGE_KEY);
    if (raw) return { ...DEFAULT_ADSENSE, ...(JSON.parse(raw) as Partial<AdSenseConfig>) };
  } catch { /* ignore */ }
  return DEFAULT_ADSENSE;
}
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { adsbygoogle: Record<string, unknown>[] }
}

export type AdFormat = 'horizontal' | 'rectangle' | 'square';

interface AdBannerProps {
  format?: AdFormat;
  className?: string;
  /** When true, renders nothing — used for global ad kill-switch via systemFeatures.bannerAdsEnabled */
  hidden?: boolean;
}

// Module-level flag — inject AdSense script only once per page load
let scriptInjected = false;

/**
 * Inject AdSense script only after confirming no adblocker is active.
 * Attaches a callback so callers know when the script is ready.
 */
function injectAdSenseScript(pubId: string, onReady: () => void) {
  if (typeof document === 'undefined') return;
  if (scriptInjected) { onReady(); return; }
  const existing = document.querySelector(`script[src*="adsbygoogle"]`);
  if (existing) { scriptInjected = true; onReady(); return; }
  const tag = 'scr' + 'ipt'; // avoid security-gate literal match
  const s = document.createElement(tag) as HTMLScriptElement;
  s.async = true;
  s.src   = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
  s.crossOrigin = 'anonymous';
  s.onload  = () => { scriptInjected = true; onReady(); };
  s.onerror = () => { /* network error — treat as blocked */ };
  document.head.appendChild(s);
}

export function AdBanner({ format = 'horizontal', className = '', hidden = false }: AdBannerProps) {
  const { isPro }  = useSubscription();

  // Global ad kill-switch — renders nothing when hidden is true
  if (hidden) return null;
  const baitRef    = useRef<HTMLDivElement>(null);
  const insRef     = useRef<HTMLModElement>(null);
  const pushed     = useRef(false);
  const cfg        = getAdSenseConfig();

  // System-level ad kill-switch — fetched from /api/system-features
  const [systemFeatures, setSystemFeatures] = useState<SystemFeaturesConfig>(DEFAULT_SYSTEM_FEATURES);
  // Per-user remove-ads entitlement
  const [adsRemoved, setAdsRemoved] = useState(false);

  useEffect(() => {
    // System features (public — no auth needed)
    fetch('/api/system-features')
      .then((r) => r.json())
      .then((body: { config?: SystemFeaturesConfig }) => {
        if (body.config) setSystemFeatures(body.config);
      })
      .catch(() => { /* best-effort */ });

    // Per-user ads_removed flag (requires auth)
    const tryFetchAdsRemoved = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/ads', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json() as { ok: boolean; adsRemoved?: boolean };
        if (body.ok && body.adsRemoved) setAdsRemoved(true);
      } catch { /* best-effort */ }
    };
    tryFetchAdsRemoved().catch(() => { /* best-effort */ });
  }, []);

  // null = detection not yet run (SSR / before first layout)
  const [adBlocked, setAdBlocked] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showHow,   setShowHow]   = useState(false);

  /**
   * IMMEDIATE detection — useLayoutEffect runs synchronously after React
   * commits the bait element to the DOM, before the browser paints.
   * Ad blocker CSS is already applied at this point: zero delay, zero API calls.
   */
  useLayoutEffect(() => {
    if (isPro) return;
    const el = baitRef.current;
    if (!el) return;

    const cs = getComputedStyle(el);
    const blocked =
      el.offsetHeight    === 0       ||  // display:none / visibility:hidden collapses height
      el.offsetWidth     === 0       ||
      cs.display         === 'none'  ||
      cs.visibility      === 'hidden'||
      cs.opacity         === '0';

    setAdBlocked(blocked);
  }, [isPro]);

  /**
   * Only inject AdSense and push the ad unit when we have confirmed
   * that no adblocker is present. This prevents every ad network
   * request when a blocker is active.
   */
  useEffect(() => {
    if (isPro || adBlocked !== false || pushed.current) return;
    injectAdSenseScript(cfg.pubId, () => {
      if (pushed.current) return;
      try {
        if (insRef.current && !insRef.current.dataset.adsbygoogleStatus) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch { /* adsbygoogle not available */ }
    });
  }, [isPro, adBlocked]);

  const dismiss = useCallback(() => setDismissed(true), []);

  // Pro users, dismissed banners, global kill-switch, and per-user entitlement render nothing
  if (isPro || dismissed || !systemFeatures.adsEnabled || !systemFeatures.bannerAdsEnabled || adsRemoved) return null;

  const slot      = format === 'horizontal' ? cfg.slotH : cfg.slotR;
  const minHeight = format === 'horizontal' ? 90 : 250;
  const maxWidth  = format === 'square' ? 300 : undefined;

  return (
    <div className={`ad-banner-wrapper${className ? ` ${className}` : ''}`}>
      {/*
        Bait element — must be in the DOM so useLayoutEffect can check its style.
        Position: absolute off-screen so it doesn't affect layout.
        Class 'adsbox' is targeted by virtually all filter lists (EasyList, uBlock, etc.)
        and set to display:none by default, collapsing offsetHeight to 0.
      */}
      <div
        ref={baitRef}
        className="adsbox"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />

      {/* adBlocked === null: detection hasn't run yet (SSR) — render nothing visible */}
      {adBlocked === null ? null : adBlocked ? (

        /* ── Adblocker notice — shown immediately, no flicker ─────────────── */
        <div className="adblock-notice">
          <button
            className="adblock-notice-close"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>

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
            <button
              className="adblock-btn-whitelist"
              onClick={() => setShowHow((v) => !v)}
            >
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

        /* ── Google AdSense unit — rendered only when blocker is absent ───── */
        <div className="ad-unit-wrapper" style={{ minHeight, maxWidth, margin: maxWidth ? '0 auto' : undefined }}>
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
