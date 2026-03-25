#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "$0")/.." && pwd)"

echo "[dev] Starting backend (npm run dev)..."
(cd "$ROOT_DIR/backend" && npm run dev) &
BACK_PID=$!

echo "[dev] Starting frontend (npm run dev)..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONT_PID=$!

trap 'echo "[dev] Stopping..."; kill $BACK_PID $FRONT_PID 2>/dev/null || true' INT TERM
wait $BACK_PID $FRONT_PID
