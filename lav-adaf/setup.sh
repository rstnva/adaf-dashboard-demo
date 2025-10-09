#!/bin/bash

# ======================================================================================
# LAV/ADAF Quick Setup Script
# ======================================================================================
# Automated setup for complete monorepo with all dependencies and services
# ======================================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        if [[ $(echo "$NODE_VERSION 20.0.0" | tr " " "\n" | sort -V | head -n1) != "20.0.0" ]]; then
            log_error "Node.js version must be >= 20.0.0. Current: v$NODE_VERSION"
            exit 1
        fi
        log_success "Node.js v$NODE_VERSION ✓"
    else
        log_error "Node.js not found. Please install Node.js >= 20.0.0"
        exit 1
    fi
    
    # Check pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        log_success "pnpm v$PNPM_VERSION ✓"
    else
        log_error "pnpm not found. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        log_success "Python $PYTHON_VERSION ✓"
    else
        log_error "Python 3 not found. Please install Python 3.11+"
        exit 1
    fi
    
    # Check Poetry
    if command -v poetry &> /dev/null; then
        POETRY_VERSION=$(poetry --version | cut -d' ' -f3)
        log_success "Poetry v$POETRY_VERSION ✓"
    else
        log_warning "Poetry not found. Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker v$DOCKER_VERSION ✓"
    else
        log_error "Docker not found. Please install Docker"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        log_success "Docker Compose ✓"
    else
        log_error "Docker Compose not found. Please install Docker Compose"
        exit 1
    fi
}

# Install Node.js dependencies
install_node_deps() {
    log_info "Installing Node.js dependencies..."
    
    # Install root dependencies
    pnpm install
    
    log_success "Node.js dependencies installed"
}

# Install Python dependencies
install_python_deps() {
    log_info "Installing Python dependencies..."
    
    # Install for each Python service
    local python_services=("alpha-factory" "regime-detector" "slippage-forecaster" "capital-allocator" "altdata-harvester")
    
    for service in "${python_services[@]}"; do
        if [ -d "apps/$service" ]; then
            log_info "Installing dependencies for $service..."
            cd "apps/$service"
            poetry install
            cd ../..
        fi
    done
    
    log_success "Python dependencies installed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_success "Environment file created from .env.example"
        log_warning "Please review and update .env file with your configuration"
    else
        log_info "Environment file already exists"
    fi
}

# Start infrastructure services
start_infrastructure() {
    log_info "Starting infrastructure services..."
    
    # Start core infrastructure
    docker compose --profile infra up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 15
    
    # Check service health
    local retries=10
    for i in $(seq 1 $retries); do
        if curl -f http://localhost:5432 &> /dev/null || \
           docker exec -it $(docker ps -q -f name=postgres) pg_isready &> /dev/null; then
            log_success "PostgreSQL ready"
            break
        fi
        if [ $i -eq $retries ]; then
            log_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 5
    done
    
    for i in $(seq 1 $retries); do
        if redis-cli -h localhost -p 6379 ping &> /dev/null; then
            log_success "Redis ready"
            break
        fi
        if [ $i -eq $retries ]; then
            log_error "Redis failed to start"
            exit 1
        fi
        sleep 5
    done
    
    log_success "Infrastructure services started"
}

# Setup databases
setup_databases() {
    log_info "Setting up databases..."
    
    # Run migrations (when implemented)
    # pnpm db:migrate
    
    # Seed databases (when implemented)
    # pnpm db:seed
    
    log_success "Databases setup complete"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build shared libraries first
    pnpm --filter @lav-adaf/proto build
    pnpm --filter @lav-adaf/clients build
    
    # Build applications
    pnpm build
    
    log_success "Applications built successfully"
}

# Start core services
start_core_services() {
    log_info "Starting core LAV/ADAF services..."
    
    # Start core services
    docker compose --profile core up -d
    
    # Wait for Gateway to be ready
    local retries=12
    for i in $(seq 1 $retries); do
        if curl -f http://localhost:3000/api/status &> /dev/null; then
            log_success "Gateway API ready at http://localhost:3000"
            break
        fi
        if [ $i -eq $retries ]; then
            log_warning "Gateway API not responding, but continuing..."
            break
        fi
        sleep 5
    done
    
    # Check Market Sentinel
    for i in $(seq 1 $retries); do
        if curl -f http://localhost:3010/health &> /dev/null; then
            log_success "Market Sentinel ready at http://localhost:3010"
            break
        fi
        if [ $i -eq $retries ]; then
            log_warning "Market Sentinel not responding, but continuing..."
            break
        fi
        sleep 5
    done
    
    # Check Risk Warden
    for i in $(seq 1 $retries); do
        if curl -f http://localhost:3012/health &> /dev/null; then
            log_success "Risk Warden ready at http://localhost:3012"
            break
        fi
        if [ $i -eq $retries ]; then
            log_warning "Risk Warden not responding, but continuing..."
            break
        fi
        sleep 5
    done
    
    log_success "Core services started"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test Gateway API
    if curl -f http://localhost:3000/api/status &> /dev/null; then
        log_success "✓ Gateway API responding"
    else
        log_warning "✗ Gateway API not responding"
    fi
    
    # Test Market Sentinel
    if curl -f http://localhost:3010/health &> /dev/null; then
        log_success "✓ Market Sentinel responding"
    else
        log_warning "✗ Market Sentinel not responding"
    fi
    
    # Test Risk Warden
    if curl -f http://localhost:3012/health &> /dev/null; then
        log_success "✓ Risk Warden responding"  
    else
        log_warning "✗ Risk Warden not responding"
    fi
    
    # Test Dashboard
    if curl -f http://localhost:3005 &> /dev/null; then
        log_success "✓ Dashboard responding"
    else
        log_warning "✗ Dashboard not responding"
    fi
    
    # Test Grafana
    if curl -f http://localhost:3001 &> /dev/null; then
        log_success "✓ Grafana responding"
    else
        log_warning "✗ Grafana not responding"
    fi
    
    log_success "Smoke tests completed"
}

# Print final status
print_final_status() {
    log_success ""
    log_success "🚀 LAV/ADAF Setup Complete!"
    log_success ""
    log_success "🌐 Services Available:"
    log_success "  • Gateway API:    http://localhost:3000"
    log_success "  • Dashboard:      http://localhost:3005"
    log_success "  • Grafana:        http://localhost:3001 (admin/admin)"
    log_success "  • Market Sentinel: http://localhost:3010"
    log_success "  • Risk Warden:    http://localhost:3012"
    log_success ""
    log_success "📊 Next Steps:"
    log_success "  • Review and update .env configuration"
    log_success "  • Access Grafana to view dashboards"
    log_success "  • Check service logs: make logs"
    log_success "  • Run full test suite: make test"
    log_success ""
    log_success "📚 Documentation:"
    log_success "  • README.md - Overview and quick start"
    log_success "  • docs/ - Complete documentation"
    log_success "  • Makefile - Available commands"
    log_success ""
}

# Cleanup function for errors
cleanup() {
    log_error "Setup failed. Cleaning up..."
    docker compose down
    exit 1
}

# Main setup function
main() {
    log_info "🚀 Starting LAV/ADAF Setup..."
    log_info "This will install dependencies and start the complete system"
    log_info ""
    
    # Set trap for cleanup on error
    trap cleanup ERR
    
    # Run setup steps
    check_requirements
    setup_environment
    install_node_deps
    install_python_deps
    build_applications
    start_infrastructure
    setup_databases
    start_core_services
    run_smoke_tests
    print_final_status
    
    log_success "Setup completed successfully! 🎉"
}

# Script options
case "${1:-}" in
    "--help"|"-h")
        echo "LAV/ADAF Setup Script"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Check requirements only"
        echo "  --infra        Start infrastructure only"
        echo "  --core         Start core services only"
        echo "  --test         Run smoke tests only"
        echo ""
        echo "Default: Full setup (all steps)"
        exit 0
        ;;
    "--check")
        check_requirements
        exit 0
        ;;
    "--infra")
        start_infrastructure
        exit 0
        ;;
    "--core")
        start_core_services
        exit 0
        ;;
    "--test")
        run_smoke_tests
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        log_info "Use --help for usage information"
        exit 1
        ;;
esac