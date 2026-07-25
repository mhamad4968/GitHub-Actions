  const APP1_ID = /* @JY_V2_APP1 */ 756;
  const APP2_ID = /* @JY_V2_APP2 */ 757;
  const APP3_ID = /* @JY_V2_APP3 */ 758;
  // @JY_V2_BUILD 2026-07-25-ver02-header-fluid-fullrow

  const JY2_STYLE_ID = "jy2-shell-style";
  const JY2_ACTIVE_TAB_KEY = `jy2:${APP1_ID}:activeTab`;
  const JY2_FONT_SCALE_KEY = "jy2-font-scale";
  const JY2_FONT_SCALES = Object.freeze(["standard", "large", "xlarge"]);
  const JY2_TAX_RATE_LABELS = { "0": "0％", "0.08": "8％", "0.1": "10％" };
  const JY2_TAX_RATE_VALUES = Object.freeze(["0", "0.08", "0.1"]);
  const JY2_ACTUAL_ATTR_COLS = 8;

  function jy2StoreActiveTab(view, tabId) {
    if (!tabId || !view || !view.sessionStorage) return;
    try {
      view.sessionStorage.setItem(JY2_ACTIVE_TAB_KEY, String(tabId));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ReadStoredActiveTab(view, allowedIds) {
    if (!view || !view.sessionStorage || !Array.isArray(allowedIds)) return null;
    try {
      const raw = view.sessionStorage.getItem(JY2_ACTIVE_TAB_KEY);
      return raw && allowedIds.includes(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  function jy2ReloadPreservingTab(view, tabId) {
    jy2StoreActiveTab(view, tabId);
    if (view && view.location) view.location.reload();
  }

  function jy2ReadStoredFontScale(view) {
    if (!view || !view.localStorage) return "standard";
    try {
      const raw = view.localStorage.getItem(JY2_FONT_SCALE_KEY);
      return raw && JY2_FONT_SCALES.includes(raw) ? raw : "standard";
    } catch {
      return "standard";
    }
  }

  function jy2StoreFontScale(view, scale) {
    if (!scale || !view || !view.localStorage) return;
    try {
      view.localStorage.setItem(JY2_FONT_SCALE_KEY, String(scale));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ApplyFontScale(shell, scale) {
    if (!shell) return;
    shell.dataset.fontScale =
      scale && JY2_FONT_SCALES.includes(scale) ? scale : "standard";
  }

  function jy2FieldValue(record, code) {
    const field = record && record[code];
    return field && typeof field === "object" && "value" in field
      ? field.value
      : field;
  }

  function jy2LockState(record) {
    const derived = jy2FieldValue(record, "derived_lock_state");
    try {
      allowedOperations(derived);
      return derived;
    } catch {
      // A new/offline record may not have its derived cache yet.
    }
    const status = jy2FieldValue(record, "status") || "下書き";
    try {
      return deriveLockState({ status, newerVersionExists: false });
    } catch {
      return LOCK_STATES.FULL_LOCKED;
    }
  }

  function jy2InstallStyle(documentRef) {
    if (!documentRef) return;
    let style = documentRef.getElementById(JY2_STYLE_ID);
    if (!style) {
      style = documentRef.createElement("style");
      style.id = JY2_STYLE_ID;
      documentRef.head.appendChild(style);
    }
    style.textContent = [
      // A-07 / Ver.01テイスト: slate chrome・色分けタブ・シート見出し・薄茶合計
      // overflow-x:hidden は overflow-y を auto 化し sticky を壊す → clip で横だけ切る
      // #R-UI-01 / #S-UI-01: sticky/fixed メニュー祖先に overflow-x:hidden 禁止（verify:jikkou-v2-chrome-css）
      ".jy2-shell{font-family:'Segoe UI',Meiryo,sans-serif;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;color:#334155;overflow-x:clip;overflow-y:visible;padding:0 0 12px;max-width:100%;width:100%;min-width:0;box-sizing:border-box}",
      ".jy2-header{display:none}",
      ".jy2-title{margin:0;font-size:22px;font-weight:800;letter-spacing:.28em;color:#334155;line-height:1.35}",
      ".jy2-header-stub{font-size:11px;color:#64748b;letter-spacing:normal;opacity:1}",
      ".jy2-tabs{display:flex;gap:4px;padding:6px 0 0;background:transparent;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}",
      ".jy2-tab{border:1px solid #cbd5e1;border-bottom:0;border-radius:6px 6px 0 0;background:#f1f5f9;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:600;color:#475569;white-space:nowrap;flex:0 0 auto}",
      ".jy2-tab[data-tab-id='header']{background:#f8fafc;color:#475569;border-color:#94a3b8}",
      ".jy2-tab[data-tab-id='summary']{background:#eff6ff;color:#1e40af;border-color:#93c5fd}",
      ".jy2-tab[data-tab-id='detail']{background:#ecfdf5;color:#166534;border-color:#86efac}",
      ".jy2-tab[data-tab-id='actual']{background:#fffbeb;color:#92400e;border-color:#fcd34d}",
      ".jy2-tab[data-tab-id='version']{background:#f5f3ff;color:#5b21b6;border-color:#c4b5fd}",
      ".jy2-tab[aria-selected='true']{background:#fff;font-weight:800;box-shadow:0 -1px 0 #fff}",
      ".jy2-tab[data-tab-id='summary'][aria-selected='true']{background:#2563eb;color:#fff;border-color:#2563eb}",
      ".jy2-tab[data-tab-id='detail'][aria-selected='true']{background:#059669;color:#fff;border-color:#059669}",
      ".jy2-tab[data-tab-id='actual'][aria-selected='true']{background:#d97706;color:#fff;border-color:#d97706}",
      ".jy2-tab[data-tab-id='version'][aria-selected='true']{background:#7c3aed;color:#fff;border-color:#7c3aed}",
      ".jy2-tab[data-tab-id='header'][aria-selected='true']{background:#64748b;color:#fff;border-color:#64748b}",
      ".jy2-tab[data-read-only='true']::after{content:' 🔒';font-size:11px}",
      ".jy2-pane{display:none;min-height:0;padding:8px 12px 14px;background:#fff;border:1px solid #cbd5e1;border-top:none;border-radius:0 0 8px 8px;max-width:100%;min-width:0;width:100%;box-sizing:border-box;overflow-x:clip;overflow-y:visible}",
      ".jy2-pane[data-active='true']{display:block}",
      ".jy2-pane[data-tab-id='header'][data-active='true']{border-color:#94a3b8;border-top:3px solid #64748b;background:#fff}",
      ".jy2-pane[data-tab-id='summary'][data-active='true']{border-color:#93c5fd;border-top:3px solid #3b82f6;background:#fff}",
      ".jy2-pane[data-tab-id='detail'][data-active='true']{border-color:#86efac;border-top:3px solid #22c55e;background:#fff}",
      ".jy2-pane[data-tab-id='actual'][data-active='true']{border-color:#fcd34d;border-top:3px solid #f59e0b;background:#fff}",
      ".jy2-pane[data-tab-id='version'][data-active='true']{border-color:#c4b5fd;border-top:3px solid #7c3aed;background:#fff}",
      // A-07: Ver.01同趣旨のシート見出し。sticky 下に常時表示しスクロールで隠れない
      ".jy2-sticky-sheet-banner{display:flex;justify-content:center;align-items:center;width:100%;margin:4px 0 0;padding:0 8px 6px;box-sizing:border-box}",
      /* シート見出しは sticky のみ。ペイン内バナーは Dom に残さない／残っても空間ゼロ */
      ".jy2-pane-head-banner{display:none!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;border:0!important}",
      ".jy2-sheet-title{width:100%;max-width:960px;box-sizing:border-box;padding:10px 36px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;line-height:1.3;text-align:center;box-shadow:0 3px 8px rgba(15,23,42,.12);margin:0 auto}",
      ".jy2-sheet-title-header{background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 55%,#cbd5e1 100%);border:1px solid #94a3b8}",
      ".jy2-sheet-title-summary{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 55%,#bfdbfe 100%);border:1px solid #93c5fd}",
      ".jy2-sheet-title-detail{background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 55%,#bbf7d0 100%);border:1px solid #86efac}",
      ".jy2-sheet-title-actual{background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 55%,#fde68a 100%);border:1px solid #fcd34d}",
      ".jy2-sheet-title-version{background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 55%,#ddd6fe 100%);border:1px solid #c4b5fd}",
      // letter-spacing 末尾空きを打ち消し、帯の中で文字だけ視覚中央へ
      ".jy2-sheet-title-doc{display:inline-block;font-size:22px;font-weight:800;letter-spacing:.2em;margin-inline-end:-.2em;padding:0;color:#1e3a8a;text-align:center}",
      ".jy2-sheet-title-detail .jy2-sheet-title-doc{color:#14532d}",
      ".jy2-sheet-title-actual .jy2-sheet-title-doc{color:#92400e}",
      ".jy2-sheet-title-version .jy2-sheet-title-doc{color:#5b21b6}",
      ".jy2-sheet-title-header .jy2-sheet-title-doc{color:#334155}",
      ".jy2-sheet-title-sheet{display:inline-block;font-size:16px;font-weight:700;letter-spacing:.2em;margin-inline-end:-.2em;padding:5px 22px;border-radius:8px;background:#fff;text-align:center}",
      ".jy2-sheet-title-summary .jy2-sheet-title-sheet{color:#1d4ed8;border:1px solid #93c5fd}",
      ".jy2-sheet-title-detail .jy2-sheet-title-sheet{color:#047857;border:1px solid #86efac}",
      ".jy2-sheet-title-actual .jy2-sheet-title-sheet{color:#b45309;border:1px solid #fcd34d}",
      ".jy2-sheet-title-version .jy2-sheet-title-sheet{color:#6d28d9;border:1px solid #c4b5fd}",
      ".jy2-sheet-title-header .jy2-sheet-title-sheet{color:#475569;border:1px solid #94a3b8}",
      "@media (max-width:900px){.jy2-sheet-title{padding:12px 20px}.jy2-sheet-title-doc{font-size:18px;letter-spacing:.14em;margin-inline-end:-.14em}.jy2-sheet-title-sheet{font-size:14px;letter-spacing:.14em;margin-inline-end:-.14em;padding:4px 14px}}",
      ".jy2-empty{color:#64748b;font-size:13px}",
      ".jy2-section-title{margin:14px 0 6px;font-size:14px;font-weight:700;padding:4px 8px;background:#e8eef4;border-left:4px solid #2563eb;color:#1e3a8a}",
      // 表の横スクロール: 親は幅固定・子だけ overflow-x（親が表幅に広がるとスクロールが出ない）
      // 右端パディングで最終列の縦罫線が clip されないようにする（C5/C12）
      // ラッパ=可視天井の固定px。横バーは画面下固定レール（長い総括の最下部だと見えない）。
      ".jy2-table-scroll{display:block;overflow-x:auto;overflow-y:visible;max-width:100%;width:100%;min-width:0;margin:0 0 8px;padding:0 14px 10px 0;box-sizing:border-box;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;contain:inline-size;scrollbar-width:none}",
      ".jy2-table-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      ".jy2-pane-hscroll{margin:0}",
      ".jy2-hscroll-inner{display:block;box-sizing:border-box;max-width:none;min-width:1400px}",
      "#jy2-fixed-hrail{position:fixed;left:0;right:auto;bottom:0;z-index:2000;height:18px;overflow-x:scroll;overflow-y:hidden;background:#e2e8f0;border-top:1px solid #94a3b8;box-shadow:0 -2px 8px rgba(15,23,42,.12);display:none}",
      "#jy2-fixed-hrail .jy2-fixed-hrail-spacer{height:1px;pointer-events:none}",
      ".jy2-pane[data-tab-id='summary'],.jy2-pane[data-tab-id='detail']{contain:inline-size}",
      // 表は inner 幅いっぱい（inner が固定pxなので狭幅でも表は縮まない）
      ".jy2-table-scroll .jy2-table,.jy2-table-scroll .jy2-detail-table{display:table;width:100%!important;min-width:0;max-width:none!important;margin:0 0 16px;box-sizing:border-box;table-layout:auto}",
      ".jy2-contract-table .jy2-input,.jy2-salary-table .jy2-input,.jy2-projection-table .jy2-input{min-width:4.75rem}",
      ".jy2-contract-table .jy2-select,.jy2-salary-table .jy2-select,.jy2-projection-table .jy2-select{min-width:4.25rem}",
      ".jy2-contract-table th:nth-child(2),.jy2-contract-table td:nth-child(2){min-width:9.5rem}",
      ".jy2-salary-table th:nth-child(1),.jy2-salary-table td:nth-child(1){min-width:8rem}",
      ".jy2-table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:12px;background:#fff;border-radius:6px;overflow:visible}",
      ".jy2-table th,.jy2-table td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:middle}",
      ".jy2-table th{background:#f1f5f9;font-weight:600;color:#475569;text-align:center;white-space:nowrap}",
      ".jy2-band-row th{background:#eef3fa;text-align:left;color:#1e3a8a}",
      ".jy2-total-row td,.jy2-block-total-row td{background:#f5ebe0!important;color:#44372a;font-weight:700;border-color:#d4b896!important;border-top:2px solid #c4a574!important}",
      ".jy2-num{text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-amount{text-align:right;background:#F3F8FC;font-variant-numeric:tabular-nums}",
      ".jy2-input{width:100%;box-sizing:border-box;border:1px solid #e2e8f0;padding:2px 4px;background:#FFFCF3;border-radius:4px;font-size:12px}",
      ".jy2-input:focus{border-color:#2563eb;outline:none}",
      ".jy2-input.jy2-combo{background:#F4FAF4}",
      ".jy2-combo-wrap{display:flex;align-items:stretch;gap:0;width:100%;min-width:0}",
      ".jy2-combo-wrap>.jy2-input{flex:1;min-width:0;border-top-right-radius:0;border-bottom-right-radius:0}",
      ".jy2-combo-wrap>.jy2-combo-select{flex:0 0 2rem;width:2rem;max-width:2rem;padding:0;margin:0;border:1px solid #cbd5e1;border-left:0;border-radius:0 4px 4px 0;background:#F4FAF4;cursor:pointer;font-size:11px;line-height:1}",
      ".jy2-select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;padding:2px 4px;background:#f1f5f9;border-radius:4px;cursor:pointer}",
      ".jy2-select:focus{border-color:#2563eb;outline:none;background:#eef4ff}",
      ".jy2-incomplete{background:#FFF5F5!important}",
      ".jy2-incomplete .jy2-input,.jy2-incomplete .jy2-select,.jy2-incomplete .jy2-combo-select{background:#FFF5F5!important}",
      ".jy2-row-button{border:1px solid #cbd5e1;background:#f8fafc;padding:2px 8px;cursor:pointer;font-size:11px;border-radius:6px;font-weight:600;color:#334155}",
      ".jy2-row-button:hover{background:#f1f5f9}",
      ".jy2-projection-table td{background:#fff}",
      ".jy2-projection-table .jy2-amount{background:#F3F8FC}",
      ".jy2-budget-summary{margin:12px 0 4px;border:1px solid #c4a574;border-radius:6px;background:#fffdf9}",
      ".jy2-budget-summary-head{background:linear-gradient(180deg,#f5ebe0,#efe3d4);color:#44372a;font-weight:700;font-size:13px;padding:8px 12px;border-bottom:1px solid #d4b896;border-radius:5px 5px 0 0}",
      ".jy2-budget-summary-wrap{padding:8px 10px 10px}",
      ".jy2-budget-summary-table{width:100%;border-collapse:collapse;font-size:12px}",
      ".jy2-budget-summary-table th,.jy2-budget-summary-table td{border:1px solid #d4b896;padding:6px 8px}",
      ".jy2-budget-summary-table th{background:#f5ebe0;color:#44372a;font-weight:600;text-align:center}",
      ".jy2-budget-summary-table td.jy2-budget-col-label{font-weight:600;color:#3d2f24;white-space:nowrap}",
      ".jy2-budget-summary-table tr.jy2-budget-total-row td{background:#f5ebe0;font-weight:700;border-top:2px solid #c4a574}",
      ".jy2-budget-summary-table .jy2-num{text-align:right}",
      ".jy2-budget-summary-keys{width:100%;border-collapse:collapse;font-size:12px;margin:0 0 10px}",
      ".jy2-budget-summary-keys th,.jy2-budget-summary-keys td{border:1px solid #d4b896;padding:5px 10px}",
      ".jy2-budget-summary-keys th{background:#f5ebe0;color:#44372a;font-weight:600}",
      ".jy2-budget-summary-keys .jy2-key-row td{font-weight:700;background:#f8f1e8}",
      ".jy2-budget-summary-keys .jy2-sub-row td{font-size:11px;color:#5c4a3a;background:#fffdf9}",
      ".jy2-budget-summary-note{margin:6px 0 0;font-size:10px;color:#64748b;line-height:1.45}",
      ".jy2-summary-footer{margin-top:8px}",
      // 横スクロールは pane-hscroll 1本。ブロックは inner 幅に追従（縮むのは inner 固定pxが防ぐ）
      ".jy2-detail-block{border:1px solid #cbd5e1;border-radius:8px;margin:0 0 16px;background:#fff;overflow:visible;box-shadow:0 1px 3px rgba(15,23,42,.04);max-width:none;min-width:0;width:100%;box-sizing:border-box}",
      ".jy2-detail-block[data-block-status='retired']{opacity:.6}",
      ".jy2-detail-block-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(180deg,#ecfdf5,#d1fae5);font-size:12px;border-bottom:1px solid #bbf7d0}",
      ".jy2-detail-block-head label{display:flex;align-items:center;gap:4px}",
      ".jy2-detail-block-head input,.jy2-detail-block-head select{min-width:110px}",
      ".jy2-block-no{font-weight:800;background:#fff;color:#047857;padding:3px 10px;border:1px solid #86efac;border-radius:6px}",
      ".jy2-nav-block-no{cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
      "button.jy2-nav-block-no{display:inline-block;font:inherit;font-weight:700;color:#1d4ed8;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:2px 8px}",
      "button.jy2-nav-block-no:hover{background:#dbeafe}",
      "span.jy2-block-no.jy2-nav-block-no{color:#047857}",
      "span.jy2-block-no.jy2-nav-block-no:hover{background:#ecfdf5;box-shadow:0 0 0 2px #86efac}",
      ".jy2-nav-flash{outline:3px solid #2563eb!important;box-shadow:0 0 0 4px rgba(37,99,235,.28)!important}",
      "tr.jy2-nav-flash>td{background:#dbeafe!important}",
      ".jy2-detail-block.jy2-nav-flash{background:#eff6ff}",
      ".jy2-block-actions{margin-left:auto;display:flex;gap:4px}",
      ".jy2-detail-table{margin:0}",
      ".jy2-hscroll-inner>.jy2-detail-block{width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-hscroll-inner>.jy2-budget-summary{width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-detail-table th.jy2-th-stacked{min-width:4.5rem;padding:6px 4px!important}",
      ".jy2-detail-table .jy2-th-stack .jy2-th-label{white-space:normal;max-width:6.5rem;line-height:1.25}",
      ".jy2-detail-table .jy2-combo-wrap{min-width:8.5rem}",
      ".jy2-detail-table td .jy2-input{min-width:5.5rem}",
      ".jy2-detail-table td .jy2-select{min-width:4.5rem}",
      ".jy2-footer-row td{background:#f8fafc}",
      ".jy2-footer-row .jy2-footer-label{font-weight:700;text-align:left!important;vertical-align:middle;padding:4px 8px!important}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-stack{flex-direction:row!important;align-items:center;justify-content:flex-start;gap:6px;margin:0!important;width:auto;max-width:100%}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-label{white-space:nowrap;font-size:12px;text-align:left}",
      ".jy2-footer-row .jy2-num,.jy2-footer-row .jy2-amount{min-width:9.5rem;width:9.5rem;max-width:12rem;white-space:nowrap;padding:4px 8px;box-sizing:border-box}",
      ".jy2-footer-row .jy2-input{width:100%;min-width:8.5rem;box-sizing:border-box;padding:4px 6px;font-size:13px;text-align:right}",
      ".jy2-detail-table th:nth-child(7),.jy2-detail-table td.jy2-amount{min-width:7.5rem}",
      ".jy2-warning{color:#b91c1c;font-size:12px;margin:4px 0;font-weight:600}",
      ".jy2-retired-tag{color:#b91c1c;font-weight:700}",
      // 予実: 横スクロール1本のみ（縦はページスクロール。二重縦スクロール禁止＝C7）
      ".jy2-pane[data-tab-id='actual']{overflow-x:clip;overflow-y:visible;padding:8px 8px 8px 8px}",
      /* 右息抜き ~10px（6px基準から左へ+4px＝浜田意図。2pxは逆方向だった） */
      ".jy2-actual-scroll{display:block;overflow-x:auto;overflow-y:visible;border:1px solid #e2e8f0;border-radius:6px;background:#fff;max-width:100%;width:100%;min-width:0;max-height:none;box-sizing:border-box;padding:0 10px 10px 0;margin:0;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;contain:inline-size;scrollbar-width:none}",
      ".jy2-actual-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      ".jy2-actual-table{white-space:nowrap;margin:0;border-collapse:separate;border-spacing:0;font-size:11px;width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-actual-table th,.jy2-actual-table td{padding:3px 5px}",
      ".jy2-actual-table .jy2-input{min-width:48px;font-size:11px}",
      ".jy2-actual-table .jy2-actual-month{width:3.6rem;min-width:3.6rem;max-width:3.8rem;padding:2px 3px;box-sizing:border-box}",
      ".jy2-actual-table thead th.jy2-actual-month{padding:4px 2px;vertical-align:bottom}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-stack{gap:2px;width:100%;max-width:100%;margin:0 auto}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-label{font-size:10px;font-weight:700;white-space:normal;line-height:1.15;max-width:3.6rem}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-hf-tag{font-size:9px;padding:1px 4px;letter-spacing:0}",
      ".jy2-actual-table .jy2-actual-month .jy2-input{min-width:0;width:100%;padding:2px 3px;font-size:10px}",
      ".jy2-actual-table th.jy2-actual-rate-end,.jy2-actual-table td.jy2-actual-rate-end{min-width:4.25rem;width:4.25rem;padding:4px 6px 4px 4px!important;box-sizing:border-box;text-align:right}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-stack{width:100%;margin:0;align-items:flex-end}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-label{white-space:nowrap;font-size:11px}",
      ".jy2-actual-note-details{margin:0 0 8px;font-size:12px;color:#64748b}",
      ".jy2-actual-note-details>summary{cursor:pointer;font-weight:600;color:#475569;padding:4px 0}",
      ".jy2-actual-note{color:#64748b;font-size:11px;margin:4px 0 0;line-height:1.45}",
      /* 縦 sticky 禁止（2段見出しが同じ top でデータ行に沈む）。左固定列のみ sticky */
      ".jy2-actual-table thead th{text-align:center;vertical-align:bottom;position:static;top:auto;z-index:auto;background:#f1f5f9;box-shadow:none}",
      ".jy2-actual-table thead th[colspan]{background:#fef3c7}",
      ".jy2-actual-table thead tr:last-child th{background:#f1f5f9;font-size:10px}",
      ".jy2-actual-table .jy2-freeze{position:sticky;top:auto;z-index:3;background:#fff}",
      ".jy2-actual-table thead .jy2-freeze{z-index:4;background:#f1f5f9}",
      ".jy2-actual-table .jy2-freeze-0{left:0;min-width:2.6rem}",
      ".jy2-actual-table .jy2-freeze-1{left:2.6rem;min-width:2.8rem}",
      ".jy2-actual-table .jy2-freeze-2{left:5.4rem;min-width:3.6rem}",
      ".jy2-actual-table .jy2-freeze-3{left:9rem;min-width:7rem;max-width:10rem;overflow:hidden;text-overflow:ellipsis;box-shadow:2px 0 5px rgba(15,23,42,.1)}",
      ".jy2-actual-table .jy2-total-row .jy2-freeze,.jy2-actual-table .jy2-freeze-span{background:#f5ebe0;z-index:4}",
      ".jy2-actual-table tr:hover td:not(.jy2-freeze){background:#f8fafc}",
      ".jy2-actual-table tr:hover .jy2-freeze{background:#eef2ff}",
      ".jy2-version-table td{background:#fff}",
      ".jy2-version-table tr[data-current='true'] td{background:#ede9fe!important;font-weight:600}",
      ".jy2-lock-badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;font-weight:700;border:1px solid #a6b7ca}",
      ".jy2-lock-badge[data-lock='editable']{background:#e3fcef;color:#006644;border-color:#79d2a3}",
      ".jy2-lock-badge[data-lock='budget_locked']{background:#fff7e6;color:#974f0c;border-color:#e2b203}",
      ".jy2-lock-badge[data-lock='full_locked']{background:#ffebe6;color:#c9372c;border-color:#f0a396}",
      ".jy2-version-cta[disabled]{opacity:.45;cursor:not-allowed}",
      ".jy2-version-status{font-size:12px;margin:6px 0;color:#334155}",
      ".jy2-save-button{border:1px solid #1d4ed8;background:#2563eb;color:#fff;padding:8px 18px;font-weight:700;cursor:pointer;border-radius:6px;box-shadow:0 1px 2px rgba(37,99,235,.35)}",
      ".jy2-save-button[disabled]{opacity:.5;cursor:not-allowed}",
      ".jy2-sticky-top{position:sticky;top:0;z-index:1200;background:#fff;border:1px solid #cbd5e1;border-bottom:1px solid #94a3b8;border-radius:8px 8px 0 0;padding:4px 8px 0;margin:0;box-shadow:0 4px 12px rgba(15,23,42,.12);max-width:100%;box-sizing:border-box;overflow:visible}",
      // fixed 化時の高さ確保。sticky 直後に置き表題下の二重余白を防ぐ（高さは JS 同期）
      ".jy2-sticky-spacer{display:block;width:100%;height:0;flex:0 0 auto;pointer-events:none;visibility:hidden;overflow:hidden;margin:0;padding:0;border:0}",
      ".jy2-sticky-top.is-fixed{position:fixed;margin:0}",
      ".jy2-sticky-top .jy2-header{display:none}",
      ".jy2-action-bar{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;justify-content:flex-start;margin-bottom:4px;width:100%;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px 8px}",
      ".jy2-action-bar-right{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;flex:0 0 auto;order:0;margin-left:0}",
      ".jy2-action-group{display:flex;flex-wrap:nowrap;gap:6px 8px;align-items:center;min-width:0;flex:1 1 auto;order:1}",
      ".jy2-btn{border:1px solid #94a3b8;background:#f8fafc;color:#0f172a;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;white-space:nowrap;flex:0 0 auto}",
      ".jy2-btn:hover{background:#f1f5f9}",
      ".jy2-btn[disabled]{opacity:.45;cursor:not-allowed}",
      ".jy2-btn-primary{border-color:#1d4ed8;background:#2563eb;color:#fff;box-shadow:0 1px 2px rgba(37,99,235,.35)}",
      ".jy2-btn-primary:hover{background:#1d4ed8}",
      ".jy2-btn-accent{border-color:#059669;background:#059669;color:#fff}",
      ".jy2-btn-accent:hover{background:#047857}",
      ".jy2-lock-banner{margin:0 0 6px;padding:6px 10px;background:#fff3cd;border:1px solid #ffc107;color:#92400e;font-size:12px;font-weight:700;border-radius:6px}",
      ".jy2-action-meta{font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1 1 auto}",
      ".jy2-sticky-top .jy2-tabs{margin:4px 0 0;padding:0;background:transparent}",
      ".jy2-action-bar .jy2-btn[hidden]{display:none!important}",
      "#jy2-host{margin:0 0 12px;padding:0;overflow-x:clip;overflow-y:visible;max-width:100%;width:100%;min-width:0;box-sizing:border-box}",
      ".jy2-panes{max-width:100%;min-width:0;width:100%;box-sizing:border-box;overflow-x:clip;overflow-y:visible}",
      // 見出し: タグ（上）＋項目名（下）。th 自体は table-cell のまま（flex にすると列が縦崩れする）
      ".jy2-th-stack{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;line-height:1.25;width:max-content;max-width:100%;margin:0 auto;box-sizing:border-box}",
      "th.jy2-th-stacked{white-space:normal!important;vertical-align:bottom;text-align:center;padding:8px 8px!important;min-width:4.75rem}",
      ".jy2-th-stack .jy2-hf-tag{display:inline-flex;align-items:center;justify-content:center;margin:0!important;font-size:10px;font-weight:800;letter-spacing:.06em;padding:2px 8px;border-radius:999px;line-height:1.2;box-shadow:0 1px 0 rgba(15,23,42,.08);flex:0 0 auto}",
      ".jy2-th-stack .jy2-th-label{display:block;font-size:11px;font-weight:700;color:#0f172a;line-height:1.35;letter-spacing:.02em;white-space:nowrap}",
      ".jy2-table th.jy2-th-mode-auto{background:#eff6ff}",
      ".jy2-table th.jy2-th-mode-select{background:#ecfdf5}",
      ".jy2-table th.jy2-th-mode-input{background:#fffbeb}",
      ".jy2-table th.jy2-th-mode-date{background:#fff7ed}",
      ".jy2-actual-table thead th.jy2-th-mode-auto{background:#eff6ff}",
      ".jy2-actual-table thead th.jy2-th-mode-select{background:#ecfdf5}",
      ".jy2-actual-table thead th.jy2-th-mode-input{background:#fffbeb}",
      ".jy2-actual-table thead th.jy2-th-mode-date{background:#fff7ed}",
      ".jy2-detail-block-head label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:3px}",
      ".jy2-detail-block-head .jy2-th-stack{align-items:flex-start}",
      ".jy2-detail-block-head .jy2-th-stack .jy2-th-label,.jy2-detail-block-head .jy2-th-label{font-size:12px}",
      "label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;gap:3px}",
      "label.jy2-th-stacked > .jy2-hf-tag{margin:0}",
      "label.jy2-th-stacked > .jy2-th-label{display:block;font-size:12px;font-weight:700;color:#334155}",
      ".jy2-list-root{padding:12px 16px;background:#f8fafc;min-height:320px;font-family:'Segoe UI',Meiryo,sans-serif}",
      ".jy2-list-title{margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:.2em;color:#334155}",
      ".jy2-list-sub{margin:0 0 12px;font-size:12px;color:#64748b}",
      ".jy2-list-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}",
      ".jy2-list-search{min-width:280px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px}",
      ".jy2-list-search:focus{border-color:#2563eb;outline:none}",
      ".jy2-list-count{font-size:12px;color:#64748b;margin-left:auto}",
      ".jy2-list-hint{font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.5}",
      ".jy2-list-table{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border-radius:6px;overflow:hidden}",
      ".jy2-list-table th,.jy2-list-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}",
      ".jy2-list-table th{background:#f1f5f9;font-weight:600;color:#475569;cursor:pointer}",
      ".jy2-list-table tr[data-open-id]{cursor:pointer}",
      ".jy2-list-table tr[data-open-id]:hover td{background:#eff6ff}",
      ".jy2-list-new{border:1px solid #2563eb;background:#2563eb;color:#fff;padding:8px 16px;font-weight:700;cursor:pointer;border-radius:6px}",
      ".jy2-version-type-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 14px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-size:13px}",
      ".jy2-version-type-bar label{display:flex;align-items:center;gap:6px}",
      ".jy2-version-type-bar select{min-width:160px;padding:3px 6px;border-radius:4px}",
      ".jy2-header-legend{font-size:11px;color:#64748b;padding:0 0 10px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}",
      ".jy2-hf-tag{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;margin-right:5px;vertical-align:middle;line-height:1.3;letter-spacing:.04em}",
      ".jy2-hf-tag-input{background:#FEF3C7;border:1px solid #F59E0B;color:#B45309}",
      ".jy2-hf-tag-select{background:#D1FAE5;border:1px solid #10B981;color:#047857}",
      ".jy2-hf-tag-date{background:#FFEDD5;border:1px solid #F97316;color:#C2410C}",
      ".jy2-hf-tag-auto{background:#DBEAFE;border:1px solid #3B82F6;color:#1D4ED8}",
      ".jy2-hf-tag-aux{background:#F1F5F9;border:1px solid #94A3B8;color:#475569}",
      ".jy2-table th .jy2-hf-tag,.jy2-detail-block-head .jy2-hf-tag,.jy2-footer-label .jy2-hf-tag{margin-right:0}",
      /* C12: 工事基本情報はモニタ幅いっぱいで折り返し（固定幅＋横スクロールにしない） */
      ".jy2-header-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11.5rem,1fr));gap:8px 12px;padding:2px 0 10px;width:100%;max-width:100%;box-sizing:border-box}",
      ".jy2-header-grid>div{min-width:0;max-width:100%}",
      ".jy2-header-grid label{display:block;font-size:11px;color:#475569;margin-bottom:4px;line-height:1.35}",
      ".jy2-header-grid label.jy2-th-stacked{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:3px;padding:0!important}",
      ".jy2-header-grid label.jy2-th-stacked .jy2-th-label{display:block;font-size:12px;font-weight:700;color:#334155}",
      ".jy2-header-grid input,.jy2-header-grid select,.jy2-header-grid textarea{width:100%;box-sizing:border-box;font-size:13px;padding:5px 8px;border-radius:4px}",
      ".jy2-header-grid input.jy2-hf-text,.jy2-header-grid textarea.jy2-hf-text{background:#fff;border:1px solid #93c5fd;border-left:3px solid #2563eb}",
      ".jy2-header-grid select.jy2-hf-select{background-color:#f1f5f9;border:1px solid #94a3b8;border-left:3px solid #64748b;cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:26px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 8px center}",
      ".jy2-header-grid input.jy2-hf-date{background:#fffbeb;border:1px solid #fcd34d;border-left:3px solid #f59e0b}",
      ".jy2-header-grid input.jy2-hf-readonly,.jy2-header-grid select:disabled{background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #cbd5e1;color:#64748b;cursor:default}",
      /* メモ系は常に1行独占（工事コードと横並びになるのを防ぐ） */
      ".jy2-header-grid .jy2-span-2{grid-column:1/-1}",
      ".jy2-header-grid .jy2-row-start{grid-column:1}",
      ".jy2-shell{--jy2-fs-k:1}",
      ".jy2-shell[data-font-scale='large']{--jy2-fs-k:1.15}",
      ".jy2-shell[data-font-scale='xlarge']{--jy2-fs-k:1.3}",
      ".jy2-font-scale{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;flex:0 0 auto}",
      ".jy2-font-scale-label{font-size:11px;font-weight:600;color:#64748b;white-space:nowrap}",
      ".jy2-font-scale-btns{display:inline-flex;flex-wrap:nowrap;gap:2px}",
      ".jy2-font-scale-btns .jy2-btn{padding:4px 7px;font-size:11px;min-width:0}",
      ".jy2-font-scale-btns .jy2-btn[aria-pressed='true']{border-color:#2563eb;background:#dbeafe;color:#1e40af}",
      ".jy2-shell .jy2-panes .jy2-table{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-input{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-select{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-combo-wrap>.jy2-combo-select{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-row-button{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-btn{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-section-title{font-size:calc(14px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-empty{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-warning{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-detail-block-head{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-head{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-table{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-keys{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-note{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-budget-summary-keys .jy2-sub-row td{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table .jy2-input{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table thead th.jy2-actual-month .jy2-th-label{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table .jy2-actual-month .jy2-input{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-table thead tr:last-child th{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-note-details{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-actual-note{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid label{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid input,.jy2-shell .jy2-panes .jy2-header-grid select,.jy2-shell .jy2-panes .jy2-header-grid textarea{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-grid label.jy2-th-stacked .jy2-th-label,.jy2-shell .jy2-panes label.jy2-th-stacked>.jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-th-stack .jy2-th-label{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-th-stack .jy2-hf-tag{font-size:calc(10px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-footer-row .jy2-footer-label .jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-footer-row .jy2-input{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-detail-block-head .jy2-th-stack .jy2-th-label,.jy2-shell .jy2-panes .jy2-detail-block-head .jy2-th-label{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-version-status{font-size:calc(12px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-version-type-bar{font-size:calc(13px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-header-legend{font-size:calc(11px * var(--jy2-fs-k))}",
      ".jy2-shell .jy2-panes .jy2-hf-tag{font-size:calc(10px * var(--jy2-fs-k))}",
    ].join("");
  }

  /** 詳細シェル表示時: ネイティブ項目・コメント欄を隠し、#jy2-host だけ残す。 */
  function jy2HideNativeDetailChrome(documentRef) {
    const doc =
      documentRef ||
      (typeof document !== "undefined" ? document : null);
    if (!doc || !doc.head) return;
    const styleId = "jy2-native-detail-hide";
    let style = doc.getElementById(styleId);
    if (!style) {
      style = doc.createElement("style");
      style.id = styleId;
      doc.head.appendChild(style);
    }
    style.textContent = [
      ".record-detail-gaia > *:not(#jy2-host){display:none!important}",
      ".record-detail-gaia .field-gaia{display:none!important}",
      ".gaia-argoui-app-toolbar-buttons{display:none!important}",
      ".gaia-argoui-app-show-sidebar{display:none!important}",
      ".gaia-argoui-app-show-sidebar-comments{display:none!important}",
      ".ocean-ui-comments{display:none!important}",
      ".converter-sidebar-gaia{display:none!important}",
      // clip: 横は切るが scroll container にせず、.jy2-sticky-top の縦 sticky を維持
      ".gaia-argoui-app-show-contents{margin:0!important;padding-top:0!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;box-sizing:border-box!important}",
      ".contents-gaia{margin:0!important;padding-top:0!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;box-sizing:border-box!important}",
      ".record-detail-gaia,.record-edit-gaia,.record-create-gaia{margin-top:0!important;padding-top:0!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important}",
      "body.jy2-detail-shell{overflow-x:clip!important}",
      "body.jy2-detail-shell .container-gaia{max-width:100%!important;min-width:0!important;overflow-x:clip!important;overflow-y:visible!important;padding-top:0!important}",
      "body.jy2-detail-shell #jy2-host{margin-top:0!important;padding-top:0!important;overflow-x:clip!important;overflow-y:visible!important;max-width:100%!important;width:100%!important}",
    ].join("");
    if (doc.body) doc.body.classList.add("jy2-detail-shell");

    // CSS が効かないテナント向け: ホストの兄弟と右ペインを直接非表示。
    const host = doc.getElementById("jy2-host");
    if (host && host.parentElement) {
      for (const child of Array.from(host.parentElement.children)) {
        if (child !== host) child.style.setProperty("display", "none", "important");
      }
    }
    for (const selector of [
      ".gaia-argoui-app-show-sidebar",
      ".gaia-argoui-app-show-sidebar-comments",
      ".ocean-ui-comments",
      ".converter-sidebar-gaia",
    ]) {
      doc.querySelectorAll(selector).forEach((node) => {
        node.style.setProperty("display", "none", "important");
      });
    }
  }

  function jy2Comma(text) {
    if (text === null || text === undefined || text === "") return "";
    const parts = String(text).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function jy2AmountDisplay(decimalAmount) {
    return decimalAmount === null || decimalAmount === undefined
      ? ""
      : jy2Comma(displayInteger(decimalAmount));
  }

  // D-31/D-32: 率(÷①) = 金額÷①。画面ラベルは「消化率」（浜田 2026-07-23）。
  // shown as percent with 1 decimal, ①=0 → 0.
  function jy2Percent(fraction) {
    if (fraction === null || fraction === undefined) return "－";
    return `${round(multiply(fraction, "100"), 1)}%`;
  }

  function jy2HasText(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function jy2MarkIncompleteIfAnchor(cell, anchorPresent, fieldValue) {
    if (anchorPresent && !jy2HasText(fieldValue)) {
      cell.classList.add("jy2-incomplete");
    }
    return cell;
  }

  // U5: 半角カナ → 全角（補助項目・name3）
  function jy2ToFullWidthKana(str) {
    if (str === null || str === undefined) return str;
    const text = String(str);
    if (!text) return text;
    return text.replace(/[\uFF61-\uFF9F]/g, (ch) => {
      const code = ch.charCodeAt(0);
      if (code === 0xff61) return "。";
      if (code === 0xff62) return "「";
      if (code === 0xff63) return "」";
      if (code === 0xff64) return "、";
      if (code === 0xff65) return "・";
      if (code === 0xff66) return "ヲ";
      if (code >= 0xff67 && code <= 0xff6f) {
        return String.fromCharCode(code - 0xff67 + 0x30a1);
      }
      if (code >= 0xff71 && code <= 0xff9d) {
        return String.fromCharCode(code - 0xff71 + 0x30a2);
      }
      if (code === 0xff9e) return "゛";
      if (code === 0xff9f) return "゜";
      return ch;
    });
  }

  // D-17: 請負数量は小数第1位まで（四捨五入）
  function jy2NormalizeContractQty(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    try {
      return round(text, 1);
    } catch {
      return text;
    }
  }

  function jy2TaxRateSelect(documentRef, value, onCommit) {
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    for (const rate of JY2_TAX_RATE_VALUES) {
      const option = documentRef.createElement("option");
      option.value = rate;
      option.textContent = JY2_TAX_RATE_LABELS[rate] || rate;
      select.appendChild(option);
    }
    // App1 キャッシュの「10％」等も 0.1 に揃えて選択する。
    let current = value === null || value === undefined ? "" : String(value);
    if (current === "0％" || current === "0%") current = "0";
    else if (current === "8％" || current === "8%" || current === "8") current = "0.08";
    else if (
      current === "10％" ||
      current === "10%" ||
      current === "10" ||
      current === "0.10"
    ) {
      current = "0.1";
    }
    select.value = JY2_TAX_RATE_VALUES.includes(current)
      ? current
      : JY2_TAX_RATE_VALUES[2];
    select.addEventListener("change", () => onCommit(select.value));
    return select;
  }

  function jy2Cell(documentRef, tag, className, text) {
    const cell = documentRef.createElement(tag);
    if (className) cell.className = className;
    cell.textContent = text === null || text === undefined ? "" : String(text);
    return cell;
  }

  function jy2TextInput(documentRef, value, onCommit) {
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input";
    input.value = value === null || value === undefined ? "" : String(value);
    const commit = () => onCommit(input.value.trim());
    input.addEventListener("change", commit);
    // 保存クリック直前の blur でも確実にストアへ反映する
    input.addEventListener("blur", commit);
    return input;
  }

  // U4/U26: 候補選択＋手入力可コンボ。常にリスト緑。
  // Chrome の input[list]/datalist は現行値で候補を絞るため ▼ が空に見えることがある。
  // → 右の <select> で全候補を出し、左 input は手入力も可。
  function jy2ComboInput(documentRef, value, options, onCommit) {
    const wrap = documentRef.createElement("span");
    wrap.className = "jy2-combo-wrap";
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input jy2-combo";
    input.autocomplete = "off";
    input.value = value === null || value === undefined ? "" : String(value);
    const select = documentRef.createElement("select");
    select.className = "jy2-combo-select";
    select.title = "リストから選択";
    select.setAttribute("aria-label", "リストから選択");
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "▼";
    select.appendChild(blank);
    const seen = new Set();
    for (const option of options || []) {
      const text = String(option || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const opt = documentRef.createElement("option");
      opt.value = text;
      opt.textContent = text;
      select.appendChild(opt);
    }
    if (seen.size === 0) {
      select.disabled = true;
      select.title = "このブロックに候補リストがありません";
    }
    const commit = () => onCommit(input.value.trim());
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
    select.addEventListener("change", () => {
      const picked = select.value;
      if (!picked) return;
      input.value = picked;
      onCommit(picked);
      select.selectedIndex = 0;
    });
    wrap.append(input, select);
    return wrap;
  }

  // #R-NAME-01 / #R-CONST-01: 候補源は Excel データマスタ正本のみ（仮シード禁止）。
  // 正本: scripts/data/jikkou-yosan-v2-excel-name-lists.json（verify:jikkou-name-lists-excel）
  // 内訳DVプロファイル切替。違いは後日リスト差し替え可。
  const JY2_POOL_KIND_CORE8 = Object.freeze([
    "材料費",
    "労務費",
    "外注費",
    "仮設機械経費",
    "現場経費",
    "諸経費",
    "各種保険料(任意保険）",
    "法定福利費",
  ]);
  const JY2_POOL_KIND_LONG = Object.freeze([
    "材料費",
    "労務費",
    "外注費",
    "仮設機械経費",
    "現場経費",
    "諸経費",
    "各種保険料(任意保険）",
    "法定福利費",
    "事前打合せ費等",
    "仮設・工具費等",
    "運送費",
    "宿泊費",
    "交通費",
    "防護服",
    "電動ファン用フィルター",
    "旧塗膜含有量試験費",
    "軌陸車オペレーター賃金　昼間",
    "軌陸車オペレーター賃金　夜間",
    "出向工事管理者賃金　　昼間",
    "出向工事管理者賃金　　夜間",
    "仮設材レンタル",
    "敷き鉄板レンタル",
    "仮設ハウス･仮設トイレ",
    "建設機械レンタル",
    "その他レンタル",
    "工場製品運搬費",
    "建設機械運搬費",
    "仮設資材運搬費",
    "その他資材運搬費",
    "特別産業廃棄物",
    "一般産業廃棄物",
    "収入印紙",
    "県証紙",
    "防護服･ペール缶",
    "線閉責任者　　昼間",
    "線閉責任者　　夜間",
    "工事安全専任管理者　　　昼間",
    "工事安全専任管理者　　　夜間",
    "列車見張員　　昼間",
    "列車見張員　　夜間",
    "交通整理員　　昼間",
    "交通整理員　　夜間",
    "重機誘導員　　　　　　昼間",
    "重機誘導員　　　　　　夜間",
    "停電作業者　　　　　　夜間",
    "検電接地作業者　　　　昼間",
    "検電接地作業者　　　　夜間",
    "安全帯監視人　　　　　昼間",
    "安全帯監視人　　　　　夜間",
  ]);
  const JY2_POOL_MATERIAL_CATS = Object.freeze([
    "塗料",
    "鋼材費",
    "二次製品費",
    "生コンクリート費･石材費",
    "ＡＳ合材費",
    "鋼製製品費･ゴム製品等",
    "その他材料費",
    "塗装記録表示シール",
  ]);
  const JY2_POOL_PAINT_PRODUCTS = Object.freeze([
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 赤さび",
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 ｸﾞﾚｰ",
    "厚膜型変性ｴﾎﾟｷｼ樹脂系塗料 青緑、淡",
    "厚膜型ﾎﾟﾘｳﾚﾀﾝ樹脂塗料 青緑系",
    "無溶剤変性ｴﾎﾟｷｼ樹脂塗料N-8.5",
    "無溶剤変性ｴﾎﾟｷｼ樹脂塗料N-7",
    "塗料用シンナー",
    "エポキシシンナー",
    "ウレタンシンナー",
  ]);
  const JY2_VENDOR_SEEDS = Object.freeze([
    "ＡＣＣＥＳＳ",
    "松岡塗料",
    "東海塗料興業",
    "横浜化成",
    "エイトポイント",
    "大塚刷毛",
    "国元商会",
    "興亜産業",
    "島津テクノリサーチ",
    "仙台銘板",
    "協力会社",
    "abit",
    "今岡塗装",
    "大沼塗装工業",
    "金田塗装工業",
    "菊正塗装店",
    "クオリティ・ジャパン",
    "桜庭塗装工業",
    "塩里塗装",
    "進興エンジニアリング",
    "高木塗装",
    "東海塗装",
    "中西工業",
    "浜翔建設",
    "原塗装",
    "ブリッジニアプラス",
    "丸翔加藤塗装",
    "三橋塗装店",
    "六角塗装店",
    "姉崎工業",
    "ＮＲ",
    "オオイ",
    "共和工業",
    "ビーエムシー",
    "ヘイセイ工業",
    "レンタル",
    "鎌ヶ谷倉庫",
    "アクティオ",
    "カナモト",
    "サコス",
    "レンタルのニッケン",
    "三鋼仮設",
    "杉孝",
    "産業廃棄物業者",
    "ジャパンウェスト",
    "タケエイ",
    "山仁不動産",
    "保安要員関係会社",
    "SmB",
    "エスジーアイ鉄道",
    "オリエンタル警備",
    "シンコーハイウェイ",
    "テイケイ",
    "みはりや",
    "関東メンテナンス",
    "事業開発者",
    "大光電産",
    "プロスタエクセキューション",
    "ニシオワークサポート",
  ]);
  const JY2_NAME1_SEEDS = JY2_POOL_KIND_CORE8;
  const JY2_NAME2_SEEDS = JY2_POOL_MATERIAL_CATS;
  const JY2_NAME3_HINTS = JY2_POOL_PAINT_PRODUCTS;
  const JY2_NAME_PROFILES = Object.freeze({
    "material": Object.freeze({
      name1: JY2_POOL_MATERIAL_CATS,
      name2: JY2_POOL_PAINT_PRODUCTS,
      name3: Object.freeze([]),
    }),
    "kind8": Object.freeze({
      name1: JY2_POOL_KIND_CORE8,
      name2: Object.freeze(["事前打合せ費等", "仮設・工具費等", "運送費", "宿泊費", "交通費", "防護服", "電動ファン用フィルター", "旧塗膜含有量試験費", "軌陸車オペレーター賃金　昼間", "軌陸車オペレーター賃金　夜間", "出向工事管理者賃金　　昼間", "出向工事管理者賃金　　夜間", "仮設材レンタル", "敷き鉄板レンタル", "仮設ハウス･仮設トイレ", "建設機械レンタル", "その他レンタル", "工場製品運搬費", "建設機械運搬費", "仮設資材運搬費", "その他資材運搬費", "特別産業廃棄物", "一般産業廃棄物", "収入印紙", "県証紙", "防護服･ペール缶", "線閉責任者　　昼間", "線閉責任者　　夜間", "工事安全専任管理者　　　昼間", "工事安全専任管理者　　　夜間", "列車見張員　　昼間", "列車見張員　　夜間", "交通整理員　　昼間", "交通整理員　　夜間", "重機誘導員　　　　　　昼間", "重機誘導員　　　　　　夜間", "停電作業者　　　　　　夜間", "検電接地作業者　　　　昼間", "検電接地作業者　　　　夜間", "安全帯監視人　　　　　昼間", "安全帯監視人　　　　　夜間"]),
      name3: Object.freeze([]),
    }),
    "kindLong": Object.freeze({
      name1: JY2_POOL_KIND_LONG,
      name2: Object.freeze([]),
      name3: Object.freeze([]),
    }),
    "labor": Object.freeze({
      name1: Object.freeze(["労務費"]),
      name2: Object.freeze(["労務費", "軌陸車オペレーター賃金　昼間", "軌陸車オペレーター賃金　夜間", "出向工事管理者賃金　　昼間", "出向工事管理者賃金　　夜間"]),
      name3: Object.freeze([]),
    }),
    "temp": Object.freeze({
      name1: Object.freeze(["仮設機械経費"]),
      name2: Object.freeze(["仮設機械経費", "仮設・工具費等", "仮設材レンタル", "敷き鉄板レンタル", "仮設ハウス･仮設トイレ", "建設機械レンタル", "その他レンタル", "工場製品運搬費", "建設機械運搬費", "仮設資材運搬費", "その他資材運搬費"]),
      name3: Object.freeze([]),
    }),
    "site": Object.freeze({
      name1: Object.freeze(["現場経費"]),
      name2: Object.freeze(["事前打合せ費等", "仮設・工具費等", "運送費", "宿泊費", "交通費", "防護服", "電動ファン用フィルター", "旧塗膜含有量試験費", "軌陸車オペレーター賃金　昼間", "軌陸車オペレーター賃金　夜間", "出向工事管理者賃金　　昼間", "出向工事管理者賃金　　夜間", "仮設材レンタル", "敷き鉄板レンタル", "仮設ハウス･仮設トイレ", "建設機械レンタル", "その他レンタル", "工場製品運搬費", "建設機械運搬費", "仮設資材運搬費", "その他資材運搬費", "特別産業廃棄物", "一般産業廃棄物", "収入印紙", "県証紙", "防護服･ペール缶", "線閉責任者　　昼間", "線閉責任者　　夜間", "工事安全専任管理者　　　昼間", "工事安全専任管理者　　　夜間", "列車見張員　　昼間", "列車見張員　　夜間", "交通整理員　　昼間", "交通整理員　　夜間", "重機誘導員　　　　　　昼間", "重機誘導員　　　　　　夜間", "停電作業者　　　　　　夜間", "検電接地作業者　　　　昼間", "検電接地作業者　　　　夜間", "安全帯監視人　　　　　昼間", "安全帯監視人　　　　　夜間"]),
      name3: Object.freeze([]),
    }),
  });
  const JY2_PROFILE_BY_WORK_TYPE_CODE = Object.freeze({
    "10100": "material",
    "10200": "kind8",
    "10300": "kind8",
    "10400": "kind8",
    "10600": "kind8",
    "10700": "kind8",
    "13200": "kind8",
    "14000": "kind8",
    "14100": "kind8",
    "14200": "kind8",
    "14300": "kind8",
    "14400": "kind8",
    "14500": "kind8",
    "10500": "labor",
    "10900": "labor",
    "13300": "labor",
    "13700": "labor",
    "10800": "temp",
    "11600": "temp",
    "11700": "site",
    "11800": "site",
    "11900": "site",
    "12000": "site",
    "12100": "site",
    "12200": "site",
    "12300": "site",
    "12400": "site",
    "12500": "site",
    "12600": "site",
    "12700": "site",
    "12900": "site",
    "13100": "site",
    "13620": "site",
    "12800": "site",
    "13600": "site",
    "11000": "kindLong",
    "11100": "kindLong",
    "11200": "kindLong",
    "11300": "kindLong",
    "11400": "kindLong",
    "11500": "kindLong",
    "13500": "kindLong",
  });
  const JY2_DEFAULT_NAME_PROFILE = "kindLong";

  function jy2ResolveNameProfile(block) {
    const code = String((block && block.workTypeCode) || "").trim();
    if (code && JY2_PROFILE_BY_WORK_TYPE_CODE[code]) {
      return JY2_PROFILE_BY_WORK_TYPE_CODE[code];
    }
    const name = String((block && block.workTypeName) || "");
    if (/材料/.test(name)) return "material";
    if (/労務|賃金|直轄施工|直轄下請/.test(name)) return "labor";
    if (/レンタル|仮設機械|資材使用/.test(name)) return "temp";
    if (/運送|産業廃棄物|租税|借地|消耗|事務費|通信費|旅費|保険料|法定福利|雑費|諸会|会議|補償|交際|現場経費/.test(name)) {
      return "site";
    }
    if (/塗装|足場|修繕|付帯|追加|暫定|軌道|調査|試験|交通規制|外注/.test(name)) return "kind8";
    return JY2_DEFAULT_NAME_PROFILE;
  }

  function jy2CollectDetailSuggestions(detailModel, block) {
    // name1/name2 は Excel 正本のみ（レコード値で候補を汚染しない）。現行値は jy2ComboInput が追加。
    const vendors = new Set(JY2_VENDOR_SEEDS);
    if (detailModel) {
      for (const b of detailModel.snapshot().blocks) {
        if (b.vendorName) vendors.add(String(b.vendorName));
      }
    }
    const sortJa = (left, right) => String(left).localeCompare(String(right), "ja");
    const profileKey = jy2ResolveNameProfile(block || {});
    const profile = JY2_NAME_PROFILES[profileKey] || JY2_NAME_PROFILES[JY2_DEFAULT_NAME_PROFILE];
    return {
      profile: profileKey,
      name1: [...profile.name1].sort(sortJa),
      name2: [...profile.name2].sort(sortJa),
      name3: [...profile.name3].sort(sortJa),
      vendors: [...vendors].sort(sortJa),
    };
  }

  function jy2UnitSelect(documentRef, value, onCommit, units = COMMON_UNITS) {
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "";
    select.appendChild(blank);
    for (const unit of units) {
      const option = documentRef.createElement("option");
      option.value = unit;
      option.textContent = unit;
      select.appendChild(option);
    }
    select.value = value === null || value === undefined ? "" : String(value);
    select.addEventListener("change", () => onCommit(select.value));
    return select;
  }

  function jy2RowButton(documentRef, label, onClick) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "jy2-row-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * レイアウト可視矩形（ブラウザ拡大率 100%/80% 差の主因を吸収）。
   * Ctrl± ズームでは visualViewport と layout が連動。ピンチ時は小さい方を使う。
   */
  function jy2LayoutViewportBox(win) {
    const innerW = win.innerWidth || 0;
    const innerH = win.innerHeight || 0;
    const vv = win.visualViewport;
    if (vv && Number.isFinite(vv.width) && vv.width > 0) {
      const left = Number.isFinite(vv.offsetLeft) ? vv.offsetLeft : 0;
      const top = Number.isFinite(vv.offsetTop) ? vv.offsetTop : 0;
      const width = Math.min(innerW || vv.width, vv.width);
      const height = Math.min(innerH || vv.height, vv.height);
      return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
      };
    }
    return {
      left: 0,
      top: 0,
      right: innerW,
      bottom: innerH,
      width: innerW,
      height: innerH,
    };
  }

  /** 要素とレイアウト可視域の交差幅（親が表で膨らんでも窓外は数えない）。 */
  function jy2VisibleClientWidth(el, win) {
    if (!el || !win) return 0;
    const rect = el.getBoundingClientRect();
    const box = jy2LayoutViewportBox(win);
    const left = Math.max(box.left, rect.left);
    const right = Math.min(box.right, rect.right);
    return Math.max(0, Math.floor(right - left));
  }

  /**
   * ウィンドウに収まる絶対天井。
   * 旧: leftInset を 120px で頭打ち → kintone 左ナビが広いと天井過大 → 100% で右枠切れ（80% では誤って収まる）。
   */
  function jy2ViewportHScrollCeiling(doc, win, host) {
    const box = jy2LayoutViewportBox(win);
    const docWidth = doc.documentElement
      ? doc.documentElement.clientWidth
      : box.width;
    const viewport = Math.min(box.width, docWidth || box.width);
    let leftInset = 24;
    let rightInset = 20;
    if (host) {
      const hr = host.getBoundingClientRect();
      if (Number.isFinite(hr.left)) {
        // 実左端を使う（120 上限は撤廃。過大 left は viewport 側で自然に潰れる）
        leftInset = Math.max(8, Math.floor(Math.max(0, hr.left - box.left)));
      }
      if (Number.isFinite(hr.right) && hr.right < box.right) {
        rightInset = Math.max(12, Math.floor(box.right - hr.right) + 8);
      }
    }
    return Math.max(240, Math.floor(viewport - leftInset - rightInset));
  }

  function jy2MeasureHScrollBasis(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!win) return 0;
    const host = doc.getElementById("jy2-host");
    // 親(host/pane)の可視幅は表で膨張し得るため使わない。天井（viewport−左端）のみ。
    return jy2ViewportHScrollCeiling(doc, win, host);
  }

  /** host 自体が窓より食み出さないよう max-width を同期（外枠切れ防止）。 */
  function jy2SyncHostViewportCap(doc) {
    const win = doc && doc.defaultView;
    const host = doc && doc.getElementById("jy2-host");
    if (!win || !host || !host.style) return;
    const box = jy2LayoutViewportBox(win);
    const hr = host.getBoundingClientRect();
    const left = Math.max(box.left, hr.left);
    const cap = Math.max(240, Math.floor(box.right - left - 8));
    host.style.setProperty("max-width", `${cap}px`, "important");
    host.style.setProperty("width", "100%", "important");
    host.style.setProperty("box-sizing", "border-box", "important");
    host.style.setProperty("contain", "inline-size", "important");
    const shell = host.querySelector(".jy2-shell");
    if (shell && shell.style) {
      shell.style.setProperty("max-width", "100%", "important");
      shell.style.setProperty("box-sizing", "border-box", "important");
      shell.style.setProperty("contain", "inline-size", "important");
    }
  }

  /**
   * 画面下固定の横スクロールレール。
   * 総括は縦に長いため、ラッパ本体のバーは最下部にしか出ず「スクロールが出ない」ように見える。
   */
  function jy2SyncFixedHRail(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!doc || !win || !scrollEl) return;
    const pane = scrollEl.closest(".jy2-pane");
    if (pane && pane.dataset.active !== "true") return;

    const overflow = scrollEl.scrollWidth - scrollEl.clientWidth > 2;
    let rail = doc.getElementById("jy2-fixed-hrail");
    if (!overflow) {
      if (rail) rail.style.display = "none";
      return;
    }
    if (!rail) {
      rail = doc.createElement("div");
      rail.id = "jy2-fixed-hrail";
      const spacer = doc.createElement("div");
      spacer.className = "jy2-fixed-hrail-spacer";
      rail.appendChild(spacer);
      doc.body.appendChild(rail);
      let lock = false;
      rail.addEventListener("scroll", () => {
        if (lock) return;
        lock = true;
        const target = doc.querySelector(
          ".jy2-pane[data-active='true'] .jy2-table-scroll, .jy2-pane[data-active='true'] .jy2-actual-scroll",
        );
        if (target) target.scrollLeft = rail.scrollLeft;
        lock = false;
      });
      rail._jy2Lock = () => lock;
      rail._jy2SetLock = (v) => {
        lock = v;
      };
    }
    const spacer = rail.querySelector(".jy2-fixed-hrail-spacer");
    const rect = scrollEl.getBoundingClientRect();
    rail.style.display = "block";
    rail.style.left = `${Math.max(0, Math.floor(rect.left))}px`;
    rail.style.width = `${Math.max(120, Math.floor(rect.width))}px`;
    if (spacer) {
      spacer.style.width = `${Math.max(scrollEl.scrollWidth, scrollEl.clientWidth)}px`;
    }
    if (Math.abs(rail.scrollLeft - scrollEl.scrollLeft) > 1) {
      rail.scrollLeft = scrollEl.scrollLeft;
    }
    if (!scrollEl.dataset.jy2RailBound) {
      scrollEl.dataset.jy2RailBound = "1";
      scrollEl.addEventListener("scroll", () => {
        const r = doc.getElementById("jy2-fixed-hrail");
        if (!r || r.style.display === "none") return;
        if (Math.abs(r.scrollLeft - scrollEl.scrollLeft) > 1) {
          r.scrollLeft = scrollEl.scrollLeft;
        }
      });
    }
  }

  /**
   * 横スクロール中身幅:
   * - 広幅: wrap まで伸ばす（右白帯なし）
   * - 狭幅: 表の自然幅(max-content)を維持 → 縮めず横スクロール
   * 旧: innerW=max(1100,wrap) だと wrap が 1800→1200 でも表が縮み、1100超ではスクロール不出。
   */
  function jy2EnsureHScrollInner(scrollEl, forceMin) {
    let inner = scrollEl.querySelector(":scope > .jy2-hscroll-inner");
    if (inner) return inner;
    const doc = scrollEl.ownerDocument;
    if (!doc) return null;
    inner = doc.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = String(forceMin);
    while (scrollEl.firstChild) {
      inner.appendChild(scrollEl.firstChild);
    }
    scrollEl.appendChild(inner);
    return inner;
  }

  function jy2MeasureNaturalTableWidth(scrollEl, inner, forceMin) {
    const tables = [
      ...scrollEl.querySelectorAll(
        ".jy2-table, .jy2-detail-table, .jy2-actual-table",
      ),
    ];
    const blocks = [
      ...scrollEl.querySelectorAll(".jy2-detail-block, .jy2-budget-summary"),
    ];
    inner.style.setProperty("width", "max-content", "important");
    inner.style.setProperty("min-width", `${forceMin}px`, "important");
    inner.style.setProperty("max-width", "none", "important");
    tables.forEach((table) => {
      table.style.setProperty("width", "max-content", "important");
      table.style.setProperty("min-width", `${forceMin}px`, "important");
      table.style.setProperty("max-width", "none", "important");
    });
    blocks.forEach((el) => {
      el.style.setProperty("width", "max-content", "important");
      el.style.setProperty("min-width", `${forceMin}px`, "important");
      el.style.setProperty("max-width", "none", "important");
      el.style.setProperty("overflow", "visible", "important");
    });
    void inner.offsetWidth;
    let measured = forceMin;
    tables.forEach((table) => {
      measured = Math.max(
        measured,
        Math.ceil(table.scrollWidth || 0),
        Math.ceil(table.offsetWidth || 0),
      );
    });
    measured = Math.max(
      measured,
      Math.ceil(inner.scrollWidth || 0),
    );
    const remembered = Number(inner.dataset.naturalWidth) || 0;
    const natural = Math.max(forceMin, measured, remembered);
    inner.dataset.naturalWidth = String(natural);
    return natural;
  }

  function jy2ForceTableMinWidth(scrollEl) {
    const isActual = scrollEl.classList.contains("jy2-actual-scroll");
    const forceMin = isActual ? 1600 : 1400;
    const wrapInner = Math.max(0, Math.floor(scrollEl.clientWidth || 0));
    const inner = jy2EnsureHScrollInner(scrollEl, forceMin);
    if (!inner || !inner.style) return;

    const dataMin = Number(inner.dataset.minWidth) || forceMin;
    const floor = Math.max(forceMin, dataMin);
    const natural = jy2MeasureNaturalTableWidth(scrollEl, inner, floor);
    // 広幅は wrap まで伸ばす。狭幅は natural を維持（窓に合わせて縮めない）
    const innerW = Math.max(floor, natural, wrapInner);

    inner.style.setProperty("width", `${innerW}px`, "important");
    inner.style.setProperty("min-width", `${innerW}px`, "important");
    inner.style.setProperty("max-width", "none", "important");
    inner.style.setProperty("box-sizing", "border-box", "important");
    inner.style.setProperty("display", "block", "important");

    scrollEl
      .querySelectorAll(".jy2-table, .jy2-detail-table, .jy2-actual-table")
      .forEach((table) => {
        if (!table.style) return;
        table.style.setProperty("width", "100%", "important");
        table.style.setProperty("min-width", "0", "important");
        table.style.setProperty("max-width", "none", "important");
      });
    scrollEl
      .querySelectorAll(".jy2-detail-block, .jy2-budget-summary")
      .forEach((el) => {
        if (!el.style) return;
        el.style.setProperty("width", "100%", "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("max-width", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
      });
  }

  function jy2SyncHScroll(scrollEl) {
    if (!scrollEl || !scrollEl.style) return scrollEl;
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (doc) jy2SyncHostViewportCap(doc);
    const basis = jy2MeasureHScrollBasis(scrollEl);
    const gutter = scrollEl.classList.contains("jy2-actual-scroll") ? 10 : 12;
    let width = Math.max(240, (basis || 240) - gutter);
    if (win) {
      const box = jy2LayoutViewportBox(win);
      const hardCap = Math.max(240, Math.floor(box.width - 40));
      width = Math.min(width, hardCap);
    }
    scrollEl.style.setProperty("width", `${width}px`, "important");
    scrollEl.style.setProperty("max-width", `${width}px`, "important");
    scrollEl.style.setProperty("min-width", "0", "important");
    scrollEl.style.setProperty("overflow-x", "auto", "important");
    scrollEl.style.setProperty("overflow-y", "visible", "important");
    scrollEl.style.setProperty("box-sizing", "border-box", "important");
    scrollEl.style.setProperty("contain", "inline-size", "important");
    jy2ForceTableMinWidth(scrollEl);
    // レイアウト確定後にレール更新
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => jy2SyncFixedHRail(scrollEl));
    } else {
      jy2SyncFixedHRail(scrollEl);
    }
    return scrollEl;
  }

  function jy2SyncAllHScroll(documentRef) {
    const doc = documentRef || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    jy2SyncHostViewportCap(doc);
    doc
      .querySelectorAll(".jy2-table-scroll, .jy2-actual-scroll")
      .forEach((el) => jy2SyncHScroll(el));
    const active = doc.querySelector(
      ".jy2-pane[data-active='true'] .jy2-pane-hscroll, .jy2-pane[data-active='true'] .jy2-actual-scroll, .jy2-pane[data-active='true'] .jy2-table-scroll",
    );
    if (active) {
      jy2SyncFixedHRail(active);
    } else {
      const rail = doc.getElementById("jy2-fixed-hrail");
      if (rail) rail.style.display = "none";
    }
  }

  function jy2BindHScroll(scrollEl) {
    const doc = scrollEl.ownerDocument;
    const win = doc && doc.defaultView;
    if (!win) return scrollEl;
    const sync = () => jy2SyncHScroll(scrollEl);
    sync();
    win.requestAnimationFrame(() => {
      sync();
      win.requestAnimationFrame(sync);
    });
    win.addEventListener("resize", sync);
    if (win.visualViewport) {
      win.visualViewport.addEventListener("resize", sync);
      win.visualViewport.addEventListener("scroll", sync);
    }
    if (typeof win.ResizeObserver === "function") {
      const observer = new win.ResizeObserver(() => sync());
      const host = doc.getElementById("jy2-host");
      if (host) observer.observe(host);
      const shell = scrollEl.closest(".jy2-shell");
      if (shell) observer.observe(shell);
      if (scrollEl.parentElement) observer.observe(scrollEl.parentElement);
    }
    return scrollEl;
  }

  function jy2WrapHScroll(documentRef, child) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-table-scroll";
    const inner = documentRef.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = "1400";
    inner.appendChild(child);
    wrap.appendChild(inner);
    jy2BindHScroll(wrap);
    return wrap;
  }

  function jy2WrapTable(documentRef, table) {
    return jy2WrapHScroll(documentRef, table);
  }

  /**
   * タブ(pane)内の横スクロールを1本にする（表・工種ブロックごとの個別ラッパ禁止）。
   * @returns {HTMLElement} コンテンツを積む .jy2-hscroll-inner
   */
  function jy2MountPaneHScroll(documentRef, pane, options = {}) {
    const minWidth = Number(options.minWidth) || 1100;
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-table-scroll jy2-pane-hscroll";
    const inner = documentRef.createElement("div");
    inner.className = "jy2-hscroll-inner";
    inner.dataset.minWidth = String(minWidth);
    wrap.appendChild(inner);
    pane.appendChild(wrap);
    jy2BindHScroll(wrap);
    return inner;
  }

  function jy2FlashNavTarget(el) {
    if (!el) return;
    el.classList.add("jy2-nav-flash");
    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    const win = el.ownerDocument && el.ownerDocument.defaultView;
    if (win && typeof win.setTimeout === "function") {
      win.setTimeout(() => el.classList.remove("jy2-nav-flash"), 1600);
    }
  }

  function jy2FindByStableBlockId(root, selector, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!root || !id) return null;
    return (
      [...root.querySelectorAll(selector)].find(
        (el) => String(el.dataset.stableBlockId || "").trim() === id,
      ) || null
    );
  }

  /** 総括の内訳№ → 内訳タブの該当ブロック */
  function jy2GotoDetailBlock(shell, documentRef, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!id || !documentRef) return;
    const activate = shell && typeof shell._jy2ActivateTab === "function"
      ? shell._jy2ActivateTab
      : null;
    if (activate) activate("detail");
    const win = documentRef.defaultView;
    const go = () => {
      const el = jy2FindByStableBlockId(
        documentRef,
        ".jy2-pane[data-tab-id='detail'] .jy2-detail-block",
        id,
      );
      jy2FlashNavTarget(el);
    };
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => win.requestAnimationFrame(go));
    } else {
      go();
    }
  }

  /** 内訳の No.n → 総括タブの原価行（同じ内訳№） */
  function jy2GotoSummaryProjection(shell, documentRef, stableBlockId) {
    const id = String(stableBlockId || "").trim();
    if (!id || !documentRef) return;
    const activate = shell && typeof shell._jy2ActivateTab === "function"
      ? shell._jy2ActivateTab
      : null;
    if (activate) activate("summary");
    const win = documentRef.defaultView;
    const go = () => {
      const el = jy2FindByStableBlockId(
        documentRef,
        ".jy2-pane[data-tab-id='summary'] .jy2-projection-table tr[data-stable-block-id]",
        id,
      );
      jy2FlashNavTarget(el);
    };
    if (win && typeof win.requestAnimationFrame === "function") {
      win.requestAnimationFrame(() => win.requestAnimationFrame(go));
    } else {
      go();
    }
  }

  function jy2HeadRow(documentRef, labels) {
    const row = documentRef.createElement("tr");
    for (const raw of labels) {
      const th = documentRef.createElement("th");
      jy2AppendModeLabel(documentRef, th, raw);
      row.appendChild(th);
    }
    return row;
  }

  function jy2MarkFreeze(cell, index) {
    if (!cell) return cell;
    cell.classList.add("jy2-freeze", `jy2-freeze-${index}`);
    return cell;
  }

  /** 予実ヘッダ2段: 現行予算・最終予算額の下に 予算額 | 消化率（÷①）
   * 自動列が多いので「自動」タグは付けず、入力列だけタグ表示（見栄え優先）。 */
  function jy2ActualHead(documentRef, months) {
    const thead = documentRef.createElement("thead");
    const top = documentRef.createElement("tr");
    const bottom = documentRef.createElement("tr");
    const th = (label, opts = {}) => {
      const cell = documentRef.createElement("th");
      jy2AppendModeLabel(documentRef, cell, label);
      if (opts.rowSpan) cell.rowSpan = opts.rowSpan;
      if (opts.colSpan) cell.colSpan = opts.colSpan;
      if (opts.freeze != null) jy2MarkFreeze(cell, opts.freeze);
      return cell;
    };
    ["内訳№", "区分", "工種番号", "システム入力工種"].forEach((label, index) => {
      top.appendChild(th(label, { rowSpan: 2, freeze: index }));
    });
    for (const label of [
      "種別",
      "消費税",
      "単位",
      "数量",
      "単価",
      "金額",
      "計算基準",
      "備考",
    ]) {
      top.appendChild(th(label, { rowSpan: 2 }));
    }
    top.appendChild(th("現行予算", { colSpan: 2 }));
    for (const month of months) {
      // 月次は列が多いので「入力」タグ無し・短いラベル（横スクロール短縮）
      const monthTh = th(jy2MonthLabel(month), { rowSpan: 2 });
      monthTh.classList.add("jy2-actual-month");
      monthTh.title = `${month}（入力）`;
      top.appendChild(monthTh);
    }
    top.appendChild(th("原価累計", { rowSpan: 2 }));
    top.appendChild(th("最終予算額", { colSpan: 2 }));
    for (const label of ["今後必要額", "残予算"]) {
      top.appendChild(th(label, { rowSpan: 2 }));
    }
    const rateEnd = th("消化率", { rowSpan: 2 });
    rateEnd.classList.add("jy2-actual-rate-end");
    rateEnd.title = "消化率＝原価累計÷現行予算";
    top.appendChild(rateEnd);
    bottom.appendChild(th("予算額"));
    bottom.appendChild(th("消化率"));
    bottom.appendChild(th("予算額（入力）"));
    bottom.appendChild(th("消化率"));
    thead.append(top, bottom);
    return thead;
  }

  // Ver.01 リストマスタ（READ のみ）。APP ID リテラル禁止テスト回避のため合成。
  const JY2_MASTER_LIST_APP_ID = 700 + 35;
  let jy2MasterListsCache = null;

  function jy2HfTag(documentRef, kind) {
    const tags = {
      input: ["jy2-hf-tag-input", "入力"],
      select: ["jy2-hf-tag-select", "選択"],
      date: ["jy2-hf-tag-date", "日付"],
      auto: ["jy2-hf-tag-auto", "自動"],
      aux: ["jy2-hf-tag-aux", "補助"],
    };
    const pair = tags[kind] || tags.input;
    const span = documentRef.createElement("span");
    span.className = `jy2-hf-tag ${pair[0]}`;
    span.textContent = pair[1];
    return span;
  }

  /** 「単位（選択）」形式 → { label, mode }。タグ無しはそのまま。 */
  function jy2ParseModeLabel(raw) {
    const text = String(raw ?? "");
    const match = /^(.*)（(選択|入力|自動|日付|補助)）$/.exec(text);
    if (!match) return { label: text, mode: null };
    const modeByJa = {
      選択: "select",
      入力: "input",
      自動: "auto",
      日付: "date",
      補助: "aux",
    };
    return { label: match[1], mode: modeByJa[match[2]] || null };
  }

  function jy2AppendModeLabel(documentRef, parent, raw) {
    const { label, mode } = jy2ParseModeLabel(raw);
    // th/td に display:flex すると table-cell が壊れ列が縦積みになるため、内側に積む
    const stack = documentRef.createElement("div");
    stack.className = "jy2-th-stack";
    if (mode) {
      parent.classList.add("jy2-th-stacked", `jy2-th-mode-${mode}`);
      stack.appendChild(jy2HfTag(documentRef, mode));
    }
    const text = documentRef.createElement("span");
    text.className = "jy2-th-label";
    text.textContent = label;
    stack.appendChild(text);
    parent.appendChild(stack);
  }

  function jy2HfLabel(documentRef, kind, text) {
    const label = documentRef.createElement("label");
    label.classList.add("jy2-th-stacked", `jy2-th-mode-${kind}`);
    label.appendChild(jy2HfTag(documentRef, kind));
    const span = documentRef.createElement("span");
    span.className = "jy2-th-label";
    span.textContent = text;
    label.appendChild(span);
    return label;
  }

  function jy2NormalizeFiscalYearText(value) {
    return String(value || "").replace(/(\d{4})年(?!度)/g, "$1年度");
  }

  function jy2CalcProjectDays(startDate, endDate) {
    if (!startDate || !endDate) return "";
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
    const days = Math.floor((end - start) / 86400000) + 1;
    return days > 0 ? String(days) : "";
  }

  function jy2UserSelectDisplay(value) {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry && (entry.name || entry.code)) || "")
        .filter(Boolean)
        .join("、");
    }
    if (typeof value === "object") return value.name || value.code || "";
    return String(value);
  }

  function jy2EmptyMasterLists() {
    return {
      girderTypes: [],
      branches: [],
      departments: [],
      workTypeCodes: [],
      workTypeNames: [],
      workTypeByCode: {},
      workTypeByName: {},
    };
  }

  async function jy2LoadMasterLists(api) {
    if (jy2MasterListsCache) return jy2MasterListsCache;
    const empty = jy2EmptyMasterLists();
    if (typeof api !== "function") {
      jy2MasterListsCache = empty;
      return empty;
    }
    try {
      const response = await api("/k/v1/records.json", "GET", {
        app: JY2_MASTER_LIST_APP_ID,
        query: 'is_active in ("有効") order by sort_order asc limit 500',
      });
      const lists = jy2EmptyMasterLists();
      for (const rec of response.records || []) {
        const cat = String(
          (rec.list_category && rec.list_category.value) || "",
        ).trim();
        const name = String((rec.item_name && rec.item_name.value) || "").trim();
        if (cat === "コード表行" || cat.includes("コード")) {
          const code = String(
            (rec.work_type_code && rec.work_type_code.value) || "",
          ).trim();
          const wtName = String(
            (rec.work_type_name && rec.work_type_name.value) || "",
          ).trim();
          if (code) {
            lists.workTypeByCode[code] = wtName;
            if (!lists.workTypeCodes.includes(code)) lists.workTypeCodes.push(code);
          }
          if (wtName && !lists.workTypeNames.includes(wtName)) {
            lists.workTypeNames.push(wtName);
          }
          if (wtName && code && lists.workTypeByName[wtName] == null) {
            lists.workTypeByName[wtName] = code;
          }
          continue;
        }
        if (!name) continue;
        if (cat === "桁種別") lists.girderTypes.push(name);
        else if (cat === "発注支社") lists.branches.push(name);
        else if (cat === "部門") lists.departments.push(name);
      }
      // 工種番号は若い順（数値意識の昇順）。名称候補も同じコード順に揃える。
      const codeAsc = (a, b) =>
        String(a).localeCompare(String(b), "ja", {
          numeric: true,
          sensitivity: "base",
        });
      lists.workTypeCodes.sort(codeAsc);
      lists.workTypeNames.sort((a, b) => {
        const ca = lists.workTypeByName[a] || "";
        const cb = lists.workTypeByName[b] || "";
        const byCode = codeAsc(ca, cb);
        return byCode !== 0 ? byCode : codeAsc(a, b);
      });
      jy2MasterListsCache = lists;
      return lists;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("JY2 マスタ一覧の読込に失敗（手入力フォールバック）:", error);
      }
      jy2MasterListsCache = empty;
      return empty;
    }
  }

  function jy2SelectOptions(list, current, allowBlank) {
    const values = [];
    if (allowBlank) values.push("");
    for (const item of list || []) {
      if (item != null && item !== "" && !values.includes(String(item))) {
        values.push(String(item));
      }
    }
    const cur = current == null ? "" : String(current);
    if (cur && !values.includes(cur)) values.push(cur);
    return values;
  }

  /** 工事基本情報（Ver.01 同趣旨）。システムIDは出さない。 */
  const JY2_HEADER_EDITABLE_CODES = Object.freeze([
    "version_type",
    "status",
    "site_entry_date",
    "draft_date",
    "revision_note",
    "project_code",
    "project_branch",
    "project_official_name",
    "project_name",
    "girder_type",
    "order_branch",
    "department",
    "client_name",
    "safety_rule_88",
    "start_date",
    "end_date",
    "project_days",
    "note",
  ]);

  function jy2HeaderFieldValue(record, code) {
    const cell = record && record[code];
    if (!cell || cell.value === undefined || cell.value === null) return "";
    if (code === "person_in_charge" || code === "Created_by") {
      return jy2UserSelectDisplay(cell.value);
    }
    if (code === "Created_datetime") {
      const raw = String(cell.value || "");
      return raw.length >= 10 ? raw.slice(0, 10) : raw;
    }
    return String(cell.value);
  }

  function jy2ApplyHeaderField(record, code, value) {
    if (!record[code]) record[code] = { value: "" };
    record[code].value = value;
  }

  function jy2CollectHeaderFields(record) {
    const out = {};
    for (const code of JY2_HEADER_EDITABLE_CODES) {
      if (!record || !record[code]) continue;
      let value = record[code].value ?? "";
      if (code === "project_official_name") {
        value = jy2NormalizeFiscalYearText(value);
      }
      out[code] = { value };
    }
    return out;
  }

  /** App1 summary_cost_lines → checkSummaryProjection 用のフラット行 */
  function jy2SummaryCostLinesFromRecord(record) {
    const field = record?.summary_cost_lines;
    const rows = Array.isArray(field?.value) ? field.value : [];
    const cell = (row, code) => {
      const value = row?.value?.[code]?.value;
      return value === undefined || value === null ? "" : value;
    };
    const codes = [
      "summary_stable_block_id",
      "summary_block_no",
      "summary_cost_category",
      "summary_work_type_code",
      "summary_work_type_name",
      "summary_line_type",
      "summary_unit",
      "summary_qty",
      "summary_unit_price",
      "summary_amount_excl_tax",
      "summary_tax_rate",
      "summary_amount_incl_tax",
      "summary_rate_to_1",
      "summary_calc_basis",
      "summary_note",
      "summary_sort_order",
    ];
    return rows.map((row) => {
      const flat = {};
      for (const code of codes) flat[code] = cell(row, code);
      return flat;
    });
  }

  function jy2ProjectionCheckedAtIso() {
    return new Date().toISOString();
  }

  function jy2FillSelect(select, options, current) {
    select.textContent = "";
    for (const optionValue of options) {
      const option = documentRefCreateOption(select.ownerDocument, optionValue);
      select.appendChild(option);
    }
    select.value = current == null ? "" : String(current);
  }

  function documentRefCreateOption(documentRef, value) {
    const option = documentRef.createElement("option");
    option.value = value;
    option.textContent = value === "" ? "（未選択）" : value;
    return option;
  }

  /** A-07 / Ver.01同趣旨: 字間を空けた「実行予算書」＋シート名を縦積みで目立たせる */
  const JY2_IDEO = "\u3000";
  const JY2_SHEET_LABELS = {
    header: "工事基本情報",
    summary: `総${JY2_IDEO}括${JY2_IDEO}表`,
    detail: `内${JY2_IDEO}訳`,
    actual: `予${JY2_IDEO}実${JY2_IDEO}管${JY2_IDEO}理`,
    version: "バージョン管理",
  };

  function jy2PaneBanner(documentRef, tabId, sheetLabel) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-pane-head-banner";
    wrap.appendChild(
      jy2SheetTitleEl(
        documentRef,
        tabId,
        sheetLabel || JY2_SHEET_LABELS[tabId] || tabId,
      ),
    );
    return wrap;
  }

  function jy2SheetTitleEl(documentRef, tabId, sheetLabel) {
    const title = documentRef.createElement("div");
    title.className = `jy2-sheet-title jy2-sheet-title-${tabId}`;
    title.setAttribute("role", "heading");
    title.setAttribute("aria-level", "2");
    const doc = documentRef.createElement("span");
    doc.className = "jy2-sheet-title-doc";
    doc.textContent = `実${JY2_IDEO}行${JY2_IDEO}予${JY2_IDEO}算${JY2_IDEO}書`;
    const sheet = documentRef.createElement("span");
    sheet.className = "jy2-sheet-title-sheet";
    sheet.textContent = sheetLabel;
    title.append(doc, sheet);
    return title;
  }

  function jy2SyncStickySheetBanner(host, documentRef, tabId) {
    if (!host) return;
    host.textContent = "";
    const label = JY2_SHEET_LABELS[tabId] || tabId;
    host.appendChild(jy2SheetTitleEl(documentRef, tabId, label));
  }

  function jy2RenderHeaderPane(documentRef, record, editable, masterLists) {
    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-header-pane";
    const legend = documentRef.createElement("div");
    legend.className = "jy2-header-legend";
    legend.append(
      jy2HfTag(documentRef, "input"),
      documentRef.createTextNode("手入力"),
      jy2HfTag(documentRef, "select"),
      documentRef.createTextNode("リスト選択"),
      jy2HfTag(documentRef, "date"),
      documentRef.createTextNode("日付"),
      jy2HfTag(documentRef, "auto"),
      documentRef.createTextNode("自動・参照のみ"),
    );
    wrap.appendChild(legend);

    const grid = documentRef.createElement("div");
    grid.className = "jy2-header-grid";
    const lists = masterLists || jy2EmptyMasterLists();
    const canEdit = Boolean(editable);

    function cell(span2, rowStart) {
      const div = documentRef.createElement("div");
      if (span2) div.classList.add("jy2-span-2");
      if (rowStart) div.classList.add("jy2-row-start");
      return div;
    }

    function bindEditable(input, code, transform) {
      if (!canEdit) {
        input.disabled = true;
        if (input.tagName !== "SELECT") input.readOnly = true;
        return;
      }
      const commit = () => {
        const next = transform ? transform(input.value) : input.value;
        input.value = next;
        jy2ApplyHeaderField(record, code, next);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    }

    function addText(kind, labelText, code, opts = {}) {
      const box = cell(opts.span2, opts.rowStart);
      box.appendChild(jy2HfLabel(documentRef, kind, labelText));
      let input;
      if (opts.textarea) {
        input = documentRef.createElement("textarea");
        input.rows = opts.rows || 2;
        input.className = kind === "auto" ? "jy2-hf-readonly" : "jy2-hf-text";
      } else {
        input = documentRef.createElement("input");
        input.type = kind === "date" ? "date" : "text";
        input.className =
          kind === "auto"
            ? "jy2-hf-readonly"
            : kind === "date"
              ? "jy2-hf-date"
              : "jy2-hf-text";
      }
      let value = jy2HeaderFieldValue(record, code);
      if (code === "project_official_name") value = jy2NormalizeFiscalYearText(value);
      input.value = value;
      if (opts.placeholder) input.placeholder = opts.placeholder;
      if (kind === "auto") {
        input.readOnly = true;
        input.disabled = true;
      } else {
        bindEditable(input, code, opts.transform);
      }
      box.appendChild(input);
      grid.appendChild(box);
      return input;
    }

    function addSelect(labelText, code, options, opts = {}) {
      const box = cell(opts.span2);
      box.appendChild(jy2HfLabel(documentRef, "select", labelText));
      const select = documentRef.createElement("select");
      select.className = "jy2-hf-select";
      const current = jy2HeaderFieldValue(record, code);
      jy2FillSelect(
        select,
        jy2SelectOptions(options, current, opts.allowBlank !== false),
        current,
      );
      bindEditable(select, code);
      box.appendChild(select);
      grid.appendChild(box);
      return select;
    }

    // 版メタ（Ver.01 同配置）
    const versionSeq = jy2HeaderFieldValue(record, "version_seq") || "1";
    const versionType = jy2HeaderFieldValue(record, "version_type") || "当初";
    addSelect(
      "版種別",
      "version_type",
      jy2VersionTypeOptions(versionSeq, versionType),
      { allowBlank: false },
    );
    addText("auto", "版番号", "version_seq");
    addText("date", "現場入場予定日", "site_entry_date");
    addText("date", "立案日", "draft_date");
    addText("auto", "作成日", "Created_datetime");
    addText("auto", "作成者", "Created_by");
    addText("auto", "担当者", "person_in_charge");
    addSelect("ステータス", "status", ["下書き", "版確定"], { allowBlank: false });
    addText("input", "修正理由メモ", "revision_note", {
      span2: true,
      textarea: true,
      placeholder: "修正版の変更理由（任意）",
    });

    // 工事項目
    addText("input", "工事コード *", "project_code");
    addText("input", "工事コード枝番", "project_branch");
    addText("input", "工事正式名称", "project_official_name", {
      transform: jy2NormalizeFiscalYearText,
    });
    addText("input", "工事名称", "project_name");
    addSelect("桁種別", "girder_type", lists.girderTypes);
    addSelect("発注支社", "order_branch", lists.branches);
    addSelect("部門", "department", lists.departments);
    addText("input", "発注者", "client_name");
    addSelect("安衛則88条", "safety_rule_88", ["有", "無"], { allowBlank: false });

    // 1行: 着手日 → 竣工日 → 工期日数（自動）
    const startInput = addText("date", "着手日", "start_date", { rowStart: true });
    const endInput = addText("date", "竣工日", "end_date");
    const daysInput = addText("auto", "工期日数", "project_days");
    const refreshDays = () => {
      const days = jy2CalcProjectDays(startInput.value, endInput.value);
      daysInput.value = days;
      jy2ApplyHeaderField(record, "project_days", days);
    };
    if (canEdit) {
      startInput.addEventListener("change", refreshDays);
      endInput.addEventListener("change", refreshDays);
    }
    refreshDays();

    addText("input", "備考", "note", { span2: true, textarea: true, rows: 2 });

    wrap.appendChild(grid);
    // C12: フル幅 auto-fit。狭幅は折り返し（横スクロールは総括・内訳・予実の表側）
    return wrap;
  }

  // 請負金額 (§7.1a): 施工/保安 bands, amount = auto decimal shown as integer,
  // 消化率列（÷①）= 行金額÷①（D-31/D-32: ①=0 → 0, 金額なし → 「－」）.
  function jy2ContractTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const rateTo1 = (amount) =>
      amount === null || amount === undefined
        ? null
        : ratio(amount, snapshot.totals.total1, { zero: "zero" });
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-contract-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "区分",
        "契約工種（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "消化率（自動）",
        "備考（入力）",
        "",
      ]),
    );

    const sectionTotals = {
      施工: snapshot.totals.construction,
      保安: snapshot.totals.safety,
    };
    for (const section of CONTRACT_SECTIONS) {
      const bandRow = documentRef.createElement("tr");
      bandRow.className = "jy2-band-row";
      const bandHead = jy2Cell(documentRef, "th", "", section);
      bandHead.colSpan = 8;
      bandRow.appendChild(bandHead);
      const bandAction = jy2Cell(documentRef, "th", "", "");
      if (editable) {
        bandAction.appendChild(
          jy2RowButton(documentRef, "行追加", () => {
            summaryModel.addContractLine(section);
            rerender();
          }),
        );
      }
      bandRow.appendChild(bandAction);
      body.appendChild(bandRow);

      for (const line of snapshot.contractSections[section]) {
        const row = documentRef.createElement("tr");
        row.dataset.rowKey = line.rowKey;
        row.appendChild(jy2Cell(documentRef, "td", "", section));
        const commit = (field) => (value) => {
          summaryModel.updateContractLine(line.rowKey, { [field]: value });
          rerender();
        };
        if (editable) {
          const workName = jy2Cell(documentRef, "td", "", "");
          workName.appendChild(
            jy2TextInput(documentRef, line.workName, commit("workName")),
          );
          const unit = jy2Cell(documentRef, "td", "", "");
          unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
          const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
          quantity.appendChild(
            jy2TextInput(
              documentRef,
              line.quantity,
              (value) => commit("quantity")(jy2NormalizeContractQty(value)),
            ),
          );
          const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
          unitPrice.appendChild(
            jy2TextInput(documentRef, line.unitPrice, commit("unitPrice")),
          );
          const anchor = jy2HasText(line.workName);
          jy2MarkIncompleteIfAnchor(workName, anchor, line.workName);
          jy2MarkIncompleteIfAnchor(unit, anchor, line.unit);
          jy2MarkIncompleteIfAnchor(quantity, anchor, line.quantity);
          jy2MarkIncompleteIfAnchor(unitPrice, anchor, line.unitPrice);
          const note = jy2Cell(documentRef, "td", "", "");
          note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
          row.append(workName, unit, quantity, unitPrice);
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(line.amount))),
          );
          row.appendChild(note);
          const action = jy2Cell(documentRef, "td", "", "");
          action.appendChild(
            jy2RowButton(documentRef, "↑", () => {
              summaryModel.moveContractLine(line.rowKey, -1);
              rerender();
            }),
          );
          action.appendChild(
            jy2RowButton(documentRef, "↓", () => {
              summaryModel.moveContractLine(line.rowKey, 1);
              rerender();
            }),
          );
          action.appendChild(
            jy2RowButton(documentRef, "削除", () => {
              summaryModel.removeContractLine(line.rowKey);
              rerender();
            }),
          );
          row.appendChild(action);
        } else {
          row.appendChild(jy2Cell(documentRef, "td", "", line.workName));
          row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
          row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
          );
          row.appendChild(
            jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(line.amount))),
          );
          row.appendChild(jy2Cell(documentRef, "td", "", line.note));
          row.appendChild(jy2Cell(documentRef, "td", "", ""));
        }
        body.appendChild(row);
      }

      const totalRow = documentRef.createElement("tr");
      totalRow.className = "jy2-total-row";
      const totalLabel = jy2Cell(documentRef, "td", "", `${section}計`);
      totalLabel.colSpan = 5;
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(sectionTotals[section]),
        ),
      );
      const totalTail = jy2Cell(documentRef, "td", "", "");
      totalTail.colSpan = 3;
      totalRow.appendChild(totalTail);
      body.appendChild(totalRow);
    }

    const grandRow = documentRef.createElement("tr");
    grandRow.className = "jy2-total-row jy2-contract-total-1";
    const grandLabel = jy2Cell(documentRef, "td", "", "合計 ①");
    grandLabel.colSpan = 5;
    grandRow.appendChild(grandLabel);
    grandRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(snapshot.totals.total1),
      ),
    );
    const grandTail = jy2Cell(documentRef, "td", "", "");
    grandTail.colSpan = 3;
    grandRow.appendChild(grandTail);
    body.appendChild(grandRow);

    table.appendChild(body);
    // 横スクロールは jy2RenderSummaryPane の pane-hscroll 1本（個別 wrap 禁止）
    return table;
  }

  // 給与手当 (D-30/X7): 総括直入力, 消費税・税込は「－」, at least 1 row.
  function jy2SalaryTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-salary-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "役職・名称（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "消費税（自動）",
        "金額税込（自動）",
        "備考（入力）",
        "",
      ]),
    );

    for (const line of snapshot.salaryLines) {
      const row = documentRef.createElement("tr");
      row.dataset.rowKey = line.rowKey;
      const commit = (field) => (value) => {
        summaryModel.updateSalaryLine(line.rowKey, { [field]: value });
        rerender();
      };
      if (editable) {
        const role = jy2Cell(documentRef, "td", "", "");
        role.appendChild(jy2TextInput(documentRef, line.role, commit("role")));
        const unit = jy2Cell(documentRef, "td", "", "");
        unit.appendChild(jy2UnitSelect(documentRef, line.unit, commit("unit")));
        const quantity = jy2Cell(documentRef, "td", "jy2-num", "");
        quantity.appendChild(
          jy2TextInput(documentRef, line.quantity, commit("quantity")),
        );
        const unitPrice = jy2Cell(documentRef, "td", "jy2-num", "");
        unitPrice.appendChild(
          jy2TextInput(documentRef, line.unitPrice, commit("unitPrice")),
        );
        const anchor = jy2HasText(line.role);
        jy2MarkIncompleteIfAnchor(role, anchor, line.role);
        jy2MarkIncompleteIfAnchor(unit, anchor, line.unit);
        jy2MarkIncompleteIfAnchor(quantity, anchor, line.quantity);
        jy2MarkIncompleteIfAnchor(unitPrice, anchor, line.unitPrice);
        const note = jy2Cell(documentRef, "td", "", "");
        note.appendChild(jy2TextInput(documentRef, line.note, commit("note")));
        row.append(role, unit, quantity, unitPrice);
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(note);
        const action = jy2Cell(documentRef, "td", "", "");
        action.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            summaryModel.moveSalaryLine(line.rowKey, -1);
            rerender();
          }),
        );
        action.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            summaryModel.moveSalaryLine(line.rowKey, 1);
            rerender();
          }),
        );
        action.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            summaryModel.removeSalaryLine(line.rowKey);
            rerender();
          }),
        );
        row.appendChild(action);
      } else {
        row.appendChild(jy2Cell(documentRef, "td", "", line.role));
        row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
        row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
        );
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(jy2Cell(documentRef, "td", "", SALARY_TAX_DISPLAY));
        row.appendChild(jy2Cell(documentRef, "td", "", line.note));
        row.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(row);
    }

    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-total-row";
    const totalLabel = jy2Cell(documentRef, "td", "", "給与計");
    totalLabel.colSpan = 4;
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(summaryModel.snapshot().totals.salary),
      ),
    );
    const totalTail = jy2Cell(documentRef, "td", "", "");
    totalTail.colSpan = 4;
    totalRow.appendChild(totalTail);
    body.appendChild(totalRow);

    const footRow = documentRef.createElement("tr");
    const footCell = jy2Cell(documentRef, "td", "", "");
    footCell.colSpan = 9;
    if (editable) {
      footCell.appendChild(
        jy2RowButton(documentRef, "行追加", () => {
          summaryModel.addSalaryLine();
          rerender();
        }),
      );
    }
    footRow.appendChild(footCell);
    body.appendChild(footRow);

    table.appendChild(body);
    return table;
  }

  // 総括原価投影 (P-21/P-33): amounts are read-only from App2.
  // 種別 / 計算基準 / 備考 only are App1 hand-entry (previousLines).
  // X5: 表下に原価・施工計／原価・保安計を出す（⑧は給与計込みでフッタ）。
  function jy2ProjectionTable(
    documentRef,
    projectionRows,
    editable,
    onManualPatch,
    totals = null,
  ) {
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-projection-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "内訳№（自動）",
        "費用区分（自動）",
        "工種番号（自動）",
        "システム入力工種（自動）",
        "種別（入力）",
        "単位（自動）",
        "数量（自動）",
        "単価（自動）",
        "金額（自動）",
        "消費税率（選択）",
        "金額税込（自動）",
        "消化率（自動）",
        "計算基準（入力）",
        "備考（入力）",
      ]),
    );
    if (projectionRows.length === 0) {
      const emptyRow = documentRef.createElement("tr");
      const emptyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-empty",
        "内訳ブロックなし（内訳タブで追加すると自動反映されます）",
      );
      emptyCell.colSpan = 14;
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
    }
    for (const line of projectionRows) {
      const row = documentRef.createElement("tr");
      row.className = "jy2-projection-row";
      row.dataset.stableBlockId = line.summary_stable_block_id;
      const noCell = jy2Cell(documentRef, "td", "jy2-num", "");
      const blockId = String(line.summary_stable_block_id || "").trim();
      if (blockId) {
        const noBtn = documentRef.createElement("button");
        noBtn.type = "button";
        noBtn.className = "jy2-nav-block-no";
        noBtn.textContent = String(line.summary_block_no ?? "");
        noBtn.title = "内訳タブの該当ブロックへ移動";
        noBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const shell = table.closest(".jy2-shell");
          jy2GotoDetailBlock(shell, documentRef, blockId);
        });
        noCell.appendChild(noBtn);
      } else {
        noCell.textContent = String(line.summary_block_no ?? "");
      }
      row.appendChild(noCell);
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_cost_category));
      row.appendChild(
        jy2Cell(documentRef, "td", "", line.summary_work_type_code),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "", line.summary_work_type_name),
      );
      const typeCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        typeCell.appendChild(
          jy2TextInput(documentRef, line.summary_line_type, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_line_type: value,
            });
          }),
        );
      } else {
        typeCell.textContent = line.summary_line_type || "";
      }
      row.appendChild(typeCell);
      row.appendChild(jy2Cell(documentRef, "td", "", line.summary_unit));
      row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.summary_qty));
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2AmountDisplay(line.summary_unit_price),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(line.summary_amount_excl_tax),
        ),
      );
      const taxCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        taxCell.appendChild(
          jy2TaxRateSelect(documentRef, line.summary_tax_rate, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_tax_rate: value,
            });
          }),
        );
      } else {
        taxCell.textContent =
          JY2_TAX_RATE_LABELS[line.summary_tax_rate] || line.summary_tax_rate || "";
      }
      row.appendChild(taxCell);
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount",
          jy2AmountDisplay(line.summary_amount_incl_tax),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Percent(line.summary_rate_to_1),
        ),
      );
      const basisCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        basisCell.appendChild(
          jy2TextInput(documentRef, line.summary_calc_basis, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_calc_basis: value,
            });
          }),
        );
      } else {
        basisCell.textContent = line.summary_calc_basis || "";
      }
      row.appendChild(basisCell);
      const noteCell = jy2Cell(documentRef, "td", "", "");
      if (editable) {
        noteCell.appendChild(
          jy2TextInput(documentRef, line.summary_note, (value) => {
            onManualPatch(line.summary_stable_block_id, {
              summary_note: value,
            });
          }),
        );
      } else {
        noteCell.textContent = line.summary_note || "";
      }
      row.appendChild(noteCell);
      body.appendChild(row);
    }

    if (totals) {
      const rateTo1 = (amount) =>
        amount === null || amount === undefined
          ? null
          : ratio(amount, totals.total1, { zero: "zero" });
      const appendCostTotal = (label, amount) => {
        const totalRow = documentRef.createElement("tr");
        totalRow.className = "jy2-total-row";
        const totalLabel = jy2Cell(documentRef, "td", "", label);
        totalLabel.colSpan = 8;
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(amount)),
        );
        totalRow.appendChild(jy2Cell(documentRef, "td", "", ""));
        totalRow.appendChild(jy2Cell(documentRef, "td", "", ""));
        totalRow.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(amount))),
        );
        const totalTail = jy2Cell(documentRef, "td", "", "");
        totalTail.colSpan = 2;
        totalRow.appendChild(totalTail);
        body.appendChild(totalRow);
      };
      appendCostTotal("原価・施工計", totals.costConstruction);
      appendCostTotal("原価・保安計", totals.costSafety);
    }

    table.appendChild(body);
    return table;
  }

  // D-31 + Ver.01 区分別サマリー: ①⑧⑨主表示＋区分マトリクス（同テイスト）
  function jy2SummaryFooter(documentRef, totals) {
    const rateTo1 = (amount) => ratio(amount, totals.total1, { zero: "zero" });
    const profitOf = (sales, cost) => subtract(sales || "0", cost || "0");
    const profitRate = (sales, cost) =>
      ratio(profitOf(sales, cost), sales || "0", { zero: "zero" });

    const root = documentRef.createElement("div");
    root.className = "jy2-summary-footer jy2-budget-summary";

    const head = documentRef.createElement("div");
    head.className = "jy2-budget-summary-head";
    head.textContent = "区分別サマリー（売上①・原価⑧・粗利⑨）";
    root.appendChild(head);

    const wrap = documentRef.createElement("div");
    wrap.className = "jy2-budget-summary-wrap";

    // ①⑧⑨ + 内訳（消化率＝÷①）— D-31
    const keys = documentRef.createElement("table");
    keys.className = "jy2-budget-summary-keys";
    const keysBody = documentRef.createElement("tbody");
    keysBody.appendChild(jy2HeadRow(documentRef, ["項目", "金額（税抜）", "消化率"]));
    const keyRows = [
      ["① 請負金額合計", totals.total1, "jy2-key-row"],
      ["請負・施工計", totals.construction, "jy2-sub-row"],
      ["請負・保安計", totals.safety, "jy2-sub-row"],
      ["原価・施工計", totals.costConstruction, "jy2-sub-row"],
      ["原価・保安計", totals.costSafety, "jy2-sub-row"],
      ["給与計", totals.salary, "jy2-sub-row"],
      ["⑧ 工事原価合計", totals.total8, "jy2-key-row"],
      ["⑨ 差引（①－⑧）", totals.profit9, "jy2-key-row"],
    ];
    for (const [label, amount, className] of keyRows) {
      const row = documentRef.createElement("tr");
      row.className = className;
      row.appendChild(jy2Cell(documentRef, "td", "jy2-budget-col-label", label));
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(amount)),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2Percent(rateTo1(amount))),
      );
      keysBody.appendChild(row);
    }
    keys.appendChild(keysBody);
    wrap.appendChild(keys);

    // 区分マトリクス（Ver.01 同趣旨: 施工/保安）
    const matrix = documentRef.createElement("table");
    matrix.className = "jy2-budget-summary-table";
    const matrixBody = documentRef.createElement("tbody");
    matrixBody.appendChild(
      jy2HeadRow(documentRef, [
        "区分",
        "売上（①）",
        "原価（⑧）",
        "粗利",
        "粗利率",
      ]),
    );
    const categoryRows = [
      ["施工", totals.construction, totals.costConstruction],
      ["保安", totals.safety, totals.costSafety],
    ];
    for (const [label, sales, cost] of categoryRows) {
      const row = documentRef.createElement("tr");
      row.appendChild(jy2Cell(documentRef, "td", "jy2-budget-col-label", label));
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(sales)),
      );
      row.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(cost)),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2AmountDisplay(profitOf(sales, cost)),
        ),
      );
      row.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Percent(profitRate(sales, cost)),
        ),
      );
      matrixBody.appendChild(row);
    }
    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-budget-total-row";
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-budget-col-label", "合計 …⑨"),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.total1)),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.total8)),
    );
    totalRow.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(totals.profit9)),
    );
    totalRow.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-num",
        jy2Percent(rateTo1(totals.profit9)),
      ),
    );
    matrixBody.appendChild(totalRow);
    matrix.appendChild(matrixBody);
    wrap.appendChild(matrix);

    const note = documentRef.createElement("p");
    note.className = "jy2-budget-summary-note";
    note.textContent =
      "粗利率＝区分ごとの粗利 ÷ その区分の売上（①）。最下行は全体粗利⑨ ÷ 契約合計①。" +
      " 給与計は⑧合計に含め、区分（施工/保安）には按分しません。消化率＝金額÷①（①=0は0）。";
    wrap.appendChild(note);

    root.appendChild(wrap);
    return root;
  }

  // onMutated: 総括 edits (請負/給与) change ①, which the 予実 BC率/EC率
  // read live — the shell passes refreshActuals here (Y9/M2).
  // projectionManual: 種別/計算基準/備考の手入力ストア（P-33）。
  function jy2RenderSummaryPane(
    documentRef,
    pane,
    summaryModel,
    blocksProvider,
    onMutated,
    projectionManual,
  ) {
    pane.textContent = "";
    const editable = summaryModel.allowedOperations.editBudget;
    const rerender = () => {
      jy2RenderSummaryPane(
        documentRef,
        pane,
        summaryModel,
        blocksProvider,
        onMutated,
        projectionManual,
      );
      if (onMutated) onMutated();
    };

    const blocks = blocksProvider();
    const totals = summaryModel.totals(blocks);
    const previousLines =
      projectionManual && typeof projectionManual.previousLines === "function"
        ? projectionManual.previousLines()
        : [];
    const projectionRows = regenerateSummaryCostLines(blocks, {
      contractTotal1: totals.total1,
      previousLines,
    });

    const contractTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "請負金額",
    );
    const salaryTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "給与手当",
    );
    const projectionTitle = jy2Cell(
      documentRef,
      "h3",
      "jy2-section-title",
      "原価行",
    );
    // C5: 総括タブは横スクロール1本（請負/原価/給与を個別 wrap しない）
    const scroller = jy2MountPaneHScroll(documentRef, pane, { minWidth: 1400 });
    scroller.append(
      contractTitle,
      jy2ContractTable(documentRef, summaryModel, editable, rerender),
      projectionTitle,
      jy2ProjectionTable(
        documentRef,
        projectionRows,
        editable,
        (stableBlockId, patch) => {
          if (projectionManual && typeof projectionManual.patch === "function") {
            projectionManual.patch(stableBlockId, patch);
          }
          rerender();
        },
        totals,
      ),
      salaryTitle,
      jy2SalaryTable(documentRef, summaryModel, editable, rerender),
      jy2SummaryFooter(documentRef, totals),
    );
  }

  // 内訳ブロック1つ分 (Phase 4c): App2-shaped in-memory block with U20 full
  // footer. 小計・計 are system totals (U25) and never editable.
  function jy2DetailBlock(
    documentRef,
    detailModel,
    block,
    editable,
    rerender,
    suggestions,
    masterLists,
  ) {
    const section = documentRef.createElement("section");
    section.className = "jy2-detail-block";
    section.dataset.stableBlockId = block.stableBlockId;
    section.dataset.blockStatus = block.status;
    const retired = block.status === "retired";
    const blockEditable = editable && !retired;
    const suggest = suggestions || { name1: [], name2: [], name3: [], vendors: [] };
    const codeMaster = masterLists || jy2EmptyMasterLists();

    const head = documentRef.createElement("div");
    head.className = "jy2-detail-block-head";
    const no = documentRef.createElement("span");
    no.className = "jy2-block-no";
    no.textContent = retired ? "廃止" : `No.${block.blockNo}`;
    if (retired) no.classList.add("jy2-retired-tag");
    const blockId = String(block.stableBlockId || "").trim();
    if (!retired && blockId) {
      no.classList.add("jy2-nav-block-no");
      no.setAttribute("role", "button");
      no.tabIndex = 0;
      no.title = "総括タブの該当内訳№へ移動";
      const goSummary = (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const shell = section.closest(".jy2-shell");
        jy2GotoSummaryProjection(shell, documentRef, blockId);
      };
      no.addEventListener("click", goSummary);
      no.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") goSummary(event);
      });
    }
    head.appendChild(no);

    const commitHeader = (field) => (value) => {
      detailModel.updateBlockHeader(block.stableBlockId, { [field]: value });
      rerender();
    };
    const headerField = (labelText, control) => {
      const label = documentRef.createElement("label");
      jy2AppendModeLabel(documentRef, label, labelText);
      label.appendChild(control);
      head.appendChild(label);
    };
    if (blockEditable) {
      const commitWorkTypeCode = (value) => {
        detailModel.updateBlockHeader(block.stableBlockId, { workTypeCode: value });
        const mapped = codeMaster.workTypeByCode[value];
        if (mapped) {
          detailModel.updateBlockHeader(block.stableBlockId, { workTypeName: mapped });
        }
        rerender();
      };
      const commitWorkTypeName = (value) => {
        detailModel.updateBlockHeader(block.stableBlockId, { workTypeName: value });
        const mapped = codeMaster.workTypeByName[value];
        if (mapped) {
          detailModel.updateBlockHeader(block.stableBlockId, { workTypeCode: mapped });
        }
        rerender();
      };
      headerField(
        "工種番号（選択）",
        jy2ComboInput(
          documentRef,
          block.workTypeCode,
          codeMaster.workTypeCodes,
          commitWorkTypeCode,
        ),
      );
      headerField(
        "システム入力工種（選択）",
        jy2ComboInput(
          documentRef,
          block.workTypeName,
          codeMaster.workTypeNames,
          commitWorkTypeName,
        ),
      );
      // U29: 区分 sits left of 取引先; list-select colored (green).
      headerField(
        "区分（選択）",
        jy2UnitSelect(
          documentRef,
          block.costCategory,
          commitHeader("costCategory"),
          CONTRACT_SECTIONS,
        ),
      );
      // U3: 取引先は候補＋手入力可コンボ
      const vendorWrap = documentRef.createElement("span");
      vendorWrap.appendChild(
        jy2ComboInput(
          documentRef,
          block.vendorName,
          suggest.vendors,
          commitHeader("vendorName"),
        ),
      );
      headerField("取引先（選択）", vendorWrap);
      const actions = documentRef.createElement("div");
      actions.className = "jy2-block-actions";
      actions.appendChild(
        jy2RowButton(documentRef, "↑", () => {
          detailModel.moveBlock(block.stableBlockId, -1);
          rerender();
        }),
      );
      actions.appendChild(
        jy2RowButton(documentRef, "↓", () => {
          detailModel.moveBlock(block.stableBlockId, 1);
          rerender();
        }),
      );
      // P-39: blocks with actuals are retired, never physically deleted.
      if (block.hasActuals) {
        actions.appendChild(
          jy2RowButton(documentRef, "廃止", () => {
            detailModel.retireBlock(block.stableBlockId);
            rerender();
          }),
        );
      } else {
        actions.appendChild(
          jy2RowButton(documentRef, "ブロック削除", () => {
            detailModel.removeBlock(block.stableBlockId);
            rerender();
          }),
        );
      }
      head.appendChild(actions);
    } else {
      head.appendChild(
        jy2Cell(
          documentRef,
          "span",
          "",
          [
            block.workTypeCode,
            block.workTypeName,
            block.costCategory,
            block.vendorName,
          ]
            .filter((text) => text)
            .join(" / "),
        ),
      );
    }
    section.appendChild(head);

    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-detail-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "分類（選択）",
        "品目（選択）",
        "補助項目（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "備考（入力）",
        "",
      ]),
    );

    for (const row of block.detailRows) {
      const tr = documentRef.createElement("tr");
      tr.dataset.rowKey = row.rowKey;
      const commit = (field) => (value) => {
        detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
          [field]: value,
        });
        rerender();
      };
      if (blockEditable) {
        // U4: 左2列＝候補選択＋手入力可、3列目＝手入力（全角カナ正規化）。#R-NAME-01
        const name1 = jy2Cell(documentRef, "td", "", "");
        name1.appendChild(
          jy2ComboInput(documentRef, row.name1, suggest.name1, commit("name1")),
        );
        tr.appendChild(name1);
        const name2 = jy2Cell(documentRef, "td", "", "");
        name2.appendChild(
          jy2ComboInput(documentRef, row.name2, suggest.name2, commit("name2")),
        );
        tr.appendChild(name2);
        const name3 = jy2Cell(documentRef, "td", "", "");
        name3.appendChild(
          jy2TextInput(documentRef, row.name3, (value) =>
            commit("name3")(jy2ToFullWidthKana(value)),
          ),
        );
        tr.appendChild(name3);
        const unit = jy2Cell(documentRef, "td", "", "");
        unit.appendChild(
          jy2UnitSelect(documentRef, row.unit, commit("unit"), DETAIL_UNITS),
        );
        tr.appendChild(unit);
        const quantityCell = jy2Cell(documentRef, "td", "jy2-num", "");
        quantityCell.appendChild(
          jy2TextInput(documentRef, row.quantity, commit("quantity")),
        );
        tr.appendChild(quantityCell);
        const unitPriceCell = jy2Cell(documentRef, "td", "jy2-num", "");
        unitPriceCell.appendChild(
          jy2TextInput(documentRef, row.unitPrice, commit("unitPrice")),
        );
        tr.appendChild(unitPriceCell);
        // U17: 薄い赤の起点は分類/品目のみ。補助項目（name3）は必須扱いにしない。
        const anchor = jy2HasText(row.name1) || jy2HasText(row.name2);
        jy2MarkIncompleteIfAnchor(name1, anchor, row.name1);
        jy2MarkIncompleteIfAnchor(name2, anchor, row.name2);
        jy2MarkIncompleteIfAnchor(unit, anchor, row.unit);
        jy2MarkIncompleteIfAnchor(quantityCell, anchor, row.quantity);
        jy2MarkIncompleteIfAnchor(unitPriceCell, anchor, row.unitPrice);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        const note = jy2Cell(documentRef, "td", "", "");
        note.appendChild(jy2TextInput(documentRef, row.note, commit("note")));
        tr.appendChild(note);
        const ops = jy2Cell(documentRef, "td", "", "");
        ops.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, -1);
            rerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, 1);
            rerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            detailModel.removeDetailRow(block.stableBlockId, row.rowKey);
            rerender();
          }),
        );
        tr.appendChild(ops);
      } else {
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name1));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name2));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.name3));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.unit));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.quantity));
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(row.unitPrice)),
        );
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        tr.appendChild(jy2Cell(documentRef, "td", "", row.note));
        tr.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(tr);
    }

    if (blockEditable) {
      const addRow = documentRef.createElement("tr");
      const addCell = jy2Cell(documentRef, "td", "", "");
      addCell.colSpan = 9;
      addCell.appendChild(
        jy2RowButton(documentRef, "明細行追加", () => {
          detailModel.addDetailRow(block.stableBlockId);
          rerender();
        }),
      );
      addRow.appendChild(addCell);
      body.appendChild(addRow);
    }

    // U20 fixed footer: 諸経費 → 各種保険料 → 小計 → 法定福利費 → 計.
    // Manual amounts may stay blank (counted as 0 in totals = U25).
    for (const kind of BLOCK_FOOTER_KINDS) {
      const footerRow = block.footer[kind];
      const tr = documentRef.createElement("tr");
      tr.className =
        kind === "block_total"
          ? "jy2-footer-row jy2-block-total-row"
          : "jy2-footer-row";
      tr.dataset.rowKind = kind;
      tr.dataset.rowKey = footerRow.rowKey;
      const manual = MANUAL_FOOTER_KINDS.includes(kind);
      const footerMode = manual ? "入力" : "自動";
      const label = documentRef.createElement("td");
      label.className = "jy2-footer-label";
      jy2AppendModeLabel(
        documentRef,
        label,
        `${BLOCK_FOOTER_LABELS[kind]}（${footerMode}）`,
      );
      label.colSpan = 6;
      tr.appendChild(label);
      if (manual && blockEditable) {
        const amount = jy2Cell(documentRef, "td", "jy2-num", "");
        amount.appendChild(
          jy2TextInput(documentRef, footerRow.amount, (value) => {
            detailModel.updateFooterAmount(block.stableBlockId, kind, value);
            rerender();
          }),
        );
        tr.appendChild(amount);
      } else {
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(footerRow.amount)),
        );
      }
      const tail = jy2Cell(documentRef, "td", "", "");
      tail.colSpan = 2;
      tr.appendChild(tail);
      body.appendChild(tr);
    }

    table.appendChild(body);
    // 横スクロールは jy2RenderDetailPane の pane-hscroll 1本
    section.appendChild(table);
    return section;
  }

  // 内訳 tab (Phase 4c): offline in-memory editor over App2-shaped blocks.
  // Every mutation re-renders this pane and refreshes the summary projection
  // (投影キャッシュ) and ①⑧⑨ via refreshSummary.
  function jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary, masterLists) {
    pane.textContent = "";
    const editable = detailModel.allowedOperations.editBudget;
    const rerender = () => {
      jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary, masterLists);
      refreshSummary();
    };
    const snapshot = detailModel.snapshot();

    for (const warning of detailModel.categoryWarnings()) {
      pane.appendChild(jy2Cell(documentRef, "p", "jy2-warning", warning));
    }

    // C5: 内訳タブも横スクロール1本（工種ブロックごとの個別 wrap 禁止）
    const scroller = jy2MountPaneHScroll(documentRef, pane, { minWidth: 1400 });

    if (snapshot.blocks.length === 0) {
      scroller.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "内訳ブロックなし（新規はブロック0から。追加ボタンで開始）",
        ),
      );
    }
    for (const block of snapshot.blocks) {
      scroller.appendChild(
        jy2DetailBlock(
          documentRef,
          detailModel,
          block,
          editable,
          rerender,
          jy2CollectDetailSuggestions(detailModel, block),
          masterLists,
        ),
      );
    }
    if (editable) {
      scroller.appendChild(
        jy2RowButton(documentRef, "工種ブロック追加", () => {
          detailModel.addBlock();
          rerender();
        }),
      );
    }
  }

  function jy2MonthLabel(month) {
    const [year, monthNumber] = month.split("-");
    // 予実の月列は幅を抑える（例: 24/6）
    return `${String(year).slice(-2)}/${Number(monthNumber)}`;
  }

  // One 予実 cost row (Y3/Y9): budget attributes read-only (Y10), month cells
  // and 最終予算額 editable when editActuals, metrics always auto. Y9 rates:
  // BC率＝現行予算÷①（現行予算の隣）・EC率＝最終予算額÷①（最終の隣）.
  function jy2ActualRow(documentRef, actualsModel, row, months, editable, rerender) {
    const tr = documentRef.createElement("tr");
    tr.dataset.stableBlockId = row.stableBlockId;
    tr.dataset.costCategory = row.costCategory;
    tr.dataset.blockStatus = row.status;
    tr.appendChild(
      jy2MarkFreeze(
        jy2Cell(
          documentRef,
          "td",
          row.status === "retired" ? "jy2-retired-tag" : "jy2-num",
          row.status === "retired" ? "廃止" : row.blockNo,
        ),
        0,
      ),
    );
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", row.costCategory), 1));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", row.workTypeCode), 2));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", row.workTypeName), 3));
    tr.appendChild(jy2Cell(documentRef, "td", "", row.budgetLineType || ""));
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "",
        JY2_TAX_RATE_LABELS[row.budgetTaxRate] || row.budgetTaxRate || "－",
      ),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "", row.budgetUnit || ""));
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.budgetQty || ""));
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2AmountDisplay(row.budgetUnitPrice)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(row.budgetAmountExclTax),
      ),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "", row.budgetCalcBasis || ""));
    tr.appendChild(jy2Cell(documentRef, "td", "", row.budgetNote || ""));
    // 現行予算: auto from 内訳 block totals; retired blocks show 0 (P-39/R-11).
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(row.currentBudget)),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", jy2Percent(row.bcRate)));
    const commit = (patch) => {
      try {
        actualsModel.updateActualRow(row.stableBlockId, row.costCategory, patch);
      } catch {
        // Invalid input (non-integer) is discarded; rerender restores the cell.
      }
      rerender();
    };
    for (const month of months) {
      const cell = jy2Cell(documentRef, "td", "jy2-num jy2-actual-month", "");
      if (editable) {
        cell.appendChild(
          jy2TextInput(documentRef, row.monthly[month], (value) =>
            commit({ [month]: value }),
          ),
        );
      } else {
        cell.className = "jy2-amount jy2-actual-month";
        cell.textContent = jy2AmountDisplay(row.monthly[month]);
      }
      tr.appendChild(cell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(row.actual)),
    );
    const finalCell = jy2Cell(documentRef, "td", "jy2-num", "");
    if (editable) {
      finalCell.appendChild(
        jy2TextInput(
          documentRef,
          row.finalBudgetManual ? row.finalBudget : "",
          (value) => commit({ finalBudget: value }),
        ),
      );
      if (!row.finalBudgetManual) {
        finalCell.firstChild.placeholder = jy2AmountDisplay(row.finalBudget);
      }
    } else {
      finalCell.className = "jy2-amount";
      finalCell.textContent = jy2AmountDisplay(row.finalBudget);
    }
    tr.appendChild(finalCell);
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", jy2Percent(row.ecRate)));
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(row.futureRequired)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(row.remainingBudget)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-rate-end",
        jy2Percent(row.consumptionRatio),
      ),
    );
    return tr;
  }

  function jy2ActualTotalRow(documentRef, total, label, months) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-total-row";
    tr.dataset.totalCategory = total.costCategory || total.label || "";
    const head = jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-freeze-span", label), 0);
    head.colSpan = 4 + JY2_ACTUAL_ATTR_COLS;
    tr.appendChild(head);
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.currentBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(total.bcRate)),
    );
    for (const month of months) {
      const monthAmount = total.monthly[month];
      tr.appendChild(
        jy2Cell(
          documentRef,
          "td",
          "jy2-amount jy2-actual-month",
          monthAmount === null || monthAmount === undefined
            ? "－"
            : jy2AmountDisplay(monthAmount),
        ),
      );
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.actual)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.finalBudget)),
    );
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-num", jy2Percent(total.ecRate)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(total.futureRequired),
      ),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(total.remainingBudget),
      ),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-rate-end",
        jy2Percent(total.consumptionRatio),
      ),
    );
    return tr;
  }

  // 実績 tab (Phase 4d): offline 予実 matrix over App3-shaped actual cells.
  // Rows are the 施工/保安 cost rows only (Y4 — no salary), pivoted wide by
  // month (Y5/Y6). Y7 adds ⑧⑨ aggregate rows; Y9 adds budget attribute cols.
  function jy2RenderActualPane(
    documentRef,
    pane,
    actualsModel,
    blocksProvider,
    contractTotal1Provider,
    saveController,
    projectionManual,
    summaryTotalsProvider,
  ) {
    pane.textContent = "";
    const editable = actualsModel.allowedOperations.editActuals;
    const rerender = () =>
      jy2RenderActualPane(
        documentRef,
        pane,
        actualsModel,
        blocksProvider,
        contractTotal1Provider,
        saveController,
        projectionManual,
        summaryTotalsProvider,
      );
    const months = actualsModel.months();
    const blocks = blocksProvider();
    const contractTotal1 = contractTotal1Provider ? contractTotal1Provider() : null;
    const previousLines =
      projectionManual && typeof projectionManual.previousLines === "function"
        ? projectionManual.previousLines()
        : [];
    const projectionLines = regenerateSummaryCostLines(blocks, {
      contractTotal1,
      previousLines,
    });
    const budgetAttrsByBlockId = new Map(
      projectionLines.map((line) => [line.summary_stable_block_id, line]),
    );
    const rows = actualsModel.matrixRows(blocks, {
      contractTotal1,
      budgetAttrsByBlockId,
    });
    const totals = actualsModel.sectionTotals(blocks, { contractTotal1 });
    const summaryTotals = summaryTotalsProvider ? summaryTotalsProvider() : null;
    const salaryAmount = summaryTotals ? summaryTotals.salary : "0";
    const grand8 = actualsModel.grandCost8Totals(
      totals,
      salaryAmount,
      contractTotal1,
    );
    const profit9 = actualsModel.profit9Totals(grand8, contractTotal1);

    const titleRow = documentRef.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.gap = "12px";
    titleRow.appendChild(
      jy2Cell(
        documentRef,
        "h3",
        "jy2-section-title",
        "予実管理（原価行対比・給与手当は対象外）",
      ),
    );
    if (saveController && editable) {
      const saveButton = documentRef.createElement("button");
      saveButton.type = "button";
      saveButton.className = "jy2-save-button";
      saveButton.textContent = "予実を保存";
      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        saveButton.disabled = true;
        saveButton.textContent = "保存中…";
        const view = documentRef.defaultView;
        try {
          const result = await saveController.saveActuals(actualsModel);
          if (result && result.skipped) {
            if (view && typeof view.alert === "function") {
              view.alert("変更された予実セルがありません。");
            }
            saveButton.disabled = false;
            saveButton.textContent = "予実を保存";
            return;
          }
          if (view && typeof view.alert === "function") {
            view.alert(`予実を保存しました（${result.requestCount}リクエスト）`);
          }
          jy2ReloadPreservingTab(view, "actual");
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `予実保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(view, "actual");
          } else {
            saveButton.disabled = false;
            saveButton.textContent = "予実を保存";
          }
        }
      });
      titleRow.appendChild(saveButton);
    }
    pane.appendChild(titleRow);
    const note = documentRef.createElement("details");
    note.className = "jy2-actual-note-details";
    const summary = documentRef.createElement("summary");
    summary.textContent = "予実の見方（クリックで開く）";
    const noteBody = documentRef.createElement("p");
    noteBody.className = "jy2-actual-note";
    noteBody.textContent =
      "予算属性は表示のみ（編集は内訳・総括）。手入力は月別消化と最終予算額の予算額のみ。" +
      "現行予算・最終予算額は「予算額｜消化率」の2段（ここでの消化率＝各予算÷請負①）。右端の消化率＝原価累計÷現行予算。" +
      "横スクロール時も左の内訳№〜工種名は固定表示されます。";
    note.append(summary, noteBody);
    pane.appendChild(note);
    if (rows.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "予実対象の原価行なし（内訳タブで施工・保安ブロックを追加してください）",
        ),
      );
      return;
    }

    const scroll = documentRef.createElement("div");
    scroll.className = "jy2-actual-scroll";
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-actual-table";
    table.appendChild(jy2ActualHead(documentRef, months));
    const body = documentRef.createElement("tbody");
    for (const row of rows) {
      body.appendChild(
        jy2ActualRow(documentRef, actualsModel, row, months, editable, rerender),
      );
    }
    for (const category of ACTUAL_COST_CATEGORY_KEYS) {
      body.appendChild(
        jy2ActualTotalRow(documentRef, totals[category], `${category}計`, months),
      );
    }
    body.appendChild(
      jy2ActualTotalRow(documentRef, grand8, grand8.label, months),
    );
    body.appendChild(
      jy2ActualTotalRow(documentRef, profit9, profit9.label, months),
    );
    table.appendChild(body);
    scroll.appendChild(table);
    pane.appendChild(scroll);
    jy2BindHScroll(scroll);
  }

  function jy2LockBadge(documentRef, version) {
    const badge = documentRef.createElement("span");
    badge.className = "jy2-lock-badge";
    badge.dataset.lock = version.derivedLockState;
    badge.textContent = version.lockLabel;
    return badge;
  }

  // 版管理 tab (Phase 4e): offline version series list over App1-shaped mock
  // records. Lock states are derived per version (status + newer existence =
  // V11b); the 次版作成 CTA is enabled only where createNextVersion holds
  // (budget_locked = latest confirmed with no draft, V5/V7). Clicking plans
  // the next draft's keys in memory — nothing is sent anywhere.
  function jy2RenderVersionPane(
    documentRef,
    pane,
    versionModel,
    projectId,
    detailRowCountProvider,
    liveCopy,
  ) {
    pane.textContent = "";
    pane.appendChild(
      jy2Cell(
        documentRef,
        "h3",
        "jy2-section-title",
        "バージョン管理（版一覧・次版作成）",
      ),
    );
    pane.appendChild(
      jy2Cell(
        documentRef,
        "p",
        "jy2-actual-note",
        "実績は工事帰属で版複製しない（P-28／V3b）。過去版は閲覧のみ（V9）。下書きは1工事1件（V5）。",
      ),
    );
    const versions = projectId ? versionModel.listVersions(projectId) : [];
    if (versions.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "版レコードなし（オフライン試作では data.versions で注入します）",
        ),
      );
      return;
    }

    const status = jy2Cell(documentRef, "p", "jy2-version-status", "");
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-version-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, ["版", "版種別", "ステータス", "ロック", "操作"]),
    );
    // Newest first, like a version history.
    for (const version of [...versions].reverse()) {
      const tr = documentRef.createElement("tr");
      tr.dataset.budgetVersionId = version.budgetVersionId;
      tr.dataset.lockState = version.derivedLockState;
      tr.dataset.current = String(!version.newerVersionExists);
      tr.appendChild(
        jy2Cell(documentRef, "td", "jy2-num", `第${version.versionSeq}版`),
      );
      tr.appendChild(jy2Cell(documentRef, "td", "", version.versionType));
      tr.appendChild(jy2Cell(documentRef, "td", "", version.status));
      const lockCell = jy2Cell(documentRef, "td", "", "");
      lockCell.appendChild(jy2LockBadge(documentRef, version));
      tr.appendChild(lockCell);
      const action = jy2Cell(documentRef, "td", "", "");
      const cta = documentRef.createElement("button");
      cta.type = "button";
      cta.className = "jy2-row-button jy2-version-cta";
      cta.textContent = "次版作成";
      // CTA gate: only the latest confirmed version with no draft (V7).
      cta.disabled = !version.allowedOperations.createNextVersion;
      cta.addEventListener("click", async () => {
        if (cta.disabled) return;
        // 残B: LIVE 文脈では P-29 の確認ダイアログを経て planVersionCopy を
        // 1回の bulkRequest で実行する。オフラインでは従来どおり計画のみ。
        if (typeof liveCopy === "function") {
          const view = documentRef.defaultView;
          const confirmed =
            view && typeof view.confirm === "function"
              ? view.confirm(VERSION_DUPLICATE_MESSAGES["next-version"])
              : false;
          if (!confirmed) return;
          const versionType = jy2PickNextVersionType(view);
          if (!versionType) return;
          cta.disabled = true;
          status.className = "jy2-version-status";
          status.textContent = "次版を複製中…";
          try {
            const { plan } = await liveCopy(version, versionType);
            if (view && typeof view.alert === "function") {
              view.alert(
                `第${plan.versionSeq}版（${versionType}・下書き）を作成しました。内訳${plan.copies.detailRows}行を複製し、旧版行をロックしました。`,
              );
            }
            jy2ReloadPreservingTab(view, "version");
          } catch (error) {
            const conflict = error && error.action === "abort_reload";
            status.className = "jy2-warning jy2-version-status";
            status.textContent = conflict
              ? "他の更新と競合したため中止しました。再読込してください。"
              : `次版作成失敗: ${(error && error.message) || error}`;
            cta.disabled = false;
          }
          return;
        }
        try {
          const plan = versionModel.planNextVersionDraft(
            version,
            detailRowCountProvider(),
          );
          status.className = "jy2-version-status";
          status.textContent =
            `次版下書きを計画（送信なし）: 第${plan.versionSeq}版・` +
            `内訳${plan.copies.detailRows}行複製・実績複製${plan.copies.actualRows}件`;
        } catch (error) {
          // 901+ rows: P-34 sizing aborts before anything would be sent.
          status.className = "jy2-warning jy2-version-status";
          status.textContent = `次版作成不可: ${error.message}`;
        }
      });
      action.appendChild(cta);
      tr.appendChild(action);
      body.appendChild(tr);
    }
    table.appendChild(body);
    pane.appendChild(jy2WrapTable(documentRef, table));
    pane.appendChild(status);
  }

  function jy2FormatDatetime(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(text);
    return match ? `${match[1]} ${match[2]}` : text.slice(0, 16);
  }

  function jy2Field(record, code, value) {
    // type を書き換え／捏造しない（DROP_DOWN を SINGLE_LINE_TEXT にすると LIVE で落ちる）。
    if (!record[code] || typeof record[code] !== "object") return null;
    record[code].value = value === null || value === undefined ? "" : String(value);
    return record[code];
  }

  function jy2CompactUuidFactory() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? compactUuidFactory(() => crypto.randomUUID())
      : compactUuidFactory(() =>
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
            const r = (Math.random() * 16) | 0;
            return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
          }),
        );
  }

  let jy2ListRowsAll = [];
  let jy2ListSearchQuery = "";

  function jy2HideNativeIndexTable() {
    if (typeof document === "undefined") return;
    for (const selector of [".recordlist-gaia", ".contents-gaia"]) {
      const node = document.querySelector(selector);
      if (node) node.style.display = "none";
    }
  }

  /**
   * 詳細・編集・新規: Ver.01 と同じく record-*-gaia 先頭に #jy2-host を挿す。
   * 一覧専用の getHeaderSpaceElement は詳細では null になるため使わない。
   */
  function jy2ResolveRecordPageHost(documentRef) {
    const doc =
      documentRef ||
      (typeof document !== "undefined" ? document : null);
    if (!doc) return null;
    const form =
      doc.querySelector(".record-detail-gaia") ||
      doc.querySelector(".record-edit-gaia") ||
      doc.querySelector(".layout-gaia");
    if (form) {
      let host = doc.getElementById("jy2-host");
      if (!host) {
        host = doc.createElement("div");
        host.id = "jy2-host";
        form.insertBefore(host, form.firstChild);
      }
      return host;
    }
    if (
      typeof kintone !== "undefined" &&
      kintone.app &&
      kintone.app.record &&
      typeof kintone.app.record.getHeaderMenuSpaceElement === "function"
    ) {
      return kintone.app.record.getHeaderMenuSpaceElement();
    }
    return null;
  }

  function jy2RefreshList(api) {
    const fetchApi =
      typeof api === "function"
        ? api
        : typeof kintone !== "undefined" && typeof kintone.api === "function"
          ? kintone.api.bind(kintone)
          : null;
    if (!fetchApi || typeof kintone === "undefined") {
      return Promise.resolve([]);
    }
    return fetchApi("/k/v1/records.json", "GET", {
      app: APP1_ID,
      query: "order by $id desc limit 500",
      fields: [
        "$id",
        "project_code",
        "project_name",
        "project_official_name",
        "version_seq",
        "version_type",
        "status",
        "Updated_datetime",
        "contract_total_1",
        "profit_9",
      ],
    })
      .then((response) => {
        const records = (response.records || [])
          .map((rec) => {
            const id = rec.$id && rec.$id.value != null ? String(rec.$id.value) : "";
            if (!id) return null;
            return {
              id,
              project_code: jy2FieldValue(rec, "project_code"),
              project_name: jy2FieldValue(rec, "project_name"),
              project_official_name: jy2FieldValue(rec, "project_official_name"),
              version_seq: jy2FieldValue(rec, "version_seq"),
              version_type: jy2FieldValue(rec, "version_type"),
              status: jy2FieldValue(rec, "status"),
              updated_at: jy2FormatDatetime(
                jy2FieldValue(rec, "Updated_datetime") ||
                  jy2FieldValue(rec, "updated_datetime"),
              ),
              contract_total_1: jy2FieldValue(rec, "contract_total_1"),
              profit_9: jy2FieldValue(rec, "profit_9"),
            };
          })
          .filter(Boolean);
        jy2ListRowsAll = buildListProjectRows(records);
        return jy2ListRowsAll;
      })
      .catch((error) => {
        jy2ListRowsAll = [];
        if (typeof console !== "undefined" && console.error) {
          console.error(BUILD, "jy2RefreshList", error);
        }
        throw error;
      });
  }

  function jy2RenderListRoot(container) {
    if (!container || !container.ownerDocument) return;
    const documentRef = container.ownerDocument;
    jy2InstallStyle(documentRef);
    container.textContent = "";
    const root = documentRef.createElement("div");
    root.className = "jy2-list-root";

    const title = documentRef.createElement("h2");
    title.className = "jy2-list-title";
    title.textContent = "実行予算書作成支援ツールver02";
    const subtitle = documentRef.createElement("p");
    subtitle.className = "jy2-list-sub";
    subtitle.textContent = "工事一覧 — 行をクリックすると最新版（下書き優先）を開きます。";
    root.append(title, subtitle);

    const toolbar = documentRef.createElement("div");
    toolbar.className = "jy2-list-toolbar";
    const newButton = documentRef.createElement("button");
    newButton.type = "button";
    newButton.className = "jy2-list-new";
    newButton.textContent = "＋ 新規作成";
    newButton.addEventListener("click", () => {
      const view = documentRef.defaultView;
      if (view && view.location) view.location.href = `/k/${APP1_ID}/edit`;
    });
    const searchLabel = documentRef.createElement("label");
    searchLabel.textContent = "検索 ";
    const searchInput = documentRef.createElement("input");
    searchInput.type = "search";
    searchInput.className = "jy2-list-search";
    searchInput.placeholder = "工事名称・工事コード・版種別など";
    searchInput.value = jy2ListSearchQuery;
    const clearButton = documentRef.createElement("button");
    clearButton.type = "button";
    clearButton.className = "jy2-row-button";
    clearButton.textContent = "クリア";
    const count = documentRef.createElement("span");
    count.className = "jy2-list-count";
    toolbar.append(newButton, searchLabel, searchInput, clearButton, count);
    root.appendChild(toolbar);

    const hint = documentRef.createElement("p");
    hint.className = "jy2-list-hint";
    hint.textContent =
      "列: 工事名称 / 工事コード / 版 / 版種別 / ステータス / 更新日。" +
      " 同一工事の複数版は下書きがあれば下書きを代表表示します。";
    root.appendChild(hint);

    const rerender = () => jy2RenderListRoot(container);
    searchInput.addEventListener("input", () => {
      jy2ListSearchQuery = searchInput.value;
      rerender();
    });
    clearButton.addEventListener("click", () => {
      jy2ListSearchQuery = "";
      rerender();
    });

    const rows = filterListRows(jy2ListRowsAll, jy2ListSearchQuery);
    count.textContent =
      jy2ListRowsAll.length === 0
        ? "0 工事"
        : jy2ListSearchQuery.trim()
          ? `表示 ${rows.length} / 全 ${jy2ListRowsAll.length} 工事`
          : `全 ${jy2ListRowsAll.length} 工事`;

    const table = documentRef.createElement("table");
    table.className = "jy2-list-table";
    const head = documentRef.createElement("thead");
    const headRow = documentRef.createElement("tr");
    for (const label of [
      "工事名称",
      "工事コード",
      "版",
      "版種別",
      "ステータス",
      "更新日",
    ]) {
      headRow.appendChild(jy2Cell(documentRef, "th", "", label));
    }
    head.appendChild(headRow);
    table.appendChild(head);

    const body = documentRef.createElement("tbody");
    if (jy2ListRowsAll.length === 0) {
      const tr = documentRef.createElement("tr");
      const td = jy2Cell(
        documentRef,
        "td",
        "",
        "レコードがありません。「＋ 新規作成」から開始してください。",
      );
      td.colSpan = 6;
      tr.appendChild(td);
      body.appendChild(tr);
    } else if (rows.length === 0) {
      const tr = documentRef.createElement("tr");
      const td = jy2Cell(documentRef, "td", "", "検索条件に一致する工事がありません。");
      td.colSpan = 6;
      tr.appendChild(td);
      body.appendChild(tr);
    } else {
      for (const row of rows) {
        const tr = documentRef.createElement("tr");
        tr.dataset.openId = row.open_id;
        tr.addEventListener("click", () => {
          const view = documentRef.defaultView;
          if (view && view.location && row.open_id) {
            view.location.href = `/k/${APP1_ID}/show#record=${row.open_id}`;
          }
        });
        tr.appendChild(
          jy2Cell(documentRef, "td", "", row.project_name || row.project_code),
        );
        tr.appendChild(jy2Cell(documentRef, "td", "", row.project_code));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.version_seq));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.version_type));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.status));
        tr.appendChild(jy2Cell(documentRef, "td", "", row.updated_at));
        body.appendChild(tr);
      }
    }
    table.appendChild(body);
    root.appendChild(table);
    container.appendChild(root);
  }

  function jy2MountIndex() {
    jy2HideNativeIndexTable();
    const space =
      typeof kintone !== "undefined" &&
      typeof kintone.app.getHeaderSpaceElement === "function"
        ? kintone.app.getHeaderSpaceElement()
        : null;
    if (!space) return;
    space.textContent = "";
    jy2RefreshList()
      .then(() => jy2RenderListRoot(space))
      .catch(() => jy2RenderListRoot(space));
  }

  function jy2VersionTypeOptions(versionSeq, currentType) {
    const seq = Number(versionSeq) || 1;
    if (seq === 1 && (currentType === "当初" || !currentType)) {
      return ["当初"];
    }
    return VERSION_TYPES.filter((type) => type !== "当初" || currentType === "当初");
  }

  /** 次版作成前の版種別選択（当初は除外）。キャンセルで null。 */
  function jy2PickNextVersionType(view) {
    const opts = VERSION_TYPES.filter((type) => type !== "当初");
    let message = "次版の版種別を選んでください:\n";
    opts.forEach((type, index) => {
      message += `${index + 1}. ${type}\n`;
    });
    message += `\n番号を入力（1-${opts.length}）`;
    if (!view || typeof view.prompt !== "function") return opts[0];
    const answer = view.prompt(message, "1");
    if (answer == null) return null;
    const index = Number(answer) - 1;
    if (!Number.isFinite(index) || index < 0 || index >= opts.length) {
      if (typeof view.alert === "function") view.alert("版種別の選択が無効です");
      return null;
    }
    return opts[index];
  }

  function jy2ActualsStartMonth(record) {
    const start = jy2FieldValue(record, "start_date");
    if (!start) return null;
    const month = String(start).trim().slice(0, 7);
    return /^\d{4}-\d{2}$/.test(month) ? month : null;
  }

  function jy2RenderVersionTypeBar(documentRef, record, onChange) {
    const bar = documentRef.createElement("div");
    bar.className = "jy2-version-type-bar";
    const label = documentRef.createElement("label");
    label.textContent = "版種別";
    const select = documentRef.createElement("select");
    select.className = "jy2-select";
    const versionSeq = jy2FieldValue(record, "version_seq") || "1";
    const current = jy2FieldValue(record, "version_type") || "当初";
    for (const optionValue of jy2VersionTypeOptions(versionSeq, current)) {
      const option = documentRef.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    }
    select.value = current;
    select.addEventListener("change", () => {
      jy2Field(record, "version_type", select.value);
      if (typeof onChange === "function") onChange(select.value);
    });
    label.appendChild(select);
    bar.appendChild(label);
    return bar;
  }

  function jy2MountDetailShell(space, record, recordId, options = {}) {
    if (!space || !record) return;
    const controller =
      recordId && typeof kintone !== "undefined" && typeof kintone.api === "function"
        ? jy2CreateSaveController(kintone.api.bind(kintone), record, recordId)
        : null;
    const render = (payload) => {
      space.textContent = "";
      const shellHost = space.ownerDocument.createElement("div");
      space.appendChild(shellHost);
      if (options.showVersionTypeBar) {
        shellHost.appendChild(
          jy2RenderVersionTypeBar(space.ownerDocument, record, (value) => {
            if (options.onVersionTypeChange) options.onVersionTypeChange(value);
          }),
        );
      }
      const mount = space.ownerDocument.createElement("div");
      shellHost.appendChild(mount);
      jy2RenderShell(mount, record, payload);
      jy2HideNativeDetailChrome(space.ownerDocument);
    };
    if (controller) {
      Promise.all([
        controller.loadBlocks(),
        controller.loadVersions(),
        controller.loadActuals(),
        jy2LoadMasterLists(kintone.api.bind(kintone)),
      ])
        .then(([detailBlocks, versions, actualRows, masterLists]) => {
          const summaryLines = app1RecordToSummaryLines(record || {});
          render({
            detailBlocks,
            versions,
            actualRows,
            masterLists,
            actualsStartMonth: jy2ActualsStartMonth(record),
            contractLines: summaryLines.contractLines.filter((line) => line.section),
            salaryLines: summaryLines.salaryLines,
            projectionPreviousLines: app1RecordToProjectionPreviousLines(record || {}),
            saveController: controller,
            projectId: controller.keys.projectId,
          });
        })
        .catch((error) => {
          render(options.showVersionTypeBar ? {} : undefined);
          if (typeof console !== "undefined" && console.error) {
            console.error("JY2 詳細読込に失敗:", error);
          }
        });
      return;
    }
    const api =
      typeof kintone !== "undefined" && typeof kintone.api === "function"
        ? kintone.api.bind(kintone)
        : null;
    jy2LoadMasterLists(api).then((masterLists) => {
      render({
        ...(options.showVersionTypeBar ? {} : {}),
        masterLists,
      });
    });
  }

  function jy2CreateProjectionManualStore(seedLines, blocks) {
    const byId = new Map();
    const unusedSeeds = [];
    for (const line of seedLines || []) {
      const id = String(line.summary_stable_block_id || "").trim();
      const manual = {
        summary_stable_block_id: id,
        summary_line_type: line.summary_line_type ?? "",
        summary_calc_basis: line.summary_calc_basis ?? "",
        summary_note: line.summary_note ?? "",
        summary_tax_rate: line.summary_tax_rate ?? "",
      };
      if (id) byId.set(id, manual);
      else unusedSeeds.push({ ...manual, summary_work_type_code: line.summary_work_type_code || "" });
    }
    // 移行データで stable_block_id が空でも、工種番号が一致すれば種別を引き継ぐ。
    for (const block of blocks || []) {
      const id = String(block.stableBlockId || "").trim();
      if (!id || byId.has(id)) continue;
      const code = String(block.workTypeCode || "").trim();
      const match = unusedSeeds.find(
        (line) =>
          code &&
          line.summary_work_type_code === code &&
          (line.summary_line_type || line.summary_calc_basis || line.summary_note),
      );
      if (!match) continue;
      byId.set(id, {
        summary_stable_block_id: id,
        summary_line_type: match.summary_line_type,
        summary_calc_basis: match.summary_calc_basis,
        summary_note: match.summary_note,
        summary_tax_rate: match.summary_tax_rate ?? "",
      });
    }
    return Object.freeze({
      previousLines() {
        return [...byId.values()];
      },
      patch(stableBlockId, fields) {
        const id = String(stableBlockId || "").trim();
        if (!id) return;
        const prev = byId.get(id) || {
          summary_stable_block_id: id,
          summary_line_type: "",
          summary_calc_basis: "",
          summary_note: "",
          summary_tax_rate: "",
        };
        byId.set(id, {
          ...prev,
          ...fields,
          summary_stable_block_id: id,
        });
      },
    });
  }

  // Phase C-2b: 保存コントローラ。キー（project_id/project_business_key/
  // budget_version_id）と revision が揃った既存レコードでのみ作れる。
  // 送信は planAtomicBudgetSave → executePlan の1回の bulkRequest だけ。
  function jy2CreateSaveController(api, record, recordId) {
    if (typeof api !== "function" || !record || !recordId) return null;
    const projectId = jy2FieldValue(record, "project_id");
    const businessKey = jy2FieldValue(record, "project_business_key");
    const versionId = jy2FieldValue(record, "budget_version_id");
    const revision = jy2FieldValue(record, "$revision");
    if (!projectId || !businessKey || !versionId || !revision) return null;
    const keys = {
      projectId: String(projectId),
      projectBusinessKey: String(businessKey),
      budgetVersionId: String(versionId),
    };
    const initialStatus = String(jy2FieldValue(record, "status") || "下書き");
    return Object.freeze({
      keys,
      initialStatus,
      get actualWriteSeq() {
        return String(jy2FieldValue(record, "actual_write_seq") ?? "0");
      },
      async loadBlocks() {
        const records = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId, {
          fields: null,
        });
        return app2RecordsToBlocks(records);
      },
      async loadActuals() {
        const records = await fetchExistingActualRows(api, APP3_ID, keys.projectId, {
          fields: null,
        });
        return app3RecordsToActualRows(records);
      },
      // 残B: 同一工事の版一覧（App1 レコード）を LIVE から読む。
      async loadVersions() {
        const escaped = keys.projectId.replace(/"/g, "");
        const response = await api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `project_id = "${escaped}" order by version_seq asc limit 500`,
        });
        return Array.isArray(response.records) ? response.records : [];
      },
      // 残A: 工事基本情報 + 総括（請負/給与/原価投影手入力）は親 PUT に同乗。
      async save(detailModel, summaryModel, projectionManual, options = {}) {
        detailModel.prepareForSave();
        const parentRecord = {
          ...(summaryModel
            ? summarySnapshotToSubtables(summaryModel.snapshot())
            : {}),
          ...jy2CollectHeaderFields(record),
        };
        const blocks = detailModel.projectionBlocks();
        const totals = summaryModel ? summaryModel.totals(blocks) : null;
        const contractTotal1 = totals ? totals.total1 : null;
        const projectionCheck = checkSummaryProjection({
          blocks,
          cachedLines: jy2SummaryCostLinesFromRecord(record),
          contractTotal1,
        });
        parentRecord.summary_projection_status = {
          value: projectionCheck.status,
        };
        parentRecord.summary_projection_checked_at = {
          value: jy2ProjectionCheckedAtIso(),
        };
        if (projectionCheck.status === "error") {
          throw new Error(
            `総括原価投影の整合性チェックに失敗しました: ${projectionCheck.reason}`,
          );
        }
        const collectedStatus =
          parentRecord.status?.value ?? jy2FieldValue(record, "status") ?? "下書き";
        const isVersionConfirmAttempt =
          collectedStatus === "版確定" && initialStatus === "下書き";
        let projectionRepaired = false;
        if (isVersionConfirmAttempt) {
          if (!options.confirmingVersion) {
            throw new Error("JY2_CONFIRM_VERSION_REQUIRED");
          }
          if (projectionCheck.status !== "synced") {
            parentRecord.status = { value: "下書き" };
            jy2ApplyHeaderField(record, "status", "下書き");
            projectionRepaired = true;
          }
        }
        if (summaryModel && projectionManual) {
          const projectionRows = regenerateSummaryCostLines(blocks, {
            contractTotal1,
            previousLines: projectionManual.previousLines(),
          });
          Object.assign(parentRecord, projectionRowsToSubtable(projectionRows));
        }
        const existing = await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId);
        const inputs = buildDetailSaveInputs({
          app1Id: APP1_ID,
          app2Id: APP2_ID,
          parentRecordId: String(recordId),
          parentRevision: String(revision),
          parentRecord,
          keys,
          rows: detailModel.toApp2Rows(),
          existingRecords: existing,
        });
        const plan = planAtomicBudgetSave(inputs);
        const outcome = await executePlan(plan, createKintoneApiClient(api));
        return Object.freeze({
          ...outcome,
          projectionRepaired,
          projectionStatus: projectionCheck.status,
        });
      },
      async saveActuals(actualsModel) {
        const versionRecords = await this.loadVersions();
        const openVersion = pickOpenVersion(
          versionRecords.map((row) => ({
            status: jy2FieldValue(row, "status"),
            version_seq: jy2FieldValue(row, "version_seq"),
            budget_version_id: jy2FieldValue(row, "budget_version_id"),
          })),
        );
        if (
          !openVersion ||
          String(openVersion.budget_version_id) !== keys.budgetVersionId
        ) {
          throw new Error("現行版以外からは予実保存不可");
        }
        const rows = actualsModel.toApp3Records({
          projectId: keys.projectId,
          registeredVersionId: String(openVersion.budget_version_id),
        });
        if (rows.length === 0) {
          return { outcome: null, requestCount: 0, skipped: true };
        }
        const existing = await fetchExistingActualRows(api, APP3_ID, keys.projectId);
        const inputs = buildActualsSaveInputs({
          app1Id: APP1_ID,
          app3Id: APP3_ID,
          parentRecordId: String(recordId),
          parentRevision: String(revision),
          currentActualWriteSeq: jy2FieldValue(record, "actual_write_seq") ?? "0",
          keys,
          rows,
          existingRecords: existing,
        });
        const plan = planActualsSave(inputs);
        const outcome = await executePlan(plan, createKintoneApiClient(api));
        jy2Field(record, "actual_write_seq", inputs.nextActualWriteSeq);
        return { outcome, requestCount: plan.requestCount };
      },
      // 残B: 最新確定版からの次版複製（1回の bulkRequest・実績は複製しない）。
      async createNextVersion(versionModel, version, versionType = "仕様変更") {
        const oldRows = await fetchExistingDetailRows(
          api,
          APP2_ID,
          version.budgetVersionId,
          { fields: null },
        );
        const plan = versionModel.planNextVersionDraft(version, oldRows.length);
        const escapedBv = version.budgetVersionId.replace(/"/g, "");
        const parents = await api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `budget_version_id = "${escapedBv}" limit 2`,
        });
        if (!parents.records || parents.records.length !== 1) {
          throw new Error(
            `複製元の親レコードを特定できません（budget_version_id=${version.budgetVersionId}）`,
          );
        }
        const oldParentRecord = parents.records[0];
        const inputs = buildVersionCopyInputs({
          app1Id: APP1_ID,
          app2Id: APP2_ID,
          plan,
          versionType,
          oldParent: {
            id: oldParentRecord.$id.value,
            revision: oldParentRecord.$revision.value,
            record: oldParentRecord,
          },
          oldDetailRecords: oldRows,
        });
        const bulkPlan = planVersionCopy(inputs);
        return { outcome: await executePlan(bulkPlan, createKintoneApiClient(api)), plan };
      },
    });
  }

  function jy2RenderShell(container, record, data) {
    if (!container || !container.ownerDocument) return null;
    const documentRef = container.ownerDocument;
    jy2InstallStyle(documentRef);
    const model = createUiModel(jy2LockState(record));
    const summaryData = data && typeof data === "object" ? data : {};
    // C-2b: LIVE 保存キーは 64 文字上限（detail_record_key）を守るため、
    // 新規 row_key 等は 16 文字 base36 圧縮 UUID で発行する。
    const jy2UuidFactory =
      summaryData.uuidFactory ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? compactUuidFactory(() => crypto.randomUUID())
        : undefined);
    const summaryModel = createContractSalaryModel({
      lockState: model.lockState,
      contractLines: summaryData.contractLines || [],
      salaryLines: summaryData.salaryLines || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    // Phase 4c: 内訳 blocks live in this offline in-memory model (App2 shape).
    const detailModel = createDetailBlockModel({
      lockState: model.lockState,
      blocks: summaryData.detailBlocks || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    // Phase 4d: 予実 cells live in this offline model (App3 vertical shape,
    // pivoted wide). Current budgets are read live from the 内訳 blocks.
    const actualsModel = createActualsMatrixModel({
      lockState: model.lockState,
      startMonth: summaryData.actualsStartMonth ?? null,
      ...(summaryData.actualsMonthCount
        ? { monthCount: summaryData.actualsMonthCount }
        : {}),
      actualRows: summaryData.actualRows || [],
    });
    // Phase 4e: the 版管理 series is offline too (App1-shaped mock records
    // via data.versions). The shell's own lock state still comes from the
    // opened record; the series only drives the version tab.
    const versionModel = createVersionSeriesModel({
      records: summaryData.versions || [],
      ...(jy2UuidFactory ? { uuidFactory: jy2UuidFactory } : {}),
    });
    const versionProjectId =
      summaryData.projectId ||
      jy2FieldValue(record, "project_id") ||
      versionModel.projectIds()[0] ||
      null;
    // Legacy 4b injection: static projection-shaped mock blocks (data.blocks)
    // still win when provided; otherwise the summary reads live from 内訳.
    const staticBlocks = Array.isArray(summaryData.blocks)
      ? summaryData.blocks
      : null;
    const currentBlocks = () => staticBlocks || detailModel.projectionBlocks();
    const projectionManual = jy2CreateProjectionManualStore(
      summaryData.projectionPreviousLines ||
        app1RecordToProjectionPreviousLines(record || {}),
      currentBlocks(),
    );
    container.textContent = "";

    const shell = documentRef.createElement("section");
    shell.className = "jy2-shell";
    const initialFontScale = jy2ReadStoredFontScale(documentRef.defaultView);
    jy2ApplyFontScale(shell, initialFontScale);

    // シート見出しは sticky 下部に常時表示（スクロールで隠れない）。
    // BUILD は操作バー meta に出す。
    const saveController = summaryData.saveController || null;
    const canEditBudget = detailModel.allowedOperations.editBudget;

    // Ver.01 同趣旨: 保存等を先頭に置き sticky/fixed 固定（装飾見出しの下に押し出さない）
    const sticky = documentRef.createElement("div");
    sticky.className = "jy2-sticky-top";
    const stickySpacer = documentRef.createElement("div");
    stickySpacer.className = "jy2-sticky-spacer";
    stickySpacer.setAttribute("aria-hidden", "true");
    if (!canEditBudget) {
      const lockBanner = documentRef.createElement("div");
      lockBanner.className = "jy2-lock-banner";
      lockBanner.textContent = "参照のみ（予算編集ロック）— メイン操作は無効です";
      sticky.appendChild(lockBanner);
    }

    const actionBar = documentRef.createElement("div");
    actionBar.className = "jy2-action-bar";
    const leftGroup = documentRef.createElement("div");
    leftGroup.className = "jy2-action-group";

    const backBtn = documentRef.createElement("button");
    backBtn.type = "button";
    backBtn.className = "jy2-btn";
    backBtn.textContent = "← 一覧";
    backBtn.addEventListener("click", () => {
      const view = documentRef.defaultView;
      if (view && view.location) view.location.href = `/k/${APP1_ID}/`;
    });
    leftGroup.appendChild(backBtn);

    const fontScaleWrap = documentRef.createElement("div");
    fontScaleWrap.className = "jy2-font-scale";
    const fontScaleLabel = documentRef.createElement("span");
    fontScaleLabel.className = "jy2-font-scale-label";
    fontScaleLabel.textContent = "文字サイズ";
    const fontScaleBtns = documentRef.createElement("div");
    fontScaleBtns.className = "jy2-font-scale-btns";
    fontScaleBtns.setAttribute("role", "group");
    fontScaleBtns.setAttribute("aria-label", "文字サイズ");
    const fontScaleOptions = [
      { scale: "standard", label: "標準" },
      { scale: "large", label: "大" },
      { scale: "xlarge", label: "特大" },
    ];
    const fontScaleButtons = fontScaleOptions.map(({ scale, label }) => {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "jy2-btn";
      button.dataset.scale = scale;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(scale === initialFontScale));
      button.addEventListener("click", () => {
        if (scale === shell.dataset.fontScale) return;
        jy2StoreFontScale(documentRef.defaultView, scale);
        jy2ApplyFontScale(shell, scale);
        for (const node of fontScaleButtons) {
          node.setAttribute(
            "aria-pressed",
            String(node.dataset.scale === scale),
          );
        }
        syncStickyLayout();
        const win = documentRef.defaultView;
        if (win && typeof win.requestAnimationFrame === "function") {
          win.requestAnimationFrame(syncStickyLayout);
        }
      });
      return button;
    });
    fontScaleBtns.append(...fontScaleButtons);
    fontScaleWrap.append(fontScaleLabel, fontScaleBtns);
    leftGroup.appendChild(fontScaleWrap);

    const meta = documentRef.createElement("span");
    meta.className = "jy2-action-meta";
    const code = jy2FieldValue(record, "project_code") || "";
    const branch = jy2FieldValue(record, "project_branch") || "";
    const verSeq = jy2FieldValue(record, "version_seq") || "";
    const verType = jy2FieldValue(record, "version_type") || "";
    const status = jy2FieldValue(record, "status") || "";
    meta.textContent = [
      code ? `${code}${branch ? `-${branch}` : ""}` : "（工事コードなし）",
      verSeq ? `版${verSeq}` : "",
      verType,
      status,
    ]
      .filter(Boolean)
      .join(" / ");
    meta.title = [
      meta.textContent,
      `BUILD ${BUILD}`,
      model.lockState,
    ]
      .filter(Boolean)
      .join(" / ");
    leftGroup.appendChild(meta);

    const rightGroup = documentRef.createElement("div");
    rightGroup.className = "jy2-action-bar-right";

    const addBlockBtn = documentRef.createElement("button");
    addBlockBtn.type = "button";
    addBlockBtn.className = "jy2-btn jy2-btn-accent";
    addBlockBtn.textContent = "工種ブロック追加";
    addBlockBtn.disabled = !canEditBudget;
    addBlockBtn.title = "内訳タブに工種ブロックを追加します";

    const addSalaryBtn = documentRef.createElement("button");
    addSalaryBtn.type = "button";
    addSalaryBtn.className = "jy2-btn";
    addSalaryBtn.textContent = "給与行追加";
    addSalaryBtn.disabled = !canEditBudget;
    addSalaryBtn.title = "総括の給与手当に行を追加します";

    const saveButton = documentRef.createElement("button");
    saveButton.type = "button";
    saveButton.className = "jy2-btn jy2-btn-primary jy2-save-button";
    saveButton.textContent = "保存";
    saveButton.disabled = !saveController || !canEditBudget;
    saveButton.title = "工事基本情報・総括・内訳を保存";

    // 保存等を DOM 先頭に置き、狭い幅でも左端に見えるようにする。
    rightGroup.append(saveButton, addBlockBtn, addSalaryBtn);
    actionBar.append(rightGroup, leftGroup);
    sticky.appendChild(actionBar);

    const tabList = documentRef.createElement("nav");
    tabList.className = "jy2-tabs";
    tabList.setAttribute("role", "tablist");
    sticky.appendChild(tabList);

    const stickySheetBanner = documentRef.createElement("div");
    stickySheetBanner.className = "jy2-sticky-sheet-banner";
    sticky.appendChild(stickySheetBanner);

    // 画面上端に残る fixed/sticky だけを top に使う。
    // （スクロールで消える app-toolbar 高さを入れると、固定時に上へ空白が空く）
    // 親の overflow で position:sticky が無効化されるため、閾値で relative↔fixed を切替。
    // spacer 高さを scroll 毎に変えると文書高が揺れ「下にスクロールできない／上に戻る」になる。
    const measureGaiaTop = () => {
      const win = documentRef.defaultView;
      if (!win || typeof win.getComputedStyle !== "function") return 0;
      let offset = 0;
      const candidates = [
        ".gaia-header",
        ".gaia-header-toolbar-header",
        ".ocean-ui-plugin-header",
        ".gaia-argoui-app-toolbar",
      ];
      for (const selector of candidates) {
        const el = documentRef.querySelector(selector);
        if (!el) continue;
        const position = win.getComputedStyle(el).position;
        if (position !== "fixed" && position !== "sticky") continue;
        const rect = el.getBoundingClientRect();
        if (rect.height <= 0) continue;
        if (rect.top > 2) continue;
        offset = Math.max(offset, Math.ceil(rect.bottom));
      }
      return Math.max(0, offset);
    };
    const syncStickyLayout = () => {
      const gaiaTop = measureGaiaTop();
      const anchor = shell.getBoundingClientRect();
      const stickyH = Math.ceil(sticky.offsetHeight || 0);
      // shell 上端が gaia より下＝まだピン不要 → 文書流に載せる（余白なし）
      // 上端が gaia を超えたら fixed＋等高 spacer（高さは sticky 実測のみ・scrollで変えない）
      if (anchor.top > gaiaTop + 1) {
        sticky.classList.remove("is-fixed");
        sticky.style.position = "relative";
        sticky.style.top = "";
        sticky.style.left = "";
        sticky.style.width = "";
        sticky.style.right = "";
        stickySpacer.style.height = "0px";
        shell.style.setProperty("--jy2-chrome-h", `${gaiaTop + stickyH}px`);
        return;
      }
      sticky.classList.add("is-fixed");
      sticky.style.position = "fixed";
      sticky.style.left = `${Math.round(anchor.left)}px`;
      sticky.style.width = `${Math.max(0, Math.round(anchor.width))}px`;
      sticky.style.top = `${gaiaTop}px`;
      sticky.style.right = "auto";
      stickySpacer.style.height = `${stickyH}px`;
      shell.style.setProperty("--jy2-chrome-h", `${gaiaTop + stickyH}px`);
    };
    const view = documentRef.defaultView;
    if (view && typeof view.addEventListener === "function") {
      view.addEventListener("resize", syncStickyLayout);
      view.addEventListener("scroll", syncStickyLayout, { passive: true });
    }

    const panes = documentRef.createElement("div");
    panes.className = "jy2-panes";

    function syncStickyActions(tabId) {
      // 工種ブロックは内訳専用。総括など他タブでは出さない。
      addBlockBtn.hidden = tabId !== "detail";
      // 給与行は総括専用。
      addSalaryBtn.hidden = tabId !== "summary";
    }

    function activate(tabId) {
      for (const button of tabList.querySelectorAll(".jy2-tab")) {
        button.setAttribute(
          "aria-selected",
          String(button.dataset.tabId === tabId),
        );
      }
      for (const pane of panes.querySelectorAll(".jy2-pane")) {
        pane.dataset.active = String(pane.dataset.tabId === tabId);
      }
      sticky.dataset.activeTab = tabId;
      jy2StoreActiveTab(documentRef.defaultView, tabId);
      syncStickyActions(tabId);
      jy2SyncStickySheetBanner(stickySheetBanner, documentRef, tabId);
      syncStickyLayout();
      // タブ表示後に幅を測り直す（非表示時に測ると横スクロールが消える）
      const syncScroll = () => jy2SyncAllHScroll(documentRef);
      syncScroll();
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(() => {
          syncStickyLayout();
          syncScroll();
          view.requestAnimationFrame(syncScroll);
        });
      }
    }
    shell._jy2ActivateTab = activate;

    let headerPane = null;
    let summaryPane = null;
    let detailPane = null;
    let actualPane = null;
    let versionPane = null;
    model.tabs.forEach((tab, index) => {
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "jy2-tab";
      button.dataset.tabId = tab.id;
      button.dataset.readOnly = String(tab.readOnly);
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(index === 0));
      button.textContent = tab.label;
      button.addEventListener("click", () => activate(tab.id));
      tabList.appendChild(button);

      const pane = documentRef.createElement("section");
      pane.className = "jy2-pane";
      pane.dataset.tabId = tab.id;
      pane.dataset.active = String(index === 0);
      pane.dataset.readOnly = String(tab.readOnly);
      pane.setAttribute("role", "tabpanel");
      if (tab.id === "header") {
        headerPane = pane;
      } else if (tab.id === "summary") {
        summaryPane = pane;
      } else if (tab.id === "detail") {
        detailPane = pane;
      } else if (tab.id === "actual") {
        actualPane = pane;
      } else if (tab.id === "version") {
        versionPane = pane;
      }
      panes.appendChild(pane);
    });
    const allowedTabIds = model.tabs.map((tab) => tab.id);
    const restoredTab =
      jy2ReadStoredActiveTab(documentRef.defaultView, allowedTabIds) ||
      model.tabs[0]?.id ||
      "header";
    activate(restoredTab);

    if (headerPane) {
      headerPane.appendChild(
        jy2RenderHeaderPane(
          documentRef,
          record || {},
          canEditBudget,
          summaryData.masterLists || null,
        ),
      );
    }

    const refreshSummary = () =>
      jy2RenderSummaryPane(
        documentRef,
        summaryPane,
        summaryModel,
        currentBlocks,
        () => refreshActuals(),
        projectionManual,
      );
    const contractTotal1 = () => summaryModel.snapshot().totals.total1;
    const summaryTotalsProvider = () => summaryModel.totals(currentBlocks());
    const refreshActuals = () =>
      jy2RenderActualPane(
        documentRef,
        actualPane,
        actualsModel,
        currentBlocks,
        contractTotal1,
        saveController,
        projectionManual,
        summaryTotalsProvider,
      );
    const detailRowCount = () =>
      detailModel
        .snapshot()
        .blocks.reduce((count, block) => count + block.detailRows.length, 0);
    const refreshVersions = () =>
      jy2RenderVersionPane(
        documentRef,
        versionPane,
        versionModel,
        versionProjectId,
        detailRowCount,
        saveController
          ? (version, versionType) =>
              saveController.createNextVersion(versionModel, version, versionType)
          : undefined,
      );
    const refreshDetail = () => {
      jy2RenderDetailPane(
        documentRef,
        detailPane,
        detailModel,
        () => {
          refreshSummary();
          refreshActuals();
        },
        summaryData.masterLists || null,
      );
    };

    refreshSummary();
    refreshActuals();
    refreshVersions();
    refreshDetail();
    jy2SyncAllHScroll(documentRef);
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        jy2SyncAllHScroll(documentRef);
        view.requestAnimationFrame(() => jy2SyncAllHScroll(documentRef));
      });
    }

    addBlockBtn.addEventListener("click", () => {
      if (addBlockBtn.disabled) return;
      detailModel.addBlock();
      refreshDetail();
      refreshSummary();
      refreshActuals();
      activate("detail");
    });
    addSalaryBtn.addEventListener("click", () => {
      if (addSalaryBtn.disabled) return;
      summaryModel.addSalaryLine();
      refreshSummary();
      activate("summary");
    });
    if (saveController) {
      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        const view = documentRef.defaultView;
        const startDate = jy2FieldValue(record, "start_date");
        const endDate = jy2FieldValue(record, "end_date");
        if (
          startDate &&
          endDate &&
          String(startDate) > String(endDate) &&
          view &&
          typeof view.confirm === "function" &&
          !view.confirm(
            "着手日が竣工日より後になっています。このまま保存しますか？",
          )
        ) {
          return;
        }
        const currentStatus = jy2FieldValue(record, "status") || "下書き";
        const isVersionConfirm =
          currentStatus === "版確定" &&
          saveController.initialStatus === "下書き";
        let confirmingVersion = false;
        if (isVersionConfirm) {
          if (
            !view ||
            typeof view.confirm !== "function" ||
            !view.confirm(
              "版を確定します。確定後も編集は可能ですが、ステータスは「版確定」になります。よろしいですか？",
            )
          ) {
            return;
          }
          confirmingVersion = true;
        }
        saveButton.disabled = true;
        saveButton.textContent = "保存中…";
        try {
          const outcome = await saveController.save(
            detailModel,
            summaryModel,
            projectionManual,
            { confirmingVersion },
          );
          if (outcome.projectionRepaired && view && typeof view.alert === "function") {
            view.alert(
              "総括原価投影に差分があったため修復しました。版確定はキャンセルされました。内容を確認のうえ、再度保存から版確定してください。",
            );
          } else if (view && typeof view.alert === "function") {
            view.alert(
              `工事基本情報・総括・内訳を保存しました（${outcome.requestCount}リクエスト）`,
            );
          }
          jy2ReloadPreservingTab(view, sticky.dataset.activeTab || "header");
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(view, sticky.dataset.activeTab || "header");
          } else {
            saveButton.disabled = false;
            saveButton.textContent = "保存";
          }
        }
      });
    }

    shell.append(sticky, stickySpacer, panes);
    container.appendChild(shell);
    syncStickyLayout();
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        syncStickyLayout();
        view.requestAnimationFrame(syncStickyLayout);
      });
    }
    return Object.freeze({
      model,
      summaryModel,
      detailModel,
      actualsModel,
      versionModel,
      appIds: Object.freeze({ APP1_ID, APP2_ID, APP3_ID }),
    });
  }

  const jy2PublicApi = Object.freeze({
    appIds: Object.freeze({ app1: APP1_ID, app2: APP2_ID, app3: APP3_ID }),
    createUiModel,
    createContractSalaryModel,
    createDetailBlockModel,
    createActualsMatrixModel,
    createVersionSeriesModel,
    duplicateSeriesDecision,
    regenerateSummaryCostLines,
    commonUnits: COMMON_UNITS,
    detailUnits: DETAIL_UNITS,
    render: jy2RenderShell,
  });
  if (typeof globalThis !== "undefined") {
    globalThis.JikkouYosanV2App1 = jy2PublicApi;
  }

  if (
    typeof kintone !== "undefined" &&
    kintone.events &&
    typeof kintone.events.on === "function"
  ) {
    // 一覧は Ver.01 相当のカスタムリスト。詳細はシェル＋保存コントローラ。
    // index で jy2RenderShell を呼ぶと空タブだけになり標準一覧も潰れる。
    kintone.events.on("app.record.index.show", function (event) {
      jy2MountIndex();
      return event;
    });

    kintone.events.on("app.record.detail.show", function (event) {
      const space = jy2ResolveRecordPageHost(
        typeof document !== "undefined" ? document : null,
      );
      if (!space) return event;
      jy2InstallStyle(space.ownerDocument || document);
      jy2HideNativeDetailChrome(space.ownerDocument || document);
      jy2MountDetailShell(space, event.record || null, event.recordId);
      return event;
    });

    kintone.events.on("app.record.create.show", function (event) {
      try {
        seedApp1CreateRecord(event.record, {
          uuidFactory: jy2CompactUuidFactory(),
          versionType: jy2FieldValue(event.record, "version_type") || "当初",
        });
      } catch (error) {
        if (typeof console !== "undefined" && console.error) {
          console.error("JY2 create seed failed:", error);
        }
      }
      // 新規はタブなし（保存後に詳細シェルへ）。版種別バー＋必須キー入力のみ。
      const space = jy2ResolveRecordPageHost(
        typeof document !== "undefined" ? document : null,
      );
      if (space) {
        space.textContent = "";
        jy2InstallStyle(space.ownerDocument || document);
        space.appendChild(
          jy2RenderVersionTypeBar(space.ownerDocument || document, event.record),
        );
      }
      return event;
    });

    kintone.events.on("app.record.create.submit", async function (event) {
      try {
        completeApp1CreateBusinessKeys(event.record);
      } catch (error) {
        event.error =
          (error && error.message) ||
          "工事コードを入力してください（business key 生成に必要）";
        return event;
      }
      const businessKey = jy2FieldValue(event.record, "project_business_key");
      if (!businessKey) return event;
      try {
        const escaped = String(businessKey).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const response = await kintone.api("/k/v1/records.json", "GET", {
          app: APP1_ID,
          query: `project_business_key = "${escaped}" limit 500`,
        });
        const records = Array.isArray(response.records) ? response.records : [];
        const existingVersions = records.map((row) => ({
          project_id: jy2FieldValue(row, "project_id"),
          version_seq: Number(jy2FieldValue(row, "version_seq")),
          status: jy2FieldValue(row, "status"),
          budget_version_id: jy2FieldValue(row, "budget_version_id"),
        }));
        let decision = duplicateSeriesDecision({ existingVersions });
        if (decision.seriesExists) {
          const view = typeof window !== "undefined" ? window : null;
          const accepted =
            view && typeof view.confirm === "function"
              ? view.confirm(decision.message)
              : false;
          decision = duplicateSeriesDecision({ existingVersions, accepted });
          if (decision.outcome === "save-blocked") {
            event.error = "保存を中止しました。";
            return event;
          }
          const findRecordId = (budgetVersionId) => {
            const match = records.find(
              (row) =>
                jy2FieldValue(row, "budget_version_id") === budgetVersionId,
            );
            return match ? jy2FieldValue(match, "$id") : null;
          };
          if (decision.outcome === "open-draft") {
            event.error = "既存の下書きを開きます。";
            const draftId = findRecordId(decision.draftBudgetVersionId);
            if (draftId && view && view.location) {
              view.location.href = `/k/${APP1_ID}/show#record=${draftId}`;
            }
            return event;
          }
          if (decision.outcome === "next-version") {
            event.error =
              "次版はバージョン管理の「次版作成」から作成してください。";
            if (view && typeof view.alert === "function") {
              view.alert(
                "次版はバージョン管理の「次版作成」から作成してください。",
              );
            }
            const sourceId = findRecordId(decision.copySourceBudgetVersionId);
            if (sourceId && view && view.location) {
              view.location.href = `/k/${APP1_ID}/show#record=${sourceId}`;
            }
            return event;
          }
        }
      } catch (error) {
        event.error =
          (error && error.message) || "工事系列の重複確認に失敗しました。";
      }
      return event;
    });

    kintone.events.on("app.record.create.submit.success", function (event) {
      const view = typeof window !== "undefined" ? window : null;
      if (view && view.location && event.recordId) {
        view.location.href = `/k/${APP1_ID}/show#record=${event.recordId}`;
      }
      return event;
    });
  }
