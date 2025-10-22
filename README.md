# ADAF Dashboard Pro

> Toda la documentación técnica, operativa y de memorias vive ahora dentro de `motor-del-dash/`. Este README solo deja los accesos esenciales.

---

## 🚀 Oracle Core v1.0 — PRODUCTION READY ✅

**Meta-Oráculo Multi-Fuente Fortune 500**

- ✅ **5 Adapters**: Chainlink, Pyth, RedStone, Band+Tellor, Chronicle+UMA
- ✅ **Consensus**: Weighted median, trimmed mean, k-of-n quorum
- ✅ **Security**: RBAC, rate limiting (100 req/min), audit trail
- ✅ **Observability**: Prometheus metrics, Grafana dashboard
- ✅ **UI**: Oracle Command Center (`/dashboard/oracle`)
- ✅ **SDK**: TypeScript client (REST + WebSocket)
- ✅ **Webhooks**: Slack/Discord/Teams alerting

**Tests:** 1003/1004 passing (99.9%) | **Status:** Ready for Shadow Mode Staging

**API Endpoints (LAV-ADAF port 3005):**
- GET `/api/oracle/v1/health` → 200 OK
- GET `/api/oracle/v1/feeds` → 200 OK (63 feeds)
- GET `/api/oracle/v1/latest` → 200 OK
- GET `/api/oracle/v1/feeds/by-id?id=<feed-id>` → 200 OK / 404 JSON
- GET `/api/oracle/v1/feeds/by-id/latest?id=<feed-id>` → 200 OK / 404 JSON

👉 **Docs completas:** [`motor-del-dash/documentacion/ORACLE_CORE_IMPLEMENTATION.md`](./motor-del-dash/documentacion/ORACLE_CORE_IMPLEMENTATION.md)

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

## ✅ Quality gates Fortune 500

> Asegúrate de tener los dashboards corriendo (`./inicio-completo.sh` o `pnpm dev:ambos`) antes de lanzar pruebas de humo; todos los checks deben ejecutarse sobre entornos activos.

1. **Lint & type-safety**

	```bash
	pnpm lint
	```

2. **Cobertura ejecutiva** (Vitest + v8). Actualiza [`evidence/v1.5/coverage-summary.md`](./evidence/v1.5/coverage-summary.md) con los resultados y adjunta capturas clave en `evidence/v1.5/assets/`.

	```bash
	pnpm test --coverage
	```

3. **Smoke de disponibilidad** (requiere dashboards corriendo; registra salidas en [`evidence/v1.5/smoke-logs.txt`](./evidence/v1.5/smoke-logs.txt) y guarda evidencias visuales en `evidence/v1.5/assets/`).

	```bash
	pnpm smoke
	```

> Mantén los artefactos de evidencia al día antes de cerrar cada sprint; son revisados en las juntas ejecutivas y en el checklist de lanzamiento.

## 🧾 Logs operativos

Los registros principales se mantienen en el root del repositorio para diagnóstico rápido:

- `adaf-dashboard.log`, `dashboard.log`, `dashboard-live.log`, `dashboard-mejorado.log`
- `lav-adaf-dashboard.log`, `adaf-live.log`, `server.log`, `server-test.log`, `server-clean.log`
- `nohup.out` y los dumps específicos generados por scripts (`adaf-clean.log`, etc.)

Consulta la guía en `motor-del-dash/documentacion/` para rutas adicionales, políticas de rotación y procedimientos de análisis.
