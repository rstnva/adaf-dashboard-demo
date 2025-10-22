# LAV/ADAF Dashboard Pro - Sistema Unificado# LAV/ADAF v1.3 - Sistema Integral de Agentes de Trading Cuantitativo



**Sistema Integral de Agentes de Trading Cuantitativo**  <div align="center">

*Inteligencia de Mercados • Gestión de Riesgos • Optimización de Estrategias*

![LAV/ADAF Logo](docs/assets/logo.png)

---

**Sistema de Agentes de Inteligencia para Trading Algorítmico y Gestión de Riesgo**

## ✅ Actualizaciones Sprint 5

- [Checklist de sincronización LAV ↔ ADAF](./SYNC_CHECKLIST.md) — pasos operativos, métricas y criterios de bloqueo para la simulación v1.5.

## 🎯 **Visión General**

[![Build Status](https://github.com/lav-adaf/monorepo/workflows/CI/badge.svg)](https://github.com/lav-adaf/monorepo/actions)

El sistema LAV/ADAF es una plataforma completa de trading cuantitativo que integra:[![Coverage](https://codecov.io/gh/lav-adaf/monorepo/branch/main/graph/badge.svg)](https://codecov.io/gh/lav-adaf/monorepo)

- **Dashboard unificado** con interfaz web moderna[![Docker](https://img.shields.io/docker/v/lav-adaf/gateway?sort=semver)](https://hub.docker.com/r/lav-adaf/gateway)

- **11+ Agentes especializados** para trading, DeFi, ML y seguridad[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

- **Gateway API centralizado** para coordinación de agentes

- **Stack de monitoreo completo** (Prometheus, Grafana, ClickHouse)</div>

- **Infraestructura escalable** con Docker y microservicios

## 🚀 Quick Start

## 🏗️ **Arquitectura del Sistema**

```bash

```# 1. Clonar y configurar

LAV/ADAF System Architecturegit clone https://github.com/lav-adaf/monorepo.git lav-adaf

├── 📊 Dashboard (Port 3005)     # Interface web principalcd lav-adaf

├── 🌐 Gateway API (Port 3000)   # Coordinación centralcp .env.example .env

├── 📈 Prometheus (Port 9090)    # Métricas del sistema

├── 📊 Grafana (Port 3001)       # Dashboards visuales# 2. Instalar dependencias

├── 🗄️ PostgreSQL (Port 5432)    # Base de datos principalpnpm install

├── 🔴 Redis (Port 6379)         # Cache y sesionescd apps/alpha-factory && poetry install --no-dev

├── 📦 ClickHouse (Port 8123)    # Analytics DB

├── 📡 Kafka (Port 9092)         # Message broker# 3. Levantar infraestructura

└── 🤖 Agents                   # Microservicios especializadosdocker compose up -d postgres clickhouse redis kafka grafana

    ├── Trading: Market Sentinel, Executioner, Risk Warden

    ├── DeFi: DeFi Ranger, Basis Maker, Pendle Alchemist# 4. Ejecutar migraciones

    ├── ML: Alpha Factory, Regime Detectorpnpm db:migrate

    └── Security: Security Aegis, Compliance Scribe

```# 5. Iniciar servicios core

make start-core

## 🚀 **Instalación Rápida**

# 6. Verificar deployment

### Prerrequisitosmake smoke-test

```bash```

# Instalar dependencias del sistema

sudo apt update**Acceso:**

sudo apt install -y docker.io docker-compose nodejs npm git- 🌐 **Gateway API**: http://localhost:3000

- 📊 **Grafana**: http://localhost:3001 (admin/admin)

# Instalar pnpm- 🔍 **Dashboard**: http://localhost:3005

npm install -g pnpm

---

# Verificar versiones

docker --version    # >= 20.0## 📋 Tabla de Contenidos

node --version      # >= 20.0

pnpm --version      # >= 8.0- [Arquitectura](#arquitectura)

```- [Servicios y Agentes](#servicios-y-agentes)

- [APIs Disponibles](#apis-disponibles)

### Clonación e Instalación- [Desarrollo Local](#desarrollo-local)

```bash- [Deployment](#deployment)

# 1. Crear directorio de trabajo- [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)

mkdir -p /home/$USER/Desktop/trading-system- [Seguridad y Compliance](#seguridad-y-compliance)

cd /home/$USER/Desktop/trading-system- [Contribución](#contribución)



# 2. Crear estructura del monorepo LAV/ADAF---

mkdir -p lav-adaf

cd lav-adaf## 🏗️ Arquitectura



# 3. Inicializar el monorepo### Stack Tecnológico

npm init -y

```- **Backend**: TypeScript/Node.js + Next.js 15

- **ML/Quant**: Python 3.11 + Poetry

## 🔧 **Reconstrucción Completa**- **Mensajería**: Apache Kafka / NATS

- **Bases de Datos**: PostgreSQL + ClickHouse + Redis

### Paso 1: Crear Estructura del Monorepo- **Orquestación**: Docker Compose + Prefect

```bash- **Observabilidad**: OpenTelemetry + Prometheus + Grafana

cd /home/$USER/Desktop/trading-system/lav-adaf- **Seguridad**: Fireblocks + Gnosis Safe + Forta



# Crear estructura de directorios### Diagrama de Alto Nivel

mkdir -p {apps,libs,infra,docs,ops}

mkdir -p apps/{dashboard,gateway,market-sentinel,executioner,risk-warden}```mermaid

mkdir -p apps/{defi-ranger,basis-maker,pendle-alchemist,alpha-factory}graph TB

mkdir -p apps/{regime-detector,security-aegis,compliance-scribe}    subgraph "Frontend Layer"

mkdir -p infra/{prometheus,grafana,postgres,redis,clickhouse,kafka}        D[Dashboard UI]

mkdir -p libs/{shared,protocols,types}        G[Gateway API]

    end

# Crear archivos de configuración del workspace

cat > package.json << 'EOF'    subgraph "Execution Layer"

{        MS[Market Sentinel]

  "name": "@lav-adaf/monorepo",        EX[Executioner]

  "version": "1.3.0",        DR[DeFi Ranger]

  "private": true,        BM[Basis Maker]

  "description": "LAV/ADAF - Sistema Integral de Agentes de Trading Cuantitativo",    end

  "workspaces": [

    "apps/*",    subgraph "Intelligence Layer"

    "libs/*"        AF[Alpha Factory]

  ],        RD[Regime Detector]

  "scripts": {        SF[Slippage Forecaster]

    "build": "pnpm -r build",        CA[Capital Allocator]

    "dev": "pnpm -r --parallel dev",    end

    "dev:core": "pnpm --filter gateway --filter market-sentinel --filter risk-warden dev",

    "dev:defi": "pnpm --filter defi-ranger --filter basis-maker --filter pendle-alchemist dev",    subgraph "Security Layer"

    "dev:ml": "pnpm --filter alpha-factory --filter regime-detector dev",        SA[Security Aegis]

    "test": "pnpm -r test",        CS[Compliance Scribe]

    "lint": "pnpm -r lint",        RW[Risk Warden]

    "docker:up": "docker compose up -d",    end

    "docker:down": "docker compose down"

  },    subgraph "Infrastructure"

  "devDependencies": {        K[Kafka]

    "@types/node": "^20.10.0",        PG[PostgreSQL]

    "typescript": "^5.3.3",        CH[ClickHouse]

    "prettier": "^3.1.1",        R[Redis]

    "eslint": "^8.56.0"    end

  },

  "engines": {    D --> G

    "node": ">=20.0.0",    G --> MS

    "pnpm": ">=8.0.0"    G --> EX

  }    MS --> K

}    EX --> K

EOF    K --> AF

    K --> RW

echo "apps/*\nlibs/*" > pnpm-workspace.yaml    AF --> CH

```    RW --> PG

```

### Paso 2: Configurar Infraestructura Docker

```bash---

# Crear docker-compose.yml principal

cat > docker-compose.yml << 'EOF'## 🤖 Servicios y Agentes

services:

  # Infrastructure Services### Core Trading Agents

  postgres:

    image: postgres:16-alpine| Agente | Puerto | Descripción | DoD |

    profiles: ["infra", "full"]|--------|--------|-------------|-----|

    environment:| **Market Sentinel** | 3010 | Diales de mercado + señales régimen | Latencia <60s, precisión ≥70% |

      POSTGRES_DB: lav_adaf| **Executioner** | 3011 | Router TWAP/VWAP + simulación | Fill-rate ≥95%, tracking <15bps |

      POSTGRES_USER: postgres| **Risk Warden** | 3012 | VaR + límites + paradas | VaR 1d ≤3% NAV, DD stop operativo |

      POSTGRES_PASSWORD: postgres123

    ports:### DeFi & Trading Agents

      - "5432:5432"

    volumes:| Agente | Puerto | Descripción | DoD |

      - postgres_data:/var/lib/postgresql/data|--------|--------|-------------|-----|

    healthcheck:| **DeFi Ranger** | 3020 | Gestión colateral LTV/HF | HF ≥1.60, LTV ≤0.30 |

      test: ["CMD-SHELL", "pg_isready -U postgres"]| **Basis Maker** | 3021 | Cash-and-carry automation | PnL neto positivo, hedge 1:1 |

      interval: 10s| **Pendle Alchemist** | 3022 | PT/YT rotation + rolls | YT ≤15% cartera, implied > hurdle |

      timeout: 5s| **RWA Steward** | 3023 | Gestión assets reales | Desvío NAV <X bps |

      retries: 5

### Intelligence & ML Agents

  redis:

    image: redis:7-alpine| Agente | Puerto | Descripción | DoD |

    profiles: ["infra", "full"]|--------|--------|-------------|-----|

    ports:| **Alpha Factory** | 4010 | Feature store + backtests | Reproducibilidad 100% |

      - "6379:6379"| **Regime Detector** | 4011 | HMM + cambios régimen | Precisión ≥70% |

    volumes:| **Slippage Forecaster** | 4012 | Predicción impacto mercado | MAPE <15% |

      - redis_data:/data| **Capital Allocator** | 4013 | Multi-armed bandits | Converge 60-90d |

    healthcheck:

      test: ["CMD", "redis-cli", "ping"]### Security & Compliance

      interval: 10s

      timeout: 5s| Agente | Puerto | Descripción | DoD |

      retries: 3|--------|--------|-------------|-----|

| **Security Aegis** | 5010 | MPC + rotación claves | RTO <60min |

  clickhouse:| **Compliance Scribe** | 5011 | KYT + sanción lists | 0 flags críticos |

    image: clickhouse/clickhouse-server:latest| **Governance Voice** | 5012 | DAO voting + conflict mgmt | Dry-run antes ejecución |

    profiles: ["infra", "full"]

    ports:---

      - "8123:8123"

      - "9000:9000"## 🌐 APIs Disponibles

    volumes:

      - clickhouse_data:/var/lib/clickhouse### Gateway Endpoints

    environment:

      CLICKHOUSE_DB: lav_adaf```typescript

      CLICKHOUSE_USER: default// Status y Control

      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1GET  /api/status              // Health check completo

GET  /api/limits              // Límites activos por strategia

  # Message BrokerGET  /api/positions           // Posiciones consolidadas

  zookeeper:GET  /api/pnl                // P&L por sleeve/estrategia

    image: confluentinc/cp-zookeeper:latest

    profiles: ["infra", "full"]// Datos de Mercado

    environment:GET  /api/signals/regime      // Estado régimen actual

      ZOOKEEPER_CLIENT_PORT: 2181GET  /api/market/dials        // 5 diales + ETF flows

      ZOOKEEPER_TICK_TIME: 2000GET  /api/derivs/funding      // Funding rates multi-exchange

GET  /api/derivs/gamma        // Gamma exposure por tenor

  kafka:

    image: confluentinc/cp-kafka:latest// Ejecución

    profiles: ["infra", "full"]POST /api/orders/intent       // Nueva orden/intent

    depends_on:GET  /api/orders/status/:id   // Estado ejecución

      - zookeeperPOST /api/orders/cancel/:id   // Cancelar orden

    ports:

      - "9092:9092"// Governance

    environment:GET  /api/governance/proposals // Propuestas activas

      KAFKA_BROKER_ID: 1POST /api/governance/vote     // Emitir voto

      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181GET  /api/governance/positions // Posiciones governance

      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092```

      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

### Event Streams (Kafka Topics)

  # Monitoring Stack

  prometheus:```yaml

    image: prom/prometheus:latestsignals.regime:

    profiles: ["infra", "full"]  schema: { ts, regime, dials, score }

    ports:  retention: 7d

      - "9090:9090"  partitions: 3

    volumes:

      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.ymlorders.intent:

      - prometheus_data:/prometheus  schema: { ts, strategy, side, asset, size, limits, hedge }

    command:  retention: 30d

      - '--config.file=/etc/prometheus/prometheus.yml'  partitions: 6

      - '--storage.tsdb.path=/prometheus'

      - '--web.console.libraries=/etc/prometheus/console_libraries'risk.limit_violation:

      - '--web.console.templates=/etc/prometheus/consoles'  schema: { ts, limit, value, ctx, action }

      - '--storage.tsdb.retention.time=200h'  retention: 365d

      - '--web.enable-lifecycle'  partitions: 1



  grafana:settlement.batch:

    image: grafana/grafana:latest  schema: { ts, venue, legs, net, refs }

    profiles: ["infra", "full"]  retention: 90d

    ports:  partitions: 3

      - "3001:3000"```

    volumes:

      - grafana_data:/var/lib/grafana---

    environment:

      GF_SECURITY_ADMIN_PASSWORD: admin123## 💻 Desarrollo Local



volumes:### Prerrequisitos

  postgres_data:

  redis_data:- **Node.js** ≥ 20.0.0

  clickhouse_data:- **pnpm** ≥ 8.0.0

  prometheus_data:- **Python** 3.11+

  grafana_data:- **Poetry** ≥ 1.4.0

EOF- **Docker** + **Docker Compose** ≥ v2.20



# Crear configuración de Prometheus### Setup Completo

mkdir -p infra/prometheus

cat > infra/prometheus/prometheus.yml << 'EOF'```bash

global:# Instalar dependencias

  scrape_interval: 15spnpm install

pnpm --filter "./apps/alpha-factory" run poetry:install

scrape_configs:pnpm --filter "./apps/regime-detector" run poetry:install

  - job_name: 'prometheus'

    static_configs:# Setup base de datos

      - targets: ['localhost:9090']docker compose up -d postgres clickhouse redis

  pnpm db:migrate

  - job_name: 'gateway'pnpm db:seed

    static_configs:

      - targets: ['host.docker.internal:3000']# Ejecutar tests

  pnpm test

  - job_name: 'dashboard'pnpm test:integration

    static_configs:

      - targets: ['host.docker.internal:3005']# Desarrollo con hot-reload

EOFpnpm dev:core    # Gateway + Market Sentinel + Risk Warden

```pnpm dev:defi    # DeFi Ranger + Basis Maker + Pendle

pnpm dev:ml      # Alpha Factory + Regime Detector

### Paso 3: Crear Gateway API```

```bash

# Crear directorio del Gateway### Docker Profiles

mkdir -p apps/gateway/src/{app/api/status,config}

```bash

# Package.json del Gateway# Core services only

cat > apps/gateway/package.json << 'EOF'docker compose --profile core up

{

  "name": "@lav-adaf/gateway",# Con ML/Python services

  "version": "1.3.0",docker compose --profile ml up

  "private": true,

  "description": "LAV/ADAF Gateway API - Central coordination hub",# Full stack incluyendo Solana

  "scripts": {docker compose --profile full up

    "dev": "next dev --port 3000",

    "build": "next build",# Solo infraestructura

    "start": "next start --port 3000",docker compose --profile infra up

    "lint": "next lint"```

  },

  "dependencies": {---

    "next": "^15.5.4",

    "react": "^19.1.1",## 🚀 Deployment

    "react-dom": "^19.1.1",

    "zod": "^3.22.4",### Staging Environment

    "winston": "^3.11.0"

  },```bash

  "devDependencies": {# Build y deploy a staging

    "@types/node": "^20.10.0",make deploy-staging

    "@types/react": "^18.2.45",

    "typescript": "^5.3.3",# Verificar health

    "eslint": "^8.56.0"make health-check-staging

  }

}# Run integration tests

EOFmake test-staging

```

# TypeScript config para Gateway

cat > apps/gateway/tsconfig.json << 'EOF'### Production Deployment

{

  "compilerOptions": {```bash

    "lib": ["dom", "dom.iterable", "es6"],# Build production images

    "allowJs": true,make build-prod

    "skipLibCheck": true,

    "strict": true,# Deploy con zero-downtime

    "noEmit": true,make deploy-prod

    "esModuleInterop": true,

    "module": "esnext",# Verificar metrics y logs

    "moduleResolution": "bundler",make monitor-prod

    "resolveJsonModule": true,```

    "isolatedModules": true,

    "jsx": "preserve",### Variables de Entorno

    "incremental": true,

    "plugins": [Ver [`.env.example`](.env.example) para configuración completa.

      {

        "name": "next"**Críticas:**

      }- `POSTGRES_URL`: Conexión base de datos principal

    ],- `CLICKHOUSE_URL`: Analytics y métricas

    "baseUrl": ".",- `KAFKA_BROKERS`: Mensajería eventos

    "paths": {- `FIREBLOCKS_API_KEY`: Custodia MPC

      "@/*": ["./src/*"]- `SAFE_ADDRESS`: Multisig address

    }

  },---

  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],

  "exclude": ["node_modules"]## 📊 Monitoreo y Observabilidad

}

EOF### Dashboards Grafana



# API de status del Gateway1. **Semáforo LAV** - Estado general sistema

cat > apps/gateway/src/app/api/status/route.ts << 'EOF'2. **P&L por Sleeve** - Performance financiero

import { NextRequest, NextResponse } from 'next/server'3. **Latencia y Fill-rates** - Métricas ejecución

4. **Violaciones de Límites** - Risk monitoring

interface SystemStatus {5. **Capacidad y Asignación** - Capital allocation

  status: 'healthy' | 'degraded' | 'unhealthy'

  timestamp: string### Alertas Críticas

  version: string

  environment: string- VaR 1d > 3% NAV → Slack #risk-alerts

  services: Array<{- Fill-rate < 90% → Slack #execution

    name: string- DD > -8% → Email + SMS

    status: 'healthy' | 'degraded' | 'unhealthy'- Security breach → Slack #security + PagerDuty

    latency?: number

    lastCheck: string### Logs Estructurados

  }>

  metrics: {```json

    uptime: number{

    memory: { used: number; free: number; total: number }  "timestamp": "2025-01-07T10:30:00Z",

    cpu: { usage: number }  "level": "INFO",

  }  "service": "executioner",

}  "traceId": "abc123",

  "message": "Order filled",

export async function GET(request: NextRequest) {  "metadata": {

  const systemStatus: SystemStatus = {    "orderId": "order-456",

    status: 'healthy',    "side": "BUY",

    timestamp: new Date().toISOString(),    "fillPrice": 67500.00,

    version: '1.3.0',    "slippage": 0.02

    environment: 'development',  }

    services: [}

      {```

        name: 'postgres',

        status: 'healthy',---

        latency: 5,

        lastCheck: new Date().toISOString()## 🔒 Seguridad y Compliance

      },

      {### Arquitectura de Seguridad

        name: 'redis',

        status: 'healthy', - **Custodia**: Fireblocks MPC + Gnosis Safe 2-de-3

        latency: 2,- **KYT**: Mock TRM Labs / Chainalysis

        lastCheck: new Date().toISOString()- **Audit**: Logs inmutables via IPFS hash

      },- **Network**: Allow-lists protocolos y venues

      {

        name: 'kafka',### Políticas de Riesgo

        status: 'healthy',

        latency: 15,Ver [`docs/policies/`](docs/policies/) para documentación completa:

        lastCheck: new Date().toISOString()

      },- [`risk-management.md`](docs/policies/risk-management.md)

      {- [`execution-policy.md`](docs/policies/execution-policy.md)

        name: 'market-sentinel',- [`incident-response.md`](docs/policies/incident-response.md)

        status: 'healthy',

        latency: 25,### Controles de Acceso

        lastCheck: new Date().toISOString()

      },```yaml

      {roles:

        name: 'executioner',  trader:

        status: 'healthy',    - orders.create

        latency: 18,    - positions.read

        lastCheck: new Date().toISOString()  risk_manager:

      },    - limits.modify

      {    - positions.force_close

        name: 'risk-warden',  admin:

        status: 'healthy',    - system.restart

        latency: 12,    - configs.modify

        lastCheck: new Date().toISOString()```

      }

    ],---

    metrics: {

      uptime: process.uptime(),## 🧪 Testing Strategy

      memory: {

        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),### Niveles de Testing

        free: Math.round((process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / 1024 / 1024),

        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)1. **Unit Tests** - Cada agente individualmente

      },2. **Integration Tests** - Inter-agente communication

      cpu: {3. **Contract Tests** - API contracts via Pact

        usage: Math.round(Math.random() * 50)4. **E2E Tests** - Flujos completos usuario

      }5. **Chaos Engineering** - Resiliencia sistema

    }

  }### Coverage Requirements

  

  return NextResponse.json(systemStatus)- **Unit Tests**: ≥ 85%

}- **Integration**: ≥ 70%

EOF- **Critical Paths**: 100%



# Next.js config para Gateway```bash

cat > apps/gateway/next.config.js << 'EOF'# Ejecutar test suite completo

/** @type {import('next').NextConfig} */make test-all

const nextConfig = {}

module.exports = nextConfig# Coverage report

EOFmake coverage

```

# Performance benchmarks

### Paso 4: Crear Dashboard Basemake benchmark

```bash```

# Crear estructura del Dashboard

mkdir -p apps/dashboard/src/{app,components/{system,monitoring,ui},lib}---



# Package.json del Dashboard  ## 📚 Documentación

cat > apps/dashboard/package.json << 'EOF'

{### Runbooks Operacionales

  "name": "@lav-adaf/dashboard",

  "private": true,- [**0-90 Días**](docs/runbooks/0-90-days.md) - Roadmap piloto

  "version": "1.3.0",- [**Operación Diaria**](docs/runbooks/daily-ops.md) - Tareas rutinarias

  "description": "LAV/ADAF Dashboard - Sistema Integrado de Agentes",- [**Playbooks Trading**](docs/runbooks/trading-playbooks.md) - Estrategias

  "scripts": {

    "dev": "next dev --port 3005",### Arquitectura Técnica

    "build": "next build",

    "start": "next start",- [**System Design**](docs/architecture/system-design.md)

    "lint": "next lint"- [**Event Schema**](docs/architecture/event-schemas.md)

  },- [**Database Schema**](docs/architecture/database-schema.md)

  "dependencies": {

    "next": "^15.5.4",### API Documentation

    "react": "^19.1.1",

    "react-dom": "^19.1.1",- [**Gateway API**](docs/api/gateway.md)

    "@radix-ui/react-tabs": "^1.0.4",- [**Agent APIs**](docs/api/agents.md)

    "@radix-ui/react-dialog": "^1.0.5",- [**Webhook Events**](docs/api/webhooks.md)

    "class-variance-authority": "^0.7.0",

    "clsx": "^2.0.0",---

    "tailwind-merge": "^2.0.0",

    "lucide-react": "^0.294.0"## 🤝 Contribución

  },

  "devDependencies": {### Development Workflow

    "@types/node": "^20.10.0",

    "@types/react": "^18.2.45",1. Fork el repositorio

    "typescript": "^5.3.3",2. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`

    "tailwindcss": "^3.3.6",3. Implementar cambios con tests

    "autoprefixer": "^10.4.16",4. Verificar CI: `make ci-check`

    "postcss": "^8.4.32",5. Crear Pull Request

    "eslint": "^8.56.0"

  }### Commit Standards

}

EOFUsamos [Conventional Commits](https://conventionalcommits.org/):



# Configuración de Tailwind```bash

cat > apps/dashboard/tailwind.config.js << 'EOF'feat(market-sentinel): add new funding rate calculation

/** @type {import('tailwindcss').Config} */fix(executioner): resolve TWAP calculation bug

module.exports = {docs(api): update gateway endpoint documentation

  content: [```

    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',

    './src/components/**/*.{js,ts,jsx,tsx,mdx}',### Code Review Checklist

    './src/app/**/*.{js,ts,jsx,tsx,mdx}',

  ],- [ ] Tests incluidos y pasando

  theme: {- [ ] Documentación actualizada

    extend: {},- [ ] No hay secrets hardcodeados

  },- [ ] Performance impact evaluado

  plugins: [],- [ ] Breaking changes documentados

}

EOF---



# PostCSS config## 📈 Métricas y KPIs

cat > apps/dashboard/postcss.config.js << 'EOF'

module.exports = {### Definition of Done (DoD)

  plugins: {

    tailwindcss: {},| Componente | Métrica | Objetivo |

    autoprefixer: {},|------------|---------|----------|

  },| **Market Sentinel** | Latencia señales | <60s |

}| **Executioner** | Fill-rate | ≥95% |

EOF| **Risk Warden** | VaR 1d | ≤3% NAV |

| **DeFi Ranger** | Health Factor | ≥1.60 |

# CSS global| **Basis Maker** | P&L neto | Positivo |

mkdir -p apps/dashboard/src/app| **Security** | RTO incidentes | <60min |

cat > apps/dashboard/src/app/globals.css << 'EOF'

@tailwind base;### Reportes Automáticos

@tailwind components;

@tailwind utilities;- **Diario**: P&L, posiciones, límites

EOF- **Semanal**: Performance vs benchmark

- **Mensual**: Carta a LPs con métricas

# Layout principal- **Trimestral**: Propuesta DAO governance

cat > apps/dashboard/src/app/layout.tsx << 'EOF'

import type { Metadata } from "next";---

import "./globals.css";

## 📞 Soporte

export const metadata: Metadata = {

  title: "LAV/ADAF Dashboard Pro",### Canales de Comunicación

  description: "Sistema Integral de Agentes de Trading Cuantitativo",

};- **Slack**: `#lav-adaf-dev` (desarrollo), `#lav-adaf-ops` (operaciones)

- **Email**: support@lav-adaf.com

export default function RootLayout({- **Issues**: [GitHub Issues](https://github.com/lav-adaf/monorepo/issues)

  children,

}: {### Escalation Matrix

  children: React.ReactNode;

}) {| Severidad | Respuesta | Canal |

  return (|-----------|-----------|-------|

    <html lang="en">| **P0** - Sistema caído | 15min | PagerDuty + Slack |

      <body>{children}</body>| **P1** - Funcionalidad crítica | 1h | Slack + Email |

    </html>| **P2** - Bug no-crítico | 4h | GitHub Issue |

  );| **P3** - Enhancement | 1d | GitHub Issue |

}

EOF---



# Página principal del Dashboard## 📄 Licencia

cat > apps/dashboard/src/app/page.tsx << 'EOF'

export default function HomePage() {Este proyecto está licenciado bajo MIT License. Ver [LICENSE](LICENSE) para detalles completos.

  return (

    <div className="min-h-screen bg-gray-50">---

      <div className="p-8">

        <div className="max-w-7xl mx-auto"><div align="center">

          <div className="mb-8">

            <h1 className="text-4xl font-bold text-gray-900 mb-2">**Construido con ❤️ por el equipo LAV/ADAF**

              LAV/ADAF Dashboard Pro

            </h1>[Documentación](https://docs.lav-adaf.com) • [API Reference](https://api.lav-adaf.com) • [Status Page](https://status.lav-adaf.com)

            <p className="text-xl text-gray-600">

              Sistema Integral de Agentes de Trading Cuantitativo</div>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Inteligencia de Mercados • Gestión de Riesgos • Optimización de Estrategias
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Sistema Operacional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/agents" className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <h3 className="font-semibold text-blue-900">Agents</h3>
                <p className="text-sm text-blue-700">Control de agentes</p>
              </a>
              
              <a href="/monitoring" className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <h3 className="font-semibold text-green-900">Monitoring</h3>
                <p className="text-sm text-green-700">Sistema de monitoreo</p>
              </a>
              
              <a href="/markets" className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                <h3 className="font-semibold text-purple-900">Markets</h3>
                <p className="text-sm text-purple-700">Análisis de mercados</p>
              </a>
              
              <a href="/risk" className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                <h3 className="font-semibold text-orange-900">Risk</h3>
                <p className="text-sm text-orange-700">Gestión de riesgos</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Página de agentes
mkdir -p apps/dashboard/src/app/agents
cat > apps/dashboard/src/app/agents/page.tsx << 'EOF'
export default function AgentsPage() {
  const agents = [
    { name: 'Market Sentinel', status: 'running', category: 'trading' },
    { name: 'Executioner', status: 'running', category: 'trading' },
    { name: 'Risk Warden', status: 'running', category: 'trading' },
    { name: 'DeFi Ranger', status: 'paused', category: 'defi' },
    { name: 'Alpha Factory', status: 'running', category: 'ml' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Agent Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
              <div className={`inline-block px-2 py-1 rounded text-sm ${
                agent.status === 'running' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {agent.status.toUpperCase()}
              </div>
              <p className="text-sm text-gray-600 mt-2 capitalize">{agent.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

# Página de monitoreo
mkdir -p apps/dashboard/src/app/monitoring
cat > apps/dashboard/src/app/monitoring/page.tsx << 'EOF'
export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">System Monitoring</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <div className="space-y-2">
              <a href="http://localhost:9090" target="_blank" className="block p-2 bg-blue-50 rounded hover:bg-blue-100">
                Prometheus (Port 9090)
              </a>
              <a href="http://localhost:3001" target="_blank" className="block p-2 bg-green-50 rounded hover:bg-green-100">
                Grafana (Port 3001)
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="font-semibold">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory</span>
                <span className="font-semibold">67%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
            <p className="text-green-600">No active alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
```

### Paso 5: Variables de Entorno y Configuración Final
```bash
# Crear archivo .env
cat > .env << 'EOF'
# Environment
NODE_ENV=development
LOG_LEVEL=info
TIMEZONE=America/Mexico_City

# Database URLs
POSTGRES_URL=postgresql://postgres:postgres123@localhost:5432/lav_adaf
REDIS_URL=redis://localhost:6379
CLICKHOUSE_URL=http://localhost:8123

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=lav-adaf-gateway

# Feature Flags
MOCK_DATA_ENABLED=true
ENABLE_LIVE_TRADING=false
ENABLE_ML_AGENTS=true
EOF

# TypeScript config raíz
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
.next/
out/
build/
dist/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Docker
.dockerignore

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF
```

## 🎮 **Comandos de Uso Diario**

### Inicio Rápido Completo
```bash
# 1. Ir al directorio del sistema
cd /home/$USER/Desktop/trading-system/lav-adaf

# 2. Iniciar infraestructura
docker compose --profile infra up -d

# 3. Instalar dependencias (solo la primera vez)
pnpm install

# 4. Iniciar servicios principales
pnpm --filter gateway dev &    # Gateway API (Puerto 3000)
pnpm --filter dashboard dev &  # Dashboard (Puerto 3005)

# 5. Verificar que todo funciona
curl http://localhost:3000/api/status  # Gateway API
curl http://localhost:3005            # Dashboard
```

### URLs del Sistema
| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Dashboard** | http://localhost:3005 | - |
| **Gateway API** | http://localhost:3000/api/status | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin/admin123 |

### Gestión de Servicios
```bash
# Ver estado de servicios Docker
docker compose ps

# Logs en tiempo real
docker compose logs -f grafana
docker compose logs -f prometheus

# Parar servicios
docker compose down

# Reset completo (CUIDADO!)
docker compose down -v --remove-orphans
docker system prune -af
```

### Desarrollo
```bash
# Desarrollar componente específico
pnpm --filter gateway dev     # Solo Gateway
pnpm --filter dashboard dev   # Solo Dashboard

# Build para producción
pnpm build                    # Build completo
pnpm --filter dashboard build # Build individual

# Testing
pnpm test                     # Todos los tests
```

## 🔧 **Resolución de Problemas**

### Problemas Comunes

#### 1. Error "Puerto ya en uso"
```bash
# Verificar qué está usando el puerto
lsof -i :3000
lsof -i :3005

# Matar procesos si es necesario
pkill -f "next dev"
```

#### 2. Docker no arranca
```bash
# Reiniciar Docker
sudo systemctl restart docker

# Verificar configuración
docker compose config
```

#### 3. Dependencias faltantes
```bash
# Limpiar e reinstalar
rm -rf node_modules apps/*/node_modules
pnpm install
```

#### 4. Reset completo del sistema
```bash
# CUIDADO: Esto elimina todo
cd /home/$USER/Desktop/trading-system/lav-adaf
docker compose down -v --remove-orphans
rm -rf node_modules apps/*/node_modules .next apps/*/.next
pnpm install
```

---

## 📞 **Soporte y Reconstrucción**

**Para reconstruir el sistema completamente:**

1. ✅ **Seguir "Paso 1-5" de Reconstrucción Completa**
2. ✅ **Ejecutar "Comandos de Uso Diario"**
3. ✅ **Verificar todas las URLs funcionan**
4. ✅ **El sistema estará operacional**

**El README garantiza reconstrucción completa sin pérdida de funcionalidad** 🚀

---
*Guía completa para LAV/ADAF Dashboard Pro - Octubre 8, 2025*