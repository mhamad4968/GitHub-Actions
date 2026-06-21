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
export const EXCEL_SUBTOTAL_GROUP_KEYS = new Set([
  'material',
  'manager_wage',
  'manager_wage_ins',
  'line_close',
  'train_watch',
  'traffic',
  'rental',
]);

export const COST_GROUP_STARTERS = {
  材料費: 'material',
  工事管理者賃金: 'manager_wage',
  '工事管理者（保）賃金': 'manager_wage_ins',
  線閉責任者: 'line_close',
  列車見張員: 'train_watch',
  交通整理員等: 'traffic',
  レンタル: 'rental',
};

/** 小計行の計算基準・備考表示（例: 材料費合計） */
export const COST_GROUP_LABELS = {
  material: '材料費',
  manager_wage: '工事管理者賃金',
  manager_wage_ins: '工事管理者（保）賃金',
  line_close: '線閉責任者',
  train_watch: '列車見張員',
  traffic: '交通整理員等',
  rental: 'レンタル',
};

export function costGroupSubtotalNote(groupKey) {
  const key = String(groupKey || '').trim();
  const label = COST_GROUP_LABELS[key];
  if (label) return label + '合計';
  const wtMatch = key.match(/^wt:(.+)$/);
  if (wtMatch) return wtMatch[1] + '合計';
  return '合計';
}

export function isCountableCostRow(r) {
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
export function syncWorkTypeSubtotalRows(lines) {
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

export function isSubtotalGroupKey(key) {
  return EXCEL_SUBTOTAL_GROUP_KEYS.has(String(key || ''));
}

export function isSubtotalRow(r) {
  if (!r) return false;
  return (
    r.cost_row_kind === 'subtotal'
    || r.cost_row_kind === '小計'
    || String(r.cost_work_type || '').trim() === '計'
  );
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
export function assignCostBorderRoles(lines) {
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

export function costBorderCssClass(role) {
  if (!role) return 'jy-cost-standalone';
  return 'jy-cost-' + String(role).replace(/_/g, '-');
}
