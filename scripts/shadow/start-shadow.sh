#!/bin/bash
# ================================================================================================
# Shadow Mode - Start Script
# ================================================================================================
# Initializes Docker secrets and starts shadow profile services for 72h validation
# Fortune 500 Standard: Automated, idempotent, with pre-flight checks
# ================================================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_ROOT}"

echo "=========================================="
echo "🚀 ADAF Shadow Mode - Startup"
echo "=========================================="
echo ""

# ----- Pre-flight Checks -----
echo "🔍 Pre-flight checks..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if [ ! -f docker-compose.prod.yml ]; then
    echo "❌ docker-compose.prod.yml not found"
    exit 1
fi

if [ ! -f .env.shadow.demo ]; then
    echo "❌ .env.shadow.demo not found"
    exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# ----- Docker Secrets -----
echo "🔐 Initializing Docker secrets..."

# Check if running in swarm mode (required for docker secret)
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "⚠️  Docker Swarm not active. Using environment variables instead of secrets."
    echo "   For production, initialize swarm with: docker swarm init"
    USE_ENV_VARS=true
else
    USE_ENV_VARS=false
    
    # Create postgres_password secret if it doesn't exist
    if ! docker secret inspect postgres_password &> /dev/null; then
        echo "   Creating postgres_password secret..."
        echo "shadow_postgres_pass_$(date +%s)" | docker secret create postgres_password -
        echo "   ✅ postgres_password created"
    else
        echo "   ✅ postgres_password already exists"
    fi
    
    # Create app_secret_key secret if it doesn't exist
    if ! docker secret inspect app_secret_key &> /dev/null; then
        echo "   Creating app_secret_key secret..."
        openssl rand -base64 32 | docker secret create app_secret_key -
        echo "   ✅ app_secret_key created"
    else
        echo "   ✅ app_secret_key already exists"
    fi
fi

echo ""

# ----- Start Services -----
echo "🐳 Starting Shadow Mode services..."
echo "   Profile: shadow"
echo "   Environment: .env.shadow.demo"
echo ""

if [ "$USE_ENV_VARS" = true ]; then
    # Export secrets as environment variables for non-swarm mode
    export POSTGRES_PASSWORD="shadow_postgres_pass"
    export APP_SECRET_KEY="$(openssl rand -base64 32)"
    echo "   ⚠️  Using environment variables (non-swarm mode)"
fi

# Pull images first (optional but recommended)
echo "📥 Pulling images..."
docker compose -f docker-compose.prod.yml --profile shadow pull --quiet || true

# Start services
docker compose -f docker-compose.prod.yml --profile shadow --env-file .env.shadow.demo up -d

echo ""
echo "✅ Shadow Mode services started"
echo ""

# ----- Wait for Health -----
echo "⏳ Waiting for services to be healthy (30s)..."
sleep 30

echo ""
echo "🏥 Running health check..."
if bash scripts/shadow/health-check.sh; then
    echo ""
    echo "=========================================="
    echo "✅ Shadow Mode is LIVE"
    echo "=========================================="
    echo ""
    echo "📊 Monitoring:"
    echo "   - Prometheus: http://localhost:9090"
    echo "   - Grafana: http://localhost:3200"
    echo "   - Jaeger: http://localhost:16686"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Import Grafana dashboards from docs/grafana/"
    echo "   2. Configure Prometheus alerts in monitoring/prometheus.yml"
    echo "   3. Monitor KPI collector logs: docker compose -f docker-compose.prod.yml logs -f kpi-collector"
    echo "   4. Check Oracle metrics: curl http://localhost:3000/api/oracle/v1/metrics"
    echo ""
    echo "📖 Full guide: SHADOW_MODE_READY.md"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "⚠️  Shadow Mode started with warnings"
    echo "=========================================="
    echo ""
    echo "Some health checks failed. Check logs:"
    echo "   docker compose -f docker-compose.prod.yml --profile shadow logs"
    echo ""
    exit 1
fi
