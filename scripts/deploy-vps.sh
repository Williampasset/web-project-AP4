#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.vps.yml"
ENV_FILE="${ROOT_DIR}/.env.vps"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "❌ Missing ${ENV_FILE}."
  echo "Create it from .env.vps.example:"
  echo "  cp ${ROOT_DIR}/.env.vps.example ${ENV_FILE}"
  exit 1
fi

echo "🚀 Building and deploying stack..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build

echo "✅ Deployment complete"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "📋 Last backend logs:"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail=80 backend
