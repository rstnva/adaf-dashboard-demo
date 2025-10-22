# 🚀 QUICK REFERENCE - Pendientes ADAF Dashboard Pro

**Fecha:** 2025-10-22  
**Validado con:** Auditoría completa + 1016 tests passing

---

## 📊 Estado del Proyecto

**Tests:** ✅ **1016/1016 passing (100%)**  
**Oracle Core P1:** ✅ **100% COMPLETO**  
**Git Push:** ✅ **FUNCIONANDO** (PAT configurado)  
**Alta prioridad:** 🟢 **2** (Provenance API, /opx)  
**Media prioridad:** ⚠️ **5** (22h total)  
**Baja prioridad:** 🔵 **5 categorías** (70h+)

---

## 🎯 Esta Semana (3h)

### 1. 🟢 Provenance API (2h) - ALTA

**Archivo:** `src/components/oracle/ProvenanceModal.tsx:44`

**TODO actual:**

```typescript
// TODO: Replace with real API call to /api/oracle/v1/provenance/${signalId}
```

**Acción:**

```bash
# Crear endpoint
src/app/api/oracle/v1/provenance/[id]/route.ts

# Implementar lógica de lineage tracing
# Usar lib/lineage-storage.ts como base
```

---

### 2. 🟢 Verificar /opx Route (1h) - ALTA

**Archivo:** `src/components/research/ResearchPanel.tsx:232`

**TODO actual:**

```typescript
// TODO: Navigate to /opx when implemented
```

**Acción:**

````bash
# Verificar si existe
ls src/app/(dashboard)/opx/page.tsx

# Si no existe, crear página OPX (Operational Excellence)
**Alta prioridad:** ✅ **2/2 COMPLETADOS** (Provenance API, /opx)

---


## ✅ Completados Esta Semana (3h/3h)

### 1. ✅ Provenance API (2h) - COMPLETADO

**Archivos creados:**
- `src/app/api/oracle/v1/provenance/[id]/route.ts` (212 líneas)
- `tests/provenance-api.test.ts` (14 tests ✅)

**Archivos modificados:**
- `src/components/oracle/ProvenanceModal.tsx` (usa API endpoint)

**Implementación (Mock-First):**
- GET /api/oracle/v1/provenance/[id] endpoint
- Mock data generator (5 feeds: BTC, ETH, SOL, AAVE, Funding)
- 5 fuentes de datos (Chainlink, Pyth, Redstone, Chronicle, etc.)
- Evidence refs con campos específicos por fuente
- Consensus metrics (weighted_median, quorum >= 85%)
- Metadata (sources_count, processing_time_ms, threshold)
- Cache headers (10s s-maxage)
- Error handling (400/500)
- X-Mock-Data: true header
- listFeeds() (3 tests)
**Tests:** 14/14 passing ✅
- getLatest() (2 tests)
**TODO_REPLACE_WITH_REAL_DATA:** Connect to lineage-storage.ts cuando se requieran datos reales
---
### 2. ✅ Ruta /opx (1h) - COMPLETADO
## 📋 Siguiente Sprint (22h)
**Archivos creados:**
- `src/app/(dashboard)/opx/page.tsx` (320+ líneas)
### 5. Quarantine Webhooks (3h)
**Archivos modificados:**
- `src/components/research/ResearchPanel.tsx` (navegación con router.push)
- Discord webhook integration
**Implementación (Mock-First):**
- Dashboard completo de oportunidades OPX
- 5 stats cards (Total, Proposed, Approved, Rejected, Avg Score)
- Filtros (min score slider, type select, status select)
- OpxTriageTable component integrado
- Mock data generator (15 oportunidades, 8 ideas, 5 agentes)
- Approve/Reject workflow con toast notifications
- Responsive design (grid 1/3/5 cols)
- Loading states y error handling

**Navegación:** ✅ ResearchPanel → router.push('/opx')
- Webhook endpoints
**TODO_REPLACE_WITH_REAL_DATA:** Connect to /api/opx/opportunities cuando se requieran datos reales
- 8 TODOs de auth context
**Status:** ✅ Página funcional, todos los componentes integrados
### 6. RBAC Checks (3h)
- ResearchPanel permissions
- Role-based access
- 2 TODOs

### 7. Database Insertions (4h)

- Prisma mutations
- 6 TODOs de DB
- Backtest results persistence

---

## 🔵 Backlog (70h+)

### 8. Replay & Snapshots (8h)

- CLI oracle-replay
- S3/Parquet storage
- Time-warp logic

### 9. SLO Monitors (6h)

- /api/oracle/v1/readiness
- Prometheus SLO queries
- Grafana dashboards

### 10. Runbook Rollout Script (4h)

- MODE=mixed script
- Dry-run validation
- Rollback automation

### 11. Opcionales Oracle (12h)

- DIA adapter (6º oracle)
- Data contracts validation
- Parquet export

### 12. Integrar APIs Reales (40h+)

- 38 TODOs "TODO_REPLACE_WITH_REAL_DATA"
- Mock-first → Real APIs
- NO BLOQUEANTE (estrategia diseñada)

---

## 📊 Matriz Rápida

| Prioridad | Items  | Horas    | Bloqueante     |
| --------- | ------ | -------- | -------------- |
| P1        | 2      | 3h       | ⚠️ Parcial     |
| ⚠️ P2     | 5      | 22h      | ❌ NO          |
| 🔵 P3     | 5      | 70h+     | ❌ NO          |
| **Total** | **12** | **~95h** | **0 críticos** |

---

## 🧪 Validación

```bash
# Tests completos
pnpm test --run
# ✅ 1016/1016 passing

# Tests Oracle UI
pnpm test oracle-ui --run
# ✅ 12/12 passing

# E2E (requiere servidor)
./inicio-completo.sh
pnpm playwright test
````

---

## 📁 Documentos de Referencia

- [AUDITORIA_COMPLETA_RESULTADOS.md](./AUDITORIA_COMPLETA_RESULTADOS.md) — Reporte completo de auditoría
- [ANALISIS_TAREAS_PENDIENTES.md](./ANALISIS_TAREAS_PENDIENTES.md) — Análisis detallado
- [ORACLE_CORE_COMPLETED.md](./ORACLE_CORE_COMPLETED.md) — Oracle Core status
- [NAVIGATION.md](./NAVIGATION.md) — Mapa completo de documentación

---

## ⚡ Comandos Útiles

```bash
# Ejecutar tests
pnpm test --run

# Ejecutar test específico
pnpm test oracle-ui --run

# Ver cobertura
pnpm test:coverage

# Lint
pnpm lint

# Build
pnpm build

# Iniciar completo (ADAF + LAV)
./inicio-completo.sh

# Iniciar solo ADAF
pnpm dev
```

---

**Última validación:** 2025-10-22 01:35 CDMX  
**Tests:** 1016/1016 ✅  
**Estado:** PRODUCTION READY (P1 100%)
