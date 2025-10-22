# Observabilidad — Métricas Sprint 5

_Pendiente de documentar._ Usa esta plantilla como guía al instrumentar y verificar métricas.

## Métricas objetivo
- `adaf_blockspace_request_total` — Contador de requests simuladas por módulo Blockspace. **Instrumentado 2025-10-15**.
- `adaf_vaults_sim_latency_seconds` — Histograma de latencia (p95/p99) en escenarios Vaults LAV. **Instrumentado 2025-10-15**.
- `adaf_alpha_factory_signal_total` — Contador de señales generadas por la Alpha Factory. **Instrumentado 2025-10-15**.
- `adaf_event_alpha_alert_total` — Contador de alertas clasificadas por severidad. **Instrumentado 2025-10-15**.
- `adaf_liquidity_backstop_reserve_ratio` — Gauge con relación reservas/compromisos. **Instrumentado 2025-10-15**.

## Dashboards asociados
- `grafana-slo.png` — SLO agregado de simulación.
- `grafana-dashboard.json` — Export editable del tablero Fortune 500.

## Umbrales recomendados
- Blockspace p95 < 1.2s.
- Vaults LAV p95 < 900ms.
- Alertas Event Alpha: ratio críticos < 5%.
- Liquidity Backstop: ratio mínimo 1.1x.

Documenta variaciones relevantes y adjunta quién aprobó los dashboards.
