# Oracle Core — Consensus & Data Quality Rules

> **Owner:** Quant Research Guild  
> **Last updated:** 2025-10-16  
> **Status:** Production-ready (mock shadow mode)

## Overview
ADAF Oracle Core implements multi-source consensus via **weighted median**, **trimmed mean**, and **k-of-n quorum** mechanisms. Data Quality (DQ) rules quarantine outliers, stale data, and disputed signals before aggregation.

## Consensus Strategies

### 1. Weighted Median
- **Use case:** Robust to outliers when provider reliability varies.
- **Implementation:** `services/oracle-core/consensus/aggregators.ts::weightedMedian`
- **Algorithm:**
  1. Sort samples by value.
  2. Compute total weight `W = Σ weight_i`.
  3. Find the value where cumulative weight ≥ W/2.
- **Example:**
  ```typescript
  const samples = [
    { value: 100, weight: 0.4 },  // Chainlink
    { value: 200, weight: 0.35 }, // Pyth
    { value: 150, weight: 0.25 }  // RedStone
  ];
  // Result: 200 (cumulative weight crosses 50% threshold)
  ```

### 2. Trimmed Mean
- **Use case:** Smooth consensus after removing extreme tails.
- **Implementation:** `services/oracle-core/consensus/aggregators.ts::trimmedMean`
- **Algorithm:**
  1. Sort samples by value.
  2. Remove top/bottom `trimRatio` (default 10%).
  3. Compute weighted average of remaining samples.
- **Example:**
  ```typescript
  const samples = [
    { value: 100, weight: 1 },
    { value: 110, weight: 1 },
    { value: 120, weight: 1 },
    { value: 9999, weight: 1 } // outlier
  ];
  trimmedMean(samples, 0.25);
  // Removes 25% from each end → Mean of [110, 120]
  ```

### 3. K-of-N Quorum
- **Use case:** Require minimum number of eligible sources.
- **Implementation:** `services/oracle-core/consensus/quorum.ts::quorumSatisfied`
- **Configuration:** Per-feed `quorum: { k: 3, n: 5 }` in `feeds.json`.
- **Logic:**
  - Count `eligible` samples (not stale, not outlier, not quarantined).
  - Pass if `count ≥ k` AND `total samples ≥ n`.
- **Example:**
  ```typescript
  const config = { k: 3, n: 5 };
  const eligible = [true, true, true, false, false];
  quorumSatisfied(eligible, config); // ✅ true (3 of 5)
  ```

## Data Quality Rules

### Rule 1: Outlier Detection (>3σ from median)
- **Trigger:** `|value - median| > 3 * stddev`
- **Action:** Mark sample as `quorumEligible = false`; log to DQ quarantine.
- **Implementation:** `services/oracle-core/dq/rules.ts::evaluateSignal`
- **Metric:** `oracle_dq_failures_total{rule="outlier"}`

### Rule 2: Stale Data (age > 2× heartbeat)
- **Trigger:** `now - updatedAt > feed.ttl_ms * 2`
- **Action:** Discard sample; increment `oracle_stale_ratio`.
- **Implementation:** Pipeline latency check in `pipeline.ts::processPipeline`.
- **Metric:** `oracle_stale_ratio`

### Rule 3: Dispute Quarantine (UMA/Chronicle)
- **Trigger:** `metadata.disputed === true`
- **Action:** Quarantine signal; emit webhook alert.
- **Implementation:** `services/oracle-core/dq/quarantine.ts::quarantineSignal`
- **Metric:** `oracle_dq_failures_total{rule="dispute"}`

### Rule 4: Guardrails (min/max bounds)
- **Trigger:** `value < feed.guardrails.min || value > feed.guardrails.max`
- **Action:** Reject signal; return 503 with `quarantine_reason`.
- **Implementation:** `services/oracle-core/dq/guardrails.ts::getGuardrails`
- **Metric:** `oracle_dq_failures_total{rule="guardrail"}`

## Pipeline Flow

```
┌─────────────┐
│ Adapter     │ (Chainlink, Pyth, RedStone, Band, Chronicle)
│ Ingest      │
└──────┬──────┘
       │ RawSample[]
       ↓
┌─────────────┐
│ Normalize   │ (unit conversion, confidence adjustment)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ DQ Rules    │ (outlier, stale, dispute, guardrails)
└──────┬──────┘
       │ eligible samples
       ↓
┌─────────────┐
│ Quorum      │ (check k-of-n)
└──────┬──────┘
       │ ✅/❌
       ↓
┌─────────────┐
│ Consensus   │ (weightedMedian or trimmedMean)
└──────┬──────┘
       │ final Signal
       ↓
┌─────────────┐
│ Store & WS  │ (Postgres, Redis, TSDB, publish to subscribers)
└─────────────┘
```

## Configuration

### Feed-level overrides (example)
```json
{
  "id": "price/btc_usd.live",
  "consensus": {
    "strategy": "weightedMedian",
    "trimRatio": 0.1
  },
  "quorum": {
    "k": 3,
    "n": 5
  },
  "guardrails": {
    "min": 10000,
    "max": 100000
  },
  "ttl_ms": 30000
}
```

### Provider weights (example)
```typescript
const samples: RawSample[] = [
  { provider: 'chainlink', weight: 0.4, ... },
  { provider: 'pyth', weight: 0.35, ... },
  { provider: 'redstone', weight: 0.25, ... }
];
```

## Testing
- **Unit tests:** `services/oracle-core/tests/unit/consensus/*.test.ts`
- **Integration:** `tests/oracle.consensus.e2e.test.ts` (pending)
- **Coverage target:** >95% for aggregators, quorum, and DQ rules.

## Observability
- **Metrics:**
  - `oracle_consensus_latency_seconds`: Time to compute final value.
  - `oracle_quorum_fail_total`: Count of quorum failures.
  - `oracle_dq_failures_total{rule}`: DQ rule violations by type.
  - `oracle_stale_ratio`: Fraction of stale samples.
  - `oracle_shadow_rmse`: RMSE vs reference (shadow mode).
- **Logs:**
  - Quarantine events with `signalId`, `rule`, `z_score`, `dispute_flag`.
  - Quorum failures with `feedId`, `k`, `n`, `eligible_count`.

## Incident Response
1. **Quorum fail:** Check RPC health, adapter logs, network latency.
2. **Outlier spike:** Review `oracle_dq_failures_total{rule="outlier"}` dashboard; inspect disputed sources.
3. **Stale data:** Verify heartbeat config, RPC circuit breaker status.
4. **Guardrail breach:** Validate feed min/max bounds; alert on-call if persistent.

## Rollout Checklist
- [ ] All 5 adapters passing smoke tests.
- [ ] Consensus suite >95% coverage.
- [ ] DQ metrics exported to Prometheus.
- [ ] Grafana dashboard rendering.
- [ ] Runbook reviewed by Quant Research Guild.
- [ ] Shadow mode active with RMSE <5% for 7 days.

---
**Next:** See `ORACLE_ROLLOUT.md` for mixed/live flip process.
