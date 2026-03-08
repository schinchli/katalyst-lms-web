import type { NextConfig } from 'next';

const securityHeaders = [
  // OWASP A05 Security Misconfiguration mitigations
  { key: 'X-DNS-Prefetch-Control',          value: 'on' },
  { key: 'X-Frame-Options',                 value: 'DENY' },            // stronger than SAMEORIGIN
  { key: 'X-Content-Type-Options',          value: 'nosniff' },
  { key: 'Referrer-Policy',                 value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',              value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security',       value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection',               value: '1; mode=block' },
  // Content Security Policy — MITRE ATT&CK T1059 (script injection) mitigation
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-inline + unsafe-eval required by Next.js 15 App Router
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://katalyst-supabase-proxy.schinchli5801.workers.dev wss://katalyst-supabase-proxy.schinchli5801.workers.dev https://*.supabase.co wss://*.supabase.co",
      "frame-src https://api.razorpay.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
