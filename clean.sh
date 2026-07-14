#!/usr/bin/env bash
# Stops containers. Pass --volumes (or -v) to also delete the postgres/uploads volumes (destroys all data).
set -euo pipefail

cd "$(dirname "$0")"

if [[ "${1:-}" == "--volumes" || "${1:-}" == "-v" ]]; then
  read -p "This deletes all DB + uploads data. Type 'yes' to confirm: " confirm
  if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
  docker compose down -v
else
  docker compose down
fi
