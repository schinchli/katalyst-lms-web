# Headroom compression dashboard (localhost)

A zero-dependency localhost dashboard for **Headroom AI** compression performance —
tokens saved, savings %, compression ratio, request count, and a live savings-over-time chart.

## Run it

```bash
# 1. Start the Headroom proxy (compression happens here)
pip install "headroom-ai[all]"
headroom proxy --port 8787

# 2. Start this dashboard
node scripts/headroom-dashboard/serve.mjs

# 3. Open
open http://localhost:8799
```

The dashboard polls the proxy every 3s. Until traffic flows through Headroom it shows an
**offline / no-data** state with the exact start command — no crashes, no blank screen.

## Getting live numbers

Compression only registers once requests pass **through** the proxy. Point an app at it:

```bash
export HEADROOM_BASE_URL=http://localhost:8787   # the LMS RAG already reads this env var
```

Then run the LMS web app locally and use Ask AI — each RAG call routes its context through
Headroom and the dashboard lights up.

## Config

| Env | Default | Purpose |
|-----|---------|---------|
| `HEADROOM_URL` | `http://localhost:8787` | Where the Headroom proxy is listening |
| `PORT` | `8799` | Port for this dashboard |

Endpoints proxied: `/stats`, `/metrics` (Prometheus fallback), `/stats-history`, `/health`.
