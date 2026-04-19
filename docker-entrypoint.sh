#!/bin/sh
set -e

echo "[VOID] Applying DB migrations..."
cd /app && pnpm --filter @workspace/db run push-force
echo "[VOID] DB ready."

exec node --enable-source-maps /app/dist/index.mjs
