#!/usr/bin/env bash
set -euo pipefail

PORTS=(3000 3005)
for p in "${PORTS[@]}"; do
  if ss -ltnp | grep -q ":$p"; then
    pid=$(ss -ltnp | awk -v p=":$p" '$0 ~ p {print $7}' | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1 || true)
    if [ -n "${pid:-}" ]; then
      echo "Killing process $pid on port $p"
      kill "$pid" || true
      sleep 1
      if ss -ltnp | grep -q ":$p"; then
        echo "Force killing process $pid on port $p"
        kill -9 "$pid" || true
      fi
    fi
  fi
done

rm -rf .next lav-adaf/apps/dashboard/.next || true

echo "✅ Ports freed and .next caches cleared."
