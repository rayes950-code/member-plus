#!/bin/sh
# Render entrypoint — seed demo data once on first boot, then run uvicorn.
#
# The seed is idempotent (wipes child rows first), so repeated runs reset
# the demo merchant to a clean populated state.
set -e

cd /app

if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
    echo "[entrypoint] Ensuring demo merchant + seeding mock data..."
    python /app/backend/seed_demo.py || echo "[entrypoint] seed failed (continuing)"
fi

exec uvicorn main:app \
    --app-dir /app/backend/src/app-entrypoint \
    --host 0.0.0.0 \
    --port "${PORT:-8000}"
