> **Contexto Unificado:** La documentación extendida vive ahora en `motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md`.

## Avances recientes (Octubre 2025)

### Resumen para humanos y agentes


> Si retomas este proyecto, revisa también `ARCHITECTURE.md` y `MEMORIA_GITHUB_COPILOT.md` para contexto técnico y decisiones clave.
# 🚀 ADAF Dashboard Pro - Sistema Integrado de Inteligencia Financiera

## ⚡ **INICIO INMEDIATO**

### 🎯 **¿Empezar ahora? → 30 segundos**

```bash
# Clonar e iniciar TODO con UN SOLO COMANDO
git clone [repo-url]
cd adaf-dashboard-pro
./inicio-completo.sh
```

**¡YA FUNCIONA!** → http://localhost:3000 🚀

---

## 📂 **DOCUMENTACIÓN COMPLETA EN: `motor-del-dash/`**

### 📚 **Todo lo que necesitas está organizado aquí:**

| 📁 **Carpeta** | 📋 **Contenido** | 🎯 **Para qué es** |
|---------------|------------------|-------------------|
| 🚀 **[`documentacion/`](./motor-del-dash/documentacion/)** | README completo, guías paso a paso | **Usar el sistema, resolver problemas** |
| 🏗️ **[`arquitectura/`](./motor-del-dash/arquitectura/)** | Documentación técnica detallada | **Desarrollar, extender, integrar** |
| 🧠 **[`memoria/`](./motor-del-dash/memoria/)** | Historial de decisiones técnicas | **Entender el por qué de cada cambio** |

### 🎯 **Accesos Rápidos:**
- 📚 **[Contexto Unificado](./motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md)** ← Documentación extendida + memorias
- 📖 **[Guía Completa de Uso](./motor-del-dash/documentacion/README-COMPLETO.md)** ← **¡Empieza aquí!**
- 🏗️ **[Documentación Técnica](./motor-del-dash/arquitectura/ARCHITECTURE.md)** ← Para desarrolladores
- 🧠 **[Memoria Técnica](./motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md)** ← Historial de decisiones

---

## 🏆 **ESTADO: 100% FUNCIONAL** ✅

- ✅ **Navegación completa**: Sin errores 404
- ✅ **850+ tests pasando**: Sistema robusto
- ✅ **Dual dashboard**: ADAF (3000) + LAV-ADAF (3005) 
- ✅ **Build exitoso**: Zero errores
- ✅ **Documentación organizada**: Todo en `motor-del-dash/`

---

## 🚨 **¿PROBLEMA? → SOLUCIÓN INMEDIATA**

### 1️⃣ **Leer la guía completa:**
👉 **[motor-del-dash/documentacion/README-COMPLETO.md](./motor-del-dash/documentacion/README-COMPLETO.md)**

### 2️⃣ **Reset de emergencia:**
```bash
# Limpiar todo y empezar de cero
lsof -t -i:3000,3005 | xargs kill -9
rm -rf .next/ node_modules/
pnpm install && ./inicio-completo.sh
```

### 3️⃣ **Verificar funcionamiento:**
```bash
curl http://localhost:3000/api/health  # ✅ Debe responder OK
curl http://localhost:3005/            # ✅ Debe responder OK
```

---

## 💡 **¿QUÉ ES ADAF Dashboard Pro?**

**Sistema Fortune 500** de inteligencia financiera:
- 📊 **Dashboard web profesional** (Next.js 15, React 19)
- 🤖 **30+ agentes cuantitativos** de trading
- 🎓 **Academy interactiva** con lecciones
- 📈 **Analytics avanzados** (ETFs, DeFi, derivados)
- 🛡️ **Seguridad enterprise** y compliance

---

## 🎯 **PRÓXIMOS PASOS**

### 🚀 **Para usar el sistema:**
1. **Lee**: [`motor-del-dash/documentacion/README-COMPLETO.md`](./motor-del-dash/documentacion/README-COMPLETO.md)
2. **Ejecuta**: `./inicio-completo.sh`
3. **Accede**: http://localhost:3000

### 👨‍💻 **Para desarrollar:**
1. **Estudia**: [`motor-del-dash/arquitectura/ARCHITECTURE.md`](./motor-del-dash/arquitectura/ARCHITECTURE.md)
2. **Revisa**: [`motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md`](./motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md)
3. **Desarrolla**: `pnpm dev`

---

## 📞 **SOPORTE**

- 🐛 **Problemas**: Ver sección "RECUPERACIÓN DE EMERGENCIA" en la [guía completa](./motor-del-dash/documentacion/README-COMPLETO.md)
- 🏗️ **Desarrollo**: Consultar [documentación técnica](./motor-del-dash/arquitectura/ARCHITECTURE.md)
- 🧠 **Decisiones**: Revisar [memoria técnica](./motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md)

---

## 🚀 Arranque rápido con Docker Compose (Desarrollo)

Puedes levantar todo el entorno de desarrollo (Postgres, Redis, ADAF Dashboard, LAV-ADAF Dashboard) con un solo comando:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- ADAF Dashboard: http://localhost:3000
- LAV-ADAF Dashboard: http://localhost:3005
- Base de datos Postgres: localhost:5432 (usuario: adaf_user, pass: adaf_pass)
- Redis: localhost:6379

> El código fuente se monta en caliente (hot reload) para desarrollo. Puedes modificar archivos y ver los cambios en tiempo real.

Para detener todo:
```bash
docker compose -f docker-compose.dev.yml down
```

### Arranque aún más rápido

Puedes iniciar todo el entorno con un solo comando:

```bash
./inicio-docker.sh
```

Esto levantará ADAF Dashboard, LAV-ADAF, Postgres y Redis en modo desarrollo usando Docker Compose.

---

### Alternativa guiada

Si prefieres que el proyecto valide el acceso a Docker antes de levantar los servicios, usa:

```bash
./scripts/start-dev-containers.sh
```

Si ves el error `cannot set capabilities: Operation not permitted` (o mensajes emitidos por el script) significa que estás en un entorno sin privilegios de Docker. Ejecuta el script desde tu máquina anfitriona con Docker instalado, servicio activo y tu usuario dentro del grupo `docker`.

---

### Sistema enterprise-grade listo para uso inmediato

**📂 TODA la documentación está perfectamente organizada en `motor-del-dash/`** 🚀

---
