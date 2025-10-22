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

echo "✅ Grafana dashboards imported successfully into folder: $FOLDER_UID"
