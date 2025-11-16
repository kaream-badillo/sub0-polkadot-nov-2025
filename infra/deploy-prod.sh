#!/usr/bin/env bash

set -euo pipefail

# Simple production-like deployment using Docker Compose
# Requirements:
# - Pre-built images pushed to a registry
# - API_IMAGE and WEB_IMAGE set (or overridden in an .env file)

if [[ -z "${API_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "ERROR: You must set API_IMAGE and WEB_IMAGE (e.g. TODO_API_IMAGE, TODO_WEB_IMAGE) before running deploy-prod.sh"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/infra"

echo "# Starting prod stack with docker-compose.prod.yml"
docker compose -f docker-compose.prod.yml up -d


