# Daily Operations Runbook - LAV/ADAF

## 🌅 Daily Start-of-Day Checklist

### 08:00 - System Health Check
```bash
# Quick health check script
./scripts/health-check.sh
```

#### Critical Services Status
- [ ] **Gateway API** - HTTP 200 on `/health`
- [ ] **Market Sentinel** - Last signal <2min ago
- [ ] **Risk Warden** - Risk calculations current
- [ ] **Executioner** - Order routing functional
- [ ] **PostgreSQL** - Connection pool healthy
- [ ] **Kafka** - All topics accessible
- [ ] **Redis** - Cache hit ratio >90%

#### Infrastructure Metrics
- [ ] **CPU Usage** <80% across all services
- [ ] **Memory Usage** <85% across all services  
- [ ] **Disk Usage** <90% on all volumes
- [ ] **Network Latency** <50ms internal comms

### 08:15 - Market Regime Assessment

#### Market Sentinel Review
```bash
curl -s http://localhost:3001/api/regime/current | jq '.'
```

**Expected Response:**
```json
{
  "timestamp": "2024-01-15T08:15:00Z",
  "regime": "NORMAL_EXPANSION",
  "confidence": 0.85,
  "dials": {
    "funding_rates": { "value": 0.02, "signal": "NEUTRAL" },
    "open_interest": { "value": 0.15, "signal": "BULLISH" },
    "fees": { "value": 0.45, "signal": "NEUTRAL" },
    "lending_utilization": { "value": 0.68, "signal": "CAUTIOUS" },
    "eth_staked": { "value": 0.22, "signal": "BULLISH" },
    "stablecoin_mcap": { "value": 125000, "signal": "NEUTRAL" },
    "etf_flows": { "value": 450, "signal": "BULLISH" }
  }
}
```

**Action Items by Regime:**
- **RISK_OFF**: Reduce leverage, increase cash allocation
- **EXPANSION**: Normal operations, full capacity
- **CONTRACTION**: Defensive positioning, monitor liquidity
- **CRISIS**: Emergency protocols, halt non-essential trading

### 08:30 - Risk Position Review

#### Portfolio Risk Metrics
```bash
curl -s http://localhost:3002/api/risk/portfolio | jq '.summary'
```

**Critical Thresholds:**
- [ ] **VaR (1d)** ≤ 3% NAV
- [ ] **Max Drawdown** ≤ 5% from peak
- [ ] **Leverage Ratio** ≤ 2.5x
- [ ] **Concentration** No single position >10% NAV
- [ ] **Liquidity** >50% positions tradeable within 1hr

#### Immediate Actions if Violations:
1. **VaR Breach**: Reduce position sizes immediately
2. **Drawdown Breach**: Halt new positions, assess attribution
3. **Leverage Breach**: Deleverage via safest exits first
4. **Concentration Breach**: Trim oversized positions
5. **Liquidity Breach**: Swap illiquid for liquid alternatives

### 08:45 - Execution Engine Status

#### Order Flow Analysis
```bash
curl -s http://localhost:3003/api/execution/stats/24h | jq '.'
```

**Key Metrics:**
- [ ] **Fill Rate** ≥95%
- [ ] **Average Slippage** ≤25bps
- [ ] **Routing Success** ≥98%
- [ ] **Settlement Rate** ≥99%

#### Venue Performance Review
- [ ] **CoW Swap**: Batch auction success rate
- [ ] **Odos**: Route optimization effectiveness  
- [ ] **1inch**: Fallback reliability
- [ ] **RFQ Venues**: Response times <500ms

---

## 🔄 Hourly Monitoring Tasks

### Market Data Validation
```bash
# Run every hour via cron
0 * * * * /opt/lav-adaf/scripts/validate-feeds.sh
```

#### Data Quality Checks
- [ ] Price feeds <30s stale
- [ ] Volume data consistent across sources
- [ ] No missing OHLCV bars
- [ ] Funding rates updated every 8hrs
- [ ] Options IV surfaces complete

### Position Reconciliation
```bash
# Position sync check
curl -s http://localhost:3001/api/positions/reconcile
```

#### Cross-Venue Balance Check
- [ ] On-chain balances match internal ledger
- [ ] CEX balances reconciled via API
- [ ] Pending orders tracked accurately
- [ ] PnL attribution consistent

---

## 🚨 Incident Response Procedures

### Severity Levels

#### **P0 - Critical (15min response)**
- System-wide outage
- Security breach detected
- Risk limit violations >2x
- Data corruption/inconsistency

**Immediate Actions:**
1. Alert war room via Slack `@channel`
2. Execute circuit breaker protocol
3. Preserve logs and system state
4. Initiate incident commander role

#### **P1 - High (1hr response)**
- Single service degradation
- Performance degradation >50%
- Minor risk violations
- Data feed interruptions

**Standard Response:**
1. Alert on-call engineer
2. Assess scope and impact
3. Implement temporary mitigation
4. Plan permanent resolution

#### **P2 - Medium (4hr response)**
- Non-critical feature issues
- Minor performance degradation
- Documentation gaps
- Enhancement requests

### Common Issues & Solutions

#### Market Sentinel Not Updating
```bash
# Check service status
docker logs market-sentinel-1 --tail=50

# Common fixes:
# 1. Restart service
docker-compose restart market-sentinel

# 2. Check Kafka connectivity
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic market-regime --from-beginning --max-messages 5

# 3. Verify data feeds
curl -s http://localhost:3001/api/feeds/status
```

#### Risk Warden Alert Storm
```bash
# Check recent violations
curl -s http://localhost:3002/api/violations?limit=20

# Emergency risk reduction
curl -X POST http://localhost:3002/api/emergency/reduce \
  -H "Content-Type: application/json" \
  -d '{"target_var": 0.02, "timeframe": 300}'
```

#### Execution Failures Spike
```bash
# Check venue status
curl -s http://localhost:3003/api/venues/status

# Enable emergency routing
curl -X POST http://localhost:3003/api/routing/emergency \
  -d '{"mode": "CONSERVATIVE", "max_slippage": 0.001}'
```

---

## 📊 Performance Monitoring

### Key Dashboards (Grafana)

#### **System Overview**
- `http://localhost:3000/d/system-overview`
- Service health status
- Resource utilization
- Error rate trends

#### **Trading Performance**
- `http://localhost:3000/d/trading-performance`
- PnL attribution
- Sharpe ratio trends
- Drawdown analysis

#### **Risk Metrics**
- `http://localhost:3000/d/risk-metrics`
- VaR tracking
- Limit utilization
- Correlation matrices

#### **Execution Analytics**
- `http://localhost:3000/d/execution-analytics`
- Fill rate by venue
- Slippage analysis
- Routing efficiency

### Daily Reports Generation

#### 09:00 - Generate Overnight Report
```bash
# Automated daily report
./scripts/generate-daily-report.sh $(date -d "yesterday" +%Y-%m-%d)
```

**Report Includes:**
- [ ] PnL breakdown by strategy
- [ ] Risk metrics summary
- [ ] Execution statistics
- [ ] System performance metrics
- [ ] Notable events/incidents

#### 17:00 - EOD Summary
```bash
# End of day summary
./scripts/generate-eod-summary.sh
```

---

## 🛠️ Maintenance Windows

### Daily Maintenance (02:00 UTC)
- [ ] Database backup verification
- [ ] Log rotation and cleanup
- [ ] Cache warming for next day
- [ ] Performance metrics aggregation

### Weekly Maintenance (Sunday 01:00 UTC)
- [ ] System updates (non-critical)
- [ ] Full database backup
- [ ] Performance optimization review
- [ ] Documentation updates

### Monthly Maintenance (1st Sunday 00:00 UTC)
- [ ] Security patches
- [ ] Configuration review
- [ ] Disaster recovery testing
- [ ] Capacity planning review

---

## 📋 Compliance Checklist

### Daily Compliance Tasks
- [ ] Transaction screening (KYT)
- [ ] Sanction list updates
- [ ] Unusual activity review
- [ ] Regulatory filing prep

### Weekly Compliance Tasks
- [ ] Risk limit attestation
- [ ] Audit trail verification
- [ ] Client communication review
- [ ] Regulatory update assessment

### Monthly Compliance Tasks
- [ ] Full compliance audit
- [ ] Policy review and updates
- [ ] Training completion verification
- [ ] External audit preparation

---

## 🔍 Troubleshooting Quick Reference

### Performance Issues
```bash
# CPU bottleneck identification
top -p $(pgrep -d',' -f lav-adaf)

# Memory leak detection
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Database performance
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Network Issues
```bash
# Service connectivity test
./scripts/connectivity-test.sh

# Kafka lag monitoring
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --all-groups
```

### Data Issues
```bash
# Data freshness check
curl -s http://localhost:3001/api/health/data-freshness

# Reconciliation report
./scripts/daily-reconciliation.sh
```

---

## 📞 Escalation Contacts

### Technical Issues
- **L1 Support**: Slack `#lav-adaf-support`
- **L2 Engineering**: Slack `#lav-adaf-engineering`  
- **L3 Architecture**: Slack `#lav-adaf-architecture`

### Business Issues
- **Risk Management**: Slack `#risk-management`
- **Compliance**: Slack `#compliance-alerts`
- **Executive**: Slack `#executive-alerts`

### Emergency Contacts
- **War Room**: Slack `#war-room`
- **On-Call**: PagerDuty rotation
- **Security**: Slack `#security-incidents`

---

## 📝 End-of-Day Checklist

### 17:30 - Daily Wrap-up
- [ ] Review all open positions
- [ ] Confirm risk metrics within limits
- [ ] Check overnight position plan
- [ ] Verify backup systems ready
- [ ] Update operational log

### 18:00 - Handoff Preparation
- [ ] Brief night shift on day events
- [ ] Highlight any watch items
- [ ] Confirm emergency procedures ready
- [ ] Test communication channels

**🎯 Daily Success Criteria:**
- All systems green ✅
- Risk metrics within bounds ✅
- No unresolved P0/P1 incidents ✅
- Daily PnL reconciled ✅
- Team briefed and confident ✅