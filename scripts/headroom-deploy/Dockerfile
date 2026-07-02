# Headroom compression proxy — lean image (no torch/transformers).
# Serves /v1/compress (used by the LMS RAG's withHeadroom wiring) + /stats.
FROM python:3.12-slim

RUN pip install --no-cache-dir "headroom-ai[proxy,code]"

ENV HEADROOM_HOST=0.0.0.0 \
    HEADROOM_PORT=8080

EXPOSE 8080
# Health: GET /livez.  Compression endpoint: POST /v1/compress.
CMD ["headroom", "proxy", "--host", "0.0.0.0", "--port", "8080"]
