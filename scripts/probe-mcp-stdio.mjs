#!/usr/bin/env node
/** Minimal MCP stdio initialize probe */
import { spawn } from 'node:child_process';

const entry = process.argv[2];
if (!entry) {
  console.error('usage: node probe-mcp-stdio.mjs <entry.mjs>');
  process.exit(2);
}

const init = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'probe', version: '1' },
  },
});

const list = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

const child = spawn('node', [entry], { stdio: ['pipe', 'pipe', 'pipe'] });
let out = '';
child.stdout.on('data', (d) => {
  out += d.toString();
});
child.stderr.on('data', (d) => {
  process.stderr.write(d);
});

child.stdin.write(`${init}\n${list}\n`);
child.stdin.end();

setTimeout(() => {
  child.kill();
  if (out.includes('"tools"') || out.includes('serverInfo')) {
    console.log('[probe-mcp-stdio] OK');
    process.exit(0);
  }
  console.error('[probe-mcp-stdio] NG no tools response');
  process.exit(1);
}, 8000);
