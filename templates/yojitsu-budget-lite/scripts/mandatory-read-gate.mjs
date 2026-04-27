#!/usr/bin/env node
/**
 * 部署予算・予実リポ用の薄い必読ゲート（kintone-ai-lab のフル版の縮小版）。
 * コピー先リポのルートで `npm run verify:gate` または `npm run session:bootstrap`。
 *
 * 検査: SPEC.md 存在・最小サイズ / STATUS.md または HANDOFF.md のどちらか
 *
 * 終了コード: 0 = OK / 2 = NG
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// テンプレートルート（本ファイルは scripts/ 直下）
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error(`[mandatory-read-gate] ❌ ${msg}`);
  process.exit(2);
}

function readIf(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

const spec = readIf('SPEC.md');
if (!spec || spec.length < 400) {
  fail('SPEC.md: missing or shorter than 400 chars (write purpose, definitions, acceptance)');
}

const status = readIf('STATUS.md');
const handoff = readIf('HANDOFF.md');
if ((!status || status.length < 80) && (!handoff || handoff.length < 80)) {
  fail('Need STATUS.md or HANDOFF.md (80+ chars) for session state');
}

console.log(`[mandatory-read-gate] ✅ OK (SPEC ${spec.length} chars)`);
process.exit(0);
