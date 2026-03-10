#!/usr/bin/env bash
# =============================================================================
# Katalyst LMS — Security Gate
# =============================================================================
#
# Mandatory gate that blocks commits and deploys if any security or quality
# check fails. Runs automatically as a git pre-commit hook and before every
# Vercel deploy.
#
# Usage:
#   ./scripts/security-gate.sh              # Full gate (pre-deploy)
#   ./scripts/security-gate.sh --quick      # Fast checks only (pre-commit)
#   ./scripts/security-gate.sh --ci         # CI mode (all checks, no deploy)
#
# Exit codes:
#   0  — all checks passed
#   1  — one or more checks failed (commit/deploy blocked)
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
BACKEND_DIR="$REPO_ROOT/backend"
SRC_DIR="$WEB_DIR/src"
API_DIR="$SRC_DIR/app/api"

MODE="${1:-full}"   # quick | ci | full

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

PASS=0
FAIL=0
WARNINGS=0
FAILED_CHECKS=()

pass()    { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS + 1)); }
fail()    { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL + 1)); FAILED_CHECKS+=("$1"); }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $1"; WARNINGS=$((WARNINGS + 1)); }
section() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
info()    { echo -e "  ${CYAN}→${RESET} $1"; }

header() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}║         KATALYST LMS — SECURITY GATE ($MODE)$(printf '%*s' $((24-${#MODE})) '')║${RESET}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

summary() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
  echo -e "${BOLD} GATE SUMMARY${RESET}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
  echo -e "  ${GREEN}Passed:${RESET}   $PASS"
  echo -e "  ${YELLOW}Warnings:${RESET} $WARNINGS"
  echo -e "  ${RED}Failed:${RESET}   $FAIL"

  if [ ${#FAILED_CHECKS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}${BOLD} BLOCKED — Fix these issues before proceeding:${RESET}"
    for check in "${FAILED_CHECKS[@]}"; do
      echo -e "  ${RED}•${RESET} $check"
    done
    echo ""
    echo -e "${RED}${BOLD} Commit/deploy has been BLOCKED.${RESET}"
    echo ""
    exit 1
  fi

  echo ""
  echo -e "${GREEN}${BOLD} All checks passed. Gate is open.${RESET}"
  echo ""
}

# =============================================================================
# CHECK 1: TypeScript — zero errors
# =============================================================================
check_typescript() {
  section "TypeScript (tsc --noEmit)"
  if (cd "$WEB_DIR" && npx tsc --noEmit 2>&1 | head -20); then
    pass "TypeScript: zero errors"
  else
    fail "TypeScript: type errors found — fix before committing"
  fi
}

# =============================================================================
# CHECK 2: Secret scan — no secrets in staged or tracked source files
# =============================================================================
check_secrets() {
  section "Secret Scan (staged files + src/)"

  # In pre-commit mode scan only staged files; in CI/full mode scan everything
  if [ "$MODE" = "quick" ]; then
    SCAN_TARGET=$(git -C "$REPO_ROOT" diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|env|sh|yml|yaml)$' || true)
  else
    SCAN_TARGET="$SRC_DIR"
  fi

  SECRET_PATTERNS=(
    "SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]ey"
    "sk_live_[A-Za-z0-9]"
    "rzp_live_[A-Za-z0-9]"
    "RECAPTCHA_SECRET_KEY\s*=\s*['\"][0-9A-Za-z]"
    "-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----"
    "ghp_[A-Za-z0-9]{36}"
    "xox[baprs]-[A-Za-z0-9]"
  )

  SECRET_FOUND=0
  for pattern in "${SECRET_PATTERNS[@]}"; do
    if [ "$MODE" = "quick" ] && [ -n "$SCAN_TARGET" ]; then
      HITS=$(echo "$SCAN_TARGET" | xargs grep -l -E "$pattern" 2>/dev/null || true)
    elif [ "$MODE" != "quick" ]; then
      HITS=$(grep -r -l -E "$pattern" "$SCAN_TARGET" 2>/dev/null || true)
    else
      HITS=""
    fi
    if [ -n "$HITS" ]; then
      fail "Secret pattern found: $pattern in: $HITS"
      SECRET_FOUND=1
    fi
  done
  [ "$SECRET_FOUND" -eq 0 ] && pass "No secrets found in source files"

  # Service role key must NEVER appear in client-side src except in /api/ routes
  CLIENT_LEAK=$(grep -r "SUPABASE_SERVICE_ROLE_KEY" "$SRC_DIR" --include="*.ts" --include="*.tsx" \
    --exclude-dir="api" -l 2>/dev/null || true)
  if [ -n "$CLIENT_LEAK" ]; then
    fail "SUPABASE_SERVICE_ROLE_KEY found outside /api/ routes: $CLIENT_LEAK"
  else
    pass "Service role key confined to API routes"
  fi
}

# =============================================================================
# CHECK 3: Dangerous patterns — XSS, browser dialogs, eval
# =============================================================================
check_dangerous_patterns() {
  section "Dangerous Patterns (XSS / eval / browser dialogs)"

  # dangerouslySetInnerHTML
  DAN=$(grep -r "dangerouslySetInnerHTML" "$SRC_DIR" --include="*.tsx" --include="*.ts" -l 2>/dev/null || true)
  if [ -n "$DAN" ]; then
    fail "dangerouslySetInnerHTML found (XSS risk): $DAN"
  else
    pass "No dangerouslySetInnerHTML"
  fi

  # window.confirm — should use custom modal
  CONFIRM=$(grep -r "window\.confirm\|if (confirm(" "$SRC_DIR" --include="*.tsx" --include="*.ts" -l 2>/dev/null || true)
  if [ -n "$CONFIRM" ]; then
    fail "window.confirm() found (use custom modal): $CONFIRM"
  else
    pass "No window.confirm() — inline confirm UI used"
  fi

  # eval() in source
  EVAL=$(grep -r "\beval(" "$SRC_DIR" --include="*.ts" --include="*.tsx" -l 2>/dev/null || true)
  if [ -n "$EVAL" ]; then
    fail "eval() found in source: $EVAL"
  else
    pass "No eval() in source"
  fi

  # document.createElement('script') — dynamic script injection
  DYNSCRIPT=$(grep -r "createElement('script')\|createElement(\"script\")" "$SRC_DIR" \
    --include="*.ts" --include="*.tsx" -l 2>/dev/null || true)
  if [ -n "$DYNSCRIPT" ]; then
    fail "Dynamic script injection found: $DYNSCRIPT"
  else
    pass "No dynamic script injection"
  fi

  # console.log in API routes (must use logger)
  CONSOLELOG=$(grep -r "console\.log" "$API_DIR" --include="*.ts" -l 2>/dev/null || true)
  if [ -n "$CONSOLELOG" ]; then
    warn "console.log in API routes — use logger.info instead: $CONSOLELOG"
  else
    pass "No console.log in API routes (logger used)"
  fi
}

# =============================================================================
# CHECK 4: API route security — rate limiting + payload limits on all routes
# =============================================================================
check_api_routes() {
  section "API Route Security (rate limits + payload limits)"

  ROUTES=$(find "$API_DIR" -name "route.ts" 2>/dev/null)
  ROUTES_WITH_POST=$(grep -l "export async function POST" $ROUTES 2>/dev/null || true)

  MISSING_RATELIMIT=()
  MISSING_PAYLOAD=()

  for route in $ROUTES; do
    ROUTE_NAME=$(echo "$route" | sed "s|$API_DIR/||")

    # All routes must have rate limiting
    if ! grep -q "checkRateLimit" "$route" 2>/dev/null; then
      MISSING_RATELIMIT+=("$ROUTE_NAME")
    fi
  done

  for route in $ROUTES_WITH_POST; do
    ROUTE_NAME=$(echo "$route" | sed "s|$API_DIR/||")
    # POST routes must have payload size check
    if ! grep -q "content-length\|Content-Length\|contentLength\|maxSize\|MAX_BODY" "$route" 2>/dev/null; then
      MISSING_PAYLOAD+=("$ROUTE_NAME")
    fi
  done

  if [ ${#MISSING_RATELIMIT[@]} -gt 0 ]; then
    for r in "${MISSING_RATELIMIT[@]}"; do
      fail "Missing rate limit in: $r"
    done
  else
    ROUTE_COUNT=$(echo "$ROUTES" | wc -l | tr -d ' ')
    pass "Rate limiting present on all $ROUTE_COUNT API routes"
  fi

  if [ ${#MISSING_PAYLOAD[@]} -gt 0 ]; then
    for r in "${MISSING_PAYLOAD[@]}"; do
      fail "Missing payload size limit in POST route: $r"
    done
  else
    POST_COUNT=$(echo "$ROUTES_WITH_POST" | grep -c "." 2>/dev/null || echo "0")
    pass "Payload size limits present on all POST routes ($POST_COUNT routes)"
  fi

  # Private routes must have auth check
  PRIVATE_WITHOUT_AUTH=()
  PRIVATE_ROUTES=$(grep -l "ADMIN_EMAILS\|admin-only\|requiresAuth\|private" $ROUTES 2>/dev/null || true)
  for route in $ROUTES; do
    ROUTE_NAME=$(echo "$route" | sed "s|$API_DIR/||")
    IS_PUBLIC=$(grep -q "public endpoint\|Public endpoint\|no auth" "$route" 2>/dev/null && echo "yes" || echo "no")
    HAS_AUTH=$(grep -q "auth.getUser\|Authorization\|access_token\|setup-token\|x-setup-token" "$route" 2>/dev/null && echo "yes" || echo "no")
    if [ "$IS_PUBLIC" = "no" ] && [ "$HAS_AUTH" = "no" ]; then
      PRIVATE_WITHOUT_AUTH+=("$ROUTE_NAME")
    fi
  done
  if [ ${#PRIVATE_WITHOUT_AUTH[@]} -gt 0 ]; then
    for r in "${PRIVATE_WITHOUT_AUTH[@]}"; do
      warn "Route may be missing auth — verify intentionally public: $r"
    done
  else
    pass "All non-public routes have authentication"
  fi
}

# =============================================================================
# CHECK 5: No mock/hardcoded data in source (leaderboard stubs, fake scores, etc.)
# =============================================================================
check_mock_data() {
  section "Hardcoded / Mock Data Detection"

  MOCK_PATTERNS=(
    "Alex Chen.*score"
    "Sarah Kim.*score"
    "Raj Patel.*score"
    "mock.*leaderboard\|leaderboard.*mock"
    "fake.*user\|user.*fake"
    "window\.confirm"
    "1\.2k students"
    "10,000\+ learners"
    "Join.*learners.*paid"
  )

  MOCK_FOUND=0
  for pattern in "${MOCK_PATTERNS[@]}"; do
    HITS=$(grep -r -l -i -E "$pattern" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      fail "Hardcoded mock data found ('$pattern') in: $HITS"
      MOCK_FOUND=1
    fi
  done
  [ "$MOCK_FOUND" -eq 0 ] && pass "No hardcoded mock data detected"

  # Backup files should not exist in src/
  BACKUPS=$(find "$SRC_DIR" -name "*_backup_*" 2>/dev/null || true)
  if [ -n "$BACKUPS" ]; then
    fail "Backup files found in src/ — delete before committing: $BACKUPS"
  else
    pass "No backup files in src/"
  fi
}

# =============================================================================
# CHECK 6: Untracked source files (nothing should be silently untracked)
# =============================================================================
check_untracked() {
  section "Untracked Source Files"

  UNTRACKED=$(git -C "$REPO_ROOT" status --short apps/web/src/ 2>/dev/null | grep "^??" | grep -v ".next/" || true)
  if [ -n "$UNTRACKED" ]; then
    fail "Untracked files in apps/web/src/ — stage or gitignore:\n$UNTRACKED"
  else
    pass "No untracked source files"
  fi
}

# =============================================================================
# CHECK 7: Password strength validation exists on signup
# =============================================================================
check_password_strength() {
  section "Password Strength Enforcement"

  SIGNUP="$SRC_DIR/app/signup/page.tsx"
  if [ -f "$SIGNUP" ]; then
    HAS_MIN=$(grep -q "\.length < 12\|length >= 12\|minLength.*12\|min.*12" "$SIGNUP" && echo "yes" || echo "no")
    HAS_UPPER=$(grep -q "\[A-Z\]" "$SIGNUP" && echo "yes" || echo "no")
    HAS_LOWER=$(grep -q "\[a-z\]" "$SIGNUP" && echo "yes" || echo "no")
    HAS_NUMBER=$(grep -q "\[0-9\]" "$SIGNUP" && echo "yes" || echo "no")
    HAS_SPECIAL=$(grep -q "A-Za-z0-9\]" "$SIGNUP" && echo "yes" || echo "no")

    WEAK=0
    [ "$HAS_MIN" = "no" ]     && { fail "Signup: missing minimum password length (12)"; WEAK=1; }
    [ "$HAS_UPPER" = "no" ]   && { fail "Signup: missing uppercase requirement"; WEAK=1; }
    [ "$HAS_LOWER" = "no" ]   && { fail "Signup: missing lowercase requirement"; WEAK=1; }
    [ "$HAS_NUMBER" = "no" ]  && { fail "Signup: missing numeric requirement"; WEAK=1; }
    [ "$HAS_SPECIAL" = "no" ] && { fail "Signup: missing special character requirement"; WEAK=1; }
    [ "$WEAK" -eq 0 ] && pass "Password strength: min-12, upper, lower, number, special all enforced"
  else
    warn "Signup page not found at expected path — skipping password check"
  fi
}

# =============================================================================
# CHECK 8: Security headers present in next.config.ts
# =============================================================================
check_security_headers() {
  section "Security Headers (next.config.ts)"

  NEXT_CONFIG="$WEB_DIR/next.config.ts"
  if [ ! -f "$NEXT_CONFIG" ]; then
    fail "next.config.ts not found"
    return
  fi

  HEADERS=(
    "Strict-Transport-Security"
    "Content-Security-Policy"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "Referrer-Policy"
    "Permissions-Policy"
    "frame-ancestors"
    "object-src 'none'"
  )

  MISSING_HEADERS=()
  for header in "${HEADERS[@]}"; do
    if ! grep -q "$header" "$NEXT_CONFIG" 2>/dev/null; then
      MISSING_HEADERS+=("$header")
    fi
  done

  if [ ${#MISSING_HEADERS[@]} -gt 0 ]; then
    for h in "${MISSING_HEADERS[@]}"; do
      fail "Missing security header: $h"
    done
  else
    pass "All required security headers configured"
  fi
}

# =============================================================================
# CHECK 9: RLS — setup-db route has RLS enabled on all tables
# =============================================================================
check_rls() {
  section "Row Level Security (RLS)"

  SETUP_DB="$API_DIR/setup-db/route.ts"
  if [ ! -f "$SETUP_DB" ]; then
    warn "setup-db/route.ts not found — cannot verify RLS"
    return
  fi

  TABLES=("user_profiles" "quiz_results" "subscriptions" "unlocked_courses" "purchases")
  RLS_MISSING=()
  for table in "${TABLES[@]}"; do
    if ! grep -q "ENABLE ROW LEVEL SECURITY.*$table\|$table.*ENABLE ROW LEVEL SECURITY\|ENABLE ROW LEVEL SECURITY" "$SETUP_DB" 2>/dev/null; then
      # Check if setup-db just has one blanket RLS enablement
      if ! grep -q "ENABLE ROW LEVEL SECURITY" "$SETUP_DB" 2>/dev/null; then
        RLS_MISSING+=("$table")
      fi
    fi
  done

  RLS_COUNT=$(grep -c "ENABLE ROW LEVEL SECURITY" "$SETUP_DB" 2>/dev/null || echo "0")
  if [ "$RLS_COUNT" -ge 5 ]; then
    pass "RLS enabled on all $RLS_COUNT tables"
  elif [ "$RLS_COUNT" -gt 0 ]; then
    warn "RLS enabled on $RLS_COUNT tables — verify all 5 core tables are covered"
  else
    fail "RLS not found in setup-db — all tables must have ROW LEVEL SECURITY"
  fi

  # Ensure no table has RLS explicitly disabled
  RLS_DISABLED=$(grep -n "DISABLE ROW LEVEL SECURITY" "$SETUP_DB" 2>/dev/null || true)
  if [ -n "$RLS_DISABLED" ]; then
    fail "RLS explicitly DISABLED — never acceptable: $RLS_DISABLED"
  else
    pass "No RLS DISABLE statements found"
  fi
}

# =============================================================================
# CHECK 10: npm audit — no high or critical vulnerabilities
# =============================================================================
check_npm_audit() {
  section "npm audit (high + critical vulnerabilities)"
  info "Running npm audit in apps/web/ ..."

  AUDIT_OUTPUT=$(cd "$WEB_DIR" && npm audit --audit-level=high --json 2>/dev/null || true)
  HIGH=$(echo "$AUDIT_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0))" 2>/dev/null || echo "0")
  CRIT=$(echo "$AUDIT_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo "0")

  if [ "$HIGH" != "0" ] || [ "$CRIT" != "0" ]; then
    fail "npm audit: $CRIT critical + $HIGH high vulnerabilities found — run 'npm audit fix'"
  else
    LOW=$(echo "$AUDIT_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('low',0))" 2>/dev/null || echo "?")
    MOD=$(echo "$AUDIT_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('moderate',0))" 2>/dev/null || echo "?")
    pass "No high/critical vulnerabilities ($MOD moderate, $LOW low — acceptable)"
  fi
}

# =============================================================================
# CHECK 11: Backend tests — all must pass
# =============================================================================
check_backend_tests() {
  section "Backend Tests (Jest)"
  if [ ! -d "$BACKEND_DIR" ]; then
    warn "Backend directory not found — skipping"
    return
  fi
  info "Running npm test in backend/ ..."
  if (cd "$BACKEND_DIR" && npm test --silent 2>&1 | tail -5); then
    pass "All backend tests passed"
  else
    fail "Backend tests failed — all tests must pass before deploy"
  fi
}

# =============================================================================
# CHECK 12: Next.js build — production build must succeed
# =============================================================================
check_build() {
  section "Next.js Production Build"
  info "Running next build in apps/web/ (this takes ~15s) ..."
  if (cd "$WEB_DIR" && NEXT_TELEMETRY_DISABLED=1 npx next build 2>&1 | tail -10); then
    pass "Next.js production build succeeded"
  else
    fail "Next.js build failed — fix build errors before deploying"
  fi
}

# =============================================================================
# CHECK 13: Vercelignore — sensitive directories excluded
# =============================================================================
check_vercelignore() {
  section "Vercel Upload Scope (.vercelignore)"

  VERCELIGNORE="$REPO_ROOT/.vercelignore"
  REQUIRED_EXCLUDES=("backend/" "mobile/" "infrastructure/" "supabase/" "*_backup_*" "*.md")
  MISSING=()

  for excl in "${REQUIRED_EXCLUDES[@]}"; do
    if ! grep -qF "$excl" "$VERCELIGNORE" 2>/dev/null; then
      MISSING+=("$excl")
    fi
  done

  if [ ${#MISSING[@]} -gt 0 ]; then
    for m in "${MISSING[@]}"; do
      fail "Missing from .vercelignore: $m"
    done
  else
    pass ".vercelignore correctly excludes sensitive directories"
  fi
}

# =============================================================================
# MAIN — run checks based on mode
# =============================================================================
header

# Quick mode (pre-commit hook): fast checks only
QUICK_CHECKS=(
  check_typescript
  check_secrets
  check_dangerous_patterns
  check_api_routes
  check_mock_data
  check_untracked
  check_password_strength
  check_security_headers
  check_rls
  check_vercelignore
)

# Additional checks for CI and full (pre-deploy) modes
HEAVY_CHECKS=(
  check_npm_audit
  check_backend_tests
)

# Build check only in full (pre-deploy) mode
DEPLOY_CHECKS=(
  check_build
)

for check in "${QUICK_CHECKS[@]}"; do
  $check
done

if [ "$MODE" = "ci" ] || [ "$MODE" = "full" ]; then
  for check in "${HEAVY_CHECKS[@]}"; do
    $check
  done
fi

if [ "$MODE" = "full" ]; then
  for check in "${DEPLOY_CHECKS[@]}"; do
    $check
  done
fi

summary
