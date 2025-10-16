# ADAF Dashboard Pro

> Toda la documentación técnica, operativa y de memorias vive ahora dentro de `motor-del-dash/`. Este README solo deja los accesos esenciales.

## 📚 Documentación centralizada

- [`motor-del-dash/documentacion/README-COMPLETO.md`](./motor-del-dash/documentacion/README-COMPLETO.md) — Guía de arranque, troubleshooting y procedimientos Fortune 500.
- [`motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md`](./motor-del-dash/documentacion/CONTEXTO_UNIFICADO.md) — Compendio con todo el contexto histórico y anexos.
- [`motor-del-dash/arquitectura/ARCHITECTURE.md`](./motor-del-dash/arquitectura/ARCHITECTURE.md) — Vista técnica y flujos del sistema ADAF/LAV.
- [`motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md`](./motor-del-dash/memoria/MEMORIA_GITHUB_COPILOT.md) — Bitácora de decisiones, avances y criterios Fortune 500.

## ⚡ Inicio rápido (ver guía completa para más opciones)

```bash
git clone [repo-url]
cd adaf-dashboard-pro
./inicio-completo.sh
```

- ADAF Dashboard → http://localhost:3000
- LAV-ADAF Dashboard → http://localhost:3005
- Healthcheck rápido → http://localhost:3000/api/health

## 🧾 Logs operativos

Los registros principales se mantienen en el root del repositorio para diagnóstico rápido:

- `adaf-dashboard.log`, `dashboard.log`, `dashboard-live.log`, `dashboard-mejorado.log`
- `lav-adaf-dashboard.log`, `adaf-live.log`, `server.log`, `server-test.log`, `server-clean.log`
- `nohup.out` y los dumps específicos generados por scripts (`adaf-clean.log`, etc.)

Consulta la guía en `motor-del-dash/documentacion/` para rutas adicionales, políticas de rotación y procedimientos de análisis.
