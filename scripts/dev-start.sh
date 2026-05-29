#!/usr/bin/env bash
# ============================================================
# dev-start.sh — Levanta el entorno completo de desarrollo
# Uso: bash scripts/dev-start.sh
# ============================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "🔷 [1/4] Iniciando CockroachDB..."
pkill cockroach 2>/dev/null || true
sleep 1
cockroach start-single-node --insecure \
  --store="$HOME/.aira-cockroach-data" \
  --listen-addr=localhost:26257 \
  --http-addr=localhost:8082 \
  > /tmp/cockroach.log 2>&1 &
sleep 4

echo "🔷 [2/4] Aplicando migrations..."
cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS aira;" 2>&1

for f in $(ls "$ROOT/database/ddl/"*.sql | sort); do
  cockroach sql --insecure --database=aira < "$f" > /dev/null 2>&1 || true
done
for f in $(ls "$ROOT/database/funciones/"*.sql | sort); do
  cockroach sql --insecure --database=aira < "$f" > /dev/null 2>&1 || true
done
cockroach sql --insecure --database=aira < "$ROOT/database/seed_dev.sql" > /dev/null 2>&1 || true
echo "   Migrations aplicadas ✓"

echo "🔷 [3/4] Iniciando backend Go (puerto 9000)..."
pkill -f "cmd/aira/main.go" 2>/dev/null || true
kill $(lsof -i :9000 -t 2>/dev/null) 2>/dev/null || true
sleep 1
(cd "$ROOT/backend" && PORT=9000 go run ./cmd/aira/main.go > /tmp/aira-backend.log 2>&1) &
sleep 4
echo "   Backend en :9000 ✓"

echo "🔷 [4/4] Iniciando frontend Vite (puerto 5173)..."
kill $(lsof -i :5173 -t 2>/dev/null) 2>/dev/null || true
(cd "$ROOT/frontend" && npm run dev > /tmp/aira-frontend.log 2>&1) &
sleep 3
echo "   Frontend en :5173 ✓"

echo ""
echo "✅ Entorno listo:"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:9000"
echo "   Login    → admin@aira.com / Aira2026!"
echo ""
echo "   Logs: /tmp/cockroach.log, /tmp/aira-backend.log, /tmp/aira-frontend.log"
