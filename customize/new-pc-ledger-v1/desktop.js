/**
 * 新・PC台帳ver.1 (Day 4 雛形 / Day 5 で本実装)
 *
 * 仕様: docs/plans/2026-04-21-new-pc-ledger-spec.md v2.1 §4
 * Day 4 plan: docs/plans/2026-04-26-pc-ledger-day4-action.md
 *
 * BUILD: 2026-04-29-day5-autogen-v0.6 (共有/JR: メール・サイボウズ非表示強化 + 共有端末名の保存前チェック)
 *
 * Day 4 雛形スコープ:
 *   - 種別 (account_type) による表示制御 (show/hide)
 *   - §4.2.1a: 内部メタは kintone 標準グループ `internal_system_meta` に収容（レイアウトは `npm run pc-ledger:674:layout-internal-group`）。表示時はグループを閉じる・新規・編集では子を disabled
 *   - §4.2.3a: SKYSEA 4 件は `skysea_system_meta`（表示名 SKYSEA処理用）に収容。アカウント部領域のため **権限のあるユーザーは編集可能**。運用で触るのは浜田のみと **周知**（customize ではログインによる非表示はしない）。通常はグループを閉じた初期表示
 *   - 自動生成ボタン: 個人 / 共有 / JR（M365 系）を §4.4 に沿ってフォームへ反映（空欄のみ上書き）
 *   - 5 台ライセンス警告雛形 (赤バナーは仕組みのみ)
 *   - リセット/PC買替/印刷ボタン雛形
 *
 * Day 5 残タスク:
 *   - 印刷帳票 (627 レイアウト移植)
 *   - 検索バー強化
 */
(function () {
  'use strict';

  const BUILD = '2026-04-29-day5-autogen-v0.6';

  /** 編集画面表示直後の割当状態（submit.success で §4.10 / §5.3 と突合） */
  const snapshotBeforeEdit674 = Object.create(null);

  /** 共有・JR 等の手入力時の参照用（浜田提供・順序固定） */
  const DEPT_HELP_REFERENCE_TEXT =
    '【所属名】\n' +
    '　◆本社\n' +
    '　　役員室\n' +
    '　　顧問室\n' +
    '　　総務部\n' +
    '　　経理部\n' +
    '　　経営企画部\n' +
    '　　人事研修部\n' +
    '　　安全推進部\n' +
    '　　施工推進部\n' +
    '　　メンテナンス技術部\n' +
    '　　塗装技術部\n' +
    '　　品質管理部\n' +
    '　◆支店・営業所\n' +
    '　　東北支店\n' +
    '　　　秋田営業所\n' +
    '　　　盛岡営業所\n' +
    '　　　仙台営業所\n' +
    '　　関越支店\n' +
    '　　　新潟営業所\n' +
    '　　　長野営業所\n' +
    '　　　高崎営業所\n' +
    '　　東京支店\n' +
    '　　　千葉営業所\n' +
    '　　　水戸営業所\n' +
    '　　東海支店\n' +
    '　　　東京営業所\n' +
    '　　　静岡営業所\n' +
    '　　　名古屋営業所\n' +
    '　　　関西営業所\n' +
    '　　札幌支店\n' +
    '　　首都圏支店\n' +
    '　　鉄構支店\n' +
    '　　湾岸工事所\n' +
    '\n' +
    '【所属グループ】\n' +
    '　honsya\n' +
    '　tohoku\n' +
    '　kan-etsu\n' +
    '　tokyo\n' +
    '　tokai\n' +
    '　reform\n' +
    '　tekko\n' +
    '　wangan\n';

  // ===== 関連アプリ ID (kintone-apps.md 参照) =====
  const APP_ENV_MASTER = '670';     // 環境設定マスタ
  const APP_M365_MASTER = '671';    // M365管理マスタ
  const APP_JBM_NUMBER = '672';     // 新個人WindowsID採番マスタ (jbm)
  const APP_SJBM_NUMBER = '673';    // 新共有WindowsID採番マスタ (sjbm)
  const APP_EMPLOYEE = '595';       // 社員情報マスタ

  // ===== フィールドコード定数 (Day 4 plan §2 と一致) =====
  // PC 基本情報
  const FC_PC_NAME = 'pc_name';
  const FC_PC_SERIAL_NO = 'pc_serial_no';
  const FC_SERIAL = 'serial';
  const FC_ACCOUNT_TYPE = 'account_type';
  const FC_PC_STATUS = 'pc_status';
  const FC_USER_NAME = 'user_name';
  const FC_DEPT_NAME = 'dept_name';
  const FC_GROUP_NAME = 'group_name';
  const FC_SHARED_TERMINAL_NAME = 'shared_terminal_name';
  // アカウント情報
  const FC_LOGON_NAME = 'logon_name';
  const FC_LOGON_PW = 'logon_pw';
  const FC_WINDOWS_NAME = 'windows_name';
  const FC_MAIL = 'mail';
  const FC_MAIL_ACCT = 'mail_acct';
  const FC_MAIL_PW = 'mail_pw';
  const FC_M365_ID = 'm365_id';
  const FC_M365_PW = 'm365_pw';
  const FC_GB_ID = 'gb_id';
  const FC_GB_PW = 'gb_pw';
  const FC_SB_ID = 'sb_id';
  const FC_SB_PW = 'sb_pw';
  const FC_M365_MASTER_RECORD_ID = 'm365_master_record_id';
  /** §4.2.1a 内部メタ（フィールドグループ内・新規・編集では編集不可） */
  const FC_INTERNAL_GROUP = 'internal_system_meta';
  const FC_IMPORT_SOURCE = 'import_source';
  const FC_LEGACY_PC_NAME_594 = 'legacy_pc_name_594';
  const FC_LEGACY_RECORD_ID_594 = 'legacy_record_id_594';
  const FC_CREATED_AT_JST = 'created_at_jst';
  const INTERNAL_CHILD_CODES = [
    FC_PC_SERIAL_NO,
    FC_IMPORT_SOURCE,
    FC_LEGACY_PC_NAME_594,
    FC_LEGACY_RECORD_ID_594,
    FC_CREATED_AT_JST,
  ];

  /** §4.2.3a SKYSEA グループ（表示名 SKYSEA処理用） */
  const FC_SKYSEA_GROUP = 'skysea_system_meta';
  const FC_SKYSEA_STATUS = 'skysea_status';
  const FC_SKYSEA_CHECKED_AT = 'skysea_checked_at';
  const FC_SKYSEA_INSTALL_LOG = 'skysea_install_log';
  const FC_SKYSEA_TARGET_FLAG = 'skysea_target_flag';
  const SKYSEA_CHILD_CODES = [
    FC_SKYSEA_STATUS,
    FC_SKYSEA_CHECKED_AT,
    FC_SKYSEA_INSTALL_LOG,
    FC_SKYSEA_TARGET_FLAG,
  ];

  // ===== 種別 (account_type) のオプション =====
  const TYPE_PERSONAL = '個人';
  const TYPE_SHARED = '共有';
  const TYPE_JR = 'JR端末';
  const TYPE_SERVER = 'サーバーNAS';
  const TYPE_OTHER = 'その他';

  // ===== ユーティリティ =====

  /**
   * フィールドの show/hide を一括制御。
   * @param {string[]} codes フィールドコード一覧
   * @param {boolean} visible true=表示 / false=非表示
   */
  function setFieldsVisibility(codes, visible) {
    for (const code of codes) {
      try {
        kintone.app.record.setFieldShown(code, visible);
      } catch (e) {
        // 一部フィールドが未配置でもエラーで全停止しない (雛形)
        console.warn(`[NEW-PC-LEDGER-V1] setFieldShown failed for ${code}:`, e.message);
      }
    }
  }

  /**
   * 標準フィールドグループを初期状態で閉じる（PC / モバイル）。
   */
  function setInternalGroupClosed() {
    try {
      kintone.app.record.setGroupFieldOpen(FC_INTERNAL_GROUP, false);
    } catch (e) {
      console.warn(`[NEW-PC-LEDGER-V1] setGroupFieldOpen(desktop):`, e.message);
    }
    try {
      if (kintone.mobile && kintone.mobile.app && kintone.mobile.app.record) {
        kintone.mobile.app.record.setGroupFieldOpen(FC_INTERNAL_GROUP, false);
      }
    } catch (e) {
      console.warn(`[NEW-PC-LEDGER-V1] setGroupFieldOpen(mobile):`, e.message);
    }
  }

  /**
   * §4.2.1a: 内部メタはフォーム上では標準グループ `internal_system_meta`（表示名「内部処理用」）に収容する想定。
   * 子フィールドは **setFieldShown では隠さない**（グループを閉じたときにまとめて隠れる）。
   * 新規・編集では子を **disabled**（グレーアウト・手入力不可）。
   * 注意: GROUP が未配置の間は子がフォーム上にバラけて見えるため、**add-form-fields + `npm run pc-ledger:674:layout-internal-group`** を先に実施すること。
   * @param {Record<string, object>} record kintone レコードオブジェクト
   * @param {'detail'|'editable'} mode
   */
  function applyInternalMetaFieldUi(record, mode) {
    setFieldsVisibility(INTERNAL_CHILD_CODES, true);
    setInternalGroupClosed();
    if (mode !== 'editable') return;
    for (const code of INTERNAL_CHILD_CODES) {
      const cell = record[code];
      if (cell && Object.prototype.hasOwnProperty.call(cell, 'disabled')) {
        cell.disabled = true;
      }
    }
  }

  /**
   * §4.2.3a: SKYSEA は `skysea_system_meta` に収容。全員表示・編集可（運上は浜田のみが触る旨を周知）。
   * 子は setFieldShown で隠さない。通常は畳んだまま（setGroupFieldOpen false）。
   */
  function applySkyseaGroupUi(record, mode) {
    const skyseaCodes = [FC_SKYSEA_GROUP, ...SKYSEA_CHILD_CODES];
    setFieldsVisibility(skyseaCodes, true);
    try {
      kintone.app.record.setGroupFieldOpen(FC_SKYSEA_GROUP, false);
    } catch (e) {
      console.warn(`[NEW-PC-LEDGER-V1] setGroupFieldOpen skysea (desktop):`, e.message);
    }
    try {
      if (kintone.mobile && kintone.mobile.app && kintone.mobile.app.record) {
        kintone.mobile.app.record.setGroupFieldOpen(FC_SKYSEA_GROUP, false);
      }
    } catch (e) {
      console.warn(`[NEW-PC-LEDGER-V1] setGroupFieldOpen skysea (mobile):`, e.message);
    }
    if (mode === 'editable') {
      for (const code of SKYSEA_CHILD_CODES) {
        const cell = record[code];
        if (cell && Object.prototype.hasOwnProperty.call(cell, 'disabled')) {
          cell.disabled = false;
        }
      }
    }
  }

  /**
   * 種別に応じてアカウント情報セクションの表示制御
   * (仕様書 §4.5 UI 出し分け)
   */
  function applyVisibilityByType(record) {
    const type = record[FC_ACCOUNT_TYPE]?.value || '';

    const accountFields = [
      FC_LOGON_NAME, FC_LOGON_PW, FC_WINDOWS_NAME,
      FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW,
      FC_M365_ID, FC_M365_PW,
      FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW,
    ];
    /** 個人のみ。共有/JR は Windows + M365 のみ（メール・サイボウズ等は非表示） */
    const personalOnlyFields = [
      FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW,
      FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW,
    ];
    /** 共有/JR では利用者名は使わないため非表示（共有端末名を使う） */
    const personalOnlyUserName = [FC_USER_NAME];

    if (type === TYPE_PERSONAL) {
      setFieldsVisibility(accountFields, true);
      setFieldsVisibility(personalOnlyUserName, true);
    } else if (type === TYPE_SHARED || type === TYPE_JR) {
      setFieldsVisibility(accountFields, true);
      setFieldsVisibility(personalOnlyFields, false);
      setFieldsVisibility(personalOnlyUserName, false);
    } else {
      // サーバーNAS / その他 → アカウント情報全体を非表示
      setFieldsVisibility(accountFields, false);
      setFieldsVisibility(personalOnlyUserName, true);
    }
  }

  // ===== §4.2.0b 所属名・所属グループ 常時ヘルプ帯 =====

  const DEPT_HELP_ID = 'new-pc-ledger-dept-help';

  const DEPT_HELP_SHOW_RECORD_EVENTS = new Set([
    'app.record.detail.show',
    'app.record.create.show',
    'mobile.app.record.detail.show',
    'mobile.app.record.create.show',
  ]);

  function removeDeptHelpBanner() {
    const el = document.getElementById(DEPT_HELP_ID);
    if (el) el.remove();
  }

  /**
   * レコード画面ヘッダに所属ヘルプを出す（詳細・新規のみ。一覧・編集では remove を呼ぶ）。
   */
  function injectDeptHelpBanner() {
    const space = kintone.app.record.getHeaderMenuSpaceElement();
    if (!space) return;

    const prev = document.getElementById(DEPT_HELP_ID);
    if (prev) prev.remove();

    const box = document.createElement('div');
    box.id = DEPT_HELP_ID;
    box.style.cssText =
      'font-size:12px;line-height:1.45;padding:8px 12px;margin:4px 0 8px;' +
      'background:#e8f4fd;border:1px solid #9ec5fe;border-radius:4px;color:#052c65;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;margin-bottom:4px;';
    title.textContent = '📌 所属名・所属グループの入れ方';
    box.appendChild(title);

    const ul = document.createElement('ul');
    ul.style.cssText = 'margin:0 0 6px 1.1em;padding:0;';
    const li1 = document.createElement('li');
    li1.textContent =
      '個人：利用者名（595と一致する氏名）を入力後、所属は社員マスタ（595）から自動反映（※JS連携は次アップデートで有効化予定。それまでは手入力可）。';
    const li2 = document.createElement('li');
    li2.textContent =
      '共有・JR：`所属名` と `所属グループ` は別フィールド。下表は会社既定の候補を**この順**で記載（必要な行だけコピーして入力）。';
    ul.appendChild(li1);
    ul.appendChild(li2);
    box.appendChild(ul);

    const exLabel = document.createElement('div');
    exLabel.style.cssText = 'font-weight:bold;font-size:11px;margin:2px 0 2px;';
    exLabel.textContent = '所属名・所属グループ 一覧（上から順・コピー参照）';
    box.appendChild(exLabel);

    const ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.rows = 6;
    ta.style.cssText =
      'width:100%;max-width:720px;max-height:132px;font-size:11px;font-family:Consolas,monospace;' +
      'box-sizing:border-box;padding:6px;border:1px solid #86b7fe;border-radius:4px;resize:vertical;overflow-y:auto;';
    ta.value = DEPT_HELP_REFERENCE_TEXT;
    box.appendChild(ta);

    space.insertBefore(box, space.firstChild);
  }

  // ===== ヘッダスペース (PC / モバイル) =====

  function getHeaderSpace674() {
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app?.record?.getHeaderMenuSpaceElement) {
        const el = kintone.mobile.app.record.getHeaderMenuSpaceElement();
        if (el) return el;
      }
    } catch (e) {
      /* ignore */
    }
    return kintone.app.record.getHeaderMenuSpaceElement();
  }

  // ===== JR端末用 黄色バナー (雛形 / 仕様書 §4.5) =====

  function showJrBannerIfNeeded(record) {
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    const existing = document.querySelector('#new-pc-ledger-jr-banner');
    if (existing) existing.remove();

    if (type !== TYPE_JR) return;

    const space = getHeaderSpace674();
    if (!space) return;
    const banner = document.createElement('div');
    banner.id = 'new-pc-ledger-jr-banner';
    banner.style.cssText = 'background:#fff3cd;color:#664d03;padding:8px 12px;margin:6px 0;border:1px solid #ffe69c;border-radius:4px;font-weight:bold;';
    banner.textContent = '🟡 JR端末は AD 参加しないため、OS ローカルアカウントで手動作成してください';
    space.appendChild(banner);
  }

  // ===== 5 台ライセンス警告 (仕様書 §4.6.4 / 671 実参照) =====

  /**
   * 共有・JR で m365_master_record_id があるとき、671 の usage_count が上限以上なら赤バナー。
   * @returns {Promise<void>}
   */
  function refreshLicenseBannerFrom671(record) {
    const existing = document.querySelector('#new-pc-ledger-license-banner');
    if (existing) existing.remove();

    const masterId = String(record[FC_M365_MASTER_RECORD_ID]?.value || '').trim();
    if (!masterId) return Promise.resolve();
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    if (type !== TYPE_SHARED && type !== TYPE_JR) return Promise.resolve();

    return Promise.all([
      loadEnv670Map(),
      kintoneApiGet('/k/v1/record.json', { app: APP_M365_MASTER, id: masterId }),
    ]).then(function (results) {
      const envMap = results[0];
      const getResp = results[1];
      const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
      const usage = parseInt((getResp.record.usage_count && getResp.record.usage_count.value) || '0', 10) || 0;
      if (usage < lim) return;

      const space = getHeaderSpace674();
      if (!space) return;

      const banner = document.createElement('div');
      banner.id = 'new-pc-ledger-license-banner';
      banner.style.cssText =
        'background:#f8d7da;color:#842029;padding:8px 12px;margin:6px 0;border:1px solid #f5c2c7;border-radius:4px;font-weight:bold;';
      banner.textContent =
        'この M365 アカウント（671 レコード番号 ' +
        masterId +
        '）は利用台数がライセンス上限に達しています（' +
        usage +
        '/' +
        lim +
        '）。Microsoft のポリシーに反する追加分の割当は行わないでください。';
      space.appendChild(banner);
    });
  }

  // ===== Day 5: 自動生成（§4.4 / L1 フォーム表示のみ・手入力済は上書きしない）=====

  function escapeQueryValue(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function kintoneApiGet(urlPath, params) {
    return kintone.api(kintone.api.url(urlPath, true), 'GET', params);
  }

  function kintoneApiPost(urlPath, body) {
    return kintone.api(kintone.api.url(urlPath, true), 'POST', body);
  }

  function kintoneApiPut(urlPath, body) {
    return kintone.api(kintone.api.url(urlPath, true), 'PUT', body);
  }

  function loadEnv670Map() {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_ENV_MASTER,
      query: 'order by レコード番号 desc limit 200',
      fields: ['setting_key', 'setting_value'],
    }).then(function (resp) {
      const map = Object.create(null);
      for (const r of resp.records || []) {
        const k = (r.setting_key && r.setting_key.value) || '';
        if (k) map[k] = (r.setting_value && r.setting_value.value) || '';
      }
      return map;
    });
  }

  function findEmployee595ByUserName(userName) {
    const q = `user_name = "${escapeQueryValue(userName)}" and employment_status not in ("退職") limit 1`;
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_EMPLOYEE,
      query: q,
      fields: ['user_name', 'mail', 'dept_name', 'group_name', 'employment_status'],
    }).then(function (resp) {
      return (resp.records && resp.records[0]) || null;
    });
  }

  /** 部分一致（苗字・名前の途中入力）。退職者は除外 */
  function searchEmployees595Contains(keyword, limit) {
    const k = String(keyword || '').trim();
    if (!k) return Promise.resolve([]);
    const lim = Math.min(Math.max(parseInt(String(limit || '12'), 10) || 12, 1), 25);
    const q =
      'user_name like "' +
      escapeQueryValue(k) +
      '" and employment_status not in ("退職") order by user_name asc limit ' +
      lim;
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_EMPLOYEE,
      query: q,
      fields: ['user_name', 'mail', 'dept_name', 'group_name', 'employment_status'],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function nextJbmFrom672() {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_JBM_NUMBER,
      query: 'logon_name != "" limit 500',
      fields: ['logon_name'],
    }).then(function (resp) {
      let max = 0;
      const re = /^jbm(\d{4})$/;
      for (const r of resp.records || []) {
        const m = re.exec((r.logon_name && r.logon_name.value) || '');
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
      return 'jbm' + String(max + 1).padStart(4, '0');
    });
  }

  function nextSjbmFrom673() {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_SJBM_NUMBER,
      query: 'logon_name != "" limit 500',
      fields: ['logon_name'],
    }).then(function (resp) {
      let max = 0;
      const re = /^sjbm(\d{4})$/;
      for (const r of resp.records || []) {
        const m = re.exec((r.logon_name && r.logon_name.value) || '');
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
      return 'sjbm' + String(max + 1).padStart(4, '0');
    });
  }

  /** §5.3: 利用可 かつ usage_count<5 の最古 serial（共有プール。JR も同一プール） */
  function fetchAssignableM365Record671() {
    const q = [
      'status in ("利用可")',
      'usage_count < 5',
      'account_type in ("共有")',
      'order by serial_no asc',
      'limit 1',
    ].join(' and ');
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_M365_MASTER,
      query: q,
      fields: ['$id', 'm365_id', 'm365_pw', 'usage_count', 'status', 'serial_no', 'account_type'],
    }).then(function (resp) {
      return (resp.records && resp.records[0]) || null;
    });
  }

  function mergeScalarField(rec, code, value) {
    if (value == null || value === '') return;
    const cell = rec[code];
    if (!cell || typeof cell !== 'object') return;
    const cur = String(cell.value || '').trim();
    if (cur) return;
    cell.value = String(value);
  }

  /** 空欄でなくても上書き（595 候補から選んだとき用） */
  function setScalarFieldValue674(rec, code, value) {
    const cell = rec[code];
    if (!cell || typeof cell !== 'object' || !Object.prototype.hasOwnProperty.call(cell, 'value')) return;
    cell.value = value == null ? '' : String(value);
  }

  function mergeNumberField(rec, code, numVal) {
    if (numVal == null || numVal === '') return;
    const cell = rec[code];
    if (!cell || typeof cell !== 'object') return;
    const cur = String(cell.value || '').trim();
    if (cur) return;
    cell.value = String(numVal);
  }

  const USER_SUGGEST_BOX_ID = 'new-pc-ledger-user-suggest';
  let userSuggestTimer674 = null;
  let userSuggestReq674 = 0;
  let userSuggestDocClick674 = false;

  function getRecordFormApi674() {
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        return kintone.mobile.app.record;
      }
    } catch (e0) {
      /* ignore */
    }
    return kintone.app.record;
  }

  function hideUserSuggest674() {
    const box = document.getElementById(USER_SUGGEST_BOX_ID);
    if (box) box.remove();
    const anchors = document.querySelectorAll('[data-npl-user-anchor="1"]');
    for (let i = 0; i < anchors.length; i++) {
      anchors[i].removeAttribute('data-npl-user-anchor');
    }
  }

  function getUserNameFieldEl674() {
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        const m = kintone.mobile.app.record.getFieldElement(FC_USER_NAME);
        if (m) return m;
      }
    } catch (e1) {
      /* ignore */
    }
    try {
      return kintone.app.record.getFieldElement(FC_USER_NAME);
    } catch (e2) {
      return null;
    }
  }

  function applyEmployeePickFrom595674(emp) {
    const api = getRecordFormApi674();
    const holder = api.get();
    const rec = holder.record;
    setScalarFieldValue674(rec, FC_USER_NAME, (emp.user_name && emp.user_name.value) || '');
    setScalarFieldValue674(rec, FC_DEPT_NAME, (emp.dept_name && emp.dept_name.value) || '');
    setScalarFieldValue674(rec, FC_GROUP_NAME, (emp.group_name && emp.group_name.value) || '');
    api.set(holder);
    hideUserSuggest674();
  }

  function mountUserSuggestDropdown674(rows) {
    hideUserSuggest674();
    const anchor = getUserNameFieldEl674();
    if (!anchor) return;
    anchor.setAttribute('data-npl-user-anchor', '1');
    anchor.style.position = 'relative';
    const box = document.createElement('div');
    box.id = USER_SUGGEST_BOX_ID;
    box.style.cssText =
      'position:absolute;left:0;top:100%;margin-top:2px;min-width:260px;max-width:480px;max-height:260px;overflow:auto;' +
      'background:#fff;border:1px solid #0d6efd;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:99999;' +
      'font-size:13px;line-height:1.4;';
    const title = document.createElement('div');
    title.style.cssText =
      'padding:6px 10px;background:#e7f1ff;border-bottom:1px solid #9ec5fe;font-weight:bold;color:#052c65;font-size:12px;';
    title.textContent = '社員マスタの候補（タップで確定・所属名も自動で入ります）';
    box.appendChild(title);
    if (!rows || !rows.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:10px;color:#6c757d;';
      empty.textContent = '在籍の社員名が見つかりません。別の表記でもう一度入力してください。';
      box.appendChild(empty);
      anchor.appendChild(box);
      return;
    }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const un = (row.user_name && row.user_name.value) || '';
      const dept = (row.dept_name && row.dept_name.value) || '';
      const grp = (row.group_name && row.group_name.value) || '';
      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText =
        'display:block;width:100%;text-align:left;padding:8px 10px;border:none;border-bottom:1px solid #dee2e6;background:#fff;cursor:pointer;';
      item.textContent = un + (dept ? '　／　' + dept : '') + (grp ? '　（' + grp + '）' : '');
      (function (empRow) {
        item.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          applyEmployeePickFrom595674(empRow);
        });
      })(row);
      box.appendChild(item);
    }
    anchor.appendChild(box);
  }

  function scheduleUserNameSuggest674() {
    if (userSuggestTimer674) clearTimeout(userSuggestTimer674);
    userSuggestTimer674 = setTimeout(function () {
      userSuggestTimer674 = null;
      const api = getRecordFormApi674();
      if (!api || !api.get) return;
      const holder = api.get();
      const rec = holder.record;
      const type = (rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '';
      if (type !== TYPE_PERSONAL) {
        hideUserSuggest674();
        return;
      }
      const raw = String((rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '').trim();
      if (!raw) {
        hideUserSuggest674();
        return;
      }
      const reqId = ++userSuggestReq674;
      searchEmployees595Contains(raw, 15)
        .then(function (list) {
          if (reqId !== userSuggestReq674) return;
          mountUserSuggestDropdown674(list);
        })
        .catch(function (e) {
          if (reqId !== userSuggestReq674) return;
          console.warn('[NEW-PC-LEDGER-V1] 595 候補検索', e);
          hideUserSuggest674();
        });
    }, 380);
  }

  function onUserNameFieldChange674(event) {
    const type = (event.record[FC_ACCOUNT_TYPE] && event.record[FC_ACCOUNT_TYPE].value) || '';
    if (type !== TYPE_PERSONAL) {
      hideUserSuggest674();
      return event;
    }
    ensureUserSuggestDocClick674();
    scheduleUserNameSuggest674();
    return event;
  }

  function ensureUserSuggestDocClick674() {
    if (userSuggestDocClick674) return;
    userSuggestDocClick674 = true;
    document.addEventListener(
      'click',
      function (ev) {
        const box = document.getElementById(USER_SUGGEST_BOX_ID);
        if (!box) return;
        const t = ev.target;
        if (box.contains(t)) return;
        if (t.closest && t.closest('[data-npl-user-anchor="1"]')) return;
        hideUserSuggest674();
      },
      true,
    );
  }

  function validateUserNameIn595ForPersonal674(event) {
    const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
    if (type !== TYPE_PERSONAL) return Promise.resolve(null);
    const un = String(event.record[FC_USER_NAME]?.value || '').trim();
    if (!un) return Promise.resolve(null);
    return findEmployee595ByUserName(un).then(function (emp) {
      if (emp) return null;
      return 'この「利用者名」は社員マスタ（在籍）に一致しませんでした。候補一覧から氏名を選ぶか、社員マスタと同じ氏名に直してください。';
    });
  }

  function runPersonalAutoGen() {
    const api = getRecordFormApi674();
    const recNow = api.get();
    const rec = recNow.record;
    const userName = (rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '';
    if (!String(userName).trim()) {
      window.alert('種別=個人 の自動生成には「利用者名」を先に入力してください。');
      return Promise.resolve();
    }
    return Promise.all([loadEnv670Map(), findEmployee595ByUserName(userName.trim()), nextJbmFrom672()])
      .then(function (results) {
        const envMap = results[0];
        const emp = results[1];
        const nextJbm = results[2];
        if (!emp) {
          window.alert('社員マスタ（595）に user_name が一致するレコードが見つかりません: ' + userName);
          return;
        }
        const mail = (emp.mail && emp.mail.value) || '';
        const at = mail.indexOf('@');
        const mailLocal = at > 0 ? mail.slice(0, at) : '';
        const m365Domain = envMap.M365_DOMAIN || '@kensetsutoso01.onmicrosoft.com';
        const m365PwSuffix = envMap.M365_PW_PERSONAL_SUFFIX || 'K#';

        mergeScalarField(rec, FC_DEPT_NAME, (emp.dept_name && emp.dept_name.value) || '');
        mergeScalarField(rec, FC_GROUP_NAME, (emp.group_name && emp.group_name.value) || '');
        mergeScalarField(rec, FC_MAIL, mail);
        mergeScalarField(rec, FC_MAIL_ACCT, mailLocal);
        mergeScalarField(rec, FC_LOGON_NAME, nextJbm);
        mergeScalarField(rec, FC_LOGON_PW, nextJbm);
        mergeScalarField(rec, FC_WINDOWS_NAME, nextJbm + mailLocal);
        if (mailLocal) mergeScalarField(rec, FC_M365_ID, mailLocal + m365Domain);
        mergeScalarField(rec, FC_M365_PW, nextJbm + m365PwSuffix);

        api.set(recNow);
        window.alert('個人用フィールドをフォームへ反映しました（空欄のみ）。保存は手動で行ってください。');
      });
  }

  function runSharedAutoGen() {
    const recNow = kintone.app.record.get();
    const rec = recNow.record;
    const type = (rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '';

    return Promise.all([loadEnv670Map(), fetchAssignableM365Record671(), nextSjbmFrom673()])
      .then(function (results) {
        const envMap = results[0];
        const m671 = results[1];
        const nextSjbm = results[2];

        if (!m671) {
          window.alert(
            'M365 アカウントの空きがありません。Microsoft 365 管理画面で作成し、M365管理マスタへ追加してから再度お試しください。',
          );
          return;
        }

        const m365Id = (m671.m365_id && m671.m365_id.value) || '';
        const m365Pw = (m671.m365_pw && m671.m365_pw.value) || envMap.M365_PW_SHARED_FIXED || 'kent2511K#';
        const m365RowId = m671.$id && m671.$id.value;

        if (type === TYPE_SHARED) {
          mergeScalarField(rec, FC_LOGON_NAME, nextSjbm);
          mergeScalarField(rec, FC_WINDOWS_NAME, nextSjbm);
          const fixedPw = envMap.LOGON_PW_SHARED_FIXED || 'kent0000';
          const lpw = rec[FC_LOGON_PW];
          if (lpw && (!lpw.value || !String(lpw.value).trim())) lpw.value = fixedPw;
        }

        mergeScalarField(rec, FC_M365_ID, m365Id);
        mergeScalarField(rec, FC_M365_PW, m365Pw);
        mergeNumberField(rec, FC_M365_MASTER_RECORD_ID, m365RowId);

        kintone.app.record.set(recNow);
        window.alert(
          type === TYPE_JR
            ? 'M365 系のみフォームへ反映しました（空欄のみ）。Windows 系は手入力ください。保存は手動で行ってください。'
            : '共有向け（Windows + M365）をフォームへ反映しました（空欄のみ）。保存は手動で行ってください。',
        );
      });
  }

  function runClearAccountFields() {
    const recNow = kintone.app.record.get();
    const rec = recNow.record;
    const codes = [
      FC_LOGON_NAME, FC_LOGON_PW, FC_WINDOWS_NAME,
      FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW,
      FC_M365_ID, FC_M365_PW,
      FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW,
      FC_M365_MASTER_RECORD_ID,
    ];
    for (const code of codes) {
      const cell = rec[code];
      if (cell && Object.prototype.hasOwnProperty.call(cell, 'value')) cell.value = '';
    }
    kintone.app.record.set(recNow);
  }

  // ===== 保存成功フック (§4.10.3 / §5.3–5.4: 671 増減・linked リネーム + 672/673) =====

  function extractState674(rec) {
    return {
      account_type: (rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '',
      m365_master_record_id: String((rec[FC_M365_MASTER_RECORD_ID] && rec[FC_M365_MASTER_RECORD_ID].value) || '').trim(),
      pc_name: String((rec[FC_PC_NAME] && rec[FC_PC_NAME].value) || '').trim(),
      logon_name: String((rec[FC_LOGON_NAME] && rec[FC_LOGON_NAME].value) || '').trim(),
      pc_status: String((rec[FC_PC_STATUS] && rec[FC_PC_STATUS].value) || '').trim(),
    };
  }

  /** 共有/JR で M365 マスタ行が有効に 1 台分カウントされる状態（§4.10.4 廃棄はカウント外） */
  function allocation671Active(st) {
    if (!st) return false;
    if (st.account_type !== TYPE_SHARED && st.account_type !== TYPE_JR) return false;
    if (!st.m365_master_record_id || !st.pc_name) return false;
    if (st.pc_status === '廃棄') return false;
    return true;
  }

  function parseLinked671(raw) {
    return String(raw || '')
      .split(/[\r\n,]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function dedupeLinked671PreserveOrder(pcs) {
    const seen = Object.create(null);
    const out = [];
    for (const p of pcs) {
      if (!p || seen[p]) continue;
      seen[p] = true;
      out.push(p);
    }
    return out;
  }

  function next671StatusFromUsage(count, lim) {
    return count >= lim ? '満杯' : '利用可';
  }

  /** GET 直後の 671 を mutator で更新。revision 競合時は 1 回だけ再試行 */
  function put671Mutation(mid, buildPartialFromRecord) {
    function once() {
      return kintoneApiGet('/k/v1/record.json', { app: APP_M365_MASTER, id: String(mid) }).then(function (getResp) {
        const r = getResp.record;
        const st = (r.status && r.status.value) || '';
        if (st === '廃止') {
          console.warn('[NEW-PC-LEDGER-V1] 671 廃止 id=' + mid + ' のため M365 台数は更新しません');
          return Promise.resolve();
        }
        const partial = buildPartialFromRecord(r);
        if (!partial) return Promise.resolve();
        return kintoneApiPut('/k/v1/record.json', {
          app: APP_M365_MASTER,
          id: String(mid),
          revision: getResp.revision,
          record: partial,
        });
      });
    }
    return once().catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] 671 PUT 再試行:', e && (e.message || e.code || String(e)));
      return once();
    });
  }

  function removeOneSlot671(mid, pcName, lim) {
    return put671Mutation(mid, function (r) {
      const pcs = parseLinked671((r.linked_pcs && r.linked_pcs.value) || '');
      const ix = pcs.indexOf(pcName);
      if (ix < 0) {
        console.warn('[NEW-PC-LEDGER-V1] 671 linked に PC なし id=' + mid + ' pc=' + pcName);
        return null;
      }
      pcs.splice(ix, 1);
      const us = pcs.length;
      return {
        linked_pcs: { value: pcs.join(',') },
        usage_count: { value: String(us) },
        status: { value: next671StatusFromUsage(us, lim) },
      };
    });
  }

  function addSlot671(mid, pcName, lim) {
    return put671Mutation(mid, function (r) {
      const pcs = parseLinked671((r.linked_pcs && r.linked_pcs.value) || '');
      if (pcs.indexOf(pcName) >= 0) return null;
      if (pcs.length >= lim) {
        console.error('[NEW-PC-LEDGER-V1] 671 ライセンス上限のため PC を追加しません id=' + mid + ' (既に ' + lim + ' 台)');
        return null;
      }
      pcs.push(pcName);
      const us = pcs.length;
      return {
        linked_pcs: { value: pcs.join(',') },
        usage_count: { value: String(us) },
        status: { value: next671StatusFromUsage(us, lim) },
      };
    });
  }

  /** §4.10.3: 同一 M365 行で PC 名のみ差し替え（台数は linked の長さで整合） */
  function renameSlot671(mid, oldPc, newPc, lim) {
    return put671Mutation(mid, function (r) {
      let pcs = parseLinked671((r.linked_pcs && r.linked_pcs.value) || '');
      const ix = pcs.indexOf(oldPc);
      if (ix < 0) {
        if (pcs.indexOf(newPc) < 0 && pcs.length < lim) {
          pcs.push(newPc);
          const us = pcs.length;
          return {
            linked_pcs: { value: pcs.join(',') },
            usage_count: { value: String(us) },
            status: { value: next671StatusFromUsage(us, lim) },
          };
        }
        return null;
      }
      pcs[ix] = newPc;
      pcs = dedupeLinked671PreserveOrder(pcs);
      const us = pcs.length;
      return {
        linked_pcs: { value: pcs.join(',') },
        usage_count: { value: String(us) },
        status: { value: next671StatusFromUsage(us, lim) },
      };
    });
  }

  /**
   * 編集前後の差分で 671 を整合（手入力・自動生成のどちらが正でも、保存結果に合わせる）。
   */
  function reconcile671For674Save(prev, next, lim) {
    const prevOn = allocation671Active(prev);
    const nextOn = allocation671Active(next);
    const oMid = prev && prev.m365_master_record_id;
    const oPc = prev && prev.pc_name;
    const nMid = next.m365_master_record_id;
    const nPc = next.pc_name;

    if (prevOn && nextOn && oMid === nMid && oPc === nPc) {
      return Promise.resolve();
    }
    if (prevOn && nextOn && oMid === nMid && oPc !== nPc) {
      if (!nPc) {
        return removeOneSlot671(oMid, oPc, lim);
      }
      return renameSlot671(nMid, oPc, nPc, lim);
    }

    let chain = Promise.resolve();
    const needRemove = prevOn && (!nextOn || oMid !== nMid || oPc !== nPc);
    const needAdd = nextOn && (!prevOn || oMid !== nMid || oPc !== nPc);

    if (needRemove) {
      chain = chain.then(function () {
        return removeOneSlot671(oMid, oPc, lim);
      });
    }
    if (needAdd) {
      chain = chain.then(function () {
        return addSlot671(nMid, nPc, lim);
      });
    }
    return chain;
  }

  /**
   * reconcile671For674Save と同じ条件で、保存成功時に addSlot671 が走るか。
   */
  function would671RunAddSlot671(prev, next) {
    const prevOn = allocation671Active(prev);
    const nextOn = allocation671Active(next);
    if (!nextOn) return false;
    const oMid = prev && prev.m365_master_record_id;
    const oPc = prev && prev.pc_name;
    const nMid = next.m365_master_record_id;
    const nPc = next.pc_name;

    if (prevOn && nextOn && oMid === nMid && oPc === nPc) {
      return false;
    }
    if (prevOn && nextOn && oMid === nMid && oPc !== nPc) {
      return false;
    }

    const needAdd = nextOn && (!prevOn || oMid !== nMid || oPc !== nPc);
    return needAdd;
  }

  /**
   * 共有/JR で M365 行に新規に 1 台ぶん載る保存かつ、671 上で既に上限なら保存を止める（§5.3 / MS ポリシー）。
   * @returns {Promise<string|null>} エラー文言 or null
   */
  function validateM671SixthSlotBeforeSave674(event) {
    const next = extractState674(event.record);
    if (!allocation671Active(next)) return Promise.resolve(null);

    const isEdit = /\.edit\.submit$/.test(event.type || '');
    const rid = String((event.recordId || (event.record.$id && event.record.$id.value) || '')).trim();
    const prev = isEdit && rid ? snapshotBeforeEdit674[rid] : null;

    if (!would671RunAddSlot671(prev, next)) return Promise.resolve(null);

    const nMid = next.m365_master_record_id;
    const nPc = next.pc_name;

    return loadEnv670Map().then(function (envMap) {
      const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
      return kintoneApiGet('/k/v1/record.json', { app: APP_M365_MASTER, id: String(nMid) }).then(function (getResp) {
        const r = getResp.record;
        const st = (r.status && r.status.value) || '';
        if (st === '廃止') {
          return 'この共有メール（Microsoft 365 の割当）は、利用停止になっています。別の行を選ぶか、システム担当に相談してください。';
        }
        const pcs = parseLinked671((r.linked_pcs && r.linked_pcs.value) || '');
        if (pcs.indexOf(nPc) >= 0) {
          return null;
        }
        if (pcs.length >= lim) {
          return (
            '共有のメール（Microsoft 365）は、付けられる PC は ' +
            lim +
            ' 台までです。いま選んでいる割当では、すでに ' +
            lim +
            ' 台が使われているため、このままでは保存できません。別の空きの割当を選ぶか、Microsoft の管理画面でアカウントを追加してからマスタを更新し、システム担当に相談してください。'
          );
        }
        return null;
      });
    });
  }

  function countOther674ByLogon(logon, selfRid, app674) {
    const selfClause = selfRid ? ` and $id != "${escapeQueryValue(String(selfRid))}"` : '';
    return kintoneApiGet('/k/v1/records.json', {
      app: app674,
      query: 'logon_name = "' + escapeQueryValue(logon) + '"' + selfClause + ' limit 1',
      fields: ['$id'],
    }).then(function (resp) {
      return (resp.records && resp.records.length) || 0;
    });
  }

  function release672LogonIfOrphan(logon, selfRid, app674) {
    if (!/^jbm\d{4}$/.test(logon)) return Promise.resolve();
    return countOther674ByLogon(logon, selfRid, app674).then(function (cnt) {
      if (cnt > 0) return Promise.resolve();
      return kintoneApiGet('/k/v1/records.json', {
        app: APP_JBM_NUMBER,
        query: 'logon_name = "' + escapeQueryValue(logon) + '" limit 1',
        fields: ['$id', '$revision'],
      }).then(function (resp) {
        const row = resp.records && resp.records[0];
        if (!row) return Promise.resolve();
        return kintoneApiPut('/k/v1/record.json', {
          app: APP_JBM_NUMBER,
          id: row.$id.value,
          revision: row.$revision.value,
          record: {
            status: { value: '未使用' },
            note: { value: '674: 台帳で割当解除（未使用へ）' },
          },
        });
      });
    });
  }

  function release673LogonIfOrphan(logon, selfRid, app674) {
    if (!/^sjbm\d{4}$/.test(logon)) return Promise.resolve();
    return countOther674ByLogon(logon, selfRid, app674).then(function (cnt) {
      if (cnt > 0) return Promise.resolve();
      return kintoneApiGet('/k/v1/records.json', {
        app: APP_SJBM_NUMBER,
        query: 'logon_name = "' + escapeQueryValue(logon) + '" limit 1',
        fields: ['$id', '$revision'],
      }).then(function (resp) {
        const row = resp.records && resp.records[0];
        if (!row) return Promise.resolve();
        return kintoneApiPut('/k/v1/record.json', {
          app: APP_SJBM_NUMBER,
          id: row.$id.value,
          revision: row.$revision.value,
          record: {
            status: { value: '未使用' },
            note: { value: '674: 台帳で割当解除（未使用へ）' },
          },
        });
      });
    });
  }

  function reconcile672673For674Save(prev, next, rid674, isEdit) {
    const app674 = String(kintone.app.getId());
    let chain = Promise.resolve();
    const newT = (next && next.account_type) || '';
    const newL = (next && next.logon_name) || '';

    if (isEdit && prev) {
      const oldT = prev.account_type || '';
      const oldL = prev.logon_name || '';
      if (oldT === TYPE_PERSONAL && /^jbm\d{4}$/.test(oldL) && (newT !== TYPE_PERSONAL || newL !== oldL)) {
        chain = chain.then(function () {
          return release672LogonIfOrphan(oldL, rid674, app674);
        });
      }
      if (oldT === TYPE_SHARED && /^sjbm\d{4}$/.test(oldL) && (oldT !== TYPE_SHARED || newL !== oldL)) {
        chain = chain.then(function () {
          return release673LogonIfOrphan(oldL, rid674, app674);
        });
      }
    }

    if (newT === TYPE_PERSONAL && /^jbm\d{4}$/.test(newL)) {
      chain = chain.then(function () {
        return ensureNumbering672Row(newL);
      });
    }
    if (newT === TYPE_SHARED && /^sjbm\d{4}$/.test(newL)) {
      chain = chain.then(function () {
        return ensureNumbering673Row(newL);
      });
    }

    return chain;
  }

  function ensureNumbering672Row(logonName) {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_JBM_NUMBER,
      query: 'logon_name = "' + escapeQueryValue(logonName) + '" limit 1',
      fields: ['$id'],
    }).then(function (resp) {
      if (resp.records && resp.records.length) return;
      return kintoneApiPost('/k/v1/record.json', {
        app: APP_JBM_NUMBER,
        record: {
          logon_name: { value: logonName },
          status: { value: '使用済' },
          note: { value: '674 新・PC台帳: jbm 採番として登録' },
        },
      });
    });
  }

  function ensureNumbering673Row(logonName) {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_SJBM_NUMBER,
      query: 'logon_name = "' + escapeQueryValue(logonName) + '" limit 1',
      fields: ['$id'],
    }).then(function (resp) {
      if (resp.records && resp.records.length) return;
      return kintoneApiPost('/k/v1/record.json', {
        app: APP_SJBM_NUMBER,
        record: {
          logon_name: { value: logonName },
          status: { value: '使用済' },
          note: { value: '674 新・PC台帳: sjbm 採番として登録' },
        },
      });
    });
  }

  function runPostSaveHooks674(event) {
    const rec = event.record;
    const rid = String((event.recordId || (rec.$id && rec.$id.value) || '')).trim();
    const isEdit = /\.edit\.submit\.success$/.test(event.type || '');
    const prev = isEdit && rid ? snapshotBeforeEdit674[rid] : null;
    const next = extractState674(rec);

    if (isEdit && rid && !prev) {
      console.warn(
        '[NEW-PC-LEDGER-V1] 編集スナップショットなし: 671 の減算は行えません。画面を開き直してから保存すると差分が取れます。',
      );
    }

    return loadEnv670Map().then(function (envMap) {
      const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
      return reconcile671For674Save(prev, next, lim).then(function () {
        return reconcile672673For674Save(prev, next, rid, isEdit);
      });
    });
  }

  function onSubmitSuccess674(event) {
    const rid = String(
      (event.recordId || (event.record && event.record.$id && event.record.$id.value) || ''),
    ).trim();
    const isEdit = /\.edit\.submit\.success$/.test(event.type || '');
    return new kintone.Promise(function (resolve) {
      runPostSaveHooks674(event)
        .catch(function (e) {
          console.error('[NEW-PC-LEDGER-V1] post-save hooks', e);
        })
        .then(function () {
          if (isEdit && rid) delete snapshotBeforeEdit674[rid];
          resolve(event);
        });
    });
  }

  // ===== 自動生成ボタン 雛形 =====

  function createGenerateButton(label, color, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `margin:4px 8px 4px 0;padding:6px 14px;background:${color};color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function injectButtons(event) {
    const space = kintone.app.record.getHeaderMenuSpaceElement();
    if (!space) return;

    // 既存ボタンを除去 (再 inject 防止)
    const existing = document.querySelector('#new-pc-ledger-buttons');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'new-pc-ledger-buttons';
    wrapper.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;margin:8px 0;';

    const type = event.record[FC_ACCOUNT_TYPE]?.value || '';

    // 個人用 自動生成 (種別=個人 のみ表示)
    if (type === TYPE_PERSONAL) {
      wrapper.appendChild(createGenerateButton('🔵 個人用 自動生成', '#0d6efd', () => {
        runPersonalAutoGen().catch(function (e) {
          console.error(e);
          window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
        });
      }));
    }

    // 共有用 自動生成 (種別=共有 または JR端末 — 仕様書 §4.4)
    if (type === TYPE_SHARED || type === TYPE_JR) {
      wrapper.appendChild(createGenerateButton('🟢 共有用 自動生成', '#198754', () => {
        runSharedAutoGen().catch(function (e) {
          console.error(e);
          window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
        });
      }));
    }

    // 全フィールドリセット (全種別)
    wrapper.appendChild(createGenerateButton('🔴 全フィールドリセット', '#dc3545', () => {
      const ok = window.confirm('アカウント情報を全クリアしますか？');
      if (!ok) return;
      runClearAccountFields();
    }));

    // PC 買替 (全種別)
    wrapper.appendChild(createGenerateButton('🔄 PC買替', '#6c757d', () => {
      alert('🛠 Day 5 で実装予定: 既存 594 と同じ動作で継承');
    }));

    // 印刷 (全種別)
    wrapper.appendChild(createGenerateButton('📄 印刷', '#0dcaf0', () => {
      alert('🛠 Day 5 で実装予定: 種別に応じた印刷レイアウト (627 移植)');
    }));

    space.appendChild(wrapper);
  }

  // ===== 種別変更時の確認ダイアログ (仕様書 §4.6.1) =====

  function confirmTypeChangeIfNeeded(event) {
    const newType = event.record[FC_ACCOUNT_TYPE]?.value || '';
    const oldType = event.changes?.field?.value || '';

    if (newType === oldType) return event;

    // 雛形ステージ: 既存アカウント情報の有無を判定 (本実装は 4/27)
    const hasAccount = !!event.record[FC_LOGON_NAME]?.value;
    if (!hasAccount) return event;

    const ok = window.confirm(
      `種別を「${oldType || '(未設定)'}」→「${newType}」に変更すると、現在のアカウント情報がクリアされます。続行しますか？`
    );
    if (!ok) {
      // 種別変更を取消
      event.record[FC_ACCOUNT_TYPE].value = oldType;
      return event;
    }

    // OK → アカウント情報全クリア (雛形では各フィールドを '' にする)
    const accountCodes = [
      FC_LOGON_NAME, FC_LOGON_PW, FC_WINDOWS_NAME,
      FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW,
      FC_M365_ID, FC_M365_PW,
      FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW,
    ];
    for (const code of accountCodes) {
      if (event.record[code]) event.record[code].value = '';
    }
    return event;
  }

  // ===== JR端末 alert (種別変更時 / 仕様書 §4.6.2) =====

  function showJrAlertIfNeeded(event) {
    const newType = event.record[FC_ACCOUNT_TYPE]?.value || '';
    if (newType === TYPE_JR) {
      alert('JR端末は AD 参加しないため、OS ローカルアカウントで手動作成してください。');
    }
    return event;
  }

  // ===== Event handlers =====

  // show events (詳細・新規作成・編集 / PC・モバイル) で UI 適用
  const showEvents = [
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
    'mobile.app.record.detail.show',
    'mobile.app.record.create.show',
    'mobile.app.record.edit.show',
  ];
  kintone.events.on(showEvents, (event) => {
    hideUserSuggest674();
    console.log(`[NEW-PC-LEDGER-V1] BUILD=${BUILD} event=${event.type}`);
    if (
      event.type === 'app.record.edit.show' ||
      event.type === 'mobile.app.record.edit.show'
    ) {
      const rid = event.record.$id && event.record.$id.value;
      if (rid) snapshotBeforeEdit674[String(rid)] = extractState674(event.record);
    }
    if (DEPT_HELP_SHOW_RECORD_EVENTS.has(event.type)) {
      injectDeptHelpBanner();
    } else {
      removeDeptHelpBanner();
    }
    const editable =
      event.type === 'app.record.create.show' ||
      event.type === 'app.record.edit.show' ||
      event.type === 'mobile.app.record.create.show' ||
      event.type === 'mobile.app.record.edit.show';
    applyInternalMetaFieldUi(event.record, editable ? 'editable' : 'detail');
    applySkyseaGroupUi(event.record, editable ? 'editable' : 'detail');
    applyVisibilityByType(event.record);
    showJrBannerIfNeeded(event.record);
    injectButtons(event);
    return new kintone.Promise(function (resolve) {
      refreshLicenseBannerFrom671(event.record)
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] license banner', e);
        })
        .then(function () {
          resolve(event);
        });
    });
  });

  // 種別変更 (account_type フィールドの change イベント)
  const typeChangeEvents = [
    'app.record.create.change.account_type',
    'app.record.edit.change.account_type',
  ];
  kintone.events.on(typeChangeEvents, (event) => {
    hideUserSuggest674();
    let result = confirmTypeChangeIfNeeded(event);
    result = showJrAlertIfNeeded(result);
    if (result.type.startsWith('app.record.create.')) {
      injectDeptHelpBanner();
    } else {
      removeDeptHelpBanner();
    }
    applyInternalMetaFieldUi(result.record, 'editable');
    applySkyseaGroupUi(result.record, 'editable');
    applyVisibilityByType(result.record);
    showJrBannerIfNeeded(result.record);
    injectButtons(result);
    refreshLicenseBannerFrom671(result.record).catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] license banner', e);
    });
    return result;
  });

  // 一覧では所属ヘルプを出さない（§4.2.0b 詳細・新規のみ）
  kintone.events.on('app.record.index.show', () => {
    removeDeptHelpBanner();
    return true;
  });

  // 保存前バリデーション (仕様書 §4.7.1 + §5.3 6 台目ブロック)
  const submitEvents674 = [
    'app.record.create.submit',
    'app.record.edit.submit',
  ];

  function onBeforeSubmit674(event) {
    return new kintone.Promise(function (resolve) {
      const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
      const errors = [];

      if (type === TYPE_PERSONAL && !String(event.record[FC_USER_NAME]?.value || '').trim()) {
        const um = '種別が「個人」のときは「利用者名」を入力してください。';
        errors.push(um);
        event.errors = Object.assign(event.errors || {}, { [FC_USER_NAME]: um });
      }
      if ((type === TYPE_SHARED || type === TYPE_JR) && !String(event.record[FC_SHARED_TERMINAL_NAME]?.value || '').trim()) {
        const sm = '共有端末名を入力してください。';
        errors.push(sm);
        event.errors = Object.assign(event.errors || {}, { [FC_SHARED_TERMINAL_NAME]: sm });
      }

      if (errors.length > 0) {
        event.error = errors.join(' ');
        resolve(event);
        return;
      }

      validateUserNameIn595ForPersonal674(event)
        .then(function (userMsg) {
          if (userMsg) {
            event.error = userMsg;
            event.errors = Object.assign(event.errors || {}, {
              [FC_USER_NAME]: userMsg,
            });
            return null;
          }
          return validateM671SixthSlotBeforeSave674(event);
        })
        .then(function (m671Msg) {
          if (m671Msg) {
            event.error = m671Msg;
            event.errors = Object.assign(event.errors || {}, {
              [FC_M365_MASTER_RECORD_ID]: m671Msg,
            });
          }
        })
        .catch(function (e) {
          console.error('[NEW-PC-LEDGER-V1] 保存前チェック', e);
          event.error =
            '保存前の確認中にエラーが出ました。通信を確認して再度お試しください。続く場合はシステム担当へ連絡してください。';
        })
        .then(function () {
          resolve(event);
        });
    });
  }

  kintone.events.on(submitEvents674, onBeforeSubmit674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      ['mobile.app.record.create.submit', 'mobile.app.record.edit.submit'],
      onBeforeSubmit674,
    );
  }

  const userNameAssistEvents674 = [
    'app.record.create.change.user_name',
    'app.record.edit.change.user_name',
  ];
  kintone.events.on(userNameAssistEvents674, onUserNameFieldChange674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      [
        'mobile.app.record.create.change.user_name',
        'mobile.app.record.edit.change.user_name',
      ],
      onUserNameFieldChange674,
    );
  }

  const submitSuccessEvents674 = [
    'app.record.create.submit.success',
    'app.record.edit.submit.success',
  ];
  kintone.events.on(submitSuccessEvents674, onSubmitSuccess674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      ['mobile.app.record.create.submit.success', 'mobile.app.record.edit.submit.success'],
      onSubmitSuccess674,
    );
  }

  console.log(`[NEW-PC-LEDGER-V1] customize loaded BUILD=${BUILD}`);
  console.log(`[NEW-PC-LEDGER-V1] 関連アプリ: env=${APP_ENV_MASTER} m365=${APP_M365_MASTER} jbm=${APP_JBM_NUMBER} sjbm=${APP_SJBM_NUMBER} employee=${APP_EMPLOYEE}`);
})();
