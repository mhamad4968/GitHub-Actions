(() => {
  'use strict';

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
  // Restrict heavy custom behavior to known card views only (safe for production).
  const CARD_VIEW_IDS = new Set([13314933, 13314733, 13314927, 13314929, 13314931]);

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
      /* Kintone list background feels flat without custom CSS; add gentle canvas */
      body{
        background:
          radial-gradient(1200px 600px at 8% 0%, rgba(37,99,235,.08), rgba(255,255,255,0) 55%),
          radial-gradient(900px 500px at 95% 5%, rgba(16,185,129,.07), rgba(255,255,255,0) 50%),
          linear-gradient(180deg, rgba(2,6,23,.02), rgba(2,6,23,0) 30%);
      }
      #pc-card-container{
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

  const renderCardsIfNeeded = (event) => {
    const container = document.getElementById('pc-card-container');
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
      schedulePcCardGridSync();
      requestAnimationFrame(() => requestAnimationFrame(syncPcCardGridOffset));
      return;
    }

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
      // 1段目：所属グループ[所属名] 使用者 種別
      title.textContent = `🏢 ${group || ''}${dept ? ` [${dept}]` : ''}   👤 ${user || '未設定'}${type ? ` (${type})` : ''}`.trim();
      const sub = document.createElement('div');
      sub.className = 'jbisPcCard__sub';
      // 2段目：PC名[共有端末名]（大きく表示）
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
      // 3段目：メーカー[モデル] 購入日
      left.textContent = `🛠 ${maker || ''}${model ? ` [${model}]` : ''}`.trim();
      const right = document.createElement('div');
      right.textContent = `💰 購入: ${dop || '-'}`;
      footer.appendChild(left);
      footer.appendChild(right);

      card.appendChild(top);
      card.appendChild(footer);

      // 4段目：最新棚卸日 設置場所
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

      container.appendChild(card);
    }
    schedulePcCardGridSync();
    requestAnimationFrame(() => requestAnimationFrame(syncPcCardGridOffset));
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
    [0, 50, 150, 400, 1000, 2000].forEach((ms) => setTimeout(syncPcCardGridOffset, ms));
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
      '  #jbis-pc-search-panel .jbisAct--ghost{background:#fff;border:1px solid #94a3b8;color:#0f172a;padding:4px 10px;font-weight:600;}' +
      '  #jbis-pc-search-panel .jbisAct--ghost:hover{background:#f8fafc;}' +
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
    [header, header.parentElement].forEach((el) => {
      if (!el) return;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'flex' && cs.flexWrap === 'nowrap') {
        el.style.flexWrap = 'wrap';
      }
    });

    schedulePcCardGridSync();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => {
        invalidatePcCardSpacerCache();
        syncPcCardGridOffset();
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
  const matchesAnyToken = (haystack, tokens) => {
    if (!tokens.length) return true;
    const h = String(haystack || '').toLowerCase();
    return tokens.some((t) => h.includes(String(t).toLowerCase()));
  };

  const fetchAllForCurrentView = async () => {
    const app = kintone.app.getId();
    const qCond = kintone.app.getQueryCondition() || '';
    const qFull = kintone.app.getQuery() || '';
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
      const isCardView = CARD_VIEW_IDS.has(Number(event.viewId));
      if (!isCardView) {
        document.body.classList.remove('jbis594-card-view');
        clear594DefaultListGridSuppressions();
        kintone.app.getHeaderMenuSpaceElement()?.classList.remove('jbis594-header-menu-elevate');
        const oldPanel = document.getElementById('jbis-pc-search-panel');
        if (oldPanel) oldPanel.remove();
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
        return event;
      }
      ensure594CardViewLayerCss();
      document.body.classList.add('jbis594-card-view');
      suppress594DefaultListGrids();

      ensureSearchPanel();
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
      moPack.obs.observe(document.body, { childList: true, subtree: true });
      moPack.timer = setTimeout(() => {
        if (moPack.obs) {
          moPack.obs.disconnect();
          moPack.obs = null;
        }
        moPack.timer = null;
      }, 20000);

      const countEl = document.getElementById('jbis-q-count');
      if (countEl) countEl.textContent = '読込中...';

      // Fetch all records for this view once, then filter on client
      fetchAllForCurrentView().then((allRecs) => {
        const doSearch = () => {
          suppress594DefaultListGrids();
          const panel = document.getElementById('jbis-pc-search-panel');
          const depTokens = expandDepTokens(splitTokens(document.getElementById('jbis-q-dep')?.value || ''));
          const vPc = (document.getElementById('jbis-q-pc')?.value || '').toLowerCase();
          const vUsr = (document.getElementById('jbis-q-usr')?.value || '').toLowerCase();
          const ds = document.getElementById('jbis-ds')?.value || '';
          const de = document.getElementById('jbis-de')?.value || '';
          const shortUnfinished = panel?.dataset.shortUnfinished === '1';
          const shortFyDone = panel?.dataset.shortFyDone === '1';
          const fyStart = panel?.dataset.fyStart || '';
          const fyEnd = panel?.dataset.fyEnd || '';

          const filtered = allRecs.filter((r) => {
            // 所属/所属グループ: token OR search (comma/space separated)
            const depHay = `${getV(r, 'dept_name')} ${getV(r, 'group_name')}`;
            const mDep = matchesAnyToken(depHay, depTokens);
            const mPc = !vPc || (getV(r, 'PC_name') + getV(r, 'shared_terminal_name')).toLowerCase().includes(vPc);
            const mUsr = !vUsr || getV(r, 'user_name').toLowerCase().includes(vUsr);
            const valDop = getV(r, 'dop');
            const valFin = getV(r, 'inventory_finish_date');
            const mD = (!ds || valDop >= ds) && (!de || (valDop <= de && valDop !== ''));
            const mShortUnfinished = !shortUnfinished || !valFin; // 未了: 完了日が空
            const mShortFyDone = !shortFyDone || (!!valFin && (!fyStart || valFin >= fyStart) && (!fyEnd || valFin <= fyEnd));
            return mDep && mPc && mUsr && mD && mShortUnfinished && mShortFyDone;
          });
          if (countEl) countEl.textContent = `${filtered.length}件`;
          renderCardsIfNeeded({ records: filtered });
          schedulePcCardGridSync();
        };

        const panel = document.getElementById('jbis-pc-search-panel');
        const btnUnfinished = document.getElementById('jbis-short-unfinished');
        const btnFyDone = document.getElementById('jbis-short-fy-done');
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

        document.getElementById('jbis-q-btn').onclick = doSearch;
        document.getElementById('jbis-q-rst').onclick = () => {
          ['jbis-q-dep', 'jbis-q-pc', 'jbis-q-usr', 'jbis-ds', 'jbis-de'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          if (panel) {
            panel.dataset.shortUnfinished = '0';
            panel.dataset.shortFyDone = '0';
          }
          const btnUnfinished = document.getElementById('jbis-short-unfinished');
          const btnFyDone = document.getElementById('jbis-short-fy-done');
          if (btnUnfinished) btnUnfinished.setAttribute('aria-pressed', 'false');
          if (btnFyDone) btnFyDone.setAttribute('aria-pressed', 'false');
          doSearch();
        };
        doSearch();
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
                    '627の画面で「アカウント管理台帳(627) 作成/更新して開く」を実行してください。'
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

    const btn = makeButton('アカウント管理台帳(627) 作成/更新して開く');
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const cur = kintone.app.record.get();
        const rec594 = cur?.record;
        if (!rec594) {
          alert('レコードを取得できませんでした。');
          return;
        }
        const r = await sync627From594ApiRecord(rec594);
        if (!r.ok) {
          alert(r.message);
          return;
        }
        if (!r.created) {
          if (r.notice) {
            alert(r.notice);
          } else {
            alert(
              'すでにアカウントはあります。\n' +
                '二重には作りません。このあと 594 の氏名・所属で既存台帳を更新し、別タブで開きます。'
            );
          }
        }
        openLedgerRecord(r.ledgerId);
      } catch (e) {
        alert(`処理に失敗しました: ${e?.message || String(e)}`);
      } finally {
        btn.disabled = false;
      }
    };

    const wrap = document.createElement('div');
    wrap.id = DETAIL_ACC_BTN_WRAP_ID;
    wrap.className = 'jbis594-detail-acc001';
    wrap.dataset.jbis594 = 'detail-actions';
    wrap.style.cssText =
      'display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%;box-sizing:border-box;' +
      'margin:0 0 10px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;';
    wrap.appendChild(btnReplace);
    wrap.appendChild(btn);
    host.insertBefore(wrap, host.firstChild);
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

  const on594RecordDetailShow = (event) => {
    ensureGlobalLabelStyle();
    maybeShow594ReplacementNoticeFromStorage();
    schedule594DetailAccButtonMount();
    return event;
  };

  kintone.events.on('app.record.detail.show', on594RecordDetailShow);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on('mobile.app.record.detail.show', on594RecordDetailShow);
  }
})();
