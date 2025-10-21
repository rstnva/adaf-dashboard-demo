#!/usr/bin/env bash
# ================================================================================================
# Shadow Mode Health Check - Bash wrapper
# ================================================================================================
# Quick validation script for shadow mode services.
# Checks Oracle health, VOX metrics, and key Prometheus metrics.
# 
# Usage:
#   bash scripts/shadow/health-check.sh
# ================================================================================================

set -euo pipefail

ORACLE_HOST="${ORACLE_HOST:-localhost}"
ORACLE_PORT="${ORACLE_PORT:-3000}"

echo ""
echo "=========================================="
echo "Shadow Mode Health Check"
echo "=========================================="
echo ""

# ----- Oracle Health -----
echo "🔍 Checking Oracle health..."
ORACLE_HEALTH=$(curl -s "http://${ORACLE_HOST}:${ORACLE_PORT}/api/oracle/v1/health" || echo '{"status":"error"}')
echo "   Response: ${ORACLE_HEALTH}"

# ----- Prometheus Metrics -----
echo ""
echo "🔍 Checking Prometheus metrics..."
METRICS=$(curl -s "http://${ORACLE_HOST}:${ORACLE_PORT}/api/metrics/wsp" || echo "")

VOX_VPI_COUNT=$(echo "$METRICS" | grep -c "vox_vpi{" || echo "0")
ORACLE_SHADOW_RMSE_COUNT=$(echo "$METRICS" | grep -c "oracle_shadow_rmse{" || echo "0")
ORACLE_QUORUM_FAILS=$(echo "$METRICS" | grep "oracle_quorum_fail_total" | awk '{print $2}' || echo "0")

echo "   VOX VPI metrics: ${VOX_VPI_COUNT}"
echo "   Oracle shadow RMSE metrics: ${ORACLE_SHADOW_RMSE_COUNT}"
echo "   Oracle quorum failures: ${ORACLE_QUORUM_FAILS}"

# ----- Summary -----
echo ""
echo "=========================================="
if [[ "$VOX_VPI_COUNT" -gt 0 ]] && [[ "$ORACLE_SHADOW_RMSE_COUNT" -gt 0 ]]; then
  echo "✅ All checks passed - Shadow mode healthy"
else
  echo "⚠️  Some metrics missing - Check configuration"
fi
echo "=========================================="
echo ""
