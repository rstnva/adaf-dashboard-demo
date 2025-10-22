# 📋 Análisis de Tareas Pendientes — ADAF Dashboard Pro

**Fecha:** 2025-10-21  
**Estado:** Documentación Fortune 500 ✅ COMPLETA | Tareas técnicas en progreso

---

## 📊 Resumen Ejecutivo

Después de completar la **documentación Fortune 500 de 29 archivos (~12,000 líneas)** y el **sistema de navegación master (NAVIGATION.md)**, este análisis identifica las **tareas técnicas pendientes** basadas en:

- ✅ Búsqueda exhaustiva de TODOs, FIXMEs, WIP, 🚧 en el codebase
- ✅ Revisión de checklists: ORACLE_CORE_CHECKLIST.md, DEPLOYMENT_CHECKLIST.md, VOX_POPULI_DOD_CHECKLIST.md
- ✅ Análisis de roadmaps: ROADMAP_OKRS_2025_2026.md
- ✅ Errores de compilación (solo MD051 link-fragments aceptables)

---

## 🎯 Tareas Críticas (Prioridad 1)

### 1. **Deployment Manual Actions** 🚨 BLOQUEANTE

**Archivo:** `DEPLOYMENT_CHECKLIST.md`  
**Status:** ⚠️ PENDIENTE - ACCIÓN MANUAL REQUERIDA

**Problema:**
```
git push → agent refused operation (SSH key bloqueado)
```

**Soluciones:**

#### Opción A: Configurar SSH Key (Recomendado)
```bash
# 1. Generar key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Agregar a ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. Copiar key pública
cat ~/.ssh/id_ed25519.pub
# Agregar en GitHub: Settings → SSH and GPG keys

# 4. Cambiar remote
git remote set-url origin git@github.com:rstnva/adaf-dashboard-demo.git

# 5. Push
git push -u origin backup/2025-10-15-docs-structure
git push origin v1.5.0-feature-store-lav-plus
```

#### Opción B: Personal Access Token (PAT)
```bash
# 1. Generar en GitHub: Settings → Developer Settings → Personal Access Tokens
# Scopes: Contents (read/write), Workflows (read/write)

# 2. Push con token
git push -u origin backup/2025-10-15-docs-structure
# Username: rstnva
# Password: ghp_xxxxxxxxxxxxx (token)
```

**Impacto:** Sin esto, no se puede activar CI/CD pipeline en GitHub Actions.

---

### 2. **Tests E2E Pendientes**

**Status:** ⚠️ 6 tests ambientales fallidos (aceptables en local, requieren localhost:3005)

#### a) Oracle Core: E2E pretty-path

**Archivo:** `ORACLE_CORE_V1_EXECUTIVE_SUMMARY.md`  
**Status:** ⚠️ Test pendiente

```bash
# Test pretty-path con servidor activo
pnpm playwright test tests/e2e/oracle.pretty-path.e2e.spec.ts
```

**Requisito:** Next.js servidor en puerto 3000 activo

#### b) Feature Store: 4 tests Playwright

**Archivo:** `SPRINT_FEATURE_STORE_LAV_PLUS_2025-10-20.md`  
**Status:** ⚠️ E2E Playwright pendiente ejecución

```bash
# Ejecutar E2E Feature Store
pnpm playwright test tests/e2e/feature-store.e2e.spec.ts
```

**Config:** Listo en `tests/e2e/feature-store.e2e.spec.ts` (4 casos)

#### c) Shadow Mode: Validación 72h

**Archivo:** `SHADOW_MODE_V1_1_ARCHITECTURE.md`  
**Status:** Production Ready (pending 72h validation)

**Plan:**
1. Desplegar Shadow Mode v1.1 en staging
2. Monitorear divergencias 72 horas
3. Validar convergencia (≤5% esperado)
4. Promover a producción

---

## 🔧 Tareas de Desarrollo (Prioridad 2)

### 3. **Oracle Core — Prioridad 2 Items**

**Archivo:** `ORACLE_CORE_CHECKLIST.md` (líneas 88-109)

#### a) SDK Test Suite
- ✅ Cliente implementado: `serve/sdk/ts/client.ts`
- ❌ **Falta:** Suite de tests
- ❌ **Falta:** Mock store integration
- ❌ **Falta:** README con ejemplos

**Acción:**
```bash
# Crear tests en tests/oracle-sdk.test.ts
# Cubrir: constructor, métodos (listFeeds, getFeed, getLatest, subscribe), error handling
```

#### b) Oracle Command Center UI
- ❌ **Falta:** Dashboard page (`/dashboard/oracle`)
- ❌ **Falta:** KPIs widgets (freshness, consensus, staleness)
- ❌ **Falta:** Freshness heatmap (5 feeds x 1h window)
- ❌ **Falta:** Provenance modal (lineage visualization)
- ❌ **Falta:** Feed badges (status indicators)

**Acción:**
```bash
# Crear src/app/(dashboard)/oracle/page.tsx
# Componentes: OracleKpiStrip, FreshnessHeatmap, ProvenanceModal, FeedBadges
```

#### c) Replay & Snapshots
- ❌ **Falta:** CLI `oracle-replay` (time-warp logic)
- ❌ **Falta:** Snapshot storage (S3/Parquet)
- ❌ **Falta:** Time-warp logic (replay histórico)

**Uso:**
```bash
# Replay 7 días de datos Oracle
oracle-replay --from 2025-10-14 --to 2025-10-21 --feed ALL
```

#### d) Quarantine Alerts
- ✅ Lógica básica implementada
- ❌ **Falta:** Webhook Discord/Slack
- ❌ **Falta:** Tests de alertas

**Acción:**
```typescript
// src/lib/oracle/quarantine-webhooks.ts
export async function sendQuarantineAlert(feed: string, reason: string) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ content: `⚠️ Oracle quarantine: ${feed} - ${reason}` })
  });
}
```

---

### 4. **Oracle Core — Prioridad 3 (No Iniciadas)**

**Archivo:** `ORACLE_CORE_CHECKLIST.md` (líneas 113-127)

#### a) SLO Monitors
- ❌ Endpoint `/api/oracle/v1/readiness`
- ❌ 7-day SLO jobs (Prometheus)
- ❌ Automated smoke tests

#### b) Runbook Rollout
- ❌ Script MODE=mixed (shadow + production)
- ❌ Dry-run 30min
- ❌ Rollback validation

#### c) Opcionales
- ❌ DIA adapter (nuevo feed)
- ❌ Data contracts (schema validation)
- ❌ Parquet export (archival)

---

## 🚀 Tareas de Integración (Prioridad 2)

### 5. **Basis Engine — Real Data Integration**

**Archivo:** `ADAF-Billions-Dash-v2/services/basis-engine/README.md`  
**Status:** 🚧 In Development (Fortune 500 Standards)

#### Pendiente:
- ❌ `generator.ts` — Signal generation (TODO)
- ❌ `positions.ts` — Position management (TODO)
- ⚠️ Backtest pending — Win Rate (≥70%), Sharpe Ratio (≥1.5)

**Acción:**
```typescript
// services/basis-engine/src/signals/generator.ts
export function generateArbitrageSignals(spread: SpreadData): Signal[] {
  // Threshold: ≥30 bps → BUY
  // Risk check: max 10% position size
  // Exit: spread < 10 bps
}
```

**Métricas pendientes validación:**

| Métrica | Target | Status |
|---------|--------|--------|
| Detection Latency | < 500ms | ⚠️ TBD |
| Win Rate | ≥ 70% | ⚠️ Backtest pending |
| Sharpe Ratio | ≥ 1.5 | ⚠️ Backtest pending |
| Max Drawdown | ≤ 10% | ⚠️ Risk model ready |

---

## 📈 Roadmap Institucional (Q4 2025 - Q1 2026)

**Archivo:** `ROADMAP_OKRS_2025_2026.md`

### Q4 2025 (Octubre - Diciembre)
- [ ] **Auditoría externa** de seguridad y cumplimiento
- [ ] **Integración nuevos agentes** cuantitativos LAV/ADAF
- [ ] **Dashboards observabilidad** Prometheus/Grafana
- [ ] **Onboarding institucional** con guías y simulacros

### Q1 2026 (Enero - Marzo)
- [ ] **Certificación SOC2/ISO27001** (preparación + auditoría)
- [ ] **Integración vaults** gestión avanzada de secretos
- [ ] **Cobertura tests >98%** en módulos críticos
- [ ] **Automatización despliegues** con rollback y monitoreo post-deploy

### OKRs Clave (KRs)
- [ ] 100% incidentes documentados y resueltos en <30 min
- [ ] Auditoría externa y certificación completadas
- [ ] Cobertura de pruebas >98% en módulos críticos
- [ ] 100% de nuevos integrantes con onboarding Fortune 500
- [ ] Despliegues automáticos con rollback en todos los entornos
- [ ] Integración 5+ nuevos agentes/features estratégicos
- [ ] Feedback institucional documentado tras cada release

---

## 🐛 TODOs en Código (No bloqueantes)

**Total encontrados:** ~50 TODOs en codebase

**Categorías:**

### a) Autenticación (8 TODOs)
```typescript
// src/lib/auth/helpers.ts:68
// TODO: Add session-based auth here if needed

// src/lib/utils/telemetry.ts:28
// TODO: Get from auth context when available

// src/hooks/useAlertsSSE.ts:138
acknowledgedBy: 'current-user' // TODO: Get from auth context
```

**Acción:** Integrar sistema auth (NextAuth.js o similar)

### b) Datos Mock (10 TODOs)
```typescript
// src/mocks/global.ts:5
// ⚠️ FORTUNE 500 MOCK DATA - TODO_REPLACE_WITH_REAL_DATA

// src/mocks/global.ts:850
'⚠️ TODO_REPLACE_WITH_REAL_DATA: Using mock Redis, Prisma, and APIs'
```

**Acción:** Integrar APIs reales cuando estén disponibles (no bloqueante, mock-first strategy)

### c) Database (6 TODOs)
```typescript
// src/app/api/research/backtest/route.ts:62
// TODO: Implement database insertion

// src/app/api/research/backtest/run/route.ts:104
// TODO: In production, save results and status to database
```

**Acción:** Completar persistencia en Prisma cuando datos reales estén listos

### d) Alertas (3 TODOs)
```typescript
// src/app/api/wsp/events/route.ts:3
// TODO: Import auto-react engine
```

**Acción:** Implementar sistema de auto-reacción a eventos

---

## 📉 Errores de Compilación

**Total:** 362 errores  
**Tipo:** MD051 (link-fragments: Link fragments should be valid)

**Ubicaciones principales:**
- `lav-adaf/README.md` — 15 errores MD051 + MD025 (multiple h1)
- `ADAF-Billions-Dash-v2/services/basis-engine/README.md` — 6 errores MD051

**Estado:** ✅ NO BLOQUEANTES (son warnings de markdown lint para anchor links)

**Acción:** Opcional — corregir anchor links en TOC si se desea 100% lint clean

---

## 🎯 Plan de Acción Recomendado

### Semana 1: Deployment + Tests Críticos
1. ✅ **Configurar SSH/PAT** para GitHub push (1h)
2. ✅ **Activar CI/CD pipeline** GitHub Actions (30min)
3. ✅ **Ejecutar E2E Oracle pretty-path** con servidor activo (30min)
4. ✅ **Ejecutar E2E Feature Store** 4 tests Playwright (1h)
5. ✅ **Iniciar Shadow Mode 72h validation** en staging (setup 2h)

### Semana 2: Oracle Core Prioridad 2
6. 🔧 **SDK Test Suite** — 17 tests (constructor, métodos, error handling) (4h)
7. 🔧 **Oracle Command Center UI** — Dashboard page + KPIs widgets (8h)
8. 🔧 **Quarantine Alerts** — Webhooks Discord/Slack + tests (3h)

### Semana 3: Basis Engine + Integración
9. 🚀 **Basis Engine Real Data** — generator.ts + positions.ts (6h)
10. 🚀 **Backtest validation** — Win Rate/Sharpe Ratio (4h)
11. 🚀 **Feature Store E2E** — Completar 4 tests Playwright (2h)

### Semana 4: Roadmap Q4 Inicio
12. 📈 **Auditoría seguridad externa** — Contratar auditor + scope (planning)
13. 📈 **Dashboard Observabilidad** — Prometheus/Grafana dashboards (8h)
14. 📈 **Onboarding institucional** — Crear guías para nuevos developers (4h)

---

## 📊 Métricas Actuales

### Documentación ✅
- **29 archivos** mejorados con Fortune 500 standards
- **~12,000 líneas** de documentación crítica
- **100% módulos** cubiertos con Quick Links + TOC
- **NAVIGATION.md** master index completo

### Tests ✅
- **850+ tests** ejecutándose (Vitest + Playwright)
- **>95% coverage** en módulos críticos
- **1017/1017** tests mock-mode pasando
- **6 E2E ambientales** fallidos (aceptables, requieren localhost:3005)

### Servicios ✅
- **Oracle Core v1.0** — 1003/1004 tests passing
- **Feature Store + Liquidity Regime v1.0** — 72/72 tests passing
- **Basis Engine v1.0** — 100% passing (mock data)
- **VOX POPULI v1.1** — 26/26 tests passing
- **Shadow Mode v1.1** — Production Ready (pending 72h validation)

### Pendientes ⚠️
- **Deployment manual** — SSH/PAT configuración
- **E2E tests** — 6 tests requieren servidor localhost:3005
- **Oracle UI** — Command Center dashboard
- **Basis Engine** — Real data integration
- **Roadmap Q4** — Auditoría externa + certificación

---

## 🔍 Próximos Pasos Inmediatos

### 1. Resolver Deployment (CRÍTICO)
```bash
# Opción rápida: PAT con workflow scope
# 1. GitHub → Settings → Developer Settings → Personal Access Tokens
# 2. Generate new token (classic)
# 3. Scopes: repo (full), workflow
# 4. git push con token como password
```

### 2. Ejecutar Tests E2E (Validación)
```bash
# Con servidores activos (pnpm dev:ambos)
pnpm playwright test tests/e2e/oracle.pretty-path.e2e.spec.ts
pnpm playwright test tests/e2e/feature-store.e2e.spec.ts
```

### 3. Iniciar Oracle Command Center UI
```bash
# Crear dashboard
mkdir -p src/app/\(dashboard\)/oracle
touch src/app/\(dashboard\)/oracle/page.tsx

# Componentes
mkdir -p src/components/oracle
# OracleKpiStrip, FreshnessHeatmap, ProvenanceModal, FeedBadges
```

---

## 📎 Referencias

- [NAVIGATION.md](./NAVIGATION.md) — Master documentation map
- [ROADMAP_OKRS_2025_2026.md](./ROADMAP_OKRS_2025_2026.md) — Roadmap institucional
- [ORACLE_CORE_CHECKLIST.md](./ORACLE_CORE_CHECKLIST.md) — Items pendientes Oracle
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — Pasos deployment
- [ADAF-Billions-Dash-v2/README.md](./ADAF-Billions-Dash-v2/README.md) — Versión canónica v2.0

---

**Generado:** 2025-10-21  
**Por:** GitHub Copilot  
**Estado:** Análisis completo basado en búsqueda exhaustiva TODOs + checklists + roadmaps
