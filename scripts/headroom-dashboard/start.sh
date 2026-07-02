#!/usr/bin/env bash
# Start the Headroom proxy + the performance dashboard together.
#   ./scripts/headroom-dashboard/start.sh
# Proxy → http://localhost:8787 · Dashboard → http://localhost:8799
set -euo pipefail

HB="$HOME/.headroom/venv/bin/headroom"
if [ ! -x "$HB" ]; then
  echo "Headroom not installed. Run:"
  echo "  python3 -m venv ~/.headroom/venv && ~/.headroom/venv/bin/pip install 'headroom-ai[all]'"
  exit 1
fi

# Start proxy if not already listening on 8787
if ! curl -s --max-time 2 http://localhost:8787/livez >/dev/null 2>&1; then
  echo "Starting Headroom proxy on :8787 …"
  nohup "$HB" proxy --port 8787 > "$HOME/.headroom/proxy.log" 2>&1 &
  sleep 4
fi
curl -s --max-time 3 http://localhost:8787/livez >/dev/null 2>&1 \
  && echo "✓ proxy live (http://localhost:8787)" || echo "⚠ proxy not responding — check ~/.headroom/proxy.log"

echo "Starting dashboard on :8799 … (Ctrl+C to stop)"
exec node "$(dirname "$0")/serve.mjs"
