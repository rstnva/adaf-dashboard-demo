# Onboarding Fortune 500 — ADAF Dashboard Pro

Bienvenido/a al equipo ADAF Dashboard Pro. Este onboarding te guiará paso a paso para integrarte con estándares Fortune 500, asegurando seguridad, calidad y operación institucional.

---

## 1. Documentación clave
- [README.md](../README.md): visión general e inicio rápido del sistema.
- [Documentación Completa](../motor-del-dash/README.md): toda la documentación organizada profesionalmente.
- [Guía Completa de Uso](../motor-del-dash/documentacion/README-COMPLETO.md): guías paso a paso, instalación y operación.
- [Arquitectura Técnica](./motor-del-dash/arquitectura/ARCHITECTURE.md): documentación técnica detallada.
- [Memoria Técnica](../motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md): bitácora institucional, decisiones, incidentes y estándares.
- [docs/runbooks/README.md](../docs/runbooks/README.md): runbooks operativos y respuesta a incidentes.
- [docs/runbooks/templates/POSTMORTEM.md](../docs/runbooks/templates/POSTMORTEM.md): plantilla de post-mortem.
- [SECURITY_README.md](../SECURITY_README.md): políticas de seguridad, manejo de secretos y roles.

## 2. Acceso y seguridad
- Solicita acceso a los repositorios y sistemas (GitHub, CI/CD, vaults, bases de datos, Redis) solo por canales seguros.
- Nunca compartas secretos por correo/chat. Usa vaults o canales cifrados.
- Revisa y firma el checklist de acceso y roles.
- Lee y comprende el protocolo de respuesta a incidentes (ver runbooks y bitácora).

## 3. Instalación y entorno local
- Sigue el README para instalar dependencias y levantar el entorno local.
- Usa los scripts automatizados (`inicio-completo.sh`, `inicio-dashboard.sh`) para evitar errores manuales.
- Verifica que los tests y el linting pasen localmente antes de cualquier PR.

### 3.1 Configuración de simulación y feature flags
- Copia `.env.example` a `.env.local` y revisa los toggles bajo la sección **Feature Flags (Simulación ADAF)**.
- Activa únicamente los módulos que vas a probar (`NEXT_PUBLIC_FF_*`) para evitar ruido en los reportes de control.
	- Blockspace, Vaults LAV, Alpha Factory, Volatility Pro, Event Alpha, Market Making selectivo, TCA, Cosmos Executor, Liquidity Backstop.
	- Equities AI y News Oracle cuentan con toggles dedicados para habilitar integraciones institucionales.
- Define explícitamente el modo de ejecución:
	- `EXECUTION_MODE=dry-run` para procesos server-side (workers, agentes LAV).
	- `NEXT_PUBLIC_EXECUTION_MODE=dry-run` para la capa React/Next.js.
- Documenta cualquier cambio de modo (`dry-run`, `paper`, `micro`, `live`) en la bitácora y notifica al equipo de riesgo antes de pasar a modos no simulados.
- Conserva `NEXT_PUBLIC_FF_WSP_ENABLED` y `NEXT_PUBLIC_FF_WSP_AUTOREACT` en `true` únicamente si vas a validar flujos WSP; apágalos en auditorías que requieran aislamiento.

## 4. Estándares de calidad y CI/CD
- Todo el código debe pasar ESLint (flat config, reglas estrictas) y tests (>95% cobertura).
- Las PRs deben incluir descripción clara, checklist de QA y referencia a la bitácora si aplica.
- Consulta la bitácora para convenciones, migraciones y decisiones técnicas.

## 5. Operación y respuesta a incidentes
- Ante cualquier alerta, sigue el runbook correspondiente (docs/runbooks/).
- Si ocurre un incidente, documenta en la bitácora y usa la plantilla de post-mortem.
- Participa en simulacros y revisiones periódicas de seguridad.

## 6. Auditoría y mejora continua
- Todo cambio relevante debe quedar documentado en la bitácora institucional.
- Participa en sesiones de feedback, post-mortem y mejora continua.
- Consulta el roadmap y los OKRs para alinear tu trabajo a la visión institucional.

---

**¡Bienvenido/a a un equipo de clase mundial!**

Responsable onboarding: Copilot (asistente técnico)
Fecha: 2025-10-08
