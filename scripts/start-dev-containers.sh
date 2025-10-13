#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker no está instalado o no está en el PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  cat >&2 <<'EOF'
❌ Docker está instalado pero no se pudo acceder al daemon.

Posibles causas:
  • El servicio de Docker no está ejecutándose (inicia con `sudo systemctl start docker`)
  • Tu usuario no pertenece al grupo `docker` (ejecuta `sudo usermod -aG docker $USER` y reinicia sesión)
  • Estás en un entorno restringido (CI, sandbox, contenedor sin privilegios) sin capacidades para docker

Solución: ejecuta este script desde tu máquina anfitriona con permisos completos de Docker.
EOF
  exit 1
fi

cd "$ROOT_DIR"
echo "🚀 Levantando ADAF Dashboard (desarrollo)…"
docker compose -f docker-compose.dev.yml up --build "$@"
