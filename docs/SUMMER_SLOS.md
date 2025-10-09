# Summer.fi Integration SLOs

## Service Level Objectives

### 🎯 Availability SLO
- **Target:** 99.9% availability over 30-day window
- **Measurement:** Successful API responses (non-5xx) / Total API requests
- **Alert Threshold:** < 99.5% over 24-hour window

### ⚡ Latency SLO  
- **Target:** p95 API response time ≤ 450ms
- **Measurement:** `/api/integrations/summer/*` endpoints  
- **Alert Threshold:** > 450ms for 5+ minutes

### 🚨 Error Rate SLO
- **Target:** < 1% server error rate (5xx)
- **Measurement:** 5xx responses / Total responses over 5-minute window
- **Alert Threshold:** > 1% for 3+ minutes

### 🔐 RBAC Accuracy SLO
- **Target:** > 99.5% correct permission enforcement
- **Measurement:** False denials / Total permission checks
- **Alert Threshold:** > 0.5% false denials over 24 hours

### 🧩 Widget Load Success SLO
- **Target:** > 99% successful widget renders
- **Measurement:** Widget mount successes / Widget mount attempts
- **Alert Threshold:** < 95% success rate over 5 minutes

## Error Budgets

| SLO | Monthly Budget | Weekly Budget | Daily Budget |
|-----|----------------|---------------|--------------|
| Availability | 43.2 minutes | 10.1 minutes | 1.44 minutes |
| Error Rate | 1% of requests | 1% of requests | 1% of requests |
| RBAC Accuracy | 0.5% false denials | 0.5% false denials | 0.5% false denials |