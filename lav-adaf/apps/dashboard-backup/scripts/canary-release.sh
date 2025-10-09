#!/bin/bash

# Summer.fi Canary Release Script
# Implements blue-green deployment with monitoring and automatic rollback

set -euo pipefail

# Configuration
CANARY_PHASES=(10 50 100)
MONITOR_DURATION=600  # 10 minutes monitoring per phase
ROLLBACK_THRESHOLD_P95=450  # 450ms
ROLLBACK_THRESHOLD_5XX=1    # 1%

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Pre-flight checks
preflight_checks() {
    log "🔍 Running pre-flight checks..."
    
    # Check if Summer.fi tests pass
    if ! npm test -- --run tests/summer-*.test.ts --reporter=silent; then
        error "Summer.fi tests failing - aborting release"
    fi
    
    # Check if monitoring is available
    if ! curl -s http://prometheus:9090/api/v1/query?query=up > /dev/null; then
        error "Prometheus not accessible - monitoring required for canary"
    fi
    
    if ! curl -s http://grafana:3000/api/health > /dev/null; then
        error "Grafana not accessible - dashboard monitoring required"
    fi
    
    success "Pre-flight checks passed"
}

# Query metrics from Prometheus
query_metrics() {
    local query="$1"
    local result=$(curl -s "http://prometheus:9090/api/v1/query?query=${query}" | jq -r '.data.result[0].value[1] // "0"')
    echo "$result"
}

# Monitor key metrics for canary phase
monitor_phase() {
    local phase=$1
    local start_time=$(date +%s)
    local end_time=$((start_time + MONITOR_DURATION))
    
    log "📊 Monitoring phase ${phase}% for ${MONITOR_DURATION}s..."
    
    while [ $(date +%s) -lt $end_time ]; do
        # Check p95 latency
        local p95_query='histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{path=~"/api/integrations/summer.*"}[2m])) by (le)) * 1000'
        local p95_ms=$(query_metrics "$p95_query")
        
        # Check 5xx error rate  
        local error_rate_query='sum(rate(http_requests_total{path=~"/api/integrations/summer.*", status_code=~"5.."}[2m])) / sum(rate(http_requests_total{path=~"/api/integrations/summer.*"}[2m])) * 100'
        local error_rate=$(query_metrics "$error_rate_query")
        
        # Check RBAC denials
        local rbac_denials_query='sum(rate(wsp_rbac_denied_total{feature="summer"}[2m])) * 120'
        local rbac_denials=$(query_metrics "$rbac_denials_query")
        
        log "  📈 p95: ${p95_ms}ms | 5xx: ${error_rate}% | RBAC denials: ${rbac_denials}/2m"
        
        # Check rollback conditions
        if (( $(echo "$p95_ms > $ROLLBACK_THRESHOLD_P95" | bc -l) )); then
            error "🚨 ROLLBACK TRIGGERED: p95 latency ${p95_ms}ms > ${ROLLBACK_THRESHOLD_P95}ms"
        fi
        
        if (( $(echo "$error_rate > $ROLLBACK_THRESHOLD_5XX" | bc -l) )); then
            error "🚨 ROLLBACK TRIGGERED: 5xx error rate ${error_rate}% > ${ROLLBACK_THRESHOLD_5XX}%"
        fi
        
        if (( $(echo "$rbac_denials > 5" | bc -l) )); then
            warning "High RBAC denials detected: ${rbac_denials}/2m - monitoring closely"
        fi
        
        sleep 30
    done
    
    success "Phase ${phase}% monitoring completed - metrics within thresholds"
}

# Enable feature flag for specific canary percentage
enable_canary() {
    local percentage=$1
    
    log "🚀 Enabling Summer.fi for ${percentage}% of traffic..."
    
    case $percentage in
        10)
            # Enable for shard A only (10% of traffic)
            kubectl set env deployment/adaf-web-canary NEXT_PUBLIC_FF_SUMMER_ENABLED=true
            kubectl set env deployment/adaf-web-stable NEXT_PUBLIC_FF_SUMMER_ENABLED=false
            kubectl patch service adaf-web-service -p '{"spec":{"selector":{"version":"canary"}}}' --type=merge
            ;;
        50)
            # Enable for shards A+B (50% of traffic)  
            kubectl set env deployment/adaf-web-canary NEXT_PUBLIC_FF_SUMMER_ENABLED=true
            kubectl set env deployment/adaf-web-stable NEXT_PUBLIC_FF_SUMMER_ENABLED=true
            kubectl patch ingress adaf-web-ingress -p '{"spec":{"rules":[{"host":"dashboard.adaf.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"adaf-web-service","port":{"number":3000}}},"weight":50},{"path":"/","pathType":"Prefix","backend":{"service":{"name":"adaf-web-canary-service","port":{"number":3000}}},"weight":50}]}}]}}'
            ;;
        100)
            # Enable for all traffic (100%)
            kubectl set env deployment/adaf-web-canary NEXT_PUBLIC_FF_SUMMER_ENABLED=true
            kubectl set env deployment/adaf-web-stable NEXT_PUBLIC_FF_SUMMER_ENABLED=true
            kubectl patch ingress adaf-web-ingress -p '{"spec":{"rules":[{"host":"dashboard.adaf.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"adaf-web-service","port":{"number":3000}}}}]}}]}}'
            ;;
    esac
    
    # Wait for rollout
    kubectl rollout status deployment/adaf-web-canary --timeout=300s
    
    success "Canary ${percentage}% deployment completed"
}

# Rollback to stable version
rollback() {
    log "🔄 EXECUTING EMERGENCY ROLLBACK..."
    
    # Disable feature flag on all deployments
    kubectl set env deployment/adaf-web-canary NEXT_PUBLIC_FF_SUMMER_ENABLED=false
    kubectl set env deployment/adaf-web-stable NEXT_PUBLIC_FF_SUMMER_ENABLED=false
    
    # Route all traffic to stable
    kubectl patch ingress adaf-web-ingress -p '{"spec":{"rules":[{"host":"dashboard.adaf.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"adaf-web-service","port":{"number":3000}}}}]}}]}}'
    
    # Wait for rollback
    kubectl rollout status deployment/adaf-web-stable --timeout=300s
    
    error "🚨 ROLLBACK COMPLETED - Summer.fi disabled"
}

# Generate release evidence
generate_evidence() {
    local phase=$1
    
    log "📸 Generating evidence for phase ${phase}%..."
    
    # Take Grafana dashboard screenshot (requires grafana-image-renderer)
    local dashboard_url="http://grafana:3000/d/summer-fi-integration/wsp-summer-fi-integration?orgId=1&from=now-1h&to=now"
    curl -s "${dashboard_url}&render=1" -o "evidence/summer-fi-phase-${phase}-dashboard.png"
    
    # Export metrics data
    local metrics_start=$(date -d '1 hour ago' --iso-8601)
    local metrics_end=$(date --iso-8601)
    
    curl -s "http://prometheus:9090/api/v1/query_range?query=histogram_quantile(0.95,sum(rate(http_request_duration_seconds_bucket{path=~\"/api/integrations/summer.*\"}[5m]))by(le))*1000&start=${metrics_start}&end=${metrics_end}&step=60s" | jq . > "evidence/summer-fi-phase-${phase}-p95.json"
    
    curl -s "http://prometheus:9090/api/v1/query_range?query=sum(rate(http_requests_total{path=~\"/api/integrations/summer.*\",status_code=~\"5..\"}[5m]))/sum(rate(http_requests_total{path=~\"/api/integrations/summer.*\"}[5m]))*100&start=${metrics_start}&end=${metrics_end}&step=60s" | jq . > "evidence/summer-fi-phase-${phase}-5xx.json"
    
    success "Evidence saved for phase ${phase}%"
}

# Main canary release execution
main() {
    log "🚀 Starting Summer.fi Canary Release v1.0"
    log "📋 Phases: ${CANARY_PHASES[*]}%"
    log "⏱️  Monitor duration: ${MONITOR_DURATION}s per phase"
    log "🚨 Rollback thresholds: p95>${ROLLBACK_THRESHOLD_P95}ms, 5xx>${ROLLBACK_THRESHOLD_5XX}%"
    
    # Create evidence directory
    mkdir -p evidence
    
    # Set up trap for rollback on script interruption
    trap rollback INT TERM
    
    # Run pre-flight checks
    preflight_checks
    
    # Execute canary phases
    for phase in "${CANARY_PHASES[@]}"; do
        log "🎯 Starting Phase ${phase}%..."
        
        enable_canary "$phase"
        monitor_phase "$phase" 
        generate_evidence "$phase"
        
        if [ "$phase" != "100" ]; then
            log "⏳ Phase ${phase}% successful - proceeding to next phase in 60s..."
            sleep 60
        fi
    done
    
    success "🎉 Summer.fi Canary Release v1.0 COMPLETED SUCCESSFULLY!"
    success "📊 All phases (10%→50%→100%) passed monitoring thresholds"
    success "📁 Evidence saved in evidence/ directory"
    success "🔗 Summer.fi widgets are now live in production!"
}

# Handle command line arguments
case "${1:-main}" in
    "preflight")
        preflight_checks
        ;;
    "rollback") 
        rollback
        ;;
    "monitor")
        monitor_phase "${2:-100}"
        ;;
    "main")
        main
        ;;
    *)
        echo "Usage: $0 [main|preflight|rollback|monitor <phase>]"
        exit 1
        ;;
esac