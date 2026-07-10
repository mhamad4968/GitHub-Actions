/**

 * 実行予算書 — 差分検出コア（v2c プレビュー）

 * 行突合は構造キー（位置＋工種等）優先。row_key は補助。

 * 連携行・小計は cascade（自動反映）として直接編集と区別。

 */



function normStr(v) {

  return String(v == null ? '' : v).trim();

}



function numVal(v) {

  if (v === '' || v == null) return 0;

  const n = Number(v);

  return Number.isFinite(n) ? n : 0;

}



const AMOUNT_FIELDS = new Set([

  'spec_amount', 'spec_qty', 'spec_unit_price',

  'cost_amount', 'cost_qty', 'cost_unit_price',

  'mat_amount', 'mat_qty', 'mat_unit_price',

  'sub_amount', 'sub_qty', 'sub_unit_price',

  'contract_total_1', 'cost_total_8', 'profit_9', 'profit_rate',

  'mat_total_2', 'mat_total_3',

]);



const DERIVED_COST_KINDS = new Set(['連携', '小計']);

const DERIVED_SUB_KINDS = new Set(['overhead', 'block_total', 'legal_welfare', 'order_amount', 'labor_total']);

const CASCADE_TOTAL_FIELDS = new Set(['mat_total_2', 'mat_total_3', 'cost_total_8', 'profit_9', 'profit_rate']);

const IMPACT_TOTAL_FIELDS = new Set(['cost_total_8', 'profit_9', 'profit_rate']);



function valuesEqual(a, b, field) {

  if (field === 'profit_rate') return Math.abs(numVal(a) - numVal(b)) < 1e-9;

  if (AMOUNT_FIELDS.has(field)) return numVal(a) === numVal(b);

  return normStr(a) === normStr(b);

}



function amountCellDiff(oldVal, newVal) {

  const o = numVal(oldVal);

  const n = numVal(newVal);

  if (n === o) return null;

  if (n > o) return { kind: 'up', delta: n - o };

  return { kind: 'down', delta: n - o };

}



function rowLabel(table, r) {

  if (table === 'spec') return normStr(r.spec_name) || '（名称なし）';

  if (table === 'cost') {

    const wt = normStr(r.cost_work_type);

    const cat = normStr(r.cost_category);

    const kind = normStr(r.cost_row_kind);

    if (kind === '小計') return (wt || cat || '小計') + ' 小計';

    if (kind === '連携') {

      const mk = normStr(r.detail_marker);

      return (cat || wt || '連携') + (mk ? ' (' + mk + ')' : '');

    }

    return [wt, cat].filter(Boolean).join(' / ') || '原価行';

  }

  if (table === 'mat') return normStr(r.mat_name) || normStr(r.mat_vendor) || '材料行';

  if (table === 'sub') {

    return [normStr(r.subcontract_block), normStr(r.sub_vendor), normStr(r.sub_line_type)]

      .filter(Boolean).join(' / ') || '外注行';

  }

  return '';

}



function isCascadeRowChange(table, r, cells) {

  const keys = Object.keys(cells || {});

  if (!keys.length) return false;

  if (table === 'cost' && DERIVED_COST_KINDS.has(normStr(r.cost_row_kind))) {

    return keys.every(function (f) { return f === 'cost_amount'; });

  }

  if (table === 'sub' && DERIVED_SUB_KINDS.has(normStr(r.sub_row_kind))) {

    return keys.every(function (f) { return f === 'sub_amount'; });

  }

  if (table === 'spec') {

    return keys.length === 1 && keys[0] === 'spec_amount';

  }

  if (table === 'mat') {

    return keys.length === 1 && keys[0] === 'mat_amount';

  }

  return false;

}



/** 差分突合用の意味キー（行位置に依存しない） */
function semanticCostRowKey(r) {
  const kind = normStr(r.cost_row_kind);
  if (kind === '小計') {
    return 'cost:sub:' + normStr(r.cost_group_key);
  }
  if (kind === '連携') {
    return 'cost:link:' + normStr(r.detail_marker);
  }
  return 'cost:detail:' + normStr(r.cost_work_type_code) + ':' +
    normStr(r.cost_category_code) + ':' + normStr(r.cost_work_type) + ':' + normStr(r.cost_category);
}

/** 旧テンプレ「（昼・夜）」1行 → 昼・夜2行（差分比較前に両側へ適用） */
function migrateDayNightCostLinesForDiff(lines) {
  const out = [];
  (lines || []).forEach(function (r) {
    const cat = normStr(r.cost_category);
    if (cat === '重機誘導員（昼・夜）') {
      out.push(Object.assign({}, r, { cost_category: '重機誘導員（昼）' }));
      out.push(Object.assign({}, r, {
        row_key: '',
        cost_category: '重機誘導員（夜）',
        cost_qty: '',
        cost_unit_price: '',
        cost_amount: 0,
        cost_basis_note: '',
        detail_marker: '',
      }));
      return;
    }
    if (cat === '検電接地等（昼・夜）') {
      out.push(Object.assign({}, r, { cost_category: '検電接地等（昼）' }));
      out.push(Object.assign({}, r, {
        row_key: '',
        cost_category: '検電接地等（夜）',
        cost_qty: '',
        cost_unit_price: '',
        cost_amount: 0,
        cost_basis_note: '',
        detail_marker: '',
      }));
      return;
    }
    out.push(r);
  });
  return out;
}

function normalizeCostLinesForDiff(lines) {
  return migrateDayNightCostLinesForDiff(lines || []);
}

/** 差分突合用の安定キー（index ＋ 行の意味）。UI ハイライトも同じキーを使う */

export function structuralRowKey(table, r, index) {

  const i = Number(index) || 0;

  if (table === 'spec') {

    return 'spec:' + i + ':' + normStr(r.spec_name);

  }

  if (table === 'cost') {

    const kind = normStr(r.cost_row_kind);

    if (kind === '小計') {

      return 'cost:sub:' + i + ':' + normStr(r.cost_group_key) + ':' + normStr(r.cost_basis_note);

    }

    if (kind === '連携') {

      return 'cost:link:' + i + ':' + normStr(r.detail_marker) + ':' +

        normStr(r.cost_work_type_code) + ':' + normStr(r.cost_category_code) + ':' + normStr(r.cost_category);

    }

    return 'cost:detail:' + i + ':' + normStr(r.cost_work_type_code) + ':' +

      normStr(r.cost_category_code) + ':' + normStr(r.cost_work_type) + ':' + normStr(r.cost_category);

  }

  if (table === 'mat') {

    return 'mat:' + i + ':' + normStr(r.mat_group) + ':' + normStr(r.mat_name) + ':' + normStr(r.mat_vendor);

  }

  if (table === 'sub') {

    return 'sub:' + i + ':' + normStr(r.subcontract_block) + ':' + normStr(r.sub_row_kind) + ':' +

      normStr(r.sub_line_type) + ':' + normStr(r.sub_vendor);

  }

  return table + ':' + i;

}



function pairTableRows(baseRows, curRows, table) {

  const base = baseRows || [];

  const cur = curRows || [];

  const baseUsed = new Array(base.length).fill(false);

  const curUsed = new Array(cur.length).fill(false);

  const pairs = [];



  function tryPair(matchFn) {

    for (let ci = 0; ci < cur.length; ci += 1) {

      if (curUsed[ci]) continue;

      for (let bi = 0; bi < base.length; bi += 1) {

        if (baseUsed[bi]) continue;

        if (!matchFn(bi, ci)) continue;

        pairs.push({

          key: structuralRowKey(table, cur[ci], ci),

          base: base[bi],

          cur: cur[ci],

          baseIndex: bi,

          curIndex: ci,

        });

        baseUsed[bi] = true;

        curUsed[ci] = true;

        break;

      }

    }

  }



  // 1) row_key 一致（修正版複製で引き継いだ UUID）

  tryPair(function (bi, ci) {

    const bk = normStr(base[bi].row_key);

    const ck = normStr(cur[ci].row_key);

    return bk.length >= 8 && ck.length >= 8 && bk === ck;

  });



  // 2) 原価行: 意味キー一致（位置ずれ・小計再生成に強い）

  if (table === 'cost') {

    tryPair(function (bi, ci) {

      return semanticCostRowKey(base[bi]) === semanticCostRowKey(cur[ci]);

    });

  }



  // 3) 同じ行番号かつ構造キー一致

  tryPair(function (bi, ci) {

    return bi === ci && structuralRowKey(table, base[bi], bi) === structuralRowKey(table, cur[ci], ci);

  });



  // 4) 構造キーのみ一致

  tryPair(function (bi, ci) {

    return structuralRowKey(table, base[bi], bi) === structuralRowKey(table, cur[ci], ci);

  });



  // 5) 行数が同じなら同じ行番号で突合（レイアウト不変の修正版向け）

  if (base.length === cur.length) {

    tryPair(function (bi, ci) {

      return bi === ci;

    });

  }



  const removed = [];

  const added = [];

  for (let bi = 0; bi < base.length; bi += 1) {

    if (!baseUsed[bi]) {

      removed.push({

        key: structuralRowKey(table, base[bi], bi),

        row: base[bi],

        label: rowLabel(table, base[bi]),

      });

    }

  }

  for (let ci = 0; ci < cur.length; ci += 1) {

    if (!curUsed[ci]) {

      added.push({

        key: structuralRowKey(table, cur[ci], ci),

        row: cur[ci],

        label: rowLabel(table, cur[ci]),

      });

    }

  }



  return { pairs: pairs, removed: removed, added: added };

}



function diffTableRows(baseRows, curRows, fields, table) {

  const paired = pairTableRows(baseRows, curRows, table);

  const rows = {};



  paired.pairs.forEach(function (p) {

    const cells = {};

    fields.forEach(function (f) {

      if (!valuesEqual(p.base[f], p.cur[f], f)) {

        cells[f] = AMOUNT_FIELDS.has(f) ? amountCellDiff(p.base[f], p.cur[f]) : { kind: 'chg' };

      }

    });

    if (Object.keys(cells).length) {

      const status = isCascadeRowChange(table, p.cur, cells) ? 'cascade' : 'changed';

      rows[p.key] = { status: status, cells: cells, label: rowLabel(table, p.cur) };

    } else if (

      p.baseIndex != null && p.curIndex != null && p.baseIndex !== p.curIndex &&

      normStr(p.base.row_key).length >= 8 && normStr(p.base.row_key) === normStr(p.cur.row_key)

    ) {

      rows[p.key] = { status: 'moved', cells: {}, label: rowLabel(table, p.cur) };

    }

  });



  paired.added.forEach(function (item) {

    rows[item.key] = { status: 'added', cells: {}, label: item.label };

  });



  return { rows: rows, removed: paired.removed };

}



function diffScalars(base, cur, fields) {

  const cells = {};

  fields.forEach(function (f) {

    if (!valuesEqual(base[f], cur[f], f)) {

      cells[f] = AMOUNT_FIELDS.has(f) ? amountCellDiff(base[f], cur[f]) : { kind: 'chg' };

    }

  });

  return cells;

}



export function computeBudgetDiff(base, cur) {

  if (!base || !cur) return null;

  const baseCost = normalizeCostLinesForDiff(base.cost_lines);
  const curCost = normalizeCostLinesForDiff(cur.cost_lines);

  return {

    totals: diffScalars(base, cur, ['contract_total_1', 'cost_total_8', 'profit_9', 'profit_rate', 'mat_total_2', 'mat_total_3']),

    spec: diffTableRows(base.spec_lines, cur.spec_lines,

      ['spec_name', 'spec_category', 'spec_unit', 'spec_qty', 'spec_unit_price', 'spec_amount', 'spec_note'], 'spec'),

    cost: diffTableRows(baseCost, curCost,

      ['cost_work_type_code', 'cost_work_type', 'cost_category_code', 'cost_category', 'cost_budget_category', 'cost_row_kind',

        'cost_tax_rate', 'cost_unit', 'cost_qty', 'cost_unit_price', 'cost_amount', 'cost_basis_note'], 'cost'),

    mat: diffTableRows(base.mat_lines, cur.mat_lines,

      ['mat_vendor', 'mat_name', 'mat_capacity', 'mat_maker', 'mat_qty', 'mat_unit_price', 'mat_amount', 'mat_group', 'mat_basis'], 'mat'),

    sub: diffTableRows(base.subcontract_lines, cur.subcontract_lines,

      ['sub_vendor', 'sub_line_type', 'sub_unit', 'sub_qty', 'sub_unit_price', 'sub_amount', 'sub_basis'], 'sub'),

  };

}



function pushTotalEntry(list, field, label, info, bucket) {

  if (!info) return;

  list.push({

    field: field,

    label: label,

    kind: typeof info === 'string' ? info : info.kind,

    delta: info && info.delta != null ? info.delta : null,

    bucket: bucket,

  });

}



export function buildDiffSummary(diff) {

  if (!diff) return { direct: [], cascade: [], impact: [], hasChanges: false };

  const TOTAL_LABELS = {

    contract_total_1: '① 仕様合計',

    cost_total_8: '⑧ 工事原価額',

    profit_9: '⑨ 粗利',

    profit_rate: '⑨ 粗利率',

    mat_total_2: '② 塗料合計',

    mat_total_3: '③ その他材料合計',

  };



  const direct = [];

  const cascade = [];

  const impact = [];

  Object.keys(TOTAL_LABELS).forEach(function (f) {

    const info = diff.totals[f];

    if (!info) return;

    if (IMPACT_TOTAL_FIELDS.has(f)) pushTotalEntry(impact, f, TOTAL_LABELS[f], info, 'impact');

    else if (CASCADE_TOTAL_FIELDS.has(f)) pushTotalEntry(cascade, f, TOTAL_LABELS[f], info, 'cascade');

    else pushTotalEntry(direct, f, TOTAL_LABELS[f], info, 'direct');

  });



  const TABLE_LABELS = { spec: '仕様明細', cost: '原価行', mat: '材料明細', sub: '外注明細' };

  ['spec', 'cost', 'mat', 'sub'].forEach(function (table) {

    const t = diff[table];

    if (!t) return;

    const directRow = { table: table, label: TABLE_LABELS[table], added: [], changed: [], removed: [] };

    const cascadeRow = { table: table, label: TABLE_LABELS[table], changed: [] };

    Object.keys(t.rows || {}).forEach(function (key) {

      const info = t.rows[key];

      if (!info) return;

      if (info.status === 'added') directRow.added.push(info.label || key);

      else if (info.status === 'changed') directRow.changed.push(info.label || key);

      else if (info.status === 'cascade') cascadeRow.changed.push(info.label || key);

    });

    directRow.removed = (t.removed || []).map(function (item) { return item.label || item.key; });

    if (directRow.added.length || directRow.changed.length || directRow.removed.length) {

      direct.push(directRow);

    }

    if (cascadeRow.changed.length) {

      if (table === 'cost' && cascadeRow.changed.length >= 2) {

        cascade.push({

          grouped: true,

          label: '総括表連携・小計',

          count: cascadeRow.changed.length,

          changed: cascadeRow.changed,

        });

      } else if (table === 'sub' && cascadeRow.changed.length >= 2) {

        cascade.push({

          grouped: true,

          label: '外注の自動計算行',

          count: cascadeRow.changed.length,

          changed: cascadeRow.changed,

        });

      } else {

        cascade.push(cascadeRow);

      }

    }

  });



  const hasChanges = direct.length > 0 || cascade.length > 0 || impact.length > 0;

  return { direct: direct, cascade: cascade, impact: impact, hasChanges: hasChanges };

}



export function rowKeyForTable(table, r, index) {

  return structuralRowKey(table, r, index);

}



export function diffKind(info) {

  if (!info) return '';

  return typeof info === 'string' ? info : (info.kind || '');

}


