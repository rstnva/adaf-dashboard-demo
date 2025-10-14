<!-- markdownlint-disable MD013 MD024 -->

# 📊 ADAF Dashboard · Runbook de SLOs (v1.0 — 2025-10-14)

Este runbook define los compromisos de servicio (SLO/SLA) para ADAF Dashboard Pro siguiendo los criterios Fortune 500 de disponibilidad, resiliencia y orientación al cliente.

## 1. Tabla de compromisos

| Servicio                 | Métrica Prometheus                                                  | Objetivo (SLO)                           | Error Budget mensual                  |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| APIs core ADAF           | `adaf_api_requests_total` vs `adaf_api_errors_total{status=~"5.."}` | Disponibilidad ≥ **99.5%** (rolling 30d) | 3.6 horas de indisponibilidad         |
| Latencia de APIs         | `adaf_api_request_duration_seconds_bucket`                          | p95 ≤ **250 ms** (ventana 5 min)         | 10% de requests pueden exceder 250 ms |
| Error budget             | `adaf_api_errors_total{status=~"4..\|5.."}`                         | Consumo ≤ **20%** cada 24 h              | >20% dispara alerta Tier-1            |
| Freshness On-chain (TVL) | `adaf_dqp_last_freshness_minutes{source="tvl"}`                     | Reciclaje ≤ **3 min** promedio           | 15 min máximo (alerta crítica)        |

> Las métricas se visualizan en Grafana (`monitoring/grafana/dashboards/adaf-core-slo.json`) y se alimentan desde `/api/metrics`.

## 2. Monitoreo y alertas

- **Grafana**: Dashboard `ADAF Core · SLO Scorecard` con paneles para disponibilidad, latencia, error budget y freshness.
- **Alertmanager** (pendiente): Configurar reglas para `SLOViolation` cuando:
  - Disponibilidad < 99.5% en 30d.
  - p95 latency ≥ 250 ms durante 15 min.
  - Error budget 24 h > 20%.
  - Freshness TVL ≥ 5 min.
- **Canales**: Slack `#adaf-noc`, PagerDuty rota 24/7 (a definir en MEMORIA de operaciones).

## 3. Playbooks de respuesta

| Check                  | Acción inmediata                                                                                                                 | Escalación                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Disponibilidad < 99.5% | Revisar incidentes recientes (`docs/incidentes/`) y health checks. Forzar `./scripts/health-check.mjs --mode=deep --force-real`. | L1: DevOps on-call · L2: Engineering Lead |
| Latencia p95 > 250 ms  | Revisar trazas, volumen y carga. Activar `pnpm health:deep`.                                                                     | L1: Backend → L2: Arquitectura            |
| Error budget > 20%     | Analizar 4xx/5xx por ruta (`adaf_api_errors_total`). Implementar feature flag o rate-limiter.                                    | L1: Plataforma → L2: Producto             |
| Freshness ≥ 5 min      | Verificar ingest (Redis/Prisma), ejecutar `lav-adaf` agents, revisar `/dashboard/dqp`.                                           | L1: Data Ops → L2: Quant Core             |

## 4. Procedimientos operativos

1. **Lectura rápida**: `pnpm health:deep` o `node scripts/health-check.mjs --mode=deep --force-real`.
2. **Métricas**: `curl -s http://localhost:3000/api/metrics` y validar counters `adaf_api_*`, `adaf_dqp_*`.
3. **Dashboard**: Ingresar a Grafana (folder ADAF) → `ADAF Core · SLO Scorecard`.
4. **Regresión**: Consultar `MEMORIA_GITHUB_COPILOT.md` para últimas mitigaciones.
5. **Post-mortem**: Documentar en `docs/incidentes/YYYY-MM-DD-slug.md` en menos de 24 h.

## 5. Mejora continua

- Revisar objetivos trimestralmente con Producto y Riesgos.
- Añadir métricas de coste (FinOps) y cobertura móvil en la próxima iteración.
- Automatizar alertas y runbooks en Terraform una vez que los umbrales estén estabilizados.

---

**Responsable:** ADAF Platform Engineering  
**Última actualización:** 2025-10-14  
**Contacto:** `devops@adaf.internal`
