/**
 * 新・PC台帳ver.1 (Day 4 雛形 / Day 5 で本実装)
 *
 * 仕様: docs/plans/2026-04-21-new-pc-ledger-spec.md v2.1 §4
 * Day 4 plan: docs/plans/2026-04-26-pc-ledger-day4-action.md
 *
 * BUILD: 2026-04-26-day4-skeleton-v0.2 (§4.4 JR でも共有用ボタン表示 / 本実装は 4/27)
 *
 * Day 4 雛形スコープ:
 *   - 種別 (account_type) による表示制御 (show/hide)
 *   - 自動生成ボタン雛形 (クリックで alert "Day 5 で実装")
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

  const BUILD = '2026-04-26-day4-skeleton-v0.2';

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
        alert('🛠 Day 5 で実装予定: 595 社員マスタ + 672 採番マスタから自動払い出し');
      }));
    }

    // 共有用 自動生成 (種別=共有 または JR端末 — 仕様書 §4.4)
    if (type === TYPE_SHARED || type === TYPE_JR) {
      wrapper.appendChild(createGenerateButton('🟢 共有用 自動生成', '#198754', () => {
        if (type === TYPE_JR) {
          alert('🛠 Day 5 で実装予定: 671 M365 管理マスタからのみ自動払い出し（Windows 系は手入力）');
        } else {
          alert('🛠 Day 5 で実装予定: 673 採番マスタ + 671 M365 マスタから自動払い出し');
        }
      }));
    }

    // 全フィールドリセット (全種別)
    wrapper.appendChild(createGenerateButton('🔴 全フィールドリセット', '#dc3545', () => {
      const ok = window.confirm('アカウント情報を全クリアしますか？');
      if (!ok) return;
      alert('🛠 Day 5 で実装予定: アカウント情報全フィールドをクリア');
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
    applyVisibilityByType(result.record);
    showJrBannerIfNeeded(result.record);
    injectButtons(result);
    return result;
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
