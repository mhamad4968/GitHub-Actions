#!/usr/bin/env node
/**
 * Probe layer12 MCP servers — initialize JSON-RPC smoke test
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function probeServer(scriptRel) {
  const script = path.join(root, scriptRel);
  const init = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'verify-cio-mcp-layer12-probe', version: '1.0.0' },
    },
  });
  const r = spawnSync(process.execPath, [script], {
    cwd: root,
    input: `${init}\n`,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env },
  });
  if (r.status !== 0 && !r.stdout) {
    return { ok: false, err: r.stderr || 'no stdout' };
  }
  const line = (r.stdout || '').split(/\r?\n/).find((l) => l.includes('"result"'));
  if (!line) return { ok: false, err: 'no initialize result' };
  try {
    const j = JSON.parse(line);
    if (j.result?.serverInfo?.name) return { ok: true, name: j.result.serverInfo.name };
  } catch {
    /* noop */
  }
  return { ok: false, err: 'parse fail' };
}

function main() {
  const tests = [
    ['mcp/git-history-mcp/index.mjs', 'git-history-mcp'],
    ['mcp/kintone-schema-mcp/index.mjs', 'kintone-schema-mcp'],
  ];
  let fail = 0;
  for (const [rel, label] of tests) {
    const p = probeServer(rel);
    if (p.ok) {
      console.log(`[verify:cio-mcp-layer12-probe] OK ${label} initialize`);
    } else {
      fail += 1;
      console.error(`[verify:cio-mcp-layer12-probe] NG ${label}: ${p.err}`);
    }
  }
  process.exit(fail ? 1 : 0);
}

main();
