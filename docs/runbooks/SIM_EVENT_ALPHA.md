# Runbook — Event Alpha (Sim)

## 🎯 Propósito
Gestionar el endpoint `/api/events/alpha`, manteniendo seguimiento puntual de catalizadores y severidades.

## ✅ Prerrequisitos
- `NEXT_PUBLIC_FF_EVENT_ALPHA_SIM=true`.
- Modo de ejecución `dry-run`.
- Permiso `feature:event-alpha` asignado.

## 📊 Señales de salud clave
- `adaf_event_alpha_alert_total{severity}` — verifica incrementos por `high`, `medium`, `low`.
- Logs: `Event alpha simulation executed` con `catalystCount` esperado.
- Respuesta: cada `score` debe ser > 0 y `ttlMinutes` > 0.

## 🔎 Triage
1. Verificar flags/permisos.
2. Correr simulación controlada:
   ```bash
   curl -s -X POST http://localhost:3000/api/events/alpha \
     -H 'Content-Type: application/json' \
     -d '{"catalysts":[{"id":"macro-cpi","category":"macro","severity":"high","timeToEventHours":24,"affectedAssets":["btc"]}]}' | jq '.scores[0].score'
   ```
3. Revisar métricas:
   ```bash
   curl -s http://localhost:3000/api/metrics | grep adaf_event_alpha_alert_total
   ```
4. Si las métricas no suben, inspeccionar logs y `simResponse` para errores 4xx/5xx.

## 🛠️ Remediación
- Validar payload de catalizadores (usar severities válidas: `low|medium|high`).
- Ajustar `timeToEventHours` si `score` resulta 0.
- En caso de errores de permiso, actualizar RBAC y reintentar.

## 📄 Evidencia requerida
- Documentar pruebas en `evidence/v1.5/smoke-logs.txt`.
- Registrar distribución de severidades en `observability-notes.md`.

## 🚨 Escalación
- SEV3 si no se generan alertas `high` para catalizadores críticos.
- Escalar a `@macro-lead` + `@infra-lead` para análisis de severidad.
