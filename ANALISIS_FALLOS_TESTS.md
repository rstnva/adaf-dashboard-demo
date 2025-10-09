# PLAN DE CORRECCIÓN DE TESTS FALLANDO

## 🎯 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### **1. PROBLEMA PRISMA LAV/ADAF (Crítico - 40 tests)**
**Síntoma**: `@prisma/client did not initialize yet. Please run "prisma generate"`
**Solución**: 
```bash
cd /home/parallels/Desktop/adaf-dashboard-pro/lav-adaf
pnpm prisma generate
```

### **2. DEPENDENCIA FALTANTE (3 tests)**
**Síntoma**: `Failed to resolve import "html-to-image"`
**Solución**:
```bash
cd /home/parallels/Desktop/adaf-dashboard-pro
pnpm add html-to-image
cd lav-adaf
pnpm add html-to-image
```

### **3. CONFIGURACIÓN REACT LAV/ADAF (38 tests)**
**Síntoma**: `ReferenceError: React is not defined`
**Solución**: Agregar configuración de React en vitest.config.ts de LAV/ADAF
```typescript
// lav-adaf/apps/dashboard/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

### **4. CONFLICTO PLAYWRIGHT**
**Síntoma**: `Playwright Test did not expect test.describe()`
**Solución**: Excluir tests E2E de Vitest
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    exclude: ['**/e2e/**', '**/node_modules/**']
  }
})
```

---

## **🔧 COMANDOS DE CORRECCIÓN RÁPIDA:**

```bash
# 1. Corregir Prisma LAV/ADAF
cd /home/parallels/Desktop/adaf-dashboard-pro/lav-adaf
pnpm prisma generate

# 2. Instalar dependencia faltante
cd /home/parallels/Desktop/adaf-dashboard-pro
pnpm add html-to-image
cd lav-adaf
pnpm add html-to-image

# 3. Ejecutar tests después de correcciones
cd /home/parallels/Desktop/adaf-dashboard-pro
pnpm test
```

---

## **📈 IMPACTO ESPERADO POST-CORRECCIÓN:**

- **Antes**: 738/824 tests pasando (89.6%)
- **Después estimado**: 800+/824 tests pasando (97%+)
- **Tests críticos recuperados**: ~81 tests

---

## **🚨 RAZONES POR LAS QUE NO SE CORRIGIERON ANTES:**

1. **Sistema LAV/ADAF independiente**: Tiene su propia configuración separada
2. **Dependencias opcionales**: `html-to-image` no es crítica para funcionalidad core
3. **Configuración de testing compleja**: Múltiples entornos (Vitest + Playwright)
4. **Arquitectura de monorepo**: Cada aplicación tiene sus propias dependencias

---

## **✅ PRIORIDAD DE CORRECCIÓN:**

1. **ALTA**: Problema Prisma (40 tests) - Crítico para LAV/ADAF
2. **MEDIA**: React config (38 tests) - Afecta tests de componentes  
3. **BAJA**: html-to-image (3 tests) - Funcionalidad no crítica
4. **BAJA**: Playwright conflict (1 test) - Test E2E específico

La mayoría de fallos son de **configuración e infraestructura**, no de **lógica de negocio**.