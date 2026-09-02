#!/usr/bin/env node
/**
 * 2026-08-09 夕反省 GO 針テスト（runbook / mdc / GO / 報告・OPS・順序契約）
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coalesceReportRel } from './lib/resolve-archived-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, coalesceReportRel(root, rel)), 'utf8');
}

for (const rel of [
  'docs/approved-changes/2026-08-09-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-09-evening-improvements.md',
  '.cursor/rules/cio-ops-2026-08-09-evening-improvements.mdc',
  'docs/plans/2026-08-09-evening-improvements-spec.md',
  'docs/reports/2026-08-09-evening-reflection.md',
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-09-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認|全承認/);
  assert.match(go, /CON-1/);
  assert.match(go, /AGENTS\.md 大改訂しない/);
}

{
  const rb = read('docs/runbooks/cio-ops-2026-08-09-evening-improvements.md');
  assert.match(rb, /R3/);
  assert.match(rb, /偽陽性/);
  assert.match(rb, /OPS-1/);
  assert.match(rb, /順序契約/);
  assert.match(rb, /再export|re-export|再 export/i);
  assert.match(rb, /ゲート固定完了/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-09-evening-improvements.mdc');
  assert.match(mdc, /alwaysApply:\s*false/);
  assert.match(mdc, /cio-wake/);
  assert.doesNotMatch(mdc, /alwaysApply:\s*true/);
}

{
  const brief = read('.cursor/rules/constitution-brief-card.mdc');
  assert.match(brief, /偽陽性/);
  assert.match(brief, /re-export|再生成/);
}

{
  const cold = read('docs/runbooks/session-cold-start-v1.md');
  assert.match(cold, /OPS-1/);
  assert.match(cold, /cold-start 見た目分類/);
}

{
  const ds = read('.cursor/rules/deepseek-cursor-spec-division.mdc');
  assert.match(ds, /順序・再export・ゲート漏れ/);
}

{
  const chk = read('docs/session-report-checklist.md');
  assert.match(chk, /RULE-2|同一ターン/);
  assert.match(chk, /T5/);
}

{
  const close = read('docs/runbooks/session-close-multi-session.md');
  assert.match(close, /OPS-2/);
  assert.match(close, /export-handoff/);
}

console.log('[test:evening-improvements-2026-08-09] OK');
