/**
 * App 736 — row_key 保全（B-1）
 * recalcState の cost_lines 経路と同型。desktop.ui.js の costLineFromCalcRow と同期すること。
 */
import { randomUUID } from 'node:crypto';

const KIND_TO_CALC = {
  detail: 'detail',
  '詳細表と連携': 'link',
  link: 'link',
  subtotal: 'subtotal',
  計: 'subtotal',
};

const KIND_FROM_CALC = {
  detail: 'detail',
  link: '詳細表と連携',
  subtotal: '計',
};

export const ROW_KEY_TABLES = [
  { table: 'spec_lines', field: 'row_key' },
  { table: 'cost_lines', field: 'row_key' },
  { table: 'mat_lines', field: 'row_key' },
  { table: 'subcontract_lines', field: 'row_key' },
];

export function newRowKey() {
  return randomUUID();
}

export function ensureRowKeysOnState(state) {
  for (const { table, field } of ROW_KEY_TABLES) {
    const rows = state[table];
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      if (r && !String(r[field] || r.row_key || '').trim()) {
        r[field] = r.row_key = newRowKey();
      } else if (r && field !== 'row_key') {
        r.row_key = String(r[field] || r.row_key || '').trim();
      }
    }
  }
  return state;
}

export function countNonemptyRowKeys(state) {
  const counts = {};
  for (const { table, field } of ROW_KEY_TABLES) {
    const rows = state[table];
    if (!Array.isArray(rows)) {
      counts[table] = 0;
      continue;
    }
    counts[table] = rows.filter((r) => String(r?.[field] || r?.row_key || '').trim()).length;
  }
  return counts;
}

/** desktop.ui.js costLineFromCalcRow と同一 */
export function costLineFromCalcRow(r) {
  return {
    row_key: String(r.row_key || '').trim(),
    cost_work_type_code: r.cost_work_type_code || '',
    cost_work_type: r.cost_work_type || '',
    cost_category_code: r.cost_category_code || '',
    cost_category: r.cost_category || '',
    cost_row_kind: KIND_FROM_CALC[r.cost_row_kind] || r.cost_row_kind,
    cost_group_key: r.cost_group_key || '',
    cost_tax_rate: r.cost_tax_rate != null && r.cost_tax_rate !== '' ? r.cost_tax_rate : '',
    cost_unit: r.cost_unit || '',
    cost_qty: r.cost_qty != null && r.cost_qty !== '' ? r.cost_qty : '',
    cost_unit_price: r.cost_unit_price != null && r.cost_unit_price !== '' ? r.cost_unit_price : '',
    cost_amount: r.cost_amount,
    cost_basis_note: r.cost_basis_note || '',
    detail_marker: r.detail_marker || '',
    cost_ratio: r.cost_ratio,
    subtotal_display_amount: r.subtotal_display_amount,
    excel_border_role: r.excel_border_role,
  };
}

/**
 * recalcState の cost_lines 部分のみ（Node テスト用）。
 * @param {object} state
 * @param {(s: object) => object} recalcAllFn — jikkou-yosan-calc-core.recalcAll
 */
export function recalcCostLinesPreserveKeys(state, recalcAllFn) {
  const calc = JSON.parse(JSON.stringify(state));
  calc.cost_lines.forEach(function (r) {
    r.cost_row_kind = KIND_TO_CALC[r.cost_row_kind] || r.cost_row_kind;
  });
  recalcAllFn(calc);
  state.cost_lines = calc.cost_lines.map(function (r) {
    return costLineFromCalcRow(r);
  });
  ensureRowKeysOnState(state);
  state.spec_lines = calc.spec_lines;
  state.mat_lines = calc.mat_lines;
  state.subcontract_lines = calc.subcontract_lines;
  state.contract_total_1 = calc.contract_total_1;
  state.mat_total_2 = calc.mat_total_2;
  state.mat_total_3 = calc.mat_total_3;
  state.sub_repair_order_amount = calc.sub_repair_order_amount;
  state.sub_scaffold_order_amount = calc.sub_scaffold_order_amount;
  state.sub_paint_order_amount = calc.sub_paint_order_amount;
  state.sub_labor_total = calc.sub_labor_total;
  state.cost_total_8 = calc.cost_total_8;
  state.profit_9 = calc.profit_9;
  state.profit_rate = calc.profit_rate;
  return state;
}
