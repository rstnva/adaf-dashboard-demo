---

## VOX POPULI v1.1 — Plan de integración

- Se acepta y ejecuta el blueprint VOX POPULI v1.1 (ver `.github/ISSUE_VOX_POPULI_V1_1.md`).
- Todas las tareas, decisiones y PRs atómicos seguirán ese plan.
- Guardrails activos: EXECUTION_MODE=dry-run, ORACLE_SOURCE_MODE=mock/shadow, NO mixed/live.
- Cada decisión estructural será documentada aquí y en los PRs.

---

## Vox Populi v1 (mock/shadow)

- Estructura creada en `services/oracle-core/ingest/vox/`, `digest/vox/`, `consensus/vox/`.
- Adapters mock para X, Reddit, providers institucionales (Santiment, etc).
- Feeds mock agregados en `feeds.mock.json` y `feeds.vox.json`.
- Fixtures de señales en `mock/fixtures/vox/`.
- Panel y métricas listos para integración en Command Center.
- Roadmap: shadow providers → direct API → topic modeling/narrativas.
