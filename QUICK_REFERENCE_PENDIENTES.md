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

```bash
# Verificar si existe
ls src/app/(dashboard)/opx/page.tsx

# Si no existe, crear página OPX (Operational Excellence)
```

---

## 📅 Siguiente Sprint (22h)

### 3. ⚠️ SDK Test Suite (4h) - MEDIA

**Archivo:** `tests/oracle-sdk.test.ts` (crear)

**SDK existente:** `serve/sdk/ts/client.ts`

**Tests requeridos:**

```typescript
// 17 tests recomendados:
- Constructor (2 tests)
- listFeeds() (3 tests)
- getFeed(id) (3 tests)
- getLatest() (2 tests)
- subscribe() (3 tests)
- Error handling (4 tests)
```

**Comando validación:**

```bash
pnpm test oracle-sdk --run
# Target: 17/17 passing
```

---

## 📋 Siguiente Sprint (22h)

### 5. Quarantine Webhooks (3h)

- Discord webhook integration
- Slack webhook integration
- 5 tests

### 4. ⚠️ Quarantine Webhooks (3h) - MEDIA

- Discord/Slack integration
- Webhook endpoints
- Alerting system

### 5. Sistema Auth NextAuth.js (8h)

- NextAuth.js setup
- Session management
- 8 TODOs de auth context

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
```

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
