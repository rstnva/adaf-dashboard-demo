# VOX POPULI v1.1 for ADAF ORACLE CORE (Meta‑Oráculo) —Codex Build Plan

> **Este issue contiene el blueprint completo para la integración y despliegue de Vox Populi v1.1 en ADAF ORACLE CORE.**

---

## PROMPT PEGADO (ver detalles y tareas en el cuerpo)

[Pegado íntegro del prompt recibido, ver historial de conversación.]

---

## Plan de acción

1. **Documentar aceptación y adaptación** en `README_ORACLE_CORE.md`.
2. **Ejecutar tareas** en el orden sugerido (PRs atómicos):
   - shock/divergence/leadlag + fixtures/tests
   - entity resolver + goldset
   - antibots/burst overlap + cred-decay
   - backtest research + endpoint
   - DQ control charts + quarantine
   - Vox War Room UI
   - alertas, budget guard, docs
3. **Mantener guardrails**: EXECUTION_MODE=dry-run, ORACLE_SOURCE_MODE=mock/shadow, NO mixed/live.
4. **Documentar cada decisión estructural** en los README.
5. **Validar DoD y checklist** al final de cada PR.

---

## Estado inicial

- ADAF ORACLE CORE v1.1 y Vox v1 (mock/shadow) ya integrados.
- Command Center y métricas base activos.
- Estructura de carpetas y feeds mock/shadow creada.

---

## Meta final

- Vox Populi v1.1 operable, auditable, con métricas, alertas, UI y research.
- Todo bajo mock/shadow, sin activar mixed/live.
- Checklist de aceptación y DoD cumplidos.

---

> **Este issue se irá actualizando con avances, decisiones y enlaces a los PRs atómicos correspondientes.**
