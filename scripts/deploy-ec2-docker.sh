#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/zamindar-plus}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
RELEASE_ARCHIVE="${RELEASE_ARCHIVE:-}"

echo "Deploying Zamindar Plus from ${APP_DIR}..."

mkdir -p "$APP_DIR"

if [ -n "$RELEASE_ARCHIVE" ]; then
  if [ ! -f "$RELEASE_ARCHIVE" ]; then
    echo "Missing release archive: ${RELEASE_ARCHIVE}" >&2
    exit 1
  fi

  if [ -f "$APP_DIR/$ENV_FILE" ]; then
    cp "$APP_DIR/$ENV_FILE" "/tmp/zamindar-plus-env.backup"
  fi

  find "$APP_DIR" -mindepth 1 -maxdepth 1 ! -name "$ENV_FILE" -exec rm -rf {} +
  tar -xzf "$RELEASE_ARCHIVE" -C "$APP_DIR"

  if [ -f "/tmp/zamindar-plus-env.backup" ]; then
    mv "/tmp/zamindar-plus-env.backup" "$APP_DIR/$ENV_FILE"
  fi
else
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"

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
