# Onboarding Fortune 500 — ADAF Dashboard Pro

Bienvenido/a al equipo ADAF Dashboard Pro. Este onboarding te guiará paso a paso para integrarte con estándares Fortune 500, asegurando seguridad, calidad y operación institucional.

---

## 1. Documentación clave
- [README.md](../README.md): visión, arquitectura, instalación y operación.
- [MEMORIA_GITHUB_COPILOT.md](../MEMORIA_GITHUB_COPILOT.md): bitácora institucional, decisiones, incidentes y estándares.
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
