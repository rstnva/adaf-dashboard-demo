# Tests faltantes / fallando (bitácora)

Fecha: 2025-10-20
Rama: backup/2025-10-15-docs-structure

## Resumen
- Total identificados: 6 (E2E/integración, requieren servidor en localhost:3005)
- Causa raíz: entorno sin servidor Shadow (LAV-ADAF en 3005) corriendo durante la suite
- Estado: Aceptables para commit; plan de remediación abajo

## Detalle por archivo

1) tests/api/oracle.shadow.test.ts
- Caso: "shadow_rmse presente y live_reads_total > 0"
- Endpoint: GET http://localhost:3005/api/oracle/v1/metrics/wsp
- Error típico: ECONNREFUSED 127.0.0.1:3005
- Acción propuesta:
  - Marcar como @integration y excluir de precommit
  - Alternativa: levantar mock server en setup o usar MSW para interceptar fetch

2) tests/api/oracle.error.test.ts
- Caso: 404 JSON con trace_id en by-id inexistente
- Endpoint: GET http://localhost:3005/api/oracle/v1/feeds/by-id?id=inexistente
- Error típico: ECONNREFUSED 127.0.0.1:3005
- Acción propuesta:
  - @integration o mock server/supertest apuntando a app local embed

3) services/oracle-core/tests/api.oracle.test.ts (4 casos)
- Casos:
  - GET /api/oracle/v1/feeds (>= 30 feeds)
  - GET /api/oracle/v1/feeds/by-id?id=wsp/indices/vix_index (feed)
  - GET /api/oracle/v1/feeds/by-id/latest?id=wsp/indices/vix_index (latest)
  - GET /api/oracle/v1/feeds/by-id?id=inexistente (404 JSON)
- Endpoint base: http://localhost:3005
- Error típico: ECONNREFUSED 127.0.0.1:3005
- Acción propuesta:
  - @integration o montar servidor de prueba en setup (Next.js request handler) y usar supertest local sin red

## Plan de remediación

Opción A — Etiquetar @integration (rápido)
- Añadir anotación o patrón de nombre *.integration.test.ts
- Excluir en precommit/CI rápido: `vitest --exclude "**/*.integration.test.ts"`
- Crear job separado en CI para correr @integration con entorno shadow levantado

Opción B — Mock server (medio)
- Setup de Vitest con MSW o un express app minimal que responda a las rutas esperadas
- Pros: sin levantar servicios extra; reproducible en CI
- Contras: requiere mantener fixtures al día

Opción C — Embedded app (ideal)
- Exponer el handler Next.js en tests (app router) y usar supertest contra el handler (sin puerto)
- Pros: flujo real sin red; alta fidelidad
- Contras: wiring inicial más complejo

## Tareas concretas
- [ ] Crear script npm `test:integration` y separar suites
- [ ] Marcar/renombrar 6 tests a patrón @integration
- [ ] Agregar job CI `integration` con `docker compose --profile shadow up -d`
- [ ] Alternativa: MSW fixtures para `/api/oracle/v1/*`
- [ ] Documentar en `motor-del-dash/sprints/` el cierre de estos tests

## Notas
- Estos tests verifican endpoints de Shadow (3005). Si se activa el perfil shadow local, deberían pasar sin cambios.
- Pretty-path test está skipeado por diseño, requiere middleware en 3000.
