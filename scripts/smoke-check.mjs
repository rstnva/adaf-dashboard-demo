#!/usr/bin/env node
import http from 'node:http';

const routes = ['/', '/dashboard', '/research', '/monitoring'];

function req(path) {
  return new Promise((resolve) => {
    const s = Date.now();
    const r = http.get({ hostname: '127.0.0.1', port: 3000, path, timeout: 5000 }, (res) => {
      res.resume();
      res.on('end', () => resolve({ path, status: res.statusCode || 0, ms: Date.now() - s }));
    });
    r.on('error', (e) => resolve({ path, status: 0, ms: Date.now() - s, error: e.message }));
    r.on('timeout', () => { r.destroy(new Error('timeout')); });
  });
}

const out = [];
for (const p of routes) {
  // eslint-disable-next-line no-await-in-loop
  out.push(await req(p));
}

const ok = out.every(x => x.status === 200);
out.forEach(x => console.log(`${x.path} -> ${x.status} (${x.ms}ms)${x.error ? ' ' + x.error : ''}`));
if (!ok) process.exit(1);
process.exit(0);
