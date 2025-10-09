# ======================================================================================
# LAV/ADAF Makefile - Orchestration and Development Tools
# ======================================================================================

.PHONY: help install build test clean docker start-core smoke-test deploy

# Default target
help:
	@echo "LAV/ADAF Monorepo - Available Commands:"
	@echo ""
	@echo "📦 Installation & Setup:"
	@echo "  install          Install all dependencies (Node.js + Python)"
	@echo "  setup            Initial setup: install + migrate + seed"
	@echo ""
	@echo "🏗️  Build & Development:"
	@echo "  build            Build all applications"
	@echo "  dev              Start development servers (all)"
	@echo "  dev-core         Start core services only"
	@echo "  dev-defi         Start DeFi services only"
	@echo "  dev-ml           Start ML/Intelligence services only"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test             Run all tests"
	@echo "  test-unit        Run unit tests only"
	@echo "  test-integration Run integration tests only"
	@echo "  test-e2e         Run end-to-end tests"
	@echo "  smoke-test       Quick health check"
	@echo ""
	@echo "🐳 Docker & Infrastructure:"
	@echo "  docker-build     Build all Docker images"
	@echo "  docker-up        Start infrastructure (DBs, Kafka, Grafana)"
	@echo "  docker-down      Stop all containers"
	@echo "  start-core       Start core services via Docker"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  deploy-staging   Deploy to staging environment"
	@echo "  deploy-prod      Deploy to production"
	@echo "  health-check     Check service health endpoints"
	@echo ""
	@echo "🛠️  Maintenance:"
	@echo "  clean            Clean build artifacts"
	@echo "  logs             View service logs"
	@echo "  db-migrate       Run database migrations"
	@echo "  db-seed          Seed databases with test data"

# ======================================================================================
# INSTALLATION & SETUP
# ======================================================================================

install:
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "🐍 Installing Python dependencies..."
	cd apps/alpha-factory && poetry install --no-dev
	cd apps/regime-detector && poetry install --no-dev
	cd apps/slippage-forecaster && poetry install --no-dev
	cd apps/capital-allocator && poetry install --no-dev
	cd apps/altdata-harvester && poetry install --no-dev

setup: install docker-up db-migrate db-seed
	@echo "✅ Setup complete! Run 'make start-core' to begin."

# ======================================================================================
# BUILD & DEVELOPMENT
# ======================================================================================

build:
	@echo "🏗️ Building all applications..."
	pnpm build

dev:
	@echo "🚀 Starting development servers..."
	pnpm dev

dev-core:
	@echo "🚀 Starting core services (Gateway, Market Sentinel, Risk Warden)..."
	pnpm dev:core

dev-defi:
	@echo "🚀 Starting DeFi services (Ranger, Basis Maker, Pendle)..."
	pnpm dev:defi

dev-ml:
	@echo "🚀 Starting ML services (Alpha Factory, Regime Detector)..."
	pnpm dev:ml

# ======================================================================================
# TESTING
# ======================================================================================

test:
	@echo "🧪 Running all tests..."
	pnpm test

test-unit:
	@echo "🧪 Running unit tests..."
	pnpm test:unit

test-integration:
	@echo "🧪 Running integration tests..."
	pnpm test:integration

test-e2e:
	@echo "🧪 Running end-to-end tests..."
	pnpm test:e2e

smoke-test:
	@echo "🔍 Running smoke tests..."
	@echo "Testing Gateway API..."
	@curl -f http://localhost:3000/api/status || echo "❌ Gateway not responding"
	@echo "Testing Market Sentinel..."
	@curl -f http://localhost:3010/health || echo "❌ Market Sentinel not responding"
	@echo "Testing Risk Warden..."
	@curl -f http://localhost:3012/health || echo "❌ Risk Warden not responding"
	@echo "✅ Smoke tests complete"

# ======================================================================================
# DOCKER & INFRASTRUCTURE
# ======================================================================================

docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build

docker-up:
	@echo "🐳 Starting infrastructure services..."
	docker compose --profile infra up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ Infrastructure ready"

docker-down:
	@echo "🐳 Stopping all containers..."
	docker compose down

start-core:
	@echo "🚀 Starting core LAV/ADAF services..."
	docker compose --profile core up -d

start-full:
	@echo "🚀 Starting full LAV/ADAF stack..."
	docker compose --profile full up -d

# ======================================================================================
# DATABASE OPERATIONS
# ======================================================================================

db-migrate:
	@echo "🗄️ Running database migrations..."
	cd infra && pnpm db:migrate

db-seed:
	@echo "🌱 Seeding databases with test data..."
	cd infra && pnpm db:seed

db-reset:
	@echo "🗄️ Resetting databases..."
	cd infra && pnpm db:reset

# ======================================================================================
# DEPLOYMENT
# ======================================================================================

deploy-staging:
	@echo "🚀 Deploying to staging..."
	docker compose -f docker-compose.staging.yml up -d --build

deploy-prod:
	@echo "🚀 Deploying to production..."
	@echo "⚠️  This will deploy to production. Are you sure? (y/N)"
	@read confirm && [ "$$confirm" = "y" ]
	docker compose -f docker-compose.prod.yml up -d --build

health-check:
	@echo "🏥 Checking service health..."
	@./scripts/health-check.sh

health-check-staging:
	@echo "🏥 Checking staging health..."
	@ENVIRONMENT=staging ./scripts/health-check.sh

# ======================================================================================
# MONITORING & LOGS
# ======================================================================================

logs:
	@echo "📋 Viewing service logs..."
	docker compose logs -f

logs-gateway:
	docker compose logs -f gateway

logs-market-sentinel:
	docker compose logs -f market-sentinel

logs-risk-warden:
	docker compose logs -f risk-warden

monitor:
	@echo "📊 Opening monitoring dashboards..."
	@open http://localhost:3001  # Grafana
	@open http://localhost:9090  # Prometheus

# ======================================================================================
# MAINTENANCE & CLEANUP
# ======================================================================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	pnpm clean
	docker system prune -f
	docker volume prune -f

lint:
	@echo "🔍 Running linters..."
	pnpm lint

lint-fix:
	@echo "🔧 Fixing lint issues..."
	pnpm lint:fix

typecheck:
	@echo "🔍 Type checking..."
	pnpm typecheck

# ======================================================================================
# UTILITY COMMANDS
# ======================================================================================

ps:
	@echo "📋 Running services:"
	docker compose ps

top:
	@echo "📊 Resource usage:"
	docker stats

shell-gateway:
	docker compose exec gateway sh

shell-postgres:
	docker compose exec postgres psql -U lav_user -d lav_adaf_db

shell-redis:
	docker compose exec redis redis-cli

# ======================================================================================
# DEVELOPMENT UTILITIES
# ======================================================================================

generate-mocks:
	@echo "🎭 Generating mock data..."
	cd scripts && node generate-mocks.js

reset-kafka:
	@echo "🔄 Resetting Kafka topics..."
	docker compose restart kafka
	@sleep 5
	cd scripts && node setup-kafka-topics.js

backup-db:
	@echo "💾 Backing up database..."
	docker compose exec postgres pg_dump -U lav_user lav_adaf_db > backup_$$(date +%Y%m%d_%H%M%S).sql

# ======================================================================================
# CI/CD HELPERS
# ======================================================================================

ci-install: install

ci-test: test lint typecheck

ci-build: build

ci-deploy: docker-build

# ======================================================================================
# HELP SHORTCUTS
# ======================================================================================

status: health-check

up: docker-up start-core

down: docker-down

restart: down up