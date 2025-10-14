# Runbook Demo – LAV-ADAF Multi-Agent Platform (Port 3005)

Este runbook describe cómo levantar la demo con mocks, validar el flujo completo `Planner → Coder → Reviewer → Executor (simulate)` y cómo migrar gradualmente a conectores reales.

## 1. Prerrequisitos

- Node.js **>= 20**
- pnpm **>= 9**
- SQLite 3 (incluido en la demo; no requiere instalación adicional)
- (Opcional) Redis local para colas (fallback in-memory incluido)

## 2. Variables de entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp env/.env.example env/.env.local
   ```
2. Llena al menos las siguientes variables:
   ```
   USE_MOCKS=true
   DRY_RUN=true
   OPENAI_API_KEY=mock-demo
   ANTHROPIC_API_KEY=mock-demo
   GOOGLE_API_KEY=mock-demo
   MISTRAL_API_KEY=mock-demo
   XAI_API_KEY=mock-demo
   RPC_URL=https://mock-chain.invalid
   WALLET_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
   ```

> Para demo, todas las claves pueden ser `mock-demo`. El router detectará `USE_MOCKS=true` y utilizará `MockLLM`.

## 3. Arrancar la Demo End-to-End

```bash
cd lav-adaf
pnpm install
pnpm run demo
```

### ¿Qué hace `pnpm run demo`?

1. Ejecuta `packages/*` tests unitarios (Vitest).
2. Corre `scripts/seed-demo.ts` para poblar SQLite con precios y posiciones ficticias.
3. Levanta la aplicación Next.js (puerto 3005) con mocks y colas en memoria.
4. Lanza un flow de ejemplo “Rebalance sleeve ETH→BTC” en modo `simulate` y muestra el reporte en consola.

La consola queda disponible en: **http://localhost:3005/agents**

## 4. Flujo Manual desde la UI

1. **Playbooks** (`/playbooks`):
   - Selecciona “Rebalance sleeve BTC/ETH”.
   - Ajusta parámetros (porcentaje, slippage, dry-run).
   - Lanza la ejecución (Planner Agent).
2. **Agents Console** (`/agents`):
   - Observa el plan generado, cada paso y estado.
   - Visualiza logs, reintentos y métricas por agente.
   - Usa “Simulate” para ejecutar el plan end-to-end.
3. **Risk Panel** (`/risk`):
   - Revisa reglas activas, overrides y límites (slippage ≤0.5 %, LTV, allowlists).
   - Aprueba overrides si el plan lo requiere.
4. **Logs** (`/logs`):
   - Filtra por `planId`, `agentId`, `severity`.
   - Descarga reporte JSON (botón `Export Report`).

## 5. Cambiar a Conectores Reales

1. **Actualizar `.env.local`:**
   ```
   USE_MOCKS=false
   DRY_RUN=true
   RPC_URL=https://sepolia.infura.io/v3/<tu-key>
   WALLET_PRIVATE_KEY=<clave solo para testing / faucet>
   ```
2. **Market Data**:
   - Completa `packages/integrations/adapters/real/MarketDataProvider.ts` (placeholder) con llamadas a DefiLlama / Glassnode.
3. **OnChain**:
   - Implementa `adapters/real/OnChainProvider.ts` usando `viem` (ya importado por `packages/wallet`).
   - Mantén `dryRun=true` hasta validar con `PolicyGuard`.
4. **CeFi**:
   - Llenar `adapters/real/CeFiProvider.ts` con APIs paper trading (Binance/OKX).
5. **Activar ejecuciones reales**:
   ```
   DRY_RUN=false
   APPROVE_EXEC=true
   ```
   > Solo después de que las pruebas (unit y Playwright) pasen y se aprueben riesgos en `/risk`.

## 6. Troubleshooting

| Problema                          | Acción recomendada                                                       |
| --------------------------------- | ------------------------------------------------------------------------ |
| El Planner se queda en `pending`  | Revisa `packages/ai-router` logs (`logs/agents.log`); fallback a Mock.   |
| `PolicyGuard` aborta por slippage | Ajusta parámetros en `/risk` o revisa MarketData proporcionado.          |
| Wallet lanza error de firma       | Verifica `WALLET_PRIVATE_KEY`, `CHAIN_ID`, y que `dryRun=true`.          |
| Métricas no aparecen              | Asegura `packages/observability/metrics` está inicializado en la UI/API. |
| Playwright falla en pipeline      | Ejecuta `pnpm test:e2e` localmente; revisar fixtures en `tests/e2e`.     |

## 7. Resumen Operativo Diario

1. `pnpm run demo` (mock) o `pnpm dev --filter @lav-adaf/dashboard` (real).
2. Revisar `/agents` y `/risk` antes de aprobar ejecuciones.
3. Exportar reporte PDF desde `/agents` → “Export Report”.
4. Validar métricas (`metrics/agents.prom`) y logs (`logs/agents.log`).
5. Rotar claves y revisar `.env.local` semanalmente.

---

> Mantén este runbook sincronizado con `docs/architecture.md` y los paquetes asociados.
