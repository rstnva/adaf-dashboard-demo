# Summer.fi Integration Operations Manual

## 🚀 Release Overview

**Version:** Summer.fi v1.0  
**Release Date:** October 7, 2025  
**Integration Type:** DeFi Partner Widget Integration  
**Deployment:** Canary Release (10% → 50% → 100%)  

### 📋 What Was Released

- **Two draggable widgets** in WSP "On-chain Yield & Leverage" lane:
  - `SummerLazyVaultsWidget`: Displays yield farming opportunities
  - `SummerMultiplyWidget`: Shows leverage/multiply positions
- **Feature flag controlled**: `NEXT_PUBLIC_FF_SUMMER_ENABLED`
- **RBAC protected**: Requires `feature:summer` permission
- **Deep-link integration**: Direct links to Summer.fi platform
- **Comprehensive monitoring**: Grafana dashboards + Prometheus alerts

## Runbooks
- Ver `RUNBOOK.md` para incidentes, DR (PITR) y chaos.

## Despliegue
- Blue-Green con `scripts/deploy-bluegreen.sh` (canary + rollback).

## Evidencias
- Capturar en `docs/evidence/<fecha>/<area>/` (builds, métricas, capturas, registros de drill).
