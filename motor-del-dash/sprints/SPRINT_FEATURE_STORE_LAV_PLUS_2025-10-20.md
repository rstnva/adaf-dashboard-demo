# SPRINT: Feature Store + Semáforo LAV PLUS v1.0

**Fecha Inicio**: 2025-10-20  
**Duración Estimada**: 3 fases (3-5 días)  
**Prioridad**: 🔴 ALTA — Sistema crítico para inteligencia financiera  
**Estado**: 🟡 EN PLANIFICACIÓN

---

## 📋 CONTEXTO EJECUTIVO

### Objetivo

Construir **Feature Store** (SSOT de features tiempo-real e históricas) y **Semáforo LAV PLUS** (régimen de liquidez) manteniendo `mock-lock` y alineado con arquitectura Fortune 500.

### Principios Operativos

- ✅ `EXECUTION_MODE="dry-run"` — Sin trading real
- ✅ `ORACLE_SOURCE_MODE="mock|shadow"` — No mixed/live
- ✅ Dashboard 100% vía SDK — Sin accesos directos a DB
- ✅ Cobertura de tests ≥75% statements / ≥70% branches
- ✅ Observabilidad completa con Prometheus + Grafana

### Stack Técnico

- Next.js 15 + TypeScript + Tailwind
- PostgreSQL (features_catalog, features_values con partición diaria)
- Redis (cache layer)
- Parquet + S3 (export histórico)
- Prometheus + Grafana (observabilidad)

---

## 🎯 ARQUITECTURA DEL SISTEMA

### Feature Store

```
services/feature-store/
├── registry/         # Catálogo de features + fuentes
│   ├── catalog.ts
│   ├── contracts.ts
│   ├── features.catalog.json    # ≥20 features seed
│   └── datasources.json         # Metadata (sin secretos)
├── schema/          # Contratos de datos
│   ├── types.ts                 # TS interfaces
│   └── zod.ts                   # Validaciones Zod
├── ingest/          # Capa de ingesta
│   ├── adapters/                # Conectores a fuentes
│   ├── loaders.ts               # load(spec, since?)
│   ├── backfill.ts              # Histórico determinista
│   └── replay.ts                # Time-warp debugging
├── transform/       # Normalización y transformación
│   ├── normalize.ts             # Unidades/timezone
│   ├── joins.ts                 # Cross-feature joins
│   └── seasonal.ts              # Patterns estacionales
├── storage/         # Persistencia multi-capa
│   ├── pg.ts                    # PostgreSQL CRUD
│   ├── parquet.ts               # Batch export
│   └── s3.ts                    # Archival storage
├── serve/           # APIs y SDK
│   ├── api/rest.ts              # Endpoints REST
│   └── sdk/ts/
│       ├── index.ts
│       ├── client.ts
│       └── types.ts
├── dq/              # Data Quality
│   ├── rules.ts                 # Coverage/freshness/range
│   └── coverage.ts              # Coverage calculator
├── metrics/         # Observabilidad
│   └── feature.metrics.ts       # Prometheus counters/gauges
└── tests/           # Suite de tests
    ├── unit/
    ├── api/
    └── e2e/
```

### Liquidity Regime (Semáforo LAV PLUS)

```
services/liquidity-regime/
├── signals/         # Componentes de liquidez
│   ├── components.ts            # GL/CN/MP normalizados
│   ├── composite.ts             # LAV_LIQ_SCORE
│   └── regime.ts                # Verde/Amarillo/Rojo
├── registry/
│   └── liquidity.feeds.json     # Feeds de componentes
├── dq/
│   └── rules.ts                 # DQ para señales
├── serve/
│   └── api/rest.ts              # /regime/latest, /scoreboard
├── metrics/
│   └── liquidity.metrics.ts     # Prometheus
└── tests/
    ├── unit/
    └── api/
```

---

## 📊 CONTRATOS DE DATOS

### FeatureSpec (Catálogo)

```typescript
interface FeatureSpec {
  id: string; // "macro/us/walcl_total_usd"
  entity: 'asset' | 'pair' | 'market' | 'macro';
  description: string;
  unit: string; // 'USD', 'ratio', 'bps', 'index'
  frequency: 'tick' | '1m' | '5m' | '1h' | '1d';
  ttl_ms: number; // Staleness threshold
  tags: string[]; // ['macro', 'liquidity']
  source: {
    id: string;
    class: 'onchain' | 'cex' | 'macro' | 'derived';
    schema: string;
  };
  quality?: {
    expected_range?: [number, number];
    seasonal?: boolean;
  };
  version: number;
}
```

### FeaturePoint (Time-Series)

```typescript
interface FeaturePoint {
  featureId: string;
  ts: string; // ISO 8601
  value: number;
  stale: boolean;
  confidence: number; // 0..1
  meta?: Record<string, any>;
  evidence?: EvidenceRef[]; // Audit trail
}
```

### Liquidity Components

```typescript
// Global Liquidity (GL)
- macro/us/walcl_total_usd (+)
- macro/us/tga_balance_usd (−)
- macro/us/rrp_total_usd (−)

// Crypto Native (CN)
- crypto/etf/btc_net_flow_usd (+)
- crypto/etf/eth_net_flow_usd (+)
- crypto/stables/mcap_total_usd_yoy (+)

// Market Plumbing (MP)
- cex/agg/spot_depth_2pct_usd (+)
- cex/agg/perp_oi_usd (+/−)
- dex/agg/active_liquidity_usd (+)
```

### LAV_LIQ_SCORE

```typescript
LAV_LIQ_SCORE = w1 * GL + w2 * CN + w3 * MP;
// Ponderaciones iniciales: 0.4 / 0.4 / 0.2
// Normalización: z-score truncado ±3, EMA smoothing (α=0.2)
// Output: 0-100 scale
```

### Régimen (Semáforo)

```typescript
enum RegimeState {
  VERDE = 'verde', // LAV_LIQ_SCORE > +θ_hi ∧ ETF flows > 0 ∧ Stables YoY > 0
  AMARILLO = 'amarillo', // Neutral / Mixed signals
  ROJO = 'rojo', // LAV_LIQ_SCORE < −θ_lo ∨ (RRP↑ ∧ TGA↑ ∧ ETF flows < 0)
}

interface RegimeOutput {
  state: RegimeState;
  confidence: number; // 0..1 (coherencia de componentes)
  components: {
    gl: number; // −3..+3 z-score
    cn: number;
    mp: number;
  };
  score: number; // 0..100
  updated_at: string;
}
```

---

## 🗄️ STORAGE & RETENCIÓN

### PostgreSQL Schema

```sql
-- Catálogo de features
CREATE TABLE features_catalog (
  id VARCHAR(255) PRIMARY KEY,
  entity VARCHAR(50) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  frequency VARCHAR(10),
  ttl_ms INTEGER,
  tags TEXT[],
  source JSONB,
  quality JSONB,
  version INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-series con partición diaria
CREATE TABLE features_values (
  feature_id VARCHAR(255) NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION,
  stale BOOLEAN DEFAULT false,
  confidence DOUBLE PRECISION,
  meta JSONB,
  evidence JSONB,
  PRIMARY KEY (feature_id, ts)
) PARTITION BY RANGE (ts);

-- Índices
CREATE INDEX idx_features_values_feature_ts ON features_values (feature_id, ts DESC);
CREATE INDEX idx_features_catalog_tags ON features_catalog USING GIN(tags);
```

### Parquet S3 Export

- **Path**: `s3://lav-features/{featureId}/dt=YYYY-MM-DD/*.parquet`
- **Batch Cron**: `*/15 * * * *` (cada 15 min)
- **Retention**: 365d en S3, 30-90d en PG

---

## 🔌 APIs & ENDPOINTS

### Feature Store APIs

```
GET  /api/features/v1/catalog
     → FeatureSpec[] (catálogo completo)

GET  /api/features/v1/latest?featureId={id}
     → FeaturePoint (último valor)

POST /api/features/v1/query
     Body: { featureIds[], since?, until?, agg?, limit? }
     → FeatureQueryResult[]

POST /api/features/v1/publish (scope: oracle.publisher)
     Body: FeaturePoint[]
     → { accepted: number, rejected: number }
     [SIM-ONLY para mocks/backfill]
```

### Liquidity APIs

```
GET  /api/liquidity/v1/regime/latest
     → RegimeOutput

GET  /api/liquidity/v1/scoreboard
     → { score, components, signals, coherence }

GET  /api/liquidity/v1/hints
     → { market_neutral, directional, yield }
     [Hints para sleeves - NO trading]
```

### SDK Usage

```typescript
import { FeatureStoreClient } from '@/services/feature-store/sdk';

const client = new FeatureStoreClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  token: process.env.ORACLE_READER_TOKEN,
});

// Latest value
const latest = await client.getFeatureLatest('macro/us/walcl_total_usd');

// Time-series query
const series = await client.queryFeatures({
  featureIds: ['crypto/etf/btc_net_flow_usd'],
  since: '2025-10-01T00:00:00Z',
  until: '2025-10-20T00:00:00Z',
  agg: 'sum',
});
```

---

## 📈 OBSERVABILIDAD

### Prometheus Metrics

```typescript
// Feature Store
feature_ingest_total{feature}
feature_ingest_fail_total{feature}
feature_freshness_seconds{feature}        // Gauge: now - ts
feature_coverage_ratio{feature}           // Gauge: % puntos vs esperado
feature_query_duration_seconds{endpoint}  // Histogram
feature_storage_size_bytes{layer}         // Gauge: PG/S3

// Liquidity Regime
liquidity_score{block}                    // Gauge: GL/CN/MP
liquidity_regime_state{state}             // Gauge: 0/1 por estado
liquidity_component_zscore{component}     // Gauge: z-score normalizado
liquidity_coherence{component}            // Gauge: coherencia interna
```

### Grafana Dashboards

**feature_store_qa.json**

- Panels: Coverage ratio, Freshness p95, Outliers/hour, Ingest rate
- Alerts: Coverage <80%, Freshness >TTL, Ingest failures >5%

**liquidity_regime.json**

- Panels: LAV_LIQ_SCORE timeseries, Components z-score, Regime state (semáforo)
- Alerts: Regime flip (verde→rojo en <24h), Component divergence >2σ

---

## 🧪 STRATEGY DE TESTS

### Unit Tests (≥75% statements)

```typescript
// Schema validation
describe('FeatureSpec validation', () => {
  it('should accept valid spec', () => { ... });
  it('should reject invalid frequency', () => { ... });
  it('should enforce TTL constraints', () => { ... });
});

// Normalization
describe('normalize transforms', () => {
  it('should convert units correctly', () => { ... });
  it('should handle timezone America/Mexico_City', () => { ... });
  it('should resample to target frequency', () => { ... });
});

// Z-score & seasonal
describe('statistical transforms', () => {
  it('should calculate z-score with rolling window', () => { ... });
  it('should detect seasonal patterns', () => { ... });
  it('should smooth with EMA alpha=0.2', () => { ... });
});

// Regime classification
describe('liquidity regime', () => {
  it('should classify VERDE with score>0.8', () => { ... });
  it('should classify ROJO with score<-0.8', () => { ... });
  it('should handle edge cases', () => { ... });
});
```

### API Tests (≥70% branches)

```typescript
describe('GET /api/features/v1/catalog', () => {
  it('should return 200 with catalog', () => { ... });
  it('should filter by tags', () => { ... });
  it('should handle empty catalog', () => { ... });
});

describe('POST /api/features/v1/query', () => {
  it('should return time-series', () => { ... });
  it('should respect since/until', () => { ... });
  it('should aggregate with agg=sum', () => { ... });
  it('should enforce rate limit 429', () => { ... });
  it('should trigger circuit breaker on errors', () => { ... });
});

describe('GET /api/liquidity/v1/regime/latest', () => {
  it('should return regime state', () => { ... });
  it('should include confidence score', () => { ... });
  it('should handle stale data gracefully', () => { ... });
});
```

### E2E Tests (Shadow mode)

```typescript
describe('Feature Store E2E', () => {
  it('should backfill historical data', () => { ... });
  it('should serve features via SDK', () => { ... });
  it('should export to Parquet S3', () => { ... });
});

describe('Liquidity Regime E2E', () => {
  it('should compute score from components', () => { ... });
  it('should update regime state', () => { ... });
  it('should expose scoreboard', () => { ... });
});
```

---

## 📦 SEEDS & FIXTURES

### features.catalog.json (≥20 features)

```json
[
  {
    "id": "macro/us/walcl_total_usd",
    "entity": "macro",
    "description": "Federal Reserve Total Assets (WALCL)",
    "unit": "USD",
    "frequency": "1d",
    "ttl_ms": 86400000,
    "tags": ["macro", "liquidity", "fed"],
    "source": { "id": "fred", "class": "macro", "schema": "v1" },
    "quality": { "expected_range": [6e12, 10e12], "seasonal": false },
    "version": 1
  },
  {
    "id": "crypto/etf/btc_net_flow_usd",
    "entity": "asset",
    "description": "Bitcoin Spot ETF Net Flow (USD)",
    "unit": "USD",
    "frequency": "1d",
    "ttl_ms": 86400000,
    "tags": ["crypto", "etf", "flow"],
    "source": { "id": "farside", "class": "macro", "schema": "v1" },
    "quality": { "expected_range": [-1e9, 1e9] },
    "version": 1
  },
  {
    "id": "cex/agg/spot_depth_2pct_usd",
    "entity": "market",
    "description": "Aggregate CEX Spot Depth ±2% (USD)",
    "unit": "USD",
    "frequency": "1h",
    "ttl_ms": 7200000,
    "tags": ["cex", "liquidity", "depth"],
    "source": { "id": "cex-aggregator", "class": "derived", "schema": "v1" },
    "quality": { "expected_range": [1e8, 1e10] },
    "version": 1
  }
  // ... +17 más
]
```

### liquidity.feeds.json

```json
{
  "components": {
    "gl": {
      "feeds": [
        "macro/us/walcl_total_usd",
        "macro/us/tga_balance_usd",
        "macro/us/rrp_total_usd"
      ],
      "weights": [1.0, -1.0, -1.0]
    },
    "cn": {
      "feeds": [
        "crypto/etf/btc_net_flow_usd",
        "crypto/etf/eth_net_flow_usd",
        "crypto/stables/mcap_total_usd_yoy"
      ],
      "weights": [1.0, 1.0, 1.0]
    },
    "mp": {
      "feeds": [
        "cex/agg/spot_depth_2pct_usd",
        "cex/agg/perp_oi_usd",
        "dex/agg/active_liquidity_usd"
      ],
      "weights": [1.0, 0.5, 1.0]
    }
  },
  "score": {
    "id": "liquidity/score/lav_liq_score",
    "weights": [0.4, 0.4, 0.2],
    "smoothing": { "alpha": 0.2 }
  },
  "regime": {
    "thresholds": { "green": 0.8, "red": -0.8 },
    "confirmation_windows": { "flip": "24h" }
  }
}
```

---

## 🌍 VARIABLES DE ENTORNO

```bash
# Feature Store
FEATURE_STORE_EXPORT_S3_URI=s3://lav-features
FEATURE_STORE_RETENTION_DAYS=90
FEATURE_STORE_PARQUET_BATCH_CRON="*/15 * * * *"
FEATURE_STORE_PG_PARTITION_DAYS=7           # Crear particiones adelantadas

# Liquidity Score
LIQ_SCORE_WEIGHTS="0.4,0.4,0.2"            # GL,CN,MP
LIQ_SCORE_THRESHOLDS="0.8,-0.8"            # θ_hi, θ_lo
LIQ_SCORE_SMOOTHING_ALPHA=0.2
LIQ_REGIME_FLIP_CONFIRMATION_HOURS=24

# Quality & Limits
FEATURE_DQ_COVERAGE_MIN=0.80               # 80% mínimo
FEATURE_DQ_FRESHNESS_MAX_RATIO=1.5         # 1.5x TTL max
FEATURE_API_RATE_LIMIT_RPM=1000            # 1000 req/min
```

---

## 📅 PLAN DE EJECUCIÓN — 3 FASES

### **FASE 1: Base del Feature Store** (1-2 días)

**Objetivo**: Fundación sólida con contratos, storage y catálogo

**Entregables**:

- ✅ `schema/types.ts` + `schema/zod.ts` (contratos Zod)
- ✅ `registry/catalog.ts` + `registry/contracts.ts`
- ✅ `registry/features.catalog.json` (≥20 features seed)
- ✅ `registry/datasources.json` (metadata sin secretos)
- ✅ `storage/pg.ts` (CRUD + partitioning)
- ✅ `storage/parquet.ts` (export stub)
- ✅ `storage/s3.ts` (upload stub)
- ✅ Tests unitarios de schemas y storage
- ✅ Migraciones Prisma para tablas

**Criterios de Salida**:

- Schemas Zod validando correctamente
- PG schema creado y migrado
- Catálogo cargable desde JSON
- Tests green (≥75% coverage en schemas)
- PR atómico y reviewable

---

### **FASE 2: APIs, SDK & DQ** (1-2 días)

**Objetivo**: Servir features con calidad garantizada

**Entregables**:

- ✅ `ingest/loaders.ts` + `ingest/backfill.ts`
- ✅ `transform/normalize.ts` + `transform/seasonal.ts`
- ✅ `dq/rules.ts` (coverage, freshness, range)
- ✅ `dq/coverage.ts` (calculadora)
- ✅ `serve/api/rest.ts` (4 endpoints REST)
- ✅ `serve/sdk/ts/` (client, types, index)
- ✅ `metrics/feature.metrics.ts` (Prometheus)
- ✅ Tests API + SDK (≥70% branches)
- ✅ Integration tests con shadow mode

**Criterios de Salida**:

- APIs responden 200 con mocks
- SDK funciona end-to-end
- DQ rules detectan outliers
- Métricas expuestas en `/api/metrics/wsp`
- Tests green (≥75% coverage total)
- PR atómico y reviewable

---

### **FASE 3: Liquidity Regime + Observabilidad** (1-2 días)

**Objetivo**: Semáforo LAV PLUS operativo con dashboards

**Entregables**:

- ✅ `services/liquidity-regime/signals/components.ts`
- ✅ `services/liquidity-regime/signals/composite.ts`
- ✅ `services/liquidity-regime/signals/regime.ts`
- ✅ `registry/liquidity.feeds.json`
- ✅ `serve/api/rest.ts` (3 endpoints liquidity)
- ✅ `dq/rules.ts` (DQ para señales)
- ✅ `metrics/liquidity.metrics.ts` (Prometheus)
- ✅ Tests unit + API para liquidity
- ✅ `observability/grafana/dashboards/feature_store_qa.json`
- ✅ `observability/grafana/dashboards/liquidity_regime.json`
- ✅ E2E tests con scoreboard visible

**Criterios de Salida**:

- LAV_LIQ_SCORE calculándose correctamente
- Régimen clasificándose (verde/amarillo/rojo)
- Scoreboard API funcionando
- Dashboards Grafana importables
- Tests green (≥75% coverage total)
- Documentación completa en README
- PR final con integración completa

---

## 🎯 DEFINITION OF DONE (DoD)

### Feature Store

- [ ] APIs `features` responden con datos (mock/shadow)
- [ ] Catálogo versionado con ≥20 features cargadas
- [ ] Storage PG + Parquet + S3 integrados
- [ ] DQ rules aplicándose (coverage, freshness, outliers)
- [ ] SDK TypeScript funcional
- [ ] Métricas Prometheus expuestas
- [ ] Tests ≥75% statements / ≥70% branches
- [ ] Backfill histórico ejecutable

### Liquidity Regime

- [ ] LAV_LIQ_SCORE calculándose de GL/CN/MP
- [ ] Régimen clasificándose correctamente
- [ ] Scoreboard API expone componentes + score
- [ ] Hints para sleeves generándose
- [ ] Métricas Prometheus expuestas
- [ ] Tests ≥75% statements / ≥70% branches

### Observabilidad

- [ ] Dashboard `feature_store_qa.json` importado
- [ ] Dashboard `liquidity_regime.json` importado
- [ ] Métricas visibles en Grafana
- [ ] Alertas configuradas (coverage, freshness, regime flips)

### Integración

- [ ] APIs integradas en Next.js app
- [ ] ENV vars documentadas y ejemplificadas
- [ ] Mock/shadow mode validado (no live data)
- [ ] CI/CD pipeline green
- [ ] Documentación completa en README

---

## 🔐 SEGURIDAD & COMPLIANCE

### RBAC

- `oracle.reader`: Read-only access a features y liquidity
- `oracle.publisher`: Puede publicar features (sim-only)
- `oracle.admin`: Gestiona catálogo y configuración

### Rate Limiting

- 1000 req/min por API key
- Circuit breaker: 503 si error rate >10% en 1min

### Audit Trail

- `evidence[]` en cada FeaturePoint
- Logs estructurados con `x-correlation-id`
- Métricas de acceso por endpoint y usuario

---

## 📚 REFERENCIAS

### Documentos Base

- `ARCHITECTURE.md` — Arquitectura general del sistema
- `ORACLE_CORE_V1_EXECUTIVE_SUMMARY.md` — Oracle Core + Vox v1.1
- `SHADOW_MODE_QUICKREF.md` — Shadow mode operativo
- `CI_INTEGRATION_SETUP.md` — CI/CD con @integration tests

### PRs Relacionados

1. `feat(oracle): Oracle Core v1 + Vox Populi v1.1` (completado)
2. `feat(ci): Integration workflow + Grafana observability` (completado)
3. **PRÓXIMO**: `feat(feature-store): Core structure + catalog + storage`

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Decisiones Técnicas

- **Particionamiento**: PG por día (mejora performance en queries históricos)
- **Normalización**: Timezone `America/Mexico_City` para consistencia
- **Smoothing**: EMA α=0.2 para evitar ruido en score
- **Truncamiento**: Z-scores ±3 para evitar outliers extremos
- **TTL**: Configurable por feature (balance freshness vs costo)

### Trade-offs

- **PG vs ClickHouse**: PG suficiente para ~90 días + millones de puntos. Si escala >10x, migrar a ClickHouse.
- **Parquet batch**: 15min balance entre latencia y overhead. Ajustable si crece volumen.
- **Regime flips**: Confirmación 24h evita false positives pero introduce lag. Monitorear.

### Riesgos & Mitigación

- **Riesgo**: Feeds externos caídos → **Mitigación**: DQ detecta staleness, fallback a último valor válido
- **Riesgo**: Storage saturation → **Mitigación**: Retention policies + alertas en storage_size_bytes
- **Riesgo**: Regime flips erráticos → **Mitigación**: Confirmation windows + coherence threshold

---

## ✅ CHECKPOINTS DE CALIDAD

Antes de cada PR merge:

- [ ] Lint 0 errors (`pnpm lint`)
- [ ] Typecheck pass (`pnpm typecheck`)
- [ ] Build success (`pnpm build`)
- [ ] Tests ≥75% coverage (`pnpm test:coverage`)
- [ ] Integration tests green (`pnpm test:integration`)
- [ ] Docs actualizadas (README, API specs)
- [ ] ENV vars documentadas
- [ ] Grafana dashboards testeados

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar este plan** con stakeholders
2. **Crear branch**: `feat/feature-store-lav-plus`
3. **Ejecutar Fase 1**: Base del Feature Store
4. **PR atómico**: Review + merge
5. **Ejecutar Fase 2**: APIs, SDK & DQ
6. **PR atómico**: Review + merge
7. **Ejecutar Fase 3**: Liquidity Regime + Observabilidad
8. **PR final**: Review + merge
9. **Deploy a shadow**: Validar en entorno controlado
10. **Documentación final**: Update README y runbooks

---

**Última Actualización**: 2025-10-20  
**Owner**: Equipo LAV ADAF  
**Reviewers**: Arquitectura, Data Engineering, DevOps  
**Estado**: 📋 READY FOR EXECUTION
