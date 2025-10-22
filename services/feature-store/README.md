# Feature Store

**Sistema de almacenamiento centralizado (SSOT) para features financieras en tiempo-real e históricas.**

## 📋 Descripción

El Feature Store provee una infraestructura robusta para:

- **Catálogo centralizado** de features con metadata
- **Storage multi-capa**: PostgreSQL (hot), Parquet (batch), S3 (archival)
- **Ingesta y transformación** de datos desde múltiples fuentes
- **Data Quality** con cobertura, freshness y outlier detection
- **APIs REST + SDK** para consumo en dashboards y servicios

---

## 🏗️ Arquitectura

### Estructura de Directorios

```
services/feature-store/
├── schema/                    # Type system & validation
│   ├── types.ts               # TypeScript interfaces
│   └── zod.ts                 # Zod validation schemas
├── registry/                  # Catalog & data sources
│   ├── catalog.ts             # Catalog CRUD operations
│   ├── contracts.ts           # Data source contracts
│   ├── features.catalog.json  # 21 features seed
│   └── datasources.json       # 8 data sources metadata
├── storage/                   # Multi-layer persistence
│   ├── pg.ts                  # PostgreSQL (time-series, partitioned)
│   ├── parquet.ts             # Batch export to Parquet
│   └── s3.ts                  # Archival storage
├── ingest/                    # [PRÓXIMO] Data ingestion
│   ├── loaders.ts
│   ├── backfill.ts
│   └── adapters/
├── transform/                 # [PRÓXIMO] Normalization
│   ├── normalize.ts
│   ├── joins.ts
│   └── seasonal.ts
├── dq/                        # [PRÓXIMO] Data Quality
│   ├── rules.ts
│   └── coverage.ts
├── serve/                     # [PRÓXIMO] APIs & SDK
│   ├── api/rest.ts
│   └── sdk/ts/
└── metrics/                   # [PRÓXIMO] Observability
    └── feature.metrics.ts
```

---

## 🎯 Catálogo de Features (21 seeds)

### Global Liquidity (3)

- `macro/us/walcl_total_usd` - Fed Total Assets (WALCL)
- `macro/us/tga_balance_usd` - Treasury General Account
- `macro/us/rrp_total_usd` - Reverse Repo Outstanding

### Crypto Native (6)

- `crypto/etf/btc_net_flow_usd` - Bitcoin ETF flows
- `crypto/etf/eth_net_flow_usd` - Ethereum ETF flows
- `crypto/stables/mcap_total_usd` - Stablecoins market cap
- `crypto/stables/mcap_total_usd_yoy` - Stablecoins YoY growth
- `crypto/btc/price_usd` - Bitcoin spot price
- `crypto/eth/price_usd` - Ethereum spot price

### Market Plumbing (3)

- `cex/agg/spot_depth_2pct_usd` - CEX orderbook depth
- `cex/agg/perp_oi_usd` - CEX perpetual OI
- `dex/agg/active_liquidity_usd` - DEX active liquidity

### Otros (9)

- Binance BTC/USDT volume & funding rate
- Bitcoin hashrate & supply
- Ethereum gas price & TVL
- Macro: DXY, SPX, VIX

---

## 🔌 Data Sources (8)

| ID               | Name                          | Class   | Rate Limit | Reliability |
| ---------------- | ----------------------------- | ------- | ---------- | ----------- |
| `fred`           | Federal Reserve Economic Data | macro   | 120 RPM    | 99%         |
| `farside`        | Farside Investors             | macro   | 60 RPM     | 95%         |
| `defillama`      | DeFi Llama                    | onchain | 300 RPM    | 97%         |
| `binance-api`    | Binance Public API            | cex     | 1200 RPM   | 99%         |
| `blockchain-com` | Blockchain.com API            | onchain | 180 RPM    | 98%         |
| `etherscan`      | Etherscan API                 | onchain | 300 RPM    | 99%         |
| `tradingview`    | TradingView Data              | macro   | 600 RPM    | 98%         |
| `cex-aggregator` | Internal CEX Aggregator       | derived | 10k RPM    | 99%         |

---

## 📊 Contratos de Datos

### FeatureSpec (Catálogo)

```typescript
interface FeatureSpec {
  id: string; // "macro/us/walcl_total_usd"
  entity: 'asset' | 'pair' | 'market' | 'macro';
  description: string;
  unit: string; // 'USD', 'ratio', 'bps', 'index'
  frequency: 'tick' | '1m' | '5m' | '1h' | '1d';
  ttl_ms: number; // Staleness threshold
  tags: string[];
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

---

## 🗄️ Storage Layers

### 1. PostgreSQL (Hot Storage)

- **Tablas**:
  - `features_catalog` - Metadata del catálogo
  - `features_values` - Time-series con particionamiento diario
- **Particionamiento**: Automático por fecha (mejora performance)
- **Retención**: 30-90 días (configurable)
- **Índices**: `(feature_id, ts DESC)` para queries rápidos

### 2. Parquet (Batch Export)

- **Path**: `s3://lav-features/{featureId}/dt=YYYY-MM-DD/*.parquet`
- **Cron**: Cada 15 minutos (configurable)
- **Compresión**: Snappy (default), Gzip, LZ4, Zstd
- **Schema**: Columnar para analytics/ML

### 3. S3 (Archival)

- **Bucket**: `lav-features`
- **Lifecycle**: IA (30d) → Glacier (90d) → Expira (365d)
- **Versioning**: Habilitado para audit trail
- **Encryption**: AES-256 at rest

---

## 🚀 Uso

### Cargar Catálogo

```typescript
import {
  getCatalog,
  getFeatureSpec,
} from '@/services/feature-store/registry/catalog';

// Get all features
const catalog = await getCatalog();

// Get single feature
const spec = await getFeatureSpec('macro/us/walcl_total_usd');
```

### Escribir Features (Mock)

```typescript
import { writeFeaturePoints } from '@/services/feature-store/storage/pg';
import { FeaturePoint } from '@/services/feature-store/schema/zod';

const point: FeaturePoint = {
  featureId: 'macro/us/walcl_total_usd',
  ts: new Date().toISOString(),
  value: 7.5e12,
  stale: false,
  confidence: 1.0,
};

const result = await writeFeaturePoints([point]);
console.log(`Inserted: ${result.inserted}, Failed: ${result.failed}`);
```

### Leer Features (Mock)

```typescript
import {
  queryFeaturePoints,
  getLatestFeaturePoint,
} from '@/services/feature-store/storage/pg';

// Query time range
const points = await queryFeaturePoints({
  featureIds: ['macro/us/walcl_total_usd'],
  since: '2025-10-01T00:00:00Z',
  until: '2025-10-20T00:00:00Z',
});

// Get latest
const latest = await getLatestFeaturePoint('macro/us/walcl_total_usd');
```

---

## 🧪 Testing

**Estado Actual**: Fase 1 completa (schemas, registry, storage base)

**Próximos Tests**:

- Unit tests para schemas Zod
- Unit tests para catalog operations
- Integration tests para storage layers
- E2E tests con mock data

**Coverage Target**: ≥75% statements / ≥70% branches

---

## 📈 Observabilidad (Próximo)

### Métricas Prometheus

```
feature_ingest_total{feature}
feature_ingest_fail_total{feature}
feature_freshness_seconds{feature}
feature_coverage_ratio{feature}
feature_query_duration_seconds{endpoint}
feature_storage_size_bytes{layer}
```

### Grafana Dashboards

- `feature_store_qa.json` - Coverage, freshness, outliers
- Alertas: Coverage <80%, Freshness >TTL

---

## 🌍 Variables de Entorno (Próximo)

```bash
# Feature Store
FEATURE_STORE_EXPORT_S3_URI=s3://lav-features
FEATURE_STORE_RETENTION_DAYS=90
FEATURE_STORE_PARQUET_BATCH_CRON="*/15 * * * *"
FEATURE_STORE_PG_PARTITION_DAYS=7

# Quality & Limits
FEATURE_DQ_COVERAGE_MIN=0.80
FEATURE_DQ_FRESHNESS_MAX_RATIO=1.5
FEATURE_API_RATE_LIMIT_RPM=1000
```

---

## 🎯 Roadmap

### ✅ Fase 1: Core Structure (COMPLETADO)

- [x] Schema (types.ts + zod.ts)
- [x] Registry (catalog.ts + contracts.ts)
- [x] Storage (pg.ts + parquet.ts + s3.ts)
- [x] 21 features seed
- [x] 8 data sources

### 🔄 Fase 2: Ingestion & DQ (PRÓXIMO)

- [ ] Ingestion layer (loaders, backfill, adapters)
- [ ] Transform layer (normalize, joins, seasonal)
- [ ] DQ layer (rules, coverage, freshness)
- [ ] Metrics (Prometheus instrumentation)

### 🔜 Fase 3: APIs & Integration

- [ ] REST APIs (catalog, latest, query, publish)
- [ ] TypeScript SDK
- [ ] Grafana dashboards
- [ ] Tests (≥75% coverage)
- [ ] Next.js integration

---

## 📚 Referencias

- **Sprint Plan**: `motor-del-dash/sprints/SPRINT_FEATURE_STORE_LAV_PLUS_2025-10-20.md`
- **Architecture**: `ARCHITECTURE.md`
- **Fortune 500 Standards**: `.github/copilot-instructions.md`

---

**Status**: 🟢 Fase 1 Completa | **Next**: Fase 2 (Ingestion & DQ)  
**Owner**: Equipo LAV ADAF  
**Last Updated**: 2025-10-20
