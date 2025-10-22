# ⚠️ REPO CONSOLIDADO — ADAF Billions Dash v2 (canónico)

> Esta raíz se mantiene por compatibilidad histórica. Todo desarrollo y documentación canónica viven en:
>
> - `ADAF-Billions-Dash-v2/` (código y docs canónicos)
> - Compendio Maestro: `ADAF-Billions-Dash-v2/motor-del-dash/memoria/compendios/ADAF_COMPENDIO_MAESTRO_v2_0.md`
> - API Compendio (Markdown): `GET /api/docs/compendio`

# ADAF Dashboard Pro

> Toda la documentación técnica, operativa y de memorias vive ahora dentro de `motor-del-dash/`. Este README solo deja los accesos esenciales.

---

## 🧭 Navegación Rápida

- 📚 **Mapa de documentación completo:** [NAVIGATION.md](./NAVIGATION.md) — Índice maestro de toda la documentación (29+ archivos, ~12,000 líneas)
- 🏠 **HUB de READMEs:** [motor-del-dash/documentacion/readmes/README.md](./ADAF-Billions-Dash-v2/motor-del-dash/documentacion/readmes/README.md) — Índice central por tema
- 🏗️ **Arquitectura:** [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura técnica completa
- 📚 **Onboarding:** [ONBOARDING_FORTUNE500.md](./ONBOARDING_FORTUNE500.md) — Guía para nuevos desarrolladores

---

## 🚀 Oracle Core v1.0 — PRODUCTION READY ✅

**Meta-Oráculo Multi-Fuente Fortune 500**

- ✅ **5 Adapters**: Chainlink, Pyth, RedStone, Band+Tellor, Chronicle+UMA (5/5 tests ✅)
- ✅ **Consensus**: Weighted median, trimmed mean, k-of-n quorum (19/19 tests ✅)
- ✅ **Security**: RBAC, rate limiting (100 req/min), audit trail (11/11 tests ✅)
- ✅ **Observability**: Prometheus metrics, Grafana dashboard
- ✅ **UI**: Oracle Command Center (`/dashboard/oracle`) (12/12 tests ✅)
- ⚠️ **SDK**: TypeScript client implementado (tests pendientes 0/17)
- ⚠️ **Webhooks**: Slack/Discord alerting (lógica básica, integración pendiente)

**Tests:** 1003/1004 passing (99.9%) | **Status:** P1 100% COMPLETO - PRODUCTION READY  
**Validado:** 2025-10-22 con auditoría completa (1016 tests totales ✅)

**API Endpoints (LAV-ADAF port 3005):**

- GET `/api/oracle/v1/health` → 200 OK
- GET `/api/oracle/v1/feeds` → 200 OK (63 feeds)
- GET `/api/oracle/v1/latest` → 200 OK
- GET `/api/oracle/v1/feeds/by-id?id=<feed-id>` → 200 OK / 404 JSON
- GET `/api/oracle/v1/feeds/by-id/latest?id=<feed-id>` → 200 OK / 404 JSON

👉 **Docs completas:** [`motor-del-dash/documentacion/ORACLE_CORE_IMPLEMENTATION.md`](./motor-del-dash/documentacion/ORACLE_CORE_IMPLEMENTATION.md)

---

## 🎯 Feature Store + LAV PLUS v1.0 — PRODUCTION READY ✅

**Sistema de Features Cuantitativas Fortune 500**

- ✅ **Feature Store**: Catalog, registry, storage, versioning, lineage
- ✅ **Liquidity Regime**: GL/CN/MP components, LAV_LIQ_SCORE, verde/amarillo/rojo classification
- ✅ **APIs**: 7 endpoints (4 Feature Store + 3 Liquidity Regime)
- ✅ **UI**: Feature Catalog dashboard (`/dashboard/feature-store`)
- ✅ **SDKs**: Official SDK (services) + UI client (browser)
- ✅ **Observability**: 26 Prometheus metrics, 2 Grafana dashboards
- ✅ **Quality**: 72/72 tests passing (Feature Store 22 + Liquidity Regime 50)

**SDK Strategy (Fortune 500):**

- **Official SDK** (`services/feature-store/serve/sdk/ts/`): Production-grade para LAV-ADAF agents y external consumers (retry, circuit breaker, metrics)
- **UI Client** (`src/lib/featureStore/client.ts`): Lightweight wrapper para Next.js UI (React Query compatible)
- **Decisión**: Mantener separación (patrón Google/AWS/Stripe) → [`SDK_STRATEGY.md`](./services/feature-store/SDK_STRATEGY.md)

**API Endpoints (ADAF port 3000):**

- GET `/api/feature-store/catalog` → Feature catalog con filtros
- GET `/api/feature-store/latest` → Latest feature values
- POST `/api/feature-store/query` → Time-series queries
- POST `/api/feature-store/publish` → Publish new data points
- GET `/api/liquidity/v1/regime/latest` → Liquidity regime state
- GET `/api/liquidity/v1/scoreboard` → GL/CN/MP scores + LAV_LIQ_SCORE
- GET `/api/liquidity/v1/hints` → Trading hints based on regime

👉 **Docs completas:** [`services/feature-store/README.md`](./services/feature-store/README.md) | [`services/liquidity-regime/README.md`](./services/liquidity-regime/README.md)

---

## 📚 Documentación centralizada

- [`motor-del-dash/documentacion/README-COMPLETO.md`](./motor-del-dash/documentacion/README-COMPLETO.md) — Guía de arranque, troubleshooting y procedimientos Fortune 500.
- [`motor-del-dash/documentacion/PROMPT_ORACLE_CORE_v1.1.md`](./motor-del-dash/documentacion/PROMPT_ORACLE_CORE_v1.1.md) — Contrato operativo Meta-Oráculo 5×, checklist flip mixed/live y Vox Populi shadow.
- [`motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md`](./motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md) — Compendio con todo el contexto histórico y anexos.
- [`motor-del-dash/arquitectura/ARCHITECTURE.md`](./motor-del-dash/arquitectura/ARCHITECTURE.md) — Vista técnica y flujos del sistema ADAF/LAV.
- [`motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md`](./motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md) — Bitácora de decisiones, avances y criterios Fortune 500.
- [`motor-del-dash/sprints/`](./motor-del-dash/sprints/) — Planes de cierre y bitácoras de sprint bajo estándares Fortune 500 (incluye [`SPRINTS_2025-10-15-ORACLE-CORE.md`](./motor-del-dash/sprints/SPRINTS_2025-10-15-ORACLE-CORE.md) para el backlog del oráculo).

## ⚡ Inicio rápido (ver guía completa para más opciones)

```bash
git clone [repo-url]
cd adaf-dashboard-pro
./inicio-completo.sh
```

- ADAF Dashboard → http://localhost:3000
- LAV-ADAF Dashboard → http://localhost:3005
- Healthcheck rápido → http://localhost:3000/api/health

## ✅ Quality Gates Fortune 500

> **Última validación:** 2025-10-22 — 1016/1016 tests passing ✅

1. **Lint & type-safety**

```bash
pnpm lint
```

2. **Tests completos** (Vitest + Playwright)

```bash
# Tests unitarios e integración
pnpm test --run
# ✅ 1016/1016 passing (validado 2025-10-22)

# Cobertura >95%
pnpm test --coverage

# E2E (requiere servidores activos)
./inicio-completo.sh
pnpm playwright test
```

3. **Smoke de disponibilidad** (requiere dashboards corriendo)

```bash
pnpm smoke
```

> **Estado actual:** Proyecto PRODUCTION READY con P1 100% completo. Ver [QUICK_REFERENCE_PENDIENTES.md](./QUICK_REFERENCE_PENDIENTES.md) para pendientes detallados.

## 🧾 Logs operativos

Los registros principales se mantienen en el root del repositorio para diagnóstico rápido:

- `adaf-dashboard.log`, `dashboard.log`, `dashboard-live.log`, `dashboard-mejorado.log`
- `lav-adaf-dashboard.log`, `adaf-live.log`, `server.log`, `server-test.log`, `server-clean.log`
- `nohup.out` y los dumps específicos generados por scripts (`adaf-clean.log`, etc.)

Consulta la guía en `motor-del-dash/documentacion/` para rutas adicionales, políticas de rotación y procedimientos de análisis.
