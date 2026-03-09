#!/usr/bin/env bash
# =============================================================================
# Katalyst LMS — Install Git Hooks
# =============================================================================
# Installs the security gate as a git pre-commit hook.
# Run once after cloning: bash scripts/install-hooks.sh
# Or add "prepare": "bash scripts/install-hooks.sh" to root package.json
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
GATE="$REPO_ROOT/scripts/security-gate.sh"

echo "Installing Katalyst security gate hooks..."

# Make gate executable
chmod +x "$GATE"

# ── pre-commit hook ──────────────────────────────────────────────────────────
cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.sh
# Runs security-gate.sh --quick before every commit.
# To bypass in an emergency: git commit --no-verify (document the reason)

REPO_ROOT="$(git rev-parse --show-toplevel)"
GATE="$REPO_ROOT/scripts/security-gate.sh"

if [ ! -f "$GATE" ]; then
  echo "⚠️  Security gate not found at scripts/security-gate.sh — skipping"
  exit 0
fi

bash "$GATE" --quick
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "  ✓ pre-commit hook installed"

# ── pre-push hook ────────────────────────────────────────────────────────────
cat > "$HOOKS_DIR/pre-push" << 'HOOK'
#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.sh
# Runs security-gate.sh --ci before every git push.
# Catches anything the pre-commit hook might miss (tests, audit).

REPO_ROOT="$(git rev-parse --show-toplevel)"
GATE="$REPO_ROOT/scripts/security-gate.sh"

if [ ! -f "$GATE" ]; then
  echo "⚠️  Security gate not found at scripts/security-gate.sh — skipping"
  exit 0
fi

bash "$GATE" --ci
HOOK

chmod +x "$HOOKS_DIR/pre-push"
echo "  ✓ pre-push hook installed"

echo ""
echo "✅ Hooks installed. Security gate will run automatically on:"
echo "   git commit  →  --quick mode (TypeScript, secrets, patterns, API checks)"
echo "   git push    →  --ci mode    (+ backend tests, npm audit)"
echo "   deploy.sh   →  --full mode  (+ Next.js production build)"
echo ""
echo "Override (emergency only): git commit --no-verify"
echo "Document all bypasses in the commit message."
