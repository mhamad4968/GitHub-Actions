  const FC = {
    version_type: 'version_type',
    site_entry_date: 'site_entry_date',
    draft_date: 'draft_date',
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
  };

  const KIND_TO_CALC = { 明細: 'detail', 小計: 'subtotal', 見出し: 'group_header', 連携: 'link' };
  const KIND_FROM_CALC = { detail: '明細', subtotal: '小計', group_header: '見出し', link: '連携' };
  const ROW_KIND_OPTS = ['明細', '小計', '見出し', '連携'];
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
  /** 総括表の工種名 → コード表 M の work_type_name */
  const WORK_TYPE_TO_MASTER = {
    '修繕工事': '（塗）修繕等工事',
    '塗装附帯工事': '（塗）塗装付帯工事',
  };
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
    labor: ['労務費', '合計'],
  };

  let masterCache = null;
  let state = emptyState();
  let activeTab = 'summary';
  let dirty = false;
  let readOnly = false;
  let uiScreen = 'list';
  let headerOpen = true;
  let listRows = [];
  let pendingScrollTargetId = null;

  function emptyState() {
    return {
      recordId: null,
      revision: null,
      version_type: '当初',
      site_entry_date: '',
      draft_date: '',
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
    return Number(n).toLocaleString('ja-JP');
  }

  function fmtPct(n) {
    if (n == null || Number.isNaN(n)) return '';
    return (Number(n) * 100).toFixed(2) + '%';
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
    root.querySelectorAll('.jy-bar').forEach(function (bar) { o += bar.offsetHeight + 6; });
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
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.setTimeout(function () { tryScroll(0); }, 80);
      });
    });
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
      '.jy-btn{padding:8px 16px;border:1px solid #94a3b8;border-radius:6px;background:#f8fafc;cursor:pointer;font-size:13px;font-weight:600}' +
      '.jy-btn-primary{background:#2563eb;color:#fff;border-color:#2563eb}' +
      '.jy-btn:disabled{opacity:.5;cursor:not-allowed}' +
      '.jy-dirty{padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;font-size:13px;margin-bottom:8px}' +
      '.jy-header-panel{border:1px solid #cbd5e1;border-radius:8px;margin-bottom:12px;background:#f8fafc}' +
      '.jy-header-panel summary{cursor:pointer;padding:10px 14px;font-weight:600;list-style:none}' +
      '.jy-header-grid{display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:8px 12px;padding:0 14px 14px}' +
      '.jy-header-grid label{display:block;font-size:11px;color:#475569;margin-bottom:2px}' +
      '.jy-header-grid input,.jy-header-grid select,.jy-header-grid textarea{width:100%;box-sizing:border-box;font-size:13px;padding:4px 6px}' +
      '.jy-tabs{display:flex;gap:4px;margin:10px 0 8px;flex-wrap:wrap}' +
      '.jy-tab{padding:8px 18px;cursor:pointer;border:1px solid #94a3b8;border-radius:6px 6px 0 0;background:#f1f5f9;font-size:13px;font-weight:600}' +
      '.jy-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}' +
      '.jy-tab-hint{font-size:12px;color:#64748b;margin:4px 0 10px}' +
      '.jy-pane{border:1px solid #cbd5e1;border-top:none;border-radius:0 0 8px 8px;padding:12px;background:#fff}' +
      '.jy-pane-title{font-size:14px;font-weight:700;margin:8px 0 6px;padding:4px 8px;background:#e8eef4;border-left:4px solid #2563eb}' +
      '.jy-excel-wrap{overflow:auto;border:1px solid #e2e8f0;margin-bottom:12px;background:#fff;border-radius:6px}' +
      '.jy-table{border-collapse:collapse;width:100%;font-size:12px}' +
      '.jy-table th,.jy-table td{border:1px solid #e2e8f0;padding:4px 6px;vertical-align:middle}' +
      '.jy-table th{background:#f1f5f9;text-align:center;font-weight:600;white-space:nowrap;color:#475569}' +
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
      '.jy-code{width:72px;text-align:right}' +
      '.jy-in{width:100%;box-sizing:border-box;font-size:12px;padding:2px 4px;border:1px solid #e2e8f0}' +
      '.jy-in:focus{border-color:#2563eb;outline:none}' +
      '.jy-ro{background:#f8fafc}' +
      '.jy-table tr.jy-cost-group-subtotal td.jy-ro,.jy-table tr.jy-subtotal td.jy-ro{background:transparent}' +
      '.jy-block{margin:8px 0;border:1px solid #cbd5e1;border-radius:6px;padding:6px 8px;background:#fff}' +
      '.jy-block summary{cursor:pointer;font-weight:600;padding:4px}' +
      '.jy-calc-row{background:#f3f4f6;font-weight:600}' +
      '.jy-list-table tbody tr{cursor:pointer}' +
      '.jy-list-table tbody tr:hover{background:#eff6ff}' +
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
      '.jy-ref-meta .jy-ref-link{font-size:11px}' +
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

  function refreshCostLineFieldInputs(i) {
    const wtEl = document.querySelector('[data-cost-wt="' + i + '"]');
    const wcdEl = document.querySelector('[data-cost-wcd="' + i + '"]');
    const catEl = document.querySelector('[data-cost-cat="' + i + '"]');
    const ccdEl = document.querySelector('[data-cost-ccd="' + i + '"]');
    const r = state.cost_lines[i];
    if (!r) return;
    if (wtEl) wtEl.value = r.cost_work_type || '';
    if (wcdEl) wcdEl.value = r.cost_work_type_code || '';
    if (catEl) catEl.value = r.cost_category || '';
    if (ccdEl) ccdEl.value = r.cost_category_code || '';
  }

  function bindCostLineFieldSync(root, attr, source) {
    root.querySelectorAll('[' + attr + ']').forEach(function (el) {
      el.addEventListener('change', function () {
        const i = Number(el.getAttribute(attr));
        syncInputs();
        syncCostLineFields(i, source);
        markDirty();
        refreshCostLineFieldInputs(i);
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
    const s = emptyState();
    s.version_type = '当初';
    s.draft_date = new Date().toISOString().slice(0, 10);
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
    s.project_code = String(gv(rec, FC.project_code));
    s.project_official_name = String(gv(rec, FC.project_official_name));
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
    if (!s.mat_lines.length) s.mat_lines = [{ mat_vendor: '', mat_name: '', mat_capacity: '', mat_maker: '', mat_qty: '', mat_unit_price: '', mat_amount: 0, mat_group: '塗料', mat_basis: '' }];
    if (!s.subcontract_lines.length) s.subcontract_lines = defaultSubcontractTemplate();
    return recalcState(s);
  }

  function recalcState(s) {
    applyCostLineCodesFromMaster(s);
    const calc = JSON.parse(JSON.stringify(s));
    calc.cost_lines.forEach(function (r) {
      r.cost_row_kind = KIND_TO_CALC[r.cost_row_kind] || r.cost_row_kind;
    });
    recalcAll(calc);
    calc.cost_lines.forEach(function (r, i) {
      s.cost_lines[i].cost_amount = r.cost_amount;
      s.cost_lines[i].cost_ratio = r.cost_ratio;
      s.cost_lines[i].cost_row_kind = KIND_FROM_CALC[r.cost_row_kind] || r.cost_row_kind;
      s.cost_lines[i].subtotal_display_amount = r.subtotal_display_amount;
      s.cost_lines[i].cost_work_type = r.cost_work_type;
      s.cost_lines[i].cost_group_key = r.cost_group_key;
      s.cost_lines[i].excel_border_role = r.excel_border_role;
      s.cost_lines[i].cost_basis_note = r.cost_basis_note;
    });
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

  function renderHeader() {
    const m = masterCache || { branches: [], departments: [], girderTypes: [] };
    return (
      '<details class="jy-header-panel"' + (headerOpen ? ' open' : '') + ' id="jy-header-panel">' +
      '<summary>ヘッダ（版種別・工事コード・発注者 等）</summary>' +
      '<div class="jy-header-grid">' +
      '<div><label>版種別</label><select id="jy-version"' + (readOnly ? ' disabled' : '') + '><option' + (state.version_type === '当初' ? ' selected' : '') + '>当初</option></select></div>' +
      '<div><label>現場入場予定日</label><input id="jy-site-entry" type="date" value="' + esc(state.site_entry_date) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>立案日</label><input id="jy-draft-date" type="date" value="' + esc(state.draft_date) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>ステータス</label><select id="jy-status"' + (readOnly ? ' disabled' : '') + '><option' + (state.status === '下書き' ? ' selected' : '') + '>下書き</option><option' + (state.status === '初版確定' ? ' selected' : '') + '>初版確定</option></select></div>' +
      '<div><label>工事コード *</label><input id="jy-project-code" value="' + esc(state.project_code) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>工事正式名称</label><input id="jy-project-official" value="' + esc(state.project_official_name) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>工事名称</label><input id="jy-project-name" value="' + esc(state.project_name) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>桁種別</label><select id="jy-girder"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.girderTypes, state.girder_type, true) + '</select></div>' +
      '<div><label>発注支社</label><select id="jy-branch"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.branches, state.order_branch, true) + '</select></div>' +
      '<div><label>部門</label><select id="jy-dept"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.departments, state.department, true) + '</select></div>' +
      '<div><label>発注者</label><input id="jy-client" value="' + esc(state.client_name) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>安衛則88条</label><select id="jy-safety"' + (readOnly ? ' disabled' : '') + '><option' + (state.safety_rule_88 === '有' ? ' selected' : '') + '>有</option><option' + (state.safety_rule_88 === '無' ? ' selected' : '') + '>無</option></select></div>' +
      '<div><label>着手日</label><input id="jy-start" type="date" value="' + esc(state.start_date) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div><label>竣工日</label><input id="jy-end" type="date" value="' + esc(state.end_date) + '"' + (readOnly ? ' disabled' : '') + '></div>' +
      '<div style="grid-column:span 2"><label>備考</label><textarea id="jy-note" rows="2"' + (readOnly ? ' disabled' : '') + '>' + esc(state.note) + '</textarea></div>' +
      '</div></details>'
    );
  }

  function renderSummary() {
    recalcState(state);
    const m = masterCache || { units: SPEC_UNITS };
    let html = '<div class="jy-pane-title">仕様明細（①）</div><div class="jy-excel-wrap jy-summary-wrap"><table class="jy-table jy-summary-table"><thead><tr><th>仕様</th><th>単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>備考</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>';
    state.spec_lines.forEach(function (r, i) {
      html += '<tr><td><input class="jy-in" data-spec-name="' + i + '" value="' + esc(r.spec_name) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      html += '<td><select class="jy-in" data-spec-unit="' + i + '"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.units.concat(SPEC_UNITS).filter(function (v, idx, a) { return a.indexOf(v) === idx; }), r.spec_unit, true) + '</select></td>';
      html += '<td><input class="jy-in jy-num" data-spec-qty="' + i + '" type="number" step="any" value="' + esc(r.spec_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in jy-num" data-spec-price="' + i + '" type="number" step="any" value="' + esc(r.spec_unit_price) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      html += '<td class="jy-num jy-ro">' + fmt(r.spec_amount) + '</td>';
      html += '<td><input class="jy-in" data-spec-note="' + i + '" value="' + esc(r.spec_note) + '"' + (readOnly ? ' disabled' : '') + '></td>';
      if (!readOnly) html += '<td><button type="button" class="jy-btn" data-spec-del="' + i + '" style="padding:2px 6px">×</button></td>';
      html += '</tr>';
    });
    html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="jy-sum-ref-1"><td colspan="' + (readOnly ? 6 : 7) + '"></td></tr>';
    html += '</tbody><tfoot><tr class="jy-foot-sum"><td colspan="4" class="jy-num">合計 …①</td><td class="jy-num">' + fmt(state.contract_total_1) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';
    if (!readOnly) html += '<button type="button" class="jy-btn" id="jy-spec-add">＋ 仕様行追加</button>';

    html += '<div class="jy-pane-title">原価行（②〜⑧）</div><div class="jy-excel-wrap jy-summary-wrap"><table class="jy-table jy-summary-table"><thead><tr>' +
      '<th>工種CD</th><th>システム入力工種</th><th>種別CD</th><th>種別</th><th>行種別</th><th>消費税</th><th>単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>計算基準・備考</th><th>詳細</th><th class="jy-num">率</th>' +
      (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>';
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
      const wtDisplay = isSub ? '' : (r.cost_work_type === '計' ? '' : (r.cost_work_type || ''));
      const subAmt = isSub ? (r.subtotal_display_amount != null ? r.subtotal_display_amount : r.cost_amount) : r.cost_amount;
      if (sumId) html += '<tr class="jy-sum-anchor-row jy-sec-anchor" id="' + sumId + '"><td colspan="' + costColSpan + '"></td></tr>';
      html += '<tr class="' + cls + '">';
      if (isSub) {
        html += '<td colspan="9" class="jy-ro jy-subtotal-label"><span class="jy-subtotal-badge">計</span></td>';
        html += '<td class="jy-num jy-ro jy-subtotal-col">' + fmt(subAmt) + '</td>';
        html += '<td class="jy-ro jy-subtotal-note">' + esc(subtotalBasisNote(r)) + '</td>';
        html += '<td class="jy-ro"></td><td class="jy-num jy-ro">' + fmtPct(r.cost_ratio) + '</td>';
      } else {
      html += '<td><input class="jy-in jy-code" list="jy-wt-code-list" data-cost-wcd="' + i + '" value="' + esc(r.cost_work_type_code) + '" placeholder="未設定"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td' + (isLink ? ' class="jy-link-wt"' : '') + '><input class="jy-in" list="jy-wt-list" data-cost-wt="' + i + '" value="' + esc(wtDisplay) + '"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in jy-code" list="jy-cat-code-list" data-cost-ccd="' + i + '" value="' + esc(r.cost_category_code) + '" placeholder="未設定"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in" list="jy-cat-list" data-cost-cat="' + i + '" value="' + esc(r.cost_category) + '"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td><select class="jy-in" data-cost-kind="' + i + '"' + (ro ? ' disabled' : '') + '>' + ROW_KIND_OPTS.map(function (k) {
        return '<option' + (r.cost_row_kind === k ? ' selected' : '') + '>' + k + '</option>';
      }).join('') + '</select></td>';
      html += '<td><select class="jy-in" data-cost-tax="' + i + '"' + (ro ? ' disabled' : '') + '>' + selOpts((masterCache && masterCache.taxRates) || ['0', '0.08', '0.1'], r.cost_tax_rate === '' ? '' : String(r.cost_tax_rate), true) + '</select></td>';
      html += '<td><select class="jy-in" data-cost-unit="' + i + '"' + (ro ? ' disabled' : '') + '>' + selOpts(m.units, r.cost_unit, true) + '</select></td>';
      html += '<td><input class="jy-in jy-num" data-cost-qty="' + i + '" type="number" step="any" value="' + esc(r.cost_qty) + '"' + (ro ? ' disabled' : '') + '></td>';
      html += '<td><input class="jy-in jy-num" data-cost-price="' + i + '" type="number" step="any" value="' + esc(r.cost_unit_price) + '"' + (ro ? ' disabled' : '') + '></td>';
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
      if (!readOnly) html += '<td><button type="button" class="jy-btn" data-cost-del="' + i + '" style="padding:2px 6px"' + (isSub ? ' disabled title="小計行は自動"' : '') + '>×</button></td>';
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
    if (!readOnly) html += '<button type="button" class="jy-btn" id="jy-cost-add">＋ 原価行追加</button>';
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

  function isCustomSubRow(r, blockId) {
    if (r.sub_row_kind !== 'detail') return false;
    if (r.sub_is_custom) return true;
    const template = SUB_LINES[blockId] || [];
    return !r.sub_line_type || template.indexOf(r.sub_line_type) < 0;
  }

  function canDeleteSubRow(r) {
    if (r.sub_row_kind === 'vendor') return false;
    if (SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead') return false;
    return r.sub_row_kind === 'detail';
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

  function insertSubDetailRow(blockId) {
    syncInputs();
    const idx = findSubDetailInsertIndex(blockId);
    state.subcontract_lines.splice(idx, 0, {
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
    });
    markDirty();
    render();
  }

  function renderMatRow(r, i, readOnly) {
    let row = '<tr><td><input class="jy-in" data-mat-vendor="' + i + '" value="' + esc(r.mat_vendor) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in" data-mat-name="' + i + '" value="' + esc(r.mat_name) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in" data-mat-cap="' + i + '" value="' + esc(r.mat_capacity) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in" data-mat-maker="' + i + '" value="' + esc(r.mat_maker) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in jy-num" data-mat-qty="' + i + '" type="number" step="any" value="' + esc(r.mat_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><input class="jy-in jy-num" data-mat-price="' + i + '" type="number" step="any" value="' + esc(r.mat_unit_price) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    row += '<td><select class="jy-in" data-mat-grp="' + i + '"' + (readOnly ? ' disabled' : '') + '><option' + (r.mat_group === '塗料' ? ' selected' : '') + '>塗料</option><option' + (r.mat_group === 'その他' ? ' selected' : '') + '>その他</option></select></td>';
    row += '<td class="jy-num jy-ro">' + fmt(r.mat_amount) + '</td>';
    row += '<td><input class="jy-in" data-mat-basis="' + i + '" value="' + esc(r.mat_basis) + '"' + (readOnly ? ' disabled' : '') + '></td>';
    if (!readOnly) row += '<td><button type="button" class="jy-btn" data-mat-del="' + i + '" style="padding:2px 6px">×</button></td>';
    row += '</tr>';
    return row;
  }

  function renderDetail() {
    recalcState(state);
    const m = masterCache || { units: SPEC_UNITS };
    const matHead = '<thead><tr><th>仕入先</th><th>品名</th><th>容量</th><th>メーカー</th><th>所要量</th><th>単価</th><th>区分</th><th class="jy-num">金額</th><th>計算基準</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead>';
    let html = '<div class="jy-pane-title">実　行　予　算　書　（　詳　細　表　）</div>';
    html += '<div id="jy-sec-mat-2" class="jy-sec-anchor"></div>';
    html += '<div class="jy-pane-title jy-linked-title">' + refLinkToSummary('②') + ' 材料明細（塗料）</div><div class="jy-excel-wrap jy-linked-wrap"><table class="jy-table">' + matHead + '<tbody>';
    state.mat_lines.forEach(function (r, i) {
      if (r.mat_group !== '塗料') return;
      html += renderMatRow(r, i, readOnly);
    });
    html += '</tbody><tfoot><tr><td colspan="7">' + refLinkToSummary('②') + ' 塗料合計</td><td class="jy-num">' + refAmountLink('②', 'summary', state.mat_total_2) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';
    if (!readOnly) html += '<button type="button" class="jy-btn" data-mat-add="塗料">＋ 塗料行追加</button>';

    html += '<div id="jy-sec-mat-3" class="jy-sec-anchor"></div>';
    html += '<div class="jy-pane-title jy-linked-title">' + refLinkToSummary('③') + ' 材料明細（その他）</div><div class="jy-excel-wrap jy-linked-wrap"><table class="jy-table">' + matHead + '<tbody>';
    state.mat_lines.forEach(function (r, i) {
      if (r.mat_group !== 'その他') return;
      html += renderMatRow(r, i, readOnly);
    });
    html += '</tbody><tfoot><tr><td colspan="7">' + refLinkToSummary('③') + ' その他合計</td><td class="jy-num">' + refAmountLink('③', 'summary', state.mat_total_3) + '</td><td colspan="' + (readOnly ? 1 : 2) + '"></td></tr></tfoot></table></div>';
    if (!readOnly) html += '<button type="button" class="jy-btn" data-mat-add="その他">＋ その他行追加</button>';

    SUB_BLOCKS.forEach(function (b) {
      const mk = BLOCK_MARKERS[b.id];
      html += '<div id="jy-sec-block-' + b.id + '" class="jy-sec-anchor"></div>';
      html += '<details class="jy-block jy-linked-block" open><summary>' + esc(b.label) + ' <span class="jy-ref-meta">' + refLinkToSummary(mk) + ' → 総括表</span></summary><table class="jy-table"><thead><tr><th>会社名</th><th>種別</th><th>単位</th><th>数量</th><th>単価</th><th class="jy-num">金額</th><th>計算基準</th>' + (readOnly ? '' : '<th></th>') + '</tr></thead><tbody>';
      state.subcontract_lines.forEach(function (r, i) {
        if (r.subcontract_block !== b.id) return;
        if (r.sub_row_kind === 'vendor') {
          html += '<tr><td colspan="2"><input class="jy-in" data-sub-vendor="' + i + '" value="' + esc(r.sub_vendor) + '" placeholder="会社名"' + (readOnly ? ' disabled' : '') + '></td><td colspan="' + (readOnly ? 5 : 6) + '"></td></tr>';
          return;
        }
        const calcRow = SUB_CALC.has(r.sub_row_kind) || r.sub_row_kind === 'overhead';
        const customRow = isCustomSubRow(r, b.id);
        html += '<tr class="' + (calcRow ? 'jy-calc-row' : '') + '"><td></td><td>';
        if (customRow && !readOnly) {
          html += '<input class="jy-in" data-sub-type="' + i + '" value="' + esc(r.sub_line_type) + '" placeholder="種別">';
        } else {
          html += esc(r.sub_line_type);
        }
        html += '</td>';
        if (calcRow) {
          html += '<td>' + esc(r.sub_unit) + '</td><td colspan="2"></td><td class="jy-num">' + fmt(r.sub_amount) + '</td><td>' + esc(r.sub_basis) + '</td>';
          if (!readOnly) html += '<td></td>';
          html += '</tr>';
        } else {
          html += '<td><select class="jy-in" data-sub-unit="' + i + '"' + (readOnly ? ' disabled' : '') + '>' + selOpts(m.units, r.sub_unit, true) + '</select></td>';
          html += '<td><input class="jy-in jy-num" data-sub-qty="' + i + '" type="number" step="any" value="' + esc(r.sub_qty) + '"' + (readOnly ? ' disabled' : '') + '></td>';
          html += '<td><input class="jy-in jy-num" data-sub-price="' + i + '" type="number" step="any" value="' + esc(r.sub_unit_price) + '"' + (readOnly ? ' disabled' : '') + '></td>';
          html += '<td class="jy-num jy-ro">' + fmt(r.sub_amount) + '</td>';
          html += '<td><input class="jy-in" data-sub-basis="' + i + '" value="' + esc(r.sub_basis) + '"' + (readOnly ? ' disabled' : '') + '></td>';
          if (!readOnly) {
            html += '<td>' + (canDeleteSubRow(r) ? '<button type="button" class="jy-btn" data-sub-del="' + i + '" style="padding:2px 6px">×</button>' : '') + '</td>';
          }
          html += '</tr>';
        }
      });
      html += '</tbody></table>';
      if (!readOnly) html += '<button type="button" class="jy-btn" data-sub-add="' + b.id + '">＋ 明細行追加</button>';
      html += '</details>';
    });
    return html;
  }

  function renderForm() {
    let html = '';
    if (dirty) html += '<div class="jy-dirty" id="jy-dirty">● 未保存の変更があります</div>';
    html += '<div class="jy-bar"><button type="button" class="jy-btn" id="jy-back-list">← 一覧</button>';
    html += '<strong>' + esc(state.project_code || '新規') + '</strong> <span class="jy-meta">' + esc(state.status) + ' / BUILD ' + BUILD + '</span></div>';
    html += renderHeader();
    html += '<div class="jy-tabs"><button type="button" class="jy-tab' + (activeTab === 'summary' ? ' active' : '') + '" data-tab="summary">総括表</button>';
    html += '<button type="button" class="jy-tab' + (activeTab === 'detail' ? ' active' : '') + '" data-tab="detail">詳細表</button></div>';
    html += '<div class="jy-tab-hint">' + (activeTab === 'summary'
      ? '番号または連携行の金額をクリックすると詳細表の該当ブロックへ移動します'
      : '番号または合計金額をクリックすると総括表の連携行へ移動します') +
      '<span class="jy-legend-linked">緑 = 詳細表連携（②〜⑦）</span></div>';
    if (activeTab === 'summary') {
      html += '<div class="jy-pane"><div class="jy-title">実　行　予　算　書　（　総　括　表　）</div>' + renderSummary() + '</div>';
    } else {
      html += '<div class="jy-pane">' + renderDetail() + '</div>';
    }
    if (!readOnly) {
      html += '<div class="jy-bar"><button type="button" class="jy-btn jy-btn-primary" id="jy-save">保存</button>';
      html += '<button type="button" class="jy-btn" id="jy-recalc">再計算</button>';
      html += '<button type="button" class="jy-btn" id="jy-confirm">初版確定</button></div>';
    }
    return html;
  }

  function renderList() {
    let html = '<div class="jy-title">【実行予算書】ver.01</div>';
    html += '<div class="jy-subtitle">Excel 風フォームで総括表・詳細表を入力します（リストマスタ App ' + APP_MASTER + ' 連動）</div>';
    html += '<div class="jy-bar"><button type="button" class="jy-btn jy-btn-primary" id="jy-new">＋ 新規作成</button><span class="jy-meta">BUILD ' + BUILD + '</span></div>';
    html += '<div class="jy-excel-wrap"><table class="jy-table jy-list-table"><thead><tr><th>No.</th><th>工事コード</th><th>工事名称</th><th>版種別</th><th>立案日</th><th>ステータス</th><th class="jy-num">契約合計①</th><th class="jy-num">粗利⑨</th></tr></thead><tbody>';
    if (!listRows.length) {
      html += '<tr><td colspan="8" style="text-align:center;padding:24px">レコードがありません。「新規作成」から開始してください。</td></tr>';
    } else {
      listRows.forEach(function (r) {
        html += '<tr data-open-id="' + esc(r.id) + '" title="クリックで詳細を開く"><td class="jy-num">' + esc(r.id) + '</td><td class="jy-list-code">' + esc(r.project_code) + '</td><td>' + esc(r.project_name) + '</td><td>' + esc(r.version_type) + '</td><td>' + esc(r.draft_date) + '</td><td>' + esc(r.status) + '</td><td class="jy-num">' + fmt(r.contract_total_1) + '</td><td class="jy-num">' + fmt(r.profit_9) + '</td></tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  }

  function render() {
    const root = document.getElementById('jy-root');
    if (!root) return;
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

    const newBtn = document.getElementById('jy-new');
    if (newBtn) newBtn.addEventListener('click', function () {
      state = newDraftState();
      readOnly = false;
      dirty = false;
      uiScreen = 'form';
      activeTab = 'summary';
      render();
    });

    root.querySelectorAll('[data-open-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        openRecord(tr.getAttribute('data-open-id'));
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
      state.status = '初版確定';
      saveRecord();
    });

    const specAdd = document.getElementById('jy-spec-add');
    if (specAdd) specAdd.addEventListener('click', function () {
      syncInputs();
      state.spec_lines.push({ spec_name: '', spec_unit: '', spec_qty: '', spec_unit_price: '', spec_amount: 0, spec_note: '' });
      markDirty();
      render();
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

    const costAdd = document.getElementById('jy-cost-add');
    if (costAdd) costAdd.addEventListener('click', function () {
      syncInputs();
      state.cost_lines.push(blankCostRow({ cost_row_kind: 'detail' }));
      markDirty();
      render();
    });
    root.querySelectorAll('[data-cost-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        state.cost_lines.splice(Number(btn.getAttribute('data-cost-del')), 1);
        markDirty();
        render();
      });
    });

    root.querySelectorAll('[data-mat-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        syncInputs();
        state.mat_lines.push(blankMatRow(btn.getAttribute('data-mat-add') || '塗料'));
        markDirty();
        render();
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
      btn.addEventListener('click', function () {
        insertSubDetailRow(btn.getAttribute('data-sub-add'));
      });
    });
    root.querySelectorAll('[data-sub-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        syncInputs();
        const idx = Number(btn.getAttribute('data-sub-del'));
        const r = state.subcontract_lines[idx];
        if (!r || !canDeleteSubRow(r)) return;
        state.subcontract_lines.splice(idx, 1);
        markDirty();
        render();
      });
    });

    bindCostLineFieldSync(root, 'data-cost-wt', 'wt');
    bindCostLineFieldSync(root, 'data-cost-wcd', 'wcd');
    bindCostLineFieldSync(root, 'data-cost-cat', 'cat');
    bindCostLineFieldSync(root, 'data-cost-ccd', 'ccd');
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
    state.project_code = g('jy-project-code');
    state.project_official_name = g('jy-project-official');
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
      state.spec_lines[Number(el.getAttribute('data-spec-name'))].spec_name = el.value;
    });
    document.querySelectorAll('[data-spec-unit]').forEach(function (el) {
      state.spec_lines[Number(el.getAttribute('data-spec-unit'))].spec_unit = el.value;
    });
    document.querySelectorAll('[data-spec-qty]').forEach(function (el) {
      state.spec_lines[Number(el.getAttribute('data-spec-qty'))].spec_qty = el.value;
    });
    document.querySelectorAll('[data-spec-price]').forEach(function (el) {
      state.spec_lines[Number(el.getAttribute('data-spec-price'))].spec_unit_price = el.value;
    });
    document.querySelectorAll('[data-spec-note]').forEach(function (el) {
      state.spec_lines[Number(el.getAttribute('data-spec-note'))].spec_note = el.value;
    });

    document.querySelectorAll('[data-cost-wcd]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-wcd'))].cost_work_type_code = el.value;
    });
    document.querySelectorAll('[data-cost-wt]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-wt'))].cost_work_type = el.value;
    });
    document.querySelectorAll('[data-cost-ccd]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-ccd'))].cost_category_code = el.value;
    });
    document.querySelectorAll('[data-cost-cat]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-cat'))].cost_category = el.value;
    });
    document.querySelectorAll('[data-cost-kind]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-kind'))].cost_row_kind = el.value;
    });
    document.querySelectorAll('[data-cost-tax]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-tax'))].cost_tax_rate = el.value;
    });
    document.querySelectorAll('[data-cost-unit]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-unit'))].cost_unit = el.value;
    });
    document.querySelectorAll('[data-cost-qty]').forEach(function (el) {
      const i = Number(el.getAttribute('data-cost-qty'));
      state.cost_lines[i].cost_qty = el.value;
      if (state.cost_lines[i].cost_row_kind === '明細') {
        state.cost_lines[i].cost_amount = num(el.value) * num(state.cost_lines[i].cost_unit_price);
      }
    });
    document.querySelectorAll('[data-cost-price]').forEach(function (el) {
      const i = Number(el.getAttribute('data-cost-price'));
      state.cost_lines[i].cost_unit_price = el.value;
      if (state.cost_lines[i].cost_row_kind === '明細') {
        state.cost_lines[i].cost_amount = num(state.cost_lines[i].cost_qty) * num(el.value);
      }
    });
    document.querySelectorAll('[data-cost-note]').forEach(function (el) {
      state.cost_lines[Number(el.getAttribute('data-cost-note'))].cost_basis_note = el.value;
    });

    document.querySelectorAll('[data-mat-vendor]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-vendor'))].mat_vendor = el.value;
    });
    document.querySelectorAll('[data-mat-name]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-name'))].mat_name = el.value;
    });
    document.querySelectorAll('[data-mat-cap]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-cap'))].mat_capacity = el.value;
    });
    document.querySelectorAll('[data-mat-maker]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-maker'))].mat_maker = el.value;
    });
    document.querySelectorAll('[data-mat-qty]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-qty'))].mat_qty = el.value;
    });
    document.querySelectorAll('[data-mat-price]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-price'))].mat_unit_price = el.value;
    });
    document.querySelectorAll('[data-mat-grp]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-grp'))].mat_group = el.value;
    });
    document.querySelectorAll('[data-mat-basis]').forEach(function (el) {
      state.mat_lines[Number(el.getAttribute('data-mat-basis'))].mat_basis = el.value;
    });

    document.querySelectorAll('[data-sub-vendor]').forEach(function (el) {
      state.subcontract_lines[Number(el.getAttribute('data-sub-vendor'))].sub_vendor = el.value;
    });
    document.querySelectorAll('[data-sub-qty]').forEach(function (el) {
      const i = Number(el.getAttribute('data-sub-qty'));
      state.subcontract_lines[i].sub_qty = el.value;
      state.subcontract_lines[i].sub_amount = num(el.value) * num(state.subcontract_lines[i].sub_unit_price);
    });
    document.querySelectorAll('[data-sub-price]').forEach(function (el) {
      const i = Number(el.getAttribute('data-sub-price'));
      state.subcontract_lines[i].sub_unit_price = el.value;
      state.subcontract_lines[i].sub_amount = num(state.subcontract_lines[i].sub_qty) * num(el.value);
    });
    document.querySelectorAll('[data-sub-unit]').forEach(function (el) {
      state.subcontract_lines[Number(el.getAttribute('data-sub-unit'))].sub_unit = el.value;
    });
    document.querySelectorAll('[data-sub-basis]').forEach(function (el) {
      state.subcontract_lines[Number(el.getAttribute('data-sub-basis'))].sub_basis = el.value;
    });
    document.querySelectorAll('[data-sub-type]').forEach(function (el) {
      state.subcontract_lines[Number(el.getAttribute('data-sub-type'))].sub_line_type = el.value;
    });
    recalcState(state);
  }

  function saveRecord() {
    if (readOnly) return;
    syncInputs();
    if (!state.project_code || !String(state.project_code).trim()) {
      alert('工事コードを入力してください');
      return;
    }
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
      alert('保存しました (ID: ' + state.recordId + ')');
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
      fields: ['$id', 'project_code', 'project_name', 'version_type', 'draft_date', 'status', 'contract_total_1', 'profit_9'],
    }).then(function (resp) {
      listRows = (resp.records || []).map(function (rec) {
        const id = rec.$id && rec.$id.value != null ? String(rec.$id.value) : '';
        if (!id) return null;
        return {
          id: id,
          project_code: gv(rec, 'project_code'),
          project_name: gv(rec, 'project_name'),
          version_type: gv(rec, 'version_type'),
          draft_date: String(gv(rec, 'draft_date')).slice(0, 10),
          status: gv(rec, 'status'),
          contract_total_1: num(gv(rec, 'contract_total_1')),
          profit_9: num(gv(rec, 'profit_9')),
        };
      }).filter(function (r) { return r != null; });
    }).catch(function (e) {
      console.error(BUILD, 'refreshList', e);
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
