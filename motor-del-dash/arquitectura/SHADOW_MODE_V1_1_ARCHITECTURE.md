# Arquitectura: Shadow Mode v1.1 - Oracle Core + VOX POPULI

**Versión:** 1.1.0  
**Fecha:** 20 de octubre, 2025  
**Estado:** Production Ready (pending 72h validation)

---

## 🎯 RESUMEN EJECUTIVO

Sistema Oracle descentralizado con capacidad de análisis de sentimiento social (VOX POPULI), implementado en Shadow Mode para validación pre-producción con 0 downtime.

**Componentes principales:**
1. **Oracle Core v1.0:** Consensus multi-fuente (5 protocolos)
2. **VOX POPULI v1.1:** Motor V³ de sentiment analysis (5 plataformas)
3. **Shadow Infrastructure:** Validación paralela con KPI tracking

---

## 🏗️ ARQUITECTURA DE ALTO NIVEL

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADAF Dashboard Pro                        │
│                      (Next.js 15 + React 19)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
    ┌──────▼──────┐                 ┌─────▼─────┐
    │ LIVE Mode   │                 │  SHADOW   │
    │ Port 3000   │                 │ Port 3005 │
    └──────┬──────┘                 └─────┬─────┘
           │                               │
           │         ┌────────────────────┐│
           └─────────► KPI Collector     ││
                     │ (Comparison)      ││
                     └─────────┬─────────┘│
                               │          │
                     ┌─────────▼──────────▼─┐
                     │   PostgreSQL DB      │
                     │   (shadow_metrics)   │
                     └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Oracle Core v1.0                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Registry │    │Consensus │    │ Ingest   │    │    DQ    │  │
│  │  System  │───►│  Engine  │◄───│ Adapters │◄───│Guardrails│  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │                │                         │
│       │               │                └──────┐                  │
│       │               └────────────┐          │                  │
│       │                            │          │                  │
│  ┌────▼────────────────────────────▼──────────▼──────────────┐  │
│  │              API v1 (/api/oracle/v1/*)                     │  │
│  │  ┌──────┐  ┌───────────┐  ┌────────┐  ┌────────────────┐ │  │
│  │  │Feeds │  │By-ID      │  │Latest  │  │Metrics         │ │  │
│  │  └──────┘  └───────────┘  └────────┘  │(Prometheus)    │ │  │
│  │                                        └────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    SDK Client (TypeScript)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │  │
│  │  │listFeeds │  │getFeed   │  │getLatest │  │subscribe  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      VOX POPULI v1.1                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           Social Data Ingestion (5 platforms)              │  │
│  │  ┌──────┐  ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────┐│  │
│  │  │  X   │  │Reddit  │  │Telegram  │  │Discord │  │ News ││  │
│  │  └───┬──┘  └────┬───┘  └─────┬────┘  └────┬───┘  └───┬──┘│  │
│  │      │          │             │            │          │   │  │
│  │      └──────────┴──────┬──────┴────────────┴──────────┘   │  │
│  │                        │                                   │  │
│  │              ┌─────────▼────────────┐                      │  │
│  │              │   Data Providers     │                      │  │
│  │              │ ┌──────────────────┐ │                      │  │
│  │              │ │  LunarCrush API  │ │                      │  │
│  │              │ │  Santiment API   │ │                      │  │
│  │              │ │  TheTie API      │ │                      │  │
│  │              │ └──────────────────┘ │                      │  │
│  │              └──────────────────────┘                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              V³ Scoring Engine                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ Sentiment   │  │  Volume     │  │  Volatility     │   │  │
│  │  │  (50%)      │  │  (30%)      │  │   (20%)         │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────────┘   │  │
│  │         │                │                 │              │  │
│  │         └────────────────┴─────────────────┘              │  │
│  │                          │                                │  │
│  │                ┌─────────▼──────────┐                     │  │
│  │                │   V³ Score         │                     │  │
│  │                │   [-1.0, 1.0]      │                     │  │
│  │                └────────────────────┘                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Anti-Manipulation Layer                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │Botguard  │  │Entity    │  │DQ        │  │Budget    │  │  │
│  │  │(brigading)│  │Resolver  │  │Quarantine│  │Guard     │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  UI War Room (6 panels)                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │Brigading     │  │Hype vs Price │  │Influencers      │ │  │
│  │  │Heatmap       │  │Correlation   │  │Leaderboard      │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │Narratives    │  │Top Movers    │  │KPI Strip        │ │  │
│  │  │Treemap       │  │(24h changes) │  │(summary)        │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Data Flow Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  External Sources                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │Chainlink │  │Pyth      │  │RedStone  │  │Band      │ ...     │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘         │
│        │             │              │             │              │
│        └─────────────┴──────────────┴─────────────┘              │
│                          │                                        │
│             ┌────────────▼────────────┐                           │
│             │   Ingest Adapters       │                           │
│             │  (5 protocols)          │                           │
│             └────────────┬────────────┘                           │
│                          │                                        │
│             ┌────────────▼────────────┐                           │
│             │   Registry System       │                           │
│             │  (30 feeds cataloged)   │                           │
│             └────────────┬────────────┘                           │
│                          │                                        │
│             ┌────────────▼────────────┐                           │
│             │   Consensus Engine      │                           │
│             │  (quorum validation)    │                           │
│             └────────────┬────────────┘                           │
│                          │                                        │
│         ┌────────────────┼────────────────┐                       │
│         │                │                │                       │
│    ┌────▼────┐    ┌─────▼─────┐    ┌────▼────┐                  │
│    │PostgreSQL│    │   Redis   │    │  API    │                  │
│    │(persist) │    │  (cache)  │    │ (serve) │                  │
│    └─────────┘    └───────────┘    └─────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📦 COMPONENTES DETALLADOS

### 1. Registry System

**Responsabilidad:** Catálogo centralizado de feeds y fuentes

**Estructura de datos:**
```typescript
interface Feed {
  id: string;              // "vox/sentiment/btc"
  name: string;            // "Bitcoin Sentiment Score"
  category: FeedCategory;  // "vox" | "onchain" | "wsp"
  unit: string;            // "score" | "usd" | "percentage"
  ttl_ms: number;          // 300000 (5min)
  quorum: number;          // 3 (min sources)
  sources: string[];       // ["lunarcrush", "santiment"]
  tags: string[];          // ["social", "btc"]
  version: number;         // 1
}
```

**Archivos:**
- `feeds.vox.json`: 12 VOX feeds
- `feeds.onchain.shadow.json`: 8 shadow feeds
- `sources.registry.json`: 24 sources
- `schema.ts`: Zod validation schemas

**APIs:**
- `readRegistryJson(type)`: Lee feeds/sources
- `validateFeed(feed)`: Valida contra schema
- `getFeedById(id)`: Busca feed específico

---

### 2. Consensus Engine

**Responsabilidad:** Agregar datos de múltiples fuentes

**Algoritmos de agregación:**

1. **Mean (Promedio simple)**
```typescript
function mean(values: number[]): number {
  return values.reduce((a, b) => a + b) / values.length;
}
```

2. **Weighted (Ponderado por confianza)**
```typescript
function weighted(readings: Reading[]): number {
  const totalWeight = readings.reduce((sum, r) => sum + r.confidence, 0);
  return readings.reduce((sum, r) => 
    sum + (r.value * r.confidence / totalWeight), 0
  );
}
```

3. **Median (Resistente a outliers)**
```typescript
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}
```

**Validación de Quorum:**
```typescript
function validateQuorum(
  readings: Reading[], 
  requiredQuorum: number
): boolean {
  const validReadings = readings.filter(r => 
    r.quality > 0.5 && 
    Date.now() - r.timestamp < ttl_ms
  );
  return validReadings.length >= requiredQuorum;
}
```

---

### 3. Ingest Adapters

**Responsabilidad:** Conectores a protocolos Oracle

**Interface común:**
```typescript
interface OracleAdapter {
  name: string;
  protocol: 'chainlink' | 'pyth' | 'redstone' | 'band' | 'chronicle';
  
  fetchPrice(asset: string): Promise<OracleReading>;
  fetchBatch(assets: string[]): Promise<OracleReading[]>;
  getHealth(): Promise<HealthStatus>;
}

interface OracleReading {
  value: number;
  timestamp: number;
  source: string;
  confidence?: number;
  deviation?: number;
}
```

**Implementaciones:**
- `chainlink.adapter.ts`: Chainlink Price Feeds
- `pyth.adapter.ts`: Pyth Network
- `redstone.adapter.ts`: RedStone Finance
- `band-tellor.adapter.ts`: Band Protocol + Tellor
- `chronicle-uma.adapter.ts`: Chronicle + UMA

**Normalización:**
```typescript
function normalizeReading(
  raw: RawReading, 
  decimals: number
): OracleReading {
  return {
    value: raw.price / 10 ** decimals,
    timestamp: raw.timestamp * 1000,
    source: raw.source,
    confidence: calculateConfidence(raw),
    deviation: calculateDeviation(raw)
  };
}
```

---

### 4. DQ & Guardrails

**Responsabilidad:** Data Quality checks y circuit breakers

**Reglas implementadas:**

1. **Staleness Check**
```typescript
function isstale(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp > ttl;
}
```

2. **Outlier Detection**
```typescript
function isOutlier(
  value: number, 
  historical: number[]
): boolean {
  const mean = historical.reduce((a, b) => a + b) / historical.length;
  const std = calculateStdDev(historical);
  return Math.abs(value - mean) > 3 * std;
}
```

3. **Brigading Detection**
```typescript
function detectBrigading(
  signals: Signal[], 
  window: number
): boolean {
  const recent = signals.filter(s => 
    Date.now() - s.timestamp < window
  );
  const similarity = calculateSimilarity(recent);
  return similarity > BRIGADING_THRESHOLD; // 0.8
}
```

4. **Source Diversity**
```typescript
function validateSourceDiversity(
  readings: Reading[], 
  minSources: number
): boolean {
  const uniqueSources = new Set(readings.map(r => r.source));
  return uniqueSources.size >= minSources;
}
```

---

### 5. VOX POPULI - V³ Scoring Engine

**Responsabilidad:** Composite sentiment score

**Fórmula V³:**
```typescript
function calculateV3Score(data: VoxData): number {
  // Normalizar componentes a [0, 1]
  const s = normalizeSentiment(data.sentiment);      // [-1, 1] → [0, 1]
  const v = normalizeVolume(data.volume);            // [0, inf] → [0, 1]
  const vol = normalizeVolatility(data.volatility);  // [0, inf] → [0, 1]
  
  // Ponderación
  return (s * 0.5) + (v * 0.3) + (vol * 0.2);
}
```

**Normalización:**
```typescript
function normalizeSentiment(s: number): number {
  // [-1, 1] → [0, 1]
  return (s + 1) / 2;
}

function normalizeVolume(v: number): number {
  // [0, inf] → [0, 1] usando log scaling
  return Math.log(1 + v) / Math.log(1 + MAX_VOLUME);
}

function normalizeVolatility(vol: number): number {
  // [0, inf] → [0, 1] usando sigmoid
  return 1 / (1 + Math.exp(-vol));
}
```

**NLP Pipeline:**
```
Text Input
    ↓
Tokenization (remove stopwords, punctuation)
    ↓
Sentiment Analysis (VADER + custom lexicon)
    ↓
Entity Recognition (crypto tickers, projects)
    ↓
Topic Clustering (LDA)
    ↓
V³ Score Output
```

---

### 6. Botguard (Anti-Manipulation)

**Responsabilidad:** Detectar actividad coordinada

**Técnicas:**

1. **Coordinated Activity Detection**
```typescript
function detectCoordinated(posts: Post[]): boolean {
  const window = 5 * 60 * 1000; // 5 minutes
  const recentPosts = posts.filter(p => 
    Date.now() - p.timestamp < window
  );
  
  const similarities = calculatePairwiseSimilarity(recentPosts);
  return similarities.some(s => s > 0.8); // 80% similar
}
```

2. **Velocity Anomaly**
```typescript
function detectVelocityAnomaly(
  current: number, 
  historical: number[]
): boolean {
  const mean = historical.reduce((a, b) => a + b) / historical.length;
  const std = calculateStdDev(historical);
  return Math.abs(current - mean) > 5 * std; // 5 sigma
}
```

3. **Account Quality**
```typescript
function calculateAccountQuality(account: Account): number {
  let score = 1.0;
  
  // Age penalty
  if (account.age_days < 30) {
    score *= 0.5;
  }
  
  // Follower penalty
  if (account.followers < 100) {
    score *= 0.7;
  }
  
  // Engagement ratio
  const ratio = account.likes / (account.followers + 1);
  if (ratio > 0.1 || ratio < 0.001) { // Anomalous
    score *= 0.6;
  }
  
  return score;
}
```

---

### 7. Shadow Mode Infrastructure

**Responsabilidad:** Validación paralela sin downtime

**Arquitectura:**
```
┌─────────────┐         ┌─────────────┐
│  LIVE Mode  │         │  SHADOW     │
│  Port 3000  │         │ Port 3005   │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │   ┌───────────────────┤
       │   │                   │
       └───►  KPI Collector    │
           │  (every 5min)     │
           └────────┬──────────┘
                    │
           ┌────────▼──────────┐
           │   PostgreSQL      │
           │  shadow_metrics   │
           └───────────────────┘
```

**Métricas capturadas:**
```typescript
interface ShadowMetric {
  shadow_rmse: number;              // Root Mean Square Error
  live_reads_total: number;         // Live API calls
  shadow_reads_total: number;       // Shadow API calls
  divergence_percentage: number;    // % difference
  feeds_compared: number;           // Feeds monitored
  timestamp: Date;
}
```

**KPI Collector (pseudocódigo):**
```typescript
async function collectKPIs() {
  const liveData = await fetchLive('/api/oracle/v1/feeds');
  const shadowData = await fetchShadow('/api/oracle/v1/feeds');
  
  const rmse = calculateRMSE(liveData, shadowData);
  const divergence = calculateDivergence(liveData, shadowData);
  
  await db.shadow_metrics.create({
    shadow_rmse: rmse,
    live_reads_total: liveData.length,
    shadow_reads_total: shadowData.length,
    divergence_percentage: divergence,
    feeds_compared: liveData.length,
    timestamp: new Date()
  });
  
  if (divergence > MAX_DIVERGENCE) {
    await alertSlack('High divergence detected');
  }
}

// Run every 5 minutes
setInterval(collectKPIs, 5 * 60 * 1000);
```

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN

### Zero Trust Architecture

**Principios:**
1. Never trust, always verify
2. Least privilege access
3. Assume breach mentality

**Implementación:**

```typescript
// API Key Validation
async function validateApiKey(req: Request): Promise<boolean> {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return false;
  
  const key = await db.api_keys.findUnique({
    where: { key: apiKey, revoked: false }
  });
  
  return key !== null && key.expires_at > new Date();
}

// Rate Limiting
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 100,        // 100 requests
  keyGenerator: (req) => req.headers.get('x-api-key')
});

// RBAC (Role-Based Access Control)
enum Role {
  ADMIN = 'admin',
  VIEWER = 'viewer',
  API_CONSUMER = 'api_consumer'
}

const permissions = {
  [Role.ADMIN]: ['read', 'write', 'delete', 'manage_keys'],
  [Role.VIEWER]: ['read'],
  [Role.API_CONSUMER]: ['read_api']
};
```

### Audit Trails

**Todas las acciones loggeadas:**
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id: string;
  action: string;           // "oracle.feed.read"
  resource: string;         // "vox/sentiment/btc"
  ip_address: string;
  user_agent: string;
  trace_id: string;         // For distributed tracing
  metadata: Record<string, any>;
}
```

---

## 📊 OBSERVABILIDAD

### Métricas Prometheus

**Oracle Core:**
```prometheus
# Counter: Total reads per feed
oracle_reads_total{feed_id="vox/sentiment/btc", source="lunarcrush", status="success"}

# Gauge: Active feeds
oracle_feeds_active 30

# Gauge: Healthy sources
oracle_sources_healthy{source="chainlink"} 1

# Histogram: Read duration
oracle_read_duration_seconds{feed_id="vox/sentiment/btc"} bucket{le="0.1"} 95

# Summary: Divergence
oracle_divergence_percentage{feed_id="vox/sentiment/btc"} 0.023
```

**VOX POPULI:**
```prometheus
# Counter: Signals processed
vox_signals_processed_total{asset="btc", source="twitter"} 1547

# Counter: Quarantines
vox_quarantines_total{reason="VOX_BRIGADING"} 12

# Gauge: Sentiment score
vox_sentiment_score{asset="btc"} 0.67

# Histogram: Processing duration
vox_processing_duration_seconds{stage="scoring"} bucket{le="0.5"} 98
```

**Shadow Mode:**
```prometheus
# Gauge: RMSE
shadow_rmse 0.023

# Gauge: Divergence
shadow_divergence_percentage 2.3

# Counter: Reads
shadow_reads_total 1532
live_reads_total 1547
```

### Logging Structure

```json
{
  "timestamp": "2025-10-20T18:30:00.000Z",
  "level": "info",
  "module": "oracle-core",
  "action": "consensus_reached",
  "feed_id": "vox/sentiment/btc",
  "quorum": 3,
  "sources": ["lunarcrush", "santiment", "thetie"],
  "value": 0.67,
  "confidence": 0.85,
  "duration_ms": 234,
  "trace_id": "abc123def456",
  "user_id": "system",
  "metadata": {
    "aggregation_method": "weighted",
    "outliers_removed": 1
  }
}
```

### Grafana Dashboards

**Oracle Freshness Demo:**
- Shadow RMSE (time series)
- Live vs Shadow Reads (counter)
- Divergence % (gauge)
- Feeds Compared (stat)
- VOX Sentiment by Asset (heatmap)
- Quarantine Events (logs panel)

---

## 🚀 DEPLOYMENT

### Docker Compose

**Servicios:**
```yaml
services:
  adaf-main:
    image: adaf-dashboard:latest
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - SHADOW_MODE=false
  
  adaf-shadow:
    profiles: [shadow]
    image: adaf-dashboard:shadow-v1.0
    ports: ["3005:3000"]
    environment:
      - NODE_ENV=production
      - SHADOW_MODE=true
      - ORACLE_LIVE_ENDPOINT=http://adaf-main:3000
  
  kpi-collector:
    profiles: [shadow]
    image: node:18-alpine
    command: node /app/scripts/shadow/kpi-collector.mjs
    environment:
      - LIVE_URL=http://adaf-main:3000
      - SHADOW_URL=http://adaf-shadow:3000
      - DB_URL=${DATABASE_URL}
```

**Comandos:**
```bash
# Start LIVE only
docker compose up -d

# Start LIVE + SHADOW
docker compose --profile shadow up -d

# Health check
bash scripts/shadow/health-check.sh

# View KPI metrics
docker compose exec kpi-collector cat /tmp/latest-metrics.json
```

---

## 📈 ESCALABILIDAD

### Horizontal Scaling

**Load Balancer:**
```
       ┌────────────┐
       │  Nginx LB  │
       └─────┬──────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼───┐        ┌───▼───┐
│ Node1 │        │ Node2 │
└───┬───┘        └───┬───┘
    │                 │
    └────────┬────────┘
             │
      ┌──────▼──────┐
      │  PostgreSQL │
      │  (Primary)  │
      └──────┬──────┘
             │
      ┌──────▼──────┐
      │  PostgreSQL │
      │  (Replica)  │
      └─────────────┘
```

### Caching Strategy

**Redis Layers:**
```typescript
// L1: In-memory cache (Node.js)
const memoryCache = new Map<string, CacheEntry>();

// L2: Redis cache (shared)
const redisClient = createClient({ url: REDIS_URL });

async function getCachedFeed(feedId: string): Promise<Feed | null> {
  // Check L1
  if (memoryCache.has(feedId)) {
    return memoryCache.get(feedId).value;
  }
  
  // Check L2
  const cached = await redisClient.get(`feed:${feedId}`);
  if (cached) {
    const feed = JSON.parse(cached);
    memoryCache.set(feedId, { value: feed, expires: Date.now() + TTL });
    return feed;
  }
  
  // Fetch from source
  const feed = await fetchFeedFromSource(feedId);
  await redisClient.setEx(`feed:${feedId}`, TTL / 1000, JSON.stringify(feed));
  memoryCache.set(feedId, { value: feed, expires: Date.now() + TTL });
  
  return feed;
}
```

---

## 🔄 FLUJOS DE DATOS

### Oracle Feed Update Flow

```
1. Scheduler triggers feed update (every 5min)
   │
2. Check cache (Redis)
   │
   ├─ Cache HIT → Return cached value
   │
   └─ Cache MISS
      │
   3. Fetch from all sources in parallel
      │
      ├─ Chainlink
      ├─ Pyth
      ├─ RedStone
      ├─ Band
      └─ Chronicle
      │
   4. Validate quorum (min 3 sources)
      │
      ├─ FAIL → Quarantine + Alert
      │
      └─ SUCCESS
         │
   5. Run DQ checks
      │
      ├─ Staleness check
      ├─ Outlier detection
      ├─ Source diversity
      └─ Brigading check
      │
   6. Consensus aggregation (weighted mean)
      │
   7. Store in DB + Cache
      │
   8. Emit event (WebSocket)
      │
   9. Update Prometheus metrics
```

### VOX Signal Processing Flow

```
1. Social platform webhook received
   │
2. Botguard validation
   │
   ├─ Bot detected → Quarantine
   │
   └─ PASS
      │
   3. Entity resolution
      │
      └─ "Bitcoin" → "BTC"
      │
   4. NLP processing
      │
      ├─ Tokenization
      ├─ Sentiment analysis
      └─ Topic extraction
      │
   5. Budget guard check
      │
      ├─ Budget exceeded → Use cached data
      │
      └─ PASS
         │
   6. V³ score calculation
      │
      └─ sentiment(50%) + volume(30%) + volatility(20%)
      │
   7. DQ quarantine check
      │
      ├─ In quarantine → Drop signal
      │
      └─ PASS
         │
   8. Store in DB
      │
   9. Check alert triggers
      │
      ├─ Sentiment flip
      ├─ Volume spike
      └─ Brigading detected
      │
  10. Update UI (WebSocket)
```

---

**Fin de Arquitectura**  
*Versión: 1.1.0*  
*Actualizado: 20 de octubre, 2025*
