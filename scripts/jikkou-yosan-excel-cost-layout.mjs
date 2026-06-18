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
  const label = COST_GROUP_LABELS[String(groupKey || '').trim()];
  return label ? label + '合計' : '合計';
}

export function isSubtotalGroupKey(key) {
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
export function assignCostBorderRoles(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    const r = lines[i];
    if (r.excel_border_role) continue;

    if (isSubtotalRow(r)) {
      r.excel_border_role = 'group_subtotal';
      continue;
    }

    const gk = r.cost_group_key;
    if (gk && isSubtotalGroupKey(gk)) {
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
