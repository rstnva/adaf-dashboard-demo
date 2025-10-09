#!/usr/bin/env node
import http from 'node:http';

function request(path = '/api/health') {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: 'localhost', port: 3000, path, timeout: 2500 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

const mode = process.argv[2] || 'shallow';
const path = mode === 'deep' ? '/api/health?deep=1&timeout=2000' : '/api/health';
try {
  const { status, body } = await request(path);
  const ok = status === 200;
  console.log(`[health-${mode}] status=${status} ok=${ok}`);
  if (!ok) {
    console.log(body.slice(0, 2000));
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error(`[health-${mode}] error`, e?.message || e);
  process.exit(2);
}
