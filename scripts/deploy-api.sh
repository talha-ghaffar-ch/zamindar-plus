#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/zamindar-plus}"
BRANCH="${BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-zamindar-plus-api}"

cd "$APP_DIR"

echo "Fetching latest code..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
CURRENT_COMMIT="$(git rev-parse HEAD)"
git pull --ff-only origin "$BRANCH"
NEW_COMMIT="$(git rev-parse HEAD)"

if [ ! -d node_modules ] || git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q '^package-lock\.json$'; then
  echo "Installing dependencies..."
  npm ci --no-audit --no-fund
else
  echo "Dependencies unchanged; skipping npm ci."
fi

echo "Generating Prisma client..."
npm run prisma:generate

echo "Applying database migrations..."
npm run prisma:migrate

echo "Building API..."
npm run build:api

echo "Restarting API..."
pm2 restart "$PM2_APP_NAME" --update-env
pm2 save

echo "Checking local API health..."
curl -fsS http://localhost:3000 >/dev/null

echo "API deployment complete."
