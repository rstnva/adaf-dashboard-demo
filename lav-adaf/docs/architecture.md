# ADAF / LAV Multi-Agent Platform (Port 3005)

> **Scope**: Orchestration layer that powers the LAV-ADAF dashboard running on port **3005**.  
> Everything described here lives in the **`lav-adaf`** workspace and extends the existing application.

## 1. Vista de Alto Nivel

```
                         ┌──────────────────────────────┐
                         │        apps/dashboard         │
                         │  • UI (Next.js 15)            │
                         │  • API Routes / Actions       │
                         │  • Agent Console, Playbooks   │
                         │  • Risk & Logs Panels         │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                             packages/agents-core                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │ PlannerAgent │→→ │ CoderAgent   │→→ │ ReviewerAgent│→→ │ ExecutorAgent│ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘ │
│            ▲                ▲                ▲                │             │
│            │                │                │                │             │
│        ModelRouter     ModelRouter      ModelRouter     PolicyGuard        │
└───────────┬──────────────────────────────┴────────────────────┬────────────┘
            │                                                   │
            │                                                   │
            ▼                                                   ▼
┌──────────────────────────┐                         ┌───────────────────────┐
│   packages/ai-router     │                         │ packages/integrations │
│  • ModelRouter           │                         │  • MarketData ports   │
│  • LLM Providers (OpenAI │                         │  • OnChain mock/real  │
│    Anthropic, Gemini,    │                         │  • CeFi mock/real     │
│    Mistral, Grok, Mock)  │                         └────────────┬──────────┘
└──────────────┬──────────┘                                      │
               │                                                 │
               ▼                                                 ▼
      ┌────────────────┐                                 ┌──────────────────┐
      │packages/wallet │                                 │packages/observa- │
      │ • Wallet (EIP) │                                 │    bility        │
      │ • RiskRules    │                                 │ • logger JSON    │
      │ • TxJournal    │                                 │ • metrics OTLP   │
      └───────┬────────┘                                 └────────┬─────────┘
              │                                                   │
              ▼                                                   ▼
      ┌────────────────┐                                 ┌──────────────────┐
      │ SQLite (demo)  │                                 │ OTLP exporters    │
      │ Redis / mocks  │                                 │ (in-process)      │
      └────────────────┘                                 └──────────────────┘
```

## 2. Módulos Principales

| Ruta                     | Rol                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `packages/agents-core`   | Interfaces (`Agent`, `Task`) y agentes (Planner, Coder, Reviewer, Executor) coordinados. |
| `packages/ai-router`     | Router multi-proveedor (OpenAI, Anthropic, Gemini, Mistral, Grok, Mock).                 |
| `packages/integrations`  | `ports` y `adapters` para MarketData, OnChain, CeFi (mock + stubs reales).               |
| `packages/wallet`        | Firma EIP-712, gestión de nonces, reglas de riesgo, journaling de transacciones.         |
| `packages/observability` | Logger JSON estructurado + métricas OTLP por agente.                                     |
| `apps/dashboard`         | UI Next.js 15 (3005): consola de agentes, playbooks, riesgo, logs, API handlers.         |

### Decisiones clave

1. **Monorepo pnpm**: añadimos `packages/*` al workspace para compartir librerías TypeScript estrictas.
2. **Arquitectura hexagonal**: `ports/` definen contratos, `adapters/` contienen mocks o integraciones reales.
3. **LLM Router**: selección dinámica por propósito (`planning`, `coding`, `reviewing`, `fallback`).
4. **PolicyGuard**: aplica slippage ≤0.5 %, LTV objetivo, allowlists y modo `dry-run` por defecto.
5. **Observabilidad**: todo agente registra logs JSON con `taskId`, `agentId`, `llmProvider`, `txHash`; métricas OTLP para dashboards posteriores.

## 3. Flujo Multi-Agente

1. **PlannerAgent** recibe un objetivo (p. ej. _"Rebalancear 10 % ETH→BTC"_) y rompe el problema en pasos (`Task`).
2. **CoderAgent** genera/actualiza código respetando `ports/*`, crea pruebas y devuelve parches.
3. **ReviewerAgent** ejecuta checklist (tipos, seguridad, tests) y puede devolver correcciones.
4. **ExecutorAgent** valida con `PolicyGuard`, firma `dryRun` usando `Wallet` y registra el resultado en `TxJournal`.
5. **Coordinator** gobierna el ciclo, maneja reintentos exponenciales, circuit-breakers y finaliza con reporte estructurado.

## 4. Límite y Guardrails

- **Slippage máximo**: 0.5 % (configurable por regla pero verificado antes de ejecutar).
- **LTV y límites**: `RiskRules` valida tamaño, colateral y allowlists (direcciones aprobadas).
- **Modo demo**: `USE_MOCKS=true` activa adaptadores simulados y base de datos SQLite local.
- **Switch a real**: `USE_MOCKS=false` usa stubs `adapters/real/*` (con TODOs documentados) y fuerza `dryRun` hasta que `APPROVE_EXEC=true`.

## 5. Integración con la UI (3005)

- **`app/agents`**: consola en tiempo real (React Query + Zustand) para monitorear planes, pasos y reintentos.
- **`app/playbooks`**: plantillas pre-configuradas que alimentan al Planner.
- **`app/risk`**: visualización de reglas activas, overrides y aprobaciones.
- **`app/logs`**: visor JSON con filtros por agente, severidad y correlación.
- **API Routes**: `/api/agents/*` exponen endpoints para lanzar planes, simular, ejecutar, exportar reportes.

## 6. Persistencia y Seeders

- **SQLite demo** (`packages/*` + Prisma) almacena: `tx_journal`, `mock_positions`, `mock_prices`.
- **Redis opcional** (cuando esté disponible) para colas in-process (TaskQueue demo).
- **`scripts/seed-demo.ts`** pobla precios BTC/ETH/USDC, posiciones y playbooks.

## 7. Seguridad & Observabilidad

- **`.env.example`** documenta todas las claves necesarias, sin credenciales reales.
- **Logs**: formato JSON con correlación (`taskId`, `agentId`, `planId`, `txHash`).
- **Métricas**: contadores por agente/proveedor, latencias de LLM, éxito/fallo de políticas.
- **Trazas**: hooks con identificadores básicos (se deja interfaz para OpenTelemetry real).

## 8. Próximos Pasos

1. Integrar adaptadores reales (`adapters/real/*`) conectando DefiLlama, RPCs y CeFi paper trading.
2. Expandir RiskRules con modelos específicos por estrategia (VaR, stress).
3. Incorporar RAG embebido para contexto histórico de decisiones (interface ya expuesta en Router).
4. Desplegar observabilidad completa (Prometheus → Grafana) usando métricas exportadas.

---

**Este documento se mantendrá sincronizado con `docs/runbook-demo.md` y las implementaciones en `packages/*`.**
