#!/usr/bin/env node
/**
 * ================================================================================================
 * KPI Collector for Shadow Mode - Hourly metrics collection
 * ================================================================================================
 * Collects Oracle Core and VOX POPULI metrics during shadow validation runs.
 * Runs every hour and persists KPIs to Postgres + pushes to Prometheus (optional).
 * 
 * Usage (Docker):
 *   docker compose -f docker-compose.prod.yml --profile shadow up -d kpi-collector
 * 
 * Usage (Local):
 *   ORACLE_SOURCE_MODE=shadow SHADOW_NAMESPACE=shadow72h node scripts/shadow/kpi-collector.mjs
 * ================================================================================================
 */

import http from 'node:http';
import { promisify } from 'node:util';

const sleep = promisify(setTimeout);

// ================================================================================================
// Configuration
// ================================================================================================
const CONFIG = {
  ORACLE_HOST: process.env.ORACLE_HOST || 'localhost',
  ORACLE_PORT: process.env.ORACLE_PORT || '3000',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://adaf_user:password@localhost:5432/adaf_dashboard',
  SHADOW_NAMESPACE: process.env.SHADOW_NAMESPACE || 'shadow72h',
  ORACLE_SOURCE_MODE: process.env.ORACLE_SOURCE_MODE || 'shadow',
  PROMETHEUS_PUSHGATEWAY: process.env.PROMETHEUS_PUSHGATEWAY || null,
  COLLECTION_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// ================================================================================================
// Logging
// ================================================================================================
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    service: 'kpi-collector',
    mode: CONFIG.ORACLE_SOURCE_MODE,
    namespace: CONFIG.SHADOW_NAMESPACE,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

// ================================================================================================
// HTTP Fetch Helper
// ================================================================================================
async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ================================================================================================
// Metrics Collection
// ================================================================================================
async function collectOracleMetrics() {
  const metricsUrl = `http://${CONFIG.ORACLE_HOST}:${CONFIG.ORACLE_PORT}/api/oracle/v1/metrics`;
  log('info', 'Collecting Oracle Core metrics', { url: metricsUrl });
  
  try {
    const metrics = await fetchJson(metricsUrl);
    log('info', 'Oracle metrics collected', {
      feeds_total: metrics.feeds?.total || 0,
      feeds_healthy: metrics.feeds?.healthy || 0,
      consensus_errors: metrics.consensus?.errors_24h || 0,
    });
    return metrics;
  } catch (error) {
    log('error', 'Failed to collect Oracle metrics', { error: error.message });
    return null;
  }
}

async function collectVoxMetrics() {
  const voxUrl = `http://${CONFIG.ORACLE_HOST}:${CONFIG.ORACLE_PORT}/api/oracle/v1/vox/summary`;
  log('info', 'Collecting VOX POPULI metrics', { url: voxUrl });
  
  try {
    const voxData = await fetchJson(voxUrl);
    log('info', 'VOX metrics collected', {
      signals_active: voxData.signals?.active || 0,
      shock_events: voxData.shock_events_24h || 0,
      brigading_detected: voxData.brigading_events_24h || 0,
    });
    return voxData;
  } catch (error) {
    log('error', 'Failed to collect VOX metrics', { error: error.message });
    return null;
  }
}

async function collectDqMetrics() {
  const dqUrl = `http://${CONFIG.ORACLE_HOST}:${CONFIG.ORACLE_PORT}/api/read/oracle/dq/summary`;
  log('info', 'Collecting DQ metrics', { url: dqUrl });
  
  try {
    const dqData = await fetchJson(dqUrl);
    log('info', 'DQ metrics collected', {
      quarantine_count: dqData.quarantine?.active_count || 0,
      cooldown_count: dqData.cooldown?.active_count || 0,
    });
    return dqData;
  } catch (error) {
    log('error', 'Failed to collect DQ metrics', { error: error.message });
    return null;
  }
}

// ================================================================================================
// Persistence (Stub - implement with your DB client)
// ================================================================================================
async function persistKpis(timestamp, oracleMetrics, voxMetrics, dqMetrics) {
  // TODO: Implement Postgres persistence with Prisma or pg client
  // Example:
  // await prisma.shadowKpi.create({
  //   data: {
  //     timestamp,
  //     namespace: CONFIG.SHADOW_NAMESPACE,
  //     oracle_feeds_total: oracleMetrics?.feeds?.total || 0,
  //     oracle_feeds_healthy: oracleMetrics?.feeds?.healthy || 0,
  //     oracle_consensus_errors_24h: oracleMetrics?.consensus?.errors_24h || 0,
  //     vox_signals_active: voxMetrics?.signals?.active || 0,
  //     vox_shock_events_24h: voxMetrics?.shock_events_24h || 0,
  //     vox_brigading_events_24h: voxMetrics?.brigading_events_24h || 0,
  //     dq_quarantine_count: dqMetrics?.quarantine?.active_count || 0,
  //     dq_cooldown_count: dqMetrics?.cooldown?.active_count || 0,
  //   },
  // });
  
  log('info', 'KPIs persisted (stub)', {
    timestamp,
    oracle_feeds: oracleMetrics?.feeds?.total || 0,
    vox_signals: voxMetrics?.signals?.active || 0,
    dq_quarantine: dqMetrics?.quarantine?.active_count || 0,
  });
}

// ================================================================================================
// Prometheus Push (Optional)
// ================================================================================================
async function pushToPrometheus(timestamp, oracleMetrics, voxMetrics, dqMetrics) {
  if (!CONFIG.PROMETHEUS_PUSHGATEWAY) {
    return;
  }
  
  // TODO: Implement Prometheus pushgateway push
  // Example:
  // const gateway = new Pushgateway(CONFIG.PROMETHEUS_PUSHGATEWAY);
  // await gateway.push({
  //   jobName: 'shadow-kpi-collector',
  //   groupings: { namespace: CONFIG.SHADOW_NAMESPACE },
  //   ...
  // });
  
  log('debug', 'Prometheus push (stub)', { endpoint: CONFIG.PROMETHEUS_PUSHGATEWAY });
}

// ================================================================================================
// Main Collection Loop
// ================================================================================================
async function collectAndPersist() {
  const timestamp = new Date();
  log('info', 'Starting KPI collection cycle', { timestamp: timestamp.toISOString() });
  
  const [oracleMetrics, voxMetrics, dqMetrics] = await Promise.all([
    collectOracleMetrics(),
    collectVoxMetrics(),
    collectDqMetrics(),
  ]);
  
  await persistKpis(timestamp, oracleMetrics, voxMetrics, dqMetrics);
  await pushToPrometheus(timestamp, oracleMetrics, voxMetrics, dqMetrics);
  
  log('info', 'KPI collection cycle complete', { timestamp: timestamp.toISOString() });
}

async function main() {
  log('info', 'Shadow KPI Collector starting', CONFIG);
  
  // Run immediately on start
  await collectAndPersist();
  
  // Then run every hour
  setInterval(async () => {
    try {
      await collectAndPersist();
    } catch (error) {
      log('error', 'KPI collection failed', { error: error.message, stack: error.stack });
    }
  }, CONFIG.COLLECTION_INTERVAL_MS);
  
  log('info', `Shadow KPI Collector running (interval: ${CONFIG.COLLECTION_INTERVAL_MS / 1000}s)`);
}

// ================================================================================================
// Entry Point
// ================================================================================================
main().catch((error) => {
  log('fatal', 'Shadow KPI Collector crashed', { error: error.message, stack: error.stack });
  process.exit(1);
});
