#!/usr/bin/env bash
# ====================================================================
# 🚀 ADAF Dashboard Pro — Inicio del Servidor (unificado)
# ====================================================================
# Objetivo: Arrancar ADAF (3000) y opcionalmente LAV (3005) con:
#  - Limpieza de puertos ocupados
#  - Instalación de dependencias si faltan
#  - Inicio de servidores con PIDs rastreables
#  - Readiness checks (/, /dashboard, /monitoring, /api/health)
#  - Salida amigable + tips de navegación y PageGuide
# ====================================================================
set -euo pipefail

# --- Configuración por defecto ---
MOCK_MODE=${MOCK_MODE:-1}
START_LAV=1            # 1 = también LAV (3005), 0 = solo ADAF
INSTALL_IF_MISSING=1   # 1 = instalar deps si faltan
OPEN_BROWSER=0         # 1 = abrir navegador
READY_TIMEOUT=60       # segundos
SILENT_INSTALL=1
DO_CLEAN=0             # 1 = limpiar .next y puertos (dev-reset)
DO_DB_PREPARE=0        # 1 = correr prisma generate/push y seed
HEALTH_ONLY=0          # 1 = no inicia servidores, solo verifica endpoints si están arriba
SMOKE=0                # 1 = ejecutar scripts/smoke-check.mjs al final
VERBOSE=0              # 1 = salida más detallada

# --- Utilería de colores ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${GREEN}[$(date '+%H:%M:%S')] $*${NC}"; }
warn(){ echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $*${NC}"; }
err() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $*${NC}"; }
inf() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $*${NC}"; }

usage(){
  cat <<EOF
Uso: $0 [opciones]

Opciones:
  --adaf-only          Inicia solo ADAF (puerto 3000)
  --lav                Fuerza iniciar LAV (3005) además de ADAF (por defecto ON)
  --no-lav             Desactiva LAV (solo ADAF)
  --no-install         No instala dependencias aunque falten
  --open               Abre el navegador al finalizar
  --timeout <seg>      Tiempo máximo para readiness checks (por defecto: ${READY_TIMEOUT}s)
  --clean              Limpia .next y libera puertos antes de iniciar
  --db-prepare         Ejecuta Prisma generate/push y seed (modo demo si no hay seed)
  --health-only        No inicia servidores; verifica que / y /api/health respondan si están corriendo
  --smoke              Corre scripts/smoke-check.mjs al final
  --verbose            Muestra salida detallada
  -h, --help           Muestra esta ayuda

Entorno:
  MOCK_MODE=${MOCK_MODE} (default 1)
EOF
}

for arg in "$@"; do
  case "$arg" in
    --adaf-only|--no-lav) START_LAV=0 ;;
    --lav) START_LAV=1 ;;
    --no-install) INSTALL_IF_MISSING=0 ;;
    --open) OPEN_BROWSER=1 ;;
  --timeout) shift; READY_TIMEOUT=${1:-60} ;;
  --clean) DO_CLEAN=1 ;;
  --db-prepare) DO_DB_PREPARE=1 ;;
  --health-only) HEALTH_ONLY=1 ;;
  --smoke) SMOKE=1 ;;
  --verbose) VERBOSE=1 ;;
    -h|--help) usage; exit 0 ;;
    *) ;;
  esac
  shift || true
done

# --- Helpers ---
have(){ command -v "$1" >/dev/null 2>&1; }
kill_port(){
  local port="$1"
  if have lsof && lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "Puerto ${port} ocupado, intentando liberar..."
    lsof -ti:"$port" | xargs -r kill -9 2>/dev/null || true
    sleep 1
  fi
}

curl_ok(){ curl -s -o /dev/null -w "%{http_code}" "$1"; }

wait_ready(){
  local name="$1"; local url="$2"; local timeout="$3"
  local start=$(date +%s)
  while true; do
    local code
    code=$(curl_ok "$url" || echo "000")
    # Aceptamos 200 (OK) y 503 (deep health con fallos pero server vivo)
    if [[ "$code" == "200" || "$code" == "503" ]]; then
      log "${name} listo (${url}) → ${code}"
      break
    fi
    local now=$(date +%s)
    if (( now - start > timeout )); then
      warn "Timeout de readiness para ${name} (${url}) → último código ${code}"
      break
    fi
    sleep 1
  done
}

install_if_needed(){
  local dir="$1"; local label="$2"
  if [[ ! -d "${dir}/node_modules" ]]; then
    if (( INSTALL_IF_MISSING == 1 )); then
      log "Instalando dependencias en ${label}..."
      if have pnpm; then
        if (( SILENT_INSTALL == 1 )); then (cd "$dir" && pnpm install --silent); else (cd "$dir" && pnpm install); fi
      else
        if (( SILENT_INSTALL == 1 )); then (cd "$dir" && npm install --silent); else (cd "$dir" && npm install); fi
      fi
    else
      warn "node_modules no existe en ${label}, pero --no-install está activo"
    fi
  fi
}

start_next_dev(){
  local dir="$1"; local port="$2"; local log_file="$3"
  pushd "$dir" >/dev/null
  # Ejecutamos el bin de next directamente para capturar PID estable
  if [[ -f node_modules/next/dist/bin/next ]]; then
    NODE_NEXT_BIN=node_modules/next/dist/bin/next
  else
    # Fallback al path global (si existiera)
    NODE_NEXT_BIN=$(command -v next || true)
  fi
  if [[ -z "${NODE_NEXT_BIN:-}" ]]; then
    err "No se encontró el binario de Next.js en ${dir}. ¿Instalaste dependencias?"
    popd >/dev/null; return 1
  fi
  NODE_ENV=development MOCK_MODE=$MOCK_MODE node "$NODE_NEXT_BIN" dev --port "$port" > "$log_file" 2>&1 &
  local pid=$!
  popd >/dev/null
  echo "$pid"
}

# --- Pre-flight checks ---
# Node version
if have node; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.') [0]")
  if [ "$NODE_MAJOR" -lt 20 ]; then
    warn "Se recomienda Node >= 20. Detectado: $(node -v)"
  fi
else
  err "Node no está instalado. Instálalo antes de continuar."; exit 1
fi

# .env.local bootstrap
if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
  warn ".env.local no existe. Creando a partir de .env.example..."
  cp .env.example .env.local
fi

# LAV presence auto-detect
if [ ! -d "lav-adaf/apps/dashboard" ]; then
  START_LAV=0
fi

# --- Limpieza al salir ---
ADAF_PID=""; LAV_PID=""
cleanup(){
  echo ""; warn "Deteniendo servidores..."
  [[ -n "$ADAF_PID" ]] && kill "$ADAF_PID" 2>/dev/null || true
  [[ -n "$LAV_PID"  ]] && kill "$LAV_PID" 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM EXIT

# --- Inicio ---
echo "======================================================================"
echo "🚀 ADAF Dashboard Pro — Inicio del Servidor"
echo "======================================================================"
inf  "MOCK_MODE=${MOCK_MODE} | LAV=${START_LAV} | timeout=${READY_TIMEOUT}s | verbose=${VERBOSE}"

# Opcional: limpieza
if (( DO_CLEAN == 1 )); then
  if [ -f ./scripts/dev-reset.sh ]; then
    log "Limpiando caches y puertos (dev-reset)..."
    bash ./scripts/dev-reset.sh || true
  else
    warn "scripts/dev-reset.sh no encontrado; limpiando .next locales"
    rm -rf .next lav-adaf/apps/dashboard/.next 2>/dev/null || true
  fi
fi

# Opcional: DB prepare
if (( DO_DB_PREPARE == 1 )); then
  log "Preparando base de datos (Prisma)..."
  if have pnpm; then
    pnpm db:generate || true
    pnpm db:push || true
  else
    npm run db:generate || true
    npm run db:push || true
  fi
  # Seed
  if [ -f ./infra/seed.ts ]; then
    node -e "import('./infra/seed.ts').catch(e=>{console.error(e);process.exit(0)})" || true
  else
    inf "Seed no encontrado; continuando (modo demo)"
  fi
fi

# Puertos
kill_port 3000
if (( START_LAV == 1 )); then kill_port 3005; fi

# Dependencias
install_if_needed "." "ADAF (raíz)"
if (( START_LAV == 1 )); then install_if_needed "lav-adaf/apps/dashboard" "LAV (apps/dashboard)"; fi

# Arranque
if (( HEALTH_ONLY == 0 )); then
  log "Iniciando ADAF (3000)..."
  ADAF_PID=$(start_next_dev "." 3000 "adaf-dashboard.log")
  log "ADAF PID=${ADAF_PID} (log: adaf-dashboard.log)"

  if (( START_LAV == 1 )); then
    log "Iniciando LAV (3005)..."
    LAV_PID=$(start_next_dev "lav-adaf/apps/dashboard" 3005 "../../lav-adaf-dashboard.log")
    log "LAV PID=${LAV_PID} (log: lav-adaf-dashboard.log)"
  fi
fi

# Readiness
log "Esperando readiness..."
wait_ready "ADAF /"            "http://localhost:3000/"           "$READY_TIMEOUT"
wait_ready "ADAF /dashboard"   "http://localhost:3000/dashboard"  "$READY_TIMEOUT"
wait_ready "ADAF /monitoring"  "http://localhost:3000/monitoring" "$READY_TIMEOUT"
wait_ready "ADAF /api/health"  "http://localhost:3000/api/health?deep=1" "$READY_TIMEOUT"
wait_ready "ADAF /api/metrics" "http://localhost:3000/api/metrics" "$READY_TIMEOUT"
if (( START_LAV == 1 )); then
  wait_ready "LAV /" "http://localhost:3005/" "$READY_TIMEOUT"
fi

# Resumen
echo ""; log "¡Servidores listos!"
echo ""
echo "📊 ADAF (3000): http://localhost:3000"
echo "   • Monitoring:  http://localhost:3000/monitoring"
echo "   • Health API:  http://localhost:3000/api/health"
echo "   • Deep health: http://localhost:3000/api/health?deep=1"
if (( START_LAV == 1 )); then
  echo "🤖 LAV (3005):   http://localhost:3005"
fi

echo ""; echo "💡 Tips rápidos"
echo "   • Toggle de guías (✨) en TopBar → controla 'pageguide:always' (default ON)."
echo "   • Si ves '—' en 'as of …' o 'Last update', es normal: se actualiza al montar (hidratación segura)."
echo "   • Logs: tail -f adaf-dashboard.log  |  tail -f lav-adaf-dashboard.log"

if (( OPEN_BROWSER == 1 )); then
  if have xdg-open; then xdg-open "http://localhost:3000/dashboard" >/dev/null 2>&1 || true; fi
fi

# Opcional: Smoke checks
if (( SMOKE == 1 )); then
  if [ -f ./scripts/smoke-check.mjs ]; then
    log "Ejecutando smoke checks..."
    node ./scripts/smoke-check.mjs || warn "Smoke checks con fallos (no bloqueante)"
  fi
fi

# health-only mode termina aquí
if (( HEALTH_ONLY == 1 )); then
  log "Health-only finalizado."
  exit 0
fi

# Mantener vivo hasta Ctrl+C
wait "$ADAF_PID" ${LAV_PID:+"$LAV_PID"}
