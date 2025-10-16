# ADAF Oracle Core (Mock Mode)

> Fuente de vida (SSOT) para ADAF Dashboard. Este módulo implementa el oráculo de datos en modo demo 100% mock, listo para activar shadow/mixed/live.

## Objetivos

- Centralizar la generación y distribución de señales financieras.
- Proveer SDK unificado, APIs REST/WS, y mecanismos de consenso.
- Sustentarse sobre mocks deterministas con control de calidad y trazabilidad.

## Estructura

```
services/oracle-core/
  ingest/
  digest/
  consensus/
  registry/
  serve/
  lineage/
  storage/
  dq/
  metrics/
  acl/
  mock/
  tests/
```

### Guardrails de datos

- `dq/guardrails.json` define límites por defecto, por categoría y por feed (mínimos, máximos y saltos relativos).
- `dq/guardrails.ts` carga el manifiesto y expone `getGuardrails`, utilizado por el pipeline y las APIs antes de aceptar señales.
- Cualquier ajuste puede hacerse editando el manifiesto sin tocar código; los cambios se recargan en el próximo ciclo de ingestión.
- Handler REST `getGuardrailsManifestHandler` permite consultar (y recargar con `?reload=true`) el manifiesto para paneles de monitoreo; requiere alcance `oracle.reader`.
- Métrica Prometheus `oracle_guardrail_manifest_load_total{mode}` registra cargas `initial` y `reload` para auditar cambios y configurar alertas.

## Modos

| Variable                | Valor | Descripción                  |
|-------------------------|-------|------------------------------|
| `EXECUTION_MODE`        | dry-run | Forzar operaciones simuladas |
| `ORACLE_SOURCE_MODE`    | mock  | Catálogos y publicaciones mock|

Para shadow/mixed/live agregaremos los conectores reales y toggles correspondientes.
