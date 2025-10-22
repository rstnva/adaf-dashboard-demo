# ⚠️ DEPERCADO — Motor del Dash (copia legacy)

> Esta carpeta quedó congelada tras la consolidación en ADAF Billions Dash v2 (mock-first).
> Por favor usa la versión canónica:
>
> - Código y Docs canónicos: `ADAF-Billions-Dash-v2/motor-del-dash/`
> - Compendio Maestro: `ADAF-Billions-Dash-v2/motor-del-dash/memoria/compendios/ADAF_COMPENDIO_MAESTRO_v2_0.md`
> - Arquitectura: `ADAF-Billions-Dash-v2/motor-del-dash/arquitectura/ARCHITECTURE.md`
> - Memoria técnica: `ADAF-Billions-Dash-v2/motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md`
> - API (Markdown): `GET /api/docs/compendio`

# 📂 Motor del Dash - Documentación Completa del Sistema

## 🎯 **¿Qué es Motor del Dash?**

Esta carpeta contiene **TODA la documentación core** del sistema ADAF Dashboard Pro, organizada de manera profesional siguiendo estándares Fortune 500.

---

## 📚 **ESTRUCTURA ORGANIZADA**

### 🚀 **[documentacion/](./documentacion/)** - Guías de Usuario

- **`README-COMPLETO.md`** - Guía completa paso a paso (375 líneas optimizadas)
- **`ORACLE_CORE_IMPLEMENTATION.md`** - Implementación completa del Oracle Core (Meta-Oráculo 5× Fortune 500)
- Inicio rápido, recuperación de emergencia, troubleshooting
- **Para**: Usuarios, administradores, instalación y uso

### 🏗️ **[arquitectura/](./arquitectura/)** - Documentación Técnica

- **[`ARCHITECTURE.md`](./arquitectura/ARCHITECTURE.md)** - Arquitectura técnica detallada
- **[`ORACLE_ARCHITECTURE.md`](./arquitectura/ORACLE_ARCHITECTURE.md)** - Arquitectura del Oracle Core (flujos, seguridad, observabilidad)
- Stack tecnológico, APIs, integrations, deployment
- **Para**: Desarrolladores, DevOps, arquitectos
- **LAV-ADAF (3005)** → consulta también [`../lav-adaf/docs/architecture.md`](../lav-adaf/docs/architecture.md) para la nueva plataforma multi-agente y router IA.

### 🧠 **[memoria/](./memoria/)** - Historial de Decisiones

- **`MEMORIA_GITHUB_COPILOT.md`** - Registro completo de cambios técnicos
- Decisiones de diseño, evolución del sistema, aprendizajes
- **Para**: Contexto histórico, decisiones futuras, onboarding

### 📈 **[sprints/](./sprints/)** - Planificación y seguimiento

- **`SPRINTS_2025-10-10.md`** - Bitácora de validaciones por sprint
- **`PLAN_2025-10-15.md`** - Plan de cierre Fortune 500 (pendientes críticos y responsables)
- **Para**: PMO, leads técnicos, seguimiento de compromisos Fortune 500

---

## 🚀 **ACCESO RÁPIDO**

### 📖 **¿Quieres usar el sistema?**

👉 **[documentacion/README-COMPLETO.md](./documentacion/README-COMPLETO.md)**

- 🚀 Inicio rápido en 30 segundos
- 🚨 Recuperación de emergencia
- ⚡ Comandos de diagnóstico
- 🔧 Troubleshooting completo
- 📚 Contexto histórico y memorias centralizadas en [`documentacion/CONTEXTO_UNIFICADO.md`](./documentacion/CONTEXTO_UNIFICADO.md)

### 👨‍💻 **¿Quieres desarrollar?**

👉 **[arquitectura/ARCHITECTURE.md](./arquitectura/ARCHITECTURE.md)**

- 🏗️ Arquitectura del sistema
- 📋 Stack tecnológico completo
- 🔌 APIs y endpoints
- 🐳 Docker y deployment

👉 **[arquitectura/ORACLE_ARCHITECTURE.md](./arquitectura/ORACLE_ARCHITECTURE.md)**

- 🎯 Oracle Core - Meta-Oráculo Multi-Fuente
- 🔄 Flujos de consenso (weighted median, trimmed mean, k-of-n)
- 🔐 Seguridad (RBAC, rate limiting, audit trail)
- 📊 Observabilidad (Prometheus, Grafana, alertas)
- 🚀 Deployment (shadow → mixed → live)

- 🤖 **Multi-agente LAV (puerto 3005)**: [`../lav-adaf/docs/architecture.md`](../lav-adaf/docs/architecture.md) y [`../lav-adaf/docs/runbook-demo.md`](../lav-adaf/docs/runbook-demo.md)

### 🧠 **¿Quieres entender decisiones técnicas?**

👉 **[memoria/MEMORIA_GITHUB_COPILOT.md](./memoria/MEMORIA_GITHUB_COPILOT.md)**

- 📝 Historial de cambios
- 🎯 Decisiones de diseño
- 📈 Evolución del sistema
- 🔍 Aprendizajes técnicos

---

## 💡 **¿Por qué "Motor del Dash"?**

Esta organización sigue **estándares Fortune 500**:

- ✅ **Separación clara** de responsabilidades documentales
- ✅ **Fácil navegación** por tipo de necesidad
- ✅ **Escalabilidad** para equipos grandes
- ✅ **Mantenimiento** simplificado
- ✅ **Onboarding** acelerado

---

## 🎯 **PRINCIPIOS DE ORGANIZACIÓN**

### 📋 **Por Audiencia:**

- **Usuarios** → `documentacion/`
- **Desarrolladores** → `arquitectura/`
- **Contexto histórico** → `memoria/`

### 📋 **Por Propósito:**

- **¿Cómo usar?** → Documentación
- **¿Cómo funciona?** → Arquitectura
- **¿Por qué así?** → Memoria

### 📋 **Por Urgencia:**

- **Problemas inmediatos** → Documentación (sección emergencia)
- **Desarrollo** → Arquitectura (APIs, stack)
- **Contexto** → Memoria (decisiones pasadas)

---

## 🏆 **VENTAJAS DE ESTA ORGANIZACIÓN**

### ✅ **Para Nuevos Desarrolladores:**

- Onboarding guiado por carpetas
- Documentación progresiva (uso → desarrollo → contexto)
- Acceso directo a lo que necesitan

### ✅ **Para Mantenimiento:**

- Actualizaciones focalizadas por tipo
- Sin redundancia entre documentos
- Versionado claro por responsabilidad

### ✅ **Para Escalabilidad:**

- Estructura preparada para crecer
- Nuevas guías se ubican fácilmente
- Separación de concerns documentales

---

## 🔗 **ENLACES RÁPIDOS AL SISTEMA**

### 🌐 **URLs Principales:**

- **Dashboard ADAF**: http://localhost:3000
- **Sistema LAV-ADAF**: http://localhost:3005

### ⚡ **Comandos de Inicio:**

```bash
# Inicio completo del sistema
./inicio-completo.sh

# Solo dashboard principal
pnpm dev
```

### 🚨 **Emergencias:**

```bash
# Reset completo
lsof -t -i:3000,3005 | xargs kill -9
rm -rf .next/ node_modules/
pnpm install && ./inicio-completo.sh
```

---

**🎯 Esta estructura está diseñada para que cualquier humano o AI pueda navegar la documentación de manera eficiente y encontrar exactamente lo que necesita.**

**💪 Motor del Dash: El corazón documentado del sistema ADAF Dashboard Pro** 🚀
