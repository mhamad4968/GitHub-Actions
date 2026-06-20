/**
 * 実行予算書作成支援ツール　ver.01 — BUILD 2026-06-20-jikkou-yosan-title-banner-wide
 * Master app: 735
 */
(function () {
  'use strict';
  const BUILD = '2026-06-20-jikkou-yosan-title-banner-wide';
  const APP_MASTER = 735;
  const DEFAULT_COST_TEMPLATE = [
  { "cost_work_type_code": "10100", "cost_work_type": "材料費", "cost_category_code": "", "cost_category": "塗料", "cost_row_kind": "link", "cost_group_key": "material", "cost_tax_rate": 0.1, "cost_unit": "－", "detail_marker": "②", "cost_basis_note": "詳細表にて内訳を記載…②" },
  { "cost_work_type": "材料費", "cost_category": "その他", "cost_row_kind": "link", "cost_group_key": "material", "cost_tax_rate": 0.1, "cost_unit": "－", "detail_marker": "③", "cost_basis_note": "詳細表にて内訳を記載…③" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "material", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "修繕工事", "cost_category": "注文金額", "cost_row_kind": "link", "cost_tax_rate": 0.1, "cost_unit": "－", "detail_marker": "④", "cost_basis_note": "詳細表にて内訳を記載…④" },
  { "cost_work_type": "足場工事", "cost_category": "注文金額", "cost_row_kind": "link", "cost_tax_rate": 0.1, "cost_unit": "－", "detail_marker": "⑤", "cost_basis_note": "詳細表にて内訳を記載…⑤" },
  { "cost_work_type": "塗装及び足場工事", "cost_category": "注文金額", "cost_row_kind": "link", "cost_tax_rate": 0.1, "cost_unit": "－", "detail_marker": "⑥", "cost_basis_note": "詳細表にて内訳を記載…⑥" },
  { "cost_work_type": "直轄施工班", "cost_category": "労務費等", "cost_row_kind": "link", "cost_tax_rate": 0, "cost_unit": "－", "detail_marker": "⑦", "cost_basis_note": "詳細表にて内訳を記載…⑦" },
  { "cost_work_type": "塗装附帯工事", "cost_category": "外注費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "塗装附帯工事", "cost_category": "外注費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "鎌ヶ谷資材使用料", "cost_category": "足場材・機械損料", "cost_row_kind": "detail", "cost_tax_rate": 0, "cost_unit": "式" },
  { "cost_work_type": "工事管理者賃金", "cost_category": "工事管理者賃金等（昼）", "cost_row_kind": "detail", "cost_group_key": "manager_wage" },
  { "cost_work_type": "工事管理者賃金", "cost_category": "工事管理者賃金等（夜）", "cost_row_kind": "detail", "cost_group_key": "manager_wage" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "manager_wage", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "工事管理者（保）賃金", "cost_category": "工事管理者（保）賃金等（昼）", "cost_row_kind": "detail", "cost_group_key": "manager_wage_ins" },
  { "cost_work_type": "工事管理者（保）賃金", "cost_category": "工事管理者（保）賃金等（夜）", "cost_row_kind": "detail", "cost_group_key": "manager_wage_ins" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "manager_wage_ins", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "線閉責任者", "cost_category": "線閉責任者等（昼）", "cost_row_kind": "detail", "cost_group_key": "line_close" },
  { "cost_work_type": "線閉責任者", "cost_category": "線閉責任者等（夜）", "cost_row_kind": "detail", "cost_group_key": "line_close" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "line_close", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "列車見張員", "cost_category": "列車見張員等（昼）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_group_key": "train_watch" },
  { "cost_work_type": "列車見張員", "cost_category": "列車見張員等（夜）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_group_key": "train_watch" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "train_watch", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "交通整理員等", "cost_category": "交通整理員等（昼）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_group_key": "traffic" },
  { "cost_work_type": "交通整理員等", "cost_category": "交通整理員等（夜）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_group_key": "traffic" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "traffic", "cost_category": "", "cost_basis_note": "計" },
  { "cost_work_type": "重機誘導員", "cost_category": "重機誘導員（昼）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "重機誘導員", "cost_category": "重機誘導員（夜）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "検電接地", "cost_category": "検電接地等（昼）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "検電接地", "cost_category": "検電接地等（夜）", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "その他保安費", "cost_category": "その他保安費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "レンタル", "cost_category": "足場材等", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式", "cost_group_key": "rental" },
  { "cost_work_type": "", "cost_category": "高所作業車", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式", "cost_group_key": "rental" },
  { "cost_work_type": "", "cost_category": "クレーン装置付トラック等", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式", "cost_group_key": "rental" },
  { "cost_work_type": "", "cost_category": "仮設ハウス・トイレ等", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式", "cost_group_key": "rental" },
  { "cost_row_kind": "subtotal", "cost_work_type": "計", "cost_group_key": "rental", "cost_category": "その他", "cost_basis_note": "計" },
  { "cost_work_type": "運送費", "cost_category": "外注費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "産業廃棄物処理費", "cost_category": "産業廃棄物処理費", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "租税公課", "cost_category": "租税公課", "cost_row_kind": "detail", "cost_tax_rate": 0 },
  { "cost_work_type": "借地料等", "cost_category": "借地料等", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "消耗品費", "cost_category": "消耗品費", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "事務費", "cost_category": "事務費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "通信費", "cost_category": "通信費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "旅費交通費", "cost_category": "旅費交通費", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "借上げ自動車費", "cost_category": "借上げ自動車費", "cost_row_kind": "detail", "cost_tax_rate": 0.1 },
  { "cost_work_type": "履行保証保険料", "cost_category": "履行保証保険料", "cost_row_kind": "detail", "cost_tax_rate": 0 },
  { "cost_work_type": "建退共証紙購入費", "cost_category": "建退共証紙購入費", "cost_row_kind": "detail", "cost_tax_rate": 0 },
  { "cost_work_type": "補償費", "cost_category": "補償費", "cost_row_kind": "detail", "cost_tax_rate": 0 },
  { "cost_work_type": "諸雑費", "cost_category": "諸雑費", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "式" },
  { "cost_work_type": "諸会費", "cost_category": "諸会費", "cost_row_kind": "detail", "cost_tax_rate": 0 },
  { "cost_work_type": "社員助成費用", "cost_category": "社員助成費用", "cost_row_kind": "detail", "cost_tax_rate": 0, "cost_unit": "日" },
  { "cost_work_type": "追加工事⑤", "cost_category": "注文金額", "cost_row_kind": "detail", "cost_tax_rate": 0.1, "cost_unit": "－", "cost_group_key": "addon5_excluded" }
];

/**
 * 実行予算書 総括表・原価行 — Excel 書式.xls レイアウト正本
 *
 * Excel 実測（2623001-001）:
 * - 「計」行あり: 材料費 / 工事管理者賃金 / （保） / 線閉 / 列車見張 / 交通整理 / レンタル
 * - 単独行（上下罫線）: 修繕・足場・塗装⑥・直轄⑦・塗装附帯・鎌ヶ谷・保安費各種・経費各種
 * - 計行: col B(c1)=グループ合計, 金額列=最終明細（③/夜/レンタルその他 等）
 * - 罫線: group_first=上のみ / group_inner=なし / group_subtotal=下 / standalone=上下
 */

/** Excel で「計」行が付くグループのみ */
  const EXCEL_SUBTOTAL_GROUP_KEYS = new Set([
  'material',
  'manager_wage',
  'manager_wage_ins',
  'line_close',
  'train_watch',
  'traffic',
  'rental',
]);

  const COST_GROUP_STARTERS = {
  材料費: 'material',
  工事管理者賃金: 'manager_wage',
  '工事管理者（保）賃金': 'manager_wage_ins',
  線閉責任者: 'line_close',
  列車見張員: 'train_watch',
  交通整理員等: 'traffic',
  レンタル: 'rental',
};

/** 小計行の計算基準・備考表示（例: 材料費合計） */
  const COST_GROUP_LABELS = {
  material: '材料費',
  manager_wage: '工事管理者賃金',
  manager_wage_ins: '工事管理者（保）賃金',
  line_close: '線閉責任者',
  train_watch: '列車見張員',
  traffic: '交通整理員等',
  rental: 'レンタル',
};

  function costGroupSubtotalNote(groupKey) {
  const key = String(groupKey || '').trim();
  const label = COST_GROUP_LABELS[key];
  if (label) return label + '合計';
  const wtMatch = key.match(/^wt:(.+)$/);
  if (wtMatch) return wtMatch[1] + '合計';
  return '合計';
}

  function isCountableCostRow(r) {
  const kind = r.cost_row_kind;
  return kind === 'detail' || kind === 'link' || kind === '明細' || kind === '連携';
}

function effectiveWorkType(r, carry) {
  const wt = String(r.cost_work_type || '').trim();
  if (wt && wt !== '計') return wt;
  return carry || '';
}

function groupKeyForWorkType(workType) {
  return COST_GROUP_STARTERS[workType] || 'wt:' + workType;
}

function makeSubtotalRow(workType, groupRows) {
  const gk = groupKeyForWorkType(workType);
  const last = groupRows[groupRows.length - 1];
  return {
    cost_work_type_code: '',
    cost_work_type: '計',
    cost_category_code: '',
    cost_category: gk === 'rental' && last ? (last.cost_category || '') : '',
    cost_row_kind: 'subtotal',
    cost_group_key: gk,
    cost_tax_rate: '',
    cost_unit: '',
    cost_qty: '',
    cost_unit_price: '',
    cost_amount: 0,
    cost_basis_note: costGroupSubtotalNote(gk),
    detail_marker: '',
    subtotal_display_amount: 0,
    cost_ratio: 0,
    excel_border_role: 'group_subtotal',
  };
}

/**
 * 同じシステム入力工種が2行以上連続する塊の直後に「計」行を自動挿入する。
 * 既存の小計行はいったん除去し、再計算時に再生成する。
 */
  function syncWorkTypeSubtotalRows(lines) {
  const stripped = lines.filter(function (r) { return !isSubtotalRow(r); });
  const out = [];
  let i = 0;
  while (i < stripped.length) {
    const row = stripped[i];
    if (!isCountableCostRow(row)) {
      out.push(row);
      i += 1;
      continue;
    }
    let carry = '';
    const group = [];
    let groupWt = '';
    let j = i;
    while (j < stripped.length) {
      const r = stripped[j];
      if (!isCountableCostRow(r)) break;
      const wt = effectiveWorkType(r, carry);
      if (!wt) {
        if (group.length > 0) break;
        out.push(r);
        j += 1;
        i = j;
        group.length = 0;
        break;
      }
      if (!groupWt) groupWt = wt;
      else if (wt !== groupWt) break;
      carry = wt;
      group.push(r);
      j += 1;
    }
    if (group.length === 0) continue;
    const gk = groupKeyForWorkType(groupWt);
    group.forEach(function (r) { r.cost_group_key = gk; });
    group.forEach(function (r) { out.push(r); });
    if (group.length >= 2) {
      out.push(makeSubtotalRow(groupWt, group));
    }
    i = j;
  }
  return out;
}

  function isSubtotalGroupKey(key) {
  return EXCEL_SUBTOTAL_GROUP_KEYS.has(String(key || ''));
}

function isSubtotalRow(r) {
  return r.cost_row_kind === 'subtotal' || r.cost_row_kind === '小計';
}

function findGroupSubtotalIndex(lines, startIdx, groupKey) {
  for (let j = startIdx + 1; j < lines.length; j += 1) {
    const row = lines[j];
    if (isSubtotalRow(row) && row.cost_group_key === groupKey) return j;
    if (
      row.cost_group_key
      && row.cost_group_key !== groupKey
      && row.cost_work_type
      && row.cost_work_type !== '計'
    ) break;
  }
  return -1;
}

function findGroupFirstIndex(lines, idx, groupKey) {
  let first = idx;
  for (let j = idx - 1; j >= 0; j -= 1) {
    const row = lines[j];
    if (isSubtotalRow(row)) break;
    if (row.cost_group_key === groupKey && !isSubtotalRow(row)) first = j;
    else if (row.cost_work_type && row.cost_group_key !== groupKey) break;
  }
  return first;
}

/** Excel 罫線ロールを行へ付与（extract 済み excel_border_role は尊重） */
  function assignCostBorderRoles(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    const r = lines[i];
    if (r.excel_border_role) continue;

    if (isSubtotalRow(r)) {
      r.excel_border_role = 'group_subtotal';
      continue;
    }

    const gk = r.cost_group_key;
    if (gk) {
      const subIdx = findGroupSubtotalIndex(lines, i, gk);
      if (subIdx >= 0) {
        const firstIdx = findGroupFirstIndex(lines, i, gk);
        r.excel_border_role = i === firstIdx ? 'group_first' : 'group_inner';
        continue;
      }
    }

    r.excel_border_role = 'standalone';
  }
  return lines;
}

  function costBorderCssClass(role) {
  if (!role) return 'jy-cost-standalone';
  return 'jy-cost-' + String(role).replace(/_/g, '-');
}
/**
 * 実行予算書 — 計算コア（Phase 2 Excel 正）
 * Browser: jikkou-yosan-build-desktop.mjs bundles jikkou-yosan-excel-cost-layout.mjs first
 */
  function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

  function truncateSig3(x) {
  if (!x || x === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const factor = Math.pow(10, exp - 2);
  return Math.floor(x / factor) * factor;
}

  function calcSpecAmount(qty, unitPrice) {
  return num(qty) * num(unitPrice);
}

  function sumSpecLines(lines) {
  let t = 0;
  for (let i = 0; i < lines.length; i += 1) t += num(lines[i].spec_amount);
  return t;
}

  function sumMatGroup(lines, group) {
  let t = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].mat_group === group) t += num(lines[i].mat_amount);
  }
  return t;
}

const SUB_CALC_KINDS = new Set(['overhead', 'insurance', 'block_total', 'legal_welfare', 'order_amount', 'labor_total']);

  function calcSubcontractBlock(lines, block, contractTotal1) {
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

  function blockOrderAmount(lines, block) {
  const rows = lines.filter((r) => r.subcontract_block === block);
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].sub_row_kind === 'order_amount') return num(rows[i].sub_amount);
    if (rows[i].sub_row_kind === 'labor_total') return num(rows[i].sub_amount);
  }
  return 0;
}

  function calcCostTotal8(costLines) {
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
  function applyCostGroupSubtotals(lines) {
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

function isSubtotalRow(r) {
  return r.cost_row_kind === 'subtotal' || r.cost_row_kind === '小計';
}

  function applyDetailLinks(costLines, ctx) {
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

  function recalcAll(state) {
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


  const FC = {
    version_type: 'version_type',
    site_entry_date: 'site_entry_date',
    draft_date: 'draft_date',
    record_created_date: 'record_created_date',
    created_by: 'created_by',
    created_by_name: 'created_by_name',
    person_in_charge: 'person_in_charge',
    person_in_charge_name: 'person_in_charge_name',
    project_code: 'project_code',
    project_official_name: 'project_official_name',
    project_name: 'project_name',
    girder_type: 'girder_type',
    order_branch: 'order_branch',
    department: 'department',
    client_name: 'client_name',
    safety_rule_88: 'safety_rule_88',
    start_date: 'start_date',
    end_date: 'end_date',
    status: 'status',
    note: 'note',
    contract_total_1: 'contract_total_1',
    mat_total_2: 'mat_total_2',
    mat_total_3: 'mat_total_3',
    sub_repair_order_amount: 'sub_repair_order_amount',
    sub_scaffold_order_amount: 'sub_scaffold_order_amount',
    sub_paint_order_amount: 'sub_paint_order_amount',
    sub_labor_total: 'sub_labor_total',
    cost_total_8: 'cost_total_8',
    profit_9: 'profit_9',
    profit_rate: 'profit_rate',
    spec_lines: 'spec_lines',
    cost_lines: 'cost_lines',
    mat_lines: 'mat_lines',
    subcontract_lines: 'subcontract_lines',
    created_datetime: 'Created_datetime',
    updated_datetime: 'Updated_datetime',
  };

  const KIND_TO_CALC = { 明細: 'detail', 小計: 'subtotal', 見出し: 'group_header', 連携: 'link' };
  const KIND_FROM_CALC = { detail: '明細', subtotal: '小計', group_header: '見出し', link: '連携' };
  const ROW_KIND_OPTS = ['明細', '小計', '見出し', '連携'];
  const ROW_KIND_LABEL = { 連携: '詳細表と連携' };
  function rowKindDisplay(k) { return ROW_KIND_LABEL[k] || k; }
  const SPEC_UNITS = ['㎡', '式', '回', '人', '日', '－'];
  const SUB_CALC = new Set(['overhead', 'block_total', 'legal_welfare', 'order_amount', 'labor_total']);
  const SUB_BLOCKS = [
    { id: 'repair', label: '【修繕工事】…④', vendor: '' },
    { id: 'scaffold', label: '【足場工事】…⑤', vendor: '' },
    { id: 'paint', label: '【塗装工事】…⑥', vendor: '清正塗装' },
    { id: 'labor', label: '【労務費】…⑦', vendor: '直轄施工班' },
  ];
  /** 番号 ↔ 総括表/詳細表アンカー（Excel の …② 等） */
  const REF_DETAIL_IDS = {
    '②': 'jy-sec-mat-2',
    '③': 'jy-sec-mat-3',
    '④': 'jy-sec-block-repair',
    '⑤': 'jy-sec-block-scaffold',
    '⑥': 'jy-sec-block-paint',
    '⑦': 'jy-sec-block-labor',
  };
  const REF_SUMMARY_IDS = {
    '①': 'jy-sum-ref-1',
    '②': 'jy-sum-ref-2',
    '③': 'jy-sum-ref-3',
    '④': 'jy-sum-ref-4',
    '⑤': 'jy-sum-ref-5',
    '⑥': 'jy-sum-ref-6',
    '⑦': 'jy-sum-ref-7',
    '⑧': 'jy-sum-ref-8',
    '⑨': 'jy-sum-ref-9',
  };
  const REF_TARGETS = REF_DETAIL_IDS;
  const BLOCK_MARKERS = { repair: '④', scaffold: '⑤', paint: '⑥', labor: '⑦' };
  /** 総括表の工種名 → コード表 M の work_type_name（正本: scripts/data/jikkou-yosan-work-type-aliases.json / R24） */
  // WORK_TYPE_ALIASES_START
  const WORK_TYPE_TO_MASTER = {
  "修繕工事": "（塗）修繕等工事",
  "塗装附帯工事": "（塗）塗装付帯工事"
};
  // WORK_TYPE_ALIASES_END
  const MASTER_TO_WORK_TYPE = (function () {
    const m = {};
    Object.keys(WORK_TYPE_TO_MASTER).forEach(function (app) {
      m[WORK_TYPE_TO_MASTER[app]] = app;
    });
    return m;
  })();
  const SUB_LINES = {
    repair: ['塗装工事一式', '労務費（昼）', '労務費（夜）', '事前打合せ費等', '仮設・工具費等', '運送費', '宿泊費', '交通費', 'その他', '諸経費', '各種保険料(任意保険）', '合計', '法定福利費', '注文金額'],
    scaffold: ['足場工事一式', '労務費（昼）', '労務費（夜）', '事前打合せ費等', '仮設・工具費等', '運送費', '宿泊費', '交通費', 'その他', '諸経費', '各種保険料（任意保険）', '合計', '法定福利費', '注文金額'],
    paint: ['塗装及び足場工事一式', '労務費（昼）', '労務費（夜）', '事前打合せ費等', '仮設・工具費等', '運送費', '足場資材リース費', '交通費', 'その他', '諸経費', '各種保険料', '合計', '法定福利費', '注文金額'],
    labor: ['労務費', '労務費（昼）', '労務費（夜）', 'その他', '交通費', '宿泊費', '合計'],
  };
  const SUB_DETAIL_EXTRA = {
    labor: ['労務費（昼）', '労務費（夜）', 'その他', '交通費', '宿泊費', '事前打合せ費等', '仮設・工具費等'],
  };

  let masterCache = null;
  let state = emptyState();
  let activeTab = 'summary';
  let dirty = false;
  let readOnly = false;
  let uiScreen = 'list';
  let headerOpen = true;
  let headerLegendOpen = false;
  let headerSpecHelpOpen = false;
  let headerCostHelpOpen = false;
  let headerDetailHelpOpen = false;
  let listRows = [];
  let listRowsAll = [];
  let listSearchQuery = '';
  let listSortKey = 'updated_at';
  let listSortDir = 'desc';
  let pendingScrollTargetId = null;
  let pendingRowHighlight = null;
  let personInChargeManual = false;

  const PERSON_NAME_PLACEHOLDER = '例: 浜田　太郎';
  const PERSON_NAME_FORMAT_RE = /^[^\s　]+　[^\s　]+$/;
  const FONT_KEY = 'jikkou-yosan-font-size';

  function normalizePersonName(name) {
    const s = String(name || '').trim();
    if (!s) return '';
    const m = s.match(/^([^\s　]+)[\s　]+([^\s　]+)$/);
    if (m) return m[1] + '　' + m[2];
    return s;
  }

  function isValidPersonNameFormat(name) {
    return PERSON_NAME_FORMAT_RE.test(String(name || '').trim());
  }

  function fontKey() {
    const v = localStorage.getItem(FONT_KEY);
    if (v === 'xlarge') return 'xlarge';
    if (v === 'large') return 'large';
    return 'standard';
  }

  function fontPx() {
    const k = fontKey();
    if (k === 'xlarge') return '23px';
    if (k === 'large') return '18px';
    return '16px';
  }

  function fontBtnClass(key) {
    return 'jy-font-btn' + (fontKey() === key ? ' active' : '');
  }

  function renderFontToggle() {
    return (
      '<div class="jy-font-toggle">' +
      '<span class="jy-font-label">文字サイズ：</span>' +
      '<button type="button" class="' + fontBtnClass('standard') + '" data-jy-font="standard">標準</button>' +
      '<button type="button" class="' + fontBtnClass('large') + '" data-jy-font="large">大</button>' +
      '<button type="button" class="' + fontBtnClass('xlarge') + '" data-jy-font="xlarge">特大</button>' +
      '</div>'
    );
  }

  function bindFontToggle(root) {
    root.querySelectorAll('[data-jy-font]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        localStorage.setItem(FONT_KEY, btn.getAttribute('data-jy-font'));
        render();
      });
    });
  }

  function validatePersonNameField(label, name) {
    const normalized = normalizePersonName(name);
    if (!isValidPersonNameFormat(normalized)) {
      alert(label + 'は「苗字　名前」（苗字と名前の間は全角スペース）で入力してください。');
      return false;
    }
    return true;
  }

  function personNameInputAttrs(readOnlyMode) {
    const cls = readOnlyMode ? 'jy-hf-readonly' : 'jy-hf-text';
    return ' class="' + cls + '" placeholder="' + esc(PERSON_NAME_PLACEHOLDER) + '" title="苗字と名前の間は全角スペース（　）"' + (readOnlyMode ? ' disabled' : '');
  }

  function hfTag(kind) {
    const tags = {
      input: ['jy-hf-tag-input', '入力'],
      select: ['jy-hf-tag-select', '選択'],
      date: ['jy-hf-tag-date', '日付'],
      auto: ['jy-hf-tag-auto', '自動'],
    };
    const t = tags[kind] || tags.input;
    return '<span class="jy-hf-tag ' + t[0] + '">' + t[1] + '</span>';
  }

  function hfLabel(kind, text) {
    return '<label>' + hfTag(kind) + esc(text) + '</label>';
  }

  function hfDisabled(readOnlyMode) {
    return readOnly ? ' disabled' : '';
  }

  const LIST_SORTABLE_KEYS = ['project_name', 'draft_date', 'created_at', 'updated_at', 'status'];
  const LIST_DATE_SORT_KEYS = ['draft_date', 'created_at', 'updated_at'];

  function emptyState() {
    return {
      recordId: null,
      revision: null,
      version_type: '当初',
      site_entry_date: '',
      draft_date: '',
      record_created_date: '',
      created_by: '',
      created_by_name: '',
      person_in_charge: '',
      person_in_charge_name: '',
      project_code: '',
      project_official_name: '',
      project_name: '',
      girder_type: '',
      order_branch: '',
      department: '',
      client_name: '',
      safety_rule_88: '有',
      start_date: '',
      end_date: '',
      status: '下書き',
      note: '',
      contract_total_1: 0,
      mat_total_2: 0,
      mat_total_3: 0,
      sub_repair_order_amount: 0,
      sub_scaffold_order_amount: 0,
      sub_paint_order_amount: 0,
      sub_labor_total: 0,
      cost_total_8: 0,
      profit_9: 0,
      profit_rate: 0,
      spec_lines: [],
      cost_lines: [],
      mat_lines: [],
      subcontract_lines: [],
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function gv(rec, code) {
    return rec[code] && rec[code].value != null ? rec[code].value : '';
  }

  function fmt(n) {
    if (n == null || Number.isNaN(n)) return '';
    return toHalfWidthAscii(Number(n).toLocaleString('ja-JP'));
  }

  function toHalfWidthAscii(s) {
    if (s == null || s === '') return '';
    return String(s).replace(/[０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    }).replace(/[－ー−―]/g, '-').replace(/　/g, ' ');
  }

  /** 工事名称等 — 西暦＋年 → 半角＋年度（例: ２０２６年 → 2026年度） */
  function normalizeFiscalYearText(s) {
    if (s == null || s === '') return '';
    const t = toHalfWidthAscii(s);
    return t.replace(/(\d{4})年(?!度)/g, '$1年度');
  }

  function disp(s) {
    return esc(normalizeFiscalYearText(s));
  }

  function fmtTaxRate(rate) {
    if (rate === '' || rate == null) return '';
    const n = Number(rate);
    if (!Number.isFinite(n)) return toHalfWidthAscii(rate);
    if (n === 0) return '0%';
    const pct = n * 100;
    const txt = pct % 1 === 0 ? String(pct) : pct.toFixed(1).replace(/\.0$/, '');
    return toHalfWidthAscii(txt + '%');
  }

  function taxRateSelOpts(val, empty) {
    const rates = (masterCache && masterCache.taxRates) || ['0', '0.08', '0.1'];
    const sel = val === '' || val == null ? '' : String(val);
    let h = empty ? '<option value=""></option>' : '';
    rates.forEach(function (x) {
      const v = String(x);
      h += '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(fmtTaxRate(v)) + '</option>';
    });
    return h;
  }

  function normalizeUnitPriceVal(v) {
    return String(v == null ? '' : v).replace(/,/g, '').trim();
  }

  function formatUnitPrice(v) {
    const s = normalizeUnitPriceVal(v);
    if (!s) return '';
    const n = Number(s);
    if (!Number.isFinite(n)) return String(v == null ? '' : v);
    return toHalfWidthAscii(n.toLocaleString('ja-JP', { maximumFractionDigits: 10 }));
  }

  function parseNumInput(v) {
    return num(normalizeUnitPriceVal(v));
  }

  function unitPriceInput(dataAttr, index, value, readOnly) {
    return '<input class="jy-in jy-num jy-unit-price" ' + dataAttr + '="' + index + '" type="text" inputmode="decimal" value="' + esc(formatUnitPrice(value)) + '"' + (readOnly ? ' disabled' : '') + '>';
  }

  function bindUnitPriceInputs(root) {
    if (readOnly) return;
    root.querySelectorAll('.jy-unit-price').forEach(function (el) {
      el.addEventListener('focus', function () {
        el.value = normalizeUnitPriceVal(el.value);
      });
      el.addEventListener('blur', function () {
        el.value = formatUnitPrice(el.value);
        syncInputs();
        markDirty();
      });
    });
  }

  function fmtPct(n) {
    if (n == null || Number.isNaN(n)) return '';
    return toHalfWidthAscii((Number(n) * 100).toFixed(2) + '%');
  }

  /** kintone CREATED_TIME / UPDATED_TIME → JST YYYY-MM-DD（App 736 は英語コード Created_datetime） */
  function kintoneDatetimeToJstYmd(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  function jstTodayYmd() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  function readUserField(rec, code) {
    const f = rec[code];
    if (!f || !Array.isArray(f.value) || !f.value.length) return { code: '', name: '' };
    return { code: f.value[0].code || '', name: f.value[0].name || f.value[0].code || '' };
  }

  function userSelectBody(code) {
    return code ? { value: [{ code: String(code) }] } : { value: [] };
  }

  function ensureSaveMetadata(s) {
    if (!s.record_created_date) s.record_created_date = jstTodayYmd();
    const login = kintone.getLoginUser();
    if (!String(s.created_by_name || '').trim()) {
      s.created_by_name = normalizePersonName(login.name || login.code || '');
    } else {
      s.created_by_name = normalizePersonName(s.created_by_name);
    }
    if (!String(s.person_in_charge_name || '').trim()) {
      s.person_in_charge_name = s.created_by_name || normalizePersonName(login.name || login.code || '');
    } else {
      s.person_in_charge_name = normalizePersonName(s.person_in_charge_name);
    }
  }

  function syncPersonInChargeFromCreator(updateDom) {
    if (personInChargeManual) return;
    state.person_in_charge_name = state.created_by_name;
    if (updateDom) {
      const personInput = document.getElementById('jy-person-in-charge-name');
      if (personInput) personInput.value = state.person_in_charge_name;
    }
  }

  function compareListRows(a, b) {
    const key = listSortKey;
    const dir = listSortDir === 'asc' ? 1 : -1;
    let va = a[key];
    let vb = b[key];
    if (LIST_DATE_SORT_KEYS.indexOf(key) >= 0) {
      va = String(va || '');
      vb = String(vb || '');
      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;
      return va.localeCompare(vb) * dir;
    }
    va = String(va || '');
    vb = String(vb || '');
    return va.localeCompare(vb, 'ja') * dir;
  }

  function applyListSort() {
    if (!listSortKey || !listRows.length) return;
    listRows.sort(compareListRows);
  }

  function normalizeListSearch(q) {
    return String(q || '').trim().toLowerCase();
  }

  function rowMatchesListSearch(row, q) {
    if (!q) return true;
    const hay = [
      row.project_name,
      row.project_code,
      row.version_type,
      row.status,
      row.draft_date,
      row.created_at,
      row.updated_at,
    ].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function applyListFilter() {
    const q = normalizeListSearch(listSearchQuery);
    listRows = listRowsAll.filter(function (r) { return rowMatchesListSearch(r, q); });
    applyListSort();
  }

  function listCountLabel() {
    const total = listRowsAll.length;
    const shown = listRows.length;
    if (!total) return '0 件';
    if (!normalizeListSearch(listSearchQuery)) return '全 ' + total + ' 件';
    return '表示 ' + shown + ' / 全 ' + total + ' 件';
  }

  function listSortTh(key, label) {
    let mark = '';
    if (listSortKey === key) mark = listSortDir === 'asc' ? ' ▲' : ' ▼';
    const cls = 'jy-sort-th' + (listSortKey === key ? ' jy-sort-active' : '');
    return '<th class="' + cls + '" data-sort-key="' + esc(key) + '" title="クリックで並べ替え">' + esc(label) + mark + '</th>';
  }

  function refLinkMarker(marker, destTab) {
    const targetId = destTab === 'summary' ? REF_SUMMARY_IDS[marker] : REF_DETAIL_IDS[marker];
    if (!targetId) return esc(marker);
    const tabName = destTab === 'summary' ? '総括表' : '詳細表';
    return '<button type="button" class="jy-ref-link" data-jy-target="' + esc(targetId) + '" data-jy-tab="' + destTab + '" title="' + tabName + 'の' + esc(marker) + 'へ">' + esc(marker) + '</button>';
  }

  function refAmountLink(marker, destTab, amount) {
    const targetId = destTab === 'summary' ? REF_SUMMARY_IDS[marker] : REF_DETAIL_IDS[marker];
    if (!targetId) return fmt(amount);
    const tabName = destTab === 'summary' ? '総括表' : '詳細表';
    return '<button type="button" class="jy-ref-link jy-ref-amount" data-jy-target="' + esc(targetId) + '" data-jy-tab="' + destTab + '" title="' + tabName + 'の' + esc(marker) + 'へ（金額）">' + fmt(amount) + '</button>';
  }

  function subtotalBasisNote(r) {
    if (typeof costGroupSubtotalNote === 'function' && r.cost_group_key) {
      return costGroupSubtotalNote(r.cost_group_key);
    }
    const note = String(r.cost_basis_note || '').trim();
    if (note && note !== '計') return note;
    return '合計';
  }

  function refLinkToDetail(marker) {
    return refLinkMarker(marker, 'detail');
  }

  function refLinkToSummary(marker) {
    return refLinkMarker(marker, 'summary');
  }

  function refLink(marker) {
    return refLinkToDetail(marker);
  }

  function noteWithRefs(note, destTab) {
    const tab = destTab || 'detail';
    const s = String(note || '');
    let html = '';
    const re = /…([②③④⑤⑥⑦①⑧⑨])/g;
    let last = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      html += esc(s.slice(last, m.index + 1));
      html += refLinkMarker(m[1], tab);
      last = m.index + m[0].length;
    }
    html += esc(s.slice(last));
    return html;
  }

  function jumpToSection(targetId, destTab) {
    if (!targetId || !/^jy-(sec|sum)-/.test(targetId)) return;
    syncInputs();
    pendingScrollTargetId = targetId;
    activeTab = destTab === 'summary' ? 'summary' : 'detail';
    render();
  }

  function jumpToDetailSection(refOrTargetId) {
    if (REF_DETAIL_IDS[refOrTargetId]) {
      jumpToSection(REF_DETAIL_IDS[refOrTargetId], 'detail');
      return;
    }
    if (REF_SUMMARY_IDS[refOrTargetId]) {
      jumpToSection(REF_SUMMARY_IDS[refOrTargetId], 'summary');
      return;
    }
    if (/^jy-sec-/.test(refOrTargetId)) jumpToSection(refOrTargetId, 'detail');
    else if (/^jy-sum-/.test(refOrTargetId)) jumpToSection(refOrTargetId, 'summary');
  }

  function getJyScrollOffset() {
    const root = document.getElementById('jy-root');
    if (!root) return 112;
    let o = 8;
    const sticky = root.querySelector('.jy-sticky-top');
    if (sticky) o += sticky.offsetHeight + 8;
    else root.querySelectorAll('.jy-bar').forEach(function (bar) { o += bar.offsetHeight + 6; });
    const tabs = root.querySelector('.jy-tabs');
    if (tabs) o += tabs.offsetHeight + 6;
    const hint = root.querySelector('.jy-tab-hint');
    if (hint) o += hint.offsetHeight + 4;
    const header = root.querySelector('.jy-header-panel[open]');
    if (header) o += Math.min(header.offsetHeight, 72);
    return o + 56;
  }

  function scrollToJyElement(el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset - getJyScrollOffset();
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  function applyPendingScroll() {
    if (!pendingScrollTargetId) return;
    const targetId = pendingScrollTargetId;
    pendingScrollTargetId = null;
    function tryScroll(attempt) {
      const root = document.getElementById('jy-root');
      const el = root ? root.querySelector('#' + CSS.escape(targetId)) : document.getElementById(targetId);
      if (!el) {
        if (attempt < 12) window.setTimeout(function () { tryScroll(attempt + 1); }, 60);
        return;
      }
      const block = el.closest('details.jy-block');
      if (block && !block.open) block.open = true;
      const highlightEl = el.classList.contains('jy-sec-anchor') && el.nextElementSibling
        ? el.nextElementSibling
        : el;
      if (el.classList.contains('jy-sum-anchor-row')) {
        const next = el.nextElementSibling;
        if (next) next.classList.add('jy-ref-highlight');
        window.setTimeout(function () { if (next) next.classList.remove('jy-ref-highlight'); }, 2200);
      } else if (el.tagName === 'TR') {
        el.classList.add('jy-ref-highlight');
        window.setTimeout(function () { el.classList.remove('jy-ref-highlight'); }, 2200);
      } else {
        highlightEl.classList.add('jy-ref-highlight');
        window.setTimeout(function () { highlightEl.classList.remove('jy-ref-highlight'); }, 2200);
      }
      scrollToJyElement(el);
    }
    tryScroll(0);
  }

  function markInsertedRow(kind, index) {
    pendingRowHighlight = { kind: kind, index: Number(index) };
  }

  function findInsertedRowEl(root, h) {
    const i = h.index;
    let el;
    if (h.kind === 'spec') {
      el = root.querySelector('[data-spec-name="' + i + '"]');
    } else if (h.kind === 'cost') {
      el = root.querySelector('[data-cost-wcd="' + i + '"]') ||
        root.querySelector('[data-cost-kind="' + i + '"]') ||
        root.querySelector('[data-cost-add-after="' + i + '"]');
    } else if (h.kind === 'mat') {
      el = root.querySelector('[data-mat-vendor="' + i + '"]');
    } else if (h.kind === 'sub') {
      el = root.querySelector('[data-sub-vendor="' + i + '"]') ||
        root.querySelector('[data-sub-type="' + i + '"]') ||
        root.querySelector('[data-sub-unit="' + i + '"]');
    }
    return el ? el.closest('tr') : null;
  }

  function applyPendingRowHighlight() {
    if (!pendingRowHighlight) return;
    const h = pendingRowHighlight;
    pendingRowHighlight = null;
    function tryHighlight(attempt) {
      const root = document.getElementById('jy-root');
      if (!root) return;
      const row = findInsertedRowEl(root, h);
      if (!row) {
        if (attempt < 12) window.setTimeout(function () { tryHighlight(attempt + 1); }, 60);
        return;
      }
      const block = row.closest('details.jy-block');
      if (block && !block.open) block.open = true;
      row.classList.add('jy-ref-highlight');
      scrollToJyElement(row);
      window.setTimeout(function () { row.classList.remove('jy-ref-highlight'); }, 2200);
    }
    tryHighlight(0);
  }

  function markDirty() {
    if (readOnly) return;
    dirty = true;
    const el = document.getElementById('jy-dirty');
    if (el) el.textContent = '● 未保存の変更があります';
  }

  function injectCss() {
    if (document.getElementById('jy-css')) return;
    const st = document.createElement('style');
    st.id = 'jy-css';
    st.textContent =
      '.gaia-argoui-app-index-recordlist,.recordlist-gaia,.recordlist-norecord-gaia,.contents-gaia .recordlist-header-gaia{display:none!important}' +
      '.record-edit-gaia .field-gaia,.record-detail-gaia .field-gaia,.gaia-argoui-app-toolbar-buttons{display:none!important}' +
      '.jy-root{font-family:Segoe UI,Meiryo,sans-serif;max-width:100%;padding:12px 16px 24px}' +
      '.jy-title{font-size:18px;font-weight:700;letter-spacing:.15em;margin:0 0 8px}' +
      '.jy-subtitle{font-size:12px;color:#64748b;margin-bottom:12px}' +
      '.jy-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}' +
      '.jy-sticky-top{position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #e2e8f0;padding:8px 0 10px;margin-bottom:12px;box-shadow:0 2px 8px rgba(15,23,42,.06)}' +
      '.jy-sticky-top .jy-bar{margin-bottom:0}' +
      '.jy-sticky-top .jy-dirty{margin-bottom:8px}' +
      '.jy-action-bar{justify-content:space-between;gap:12px}' +
      '.jy-action-group{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
      '.jy-action-bar-right{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}' +
      '.jy-font-toggle{display:flex;align-items:center;gap:4px;flex-wrap:wrap}' +
      '.jy-font-label{font-size:12px;color:#475569;white-space:nowrap;margin-right:2px}' +
      '.jy-font-btn{padding:5px 10px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;background:#fff;font-size:12px;font-weight:600;line-height:1.2;font-family:inherit}' +
      '.jy-font-btn.active{background:#dbeafe;border-color:#2563eb;color:#1d4ed8}' +
      '.jy-font-btn:hover{background:#f1f5f9}' +
      '.jy-btn{padding:8px 16px;border:1px solid #94a3b8;border-radius:6px;background:#f8fafc;cursor:pointer;font-size:13px;font-weight:600}' +
      '.jy-btn-primary{background:#2563eb;color:#fff;border-color:#2563eb}' +
      '.jy-btn-print{padding:12px 28px;font-size:15px;font-weight:700;letter-spacing:.1em;background:#0f766e;color:#fff;border:2px solid #0d9488;border-radius:8px;box-shadow:0 2px 4px rgba(15,118,110,.28);min-width:7em}' +
      '.jy-btn-print:hover{background:#0d9488;border-color:#14b8a6}' +
      '.jy-btn-print:active{background:#115e59;box-shadow:0 1px 2px rgba(15,118,110,.2)}' +
      '.jy-pane-head .jy-btn-print{flex-shrink:0}' +
      '.jy-btn:disabled{opacity:.5;cursor:not-allowed}' +
      '.jy-dirty{padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;font-size:13px;margin-bottom:8px}' +
      '.jy-header-panel{border:1px solid #94a3b8;border-radius:8px;margin-bottom:12px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border-top:3px solid #64748b;overflow:hidden}' +
      '.jy-header-summary{display:flex;align-items:center;justify-content:center;cursor:pointer;padding:14px 48px 14px 16px;list-style:none;position:relative}' +
      '.jy-header-summary::-webkit-details-marker{display:none}' +
      '.jy-header-summary::after{content:"▸";position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:14px;color:#64748b;line-height:1}' +
      '.jy-header-panel[open] .jy-header-summary::after{content:"▾"}' +
      '.jy-header-title-banner{width:100%;max-width:960px;box-sizing:border-box;padding:16px 56px;border-radius:10px;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 55%,#cbd5e1 100%);border:1px solid #94a3b8;box-shadow:0 3px 8px rgba(71,85,105,.16);text-align:center}' +
      '.jy-header-title-text{font-size:24px;font-weight:800;letter-spacing:.32em;color:#334155;line-height:1.35}' +
      '.jy-header-body{padding:0 14px 14px;border-top:1px solid #e2e8f0}' +
      '.jy-help-banner{margin:0 0 10px;border:1px solid #93c5fd;border-radius:6px;background:#eff6ff;overflow:hidden}' +
      '.jy-help-banner summary{display:flex;align-items:center;gap:8px;cursor:pointer;padding:9px 12px;font-size:12px;font-weight:600;color:#1e3a8a;background:linear-gradient(180deg,#eff6ff 0%,#dbeafe 100%);list-style:none;user-select:none}' +
      '.jy-help-banner summary::-webkit-details-marker{display:none}' +
      '.jy-help-banner summary::before{content:"";display:block;width:4px;height:16px;border-radius:2px;background:#2563eb;flex-shrink:0}' +
      '.jy-help-banner summary::after{content:"▸";font-size:11px;color:#2563eb;margin-left:auto;flex-shrink:0;line-height:1}' +
      '.jy-help-banner[open] summary::after{content:"▾"}' +
      '.jy-help-banner-title{flex:1;line-height:1.4}' +
      '.jy-help-banner-body{padding:10px 12px 12px;background:#fff;border-top:1px solid #bfdbfe}' +
      '.jy-help-banner .jy-header-legend-list{margin:0;padding:0 0 0 1.15em;max-width:none}' +
      '.jy-help-banner-header{margin:10px 0 10px}' +
      '.jy-header-legend{font-size:11px;color:#64748b;padding:0;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}' +
      '.jy-header-legend-list{margin:0;padding:0 0 8px 1.2em;font-size:11px;color:#475569;line-height:1.55;max-width:52em}' +
      '.jy-header-legend-list li{margin:3px 0}' +
      '.jy-header-legend .jy-hf-tag{margin-right:0}' +
      '.jy-header-grid{display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:8px 12px;padding:0}' +
      '.jy-header-grid label{display:block;font-size:11px;color:#475569;margin-bottom:4px;line-height:1.35}' +
      '.jy-hf-tag{display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;margin-right:5px;vertical-align:middle;line-height:1.4}' +
      '.jy-hf-tag-input{background:#fff;border:1px solid #93c5fd;color:#1d4ed8}' +
      '.jy-hf-tag-select{background:#f1f5f9;border:1px solid #94a3b8;color:#475569}' +
      '.jy-hf-tag-date{background:#fffbeb;border:1px solid #fcd34d;color:#b45309}' +
      '.jy-hf-tag-auto{background:#f8fafc;border:1px solid #cbd5e1;color:#64748b}' +
      '.jy-header-grid input,.jy-header-grid select,.jy-header-grid textarea{width:100%;box-sizing:border-box;font-size:13px;padding:5px 8px;border-radius:4px}' +
      '.jy-header-grid input.jy-hf-text,.jy-header-grid textarea.jy-hf-text{background:#fff;border:1px solid #93c5fd;border-left:3px solid #2563eb}' +
      '.jy-header-grid input.jy-hf-text:focus,.jy-header-grid textarea.jy-hf-text:focus{border-color:#2563eb;outline:none;box-shadow:0 0 0 2px rgba(37,99,235,.15)}' +
      '.jy-header-grid select.jy-hf-select{background-color:#f1f5f9;border:1px solid #94a3b8;border-left:3px solid #64748b;cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:26px;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%2364748b%27 d=%27M2 4l4 4 4-4z%27/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center}' +
      '.jy-header-grid select.jy-hf-select:focus{border-color:#64748b;outline:none;box-shadow:0 0 0 2px rgba(100,116,139,.2);background-color:#e8eef4}' +
      '.jy-header-grid input.jy-hf-date{background:#fffbeb;border:1px solid #fcd34d;border-left:3px solid #f59e0b}' +
      '.jy-header-grid input.jy-hf-date:focus{border-color:#f59e0b;outline:none;box-shadow:0 0 0 2px rgba(245,158,11,.2)}' +
      '.jy-header-grid input.jy-hf-readonly{background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #cbd5e1;color:#64748b;cursor:default}' +
      '.jy-tabs{display:flex;gap:4px;margin:10px 0 8px;flex-wrap:wrap}' +
      '.jy-tab{padding:8px 18px;cursor:pointer;border:1px solid #94a3b8;border-radius:6px 6px 0 0;background:#f1f5f9;font-size:13px;font-weight:600}' +
      '.jy-tab[data-tab="summary"]:not(.active){background:#eff6ff;border-color:#93c5fd;color:#1e40af}' +
      '.jy-tab[data-tab="detail"]:not(.active){background:#ecfdf5;border-color:#86efac;color:#166534}' +
      '.jy-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}' +
      '.jy-tab[data-tab="detail"].active{background:#059669;border-color:#059669}' +
      '.jy-tab-hint{font-size:12px;color:#64748b;margin:4px 0 10px;border-radius:6px;padding:6px 10px;border:1px solid transparent}' +
      '.jy-tab-hint-summary{background:#eff6ff;border-color:#bfdbfe;color:#475569}' +
      '.jy-tab-hint-detail{background:#ecfdf5;border-color:#bbf7d0;color:#475569}' +
      '.jy-pane{border:1px solid #cbd5e1;border-top:none;border-radius:0 0 8px 8px;padding:12px;background:#fff}' +
      '.jy-pane-summary{background:linear-gradient(180deg,#f8fafc 0%,#eff6ff 100%);border-color:#93c5fd;border-top:3px solid #3b82f6}' +
      '.jy-pane-detail{background:linear-gradient(180deg,#f8fafc 0%,#ecfdf5 100%);border-color:#86efac;border-top:3px solid #22c55e}' +
      '.jy-pane-summary .jy-excel-wrap{border-color:#bfdbfe}' +
      '.jy-pane-detail .jy-excel-wrap,.jy-pane-detail .jy-linked-wrap{border-color:#bbf7d0}' +
      '.jy-pane-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,960px) minmax(0,1fr);align-items:center;gap:12px 20px;margin-bottom:14px;padding-bottom:6px}' +
      '.jy-sheet-title{grid-column:2;width:100%;max-width:960px;box-sizing:border-box;padding:18px 56px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:10px;line-height:1.3;text-align:center}' +
      '.jy-sheet-title-summary{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 55%,#bfdbfe 100%);border:1px solid #93c5fd;box-shadow:0 3px 8px rgba(37,99,235,.16)}' +
      '.jy-sheet-title-detail{background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 55%,#bbf7d0 100%);border:1px solid #86efac;box-shadow:0 3px 8px rgba(5,150,105,.16)}' +
      '.jy-sheet-title-doc{font-size:26px;font-weight:800;letter-spacing:.24em;color:#1e3a8a}' +
      '.jy-sheet-title-sheet{font-size:20px;font-weight:700;letter-spacing:.32em;padding:6px 28px;border-radius:8px;display:inline-block}' +
      '.jy-pane-head .jy-btn-print{grid-column:3;justify-self:end}' +
      '@media (max-width:900px){.jy-pane-head{grid-template-columns:1fr;justify-items:stretch}.jy-sheet-title{grid-column:1;padding:14px 20px}.jy-pane-head .jy-btn-print{grid-column:1;justify-self:center;margin-top:4px}.jy-header-title-banner{padding:14px 24px}.jy-header-title-text{font-size:20px;letter-spacing:.22em}.jy-sheet-title-doc{font-size:22px}.jy-sheet-title-sheet{font-size:17px;padding:5px 18px}}' +
      '.jy-sheet-title-summary .jy-sheet-title-sheet{background:#fff;color:#1d4ed8;border:1px solid #93c5fd}' +
      '.jy-sheet-title-detail .jy-sheet-title-doc{color:#14532d}' +
      '.jy-sheet-title-detail .jy-sheet-title-sheet{background:#fff;color:#047857;border:1px solid #86efac}' +
      '.jy-pane-head .jy-title,.jy-pane-head .jy-pane-title{margin:0;font-size:14px;font-weight:700;letter-spacing:.1em}' +
      '.jy-pane-title{font-size:14px;font-weight:700;margin:8px 0 6px;padding:4px 8px;background:#e8eef4;border-left:4px solid #2563eb}' +
      '.jy-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
      '.jy-section-head-title{flex:1;min-width:12em}' +
      '.jy-section-head-actions{display:flex;gap:6px;flex-shrink:0;align-items:center}' +
      '.jy-section-head-actions .jy-btn{margin:0}' +
      '.jy-btn-sm{padding:4px 10px;font-size:12px;line-height:1.2}' +
      '.jy-excel-wrap{overflow:auto;border:1px solid #e2e8f0;margin-bottom:12px;background:#fff;border-radius:6px}' +
      '.jy-table{border-collapse:collapse;width:100%;font-size:12px}' +
      '.jy-table th,.jy-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle}' +
      '.jy-table th{background:#f1f5f9;text-align:center;font-weight:600;white-space:nowrap;color:#475569}' +
      '.jy-summary-table-cost{table-layout:fixed;width:100%;min-width:1080px}' +
      '.jy-summary-table-spec{table-layout:fixed;width:100%;min-width:760px}' +
      '.jy-summary-table-spec .jy-col-spec{width:38%}' +
      '.jy-summary-table-spec .jy-col-unit{width:64px}' +
      '.jy-summary-table-spec .jy-col-qty{width:72px}' +
      '.jy-summary-table-spec .jy-col-price{width:80px}' +
      '.jy-summary-table-spec .jy-col-amt{width:88px}' +
      '.jy-summary-table-spec .jy-col-note{width:16%}' +
      '.jy-summary-table-spec .jy-col-del{width:32px}' +
      '.jy-summary-table-spec td{overflow:hidden}' +
      '.jy-summary-table-spec .jy-in{min-width:0}' +
      '.jy-table-mat{table-layout:fixed;width:100%;min-width:980px}' +
      '.jy-table-mat .jy-col-vendor{width:11%}' +
      '.jy-table-mat .jy-col-name{width:28%}' +
      '.jy-table-mat .jy-col-cap{width:9%}' +
      '.jy-table-mat .jy-col-maker{width:11%}' +
      '.jy-table-mat .jy-col-qty{width:72px}' +
      '.jy-table-mat .jy-col-price{width:80px}' +
      '.jy-table-mat .jy-col-grp{width:64px}' +
      '.jy-table-mat .jy-col-amt{width:88px}' +
      '.jy-table-mat .jy-col-basis{width:11%}' +
      '.jy-table-mat .jy-col-del{width:32px}' +
      '.jy-table-mat td{overflow:hidden}' +
      '.jy-table-mat .jy-in{min-width:0}' +
      '.jy-table-mat select.jy-in{font-size:11px;padding:1px 2px}' +
      '.jy-text-cell{text-overflow:ellipsis}' +
      '.jy-summary-table-cost .jy-col-wcd{width:68px}' +
      '.jy-summary-table-cost .jy-col-wt{width:12%}' +
      '.jy-summary-table-cost .jy-col-ccd{width:68px}' +
      '.jy-summary-table-cost .jy-col-cat{width:16%}' +
      '.jy-summary-table-cost .jy-col-kind{width:92px}' +
      '.jy-summary-table-cost .jy-col-tax{width:52px}' +
      '.jy-summary-table-cost .jy-col-unit{width:48px}' +
      '.jy-summary-table-cost .jy-col-qty{width:64px}' +
      '.jy-summary-table-cost .jy-col-price{width:80px}' +
      '.jy-summary-table-cost .jy-col-amt{width:88px}' +
      '.jy-summary-table-cost .jy-col-note{width:11%}' +
      '.jy-summary-table-cost .jy-col-ref{width:40px}' +
      '.jy-summary-table-cost .jy-col-ratio{width:48px}' +
      '.jy-summary-table-cost .jy-col-del{width:32px}' +
      '.jy-summary-table-cost td{overflow:hidden}' +
      '.jy-summary-table-cost .jy-in{min-width:0}' +
      '.jy-summary-table-cost input.jy-in:not([type=number]):not(.jy-code):not(.jy-text-cell){text-overflow:ellipsis}' +
      '.jy-summary-table-cost input.jy-code{text-overflow:clip;font-variant-numeric:tabular-nums;padding:2px 3px}' +
      '.jy-summary-table-cost select.jy-in{font-size:11px;padding:1px 2px}' +
      '.jy-table tfoot td{background:#f8fafc;font-weight:700;color:#334155;border-color:#e2e8f0}' +
      '.jy-summary-table tr.jy-cost-detail td{background:#fff}' +
      '.jy-summary-table tr.jy-cost-group-inner td{background:#fafbfc}' +
      '.jy-summary-table tr.jy-cost-standalone td{border-top:none;border-bottom:1px solid #f1f5f9;background:#fff}' +
      '.jy-summary-table tr.jy-cost-group-first td{border-top:1px solid #e2e8f0;border-bottom:none;background:#fafbfc}' +
      '.jy-summary-table tr.jy-cost-group-first td:first-child{box-shadow:inset 3px 0 0 #93c5fd}' +
      '.jy-summary-table tr.jy-cost-group-subtotal td,.jy-summary-table tr.jy-subtotal td{background:#f0f7ff;border-top:1px solid #bfdbfe;border-bottom:1px solid #93c5fd;padding-top:4px;padding-bottom:4px}' +
      '.jy-summary-table tr.jy-cost-group-subtotal td.jy-subtotal-col,.jy-summary-table tr.jy-subtotal td.jy-subtotal-col{background:#dbeafe;font-weight:700;font-size:13px;color:#1e3a8a;border-left:2px solid #60a5fa}' +
      '.jy-summary-table tr.jy-cost-group-subtotal td.jy-subtotal-note,.jy-summary-table tr.jy-subtotal td.jy-subtotal-note{text-align:center;font-weight:600;color:#2563eb;font-size:11px}' +
      '.jy-subtotal-label{text-align:right;padding-right:10px}' +
      '.jy-subtotal-badge{display:inline-block;background:#3b82f6;color:#fff;font-weight:600;padding:1px 10px;border-radius:3px;font-size:11px;letter-spacing:.08em}' +
      '.jy-summary-table tr.jy-link td{background:#ecfdf5}' +
      '.jy-summary-table tr.jy-link td:first-child{box-shadow:inset 3px 0 0 #22c55e}' +
      '.jy-summary-table tr.jy-link td.jy-link-wt{background:#d1fae5;font-weight:600;color:#166534}' +
      '.jy-summary-table tr.jy-link td.jy-link-wt .jy-in{background:#ecfdf5;border-color:#86efac;color:#166534;font-weight:600}' +
      '.jy-summary-table tr.jy-link td.jy-ref-cell{color:#15803d}' +
      '.jy-pane-title.jy-linked-title{background:#ecfdf5;border-left-color:#22c55e;color:#166534}' +
      '.jy-excel-wrap.jy-linked-wrap{border-color:#86efac;box-shadow:inset 3px 0 0 #22c55e}' +
      '.jy-block.jy-linked-block{border-color:#86efac;background:#fefffe}' +
      '.jy-block.jy-linked-block>summary{background:#ecfdf5;color:#166534;border-radius:4px}' +
      '.jy-block .jy-btn{margin-top:6px}' +
      '.jy-legend-linked{display:inline-block;margin-left:10px;padding:1px 8px;background:#ecfdf5;border:1px solid #86efac;border-radius:4px;color:#166534;font-size:11px;font-weight:600}' +
      '.jy-summary-table tr.jy-foot-sum td{background:#e8eef4;color:#1e293b;border-color:#cbd5e1;font-size:12px;padding:5px 8px}' +
      '.jy-summary-table tr.jy-foot-sum td.jy-num{font-size:13px;color:#0f172a}' +
      '.jy-num{text-align:right;font-variant-numeric:tabular-nums}' +
      '.jy-center{text-align:center}' +
      '.jy-table th.jy-center{text-align:center}' +
      '.jy-table td.jy-center input.jy-in,.jy-table td.jy-center select.jy-in{text-align:center;text-align-last:center}' +
      '.jy-code{width:100%;text-align:right;box-sizing:border-box}' +
      '.jy-in{width:100%;box-sizing:border-box;font-size:12px;padding:2px 4px;border:1px solid #e2e8f0;background:#fff}' +
      '.jy-in:focus{border-color:#2563eb;outline:none}' +
      '.jy-root select{background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;cursor:pointer;accent-color:#60a5fa}' +
      '.jy-root select:not(:disabled):hover{background-color:#e8eef4}' +
      '.jy-root select:focus{background-color:#eef4ff;border-color:#2563eb;outline:none}' +
      '.jy-root select:disabled{background-color:#f8fafc;color:#64748b;cursor:not-allowed;opacity:1}' +
      '.jy-root select option{background-color:#f8fafc;color:#0f172a;padding:6px 8px}' +
      '.jy-root select option:nth-child(even){background-color:#f1f5f9}' +
      '.jy-root select option:checked,.jy-root select option:focus{background-color:#dbeafe;color:#1e40af;font-weight:600}' +
      '.jy-ro{background:#f8fafc}' +
      '.jy-table tr.jy-cost-group-subtotal td.jy-ro,.jy-table tr.jy-subtotal td.jy-ro{background:transparent}' +
      '.jy-block{margin:8px 0;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;background:#fff}' +
      '.jy-block summary{cursor:pointer;font-weight:600;padding:4px}' +
      '.jy-block-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;list-style:none}' +
      '.jy-block-summary::-webkit-details-marker{display:none}' +
      '.jy-block-summary-label{flex:1;min-width:12em}' +
      '.jy-block-summary-actions{display:flex;gap:6px;flex-shrink:0;align-items:center}' +
      '.jy-block-summary-actions .jy-btn{margin-top:0}' +
      '.jy-calc-row{background:#f3f4f6;font-weight:600}' +
      '.jy-list-table tbody tr{cursor:pointer}' +
      '.jy-list-table tbody tr:hover{background:#eff6ff}' +
      '.jy-sort-th{cursor:pointer;user-select:none}' +
      '.jy-sort-th:hover{background:#e2e8f0}' +
      '.jy-sort-th.jy-sort-active{background:#dbeafe;color:#1e40af}' +
      '.jy-list-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px}' +
      '.jy-list-toolbar .jy-font-toggle{margin-left:auto}' +
      '.jy-search-label{font-size:12px;color:#475569;margin-right:6px}' +
      '.jy-list-search{min-width:280px;padding:6px 10px;font-size:13px;border:1px solid #cbd5e1;border-radius:6px}' +
      '.jy-list-search:focus{border-color:#2563eb;outline:none}' +
      '.jy-list-count{font-size:12px;color:#64748b;margin-left:4px}' +
      '.jy-list-code{color:#2563eb;font-weight:600;text-decoration:underline;text-underline-offset:2px}' +
      '.jy-ref-link{background:none;border:none;color:#2563eb;cursor:pointer;font-weight:700;text-decoration:underline;padding:0 3px;font-size:inherit;line-height:inherit}' +
      '.jy-ref-link:hover{color:#1d4ed8;background:#eff6ff;border-radius:3px}' +
      '.jy-ref-amount{display:block;width:100%;text-align:right;font-variant-numeric:tabular-nums;padding:0 2px}' +
      '.jy-link .jy-ref-amount{color:#15803d}' +
      '.jy-link .jy-ref-amount:hover{color:#166534;background:#dcfce7}' +
      '.jy-ref-cell{font-size:12px;line-height:1.4}' +
      '.jy-sec-anchor{scroll-margin-top:112px}' +
      '.jy-sum-anchor-row td{height:0;padding:0!important;border:none!important;line-height:0;font-size:0;vertical-align:top}' +
      '.jy-table tr.jy-ref-highlight td{background:#fef9c3!important;animation:jy-ref-flash 2.2s ease}' +
      '.jy-ref-meta{font-size:11px;font-weight:500;color:#64748b;margin-left:8px}' +
      '.jy-row-actions{display:flex;gap:3px;justify-content:center;white-space:nowrap}' +
      '.jy-row-actions .jy-btn{padding:2px 6px;font-size:11px;line-height:1.2;min-width:0}' +
      '.jy-ref-highlight{outline:2px solid #facc15;outline-offset:2px;border-radius:4px;animation:jy-ref-flash 2.2s ease}' +
      '@keyframes jy-ref-flash{0%,100%{background:transparent}25%{background:#fef9c3}}' +
      '.jy-meta{font-size:11px;color:#64748b}' +
      '@media(max-width:1279px){.jy-grid-2{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function loadMaster() {
    if (masterCache) return Promise.resolve(masterCache);
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: APP_MASTER,
      query: 'is_active in ("有効") order by sort_order asc limit 500',
    }).then(function (resp) {
      masterCache = {
        codeRows: [],
        parsedCodeRows: [],
        branches: [],
        departments: [],
        girderTypes: [],
        units: ['－', '㎡', '式', '回', '人', '日', '%'],
        taxRates: ['0', '0.08', '0.1'],
        workTypes: [],
        categories: [],
        workTypeCodes: [],
        categoryCodes: [],
        workTypeByName: {},
        categoryByName: {},
        workTypeByCode: {},
        categoryByCode: {},
      };
      (resp.records || []).forEach(function (rec) {
        const cat = gv(rec, 'list_category');
        if (cat === 'コード表行') {
          masterCache.codeRows.push(rec);
          const wn = String(gv(rec, 'work_type_name') || '').trim();
          const wc = String(gv(rec, 'work_type_code') || '').trim();
          const sn = String(gv(rec, 'sub_type_name') || '').trim();
          const sc = String(gv(rec, 'sub_type_code') || '').trim();
          masterCache.parsedCodeRows.push({
            work_type_code: wc,
            work_type_name: wn,
            sub_type_code: sc,
            sub_type_name: sn,
          });
          if (wn && masterCache.workTypeByName[wn] == null) {
            masterCache.workTypeByName[wn] = wc;
            if (masterCache.workTypes.indexOf(wn) < 0) masterCache.workTypes.push(wn);
          }
          if (wc && !masterCache.workTypeByCode[wc]) {
            masterCache.workTypeByCode[wc] = wn;
            if (masterCache.workTypeCodes.indexOf(wc) < 0) masterCache.workTypeCodes.push(wc);
          }
          const wtNorm = normalizeMasterWorkType(wn);
          if (wtNorm && masterCache.workTypeByName[wtNorm] == null && wc) {
            masterCache.workTypeByName[wtNorm] = wc;
            if (masterCache.workTypes.indexOf(wtNorm) < 0) masterCache.workTypes.push(wtNorm);
          }
          if (sn && masterCache.categories.indexOf(sn) < 0) masterCache.categories.push(sn);
          if (sn && sc && masterCache.categoryByName[sn] == null) {
            masterCache.categoryByName[sn] = sc;
          }
          if (sc && sn && !masterCache.categoryByCode[sc]) {
            masterCache.categoryByCode[sc] = sn;
            if (masterCache.categoryCodes.indexOf(sc) < 0) masterCache.categoryCodes.push(sc);
          }
        } else if (cat === '発注支社') masterCache.branches.push(gv(rec, 'item_name'));
        else if (cat === '部門') masterCache.departments.push(gv(rec, 'item_name'));
        else if (cat === '桁種別') masterCache.girderTypes.push(gv(rec, 'item_name'));
        else if (cat === '単位') {
          const u = gv(rec, 'item_name');
          if (u && masterCache.units.indexOf(u) < 0) masterCache.units.push(u);
        } else if (cat === '消費税') {
          const t = gv(rec, 'item_name');
          if (t && masterCache.taxRates.indexOf(String(t)) < 0) masterCache.taxRates.push(String(t));
        }
      });
      return masterCache;
    });
  }

  function normalizeMasterWorkType(name) {
    return String(name || '').trim().replace(/^（塗）/, '');
  }

  function masterWorkTypeMatches(appWt, masterWt) {
    const a = String(appWt || '').trim();
    const mFull = String(masterWt || '').trim();
    const m = normalizeMasterWorkType(masterWt);
    if (!a) return !m;
    if (WORK_TYPE_TO_MASTER[a] && mFull === WORK_TYPE_TO_MASTER[a]) return true;
    if (a === m || a === mFull) return true;
    if (m && (m.indexOf(a) === 0 || a.indexOf(m) === 0)) return true;
    return false;
  }

  function categoryNamesMatch(appCat, masterSub) {
    const a = String(appCat || '').trim();
    const m = String(masterSub || '').trim();
    if (!a || !m) return false;
    if (a === m) return true;
    if (a.indexOf(m) >= 0 || m.indexOf(a) >= 0) return true;
    const aCore = a.replace(/等（[^）]+）$/u, '').replace(/（[^）]+）$/u, '');
    const mCore = m.replace(/^外注/u, '');
    if (aCore && mCore && (aCore.indexOf(mCore) >= 0 || mCore.indexOf(aCore) >= 0)) return true;
    return false;
  }

  function workTypeDisplayName(masterFullName) {
    const full = String(masterFullName || '').trim();
    if (MASTER_TO_WORK_TYPE[full]) return MASTER_TO_WORK_TYPE[full];
    return normalizeMasterWorkType(full) || full;
  }

  function resolveWorkTypeFromCode(wcd, m) {
    if (!m || !wcd) return '';
    const code = String(wcd).trim();
    if (m.workTypeByCode[code]) return workTypeDisplayName(m.workTypeByCode[code]);
    let found = '';
    (m.parsedCodeRows || []).some(function (row) {
      if (row.work_type_code === code && row.work_type_name) {
        found = workTypeDisplayName(row.work_type_name);
        return true;
      }
      return false;
    });
    return found;
  }

  function resolveCategoryFromCode(ccd, wt, m) {
    if (!m || !ccd) return '';
    const code = String(ccd).trim();
    if (m.categoryByCode[code] && (!wt || !String(wt).trim())) return m.categoryByCode[code];
    let best = '';
    let bestScore = -1;
    (m.parsedCodeRows || []).forEach(function (row) {
      if (row.sub_type_code !== code || !row.sub_type_name) return;
      let score = 1;
      if (wt && masterWorkTypeMatches(wt, row.work_type_name)) score += 3;
      if (score > bestScore) {
        bestScore = score;
        best = row.sub_type_name;
      }
    });
    if (best) return best;
    return m.categoryByCode[code] || '';
  }

  function resolveCostLineCodes(wt, cat, m) {
    if (!m || !m.parsedCodeRows) return { wcd: '', ccd: '' };
    const appWt = String(wt || '').trim();
    const appCat = String(cat || '').trim();
    let wcd = '';
    let ccd = '';
    let bestCatCode = '';
    let bestCatScore = -1;

    m.parsedCodeRows.forEach(function (row) {
      const wtOk = masterWorkTypeMatches(appWt, row.work_type_name);
      if (appWt && wtOk && row.work_type_code) wcd = row.work_type_code;
      if (!appCat || !row.sub_type_code) return;
      if (!categoryNamesMatch(appCat, row.sub_type_name)) return;
      let score = appCat === row.sub_type_name ? 3 : 2;
      if (appWt && wtOk) score += 2;
      if (score > bestCatScore) {
        bestCatScore = score;
        bestCatCode = row.sub_type_code;
      }
    });

    if (bestCatCode) ccd = bestCatCode;
    if (!wcd && appWt) {
      if (m.workTypeByName[appWt]) wcd = m.workTypeByName[appWt];
      if (!wcd && WORK_TYPE_TO_MASTER[appWt] && m.workTypeByName[WORK_TYPE_TO_MASTER[appWt]]) {
        wcd = m.workTypeByName[WORK_TYPE_TO_MASTER[appWt]];
      }
    }
    if (!ccd && appCat && m.categoryByName[appCat]) ccd = m.categoryByName[appCat];
    return { wcd: wcd || '', ccd: ccd || '' };
  }

  function applyCostLineCodesFromMaster(s) {
    if (!masterCache) return;
    (s.cost_lines || []).forEach(function (r) {
      if (r.cost_row_kind === '小計' || r.cost_work_type === '計') return;
      if (!String(r.cost_work_type || '').trim() && String(r.cost_work_type_code || '').trim()) {
        const wtName = resolveWorkTypeFromCode(r.cost_work_type_code, masterCache);
        if (wtName) r.cost_work_type = wtName;
      }
      if (!String(r.cost_category || '').trim() && String(r.cost_category_code || '').trim()) {
        const catName = resolveCategoryFromCode(r.cost_category_code, r.cost_work_type, masterCache);
        if (catName) r.cost_category = catName;
      }
      const resolved = resolveCostLineCodes(r.cost_work_type, r.cost_category, masterCache);
      if (resolved.wcd && !String(r.cost_work_type_code || '').trim()) {
        r.cost_work_type_code = resolved.wcd;
      }
      if (resolved.ccd && !String(r.cost_category_code || '').trim()) {
        r.cost_category_code = resolved.ccd;
      }
    });
  }

  function syncCostLineFields(i, source) {
    const r = state.cost_lines[i];
    if (!r || !masterCache) return;
    if (source === 'wcd') {
      const wtName = resolveWorkTypeFromCode(r.cost_work_type_code, masterCache);
      if (wtName) r.cost_work_type = wtName;
    } else if (source === 'wt') {
      const resolved = resolveCostLineCodes(r.cost_work_type, r.cost_category, masterCache);
      if (resolved.wcd) r.cost_work_type_code = resolved.wcd;
    } else if (source === 'ccd') {
      const catName = resolveCategoryFromCode(r.cost_category_code, r.cost_work_type, masterCache);
      if (catName) r.cost_category = catName;
    } else if (source === 'cat') {
      const resolved = resolveCostLineCodes(r.cost_work_type, r.cost_category, masterCache);
      if (resolved.ccd) r.cost_category_code = resolved.ccd;
    }
    if (source === 'wt' || source === 'wcd') {
      const resolved = resolveCostLineCodes(r.cost_work_type, r.cost_category, masterCache);
      if (resolved.ccd && (source === 'wt' || !String(r.cost_category_code || '').trim())) {
        r.cost_category_code = resolved.ccd;
      }
    }
  }

  function normCostField(s) {
    return String(s || '').trim();
  }

  function costLinePrevComparableIndex(lines, i) {
    if (i <= 0) return -1;
    const prev = lines[i - 1];
    if (!prev || prev.cost_row_kind === '小計' || prev.cost_work_type === '計') return -1;
    return i - 1;
  }

  function costFieldIsCollapsed(lines, i, kind) {
    const r = lines[i];
    if (!r || r.cost_row_kind === '小計' || r.cost_work_type === '計') return false;
    const j = costLinePrevComparableIndex(lines, i);
    if (j < 0) return false;
    const prev = lines[j];
    if (kind === 'wcd') {
      const v = normCostField(r.cost_work_type_code);
      return v && v === normCostField(prev.cost_work_type_code);
    }
    if (kind === 'wt') {
      const v = normCostField(r.cost_work_type);
      return v && v === normCostField(prev.cost_work_type);
    }
    if (kind === 'ccd') {
      const v = normCostField(r.cost_category_code);
      return v
        && normCostField(r.cost_work_type_code) === normCostField(prev.cost_work_type_code)
        && v === normCostField(prev.cost_category_code);
    }
    if (kind === 'cat') {
      const v = normCostField(r.cost_category);
      return v
        && normCostField(r.cost_work_type) === normCostField(prev.cost_work_type)
        && v === normCostField(prev.cost_category);
    }
    return false;
  }

  function costCollapsedDisplay(lines, i, kind, field) {
    const r = lines[i];
    if (!r) return '';
    const actual = r[field] || '';
    if (!normCostField(actual)) return '';
    return costFieldIsCollapsed(lines, i, kind) ? '' : actual;
  }

  function costPrintDisplay(lines, i, kind, field) {
    const r = lines[i];
    if (!r) return '';
    const actual = r[field] || '';
    if (!normCostField(actual)) return '';
    return costFieldIsCollapsed(lines, i, kind) ? '〃' : actual;
  }

  function costRepeatCollapsedAttr(lines, i, kind) {
    return costFieldIsCollapsed(lines, i, kind) ? ' data-jy-repeat-collapsed="1"' : '';
  }

  function syncCostLineFieldFromInput(el, attr, field) {
    const i = Number(el.getAttribute(attr));
    const r = state.cost_lines[i];
    if (!r) return;
    if (el.dataset.jyRepeatCollapsed === '1' && el.value === '') return;
    r[field] = el.value;
  }

  function refreshCostLineFieldInputs(i) {
    const wtEl = document.querySelector('[data-cost-wt="' + i + '"]');
    const wcdEl = document.querySelector('[data-cost-wcd="' + i + '"]');
    const catEl = document.querySelector('[data-cost-cat="' + i + '"]');
    const ccdEl = document.querySelector('[data-cost-ccd="' + i + '"]');
    const r = state.cost_lines[i];
    const lines = state.cost_lines;
    if (!r) return;
    if (wtEl && wtEl !== document.activeElement) {
      wtEl.value = costCollapsedDisplay(lines, i, 'wt', 'cost_work_type');
      wtEl.dataset.jyRepeatCollapsed = costFieldIsCollapsed(lines, i, 'wt') ? '1' : '';
    }
    if (wcdEl && wcdEl !== document.activeElement) {
      wcdEl.value = costCollapsedDisplay(lines, i, 'wcd', 'cost_work_type_code');
      wcdEl.dataset.jyRepeatCollapsed = costFieldIsCollapsed(lines, i, 'wcd') ? '1' : '';
    }
    if (catEl && catEl !== document.activeElement) {
      catEl.value = costCollapsedDisplay(lines, i, 'cat', 'cost_category');
      catEl.dataset.jyRepeatCollapsed = costFieldIsCollapsed(lines, i, 'cat') ? '1' : '';
    }
    if (ccdEl && ccdEl !== document.activeElement) {
      ccdEl.value = costCollapsedDisplay(lines, i, 'ccd', 'cost_category_code');
      ccdEl.dataset.jyRepeatCollapsed = costFieldIsCollapsed(lines, i, 'ccd') ? '1' : '';
    }
  }

  function refreshAllCostLineFieldInputs() {
    (state.cost_lines || []).forEach(function (_r, i) {
      refreshCostLineFieldInputs(i);
    });
  }

  function bindCostLineCollapseDisplay(root) {
    const specs = [
      { attr: 'data-cost-wcd', field: 'cost_work_type_code', kind: 'wcd' },
      { attr: 'data-cost-wt', field: 'cost_work_type', kind: 'wt' },
      { attr: 'data-cost-ccd', field: 'cost_category_code', kind: 'ccd' },
      { attr: 'data-cost-cat', field: 'cost_category', kind: 'cat' },
    ];
    specs.forEach(function (spec) {
      root.querySelectorAll('[' + spec.attr + ']').forEach(function (el) {
        if (el.disabled) return;
        el.addEventListener('focus', function () {
          const i = Number(el.getAttribute(spec.attr));
          const r = state.cost_lines[i];
          if (!r) return;
          el.value = r[spec.field] || '';
          el.dataset.jyRepeatCollapsed = '';
        });
        el.addEventListener('blur', function () {
          const i = Number(el.getAttribute(spec.attr));
          syncCostLineFieldFromInput(el, spec.attr, spec.field);
          syncCostLineFields(i, spec.kind === 'wcd' ? 'wcd' : spec.kind === 'wt' ? 'wt' : spec.kind === 'ccd' ? 'ccd' : 'cat');
          const lines = state.cost_lines;
          el.value = costCollapsedDisplay(lines, i, spec.kind, spec.field);
          el.dataset.jyRepeatCollapsed = costFieldIsCollapsed(lines, i, spec.kind) ? '1' : '';
          refreshAllCostLineFieldInputs();
        });
      });
    });
  }

  function bindCostLineFieldSync(root, attr, source) {
    root.querySelectorAll('[' + attr + ']').forEach(function (el) {
      el.addEventListener('change', function () {
        const i = Number(el.getAttribute(attr));
        syncInputs();
        syncCostLineFields(i, source);
        markDirty();
        refreshAllCostLineFieldInputs();
      });
    });
  }

  function blankCostRow(tmpl) {
    return {
      cost_work_type_code: tmpl.cost_work_type_code || '',
      cost_work_type: tmpl.cost_work_type || '',
      cost_category_code: tmpl.cost_category_code || '',
      cost_category: tmpl.cost_category || '',
      cost_row_kind: tmpl.cost_row_kind === 'link' ? '連携' : tmpl.cost_row_kind === 'subtotal' ? '小計' : tmpl.cost_row_kind === 'group_header' ? '見出し' : '明細',
      cost_group_key: tmpl.cost_group_key || '',
      cost_tax_rate: tmpl.cost_tax_rate != null ? tmpl.cost_tax_rate : '',
      cost_unit: tmpl.cost_unit || '',
      cost_qty: '',
      cost_unit_price: '',
      cost_amount: 0,
      cost_basis_note: tmpl.cost_basis_note || '',
      detail_marker: tmpl.detail_marker || '',
      subtotal_display_amount: 0,
      cost_ratio: 0,
    };
  }

  /** 旧テンプレ「（昼・夜）」1行 → 昼・夜2行（金額は昼行に残す） */
  function migrateDayNightCombinedCostLines(lines) {
    const out = [];
    (lines || []).forEach(function (r) {
      const cat = String(r.cost_category || '');
      if (cat === '重機誘導員（昼・夜）') {
        out.push(Object.assign({}, r, { cost_category: '重機誘導員（昼）' }));
        out.push(blankCostRow(Object.assign({}, r, {
          cost_category: '重機誘導員（夜）',
          cost_basis_note: '',
          detail_marker: '',
        })));
        return;
      }
      if (cat === '検電接地等（昼・夜）') {
        out.push(Object.assign({}, r, { cost_category: '検電接地等（昼）' }));
        out.push(blankCostRow(Object.assign({}, r, {
          cost_category: '検電接地等（夜）',
          cost_basis_note: '',
          detail_marker: '',
        })));
        return;
      }
      out.push(r);
    });
    return out;
  }

  function defaultCostRows() {
    return (DEFAULT_COST_TEMPLATE || []).map(blankCostRow);
  }

  function subKindFromLabel(t, block) {
    if (t === '諸経費') return 'overhead';
    if (t === '合計') return block === 'labor' ? 'labor_total' : 'block_total';
    if (t === '法定福利費') return 'legal_welfare';
    if (t.indexOf('注文金額') >= 0 || t === '注　文　金　額') return 'order_amount';
    return 'detail';
  }

  function defaultSubcontractTemplate() {
    const rows = [];
    SUB_BLOCKS.forEach(function (b) {
      rows.push({
        subcontract_block: b.id,
        sub_row_kind: 'vendor',
        sub_vendor: b.vendor,
        sub_line_type: '',
        sub_unit: '',
        sub_qty: '',
        sub_unit_price: '',
        sub_amount: 0,
        sub_basis: '',
      });
      (SUB_LINES[b.id] || []).forEach(function (t) {
        const kind = subKindFromLabel(t, b.id);
        rows.push({
          subcontract_block: b.id,
          sub_row_kind: kind,
          sub_vendor: '',
          sub_line_type: t,
          sub_unit: t === '諸経費' ? '%' : '',
          sub_qty: t === '諸経費' ? '0.1' : '',
          sub_unit_price: '',
          sub_amount: 0,
          sub_basis: t === '諸経費' ? '上記金額合計の10%' : '',
        });
      });
    });
    return rows;
  }

  function defaultSpecLines() {
    const rows = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push({ spec_name: '', spec_unit: '', spec_qty: '', spec_unit_price: '', spec_amount: 0, spec_note: '' });
    }
    return rows;
  }

  function newDraftState() {
    personInChargeManual = false;
    const s = emptyState();
    const login = kintone.getLoginUser();
    s.version_type = '当初';
    s.draft_date = jstTodayYmd();
    s.created_by_name = normalizePersonName(login.name || login.code || '');
    s.person_in_charge_name = s.created_by_name;
    s.spec_lines = defaultSpecLines();
    s.cost_lines = defaultCostRows();
    s.mat_lines = [{ mat_vendor: '', mat_name: '', mat_capacity: '', mat_maker: '', mat_qty: '', mat_unit_price: '', mat_amount: 0, mat_group: '塗料', mat_basis: '' }];
    s.subcontract_lines = defaultSubcontractTemplate();
    return recalcState(s);
  }

  function readSub(rec, tbl, mapFn) {
    return ((rec[tbl] && rec[tbl].value) || []).map(function (row) {
      return mapFn(row.value || {});
    });
  }

  function stateFromKintone(rec) {
    const s = emptyState();
    s.recordId = rec.$id ? String(rec.$id.value) : null;
    s.revision = rec.$revision ? String(rec.$revision.value) : null;
    s.version_type = String(gv(rec, FC.version_type) || '当初');
    s.site_entry_date = String(gv(rec, FC.site_entry_date)).slice(0, 10);
    s.draft_date = String(gv(rec, FC.draft_date)).slice(0, 10);
    s.record_created_date = String(gv(rec, FC.record_created_date)).slice(0, 10);
    if (!s.record_created_date) {
      s.record_created_date = kintoneDatetimeToJstYmd(gv(rec, FC.created_datetime));
    }
    s.created_by_name = normalizePersonName(gv(rec, FC.created_by_name));
    if (!s.created_by_name) {
      const createdBy = readUserField(rec, FC.created_by);
      s.created_by_name = normalizePersonName(createdBy.name || createdBy.code || '');
    }
    if (!s.created_by_name && rec.Creator && rec.Creator.value) {
      s.created_by_name = normalizePersonName(rec.Creator.value.name || rec.Creator.value.code || '');
    }
    s.person_in_charge_name = normalizePersonName(gv(rec, FC.person_in_charge_name));
    if (!s.person_in_charge_name) {
      const personInCharge = readUserField(rec, FC.person_in_charge);
      s.person_in_charge_name = normalizePersonName(personInCharge.name || personInCharge.code || '');
    }
    s.project_code = String(gv(rec, FC.project_code));
    s.project_official_name = normalizeFiscalYearText(String(gv(rec, FC.project_official_name)));
    s.project_name = String(gv(rec, FC.project_name));
    s.girder_type = String(gv(rec, FC.girder_type));
    s.order_branch = String(gv(rec, FC.order_branch));
    s.department = String(gv(rec, FC.department));
    s.client_name = String(gv(rec, FC.client_name));
    s.safety_rule_88 = String(gv(rec, FC.safety_rule_88) || '有');
    s.start_date = String(gv(rec, FC.start_date)).slice(0, 10);
    s.end_date = String(gv(rec, FC.end_date)).slice(0, 10);
    s.status = String(gv(rec, FC.status) || '下書き');
    s.note = String(gv(rec, FC.note));
    s.spec_lines = readSub(rec, FC.spec_lines, function (v) {
      return { spec_name: gv(v, 'spec_name'), spec_unit: gv(v, 'spec_unit'), spec_qty: gv(v, 'spec_qty'), spec_unit_price: gv(v, 'spec_unit_price'), spec_amount: num(gv(v, 'spec_amount')), spec_note: gv(v, 'spec_note') };
    });
    s.cost_lines = readSub(rec, FC.cost_lines, function (v) {
      const mk = gv(v, 'cost_row_kind') || '明細';
      return {
        cost_work_type_code: gv(v, 'cost_work_type_code'),
        cost_work_type: gv(v, 'cost_work_type'),
        cost_category_code: gv(v, 'cost_category_code'),
        cost_category: gv(v, 'cost_category'),
        cost_row_kind: mk,
        cost_group_key: gv(v, 'cost_group_key'),
        cost_tax_rate: num(gv(v, 'cost_tax_rate')),
        cost_unit: gv(v, 'cost_unit'),
        cost_qty: gv(v, 'cost_qty'),
        cost_unit_price: gv(v, 'cost_unit_price'),
        cost_amount: num(gv(v, 'cost_amount')),
        cost_basis_note: gv(v, 'cost_basis_note'),
        detail_marker: gv(v, 'detail_marker') === 'なし' ? '' : gv(v, 'detail_marker'),
        cost_ratio: num(gv(v, 'cost_ratio')),
      };
    });
    s.mat_lines = readSub(rec, FC.mat_lines, function (v) {
      return { mat_vendor: gv(v, 'mat_vendor'), mat_name: gv(v, 'mat_name'), mat_capacity: gv(v, 'mat_capacity'), mat_maker: gv(v, 'mat_maker'), mat_qty: gv(v, 'mat_qty'), mat_unit_price: gv(v, 'mat_unit_price'), mat_amount: num(gv(v, 'mat_amount')), mat_group: gv(v, 'mat_group') || '塗料', mat_basis: gv(v, 'mat_basis') };
    });
    s.subcontract_lines = readSub(rec, FC.subcontract_lines, function (v) {
      return { subcontract_block: gv(v, 'subcontract_block'), sub_row_kind: gv(v, 'sub_row_kind'), sub_vendor: gv(v, 'sub_vendor'), sub_line_type: gv(v, 'sub_line_type'), sub_unit: gv(v, 'sub_unit'), sub_qty: gv(v, 'sub_qty'), sub_unit_price: gv(v, 'sub_unit_price'), sub_amount: num(gv(v, 'sub_amount')), sub_basis: gv(v, 'sub_basis') };
    });
    if (!s.spec_lines.length) s.spec_lines = defaultSpecLines();
    if (!s.cost_lines.length) s.cost_lines = defaultCostRows();
    else s.cost_lines = migrateDayNightCombinedCostLines(s.cost_lines);
    if (!s.mat_lines.length) s.mat_lines = [{ mat_vendor: '', mat_name: '', mat_capacity: '', mat_maker: '', mat_qty: '', mat_unit_price: '', mat_amount: 0, mat_group: '塗料', mat_basis: '' }];
    if (!s.subcontract_lines.length) s.subcontract_lines = defaultSubcontractTemplate();
    personInChargeManual = String(s.person_in_charge_name) !== String(s.created_by_name);
    return recalcState(s);
  }

  function costLineFromCalcRow(r) {
    return {
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

  function recalcState(s) {
    applyCostLineCodesFromMaster(s);
    const calc = JSON.parse(JSON.stringify(s));
    calc.cost_lines.forEach(function (r) {
      r.cost_row_kind = KIND_TO_CALC[r.cost_row_kind] || r.cost_row_kind;
    });
    recalcAll(calc);
    s.cost_lines = calc.cost_lines.map(costLineFromCalcRow);
    s.spec_lines = calc.spec_lines;
    s.mat_lines = calc.mat_lines;
    s.subcontract_lines = calc.subcontract_lines;
    s.contract_total_1 = calc.contract_total_1;
    s.mat_total_2 = calc.mat_total_2;
    s.mat_total_3 = calc.mat_total_3;
    s.sub_repair_order_amount = calc.sub_repair_order_amount;
    s.sub_scaffold_order_amount = calc.sub_scaffold_order_amount;
    s.sub_paint_order_amount = calc.sub_paint_order_amount;
    s.sub_labor_total = calc.sub_labor_total;
    s.cost_total_8 = calc.cost_total_8;
    s.profit_9 = calc.profit_9;
    s.profit_rate = calc.profit_rate;
    return s;
  }

  function stateToKintone(s) {
    recalcState(s);
    const body = {};
    body[FC.version_type] = { value: s.version_type };
    body[FC.site_entry_date] = { value: s.site_entry_date || null };
    body[FC.draft_date] = { value: s.draft_date || null };
    body[FC.record_created_date] = { value: s.record_created_date || null };
    body[FC.created_by_name] = { value: s.created_by_name || '' };
    body[FC.person_in_charge_name] = { value: s.person_in_charge_name || '' };
    body[FC.project_code] = { value: s.project_code };
    body[FC.project_official_name] = { value: s.project_official_name };
    body[FC.project_name] = { value: s.project_name };
    body[FC.girder_type] = { value: s.girder_type };
    body[FC.order_branch] = { value: s.order_branch };
    body[FC.department] = { value: s.department };
    body[FC.client_name] = { value: s.client_name };
    body[FC.safety_rule_88] = { value: s.safety_rule_88 };
    body[FC.start_date] = { value: s.start_date || null };
    body[FC.end_date] = { value: s.end_date || null };
    body[FC.status] = { value: s.status };
    body[FC.note] = { value: s.note };
    body[FC.contract_total_1] = { value: String(s.contract_total_1) };
    body[FC.mat_total_2] = { value: String(s.mat_total_2) };
    body[FC.mat_total_3] = { value: String(s.mat_total_3) };
    body[FC.sub_repair_order_amount] = { value: String(s.sub_repair_order_amount) };
    body[FC.sub_scaffold_order_amount] = { value: String(s.sub_scaffold_order_amount) };
    body[FC.sub_paint_order_amount] = { value: String(s.sub_paint_order_amount) };
    body[FC.sub_labor_total] = { value: String(s.sub_labor_total) };
    body[FC.cost_total_8] = { value: String(s.cost_total_8) };
    body[FC.profit_9] = { value: String(s.profit_9) };
    body[FC.profit_rate] = { value: String(s.profit_rate) };
    body[FC.spec_lines] = {
      value: s.spec_lines.map(function (r) {
        return { value: { spec_name: { value: r.spec_name }, spec_unit: { value: r.spec_unit }, spec_qty: { value: String(r.spec_qty || '') }, spec_unit_price: { value: String(r.spec_unit_price || '') }, spec_amount: { value: String(r.spec_amount || 0) }, spec_note: { value: r.spec_note } } };
      }),
    };
    body[FC.cost_lines] = {
      value: s.cost_lines.map(function (r) {
        return {
          value: {
            cost_work_type_code: { value: r.cost_work_type_code },
            cost_work_type: { value: r.cost_work_type },
            cost_category_code: { value: r.cost_category_code },
            cost_category: { value: r.cost_category },
            cost_row_kind: { value: r.cost_row_kind },
            cost_group_key: { value: r.cost_group_key },
            cost_tax_rate: { value: String(r.cost_tax_rate || '') },
            cost_unit: { value: r.cost_unit },
            cost_qty: { value: String(r.cost_qty || '') },
            cost_unit_price: { value: String(r.cost_unit_price || '') },
            cost_amount: { value: String(r.cost_amount || 0) },
            cost_basis_note: { value: r.cost_basis_note },
            detail_marker: { value: r.detail_marker || 'なし' },
            cost_ratio: { value: String(r.cost_ratio || 0) },
          },
        };
      }),
    };
    body[FC.mat_lines] = {
      value: s.mat_lines.map(function (r) {
        return { value: { mat_vendor: { value: r.mat_vendor }, mat_name: { value: r.mat_name }, mat_capacity: { value: String(r.mat_capacity || '') }, mat_maker: { value: r.mat_maker }, mat_qty: { value: String(r.mat_qty || '') }, mat_unit_price: { value: String(r.mat_unit_price || '') }, mat_amount: { value: String(r.mat_amount || 0) }, mat_group: { value: r.mat_group }, mat_basis: { value: r.mat_basis } } };
      }),
    };
    body[FC.subcontract_lines] = {
      value: s.subcontract_lines.map(function (r) {
        return { value: { subcontract_block: { value: r.subcontract_block }, sub_row_kind: { value: r.sub_row_kind }, sub_vendor: { value: r.sub_vendor }, sub_line_type: { value: r.sub_line_type }, sub_unit: { value: r.sub_unit }, sub_qty: { value: String(r.sub_qty || '') }, sub_unit_price: { value: String(r.sub_unit_price || '') }, sub_amount: { value: String(r.sub_amount || 0) }, sub_basis: { value: r.sub_basis } } };
      }),
    };
    return body;
  }

  function selOpts(items, val, empty) {
    let h = empty ? '<option value=""></option>' : '';
    (items || []).forEach(function (x) {
      h += '<option value="' + esc(x) + '"' + (String(x) === String(val) ? ' selected' : '') + '>' + esc(x) + '</option>';
    });
    return h;
  }

  function datalist(id, items) {
    return '<datalist id="' + id + '">' + (items || []).map(function (x) {
      return '<option value="' + esc(x) + '"></option>';
    }).join('') + '</datalist>';
  }

  function renderSectionHelpBanner(id, openFlag, title, listItems) {
    const items = listItems.map(function (item) { return '<li>' + item + '</li>'; }).join('');
    return (
      '<details class="jy-help-banner"' + (openFlag ? ' open' : '') + ' id="' + id + '">' +
      '<summary><span class="jy-help-banner-title">' + esc(title) + '</span></summary>' +
      '<div class="jy-help-banner-body"><ul class="jy-header-legend-list">' + items + '</ul></div>' +
      '</details>'
    );
  }

  function renderSpecHelpPanel() {
    return renderSectionHelpBanner('jy-spec-help-panel', headerSpecHelpOpen, '仕様明細（①）の入力について（クリックで開閉）', [
      '契約・見積の<strong>仕様明細 …①</strong>です。仕様・単位・数量・単価を行ごとに入力します。',
      '金額は<strong>数量×単価</strong>で自動計算されます。表下の合計が<strong>契約合計 …①</strong>になります。',
      '行の追加は、見出しの「末尾に追加」または各行の<strong>＋</strong>で行います。追加した行は薄い黄色で強調表示されます。',
      '原価行（②〜⑧）との関係は、下の<strong>原価行</strong>の見方、または<strong>詳細表</strong>タブの見方を参照してください。'
    ]);
  }

  function renderCostHelpPanel() {
    return renderSectionHelpBanner('jy-cost-help-panel', headerCostHelpOpen, '原価行の入力について（クリックで開閉）', [
      '総括表の<strong>原価行（②〜⑧）</strong>です。システム入力工種・種別・数量・単価などを入力します。',
      '<strong>同じシステム入力工種が2行以上続く</strong>と、その直後に<strong>「計」行が自動表示</strong>されます（1行だけの工種には出ません）。',
      '「計」行の金額は<strong>明細・連携行（②〜⑦の緑行含む）の合算</strong>で自動更新されます。手入力・削除はできません。',
      '工種・種別が空白に見える行は、直上行と同じ値の<strong>繰り上げ表示</strong>です（保存データは各行に保持されています）。',
      '行の追加は、見出しの「末尾に追加」または各行の<strong>＋</strong>で行います。追加した行は薄い黄色で強調表示されます。',
      '番号（…②など）や連携行の金額をクリックすると、総括表と詳細表の該当ブロックへ移動します。詳細表の内容は<strong>詳細表</strong>タブの見方を参照してください。'
    ]);
  }

  function renderDetailHelpPanel() {
    return renderSectionHelpBanner('jy-detail-help-panel', headerDetailHelpOpen, '詳細表について（クリックで開閉）', [
      '<strong>材料明細（②塗料・③その他）</strong>と<strong>外注明細（④〜⑦）</strong>を入力します。総括表の連携行（緑）と対応しています。',
      'ブロック見出しが<strong>緑</strong>のものは総括表と連携しています。番号（…②など）や<strong>合計金額</strong>をクリックすると、総括表の該当行へ移動します。',
      '<strong>材料</strong>：見出しの「末尾に追加」または各行の<strong>＋</strong>で行を追加します（区分は塗料／その他）。',
      '<strong>外注（④〜⑦）</strong>：各ブロック見出しの「末尾に明細追加」、または会社名行・明細行の<strong>＋</strong>で諸経費・合計の前に明細を挿入します。種別はリストから選ぶか入力できます。',
      '諸経費・合計・法定福利費・注文金額などの<strong>計算行は自動</strong>です（金額の手入力・行削除はできません）。',
      '行の追加時は、追加した行が<strong>薄い黄色</strong>で強調表示されます。'
    ]);
  }

  function renderHeader() {
    const m = masterCache || { branches: [], departments: [], girderTypes: [] };
    const createdDateTitle = state.record_created_date ? '' : ' title="初回保存時に設定されます"';
    const ro = hfDisabled(readOnly);
    return (
      '<details class="jy-header-panel"' + (headerOpen ? ' open' : '') + ' id="jy-header-panel">' +
      '<summary class="jy-header-summary">' +
      '<div class="jy-header-title-banner"><span class="jy-header-title-text">工　事　基　本　情　報</span></div>' +
      '</summary>' +
      '<div class="jy-header-body">' +
      '<details class="jy-help-banner jy-help-banner-header"' + (headerLegendOpen ? ' open' : '') + ' id="jy-header-legend-panel">' +
      '<summary><span class="jy-help-banner-title">入力の見方（クリックで開閉）</span></summary>' +
      '<div class="jy-help-banner-body">' +
      '<div class="jy-header-legend">' +
      hfTag('input') + '手入力（白・青枠）' +
      hfTag('select') + 'リスト選択（灰）' +
      hfTag('date') + '日付（薄黄）' +
      hfTag('auto') + '自動・参照のみ' +
      '</div></div></details>' +
      '<div class="jy-header-grid">' +
      '<div>' + hfLabel('select', '版種別') + '<select class="jy-hf-select" id="jy-version"' + ro + '><option' + (state.version_type === '当初' ? ' selected' : '') + '>当初</option></select></div>' +
      '<div>' + hfLabel('date', '現場入場予定日') + '<input class="jy-hf-date" id="jy-site-entry" type="date" value="' + esc(state.site_entry_date) + '"' + ro + '></div>' +
      '<div>' + hfLabel('date', '立案日') + '<input class="jy-hf-date" id="jy-draft-date" type="date" value="' + esc(state.draft_date) + '"' + ro + '></div>' +
      '<div>' + hfLabel('auto', '作成日') + '<input class="jy-hf-readonly" id="jy-record-created-date" type="date" value="' + esc(state.record_created_date) + '" disabled readonly' + createdDateTitle + '></div>' +
      '<div>' + hfLabel('input', '作成者') + '<input id="jy-created-by-name" value="' + esc(state.created_by_name) + '"' + personNameInputAttrs(readOnly) + '></div>' +
      '<div>' + hfLabel('input', '担当者') + '<input id="jy-person-in-charge-name" value="' + esc(state.person_in_charge_name) + '"' + personNameInputAttrs(readOnly) + '></div>' +
      '<div>' + hfLabel('select', 'ステータス') + '<select class="jy-hf-select" id="jy-status"' + ro + '><option' + (state.status === '下書き' ? ' selected' : '') + '>下書き</option><option' + (state.status === '初版確定' ? ' selected' : '') + '>初版確定</option></select></div>' +
      '<div>' + hfLabel('input', '工事コード *') + '<input class="jy-hf-text" id="jy-project-code" value="' + esc(state.project_code) + '"' + ro + '></div>' +
      '<div>' + hfLabel('input', '工事正式名称') + '<input class="jy-hf-text" id="jy-project-official" value="' + esc(normalizeFiscalYearText(state.project_official_name)) + '"' + ro + '></div>' +
      '<div>' + hfLabel('input', '工事名称') + '<input class="jy-hf-text" id="jy-project-name" value="' + esc(state.project_name) + '"' + ro + '></div>' +
      '<div>' + hfLabel('select', '桁種別') + '<select class="jy-hf-select" id="jy-girder"' + ro + '>' + selOpts(m.girderTypes, state.girder_type, true) + '</select></div>' +
      '<div>' + hfLabel('select', '発注支社') + '<select class="jy-hf-select" id="jy-branch"' + ro + '>' + selOpts(m.branches, state.order_branch, true) + '</select></div>' +
      '<div>' + hfLabel('select', '部門') + '<select class="jy-hf-select" id="jy-dept"' + ro + '>' + selOpts(m.departments, state.department, true) + '</select></div>' +
      '<div>' + hfLabel('input', '発注者') + '<input class="jy-hf-text" id="jy-client" value="' + esc(state.client_name) + '"' + ro + '></div>' +
      '<div>' + hfLabel('select', '安衛則88条') + '<select class="jy-hf-select" id="jy-safety"' + ro + '><option' + (state.safety_rule_88 === '有' ? ' selected' : '') + '>有</option><option' + (state.safety_rule_88 === '無' ? ' selected' : '') + '>無</option></select></div>' +
      '<div>' + hfLabel('date', '着手日') + '<input class="jy-hf-date" id="jy-start" type="date" value="' + esc(state.start_date) + '"' + ro + '></div>' +
      '<div>' + hfLabel('date', '竣工日') + '<input class="jy-hf-date" id="jy-end" type="date" value="' + esc(state.end_date) + '"' + ro + '></div>' +
      '<div style="grid-column:span 2">' + hfLabel('input', '備考') + '<textarea class="jy-hf-text" id="jy-note" rows="2"' + ro + '>' + esc(state.note) + '</textarea></div>' +
      '</div></div></details>'
    );
  }

  function renderSummary() {
    recalcState(state);
    const m = masterCache || { units: SPEC_UNITS };
    let html = detailSectionHead(
      '仕様明細（①）',
      readOnly ? '' : specSectionAddBtn()
    );
    html += renderSpecHelpPanel();
    html += '<div class="jy-excel-wrap jy-summary-wrap"><table class="jy-table jy-summary-table jy-summary-table-spec"><colgroup>' +
      '<col class="jy-col-spec"><col class="jy-col-unit"><col class="jy-col-qty"><col class="jy-col-price"><col class="jy-col-amt"><col class="jy-col-note">' +
      (readOnly ? '' : '<col class="jy-col-del">') +
      '</colgroup><thead><tr><th>仕様</th><th class="jy-center">単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>備考</th>' + (readOnly ? '' : '<th>操作</th>') + '</tr></thead><tbody>';
    state.spec_lines.forEach(function (r, i) {
      html += '<tr><td><input class="jy-in jy-text-cell" data-spec-name="' + i + '" value="' + esc(r.spec_name) + '"' + (r.spec_name ? ' title="' + esc(r.spec_name) + '"' : '') + (readOnly ? ' disabled' : '') + '></td>';
      html += '<td class="jy-center"><select class="jy-in" data-spec-unit="' + i + '"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.units.concat(SPEC_UNITS).filter(function (v, idx, a) { return a.indexOf(v) === idx; }), r.spec_unit, true) + '</select></td>';
      html += '<td><input class="jy-in jy-num" data-spec-qty="' + i + '" type="number" step="any" value="' + esc(r.spec_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      html += '<td>' + unitPriceInput('data-spec-price', i, r.spec_unit_price, readOnly) + '</td>';
      html += '<td class="jy-num jy-ro">' + fmt(r.spec_amount) + '</td>';
      html += '<td><input class="jy-in jy-text-cell" data-spec-note="' + i + '" value="' + esc(r.spec_note) + '"' + (r.spec_note ? ' title="' + esc(r.spec_note) + '"' : '') + (readOnly ? ' disabled' : '') + '></td>';
      if (!readOnly) {
        html += '<td class="jy-row-actions">';
        html += '<button type="button" class="jy-btn" data-spec-add-after="' + i + '" title="この行の下に追加">＋</button>';
        html += '<button type="button" class="jy-btn" data-spec-del="' + i + '" title="この行を削除">×</button>';
        html += '</td>';
      }
      html += '</tr>';
    });
    html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="jy-sum-ref-1"><td colspan="' + (readOnly ? 6 : 7) + '"></td></tr>';
    html += '</tbody><tfoot><tr class="jy-foot-sum"><td colspan="4" class="jy-num">合計 …①</td><td class="jy-num">' + fmt(state.contract_total_1) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';

    html += detailSectionHead(
      '原価行（②〜⑧）',
      readOnly ? '' : costSectionAddBtn()
    );
    html += renderCostHelpPanel();
    html += '<div class="jy-excel-wrap jy-summary-wrap"><table class="jy-table jy-summary-table jy-summary-table-cost"><colgroup>' +
      '<col class="jy-col-wcd"><col class="jy-col-wt"><col class="jy-col-ccd"><col class="jy-col-cat"><col class="jy-col-kind">' +
      '<col class="jy-col-tax"><col class="jy-col-unit"><col class="jy-col-qty"><col class="jy-col-price"><col class="jy-col-amt">' +
      '<col class="jy-col-note"><col class="jy-col-ref"><col class="jy-col-ratio">' +
      (readOnly ? '' : '<col class="jy-col-del">') +
      '</colgroup><thead><tr>' +
      '<th>工種CD</th><th>システム入力工種</th><th>種別CD</th><th>種別</th><th>行種別</th><th class="jy-center">消費税</th><th class="jy-center">単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>計算基準・備考</th><th>詳細</th><th class="jy-num">率</th>' +
      (readOnly ? '' : '<th>操作</th>') + '</tr></thead><tbody>';
    const costColSpan = readOnly ? 13 : 14;
    state.cost_lines.forEach(function (r, i) {
      const isLink = r.cost_row_kind === '連携';
      const isSub = r.cost_row_kind === '小計';
      const borderCls = typeof costBorderCssClass === 'function'
        ? costBorderCssClass(r.excel_border_role || (isSub ? 'group_subtotal' : 'standalone'))
        : (isSub ? 'jy-cost-group-subtotal' : 'jy-cost-standalone');
      const cls = [isLink ? 'jy-link' : '', isSub ? 'jy-subtotal' : 'jy-cost-detail', borderCls].filter(Boolean).join(' ');
      const ro = readOnly || isLink || isSub;
      const sumId = isLink && r.detail_marker && REF_SUMMARY_IDS[r.detail_marker] ? REF_SUMMARY_IDS[r.detail_marker] : '';
      const wtDisplay = isSub ? '' : (r.cost_work_type === '計' ? '' : costCollapsedDisplay(state.cost_lines, i, 'wt', 'cost_work_type'));
      const wcdDisplay = costCollapsedDisplay(state.cost_lines, i, 'wcd', 'cost_work_type_code');
      const catDisplay = costCollapsedDisplay(state.cost_lines, i, 'cat', 'cost_category');
      const ccdDisplay = costCollapsedDisplay(state.cost_lines, i, 'ccd', 'cost_category_code');
      const subAmt = isSub ? (r.subtotal_display_amount != null ? r.subtotal_display_amount : r.cost_amount) : r.cost_amount;
      if (sumId) html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="' + sumId + '"><td colspan="' + costColSpan + '"></td></tr>';
      html += '<tr class="' + cls + '">';
      if (isSub) {
        html += '<td colspan="9" class="jy-ro jy-subtotal-label"><span class="jy-subtotal-badge">計</span></td>';
        html += '<td class="jy-num jy-ro jy-subtotal-col">' + fmt(subAmt) + '</td>';
        html += '<td class="jy-ro jy-subtotal-note">' + esc(subtotalBasisNote(r)) + '</td>';
        html += '<td class="jy-ro"></td><td class="jy-num jy-ro">' + fmtPct(r.cost_ratio) + '</td>';
        if (!readOnly) {
          html += '<td class="jy-row-actions">';
          html += '<button type="button" class="jy-btn" data-cost-add-after="' + i + '" title="この行の下に追加">＋</button>';
          html += '</td>';
        }
      } else {
      html += '<td><input class="jy-in jy-code" list="jy-wt-code-list" data-cost-wcd="' + i + '" value="' + esc(wcdDisplay) + '"' + costRepeatCollapsedAttr(state.cost_lines, i, 'wcd') + (r.cost_work_type_code ? ' title="' + esc(r.cost_work_type_code) + '"' : '') + (ro ? ' disabled' : '') + '></td>';
      html += '<td' + (isLink ? ' class="jy-link-wt"' : '') + '><input class="jy-in jy-text-cell" list="jy-wt-list" data-cost-wt="' + i + '" value="' + esc(wtDisplay) + '"' + costRepeatCollapsedAttr(state.cost_lines, i, 'wt') + (r.cost_work_type ? ' title="' + esc(r.cost_work_type) + '"' : '') + (ro ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in jy-code" list="jy-cat-code-list" data-cost-ccd="' + i + '" value="' + esc(ccdDisplay) + '"' + costRepeatCollapsedAttr(state.cost_lines, i, 'ccd') + (r.cost_category_code ? ' title="' + esc(r.cost_category_code) + '"' : '') + (ro ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in jy-text-cell" list="jy-cat-list" data-cost-cat="' + i + '" value="' + esc(catDisplay) + '"' + costRepeatCollapsedAttr(state.cost_lines, i, 'cat') + (r.cost_category ? ' title="' + esc(r.cost_category) + '"' : '') + (ro ? ' disabled' : '') + '></td>';
      html += '<td><select class="jy-in" data-cost-kind="' + i + '"' + (ro ? ' disabled' : '') + '>' + ROW_KIND_OPTS.map(function (k) {
        return '<option value="' + esc(k) + '"' + (r.cost_row_kind === k ? ' selected' : '') + '>' + esc(rowKindDisplay(k)) + '</option>';
      }).join('') + '</select></td>';
      if (ro) {
        html += '<td class="jy-center jy-ro">' + esc(fmtTaxRate(r.cost_tax_rate)) + '</td>';
        html += '<td class="jy-center jy-ro">' + disp(r.cost_unit) + '</td>';
      } else {
        html += '<td class="jy-center"><select class="jy-in" data-cost-tax="' + i + '">' + taxRateSelOpts(r.cost_tax_rate === '' ? '' : String(r.cost_tax_rate), true) + '</select></td>';
        html += '<td class="jy-center"><select class="jy-in" data-cost-unit="' + i + '">' + selOpts(m.units, r.cost_unit, true) + '</select></td>';
      }
      html += '<td><input class="jy-in jy-num" data-cost-qty="' + i + '" type="number" step="any" value="' + esc(r.cost_qty) + '"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td>' + unitPriceInput('data-cost-price', i, r.cost_unit_price, ro) + '</td>';
      html += '<td class="jy-num jy-ro">' + (isLink && r.detail_marker && REF_DETAIL_IDS[r.detail_marker]
        ? refAmountLink(r.detail_marker, 'detail', r.cost_amount)
        : fmt(r.cost_amount)) + '</td>';
      if (isLink && r.cost_basis_note && /…[②③④⑤⑥⑦]/.test(r.cost_basis_note)) {
        html += '<td class="jy-ref-cell">' + noteWithRefs(r.cost_basis_note, 'detail') + '</td>';
      } else {
        html += '<td><input class="jy-in" data-cost-note="' + i + '" value="' + esc(r.cost_basis_note) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      }
      html += '<td class="jy-ref-cell">' + (r.detail_marker && REF_DETAIL_IDS[r.detail_marker] ? refLinkToDetail(r.detail_marker) : esc(r.detail_marker)) + '</td>';
      html += '<td class="jy-num jy-ro">' + fmtPct(r.cost_ratio) + '</td>';
      }
      if (!readOnly && !isSub) {
        html += '<td class="jy-row-actions">';
        html += '<button type="button" class="jy-btn" data-cost-add-after="' + i + '" title="この行の下に追加">＋</button>';
        html += '<button type="button" class="jy-btn" data-cost-del="' + i + '" title="この行を削除">×</button>';
        html += '</td>';
      }
      html += '</tr>';
    });
    html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="jy-sum-ref-8"><td colspan="' + costColSpan + '"></td></tr>';
    html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="jy-sum-ref-9"><td colspan="' + costColSpan + '"></td></tr>';
    html += '</tbody><tfoot><tr class="jy-foot-sum"><td colspan="9">工事原価額 …⑧</td><td class="jy-num">' + fmt(state.cost_total_8) + '</td><td colspan="' + (readOnly ? 3 : 4) + '"></td></tr>';
    html += '<tr class="jy-foot-sum"><td colspan="9">粗利 …⑨</td><td class="jy-num">' + fmt(state.profit_9) + '</td><td colspan="2" class="jy-num">' + fmtPct(state.profit_rate) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table>';
    html += datalist('jy-wt-list', (masterCache && masterCache.workTypes) || []);
    html += datalist('jy-wt-code-list', (masterCache && masterCache.workTypeCodes) || []);
    html += datalist('jy-cat-list', (masterCache && masterCache.categories) || []);
    html += datalist('jy-cat-code-list', (masterCache && masterCache.categoryCodes) || []);
    html += '</div>';
    return html;
  }

  function blankMatRow(group) {
    return {
      mat_vendor: '',
      mat_name: '',
      mat_capacity: '',
      mat_maker: '',
      mat_qty: '',
      mat_unit_price: '',
      mat_amount: 0,
      mat_group: group,
      mat_basis: '',
    };
  }

  function subDetailLineOptions(blockId) {
    const base = (SUB_LINES[blockId] || []).filter(function (t) {
      return subKindFromLabel(t, blockId) === 'detail';
    });
    const extra = SUB_DETAIL_EXTRA[blockId] || [];
    const out = base.slice();
    extra.forEach(function (t) {
      if (out.indexOf(t) < 0) out.push(t);
    });
    return out;
  }

  function subLineTypeDatalist(blockId) {
    return datalist('jy-sub-type-list-' + blockId, subDetailLineOptions(blockId));
  }

  function subLineTypeInput(i, r, blockId) {
    const listId = 'jy-sub-type-list-' + blockId;
    return '<input class="jy-in jy-text-cell" data-sub-type="' + i + '" list="' + listId + '" value="' + esc(r.sub_line_type) + '" placeholder="種別"' + (r.sub_line_type ? ' title="' + esc(r.sub_line_type) + '"' : '') + '>';
  }

  function isCustomSubRow(r, blockId) {
    if (r.sub_row_kind !== 'detail') return false;
    if (r.sub_is_custom) return true;
    const template = SUB_LINES[blockId] || [];
    return !r.sub_line_type || template.indexOf(r.sub_line_type) < 0;
  }

  function canDeleteSubRow(r, blockId) {
    if (r.sub_row_kind === 'vendor') return false;
    if (SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead') return false;
    return isCustomSubRow(r, blockId);
  }

  function findSubDetailInsertIndex(blockId) {
    for (let i = 0; i < state.subcontract_lines.length; i += 1) {
      const r = state.subcontract_lines[i];
      if (r.subcontract_block !== blockId) continue;
      if (SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead') return i;
    }
    let insertAt = state.subcontract_lines.length;
    for (let i = 0; i < state.subcontract_lines.length; i += 1) {
      if (state.subcontract_lines[i].subcontract_block === blockId) insertAt = i + 1;
    }
    return insertAt;
  }

  function insertMatRowAfter(i) {
    syncInputs();
    const r = state.mat_lines[i];
    if (!r) return;
    state.mat_lines.splice(i + 1, 0, blankMatRow(r.mat_group || '塗料'));
    markInsertedRow('mat', i + 1);
    markDirty();
    render();
  }

  function insertMatRowAtGroupEnd(group) {
    syncInputs();
    let insertAt = state.mat_lines.length;
    for (let i = state.mat_lines.length - 1; i >= 0; i -= 1) {
      if (state.mat_lines[i].mat_group === group) {
        insertAt = i + 1;
        break;
      }
    }
    state.mat_lines.splice(insertAt, 0, blankMatRow(group));
    markInsertedRow('mat', insertAt);
    markDirty();
    render();
  }

  function blankSpecRow() {
    return { spec_name: '', spec_unit: '', spec_qty: '', spec_unit_price: '', spec_amount: 0, spec_note: '' };
  }

  function insertSpecRowAfter(i) {
    syncInputs();
    if (!state.spec_lines[i]) return;
    state.spec_lines.splice(i + 1, 0, blankSpecRow());
    markInsertedRow('spec', i + 1);
    markDirty();
    render();
  }

  function insertSpecRowAtEnd() {
    syncInputs();
    state.spec_lines.push(blankSpecRow());
    markInsertedRow('spec', state.spec_lines.length - 1);
    markDirty();
    render();
  }

  function insertCostRowAfter(i) {
    syncInputs();
    if (!state.cost_lines[i]) return;
    state.cost_lines.splice(i + 1, 0, blankCostRow({ cost_row_kind: 'detail' }));
    markInsertedRow('cost', i + 1);
    markDirty();
    render();
  }

  function insertCostRowAtEnd() {
    syncInputs();
    state.cost_lines.push(blankCostRow({ cost_row_kind: 'detail' }));
    markInsertedRow('cost', state.cost_lines.length - 1);
    markDirty();
    render();
  }

  function blankSubDetailRow(blockId) {
    return {
      subcontract_block: blockId,
      sub_row_kind: 'detail',
      sub_is_custom: true,
      sub_vendor: '',
      sub_line_type: '',
      sub_unit: '',
      sub_qty: '',
      sub_unit_price: '',
      sub_amount: 0,
      sub_basis: '',
    };
  }

  function insertSubRowAfter(i) {
    syncInputs();
    const r = state.subcontract_lines[i];
    if (!r) return;
    if (SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead') return;
    state.subcontract_lines.splice(i + 1, 0, blankSubDetailRow(r.subcontract_block));
    markInsertedRow('sub', i + 1);
    markDirty();
    render();
  }

  function insertSubDetailRow(blockId) {
    syncInputs();
    const idx = findSubDetailInsertIndex(blockId);
    state.subcontract_lines.splice(idx, 0, blankSubDetailRow(blockId));
    markInsertedRow('sub', idx);
    markDirty();
    render();
  }

  function renderSheetBanner(kind) {
    const sheetLabel = kind === 'summary' ? '総　括　表' : '詳　細　表';
    return (
      '<div class="jy-sheet-title jy-sheet-title-' + kind + '" role="heading" aria-level="2">' +
      '<span class="jy-sheet-title-doc">実　行　予　算　書</span>' +
      '<span class="jy-sheet-title-sheet">' + sheetLabel + '</span>' +
      '</div>'
    );
  }

  function detailSectionHead(titleHtml, actionsHtml, extraClass) {
    return '<div class="jy-pane-title jy-section-head' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<span class="jy-section-head-title">' + titleHtml + '</span>' +
      (actionsHtml ? '<span class="jy-section-head-actions">' + actionsHtml + '</span>' : '') +
      '</div>';
  }

  function matSectionAddBtn(group) {
    return '<button type="button" class="jy-btn jy-btn-sm" data-mat-add="' + esc(group) + '" title="この表の末尾に行を追加">＋ 末尾に追加</button>';
  }

  function specSectionAddBtn() {
    return '<button type="button" class="jy-btn jy-btn-sm" data-spec-add title="この表の末尾に行を追加">＋ 末尾に追加</button>';
  }

  function costSectionAddBtn() {
    return '<button type="button" class="jy-btn jy-btn-sm" data-cost-add title="原価行を末尾に追加">＋ 末尾に追加</button>';
  }

  function subSectionAddBtn(blockId, label) {
    return '<button type="button" class="jy-btn jy-btn-sm" data-sub-add="' + esc(blockId) + '" title="諸経費・合計の前に明細を追加">＋ 末尾に明細追加</button>';
  }

  function renderMatRow(r, i, readOnly) {
    let row = '<tr><td class="jy-center"><input class="jy-in jy-text-cell" data-mat-vendor="' + i + '" value="' + esc(r.mat_vendor) + '"' + (r.mat_vendor ? ' title="' + esc(r.mat_vendor) + '"' : '') + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in jy-text-cell" data-mat-name="' + i + '" value="' + esc(r.mat_name) + '"' + (r.mat_name ? ' title="' + esc(r.mat_name) + '"' : '') + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td class="jy-center"><input class="jy-in" data-mat-cap="' + i + '" value="' + esc(r.mat_capacity) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td class="jy-center"><input class="jy-in" data-mat-maker="' + i + '" value="' + esc(r.mat_maker) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in jy-num" data-mat-qty="' + i + '" type="number" step="any" value="' + esc(r.mat_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td>' + unitPriceInput('data-mat-price', i, r.mat_unit_price, readOnly) + '</td>';
    row += '<td class="jy-center"><select class="jy-in" data-mat-grp="' + i + '"' + (readOnly ? ' disabled' : '') + '><option' + (r.mat_group === '塗料' ? ' selected' : '') + '>塗料</option><option' + (r.mat_group === 'その他' ? ' selected' : '') + '>その他</option></select></td>';
    row += '<td class="jy-num jy-ro">' + fmt(r.mat_amount) + '</td>';
    row += '<td><input class="jy-in" data-mat-basis="' + i + '" value="' + esc(r.mat_basis) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    if (!readOnly) {
      row += '<td class="jy-row-actions">';
      row += '<button type="button" class="jy-btn" data-mat-add-after="' + i + '" title="この行の下に追加">＋</button>';
      row += '<button type="button" class="jy-btn" data-mat-del="' + i + '" title="この行を削除">×</button>';
      row += '</td>';
    }
    row += '</tr>';
    return row;
  }

  function renderDetail() {
    recalcState(state);
    const m = masterCache || { units: SPEC_UNITS };
    const matColgroup = '<colgroup><col class="jy-col-vendor"><col class="jy-col-name"><col class="jy-col-cap"><col class="jy-col-maker">' +
      '<col class="jy-col-qty"><col class="jy-col-price"><col class="jy-col-grp"><col class="jy-col-amt"><col class="jy-col-basis">' +
      (readOnly ? '' : '<col class="jy-col-del">') +
      '</colgroup>';
    const matHead = matColgroup + '<thead><tr><th class="jy-center">仕入先</th><th>品名</th><th class="jy-center">容量</th><th class="jy-center">メーカー</th><th>所要量</th><th>単価</th><th class="jy-center">区分</th><th class="jy-num">金額</th><th>計算基準</th>' + (readOnly ? '' : '<th>操作</th>') + '</tr></thead>';
    let html = '';
    html += renderDetailHelpPanel();
    html += '<div id="jy-sec-mat-2" class="jy-sec-anchor"></div>';
    html += detailSectionHead(
      refLinkToSummary('②') + ' 材料明細（塗料）',
      readOnly ? '' : matSectionAddBtn('塗料'),
      'jy-linked-title'
    );
    html += '<div class="jy-excel-wrap jy-linked-wrap"><table class="jy-table jy-table-mat">' + matHead + '<tbody>';
    state.mat_lines.forEach(function (r, i) {
      if (r.mat_group !== '塗料') return;
      html += renderMatRow(r, i, readOnly);
    });
    html += '</tbody><tfoot><tr><td colspan="7">' + refLinkToSummary('②') + ' 塗料合計</td><td class="jy-num">' + refAmountLink('②', 'summary', state.mat_total_2) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';

    html += '<div id="jy-sec-mat-3" class="jy-sec-anchor"></div>';
    html += detailSectionHead(
      refLinkToSummary('③') + ' 材料明細（その他）',
      readOnly ? '' : matSectionAddBtn('その他'),
      'jy-linked-title'
    );
    html += '<div class="jy-excel-wrap jy-linked-wrap"><table class="jy-table jy-table-mat">' + matHead + '<tbody>';
    state.mat_lines.forEach(function (r, i) {
      if (r.mat_group !== 'その他') return;
      html += renderMatRow(r, i, readOnly);
    });
    html += '</tbody><tfoot><tr><td colspan="7">' + refLinkToSummary('③') + ' その他合計</td><td class="jy-num">' + refAmountLink('③', 'summary', state.mat_total_3) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';

    SUB_BLOCKS.forEach(function (b) {
      const mk = BLOCK_MARKERS[b.id];
      html += '<div id="jy-sec-block-' + b.id + '" class="jy-sec-anchor"></div>';
      html += '<details class="jy-block jy-linked-block" open><summary class="jy-block-summary">' +
        '<span class="jy-block-summary-label">' + esc(b.label) + ' <span class="jy-ref-meta">' + refLinkToSummary(mk) + ' → 総括表</span></span>' +
        (readOnly ? '' : '<span class="jy-block-summary-actions">' + subSectionAddBtn(b.id, b.label) + '</span>') +
        '</summary><table class="jy-table"><thead><tr><th class="jy-center">会社名</th><th>種別</th><th class="jy-center">単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>計算基準</th>' + (readOnly ? '' : '<th>操作</th>') + '</tr></thead><tbody>';
      state.subcontract_lines.forEach(function (r, i) {
        if (r.subcontract_block !== b.id) return;
        if (r.sub_row_kind === 'vendor') {
          html += '<tr><td class="jy-center"><input class="jy-in" data-sub-vendor="' + i + '" value="' + esc(r.sub_vendor) + '" placeholder="会社名"' + (readOnly ? ' disabled' : '') + '></td><td></td><td colspan="5"></td>';
          if (!readOnly) {
            html += '<td class="jy-row-actions"><button type="button" class="jy-btn" data-sub-add-after="' + i + '" title="この行の下に明細行を追加">＋</button></td>';
          }
          html += '</tr>';
          return;
        }
        const calcRow = SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead';
        const customRow = isCustomSubRow(r, b.id);
        html += '<tr class="' + (calcRow ? 'jy-calc-row' : '') + '"><td></td><td>';
        if (customRow && !readOnly) {
          html += subLineTypeInput(i, r, b.id);
        } else {
          html += esc(r.sub_line_type);
        }
        html += '</td>';
        if (calcRow) {
          html += '<td class="jy-center">' + disp(r.sub_unit) + '</td><td colspan="2"></td><td class="jy-num">' + fmt(r.sub_amount) + '</td><td>' + esc(r.sub_basis) + '</td>';
          if (!readOnly) html += '<td></td>';
          html += '</tr>';
        } else {
          html += '<td class="jy-center"><select class="jy-in" data-sub-unit="' + i + '"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.units, r.sub_unit, true) + '</select></td>';
          html += '<td><input class="jy-in jy-num" data-sub-qty="' + i + '" type="number" step="any" value="' + esc(r.sub_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
          html += '<td>' + unitPriceInput('data-sub-price', i, r.sub_unit_price, readOnly) + '</td>';
          html += '<td class="jy-num jy-ro">' + fmt(r.sub_amount) + '</td>';
          html += '<td><input class="jy-in" data-sub-basis="' + i + '" value="' + esc(r.sub_basis) + '"' + (readOnly ? ' disabled' : '') + '></td>';
          if (!readOnly) {
            html += '<td class="jy-row-actions">';
            html += '<button type="button" class="jy-btn" data-sub-add-after="' + i + '" title="この行の下に追加">＋</button>';
            if (canDeleteSubRow(r, b.id)) {
              html += '<button type="button" class="jy-btn" data-sub-del="' + i + '" title="この行を削除">×</button>';
            }
            html += '</td>';
          }
          html += '</tr>';
        }
      });
      html += '</tbody></table>';
      html += subLineTypeDatalist(b.id);
      html += '</details>';
    });
    return html;
  }

  let jyPrintAfterPrintBound = false;

  function printPortalStylesheet() {
    return (
      '#jy-print-portal{display:none}' +
      '@media print{' +
      '@page{size:A4 landscape;margin:5mm}' +
      'html,body{margin:0!important;padding:0!important;height:auto!important;min-height:0!important;overflow:hidden!important}' +
      'body>:not(#jy-print-portal){display:none!important}' +
      '#jy-print-portal{display:block!important;position:static!important;width:100%!important;height:auto!important;overflow:visible!important}' +
      '}' +
      '.jy-pr{font-family:Segoe UI,Meiryo,sans-serif;color:#1e293b;font-size:11pt;line-height:1.3}' +
      '.jy-pr-doc{padding:0}' +
      '.jy-pr-doc-title{font-size:16pt;font-weight:700;text-align:center;letter-spacing:.15em;margin:0 0 1mm;line-height:1.2}' +
      '.jy-pr-project-banner{margin:0 0 5px;text-align:center;padding:3px 0 2px}' +
      '.jy-pr-project-name{font-size:13pt;font-weight:700;color:#0f172a;line-height:1.35}' +
      '.jy-pr-project-sub{font-size:10pt;color:#475569;margin-top:1px;line-height:1.3}' +
      '.jy-pr-sheet-title{font-size:12pt;font-weight:700;text-align:center;margin:0 0 4px;color:#334155;line-height:1.2}' +
      '.jy-pr-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px 8px;margin-bottom:4px;border:1px solid #cbd5e1;border-radius:3px;padding:4px 6px;background:#f8fafc;font-size:10pt;line-height:1.25}' +
      '.jy-pr-meta-item{display:flex;gap:4px;align-items:baseline;min-width:0}' +
      '.jy-pr-meta-label{font-weight:600;color:#475569;white-space:nowrap;flex-shrink:0;font-size:9pt}' +
      '.jy-pr-meta-val{color:#0f172a;min-width:0;word-break:break-all}' +
      '.jy-pr-section{margin-bottom:3px}' +
      '.jy-pr-sec-head{font-size:11pt;font-weight:700;margin:0 0 2px;padding:2px 6px;background:#e8eef4;border-left:4px solid #2563eb;line-height:1.25}' +
      '.jy-pr-block-section{margin-top:10px;padding-top:6px;border-top:2px solid #94a3b8}' +
      '.jy-pr-block-section:first-of-type{margin-top:6px;border-top:none;padding-top:0}' +
      '.jy-pr-block-head{font-size:12.5pt;font-weight:700;margin:0 0 4px;padding:6px 12px;background:#e0f2fe;border:1px solid #38bdf8;border-radius:4px;color:#0c4a6e;line-height:1.3}' +
      '.jy-pr-block-wrap{border:1px solid #cbd5e1;border-radius:3px;padding:2px;margin-bottom:2px;background:#fff}' +
      '.jy-pr-vendor-row td{background:#f8fafc}' +
      '.jy-pr-vendor-row td:first-child{font-weight:700}' +
      '.jy-pr-marker{text-align:center;color:#0369a1;font-weight:700;font-size:10pt}' +
      '.jy-pr-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10pt;line-height:1.25}' +
      '.jy-pr-table th,.jy-pr-table td{border:1px solid #cbd5e1;padding:1px 3px;vertical-align:middle}' +
      '.jy-pr-table th{background:#f1f5f9;font-weight:600;text-align:center;color:#475569;font-size:9pt;padding:2px 3px}' +
      '.jy-pr-table td.jy-num{text-align:right;font-variant-numeric:tabular-nums}' +
      '.jy-pr-table td.jy-center{text-align:center}' +
      '.jy-pr-table th.jy-center{text-align:center}' +
      '.jy-pr-table tfoot td{background:#f8fafc;font-weight:700;border-top:2px solid #94a3b8;padding:2px 3px}' +
      '.jy-pr-table tr.jy-pr-link td{background:#f0fdf4}' +
      '.jy-pr-table tr.jy-pr-link td:first-child{box-shadow:inset 3px 0 0 #6ee7b7}' +
      '.jy-pr-table tr.jy-pr-sub td{background:#eff6ff}' +
      '.jy-pr-table tr.jy-pr-sub td.jy-pr-sub-amt{background:#dbeafe;font-weight:700;color:#1e3a8a}' +
      '.jy-pr-sub-badge{display:inline-block;background:#3b82f6;color:#fff;font-size:8.5pt;padding:1px 6px;border-radius:2px}' +
      '.jy-pr-ditto{text-align:center;color:#64748b}' +
      '.jy-pr-wrap{overflow:hidden}' +
      '.jy-pr-spec .jy-col-spec{width:36%}' +
      '.jy-pr-cost .jy-col-wcd{width:6%}' +
      '.jy-pr-cost .jy-col-wt{width:14%}' +
      '.jy-pr-cost .jy-col-ccd{width:6%}' +
      '.jy-pr-cost .jy-col-cat{width:12%}' +
      '.jy-pr-cost .jy-col-kind{width:9%}' +
      '.jy-pr-cost .jy-col-tax{width:5%}' +
      '.jy-pr-cost .jy-col-unit{width:5%}' +
      '.jy-pr-cost .jy-col-qty{width:6%}' +
      '.jy-pr-cost .jy-col-price{width:7%}' +
      '.jy-pr-cost .jy-col-amt{width:8%}' +
      '.jy-pr-cost .jy-col-note{width:14%}' +
      '.jy-pr-cost .jy-col-ratio{width:6%}' +
      '.jy-pr-mat .jy-col-vendor{width:10%}' +
      '.jy-pr-mat .jy-col-name{width:22%}' +
      '.jy-pr-mat .jy-col-cap{width:8%}' +
      '.jy-pr-mat .jy-col-maker{width:10%}' +
      '.jy-pr-mat .jy-col-qty{width:7%}' +
      '.jy-pr-mat .jy-col-price{width:8%}' +
      '.jy-pr-mat .jy-col-grp{width:7%}' +
      '.jy-pr-mat .jy-col-amt{width:8%}' +
      '.jy-pr-mat .jy-col-basis{width:10%}' +
      '.jy-pr-mat .jy-col-note{width:7%}' +
      '.jy-pr-sub-table .jy-col-note{width:7%}'
    );
  }

  function injectPrintPortalCss() {
    let st = document.getElementById('jy-print-portal-css');
    if (!st) {
      st = document.createElement('style');
      st.id = 'jy-print-portal-css';
      document.head.appendChild(st);
    }
    st.textContent = printPortalStylesheet();
  }

  function ensurePrintPortal() {
    let el = document.getElementById('jy-print-portal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'jy-print-portal';
    document.body.appendChild(el);
    return el;
  }

  function bindPrintPortalCleanup() {
    if (jyPrintAfterPrintBound) return;
    jyPrintAfterPrintBound = true;
    window.addEventListener('afterprint', function () {
      const p = document.getElementById('jy-print-portal');
      if (p) p.innerHTML = '';
    }, false);
  }

  function printPrepState() {
    syncInputs();
    recalcState(state);
  }

  function printMetaFields() {
    return [
      ['版種別', state.version_type],
      ['工事コード', state.project_code],
      ['工事正式名称', state.project_official_name],
      ['工事名称', state.project_name],
      ['桁種別', state.girder_type],
      ['発注支社', state.order_branch],
      ['部門', state.department],
      ['発注者', state.client_name],
      ['安衛則88条', state.safety_rule_88],
      ['現場入場予定日', state.site_entry_date],
      ['立案日', state.draft_date],
      ['作成日', state.record_created_date],
      ['着手日', state.start_date],
      ['竣工日', state.end_date],
      ['作成者', state.created_by_name],
      ['担当者', state.person_in_charge_name],
      ['ステータス', state.status],
      ['備考', state.note],
    ];
  }

  function renderPrintMetaHtml() {
    let html = '<div class="jy-pr-meta">';
    printMetaFields().forEach(function (pair) {
      html += '<div class="jy-pr-meta-item"><span class="jy-pr-meta-label">' + esc(pair[0]) + '</span><span class="jy-pr-meta-val">' + disp(pair[1] || '') + '</span></div>';
    });
    html += '</div>';
    return html;
  }

  function printRefMarker(marker) {
    return marker ? '…' + marker : '';
  }

  function printSubBlockTitle(label) {
    return String(label || '').replace(/…[②③④⑤⑥⑦]/g, '').trim();
  }

  function renderPrintProjectBanner() {
    const name = normalizeFiscalYearText(String(state.project_name || '').trim());
    const official = normalizeFiscalYearText(String(state.project_official_name || '').trim());
    const code = String(state.project_code || '').trim();
    if (!name && !official && !code) return '';
    let html = '<div class="jy-pr-project-banner">';
    if (name) html += '<div class="jy-pr-project-name">' + esc(name) + '</div>';
    const sub = [];
    if (code) sub.push('工事コード：' + toHalfWidthAscii(code));
    if (official && official !== name) sub.push(official);
    if (sub.length) html += '<div class="jy-pr-project-sub">' + esc(sub.join('　')) + '</div>';
    html += '</div>';
    return html;
  }

  function renderPrintDocHead(sheetTitle) {
    return (
      '<h1 class="jy-pr-doc-title">実　行　予　算　書</h1>' +
      renderPrintProjectBanner() +
      '<p class="jy-pr-sheet-title">' + esc(sheetTitle) + '</p>' +
      renderPrintMetaHtml()
    );
  }

  function renderPrintSpecTable() {
    let html = '<div class="jy-pr-section"><div class="jy-pr-sec-head">仕様明細（①）</div><div class="jy-pr-wrap">';
    html += '<table class="jy-pr-table jy-pr-spec"><thead><tr>' +
      '<th class="jy-col-spec">仕様</th><th class="jy-center">単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>備考</th>' +
      '</tr></thead><tbody>';
    state.spec_lines.forEach(function (r) {
      html += '<tr><td>' + esc(r.spec_name) + '</td><td class="jy-center">' + disp(r.spec_unit) + '</td>';
      html += '<td class="jy-num">' + disp(r.spec_qty) + '</td>';
      html += '<td class="jy-num">' + esc(formatUnitPrice(r.spec_unit_price)) + '</td>';
      html += '<td class="jy-num">' + fmt(r.spec_amount) + '</td><td>' + esc(r.spec_note) + '</td></tr>';
    });
    html += '</tbody><tfoot><tr><td colspan="4" class="jy-num">合計 …①</td><td class="jy-num">' + fmt(state.contract_total_1) + '</td><td></td></tr></tfoot></table></div></div>';
    return html;
  }

  function renderPrintCostTable() {
    const lines = state.cost_lines;
    let html = '<div class="jy-pr-section"><div class="jy-pr-sec-head">原価行（②〜⑧）</div><div class="jy-pr-wrap">';
    html += '<table class="jy-pr-table jy-pr-cost"><thead><tr>' +
      '<th class="jy-col-wcd">工種CD</th><th class="jy-col-wt">システム入力工種</th><th class="jy-col-ccd">種別CD</th><th class="jy-col-cat">種別</th>' +
      '<th class="jy-col-kind">行種別</th><th class="jy-col-tax jy-center">消費税</th><th class="jy-col-unit jy-center">単位</th><th class="jy-col-qty">数量</th>' +
      '<th class="jy-col-price">単価</th><th class="jy-col-amt jy-num">金額</th><th class="jy-col-note">計算基準・備考</th><th class="jy-col-ratio jy-num">率</th>' +
      '</tr></thead><tbody>';
    lines.forEach(function (r, i) {
      const isLink = r.cost_row_kind === '連携';
      const isSub = r.cost_row_kind === '小計';
      const rowCls = isLink ? 'jy-pr-link' : (isSub ? 'jy-pr-sub' : '');
      const subAmt = isSub ? (r.subtotal_display_amount != null ? r.subtotal_display_amount : r.cost_amount) : r.cost_amount;
      html += '<tr class="' + rowCls + '">';
      if (isSub) {
        html += '<td colspan="9" class="jy-pr-sub-label"><span class="jy-pr-sub-badge">計</span></td>';
        html += '<td class="jy-num jy-pr-sub-amt">' + fmt(subAmt) + '</td>';
        html += '<td>' + esc(subtotalBasisNote(r)) + '</td><td class="jy-num">' + fmtPct(r.cost_ratio) + '</td>';
      } else {
        const wcd = costPrintDisplay(lines, i, 'wcd', 'cost_work_type_code');
        const wt = costPrintDisplay(lines, i, 'wt', 'cost_work_type');
        const ccd = costPrintDisplay(lines, i, 'ccd', 'cost_category_code');
        const cat = costPrintDisplay(lines, i, 'cat', 'cost_category');
        html += '<td class="' + (wcd === '〃' ? 'jy-pr-ditto' : '') + '">' + esc(wcd) + '</td>';
        html += '<td class="' + (wt === '〃' ? 'jy-pr-ditto' : '') + '">' + esc(wt) + '</td>';
        html += '<td class="' + (ccd === '〃' ? 'jy-pr-ditto' : '') + '">' + esc(ccd) + '</td>';
        html += '<td class="' + (cat === '〃' ? 'jy-pr-ditto' : '') + '">' + esc(cat) + '</td>';
        html += '<td>' + esc(rowKindDisplay(r.cost_row_kind)) + '</td>';
        html += '<td class="jy-center">' + esc(fmtTaxRate(r.cost_tax_rate)) + '</td><td class="jy-center">' + disp(r.cost_unit) + '</td>';
        html += '<td class="jy-num">' + disp(r.cost_qty) + '</td>';
        html += '<td class="jy-num">' + esc(formatUnitPrice(r.cost_unit_price)) + '</td>';
        html += '<td class="jy-num">' + fmt(r.cost_amount) + '</td>';
        html += '<td>' + esc(r.cost_basis_note) + '</td>';
        html += '<td class="jy-num">' + fmtPct(r.cost_ratio) + '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody><tfoot>';
    html += '<tr><td colspan="9">工事原価額 …⑧</td><td class="jy-num">' + fmt(state.cost_total_8) + '</td><td colspan="2"></td></tr>';
    html += '<tr><td colspan="9">粗利 …⑨</td><td class="jy-num">' + fmt(state.profit_9) + '</td><td></td><td class="jy-num">' + fmtPct(state.profit_rate) + '</td></tr>';
    html += '</tfoot></table></div></div>';
    return html;
  }

  function renderPrintMatBlock(title, group, totalLabel, totalAmount, marker) {
    let html = '<div class="jy-pr-block-section"><div class="jy-pr-block-head">' + esc(title) + '</div><div class="jy-pr-block-wrap"><div class="jy-pr-wrap">';
    html += '<table class="jy-pr-table jy-pr-mat"><thead><tr>' +
      '<th class="jy-col-vendor jy-center">仕入先</th><th class="jy-col-name">品名</th><th class="jy-col-cap jy-center">容量</th><th class="jy-col-maker jy-center">メーカー</th>' +
      '<th class="jy-col-qty">所要量</th><th class="jy-col-price">単価</th><th class="jy-col-grp jy-center">区分</th><th class="jy-col-amt jy-num">金額</th><th class="jy-col-basis">計算基準</th><th class="jy-col-note">備考</th>' +
      '</tr></thead><tbody>';
    state.mat_lines.forEach(function (r) {
      if (r.mat_group !== group) return;
      html += '<tr><td class="jy-center">' + disp(r.mat_vendor) + '</td><td>' + esc(r.mat_name) + '</td><td class="jy-center">' + disp(r.mat_capacity) + '</td>';
      html += '<td class="jy-center">' + disp(r.mat_maker) + '</td><td class="jy-num">' + disp(r.mat_qty) + '</td>';
      html += '<td class="jy-num">' + esc(formatUnitPrice(r.mat_unit_price)) + '</td><td class="jy-center">' + disp(r.mat_group) + '</td>';
      html += '<td class="jy-num">' + fmt(r.mat_amount) + '</td><td>' + esc(r.mat_basis) + '</td><td></td></tr>';
    });
    html += '</tbody><tfoot><tr><td colspan="7">' + esc(totalLabel) + '</td><td class="jy-num">' + fmt(totalAmount) + '</td><td></td>';
    html += '<td class="jy-pr-marker">' + esc(printRefMarker(marker)) + '</td></tr></tfoot></table></div></div></div>';
    return html;
  }

  function renderPrintSubBlock(b) {
    const mk = BLOCK_MARKERS[b.id];
    let html = '<div class="jy-pr-block-section"><div class="jy-pr-block-head">' + esc(printSubBlockTitle(b.label)) + '</div><div class="jy-pr-block-wrap"><div class="jy-pr-wrap">';
    html += '<table class="jy-pr-table jy-pr-sub-table"><thead><tr><th class="jy-center">会社名</th><th>種別</th><th class="jy-center">単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>計算基準</th><th class="jy-col-note">備考</th></tr></thead><tbody>';
    state.subcontract_lines.forEach(function (r) {
      if (r.subcontract_block !== b.id) return;
      if (r.sub_row_kind === 'vendor') {
        html += '<tr class="jy-pr-vendor-row"><td class="jy-center">' + disp(r.sub_vendor) + '</td><td></td><td></td><td></td><td></td><td></td><td></td>';
        html += '<td class="jy-pr-marker">' + esc(printRefMarker(mk)) + '</td></tr>';
        return;
      }
      const calcRow = SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead';
      html += '<tr' + (calcRow ? ' class="jy-pr-sub"' : '') + '><td></td><td>' + esc(r.sub_line_type) + '</td>';
      if (calcRow) {
        html += '<td class="jy-center">' + disp(r.sub_unit) + '</td><td></td><td></td><td class="jy-num">' + fmt(r.sub_amount) + '</td><td>' + esc(r.sub_basis) + '</td><td></td></tr>';
      } else {
        html += '<td class="jy-center">' + disp(r.sub_unit) + '</td><td class="jy-num">' + disp(r.sub_qty) + '</td>';
        html += '<td class="jy-num">' + esc(formatUnitPrice(r.sub_unit_price)) + '</td>';
        html += '<td class="jy-num">' + fmt(r.sub_amount) + '</td><td>' + esc(r.sub_basis) + '</td><td></td></tr>';
      }
    });
    html += '</tbody></table></div></div></div>';
    return html;
  }

  function buildPrintSummaryHtml() {
    return renderPrintDocHead('（　総　括　表　）') + renderPrintSpecTable() + renderPrintCostTable();
  }

  function buildPrintDetailHtml() {
    let html = renderPrintDocHead('（　詳　細　表　）');
    html += renderPrintMatBlock('材料明細（塗料）', '塗料', '塗料合計', state.mat_total_2, '②');
    html += renderPrintMatBlock('材料明細（その他）', 'その他', 'その他合計', state.mat_total_3, '③');
    SUB_BLOCKS.forEach(function (b) {
      html += renderPrintSubBlock(b);
    });
    return html;
  }

  function openTabPrint(mode) {
    try {
      printPrepState();
      const bodyHtml = mode === 'summary' ? buildPrintSummaryHtml() : buildPrintDetailHtml();
      if (!bodyHtml || bodyHtml.indexOf('jy-pr-table') < 0) throw new Error('印刷HTMLの生成に失敗しました');
      injectPrintPortalCss();
      bindPrintPortalCleanup();
      const portal = ensurePrintPortal();
      portal.innerHTML = '<div class="jy-pr jy-pr-doc">' + bodyHtml + '</div>';
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          try {
            window.print();
          } catch (err) {
            console.warn(BUILD, err);
            alert('印刷を開始できませんでした: ' + (err.message || err));
          }
        });
      });
    } catch (e) {
      alert('印刷の準備に失敗しました: ' + (e.message || e));
      console.error(BUILD, e);
    }
  }

  function renderFormActionBar() {
    const saveLabel = state.status === '初版確定' ? '保存' : '一時保存';
    let html = '<div class="jy-sticky-top">';
    if (dirty) html += '<div class="jy-dirty" id="jy-dirty">● 未保存の変更があります</div>';
    html += '<div class="jy-bar jy-action-bar">';
    html += '<button type="button" class="jy-btn" id="jy-back-list">← 一覧</button>';
    html += '<strong>' + esc(state.project_code || '新規') + '</strong> <span class="jy-meta">' + esc(state.status) + '</span>';
    html += '<div class="jy-action-bar-right">';
    html += renderFontToggle();
    if (!readOnly) {
      html += '<div class="jy-action-group">';
      html += '<button type="button" class="jy-btn jy-btn-primary" id="jy-save">' + esc(saveLabel) + '</button>';
      html += '<button type="button" class="jy-btn" id="jy-recalc">再計算</button>';
      if (state.status !== '初版確定') {
        html += '<button type="button" class="jy-btn" id="jy-confirm">初版確定</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div></div>';
    return html;
  }

  function renderForm() {
    let html = renderFormActionBar();
    html += renderHeader();
    html += '<div class="jy-tabs"><button type="button" class="jy-tab' + (activeTab === 'summary' ? ' active' : '') + '" data-tab="summary">総括表</button>';
    html += '<button type="button" class="jy-tab' + (activeTab === 'detail' ? ' active' : '') + '" data-tab="detail">詳細表</button></div>';
    html += '<div class="jy-tab-hint ' + (activeTab === 'summary' ? 'jy-tab-hint-summary' : 'jy-tab-hint-detail') + '">' + (activeTab === 'summary'
      ? '番号または詳細表と連携行の金額をクリックすると詳細表の該当ブロックへ移動します'
      : '番号または合計金額をクリックすると総括表の詳細表と連携行へ移動します') +
      '<span class="jy-legend-linked">緑 = 詳細表と連携（②〜⑦）</span>' +
      (readOnly ? '' : '<span class="jy-legend-linked" style="margin-left:8px;background:#f1f5f9;border-color:#cbd5e1;color:#475569">見出しの「末尾に追加」または各行の ＋ で挿入</span>') + '</div>';
    if (activeTab === 'summary') {
      html += '<div class="jy-pane jy-pane-summary"><div class="jy-pane-head">' + renderSheetBanner('summary');
      html += '<button type="button" class="jy-btn jy-btn-print" id="jy-print-summary">印刷</button></div>' + renderSummary() + '</div>';
    } else {
      html += '<div class="jy-pane jy-pane-detail"><div class="jy-pane-head">' + renderSheetBanner('detail');
      html += '<button type="button" class="jy-btn jy-btn-print" id="jy-print-detail">印刷</button></div>' + renderDetail() + '</div>';
    }
    return html;
  }

  function renderList() {
    let html = '<div class="jy-title">実行予算書作成支援ツール　ver.01</div>';
    html += '<div class="jy-subtitle">Excel 風フォームで総括表・詳細表を作成出来るツールです。</div>';
    html += '<div class="jy-bar jy-list-toolbar"><button type="button" class="jy-btn jy-btn-primary" id="jy-new">＋ 新規作成</button>';
    html += '<label><span class="jy-search-label">検索</span><input type="search" id="jy-list-search" class="jy-list-search" placeholder="工事名称・版種別・ステータス・日付など" value="' + esc(listSearchQuery) + '"></label>';
    html += '<button type="button" class="jy-btn" id="jy-list-search-clear">クリア</button>';
    html += '<span class="jy-list-count" id="jy-list-count">' + esc(listCountLabel()) + '</span>';
    html += renderFontToggle();
    html += '</div>';
    html += '<div class="jy-excel-wrap"><table class="jy-table jy-list-table"><thead><tr>' +
      listSortTh('project_name', '工事名称') +
      '<th>版種別</th>' +
      listSortTh('draft_date', '立案日') +
      listSortTh('created_at', '作成日') +
      listSortTh('updated_at', '更新日') +
      listSortTh('status', 'ステータス') +
      '<th class="jy-num">契約合計①</th><th class="jy-num">粗利⑨</th></tr></thead><tbody>';
    if (!listRowsAll.length) {
      html += '<tr><td colspan="8" style="text-align:center;padding:24px">レコードがありません。「新規作成」から開始してください。</td></tr>';
    } else if (!listRows.length) {
      html += '<tr><td colspan="8" style="text-align:center;padding:24px">検索条件に一致するレコードがありません。</td></tr>';
    } else {
      listRows.forEach(function (r) {
        html += '<tr data-open-id="' + esc(r.id) + '" title="クリックで詳細を開く"><td>' + esc(r.project_name) + '</td><td>' + esc(r.version_type) + '</td><td>' + esc(r.draft_date) + '</td><td>' + esc(r.created_at) + '</td><td>' + esc(r.updated_at) + '</td><td>' + esc(r.status) + '</td><td class="jy-num">' + fmt(r.contract_total_1) + '</td><td class="jy-num">' + fmt(r.profit_9) + '</td></tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  }

  function render() {
    const root = document.getElementById('jy-root');
    if (!root) return;
    root.style.fontSize = fontPx();
    root.innerHTML = uiScreen === 'list' ? renderList() : renderForm();
    bindEvents(root);
  }

  function bindEvents(root) {
    root.querySelectorAll('.jy-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        syncInputs();
        activeTab = btn.getAttribute('data-tab');
        render();
      });
    });
    root.querySelectorAll('.jy-in, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { syncInputs(); markDirty(); });
      el.addEventListener('change', function () { syncInputs(); markDirty(); });
    });
    const panel = document.getElementById('jy-header-panel');
    if (panel) panel.addEventListener('toggle', function () { headerOpen = panel.open; });
    const legendPanel = document.getElementById('jy-header-legend-panel');
    if (legendPanel) legendPanel.addEventListener('toggle', function () { headerLegendOpen = legendPanel.open; });
    const specHelpPanel = document.getElementById('jy-spec-help-panel');
    if (specHelpPanel) specHelpPanel.addEventListener('toggle', function () { headerSpecHelpOpen = specHelpPanel.open; });
    const costHelpPanel = document.getElementById('jy-cost-help-panel');
    if (costHelpPanel) costHelpPanel.addEventListener('toggle', function () { headerCostHelpOpen = costHelpPanel.open; });
    const detailHelpPanel = document.getElementById('jy-detail-help-panel');
    if (detailHelpPanel) detailHelpPanel.addEventListener('toggle', function () { headerDetailHelpOpen = detailHelpPanel.open; });

    bindFontToggle(root);

    bindUnitPriceInputs(root);

    bindPersonNameFields();

    const newBtn = document.getElementById('jy-new');
    if (newBtn) newBtn.addEventListener('click', function () {
      state = newDraftState();
      readOnly = false;
      dirty = false;
      uiScreen = 'form';
      activeTab = 'summary';
      render();
    });

    const listSearch = document.getElementById('jy-list-search');
    if (listSearch) {
      listSearch.addEventListener('input', function () {
        listSearchQuery = listSearch.value;
        applyListFilter();
        render();
        const el = document.getElementById('jy-list-search');
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      });
    }
    const listSearchClear = document.getElementById('jy-list-search-clear');
    if (listSearchClear) listSearchClear.addEventListener('click', function () {
      listSearchQuery = '';
      applyListFilter();
      render();
    });

    root.querySelectorAll('[data-open-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        openRecord(tr.getAttribute('data-open-id'));
      });
    });

    root.querySelectorAll('.jy-sort-th').forEach(function (th) {
      th.addEventListener('click', function () {
        const key = th.getAttribute('data-sort-key');
        if (!key || LIST_SORTABLE_KEYS.indexOf(key) < 0) return;
        if (listSortKey === key) {
          listSortDir = listSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          listSortKey = key;
          listSortDir = LIST_DATE_SORT_KEYS.indexOf(key) >= 0 ? 'desc' : 'asc';
        }
        applyListSort();
        render();
      });
    });

    root.querySelectorAll('[data-jy-target]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        jumpToSection(btn.getAttribute('data-jy-target'), btn.getAttribute('data-jy-tab') || 'detail');
      });
    });

    applyPendingScroll();
    applyPendingRowHighlight();

    const back = document.getElementById('jy-back-list');
    if (back) back.addEventListener('click', function () {
      if (dirty && !window.confirm('未保存の変更があります。一覧に戻りますか？')) return;
      uiScreen = 'list';
      dirty = false;
      refreshList().then(render);
    });

    const saveBtn = document.getElementById('jy-save');
    if (saveBtn) saveBtn.addEventListener('click', saveRecord);
    const recalcBtn = document.getElementById('jy-recalc');
    if (recalcBtn) recalcBtn.addEventListener('click', function () { syncInputs(); recalcState(state); render(); });
    const confirmBtn = document.getElementById('jy-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', function () {
      if (!window.confirm('初版を確定します。確定後も編集は可能ですが、ステータスは「初版確定」になります。よろしいですか？')) return;
      state.status = '初版確定';
      saveRecord({ isConfirm: true });
    });

    const printSummaryBtn = document.getElementById('jy-print-summary');
    if (printSummaryBtn) printSummaryBtn.addEventListener('click', function () { openTabPrint('summary'); });
    const printDetailBtn = document.getElementById('jy-print-detail');
    if (printDetailBtn) printDetailBtn.addEventListener('click', function () { openTabPrint('detail'); });

    root.querySelectorAll('[data-spec-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertSpecRowAtEnd();
      });
    });
    root.querySelectorAll('[data-spec-add-after]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertSpecRowAfter(Number(btn.getAttribute('data-spec-add-after')));
      });
    });
    root.querySelectorAll('[data-spec-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        state.spec_lines.splice(Number(btn.getAttribute('data-spec-del')), 1);
        markDirty();
        render();
      });
    });

    root.querySelectorAll('[data-cost-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertCostRowAtEnd();
      });
    });
    root.querySelectorAll('[data-cost-add-after]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertCostRowAfter(Number(btn.getAttribute('data-cost-add-after')));
      });
    });
    root.querySelectorAll('[data-cost-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        const idx = Number(btn.getAttribute('data-cost-del'));
        const r = lineAt(state.cost_lines, idx);
        if (!r || r.cost_row_kind === '小計') return;
        state.cost_lines.splice(idx, 1);
        markDirty();
        render();
      });
    });

    root.querySelectorAll('[data-mat-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertMatRowAtGroupEnd(btn.getAttribute('data-mat-add') || '塗料');
      });
    });
    root.querySelectorAll('[data-mat-add-after]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertMatRowAfter(Number(btn.getAttribute('data-mat-add-after')));
      });
    });
    root.querySelectorAll('[data-mat-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        state.mat_lines.splice(Number(btn.getAttribute('data-mat-del')), 1);
        markDirty();
        render();
      });
    });

    root.querySelectorAll('[data-sub-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertSubDetailRow(btn.getAttribute('data-sub-add'));
      });
    });
    root.querySelectorAll('[data-sub-add-after]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        insertSubRowAfter(Number(btn.getAttribute('data-sub-add-after')));
      });
    });
    root.querySelectorAll('[data-sub-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        const idx = Number(btn.getAttribute('data-sub-del'));
        const r = state.subcontract_lines[idx];
        if (!r || !canDeleteSubRow(r, r.subcontract_block)) return;
        state.subcontract_lines.splice(idx, 1);
        markDirty();
        render();
      });
    });

    bindCostLineFieldSync(root, 'data-cost-wt', 'wt');
    bindCostLineFieldSync(root, 'data-cost-wcd', 'wcd');
    bindCostLineFieldSync(root, 'data-cost-cat', 'cat');
    bindCostLineFieldSync(root, 'data-cost-ccd', 'ccd');
    bindCostLineCollapseDisplay(root);
  }

  function bindPersonNameFields() {
    const createdInput = document.getElementById('jy-created-by-name');
    const personInput = document.getElementById('jy-person-in-charge-name');
    if (createdInput && !readOnly) {
      createdInput.addEventListener('input', function () {
        state.created_by_name = normalizePersonName(createdInput.value);
        syncPersonInChargeFromCreator(true);
        markDirty();
      });
      createdInput.addEventListener('change', function () {
        state.created_by_name = normalizePersonName(createdInput.value);
        syncPersonInChargeFromCreator(true);
        markDirty();
      });
    }
    if (personInput && !readOnly) {
      personInput.addEventListener('input', function () {
        personInChargeManual = true;
        state.person_in_charge_name = normalizePersonName(personInput.value);
        markDirty();
      });
      personInput.addEventListener('change', function () {
        personInChargeManual = true;
        state.person_in_charge_name = normalizePersonName(personInput.value);
        markDirty();
      });
    }
  }

  function lineAt(lines, i) {
    if (!lines || i < 0 || i >= lines.length) return null;
    return lines[i];
  }

  function syncInputs() {
    function g(id) {
      const el = document.getElementById(id);
      return el ? el.value : '';
    }
    if (uiScreen !== 'form') return;
    state.version_type = g('jy-version') || '当初';
    state.site_entry_date = g('jy-site-entry');
    state.draft_date = g('jy-draft-date');
    state.created_by_name = normalizePersonName(g('jy-created-by-name'));
    if (!personInChargeManual) {
      state.person_in_charge_name = state.created_by_name;
    } else {
      state.person_in_charge_name = normalizePersonName(g('jy-person-in-charge-name'));
    }
    state.project_code = g('jy-project-code');
    state.project_official_name = normalizeFiscalYearText(g('jy-project-official'));
    state.project_name = g('jy-project-name');
    state.girder_type = g('jy-girder');
    state.order_branch = g('jy-branch');
    state.department = g('jy-dept');
    state.client_name = g('jy-client');
    state.safety_rule_88 = g('jy-safety') || '有';
    state.start_date = g('jy-start');
    state.end_date = g('jy-end');
    state.status = g('jy-status') || '下書き';
    state.note = g('jy-note');

    document.querySelectorAll('[data-spec-name]').forEach(function (el) {
      const r = lineAt(state.spec_lines, Number(el.getAttribute('data-spec-name')));
      if (r) r.spec_name = el.value;
    });
    document.querySelectorAll('[data-spec-unit]').forEach(function (el) {
      const r = lineAt(state.spec_lines, Number(el.getAttribute('data-spec-unit')));
      if (r) r.spec_unit = el.value;
    });
    document.querySelectorAll('[data-spec-qty]').forEach(function (el) {
      const r = lineAt(state.spec_lines, Number(el.getAttribute('data-spec-qty')));
      if (r) r.spec_qty = el.value;
    });
    document.querySelectorAll('[data-spec-price]').forEach(function (el) {
      const r = lineAt(state.spec_lines, Number(el.getAttribute('data-spec-price')));
      if (r) r.spec_unit_price = normalizeUnitPriceVal(el.value);
    });
    document.querySelectorAll('[data-spec-note]').forEach(function (el) {
      const r = lineAt(state.spec_lines, Number(el.getAttribute('data-spec-note')));
      if (r) r.spec_note = el.value;
    });

    document.querySelectorAll('[data-cost-wcd]').forEach(function (el) {
      syncCostLineFieldFromInput(el, 'data-cost-wcd', 'cost_work_type_code');
    });
    document.querySelectorAll('[data-cost-wt]').forEach(function (el) {
      syncCostLineFieldFromInput(el, 'data-cost-wt', 'cost_work_type');
    });
    document.querySelectorAll('[data-cost-ccd]').forEach(function (el) {
      syncCostLineFieldFromInput(el, 'data-cost-ccd', 'cost_category_code');
    });
    document.querySelectorAll('[data-cost-cat]').forEach(function (el) {
      syncCostLineFieldFromInput(el, 'data-cost-cat', 'cost_category');
    });
    document.querySelectorAll('[data-cost-kind]').forEach(function (el) {
      const r = lineAt(state.cost_lines, Number(el.getAttribute('data-cost-kind')));
      if (r) r.cost_row_kind = el.value;
    });
    document.querySelectorAll('[data-cost-tax]').forEach(function (el) {
      const r = lineAt(state.cost_lines, Number(el.getAttribute('data-cost-tax')));
      if (r) r.cost_tax_rate = el.value;
    });
    document.querySelectorAll('[data-cost-unit]').forEach(function (el) {
      const r = lineAt(state.cost_lines, Number(el.getAttribute('data-cost-unit')));
      if (r) r.cost_unit = el.value;
    });
    document.querySelectorAll('[data-cost-qty]').forEach(function (el) {
      const i = Number(el.getAttribute('data-cost-qty'));
      const r = lineAt(state.cost_lines, i);
      if (!r) return;
      r.cost_qty = el.value;
      if (r.cost_row_kind === '明細') {
        r.cost_amount = parseNumInput(el.value) * parseNumInput(r.cost_unit_price);
      }
    });
    document.querySelectorAll('[data-cost-price]').forEach(function (el) {
      const i = Number(el.getAttribute('data-cost-price'));
      const r = lineAt(state.cost_lines, i);
      if (!r) return;
      r.cost_unit_price = normalizeUnitPriceVal(el.value);
      if (r.cost_row_kind === '明細') {
        r.cost_amount = parseNumInput(r.cost_qty) * parseNumInput(el.value);
      }
    });
    document.querySelectorAll('[data-cost-note]').forEach(function (el) {
      const r = lineAt(state.cost_lines, Number(el.getAttribute('data-cost-note')));
      if (r) r.cost_basis_note = el.value;
    });

    document.querySelectorAll('[data-mat-vendor]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-vendor')));
      if (r) r.mat_vendor = el.value;
    });
    document.querySelectorAll('[data-mat-name]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-name')));
      if (r) r.mat_name = el.value;
    });
    document.querySelectorAll('[data-mat-cap]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-cap')));
      if (r) r.mat_capacity = el.value;
    });
    document.querySelectorAll('[data-mat-maker]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-maker')));
      if (r) r.mat_maker = el.value;
    });
    document.querySelectorAll('[data-mat-qty]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-qty')));
      if (r) r.mat_qty = el.value;
    });
    document.querySelectorAll('[data-mat-price]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-price')));
      if (r) r.mat_unit_price = normalizeUnitPriceVal(el.value);
    });
    document.querySelectorAll('[data-mat-grp]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-grp')));
      if (r) r.mat_group = el.value;
    });
    document.querySelectorAll('[data-mat-basis]').forEach(function (el) {
      const r = lineAt(state.mat_lines, Number(el.getAttribute('data-mat-basis')));
      if (r) r.mat_basis = el.value;
    });

    document.querySelectorAll('[data-sub-vendor]').forEach(function (el) {
      const r = lineAt(state.subcontract_lines, Number(el.getAttribute('data-sub-vendor')));
      if (r) r.sub_vendor = el.value;
    });
    document.querySelectorAll('[data-sub-qty]').forEach(function (el) {
      const i = Number(el.getAttribute('data-sub-qty'));
      const r = lineAt(state.subcontract_lines, i);
      if (!r) return;
      r.sub_qty = el.value;
      r.sub_amount = parseNumInput(el.value) * parseNumInput(r.sub_unit_price);
    });
    document.querySelectorAll('[data-sub-price]').forEach(function (el) {
      const i = Number(el.getAttribute('data-sub-price'));
      const r = lineAt(state.subcontract_lines, i);
      if (!r) return;
      r.sub_unit_price = normalizeUnitPriceVal(el.value);
      r.sub_amount = parseNumInput(r.sub_qty) * parseNumInput(el.value);
    });
    document.querySelectorAll('[data-sub-unit]').forEach(function (el) {
      const r = lineAt(state.subcontract_lines, Number(el.getAttribute('data-sub-unit')));
      if (r) r.sub_unit = el.value;
    });
    document.querySelectorAll('[data-sub-basis]').forEach(function (el) {
      const r = lineAt(state.subcontract_lines, Number(el.getAttribute('data-sub-basis')));
      if (r) r.sub_basis = el.value;
    });
    document.querySelectorAll('[data-sub-type]').forEach(function (el) {
      const r = lineAt(state.subcontract_lines, Number(el.getAttribute('data-sub-type')));
      if (r) r.sub_line_type = el.value;
    });
  }

  function saveRecord(options) {
    if (readOnly) return;
    const opts = options || {};
    syncInputs();
    ensureSaveMetadata(state);
    if (!state.project_code || !String(state.project_code).trim()) {
      alert('工事コードを入力してください');
      return;
    }
    if (!validatePersonNameField('作成者', state.created_by_name)) return;
    if (!validatePersonNameField('担当者', state.person_in_charge_name)) return;
    const record = stateToKintone(state);
    const appId = kintone.app.getId();
    const req = state.recordId
      ? { app: appId, id: state.recordId, record: record, revision: state.revision }
      : { app: appId, record: record };
    const method = state.recordId ? 'PUT' : 'POST';
    kintone.api(kintone.api.url('/k/v1/record.json', true), method, req).then(function (resp) {
      dirty = false;
      state.recordId = state.recordId || String(resp.id);
      if (resp.revision) state.revision = String(resp.revision);
      const msg = opts.isConfirm
        ? '初版を確定しました (ID: ' + state.recordId + ')'
        : (state.status === '下書き'
          ? '一時保存しました (ID: ' + state.recordId + ')'
          : '保存しました (ID: ' + state.recordId + ')');
      alert(msg);
      uiScreen = 'list';
      refreshList().then(render);
    }).catch(function (e) {
      alert('保存エラー: ' + (e.message || e));
    });
  }

  function refreshList() {
    const appId = kintone.app.getId();
    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
      app: appId,
      query: 'order by $id desc limit 100',
      fields: ['$id', 'project_code', 'project_name', 'version_type', 'draft_date', FC.created_datetime, FC.updated_datetime, 'status', 'contract_total_1', 'profit_9'],
    }).then(function (resp) {
      listRowsAll = (resp.records || []).map(function (rec) {
        const id = rec.$id && rec.$id.value != null ? String(rec.$id.value) : '';
        if (!id) return null;
        return {
          id: id,
          project_code: gv(rec, 'project_code'),
          project_name: gv(rec, 'project_name'),
          version_type: gv(rec, 'version_type'),
          draft_date: String(gv(rec, 'draft_date')).slice(0, 10),
          created_at: kintoneDatetimeToJstYmd(gv(rec, FC.created_datetime)),
          updated_at: kintoneDatetimeToJstYmd(gv(rec, FC.updated_datetime)),
          status: gv(rec, 'status'),
          contract_total_1: num(gv(rec, 'contract_total_1')),
          profit_9: num(gv(rec, 'profit_9')),
        };
      }).filter(function (r) { return r != null; });
      applyListFilter();
    }).catch(function (e) {
      console.error(BUILD, 'refreshList', e);
      listRowsAll = [];
      listRows = [];
      alert('一覧取得エラー: ' + (e.message || JSON.stringify(e)));
    });
  }

  function openRecord(id) {
    const appId = kintone.app.getId();
    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', { app: appId, id: id }).then(function (resp) {
      return loadMaster().then(function () {
        state = stateFromKintone(resp.record);
        readOnly = false;
        dirty = false;
        uiScreen = 'form';
        activeTab = 'summary';
        render();
      });
    }).catch(function (e) {
      alert('読込エラー: ' + (e.message || e));
    });
  }

  function mountRoot(el) {
    injectCss();
    let host = document.getElementById('jy-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'jy-root';
      host.className = 'jy-root';
      el.appendChild(host);
    }
    return loadMaster().then(function () {
      render();
    });
  }

  function mountIndex() {
    const header = kintone.app.getHeaderSpaceElement();
    if (!header) return;
    header.innerHTML = '';
    uiScreen = 'list';
    readOnly = false;
    dirty = false;
    refreshList().then(function () {
      return mountRoot(header);
    });
  }

  function mountFormHost(readOnlyMode) {
    readOnly = !!readOnlyMode;
    uiScreen = 'form';
    const form = document.querySelector('.record-edit-gaia') || document.querySelector('.record-detail-gaia') || document.querySelector('.layout-gaia');
    let host = document.getElementById('jy-host');
    if (!form) return mountRoot(kintone.app.record.getHeaderMenuSpaceElement());
    if (!host) {
      host = document.createElement('div');
      host.id = 'jy-host';
      form.insertBefore(host, form.firstChild);
    }
    return mountRoot(host);
  }

  kintone.events.on('app.record.index.show', function (ev) {
    mountIndex();
    return ev;
  });

  kintone.events.on('app.record.create.show', function (ev) {
    state = newDraftState();
    dirty = false;
    readOnly = false;
    uiScreen = 'form';
    mountFormHost(false);
    return ev;
  });

  kintone.events.on('app.record.edit.show', function (ev) {
    state = stateFromKintone(ev.record);
    dirty = false;
    readOnly = false;
    uiScreen = 'form';
    mountFormHost(false);
    return ev;
  });

  kintone.events.on('app.record.detail.show', function (ev) {
    state = stateFromKintone(ev.record);
    dirty = false;
    readOnly = true;
    uiScreen = 'form';
    mountFormHost(true);
    return ev;
  });

})();
