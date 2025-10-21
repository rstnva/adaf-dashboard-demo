#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mode = process.argv[2] || 'off';
const correlationId = Math.random().toString(36).slice(2, 10) + '-' + Date.now();
const logPath = path.resolve(__dirname, '../oracle-mode-toggle.log');
const env = process.env.ORACLE_SOURCE_MODE || (mode === 'on' ? 'shadow' : 'mock');
const msg = `[${new Date().toISOString()}] mode: ${env} | action: ${mode} | x-correlation-id: ${correlationId}\n`;
fs.appendFileSync(logPath, msg);
console.log(msg);
