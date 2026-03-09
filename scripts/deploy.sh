#!/usr/bin/env bash
# =============================================================================
# Katalyst LMS — Deploy Script
# =============================================================================
# Runs the full security gate, then deploys to Vercel production.
#
# Usage:
#   bash scripts/deploy.sh              # Full gate + deploy
#   bash scripts/deploy.sh --skip-build # Full gate (no Next.js build) + deploy
#
# The gate runs in --full mode (TypeScript + secrets + patterns + API checks +
# mock data + untracked + password strength + security headers + RLS +
# vercelignore + npm audit + backend tests + Next.js build).
#
# If any check fails, the deploy is blocked and you must fix the issue first.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GATE="$REPO_ROOT/scripts/security-gate.sh"

SKIP_BUILD=0
if [ "${1:-}" = "--skip-build" ]; then
  SKIP_BUILD=1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         KATALYST LMS — DEPLOY PIPELINE                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Step 1/2: Running full security gate..."
echo ""

if [ ! -f "$GATE" ]; then
  echo "ERROR: Security gate not found at scripts/security-gate.sh"
  exit 1
fi

chmod +x "$GATE"

if [ "$SKIP_BUILD" -eq 1 ]; then
  bash "$GATE" --ci
else
  bash "$GATE" --full
fi

echo ""
echo "  ✅ Security gate passed."
echo ""
echo "  Step 2/2: Deploying to Vercel (production)..."
echo ""

cd "$REPO_ROOT"
vercel --prod --yes

echo ""
echo "  ✅ Deploy complete."
echo "     Live at: https://lms-amber-two.vercel.app"
echo ""
