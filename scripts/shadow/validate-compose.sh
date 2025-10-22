#!/usr/bin/env bash
# ================================================================================================
# Shadow Mode Docker Compose Validation
# ================================================================================================
# Quick validation that docker-compose.prod.yml can parse and list shadow services.
# Does NOT start services, just validates configuration.
# 
# Usage:
#   bash scripts/shadow/validate-compose.sh
# ================================================================================================

set -euo pipefail

echo ""
echo "=========================================="
echo "Shadow Mode Docker Compose Validation"
echo "=========================================="
echo ""

# Check if docker-compose.prod.yml exists
if [[ ! -f docker-compose.prod.yml ]]; then
  echo "❌ docker-compose.prod.yml not found"
  exit 1
fi

echo "✅ docker-compose.prod.yml found"
echo ""

# Validate compose file syntax
echo "🔍 Validating compose file syntax..."
if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
  echo "✅ Compose file syntax valid"
else
  echo "❌ Compose file syntax error"
  docker compose -f docker-compose.prod.yml config
  exit 1
fi
echo ""

# List shadow profile services
echo "🔍 Listing shadow profile services..."
SHADOW_SERVICES=$(docker compose -f docker-compose.prod.yml --profile shadow config --services 2>/dev/null || echo "")

if [[ -z "$SHADOW_SERVICES" ]]; then
  echo "❌ No services found in shadow profile"
  exit 1
fi

echo "✅ Shadow profile services:"
echo "$SHADOW_SERVICES" | while read -r service; do
  echo "   - $service"
done
echo ""

# Verify oracle-core and kpi-collector are in the list
if echo "$SHADOW_SERVICES" | grep -q "oracle-core"; then
  echo "✅ oracle-core service found"
else
  echo "❌ oracle-core service NOT found in shadow profile"
  exit 1
fi

if echo "$SHADOW_SERVICES" | grep -q "kpi-collector"; then
  echo "✅ kpi-collector service found"
else
  echo "❌ kpi-collector service NOT found in shadow profile"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Shadow mode Docker Compose validation passed"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Ensure Docker secrets are created (postgres_password, app_secret_key)"
echo "  2. Start services: docker compose -f docker-compose.prod.yml --profile shadow up -d"
echo "  3. Run health check: bash scripts/shadow/health-check.sh"
echo ""
