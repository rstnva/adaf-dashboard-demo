#!/bin/bash
set -e
export ORACLE_SOURCE_MODE=shadow
CORR_ID=$(uuidgen)
echo "[SHADOW ON] ORACLE_SOURCE_MODE=shadow | x-correlation-id: $CORR_ID" | tee -a dashboard.log
