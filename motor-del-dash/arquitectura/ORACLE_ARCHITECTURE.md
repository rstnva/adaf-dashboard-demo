# Oracle Core — Arquitectura Técnica Fortune 500

> **Sistema:** Meta-Oráculo Multi-Fuente  
> **Standard:** Fortune 500 — Resiliencia, Seguridad, Observabilidad  
> **Fecha:** 2025-10-16  
> **Versión:** 1.0

---

## 📐 Visión General

El **Oracle Core** es un sistema de agregación de datos financieros que combina múltiples fuentes on-chain y off-chain para producir señales de alta confianza mediante consenso robusto, validación de calidad de datos y protecciones de seguridad.

### Principios de Diseño

1. **Multi-Source Resilience**: Nunca depender de una sola fuente
2. **Consensus-Driven**: Weighted median, trimmed mean, k-of-n quorum
3. **Quality First**: Guardrails automáticos, quarantine, dispute handling
4. **Security by Default**: RBAC, rate limiting, audit trail
5. **Observable**: Métricas Prometheus, Grafana dashboards, runbooks
6. **Developer-Friendly**: SDK client, WebSocket real-time, REST API

---

## 🏗️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Oracle UI    │  │ SDK Client   │  │ Webhooks     │      │
│  │ Command      │  │ TypeScript   │  │ Slack/Discord│      │
│  │ Center       │  │ JS/Python    │  │ Teams/Generic│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API & SERVE LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ REST API     │  │ WebSocket    │  │ Metrics      │      │
│  │ /oracle/v1/* │  │ Subscribe    │  │ Prometheus   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Pipeline     │  │ Consensus    │  │ DQ Guards    │      │
│  │ Orchestrator │  │ Engine       │  │ Quarantine   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RBAC & Auth  │  │ Rate Limiter │  │ Circuit      │      │
│  │              │  │              │  │ Breakers     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCE LAYER                        │
│  ┌───────┐ ┌───────┐ ┌─────────┐ ┌──────┐ ┌──────────┐    │
│  │Chain  │ │ Pyth  │ │RedStone │ │ Band │ │Chronicle │    │
│  │link   │ │Network│ │         │ │Tellor│ │   UMA    │    │
│  └───────┘ └───────┘ └─────────┘ └──────┘ └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ Redis        │  │ S3/Object    │      │
│  │ Signals      │  │ Cache        │  │ Store        │      │
│  │ Evidence     │  │ Pub/Sub      │  │ (Future)     │      │
│  │ Quarantine   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos Detallado

### 1. INGESTION PHASE

```
External Source (Chainlink, Pyth, etc.)
    │
    ▼
┌─────────────────────┐
│ Adapter             │
│ - Fetch data        │
│ - Normalize format  │
│ - Extract metadata  │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Raw Sample          │
│ {                   │
│   sourceId,         │
│   provider,         │
│   value,            │
│   confidence,       │
│   timestamp,        │
│   metadata          │
│ }                   │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Evidence Storage    │
│ (PostgreSQL)        │
│ - OracleEvidence    │
│ - Full payload      │
│ - Traceability      │
└─────────────────────┘
```

### 2. CONSENSUS PHASE

```
Raw Samples (Array)
    │
    ▼
┌─────────────────────┐
│ Quality Pre-Check   │
│ - Staleness (ttl)   │
│ - Confidence min    │
│ - Provider whitelist│
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Aggregators         │
│ ┌─────────────────┐ │
│ │ Weighted Median │ │
│ │ w_i = conf * fr │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Trimmed Mean    │ │
│ │ remove ±20%     │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ K-of-N Quorum   │ │
│ │ min sources = k │ │
│ └─────────────────┘ │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Consensus Value     │
│ + Confidence Score  │
│ + Quorum Status     │
└─────────────────────┘
```

### 3. DATA QUALITY PHASE

```
Consensus Signal
    │
    ▼
┌─────────────────────┐
│ DQ Guardrails       │
│ ┌─────────────────┐ │
│ │ Z-Score (±3σ)   │ │
│ │ Min/Max bounds  │ │
│ │ Relative delta  │ │
│ └─────────────────┘ │
└─────────────────────┘
    │
    ├─── PASS ──────────┐
    │                   │
    │                   ▼
    │           ┌─────────────────┐
    │           │ Valid Signal    │
    │           │ status: ok      │
    │           └─────────────────┘
    │
    └─── FAIL ──────────┐
                        │
                        ▼
                ┌─────────────────┐
                │ Quarantine      │
                │ - Rule ID       │
                │ - Z-Score       │
                │ - Metadata      │
                │ status: open    │
                └─────────────────┘
```

### 4. CIRCUIT BREAKER PHASE

```
Valid Signal
    │
    ▼
┌─────────────────────┐
│ Circuit Breakers    │
│ ┌─────────────────┐ │
│ │ Confidence min  │ │
│ │ Absolute max    │ │
│ │ Delta % vs prev │ │
│ └─────────────────┘ │
└─────────────────────┘
    │
    ├─── PASS ──────────┐
    │                   │
    │                   ▼
    │           ┌─────────────────┐
    │           │ Store Signal    │
    │           │ PostgreSQL      │
    │           │ + Redis Cache   │
    │           └─────────────────┘
    │
    └─── TRIP ──────────┐
                        │
                        ▼
                ┌─────────────────┐
                │ Quarantine      │
                │ reason:         │
                │ circuit_breaker │
                └─────────────────┘
```

### 5. STORAGE & SERVE

```
┌─────────────────────┐
│ PostgreSQL          │
│ ┌─────────────────┐ │
│ │ OracleSignal    │ │
│ │ - feedId, ts    │ │
│ │ - value, unit   │ │
│ │ - confidence    │ │
│ │ - quorumOk      │ │
│ │ - stale, status │ │
│ └─────────────────┘ │
└─────────────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────┐  ┌─────────────┐
│ Redis Cache │  │ Pub/Sub     │
│ key: feed:* │  │ channel:    │
│ TTL: ttl_ms │  │ oracle:feed │
└─────────────┘  └─────────────┘
         │              │
         └──────┬───────┘
                ▼
        ┌─────────────────┐
        │ API Layer       │
        │ - REST          │
        │ - WebSocket     │
        │ - SDK           │
        └─────────────────┘
                │
                ▼
        ┌─────────────────┐
        │ Consumers       │
        │ - UI Widgets    │
        │ - External Apps │
        │ - Analytics     │
        └─────────────────┘
```

---

## 🔐 Seguridad en Profundidad

### RBAC (Role-Based Access Control)

```typescript
interface TokenPayload {
  sub: string;           // User/App ID
  scopes: string[];      // oracle.reader, oracle.publisher, oracle.admin
  iat: number;           // Issued at
  exp: number;           // Expiry
}

// Middleware checks
function enforceScope(requiredScope: string) {
  const token = extractToken(req);
  const payload = verifyJWT(token);
  
  if (!payload.scopes.includes(requiredScope)) {
    throw new ForbiddenError(403);
  }
}

// Usage
app.post('/oracle/v1/publish', enforceScope('oracle.publisher'), publishHandler);
app.get('/oracle/v1/signals/:feedId', enforceScope('oracle.reader'), getSignalHandler);
```

### Rate Limiting (Token Bucket)

```typescript
class TokenBucket {
  private tokens: Map<string, { count: number; lastRefill: number }>;
  
  constructor(
    private maxTokens = 100,      // Max requests
    private refillRate = 60000     // Per minute
  ) {}
  
  consume(key: string): boolean {
    const bucket = this.getBucket(key);
    
    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillRate * this.maxTokens);
    
    bucket.count = Math.min(this.maxTokens, bucket.count + tokensToAdd);
    bucket.lastRefill = now;
    
    // Consume 1 token
    if (bucket.count > 0) {
      bucket.count--;
      return true;
    }
    
    return false; // Rate limit exceeded
  }
}

// Middleware
app.use((req, res, next) => {
  const key = req.ip;
  if (!rateLimiter.consume(key)) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  next();
});
```

### Audit Trail

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // publish, quarantine, circuit_breaker, rbac_deny
  feedId    String?
  userId    String?
  ip        String?
  metadata  Json?
  timestamp DateTime @default(now())
  
  @@index([feedId, timestamp])
  @@index([userId, timestamp])
  @@index([action, timestamp])
}
```

---

## 📊 Observabilidad & Monitoring

### Métricas Prometheus

```typescript
// Ingest metrics
export const ingestTotal = new Counter({
  name: 'oracle_ingest_total',
  help: 'Total signals ingested',
  labelNames: ['source']
});

export const ingestFailTotal = new Counter({
  name: 'oracle_ingest_fail_total',
  help: 'Failed ingestions',
  labelNames: ['source']
});

// Consensus metrics
export const consensusLatency = new Histogram({
  name: 'oracle_consensus_latency_seconds',
  help: 'Consensus computation time',
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Data quality metrics
export const dqFailureTotal = new Counter({
  name: 'oracle_dq_fail_total',
  help: 'Data quality failures',
  labelNames: ['feed', 'rule']
});

export const staleRatio = new Gauge({
  name: 'oracle_stale_ratio',
  help: 'Ratio of stale signals',
  labelNames: ['feed']
});

// Read metrics
export const readLatency = new Histogram({
  name: 'oracle_read_latency_seconds',
  help: 'Read operation latency',
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1]
});
```

### Grafana Dashboard Structure

```json
{
  "dashboard": {
    "title": "Oracle Core - Production Monitoring",
    "rows": [
      {
        "title": "Ingestion Health",
        "panels": [
          { "metric": "rate(oracle_ingest_total[5m])", "type": "graph" },
          { "metric": "rate(oracle_ingest_fail_total[5m])", "type": "graph" }
        ]
      },
      {
        "title": "Consensus Performance",
        "panels": [
          { "metric": "oracle_consensus_latency_seconds", "quantile": 0.95 },
          { "metric": "oracle_quorum_fail_total", "type": "singlestat" }
        ]
      },
      {
        "title": "Data Quality",
        "panels": [
          { "metric": "oracle_stale_ratio", "threshold": 0.05 },
          { "metric": "rate(oracle_dq_fail_total[1h])", "type": "table" }
        ]
      },
      {
        "title": "Read Performance",
        "panels": [
          { "metric": "oracle_read_latency_seconds", "quantiles": [0.5, 0.95, 0.99] },
          { "metric": "oracle_subscribers_gauge", "type": "graph" }
        ]
      }
    ],
    "templating": {
      "list": [
        { "name": "feed", "type": "query", "query": "label_values(oracle_signals_total, feed)" }
      ]
    }
  }
}
```

### Alerting Rules

```yaml
groups:
  - name: oracle_core_alerts
    interval: 1m
    rules:
      - alert: HighStaleRatio
        expr: oracle_stale_ratio > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Feed {{ $labels.feed }} has high stale ratio"
          
      - alert: QuorumFailures
        expr: rate(oracle_quorum_fail_total[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Quorum failures detected for feed {{ $labels.feed }}"
          
      - alert: HighReadLatency
        expr: histogram_quantile(0.95, oracle_read_latency_seconds) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 read latency exceeds 500ms"
          
      - alert: NoSignalsIngested
        expr: rate(oracle_ingest_total[10m]) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No signals ingested in last 10 minutes"
```

---

## 🚀 Deployment Strategy

### Modos de Operación

#### 1. Shadow Mode
```
Purpose: Validación sin impacto productivo
Duration: Mínimo 72h
Criteria:
  - Shadow RMSE < 5% vs baseline
  - Zero quorum failures
  - Latencia p95 < 100ms
  - No circuit breaker trips

Environment Variables:
  ORACLE_SOURCE_MODE=shadow
  ORACLE_ENABLE_ADAPTERS=chainlink,pyth,redstone
  ORACLE_BASELINE_PROVIDER=mock
```

#### 2. Mixed Mode
```
Purpose: Rollout progresivo con rollback
Phases:
  1. Canary 10% (24h monitoring)
  2. Canary 50% (48h monitoring)
  3. Full 100% (with rollback plan)

Criteria per Phase:
  - Shadow RMSE < 3%
  - Zero quorum failures
  - Latencia p95 < 50ms
  - Business approval

Environment Variables:
  ORACLE_SOURCE_MODE=mixed
  ORACLE_MIXED_RATIO=0.1  # Start with 10%
```

#### 3. Live Mode
```
Purpose: Full production
SLO:
  - Uptime: 99.9%
  - Latency p95: < 100ms
  - Latency p99: < 500ms
  - Stale ratio: < 5%

Environment Variables:
  ORACLE_SOURCE_MODE=live
  ORACLE_ENABLE_CIRCUIT_BREAKERS=true
  ORACLE_ENABLE_AUDIT_TRAIL=true
```

### Rollback Procedure

```bash
# 1. Detect issue (manual or automated alert)
# 2. Stop new ingestion
curl -X POST https://api.adaf.pro/oracle/v1/admin/pause

# 3. Revert to previous mode
export ORACLE_SOURCE_MODE=shadow
kubectl set env deployment/oracle-core ORACLE_SOURCE_MODE=shadow

# 4. Verify health
curl https://api.adaf.pro/api/healthz

# 5. Resume ingestion
curl -X POST https://api.adaf.pro/oracle/v1/admin/resume

# 6. Monitor Grafana for 30min
# 7. Document incident in runbook
```

---

## 🧪 Testing Strategy

### Unit Tests (55 tests)

```typescript
// Adapter tests (5)
describe('Chainlink Adapter', () => {
  it('should fetch latest round data');
  it('should handle network errors gracefully');
  it('should normalize price decimals correctly');
});

// Consensus tests (19)
describe('Weighted Median', () => {
  it('should compute weighted median with 5 samples');
  it('should handle zero confidence samples');
  it('should be deterministic with same inputs');
});

// Security tests (11)
describe('RBAC Middleware', () => {
  it('should enforce oracle.publisher scope');
  it('should reject expired tokens');
  it('should audit denied access');
});

// SDK tests (17)
describe('OracleClient', () => {
  it('should list feeds with filters');
  it('should get latest signal for feed');
  it('should subscribe to WebSocket updates');
});

// Webhook tests (12)
describe('Webhook Delivery', () => {
  it('should retry failed deliveries with backoff');
  it('should trip circuit breaker after 5 failures');
  it('should sign payloads with HMAC');
});
```

### Integration Tests

```typescript
describe('Oracle Pipeline E2E', () => {
  it('should ingest from 5 adapters → consensus → store', async () => {
    // 1. Seed feeds
    await seedFeeds([btcUsdFeed, ethUsdFeed]);
    
    // 2. Trigger ingestion
    const samples = await ingestAdapters(['chainlink', 'pyth', 'redstone']);
    
    // 3. Run consensus
    const signal = await processPipeline({ feed: btcUsdFeed, samples });
    
    // 4. Verify storage
    const stored = await getLatestSignal('btc-usd');
    expect(stored.value).toBeCloseTo(signal.value, 2);
    expect(stored.quorumOk).toBe(true);
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should handle 1000 concurrent reads < 100ms p95', async () => {
    const start = performance.now();
    await Promise.all(
      Array(1000).fill(null).map(() => getLatestSignal('btc-usd'))
    );
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

---

## 📦 Dependencias Clave

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "ioredis": "^5.4.1",
    "prom-client": "^15.1.3",
    "zod": "^3.22.2",
    "next": "15.5.4",
    "react": "19.1.1"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "typescript": "^5.9.2",
    "prisma": "^5.22.0",
    "tsx": "^4.19.1"
  }
}
```

---

## 🔗 API Reference

### REST Endpoints

```
GET    /api/oracle/v1/feeds
GET    /api/oracle/v1/feeds/:feedId
GET    /api/oracle/v1/signals/:feedId
GET    /api/oracle/v1/signals/:feedId/latest
POST   /api/oracle/v1/publish
GET    /api/oracle/v1/metrics
WS     /api/oracle/v1/subscribe/:feedId
```

### SDK Client

```typescript
import { OracleClient } from '@adaf/oracle-sdk';

const client = new OracleClient({
  baseUrl: 'https://api.adaf.pro',
  apiKey: process.env.ORACLE_API_KEY
});

// List feeds
const feeds = await client.listFeeds({ category: 'crypto' });

// Get latest signal
const signal = await client.getLatest('btc-usd');

// Subscribe to real-time updates
client.subscribe('btc-usd', (signal) => {
  console.log('New signal:', signal.value);
});

// Publish signal (requires oracle.publisher scope)
await client.publish({
  feedId: 'btc-usd',
  value: 45000.50,
  confidence: 0.95
});
```

---

## 📝 Changelog

### v1.0.0 (2025-10-16)
- ✅ Initial release
- ✅ 5 adapters implemented
- ✅ Consensus engine (3 strategies)
- ✅ RBAC + rate limiting
- ✅ Prometheus metrics + Grafana
- ✅ Oracle Command Center UI
- ✅ SDK client + WebSocket
- ✅ Webhook alerting system

---

**Última actualización:** 2025-10-16  
**Responsable:** Oracle Core Team  
**Standard:** Fortune 500 Excellence
