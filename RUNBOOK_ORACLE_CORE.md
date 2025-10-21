# RUNBOOK — Oracle Core v1.0 (Shadow → Mixed)

## Objetivo

Checklist y procedimientos para promoción de Oracle Core de modo shadow a mixed, con umbrales y validaciones Fortune 500.

---

## 1. Validación Shadow (pre-promoción)

- [ ] **Duración mínima:** 48–168h en shadow
- [ ] **Stale ratio** < 3% sostenido
- [ ] **Quorum fail** < 1% sostenido
- [ ] **oracle_shadow_rmse{price/*}** < 0.5–1.0% (media, sin colas largas)
- [ ] **0 DQ “red”** en feeds críticos
- [ ] **p95 `/latest`** < 450 ms
- [ ] **Métricas shadow**: `oracle_live_reads_total`, `oracle_shadow_rmse`, `oracle_oracle_deviation_total` presentes y creciendo
- [ ] **Feeds .live** activos: `price/{btc,eth,sol}_usd.live`, `por/{usdc,usdt}_reserves_usd.live`, `gas/eth_gwei.live`
- [ ] **No incidentes críticos** (ver logs, alertas Grafana)

---

## 2. Promoción a Mixed

- [ ] **Flip variable:** `ORACLE_SOURCE_MODE=mixed` (en .env o variable de entorno)
- [ ] **Aumentar `ORACLE_MIXED_RATIO`** progresivamente: 0.1 → 0.5 → 1.0
- [ ] **Monitorear circuit breakers** y rollback automático
- [ ] **Validar panel Grafana “Oracle Freshness (DEMO)”**
- [ ] **Registrar x-correlation-id** en logs al cambiar modo

---

## 3. Rollback

- [ ] **Flip a mock:** `ORACLE_SOURCE_MODE=mock` (rollback instantáneo)
- [ ] **Verificar restauración de métricas y feeds mock**

---

## 4. Pendientes críticos

- [ ] **Secrets:** Sin keys en repo, rotación documentada
- [ ] **Licencias:** `sources.registry.json` marcado con `tos_class`
- [ ] **Retention:** RAW (S3/MinIO) 90d, Signals (TSDB) 400d, PG JSONB 180d
- [ ] **Backups/DR:** snapshot TSDB/PG + restore drill agendado
- [ ] **Cost guardrails:** límite de subs WS y cuotas por token

---

## 5. CI/CD — Oracle Shadow Smoke

- [ ] **Job CI:** `oracle-shadow-smoke` (curl health/feeds/latest/metrics)
- [ ] **Grafana:** Panel “Oracle Freshness (DEMO)” presente
- [ ] **Checklist de promoción** (este archivo)
- [ ] **Script toggle:** `pnpm demo:shadow:on|off` (ver abajo)

---

## 6. Script toggle shadow

- [ ] **`pnpm demo:shadow:on`** — pone `ORACLE_SOURCE_MODE=shadow`, registra cambio en logs con x-correlation-id
- [ ] **`pnpm demo:shadow:off`** — pone `ORACLE_SOURCE_MODE=mock`, registra cambio en logs con x-correlation-id

---

## 7. VOX POPULI Alerts (ALR-VOX-*)

### 7.1 Configuración

- [ ] **Variable:** `VOX_ALERT_WEBHOOK_URL` configurada (Slack/Discord)
- [ ] **Budget guard:** `VOX_PROVIDER_BUDGET_PER_MIN=200` (límite de llamadas API)
- [ ] **Thresholds:**
  - `VOX_SHOCK_THRESHOLD=2.5` (z-score para ALR-VOX-001)
  - `VOX_DIVERGENCE_THRESHOLD=0.3` (HP filter para ALR-VOX-002)
  - `VOX_BRIGADING_THRESHOLD=75` (score 0-100 para ALR-VOX-003)

### 7.2 Alert Types

| ID            | Trigger                        | Action                               |
|---------------|--------------------------------|--------------------------------------|
| ALR-VOX-001   | Shock signal > threshold       | Webhook POST con correlation ID      |
| ALR-VOX-002   | Divergence (hype-price) > threshold | Webhook POST con correlation ID |
| ALR-VOX-003   | Brigading score > threshold    | Webhook POST con correlation ID      |

### 7.3 Response Workflow

1. **Recibir alerta** (webhook payload incluye `feed_id`, `value`, `threshold`, `correlation_id`)
2. **Validar en Vox War Room** (UI `/vox-war-room` para contexto visual)
3. **Consultar DQ report** (`/api/oracle/v1/dq/report?feeds=vox/*`) para estado de cuarentena
4. **Aplicar cooldown** si es falso positivo (ver `vox.rules.ts → isInCooldown`)
5. **Escalar** si es evento real (brigading coordinado, shock de mercado)

### 7.4 Checklist de Validación

- [ ] **Alerta de prueba:** Forzar shock > threshold y validar webhook recibido
- [ ] **Budget guard:** Verificar que llama a `checkProviderBudget` antes de ingest
- [ ] **Cooldown:** Validar que alertas repetidas respetan ventana de cooldown (600s default)
- [ ] **Logs:** Correlation ID presente en todos los mensajes de alerta

---

## 8. ⚠️ Test pendiente: E2E pretty-path

- El test E2E de pretty-path (rewrite /feeds/id/* → /feeds/by-id) queda pendiente para validación posterior.
- Motivo: requiere stack Next.js completo (puerto 3000) y entorno de staging real.
- No afecta la operación ni la cobertura de shadow/mixed/live, pero debe completarse antes de rollout 100% live.

---

> Última actualización: 2025-10-16
