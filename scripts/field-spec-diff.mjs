#!/usr/bin/env node
// scripts/field-spec-diff.mjs
//
// PC 台帳 Day 4 の人為ミス防止用ツール。
//
// 機能:
//   1. --generate: 仕様書 markdown のフィールド表から
//      kintone-add-form-fields の properties JSON を生成 (浜田 GO 取得用テンプレ)
//   2. --diff:     仕様 vs 実際の get-form-fields 結果を機械照合 → diff 0 でなければ exit 1
//
// 期待する仕様 markdown 形式 (Day 4 plan §2):
//   | # | code | type | required | unique | 備考 |
//   |---|------|------|----------|--------|------|
//   | 1 | pc_name | SINGLE_LINE_TEXT | true | false | ... |
//
// 備考列の特殊記法:
//   options: [a, b, c]    -> DROP_DOWN / CHECK_BOX の選択肢
//   default=<value>       -> defaultValue
//
// 使い方:
//   node scripts/field-spec-diff.mjs --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md --generate
//   node scripts/field-spec-diff.mjs --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md --actual=data/snapshots/674-form-2026-04-26.json --diff
//
// 注意:
//   - kintone API write は本ツール対象外 (Tier B / 浜田 GO 必須)
//   - 本ツールは read + parse + 比較のみ実施 (Tier A 自律)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = { spec: null, actual: null, mode: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--spec=')) args.spec = a.slice('--spec='.length);
    else if (a.startsWith('--actual=')) args.actual = a.slice('--actual='.length);
    else if (a === '--generate') args.mode = 'generate';
    else if (a === '--diff') args.mode = 'diff';
    else if (a === '--help' || a === '-h') args.mode = 'help';
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/field-spec-diff.mjs --spec=<spec.md> --generate
  node scripts/field-spec-diff.mjs --spec=<spec.md> --actual=<actual.json> --diff
`);
}

const KINTONE_TYPES = new Set([
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'NUMBER',
  'DROP_DOWN',
  'CHECK_BOX',
  'RADIO_BUTTON',
  'DATE',
  'TIME',
  'DATETIME',
  'LINK',
  'FILE',
  'USER_SELECT',
  'GROUP_SELECT',
  'ORGANIZATION_SELECT',
  'STATUS',
  'CREATED_TIME',
  'UPDATED_TIME',
  'CREATOR',
  'MODIFIER',
]);

// markdown 表の各行 (`| ... |`) をパース
function parseTableRow(line) {
  if (!line.trim().startsWith('|')) return null;
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length < 6) return null;
  return cells;
}

// 備考列 (最後のセル) から options / default を抽出
function parseRemarks(remarks) {
  const result = { options: null, defaultValue: null };

  // options: [a, b, c] / options: [a, b, c] / default=...
  const optMatch = remarks.match(/options:\s*\[([^\]]+)\]/i);
  if (optMatch) {
    result.options = optMatch[1]
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const defMatch = remarks.match(/default\s*[=＝]\s*([^\s/、]+)/i);
  if (defMatch) {
    result.defaultValue = defMatch[1].trim();
  }

  return result;
}

// 仕様 markdown を読み込んでフィールド一覧を抽出
function parseSpecMarkdown(specPath) {
  const text = readFileSync(specPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const fields = [];
  let inFieldTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseTableRow(line);
    if (!cells) {
      inFieldTable = false;
      continue;
    }

    // ヘッダ行検出: # / code / type / required / unique / 備考 を含む
    const lower = cells.map((c) => c.toLowerCase());
    const isHeader =
      lower.includes('code') &&
      lower.includes('type') &&
      lower.includes('required') &&
      lower.includes('unique');

    if (isHeader) {
      inFieldTable = true;
      continue;
    }

    // 区切り行 (---|---|...)
    if (cells.every((c) => /^-+$/.test(c.replace(/\s/g, '')))) {
      continue;
    }

    if (!inFieldTable) continue;

    // データ行: | # | code | type | required | unique | 備考 |
    const stripBackticks = (s) => s.replace(/^`(.*)`$/, '$1').trim();
    const [num, codeRaw, type, req, uniq, ...rest] = cells;
    const code = stripBackticks(codeRaw);
    const remarks = rest.join(' | ');

    if (!code || code === 'code') continue;
    if (!KINTONE_TYPES.has(type)) {
      // 型でないものはスキップ (例: 説明列違いの表)
      continue;
    }

    const required = req === 'true';
    const unique = uniq === 'true';
    const remarksParsed = parseRemarks(remarks);

    fields.push({
      number: parseInt(num, 10) || null,
      code,
      type,
      required,
      unique,
      ...remarksParsed,
      remarks,
    });
  }

  return fields;
}

// kintone-add-form-fields 形式の properties JSON を生成
function generateProperties(fields) {
  const properties = {};
  for (const f of fields) {
    const prop = {
      type: f.type,
      code: f.code,
      label: f.code,
      required: f.required,
    };
    if (f.unique && (f.type === 'SINGLE_LINE_TEXT' || f.type === 'NUMBER')) {
      prop.unique = true;
    }
    if (f.options && (f.type === 'DROP_DOWN' || f.type === 'CHECK_BOX' || f.type === 'RADIO_BUTTON')) {
      prop.options = {};
      for (let idx = 0; idx < f.options.length; idx++) {
        prop.options[f.options[idx]] = { label: f.options[idx], index: String(idx) };
      }
    }
    if (f.defaultValue) {
      if (f.type === 'CHECK_BOX') {
        prop.defaultValue = [f.defaultValue];
      } else {
        prop.defaultValue = f.defaultValue;
      }
    }
    properties[f.code] = prop;
  }
  return properties;
}

// 実際の get-form-fields JSON (kintone API レスポンス) と仕様を比較
function diffFields(specFields, actualJson) {
  const actualProps = actualJson.properties || actualJson;
  const specMap = new Map(specFields.map((f) => [f.code, f]));
  const actualMap = new Map(Object.entries(actualProps));

  const issues = [];

  for (const [code, spec] of specMap) {
    const actual = actualMap.get(code);
    if (!actual) {
      issues.push({ code, severity: 'error', kind: 'missing', detail: '仕様にあるが実装にない' });
      continue;
    }
    if (actual.type !== spec.type) {
      issues.push({
        code,
        severity: 'error',
        kind: 'type_mismatch',
        detail: `仕様=${spec.type} 実装=${actual.type}`,
      });
    }
    if (Boolean(actual.required) !== Boolean(spec.required)) {
      issues.push({
        code,
        severity: 'warn',
        kind: 'required_mismatch',
        detail: `仕様=${spec.required} 実装=${Boolean(actual.required)}`,
      });
    }
    if (spec.unique && !actual.unique) {
      issues.push({
        code,
        severity: 'error',
        kind: 'unique_mismatch',
        detail: `仕様=unique=true 実装=unique=${Boolean(actual.unique)}`,
      });
    }
  }

  // 標準フィールドと customize で消せないものは除外
  const STANDARD_FIELDS = new Set([
    'レコード番号', 'Record_number', '$id',
    '作成日時', 'Created_datetime', 'CREATED_TIME',
    '更新日時', 'Updated_datetime', 'UPDATED_TIME',
    '作成者', 'Created_by', 'CREATOR',
    '更新者', 'Updated_by', 'MODIFIER',
    '$revision',
    'カテゴリー', 'Categories',
    'ステータス', 'Status',
    '作業者', 'Assignee',
  ]);

  for (const [code, actual] of actualMap) {
    if (specMap.has(code)) continue;
    if (STANDARD_FIELDS.has(code)) continue;
    // 標準フィールドの type 名でも除外
    if (
      actual.type === 'RECORD_NUMBER' ||
      actual.type === 'CREATED_TIME' ||
      actual.type === 'UPDATED_TIME' ||
      actual.type === 'CREATOR' ||
      actual.type === 'MODIFIER' ||
      actual.type === 'STATUS' ||
      actual.type === 'STATUS_ASSIGNEE' ||
      actual.type === 'CATEGORY'
    ) {
      continue;
    }
    issues.push({
      code,
      severity: 'warn',
      kind: 'extra',
      detail: `実装にあるが仕様にない (type=${actual.type})`,
    });
  }

  return issues;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.mode || args.mode === 'help') {
    printHelp();
    process.exit(args.mode === 'help' ? 0 : 1);
  }
  if (!args.spec) {
    console.error('Error: --spec=<path> is required');
    printHelp();
    process.exit(2);
  }

  const specPath = resolve(args.spec);
  const fields = parseSpecMarkdown(specPath);

  if (fields.length === 0) {
    console.error(`Error: ${args.spec} からフィールド表を 1 つも抽出できませんでした`);
    process.exit(2);
  }

  if (args.mode === 'generate') {
    const properties = generateProperties(fields);
    const out = { properties };
    console.log(JSON.stringify(out, null, 2));
    console.error(`[field-spec-diff] generated ${fields.length} fields`);
    process.exit(0);
  }

  if (args.mode === 'diff') {
    if (!args.actual) {
      console.error('Error: --actual=<json> is required for --diff mode');
      process.exit(2);
    }
    const actualText = readFileSync(resolve(args.actual), 'utf8');
    const actualJson = JSON.parse(actualText);
    const issues = diffFields(fields, actualJson);

    if (issues.length === 0) {
      console.log(`✅ ${fields.length} fields all match (spec vs actual)`);
      process.exit(0);
    }

    console.log(`❌ ${issues.length} diff issue(s) found:`);
    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '🔴' : '🟡';
      console.log(`  ${icon} [${issue.kind}] ${issue.code}: ${issue.detail}`);
    }
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

main();
