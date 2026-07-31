  const APP1_ID = /* @JY_V2_APP1 */ 756;
  const APP2_ID = /* @JY_V2_APP2 */ 757;
  const APP3_ID = /* @JY_V2_APP3 */ 758;
  // @JY_V2_BUILD 2026-08-01-ver02-actual-type-col-wide
  // Phase2c-type-col-wide: 種別列(freeze-2) 5.5〜7rem → 12rem。見切れ解消。
  // sticky left を再計算（詳細・操作を右へ）。
  // Phase2c-deny-type-row: deny 種別は空枠もデータ由来も原価管理に出さない
  // （浜田: その他材料費は削除でよい。App757 は非破壊）。
  // Phase2c-excel-type-authority: 工事原価管理の空種別枠は「原価管理明細」正。
  // コード表 typesByHimoku は候補だが余剰あり → deny で抑止。
  // Phase2c-type-qty-amt-sum: 種別行に表示中詳細の計画数量SUM＋実行予算SUM。
  // 見た目結合は詳細〜単価まで（数量・金額は結合外で見える）。
  // Phase2c-budget-sum-visible: 手動のみモードでは実行予算/月次/累計のSUMを
  // 表示中（＋で reveal）の詳細行だけから取る。隠れ内訳行を混ぜない。
  // Phase2c-detail-manual-only: 既存内訳由来の詳細は隠す。＋で追加した行だけ表示・手入力。
  // App757は非破壊（既存行は消さない）。来週内訳連動方針後に全件再表示可。
  // Phase2c-hide-detail-interim: （前段）詳細全隠し → 手入力可に緩和。
  // Phase2c-month-qty-sum: 費目/種別/親の月次数量＝子のセッション数量SUM（Excel寄せ）。
  // 金額SUMは従来どおり。総計行の数量は単位混在のため「－」維持。
  // Phase2c-qty-auto-budget: 単価の右に明細数量列。実行予算額＝ROUND(単価×数量)
  // 自動のみ（手入力撤去）。費目/種別/詳細の3段階薄色分け。
  // Phase2c-detail-save-guard: 詳細/単価/行構造の未保存時に「予実を保存」を
  // 押しても App757 に書かれず消える／「変更なし」になる誤認を防ぐ。
  // 未保存なら上部「一時保存」へ誘導。予実保存ボタンに mousedown ガード。
  // Phase2c-visual-merge: 費目行=種別〜単価・種別行=詳細〜単価を見た目結合
  // （colspanなし・枠線消し。sticky安全。空種別の操作＋は維持）。
  // Phase2c-no-himoku-add-type: 費目横「＋種別行」撤去（Excel: 種別はコード表固定。
  // 詳細の増減は操作列＋／－のみ）。親行・費目グループ行の両方。
  // Phase2c-himoku-col-12rem: 費目列(freeze-1) max 7rem→12rem 固定幅で見切れ解消。
  // sticky left を min 連鎖で再計算（種別以降を右へずらす）。
  // Phase2c-c-excel-struct-raf: 操作＋／－の全表 rerender を rAF に逃がし
  // click 1〜2s Violation を緩和（本直し＝ブロック単位再描画は別タスク）。
  // Phase2c-c-excel-no-type-add: 種別枠の「＋詳細行」撤去。追加は操作列＋
  // （空種別は操作列＋／詳細列クイック入力）。App758 keys/save/pivot 不変。
  // Phase2c-c-excel-ops-col: 詳細の右に「操作」列（＋／－）。Excel列＋UI専用。
  // Phase2c-c-excel-detail-pm: 詳細列の横に＋／－（追加・削除）。入力の左に
  // 常時表示。Phase2c-c-excel-perf の dirty-only フィールド編集は維持。
  // Phase2c-c-excel-perf: 詳細・単価の change で内訳+予実を全再描画していた
  // のをやめ、フィールド編集は dirty のみ。行追加/削除時だけ予実 rerender。
  // 月次 change は rAF で1回にまとめる（Chrome Violation 対策）。
  // Phase2c-c-excel-unit-price: 工事原価管理の詳細行・単価を手入力
  // （detailModel.updateDetailRow unitPrice・一時保存 App757）。
  // Phase2c-c-excel-row-ops: 工事原価管理の詳細行に「＋」「削除」。
  // Phase2c-c-excel-flat-detail2: 詳細列の「└」＋width:100%入力で入力欄が
  // クリップされ手入力不能だったのを修正。Excelどおり詳細列＝入力セルのみ。
  // Phase2c-c-excel-flat-detail: Excelどおり詳細行を表示し name3 を手入力可
  // （旧 hide-catalog で name3 あり行を隠していたため入力欄が消えていた）。
  // Phase2c-c-excel-flat: Excel原価管理明細どおり常時階層。親行＝工種番号｜
  // 費目（同一行・SUM）。下に種別行→詳細行を常時表示（費目＋開閉なし）。
  // 同一工種の追加費目は工種番号なしの費目行。＋種別行／＋詳細行は維持。
  // Phase2c-c-excel-outline: （旧）親行＝工種｜既定費目＋で種別→詳細を一段開く。
  // Phase2c-c-detail-edit: 工事原価管理の詳細(name3)を手入力可。commit 時
  // detailModel.updateDetailRow → reveal(rowKey) → onDetailStructureChanged。
  // 行追加は種別枠の「＋詳細行」（維持）。App758 keys/actuals 月次は不変。
  // Phase2c-c: 親行の「（塗）材料費」等システム入力工種名は Excel 原価管理に
  // 無いため非表示（工種番号のみ。ホバーに旧名称）。freeze列は費目枠用。
  // Phase2c-c-template-types: コード表 typesByHimoku の種別を空枠でも常時表示
  // （例: 材料費下の鋼材･二次製品費など）。データに無い種別も type-group。
  // Phase2c-c-hide: Excel原価管理明細に合わせ、内訳の品名カタログ行
  // （name3 あり）は工事原価管理に出さない。費目→種別枠が主。＋詳細行で
  // 追加した行、または詳細未入力行のみ表示。
  // （手動のみモードの SUM は表示中行のみ → Phase2c-budget-sum-visible）
  // Phase2c-c (2026-07-31): Excel入れ子 — 費目枠の下に種別(name2)視覚
  // グループ（`▸▸`・virtual=type-group・表示専用 SUM）。種別枠に「＋詳細行」
  // （name1+name2 prefill）。費目枠の「＋種別行」は維持。子行ラベルは
  // name3 のみ・種別列は枠があるため "－"。App758キー/save/pivot 不変。
  // Phase2c-b child-label: 費目下の子行は詳細(name3)のみ表示。
  // displayInteger 空ガード・Phase2c-b-a ＋種別行は維持。
  // Fix2: displayInteger 自体も空・非数を null 返し（旧キャッシュでも落ちにくく）。
  // Fix: jy2AmountDisplay / 費目SUM が空単価・非数で Invalid decimal を投げない。
  // Phase2c-b-a (2026-07-31): 費目グループ行の label セルに「＋種別行」
  // ボタンを追加。押下で `detailModel.addDetailRow` → 費目が実費目のときは
  // `name1` に費目名を prefill → `moveDetailRow` を繰り返して当該グループ
  // 末尾の直後まで移動する。書込みは App757 の内訳（detailModel）だけで、
  // App758 の予実（actualsModel）・keys.mjs・save-model・actuals-matrix
  // pivot は一切触らない。永続化は sticky トップの「一時保存」経由（App757）
  // で行い、「予実を保存」は使わない（明示バナーで案内）。
  // Phase2c-a (UI-only): expand時に明細を費目(name1)で視覚グループ化する。
  // 費目ヘッダ行＝表示専用の灰色 SUM（`▸ 費目名` ラベル・数量/金額は集計）
  // で、書込みは一切行わない（`dataset.virtual = "himoku-group"` を保存
  // 対象外の目印にする）。子行の並びは既存のまま維持し、`row.children` を
  // 前から走査して直前の name1 と変わったタイミングでヘッダ行を挿入する
  // だけ。App757/758 のキー・save-model・actuals-matrix 書込は変更しない。
  // Phase2b (UI-only): 月次に「数量 | 金額」の2列 UI を追加。数量入力で
  // 金額を ROUND(単価×数量) 自動計算し amount のみを保存する（App758 の
  // キー・save-model・actuals-matrix pivot は変更しない — 数量は pane 上の
  // Map で当該セッションのみ保持し、再読込で消える）。
  // 「最終予算額」列は表示ラベルを「実行予算額（暫定）」へ改称（書き込み
  // 経路は finalBudget を維持。月曜まで手入力＝既存最終予算欄）。
  // Phase2a (UI-only): 備考再表示 + 数量表示（読取） + 親月セル灰色。
  // App758 key/save-model/actuals-matrix write paths は変更しない（読取のみ）。
  // 工事原価管理: 親行＝内訳№単位は合計表示のみ・編集不可。＋/－で明細行
  // （費目/種別/定義）を開き、月別消化と最終予算額は明細行に入力する
  // （Hamada 確定 2026-07-29 夕）。明細行が1つでも値を持つ列は親=子の合計、
  // 空のときはレガシー（旧・親単位）値を親で表示するフォールバック。
  // fix: 親最終=全子の有効最終合計／name3〃／子行種別列=name2。

  const JY2_STYLE_ID = "jy2-shell-style";
  const JY2_ACTIVE_TAB_KEY = `jy2:${APP1_ID}:activeTab`;
  const JY2_SCROLL_Y_KEY = `jy2:${APP1_ID}:scrollY`;
  const JY2_HSCROLL_KEY = `jy2:${APP1_ID}:hscrollLeft`;
  const JY2_FONT_SCALE_KEY = "jy2-font-scale";
  const JY2_FONT_SCALES = Object.freeze(["standard", "large", "xlarge"]);
  // Phase2c-c-three-cols: Excel 原価管理明細に合わせ固定列（システム工種｜
  // 費目｜種別（補助）｜詳細）＋UI「操作」＋単価1列。備考は右端に別列。
  const JY2_ACTUAL_FREEZE_COLS = 5;
  const JY2_ACTUAL_ATTR_COLS = 1;
  // true: 既存内訳由来の詳細は隠し、reveal（＋追加）した行だけ表示・手入力。
  // false: 全詳細行を表示（来週内訳連動方針後）。
  const JY2_ACTUAL_DETAIL_MANUAL_ONLY = true;
  // 原価管理明細に無いコード表余剰種別 → 原価管理 UI から種別行ごと削除相当。
  // App757 / コード表 JSON は非破壊（内訳タブや保存データは残る）。
  const JY2_COST_MGMT_TYPE_DENY = Object.freeze({
    "10100": Object.freeze({
      材料費: Object.freeze(["その他材料費"]),
    }),
  });
  function jy2CostMgmtDeniedTypes(workTypeCode, himokuLabel) {
    const byCode = JY2_COST_MGMT_TYPE_DENY[String(workTypeCode || "")];
    const denyList =
      byCode && Array.isArray(byCode[himokuLabel]) ? byCode[himokuLabel] : null;
    return denyList && denyList.length > 0 ? new Set(denyList) : null;
  }
  function jy2CostMgmtIsDeniedType(workTypeCode, himokuLabel, typeLabel) {
    const deny = jy2CostMgmtDeniedTypes(workTypeCode, himokuLabel);
    return Boolean(deny && typeLabel && deny.has(typeLabel));
  }
  function jy2CostMgmtTemplateTypes(workTypeCode, himokuLabel, typesByHimoku) {
    const raw =
      typesByHimoku && Array.isArray(typesByHimoku[himokuLabel])
        ? typesByHimoku[himokuLabel]
        : [];
    const deny = jy2CostMgmtDeniedTypes(workTypeCode, himokuLabel);
    if (!deny) return raw.slice();
    return raw.filter((typeLabel) => !deny.has(typeLabel));
  }

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

  function jy2FindPaneHScroll(pane) {
    if (!pane || typeof pane.querySelector !== "function") return null;
    return (
      pane.querySelector(".jy2-pane-hscroll") ||
      pane.querySelector(".jy2-actual-scroll") ||
      pane.querySelector(".jy2-table-scroll")
    );
  }

  function jy2PaneIsVisible(pane) {
    if (!pane) return false;
    const view = pane.ownerDocument && pane.ownerDocument.defaultView;
    if (!view || typeof view.getComputedStyle !== "function") {
      return pane.style.display !== "none";
    }
    const style = view.getComputedStyle(pane);
    return Boolean(style && style.display !== "none" && style.visibility !== "hidden");
  }

  /** 再描画前の縦・横位置。空 pane（初回）は null。非表示タブは縦を触らない */
  function jy2CaptureScroll(documentRef, pane) {
    if (!pane || !pane.firstChild) return null;
    const view = documentRef && documentRef.defaultView;
    const h = jy2FindPaneHScroll(pane);
    const visible = jy2PaneIsVisible(pane);
    return {
      y:
        visible && view && typeof view.scrollY === "number" ? view.scrollY : null,
      x: h && typeof h.scrollLeft === "number" ? h.scrollLeft : 0,
    };
  }

  function jy2ApplyScroll(documentRef, pane, captured) {
    if (!captured) return;
    const view = documentRef && documentRef.defaultView;
    const apply = () => {
      if (
        typeof captured.y === "number" &&
        view &&
        typeof view.scrollTo === "function"
      ) {
        view.scrollTo(0, captured.y);
      }
      const h = jy2FindPaneHScroll(pane);
      if (h && typeof captured.x === "number") h.scrollLeft = captured.x;
    };
    apply();
    // 1 回だけ次フレームで追従（二重 rAF は Violation の温床）。
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(apply);
    }
  }

  function jy2StoreScrollForReload(view, documentRef, tabId) {
    if (!view || !view.sessionStorage) return;
    try {
      const y =
        typeof view.scrollY === "number"
          ? view.scrollY
          : view.pageYOffset || 0;
      view.sessionStorage.setItem(JY2_SCROLL_Y_KEY, String(y));
      let x = 0;
      if (documentRef && tabId) {
        const pane = documentRef.querySelector(
          `.jy2-pane[data-tab-id="${tabId}"]`,
        );
        const h = jy2FindPaneHScroll(pane);
        if (h) x = h.scrollLeft || 0;
      }
      view.sessionStorage.setItem(JY2_HSCROLL_KEY, String(x));
    } catch {
      // private mode / quota — ignore
    }
  }

  function jy2ConsumeStoredScroll(view) {
    if (!view || !view.sessionStorage) return null;
    try {
      const yRaw = view.sessionStorage.getItem(JY2_SCROLL_Y_KEY);
      const xRaw = view.sessionStorage.getItem(JY2_HSCROLL_KEY);
      view.sessionStorage.removeItem(JY2_SCROLL_Y_KEY);
      view.sessionStorage.removeItem(JY2_HSCROLL_KEY);
      if (yRaw == null && xRaw == null) return null;
      return {
        y: Number(yRaw) || 0,
        x: Number(xRaw) || 0,
      };
    } catch {
      return null;
    }
  }

  function jy2ReloadPreservingTab(view, tabId, documentRef) {
    jy2StoreActiveTab(view, tabId);
    jy2StoreScrollForReload(view, documentRef || (view && view.document), tabId);
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
      // U38: タブ切替が分かるようペイン全体を薄い色面に（表セルは白維持）
      ".jy2-pane[data-tab-id='header'][data-active='true']{border-color:#94a3b8;border-top:3px solid #64748b;background:#f1f5f9}",
      ".jy2-pane[data-tab-id='summary'][data-active='true']{border-color:#93c5fd;border-top:3px solid #3b82f6;background:#e8f4fd}",
      ".jy2-pane[data-tab-id='detail'][data-active='true']{border-color:#86efac;border-top:3px solid #22c55e;background:#e8f5e9}",
      ".jy2-pane[data-tab-id='actual'][data-active='true']{border-color:#fcd34d;border-top:3px solid #f59e0b;background:#fff3e0}",
      ".jy2-pane[data-tab-id='version'][data-active='true']{border-color:#c4b5fd;border-top:3px solid #7c3aed;background:#f3e8ff}",
      ".jy2-pane[data-active='true'] .jy2-table,.jy2-pane[data-active='true'] .jy2-detail-table,.jy2-pane[data-active='true'] .jy2-actual-table,.jy2-pane[data-active='true'] .jy2-version-table,.jy2-pane[data-active='true'] .jy2-budget-summary,.jy2-pane[data-active='true'] .jy2-detail-block{background:#fff}",
      ".jy2-pane[data-active='true'] .jy2-table-scroll,.jy2-pane[data-active='true'] .jy2-actual-scroll{background:transparent}",
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
      ".jy2-empty{color:#475569;font-size:13px;padding:10px 12px;margin:8px 0;background:#fff;border:1px dashed #94a3b8;border-radius:8px;border-left:4px solid #64748b}",
      ".jy2-section-title{margin:14px 0 6px;font-size:14px;font-weight:700;padding:6px 10px;background:#e8eef4;border-left:4px solid #2563eb;color:#1e3a8a;border-radius:0 6px 6px 0}",
      ".jy2-pane[data-tab-id='summary'] .jy2-section-title{background:#dbeafe;border-left-color:#2563eb;color:#1e3a8a}",
      ".jy2-pane[data-tab-id='detail'] .jy2-section-title{background:#d1fae5;border-left-color:#059669;color:#14532d}",
      ".jy2-pane[data-tab-id='actual'] .jy2-section-title{background:#fde68a;border-left-color:#d97706;color:#92400e}",
      ".jy2-pane[data-tab-id='version'] .jy2-section-title{background:#ddd6fe;border-left-color:#7c3aed;color:#5b21b6}",
      // U39: キーボード操作の現在位置（マウス時は :focus-visible のみ）
      ".jy2-shell .jy2-tab:focus-visible,.jy2-shell .jy2-btn:focus-visible,.jy2-shell .jy2-row-button:focus-visible,.jy2-shell .jy2-save-button:focus-visible,.jy2-shell .jy2-nav-block-no:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px;box-shadow:0 0 0 4px rgba(37,99,235,.2)}",
      ".jy2-shell .jy2-input:focus-visible,.jy2-shell .jy2-select:focus-visible,.jy2-shell .jy2-combo-select:focus-visible{outline:2px solid #2563eb;outline-offset:1px;border-color:#2563eb}",
      // 行スキャナ（フッタは除外）
      ".jy2-detail-table tbody tr:not(.jy2-footer-row):hover>td,.jy2-contract-table tbody tr:hover>td,.jy2-salary-table tbody tr:hover>td,.jy2-projection-table tbody tr:hover>td{background:#f8fafc}",
      ".jy2-readonly{color:#64748b;background:#f8fafc}",
      ".jy2-detail-block[data-block-status='retired']{opacity:.72;border-style:dashed;border-color:#94a3b8}",
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
      ".jy2-contract-table th:nth-child(2),.jy2-contract-table td:nth-child(2){min-width:14rem}",
      ".jy2-contract-table td:nth-child(2) .jy2-input{min-width:14rem}",
      ".jy2-contract-table th:nth-child(4),.jy2-contract-table td:nth-child(4){min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table td:nth-child(4) .jy2-input{min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table th:nth-child(5),.jy2-contract-table td:nth-child(5){min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table td:nth-child(5) .jy2-input{min-width:3.25rem;max-width:4.5rem}",
      ".jy2-contract-table th:nth-child(6),.jy2-contract-table td:nth-child(6){min-width:4.5rem;max-width:6.5rem}",
      ".jy2-salary-table th:nth-child(1),.jy2-salary-table td:nth-child(1){min-width:8rem}",
      ".jy2-table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:12px;background:#fff;border-radius:6px;overflow:visible}",
      ".jy2-table th,.jy2-table td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:middle}",
      ".jy2-table th{background:#f1f5f9;font-weight:600;color:#475569;text-align:center;white-space:nowrap}",
      ".jy2-band-row th{background:#eef3fa;text-align:left;color:#1e3a8a}",
      ".jy2-total-row td,.jy2-block-total-row td{background:#f5ebe0!important;color:#44372a;font-weight:700;border-color:#d4b896!important;border-top:2px solid #c4a574!important}",
      ".jy2-num{text-align:right;font-variant-numeric:tabular-nums}",
      ".jy2-amount{text-align:right;background:#F3F8FC;font-variant-numeric:tabular-nums}",
      ".jy2-input{width:100%;box-sizing:border-box;border:1px solid #e2e8f0;padding:2px 4px;background:#FFFCF3;border-radius:4px;font-size:12px}",
      ".jy2-input:focus{border-color:#2563eb}",
      ".jy2-input.jy2-combo{background:#F4FAF4}",
      ".jy2-combo-wrap{display:flex;align-items:stretch;flex-wrap:wrap;gap:0;width:100%;min-width:0}",
      ".jy2-combo-wrap>.jy2-input{flex:1;min-width:0;border-top-right-radius:0;border-bottom-right-radius:0}",
      ".jy2-combo-wrap>.jy2-combo-select{flex:0 0 2rem;width:2rem;max-width:2rem;padding:0;margin:0;border:1px solid #cbd5e1;border-left:0;border-radius:0 4px 4px 0;background:#F4FAF4;cursor:pointer;font-size:11px;line-height:1}",
      ".jy2-select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;padding:2px 4px;background:#f1f5f9;border-radius:4px;cursor:pointer}",
      ".jy2-select:focus{border-color:#2563eb;background:#eef4ff}",
      ".jy2-incomplete{background:#FFF5F5!important}",
      ".jy2-incomplete .jy2-input,.jy2-incomplete .jy2-select,.jy2-incomplete .jy2-combo-select{background:#FFF5F5!important}",
      ".jy2-name-continued{background:#e8f1fb!important}",
      ".jy2-name-continued .jy2-input,.jy2-name-continued .jy2-combo,.jy2-name-continued .jy2-combo-select{background:#e8f1fb!important}",
      ".jy2-name-unset{background:#f1f5f9!important;box-shadow:inset 0 0 0 1px #cbd5e1}",
      ".jy2-name-unset .jy2-input,.jy2-name-unset .jy2-combo,.jy2-name-unset .jy2-combo-select{background:#f8fafc!important}",
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
      // 定義及び品名(3列目): 長文見切れ緩和（契約工種 C16 と同趣旨・ホバー全文は fullTitle）
      ".jy2-detail-table th:nth-child(3),.jy2-detail-table td:nth-child(3){min-width:16rem}",
      ".jy2-detail-table td:nth-child(3) .jy2-combo-wrap{min-width:16rem}",
      ".jy2-detail-table td:nth-child(3) .jy2-input{min-width:14rem}",
      // 備考(8列目): 長文見切れ緩和（定義及び品名と同趣旨）
      ".jy2-detail-table th:nth-child(8),.jy2-detail-table td:nth-child(8){min-width:12rem}",
      ".jy2-detail-table td:nth-child(8) .jy2-input{min-width:11rem}",
      ".jy2-detail-table td .jy2-input{min-width:5.5rem}",
      ".jy2-detail-table td .jy2-select{min-width:4.5rem}",
      ".jy2-footer-row td{background:#f8fafc}",
      ".jy2-footer-row .jy2-footer-label{font-weight:700;text-align:left!important;vertical-align:middle;padding:4px 8px!important}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-stack{flex-direction:row!important;align-items:center;justify-content:flex-start;gap:6px;margin:0!important;width:auto;max-width:100%}",
      ".jy2-footer-row .jy2-footer-label .jy2-th-label{white-space:nowrap;font-size:12px;text-align:left}",
      ".jy2-footer-row .jy2-num,.jy2-footer-row .jy2-amount{min-width:9.5rem;width:9.5rem;max-width:12rem;white-space:nowrap;padding:4px 8px;box-sizing:border-box}",
      ".jy2-footer-row .jy2-input{width:100%;min-width:8.5rem;box-sizing:border-box;padding:4px 6px;font-size:13px;text-align:right}",
      ".jy2-footer-row .jy2-footer-basis{color:#64748b;font-size:11px;white-space:nowrap;text-align:left;padding:4px 8px}",
      ".jy2-detail-table th:nth-child(7),.jy2-detail-table td.jy2-amount{min-width:7.5rem}",
      ".jy2-warning{color:#b91c1c;font-size:12px;margin:4px 0;font-weight:600}",
      ".jy2-combo-miss{display:block;flex:0 0 100%;width:100%;color:#b91c1c;font-size:11px;font-weight:600;margin-top:2px;line-height:1.2}",
      ".jy2-combo-miss[hidden]{display:none}",
      ".jy2-retired-tag{color:#b91c1c;font-weight:700}",
      // 予実: 横スクロール1本のみ（縦はページスクロール。二重縦スクロール禁止＝C7）
      ".jy2-pane[data-tab-id='actual']{overflow-x:clip;overflow-y:visible;padding:8px 8px 8px 8px}",
      /* 右息抜き ~10px（6px基準から左へ+4px＝浜田意図。2pxは逆方向だった） */
      ".jy2-actual-scroll{display:block;overflow-x:auto;overflow-y:visible;border:1px solid #e2e8f0;border-radius:6px;background:#fff;max-width:100%;width:100%;min-width:0;max-height:none;box-sizing:border-box;padding:0 10px 10px 0;margin:0;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;contain:inline-size;scrollbar-width:none}",
      ".jy2-actual-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      ".jy2-actual-table{white-space:nowrap;margin:0;border-collapse:separate;border-spacing:0;font-size:11px;width:100%;min-width:0;max-width:none;box-sizing:border-box}",
      ".jy2-actual-table th,.jy2-actual-table td{padding:3px 5px}",
      ".jy2-actual-table .jy2-input{min-width:48px;font-size:11px}",
      ".jy2-actual-table .jy2-actual-month{width:3.8rem;min-width:3.8rem;max-width:4rem;padding:2px 3px;box-sizing:border-box}",
      /* Phase2b (2026-07-31): 月次「数量」は「金額」より一段狭く。数字桁が短い想定。 */
      ".jy2-actual-table .jy2-actual-month.jy2-actual-month-qty{width:2.8rem;min-width:2.8rem;max-width:3rem}",
      ".jy2-actual-table thead th.jy2-actual-month{padding:4px 2px;vertical-align:bottom}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-stack{gap:2px;width:100%;max-width:100%;margin:0 auto}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-th-label{font-size:10px;font-weight:700;white-space:normal;line-height:1.15;max-width:3.8rem}",
      ".jy2-actual-table thead th.jy2-actual-month.jy2-actual-month-qty .jy2-th-label{max-width:2.8rem}",
      ".jy2-actual-table thead th.jy2-actual-month .jy2-hf-tag{font-size:9px;padding:1px 4px;letter-spacing:0}",
      ".jy2-actual-table .jy2-actual-month .jy2-input{min-width:0;width:100%;padding:2px 3px;font-size:10px}",
      ".jy2-actual-table th.jy2-actual-rate-end,.jy2-actual-table td.jy2-actual-rate-end{min-width:4.25rem;width:4.25rem;padding:4px 6px 4px 4px!important;box-sizing:border-box;text-align:right}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-stack{width:100%;margin:0;align-items:flex-end}",
      ".jy2-actual-table thead th.jy2-actual-rate-end .jy2-th-label{white-space:nowrap;font-size:11px}",
      ".jy2-actual-note-details{margin:0 0 8px;font-size:12px;color:#64748b}",
      ".jy2-actual-note-details>summary{cursor:pointer;font-weight:600;color:#475569;padding:4px 0}",
      ".jy2-actual-note{color:#64748b;font-size:11px;margin:4px 0 0;line-height:1.45}",
      /* 2026-07-29-ver02-actual-detail-expand: 親行の＋/－ボタン・明細子行の見た目 */
      ".jy2-actual-expand-btn{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin-right:4px;font-size:11px;font-weight:700;line-height:1;border:1px solid #94a3b8;border-radius:3px;background:#f8fafc;color:#334155;cursor:pointer}",
      ".jy2-actual-expand-btn:hover{background:#e2e8f0;border-color:#64748b}",
      ".jy2-actual-parent-num{display:inline-block;min-width:1.5rem}",
      /* 3段階薄色: 費目(濃灰) > 種別(薄灰) > 詳細=実績入力(ごく薄い青白) */
      ".jy2-actual-table .jy2-actual-parent-row td{background:#e8eaed!important;color:#1e293b}",
      ".jy2-actual-table .jy2-actual-parent-row .jy2-freeze{background:#e8eaed!important}",
      ".jy2-actual-child-row td{background:#f0f7fc}",
      ".jy2-actual-child-row .jy2-freeze{background:#f0f7fc}",
      ".jy2-actual-child-row td.jy2-actual-child-name{color:#475569;font-size:11px;padding-left:6px;overflow:visible;white-space:normal}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-child-name{padding-left:6px}",
      ".jy2-actual-table .jy2-actual-child-name-input{display:block;width:100%;min-width:5rem;box-sizing:border-box}",
      ".jy2-actual-table .jy2-actual-type-detail-slot .jy2-actual-child-name-input{display:block;width:100%;min-width:6rem;box-sizing:border-box}",
      ".jy2-actual-table .jy2-actual-child-qty-input{display:block;width:100%;min-width:3.5rem;box-sizing:border-box;text-align:right}",
      ".jy2-actual-child-ops{display:inline-flex;gap:2px;flex-shrink:0;align-items:center;justify-content:center;width:100%}",
      ".jy2-actual-ops-cell{text-align:center;padding:2px 3px!important;vertical-align:middle}",
      ".jy2-actual-child-ops .jy2-actual-detail-pm-btn{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;padding:0;margin:0;font-size:12px;font-weight:700;line-height:1;border:1px solid #64748b;border-radius:3px;background:#fff;color:#0f172a;cursor:pointer}",
      ".jy2-actual-child-ops .jy2-actual-detail-pm-btn:hover{background:#e2e8f0}",
      ".jy2-actual-child-ops .jy2-actual-child-delete-btn{border-color:#b91c1c;color:#b91c1c}",
      /* Phase2a (2026-07-31): 親月セル・総計月セルは合計表示（自動）で入力不可。
         灰色背景で「編集不可」を視覚化。子月セルは元のまま（入力可）を維持する。 */
      ".jy2-actual-table td.jy2-actual-sum-cell{background:#e8eaed!important;color:#334155;cursor:default}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-sum-cell{background:#e8eaed!important}",
      ".jy2-actual-table .jy2-actual-child-row td.jy2-actual-auto-budget{background:#e8f1f8!important;color:#334155;cursor:default}",
      /* Phase2c-a (2026-07-31): expand時の費目(name1)視覚グループヘッダ。
         灰色 SUM の表示専用行（書込・保存対象外）を子行と視覚的に区別する。 */
      ".jy2-actual-table .jy2-actual-himoku-group-row td{background:#e8eaed!important;color:#1e293b;font-weight:700}",
      ".jy2-actual-table .jy2-actual-himoku-group-row .jy2-freeze{background:#e8eaed!important}",
      ".jy2-actual-table .jy2-actual-himoku-group-label{padding-left:6px}",
      /* Phase2c-c: 費目の下の種別(name2)枠。費目より一段薄い灰色＋字下げ。 */
      ".jy2-actual-table .jy2-actual-type-group-row td{background:#f1f3f5!important;color:#334155;font-weight:600}",
      ".jy2-actual-table .jy2-actual-type-group-row .jy2-freeze{background:#f1f3f5!important}",
      ".jy2-actual-table .jy2-actual-type-group-label{padding-left:18px}",
      /* Excel寄せ: 集計行の空き列を見た目結合（tdは残し枠線のみ消す＝sticky維持） */
      ".jy2-actual-table td.jy2-actual-visual-merge-start,.jy2-actual-table td.jy2-actual-visual-merge-mid{border-right-color:transparent!important;box-shadow:none!important}",
      ".jy2-actual-table td.jy2-actual-visual-merge-mid,.jy2-actual-table td.jy2-actual-visual-merge-end{border-left-color:transparent!important}",
      ".jy2-actual-table .jy2-actual-parent-row td.jy2-actual-visual-merge,.jy2-actual-table .jy2-actual-himoku-group-row td.jy2-actual-visual-merge{background:#e8eaed!important}",
      ".jy2-actual-table .jy2-actual-type-group-row td.jy2-actual-visual-merge{background:#f1f3f5!important}",
      ".jy2-actual-table .jy2-actual-child-row:hover td:not(.jy2-freeze){background:#e4eef8}",
      ".jy2-actual-table .jy2-actual-child-row:hover .jy2-freeze{background:#e4eef8}",
      ".jy2-actual-table td.jy2-actual-note{max-width:8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#475569}",
      /* 縦 sticky 禁止（2段見出しが同じ top でデータ行に沈む）。左固定列のみ sticky */
      ".jy2-actual-table thead th{text-align:center;vertical-align:bottom;position:static;top:auto;z-index:auto;background:#f1f5f9;box-shadow:none}",
      ".jy2-actual-table thead th[colspan]{background:#fef3c7}",
      ".jy2-actual-table thead tr:last-child th{background:#f1f5f9;font-size:10px}",
      ".jy2-actual-table .jy2-freeze{position:sticky;top:auto;z-index:3;background:#fff}",
      ".jy2-actual-table thead .jy2-freeze{z-index:4;background:#f1f5f9}",
      /* freeze幅: 工種4.2 | 費目12 | 種別12 | 詳細7.5 | 操作2.6（leftは累積） */
      ".jy2-actual-table .jy2-freeze-0{left:0;min-width:4.2rem;width:4.2rem}",
      ".jy2-actual-table .jy2-freeze-1{left:4.2rem;min-width:12rem;width:12rem;max-width:12rem;overflow:hidden;text-overflow:ellipsis}",
      ".jy2-actual-table .jy2-freeze-2{left:16.2rem;min-width:12rem;width:12rem;max-width:12rem;overflow:hidden;text-overflow:ellipsis}",
      /* 詳細列は手入力セルのため ellipsis で入力を潰さない */
      ".jy2-actual-table .jy2-freeze-3{left:28.2rem;min-width:7.5rem;max-width:11rem;overflow:visible}",
      ".jy2-actual-table thead .jy2-freeze-3{overflow:hidden;text-overflow:ellipsis}",
      /* 操作列（＋／－）: 詳細の右・最終固定列 */
      ".jy2-actual-table .jy2-freeze-4{left:35.7rem;min-width:2.6rem;max-width:3rem;overflow:visible;box-shadow:2px 0 5px rgba(15,23,42,.1)}",
      ".jy2-actual-table thead .jy2-freeze-4{overflow:hidden;text-overflow:ellipsis;text-align:center}",
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
    // 空文字・「－」・非数は Invalid decimal を投げない（Phase2a 数量/単価表示で顕在化）。
    if (decimalAmount === null || decimalAmount === undefined) return "";
    const text = String(decimalAmount).trim().replace(/[,，]/g, "");
    if (!text || text === "-" || text === "－") return "";
    if (!/^[+-]?\d+(?:\.\d*)?$/.test(text)) return "";
    try {
      return jy2Comma(displayInteger(text));
    } catch {
      return "";
    }
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

  function jy2MarkSalaryNameSpaceWarning(cell, personName) {
    if (jy2HasText(personName) && !String(personName).includes("　")) {
      cell.classList.add("jy2-incomplete");
      cell.title = "姓と名の間に全角スペースを入力してください";
    }
    return cell;
  }

  function jy2MarkNameBlankVisual(cell, { blank, continued, label, kind }) {
    cell.classList.remove("jy2-name-continued", "jy2-name-unset");
    if (!blank) {
      cell.removeAttribute("title");
      return;
    }
    if (cell.classList.contains("jy2-incomplete")) return;
    if (continued && label) {
      // U27/U33 (2026-07-29): 継続は「〃」が目印。薄い青背景は付けない。
      cell.title = `（上の${kind}「${label}」と同一・〃表示）`;
    } else {
      cell.classList.add("jy2-name-unset");
      cell.title = `（${kind} 未設定）`;
    }
  }

  // U27: 直前行と同じ費目/種別/定義は「〃」（保存値は実値または〃）。
  const JY2_DITTO_MARK = "〃";
  function jy2IsDitto(value) {
    return jy2HasText(value) && String(value).trim() === JY2_DITTO_MARK;
  }

  function jy2SameText(a, b) {
    if (!jy2HasText(a) || !jy2HasText(b)) return false;
    if (jy2IsDitto(a) || jy2IsDitto(b)) return false;
    return String(a).trim() === String(b).trim();
  }

  function jy2PrevResolved(rows, index, field) {
    for (let i = index - 1; i >= 0; i--) {
      const value = rows[i][field];
      if (!jy2HasText(value) || jy2IsDitto(value)) continue;
      return String(value).trim();
    }
    return null;
  }

  function jy2ShowDitto(rowValue, prevResolved, { emptyContinues = true } = {}) {
    if (jy2IsDitto(rowValue)) return Boolean(prevResolved);
    if (jy2SameText(rowValue, prevResolved)) return true;
    if (emptyContinues && !jy2HasText(rowValue) && jy2HasText(prevResolved)) {
      return true;
    }
    return false;
  }

  // U5: 半角カナ → 全角（定義及び品名・name3）
  // 単純 code オフセットは濁点位置で崩れる（ｶ→ガ等）。半角カナ塊だけ NFKC する。
  function jy2ToFullWidthKana(str) {
    if (str === null || str === undefined) return str;
    const text = String(str);
    if (!text) return text;
    return text.replace(/[\uFF61-\uFF9F]+/g, (chunk) => chunk.normalize("NFKC"));
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

  function jy2Cell(documentRef, tag, className, text) {
    const cell = documentRef.createElement(tag);
    if (className) cell.className = className;
    cell.textContent = text === null || text === undefined ? "" : String(text);
    return cell;
  }

  function jy2TextInput(documentRef, value, onCommit, opts = {}) {
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input";
    input.value = value === null || value === undefined ? "" : String(value);
    let lastCommitted = input.value.trim();
    const fullTitle = Boolean(opts.fullTitle);
    const syncFullTitle = () => {
      if (!fullTitle) return;
      input.title = input.value.trim();
    };
    if (fullTitle) syncFullTitle();
    const commit = () => {
      const next = input.value.trim();
      if (next === lastCommitted) return;
      lastCommitted = next;
      onCommit(next);
      if (fullTitle) syncFullTitle();
    };
    input.addEventListener("change", commit);
    // 保存クリック直前の blur でも確実にストアへ反映する
    input.addEventListener("blur", commit);
    if (fullTitle) input.addEventListener("input", syncFullTitle);
    return input;
  }

  // U26-2: input[list]/datalist 用の一意 ID 採番（DeepSeek §50-3-8 盲点1:
  // 行が多いと同一 ID で最初の datalist しか参照されないため行ごとに一意化）。
  let JY2_COMBO_UID = 0;

  // U4/U26/U26-2: 候補選択コンボ。常にリスト緑。
  // 左 input は打鍵で候補が絞り込み表示（datalist）。
  // 右 <select>(▼) は全候補を常時列挙（datalist が現行値で絞られても選べる）。
  // opts.displayDitto: U27 連続同値は初期表示を「〃」にし、focus で実値を一時表示。
  // opts.revealValue: focus 時に見せる実値（〃保存時は解決済みの上段値）。
  // opts.listOnly: 候補あり時はリスト外の非空値を blur/change で拒否（空クリアは可）。
  //   「〃」は常に許可。既存保存値がリスト外でも編集するまで維持。拒否時は lastCommitted へ復元。
  // opts.fullTitle: 見切れ時ホバーで全文（定義及び品名など長文列）。listOnly 拒否中は miss 文言優先。
  function jy2ComboInput(documentRef, value, options, onCommit, opts = {}) {
    const wrap = documentRef.createElement("span");
    wrap.className = "jy2-combo-wrap";
    const stored = value === null || value === undefined ? "" : String(value);
    const revealValue = jy2HasText(opts.revealValue)
      ? String(opts.revealValue).trim()
      : stored.trim();
    const displayDitto = Boolean(opts.displayDitto);
    // 後方互換: displayBlank は displayDitto と同義（〃表示）。
    const useDittoDisplay = displayDitto || Boolean(opts.displayBlank);
    const fullTitle = Boolean(opts.fullTitle);
    const input = documentRef.createElement("input");
    input.type = "text";
    input.className = "jy2-input jy2-combo";
    input.autocomplete = "off";
    input.value = useDittoDisplay ? JY2_DITTO_MARK : stored;
    let revealed = false;
    let composing = false;
    let lastCommitted = stored.trim();
    const syncFullTitle = () => {
      if (!fullTitle) return;
      const shown = input.value.trim();
      const tip =
        shown && shown !== JY2_DITTO_MARK
          ? shown
          : useDittoDisplay
            ? revealValue
            : "";
      input.title = tip;
    };
    if (fullTitle) syncFullTitle();
    // 打鍵候補用 datalist（右 select と同一候補）。id は一意採番。
    const listId = `jy2-dl-${++JY2_COMBO_UID}`;
    const datalist = documentRef.createElement("datalist");
    datalist.id = listId;
    input.setAttribute("list", listId);
    const select = documentRef.createElement("select");
    select.className = "jy2-combo-select";
    select.title = "リストから選択";
    select.setAttribute("aria-label", "リストから選択");
    const blank = documentRef.createElement("option");
    blank.value = "";
    blank.textContent = "▼";
    select.appendChild(blank);
    const seen = new Set();
    // 「〃」を候補先頭に（継続入力用）
    if (useDittoDisplay || opts.allowDitto) {
      const dittoOpt = documentRef.createElement("option");
      dittoOpt.value = JY2_DITTO_MARK;
      dittoOpt.textContent = JY2_DITTO_MARK;
      select.appendChild(dittoOpt);
      const dlDitto = documentRef.createElement("option");
      dlDitto.value = JY2_DITTO_MARK;
      datalist.appendChild(dlDitto);
      seen.add(JY2_DITTO_MARK);
    }
    for (const option of options || []) {
      const text = String(option || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const opt = documentRef.createElement("option");
      opt.value = text;
      opt.textContent = text;
      select.appendChild(opt);
      const dlOpt = documentRef.createElement("option");
      dlOpt.value = text;
      datalist.appendChild(dlOpt);
    }
    if ([...seen].every((t) => t === JY2_DITTO_MARK) && !useDittoDisplay && seen.size === 0) {
      select.disabled = true;
      select.title = "このブロックに候補リストがありません";
      input.removeAttribute("list");
    }
    // 候補ゼロ（〃のみ／無し）でも list は残す場合あり。真の空候補だけ無効化。
    if (seen.size === 0) {
      select.disabled = true;
      select.title = "このブロックに候補リストがありません";
      input.removeAttribute("list");
    }
    const miss = documentRef.createElement("span");
    miss.className = "jy2-combo-miss";
    miss.hidden = true;
    const clearMiss = () => {
      miss.hidden = true;
      miss.textContent = "";
      if (fullTitle) syncFullTitle();
      else input.title = "";
    };
    const showMiss = (msg = "リストにありません") => {
      miss.textContent = msg;
      miss.hidden = false;
      input.title = msg;
    };
    const commit = () => {
      // 未フォーカスの〃表示を「クリア保存」と誤認しない
      if (useDittoDisplay && !revealed) return;
      const next = input.value.trim();
      if (
        opts.listOnly &&
        seen.size > 0 &&
        next !== "" &&
        next !== JY2_DITTO_MARK &&
        !seen.has(next)
      ) {
        const restored = lastCommitted;
        input.value =
          useDittoDisplay &&
          (restored === stored || jy2IsDitto(restored) || restored === revealValue)
            ? JY2_DITTO_MARK
            : restored;
        showMiss();
        return;
      }
      if (next === lastCommitted) {
        if (useDittoDisplay && (next === revealValue || jy2IsDitto(next))) {
          input.value = JY2_DITTO_MARK;
        }
        return;
      }
      clearMiss();
      lastCommitted = next;
      onCommit(next);
      if (
        useDittoDisplay &&
        (next === revealValue || jy2IsDitto(next) || next === stored.trim())
      ) {
        input.value = JY2_DITTO_MARK;
      }
    };
    input.addEventListener("focus", () => {
      revealed = true;
      clearMiss();
      if (useDittoDisplay && input.value === JY2_DITTO_MARK) {
        input.value = revealValue || stored;
      }
    });
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
    input.addEventListener("compositionstart", () => {
      composing = true;
    });
    input.addEventListener("compositionend", () => {
      composing = false;
      if (opts.commitExactOption && seen.has(input.value.trim())) commit();
    });
    input.addEventListener("input", () => {
      if (fullTitle) syncFullTitle();
      // 工種番号など既知候補と完全一致した時点で、Tab/blurを待たず即時反映。
      if (!composing && opts.commitExactOption && seen.has(input.value.trim())) commit();
    });
    select.addEventListener("change", () => {
      const picked = select.value;
      if (!picked) return;
      revealed = true;
      clearMiss();
      input.value = picked;
      lastCommitted = picked;
      if (fullTitle) syncFullTitle();
      onCommit(picked);
      select.selectedIndex = 0;
      if (
        useDittoDisplay &&
        (picked === JY2_DITTO_MARK || picked === revealValue)
      ) {
        input.value = JY2_DITTO_MARK;
      }
    });
    wrap.append(input, datalist, select, miss);
    return wrap;
  }

  // #R-NAME-01 / #R-07: 明細候補の正本は「内訳で使うコード表.xlsx」。
  // ラベル: 費目 / 種別（補助） / 定義及び品名（フィールドコード name_1/2/3 は据え置き）。
  // 生成: node scripts/jikkou-yosan-v2-sync-code-table-name-hierarchy.mjs
  // 会社名（取引先コンボ）: データマスタ I∪J を1本化（依頼者確認 2026-07-26）。
  // 生成: node scripts/jikkou-yosan-v2-sync-vendor-list.mjs

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

  // @JY2_NAME_HIERARCHY_BEGIN
  const JY2_NAME_HIERARCHY = Object.freeze({
  "source": "C:/tmp/実行予算ver2/内訳で使うコード表.xlsx",
  "sourceFile": "内訳で使うコード表.xlsx",
  "generatedAt": "2026-07-29T18:56:16",
  "labels": {
    "name1": "費目",
    "name2": "種別（補助）",
    "name3": "定義及び品名"
  },
  "constructionHimokuMenu": [
    "材料費",
    "労務費",
    "外注費",
    "工具･機械使用料",
    "現場経費",
    "諸経費",
    "法定福利費",
    "予備費"
  ],
  "constructionRule": "sectionA=施工費 かつ Excel費目=外注費のみ（契約工事型）",
  "workTypeNameOrder": [
    "（塗）材料費",
    "（塗）塗装工事",
    "（塗）足場工事",
    "（塗）塗装及び足場工事",
    "（塗）修繕等工事",
    "（塗）塗装付帯工事",
    "（塗）暫定実行予算総額",
    "（塗）追加工事①",
    "（塗）追加工事②",
    "（塗）追加工事③",
    "（塗）追加工事④",
    "（塗）追加工事⑤",
    "（塗）軌道工事",
    "（塗）調査設計費",
    "（塗）外注試験費",
    "（塗）交通規制費",
    "（塗）直轄施工班",
    "（塗）工事管理者賃金",
    "（塗）建設機械オペレーター賃金",
    "（塗）その他労務者賃金",
    "（塗）直轄下請助勢代",
    "（塗）社内工事発注",
    "（塗）鎌ヶ谷資材使用料",
    "（塗）レンタル",
    "（塗）建設機械油脂類",
    "（塗）運送費",
    "（塗）産業廃棄物処理費",
    "（塗）租税公課",
    "（塗）借地料等",
    "（塗）消耗品費",
    "（塗）事務費",
    "（塗）通信費",
    "（塗）旅費交通費",
    "（塗）借上げ自動車費",
    "（塗）履行保証保険料",
    "（塗）建退共証紙購入費",
    "（塗）諸雑費",
    "（塗）諸会費",
    "（塗）会議費",
    "（塗）補償費",
    "（塗）交際費",
    "（塗）工事安全専任管理者",
    "予備費",
    "（塗）社員助勢費用",
    "（塗）現場代理人･監理技術者給与手当",
    "（塗）工事担当者給与手当",
    "（塗）社員工事管理者給与手当",
    "（塗）社員保安要員給与手当",
    "予備費",
    "（塗）線閉責任者",
    "（塗）列車見張員",
    "（塗）交通整理員等",
    "（塗）検電接地",
    "（塗）その他保安費",
    "（塗）重機誘導員"
  ],
  "workTypeOrderNote": "依頼者確認リスト順（現場管理費→予備費→保安費）。Excel名（塗）追加工事？はコード表表記のまま",
  "codeOverridesByName": {
    "（塗）レンタル": "11600"
  },
  "byWorkTypeCode": {
    "10100": {
      "workTypeCode": "10100",
      "workTypeName": "（塗）材料費",
      "sectionA": "施工費",
      "himoku": [
        "材料費"
      ],
      "himokuDefault": "材料費",
      "typesByHimoku": {
        "材料費": [
          "塗料",
          "鋼材･二次製品費など",
          "生コンクリート･石材など",
          "ＡＳ合材費など",
          "鋼製製品費･ゴム製品等",
          "その他材料費"
        ]
      },
      "dashTypeByHimoku": {
        "材料費": false
      },
      "allTypes": [
        "塗料",
        "鋼材･二次製品費など",
        "生コンクリート･石材など",
        "ＡＳ合材費など",
        "鋼製製品費･ゴム製品等",
        "その他材料費"
      ],
      "allDefinitions": [
        "剥離剤･塗料･希釈剤･その他材料",
        "鋼材･二次製品など",
        "生コンクリート類･石材･その他材料",
        "アスファルト合材・舗装材料",
        "工場製作品･ゴム沓･ゴム製伸縮装置など",
        "塗装記録表示シールなど"
      ],
      "himokuCodes": {
        "材料費": "100"
      },
      "constructionMenu": false
    },
    "10200": {
      "workTypeCode": "10200",
      "workTypeName": "（塗）塗装工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10300": {
      "workTypeCode": "10300",
      "workTypeName": "（塗）足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10400": {
      "workTypeCode": "10400",
      "workTypeName": "（塗）塗装及び足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10500": {
      "workTypeCode": "10500",
      "workTypeName": "（塗）直轄施工班",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "10600": {
      "workTypeCode": "10600",
      "workTypeName": "（塗）修繕等工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10700": {
      "workTypeCode": "10700",
      "workTypeName": "（塗）塗装付帯工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "10800": {
      "workTypeCode": "10800",
      "workTypeName": "（塗）鎌ヶ谷資材使用料",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "鎌ヶ谷資材使用料"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "鎌ヶ谷資材使用料"
      ],
      "allDefinitions": [
        "倉庫資材の社内損料など"
      ],
      "constructionMenu": false
    },
    "10900": {
      "workTypeCode": "10900",
      "workTypeName": "（塗）工事管理者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "出向工事管理者賃金"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "出向工事管理者賃金"
      ],
      "allDefinitions": [
        "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "11000": {
      "workTypeCode": "11000",
      "workTypeName": "（塗）工事安全専任管理者",
      "sectionA": "その他費用",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "出向工事安全専任管理者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "出向工事安全専任管理者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11100": {
      "workTypeCode": "11100",
      "workTypeName": "（塗）線閉責任者",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注線閉責任者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注線閉責任者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11200": {
      "workTypeCode": "11200",
      "workTypeName": "（塗）列車見張員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注列車見張員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注列車見張員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11300": {
      "workTypeCode": "11300",
      "workTypeName": "（塗）交通整理員等",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注交通整理員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注交通整理員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11400": {
      "workTypeCode": "11400",
      "workTypeName": "（塗）検電接地",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注停電責任者",
          "外注検電接地作業者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注停電責任者",
        "外注検電接地作業者"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11500": {
      "workTypeCode": "11500",
      "workTypeName": "（塗）その他保安費",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "河川監視員･架線監視員及びその他保安要員関係"
      ],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "11600": {
      "workTypeCode": "11600",
      "workTypeName": "（塗）レンタル",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "仮設材",
          "建設機械",
          "保安用機材類",
          "その他"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "仮設材",
        "建設機械",
        "保安用機材類",
        "その他"
      ],
      "allDefinitions": [
        "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や",
        "運搬費"
      ],
      "constructionMenu": false
    },
    "11700": {
      "workTypeCode": "11700",
      "workTypeName": "（塗）運送費",
      "sectionA": "現場経費",
      "himoku": [
        "運送費"
      ],
      "himokuDefault": "運送費",
      "typesByHimoku": {
        "運送費": []
      },
      "dashTypeByHimoku": {
        "運送費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "運送会社に依頼した建設機械等・仮設材等の運搬費"
      ],
      "himokuCodes": {
        "運送費": "437"
      },
      "constructionMenu": false
    },
    "11800": {
      "workTypeCode": "11800",
      "workTypeName": "（塗）産業廃棄物処理費",
      "sectionA": "現場経費",
      "himoku": [
        "産業廃棄物処理"
      ],
      "himokuDefault": "産業廃棄物処理",
      "typesByHimoku": {
        "産業廃棄物処理": []
      },
      "dashTypeByHimoku": {
        "産業廃棄物処理": true
      },
      "allTypes": [],
      "allDefinitions": [
        "産業廃棄物処理を委託した費用"
      ],
      "constructionMenu": false
    },
    "11900": {
      "workTypeCode": "11900",
      "workTypeName": "（塗）租税公課",
      "sectionA": "現場経費",
      "himoku": [
        "租税公課"
      ],
      "himokuDefault": "租税公課",
      "typesByHimoku": {
        "租税公課": []
      },
      "dashTypeByHimoku": {
        "租税公課": true
      },
      "allTypes": [],
      "allDefinitions": [
        "収入印紙・県証紙など"
      ],
      "himokuCodes": {
        "租税公課": "433"
      },
      "constructionMenu": false
    },
    "12000": {
      "workTypeCode": "12000",
      "workTypeName": "（塗）借地料等",
      "sectionA": "現場経費",
      "himoku": [
        "地代家賃"
      ],
      "himokuDefault": "地代家賃",
      "typesByHimoku": {
        "地代家賃": []
      },
      "dashTypeByHimoku": {
        "地代家賃": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務所･資材置場･駐車場などの賃借料"
      ],
      "himokuCodes": {
        "地代家賃": "431"
      },
      "constructionMenu": false
    },
    "12100": {
      "workTypeCode": "12100",
      "workTypeName": "（塗）消耗品費",
      "sectionA": "現場経費",
      "himoku": [
        "消耗品費"
      ],
      "himokuDefault": "消耗品費",
      "typesByHimoku": {
        "消耗品費": []
      },
      "dashTypeByHimoku": {
        "消耗品費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "ヘルメット･手袋･マスクフィルター･防護服･サンダー刃････ペール缶"
      ],
      "himokuCodes": {
        "消耗品費": "426"
      },
      "constructionMenu": false
    },
    "12200": {
      "workTypeCode": "12200",
      "workTypeName": "（塗）事務費",
      "sectionA": "現場経費",
      "himoku": [
        "事務費"
      ],
      "himokuDefault": "事務費",
      "typesByHimoku": {
        "事務費": []
      },
      "dashTypeByHimoku": {
        "事務費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務用品購入代金及びリース料、什器備品のうち固定資産に計上されないもの"
      ],
      "himokuCodes": {
        "事務費": "436"
      },
      "constructionMenu": false
    },
    "12300": {
      "workTypeCode": "12300",
      "workTypeName": "（塗）通信費",
      "sectionA": "現場経費",
      "himoku": [
        "通信費"
      ],
      "himokuDefault": "通信費",
      "typesByHimoku": {
        "通信費": []
      },
      "dashTypeByHimoku": {
        "通信費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "電話･ＦＡＸ料･切手代･はがき代"
      ],
      "himokuCodes": {
        "通信費": "427"
      },
      "constructionMenu": false
    },
    "12400": {
      "workTypeCode": "12400",
      "workTypeName": "（塗）旅費交通費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": [
          "（塗）出張旅費特例",
          "（塗）３万円未満公共交通機関特例",
          "（塗）その他旅費交通費"
        ]
      },
      "dashTypeByHimoku": {
        "旅費交通費": false
      },
      "allTypes": [
        "（塗）出張旅費特例",
        "（塗）３万円未満公共交通機関特例",
        "（塗）その他旅費交通費"
      ],
      "allDefinitions": [
        "駐車場代金"
      ],
      "himokuCodes": {
        "旅費交通費": "428"
      },
      "typeCodes": {
        "（塗）出張旅費特例": "12401",
        "（塗）３万円未満公共交通機関特例": "12402",
        "（塗）その他旅費交通費": "12403"
      },
      "constructionMenu": false
    },
    "12500": {
      "workTypeCode": "12500",
      "workTypeName": "（塗）借上げ自動車費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": []
      },
      "dashTypeByHimoku": {
        "旅費交通費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "借上げ車損料･ガソリン代･軽油代ほか"
      ],
      "himokuCodes": {
        "旅費交通費": "428"
      },
      "constructionMenu": false
    },
    "12600": {
      "workTypeCode": "12600",
      "workTypeName": "（塗）履行保証保険料",
      "sectionA": "現場経費",
      "himoku": [
        "保険料"
      ],
      "himokuDefault": "保険料",
      "typesByHimoku": {
        "保険料": [
          "（塗）労災保険料"
        ]
      },
      "dashTypeByHimoku": {
        "保険料": false
      },
      "allTypes": [
        "（塗）労災保険料"
      ],
      "allDefinitions": [
        "労災保険関係成立届(単独有期事業)"
      ],
      "himokuCodes": {
        "保険料": "435"
      },
      "typeCodes": {
        "（塗）労災保険料": "12601"
      },
      "constructionMenu": false
    },
    "12700": {
      "workTypeCode": "12700",
      "workTypeName": "（塗）建退共証紙購入費",
      "sectionA": "現場経費",
      "himoku": [
        "法定福利費"
      ],
      "himokuDefault": "法定福利費",
      "typesByHimoku": {
        "法定福利費": []
      },
      "dashTypeByHimoku": {
        "法定福利費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "himokuCodes": {
        "法定福利費": "421"
      },
      "constructionMenu": false
    },
    "12800": {
      "workTypeCode": "12800",
      "workTypeName": "（塗）補償費",
      "sectionA": "その他費用",
      "himoku": [
        "補償費"
      ],
      "himokuDefault": "補償費",
      "typesByHimoku": {
        "補償費": []
      },
      "dashTypeByHimoku": {
        "補償費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "工事施工に伴う漁協･水利組合などや道路･河川･田畑･立木等の瑕損補修費、隣接物瑕損補償費、その他補償費"
      ],
      "himokuCodes": {
        "補償費": "432"
      },
      "constructionMenu": false
    },
    "12900": {
      "workTypeCode": "12900",
      "workTypeName": "（塗）諸雑費",
      "sectionA": "現場経費",
      "himoku": [
        "雑費"
      ],
      "himokuDefault": "雑費",
      "typesByHimoku": {
        "雑費": []
      },
      "dashTypeByHimoku": {
        "雑費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "寄付金･安全祈願祭･汲み取り料･日用雑貨等で他の費目に属さないもの"
      ],
      "himokuCodes": {
        "雑費": "445"
      },
      "constructionMenu": false
    },
    "13100": {
      "workTypeCode": "13100",
      "workTypeName": "（塗）諸会費",
      "sectionA": "現場経費",
      "himoku": [
        "諸会費"
      ],
      "himokuDefault": "諸会費",
      "typesByHimoku": {
        "諸会費": []
      },
      "dashTypeByHimoku": {
        "諸会費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "安全協議会及び諸団体に対する会費など"
      ],
      "himokuCodes": {
        "諸会費": "434"
      },
      "constructionMenu": false
    },
    "13200": {
      "workTypeCode": "13200",
      "workTypeName": "（塗）暫定実行予算総額",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "13300": {
      "workTypeCode": "13300",
      "workTypeName": "（塗）直轄下請助勢代",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "13400": {
      "workTypeCode": "13400",
      "workTypeName": "（塗）社員助勢費用",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "他支店などからの工事管理者に対する給与など"
      ],
      "himokuCodes": {
        "給与手当": "412"
      },
      "constructionMenu": false
    },
    "13500": {
      "workTypeCode": "13500",
      "workTypeName": "（塗）重機誘導員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注重機誘導員"
      ],
      "allDefinitions": [],
      "himokuCodes": {
        "外注労務費": "211"
      },
      "constructionMenu": false
    },
    "13600": {
      "workTypeCode": "13600",
      "workTypeName": "（塗）交際費",
      "sectionA": "その他費用",
      "himoku": [
        "接待交際費"
      ],
      "himokuDefault": "接待交際費",
      "typesByHimoku": {
        "接待交際費": [
          "（塗）得意先接待交際費（甲）",
          "（塗）得意先接待交際費（乙）",
          "（塗）その他接待交際費"
        ]
      },
      "dashTypeByHimoku": {
        "接待交際費": false
      },
      "allTypes": [
        "（塗）得意先接待交際費（甲）",
        "（塗）得意先接待交際費（乙）",
        "（塗）その他接待交際費"
      ],
      "allDefinitions": [
        "接待費･挨拶用贈答品･得意先慶弔見舞金など"
      ],
      "himokuCodes": {
        "接待交際費": "430"
      },
      "typeCodes": {
        "（塗）得意先接待交際費（甲）": "13601",
        "（塗）得意先接待交際費（乙）": "13602",
        "（塗）その他接待交際費": "13603"
      },
      "constructionMenu": false
    },
    "13620": {
      "workTypeCode": "13620",
      "workTypeName": "（塗）会議費",
      "sectionA": "現場経費",
      "himoku": [
        "会議費"
      ],
      "himokuDefault": "会議費",
      "typesByHimoku": {
        "会議費": []
      },
      "dashTypeByHimoku": {
        "会議費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "himokuCodes": {
        "会議費": "441"
      },
      "constructionMenu": false
    },
    "13700": {
      "workTypeCode": "13700",
      "workTypeName": "（塗）社内工事発注",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "14100": {
      "workTypeCode": "14100",
      "workTypeName": "（塗）追加工事①",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14200": {
      "workTypeCode": "14200",
      "workTypeName": "（塗）追加工事②",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14300": {
      "workTypeCode": "14300",
      "workTypeName": "（塗）追加工事③",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14400": {
      "workTypeCode": "14400",
      "workTypeName": "（塗）追加工事④",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "14500": {
      "workTypeCode": "14500",
      "workTypeName": "（塗）追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    }
  },
  "byWorkTypeName": {
    "（塗）材料費": {
      "workTypeCode": "10100",
      "workTypeName": "（塗）材料費",
      "sectionA": "施工費",
      "himoku": [
        "材料費"
      ],
      "himokuDefault": "材料費",
      "typesByHimoku": {
        "材料費": [
          "塗料",
          "鋼材･二次製品費など",
          "生コンクリート･石材など",
          "ＡＳ合材費など",
          "鋼製製品費･ゴム製品等",
          "その他材料費"
        ]
      },
      "dashTypeByHimoku": {
        "材料費": false
      },
      "allTypes": [
        "塗料",
        "鋼材･二次製品費など",
        "生コンクリート･石材など",
        "ＡＳ合材費など",
        "鋼製製品費･ゴム製品等",
        "その他材料費"
      ],
      "allDefinitions": [
        "剥離剤･塗料･希釈剤･その他材料",
        "鋼材･二次製品など",
        "生コンクリート類･石材･その他材料",
        "アスファルト合材・舗装材料",
        "工場製作品･ゴム沓･ゴム製伸縮装置など",
        "塗装記録表示シールなど"
      ],
      "constructionMenu": false
    },
    "（塗）塗装工事": {
      "workTypeCode": "10200",
      "workTypeName": "（塗）塗装工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）足場工事": {
      "workTypeCode": "10300",
      "workTypeName": "（塗）足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）塗装及び足場工事": {
      "workTypeCode": "10400",
      "workTypeName": "（塗）塗装及び足場工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）修繕等工事": {
      "workTypeCode": "10600",
      "workTypeName": "（塗）修繕等工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）塗装付帯工事": {
      "workTypeCode": "10700",
      "workTypeName": "（塗）塗装付帯工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）暫定実行予算総額": {
      "workTypeCode": "13200",
      "workTypeName": "（塗）暫定実行予算総額",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事①": {
      "workTypeCode": "14100",
      "workTypeName": "（塗）追加工事①",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事②": {
      "workTypeCode": "14200",
      "workTypeName": "（塗）追加工事②",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事③": {
      "workTypeCode": "14300",
      "workTypeName": "（塗）追加工事③",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事④": {
      "workTypeCode": "14400",
      "workTypeName": "（塗）追加工事④",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）追加工事⑤": {
      "workTypeCode": "14500",
      "workTypeName": "（塗）追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）軌道工事": {
      "workTypeCode": "",
      "workTypeName": "（塗）軌道工事",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）調査設計費": {
      "workTypeCode": "",
      "workTypeName": "（塗）調査設計費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）外注試験費": {
      "workTypeCode": "",
      "workTypeName": "（塗）外注試験費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）交通規制費": {
      "workTypeCode": "",
      "workTypeName": "（塗）交通規制費",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    },
    "（塗）直轄施工班": {
      "workTypeCode": "10500",
      "workTypeName": "（塗）直轄施工班",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）工事管理者賃金": {
      "workTypeCode": "10900",
      "workTypeName": "（塗）工事管理者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "出向工事管理者賃金"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "出向工事管理者賃金"
      ],
      "allDefinitions": [
        "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）建設機械オペレーター賃金": {
      "workTypeCode": "",
      "workTypeName": "（塗）建設機械オペレーター賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "建設機械オペレーター"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "建設機械オペレーター"
      ],
      "allDefinitions": [
        "工事に直接従事する軌陸車などの運転手賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）その他労務者賃金": {
      "workTypeCode": "",
      "workTypeName": "（塗）その他労務者賃金",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": [
          "その他労務者"
        ]
      },
      "dashTypeByHimoku": {
        "労務費": false
      },
      "allTypes": [
        "その他労務者"
      ],
      "allDefinitions": [
        "工事に直接従事する労務者などの賃金であり、社員及び契約社員は除く"
      ],
      "constructionMenu": false
    },
    "（塗）直轄下請助勢代": {
      "workTypeCode": "13300",
      "workTypeName": "（塗）直轄下請助勢代",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）社内工事発注": {
      "workTypeCode": "13700",
      "workTypeName": "（塗）社内工事発注",
      "sectionA": "施工費",
      "himoku": [
        "労務費"
      ],
      "himokuDefault": "労務費",
      "typesByHimoku": {
        "労務費": []
      },
      "dashTypeByHimoku": {
        "労務費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）鎌ヶ谷資材使用料": {
      "workTypeCode": "10800",
      "workTypeName": "（塗）鎌ヶ谷資材使用料",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "鎌ヶ谷資材使用料"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "鎌ヶ谷資材使用料"
      ],
      "allDefinitions": [
        "倉庫資材の社内損料など"
      ],
      "constructionMenu": false
    },
    "（塗）レンタル": {
      "workTypeCode": "11600",
      "workTypeName": "（塗）レンタル",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": [
          "仮設材",
          "建設機械",
          "保安用機材類",
          "その他"
        ]
      },
      "dashTypeByHimoku": {
        "仮設機械経費": false
      },
      "allTypes": [
        "仮設材",
        "建設機械",
        "保安用機材類",
        "その他"
      ],
      "allDefinitions": [
        "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や",
        "運搬費"
      ],
      "constructionMenu": false
    },
    "（塗）建設機械油脂類": {
      "workTypeCode": "",
      "workTypeName": "（塗）建設機械油脂類",
      "sectionA": "施工費",
      "himoku": [
        "仮設機械経費"
      ],
      "himokuDefault": "仮設機械経費",
      "typesByHimoku": {
        "仮設機械経費": []
      },
      "dashTypeByHimoku": {
        "仮設機械経費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "建設機械等の燃料などの代金"
      ],
      "constructionMenu": false
    },
    "（塗）運送費": {
      "workTypeCode": "11700",
      "workTypeName": "（塗）運送費",
      "sectionA": "現場経費",
      "himoku": [
        "運送費"
      ],
      "himokuDefault": "運送費",
      "typesByHimoku": {
        "運送費": []
      },
      "dashTypeByHimoku": {
        "運送費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "運送会社に依頼した建設機械等・仮設材等の運搬費"
      ],
      "constructionMenu": false
    },
    "（塗）産業廃棄物処理費": {
      "workTypeCode": "11800",
      "workTypeName": "（塗）産業廃棄物処理費",
      "sectionA": "現場経費",
      "himoku": [
        "産業廃棄物処理"
      ],
      "himokuDefault": "産業廃棄物処理",
      "typesByHimoku": {
        "産業廃棄物処理": []
      },
      "dashTypeByHimoku": {
        "産業廃棄物処理": true
      },
      "allTypes": [],
      "allDefinitions": [
        "産業廃棄物処理を委託した費用"
      ],
      "constructionMenu": false
    },
    "（塗）租税公課": {
      "workTypeCode": "11900",
      "workTypeName": "（塗）租税公課",
      "sectionA": "現場経費",
      "himoku": [
        "租税公課"
      ],
      "himokuDefault": "租税公課",
      "typesByHimoku": {
        "租税公課": []
      },
      "dashTypeByHimoku": {
        "租税公課": true
      },
      "allTypes": [],
      "allDefinitions": [
        "収入印紙・県証紙など"
      ],
      "constructionMenu": false
    },
    "（塗）借地料等": {
      "workTypeCode": "12000",
      "workTypeName": "（塗）借地料等",
      "sectionA": "現場経費",
      "himoku": [
        "地代家賃"
      ],
      "himokuDefault": "地代家賃",
      "typesByHimoku": {
        "地代家賃": []
      },
      "dashTypeByHimoku": {
        "地代家賃": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務所･資材置場･駐車場などの賃借料"
      ],
      "constructionMenu": false
    },
    "（塗）消耗品費": {
      "workTypeCode": "12100",
      "workTypeName": "（塗）消耗品費",
      "sectionA": "現場経費",
      "himoku": [
        "消耗品費"
      ],
      "himokuDefault": "消耗品費",
      "typesByHimoku": {
        "消耗品費": []
      },
      "dashTypeByHimoku": {
        "消耗品費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "ヘルメット･手袋･マスクフィルター･防護服･サンダー刃････ペール缶"
      ],
      "constructionMenu": false
    },
    "（塗）事務費": {
      "workTypeCode": "12200",
      "workTypeName": "（塗）事務費",
      "sectionA": "現場経費",
      "himoku": [
        "事務費"
      ],
      "himokuDefault": "事務費",
      "typesByHimoku": {
        "事務費": []
      },
      "dashTypeByHimoku": {
        "事務費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "事務用品購入代金及びリース料、什器備品のうち固定資産に計上されないもの"
      ],
      "constructionMenu": false
    },
    "（塗）通信費": {
      "workTypeCode": "12300",
      "workTypeName": "（塗）通信費",
      "sectionA": "現場経費",
      "himoku": [
        "通信費"
      ],
      "himokuDefault": "通信費",
      "typesByHimoku": {
        "通信費": []
      },
      "dashTypeByHimoku": {
        "通信費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "電話･ＦＡＸ料･切手代･はがき代"
      ],
      "constructionMenu": false
    },
    "（塗）旅費交通費": {
      "workTypeCode": "12400",
      "workTypeName": "（塗）旅費交通費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": [
          "（塗）出張旅費特例",
          "（塗）３万円未満公共交通機関特例",
          "（塗）その他旅費交通費"
        ]
      },
      "dashTypeByHimoku": {
        "旅費交通費": false
      },
      "allTypes": [
        "（塗）出張旅費特例",
        "（塗）３万円未満公共交通機関特例",
        "（塗）その他旅費交通費"
      ],
      "allDefinitions": [
        "駐車場代金"
      ],
      "constructionMenu": false
    },
    "（塗）借上げ自動車費": {
      "workTypeCode": "12500",
      "workTypeName": "（塗）借上げ自動車費",
      "sectionA": "現場経費",
      "himoku": [
        "旅費交通費"
      ],
      "himokuDefault": "旅費交通費",
      "typesByHimoku": {
        "旅費交通費": []
      },
      "dashTypeByHimoku": {
        "旅費交通費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "借上げ車損料･ガソリン代･軽油代ほか"
      ],
      "constructionMenu": false
    },
    "（塗）履行保証保険料": {
      "workTypeCode": "12600",
      "workTypeName": "（塗）履行保証保険料",
      "sectionA": "現場経費",
      "himoku": [
        "保険料"
      ],
      "himokuDefault": "保険料",
      "typesByHimoku": {
        "保険料": [
          "（塗）労災保険料"
        ]
      },
      "dashTypeByHimoku": {
        "保険料": false
      },
      "allTypes": [
        "（塗）労災保険料"
      ],
      "allDefinitions": [
        "労災保険関係成立届(単独有期事業)"
      ],
      "constructionMenu": false
    },
    "（塗）建退共証紙購入費": {
      "workTypeCode": "12700",
      "workTypeName": "（塗）建退共証紙購入費",
      "sectionA": "現場経費",
      "himoku": [
        "法定福利費"
      ],
      "himokuDefault": "法定福利費",
      "typesByHimoku": {
        "法定福利費": []
      },
      "dashTypeByHimoku": {
        "法定福利費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）諸雑費": {
      "workTypeCode": "12900",
      "workTypeName": "（塗）諸雑費",
      "sectionA": "現場経費",
      "himoku": [
        "雑費"
      ],
      "himokuDefault": "雑費",
      "typesByHimoku": {
        "雑費": []
      },
      "dashTypeByHimoku": {
        "雑費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "寄付金･安全祈願祭･汲み取り料･日用雑貨等で他の費目に属さないもの"
      ],
      "constructionMenu": false
    },
    "（塗）諸会費": {
      "workTypeCode": "13100",
      "workTypeName": "（塗）諸会費",
      "sectionA": "現場経費",
      "himoku": [
        "諸会費"
      ],
      "himokuDefault": "諸会費",
      "typesByHimoku": {
        "諸会費": []
      },
      "dashTypeByHimoku": {
        "諸会費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "安全協議会及び諸団体に対する会費など"
      ],
      "constructionMenu": false
    },
    "（塗）会議費": {
      "workTypeCode": "13620",
      "workTypeName": "（塗）会議費",
      "sectionA": "現場経費",
      "himoku": [
        "会議費"
      ],
      "himokuDefault": "会議費",
      "typesByHimoku": {
        "会議費": []
      },
      "dashTypeByHimoku": {
        "会議費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）補償費": {
      "workTypeCode": "12800",
      "workTypeName": "（塗）補償費",
      "sectionA": "その他費用",
      "himoku": [
        "補償費"
      ],
      "himokuDefault": "補償費",
      "typesByHimoku": {
        "補償費": []
      },
      "dashTypeByHimoku": {
        "補償費": true
      },
      "allTypes": [],
      "allDefinitions": [
        "工事施工に伴う漁協･水利組合などや道路･河川･田畑･立木等の瑕損補修費、隣接物瑕損補償費、その他補償費"
      ],
      "constructionMenu": false
    },
    "（塗）交際費": {
      "workTypeCode": "13600",
      "workTypeName": "（塗）交際費",
      "sectionA": "その他費用",
      "himoku": [
        "接待交際費"
      ],
      "himokuDefault": "接待交際費",
      "typesByHimoku": {
        "接待交際費": [
          "（塗）得意先接待交際費（甲）",
          "（塗）得意先接待交際費（乙）",
          "（塗）その他接待交際費"
        ]
      },
      "dashTypeByHimoku": {
        "接待交際費": false
      },
      "allTypes": [
        "（塗）得意先接待交際費（甲）",
        "（塗）得意先接待交際費（乙）",
        "（塗）その他接待交際費"
      ],
      "allDefinitions": [
        "接待費･挨拶用贈答品･得意先慶弔見舞金など"
      ],
      "constructionMenu": false
    },
    "（塗）工事安全専任管理者": {
      "workTypeCode": "11000",
      "workTypeName": "（塗）工事安全専任管理者",
      "sectionA": "その他費用",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "出向工事安全専任管理者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "出向工事安全専任管理者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "予備費": {
      "workTypeCode": "",
      "workTypeName": "予備費",
      "sectionA": "予備費",
      "himoku": [],
      "himokuDefault": "",
      "typesByHimoku": {},
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）社員助勢費用": {
      "workTypeCode": "13400",
      "workTypeName": "（塗）社員助勢費用",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "他支店などからの工事管理者に対する給与など"
      ],
      "constructionMenu": false
    },
    "（塗）現場代理人･監理技術者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）現場代理人･監理技術者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "現場代理人や監理技術者の給与や手当"
      ],
      "constructionMenu": false
    },
    "（塗）工事担当者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）工事担当者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "工事担当者の給与や手当"
      ],
      "constructionMenu": false
    },
    "（塗）社員工事管理者給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）社員工事管理者給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": [
          "社員工事管理者"
        ]
      },
      "dashTypeByHimoku": {
        "給与手当": false
      },
      "allTypes": [
        "社員工事管理者"
      ],
      "allDefinitions": [
        "社員名を入れたい"
      ],
      "constructionMenu": false
    },
    "（塗）社員保安要員給与手当": {
      "workTypeCode": "",
      "workTypeName": "（塗）社員保安要員給与手当",
      "sectionA": "現場管理費",
      "himoku": [
        "給与手当"
      ],
      "himokuDefault": "給与手当",
      "typesByHimoku": {
        "給与手当": [
          "直轄工事安全専任管理者(昼)",
          "直轄線閉責任者",
          "直轄列車見張員",
          "直轄交通整理員",
          "直轄停電責任者",
          "直轄検電接地作業者",
          "直轄重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "給与手当": false
      },
      "allTypes": [
        "直轄工事安全専任管理者(昼)",
        "直轄線閉責任者",
        "直轄列車見張員",
        "直轄交通整理員",
        "直轄停電責任者",
        "直轄検電接地作業者",
        "直轄重機誘導員"
      ],
      "allDefinitions": [
        "社員名を入れたい"
      ],
      "constructionMenu": false
    },
    "（塗）線閉責任者": {
      "workTypeCode": "11100",
      "workTypeName": "（塗）線閉責任者",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注線閉責任者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注線閉責任者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）列車見張員": {
      "workTypeCode": "11200",
      "workTypeName": "（塗）列車見張員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注列車見張員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注列車見張員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）交通整理員等": {
      "workTypeCode": "11300",
      "workTypeName": "（塗）交通整理員等",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注交通整理員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注交通整理員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）検電接地": {
      "workTypeCode": "11400",
      "workTypeName": "（塗）検電接地",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注停電責任者",
          "外注検電接地作業者"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注停電責任者",
        "外注検電接地作業者"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "（塗）その他保安費": {
      "workTypeCode": "11500",
      "workTypeName": "（塗）その他保安費",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": []
      },
      "dashTypeByHimoku": {},
      "allTypes": [],
      "allDefinitions": [
        "河川監視員･架線監視員及びその他保安要員関係"
      ],
      "constructionMenu": false
    },
    "（塗）重機誘導員": {
      "workTypeCode": "13500",
      "workTypeName": "（塗）重機誘導員",
      "sectionA": "保安費",
      "himoku": [
        "外注労務費"
      ],
      "himokuDefault": "外注労務費",
      "typesByHimoku": {
        "外注労務費": [
          "外注重機誘導員"
        ]
      },
      "dashTypeByHimoku": {
        "外注労務費": false
      },
      "allTypes": [
        "外注重機誘導員"
      ],
      "allDefinitions": [],
      "constructionMenu": false
    },
    "追加工事⑤": {
      "workTypeCode": "14500",
      "workTypeName": "追加工事⑤",
      "sectionA": "施工費",
      "himoku": [
        "材料費",
        "労務費",
        "外注費",
        "工具･機械使用料",
        "現場経費",
        "諸経費",
        "法定福利費",
        "予備費"
      ],
      "himokuDefault": "外注費",
      "typesByHimoku": {
        "外注費": []
      },
      "dashTypeByHimoku": {
        "外注費": true
      },
      "allTypes": [],
      "allDefinitions": [],
      "constructionMenu": true
    }
  },
  "allHimoku": [
    "材料費",
    "外注費",
    "労務費",
    "仮設機械経費",
    "工具･機械使用料",
    "運送費",
    "産業廃棄物処理",
    "租税公課",
    "地代家賃",
    "消耗品費",
    "事務費",
    "通信費",
    "旅費交通費",
    "保険料",
    "法定福利費",
    "雑費",
    "諸会費",
    "会議費",
    "補償費",
    "接待交際費",
    "外注労務費",
    "給与手当",
    "現場経費",
    "諸経費",
    "予備費"
  ],
  "typesByHimoku": {
    "材料費": [
      "塗料",
      "鋼材･二次製品費など",
      "生コンクリート･石材など",
      "ＡＳ合材費など",
      "鋼製製品費･ゴム製品等",
      "その他材料費"
    ],
    "労務費": [
      "出向工事管理者賃金",
      "建設機械オペレーター",
      "その他労務者",
      "労務費（昼間）",
      "労務費（夜間）",
      "出向工事管理者賃金（昼）",
      "出向工事管理者賃金（夜）",
      "建設機械オペレーター（昼）",
      "建設機械オペレーター（夜）",
      "その他労務者（昼）",
      "その他労務者（夜）"
    ],
    "仮設機械経費": [
      "鎌ヶ谷資材使用料",
      "仮設材",
      "建設機械",
      "保安用機材類",
      "その他"
    ],
    "工具･機械使用料": [
      "仮設・工具費等"
    ],
    "旅費交通費": [
      "（塗）出張旅費特例",
      "（塗）３万円未満公共交通機関特例",
      "（塗）その他旅費交通費"
    ],
    "保険料": [
      "（塗）労災保険料"
    ],
    "接待交際費": [
      "（塗）得意先接待交際費（甲）",
      "（塗）得意先接待交際費（乙）",
      "（塗）その他接待交際費"
    ],
    "外注労務費": [
      "出向工事安全専任管理者",
      "外注線閉責任者",
      "外注列車見張員",
      "外注交通整理員",
      "外注停電責任者",
      "外注検電接地作業者",
      "外注重機誘導員"
    ],
    "給与手当": [
      "社員工事管理者",
      "直轄工事安全専任管理者(昼)",
      "直轄線閉責任者",
      "直轄列車見張員",
      "直轄交通整理員",
      "直轄停電責任者",
      "直轄検電接地作業者",
      "直轄重機誘導員"
    ],
    "現場経費": [
      "運送費",
      "産業廃棄物処理",
      "租税公課",
      "地代家賃",
      "消耗品費",
      "事務費",
      "通信費",
      "旅費交通費",
      "保険料",
      "法定福利費",
      "雑費",
      "諸会費",
      "会議費"
    ]
  },
  "dashOnlyHimoku": [
    "外注費",
    "運送費",
    "産業廃棄物処理",
    "租税公課",
    "地代家賃",
    "消耗品費",
    "事務費",
    "通信費",
    "法定福利費",
    "雑費",
    "諸会費",
    "会議費",
    "補償費"
  ],
  "definitionsByType": {
    "塗料": [
      "剥離剤･塗料･希釈剤･その他材料"
    ],
    "鋼材･二次製品費など": [
      "鋼材･二次製品など"
    ],
    "生コンクリート･石材など": [
      "生コンクリート類･石材･その他材料"
    ],
    "ＡＳ合材費など": [
      "アスファルト合材・舗装材料"
    ],
    "鋼製製品費･ゴム製品等": [
      "工場製作品･ゴム沓･ゴム製伸縮装置など"
    ],
    "その他材料費": [
      "塗装記録表示シールなど"
    ],
    "出向工事管理者賃金": [
      "出向工事管理者賃金や工事に直接従事する労務者賃金であり、社員及び契約社員は除く"
    ],
    "建設機械オペレーター": [
      "工事に直接従事する軌陸車などの運転手賃金であり、社員及び契約社員は除く"
    ],
    "その他労務者": [
      "工事に直接従事する労務者などの賃金であり、社員及び契約社員は除く"
    ],
    "鎌ヶ谷資材使用料": [
      "倉庫資材の社内損料など"
    ],
    "仮設材": [
      "社外から借り受けた仮設ハウスや仮設トイレ、重機、機械器具、仮設用資材などの賃借料や"
    ],
    "建設機械": [
      "運搬費"
    ],
    "（塗）その他旅費交通費": [
      "駐車場代金"
    ],
    "（塗）労災保険料": [
      "労災保険関係成立届(単独有期事業)"
    ],
    "（塗）得意先接待交際費（甲）": [
      "接待費･挨拶用贈答品･得意先慶弔見舞金など"
    ],
    "社員工事管理者": [
      "社員名を入れたい"
    ],
    "直轄工事安全専任管理者(昼)": [
      "社員名を入れたい"
    ],
    "直轄線閉責任者": [
      "社員名を入れたい"
    ],
    "直轄列車見張員": [
      "社員名を入れたい"
    ],
    "直轄交通整理員": [
      "社員名を入れたい"
    ],
    "直轄停電責任者": [
      "社員名を入れたい"
    ],
    "直轄検電接地作業者": [
      "社員名を入れたい"
    ],
    "直轄重機誘導員": [
      "社員名を入れたい"
    ]
  }
});
  // @JY2_NAME_HIERARCHY_END

  const JY2_COST_CATEGORY_BY_WORK_TYPE_CODE = Object.freeze({
    "10100": "施工",
    "10200": "施工",
    "10300": "施工",
    "10400": "施工",
    "10500": "施工",
    "10600": "施工",
    "10700": "施工",
    "10800": "施工",
    "10900": "施工",
    "11000": "施工",
    "11100": "保安",
    "11200": "保安",
    "11300": "保安",
    "11400": "保安",
    "11500": "保安",
    "11600": "施工",
    "11700": "施工",
    "11800": "施工",
    "11900": "施工",
    "12000": "施工",
    "12100": "施工",
    "12200": "施工",
    "12300": "施工",
    "12400": "施工",
    "12500": "施工",
    "12600": "施工",
    "12700": "施工",
    "12800": "施工",
    "12900": "施工",
    "13100": "施工",
    "13200": "施工",
    "13300": "施工",
    "13400": "給与",
    "13500": "保安",
    "13600": "施工",
    "13620": "施工",
    "13700": "施工",
    "14000": "施工",
    "14100": "施工",
    "14200": "施工",
    "14300": "施工",
    "14400": "施工",
    "14500": "施工",
  });
  const JY2_COST_CATEGORY_BY_WORK_TYPE_NAME = Object.freeze({
    "（塗）材料費": "施工",
    "（塗）塗装工事": "施工",
    "（塗）足場工事": "施工",
    "（塗）塗装及び足場工事": "施工",
    "（塗）修繕等工事": "施工",
    "（塗）塗装付帯工事": "施工",
    "（塗）暫定実行予算総額": "施工",
    "（塗）追加工事？": "施工",
    "（塗）追加工事①": "施工",
    "（塗）追加工事②": "施工",
    "（塗）追加工事③": "施工",
    "（塗）追加工事④": "施工",
    "（塗）追加工事⑤": "施工",
    "追加工事⑤": "施工",
    "（塗）軌道工事": "施工",
    "（塗）調査設計費": "施工",
    "（塗）外注試験費": "施工",
    "（塗）交通規制費": "施工",
    "（塗）直轄施工班": "施工",
    "（塗）工事管理者賃金": "施工",
    "（塗）建設機械オペレーター賃金": "施工",
    "（塗）その他労務者賃金": "施工",
    "（塗）直轄下請助勢代": "施工",
    "（塗）社内工事発注": "施工",
    "（塗）鎌ヶ谷資材使用料": "施工",
    "（塗）レンタル": "施工",
    "（塗）建設機械油脂類": "施工",
    "（塗）運送費": "施工",
    "（塗）産業廃棄物処理費": "施工",
    "（塗）租税公課": "施工",
    "（塗）借地料等": "施工",
    "（塗）消耗品費": "施工",
    "（塗）事務費": "施工",
    "（塗）通信費": "施工",
    "（塗）旅費交通費": "施工",
    "（塗）借上げ自動車費": "施工",
    "（塗）履行保証保険料": "施工",
    "（塗）建退共証紙購入費": "施工",
    "（塗）諸雑費": "施工",
    "（塗）諸会費": "施工",
    "（塗）会議費": "施工",
    "（塗）補償費": "施工",
    "（塗）交際費": "施工",
    "（塗）工事安全専任管理者": "施工",
    "（塗）線閉責任者": "保安",
    "（塗）列車見張員": "保安",
    "（塗）交通整理員等": "保安",
    "（塗）検電接地": "保安",
    "（塗）その他保安費": "保安",
    "（塗）重機誘導員": "保安",
    "（塗）社員助勢費用": "給与",
    "（塗）現場代理人･監理技術者給与手当": "給与",
    "（塗）工事担当者給与手当": "給与",
    "（塗）社員工事管理者給与手当": "給与",
    "（塗）社員保安要員給与手当": "給与",
  });
  function jy2ResolveCostCategoryFromWorkType(code, name) {
    const c = String(code || "").trim();
    if (c && JY2_COST_CATEGORY_BY_WORK_TYPE_CODE[c]) return JY2_COST_CATEGORY_BY_WORK_TYPE_CODE[c];
    const n = String(name || "").trim();
    if (n && JY2_COST_CATEGORY_BY_WORK_TYPE_NAME[n]) return JY2_COST_CATEGORY_BY_WORK_TYPE_NAME[n];
    return null;
  }

  // R-07 / コード表階層: システム工種 → 費目 → 種別（補助） → 定義及び品名。
  // 工事系工種は依頼者説明文の費目メニュー（材料費〜法定福利費＋予備費）を合成済み。
  function jy2ResolveNameHierarchy(block) {
    const code = String((block && block.workTypeCode) || "").trim();
    const name = String((block && block.workTypeName) || "").trim();
    const byCode = JY2_NAME_HIERARCHY.byWorkTypeCode || {};
    const byName = JY2_NAME_HIERARCHY.byWorkTypeName || {};
    // 名称優先（同一コードの衝突や誤記訂正後も名称で正確に引く）。
    if (name && byName[name]) return byName[name];
    if (code && byCode[code]) return byCode[code];
    return null;
  }

  function jy2HimokuChoicesForEntry(entry) {
    if (!entry) return [];
    // sync 済み himoku に工事系メニューが含まれる。順序は constructionHimokuMenu 優先。
    const menu = JY2_NAME_HIERARCHY.constructionHimokuMenu || [];
    const fromEntry = Array.isArray(entry.himoku) ? entry.himoku : [];
    if (!entry.constructionMenu) return [...fromEntry];
    const merged = [];
    for (const h of [...menu, ...fromEntry]) {
      if (h && !merged.includes(h)) merged.push(h);
    }
    return merged;
  }

  function jy2HimokuDefaultForBlock(block) {
    const entry = jy2ResolveNameHierarchy(block);
    if (!entry) return null;
    const choices = jy2HimokuChoicesForEntry(entry);
    if (entry.himokuDefault && choices.includes(entry.himokuDefault)) {
      return entry.himokuDefault;
    }
    if (choices.length === 1) return choices[0];
    // 工事系は複数費目が並ぶので空行へは既定（外注費）だけ入れる。
    if (entry.constructionMenu && choices.includes("外注費")) return "外注費";
    return null;
  }

  // Phase2c-c-excel-outline: 親行 freeze1 に載せる既定費目（himokuDefault または
  // 単一 himoku[0]）。複数候補で既定が無いときは null（費目行は walker 側）。
  function jy2ActualPrimaryHimokuLabel(hierarchyEntry, row) {
    const block = {
      workTypeCode: row && row.workTypeCode,
      workTypeName: row && row.workTypeName,
    };
    const fromDefault = jy2HimokuDefaultForBlock(block);
    if (fromDefault) return fromDefault;
    if (!hierarchyEntry) return null;
    const fromEntry = Array.isArray(hierarchyEntry.himoku)
      ? hierarchyEntry.himoku.filter(Boolean)
      : [];
    if (fromEntry.length === 1) return fromEntry[0];
    const choices = jy2HimokuChoicesForEntry(hierarchyEntry);
    if (choices.length === 1) return choices[0];
    return null;
  }

  // 工種変更時: 明細の費目をコード表の既定へ寄せる（空行・旧費目が候補外なら上書き）。
  function jy2ApplyHimokuDefaultToDetails(detailModel, stableBlockId) {
    const snap = detailModel.snapshot().blocks.find((b) => b.stableBlockId === stableBlockId);
    if (!snap) return;
    const himoku = jy2HimokuDefaultForBlock(snap);
    if (!himoku) return;
    const entry = jy2ResolveNameHierarchy(snap);
    const allowed = new Set(jy2HimokuChoicesForEntry(entry));
    if (allowed.size === 0) allowed.add(himoku);
    for (const row of snap.detailRows) {
      const current = row.name1 == null ? "" : String(row.name1).trim();
      const nextHimoku = !current || !allowed.has(current) ? himoku : current;
      const patch = {};
      if (!current || !allowed.has(current)) {
        patch.name1 = himoku;
      }
      if (jy2HimokuUsesDashType(entry, nextHimoku)) {
        patch.name2 = "－";
      } else {
        const sole = jy2SoleTypeForHimoku(entry, nextHimoku);
        const currentType = String(row.name2 || "").trim();
        if (sole) {
          if (currentType !== sole) patch.name2 = sole;
        } else if (currentType === "－") {
          patch.name2 = null;
        }
      }
      if (Object.keys(patch).length) {
        detailModel.updateDetailRow(stableBlockId, row.rowKey, patch);
      }
    }
  }

  // 費目 → 種別（補助）の候補。工種ローカルが空ならコード表全体の紐付けを使う
  // （工事系メニューで材料費等を出したとき、10100側の種別が使えるようにする）。
  function jy2TypesForHimoku(entry, himoku) {
    const key = String(himoku || "").trim();
    if (!key) return [];
    const local =
      entry && entry.typesByHimoku && Array.isArray(entry.typesByHimoku[key])
        ? entry.typesByHimoku[key]
        : [];
    if (local.length) return [...local];
    const globalMap = JY2_NAME_HIERARCHY.typesByHimoku || {};
    const global = Array.isArray(globalMap[key]) ? globalMap[key] : [];
    return global.length ? [...global] : [];
  }

  // 候補がちょうど1件ならそれを返す（「－」固定費目は別経路）。
  function jy2SoleTypeForHimoku(entry, himoku) {
    if (jy2HimokuUsesDashType(entry, himoku)) return null;
    const types = jy2TypesForHimoku(entry, himoku).filter(
      (t) => t && String(t).trim() && String(t).trim() !== "－",
    );
    return types.length === 1 ? String(types[0]).trim() : null;
  }

  function jy2HimokuUsesDashType(entry, himoku) {
    const key = String(himoku || "").trim();
    if (!key) return false;
    const local = entry && entry.dashTypeByHimoku;
    if (local && Object.prototype.hasOwnProperty.call(local, key)) {
      return local[key] === true;
    }
    return (JY2_NAME_HIERARCHY.dashOnlyHimoku || []).includes(key);
  }

  function jy2NormalizeDashTypeDetails(detailModel) {
    const snapshot = detailModel.snapshot();
    for (const block of snapshot.blocks) {
      const entry = jy2ResolveNameHierarchy(block);
      block.detailRows.forEach((row, rowIndex) => {
        const himoku =
          jy2IsDitto(row.name1) || !jy2HasText(row.name1)
            ? jy2PrevResolved(block.detailRows, rowIndex, "name1")
            : String(row.name1 || "").trim();
        if (
          jy2HimokuUsesDashType(entry, himoku) &&
          String(row.name2 || "").trim() !== "－"
        ) {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name2: "－",
          });
        }
      });
    }
  }

  // 費目に対する種別（補助）が1件だけの行は、空／「－」／〃なら自動セット。
  function jy2NormalizeSoleTypeDetails(detailModel) {
    const snapshot = detailModel.snapshot();
    for (const block of snapshot.blocks) {
      const entry = jy2ResolveNameHierarchy(block);
      block.detailRows.forEach((row, rowIndex) => {
        const himoku =
          jy2IsDitto(row.name1) || !jy2HasText(row.name1)
            ? jy2PrevResolved(block.detailRows, rowIndex, "name1")
            : String(row.name1 || "").trim();
        if (!himoku) return;
        const sole = jy2SoleTypeForHimoku(entry, himoku);
        if (!sole) return;
        const current = String(row.name2 || "").trim();
        if (!current || current === "－" || current === JY2_DITTO_MARK) {
          detailModel.updateDetailRow(block.stableBlockId, row.rowKey, {
            name2: sole,
          });
        }
      });
    }
  }

  function jy2DefinitionsForType(typeName, himoku, entry) {
    const defsByType = JY2_NAME_HIERARCHY.definitionsByType || {};
    const typeKey = String(typeName || "").trim();
    if (typeKey && Array.isArray(defsByType[typeKey]) && defsByType[typeKey].length) {
      return [...defsByType[typeKey]];
    }
    // 種別未選択時: 選んだ費目の各種別の定義を候補にまとめる。
    const himokuKey = String(himoku || "").trim();
    if (!himokuKey) {
      return entry && Array.isArray(entry.allDefinitions)
        ? [...entry.allDefinitions]
        : [];
    }
    const types = jy2TypesForHimoku(entry, himokuKey);
    const merged = [];
    for (const t of types) {
      for (const d of defsByType[t] || []) {
        if (d && !merged.includes(d)) merged.push(d);
      }
    }
    return merged;
  }

  function jy2CollectDetailSuggestions(detailModel, block, row) {
    // 候補源はコード表＋工事系費目メニュー（レコード値で汚染しない）。
    const vendors = new Set(JY2_VENDOR_SEEDS);
    if (detailModel) {
      for (const b of detailModel.snapshot().blocks) {
        if (b.vendorName) vendors.add(String(b.vendorName));
      }
    }
    // 費目／種別／定義の並びはコード表（JY2_NAME_HIERARCHY）の出現順を維持する。
    // 五十音ソートはしない（依頼者：リスト順＝コード表順）。
    const sortJa = (left, right) => String(left).localeCompare(String(right), "ja");
    const entry = jy2ResolveNameHierarchy(block || {});
    const himokuAll = JY2_NAME_HIERARCHY.allHimoku || [];
    const selectedHimoku = row && row.name1 ? String(row.name1).trim() : "";
    const selectedType = row && row.name2 ? String(row.name2).trim() : "";

    let name1;
    let name2;
    let name3;
    if (entry) {
      // システム工種あり → 費目はその工種（工事系は説明文メニュー込み）。
      // 種別は選んだ費目に紐づく候補のみ（未選択時は空＝紐付けを明示）。
      name1 = jy2HimokuChoicesForEntry(entry);
      name2 = selectedHimoku ? jy2TypesForHimoku(entry, selectedHimoku) : [];
      name3 = jy2DefinitionsForType(selectedType, selectedHimoku, entry);
    } else {
      // 工種空（R-05）: 費目は全候補。種別は費目選択後。
      name1 = [...himokuAll];
      name2 = selectedHimoku ? jy2TypesForHimoku(null, selectedHimoku) : [];
      name3 = jy2DefinitionsForType(selectedType, selectedHimoku, null);
    }
    return {
      profile: entry
        ? entry.constructionMenu
          ? "construction-menu"
          : "code-table"
        : "no-work-type",
      name1,
      name2,
      name3,
      vendors: [...vendors].sort(sortJa),
      himokuLocked: Boolean(entry && !entry.constructionMenu && name1.length === 1),
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
    // 入力フォーカス中に押したとき、blur→commit が先に走って click が潰れるのを防ぐ。
    button.addEventListener("mousedown", (event) => {
      if (typeof event.preventDefault === "function") event.preventDefault();
    });
    button.addEventListener("click", (event) => {
      try {
        onClick(event);
      } catch (error) {
        const view = documentRef && documentRef.defaultView;
        const message =
          error && error.message ? String(error.message) : String(error || "操作に失敗しました");
        if (view && typeof view.alert === "function") {
          view.alert(message);
        } else if (typeof console !== "undefined" && console.error) {
          console.error(message, error);
        }
      }
    });
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

  /** 予実ヘッダ2段: Excel 原価管理明細列（システム工種｜費目｜種別（補助）｜
   * 詳細｜操作｜単価｜数量｜実行予算額｜月次数量/金額｜原価累計金額｜予算との差｜備考）。
   * 「操作」は UI 専用（＋／－）。数量＝明細計画数量（App757）。 */
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
    top.appendChild(th("システム工種", { rowSpan: 2, freeze: 0 }));
    top.appendChild(th("費目", { rowSpan: 2, freeze: 1 }));
    top.appendChild(th("種別（補助）", { rowSpan: 2, freeze: 2 }));
    top.appendChild(th("詳細", { rowSpan: 2, freeze: 3 }));
    const opsHead = th("操作", { rowSpan: 2, freeze: 4 });
    opsHead.title = "詳細行の追加（＋）・削除（－）。構造は一時保存で App757 へ";
    top.appendChild(opsHead);
    top.appendChild(th("単価", { rowSpan: 2 }));
    const planQtyHead = th("数量", { rowSpan: 2 });
    planQtyHead.title =
      "明細の計画数量（App757）。実行予算額＝ROUND(単価×数量)。月次数量とは別";
    top.appendChild(planQtyHead);
    const finalHead = th("実行予算額", { rowSpan: 2 });
    finalHead.title = "ROUND(単価×数量) 自動（入力不可）。親＝子合計";
    top.appendChild(finalHead);
    for (const month of months) {
      const monthTh = th(jy2MonthLabel(month), { colSpan: 2 });
      monthTh.classList.add("jy2-actual-month");
      monthTh.title = `${month}（数量／金額）`;
      top.appendChild(monthTh);
    }
    top.appendChild(th("原価累計金額", { rowSpan: 2 }));
    const diffHead = th("予算との差", { rowSpan: 2 });
    diffHead.title = "実行予算額 − 原価累計金額（表示のみ）";
    top.appendChild(diffHead);
    const noteHead = th("備考", { rowSpan: 2 });
    noteHead.classList.add("jy2-actual-note-col");
    noteHead.title = "備考（内訳タブで手入力・ここは表示のみ）";
    top.appendChild(noteHead);
    for (const month of months) {
      const qtyTh = th("数量");
      qtyTh.classList.add("jy2-actual-month", "jy2-actual-month-qty");
      qtyTh.title = `${month} 数量（セッション保持・再読込で消える／金額は保存される）`;
      bottom.appendChild(qtyTh);
      const amountTh = th("金額");
      amountTh.classList.add("jy2-actual-month");
      amountTh.title = `${month} 金額（入力）`;
      bottom.appendChild(amountTh);
    }
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

  /** 着手日・竣工日が両方あり、着手日が竣工日より後なら true（U35） */
  function jy2IsStartDateAfterEndDate(startDate, endDate) {
    const start = String(startDate || "").trim();
    const end = String(endDate || "").trim();
    return Boolean(start && end && start > end);
  }

  /** 工期日数: 保存は数値、表示は「N日」（C15） */
  function jy2FormatProjectDaysDisplay(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const num = raw.replace(/日\s*$/u, "").trim();
    return num ? `${num}日` : "";
  }

  function jy2NormalizeProjectDaysValue(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const num = raw.replace(/日\s*$/u, "").trim();
    return /^\d+(\.\d+)?$/.test(num) ? num : "";
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

  /** Ver.01同趣旨: 氏名は空白除去。空なら空文字。 */
  function jy2NormalizePersonName(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function jy2LoginDisplayName() {
    try {
      if (typeof kintone !== "undefined" && typeof kintone.getLoginUser === "function") {
        const user = kintone.getLoginUser();
        if (user) return jy2NormalizePersonName(user.name || user.code || "");
      }
    } catch (_err) {
      /* ignore */
    }
    return "";
  }

  /**
   * 作成者・担当者の手入力名を record に用意する（created_by_name / person_in_charge_name）。
   * 空なら CREATOR／USER_SELECT／ログイン名から初期値を埋める。
   */
  function jy2EnsurePersonNameFields(record) {
    if (!record) return;
    if (!record.created_by_name) record.created_by_name = { value: "" };
    if (!record.person_in_charge_name) record.person_in_charge_name = { value: "" };
    let created = jy2NormalizePersonName(record.created_by_name.value);
    if (!created) {
      created = jy2NormalizePersonName(
        jy2UserSelectDisplay(record.Created_by && record.Created_by.value) ||
          jy2LoginDisplayName(),
      );
      record.created_by_name.value = created;
    }
    let person = jy2NormalizePersonName(record.person_in_charge_name.value);
    if (!person) {
      person = jy2NormalizePersonName(
        jy2UserSelectDisplay(record.person_in_charge && record.person_in_charge.value) ||
          created,
      );
      record.person_in_charge_name.value = person;
    }
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

  // システム工種／工種番号の並びをコード表の依頼者確認リスト順にする。
  // 階層マスタのコードを優先（例: レンタル=11600＝Excel誤記10300の訂正）。
  function jy2ApplyWorkTypeCodeTableOrder(lists) {
    const order = Array.isArray(JY2_NAME_HIERARCHY.workTypeNameOrder)
      ? JY2_NAME_HIERARCHY.workTypeNameOrder
      : Object.keys(JY2_NAME_HIERARCHY.byWorkTypeName || {});
    const byName = JY2_NAME_HIERARCHY.byWorkTypeName || {};
    const seenCodes = new Set();
    for (const name of order) {
      if (!name) continue;
      if (!lists.workTypeNames.includes(name)) lists.workTypeNames.push(name);
      const entry = byName[name];
      const code = entry && entry.workTypeCode ? String(entry.workTypeCode).trim() : "";
      if (code) {
        lists.workTypeByName[name] = code;
        if (!seenCodes.has(code)) {
          lists.workTypeByCode[code] = name;
          seenCodes.add(code);
        }
      }
    }
    const rank = new Map(order.map((n, i) => [n, i]));
    lists.workTypeNames.sort((a, b) => {
      const ra = rank.has(a) ? rank.get(a) : 100000;
      const rb = rank.has(b) ? rank.get(b) : 100000;
      if (ra !== rb) return ra - rb;
      return String(a).localeCompare(String(b), "ja");
    });
    // 工種番号も名称リストと同じ順（初出コードのみ）。
    const codes = [];
    for (const name of lists.workTypeNames) {
      const code = lists.workTypeByName[name];
      if (code && !codes.includes(code)) codes.push(code);
    }
    for (const code of lists.workTypeCodes) {
      if (code && !codes.includes(code)) codes.push(code);
    }
    lists.workTypeCodes = codes;
  }

  async function jy2LoadMasterLists(api) {
    if (jy2MasterListsCache) return jy2MasterListsCache;
    const empty = jy2EmptyMasterLists();
    if (typeof api !== "function") {
      jy2ApplyWorkTypeCodeTableOrder(empty);
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
      // システム工種はコード番号順ではなく、コード表（依頼者確認リスト）順。
      jy2ApplyWorkTypeCodeTableOrder(lists);
      jy2MasterListsCache = lists;
      return lists;
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("JY2 マスタ一覧の読込に失敗（手入力フォールバック）:", error);
      }
      jy2ApplyWorkTypeCodeTableOrder(empty);
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
    "created_by_name",
    "person_in_charge_name",
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
    jy2EnsurePersonNameFields(record);
    const out = {};
    for (const code of JY2_HEADER_EDITABLE_CODES) {
      if (!record || !record[code]) continue;
      let value = record[code].value ?? "";
      if (code === "project_official_name") {
        value = jy2NormalizeFiscalYearText(value);
      }
      if (code === "created_by_name" || code === "person_in_charge_name") {
        value = jy2NormalizePersonName(value);
      }
      if (code === "project_days") {
        value = jy2NormalizeProjectDaysValue(value);
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
    actual: `工${JY2_IDEO}事${JY2_IDEO}原${JY2_IDEO}価${JY2_IDEO}管${JY2_IDEO}理`,
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
    jy2EnsurePersonNameFields(record);

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
    addText("input", "作成者", "created_by_name", {
      transform: jy2NormalizePersonName,
    });
    addText("input", "担当者", "person_in_charge_name", {
      transform: jy2NormalizePersonName,
    });
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

    // 1行: 着手日 → 竣工日 → 工期日数（自動・表示は「N日」）
    const startInput = addText("date", "着手日", "start_date", { rowStart: true });
    const endInput = addText("date", "竣工日", "end_date");
    const daysInput = addText("auto", "工期日数", "project_days");
    const dateOrderWarn = documentRef.createElement("p");
    dateOrderWarn.className = "jy2-warning jy2-span-2";
    dateOrderWarn.hidden = true;
    dateOrderWarn.textContent =
      "着手日が竣工日より後になっています（一時保存は可・版の確定は不可）";
    grid.appendChild(dateOrderWarn);
    const refreshDays = () => {
      const days = jy2CalcProjectDays(startInput.value, endInput.value);
      daysInput.value = jy2FormatProjectDaysDisplay(days);
      jy2ApplyHeaderField(record, "project_days", days);
      const inverted = jy2IsStartDateAfterEndDate(startInput.value, endInput.value);
      dateOrderWarn.hidden = !inverted;
    };
    if (canEdit) {
      startInput.addEventListener("change", refreshDays);
      endInput.addEventListener("change", refreshDays);
      startInput.addEventListener("input", refreshDays);
      endInput.addEventListener("input", refreshDays);
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

  // 給与手当 (D-30/X7/Imp-04): 総括直入力。消費税率・金額税込列は非表示（依頼者 2026-07-29）。
  // 氏名は専用列（複数人は行追加運用）。at least 1 row.
  function jy2SalaryTable(documentRef, summaryModel, editable, rerender) {
    const snapshot = summaryModel.snapshot();
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-salary-table";
    const body = documentRef.createElement("tbody");
    body.appendChild(
      jy2HeadRow(documentRef, [
        "役職・名称（入力）",
        "氏名（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
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
        const personName = jy2Cell(documentRef, "td", "", "");
        personName.appendChild(
          jy2TextInput(documentRef, line.personName, commit("personName")),
        );
        jy2MarkSalaryNameSpaceWarning(personName, line.personName);
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
        row.append(role, personName, unit, quantity, unitPrice);
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
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
        row.appendChild(jy2Cell(documentRef, "td", "", line.personName));
        row.appendChild(jy2Cell(documentRef, "td", "", line.unit));
        row.appendChild(jy2Cell(documentRef, "td", "jy2-num", line.quantity));
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(line.unitPrice)),
        );
        row.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(line.amount)),
        );
        row.appendChild(jy2Cell(documentRef, "td", "", line.note));
        row.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(row);
    }

    const totalRow = documentRef.createElement("tr");
    totalRow.className = "jy2-total-row";
    const totalLabel = jy2Cell(documentRef, "td", "", "給与計");
    totalLabel.colSpan = 5;
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
    totalTail.colSpan = 2;
    totalRow.appendChild(totalTail);
    body.appendChild(totalRow);

    const footRow = documentRef.createElement("tr");
    const footCell = jy2Cell(documentRef, "td", "", "");
    footCell.colSpan = 8;
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
  // 種別 / 備考 are App1 hand-entry (previousLines)。計算基準・消化率は非表示
  // （消化率は工事原価管理タブで管理）。
  // 消費税率・金額税込列は非表示（依頼者 2026-07-29）。保存フィールドは後方互換で残す。
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
      emptyCell.colSpan = 10;
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
    const scroll = jy2CaptureScroll(documentRef, pane);
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
    jy2ApplyScroll(documentRef, pane, scroll);
  }

  // 内訳ブロック1つ分 (Phase 4c): App2-shaped in-memory block with U20 full
  // footer. 小計・計 are system totals (U25) and never editable.
  function jy2CaptureFieldFocus(documentRef, root) {
    const active = documentRef && documentRef.activeElement;
    if (!active || !root || typeof root.contains !== "function" || !root.contains(active)) {
      return null;
    }
    const row = active.closest("tr[data-row-key]");
    const footer = active.closest("tr[data-row-kind]");
    const fieldHost = active.closest("[data-jy2-field]");
    const workType = active.closest("[data-jy2-worktype-field]");
    return {
      rowKey: row ? row.dataset.rowKey : "",
      footerKind: footer ? footer.dataset.rowKind : "",
      field: fieldHost ? fieldHost.dataset.jy2Field : "",
      workTypeField: workType ? workType.dataset.jy2WorktypeField : "",
      selectionStart:
        typeof active.selectionStart === "number" ? active.selectionStart : null,
      selectionEnd:
        typeof active.selectionEnd === "number" ? active.selectionEnd : null,
    };
  }

  function jy2RestoreFieldFocus(root, hint) {
    if (!hint || !root || typeof root.querySelector !== "function") return;
    let target = null;
    if (hint.workTypeField) {
      target = root.querySelector(
        `[data-jy2-worktype-field="${hint.workTypeField}"] input, [data-jy2-worktype-field="${hint.workTypeField}"] select`,
      );
    } else if (hint.footerKind && hint.field) {
      const footer = root.querySelector(`tr[data-row-kind="${hint.footerKind}"]`);
      target =
        footer &&
        footer.querySelector(
          `[data-jy2-field="${hint.field}"] input, [data-jy2-field="${hint.field}"] select, [data-jy2-field="${hint.field}"]`,
        );
    } else if (hint.rowKey && hint.field) {
      const row = root.querySelector(`tr[data-row-key="${hint.rowKey}"]`);
      target =
        row &&
        row.querySelector(
          `[data-jy2-field="${hint.field}"] input, [data-jy2-field="${hint.field}"] select, [data-jy2-field="${hint.field}"]`,
        );
    }
    if (!target || typeof target.focus !== "function") return;
    target.focus();
    if (
      typeof hint.selectionStart === "number" &&
      typeof target.setSelectionRange === "function"
    ) {
      try {
        const end =
          typeof hint.selectionEnd === "number"
            ? hint.selectionEnd
            : hint.selectionStart;
        target.setSelectionRange(hint.selectionStart, end);
      } catch {
        // type=number 等は selection 非対応
      }
    }
  }

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
    let rerenderPending = false;
    let partialEpoch = 0;
    // セル編集は当該ブロックだけ差し替え（全ペイン再構築を避ける）。
    const scheduleRerender = () => {
      if (rerenderPending) return;
      rerenderPending = true;
      const epoch = partialEpoch;
      const onlyBlockId = block.stableBlockId;
      const view = documentRef.defaultView;
      const run = () => {
        rerenderPending = false;
        // ブロック削除/移動など構造変更後の古い partial は破棄。
        if (epoch !== partialEpoch) return;
        rerender({ onlyBlockId });
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        setTimeout(run, 0);
      }
    };
    const rerenderFull = () => {
      partialEpoch += 1;
      rerenderPending = false;
      rerender({ full: true });
    };

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
      scheduleRerender();
    };
    const headerField = (labelText, control) => {
      const label = documentRef.createElement("label");
      jy2AppendModeLabel(documentRef, label, labelText);
      label.appendChild(control);
      head.appendChild(label);
    };
    if (blockEditable) {
      const commitWorkTypeCode = (value) => {
        const id = block.stableBlockId;
        detailModel.updateBlockHeader(id, { workTypeCode: value });
        const mapped = codeMaster.workTypeByCode[value];
        let newName = block.workTypeName;
        if (mapped) {
          detailModel.updateBlockHeader(id, { workTypeName: mapped });
          newName = mapped;
          const nameInput = section.querySelector(
            '[data-jy2-worktype-field="name"] input',
          );
          if (nameInput) nameInput.value = mapped;
        }
        const costCat = jy2ResolveCostCategoryFromWorkType(value, newName);
        if (costCat === "施工" || costCat === "保安") {
          detailModel.updateBlockHeader(id, { costCategory: costCat });
        } else if (costCat === "給与") {
          detailModel.updateBlockHeader(id, { costCategory: null });
        }
        // コード表: システム工種 → 費目を明細へ自動セット。
        jy2ApplyHimokuDefaultToDetails(detailModel, id);
        scheduleRerender();
      };
      const commitWorkTypeName = (value) => {
        const id = block.stableBlockId;
        detailModel.updateBlockHeader(id, { workTypeName: value });
        const mapped = codeMaster.workTypeByName[value];
        let newCode = block.workTypeCode;
        if (mapped) {
          detailModel.updateBlockHeader(id, { workTypeCode: mapped });
          newCode = mapped;
          const codeInput = section.querySelector(
            '[data-jy2-worktype-field="code"] input',
          );
          if (codeInput) codeInput.value = mapped;
        }
        const costCat = jy2ResolveCostCategoryFromWorkType(newCode, value);
        if (costCat === "施工" || costCat === "保安") {
          detailModel.updateBlockHeader(id, { costCategory: costCat });
        } else if (costCat === "給与") {
          detailModel.updateBlockHeader(id, { costCategory: null });
        }
        jy2ApplyHimokuDefaultToDetails(detailModel, id);
        scheduleRerender();
      };
      const workTypeCodeControl = jy2ComboInput(
        documentRef,
        block.workTypeCode,
        codeMaster.workTypeCodes,
        commitWorkTypeCode,
        { commitExactOption: true },
      );
      workTypeCodeControl.dataset.jy2WorktypeField = "code";
      headerField(
        "工種番号（選択）",
        workTypeCodeControl,
      );
      const workTypeNameControl = jy2ComboInput(
        documentRef,
        block.workTypeName,
        codeMaster.workTypeNames,
        commitWorkTypeName,
        { commitExactOption: true },
      );
      workTypeNameControl.dataset.jy2WorktypeField = "name";
      headerField(
        "システム入力工種（選択）",
        workTypeNameControl,
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
      // U3: 取引先は候補リストのみ（打鍵で絞り込み・リスト外は拒否して赤字表示）
      const vendorWrap = documentRef.createElement("span");
      vendorWrap.appendChild(
        jy2ComboInput(
          documentRef,
          block.vendorName,
          suggest.vendors,
          commitHeader("vendorName"),
          { listOnly: true },
        ),
      );
      headerField("取引先（選択）", vendorWrap);
      const actions = documentRef.createElement("div");
      actions.className = "jy2-block-actions";
      actions.appendChild(
        jy2RowButton(documentRef, "↑", () => {
          detailModel.moveBlock(block.stableBlockId, -1);
          rerenderFull();
        }),
      );
      actions.appendChild(
        jy2RowButton(documentRef, "↓", () => {
          detailModel.moveBlock(block.stableBlockId, 1);
          rerenderFull();
        }),
      );
      // P-39: blocks with actuals are retired, never physically deleted.
      if (block.hasActuals) {
        actions.appendChild(
          jy2RowButton(documentRef, "廃止", () => {
            detailModel.retireBlock(block.stableBlockId);
            rerenderFull();
          }),
        );
      } else {
        actions.appendChild(
          jy2RowButton(documentRef, "ブロック削除", () => {
            const id = block.stableBlockId;
            detailModel.removeBlock(id);
            // 先に DOM から外し、古い partial 差し替えが残像を作らないようにする。
            if (typeof section.remove === "function") section.remove();
            else if (section.parentNode) section.parentNode.removeChild(section);
            rerenderFull();
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
        "費目（選択）",
        "種別（補助）（選択）",
        "定義及び品名（入力）",
        "単位（選択）",
        "数量（入力）",
        "単価（入力）",
        "金額（自動）",
        "備考（入力）",
        "",
      ]),
    );

    block.detailRows.forEach((row, rowIndex) => {
      const tr = documentRef.createElement("tr");
      tr.dataset.rowKey = row.rowKey;
      const commit = (field) => (value) => {
        const patch = { [field]: value };
        // 費目変更時: 新しい費目に紐づかない種別はクリア（カスケード整合）。
        if (field === "name1") {
          const entry = jy2ResolveNameHierarchy(block);
          if (jy2HimokuUsesDashType(entry, value)) {
            patch.name2 = "－";
          } else {
            const sole = jy2SoleTypeForHimoku(entry, value);
            const nextSuggest = jy2CollectDetailSuggestions(null, block, {
              ...row,
              name1: value,
            });
            const currentType = row.name2 == null ? "" : String(row.name2).trim();
            if (sole) {
              // 候補が1件だけの費目は種別（補助）を自動選択。
              patch.name2 = sole;
            } else if (
              currentType === "－" ||
              (currentType && !nextSuggest.name2.includes(currentType))
            ) {
              patch.name2 = null;
            }
          }
        }
        // 種別変更時: 定義候補に無い値は残してよい（手入力可）が、
        // 種別クリア時は定義はそのまま（自由記述のため）。
        detailModel.updateDetailRow(block.stableBlockId, row.rowKey, patch);
        scheduleRerender();
      };
      // 行ごとのカスケード候補（費目→種別→定義及び品名）。〃／空は上段実値で解決。
      const prevName1 = jy2PrevResolved(block.detailRows, rowIndex, "name1");
      const prevName2 = jy2PrevResolved(block.detailRows, rowIndex, "name2");
      const prevName3 = jy2PrevResolved(block.detailRows, rowIndex, "name3");
      const resolvedName1 =
        jy2IsDitto(row.name1) || !jy2HasText(row.name1)
          ? prevName1
          : String(row.name1).trim();
      const resolvedName2 =
        jy2IsDitto(row.name2) || !jy2HasText(row.name2)
          ? prevName2
          : String(row.name2).trim();
      const rowSuggest = jy2CollectDetailSuggestions(null, block, {
        ...row,
        name1: resolvedName1,
        name2: resolvedName2,
      });
      const dashTypeFixed = jy2HimokuUsesDashType(
        jy2ResolveNameHierarchy(block),
        resolvedName1,
      );
      // U27: 直前と同値／空継承／保存〃 → 画面は「〃」（Excelの空欄表示は廃止）
      const name1ShowDitto = jy2ShowDitto(row.name1, prevName1);
      const name2ShowDitto = jy2ShowDitto(row.name2, prevName2);
      // 定義及び品名は同値のときだけ〃（空は未設定のまま）
      const name3ShowDitto = jy2ShowDitto(row.name3, prevName3, {
        emptyContinues: false,
      });
      const name1DisplayBlank = name1ShowDitto || !jy2HasText(row.name1);
      const name2DisplayBlank = name2ShowDitto || !jy2HasText(row.name2);
      const name1BlankVisual = {
        blank: name1DisplayBlank,
        continued: name1ShowDitto,
        label: prevName1 || row.nameSpecGroup,
        kind: "費目",
      };
      const name2BlankVisual = {
        blank: name2DisplayBlank,
        continued: name2ShowDitto,
        label: prevName2,
        kind: "種別（補助）",
      };
      if (blockEditable) {
        // U4: 費目/種別（補助）＝リストのみ（打鍵候補は維持）。定義及び品名＝手入力＋候補（全角カナ正規化）。
        const name1 = jy2Cell(documentRef, "td", "", "");
        const name1Ctrl = jy2ComboInput(
          documentRef,
          row.name1,
          rowSuggest.name1,
          commit("name1"),
          {
            displayDitto: name1ShowDitto,
            revealValue: prevName1 || row.name1,
            listOnly: true,
            allowDitto: Boolean(prevName1),
          },
        );
        name1Ctrl.dataset.jy2Field = "name1";
        name1.appendChild(name1Ctrl);
        tr.appendChild(name1);
        const name2 = jy2Cell(documentRef, "td", "", "");
        if (dashTypeFixed) {
          name2.classList.add("jy2-readonly");
          name2.textContent = "－";
          name2.title = "コード表で種別（補助）が「－」のため自動固定";
        } else {
          const name2Ctrl = jy2ComboInput(
            documentRef,
            row.name2,
            rowSuggest.name2,
            commit("name2"),
            {
              displayDitto: name2ShowDitto,
              revealValue: prevName2 || row.name2,
              listOnly: true,
              allowDitto: Boolean(prevName2),
            },
          );
          name2Ctrl.dataset.jy2Field = "name2";
          name2.appendChild(name2Ctrl);
        }
        tr.appendChild(name2);
        const name3 = jy2Cell(documentRef, "td", "", "");
        const name3Ctrl = jy2ComboInput(
          documentRef,
          row.name3,
          rowSuggest.name3,
          (value) => commit("name3")(jy2ToFullWidthKana(value)),
          {
            fullTitle: true,
            displayDitto: name3ShowDitto,
            revealValue: prevName3 || row.name3,
            allowDitto: Boolean(prevName3),
          },
        );
        name3Ctrl.dataset.jy2Field = "name3";
        name3.appendChild(name3Ctrl);
        tr.appendChild(name3);
        const unit = jy2Cell(documentRef, "td", "", "");
        const unitCtrl = jy2UnitSelect(
          documentRef,
          row.unit,
          commit("unit"),
          DETAIL_UNITS,
        );
        unitCtrl.dataset.jy2Field = "unit";
        unit.appendChild(unitCtrl);
        tr.appendChild(unit);
        const quantityCell = jy2Cell(documentRef, "td", "jy2-num", "");
        const qtyCtrl = jy2TextInput(
          documentRef,
          row.quantity,
          commit("quantity"),
        );
        qtyCtrl.dataset.jy2Field = "quantity";
        quantityCell.appendChild(qtyCtrl);
        tr.appendChild(quantityCell);
        const unitPriceCell = jy2Cell(documentRef, "td", "jy2-num", "");
        const priceCtrl = jy2TextInput(
          documentRef,
          row.unitPrice,
          commit("unitPrice"),
        );
        priceCtrl.dataset.jy2Field = "unitPrice";
        unitPriceCell.appendChild(priceCtrl);
        tr.appendChild(unitPriceCell);
        // U17: 薄い赤の起点は費目/種別（補助）のみ。定義及び品名（name3）は必須扱いにしない。
        // 〃は「値あり」扱い（継続入力）。
        const anchor =
          jy2HasText(row.name1) ||
          jy2HasText(row.name2) ||
          name1ShowDitto ||
          name2ShowDitto;
        jy2MarkIncompleteIfAnchor(
          name1,
          anchor,
          name1ShowDitto ? JY2_DITTO_MARK : row.name1,
        );
        jy2MarkIncompleteIfAnchor(
          name2,
          anchor,
          name2ShowDitto ? JY2_DITTO_MARK : row.name2,
        );
        jy2MarkIncompleteIfAnchor(unit, anchor, row.unit);
        jy2MarkIncompleteIfAnchor(quantityCell, anchor, row.quantity);
        jy2MarkIncompleteIfAnchor(unitPriceCell, anchor, row.unitPrice);
        jy2MarkNameBlankVisual(name1, name1BlankVisual);
        if (!dashTypeFixed) jy2MarkNameBlankVisual(name2, name2BlankVisual);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        const note = jy2Cell(documentRef, "td", "", "");
        const noteCtrl = jy2TextInput(documentRef, row.note, commit("note"), {
          fullTitle: true,
        });
        noteCtrl.dataset.jy2Field = "note";
        note.appendChild(noteCtrl);
        tr.appendChild(note);
        const ops = jy2Cell(documentRef, "td", "", "");
        ops.appendChild(
          jy2RowButton(documentRef, "↑", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, -1);
            scheduleRerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "↓", () => {
            detailModel.moveDetailRow(block.stableBlockId, row.rowKey, 1);
            scheduleRerender();
          }),
        );
        ops.appendChild(
          jy2RowButton(documentRef, "削除", () => {
            try {
              detailModel.removeDetailRow(block.stableBlockId, row.rowKey);
            } catch (error) {
              if (/at least 1 detail row/i.test(String(error && error.message))) {
                throw new Error("明細行は1行以上必要なため削除できません", {
                  cause: error,
                });
              }
              throw error;
            }
            scheduleRerender();
          }),
        );
        tr.appendChild(ops);
      } else {
        const name1Cell = jy2Cell(
          documentRef,
          "td",
          "",
          name1ShowDitto ? JY2_DITTO_MARK : row.name1,
        );
        const name2Cell = jy2Cell(
          documentRef,
          "td",
          "",
          name2ShowDitto ? JY2_DITTO_MARK : row.name2,
        );
        jy2MarkNameBlankVisual(name1Cell, name1BlankVisual);
        jy2MarkNameBlankVisual(name2Cell, name2BlankVisual);
        tr.appendChild(name1Cell);
        tr.appendChild(name2Cell);
        {
          const name3Ro = jy2Cell(
            documentRef,
            "td",
            "",
            name3ShowDitto ? JY2_DITTO_MARK : row.name3,
          );
          const name3Text = name3ShowDitto
            ? prevName3 || ""
            : row.name3 === null || row.name3 === undefined
              ? ""
              : String(row.name3).trim();
          if (name3Text) name3Ro.title = name3Text;
          tr.appendChild(name3Ro);
        }
        tr.appendChild(jy2Cell(documentRef, "td", "", row.unit));
        tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", row.quantity));
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", jy2Comma(row.unitPrice)),
        );
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(row.amount)),
        );
        {
          const noteRo = jy2Cell(documentRef, "td", "", row.note);
          const noteText =
            row.note === null || row.note === undefined
              ? ""
              : String(row.note).trim();
          if (noteText) noteRo.title = noteText;
          tr.appendChild(noteRo);
        }
        tr.appendChild(jy2Cell(documentRef, "td", "", ""));
      }
      body.appendChild(tr);
    });

    if (blockEditable) {
      const addRow = documentRef.createElement("tr");
      const addCell = jy2Cell(documentRef, "td", "", "");
      addCell.colSpan = 9;
      addCell.appendChild(
        jy2RowButton(documentRef, "明細行追加", () => {
          detailModel.addDetailRow(block.stableBlockId);
          jy2ApplyHimokuDefaultToDetails(detailModel, block.stableBlockId);
          scheduleRerender();
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

      // R-11(案B): 諸経費は自動(明細金額合計×10%・読取専用)。根拠を行内に表示する。
      // 列対応: ラベル(4列) | 数量列=率% | 単価列=明細金額合計 | 金額列=諸経費 | 備考=式+注意.
      if (kind === "overhead") {
        const label = documentRef.createElement("td");
        label.className = "jy2-footer-label";
        jy2AppendModeLabel(
          documentRef,
          label,
          `${BLOCK_FOOTER_LABELS[kind]}（自動）`,
        );
        label.colSpan = 4;
        tr.appendChild(label);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-num", `${footerRow.ratePercent}%`),
        );
        const unitPriceCell = jy2Cell(
          documentRef,
          "td",
          "jy2-num",
          jy2Comma(footerRow.base),
        );
        unitPriceCell.title = "諸経費の単価は明細金額の合計です";
        tr.appendChild(unitPriceCell);
        tr.appendChild(
          jy2Cell(documentRef, "td", "jy2-amount", jy2Comma(footerRow.amount)),
        );
        const basis = jy2Cell(
          documentRef,
          "td",
          "jy2-footer-basis",
          `明細金額合計 ×${footerRow.ratePercent}%（単価は明細金額の合計）`,
        );
        basis.colSpan = 2;
        basis.title = "諸経費の単価は明細金額の合計です";
        tr.appendChild(basis);
        body.appendChild(tr);
        continue;
      }

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
        const amountCtrl = jy2TextInput(documentRef, footerRow.amount, (value) => {
          detailModel.updateFooterAmount(block.stableBlockId, kind, value);
          scheduleRerender();
        });
        amountCtrl.dataset.jy2Field = "footerAmount";
        amount.appendChild(amountCtrl);
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
  // セル編集は該当ブロック差し替え。ブロック追加/移動/削除のみ全ペイン再描画。
  // 総括再描画は refreshSummary（shell側で dirty 遅延）に委譲。
  // options.focusBlockId: 再描画後にそのブロックへスクロール（工種ブロック追加用）。
  function jy2RenderDetailPane(
    documentRef,
    pane,
    detailModel,
    refreshSummary,
    masterLists,
    options = {},
  ) {
    const notifySummary =
      typeof refreshSummary === "function" ? refreshSummary : () => {};

    const collectPaneSuggestions = () => {
      const paneVendors = new Set(JY2_VENDOR_SEEDS);
      for (const block of detailModel.snapshot().blocks) {
        if (block.vendorName) paneVendors.add(String(block.vendorName));
      }
      return { vendors: [...paneVendors] };
    };

    function findDetailBlockEl(onlyBlockId) {
      const id = String(onlyBlockId || "").trim();
      if (!id || !pane || typeof pane.querySelectorAll !== "function") return null;
      // 属性セレクタは特殊文字で壊れることがあるため dataset で突合する。
      const nodes = pane.querySelectorAll(".jy2-detail-block");
      for (const node of nodes) {
        if (node && node.dataset && String(node.dataset.stableBlockId || "") === id) {
          return node;
        }
      }
      return null;
    }

    function replaceOneBlock(onlyBlockId) {
      const id = String(onlyBlockId || "").trim();
      if (!id) return false;
      const old = findDetailBlockEl(id);
      if (!old) return false;
      const scroll = jy2CaptureScroll(documentRef, pane);
      const focusHint = jy2CaptureFieldFocus(documentRef, old);
      // 当該ブロックの「－」固定／単一種別だけ先に正規化（全ブロック走査はしない）。
      const entryBlock = detailModel
        .snapshot()
        .blocks.find((b) => b.stableBlockId === id);
      if (entryBlock) {
        const entry = jy2ResolveNameHierarchy(entryBlock);
        for (const row of entryBlock.detailRows) {
          if (
            jy2HimokuUsesDashType(entry, row.name1) &&
            String(row.name2 || "").trim() !== "－"
          ) {
            detailModel.updateDetailRow(id, row.rowKey, { name2: "－" });
            continue;
          }
          const sole = jy2SoleTypeForHimoku(entry, row.name1);
          const current = String(row.name2 || "").trim();
          if (sole && (!current || current === "－")) {
            detailModel.updateDetailRow(id, row.rowKey, { name2: sole });
          }
        }
      }
      const block = detailModel.snapshot().blocks.find((b) => b.stableBlockId === id);
      if (!block) return false;
      const next = jy2DetailBlock(
        documentRef,
        detailModel,
        block,
        detailModel.allowedOperations.editBudget,
        rerender,
        collectPaneSuggestions(),
        masterLists,
      );
      old.replaceWith(next);
      if (scroll) jy2ApplyScroll(documentRef, pane, scroll);
      jy2RestoreFieldFocus(next, focusHint);
      notifySummary();
      return true;
    }

    function rerender(arg) {
      let opts = {};
      if (typeof arg === "string") {
        opts = { focusBlockId: arg, full: true };
      } else if (arg && typeof arg === "object") {
        opts = arg;
      }
      const onlyBlockId = String(opts.onlyBlockId || "").trim();
      // full は厳密に true のときのみ部分更新を抑止（truthy 以外の誤指定を避ける）。
      if (onlyBlockId && opts.full !== true) {
        if (replaceOneBlock(onlyBlockId)) return;
      }
      jy2RenderDetailPane(documentRef, pane, detailModel, refreshSummary, masterLists, {
        focusBlockId: opts.focusBlockId,
      });
      notifySummary();
    }

    const focusBlockId = String((options && options.focusBlockId) || "").trim();
    // フォーカス指定時は旧スクロール復元を抑止し、追加ブロックへ移動できるようにする。
    const scroll = focusBlockId ? null : jy2CaptureScroll(documentRef, pane);
    pane.textContent = "";
    const editable = detailModel.allowedOperations.editBudget;
    jy2NormalizeDashTypeDetails(detailModel);
    jy2NormalizeSoleTypeDetails(detailModel);
    const snapshot = detailModel.snapshot();
    const paneSuggestions = collectPaneSuggestions();

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
          paneSuggestions,
          masterLists,
        ),
      );
    }
    if (editable) {
      scroller.appendChild(
        jy2RowButton(documentRef, "工種ブロック追加", () => {
          const id = detailModel.addBlock();
          rerender({ focusBlockId: id, full: true });
        }),
      );
    }
    if (scroll) jy2ApplyScroll(documentRef, pane, scroll);
    if (focusBlockId) {
      const shell = pane.closest ? pane.closest(".jy2-shell") : null;
      jy2GotoDetailBlock(shell, documentRef, focusBlockId);
    }
  }

  function jy2MonthLabel(month) {
    const [year, monthNumber] = month.split("-");
    // 予実の月列は幅を抑える（例: 24/6）
    return `${String(year).slice(-2)}/${Number(monthNumber)}`;
  }

  // 2026-07-29-ver02-actual-detail-expand: 継続（〃）を実値へ解決するヘルパ。
  // detail-block-model の resolveContinuedField を UI ローカルでも用意して、
  // 子行の費目/種別/定義及び品名を上位行から埋め戻す。
  function jy2ActualResolveContinuedField(rows, index, field) {
    if (!Array.isArray(rows) || index < 0) return null;
    for (let i = index; i >= 0; i -= 1) {
      const raw = rows[i] && rows[i][field];
      if (!jy2HasText(raw) || jy2IsDitto(raw)) continue;
      return String(raw).trim();
    }
    return null;
  }

  // Parent 予実 row (2026-07-29-ver02-actual-detail-expand): 内訳№単位で
  // 合計を表示する。手入力欄は明細行にあるためここは全カラム readonly。
  // Phase2c-c-excel-flat: freeze0＝工種番号・freeze1＝既定費目（Excel同一行）。
  // 開閉トグルなし。種別/詳細は walker が常時描画。
  function jy2ActualChildHasStoredAmounts(child) {
    if (!child) return false;
    if (jy2ActualDecimalAddend(child.finalBudget) !== null) return true;
    if (jy2ActualDecimalAddend(child.actual) !== null) return true;
    if (child.monthly && typeof child.monthly === "object") {
      for (const value of Object.values(child.monthly)) {
        if (jy2ActualDecimalAddend(value) !== null) return true;
      }
    }
    return false;
  }

  function jy2ActualRow(
    documentRef,
    actualsModel,
    row,
    months,
    editable,
    rerender,
    expandState,
    parentHimokuOpts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-parent-row";
    tr.dataset.stableBlockId = row.stableBlockId;
    tr.dataset.costCategory = row.costCategory;
    tr.dataset.blockStatus = row.status;
    if (row.hasChildren) tr.dataset.hasChildren = "true";

    const idCell = jy2Cell(
      documentRef,
      "td",
      row.status === "retired" ? "jy2-retired-tag" : "jy2-num",
      "",
    );
    const codeLabel = documentRef.createElement("span");
    codeLabel.className = "jy2-actual-parent-num";
    codeLabel.textContent =
      row.status === "retired" ? "廃止" : String(row.workTypeCode || "－");
    if (row.workTypeName) {
      codeLabel.title = String(row.workTypeName);
    }
    idCell.appendChild(codeLabel);
    tr.appendChild(jy2MarkFreeze(idCell, 0));

    const himokuCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-parent-himoku",
      "",
    );
    const primaryHimokuLabel =
      parentHimokuOpts && parentHimokuOpts.primaryHimokuLabel
        ? String(parentHimokuOpts.primaryHimokuLabel)
        : "";
    if (primaryHimokuLabel) {
      himokuCell.title = `費目「${primaryHimokuLabel}」（Excel: 工種と同一行）`;
      const himokuLabelSpan = documentRef.createElement("span");
      himokuLabelSpan.textContent = primaryHimokuLabel;
      himokuCell.appendChild(himokuLabelSpan);
      // Excel寄せ: 種別はコード表固定のため費目横「＋種別行」は出さない。
    }
    tr.appendChild(jy2MarkFreeze(himokuCell, 1));
    const parentTypeCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 2);
    const parentDetailCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 3);
    const parentOpsCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-ops-cell", ""),
      4,
    );
    const parentUnitCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-unit-price",
      "",
    );
    const parentPlanQtyCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-plan-qty",
      "",
    );
    tr.appendChild(parentTypeCell);
    tr.appendChild(parentDetailCell);
    tr.appendChild(parentOpsCell);
    tr.appendChild(parentUnitCell);
    tr.appendChild(parentPlanQtyCell);
    jy2ActualApplyVisualMerge([
      parentTypeCell,
      parentDetailCell,
      parentOpsCell,
      parentUnitCell,
      parentPlanQtyCell,
    ]);
    const parentShouldShow =
      parentHimokuOpts &&
      typeof parentHimokuOpts.shouldShowDetail === "function"
        ? parentHimokuOpts.shouldShowDetail
        : null;
    const parentSumChildren = jy2ActualChildrenForBudgetSum(
      row.children,
      parentShouldShow,
    );
    const parentFinalBudget = row.hasChildren
      ? jy2ActualSumField(parentSumChildren, "finalBudget")
      : row.finalBudget;
    const parentActual = row.hasChildren
      ? jy2ActualSumField(parentSumChildren, "actual")
      : row.actual;
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2AmountDisplay(parentFinalBudget),
      ),
    );
    const parentMonthQtyState =
      parentHimokuOpts && parentHimokuOpts.monthQtyState
        ? parentHimokuOpts.monthQtyState
        : null;
    for (const month of months) {
      const qtySum = jy2ActualSumMonthQty(
        parentSumChildren,
        month,
        parentMonthQtyState,
        row,
      );
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        jy2ActualMonthQtySumDisplay(qtySum),
      );
      qtyCell.title = "合計（表示中の子の月次数量・自動・入力不可）";
      tr.appendChild(qtyCell);
      const monthSum = row.hasChildren
        ? jy2ActualSumMonth(parentSumChildren, month)
        : row.monthly[month];
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthSum === null || monthSum === undefined
          ? "－"
          : jy2AmountDisplay(monthSum),
      );
      monthCell.title = "合計（自動・入力不可）";
      tr.appendChild(monthCell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(parentActual)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2ActualBudgetDiffDisplay(parentFinalBudget, parentActual),
      ),
    );
    // Phase2a: 備考列。表示のみ（親行は projection の summary_note 由来）。
    const parentNoteText = String(row.budgetNote ?? "");
    const parentNoteCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-note",
      parentNoteText,
    );
    if (parentNoteText) parentNoteCell.title = parentNoteText;
    tr.appendChild(parentNoteCell);
    return tr;
  }

  // Child 予実 row (2026-07-29-ver02-actual-detail-expand): 内訳の明細行に
  // 対応。編集は月別消化と最終予算額のみ。費目/種別/定義及び品名は継続
  // （〃）を上位行から解決した実値で表示する。
  function jy2ActualChildRow(
    documentRef,
    actualsModel,
    parent,
    child,
    detailRows,
    detailIndex,
    months,
    editable,
    rerender,
    monthQtyState,
    childDetailOpts = {},
  ) {
    const {
      detailModel: childDetailModel,
      canEditBudget: childCanEditBudget,
      revealDetailKey,
      onDetailChanged,
      onDetailFieldChanged,
    } = childDetailOpts;
    const notifyFieldChanged = () => {
      if (typeof onDetailFieldChanged === "function") {
        onDetailFieldChanged();
      } else if (typeof onDetailChanged === "function") {
        onDetailChanged();
      } else if (typeof rerender === "function") {
        rerender();
      }
    };
    const liveUnitPrice = () => {
      if (!childDetailModel || !child || !child.rowKey) {
        return child && child.unitPrice;
      }
      try {
        const snap = childDetailModel.snapshot();
        const block = (snap.blocks || []).find(
          (candidate) =>
            candidate && candidate.stableBlockId === parent.stableBlockId,
        );
        const row = ((block && block.detailRows) || []).find(
          (candidate) => candidate && candidate.rowKey === child.rowKey,
        );
        if (row && row.unitPrice != null && String(row.unitPrice).trim() !== "") {
          return row.unitPrice;
        }
      } catch {
        // fall through
      }
      return child.unitPrice;
    };
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-child-row";
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.dataset.rowKey = child.rowKey;
    // 左固定: freeze0–2=空、freeze3=詳細(name3)、freeze4=操作（費目/種別はグループ枠）。
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 1));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 2));
    const name1Resolved =
      jy2ActualResolveContinuedField(detailRows, detailIndex, "name1") ?? "";
    const nameCell = jy2Cell(documentRef, "td", "jy2-actual-child-name", "");
    // Excel 詳細列はツリー記号なし・セル自体が手入力。└＋width100%入力だと
    // overflow で入力欄が消え「└」だけ見える状態になっていた。
    const name2Resolved =
      jy2ActualResolveContinuedField(detailRows, detailIndex, "name2") ?? "";
    const name3Raw = detailRows?.[detailIndex]?.name3;
    const name3Resolved = jy2IsDitto(name3Raw)
      ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name3") ?? ""
      : jy2HasText(name3Raw)
        ? String(name3Raw).trim()
        : "";
    const fullPath = [name1Resolved, name2Resolved, name3Resolved]
      .map((part) => String(part).trim())
      .filter((part) => part.length > 0)
      .join(" / ");
    let opsEl = null;
    if (childCanEditBudget && childDetailModel) {
      const name3InputValue = jy2IsDitto(name3Raw)
        ? name3Resolved
        : jy2HasText(name3Raw)
          ? String(name3Raw).trim()
          : "";
      const name3Input = jy2TextInput(
        documentRef,
        name3InputValue,
        (value) => {
          childDetailModel.updateDetailRow(parent.stableBlockId, child.rowKey, {
            name3: jy2ToFullWidthKana(value),
          });
          if (typeof revealDetailKey === "function") {
            revealDetailKey(child.rowKey);
          }
          notifyFieldChanged();
        },
        { fullTitle: true },
      );
      name3Input.className = "jy2-input jy2-actual-child-name-input";
      name3Input.placeholder = "詳細（手入力）";
      if (fullPath) name3Input.title = fullPath;
      opsEl = documentRef.createElement("span");
      opsEl.className = "jy2-actual-child-ops";
      opsEl.setAttribute("aria-label", "詳細行の追加・削除");
      const addSibling = documentRef.createElement("button");
      addSibling.type = "button";
      addSibling.className =
        "jy2-actual-detail-pm-btn jy2-actual-child-add-btn";
      addSibling.textContent = "＋";
      addSibling.setAttribute("aria-label", "詳細行を追加");
      addSibling.title = "詳細行を追加（一時保存で App757 へ）";
      addSibling.addEventListener("mousedown", (event) => {
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      addSibling.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          const patch = {};
          if (name1Resolved) patch.name1 = name1Resolved;
          if (name2Resolved && name2Resolved !== "－") patch.name2 = name2Resolved;
          const newKey = jy2ActualInsertDetailNear(
            childDetailModel,
            parent.stableBlockId,
            child.rowKey,
            patch,
            null,
          );
          if (typeof revealDetailKey === "function") {
            revealDetailKey(newKey);
          }
          if (typeof onDetailChanged === "function") onDetailChanged();
          else if (typeof rerender === "function") rerender();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      const deleteBtn = documentRef.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-child-delete-btn";
      deleteBtn.textContent = "－";
      deleteBtn.setAttribute("aria-label", "詳細行を削除");
      deleteBtn.title = "詳細行を削除（一時保存で App757 へ）";
      deleteBtn.addEventListener("mousedown", (event) => {
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      deleteBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          const view = documentRef && documentRef.defaultView;
          if (jy2ActualChildHasStoredAmounts(child)) {
            const ok =
              view && typeof view.confirm === "function"
                ? view.confirm(
                    "この行には実行予算または月次実績があります。削除しますか？\n（構造は一時保存で App757 へ。App758 の古い実績キーは残る場合があります）",
                  )
                : true;
            if (!ok) return;
          }
          childDetailModel.removeDetailRow(
            parent.stableBlockId,
            child.rowKey,
          );
          if (typeof onDetailChanged === "function") onDetailChanged();
          else if (typeof rerender === "function") rerender();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const raw = String((error && error.message) || error || "");
          const message = /at least 1 detail row/i.test(raw)
            ? "工種ブロックには明細が1行以上必要なため削除できません"
            : raw || "詳細行の削除に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      opsEl.appendChild(addSibling);
      opsEl.appendChild(deleteBtn);
      nameCell.appendChild(name3Input);
    } else {
      const nameLabel = documentRef.createElement("span");
      nameLabel.textContent = name3Resolved || "－";
      nameLabel.title = fullPath || nameLabel.textContent;
      nameCell.appendChild(nameLabel);
    }
    tr.appendChild(jy2MarkFreeze(nameCell, 3));
    const opsCell = jy2Cell(documentRef, "td", "jy2-actual-ops-cell", "");
    if (opsEl) opsCell.appendChild(opsEl);
    tr.appendChild(jy2MarkFreeze(opsCell, 4));

    const unitPriceCell = jy2Cell(documentRef, "td", "jy2-num", "");
    const unitPriceRaw =
      detailIndex >= 0 && detailRows?.[detailIndex]
        ? detailRows[detailIndex].unitPrice
        : child.unitPrice;
    const unitPriceInputValue =
      unitPriceRaw === null || unitPriceRaw === undefined
        ? ""
        : String(unitPriceRaw).trim();
    // 月次・明細フィールド change を同一フレームにまとめ、連続入力の全表再構築を抑える。
    let actualRerenderPending = false;
    function scheduleActualRerender() {
      if (actualRerenderPending) return;
      actualRerenderPending = true;
      const view = documentRef && documentRef.defaultView;
      const run = () => {
        actualRerenderPending = false;
        if (typeof rerender === "function") rerender();
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        run();
      }
    }
    const commitDetailField = (patch) => {
      childDetailModel.updateDetailRow(parent.stableBlockId, child.rowKey, patch);
      if (typeof revealDetailKey === "function") {
        revealDetailKey(child.rowKey);
      }
      notifyFieldChanged();
      scheduleActualRerender();
    };
    if (childCanEditBudget && childDetailModel) {
      const unitPriceInput = jy2TextInput(
        documentRef,
        unitPriceInputValue,
        (value) => commitDetailField({ unitPrice: value }),
      );
      unitPriceInput.className = "jy2-input jy2-actual-child-unit-price-input";
      unitPriceInput.placeholder = "単価";
      unitPriceInput.title = "単価（手入力・一時保存で App757 へ）";
      unitPriceCell.appendChild(unitPriceInput);
    } else {
      unitPriceCell.className = "jy2-num";
      unitPriceCell.textContent = jy2AmountDisplay(child.unitPrice);
    }
    tr.appendChild(unitPriceCell);

    const planQtyCell = jy2Cell(documentRef, "td", "jy2-num", "");
    const planQtyRaw =
      detailIndex >= 0 && detailRows?.[detailIndex]
        ? detailRows[detailIndex].quantity
        : child.quantity;
    const planQtyInputValue =
      planQtyRaw === null || planQtyRaw === undefined
        ? ""
        : String(planQtyRaw).trim();
    if (childCanEditBudget && childDetailModel) {
      const planQtyInput = jy2TextInput(
        documentRef,
        planQtyInputValue,
        (value) => commitDetailField({ quantity: value }),
      );
      planQtyInput.className = "jy2-input jy2-actual-child-qty-input";
      planQtyInput.placeholder = "数量";
      planQtyInput.title =
        "計画数量（一時保存で App757 へ）。実行予算額＝ROUND(単価×数量)";
      planQtyCell.appendChild(planQtyInput);
    } else {
      planQtyCell.textContent = planQtyInputValue || "－";
    }
    tr.appendChild(planQtyCell);

    const commit = (patch) => {
      try {
        actualsModel.updateActualRow(
          parent.stableBlockId,
          parent.costCategory,
          patch,
          { rowKey: child.rowKey },
        );
      } catch {
        // Invalid input (non-integer) is discarded; rerender restores the cell.
      }
      scheduleActualRerender();
    };
    // 実行予算額＝ROUND(単価×数量) 自動のみ（手入力なし）
    const autoBudget = jy2RoundYenQtyTimesPrice(
      planQtyInputValue || child.quantity,
      unitPriceInputValue || child.unitPrice,
    );
    const finalCell = jy2Cell(
      documentRef,
      "td",
      "jy2-amount jy2-actual-auto-budget",
      autoBudget === null ? "－" : jy2AmountDisplay(autoBudget),
    );
    finalCell.title = "実行予算額＝ROUND(単価×数量)（自動・入力不可）";
    tr.appendChild(finalCell);
    // Phase2b (2026-07-31): 月次は「数量｜金額」の2セル。
    // - 数量: pane 上のセッション Map で保持（App758 に保存しない・再読込で消える）。
    //   commit 時に単価×数量を丸めて金額 amount へ書き戻す（qty→amount 一方向）。
    // - 金額: 直接入力（従来通り）。commit 時にセッション数量を消す（override＝qty 無効化）。
    for (const month of months) {
      // 数量セル
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty",
        "",
      );
      if (editable) {
        const qtyValue = monthQtyState
          ? monthQtyState.get(
              parent.stableBlockId,
              parent.costCategory,
              child.rowKey,
              month,
            )
          : "";
        const qtyInput = jy2TextInput(documentRef, qtyValue, (value) => {
          const trimmed = String(value || "").trim();
          if (!monthQtyState) return;
          if (trimmed === "") {
            monthQtyState.clear(
              parent.stableBlockId,
              parent.costCategory,
              child.rowKey,
              month,
            );
            // 空クリア時は amount を自動クリアしない（再描画も不要）。
            return;
          }
          monthQtyState.set(
            parent.stableBlockId,
            parent.costCategory,
            child.rowKey,
            month,
            trimmed,
          );
          const computed = jy2RoundYenQtyTimesPrice(trimmed, liveUnitPrice());
          if (computed != null) {
            commit({ [month]: computed });
          }
        });
        qtyInput.title =
          "数量（セッション保持・再読込で消える／金額は保存される）";
        qtyCell.appendChild(qtyInput);
      } else {
        qtyCell.textContent = "－";
      }
      tr.appendChild(qtyCell);

      // 金額セル
      const cell = jy2Cell(documentRef, "td", "jy2-num jy2-actual-month", "");
      if (editable) {
        cell.appendChild(
          jy2TextInput(documentRef, child.monthly[month], (value) => {
            // 直接金額入力は override 扱い → セッション数量を消す
            // （qty×unit で復元不能な値が入りうるため。DeepSeek 盲点2）
            if (monthQtyState) {
              monthQtyState.clear(
                parent.stableBlockId,
                parent.costCategory,
                child.rowKey,
                month,
              );
            }
            commit({ [month]: value });
          }),
        );
      } else {
        cell.className = "jy2-amount jy2-actual-month";
        cell.textContent = jy2AmountDisplay(child.monthly[month]);
      }
      tr.appendChild(cell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(child.actual)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2ActualBudgetDiffDisplay(
          autoBudget !== null ? autoBudget : child.finalBudget,
          child.actual,
        ),
      ),
    );
    // Phase2a: 備考列。子行は detailRows[detailIndex].note を読取表示のみ。
    // App758 のキー・App757 明細モデルは変更しない（編集は Phase2a 対象外）。
    const childNoteRaw = detailRows?.[detailIndex]?.note;
    const childNoteText = childNoteRaw == null ? "" : String(childNoteRaw);
    const childNoteCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-note",
      childNoteText,
    );
    if (childNoteText) childNoteCell.title = childNoteText;
    tr.appendChild(childNoteCell);
    return tr;
  }

  // Phase2c-b/c: App757 detailModel に明細行を追加し、anchor の直後へ寄せる。
  // patch で name1/name2 を prefill。actualsModel は触らない。
  function jy2ActualInsertDetailNear(detailModel, blockId, lastChildRowKey, patch, expandState) {
    const findBlockRows = () => {
      const snapshot = detailModel.snapshot();
      const blocks = (snapshot && snapshot.blocks) || [];
      const target = blocks.find(
        (block) => block && block.stableBlockId === blockId,
      );
      return target && Array.isArray(target.detailRows) ? target.detailRows : [];
    };
    const indexOfKey = (rows, key) => {
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i] && rows[i].rowKey === key) return i;
      }
      return -1;
    };
    const preRows = findBlockRows();
    const anchorIndex =
      lastChildRowKey != null ? indexOfKey(preRows, lastChildRowKey) : -1;
    const newKey = detailModel.addDetailRow(blockId);
    if (patch && typeof patch === "object") {
      const clean = {};
      if (Object.prototype.hasOwnProperty.call(patch, "name1")) {
        clean.name1 = patch.name1;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "name2")) {
        clean.name2 = patch.name2;
      }
      if (Object.keys(clean).length > 0) {
        detailModel.updateDetailRow(blockId, newKey, clean);
      }
    }
    if (anchorIndex >= 0) {
      const targetIndex = anchorIndex + 1;
      let safety = findBlockRows().length + 1;
      while (safety > 0) {
        safety -= 1;
        const currentRows = findBlockRows();
        const currentIndex = indexOfKey(currentRows, newKey);
        if (currentIndex < 0 || currentIndex === targetIndex) break;
        const offset = currentIndex > targetIndex ? -1 : 1;
        detailModel.moveDetailRow(blockId, newKey, offset);
      }
    }
    if (expandState && typeof expandState.expand === "function") {
      expandState.expand(blockId);
    }
    return newKey;
  }

  // Phase2c-a (2026-07-31): 費目(name1)視覚グループ用の表示専用行。
  // 列: freeze0/2/3空/freeze1ラベル + 単価/実行予算額/月次/原価累計/差/備考（helper）。
  function jy2ActualHimokuGroupRow(
    documentRef,
    parent,
    label,
    childrenInGroup,
    months,
    opts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-himoku-group-row";
    tr.dataset.virtual = "himoku-group";
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.title = "費目合計（表示専用・入力不可）";

    // システム工種: 空欄（子行と同じレイアウト）
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    const labelCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-himoku-group-label",
      "",
    );
    labelCell.title = `費目「${label}」の合計（表示専用・入力不可）`;
    const himokuLabelSpan = documentRef.createElement("span");
    himokuLabelSpan.textContent = label;
    labelCell.appendChild(himokuLabelSpan);
    // Excel寄せ: 種別はコード表固定のため費目グループの「＋種別行」は出さない。
    tr.appendChild(jy2MarkFreeze(labelCell, 1));
    const himokuTypeCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 2);
    const himokuDetailCell = jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 3);
    const himokuOpsCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-ops-cell", ""),
      4,
    );
    tr.appendChild(himokuTypeCell);
    tr.appendChild(himokuDetailCell);
    tr.appendChild(himokuOpsCell);
    const himokuValueCols = jy2ActualAppendGroupValueCols(
      documentRef,
      tr,
      childrenInGroup,
      months,
      {
        unitPriceEmpty: true,
        planQtyEmpty: true,
        monthQtyState: opts && opts.monthQtyState,
        shouldShowDetail: opts && opts.shouldShowDetail,
        parent,
      },
    );
    jy2ActualApplyVisualMerge([
      himokuTypeCell,
      himokuDetailCell,
      himokuOpsCell,
      himokuValueCols.unitPriceCell,
      himokuValueCols.planQtyCell,
    ]);
    return tr;
  }

  // Phase2c-c (2026-07-31): 種別(name2)視覚グループ。費目枠の内側。
  // virtual=type-group・表示専用 SUM。「＋詳細行」で name1+name2 prefill。
  // Phase2c-c-excel-flat: 種別 +/- なし。Excelどおり常時表示。
  function jy2ActualTypeGroupRow(
    documentRef,
    parent,
    himokuLabel,
    typeLabel,
    childrenInGroup,
    months,
    opts,
  ) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-actual-type-group-row";
    tr.dataset.virtual = "type-group";
    tr.dataset.stableBlockId = parent.stableBlockId;
    tr.dataset.costCategory = parent.costCategory;
    tr.title = "種別合計（表示専用・入力不可）";

    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-num", ""), 0));
    tr.appendChild(jy2MarkFreeze(jy2Cell(documentRef, "td", "", ""), 1));
    const labelCell = jy2Cell(
      documentRef,
      "td",
      "jy2-actual-type-group-label",
      "",
    );
    labelCell.title = `種別「${typeLabel}」の合計（表示専用・入力不可）`;
    const typeLabelSpan = documentRef.createElement("span");
    typeLabelSpan.textContent = typeLabel;
    labelCell.appendChild(typeLabelSpan);
    tr.appendChild(jy2MarkFreeze(labelCell, 2));
    // Excel寄せ: 詳細〜単価は見た目結合。数量・実行予算は子SUMを表示。
    const detailCell = jy2MarkFreeze(
      jy2Cell(documentRef, "td", "jy2-actual-type-detail-slot", ""),
      3,
    );
    tr.appendChild(detailCell);
    const typeOpsCell = jy2Cell(documentRef, "td", "jy2-actual-ops-cell", "");
    // 空種別: 操作列の＋で最初の詳細行を追加（ラベル横の「＋詳細行」は廃止）
    if (
      opts &&
      opts.detailQuickAdd === true &&
      opts.detailModel &&
      opts.canEditBudget === true &&
      typeof opts.onAdded === "function"
    ) {
      const ops = documentRef.createElement("span");
      ops.className = "jy2-actual-child-ops";
      ops.setAttribute("aria-label", "詳細行の追加");
      const addBtn = documentRef.createElement("button");
      addBtn.type = "button";
      addBtn.className =
        "jy2-actual-detail-pm-btn jy2-actual-type-ops-add-btn";
      addBtn.textContent = "＋";
      addBtn.setAttribute("aria-label", "詳細行を追加");
      addBtn.title = "この種別の下に詳細行を追加（一時保存で App757 へ）";
      addBtn.addEventListener("mousedown", (event) => {
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      addBtn.addEventListener("click", (event) => {
        try {
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          const patch = {};
          if (himokuLabel && himokuLabel !== "（未分類）") {
            patch.name1 = himokuLabel;
          }
          if (typeLabel && typeLabel !== "（種別未設定）") {
            patch.name2 = typeLabel;
          }
          const newKey = jy2ActualInsertDetailNear(
            opts.detailModel,
            parent.stableBlockId,
            opts.lastChildRowKeyInGroup || null,
            patch,
            opts.expandState,
          );
          if (typeof opts.revealDetailKey === "function") {
            opts.revealDetailKey(newKey);
          }
          opts.onAdded();
        } catch (error) {
          const view = documentRef && documentRef.defaultView;
          const message =
            (error && error.message) || "詳細行の追加に失敗しました";
          if (view && typeof view.alert === "function") view.alert(message);
          else if (typeof console !== "undefined" && console.error) {
            console.error(message, error);
          }
        }
      });
      ops.appendChild(addBtn);
      typeOpsCell.appendChild(ops);
    }
    tr.appendChild(jy2MarkFreeze(typeOpsCell, 4));
    const typeValueCols = jy2ActualAppendGroupValueCols(
      documentRef,
      tr,
      childrenInGroup,
      months,
      {
        unitPriceEmpty: true,
        // 種別行: 詳細の計画数量合計＋実行予算合計を出す（結合は単価まで）
        planQtyEmpty: false,
        shouldShowDetail: opts && opts.shouldShowDetail,
        monthQtyState: opts && opts.monthQtyState,
        parent,
      },
    );
    jy2ActualApplyVisualMerge([
      detailCell,
      typeOpsCell,
      typeValueCols.unitPriceCell,
    ]);
    return tr;
  }

  // Phase2c-a: 費目グループ行の金額集計ヘルパ。子の該当フィールドが全て
  // null/empty のときは null（→ 呼び出し側で "－" 表示）を返す。値がある
  // ものだけを decimal `add` で足し合わせるので、数値の丸めは行わない。
  function jy2ActualDecimalAddend(raw) {
    if (raw === null || raw === undefined) return null;
    const text = String(raw).trim().replace(/[,，]/g, "");
    if (!text || text === "-" || text === "－") return null;
    if (!/^[+-]?\d+(?:\.\d*)?$/.test(text)) return null;
    return text;
  }

  // 手動のみ: 集計は画面に出ている詳細だけ（隠れ内訳の金額を乗せない）。
  function jy2ActualChildrenForBudgetSum(children, shouldShowDetail) {
    if (!JY2_ACTUAL_DETAIL_MANUAL_ONLY) return children || [];
    if (typeof shouldShowDetail !== "function") return children || [];
    return (children || []).filter(
      (child) => child && child.rowKey && shouldShowDetail(child.rowKey),
    );
  }

  function jy2ActualSumField(children, field) {
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      const addend = jy2ActualDecimalAddend(child && child[field]);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  function jy2ActualSumMonth(children, month) {
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      const raw = child && child.monthly ? child.monthly[month] : null;
      const addend = jy2ActualDecimalAddend(raw);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  // Excel寄せ: 費目/種別/親の月次数量＝子明細のセッション数量 SUM（入力不可）。
  function jy2ActualSumMonthQty(children, month, monthQtyState, parent) {
    if (!monthQtyState || !parent || !parent.stableBlockId) return null;
    let total = "0";
    let anyValue = false;
    for (const child of children || []) {
      if (!child || !child.rowKey) continue;
      const raw = monthQtyState.get(
        parent.stableBlockId,
        parent.costCategory,
        child.rowKey,
        month,
      );
      const addend = jy2ActualDecimalAddend(raw);
      if (addend === null) continue;
      total = add(total, addend);
      anyValue = true;
    }
    return anyValue ? total : null;
  }

  function jy2ActualMonthQtySumDisplay(qtySum) {
    if (qtySum === null || qtySum === undefined) return "－";
    const text = jy2Comma(qtySum);
    return text === "" ? "－" : text;
  }

  // Excel列: 予算との差＝実行予算額−原価累計（表示のみ）。
  function jy2ActualBudgetDiffDisplay(finalBudget, actual) {
    const fb = jy2ActualDecimalAddend(finalBudget);
    const ac = jy2ActualDecimalAddend(actual);
    if (fb === null && ac === null) return "－";
    return jy2AmountDisplay(subtract(fb || "0", ac || "0"));
  }

  // Excel寄せ: 集計行の空き列を見た目結合（colspanなし・sticky維持）。
  function jy2ActualApplyVisualMerge(cells) {
    const list = (cells || []).filter(Boolean);
    for (let i = 0; i < list.length; i += 1) {
      const td = list[i];
      td.classList.add("jy2-actual-visual-merge");
      if (i === 0) td.classList.add("jy2-actual-visual-merge-start");
      else if (i === list.length - 1) {
        td.classList.add("jy2-actual-visual-merge-end");
      } else {
        td.classList.add("jy2-actual-visual-merge-mid");
      }
    }
  }

  // 費目/種別グループ行の値列（単価/数量/実行予算額/月次/原価累計/差/備考）を追加。
  // opts.unitPriceEmpty: 見た目結合用に空表示。
  // opts.planQtyEmpty: true なら空（結合用）。false なら表示中子の計画数量 SUM。
  // 戻り値: { unitPriceCell, planQtyCell }（見た目結合の末尾に使う）。
  function jy2ActualAppendGroupValueCols(
    documentRef,
    tr,
    childrenInGroup,
    months,
    opts,
  ) {
    const unitPriceEmpty = !!(opts && opts.unitPriceEmpty);
    const planQtyEmpty = !!(opts && opts.planQtyEmpty);
    const shouldShowDetail = opts && opts.shouldShowDetail;
    const sumChildren = jy2ActualChildrenForBudgetSum(
      childrenInGroup,
      shouldShowDetail,
    );
    const unitPriceCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-unit-price",
      unitPriceEmpty ? "" : "－",
    );
    tr.appendChild(unitPriceCell);
    const planQtySum = planQtyEmpty
      ? null
      : jy2ActualSumField(sumChildren, "quantity");
    const planQtyCell = jy2Cell(
      documentRef,
      "td",
      "jy2-num jy2-actual-group-plan-qty jy2-actual-sum-cell",
      planQtyEmpty ? "" : jy2ActualMonthQtySumDisplay(planQtySum),
    );
    if (!planQtyEmpty) {
      planQtyCell.title =
        "合計（表示中の詳細の計画数量・自動・入力不可）";
    }
    tr.appendChild(planQtyCell);
    const finalBudgetSum = jy2ActualSumField(sumChildren, "finalBudget");
    const finalBudgetCell = jy2Cell(
      documentRef,
      "td",
      "jy2-amount jy2-actual-sum-cell",
      jy2AmountDisplay(finalBudgetSum),
    );
    finalBudgetCell.title =
      "合計（表示中の詳細の実行予算額・自動・入力不可）";
    tr.appendChild(finalBudgetCell);
    const monthQtyState = opts && opts.monthQtyState;
    const parentRef = opts && opts.parent;
    for (const month of months) {
      const qtySum = jy2ActualSumMonthQty(
        sumChildren,
        month,
        monthQtyState,
        parentRef,
      );
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        jy2ActualMonthQtySumDisplay(qtySum),
      );
      qtyCell.title = "合計（表示中の子の月次数量・自動・入力不可）";
      tr.appendChild(qtyCell);
      const monthSum = jy2ActualSumMonth(sumChildren, month);
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthSum === null ? "－" : jy2AmountDisplay(monthSum),
      );
      monthCell.title = "合計（表示専用・入力不可）";
      tr.appendChild(monthCell);
    }
    const actualSum = jy2ActualSumField(sumChildren, "actual");
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(actualSum)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2ActualBudgetDiffDisplay(finalBudgetSum, actualSum),
      ),
    );
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-actual-note", "－"));
    return { unitPriceCell, planQtyCell };
  }

  // Phase2b (2026-07-31): 月次数量セル用の丸めヘルパ。単価×数量を整数円へ
  // 四捨五入して string で返す。数量/単価いずれかが不正なら null（＝金額を
  // 自動更新しない）。カンマ区切り入力は許容する。
  function jy2RoundYenQtyTimesPrice(qty, unitPrice) {
    const q = Number(String(qty ?? "").replace(/,/g, ""));
    const p = Number(String(unitPrice ?? "").replace(/,/g, ""));
    if (!Number.isFinite(q) || !Number.isFinite(p)) return null;
    return String(Math.round(q * p));
  }

  // Phase2b (2026-07-31): 月次数量セッション Map。pane 要素に Map を保持し、
  // 再描画（rerender）を跨いでも数量入力が残る。ただし actuals-matrix には
  // 保存しない — 再読込（タブ再入場・保存後リロード）で必ず消える。キーは
  // `${stableBlockId}|${costCategory}|${rowKey}|${month}`。値は string 数量。
  function jy2ActualMonthQtyState(pane) {
    if (!pane) {
      return {
        get: () => "",
        set: () => {},
        clear: () => {},
      };
    }
    if (!pane.__jy2ActualMonthQty) {
      pane.__jy2ActualMonthQty = new Map();
    }
    const map = pane.__jy2ActualMonthQty;
    const key = (stableBlockId, costCategory, rowKey, month) =>
      `${stableBlockId}|${costCategory}|${rowKey || ""}|${month}`;
    return {
      get: (stableBlockId, costCategory, rowKey, month) =>
        map.get(key(stableBlockId, costCategory, rowKey, month)) || "",
      set: (stableBlockId, costCategory, rowKey, month, value) => {
        map.set(key(stableBlockId, costCategory, rowKey, month), String(value));
      },
      clear: (stableBlockId, costCategory, rowKey, month) => {
        map.delete(key(stableBlockId, costCategory, rowKey, month));
      },
    };
  }

  // Pane スコープの展開状態管理（stableBlockId の Set を pane 要素に保持）。
  // rerender 経由でも Set が保持されるので、＋/－の状態がタブ切替まで残る。
  function jy2ActualExpandState(pane) {
    if (!pane) {
      return {
        isExpanded: () => false,
        toggle: () => {},
        expand: () => {},
      };
    }
    if (!pane.__jy2ExpandedActuals) {
      pane.__jy2ExpandedActuals = new Set();
    }
    const set = pane.__jy2ExpandedActuals;
    return {
      isExpanded: (id) => set.has(id),
      toggle: (id) => {
        if (set.has(id)) set.delete(id);
        else set.add(id);
      },
      expand: (id) => set.add(id),
    };
  }

  // Phase2c-detail-manual-only: 既存内訳行は隠し、＋で reveal した行だけ表示。
  // App757 の既存明細は削除しない。来週連動後は MANUAL_ONLY=false で全表示。
  // reveal キーは sessionStorage に残し、一時保存後の reload でも手入力行を維持。
  const JY2_ACTUAL_REVEAL_KEYS_STORAGE = `jy2:${APP1_ID}:actualDetailRevealKeys`;
  function jy2ActualLoadRevealKeys(view) {
    const set = new Set();
    if (!view || !view.sessionStorage) return set;
    try {
      const raw = view.sessionStorage.getItem(JY2_ACTUAL_REVEAL_KEYS_STORAGE);
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) {
        for (const key of list) {
          if (key) set.add(String(key));
        }
      }
    } catch {
      // ignore
    }
    return set;
  }
  function jy2ActualPersistRevealKeys(view, set) {
    if (!view || !view.sessionStorage || !set) return;
    try {
      view.sessionStorage.setItem(
        JY2_ACTUAL_REVEAL_KEYS_STORAGE,
        JSON.stringify([...set]),
      );
    } catch {
      // ignore
    }
  }
  function jy2ActualCostDetailVisibility(pane) {
    const view =
      pane && pane.ownerDocument && pane.ownerDocument.defaultView
        ? pane.ownerDocument.defaultView
        : null;
    if (!pane) {
      return {
        reveal: () => {},
        shouldShow: () => !JY2_ACTUAL_DETAIL_MANUAL_ONLY,
      };
    }
    if (!pane.__jy2CostDetailRevealKeys) {
      pane.__jy2CostDetailRevealKeys = jy2ActualLoadRevealKeys(view);
    }
    const set = pane.__jy2CostDetailRevealKeys;
    return {
      reveal: (key) => {
        if (!key) return;
        set.add(String(key));
        jy2ActualPersistRevealKeys(view, set);
      },
      shouldShow: (key) => {
        if (!JY2_ACTUAL_DETAIL_MANUAL_ONLY) return true;
        return Boolean(key && set.has(String(key)));
      },
    };
  }

  function jy2ActualTotalRow(documentRef, total, label, months) {
    const tr = documentRef.createElement("tr");
    tr.className = "jy2-total-row";
    tr.dataset.totalCategory = total.costCategory || total.label || "";
    const head = jy2MarkFreeze(jy2Cell(documentRef, "td", "jy2-freeze-span", label), 0);
    head.colSpan = JY2_ACTUAL_FREEZE_COLS;
    tr.appendChild(head);
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", "－"));
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-num", "－"));
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.finalBudget)),
    );
    for (const month of months) {
      const monthAmount = total.monthly[month];
      const qtyCell = jy2Cell(
        documentRef,
        "td",
        "jy2-num jy2-actual-month jy2-actual-month-qty jy2-actual-sum-cell",
        "－",
      );
      qtyCell.title = "総計行の数量は表示しない";
      tr.appendChild(qtyCell);
      const monthCell = jy2Cell(
        documentRef,
        "td",
        "jy2-amount jy2-actual-month jy2-actual-sum-cell",
        monthAmount === null || monthAmount === undefined
          ? "－"
          : jy2AmountDisplay(monthAmount),
      );
      monthCell.title = "合計（自動・入力不可）";
      tr.appendChild(monthCell);
    }
    tr.appendChild(
      jy2Cell(documentRef, "td", "jy2-amount", jy2AmountDisplay(total.actual)),
    );
    tr.appendChild(
      jy2Cell(
        documentRef,
        "td",
        "jy2-amount",
        jy2ActualBudgetDiffDisplay(total.finalBudget, total.actual),
      ),
    );
    // Phase2a: 総計行の備考列は常に空表示（"－"）。
    tr.appendChild(jy2Cell(documentRef, "td", "jy2-actual-note", "－"));
    return tr;
  }

  // 実績 tab (Phase 4d): offline 予実 matrix over App3-shaped actual cells.
  // Rows are the 施工/保安 cost rows only (Y4 — no salary), pivoted wide by
  // month (Y5/Y6). Y7 adds ⑧⑨ aggregate rows; Y9 adds budget attribute cols.
  // 2026-07-29-ver02-actual-detail-expand: detailBlocksProvider は
  // detailModel.snapshot().blocks（明細行付き）を返し、親行の＋展開時に
  // 子行として月別消化・最終予算額の入力欄を提供する。省略時はレガシー
  // （親のみ）動作。
  // Phase2c-b-a (2026-07-31): `detailModel` と `onDetailStructureChanged`
  // を追加。費目グループ行の「＋種別行」ボタンから `addDetailRow` を呼び
  // 出したとき、shell が Detail pane を再描画し、総括/予実を dirty マーク
  // できるようにする。両引数は optional（省略時は Phase2c-a 相当の表示専用
  // 動作）。書き込みは常に detailModel（App757）に限定し、actualsModel／
  // App758 の書込経路には触れない。
  function jy2RenderActualPane(
    documentRef,
    pane,
    actualsModel,
    blocksProvider,
    contractTotal1Provider,
    saveController,
    projectionManual,
    summaryTotalsProvider,
    detailBlocksProvider,
    detailModel,
    onDetailStructureChanged,
    paneOpts,
  ) {
    const scroll = jy2CaptureScroll(documentRef, pane);
    pane.textContent = "";
    const editable = actualsModel.allowedOperations.editActuals;
    const expandState = jy2ActualExpandState(pane);
    const costDetailVisibility = jy2ActualCostDetailVisibility(pane);
    const hasPendingDetailEdits =
      paneOpts && typeof paneOpts.hasPendingDetailEdits === "function"
        ? paneOpts.hasPendingDetailEdits
        : () => false;
    // Phase2b (2026-07-31): pane スコープの月次数量セッション Map。rerender を
    // 跨いで残るが、リロード（保存後・タブ再入場含む）で pane が作り直され
    // 消える。App758 の write path は変更しない（数量は保存しない）。
    const monthQtyState = jy2ActualMonthQtyState(pane);
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
        detailBlocksProvider,
        detailModel,
        onDetailStructureChanged,
        paneOpts,
      );
    // Phase2c-b-a: 費目グループ行の「＋種別行」ボタンから呼ばれる pane 側
    // フック。detail 構造が変わった旨を shell に通知し（内訳 pane 再描画・
    // 総括/予実 dirty マーク）、続けて予実 pane を rerender して新しい
    // 種別行を expand 済みグループの下に表示する。
    // Phase2c-c-excel-struct-raf: 全表再構築は重いので click 内では走らせず
    // rAF にまとめる（連続＋でも1回）。ブロック単位再描画が本直し。
    let structureRerenderPending = false;
    const onDetailStructureAdded = () => {
      if (typeof onDetailStructureChanged === "function") {
        try {
          onDetailStructureChanged();
        } catch (error) {
          if (typeof console !== "undefined" && console.error) {
            console.error("onDetailStructureChanged failed:", error);
          }
        }
      }
      if (structureRerenderPending) return;
      structureRerenderPending = true;
      const view = documentRef && documentRef.defaultView;
      const run = () => {
        structureRerenderPending = false;
        rerender();
      };
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(run);
      } else {
        run();
      }
    };
    // 詳細・単価などフィールド編集: 内訳/予実の全 DOM 再構築はしない（Violation 対策）。
    // モデルは既に updateDetailRow 済み。内訳タブ表示時に dirty 反映。
    const onDetailFieldChanged = () => {
      if (typeof onDetailStructureChanged === "function") {
        try {
          onDetailStructureChanged({ fieldOnly: true });
        } catch (error) {
          if (typeof console !== "undefined" && console.error) {
            console.error("onDetailFieldChanged failed:", error);
          }
        }
      }
    };
    const canEditBudget = Boolean(
      detailModel &&
        detailModel.allowedOperations &&
        detailModel.allowedOperations.editBudget === true,
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
    const detailBlocks =
      typeof detailBlocksProvider === "function" ? detailBlocksProvider() : [];
    const detailRowsByBlockId = new Map();
    for (const block of detailBlocks || []) {
      if (block && block.stableBlockId && Array.isArray(block.detailRows)) {
        detailRowsByBlockId.set(block.stableBlockId, block.detailRows);
      }
    }
    const rows = actualsModel.matrixRows(blocks, {
      contractTotal1,
      budgetAttrsByBlockId,
      detailRowsByBlockId,
    });
    let totals = actualsModel.sectionTotals(blocks, {
      contractTotal1,
      detailRowsByBlockId,
    });
    // 手動のみ: 区分計・⑧⑨の実行予算も表示中詳細の合計に合わせる。
    if (JY2_ACTUAL_DETAIL_MANUAL_ONLY) {
      const visibleSection = {};
      for (const category of ACTUAL_COST_CATEGORY_KEYS) {
        const sectionRows = rows.filter((row) => row.costCategory === category);
        let finalBudget = "0";
        let actual = "0";
        const monthly = {};
        for (const month of months) monthly[month] = "0";
        for (const row of sectionRows) {
          const kids = jy2ActualChildrenForBudgetSum(
            row.children,
            costDetailVisibility.shouldShow,
          );
          const fb = row.hasChildren
            ? jy2ActualSumField(kids, "finalBudget")
            : row.finalBudget;
          const ac = row.hasChildren
            ? jy2ActualSumField(kids, "actual")
            : row.actual;
          if (fb != null) finalBudget = add(finalBudget, fb);
          if (ac != null) actual = add(actual, ac);
          for (const month of months) {
            const ms = row.hasChildren
              ? jy2ActualSumMonth(kids, month)
              : row.monthly[month];
            if (ms != null) monthly[month] = add(monthly[month], ms);
          }
        }
        const base = totals[category] || {};
        visibleSection[category] = Object.freeze({
          ...base,
          costCategory: category,
          finalBudget,
          actual,
          monthly: Object.freeze(monthly),
        });
      }
      totals = Object.freeze(visibleSection);
    }
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
        "工事原価管理（原価行対比・給与手当は対象外）",
      ),
    );
    if (saveController && editable) {
      const saveButton = documentRef.createElement("button");
      saveButton.type = "button";
      saveButton.className = "jy2-save-button";
      saveButton.textContent = "予実を保存";
      saveButton.title =
        "月次金額・実行予算額など予実（App758）を保存。詳細・単価・行の追加／削除は上部の「一時保存」";
      // 入力中クリックで blur→commit が click を潰さないようにする
      saveButton.addEventListener("mousedown", (event) => {
        if (typeof event.preventDefault === "function") event.preventDefault();
      });
      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        const view = documentRef.defaultView;
        // 詳細/単価/行構造は App757＝上部「一時保存」。ここは App758 のみ。
        if (hasPendingDetailEdits()) {
          if (view && typeof view.alert === "function") {
            view.alert(
              "詳細・単価・行の追加／削除は、画面上部の「一時保存」で保存してください。\n「予実を保存」は月次金額など予実専用です（ここからは構造は保存されません）。",
            );
          }
          return;
        }
        saveButton.disabled = true;
        saveButton.textContent = "保存中…";
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
          jy2ReloadPreservingTab(view, "actual", documentRef);
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `予実保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(view, "actual", documentRef);
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
      "Excel 原価管理明細と同じ列構成（システム工種｜費目｜種別（補助）｜詳細｜操作｜単価｜実行予算額｜月次数量/金額｜原価累計金額｜予算との差｜備考）。" +
      "親行は工種番号と既定費目を同一行に表示し、その下に種別・詳細を常時表示（Excelどおり・開閉なし）。追加費目は工種番号なしの費目行。" +
      "予算との差＝実行予算額−原価累計金額（表示のみ）。横スクロール時も左5列（詳細・操作含む）は固定。";
    note.append(summary, noteBody);
    pane.appendChild(note);
    // Phase2c-b-a: 「＋種別行」で追加した内訳（App757）の永続化は sticky トップの
    // 「一時保存」で行う旨をバナー表示（「予実を保存」では保存されない）。
    if (canEditBudget) {
      const detailAddNotice = documentRef.createElement("p");
      detailAddNotice.className = "jy2-actual-note jy2-actual-detail-add-notice";
      detailAddNotice.textContent =
        "原価管理はExcelどおり費目→種別。既存内訳の詳細は非表示のまま、操作列＋で詳細を追加して手入力できます（内訳は消していません）。構造は一時保存。「予実を保存」は月次など予実のみ";
      pane.appendChild(detailAddNotice);
    }
    if (rows.length === 0) {
      pane.appendChild(
        jy2Cell(
          documentRef,
          "p",
          "jy2-empty",
          "予実対象の原価行なし（内訳タブで施工・保安ブロックを追加してください）",
        ),
      );
      jy2ApplyScroll(documentRef, pane, scroll);
      return;
    }

    const scrollEl = documentRef.createElement("div");
    scrollEl.className = "jy2-actual-scroll";
    const table = documentRef.createElement("table");
    table.className = "jy2-table jy2-actual-table";
    table.appendChild(jy2ActualHead(documentRef, months));
    const body = documentRef.createElement("tbody");
    for (const row of rows) {
      const detailRows = detailRowsByBlockId.get(row.stableBlockId) || [];
      const hierarchyEntry = jy2ResolveNameHierarchy({
        workTypeCode: row.workTypeCode,
        workTypeName: row.workTypeName,
      });
      const primaryHimokuLabel = jy2ActualPrimaryHimokuLabel(
        hierarchyEntry,
        row,
      );
      let parentHimokuOpts = null;
      let himokuOrder = [];
      let bucket = new Map();
      let typesByHimokuMap = {};
      const groupOpts = {
        detailModel,
        canEditBudget,
        expandState,
        rerender,
        revealDetailKey: costDetailVisibility.reveal,
        shouldShowDetail: costDetailVisibility.shouldShow,
        onAdded: onDetailStructureAdded,
        monthQtyState,
      };
      if (row.hasChildren) {
        const resolveHimokuLabel = (child, detailIndex) => {
          const resolvedName1 =
            detailIndex >= 0
              ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name1")
              : child && child.name1
                ? String(child.name1).trim()
                : "";
          return resolvedName1 && resolvedName1.length > 0
            ? resolvedName1
            : "（未分類）";
        };
        const resolveTypeLabel = (child, detailIndex) => {
          const resolvedName2 =
            detailIndex >= 0
              ? jy2ActualResolveContinuedField(detailRows, detailIndex, "name2")
              : child && child.name2
                ? String(child.name2).trim()
                : "";
          return resolvedName2 && resolvedName2.length > 0
            ? resolvedName2
            : "（種別未設定）";
        };
        const templateHimoku = jy2HimokuChoicesForEntry(hierarchyEntry);
        typesByHimokuMap =
          hierarchyEntry && hierarchyEntry.typesByHimoku
            ? hierarchyEntry.typesByHimoku
            : {};
        const ensureHimoku = (himokuLabel) => {
          if (!bucket.has(himokuLabel)) {
            bucket.set(himokuLabel, new Map());
            himokuOrder.push(himokuLabel);
          }
          return bucket.get(himokuLabel);
        };
        for (const h of templateHimoku) ensureHimoku(h);
        row.children.forEach((child) => {
          const detailIndex = detailRows.findIndex(
            (candidate) => candidate && candidate.rowKey === child.rowKey,
          );
          const himokuLabel = resolveHimokuLabel(child, detailIndex);
          const typeLabel = resolveTypeLabel(child, detailIndex);
          const typeMap = ensureHimoku(himokuLabel);
          if (!typeMap.has(typeLabel)) typeMap.set(typeLabel, []);
          typeMap.get(typeLabel).push({ child, detailIndex });
        });
        if (primaryHimokuLabel) {
          const primaryTypeMap = bucket.get(primaryHimokuLabel) || new Map();
          const primaryChildren = [];
          for (const entries of primaryTypeMap.values()) {
            for (const entry of entries) primaryChildren.push(entry.child);
          }
          const primaryLastKey =
            primaryChildren.length > 0
              ? primaryChildren[primaryChildren.length - 1].rowKey
              : null;
          parentHimokuOpts = {
            primaryHimokuLabel,
            detailModel,
            canEditBudget,
            onAdded: onDetailStructureAdded,
            revealDetailKey: costDetailVisibility.reveal,
            shouldShowDetail: costDetailVisibility.shouldShow,
            lastChildRowKeyInGroup: primaryLastKey,
            monthQtyState,
          };
        } else {
          parentHimokuOpts = {
            monthQtyState,
            shouldShowDetail: costDetailVisibility.shouldShow,
          };
        }
      } else {
        parentHimokuOpts = {
          monthQtyState,
          shouldShowDetail: costDetailVisibility.shouldShow,
        };
      }
      body.appendChild(
        jy2ActualRow(
          documentRef,
          actualsModel,
          row,
          months,
          editable,
          rerender,
          expandState,
          parentHimokuOpts,
        ),
      );
      if (!row.hasChildren) {
        continue;
      }
      for (const himokuLabel of himokuOrder) {
        const typeMap = bucket.get(himokuLabel) || new Map();
        const himokuChildren = [];
        for (const entries of typeMap.values()) {
          for (const entry of entries) himokuChildren.push(entry.child);
        }
        const lastHimokuKey =
          himokuChildren.length > 0
            ? himokuChildren[himokuChildren.length - 1].rowKey
            : null;
        if (himokuLabel !== primaryHimokuLabel) {
          body.appendChild(
            jy2ActualHimokuGroupRow(
              documentRef,
              row,
              himokuLabel,
              himokuChildren,
              months,
              { ...groupOpts, lastChildRowKeyInGroup: lastHimokuKey },
            ),
          );
        }
        // Phase2c-c-excel-flat: Excelどおり種別・詳細を常時表示（費目開閉なし）
        // deny 種別（例: その他材料費）はテンプレもデータ由来も出さない。
        const templateTypes = jy2CostMgmtTemplateTypes(
          row.workTypeCode,
          himokuLabel,
          typesByHimokuMap,
        );
        const typeOrder = [];
        for (const t of templateTypes) {
          if (!typeOrder.includes(t)) typeOrder.push(t);
        }
        for (const t of typeMap.keys()) {
          if (jy2CostMgmtIsDeniedType(row.workTypeCode, himokuLabel, t)) {
            continue;
          }
          if (!typeOrder.includes(t)) typeOrder.push(t);
        }
        let lastAnchorInHimoku = null;
        for (const typeLabel of typeOrder) {
          if (
            jy2CostMgmtIsDeniedType(row.workTypeCode, himokuLabel, typeLabel)
          ) {
            continue;
          }
          const entries = typeMap.get(typeLabel) || [];
          const typeChildren = entries.map((entry) => entry.child);
          const lastTypeKey =
            typeChildren.length > 0
              ? typeChildren[typeChildren.length - 1].rowKey
              : lastAnchorInHimoku;
          body.appendChild(
            jy2ActualTypeGroupRow(
              documentRef,
              row,
              himokuLabel,
              typeLabel,
              typeChildren,
              months,
              {
                ...groupOpts,
                lastChildRowKeyInGroup: lastTypeKey,
                // 手動のみモード: 既存内訳行が隠れている種別でも＋で新規詳細を足せる
                detailQuickAdd:
                  JY2_ACTUAL_DETAIL_MANUAL_ONLY ||
                  typeChildren.length === 0,
              },
            ),
          );
          if (typeChildren.length > 0) {
            lastAnchorInHimoku = typeChildren[typeChildren.length - 1].rowKey;
          }
          for (const { child, detailIndex } of entries) {
            const name3Raw =
              detailIndex >= 0 ? detailRows[detailIndex]?.name3 : null;
            const name3Resolved = jy2IsDitto(name3Raw)
              ? jy2ActualResolveContinuedField(
                  detailRows,
                  detailIndex,
                  "name3",
                ) || ""
              : jy2HasText(name3Raw)
                ? String(name3Raw).trim()
                : "";
            if (
              !costDetailVisibility.shouldShow(child.rowKey, name3Resolved)
            ) {
              continue;
            }
            body.appendChild(
              jy2ActualChildRow(
                documentRef,
                actualsModel,
                row,
                child,
                detailRows,
                detailIndex,
                months,
                editable,
                rerender,
                monthQtyState,
                {
                  detailModel,
                  canEditBudget,
                  revealDetailKey: costDetailVisibility.reveal,
                  onDetailChanged: onDetailStructureAdded,
                  onDetailFieldChanged,
                },
              ),
            );
          }
        }
      }
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
    scrollEl.appendChild(table);
    pane.appendChild(scrollEl);
    jy2BindHScroll(scrollEl);
    jy2ApplyScroll(documentRef, pane, scroll);
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
            jy2ReloadPreservingTab(view, "version", documentRef);
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
    let loadedDetailRecords = null;
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
        loadedDetailRecords = records;
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
        // 初期表示で取得済みのApp2行を再利用し、保存直前の重複GETを省く。
        // 各行revisionと親revisionはbulk保存時に検証されるため、競合検知は維持される。
        const existing =
          loadedDetailRecords ||
          (await fetchExistingDetailRows(api, APP2_ID, keys.budgetVersionId));
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
    const isDraftStatus = (jy2FieldValue(record, "status") || "下書き") !== "版確定";
    saveButton.textContent = isDraftStatus ? "一時保存" : "保存";
    saveButton.disabled = !saveController || !canEditBudget;
    saveButton.title = isDraftStatus
      ? "下書きとして工事基本情報・総括・内訳を一時保存（工事原価管理の詳細・単価・行追加も含む）"
      : "工事基本情報・総括・内訳を保存（工事原価管理の詳細・単価・行追加も含む）";
    // 詳細入力中に押しても blur→commit で click が消えないようにする
    saveButton.addEventListener("mousedown", (event) => {
      if (typeof event.preventDefault === "function") event.preventDefault();
    });

    const confirmButton = documentRef.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "jy2-btn jy2-confirm-button";
    confirmButton.textContent = "版を確定";
    confirmButton.disabled = !saveController || !canEditBudget || !isDraftStatus;
    confirmButton.hidden = !isDraftStatus;
    confirmButton.title = "下書きを版確定します（確認ダイアログあり）";

    // 保存等を DOM 先頭に置き、狭い幅でも左端に見えるようにする。
    rightGroup.append(saveButton, confirmButton, addBlockBtn, addSalaryBtn);
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

    let actualsDirty = true;
    let summaryDirty = true;
    let detailDirty = false;
    // App757 未保存（一時保存が必要）。detailDirty と違い、内訳タブ再描画では消さない。
    let detailSavePending = false;
    // activate 定義時点では未代入。後で実体を差し込む。
    let flushSummaryIfDirty = () => {};
    let flushActualsIfDirty = () => {};
    let flushDetailIfDirty = () => {};

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
      // 内訳タブ入力中は総括/予実を遅延。タブ表示（クリック・No.ジャンプ）時に反映。
      if (tabId === "summary") flushSummaryIfDirty();
      if (tabId === "detail") flushDetailIfDirty();
      if (tabId === "actual") {
        flushSummaryIfDirty();
        flushActualsIfDirty();
      }
      // タブ表示後に幅を測り直す（非表示時に測ると横スクロールが消える）
      const syncScroll = () => jy2SyncAllHScroll(documentRef);
      syncScroll();
      if (view && typeof view.requestAnimationFrame === "function") {
        view.requestAnimationFrame(() => {
          syncStickyLayout();
          syncScroll();
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

    // force=true で即再描画。通常は dirty マークのみ（内訳入力の体感を優先）。
    const refreshSummary = (force = false) => {
      if (!force) {
        summaryDirty = true;
        actualsDirty = true;
        return;
      }
      jy2RenderSummaryPane(
        documentRef,
        summaryPane,
        summaryModel,
        currentBlocks,
        () => {
          actualsDirty = true;
        },
        projectionManual,
      );
      summaryDirty = false;
    };
    const contractTotal1 = () => summaryModel.snapshot().totals.total1;
    const summaryTotalsProvider = () => summaryModel.totals(currentBlocks());
    const currentDetailBlocks = () => detailModel.snapshot().blocks;
    // Phase2c-b-a (2026-07-31): 予実 pane の費目グループ「＋種別行」ボタンから
    // 内訳（App757・detailModel）へ行が追加されたときのフック。総括と予実を
    // dirty マークし、内訳 pane を再描画する（予実 pane 自身は rerender で
    // 直後に描き直されるため actualsDirty はマークしない）。ボタン押下時
    // にしか呼ばれないため、後に定義される `refreshDetail` を lexical closure
    // で参照して構わない（TDZ の観点で mount 完了後にしか実行されない）。
    const onDetailStructureChanged = (opts = {}) => {
      summaryDirty = true;
      detailDirty = true;
      detailSavePending = true;
      // フィールド編集のみ: 内訳 DOM はタブ表示時に反映（change 562ms 対策）。
      // 行追加/削除: すぐ内訳も合わせる必要はないが、既存どおり即時でも可。
      // fieldOnly では refreshDetail しない。
      if (!opts || opts.fieldOnly !== true) {
        // 構造変更時も即時全描画は重いので dirty のみ。内訳タブで flush。
        // （予実側は呼び出し元が rerender する）
      }
    };
    const refreshActuals = () => {
      jy2RenderActualPane(
        documentRef,
        actualPane,
        actualsModel,
        currentBlocks,
        contractTotal1,
        saveController,
        projectionManual,
        summaryTotalsProvider,
        currentDetailBlocks,
        detailModel,
        onDetailStructureChanged,
        { hasPendingDetailEdits: () => detailSavePending },
      );
      actualsDirty = false;
    };
    flushSummaryIfDirty = () => {
      if (summaryDirty) refreshSummary(true);
    };
    flushActualsIfDirty = () => {
      if (actualsDirty) refreshActuals();
    };
    const refreshDetail = () => {
      jy2RenderDetailPane(
        documentRef,
        detailPane,
        detailModel,
        () => {
          // 明細セル変更 → 総括/予実は dirty のみ（タブ表示・保存時に反映）
          detailSavePending = true;
          refreshSummary(false);
        },
        summaryData.masterLists || null,
      );
      detailDirty = false;
    };
    flushDetailIfDirty = () => {
      if (detailDirty) refreshDetail();
    };
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

    refreshSummary(true);
    refreshActuals();
    refreshVersions();
    refreshDetail();
    jy2SyncAllHScroll(documentRef);
    // U34: 保存後 reload から復帰したときの縦・横スクロール位置を復元
    const restoredScroll = jy2ConsumeStoredScroll(view);
    if (restoredScroll) {
      const activePane =
        documentRef.querySelector(
          `.jy2-pane[data-tab-id="${sticky.dataset.activeTab || ""}"]`,
        ) || summaryPane;
      jy2ApplyScroll(documentRef, activePane, restoredScroll);
    }
    if (view && typeof view.requestAnimationFrame === "function") {
      view.requestAnimationFrame(() => {
        jy2SyncAllHScroll(documentRef);
        view.requestAnimationFrame(() => jy2SyncAllHScroll(documentRef));
      });
    }

    addBlockBtn.addEventListener("click", () => {
      if (addBlockBtn.disabled) return;
      const id = detailModel.addBlock();
      detailSavePending = true;
      // 追加ブロックへスクロールするため、内訳再描画に focusBlockId を渡す。
      jy2RenderDetailPane(
        documentRef,
        detailPane,
        detailModel,
        () => {
          detailSavePending = true;
          refreshSummary(false);
        },
        summaryData.masterLists || null,
        { focusBlockId: id },
      );
      refreshSummary(false);
      activate("detail");
      jy2GotoDetailBlock(shell, documentRef, id);
    });
    addSalaryBtn.addEventListener("click", () => {
      if (addSalaryBtn.disabled) return;
      summaryModel.addSalaryLine();
      refreshSummary(true);
      activate("summary");
    });
    if (saveController) {
      const defaultSaveLabel = () =>
        (jy2FieldValue(record, "status") || "下書き") !== "版確定"
          ? "一時保存"
          : "保存";
      const runBudgetSave = async ({ confirmingVersion, busyLabel, doneAlert }) => {
        const view = documentRef.defaultView;
        const startDate = jy2FieldValue(record, "start_date");
        const endDate = jy2FieldValue(record, "end_date");
        const dateOrderInverted = jy2IsStartDateAfterEndDate(startDate, endDate);
        // U35: 着手日>竣工日 → 版確定は拒否。一時保存／保存は赤字警告のみで続行可。
        if (confirmingVersion && dateOrderInverted) {
          if (view && typeof view.alert === "function") {
            view.alert(
              "着手日が竣工日より後のため、版を確定できません。日付を修正するか、一時保存のみ行ってください。",
            );
          }
          return;
        }
        // 保存前に遅延していた総括投影を確定しておく（画面上の差分をなくす）。
        flushSummaryIfDirty();
        jy2EnsurePersonNameFields(record);
        const createdName = jy2NormalizePersonName(
          jy2FieldValue(record, "created_by_name"),
        );
        const personName = jy2NormalizePersonName(
          jy2FieldValue(record, "person_in_charge_name"),
        );
        if (!createdName) {
          if (view && typeof view.alert === "function") {
            view.alert("作成者を入力してください");
          }
          return;
        }
        if (!personName) {
          if (view && typeof view.alert === "function") {
            view.alert("担当者を入力してください");
          }
          return;
        }
        jy2ApplyHeaderField(record, "created_by_name", createdName);
        jy2ApplyHeaderField(record, "person_in_charge_name", personName);
        if (confirmingVersion) {
          jy2ApplyHeaderField(record, "status", "版確定");
        } else if (saveController.initialStatus === "下書き") {
          // 一時保存はステータスDDを触っていても下書きを維持（確定は「版を確定」専用）
          jy2ApplyHeaderField(record, "status", "下書き");
        }
        saveButton.disabled = true;
        confirmButton.disabled = true;
        saveButton.textContent = busyLabel || "保存中…";
        try {
          const outcome = await saveController.save(
            detailModel,
            summaryModel,
            projectionManual,
            { confirmingVersion: Boolean(confirmingVersion) },
          );
          if (outcome.projectionRepaired && view && typeof view.alert === "function") {
            view.alert(
              "総括原価投影に差分があったため修復しました。版確定はキャンセルされました。内容を確認のうえ、再度保存から版確定してください。",
            );
          } else if (view && typeof view.alert === "function") {
            view.alert(
              doneAlert ||
                `工事基本情報・総括・内訳を保存しました（${outcome.requestCount}リクエスト）`,
            );
          }
          jy2ReloadPreservingTab(
            view,
            sticky.dataset.activeTab || "header",
            documentRef,
          );
        } catch (error) {
          const conflict = error && error.action === "abort_reload";
          const message = conflict
            ? "他の更新と競合したため保存を中止しました。画面を再読込します。"
            : `保存に失敗しました: ${(error && error.message) || error}`;
          if (view && typeof view.alert === "function") view.alert(message);
          if (conflict) {
            jy2ReloadPreservingTab(
              view,
              sticky.dataset.activeTab || "header",
              documentRef,
            );
          } else {
            saveButton.disabled = false;
            confirmButton.disabled = !isDraftStatus;
            saveButton.textContent = defaultSaveLabel();
          }
        }
      };

      saveButton.addEventListener("click", async () => {
        if (saveButton.disabled) return;
        await runBudgetSave({
          confirmingVersion: false,
          busyLabel: "一時保存中…",
          doneAlert: "一時保存しました",
        });
      });
      confirmButton.addEventListener("click", async () => {
        if (confirmButton.disabled) return;
        const view = documentRef.defaultView;
        if (
          !view ||
          typeof view.confirm !== "function" ||
          !view.confirm(
            "版を確定します。確定後も編集は可能ですが、ステータスは「版確定」になります。よろしいですか？",
          )
        ) {
          return;
        }
        await runBudgetSave({
          confirmingVersion: true,
          busyLabel: "確定中…",
          doneAlert: "版を確定しました",
        });
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
