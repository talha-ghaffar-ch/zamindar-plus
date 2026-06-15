#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/zamindar-plus}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

echo "Deploying Zamindar Plus from ${APP_DIR}..."

cd "$APP_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing ${ENV_FILE}. Create it on the EC2 server before deploying." >&2
  exit 1
fi

echo "Building and starting Docker services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "Removing unused Docker images..."
docker image prune -f

echo "Deployment status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Deployment finished."
