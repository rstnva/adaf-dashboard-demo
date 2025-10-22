# ACTION PLAN — ADAF/LAV Audit (v2025-10-21)

This plan closes the gaps detected in audit_report.json and hardens Shadow Mode v1.1. All items follow Fortune 500 principles: excellence, measurable outcomes, and risk-managed rollout.

## 0) Success criteria
- Build & Lint: PASS on CI (ESLint zero errors).  
- Tests: >= 1017 unit pass; integration isolated; no flakiness.  
- Shadow: /api/metrics/wsp exposes oracle_shadow_rmse>0 and vox_vpi>0 within 5m after boot.  
- Readiness: /api/oracle/v1/readiness returns 200 when core dependencies OK.  

## 1) Vox REST endpoints (MISSING)
- Implement GET /api/oracle/v1/vox/top-movers
  - Input: query window ["1h","24h","7d"] (default: 24h)  
  - Output: [{ feedId, value:number, unit:"score", confidence:0..1, stale:boolean, quorum_ok:boolean, ts:ISO }]  
  - Source: placeholder: compute from vox metrics provider or return mock if VOX_TOP_MOVERS_MOCK=true.  
- Wire hooks/UI: ensure useOracleVox.ts and Vox War Room components read real data.  
- Tests: add unit for params validation + integration with mock flag.  

## 2) Oracle readiness alias (INCOMPLETE)
- Add alias route: GET /api/oracle/v1/readiness → proxies to /api/healthz?probe=ready&deep=true  
- Return JSON {ready:boolean, details:{...}}  
- Update runbooks and tests to hit the alias.  

## 3) Integration tests separation (INCOMPLETE)
- Tag 6 tests as @integration and move to tests/integration/**.  
- Add package.json scripts:  
  - test:unit → vitest --run --exclude tests/integration/**  
  - test:integration → (1) start shadow profile (2) run vitest only on integration (3) teardown.  
- CI: add a distinct job matrix that boots shadow services (compose/sh script) and exports metrics endpoint for checks.  

## 4) Shadow compose profile & health gates (HARDEN)
- Verify docker-compose.dev.yml/prod has a shadow profile or override for port 3005; add if missing.  
- Ensure scripts/shadow/health-check.(sh|mjs) run in CI smoke before integration tests.  

## 5) Observability polish
- Dashboards: Include vox_vpi panels and oracle_shadow_rmse p95.  
- Alerts: Ensure oracle_shadow_rmse and oracle_quorum_fail_total rules are enabled in non-prod.  

## 6) Docs and Runbooks
- Update VOX_POPULI_V1_1_DOD_CHECKLIST.md with route status and curl examples.  
- Add READINESS_RUNBOOK.md with failure modes (Redis, RPC lag, provider 429) and troubleshooting.  

## 7) Ownership & Risk
- CODEOWNERS: add maintainers for `/src/app/api/oracle/v1/vox/**` and `/services/oracle-core/**`.  
- Feature flags: VOX_TOP_MOVERS_MOCK (bool), ORACLE_SOURCE_MODE=shadow/live.  

## Timeline (aggressive)
- Day 0-1: Items 1-2.  
- Day 2: Item 3.  
- Day 3: Items 4-5.  
- Day 4: Item 6 + review.  

## Deliverables checklist
- [ ] src/app/api/oracle/v1/vox/top-movers/route.ts  
- [ ] src/app/api/oracle/v1/readiness/route.ts  
- [ ] package.json test scripts updated  
- [ ] CI job: integration tests with shadow  
- [ ] Runbooks updated  
