
# SHADOW MODE v1.0 - QUICK REFERENCE

**Status:** ✅ READY FOR 72h VALIDATION  
**Date:** 2025-10-20  
**Sprint:** VOX POPULI v1.1 + Shadow Validation

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Validate configuration
bash scripts/shadow/validate-compose.sh

# 2. Start shadow infrastructure (requires Docker secrets first - see below)
docker compose -f docker-compose.prod.yml --profile shadow up -d

# 3. Run health check
bash scripts/shadow/health-check.sh
```

---

## 🔐 Prerequisites (One-Time Setup)

Create Docker secrets before starting:

```bash
echo "your_postgres_password" | docker secret create postgres_password -
echo "your_app_secret_key" | docker secret create app_secret_key -
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_grafana_password" | docker secret create grafana_password -
```

---

## 📊 Monitoring URLs

- **Grafana:** http://localhost:3001
- **Prometheus:** http://localhost:9090
- **Oracle Health:** http://localhost:3000/api/oracle/v1/health
- **Metrics Endpoint:** http://localhost:3000/api/metrics/wsp

---

## 🔍 Key Metrics to Watch

```bash
# Check shadow RMSE
curl -s localhost:3000/api/metrics/wsp | grep oracle_shadow_rmse

# Check VOX events
curl -s localhost:3000/api/metrics/wsp | grep -E "vox_shock|vox_brigading"

# Check quorum failures
curl -s localhost:3000/api/metrics/wsp | grep oracle_quorum_fail_total
```

---

## 📁 Files Created

- `docker-compose.prod.yml` — Added `oracle-core` and `kpi-collector` services with `profiles: ["shadow"]`
- `.env.shadow.demo` — Shadow mode environment configuration
- `scripts/shadow/kpi-collector.mjs` — Hourly metrics collector
- `scripts/shadow/health-check.mjs` — Node.js health check
- `scripts/shadow/health-check.sh` — Bash health check
- `scripts/shadow/validate-compose.sh` — Docker Compose validation
- `RUNBOOK_SHADOW_MODE.md` — Operational procedures
- `SHADOW_MODE_IMPLEMENTATION.md` — Architecture and metrics
- `SHADOW_MODE_READY.md` — Deployment guide (this file)

---

## ✅ Success Criteria (72h Validation)

| Metric | Target | Alert |
|--------|--------|-------|
| Shadow RMSE | < 0.05 | > 0.10 |
| VOX Shock Events | < 10/day | > 20/day |
| VOX Brigading | < 5/day | > 10/day |
| Quorum Failures | < 1% | > 3% |
| Oracle Uptime | > 99.5% | < 99% |

---

## 🛠️ Common Commands

```bash
# View logs
docker compose --profile shadow logs -f oracle-core
docker compose --profile shadow logs -f kpi-collector

# Stop shadow mode
docker compose --profile shadow down

# Restart specific service
docker compose --profile shadow restart oracle-core

# Export metrics snapshot
curl -s localhost:3000/api/metrics/wsp > shadow-metrics-$(date +%Y%m%d).txt
```

---

## 📞 Documentation

- **Quick Start:** This file (`SHADOW_MODE_READY.md`)
- **Operations:** `RUNBOOK_SHADOW_MODE.md`
- **Architecture:** `SHADOW_MODE_IMPLEMENTATION.md`
- **Oracle Core:** `RUNBOOK_ORACLE_CORE.md`
- **VOX Details:** `VOX_POPULI_V1_1_EXECUTIVE_SUMMARY.md`

---

## 🔄 Next Steps

1. **Before Validation:**
   - [ ] Create Docker secrets (see Prerequisites above)
   - [ ] Verify Prometheus scrape config includes Oracle targets
   - [ ] Import Grafana dashboards

2. **During Validation (72h):**
   - [ ] Monitor hourly for first 6 hours
   - [ ] Check daily for Days 1-3
   - [ ] Review Grafana for trends

3. **After Validation:**
   - [ ] Export metrics and KPIs
   - [ ] Generate validation report
   - [ ] Decision: PASS / CONDITIONAL / FAIL

---

**Ready to begin 72h validation run. Ensure prerequisites are complete, then execute Quick Start commands.**

_Generated: 2025-10-20_
