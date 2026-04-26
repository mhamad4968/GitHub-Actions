#!/usr/bin/env node
/**
 * kintone 表示ラベル（短文）と正本仕様書の機械的整合を検証する。
 *
 * - **画面ラベル（短文）の正本**: scripts/data/pc-ledger-v1-ui-display-labels.json（= `PC_LEDGER_V1_LABELS`）
 * - **意味・候補値・ルールの正本**: docs/plans/2026-04-21-new-pc-ledger-spec.md §4.2（長文はこちら。ラベルに載せない）
 * - **§4.2.2**: マトリクス行の指紋 + `pc-ledger-spec-4222-ui-labels.json` の `ui_label` が短文 JSON と一致
 * - **正本表外**: scripts/data/pc-ledger-spec-field-extensions.json の `label` が短文 JSON と一致
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
const PATH_DISPLAY = path.join(__dirname, 'data/pc-ledger-v1-ui-display-labels.json');

const MAX_LABEL_CHARS = 64;

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const updateFp = process.argv.includes('--update-4222-fingerprints');

  const parsed = parsePcLedgerSpec42(SPEC);
  const doc4222 = loadJson(PATH_4222);
  const docExt = loadJson(PATH_EXT);
  const docDisplay = loadJson(PATH_DISPLAY);
  const displayFields = docDisplay.fields;
  if (!displayFields || typeof displayFields !== 'object') {
    console.error(`${PATH_DISPLAY}: missing "fields" object`);
    process.exit(1);
  }

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

  for (const [code, lbl] of Object.entries(displayFields)) {
    const got = PC_LEDGER_V1_LABELS[code];
    if (got !== lbl) {
      errors.push(`短文正本 ${code}: JSON「${lbl}」≠ pc-ledger-v1-labels「${got ?? '(未定義)'}」`);
    }
    checkLen(code, lbl);
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
    `OK: 表示ラベル（短文）${actualCodes.size} 件 = ${PATH_DISPLAY} + §4.2.2 指紋 + 拡張 JSON（意味の正本: ${SPEC} §4.2）`
  );
}

main();
