/**
 * 新・PC台帳ver.1 (Day 4 雛形 / Day 5 で本実装)
 *
 * 仕様: docs/plans/2026-04-21-new-pc-ledger-spec.md v2.1 §4
 * Day 4 plan: docs/plans/2026-04-26-pc-ledger-day4-action.md
 *
 * BUILD: 2026-04-29-day5-autogen-v0.1 (§4.4 自動生成: 595/670/672/673/671 参照・L1 フォーム反映のみ)
 *
 * Day 4 雛形スコープ:
 *   - 種別 (account_type) による表示制御 (show/hide)
 *   - §4.2.1a: 内部メタは kintone 標準グループ `internal_system_meta` に収容（レイアウトは `npm run pc-ledger:674:layout-internal-group`）。表示時はグループを閉じる・新規・編集では子を disabled
 *   - §4.2.3a: SKYSEA 4 件は `skysea_system_meta`（表示名 SKYSEA処理用）に収容。アカウント部領域のため **権限のあるユーザーは編集可能**。運用で触るのは浜田のみと **周知**（customize ではログインによる非表示はしない）。通常はグループを閉じた初期表示
 *   - 自動生成ボタン: 個人 / 共有 / JR（M365 系）を §4.4 に沿ってフォームへ反映（空欄のみ上書き）
 *   - 5 台ライセンス警告雛形 (赤バナーは仕組みのみ)
 *   - リセット/PC買替/印刷ボタン雛形
 *
 * Day 5 で実装予定 (本実装):
 *   - 採番マスタ 672/673 からの払い出し (個人/共有)
 *   - M365管理マスタ 671 からの ID 取得 (共有/JR)
 *   - 環境設定マスタ 670 からの定数取得
 *   - 595 社員マスタからの自動引用
 *   - 印刷帳票 (627 レイアウト移植)
 *   - 検索バー強化
 */
(function () {
  'use strict';

  const BUILD = '2026-04-29-day5-autogen-v0.1';

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
    const personalOnlyFields = [
      FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW,
      FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW,
    ];

    if (type === TYPE_PERSONAL) {
      setFieldsVisibility(accountFields, true);
    } else if (type === TYPE_SHARED || type === TYPE_JR) {
      setFieldsVisibility(accountFields, true);
      setFieldsVisibility(personalOnlyFields, false);
    } else {
      // サーバーNAS / その他 → アカウント情報全体を非表示
      setFieldsVisibility(accountFields, false);
    }
  }

  // ===== §4.2.0b 所属名・所属グループ 常時ヘルプ帯 =====

  const DEPT_HELP_ID = 'new-pc-ledger-dept-help';

  const DEPT_HELP_SHOW_RECORD_EVENTS = new Set([
    'app.record.detail.show',
    'app.record.create.show',
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

  // ===== JR端末用 黄色バナー (雛形 / 仕様書 §4.5) =====

  function showJrBannerIfNeeded(record) {
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    const existing = document.querySelector('#new-pc-ledger-jr-banner');
    if (existing) existing.remove();

    if (type !== TYPE_JR) return;

    const space = kintone.app.record.getHeaderMenuSpaceElement();
    if (!space) return;
    const banner = document.createElement('div');
    banner.id = 'new-pc-ledger-jr-banner';
    banner.style.cssText = 'background:#fff3cd;color:#664d03;padding:8px 12px;margin:6px 0;border:1px solid #ffe69c;border-radius:4px;font-weight:bold;';
    banner.textContent = '🟡 JR端末は AD 参加しないため、OS ローカルアカウントで手動作成してください';
    space.appendChild(banner);
  }

  // ===== 5 台ライセンス警告 雛形 (仕様書 §4.6.4) =====

  function showLicenseBannerIfNeeded(record) {
    const existing = document.querySelector('#new-pc-ledger-license-banner');
    if (existing) existing.remove();

    // 雛形: m365_master_record_id がある共有/JR で「警告メッセージ」を表示する仕組みのみ
    // 本実装 (4/27) では 671 を query して usage_count >= 5 のときに赤バナー表示
    const masterId = record[FC_M365_MASTER_RECORD_ID]?.value;
    if (!masterId) return;
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    if (type !== TYPE_SHARED && type !== TYPE_JR) return;

    // 雛形ステージ: 4/27 で 671 query 実装
    // const usageCount = await fetchUsageCount(masterId);
    // if (usageCount < 5) return;

    // (Day 4 雛形では赤バナー表示のサンプルのみ)
  }

  // ===== Day 5: 自動生成（§4.4 / L1 フォーム表示のみ・手入力済は上書きしない）=====

  function escapeQueryValue(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function kintoneApiGet(urlPath, params) {
    return kintone.api(kintone.api.url(urlPath, true), 'GET', params);
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

  function mergeNumberField(rec, code, numVal) {
    if (numVal == null || numVal === '') return;
    const cell = rec[code];
    if (!cell || typeof cell !== 'object') return;
    const cur = String(cell.value || '').trim();
    if (cur) return;
    cell.value = String(numVal);
  }

  function runPersonalAutoGen() {
    const recNow = kintone.app.record.get();
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

        kintone.app.record.set(recNow);
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

  // show events (詳細・新規作成・編集) で UI 適用
  const showEvents = [
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
  ];
  kintone.events.on(showEvents, (event) => {
    console.log(`[NEW-PC-LEDGER-V1] BUILD=${BUILD} event=${event.type}`);
    if (DEPT_HELP_SHOW_RECORD_EVENTS.has(event.type)) {
      injectDeptHelpBanner();
    } else {
      removeDeptHelpBanner();
    }
    const editable =
      event.type === 'app.record.create.show' || event.type === 'app.record.edit.show';
    applyInternalMetaFieldUi(event.record, editable ? 'editable' : 'detail');
    applySkyseaGroupUi(event.record, editable ? 'editable' : 'detail');
    applyVisibilityByType(event.record);
    showJrBannerIfNeeded(event.record);
    showLicenseBannerIfNeeded(event.record);
    injectButtons(event);
    return event;
  });

  // 種別変更 (account_type フィールドの change イベント)
  const typeChangeEvents = [
    'app.record.create.change.account_type',
    'app.record.edit.change.account_type',
  ];
  kintone.events.on(typeChangeEvents, (event) => {
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
    return result;
  });

  // 一覧では所属ヘルプを出さない（§4.2.0b 詳細・新規のみ）
  kintone.events.on('app.record.index.show', () => {
    removeDeptHelpBanner();
    return true;
  });

  // 保存前バリデーション (仕様書 §4.7.1)
  const submitEvents = [
    'app.record.create.submit',
    'app.record.edit.submit',
  ];
  kintone.events.on(submitEvents, (event) => {
    const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
    const errors = [];

    if (type === TYPE_PERSONAL && !event.record[FC_USER_NAME]?.value) {
      errors.push('種別=個人 では「利用者名」必須です');
    }
    if ((type === TYPE_SHARED || type === TYPE_JR) && !event.record[FC_SHARED_TERMINAL_NAME]?.value) {
      errors.push(`種別=${type} では「共有端末名」必須です`);
    }

    if (errors.length > 0) {
      event.error = errors.join(' / ');
    }
    return event;
  });

  console.log(`[NEW-PC-LEDGER-V1] customize loaded BUILD=${BUILD}`);
  console.log(`[NEW-PC-LEDGER-V1] 関連アプリ: env=${APP_ENV_MASTER} m365=${APP_M365_MASTER} jbm=${APP_JBM_NUMBER} sjbm=${APP_SJBM_NUMBER} employee=${APP_EMPLOYEE}`);
})();
