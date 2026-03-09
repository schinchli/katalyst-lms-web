# Security Headers — Katalyst LMS

> **Applied in:** `apps/web/next.config.ts` — all routes via `source: '/(.*)'`
> **Last reviewed:** 2026-03-09

---

## Configured Headers

### 1. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- **Purpose:** Forces HTTPS for 2 years. Prevents SSL-stripping attacks.
- **preload:** Submitted to browser HSTS preload list — HTTP is refused even on first visit.
- **Rule:** 231, 232

---

### 2. Content-Security-Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  https://checkout.razorpay.com
  https://pagead2.googlesyndication.com
  https://partner.googleadservices.com
  https://tpc.googlesyndication.com
  https://www.google.com/recaptcha/
  https://www.gstatic.com/recaptcha/
  https://recaptcha.google.com/recaptcha/;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self'
  https://katalyst-supabase-proxy.schinchli5801.workers.dev
  wss://katalyst-supabase-proxy.schinchli5801.workers.dev
  https://*.supabase.co wss://*.supabase.co
  https://www.google.com/recaptcha/
  https://recaptcha.google.com/recaptcha/;
frame-src
  https://api.razorpay.com
  https://googleads.g.doubleclick.net
  https://tpc.googlesyndication.com
  https://www.google.com/recaptcha/
  https://recaptcha.google.com/recaptcha/;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

**Key directives:**
| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src 'self'` | All unlisted resource types blocked | Deny-by-default posture |
| `script-src 'unsafe-inline' 'unsafe-eval'` | Required by Next.js 15 App Router hydration | Mitigated by other controls |
| `frame-ancestors 'none'` | Blocks all iframe embedding | Prevents clickjacking |
| `object-src 'none'` | No plugins (Flash, PDF readers) | Eliminates plugin attack surface |
| `upgrade-insecure-requests` | Rewrites HTTP → HTTPS | Prevents mixed content |
| `base-uri 'self'` | Prevents base tag hijacking | XSS mitigation |
| `form-action 'self'` | Forms only submit to same origin | Prevents data exfiltration |

**Rules:** 61–80

**Known trade-off:** `unsafe-inline` and `unsafe-eval` are required by Next.js 15's App Router for
React hydration and dynamic chunk loading. This is a framework constraint. Mitigated by:
- All user input is escaped by React's JSX renderer
- No `dangerouslySetInnerHTML` used
- No `eval()` in application code

---

### 3. X-Frame-Options
```
X-Frame-Options: DENY
```
- **Purpose:** Prevents this app from being embedded in any iframe on any origin.
- **DENY** is stricter than `SAMEORIGIN` — chosen because there is no legitimate use case
  for embedding Katalyst pages inside frames.
- **Rule:** 44, 45, 68

---

### 4. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- **Purpose:** Prevents browsers from MIME-sniffing responses away from the declared `Content-Type`.
  Stops attacks where a `.txt` file containing JavaScript is executed as a script.
- **Rule:** 36

---

### 5. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- **Purpose:** Sends full URL as referrer within the same origin; only the origin (no path/query)
  when navigating cross-origin. Prevents leaking quiz IDs or user tokens in referrer headers
  to third-party analytics.
- **Rule:** 17, 48

---

### 6. Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```
- **Purpose:** Disables browser features this app never needs. Prevents a compromised third-party
  script from silently activating camera or mic.
- `interest-cohort=()` opts out of Google's FLoC / Topics API.
- **Rule:** 14

---

### 7. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- **Purpose:** Legacy XSS auditor header for older browsers. Modern browsers ignore it but
  it provides defence-in-depth for IE 11 / Edge Legacy users.
- **Rule:** 54–57

---

### 8. X-DNS-Prefetch-Control
```
X-DNS-Prefetch-Control: on
```
- **Purpose:** Allows browser to pre-resolve DNS for linked domains, improving performance
  without security trade-offs in this app's context.

---

## What Is NOT Configured (and Why)

| Header | Reason Not Configured |
|--------|----------------------|
| `Cross-Origin-Opener-Policy` | Would break Google reCAPTCHA popup flow |
| `Cross-Origin-Embedder-Policy` | Incompatible with Google Fonts and AdSense cross-origin resources |
| `Cross-Origin-Resource-Policy` | Vercel handles this at CDN layer |
| `Report-To` / `NEL` | No CSP violation reporting endpoint implemented yet |

---

## Verification

Test headers live at: https://securityheaders.com/?q=https://lms-amber-two.vercel.app

Expected grade: **A** (unsafe-inline penalty may lower to A- on some graders)
