#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"

echo "🔄 Updating repository (${BRANCH})..."
cd "${ROOT_DIR}"
git fetch --all --prune
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "🚀 Running deployment script..."
bash "${ROOT_DIR}/scripts/deploy-vps.sh"
