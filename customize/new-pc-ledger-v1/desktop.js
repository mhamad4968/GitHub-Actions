/**
 * 新・PC台帳ver.1（Day 4 以降の継続実装）
 *
 * 仕様: docs/plans/2026-04-21-new-pc-ledger-spec.md v2.1 §4
 * Day 4 plan: docs/plans/2026-04-26-pc-ledger-day4-action.md
 *
 * 直近: アカウント手入力優先・671 満杯時の上書き抑止・627 相当の印刷帳票（§4.9）
 *
 * Day 4 雛形スコープ:
 *   - 種別 (account_type) による表示制御 (show/hide)
 *   - §4.2.1a: 内部メタは kintone 標準グループ `internal_system_meta` に収容（レイアウトは `npm run pc-ledger:674:layout-internal-group`）。表示時はグループを閉じる・新規・編集では子を disabled
 *   - §4.2.3a: SKYSEA 4 件は `skysea_system_meta`（表示名 SKYSEA処理用）に収容。アカウント部領域のため **権限のあるユーザーは編集可能**。運用で触るのは浜田のみと **周知**（customize ではログインによる非表示はしない）。通常はグループを閉じた初期表示
 *   - 自動生成ボタン: 個人 / 共有（Windows+M365）/ JR（**M365 のみ**・**PC名は手入力のまま**）を §4.4 に沿ってフォームへ反映（空欄のみ上書き）。**個人**: §4.3.1 **`pc_name`/`pc_serial_no`**（次番採番は **674 台帳内の `JBIS`＋連番の最大**＝`pc_serial_no>0` の最大と **全 `pc_name` の JBIS 形式のみ**から読んだ連番の **いずれか大きい方 +1**。**自動採番時は 670 `PC_SERIAL_MIN_PERSONAL_JBIS`（未設定時 67＝JBIS0067）未満にしない**。共有の **S-JBIS は個人採番に含めない**）。§4.2.2 **`windows_name`=`jbm####[mailの@前]`**（`logon_name` と `[` の間に **`+` は付けない**）・`mail_pw`（jb+乱数4桁+K#）・`gb_id`/`sb_id`=mail_acct・`gb_pw`/`sb_pw`=logon_name**（メール空時は ID 系は案内のみ）。**共有**: **`S-JBIS####-YYYYMM`**（`pc_serial_no>0` の最大と台帳内 **`S-JBIS####` の `pc_name` のみ**から読んだ 4 桁の **いずれか大きい方 +1**。個人の **JBIS は共有採番に含めない**）と Windows 採番。**JR**: PC 名・Windows は自動で触らない
 *   - 5 台ライセンス警告雛形 (赤バナーは仕組みのみ)
 *   - リセット／PC買替（§4.10.3・596 採番・671 整合・595 個人リンク）／印刷（627 レイアウト移植済）
 *   - **レコード閲覧（detail）**: **ステータス≠保管**のとき操作ボタンは **PC買替・印刷のみ**。**保管の閲覧**ではカスタムヘッダを付けない（余計なボタンなし）。**新規・編集かつ保管**（個人/共有/JR いずれも）: ヘッダは **全フィールドリセットのみ**。**利用中**等の非保管は従来の種別別ボタン＋PC買替・印刷。
 *
 * Day 5 残タスク（未完了のみ）:
 *   - （一覧）**SKYSEA 状態チップ**: **当面 UI 非表示**（§4.8a）。`query` 内の `skysea_status in (...)` は **引き続き解釈**（旧 URL 互換）。再表示は SKYSEA 計画後。
 *   - （一覧）**絞り込み URL**: `query` と `npl674kw` から **キーワード・種別（・SKYSEA in）**を復元（当バーが生成した形式に準拠）。
 *   - **PC買替は実装済**（§4.10.3）。594 同趣旨。**627 二重更新なし**。v0.9.14: ボタン掛け先フォールバック＋遅延再 inject、`import_source=PC_REPLACE_FROM_674:<旧$id>`。
 *   - 新規・編集: **所属ヘルプ `<details>`（入れ方・コピー一覧）は表示しない**（2026-05-05 浜田指示）。**入力支援**: `document` **capture** でフィールド内クリックを捕捉（kintone 内側の `stopPropagation` より先）。**はい／いいえ** の z-index は kintone ヘッダより上。**明示ボタン**は **`#new-pc-ledger-buttons` 帯**に **「入力支援利用」**（個人・非保管→595／共有・JR→680。表示名は同一、`aria-label` で区別）（フィールド直下 DOM 挿入は廃止）。ヘッダの旧「社員名検索／所属候補」ボタンは**廃止**。**`pc_status`=保管**のときは種別横断で **ヘッダは全フィールドリセットのみ**。**種別／ステータス**は record を DOM と突合。**共有・個人の自動生成**: `m365_master_record_id` は **set 前に disabled 解除**。**`pc_serial_no` 等内部メタ子**（§4.2.1a）も **`record.set` 同期間だけ** disabled 解除してから反映。
 *   - **備考（note）**: 全種別で任意（保存前チェックでは必須にしない）。
 *   - **モバイル**: 当面は利用想定なし（`kintone.mobile` 分岐は既存のまま残すが、専用UXは追わない）。
 *   - **M365管理マスタレコード番号（671 `$id`）**: 共有・JR は同一671行の **usage_count / 5 台**運用で紐づく。個人は表示するが多くは空（自動生成はメール由来M365中心）。**手入力不可**（自動生成・保存後同期のみ更新）。
 *   - **PC名（`pc_name`）**: 全種別で **保存必須**（運用: **PCの管理番号＝PC名**）。
 *   - **個人の JBIS+4桁**: 他の個人レコード（廃棄以外）と **同一 JBISxxxx** のとき保存前に室長確認の警告（赤）＋はい/いいえ。詳細・編集でも赤バナー表示。
 *
 * **674 本番**: `npl_disposed_pc_copy` を一覧キーワード検索に含める。**フィールド未追加のまま本 BUILD の JS だけ載せると一覧 REST が失敗し得る**ため、先に **`npm run pc-ledger:674:add-npl-disposed-pc-field-preview`**（`kintone-apps.md` 674 行の反映順）。
 */
(function () {
  'use strict';

  const BUILD = '2026-05-14-m365-assist-new-when-empty-only';

  /** 編集画面表示直後の割当状態（submit.success で §4.10 / §5.3 と突合） */
  const snapshotBeforeEdit674 = Object.create(null);
  let jb674PrintRecordSnapshot = null;

  /** `getFieldElement` の戻りを短時間再利用（クリック委譲ごとの再探索を抑止） */
  let npl674FieldElCacheEntries674 = Object.create(null);

  function bumpNpl674FieldElementCache674() {
    npl674FieldElCacheEntries674 = Object.create(null);
  }

  /** `findSelectUnderFieldRoot674` の結果（フィールドルートごと） */
  const npl674SelectUnderRootMap674 = new WeakMap();

  // ===== 関連アプリ ID (kintone-apps.md 参照) =====
  const APP_ENV_MASTER = '670';     // 環境設定マスタ
  const APP_M365_MASTER = '671';    // M365管理マスタ
  const APP_JBM_NUMBER = '672';     // 新個人WindowsID採番マスタ (jbm)
  const APP_SJBM_NUMBER = '673';    // 新共有WindowsID採番マスタ (sjbm)
  const APP_EMPLOYEE = '595';       // 社員情報マスタ
  /** 674 用 所属名／所属グループ候補マスタ（Space 21。未作成・権限なし時は埋め込み一覧にフォールバック） */
  const APP_DEPT_MASTER_674 = '680';
  /** PC 採番マスタ（594 買替と同一。596 の in_code に 〇 で占有） */
  const APP_PC_NUMBER_596 = '596';
  const FC_596_PREFIX = 'number_top';
  const FC_596_IN_USE = 'in_code';
  const USED_MARK_596 = '〇';

  /** §4.10.3 PC買替: 旧レコードのステータス・新規側の初期ステータス（アプリのドロップダウン文言と一致させる） */
  const STATUS_AFTER_REPLACE_OLD_674 = '廃棄';
  const STATUS_FOR_NEW_AFTER_REPLACE_674 = '利用中';
  /** 買替完了後、新レコード表示でフォロー用バナーを一度だけ出す */
  const STORAGE_KEY_674_REPLACE_NOTICE = 'jbis674_replace_notice_v1';

  /** 595 側: 新・PC台帳（674）との紐づけ（setup-595-pc-ledger-v1-list-subtable.js で追加） */
  const FC595_PC674_SUB = 'pc_ledger_v1_list';
  const FC595_PC674_ID = 'pc_674_record_id';
  /** 個人は PC 最大2台まで 595 にリンク（共有・JR は制限なし＝595に書かない） */
  const PERSONAL674_LINK_MAX = 2;

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
  /** 595 の社員管理番号と同じ値（個人のみ。mail が無いときの595突合用） */
  const FC_EMP_ID = 'emp_id';
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
  const FC_CREATED_AT_JST = 'created_at_jst';
  const INTERNAL_CHILD_CODES = [
    FC_PC_SERIAL_NO,
    FC_IMPORT_SOURCE,
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

  /** 全フィールドリセット対象（種別・PCステータス・作成日時JST・システム項目は除外） */
  const FC_EXTRA_INFO_1 = 'extra_info_1';
  const FC_EXTRA_INFO_2 = 'extra_info_2';
  const FC_FIXED_IP_1 = 'fixed_ip_1';
  const FC_FIXED_IP_2 = 'fixed_ip_2';
  const FC_MANUFACTURER = 'manufacturer';
  const FC_MANUFACTURING_NO = 'manufacturing_no';
  const FC_MODEL_NAME = 'model_name';
  const FC_NOTE = 'note';
  /** 部署レビュー（2026-05-11）: 転用フロー A — チェック後にヘッダから「元PC廃棄」を確定（`npm run pc-ledger:674:add-transfer-manual-preview`） */
  const FC_NPL_TRANSFER_MANUAL = 'npl_transfer_manual';
  const FC_NPL_TRANSFER_MANUAL_OPT = '転用';
  /** 転用ウィザードで廃棄した旧 PC の識別子を転記（§4.10.6・一覧キーワード検索対象） */
  const FC_NPL_DISPOSED_PC_COPY = 'npl_disposed_pc_copy';
  /** 編集画面で転用チェックの直前状態（外すときの確認用） */
  let npl674PrevTransferManualChecked674 = false;
  /** `change` / `show` で同期した「転用」ON（`setTimeout` 内の `get()` 遅れ・重い DOM 全走査を避ける） */
  let npl674TransferManualMirror674 = false;
  const FC_PURCHASE_DATE = 'purchase_date';
  const FC_PURCHASE_AMOUNT = 'purchase_amount';
  const FC_PURCHASE_VENDOR = 'purchase_vendor';
  const FC_PURCHASE_VENDOR_OTHER = 'purchase_vendor_other';
  const FC_LATEST_INVENTORY_DATE = 'latest_inventory_date';
  const FC_VPN_ID = 'vpn_id';
  const FC_VPN_PW = 'vpn_pw';
  const FULL_RESET_FIELD_CODES_674 = [
    FC_PC_NAME,
    FC_SERIAL,
    FC_PC_SERIAL_NO,
    FC_USER_NAME,
    FC_DEPT_NAME,
    FC_GROUP_NAME,
    FC_SHARED_TERMINAL_NAME,
    FC_EXTRA_INFO_1,
    FC_EXTRA_INFO_2,
    FC_FIXED_IP_1,
    FC_FIXED_IP_2,
    FC_MANUFACTURER,
    FC_MANUFACTURING_NO,
    FC_MODEL_NAME,
    FC_NOTE,
    FC_PURCHASE_DATE,
    FC_PURCHASE_AMOUNT,
    FC_PURCHASE_VENDOR,
    FC_PURCHASE_VENDOR_OTHER,
    FC_LATEST_INVENTORY_DATE,
    FC_VPN_ID,
    FC_VPN_PW,
    FC_LOGON_NAME,
    FC_LOGON_PW,
    FC_WINDOWS_NAME,
    FC_MAIL,
    FC_MAIL_ACCT,
    FC_MAIL_PW,
    FC_M365_ID,
    FC_M365_PW,
    FC_GB_ID,
    FC_GB_PW,
    FC_SB_ID,
    FC_SB_PW,
    FC_M365_MASTER_RECORD_ID,
    FC_IMPORT_SOURCE,
  ].concat(SKYSEA_CHILD_CODES);

  /** PC買替で新レコード側から空にする項目（アカウント・種別・所属は継承。§4.10.3） */
  const REPLACEMENT_CLEAR_FIELD_CODES_674 = [
    FC_SERIAL,
    FC_PC_SERIAL_NO,
    FC_MANUFACTURER,
    FC_MANUFACTURING_NO,
    FC_MODEL_NAME,
    FC_NOTE,
    FC_PURCHASE_DATE,
    FC_PURCHASE_AMOUNT,
    FC_PURCHASE_VENDOR,
    FC_PURCHASE_VENDOR_OTHER,
    FC_LATEST_INVENTORY_DATE,
    FC_EXTRA_INFO_1,
    FC_EXTRA_INFO_2,
    FC_FIXED_IP_1,
    FC_FIXED_IP_2,
  ].concat(SKYSEA_CHILD_CODES);

  // ===== 種別 (account_type) のオプション =====
  const TYPE_PERSONAL = '個人';
  const TYPE_SHARED = '共有';
  const TYPE_JR = 'JR端末';
  const TYPE_SERVER = 'サーバーNAS';
  const TYPE_OTHER = 'その他';

  /** §4.1a 個人×保管 — アカウント運用対象外（627 非結合・CSV アカウント空） */
  const PC_STATUS_STORAGE = '保管';

  function isPersonalStored(record) {
    if (!record || !record[FC_ACCOUNT_TYPE]) return false;
    if ((record[FC_ACCOUNT_TYPE].value || '') !== TYPE_PERSONAL) return false;
    const st = String((record[FC_PC_STATUS] && record[FC_PC_STATUS].value) || '').trim();
    return st === PC_STATUS_STORAGE;
  }

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
   * 671 行番号（`m365_master_record_id`）は **編集画面で手入力させない**（権限に頼らず誤変更を防ぐ）。
   * 共有・JR: 自動生成・保存後の 671 同期が値を持つ。個人: 表示のみで空のことが多い。**編集で disabled=true のまま `kintone.app.record.set` に値を載せると検証エラーになる**ため、`runSharedAutoGen` 等では **set の直前だけ disabled=false** にしてから反映する。
   * @param {Record<string, object>} record
   * @param {'detail'|'editable'} mode
   */
  function applyM365MasterRecordIdFieldUi674(record, mode) {
    const cell = record && record[FC_M365_MASTER_RECORD_ID];
    if (!cell || !Object.prototype.hasOwnProperty.call(cell, 'disabled')) return;
    cell.disabled = mode === 'editable';
  }

  /**
   * §4.2.1a: `internal_system_meta` の子は編集時 **disabled**。そのまま値を書き換えて `record.set` すると **「入力内容が正しくありません」** になるため、**set 同期間だけ** disabled を外し終了後に戻す。
   * @param {Record<string, object>} record
   * @param {function(): void} fn
   */
  /**
   * 内部メタ子は **disabled=true のときだけでなく**、`disabled` が未定義でも kintone 側が読み取り専用扱いする場合がある。
   * いったん **必ず false** にしてから `set` し、元の状態（独自プロパティの有無・値）を復元する。
   */
  function withWritableInternalMeta674(record, fn) {
    const restored = [];
    for (let i = 0; i < INTERNAL_CHILD_CODES.length; i++) {
      const code = INTERNAL_CHILD_CODES[i];
      const cell = record && record[code];
      if (!cell || typeof cell !== 'object' || !Object.prototype.hasOwnProperty.call(cell, 'value')) continue;
      const hadOwn = Object.prototype.hasOwnProperty.call(cell, 'disabled');
      const prev = hadOwn ? cell.disabled : undefined;
      restored.push({ cell: cell, hadOwn: hadOwn, prev: prev });
      cell.disabled = false;
    }
    try {
      fn();
    } finally {
      for (let j = 0; j < restored.length; j++) {
        const s = restored[j];
        if (s.hadOwn) {
          s.cell.disabled = s.prev;
        } else {
          try {
            delete s.cell.disabled;
          } catch (_e) {
            s.cell.disabled = true;
          }
        }
      }
    }
  }

  /**
   * 種別に応じたフォーム表示制御（2026-05 GO: 共有・JR は最小セット、NAS/その他は全表示、個人＋保管は同一）
   * 固定IP1/2 はサーバーNASのみ表示・**必須にしない**（必要時のみ濱田手入力の任意項目。他種別は DHCP のため非表示）。
   */
  function applyVisibilityByType(record) {
    const type = record[FC_ACCOUNT_TYPE]?.value || '';

    const VPN_FIELDS = [FC_VPN_ID, FC_VPN_PW];
    const MAIL_CYBOZU = [FC_MAIL, FC_MAIL_ACCT, FC_MAIL_PW, FC_GB_ID, FC_GB_PW, FC_SB_ID, FC_SB_PW];

    const ALL_SCALAR_FOR_VISIBILITY = [
      FC_ACCOUNT_TYPE,
      FC_PC_STATUS,
      FC_PC_NAME,
      FC_SERIAL,
      FC_PC_SERIAL_NO,
      FC_USER_NAME,
      FC_DEPT_NAME,
      FC_GROUP_NAME,
      FC_SHARED_TERMINAL_NAME,
      FC_EXTRA_INFO_1,
      FC_EXTRA_INFO_2,
      FC_FIXED_IP_1,
      FC_FIXED_IP_2,
      FC_MANUFACTURER,
      FC_MANUFACTURING_NO,
      FC_MODEL_NAME,
      FC_NOTE,
      FC_PURCHASE_DATE,
      FC_PURCHASE_AMOUNT,
      FC_PURCHASE_VENDOR,
      FC_PURCHASE_VENDOR_OTHER,
      FC_LATEST_INVENTORY_DATE,
      FC_LOGON_NAME,
      FC_LOGON_PW,
      FC_WINDOWS_NAME,
      FC_MAIL,
      FC_MAIL_ACCT,
      FC_MAIL_PW,
      FC_M365_ID,
      FC_M365_PW,
      FC_GB_ID,
      FC_GB_PW,
      FC_SB_ID,
      FC_SB_PW,
      FC_VPN_ID,
      FC_VPN_PW,
      FC_EMP_ID,
      FC_M365_MASTER_RECORD_ID,
    ];

    const GROUP_FIELD_CODES = [FC_INTERNAL_GROUP, FC_SKYSEA_GROUP];

    if (type === TYPE_SHARED || type === TYPE_JR) {
      const allow = new Set([
        FC_ACCOUNT_TYPE,
        FC_PC_STATUS,
        FC_DEPT_NAME,
        FC_GROUP_NAME,
        FC_PURCHASE_DATE,
        FC_PURCHASE_AMOUNT,
        FC_PURCHASE_VENDOR,
        FC_PURCHASE_VENDOR_OTHER,
        FC_LATEST_INVENTORY_DATE,
        FC_NOTE,
        FC_PC_NAME,
        FC_SHARED_TERMINAL_NAME,
        FC_M365_ID,
        FC_M365_PW,
        FC_M365_MASTER_RECORD_ID,
        FC_WINDOWS_NAME,
        FC_LOGON_NAME,
        FC_LOGON_PW,
        FC_SERIAL,
        FC_PC_SERIAL_NO,
        FC_MANUFACTURER,
        FC_MANUFACTURING_NO,
        FC_MODEL_NAME,
        FC_EXTRA_INFO_1,
        FC_EXTRA_INFO_2,
        FC_EMP_ID,
      ]);
      for (let i = 0; i < ALL_SCALAR_FOR_VISIBILITY.length; i++) {
        const c = ALL_SCALAR_FOR_VISIBILITY[i];
        setFieldsVisibility([c], allow.has(c));
      }
      setFieldsVisibility(VPN_FIELDS, false);
      setFieldsVisibility(MAIL_CYBOZU, false);
      setFieldsVisibility(GROUP_FIELD_CODES, true);
      return;
    }

    setFieldsVisibility(ALL_SCALAR_FOR_VISIBILITY, true);
    setFieldsVisibility(GROUP_FIELD_CODES, true);

    if (type === TYPE_PERSONAL) {
      setFieldsVisibility([FC_SHARED_TERMINAL_NAME], false);
      setFieldsVisibility([FC_FIXED_IP_1, FC_FIXED_IP_2], false);
      setFieldsVisibility(VPN_FIELDS, true);
      setFieldsVisibility(MAIL_CYBOZU, true);
      return;
    }

    setFieldsVisibility(VPN_FIELDS, false);
    if (type !== TYPE_SERVER) {
      setFieldsVisibility([FC_FIXED_IP_1, FC_FIXED_IP_2], false);
    }
  }

  // ===== §4.2.0b 所属ヘルプ（2026-05-05 撤去: 旧 `<details>` ブロックの DOM のみ除去）=====

  const DEPT_HELP_ID = 'new-pc-ledger-dept-help';

  function removeDeptHelpBanner() {
    const el = document.getElementById(DEPT_HELP_ID);
    if (el) el.remove();
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

  /**
   * ヘッダメニュースペースが未配置の環境でもボタンを出す（594 / 678 と同趣旨の複数候補）。
   * **新規作成（create.show）**では `getHeaderMenuSpaceElement` が一瞬 null のことがあり、ツールバーより先に **フォーム `.layout-gaia` 先頭**へ載せる。
   * @returns {{ el: HTMLElement, mode: 'header' | 'toolbar' | 'body' | 'form', prepend?: boolean } | null}
   */
  function resolveButtonMountSpace674() {
    const h = getHeaderSpace674();
    if (h) return { el: h, mode: 'header' };
    try {
      if (kintone.app && typeof kintone.app.getHeaderMenuSpaceElement === 'function') {
        const g = kintone.app.getHeaderMenuSpaceElement();
        if (g) return { el: g, mode: 'header' };
      }
    } catch (_e) {
      /* ignore */
    }
    try {
      if (kintone.app && typeof kintone.app.getHeaderSpaceElement === 'function') {
        const hs = kintone.app.getHeaderSpaceElement();
        if (hs) return { el: hs, mode: 'header' };
      }
    } catch (_e2) {
      /* ignore */
    }
    const toolbar = document.querySelector('.gaia-argoui-app-toolbar');
    if (toolbar) return { el: toolbar, mode: 'toolbar' };
    const layout = document.querySelector('#contents-body .layout-gaia') || document.querySelector('.layout-gaia');
    if (layout) return { el: layout, mode: 'form', prepend: true };
    if (document.body) return { el: document.body, mode: 'body' };
    return null;
  }

  /** show 後でもヘッダ DOM が遅れることがあるため、ボタン未生成なら再試行する */
  function getRecord674ForInject674() {
    try {
      const h = kintone.app.record.get();
      if (h && h.record) return h.record;
    } catch (_e) {
      /* noop */
    }
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        const hm = kintone.mobile.app.record.get();
        if (hm && hm.record) return hm.record;
      }
    } catch (_e2) {
      /* noop */
    }
    return null;
  }

  /** `kintone.app.record.get()` の **`record` 本体**（ウィザード等で holder を誤って渡さない） */
  function get674EditRecordOrNull674() {
    try {
      const bag = getRecordFormHolder674();
      if (bag && bag.holder && bag.holder.record) return bag.holder.record;
      const h = kintone.app.record.get();
      if (h && h.record) return h.record;
    } catch (_e) {
      /* ignore */
    }
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        const hm = kintone.mobile.app.record.get();
        if (hm && hm.record) return hm.record;
      }
    } catch (_e2) {
      /* ignore */
    }
    return null;
  }

  function scheduleInjectButtons674(event) {
    injectButtons(event);
    const delays = [120, 300, 600, 1500, 3500, 5500, 8500, 12000];
    for (let i = 0; i < delays.length; i++) {
      (function (ms) {
        setTimeout(function () {
          if (document.getElementById('new-pc-ledger-buttons')) return;
          const rec = getRecord674ForInject674();
          if (!rec) return;
          injectButtons({ type: event.type, record: rec });
        }, ms);
      })(delays[i]);
    }
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

  /** REST／フォーム由来の値を正の整数に正規化（数値中のカンマのみ除去）。 */
  function toPositiveInt674(v) {
    const s = String(v == null ? '' : v)
      .replace(/,/g, '')
      .trim();
    if (!s) return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * §4.3.1 `pc_name` の接頭辞直後の連番文字列。
   * 1〜9999 は 4 桁ゼロ埋め。**10000 以上は桁そのまま**（`9999` の次は **`10000`** → `JBIS10000-…`。先頭4桁だけ取ると `1000` になる誤りを避ける）。
   */
  function formatPcNameJbisSerialDigits674(n) {
    const k = Math.floor(Number(n));
    if (!Number.isFinite(k) || k < 1) return '0001';
    if (k <= 9999) return String(k).padStart(4, '0');
    return String(k);
  }

  /** 個人 PC 名の先頭 JBIS＋連番（例 JBIS0349、JBIS10000）。`-YYYYMM` の前まで。§4.3.1 形式外は null */
  function extractPersonalJbisCore674(pcName) {
    const m = /^JBIS(\d+)(?=-|$)/i.exec(String(pcName || '').trim());
    if (!m) return null;
    return 'JBIS' + m[1];
  }

  /**
   * 同一 JBIS コアの **他** 個人レコード（廃棄以外）。`excludeId` は編集時に自分自身の $id。
   * @returns {Promise<Array<{id:string,pc_name:string,user_name:string}>>}
   */
  function fetchOtherPersonalSameJbisCore674(jbisCore, excludeId) {
    const core = String(jbisCore || '').trim();
    if (!core) return Promise.resolve([]);
    const escU = escapeQueryValue(core.toUpperCase());
    const escL = escapeQueryValue(core.toLowerCase());
    // DROP_DOWN は REST クエリで = 不可 → in ("…") を使う（GAIA_IQ03）。
    // like は部分文字列のみ（SQL の % は不可・400 になる）。
    const q =
      'account_type in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '") and pc_status not in ("廃棄") and ' +
      '(pc_name like "' +
      escU +
      '" or pc_name like "' +
      escL +
      '") limit 500';
    const ex = excludeId != null && String(excludeId).trim() !== '' ? String(excludeId).trim() : '';
    return kintoneApiGet('/k/v1/records.json', {
      app: kintone.app.getId(),
      query: q,
      fields: ['$id', FC_PC_NAME, FC_USER_NAME],
    }).then(function (resp) {
      const out = [];
      for (const row of resp.records || []) {
        const idStr = row.$id != null && row.$id.value != null ? String(row.$id.value) : '';
        if (ex && idStr === ex) continue;
        const pn = String((row[FC_PC_NAME] && row[FC_PC_NAME].value) || '').trim();
        const rowCore = extractPersonalJbisCore674(pn);
        if (!rowCore || rowCore !== core) continue;
        out.push({
          id: idStr,
          pc_name: pn,
          user_name: String((row[FC_USER_NAME] && row[FC_USER_NAME].value) || '').trim(),
        });
      }
      return out;
    });
  }

  function removePcNameDupBanner674() {
    const n = document.getElementById('jb674-pc-name-dup-banner');
    if (n) n.remove();
  }

  /**
   * 個人・JBIS 形式で他レコードとコア重複時、ヘッダに赤バナー（詳細・新規・編集）。
   * @returns {Promise<void>}
   */
  function refreshPcNameDupBanner674(record) {
    removePcNameDupBanner674();
    if (!record) return Promise.resolve();
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    const st = String(record[FC_PC_STATUS]?.value || '').trim();
    if (type !== TYPE_PERSONAL || st === '廃棄') return Promise.resolve();
    const pcn = trimmedScalarValue674(record, FC_PC_NAME);
    const core = extractPersonalJbisCore674(pcn);
    if (!core) return Promise.resolve();
    const rid = record.$id && record.$id.value != null ? String(record.$id.value) : '';
    const space = getHeaderSpace674();
    if (!space) return Promise.resolve();
    return fetchOtherPersonalSameJbisCore674(core, rid).then(function (others) {
      if (!others.length) return;
      const banner = document.createElement('div');
      banner.id = 'jb674-pc-name-dup-banner';
      banner.style.cssText =
        'background:#f8d7da;border:1px solid #f5c2c7;border-radius:4px;padding:10px 12px;margin:6px 0;' +
        'font-size:13px;line-height:1.45;color:#842029;';
      const title = document.createElement('div');
      title.style.cssText = 'color:#b02a37;font-weight:bold;font-size:14px;margin-bottom:6px;';
      title.textContent = 'PC名重複';
      banner.appendChild(title);
      const lead = document.createElement('div');
      lead.style.marginBottom = '6px';
      lead.innerHTML =
        '個人のPC名の <strong style="color:#b02a37;">' +
        core +
        '</strong>（JBIS＋連番の管理番号部分）が、他の利用中・保管レコードと重複しています。室長へ確認してください。';
      banner.appendChild(lead);
      const ul = document.createElement('ul');
      ul.style.cssText = 'margin:4px 0 0 18px;padding:0;color:#b02a37;';
      const max = 12;
      for (let i = 0; i < others.length && i < max; i++) {
        const o = others[i];
        const li = document.createElement('li');
        li.style.marginBottom = '2px';
        li.textContent =
          'レコード番号 ' + o.id + '／PC名「' + o.pc_name + '」' + (o.user_name ? '／利用者「' + o.user_name + '」' : '');
        ul.appendChild(li);
      }
      if (others.length > max) {
        const li = document.createElement('li');
        li.textContent = '…他 ' + (others.length - max) + ' 件';
        ul.appendChild(li);
      }
      banner.appendChild(ul);
      space.insertBefore(banner, space.firstChild);
    });
  }

  function removeJbisDupConfirmModal674() {
    const n = document.getElementById('jb674-jbis-dup-modal');
    if (n) n.remove();
  }

  /**
   * JBIS コア重複時の室長確認ダイアログ（赤文字・はい／いいえ）。
   * @returns {kintone.Promise<boolean>} true=保存続行
   */
  function confirmJbisDuplicateWithChief674(jbisCore, others) {
    return new kintone.Promise(function (resolve) {
      removeJbisDupConfirmModal674();
      const overlay = document.createElement('div');
      overlay.id = 'jb674-jbis-dup-modal';
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:200000;background:rgba(15,23,42,.45);' +
        'display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      const box = document.createElement('div');
      box.style.cssText =
        'background:#fff;max-width:520px;width:100%;border-radius:8px;padding:20px 22px;' +
        'box-shadow:0 12px 40px rgba(0,0,0,.2);font-family:inherit;';
      const redTitle = document.createElement('div');
      redTitle.style.cssText = 'color:#b02a37;font-weight:bold;font-size:16px;margin-bottom:10px;';
      redTitle.textContent = 'PC名（JBIS+4桁）が重複しています';
      box.appendChild(redTitle);
      const msg = document.createElement('div');
      msg.style.cssText = 'color:#b02a37;font-size:14px;line-height:1.55;margin-bottom:12px;';
      msg.innerHTML =
        '<strong>' +
        jbisCore +
        '</strong> が他レコードと重複しています。このまま登録してよいか<strong>室長へ確認</strong>してください。';
      box.appendChild(msg);
      const sub = document.createElement('div');
      sub.style.cssText = 'color:#495057;font-size:13px;margin-bottom:10px;';
      sub.textContent = '問題なく登録してよい場合は「はい」、取りやめる場合は「いいえ」を選んでください。';
      box.appendChild(sub);
      const ul = document.createElement('ul');
      ul.style.cssText = 'margin:0 0 14px 18px;padding:0;font-size:13px;color:#842029;max-height:160px;overflow:auto;';
      for (let i = 0; i < others.length && i < 10; i++) {
        const o = others[i];
        const li = document.createElement('li');
        li.style.marginBottom = '3px';
        li.textContent = 'No.' + o.id + ' ／ 「' + o.pc_name + '」' + (o.user_name ? '（' + o.user_name + '）' : '');
        ul.appendChild(li);
      }
      if (others.length > 10) {
        const li = document.createElement('li');
        li.textContent = '…他 ' + (others.length - 10) + ' 件';
        ul.appendChild(li);
      }
      box.appendChild(ul);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;';
      const btnNo = document.createElement('button');
      btnNo.type = 'button';
      btnNo.textContent = 'いいえ';
      btnNo.style.cssText =
        'padding:8px 18px;border:1px solid #ced4da;border-radius:4px;background:#fff;cursor:pointer;font-weight:bold;';
      const btnYes = document.createElement('button');
      btnYes.type = 'button';
      btnYes.textContent = 'はい';
      btnYes.style.cssText =
        'padding:8px 18px;border:none;border-radius:4px;background:#0d6efd;color:#fff;cursor:pointer;font-weight:bold;';
      function done(ok) {
        removeJbisDupConfirmModal674();
        resolve(ok);
      }
      btnNo.addEventListener('click', function () {
        done(false);
      });
      btnYes.addEventListener('click', function () {
        done(true);
      });
      row.appendChild(btnNo);
      row.appendChild(btnYes);
      box.appendChild(row);
      overlay.appendChild(box);
      overlay.addEventListener('click', function (ev) {
        if (ev.target === overlay) done(false);
      });
      document.body.appendChild(overlay);
    });
  }

  /**
   * 個人・JBIS 形式で他レコードとコア重複時、室長確認モーダル。
   * @returns {Promise<'ok'|'cancelled'>}
   */
  function checkPersonalJbisDuplicateBeforeSave674(event) {
    const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
    if (type !== TYPE_PERSONAL) return Promise.resolve('ok');
    const pcn = trimmedScalarValue674(event.record, FC_PC_NAME);
    const core = extractPersonalJbisCore674(pcn);
    if (!core) return Promise.resolve('ok');
    const rid = event.record.$id && event.record.$id.value != null ? String(event.record.$id.value) : '';
    return fetchOtherPersonalSameJbisCore674(core, rid).then(function (others) {
      if (!others.length) return 'ok';
      return confirmJbisDuplicateWithChief674(core, others).then(function (yes) {
        return yes ? 'ok' : 'cancelled';
      });
    });
  }

  /** 保存前照合・自動生成用: 595 user_name と入力の表記ゆれ（全角スペース・ゼロ幅・互換文字）を吸収 */
  function normalize595UserNameForMatch674(s) {
    return String(s || '')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .trim()
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .normalize('NFKC');
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
    const raw = String(userName || '').trim();
    if (!raw) return Promise.resolve(null);
    const q = `user_name = "${escapeQueryValue(raw)}" and employment_status not in ("退職") limit 1`;
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_EMPLOYEE,
      query: q,
      fields: ['user_name', 'mail', 'emp_id', 'dept_name', 'group_name', 'employment_status'],
    }).then(function (resp) {
      const hit = (resp.records && resp.records[0]) || null;
      if (hit) return hit;
      const key = normalize595UserNameForMatch674(raw);
      if (!key) return null;
      return searchEmployees595Contains(raw, 25).then(function (rows) {
        for (const r of rows || []) {
          const un = (r.user_name && r.user_name.value) || '';
          if (normalize595UserNameForMatch674(un) === key) return r;
        }
        return null;
      });
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
      fields: ['user_name', 'mail', 'emp_id', 'dept_name', 'group_name', 'employment_status'],
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

  /**
   * 個人 PC 名の先頭 `JBIS`＋連番から数値（`-YYYYMM` の前まで）。共有の S-JBIS は **含めない**。
   */
  function extractJbisFourDigitFromPcName674(pcName) {
    const m = /^JBIS(\d+)(?=-|$)/i.exec(String(pcName || '').trim());
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER ? Math.floor(n) : null;
  }

  /**
   * 共有 PC 名の先頭 `S-JBIS`＋連番から数値（`-YYYYMM` の前まで）。個人の JBIS は **含めない**。
   */
  function extractSjbisFourDigitFromPcName674(pcName) {
    const m = /^S-JBIS(\d+)(?=-|$)/i.exec(String(pcName || '').trim());
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER ? Math.floor(n) : null;
  }

  /**
   * 互換: 同一 `pc_name` に S-JBIS を先に判定し、無ければ JBIS（他用途・旧ロジック用）。
   */
  function extractFourDigitSerialFromPcName674(pcName) {
    const sj = extractSjbisFourDigitFromPcName674(pcName);
    if (sj != null) return sj;
    return extractJbisFourDigitFromPcName674(pcName);
  }

  /**
   * §4.3.1: 次の PC 名連番用の「参照用最大連番」（数値）。
   * - **個人**: **廃棄以外・個人行の `pc_name` から JBIS 連番だけ**走査した最大（**`pc_serial_no` の最大は使わない**）。  
   *   `pc_serial_no` が 10000 など **PC 名の JBIS と無関係に大きい**と `max+1` が `JBIS10000-…` に飛ぶため。
   * - **共有**: **廃棄以外・共有行**の `pc_serial_no>0` の最大と、同条件の **`pc_name` の S-JBIS 連番**の最大の **いずれか大きい方**。
   * （**廃棄**の `JBIS9999` 等は max に含めない。）
   * （`JBIS`／S-JBIS 連番は **可変桁**で読む。）
   * 無い・失敗時は 0。`mergePcNameSerialFromMax674` では **これ +1**（個人は **670 下限**と併用）→ 利用中の末尾が **66** なら **67、次の台帳は 68** …と **1 台ずつ足していく**のと同じになる。
   * @param {'personal'|'shared'} kind
   */
  function fetchMaxPcSerial674(kind) {
    const appId = kintone.app.getId();
    const notDisposed = 'pc_status not in ("' + escapeQueryValue(STATUS_AFTER_REPLACE_OLD_674) + '") and ';
    const serialScope =
      (kind === 'personal'
        ? 'account_type in ("' + escapeQueryValue(TYPE_PERSONAL) + '") and '
        : 'account_type in ("' + escapeQueryValue(TYPE_SHARED) + '") and ') + notDisposed;
    const fromField =
      kind === 'personal'
        ? Promise.resolve(0)
        : kintoneApiGet('/k/v1/records.json', {
            app: appId,
            query: serialScope + 'pc_serial_no > 0 order by pc_serial_no desc limit 1',
            fields: [FC_PC_SERIAL_NO],
          })
              .then(function (resp) {
                const row = (resp.records && resp.records[0]) || null;
                if (!row || !row[FC_PC_SERIAL_NO]) return 0;
                return toPositiveInt674(row[FC_PC_SERIAL_NO].value);
              })
              .catch(function (e) {
                console.warn('[NEW-PC-LEDGER-V1] fetchMaxPcSerial674(' + kind + ') field', e);
                return 0;
              });

    function scanPcNames674(offset, accMax) {
      const nameScope =
        (kind === 'personal'
          ? 'account_type in ("' + escapeQueryValue(TYPE_PERSONAL) + '") and '
          : 'account_type in ("' + escapeQueryValue(TYPE_SHARED) + '") and ') + notDisposed;
      const qOr = nameScope + FC_PC_NAME + ' != "" order by $id asc limit 500 offset ' + String(offset);
      return kintoneApiGet('/k/v1/records.json', {
        app: appId,
        query: qOr,
        fields: [FC_PC_NAME],
      }).then(function (resp) {
        const rows = resp.records || [];
        let m = accMax;
        for (let i = 0; i < rows.length; i += 1) {
          const pn = String((rows[i][FC_PC_NAME] && rows[i][FC_PC_NAME].value) || '').trim();
          const dig =
            kind === 'personal' ? extractJbisFourDigitFromPcName674(pn) : extractSjbisFourDigitFromPcName674(pn);
          if (dig != null) m = Math.max(m, dig);
        }
        if (rows.length < 500) return m;
        const nextOff = offset + rows.length;
        if (nextOff > 100000) {
          console.warn('[NEW-PC-LEDGER-V1] fetchMaxPcSerial674(' + kind + ') name scan capped at 100000 rows');
          return m;
        }
        return scanPcNames674(nextOff, m);
      });
    }

    const fromNames = scanPcNames674(0, 0).catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] fetchMaxPcSerial674(' + kind + ') pc_name scan', e);
      return 0;
    });

    return Promise.all([fromField, fromNames]).then(function (pair) {
      return Math.max(toPositiveInt674(pair[0]), toPositiveInt674(pair[1]));
    });
  }

  /**
   * 個人 JBIS: 廃棄以外の `pc_name` から使用中連番を集め、**1 からの最小空き番**を返す（登録済みは変更しない・新規採番のみ）。
   */
  function fetchNextFreePersonalJbisSerial674() {
    const appId = kintone.app.getId();
    const notDisposed = 'pc_status not in ("' + escapeQueryValue(STATUS_AFTER_REPLACE_OLD_674) + '") and ';
    const nameScope =
      'account_type in ("' + escapeQueryValue(TYPE_PERSONAL) + '") and ' + notDisposed;

    function scanUsed(offset, used) {
      const qOr = nameScope + FC_PC_NAME + ' != "" order by $id asc limit 500 offset ' + String(offset);
      return kintoneApiGet('/k/v1/records.json', {
        app: appId,
        query: qOr,
        fields: [FC_PC_NAME],
      }).then(function (resp) {
        const rows = resp.records || [];
        for (let i = 0; i < rows.length; i += 1) {
          const pn = String((rows[i][FC_PC_NAME] && rows[i][FC_PC_NAME].value) || '').trim();
          const dig = extractJbisFourDigitFromPcName674(pn);
          if (dig != null) used.add(dig);
        }
        if (rows.length < 500) return used;
        const nextOff = offset + rows.length;
        if (nextOff > 100000) {
          console.warn('[NEW-PC-LEDGER-V1] fetchNextFreePersonalJbisSerial674 scan capped at 100000 rows');
          return used;
        }
        return scanUsed(nextOff, used);
      });
    }

    return scanUsed(0, new Set())
      .then(function (used) {
        let n = 1;
        while (used.has(n)) n += 1;
        return n;
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] fetchNextFreePersonalJbisSerial674', e);
        return 1;
      });
  }

  /**
   * 共有 S-JBIS: 廃棄以外の `pc_name` から使用中連番を集め、**1 からの最小空き番**を返す（登録済みは変更しない・新規採番のみ）。
   */
  function fetchNextFreeSharedSjbisSerial674() {
    const appId = kintone.app.getId();
    const notDisposed = 'pc_status not in ("' + escapeQueryValue(STATUS_AFTER_REPLACE_OLD_674) + '") and ';
    const nameScope =
      'account_type in ("' + escapeQueryValue(TYPE_SHARED) + '") and ' + notDisposed;

    function scanUsed(offset, used) {
      const qOr = nameScope + FC_PC_NAME + ' != "" order by $id asc limit 500 offset ' + String(offset);
      return kintoneApiGet('/k/v1/records.json', {
        app: appId,
        query: qOr,
        fields: [FC_PC_NAME],
      }).then(function (resp) {
        const rows = resp.records || [];
        for (let i = 0; i < rows.length; i += 1) {
          const pn = String((rows[i][FC_PC_NAME] && rows[i][FC_PC_NAME].value) || '').trim();
          const dig = extractSjbisFourDigitFromPcName674(pn);
          if (dig != null) used.add(dig);
        }
        if (rows.length < 500) return used;
        const nextOff = offset + rows.length;
        if (nextOff > 100000) {
          console.warn('[NEW-PC-LEDGER-V1] fetchNextFreeSharedSjbisSerial674 scan capped at 100000 rows');
          return used;
        }
        return scanUsed(nextOff, used);
      });
    }

    return scanUsed(0, new Set())
      .then(function (used) {
        let n = 1;
        while (used.has(n)) n += 1;
        return n;
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] fetchNextFreeSharedSjbisSerial674', e);
        return 1;
      });
  }

  /**
   * 個人 JBIS の **自動**採番で使う最小連番（数値）。670 `PC_SERIAL_MIN_PERSONAL_JBIS`（1 〜 99999）。
   * 未設定・不正時は **67**（**JBIS0067**）。`mergePcNameSerialFromMax674`（個人・`pc_name` 空）では **台帳 JBIS max+1** とこの下限の **max** だけで決め、**フォームの `pc_serial_no` は参照しない**（上書きする）。
   */
  function parsePersonalJbisSerialFloor674(envMap) {
    const raw = String((envMap && envMap.PC_SERIAL_MIN_PERSONAL_JBIS) || '').trim();
    if (!raw) return 67;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return 67;
    return Math.min(Math.max(Math.floor(n), 1), 99999);
  }

  /** Asia/Tokyo の YYYYMM（§4.3.1 PC 名サフィックス） */
  function formatYYYYMMJst674() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    let y = '';
    let mo = '';
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].type === 'year') y = parts[i].value;
      if (parts[i].type === 'month') mo = parts[i].value.padStart(2, '0');
    }
    return y && mo ? y + mo : '';
  }

  /**
   * `pc_name` が空のとき §4.3.1 で `pc_serial_no` と `pc_name` を埋める。
   * **個人**: **`pc_serial_no` のフォーム値は使わない**（レイアウト既定・複写で 10000 等が入っていても、**台帳の JBIS 連番 max +1** と **670 下限**だけで決める。さもないと `JBIS10000-…` のままになる）。
   * **共有**: 自動生成時は台帳の **S-JBIS 空き若番**（`pc_name` 空のみ）。`pc_serial_no` のフォーム値は参照しない。
   * @param {'personal'|'shared'} kind
   * @param {{ forcePersonalPc?: boolean, forceSharedPc?: boolean }} [opts] **個人の自動生成**は `forcePersonalPc: true`。**共有の自動生成**は `forceSharedPc: true`。
   */
  function mergePcNameSerialFromMax674(rec, envMap, maxSerial, kind, opts) {
    opts = opts || {};
    const pcNameCur = trimmedScalarValue674(rec, FC_PC_NAME);
    const forcePersonalPc = !!(opts.forcePersonalPc && kind === 'personal');
    const forceSharedPc = !!(opts.forceSharedPc && kind === 'shared');
    const forceOverwritePcName = forcePersonalPc && !pcNameCur;
    const forceOverwriteSharedPcName = forceSharedPc && !pcNameCur;
    if (!forceOverwritePcName && !forceOverwriteSharedPcName && pcNameCur) return;
    const yyyymm = formatYYYYMMJst674();
    if (!yyyymm) return;
    const prefix =
      kind === 'shared'
        ? String(envMap.PC_NAME_PREFIX_SHARED || 'S-JBIS').trim() || 'S-JBIS'
        : String(envMap.PC_NAME_PREFIX_PERSONAL || 'JBIS').trim() || 'JBIS';
    const cellSer = rec[FC_PC_SERIAL_NO];
    let serialNum;
    const maxBase = toPositiveInt674(maxSerial);
    if (kind === 'personal') {
      serialNum = maxBase > 0 ? maxBase : parsePersonalJbisSerialFloor674(envMap);
      if (cellSer && typeof cellSer === 'object' && Object.prototype.hasOwnProperty.call(cellSer, 'value')) {
        cellSer.value = String(serialNum);
      }
    } else if (forceSharedPc) {
      serialNum = maxBase > 0 ? maxBase : 1;
      if (cellSer && typeof cellSer === 'object' && Object.prototype.hasOwnProperty.call(cellSer, 'value')) {
        cellSer.value = String(serialNum);
      }
    } else {
      const rawSer =
        cellSer && cellSer.value != null && cellSer.value !== ''
          ? toPositiveInt674(cellSer.value)
          : 0;
      if (rawSer > 0) {
        serialNum = rawSer;
      } else {
        serialNum = maxBase + 1;
        if (cellSer && typeof cellSer === 'object' && Object.prototype.hasOwnProperty.call(cellSer, 'value')) {
          const curStr = cellSer.value == null || cellSer.value === '' ? '' : String(cellSer.value).trim();
          if (!curStr || curStr === '0') {
            cellSer.value = String(serialNum);
          }
        }
      }
    }
    const built = prefix + formatPcNameJbisSerialDigits674(serialNum) + '-' + yyyymm;
    if (forceOverwritePcName || forceOverwriteSharedPcName) {
      setScalarFieldValue674(rec, FC_PC_NAME, built);
    } else {
      mergeScalarField(rec, FC_PC_NAME, built);
    }
  }

  /** §4.2.2 メールPW: `MAIL_PW_PREFIX` + 乱数4桁 + `MAIL_PW_SUFFIX`（既定 `jb`+`K#`） */
  function randomFourDigits674() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const u = new Uint32Array(1);
      crypto.getRandomValues(u);
      return String(u[0] % 10000).padStart(4, '0');
    }
    return String(1000 + Math.floor(Math.random() * 9000));
  }

  function buildPersonalMailPassword674(envMap) {
    const prefix = String(envMap.MAIL_PW_PREFIX || 'jb').trim() || 'jb';
    const suffix = String(envMap.MAIL_PW_SUFFIX || 'K#').trim() || 'K#';
    return prefix + randomFourDigits674() + suffix;
  }

  /**
   * §4.2.2 個人: `mail_pw`・サイボウズ／ガリバー ID・PW（空欄のみ）
   * @param {string} mailLocal 595 mail の @ より前（`mail_acct` と同一想定）
   */
  function mergePersonalMailGbSb674(rec, envMap, nextJbm, mailLocal) {
    mergeScalarField(rec, FC_MAIL_PW, buildPersonalMailPassword674(envMap));
    mergeScalarField(rec, FC_GB_PW, nextJbm);
    mergeScalarField(rec, FC_SB_PW, nextJbm);
    if (mailLocal) {
      mergeScalarField(rec, FC_GB_ID, mailLocal);
      mergeScalarField(rec, FC_SB_ID, mailLocal);
    }
  }

  /**
   * 595 `mail` から @ より前を取り出す（`mail_acct` と同一ルール）。
   * @param {string} mail
   */
  function extractMailLocalFrom595Mail674(mail) {
    const m = String(mail || '').trim();
    const at = m.indexOf('@');
    return at > 0 ? m.slice(0, at).trim() : '';
  }

  /**
   * §4.2.2: 個人用自動生成の **`windows_name`**。**`logon_name`＋`[`＋メール@前＋`]`**（`logon_name` と `[` の間に **`+` は付けない**。例 `jbm0065[y-sasaki]`）。`[` `]` 内は 595 `mail` の @ より前をそのまま。
   * @param {string} logonName §4.3.2 新規発番の `^jbm\d{4}$`
   * @param {string} mailLocalPart `mail_acct` 相当（空なら logon のみ）
   */
  function buildPersonalWindowsNameDisplay674(logonName, mailLocalPart) {
    const j = String(logonName || '').trim();
    const a = String(mailLocalPart || '').trim();
    return a.length > 0 ? j + '[' + a + ']' : j;
  }

  /** §4.3.2 新規発番: 672 から返る個人ログオン名が厳格パターンか */
  function isStrictNewPersonalJbmLogon674(s) {
    return /^jbm\d{4}$/.test(String(s || '').trim());
  }

  /** §4.7.4: 共有/JR の 671 連動経路でフォームへ出す M365 PW（`logon_pw` の `kent0000` とは別） */
  function m365SharedJrFormPassword674(_envMap) {
    return 'kent0000K#';
  }

  /** §5.3: 利用可 かつ usage_count<5 の最古 serial（共有プール。JR も同一プール） */
  function fetchAssignableM365Record671() {
    const q =
      'status in ("利用可") and usage_count < 5 and account_type in ("共有") order by serial_no asc limit 1';
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_M365_MASTER,
      query: q,
      fields: ['$id', 'm365_id', 'm365_pw', 'usage_count', 'status', 'serial_no', 'account_type'],
    }).then(function (resp) {
      return (resp.records && resp.records[0]) || null;
    });
  }

  function fetchAssignableM365Records671List674(limit) {
    const lim = Math.min(Math.max(parseInt(String(limit || '40'), 10) || 40, 1), 100);
    const q =
      'status in ("利用可") and usage_count < 5 and account_type in ("共有") order by serial_no asc limit ' +
      lim;
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_M365_MASTER,
      query: q,
      fields: ['$id', 'm365_id', 'm365_pw', 'usage_count', 'status', 'serial_no', 'account_type'],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function fetchMaxM365SerialNo671() {
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_M365_MASTER,
      query: 'order by serial_no desc limit 1',
      fields: ['serial_no', 'm365_id'],
    }).then(function (resp) {
      return (resp.records && resp.records[0]) || null;
    });
  }

  function formatNextSjmM365Id674(envMap, serialNo) {
    const prefix = String((envMap && envMap.M365_SHARED_ID_PREFIX) || 'sjm-').trim();
    const digits = parseInt(String((envMap && envMap.M365_SHARED_ID_DIGITS) || '3'), 10) || 3;
    let domain = String((envMap && envMap.M365_DOMAIN) || '@kensetsutoso01.onmicrosoft.com').trim();
    if (domain && domain.charAt(0) !== '@') domain = '@' + domain;
    const n = String(serialNo).padStart(digits, '0');
    return prefix + n + domain;
  }

  function postNewM365Master671FromEnv674(envMap) {
    return fetchMaxM365SerialNo671().then(function (maxRow) {
      let nextSerial = 1;
      if (maxRow) {
        const sn = parseInt((maxRow.serial_no && maxRow.serial_no.value) || '0', 10);
        if (sn > 0) nextSerial = sn + 1;
      }
      const m365Id = formatNextSjmM365Id674(envMap, nextSerial);
      const masterPw = (envMap && envMap.M365_PW_SHARED_FIXED) || 'kent2511K#';
      return kintoneApiPost('/k/v1/record.json', {
        app: APP_M365_MASTER,
        record: {
          m365_id: { value: m365Id },
          serial_no: { value: String(nextSerial) },
          m365_pw: { value: masterPw },
          account_type: { value: '共有' },
          status: { value: '利用可' },
          usage_count: { value: '0' },
          linked_pcs: { value: '' },
        },
      }).then(function (postResp) {
        return kintoneApiGet('/k/v1/record.json', {
          app: APP_M365_MASTER,
          id: postResp.id,
          fields: ['$id', 'm365_id', 'm365_pw', 'usage_count', 'status', 'serial_no', 'account_type'],
        }).then(function (getResp) {
          return getResp.record;
        });
      });
    });
  }

  function provisionM365Master671ForNew674(envMap) {
    return fetchAssignableM365Record671().then(function (existing) {
      if (existing) return { record: existing, created671: false };
      return postNewM365Master671FromEnv674(envMap).then(function (created) {
        return { record: created, created671: true };
      });
    });
  }

  function applyM365LinkedToForm674(api, recNow, rec, m365Id, m365Pw, masterId) {
    withWritableInternalMeta674(rec, function () {
      const masterCell = rec[FC_M365_MASTER_RECORD_ID];
      if (masterCell && Object.prototype.hasOwnProperty.call(masterCell, 'disabled')) {
        masterCell.disabled = false;
      }
      setScalarFieldValue674(rec, FC_M365_ID, m365Id);
      setScalarFieldValue674(rec, FC_M365_PW, m365Pw);
      setNumberFieldValue674(rec, FC_M365_MASTER_RECORD_ID, masterId);
      api.set(recNow);
    });
    applyM365MasterRecordIdFieldUi674(rec, 'editable');
  }

  function applyM365ManualPathToForm674(api, recNow, rec) {
    withWritableInternalMeta674(rec, function () {
      const masterCell = rec[FC_M365_MASTER_RECORD_ID];
      if (masterCell && Object.prototype.hasOwnProperty.call(masterCell, 'disabled')) {
        masterCell.disabled = false;
      }
      setNumberFieldValue674(rec, FC_M365_MASTER_RECORD_ID, null);
      api.set(recNow);
    });
    applyM365MasterRecordIdFieldUi674(rec, 'editable');
  }

  function trimmedScalarValue674(rec, code) {
    const cell = rec[code];
    if (!cell || typeof cell !== 'object') return '';
    return String(cell.value || '').trim();
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

  /** NUMBER: 満杯切替などで既存値を上書きする */
  function setNumberFieldValue674(rec, code, numVal) {
    const cell = rec[code];
    if (!cell || typeof cell !== 'object' || !Object.prototype.hasOwnProperty.call(cell, 'value')) return;
    if (numVal == null || numVal === '') {
      cell.value = null;
      return;
    }
    cell.value = String(numVal);
  }

  const USER_SUGGEST_BOX_ID = 'new-pc-ledger-user-suggest';
  const EMPLOYEE_SEARCH_MODAL_ID = 'new-pc-ledger-employee-search-modal';
  const DEPT_MASTER_MODAL_ID = 'new-pc-ledger-dept-master-modal';
  const INPUT_ASSIST_CONFIRM_MODAL_ID = 'new-pc-ledger-input-assist-confirm';

  /** §4.2.0b: カスタム確認モーダル本文（はい／いいえボタン） */
  const NPL674_INPUT_ASSIST_MSG_PERSONAL =
    '入力支援を利用しますか？\n\n' +
    '個人PCのため、利用者名・所属名・所属グループを社員マスタ（595）で検索し、フォームへ反映できます。';
  const NPL674_INPUT_ASSIST_MSG_SHARED_JR =
    '入力支援を利用しますか？\n\n' +
    '共有PC／JR端末のため、所属名・所属グループを所属候補（680）で検索し、フォームへ反映できます。';

  let inputAssistConfirmResolve674 = null;
  let inputAssistConfirmEsc674 = false;

  function closeInputAssistConfirmModal674(result) {
    const el = document.getElementById(INPUT_ASSIST_CONFIRM_MODAL_ID);
    if (el) el.style.display = 'none';
    const fn = inputAssistConfirmResolve674;
    inputAssistConfirmResolve674 = null;
    if (typeof fn === 'function') fn(!!result);
  }

  function ensureInputAssistConfirmModal674() {
    let backdrop = document.getElementById(INPUT_ASSIST_CONFIRM_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = INPUT_ASSIST_CONFIRM_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2000000;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeInputAssistConfirmModal674(false);
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:440px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2);' +
      'padding:18px 20px 16px;box-sizing:border-box;';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;margin-bottom:10px;';
    title.textContent = '入力支援の確認';
    panel.appendChild(title);

    const msg = document.createElement('div');
    msg.setAttribute('data-npl674-iac-msg', '1');
    msg.style.cssText = 'font-size:14px;color:#212529;line-height:1.65;white-space:pre-wrap;margin-bottom:18px;';
    panel.appendChild(msg);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;';

    const btnNo = document.createElement('button');
    btnNo.type = 'button';
    btnNo.textContent = 'いいえ';
    btnNo.style.cssText =
      'padding:8px 18px;font-size:14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;color:#212529;';
    btnNo.addEventListener('click', function () {
      closeInputAssistConfirmModal674(false);
    });

    const btnYes = document.createElement('button');
    btnYes.type = 'button';
    btnYes.textContent = 'はい';
    btnYes.style.cssText =
      'padding:8px 18px;font-size:14px;border:none;background:#0d6efd;color:#fff;border-radius:4px;cursor:pointer;font-weight:600;';
    btnYes.addEventListener('click', function () {
      closeInputAssistConfirmModal674(true);
    });

    row.appendChild(btnNo);
    row.appendChild(btnYes);
    panel.appendChild(row);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    if (!inputAssistConfirmEsc674) {
      inputAssistConfirmEsc674 = true;
      document.addEventListener(
        'keydown',
        function nplInputAssistConfirmEsc674(ev) {
          const m = document.getElementById(INPUT_ASSIST_CONFIRM_MODAL_ID);
          if (!m || m.style.display === 'none') return;
          if (ev.key === 'Escape') closeInputAssistConfirmModal674(false);
        },
        true,
      );
    }
    return backdrop;
  }

  /**
   * @param {string} messageText
   * @returns {Promise<boolean>}
   */
  function promise674InputAssistConfirm674(messageText) {
    return new Promise(function (resolve) {
      if (inputAssistConfirmResolve674) {
        resolve(false);
        return;
      }
      const backdrop = ensureInputAssistConfirmModal674();
      const msgEl = backdrop.querySelector('[data-npl674-iac-msg]');
      if (msgEl) msgEl.textContent = messageText || '';
      inputAssistConfirmResolve674 = resolve;
      backdrop.style.display = 'flex';
    });
  }

  /**
   * マスタ未整備時の所属候補（所属名|group_code をカンマ連結。所属マスタアプリ取得後は主に API）。
   * group_code は 674 の所属グループ入力値（例: honsya）と一致させる。
   */
  const DEPT_MASTER_FALLBACK_INLINE =
    '役員室|honsya,顧問室|honsya,総務部|honsya,経理部|honsya,経営企画部|honsya,人事研修部|honsya,安全推進部|honsya,施工推進部|honsya,メンテナンス技術部|honsya,塗装技術部|honsya,品質管理部|honsya,' +
    '東北支店|tohoku,秋田営業所|tohoku,盛岡営業所|tohoku,仙台営業所|tohoku,' +
    '関越支店|kan-etsu,新潟営業所|kan-etsu,長野営業所|kan-etsu,高崎営業所|kan-etsu,' +
    '東京支店|tokyo,千葉営業所|tokyo,水戸営業所|tokyo,' +
    '東海支店|tokai,東京営業所|tokai,静岡営業所|tokai,名古屋営業所|tokai,関西営業所|tokai,' +
    '札幌支店|tokyo,首都圏支店|tokyo,鉄構支店|tekko,湾岸工事所|wangan';

  let deptMasterRowsCache674 = null;

  function parseDeptMasterFallbackRows674() {
    const out = [];
    const parts = String(DEPT_MASTER_FALLBACK_INLINE || '').split(',');
    for (let i = 0; i < parts.length; i++) {
      const seg = String(parts[i] || '').trim();
      if (!seg) continue;
      const bar = seg.indexOf('|');
      const dept = (bar === -1 ? seg : seg.slice(0, bar)).trim();
      const grp = (bar === -1 ? '' : seg.slice(bar + 1)).trim();
      if (dept) out.push({ dept_name: dept, group_name: grp });
    }
    return out;
  }

  /**
   * @returns {Promise<{ dept_name: string, group_name: string }[]>}
   */
  function fetchDeptMasterRows674() {
    if (deptMasterRowsCache674 && deptMasterRowsCache674.length) {
      return Promise.resolve(deptMasterRowsCache674);
    }
    const app = String(APP_DEPT_MASTER_674 || '').trim();
    if (!app || app === '0') {
      deptMasterRowsCache674 = parseDeptMasterFallbackRows674();
      return Promise.resolve(deptMasterRowsCache674);
    }
    return kintoneApiGet('/k/v1/records.json', {
      app: app,
      query: 'order by $id asc limit 500',
      fields: ['dept_name', 'group_name'],
    })
      .then(function (resp) {
        const rows = [];
        for (let i = 0; i < (resp.records || []).length; i++) {
          const r = resp.records[i];
          const d = (r.dept_name && r.dept_name.value) || '';
          const g = (r.group_name && r.group_name.value) || '';
          if (String(d).trim()) rows.push({ dept_name: String(d).trim(), group_name: String(g).trim() });
        }
        deptMasterRowsCache674 = rows.length ? rows : parseDeptMasterFallbackRows674();
        return deptMasterRowsCache674;
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] 所属マスタ取得失敗、埋め込みへ', e);
        deptMasterRowsCache674 = parseDeptMasterFallbackRows674();
        return deptMasterRowsCache674;
      });
  }

  function applyDeptMasterPick674(dept, grp) {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) return;
    const rec = bag.holder.record;
    setScalarFieldValue674(rec, FC_DEPT_NAME, dept);
    setScalarFieldValue674(rec, FC_GROUP_NAME, grp);
    bag.api.set(bag.holder);
  }

  function closeDeptMasterModal674() {
    const m = document.getElementById(DEPT_MASTER_MODAL_ID);
    if (m) m.style.display = 'none';
  }

  function renderDeptMasterResults674(container, rows, kw) {
    container.textContent = '';
    const k = String(kw || '')
      .trim()
      .toLowerCase();
    const filtered = !k
      ? rows.slice()
      : rows.filter(function (r) {
          const a = (r.dept_name + ' ' + r.group_name).toLowerCase();
          return a.indexOf(k) !== -1;
        });
    if (!filtered.length) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:8px 0;color:#6c757d;font-size:13px;line-height:1.5;';
      p.textContent = '該当する行がありません。キーワードを変えるか、一覧をそのままスクロールしてください。';
      container.appendChild(p);
      return;
    }
    for (let i = 0; i < filtered.length; i++) {
      const r = filtered[i];
      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText =
        'display:block;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border:1px solid #dee2e6;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;line-height:1.4;';
      item.textContent = r.dept_name + (r.group_name ? '　／　' + r.group_name : '');
      (function (dept, grp) {
        item.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          applyDeptMasterPick674(dept, grp);
          closeDeptMasterModal674();
        });
      })(r.dept_name, r.group_name);
      container.appendChild(item);
    }
  }

  function runDeptMasterModalFilter674() {
    const modal = document.getElementById(DEPT_MASTER_MODAL_ID);
    if (!modal) return;
    const input = modal.querySelector('[data-npl-dept-q]');
    const container = modal.querySelector('[data-npl-dept-results]');
    if (!input || !container) return;
    const kw = String(input.value || '').trim();
    fetchDeptMasterRows674().then(function (rows) {
      renderDeptMasterResults674(container, rows, kw);
    });
  }

  function ensureDeptMasterModal674() {
    let backdrop = document.getElementById(DEPT_MASTER_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = DEPT_MASTER_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:100001;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeDeptMasterModal674();
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:560px;width:100%;max-height:88vh;overflow:hidden;display:flex;' +
      'flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const head = document.createElement('div');
    head.style.cssText = 'padding:14px 16px;border-bottom:1px solid #dee2e6;';
    const h = document.createElement('div');
    h.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;';
    h.textContent = '所属候補（共有・JR）';
    head.appendChild(h);
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;color:#495057;margin-top:6px;line-height:1.5;';
    sub.textContent =
      '行を押すと「所属名」「所属グループ」に反映されます（空欄でも上書きします）。マスタ取得に失敗したときは組み込み候補を表示します。';
    head.appendChild(sub);

    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.setAttribute('data-npl-dept-q', '1');
    inp.placeholder = '所属名・グループの一部で絞り込み';
    inp.style.cssText =
      'flex:1;min-width:160px;padding:8px 10px;font-size:14px;border:1px solid #ced4da;border-radius:4px;box-sizing:border-box;';
    const filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.textContent = '絞り込み';
    filterBtn.style.cssText =
      'padding:8px 16px;font-weight:bold;background:#198754;color:#fff;border:none;border-radius:4px;cursor:pointer;';
    filterBtn.addEventListener('click', function () {
      runDeptMasterModalFilter674();
    });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        runDeptMasterModalFilter674();
      }
    });
    row.appendChild(inp);
    row.appendChild(filterBtn);
    body.appendChild(row);

    const results = document.createElement('div');
    results.setAttribute('data-npl-dept-results', '1');
    results.style.cssText =
      'overflow-y:auto;flex:1;min-height:120px;max-height:46vh;border:1px solid #e9ecef;border-radius:4px;padding:8px;background:#f8f9fa;';
    body.appendChild(results);

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:12px 16px;border-top:1px solid #dee2e6;display:flex;justify-content:flex-end;gap:8px;';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '閉じる';
    closeBtn.style.cssText =
      'padding:6px 14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;';
    closeBtn.addEventListener('click', function () {
      closeDeptMasterModal674();
    });
    foot.appendChild(closeBtn);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    document.addEventListener(
      'keydown',
      function nplDeptModalEsc674(ev) {
        const m = document.getElementById(DEPT_MASTER_MODAL_ID);
        if (!m || m.style.display === 'none') return;
        if (ev.key === 'Escape') closeDeptMasterModal674();
      },
      true,
    );
    return backdrop;
  }

  function openDeptMasterModal674() {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) {
      window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
      return;
    }
    const type = readAccountTypeLive674(bag.holder.record);
    if (type !== TYPE_SHARED && type !== TYPE_JR) {
      window.alert('所属候補は種別が「共有」または「JR端末」のときのみ使えます。');
      return;
    }
    const backdrop = ensureDeptMasterModal674();
    const input = backdrop.querySelector('[data-npl-dept-q]');
    const container = backdrop.querySelector('[data-npl-dept-results]');
    if (input) input.value = '';
    backdrop.style.display = 'flex';
    fetchDeptMasterRows674()
      .then(function (rows) {
        if (container) renderDeptMasterResults674(container, rows, '');
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] dept modal load', e);
        if (container) renderDeptMasterResults674(container, parseDeptMasterFallbackRows674(), '');
      });
  }

  const M365_ASSIST_CHOICE_MODAL_ID = 'new-pc-ledger-m365-assist-choice';
  const M365_ASSIST_PICKER_MODAL_ID = 'new-pc-ledger-m365-assist-picker';
  const M365_ASSIST_NEW_ISSUED_MODAL_ID = 'new-pc-ledger-m365-assist-new-issued';

  let m365AssistLastEnvMap674 = null;
  let m365AssistOfferNewIssue674 = false;
  let m365AssistChoiceEsc674 = false;
  let m365AssistPickerEsc674 = false;
  let m365AssistNewIssuedEsc674 = false;

  function closeM365AssistNewIssuedDialog674() {
    const m = document.getElementById(M365_ASSIST_NEW_ISSUED_MODAL_ID);
    if (m) m.style.display = 'none';
  }

  function ensureM365AssistNewIssuedModal674() {
    let backdrop = document.getElementById(M365_ASSIST_NEW_ISSUED_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = M365_ASSIST_NEW_ISSUED_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2000000;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeM365AssistNewIssuedDialog674();
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:460px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2);' +
      'padding:18px 20px 16px;box-sizing:border-box;';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;margin-bottom:10px;';
    title.textContent = 'M365 を新規採番しました';
    panel.appendChild(title);

    const msg = document.createElement('div');
    msg.setAttribute('data-npl-m365-new-body', '1');
    msg.style.cssText = 'font-size:14px;color:#212529;line-height:1.65;white-space:pre-wrap;margin-bottom:18px;';
    panel.appendChild(msg);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.textContent = 'OK';
    btnOk.style.cssText =
      'padding:8px 18px;font-size:14px;border:none;background:#6d28d9;color:#fff;border-radius:4px;cursor:pointer;font-weight:600;';
    btnOk.addEventListener('click', function () {
      closeM365AssistNewIssuedDialog674();
    });
    row.appendChild(btnOk);
    panel.appendChild(row);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    if (!m365AssistNewIssuedEsc674) {
      m365AssistNewIssuedEsc674 = true;
      document.addEventListener(
        'keydown',
        function nplM365NewIssuedEsc674(ev) {
          const m = document.getElementById(M365_ASSIST_NEW_ISSUED_MODAL_ID);
          if (!m || m.style.display === 'none') return;
          if (ev.key === 'Escape') closeM365AssistNewIssuedDialog674();
        },
        true,
      );
    }
    return backdrop;
  }

  /**
   * §4.6.6 新規採番パス: 671 投入後の確認のみ（フォーム反映は呼び出し側）。
   * @param {string} m365Id
   */
  function showM365NewIssuedDialog674(m365Id, created671) {
    const backdrop = ensureM365AssistNewIssuedModal674();
    const msgEl = backdrop.querySelector('[data-npl-m365-new-body]');
    const idStr = String(m365Id || '').trim();
    const lead = created671
      ? 'M365 管理マスタ（671）へ新しい行を追加し、フォームへ反映しました。'
      : 'M365 管理マスタ（671）の空き行を払い出し、フォームへ反映しました。';
    if (msgEl) {
      msgEl.textContent =
        lead +
        (idStr ? '\n\nM365 ID: ' + idStr : '') +
        '\n\n内容を確認のうえ、必ず本レコード（674）を保存してください。' +
        'Microsoft 365 管理画面では、担当者手順でアカウントを作成してください。';
    }
    backdrop.style.display = 'flex';
  }

  function closeM365AssistChoiceModal674() {
    const el = document.getElementById(M365_ASSIST_CHOICE_MODAL_ID);
    if (el) el.style.display = 'none';
  }

  function closeM365AssistPickerModal674() {
    const el = document.getElementById(M365_ASSIST_PICKER_MODAL_ID);
    if (el) el.style.display = 'none';
  }

  function renderM365AssistPickerRows674(container, rows, envMap) {
    container.textContent = '';
    const formPw = m365SharedJrFormPassword674(envMap);
    if (!rows || !rows.length) {
      const p = document.createElement('div');
      p.style.cssText = 'margin:8px 0;color:#6c757d;font-size:13px;line-height:1.5;';
      p.textContent =
        '利用可能な割当（共有・usage_count<5・利用可）がありません。Microsoft 365 管理画面と M365 管理マスタを確認するか、「新規採番」をお試しください。';
      container.appendChild(p);
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const idVal = (r.m365_id && r.m365_id.value) || '';
      const sn = (r.serial_no && r.serial_no.value) || '';
      const us = (r.usage_count && r.usage_count.value) || '';
      const rowId = r.$id && r.$id.value;
      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText =
        'display:block;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border:1px solid #dee2e6;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;line-height:1.4;';
      item.textContent =
        'serial ' +
        String(sn) +
        '　／　' +
        String(idVal) +
        (us !== '' ? '　（利用 ' + String(us) + '）' : '');
      item.addEventListener('mousedown', function (ev) {
        ev.preventDefault();
        const bag = getRecordFormHolder674();
        if (!bag || !bag.api || typeof bag.api.get !== 'function') {
          window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
          return;
        }
        const holder = bag.api.get();
        const rec = holder.record;
        applyM365LinkedToForm674(bag.api, holder, rec, String(idVal).trim(), formPw, rowId);
        closeM365AssistPickerModal674();
      });
      container.appendChild(item);
    }
  }

  function reloadM365AssistPickerList674() {
    const modal = document.getElementById(M365_ASSIST_PICKER_MODAL_ID);
    if (!modal) return;
    const container = modal.querySelector('[data-npl-m365-pick-results]');
    if (!container) return;
    const envMap = m365AssistLastEnvMap674 || {};
    container.textContent = '';
    const loading = document.createElement('div');
    loading.style.cssText = 'margin:8px;color:#495057;font-size:13px;';
    loading.textContent = '読み込み中…';
    container.appendChild(loading);
    fetchAssignableM365Records671List674(40)
      .then(function (rows) {
        container.textContent = '';
        renderM365AssistPickerRows674(container, rows, envMap);
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] M365 picker load', e);
        container.textContent = '';
        const p = document.createElement('div');
        p.style.cssText = 'margin:8px 0;color:#842029;font-size:13px;';
        p.textContent = '一覧の取得に失敗しました。通信を確認して再度お試しください。';
        container.appendChild(p);
      });
  }

  function openM365AssistPickerModal674() {
    const backdrop = ensureM365AssistPickerModal674();
    backdrop.style.display = 'flex';
    reloadM365AssistPickerList674();
  }

  function ensureM365AssistPickerModal674() {
    let backdrop = document.getElementById(M365_ASSIST_PICKER_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = M365_ASSIST_PICKER_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2000000;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeM365AssistPickerModal674();
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:600px;width:100%;max-height:88vh;overflow:hidden;display:flex;' +
      'flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const head = document.createElement('div');
    head.style.cssText = 'padding:14px 16px;border-bottom:1px solid #dee2e6;';
    const h = document.createElement('div');
    h.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;';
    h.textContent = '利用可能な M365 割当を選択';
    head.appendChild(h);
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;color:#495057;margin-top:6px;line-height:1.5;';
    sub.textContent =
      'M365 管理マスタ（671）の共有アカウントのうち、空きがある行のみ表示します。行を押すと M365 ID・パスワード（フォーム表示用）・マスタレコード番号を反映します。';
    head.appendChild(sub);

    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;';

    const results = document.createElement('div');
    results.setAttribute('data-npl-m365-pick-results', '1');
    results.style.cssText =
      'overflow-y:auto;flex:1;min-height:120px;max-height:46vh;border:1px solid #e9ecef;border-radius:4px;padding:8px;background:#f8f9fa;';
    body.appendChild(results);

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:12px 16px;border-top:1px solid #dee2e6;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;';
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.textContent = '再読み込み';
    refreshBtn.style.cssText =
      'padding:6px 14px;font-weight:600;background:#6d28d9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;';
    refreshBtn.addEventListener('click', function () {
      reloadM365AssistPickerList674();
    });
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '閉じる';
    closeBtn.style.cssText =
      'padding:6px 14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;';
    closeBtn.addEventListener('click', function () {
      closeM365AssistPickerModal674();
    });
    foot.appendChild(refreshBtn);
    foot.appendChild(closeBtn);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    if (!m365AssistPickerEsc674) {
      m365AssistPickerEsc674 = true;
      document.addEventListener(
        'keydown',
        function nplM365PickerEsc674(ev) {
          const m = document.getElementById(M365_ASSIST_PICKER_MODAL_ID);
          if (!m || m.style.display === 'none') return;
          if (ev.key === 'Escape') closeM365AssistPickerModal674();
        },
        true,
      );
    }
    return backdrop;
  }

  function refreshM365AssistChoiceModal674(hasAssignableSlot671) {
    m365AssistOfferNewIssue674 = !hasAssignableSlot671;
    const backdrop = document.getElementById(M365_ASSIST_CHOICE_MODAL_ID);
    if (!backdrop) return;
    const btnNew = backdrop.querySelector('[data-npl-m365-choice-new="1"]');
    const msgEl = backdrop.querySelector('[data-npl-m365-choice-msg="1"]');
    if (btnNew) {
      btnNew.style.display = m365AssistOfferNewIssue674 ? '' : 'none';
    }
    if (msgEl) {
      msgEl.textContent = m365AssistOfferNewIssue674
        ? '手入力・既存の共有割当の利用、または 671 に空き割当がないときの新規採番から選べます。'
        : '手入力・既存の共有割当の利用から選べます（空き割当があるため新規採番は選べません）。';
    }
  }

  function ensureM365AssistChoiceModal674() {
    let backdrop = document.getElementById(M365_ASSIST_CHOICE_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = M365_ASSIST_CHOICE_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:2000000;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeM365AssistChoiceModal674();
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:480px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.2);' +
      'padding:18px 20px 16px;box-sizing:border-box;';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;margin-bottom:10px;';
    title.textContent = 'M365 の設定方法';
    panel.appendChild(title);

    const msg = document.createElement('div');
    msg.setAttribute('data-npl-m365-choice-msg', '1');
    msg.style.cssText = 'font-size:14px;color:#212529;line-height:1.65;margin-bottom:16px;';
    msg.textContent = '手入力・既存の共有割当の利用から選べます。';
    panel.appendChild(msg);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-bottom:14px;';

    const mkChoiceBtn = function (label, bg, border) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText =
        'width:100%;padding:10px 14px;font-size:14px;font-weight:600;border-radius:6px;cursor:pointer;border:1px solid ' +
        border +
        ';background:' +
        bg +
        ';color:#fff;';
      return b;
    };

    const btnManual = mkChoiceBtn('手入力（マスタと連動しない）', '#495057', '#343a40');
    btnManual.addEventListener('click', function () {
      const bag = getRecordFormHolder674();
      if (!bag || !bag.api || typeof bag.api.get !== 'function') {
        window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
        closeM365AssistChoiceModal674();
        return;
      }
      const holder = bag.api.get();
      applyM365ManualPathToForm674(bag.api, holder, holder.record);
      closeM365AssistChoiceModal674();
    });

    const btnExisting = mkChoiceBtn('既存の共有割当を利用（671 から選択）', '#7c3aed', '#6d28d9');
    btnExisting.addEventListener('click', function () {
      closeM365AssistChoiceModal674();
      openM365AssistPickerModal674();
    });

    const btnNew = mkChoiceBtn('新規採番（671 に行を追加）', '#0d6efd', '#0a58ca');
    btnNew.setAttribute('data-npl-m365-choice-new', '1');
    btnNew.style.display = 'none';
    btnNew.addEventListener('click', function () {
      const envMap = m365AssistLastEnvMap674;
      closeM365AssistChoiceModal674();
      if (!envMap) {
        window.alert('環境マップが未取得です。しばらくしてから再度お試しください。');
        return;
      }
      if (!m365AssistOfferNewIssue674) {
        window.alert(
          '利用可能な M365 割当がまだあります。「既存の共有割当を利用」から選ぶか、M365 ID を手入力してください。',
        );
        return;
      }
      const bag = getRecordFormHolder674();
      if (!bag || !bag.api || typeof bag.api.get !== 'function') {
        window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
        return;
      }
      postNewM365Master671FromEnv674(envMap)
        .then(function (row) {
          const holder = bag.api.get();
          const rec = holder.record;
          const mid = (row.m365_id && row.m365_id.value) || '';
          const rid = row.$id && row.$id.value;
          applyM365LinkedToForm674(
            bag.api,
            holder,
            rec,
            String(mid).trim(),
            m365SharedJrFormPassword674(envMap),
            rid,
          );
          showM365NewIssuedDialog674(mid, true);
        })
        .catch(function (e) {
          console.error('[NEW-PC-LEDGER-V1] M365 新規採番', e);
          window.alert('M365 管理マスタへの追加に失敗しました。権限・通信・マスタ設定を確認してください。');
        });
    });

    btnRow.appendChild(btnManual);
    btnRow.appendChild(btnExisting);
    btnRow.appendChild(btnNew);
    panel.appendChild(btnRow);

    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;';
    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.textContent = 'キャンセル';
    btnCancel.style.cssText =
      'padding:8px 18px;font-size:14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;color:#212529;';
    btnCancel.addEventListener('click', function () {
      closeM365AssistChoiceModal674();
    });
    foot.appendChild(btnCancel);
    panel.appendChild(foot);

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    if (!m365AssistChoiceEsc674) {
      m365AssistChoiceEsc674 = true;
      document.addEventListener(
        'keydown',
        function nplM365ChoiceEsc674(ev) {
          const m = document.getElementById(M365_ASSIST_CHOICE_MODAL_ID);
          if (!m || m.style.display === 'none') return;
          if (ev.key === 'Escape') closeM365AssistChoiceModal674();
        },
        true,
      );
    }
    return backdrop;
  }

  /**
   * §4.6.6 M365 入力（ツールバー・m365_id フィールドクリック）。
   * @param {'header'|'field-click'} source
   */
  function runM365AssistEntry674(source) {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) {
      window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
      return;
    }
    const rec = bag.holder.record;
    const type = readAccountTypeLive674(rec);
    if (type !== TYPE_SHARED && type !== TYPE_JR) {
      window.alert('M365 入力は種別が「共有」または「JR端末」のときのみ使えます。');
      return;
    }
    if (isPcStatusStorage674(rec)) {
      window.alert('保管中のレコードでは M365 入力は利用できません。');
      return;
    }
    if (is674AssistModalVisible674()) {
      return;
    }
    npl674FocusAssistSuppressUntil674 = Date.now() + 400;
    Promise.all([loadEnv670Map(), fetchAssignableM365Record671()])
      .then(function (results) {
        m365AssistLastEnvMap674 = results[0];
        const backdrop = ensureM365AssistChoiceModal674();
        refreshM365AssistChoiceModal674(!!results[1]);
        backdrop.style.display = 'flex';
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] M365 assist env/671', e);
        window.alert('環境設定（670）または M365 管理マスタ（671）の取得に失敗しました。通信を確認して再度お試しください。');
      });
  }

  let userSuggestTimer674 = null;
  let userSuggestReq674 = 0;
  let userSuggestDocClick674 = false;
  let userNameInputDelegate674 = false;

  /** @returns {{ api: object, holder: object }|null} */
  function getRecordFormHolder674() {
    const tryOne = function (api) {
      if (!api || typeof api.get !== 'function') return null;
      try {
        const h = api.get();
        if (h && h.record) return { api: api, holder: h };
      } catch (err) {
        return null;
      }
      return null;
    };
    const d = tryOne(kintone.app && kintone.app.record);
    if (d) return d;
    return tryOne(
      typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record
        ? kintone.mobile.app.record
        : null,
    );
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
      if (kintone.app && kintone.app.record && typeof kintone.app.record.getFieldElement === 'function') {
        const d = kintone.app.record.getFieldElement(FC_USER_NAME);
        if (d) return d;
      }
    } catch (e2) {
      /* ignore */
    }
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        const m = kintone.mobile.app.record.getFieldElement(FC_USER_NAME);
        if (m) return m;
      }
    } catch (e1) {
      /* ignore */
    }
    return null;
  }

  /**
   * テキスト入力中は record.get() が遅れることがある（change は多くの場合 blur 後）。
   * 候補検索は DOM の実入力を優先する。
   */
  function readUserNameLiveValue674(rec) {
    const fromRec = String((rec && rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '').trim();
    const fieldEl = getUserNameFieldEl674();
    if (!fieldEl) return fromRec;
    const ae = document.activeElement;
    if (
      ae &&
      fieldEl.contains(ae) &&
      (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') &&
      ae.type !== 'checkbox' &&
      ae.type !== 'radio' &&
      ae.type !== 'button'
    ) {
      return String(ae.value != null ? ae.value : '').trim();
    }
    const inputs = fieldEl.querySelectorAll('textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])');
    for (let i = 0; i < inputs.length; i++) {
      const v = String(inputs[i].value != null ? inputs[i].value : '').trim();
      if (v) return v;
    }
    let inp;
    try {
      inp = fieldEl.querySelector(
        'textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])',
      );
    } catch (_e0) {
      inp = null;
    }
    if (!inp) {
      try {
        const all = fieldEl.querySelectorAll('*');
        const lim = Math.min(all.length, 120);
        for (let j = 0; j < lim; j++) {
          const node = all[j];
          if (!node.shadowRoot) continue;
          try {
            inp = node.shadowRoot.querySelector(
              'textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])',
            );
          } catch (_e1) {
            inp = null;
          }
          if (inp) break;
        }
      } catch (_e2) {
        /* ignore */
      }
    }
    if (inp && (inp.tagName === 'INPUT' || inp.tagName === 'TEXTAREA')) {
      const v2 = String(inp.value != null ? inp.value : '').trim();
      if (v2) return v2;
    }
    return fromRec;
  }

  function closeEmployee595SearchModal674() {
    const m = document.getElementById(EMPLOYEE_SEARCH_MODAL_ID);
    if (m) m.style.display = 'none';
  }

  function renderEmployee595SearchResults674(container, rows) {
    container.textContent = '';
    if (!rows || !rows.length) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:8px 0;color:#6c757d;font-size:13px;line-height:1.5;';
      p.textContent =
        '該当する在籍社員が見つかりません。別の表記・苗字だけ・名前の一部でも検索できます。595の user_name と一致する行を選んでください。';
      container.appendChild(p);
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
        'display:block;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border:1px solid #dee2e6;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;line-height:1.4;';
      item.textContent = un + (dept ? '　／　' + dept : '') + (grp ? '　（' + grp + '）' : '');
      (function (empRow) {
        item.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          applyEmployeePickFrom595674(empRow);
          hideUserSuggest674();
          closeEmployee595SearchModal674();
        });
      })(row);
      container.appendChild(item);
    }
  }

  function runEmployee595SearchModalQuery674() {
    const modal = document.getElementById(EMPLOYEE_SEARCH_MODAL_ID);
    if (!modal) return;
    const input = modal.querySelector('[data-npl-e595-q]');
    const container = modal.querySelector('[data-npl-e595-results]');
    if (!input || !container) return;
    const kw = String(input.value || '').trim();
    container.textContent = '';
    if (!kw) {
      const p = document.createElement('p');
      p.style.cssText = 'margin:8px 0;color:#6c757d;font-size:13px;';
      p.textContent = '検索語を入力して「検索」を押すか、Enter キーを押してください。';
      container.appendChild(p);
      return;
    }
    const loading = document.createElement('p');
    loading.style.cssText = 'margin:8px;color:#495057;font-size:13px;';
    loading.textContent = '検索しています…';
    container.appendChild(loading);
    searchEmployees595Contains(kw, 25)
      .then(function (rows) {
        container.textContent = '';
        renderEmployee595SearchResults674(container, rows);
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] 595 モーダル検索', e);
        container.textContent = '';
        const p = document.createElement('p');
        p.style.cssText = 'margin:8px 0;color:#842029;font-size:13px;';
        p.textContent = '検索に失敗しました。通信を確認して再度お試しください。';
        container.appendChild(p);
      });
  }

  function ensureEmployee595SearchModal674() {
    let backdrop = document.getElementById(EMPLOYEE_SEARCH_MODAL_ID);
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = EMPLOYEE_SEARCH_MODAL_ID;
    backdrop.style.cssText =
      'display:none;position:fixed;inset:0;z-index:100001;align-items:center;justify-content:center;' +
      'padding:16px;box-sizing:border-box;background:rgba(33,37,41,.48);';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeEmployee595SearchModal674();
    });

    const panel = document.createElement('div');
    panel.style.cssText =
      'background:#fff;border-radius:8px;max-width:560px;width:100%;max-height:88vh;overflow:hidden;display:flex;' +
      'flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.2);';
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const head = document.createElement('div');
    head.style.cssText = 'padding:14px 16px;border-bottom:1px solid #dee2e6;';
    const h = document.createElement('div');
    h.style.cssText = 'font-weight:bold;font-size:16px;color:#052c65;';
    h.textContent = '社員名を検索（社員マスタ 595）';
    head.appendChild(h);
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;color:#495057;margin-top:6px;line-height:1.5;';
    sub.textContent =
      '氏名の一部でも検索できます。行を押すと「利用者名・所属名・所属グループ」に反映されます（保存は従来どおり手動）。';
    head.appendChild(sub);

    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.setAttribute('data-npl-e595-q', '1');
    inp.placeholder = '例: 山田　または　政一';
    inp.style.cssText =
      'flex:1;min-width:160px;padding:8px 10px;font-size:14px;border:1px solid #ced4da;border-radius:4px;box-sizing:border-box;';
    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.textContent = '検索';
    searchBtn.style.cssText =
      'padding:8px 16px;font-weight:bold;background:#0d6efd;color:#fff;border:none;border-radius:4px;cursor:pointer;';
    searchBtn.addEventListener('click', function () {
      runEmployee595SearchModalQuery674();
    });
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        runEmployee595SearchModalQuery674();
      }
    });
    row.appendChild(inp);
    row.appendChild(searchBtn);
    body.appendChild(row);

    const results = document.createElement('div');
    results.setAttribute('data-npl-e595-results', '1');
    results.style.cssText =
      'overflow-y:auto;flex:1;min-height:120px;max-height:46vh;border:1px solid #e9ecef;border-radius:4px;padding:8px;background:#f8f9fa;';
    body.appendChild(results);

    const foot = document.createElement('div');
    foot.style.cssText = 'padding:12px 16px;border-top:1px solid #dee2e6;display:flex;justify-content:flex-end;gap:8px;';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '閉じる';
    closeBtn.style.cssText =
      'padding:6px 14px;border:1px solid #6c757d;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;';
    closeBtn.addEventListener('click', function () {
      closeEmployee595SearchModal674();
    });
    foot.appendChild(closeBtn);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    document.addEventListener(
      'keydown',
      function nplE595ModalEsc674(ev) {
        const m = document.getElementById(EMPLOYEE_SEARCH_MODAL_ID);
        if (!m || m.style.display === 'none') return;
        if (ev.key === 'Escape') closeEmployee595SearchModal674();
      },
      true,
    );
    return backdrop;
  }

  function openEmployee595SearchModal674() {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) {
      window.alert('フォームの準備ができていません。画面を開き直してからお試しください。');
      return;
    }
    if (!isPersonal595AssistEnabled674(bag.holder.record)) {
      window.alert(
        '社員名検索（595）は、種別が「個人」かつステータスが「保管」以外のときのみ使えます（仕様書 §4.1a・§4.4）。',
      );
      return;
    }
    const backdrop = ensureEmployee595SearchModal674();
    const input = backdrop.querySelector('[data-npl-e595-q]');
    const container = backdrop.querySelector('[data-npl-e595-results]');
    if (container) {
      container.textContent = '';
      const p = document.createElement('p');
      p.style.cssText = 'margin:8px 0;color:#6c757d;font-size:13px;line-height:1.5;';
      p.textContent = '検索語を入力して「検索」または Enter。利用者名欄の文字列を引き継ぎます。';
      container.appendChild(p);
    }
    backdrop.style.display = 'flex';
    if (input) {
      const live = readUserNameLiveValue674(bag.holder.record);
      input.value = live || '';
      setTimeout(function () {
        input.focus();
        input.select();
      }, 50);
    }
  }

  function applyEmployeePickFrom595674(emp) {
    const bag = getRecordFormHolder674();
    if (!bag) return;
    const holder = bag.holder;
    const api = bag.api;
    const rec = holder.record;
    setScalarFieldValue674(rec, FC_USER_NAME, (emp.user_name && emp.user_name.value) || '');
    setScalarFieldValue674(rec, FC_EMP_ID, (emp.emp_id && emp.emp_id.value) || '');
    // §4.2.0b: 所属は595連携＋手入力補正を許容。候補確定でも既入力の dept / group は上書きしない（空欄のみ 595 で補完）
    mergeScalarField(rec, FC_DEPT_NAME, (emp.dept_name && emp.dept_name.value) || '');
    mergeScalarField(rec, FC_GROUP_NAME, (emp.group_name && emp.group_name.value) || '');
    api.set(holder);
    hideUserSuggest674();
  }

  /** 所属名・所属グループ・利用者名のフィールド DOM（PC / モバイル） */
  function tryGetFieldElement674(code) {
    const cached = npl674FieldElCacheEntries674[code];
    if (cached && cached.isConnected) return cached;

    try {
      if (kintone.app && kintone.app.record && typeof kintone.app.record.getFieldElement === 'function') {
        const el = kintone.app.record.getFieldElement(code);
        if (el) {
          if (el.isConnected) npl674FieldElCacheEntries674[code] = el;
          return el;
        }
      }
    } catch (_e) {
      /* ignore */
    }
    try {
      if (typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
        const el2 = kintone.mobile.app.record.getFieldElement(code);
        if (el2 && el2.isConnected) npl674FieldElCacheEntries674[code] = el2;
        if (el2) return el2;
      }
    } catch (_e2) {
      /* ignore */
    }
    return null;
  }

  /** account_type フィールド内の select をシャドウをまたいで探索 */
  function findSelectUnderFieldRoot674(root) {
    if (!root || !root.querySelector) return null;
    if (root.isConnected && npl674SelectUnderRootMap674.has(root)) {
      const cached = npl674SelectUnderRootMap674.get(root);
      if (cached && cached.isConnected) return cached;
      try {
        npl674SelectUnderRootMap674.delete(root);
      } catch (_d0) {
        /* ignore */
      }
    }
    try {
      const direct = root.querySelector('select');
      if (direct) {
        if (root.isConnected) npl674SelectUnderRootMap674.set(root, direct);
        return direct;
      }
    } catch (_e) {
      return null;
    }
    let w;
    try {
      w = root.querySelectorAll('*');
    } catch (_e2) {
      return null;
    }
    for (let i = 0; i < w.length; i++) {
      if (w[i].shadowRoot) {
        const inner = findSelectUnderFieldRoot674(w[i].shadowRoot);
        if (inner) {
          if (root.isConnected) npl674SelectUnderRootMap674.set(root, inner);
          return inner;
        }
      }
    }
    return null;
  }

  /**
   * 種別: DOM の select が取れて値があればそれを優先、なければ record（UI 先行・未到達の両方を吸収）。
   */
  function readAccountTypeLive674(record) {
    let fromDom = '';
    try {
      const el = tryGetFieldElement674(FC_ACCOUNT_TYPE);
      if (el) {
        const sel = findSelectUnderFieldRoot674(el);
        if (sel) fromDom = String(sel.value != null ? sel.value : '').trim();
      }
    } catch (_e) {
      /* ignore */
    }
    const fromRec = String((record && record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();
    /** record を優先（DOM の select が一瞬古いと共有・JR の直下ボタンが付かない） */
    if (fromRec) return fromRec;
    if (fromDom) return fromDom;
    return '';
  }

  /**
   * pc_status: DOM の select が取れて値があればそれを優先（readAccountTypeLive674 と同趣旨）。
   * @param {object} record
   * @returns {string}
   */
  function readPcStatusLive674(record) {
    let fromDom = '';
    try {
      const el = tryGetFieldElement674(FC_PC_STATUS);
      if (el) {
        const sel = findSelectUnderFieldRoot674(el);
        if (sel) fromDom = String(sel.value != null ? sel.value : '').trim();
      }
    } catch (_e) {
      /* ignore */
    }
    const fromRec = String((record && record[FC_PC_STATUS] && record[FC_PC_STATUS].value) || '').trim();
    if (fromRec) return fromRec;
    if (fromDom) return fromDom;
    return '';
  }

  /** `pc_status` が保管（個人/共有/JR 横断・ヘッダ最小 UI のゲート） */
  function isPcStatusStorage674(record) {
    return readPcStatusLive674(record) === PC_STATUS_STORAGE;
  }

  /**
   * 595 入力支援（モーダル・明示ボタン・利用者名の 595 候補ドロップダウン）が有効な条件の単一正本。
   * `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.1a（個人×保管は 595 連携不要）・§4.4（個人用自動生成は pc_status≠保管）・§4.2.0。
   * CIO 運用: 仕様乖離時は本関数とコメントを先に直し、分岐はここに集約する。
   * @param {object} record kintone record（`get()` の holder.record を想定）
   * @returns {boolean}
   */
  function isPersonal595AssistEnabled674(record) {
    if (!record) return false;
    if (readAccountTypeLive674(record) !== TYPE_PERSONAL) return false;
    if (isPcStatusStorage674(record)) return false;
    return true;
  }

  function walkFromNodeTouchesFieldRoot674(fieldRoot, start) {
    if (!fieldRoot || !start || start.nodeType !== 1) return false;
    let n = start;
    for (let hop = 0; hop < 90 && n; hop++) {
      try {
        if (n === fieldRoot) return true;
        if (fieldRoot.contains(n)) return true;
      } catch (_e) {
        /* ignore */
      }
      const rn = n.getRootNode && n.getRootNode();
      if (rn && rn instanceof ShadowRoot) {
        n = rn.host;
      } else {
        n = n.parentElement;
      }
    }
    return false;
  }

  /**
   * getFieldElement の外枠と、Shadow DOM 内の実入力の対応付け。
   * composedPath を併用（ev.target だけでは所属グループ等で取りこぼす環境がある）。
   */
  function isActiveTargetWithinFieldRoot674(fieldRoot, ev) {
    if (!fieldRoot || !ev) return false;
    const seen = [];
    const pushCand = function (node) {
      if (!node || node.nodeType !== 1) return;
      if (seen.indexOf(node) !== -1) return;
      seen.push(node);
    };
    pushCand(ev.target);
    if (typeof ev.composedPath === 'function') {
      try {
        const path = ev.composedPath();
        for (let i = 0; i < path.length; i++) {
          pushCand(path[i]);
        }
      } catch (_e) {
        /* ignore */
      }
    }
    for (let i = 0; i < seen.length; i++) {
      if (walkFromNodeTouchesFieldRoot674(fieldRoot, seen[i])) return true;
    }
    return false;
  }

  /** record またはフィールド DOM 上のテキスト値（空欄判定用・1 段シャドウまで探索） */
  function trimmedScalarLive674(rec, code) {
    const fromRec = trimmedScalarValue674(rec, code);
    if (fromRec) return fromRec;
    const root = tryGetFieldElement674(code);
    if (!root) return '';
    let inp = root.querySelector(
      'textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])',
    );
    if (!inp) {
      try {
        const all = root.querySelectorAll('*');
        for (let j = 0; j < all.length; j++) {
          const node = all[j];
          if (node.shadowRoot) {
            inp = node.shadowRoot.querySelector(
              'textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])',
            );
            if (inp) break;
          }
        }
      } catch (_e2) {
        /* ignore */
      }
    }
    if (inp && (inp.tagName === 'INPUT' || inp.tagName === 'TEXTAREA')) {
      return String(inp.value != null ? inp.value : '').trim();
    }
    return '';
  }

  let npl674FocusAssistDoc674 = false;
  let npl674FocusAssistSuppressUntil674 = 0;
  /** `document` capture 1 本でフィールドクリックを拾う（フィールドルートより確実） */
  let npl674DocInputAssistClick674 = false;

  function is674AssistModalVisible674() {
    const c = document.getElementById(INPUT_ASSIST_CONFIRM_MODAL_ID);
    if (c) {
      const cs = String(c.style.display || '').trim();
      if (cs && cs !== 'none') return true;
    }
    const d = document.getElementById(DEPT_MASTER_MODAL_ID);
    if (d) {
      const ds = String(d.style.display || '').trim();
      if (ds && ds !== 'none') return true;
    }
    const e = document.getElementById(EMPLOYEE_SEARCH_MODAL_ID);
    if (e) {
      const es = String(e.style.display || '').trim();
      if (es && es !== 'none') return true;
    }
    const m365c = document.getElementById(M365_ASSIST_CHOICE_MODAL_ID);
    if (m365c) {
      const m365cs = String(m365c.style.display || '').trim();
      if (m365cs && m365cs !== 'none') return true;
    }
    const m365p = document.getElementById(M365_ASSIST_PICKER_MODAL_ID);
    if (m365p) {
      const m365ps = String(m365p.style.display || '').trim();
      if (m365ps && m365ps !== 'none') return true;
    }
    const m365n = document.getElementById(M365_ASSIST_NEW_ISSUED_MODAL_ID);
    if (m365n) {
      const m365ns = String(m365n.style.display || '').trim();
      if (m365ns && m365ns !== 'none') return true;
    }
    return false;
  }

  /**
   * §4.2.0b: **個人** — 利用者名・所属名・所属グループをクリック →「入力支援を利用しますか？」（はい／いいえ）→ はいで 595。
   * **共有・JR** — 共有PCのため利用者の概念はなく、**所属名・所属グループ**のみ同様に確認 → はいで 680。
   * フォーカスでは起動しない。フィールド直下ボタンも **はい／いいえ** のあとで検索を開く。ヘッダの旧検索ボタンは廃止。
   * @param {Event} ev
   * @param {'user'|'dept'|'grp'|null} forcedField null = document 上でターゲットから推定。各フィールド getFieldElement 直下は固定。
   * @param {number} [attempt] get() 未到達時の短いリトライ回数
   */
  function run674EmptyFieldAssistFromPointer674(ev, forcedField, attempt) {
    attempt = attempt || 0;
    if (String(ev.type || '') !== 'click' || ev.button !== 0) return;
    if (Date.now() < npl674FocusAssistSuppressUntil674) return;
    const ae = ev.target;
    if (!ae || ae.nodeType !== 1) return;
    if (typeof ae.closest === 'function') {
      if (ae.closest('#new-pc-ledger-buttons')) return;
      if (ae.closest('#' + INPUT_ASSIST_CONFIRM_MODAL_ID)) return;
      if (ae.closest('#' + EMPLOYEE_SEARCH_MODAL_ID)) return;
      if (ae.closest('#' + DEPT_MASTER_MODAL_ID)) return;
      if (ae.closest('#' + M365_ASSIST_CHOICE_MODAL_ID)) return;
      if (ae.closest('#' + M365_ASSIST_PICKER_MODAL_ID)) return;
      if (ae.closest('#' + M365_ASSIST_NEW_ISSUED_MODAL_ID)) return;
      if (ae.closest('[data-npl-input-assist-adj="1"]')) return;
      if (ae.closest('[data-npl-dept-cluster-adj="1"]')) return;
      if (ae.closest('#' + USER_SUGGEST_BOX_ID)) return;
    }
    if (!forcedField && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) {
      if (ae.disabled || ae.readOnly) return;
    }

    let bag;
    let rec;
    let type;
    let inUser = false;
    let inM365 = false;
    let inDept = false;
    let inGrp = false;

    if (forcedField === 'user' || forcedField === 'dept' || forcedField === 'grp') {
      bag = getRecordFormHolder674();
      if (!bag || !bag.holder || !bag.holder.record) {
        if (attempt < 10) {
          setTimeout(function () {
            run674EmptyFieldAssistFromPointer674(ev, forcedField, attempt + 1);
          }, 100);
        }
        return;
      }
      rec = bag.holder.record;
      type = readAccountTypeLive674(rec);
      if (!type && forcedField) {
        type = TYPE_PERSONAL;
      }
      if (forcedField === 'user') {
        inUser = true;
      } else if (forcedField === 'dept') {
        inDept = true;
      } else {
        inGrp = true;
      }
    } else {
      const userEl = tryGetFieldElement674(FC_USER_NAME);
      const m365El = tryGetFieldElement674(FC_M365_ID);
      const deptEl = tryGetFieldElement674(FC_DEPT_NAME);
      const grpEl = tryGetFieldElement674(FC_GROUP_NAME);
      if (!userEl && !m365El && !deptEl && !grpEl) return;

      inUser = !!(userEl && isActiveTargetWithinFieldRoot674(userEl, ev));
      inM365 = !inUser && !!(m365El && isActiveTargetWithinFieldRoot674(m365El, ev));
      inDept = !inUser && !inM365 && !!(deptEl && isActiveTargetWithinFieldRoot674(deptEl, ev));
      inGrp = !inUser && !inM365 && !inDept && !!(grpEl && isActiveTargetWithinFieldRoot674(grpEl, ev));
      if (!inUser && !inM365 && !inDept && !inGrp) return;

      bag = getRecordFormHolder674();
      if (!bag || !bag.holder || !bag.holder.record) return;
      rec = bag.holder.record;
      type = readAccountTypeLive674(rec);
    }

    if (!inUser && !inM365 && !inDept && !inGrp) return;

    if (is674AssistModalVisible674()) return;

    if (isPcStatusStorage674(rec)) return;

    if (inM365 && type !== TYPE_SHARED && type !== TYPE_JR) return;

    /* 共有・JR: M365 ID 欄は §4.6.6 の M365 入力へ（680 より先） */
    if ((type === TYPE_SHARED || type === TYPE_JR) && inM365) {
      runM365AssistEntry674('field-click');
      return;
    }

    /* 共有・JR: 所属欄のみ（利用者の概念なし）。クリック → はい／いいえ → 680（所属は再検索可） */
    if (type === TYPE_SHARED || type === TYPE_JR) {
      if (!inDept && !inGrp) return;
      promise674InputAssistConfirm674(NPL674_INPUT_ASSIST_MSG_SHARED_JR).then(function (yes) {
        if (!yes) return;
        npl674FocusAssistSuppressUntil674 = Date.now() + 400;
        openDeptMasterModal674();
      });
      return;
    }

    /* 個人（非保管）: 利用者名・所属クリック → はい／いいえ → 595 */
    if (isPersonal595AssistEnabled674(rec)) {
      promise674InputAssistConfirm674(NPL674_INPUT_ASSIST_MSG_PERSONAL).then(function (yes) {
        if (!yes) return;
        npl674FocusAssistSuppressUntil674 = Date.now() + 400;
        openEmployee595SearchModal674();
      });
    }
  }

  /** kintone フィールド内の `stopPropagation` より先に走らせるため `document` の capture で委譲 */
  function wire674FieldAssistDirect674() {
    if (npl674DocInputAssistClick674) return;
    npl674DocInputAssistClick674 = true;
    document.addEventListener(
      'click',
      function npl674DocInputAssistClickHandler674(ev) {
        /* メインスレッドの click 計測を短くし、[Violation] handler took Nms を抑える */
        requestAnimationFrame(function () {
          run674EmptyFieldAssistFromPointer674(ev, null, 0);
        });
      },
      true,
    );
  }

  function install674EmptyFieldFocusAssist674() {
    if (npl674FocusAssistDoc674) return;
    npl674FocusAssistDoc674 = true;
    /* show 側の遅延 wire と二重にならないよう即時 1 回のみ（クリック時の field 判定は wire が正本） */
    setTimeout(function () {
      wire674FieldAssistDirect674();
    }, 0);
  }

  /** 旧実装のフィールド直下ノードを掃除（`data-npl-*-adj`）。現行は入力支援を `#new-pc-ledger-buttons` のみに出す。 */
  function remove595FieldAdjacentRows674() {
    try {
      const sel = '[data-npl-input-assist-adj="1"],[data-npl-595-adj="1"],[data-npl-dept-cluster-adj="1"]';
      const nodes = document.querySelectorAll(sel);
      for (let i = 0; i < nodes.length; i++) {
        try {
          const p = nodes[i].parentNode;
          if (p) p.removeChild(nodes[i]);
        } catch (_e) {
          /* ignore */
        }
      }
    } catch (_e2) {
      /* ignore */
    }
  }

  /**
   * 旧版のフィールド直下ノードのみ掃除。入力支援の明示 UI は `injectButtons` の `#new-pc-ledger-buttons` に集約。
   * @param {object} [_rec]
   */
  function inject595FieldAdjacentRows674(_rec) {
    remove595FieldAdjacentRows674();
  }

  /**
   * 一覧・閲覧では掃除のみ。編集・新規は `injectButtons` が帯を描画するためここでは遅延注入しない。
   */
  function scheduleInject595FieldAdjacent674(rec, editable) {
    remove595FieldAdjacentRows674();
    if (!editable) return;
  }

  function mountUserSuggestDropdown674(rows) {
    hideUserSuggest674();
    let anchor = getUserNameFieldEl674();
    let useHeaderFallback = false;
    if (!anchor) {
      anchor = getHeaderSpace674();
      useHeaderFallback = true;
      if (!anchor) {
        console.warn('[NEW-PC-LEDGER-V1] 利用者名候補: フィールド要素もヘッダも取得できず表示できません');
        return;
      }
    }
    if (!useHeaderFallback) {
      anchor.setAttribute('data-npl-user-anchor', '1');
      anchor.style.position = 'relative';
    }
    const box = document.createElement('div');
    box.id = USER_SUGGEST_BOX_ID;
    if (useHeaderFallback) {
      box.setAttribute('data-npl-user-suggest-fallback', '1');
      box.style.cssText =
        'position:relative;margin:4px 0 10px;padding:0;min-width:260px;max-width:520px;max-height:260px;overflow:auto;' +
        'background:#fff;border:1px solid #0d6efd;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,.12);z-index:99999;' +
        'font-size:13px;line-height:1.4;';
    } else {
      box.style.cssText =
        'position:absolute;left:0;top:100%;margin-top:2px;min-width:260px;max-width:480px;max-height:260px;overflow:auto;' +
        'background:#fff;border:1px solid #0d6efd;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:99999;' +
        'font-size:13px;line-height:1.4;';
    }
    const title = document.createElement('div');
    title.style.cssText =
      'padding:6px 10px;background:#e7f1ff;border-bottom:1px solid #9ec5fe;font-weight:bold;color:#052c65;font-size:12px;';
    title.textContent = '社員マスタの候補（タップで確定・所属は空欄のときのみ補完します）';
    box.appendChild(title);
    if (!rows || !rows.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:10px;color:#6c757d;';
      empty.textContent =
        '在籍の社員名が見つかりません。595の氏名（user_name）に含まれる文字で検索するか、苗字＋名の表記を試してください。名前の一部だけではヒットしない場合があります。';
      if (useHeaderFallback) anchor.insertBefore(box, anchor.firstChild);
      else anchor.appendChild(box);
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
    if (useHeaderFallback) anchor.insertBefore(box, anchor.firstChild);
    else anchor.appendChild(box);
  }

  function scheduleUserNameSuggest674() {
    if (userSuggestTimer674) clearTimeout(userSuggestTimer674);
    userSuggestTimer674 = setTimeout(function () {
      userSuggestTimer674 = null;
      const bag = getRecordFormHolder674();
      if (!bag || !bag.holder || !bag.holder.record) return;
      const rec = bag.holder.record;
      if (!isPersonal595AssistEnabled674(rec)) {
        hideUserSuggest674();
        return;
      }
      const raw = readUserNameLiveValue674(rec);
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
    if (!isPersonal595AssistEnabled674(event.record)) {
      hideUserSuggest674();
      return event;
    }
    ensureUserNameInputDelegate674();
    ensureUserSuggestDocClick674();
    scheduleUserNameSuggest674();
    return event;
  }

  /** change.user_name が発火しない環境向け: 利用者名 input の input イベントを document で捕捉 */
  function ensureUserNameInputDelegate674() {
    if (userNameInputDelegate674) return;
    userNameInputDelegate674 = true;
    document.addEventListener(
      'input',
      function (ev) {
        try {
          const t = ev.target;
          if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
          const fieldEl = getUserNameFieldEl674();
          if (!fieldEl || !fieldEl.contains(t)) return;
          const bag = getRecordFormHolder674();
          if (!bag || !bag.holder || !bag.holder.record) return;
          const rec = bag.holder.record;
          if (!isPersonal595AssistEnabled674(rec)) return;
          ensureUserSuggestDocClick674();
          scheduleUserNameSuggest674();
        } catch (err) {
          console.warn('[NEW-PC-LEDGER-V1] user_name input delegate', err);
        }
      },
      true,
    );
  }

  function ensureUserSuggestDocClick674() {
    if (userSuggestDocClick674) return;
    userSuggestDocClick674 = true;
    document.addEventListener(
      'click',
      function (ev) {
        requestAnimationFrame(function () {
          const box = document.getElementById(USER_SUGGEST_BOX_ID);
          if (!box) return;
          const t = ev.target;
          const fieldEl = getUserNameFieldEl674();
          if (fieldEl && fieldEl.contains(t)) return;
          if (box.contains(t)) return;
          if (t.closest && t.closest('[data-npl-user-anchor="1"]')) return;
          if (t.closest && t.closest('[data-npl-user-suggest-fallback="1"]')) return;
          hideUserSuggest674();
        });
      },
      true,
    );
  }

  function validateUserNameIn595ForPersonal674(event) {
    if (!isPersonal595AssistEnabled674(event.record)) return Promise.resolve(null);
    const un = String(event.record[FC_USER_NAME]?.value || '').trim();
    if (!un) return Promise.resolve(null);
    return findEmployee595ByUserName(un).then(function (emp) {
      if (emp) return null;
      if (readNplTransferManualChecked674(event.record)) {
        return '該当なし（社員マスタ595に在籍として一致する氏名がありません）。新入社員の場合は先に595へ登録してから保存してください。';
      }
      return 'この「利用者名」は社員マスタ（在籍）の氏名と一致しません。595の user_name と同じ表記（多くは苗字＋名のフルネーム）にするか、入力中にフィールド下へ出る候補から選んでください。名前の一部分だけでは保存できません。';
    });
  }

  function runPersonalAutoGen() {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) {
      window.alert('フォームの準備ができていません。少し待ってから再度お試しください。');
      return Promise.resolve();
    }
    const api = bag.api;
    const recNow = bag.holder;
    const rec = recNow.record;
    if (!isPersonal595AssistEnabled674(rec)) {
      window.alert('個人用自動生成は、種別が「個人」かつステータスが「保管」以外のときのみ使えます（仕様書 §4.1a・§4.4）。');
      return Promise.resolve();
    }
    const userName = (rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '';
    if (!String(userName).trim()) {
      window.alert('種別=個人 の自動生成には「利用者名」を先に入力してください。');
      return Promise.resolve();
    }
    return Promise.all([
      loadEnv670Map(),
      findEmployee595ByUserName(userName.trim()),
      nextJbmFrom672(),
      fetchNextFreePersonalJbisSerial674(),
    ])
      .then(function (results) {
        const bagFresh = getRecordFormHolder674();
        if (!bagFresh || !bagFresh.holder || !bagFresh.holder.record) {
          window.alert('フォームの準備ができていません。少し待ってから再度お試しください。');
          return;
        }
        const apiFresh = bagFresh.api;
        const recNow = apiFresh.get();
        const rec = recNow.record;
        const envMap = results[0];
        const emp = results[1];
        const nextJbm = results[2];
        const maxPcSerial = results[3];
        if (!emp) {
          window.alert('社員マスタ（595）に user_name が一致するレコードが見つかりません: ' + userName);
          return;
        }
        const mail = (emp.mail && emp.mail.value) || '';
        const mailLocal = extractMailLocalFrom595Mail674(mail);
        const m365Domain = envMap.M365_DOMAIN || '@kensetsutoso01.onmicrosoft.com';
        const m365PwSuffix = envMap.M365_PW_PERSONAL_SUFFIX || 'K#';

        const nextJbmTrim = String(nextJbm || '').trim();
        if (!isStrictNewPersonalJbmLogon674(nextJbmTrim)) {
          window.alert(
            '個人WindowsID採番（672）の値が仕様書 §4.3.2（新規発番・jbm＋4桁）と一致しません: 「' +
              nextJbmTrim +
              '」。672マスタのデータを確認してください。自動生成を中断します。',
          );
          return;
        }

        mergePcNameSerialFromMax674(rec, envMap, maxPcSerial, 'personal', { forcePersonalPc: true });

        const pcAfterMerge = trimmedScalarValue674(rec, FC_PC_NAME);
        const serAfterMerge = trimmedScalarValue674(rec, FC_PC_SERIAL_NO);
        mergeScalarField(rec, FC_DEPT_NAME, (emp.dept_name && emp.dept_name.value) || '');
        mergeScalarField(rec, FC_GROUP_NAME, (emp.group_name && emp.group_name.value) || '');
        mergeScalarField(rec, FC_EMP_ID, (emp.emp_id && emp.emp_id.value) || '');
        mergeScalarField(rec, FC_MAIL, mail);
        mergeScalarField(rec, FC_MAIL_ACCT, mailLocal);
        mergeScalarField(rec, FC_LOGON_NAME, nextJbmTrim);
        mergeScalarField(rec, FC_LOGON_PW, nextJbmTrim);
        const windowsDisplay = buildPersonalWindowsNameDisplay674(nextJbmTrim, mailLocal);
        mergeScalarField(rec, FC_WINDOWS_NAME, windowsDisplay);
        if (mailLocal) mergeScalarField(rec, FC_M365_ID, mailLocal + m365Domain);
        mergeScalarField(rec, FC_M365_PW, nextJbmTrim + m365PwSuffix);
        mergePersonalMailGbSb674(rec, envMap, nextJbmTrim, mailLocal);

        console.info('[NEW-PC-LEDGER-V1] personal autogen §4.2.2', {
          next_free_jbis_serial_674: maxPcSerial,
          pc_name_after_pc_serial_merge: pcAfterMerge || '(unchanged)',
          pc_serial_no_after_pc_serial_merge: serAfterMerge || '(unchanged)',
          logon_name: nextJbmTrim,
          mail_acct: mailLocal || '(empty)',
          windows_name: windowsDisplay,
        });

        withWritableInternalMeta674(rec, function () {
          apiFresh.set(recNow);
        });
        applyM365MasterRecordIdFieldUi674(rec, 'editable');
        let msg =
          '個人用フィールドをフォームへ反映しました。**PC名が空のときだけ**、台帳の JBIS 空き若番で **PC名・シリアル（PC）**を採番します（登録済み PC 名は変更しません）。その他の欄は空欄のみ上書きです。保存は手動で行ってください。';
        if (!mailLocal) {
          msg +=
            '\n\n※595の会社メール（@より前）が空のため、Windows アカウント名は「' +
            nextJbmTrim +
            '」のみです。サイボウズID・ガリバーID（=mail_acct）も空欄のままです。メールを登録後に再度自動生成するか、手入力で補完してください。';
        }
        window.alert(msg);
      });
  }

  function runSharedAutoGen() {
    const bagProbe = getRecordFormHolder674();
    if (!bagProbe || !bagProbe.holder || !bagProbe.holder.record) {
      window.alert('フォームの準備ができていません。少し待ってから再度お試しください。');
      return Promise.resolve();
    }
    const typeEarly = readAccountTypeLive674(bagProbe.holder.record);
    if (typeEarly !== TYPE_SHARED) {
      window.alert(
        '共有向けの自動生成は種別が「共有」のときのみ使えます。JR端末で M365 を設定するときは、ツールバーの「M365 入力」ボタンをご利用ください。',
      );
      return Promise.resolve();
    }

    return Promise.all([loadEnv670Map(), nextSjbmFrom673(), fetchNextFreeSharedSjbisSerial674()]).then(
      function (results) {
        const bag = getRecordFormHolder674();
        if (!bag || !bag.api || typeof bag.api.get !== 'function') {
          window.alert('フォームの準備ができていません。少し待ってから再度お試しください。');
          return;
        }
        const api = bag.api;
        const recNow = api.get();
        const rec = recNow.record;
        const type = readAccountTypeLive674(rec);
        if (type !== TYPE_SHARED) {
          window.alert(
            '種別が「共有」でないため自動生成を中止しました。M365 はツールバーの「M365 入力」ボタンから設定できます。',
          );
          return;
        }
        runSharedAutoGenApply674(api, recNow, rec, results[0], results[1], results[2]);
      },
    );
  }

  /**
   * 共有の Windows 系自動生成（REST 取得後に **必ず `api.get()` し直した** record へだけ反映する）。M365 は §4.6.6「M365 入力」で行う。
   * @param {object} api `kintone.app.record` または `kintone.mobile.app.record`
   */
  function runSharedAutoGenApply674(api, recNow, rec, envMap, nextSjbm, maxPcSerial) {
    try {
      withWritableInternalMeta674(rec, function () {
        if (nextSjbm) {
          mergePcNameSerialFromMax674(rec, envMap, maxPcSerial, 'shared', { forceSharedPc: true });
          mergeScalarField(rec, FC_LOGON_NAME, nextSjbm);
          mergeScalarField(rec, FC_WINDOWS_NAME, nextSjbm);
          const fixedPw = envMap.LOGON_PW_SHARED_FIXED || 'kent0000';
          const lpw = rec[FC_LOGON_PW];
          if (lpw && (!lpw.value || !String(lpw.value).trim())) lpw.value = fixedPw;
        }
        api.set(recNow);
      });
    } catch (err) {
      console.error('[NEW-PC-LEDGER-V1] runSharedAutoGen record.set failed', err);
      throw err;
    }
    applyM365MasterRecordIdFieldUi674(rec, 'editable');
    window.alert(
      '共有向け Windows 関連フィールドをフォームへ反映しました（空欄のみ）。M365 はツールバーの「M365 入力」ボタンから設定してください。保存は手動で行ってください。',
    );
  }

  /** kintone レコードオブジェクトの 1 フィールドを「空」にする（型別） */
  function clearRecordFieldCell674(cell) {
    if (!cell || typeof cell !== 'object' || !Object.prototype.hasOwnProperty.call(cell, 'value')) return;
    const t = cell.type;
    if (t === 'CHECK_BOX') {
      cell.value = [];
      return;
    }
    if (t === 'NUMBER') {
      cell.value = null;
      return;
    }
    if (t === 'FILE') {
      cell.value = [];
      return;
    }
    if (t === 'USER_SELECT' || t === 'ORGANIZATION_SELECT' || t === 'GROUP_SELECT') {
      cell.value = [];
      return;
    }
    cell.value = '';
  }

  function runClearAccountFields() {
    const bag = getRecordFormHolder674();
    if (!bag || !bag.holder || !bag.holder.record) {
      window.alert('フォームの準備ができていません。少し待ってから再度お試しください。');
      return;
    }
    const recNow = bag.holder;
    const rec = recNow.record;
    for (let i = 0; i < FULL_RESET_FIELD_CODES_674.length; i++) {
      clearRecordFieldCell674(rec[FULL_RESET_FIELD_CODES_674[i]]);
    }
    bag.api.set(recNow);
    hideUserSuggest674();
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

  /**
   * 674 の実データ（共有/JR・廃棄以外）から、671 1行の linked_pcs / usage_count / status を再計算して上書きする。
   * M365管理マスタを手で触った場合のズレ吸収用（正本は 674）。
   */
  function sync671MasterFrom674674(masterRecordId) {
    const midStr = String(masterRecordId || '').trim();
    if (!midStr) return Promise.resolve();

    function put671From674Once() {
      return loadEnv670Map().then(function (envMap) {
        const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
        const q =
          '(account_type in ("共有", "JR端末")) and pc_status not in ("廃棄") and m365_master_record_id = ' +
          midStr +
          ' limit 500';
        return kintoneApiGet('/k/v1/records.json', {
          app: kintone.app.getId(),
          query: q,
          fields: ['pc_name'],
        }).then(function (resp674) {
          const set = Object.create(null);
          for (let i = 0; i < (resp674.records || []).length; i++) {
            const row = resp674.records[i];
            const p = (row.pc_name && row.pc_name.value) || '';
            const t = String(p).trim();
            if (t) set[t] = true;
          }
          const pcsArr = Object.keys(set).sort();
          const desiredLinked = pcsArr.join(',');
          const desiredUsage = pcsArr.length;
          const desiredStatus = next671StatusFromUsage(desiredUsage, lim);

          return kintoneApiGet('/k/v1/record.json', { app: APP_M365_MASTER, id: midStr }).then(function (get671) {
            const r671 = get671.record;
            const st671 = (r671.status && r671.status.value) || '';
            if (st671 === '廃止') {
              console.warn('[NEW-PC-LEDGER-V1] sync671 skip 廃止 id=' + midStr);
              return Promise.resolve();
            }
            const curList = parseLinked671((r671.linked_pcs && r671.linked_pcs.value) || '');
            const curNorm = dedupeLinked671PreserveOrder(curList)
              .slice()
              .sort()
              .join(',');
            if (curNorm === desiredLinked) {
              const curUs = parseInt((r671.usage_count && r671.usage_count.value) || '0', 10) || 0;
              const curSt = (r671.status && r671.status.value) || '';
              if (curUs === desiredUsage && curSt === desiredStatus) return Promise.resolve();
            }
            return kintoneApiPut('/k/v1/record.json', {
              app: APP_M365_MASTER,
              id: midStr,
              revision: get671.revision,
              record: {
                linked_pcs: { value: desiredLinked },
                usage_count: { value: String(desiredUsage) },
                status: { value: desiredStatus },
              },
            });
          });
        });
      });
    }
    return put671From674Once().catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] sync671MasterFrom674674 retry id=' + midStr, e);
      return put671From674Once();
    });
  }

  function sync671MastersFrom674ByIds674(mids) {
    const uniq = [];
    const seen = Object.create(null);
    for (let i = 0; i < (mids || []).length; i++) {
      const s = String(mids[i] || '').trim();
      if (!s || seen[s]) continue;
      seen[s] = true;
      uniq.push(s);
    }
    let chain = Promise.resolve();
    for (let j = 0; j < uniq.length; j++) {
      const mid = uniq[j];
      chain = chain.then(function () {
        return sync671MasterFrom674674(mid);
      });
    }
    return chain;
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
   * 共有/JR で 671 の同一行へ新規に 1 台載せようとする保存で、その行が満杯なら
   * `fetchAssignableM365Record671`（usage_count が上限未満・利用可の最古行）へ **自動切替**（§5.3）。
   * フォームに M365 ID / PW が手入力されているときは上書きせずエラー（手入力を正とする）。
   * 空き行が無いときのみエラー。
   * @returns {Promise<string|null>} エラー文言 or null
   */
  function ensureM671SlotOrAutoReassign674(event) {
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
        if (pcs.length < lim) {
          return null;
        }
        return fetchAssignableM365Record671().then(function (m671) {
          if (!m671) {
            return (
              '共有のメール（Microsoft 365）は付けられる PC が ' +
              lim +
              ' 台までです。すべての割当が満杯のため、別の行へ自動切替できません。Microsoft の管理画面でアカウントを追加してからマスタを更新し、システム担当に相談してください。'
            );
          }
          const newRowId = m671.$id && m671.$id.value;
          if (String(newRowId) === String(nMid)) {
            return (
              '割当先が満杯ですが、別の空き行を取得できませんでした。ページを開き直して再度保存するか、システム担当に相談してください。'
            );
          }
          const m365Id = (m671.m365_id && m671.m365_id.value) || '';
          const formPw = m365SharedJrFormPassword674(envMap);
          if (trimmedScalarValue674(event.record, FC_M365_ID) || trimmedScalarValue674(event.record, FC_M365_PW)) {
            return (
              '共有のメール（Microsoft 365）は付けられる PC が ' +
              lim +
              ' 台までです。選択した割当は満杯です。フォームに M365 ID またはパスワードが入力されているため、別行への自動切替は行いません（手入力を優先）。M365管理マスタで別の割当レコードを選ぶか、入力を調整してから再度保存してください。'
            );
          }
          setScalarFieldValue674(event.record, FC_M365_ID, m365Id);
          setScalarFieldValue674(event.record, FC_M365_PW, formPw);
          setNumberFieldValue674(event.record, FC_M365_MASTER_RECORD_ID, newRowId);
          try {
            window.alert(
              '選択されていた M365 割当は ' +
                lim +
                ' 台に達していました。空きのある別の割当へ自動で切り替えました。\n\n' +
                (m365Id ? 'M365 ID: ' + m365Id + '\n' : '') +
                '内容を確認のうえ保存してください。',
            );
          } catch (eA) {
            /* ignore */
          }
          return null;
        });
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

  function find595RowsByMail674(mail) {
    const m = String(mail || '').trim();
    if (!m) return Promise.resolve([]);
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_EMPLOYEE,
      query: 'mail = "' + escapeQueryValue(m) + '" order by $id asc limit 5',
      fields: ['$id', '$revision', FC595_PC674_SUB],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function find595RowsByEmpId674(empId) {
    const e = String(empId || '').trim();
    if (!e) return Promise.resolve([]);
    return kintoneApiGet('/k/v1/records.json', {
      app: APP_EMPLOYEE,
      query: 'emp_id = "' + escapeQueryValue(e) + '" order by $id asc limit 5',
      fields: ['$id', '$revision', FC595_PC674_SUB],
    }).then(function (resp) {
      return resp.records || [];
    });
  }

  function resolve595RowsForLink674(mail, empId) {
    const m = String(mail || '').trim();
    const e = String(empId || '').trim();
    if (m) return find595RowsByMail674(m);
    if (e) return find595RowsByEmpId674(e);
    return Promise.resolve([]);
  }

  function remove674LinkFromSingle595674(id595, id674) {
    const idStr = String(id674).trim();
    return kintoneApiGet('/k/v1/record.json', { app: APP_EMPLOYEE, id: String(id595) }).then(function (g) {
      const r = g.record;
      const rev = g.revision;
      const subField = r[FC595_PC674_SUB];
      if (!subField || !Array.isArray(subField.value)) return Promise.resolve();
      const rows = [...subField.value];
      const filtered = rows.filter(function (row) {
        const cell = row.value && row.value[FC595_PC674_ID];
        const v = cell != null && cell.value != null && cell.value !== '' ? String(cell.value).trim() : '';
        return !v || v !== idStr;
      });
      if (filtered.length === rows.length) return Promise.resolve();
      return put595Pc674Sub674(String(id595), rev, clone595Pc674SubRows674(filtered));
    });
  }

  function remove674From595Matches674(mail, empId, id674) {
    const seen = Object.create(null);
    function stripList(rows595) {
      if (!rows595 || !rows595.length) return Promise.resolve();
      let chain = Promise.resolve();
      for (let i = 0; i < rows595.length; i++) {
        const id595 = String(rows595[i].$id && rows595[i].$id.value ? rows595[i].$id.value : '').trim();
        if (!id595 || seen[id595]) continue;
        seen[id595] = true;
        (function (id5) {
          chain = chain.then(function () {
            return remove674LinkFromSingle595674(id5, id674);
          });
        })(id595);
      }
      return chain;
    }
    let p = Promise.resolve();
    const m = String(mail || '').trim();
    const e = String(empId || '').trim();
    if (m) p = p.then(function () {
      return find595RowsByMail674(m).then(stripList);
    });
    if (e) p = p.then(function () {
      return find595RowsByEmpId674(e).then(stripList);
    });
    return p;
  }

  function merge674Into595Subtable674(id595, id674, accountType) {
    const idStr = String(id674).trim();
    return kintoneApiGet('/k/v1/record.json', { app: APP_EMPLOYEE, id: String(id595) }).then(function (g) {
      const r = g.record;
      const rev = g.revision;
      const subField = r[FC595_PC674_SUB];
      if (!subField) {
        console.warn(
          '[NEW-PC-LEDGER-V1] 595 にフィールド ' +
            FC595_PC674_SUB +
            ' がありません。`npm run setup:595:pc-ledger-v1-list` を実行してください。',
        );
        return Promise.resolve();
      }
      const rows = Array.isArray(subField.value) ? [...subField.value] : [];
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].value && rows[i].value[FC595_PC674_ID];
        const v = cell != null && cell.value != null && cell.value !== '' ? String(cell.value).trim() : '';
        if (v && v === idStr) {
          return Promise.resolve();
        }
      }
      const idSet = collect674IdsFrom595Sub674({ value: rows });
      if (accountType === TYPE_PERSONAL && idSet.size >= PERSONAL674_LINK_MAX) {
        window.alert(
          '社員マスタ（595）への新PC台帳リンクは、個人利用中PCあたり最大' +
            PERSONAL674_LINK_MAX +
            '台までです。既存の674レコードを確認するか、不要行を595の「' +
            FC595_PC674_SUB +
            '」から削除してから保存してください。',
        );
        return Promise.resolve();
      }
      const nextRows = clone595Pc674SubRows674(rows);
      const addCell = {};
      addCell[FC595_PC674_ID] = { value: idStr };
      nextRows.push({ value: addCell });
      return put595Pc674Sub674(String(id595), rev, nextRows);
    });
  }

  function collect674IdsFrom595Sub674(subField) {
    const rows = (subField && subField.value) || [];
    const set = new Set();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cell = row.value && row.value[FC595_PC674_ID];
      const v = cell != null && cell.value != null && cell.value !== '' ? String(cell.value).trim() : '';
      if (v) set.add(v);
    }
    return set;
  }

  function clone595Pc674SubRows674(rows) {
    return rows.map(function (row) {
      const o = { value: {} };
      if (row.id) o.id = row.id;
      const cell = row.value && row.value[FC595_PC674_ID];
      o.value[FC595_PC674_ID] = cell ? { value: cell.value } : { value: '' };
      return o;
    });
  }

  function put595Pc674Sub674(id595, revision, nextRows) {
    return kintoneApiPut('/k/v1/record.json', {
      app: APP_EMPLOYEE,
      id: String(id595),
      revision: revision,
      record: {
        [FC595_PC674_SUB]: { value: nextRows },
      },
    });
  }

  /**
   * 595 の pc_ledger_v1_list に674 $id を追記・削除する（個人のみ）。
   * - 個人（非保管）: mail 優先、無ければ emp_id で595を引く。リンクは最大2台。
   * - 共有・JR: 社員に紐付けないため595へ追記しない。削除は mail のみ試行（個人→共有で mail が残る場合の名残除去）。
   * - 上記以外（保管の個人・NAS等）: mail + emp_id で削除試行。
   */
  function sync595PcLedgerV1Link674(event) {
    const id674 = String(
      (event.recordId || (event.record && event.record.$id && event.record.$id.value) || ''),
    ).trim();
    if (!id674) return Promise.resolve();

    const rec = event.record;
    const type = (rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '';
    const mail = (rec[FC_MAIL] && rec[FC_MAIL].value && String(rec[FC_MAIL].value).trim()) || '';
    const empId =
      (rec[FC_EMP_ID] && rec[FC_EMP_ID].value && String(rec[FC_EMP_ID].value).trim()) || '';

    const eligible = isPersonal595AssistEnabled674(rec) && (!!mail || !!empId);

    if (!eligible) {
      if (type === TYPE_SHARED || type === TYPE_JR) {
        return remove674From595Matches674(mail, '', id674);
      }
      return remove674From595Matches674(mail, empId, id674);
    }

    return resolve595RowsForLink674(mail, empId).then(function (rows595) {
      if (!rows595.length) {
        console.warn(
          '[NEW-PC-LEDGER-V1] 595 未ヒット: type=' + type + ' mail=' + mail + ' emp_id=' + empId,
        );
        return;
      }
      if (rows595.length > 1) {
        console.warn(
          '[NEW-PC-LEDGER-V1] 595 が複数ヒット（先頭行のみ更新） mail=' + mail + ' emp_id=' + empId,
        );
      }
      const id595 = String(rows595[0].$id && rows595[0].$id.value ? rows595[0].$id.value : '').trim();
      if (!id595) return;
      return merge674Into595Subtable674(id595, id674, TYPE_PERSONAL);
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
      return reconcile671For674Save(prev, next, lim)
        .then(function () {
          const mids = [];
          if (prev && prev.m365_master_record_id) mids.push(String(prev.m365_master_record_id).trim());
          if (next && next.m365_master_record_id) mids.push(String(next.m365_master_record_id).trim());
          return sync671MastersFrom674ByIds674(mids);
        })
        .then(function () {
          return reconcile672673For674Save(prev, next, rid, isEdit);
        })
        .then(function () {
          return sync595PcLedgerV1Link674(event).catch(function (e) {
            console.error('[NEW-PC-LEDGER-V1] 595↔674リンク', e);
          });
        });
    });
  }

  /**
   * 転用 ON かつ「転用で廃棄した PC」空のまま保存したとき、ウィザード誘導を **同一レコード・同一ブラウザセッションで 1 回だけ** alert（仕様どおり保存のみでは転記しない旨の周知）。
   */
  function maybeAlertTransferDisposedEmptyAfterSave674(event) {
    try {
      if (!/record\.(edit|create)\.submit\.success$/.test(String(event.type || ''))) return;
      const rec = event.record;
      if (!rec || !readNplTransferManualChecked674(rec)) return;
      if (!event.record[FC_NPL_DISPOSED_PC_COPY]) return;
      if (trimmedScalarValue674(rec, FC_NPL_DISPOSED_PC_COPY)) return;
      const rid = String((event.recordId || (rec.$id && rec.$id.value) || '')).trim();
      if (!rid) return;
      if (typeof sessionStorage === 'undefined') return;
      const key = 'npl674-transfer-disposed-hint-' + rid;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      window.alert(
        '「転用」にチェックが入っていますが、「転用で廃棄した PC」は **保存だけでは入りません**。\n\n画面上部の **「転用: 元PCを廃棄…」** を実行し、廃棄する旧 PC を選ぶと、この欄に **自動転記**されます（**空欄のときのみ**。すでに手入力がある場合は手入力を正とします）。',
      );
    } catch (_e) {
      /* sessionStorage 不可環境では案内スキップ */
    }
  }

  // ===== PC買替（§4.10.3・594 と同趣旨: 596 採番・旧=廃棄・新=アカウント継承・671 / 595 整合）=====

  function yyyymmTokyo674(d) {
    const dt = d || new Date();
    const s = dt.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const m = s.match(/^(\d{4})-(\d{2})/);
    return m ? m[1] + m[2] : `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }

  function shouldBeDisposedStatus674(status) {
    const s = String(status || '').trim();
    return s.includes('廃棄') || s.includes('除却') || s.includes('廃止');
  }

  function getCurrent674RecordId674() {
    let id = '';
    try {
      const v = kintone.app.record.getId();
      if (v != null && String(v).trim()) id = String(v).trim();
    } catch (_e) {
      /* noop */
    }
    if (!id && typeof kintone.mobile !== 'undefined' && kintone.mobile.app && kintone.mobile.app.record) {
      try {
        const v2 = kintone.mobile.app.record.getId();
        if (v2 != null && String(v2).trim()) id = String(v2).trim();
      } catch (_e2) {
        /* noop */
      }
    }
    return id;
  }

  function get674RecordPayloadById674(recordId) {
    return kintoneApiGet('/k/v1/record.json', {
      app: kintone.app.getId(),
      id: String(recordId),
    }).then(function (res) {
      const rec = res.record || {};
      /** GET /k/v1/record.json は **トップレベル revision ではなく** `record.$revision.value`（公式サンプル準拠） */
      let rev = '';
      if (res.revision != null && String(res.revision).trim() !== '') {
        rev = String(res.revision).trim();
      } else {
        const rv = rec.$revision && rec.$revision.value != null ? String(rec.$revision.value).trim() : '';
        if (rv) rev = rv;
      }
      return {
        record: rec,
        revision: rev,
      };
    });
  }

  /** kintone REST の revision 不整合（他人更新・自動処理・別タブ）。PUT 失敗時の再 GET 用 */
  function is674KintoneRevisionConflictError674(err) {
    let msg = String((err && err.message) || '');
    if (err && Array.isArray(err.errors)) {
      for (let ei = 0; ei < err.errors.length; ei++) {
        const it = err.errors[ei];
        msg += ' ' + String((it && it.message) || '');
      }
    }
    const code = String((err && err.code) || '');
    const blob = msg + ' ' + code;
    return (
      /GAIA_UN03|CB_VA02/i.test(blob) ||
      /再読み込みしてください|ほかのユーザーがレコードを更新/i.test(msg)
    );
  }

  function readNplTransferManualChecked674(rec) {
    const f = rec && rec[FC_NPL_TRANSFER_MANUAL];
    if (!f || !Array.isArray(f.value)) return false;
    return f.value.indexOf(FC_NPL_TRANSFER_MANUAL_OPT) !== -1;
  }

  /**
   * 「転用」チェックのみ DOM を軽く見る（`querySelectorAll('*')` 全展開は DevTools の **`setTimeout` handler took Nms`** の原因になり得るため上限付き）。
   */
  function readNplTransferManualCheckedFromDomQuick674() {
    const root = tryGetFieldElement674(FC_NPL_TRANSFER_MANUAL);
    if (!root) return false;
    const OPT = FC_NPL_TRANSFER_MANUAL_OPT;
    const MAX_DEPTH = 5;
    const MAX_HOSTS = 64;

    function boxesHit(r) {
      if (!r || !r.querySelectorAll) return false;
      try {
        const boxes = r.querySelectorAll('input[type="checkbox"]');
        for (let i = 0; i < boxes.length; i++) {
          const el = boxes[i];
          if (el && el.checked && String(el.value || '').trim() === OPT) return true;
        }
      } catch (_e) {
        /* ignore */
      }
      return false;
    }

    function scan(r, depth) {
      if (!r || depth > MAX_DEPTH) return false;
      if (boxesHit(r)) return true;
      if (depth >= MAX_DEPTH) return false;
      try {
        const all = r.querySelectorAll('*');
        const lim = Math.min(all.length, MAX_HOSTS);
        for (let j = 0; j < lim; j++) {
          const n = all[j];
          if (n.shadowRoot && scan(n.shadowRoot, depth + 1)) return true;
        }
      } catch (_e2) {
        /* ignore */
      }
      return false;
    }

    try {
      return scan(root, 0);
    } catch (_e3) {
      return false;
    }
  }

  /** `record.get()`・**ミラー**・必要時のみ **上限付き DOM**（`setTimeout` 内の同期コストを抑える） */
  function readNplTransferManualCheckedLive674(rec) {
    if (readNplTransferManualChecked674(rec)) return true;
    if (npl674TransferManualMirror674 === true) return true;
    return readNplTransferManualCheckedFromDomQuick674();
  }

  /**
   * 転用廃棄ウィザード用: API 1 ページ分を候補形へ（`excludeId` は転用先自身を除く）。
   * @returns {Array<{id:string,pc_name:string,user_name:string,mail:string,emp_id:string}>}
   */
  function mapRecordsToTransferDisposeCandidates674(resp, excludeId) {
    const ex = excludeId != null && String(excludeId).trim() !== '' ? String(excludeId).trim() : '';
    const out = [];
    for (const row of resp.records || []) {
      const idStr = row.$id != null && row.$id.value != null ? String(row.$id.value) : '';
      if (!idStr || (ex && idStr === ex)) continue;
      out.push({
        id: idStr,
        pc_name: String((row[FC_PC_NAME] && row[FC_PC_NAME].value) || '').trim(),
        user_name: String((row[FC_USER_NAME] && row[FC_USER_NAME].value) || '').trim(),
        mail: String((row[FC_MAIL] && row[FC_MAIL].value) || '').trim(),
        emp_id: String((row[FC_EMP_ID] && row[FC_EMP_ID].value) || '').trim(),
      });
    }
    return out;
  }

  /**
   * 同一利用者の個人PC（廃棄以外）。転用先の **現在編集中レコード** を除く。
   * 1) `user_name` 完全一致。0 件かつ転用先に **`emp_id` 非空**なら 2) **`emp_id` 一致**で再検索（595 入力支援後の表記ゆれ対策）。
   * @returns {Promise<Array<{id:string,pc_name:string,user_name:string,mail:string,emp_id:string}>>}
   */
  function fetchTransferDisposeCandidates674(userNameRaw, excludeId, empIdRaw) {
    const u = String(userNameRaw || '').trim();
    if (!u) return Promise.resolve([]);
    const esc = escapeQueryValue(u);
    const ex = excludeId != null && String(excludeId).trim() !== '' ? String(excludeId).trim() : '';
    const emp = String(empIdRaw || '').trim();
    const base =
      'account_type in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '") and pc_status not in ("廃棄")';
    const qUser =
      base + ' and user_name = "' + esc + '" order by $id desc limit 20';
    const fields = ['$id', FC_PC_NAME, FC_USER_NAME, FC_MAIL, FC_EMP_ID];
    return kintoneApiGet('/k/v1/records.json', {
      app: kintone.app.getId(),
      query: qUser,
      fields: fields,
    }).then(function (resp) {
      const out = mapRecordsToTransferDisposeCandidates674(resp, ex);
      if (out.length || !emp) return out;
      const qEmp = base + ' and emp_id = "' + escapeQueryValue(emp) + '" order by $id desc limit 20';
      return kintoneApiGet('/k/v1/records.json', {
        app: kintone.app.getId(),
        query: qEmp,
        fields: fields,
      }).then(function (resp2) {
        return mapRecordsToTransferDisposeCandidates674(resp2, ex);
      });
    });
  }

  function jstampTransferDisposeNote674() {
    try {
      const d = new Date();
      const p = function (n) {
        return String(n).padStart(2, '0');
      };
      return (
        d.getFullYear() +
        '-' +
        p(d.getMonth() + 1) +
        '-' +
        p(d.getDate()) +
        'T' +
        p(d.getHours()) +
        ':' +
        p(d.getMinutes())
      );
    } catch (_e) {
      return String(Date.now());
    }
  }

  function runTransferDisposePut674(targetId, operatorRecordId) {
    const tid = String(targetId || '').trim();
    const opId = String(operatorRecordId || '').trim();
    if (!tid) return Promise.reject(new Error('廃棄対象のレコード番号がありません。'));
    const maxAttempts = 3;

    function attemptDisposal674(attemptNum) {
      return get674RecordPayloadById674(tid).then(function (payload) {
        const rev = payload.revision;
        const tr = payload.record || {};
        if (!rev) throw new Error('廃棄対象の revision を取得できませんでした。');
        const mail = String((tr[FC_MAIL] && tr[FC_MAIL].value) || '').trim();
        const empId = String((tr[FC_EMP_ID] && tr[FC_EMP_ID].value) || '').trim();
        const prevNote = String((tr[FC_NOTE] && tr[FC_NOTE].value) || '').trim();
        const stamp =
          '[転用廃棄 ' +
          jstampTransferDisposeNote674() +
          '] 操作元674レコード番号 ' +
          (opId || '（未保存）') +
          ' により本PCを廃棄扱いに変更';
        const nextNote = prevNote ? prevNote + '\n' + stamp : stamp;
        return kintoneApiPut('/k/v1/record.json', {
          app: kintone.app.getId(),
          id: tid,
          revision: rev,
          record: {
            [FC_PC_STATUS]: { value: STATUS_AFTER_REPLACE_OLD_674 },
            [FC_NOTE]: { value: nextNote },
          },
        })
          .catch(function (e) {
            if (attemptNum < maxAttempts && is674KintoneRevisionConflictError674(e)) {
              console.warn(
                '[NEW-PC-LEDGER-V1] 廃棄対象674 PUT revision 競合、再試行 ' +
                  String(attemptNum + 1) +
                  '/' +
                  String(maxAttempts),
                e && (e.message || e.code),
              );
              return attemptDisposal674(attemptNum + 1);
            }
            throw e;
          })
          .then(function () {
            return remove674From595Matches674(mail, empId, tid).catch(function (eRm) {
              console.warn('[NEW-PC-LEDGER-V1] 595 リンク解除（転用廃棄・続行）', eRm);
            });
          });
      });
    }
    return attemptDisposal674(1);
  }

  /**
   * `npl_disposed_pc_copy` 自動転記用の要約。**旧 PC 名のみ**（運用上レコード番号の括弧は付けない）。PC 名が取れないときだけ `674#<旧$id>` にフォールバック。
   * @param {{ id?: string, pc_name?: string }} chosen 廃棄した旧レコード
   * @returns {string} 空のときは ''（`id` も `pc_name` も欠落時）
   */
  function formatNplDisposedPcSummary674(chosen) {
    const idPart = String((chosen && chosen.id) || '').trim();
    const namePart = String((chosen && chosen.pc_name) || '').trim();
    if (namePart) return namePart;
    if (idPart) return '674#' + idPart;
    return '';
  }

  /** PUT 応答の revision を編集フォームの **`$revision.value` 型**（number / string）に合わせる */
  function assign674FormRevisionFromServer674(rec, revStr) {
    const s = String(revStr || '').trim();
    if (!s || !rec || !rec.$revision || rec.$revision.value == null) return;
    const prev = rec.$revision.value;
    if (typeof prev === 'number') {
      const n = parseInt(s, 10);
      rec.$revision.value = Number.isNaN(n) ? s : n;
    } else {
      rec.$revision.value = s;
    }
  }

  /**
   * 転用廃棄で REST 済みの `npl_disposed_pc_copy` を編集画面へ反映し、**`$revision` をサーバ最新**に合わせる。
   * **PUT 直後の `revision`（`putRevisionOpt`）を優先**し、GET とのズレによる保存時 GAIA_UN03 を避ける。
   * 全ページ `location.reload()` は **未保存の編集があるとブラウザの再読み込み確認**が出るため避ける。
   * @param {string|undefined} putRevisionOpt `kintoneApiPut` 応答の `revision`（文字列化済みでなくてよい）
   * @returns {Promise<boolean>} 同期できたら true（呼び出し側で `location.reload` のフォールバック可）
   */
  function trySoftRefresh674EditAfterNplDisposedCopy674(rid, chosen, putRevisionOpt) {
    const summary = formatNplDisposedPcSummary674(chosen);
    if (!summary) return Promise.resolve(false);

    function apply674SoftSync674(rev) {
      const bag = getRecordFormHolder674();
      if (!bag || !bag.api || !bag.holder || !bag.holder.record) return false;
      const rec = bag.holder.record;
      const curId = String((rec.$id && rec.$id.value) || '').trim();
      if (curId !== String(rid || '').trim()) return false;
      const revStr = String(rev || '').trim();
      if (rec[FC_NPL_DISPOSED_PC_COPY]) {
        rec[FC_NPL_DISPOSED_PC_COPY].value = summary;
      }
      if (revStr) {
        assign674FormRevisionFromServer674(rec, revStr);
      }
      if (!rec[FC_NPL_DISPOSED_PC_COPY] && !revStr) {
        return false;
      }
      if (!rec[FC_NPL_DISPOSED_PC_COPY] && !(revStr && rec.$revision && rec.$revision.value != null)) {
        return false;
      }
      try {
        bag.api.set(bag.holder);
        return true;
      } catch (e) {
        console.warn('[NEW-PC-LEDGER-V1] 転用廃棄後の編集同期（record.set）に失敗', e);
        return false;
      }
    }

    const pr = String(putRevisionOpt != null ? putRevisionOpt : '').trim();
    if (pr) {
      return Promise.resolve(apply674SoftSync674(pr));
    }
    return get674RecordPayloadById674(rid).then(function (payload) {
      return apply674SoftSync674(payload.revision);
    });
  }

  /**
   * 転用操作元レコードへ、廃棄した旧 PC の要約を `npl_disposed_pc_copy` に書き込む。
   * **REST のみ**で行う（`getFieldElement` が null でも **レイアウトに無いフィールドは GET に含まれる**ため、DOM ゲートは付けない）。
   * §4.10.6: **手入力が空でないときは手入力を正**—自動転記は行わず `{ skippedDueToManual674: true }` を返す。
   * @param {string} operatorRecordId 転用先（操作中）674 の $id
   * @param {{ id: string, pc_name: string }} chosen 廃棄した旧レコード
   * @returns {Promise<{ skippedDueToManual674?: boolean, noFieldInApp674?: boolean, putRevision?: string }|void>}
   */
  function updateOperatorNplDisposedPcCopy674(operatorRecordId, chosen) {
    const oid = String(operatorRecordId || '').trim();
    if (!oid || !chosen) return Promise.resolve();
    const summary = formatNplDisposedPcSummary674(chosen);
    if (!summary) return Promise.resolve();
    const maxAttempts = 3;

    function attemptOperatorNplCopy674(attemptNum) {
      return get674RecordPayloadById674(oid).then(function (payload) {
        const rev = payload.revision;
        if (!rev) throw new Error('転用先レコードの revision を取得できませんでした。');
        const tr = payload.record || {};
        const ex = tr[FC_NPL_DISPOSED_PC_COPY];
        if (!ex || typeof ex !== 'object') {
          console.warn(
            '[NEW-PC-LEDGER-V1] GET に ' +
              FC_NPL_DISPOSED_PC_COPY +
              ' が無い（アプリ未追加の可能性）。REST 転記をスキップ',
          );
          return { noFieldInApp674: true };
        }
        const existingVal = ex.value != null ? String(ex.value).trim() : '';
        if (existingVal) {
          console.info(
            '[NEW-PC-LEDGER-V1] npl_disposed_pc_copy 手入力優先のため自動転記スキップ（先頭: ' +
              existingVal.slice(0, 72) +
              '）',
          );
          return { skippedDueToManual674: true };
        }
        return kintoneApiPut('/k/v1/record.json', {
          app: kintone.app.getId(),
          id: oid,
          revision: rev,
          record: {
            [FC_NPL_DISPOSED_PC_COPY]: { value: summary },
          },
        })
          .catch(function (e) {
            if (attemptNum < maxAttempts && is674KintoneRevisionConflictError674(e)) {
              console.warn(
                '[NEW-PC-LEDGER-V1] npl_disposed_pc_copy PUT revision 競合、再試行 ' +
                  String(attemptNum + 1) +
                  '/' +
                  String(maxAttempts),
                e && (e.message || e.code),
              );
              return attemptOperatorNplCopy674(attemptNum + 1);
            }
            throw e;
          })
          .then(function (putRes) {
            const pr = putRes && putRes.revision != null ? String(putRes.revision).trim() : '';
            return { skippedDueToManual674: false, putRevision: pr };
          });
      });
    }
    return attemptOperatorNplCopy674(1);
  }

  function openTransferDisposeWizard674() {
    const rid = getCurrent674RecordId674();
    if (!rid) {
      window.alert('転用の元PC廃棄は、保存済みのレコード（編集画面）でのみ実行できます。先に保存してください。');
      return;
    }
    let rec = get674EditRecordOrNull674();
    if (!rec) {
      window.alert('フォームの取得に失敗しました。画面を再読み込みしてください。');
      return;
    }
    if (!readNplTransferManualCheckedLive674(rec)) {
      const ok = window.confirm(
        '「転用」にチェックが入っていません。**転用として扱い、廃棄候補を検索**しますか？\n\n' +
          '「OK」でチェックを付けて続行します（内容は保存で確定）。「キャンセル」で中止します。',
      );
      if (!ok) return;
      const bag = getRecordFormHolder674();
      if (!bag || !bag.api || !bag.holder || !bag.holder.record) {
        window.alert('フォームの取得に失敗しました。手で「転用」にチェックしてから再度お試しください。');
        return;
      }
      rec = bag.holder.record;
      if (!rec[FC_NPL_TRANSFER_MANUAL]) {
        window.alert('この画面に転用フィールド（npl_transfer_manual）がありません。アプリ設定を確認してください。');
        return;
      }
      try {
        rec[FC_NPL_TRANSFER_MANUAL].value = [FC_NPL_TRANSFER_MANUAL_OPT];
        npl674TransferManualMirror674 = true;
        npl674PrevTransferManualChecked674 = true;
        bag.api.set(bag.holder);
      } catch (eSet) {
        window.alert(
          '転用チェックの自動設定に失敗しました。手で「転用」にチェックしてください。\n' +
            (eSet && eSet.message ? eSet.message : String(eSet)),
        );
        return;
      }
    }
    const un = (readUserNameLiveValue674(rec) || trimmedScalarLive674(rec, FC_USER_NAME) || '').trim();
    if (!un) {
      window.alert('利用者名が空です。転用先の氏名を入力してから実行してください。');
      return;
    }
    const empForCand = (trimmedScalarLive674(rec, FC_EMP_ID) || trimmedScalarValue674(rec, FC_EMP_ID) || '').trim();
    fetchTransferDisposeCandidates674(un, rid, empForCand).then(function (cands) {
      if (!cands.length) {
        window.alert(
          '廃棄候補の個人PCレコードが見つかりません（個人・廃棄以外・このレコード以外）。\n' +
            'まず **利用者名の完全一致**で探し、0 件のときは **社員番号（emp_id）の一致**でも探します。\n' +
            '旧 PC 側の利用者名・社員番号を転用先と揃えるか、595 の入力支援で旧レコードにも同じ氏名・番号を入れて保存してから再度お試しください。',
        );
        return;
      }
      let chosen = cands.length === 1 ? cands[0] : null;
      if (cands.length >= 2) {
        const lines = cands
          .map(function (c, i) {
            return String(i + 1) + '. レコード ' + c.id + '／PC名「' + c.pc_name + '」';
          })
          .join('\n');
        const ans = window.prompt(
          '廃棄にする **1台** を選んでください。番号を入力（1〜' +
            cands.length +
            '）。キャンセルは空欄で閉じる。\n\n' +
            lines,
        );
        const n = parseInt(String(ans || '').trim(), 10);
        if (!ans || !ans.trim() || Number.isNaN(n) || n < 1 || n > cands.length) {
          window.alert('キャンセルしました。');
          return;
        }
        chosen = cands[n - 1];
      }
      if (!chosen) return;
      const ok = window.confirm(
        '次のレコードを **廃棄** にします。よろしいですか？\n\n' +
          'レコード番号 ' +
          chosen.id +
          '\nPC名「' +
          chosen.pc_name +
          '」\n利用者名「' +
          chosen.user_name +
          '」',
      );
      if (!ok) return;
      return runTransferDisposePut674(chosen.id, rid).then(
        function () {
          return updateOperatorNplDisposedPcCopy674(rid, chosen).then(
            function (copyRes) {
              const skipped = !!(copyRes && copyRes.skippedDueToManual674);
              const noField = !!(copyRes && copyRes.noFieldInApp674);
              let msg;
              if (noField) {
                msg =
                  '廃棄へ更新しました（レコード番号 ' +
                  chosen.id +
                  '）。ただし **アプリに「転用で廃棄したPC」フィールド（' +
                  FC_NPL_DISPOSED_PC_COPY +
                  '）が無い**ため自動転記できませんでした。\n' +
                  '`npm run pc-ledger:674:add-npl-disposed-pc-field-preview` 等でフィールド追加後、手入力するかウィザードを再実行してください。一覧を確認してください。';
              } else if (skipped) {
                msg =
                  '廃棄へ更新しました（レコード番号 ' +
                  chosen.id +
                  '）。転用先の「転用で廃棄したPC」は既に手入力があるため自動転記しませんでした（手入力を正）。一覧を確認してください。';
              } else {
                msg =
                  '廃棄へ更新しました（レコード番号 ' +
                  chosen.id +
                  '）。転用先レコードに廃棄したPCを転記しました。一覧を確認してください。';
              }
              window.alert(msg);
              if (skipped || noField) return undefined;
              return trySoftRefresh674EditAfterNplDisposedCopy674(rid, chosen, copyRes && copyRes.putRevision).then(
                function (synced) {
                  if (!synced) {
                    try {
                      location.reload();
                    } catch (_e2) {
                      /* noop */
                    }
                  }
                },
              );
            },
            function (eCopy) {
              console.warn('[NEW-PC-LEDGER-V1] 転用先への廃棄PC転記', eCopy);
              window.alert(
                '旧レコードは廃棄へ更新しましたが、転用先レコードの「転用で廃棄したPC」への自動転記に失敗しました。\n手で「' +
                  FC_NPL_DISPOSED_PC_COPY +
                  '」に次を入力してください: ' +
                  formatNplDisposedPcSummary674(chosen) +
                  '\n\n' +
                  (eCopy && eCopy.message ? eCopy.message : String(eCopy)),
              );
            },
          );
        },
        function (e) {
          console.error('[NEW-PC-LEDGER-V1] 転用廃棄', e);
          window.alert('更新に失敗しました。\n' + (e && e.message ? e.message : String(e)));
        },
      );
    });
  }

  function createTransferDisposeHeaderButton674() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '転用: 元PCを廃棄…';
    btn.setAttribute('aria-label', '転用に伴い同一利用者名の別PCレコードを廃棄する');
    btn.style.cssText =
      'margin:4px 8px 4px 0;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;border-radius:6px;' +
      'border:1px solid #9a3412;background:linear-gradient(165deg,#fb923c 0%,#ea580c 55%,#c2410c 100%);color:#fff;' +
      'box-shadow:0 2px 8px rgba(234,88,12,.35);letter-spacing:.02em;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setTimeout(function () {
        openTransferDisposeWizard674();
      }, 0);
    });
    return btn;
  }

  function getOneRecordApp674(app, query, fields) {
    return kintoneApiGet('/k/v1/records.json', { app: app, query: query, fields: fields }).then(function (r) {
      return r.records && r.records.length ? r.records[0] : null;
    });
  }

  function peek596HasUnused674() {
    const q = FC_596_IN_USE + ' not in ("' + USED_MARK_596 + '") order by $id asc limit 1';
    return getOneRecordApp674(APP_PC_NUMBER_596, q, ['$id', FC_596_PREFIX, FC_596_IN_USE]).then(function (rec) {
      return !!(rec && (rec[FC_596_PREFIX] && String(rec[FC_596_PREFIX].value || '').trim()));
    });
  }

  /**
   * 買替用: 596 を占有し PC 名用文字列を返す。POST 失敗時のみ rollback596 を呼ぶ。
   * @returns {Promise<{ newPcName: string, rollback596: () => Promise<void> } | null>}
   */
  function claimPcNumberFrom596ForReplacementApi674() {
    const q = FC_596_IN_USE + ' not in ("' + USED_MARK_596 + '") order by $id asc limit 1';
    return getOneRecordApp674(APP_PC_NUMBER_596, q, ['$id', '$revision', FC_596_PREFIX, FC_596_IN_USE]).then(function (
      rec,
    ) {
      if (!rec) return null;
      const prefix = (rec[FC_596_PREFIX] && String(rec[FC_596_PREFIX].value || '').trim()) || '';
      if (!prefix) throw new Error('596マスタに採番プレフィックス(number_top)がありません。');

      return kintoneApiPut('/k/v1/record.json', {
        app: APP_PC_NUMBER_596,
        id: rec.$id.value,
        revision: rec.$revision.value,
        record: {
          [FC_596_IN_USE]: { value: USED_MARK_596 },
        },
      }).then(function (putRes) {
        const id596 = rec.$id.value;
        const revAfter = putRes.revision;
        const newPcName = prefix + '-' + yyyymmTokyo674();

        const rollback596 = function () {
          return kintoneApiPut('/k/v1/record.json', {
            app: APP_PC_NUMBER_596,
            id: id596,
            revision: revAfter,
            record: {
              [FC_596_IN_USE]: { value: '' },
            },
          }).catch(function (e) {
            console.error('[NEW-PC-LEDGER-V1] 596 rollback failed (replacement)', e);
          });
        };

        return { newPcName: newPcName, rollback596: rollback596 };
      });
    });
  }

  function emptyValueForFieldType674(t) {
    if (t === 'CHECK_BOX' || t === 'MULTI_SELECT') return [];
    if (t === 'USER_SELECT' || t === 'ORGANIZATION_SELECT' || t === 'GROUP_SELECT') return [];
    if (t === 'SUBTABLE') return [];
    if (t === 'NUMBER') return '';
    return '';
  }

  const SKIP_CLONE_FIELD_TYPES_674 = new Set(['CALC', 'FILE']);

  /**
   * API 取得レコードをベースに POST 用レコードを組み立てる（資産・SKYSEA 系はクリア、アカウントは継承）。
   * @param {string} [old674RecordId] 買替元 674 の $id（import_source 追跡用）
   */
  function build674ReplacementPostRecord674(srcRecord, newPcName, old674RecordId) {
    const out = {};
    for (const code of Object.keys(srcRecord || {})) {
      const cell = srcRecord[code];
      if (!cell || typeof cell !== 'object') continue;
      if (code.startsWith('$')) continue;
      if (SKIP_CLONE_FIELD_TYPES_674.has(cell.type)) continue;
      if (cell.type === 'SUBTABLE') {
        out[code] = { type: 'SUBTABLE', value: [] };
        continue;
      }
      out[code] = JSON.parse(JSON.stringify(cell));
    }

    for (let i = 0; i < REPLACEMENT_CLEAR_FIELD_CODES_674.length; i++) {
      const code = REPLACEMENT_CLEAR_FIELD_CODES_674[i];
      if (!out[code]) continue;
      out[code].value = emptyValueForFieldType674(out[code].type);
    }

    if (out[FC_PC_NAME]) {
      out[FC_PC_NAME].value = newPcName;
    } else {
      out[FC_PC_NAME] = { type: 'SINGLE_LINE_TEXT', value: newPcName };
    }
    if (out[FC_PC_STATUS]) {
      out[FC_PC_STATUS].value = STATUS_FOR_NEW_AFTER_REPLACE_674;
    } else {
      out[FC_PC_STATUS] = { type: 'DROP_DOWN', value: STATUS_FOR_NEW_AFTER_REPLACE_674 };
    }

    const oid = String(old674RecordId || '').trim();
    const tag = oid ? 'PC_REPLACE_FROM_674:' + oid : 'PC_REPLACE_FROM_674';
    if (out[FC_IMPORT_SOURCE]) {
      out[FC_IMPORT_SOURCE].value = tag;
    } else {
      out[FC_IMPORT_SOURCE] = { type: 'SINGLE_LINE_TEXT', value: tag };
    }

    return out;
  }

  function show674ReplacementFollowupBanner674() {
    const msg =
      '【PC買替の続き】シリアル・メーカー・モデル・購入日・在庫日・備考・SKYSEA 関連など、ハード側の項目は必ず入力してください。';
    const inject = function () {
      if (document.getElementById('jbis674-replace-banner')) return true;
      const host = getHeaderSpace674() || document.querySelector('.gaia-argoui-app-toolbar') || document.body;
      if (!host) return false;
      const el = document.createElement('div');
      el.id = 'jbis674-replace-banner';
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
    setTimeout(function () {
      try {
        window.alert(msg);
      } catch (_a) {
        /* noop */
      }
    }, 400);
  }

  function maybeShow674ReplacementNoticeFromStorage674() {
    try {
      if (sessionStorage.getItem(STORAGE_KEY_674_REPLACE_NOTICE) === '1') {
        sessionStorage.removeItem(STORAGE_KEY_674_REPLACE_NOTICE);
        show674ReplacementFollowupBanner674();
      }
    } catch (_e) {
      /* noop */
    }
  }

  /**
   * 共有/JR で同一 M365 行に新旧が一瞬二重計上されないよう、先に旧を廃棄してから新規 POST し、671 を再同期する。
   */
  function runPcReplacementFlow674() {
    const oldId = getCurrent674RecordId674();
    if (!oldId) {
      window.alert('PC買替は、保存済みのレコード（詳細／編集を開いた状態）でのみ使用できます。');
      return Promise.resolve();
    }
    const ok = window.confirm(
      'PC買替を実行しますか？\n\n' +
        '・現在のレコードは「' +
        STATUS_AFTER_REPLACE_OLD_674 +
        '」になります。\n' +
        '・アカウント情報を引き継いだ新しいレコードが追加され、596 で新しい PC 名が採番されます。\n' +
        '（処理後は新レコードの画面へ移動します）',
    );
    if (!ok) return Promise.resolve();

    let claim = null;
    /** POST 成功後にセット。以降の 671/595 で失敗した場合は 596 ロールバックや旧ステータス復元はしない */
    let createdNewId = '';

    return peek596HasUnused674()
      .then(function (has596) {
        if (!has596) {
          window.alert(
            'PC採番マスタ(596)に未使用の番号がありません。処理を中止しました（596・674は未変更です）。',
          );
          return null;
        }
        return get674RecordPayloadById674(oldId);
      })
      .then(function (payload0) {
        if (!payload0) return null;
        const src0 = payload0.record;
        const st0 = (src0[FC_PC_STATUS] && src0[FC_PC_STATUS].value) || '';
        if (shouldBeDisposedStatus674(st0)) {
          window.alert('このレコードはすでに廃棄等の状態です。PC買替は実行できません。');
          return null;
        }
        return claimPcNumberFrom596ForReplacementApi674().then(function (c) {
          if (!c) {
            window.alert(
              'PC採番マスタ(596)に未使用の番号がありません。処理を中止しました（596・674は未変更です）。',
            );
            return null;
          }
          claim = c;
          return { src0: src0, newPcName: c.newPcName };
        });
      })
      .then(function (ctx) {
        if (!ctx || !claim) return null;
        const postBody = build674ReplacementPostRecord674(ctx.src0, ctx.newPcName, oldId);
        const prevStatus = (ctx.src0[FC_PC_STATUS] && String(ctx.src0[FC_PC_STATUS].value || '').trim()) || '';
        const mid = String((ctx.src0[FC_M365_MASTER_RECORD_ID] && ctx.src0[FC_M365_MASTER_RECORD_ID].value) || '').trim();
        const acType = (ctx.src0[FC_ACCOUNT_TYPE] && ctx.src0[FC_ACCOUNT_TYPE].value) || '';
        const mail = (ctx.src0[FC_MAIL] && String(ctx.src0[FC_MAIL].value || '').trim()) || '';
        const empId = (ctx.src0[FC_EMP_ID] && String(ctx.src0[FC_EMP_ID].value || '').trim()) || '';

        return get674RecordPayloadById674(oldId)
          .then(function (freshOld) {
            if (!freshOld.revision) {
              throw new Error('旧レコードのリビジョンを取得できませんでした。');
            }
            return kintoneApiPut('/k/v1/record.json', {
              app: kintone.app.getId(),
              id: oldId,
              revision: freshOld.revision,
              record: {
                [FC_PC_STATUS]: { value: STATUS_AFTER_REPLACE_OLD_674 },
              },
            }).then(function () {
              return kintoneApiPost('/k/v1/record.json', {
                app: kintone.app.getId(),
                record: postBody,
              });
            });
          })
          .then(function (created) {
            const newId = created && created.id != null ? String(created.id) : '';
            if (!newId) throw new Error('新規レコードの id を取得できませんでした。');
            createdNewId = newId;

            let chain = Promise.resolve();
            if (mid && (acType === TYPE_SHARED || acType === TYPE_JR)) {
              chain = chain.then(function () {
                return sync671MasterFrom674674(mid);
              });
            }

            if (acType === TYPE_PERSONAL) {
              chain = chain.then(function () {
                return remove674From595Matches674(mail, empId, oldId).then(function () {
                  return resolve595RowsForLink674(mail, empId).then(function (rows595) {
                    if (!rows595.length) {
                      console.warn(
                        '[NEW-PC-LEDGER-V1] PC買替: 595 未ヒットのためサブテーブル追記をスキップ mail=' +
                          mail +
                          ' emp_id=' +
                          empId,
                      );
                      return;
                    }
                    const id595 = String(rows595[0].$id && rows595[0].$id.value ? rows595[0].$id.value : '').trim();
                    if (!id595) return;
                    return merge674Into595Subtable674(id595, newId, TYPE_PERSONAL);
                  });
                });
              });
            }

            return chain.then(function () {
              try {
                sessionStorage.setItem(STORAGE_KEY_674_REPLACE_NOTICE, '1');
              } catch (_s) {
                /* noop */
              }
              window.alert(
                'PC買替が完了しました。続いてハード／SKYSEA 関連の項目を入力してください。\n\n新しいレコードの画面へ移ります。',
              );
              location.href =
                location.origin +
                '/k/' +
                encodeURIComponent(String(kintone.app.getId())) +
                '/show?record=' +
                encodeURIComponent(newId);
            });
          })
          .catch(function (ePost) {
            const roll596 =
              !createdNewId && claim
                ? claim.rollback596().catch(function (_r) {
                    /* noop */
                  })
                : Promise.resolve();
            return roll596
              .then(function () {
                if (!createdNewId && prevStatus) {
                  return get674RecordPayloadById674(oldId).then(function (rBack) {
                    if (!rBack.revision) return;
                    return kintoneApiPut('/k/v1/record.json', {
                      app: kintone.app.getId(),
                      id: oldId,
                      revision: rBack.revision,
                      record: {
                        [FC_PC_STATUS]: { value: prevStatus },
                      },
                    }).catch(function (e2) {
                      console.error('[NEW-PC-LEDGER-V1] PC買替 rollback 旧ステータス失敗', e2);
                    });
                  });
                }
                if (createdNewId) {
                  console.error(
                    '[NEW-PC-LEDGER-V1] PC買替: 新規674は作成済みだが後続処理に失敗 id=' + createdNewId,
                    ePost,
                  );
                }
              })
              .then(function () {
                throw ePost;
              });
          });
      })
      .catch(function (e) {
        console.error('[NEW-PC-LEDGER-V1] PC買替', e);
        if (createdNewId) {
          window.alert(
            '新しい674レコード（レコード番号 ' +
              createdNewId +
              '）は作成済みですが、その後の処理でエラーが発生しました。\n' +
              (e && e.message ? e.message : String(e)) +
              '\n\n671（M365管理）や595（社員マスタ）を確認してください。',
          );
          return;
        }
        window.alert('PC買替に失敗しました。\n' + (e && e.message ? e.message : String(e)));
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
          maybeAlertTransferDisposedEmptyAfterSave674(event);
          resolve(event);
        });
    });
  }

  // ===== 印刷（627 移植・§4.9）=====
  const JBIS674_PRINT_LAYOUT = [
    [
      { label: '部署名', code: 'dept_name' },
      { label: '利用者名', code: 'user_name' },
      { label: 'PC名', code: 'pc_name' },
    ],
    [
      { label: 'メールアドレス', code: 'mail' },
      { label: 'メールアカウント', code: 'mail_acct' },
      { label: 'メールパスワード', code: 'mail_pw' },
    ],
    [
      { label: 'WindowsID', code: 'logon_name' },
      { label: 'Windowsパスワード', code: 'logon_pw' },
    ],
    [
      { label: 'サイボウズID', code: 'sb_id' },
      { label: 'サイボウズパスワード', code: 'sb_pw' },
    ],
    [
      { label: 'ガリバーID', code: 'gb_id' },
      { label: 'ガリバーパスワード', code: 'gb_pw' },
    ],
    [
      { label: 'M365ID', code: 'm365_id' },
      { label: 'M365パスワード', code: 'm365_pw' },
    ],
    [
      { label: 'VPN ID(KDDI)', code: 'vpn_id' },
      { label: 'VPNパスワード', code: 'vpn_pw' },
    ],
  ];

  const esc674PrintHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const get674PrintFieldValue = (rec, code) => {
    if (!rec) return '';
    if (code === '$id') return String(rec.$id?.value ?? '');
    const fld = rec[code];
    if (fld?.value == null) return '';
    const v = fld.value;
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.join(', ');
      if (v.name != null) return String(v.name);
      return '';
    }
    return String(v);
  };

  const get674PrintCellValue = (rec, cell) =>
    cell ? get674PrintFieldValue(rec, cell.code) : '';

  /**
   * セル値が「実質空」かどうか（空文字 / 空白だけ / ハイフン系記号だけ）。
   * 過去運用で「未使用」を表す `----` `---` `--` `ー` `—` `－` 等が手入力されているため、
   * これらを空欄と同等に扱う（C-4: 印刷帳票のみの判定。データには影響なし）。
   * ハイフン系: ASCII `-` (U+002D), Hyphen `‐` (U+2010), En dash `–` (U+2013),
   *            Em dash `—` (U+2014), Horizontal bar `―` (U+2015),
   *            Katakana long sound `ー` (U+30FC), Halfwidth `ｰ` (U+FF70),
   *            Full-width hyphen-minus `－` (U+FF0D)
   */
  const isPrint674CellEmpty = (raw) =>
    /^[\s\u002D\u2010\u2013\u2014\u2015\u30FC\uFF70\uFF0D]*$/u.test(String(raw ?? ''));

  /**
   * 1段ぶんの HTML（横並びグリッドセル）。tierIndex 0 は部署・氏名・PC を強調表示。
   * tierIndex >= 1 で全セルが「実質空」なら段ごと省略する（C-4: 共有/個人で不要セクションを抑制）。
   */
  const build674PrintTierHtml = (rec, tierCells, tierIndex) => {
    const isLead = tierIndex === 0;
    if (!isLead) {
      const allEmpty = tierCells.every(
        (cell) => isPrint674CellEmpty(get674PrintCellValue(rec, cell))
      );
      if (allEmpty) return '';
    }
    let tierClass = 'jbis674-tier';
    if (isLead) tierClass += ' jbis674-tier--lead';
    const ncol = tierCells.length;
    if (ncol === 3) {
      tierClass += ' jbis674-tier--cols3';
    } else if (ncol === 2) {
      tierClass += ' jbis674-tier--cols2';
      if (tierCells[0]?.code === 'm365_id') tierClass += ' jbis674-tier--m365';
    }
    const cellsHtml = tierCells.map((cell) => {
      const raw = get674PrintCellValue(rec, cell);
      const isEmpty = isPrint674CellEmpty(raw);
      const val = isEmpty ? '---' : raw.trim();
      const dimStyle = isEmpty ? ' style="color:#94a3b8;font-style:italic"' : '';
      return `<div class="jbis674-cell">\
<div class="jbis674-lab">${esc674PrintHtml(cell.label)}</div>\
<div class="jbis674-val"${dimStyle}>${esc674PrintHtml(val)}</div></div>`;
    }).join('');
    return `<div class="${tierClass}">${cellsHtml}</div>`;
  };

  /**
   * 別ウィンドウに表を出し、ブラウザの印刷ダイアログを開く（パスワード行を含むので取り扱い注意）。
   * head/body を document 直下に append だけすると環境によって白画面になるため document.write で組み立てる。
   */
  const open674SystemInfoPrintWindow = (rec) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('別ウィンドウを開けませんでした。ポップアップブロックを解除してください。');
      return;
    }
    w.opener = null;

    const recNo = get674PrintFieldValue(rec, 'レコード番号');
    const bodyInner = JBIS674_PRINT_LAYOUT
      .map((tier, i) => build674PrintTierHtml(rec, tier, i))
      .filter(Boolean)
      .join('');
    const metaLine =
      `${recNo ? `No. ${esc674PrintHtml(recNo)} \u00b7 ` : ''}${esc674PrintHtml(new Date().toLocaleString('ja-JP'))}`;

    // C-4: account_type で印刷テーマと文言を出し分け（既存の 668 ガイド配色と統一）
    const accTypeRaw = String(rec?.[FC_ACCOUNT_TYPE]?.value ?? '').trim();
    const isShared = accTypeRaw === TYPE_SHARED || accTypeRaw === TYPE_JR;
    const theme = isShared
      ? {
          label: accTypeRaw || '共有・JR',
          title: '新・PC台帳ver.1（共有・JR）',
          subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
          notice: '本アカウントは複数メンバーで<b>共有して利用するID/PW</b>です。'
            + 'ID・パスワードを変更した場合は<b>関係者全員に必ず共有</b>してください。'
            + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
          heroBg: '#ffe4e6',
          heroFg: '#881337',
          heroBorder: '#fecdd3',
          heroSub: '#9f1239',
          noticeBorder: '#e11d48',
          noticeBg: '#ffe4e6',
          noticeFg: '#881337',
          badgeBg: '#fff1f2',
          badgeBorder: '#fda4af',
          badgeFg: '#9f1239',
          cardBorder: '#fecdd3',
          bodyBg: '#fff1f2',
          tierLeadBg: '#fff5f7',
          tierLeadBorder: '#ffe4e6',
          tierEvenBg: '#fff8f9',
          shadowColor: 'rgba(159,18,57,.12)',
        }
      : {
          label: accTypeRaw || '個人アカウント',
          title: '新・PC台帳ver.1',
          subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
          notice: 'アカウント情報の管理は個人の責任で行ってください。'
            + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
          heroBg: '#d1fae5',
          heroFg: '#134e4a',
          heroBorder: '#a7f3d0',
          heroSub: '#365f52',
          noticeBorder: '#0d9488',
          noticeBg: '#d1fae5',
          noticeFg: '#134e4a',
          badgeBg: '#ecfdf5',
          badgeBorder: '#86efac',
          badgeFg: '#166534',
          cardBorder: '#bbf7d0',
          bodyBg: '#ecfdf5',
          tierLeadBg: '#f0fdf4',
          tierLeadBorder: '#dcfce7',
          tierEvenBg: '#f7fef9',
          shadowColor: 'rgba(15,118,110,.12)',
        };

    const docHtml = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">\
<meta name="viewport" content="width=device-width,initial-scale=1">\
<title>新・PC台帳・システム情報</title>\
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap">\
<style>\
:root{\
--hero-bg:${theme.heroBg};--hero-fg:${theme.heroFg};--hero-border:${theme.heroBorder};--hero-sub:${theme.heroSub};\
--notice-border:${theme.noticeBorder};--notice-bg:${theme.noticeBg};--notice-fg:${theme.noticeFg};\
--badge-bg:${theme.badgeBg};--badge-border:${theme.badgeBorder};--badge-fg:${theme.badgeFg};\
--card-border:${theme.cardBorder};--body-bg:${theme.bodyBg};\
--tier-lead-bg:${theme.tierLeadBg};--tier-lead-border:${theme.tierLeadBorder};--tier-even-bg:${theme.tierEvenBg};\
--shadow-color:${theme.shadowColor};\
}\
*{box-sizing:border-box;}\
body{margin:0;padding:28px 20px 40px;background:var(--body-bg);\
font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}\
.jbis674-wrap{max-width:880px;margin:0 auto;}\
.jbis674-hero{background:var(--hero-bg);color:var(--hero-fg);padding:26px 28px 22px;border-radius:18px 18px 0 0;\
border:1px solid var(--hero-border);border-bottom:none;\
box-shadow:0 10px 28px var(--shadow-color);position:relative;}\
.jbis674-hero h1{margin:0;font-size:1.35rem;font-weight:700;letter-spacing:.02em;}\
.jbis674-hero p{margin:10px 0 0;font-size:12px;font-weight:500;line-height:1.65;color:var(--hero-sub);}\
.jbis674-badge{display:inline-block;margin-top:12px;padding:4px 12px;border-radius:999px;\
background:var(--badge-bg);font-size:11px;font-weight:700;letter-spacing:.04em;\
border:1px solid var(--badge-border);color:var(--badge-fg);}\
.jbis674-notice{margin:0;padding:14px 18px 16px;border-left:4px solid var(--notice-border);\
background:var(--notice-bg);border-bottom:1px solid var(--hero-border);}\
.jbis674-notice p{margin:0;font-size:12px;font-weight:600;line-height:1.7;color:var(--notice-fg);}\
.jbis674-card{background:#fff;border-radius:0 0 18px 18px;\
box-shadow:0 18px 40px rgba(15,23,42,.08);overflow:hidden;border:1px solid var(--card-border);\
border-top:none;}\
.jbis674-tier{display:grid;gap:0;padding:0;border-bottom:1px solid #e2e8f0;}\
.jbis674-tier--cols1{grid-template-columns:1fr;}\
.jbis674-tier--cols2{grid-template-columns:1fr 1fr;}\
.jbis674-tier--cols3{grid-template-columns:1fr 1fr 1fr;}\
.jbis674-tier--m365{grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);}\
.jbis674-tier--memo .jbis674-cell--memo{min-height:0;padding:18px 20px 22px;border-right:none;}\
.jbis674-lab--memo{text-transform:none;letter-spacing:0.04em;font-size:11px;font-weight:700;\
color:#475569;margin-bottom:8px;line-height:1.35;}\
.jbis674-memo-space{min-height:72px;border:1px dashed #94a3b8;border-radius:6px;background:#f8fafc;\
margin-top:10px;}\
.jbis674-tier:last-child{border-bottom:none;}\
.jbis674-cell{padding:18px 20px 20px;background:#fff;border-right:1px solid #f1f5f9;min-height:92px;}\
.jbis674-cell:last-child{border-right:none;}\
.jbis674-tier:nth-child(even) .jbis674-cell{background:var(--tier-even-bg);}\
.jbis674-tier--lead .jbis674-cell{background:var(--tier-lead-bg);padding:22px 22px 24px;min-height:108px;\
border-right:1px solid var(--tier-lead-border);}\
.jbis674-tier--lead .jbis674-lab{font-size:12px;font-weight:700;color:#475569;letter-spacing:.06em;\
text-transform:none;margin-bottom:10px;}\
.jbis674-tier--lead .jbis674-val{font-size:1.35rem;font-weight:700;line-height:1.45;color:#0f172a;}\
.jbis674-lab{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;\
margin-bottom:8px;line-height:1.3;}\
.jbis674-val{font-size:14px;font-weight:600;line-height:1.55;color:#0f172a;word-break:break-word;\
min-height:1.4em;font-feature-settings:"tnum";}\
.jbis674-foot{margin-top:22px;text-align:center;font-size:11px;color:#64748b;font-weight:500;}\
@media print{\
@page{size:A4 portrait;margin:7mm;}\
body{padding:0;background:var(--body-bg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}\
.jbis674-wrap{max-width:100%;margin:0;}\
.jbis674-hero{padding:12px 16px 10px;border-radius:0;box-shadow:none;border:1px solid var(--hero-border);\
background:var(--hero-bg);color:var(--hero-fg);}\
.jbis674-hero h1{font-size:16pt;line-height:1.2;margin:0;color:var(--hero-fg);}\
.jbis674-hero p{margin:7px 0 0;font-size:9.5pt;line-height:1.45;font-weight:500;color:var(--hero-sub);}\
.jbis674-badge{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;\
background:var(--badge-bg);border:1px solid var(--badge-border);color:var(--badge-fg);\
font-size:9pt;font-weight:700;letter-spacing:.04em;}\
.jbis674-notice{padding:10px 14px 11px;border-left:4px solid var(--notice-border);background:var(--notice-bg);\
border-bottom:1px solid var(--hero-border);}\
.jbis674-notice p{margin:0;font-size:9.5pt;line-height:1.55;font-weight:600;color:var(--notice-fg);}\
.jbis674-card{box-shadow:none;border-radius:0;border:1px solid var(--card-border);border-top:none;}\
.jbis674-tier{break-inside:avoid;page-break-inside:avoid;border-color:#cbd5e1;}\
.jbis674-cell{padding:12px 16px 14px;min-height:0;border-color:#e2e8f0;}\
.jbis674-tier:nth-child(even) .jbis674-cell{background:var(--tier-even-bg) !important;}\
.jbis674-tier--lead .jbis674-cell{background:var(--tier-lead-bg) !important;padding:14px 18px 16px;min-height:0;\
border-right:1px solid var(--tier-lead-border);}\
.jbis674-tier--lead .jbis674-lab{font-size:11pt;margin-bottom:6px;color:#475569;\
text-transform:none;letter-spacing:0.02em;font-weight:700;}\
.jbis674-tier--lead .jbis674-val{font-size:15pt;font-weight:700;line-height:1.35;color:#0f172a;}\
.jbis674-lab{font-size:10pt;margin-bottom:5px;line-height:1.3;color:#475569;\
text-transform:none;letter-spacing:0.02em;font-weight:700;}\
.jbis674-val{font-size:12.5pt;line-height:1.45;font-weight:600;word-break:break-word;\
overflow-wrap:anywhere;}\
.jbis674-foot{margin-top:12px;font-size:9.5pt;line-height:1.35;color:#64748b;}\
.jbis674-tier--memo .jbis674-cell--memo{padding:10px 14px 12px !important;}\
.jbis674-lab--memo{font-size:9pt !important;margin-bottom:4px !important;}\
.jbis674-memo-space{min-height:48px;margin-top:6px;background:#fafafa !important;}\
}\
</style></head><body>\
<div class="jbis674-wrap">\
<header class="jbis674-hero">\
<h1>${esc674PrintHtml(theme.title)}</h1>\
<p>${esc674PrintHtml(theme.subtitle)}</p>\
<span class="jbis674-badge">${esc674PrintHtml(theme.label)}</span>\
</header>\
<aside class="jbis674-notice" role="note">\
<p>${theme.notice}</p>\
</aside>\
<div class="jbis674-card">\
${bodyInner}\
<div class="jbis674-tier jbis674-tier--cols1 jbis674-tier--memo">\
<div class="jbis674-cell jbis674-cell--memo">\
<div class="jbis674-lab jbis674-lab--memo">その他・メモ（手書き用）</div>\
<div class="jbis674-memo-space" aria-hidden="true"></div>\
</div></div>\
</div>\
<p class="jbis674-foot">${metaLine}</p>\
</div></body></html>`;

    const d = w.document;
    d.open();
    d.write(docHtml);
    d.close();
    w.focus();
    setTimeout(() => {
      try { w.print(); } catch (e) { console.warn('[NEW-PC-LEDGER-V1] window.print', e); }
    }, 400);
  };

  /** 編集・詳細では get()、スナップショットの順で印刷用レコードを得る（627 相当） */
  function resolve674PrintRecord() {
    try {
      const holder = kintone.app.record.get();
      if (holder && holder.record) return holder.record;
    } catch (e) {
      /* 詳細画面など */
    }
    try {
      if (typeof kintone.mobile !== 'undefined') {
        const holder = kintone.mobile.app.record.get();
        if (holder && holder.record) return holder.record;
      }
    } catch (e2) {
      /* noop */
    }
    return jb674PrintRecordSnapshot;
  }

  // ===== 自動生成ボタン 雛形 =====

  function createGenerateButton(label, color, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `margin:4px 8px 4px 0;padding:6px 14px;background:${color};color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;`;
    btn.addEventListener('click', function (ev) {
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
      /* record.get() 等の重い同期処理を click 計測から外す */
      setTimeout(function () {
        onClick(ev);
      }, 0);
    });
    return btn;
  }

  const NPL674_INPUT_ASSIST_BTN_LABEL = '入力支援利用';

  /**
   * 入力支援（はい／いいえのあと 595 または 680）。自動生成ボタンと並べて `#new-pc-ledger-buttons` に載せる。
   * @param {string} ariaSuffix aria-label 用（例: 595 社員マスタ / 680 所属候補）
   */
  function createInputAssistHeaderButton674(ariaSuffix, confirmMsg, onYesOpen) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = NPL674_INPUT_ASSIST_BTN_LABEL;
    btn.setAttribute('aria-label', NPL674_INPUT_ASSIST_BTN_LABEL + '（' + ariaSuffix + '）');
    btn.style.cssText =
      'margin:4px 8px 4px 0;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;border-radius:6px;' +
      'border:1px solid #4338ca;background:linear-gradient(165deg,#818cf8 0%,#4f46e5 55%,#4338ca 100%);color:#fff;' +
      'box-shadow:0 2px 8px rgba(67,56,202,.38);letter-spacing:.02em;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setTimeout(function () {
        promise674InputAssistConfirm674(confirmMsg).then(function (yes) {
          if (!yes) return;
          npl674FocusAssistSuppressUntil674 = Date.now() + 400;
          onYesOpen();
        });
      }, 0);
    });
    return btn;
  }

  /** §4.6.6 ツールバー: 共有／JR の M365 入力（手入力・671 既存・新規採番） */
  function createM365InputHeaderButton674() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'M365 入力';
    btn.setAttribute('aria-label', 'M365 入力（共有・JR）');
    btn.style.cssText =
      'margin:4px 8px 4px 0;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;border-radius:6px;' +
      'border:1px solid #6d28d9;background:linear-gradient(165deg,#c084fc 0%,#9333ea 55%,#6d28d9 100%);color:#fff;' +
      'box-shadow:0 2px 8px rgba(109,40,217,.38);letter-spacing:.02em;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setTimeout(function () {
        runM365AssistEntry674('header');
      }, 0);
    });
    return btn;
  }

  function injectButtons(event) {
    jb674PrintRecordSnapshot = event.record;
    const mount = resolveButtonMountSpace674();
    if (!mount || !mount.el) return;

    // 既存ボタンを除去 (再 inject 防止)
    const existing = document.querySelector('#new-pc-ledger-buttons');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'new-pc-ledger-buttons';
    if (mount.mode === 'body') {
      wrapper.style.cssText =
        'display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:0;padding:10px 12px;' +
        'position:fixed;top:0;left:0;right:0;z-index:2000000;background:#f8fafc;border-bottom:1px solid #cbd5e1;' +
        'box-shadow:0 2px 6px rgba(15,23,42,.12);';
    } else if (mount.mode === 'form') {
      wrapper.style.cssText =
        'display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 12px;padding:10px 12px;' +
        'background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 1px 3px rgba(15,23,42,.08);';
    } else {
      wrapper.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;margin:8px 0;';
    }

    const isRecordDetail674 =
      event.type === 'app.record.detail.show' || event.type === 'mobile.app.record.detail.show';

    /** 保管中: 種別横断でヘッダは全フィールドリセットのみ（新規・編集）。閲覧×保管はバー非表示。 */
    const inStorage674 = isPcStatusStorage674(event.record);

    if (!isRecordDetail674) {
      /** 新規 create では event.record の種別が空のまま・DOM だけ先に 個人/共有 等のことがある */
      const type = readAccountTypeLive674(event.record);

      if (!inStorage674) {
        // 利用中 等: セッション前に固めた条件（非保管のみ自動生成・595 等）
        if (isPersonal595AssistEnabled674(event.record)) {
          wrapper.appendChild(createGenerateButton('🔵 個人用 自動生成', '#0d6efd', () => {
            runPersonalAutoGen().catch(function (e) {
              console.error(e);
              window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
            });
          }));
        }

        if (type === TYPE_SHARED) {
          wrapper.appendChild(
            createGenerateButton('🟢 共有用 自動生成', '#198754', () => {
              runSharedAutoGen().catch(function (e) {
                console.error(e);
                window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
              });
            }),
          );
        }

        if (type === TYPE_SHARED || type === TYPE_JR) {
          wrapper.appendChild(createM365InputHeaderButton674());
        }

        if (isPersonal595AssistEnabled674(event.record)) {
          wrapper.appendChild(
            createInputAssistHeaderButton674(
              '595 社員マスタ',
              NPL674_INPUT_ASSIST_MSG_PERSONAL,
              openEmployee595SearchModal674,
            ),
          );
        }
        /** 転用廃棄ボタン: `getFieldElement` ではなく **record に `npl_transfer_manual` があるか**で出す（レイアウトで DOM が遅延／グループ内でも帯に出す）。 */
        if (isPersonal595AssistEnabled674(event.record) && event.record && event.record[FC_NPL_TRANSFER_MANUAL]) {
          wrapper.appendChild(createTransferDisposeHeaderButton674());
        }
        if (type === TYPE_SHARED || type === TYPE_JR) {
          wrapper.appendChild(
            createInputAssistHeaderButton674(
              '680 所属候補',
              NPL674_INPUT_ASSIST_MSG_SHARED_JR,
              openDeptMasterModal674,
            ),
          );
        }
      }

      wrapper.appendChild(createGenerateButton('🔴 全フィールドリセット', '#dc3545', () => {
        const ok = window.confirm(
          'PC名・シリアル・利用者名・所属・各種アカウント・SKYSEA・備考など、入力欄をまとめて空にします。種別・ステータス（利用中/保管/廃棄）・作成日時（JST）は変えません。続行しますか？',
        );
        if (!ok) return;
        runClearAccountFields();
      }));
    }

    if (isRecordDetail674) {
      if (!inStorage674) {
        wrapper.appendChild(createGenerateButton('🔄 PC買替', '#6c757d', () => {
          runPcReplacementFlow674().catch(function (e) {
            console.error('[NEW-PC-LEDGER-V1] PC買替', e);
            window.alert('PC買替でエラー: ' + (e && e.message ? e.message : String(e)));
          });
        }));
        wrapper.appendChild(createGenerateButton('📄 印刷', '#0dcaf0', () => {
          const rec = resolve674PrintRecord();
          if (!rec) {
            window.alert('レコードを取得できませんでした。画面を開き直すか、一覧から再度開いてください。');
            return;
          }
          open674SystemInfoPrintWindow(rec);
        }));
      }
    } else if (!inStorage674) {
      wrapper.appendChild(createGenerateButton('🔄 PC買替', '#6c757d', () => {
        runPcReplacementFlow674().catch(function (e) {
          console.error('[NEW-PC-LEDGER-V1] PC買替', e);
          window.alert('PC買替でエラー: ' + (e && e.message ? e.message : String(e)));
        });
      }));
      wrapper.appendChild(createGenerateButton('📄 印刷', '#0dcaf0', () => {
        const rec = resolve674PrintRecord();
        if (!rec) {
          window.alert('レコードを取得できませんでした。画面を開き直すか、一覧から再度開いてください。');
          return;
        }
        open674SystemInfoPrintWindow(rec);
      }));
    }

    if (!wrapper.firstChild) return;
    if (mount.prepend) {
      if (mount.el.firstChild) mount.el.insertBefore(wrapper, mount.el.firstChild);
      else mount.el.appendChild(wrapper);
    } else {
      mount.el.appendChild(wrapper);
    }
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
      FC_VPN_ID, FC_VPN_PW,
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
    bumpNpl674FieldElementCache674();
    hideUserSuggest674();
    maybeShow674ReplacementNoticeFromStorage674();
    npl674TransferManualMirror674 =
      !!(event.record && event.record[FC_NPL_TRANSFER_MANUAL]) &&
      readNplTransferManualChecked674(event.record);
    console.log(`[NEW-PC-LEDGER-V1] BUILD=${BUILD} event=${event.type}`);
    if (
      event.type === 'app.record.edit.show' ||
      event.type === 'mobile.app.record.edit.show'
    ) {
      const rid = event.record.$id && event.record.$id.value;
      if (rid) snapshotBeforeEdit674[String(rid)] = extractState674(event.record);
    }
    removeDeptHelpBanner();
    const editable =
      event.type === 'app.record.create.show' ||
      event.type === 'app.record.edit.show' ||
      event.type === 'mobile.app.record.create.show' ||
      event.type === 'mobile.app.record.edit.show';
    applyInternalMetaFieldUi(event.record, editable ? 'editable' : 'detail');
    applySkyseaGroupUi(event.record, editable ? 'editable' : 'detail');
    applyVisibilityByType(event.record);
    applyM365MasterRecordIdFieldUi674(event.record, editable ? 'editable' : 'detail');
    showJrBannerIfNeeded(event.record);
    scheduleInjectButtons674(event);
    scheduleInject595FieldAdjacent674(event.record, editable);
    if (editable) {
      ensureUserNameInputDelegate674();
      npl674PrevTransferManualChecked674 = readNplTransferManualChecked674(event.record);
      if (isPersonal595AssistEnabled674(event.record)) {
        setTimeout(function () {
          scheduleUserNameSuggest674();
        }, 120);
        setTimeout(function () {
          scheduleUserNameSuggest674();
        }, 600);
      }
      setTimeout(function () {
        wire674FieldAssistDirect674();
      }, 0);
      setTimeout(function () {
        wire674FieldAssistDirect674();
      }, 400);
      setTimeout(function () {
        wire674FieldAssistDirect674();
      }, 800);
      setTimeout(function () {
        wire674FieldAssistDirect674();
      }, 1200);
      setTimeout(function () {
        wire674FieldAssistDirect674();
      }, 2000);
    }
    return new kintone.Promise(function (resolve) {
      refreshLicenseBannerFrom671(event.record)
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] license banner', e);
        })
        .then(function () {
          return refreshPcNameDupBanner674(event.record);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] pc_name dup banner', e);
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
    'mobile.app.record.create.change.account_type',
    'mobile.app.record.edit.change.account_type',
  ];
  function onAccountTypeOrPcStatusChange674(event) {
    bumpNpl674FieldElementCache674();
    hideUserSuggest674();
    let result = event;
    if (String(event.type || '').indexOf('account_type') !== -1) {
      result = confirmTypeChangeIfNeeded(event);
    }
    result = showJrAlertIfNeeded(result);
    removeDeptHelpBanner();
    applyInternalMetaFieldUi(result.record, 'editable');
    applySkyseaGroupUi(result.record, 'editable');
    applyVisibilityByType(result.record);
    applyM365MasterRecordIdFieldUi674(result.record, 'editable');
    showJrBannerIfNeeded(result.record);
    scheduleInjectButtons674(result);
    scheduleInject595FieldAdjacent674(result.record, true);
    if (isPersonal595AssistEnabled674(result.record)) {
      ensureUserNameInputDelegate674();
      setTimeout(function () {
        scheduleUserNameSuggest674();
      }, 120);
    }
    refreshLicenseBannerFrom671(result.record).catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] license banner', e);
    });
    refreshPcNameDupBanner674(result.record).catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] pc_name dup banner', e);
    });
    setTimeout(function () {
      wire674FieldAssistDirect674();
    }, 0);
    setTimeout(function () {
      wire674FieldAssistDirect674();
    }, 400);
    setTimeout(function () {
      wire674FieldAssistDirect674();
    }, 800);
    return result;
  }

  kintone.events.on(typeChangeEvents, onAccountTypeOrPcStatusChange674);

  const pcNameChangeEvents674 = [
    'app.record.create.change.pc_name',
    'app.record.edit.change.pc_name',
  ];
  function onPcNameChangeDupBanner674(event) {
    refreshPcNameDupBanner674(event.record).catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] pc_name dup banner', e);
    });
    return event;
  }
  kintone.events.on(pcNameChangeEvents674, onPcNameChangeDupBanner674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      ['mobile.app.record.create.change.pc_name', 'mobile.app.record.edit.change.pc_name'],
      onPcNameChangeDupBanner674,
    );
  }

  const pcStatusChangeEvents = [
    'app.record.create.change.pc_status',
    'app.record.edit.change.pc_status',
    'mobile.app.record.create.change.pc_status',
    'mobile.app.record.edit.change.pc_status',
  ];
  kintone.events.on(pcStatusChangeEvents, onAccountTypeOrPcStatusChange674);

  // --- 一覧：§4.8a 検索（キーワード + 種別チップ + 転用PCチップ + datalist。SKYSEA チップは当面非表示・query 互換は維持） ---
  const SEARCH674_WRAP_ID = 'new-pc-ledger-674-index-search';
  const SEARCH674_WRAP_VER = '2026-05-11-v12-index-search-debug-flag';
  const SEARCH674_DL_ID = 'new-pc-ledger-674-search-datalist';
  /** 一覧 URL: キーワード原文（空白区切り AND 用）を query と併せて復元する */
  const SEARCH674_URL_KW_PARAM = 'npl674kw';
  /** kintone 標準ヘッダー検索・一覧 URL が載せる **`?q=`**（当 customize の **`query`** とは別名） */
  const SEARCH674_KINTONE_NATIVE_Q_PARAM = 'q';

  /** `localStorage.npl674debug=1` または hash に `npl674debug=1` のとき一覧検索同期でコンソールログ */
  function is674IndexSearchDebug674() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('npl674debug') === '1') return true;
      if (String(location.hash || '').indexOf('npl674debug=1') !== -1) return true;
    } catch (_e) {
      return false;
    }
    return false;
  }

  function log674IndexSearchDebug674(label, payload) {
    if (!is674IndexSearchDebug674()) return;
    try {
      console.info('[NEW-PC-LEDGER-V1][674-index-debug]', label, payload);
    } catch (_e2) {
      /* noop */
    }
  }

  const SEARCH674_HINT_FIELDS = [
    FC_PC_NAME,
    FC_LOGON_NAME,
    FC_M365_ID,
    FC_USER_NAME,
    FC_DEPT_NAME,
    FC_GROUP_NAME,
    FC_SHARED_TERMINAL_NAME,
    FC_NOTE,
    FC_NPL_DISPOSED_PC_COPY,
  ];

  const SEARCH674_TYPE_CHIPS = [
    { value: TYPE_PERSONAL, label: '👤 個人' },
    { value: TYPE_SHARED, label: '🟦 共有' },
    { value: TYPE_JR, label: '🚆 JR端末' },
    { value: TYPE_SERVER, label: '🖥 サーバーNAS' },
    { value: TYPE_OTHER, label: '📦 その他' },
  ];

  /** §4.2.3a / 仕様ドロップダウンと一致 */
  const SEARCH674_SKYSEA_CHIPS = [
    { value: '未確認', label: 'SKYSEA: 未確認' },
    { value: 'インストール済', label: 'SKYSEA: 済' },
    { value: '未インストール', label: 'SKYSEA: 未Inst' },
    { value: 'インストール対象外', label: 'SKYSEA: 対象外' },
  ];

  const cache674IndexSearch = { key: '', records: [], ts: 0 };

  function cell674PlainForSearch(rec, code) {
    const f = rec[code];
    if (!f || f.value == null) return '';
    if (typeof f.value === 'object' && !Array.isArray(f.value)) {
      return f.value.name != null ? String(f.value.name) : '';
    }
    return String(f.value).trim();
  }

  function escape674QueryLike(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /** `escape674QueryLike` の逆（一覧 query 内の like / in 用） */
  function unescape674QueryLike674(s) {
    const BS_PLACE = '@@NPL674_BS@@';
    return String(s || '')
      .replace(/\\\\/g, BS_PLACE)
      .replace(/\\"/g, '"')
      .split(BS_PLACE)
      .join('\\');
  }

  /** `field in ("a","b")` の括弧内から引用符で囲まれた値を列挙 */
  function parse674QuotedListInner674(inner) {
    const out = [];
    const str = String(inner || '');
    let i = 0;
    while (i < str.length) {
      while (i < str.length && (str[i] === ' ' || str[i] === ',')) i++;
      if (i >= str.length) break;
      if (str[i] !== '"') {
        i++;
        continue;
      }
      i++;
      let buf = '';
      while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
          buf += str[i + 1];
          i += 2;
          continue;
        }
        if (str[i] === '"') {
          i++;
          break;
        }
        buf += str[i];
        i++;
      }
      out.push(unescape674QueryLike674(buf));
    }
    return out;
  }

  /**
   * 一覧 URL の `query` を、検索バーの状態に分解（当バーが build した形式を想定。手編集 query は部分一致のみ反映）。
   * @returns {{ keyword: string, types: string[], skysea: string[], transferOnly: boolean }}
   */
  function parse674ListQueryToBarState674(listQuery) {
    const raw = String(listQuery || '').trim();
    const out = { keyword: '', types: [], skysea: [], transferOnly: false };
    if (!raw) return out;

    const typeRe = new RegExp('\\(\\s*' + FC_ACCOUNT_TYPE + '\\s+in\\s*\\(([^)]*)\\)\\s*\\)');
    const tm = typeRe.exec(raw);
    if (tm) {
      const cand = parse674QuotedListInner674(tm[1]);
      const allowed = new Set(SEARCH674_TYPE_CHIPS.map(function (c) {
        return c.value;
      }));
      for (let ti = 0; ti < cand.length; ti++) {
        if (allowed.has(cand[ti])) out.types.push(cand[ti]);
      }
    }

    const skyRe = new RegExp('\\(\\s*' + FC_SKYSEA_STATUS + '\\s+in\\s*\\(([^)]*)\\)\\s*\\)');
    const sm = skyRe.exec(raw);
    if (sm) {
      const candS = parse674QuotedListInner674(sm[1]);
      const allowedS = new Set(SEARCH674_SKYSEA_CHIPS.map(function (c) {
        return c.value;
      }));
      for (let si = 0; si < candS.length; si++) {
        if (allowedS.has(candS[si])) out.skysea.push(candS[si]);
      }
    }

    const optEscForTransferRe = escape674QueryLike(FC_NPL_TRANSFER_MANUAL_OPT).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const transferRe = new RegExp(
      '\\(\\s*' + FC_NPL_TRANSFER_MANUAL + '\\s+in\\s*\\(\\s*"' + optEscForTransferRe + '"\\s*\\)\\s*\\)',
    );
    out.transferOnly = transferRe.test(raw);

    const likeNeedle = FC_PC_NAME + ' like "';
    const li = raw.indexOf(likeNeedle);
    if (li !== -1) {
      let j = li + likeNeedle.length;
      let buf = '';
      while (j < raw.length) {
        if (raw[j] === '\\' && j + 1 < raw.length) {
          buf += raw[j + 1];
          j += 2;
          continue;
        }
        if (raw[j] === '"') break;
        buf += raw[j];
        j++;
      }
      out.keyword = unescape674QueryLike674(buf);
    }

    return out;
  }

  /**
   * 標準一覧の **`q`**（フィールドコード可変）から **`like "…"`** のリテラルを拾い、キーワード欄の表示用にする。
   */
  function extract674KeywordFromNativeQ674(nativeQ) {
    const raw = String(nativeQ || '');
    if (!raw) return '';
    const re = /\blike\s+"((?:\\.|[^"\\])*)"/gi;
    let m;
    const parts = [];
    const seen = new Set();
    while ((m = re.exec(raw)) !== null) {
      let inner = m[1] || '';
      try {
        inner = unescape674QueryLike674(inner);
      } catch (_e) {
        /* noop */
      }
      inner = String(inner || '').trim();
      if (!inner || seen.has(inner)) continue;
      seen.add(inner);
      parts.push(inner);
    }
    return parts.join(' ');
  }

  /** 一覧 URL の `query` と検索バー UI を同期（同一 VER の再描画スケジュール時も呼ぶ） */
  function hydrate674IndexSearchBarFromUrl674() {
    const wrap = document.getElementById(SEARCH674_WRAP_ID);
    if (!wrap || !wrap.__npl674) return;
    const read = read674IndexSearchQueryAndKw674();
    const urlQuery = read.urlQuery;
    const urlKwParam = read.urlKwParam;
    const urlNativeQ = read.urlNativeQ || '';
    let urlKwDecoded = '';
    if (urlKwParam) {
      try {
        urlKwDecoded = decodeURIComponent(urlKwParam);
      } catch (_e2) {
        urlKwDecoded = urlKwParam;
      }
    }
    const syncKey = urlQuery + '\n' + urlKwDecoded + '\n' + urlNativeQ;
    if (wrap.getAttribute('data-npl-synced-query') === syncKey) return;

    const effectiveListQuery = urlQuery || urlNativeQ;
    const st = parse674ListQueryToBarState674(effectiveListQuery);
    let kw = urlKwDecoded || st.keyword;
    if (!kw && urlNativeQ && !urlQuery) {
      kw = extract674KeywordFromNativeQ674(urlNativeQ);
    }
    const ref = wrap.__npl674;
    ref.inp.value = kw;
    ref.selectedTypes.clear();
    for (let ti = 0; ti < st.types.length; ti++) ref.selectedTypes.add(st.types[ti]);
    ref.selectedSkysea.clear();
    for (let si = 0; si < st.skysea.length; si++) ref.selectedSkysea.add(st.skysea[si]);
    if (ref.transferBox) ref.transferBox.v = !!st.transferOnly;
    ref.syncChips();

    wrap.setAttribute('data-npl-synced-query', syncKey);

    if (typeof ref.ensure674SearchCache === 'function') {
      ref
        .ensure674SearchCache()
        .then(function (recs) {
          update674SearchDatalist(recs, ref.inp.value);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] hydrate datalist', e);
        });
    }
  }

  /** 半角・全角スペースで分割（備考の複合検索: 各トークンは部分一致 OR 横断、トークン間は AND） */
  function split674IndexKeywords674(raw) {
    return String(raw || '')
      .trim()
      .split(/[\s\u3000]+/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
  }

  function build674IndexListQuery(keyword, selectedTypes, selectedSkysea, transferOnly674) {
    const parts = [];
    const types = selectedTypes instanceof Set ? [...selectedTypes] : [];
    if (types.length) {
      const quoted = types
        .map(function (t) {
          return '"' + escape674QueryLike(t) + '"';
        })
        .join(', ');
      parts.push('(' + FC_ACCOUNT_TYPE + ' in (' + quoted + '))');
    }
    const skies = selectedSkysea instanceof Set ? [...selectedSkysea] : [];
    if (skies.length) {
      const quotedS = skies
        .map(function (t) {
          return '"' + escape674QueryLike(t) + '"';
        })
        .join(', ');
      parts.push('(' + FC_SKYSEA_STATUS + ' in (' + quotedS + '))');
    }
    if (transferOnly674) {
      parts.push('(' + FC_NPL_TRANSFER_MANUAL + ' in ("' + escape674QueryLike(FC_NPL_TRANSFER_MANUAL_OPT) + '"))');
    }
    let kwRaw = String(keyword || '').trim();
    if (kwRaw.length > 200) {
      kwRaw = kwRaw.slice(0, 200);
    }
    const tokens = split674IndexKeywords674(kwRaw)
      .slice(0, 10)
      .map(function (t) {
        return t.length > 40 ? t.slice(0, 40) : t;
      });
    if (tokens.length) {
      const tokenParts = tokens.map(function (tok) {
        const e = escape674QueryLike(tok);
        const ors = SEARCH674_HINT_FIELDS.map(function (c) {
          return '(' + c + ' like "' + e + '")';
        });
        return '(' + ors.join(' or ') + ')';
      });
      parts.push('(' + tokenParts.join(' and ') + ')');
    }
    if (!parts.length) return '';
    return parts.join(' and ');
  }

  /**
   * Ocean 等で一覧条件が **`#...?query=...`** や **`#...?q=...`** に載る場合、`searchParams` だけ消しても絞り込みが残る。
   */
  function strip674ListFilterParamsFromUrlHash674(u) {
    try {
      const h = u.hash;
      if (!h || h.indexOf('?') === -1) return;
      const qm = h.indexOf('?');
      const path = h.slice(0, qm);
      const qs = h.slice(qm + 1);
      if (!qs) return;
      const hp = new URLSearchParams(qs);
      if (!hp.has('query') && !hp.has(SEARCH674_URL_KW_PARAM) && !hp.has(SEARCH674_KINTONE_NATIVE_Q_PARAM)) return;
      hp.delete('query');
      hp.delete(SEARCH674_URL_KW_PARAM);
      hp.delete(SEARCH674_KINTONE_NATIVE_Q_PARAM);
      const next = hp.toString();
      u.hash = next ? path + '?' + next : path;
    } catch (_e) {
      /* noop */
    }
  }

  /** `#/...?query=...` のクエリ部分を返す（無ければ ''） */
  function get674HashQueryString674(hash) {
    const h = String(hash || '');
    const qi = h.indexOf('?');
    if (qi === -1) return '';
    return h.slice(qi + 1);
  }

  /**
   * 一覧の **`query` / `npl674kw` / 標準 `q`** を **search と hash の両方**から読む（閲覧→戻る・絞り込み UI で片方だけ変わる場合のずれ対策）。
   * @returns {{ urlQuery: string, urlKwParam: string, urlNativeQ: string }}
   */
  function read674IndexSearchQueryAndKw674() {
    let u;
    try {
      u = new URL(location.href);
    } catch (_e) {
      return { urlQuery: '', urlKwParam: '', urlNativeQ: '' };
    }
    let urlQuery = String(u.searchParams.get('query') || '').trim();
    let urlKwParam = String(u.searchParams.get(SEARCH674_URL_KW_PARAM) || '').trim();
    let urlNativeQ = String(u.searchParams.get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '').trim();
    const qh = get674HashQueryString674(u.hash);
    if (qh) {
      try {
        const hp = new URLSearchParams(qh);
        if (!urlQuery) urlQuery = String(hp.get('query') || '').trim();
        if (!urlKwParam) urlKwParam = String(hp.get(SEARCH674_URL_KW_PARAM) || '').trim();
        if (!urlNativeQ) urlNativeQ = String(hp.get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '').trim();
      } catch (_e2) {
        /* noop */
      }
    }
    return { urlQuery: urlQuery, urlKwParam: urlKwParam, urlNativeQ: urlNativeQ };
  }

  /** カスタム検索バーの入力・チップのみ空にする（一覧の実効条件は触らない） */
  function clear674IndexSearchBarUi674(wrap) {
    const ref = wrap.__npl674;
    if (!ref) return;
    ref.inp.value = '';
    ref.selectedTypes.clear();
    ref.selectedSkysea.clear();
    if (ref.transferBox) ref.transferBox.v = false;
    ref.syncChips();
    wrap.setAttribute('data-npl-synced-query', '\n');
    if (typeof ref.ensure674SearchCache === 'function') {
      ref
        .ensure674SearchCache()
        .then(function (recs) {
          update674SearchDatalist(recs, '');
        })
        .catch(function () {
          /* noop */
        });
    }
  }

  /**
   * 一覧の **実効絞り込み**（`kintone.app.getQueryCondition`）を正とし、**空ならバーを空＋URL の query / npl674kw / 標準 `q` 残骸を除去**。
   * ネイティブ「条件クリア」は URL より先にここが空になることがある（Ocean SPA）。
   * @returns {boolean|undefined} **true** のとき `hydrate674IndexSearchBarFromUrl674` は呼ばないでよい
   */
  function sync674IndexSearchBarFromKintoneListCondition674() {
    const wrap = document.getElementById(SEARCH674_WRAP_ID);
    if (!wrap || !wrap.__npl674) return undefined;

    let cond = null;
    try {
      if (kintone.app && typeof kintone.app.getQueryCondition === 'function') {
        cond = kintone.app.getQueryCondition();
      } else if (
        typeof kintone.mobile !== 'undefined' &&
        kintone.mobile.app &&
        typeof kintone.mobile.app.getQueryCondition === 'function'
      ) {
        cond = kintone.mobile.app.getQueryCondition();
      }
    } catch (_e) {
      return undefined;
    }
    if (cond === null) return undefined;

    const condTrim = String(cond || '').trim();
    const readSnap = read674IndexSearchQueryAndKw674();
    log674IndexSearchDebug674('sync674IndexSearchBarFromKintoneListCondition674', {
      condTrim: condTrim,
      condHead: String(cond || '').slice(0, 120),
      read: readSnap,
    });
    if (!condTrim) {
      clear674IndexSearchBarUi674(wrap);
      if (readSnap.urlQuery || readSnap.urlKwParam || readSnap.urlNativeQ) {
        navigate674ListWithQuery('', '');
      }
      return true;
    }
    return false;
  }

  let npl674IndexHydrateDebounce674 = null;
  /** 閲覧から戻る・ネイティブ条件クリア等で URL ／実効条件が変わったとき、カスタム検索バーを追従させる */
  function request674IndexSearchHydrateFromUrl674() {
    if (npl674IndexHydrateDebounce674) {
      clearTimeout(npl674IndexHydrateDebounce674);
    }
    npl674IndexHydrateDebounce674 = setTimeout(function () {
      npl674IndexHydrateDebounce674 = null;
      const w = document.getElementById(SEARCH674_WRAP_ID);
      if (w) w.removeAttribute('data-npl-synced-query');
      let skipHydrate = false;
      try {
        skipHydrate = sync674IndexSearchBarFromKintoneListCondition674() === true;
      } catch (_e) {
        /* noop */
      }
      if (!skipHydrate) {
        try {
          hydrate674IndexSearchBarFromUrl674();
        } catch (_e2) {
          /* noop */
        }
      }
    }, 80);
  }

  let npl674IndexUrlListeners674 = false;
  function ensure674IndexSearchUrlListeners674() {
    if (npl674IndexUrlListeners674) return;
    npl674IndexUrlListeners674 = true;
    window.addEventListener('popstate', request674IndexSearchHydrateFromUrl674);
    window.addEventListener('hashchange', request674IndexSearchHydrateFromUrl674);
  }

  /** 絞り込みパネルの「条件クリア」系クリック後に `getQueryCondition` が更新されるまで再同期 */
  let npl674NativeClearListen674 = false;
  function ensure674IndexSearchNativeClearListener674() {
    if (npl674NativeClearListen674) return;
    npl674NativeClearListen674 = true;
    document.addEventListener(
      'click',
      function (ev) {
        const t = ev.target;
        if (!t || !t.closest) return;
        const el = t.closest('button, a, [role="button"]');
        if (!el) return;
        const blob =
          String(el.textContent || '') +
          ' ' +
          String(el.getAttribute('aria-label') || '') +
          ' ' +
          String(el.getAttribute('title') || '');
        const hasClear = blob.indexOf('クリア') !== -1 || /\bclear\b/i.test(blob);
        const hasCondWord =
          blob.indexOf('条件') !== -1 ||
          blob.indexOf('絞り込み') !== -1 ||
          blob.indexOf('フィルタ') !== -1 ||
          /\bfilter\b/i.test(blob);
        if (!hasClear || !hasCondWord) return;
        [120, 400, 900].forEach(function (ms) {
          setTimeout(request674IndexSearchHydrateFromUrl674, ms);
        });
      },
      true,
    );
  }

  function navigate674ListWithQuery(queryStr, rawKeywordForUrl) {
    let u;
    try {
      u = new URL(location.href);
    } catch (e) {
      return;
    }
    const qTrim = String(queryStr != null ? queryStr : '').trim();
    if (qTrim) {
      u.searchParams.set('query', qTrim);
    } else {
      u.searchParams.delete('query');
    }
    const kwPlain = String(rawKeywordForUrl != null ? rawKeywordForUrl : '').trim();
    if (kwPlain) {
      /* searchParams.set が UTF-8 エンコードするため encodeURIComponent は不要（二重エンコード回避） */
      u.searchParams.set(SEARCH674_URL_KW_PARAM, kwPlain.slice(0, 200));
    } else {
      u.searchParams.delete(SEARCH674_URL_KW_PARAM);
    }
    if (qTrim || kwPlain) {
      /* カスタム `query`／`npl674kw` と標準 `?q=` が併存すると二重絞り込みになるため除去 */
      u.searchParams.delete(SEARCH674_KINTONE_NATIVE_Q_PARAM);
    } else {
      u.searchParams.delete(SEARCH674_KINTONE_NATIVE_Q_PARAM);
      strip674ListFilterParamsFromUrlHash674(u);
    }
    try {
      location.replace(u.toString());
    } catch (_e2) {
      location.href = u.toString();
    }
  }

  function resolve674ListSearchMount() {
    const oceanHead = document.querySelector('.ocean-ui-app-index-head');
    if (oceanHead) return { parent: oceanHead, insert: 'first' };
    if (typeof kintone.app.getHeaderSpaceElement === 'function') {
      const headerSpace = kintone.app.getHeaderSpaceElement();
      if (headerSpace) return { parent: headerSpace, insert: 'last' };
    }
    const menu = kintone.app.getHeaderMenuSpaceElement();
    if (menu) return { parent: menu, insert: 'last' };
    for (const sel of ['.gaia-argoui-app-toolbar-top', '.gaia-argoui-app-index-head']) {
      const n = document.querySelector(sel);
      if (n) return { parent: n, insert: 'first' };
    }
    const listBox = document.querySelector('.recordlist-gaia');
    if (listBox) return { parent: listBox, insert: 'first' };
    const layoutGaia = document.querySelector('#contents-body .layout-gaia');
    if (layoutGaia) return { parent: layoutGaia, insert: 'first' };
    return { parent: null, insert: 'last' };
  }

  function attach674ListSearchPanel(wrap) {
    const info = resolve674ListSearchMount();
    if (!info.parent) return false;
    if (info.insert === 'first') {
      info.parent.insertBefore(wrap, info.parent.firstChild);
    } else {
      info.parent.appendChild(wrap);
    }
    return true;
  }

  async function fetch674IndexSearchCache() {
    const app = kintone.app.getId();
    let viewId;
    try {
      viewId = typeof kintone.app.getViewId === 'function' ? String(kintone.app.getViewId()) : '';
    } catch (e) {
      viewId = '';
    }
    /** 一覧 URL の query（絞り込み結果）を混ぜない。datalist はアプリ内の値候補を広く出す。 */
    const cacheKey = String(app) + '|' + viewId + '|674search-hints';
    const now = Date.now();
    if (
      cache674IndexSearch.key === cacheKey &&
      cache674IndexSearch.records.length &&
      now - cache674IndexSearch.ts < 120000
    ) {
      return cache674IndexSearch.records;
    }
    const fields = ['$id'].concat(SEARCH674_HINT_FIELDS, [FC_ACCOUNT_TYPE]);
    const all = [];
    for (let off = 0; off < 120000; off += 500) {
      const query = '$id > 0 order by $id desc limit 500 offset ' + off;
      const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app,
        query,
        fields,
      });
      const recs = res.records || [];
      all.push(...recs);
      if (recs.length < 500) break;
    }
    cache674IndexSearch.key = cacheKey;
    cache674IndexSearch.records = all;
    cache674IndexSearch.ts = now;
    return all;
  }

  function update674SearchDatalist(records, prefix) {
    const dl = document.getElementById(SEARCH674_DL_ID);
    if (!dl) return;
    while (dl.firstChild) dl.removeChild(dl.firstChild);
    const p = String(prefix || '').trim().toLowerCase();
    if (!p) return;
    const seen = new Set();
    const out = [];
    for (let ri = 0; ri < records.length; ri++) {
      const rec = records[ri];
      for (let fi = 0; fi < SEARCH674_HINT_FIELDS.length; fi++) {
        const code = SEARCH674_HINT_FIELDS[fi];
        const v = cell674PlainForSearch(rec, code);
        if (!v) continue;
        if (!v.toLowerCase().includes(p)) continue;
        if (seen.has(v)) continue;
        seen.add(v);
        out.push(v);
        if (out.length >= 80) break;
      }
      if (out.length >= 80) break;
    }
    out.sort(function (a, b) {
      return a.length - b.length || a.localeCompare(b);
    });
    for (let i = 0; i < out.length; i++) {
      const o = document.createElement('option');
      o.value = out[i];
      dl.appendChild(o);
    }
  }

  function render674IndexSearchBar() {
    const existing = document.getElementById(SEARCH674_WRAP_ID);
    if (existing && existing.getAttribute('data-npl-ver') === SEARCH674_WRAP_VER) {
      hydrate674IndexSearchBarFromUrl674();
      return;
    }
    if (existing) {
      try {
        existing.remove();
      } catch (eRem) {
        console.warn('[NEW-PC-LEDGER-V1] remove old search panel', eRem);
      }
    }

    const wrap = document.createElement('div');
    wrap.id = SEARCH674_WRAP_ID;
    wrap.setAttribute('data-npl-ver', SEARCH674_WRAP_VER);
    wrap.style.cssText =
      'box-sizing:border-box;width:100%;max-width:min(100%,calc(100vw - 24px));' +
      'margin:0 0 12px 0;padding:10px 12px 12px;background:#f1f5f9;border:1px solid #cbd5e1;' +
      'border-radius:8px;font-family:system-ui,sans-serif;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;';
    title.textContent = 'キーワードと種別で絞り込み';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';

    const inpKw = document.createElement('input');
    inpKw.type = 'text';
    inpKw.id = 'npl674-index-search-kw';
    inpKw.setAttribute('list', SEARCH674_DL_ID);
    inpKw.setAttribute('autocomplete', 'off');
    inpKw.placeholder = '例: 674#123';
    inpKw.style.cssText =
      'min-width:220px;flex:1;max-width:420px;padding:6px 10px;border:1px solid #94a3b8;border-radius:6px;';

    const dl = document.createElement('datalist');
    dl.id = SEARCH674_DL_ID;

    const btnGo = document.createElement('button');
    btnGo.type = 'button';
    btnGo.textContent = '絞り込み';
    btnGo.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;';

    const btnClr = document.createElement('button');
    btnClr.type = 'button';
    btnClr.textContent = '条件クリア';
    btnClr.style.cssText =
      'padding:6px 12px;border-radius:6px;border:1px solid #64748b;background:#fff;color:#334155;font-weight:700;cursor:pointer;';

    row.appendChild(inpKw);
    row.appendChild(dl);
    row.appendChild(btnGo);
    row.appendChild(btnClr);

    const chipRow = document.createElement('div');
    chipRow.style.cssText =
      'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px;';

    const selectedTypes = new Set();

    SEARCH674_TYPE_CHIPS.forEach(function (def) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = def.label;
      b.dataset.typeValue = def.value;
      b.className = 'npl674-index-chip';
      b.style.cssText =
        'padding:4px 10px;border-radius:999px;border:1px solid #94a3b8;background:#fff;' +
        'font-size:12px;font-weight:700;cursor:pointer;color:#0f172a;';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        const val = b.dataset.typeValue || '';
        if (selectedTypes.has(val)) {
          selectedTypes.delete(val);
          b.setAttribute('aria-pressed', 'false');
          b.style.background = '#fff';
          b.style.borderColor = '#94a3b8';
        } else {
          selectedTypes.add(val);
          b.setAttribute('aria-pressed', 'true');
          b.style.background = '#cffafe';
          b.style.borderColor = '#0e7490';
        }
      });
      chipRow.appendChild(b);
    });

    const transferBox = { v: false };
    const btnTransferChip = document.createElement('button');
    btnTransferChip.type = 'button';
    btnTransferChip.textContent = '転用PC';
    btnTransferChip.dataset.nplTransferChip = '1';
    btnTransferChip.className = 'npl674-index-chip';
    btnTransferChip.setAttribute('aria-pressed', 'false');
    btnTransferChip.setAttribute('aria-label', '転用チェックが付いたレコードのみに絞り込み');
    btnTransferChip.style.cssText =
      'padding:4px 10px;border-radius:999px;border:1px solid #94a3b8;background:#fff;' +
      'font-size:12px;font-weight:700;cursor:pointer;color:#0f172a;';
    btnTransferChip.addEventListener('click', function () {
      transferBox.v = !transferBox.v;
      syncChips674();
    });
    chipRow.appendChild(btnTransferChip);

    const skyChipRow = document.createElement('div');
    /** SKYSEA チップは当面出さないが、`selectedSkysea` と syncChips は URL 互換のため残す */
    skyChipRow.style.cssText = 'display:none;';

    const selectedSkysea = new Set();

    function syncChips674() {
      chipRow.querySelectorAll('button[data-type-value]').forEach(function (b) {
        const val = b.dataset.typeValue || '';
        const on = selectedTypes.has(val);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#cffafe' : '#fff';
        b.style.borderColor = on ? '#0e7490' : '#94a3b8';
      });
      skyChipRow.querySelectorAll('button[data-skysea-value]').forEach(function (b) {
        const val = b.dataset.skyseaValue || '';
        const on = selectedSkysea.has(val);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#ede9fe' : '#fff';
        b.style.borderColor = on ? '#6d28d9' : '#94a3b8';
      });
      const tb = chipRow.querySelector('button[data-npl-transfer-chip]');
      if (tb) {
        const on = transferBox.v;
        tb.setAttribute('aria-pressed', on ? 'true' : 'false');
        tb.style.background = on ? '#ffedd5' : '#fff';
        tb.style.borderColor = on ? '#c2410c' : '#94a3b8';
      }
    }

    wrap.appendChild(title);
    wrap.appendChild(row);
    wrap.appendChild(chipRow);

    const apply674 = function () {
      const q = build674IndexListQuery(inpKw.value, selectedTypes, selectedSkysea, transferBox.v);
      navigate674ListWithQuery(q, inpKw.value);
    };

    btnGo.addEventListener('click', function () {
      apply674();
    });
    btnClr.addEventListener('click', function () {
      inpKw.value = '';
      selectedTypes.clear();
      selectedSkysea.clear();
      transferBox.v = false;
      syncChips674();
      wrap.setAttribute('data-npl-synced-query', '');
      navigate674ListWithQuery('', '');
    });
    inpKw.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        apply674();
      }
    });

    let cachePromise = null;
    function ensure674SearchCache() {
      if (!cachePromise) {
        cachePromise = fetch674IndexSearchCache();
      }
      return cachePromise;
    }

    wrap.__npl674 = {
      inp: inpKw,
      selectedTypes: selectedTypes,
      selectedSkysea: selectedSkysea,
      transferBox: transferBox,
      syncChips: syncChips674,
      ensure674SearchCache: ensure674SearchCache,
    };
    wrap.setAttribute('data-npl-synced-query', '');

    inpKw.addEventListener('input', function () {
      ensure674SearchCache()
        .then(function (recs) {
          update674SearchDatalist(recs, inpKw.value);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] index search datalist', e);
        });
    });

    if (!attach674ListSearchPanel(wrap)) {
      console.warn('[NEW-PC-LEDGER-V1] index search mount failed');
      return;
    }

    ensure674SearchCache()
      .then(function (recs) {
        update674SearchDatalist(recs, inpKw.value);
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] initial search cache', e);
      })
      .then(function () {
        hydrate674IndexSearchBarFromUrl674();
      });
  }

  function schedule674IndexSearch() {
    [0, 400, 1200].forEach(function (ms) {
      setTimeout(function () {
        try {
          render674IndexSearchBar();
        } catch (e) {
          console.warn('[NEW-PC-LEDGER-V1] schedule674IndexSearch', e);
        }
      }, ms);
    });
  }

  // 一覧では所属ヘルプを出さない（§4.2.0b 詳細・新規のみ）
  function onRecordIndexShow674(event) {
    removeDeptHelpBanner();
    const staleGuide = document.getElementById('new-pc-ledger-input-guide');
    if (staleGuide) staleGuide.remove();
    document.querySelectorAll('.npl674-form-section-ribbon').forEach(function (n) {
      n.remove();
    });
    ensure674IndexSearchUrlListeners674();
    ensure674IndexSearchNativeClearListener674();
    const wSearch = document.getElementById(SEARCH674_WRAP_ID);
    if (wSearch) wSearch.removeAttribute('data-npl-synced-query');
    schedule674IndexSearch();
    setTimeout(request674IndexSearchHydrateFromUrl674, 200);
    return event;
  }
  kintone.events.on('app.record.index.show', onRecordIndexShow674);
  kintone.events.on('mobile.app.record.index.show', onRecordIndexShow674);

  // 保存前バリデーション (仕様書 §4.7.1 + §5.3 6 台目ブロック)。備考 note は全種別任意。
  const submitEvents674 = [
    'app.record.create.submit',
    'app.record.edit.submit',
  ];

  function onBeforeSubmit674(event) {
    return new kintone.Promise(function (resolve) {
      const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
      const errors = [];

      if (!trimmedScalarValue674(event.record, FC_PC_NAME)) {
        const pm = 'PC名を入力してください（PCの管理番号＝PC名として運用します）。';
        errors.push(pm);
        event.errors = Object.assign(event.errors || {}, { [FC_PC_NAME]: pm });
      }

      if (type === TYPE_PERSONAL && isPersonal595AssistEnabled674(event.record) && !String(event.record[FC_USER_NAME]?.value || '').trim()) {
        const um = '種別が「個人」のときは「利用者名」を入力してください。';
        errors.push(um);
        event.errors = Object.assign(event.errors || {}, { [FC_USER_NAME]: um });
      }
      if (type === TYPE_SHARED || type === TYPE_JR) {
        if (!String(event.record[FC_SHARED_TERMINAL_NAME]?.value || '').trim()) {
          const sm = '共有端末名を入力してください。';
          errors.push(sm);
          event.errors = Object.assign(event.errors || {}, { [FC_SHARED_TERMINAL_NAME]: sm });
        }
        const reqPairsSharedJr = [
          [FC_LOGON_NAME, 'WindowsID'],
          [FC_LOGON_PW, 'ログオン パスワード'],
          [FC_M365_ID, 'M365 ID'],
          [FC_M365_PW, 'M365 パスワード'],
        ];
        for (let ri = 0; ri < reqPairsSharedJr.length; ri++) {
          const code = reqPairsSharedJr[ri][0];
          const label = reqPairsSharedJr[ri][1];
          if (!trimmedScalarValue674(event.record, code)) {
            const m = '種別が「' + type + '」のときは「' + label + '」を入力してください。';
            errors.push(m);
            event.errors = Object.assign(event.errors || {}, { [code]: m });
          }
        }
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
          return ensureM671SlotOrAutoReassign674(event);
        })
        .then(function (m671Msg) {
          if (m671Msg) {
            event.error = m671Msg;
            event.errors = Object.assign(event.errors || {}, {
              [FC_M365_MASTER_RECORD_ID]: m671Msg,
            });
            return null;
          }
          return checkPersonalJbisDuplicateBeforeSave674(event);
        })
        .then(function (dupRes) {
          if (dupRes === 'cancelled') {
            const dm =
              'JBIS+4桁の管理番号が他レコードと重複しています。室長へ確認のうえ、登録してよい場合は再度「保存」し「はい」を選んでください。';
            event.error = dm;
            event.errors = Object.assign(event.errors || {}, {
              [FC_PC_NAME]: dm,
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

  function onNplTransferManualFieldChange674(event) {
    /** `getFieldElement` はレイアウト・描画タイミングで一時的に null になり得る。確認ダイアログは **record 上のフィールド**があれば必ず評価する。 */
    if (!event.record || !event.record[FC_NPL_TRANSFER_MANUAL]) {
      return event;
    }
    const was = npl674PrevTransferManualChecked674;
    const now = readNplTransferManualChecked674(event.record);
    if (was && !now) {
      const ok = window.confirm(
        '転用フラグを本当に外してもよいですか？\n\n「OK」でチェックを外す／「キャンセル」でチェックを維持します。',
      );
      if (!ok && event.record[FC_NPL_TRANSFER_MANUAL]) {
        event.record[FC_NPL_TRANSFER_MANUAL].value = [FC_NPL_TRANSFER_MANUAL_OPT];
      }
    }
    const curTm = readNplTransferManualChecked674(event.record);
    npl674PrevTransferManualChecked674 = curTm;
    npl674TransferManualMirror674 = curTm;
    return event;
  }

  const nplTransferManualChangeEvents674 = [
    'app.record.edit.change.npl_transfer_manual',
    'app.record.create.change.npl_transfer_manual',
  ];
  kintone.events.on(nplTransferManualChangeEvents674, onNplTransferManualFieldChange674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      [
        'mobile.app.record.edit.change.npl_transfer_manual',
        'mobile.app.record.create.change.npl_transfer_manual',
      ],
      onNplTransferManualFieldChange674,
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

  install674EmptyFieldFocusAssist674();

  console.log(`[NEW-PC-LEDGER-V1] customize loaded BUILD=${BUILD}`);
  console.log(`[NEW-PC-LEDGER-V1] 関連アプリ: env=${APP_ENV_MASTER} m365=${APP_M365_MASTER} jbm=${APP_JBM_NUMBER} sjbm=${APP_SJBM_NUMBER} employee=${APP_EMPLOYEE}`);
})();
