#!/bin/bash
# Arranca todo el stack ADAF + LAV-ADAF en modo desarrollo

docker compose -f docker-compose.dev.yml up --build
