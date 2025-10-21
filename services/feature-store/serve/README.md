# Feature Store - Serve Layer

Capa de servicio del Feature Store: APIs REST y SDKs para consumo desde aplicaciones externas.

---

## 📋 Contenido

- **api/rest.ts**: Endpoints HTTP para Next.js API routes
- **sdk/ts/**: TypeScript SDK para consumidores

---

## 🚀 REST API

### Autenticación

Todos los endpoints requieren API key vía Bearer token:

```bash
Authorization: Bearer fs_live_abc123...
```

### Endpoints

#### 1. GET /api/features/catalog

Lista todas las features disponibles.

**Query params:**

- `entity` (optional): Filtrar por entidad (btc, eth, protocol, etc)
- `frequency` (optional): Filtrar por frecuencia (1m, 5m, 1h, 1d)
- `tags` (optional): Filtrar por tags (comma-separated)

**Ejemplo:**

```bash
curl -H "Authorization: Bearer fs_live_abc123..." \
  "https://api.adaf.app/feature-store/api/features/catalog?entity=btc&frequency=1h"
```

**Response:**

```json
{
  "features": [
    {
      "id": "btc:price:1h",
      "entity": "btc",
      "description": "Bitcoin price (1-hour)",
      "unit": "usd",
      "frequency": "1h",
      "ttl_ms": 7200000,
      "tags": ["price", "market"],
      "source": {
        "id": "binance",
        "class": "cex",
        "schema": "rest"
      },
      "version": 1
    }
  ],
  "total": 1,
  "filters": {
    "entity": "btc",
    "frequency": "1h"
  }
}
```

---

#### 2. GET /api/features/:id/latest

Obtiene el punto más reciente de una feature.

**Path params:**

- `id`: Feature ID (e.g., "btc:price:1m")

**Ejemplo:**

```bash
curl -H "Authorization: Bearer fs_live_abc123..." \
  "https://api.adaf.app/feature-store/api/features/btc:price:1m/latest"
```

**Response:**

```json
{
  "feature": {
    /* FeatureSpec */
  },
  "point": {
    "value": 50000.0,
    "ts": "2024-01-15T12:00:00Z",
    "featureId": "btc:price:1m",
    "stale": false,
    "confidence": 0.95,
    "meta": { "source": "binance" }
  },
  "metadata": {
    "stale": false,
    "age_ms": 45000,
    "confidence": 0.95
  }
}
```

---

#### 3. POST /api/features/query

Query features por rango de tiempo.

**Body (JSON):**

```json
{
  "feature_id": "btc:price:1h",
  "start_ts": "2024-01-01T00:00:00Z",
  "end_ts": "2024-01-02T00:00:00Z",
  "limit": 100,
  "order": "asc"
}
```

**Ejemplo:**

```bash
curl -X POST \
  -H "Authorization: Bearer fs_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"btc:price:1h","start_ts":"2024-01-01T00:00:00Z","end_ts":"2024-01-02T00:00:00Z"}' \
  "https://api.adaf.app/feature-store/api/features/query"
```

**Response:**

```json
{
  "feature": {
    /* FeatureSpec */
  },
  "points": [
    {
      "value": 49800.0,
      "ts": "2024-01-01T00:00:00Z",
      "featureId": "btc:price:1h",
      "stale": false,
      "confidence": 0.95
    }
  ],
  "metadata": {
    "total": 24,
    "returned": 24,
    "coverage": 1.0
  }
}
```

---

#### 4. POST /api/features/publish

Publica nuevos feature points.

**Body (JSON):**

```json
{
  "points": [
    {
      "feature_id": "btc:price:1m",
      "value": 50000.0,
      "ts": "2024-01-15T12:00:00Z",
      "meta": { "source": "binance" }
    }
  ]
}
```

**Ejemplo:**

```bash
curl -X POST \
  -H "Authorization: Bearer fs_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"points":[{"feature_id":"btc:price:1m","value":50000.0,"ts":"2024-01-15T12:00:00Z"}]}' \
  "https://api.adaf.app/feature-store/api/features/publish"
```

**Response:**

```json
{
  "success": true,
  "accepted": 1,
  "rejected": 0
}
```

**Partial failure (207 Multi-Status):**

```json
{
  "success": false,
  "accepted": 1,
  "rejected": 1,
  "errors": [
    {
      "index": 1,
      "feature_id": "invalid:id",
      "reason": "Feature not found: invalid:id"
    }
  ]
}
```

---

## 🛠️ TypeScript SDK

### Instalación

```typescript
import { createClient } from '@/services/feature-store/serve/sdk/ts';
```

### Configuración

```typescript
const client = createClient({
  baseUrl: process.env.FEATURE_STORE_URL!,
  apiKey: process.env.FEATURE_STORE_API_KEY!,
  timeout: 10000, // 10s
  retries: 3,
  debug: false,
});
```

### Uso

#### Obtener catálogo

```typescript
const catalog = await client.getCatalog({
  entity: 'btc',
  frequency: '1h',
});

console.log(`Found ${catalog.total} features`);
catalog.features.forEach(f => {
  console.log(`- ${f.id}: ${f.description}`);
});
```

#### Obtener punto más reciente

```typescript
const latest = await client.getLatest('btc:price:1m');

if (latest.point) {
  console.log(`BTC Price: $${latest.point.value}`);
  console.log(`Age: ${latest.metadata.age_ms}ms`);
  console.log(`Stale: ${latest.metadata.stale}`);
}
```

#### Query histórico

```typescript
const data = await client.query({
  featureId: 'btc:price:1h',
  startTs: '2024-01-01T00:00:00Z',
  endTs: '2024-01-02T00:00:00Z',
  limit: 24,
  order: 'asc',
});

console.log(`Received ${data.points.length} points`);
console.log(`Coverage: ${(data.metadata.coverage * 100).toFixed(1)}%`);

// Plot data
data.points.forEach(pt => {
  console.log(`${pt.ts}: ${pt.value}`);
});
```

#### Publicar datos

```typescript
const result = await client.publish([
  {
    feature_id: 'btc:price:1m',
    value: 50000.0,
    ts: new Date().toISOString(),
    meta: { source: 'binance' },
  },
]);

if (result.success) {
  console.log(`✅ Published ${result.accepted} points`);
} else {
  console.error(`❌ ${result.rejected} points rejected`);
  result.errors?.forEach(err => {
    console.error(`  - Point ${err.index}: ${err.reason}`);
  });
}
```

#### Manejo de errores

```typescript
import type { FeatureStoreError } from '@/services/feature-store/serve/sdk/ts';

try {
  const data = await client.getLatest('invalid:id');
} catch (error) {
  if ((error as FeatureStoreError).code === 'NOT_FOUND') {
    console.error('Feature not found');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

#### Métricas del cliente

```typescript
const metrics = client.getMetrics();
console.log(`Requests: ${metrics.requests}`);
console.log(`Errors: ${metrics.errors}`);
console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
```

---

## 🔐 Seguridad

### API Keys

- **Formato**: `fs_<environment>_<random>`
- **Environments**: `test`, `dev`, `live`
- **Almacenamiento**: Postgres (tabla `api_keys`)
- **Rate Limiting**: 1000 req/min por key

### Rate Limiting

| Endpoint | Limit   | Window |
| -------- | ------- | ------ |
| /catalog | 100/min | 60s    |
| /latest  | 500/min | 60s    |
| /query   | 100/min | 60s    |
| /publish | 200/min | 60s    |

### CORS

Configurar en Next.js:

```typescript
// src/app/api/feature-store/[...path]/route.ts
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://adaf.app',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
```

---

## 📊 Métricas

### Prometheus Metrics

Disponibles vía `/api/metrics`:

```
# Requests totales por endpoint y status
api_requests_total{endpoint="catalog",status="success"} 1234

# Duración de requests (ms)
api_request_duration_ms{endpoint="latest",quantile="0.5"} 45
api_request_duration_ms{endpoint="latest",quantile="0.95"} 120

# Puntos publicados
api_points_published_total{status="accepted"} 5678
api_points_published_total{status="rejected"} 12
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test services/feature-store/serve/

# Integration tests (requiere servidor corriendo)
pnpm test:integration services/feature-store/serve/

# E2E tests
pnpm test:e2e services/feature-store/serve/
```

---

## 📝 TODO

- [ ] Implementar validación real de API keys (DB/Redis)
- [ ] Implementar rate limiting (Upstash Redis)
- [ ] Implementar query real desde storage/pg.ts
- [ ] Implementar escritura real a storage/pg.ts
- [ ] Agregar webhooks para eventos (feature_published, dq_violation)
- [ ] Agregar WebSocket endpoint para streaming real-time
- [ ] Crear SDKs para Python, Go, Rust
- [ ] Documentación OpenAPI/Swagger

---

## 🔗 Referencias

- [REST API Best Practices](https://restfulapi.net/)
- [API Key Management](https://github.com/upstash/ratelimit)
- [TypeScript SDK Design](https://www.npmjs.com/package/@octokit/rest)
