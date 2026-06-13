#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/zamindar-plus}"
BRANCH="${BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-zamindar-plus-api}"

cd "$APP_DIR"

echo "Fetching latest code..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Installing dependencies..."
npm ci

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
for attempt in {1..20}; do
  if curl -fsS http://localhost:3000 >/dev/null; then
    echo "API health check passed."
    echo "API deployment complete."
    exit 0
  fi

  echo "Waiting for API to start... ($attempt/20)"
  sleep 2
done

echo "API health check failed."
pm2 logs "$PM2_APP_NAME" --lines 80 --nostream
exit 1
