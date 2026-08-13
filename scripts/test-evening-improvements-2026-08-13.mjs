#!/usr/bin/env node
/**
 * 2026-08-13 夕反省 GO 針
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

for (const rel of [
  'docs/approved-changes/2026-08-13-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-13-evening-improvements.md',
  'docs/runbooks/cio-day-close-v1.md',
  '.cursor/rules/cio-ops-2026-08-13-evening-improvements.mdc',
  'docs/reports/2026-08-13-evening-reflection.md',
  'scripts/cio-eod-github.mjs',
  'scripts/cio-checkpoint-sync-live-674.mjs',
  'scripts/evening-reflect.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-13-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認/);
  assert.match(go, /MCP-2/);
  assert.match(go, /CON-1/);
  assert.match(go, /AGENTS\.md 大改訂しない/);
  assert.match(go, /新 MCP サーバー追加しない/);
}

{
  const eod = read('scripts/cio-eod-github.mjs');
  assert.match(eod, /classifyGhRuns/);
  assert.match(eod, /supersededCancellationCount/);
}

{
  const evening = read('scripts/evening-reflect.mjs');
  assert.doesNotMatch(evening, /翌朝 06:00 cron/);
  assert.match(evening, /evening-reflection-hamada-go\.md/);
}

{
  const close = read('scripts/cio-day-close.mjs');
  assert.match(close, /cio:checkpoint:sync-live-674/);
  assert.match(close, /--message/);
  const until = close.slice(close.indexOf('function untilPause'), close.indexOf('function afterGo'));
  assert.doesNotMatch(until, /cio:session:close-git/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-13-evening-improvements.mdc');
  assert.match(mdc, /alwaysApply:\s*false/);
  assert.doesNotMatch(mdc, /alwaysApply:\s*true/);
}

{
  const pkg = read('package.json');
  assert.match(pkg, /cio:checkpoint:sync-live-674/);
  assert.match(pkg, /test:evening-improvements-2026-08-13/);
}

console.log('[test:evening-improvements-2026-08-13] OK');
