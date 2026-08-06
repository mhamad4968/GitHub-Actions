#!/usr/bin/env node
/**
 * 2026-08-06 夕反省 GO 針テスト（空DD / print-root / 680 / SCOPE / checkpoint）
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isEmptyDropdownField,
  isEmptyDropdownValue,
  KINTONE_EMPTY_DROPDOWN_NOTE,
} from './lib/kintone-empty-dropdown.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const rel of [
  'docs/approved-changes/2026-08-06-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-06-evening-improvements.md',
  '.cursor/rules/cio-ops-2026-08-06-evening-improvements.mdc',
  'docs/reports/2026-08-06-evening-reflection.md',
  'scripts/lib/kintone-empty-dropdown.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-06-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認/);
  assert.match(go, /憲法本文/);
  assert.match(go, /S-KINTONE-EMPTY-DD-01/);
  assert.match(go, /S-PRINT-ROOT-01/);
  assert.match(go, /S-DEPT-MASTER-01/);
  assert.match(go, /S-SCOPE-LINE-01/);
  assert.match(go, /D-CHKPT-DONE-01/);
  assert.match(go, /M-5038-QUERY/);
  assert.match(go, /O-SKYSEA-01/);
}

{
  const rb = read('docs/runbooks/cio-ops-2026-08-06-evening-improvements.md');
  assert.match(rb, /空 DROP_DOWN|not in/);
  assert.match(rb, /print-root|visibility:hidden/);
  assert.match(rb, /App 680|sort_no/);
  assert.match(rb, /SCOPE=/);
  assert.match(rb, /D-CHKPT-DONE-01|次の1手/);
  assert.match(rb, /M-5038-QUERY|空値クエリ/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-06-evening-improvements.mdc');
  const fm = mdc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, 'mdc frontmatter');
  assert.match(fm[1], /alwaysApply:\s*false/);
  assert.doesNotMatch(fm[1], /alwaysApply:\s*true/);
}

{
  const ds = read('.cursor/rules/deepseek-cursor-spec-division.mdc');
  assert.match(ds, /M-5038-QUERY/);
  assert.match(ds, /空値クエリ|空 DROP_DOWN/);
  assert.match(ds, /印刷白紙|visibility/);
  assert.match(ds, /マスタ欠落|680/);
}

{
  const evening = read('docs/reports/2026-08-06-evening-reflection.md');
  assert.match(evening, /承認|反映済/);
  assert.doesNotMatch(evening, /\| 承認待ち \|/);
}

{
  const setup = read('scripts/pc-ledger-674-skysea-manual-setup.mjs');
  assert.match(setup, /SCOPE=\s*account_type=個人/);
  assert.match(setup, /S-SCOPE-LINE-01|S-KINTONE-EMPTY-DD-01/);
  assert.match(setup, /kintone-empty-dropdown/);
  assert.match(setup, /isEmptyDropdownField/);
  assert.doesNotMatch(setup, /not in \("完了","未了"\)/);
}

{
  const desk = read('customize/new-pc-ledger-v1/desktop.js');
  assert.match(desk, /S-PRINT-ROOT-01/);
  assert.match(desk, /npl674-skysea-print-root/);
  assert.match(desk, /S-DEPT-MASTER-01/);
  assert.match(desk, /APP_DEPT_MASTER_674\s*=\s*'680'/);
  // SKYSEA print CSS payload must not use visibility:hidden (comments may mention the ban)
  const styleFn = desk.indexOf('function ensureSkysea674PrintStyles674');
  assert.ok(styleFn > 0);
  const styleSlice = desk.slice(styleFn, styleFn + 2500);
  const assign = styleSlice.match(/st\.textContent\s*=\s*([\s\S]*?);/);
  assert.ok(assign, 'st.textContent assign');
  assert.doesNotMatch(assign[1], /visibility:\s*hidden/);
  assert.match(assign[1], /display:\s*none|display:none/);
}

{
  const tpl = read('docs/runbooks/checkpoint-handoff-template-v2.md');
  assert.match(tpl, /D-CHKPT-DONE-01/);
}

{
  const p18 = read('chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt');
  assert.match(p18, /S-KINTONE-EMPTY-DD-01|S-PRINT-ROOT-01/);
  assert.match(p18, /2026-08-06/);
}

assert.equal(isEmptyDropdownValue(''), true);
assert.equal(isEmptyDropdownValue(null), true);
assert.equal(isEmptyDropdownValue('未了'), false);
assert.equal(isEmptyDropdownField({ value: '' }), true);
assert.equal(isEmptyDropdownField({ value: '完了' }), false);
assert.match(KINTONE_EMPTY_DROPDOWN_NOTE, /S-KINTONE-EMPTY-DD-01/);

{
  const pkg = JSON.parse(read('package.json'));
  assert.equal(
    pkg.scripts['test:evening-improvements-2026-08-06'],
    'node scripts/test-evening-improvements-2026-08-06.mjs',
  );
}

console.log('[test:evening-improvements-2026-08-06] OK');
