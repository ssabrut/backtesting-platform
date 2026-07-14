#!/usr/bin/env bash
# Runs backend + frontend + postgres via docker-compose.
set -euo pipefail

cd "$(dirname "$0")"

if lsof -nP -iTCP:5433 -sTCP:LISTEN >/dev/null 2>&1; then
  if ! docker compose ps --status running 2>/dev/null | grep -q postgres; then
    echo "Port 5433 is already in use by another process/container." >&2
    echo "Stop whatever's on 5433 first (e.g. 'docker stop <container>') or this project's postgres will fail to bind." >&2
    exit 1
  fi
fi

docker compose up --build "$@"
