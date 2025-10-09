#!/bin/bash

# ADAF Dashboard Pro + LAV-ADAF - Inicio Completo
# Este script inicia ambos dashboards simultáneamente

echo "🚀 Iniciando ADAF Dashboard Pro + LAV-ADAF..."
echo ""

# Modo demo/mock por defecto (ajustable via .env.local)
export MOCK_MODE=${MOCK_MODE:-1}

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $PID1 2>/dev/null
    kill $PID2 2>/dev/null
    exit 0
}

# Capturar señales de interrupción
trap cleanup SIGINT SIGTERM

# Verificar si los puertos están disponibles
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Puerto $1 ya está en uso. Deteniendo proceso existente..."
        kill $(lsof -t -i:$1) 2>/dev/null
        sleep 2
    fi
}

echo "🔍 Verificando puertos..."
check_port 3000
check_port 3005

echo "📦 Instalando dependencias si es necesario..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del proyecto principal..."
    pnpm install --silent
fi

# Asegurar dependencias del dashboard LAV-ADAF (app Next.js)
if [ ! -d "lav-adaf/apps/dashboard/node_modules" ]; then
    echo "Instalando dependencias de LAV-ADAF (apps/dashboard)..."
    (cd lav-adaf/apps/dashboard && pnpm install --silent)
fi

echo ""
echo "🎯 Iniciando ADAF Dashboard Pro (Puerto 3000)..."
# Ejecutar Next directamente para capturar un PID estable (evitar wrappers que salen)
node ./node_modules/next/dist/bin/next dev --port 3000 > adaf-dashboard.log 2>&1 &
PID1=$!

echo "🤖 Iniciando LAV-ADAF Dashboard (Puerto 3005)..."
(
    cd lav-adaf/apps/dashboard 
    node ./node_modules/next/dist/bin/next dev --port 3005 > ../../../lav-adaf-dashboard.log 2>&1 &
    echo $! > ../../../.lav_pid
)
PID2=$(cat .lav_pid 2>/dev/null || true)
rm -f .lav_pid 2>/dev/null || true

echo ""
echo "⏳ Esperando que los servidores estén listos..."
sleep 8

echo ""
echo "✅ ¡Servidores iniciados exitosamente!"
echo ""
echo "📊 ADAF Dashboard Pro:"
echo "   🌐 URL: http://localhost:3000"
echo "   📝 Log: adaf-dashboard.log"
echo "   🛡️ Monitoring: http://localhost:3000/monitoring"
echo "   🔍 Health shallow: http://localhost:3000/api/health"
echo "   🔬 Health deep:    http://localhost:3000/api/health?deep=1"
echo ""
echo "🤖 LAV-ADAF Sistema:"
echo "   🌐 URL: http://localhost:3005" 
echo "   📝 Log: lav-adaf-dashboard.log"
echo ""
echo "🔗 Accesos directos disponibles desde ADAF Dashboard:"
echo "   • Menú lateral: Click en 'LAV-ADAF'"
echo "   • Página principal: Botón 'Abrir LAV-ADAF'"
echo "   • Dashboard main: Tarjeta 'LAV-ADAF Sistema'"
echo ""
echo "💡 Para detener ambos servidores: Ctrl+C"
echo "📖 Para ver logs en tiempo real:"
echo "   tail -f adaf-dashboard.log"
echo "   tail -f lav-adaf-dashboard.log"
echo ""
echo "⚙️ Entorno: MOCK_MODE=$MOCK_MODE  (HEALTH_ENABLE_DB=$HEALTH_ENABLE_DB, HEALTH_ENABLE_REDIS=$HEALTH_ENABLE_REDIS, HEALTH_ENABLE_EXTERNAL=$HEALTH_ENABLE_EXTERNAL)"
echo "🔔 Webhook: ${ALERT_WEBHOOK_URL:+configurado}${ALERT_WEBHOOK_URL:+' (oculto)'}${ALERT_WEBHOOK_URL:-no-configurado}"
echo ""

# Esperar indefinidamente hasta que el usuario presione Ctrl+C
wait $PID1 $PID2