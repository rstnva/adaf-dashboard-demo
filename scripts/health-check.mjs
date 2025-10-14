#!/usr/bin/env node
import http from 'node:http';

function parseArgs(argv) {
  const options = {
    mode: 'shallow',
    host: 'localhost',
    port: 3000,
    path: '/api/health',
    timeout: 2500,
    deep: false,
    label: undefined,
    forceReal: false
  };

  const args = [...argv];

  if (args[0] && !args[0].startsWith('-')) {
    options.mode = args.shift() || 'shallow';
  }

  while (args.length) {
    const arg = args.shift();
    if (arg === '--deep') {
      options.mode = 'deep';
      options.deep = true;
    } else if (arg === '--shallow') {
      options.mode = 'shallow';
      options.deep = false;
    } else if (arg === '--force-real') {
      options.forceReal = true;
    } else if (arg?.startsWith('--mode=')) {
      options.mode = arg.split('=')[1] || options.mode;
      options.deep = options.mode === 'deep';
    } else if (arg?.startsWith('--host=')) {
      options.host = arg.split('=')[1] || options.host;
    } else if (arg?.startsWith('--port=')) {
      options.port = Number(arg.split('=')[1] || options.port);
    } else if (arg?.startsWith('--path=')) {
      options.path = arg.split('=')[1] || options.path;
    } else if (arg?.startsWith('--timeout=')) {
      options.timeout = Number(arg.split('=')[1] || options.timeout);
    } else if (arg?.startsWith('--label=')) {
      options.label = arg.split('=')[1] || undefined;
    }
  }

  if (options.mode === 'deep' || options.deep) {
    const url = new URL(`http://placeholder${options.path}`);
    url.searchParams.set('deep', '1');
    url.searchParams.set('timeout', String(options.timeout));
    if (options.forceReal) {
      url.searchParams.set('force', 'real');
    }
    options.path = `${url.pathname}${url.search}`;
  }

  return options;
}

function request({ host, port, path, timeout }) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: host, port, path, timeout }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

const options = parseArgs(process.argv.slice(2));
const label = options.label || `${options.host}:${options.port}`;

try {
  const { status, body } = await request(options);
  const ok = status === 200;
  console.log(`[health-${options.mode}] target=${label} status=${status} ok=${ok}`);
  if (!ok) {
    console.log(body.slice(0, 2000));
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error(`[health-${options.mode}] target=${label} error`, e?.message || e);
  process.exit(2);
}
