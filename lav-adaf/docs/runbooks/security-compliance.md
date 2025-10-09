# Security & Compliance Runbook - LAV/ADAF

## 🛡️ Security Framework Overview

### Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│ L1: Network Security     │ WAF, DDoS Protection, VPN        │
│ L2: Application Security │ Authentication, Authorization     │
│ L3: Data Security        │ Encryption, Tokenization         │
│ L4: Infrastructure Sec   │ Container Security, Secrets Mgmt │
│ L5: Monitoring & Alert   │ SIEM, Threat Detection, Audit    │
└─────────────────────────────────────────────────────────────┘
```

### Security Agents Integration

#### Security Aegis (Primary Security Agent)
- **Function**: Centralized security orchestration
- **Responsibilities**: 
  - MPC wallet management
  - Multi-signature coordination
  - Key rotation protocols
  - Threat response automation

#### Compliance Scribe (Regulatory Agent)
- **Function**: Automated compliance monitoring
- **Responsibilities**:
  - KYT (Know Your Transaction) screening
  - Sanctions list monitoring
  - Regulatory reporting
  - Audit trail maintenance

---

## 🔐 Authentication & Authorization

### Multi-Factor Authentication (MFA) Setup

#### Required for All Users
```bash
# Enable MFA for all accounts
./scripts/enable-mfa.sh --user=all --method=totp,hardware

# Verify MFA status
curl -s http://localhost:3001/api/auth/mfa-status
```

#### Service-to-Service Authentication
```bash
# JWT token management for internal services
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_EXPIRY=3600

# API key rotation (daily)
./scripts/rotate-api-keys.sh --force
```

#### Admin Access Controls
- **Emergency Access**: Break-glass procedures with audit logging
- **Privileged Operations**: Require dual authorization
- **Session Management**: Max 8-hour sessions, auto-logout on inactivity

### Role-Based Access Control (RBAC)

#### User Roles Matrix
| Role | Dashboard | API Access | Admin Functions | Trading Ops |
|------|-----------|-------------|----------------|-------------|
| Trader | Read/Write | Trading APIs | None | Execute Orders |
| Risk Manager | Full Access | Risk APIs | Risk Limits | View Only |
| Admin | Full Access | All APIs | User Management | All Operations |
| Auditor | Read Only | Audit APIs | None | View Logs |
| Emergency | Limited | Emergency APIs | System Halt | Emergency Only |

---

## 🔍 Transaction Monitoring & KYT

### Know Your Transaction (KYT) Implementation

#### Real-Time Screening
```bash
# Check transaction against watchlists
curl -X POST http://localhost:3004/api/kyt/screen \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_hash": "0x...",
    "from_address": "0x...",
    "to_address": "0x...",
    "amount": "1000000",
    "token": "USDC"
  }'
```

**Expected Response:**
```json
{
  "transaction_id": "tx_123456",
  "risk_score": 15,
  "risk_level": "LOW",
  "flags": [],
  "sanctions_hit": false,
  "pep_exposure": false,
  "aml_alerts": [],
  "recommendation": "APPROVE"
}
```

#### Sanctions Screening Process

**Daily Sanctions List Updates:**
```bash
# Automated daily update
0 6 * * * /opt/lav-adaf/scripts/update-sanctions.sh

# Manual force update
./scripts/update-sanctions.sh --force --source=OFAC,EU,UN
```

**Screening Workflow:**
1. **Pre-Transaction**: Screen counterparty addresses
2. **Real-Time**: Monitor transaction flow
3. **Post-Transaction**: Audit trail generation
4. **Alerting**: Immediate notification of hits

#### Suspicious Activity Monitoring

**Automated Red Flags:**
- Transactions >$10K to/from new addresses
- Rapid succession of large transactions (>5 in 10min)
- Interactions with known mixing services
- Unusual geographic patterns
- Off-hours large volume trading

```bash
# Check recent suspicious activities
curl -s http://localhost:3004/api/monitoring/suspicious-activities?hours=24
```

---

## 📋 Compliance Automation

### Regulatory Reporting

#### Daily Compliance Reports
```bash
# Generate daily compliance summary
./scripts/generate-compliance-report.sh $(date +%Y-%m-%d)
```

**Report Contents:**
- Transaction volume and count
- Large transaction reporting (>$10K)
- Geographic distribution analysis
- Sanctions screening summary
- AML alert resolution status

#### MiCA Compliance (EU)
- **Real-time reporting** for transactions >€1K
- **Daily position reporting** for all assets
- **Incident reporting** within 24 hours
- **Customer data protection** GDPR compliance

#### US Regulatory Framework
- **BSA/AML compliance** for US operations
- **CFTC reporting** for derivatives
- **SEC compliance** for securities
- **FinCEN reporting** for suspicious activities

### Audit Trail Management

#### Immutable Audit Logs
```bash
# Verify audit log integrity
./scripts/verify-audit-integrity.sh --start-date=2024-01-01

# Export audit logs for external auditor
./scripts/export-audit-logs.sh --format=CSV --date-range="2024-01-01,2024-01-31"
```

#### Log Retention Policy
- **Trading Logs**: 7 years retention
- **Compliance Logs**: 5 years retention
- **System Logs**: 3 years retention
- **Security Logs**: 10 years retention

---

## 🔒 Operational Security (OpSec)

### Key Management

#### Multi-Party Computation (MPC) Setup
```bash
# Initialize MPC wallet
./scripts/mpc-setup.sh --parties=3 --threshold=2

# Key ceremony execution
./scripts/key-ceremony.sh --participants="alice,bob,charlie"

# Verify key shares
./scripts/verify-mpc-shares.sh --all
```

#### Hardware Security Module (HSM) Integration
```bash
# HSM health check
./scripts/hsm-health.sh

# Key rotation procedure
./scripts/rotate-hsm-keys.sh --schedule=monthly
```

### Safe/Gnosis Integration

#### Multi-Signature Operations
```bash
# Create new Safe transaction
curl -X POST http://localhost:3005/api/safe/create-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "safe_address": "0x...",
    "to": "0x...",
    "value": "0",
    "data": "0x...",
    "operation": 0,
    "nonce": 123
  }'

# Check pending transactions requiring signatures
curl -s http://localhost:3005/api/safe/pending-transactions
```

#### Emergency Procedures

**Guardian Override Protocol:**
```bash
# Emergency transaction halt
./scripts/emergency-safe-pause.sh --safe-address=0x...

# Guardian key activation
./scripts/guardian-override.sh --reason="SECURITY_BREACH"
```

---

## 🚨 Security Incident Response

### Threat Detection & Response

#### Automated Threat Detection
```bash
# Real-time threat monitoring
curl -s http://localhost:3006/api/threats/active

# Security score assessment
curl -s http://localhost:3006/api/security/score
```

#### Common Security Incidents

**1. Unauthorized API Access**
```bash
# Immediate response
./scripts/revoke-api-access.sh --user=SUSPICIOUS_USER
./scripts/force-logout-all.sh

# Investigation
./scripts/analyze-access-logs.sh --timeframe="last-24h"
```

**2. Abnormal Transaction Patterns**
```bash
# Transaction pattern analysis
./scripts/analyze-tx-patterns.sh --alert-id=ALERT_123

# Temporary transaction limits
curl -X POST http://localhost:3002/api/limits/emergency \
  -d '{"max_tx_amount": 1000, "daily_limit": 10000}'
```

**3. Smart Contract Exploitation**
```bash
# Contract pause (if available)
./scripts/pause-contracts.sh --emergency

# Position assessment
curl -s http://localhost:3001/api/positions/at-risk
```

### Incident Classification & Response Times

| Severity | Examples | Response Time | Actions |
|----------|----------|---------------|---------|
| **Critical** | Active breach, funds at risk | 15 minutes | Full incident response, executive notification |
| **High** | Suspicious activity, potential breach | 1 hour | Security team activation, monitoring enhancement |
| **Medium** | Policy violations, minor anomalies | 4 hours | Investigation, documentation |
| **Low** | Information gathering, routine alerts | 24 hours | Log review, trend analysis |

---

## 📊 Security Monitoring & Alerting

### Security Information and Event Management (SIEM)

#### Real-Time Monitoring Dashboard
```bash
# Access security dashboard
http://localhost:3000/security/dashboard

# Key metrics monitored:
# - Failed login attempts
# - API rate limiting hits  
# - Unusual transaction patterns
# - Geographic anomalies
# - Time-based access violations
```

#### Alert Configuration
```yaml
# High-priority alerts
alerts:
  - name: "Multiple Failed Logins"
    condition: "failed_logins > 5 in 5min"
    action: "lock_account_and_notify"
    
  - name: "Large Transaction Alert"  
    condition: "transaction_amount > 100000 USD"
    action: "require_additional_approval"
    
  - name: "Off-Hours Trading"
    condition: "trading_activity between 22:00-06:00 UTC"
    action: "enhanced_monitoring"
```

### Threat Intelligence Integration

#### External Threat Feeds
```bash
# Update threat intelligence feeds
./scripts/update-threat-feeds.sh --sources=all

# Check address against threat databases
curl -X POST http://localhost:3006/api/threat-intel/check \
  -d '{"address": "0x...", "check_type": "all"}'
```

---

## 🔄 Security Maintenance & Updates

### Regular Security Tasks

#### Daily (Automated)
- [ ] Threat intelligence feed updates
- [ ] Failed login attempt analysis
- [ ] Transaction pattern monitoring
- [ ] API rate limit review
- [ ] Security log analysis

#### Weekly (Semi-Automated)
- [ ] Access review and cleanup
- [ ] Security patch assessment
- [ ] Firewall rule optimization
- [ ] Certificate expiration check
- [ ] Backup integrity verification

#### Monthly (Manual)
- [ ] Penetration testing
- [ ] Security configuration audit
- [ ] Access permission review
- [ ] Incident response drill
- [ ] Security training updates

### Security Testing

#### Automated Security Scans
```bash
# Daily vulnerability scanning
./scripts/security-scan.sh --type=full --output=report

# Container security assessment
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image lav-adaf/gateway:latest
```

#### Penetration Testing Schedule
- **Monthly**: Internal automated testing
- **Quarterly**: External security assessment  
- **Annually**: Comprehensive security audit

---

## 📚 Compliance Documentation

### Required Documentation

#### Security Policies
- [ ] Information Security Policy
- [ ] Access Control Policy
- [ ] Incident Response Plan
- [ ] Data Classification Policy
- [ ] Backup and Recovery Procedures

#### Compliance Procedures
- [ ] AML/KYT Procedures
- [ ] Sanctions Screening Procedures
- [ ] Transaction Monitoring Procedures
- [ ] Regulatory Reporting Procedures
- [ ] Data Retention Policy

### Audit Preparation

#### Internal Audit Checklist
```bash
# Compliance status check
./scripts/compliance-status.sh --full-report

# Generate audit package
./scripts/prepare-audit-package.sh --type=security --period=quarterly
```

#### External Audit Support
- Documentation package preparation
- System access for auditors
- Evidence collection and presentation
- Finding remediation tracking

---

## 🎯 Security KPIs & Metrics

### Key Performance Indicators

#### Security Metrics (Daily)
- **Security Incidents**: Target 0 per day
- **False Positive Rate**: <5% for alerts
- **Response Time**: P0 incidents <15min
- **Patch Deployment**: <24hrs for critical
- **Access Review**: 100% monthly completion

#### Compliance Metrics (Weekly)  
- **KYT Coverage**: 100% transactions screened
- **Sanctions Hits**: 0 unresolved flags
- **Report Timeliness**: 100% on-time filing
- **Audit Findings**: <3 medium+ findings per audit
- **Training Completion**: 100% staff current

### Security Dashboard Metrics
```bash
# Key security metrics API
curl -s http://localhost:3006/api/metrics/security | jq '{
  incidents_today: .incidents.today,
  false_positive_rate: .alerts.false_positive_rate,
  compliance_score: .compliance.overall_score,
  system_security_score: .security.overall_score
}'
```

---

## 🚀 Emergency Security Procedures

### Security Lockdown Protocol

#### Immediate Actions (0-5 minutes)
```bash
# 1. Halt all trading operations
curl -X POST http://localhost:3003/api/emergency/halt-all

# 2. Revoke all API sessions
./scripts/revoke-all-sessions.sh

# 3. Enable enhanced monitoring
./scripts/enable-lockdown-mode.sh

# 4. Notify security team
./scripts/security-alert.sh --severity=CRITICAL --type=LOCKDOWN
```

#### Assessment Actions (5-30 minutes)
```bash
# Assess system compromise
./scripts/compromise-assessment.sh --full-scan

# Backup current state for forensics
./scripts/forensic-backup.sh --timestamp=$(date +%s)

# Isolate affected systems
./scripts/network-isolation.sh --systems=AFFECTED_LIST
```

### Recovery Procedures

#### System Restoration (Post-Incident)
1. **Security Clearance**: Full system security audit
2. **Gradual Restart**: Phase-by-phase service restoration
3. **Enhanced Monitoring**: 48-hour elevated monitoring
4. **Stakeholder Communication**: Status updates every 2 hours

#### Lessons Learned Integration
- Update security policies based on incident
- Enhance detection rules for similar threats
- Conduct team training on new procedures
- Improve incident response procedures

**🎯 Security Objectives:**
- **Zero Tolerance**: No successful security breaches
- **Rapid Response**: <15min incident response time
- **Full Coverage**: 100% transaction monitoring
- **Continuous Improvement**: Monthly security enhancements
- **Regulatory Excellence**: Zero compliance violations