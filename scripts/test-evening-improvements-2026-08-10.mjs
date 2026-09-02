#!/usr/bin/env node
/**
 * 2026-08-10 夕反省 GO 針テスト（§41・ネタ省略禁止・report-draft 語彙・brief）
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
  'docs/approved-changes/2026-08-10-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-10-evening-improvements.md',
  '.cursor/rules/cio-ops-2026-08-10-evening-improvements.mdc',
  'docs/plans/2026-08-10-evening-improvements-spec.md',
  'docs/reports/2026-08-10-evening-reflection.md',
]) {
  assert.ok(fs.existsSync(path.join(root, coalesceReportRel(root, rel))), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-10-evening-reflection-hamada-go.md');
  assert.match(go, /すべて|全対応/);
  assert.match(go, /CON-1/);
  assert.match(go, /AGENTS\.md 大改訂しない/);
  assert.match(go, /MCP-3/);
}

{
  const rb = read('docs/runbooks/cio-ops-2026-08-10-evening-improvements.md');
  assert.match(rb, /§41/);
  assert.match(rb, /1問/);
  assert.match(rb, /ネタ/);
  assert.match(rb, /省略禁止|三点リーダ/);
  assert.match(rb, /701/);
  assert.match(rb, /631/);
  assert.match(rb, /08-09 ops は上書きしない/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-10-evening-improvements.mdc');
  assert.match(mdc, /alwaysApply:\s*false/);
  assert.match(mdc, /keiei-kaigi-neta/);
  assert.doesNotMatch(mdc, /alwaysApply:\s*true/);
}

{
  const neta = read('docs/runbooks/keiei-kaigi-neta-from-security-next.md');
  assert.match(neta, /省略.*禁止|省略禁止/);
  assert.match(neta, /未確定/);
  assert.match(neta, /納品前|三点リーダ|…/);
  assert.match(neta, /UX|掲示板/);
  assert.match(neta, /631/);
}

{
  const draft = read('scripts/cio-report-draft.mjs');
  assert.match(draft, /許容語|許可語|A1.*語彙|語彙サンプル/);
  assert.match(draft, /第2者|非該当|DeepSeek/);
}

{
  const brief = read('.cursor/rules/constitution-brief-card.mdc');
  assert.match(brief, /§41/);
  assert.match(brief, /ネタ/);
}

{
  const ds = read('.cursor/rules/deepseek-cursor-spec-division.mdc');
  assert.match(ds, /合意後|意見交換/);
}

{
  const chk = read('docs/session-report-checklist.md');
  assert.match(chk, /2026-08-10|R4|許容語/);
}

console.log('[test:evening-improvements-2026-08-10] OK');
