# Runbook — Vaults LAV (Sim)

## 🎯 Propósito
Asegurar que `/api/vaults/lav` responda con métricas y latencias controladas para los escenarios de financiamiento cuantitativo.

## ✅ Prerrequisitos
- `NEXT_PUBLIC_FF_VAULTS_LAV_SIM=true`.
- Ejecución en modo `dry-run` (ambos `EXECUTION_MODE` y `NEXT_PUBLIC_EXECUTION_MODE`).
- RBAC: permiso `feature:vaults-lav` activo.

## 📊 Señales de salud clave
- `adaf_vaults_sim_latency_seconds{liquidity_band}` — p95 < 900ms (liquidity_band=`weekly`) y < 600ms (`daily`).
- Logs: `Vaults LAV simulation executed` con `liquidityBand` esperado.
- Salida JSON: `result.projectedReturnBps` debe ser > 0.

## 🔎 Triage
1. Confirmar flags y modo:
   ```bash
   grep NEXT_PUBLIC_FF_VAULTS_LAV_SIM .env.local
   grep EXECUTION_MODE .env.local
   ```
2. Solicitar simulación con payload mínimo:
   ```bash
   curl -s -X POST http://localhost:3000/api/vaults/lav \
     -H 'Content-Type: application/json' \
     -d '{"tenorDays":30}' | jq '.result.status'
   ```
3. Consultar métrica de latencia:
   ```bash
   curl -s http://localhost:3000/api/metrics | grep adaf_vaults_sim_latency_seconds
   ```
4. Si no hay métricas, revisar logs y `simResponse` para ver `correlationId`.

## 🛠️ Remediación
- Ajustar `riskProfile.liquidityBand` o `tenorDays` si la latencia rebasa p95 objetivo.
- Revisar `LavVaultSimulator` para límites de `stressLossBps`; garantizar valores no negativos.
- Reiniciar servidor (`pnpm dev`) si los contadores no se registran tras cambios.

## 📄 Evidencia requerida
- Registrar resultado en `evidence/v1.5/coverage-summary.md` indicando p95 reportado.
- Anexar `curl` utilizado en `smoke-logs.txt`.
- Documentar ajustes en `observability-notes.md`.

## 🚨 Escalación
- SEV2 si la API responde 5xx > 5 minutos o si `stressLossBps` retorna `null`/`NaN`.
- Escalar a `@infra-lead` y `@treasury-lead`.
