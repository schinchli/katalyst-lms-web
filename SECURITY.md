# Security Policy — Katalyst LMS

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Yes |
| Older branches | ❌ No |

Only the current production deployment at **https://lms-amber-two.vercel.app** is actively maintained.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, report it privately:

1. **GitHub Private Advisory** (preferred): Go to the [Security tab](https://github.com/schinchli/katalyst-lms-web/security/advisories/new) and open a private advisory.
2. **Email:** Contact the maintainer directly via GitHub profile.

### What to include

- Type of vulnerability (XSS, SQL injection, authentication bypass, etc.)
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

### Response timeline

| Stage | Time |
|-------|------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 days |
| Fix and deploy | Within 14 days for critical issues |

We will keep you informed of progress and credit you in the release notes unless you prefer to remain anonymous.

---

## Security Controls

For a full description of security controls, see:

| Document | Contents |
|----------|---------|
| [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) | 300-rule compliance matrix |
| [`THREAT_MODEL.md`](./THREAT_MODEL.md) | STRIDE analysis + attack scenarios |
| [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md) | HTTP security headers |
| [`API_SECURITY_REPORT.md`](./API_SECURITY_REPORT.md) | Per-route security analysis |

### Summary

- **Authentication:** Supabase Auth (email + password, email verification required)
- **Authorization:** JWT verified server-side on every API route; RLS on all DB tables
- **Score integrity:** Server-side calculation only — client cannot submit fake scores
- **Rate limiting:** All 9 API routes rate-limited (10–60 req/min per IP)
- **Secret management:** All secrets in Vercel env vars; never in source code or git history
- **Security gate:** Every commit and deploy is gated by `scripts/security-gate.sh` (13 checks)
- **Dependency scanning:** Dependabot weekly alerts + automated PRs
- **Secret scanning:** GitHub secret scanning enabled + pre-commit hook scans staged files

---

## Out of Scope

The following are known trade-offs and are **not** considered vulnerabilities:

- Correct quiz answers are in the client-side JS bundle (by design — instant feedback UX)
- `unsafe-inline` in CSP is required by Next.js 15 App Router
- In-memory rate limiter may not hold across multiple Vercel function instances (single instance on Hobby plan)
