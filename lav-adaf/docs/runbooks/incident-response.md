# Incident Response Playbook - LAV/ADAF

## 🚨 Emergency Response Framework

### Incident Severity Classification

#### **P0 - CRITICAL** ⚠️ *15 minute response*
**Definition:** System-wide failure affecting core trading operations

**Triggers:**
- Trading system completely down >5 minutes
- Security breach or unauthorized access detected
- Risk limits breached by >200% (e.g., VaR >6% NAV)
- Data corruption affecting position/PnL calculation
- Loss of connectivity to >50% trading venues simultaneously

**Immediate Response Protocol:**
1. **Alert War Room** (0-2 minutes)
   ```bash
   # Automated P0 alert
   ./scripts/emergency-alert.sh P0 "DESCRIPTION"
   ```
   - Slack: `@channel` in `#war-room`
   - PagerDuty: Escalate to all on-call engineers
   - SMS/Call: Risk manager + CTO

2. **Engage Circuit Breakers** (2-5 minutes)
   ```bash
   # Emergency stop all trading
   curl -X POST http://localhost:3003/api/emergency/halt-all \
     -H "Authorization: Bearer ${EMERGENCY_TOKEN}"
   ```

3. **Preserve Evidence** (5-10 minutes)
   ```bash
   # Capture system state
   ./scripts/incident-snapshot.sh
   # Creates timestamped logs, DB dumps, metrics
   ```

4. **Incident Commander Assignment** (10-15 minutes)
   - Establish communication bridge
   - Coordinate response teams
   - Brief executive team

#### **P1 - HIGH** 🔥 *1 hour response*
**Definition:** Significant service degradation with business impact

**Triggers:**
- Single critical service down (Market Sentinel, Risk Warden, Executioner)
- Performance degradation >50% (latency, throughput)
- Risk violations within bounds but persistent
- Major venue connectivity issues
- Data feed interruptions >30 minutes

**Response Protocol:**
1. **Alert On-Call Team** (0-15 minutes)
2. **Impact Assessment** (15-30 minutes)
3. **Mitigation Implementation** (30-60 minutes)
4. **Stakeholder Communication** (within 1 hour)

#### **P2 - MEDIUM** ⚡ *4 hour response*
**Definition:** Non-critical issues with minimal business impact

#### **P3 - LOW** 📋 *24 hour response*  
**Definition:** Minor issues, enhancements, documentation

---

## 🎯 Specific Incident Playbooks

### Market Sentinel Down

**Symptoms:**
- No regime updates >5 minutes
- API health check fails
- Dashboard shows stale data

**Diagnosis Steps:**
```bash
# 1. Check service status
docker ps | grep market-sentinel
curl -f http://localhost:3001/health || echo "Service down"

# 2. Check logs for errors
docker logs market-sentinel-1 --tail=100

# 3. Verify dependencies
kafka-topics --bootstrap-server localhost:9092 --list | grep market-regime
redis-cli ping
```

**Resolution Steps:**
1. **Quick Restart** (try first)
   ```bash
   docker-compose restart market-sentinel
   # Wait 30 seconds, verify health
   ```

2. **Full Restart with Cleanup**
   ```bash
   docker-compose down market-sentinel
   docker volume prune -f
   docker-compose up -d market-sentinel
   ```

3. **Fallback to Manual Regime**
   ```bash
   # Set manual regime while debugging
   curl -X POST http://localhost:3001/api/regime/manual \
     -d '{"regime": "NORMAL_EXPANSION", "duration": "1h"}'
   ```

**Prevention:**
- Implement health checks with auto-restart
- Add redundant data sources
- Create manual override capabilities

### Risk Warden Alert Storm

**Symptoms:**
- >20 risk alerts in 5 minutes
- Risk limits oscillating near boundaries
- Multiple portfolio violations

**Diagnosis Steps:**
```bash
# 1. Check recent violations
curl -s http://localhost:3002/api/violations?limit=50 | jq '.[]'

# 2. Analyze root cause
curl -s http://localhost:3002/api/risk/attribution | jq '.'

# 3. Check for data anomalies
./scripts/risk-data-validation.sh
```

**Resolution Steps:**
1. **Emergency Risk Reduction**
   ```bash
   # Immediate 50% position reduction
   curl -X POST http://localhost:3002/api/emergency/reduce \
     -d '{"reduction_pct": 0.5, "timeframe": 300}'
   ```

2. **Identify Contributing Positions**
   ```bash
   # Find high-risk positions
   curl -s http://localhost:3002/api/positions/risk-ranked | head -10
   ```

3. **Targeted Position Adjustments**
   ```bash
   # Close specific high-risk positions
   ./scripts/emergency-position-close.sh POSITION_ID
   ```

### Executioner Fill Rate Drop

**Symptoms:**
- Fill rate <90% for >10 minutes
- High slippage across venues
- Order timeouts increasing

**Diagnosis Steps:**
```bash
# 1. Check venue health
curl -s http://localhost:3003/api/venues/health

# 2. Analyze recent orders
curl -s http://localhost:3003/api/orders?status=failed&limit=20

# 3. Check routing logic
curl -s http://localhost:3003/api/routing/diagnostics
```

**Resolution Steps:**
1. **Switch to Conservative Routing**
   ```bash
   curl -X POST http://localhost:3003/api/routing/mode \
     -d '{"mode": "CONSERVATIVE", "timeout": 60}'
   ```

2. **Disable Problematic Venues**
   ```bash
   # Temporarily disable failing venues
   curl -X POST http://localhost:3003/api/venues/disable \
     -d '{"venues": ["VENUE_ID"], "duration": 3600}'
   ```

3. **Manual Order Processing**
   ```bash
   # Process critical orders manually
   ./scripts/manual-execution.sh --priority=high
   ```

### Database Connection Pool Exhaustion

**Symptoms:**
- "Too many connections" errors
- Query timeouts
- Services unable to connect to DB

**Diagnosis Steps:**
```bash
# 1. Check active connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Identify long-running queries
psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
         FROM pg_stat_activity 
         WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

# 3. Check connection pool status
curl -s http://localhost:3001/api/db/pool-status
```

**Resolution Steps:**
1. **Kill Long-Running Queries**
   ```bash
   # Kill queries running >10 minutes
   psql -c "SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes';"
   ```

2. **Restart Connection Pool**
   ```bash
   # Restart services to reset connections
   docker-compose restart gateway market-sentinel risk-warden
   ```

3. **Increase Connection Limits** (if needed)
   ```bash
   # Update PostgreSQL config
   echo "max_connections = 200" >> /etc/postgresql/postgresql.conf
   systemctl restart postgresql
   ```

### Kafka Message Backlog

**Symptoms:**
- Consumer lag >1000 messages
- Processing delays
- Memory usage climbing

**Diagnosis Steps:**
```bash
# 1. Check consumer group lag
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --all-groups

# 2. Check topic details
kafka-topics --bootstrap-server localhost:9092 \
  --describe --topic market-regime

# 3. Monitor partition distribution
kafka-run-class kafka.tools.StateChangeLogMerger \
  --logs /var/kafka-logs
```

**Resolution Steps:**
1. **Scale Consumer Instances**
   ```bash
   # Add consumer replicas
   docker-compose up -d --scale market-sentinel=3
   ```

2. **Clear Old Messages** (if safe)
   ```bash
   # Reduce retention to clear backlog
   kafka-configs --bootstrap-server localhost:9092 \
     --entity-type topics --entity-name market-regime \
     --alter --add-config retention.ms=3600000
   ```

3. **Reset Consumer Group** (last resort)
   ```bash
   # Reset to latest offset
   kafka-consumer-groups --bootstrap-server localhost:9092 \
     --group market-sentinel-group --reset-offsets \
     --to-latest --topic market-regime --execute
   ```

---

## 📊 Incident Communication Templates

### P0 Initial Alert
```
🚨 P0 INCIDENT - IMMEDIATE ATTENTION REQUIRED 🚨

Incident ID: INC-2024-XXXX
Start Time: ${TIMESTAMP}
Severity: P0 - CRITICAL
Impact: ${IMPACT_DESCRIPTION}

Systems Affected:
- ${AFFECTED_SYSTEMS}

Immediate Actions Taken:
- ${ACTIONS_TAKEN}

Incident Commander: ${IC_NAME}
War Room: ${BRIDGE_LINK}

Status updates every 15 minutes until resolved.
```

### P1 Status Update
```
📋 P1 Incident Update - ${INCIDENT_ID}

Time: ${UPDATE_TIME}
Status: ${CURRENT_STATUS}

Progress:
- ${PROGRESS_ITEM_1}
- ${PROGRESS_ITEM_2}

Next Steps:
- ${NEXT_ACTION}
- ETA: ${ESTIMATED_RESOLUTION}

Impact: ${CURRENT_IMPACT}
```

### Resolution Notice
```
✅ INCIDENT RESOLVED - ${INCIDENT_ID}

Resolution Time: ${RESOLUTION_TIME}
Duration: ${TOTAL_DURATION}

Root Cause: ${ROOT_CAUSE_SUMMARY}

Actions Taken:
- ${RESOLUTION_STEP_1}
- ${RESOLUTION_STEP_2}

Post-Incident Review: Scheduled for ${PIR_DATE}
Follow-up Items: ${FOLLOW_UP_COUNT} items tracked
```

---

## 🔍 Post-Incident Review Process

### Within 24 Hours
1. **Timeline Documentation**
   - Incident start/detection time
   - Key decision points
   - Resolution milestones

2. **Impact Assessment**
   - Financial impact (PnL, costs)
   - Operational impact (downtime, degradation)
   - Reputational impact

3. **Response Evaluation**
   - Response time vs SLA
   - Communication effectiveness
   - Tooling adequacy

### Within 1 Week
1. **Root Cause Analysis**
   - Technical root cause
   - Contributing factors
   - Human factors

2. **Action Items Generation**
   - Preventive measures
   - Detection improvements
   - Response enhancements

3. **Documentation Updates**
   - Runbook improvements
   - Alert refinements
   - Training updates

### Blameless Post-Mortem Template
```markdown
# Post-Incident Review: ${INCIDENT_ID}

## Incident Summary
- **Date/Time**: ${INCIDENT_TIME}
- **Duration**: ${DURATION}
- **Severity**: ${SEVERITY}
- **Services Affected**: ${SERVICES}

## Timeline
| Time | Event | Action Taken |
|------|-------|--------------|
| ${TIME1} | ${EVENT1} | ${ACTION1} |

## Impact
- **Users Affected**: ${USER_COUNT}
- **Revenue Impact**: $${REVENUE_IMPACT}
- **SLA Breach**: ${SLA_STATUS}

## Root Cause
${ROOT_CAUSE_ANALYSIS}

## What Went Well
- ${POSITIVE_1}
- ${POSITIVE_2}

## What Could Be Improved
- ${IMPROVEMENT_1}
- ${IMPROVEMENT_2}

## Action Items
| Action | Owner | Due Date | Priority |
|--------|--------|----------|----------|
| ${ACTION1} | ${OWNER1} | ${DATE1} | High |

## Lessons Learned
${LESSONS_LEARNED}
```

---

## 📞 Emergency Contacts & Escalation

### Technical Escalation
```
L1: On-Call Engineer
    Slack: #lav-adaf-oncall
    PagerDuty: Primary rotation

L2: Senior Engineers  
    Slack: #lav-adaf-engineering
    Phone: ${PHONE_LIST}

L3: System Architects
    Slack: #lav-adaf-architecture
    Emergency: ${EMERGENCY_PHONE}
```

### Business Escalation
```
Risk Management
    Slack: #risk-alerts
    Phone: ${RISK_MANAGER_PHONE}

Compliance Officer
    Slack: #compliance-emergency  
    Phone: ${COMPLIANCE_PHONE}

Executive Team
    Slack: #executive-emergency
    Phone: ${EXEC_PHONE_LIST}
```

### External Vendors
```
Infrastructure (AWS/GCP)
    Support: ${CLOUD_SUPPORT_CASE}
    TAM: ${TAM_CONTACT}

Security (Vendors)
    Support: ${SECURITY_VENDOR_SUPPORT}
    Emergency: ${SECURITY_EMERGENCY}

Exchanges/Venues
    Support: ${EXCHANGE_SUPPORT_CONTACTS}
```

---

## 🛡️ Business Continuity Procedures

### Disaster Scenarios

#### **Complete System Failure**
1. **Immediate Actions** (0-15 min)
   - Activate manual trading procedures
   - Notify all counterparties
   - Engage backup systems

2. **Containment** (15-60 min)
   - Assess scope of failure
   - Implement workarounds
   - Communication to stakeholders

3. **Recovery** (1-4 hours)
   - Execute disaster recovery plan
   - Restore from backups
   - Validate system integrity

#### **Security Breach**
1. **Isolation** (0-5 min)
   - Disconnect affected systems
   - Preserve forensic evidence
   - Notify security team

2. **Assessment** (5-30 min)
   - Determine scope of breach
   - Identify compromised data
   - Assess ongoing threats

3. **Response** (30 min - ongoing)
   - Execute incident response plan
   - Notify authorities if required
   - Implement additional controls

### Manual Trading Procedures
```bash
# Emergency manual mode activation
./scripts/emergency-manual-mode.sh

# Key procedures:
1. Position monitoring via backup systems
2. Manual order placement through broker terminals  
3. Risk monitoring via Excel/manual calculations
4. Communication via phone/secure channels
```

**🎯 Recovery Time Objectives:**
- **RTO (Recovery Time)**: 4 hours maximum
- **RPO (Recovery Point)**: 15 minutes maximum data loss
- **MTTR (Mean Time to Repair)**: 2 hours target
- **Communication SLA**: 30 minutes to stakeholders