#!/usr/bin/env node
/**
 * 正本 docs/plans/2026-04-21-new-pc-ledger-spec.md §4.2 と PC_LEDGER_V1_LABELS の整合検証。
 *
 * - §4.2.1 / 4.2.3 / 4.2.4: 「説明」「内容」列と表示ラベル完全一致（kintone 全角64文字以内を警告）
 * - §4.2.2: マトリクス行の指紋が scripts/data/pc-ledger-spec-4222-ui-labels.json と一致すること。
 *           UI 短文ラベルは同 JSON のみ（正本に一行ラベル列が無いため）。
 * - 正本表外: scripts/data/pc-ledger-spec-field-extensions.json
 *
 * Usage:
 *   node scripts/pc-ledger-verify-labels-vs-spec.mjs
 *   node scripts/pc-ledger-verify-labels-vs-spec.mjs --update-4222-fingerprints
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PC_LEDGER_V1_LABELS } from './pc-ledger-v1-labels.mjs';
import { parsePcLedgerSpec42 } from './pc-ledger-spec-42-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPEC = path.join(ROOT, 'docs/plans/2026-04-21-new-pc-ledger-spec.md');
const PATH_4222 = path.join(__dirname, 'data/pc-ledger-spec-4222-ui-labels.json');
const PATH_EXT = path.join(__dirname, 'data/pc-ledger-spec-field-extensions.json');

const MAX_LABEL_CHARS = 64;

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const updateFp = process.argv.includes('--update-4222-fingerprints');

  const parsed = parsePcLedgerSpec42(SPEC);
  const doc4222 = loadJson(PATH_4222);
  const docExt = loadJson(PATH_EXT);

  if (updateFp) {
    const fields = { ...doc4222.fields };
    for (const [code, meta] of Object.entries(fields)) {
      const row = parsed.matrix422[code];
      if (!row) {
        console.error(`--update-4222-fingerprints: code ${code} not in parsed matrix`);
        process.exit(1);
      }
      meta.matrix_fingerprint = row.fingerprint;
    }
    const out = {
      _comment: doc4222._comment,
      fields,
    };
    fs.writeFileSync(PATH_4222, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    console.log(`Updated fingerprints in ${PATH_4222}`);
    process.exit(0);
  }

  const errors = [];
  const warnings = [];

  function checkLen(code, label) {
    const n = [...label].length;
    if (n > MAX_LABEL_CHARS) {
      warnings.push(`${code}: ラベルが ${n} 文字（上限想定 ${MAX_LABEL_CHARS}）: ${label.slice(0, 40)}…`);
    }
  }

  for (const [code, expected] of Object.entries(parsed.labels421)) {
    const got = PC_LEDGER_V1_LABELS[code];
    checkLen(code, expected);
    if (got !== expected) {
      errors.push(`§4.2.1 ${code}: 期待「${expected}」実際「${got ?? '(未定義)'}」`);
    }
  }

  for (const [code, expected] of Object.entries(parsed.labels423)) {
    const got = PC_LEDGER_V1_LABELS[code];
    checkLen(code, expected);
    if (got !== expected) {
      errors.push(`§4.2.3 ${code}: 期待「${expected}」実際「${got ?? '(未定義)'}」`);
    }
  }

  for (const [code, expected] of Object.entries(parsed.labels424)) {
    const got = PC_LEDGER_V1_LABELS[code];
    checkLen(code, expected);
    if (got !== expected) {
      errors.push(`§4.2.4 ${code}: 期待「${expected}」実際「${got ?? '(未定義)'}」`);
    }
  }

  const fields4222 = doc4222.fields;
  for (const code of Object.keys(fields4222)) {
    const row = parsed.matrix422[code];
    const meta = fields4222[code];
    if (!row) {
      errors.push(`§4.2.2 ${code}: 正本に行がありません`);
      continue;
    }
    if (meta.matrix_fingerprint !== row.fingerprint) {
      errors.push(
        `§4.2.2 ${code}: マトリクス指紋不一致（正本が変わった可能性）。期待 ${meta.matrix_fingerprint} 実際 ${row.fingerprint} — npm run pc-ledger:verify-labels-spec の --update-4222-fingerprints で更新後、ラベル文言を見直してください`
      );
    }
    const got = PC_LEDGER_V1_LABELS[code];
    if (got !== meta.ui_label) {
      errors.push(`§4.2.2 ${code}: UIラベル期待「${meta.ui_label}」実際「${got ?? '(未定義)'}」`);
    }
    checkLen(code, meta.ui_label);
  }

  const extFields = docExt.fields;
  for (const [code, meta] of Object.entries(extFields)) {
    const got = PC_LEDGER_V1_LABELS[code];
    if (got !== meta.label) {
      errors.push(`拡張 ${code}: 期待「${meta.label}」実際「${got ?? '(未定義)'}」`);
    }
    checkLen(code, meta.label);
  }

  const expectedCodes = new Set([
    ...Object.keys(parsed.labels421),
    ...Object.keys(parsed.matrix422),
    ...Object.keys(parsed.labels423),
    ...Object.keys(parsed.labels424),
    ...Object.keys(extFields),
  ]);
  const actualCodes = new Set(Object.keys(PC_LEDGER_V1_LABELS));

  for (const c of actualCodes) {
    if (!expectedCodes.has(c)) {
      errors.push(`余分なキー: ${c}（正本§4.2 + 拡張 JSON に無い）`);
    }
  }
  for (const c of expectedCodes) {
    if (!actualCodes.has(c)) {
      errors.push(`欠落キー: ${c}（pc-ledger-v1-labels.mjs に未定義）`);
    }
  }

  for (const w of warnings) console.warn(`WARN ${w}`);
  if (errors.length) {
    console.error('--- pc-ledger label / spec 不一致 ---');
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log(
    `OK: PC_LEDGER_V1_LABELS が正本 §4.2（${SPEC}）+ §4.2.2 UI JSON + 拡張 JSON と一致（${actualCodes.size} フィールド）`
  );
}

main();
