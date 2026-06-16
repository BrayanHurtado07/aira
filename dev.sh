#!/usr/bin/env bash
# Levanta backend (Go) y frontend (Vite) en paralelo.
# Uso: ./dev.sh
# Ctrl+C detiene ambos procesos.

ROOT="$(cd "$(dirname "$0")" && pwd)"

BOLD="\033[1m"
RED="\033[1;31m"
BLUE="\033[1;34m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "${BOLD}▶ AIRA — entorno de desarrollo${RESET}"
echo ""

# ── Liberar puertos antes de iniciar ─────────────────────────────────────────
for PORT in 9000 5173 5174 5175; do
  PIDS=$(lsof -ti ":$PORT" 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}[dev]${RESET} Liberando puerto $PORT (PID $PIDS)…"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 0.5

# ── Backend ───────────────────────────────────────────────────────────────────
(
  cd "$ROOT/backend"
  echo -e "${RED}[backend]${RESET} Iniciando en :9000 …"
  make dev 2>&1 | sed "s/^/$(printf "${RED}[backend]${RESET}") /"
) &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
(
  cd "$ROOT/frontend"
  echo -e "${BLUE}[frontend]${RESET} Iniciando en :5173 …"
  npm run dev 2>&1 | sed "s/^/$(printf "${BLUE}[frontend]${RESET}") /"
) &
FRONTEND_PID=$!

# ── Limpieza al salir ─────────────────────────────────────────────────────────
trap 'echo ""; echo -e "${BOLD}Deteniendo…${RESET}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait' INT TERM

wait
