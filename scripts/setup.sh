#!/usr/bin/env bash
set -euo pipefail

# Install backend and frontend dependencies
ROOT_DIR="$(cd -- "$(dirname "$0")/.." && pwd)"

echo "[setup] Installing backend deps..."
(cd "$ROOT_DIR/backend" && npm install)

echo "[setup] Installing frontend deps..."
(cd "$ROOT_DIR/frontend" && npm install)

echo "[setup] Done."
