  /** PH1c — 行並び替え（許可ゾーン方式）· 2026-07-10 */
  const REORDER_LINK_MARKERS_AB = new Set(['②', '③']);
  const REORDER_LINK_MARKERS_B = new Set(['④', '⑤', '⑥', '⑦']);
  const REORDER_SUB_CALC = new Set(['overhead', 'block_total', 'legal_welfare', 'order_amount', 'labor_total', 'insurance']);
  let rowMoveState = null;

  function reorderNorm(s) {
    return String(s == null ? '' : s).trim();
  }

  function reorderTableLines(table, st) {
    if (table === 'spec') return st.spec_lines;
    if (table === 'cost') return st.cost_lines;
    if (table === 'mat') return st.mat_lines;
    if (table === 'sub') return st.subcontract_lines;
    return [];
  }

  function reorderIsSubCalc(r) {
    return !!(r && (REORDER_SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead'));
  }

  function costHasSubtotalGroup(gk) {
    return !!(gk && typeof EXCEL_SUBTOTAL_GROUP_KEYS !== 'undefined' && EXCEL_SUBTOTAL_GROUP_KEYS.has(gk));
  }

  function reorderZoneCost(lines, i) {
    const r = lines[i];
    if (!r || r.cost_row_kind === '小計') return null;
    const mk = reorderNorm(r.detail_marker);
    if (r.cost_row_kind === '連携' && REORDER_LINK_MARKERS_AB.has(mk)) return 'cost:mat-ab';
    if (r.cost_row_kind === '連携' && REORDER_LINK_MARKERS_B.has(mk)) return 'cost:sub-link-b';
    if (r.cost_row_kind === '明細' && costHasSubtotalGroup(r.cost_group_key)) {
      return 'cost:grp:' + r.cost_group_key;
    }
    if (r.cost_row_kind === '明細') return 'cost:standalone';
    return null;
  }

  function reorderZoneId(table, idx, st) {
    const lines = reorderTableLines(table, st);
    const r = lines[idx];
    if (!r) return null;
    if (table === 'spec') return 'spec:all';
    if (table === 'cost') return reorderZoneCost(lines, idx);
    if (table === 'mat') {
      const g = reorderNorm(r.mat_group);
      return g ? 'mat:' + g : null;
    }
    if (table === 'sub') {
      if (r.sub_row_kind === 'vendor' || reorderIsSubCalc(r)) return null;
      if (reorderNorm(r.sub_row_kind) !== 'detail') return null;
      const b = reorderNorm(r.subcontract_block);
      return b ? 'sub:' + b : null;
    }
    return null;
  }

  function canReorderRow(table, idx, st) {
    if (readOnly) return false;
    if (reorderZoneId(table, idx, st) == null) return false;
    return reorderDestinations(table, idx, st).length > 0;
  }

  function reorderZoneIndices(table, zoneId, st) {
    const lines = reorderTableLines(table, st);
    const out = [];
    for (let i = 0; i < lines.length; i += 1) {
      if (reorderZoneId(table, i, st) === zoneId) out.push(i);
    }
    return out;
  }

  function reorderRowLabel(table, r, idx) {
    let text = '';
    if (table === 'spec') text = reorderNorm(r.spec_name) || '（名称なし）';
    else if (table === 'cost') {
      text = [reorderNorm(r.cost_work_type), reorderNorm(r.cost_category)].filter(Boolean).join(' / ') || '原価行';
    } else if (table === 'mat') text = reorderNorm(r.mat_name) || reorderNorm(r.mat_vendor) || '材料行';
    else if (table === 'sub') text = reorderNorm(r.sub_line_type) || reorderNorm(r.sub_vendor) || '外注行';
    if (text.length > 20) text = text.slice(0, 20) + '…';
    return (idx + 1) + '行目: ' + text;
  }

  function reorderDestinations(table, fromIdx, st) {
    const zoneId = reorderZoneId(table, fromIdx, st);
    if (!zoneId) return [];
    const lines = reorderTableLines(table, st);
    const indices = reorderZoneIndices(table, zoneId, st);
    const dests = [];
    const first = indices[0];
    if (first != null && first !== fromIdx) {
      dests.push({ mode: 'top', refIdx: first, label: '一番上' });
    }
    indices.forEach(function (idx) {
      if (idx === fromIdx) return;
      const lbl = reorderRowLabel(table, lines[idx], idx);
      dests.push({ mode: 'before', refIdx: idx, label: lbl + 'の上' });
      dests.push({ mode: 'after', refIdx: idx, label: lbl + 'の下' });
    });
    return dests;
  }

  function reorderInsertIndex(fromIdx, mode, refIdx) {
    if (mode === 'top') return refIdx;
    if (mode === 'before') return fromIdx < refIdx ? refIdx - 1 : refIdx;
    if (mode === 'after') return fromIdx < refIdx ? refIdx : refIdx + 1;
    return refIdx;
  }

  function executeRowMove(table, fromIdx, mode, refIdx, st) {
    const arr = reorderTableLines(table, st);
    if (!arr || fromIdx < 0 || fromIdx >= arr.length) return false;
    const zoneId = reorderZoneId(table, fromIdx, st);
    if (!zoneId || reorderZoneId(table, refIdx, st) !== zoneId) return false;
    if (mode !== 'top' && refIdx < 0) return false;
    const row = arr.splice(fromIdx, 1)[0];
    const insertAt = reorderInsertIndex(fromIdx, mode, refIdx);
    arr.splice(insertAt, 0, row);
    return true;
  }

  function clearRowMoveState() {
    rowMoveState = null;
  }

  function isRowMoveSource(table, idx) {
    return !!(rowMoveState && rowMoveState.table === table && rowMoveState.from === idx);
  }

  function renderRowMoveDestMenu(table, fromIdx, st) {
    const dests = reorderDestinations(table, fromIdx, st);
    let html = '<div class="jy-row-move-dest" role="menu">';
    html += '<div class="jy-row-move-dest-title">移動先を選択</div>';
    dests.forEach(function (d, di) {
      html += '<button type="button" role="menuitem" class="jy-row-move-dest-btn" data-' + table + '-move-dest="' +
        fromIdx + ':' + d.mode + ':' + d.refIdx + '">' + esc(d.label) + '</button>';
    });
    html += '<button type="button" role="menuitem" class="jy-row-move-cancel" data-' + table + '-move-cancel="1">キャンセル</button>';
    html += '</div>';
    return html;
  }
