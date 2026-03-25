#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")/.." && pwd)"

echo "[build] Building backend..."
(cd "$ROOT_DIR/backend" && npm run build)

echo "[build] Building frontend..."
(cd "$ROOT_DIR/frontend" && npm run build)

echo "[build] Done."
