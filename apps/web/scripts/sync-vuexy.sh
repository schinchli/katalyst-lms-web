#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# sync-vuexy.sh — Pull Vuexy theme updates WITHOUT breaking our customizations
#
# When Vuexy releases a new version:
#   1. Update the Vuexy source directory (replace vuexy-admin-v10.11.1/)
#   2. Run this script
#   3. Commit the diff (only Vuexy core files change, our src/@custom/ is untouched)
#
# Safe to run anytime. Our files in src/@custom/ and src/configs/ are NEVER touched.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

VUEXY_SOURCE="$(cd "$(dirname "$0")"/../../.. && pwd)/../vuexy-admin-v10.11.1"
VUEXY_BASE="$VUEXY_SOURCE/nextjs-version/typescript-version/starter-kit"
ADMIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vuexy Admin — Sync Theme Update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$VUEXY_BASE" ]; then
  echo "❌  Vuexy source not found. Ensure updated Vuexy is at: $VUEXY_BASE"
  exit 1
fi

# Sync ONLY the Vuexy core directories (never touch src/@custom/)
VUEXY_DIRS=("src/@core" "src/@layouts" "src/components" "public")
for dir in "${VUEXY_DIRS[@]}"; do
  echo "→  Syncing $dir ..."
  rsync -a --delete "$VUEXY_BASE/$dir/" "$ADMIN_DIR/$dir/"
done

# Record new version
VUEXY_VERSION=$(cat "$VUEXY_SOURCE/changelog.html" 2>/dev/null | grep -oP 'v[\d.]+' | head -1 || echo "unknown")
echo "$VUEXY_VERSION" > "$ADMIN_DIR/.vuexy-version"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Vuexy core updated to $VUEXY_VERSION"
echo ""
echo "  Next steps:"
echo "  1. Review the git diff: git diff src/@core src/@layouts src/components"
echo "  2. Update our theme overrides if Vuexy changed any API: src/@custom/"
echo "  3. Run: npm run dev  — verify the app still works"
echo "  4. Commit: git add -A && git commit -m 'chore: sync Vuexy $VUEXY_VERSION'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
