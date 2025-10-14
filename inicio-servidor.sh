#!/bin/bash

# ====================================================================
# 🚀 ADAF Dashboard Pro — Servidor Unificado (Fusionado)
# ====================================================================
# Combina funcionalidad simple y avanzada:
# - Limpieza automática de puertos y cache
# - Verificación de conectividad robusta  
# - Opciones de configuración flexibles
# - Inicio de ADAF (3000) y LAV-ADAF (3005)
# ====================================================================

# --- Configuración por defecto ---
MOCK_MODE=${MOCK_MODE:-1}
START_LAV=${START_LAV:-1}
INSTALL_IF_MISSING=1
CLEAN_CACHE=1
READY_TIMEOUT=60
VERBOSE=0

usage(){
  cat <<HELP
🚀 ADAF Dashboard Pro - Servidor Unificado

Uso: $0 [opciones]

Opciones:
  --adaf-only          Solo ADAF (puerto 3000)
  --no-lav             Desactiva LAV
  --no-install         No instala dependencias
  --no-clean           No limpia cache
  --timeout <seg>      Timeout readiness (default: 60s)
  --verbose            Salida detallada
  -h, --help           Esta ayuda

Entorno: MOCK_MODE=${MOCK_MODE}
HELP
}

# Procesar argumentos
for arg in "$@"; do
  case "$arg" in
    --adaf-only|--no-lav) START_LAV=0 ;;
    --no-install) INSTALL_IF_MISSING=0 ;;
    --no-clean) CLEAN_CACHE=0 ;;
    --timeout) shift; READY_TIMEOUT=${1:-60} ;;
    --verbose) VERBOSE=1 ;;
    -h|--help) usage; exit 0 ;;
  esac
  shift || true
done

echo "🚀 Iniciando ADAF Dashboard Pro$([ $START_LAV -eq 1 ] && echo " + LAV-ADAF" || echo "")..."

# Función de limpieza al salir
cleanup() {
    local exit_code=${1:-0}
    echo ""
    echo "🛑 Deteniendo servidores..."
    
    # Terminar procesos suavemente primero
    [ ! -z "$PID1" ] && kill -TERM $PID1 2>/dev/null || true
    [ $START_LAV -eq 1 ] && [ ! -z "$PID2" ] && kill -TERM $PID2 2>/dev/null || true
    
    sleep 2
    
    # Forzar si es necesario
    [ ! -z "$PID1" ] && kill -9 $PID1 2>/dev/null || true
    [ $START_LAV -eq 1 ] && [ ! -z "$PID2" ] && kill -9 $PID2 2>/dev/null || true
    
    echo "✅ Servidores detenidos"
    exit $exit_code
}
trap cleanup SIGINT SIGTERM

# Función para limpiar puertos
check_and_kill_port() {
    local port=$1
    local pids=$(lsof -t -i:$port 2>/dev/null || true)
    
    if [ ! -z "$pids" ]; then
        echo "⚠️  Puerto $port ocupado. Cerrando procesos: $pids"
        # Primero intentar terminar suavemente
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        # Verificar si siguen activos y usar kill -9
        local remaining=$(lsof -t -i:$port 2>/dev/null || true)
        if [ ! -z "$remaining" ]; then
            echo "🔥 Forzando cierre en puerto $port..."
            echo "$remaining" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        echo "✅ Puerto $port liberado"
    else
        [ $VERBOSE -eq 1 ] && echo "✅ Puerto $port disponible"
    fi
}

# Función para limpiar procesos Node.js huérfanos
cleanup_node_processes() {
    echo "🧼 Limpiando procesos Node.js antiguos..."
    
    # Buscar y terminar procesos Next.js en puertos 3000 y 3005
    local next_processes=$(ps aux | grep -E "(next.*dev.*(3000|3005)|node.*next)" | grep -v grep | awk '{print $2}' || true)
    
    if [ ! -z "$next_processes" ]; then
        echo "🔄 Terminando procesos Next.js antiguos: $next_processes"
        echo "$next_processes" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Verificar si quedan procesos y forzar
        local remaining=$(ps aux | grep -E "(next.*dev.*(3000|3005)|node.*next)" | grep -v grep | awk '{print $2}' || true)
        if [ ! -z "$remaining" ]; then
            echo "$remaining" | xargs kill -9 2>/dev/null || true
        fi
    fi
    
    [ $VERBOSE -eq 1 ] && echo "✅ Procesos Node.js limpiados"
}

# Función para limpiar cache
clear_nextjs_cache() {
    if [ $CLEAN_CACHE -eq 1 ]; then
        echo "🧹 Limpiando cache de Next.js..."
        rm -rf .next node_modules/.cache 2>/dev/null || true
        [ $START_LAV -eq 1 ] && rm -rf lav-adaf/apps/dashboard/.next lav-adaf/apps/dashboard/node_modules/.cache 2>/dev/null || true
        # También limpiar cache de pnpm/npm
        rm -rf ~/.cache/next-builds 2>/dev/null || true
        echo "✅ Cache limpiado"
    fi
}

# Función para instalar dependencias
install_if_needed() {
    local dir="$1"
    local label="$2"
    
    if [ ! -d "${dir}/node_modules" ] && [ $INSTALL_IF_MISSING -eq 1 ]; then
        echo "📦 Instalando dependencias en ${label}..."
        if command -v pnpm >/dev/null 2>&1; then
            (cd "$dir" && pnpm install --silent)
        else
            (cd "$dir" && npm install --silent)
        fi
    fi
}

# Función de verificación de conectividad
wait_ready() {
    local name="$1"
    local url="$2"
    local timeout="$3"
    local start=$(date +%s)
    
    while true; do
        local code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [[ "$code" == "200" || "$code" == "302" || "$code" == "301" ]]; then
            echo "✅ ${name}: Conectado ($code)"
            break
        fi
        
        local now=$(date +%s)
        if (( now - start > timeout )); then
            echo "⚠️ Timeout ${timeout}s para ${name} - código: ${code}"
            break
        fi
        
        sleep 1
    done
}

# --- PROCESO PRINCIPAL ---
echo "🔍 Limpiando entorno..."

# Primero limpiar procesos Node.js antiguos
cleanup_node_processes

# Luego verificar y limpiar puertos específicos
echo "🔍 Verificando puertos..."
check_and_kill_port 3000
[ $START_LAV -eq 1 ] && check_and_kill_port 3005

# Finalmente limpiar cache
clear_nextjs_cache

echo "📦 Verificando dependencias..."
install_if_needed "." "ADAF Dashboard Pro"
[ $START_LAV -eq 1 ] && install_if_needed "lav-adaf/apps/dashboard" "LAV-ADAF"

echo "🎯 Iniciando ADAF Dashboard Pro (Puerto 3000)..."
node ./node_modules/next/dist/bin/next dev --port 3000 > adaf-dashboard.log 2>&1 &
PID1=$!

if [ $START_LAV -eq 1 ]; then
    echo "🤖 Iniciando LAV-ADAF Dashboard (Puerto 3005)..."
    (cd lav-adaf/apps/dashboard && node ./node_modules/next/dist/bin/next dev --port 3005 > ../../../lav-adaf-dashboard.log 2>&1 &)
    PID2=$!
fi

echo "⏳ Esperando servidores..."
sleep 8

echo "🔍 Verificando conectividad..."
wait_ready "ADAF Dashboard Pro" "http://localhost:3000" $READY_TIMEOUT
[ $START_LAV -eq 1 ] && wait_ready "LAV-ADAF" "http://localhost:3005" $READY_TIMEOUT

echo "🩺 Ejecutando health checks automáticos..."
node ./scripts/health-check.mjs --mode=shallow --label=adaf --timeout=2000 || {
    echo "❌ Health check superficial falló para ADAF";
    cleanup 1;
}
node ./scripts/health-check.mjs --mode=deep --label=adaf --timeout=2000 --force-real || {
    echo "❌ Health check profundo falló para ADAF";
    cleanup 1;
}

if [ $START_LAV -eq 1 ]; then
    node ./scripts/health-check.mjs --mode=shallow --label=lav --port=3005 --timeout=2000 || {
        echo "❌ Health check superficial falló para LAV";
        cleanup 1;
    }
fi

echo ""
echo "✅ ¡Servidores iniciados exitosamente!"
echo ""
echo "📊 ADAF Dashboard Pro:"
echo "   🌐 URL: http://localhost:3000"
echo "   📝 Log: adaf-dashboard.log"
echo ""

if [ $START_LAV -eq 1 ]; then
    echo "🤖 LAV-ADAF Sistema:"
    echo "   🌐 URL: http://localhost:3005"
    echo "   📝 Log: lav-adaf-dashboard.log"
    echo ""
fi

echo "💡 Para detener: Ctrl+C"
echo "⚙️ Entorno: MOCK_MODE=$MOCK_MODE"
echo ""

# Esperar
if [ $START_LAV -eq 1 ]; then
    wait $PID1 $PID2
else 
    wait $PID1
fi
