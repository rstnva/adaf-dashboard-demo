#!/usr/bin/env node
/**
 * ================================================================================================
 * Shadow Mode Quick Health Check
 * ================================================================================================
 * Rapid validation script for shadow mode services.
 * Checks Oracle health, VOX metrics, and key Prometheus metrics.
 * 
 * Usage:
 *   node scripts/shadow/health-check.mjs
 *   # or
 *   bash scripts/shadow/health-check.sh
 * ================================================================================================
 */

import http from 'node:http';

const ORACLE_HOST = process.env.ORACLE_HOST || 'localhost';
const ORACLE_PORT = process.env.ORACLE_PORT || '3000';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function checkOracleHealth() {
  const url = `http://${ORACLE_HOST}:${ORACLE_PORT}/api/oracle/v1/health`;
  console.log(`\n🔍 Checking Oracle health: ${url}`);
  try {
    const data = await fetchText(url);
    const health = JSON.parse(data);
    console.log(`✅ Oracle status: ${health.status || 'OK'}`);
    console.log(`   Mode: ${health.mode || 'unknown'}`);
    console.log(`   Feeds: ${health.feeds_count || 0}`);
    return true;
  } catch (error) {
    console.error(`❌ Oracle health check failed: ${error.message}`);
    return false;
  }
}

async function checkMetrics() {
  const url = `http://${ORACLE_HOST}:${ORACLE_PORT}/api/metrics/wsp`;
  console.log(`\n🔍 Checking Prometheus metrics: ${url}`);
  try {
    const data = await fetchText(url);
    
    // Extract key VOX and Oracle metrics
    const voxVpi = (data.match(/vox_vpi{.*?} ([\d.]+)/g) || []).length;
    const oracleShadowRmse = (data.match(/oracle_shadow_rmse{.*?} ([\d.]+)/g) || []).length;
    const oracleQuorumFails = (data.match(/oracle_quorum_fail_total ([\d]+)/g) || [])[0]?.split(' ')[1] || '0';
    
    console.log(`✅ Metrics endpoint responding`);
    console.log(`   VOX VPI metrics: ${voxVpi}`);
    console.log(`   Oracle shadow RMSE metrics: ${oracleShadowRmse}`);
    console.log(`   Oracle quorum failures: ${oracleQuorumFails}`);
    return true;
  } catch (error) {
    console.error(`❌ Metrics check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('==========================================');
  console.log('Shadow Mode Health Check');
  console.log('==========================================');
  
  const [oracleOk, metricsOk] = await Promise.all([
    checkOracleHealth(),
    checkMetrics(),
  ]);
  
  console.log('\n==========================================');
  if (oracleOk && metricsOk) {
    console.log('✅ All checks passed - Shadow mode healthy');
    console.log('==========================================\n');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed - Review logs');
    console.log('==========================================\n');
    process.exit(1);
  }
}

main();
