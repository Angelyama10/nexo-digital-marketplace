#!/bin/sh

set -eu

PROJECT_NAME="nexo-audit-run"
COMPOSE_FILE="docker-compose.audit.yml"
AUDIT_APP_PORT="${AUDIT_APP_PORT:-3012}"
export AUDIT_APP_PORT

compose() {
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

cleanup() {
  compose down --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

echo "[1/8] Construyendo backend y frontend en Linux..."
compose build audit-unit audit-frontend-build

echo "[2/8] Iniciando PostgreSQL y Redis aislados..."
compose up -d --wait audit-postgres audit-redis

echo "[3/8] Aplicando migraciones en la base temporal..."
compose run --rm audit-migrate

echo "[4/8] Ejecutando pruebas unitarias..."
compose run --rm --no-deps audit-unit

echo "[5/8] Ejecutando pruebas de integración y concurrencia..."
compose run --rm --no-deps audit-integration

echo "[6/8] Ejecutando pruebas HTTP E2E y límites de API..."
compose run --rm --no-deps audit-e2e

echo "[7/8] Ejecutando pruebas de seguridad..."
compose run --rm --no-deps audit-security

echo "[8/8] Ejecutando smoke load contra la aplicación aislada..."
compose up -d --wait audit-app
compose run --rm --no-deps -e LOAD_PROFILE=smoke audit-load

echo "Auditoría principal completada correctamente."
