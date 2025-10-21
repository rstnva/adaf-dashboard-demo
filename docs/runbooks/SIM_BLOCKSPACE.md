# Runbook — Blockspace Builder (Sim)

## 🎯 Propósito
Responder incidentes o validaciones para el módulo `/api/blockspace/builder`, garantizando tiempos de respuesta Fortune 500 y cobertura de métricas.

## ✅ Prerrequisitos
- Feature flag `NEXT_PUBLIC_FF_BLOCKSPACE_SIM=true` en `.env.local` y compartido en `.env.ci`.
- `EXECUTION_MODE` y `NEXT_PUBLIC_EXECUTION_MODE` set en `dry-run` salvo aprobaciones formales.
- Permiso `feature:blockspace` concedido vía RBAC (`RBACProvider`).

## 📊 Señales de salud clave
- Métrica `adaf_blockspace_request_total{decision, mev_protection}` — volumen y aceptaciones.
- Métrica `adaf_blockspace_latency_seconds{mev_protection}` — p95 < 250ms.
- Logs: `Blockspace builder simulation executed` (INFO) y `simSuccess` headers `X-Sim-Module=blockspace-builder`.

## 🔎 Triage
1. Confirmar flags activos: `grep NEXT_PUBLIC_FF_BLOCKSPACE_SIM .env.local`.
2. Revisar métricas:
   ```bash
   curl -s http://localhost:3000/api/metrics | grep adaf_blockspace
   ```
3. Validar simulación happy path:
   ```bash
   curl -s -X POST http://localhost:3000/api/blockspace/builder | jq '.result.accepted'
   ```
4. Si la métrica no incrementa, revisar `simResponse.recordApiHit` y capturar `correlationId` de headers.

## 🛠️ Remediación
- Ajustar flag `NEXT_PUBLIC_FF_BLOCKSPACE_SIM` según bitácora.
- Corregir payloads: usar preferencia `mevProtection=false` si latencia promedio > 500ms.
- Si `mevProtection=true` produce rechazos recurrentes, escalar a Strategy Desk.

## 📄 Evidencia requerida
- Actualizar `evidence/v1.5/coverage-summary.md` con resultado de pruebas.
- Adjuntar `smoke-logs.txt` con `curl` de validación (incluye `correlationId`).
- Documentar métricas p95 en `observability-notes.md`.

## 🚨 Escalación
- SEV2 si el endpoint responde 5xx ≥ 5 min o la métrica de latencia supera p95 0.5s.
- Escalar a `@infra-lead` y `@strategy-lead` con datos de correlación.
