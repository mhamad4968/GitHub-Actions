#!/usr/bin/env node
/**
 * サンプル 2623001-001 — 書式.xls 正本（extract → recalc → verify）
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recalcAll, num } from './jikkou-yosan-calc-core.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const EXTRACTED_PATH = path.join(ROOT, 'data', 'jikkou-yosan-sample-2623001-extracted.json');

const GROUP_WORK_TYPE = {
  manager_wage: '工事管理者賃金',
  manager_wage_ins: '工事管理者（保）賃金',
  line_close: '線閉責任者',
  train_watch: '列車見張員',
  traffic: '交通整理員等',
};

function loadExtracted() {
  return JSON.parse(readFileSync(EXTRACTED_PATH, 'utf8'));
}

function isDayNightCategory(cat) {
  return /（昼）|（夜）/.test(String(cat || ''));
}

/** Excel「計」行に載った明細（夜行・レンタルその他等）を detail へ移す */
function postProcessCostLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const r = { ...lines[i] };
    if (r.cost_row_kind === 'subtotal' && isDayNightCategory(r.cost_category)) {
      const wt = GROUP_WORK_TYPE[r.cost_group_key] || r.cost_work_type;
      const prev = out[out.length - 1];
      if (!prev || prev.cost_category !== r.cost_category) {
        out.push({
          cost_work_type: wt === '計' ? GROUP_WORK_TYPE[r.cost_group_key] : wt,
          cost_category: r.cost_category,
          cost_row_kind: 'detail',
          cost_group_key: r.cost_group_key,
          cost_tax_rate: r.cost_tax_rate,
          cost_unit: r.cost_unit || '',
          cost_qty: r.cost_qty || '',
          cost_unit_price: r.cost_unit_price || '',
          cost_amount: num(r.cost_qty) * num(r.cost_unit_price) || num(r.cost_amount),
          cost_basis_note: r.cost_basis_note === '計' ? '' : (r.cost_basis_note || ''),
          detail_marker: '',
        });
      }
      out.push({
        ...r,
        cost_work_type: '計',
        cost_category: '',
        cost_amount: 0,
        cost_qty: '',
        cost_unit_price: '',
      });
      continue;
    }
    if (
      r.cost_row_kind === 'subtotal'
      && r.cost_group_key === 'rental'
      && r.cost_category === 'その他'
      && num(r.cost_unit_price) > 0
    ) {
      out.push({
        cost_work_type: '',
        cost_category: 'その他',
        cost_row_kind: 'detail',
        cost_group_key: 'rental',
        cost_tax_rate: r.cost_tax_rate,
        cost_unit: r.cost_unit || '式',
        cost_qty: r.cost_qty || '1',
        cost_unit_price: r.cost_unit_price,
        cost_amount: num(r.cost_qty) * num(r.cost_unit_price) || num(r.cost_unit_price),
        cost_basis_note: '発電機等 カナモト',
        detail_marker: '',
      });
      out.push({
        ...r,
        cost_work_type: '計',
        cost_category: '',
        cost_amount: 0,
        cost_qty: '',
        cost_unit_price: '',
      });
      continue;
    }
    out.push(r);
  }
  return out;
}

function blocksToSubcontractLines(blocks) {
  const rows = [];
  blocks.forEach(function (b) {
    rows.push({
      subcontract_block: b.block,
      sub_row_kind: 'vendor',
      sub_vendor: b.vendor || '',
      sub_line_type: '',
      sub_unit: '',
      sub_qty: '',
      sub_unit_price: '',
      sub_amount: 0,
      sub_basis: '',
    });
    b.lines.forEach(function (ln) {
      rows.push({
        subcontract_block: b.block,
        sub_row_kind: ln.sub_row_kind,
        sub_vendor: '',
        sub_line_type: ln.sub_line_type,
        sub_unit: ln.sub_unit,
        sub_qty: ln.sub_qty,
        sub_unit_price: ln.sub_unit_price,
        sub_amount: ln.sub_amount,
        sub_basis: ln.sub_basis,
      });
    });
  });
  return rows;
}

export function buildSample2623001() {
  const extracted = loadExtracted();
  const state = {
    ...extracted.header,
    spec_lines: extracted.spec_lines.map(function (r) {
      return { ...r, spec_amount: 0 };
    }),
    mat_lines: extracted.mat_lines.map(function (r) {
      return { ...r, mat_amount: 0 };
    }),
    cost_lines: postProcessCostLines(extracted.cost_lines),
    subcontract_lines: blocksToSubcontractLines(extracted.subcontract_blocks),
  };
  return recalcAll(state);
}

export const EXPECTED = {
  contract_total_1: 164697500,
  mat_total_2: 2721440,
  mat_total_3: 27000,
  sub_paint_order_amount: 58000000,
  cost_total_8: 83633440,
  profit_9: 81064060,
};

export function verifySample(state) {
  const fails = [];
  Object.entries(EXPECTED).forEach(function ([k, v]) {
    if (num(state[k]) !== v) fails.push(`${k}: got ${state[k]} expected ${v}`);
  });
  return fails;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const s = buildSample2623001();
  const fails = verifySample(s);
  if (fails.length) {
    console.error('VERIFY FAIL', fails);
    process.exit(1);
  }
  console.log('OK sample 2623001-001', EXPECTED);
}
