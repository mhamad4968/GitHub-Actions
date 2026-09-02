#!/usr/bin/env node
/**
 * 2026-09-02 夕反省 GO 針
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coalesceReportRel } from './lib/resolve-archived-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, coalesceReportRel(root, rel)), 'utf8');

for (const rel of [
  'docs/approved-changes/2026-09-02-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-09-02-evening-improvements.md',
  'docs/reports/2026-09-02-evening-reflection.md',
  'docs/mcp-status.md',
  'scripts/cio-turn-start.mjs',
  'scripts/lib/cio-turn-start-tier.mjs',
  'scripts/lib/gh-run-classifier.mjs',
  'scripts/cio-eod-github.mjs',
  'scripts/user683-sync-summaries-to-kintone.mjs',
  'scripts/user683_claude_relay.py',
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-09-02-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認/);
  assert.match(go, /#S1/);
  assert.match(go, /#O1/);
  assert.match(go, /#M1/);
  assert.match(go, /#P1/);
}

{
  const turn = read('scripts/cio-turn-start.mjs');
  assert.match(turn, /--goal/);
  assert.match(turn, /resolveTurnStartGoal/);
  const tier = read('scripts/lib/cio-turn-start-tier.mjs');
  assert.match(tier, /export function resolveTurnStartGoal/);
}

{
  const classifier = read('scripts/lib/gh-run-classifier.mjs');
  assert.match(classifier, /unresolvedFailureCount/);
  assert.match(classifier, /healed/);
}

{
  const mcp = read('docs/mcp-status.md');
  assert.match(mcp, /moonshot-v1-128k/);
  assert.match(mcp, /DeepSeek/);
  assert.match(mcp, /2026-09-02/);
}

{
  const weekMonth = `${read('scripts/user683-sync-summaries-to-kintone.mjs')}\n${read('scripts/user683_claude_relay.py')}`;
  assert.match(weekMonth, /5[–-]7月=第1四半期/);
  assert.match(weekMonth, /8[–-]10月=第2四半期/);
  assert.match(weekMonth, /11[–-]1月=第3四半期/);
  assert.match(weekMonth, /2[–-]4月=第4四半期/);
}

{
  const pkg = read('package.json');
  assert.match(pkg, /test:evening-improvements-2026-09-02/);
}

console.log('[test:evening-improvements-2026-09-02] OK');
