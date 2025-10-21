# Runbook — Alpha Factory (Sim)

## 🎯 Propósito
Dar soporte operativo al endpoint `/api/alpha/factory`, asegurando calidad de señales y monitoreo conforme a estándares Fortune 500.

## ✅ Prerrequisitos
- `NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM=true`.
- Modos de ejecución en `dry-run`.
- Permiso `feature:alpha-factory` otorgado.

## 📊 Señales de salud clave
- Métrica `adaf_alpha_factory_signal_total{strategy}` — incremento por estrategia (`momentum`/`mean-reversion`).
- Logs: `Alpha factory simulation executed` con `signalCount` > 0.
- Respuesta JSON: `signals[].conviction` dentro de [0.4, 1.0].

## 🔎 Triage
1. Validar flag/mode:
   ```bash
   grep NEXT_PUBLIC_FF_ALPHA_FACTORY_SIM .env.local
   ```
2. Ejecutar simulación con universo custom:
   ```bash
   curl -s -X POST http://localhost:3000/api/alpha/factory \
     -H 'Content-Type: application/json' \
     -d '{"universe":["btc","eth","sol"]}' | jq '.signals | length'
   ```
3. Confirmar métricas Prometheus:
   ```bash
   curl -s http://localhost:3000/api/metrics | grep adaf_alpha_factory_signal_total
   ```
4. Si no hay señales, revisar `AlphaFactory.generateSignals` y `RBACProvider`.

## 🛠️ Remediación
- Añadir activos al universo (máx 5) para validar pipelines.
- Ajustar tags estratégicas si sólo aparece `unknown`; actualizar `AlphaFactory`.
- Documentar cualquier cambio en la bitácora (`MEMORIA_GITHUB_COPILOT.md`).

## 📄 Evidencia requerida
- Guardar sample de respuesta (sin datos sensibles) en `evidence/v1.5/smoke-logs.txt`.
- Registrar cuentas por estrategia en `observability-notes.md`.

## 🚨 Escalación
- SEV3 si el endpoint devuelve 200 pero `signals.length = 0` durante > 15 minutos.
- Escalar a `@quant-lead` y `@infra-lead` con `correlationId` del header.
