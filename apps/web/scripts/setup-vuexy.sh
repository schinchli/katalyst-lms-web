#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-vuexy.sh — Initialize Vuexy Next.js starter-kit as the web app base
#
# Run ONCE when setting up this repo on a new machine or after adding a new dev.
# After running, the apps/admin/ directory will have a working Vuexy Next.js app
# with our custom overrides applied on top.
#
# Usage:
#   cd apps/admin
#   bash scripts/setup-vuexy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

VUEXY_SOURCE="$(cd "$(dirname "$0")"/../../.. && pwd)/../vuexy-admin-v10.11.1"
VUEXY_BASE="$VUEXY_SOURCE/nextjs-version/typescript-version/starter-kit"
ADMIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VUEXY_VERSION_FILE="$ADMIN_DIR/.vuexy-version"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vuexy Admin — Child Theme Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$VUEXY_BASE" ]; then
  echo "❌  Vuexy source not found at: $VUEXY_BASE"
  echo "    Ensure vuexy-admin-v10.11.1 is at the expected location."
  exit 1
fi

echo "✔  Vuexy source found: $VUEXY_BASE"

# Copy Vuexy starter-kit files into apps/admin/
# We ONLY copy these directories — we NEVER modify them directly.
# Our code lives exclusively in src/@custom/ and src/configs/
VUEXY_DIRS=("src/@core" "src/@layouts" "src/components" "public")
for dir in "${VUEXY_DIRS[@]}"; do
  echo "→  Syncing $dir ..."
  rsync -a --delete "$VUEXY_BASE/$dir/" "$ADMIN_DIR/$dir/"
done

# Copy root config files (only if they don't already exist — preserve our overrides)
VUEXY_CONFIGS=("next.config.ts" "postcss.config.mjs" "tsconfig.json")
for cfg in "${VUEXY_CONFIGS[@]}"; do
  if [ ! -f "$ADMIN_DIR/$cfg" ]; then
    echo "→  Copying $cfg (first time only)"
    cp "$VUEXY_BASE/$cfg" "$ADMIN_DIR/$cfg"
  fi
done

# Record Vuexy version
VUEXY_VERSION=$(cat "$VUEXY_SOURCE/changelog.html" 2>/dev/null | grep -oP 'v[\d.]+' | head -1 || echo "v10.11.1")
echo "$VUEXY_VERSION" > "$VUEXY_VERSION_FILE"
echo "✔  Vuexy version recorded: $VUEXY_VERSION"

# Install dependencies
cd "$ADMIN_DIR"
npm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Setup complete!"
echo ""
echo "  Run:  npm run dev"
echo ""
echo "  ⚠️   NEVER edit files inside src/@core/ or src/@layouts/"
echo "       All customizations go in src/@custom/ only."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
