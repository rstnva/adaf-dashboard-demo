# Sprint Oracle Core — 2025-10-15

> Activar el core multi-oráculo con seguridad Fortune 500, garantizando consenso confiable, observabilidad total y readiness para ejecutar en modo shadow/mixed sin deuda operativa.

## 🎯 Objetivo General
Consolidar el oráculo institucional ADAF como backbone cuantitativo listo para producción, con pipelines de datos resilientes, consenso multi-fuente verificable, observabilidad accionable y controles de seguridad corporativos.

### 📍 Actualización 2025-10-15
- Se documentó el contrato completo en [`PROMPT_ORACLE_CORE_v1.1.md`](../documentacion/PROMPT_ORACLE_CORE_v1.1.md) para mantener el alcance alineado.
- Se scaffoldeó el módulo **Vox Populi Sentiment v1** (adapters, digest, consensus, métricas, catalog). Las implementaciones reales permanecen pendientes.
- Se agregaron catálogos base (`feeds.onchain.shadow.json`, `heartbeats.json`, `rpc.endpoints.json`) como semillas para la fase shadow.
- Se completó la evaluación del estado actual del motor (`services/oracle-core`) y se elaboró un plan de ejecución en diez fases Fortune 500 (guardrails, storage/registry, ingest/digest, consenso/DQ, servicio/SDK, Vox Populi, UI Command Center, observabilidad, pruebas, documentación/calidad) para guiar el trabajo de las próximas dos semanas.
- El tablero operativo (`todo list Fortune 500`) queda preparado con la fase de assessment cerrada y las siguientes fases listas para iniciar — la primera acción mañana será abordar migraciones Prisma, seeds de catálogos y almacenamiento persistente (Fase 1).

### 📍 Actualización 2025-10-16
- Se extendió el modelo Prisma de `signals` con `externalId` y `tags`, generando migración `20251016-oracle-signal-external-id` para garantizar trazabilidad Fortune 500 de cada señal.
- El almacenamiento `services/oracle-core/storage/pg.ts` ahora persiste señales y evidencias en Postgres (upsert + evidencia granular) reemplazando el mapa en memoria.
- `seed-feeds.ts` sincroniza catálogos mock, shadow y Vox en Postgres además de Redis, y `loadFeeds()` unifica las definiciones para toda la aplicación.

## 🗓️ Ventana y responsables
- **Inicio:** 2025-10-15  
- **Cierre objetivo:** 2025-10-29 (10 días hábiles + buffer Fortune 500)  
- **Workstreams:**
  - *Data Platform & Storage* — Platform Guild
  - *Consensus & Data Quality* — Quant Research Guild
  - *Adapters & On-chain Integrations* — DeFi Integrations Squad
  - *Security & RBAC* — Security Guild
  - *SDK & Command Center UI* — Frontend Guild
  - *Operations & Rollout* — SRE Guild

## 📦 Alcance y prioridades

### Prioridad 1 — Faltantes críticos (do-or-die)
1. **Esquema de datos & migraciones (PG/Prisma)**
   - Alcance: Tablas `feeds`, `signals` (PK compuesta `feedId`+`ts`), `evidence` (FK `signalId`), `quarantine_events`, `read_stats`; índices `signals(feedId, ts DESC)` y `quarantine_events(feedId, ts)`; particionado diario y job de purga (30–90d).
   - DoD: `pnpm prisma migrate deploy` sin errores; `node infra/seed.ts` con seed completo y verificación de particiones; documentación del job de retención en runbook.
   - Evidencia: captura de `migrate` + snapshot de tablas iniciales en `evidence/v1.6-oracle/schema.md`.

2. **Reconciler & consenso multi-oráculo**
   - Alcance: Implementar estrategias `weightedMedian`, `trimmedMean`, `k-of-n`, penalización `latency-score` + `confidence/price` (Pyth), reglas DQ (`>3σ` vs mediana ⇒ discard, `roundAge > heartbeat*2` ⇒ stale, UMA disputes ⇒ quarantine).
   - DoD: Suite `tests/consensus/*.test.ts` verde con fixtures extensos; documentación en `docs/runbooks/ORACLE_CONSENSUS.md`; métricas de precisión (`shadow_rmse`).

3. **Adapters 5× on-chain (modo shadow) + smoketests**
   - Alcance: Implementar adapters para Chainlink, Pyth, RedStone, Band/Tellor, Chronicle/UMA con evidencia enriquecida (`roundId`, `price_id`, `block`); smoketest por adapter (lee feed conocido, valida TTL/heartbeat, marca stale).
   - DoD: `pnpm test:adapters` verde; `oracle_live_reads_total` y `oracle_adapter_latency_seconds` expuestos en Prometheus; smoke logs archivados.

4. **Heartbeats & RPC registry completos**
   - Alcance: Completar `heartbeats.json` y `rpc.endpoints.json` (primario/backup por red); healthchecks con backoff + circuit breakers atómicos por RPC.
   - DoD: `/health` reporta RPC OK; métrica `oracle_rpc_circuit_state` visible; pruebas de resiliencia con fallback documentadas.

5. **Observabilidad completa**
   - Alcance: Instrumentar latencias ingest/digest/consensus, `stale_ratio`, `quorum_fail_total`, `shadow_rmse`; exportar dashboard Grafana "Oracle Freshness (DEMO)" (JSON en repo).
   - DoD: Dashboard se renderiza en ambiente mock; capturas y JSON en `evidence/v1.6-oracle/observability/`.

6. **Seguridad & RBAC**
   - Alcance: Tokens con scopes (`oracle.reader`, `oracle.publisher`, `oracle.admin`), rate limiting `429`, circuit breaker `503`; auditoría `x-correlation-id` en `/publish` y `/query`.
   - DoD: Tests API (200/304/429/503) verdes; verificación de scopes en `tests/security/oracle-auth.test.ts`; runbook de claves actualizado.

### Prioridad 2 — Núcleo operativo
7. **SDK TS productizable**
   - Alcance: `OracleClient` con `getLatest`, `query`, `subscribe`, `publish`; reintentos + re-suscripción WS; exportar tipos (`Feed`, `Signal`, `EvidenceRef`) desde schema único.
   - DoD: Ejemplo en README SDK; mock integrado a dashboard (`src/store/oracle.mock.ts`); suite `sdk/oracle-client.test.ts` verde.

8. **Home = Oracle Command Center (UI)**
   - Alcance: KPIs (`stale_ratio`, `%quorum_ok`, `confidence_avg`, `signals/sec`, `p95_read_latency`, `DQ quarantine`, `MODE`, `subscribers`); tabla/heatmap Freshness + modal de provenance (`evidence[]`); badges por feed; banner "DEMO (MOCK DATA)".
   - DoD: Página consume sólo el SDK; pruebas de render con mock data en ADAF/LAV/backups.

9. **Replay & snapshots**
   - Alcance: CLI `oracle-replay` para grabar `.mock` y reproducir stream (time-warp); snapshots diarios de señales críticas con diff vs shadow.
   - DoD: `pnpm oracle:replay --file sample.mock` emite hacia `/publish`; docs y ejemplo.

10. **Quarantine & alerting**
    - Alcance: Persistir causa (`rule_id`, z-score, dispute flag); webhook (Discord/Slack) para eventos críticos (`price/*` quorum fail, stale persistente).
    - DoD: Alerta demostrable (fixture) en `tests/alerts/oracle-quarantine.test.ts`; runbook de respuesta.

### Prioridad 3 — Flip a mixed/live
11. **SLO monitors + checklist automatizado**
    - Alcance: Jobs 7d (`stale_ratio p95`, `shadow_rmse`, `read_latency p95`, `quorum_fail`); endpoint `/api/oracle/v1/readiness` que responde READY/NOT_READY con motivos.
    - DoD: READY solo cuando SLOs cumplen; reporte JSON versionado; smoke automatizado documentado.

12. **Runbook & rollback**
    - Alcance: Script `MODE=mixed` para desviar 10% de lectores internos al `.live` (mirror-serve) + botón/flag de rollback.
    - DoD: Dry-run 30 min documentado; rollback 1 comando verificado; evidencia en `docs/runbooks/ORACLE_ROLLOUT.md`.

### Opcionales valiosos (no bloquean)
- **DIA add-on (shadow)**: adapter + métricas `deviation_total{source="dia"}` (fuera del quórum base).
- **Data contracts por feed**: unidad, escala, límites esperados, semántica `stale`.
- **Export Parquet/CSV**: endpoint de extracción histórica.
- **Threat model + chaos**: escenarios RPC caído, feed congelado, desviación extrema, reloj fuera de sync.

## 🔜 Acciones inmediatas (primeras 72h)
- [ ] Congelar diseño de schema + particiones y generar migración inicial (`2025-10-16`).
- [ ] Definir fixtures de consenso + datasets comparativos (CAD/ETH/BTC) (`2025-10-16`).
- [ ] Completar `heartbeats.json` y `rpc.endpoints.json` con owners por red (`2025-10-17`).
- [ ] Montar pipelines de métricas y maquetar dashboard Grafana demo (`2025-10-17`).
- [ ] Redactar scopes RBAC y política de tokens (`2025-10-18`).

## 🧪 Quality Gates Fortune 500
- `pnpm lint`, `pnpm test`, `pnpm build` sin warnings.
- `pnpm prisma migrate deploy` + `node infra/seed.ts` sin errores; capturar salida en evidencias.
- `pnpm test:consensus`, `pnpm test:adapters`, `pnpm test:sdk` obligatorios por PR.
- `pnpm smoke:oracle` contra entorno shadow en marcha.
- Exportar cobertura (`coverage/`) y métricas (`metrics/*.prom`) a `evidence/v1.6-oracle/`.

## 📊 KPIs & observabilidad
- Latencias ingest/digest/consensus (p50/p95).
- `stale_ratio` global y por feed.
- `quorum_ok_percent`, `quorum_fail_total`.
- `shadow_rmse` vs referencia.
- `oracle_live_reads_total` por adapter.
- Estado circuit breaker RPC (`oracle_rpc_circuit_state`).

## 📂 Evidencias requeridas
- Carpeta `evidence/v1.6-oracle/` con subcarpetas `schema/`, `observability/`, `smoke/`, `readiness/`.
- Reporte diario de KPIs (`evidence/v1.6-oracle/daily-kpi.md`).
- Capturas Grafana + export JSON.
- Logs de smoketests por adapter + checklists firmados.

## 🧷 Dependencias y riesgos
- Acceso a nodos RPC de alta disponibilidad (contratos vigentes con Infura/Alchemy/QuickNode).
- Tiempo de provisión de secretos (Security Guild) para scopes RBAC.
- Disponibilidad de cron infra para jobs 7d (Platform).
- Riesgo de degradar pipelines existentes: usar modo shadow hasta completar readiness.

## 🤝 Cadencia & comunicación
- Daily stand-up (15 min) 09:30 CDMX, Slack `#oracle-core`.
- Demo interna viernes 2025-10-24 (mostrar consenso vs shadow, dashboards, UI Command Center).
- Sync SRE/Security cada 48h para revisar métricas de resiliencia.
- Reporte ejecutivo Fortune 500 cada lunes en `motor-del-dash/memoria/`.

## 🚀 Próximos PRs sugeridos
1. `feat(oracles): adapters 5× shadow + heartbeats/rpc registry + smoketests`
2. `feat(consensus): weightedMedian + DQ rules + quarantine pipeline`
3. `feat(observability): prometheus metrics + grafana dashboard json`
4. `feat(security): RBAC tokens, rate limit, audit trail + API tests`
5. `feat(sdk+ui): oracle-sdk v0.1 + Oracle Command Center (badges & KPIs)`
6. `feat(readiness): SLO monitors + /readiness + runbook mixed/rollback`
7. `feat(tooling): oracle-replay snapshots + webhook alerts`

> Actualiza este documento al cierre de cada stream y enlaza evidencias en `MEMORIA_GITHUB_COPILOT.md` para mantener trazabilidad Fortune 500.
