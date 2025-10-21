# Evidence Pack v1.5 — Simulación Fortune 500

Este directorio centraliza las evidencias requeridas por el plan de cierre Sprint 5 (simulación Fortune 500). Todos los entregables deben generarse a partir de ejecuciones recientes (<24h) y adjuntarse antes del 2025-10-20.

## 📊 Cobertura y QA
- `coverage-summary.md`: resumen consolidado de `pnpm test --coverage` (ADAF, LAV y backups).
- `coverage/` (opcional): carpeta con reportes HTML si se necesitan para auditoría.
- Incluir tabla con porcentajes de líneas, ramas y funciones; resaltar módulos <75%.

## 📈 Observabilidad
- `grafana-slo.png`: captura de los dashboards SLO/SLA exportados desde Grafana.
- `grafana-dashboard.json`: export del dashboard principal (para importar en entornos Fortune 500).
- Documentar en `observability-notes.md` las métricas claves añadidas (`adaf_blockspace_request_total`, `adaf_vaults_sim_latency_seconds`, etc.) y sus umbrales.

## 🚦 Smoke Tests
- `smoke-logs.txt`: salida de `pnpm smoke` con flags de simulación activos.
- `dashboard-checklist.md`: checklist manual (desktop + tablet) con toggles activados/desactivados.
- `seed-report.md`: resumen de `pnpm oracle:seed` indicando conteos cargados en Postgres/Redis.

## ✅ Checklist de entrega
- [ ] Cobertura ≥75% líneas y ≥70% ramas documentada.
- [ ] Evidencias de observabilidad generadas y firmadas por SRE.
- [ ] Smoke tests adjuntos con resultados verdes.
- [ ] Bitácora actualizada en `MEMORIA_GITHUB_COPILOT.md` con fecha y responsables.

> Mantén este folder versionado; no adjuntes datos sensibles ni claves.
