# Feature Store - Tests Pendientes

**Fecha**: 2025-10-20  
**Estado**: Testing postponed - Type compatibility issues detected  
**Prioridad**: HIGH (debe completarse antes de Phase 4)

---

## 📋 Resumen Ejecutivo

Durante el desarrollo de Phase 2 (Ingestion + DQ + Metrics), se detectaron **incompatibilidades de tipos** entre las implementaciones reales y los tests iniciales creados. Siguiendo principios Fortune 500, **no es aceptable tener tests que no correspondan al código real**, ya que generan falsa confianza y pueden enmascarar bugs reales.

**Decisión**: Postponer testing comprehensivo hasta completar Phase 3 (APIs & SDK), momento en el cual se tendrá:

1. ✅ Implementaciones completas y estables
2. ✅ Firmas de funciones finalizadas
3. ✅ Tipos de datos consolidados
4. ✅ Fixtures y mocks reutilizables

---

## 🔍 Problemas Detectados

### 1. **Type Mismatches - Schema/Types**

**Problema**: Tests asumían tipos simplificados que no coinciden con las definiciones reales.

**Ejemplo**:

```typescript
// Test asumió (incorrecto):
const mockSpec: FeatureSpec = {
  id: 'test-feature',
  source: 'mock', // ❌ String simple
  frequency: '1m',
  // ...
};

// Tipo real (correcto):
export interface FeatureSpec {
  id: string;
  source: {
    id: string;
    class: SourceClass; // 'onchain' | 'cex' | 'macro' | 'derived'
    schema: string;
  };
  // ...
}
```

**Impacto**: 41 errores de compilación en `transform.normalize.test.ts`

---

### 2. **Function Signature Mismatches - DQ Rules**

**Problema**: Tests llamaban funciones con firmas incorrectas.

**Ejemplo**:

```typescript
// Test intentó (incorrecto):
const result = checkCoverage(points, mockSpec);
// ❌ checkCoverage espera (featureId: string, spec: FeatureSpec, minCoverage?: number)

// Firma real:
export async function checkCoverage(
  featureId: string,
  spec: FeatureSpec,
  minCoverage: number = 0.8
): Promise<DQCheckResult>;
```

**Impacto**: 52 tests fallidos, 5 unhandled errors

---

### 3. **Missing Exports - Circuit Breaker Functions**

**Problema**: Tests intentaron importar funciones no exportadas.

**Ejemplo**:

```typescript
// Test intentó importar:
import {
  checkCircuitBreaker,
  recordFailure,
  recordSuccess,
  resetCircuitBreaker,
} from '../ingest/loaders';
// ❌ Estas funciones NO están exportadas
```

**Impacto**: TypeError - "recordFailure is not a function"

---

### 4. **FeaturePoint Structure Complexity**

**Problema**: Tests crearon FeaturePoints con estructura simplificada.

**Ejemplo**:

```typescript
// Test creó (incorrecto):
const point: FeaturePoint = {
  ts: '2025-10-20T12:00:00Z',
  value: 100,
  metadata: { source: 'test' }, // ❌ metadata no existe en FeaturePoint
};

// Tipo real:
export interface FeaturePoint {
  ts: string;
  value: number;
  featureId: string;
  stale: boolean;
  confidence: number;
  meta?: Record<string, any>; // Propiedad correcta es "meta", no "metadata"
  evidence?: EvidenceRef[];
}
```

**Impacto**: 72 errores de compilación en `dq.rules.test.ts`

---

## 📝 Tests Pendientes por Módulo

### **Phase 2 - Ingestion**

#### `ingest/loaders.ts` (280 lines)

- [ ] `loadFeature()` - Happy path con mock data
- [ ] `loadFeature()` - Error handling (missing spec, missing source)
- [ ] `batchLoadFeatures()` - Multiple features con delays
- [ ] `batchLoadFeatures()` - Partial failures (algunos pasan, otros fallan)
- [ ] Circuit breaker - Open after N failures
- [ ] Circuit breaker - Half-open transition after timeout
- [ ] Circuit breaker - Reset on success
- [ ] Rate limiting - Per-source RPM tracking
- [ ] Rate limiting - Adaptive delay calculation
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ❌ Funciones de circuit breaker no exportadas
- ❌ LoadResult type debe ajustarse

---

#### `ingest/backfill.ts` (240 lines)

- [ ] `backfillFeature()` - Deterministic day-by-day load
- [ ] `backfillFeature()` - Progress tracking (totalDays, completedDays, ETA)
- [ ] `backfillFeature()` - Resume after interruption
- [ ] `backfillFeature()` - Validation after completion
- [ ] `batchBackfill()` - Multiple features en paralelo
- [ ] `batchBackfill()` - Error handling (algunos fallan)
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ⚠️ Depende de `loadFeature()` (debe ser testeado primero)
- ⚠️ Requiere mock de storage layer

---

#### `ingest/replay.ts` (250 lines)

- [ ] `startReplay()` - Time-warp at 1.0x speed
- [ ] `startReplay()` - Time-warp at 10x speed
- [ ] `pauseReplay()` / `resumeReplay()` - Playback controls
- [ ] `stopReplay()` - Cleanup
- [ ] Callbacks - onPoint triggered per data point
- [ ] Callbacks - onComplete triggered on finish
- [ ] Background execution - setInterval mechanics
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ⚠️ Requiere mock de timers (vi.useFakeTimers)

---

### **Phase 2 - Transforms**

#### `transform/normalize.ts` (300 lines)

- [ ] `normalizeFeaturePoint()` - Timezone (America/Mexico_City)
- [ ] `normalizeFeaturePoint()` - Unit conversion (USD, BTC, ratio, bps, gwei, TH/s)
- [ ] `normalizeFeaturePoint()` - Null/NaN handling
- [ ] `normalizeFeaturePoint()` - Outlier capping (±3σ)
- [ ] `resampleFeaturePoints()` - Downsample (1m → 5m)
- [ ] `resampleFeaturePoints()` - Upsample (5m → 1m)
- [ ] `fillMissingPoints()` - Forward-fill gaps
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ❌ NormalizationResult type debe ajustarse
- ❌ FeaturePoint requiere todas las propiedades (featureId, stale, confidence)

---

#### `transform/joins.ts` (290 lines)

- [ ] `joinFeatures()` - Time-aligned join con operaciones (add, subtract, multiply, divide, ratio)
- [ ] `joinFeatures()` - Manejo de timestamps desalineados
- [ ] `rollingCorrelation()` - Pearson correlation con ventana deslizante
- [ ] `calculateZScore()` - Normalización con capping ±3
- [ ] `calculateEMA()` - Exponential moving average (α=0.2)
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ⚠️ Requiere fixtures de FeaturePoint arrays con timestamps alineados

---

#### `transform/seasonal.ts` (330 lines)

- [ ] `detectSeasonality()` - MA decomposition (trend, seasonal, residual)
- [ ] `detectDayOfWeekEffect()` - Weekday vs weekend patterns
- [ ] `detectHourOfDayEffect()` - Intraday hourly patterns
- [ ] `seasonalAdjust()` - Remove seasonal component
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ⚠️ Requiere datos históricos mock con patrones estacionales

---

### **Phase 2 - Data Quality**

#### `dq/rules.ts` (380 lines)

- [ ] `checkCoverage()` - Pass con ≥80% coverage
- [ ] `checkCoverage()` - Fail con <80% coverage
- [ ] `checkFreshness()` - Pass cuando data es fresh (<TTL)
- [ ] `checkFreshness()` - Fail cuando data es stale (>1.5x TTL)
- [ ] `checkRange()` - Pass cuando valores in range
- [ ] `checkRange()` - Fail cuando valores out of range
- [ ] `checkOutliers()` - Detect outliers con z-score >3.0
- [ ] `runAllDQChecks()` - Aggregate results de todos los checks
- [ ] `getDQSummary()` - Summary statistics (pass rate, violations by severity)
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ❌ Funciones son `async` pero tests las llamaron como síncronas
- ❌ Dependen de `getFeatureStats()` de storage layer (requiere mock)

---

#### `dq/coverage.ts` (270 lines)

- [ ] `calculateCoverage()` - Full report con gaps, largest gap, summary
- [ ] `findGaps()` - Detect missing data periods (tolerance: 1.5x interval)
- [ ] `calculateWindowCoverage()` - SLA monitoring over time windows
- [ ] `calculateUptime()` - Percentage de tiempo con data availability
- [ ] `getCoverageTrend()` - Recent vs historical coverage comparison
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ⚠️ Requiere FeaturePoint arrays con gaps deliberados

---

### **Phase 2 - Metrics**

#### `metrics/feature.metrics.ts` (310 lines)

- [ ] MockCounter - increment() functionality
- [ ] MockGauge - set(), inc(), dec() functionality
- [ ] MockHistogram - observe() functionality
- [ ] Helper functions - recordIngestion(), recordFreshness(), recordCoverage()
- [ ] Helper functions - recordDQViolation(), clearDQViolation()
- [ ] Helper functions - recordStorageSize(), recordQuery(), recordApiRequest()
- [ ] **Coverage target**: ≥75%

**Bloqueadores**:

- ✅ Ninguno - Mock implementations puras (no external dependencies)

---

## 🎯 Estrategia de Testing - Phase 3+

### **Cuando implementar tests comprehensivos**

✅ **Después de Phase 3 (APIs & SDK)** porque:

1. Todas las firmas de funciones estarán finalizadas
2. Los tipos estarán consolidados (no más cambios)
3. Se tendrán fixtures reutilizables desde las APIs
4. Se podrán hacer tests de integración (API + Storage + DQ)

### **Preparación requerida**

1. **Crear fixtures centralizados**

   ```typescript
   // services/feature-store/__fixtures__/index.ts
   export const mockFeatureSpec: FeatureSpec = {
     /* ... */
   };
   export const mockFeaturePoints: FeaturePoint[] = [
     /* ... */
   ];
   export const mockDQViolation: DQViolation = {
     /* ... */
   };
   ```

2. **Setup de mocks globales**

   ```typescript
   // services/feature-store/__mocks__/storage.ts
   export const mockPgClient = {
     /* ... */
   };
   export const mockS3Client = {
     /* ... */
   };
   ```

3. **Helper utilities**
   ```typescript
   // services/feature-store/__tests__/helpers.ts
   export function createMockFeaturePoint(
     overrides?: Partial<FeaturePoint>
   ): FeaturePoint;
   export function createMockFeatureSpec(
     overrides?: Partial<FeatureSpec>
   ): FeatureSpec;
   ```

---

## 📊 Coverage Targets Fortune 500

| Layer              | Target Coverage | Critical Paths                                    |
| ------------------ | --------------- | ------------------------------------------------- |
| **Ingestion**      | ≥75%            | Circuit breaker, rate limiting, error recovery    |
| **Transforms**     | ≥75%            | Normalization, resampling, gap filling            |
| **DQ**             | ≥80%            | All checks (coverage, freshness, range, outliers) |
| **Metrics**        | ≥70%            | Helper functions, metric recording                |
| **APIs** (Phase 3) | ≥85%            | All endpoints, error responses, validation        |
| **E2E**            | ≥90%            | Happy paths, critical user flows                  |

---

## 🚀 Plan de Acción

### **Immediate (Post-Phase 3)**

1. [ ] Crear estructura de fixtures en `__fixtures__/`
2. [ ] Implementar helpers en `__tests__/helpers.ts`
3. [ ] Setup mocks en `__mocks__/`
4. [ ] Escribir tests unitarios para metrics (más simple, sin deps)

### **Short-term (Durante Phase 3)**

5. [ ] Escribir tests de integración para APIs REST
6. [ ] Tests de validación (Zod schemas)
7. [ ] Tests de error handling (4xx, 5xx responses)

### **Mid-term (Post-Phase 4)**

8. [ ] Tests unitarios completos para DQ layer
9. [ ] Tests unitarios completos para Transforms
10. [ ] Tests unitarios completos para Ingestion

### **Long-term (Pre-Production)**

11. [ ] Tests E2E con Playwright (user flows completos)
12. [ ] Performance tests (load testing para APIs)
13. [ ] Security tests (auth, rate limiting, input validation)

---

## 📚 Referencias

- **Sprint Plan**: `motor-del-dash/sprints/SPRINT_FEATURE_STORE_LAV_PLUS_2025-10-20.md`
- **Architecture Doc**: `services/feature-store/README.md`
- **Type Definitions**: `services/feature-store/schema/types.ts`
- **Zod Schemas**: `services/feature-store/schema/zod.ts`

---

## ✅ Principios Fortune 500 Aplicados

1. **✅ No tests incorrectos**: Mejor no tener tests que tests que no correspondan al código
2. **✅ Documentation-first**: Documentar el gap antes de avanzar
3. **✅ Systematic approach**: Testing después de estabilización de APIs
4. **✅ Quality over speed**: No sacrificar calidad por velocidad
5. **✅ Audit trail**: Este documento sirve como evidencia de decisión técnica

---

**Status**: 🟡 **ACKNOWLEDGED - Postponed until Phase 3**  
**Next Review**: After Phase 3 APIs & SDK completion  
**Owner**: Development Team  
**Stakeholders**: Tech Lead, QA Lead

---

_Generado: 2025-10-20 | Feature Store Development | ADAF Dashboard Pro_
