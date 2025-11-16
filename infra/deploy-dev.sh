#!/usr/bin/env bash

set -euo pipefail

# Simple dev deployment using Docker Compose
# Requirements:
# - Docker + docker compose
# - .env file at repo root (or export variables manually)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/infra"

echo "# Starting dev stack (API + web) with docker-compose.dev.yml"
docker compose -f docker-compose.dev.yml up --build


