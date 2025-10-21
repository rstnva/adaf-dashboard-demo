# PROMPT — ADAF ORACLE CORE v1.1 (Meta-Oráculo 5x On-Chain) + Home Command Center · DEMO MOCK-LOCK

> **Delta v1.1 (extiende v1.0 sin romper contratos)**
>
> 1. Checklist "flip a mixed/live" con pre-condiciones SLO/SLA.  
> 2. Refuerzo DQ (z-score, estacionalidad, rangos y "liveness/dispute").  
> 3. Instrumentación shadow RMSE por fuente y feed.  
> 4. Tabla de RPC/heartbeats y latency-score.  
> 5. Modo opcional DIA (shadow add-on) sin alterar el quórum 5×.  
> 6. ACL por feed + circuit breakers.  
> 7. Priorizar block-time sobre wall-clock para señales on-chain.  
> 8. Agregar runbook y SLOs.

---

## Contexto (no cambiar)

- **Stack**: Next.js 15 + TypeScript + Tailwind + Prisma; Redis + PostgreSQL; Prometheus en `/api/metrics/wsp`; monorepo con dashboards (WSP, News, BlackBox, Alpha, Vol, Equities).  
- **Objetivo**: El **Oráculo** es el **SSOT/meta-oráculo**. Conectar **5 oráculos on-chain** en **modo shadow** (no visible al dash), dejar listo el "flip" a **mixed/live**; mantener **Dashboard 100% mock** consumiendo el Oráculo vía **SDK**. El Home será el **Oracle Command Center**.

---

## 0) Guardrails globales

- `EXECUTION_MODE="dry-run"` (nunca trades).  
- `ORACLE_SOURCE_MODE="mock"` por defecto. Preparar `shadow|mixed|live` (**no activarlos**).  
- Feature Flag: `NEXT_PUBLIC_FF_ORACLE_CORE_ENABLED=true` (demo).  
- Scopes RBAC: `feature:oracle_core`, `oracle.reader`, `oracle.publisher`, `oracle.admin`.  
- **Ribbon UI** permanente: "DEMO (MOCK DATA)".  
- Logs **JSON** con `x-correlation-id`, `build_sha`, `feed_version` y `env`.  
- **Circuit breakers** (429/503) por QPS/latencia y **backoff** exponencial.  
- Si la estructura choca con el repo, elegir la ubicación más limpia y documentar la decisión en los README.

---

## 1) ADAF ORACLE CORE (SSOT/meta-oráculo)

```
services/oracle-core/
  ingest/
    adapters/.keep
    onchain-oracles/
      chainlink.adapter.ts
      pyth.adapter.ts
      redstone.adapter.ts
      band_or_tellor.adapter.ts
      chronicle_or_uma.adapter.ts
    scheduler.ts
  digest/{normalize.ts, units.ts, currency.ts, quality.ts}
  consensus/{aggregators.ts, quorum.ts, validators.ts}
  registry/{feeds.ts, models.ts, datasets.ts, schema.ts, versioning.ts, feeds.mock.json, feeds.onchain.shadow.json, sources.registry.json, heartbeats.json, rpc.endpoints.json}
  serve/api/{rest.ts, ws.ts, graphql.ts}
  serve/sdk/ts/{index.ts, client.ts, types.ts}
  lineage/{provenance.ts, evidence.ts, signatures.ts}
  storage/{pg.ts, redis.ts, s3.ts, tsdb.ts}
  dq/{rules.ts, quarantine.ts, report.ts}
  metrics/oracle.metrics.ts
  acl/rbac.ts
  tests/{unit, api, e2e}/...
  README_ORACLE_CORE.md
```

### Tipos TS/Zod (exportar desde `registry/schema.ts` y re-exportar en el SDK)

```ts
type Feed = {
  id: string; name: string; category: string; unit: string;
  ttl_ms: number; quorum: { k: number; n: number };
  sources: { id: string; weight: number; ttl_ms?: number }[];
  tags: string[]; version: number;
}

type EvidenceRef = {
  source_id: string; url?: string; hash?: string; captured_at: string;
  chain_id?: number; block_number?: number; roundId?: string; price_id?: string;
  contract_addr?: string; queryId?: string; liveness_secs?: number; dispute?: boolean; signer?: string;
}

type Signal = {
  id: string; feedId: string; ts: string; value: number; unit: string;
  confidence: number; quorum_ok: boolean; stale: boolean;
  evidence: EvidenceRef[]; tags: string[]; rev: number;
}

type Model = { id: string; name: string; inputFeeds: string[]; outputFeeds: string[]; version: string; owner: string; cards:{description:string;limitations:string} }

type Dataset = { id: string; name: string; schema_version: string; storage:{s3_uri?:string; table?:string}; retention_days:number }
```

### APIs (REST + WS) en `serve/api`

- `GET  /api/oracle/v1/feeds` → catálogo.  
- `GET  /api/oracle/v1/feeds/:id/latest` → `Signal` con `stale/quorum_ok/confidence`.  
- `POST /api/oracle/v1/query` → `{feedIds[], since?, until?, agg?}` (serie/snapshot).  
- `POST /api/oracle/v1/publish` (scope `oracle.publisher`) → sim-only; valida schema + quórum.  
- `WS   /api/oracle/v1/subscribe?feedId=...` → stream.  
- `GET  /api/oracle/v1/provenance/:signalId` → evidencias.  
- `GET  /api/oracle/health` → db/redis/tsdb/s3 OK. Headers: `X-Data: stale` cuando aplique; rate-limit 429; circuit-open 503.

### Pipeline mínimo

- **Ingest**: awareness de mocks (sin live). Toma de tiempo basada en block-time cuando aplique; fallback a wall-clock con flag.  
- **Digest**: normaliza unidades y timezone `America/Mexico_City`.  
- **Consensus**: `weightedMedian` / `trimmedMean`, `k-of-n`; set `stale`/`confidence`.

---

## 2) Catálogo MOCK + Seeders + Sources

- `registry/feeds.mock.json`: ≥40 feeds (WSP, News, BlackBox, Alpha, Vol, Equities, Capacity, Blockspace, Governance, Oracles/Bridges, Stables).  
  - `quorum:{k:1,n:1}`, `sources:[{id:"mock",weight:1}]`, `ttl_ms`, `unit` clara, `tags`.  
- `registry/sources.registry.json`: proveedores reales (`nansen`, `messari`, `bloomberg`, `sosovalue`, `investing`, `fred`, `flashbots`, `chainlink`, `pyth`, `redstone`, `band`, `tellor`, `chronicle`, `uma`) con `tier`, `category`, `tos_class`, `chain_id/price_id/contract_addr`.  
- `registry/heartbeats.json`: `{"feed":"price/btc_usd.live","chainlink_ms":200000,"pyth_ms":2000,...}`.  
- `registry/rpc.endpoints.json`: por red, lista de RPCs con healthcheck y weights.  
- CLI `registry/seed-feeds.ts` (upsert PG/Redis de feeds mock).

**Ejemplos de `feedId` (mock)**:  `wsp/etf/btc_inflow_usd`, `wsp/indices/vix_index`, `wsp/rates/dxy_index`, `wsp/rates/ust10y_yield_bps`, `wsp/calendar/cpi_surprise_sigma`, `news/impact/macro_score`, `blackbox/risk/entity:cex_a`, `vol/surface/btc_iv_30d_atm`, `equities/rank/sp500_top_score`, `capacity/crowding_index`, `blockspace/protected_flow_ratio`, `gov/proposals/dao_a_active_count`, `oracles/latency/chainlink_eth`, `stables/peg/usdc_premium_bps`, etc.

---

## 3) Adapters 5× On-Chain (modo shadow)

Crear en `ingest/onchain-oracles/`:

1. **chainlink.adapter.ts** — lee AggregatorV3, calcula `roundAgeMs`, compara con `heartbeat_ms`, marca `stale` si `roundAge > heartbeat*2`. Evidence con `contract_addr`, `chain_id`, `roundId`, `block_number`.
2. **pyth.adapter.ts** — obtiene `price/conf`, penaliza `confidence` cuando `conf/price` alto; evidence `price_id`.
3. **redstone.adapter.ts** — valida TTL y firmas; evidence `dataProviders`/`signer`; descarta si latencia > TTL o firmas inválidas.
4. **band_or_tellor.adapter.ts** — rounds + `dispute window`; evidence `roundId`/`queryId`; `stale` por heartbeat.
5. **chronicle_or_uma.adapter.ts** — optimistic oracle; `liveness`/`dispute`; `quarantine` cuando `dispute=true`.

`feeds.onchain.shadow.json`: feeds live-shadow (`price/btc_usd.live`, `price/eth_usd.live`, `price/sol_usd.live`, `por/usdc_reserves_usd.live`, `por/usdt_reserves_usd.live`, `gas/eth_gwei.live`).

### Consensus multi-oráculo

- `weightedMedian(values, weights)` con ponderación por tier + latency-score.  
- `quorum_ok` si `k-of-n` (mínimo `k=2` para `price/*`).  
- **DQ**: `>3σ` ⇒ descartar fuente; `roundAge > heartbeat*2` ⇒ stale; `conf/price` alto ⇒ reducir `confidence`; UMA en disputa ⇒ `quarantine`.

**Shadow mode**: `ORACLE_SOURCE_MODE=shadow` publica `.live` en paralelo a `.mock`; reconciliador calcula `oracle_shadow_rmse{feed}`; no exponer `.live` al SDK.

---

## 4) Fixtures & Mock Publishers

- Ubicación: `services/oracle-core/mock/fixtures/{wsp,...,stables}/`.  
- `publish-mock-batch.ts` y `publish-mock-realtime.ts` (determinista con `SEED`, `INTERVAL_MS`, `ORACLE_MOCK_FEEDS`).  
- Formato `Signal` con `confidence` 0.6–0.8, `stale` acorde a `ttl_ms`, `evidence.source_id="mock"`.

---

## 5) SDK TypeScript (consumo único)

```
export class OracleClient {
  constructor(opts:{baseUrl:string; token?:string}) {}
  getLatest(feedId: string): Promise<Signal>;
  query(params:{ feedIds:string[]; since?:string; until?:string; agg?:'mean'|'median' }): Promise<Record<string, Signal[]>>;
  subscribe(feedId: string, cb:(s:Signal)=>void): ()=>void;
  publish(feedId: string, signal: Signal): Promise<{ok:boolean; rev:number}>;
}
export type { Feed, Signal, EvidenceRef };
```

---

## 6) Re-arquitectura App (dash consume el Oráculo)

- `OracleClientProvider` + `useOracle()`; flag `NEXT_PUBLIC_FF_ORACLE_CORE_ENABLED`.  
- Widgets consumen `useOracle()` con fallback legacy cuando FF OFF.  
- Badges: `quorum_ok`, `stale`, `confidence`; Ribbon `DEMO (MOCK DATA)`.

---

## 7) Home = Oracle Command Center

- KPIs: Freshness (`stale_ratio`), Quorum Health, Confidence Avg, Ingest Throughput (`signals/sec`), Read Latency p95, DQ Quarantine, Mode (`ORACLE_SOURCE_MODE`), Subscribers.  
- Tabla/heatmap por feed (stale/quorum/confidence, TTL, última actualización, sparkline).  
- Top Signals & Events (z-scores, news impacto).  
- Quality & Alerts (`oracle_stale_ratio`, `oracle_quorum_fail_total`).  
- Consumers (estado de WSP/News/BlackBox/Alpha).  
- Provenance modal (`signalId` → `EvidenceRef[]`).

---

## 8) Observabilidad (Prometheus) + Panel DEMO

- Métricas: `oracle_ingest_total{source}`, `oracle_ingest_fail_total`, `oracle_digest_latency_seconds`, `oracle_consensus_latency_seconds`, `oracle_signals_total{feed}`, `oracle_stale_ratio{feed}`, `oracle_quorum_fail_total{feed}`, `oracle_reads_total{feed,widget}`, `oracle_read_latency_seconds`, `oracle_subscribers_gauge{feed}`, `oracle_live_reads_total{source,feed}`, `oracle_shadow_rmse{feed}`, `oracle_oracle_deviation_total{feed,source}`, estado RPC (`oracle_rpc_circuit_state`).  
- Panel Grafana "Oracle Freshness (DEMO)".

---

## 9) Data Quality & Quarantine

- `dq/rules.ts`: rangos, z-score, estacionalidad, límites dinámicos.  
- `dq/quarantine.ts`: `quarantined=true` y alerta.  
- `dq/report.ts`: resumen `/health` y log diario.

---

## 10) Seguridad & Acceso

- Tokens con scopes (`oracle.reader/publisher/admin`), ACL por feed.  
- Auditoría `x-correlation-id`.  
- Nota legal: `sources.registry.json` sólo metadata; sin data propietaria.

---

## 11) ENV + Scripts DEMO

```
EXECUTION_MODE=dry-run
NEXT_PUBLIC_FF_ORACLE_CORE_ENABLED=true
ORACLE_SOURCE_MODE=mock
ORACLE_MOCK_FEEDS=wsp/*,news/*,blackbox/*,alpha/*,vol/*,equities/*,capacity/*,blockspace/*,gov/*,oracles/*,stables/*
ORACLE_CORE_URL=http://localhost:3005
ORACLE_DEMO_SEED=42
ORACLE_DEMO_INTERVAL_MS=4000
```

Scripts demo: `demo:up`, `demo:seed`, `demo:realtime`, `demo:dash`.

---

## 12) Tests (deterministas, FF ON/OFF)

- Unit (consenso, TTL→stale, publish mock, DQ/quarantine).  
- API (`/feeds/:id/latest`, `/query`, `/publish`) con 200/304/429/503 + `X-Data`.  
- Unit dashboard (SDK mock, badges, fallback).  
- E2E Playwright FF ON/OFF.  
- Cobertura ≥75% statements / ≥70% branches.

---

## 13) Documentación & Runbooks

- `docs/ORACLE_CORE_METHOD_v1.md`, `docs/ORACLE_FEEDS_CATALOG.md`, `docs/ORACLE_CORE_CONSUMERS.md`, `docs/DEMO_MOCK_MODE.md`, `RUNBOOK_ORACLE_CORE.md`.  
- Nota legal en `sources.registry.json`.

---

## 14) Definition of Done

- Home = Oracle Command Center operativo.  
- Widgets leen `useOracle()` (FF ON) con badges y Ribbon demo.  
- Oracle Core sirve mocks batch+realtime.  
- Adapters 5× shadow publican `.live` (no visibles al dash).  
- Métricas shadow (`rmse`, `deviation`) visibles; `/health` OK.  
- Tests unit/API/E2E verdes; cobertura ≥75/≥70.  
- Flip a `mixed/live` documentado (no activado).

PR sugerido: `feat(oracle-core): Meta-Oráculo 5x on-chain (shadow) + Home Command Center · SSOT + SDK + 100% MOCK`.

---

## 15) Add-on: DIA shadow

- Adapter `ingest/onchain-oracles/dia.adapter.ts` (HTTP/WS).  
- Feeds shadow `price/<ASSET>_usd.dia_shadow`, `nft/floor/<COLLECTION>.dia_shadow`.  
- DQ: excluir wash-trading; `confidence` por dispersión; `ttl_ms` por colección.  
- Métricas: `oracle_oracle_deviation_total{source="dia"}`; contribuye a `oracle_shadow_rmse`.

---

## 16) Checklist Flip a `mixed/live`

1. **SLOs 7d**: `stale_ratio` ≤2% (p95) en `price/*`; `quorum_fail_total` =0 (24h); `shadow_rmse` ≤0.15%; `oracle_read_latency_seconds` p95 ≤150ms.  
2. **Infra**: RPC primario/backup sanos; circuit breakers sin disparos (24h).  
3. **Seguridad**: tokens rotados; auditoría `publish` limpia.  
4. **Runbook**: dry-run 30 min (`mixed` en 10% readers internos).  
5. **Rollback**: palanca `MODE=mixed→mock` en 1 clic.

---

## 17) Tabla de RPC & Heartbeats (semilla)

```json
{
  "ethereum": ["https://rpc.primario", "https://rpc.backup"],
  "arbitrum": ["https://arb.primario", "https://arb.backup"],
  "solana":   ["https://sol.primario", "https://sol.backup"]
}
```

```json
[
  {"feed":"price/btc_usd.live","chainlink_ms":200000,"pyth_ms":2000,"redstone_ms":10000,"tellor_ms":300000,"uma_ms":300000},
  {"feed":"gas/eth_gwei.live","chainlink_ms":20000,"pyth_ms":2000}
]
```

`stale = roundAgeMs > heartbeat_ms * 2` por fuente.

---

## 18) Runbook resumido (demo)

1. `pnpm demo:up` (PG/Redis sanos).  
2. `pnpm demo:seed`.  
3. `pnpm demo:realtime`.  
4. `pnpm demo:dash`.  
5. Grafana → tablero "Oracle Freshness (DEMO)".  
6. Validar `/health` y KPIs.  
7. **No activar** `shadow|mixed|live`.

---

## 19) Módulo Vox Populi Sentiment v1 (shadow add-in)

> Percepción social en tiempo real con V³ (volumen, velocidad, valencia) por activo/narrativa.

```
ingest/vox/
  x.adapter.ts
  reddit.adapter.ts
  discord.adapter.ts
  telegram.adapter.ts
  news.adapter.ts
  providers/
    santiment.provider.ts
    lunarcrush.provider.ts
    thetie.provider.ts
  taxonomy/
    entities.map.json
    narratives.json
```

digest/vox `{nlp.ts, botguard.ts, score.ts, topics.ts}`; `consensus/vox/aggregators.ts`; `registry/feeds.vox.json`; `metrics/vox.metrics.ts`.

Feeds ejemplo: `vox/x/sentiment_weighted:<ASSET>`, `vox/x/volume:<ASSET>`, `vox/all/vpi:<ASSET>`, `vox/narratives/dominance:<TOPIC>`, `vox/market/fear_greed_index`.

### Scoring & antibots

- Valencia: RoBERTa/FinBERT + diccionarios cripto; emojis.  
- Volume/Velocity: únicos por autor; detección de bursts (CUSUM) y z-scores.  
- Credibilidad (0..1): edad cuenta, followers/following, frecuencia, repetición. Penalización brigading.

`VPI = wV*valence + wVol*log(volume_norm) + wVel*velocity_z + wCred*credibility` (0..100).

### DQ & observabilidad

- Outliers (>3σ) ⇒ descartar; coordinated surge ⇒ `suspected_brigading=true`.  
- Evidence: `source_id`, `sample_size`, `captured_at`, `api_tier`.  
- Métricas: `vox_ingest_total{source}`, `vox_valence_avg{asset}`, `vox_velocity_z{asset}`, `vox_vpi{asset}`, `vox_brigading_suspected_total`.  
- Panel "Vox Populi" (trending narratives, top movers, heatmap horario).

SLO shadow: Freshness X/Reddit ≤120s, Telegram/Discord ≤5m, News ≤2m; Coverage ≥90% top-20 activos; Error ingest <1% p95.

### Legal/TOS

- Respetar TOS; no persistir PII ni texto completo; sólo metadata.  
- Uso de proveedores (Santiment/LunarCrush/TheTie) mientras se define Enterprise.  
- Opt-out para comunidades.

### UI Command Center

- Trending Narratives (sparklines), Top Movers VPI 1h/24h.  
- "Hype vs Price" (divergencias).  
- Provenance modal con muestras por fuente.

### ENV

```
ORACLE_VOX_ENABLED=true
VOX_LANGS=es,en,pt
VOX_MIN_ACCOUNT_AGE_DAYS=30
VOX_MIN_FOLLOWERS=50
VOX_VPI_WEIGHTS=0.35,0.25,0.25,0.15
```

Roadmap: Phase A (proveedores), Phase B (APIs directas), Phase C (narrativas).  
DoD: métricas y KPIs en Command Center, `vox/*` en mock + shadow proveedor, alertas básicas, checklist ready para mixed.

---

> **Nota:** Este documento sirve como contrato operativo para ADAF ORACLE CORE v1.1. Actualiza el avance en `SPRINTS_2025-10-15-ORACLE-CORE.md` y registra decisiones en `MEMORIA_GITHUB_COPILOT.md`.
