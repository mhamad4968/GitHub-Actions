(() => {
  'use strict';

  // BUILD: 2026-04-18-v480 (相関ダッシュ: 台帳番号列・ミラー取り残し一括クリア)
  // BUILD: 2026-04-19-v484 (相関ダッシュボード: 既定チェックを「重複あり/紐付けなし」のみに変更・「正常」は任意)
  // BUILD: 2026-04-19-v483 (個人アカウント紐付けモーダル新設・1:2 上限 / 旧「アカウント管理台帳(627) 作成/更新して開く」ボタン廃止)
  // BUILD: 2026-04-18-v482 (関連アプリ横並び小ナビを画面上部に常駐: 668/595/594/627 へのテキストリンク)
  // JBIS-ACC-001
  // PC台帳(594)からアカウント管理台帳(627)を「作成/更新して開く」
  // - mail をキーに 627 を作成/更新
  // - 626 から未使用の採番（logon_name最小）を1件確保し、〇 & mail をセット
  // - 627 に以下を投入
  //   利用者名/所属名/所属グループ/メールアドレス
  //   Windowsアカウント名: jbm0001[tanaka]
  //   WindowsID/Windowsパスワード
  //   ガリバーID/ガリバーパスワード
  //   メールアカウント/メールパスワード
  //   M365ID/ M365パスワード

  const LEDGER_APP_ID = 627;
  const FC_594_MAIL = 'mail';
  const FC_594_NAME = 'user_name';
  const FC_594_DEPT = 'dept_name';
  const FC_594_GROUP = 'group_name';
  const FC_594_PC_NAME = 'PC_name';
  const FC_594_CATEGORY = 'category';
  const FC_594_STATUS = 'status';
  const FC_594_ABOLISHED_FLAG = 'abolished_flag';
  const FC_594_TYPE = 'type';
  const FC_594_SHARED = 'shared_terminal_name';
  const ABOLISHED_LABEL = '廃止';
  /** PC買替完了後、新規レコード詳細で赤バナーを出す（627 の sessionStorage パターンに合わせる） */
  const STORAGE_KEY_594_REPLACE_NOTICE = 'jbis594_replace_notice_v1';
  /** 買替PCアプリ(628)から遷移したとき、買替モーダルのカテゴリ等の初期値 */
  const STORAGE_KEY_628_REPLACE_PREFILL = 'jbis628_replace_prefill_v1';
  /** 買替で旧レコードへ付与するステータス（アプリの選択肢と一致させること） */
  const STATUS_AFTER_REPLACE_OLD = '廃棄';
  /** 新規レコード側の仮ステータス（登録者があとで修正可） */
  const STATUS_FOR_NEW_AFTER_REPLACE = '使用中';

  // PC auto numbering master (App 596)
  const APP_596_MASTER = 596;
  const FC_596_PREFIX = 'number_top';
  const FC_596_IN_USE = 'in_code';

  const POOL_APP_ID = 626;
  const FC_626_USED = 'used_count';
  const USED_MARK = '〇';
  const FC_626_MAIL = 'mail';
  const FC_626_LOGON = 'logon_name';
  const FC_626_LOGON_PW = 'logon_pw';
  const FC_626_GB_PW = 'gb_pw';
  const FC_626_MAIL_PW = 'mail_pw';
  const FC_626_M365_PW = 'M365_pw'; // 626 フィールドコード（半角大文字 M）— JBIS / sync595 / 627 と一致

  const FC_627_MAIL = 'mail';
  const FC_627_NAME = 'user_name';
  const FC_627_DEPT = 'dept_name';
  const FC_627_GROUP = 'group_name';
  const FC_627_AD_LOGON = 'logon_name';
  const FC_627_WINDOWS_NAME = 'windows_name';
  const FC_627_WINDOWS_PW = 'logon_pw';
  const FC_627_GB_ID = 'gb_id';
  const FC_627_GB_PW = 'gb_pw';
  const FC_627_MAIL_ACCT = 'mail_acct';
  const FC_627_MAIL_PW = 'mail_pw';
  const FC_627_M365_ID = 'm365_id';
  const FC_627_M365_PW = 'm365_pw';

  const M365_DOMAIN = 'kensetsutoso01.onmicrosoft.com';

  // Shared account numbering master (App 667)
  const SHARED_NUMBERING_APP = 667;
  const FC_667_WINDOWS_ID = 'windows_id';
  const FC_667_USED = 'used_count';
  const FC_667_USED_MARK = '〇';

  // 594 ↔ 627 cross-link field codes
  const FC_594_LEDGER_RECORD_ID = 'ledger_record_id';
  const FC_627_PC_594_RECORD_ID = 'pc_594_record_id';
  const FC_627_PC_NAME_FIELD = 'PC_name';
  const FC_627_ACCOUNT_TYPE = 'account_type';
  const FC_627_PC_SUBTABLE = 'pc_ledger_links';
  const FC_627_PC_SUB_594 = 'pc_ledger_link_594_id';
  const STORAGE_KEY_594_SHARED_LINK = 'jbis594_shared_link_v1';
  // Restrict heavy custom behavior to known card views only (safe for production).
  const CARD_VIEW_IDS = new Set([13314933, 13314733, 13314927, 13314929, 13314931]);
  // PC↔アカウント相関ダッシュボード（CUSTOMビュー）
  const QUALITY_DASHBOARD_VIEW_ID = 13459660;

  /** カード用カスタムHTML(#pc-card-container)を内包しない既定一覧グリッドだけ抑止（狭幅で2段目が表と重なる対策） */
  const JBIS594_SUPPRESS_SELECTOR_LIST = [
    '.gaia-argoui-app-index-table',
    '.ocean-ui-grid',
    '.goog-grid-table',
    '.recordlist-gaia',
  ];

  const ensure594CardViewLayerCss = () => {
    if (document.getElementById('jbis-594-card-view-layer')) return;
    const st = document.createElement('style');
    st.id = 'jbis-594-card-view-layer';
    st.textContent = `
      body.jbis594-card-view .jbis594-header-menu-elevate {
        position: relative !important;
        z-index: 2147482990 !important;
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
      }
      body.jbis594-card-view #jbis-pc-search-panel.jbis-search-toolbar {
        position: relative;
        z-index: 2147483000;
      }
      body.jbis594-card-view #jbis-pc-search-panel .jbis-panel-stack {
        position: relative;
        z-index: 2147483001;
        isolation: isolate;
      }
      body.jbis594-card-view #jbis-pc-search-panel .jbis-toolbar-actions {
        position: relative;
        z-index: 2147483002;
      }
      body.jbis594-card-view #jbis-pc-search-panel .jbis-toolbar-fields {
        position: relative;
        z-index: 2147483003;
      }
    `;
    document.head.appendChild(st);
  };

  const suppress594DefaultListGrids = () => {
    const card = document.getElementById('pc-card-container');
    JBIS594_SUPPRESS_SELECTOR_LIST.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (card && el.contains(card)) return;
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      });
    });
  };

  const clear594DefaultListGridSuppressions = () => {
    JBIS594_SUPPRESS_SELECTOR_LIST.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.removeProperty('display');
        el.style.removeProperty('pointer-events');
      });
    });
  };

  const ensureGlobalLabelStyle = () => {
    if (document.getElementById('jbis-global-label-style')) return;
    const style = document.createElement('style');
    style.id = 'jbis-global-label-style';
    style.textContent = `
      .control-label-text-gaia,
      .control-label-gaia,
      .subtable-label-gaia,
      .group-label-gaia {
        font-size: 16px !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        letter-spacing: .01em;
      }
    `;
    document.head.appendChild(style);
  };

  const makeButton = (label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.style.marginLeft = '8px';
    btn.style.padding = '4px 10px';
    btn.style.borderRadius = '5px';
    btn.style.border = '1px solid #1d4ed8';
    btn.style.background = 'linear-gradient(180deg,#2563eb,#1d4ed8)';
    btn.style.color = '#fff';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '600';
    btn.style.boxShadow = '0 2px 6px rgba(15,23,42,.12)';
    btn.style.cursor = 'pointer';
    return btn;
  };

  const makeSecondaryButton = (label) => {
    const btn = makeButton(label);
    btn.style.border = '1px solid #c2410c';
    btn.style.background = 'linear-gradient(180deg,#ea580c,#c2410c)';
    return btn;
  };

  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const localPart = (mail) => {
    const at = String(mail).indexOf('@');
    return at > 0 ? String(mail).slice(0, at) : '';
  };
  const deriveM365 = (mail) => {
    const local = localPart(mail);
    return local ? `${local}@${M365_DOMAIN}` : '';
  };
  const yyyymm = (d = new Date()) => {
    const s = d.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" });
    const m = s.match(/^(\d{4})-(\d{2})/);
    return m ? m[1] + m[2] : `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const shouldBeAbolished = (status) => {
    const s = String(status || '').trim();
    return s.includes('廃棄') || s.includes('除却') || s.includes('廃止');
  };

  const ensureListStyles = () => {
    if (document.getElementById('jbis-acc-001-pc-cards-style')) return;
    const style = document.createElement('style');
    style.id = 'jbis-acc-001-pc-cards-style';
    style.textContent = `
      :root{
        --jbisCard-bg: #ffffff;
        --jbisCard-border: rgba(15, 23, 42, .10);
        --jbisCard-shadow: 0 2px 12px rgba(15, 23, 42, .08);
        --jbisCard-shadowHover: 0 10px 26px rgba(15, 23, 42, .16);
        --jbisCard-text: #0f172a;
        --jbisCard-sub: #475569;
        --jbisCard-muted: #64748b;
        --jbisCard-accent: #2563eb;
        --jbisBadge-bg: rgba(37, 99, 235, .10);
        --jbisBadge-border: rgba(37, 99, 235, .25);
        --jbisBadge-text: #1d4ed8;
      }
      /* Kintone list background feels flat without custom CSS; add gentle canvas (card view only) */
      body.jbis594-card-view{
        background:
          radial-gradient(1200px 600px at 8% 0%, rgba(37,99,235,.08), rgba(255,255,255,0) 55%),
          radial-gradient(900px 500px at 95% 5%, rgba(16,185,129,.07), rgba(255,255,255,0) 50%),
          linear-gradient(180deg, rgba(2,6,23,.02), rgba(2,6,23,0) 30%);
      }
      #pc-card-container, #jbis-table-search-cards{
        display:grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap:14px;
        padding:8px 0 12px 0;
        margin-top:0;
      }
      .jbisPcCard{
        border:1px solid var(--jbisCard-border);
        border-radius:14px;
        background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,1));
        box-shadow: var(--jbisCard-shadow);
        padding:13px 13px 11px;
        cursor:pointer;
        transition: transform .10s ease, box-shadow .10s ease, border-color .10s ease;
        position: relative;
        overflow: hidden;
      }
      .jbisPcCard{
        border-top-width: 5px;
        border-top-style: solid;
        border-top-color: rgba(37,99,235,.45);
      }
      .jbisPcCard[data-status-tone="use"]{ border-top-color:#3498db; background: #eef7ff; }
      .jbisPcCard[data-status-tone="keep"]{ border-top-color:#f39c12; background: #fff9e6; }
      .jbisPcCard[data-status-tone="broken"]{ border-top-color:#e74c3c; background: #fff0f0; }
      .jbisPcCard[data-status-tone="dispose"]{ border-top-color:#95a5a6; background: #f2f2f2; }
      .jbisPcCard[data-status-tone="ok"]{ border-top-color:#2ecc71; background: #f0fff4; }
      .jbisPcCard:before{
        content:"";
        position:absolute;
        inset:0;
        background:
          radial-gradient(700px 120px at 0% 0%, rgba(37,99,235,.10), rgba(255,255,255,0) 60%),
          radial-gradient(600px 140px at 100% 0%, rgba(16,185,129,.08), rgba(255,255,255,0) 55%);
        opacity:.85;
        pointer-events:none;
      }
      .jbisPcCard > *{ position: relative; }
      .jbisPcCard:hover{
        transform: translateY(-2px);
        box-shadow: var(--jbisCard-shadowHover);
        border-color: rgba(37,99,235,.35);
      }
      .jbisPcCard__top{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
        margin-bottom:8px;
      }
      .jbisPcCard__title{
        font-size:14px;
        font-weight:700;
        line-height:1.3;
        word-break:break-word;
        color: var(--jbisCard-text);
      }
      .jbisPcCard__sub{
        font-size:12px;
        color: var(--jbisCard-sub);
        margin-top:2px;
        word-break:break-word;
      }
      .jbisPcCard__pcLine{
        display:block;
        margin-top:6px;
        font-size:15px;
        font-weight:800;
        color: var(--jbisCard-text);
        letter-spacing:.2px;
      }
      .jbisPcCard__badge{
        flex:0 0 auto;
        font-size:11px;
        padding:3px 8px;
        border-radius:999px;
        border:1px solid rgba(0,0,0,.06);
        background: rgba(15,23,42,.12);
        color: #0f172a;
        white-space:nowrap;
        font-weight: 600;
      }
      .jbisPcCard[data-status-tone="use"] .jbisPcCard__badge{ background:#2980b9; color:#fff; }
      .jbisPcCard[data-status-tone="keep"] .jbisPcCard__badge{ background:#d35400; color:#fff; }
      .jbisPcCard[data-status-tone="broken"] .jbisPcCard__badge{ background:#c0392b; color:#fff; }
      .jbisPcCard[data-status-tone="dispose"] .jbisPcCard__badge{ background:#7f8c8d; color:#fff; }
      .jbisPcCard[data-status-tone="ok"] .jbisPcCard__badge{ background:#27ae60; color:#fff; }
      .jbisPcCard__grid{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:6px 10px;
        font-size:12px;
      }
      .jbisPcCard__kv{
        display:flex;
        gap:6px;
        min-width:0;
      }
      .jbisPcCard__k{
        color: var(--jbisCard-muted);
        flex:0 0 auto;
      }
      .jbisPcCard__v{
        color: var(--jbisCard-text);
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .jbisPcCard__footer{
        margin-top:10px;
        font-size:11px;
        color: var(--jbisCard-muted);
        display:flex;
        justify-content:space-between;
        gap:8px;
      }
    `;
    document.head.appendChild(style);
  };

  const renderCardsIfNeeded = (event, overrideContainer) => {
    const container = overrideContainer || document.getElementById('pc-card-container');
    if (!container) return;
    // スペーサーは「パネル vs #pc-card-container の幾何」のみ。検索で中身だけ差し替えるたびに
    // invalidate すると push が再計測で小さくなりカードが上にジャンプするのでここでは無効化しない。
    ensureListStyles();
    container.innerHTML = '';

    const openRecord = (id) => {
      const u = new URL(`${location.origin}/k/${kintone.app.getId()}/show`);
      u.searchParams.set('record', String(id));
      location.href = u.toString();
    };

    const records = event.records || [];
    if (!records.length) {
      const empty = document.createElement('div');
      empty.style.color = '#64748b';
      empty.style.padding = '8px 0';
      empty.textContent = '該当するレコードがありません。';
      container.appendChild(empty);
      if (!overrideContainer) {
        schedulePcCardGridSync();
        requestAnimationFrame(() => requestAnimationFrame(syncPcCardGridOffset));
      }
      return;
    }

    const frag = document.createDocumentFragment();
    for (const r of records) {
      const id = r.$id?.value;
      const type = r.type?.value || '';
      const pcName = r.PC_name?.value || '';
      const user = r.user_name?.value || '';
      const dept = r.dept_name?.value || '';
      const group = r.group_name?.value || '';
      const status = r.status?.value || '';
      const shared = r.shared_terminal_name?.value || '';
      const maker = r.manufacturer?.value || '';
      const model = r.model_name?.value || '';
      const dop = r.dop?.value || '';
      const lastInv = r.last_inventory_date?.value || '';
      const place = r.location?.value || '';

      const tone = (() => {
        const v = String(status || '').toLowerCase();
        if (v.includes('利用') || v.includes('使用')) return 'use';
        if (v.includes('保管')) return 'keep';
        if (v.includes('故障') || v.includes('修理')) return 'broken';
        if (v.includes('廃棄') || v.includes('除却')) return 'dispose';
        return 'ok';
      })();

      const card = document.createElement('div');
      card.className = 'jbisPcCard';
      card.dataset.statusTone = tone;
      card.tabIndex = 0;
      card.onclick = () => openRecord(id);
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') openRecord(id);
      };

      const top = document.createElement('div');
      top.className = 'jbisPcCard__top';

      const titleWrap = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'jbisPcCard__title';
      title.textContent = `🏢 ${group || ''}${dept ? ` [${dept}]` : ''}   👤 ${user || '未設定'}${type ? ` (${type})` : ''}`.trim();
      const sub = document.createElement('div');
      sub.className = 'jbisPcCard__sub';
      sub.innerHTML = `<span class="jbisPcCard__pcLine">💻 ${pcName || '(PC名なし)'}${shared ? ` [${shared}]` : ''}</span>`;
      titleWrap.appendChild(title);
      if (sub.textContent) titleWrap.appendChild(sub);

      const badge = document.createElement('div');
      badge.className = 'jbisPcCard__badge';
      badge.textContent = status || '不明';

      top.appendChild(titleWrap);
      top.appendChild(badge);

      const footer = document.createElement('div');
      footer.className = 'jbisPcCard__footer';
      const left = document.createElement('div');
      left.textContent = `🛠 ${maker || ''}${model ? ` [${model}]` : ''}`.trim();
      const right = document.createElement('div');
      right.textContent = `💰 購入: ${dop || '-'}`;
      footer.appendChild(left);
      footer.appendChild(right);

      card.appendChild(top);
      card.appendChild(footer);

      const bottom = document.createElement('div');
      bottom.className = 'jbisPcCard__footer';
      bottom.style.marginTop = '6px';
      bottom.style.paddingTop = '6px';
      bottom.style.borderTop = '1px dashed rgba(15,23,42,.18)';
      const bLeft = document.createElement('div');
      bLeft.textContent = `📅 棚卸: ${lastInv || '-'}`;
      const bRight = document.createElement('div');
      bRight.textContent = `📍 ${place || '-'}`;
      bottom.appendChild(bLeft);
      bottom.appendChild(bRight);
      card.appendChild(bottom);

      frag.appendChild(card);
    }
    container.appendChild(frag);
    if (!overrideContainer) {
      schedulePcCardGridSync();
      requestAnimationFrame(() => requestAnimationFrame(syncPcCardGridOffset));
    }
  };

  /** スペーサー高さをスクロールのたびに再計算すると gr.top が変わり続け、ページが上下にジャンプするためキャッシュする */
  const jbis594SpacerState = { push: -1, panelKey: '' };
  const invalidatePcCardSpacerCache = () => {
    jbis594SpacerState.push = -1;
  };

  /**
   * ヘッダ内の検索パネルとカードのカスタムビューは別枠のため、margin だけではレイアウトが動かないことがある。
   * #pc-card-container の直前に高さ可変スペーサーを挿し、ビューport 上の重なり分を確実に押し下げる。
   */
  const syncPcCardGridOffset = () => {
    if (document.body.classList.contains('jbis594-card-view')) {
      suppress594DefaultListGrids();
    }
    const panel = document.getElementById('jbis-pc-search-panel');
    const grid = document.getElementById('pc-card-container');
    if (!panel || !grid || !grid.parentNode) return;
    grid.style.marginTop = '';
    let spacer = document.getElementById('jbis-pc-card-offset-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'jbis-pc-card-offset-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      spacer.style.cssText = [
        'box-sizing:border-box',
        'width:100%',
        'margin:0',
        'padding:0',
        'border:0',
        'flex-shrink:0',
        'pointer-events:none',
      ].join(';');
      grid.parentNode.insertBefore(spacer, grid);
    }
    const gap = 16;
    const pr = panel.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    let push = Math.ceil(pr.bottom + gap - gr.top);
    if (push < 0) push = 0;

    // kintone は window が動かず内部要素がスクロールする場合があるため scrollY ではなく、
    // 無効化（カード描画・リサイズ・パネル RO）のときだけ再計測して値のちらつきを止める。
    const panelKey = `${Math.round(pr.height)}x${Math.round(pr.width)}`;
    const cacheEmpty = jbis594SpacerState.push < 0;
    const panelResized = jbis594SpacerState.panelKey !== panelKey;
    if (cacheEmpty || panelResized) {
      jbis594SpacerState.push = push;
      jbis594SpacerState.panelKey = panelKey;
    } else {
      push = jbis594SpacerState.push;
    }

    spacer.style.minHeight = `${push}px`;
    spacer.style.height = `${push}px`;
  };

  const schedulePcCardGridSync = () => {
    [0, 100, 500, 1500].forEach((ms) => setTimeout(syncPcCardGridOffset, ms));
  };

  if (!window.__jbis594ListResizeSync) {
    window.__jbis594ListResizeSync = true;
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (document.body.classList.contains('jbis594-card-view')) suppress594DefaultListGrids();
        invalidatePcCardSpacerCache();
        syncPcCardGridOffset();
      }, 120);
    });
  }

  const jbisPad2 = (n) => String(n).padStart(2, '0');
  const jbisFmtYmd = (d) => `${d.getFullYear()}-${jbisPad2(d.getMonth() + 1)}-${jbisPad2(d.getDate())}`;
  const jbisParseYmd = (s) => {
    const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const da = Number(m[3]);
    const d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return d;
  };

  const jbisCloseDatePopover = () => {
    const fn = window.__jbis594DatePopoverCleanup;
    if (typeof fn === 'function') {
      window.__jbis594DatePopoverCleanup = null;
      fn();
    }
  };

  /** ネイティブ date / showPicker が kintone 上で効かない環境向けの月表示カレンダー */
  const jbisOpenYmdPopover = (anchorEl, targetInput) => {
    if (!anchorEl || !targetInput) return;
    jbisCloseDatePopover();

    const pop = document.createElement('div');
    pop.setAttribute('data-jbis-ymd-popover', '1');
    Object.assign(pop.style, {
      position: 'fixed',
      zIndex: '2147483646',
      background: '#fff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      boxShadow: '0 14px 36px rgba(15,23,42,.2)',
      padding: '10px',
      fontSize: '12px',
      color: '#0f172a',
      minWidth: '260px',
      boxSizing: 'border-box',
    });

    const seed = jbisParseYmd(targetInput.value) || new Date();
    let viewYear = seed.getFullYear();
    let viewMonth = seed.getMonth();

    const label = document.createElement('div');
    Object.assign(label.style, {
      fontWeight: '700',
      flex: '1',
      textAlign: 'center',
    });

    const grid = document.createElement('div');
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '3px',
    });

    const btnMini =
      'box-sizing:border-box;border:1px solid #cbd5e1;background:#f8fafc;border-radius:4px;cursor:pointer;width:30px;height:30px;font-size:16px;line-height:1;padding:0;color:#0f172a;';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.setAttribute('aria-label', '前の月');
    prev.textContent = '‹';
    prev.style.cssText = btnMini;
    const next = document.createElement('button');
    next.type = 'button';
    next.setAttribute('aria-label', '次の月');
    next.textContent = '›';
    next.style.cssText = btnMini;

    const tearDown = () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDoc, true);
      document.removeEventListener('keydown', onKey, true);
      if (pop.parentNode) pop.parentNode.removeChild(pop);
      if (window.__jbis594DatePopoverCleanup === tearDown) window.__jbis594DatePopoverCleanup = null;
    };

    const pick = (ymd) => {
      targetInput.value = ymd;
      tearDown();
    };

    const paint = () => {
      label.textContent = `${viewYear}年 ${viewMonth + 1}月`;
      grid.replaceChildren();
      const dow = ['日', '月', '火', '水', '木', '金', '土'];
      dow.forEach((w) => {
        const h = document.createElement('div');
        h.textContent = w;
        Object.assign(h.style, {
          textAlign: 'center',
          fontSize: '10px',
          color: '#64748b',
          padding: '4px 0',
        });
        grid.appendChild(h);
      });
      const firstDow = new Date(viewYear, viewMonth, 1).getDay();
      const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
      const sel = targetInput.value.trim();
      for (let i = 0; i < firstDow; i++) {
        grid.appendChild(document.createElement('div'));
      }
      for (let day = 1; day <= lastDate; day++) {
        const ymd = `${viewYear}-${jbisPad2(viewMonth + 1)}-${jbisPad2(day)}`;
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = String(day);
        b.style.cssText =
          'box-sizing:border-box;border:1px solid #e2e8f0;background:#fff;border-radius:4px;cursor:pointer;height:30px;font-size:12px;padding:0;margin:0;color:#0f172a;';
        if (ymd === sel) {
          b.style.background = '#2563eb';
          b.style.color = '#fff';
          b.style.borderColor = '#1d4ed8';
        }
        b.addEventListener('mouseenter', () => {
          if (ymd !== sel) b.style.background = '#f1f5f9';
        });
        b.addEventListener('mouseleave', () => {
          b.style.background = ymd === sel ? '#2563eb' : '#fff';
          b.style.color = ymd === sel ? '#fff' : '#0f172a';
        });
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          pick(ymd);
        });
        grid.appendChild(b);
      }
    };

    prev.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      paint();
    });
    next.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      paint();
    });

    const head = document.createElement('div');
    Object.assign(head.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
      gap: '6px',
    });
    head.appendChild(prev);
    head.appendChild(label);
    head.appendChild(next);
    pop.appendChild(head);
    pop.appendChild(grid);

    const foot = document.createElement('div');
    Object.assign(foot.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '10px',
      gap: '8px',
    });
    const clr = document.createElement('button');
    clr.type = 'button';
    clr.textContent = 'クリア';
    clr.style.cssText =
      'border:none;background:transparent;color:#64748b;cursor:pointer;font-size:11px;padding:4px 6px;font-weight:600;';
    clr.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      targetInput.value = '';
      tearDown();
    });
    const today = document.createElement('button');
    today.type = 'button';
    today.textContent = '今日';
    today.style.cssText =
      'border:1px solid #94a3b8;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;padding:4px 10px;color:#0f172a;';
    today.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pick(jbisFmtYmd(new Date()));
    });
    foot.appendChild(clr);
    foot.appendChild(today);
    pop.appendChild(foot);

    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      let top = r.bottom + 6;
      let left = r.left;
      const pad = 8;
      const pw = pop.offsetWidth || 260;
      const ph = pop.offsetHeight || 320;
      if (left + pw > window.innerWidth - pad) left = window.innerWidth - pw - pad;
      if (left < pad) left = pad;
      if (top + ph > window.innerHeight - pad) top = Math.max(pad, r.top - ph - 6);
      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
    };

    document.body.appendChild(pop);
    paint();
    place();
    window.addEventListener('resize', place);
    window.__jbis594DatePopoverCleanup = tearDown;

    const onDoc = (e) => {
      if (pop.contains(e.target)) return;
      if (anchorEl === e.target || anchorEl.contains(e.target)) return;
      tearDown();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') tearDown();
    };
    window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc, true);
      document.addEventListener('keydown', onKey, true);
    }, 0);
  };

  const ensureSearchPanel = () => {
    const headerEarly = kintone.app.getHeaderMenuSpaceElement();
    if (document.getElementById('jbis-pc-search-panel')) {
      headerEarly?.classList.add('jbis594-header-menu-elevate');
      return;
    }
    const header = headerEarly;
    if (!header) return;

    const FISCAL_YEAR_START_MONTH = 4; // JP: April
    const fiscalYearRange = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const startYear = m >= FISCAL_YEAR_START_MONTH ? y : y - 1;
      const start = `${startYear}-04-01`;
      const end = `${startYear + 1}-03-31`;
      return { start, end, label: `${startYear}年度` };
    };

    const panel = document.createElement('div');
    panel.id = 'jbis-pc-search-panel';
    panel.className = 'jbis-search-toolbar';
    panel.style.cssText = [
      'box-sizing:border-box',
      'flex:0 0 100%',
      'width:100%',
      'max-width:100%',
      'min-width:0',
      'padding:4px 0 10px 0',
      'margin:2px 0 8px 0',
      'background:transparent',
      'border:none',
      'border-radius:0',
      'box-shadow:none',
      'font-size:12px',
    ].join(';');
    const fy = fiscalYearRange();
    panel.innerHTML =
      '<style>' +
      '  #jbis-pc-search-panel.jbis-search-toolbar{box-sizing:border-box;flex:0 0 100%;width:100%;max-width:100%;min-width:0;background:transparent;border:none;box-shadow:none;}' +
      '  .jbis-panel-stack{display:flex;flex-direction:column;gap:6px;width:100%;padding:0;border-radius:0;}' +
      '  .jbis-toolbar-actions{display:flex;flex-direction:column;align-items:stretch;gap:8px;width:100%;padding:0 0 6px 0;border-bottom:1px solid #e2e8f0;}' +
      '  .jbis-toolbar-actions-toprow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;width:100%;}' +
      '  .jbis-actions-hint--inline{font-size:10px;color:#64748b;flex:0 1 auto;margin-left:4px;line-height:1.2;max-width:260px;}' +
      '  .jbisSearchActions--top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;flex:1 1 200px;}' +
      '  #jbis-pc-search-panel .jbisAct{box-sizing:border-box;-webkit-appearance:none;appearance:none;margin:0;cursor:pointer;font-size:11px;font-weight:600;line-height:1.2;white-space:nowrap;border-radius:4px;}' +
      '  #jbis-pc-search-panel .jbisAct--link{background:transparent;border:none;color:#2563eb;padding:4px 6px;text-decoration:underline;text-underline-offset:2px;}' +
      '  #jbis-pc-search-panel .jbisAct--link:hover{color:#1d4ed8;background:#eff6ff;}' +
      '  #jbis-pc-search-panel .jbisAct--link[aria-pressed="true"]{color:#fff;background:#0284c7;text-decoration:none;border-radius:4px;}' +
      '  #jbis-pc-search-panel .jbisAct--alert{color:#7c2d12;background:#fff7ed;border:1px solid #b45309;text-decoration:none;padding:4px 8px;}' +
      '  #jbis-pc-search-panel .jbisAct--alert:hover{background:#fed7aa;border-color:#9a3412;}' +
      '  #jbis-pc-search-panel .jbisAct--alert[aria-pressed="true"]{color:#fff;background:#b91c1c;border-color:#7f1d1d;}' +
      '  #jbis-pc-search-panel .jbisAct--ghost{background:#fff7ed;border:1.5px solid #b45309;color:#7c2d12;padding:4px 12px;font-weight:700;}' +
      '  #jbis-pc-search-panel .jbisAct--ghost:hover{background:#fed7aa;border-color:#9a3412;}' +
      '  #jbis-pc-search-panel .jbisAct--ghost::before{content:"↺ ";font-weight:900;}' +
      '  #jbis-pc-search-panel .jbisAct--primary{background:#2563eb;border:1px solid #1d4ed8;color:#fff;padding:4px 12px;}' +
      '  #jbis-pc-search-panel .jbisAct--primary:hover{background:#1d4ed8;}' +
      '  .jbis-act-sep{width:1px;height:18px;background:#cbd5e1;margin:0 2px;flex:0 0 auto;}' +
      '  #jbis-q-count{font-weight:700;min-width:4em;color:#0f172a;font-size:11px;line-height:22px;white-space:nowrap;margin-left:auto;padding-left:8px;}' +
      '  .jbis-toolbar-fields{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;width:100%;}' +
      '  .jbis-cell--dep{flex:1 1 220px;min-width:180px;max-width:100%;}' +
      '  #jbis-q-pc{flex:0 1 92px;min-width:76px;width:92px;max-width:120px;}' +
      '  #jbis-q-usr{flex:0 1 128px;min-width:100px;width:128px;max-width:180px;}' +
      '  .jbis-date-range{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px 6px;font-size:11px;color:#334155;flex:0 1 auto;}' +
      '  .jbis-date-field{display:inline-flex;flex-wrap:nowrap;align-items:center;gap:3px;}' +
      '  .jbis-date-text{width:108px;max-width:100%;box-sizing:border-box;min-height:26px;height:26px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:3px;font-size:11px;line-height:1.2;color:#0f172a;}' +
      '  .jbis-date-calbtn{box-sizing:border-box;flex:0 0 auto;margin:0;padding:0 7px;height:26px;border:1px solid #94a3b8;border-radius:3px;background:#f8fafc;cursor:pointer;font-size:10px;font-weight:700;line-height:1;color:#334155;white-space:nowrap;}' +
      '  .jbis-date-calbtn:hover{background:#e2e8f0;}' +
      '  #jbis-q-dep{box-sizing:border-box;padding:3px 7px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;min-width:0;width:100%;height:22px;}' +
      '  #jbis-q-pc,#jbis-q-usr{box-sizing:border-box;padding:3px 7px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;height:22px;}' +
      '  #jbis-q-type{box-sizing:border-box;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;height:22px;flex:0 0 auto;min-width:60px;background:#fff;}' +
      '  .jbisSuggest{position:relative;display:block;width:100%;min-width:0;}' +
      '  .jbisSuggestList{position:absolute;left:0;top:100%;margin-top:4px;z-index:1000;min-width:min(100%,280px);max-width:420px;max-height:160px;overflow:auto;background:#fff;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 10px 22px rgba(15,23,42,.12);display:none;}' +
      '  .jbisSuggestItem{padding:6px 8px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;}' +
      '  .jbisSuggestItem:hover{background:#f1f5f9;}' +
      '</style>' +
      '<div class="jbis-panel-stack">' +
      '  <div class="jbis-toolbar-actions">' +
      '    <div class="jbis-toolbar-actions-toprow">' +
      '      <div class="jbisSearchActions--top">' +
      `        <button type="button" id="jbis-short-unfinished" class="jbisAct jbisAct--link" aria-pressed="false">棚卸未了</button>` +
      `        <button type="button" id="jbis-short-fy-done" class="jbisAct jbisAct--link" aria-pressed="false">本年分棚卸完了</button>` +
      `        <button type="button" id="jbis-short-no-acct" class="jbisAct jbisAct--link" aria-pressed="false">台帳未紐付</button>` +
      `        <button type="button" id="jbis-short-multi-acct" class="jbisAct jbisAct--link jbisAct--alert" aria-pressed="false" title="このPCに627アカウントが2件以上紐付いているもののみを抽出します">📌 アカウント複数</button>` +
      '        <span class="jbis-act-sep" aria-hidden="true"></span>' +
      '        <button type="button" id="jbis-q-btn" class="jbisAct jbisAct--primary">検索</button>' +
      '        <button type="button" id="jbis-q-rst" class="jbisAct jbisAct--ghost">リセット</button>' +
      '        <span class="jbis-actions-hint--inline">所属・グループはカンマ/スペース OR。上段はトグル。</span>' +
      '      </div>' +
      '      <span id="jbis-q-count">読込中...</span>' +
      '    </div>' +
      '    <div class="jbis-toolbar-fields">' +
      '    <span class="jbisSuggest jbis-cell--dep">' +
      '      <input type="text" id="jbis-q-dep" placeholder="所属/所属グループ（複数OK: 本社 tokyo 等）">' +
      '      <div id="jbis-q-dep-suggest" class="jbisSuggestList" role="listbox"></div>' +
      '    </span>' +
      '    <select id="jbis-q-type"><option value="">種別</option><option value="個人">個人</option><option value="共有">共有</option><option value="サーバーNAS">サーバーNAS</option><option value="JR端末">JR端末</option><option value="その他">その他</option></select>' +
      '    <input type="text" id="jbis-q-pc" placeholder="端末名">' +
      '    <input type="text" id="jbis-q-usr" placeholder="利用者(部分一致)">' +
      '    <div class="jbis-date-range"><span>購入</span>' +
      '    <span class="jbis-date-field"><input type="text" class="jbis-date-text" id="jbis-ds" placeholder="YYYY-MM-DD" maxlength="10" inputmode="numeric" autocomplete="off"><button type="button" class="jbis-date-calbtn" data-jbis-date-for="jbis-ds" title="カレンダーを開く" aria-label="購入日（開始）をカレンダーで入力">開く</button></span>' +
      '    <span>～</span>' +
      '    <span class="jbis-date-field"><input type="text" class="jbis-date-text" id="jbis-de" placeholder="YYYY-MM-DD" maxlength="10" inputmode="numeric" autocomplete="off"><button type="button" class="jbis-date-calbtn" data-jbis-date-for="jbis-de" title="カレンダーを開く" aria-label="購入日（終了）をカレンダーで入力">開く</button></span>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    header.classList.add('jbis594-header-menu-elevate');
    header.appendChild(panel);
    let ancestor = header;
    for (let i = 0; i < 4 && ancestor; i++) {
      try {
        const cs = window.getComputedStyle(ancestor);
        if (cs.display === 'flex' && cs.flexWrap === 'nowrap') {
          ancestor.style.flexWrap = 'wrap';
        }
        if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') {
          ancestor.style.setProperty('overflow', 'visible', 'important');
        }
      } catch (_) { /* noop */ }
      ancestor = ancestor.parentElement;
    }

    schedulePcCardGridSync();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => {
        invalidatePcCardSpacerCache();
        requestAnimationFrame(() => requestAnimationFrame(syncPcCardGridOffset));
      }).observe(panel);
    }

    // Suggest candidates (labels). When selected, it inserts `insert`.
    const SUGGEST = [
      { label: '本社', insert: '本社' },
      { label: '支店', insert: '支店' },
      { label: '営業所', insert: '営業所' },
      { label: '東京', insert: 'tokyo' },
      { label: '東北', insert: 'tohoku' },
      { label: '関越', insert: 'kan-etsu' },
      { label: '東海', insert: 'tokai' },
      { label: '湾岸', insert: 'wangan' },
      { label: '鉄鋼', insert: 'tekko' },
      { label: 'リフォーム', insert: 'reform' },
      { label: 'honsya', insert: 'honsya' },
      { label: 'tokyo', insert: 'tokyo' },
      { label: 'tohoku', insert: 'tohoku' },
      { label: 'kan-etsu', insert: 'kan-etsu' },
      { label: 'tokai', insert: 'tokai' },
      { label: 'wangan', insert: 'wangan' },
      { label: 'tekko', insert: 'tekko' },
      { label: 'reform', insert: 'reform' },
    ];

    const depInput = document.getElementById('jbis-q-dep');
    const suggestBox = document.getElementById('jbis-q-dep-suggest');

    const getLastToken = (value) => {
      const m = String(value).match(/(^|[,\s]+)([^,\s]*)$/);
      return m ? (m[2] || '') : '';
    };
    const replaceLastToken = (value, token) => {
      const s = String(value);
      const m = s.match(/^(.*?)([,\s]+)?([^,\s]*)$/);
      if (!m) return token;
      const head = m[1] || '';
      const sep = m[2] || (head ? ' ' : '');
      return `${head}${sep}${token}`.trimStart();
    };
    const closeSuggest = () => { suggestBox.style.display = 'none'; suggestBox.innerHTML = ''; };
    const openSuggest = (items) => {
      suggestBox.innerHTML = '';
      for (const it of items) {
        const div = document.createElement('div');
        div.className = 'jbisSuggestItem';
        div.textContent = it.label;
        div.onclick = () => {
          depInput.value = replaceLastToken(depInput.value, it.insert);
          closeSuggest();
          depInput.focus();
        };
        suggestBox.appendChild(div);
      }
      suggestBox.style.display = items.length ? 'block' : 'none';
    };
    depInput.addEventListener('input', () => {
      const last = getLastToken(depInput.value).toLowerCase();
      if (!last) { closeSuggest(); return; }
      const items = SUGGEST.filter((x) => x.label.toLowerCase().includes(last)).slice(0, 12);
      openSuggest(items);
    });
    depInput.addEventListener('focus', () => {
      const last = getLastToken(depInput.value).toLowerCase();
      if (!last) return;
      const items = SUGGEST.filter((x) => x.label.toLowerCase().includes(last)).slice(0, 12);
      openSuggest(items);
    });
    depInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSuggest();
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) closeSuggest();
    });

    panel.querySelectorAll('.jbis-date-calbtn').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = btn.getAttribute('data-jbis-date-for');
        jbisOpenYmdPopover(btn, id && document.getElementById(id));
      });
    });

    // Shortcut toggles state (stored on panel dataset)
    panel.dataset.shortUnfinished = '0';
    panel.dataset.shortFyDone = '0';
    panel.dataset.fyStart = fy.start;
    panel.dataset.fyEnd = fy.end;
  };

  const getV = (rec, code) => (rec && rec[code] && rec[code].value) ? String(rec[code].value) : '';
  const splitTokens = (s) => {
    return String(s || '')
      .split(/[,\s]+/g)
      .map((t) => t.trim())
      .filter(Boolean);
  };
  const expandDepTokens = (tokens) => {
    // Allow Japanese input to match group code values (tokyo/tohoku/...)
    const map = new Map([
      ['東京', ['tokyo']],
      ['東北', ['tohoku']],
      ['関越', ['kan-etsu']],
      ['東海', ['tokai']],
      ['湾岸', ['wangan']],
      ['鉄鋼', ['tekko']],
      ['リフォーム', ['reform']],
      ['本社', ['honsya']],
      // convenience: one-char hints
      ['東', ['tokyo', 'tohoku', '東京', '東北']],
    ]);
    const out = [];
    for (const t of tokens) {
      out.push(t);
      const extra = map.get(t);
      if (extra) out.push(...extra);
    }
    // unique
    return Array.from(new Set(out));
  };
  // M2: カナ正規化（ひらがな→カタカナ、全角→半角、小文字化）
  // 「とうきょう」「トウキョウ」「ﾄｳｷｮｳ」「TOKYO」を等価に扱う。
  const hiraToKata = (s) => String(s || '').replace(/[\u3041-\u3096]/g, (m) =>
    String.fromCharCode(m.charCodeAt(0) + 0x60)
  );
  const normalizeForSearch = (s) => {
    try {
      return hiraToKata(String(s || '').normalize('NFKC')).toLowerCase();
    } catch (_) {
      return String(s || '').toLowerCase();
    }
  };

  const matchesAnyToken = (haystack, tokens) => {
    if (!tokens.length) return true;
    const h = normalizeForSearch(haystack);
    return tokens.some((t) => h.includes(normalizeForSearch(t)));
  };

  const includesNormalized = (haystack, needle) => {
    const n = normalizeForSearch(needle);
    if (!n) return true;
    return normalizeForSearch(haystack).includes(n);
  };

  const jbis594FetchCache = { key: '', records: null, ts: 0 };

  // M1: 検索条件の永続化（sessionStorage、ビューID別キー）
  const JBIS594_SEARCH_STATE_PREFIX = 'jbis594_search_state_v1:';
  const getSearchStateKey = () => {
    const viewId = (typeof kintone.app.getViewId === 'function') ? kintone.app.getViewId() : '';
    return `${JBIS594_SEARCH_STATE_PREFIX}${viewId || 'default'}`;
  };
  const captureSearchState = () => {
    const panel = document.getElementById('jbis-pc-search-panel');
    return {
      dep: document.getElementById('jbis-q-dep')?.value || '',
      type: document.getElementById('jbis-q-type')?.value || '',
      pc: document.getElementById('jbis-q-pc')?.value || '',
      usr: document.getElementById('jbis-q-usr')?.value || '',
      ds: document.getElementById('jbis-ds')?.value || '',
      de: document.getElementById('jbis-de')?.value || '',
      shortUnfinished: panel?.dataset.shortUnfinished || '0',
      shortFyDone: panel?.dataset.shortFyDone || '0',
      shortNoAcct: panel?.dataset.shortNoAcct || '0',
      shortMultiAcct: panel?.dataset.shortMultiAcct || '0',
    };
  };
  const persistSearchState = () => {
    try {
      const st = captureSearchState();
      sessionStorage.setItem(getSearchStateKey(), JSON.stringify(st));
    } catch (_) { /* noop: private mode 等 */ }
  };
  const loadSearchState = () => {
    try {
      const raw = sessionStorage.getItem(getSearchStateKey());
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  };
  const applySearchStateToUi = (st) => {
    if (!st) return false;
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    setVal('jbis-q-dep', st.dep);
    setVal('jbis-q-type', st.type);
    setVal('jbis-q-pc', st.pc);
    setVal('jbis-q-usr', st.usr);
    setVal('jbis-ds', st.ds);
    setVal('jbis-de', st.de);
    const panel = document.getElementById('jbis-pc-search-panel');
    if (panel) {
      panel.dataset.shortUnfinished = st.shortUnfinished || '0';
      panel.dataset.shortFyDone = st.shortFyDone || '0';
      panel.dataset.shortNoAcct = st.shortNoAcct || '0';
      panel.dataset.shortMultiAcct = st.shortMultiAcct || '0';
    }
    const setPressed = (id, on) => {
      const b = document.getElementById(id);
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    setPressed('jbis-short-unfinished', (st.shortUnfinished === '1'));
    setPressed('jbis-short-fy-done', (st.shortFyDone === '1'));
    setPressed('jbis-short-no-acct', (st.shortNoAcct === '1'));
    setPressed('jbis-short-multi-acct', (st.shortMultiAcct === '1'));
    return Boolean(
      (st.dep && st.dep.trim()) || (st.type && st.type.trim()) ||
      (st.pc && st.pc.trim()) || (st.usr && st.usr.trim()) ||
      (st.ds && st.ds.trim()) || (st.de && st.de.trim()) ||
      st.shortUnfinished === '1' || st.shortFyDone === '1' ||
      st.shortNoAcct === '1' || st.shortMultiAcct === '1'
    );
  };
  const clearSearchState = () => {
    try { sessionStorage.removeItem(getSearchStateKey()); } catch (_) { /* noop */ }
  };

  /**
   * 「アカウント複数」トグル用のデータ取得・集計。
   * 1度取れば 5 分キャッシュ。返すのは「対象とすべき 594 ID の Set」。
   * 判定ロジック (純粋にユーザー要望どおり):
   *   627 から 594ID を逆引きして、同じ 594ID に 2 件以上のアカウント (=627 レコード) が
   *   紐付いていれば対象。`pc_594_record_id` (単独) と `pc_ledger_links.pc_ledger_link_594_id`
   *   の和集合で 594 ID を集め、594 ID 別の **アカウント件数** をカウントして判定する。
   *   (旧 v1 で混ぜていた "ledger_record_id 重複" 判定はユーザー視点では「アカウント1つ」
   *    にしか見えず誤解を招いたため除外)
   */
  const jbis594MultiAcctCache = { ts: 0, ids: null };
  const buildMultiAcct594IdSet = async () => {
    const TTL_MS = 5 * 60 * 1000;
    if (jbis594MultiAcctCache.ids && (Date.now() - jbis594MultiAcctCache.ts) < TTL_MS) {
      return jbis594MultiAcctCache.ids;
    }
    const url = kintone.api.url('/k/v1/records', true);
    const result = new Set();
    const counter = new Map();
    for (let off = 0; off < 50000; off += 500) {
      const res = await kintone.api(url, 'GET', {
        app: LEDGER_APP_ID,
        query: `$id > 0 order by $id asc limit 500 offset ${off}`,
        fields: ['$id', FC_627_PC_594_RECORD_ID, FC_627_PC_SUBTABLE],
      });
      const recs = res?.records ?? [];
      for (const r of recs) {
        const aid = String(r.$id?.value ?? '').trim();
        if (!aid) continue;
        const ids = new Set();
        const single = String(r[FC_627_PC_594_RECORD_ID]?.value ?? '').trim();
        if (single) ids.add(single);
        const rows = r[FC_627_PC_SUBTABLE]?.value ?? [];
        for (const row of rows) {
          const v = String(row?.value?.[FC_627_PC_SUB_594]?.value ?? '').trim();
          if (v) ids.add(v);
        }
        for (const pid of ids) {
          counter.set(pid, (counter.get(pid) || 0) + 1);
        }
      }
      if (recs.length < 500) break;
    }
    counter.forEach((cnt, pid) => { if (cnt >= 2) result.add(pid); });
    jbis594MultiAcctCache.ids = result;
    jbis594MultiAcctCache.ts = Date.now();
    return result;
  };

  const fetchAllForCurrentView = async () => {
    const app = kintone.app.getId();
    const qCond = kintone.app.getQueryCondition() || '';
    const qFull = kintone.app.getQuery() || '';

    const viewId = (typeof kintone.app.getViewId === 'function') ? kintone.app.getViewId() : '';
    const cacheKey = `${qCond}|${viewId}`;
    if (jbis594FetchCache.key === cacheKey && jbis594FetchCache.records && (Date.now() - jbis594FetchCache.ts) < 60000) {
      return jbis594FetchCache.records;
    }

    const sort = qFull.includes('order by')
      ? ` ${qFull.substring(qFull.indexOf('order by')).split(/limit|offset/i)[0]}`
      : '';

    const all = [];
    for (let off = 0; off < 50000; off += 500) {
      const query = `${qCond}${sort} limit 500 offset ${off}`.trim();
      const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', { app, query });
      all.push(...(res.records || []));
      if (!res.records || res.records.length < 500) break;
    }

    jbis594FetchCache.key = cacheKey;
    jbis594FetchCache.records = all;
    jbis594FetchCache.ts = Date.now();
    return all;
  };

  const getOneRecord = async (app, query, fields) => {
    const params = { app, query, fields };
    const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', params);
    return res.records && res.records.length ? res.records[0] : null;
  };

  const claimPcNumberFrom596 = async () => {
    // Oldest unused record first
    const rec = await getOneRecord(
      APP_596_MASTER,
      `${FC_596_IN_USE} not in ("${USED_MARK}") order by $id asc limit 1`,
      ['$id', '$revision', FC_596_PREFIX, FC_596_IN_USE]
    );
    if (!rec) return null;

    const prefix = (rec[FC_596_PREFIX]?.value || '').trim();
    if (!prefix) throw new Error('596マスタに採番プレフィックス(number_top)がありません。');

    // Optimistic lock to avoid duplicate claim in concurrent create.
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: APP_596_MASTER,
      id: rec.$id.value,
      revision: rec.$revision.value,
      record: {
        [FC_596_IN_USE]: { value: USED_MARK },
      },
    });

    return `${prefix}-${yyyymm()}`;
  };

  const peek596HasUnused = async () => {
    const rec = await getOneRecord(
      APP_596_MASTER,
      `${FC_596_IN_USE} not in ("${USED_MARK}") order by $id asc limit 1`,
      ['$id', FC_596_PREFIX, FC_596_IN_USE]
    );
    return !!rec && !!(rec[FC_596_PREFIX]?.value || '').trim();
  };

  /**
   * 買替フロー用: 596 を占有し PC_name 用文字列を返す。POST 失敗時のみ rollback596 を呼ぶ。
   * @returns {Promise<{ newPcName: string, rollback596: () => Promise<void> } | null>}
   */
  const claimPcNumberFrom596ForReplacementApi = async () => {
    const rec = await getOneRecord(
      APP_596_MASTER,
      `${FC_596_IN_USE} not in ("${USED_MARK}") order by $id asc limit 1`,
      ['$id', '$revision', FC_596_PREFIX, FC_596_IN_USE]
    );
    if (!rec) return null;

    const prefix = (rec[FC_596_PREFIX]?.value || '').trim();
    if (!prefix) throw new Error('596マスタに採番プレフィックス(number_top)がありません。');

    const putRes = await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: APP_596_MASTER,
      id: rec.$id.value,
      revision: rec.$revision.value,
      record: {
        [FC_596_IN_USE]: { value: USED_MARK },
      },
    });

    const id596 = rec.$id.value;
    const revAfter = putRes.revision;
    const newPcName = `${prefix}-${yyyymm()}`;

    const rollback596 = async () => {
      try {
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: APP_596_MASTER,
          id: id596,
          revision: revAfter,
          record: {
            [FC_596_IN_USE]: { value: '' },
          },
        });
      } catch (e) {
        console.error('[JBIS-ACC-001] 596 rollback failed (replacement)', e);
      }
    };

    return { newPcName, rollback596 };
  };

  const get594RecordPayloadById = async (recordId) => {
    const res = await kintone.api(kintone.api.url('/k/v1/record.json', true), 'GET', {
      app: kintone.app.getId(),
      id: recordId,
    });
    return { record: res.record || {}, revision: res.revision != null ? String(res.revision) : '' };
  };

  const emptyValueForFieldType = (t) => {
    if (t === 'CHECK_BOX' || t === 'MULTI_SELECT') return [];
    if (t === 'USER_SELECT' || t === 'ORGANIZATION_SELECT' || t === 'GROUP_SELECT') return [];
    if (t === 'SUBTABLE') return [];
    if (t === 'NUMBER') return '';
    return '';
  };

  const SKIP_CLONE_FIELD_TYPES = new Set(['CALC', 'FILE']);

  /** 買替: 現行レコードをベースに API 登録用レコードを組み立て（資産系はクリア）。 */
  const build594ReplacementPostRecord = (srcRecord, { category, sharedName, typeVal, pcName }) => {
    const assetFieldsToClear = [
      'dop',
      'manufacturer',
      'model_name',
      'location',
      'last_inventory_date',
      'inventory_finish_date',
      'note',
      'remarks',
    ];
    const out = {};
    for (const [code, cell] of Object.entries(srcRecord || {})) {
      if (!cell || typeof cell !== 'object') continue;
      if (code.startsWith('$')) continue;
      if (SKIP_CLONE_FIELD_TYPES.has(cell.type)) continue;
      if (cell.type === 'SUBTABLE') {
        out[code] = { type: 'SUBTABLE', value: [] };
        continue;
      }
      out[code] = JSON.parse(JSON.stringify(cell));
    }

    for (const code of assetFieldsToClear) {
      if (!out[code]) continue;
      out[code].value = emptyValueForFieldType(out[code].type);
    }

    const ensureField = (code, fallbackType, value) => {
      if (out[code]) {
        out[code].value = value;
      } else {
        out[code] = { type: fallbackType, value };
      }
    };

    ensureField(FC_594_CATEGORY, 'DROP_DOWN', category);
    ensureField(FC_594_SHARED, 'SINGLE_LINE_TEXT', sharedName);
    ensureField(FC_594_TYPE, 'DROP_DOWN', typeVal);
    ensureField(FC_594_PC_NAME, 'SINGLE_LINE_TEXT', pcName);

    if (out[FC_594_ABOLISHED_FLAG]) {
      out[FC_594_ABOLISHED_FLAG].value = [];
    }
    if (out[FC_594_STATUS]) {
      out[FC_594_STATUS].value = STATUS_FOR_NEW_AFTER_REPLACE;
    }

    return out;
  };

  const show594ReplacementFollowupBanner = () => {
    const msg =
      '【PC買替の続き】購入日・価格・購入先・記事（note）・メーカー・モデル・製造番号・シリアル等の残り項目は、登録者が必ず入力してください。';
    const inject = () => {
      if (document.getElementById('jbis594-replace-banner')) return true;
      const host =
        (kintone.app &&
          kintone.app.record &&
          kintone.app.record.getHeaderMenuSpaceElement &&
          kintone.app.record.getHeaderMenuSpaceElement()) ||
        document.querySelector('.gaia-argoui-app-toolbar') ||
        document.body;
      if (!host) return false;
      const el = document.createElement('div');
      el.id = 'jbis594-replace-banner';
      el.setAttribute('role', 'alert');
      el.setAttribute('tabindex', '0');
      el.style.cssText =
        'margin:8px 12px;padding:14px 18px;background:#fee2e2;border:2px solid #b91c1c;border-radius:6px;color:#991b1b;font-size:14px;font-weight:bold;line-height:1.55;box-shadow:0 2px 6px rgba(0,0,0,.12);position:relative;z-index:99999;';
      el.textContent = msg;
      host.insertBefore(el, host.firstChild);
      return true;
    };
    if (!inject()) {
      setTimeout(inject, 200);
      setTimeout(inject, 600);
      setTimeout(inject, 1500);
    }
    setTimeout(() => {
      try {
        window.alert(msg);
      } catch (_a) {
        /* noop */
      }
    }, 400);
  };

  const maybeShow594ReplacementNoticeFromStorage = () => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY_594_REPLACE_NOTICE) === '1') {
        sessionStorage.removeItem(STORAGE_KEY_594_REPLACE_NOTICE);
        show594ReplacementFollowupBanner();
      }
    } catch (_e) {
      /* noop */
    }
  };

  const ensureReplacementModalSkeleton = () => {
    let overlay = document.getElementById('jbis594-replace-modal-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'jbis594-replace-modal-overlay';
    overlay.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2147483640;background:rgba(15,23,42,.45);align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    overlay.innerHTML =
      '<div id="jbis594-replace-modal" style="max-width:420px;width:100%;background:#fff;border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.25);padding:20px 22px;font-family:inherit;">' +
      '<p style="margin:0 0 16px;font-size:14px;font-weight:800;line-height:1.5;color:#0f172a;">PC買替対応をします。必要な情報を入力して登録してください。</p>' +
      '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">カテゴリ</label>' +
      '<select id="jbis594-rp-category" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;margin-bottom:12px;font-size:13px;"></select>' +
      '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">共有端末名（shared_terminal_name）</label>' +
      '<input id="jbis594-rp-shared" type="text" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;margin-bottom:12px;font-size:13px;" placeholder="空でも可">' +
      '<label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">種別（type）</label>' +
      '<input id="jbis594-rp-type" type="text" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;margin-bottom:16px;font-size:13px;" placeholder="例: 個人">' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
      '<button type="button" id="jbis594-rp-cancel" style="padding:8px 14px;border-radius:6px;border:1px solid #94a3b8;background:#f8fafc;color:#0f172a;font-weight:600;cursor:pointer;font-size:12px;">キャンセル</button>' +
      '<button type="button" id="jbis594-rp-ok" style="padding:8px 14px;border-radius:6px;border:1px solid #15803d;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;font-weight:700;cursor:pointer;font-size:12px;">登録</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) {
        overlay.style.display = 'none';
      }
    });
    return overlay;
  };

  const open594ReplacementModal = (prefill, onCommit) => {
    const overlay = ensureReplacementModalSkeleton();
    const sel = overlay.querySelector('#jbis594-rp-category');
    const sharedEl = overlay.querySelector('#jbis594-rp-shared');
    const typeEl = overlay.querySelector('#jbis594-rp-type');
    const cancelBtn = overlay.querySelector('#jbis594-rp-cancel');
    const okBtn = overlay.querySelector('#jbis594-rp-ok');

    sel.innerHTML = '';
    ['ノートPC', 'デスクトップPC'].forEach((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    const pCat = (prefill.category || '').trim();
    if (pCat === 'ノートPC' || pCat === 'デスクトップPC') sel.value = pCat;
    else sel.value = 'ノートPC';

    sharedEl.value = prefill.sharedName || '';
    typeEl.value = prefill.typeVal || '';

    const close = () => {
      overlay.style.display = 'none';
      okBtn.disabled = false;
    };

    cancelBtn.onclick = close;

    okBtn.onclick = () => {
      const category = sel.value;
      const sharedName = (sharedEl.value || '').trim();
      const typeVal = (typeEl.value || '').trim();
      if (!typeVal) {
        alert('種別（type）を入力してください。');
        return;
      }
      close();
      void onCommit({ category, sharedName, typeVal });
    };

    overlay.style.display = 'flex';
    typeEl.focus();
  };

  const ensureLedger = async ({ mail, name, dept, group }) => {
    const existing = await getOneRecord(LEDGER_APP_ID, `${FC_627_MAIL} = "${esc(mail)}" limit 1`, ['$id']);
    if (existing) return { id: existing.$id.value, created: false };

    const record = {};
    record[FC_627_MAIL] = { value: mail };
    record[FC_627_NAME] = { value: name || '' };
    record[FC_627_DEPT] = { value: dept || '' };
    record[FC_627_GROUP] = { value: group || '' };

    const created = await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', { app: LEDGER_APP_ID, record });
    return { id: created.id, created: true };
  };

  const findPoolByMail = async (mail) => {
    return await getOneRecord(
      POOL_APP_ID,
      `${FC_626_MAIL} = "${esc(mail)}" limit 1`,
      ['$id', '$revision', FC_626_LOGON, FC_626_LOGON_PW, FC_626_GB_PW, FC_626_MAIL_PW, FC_626_M365_PW]
    );
  };

  const findUnusedPool = async () => {
    // consume smallest logon_name first (jbm0001 -> ...)
    const q = `${FC_626_USED} not in ("${USED_MARK}") and ${FC_626_MAIL} = "" and ${FC_626_LOGON} != "" order by ${FC_626_LOGON} asc limit 1`;
    return await getOneRecord(
      POOL_APP_ID,
      q,
      ['$id', '$revision', FC_626_LOGON, FC_626_LOGON_PW, FC_626_GB_PW, FC_626_MAIL_PW, FC_626_M365_PW]
    );
  };

  const claimPool = async ({ poolRec, mail }) => {
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: POOL_APP_ID,
      id: poolRec.$id.value,
      revision: poolRec.$revision.value,
      record: {
        [FC_626_MAIL]: { value: mail },
        [FC_626_USED]: { value: USED_MARK },
      },
    });
  };

  const ensureClaimedPool = async (mail) => {
    const already = await findPoolByMail(mail);
    if (already) return already;
    for (let i = 0; i < 8; i++) {
      const unused = await findUnusedPool();
      if (!unused) return null;
      try {
        await claimPool({ poolRec: unused, mail });
        return unused;
      } catch (_e) {
        // revision conflict etc. retry
      }
    }
    return null;
  };

  const patchLedger = async (ledgerId, patch) => {
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', { app: LEDGER_APP_ID, id: ledgerId, record: patch });
  };

  const openLedgerRecord = (ledgerId) => {
    const u = new URL(`${location.origin}/k/${LEDGER_APP_ID}/show`);
    u.searchParams.set('record', String(ledgerId));
    window.open(u.toString(), '_blank', 'noopener,noreferrer');
  };

  /**
   * 627 レコードから「この PC（594 の $id）」への参照だけを外す PATCH を組む。
   * PC名・メール等の他フィールドには触れない（安全のため最小変更）。
   * @param {Record<string, unknown>} rec627
   * @param {string} pc594Str
   * @returns {Record<string, { value: unknown }>}
   */
  const build627UnlinkPatchForPc594 = (rec627, pc594Str) => {
    const patch = /** @type {Record<string, { value: unknown }>} */ ({});
    const pid = String(pc594Str || '').trim();
    if (!pid) return patch;
    const single = String(rec627[FC_627_PC_594_RECORD_ID]?.value ?? '').trim();
    if (single === pid) {
      patch[FC_627_PC_594_RECORD_ID] = { value: null };
    }
    const currentSub = Array.isArray(rec627[FC_627_PC_SUBTABLE]?.value)
      ? rec627[FC_627_PC_SUBTABLE].value
      : [];
    const kept = currentSub.filter(
      (row) => String(row?.value?.[FC_627_PC_SUB_594]?.value ?? '').trim() !== pid,
    );
    if (kept.length !== currentSub.length) {
      patch[FC_627_PC_SUBTABLE] = { value: kept.map((row) => ({ id: row.id, value: row.value })) };
    }
    return patch;
  };

  /**
   * 627（候補IDすべて）からこの PC への参照を外し、続けて 594 の ledger_record_id を空にする。
   * 627 のレコード削除は行わない。627 の PUT が 1 件でも失敗した場合は 594 を変更しない。
   * @param {string} pc594Str
   * @param {string[]} ledgerIdCandidates 627 の $id（重複可・空可）
   */
  const unlinkPc594FromLedgerRecords = async (pc594Str, ledgerIdCandidates) => {
    const pid = String(pc594Str || '').trim();
    if (!pid || !/^\d+$/.test(pid)) {
      return { ok: false, message: 'PC台帳のレコード番号が不正です。', touched627: 0 };
    }
    const ids = [
      ...new Set(
        (ledgerIdCandidates || [])
          .map((x) => String(x || '').trim())
          .filter((x) => /^\d+$/.test(x)),
      ),
    ];
    let touched627 = 0;
    const errors = /** @type {string[]} */ ([]);
    for (const lid of ids) {
      try {
        const res627 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
          app: LEDGER_APP_ID,
          id: lid,
        });
        const rec627 = res627.record || {};
        const patch = build627UnlinkPatchForPc594(rec627, pid);
        if (Object.keys(patch).length === 0) continue;
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: LEDGER_APP_ID,
          id: lid,
          revision: rec627.$revision?.value,
          record: patch,
        });
        touched627++;
      } catch (e) {
        errors.push(`627 #${lid}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (errors.length) {
      return { ok: false, message: errors.join('\n'), touched627 };
    }

    try {
      const app594 = kintone.app.getId();
      const r594 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', { app: app594, id: pid });
      const rec594 = r594.record || {};
      const curLed = String(rec594[FC_594_LEDGER_RECORD_ID]?.value ?? '').trim();
      if (curLed) {
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: app594,
          id: pid,
          revision: rec594.$revision?.value,
          record: { [FC_594_LEDGER_RECORD_ID]: { value: null } },
        });
      }
    } catch (e) {
      return {
        ok: false,
        message:
          `627 側は ${touched627} 件更新しましたが、594 のアカウント台帳番号のクリアに失敗しました: ` +
          (e instanceof Error ? e.message : String(e)),
        touched627,
      };
    }
    return { ok: true, message: '', touched627 };
  };

  /**
   * 594の1レコード（API形式）に合わせて627を更新。紐付けキーは mail（1人1台帳）。
   * 626と紐付いていない既存627は、氏名・所属・M365等のみ反映（パスワード系は据え置き）。
   */
  const sync627From594ApiRecord = async (rec594) => {
    const mail = (rec594[FC_594_MAIL]?.value || '').trim();
    if (!mail) {
      return { ok: false, message: 'メールアドレス（mail）が未入力のため、台帳を作成できません。' };
    }
    const name = (rec594[FC_594_NAME]?.value || '').trim();
    const dept = (rec594[FC_594_DEPT]?.value || '').trim();
    const group = (rec594[FC_594_GROUP]?.value || '').trim();

    const ledger = await ensureLedger({ mail, name, dept, group });
    let pool = null;
    if (ledger.created) {
      pool = await ensureClaimedPool(mail);
      if (!pool) {
        return { ok: false, message: '採番プール(626)に未使用がありません。' };
      }
    } else {
      pool = await findPoolByMail(mail);
    }

    const patch = {};
    patch[FC_627_MAIL] = { value: mail };
    patch[FC_627_NAME] = { value: name || '' };
    patch[FC_627_DEPT] = { value: dept || '' };
    patch[FC_627_GROUP] = { value: group || '' };

    const m365 = deriveM365(mail);
    if (m365) patch[FC_627_M365_ID] = { value: m365 };

    let notice = '';
    if (pool) {
      const adLogon = (pool[FC_626_LOGON]?.value || '').trim();
      const local = localPart(mail);
      if (adLogon) patch[FC_627_AD_LOGON] = { value: adLogon };
      if (adLogon && local) patch[FC_627_WINDOWS_NAME] = { value: `${adLogon}[${local}]` };
      if (local) {
        patch[FC_627_GB_ID] = { value: local };
        patch[FC_627_MAIL_ACCT] = { value: local };
      }
      const winPw = (pool[FC_626_LOGON_PW]?.value || '').trim();
      const gbPw = (pool[FC_626_GB_PW]?.value || '').trim();
      const mailPw = (pool[FC_626_MAIL_PW]?.value || '').trim();
      const m365Pw = (pool[FC_626_M365_PW]?.value || '').trim();
      if (winPw) patch[FC_627_WINDOWS_PW] = { value: winPw };
      if (gbPw) patch[FC_627_GB_PW] = { value: gbPw };
      if (mailPw) patch[FC_627_MAIL_PW] = { value: mailPw };
      if (m365Pw) patch[FC_627_M365_PW] = { value: m365Pw };
    } else {
      notice =
        'すでにアカウントはあります。\n' +
        'ただし採番（626）との紐付けが見つかりません。氏名・所属・M365等のみ627へ反映しました。必要に応じて台帳を確認してください。';
    }

    await patchLedger(ledger.id, patch);
    return { ok: true, ledgerId: ledger.id, created: ledger.created, notice: notice || undefined };
  };

  // Card views (custom view HTML renders #pc-card-container)
  kintone.events.on('app.record.index.show', (event) => {
    try {
      ensureGlobalLabelStyle();
      // PC↔アカウント相関ダッシュボード（独立CUSTOMビュー）。検索パネル等は出さず専用画面を描画。
      if (Number(event.viewId) === QUALITY_DASHBOARD_VIEW_ID) {
        document.body.classList.remove('jbis594-card-view');
        renderQualityDashboard().catch((err) => {
          console.error('[JBIS-594] dashboard render failed', err);
          const root = document.getElementById('jbis-quality-dashboard');
          if (root) root.innerHTML = `<div style="color:#b91c1c;padding:16px;">ダッシュボードの読込に失敗しました: ${String(err?.message || err)}</div>`;
        });
        return event;
      }
      const isCardView = CARD_VIEW_IDS.has(Number(event.viewId));
      if (!isCardView) {
        document.body.classList.remove('jbis594-card-view');
        clear594DefaultListGridSuppressions();
        invalidatePcCardSpacerCache();
        const moPack = window.__jbis594GridMo;
        if (moPack?.obs) {
          moPack.obs.disconnect();
          moPack.obs = null;
        }
        if (moPack?.timer) {
          clearTimeout(moPack.timer);
          moPack.timer = null;
        }

        ensureSearchPanel();

        const spEl = document.getElementById('jbis-pc-search-panel');
        const headerMenu = kintone.app.getHeaderMenuSpaceElement();

        const TABLE_WRAPPER_ID = 'jbis-594-table-search-wrapper';
        let wrapper = document.getElementById(TABLE_WRAPPER_ID);
        if (wrapper) wrapper.style.display = '';
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.id = TABLE_WRAPPER_ID;
          wrapper.style.cssText = 'position:relative;z-index:50;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:0 8px 4px;';
          const anchor = document.querySelector('.contents-gaia') || document.querySelector('.gaia-argoui-app-index-toolbar') || headerMenu?.parentNode;
          if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(wrapper, anchor);
          } else {
            document.body.prepend(wrapper);
          }
        }
        if (spEl && spEl.parentNode !== wrapper) {
          wrapper.appendChild(spEl);
        }

        const JBIS_TABLE_CONTAINER_ID = 'jbis-table-search-cards';
        let tableSearchContainer = document.getElementById(JBIS_TABLE_CONTAINER_ID);
        if (!tableSearchContainer) {
          tableSearchContainer = document.createElement('div');
          tableSearchContainer.id = JBIS_TABLE_CONTAINER_ID;
          tableSearchContainer.style.display = 'none';
          if (wrapper.parentNode) {
            wrapper.parentNode.insertBefore(tableSearchContainer, wrapper.nextSibling);
          } else {
            document.body.appendChild(tableSearchContainer);
          }
        }
        tableSearchContainer.style.display = 'none';
        tableSearchContainer.innerHTML = '';

        const JBIS594_TABLE_SELECTORS = [
          '.gaia-argoui-app-index-table',
          '.ocean-ui-grid',
          '.recordlist-gaia',
          '.contents-recordlist-gaia',
          '.gaia-argoui-app-index-pager',
          '.recordlist-header-cell-gaia',
        ];
        const showDefaultTable = () => {
          JBIS594_TABLE_SELECTORS.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
              el.style.removeProperty('display');
            });
          });
          // カード描画コンテナを必ず空＆非表示に。残骸でテーブルとカードが二重に出る事故を防ぐ。
          tableSearchContainer.style.display = 'none';
          tableSearchContainer.innerHTML = '';
        };
        const hideDefaultTable = () => {
          JBIS594_TABLE_SELECTORS.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
              el.style.setProperty('display', 'none', 'important');
            });
          });
          tableSearchContainer.style.display = '';
        };

        showDefaultTable();

        const countEl = document.getElementById('jbis-q-count');
        if (countEl) countEl.textContent = '読込中...';

        fetchAllForCurrentView().then((allRecs) => {
          if (countEl) countEl.textContent = `${allRecs.length}件`;

          const doTableSearch = () => {
            const panel = document.getElementById('jbis-pc-search-panel');
            const depTokens = expandDepTokens(splitTokens(document.getElementById('jbis-q-dep')?.value || ''));
            const vPc = document.getElementById('jbis-q-pc')?.value || '';
            const vUsr = document.getElementById('jbis-q-usr')?.value || '';
            const vType = document.getElementById('jbis-q-type')?.value || '';
            const ds = document.getElementById('jbis-ds')?.value || '';
            const de = document.getElementById('jbis-de')?.value || '';
            const shortUnfinished = panel?.dataset.shortUnfinished === '1';
            const shortFyDone = panel?.dataset.shortFyDone === '1';
            const shortNoAcct = panel?.dataset.shortNoAcct === '1';
            const shortMultiAcct = panel?.dataset.shortMultiAcct === '1';
            const fyStart = panel?.dataset.fyStart || '';
            const fyEnd = panel?.dataset.fyEnd || '';
            const multiAcctSet = (shortMultiAcct && jbis594MultiAcctCache.ids) || null;

            const hasFilter = depTokens.length > 0 || vPc || vUsr || vType || ds || de || shortUnfinished || shortFyDone || shortNoAcct || shortMultiAcct;
            const filtered = allRecs.filter((r) => {
              const depHay = `${getV(r, 'dept_name')} ${getV(r, 'group_name')}`;
              const mDep = matchesAnyToken(depHay, depTokens);
              const mPc = !vPc || includesNormalized(`${getV(r, 'PC_name')} ${getV(r, 'shared_terminal_name')}`, vPc);
              const mUsr = !vUsr || includesNormalized(getV(r, 'user_name'), vUsr);
              const mType = !vType || getV(r, 'type') === vType;
              const valDop = getV(r, 'dop');
              const valFin = getV(r, 'inventory_finish_date');
              const mD = (!ds || valDop >= ds) && (!de || (valDop <= de && valDop !== ''));
              const mShortUnfinished = !shortUnfinished || !valFin;
              const mShortFyDone = !shortFyDone || (!!valFin && (!fyStart || valFin >= fyStart) && (!fyEnd || valFin <= fyEnd));
              const lid = String(getV(r, 'ledger_record_id')).trim();
              const mNoAcct = !shortNoAcct || !lid || lid === '#N/A' || lid === '-' || !/^\d+$/.test(lid);
              const rid = String(r?.$id?.value ?? '').trim();
              const mMultiAcct = !shortMultiAcct || (multiAcctSet && multiAcctSet.has(rid));
              return mDep && mPc && mUsr && mType && mD && mShortUnfinished && mShortFyDone && mNoAcct && mMultiAcct;
            });

            if (countEl) countEl.textContent = `${filtered.length}件`;

            if (hasFilter) {
              ensureListStyles();
              hideDefaultTable();
              renderCardsIfNeeded({ records: filtered }, tableSearchContainer);
            } else {
              showDefaultTable();
            }
            persistSearchState();
          };

          const panel = document.getElementById('jbis-pc-search-panel');
          const btnUnfinished = document.getElementById('jbis-short-unfinished');
          const btnFyDone = document.getElementById('jbis-short-fy-done');
          const btnNoAcct = document.getElementById('jbis-short-no-acct');

          // パネル"絞り込み中"視覚状態の同期（赤枠＋桜色背景）。テーブル全表示中に
          // 「条件が残っているのに何も絞られてない」混乱を防ぐ。
          const setPanelFilteredVisual = (active) => {
            const panelEl = document.getElementById('jbis-pc-search-panel');
            if (!panelEl) return;
            if (active) {
              panelEl.style.outline = '2px solid #b91c1c';
              panelEl.style.outlineOffset = '2px';
              panelEl.style.background = '#fef2f2';
              panelEl.dataset.jbisFiltered = '1';
            } else {
              panelEl.style.removeProperty('outline');
              panelEl.style.removeProperty('outline-offset');
              panelEl.style.removeProperty('background');
              panelEl.dataset.jbisFiltered = '0';
            }
          };

          // 復元バナー（前回の検索条件あり）。
          const RESTORE_BANNER_ID = 'jbis-q-restore-banner';
          const removeRestoreBanner = () => {
            const b = document.getElementById(RESTORE_BANNER_ID);
            if (b && b.parentNode) b.parentNode.removeChild(b);
          };
          const showRestoreBanner = () => {
            removeRestoreBanner();
            const panelEl = document.getElementById('jbis-pc-search-panel');
            if (!panelEl) return;
            const div = document.createElement('div');
            div.id = RESTORE_BANNER_ID;
            div.style.cssText =
              'margin:6px 0 0;padding:8px 12px;background:#fff7ed;border:2px solid #f59e0b;' +
              'border-radius:8px;color:#7c2d12;font-size:12px;font-weight:700;display:flex;' +
              'align-items:center;gap:8px;flex-wrap:wrap;';
            const txt = document.createElement('span');
            txt.textContent = '⚠ 前回の検索条件がパネルに残っています（現在は全件表示）。';
            div.appendChild(txt);
            const apply = document.createElement('button');
            apply.type = 'button';
            apply.textContent = 'この条件で絞り込む';
            apply.style.cssText =
              'background:#b91c1c;color:#fff;border:none;border-radius:6px;padding:4px 10px;' +
              'font-weight:700;cursor:pointer;font-size:12px;';
            apply.onclick = () => { removeRestoreBanner(); runTableSearchAndSync(); };
            div.appendChild(apply);
            const clr = document.createElement('button');
            clr.type = 'button';
            clr.textContent = '条件をクリア';
            clr.style.cssText =
              'background:#fff;color:#7c2d12;border:1px solid #b45309;border-radius:6px;padding:4px 10px;' +
              'font-weight:700;cursor:pointer;font-size:12px;';
            clr.onclick = () => {
              document.getElementById('jbis-q-rst')?.click();
            };
            div.appendChild(clr);
            panelEl.appendChild(div);
          };

          // doTableSearch を呼んだ後にパネルの視覚同期＆復元バナー除去まで一括で行うラッパー。
          const runTableSearchAndSync = () => {
            removeRestoreBanner();
            doTableSearch();
            const panelEl = document.getElementById('jbis-pc-search-panel');
            const active = !!(
              (document.getElementById('jbis-q-dep')?.value || '').trim() ||
              (document.getElementById('jbis-q-type')?.value || '').trim() ||
              (document.getElementById('jbis-q-pc')?.value || '').trim() ||
              (document.getElementById('jbis-q-usr')?.value || '').trim() ||
              (document.getElementById('jbis-ds')?.value || '').trim() ||
              (document.getElementById('jbis-de')?.value || '').trim() ||
              panelEl?.dataset.shortUnfinished === '1' ||
              panelEl?.dataset.shortFyDone === '1' ||
              panelEl?.dataset.shortNoAcct === '1' ||
              panelEl?.dataset.shortMultiAcct === '1'
            );
            setPanelFilteredVisual(active);
          };

          const btnMultiAcct = document.getElementById('jbis-short-multi-acct');

          if (btnUnfinished && panel) {
            btnUnfinished.onclick = () => {
              const next = panel.dataset.shortUnfinished === '1' ? '0' : '1';
              panel.dataset.shortUnfinished = next;
              btnUnfinished.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
              runTableSearchAndSync();
            };
          }
          if (btnFyDone && panel) {
            btnFyDone.onclick = () => {
              const next = panel.dataset.shortFyDone === '1' ? '0' : '1';
              panel.dataset.shortFyDone = next;
              btnFyDone.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
              runTableSearchAndSync();
            };
          }
          if (btnNoAcct && panel) {
            btnNoAcct.onclick = () => {
              const next = panel.dataset.shortNoAcct === '1' ? '0' : '1';
              panel.dataset.shortNoAcct = next;
              btnNoAcct.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
              runTableSearchAndSync();
            };
          }
          if (btnMultiAcct && panel) {
            btnMultiAcct.onclick = async () => {
              const next = panel.dataset.shortMultiAcct === '1' ? '0' : '1';
              panel.dataset.shortMultiAcct = next;
              btnMultiAcct.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
              if (next === '1') {
                btnMultiAcct.disabled = true;
                const orig = btnMultiAcct.textContent;
                btnMultiAcct.textContent = '集計中…';
                try {
                  await buildMultiAcct594IdSet();
                } catch (e) {
                  console.warn('[JBIS-594] multi-acct fetch failed', e);
                  alert('「アカウント複数/重複疑い」の集計でエラーが発生しました。コンソールをご確認ください。');
                  panel.dataset.shortMultiAcct = '0';
                  btnMultiAcct.setAttribute('aria-pressed', 'false');
                } finally {
                  btnMultiAcct.disabled = false;
                  btnMultiAcct.textContent = orig;
                }
              }
              runTableSearchAndSync();
            };
          }

          document.getElementById('jbis-q-btn').onclick = runTableSearchAndSync;
          document.getElementById('jbis-q-rst').onclick = () => {
            ['jbis-q-dep', 'jbis-q-pc', 'jbis-q-usr', 'jbis-ds', 'jbis-de'].forEach((id) => {
              const el = document.getElementById(id);
              if (el) el.value = '';
            });
            const typeEl = document.getElementById('jbis-q-type');
            if (typeEl) typeEl.value = '';
            if (panel) {
              panel.dataset.shortUnfinished = '0';
              panel.dataset.shortFyDone = '0';
              panel.dataset.shortNoAcct = '0';
              panel.dataset.shortMultiAcct = '0';
            }
            if (btnUnfinished) btnUnfinished.setAttribute('aria-pressed', 'false');
            if (btnFyDone) btnFyDone.setAttribute('aria-pressed', 'false');
            if (btnNoAcct) btnNoAcct.setAttribute('aria-pressed', 'false');
            if (btnMultiAcct) btnMultiAcct.setAttribute('aria-pressed', 'false');
            showDefaultTable();
            if (countEl) countEl.textContent = `${allRecs.length}件`;
            clearSearchState();
            setPanelFilteredVisual(false);
            removeRestoreBanner();
          };

          // M1（修正後）: 表形式ビューでは「条件の自動絞り込み」を行わない。
          // - 入力欄/トグルへの値復元はする（ユーザーがすぐに「検索」を押せるように）
          // - ただし表は全件表示のまま維持し、バナーで明示する。
          // - これで「表形式全表示なのにカード表示が出ている」という違和感を撲滅。
          const savedSt = loadSearchState();
          const hasRestoredCond = applySearchStateToUi(savedSt);
          showDefaultTable();
          if (hasRestoredCond) {
            if (countEl) countEl.textContent = `全${allRecs.length}件（前回の検索条件あり）`;
            showRestoreBanner();
          }
          setPanelFilteredVisual(false);
        });

        return event;
      }
      ensure594CardViewLayerCss();
      document.body.classList.add('jbis594-card-view');
      suppress594DefaultListGrids();

      const tableWrapper = document.getElementById('jbis-594-table-search-wrapper');
      if (tableWrapper) tableWrapper.style.display = 'none';
      const tableCards = document.getElementById('jbis-table-search-cards');
      if (tableCards) { tableCards.style.display = 'none'; tableCards.innerHTML = ''; }

      ensureSearchPanel();
      const spPanel = document.getElementById('jbis-pc-search-panel');
      const hdrMenu = kintone.app.getHeaderMenuSpaceElement();
      if (spPanel && hdrMenu && spPanel.parentNode !== hdrMenu) {
        hdrMenu.appendChild(spPanel);
      }
      if (!window.__jbis594GridMo) window.__jbis594GridMo = { obs: null, timer: null, deb: null };
      const moPack = window.__jbis594GridMo;
      if (moPack.obs) moPack.obs.disconnect();
      if (moPack.timer) clearTimeout(moPack.timer);
      moPack.obs = new MutationObserver(() => {
        if (!document.getElementById('pc-card-container')) return;
        clearTimeout(moPack.deb);
        moPack.deb = setTimeout(() => {
          suppress594DefaultListGrids();
          syncPcCardGridOffset();
        }, 250);
      });
      const moTarget = document.querySelector('.contents-gaia')
        || (document.getElementById('pc-card-container') && document.getElementById('pc-card-container').parentElement)
        || document.body;
      moPack.obs.observe(moTarget, { childList: true, subtree: true });
      moPack.timer = setTimeout(() => {
        if (moPack.obs) {
          moPack.obs.disconnect();
          moPack.obs = null;
        }
        moPack.timer = null;
      }, 10000);

      const countEl = document.getElementById('jbis-q-count');
      if (countEl) countEl.textContent = '読込中...';

      // Fetch all records for this view once, then filter on client
      fetchAllForCurrentView().then((allRecs) => {
        const doSearch = () => {
          suppress594DefaultListGrids();
          const panel = document.getElementById('jbis-pc-search-panel');
          const depTokens = expandDepTokens(splitTokens(document.getElementById('jbis-q-dep')?.value || ''));
          const vPc = document.getElementById('jbis-q-pc')?.value || '';
          const vUsr = document.getElementById('jbis-q-usr')?.value || '';
          const vType = document.getElementById('jbis-q-type')?.value || '';
          const ds = document.getElementById('jbis-ds')?.value || '';
          const de = document.getElementById('jbis-de')?.value || '';
          const shortUnfinished = panel?.dataset.shortUnfinished === '1';
          const shortFyDone = panel?.dataset.shortFyDone === '1';
          const shortNoAcct = panel?.dataset.shortNoAcct === '1';
          const shortMultiAcct = panel?.dataset.shortMultiAcct === '1';
          const fyStart = panel?.dataset.fyStart || '';
          const fyEnd = panel?.dataset.fyEnd || '';
          const multiAcctSet = (shortMultiAcct && jbis594MultiAcctCache.ids) || null;

          const filtered = allRecs.filter((r) => {
            const depHay = `${getV(r, 'dept_name')} ${getV(r, 'group_name')}`;
            const mDep = matchesAnyToken(depHay, depTokens);
            const mPc = !vPc || includesNormalized(`${getV(r, 'PC_name')} ${getV(r, 'shared_terminal_name')}`, vPc);
            const mUsr = !vUsr || includesNormalized(getV(r, 'user_name'), vUsr);
            const mType = !vType || getV(r, 'type') === vType;
            const valDop = getV(r, 'dop');
            const valFin = getV(r, 'inventory_finish_date');
            const mD = (!ds || valDop >= ds) && (!de || (valDop <= de && valDop !== ''));
            const mShortUnfinished = !shortUnfinished || !valFin;
            const mShortFyDone = !shortFyDone || (!!valFin && (!fyStart || valFin >= fyStart) && (!fyEnd || valFin <= fyEnd));
            const lid = String(getV(r, 'ledger_record_id')).trim();
            const mNoAcct = !shortNoAcct || !lid || lid === '#N/A' || lid === '-' || !/^\d+$/.test(lid);
            const rid = String(r?.$id?.value ?? '').trim();
            const mMultiAcct = !shortMultiAcct || (multiAcctSet && multiAcctSet.has(rid));
            return mDep && mPc && mUsr && mType && mD && mShortUnfinished && mShortFyDone && mNoAcct && mMultiAcct;
          });
          if (countEl) countEl.textContent = `${filtered.length}件`;
          renderCardsIfNeeded({ records: filtered });
          schedulePcCardGridSync();
          persistSearchState();
        };

        const panel = document.getElementById('jbis-pc-search-panel');
        const btnUnfinished = document.getElementById('jbis-short-unfinished');
        const btnFyDone = document.getElementById('jbis-short-fy-done');
        const btnNoAcct = document.getElementById('jbis-short-no-acct');
        const btnMultiAcct = document.getElementById('jbis-short-multi-acct');
        if (btnUnfinished && panel) {
          btnUnfinished.onclick = () => {
            const next = panel.dataset.shortUnfinished === '1' ? '0' : '1';
            panel.dataset.shortUnfinished = next;
            btnUnfinished.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
            doSearch();
          };
        }
        if (btnFyDone && panel) {
          btnFyDone.onclick = () => {
            const next = panel.dataset.shortFyDone === '1' ? '0' : '1';
            panel.dataset.shortFyDone = next;
            btnFyDone.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
            doSearch();
          };
        }

        if (btnNoAcct && panel) {
          btnNoAcct.onclick = () => {
            const next = panel.dataset.shortNoAcct === '1' ? '0' : '1';
            panel.dataset.shortNoAcct = next;
            btnNoAcct.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
            doSearch();
          };
        }
        if (btnMultiAcct && panel) {
          btnMultiAcct.onclick = async () => {
            const next = panel.dataset.shortMultiAcct === '1' ? '0' : '1';
            panel.dataset.shortMultiAcct = next;
            btnMultiAcct.setAttribute('aria-pressed', next === '1' ? 'true' : 'false');
            if (next === '1') {
              btnMultiAcct.disabled = true;
              const orig = btnMultiAcct.textContent;
              btnMultiAcct.textContent = '集計中…';
              try {
                await buildMultiAcct594IdSet();
              } catch (e) {
                console.warn('[JBIS-594] multi-acct fetch failed', e);
                alert('「アカウント複数/重複疑い」の集計でエラーが発生しました。コンソールをご確認ください。');
                panel.dataset.shortMultiAcct = '0';
                btnMultiAcct.setAttribute('aria-pressed', 'false');
              } finally {
                btnMultiAcct.disabled = false;
                btnMultiAcct.textContent = orig;
              }
            }
            doSearch();
          };
        }

        document.getElementById('jbis-q-btn').onclick = doSearch;
        document.getElementById('jbis-q-rst').onclick = () => {
          ['jbis-q-dep', 'jbis-q-pc', 'jbis-q-usr', 'jbis-ds', 'jbis-de'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          const typeEl = document.getElementById('jbis-q-type');
          if (typeEl) typeEl.value = '';
          if (panel) {
            panel.dataset.shortUnfinished = '0';
            panel.dataset.shortFyDone = '0';
            panel.dataset.shortNoAcct = '0';
            panel.dataset.shortMultiAcct = '0';
          }
          const btnUnfinished = document.getElementById('jbis-short-unfinished');
          const btnFyDone = document.getElementById('jbis-short-fy-done');
          const btnNoAcct2 = document.getElementById('jbis-short-no-acct');
          const btnMultiAcct2 = document.getElementById('jbis-short-multi-acct');
          if (btnUnfinished) btnUnfinished.setAttribute('aria-pressed', 'false');
          if (btnFyDone) btnFyDone.setAttribute('aria-pressed', 'false');
          if (btnNoAcct2) btnNoAcct2.setAttribute('aria-pressed', 'false');
          if (btnMultiAcct2) btnMultiAcct2.setAttribute('aria-pressed', 'false');
          clearSearchState();
          doSearch();
        };
        // M1: 検索状態の復元（カードビュー）。保存値があれば復元、なければ通常の初回描画。
        const savedStCard = loadSearchState();
        applySearchStateToUi(savedStCard);
        // shortMultiAcct はサーバ集計が必要なため、復元時にキャッシュを温める（無音・失敗時はOFFに戻す）
        if (savedStCard?.shortMultiAcct === '1') {
          buildMultiAcct594IdSet().then(() => doSearch()).catch((e) => {
            console.warn('[JBIS-594] multi-acct restore failed', e);
            const p = document.getElementById('jbis-pc-search-panel');
            if (p) p.dataset.shortMultiAcct = '0';
            const b = document.getElementById('jbis-short-multi-acct');
            if (b) b.setAttribute('aria-pressed', 'false');
            doSearch();
          });
        } else {
          doSearch();
        }
      });
    } catch (e) {
      // If card render fails, do not break list view.
      console.error('[JBIS-ACC-001] card render failed', e);
    }
    return event;
  });

  // 594 new record: auto-generate PC_name for ノートPC / デスクトップPC from app 596 pool.
  kintone.events.on('app.record.create.submit', async (event) => {
    try {
      const rec = event.record || {};
      const category = (rec[FC_594_CATEGORY]?.value || '').trim();
      const currentPc = (rec[FC_594_PC_NAME]?.value || '').trim();
      const status = (rec[FC_594_STATUS]?.value || '').trim();

      // 廃止ステータスなら廃止フラグを自動ON（フィールドがある場合のみ）
      if (rec[FC_594_ABOLISHED_FLAG]) {
        rec[FC_594_ABOLISHED_FLAG].value = shouldBeAbolished(status) ? [ABOLISHED_LABEL] : [];
      }
      if (currentPc) return event; // do not override manual value
      if (!(category === 'ノートPC' || category === 'デスクトップPC')) return event;

      const newPcName = await claimPcNumberFrom596();
      if (!newPcName) {
        event.error = 'PC採番マスタ(596)に未使用の番号がありません。管理者へ連絡してください。';
        return event;
      }
      rec[FC_594_PC_NAME].value = newPcName;
      return event;
    } catch (e) {
      event.error = `PC自動採番でエラー: ${e?.message || String(e)}`;
      return event;
    }
  });

  // 594 edit record: keep abolished flag in sync with status.
  kintone.events.on('app.record.edit.submit', (event) => {
    const rec = event.record || {};
    if (!rec[FC_594_ABOLISHED_FLAG]) return event;
    const status = (rec[FC_594_STATUS]?.value || '').trim();
    rec[FC_594_ABOLISHED_FLAG].value = shouldBeAbolished(status) ? [ABOLISHED_LABEL] : [];
    return event;
  });

  // ── Shared PC → 627 account link ─────────────────────────────

  const searchSharedAccounts = async (keyword) => {
    const kw = String(keyword).trim().toLowerCase();
    if (!kw) return [];
    const fields = ['$id', FC_627_AD_LOGON, FC_627_WINDOWS_NAME, FC_627_PC_NAME_FIELD, FC_627_ACCOUNT_TYPE, FC_627_NAME];
    const baseQ = `${FC_627_ACCOUNT_TYPE} in ("共有アカウント") order by $id desc`;
    const all = [];
    let offset = 0;
    for (;;) {
      const q = `${baseQ} limit 500 offset ${offset}`;
      const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: LEDGER_APP_ID, query: q, fields,
      });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
      offset += 500;
    }
    return all.filter((r) => {
      const vals = [
        r[FC_627_AD_LOGON]?.value,
        r[FC_627_WINDOWS_NAME]?.value,
        r[FC_627_PC_NAME_FIELD]?.value,
        r[FC_627_NAME]?.value,
      ];
      return vals.some((v) => v && String(v).toLowerCase().includes(kw));
    }).slice(0, 30);
  };

  const linkSharedAccountTo627 = async (recordId594, ledgerId627, pcName594) => {
    const res627 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
      app: LEDGER_APP_ID, id: ledgerId627,
    });
    const rec627 = res627.record || {};

    const currentSub = Array.isArray(rec627[FC_627_PC_SUBTABLE]?.value)
      ? rec627[FC_627_PC_SUBTABLE].value : [];
    const alreadyLinked = currentSub.some(
      (row) => String(row?.value?.[FC_627_PC_SUB_594]?.value || '') === String(recordId594)
    );
    const newSub = currentSub.map((row) => ({ id: row.id, value: row.value }));
    if (!alreadyLinked) {
      newSub.push({ value: { [FC_627_PC_SUB_594]: { value: String(recordId594) } } });
    }

    const patch627 = { [FC_627_PC_SUBTABLE]: { value: newSub } };
    const curRep = String(rec627[FC_627_PC_594_RECORD_ID]?.value || '').trim();
    if (!curRep || !/^\d+$/.test(curRep)) {
      patch627[FC_627_PC_594_RECORD_ID] = { value: String(recordId594) };
    }
    if (pcName594) {
      const existing = String(rec627[FC_627_PC_NAME_FIELD]?.value || '').trim();
      if (!existing) patch627[FC_627_PC_NAME_FIELD] = { value: pcName594 };
      else if (!existing.includes(pcName594)) patch627[FC_627_PC_NAME_FIELD] = { value: `${existing}, ${pcName594}` };
    }

    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: LEDGER_APP_ID, id: ledgerId627, record: patch627,
    });
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: kintone.app.getId(), id: recordId594,
      record: { [FC_594_LEDGER_RECORD_ID]: { value: String(ledgerId627) } },
    }).catch(() => {});
  };

  const createSharedAccountFromNumbering = async (recordId594, pcName594) => {
    const unused = await getOneRecord(
      SHARED_NUMBERING_APP,
      `${FC_667_USED} not in ("${FC_667_USED_MARK}") and ${FC_667_WINDOWS_ID} != "" order by $id asc limit 1`,
      ['$id', '$revision', FC_667_WINDOWS_ID]
    );
    if (!unused) return { ok: false, message: '共有アカウント採番マスタ(667)に未使用の番号がありません。管理者に連絡してください。' };
    const windowsId = (unused[FC_667_WINDOWS_ID]?.value || '').trim();

    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: SHARED_NUMBERING_APP, id: unused.$id.value, revision: unused.$revision.value,
      record: { [FC_667_USED]: { value: FC_667_USED_MARK } },
    });

    const newRec = {};
    newRec[FC_627_AD_LOGON] = { value: windowsId };
    newRec[FC_627_WINDOWS_NAME] = { value: `${windowsId}[${pcName594 || ''}]` };
    newRec[FC_627_PC_NAME_FIELD] = { value: pcName594 || '' };
    newRec[FC_627_ACCOUNT_TYPE] = { value: '共有アカウント' };
    newRec[FC_627_PC_594_RECORD_ID] = { value: String(recordId594) };
    newRec[FC_627_PC_SUBTABLE] = {
      value: [{ value: { [FC_627_PC_SUB_594]: { value: String(recordId594) } } }],
    };

    const created = await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
      app: LEDGER_APP_ID, record: newRec,
    });
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: kintone.app.getId(), id: recordId594,
      record: { [FC_594_LEDGER_RECORD_ID]: { value: String(created.id) } },
    }).catch(() => {});

    return { ok: true, ledgerId: created.id, windowsId };
  };

  const showSharedAccountLinkModal = (recordId594, pcName594) => {
    if (document.getElementById('jbis594-shared-link-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'jbis594-shared-link-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="max-width:520px;width:95%;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px;font-family:inherit;max-height:85vh;overflow-y:auto;">' +
      '<h2 style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0f172a;">🔗 共有PC — アカウント紐付け</h2>' +
      '<p style="margin:0 0 16px;font-size:12px;color:#475569;">このPCに紐付けるアカウントを選んでください。</p>' +
      '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
      '  <input id="jbis-shared-search" type="text" placeholder="ログオン名 / Windows名 / 利用者名 / PC名 で検索" style="flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;">' +
      '  <button id="jbis-shared-search-btn" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">検索</button>' +
      '</div>' +
      '<div id="jbis-shared-results" style="margin-bottom:16px;min-height:40px;"></div>' +
      '<div style="border-top:1px solid #e2e8f0;padding-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">' +
      '  <button id="jbis-shared-create-new" type="button" style="padding:8px 16px;border:none;border-radius:6px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-weight:700;font-size:13px;cursor:pointer;">＋ 新規アカウント作成</button>' +
      '  <button id="jbis-shared-skip" type="button" style="padding:8px 16px;border:1px solid #94a3b8;border-radius:6px;background:#fff;color:#334155;font-weight:600;font-size:13px;cursor:pointer;">あとで（スキップ）</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    overlay.querySelector('#jbis-shared-skip').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const resultsDiv = overlay.querySelector('#jbis-shared-results');
    const searchInput = overlay.querySelector('#jbis-shared-search');

    const renderResults = (records) => {
      if (!records.length) {
        resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">該当なし</p>';
        return;
      }
      let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<tr style="background:#f1f5f9;"><th style="padding:6px 8px;text-align:left;">ログオン名</th><th style="padding:6px 8px;text-align:left;">Windows名</th><th style="padding:6px 8px;text-align:left;">利用者</th><th style="padding:6px 8px;text-align:left;">PC名</th><th style="padding:6px 8px;"></th></tr>';
      for (const r of records) {
        const id = r.$id.value;
        const logon = r[FC_627_AD_LOGON]?.value || '';
        const winName = r[FC_627_WINDOWS_NAME]?.value || '';
        const userName = r[FC_627_NAME]?.value || '';
        const pcN = r[FC_627_PC_NAME_FIELD]?.value || '';
        html += '<tr style="border-bottom:1px solid #e2e8f0;">' +
          `<td style="padding:6px 8px;">${logon}</td>` +
          `<td style="padding:6px 8px;">${winName}</td>` +
          `<td style="padding:6px 8px;">${userName}</td>` +
          `<td style="padding:6px 8px;">${pcN}</td>` +
          `<td style="padding:6px 8px;"><button type="button" data-lid="${id}" class="jbis-shared-pick" style="padding:4px 12px;border:none;border-radius:4px;background:#2563eb;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">選択</button></td></tr>`;
      }
      html += '</table>';
      resultsDiv.innerHTML = html;
      resultsDiv.querySelectorAll('.jbis-shared-pick').forEach((btn) => {
        btn.onclick = async () => {
          btn.disabled = true; btn.textContent = '処理中…';
          try {
            await linkSharedAccountTo627(recordId594, btn.dataset.lid, pcName594);
            alert('✅ アカウントを紐付けました。'); close(); location.reload();
          } catch (e) {
            alert(`紐付けに失敗しました: ${e?.message || String(e)}`);
            btn.disabled = false; btn.textContent = '選択';
          }
        };
      });
    };

    const doSearch = async () => {
      const kw = searchInput.value.trim();
      if (!kw) { resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">検索キーワードを入力してください</p>'; return; }
      resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">検索中...</p>';
      try { renderResults(await searchSharedAccounts(kw)); }
      catch (e) { resultsDiv.innerHTML = `<p style="font-size:12px;color:#dc2626;text-align:center;padding:12px 0;">検索エラー: ${e?.message || String(e)}</p>`; }
    };
    overlay.querySelector('#jbis-shared-search-btn').onclick = doSearch;
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

    overlay.querySelector('#jbis-shared-create-new').onclick = async () => {
      const btn = overlay.querySelector('#jbis-shared-create-new');
      if (!confirm('共有アカウント採番マスタ(667)から番号を取得し、新しいアカウントを作成します。よろしいですか？')) return;
      btn.disabled = true; btn.textContent = '作成中…';
      try {
        const result = await createSharedAccountFromNumbering(recordId594, pcName594);
        if (!result.ok) { alert(result.message); btn.disabled = false; btn.textContent = '＋ 新規アカウント作成'; return; }
        alert(`✅ 新規アカウントを作成しました。\nログオン名: ${result.windowsId}\nアカウント台帳レコード: ${result.ledgerId}`);
        close(); location.reload();
      } catch (e) {
        alert(`アカウント作成に失敗しました: ${e?.message || String(e)}`);
        btn.disabled = false; btn.textContent = '＋ 新規アカウント作成';
      }
    };
    searchInput.focus();
  };

  /**
   * 非同期: 現在のレコードが type=共有 かつ ledger 未紐付けなら共有リンクボタンを追加。
   * REST API で判定するため kintone.app.record.get() を呼ばない（detail.show 中でも安全）。
   */
  const maybeAddSharedButton = async (wrap) => {
    try {
      if (wrap.querySelector('[data-jbis-shared-link]')) return;
      const rid = kintone.app.record.getId();
      if (!rid) return;
      const { record: recData } = await get594RecordPayloadById(rid);
      const curType = (recData[FC_594_TYPE]?.value || '').trim();
      const curLedger = (recData[FC_594_LEDGER_RECORD_ID]?.value || '').trim();
      if (curType !== '共有' || (curLedger && /^\d+$/.test(curLedger))) return;
      if (String(kintone.app.record.getId()) !== String(rid)) return;
      if (wrap.querySelector('[data-jbis-shared-link]')) return;

      const pcName = (recData[FC_594_PC_NAME]?.value || '').trim();
      const btnSharedLink = document.createElement('button');
      btnSharedLink.type = 'button';
      btnSharedLink.setAttribute('data-jbis-shared-link', '1');
      btnSharedLink.textContent = '🔗 共有アカウント紐付け';
      btnSharedLink.style.cssText = 'padding:6px 14px;border:none;border-radius:6px;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;font-weight:700;font-size:12px;cursor:pointer;';
      btnSharedLink.onclick = () => showSharedAccountLinkModal(rid, pcName);
      wrap.insertBefore(btnSharedLink, wrap.firstChild);
    } catch (e) {
      console.warn('[JBIS-594] shared button check error', e);
    }
  };

  // ── Personal PC → 627 account link ─────────────────────────────
  // 規定: 1 個人アカウント = 1 ユーザー / 1 ユーザーは個人 PC 最大 2 台 (会社用 + 持ち出し用)
  // よって 1 個人アカウント (627) ↔ 最大 PERSONAL_ACCOUNT_PC_LIMIT 台 の関係を強制する。
  const PERSONAL_ACCOUNT_PC_LIMIT = 2;

  const get627PcLinks = (rec627) => {
    const linked = new Set();
    const single = String(rec627[FC_627_PC_594_RECORD_ID]?.value || '').trim();
    if (single) linked.add(single);
    const rows = rec627[FC_627_PC_SUBTABLE]?.value || [];
    for (const sr of rows) {
      const v = String(sr?.value?.[FC_627_PC_SUB_594]?.value || '').trim();
      if (v) linked.add(v);
    }
    return linked;
  };

  const fetch594NamesByIds = async (ids) => {
    const list = [...new Set([...ids].map((x) => String(x).trim()).filter(Boolean))];
    if (list.length === 0) return new Map();
    const map = new Map();
    // 安全のため 100 件ずつ分割 (kintone in 演算子の上限)
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const q = `$id in (${chunk.map((id) => `"${id}"`).join(',')}) limit 500`;
      try {
        const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
          app: kintone.app.getId(),
          query: q,
          fields: ['$id', FC_594_PC_NAME, FC_594_NAME],
        });
        for (const r of (res?.records || [])) {
          map.set(String(r.$id.value), {
            pcName: r[FC_594_PC_NAME]?.value || '',
            userName: r[FC_594_NAME]?.value || '',
          });
        }
      } catch (e) {
        console.warn('[JBIS-594] fetch594NamesByIds chunk error', e);
      }
    }
    return map;
  };

  const searchPersonalAccounts = async (keyword) => {
    const kw = String(keyword).trim().toLowerCase();
    if (!kw) return [];
    const fields = [
      '$id', FC_627_AD_LOGON, FC_627_NAME, FC_627_MAIL, FC_627_DEPT, FC_627_GROUP,
      FC_627_ACCOUNT_TYPE, FC_627_PC_NAME_FIELD, FC_627_PC_594_RECORD_ID, FC_627_PC_SUBTABLE,
    ];
    const baseQ = `${FC_627_ACCOUNT_TYPE} in ("個人アカウント") order by $id desc`;
    const all = [];
    let offset = 0;
    for (;;) {
      const q = `${baseQ} limit 500 offset ${offset}`;
      const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {
        app: LEDGER_APP_ID, query: q, fields,
      });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
      offset += 500;
    }
    return all.filter((r) => {
      const vals = [
        r[FC_627_AD_LOGON]?.value,
        r[FC_627_NAME]?.value,
        r[FC_627_MAIL]?.value,
        r[FC_627_DEPT]?.value,
      ];
      return vals.some((v) => v && String(v).toLowerCase().includes(kw));
    }).slice(0, 30);
  };

  // 個人アカウントを 594 に紐付ける。
  // 戻り値: { ok, linked?, alreadyLinked?, blocked?, message?, currentPcs? }
  // - alreadyLinked: 既に同じ 594 と紐付け済み (no-op)
  // - blocked: 上限到達 (currentPcs に既存紐付け一覧)
  // - linked: 紐付け成功
  const linkPersonalAccountTo627 = async (recordId594, ledgerId627, pcName594) => {
    const res627 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
      app: LEDGER_APP_ID, id: ledgerId627,
    });
    const rec627 = res627.record || {};

    const linkedNow = get627PcLinks(rec627);
    if (linkedNow.has(String(recordId594))) {
      return { ok: true, alreadyLinked: true };
    }
    if (linkedNow.size >= PERSONAL_ACCOUNT_PC_LIMIT) {
      const linkedNames = await fetch594NamesByIds(linkedNow);
      const display = [...linkedNow].map((id) => {
        const info = linkedNames.get(id);
        return info ? `${info.pcName || '(PC名なし)'} (#${id})` : `#${id}`;
      });
      return {
        ok: false,
        blocked: true,
        currentPcs: display,
        message:
          `このアカウントは既に ${linkedNow.size} 台 (${display.join(' / ')}) と紐付いており、` +
          `規定上限の ${PERSONAL_ACCOUNT_PC_LIMIT} 台 (会社用 + 持ち出し用) に達しています。\n` +
          `先に不要な紐付けを解除してから、再度このボタンを実行してください。`,
      };
    }

    // サブテーブルへ追加 + 単一フィールドが空なら埋める + PC_name にマージ
    const currentSub = Array.isArray(rec627[FC_627_PC_SUBTABLE]?.value)
      ? rec627[FC_627_PC_SUBTABLE].value : [];
    const newSub = currentSub.map((row) => ({ id: row.id, value: row.value }));
    newSub.push({ value: { [FC_627_PC_SUB_594]: { value: String(recordId594) } } });

    const patch627 = { [FC_627_PC_SUBTABLE]: { value: newSub } };
    const curRep = String(rec627[FC_627_PC_594_RECORD_ID]?.value || '').trim();
    if (!curRep || !/^\d+$/.test(curRep)) {
      patch627[FC_627_PC_594_RECORD_ID] = { value: String(recordId594) };
    }
    if (pcName594) {
      const existing = String(rec627[FC_627_PC_NAME_FIELD]?.value || '').trim();
      if (!existing) patch627[FC_627_PC_NAME_FIELD] = { value: pcName594 };
      else if (!existing.includes(pcName594)) patch627[FC_627_PC_NAME_FIELD] = { value: `${existing}, ${pcName594}` };
    }

    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: LEDGER_APP_ID, id: ledgerId627, record: patch627,
    });
    await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: kintone.app.getId(), id: recordId594,
      record: { [FC_594_LEDGER_RECORD_ID]: { value: String(ledgerId627) } },
    }).catch(() => {});

    return { ok: true, linked: true, linkedCountAfter: linkedNow.size + 1 };
  };

  const showPersonalAccountLinkModal = (recordId594, pcName594, mail594, name594) => {
    if (document.getElementById('jbis594-personal-link-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'jbis594-personal-link-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="max-width:560px;width:95%;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px;font-family:inherit;max-height:88vh;overflow-y:auto;">' +
      '<h2 style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0f172a;">🔗 個人PC — アカウント紐付け</h2>' +
      `<p style="margin:0 0 12px;font-size:12px;color:#475569;">PC: <b>${qdEsc(pcName594 || '(名前なし)')}</b> / 利用者: <b>${qdEsc(name594 || '(未入力)')}</b></p>` +
      '<div style="margin:0 0 16px;padding:8px 10px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;font-size:11px;color:#854d0e;">' +
      '  📌 <b>運用ルール</b>: 1 個人アカウント = 1 ユーザー / 1 ユーザーは個人 PC 最大 2 台 (会社用 + 持ち出し用)<br>' +
      '  既存の個人アカウントを選ぶ → このPCを追加紐付け / ＋ 新規作成 → 採番プールから新しいアカウントを作る' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
      '  <input id="jbis-personal-search" type="text" placeholder="ログオン名 / 氏名 / メール / 部署 で検索" style="flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;">' +
      '  <button id="jbis-personal-search-btn" type="button" style="padding:8px 14px;border:none;border-radius:6px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">検索</button>' +
      '</div>' +
      '<div id="jbis-personal-results" style="margin-bottom:16px;min-height:40px;"></div>' +
      '<div style="border-top:1px solid #e2e8f0;padding-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">' +
      '  <button id="jbis-personal-create-new" type="button" style="padding:8px 16px;border:none;border-radius:6px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-weight:700;font-size:13px;cursor:pointer;">＋ 新規アカウント作成</button>' +
      '  <button id="jbis-personal-skip" type="button" style="padding:8px 16px;border:1px solid #94a3b8;border-radius:6px;background:#fff;color:#334155;font-weight:600;font-size:13px;cursor:pointer;">あとで（スキップ）</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    overlay.querySelector('#jbis-personal-skip').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const resultsDiv = overlay.querySelector('#jbis-personal-results');
    const searchInput = overlay.querySelector('#jbis-personal-search');

    // 利用者名一致チェック (氏名の表記揺れ・代理設定の判断材料を提供)
    const askConfirmIfNameMismatch = (acctName, acctMail) => {
      const a = String(acctName || '').trim();
      const b = String(name594 || '').trim();
      if (!a || !b) return true;  // どちらか空なら警告しない
      if (a === b) return true;   // 完全一致
      // 部分一致 (姓名の片方一致 / スペース有無の違い等) は警告レベルを下げる
      const norm = (s) => s.replace(/[\s　]/g, '');
      if (norm(a) === norm(b)) return true;  // 全角/半角空白だけの違い
      const msg =
        '⚠ 利用者名が一致しません\n\n' +
        `  アカウント所有者: ${a}\n` +
        (acctMail ? `  (mail: ${acctMail})\n` : '') +
        `  PC 利用者: ${b}\n` +
        (mail594 ? `  (mail: ${mail594})\n` : '') +
        '\n以下のいずれに該当しますか？\n' +
        '  1. 氏名の表記揺れ（フルネーム / 通称名 / 旧姓 等）\n' +
        '     → このまま紐付けて OK\n' +
        '  2. 氏名の入力ミス\n' +
        '     → キャンセルして PC 台帳側で利用者名を修正してから再実行を推奨\n' +
        '  3. 他者の PC を代理で設定 / PC を貸し出し中\n' +
        '     → このまま紐付けて OK\n' +
        '\n[OK] = 1 または 3 (このまま紐付ける)\n[キャンセル] = 2 (修正してから再実行)';
      return confirm(msg);
    };

    const renderResults = (records) => {
      if (!records.length) {
        resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">該当なし。＋ 新規アカウント作成 を検討してください。</p>';
        return;
      }
      let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<tr style="background:#f1f5f9;"><th style="padding:6px 8px;text-align:left;">ログオン名</th><th style="padding:6px 8px;text-align:left;">利用者</th><th style="padding:6px 8px;text-align:left;">メール</th><th style="padding:6px 8px;text-align:center;">紐付け数</th><th style="padding:6px 8px;"></th></tr>';
      for (const r of records) {
        const id = r.$id.value;
        const logon = r[FC_627_AD_LOGON]?.value || '';
        const userName = r[FC_627_NAME]?.value || '';
        const mail = r[FC_627_MAIL]?.value || '';
        const cnt = get627PcLinks(r).size;
        const cntStyle = cnt >= PERSONAL_ACCOUNT_PC_LIMIT
          ? 'background:#fee2e2;color:#991b1b;font-weight:700;'
          : (cnt >= 1 ? 'background:#fef9c3;color:#854d0e;font-weight:600;' : 'background:#dcfce7;color:#15803d;');
        html += '<tr style="border-bottom:1px solid #e2e8f0;">' +
          `<td style="padding:6px 8px;">${qdEsc(logon)}</td>` +
          `<td style="padding:6px 8px;">${qdEsc(userName)}</td>` +
          `<td style="padding:6px 8px;color:#64748b;font-size:11px;">${qdEsc(mail)}</td>` +
          `<td style="padding:6px 8px;text-align:center;"><span style="${cntStyle}padding:2px 8px;border-radius:10px;font-size:11px;">${cnt} / ${PERSONAL_ACCOUNT_PC_LIMIT}</span></td>` +
          `<td style="padding:6px 8px;"><button type="button" data-lid="${id}" data-name="${qdEsc(userName)}" data-mail="${qdEsc(mail)}" class="jbis-personal-pick" style="padding:4px 12px;border:none;border-radius:4px;background:#2563eb;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">選択</button></td></tr>`;
      }
      html += '</table>';
      resultsDiv.innerHTML = html;
      resultsDiv.querySelectorAll('.jbis-personal-pick').forEach((btn) => {
        btn.onclick = async () => {
          const acctName = btn.dataset.name || '';
          const acctMail = btn.dataset.mail || '';
          if (!askConfirmIfNameMismatch(acctName, acctMail)) return;
          btn.disabled = true; btn.textContent = '処理中…';
          try {
            const r = await linkPersonalAccountTo627(recordId594, btn.dataset.lid, pcName594);
            if (r.blocked) {
              alert(r.message);
              btn.disabled = false; btn.textContent = '選択';
              return;
            }
            if (r.alreadyLinked) {
              alert('このPCは既にこのアカウントと紐付け済みです。');
              close();
              return;
            }
            alert(`✅ アカウントを紐付けました（${r.linkedCountAfter} / ${PERSONAL_ACCOUNT_PC_LIMIT} 台）。`);
            close();
            location.reload();
          } catch (e) {
            alert(`紐付けに失敗しました: ${e?.message || String(e)}`);
            btn.disabled = false; btn.textContent = '選択';
          }
        };
      });
    };

    const doSearch = async () => {
      const kw = searchInput.value.trim();
      if (!kw) { resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">検索キーワードを入力してください</p>'; return; }
      resultsDiv.innerHTML = '<p style="font-size:12px;color:#94a3b8;text-align:center;padding:12px 0;">検索中...</p>';
      try { renderResults(await searchPersonalAccounts(kw)); }
      catch (e) { resultsDiv.innerHTML = `<p style="font-size:12px;color:#dc2626;text-align:center;padding:12px 0;">検索エラー: ${e?.message || String(e)}</p>`; }
    };
    overlay.querySelector('#jbis-personal-search-btn').onclick = doSearch;
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

    overlay.querySelector('#jbis-personal-create-new').onclick = async () => {
      const btn = overlay.querySelector('#jbis-personal-create-new');
      if (!mail594) {
        alert('メールアドレス (mail) が未入力のため、新規アカウントを作成できません。\nPC 台帳の mail を入力してから再実行してください。');
        return;
      }
      if (!confirm(`採番プール (626) から番号を取得し、メール ${mail594} で新しい個人アカウントを作成します。よろしいですか？`)) return;
      btn.disabled = true; btn.textContent = '作成中…';
      try {
        const cur = kintone.app.record.get();
        const rec594 = cur?.record;
        if (!rec594) throw new Error('レコードを取得できませんでした');
        const r = await sync627From594ApiRecord(rec594);
        if (!r.ok) {
          alert(r.message);
          btn.disabled = false; btn.textContent = '＋ 新規アカウント作成';
          return;
        }
        if (r.created) {
          alert(`✅ 新規アカウントを作成し、PC を紐付けました。\nアカウント台帳レコード: ${r.ledgerId}`);
        } else {
          alert(
            `既存のアカウント (#${r.ledgerId}) が見つかったため、氏名・所属を 594 から同期し PC を紐付けました。` +
            (r.notice ? `\n\n${r.notice}` : '')
          );
        }
        close();
        location.reload();
      } catch (e) {
        alert(`アカウント作成に失敗しました: ${e?.message || String(e)}`);
        btn.disabled = false; btn.textContent = '＋ 新規アカウント作成';
      }
    };
    searchInput.focus();
  };

  /**
   * 非同期: 現在のレコードが type=個人 ならボタンを追加 (常に表示・紐付け済みでも追加紐付けに使える)。
   */
  const maybeAddPersonalButton = async (wrap) => {
    try {
      if (wrap.querySelector('[data-jbis-personal-link]')) return;
      const rid = kintone.app.record.getId();
      if (!rid) return;
      const { record: recData } = await get594RecordPayloadById(rid);
      const curType = (recData[FC_594_TYPE]?.value || '').trim();
      if (curType !== '個人') return;
      if (String(kintone.app.record.getId()) !== String(rid)) return;
      if (wrap.querySelector('[data-jbis-personal-link]')) return;

      const pcName = (recData[FC_594_PC_NAME]?.value || '').trim();
      const mail = (recData[FC_594_MAIL]?.value || '').trim();
      const userName = (recData[FC_594_NAME]?.value || '').trim();
      const btnPersonalLink = document.createElement('button');
      btnPersonalLink.type = 'button';
      btnPersonalLink.setAttribute('data-jbis-personal-link', '1');
      btnPersonalLink.textContent = '🔗 個人アカウント紐付け';
      btnPersonalLink.style.cssText = 'padding:6px 14px;border:none;border-radius:6px;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-weight:700;font-size:12px;cursor:pointer;';
      btnPersonalLink.onclick = () => showPersonalAccountLinkModal(rid, pcName, mail, userName);
      wrap.insertBefore(btnPersonalLink, wrap.firstChild);
    } catch (e) {
      console.warn('[JBIS-594] personal button check error', e);
    }
  };

  const maybeShowSharedLinkModalFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_594_SHARED_LINK);
      if (!raw) return;
      sessionStorage.removeItem(STORAGE_KEY_594_SHARED_LINK);
      const { id, pcName } = JSON.parse(raw);
      const currentId = kintone.app.record.getId();
      if (id && String(id) === String(currentId)) {
        setTimeout(() => showSharedAccountLinkModal(id, pcName), 400);
      }
    } catch (_e) { /* noop */ }
  };

  /** 詳細画面の 627 / PC買替 ボタンコンテナ（重複挿入防止） */
  const DETAIL_ACC_BTN_WRAP_ID = 'jbis594-detail-acc001-wrap';

  const getRecordDetailButtonHostEl = () => {
    try {
      if (typeof kintone.app.record.getHeaderMenuSpaceElement === 'function') {
        const sp = kintone.app.record.getHeaderMenuSpaceElement();
        if (sp) return sp;
      }
    } catch (_e) {
      /* noop */
    }
    // アプリ設定でヘッダースペースを未使用だと getHeaderMenuSpaceElement は null になりやすい
    const selectors = [
      '.gaia-argoui-app-toolbar-top',
      '.gaia-argoui-app-toolbar',
      '.ocean-ui-app-record-view-layout-header .ocean-ui-app-record-view-navbar',
      '.ocean-ui-app-record-view-layout-header',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  /**
   * 詳細画面でボタンを載せる親要素。
   * ツールバー内部だと幅が足りず2本目がクリップされることがあるため、
   * まずレコード本体コンテナ先頭へ置く（見切れ対策）。
   */
  const getRecordDetailButtonMountParent = () => {
    const contentFirst = [
      '.gaia-argoui-app-show-contents',
      '.gaia-argoui-app-show-body',
      '.ocean-ui-app-record-view-body',
      '.ocean-ui-app-record-view-layout-content',
      '.layout-gaia',
    ];
    for (const sel of contentFirst) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return getRecordDetailButtonHostEl();
  };

  const install594DetailAccButtons = () => {
    if (document.getElementById(DETAIL_ACC_BTN_WRAP_ID)) return true;
    const host = getRecordDetailButtonMountParent();
    if (!host) return false;

    const cellText = (rec, code) => {
      const c = rec && rec[code];
      if (!c || c.value === undefined || c.value === null) return '';
      return String(c.value).trim();
    };

    const runPcReplacementFlow = async () => {
      const oldId = kintone.app.record.getId();
      let cur = kintone.app.record.get();
      let mail = cellText(cur, FC_594_MAIL);
      let abolishSource = cur;
      let apiRecCache = null;
      const loadApiRec = async () => {
        if (apiRecCache) return apiRecCache;
        const { record: r } = await get594RecordPayloadById(oldId);
        apiRecCache = r;
        return r;
      };

      /** 詳細の get() に mail が載らないことがある（フォーム未配置・Ocean UI 等）→ API で実体を参照 */
      if (!mail) {
        try {
          const apiRec = await loadApiRec();
          mail = cellText(apiRec, FC_594_MAIL);
          if (mail) abolishSource = apiRec;
        } catch (_e) {
          /* noop */
        }
      }

      if (!mail) {
        alert(
          'メールアドレス（mail）を取得できませんでした。\n' +
            'レコードに値がある場合は、フォームにフィールドコード「mail」を配置して再保存するか、kintone管理画面で値を確認してください。'
        );
        return;
      }

      const abo = abolishSource[FC_594_ABOLISHED_FLAG]?.value || [];
      if (Array.isArray(abo) && abo.includes(ABOLISHED_LABEL)) {
        alert('このレコードはすでに廃止扱いです。PC買替は実行できません。');
        return;
      }

      let prefillCategory = cellText(cur, FC_594_CATEGORY);
      let prefillShared = cellText(cur, FC_594_SHARED);
      let prefillType = cellText(cur, FC_594_TYPE);
      if (!prefillCategory || !prefillShared || !prefillType) {
        try {
          const apiRec = await loadApiRec();
          if (!prefillCategory) prefillCategory = cellText(apiRec, FC_594_CATEGORY);
          if (!prefillShared) prefillShared = cellText(apiRec, FC_594_SHARED);
          if (!prefillType) prefillType = cellText(apiRec, FC_594_TYPE);
        } catch (_e) {
          /* noop */
        }
      }
      try {
        const rawHub = sessionStorage.getItem(STORAGE_KEY_628_REPLACE_PREFILL);
        if (rawHub) {
          sessionStorage.removeItem(STORAGE_KEY_628_REPLACE_PREFILL);
          const o = JSON.parse(rawHub);
          if (o && typeof o === 'object') {
            if (o.category) prefillCategory = String(o.category).trim();
            if (o.shared_terminal_name != null) prefillShared = String(o.shared_terminal_name).trim();
            if (o.type) prefillType = String(o.type).trim();
          }
        }
      } catch (_e) {
        /* noop */
      }

      open594ReplacementModal(
        {
          category: prefillCategory,
          sharedName: prefillShared,
          typeVal: prefillType,
        },
        async ({ category, sharedName, typeVal }) => {
          let rollback596 = async () => {};
          try {
            if (!(await peek596HasUnused())) {
              alert(
                'PC採番マスタ(596)に未使用の番号がありません。処理を中止しました（594・596は未変更です）。'
              );
              return;
            }

            const claim = await claimPcNumberFrom596ForReplacementApi();
            if (!claim) {
              alert(
                'PC採番マスタ(596)に未使用の番号がありません。処理を中止しました（594・596は未変更です）。'
              );
              return;
            }
            rollback596 = claim.rollback596;

            const { record: src } = await get594RecordPayloadById(oldId);
            const postBody = build594ReplacementPostRecord(src, {
              category,
              sharedName,
              typeVal,
              pcName: claim.newPcName,
            });

            const created = await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
              app: kintone.app.getId(),
              record: postBody,
            });
            const newId = created.id;

            const { revision: oldRev } = await get594RecordPayloadById(oldId);
            if (!oldRev) {
              alert(
                `新規594（レコード ${newId}）は作成済みですが、旧レコードのリビジョンが取得できませんでした。旧レコードを手作業で廃止してください。`
              );
              sessionStorage.setItem(STORAGE_KEY_594_REPLACE_NOTICE, '1');
              location.href = `${location.origin}/k/${kintone.app.getId()}/show?record=${encodeURIComponent(String(newId))}`;
              return;
            }

            try {
              await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                app: kintone.app.getId(),
                id: oldId,
                revision: oldRev,
                record: {
                  [FC_594_ABOLISHED_FLAG]: { value: [ABOLISHED_LABEL] },
                  [FC_594_STATUS]: { value: STATUS_AFTER_REPLACE_OLD },
                },
              });
            } catch (eUpd) {
              alert(
                `新規594（レコード ${newId}）は作成済みですが、旧レコードの廃止更新に失敗しました。旧レコードを手作業で廃止してください。\n詳細: ${eUpd?.message || String(eUpd)}`
              );
              sessionStorage.setItem(STORAGE_KEY_594_REPLACE_NOTICE, '1');
              location.href = `${location.origin}/k/${kintone.app.getId()}/show?record=${encodeURIComponent(String(newId))}`;
              return;
            }

            try {
              const { record: newRec } = await get594RecordPayloadById(newId);
              const sync = await sync627From594ApiRecord(newRec);
              if (!sync.ok) {
                alert(
                  'PC買替は完了しました（旧594は廃棄更新済み）。\n\n' +
                    `627（アカウント管理台帳）の自動反映に失敗しました。\n${sync.message}\n\n` +
                    '新しい 594 詳細画面の「🔗 個人アカウント紐付け」ボタンから紐付け直してください。'
                );
              } else if (sync.notice) {
                alert(`PC買替は完了しました。\n\n${sync.notice}`);
              }
            } catch (eSync) {
              alert(
                'PC買替は完了しましたが、627の自動反映中にエラーが発生しました。\n' +
                  `${eSync?.message || String(eSync)}\n\n` +
                  '627の画面で手動更新してください。'
              );
            }

            sessionStorage.setItem(STORAGE_KEY_594_REPLACE_NOTICE, '1');
            location.href = `${location.origin}/k/${kintone.app.getId()}/show?record=${encodeURIComponent(String(newId))}`;
          } catch (e) {
            try {
              await rollback596();
            } catch (_r) {
              /* noop */
            }
            alert(
              `PC買替に失敗しました。新規594は作成されていません（596の採番は取り消しを試みました）。\n${e?.message || String(e)}`
            );
          }
        }
      );
    };

    const btnReplace = makeSecondaryButton('PC買替');
    btnReplace.onclick = () => {
      void runPcReplacementFlow();
    };

    // 旧「アカウント管理台帳(627) 作成/更新して開く」ボタンは 2026-04-19 に廃止。
    // 代わりに種別 = 個人 のとき maybeAddPersonalButton (検索 + 既存選択 or 新規作成のモーダル UX),
    // 種別 = 共有 のとき maybeAddSharedButton が表示される。
    // サーバーNAS / その他 / JR端末 はアカウント設定対象外のためボタン無し。

    const wrap = document.createElement('div');
    wrap.id = DETAIL_ACC_BTN_WRAP_ID;
    wrap.className = 'jbis594-detail-acc001';
    wrap.dataset.jbis594 = 'detail-actions';
    wrap.style.cssText =
      'display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%;box-sizing:border-box;' +
      'margin:0 0 10px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;';
    wrap.appendChild(btnReplace);
    host.insertBefore(wrap, host.firstChild);
    maybeAddPersonalButton(wrap);
    maybeAddSharedButton(wrap);
    return true;
  };

  const schedule594DetailAccButtonMount = () => {
    if (install594DetailAccButtons()) return;
    [80, 250, 700, 1600, 2800].forEach((ms) => {
      setTimeout(() => {
        install594DetailAccButtons();
      }, ms);
    });
  };

  // ── M3: PC台帳 詳細画面 アクションパネル（コピー/相互リンク） ─────────
  const JBIS594_ACTION_PANEL_ID = 'jbis594-action-panel';
  const build627RecordUrl = (id) => {
    const u = new URL(`${location.origin}/k/${LEDGER_APP_ID}/show`);
    u.searchParams.set('record', String(id));
    return u.toString();
  };

  const findLinked627RecordIds = async (pc594Id) => {
    const idStr = String(pc594Id || '').trim();
    if (!idStr || !/^\d+$/.test(idStr)) return [];
    const ids = new Set();
    try {
      // サブテーブル内フィールド（pc_ledger_link_594_id）は = 演算子非対応のため in() を使う。
      // 親フィールド（pc_594_record_id）は通常の単一行なので = で問題なし。
      const q = `pc_594_record_id = "${idStr}" or pc_ledger_link_594_id in ("${idStr}")`;
      const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: LEDGER_APP_ID,
        query: `${q} order by $id asc limit 500`,
        fields: ['$id'],
      });
      (res.records || []).forEach((r) => {
        const v = String(r.$id?.value || '').trim();
        if (v) ids.add(v);
      });
    } catch (e) {
      console.warn('[JBIS-594] findLinked627RecordIds failed', e);
    }
    return Array.from(ids);
  };

  /**
   * 627 に1件も紐付いていない 594 で、ledger_record_id（台帳番号のミラー）だけ残っている行を空にする。
   * 各件の更新直前に findLinked627RecordIds を再実行し、他ユーザーが紐付け直した場合はスキップ。
   * 数値の ledger に対応する 627 行に、この PC への古い参照が残っていれば先に外す（レコード削除なし）。
   * @param {Array<{ id: string, lid: string }>} targets
   */
  const bulkClear594OrphanLedgerMirrors = async (targets) => {
    const app594 = kintone.app.getId();
    let cleared = 0;
    let skipped = 0;
    let failed = 0;
    const errors = /** @type {string[]} */ ([]);
    for (const t of targets) {
      const pid = String(t.id || '').trim();
      const lidRaw = String(t.lid || '').trim();
      if (!pid || !/^\d+$/.test(pid)) {
        skipped++;
        continue;
      }
      if (!lidRaw || !/^\d+$/.test(lidRaw)) {
        skipped++;
        continue;
      }
      try {
        const linked0 = await findLinked627RecordIds(pid);
        if (linked0.length) {
          skipped++;
          continue;
        }
        try {
          const res627 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
            app: LEDGER_APP_ID,
            id: lidRaw,
          });
          const rec627 = res627.record || {};
          const patch627 = build627UnlinkPatchForPc594(rec627, pid);
          if (Object.keys(patch627).length > 0) {
            await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
              app: LEDGER_APP_ID,
              id: lidRaw,
              revision: rec627.$revision?.value,
              record: patch627,
            });
          }
        } catch (e627) {
          console.warn('[JBIS-594] bulkClear594OrphanLedgerMirrors 627 patch skip', pid, lidRaw, e627);
        }

        const linked1 = await findLinked627RecordIds(pid);
        if (linked1.length) {
          skipped++;
          continue;
        }
        const r594 = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
          app: app594,
          id: pid,
        });
        const rec594 = r594.record || {};
        const curLed = String(rec594[FC_594_LEDGER_RECORD_ID]?.value ?? '').trim();
        if (!curLed) {
          skipped++;
          continue;
        }
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
          app: app594,
          id: pid,
          revision: rec594.$revision?.value,
          record: { [FC_594_LEDGER_RECORD_ID]: { value: null } },
        });
        cleared++;
      } catch (e) {
        failed++;
        errors.push(`${pid}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return { cleared, skipped, failed, errors };
  };

  // ===== PC↔アカウント相関ダッシュボード =====
  // 設計趣旨: 「PC台帳のPC1件 ＝ 1行」で、紐付くWindowsIDとフラグを俯瞰できる別画面。
  // フラグ定義（2026-04-18 修正）:
  //   ✅ 正常        … このPCに紐付く 627 アカウントが 1 件以上、または「アカウント設定対象外」種別
  //   🟠 重複あり    … このPCに 2 件以上のアカウントが紐付いている
  //   🟡 紐付けなし  … 627 上で 1 件もこのPCに紐付いていない（ただし下記対象外種別を除く）
  //   ※ 594 の ledger_record_id は保存時のミラー用フィールドのため、627 側の紐付けが外れても
  //     自動では消えないことがある（🟡 かつ台帳番号あり＝取り残し）。詳細の紐付け解除・下の一括クリアで整える。
  // アカウント設定対象外 PC 種別（紐付けなし扱いしない）:
  //   - "サーバーNAS" : サーバ/NAS は AD アカウントを割り当てない運用
  //   - "その他"      : 同上
  const QD_NO_ACCT_REQUIRED_TYPES = new Set(['サーバーNAS', 'その他']);
  const qdIsNoAcctRequiredType = (raw) => {
    const v = String(raw ?? '').trim();
    return QD_NO_ACCT_REQUIRED_TYPES.has(v);
  };
  const QD_LOCAL_LOGON_PLACEHOLDER = 'ローカルアカウント';
  const qdNormLogon = (raw) => {
    const v = String(raw ?? '');
    try { return v.normalize('NFKC').trim(); } catch { return v.trim(); }
  };
  const qdIsLocalLogon = (raw) => qdNormLogon(raw) === QD_LOCAL_LOGON_PLACEHOLDER;
  const qdEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const qdLink594 = (id) => `${location.origin}/k/594/show#record=${encodeURIComponent(id)}`;
  const qdLink627 = (id) => `${location.origin}/k/627/show#record=${encodeURIComponent(id)}`;

  const fetchAll594ForDashboard = async () => {
    const url = kintone.api.url('/k/v1/records', true);
    const all = [];
    for (let off = 0; off < 50000; off += 500) {
      const res = await kintone.api(url, 'GET', {
        app: 594,
        query: `$id > 0 order by $id asc limit 500 offset ${off}`,
        fields: ['$id', 'PC_name', 'shared_terminal_name', 'user_name', 'type',
          'dept_name', 'group_name', 'ledger_record_id', 'inventory_finish_date'],
      });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
    }
    return all;
  };

  const fetchAll627ForDashboard = async () => {
    const url = kintone.api.url('/k/v1/records', true);
    const all = [];
    for (let off = 0; off < 50000; off += 500) {
      const res = await kintone.api(url, 'GET', {
        app: LEDGER_APP_ID,
        query: `$id > 0 order by $id asc limit 500 offset ${off}`,
        fields: ['$id', 'logon_name', 'user_name', 'employment_status',
          FC_627_ACCOUNT_TYPE, FC_627_PC_594_RECORD_ID, FC_627_PC_SUBTABLE],
      });
      const recs = res?.records ?? [];
      all.push(...recs);
      if (recs.length < 500) break;
    }
    return all;
  };

  const buildQualityRows = (recs594, recs627) => {
    // 627 → 紐付く 594ID 集合へ展開
    const link594ToAccts = new Map(); // pc594Id -> [{$id, logon, user, status, type}]
    const logonToCount = new Map();   // normalizedLogon -> count（"ローカルアカウント"/空 は除外済）
    const logonToAccts = new Map();   // normalizedLogon -> [{$id, logon}]
    for (const r of recs627) {
      const aid = String(r.$id?.value || '').trim();
      if (!aid) continue;
      const logonRaw = r.logon_name?.value ?? '';
      const logonNorm = qdNormLogon(logonRaw);
      if (logonNorm && !qdIsLocalLogon(logonRaw)) {
        logonToCount.set(logonNorm, (logonToCount.get(logonNorm) || 0) + 1);
        if (!logonToAccts.has(logonNorm)) logonToAccts.set(logonNorm, []);
        logonToAccts.get(logonNorm).push({ id: aid, logon: logonRaw });
      }
      const linked = new Set();
      const single = String(r[FC_627_PC_594_RECORD_ID]?.value || '').trim();
      if (single) linked.add(single);
      const rows = r[FC_627_PC_SUBTABLE]?.value || [];
      for (const sr of rows) {
        const v = String(sr?.value?.[FC_627_PC_SUB_594]?.value || '').trim();
        if (v) linked.add(v);
      }
      const acct = {
        id: aid,
        logon: logonRaw,
        logonNorm,
        user: String(r.user_name?.value || '').trim(),
        status: String(r.employment_status?.value || '').trim(),
        type: String(r[FC_627_ACCOUNT_TYPE]?.value || '').trim(),
      };
      for (const pid of linked) {
        if (!link594ToAccts.has(pid)) link594ToAccts.set(pid, []);
        link594ToAccts.get(pid).push(acct);
      }
    }

    // 594 → 各PCの行を組み立て
    const rows = recs594.map((r) => {
      const id = String(r.$id?.value || '').trim();
      const pcName = String(r.PC_name?.value || r.shared_terminal_name?.value || '').trim();
      const userName = String(r.user_name?.value || '').trim();
      const dept = String(r.dept_name?.value || '').trim();
      const group = String(r.group_name?.value || '').trim();
      const type = String(r.type?.value || '').trim();
      const lid = String(r.ledger_record_id?.value || '').trim();
      const accts = link594ToAccts.get(id) || [];
      const cnt = accts.length;

      // フラグ判定はあくまで「このPCに紐付くアカウントの件数」のみで決める。
      // ここを「他PCでもWindowsID流用あり」と混ぜると、件数1件のPCが
      // 重複ありと表示されて利用者が混乱するため、明確に分離する。
      const reasons = [];
      if (cnt >= 2 && type === '個人') {
        reasons.push(`個人PCに ${cnt} 件のアカウントが紐付いています`);
      } else if (cnt >= 2) {
        reasons.push(`このPCに ${cnt} 件のアカウントが紐付いています`);
      }
      // WindowsIDの他PC流用は「参考情報」として備考に出すだけ（フラグは変えない）
      const dupLogonAccts = [];
      for (const a of accts) {
        if (!a.logonNorm) continue;
        if (qdIsLocalLogon(a.logon)) continue;
        const c = logonToCount.get(a.logonNorm) || 0;
        if (c >= 2) {
          const others = (logonToAccts.get(a.logonNorm) || []).filter((x) => x.id !== a.id);
          dupLogonAccts.push({ acct: a, others });
        }
      }

      // サーバーNAS / その他 はアカウント設定対象外。紐付け0件でも 紐付けなし扱いしない。
      const noAcctRequired = qdIsNoAcctRequiredType(type);
      let flag = 'OK';
      if (cnt === 0 && !noAcctRequired) flag = 'NO_LINK';
      else if (cnt >= 2) flag = 'DUP';

      return {
        id, pcName, userName, dept, group, type, lid,
        accts, flag, reasons, dupLogonAccts, noAcctRequired,
      };
    });
    return rows;
  };

  // CSVダウンロード（kintone環境向けの堅牢実装）
  // 1) msSaveOrOpenBlob（IE/旧Edge）優先、2) Blob + a[download]、3) フォールバックで data: URL を新規タブ
  const downloadCsvSafe = (filename, csvText) => {
    const text = (csvText && csvText.startsWith('\ufeff')) ? csvText : ('\ufeff' + (csvText || ''));
    let blob;
    try {
      blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    } catch (e) {
      console.warn('[CSV] Blob() failed, fallback to data URL', e);
      const w = window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(text), '_blank');
      if (!w) alert('CSV出力でポップアップがブロックされました。ブラウザ設定をご確認ください。');
      return;
    }
    if (window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
    const URLObj = window.URL || window.webkitURL;
    const url = URLObj.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    try {
      a.click();
    } catch (e) {
      console.warn('[CSV] a.click() failed, fallback to window.open', e);
      const w = window.open(url, '_blank');
      if (!w) alert('CSV出力でポップアップがブロックされました。ブラウザ設定をご確認ください。');
    }
    setTimeout(() => {
      try { a.remove(); } catch (_) { /* noop */ }
      try { URLObj.revokeObjectURL(url); } catch (_) { /* noop */ }
    }, 1500);
  };

  const renderQualityDashboard = async () => {
    const root = document.getElementById('jbis-quality-dashboard');
    if (!root) return;
    root.style.padding = '0';
    root.innerHTML = `
      <div style="padding:18px 22px 12px;background:linear-gradient(180deg,#0f172a,#1e293b);color:#fff;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-size:20px;font-weight:800;">📊 PC↔アカウント相関ダッシュボード</div>
          <div style="font-size:12px;color:#cbd5e1;">PC台帳(594) × アカウント台帳(627) のデータ品質を1画面で確認</div>
        </div>
        <div style="margin-top:6px;font-size:11px;color:#94a3b8;">
          <b>フラグの定義（このPC自体に紐付く件数で判定）</b>:
          <span style="color:#10b981;">✅ 正常</span>＝紐付け 1 件／
          <span style="color:#f59e0b;">🟠 重複あり</span>＝このPCに 2 件以上のアカウントが紐付き／
          <span style="color:#eab308;">🟡 紐付けなし</span>＝627 に紐付くアカウントが 0 件
          <br><span style="color:#fde047;">※ 594 の「アカウント台帳番号」(<code>ledger_record_id</code>) は別フィールドです。627 の紐付けが 0 でも番号だけ残ることがあります（一覧の列と備考の⚠を参照）。</span>
          <br><span style="color:#94a3b8;">※ 同一WindowsID が他PCでも使われている場合は、フラグには影響させず備考に「ℹ 参考情報」として表示します。</span>
          <br><span style="color:#94a3b8;">※ 種別「サーバーNAS」「その他」はアカウント設定対象外のため、0 件でも 🟡 紐付けなし に含めません（備考に「対象外」と表示）。</span>
        </div>
      </div>
      <div id="qd-summary" style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 22px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-size:13px;">読込中…</div>
      <div style="padding:10px 22px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fff;border-bottom:1px solid #e2e8f0;">
        <input id="qd-q-pc" type="search" placeholder="PC名で検索" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;min-width:180px;">
        <input id="qd-q-user" type="search" placeholder="利用者で検索" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;min-width:160px;">
        <input id="qd-q-dep" type="search" placeholder="部署/グループで検索" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;min-width:200px;">
        <select id="qd-q-type" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;">
          <option value="">種別: すべて</option>
          <option value="個人">個人</option>
          <option value="共有">共有</option>
          <option value="サーバ">サーバ</option>
          <option value="その他">その他</option>
        </select>
        <span style="margin-left:6px;display:inline-flex;gap:6px;align-items:center;">
          <label style="cursor:pointer;font-weight:700;color:#10b981;" title="既定で非表示。担当者が必要な時だけチェックを入れる"><input type="checkbox" id="qd-f-ok"> ✅ 正常</label>
          <label style="cursor:pointer;font-weight:700;color:#b45309;"><input type="checkbox" id="qd-f-dup" checked> 🟠 重複あり</label>
          <label style="cursor:pointer;font-weight:700;color:#a16207;"><input type="checkbox" id="qd-f-no" checked> 🟡 紐付けなし</label>
        </span>
        <button id="qd-reset" type="button" style="margin-left:auto;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:700;">条件をクリア</button>
        <button id="qd-bulk-clear" type="button" style="background:#854d0e;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700;" title="627に紐付き0件なのに594の台帳番号だけ残っている行を、APIで再確認のうえ空にします">🧹 台帳番号の取り残し一括クリア…</button>
        <button id="qd-csv" type="button" style="background:#0f172a;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700;">📥 CSVダウンロード</button>
      </div>
      <div id="qd-table-wrap" style="padding:0 22px 24px;background:#fff;">
        <div id="qd-loading" style="padding:24px;color:#475569;">読込中… (594全件 + 627全件を取得して突合しています)</div>
      </div>
      <div id="qd-fab-group" style="position:fixed;right:20px;bottom:20px;z-index:9999;display:none;flex-direction:column;gap:10px;">
        <button id="qd-fab-filter" type="button" title="検索フィルタへ移動" style="background:#1d4ed8;color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-size:20px;font-weight:700;cursor:pointer;box-shadow:0 6px 16px rgba(15,23,42,0.3);">🔍</button>
        <button id="qd-fab-top" type="button" title="ページ先頭へ" style="background:#0f172a;color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-size:20px;font-weight:700;cursor:pointer;box-shadow:0 6px 16px rgba(15,23,42,0.3);">↑</button>
      </div>
    `;

    let recs594 = [];
    let recs627 = [];
    try {
      [recs594, recs627] = await Promise.all([
        fetchAll594ForDashboard(),
        fetchAll627ForDashboard(),
      ]);
    } catch (e) {
      const wrap = document.getElementById('qd-table-wrap');
      if (wrap) wrap.innerHTML = `<div style="color:#b91c1c;padding:16px;">データ取得失敗: ${qdEsc(e?.message || e)}</div>`;
      return;
    }

    const rows = buildQualityRows(recs594, recs627);
    const totals = { OK: 0, DUP: 0, NO_LINK: 0 };
    rows.forEach((r) => { totals[r.flag] = (totals[r.flag] || 0) + 1; });

    const summary = document.getElementById('qd-summary');
    if (summary) {
      summary.innerHTML = `
        <span style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 12px;">合計 <b>${rows.length}</b> 件</span>
        <span style="background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:6px 12px;color:#166534;">✅ 正常 <b>${totals.OK || 0}</b></span>
        <span style="background:#ffedd5;border:1px solid #fdba74;border-radius:6px;padding:6px 12px;color:#9a3412;">🟠 重複あり <b>${totals.DUP || 0}</b></span>
        <span style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:6px 12px;color:#854d0e;">🟡 紐付けなし <b>${totals.NO_LINK || 0}</b></span>
      `;
    }

    const tableWrap = document.getElementById('qd-table-wrap');
    tableWrap?.addEventListener('click', async (ev) => {
      const t = (ev.target instanceof Element) ? ev.target.closest('[data-clear-orphan]') : null;
      if (!t || !(t instanceof HTMLButtonElement)) return;
      ev.preventDefault();
      const raw = t.getAttribute('data-clear-orphan') || '';
      const [pid, lid] = raw.split(':');
      if (!/^\d+$/.test(pid) || !/^\d+$/.test(lid)) return;
      const msg =
        '【594の台帳番号をクリアしますか?】\n\n' +
        `対象PC: PC台帳(594) レコード番号 ${pid}\n` +
        `クリア対象: 594の台帳番号 ${lid}\n\n` +
        '▼ どうなりますか?\n' +
        '・このPCは「アカウント未紐付け(番号のみ残存)」状態です\n' +
        `・残っている台帳番号(${lid})だけをクリアします\n` +
        '・アカウントの登録自体は触りません\n\n' +
        '▼ 安全のため\n' +
        '・実行直前にAPIで再確認し、紐付けが付き直していたらスキップします\n\n' +
        '実行しますか?';
      if (!confirm(msg)) return;
      const orig = t.textContent;
      t.disabled = true;
      t.textContent = '処理中…';
      try {
        const res = await bulkClear594OrphanLedgerMirrors([{ id: pid, lid }]);
        if (res.cleared > 0) {
          alert('クリアしました(594の台帳番号 1件)。画面を再読み込みします。');
          location.reload();
        } else if (res.skipped > 0) {
          alert('スキップしました(再確認したらアカウントが紐付いていました)。画面を再読み込みします。');
          location.reload();
        } else {
          const tail = res.errors.length ? `\n\n${res.errors.slice(0, 3).join('\n')}` : '';
          alert(`クリアできませんでした。${tail}`);
          t.disabled = false;
          t.textContent = orig;
        }
      } catch (e) {
        alert(`エラー: ${e instanceof Error ? e.message : String(e)}`);
        t.disabled = false;
        t.textContent = orig;
      }
    });

    const renderTable = () => {
      const qPc = (document.getElementById('qd-q-pc')?.value || '').trim().toLowerCase();
      const qUser = (document.getElementById('qd-q-user')?.value || '').trim().toLowerCase();
      const qDep = (document.getElementById('qd-q-dep')?.value || '').trim().toLowerCase();
      const qType = document.getElementById('qd-q-type')?.value || '';
      const fOk = !!document.getElementById('qd-f-ok')?.checked;
      const fDup = !!document.getElementById('qd-f-dup')?.checked;
      const fNo = !!document.getElementById('qd-f-no')?.checked;
      const filtered = rows.filter((r) => {
        if (qPc && !(`${r.pcName}`).toLowerCase().includes(qPc)) return false;
        if (qUser && !(`${r.userName}`).toLowerCase().includes(qUser)) return false;
        if (qDep && !(`${r.dept} ${r.group}`).toLowerCase().includes(qDep)) return false;
        if (qType && r.type !== qType) return false;
        if (r.flag === 'OK' && !fOk) return false;
        if (r.flag === 'DUP' && !fDup) return false;
        if (r.flag === 'NO_LINK' && !fNo) return false;
        return true;
      });

      // テーブル生成
      const flagCell = (f) => {
        if (f === 'OK') return '<span style="color:#166534;font-weight:700;">✅ 正常</span>';
        if (f === 'DUP') return '<span style="color:#9a3412;font-weight:700;">🟠 重複あり</span>';
        return '<span style="color:#854d0e;font-weight:700;">🟡 紐付けなし</span>';
      };
      const acctCell = (accts) => {
        if (!accts || accts.length === 0) return '<span style="color:#9ca3af;">— なし —</span>';
        return accts.map((a) => {
          const stIco = a.status === '退職' ? '🪦' : (a.status === '休職' ? '⏸' : '');
          const lblLogon = a.logon ? qdEsc(a.logon) : '<span style="color:#9ca3af;">(空)</span>';
          const lblUser = a.user ? qdEsc(a.user) : '';
          const lblType = a.type ? `<span style="color:#64748b;">[${qdEsc(a.type)}]</span>` : '';
          return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;border-bottom:1px dashed #f1f5f9;">
            ${stIco ? `<span title="${qdEsc(a.status)}">${stIco}</span>` : ''}
            <a href="${qdLink627(a.id)}" target="_blank" rel="noopener" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${lblLogon}</a>
            ${lblUser ? `<span style="color:#475569;">${lblUser}</span>` : ''}
            ${lblType}
          </div>`;
        }).join('');
      };
      const remarkCell = (r) => {
        const parts = [];
        if (r.type) parts.push(`種別: ${qdEsc(r.type)}`);
        if (r.noAcctRequired && r.accts.length === 0) {
          parts.push(`<span style="color:#475569;background:#f1f5f9;padding:1px 6px;border-radius:4px;font-weight:700;">⚪ アカウント設定対象外（${qdEsc(r.type)}）</span>`);
        }
        if (r.dept || r.group) parts.push(`所属: ${qdEsc([r.dept, r.group].filter(Boolean).join(' / '))}`);
        if (r.lid && !/^\d+$/.test(r.lid)) parts.push(`<span style="color:#b91c1c;">ledger_record_id 異常: ${qdEsc(r.lid)}</span>`);
        if (r.flag === "NO_LINK" && r.lid) {
          parts.push(
            '<span style="color:#b45309;">⚠ アカウント台帳番号(<code>ledger_record_id</code>)のみ残存: 627側にこのPCへの紐付けがありません。番号のクリアまたは627の紐付け修正を検討してください。</span>',
          );
        }
        if (r.reasons && r.reasons.length > 0) {
          for (const rs of r.reasons) parts.push(`<span style="color:#9a3412;">⚠ ${qdEsc(rs)}</span>`);
        }
        if (r.dupLogonAccts && r.dupLogonAccts.length > 0) {
          for (const d of r.dupLogonAccts) {
            const links = d.others.slice(0, 5).map((o) => `<a href="${qdLink627(o.id)}" target="_blank" rel="noopener" style="color:#1d4ed8;">#${qdEsc(o.id)}</a>`).join(', ');
            // フラグには影響しない参考情報。グレートーンで提示。
            parts.push(`<span style="color:#475569;">ℹ 同一WindowsID(${qdEsc(d.acct.logon)}) 他レコードでも使用: ${links}</span>`);
          }
        }
        return parts.length > 0 ? parts.join('<br>') : '<span style="color:#9ca3af;">—</span>';
      };

      // 通常のヘッダー（Kintone埋め込みでは sticky が不安定なため、表内では使わない）
      const headerStyle = 'background:#0f172a;color:#fff;padding:10px 8px;text-align:left;font-size:12px;font-weight:700;border-bottom:2px solid #334155;';
      const cellBase = 'padding:8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:13px;';
        const lidCell = (r) => {
          const v = String(r.lid || '').trim();
          if (!v) return '<span style="color:#9ca3af;">—</span>';
          const isNum = /^\d+$/.test(v);
          const inner = isNum
            ? `<a href="${qdLink627(v)}" target="_blank" rel="noopener" style="color:#1d4ed8;font-weight:700;text-decoration:none;">${qdEsc(v)}</a>`
            : `<span style="color:#b91c1c;font-weight:700;">${qdEsc(v)}</span>`;
          if (r.flag === 'NO_LINK' && v) {
            if (isNum) {
              const tip = 'アカウント台帳(627)側にこのPCへの紐付けがないため、594の台帳番号だけが単独で残っています。「クリアする」を押すと、この行の番号だけを空にします(下の「🧹 一括クリア」と同じ動きを1件だけ実行)。';
              const dataAttr = `${qdEsc(r.id)}:${qdEsc(v)}`;
              return `<div title="${qdEsc(tip)}">${inner}<div style="margin-top:3px;"><button type="button" data-clear-orphan="${dataAttr}" style="padding:3px 10px;font-size:10px;color:#fff;background:#b45309;border:1px solid #92400e;border-radius:4px;font-weight:700;cursor:pointer;line-height:1.3;">⚠ アカウント未紐付け<br>(番号のみ残存) — クリアする</button></div></div>`;
            }
            return `<div title="${qdEsc('数値以外の異常値が入っています。PC台帳の詳細から手修正してください。')}" style="cursor:help;">${inner}<div style="font-size:10px;color:#b91c1c;font-weight:700;margin-top:2px;">⚠ 異常値・要手修正</div></div>`;
          }
          return inner;
        };
        const rowsHtml = filtered.map((r, i) => {
        const bg = r.flag === 'DUP' ? '#fff7ed' : (r.flag === 'NO_LINK' ? '#fefce8' : (i % 2 === 0 ? '#ffffff' : '#f8fafc'));
        return `<tr style="background:${bg};">
          <td style="${cellBase}text-align:right;color:#64748b;font-variant-numeric:tabular-nums;font-weight:700;width:48px;">${i + 1}</td>
          <td style="${cellBase}font-weight:700;">
            <a href="${qdLink594(r.id)}" target="_blank" rel="noopener" style="color:#0f172a;text-decoration:none;">${qdEsc(r.pcName) || '<span style="color:#9ca3af;">(PC名なし)</span>'}</a>
            <div style="font-size:10px;color:#64748b;font-weight:400;">#${qdEsc(r.id)}</div>
          </td>
          <td style="${cellBase}">${qdEsc(r.userName) || '<span style="color:#9ca3af;">—</span>'}</td>
          <td style="${cellBase}">${acctCell(r.accts)}</td>
          <td style="${cellBase}text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums;">${lidCell(r)}</td>
          <td style="${cellBase}text-align:center;white-space:nowrap;">${flagCell(r.flag)}<div style="font-size:10px;color:#64748b;margin-top:2px;">${r.accts.length}件</div></td>
          <td style="${cellBase}font-size:11px;">${remarkCell(r)}</td>
        </tr>`;
      }).join('');

      tableWrap.innerHTML = `
        <div style="margin:10px 0 6px;color:#475569;font-size:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span>表示中: <b>${filtered.length}</b> / ${rows.length} 件</span>
          <a href="#qd-summary" id="qd-jump-top" style="color:#1d4ed8;text-decoration:none;font-weight:600;">↑ 検索フィルタへ戻る</a>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;background:#fff;">
            <thead><tr>
              <th style="${headerStyle}width:48px;text-align:right;">No.</th>
              <th style="${headerStyle}min-width:180px;">PC名（キー）</th>
              <th style="${headerStyle}min-width:120px;">利用者</th>
              <th style="${headerStyle}min-width:300px;">紐付くWindowsID（行ごと）</th>
              <th style="${headerStyle}min-width:100px;">594の台帳番号<br><span style="font-weight:400;font-size:10px;opacity:.9">ledger_record_id</span></th>
              <th style="${headerStyle}min-width:110px;">フラグ</th>
              <th style="${headerStyle}min-width:240px;">備考</th>
            </tr></thead>
            <tbody>${rowsHtml || '<tr><td colspan="7" style="padding:24px;text-align:center;color:#94a3b8;">該当なし</td></tr>'}</tbody>
          </table>
        </div>
      `;
    };

    ['qd-q-pc', 'qd-q-user', 'qd-q-dep'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', renderTable);
    });
    document.getElementById('qd-q-type')?.addEventListener('change', renderTable);
    ['qd-f-ok', 'qd-f-dup', 'qd-f-no'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', renderTable);
    });
    document.getElementById('qd-reset')?.addEventListener('click', () => {
      ['qd-q-pc', 'qd-q-user', 'qd-q-dep'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const ts = document.getElementById('qd-q-type');
      if (ts) ts.value = '';
      ['qd-f-ok', 'qd-f-dup', 'qd-f-no'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
      });
      renderTable();
    });
    document.getElementById('qd-bulk-clear')?.addEventListener('click', async () => {
      const targets = rows
        .filter((r) => r.flag === 'NO_LINK'
          && String(r.lid || '').trim()
          && /^\d+$/.test(String(r.lid || '').trim()))
        .map((r) => ({ id: r.id, lid: String(r.lid).trim() }));
      if (!targets.length) {
        alert(
          '「🟡 紐付けなし」かつ、数値の「594の台帳番号」(ledger_record_id) が入っている行がありません。\n' +
            '（番号が空、または数値以外の不正値だけの場合は、PC台帳の詳細から手修正してください。）',
        );
        return;
      }
      const msg =
        `【台帳番号の取り残し一括クリア】\n\n627 にこの PC への紐付けが 0 件で、594 の台帳番号だけ数値で残っている行が ${targets.length} 件あります。\n\n` +
        '・各件について API で再確認し、紐付けが付いていなければ 594 の番号を空にします。\n' +
        '・番号が指す 627 に、この PC への古い参照があれば先に外します（627のレコード削除はしません）。\n\n実行しますか？';
      if (!confirm(msg)) return;
      const btn = document.getElementById('qd-bulk-clear');
      const orig = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = '処理中…';
      }
      try {
        const res = await bulkClear594OrphanLedgerMirrors(targets);
        const tail = res.errors.length
          ? `\n\n失敗内訳（先頭5件）:\n${res.errors.slice(0, 5).join('\n')}`
          : '';
        alert(
          `完了しました。\n・594 の台帳番号を空にした件数: ${res.cleared}\n` +
            `・スキップ（再照会で紐付けあり等）: ${res.skipped}\n・失敗: ${res.failed}${tail}\n\n一覧を最新にするため再読み込みします。`,
        );
        location.reload();
      } catch (e) {
        alert(`エラー: ${e instanceof Error ? e.message : String(e)}`);
        if (btn) {
          btn.disabled = false;
          btn.textContent = orig || '🧹 台帳番号の取り残し一括クリア…';
        }
      }
    });

    document.getElementById('qd-csv')?.addEventListener('click', () => {
      const btn = document.getElementById('qd-csv');
      const origLabel = btn?.textContent;
      try {
        if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }
        const header = ['No.', 'PC名', 'PC台帳レコード番号', '利用者', '部署', 'グループ', '種別', 'ledger_record_id',
          '紐付くWindowsID', '紐付くアカウント利用者名', '紐付くアカウント在籍状態', '紐付き件数', 'フラグ', 'アカウント設定対象外', '備考'];
        const lines = [header.join(',')];
        const csvEsc = (s) => {
          const v = String(s ?? '');
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        };
        rows.forEach((r, i) => {
          const logons = r.accts.map((a) => a.logon).join(' / ');
          const users = r.accts.map((a) => a.user).join(' / ');
          const sts = r.accts.map((a) => a.status).join(' / ');
          const flagText = r.flag === 'OK' ? '正常' : (r.flag === 'DUP' ? '重複あり' : '紐付けなし');
          const remarks = r.reasons.join(' / ');
          const noAcctText = r.noAcctRequired ? 'はい' : '';
          lines.push([i + 1, r.pcName, r.id, r.userName, r.dept, r.group, r.type, r.lid,
            logons, users, sts, r.accts.length, flagText, noAcctText, remarks].map(csvEsc).join(','));
        });
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const filename = `pc-account-quality-${stamp}.csv`;
        const csvText = '\ufeff' + lines.join('\r\n');
        downloadCsvSafe(filename, csvText);
      } catch (e) {
        console.error('[JBIS-594] CSV download failed', e);
        alert(`CSVダウンロードに失敗しました。\n${e?.message || e}\nコンソール(F12) もご確認ください。`);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origLabel || '📥 CSVダウンロード'; }
      }
    });

    renderTable();

    // フローティングボタン群（🔍 フィルタへ / ↑ ページ先頭へ）
    // Kintone埋め込みではページ全体・カスタムビューコンテナの両方がスクロールしうるので両方を監視する
    const fabGroup = document.getElementById('qd-fab-group');
    const fabTop = document.getElementById('qd-fab-top');
    const fabFilter = document.getElementById('qd-fab-filter');
    const findScrollHosts = () => {
      const hosts = new Set();
      hosts.add(window);
      let el = document.getElementById('jbis-quality-dashboard');
      while (el && el !== document.body) {
        try {
          const cs = window.getComputedStyle(el);
          if (cs && /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
            hosts.add(el);
          }
        } catch (_) { /* noop */ }
        el = el.parentElement;
      }
      return [...hosts];
    };
    const getScrollY = () => {
      let max = window.pageYOffset || document.documentElement.scrollTop || 0;
      for (const h of findScrollHosts()) {
        if (h !== window && typeof h.scrollTop === 'number') {
          max = Math.max(max, h.scrollTop);
        }
      }
      return max;
    };
    const scrollAllTo = (y) => {
      try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, y); }
      for (const h of findScrollHosts()) {
        if (h !== window) {
          try { h.scrollTo({ top: y, behavior: 'smooth' }); } catch (_) { h.scrollTop = y; }
        }
      }
    };
    const updateFabVisibility = () => {
      if (!fabGroup) return;
      fabGroup.style.display = getScrollY() > 200 ? 'flex' : 'none';
    };
    window.addEventListener('scroll', updateFabVisibility, { passive: true });
    // 内部スクロールコンテナにもイベントを張る
    setTimeout(() => {
      for (const h of findScrollHosts()) {
        if (h !== window) {
          try { h.addEventListener('scroll', updateFabVisibility, { passive: true }); } catch (_) { /* noop */ }
        }
      }
      updateFabVisibility();
    }, 300);
    updateFabVisibility();
    fabTop?.addEventListener('click', () => scrollAllTo(0));
    fabFilter?.addEventListener('click', () => {
      const target = document.getElementById('qd-summary');
      if (target) {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (_) {
          target.scrollIntoView();
        }
      } else {
        scrollAllTo(0);
      }
      setTimeout(() => document.getElementById('qd-q-pc')?.focus(), 400);
    });
  };

  const resolve594DetailMountParent = () => {
    const selectors = [
      '.gaia-argoui-app-show-contents',
      '.gaia-argoui-app-show-body',
      '.ocean-ui-app-record-view-body',
      '.ocean-ui-app-record-view-layout-content',
      '.layout-gaia',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    try {
      const sp = kintone.app?.record?.getHeaderMenuSpaceElement?.();
      if (sp) return sp;
    } catch { /* noop */ }
    return null;
  };

  const mount594ActionPanel = async () => {
    if (document.getElementById(JBIS594_ACTION_PANEL_ID)) return true;
    const host = resolve594DetailMountParent();
    if (!host) return false;

    let cur;
    try { cur = kintone.app.record.get(); } catch (_) { cur = null; }
    const rec = cur?.record;
    if (!rec) return false;

    const pcId = String(cur?.id || rec?.$id?.value || '').trim();
    const pcName = String(rec[FC_594_PC_NAME]?.value || '').trim();
    const ledgerSingle = String(rec[FC_594_LEDGER_RECORD_ID]?.value || '').trim();
    const typeVal = String(rec[FC_594_TYPE]?.value || '').trim();

    const wrap = document.createElement('div');
    wrap.id = JBIS594_ACTION_PANEL_ID;
    wrap.style.cssText =
      'display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;box-sizing:border-box;' +
      'margin:0 0 10px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;';

    const badgeStyle =
      'display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;' +
      'border:1px solid #cbd5e1;background:#ffffff;color:#0f172a;font-size:12px;font-weight:900;';

    const makeCopyButton = (text, valueToCopy) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.style.cssText =
        'padding:4px 10px;border-radius:6px;border:1px solid #1d4ed8;' +
        'background:#eff6ff;color:#1d4ed8;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap;';
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(String(valueToCopy));
          const orig = btn.textContent;
          btn.textContent = 'コピー済み';
          setTimeout(() => { btn.textContent = orig; }, 1200);
        } catch {
          alert('コピーできませんでした。手動で選択してコピーしてください。');
        }
      });
      return btn;
    };

    if (pcId) {
      const selfId = document.createElement('span');
      selfId.style.cssText = badgeStyle;
      selfId.textContent = `PC台帳番号(594): ${pcId}`;
      wrap.appendChild(selfId);
      wrap.appendChild(makeCopyButton('コピー', pcId));
    }

    if (pcName) {
      const pcNameBadge = document.createElement('span');
      pcNameBadge.style.cssText = badgeStyle;
      pcNameBadge.textContent = `PC名: ${pcName}`;
      wrap.appendChild(pcNameBadge);
    }

    if (typeVal) {
      const t = document.createElement('span');
      t.style.cssText = badgeStyle;
      t.textContent = `種別: ${typeVal}`;
      wrap.appendChild(t);
    }

    const linkArea = document.createElement('div');
    linkArea.style.cssText = 'flex-basis:100%;font-size:12px;color:#475569;';
    linkArea.textContent = 'アカウント台帳(627) との紐付け: 検索中…';
    wrap.appendChild(linkArea);

    const warn = document.createElement('div');
    warn.style.cssText =
      'flex-basis:100%;font-size:12px;line-height:1.5;color:#b91c1c;font-weight:900;padding:2px 2px 0 2px;';
    warn.textContent =
      '【入力注意】紐付けに使う番号は「一覧の行番号」ではなく、各レコードの「レコード番号($id)」です。';
    wrap.appendChild(warn);

    host.insertBefore(wrap, host.firstChild);

    try {
      const linked627Ids = await findLinked627RecordIds(pcId);
      const candidates = new Set(linked627Ids);
      if (ledgerSingle && /^\d+$/.test(ledgerSingle)) candidates.add(ledgerSingle);
      const ids = Array.from(candidates);
      const has594LedgerNum = !!(ledgerSingle && /^\d+$/.test(String(ledgerSingle).trim()));

      /** 627⇔594 の参照解除（627は該当PC分のみ・594は台帳番号のみ）。627レコード削除はしない。 */
      const attachUnlinkToolbar = () => {
        const targetLedgerIds = [
          ...new Set(
            [...linked627Ids, ...(has594LedgerNum ? [String(ledgerSingle).trim()] : [])]
              .map((x) => String(x || '').trim())
              .filter((x) => /^\d+$/.test(x)),
          ),
        ];
        if (targetLedgerIds.length === 0 && !has594LedgerNum) return;

        const tb = document.createElement('div');
        tb.style.cssText =
          'flex-basis:100%;margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;' +
          'display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;';
        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:11px;color:#64748b;flex:1;min-width:200px;line-height:1.45;';
        hint.innerHTML =
          '<b>紐付けを外すと…</b>：このPCに紐付いているアカウント台帳側の「PC欄」と、' +
          'このPC側の「アカウント台帳番号」を空にします。' +
          '<b>アカウントの登録自体は消えません</b>（氏名・パスワード等もそのまま）。';
        const btn = document.createElement('button');
        btn.type = 'button';
        const BTN_LABEL_594 = 'このPCからアカウントの紐付けを外す…';
        btn.textContent = BTN_LABEL_594;
        btn.style.cssText =
          'padding:6px 12px;border-radius:6px;border:1px solid #b45309;background:#fff7ed;' +
          'color:#9a3412;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;';
        btn.addEventListener('click', async () => {
          const msg =
            '【このPCから「アカウントの紐付け」を外します】\n\n' +
            `対象PC: PC台帳(594) レコード番号 ${pcId}\n\n` +
            '▼ どうなりますか?\n' +
            '・アカウント台帳(627) 側の「PC欄」から、このPCへの参照だけを外します\n' +
            '・このPC側の「アカウント台帳番号」を空にします\n' +
            '・アカウント自体(氏名・パスワード・WindowsID等)は削除しません\n\n' +
            '▼ 元に戻すには\n' +
            '・もう一度紐付け直す操作が必要です(自動では戻りません)\n\n' +
            '実行しますか?';
          if (!confirm(msg)) return;
          btn.disabled = true;
          btn.textContent = '処理中…';
          try {
            const res = await unlinkPc594FromLedgerRecords(pcId, targetLedgerIds);
            if (!res.ok) {
              alert(`アカウントの紐付けを外せませんでした。\n\n${res.message || ''}`);
              btn.disabled = false;
              btn.textContent = BTN_LABEL_594;
              return;
            }
            alert(`アカウントの紐付けを外しました(更新したアカウント台帳: ${res.touched627} 件)。画面を再読み込みします。`);
            location.reload();
          } catch (e) {
            alert(`エラー: ${e instanceof Error ? e.message : String(e)}`);
            btn.disabled = false;
            btn.textContent = BTN_LABEL_594;
          }
        });
        tb.appendChild(hint);
        tb.appendChild(btn);
        wrap.appendChild(tb);
      };

      linkArea.innerHTML = '';
      if (ids.length === 0) {
        const note = document.createElement('span');
        note.style.cssText = 'color:#b45309;font-weight:800;';
        note.textContent = (typeVal === '共有')
          ? '⚠ 紐付くアカウント台帳がまだありません。上の「🔗 共有アカウント紐付け」から登録してください。'
          : (typeVal === '個人')
            ? '⚠ 紐付くアカウント台帳がまだありません。上の「🔗 個人アカウント紐付け」から登録してください。'
            : '⚠ 紐付くアカウント台帳がまだありません。';
        linkArea.appendChild(note);
        if (has594LedgerNum) attachUnlinkToolbar();
        return true;
      }

      const details = document.createElement('details');
      details.open = ids.length <= 3;
      const sum = document.createElement('summary');
      sum.textContent = `アカウント台帳を開く（${ids.length}件）`;
      sum.style.cssText =
        'cursor:pointer;color:#1d4ed8;font-weight:800;font-size:12px;user-select:none;';
      details.appendChild(sum);

      const list = document.createElement('div');
      list.style.cssText =
        'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
      ids.forEach((id) => {
        const a = document.createElement('a');
        a.href = build627RecordUrl(id);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `#${id}`;
        a.style.cssText =
          'display:inline-block;padding:2px 8px;border-radius:999px;' +
          'border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;font-weight:800;font-size:12px;text-decoration:none;';
        list.appendChild(a);

        const copyIdBtn = document.createElement('button');
        copyIdBtn.type = 'button';
        copyIdBtn.textContent = '番号コピー';
        copyIdBtn.style.cssText =
          'padding:1px 6px;border-radius:4px;border:1px solid #94a3b8;background:#fff;color:#334155;font-size:10px;cursor:pointer;';
        copyIdBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(String(id));
            copyIdBtn.textContent = 'コピー済み';
            setTimeout(() => { copyIdBtn.textContent = '番号コピー'; }, 1100);
          } catch { /* noop */ }
        });
        list.appendChild(copyIdBtn);
      });
      details.appendChild(list);
      linkArea.appendChild(details);
      attachUnlinkToolbar();
    } catch (e) {
      console.warn('[JBIS-594] action panel link area failed', e);
      linkArea.textContent = 'アカウント台帳との紐付け取得に失敗しました。';
    }
    return true;
  };

  const schedule594ActionPanelMount = () => {
    void mount594ActionPanel();
    [120, 400, 1100, 2200].forEach((ms) => {
      setTimeout(() => { void mount594ActionPanel(); }, ms);
    });
  };

  const on594RecordDetailShow = (event) => {
    ensureGlobalLabelStyle();
    maybeShow594ReplacementNoticeFromStorage();
    maybeShowSharedLinkModalFromStorage();
    schedule594DetailAccButtonMount();
    schedule594ActionPanelMount();
    return event;
  };

  kintone.events.on('app.record.detail.show', on594RecordDetailShow);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.detail.show', on594RecordDetailShow);
  }

  // ── Shared PC: auto-prompt after save ──────────────────────
  const maybeSetSharedLinkStorage = (event) => {
    try {
      const rec = event.record || {};
      const typeVal = (rec[FC_594_TYPE]?.value || '').trim();
      if (typeVal !== '共有') return;
      const ledgerVal = String(rec[FC_594_LEDGER_RECORD_ID]?.value || '').trim();
      if (ledgerVal && /^\d+$/.test(ledgerVal)) return;
      const recId = event.recordId;
      const pcName = (rec[FC_594_PC_NAME]?.value || '').trim();
      if (recId) sessionStorage.setItem(STORAGE_KEY_594_SHARED_LINK, JSON.stringify({ id: recId, pcName }));
    } catch (_e) { console.warn('[JBIS-594] shared link storage error', _e); }
  };
  kintone.events.on('app.record.create.submit.success', (event) => {
    maybeSetSharedLinkStorage(event);
    return event;
  });
  kintone.events.on('app.record.edit.submit.success', (event) => {
    maybeSetSharedLinkStorage(event);
    return event;
  });

  // ─────────────────────────────────────────────────────────────────
  // 関連アプリへの横並び小ナビ（一覧／詳細／作成／編集 すべての画面に常駐）
  // 文字リンクのみ・控えめサイズ。クリックで新規タブで該当アプリを開く。
  // ─────────────────────────────────────────────────────────────────
  const JBIS_RELATED_APPS = [
    { id: '668', label: '利用ガイド' },
    { id: '595', label: '社員情報マスタ' },
    { id: '594', label: 'PC管理台帳' },
    { id: '627', label: 'アカウント管理台帳' },
  ];
  const JBIS_RELATED_NAV_ID = 'jbis-related-apps-nav';
  const JBIS_RELATED_CURRENT_APP_ID = '594';

  const buildRelatedAppsNav = () => {
    const nav = document.createElement('div');
    nav.id = JBIS_RELATED_NAV_ID;
    nav.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 6px;'
      + 'font-size:11px;color:#64748b;line-height:1.6;'
      + 'font-family:"Hiragino Sans","Meiryo",sans-serif;';

    const prefix = document.createElement('span');
    prefix.textContent = '🔗 関連:';
    prefix.style.cssText = 'font-weight:600;color:#475569;';
    nav.appendChild(prefix);

    JBIS_RELATED_APPS.forEach((app, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = '|';
        sep.style.cssText = 'color:#cbd5e1;';
        nav.appendChild(sep);
      }
      if (app.id === JBIS_RELATED_CURRENT_APP_ID) {
        const cur = document.createElement('span');
        cur.textContent = `${app.label}（このアプリ）`;
        cur.style.cssText = 'color:#94a3b8;font-weight:600;';
        nav.appendChild(cur);
      } else {
        const a = document.createElement('a');
        a.href = `/k/${app.id}/`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = app.label;
        a.style.cssText = 'color:#0d9488;text-decoration:none;font-weight:600;';
        a.addEventListener('mouseenter', () => { a.style.textDecoration = 'underline'; });
        a.addEventListener('mouseleave', () => { a.style.textDecoration = 'none'; });
        nav.appendChild(a);
      }
    });
    return nav;
  };

  const mountRelatedAppsNav = () => {
    if (document.getElementById(JBIS_RELATED_NAV_ID)) return true;
    let slot = null;
    try { slot = kintone.app?.record?.getHeaderMenuSpaceElement?.() ?? null; }
    catch { /* noop */ }
    if (!slot) {
      try { slot = kintone.app?.getHeaderMenuSpaceElement?.() ?? null; }
      catch { /* noop */ }
    }
    if (!slot) return false;
    slot.appendChild(buildRelatedAppsNav());
    return true;
  };

  const scheduleRelatedAppsNav = () => {
    [0, 400, 1000].forEach((ms) => {
      setTimeout(() => {
        try { mountRelatedAppsNav(); }
        catch (e) { console.warn('[jbis related-apps-nav]', e); }
      }, ms);
    });
  };

  ['app.record.index.show', 'app.record.detail.show',
    'app.record.create.show', 'app.record.edit.show'].forEach((evt) => {
    kintone.events.on(evt, (event) => {
      scheduleRelatedAppsNav();
      return event;
    });
  });
})();
