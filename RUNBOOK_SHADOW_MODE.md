# ================================================================================================
# Shadow Mode Operational Runbook
# ================================================================================================
# Commands and procedures for running ADAF Dashboard Pro in Shadow Mode for 72h validation.
# ================================================================================================

---

## 📑 Quick Links — Navegación Rápida

- 🏠 [HUB de READMEs](ADAF-Billions-Dash-v2/motor-del-dash/documentacion/readmes/README.md) — Índice central
- 🎯 [DOCUMENTACION_COMPLETA_SHADOW_V1_1.md](DOCUMENTACION_COMPLETA_SHADOW_V1_1.md) — Documentación completa
- 📖 [SHADOW_MODE_QUICKREF.md](SHADOW_MODE_QUICKREF.md) — Referencia rápida
- 🏗️ [SHADOW_MODE_V1_1_ARCHITECTURE.md](motor-del-dash/arquitectura/SHADOW_MODE_V1_1_ARCHITECTURE.md) — Arquitectura
- 📦 [MODULO_SHADOW_MODE_V1_1_COMPLETO.md](motor-del-dash/modulos/MODULO_SHADOW_MODE_V1_1_COMPLETO.md) — Módulo completo
- 📊 [SPRINT_SHADOW_MODE_V1_1_REPORT.md](motor-del-dash/sprints/SPRINT_SHADOW_MODE_V1_1_REPORT.md) — Sprint report
- 🔧 [RUNBOOK_ORACLE_CORE.md](RUNBOOK_ORACLE_CORE.md) — Oracle Core runbook

---

## 📚 Índice de Contenido

1. [Quick Start](#quick-start)
2. [Health Checks](#health-checks)
3. [Monitoring](#monitoring)
4. [Operational Procedures](#operational-procedures)
5. [Alerting](#alerting)
6. [Troubleshooting](#troubleshooting)
7. [Post-Shadow Validation](#post-shadow-validation)
8. [Rollback Procedures](#rollback-procedures)

---

## Quick Start

```bash
# 1. Load shadow environment
source .env.shadow.demo

# 2. Start shadow infrastructure
docker compose -f docker-compose.prod.yml --profile shadow up -d postgres redis prometheus grafana oracle-core kpi-collector

# 3. Verify services
docker compose -f docker-compose.prod.yml --profile shadow ps

# 4. Run main dashboard in 100% MOCK mode (local dev)
pnpm demo:dash
```

---

## Health Checks

### Oracle Health
```bash
curl -s localhost:3000/api/oracle/v1/health | jq
```

Expected response:
```json
{
  "status": "healthy",
  "mode": "shadow",
  "feeds_count": 50,
  "consensus_ok": true
}
```

### Prometheus Metrics
```bash
curl -s localhost:3000/api/metrics/wsp | grep -E "vox_vpi|oracle_shadow_rmse|oracle_quorum_fail_total"
```

Expected metrics:
- `vox_vpi{asset="BTC",provider="x"}` - VOX VPI scores per asset/provider
- `oracle_shadow_rmse{feedId="..."}` - RMSE between mock and shadow feeds
- `oracle_quorum_fail_total` - Total quorum failures

### Quick Health Script
```bash
bash scripts/shadow/health-check.sh
# or
node scripts/shadow/health-check.mjs
```

---

## Monitoring

### View Logs
```bash
# Oracle Core
docker compose -f docker-compose.prod.yml --profile shadow logs -f oracle-core

# KPI Collector
docker compose -f docker-compose.prod.yml --profile shadow logs -f kpi-collector

# All shadow services
docker compose -f docker-compose.prod.yml --profile shadow logs -f
```

### Grafana Dashboards
- URL: http://localhost:3001
- Default credentials: admin / (from secret)
- Dashboards:
  - Oracle Core Shadow Validation
  - VOX POPULI Metrics
  - DQ & Quarantine Status

### Prometheus Queries
- URL: http://localhost:9090
- Example queries:
  ```promql
  # Shadow RMSE distribution
  histogram_quantile(0.95, oracle_shadow_rmse)
  
  # VOX shock events rate
  rate(vox_shock_events_total[1h])
  
  # Quarantine feed count
  sum(oracle_feed_quarantined)
  ```

---

## Operational Procedures

### Stop Shadow Services
```bash
docker compose -f docker-compose.prod.yml --profile shadow down
```

### Restart Specific Service
```bash
docker compose -f docker-compose.prod.yml --profile shadow restart oracle-core
```

### View Service Status
```bash
docker compose -f docker-compose.prod.yml --profile shadow ps
```

### Export Metrics Snapshot
```bash
# Export Prometheus snapshot (if configured)
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Export shadow KPIs from Postgres
# TODO: Add SQL query or script to export shadow_kpi table
```

---

## Alerting

### Configure Alerts
Edit `monitoring/prometheus.yml` to add alerting rules:
```yaml
groups:
  - name: oracle_shadow
    rules:
      - alert: OracleShadowHighRMSE
        expr: oracle_shadow_rmse > 0.05
        for: 5m
        annotations:
          summary: "Shadow RMSE above threshold"
```

### Test Webhooks
```bash
# Test Slack webhook (if configured)
curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Shadow mode test alert"}'
```

---

## Troubleshooting

### Oracle Core not starting
1. Check logs: `docker logs adaf_oracle_shadow`
2. Verify DATABASE_URL and REDIS_URL connectivity
3. Ensure secrets are created:
   ```bash
   echo "your_password" | docker secret create postgres_password -
   ```

### KPI Collector failing
1. Check Oracle Core is healthy: `curl localhost:3000/api/oracle/v1/health`
2. Verify endpoint access from container:
   ```bash
   docker exec adaf_kpi_collector wget -O- http://oracle-core:3000/api/oracle/v1/metrics
   ```

### Metrics not appearing in Prometheus
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify `prometheus.yml` scrape config includes Oracle endpoints
3. Restart Prometheus: `docker compose --profile shadow restart prometheus`

---

## Data Management

### Clear Shadow Namespace in Redis
```bash
docker exec -it adaf_redis_primary redis-cli --scan --pattern "shadow72h:*" | xargs docker exec -it adaf_redis_primary redis-cli del
```

### Backup Shadow KPIs
```bash
# TODO: Implement Postgres backup script for shadow_kpi table
```

---

## Post-Validation

### Analyze Results
1. Review Grafana dashboards for 72h trend
2. Export KPI CSV from Postgres
3. Compare shadow vs mock RMSE distribution
4. Review VOX alert frequency and false positive rate

### Generate Report
```bash
# TODO: Implement report generation script
# node scripts/shadow/generate-report.mjs --start 2025-10-17 --end 2025-10-20
```

### Shutdown Shadow Mode
```bash
docker compose -f docker-compose.prod.yml --profile shadow down
```

---

## See Also
- `RUNBOOK_ORACLE_CORE.md` - Oracle Core operational procedures
- `VOX_POPULI_V1_1_EXECUTIVE_SUMMARY.md` - VOX architecture and metrics
- `env.example` - Full environment variable reference
