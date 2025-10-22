#!/bin/bash
set -e
export ORACLE_SOURCE_MODE=mock
CORR_ID=$(uuidgen)
echo "[SHADOW OFF] ORACLE_SOURCE_MODE=mock | x-correlation-id: $CORR_ID" | tee -a dashboard.log
