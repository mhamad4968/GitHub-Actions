/**
 * 実行予算書 — 計算コア（Phase 2 Excel 正）
 * Browser: jikkou-yosan-build-desktop.mjs bundles jikkou-yosan-excel-cost-layout.mjs first
 */
import {
  COST_GROUP_STARTERS,
  costGroupSubtotalNote,
  assignCostBorderRoles,
  syncWorkTypeSubtotalRows,
} from './jikkou-yosan-excel-cost-layout.mjs';

export {
  COST_GROUP_STARTERS,
  COST_GROUP_LABELS,
  costGroupSubtotalNote,
  assignCostBorderRoles,
  costBorderCssClass,
  syncWorkTypeSubtotalRows,
  isCountableCostRow,
} from './jikkou-yosan-excel-cost-layout.mjs';


export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function truncateSig3(x) {
  if (!x || x === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const factor = Math.pow(10, exp - 2);
  return Math.floor(x / factor) * factor;
}

export function calcSpecAmount(qty, unitPrice) {
  return num(qty) * num(unitPrice);
}

export function sumSpecLines(lines) {
  let t = 0;
  for (let i = 0; i < lines.length; i += 1) t += num(lines[i].spec_amount);
  return t;
}

export function sumMatGroup(lines, group) {
  let t = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].mat_group === group) t += num(lines[i].mat_amount);
  }
  return t;
}

const SUB_CALC_KINDS = new Set(['overhead', 'insurance', 'block_total', 'legal_welfare', 'order_amount', 'labor_total']);

export function calcSubcontractBlock(lines, block, contractTotal1) {
  const rows = lines.filter((r) => r.subcontract_block === block);
  let detailSum = 0;
  let laborDay = 0;
  let laborNight = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (r.sub_row_kind === 'detail' || (!r.sub_row_kind && r.sub_line_type)) {
      if (r.sub_row_kind !== 'vendor') {
        if (num(r.sub_qty) && num(r.sub_unit_price)) r.sub_amount = num(r.sub_qty) * num(r.sub_unit_price);
      }
    }
    if (r.sub_row_kind === 'detail' || r.sub_row_kind === 'vendor' || !r.sub_row_kind) {
      if (r.sub_line_type === '労務費（昼）') laborDay += num(r.sub_amount);
      if (r.sub_line_type === '労務費（夜）') laborNight += num(r.sub_amount);
      if (r.sub_row_kind === 'detail') detailSum += num(r.sub_amount);
    }
  }
  const overhead = detailSum * 0.1;
  // Excel 2623001-001: 任意保険減額は block_total へ反映しない（OPEN-CALC-01 / サンプル一致）
  const insuranceDeduct = 0;
  const blockTotal = detailSum + overhead - insuranceDeduct;
  const legalWelfare = (laborDay + laborNight) * 0.1533;
  const rawOrder = blockTotal + legalWelfare;
  const orderAmount = truncateSig3(rawOrder);

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (r.sub_row_kind === 'overhead') r.sub_amount = overhead;
    else if (r.sub_row_kind === 'block_total') r.sub_amount = blockTotal;
    else if (r.sub_row_kind === 'legal_welfare') r.sub_amount = legalWelfare;
    else if (r.sub_row_kind === 'order_amount') r.sub_amount = orderAmount;
    else if (r.sub_row_kind === 'labor_total') r.sub_amount = detailSum;
    else if (r.sub_row_kind === 'detail' && r.sub_unit === '%' && r.sub_line_type === '諸経費') {
      r.sub_amount = overhead;
    }
  }
  return { detailSum, overhead, blockTotal, legalWelfare, orderAmount, laborTotal: detailSum };
}

export function blockOrderAmount(lines, block) {
  const rows = lines.filter((r) => r.subcontract_block === block);
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].sub_row_kind === 'order_amount') return num(rows[i].sub_amount);
    if (rows[i].sub_row_kind === 'labor_total') return num(rows[i].sub_amount);
  }
  return 0;
}

export function calcCostTotal8(costLines) {
  let t = 0;
  for (let i = 0; i < costLines.length; i += 1) {
    const c = costLines[i];
    if (c.cost_row_kind !== 'detail' && c.cost_row_kind !== 'link') continue;
    if (String(c.cost_work_type || '').indexOf('追加工事⑤') >= 0) continue;
    if (c.cost_group_key === 'addon5_excluded') continue;
    t += num(c.cost_amount);
  }
  return t;
}

/** Excel 総括表 — 小計行の金額・備考をグループ直前の明細から再計算 */
export function applyCostGroupSubtotals(lines) {
  let groupKey = '';
  for (let i = 0; i < lines.length; i += 1) {
    const r = lines[i];
    const wt = String(r.cost_work_type || '').trim();
    if (wt && wt !== '計' && COST_GROUP_STARTERS[wt]) {
      groupKey = COST_GROUP_STARTERS[wt];
      r.cost_group_key = groupKey;
    } else if (groupKey && !isSubtotalRow(r)) {
      r.cost_group_key = r.cost_group_key || groupKey;
      if (!wt && groupKey === 'rental') r.cost_work_type = '';
    }
    if (r.cost_row_kind === 'subtotal') {
      const gk = r.cost_group_key || groupKey;
      let sum = 0;
      for (let j = i - 1; j >= 0; j -= 1) {
        const p = lines[j];
        if (isSubtotalRow(p)) break;
        if (p.cost_row_kind !== 'detail' && p.cost_row_kind !== 'link') break;
        if (gk && p.cost_group_key && p.cost_group_key !== gk) break;
        sum += num(p.cost_amount);
      }
      r.cost_work_type = '計';
      r.cost_group_key = gk;
      r.subtotal_display_amount = sum;
      r.cost_amount = sum;
      r.cost_basis_note = costGroupSubtotalNote(gk);
      groupKey = '';
    }
  }
  return lines;
}

export function applyDetailLinks(costLines, ctx) {
  const map = {
    '②': ctx.mat_total_2,
    '③': ctx.mat_total_3,
    '④': ctx.sub_repair_order_amount,
    '⑤': ctx.sub_scaffold_order_amount,
    '⑥': ctx.sub_paint_order_amount,
    '⑦': ctx.sub_labor_total,
  };
  for (let i = 0; i < costLines.length; i += 1) {
    const r = costLines[i];
    if (r.cost_row_kind === 'link' && r.detail_marker && map[r.detail_marker] != null) {
      r.cost_amount = map[r.detail_marker];
    }
  }
}

export function recalcAll(state) {
  for (let i = 0; i < state.spec_lines.length; i += 1) {
    const s = state.spec_lines[i];
    s.spec_amount = calcSpecAmount(s.spec_qty, s.spec_unit_price);
  }
  const contract_total_1 = sumSpecLines(state.spec_lines);
  state.contract_total_1 = contract_total_1;

  for (let i = 0; i < state.mat_lines.length; i += 1) {
    const m = state.mat_lines[i];
    m.mat_amount = calcSpecAmount(m.mat_qty, m.mat_unit_price);
  }
  state.mat_total_2 = sumMatGroup(state.mat_lines, '塗料');
  state.mat_total_3 = sumMatGroup(state.mat_lines, 'その他');

  calcSubcontractBlock(state.subcontract_lines, 'repair', contract_total_1);
  calcSubcontractBlock(state.subcontract_lines, 'scaffold', contract_total_1);
  calcSubcontractBlock(state.subcontract_lines, 'paint', contract_total_1);
  calcSubcontractBlock(state.subcontract_lines, 'labor', contract_total_1);

  state.sub_repair_order_amount = blockOrderAmount(state.subcontract_lines, 'repair');
  state.sub_scaffold_order_amount = blockOrderAmount(state.subcontract_lines, 'scaffold');
  state.sub_paint_order_amount = blockOrderAmount(state.subcontract_lines, 'paint');
  state.sub_labor_total = blockOrderAmount(state.subcontract_lines, 'labor');

  state.cost_lines = syncWorkTypeSubtotalRows(state.cost_lines);

  applyDetailLinks(state.cost_lines, state);

  for (let i = 0; i < state.cost_lines.length; i += 1) {
    const c = state.cost_lines[i];
    if (c.cost_row_kind === 'detail' && c.cost_qty != null && c.cost_unit_price != null) {
      c.cost_amount = calcSpecAmount(c.cost_qty, c.cost_unit_price);
    }
  }

  applyCostGroupSubtotals(state.cost_lines);
  assignCostBorderRoles(state.cost_lines);

  for (let i = 0; i < state.cost_lines.length; i += 1) {
    const c = state.cost_lines[i];
    if (contract_total_1 > 0) c.cost_ratio = num(c.cost_amount) / contract_total_1;
    else c.cost_ratio = 0;
  }

  state.cost_total_8 = calcCostTotal8(state.cost_lines);
  state.profit_9 = contract_total_1 - state.cost_total_8;
  state.profit_rate = contract_total_1 > 0 ? state.profit_9 / contract_total_1 : 0;
  return state;
}

// BROWSER_CORE_START

export function jpHolidayYmdForBundle() {
  return {};
}
