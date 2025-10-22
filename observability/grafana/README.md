# Grafana Observability — Import/Export & Variables

**Objetivo:** cerrar el loop de observabilidad para ADAF ORACLE CORE + Vox v1.1. Este README explica cómo **importar/exportar** dashboards, configurar **variables** y **automatizar** la provisión.

## 1) Prerrequisitos

- Grafana ≥ 9.x (ideal 10.x)
- Fuente de datos **Prometheus** accesible desde Grafana
- Dashboards versionados en el repo:
  - `observability/grafana/dashboards/oracle_freshness.json`
  - `observability/grafana/dashboards/vox_populi.json`

## 2) Variables recomendadas (templating)

Configura estas variables en cada dashboard (o crea un _dashboard variable template_):

- **`env`** (tipo _Query_):
  - Query: `label_values(oracle_stale_ratio, env)`
  - _Multi-value_: ON, _Include All_: ON

- **`feed`** (tipo _Query_):
  - Query: `label_values(oracle_shadow_rmse, feed)`
  - _Regex opcional_ para filtrar `price/.*`

- **`asset`** (tipo _Query_):
  - Query: `label_values(vox_vpi, asset)`

- **`source`** (tipo _Query_):
  - Query: `label_values(oracle_live_reads_total, source)`

- **`datasource`** (tipo _Datasource_):
  - Seleccionar **Prometheus** por defecto (o variable `${DS_PROMETHEUS}` si usas múltiples)

> Si tus métricas no tienen label `env`, ajusta a tu esquema (p.ej. `cluster`, `namespace`).

## 3) Importar dashboards (UI)

1. Grafana → **Dashboards → New → Import**
2. **Upload JSON** y elige el datasource Prometheus
3. Guarda en la carpeta **"Oracle LAV"** (o crea una nueva)

## 4) Importar dashboards (API)

Define variables de entorno:

```bash
export GRAFANA_URL="https://grafana.example.com"
export GRAFANA_API_KEY="grafana_api_key_with_admin_or_editor"
export FOLDER_UID="oracle-lav"
```

Crea la carpeta (si no existe):

```bash
curl -sS -H "Authorization: Bearer $GRAFANA_API_KEY" \
     -H 'Content-Type: application/json' \
     -X POST "$GRAFANA_URL/api/folders" \
     -d '{"uid":"'"$FOLDER_UID"'","title":"Oracle LAV"}' || true
```

Importa ambos dashboards:

```bash
for f in observability/grafana/dashboards/*.json; do
  payload=$(jq -c \
    --argfile d "$f" \
    --arg folder "$FOLDER_UID" \
    '{dashboard: $d, folderUid: $folder, overwrite: true}');
  curl -sS -H "Authorization: Bearer $GRAFANA_API_KEY" \
       -H 'Content-Type: application/json' \
       -X POST "$GRAFANA_URL/api/dashboards/db" -d "$payload";
done
```

## 5) Provisioning (auto-carga al iniciar Grafana)

Añade un archivo de _provisioning_ para dashboards:

```
observability/grafana/provisioning/dashboards.yml
```

Contenido sugerido:

```yaml
apiVersion: 1
datasources: []
providers:
  - name: 'Oracle LAV'
    folder: 'Oracle LAV'
    type: file
    disableDeletion: false
    editable: true
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards/oracle-lav
```

Mapea el volumen de dashboards en tu `docker-compose` de Grafana:

```yaml
services:
  grafana:
    volumes:
      - ./observability/grafana/dashboards:/var/lib/grafana/dashboards/oracle-lav:ro
      - ./observability/grafana/provisioning:/etc/grafana/provisioning
```

## 6) Queries de ejemplo (para paneles existentes)

- **Shadow RMSE p95 (price/\*):**

  ```promql
  histogram_quantile(0.95, sum(rate(oracle_shadow_rmse_bucket[15m])) by (le, feed))
  ```

- **Quorum fails 24h:**

  ```promql
  sum(increase(oracle_quorum_fail_total[24h]))
  ```

- **Stale Ratio actual (promedio global):**

  ```promql
  avg(oracle_stale_ratio)
  ```

- **VPI por activos top:**

  ```promql
  vox_vpi{asset=~"btc|eth|sol|arb|op"}
  ```

- **Brigading (acumulado 24h):**

  ```promql
  increase(vox_brigading_suspected_total[24h])
  ```

- **Llamadas a proveedores (última hora):**

  ```promql
  sum by (provider)(increase(vox_provider_calls_total[1h]))
  ```

## 7) Exportar dashboards (backup al repo)

- Desde la UI: **Share → Export → Save to file (JSON)** y reemplaza el archivo en `observability/grafana/dashboards/`.
- Vía API (si conoces el UID):

  ```bash
  curl -sS -H "Authorization: Bearer $GRAFANA_API_KEY" \
       "$GRAFANA_URL/api/dashboards/uid/<UID>" | \
       jq '.dashboard' > observability/grafana/dashboards/exported.json
  ```

## 8) Troubleshooting

- **Panel vacío**: valida datasource y que las métricas aparecen en `/api/metrics/wsp`.
- **Variables sin valores**: confirma labels (`env`, `feed`, `asset`, `provider`). Ajusta queries de `label_values()`.
- **Permisos API**: usa token con rol **Admin**/**Editor** para importar.
- **Provisioning no carga**: revisa rutas y logs de Grafana; confirma que el `path` mapea a los JSON.

## 9) Automatización opcional (Make/Script)

Script sugerido `scripts/grafana/import.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
: "${GRAFANA_URL:?}"
: "${GRAFANA_API_KEY:?}"
FOLDER_UID=${FOLDER_UID:-oracle-lav}
# Crear carpeta
curl -sS -H "Authorization: Bearer $GRAFANA_API_KEY" -H 'Content-Type: application/json' \
  -X POST "$GRAFANA_URL/api/folders" -d "{\"uid\":\"$FOLDER_UID\",\"title\":\"Oracle LAV\"}" || true
# Importar cada dashboard
for f in observability/grafana/dashboards/*.json; do
  payload=$(jq -c --argfile d "$f" --arg folder "$FOLDER_UID" '{dashboard: $d, folderUid: $folder, overwrite: true}');
  curl -sS -H "Authorization: Bearer $GRAFANA_API_KEY" -H 'Content-Type: application/json' \
       -X POST "$GRAFANA_URL/api/dashboards/db" -d "$payload";
done
```

---

**Listo.** Con esto puedes importar/exportar dashboards, mantenerlos versionados y configurar variables estándar para navegar **env/feeds/assets**. Ajusta las queries/labels a tu esquema de métricas cuando sea necesario.
