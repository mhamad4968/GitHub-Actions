#!/usr/bin/env node
/**
 * 2026-08-11 夕反省 GO 針テスト
 * （clone POST・IME・退役ゲート配線・見送り・desktop 除外集合一致）
 *
 * 保守: lib 定数 or desktop SKIP 集合を変えたら同ターンで本ファイルを更新（仕様 DoD 盲点3）
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKIP_CLONE_FIELD_TYPES } from './lib/kintone-record-clone-post.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const rel of [
  'docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-11-evening-improvements.md',
  'docs/runbooks/pc-ledger-674-replace-clone-post.md',
  'docs/runbooks/kintone-input-ime-datalist.md',
  '.cursor/rules/cio-ops-2026-08-11-evening-improvements.mdc',
  'docs/plans/2026-08-11-evening-improvements-spec.md',
  'docs/reports/2026-08-11-evening-reflection.md',
  'scripts/lib/kintone-record-clone-post.mjs',
  'scripts/lib/kintone-record-clone-post.test.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md');
  assert.match(go, /すべて|全対応|たいおう/);
  assert.match(go, /CON-1/);
  assert.match(go, /AGENTS\.md 大改訂しない/);
  assert.match(go, /MCP-2/);
}

{
  const rb = read('docs/runbooks/cio-ops-2026-08-11-evening-improvements.md');
  assert.match(rb, /RECORD_NUMBER/);
  assert.match(rb, /IME|composition|datalist/);
  assert.match(rb, /verify:retired-app-refs/);
  assert.match(rb, /ahead|未 push/);
  assert.match(rb, /08-10 ops は上書きしない/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-11-evening-improvements.mdc');
  assert.match(mdc, /alwaysApply:\s*false/);
  assert.match(mdc, /new-pc-ledger-v1/);
  assert.doesNotMatch(mdc, /alwaysApply:\s*true/);
}

{
  const pkg = read('package.json');
  assert.match(pkg, /test:evening-improvements-2026-08-11/);
  assert.match(pkg, /test:kintone-record-clone-post/);
}

{
  const parity = read('scripts/cio-pre-push-local-parity.mjs');
  assert.match(parity, /verify:retired-app-refs/);
}

{
  const gates = read('.github/workflows/constitution-gates.yml');
  assert.match(gates, /verify:retired-app-refs|verify-retired-app-refs/);
}

{
  const desktop = read('customize/new-pc-ledger-v1/desktop.js');
  for (const t of SKIP_CLONE_FIELD_TYPES) {
    assert.ok(
      desktop.includes(`'${t}'`) || desktop.includes(`"${t}"`),
      `desktop.js missing SKIP type ${t} (keep in sync with lib)`,
    );
  }
  assert.match(desktop, /compositionstart/);
  assert.match(desktop, /toApiRecordValuesOnly674/);
}

{
  const brief = read('.cursor/rules/constitution-brief-card.mdc');
  assert.match(brief, /2026-08-11|clone POST|退役|ahead/);
}

{
  const ds = read('.cursor/rules/deepseek-cursor-spec-division.mdc');
  assert.match(ds, /2026-08-11|clone|買替|form/);
}

{
  const apps = read('kintone-apps.md');
  assert.match(apps, /退役|retiredAppIds|verify:retired-app-refs/);
  assert.match(apps, /同ターン|削除.*登録/);
}

{
  const chk = read('docs/session-report-checklist.md');
  assert.match(chk, /2026-08-11/);
}

{
  const mcp = read('.cursor/rules/mcp-server-use-triggers.mdc');
  assert.match(mcp, /2026-08-11|clone|買替/);
}

console.log('[test:evening-improvements-2026-08-11] OK');
