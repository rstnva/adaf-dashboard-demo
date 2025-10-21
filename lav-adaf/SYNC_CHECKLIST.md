# Checklist de Sincronización LAV ↔ ADAF — Sprint 5 (Simulación)

> **Objetivo:** Garantizar que los módulos de simulación (blockspace, vaults, alpha factory, event alpha, liquidity backstop) estén alineados entre ADAF (port 3000) y LAV Dashboard (port 3005) antes de cada release Fortune 500.

## 1. Preparación
- [ ] Confirma que las ramas están actualizadas (`backup/2025-10-15-docs-structure` en ADAF y rama espejo en LAV).
- [ ] Copia `.env.example` → `.env.local` en ambos repos y habilita los toggles:
  - `NEXT_PUBLIC_FF_BLOCKSPACE_SIM=true`
  - `NEXT_PUBLIC_FF_VAULTS_LAV_SIM=true`
  - `NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM=true`
  - `NEXT_PUBLIC_FF_EVENT_ALPHA_SIM=true`
  - `NEXT_PUBLIC_FF_LIQUIDITY_BACKSTOP_SIM=true`
  - `NEXT_PUBLIC_EXECUTION_MODE=dry-run` / `EXECUTION_MODE=dry-run`
- [ ] Verifica acceso a servicios compartidos (PostgreSQL, Redis) y a credenciales mock en vault seguro.

## 2. Instalación y build
- [ ] Ejecuta `pnpm install` en ambos proyectos.
- [ ] En LAV: `pnpm -r build` (verifica que el dashboard 3005 compila sin warnings críticos).
- [ ] En ADAF: `pnpm build` para validar App Router.

## 3. Validaciones automáticas
- [ ] `pnpm test --filter "@lav"` dentro de `lav-adaf/` (esperado: suite verde).
- [ ] `pnpm test --coverage` en ADAF (objetivo ≥75% líneas simulación).
- [ ] Registrar resultados en `evidence/v1.5/coverage-summary.md`.
- [ ] `pnpm oracle:seed` para sincronizar catálogos mock/shadow en Postgres y Redis (adjuntar salida en `seed-report.md`).

## 4. Smoke tests cruzados
1. Levanta ambos dashboards (`pnpm dev:ambos` desde raíz ADAF).
2. Ejecuta los siguientes curl (guardar en `evidence/v1.5/smoke-logs.txt`):
   - `curl -s -X POST http://localhost:3000/api/blockspace/builder`
   - `curl -s -X POST http://localhost:3000/api/vaults/lav`
   - `curl -s -X POST http://localhost:3005/api/blockspace/builder`
   - `curl -s -X POST http://localhost:3005/api/vaults/lav`
3. Verifica que los headers incluyan `X-Sim-Module` y que los payloads coincidan.

## 5. Observabilidad
- [ ] Exporta dashboards actualizados desde Grafana (`grafana-slo.png`, `grafana-dashboard.json`).
- [ ] Anota métricas objetivo en `evidence/v1.5/observability-notes.md`:
  - `adaf_blockspace_latency_seconds`
  - `adaf_vaults_sim_latency_seconds`
  - `adaf_alpha_factory_signal_total`
  - `adaf_event_alpha_alert_total`
  - `adaf_liquidity_backstop_reserve_ratio`

## 6. Change log & comunicación
- [ ] Añade entrada en `lav-adaf/README.md` (sección "Actualizaciones Sprint 5") con fecha, responsable y artefactos adjuntos.
- [ ] Publica resumen en `MEMORIA_GITHUB_COPILOT.md` (control cruzado).
- [ ] Compartir checklist firmado en `#adaf-ops`.

## 7. Criterio de bloqueo
- **SEV2** si cualquiera de los endpoints devuelve 5xx o no respeta los toggles.
- **Acción inmediata:** revertir a commit estable, restablecer flags, notificar a `@infra-lead` + `@quant-lead`.

## 8. Post-release
- [ ] Cerrar tareas Jira/Trello etiquetadas `Sprint5`.
- [ ] Actualizar `sprints/SPRINTS_2025-10-10.md` con lecciones aprendidas.
- [ ] Programar revisión de métricas 24h después del release.

**Última actualización:** 2025-10-15 — Responsable: Copilot Ops
