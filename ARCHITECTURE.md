# 🏗️ ARQUITECTURA DEL SISTEMA ADAF DASHBOARD

## 📋 Resumen Ejecutivo

**ADAF Dashboard** es un sistema completo de inteligencia financiera que combina análisis de mercados DeFi, gestión de riesgos, y trading algorítmico. El proyecto implementa una arquitectura dual con dos aplicaciones principales corriendo en paralelo.

### 🎯 **Componentes Principales**
- **ADAF Dashboard Pro** (Puerto 3000) - Dashboard financiero unificado
- **LAV-ADAF Sistema** (Puerto 3005) - Sistema de 30+ agentes cuantitativos

---

## 🏛️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    ADAF ECOSYSTEM                           │
├─────────────────────────┬───────────────────────────────────┤
│    ADAF Dashboard Pro   │      LAV-ADAF System             │
│       (Port 3000)       │       (Port 3005)               │
│                         │                                  │
│  ┌─────────────────┐   │   ┌─────────────────────────────┐ │
│  │   Frontend      │   │   │   30+ Quantitative Agents   │ │
│  │   Next.js 15    │   │   │   Algorithmic Trading       │ │
│  │   React 19      │   │   │   Market Analysis           │ │
│  └─────────────────┘   │   └─────────────────────────────┘ │
│           │             │              │                   │
│  ┌─────────────────┐   │   ┌─────────────────────────────┐ │
│  │   API Layer     │   │   │   Agent Orchestrator        │ │
│  │   REST & WS     │   │   │   Message Broker            │ │
│  └─────────────────┘   │   └─────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────┘
                          │
            ┌─────────────────────────────────┐
            │        SHARED INFRASTRUCTURE    │
            │                                 │
            │  ┌──────────┐ ┌──────────────┐ │
            │  │PostgreSQL│ │    Redis     │ │
            │  │ Database │ │    Cache     │ │
            │  └──────────┘ └──────────────┘ │
            │                                 │
            │  ┌──────────┐ ┌──────────────┐ │
            │  │  Nginx   │ │   Docker     │ │
            │  │Reverse   │ │ Containers   │ │
            │  │ Proxy    │ │              │ │
            │  └──────────┘ └──────────────┘ │
            └─────────────────────────────────┘
```

---

## 🚀 Stack Tecnológico

### **Frontend & Core**
- **Next.js 15.5.4** - Framework React con App Router
- **React 19.1.1** - Biblioteca de interfaz de usuario
- **TypeScript 5.9.2** - Tipado estático
- **Tailwind CSS 3.4.14** - Framework de estilos
- **Radix UI** - Componentes primitivos accesibles
- **Zustand 4.5.7** - Gestión de estado global

### **Backend & APIs**
- **Node.js 20+** - Runtime de JavaScript
- **Prisma 5.22.0** - ORM y gestión de base de datos
- **PostgreSQL 15** - Base de datos principal
- **Redis** - Cache y cola de mensajes
- **IORedis 5.4.1** - Cliente Redis para Node.js

### **Testing & Quality**
- **Vitest 2.1.8** - Framework de testing
- **Playwright 1.56.0** - Testing E2E
- **Testing Library** - Utilities de testing React
- **ESLint + Prettier** - Linting y formato de código
- **Husky** - Git hooks

### **DevOps & Deployment**
- **Docker & Docker Compose** - Containerización
- **Nginx** - Reverse proxy y load balancer
- **PM2** - Process manager para Node.js
- **GitHub Actions** - CI/CD pipeline

---

## 📁 Estructura de Directorios

```
adaf-dashboard-pro/
├── 📂 src/                           # Código fuente principal
│   ├── 📂 app/                       # App Router de Next.js
│   │   ├── 📂 (dashboard)/          # Grupo de rutas del dashboard
│   │   ├── 📂 api/                  # API Routes de Next.js
│   │   ├── 📂 monitoring/           # Páginas de monitoreo
│   │   └── 📄 layout.tsx            # Layout raíz
│   ├── 📂 components/               # Componentes React
│   │   ├── 📂 dashboard/            # Componentes específicos del dashboard
│   │   ├── 📂 ui/                   # Componentes de UI reutilizables
│   │   ├── 📂 charts/               # Componentes de gráficos
│   │   └── 📂 providers/            # Context providers
│   ├── 📂 lib/                      # Utilidades y servicios
│   │   ├── 📂 agents/               # Sistema de agentes IA
│   │   ├── 📂 auth/                 # Autenticación
│   │   ├── 📂 cache/                # Gestión de cache
│   │   └── 📂 utils/                # Utilidades generales
│   ├── 📂 hooks/                    # Custom React hooks
│   ├── 📂 store/                    # Gestión de estado (Zustand)
│   └── 📂 types/                    # Definiciones de TypeScript
├── 📂 lav-adaf/                     # Sistema LAV-ADAF (Agentes)
│   ├── 📂 apps/dashboard/           # Dashboard de agentes
│   ├── 📂 libs/                     # Librerías compartidas
│   └── 📂 ops/                      # Operaciones y deployment
├── 📂 prisma/                       # Esquemas de base de datos
├── 📂 tests/                        # Tests automatizados
├── 📂 docker/                       # Configuraciones Docker
├── 📂 nginx/                        # Configuraciones Nginx
└── 📂 scripts/                      # Scripts de automatización
```

---

## 🔄 Flujo de Datos y Arquitectura

### **1. Frontend Architecture (ADAF Dashboard Pro)**

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND LAYERS                        │
├─────────────────────────────────────────────────────────┤
│  📱 UI Layer                                           │
│  ├── React Components (Radix + Custom)                │
│  ├── Tailwind CSS Styling                             │
│  └── Responsive Design System                         │
├─────────────────────────────────────────────────────────┤
│  🧠 State Management                                   │
│  ├── Zustand Stores (Global State)                    │
│  ├── React Query (Server State)                       │
│  └── React Context (Auth, Themes)                     │
├─────────────────────────────────────────────────────────┤
│  🔌 Data Layer                                        │
│  ├── API Routes (/api/*)                              │
│  ├── WebSocket Connections                            │
│  └── External API Integrations                        │
└─────────────────────────────────────────────────────────┘
```

### **2. Backend Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   BACKEND LAYERS                        │
├─────────────────────────────────────────────────────────┤
│  🌐 API Layer                                          │
│  ├── Next.js API Routes                               │
│  ├── RESTful Endpoints                                │
│  ├── WebSocket Handlers                               │
│  └── GraphQL (Future)                                 │
├─────────────────────────────────────────────────────────┤
│  🔧 Business Logic                                     │
│  ├── Service Classes                                  │
│  ├── Agent System                                     │
│  ├── Rule Engine                                      │
│  └── Data Processing                                  │
├─────────────────────────────────────────────────────────┤
│  💾 Data Access Layer                                 │
│  ├── Prisma ORM                                       │
│  ├── Database Connections                             │
│  ├── Cache Management (Redis)                         │
│  └── External APIs                                    │
├─────────────────────────────────────────────────────────┤
│  🏗️ Infrastructure                                     │
│  ├── PostgreSQL Database                              │
│  ├── Redis Cache                                      │
│  ├── File System                                      │
│  └── Message Queues                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 Sistema de Agentes (LAV-ADAF)

### **Arquitectura de Agentes**

```
┌─────────────────────────────────────────────────────────┐
│                 AGENT ORCHESTRATOR                      │
├─────────────────────────────────────────────────────────┤
│  📊 Market Analysis Agents                             │
│  ├── Price Movement Detector                          │
│  ├── Volume Analysis Agent                             │
│  ├── Liquidity Monitor                                │
│  └── Sentiment Analyzer                               │
├─────────────────────────────────────────────────────────┤
│  🛡️ Risk Management Agents                             │
│  ├── Portfolio Risk Calculator                        │
│  ├── Exposure Monitor                                 │
│  ├── Stop Loss Manager                                │
│  └── Correlation Analyzer                             │
├─────────────────────────────────────────────────────────┤
│  💹 Trading Agents                                     │
│  ├── Arbitrage Scanner                                │
│  ├── Mean Reversion Bot                               │
│  ├── Momentum Trader                                  │
│  └── Grid Trading Bot                                 │
├─────────────────────────────────────────────────────────┤
│  📈 Research Agents                                    │
│  ├── News Aggregator                                  │
│  ├── On-chain Analyzer                                │
│  ├── Social Media Monitor                             │
│  └── Technical Indicator Calculator                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Datos

### **Esquema Principal de Base de Datos**

```sql
-- Señales del mercado
Signal {
  id: String (PK)
  type: String        # 'news', 'onchain', 'social', 'price'
  source: String      # 'RSS', 'DeFiLlama', 'Twitter'
  title: String
  description: String
  severity: String    # 'low', 'medium', 'high', 'critical'
  metadata: Json
  fingerprint: String (Unique)
  processed: Boolean
  timestamp: DateTime
}

-- Alertas generadas
Alert {
  id: String (PK)
  signalId: String (FK)
  type: String        # 'security', 'liquidity', 'regulatory'
  severity: String
  title: String
  description: String
  actionRequired: Boolean
  resolved: Boolean
}

-- Oportunidades de trading
Opportunity {
  id: String (PK)
  signalId: String (FK)
  type: String        # 'arbitrage', 'momentum', 'mean_reversion'
  asset: String
  expectedReturn: Float
  riskScore: Float
  confidence: Float
  expiresAt: DateTime
}

-- Configuración de agentes
AgentConfig {
  id: String (PK)
  name: String
  type: String
  enabled: Boolean
  parameters: Json
  lastRun: DateTime
}

-- Métricas de rendimiento
Metric {
  id: String (PK)
  name: String
  value: Float
  labels: Json
  timestamp: DateTime
}
```

---

## 🔐 Seguridad y Autenticación

### **Capas de Seguridad**

1. **Frontend Security**
   - CSP (Content Security Policy)
   - XSS Protection
   - CSRF Tokens
   - Input Sanitization

2. **API Security**
   - JWT Authentication
   - Rate Limiting
   - Input Validation (Zod)
   - CORS Configuration

3. **Infrastructure Security**
   - Docker Security Hardening
   - Nginx Security Headers
   - Database Connection Security
   - Environment Variables Protection

### **Control de Acceso (RBAC)**

```typescript
// Roles y permisos
interface UserRole {
  id: string
  name: string
  permissions: Permission[]
}

interface Permission {
  resource: string    // 'dashboard', 'agents', 'trading'
  action: string     // 'read', 'write', 'execute'
  conditions?: Json  // Condiciones adicionales
}

// Implementación en el código
const RBACProvider = ({ permissions, children }) => {
  // Gestión de permisos basada en contexto
}
```

---

## 🚀 Deployment y DevOps

### **Estrategia de Deployment**

```yaml
# docker-compose.prod.yml (Simplificado)
version: '3.8'
services:
  # Base de datos principal con replicación
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: adaf_dashboard
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  # Cache Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    
  # Aplicación ADAF
  adaf-app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    depends_on:
      - postgres-primary
      - redis
    
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### **Scripts de Automatización**

```bash
# inicio-completo.sh - Inicio completo del sistema
#!/bin/bash
pnpm install
pnpm dev:ambos  # Inicia ADAF (3000) + LAV-ADAF (3005)

# scripts/health-check.mjs - Verificación de salud
export const healthCheck = async () => {
  // Verifica conectividad de DB, Redis, APIs externas
}
```

---

## 📊 Monitoreo y Observabilidad

### **Métricas y Logging**

1. **Application Metrics**
   - Response times
   - Error rates
   - User interactions
   - Agent performance

2. **Infrastructure Metrics**
   - CPU/Memory usage
   - Database performance
   - Cache hit rates
   - Network latency

3. **Business Metrics**
   - Trading performance
   - Risk exposure
   - Alert frequency
   - User engagement

### **Health Monitoring**

```typescript
// src/components/HealthMonitor.tsx
const HealthMonitor = () => {
  const [status, setStatus] = useState({
    database: 'unknown',
    redis: 'unknown',
    agents: 'unknown',
    apis: 'unknown'
  })
  
  useEffect(() => {
    // Verificación periódica de salud del sistema
  }, [])
}
```

---

## 🧪 Testing Strategy

### **Niveles de Testing**

```
┌─────────────────────────────────────────┐
│            TESTING PYRAMID              │
├─────────────────────────────────────────┤
│  🎭 E2E Tests (Playwright)             │
│  ├── User Journey Tests                │
│  ├── Cross-browser Testing             │
│  └── Performance Tests                 │
├─────────────────────────────────────────┤
│  🔗 Integration Tests                   │
│  ├── API Integration Tests             │
│  ├── Database Integration              │
│  └── Agent Communication Tests         │
├─────────────────────────────────────────┤
│  ⚡ Unit Tests (Vitest)                │
│  ├── Component Tests                   │
│  ├── Hook Tests                        │
│  ├── Utility Function Tests            │
│  └── Agent Logic Tests                 │
└─────────────────────────────────────────┘
```

### **Test Configuration**

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

---

## 🔄 CI/CD Pipeline

### **Workflow de Desarrollo**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   DEVELOP    │───▶│   STAGING    │───▶│ PRODUCTION   │
│              │    │              │    │              │
│ ✅ Unit Tests│    │ ✅ Integration│    │ ✅ E2E Tests │
│ ✅ Linting   │    │ ✅ Performance│    │ ✅ Security  │
│ ✅ Type Check│    │ ✅ Security   │    │ ✅ Monitoring│
└──────────────┘    └──────────────┘    └──────────────┘
```

### **GitHub Actions Example**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          docker build -t adaf-dashboard .
          docker push ${{ secrets.REGISTRY }}/adaf-dashboard:latest
```

---

## 🔮 Roadmap y Evolución

### **Próximas Características**

1. **Enhanced AI Integration**
   - GPT-4 integration for market analysis
   - Automated report generation
   - Predictive analytics

2. **Advanced Trading Features**
   - Multi-exchange arbitrage
   - Options trading support
   - DeFi yield farming optimization

3. **Scalability Improvements**
   - Microservices architecture
   - Kubernetes deployment
   - Multi-region support

4. **User Experience**
   - Mobile application
   - Real-time notifications
   - Customizable dashboards

---

## 📞 Contacto y Documentación

### **Enlaces Importantes**

- **Documentación Técnica**: `/docs/`
- **API Documentation**: `/api-docs`
- **Runbook**: `RUNBOOK.md`
- **Security Guide**: `SECURITY_README.md`

### **Comandos Rápidos**

```bash
# Desarrollo local completo
./inicio-completo.sh

# Solo ADAF Dashboard
pnpm dev

# Tests completos
pnpm test && pnpm test:e2e

# Build para producción
pnpm build

# Health check
pnpm health:deep
```

---

## 🎯 ADAF Dashboard - Sistema de Inteligencia Financiera Avanzada

### Documento de Arquitectura v1.0 - Actualizado: Octubre 2025
