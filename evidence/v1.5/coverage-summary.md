# Resumen de Cobertura — Sprint 5

- **Fecha:** 2025-10-16
- **Commit:** 6f8334b
- **Responsable:** GitHub Copilot (asistente)
- **Comando ejecutado:** `pnpm test --coverage`

## Métricas globales

| Métrica | Valor |
| --- | --- |
| Cobertura de sentencias | 93.18% |
| Cobertura de ramas | 81.43% |
| Cobertura de funciones | 87.80% |
| Cobertura de líneas | 93.18% |

## Observaciones

- Las suites abarcaron ADAF, LAV y backups en modo Fortune 500 mock (Vitest).
- El mock de Redis fue ajustado para exponer `MockRedis` vía `globalThis` y permitir la inicialización de los clientes cacheados durante las pruebas de ingestión TVL.
- Cobertura inferior al 80% únicamente en `lib/wsp/norm/store.ts`; se mantiene backlog para pruebas adicionales en esa área.
