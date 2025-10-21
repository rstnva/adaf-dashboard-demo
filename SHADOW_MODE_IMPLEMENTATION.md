# ================================================================================================
# SHADOW MODE v1.0 - Implementation Summary
# ================================================================================================
# Date: 2025-10-20
# Author: GitHub Copilot
# Status: ✅ READY FOR 72h VALIDATION
# ================================================================================================

## Overview

Shadow Mode enables dual ingestion (mock + live shadow sources) for Oracle Core validation without impacting production operations. All components operate in `dry-run` mode with metrics collection for 72h observation windows.

---

## Components Delivered

### 1. Docker Compose Profile (`shadow`)
**File:** `docker-compose.prod.yml`

**Services:**
- **oracle-core**: Oracle Core in shadow mode with dual ingestion
  - Profile: `shadow`
  - Mode: `dry-run` + `shadow`
  - VOX enabled with full signal suite
  - Health check: `/api/oracle/v1/health`
  
- **kpi-collector**: Hourly metrics collection service
  - Collects Oracle, VOX, and DQ metrics
  - Persists to Postgres (stub implementation)
  - Optional Prometheus pushgateway integration
  - Runs every 60 minutes

**Usage:**
```bash
docker compose -f docker-compose.prod.yml --profile shadow up -d postgres redis prometheus grafana oracle-core kpi-collector
```

---

### 2. Environment Configuration
**File:** `.env.shadow.demo`

**Key Settings:**
- `EXECUTION_MODE=dry-run`
- `ORACLE_SOURCE_MODE=shadow`
- `ORACLE_VOX_ENABLED=true`
- VOX scoring weights and thresholds
- DQ cooldown and quarantine parameters
- Redis namespace: `shadow72h`

**Feature Flags:**
- All features enabled (WSP, Oracle, VOX, DQP, Lineage, etc.)

---

### 3. Scripts & Utilities

#### KPI Collector
**File:** `scripts/shadow/kpi-collector.mjs`
- Collects metrics from Oracle, VOX, and DQ endpoints
- Persists KPIs to Postgres (stub - requires Prisma implementation)
- Optional Prometheus pushgateway push
- Structured JSON logging

#### Health Check (Node.js)
**File:** `scripts/shadow/health-check.mjs`
- Validates Oracle health endpoint
- Checks Prometheus metrics (VOX VPI, shadow RMSE, quorum failures)
- Exit code 0 on success, 1 on failure

#### Health Check (Bash)
**File:** `scripts/shadow/health-check.sh`
- Shell-based health validation
- Grep-based metric extraction
- Portable for CI/CD pipelines

---

### 4. Documentation
**File:** `RUNBOOK_SHADOW_MODE.md`

**Sections:**
- Quick start commands
- Health check procedures
- Monitoring and alerting setup
- Operational procedures (start/stop/restart)
- Troubleshooting guide
- Data management (Redis namespace, Postgres backups)
- Post-validation analysis steps

---

## Architecture

```
┌─────────────────┐
│   MOCK FEEDS    │  ← 100% deterministic
└────────┬────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
  ┌─────────────┐          ┌─────────────┐
  │  ORACLE     │          │  ORACLE     │
  │  (mock)     │          │  (shadow)   │
  │  Port 3000  │          │  Container  │
  └─────────────┘          └──────┬──────┘
         │                        │
         │                        ├─ VOX Feeds (X, Reddit, Aggregate, Signals)
         │                        ├─ OnChain Feeds (DeFiLlama, etc.)
         │                        └─ Consensus Layer (k-of-n quorum)
         │                        │
         ▼                        ▼
  ┌──────────────────────────────────┐
  │     PROMETHEUS METRICS           │
  │  - oracle_shadow_rmse            │
  │  - vox_vpi{asset,provider}       │
  │  - oracle_quorum_fail_total      │
  └──────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │     GRAFANA DASHBOARDS           │
  │  - Shadow Validation             │
  │  - VOX Metrics                   │
  │  - DQ Status                     │
  └──────────────────────────────────┘
```

---

## Validation Workflow

### Phase 1: Startup (Day 0)
1. Load `.env.shadow.demo`
2. Start shadow profile: `docker compose --profile shadow up -d`
3. Run health checks: `bash scripts/shadow/health-check.sh`
4. Verify Grafana dashboards: http://localhost:3001
5. Confirm KPI collector logs: `docker logs -f adaf_kpi_collector`

### Phase 2: Observation (Days 1-3)
- Monitor Grafana for:
  - Shadow RMSE < 0.05 threshold
  - VOX shock/brigading alert frequency
  - Quorum failure rate < 1%
  - DQ quarantine events
- Review hourly KPI snapshots in Postgres
- Check for anomalies in Prometheus

### Phase 3: Analysis (Day 3+)
- Export KPI CSV from Postgres
- Generate shadow validation report
- Compare mock vs shadow distributions
- Review false positive/negative rates
- Document edge cases and failure modes

### Phase 4: Decision
- **PASS**: Shadow RMSE consistently < 0.05, <5 VOX false positives/day
- **CONDITIONAL PASS**: Minor tuning needed (thresholds, weights)
- **FAIL**: Systematic bias, high quorum failure rate, excessive false positives

---

## Key Metrics & Thresholds

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| `oracle_shadow_rmse` | < 0.05 | > 0.10 |
| `vox_shock_events_total` | < 10/day | > 20/day |
| `vox_brigading_events_total` | < 5/day | > 10/day |
| `oracle_quorum_fail_total` | < 1% | > 3% |
| `oracle_feed_quarantined` | < 5 feeds | > 10 feeds |
| Oracle uptime | > 99.5% | < 99% |

---

## Known Limitations & Future Work

### Current Stub Implementations
1. **KPI Persistence**: `kpi-collector.mjs` has stub for Postgres write
   - Action: Implement with Prisma or pg client
   - Table: `shadow_kpi` (timestamp, namespace, oracle_*, vox_*, dq_*)

2. **Prometheus Push**: Pushgateway integration commented out
   - Action: Add prom-client library and implement push logic

3. **Report Generation**: No automated report script yet
   - Action: Create `scripts/shadow/generate-report.mjs` for CSV export and analysis

### Configuration Needed Before Production
1. **Secrets**: Create Docker secrets for production:
   ```bash
   echo "password" | docker secret create postgres_password -
   echo "key" | docker secret create app_secret_key -
   ```

2. **Alerting**: Configure Prometheus alertmanager with Slack/PagerDuty webhooks

3. **Backup**: Set up WAL-G or pg_dump for shadow KPI table

---

## Quick Reference

### Start Shadow Mode
```bash
docker compose -f docker-compose.prod.yml --profile shadow up -d postgres redis prometheus grafana oracle-core kpi-collector
```

### Health Check
```bash
bash scripts/shadow/health-check.sh
```

### View Logs
```bash
docker compose --profile shadow logs -f oracle-core
```

### Stop Shadow Mode
```bash
docker compose --profile shadow down
```

### Export Metrics
```bash
curl -s localhost:3000/api/metrics/wsp > shadow-metrics-$(date +%Y%m%d).txt
```

---

## Success Criteria

- [ ] Oracle Core starts in shadow mode with `ORACLE_SOURCE_MODE=shadow`
- [ ] VOX feeds ingest successfully from X, Reddit, and aggregate sources
- [ ] KPI collector runs hourly and logs metrics
- [ ] Grafana dashboards display shadow validation metrics
- [ ] Health checks pass consistently (< 1% failure rate)
- [ ] Shadow RMSE < 0.05 for 95% of feeds over 72h
- [ ] VOX alerts trigger appropriately (< 10 false positives/day)
- [ ] No memory leaks or resource exhaustion over 72h run
- [ ] Documentation complete and accurate for handoff

---

## Next Steps

1. **Test Startup**: Run `docker compose --profile shadow up -d` and verify all services start
2. **Validate Health Endpoints**: Run `bash scripts/shadow/health-check.sh`
3. **Implement KPI Persistence**: Add Prisma or pg client to `kpi-collector.mjs`
4. **Configure Alerts**: Add Prometheus alerting rules for shadow thresholds
5. **Generate Grafana Dashboards**: Create Shadow Validation and VOX Metrics dashboards
6. **Run 72h Validation**: Monitor, collect data, analyze results
7. **Generate Report**: Export KPIs, calculate metrics, document findings
8. **Decision Gate**: Approve for mixed-mode rollout or iterate

---

## Contact & Escalation

- **Owner**: ADAF Dashboard Pro Team
- **Runbooks**: `RUNBOOK_SHADOW_MODE.md`, `RUNBOOK_ORACLE_CORE.md`
- **Docs**: `VOX_POPULI_V1_1_EXECUTIVE_SUMMARY.md`, `ORACLE_CORE_V1_EXECUTIVE_SUMMARY.md`
- **Alerts**: Check `monitoring/prometheus.yml` for alert rules
- **Logs**: `docker compose --profile shadow logs -f`

---

**End of Shadow Mode v1.0 Implementation Summary**
