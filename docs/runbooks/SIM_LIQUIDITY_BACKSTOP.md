# Runbook — Liquidity Backstop (Sim)

## 🎯 Propósito
Operar el endpoint `/api/liquidity/backstop`, asegurando que las reservas recomendadas cumplan con los mínimos Fortune 500.

## ✅ Prerrequisitos
- `NEXT_PUBLIC_FF_LIQUIDITY_BACKSTOP_SIM=true`.
- `EXECUTION_MODE` / `NEXT_PUBLIC_EXECUTION_MODE` = `dry-run`.
- Permiso `feature:liquidity-backstop` vigente.

## 📊 Señales de salud clave
- `adaf_liquidity_backstop_reserve_ratio{desk}` — debe permanecer ≥ 1.1x (objetivo Fortune 500).
- Logs: `Liquidity backstop simulation executed` con `topUpUsd` y `desk`.
- Respuesta: `plan.reserveMultiplier` > 0 y `status='simulated'`.

## 🔎 Triage
1. Comprobar flags/mode.
2. Ejecutar prueba rápida:
   ```bash
   curl -s -X POST http://localhost:3000/api/liquidity/backstop \
     -H 'Content-Type: application/json' \
     -d '{"desk":"adaf-mm","currentLiquidityUsd":4000000,"peakOutflowUsd":6500000,"volatilityIndex":38}' | jq '.plan.reserveMultiplier'
   ```
3. Consultar métrica:
   ```bash
   curl -s http://localhost:3000/api/metrics | grep adaf_liquidity_backstop_reserve_ratio
   ```
4. Si la métrica no actualiza, verificar logs y `simResponse`.

## 🛠️ Remediación
- Ajustar `currentLiquidityUsd` o `peakOutflowUsd` si la reserva queda < 1.0x.
- Revisar fórmula en `LiquidityBackstopPlanner.plan` para detectar regresiones.
- Notificar a Risk Ops antes de cambiar parámetros productivos.

## 📄 Evidencia requerida
- Registrar ratio en `observability-notes.md` y p95 en `grafana-slo.png`.
- Actualizar `smoke-logs.txt` con comando y resultado.

## 🚨 Escalación
- SEV2 si la reserva calculada cae < 1.0x por más de 10 minutos.
- Escalar a `@risk-ops` + `@infra-lead`.
