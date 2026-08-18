/**
 * 新・PC台帳ver.1（Day 4 以降の継続実装）
 *
 * 仕様: docs/plans/2026-04-21-new-pc-ledger-spec.md v2.1 §4
 * Day 4 plan: docs/plans/2026-04-26-pc-ledger-day4-action.md
 *
 * 直近: admin 管理タブ「M365利用状況」パネル（674 正本・671 参照・5 台上限一覧）
 * 直近: アカウント手入力優先・671 満杯時の上書き抑止・627 相当の印刷帳票（§4.9）
 *
 * Day 4 雛形スコープ:
 *   - 種別 (account_type) による表示制御 (show/hide)
 *   - §4.2.1a: 内部メタは kintone 標準グループ `internal_system_meta` に収容（レイアウトは `npm run pc-ledger:674:layout-internal-group`）。表示時はグループを閉じる・新規・編集では子を disabled
 *   - §4.2.3a / SPEC 2026-08-06: SKYSEA は `skysea_system_meta`（表示名 SKYSEA処理用）に収容。**LoginID `admin` かつ種別=個人**のときのみ表示・編集（手動完了フィールドのみ）。admin でも共有/JR端末/サーバーNAS/その他は非 admin と同様に非表示。一覧に「SKYSEA対応一覧」（admin 専用・個人 SCOPE）。通常はグループを閉じた初期表示。旧自動配信メタ4項目は削除済。
 *   - 自動生成ボタン: 個人 / 共有（Windows+M365）/ JR（**M365 のみ**・**PC名は手入力のまま**）を §4.4 に沿ってフォームへ反映（空欄のみ上書き）。**個人**: §4.3.1 **`pc_name`/`pc_serial_no`**（次番＝**廃棄・取消以外・全種別の `pc_name` から JBIS 連番 max +1**（**S-JBIS は除外**）。**空き番は使わない**。**自動採番時は 670 `PC_SERIAL_MIN_PERSONAL_JBIS`（未設定時 67＝JBIS0067）未満にしない**。番兵 **JBIS9999** は max に含めない）。§4.2.2 **`windows_name`=`jbm####[mailの@前]`**（`logon_name` と `[` の間に **`+` は付けない**）・`mail_pw`（jb+乱数4桁+K#）・`gb_id`/`sb_id`=mail_acct・`gb_pw`/`sb_pw`=logon_name**（メール空時は ID 系は案内のみ）。**共有**: **`S-JBIS####-YYYYMM`**（廃棄以外・共有の **`pc_name` の S-JBIS 連番 max +1**・**空き番不使用**。番兵 **S-JBIS9999** 除外。個人の **JBIS は共有採番に含めない**）と Windows 採番。**JR**: PC 名・Windows は自動で触らない
 *   - 5 台ライセンス警告雛形 (赤バナーは仕組みのみ)
 *   - リセット／PC買替（§4.10.3・674台帳 JBIS/S-JBIS 次番・671 整合・595 個人リンク）／印刷（627 レイアウト移植済）
 *   - **レコード閲覧（detail）**: **ステータス≠保管**のとき操作ボタンは **PC買替・印刷のみ**。**保管の閲覧**ではカスタムヘッダを付けない（余計なボタンなし）。**新規・編集かつ保管**（個人/共有/JR いずれも）: ヘッダは **全フィールドリセットのみ**。**利用中**等の非保管は従来の種別別ボタン＋PC買替・印刷。
 *
 * Day 5 残タスク（未完了のみ）:
 *   - （一覧）旧 `skysea_status` チップ／query 互換は **廃止**（フィールド削除 2026-08-06）。手動台帳は `skysea_manual_*` のみ。
 *   - （一覧）**絞り込み URL**: `query` と `npl674kw` から **キーワード・種別（・SKYSEA in）・M365切替／資産台帳（済／未）**を復元（当バーが生成した形式に準拠）。
 *   - （一覧）**M365切替**（`M365_kirikae`）・**資産台帳登録**（`shisandaicyo`）: チップ **済／未**（`in ("済")` / `not in ("済")`）。
 *   - **PC買替は実装済**（§4.10.3）。594 同趣旨。**627 二重更新なし**。v0.9.14: ボタン掛け先フォールバック＋遅延再 inject、`import_source=PC_REPLACE_FROM_674:<旧$id>`。
 *   - 新規・編集: **所属ヘルプ `<details>`（入れ方・コピー一覧）は表示しない**（2026-05-05 浜田指示）。**入力支援**: `document` **capture** でフィールド内クリックを捕捉（kintone 内側の `stopPropagation` より先）。**はい／いいえ** の z-index は kintone ヘッダより上。**編集不可フィールド**（record.disabled・閲覧画面・disabled/readOnly input）では確認を出さない。**明示ボタン**は **`#new-pc-ledger-buttons` 帯**に **「入力支援利用」**（個人・非保管→595／共有・JR→680。表示名は同一、`aria-label` で区別）（フィールド直下 DOM 挿入は廃止）。ヘッダの旧「社員名検索／所属候補」ボタンは**廃止**。**`pc_status`=保管**のときは種別横断で **ヘッダは全フィールドリセットのみ**。**種別／ステータス**は record を DOM と突合。**共有・個人の自動生成**: `m365_master_record_id` は **set 前に disabled 解除**。**`pc_serial_no` 等内部メタ子**（§4.2.1a）も **`record.set` 同期間だけ** disabled 解除してから反映。
 *   - **備考（note）**: 全種別で任意（保存前チェックでは必須にしない）。
 *   - **モバイル**: 当面は利用想定なし（`kintone.mobile` 分岐は既存のまま残すが、専用UXは追わない）。
 *   - **M365管理マスタレコード番号（671 `$id`）**: 共有・JR は同一671行の **usage_count / 5 台**運用で紐づく。個人は表示するが多くは空（自動生成はメール由来M365中心）。**手入力不可**（自動生成・保存後同期のみ更新）。
 *   - **PC名（`pc_name`）**: 全種別で **保存必須**（運用: **PCの管理番号＝PC名**）。
 *   - **個人の PC 名重複**: 他の個人レコード（廃棄・取消以外）と **全く同一の `pc_name`**（trim 後・大文字小文字無視）のとき **保存不可（ハードブロック）**。JBIS コアのみ同じで月違い（例 JBIS0016-202401 vs -202402）は可。詳細・編集でも赤バナー表示。
 *
 * **674 本番**: `npl_disposed_pc_copy` を一覧キーワード検索に含める。**フィールド未追加のまま本 BUILD の JS だけ載せると一覧 REST が失敗し得る**ため、先に **`npm run pc-ledger:674:add-npl-disposed-pc-field-preview`**（`kintone-apps.md` 674 行の反映順）。
 * **674 SKYSEA対応**: 個人のみ対象・非個人は空。`skysea_manual_done` 空の個人レコードは保存時必須検証で落ちるため、show/submit で既定「未了」を補完。
 */
(function () {
  'use strict';

  const BUILD = '2026-08-18-674-org-picker-sort';

  /** 編集画面表示直後の割当状態（submit.success で §4.10 / §5.3 と突合） */
  const snapshotBeforeEdit674 = Object.create(null);
  let jb674PrintRecordSnapshot = null;
  /** 670 棚卸期間（一覧・詳細の棚卸ボタン表示ゲート） */
  let npl674InventoryPeriodActive674 = false;
  let npl674InventoryEnvMap674 = null;

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
  /** 注: latest_inventory_date は下で FC_LATEST_INVENTORY_DATE 定義後も同コード */
  const INTERNAL_CHILD_CODES = [
    FC_PC_SERIAL_NO,
    FC_IMPORT_SOURCE,
    FC_CREATED_AT_JST,
    'latest_inventory_date', // FC_LATEST_INVENTORY_DATE（内部処理用・§4.2.1a）
  ];

  /** §4.2.3a SKYSEA グループ（表示名 SKYSEA処理用）・admin 限定 UI */
  const ADMIN_LOGIN = 'admin';
  const FC_SKYSEA_GROUP = 'skysea_system_meta';
  /** 手動インストール進捗（SPEC 2026-08-06）。旧自動配信メタ4項目は削除済 */
  const FC_SKYSEA_MANUAL_DONE = 'skysea_manual_done';
  const FC_SKYSEA_MANUAL_DATE = 'skysea_manual_date';
  const FC_SKYSEA_MANUAL_HANDLER = 'skysea_manual_handler';
  const FC_SKYSEA_CLIENT_DELETE_STATUS = 'skysea_client_delete_status';
  const FC_SKYSEA_CLIENT_DELETE_DATE = 'skysea_client_delete_date';
  const SKYSEA_MANUAL_DONE_COMPLETE = '完了';
  const SKYSEA_MANUAL_DONE_PENDING = '未了';
  const SKYSEA_CLIENT_DELETE_PENDING = '未了';
  const SKYSEA_CLIENT_DELETE_DONE = '完了';
  const SKYSEA_CHILD_CODES = [
    FC_SKYSEA_MANUAL_DONE,
    FC_SKYSEA_MANUAL_DATE,
    FC_SKYSEA_MANUAL_HANDLER,
    FC_SKYSEA_CLIENT_DELETE_STATUS,
    FC_SKYSEA_CLIENT_DELETE_DATE,
  ];
  /**
   * 棚卸状況一覧の行順（747 JRE-C_Hub 集計の所属グループ×部署イメージ）。
   * 浜田提示 2026-08-08。マッチは主に dept_name（部署）。
   */
  const INVENTORY674_ORG_DEPT_ROWS = [
    { group: '本社', dept: '役員室' },
    { group: '本社', dept: '顧問室' },
    { group: '本社', dept: '経理部' },
    { group: '本社', dept: '総務部' },
    { group: '本社', dept: '経営企画部' },
    { group: '本社', dept: '人事研修部' },
    { group: '本社', dept: '人事研修部出向者' },
    { group: '本社', dept: '安全推進部' },
    { group: '本社', dept: '施工推進部' },
    { group: '本社', dept: 'メンテナンス技術部' },
    { group: '本社', dept: '塗装技術部' },
    { group: '本社', dept: '品質管理部' },
    { group: '東北支店', dept: '東北支店' },
    { group: '東北支店', dept: '仙台営業所' },
    { group: '東北支店', dept: '秋田営業所' },
    { group: '東北支店', dept: '盛岡営業所' },
    { group: '関越支店', dept: '関越支店' },
    { group: '関越支店', dept: '新潟営業所' },
    { group: '関越支店', dept: '長野営業所' },
    { group: '関越支店', dept: '高崎営業所' },
    { group: '東京支店', dept: '東京支店' },
    { group: '東京支店', dept: '水戸営業所' },
    { group: '東京支店', dept: '千葉営業所' },
    { group: '東海支店', dept: '東海支店' },
    { group: '東海支店', dept: '東京営業所' },
    { group: '東海支店', dept: '静岡営業所' },
    { group: '東海支店', dept: '名古屋営業所' },
    { group: '東海支店', dept: '関西営業所' },
    { group: 'リフォーム統括事業部', dept: '札幌支店' },
    { group: 'リフォーム統括事業部', dept: '首都圏支店' },
    { group: '鉄構支店', dept: '鉄構支店' },
    { group: '湾岸工事所', dept: '湾岸工事所' },
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
  /** 買替直後の保存で必須にする機種情報（§4.10.3） */
  const REPLACE_HW_REQUIRED_FIELDS_674 = [
    [FC_MANUFACTURER, 'メーカー'],
    [FC_MODEL_NAME, 'モデル名'],
    [FC_SERIAL, 'シリアル'],
  ];
  /** 非個人×個人JBIS形式 PC 名保存時に備考へ追記する運用マーカー（重複防止・§4.3.1 浜田 GO 2026-08-07） */
  const NOTE_SHARED_JBIS_OPS_MARKER_674 =
    '[運用] 共有等だがPC名が個人JBIS形式（現場ラベル維持・採番は衝突回避）';
  /** 部署レビュー（2026-05-11）: 転用フロー A — チェック後にヘッダから「元PC廃棄」を確定（`npm run pc-ledger:674:add-transfer-manual-preview`） */
  const FC_NPL_TRANSFER_MANUAL = 'npl_transfer_manual';
  const FC_NPL_TRANSFER_MANUAL_OPT = '転用';
  /** 転用ウィザードで廃棄した旧 PC の識別子を転記（§4.10.6・一覧キーワード検索対象） */
  const FC_NPL_DISPOSED_PC_COPY = 'npl_disposed_pc_copy';
  /** 当方 M365 切替・資産台帳登録（CHECK_BOX・選択肢「済」） */
  const FC_M365_KIRIKAE = 'M365_kirikae';
  const FC_SHISAN_DAICHO = 'shisandaicyo';
  const SEARCH674_CB_DONE_OPT = '済';
  /** 編集画面で転用チェックの直前状態（外すときの確認用） */
  let npl674PrevTransferManualChecked674 = false;
  /** `change` / `show` で同期した「転用」ON（`setTimeout` 内の `get()` 遅れ・重い DOM 全走査を避ける） */
  let npl674TransferManualMirror674 = false;
  const FC_PURCHASE_DATE = 'purchase_date';
  const FC_PURCHASE_AMOUNT = 'purchase_amount';
  const FC_PURCHASE_VENDOR = 'purchase_vendor';
  const FC_PURCHASE_VENDOR_OTHER = 'purchase_vendor_other';
  const FC_LATEST_INVENTORY_DATE = 'latest_inventory_date';
  /** 棚卸履歴サブテーブル（`npm run pc-ledger:674:add-inventory-history-subtable-preview`） */
  const FC_INVENTORY_HISTORY = 'inventory_history';
  const FC_INV_HIST_DATE = 'inventory_hist_date';
  const FC_INV_HIST_PERSON = 'inventory_hist_person';
  const FC_INV_HIST_LOCATION = 'inventory_hist_location';
  const FC_INV_HIST_METHOD = 'inventory_hist_method';
  const INV_METHOD_INDIVIDUAL = '個別';
  const INV_METHOD_BULK = '一括';
  const ENV_PC_INV_PERIOD_START = 'PC_INVENTORY_PERIOD_START';
  const ENV_PC_INV_PERIOD_END = 'PC_INVENTORY_PERIOD_END';
  const PC_STATUS_DISPOSED_674 = '廃棄';
  const PC_STATUS_CANCELLED_674 = '取消';
  const PC_STATUS_IN_USE_674 = '利用中';

  /** 廃棄・取消 — 採番・671・JBIS 重複等の「稼働対象外」 */
  function buildPcStatusActiveOnlyQuery674() {
    return (
      FC_PC_STATUS +
      ' not in ("' +
      escapeQueryValue(PC_STATUS_DISPOSED_674) +
      '", "' +
      escapeQueryValue(PC_STATUS_CANCELLED_674) +
      '")'
    );
  }

  function isPcStatusInactive674(status) {
    const s = String(status || '').trim();
    return s === PC_STATUS_DISPOSED_674 || s === PC_STATUS_CANCELLED_674;
  }

  function isPcStatusCancelled674(status) {
    return String(status || '').trim() === PC_STATUS_CANCELLED_674;
  }
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

  /** LoginID 厳密一致（大文字小文字区別）。SKYSEA UI・専用一覧のゲート */
  function isSkyseaAdmin674() {
    try {
      const u = kintone.getLoginUser();
      return !!(u && u.code === ADMIN_LOGIN);
    } catch (_e) {
      return false;
    }
  }

  /**
   * §4.2.3a / SPEC 2026-08-06: SKYSEA は `skysea_system_meta` に収容。
   * **admin かつ種別=個人**のときのみグループ＋子（手動完了フィールド含む）を表示。
   * admin でも共有/JR端末/サーバーNAS/その他は非 admin と同様にすべて非表示。
   * 通常は畳んだまま（setGroupFieldOpen false）。editable 時は手動フィールドを編集可。
   * applyVisibilityByType の後に呼ぶこと（グループ再表示を上書きするため）。
   */
  function applySkyseaGroupUi(record, mode) {
    const skyseaCodes = [FC_SKYSEA_GROUP, ...SKYSEA_CHILD_CODES];
    const type = String((record && record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();
    if (!isSkyseaAdmin674() || type !== TYPE_PERSONAL) {
      setFieldsVisibility(skyseaCodes, false);
      return;
    }
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
   * VPN ID/PW は VPNアカウント台帳（734）からのみ更新。PC台帳では手入力不可。
   * `disabled` 未定義のフィールドも kintone record + DOM 両方でロックする。
   * @param {Record<string, object>} record
   * @param {'detail'|'editable'} mode
   */
  function applyVpnFieldUi674(record, mode) {
    const type = String((record && record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();
    if (type !== TYPE_PERSONAL) return;
    if (mode !== 'editable') return;
    for (const code of [FC_VPN_ID, FC_VPN_PW]) {
      const cell = record && record[code];
      if (!cell || typeof cell !== 'object') continue;
      cell.disabled = true;
    }
  }

  const VPN_READONLY_STYLE_ID = 'npl674-vpn-readonly-style';

  function injectVpnReadonlyStyle674() {
    if (document.getElementById(VPN_READONLY_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = VPN_READONLY_STYLE_ID;
    st.textContent =
      '.npl674-vpn-readonly input,.npl674-vpn-readonly textarea{' +
      'background:#f1f5f9!important;color:#64748b!important;cursor:not-allowed!important;' +
      'pointer-events:none!important;-webkit-text-fill-color:#64748b!important;}';
    document.head.appendChild(st);
  }

  function lockVpnFieldDom674(record) {
    injectVpnReadonlyStyle674();
    const type = String((record && record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();
    if (type !== TYPE_PERSONAL) return;
    for (const code of [FC_VPN_ID, FC_VPN_PW]) {
      try {
        const el = tryGetFieldElement674(code);
        if (!el) continue;
        el.classList.add('npl674-vpn-readonly');
        const inputs = el.querySelectorAll('input,textarea');
        for (let i = 0; i < inputs.length; i++) {
          const inp = inputs[i];
          inp.readOnly = true;
          inp.disabled = true;
          inp.setAttribute('aria-readonly', 'true');
          inp.tabIndex = -1;
        }
      } catch (_e) {
        /* ignore */
      }
    }
  }

  function scheduleLockVpnFieldsDom674(record) {
    [0, 80, 250, 600, 1200, 2000].forEach(function (ms) {
      setTimeout(function () {
        lockVpnFieldDom674(record);
      }, ms);
    });
  }

  function syncVpnFieldUiToForm674(record, mode) {
    applyVpnFieldUi674(record, mode);
    if (mode === 'editable') {
      const bag = getRecordFormHolder674();
      if (bag && bag.api && bag.holder && bag.holder.record) {
        try {
          bag.api.set(bag.holder);
        } catch (e) {
          console.warn('[NEW-PC-LEDGER-V1] VPN readonly set:', e.message || e);
        }
      }
      scheduleLockVpnFieldsDom674(record);
    }
  }

  function validateVpnFieldsNotManuallyChanged674(event) {
    const type = String(event.record[FC_ACCOUNT_TYPE]?.value || '').trim();
    if (type !== TYPE_PERSONAL) return null;
    const isEdit = String(event.type || '').indexOf('edit.submit') >= 0;
    const rid = event.record.$id && event.record.$id.value;
    if (isEdit && rid) {
      const prev = snapshotBeforeEdit674[String(rid)];
      if (prev) {
        const curId = trimmedScalarValue674(event.record, FC_VPN_ID);
        const curPw = trimmedScalarValue674(event.record, FC_VPN_PW);
        if (curId !== (prev.vpn_id || '') || curPw !== (prev.vpn_pw || '')) {
          return 'VPN ID / VPNパスワードは VPNアカウント台帳から自動反映されます。PC台帳では直接編集できません。';
        }
      }
      return null;
    }
    if (trimmedScalarValue674(event.record, FC_VPN_ID) || trimmedScalarValue674(event.record, FC_VPN_PW)) {
      return 'VPN ID / VPNパスワードは PC台帳登録時には入力できません。VPNアカウント台帳で登録後に自動反映されます。';
    }
    return null;
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

    // 最終表示は applySkyseaGroupUi が上書き（admin ∧ 個人のみ）。ここで一旦畳む。
    const skyseaVisible = isSkyseaAdmin674() && type === TYPE_PERSONAL;
    const SKYSEA_VISIBILITY_CODES = [FC_SKYSEA_GROUP, ...SKYSEA_CHILD_CODES];

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
      setFieldsVisibility([FC_INTERNAL_GROUP], true);
      setFieldsVisibility(SKYSEA_VISIBILITY_CODES, skyseaVisible);
      return;
    }

    setFieldsVisibility(ALL_SCALAR_FOR_VISIBILITY, true);
    setFieldsVisibility([FC_INTERNAL_GROUP], true);
    setFieldsVisibility(SKYSEA_VISIBILITY_CODES, skyseaVisible);

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

  const HIDE_SIDEBAR_STYLE_ID = 'npl674-hide-record-sidebar';

  /** 詳細画面: 右サイドバー（コメント・履歴）を非表示（公式 API + CSS） */
  function injectHideRecordSidebarStyle674() {
    if (document.getElementById(HIDE_SIDEBAR_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = HIDE_SIDEBAR_STYLE_ID;
    st.textContent =
      '.gaia-argoui-app-show-sidebar,.gaia-argoui-app-sidebar-gaia,.ocean-ui-plugin-comment-gaia{display:none!important;}';
    document.head.appendChild(st);
  }

  function closeRecordSideBar674() {
    injectHideRecordSidebarStyle674();
    try {
      if (kintone.app && kintone.app.record && typeof kintone.app.record.showSideBar === 'function') {
        return kintone.app.record.showSideBar('CLOSED').catch(function () {
          /* noop */
        });
      }
    } catch (e) {
      /* noop */
    }
    return kintone.Promise.resolve();
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

  // ===== 5 台ライセンス上限（仕様書 §4.6.4 / 671 実参照・内部のみ）=====

  /**
   * 赤バナー表示は行わない（浜田 2026-08-18: 表示不要・上限は割当ロジックで厳守）。
   * 既存 DOM が残っていれば除去するだけ。usage_count / M365_LICENSE_LIMIT の判定・満杯切替・
   * fetchAssignable（usage_count<5）・6 台目ブロックは別経路で継続。
   * @returns {Promise<void>}
   */
  function refreshLicenseBannerFrom671(_record) {
    const existing = document.querySelector('#new-pc-ledger-license-banner');
    if (existing) existing.remove();
    return Promise.resolve();
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

  /** trim 後・大文字小文字無視で PC 名が同一か */
  function isSamePcName674(a, b) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  /**
   * **全く同一** `pc_name` の **他** 個人レコード（廃棄・取消以外）。`excludeId` は編集時に自分自身の $id。
   * REST は `pc_name = "…"`（SINGLE_LINE_TEXT）。大文字小文字ゆれはクエリ OR + クライアント突合。
   * @returns {Promise<Array<{id:string,pc_name:string,user_name:string}>>}
   */
  function fetchOtherPersonalSamePcName674(pcName, excludeId) {
    const normalized = String(pcName || '').trim();
    if (!normalized) return Promise.resolve([]);
    const esc = escapeQueryValue(normalized);
    const escU = escapeQueryValue(normalized.toUpperCase());
    const escL = escapeQueryValue(normalized.toLowerCase());
    let nameClause = 'pc_name = "' + esc + '"';
    if (escU !== esc) {
      nameClause = '(pc_name = "' + esc + '" or pc_name = "' + escU + '")';
    }
    if (escL !== esc && escL !== escU) {
      nameClause = '(pc_name = "' + esc + '" or pc_name = "' + escU + '" or pc_name = "' + escL + '")';
    }
    const q =
      'account_type in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '") and ' +
      buildPcStatusActiveOnlyQuery674() +
      ' and ' +
      nameClause +
      ' limit 500';
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
        if (!isSamePcName674(pn, normalized)) continue;
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
   * 個人で他レコードと PC 名が全く同一のとき、ヘッダに赤バナー（詳細・新規・編集）。
   * @returns {Promise<void>}
   */
  function refreshPcNameDupBanner674(record) {
    removePcNameDupBanner674();
    if (!record) return Promise.resolve();
    const type = record[FC_ACCOUNT_TYPE]?.value || '';
    const st = String(record[FC_PC_STATUS]?.value || '').trim();
    if (type !== TYPE_PERSONAL || isPcStatusInactive674(st)) return Promise.resolve();
    const pcn = trimmedScalarValue674(record, FC_PC_NAME);
    if (!pcn) return Promise.resolve();
    const rid = record.$id && record.$id.value != null ? String(record.$id.value) : '';
    const space = getHeaderSpace674();
    if (!space) return Promise.resolve();
    return fetchOtherPersonalSamePcName674(pcn, rid).then(function (others) {
      if (!others.length) return;
      const banner = document.createElement('div');
      banner.id = 'jb674-pc-name-dup-banner';
      banner.style.cssText =
        'background:#f8d7da;border:1px solid #f5c2c7;border-radius:4px;padding:10px 12px;margin:6px 0;' +
        'font-size:13px;line-height:1.45;color:#842029;';
      const title = document.createElement('div');
      title.style.cssText = 'color:#b02a37;font-weight:bold;font-size:14px;margin-bottom:6px;';
      title.textContent = 'PC名重複（登録不可）';
      banner.appendChild(title);
      const lead = document.createElement('div');
      lead.style.marginBottom = '6px';
      lead.innerHTML =
        '全く同じPC名が他レコードにあります／登録不可。PC名「<strong style="color:#b02a37;">' +
        pcn +
        '</strong>」は、他の利用中・保管の個人レコードと重複しています。';
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

  /**
   * 個人で他レコードと PC 名が全く同一のとき、保存をハードブロック。
   * @returns {Promise<'ok'|'cancelled'>}
   */
  function checkPersonalJbisDuplicateBeforeSave674(event) {
    const type = event.record[FC_ACCOUNT_TYPE]?.value || '';
    if (type !== TYPE_PERSONAL) return Promise.resolve('ok');
    const pcn = trimmedScalarValue674(event.record, FC_PC_NAME);
    if (!pcn) return Promise.resolve('ok');
    const rid = event.record.$id && event.record.$id.value != null ? String(event.record.$id.value) : '';
    return fetchOtherPersonalSamePcName674(pcn, rid).then(function (others) {
      return others.length ? 'cancelled' : 'ok';
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
        // desc 取得なので先勝ち＝新しいレコードを優先（後勝ちだと古い値で上書きされる）
        if (k && !Object.prototype.hasOwnProperty.call(map, k)) {
          map[k] = (r.setting_value && r.setting_value.value) || '';
        }
      }
      return map;
    });
  }

  function todayYmd674() {
    const d = new Date();
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function parseYmd674(s) {
    const t = String(s || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
  }

  function isInventoryPeriodActive674(envMap) {
    const start = parseYmd674((envMap && envMap[ENV_PC_INV_PERIOD_START]) || '');
    const end = parseYmd674((envMap && envMap[ENV_PC_INV_PERIOD_END]) || '');
    if (!start || !end) return false;
    const today = todayYmd674();
    return today >= start && today <= end;
  }

  function inventoryPeriodStartYmd674(envMap) {
    const bounds = computeInventoryPeriodBounds674(envMap);
    return bounds.start || '';
  }

  function inventoryPeriodEndYmd674(envMap) {
    const bounds = computeInventoryPeriodBounds674(envMap);
    return bounds.end || '';
  }

  /** 670 期間キー優先。無ければ毎年5/1〜翌4/30 */
  function computeInventoryPeriodBounds674(envMap) {
    const envStart = parseYmd674((envMap && envMap[ENV_PC_INV_PERIOD_START]) || '');
    const envEnd = parseYmd674((envMap && envMap[ENV_PC_INV_PERIOD_END]) || '');
    if (envStart && envEnd) {
      return { start: envStart, end: envEnd };
    }
    const today = todayYmd674();
    const y = parseInt(today.substring(0, 4), 10);
    const mo = parseInt(today.substring(5, 7), 10);
    let startY;
    let endY;
    if (mo >= 5) {
      startY = y;
      endY = y + 1;
    } else {
      startY = y - 1;
      endY = y;
    }
    return {
      start: String(startY) + '-05-01',
      end: String(endY) + '-04-30',
    };
  }

  function isInventoryTargetPcStatus674(record) {
    const st = String((record && record[FC_PC_STATUS] && record[FC_PC_STATUS].value) || '').trim();
    return st === PC_STATUS_IN_USE_674 || st === PC_STATUS_STORAGE;
  }

  function isInventoryTargetAccountType674(record) {
    const t = String((record && record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();
    return t === TYPE_PERSONAL || t === TYPE_SHARED || t === TYPE_JR;
  }

  function isInventoryTargetRecord674(record) {
    return isInventoryTargetPcStatus674(record) && isInventoryTargetAccountType674(record);
  }

  /** 台帳上の表記ゆれ → マスタ部署名 */
  const INVENTORY674_DEPT_ALIASES = {
    人事研修部付出向者: '人事研修部出向者',
  };

  /** 台帳 group_name（ローマ字コード等）→ マスタグループ名 */
  const INVENTORY674_GROUP_ALIASES = {
    honsya: '本社',
    tohoku: '東北支店',
    'kan-etsu': '関越支店',
    tokyo: '東京支店',
    tokai: '東海支店',
    reform: 'リフォーム統括事業部',
    tekko: '鉄構支店',
    wangan: '湾岸工事所',
  };

  function normalizeInventoryOrgDeptLabel674(s) {
    return String(s || '')
      .normalize('NFKC')
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function inventoryOrgDeptRowKey674(group, dept) {
    return normalizeInventoryOrgDeptLabel674(group) + '\t' + normalizeInventoryOrgDeptLabel674(dept);
  }

  function canonicalInventoryDept674(deptName) {
    const d = normalizeInventoryOrgDeptLabel674(deptName);
    if (!d) return '';
    if (INVENTORY674_DEPT_ALIASES[d]) return INVENTORY674_DEPT_ALIASES[d];
    return d;
  }

  function canonicalInventoryGroup674(groupName) {
    const g = normalizeInventoryOrgDeptLabel674(groupName);
    if (!g) return '';
    const low = g.toLowerCase();
    if (INVENTORY674_GROUP_ALIASES[low]) return INVENTORY674_GROUP_ALIASES[low];
    if (INVENTORY674_GROUP_ALIASES[g]) return INVENTORY674_GROUP_ALIASES[g];
    return g;
  }

  /** レコードの所属グループ／所属名を、棚卸状況マスタ行へ寄せる（未一致は null） */
  function resolveInventoryOrgDeptRow674(record) {
    const groupRaw = normalizeInventoryOrgDeptLabel674(
      (record && record[FC_GROUP_NAME] && record[FC_GROUP_NAME].value) || '',
    );
    const group = canonicalInventoryGroup674(groupRaw);
    const dept = canonicalInventoryDept674(
      (record && record[FC_DEPT_NAME] && record[FC_DEPT_NAME].value) || '',
    );
    if (!dept && !groupRaw && !group) return null;

    // 部署名がマスタ上ユニークなら部署だけで確定（group_name の表記ゆれで落とさない）
    if (dept) {
      const hits = [];
      for (let i = 0; i < INVENTORY674_ORG_DEPT_ROWS.length; i++) {
        const row = INVENTORY674_ORG_DEPT_ROWS[i];
        if (normalizeInventoryOrgDeptLabel674(row.dept) === dept) hits.push(row);
      }
      if (hits.length === 1) return hits[0];
      if (hits.length > 1) {
        for (let h = 0; h < hits.length; h++) {
          const rg = normalizeInventoryOrgDeptLabel674(hits[h].group);
          if (group === rg || groupRaw === rg || group === dept || groupRaw === dept) return hits[h];
        }
        return hits[0];
      }
    }

    // 支店本体: 部署空／ハイフンで所属グループ＝支店名（日本語 or コード）
    for (let j = 0; j < INVENTORY674_ORG_DEPT_ROWS.length; j++) {
      const row2 = INVENTORY674_ORG_DEPT_ROWS[j];
      const rg2 = normalizeInventoryOrgDeptLabel674(row2.group);
      const rd2 = normalizeInventoryOrgDeptLabel674(row2.dept);
      if (
        rg2 === rd2 &&
        (group === rg2 || groupRaw === rg2 || dept === rd2) &&
        (!dept || dept === rd2 || dept === '－' || dept === '-')
      ) {
        return row2;
      }
    }
    return null;
  }

  function isInventoryDoneInPeriod674(record, periodStart, periodEnd) {
    const latest = parseYmd674(
      (record && record[FC_LATEST_INVENTORY_DATE] && record[FC_LATEST_INVENTORY_DATE].value) || '',
    );
    if (!latest || !periodStart || !periodEnd) return false;
    return latest >= periodStart && latest <= periodEnd;
  }

  /**
   * 個人PCを廃棄／買替するとき、SKYSEA クライアント削除の「未了」を付ける。
   * **SKYSEA 対応が「完了」（＝導入済）の端末のみ**対象。未導入（未了／空）は対象外（浜田 2026-08-11）。
   * @param {object} putRecord PUT 用レコード断片
   * @param {string} accountType
   * @param {object} [srcRecord] 廃棄前レコード（skysea_manual_done 判定用）
   */
  function markSkyseaClientDeletePending674(putRecord, accountType, srcRecord) {
    const out = putRecord || {};
    if (accountType !== TYPE_PERSONAL) return out;
    const manualDone = String(
      (srcRecord && srcRecord[FC_SKYSEA_MANUAL_DONE] && srcRecord[FC_SKYSEA_MANUAL_DONE].value) ||
        (out[FC_SKYSEA_MANUAL_DONE] && out[FC_SKYSEA_MANUAL_DONE].value) ||
        '',
    ).trim();
    if (manualDone !== SKYSEA_MANUAL_DONE_COMPLETE) return out;
    const cur = String(
      (out[FC_SKYSEA_CLIENT_DELETE_STATUS] && out[FC_SKYSEA_CLIENT_DELETE_STATUS].value) ||
        (srcRecord &&
          srcRecord[FC_SKYSEA_CLIENT_DELETE_STATUS] &&
          srcRecord[FC_SKYSEA_CLIENT_DELETE_STATUS].value) ||
        '',
    ).trim();
    if (cur === SKYSEA_CLIENT_DELETE_DONE) return out;
    out[FC_SKYSEA_CLIENT_DELETE_STATUS] = { value: SKYSEA_CLIENT_DELETE_PENDING };
    return out;
  }

  function needsSkyseaClientDeleteAfterDispose674(accountType, srcRecord) {
    if (accountType !== TYPE_PERSONAL) return false;
    const manualDone = String(
      (srcRecord && srcRecord[FC_SKYSEA_MANUAL_DONE] && srcRecord[FC_SKYSEA_MANUAL_DONE].value) || '',
    ).trim();
    if (manualDone !== SKYSEA_MANUAL_DONE_COMPLETE) return false;
    const cur = String(
      (srcRecord &&
        srcRecord[FC_SKYSEA_CLIENT_DELETE_STATUS] &&
        srcRecord[FC_SKYSEA_CLIENT_DELETE_STATUS].value) ||
        '',
    ).trim();
    return cur !== SKYSEA_CLIENT_DELETE_DONE;
  }

  function ensureInventoryPeriodLoaded674() {
    return loadEnv670Map()
      .then(function (map) {
        npl674InventoryEnvMap674 = map;
        npl674InventoryPeriodActive674 = isInventoryPeriodActive674(map);
        return npl674InventoryPeriodActive674;
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] inventory period', e);
        npl674InventoryPeriodActive674 = false;
        return false;
      });
  }

  function getLoginUserDisplayName674() {
    try {
      const u = kintone.getLoginUser();
      return String((u && (u.name || u.code)) || '').trim();
    } catch (_e) {
      return '';
    }
  }

  const INV_HIST_CELL_TYPES_674 = {
    [FC_INV_HIST_DATE]: 'DATE',
    [FC_INV_HIST_PERSON]: 'SINGLE_LINE_TEXT',
    [FC_INV_HIST_LOCATION]: 'SINGLE_LINE_TEXT',
    [FC_INV_HIST_METHOD]: 'DROP_DOWN',
  };

  function invHistCell674(code, value) {
    return { type: INV_HIST_CELL_TYPES_674[code], value: value };
  }

  /** submit 返却用: サブテーブル本体と各セルに kintone 期待の type を付与 */
  function normalizeInventoryHistoryForEvent674(histField) {
    if (!histField) return;
    histField.type = 'SUBTABLE';
    const rows = Array.isArray(histField.value) ? histField.value : [];
    histField.value = rows.map(function (row) {
      const v = (row && row.value) || {};
      const nv = {};
      Object.keys(INV_HIST_CELL_TYPES_674).forEach(function (code) {
        const cell = v[code];
        const val =
          cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'value')
            ? cell.value
            : '';
        nv[code] = invHistCell674(code, val == null ? '' : val);
      });
      const out = { value: nv };
      if (row.id != null && String(row.id) !== '') {
        out.id = String(row.id);
      }
      return out;
    });
  }

  function cloneSubtableRows674(subField) {
    const rows = (subField && subField.value) || [];
    return rows.map(function (row) {
      const v = row.value || {};
      const nv = {};
      Object.keys(v).forEach(function (code) {
        const cell = v[code];
        if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'value')) {
          const nc = { value: cell.value };
          if (cell.type) {
            nc.type = cell.type;
          } else if (INV_HIST_CELL_TYPES_674[code]) {
            nc.type = INV_HIST_CELL_TYPES_674[code];
          }
          nv[code] = nc;
        }
      });
      const out = { value: nv };
      // 既存行 id を残さないと PUT 時に全行削除→再作成になり、検証エラー（入力内容が正しくありません）になりやすい
      if (row.id != null && String(row.id) !== '') {
        out.id = String(row.id);
      }
      return out;
    });
  }

  /** REST PUT 用: `{ type, value }` ではなく `{ value }` のみ（type 付きは CB_VA01 になり得る） */
  function inventoryHistPutField674(histField) {
    const rows = (histField && Array.isArray(histField.value) ? histField.value : []) || [];
    const filtered = rows
      .filter(function (row) {
        const v = (row && row.value) || {};
        const date = parseYmd674(v[FC_INV_HIST_DATE] && v[FC_INV_HIST_DATE].value);
        const person = String((v[FC_INV_HIST_PERSON] && v[FC_INV_HIST_PERSON].value) || '').trim();
        const location = String((v[FC_INV_HIST_LOCATION] && v[FC_INV_HIST_LOCATION].value) || '').trim();
        const method = String((v[FC_INV_HIST_METHOD] && v[FC_INV_HIST_METHOD].value) || '').trim();
        if (!date && !person && !location && !method) return false;
        return true;
      })
      .map(function (row) {
        const v = (row && row.value) || {};
        const nv = {};
        Object.keys(INV_HIST_CELL_TYPES_674).forEach(function (code) {
          const cell = v[code];
          if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'value')) {
            nv[code] = { value: cell.value };
          }
        });
        const out = { value: nv };
        if (row.id != null && String(row.id) !== '') {
          out.id = String(row.id);
        }
        return out;
      });
    return { value: filtered };
  }

  /**
   * 部分 PUT でも必須フィールドが空の既存レコードは検証エラーになる。
   * **個人のみ**: SKYSEA対応が空のときは既定「未了」を同梱して棚卸保存を通す（値がある場合は触らない）。
   */
  function withInventoryRequiredBackfill674(rec, putRecord) {
    const out = putRecord || {};
    const type = String((rec && rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '').trim();
    if (type !== TYPE_PERSONAL) return out;
    const done = String(
      (rec && rec[FC_SKYSEA_MANUAL_DONE] && rec[FC_SKYSEA_MANUAL_DONE].value) || '',
    ).trim();
    if (!done) {
      out[FC_SKYSEA_MANUAL_DONE] = { value: SKYSEA_MANUAL_DONE_PENDING };
    }
    return out;
  }

  /**
   * SKYSEA対応（skysea_manual_done）は **種別=個人のみ** 対象。
   * 個人: 空なら既定「未了」を補完（保存時必須検証対策）。disabled=true のまま値を書くと検証エラーになるため一時解除。
   * 個人以外（共有/JR端末/サーバーNAS/その他）: 対象外。既存 cell があれば skysea_manual_* を空にクリア（cell 無しは作らない）。
   * @param {Record<string, object>} record
   */
  function ensureSkyseaManualDoneOnRecord674(record) {
    if (!record) return;
    const type = String((record[FC_ACCOUNT_TYPE] && record[FC_ACCOUNT_TYPE].value) || '').trim();

    if (type !== TYPE_PERSONAL) {
      [FC_SKYSEA_MANUAL_DONE, FC_SKYSEA_MANUAL_DATE, FC_SKYSEA_MANUAL_HANDLER].forEach(function (code) {
        const cell = record[code];
        if (!cell || typeof cell !== 'object') return;
        const hadOwn = Object.prototype.hasOwnProperty.call(cell, 'disabled');
        const prev = hadOwn ? cell.disabled : undefined;
        if (hadOwn && cell.disabled === true) {
          cell.disabled = false;
        }
        try {
          cell.value = '';
        } finally {
          if (hadOwn) {
            cell.disabled = prev;
          }
        }
      });
      return;
    }

    let cell = record[FC_SKYSEA_MANUAL_DONE];
    // ACL everyone=NONE 等で cell 自体が無いときも、個人は未了をレコード上に載せる
    if (!cell || typeof cell !== 'object') {
      record[FC_SKYSEA_MANUAL_DONE] = { value: SKYSEA_MANUAL_DONE_PENDING };
      return;
    }
    const cur = String((cell.value != null ? cell.value : '') || '').trim();
    if (cur) return;
    const hadOwn = Object.prototype.hasOwnProperty.call(cell, 'disabled');
    const prev = hadOwn ? cell.disabled : undefined;
    if (hadOwn && cell.disabled === true) {
      cell.disabled = false;
    }
    try {
      cell.value = SKYSEA_MANUAL_DONE_PENDING;
    } finally {
      if (hadOwn) {
        cell.disabled = prev;
      }
    }
  }

  function formatKintoneApiError674(err) {
    if (!err) return '不明なエラー';
    if (typeof err === 'string') return err;
    let msg = String(err.message || err.error || '').trim();
    const errors = err.errors;
    if (errors && typeof errors === 'object') {
      const parts = [];
      Object.keys(errors).forEach(function (k) {
        const e = errors[k];
        let m = e;
        if (e && typeof e === 'object') {
          m = e.messages || e.message || JSON.stringify(e);
        }
        parts.push(k + ': ' + (Array.isArray(m) ? m.join(' / ') : String(m)));
      });
      if (parts.length) {
        msg = (msg ? msg + ' — ' : '') + parts.join('; ');
      }
    }
    return msg || String(err);
  }

  function appendInventoryHistoryRow674(subField, dateYmd, person, location, method) {
    const date = parseYmd674(dateYmd);
    const per = String(person || '').trim();
    if (!date || !per) {
      throw new Error('棚卸日と棚卸者を入力してください。');
    }
    const rows = cloneSubtableRows674(subField);
    rows.push({
      value: {
        [FC_INV_HIST_DATE]: invHistCell674(FC_INV_HIST_DATE, date),
        [FC_INV_HIST_PERSON]: invHistCell674(FC_INV_HIST_PERSON, per),
        [FC_INV_HIST_LOCATION]: invHistCell674(
          FC_INV_HIST_LOCATION,
          String(location || '').trim(),
        ),
        [FC_INV_HIST_METHOD]: invHistCell674(FC_INV_HIST_METHOD, method),
      },
    });
    subField.value = rows;
  }

  function inventoryHistHasDatedRow674(histField) {
    const rows = (histField && histField.value) || [];
    for (let i = 0; i < rows.length; i++) {
      if (getHistRowDateYmd674(rows[i])) return true;
    }
    return false;
  }

  function maxInventoryHistDate674(histField) {
    let max = '';
    const rows = (histField && histField.value) || [];
    for (let i = 0; i < rows.length; i++) {
      const d = getHistRowDateYmd674(rows[i]);
      if (d && d > max) max = d;
    }
    return max;
  }

  /** 最新棚卸日は履歴の最大日で自動維持（手入力させない） */
  function syncLatestInventoryDateFromHistory674(record) {
    if (!record) return;
    const hist = record[FC_INVENTORY_HISTORY] || { type: 'SUBTABLE', value: [] };
    const max = maxInventoryHistDate674(hist);
    if (!record[FC_LATEST_INVENTORY_DATE]) {
      record[FC_LATEST_INVENTORY_DATE] = { type: 'DATE', value: max || '' };
    } else {
      record[FC_LATEST_INVENTORY_DATE].value = max || '';
    }
  }

  function isInventoryEligibleAccountType674(accountType) {
    return (
      accountType === TYPE_PERSONAL || accountType === TYPE_SHARED || accountType === TYPE_JR
    );
  }

  /**
   * 新規登録時: 棚卸対象種別なら履歴が空のとき登録日で1行自動追加。
   * 編集時: 最新棚卸日だけ入っていて履歴が空なら、その日で1行補完（迷い入力の救済）。
   */
  function ensureInventoryHistoryOnSubmit674(event) {
    const rec = event.record;
    if (!rec) return;
    const type = String((rec[FC_ACCOUNT_TYPE] && rec[FC_ACCOUNT_TYPE].value) || '').trim();
    if (isInventoryEligibleAccountType674(type)) {
      if (!rec[FC_INVENTORY_HISTORY]) {
        rec[FC_INVENTORY_HISTORY] = { type: 'SUBTABLE', value: [] };
      }
      const hist = rec[FC_INVENTORY_HISTORY];
      const hasHist = inventoryHistHasDatedRow674(hist);
      const isCreate =
        event.type === 'app.record.create.submit' ||
        event.type === 'mobile.app.record.create.submit';
      if (!hasHist) {
        const seedDate = isCreate
          ? todayYmd674()
          : parseYmd674(
              (rec[FC_LATEST_INVENTORY_DATE] && rec[FC_LATEST_INVENTORY_DATE].value) || '',
            );
        if (seedDate) {
          const person =
            getLoginUserDisplayName674() ||
            String((rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '').trim() ||
            '登録者';
          appendInventoryHistoryRow674(hist, seedDate, person, '', INV_METHOD_INDIVIDUAL);
        }
      }
    }
    syncLatestInventoryDateFromHistory674(rec);
    if (rec[FC_INVENTORY_HISTORY]) {
      normalizeInventoryHistoryForEvent674(rec[FC_INVENTORY_HISTORY]);
    }
  }

  function ymdCalendarYear674(ymd) {
    const t = parseYmd674(ymd);
    if (!t) return NaN;
    return parseInt(t.substring(0, 4), 10);
  }

  function getHistRowDateYmd674(row) {
    const cell = row && row.value && row.value[FC_INV_HIST_DATE];
    return parseYmd674(cell && cell.value);
  }

  function historyHasCalendarYear674(histField, year) {
    const rows = (histField && histField.value) || [];
    for (let i = 0; i < rows.length; i++) {
      const d = getHistRowDateYmd674(rows[i]);
      if (d && ymdCalendarYear674(d) === year) return true;
    }
    return false;
  }

  function removeHistoryRowsForCalendarYear674(subField, year) {
    const rows = cloneSubtableRows674(subField);
    subField.value = rows.filter(function (row) {
      const d = getHistRowDateYmd674(row);
      if (!d) return true;
      return ymdCalendarYear674(d) !== year;
    });
  }

  function assertInventoryDateOk674(ymd) {
    const t = parseYmd674(ymd);
    if (!t) throw new Error('棚卸日を正しく入力してください（YYYY-MM-DD）。');
    if (t > todayYmd674()) throw new Error('棚卸日に未来の日付は指定できません。');
    return t;
  }

  function applyInventorySaveToHist674(hist, dateYmd, person, location, method, opts) {
    const date = assertInventoryDateOk674(dateYmd);
    const year = ymdCalendarYear674(date);
    const owOpts = opts || {};
    const hasYear = historyHasCalendarYear674(hist, year);
    if (hasYear && !owOpts.overwriteYear) {
      const err = new Error('本年度の棚卸履歴が既にあります。');
      err.code = 'NEED_OVERWRITE';
      return { skipped: true, dateYmd: date, year: year };
    }
    if (hasYear && owOpts.overwriteYear) {
      removeHistoryRowsForCalendarYear674(hist, year);
    }
    appendInventoryHistoryRow674(hist, date, person, location, method);
    return { skipped: false, dateYmd: date, year: year };
  }

  function buildInventoryTargetStatusQueryPart674() {
    return (
      '(' +
      FC_PC_STATUS +
      ' in ("' +
      escapeQueryValue(PC_STATUS_IN_USE_674) +
      '", "' +
      escapeQueryValue(PC_STATUS_STORAGE) +
      '"))'
    );
  }

  function buildInventoryTargetAccountTypeQueryPart674() {
    return (
      FC_ACCOUNT_TYPE +
      ' in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '", "' +
      escapeQueryValue(TYPE_SHARED) +
      '", "' +
      escapeQueryValue(TYPE_JR) +
      '")'
    );
  }

  function buildInventoryTargetQueryPart674() {
    return buildInventoryTargetStatusQueryPart674() + ' and ' + buildInventoryTargetAccountTypeQueryPart674();
  }

  function buildUninventoriedQuery674(envMap) {
    const bounds = computeInventoryPeriodBounds674(envMap || npl674InventoryEnvMap674);
    const start = bounds.start;
    const parts = [buildInventoryTargetQueryPart674()];
    if (start) {
      parts.push(
        '(' +
          FC_LATEST_INVENTORY_DATE +
          ' = "" or ' +
          FC_LATEST_INVENTORY_DATE +
          ' < "' +
          escapeQueryValue(start) +
          '")',
      );
    } else {
      parts.push('(' + FC_LATEST_INVENTORY_DATE + ' = "")');
    }
    return parts.join(' and ');
  }

  function fetchRecord674ById674(recordId, fields) {
    return kintoneApiGet('/k/v1/record.json', {
      app: kintone.app.getId(),
      id: recordId,
      fields: fields,
    }).then(function (res) {
      return res.record;
    });
  }

  function saveInventoryToRecord674(recordId, person, location, method, opts) {
    const app = kintone.app.getId();
    const o = opts || {};
    const dateYmd = assertInventoryDateOk674(o.dateYmd || todayYmd674());
    const year = ymdCalendarYear674(dateYmd);
    const fields = [
      FC_INVENTORY_HISTORY,
      FC_LATEST_INVENTORY_DATE,
      FC_PC_STATUS,
      FC_USER_NAME,
      FC_SKYSEA_MANUAL_DONE,
    ];
    return fetchRecord674ById674(recordId, fields).then(function (rec) {
      if (!isInventoryTargetRecord674(rec)) {
        throw new Error('棚卸対象外です（利用中・保管かつ個人・共有・JR端末のみ）。');
      }
      const hist = rec[FC_INVENTORY_HISTORY] || { type: 'SUBTABLE', value: [] };
      let loc = String(location || '').trim();
      let per = String(person || '').trim();
      if (o.takeout) {
        loc = loc ? loc + '（持ち出し）' : '（持ち出し）';
      }
      if (o.selfConfirm) {
        const un = String((rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '').trim();
        if (un) per = un;
      }
      if (!per) throw new Error('棚卸者を入力してください。');
      let overwriteYear = false;
      if (historyHasCalendarYear674(hist, year)) {
        if (o.allowOverwrite) {
          overwriteYear = true;
        } else {
          const ok = window.confirm(
            year +
              '年（1月1日〜12月31日）の棚卸履歴が既にあります。上書きしますか？\n' +
              '（OK＝当該年の履歴を削除して新規記録、キャンセル＝保存しない）',
          );
          if (!ok) {
            const skipErr = new Error('棚卸をキャンセルしました。');
            skipErr.code = 'SKIP';
            throw skipErr;
          }
          overwriteYear = true;
        }
      }
      const result = applyInventorySaveToHist674(hist, dateYmd, per, loc, method, {
        overwriteYear: overwriteYear,
      });
      if (result.skipped) {
        const skipErr = new Error('棚卸をキャンセルしました。');
        skipErr.code = 'SKIP';
        throw skipErr;
      }
      return kintoneApiPut('/k/v1/record.json', {
        app: app,
        id: recordId,
        record: withInventoryRequiredBackfill674(rec, {
          [FC_INVENTORY_HISTORY]: inventoryHistPutField674(hist),
          [FC_LATEST_INVENTORY_DATE]: { value: dateYmd },
        }),
      }).catch(function (err) {
        const e = new Error(formatKintoneApiError674(err));
        e.cause = err;
        throw e;
      });
    });
  }

  function showInventoryLoading674(show, text) {
    const id = 'npl674-inventory-loading-overlay';
    let ld = document.getElementById(id);
    if (!show) {
      if (ld) ld.remove();
      return;
    }
    if (!ld) {
      ld = document.createElement('div');
      ld.id = id;
      ld.style.cssText =
        'position:fixed;inset:0;z-index:2147483100;background:rgba(15,23,42,.45);' +
        'display:flex;align-items:center;justify-content:center;font:600 15px system-ui,sans-serif;color:#fff;';
      document.body.appendChild(ld);
    }
    ld.textContent = text || '処理中…';
    ld.style.display = 'flex';
  }

  function openInventoryIndividualModal674(record) {
    const rid = record && record.$id && record.$id.value;
    if (!rid) {
      window.alert('レコード ID を取得できません。');
      return;
    }
    const modalId = 'npl674-inventory-individual-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText =
      'position:fixed;inset:0;z-index:2147483050;background:rgba(15,23,42,.5);' +
      'display:flex;align-items:center;justify-content:center;padding:16px;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#fff;border-radius:10px;padding:20px 22px;max-width:440px;width:100%;' +
      'box-shadow:0 12px 40px rgba(15,23,42,.25);font-family:system-ui,sans-serif;';

    const h = document.createElement('h3');
    h.style.cssText = 'margin:0 0 12px;font-size:16px;color:#0f172a;';
    h.textContent = '個別棚卸 — ' + String((record[FC_PC_NAME] && record[FC_PC_NAME].value) || '');

    const lblPerson = document.createElement('label');
    lblPerson.style.cssText = 'display:block;font-size:12px;font-weight:700;margin:8px 0 4px;';
    lblPerson.textContent = '棚卸者';
    const inpPerson = document.createElement('input');
    inpPerson.type = 'text';
    inpPerson.value = getLoginUserDisplayName674();
    inpPerson.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;';

    const lblLoc = document.createElement('label');
    lblLoc.style.cssText = 'display:block;font-size:12px;font-weight:700;margin:12px 0 4px;';
    lblLoc.textContent = '設置場所';
    const inpLoc = document.createElement('input');
    inpLoc.type = 'text';
    inpLoc.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;';

    const lblDate = document.createElement('label');
    lblDate.style.cssText = 'display:block;font-size:12px;font-weight:700;margin:12px 0 4px;';
    lblDate.textContent = '棚卸日';
    const inpDate = document.createElement('input');
    inpDate.type = 'date';
    inpDate.value = todayYmd674();
    inpDate.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;';

    const rowChk = document.createElement('div');
    rowChk.style.cssText = 'margin:12px 0;font-size:13px;';
    const lineSelf = document.createElement('div');
    lineSelf.style.marginBottom = '6px';
    const chkSelf = document.createElement('input');
    chkSelf.type = 'checkbox';
    chkSelf.id = 'npl674-inv-self';
    const lblSelf = document.createElement('label');
    lblSelf.htmlFor = 'npl674-inv-self';
    lblSelf.textContent = ' 本人確認（棚卸者＝利用者名）';
    lineSelf.appendChild(chkSelf);
    lineSelf.appendChild(lblSelf);
    const lineTake = document.createElement('div');
    const chkTake = document.createElement('input');
    chkTake.type = 'checkbox';
    chkTake.id = 'npl674-inv-takeout';
    const lblTake = document.createElement('label');
    lblTake.htmlFor = 'npl674-inv-takeout';
    lblTake.textContent = ' 持ち出し';
    lineTake.appendChild(chkTake);
    lineTake.appendChild(lblTake);
    rowChk.appendChild(lineSelf);
    rowChk.appendChild(lineTake);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:16px;';
    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.textContent = 'キャンセル';
    btnCancel.style.cssText = 'padding:6px 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;cursor:pointer;';
    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.textContent = '棚卸を記録';
    btnOk.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#059669;color:#fff;font-weight:700;cursor:pointer;';

    btnCancel.addEventListener('click', function () {
      modal.remove();
    });
    btnOk.addEventListener('click', function () {
      btnOk.disabled = true;
      showInventoryLoading674(true, '保存中…');
      saveInventoryToRecord674(rid, inpPerson.value, inpLoc.value, INV_METHOD_INDIVIDUAL, {
        takeout: chkTake.checked,
        selfConfirm: chkSelf.checked,
        dateYmd: inpDate.value,
      })
        .then(function () {
          showInventoryLoading674(false);
          modal.remove();
          window.alert('棚卸を記録しました。');
          location.reload();
        })
        .catch(function (e) {
          showInventoryLoading674(false);
          btnOk.disabled = false;
          if (e && e.code === 'SKIP') return;
          window.alert('棚卸の保存に失敗: ' + (e && e.message ? e.message : String(e)));
        });
    });

    btnRow.appendChild(btnCancel);
    btnRow.appendChild(btnOk);
    box.appendChild(h);
    box.appendChild(lblPerson);
    box.appendChild(inpPerson);
    box.appendChild(lblLoc);
    box.appendChild(inpLoc);
    box.appendChild(lblDate);
    box.appendChild(inpDate);
    box.appendChild(rowChk);
    box.appendChild(btnRow);
    modal.appendChild(box);
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function createInventoryIndividualButton674(record) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '📋 棚卸';
    btn.setAttribute('aria-label', '個別棚卸');
    btn.style.cssText =
      'margin:4px 8px 4px 0;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;border-radius:6px;' +
      'border:1px solid #047857;background:linear-gradient(165deg,#34d399 0%,#059669 55%,#047857 100%);color:#fff;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openInventoryIndividualModal674(record);
    });
    return btn;
  }

  function fetchInventoryRecordsPaged674(queryCond, fields) {
    const app = kintone.app.getId();
    const all = [];
    const flds = fields || [
      '$id',
      FC_PC_NAME,
      FC_USER_NAME,
      FC_DEPT_NAME,
      FC_PC_STATUS,
      FC_LATEST_INVENTORY_DATE,
    ];
    return new Promise(function (resolve, reject) {
      function page(off) {
        const order = ' order by ' + FC_DEPT_NAME + ' asc, ' + FC_PC_NAME + ' asc limit 500 offset ' + off;
        const q = (String(queryCond || '').trim() || buildInventoryTargetQueryPart674()) + order;
        kintone
          .api(kintone.api.url('/k/v1/records', true), 'GET', { app: app, query: q, fields: flds })
          .then(function (res) {
            const recs = res.records || [];
            for (let i = 0; i < recs.length; i++) all.push(recs[i]);
            if (recs.length < 500) resolve(all);
            else page(off + 500);
          })
          .catch(reject);
      }
      page(0);
    });
  }

  function putInventoryRecordsBulk674(updates) {
    const app = kintone.app.getId();
    const chunk = 100;
    let idx = 0;
    return new Promise(function (resolve, reject) {
      function next() {
        if (idx >= updates.length) {
          resolve();
          return;
        }
        const slice = updates.slice(idx, idx + chunk);
        idx += chunk;
        kintone
          .api(kintone.api.url('/k/v1/records', true), 'PUT', { app: app, records: slice })
          .then(function () {
            next();
          })
          .catch(function (err) {
            const e = new Error(formatKintoneApiError674(err));
            e.cause = err;
            reject(e);
          });
      }
      next();
    });
  }

  /** 行上書きが空文字のときは共通値にフォールバック（共通のみ入力したのに履歴が空になる不具合対策） */
  function effectiveBulkField674(overrideVal, defaultVal) {
    if (overrideVal != null && String(overrideVal).trim() !== '') {
      return String(overrideVal).trim();
    }
    return String(defaultVal || '').trim();
  }

  /** 保存時は画面上の行入力を正とする（共通欄だけ変更して行欄が古い「管理者」のまま残る不具合対策） */
  function resolveBulkRowFields674(recordId, defaultPerson, defaultLocation, defaultDate, overrides, rowUiById) {
    const id = String(recordId);
    const ov = overrides[id] || {};
    const ui = rowUiById && rowUiById[id];
    let per = ui ? String(ui.inpP.value || '').trim() : '';
    let loc = ui ? String(ui.inpL.value || '').trim() : '';
    let date = ui && ui.inpD ? String(ui.inpD.value || '').trim() : '';
    if (!per) per = effectiveBulkField674(ov.person, defaultPerson);
    if (!loc) loc = effectiveBulkField674(ov.location, defaultLocation);
    if (!date) date = effectiveBulkField674(ov.date, defaultDate);
    return { per: per, loc: loc, date: date };
  }

  /** 一括棚卸は既存履歴に追記するため、PUT 前に各レコードのサブテーブルを取得してマージ */
  function saveBulkInventoryMerged674(
    records,
    defaultPerson,
    defaultLocation,
    defaultDate,
    checkedIds,
    rowOverrides,
    rowUiById,
  ) {
    const checked = checkedIds instanceof Set ? checkedIds : new Set();
    const ids = [];
    records.forEach(function (rec) {
      const id = rec.$id && rec.$id.value;
      if (id && checked.has(String(id))) ids.push(id);
    });
    if (!ids.length) throw new Error('棚卸する行にチェックを付けてください。');
    showInventoryLoading674(true, '棚卸を保存中…');
    const fields = [FC_INVENTORY_HISTORY, FC_PC_STATUS, FC_PC_NAME, FC_SKYSEA_MANUAL_DONE];
    return Promise.all(
      ids.map(function (id) {
        return fetchRecord674ById674(id, fields);
      }),
    ).then(function (fullRecs) {
      const defPer = String(defaultPerson || '').trim();
      const defLoc = String(defaultLocation || '').trim();
      const defDate = String(defaultDate || '').trim() || todayYmd674();
      if (!defPer) throw new Error('一括棚卸の棚卸者を入力してください。');
      assertInventoryDateOk674(defDate);
      const overrides = rowOverrides || Object.create(null);
      const resolvedById = Object.create(null);
      const needsOverwrite = [];

      for (let i = 0; i < fullRecs.length; i++) {
        const rec = fullRecs[i];
        const id = rec.$id && rec.$id.value;
        if (!id || !isInventoryTargetRecord674(rec)) continue;
        const sid = String(id);
        const resolved = resolveBulkRowFields674(sid, defPer, defLoc, defDate, overrides, rowUiById);
        const dateYmd = assertInventoryDateOk674(resolved.date || defDate);
        const year = ymdCalendarYear674(dateYmd);
        const hist = rec[FC_INVENTORY_HISTORY] || { type: 'SUBTABLE', value: [] };
        resolvedById[sid] = {
          per: resolved.per || defPer,
          loc: resolved.loc,
          dateYmd: dateYmd,
          year: year,
          hist: hist,
          pcName: String((rec[FC_PC_NAME] && rec[FC_PC_NAME].value) || sid),
        };
        if (historyHasCalendarYear674(hist, year)) {
          needsOverwrite.push({ id: sid, pcName: resolvedById[sid].pcName, year: year });
        }
      }

      const overwriteAllowedIds = new Set();
      if (needsOverwrite.length) {
        const lines = needsOverwrite.slice(0, 10).map(function (x) {
          return '・' + x.pcName + '（' + x.year + '年）';
        });
        let msg =
          needsOverwrite.length +
          '件のPCに、棚卸日の年（本年度）の履歴が既にあります。上書きしますか？\n' +
          '（OK＝該当PCのみ当該年の履歴を削除して新規記録、キャンセル＝該当PCはスキップ）\n\n';
        msg += lines.join('\n');
        if (needsOverwrite.length > 10) {
          msg += '\n…他 ' + (needsOverwrite.length - 10) + ' 件';
        }
        if (window.confirm(msg)) {
          needsOverwrite.forEach(function (x) {
            overwriteAllowedIds.add(x.id);
          });
        }
      }

      const puts = [];
      for (let j = 0; j < fullRecs.length; j++) {
        const rec = fullRecs[j];
        const id = rec.$id && rec.$id.value;
        if (!id || !isInventoryTargetRecord674(rec)) continue;
        const sid = String(id);
        const row = resolvedById[sid];
        if (!row) continue;
        const hasYear = historyHasCalendarYear674(row.hist, row.year);
        if (hasYear && !overwriteAllowedIds.has(sid)) continue;
        applyInventorySaveToHist674(row.hist, row.dateYmd, row.per, row.loc, INV_METHOD_BULK, {
          overwriteYear: hasYear && overwriteAllowedIds.has(sid),
        });
        puts.push({
          id: id,
          record: withInventoryRequiredBackfill674(rec, {
            [FC_INVENTORY_HISTORY]: inventoryHistPutField674(row.hist),
            [FC_LATEST_INVENTORY_DATE]: { value: row.dateYmd },
          }),
        });
      }
      if (!puts.length) {
        throw new Error('保存対象がありません（上書きをキャンセルした行のみ等）。');
      }
      return putInventoryRecordsBulk674(puts);
    });
  }

  function fetchDistinctDeptNames674() {
    return fetchInventoryRecordsPaged674(buildInventoryTargetQueryPart674(), [FC_DEPT_NAME]).then(
      function (recs) {
        const set = new Set();
        recs.forEach(function (r) {
          const d = String((r[FC_DEPT_NAME] && r[FC_DEPT_NAME].value) || '').trim();
          if (d) set.add(d);
        });
        return [...set].sort(function (a, b) {
          return a.localeCompare(b, 'ja');
        });
      },
    );
  }

  function openInventoryBulkModal674() {
    const modalId = 'npl674-inventory-bulk-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText =
      'position:fixed;inset:0;z-index:2147483050;background:rgba(15,23,42,.5);' +
      'display:flex;align-items:center;justify-content:center;padding:12px;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#fff;border-radius:10px;padding:16px 18px;max-width:920px;width:100%;max-height:90vh;' +
      'display:flex;flex-direction:column;font-family:system-ui,sans-serif;';

    const h = document.createElement('h3');
    h.style.cssText = 'margin:0 0 10px;font-size:16px;';
    h.textContent = '一括棚卸（所属名で対象を表示）';

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';
    const selDept = document.createElement('select');
    selDept.style.cssText = 'min-width:200px;padding:6px;border-radius:6px;border:1px solid #cbd5e1;';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '所属名を選択…';
    selDept.appendChild(opt0);

    const hintCommon = document.createElement('p');
    hintCommon.style.cssText = 'margin:0 0 6px;font-size:12px;color:#475569;';
    hintCommon.textContent =
      '※ 棚卸者・設置場所・棚卸日は下の欄に入力すると一覧の全行に反映されます（各行は個別に上書き可）。';

    const inpDefPer = document.createElement('input');
    inpDefPer.type = 'text';
    inpDefPer.placeholder = '棚卸者（全行共通）';
    inpDefPer.value = '';
    inpDefPer.style.cssText = 'flex:1;min-width:140px;padding:6px;border-radius:6px;border:1px solid #cbd5e1;';
    const inpDefLoc = document.createElement('input');
    inpDefLoc.type = 'text';
    inpDefLoc.placeholder = '設置場所（全行共通）';
    inpDefLoc.style.cssText = 'flex:1;min-width:140px;padding:6px;border-radius:6px;border:1px solid #cbd5e1;';
    const inpDefDate = document.createElement('input');
    inpDefDate.type = 'date';
    inpDefDate.value = todayYmd674();
    inpDefDate.title = '棚卸日（全行共通）';
    inpDefDate.style.cssText = 'min-width:140px;padding:6px;border-radius:6px;border:1px solid #cbd5e1;';

    const btnFillLogin = document.createElement('button');
    btnFillLogin.type = 'button';
    btnFillLogin.textContent = 'ログイン名を共通欄へ';
    btnFillLogin.title = 'kintone ログインユーザ表示名を棚卸者（共通）に入れる';
    btnFillLogin.style.cssText =
      'padding:6px 10px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:12px;';
    btnFillLogin.addEventListener('click', function () {
      inpDefPer.value = getLoginUserDisplayName674();
      applyCommonToRowInputs674();
    });

    const btnApplyCommon = document.createElement('button');
    btnApplyCommon.type = 'button';
    btnApplyCommon.textContent = '共通を全行に反映';
    btnApplyCommon.style.cssText =
      'padding:6px 10px;border-radius:6px;border:1px solid #4f46e5;background:#eef2ff;color:#312e81;cursor:pointer;font-size:12px;font-weight:700;';

    const btnLoad = document.createElement('button');
    btnLoad.type = 'button';
    btnLoad.textContent = '一覧取得';
    btnLoad.style.cssText =
      'padding:6px 12px;border-radius:6px;border:none;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer;';

    topRow.appendChild(selDept);
    topRow.appendChild(inpDefPer);
    topRow.appendChild(inpDefLoc);
    topRow.appendChild(inpDefDate);
    topRow.appendChild(btnFillLogin);
    topRow.appendChild(btnApplyCommon);
    topRow.appendChild(btnLoad);

    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow:auto;border:1px solid #e2e8f0;border-radius:6px;min-height:200px;';

    const checkedIds = new Set();
    const rowOverrides = Object.create(null);
    const rowUiById = Object.create(null);
    let loadedRecords = [];

    function applyCommonToRowInputs674() {
      const defP = inpDefPer.value;
      const defL = inpDefLoc.value;
      const defD = inpDefDate.value;
      Object.keys(rowUiById).forEach(function (rid) {
        const ui = rowUiById[rid];
        if (!ui) return;
        ui.inpP.value = defP;
        ui.inpL.value = defL;
        if (ui.inpD) ui.inpD.value = defD;
        if (rowOverrides[rid]) {
          delete rowOverrides[rid].person;
          delete rowOverrides[rid].location;
          delete rowOverrides[rid].date;
          if (Object.keys(rowOverrides[rid]).length === 0) delete rowOverrides[rid];
        }
      });
    }

    function syncRowOverride674(rid, field, value) {
      let common;
      if (field === 'person') common = inpDefPer.value;
      else if (field === 'location') common = inpDefLoc.value;
      else if (field === 'date') common = inpDefDate.value;
      else common = '';
      if (String(value) === String(common)) {
        if (rowOverrides[rid]) {
          delete rowOverrides[rid][field];
          if (Object.keys(rowOverrides[rid]).length === 0) delete rowOverrides[rid];
        }
        return;
      }
      if (!rowOverrides[rid]) rowOverrides[rid] = {};
      rowOverrides[rid][field] = value;
    }

    function bindCommonSync674() {
      applyCommonToRowInputs674();
    }
    inpDefPer.addEventListener('input', bindCommonSync674);
    inpDefPer.addEventListener('change', bindCommonSync674);
    inpDefLoc.addEventListener('input', bindCommonSync674);
    inpDefLoc.addEventListener('change', bindCommonSync674);
    inpDefDate.addEventListener('input', bindCommonSync674);
    inpDefDate.addEventListener('change', bindCommonSync674);
    btnApplyCommon.addEventListener('click', bindCommonSync674);

    function renderTable() {
      scroll.innerHTML = '';
      if (!loadedRecords.length) {
        scroll.textContent = '所属を選び「一覧取得」を押してください。';
        scroll.style.padding = '12px';
        return;
      }
      const table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';
      const thead = document.createElement('thead');
      thead.innerHTML =
        '<tr style="background:#f1f5f9;"><th></th><th>PC名</th><th>利用者</th><th>棚卸日</th><th>棚卸者</th><th>設置場所</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      loadedRecords.forEach(function (rec) {
        const id = String((rec.$id && rec.$id.value) || '');
        const tr = document.createElement('tr');
        tr.style.borderTop = '1px solid #e2e8f0';
        const td0 = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        checkedIds.add(id);
        cb.addEventListener('change', function () {
          if (cb.checked) checkedIds.add(id);
          else checkedIds.delete(id);
        });
        td0.appendChild(cb);
        const td1 = document.createElement('td');
        td1.textContent = (rec[FC_PC_NAME] && rec[FC_PC_NAME].value) || '';
        const td2 = document.createElement('td');
        td2.textContent = (rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || '';
        const tdD = document.createElement('td');
        const inpD = document.createElement('input');
        inpD.type = 'date';
        inpD.style.cssText = 'width:100%;box-sizing:border-box;padding:4px;';
        inpD.value = inpDefDate.value;
        inpD.addEventListener('input', function () {
          syncRowOverride674(id, 'date', inpD.value);
        });
        inpD.addEventListener('change', function () {
          syncRowOverride674(id, 'date', inpD.value);
        });
        const td3 = document.createElement('td');
        const inpP = document.createElement('input');
        inpP.type = 'text';
        inpP.placeholder = '上書き可';
        inpP.style.cssText = 'width:100%;box-sizing:border-box;padding:4px;';
        inpP.value = inpDefPer.value;
        inpP.addEventListener('input', function () {
          syncRowOverride674(id, 'person', inpP.value);
        });
        const td4 = document.createElement('td');
        const inpL = document.createElement('input');
        inpL.type = 'text';
        inpL.placeholder = '上書き可';
        inpL.style.cssText = 'width:100%;box-sizing:border-box;padding:4px;';
        inpL.value = inpDefLoc.value;
        inpL.addEventListener('input', function () {
          syncRowOverride674(id, 'location', inpL.value);
        });
        rowUiById[id] = { inpP: inpP, inpL: inpL, inpD: inpD };
        tdD.appendChild(inpD);
        td3.appendChild(inpP);
        td4.appendChild(inpL);
        tr.appendChild(td0);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(tdD);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      scroll.appendChild(table);
      applyCommonToRowInputs674();
    }

    btnLoad.addEventListener('click', function () {
      const dept = String(selDept.value || '').trim();
      if (!dept) {
        window.alert('所属名を選択してください。');
        return;
      }
      btnLoad.disabled = true;
      const q =
        buildInventoryTargetQueryPart674() +
        ' and (' +
        FC_DEPT_NAME +
        ' = "' +
        escapeQueryValue(dept) +
        '")';
      fetchInventoryRecordsPaged674(q)
        .then(function (recs) {
          loadedRecords = recs;
          checkedIds.clear();
          Object.keys(rowUiById).forEach(function (k) {
            delete rowUiById[k];
          });
          renderTable();
        })
        .catch(function (e) {
          window.alert('取得失敗: ' + (e && e.message ? e.message : String(e)));
        })
        .then(function () {
          btnLoad.disabled = false;
        });
    });

    fetchDistinctDeptNames674()
      .then(function (names) {
        names.forEach(function (n) {
          const o = document.createElement('option');
          o.value = n;
          o.textContent = n;
          selDept.appendChild(o);
        });
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] dept list', e);
      });

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:10px;';
    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.textContent = '閉じる';
    const btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.textContent = 'チェック行を棚卸済にする';
    btnSave.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#059669;color:#fff;font-weight:700;cursor:pointer;';

    btnCancel.addEventListener('click', function () {
      modal.remove();
    });
    btnSave.addEventListener('click', function () {
      btnSave.disabled = true;
      saveBulkInventoryMerged674(
        loadedRecords,
        inpDefPer.value,
        inpDefLoc.value,
        inpDefDate.value,
        checkedIds,
        rowOverrides,
        rowUiById,
      )
        .then(function () {
          showInventoryLoading674(false);
          modal.remove();
          window.alert('一括棚卸を記録しました。');
        })
        .catch(function (e) {
          showInventoryLoading674(false);
          btnSave.disabled = false;
          window.alert('保存失敗: ' + formatKintoneApiError674(e));
        });
    });

    btnRow.appendChild(btnCancel);
    btnRow.appendChild(btnSave);
    box.appendChild(h);
    box.appendChild(hintCommon);
    box.appendChild(topRow);
    box.appendChild(scroll);
    box.appendChild(btnRow);
    modal.appendChild(box);
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
    renderTable();
  }

  function aggregateInventoryHubSummary674(records, periodStart, periodEnd) {
    const rowMap = Object.create(null);
    INVENTORY674_ORG_DEPT_ROWS.forEach(function (def) {
      const key = inventoryOrgDeptRowKey674(def.group, def.dept);
      rowMap[key] = {
        kind: 'detail',
        group: def.group,
        dept: def.dept,
        key: key,
        total: 0,
        done: 0,
        pending: 0,
      };
    });
    const uncatMap = Object.create(null);
    let skippedBlankAffiliation = 0;
    (records || []).forEach(function (rec) {
      if (!isInventoryTargetRecord674(rec)) return;
      const matched = resolveInventoryOrgDeptRow674(rec);
      const done = isInventoryDoneInPeriod674(rec, periodStart, periodEnd);
      if (matched) {
        const key = inventoryOrgDeptRowKey674(matched.group, matched.dept);
        const row = rowMap[key];
        row.total++;
        if (done) row.done++;
        else row.pending++;
        return;
      }
      const gRaw = normalizeInventoryOrgDeptLabel674(
        (rec[FC_GROUP_NAME] && rec[FC_GROUP_NAME].value) || '',
      );
      const d = canonicalInventoryDept674((rec[FC_DEPT_NAME] && rec[FC_DEPT_NAME].value) || '');
      // 所属グループ・部署とも空は「未分類」行にせず集計外（保管中の仮レコード等）
      if (!gRaw && !d) {
        skippedBlankAffiliation++;
        return;
      }
      const g = canonicalInventoryGroup674(gRaw) || gRaw;
      const ukey = inventoryOrgDeptRowKey674(g || '（未分類）', d || '（未分類）');
      let urow = uncatMap[ukey];
      if (!urow) {
        urow = {
          kind: 'detail',
          group: g || '（未分類）',
          dept: d || '（未分類）',
          key: ukey,
          total: 0,
          done: 0,
          pending: 0,
          uncategorized: true,
        };
        uncatMap[ukey] = urow;
      }
      urow.total++;
      if (done) urow.done++;
      else urow.pending++;
    });

    const groupOrder = [];
    const seenGroup = Object.create(null);
    INVENTORY674_ORG_DEPT_ROWS.forEach(function (def) {
      const g = def.group;
      if (!seenGroup[g]) {
        seenGroup[g] = true;
        groupOrder.push(g);
      }
    });

    const out = [];
    groupOrder.forEach(function (groupName) {
      const details = [];
      INVENTORY674_ORG_DEPT_ROWS.forEach(function (def) {
        if (def.group !== groupName) return;
        details.push(rowMap[inventoryOrgDeptRowKey674(def.group, def.dept)]);
      });
      let subDone = 0;
      let subPending = 0;
      let subTotal = 0;
      details.forEach(function (dr) {
        subDone += dr.done;
        subPending += dr.pending;
        subTotal += dr.total;
        out.push({
          kind: 'detail',
          group: dr.group,
          dept: dr.dept,
          done: dr.done,
          pending: dr.pending,
          total: dr.total,
        });
      });
      out.push({
        kind: 'subtotal',
        group: groupName,
        dept: '小計',
        done: subDone,
        pending: subPending,
        total: subTotal,
      });
    });

    const uncatList = Object.keys(uncatMap).map(function (k) {
      return uncatMap[k];
    });
    if (uncatList.length) {
      let uDone = 0;
      let uPending = 0;
      let uTotal = 0;
      uncatList.forEach(function (dr) {
        uDone += dr.done;
        uPending += dr.pending;
        uTotal += dr.total;
        out.push({
          kind: 'detail',
          group: dr.group,
          dept: dr.dept,
          done: dr.done,
          pending: dr.pending,
          total: dr.total,
          uncategorized: true,
        });
      });
      out.push({
        kind: 'subtotal',
        group: '（未分類）',
        dept: '小計',
        done: uDone,
        pending: uPending,
        total: uTotal,
        uncategorized: true,
      });
    }

    let grandDone = 0;
    let grandPending = 0;
    let grandTotal = 0;
    out.forEach(function (r) {
      if (r.kind !== 'detail') return;
      grandDone += r.done;
      grandPending += r.pending;
      grandTotal += r.total;
    });
    out.push({
      kind: 'grand',
      group: '全社',
      dept: '合計',
      done: grandDone,
      pending: grandPending,
      total: grandTotal,
      skippedBlankAffiliation: skippedBlankAffiliation,
    });
    return out;
  }

  function formatFiscalInventoryPeriodLabel674() {
    const bounds = computeInventoryPeriodBounds674(null);
    return bounds.start + ' 〜 ' + bounds.end;
  }

  function renderInventoryHubSummaryTable674(hostEl, rows, periodLabel) {
    if (!hostEl) return;
    hostEl.innerHTML = '';
    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:6px;line-height:1.45;';
    let skippedBlank = 0;
    (rows || []).forEach(function (r) {
      if (r && r.kind === 'grand' && r.skippedBlankAffiliation) {
        skippedBlank = Number(r.skippedBlankAffiliation) || 0;
      }
    });
    const fiscalLabel = formatFiscalInventoryPeriodLabel674();
    meta.textContent =
      '済／未了の集計期間（670キャンペーン）: ' +
      (periodLabel || '—') +
      ' ／ 年次参考（5/1〜翌4/30）: ' +
      fiscalLabel +
      ' ／ 棚卸済＝集計期間内に latest_inventory_date あり（747集計表・グループ小計）' +
      (skippedBlank > 0
        ? ' ／ 所属未設定 ' + skippedBlank + '件は集計外'
        : '');
    hostEl.appendChild(meta);
    const scroll = document.createElement('div');
    scroll.style.cssText =
      'overflow:auto;border:1px solid #cbd5e1;border-radius:4px;background:#fff;max-height:480px;';
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';
    const thead = document.createElement('thead');
    thead.innerHTML =
      '<tr style="background:#f1f5f9;position:sticky;top:0;">' +
      '<th style="padding:6px 8px;text-align:left;border-bottom:1px solid #cbd5e1;">グループ</th>' +
      '<th style="padding:6px 8px;text-align:left;border-bottom:1px solid #cbd5e1;">部署</th>' +
      '<th style="padding:6px 8px;text-align:right;border-bottom:1px solid #cbd5e1;">棚卸済</th>' +
      '<th style="padding:6px 8px;text-align:right;border-bottom:1px solid #cbd5e1;">棚卸未了</th>' +
      '</tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    function mkTd(txt, align, extraStyle) {
      const td = document.createElement('td');
      td.style.cssText =
        'padding:6px 8px;text-align:' + (align || 'left') + ';white-space:nowrap;' + (extraStyle || '');
      td.textContent = txt;
      return td;
    }

    (rows || []).forEach(function (row) {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid #e2e8f0';
      if (row.kind === 'subtotal') {
        tr.style.background = '#eef2ff';
        tr.style.fontWeight = '800';
      } else if (row.kind === 'grand') {
        tr.style.background = '#f8fafc';
        tr.style.fontWeight = '800';
        tr.style.borderTop = '2px solid #64748b';
      } else if (row.uncategorized) {
        tr.style.background = '#fff7ed';
      }

      if (row.kind === 'grand') {
        tr.appendChild(mkTd('全社', 'left'));
        tr.appendChild(mkTd('合計', 'left'));
      } else if (row.kind === 'subtotal') {
        tr.appendChild(mkTd(row.group, 'left', 'font-weight:800;'));
        tr.appendChild(mkTd('小計', 'left', 'font-weight:800;color:#3730a3;'));
      } else {
        tr.appendChild(mkTd(row.group, 'left', 'font-weight:700;'));
        tr.appendChild(mkTd(row.dept, 'left', 'font-weight:600;'));
      }

      tr.appendChild(mkTd(String(row.done), 'right', 'color:#0d9488;font-weight:700;'));
      const tdPending = mkTd(String(row.pending), 'right', 'color:#b45309;font-weight:700;');
      if (row.kind === 'detail' && row.pending > 0) {
        tdPending.style.cursor = 'pointer';
        tdPending.style.textDecoration = 'underline';
        tdPending.title = 'クリックで当該部署の未棚卸一覧を開く';
        tdPending.addEventListener('click', function (ev) {
          ev.preventDefault();
          openUninventoriedList674({ group: row.group, dept: row.dept });
        });
      } else if (row.kind === 'subtotal' && row.pending > 0) {
        tdPending.style.cursor = 'pointer';
        tdPending.style.textDecoration = 'underline';
        tdPending.title = 'クリックで当該グループの未棚卸一覧を開く';
        tdPending.addEventListener('click', function (ev) {
          ev.preventDefault();
          openUninventoriedList674({ group: row.group, dept: '', groupOnly: true });
        });
      }
      tr.appendChild(tdPending);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    hostEl.appendChild(scroll);
  }

  function refreshInventoryHubSummaryAccordion674(accEl) {
    if (!accEl) return;
    const body = accEl.querySelector('.npl674-inv-hub-body');
    if (!body) return;
    body.textContent = '読み込み中…';
    ensureInventoryPeriodLoaded674()
      .then(function () {
        const bounds = computeInventoryPeriodBounds674(npl674InventoryEnvMap674);
        const periodLabel = bounds.start + ' 〜 ' + bounds.end;
        const q = buildInventoryTargetQueryPart674();
        const fields = [
          '$id',
          FC_GROUP_NAME,
          FC_DEPT_NAME,
          FC_ACCOUNT_TYPE,
          FC_PC_STATUS,
          FC_LATEST_INVENTORY_DATE,
        ];
        return fetchInventoryRecordsPaged674(q, fields).then(function (recs) {
          const rows = aggregateInventoryHubSummary674(recs, bounds.start, bounds.end);
          renderInventoryHubSummaryTable674(body, rows, periodLabel);
        });
      })
      .catch(function (e) {
        body.textContent = '棚卸状況の取得に失敗: ' + (e && e.message ? e.message : String(e));
      });
  }

  function ensureInventoryHubSummaryAccordion674(wrap) {
    if (!wrap || document.getElementById('npl674-inv-hub-acc')) return;
    const acc = document.createElement('details');
    acc.id = 'npl674-inv-hub-acc';
    acc.style.cssText = 'margin:0 0 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;';
    const sum = document.createElement('summary');
    sum.style.cssText = 'padding:8px 12px;font-size:13px;font-weight:700;color:#0f172a;cursor:pointer;';
    sum.textContent = '棚卸状況一覧';
    const body = document.createElement('div');
    body.className = 'npl674-inv-hub-body';
    body.style.cssText = 'padding:8px 12px 12px;border-top:1px solid #e2e8f0;';
    body.textContent = '開くとグループ×部署の棚卸進捗を表示します。';
    acc.appendChild(sum);
    acc.appendChild(body);
    acc.addEventListener('toggle', function () {
      if (acc.open) refreshInventoryHubSummaryAccordion674(acc);
    });
    const summaryRow = document.getElementById('npl674-index-summary-row');
    if (summaryRow && summaryRow.parentNode && wrap.contains(summaryRow)) {
      summaryRow.parentNode.insertBefore(acc, summaryRow.nextSibling);
    } else {
      wrap.appendChild(acc);
    }
    // 仕様 2026-08-10 §3.3: 棚卸状況一覧は通年閲覧可（期間外でも非表示にしない）
  }

  function renderUninventoriedPanel674(records, hubFilter) {
    const panelId = 'npl674-inventory-uninv-panel';
    const old = document.getElementById(panelId);
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.style.cssText =
      'position:fixed;inset:0;z-index:2147482900;background:#f8fafc;display:flex;flex-direction:column;' +
      'font-family:system-ui,sans-serif;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'flex:0 0 auto;display:flex;gap:8px;align-items:center;padding:12px 16px;background:#0f172a;color:#fff;';
    const title = document.createElement('div');
    title.style.cssText = 'flex:1;font-weight:700;';
    const hubLabel = hubFilter ? ' — ' + hubFilter : '';
    title.textContent = '未棚卸一覧' + hubLabel + '（' + records.length + '件）';
    const btnBulk = document.createElement('button');
    btnBulk.type = 'button';
    btnBulk.textContent = '一括棚卸へ';
    btnBulk.style.cssText =
      'padding:6px 12px;border-radius:6px;border:none;background:#059669;color:#fff;font-weight:700;cursor:pointer;';
    btnBulk.addEventListener('click', function () {
      panel.remove();
      openInventoryBulkModal674();
    });
    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = '閉じる';
    btnClose.style.cssText = 'padding:6px 12px;border-radius:6px;border:none;cursor:pointer;';
    btnClose.addEventListener('click', function () {
      panel.remove();
    });
    toolbar.appendChild(title);
    toolbar.appendChild(btnBulk);
    toolbar.appendChild(btnClose);

    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;';
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;background:#fff;';
    table.innerHTML =
      '<thead><tr style="background:#e2e8f0;"><th>PC名</th><th>所属</th><th>利用者</th><th>状態</th><th>最新棚卸日</th><th>操作</th></tr></thead>';
    const tbody = document.createElement('tbody');
    const appId = kintone.app.getId();
    records.forEach(function (rec) {
      const tr = document.createElement('tr');
      tr.style.borderTop = '1px solid #e2e8f0';
      function td(txt) {
        const c = document.createElement('td');
        c.style.padding = '6px 8px';
        c.textContent = txt || '';
        return c;
      }
      tr.appendChild(td((rec[FC_PC_NAME] && rec[FC_PC_NAME].value) || ''));
      tr.appendChild(td((rec[FC_DEPT_NAME] && rec[FC_DEPT_NAME].value) || ''));
      tr.appendChild(td((rec[FC_USER_NAME] && rec[FC_USER_NAME].value) || ''));
      tr.appendChild(td((rec[FC_PC_STATUS] && rec[FC_PC_STATUS].value) || ''));
      tr.appendChild(td((rec[FC_LATEST_INVENTORY_DATE] && rec[FC_LATEST_INVENTORY_DATE].value) || '—'));
      const tdAct = document.createElement('td');
      tdAct.style.padding = '6px 8px';
      const rid = rec.$id && rec.$id.value;
      if (rid) {
        const btnInd = document.createElement('button');
        btnInd.type = 'button';
        btnInd.textContent = '個別';
        btnInd.style.cssText =
          'padding:4px 10px;border-radius:6px;border:1px solid #047857;background:#ecfdf5;color:#047857;font-weight:700;cursor:pointer;font-size:12px;';
        btnInd.addEventListener('click', function () {
          location.href =
            location.origin + '/k/' + encodeURIComponent(String(appId)) + '/show#record=' + encodeURIComponent(String(rid));
        });
        tdAct.appendChild(btnInd);
      }
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    panel.appendChild(toolbar);
    panel.appendChild(scroll);
    document.body.appendChild(panel);
  }

  function openUninventoriedList674(orgDeptFilter) {
    // addEventListener 直渡しだと MouseEvent が来る → 所属フィルタと誤認して0〜1件になる
    if (
      orgDeptFilter &&
      typeof orgDeptFilter === 'object' &&
      (typeof Event !== 'undefined' && orgDeptFilter instanceof Event)
    ) {
      orgDeptFilter = null;
    } else if (
      orgDeptFilter &&
      typeof orgDeptFilter === 'object' &&
      orgDeptFilter.group == null &&
      orgDeptFilter.dept == null &&
      !orgDeptFilter.groupOnly &&
      orgDeptFilter.target != null
    ) {
      orgDeptFilter = null;
    }
    ensureInventoryPeriodLoaded674()
      .then(function () {
        const q = buildUninventoriedQuery674(npl674InventoryEnvMap674);
        showInventoryLoading674(true, '未棚卸を取得中…');
        return fetchInventoryRecordsPaged674(q, [
          '$id',
          FC_PC_NAME,
          FC_USER_NAME,
          FC_GROUP_NAME,
          FC_DEPT_NAME,
          FC_PC_STATUS,
          FC_ACCOUNT_TYPE,
          FC_LATEST_INVENTORY_DATE,
        ]).then(function (recs) {
          showInventoryLoading674(false);
          let filtered = recs;
          let label = '';
          if (orgDeptFilter && typeof orgDeptFilter === 'object') {
            const fg = normalizeInventoryOrgDeptLabel674(orgDeptFilter.group);
            const fd = normalizeInventoryOrgDeptLabel674(orgDeptFilter.dept);
            const groupOnly = !!orgDeptFilter.groupOnly;
            label = groupOnly
              ? fg + '（グループ）'
              : (fg ? fg + ' / ' : '') + (fd || '');
            filtered = recs.filter(function (rec) {
              const matched = resolveInventoryOrgDeptRow674(rec);
              if (groupOnly) {
                if (matched) {
                  return normalizeInventoryOrgDeptLabel674(matched.group) === fg;
                }
                const g = normalizeInventoryOrgDeptLabel674(
                  (rec[FC_GROUP_NAME] && rec[FC_GROUP_NAME].value) || '',
                );
                return (g || '（未分類）') === (fg || '（未分類）');
              }
              if (matched) {
                return (
                  normalizeInventoryOrgDeptLabel674(matched.group) === fg &&
                  normalizeInventoryOrgDeptLabel674(matched.dept) === fd
                );
              }
              const g2 = normalizeInventoryOrgDeptLabel674(
                (rec[FC_GROUP_NAME] && rec[FC_GROUP_NAME].value) || '',
              );
              const d2 = normalizeInventoryOrgDeptLabel674(
                (rec[FC_DEPT_NAME] && rec[FC_DEPT_NAME].value) || '',
              );
              return (
                (g2 || '（未分類）') === (fg || '（未分類）') &&
                (d2 || '（未分類）') === (fd || '（未分類）')
              );
            });
          } else if (typeof orgDeptFilter === 'string' && orgDeptFilter) {
            label = orgDeptFilter;
            filtered = recs.filter(function (rec) {
              const d = normalizeInventoryOrgDeptLabel674(
                (rec[FC_DEPT_NAME] && rec[FC_DEPT_NAME].value) || '',
              );
              return d === normalizeInventoryOrgDeptLabel674(orgDeptFilter);
            });
          }
          renderUninventoriedPanel674(filtered, label);
        });
      })
      .catch(function (e) {
        showInventoryLoading674(false);
        window.alert('取得失敗: ' + (e && e.message ? e.message : String(e)));
      });
  }

  function wire674IndexInventoryButtons674() {
    ensureInventoryPeriodLoaded674().then(function (active) {
      const btnBulk = document.getElementById('npl674-btn-inventory-bulk');
      const btnUninv = document.getElementById('npl674-btn-inventory-uninv');
      // 一括・未棚卸のみ period-gate。棚卸状況一覧は通年表示（仕様 §3.3）
      if (btnBulk) btnBulk.style.display = active ? '' : 'none';
      if (btnUninv) btnUninv.style.display = active ? '' : 'none';
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

  /** 個人 JBIS 形式（S-JBIS は除外）。個人→共有等で現場ラベル維持の判定用 */
  function isPersonalStyleJbisPcName674(pcName) {
    const s = String(pcName || '').trim();
    if (/^S-JBIS/i.test(s)) return false;
    if (extractJbisFourDigitFromPcName674(s) != null) return true;
    return /^JBIS(\d+)/i.test(s);
  }

  function normalize674NoteTextForCompare674(noteText) {
    return String(noteText || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function noteHasSharedJbisOpsMarker674(noteText) {
    const norm = normalize674NoteTextForCompare674(noteText);
    const markerNorm = normalize674NoteTextForCompare674(NOTE_SHARED_JBIS_OPS_MARKER_674);
    return norm.indexOf(markerNorm) !== -1;
  }

  /** 備考に運用マーカー1行を追記（既存なら何もしない） */
  function appendSharedJbisOpsNote674(record) {
    if (!record) return;
    if (!record[FC_NOTE]) {
      record[FC_NOTE] = { type: 'MULTI_LINE_TEXT', value: '' };
    }
    const prev = String(record[FC_NOTE].value || '');
    if (noteHasSharedJbisOpsMarker674(prev)) return;
    const next = prev.trim()
      ? prev.replace(/\s+$/, '') + '\n' + NOTE_SHARED_JBIS_OPS_MARKER_674
      : NOTE_SHARED_JBIS_OPS_MARKER_674;
    record[FC_NOTE].value = next;
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
   * §4.3.1: 台帳上の参照用最大連番（数値）。**空き番は見ない**（max のみ）。
   * - **個人**: 廃棄・取消以外・**全 account_type** の `pc_name` から **JBIS** 連番だけ走査した最大（**S-JBIS は extract 側で除外**・**`pc_serial_no` は使わない**）。共有行が JBIS 名を再利用したときの衝突回避。
   * - **共有**: 廃棄・取消以外・共有行の `pc_serial_no>0` の最大と、同条件の **`pc_name` の S-JBIS 連番**の最大の **いずれか大きい方**（個人 JBIS は含めない）。
   * 番兵 **9999**（`JBIS9999` / `S-JBIS9999`）は max に含めない（プレースホルダ）。
   * 無い・失敗時は 0。次番は `resolveNextPcSerialFromMax674`（個人は 670 下限と併用）。
   * @param {'personal'|'shared'} kind
   */
  function fetchMaxPcSerial674(kind) {
    const appId = kintone.app.getId();
    const notDisposed = buildPcStatusActiveOnlyQuery674() + ' and ';
    const serialScope =
      (kind === 'personal'
        ? ''
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
                const n = toPositiveInt674(row[FC_PC_SERIAL_NO].value);
                return n === 9999 ? 0 : n;
              })
              .catch(function (e) {
                console.warn('[NEW-PC-LEDGER-V1] fetchMaxPcSerial674(' + kind + ') field', e);
                return 0;
              });

    function scanPcNames674(offset, accMax) {
      const nameScope =
        kind === 'personal'
          ? notDisposed
          : 'account_type in ("' + escapeQueryValue(TYPE_SHARED) + '") and ' + notDisposed;
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
          if (dig != null && dig !== 9999) m = Math.max(m, dig);
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
   * 台帳 max から次番（空き番無視）。個人は 670 下限と max(max+1, floor)。
   * @param {'personal'|'shared'} kind
   * @param {number} maxFromLedger
   * @param {object} [envMap] 個人の下限用
   */
  function resolveNextPcSerialFromMax674(kind, maxFromLedger, envMap) {
    const maxBase = toPositiveInt674(maxFromLedger);
    const next = maxBase + 1;
    if (kind === 'personal') {
      return Math.max(next > 0 ? next : 1, parsePersonalJbisSerialFloor674(envMap));
    }
    return next > 0 ? next : 1;
  }

  /**
   * 個人 JBIS 次番（一覧バナー・自動生成の共通入口）。空き番無視・670 下限・9999 除外は fetchMax 側。
   */
  function fetchNextPersonalJbisSerial674(envMap) {
    return fetchMaxPcSerial674('personal').then(function (maxSer) {
      return resolveNextPcSerialFromMax674('personal', maxSer, envMap);
    });
  }

  /**
   * 共有 S-JBIS 次番（一覧バナー・自動生成の共通入口）。空き番無視。
   */
  function fetchNextSharedSjbisSerial674() {
    return fetchMaxPcSerial674('shared').then(function (maxSer) {
      return resolveNextPcSerialFromMax674('shared', maxSer, null);
    });
  }

  /**
   * 個人 JBIS の **自動**採番で使う最小連番（数値）。670 `PC_SERIAL_MIN_PERSONAL_JBIS`（1 〜 99999）。
   * 未設定・不正時は **67**（**JBIS0067**）。次番は **台帳 JBIS max+1** とこの下限の **大きい方**（空き番は使わない）。
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
   * **個人**: **`pc_serial_no` のフォーム値は使わない**。`nextSerial`（＝台帳 max+1 と 670 下限の大きい方・空き無視）をそのまま使う。
   * **共有**: 自動生成時は台帳の **S-JBIS max+1**（空き無視）。`pc_serial_no` のフォーム値は参照しない。
   * @param {'personal'|'shared'} kind
   * @param {number} nextSerial 呼び出し側で算出した **次番**（max ではない）
   * @param {{ forcePersonalPc?: boolean, forceSharedPc?: boolean }} [opts] **個人の自動生成**は `forcePersonalPc: true`。**共有の自動生成**は `forceSharedPc: true`。
   */
  function mergePcNameSerialFromMax674(rec, envMap, nextSerial, kind, opts) {
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
    const nextBase = toPositiveInt674(nextSerial);
    if (kind === 'personal') {
      serialNum = Math.max(
        nextBase > 0 ? nextBase : 1,
        parsePersonalJbisSerialFloor674(envMap),
      );
      if (cellSer && typeof cellSer === 'object' && Object.prototype.hasOwnProperty.call(cellSer, 'value')) {
        cellSer.value = String(serialNum);
      }
    } else if (forceSharedPc) {
      serialNum = nextBase > 0 ? nextBase : 1;
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
        serialNum = nextBase > 0 ? nextBase : 1;
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

  function fetch674IndexNextSerialPreview674() {
    return loadEnv670Map()
      .then(function (envMap) {
        return Promise.all([
          Promise.resolve(envMap || {}),
          fetchNextPersonalJbisSerial674(envMap || {}),
          fetchNextSharedSjbisSerial674(),
          nextJbmFrom672(),
          nextSjbmFrom673(),
        ]);
      })
      .then(function (results) {
        const envMap = results[0] || {};
        const personalSerial = toPositiveInt674(results[1]) || parsePersonalJbisSerialFloor674(envMap);
        const sharedSerial = toPositiveInt674(results[2]) || 1;
        const personalPrefix =
          String(envMap.PC_NAME_PREFIX_PERSONAL || 'JBIS').trim() || 'JBIS';
        const sharedPrefix =
          String(envMap.PC_NAME_PREFIX_SHARED || 'S-JBIS').trim() || 'S-JBIS';
        /** 一覧バナーは接頭辞＋連番のみ（`-YYYYMM` は登録月で変動するため表示しない） */
        return {
          personalPc: personalPrefix + formatPcNameJbisSerialDigits674(personalSerial),
          personalWin: String(results[3] || '').trim() || '—',
          sharedPc: sharedPrefix + formatPcNameJbisSerialDigits674(sharedSerial),
          sharedWin: String(results[4] || '').trim() || '—',
        };
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] fetch674IndexNextSerialPreview674', e);
        return null;
      });
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

  /** §4.7.4: 共有/JR の 671 連動経路でフォームへ出す M365 PW（`logon_pw` の `kent0000` とは別・670 `M365_PW_SHARED_FIXED`） */
  function m365SharedJrFormPassword674(envMap) {
    return String((envMap && envMap.M365_PW_SHARED_FIXED) || 'kent2511K#').trim();
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
    '札幌支店|reform,首都圏支店|reform,鉄構支店|tekko,湾岸工事所|wangan';

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
      if (dept) out.push({ dept_name: dept, group_name: grp, sort_no: i + 1 });
    }
    return out;
  }

  function sortDeptMasterRows674(rows) {
    return rows.slice().sort(function (a, b) {
      const sa = Number(a.sort_no);
      const sb = Number(b.sort_no);
      const na = Number.isFinite(sa) && sa > 0 ? sa : 99999;
      const nb = Number.isFinite(sb) && sb > 0 ? sb : 99999;
      if (na !== nb) return na - nb;
      const dc = String(a.dept_name || '').localeCompare(String(b.dept_name || ''), 'ja');
      if (dc !== 0) return dc;
      return String(a.group_name || '').localeCompare(String(b.group_name || ''), 'ja');
    });
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
      query: 'order by sort_no asc, $id asc limit 500',
      fields: ['dept_name', 'group_name', 'sort_no'],
    })
      .then(function (resp) {
        const rows = [];
        for (let i = 0; i < (resp.records || []).length; i++) {
          const r = resp.records[i];
          const d = (r.dept_name && r.dept_name.value) || '';
          const g = (r.group_name && r.group_name.value) || '';
          const sn = r.sort_no && r.sort_no.value != null && r.sort_no.value !== '' ? Number(r.sort_no.value) : NaN;
          if (String(d).trim()) {
            rows.push({
              dept_name: String(d).trim(),
              group_name: String(g).trim(),
              sort_no: sn,
            });
          }
        }
        deptMasterRowsCache674 = rows.length
          ? sortDeptMasterRows674(rows)
          : parseDeptMasterFallbackRows674();
        return deptMasterRowsCache674;
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] 所属マスタ取得失敗、埋め込みへ', e);
        deptMasterRowsCache674 = parseDeptMasterFallbackRows674();
        return deptMasterRowsCache674;
      });
  }


  const ORG674_GROUP_CODE_LABELS = {
    honsya: '本社',
    tohoku: '東北支店',
    'kan-etsu': '関越支店',
    tokyo: '東京支店',
    tokai: '東海支店',
    reform: 'リフォーム統括事業部',
    tekko: '鉄構支店',
    wangan: '湾岸工事所',
  };

  function label674OrgGroup674(groupKey) {
    const g = String(groupKey || '').trim();
    if (!g || g === '（グループなし）') return '（グループなし）';
    return ORG674_GROUP_CODE_LABELS[g] || g;
  }

  /** 台帳の日本語グループ名と 680 のコード（honsya 等）を同一キーに寄せる */
  function normalize674OrgGroupKey674(groupKey) {
    const g = String(groupKey || '').trim();
    if (!g || g === '（グループなし）') return '（グループなし）';
    if (ORG674_GROUP_CODE_LABELS[g]) return g;
    const codes = Object.keys(ORG674_GROUP_CODE_LABELS);
    for (let i = 0; i < codes.length; i++) {
      if (ORG674_GROUP_CODE_LABELS[codes[i]] === g) return codes[i];
    }
    return g;
  }

  function append674DeptNameInFilter674(parts, deptNames) {
    const list = [];
    const seen = Object.create(null);
    const src = deptNames instanceof Set ? Array.from(deptNames) : deptNames || [];
    for (let i = 0; i < src.length; i++) {
      const d = String(src[i] || '').trim();
      if (!d || seen[d]) continue;
      seen[d] = true;
      list.push(d);
    }
    if (!list.length) return;
    const quoted = list
      .map(function (d) {
        return '"' + escape674QueryLike(d) + '"';
      })
      .join(', ');
    parts.push('(' + FC_DEPT_NAME + ' in (' + quoted + '))');
  }

  function format674DeptSelectionSummary674(deptNames) {
    const list = [];
    const seen = Object.create(null);
    const src = deptNames instanceof Set ? Array.from(deptNames) : deptNames || [];
    for (let i = 0; i < src.length; i++) {
      const d = String(src[i] || '').trim();
      if (!d || seen[d]) continue;
      seen[d] = true;
      list.push(d);
    }
    if (!list.length) return '';
    if (list.length <= 2) return list.join('・');
    return list.slice(0, 2).join('・') + ' ほか' + String(list.length - 2);
  }

  function buildOrgPickerCatalog674(masterRows, records) {
    const byGroup = Object.create(null);
    const groupMinSort = Object.create(null);
    const deptHome = Object.create(null);
    function add(dept, group, sortNo, fromMaster) {
      const d = String(dept || '').trim();
      if (!d) return;
      const g = normalize674OrgGroupKey674(group);
      const sn = Number(sortNo);
      const sort = Number.isFinite(sn) && sn > 0 ? sn : 99999;
      if (!fromMaster && deptHome[d]) return;
      if (!byGroup[g]) byGroup[g] = Object.create(null);
      const prev = byGroup[g][d];
      if (!prev || sort < prev.sort_no) {
        byGroup[g][d] = { dept_name: d, group_name: g, sort_no: sort };
      }
      if (fromMaster) {
        deptHome[d] = g;
        if (groupMinSort[g] == null || sort < groupMinSort[g]) groupMinSort[g] = sort;
      } else if (groupMinSort[g] == null) {
        groupMinSort[g] = 99999;
      }
    }
    for (let i = 0; i < (masterRows || []).length; i++) {
      const r = masterRows[i];
      add(r.dept_name, r.group_name, r.sort_no, true);
    }
    for (let j = 0; j < (records || []).length; j++) {
      const rec = records[j];
      const d = cell674PlainForSearch(rec, FC_DEPT_NAME);
      const g = cell674PlainForSearch(rec, FC_GROUP_NAME);
      add(d, g, 99999, false);
    }
    const groupKeys = Object.keys(byGroup).sort(function (a, b) {
      if (a === '（グループなし）') return 1;
      if (b === '（グループなし）') return -1;
      const sa = groupMinSort[a] != null ? groupMinSort[a] : 99999;
      const sb = groupMinSort[b] != null ? groupMinSort[b] : 99999;
      if (sa !== sb) return sa - sb;
      return label674OrgGroup674(a).localeCompare(label674OrgGroup674(b), 'ja');
    });
    return groupKeys.map(function (gk) {
      const depts = Object.keys(byGroup[gk])
        .map(function (dk) {
          return byGroup[gk][dk];
        })
        .sort(function (a, b) {
          if (a.sort_no !== b.sort_no) return a.sort_no - b.sort_no;
          return String(a.dept_name).localeCompare(String(b.dept_name), 'ja');
        });
      return { key: gk, label: label674OrgGroup674(gk), depts: depts };
    });
  }

  function loadOrgPickerCatalog674() {
    return Promise.all([
      fetchDeptMasterRows674(),
      typeof fetch674IndexSearchCache === 'function'
        ? fetch674IndexSearchCache().catch(function () {
            return [];
          })
        : Promise.resolve([]),
    ]).then(function (pair) {
      return buildOrgPickerCatalog674(pair[0], pair[1]);
    });
  }

  /**
   * 所属グループ＋所属名のレ点ピッカー（一覧検索／リスト作成で共用）。
   * @returns {{ root: HTMLElement, selectedDepts: Set<string>, refresh: Function, clear: Function, getSummary: Function, destroy: Function }}
   */
  function create674OrgPickerWidget674(opts) {
    const options = opts || {};
    const selectedDepts =
      options.selectedDepts instanceof Set ? options.selectedDepts : new Set();
    const viewGroups = new Set();
    const onChange = typeof options.onChange === 'function' ? options.onChange : function () {};
    const embedded = !!options.embedded;

    const root = document.createElement('div');
    root.className = 'npl674-org-picker';
    root.style.cssText = embedded
      ? 'border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;padding:10px 12px;margin-bottom:12px;'
      : 'width:min(420px,92vw);max-height:min(70vh,520px);overflow:auto;border:1px solid #94a3b8;' +
        'border-radius:10px;background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.22);padding:12px;';

    const head = document.createElement('div');
    head.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';
    const title = document.createElement('div');
    title.style.cssText = 'flex:1;font-size:13px;font-weight:800;color:#0f172a;';
    title.textContent = '所属を選択';
    const btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.textContent = '選択解除';
    btnClear.style.cssText =
      'padding:4px 10px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-size:12px;font-weight:700;cursor:pointer;';
    head.appendChild(title);
    head.appendChild(btnClear);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:8px;line-height:1.45;';
    hint.textContent =
      '①グループ（ダブルクリックでその所属を全選択）→ ②レ点。未選択＝絞り込みなし。候補は680＋台帳の実在値。';

    const filterInp = document.createElement('input');
    filterInp.type = 'search';
    filterInp.placeholder = '候補を絞り込み…';
    filterInp.setAttribute('aria-label', '所属候補の絞り込み');
    filterInp.style.cssText =
      'width:100%;box-sizing:border-box;margin-bottom:8px;padding:6px 8px;border:1px solid #94a3b8;border-radius:6px;font-size:13px;';

    const groupRow = document.createElement('div');
    groupRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;';

    const deptHost = document.createElement('div');
    deptHost.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 8px;' +
      'max-height:240px;overflow:auto;padding:4px 2px;';

    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;color:#64748b;padding:8px 0;';
    empty.textContent = '候補を読み込み中…';

    root.appendChild(head);
    root.appendChild(hint);
    root.appendChild(filterInp);
    root.appendChild(groupRow);
    root.appendChild(deptHost);
    root.appendChild(empty);

    let catalog = [];

    function emit() {
      onChange();
    }

    function clearSelection() {
      selectedDepts.clear();
      viewGroups.clear();
      render();
      emit();
    }

    btnClear.addEventListener('click', clearSelection);

    function deptMatchesFilter(name, q) {
      if (!q) return true;
      return String(name || '').toLowerCase().indexOf(q) !== -1;
    }

    function render() {
      const q = String(filterInp.value || '').trim().toLowerCase();
      while (groupRow.firstChild) groupRow.removeChild(groupRow.firstChild);
      while (deptHost.firstChild) deptHost.removeChild(deptHost.firstChild);

      if (!catalog.length) {
        empty.style.display = '';
        empty.textContent = '所属候補がありません。';
        return;
      }
      empty.style.display = 'none';

      catalog.forEach(function (g) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = g.label;
        const on = viewGroups.has(g.key);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.cssText =
          'padding:4px 10px;border-radius:999px;border:1px solid ' +
          (on ? '#7c3aed' : '#94a3b8') +
          ';background:' +
          (on ? '#ede9fe' : '#fff') +
          ';font-size:12px;font-weight:700;cursor:pointer;color:#0f172a;';
        b.addEventListener('click', function () {
          if (viewGroups.has(g.key)) viewGroups.delete(g.key);
          else viewGroups.add(g.key);
          render();
        });
        b.addEventListener('dblclick', function (ev) {
          ev.preventDefault();
          for (let i = 0; i < g.depts.length; i++) selectedDepts.add(g.depts[i].dept_name);
          viewGroups.add(g.key);
          render();
          emit();
        });
        groupRow.appendChild(b);
      });

      const showAllGroups = viewGroups.size === 0;
      let shown = 0;
      const deptRows = [];
      const seenDept = Object.create(null);
      catalog.forEach(function (g) {
        if (!showAllGroups && !viewGroups.has(g.key)) return;
        for (let i = 0; i < g.depts.length; i++) {
          const row = g.depts[i];
          if (seenDept[row.dept_name]) continue;
          seenDept[row.dept_name] = true;
          if (!deptMatchesFilter(row.dept_name, q) && !deptMatchesFilter(g.label, q)) continue;
          deptRows.push(row);
        }
      });
      deptRows.sort(function (a, b) {
        if (a.sort_no !== b.sort_no) return a.sort_no - b.sort_no;
        return String(a.dept_name).localeCompare(String(b.dept_name), 'ja');
      });
      deptRows.forEach(function (row) {
          const lab = document.createElement('label');
          lab.style.cssText =
            'display:flex;align-items:flex-start;gap:6px;font-size:12px;line-height:1.35;cursor:pointer;' +
            'padding:4px 6px;border-radius:6px;background:#fff;border:1px solid #e2e8f0;';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = selectedDepts.has(row.dept_name);
          cb.addEventListener('change', function () {
            if (cb.checked) selectedDepts.add(row.dept_name);
            else selectedDepts.delete(row.dept_name);
            emit();
          });
          const span = document.createElement('span');
          span.textContent = row.dept_name;
          lab.appendChild(cb);
          lab.appendChild(span);
          deptHost.appendChild(lab);
          shown++;
      });
      if (!shown) {
        empty.style.display = '';
        empty.textContent = q
          ? '該当する所属がありません。'
          : 'グループを選ぶか、上の欄で絞り込んでください。';
      }
    }

    filterInp.addEventListener('input', render);

    function refresh() {
      empty.style.display = '';
      empty.textContent = '候補を読み込み中…';
      return loadOrgPickerCatalog674().then(function (cat) {
        catalog = cat || [];
        render();
      });
    }

    return {
      root: root,
      selectedDepts: selectedDepts,
      refresh: refresh,
      clear: clearSelection,
      getSummary: function () {
        return format674DeptSelectionSummary674(selectedDepts);
      },
      destroy: function () {
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  }

  function close674OrgPopover674() {
    const p = document.getElementById('npl674-org-popover');
    if (p) p.remove();
    const backdrop = document.getElementById('npl674-org-popover-backdrop');
    if (backdrop) backdrop.remove();
  }

  function open674OrgPopover674(anchorBtn, selectedDepts, onChange) {
    close674OrgPopover674();
    const backdrop = document.createElement('div');
    backdrop.id = 'npl674-org-popover-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:2147482750;background:transparent;';
    backdrop.addEventListener('click', close674OrgPopover674);

    const pop = document.createElement('div');
    pop.id = 'npl674-org-popover';
    pop.style.cssText = 'position:fixed;z-index:2147482760;';
    const widget = create674OrgPickerWidget674({
      selectedDepts: selectedDepts,
      onChange: function () {
        onChange();
      },
      embedded: false,
    });
    const btnDone = document.createElement('button');
    btnDone.type = 'button';
    btnDone.textContent = '閉じる';
    btnDone.style.cssText =
      'margin-top:10px;width:100%;padding:8px 12px;border-radius:6px;border:none;background:#4c1d95;color:#fff;font-weight:800;cursor:pointer;';
    btnDone.addEventListener('click', close674OrgPopover674);
    widget.root.appendChild(btnDone);
    pop.appendChild(widget.root);
    document.body.appendChild(backdrop);
    document.body.appendChild(pop);

    const rect = anchorBtn.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - 440);
    let top = rect.bottom + 6;
    pop.style.left = String(left) + 'px';
    pop.style.top = String(top) + 'px';
    widget.refresh().then(function () {
      const h = pop.offsetHeight || 320;
      if (top + h > window.innerHeight - 8) {
        top = Math.max(8, rect.top - h - 6);
        pop.style.top = String(top) + 'px';
      }
    });
    return widget;
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
   * `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.1a（個人×保管は 595 連携不要）・§4.4（個人用自動生成は pc_status≠保管）・§4.2.0・§4.10.7（廃棄・取消は 595 リンク解除）。
   * CIO 運用: 仕様乖離時は本関数とコメントを先に直し、分岐はここに集約する。
   * @param {object} record kintone record（`get()` の holder.record を想定）
   * @returns {boolean}
   */
  function isPersonal595AssistEnabled674(record) {
    if (!record) return false;
    if (readAccountTypeLive674(record) !== TYPE_PERSONAL) return false;
    if (isPcStatusStorage674(record)) return false;
    if (isPcStatusInactive674(readPcStatusLive674(record))) return false;
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

  /** 入力支援クリック: record / DOM 上で編集可能か（閲覧・disabled フィールドは false） */
  function isFieldEditableForAssist674(code, record) {
    if (record && record[code] && record[code].disabled === true) return false;
    const root = tryGetFieldElement674(code);
    if (!root) return false;
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
      } catch (_e) {
        /* ignore */
      }
    }
    if (!inp || (inp.tagName !== 'INPUT' && inp.tagName !== 'TEXTAREA')) return false;
    if (inp.disabled || inp.readOnly) return false;
    return true;
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

    if (inUser && !isFieldEditableForAssist674(FC_USER_NAME, rec)) return;
    if (inDept && !isFieldEditableForAssist674(FC_DEPT_NAME, rec)) return;
    if (inGrp && !isFieldEditableForAssist674(FC_GROUP_NAME, rec)) return;

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
    return loadEnv670Map().then(function (envMap0) {
      return Promise.all([
        Promise.resolve(envMap0 || {}),
        findEmployee595ByUserName(userName.trim()),
        nextJbmFrom672(),
        fetchNextPersonalJbisSerial674(envMap0 || {}),
      ]);
    })
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
        const nextPcSerial = results[3];
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

        mergePcNameSerialFromMax674(rec, envMap, nextPcSerial, 'personal', { forcePersonalPc: true });

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
          next_jbis_serial_674: nextPcSerial,
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
          '個人用フィールドをフォームへ反映しました。**PC名が空のときだけ**、台帳の JBIS 連番 **max+1**（下限あり・空き番は使わない）で **PC名・シリアル（PC）**を採番します（登録済み PC 名は変更しません）。その他の欄は空欄のみ上書きです。保存は手動で行ってください。';
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

    return Promise.all([loadEnv670Map(), nextSjbmFrom673(), fetchNextSharedSjbisSerial674()]).then(
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
      vpn_id: String((rec[FC_VPN_ID] && rec[FC_VPN_ID].value) || '').trim(),
      vpn_pw: String((rec[FC_VPN_PW] && rec[FC_VPN_PW].value) || '').trim(),
    };
  }

  /** 共有/JR で M365 マスタ行が有効に 1 台分カウントされる状態（§4.10.4 廃棄はカウント外） */
  function allocation671Active(st) {
    if (!st) return false;
    if (st.account_type !== TYPE_SHARED && st.account_type !== TYPE_JR) return false;
    if (!st.m365_master_record_id || !st.pc_name) return false;
    if (isPcStatusInactive674(st.pc_status)) return false;
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
          '(account_type in ("共有", "JR端末")) and ' +
          buildPcStatusActiveOnlyQuery674() +
          ' and m365_master_record_id = ' +
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
   * - 個人（利用中）: mail 優先、無ければ emp_id で595を引く。リンクは最大2台。
   * - 個人（廃棄・取消・保管）: mail + emp_id で595から当該674 $id を削除試行。
   * - 共有・JR: 社員に紐付けないため595へ追記しない。削除は mail のみ試行（個人→共有で mail が残る場合の名残除去）。
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

  // ===== PC買替（§4.10.3: 674台帳 JBIS/S-JBIS 次番・旧=廃棄・新=アカウント継承・671 / 595 整合）=====
  // 旧 PC採番マスタ 596 はテナント削除済（2026-08-11）。買替の PC 名は自動生成と同式の台帳 max+1。

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

  function shouldBeInactiveForReplace674(status) {
    if (isPcStatusCancelled674(status)) return true;
    return shouldBeDisposedStatus674(status);
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
      '") and ' +
      buildPcStatusActiveOnlyQuery674();
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
        const acType = String((tr[FC_ACCOUNT_TYPE] && tr[FC_ACCOUNT_TYPE].value) || '').trim();
        const putRec = markSkyseaClientDeletePending674(
          {
            [FC_PC_STATUS]: { value: STATUS_AFTER_REPLACE_OLD_674 },
            [FC_NOTE]: { value: nextNote },
          },
          acType,
          tr,
        );
        return kintoneApiPut('/k/v1/record.json', {
          app: kintone.app.getId(),
          id: tid,
          revision: rev,
          record: putRec,
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

  function createMisregistrationCancelHeaderButton674(event) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '登録ミス取消';
    btn.setAttribute('aria-label', '登録ミスとしてステータスを取消に変更する');
    btn.style.cssText =
      'margin:4px 8px 4px 0;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;border-radius:6px;' +
      'border:1px solid #b45309;background:linear-gradient(165deg,#fcd34d 0%,#f59e0b 55%,#d97706 100%);color:#78350f;' +
      'box-shadow:0 2px 8px rgba(217,119,6,.35);letter-spacing:.02em;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setTimeout(function () {
        runMisregistrationCancel674(event);
      }, 0);
    });
    return btn;
  }

  function runMisregistrationCancel674(event) {
    const rec = event.record;
    const rid = String((rec.$id && rec.$id.value) || '').trim();
    if (!rid) {
      window.alert('保存済みレコードでのみ実行できます。');
      return Promise.resolve();
    }
    if (isPcStatusInactive674(readPcStatusLive674(rec))) {
      window.alert('すでに廃棄または取消の状態です。');
      return Promise.resolve();
    }
    const ok = window.confirm(
      'このレコードを **登録ミス取消** にします。\n\n' +
        '・ステータスを「取消」に変更（物理削除はしません）\n' +
        '・一覧の通常ビューからは非表示になります\n' +
        '・M365 割当がある場合は解放します\n' +
        '・社員マスタ（595）の PC 台帳リンクも解除します\n\n' +
        '続行しますか？',
    );
    if (!ok) return Promise.resolve();

    const prev = snapshotBeforeEdit674[rid] || extractState674(rec);
    const stamp = '[登録ミス取消 ' + todayYmd674() + ']';
    const notePrev = trimmedScalarValue674(rec, FC_NOTE);
    const noteNext = notePrev ? notePrev + '\n' + stamp : stamp;
    const appId = kintone.app.getId();

    return kintoneApiGet('/k/v1/record.json', { app: appId, id: rid })
      .then(function (getResp) {
        const rev = getResp.record && getResp.record.$revision && getResp.record.$revision.value;
        return kintoneApiPut('/k/v1/record.json', {
          app: appId,
          id: rid,
          revision: rev,
          record: {
            [FC_PC_STATUS]: { value: PC_STATUS_CANCELLED_674 },
            [FC_NOTE]: { value: noteNext },
          },
        });
      })
      .then(function () {
        return kintoneApiGet('/k/v1/record.json', { app: appId, id: rid });
      })
      .then(function (getResp2) {
        snapshotBeforeEdit674[rid] = prev;
        const fakeEvent = {
          type: 'app.record.edit.submit.success',
          record: getResp2.record,
          recordId: rid,
        };
        return runPostSaveHooks674(fakeEvent);
      })
      .then(function () {
        window.alert('登録ミス取消が完了しました（ステータス: 取消）。');
        window.location.href = '/k/' + appId + '/show#record=' + rid;
      })
      .catch(function (e) {
        console.error('[NEW-PC-LEDGER-V1] 登録ミス取消', e);
        window.alert('登録ミス取消に失敗しました: ' + (e && e.message ? e.message : String(e)));
      });
  }

  function getOneRecordApp674(app, query, fields) {
    return kintoneApiGet('/k/v1/records.json', { app: app, query: query, fields: fields }).then(function (r) {
      return r.records && r.records.length ? r.records[0] : null;
    });
  }

  /**
   * 買替用 PC 名: §4.3.1 と同式（台帳 max+1）。共有→S-JBIS、個人/JR→JBIS。
   * マスタ占有なし（旧596削除済）。POST 失敗時の rollback は no-op。
   * @returns {Promise<{ newPcName: string, pcSerialNo: string, rollbackClaim: () => Promise<void> }>}
   */
  function allocateNextPcNameForReplacement674(accountType) {
    return loadEnv670Map().then(function (envMap) {
      const shared = accountType === TYPE_SHARED;
      const serialP = shared
        ? fetchNextSharedSjbisSerial674()
        : fetchNextPersonalJbisSerial674(envMap || {});
      return serialP.then(function (next) {
        const yyyymm = formatYYYYMMJst674() || yyyymmTokyo674();
        if (!yyyymm) throw new Error('買替用の年月（YYYYMM）を取得できませんでした。');
        let serialNum;
        let prefix;
        if (shared) {
          prefix = String((envMap && envMap.PC_NAME_PREFIX_SHARED) || 'S-JBIS').trim() || 'S-JBIS';
          serialNum = toPositiveInt674(next) || 1;
        } else {
          prefix = String((envMap && envMap.PC_NAME_PREFIX_PERSONAL) || 'JBIS').trim() || 'JBIS';
          serialNum = Math.max(
            toPositiveInt674(next) || 1,
            parsePersonalJbisSerialFloor674(envMap || {}),
          );
        }
        const newPcName = prefix + formatPcNameJbisSerialDigits674(serialNum) + '-' + yyyymm;
        return {
          newPcName: newPcName,
          pcSerialNo: String(serialNum),
          rollbackClaim: function () {
            return Promise.resolve();
          },
        };
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

  /**
   * POST に載せると API が拒否するビルトイン／計算／添付。
   * 注意: GET レコード上の「レコード番号」は type=`RECORD_NUMBER`（エラー文言の RECORD_ID とは別名）。
   * `$id` は `__ID__` で code が `$` 始まりのため別経路で除外。
   */
  const SKIP_CLONE_FIELD_TYPES_674 = new Set([
    'CALC',
    'FILE',
    'RECORD_ID',
    'RECORD_NUMBER',
    'CREATOR',
    'CREATED_TIME',
    'MODIFIER',
    'UPDATED_TIME',
    'STATUS',
    'STATUS_ASSIGNEE',
    'CATEGORY',
  ]);
  const SKIP_CLONE_FIELD_CODES_674 = new Set([
    'レコード番号',
    '作成者',
    '作成日時',
    '更新者',
    '更新日時',
    'ステータス',
    'カテゴリー',
    '作業者',
  ]);

  /**
   * REST POST/PUT 用に type を落として value のみにする（買替 POST 用）。
   */
  function toApiRecordValuesOnly674(typedRecord) {
    const out = {};
    for (const code of Object.keys(typedRecord || {})) {
      const cell = typedRecord[code];
      if (!cell || typeof cell !== 'object') continue;
      if (!Object.prototype.hasOwnProperty.call(cell, 'value')) continue;
      const t = cell.type;
      const v = cell.value;
      // 空文字の DATE/DATETIME/NUMBER は CB_VA01 になり得るため送信しない（省略＝未設定）
      if (
        (t === 'DATE' || t === 'DATETIME' || t === 'TIME' || t === 'NUMBER') &&
        (v === '' || v == null)
      ) {
        continue;
      }
      out[code] = { value: v };
    }
    return out;
  }

  /**
   * API 取得レコードをベースに POST 用レコードを組み立てる（資産・SKYSEA 系はクリア、アカウントは継承）。
   * @param {string} [old674RecordId] 買替元 674 の $id（import_source 追跡用）
   * @param {string} [pcSerialNo] 台帳次番（pc_serial_no）。未指定なら空のまま
   */
  function build674ReplacementPostRecord674(srcRecord, newPcName, old674RecordId, pcSerialNo) {
    const out = {};
    for (const code of Object.keys(srcRecord || {})) {
      const cell = srcRecord[code];
      if (!cell || typeof cell !== 'object') continue;
      if (code.startsWith('$')) continue;
      if (SKIP_CLONE_FIELD_CODES_674.has(code)) continue;
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

    // skysea_manual_done はフォーム必須（**個人のみ**対象）。買替新PCは個人想定で「未了」をセット
    if (out[FC_SKYSEA_MANUAL_DONE]) {
      out[FC_SKYSEA_MANUAL_DONE].value = SKYSEA_MANUAL_DONE_PENDING;
    } else {
      out[FC_SKYSEA_MANUAL_DONE] = { type: 'DROP_DOWN', value: SKYSEA_MANUAL_DONE_PENDING };
    }

    if (out[FC_PC_NAME]) {
      out[FC_PC_NAME].value = newPcName;
    } else {
      out[FC_PC_NAME] = { type: 'SINGLE_LINE_TEXT', value: newPcName };
    }
    const ser = String(pcSerialNo || '').trim();
    if (ser) {
      if (out[FC_PC_SERIAL_NO]) {
        out[FC_PC_SERIAL_NO].value = ser;
      } else {
        out[FC_PC_SERIAL_NO] = { type: 'NUMBER', value: ser };
      }
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

    const oldPcName = String((srcRecord[FC_PC_NAME] && srcRecord[FC_PC_NAME].value) || '').trim();
    const replaceNoteStamp =
      '[PC買替 ' +
      todayYmd674() +
      '] 旧PC「' +
      oldPcName +
      '」を廃棄に変更（旧レコード番号: ' +
      (oid || '—') +
      '）';
    out[FC_NOTE] = { type: 'MULTI_LINE_TEXT', value: replaceNoteStamp };

    return out;
  }

  function show674ReplacementFollowupBanner674(needSkyseaClientDelete) {
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
      let html =
        '【PC買替の続き】編集画面です。<strong>メーカー・モデル名・シリアル</strong>を入力してから保存してください（未入力では保存できません）。購入日・在庫日・備考も忘れずに。';
      if (needSkyseaClientDelete) {
        html +=
          '<br><span style="color:#b91c1c;font-weight:800;">旧PCは SKYSEA 導入済のため、クライアント削除が必要です。室長へ手順を確認し必ず実施してください。</span><br>' +
          '旧PCは admin の「SKYSEAクライアント削除対応」リストで完了にしてください。';
      }
      el.innerHTML = html;
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
        window.alert(
          needSkyseaClientDelete
            ? 'PC買替後は端末情報の入力と、旧PCの SKYSEA クライアント削除（室長確認・必須）を忘れないでください。'
            : 'PC買替後は端末情報（メーカー・モデル名・シリアル）の入力を忘れないでください。',
        );
      } catch (_a) {
        /* noop */
      }
    }, 400);
  }

  function maybeShow674ReplacementNoticeFromStorage674() {
    try {
      const flag = sessionStorage.getItem(STORAGE_KEY_674_REPLACE_NOTICE);
      if (!flag) return;
      sessionStorage.removeItem(STORAGE_KEY_674_REPLACE_NOTICE);
      show674ReplacementFollowupBanner674(flag === 'skysea');
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

    let claim = null;
    /** POST 成功後にセット。以降の 671/595 で失敗した場合は旧ステータス復元はしない */
    let createdNewId = '';

    return get674RecordPayloadById674(oldId)
      .then(function (payloadPre) {
        const srcPre = (payloadPre && payloadPre.record) || {};
        const stPre = (srcPre[FC_PC_STATUS] && srcPre[FC_PC_STATUS].value) || '';
        if (shouldBeInactiveForReplace674(stPre)) {
          window.alert('このレコードはすでに廃棄・取消等の状態です。PC買替は実行できません。');
          return null;
        }
        const oldPcName = String((srcPre[FC_PC_NAME] && srcPre[FC_PC_NAME].value) || '').trim() || '（PC名未設定）';
        const ok1 = window.confirm('旧PC「' + oldPcName + '」は廃棄になります。よろしいですか？');
        if (!ok1) return null;
        const ok2 = window.confirm('買替後PCへアカウント情報を引き継ぎます。よろしいですか？');
        if (!ok2) return null;
        return payloadPre;
      })
      .then(function (payloadPre) {
        if (!payloadPre) return null;
        return get674RecordPayloadById674(oldId);
      })
      .then(function (payload0) {
        if (!payload0) return null;
        const src0 = payload0.record;
        const st0 = (src0[FC_PC_STATUS] && src0[FC_PC_STATUS].value) || '';
        if (shouldBeInactiveForReplace674(st0)) {
          window.alert('このレコードはすでに廃棄・取消等の状態です。PC買替は実行できません。');
          return null;
        }
        const acType0 = (src0[FC_ACCOUNT_TYPE] && src0[FC_ACCOUNT_TYPE].value) || '';
        return allocateNextPcNameForReplacement674(acType0).then(function (c) {
          claim = c;
          return { src0: src0, newPcName: c.newPcName, pcSerialNo: c.pcSerialNo };
        });
      })
      .then(function (ctx) {
        if (!ctx || !claim) return null;
        const postBody = build674ReplacementPostRecord674(
          ctx.src0,
          ctx.newPcName,
          oldId,
          ctx.pcSerialNo,
        );
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
            const srcForSkysea = freshOld.record || ctx.src0;
            const needSkyseaDel = needsSkyseaClientDeleteAfterDispose674(acType, srcForSkysea);
            const oldPut = markSkyseaClientDeletePending674(
              {
                [FC_PC_STATUS]: { value: STATUS_AFTER_REPLACE_OLD_674 },
              },
              acType,
              srcForSkysea,
            );
            return kintoneApiPut('/k/v1/record.json', {
              app: kintone.app.getId(),
              id: oldId,
              revision: freshOld.revision,
              record: oldPut,
            }).then(function () {
              return kintoneApiPost('/k/v1/record.json', {
                app: kintone.app.getId(),
                record: toApiRecordValuesOnly674(postBody),
              }).then(function (created) {
                return { created: created, needSkyseaDel: needSkyseaDel };
              });
            });
          })
          .then(function (pack) {
            const created = pack && pack.created;
            const needSkyseaDel = !!(pack && pack.needSkyseaDel);
            const newId = created && created.id != null ? String(created.id) : '';
            if (!newId) throw new Error('新規レコードの id を取得できませんでした。');
            createdNewId = newId;

            let chain = get674RecordPayloadById674(oldId).then(function (payloadOldNote) {
              const tr = payloadOldNote.record || {};
              const prevNote = String((tr[FC_NOTE] && tr[FC_NOTE].value) || '').trim();
              const stamp =
                '[PC買替 ' + todayYmd674() + '] 本PCを廃棄に変更。新レコード番号: ' + newId;
              const nextNote = prevNote ? prevNote + '\n' + stamp : stamp;
              if (!payloadOldNote.revision) return;
              return kintoneApiPut('/k/v1/record.json', {
                app: kintone.app.getId(),
                id: oldId,
                revision: payloadOldNote.revision,
                record: {
                  [FC_NOTE]: { value: nextNote },
                },
              }).catch(function (eNote) {
                console.warn('[NEW-PC-LEDGER-V1] PC買替 旧PC備考追記', eNote);
              });
            });
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
                sessionStorage.setItem(
                  STORAGE_KEY_674_REPLACE_NOTICE,
                  needSkyseaDel ? 'skysea' : '1',
                );
              } catch (_s) {
                /* noop */
              }
              window.alert(
                'PC買替の新規レコードを編集画面で開きます。\nメーカー・モデル名・シリアルを入力してから保存してください。' +
                  (needSkyseaDel
                    ? '\n\n旧PCは SKYSEA 導入済のため、クライアント削除対応も必要です。'
                    : ''),
              );
              location.href =
                location.origin +
                '/k/' +
                encodeURIComponent(String(kintone.app.getId())) +
                '/show#record=' +
                encodeURIComponent(newId) +
                '&mode=edit';
            });
          })
          .catch(function (ePost) {
            const rollClaim =
              !createdNewId && claim && typeof claim.rollbackClaim === 'function'
                ? claim.rollbackClaim().catch(function (_r) {
                    /* noop */
                  })
                : Promise.resolve();
            return rollClaim
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
        window.alert('PC買替に失敗しました。\n' + formatKintoneApiError674(e));
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

  /**
   * P2: ヘッダの副操作・危険操作を「その他の操作」に格納（初期閉じ）。
   * @param {HTMLElement} wrapper
   * @param {HTMLElement[]} overflowNodes
   */
  function append674HeaderOverflow674(wrapper, overflowNodes) {
    if (!wrapper || !overflowNodes || !overflowNodes.length) return;
    const det = document.createElement('details');
    det.className = 'npl674-header-overflow';
    det.style.cssText =
      'margin:4px 8px 4px 0;padding:0;border:1px solid #cbd5e1;border-radius:6px;background:#fff;';
    const sum = document.createElement('summary');
    sum.textContent = 'その他の操作';
    sum.style.cssText =
      'padding:6px 12px;cursor:pointer;font-size:13px;font-weight:700;color:#334155;list-style:none;';
    det.appendChild(sum);
    const body = document.createElement('div');
    body.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:6px 8px 8px;' +
      'border-top:1px solid #e2e8f0;';
    for (let oi = 0; oi < overflowNodes.length; oi++) {
      body.appendChild(overflowNodes[oi]);
    }
    det.appendChild(body);
    wrapper.appendChild(det);
  }

  /**
   * 主操作を最大3件に抑え、超過分はその他へ回す。
   * @param {HTMLElement[]} primary
   * @param {HTMLElement[]} overflow
   */
  function cap674HeaderPrimary674(primary, overflow) {
    while (primary.length > 3) {
      overflow.unshift(primary.pop());
    }
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

    const primaryBtns = [];
    const overflowBtns = [];

    const btnReset674 = createGenerateButton('🔴 全フィールドリセット', '#dc3545', () => {
      const ok = window.confirm(
        'PC名・シリアル・利用者名・所属・各種アカウント・SKYSEA・備考など、入力欄をまとめて空にします。種別・ステータス（利用中/保管/廃棄/取消）・作成日時（JST）は変えません。続行しますか？',
      );
      if (!ok) return;
      runClearAccountFields();
    });

    const btnReplace674 = createGenerateButton('🔄 PC買替', '#6c757d', () => {
      runPcReplacementFlow674().catch(function (e) {
        console.error('[NEW-PC-LEDGER-V1] PC買替', e);
        window.alert('PC買替でエラー: ' + (e && e.message ? e.message : String(e)));
      });
    });

    const btnPrint674 = createGenerateButton('📄 印刷', '#0dcaf0', () => {
      const rec = resolve674PrintRecord();
      if (!rec) {
        window.alert('レコードを取得できませんでした。画面を開き直すか、一覧から再度開いてください。');
        return;
      }
      open674SystemInfoPrintWindow(rec);
    });

    if (!isRecordDetail674) {
      /** 新規 create では event.record の種別が空のまま・DOM だけ先に 個人/共有 等のことがある */
      const type = readAccountTypeLive674(event.record);

      if (!inStorage674) {
        if (isPersonal595AssistEnabled674(event.record)) {
          overflowBtns.push(
            createGenerateButton('🔵 個人用 自動生成', '#0d6efd', () => {
              runPersonalAutoGen().catch(function (e) {
                console.error(e);
                window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
              });
            }),
          );
        }

        if (type === TYPE_SHARED) {
          overflowBtns.push(
            createGenerateButton('🟢 共有用 自動生成', '#198754', () => {
              runSharedAutoGen().catch(function (e) {
                console.error(e);
                window.alert('自動生成でエラー: ' + (e && e.message ? e.message : String(e)));
              });
            }),
          );
        }

        if (type === TYPE_SHARED || type === TYPE_JR) {
          overflowBtns.push(createM365InputHeaderButton674());
        }

        if (isPersonal595AssistEnabled674(event.record)) {
          primaryBtns.push(
            createInputAssistHeaderButton674(
              '595 社員マスタ',
              NPL674_INPUT_ASSIST_MSG_PERSONAL,
              openEmployee595SearchModal674,
            ),
          );
        }
        if (isPersonal595AssistEnabled674(event.record) && event.record && event.record[FC_NPL_TRANSFER_MANUAL]) {
          overflowBtns.push(createTransferDisposeHeaderButton674());
        }
        if (
          event.record &&
          event.record.$id &&
          event.record.$id.value &&
          !isPcStatusInactive674(readPcStatusLive674(event.record))
        ) {
          overflowBtns.push(createMisregistrationCancelHeaderButton674(event));
        }
        if (type === TYPE_SHARED || type === TYPE_JR) {
          primaryBtns.push(
            createInputAssistHeaderButton674(
              '680 所属候補',
              NPL674_INPUT_ASSIST_MSG_SHARED_JR,
              openDeptMasterModal674,
            ),
          );
        }
      }

      if (inStorage674) {
        primaryBtns.push(btnReset674);
      } else {
        overflowBtns.push(btnReset674);
      }
    }

    if (
      isRecordDetail674 &&
      npl674InventoryPeriodActive674 &&
      isInventoryTargetRecord674(event.record) &&
      event.record &&
      event.record[FC_INVENTORY_HISTORY]
    ) {
      primaryBtns.push(createInventoryIndividualButton674(event.record));
    }

    if (isRecordDetail674) {
      if (!inStorage674) {
        primaryBtns.push(btnReplace674);
        primaryBtns.push(btnPrint674);
      }
    } else if (!inStorage674) {
      primaryBtns.push(btnReplace674);
      primaryBtns.push(btnPrint674);
    }

    cap674HeaderPrimary674(primaryBtns, overflowBtns);
    for (let pi = 0; pi < primaryBtns.length; pi++) {
      wrapper.appendChild(primaryBtns[pi]);
    }
    append674HeaderOverflow674(wrapper, overflowBtns);

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
      event.type === 'app.record.detail.show' ||
      event.type === 'mobile.app.record.detail.show'
    ) {
      closeRecordSideBar674();
    }
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
    applyVisibilityByType(event.record);
    applySkyseaGroupUi(event.record, editable ? 'editable' : 'detail');
    if (editable) {
      ensureSkyseaManualDoneOnRecord674(event.record);
    }
    applyM365MasterRecordIdFieldUi674(event.record, editable ? 'editable' : 'detail');
    syncVpnFieldUiToForm674(event.record, editable ? 'editable' : 'detail');
    showJrBannerIfNeeded(event.record);
    ensure674PcStatusBanner674(event.record);
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
          return ensureInventoryPeriodLoaded674();
        })
        .then(function () {
          scheduleInjectButtons674(event);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] inventory period', e);
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
    applyVisibilityByType(result.record);
    applySkyseaGroupUi(result.record, 'editable');
    applyM365MasterRecordIdFieldUi674(result.record, 'editable');
    syncVpnFieldUiToForm674(result.record, 'editable');
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

  /**
   * 未了→完了に変えたとき、対応日が空なら今日（ローカル YYYY-MM-DD）をセット。
   * 既存日付は上書きしない。未了のままでは日付を入れない。
   */
  function onSkyseaManualDoneChange674(event) {
    if (!isSkyseaAdmin674()) return event;
    const done = String(
      (event.record[FC_SKYSEA_MANUAL_DONE] && event.record[FC_SKYSEA_MANUAL_DONE].value) || '',
    ).trim();
    if (done !== SKYSEA_MANUAL_DONE_COMPLETE) return event;
    const dateCell = event.record[FC_SKYSEA_MANUAL_DATE];
    if (!dateCell) return event;
    const cur = String(dateCell.value || '').trim();
    if (cur) return event;
    dateCell.value = todayYmd674();
    return event;
  }

  const skyseaManualDoneChangeEvents674 = [
    'app.record.create.change.' + FC_SKYSEA_MANUAL_DONE,
    'app.record.edit.change.' + FC_SKYSEA_MANUAL_DONE,
  ];
  kintone.events.on(skyseaManualDoneChangeEvents674, onSkyseaManualDoneChange674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(
      [
        'mobile.app.record.create.change.' + FC_SKYSEA_MANUAL_DONE,
        'mobile.app.record.edit.change.' + FC_SKYSEA_MANUAL_DONE,
      ],
      onSkyseaManualDoneChange674,
    );
  }

  // --- 一覧：リスト一覧作成（同ページ全画面パネル・印刷横向き） ---
  const LIST674_MODAL_ID = 'npl674-list-create-modal';
  const LIST674_PANEL_ID = 'npl674-list-result-panel';
  const LIST674_LOADING_ID = 'npl674-list-loading-overlay';
  const LIST674_PRINT_STYLE_ID = 'npl674-list-print-style';
  const LIST674_TYPE_OPTIONS = [
    { value: TYPE_PERSONAL, label: '個人' },
    { value: TYPE_SHARED, label: '共有' },
    { value: TYPE_JR, label: 'JR端末' },
  ];
  /** リスト一覧・Excel・印刷で選べる列（浜田 2026-07-09・支店リスト作成向け） */
  const LIST674_EXPORT_COL_CATALOG = [
    { label: '種別', code: FC_ACCOUNT_TYPE, defaultOn: true },
    { label: 'PC名', code: FC_PC_NAME, defaultOn: true },
    { label: '所属', code: FC_DEPT_NAME, defaultOn: true },
    { label: '利用者', code: FC_USER_NAME, defaultOn: true },
    { label: 'WindowsID', code: FC_LOGON_NAME, defaultOn: true },
    { label: 'Windowsパスワード', code: FC_LOGON_PW, defaultOn: true, sensitive: true },
    { label: 'メールアドレス', code: FC_MAIL, defaultOn: true },
    { label: 'メールアカウント', code: FC_MAIL_ACCT, defaultOn: true },
    { label: 'メールパスワード', code: FC_MAIL_PW, defaultOn: true, sensitive: true },
    { label: 'M365 ID', code: FC_M365_ID, defaultOn: true },
    { label: 'M365 PW', code: FC_M365_PW, defaultOn: true, sensitive: true },
    { label: 'VPN ID', code: FC_VPN_ID, defaultOn: true },
    { label: 'VPN PW', code: FC_VPN_PW, defaultOn: true, sensitive: true },
    { label: 'グループ', code: FC_GROUP_NAME, defaultOn: false },
    { label: '状態', code: FC_PC_STATUS, defaultOn: false },
    { label: 'Windows名', code: FC_WINDOWS_NAME, defaultOn: false },
  ];

  function list674DefaultExportCols674() {
    return LIST674_EXPORT_COL_CATALOG.filter(function (c) {
      return c.defaultOn;
    });
  }

  function list674ReadSelectedExportCols674() {
    const row = document.getElementById('npl674-list-col-row');
    if (!row) return list674DefaultExportCols674();
    const selected = [];
    LIST674_EXPORT_COL_CATALOG.forEach(function (colDef) {
      const cb = row.querySelector(
        'input[type=checkbox][data-npl-list-col][value="' + colDef.code + '"]'
      );
      if (cb && cb.checked) selected.push(colDef);
    });
    return selected;
  }

  function resetList674ColCheckboxes674() {
    const row = document.getElementById('npl674-list-col-row');
    if (!row) return;
    row.querySelectorAll('input[type=checkbox][data-npl-list-col]').forEach(function (cb) {
      const def = LIST674_EXPORT_COL_CATALOG.find(function (c) {
        return c.code === cb.value;
      });
      cb.checked = !!(def && def.defaultOn);
    });
    updateList674SensitiveNotice674();
  }

  function updateList674SensitiveNotice674() {
    const note = document.getElementById('npl674-list-sensitive-note');
    if (!note) return;
    const cols = list674ReadSelectedExportCols674();
    const hasSensitive = cols.some(function (c) {
      return c.sensitive;
    });
    note.style.display = hasSensitive ? 'block' : 'none';
  }

  function exportList674Xlsx674(records, cols) {
    if (typeof XLSX === 'undefined' || !XLSX.utils || !XLSX.writeFile) {
      window.alert('Excel 出力用ライブラリが読み込まれていません。管理者に連絡してください。');
      return;
    }
    if (!records.length) {
      window.alert('出力対象がありません。');
      return;
    }
    const useCols = cols && cols.length ? cols : list674DefaultExportCols674();
    const header = useCols.map(function (c) {
      return c.label;
    });
    const matrix = [header];
    for (let i = 0; i < records.length; i++) {
      matrix.push(
        useCols.map(function (col) {
          return cell674PlainForSearch(records[i], col.code);
        })
      );
    }
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '一覧');
    const ymd = todayYmd674().replace(/-/g, '');
    XLSX.writeFile(wb, 'PC台帳674_' + ymd + '.xlsx', { bookType: 'xlsx' });
  }

  function ensureList674PrintStyles674() {
    /* S-PRINT-ROOT-01: 既存 LIST674 は visibility:hidden。次に触るとき print-root へ移行 */
    if (document.getElementById(LIST674_PRINT_STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = LIST674_PRINT_STYLE_ID;
    st.textContent =
      '@media print{@page{size:landscape;margin:10mm;}' +
      'body *{visibility:hidden !important;}' +
      '#' +
      LIST674_PANEL_ID +
      ',#' +
      LIST674_PANEL_ID +
      ' *{visibility:visible !important;}' +
      '#' +
      LIST674_PANEL_ID +
      '{position:absolute !important;left:0 !important;top:0 !important;width:100% !important;' +
      'max-height:none !important;background:#fff !important;}' +
      '#' +
      LIST674_PANEL_ID +
      ' .npl674-list-toolbar{display:none !important;}' +
      '#' +
      LIST674_PANEL_ID +
      ' .npl674-list-scroll{overflow:visible !important;max-height:none !important;}}';
    document.head.appendChild(st);
  }

  function closeList674Modal674() {
    const m = document.getElementById(LIST674_MODAL_ID);
    if (m) m.style.display = 'none';
  }

  function closeList674ResultPanel674() {
    const p = document.getElementById(LIST674_PANEL_ID);
    if (p) p.remove();
    showList674Loading674(false);
  }

  function showList674Loading674(show) {
    let ld = document.getElementById(LIST674_LOADING_ID);
    if (!show) {
      if (ld) ld.remove();
      return;
    }
    if (!ld) {
      ld = document.createElement('div');
      ld.id = LIST674_LOADING_ID;
      ld.style.cssText =
        'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.45);' +
        'display:flex;align-items:center;justify-content:center;font:600 15px system-ui,sans-serif;color:#fff;';
      ld.textContent = '一覧を取得しています…';
      document.body.appendChild(ld);
    }
    ld.style.display = 'flex';
  }

  /** リスト一覧作成: 単一フィールドの部分一致（kintone `like`） */
  function appendList674LikeField674(parts, fieldCode, raw) {
    const v = String(raw || '').trim();
    if (!v) return;
    parts.push('(' + fieldCode + ' like "' + escape674QueryLike(v) + '")');
  }

  function buildList674Query674(deptName, groupName, userName, selectedTypes, includeCurrentListQuery, selectedDepts) {
    const parts = [];
    if (includeCurrentListQuery) {
      let cur = '';
      try {
        if (typeof kintone.app.getQueryCondition === 'function') {
          cur = String(kintone.app.getQueryCondition() || '').trim();
        }
      } catch (_e) {
        /* noop */
      }
      if (!cur) {
        const read = read674IndexSearchQueryAndKw674();
        cur = String(read.urlQuery || read.urlNativeQ || '').trim();
      }
      if (cur) parts.push('(' + cur + ')');
    }
    const types = selectedTypes instanceof Set ? [...selectedTypes] : [];
    if (types.length) {
      const quoted = types
        .map(function (t) {
          return '"' + escape674QueryLike(t) + '"';
        })
        .join(', ');
      parts.push('(' + FC_ACCOUNT_TYPE + ' in (' + quoted + '))');
    }
    append674DeptNameInFilter674(parts, selectedDepts);
    appendList674LikeField674(parts, FC_DEPT_NAME, deptName);
    appendList674LikeField674(parts, FC_GROUP_NAME, groupName);
    appendList674LikeField674(parts, FC_USER_NAME, userName);
    if (!parts.length) return '';
    return parts.join(' and ');
  }

  function fetchList674Records674(queryCond, exportCols) {
    const app = kintone.app.getId();
    const cols = exportCols && exportCols.length ? exportCols : list674DefaultExportCols674();
    const fields = ['$id'].concat(
      cols.map(function (c) {
        return c.code;
      })
    );
    const base = String(queryCond || '').trim();
    const all = [];
    return new Promise(function (resolve, reject) {
      function page(off) {
        const order =
          ' order by ' + FC_DEPT_NAME + ' asc, ' + FC_PC_NAME + ' asc limit 500 offset ' + off;
        const q = (base ? base : '$id > 0') + order;
        kintone
          .api(kintone.api.url('/k/v1/records', true), 'GET', { app: app, query: q, fields: fields })
          .then(function (res) {
            const recs = res.records || [];
            for (let i = 0; i < recs.length; i++) all.push(recs[i]);
            if (recs.length < 500) resolve(all);
            else page(off + 500);
          })
          .catch(reject);
      }
      page(0);
    });
  }

  function renderList674ResultPanel674(records, summaryText, exportCols) {
    closeList674ResultPanel674();
    ensureList674PrintStyles674();
    const cols = exportCols && exportCols.length ? exportCols : list674DefaultExportCols674();
    const panel = document.createElement('div');
    panel.id = LIST674_PANEL_ID;
    panel.dataset.nplListCols = JSON.stringify(
      cols.map(function (c) {
        return c.code;
      })
    );
    panel.style.cssText =
      'position:fixed;inset:0;z-index:2147482900;background:#f8fafc;display:flex;flex-direction:column;' +
      'font-family:system-ui,sans-serif;color:#0f172a;';

    const toolbar = document.createElement('div');
    toolbar.className = 'npl674-list-toolbar';
    toolbar.style.cssText =
      'flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 16px;' +
      'background:#0f172a;color:#fff;';

    const titleWrap = document.createElement('div');
    titleWrap.style.cssText = 'flex:1;min-width:200px;';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:15px;font-weight:700;';
    title.textContent = 'リスト一覧（' + records.length + '件）';
    titleWrap.appendChild(title);
    if (summaryText) {
      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:12px;font-weight:500;opacity:.9;margin-top:4px;';
      sub.textContent = summaryText;
      titleWrap.appendChild(sub);
    }

    const btnExcel = document.createElement('button');
    btnExcel.type = 'button';
    btnExcel.textContent = 'Excel出力';
    btnExcel.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;';
    btnExcel.addEventListener('click', function () {
      exportList674Xlsx674(records, cols);
    });

    const btnPrint = document.createElement('button');
    btnPrint.type = 'button';
    btnPrint.textContent = '印刷';
    btnPrint.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;';
    btnPrint.addEventListener('click', function () {
      window.print();
    });

    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = '閉じる';
    btnClose.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;';
    btnClose.addEventListener('click', closeList674ResultPanel674);

    toolbar.appendChild(titleWrap);
    toolbar.appendChild(btnExcel);
    toolbar.appendChild(btnPrint);
    toolbar.appendChild(btnClose);

    const scroll = document.createElement('div');
    scroll.className = 'npl674-list-scroll';
    scroll.style.cssText = 'flex:1 1 auto;overflow:auto;padding:12px 16px 24px;';

    const table = document.createElement('table');
    table.style.cssText =
      'width:100%;border-collapse:collapse;background:#fff;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    cols.forEach(function (col) {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.style.cssText =
        'position:sticky;top:0;background:#e2e8f0;border:1px solid #cbd5e1;padding:8px 10px;text-align:left;white-space:nowrap;';
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let ri = 0; ri < records.length; ri++) {
      const rec = records[ri];
      const tr = document.createElement('tr');
      tr.style.background = ri % 2 ? '#f8fafc' : '#fff';
      cols.forEach(function (col) {
        const td = document.createElement('td');
        td.textContent = cell674PlainForSearch(rec, col.code);
        td.style.cssText =
          'border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top;word-break:break-word;';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    panel.appendChild(toolbar);
    panel.appendChild(scroll);
    document.body.appendChild(panel);
  }

  /** リスト一覧作成モーダルの入力を初期状態に戻す */
  function resetList674CreateForm674() {
    const u = document.getElementById('npl674-list-user');
    const m = document.getElementById('npl674-list-merge-current');
    if (u) u.value = '';
    if (m) m.checked = true;
    const modal = document.getElementById(LIST674_MODAL_ID);
    if (modal && modal.__npl674OrgPicker && typeof modal.__npl674OrgPicker.clear === 'function') {
      modal.__npl674OrgPicker.clear();
    }
    const typeRow = document.getElementById('npl674-list-type-row');
    if (typeRow) {
      typeRow.querySelectorAll('input[type=checkbox][data-npl-list-type]').forEach(function (cb) {
        cb.checked = true;
      });
    }
    resetList674ColCheckboxes674();
  }

  function openList674CreateModal674() {
    let modal = document.getElementById(LIST674_MODAL_ID);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = LIST674_MODAL_ID;
      modal.style.cssText =
        'position:fixed;inset:0;z-index:2147482800;background:rgba(15,23,42,.5);display:flex;' +
        'align-items:center;justify-content:center;padding:16px;';
      modal.addEventListener('click', function (ev) {
        if (ev.target === modal) closeList674Modal674();
      });

      const box = document.createElement('div');
      box.style.cssText =
        'background:#fff;border-radius:10px;max-width:640px;width:100%;max-height:90vh;overflow:auto;' +
        'padding:20px 22px;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:system-ui,sans-serif;';
      box.addEventListener('click', function (ev) {
        ev.stopPropagation();
      });

      const h = document.createElement('h2');
      h.style.cssText = 'margin:0 0 12px;font-size:17px;font-weight:700;color:#0f172a;';
      h.textContent = 'リスト一覧を作成';

      const intro = document.createElement('p');
      intro.style.cssText = 'margin:0 0 14px;font-size:13px;line-height:1.55;color:#475569;';
      intro.textContent =
        '条件に合うレコードをこの画面内に表で表示します（別ウィンドウは開きません）。' +
        '出力する列を選べます。所属はレ点選択、利用者名は部分一致です。';

      const lblUser = document.createElement('label');
      lblUser.style.cssText = 'display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:#334155;';
      lblUser.textContent = '利用者名（任意・部分一致）';
      const inpUser = document.createElement('input');
      inpUser.type = 'text';
      inpUser.id = 'npl674-list-user';
      inpUser.placeholder = '例: 山田（姓の一部でも可）';
      inpUser.style.cssText =
        'width:100%;box-sizing:border-box;margin-bottom:12px;padding:8px 10px;border:1px solid #94a3b8;border-radius:6px;';

      const orgHost = document.createElement('div');
      orgHost.id = 'npl674-list-org-host';
      orgHost.style.cssText = 'margin-bottom:12px;';
      const listOrgSelected = new Set();
      const listOrgPicker = create674OrgPickerWidget674({
        selectedDepts: listOrgSelected,
        embedded: true,
        onChange: function () {
          /* selection kept in listOrgSelected */
        },
      });
      orgHost.appendChild(listOrgPicker.root);
      modal.__npl674OrgPicker = listOrgPicker;

      const lblTypes = document.createElement('div');
      lblTypes.style.cssText = 'font-size:12px;font-weight:700;margin-bottom:6px;color:#334155;';
      lblTypes.textContent = '種別（1つ以上必須）';
      const typeRow = document.createElement('div');
      typeRow.id = 'npl674-list-type-row';
      typeRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px 16px;margin-bottom:12px;';
      LIST674_TYPE_OPTIONS.forEach(function (opt) {
        const lab = document.createElement('label');
        lab.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = opt.value;
        cb.checked = true;
        cb.dataset.nplListType = '1';
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(opt.label));
        typeRow.appendChild(lab);
      });

      const lblCols = document.createElement('div');
      lblCols.style.cssText =
        'display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-size:12px;font-weight:700;margin:14px 0 6px;color:#334155;';
      lblCols.appendChild(document.createTextNode('出力する列（1つ以上必須）'));
      const btnColAll = document.createElement('button');
      btnColAll.type = 'button';
      btnColAll.textContent = '全選択';
      btnColAll.style.cssText =
        'margin-left:auto;padding:2px 8px;border-radius:4px;border:1px solid #94a3b8;background:#fff;font-size:11px;cursor:pointer;font-weight:600;';
      btnColAll.addEventListener('click', function () {
        const colRow = document.getElementById('npl674-list-col-row');
        if (colRow) {
          colRow.querySelectorAll('input[type=checkbox][data-npl-list-col]').forEach(function (cb) {
            cb.checked = true;
          });
        }
        updateList674SensitiveNotice674();
      });
      const btnColDefault = document.createElement('button');
      btnColDefault.type = 'button';
      btnColDefault.textContent = '既定に戻す';
      btnColDefault.style.cssText =
        'padding:2px 8px;border-radius:4px;border:1px solid #94a3b8;background:#fff;font-size:11px;cursor:pointer;font-weight:600;';
      btnColDefault.addEventListener('click', resetList674ColCheckboxes674);
      lblCols.appendChild(btnColAll);
      lblCols.appendChild(btnColDefault);

      const colRow = document.createElement('div');
      colRow.id = 'npl674-list-col-row';
      colRow.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:8px 10px;margin-bottom:10px;';
      LIST674_EXPORT_COL_CATALOG.forEach(function (colDef) {
        const lab = document.createElement('label');
        lab.style.cssText = 'display:flex;align-items:flex-start;gap:6px;font-size:13px;cursor:pointer;line-height:1.35;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = colDef.code;
        cb.checked = !!colDef.defaultOn;
        cb.dataset.nplListCol = '1';
        cb.addEventListener('change', updateList674SensitiveNotice674);
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(colDef.label));
        colRow.appendChild(lab);
      });

      const sensitiveNote = document.createElement('p');
      sensitiveNote.id = 'npl674-list-sensitive-note';
      sensitiveNote.style.cssText =
        'display:none;margin:0 0 12px;padding:8px 10px;border-radius:6px;background:#fef2f2;color:#991b1b;' +
        'font-size:12px;line-height:1.5;border:1px solid #fecaca;';
      sensitiveNote.textContent =
        'パスワード列を含みます。印刷・Excel は社内管理目的のみ。取扱い・廃棄に注意してください。';

      const lblMerge = document.createElement('label');
      lblMerge.style.cssText =
        'display:flex;align-items:flex-start;gap:8px;font-size:13px;margin-bottom:16px;cursor:pointer;line-height:1.45;';
      const cbMerge = document.createElement('input');
      cbMerge.type = 'checkbox';
      cbMerge.id = 'npl674-list-merge-current';
      cbMerge.checked = true;
      lblMerge.appendChild(cbMerge);
      lblMerge.appendChild(
        document.createTextNode('いまの一覧の絞り込み条件も含める（キーワード・種別チップ等）')
      );

      const btnRow = document.createElement('div');
      btnRow.style.cssText =
        'display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;align-items:center;';

      const btnClear = document.createElement('button');
      btnClear.type = 'button';
      btnClear.textContent = 'クリア';
      btnClear.setAttribute('aria-label', 'リスト作成の条件をクリア');
      btnClear.style.cssText =
        'margin-right:auto;padding:8px 14px;border-radius:6px;border:1px solid #64748b;background:#fff;color:#334155;cursor:pointer;font-weight:700;';
      btnClear.addEventListener('click', resetList674CreateForm674);

      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.textContent = 'キャンセル';
      btnCancel.style.cssText =
        'padding:8px 16px;border-radius:6px;border:1px solid #94a3b8;background:#fff;cursor:pointer;font-weight:600;';
      btnCancel.addEventListener('click', closeList674Modal674);

      const btnGo = document.createElement('button');
      btnGo.type = 'button';
      btnGo.textContent = '一覧を表示';
      btnGo.style.cssText =
        'padding:8px 18px;border-radius:6px;border:none;background:#4f46e5;color:#fff;cursor:pointer;font-weight:700;';
      btnGo.addEventListener('click', function () {
        const selected = new Set();
        typeRow.querySelectorAll('input[type=checkbox][data-npl-list-type]').forEach(function (cb) {
          if (cb.checked) selected.add(cb.value);
        });
        if (!selected.size) {
          window.alert('種別を1つ以上選んでください。');
          return;
        }
        const exportCols = list674ReadSelectedExportCols674();
        if (!exportCols.length) {
          window.alert('出力する列を1つ以上選んでください。');
          return;
        }
        const orgSummary = format674DeptSelectionSummary674(listOrgSelected);
        const q = buildList674Query674(
          '',
          '',
          inpUser.value,
          selected,
          cbMerge.checked,
          listOrgSelected
        );
        const summary =
          '利用者: ' +
          (String(inpUser.value || '').trim() || '（指定なし）') +
          '　／　所属: ' +
          (orgSummary || '（指定なし）') +
          '　／　列: ' +
          exportCols.length +
          '項目' +
          (cbMerge.checked ? '　／　現在の一覧条件を含む' : '');
        closeList674Modal674();
        showList674Loading674(true);
        fetchList674Records674(q, exportCols)
          .then(function (recs) {
            showList674Loading674(false);
            renderList674ResultPanel674(recs, summary, exportCols);
          })
          .catch(function (e) {
            showList674Loading674(false);
            console.warn('[NEW-PC-LEDGER-V1] list create', e);
            window.alert('一覧の取得に失敗しました。条件を変えて再度お試しください。');
          });
      });

      btnRow.appendChild(btnClear);
      btnRow.appendChild(btnCancel);
      btnRow.appendChild(btnGo);
      box.appendChild(h);
      box.appendChild(intro);
      box.appendChild(lblUser);
      box.appendChild(inpUser);
      box.appendChild(orgHost);
      box.appendChild(lblTypes);
      box.appendChild(typeRow);
      box.appendChild(lblCols);
      box.appendChild(colRow);
      box.appendChild(sensitiveNote);
      box.appendChild(lblMerge);
      box.appendChild(btnRow);
      modal.appendChild(box);
      document.body.appendChild(modal);
    }
    resetList674ColCheckboxes674();
    updateList674SensitiveNotice674();
    modal.style.display = 'flex';
    if (modal.__npl674OrgPicker && typeof modal.__npl674OrgPicker.refresh === 'function') {
      modal.__npl674OrgPicker.refresh();
    }
  }

  // --- 一覧：SKYSEA対応一覧（admin 専用・個人のみ・パスワード列なし・所属複数印刷） ---
  const SKYSEA674_PANEL_ID = 'npl674-skysea-list-panel';
  const SKYSEA674_PRINT_STYLE_ID = 'npl674-skysea-list-print-style';
  /** S-PRINT-ROOT-01: SKYSEA 印刷は専用 root。@media print で visibility:hidden を使わない */
  const SKYSEA674_PRINT_ROOT_ID = 'npl674-skysea-print-root';
  const SKYSEA674_EXPORT_COLS = [
    { label: '所属', code: FC_DEPT_NAME },
    { label: '利用者', code: FC_USER_NAME },
    { label: 'PC名', code: FC_PC_NAME },
    { label: '完了・未了', code: FC_SKYSEA_MANUAL_DONE },
    { label: '対応者', code: FC_SKYSEA_MANUAL_HANDLER },
  ];
  const SKYSEA674_EXCLUDED_DEPTS = [
    'システム推進室',
    '関越支店施工部',
    '東京支店橋りょうリペア部',
    '東京支店施工部',
  ];
  function isSkysea674ExcludedDept674(deptName) {
    const d = String(deptName || '').trim();
    return SKYSEA674_EXCLUDED_DEPTS.indexOf(d) !== -1;
  }
  function filterSkysea674RecordsExcludeDepts674(records) {
    return (records || []).filter(function (rec) {
      const d = cell674PlainForSearch(rec, FC_DEPT_NAME) || '（所属なし）';
      return !isSkysea674ExcludedDept674(d);
    });
  }

  function ensureSkysea674PrintStyles674() {
    let st = document.getElementById(SKYSEA674_PRINT_STYLE_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = SKYSEA674_PRINT_STYLE_ID;
      document.head.appendChild(st);
    }
    // visibility:hidden だと裏の kintone 一覧が余白のまま残って白紙が大量に出る。
    // 印刷専用ルート以外は display:none、ルートだけ出す。
    st.textContent =
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      '{display:none;}' +
      '@media print{@page{size:landscape;margin:10mm;}' +
      'html,body{height:auto !important;overflow:visible !important;}' +
      'body > *:not(#' +
      SKYSEA674_PRINT_ROOT_ID +
      '){display:none !important;}' +
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      '{display:block !important;position:static !important;width:100% !important;' +
      'background:#fff !important;color:#000 !important;font-family:sans-serif;}' +
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      ' .npl674-skysea-print-warn{display:block;margin:0 0 8px;font-size:12px;font-weight:700;}' +
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      ' table{width:100%;border-collapse:collapse;font-size:11px;}' +
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      ' th,#' +
      SKYSEA674_PRINT_ROOT_ID +
      ' td{border:1px solid #333;padding:4px 6px;text-align:left;vertical-align:top;word-break:break-word;}' +
      '#' +
      SKYSEA674_PRINT_ROOT_ID +
      ' thead th{background:#e2e8f0;}}';
  }

  function removeSkysea674PrintRoot674() {
    const el = document.getElementById(SKYSEA674_PRINT_ROOT_ID);
    if (el) el.remove();
  }

  function buildSkysea674PrintRoot674(records, doneMode) {
    removeSkysea674PrintRoot674();
    ensureSkysea674PrintStyles674();
    const root = document.createElement('div');
    root.id = SKYSEA674_PRINT_ROOT_ID;

    const warn = document.createElement('div');
    warn.className = 'npl674-skysea-print-warn';
    warn.textContent =
      '社内チェック用・第三者提示禁止／SKYSEA対応一覧（' +
      (doneMode || '') +
      '・' +
      records.length +
      '件）';
    root.appendChild(warn);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    SKYSEA674_EXPORT_COLS.forEach(function (col) {
      const th = document.createElement('th');
      th.textContent = col.label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const tr = document.createElement('tr');
      SKYSEA674_EXPORT_COLS.forEach(function (col) {
        const td = document.createElement('td');
        td.textContent = cell674PlainForSearch(rec, col.code);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    root.appendChild(table);
    document.body.appendChild(root);
    return root;
  }

  function closeSkysea674ListPanel674() {
    const p = document.getElementById(SKYSEA674_PANEL_ID);
    if (p) p.remove();
    removeSkysea674PrintRoot674();
    showList674Loading674(false);
  }

  // --- 一覧：SKYSEAクライアント削除対応（admin 専用・個人・未了） ---
  const SKYSEA674_CLIENT_DELETE_PANEL_ID = 'npl674-skysea-client-delete-panel';
  const SKYSEA674_CLIENT_DELETE_BANNER_ID = 'npl674-skysea-client-delete-banner';
  const M365674_USAGE_PANEL_ID = 'npl674-m365-usage-panel';

  function buildSkyseaClientDeleteListQuery674() {
    return (
      FC_ACCOUNT_TYPE +
      ' in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '") and ' +
      FC_SKYSEA_CLIENT_DELETE_STATUS +
      ' in ("' +
      escapeQueryValue(SKYSEA_CLIENT_DELETE_PENDING) +
      '")'
    );
  }

  function fetchSkyseaClientDeletePendingRecords674() {
    const app = kintone.app.getId();
    const fields = [
      '$id',
      '$revision',
      FC_PC_NAME,
      FC_USER_NAME,
      FC_DEPT_NAME,
      FC_PC_STATUS,
      FC_SKYSEA_CLIENT_DELETE_STATUS,
      FC_SKYSEA_CLIENT_DELETE_DATE,
    ];
    const all = [];
    const base = buildSkyseaClientDeleteListQuery674();
    return new Promise(function (resolve, reject) {
      function page(off) {
        const q =
          base +
          ' order by ' +
          FC_DEPT_NAME +
          ' asc, ' +
          FC_PC_NAME +
          ' asc limit 500 offset ' +
          off;
        kintone
          .api(kintone.api.url('/k/v1/records', true), 'GET', { app: app, query: q, fields: fields })
          .then(function (res) {
            const recs = res.records || [];
            for (let i = 0; i < recs.length; i++) all.push(recs[i]);
            if (recs.length < 500) resolve(all);
            else page(off + 500);
          })
          .catch(reject);
      }
      page(0);
    });
  }

  function countSkyseaClientDeletePending674() {
    if (!isSkyseaAdmin674()) return Promise.resolve(0);
    const app = kintone.app.getId();
    const q = buildSkyseaClientDeleteListQuery674() + ' limit 1';
    return kintone
      .api(kintone.api.url('/k/v1/records', true), 'GET', { app: app, query: q, totalCount: true, fields: ['$id'] })
      .then(function (res) {
        return Number(res.totalCount || 0);
      })
      .catch(function () {
        return fetchSkyseaClientDeletePendingRecords674().then(function (rows) {
          return rows.length;
        });
      });
  }

  function completeSkyseaClientDelete674(recordId, revision) {
    return kintoneApiPut('/k/v1/record.json', {
      app: kintone.app.getId(),
      id: String(recordId),
      revision: revision,
      record: {
        [FC_SKYSEA_CLIENT_DELETE_STATUS]: { value: SKYSEA_CLIENT_DELETE_DONE },
        [FC_SKYSEA_CLIENT_DELETE_DATE]: { value: todayYmd674() },
      },
    });
  }

  function closeSkyseaClientDeleteListPanel674() {
    const p = document.getElementById(SKYSEA674_CLIENT_DELETE_PANEL_ID);
    if (p) p.remove();
    showList674Loading674(false);
  }

  function buildM365Usage674Query674() {
    return (
      FC_ACCOUNT_TYPE +
      ' in ("' +
      escapeQueryValue(TYPE_SHARED) +
      '", "' +
      escapeQueryValue(TYPE_JR) +
      '") and ' +
      buildPcStatusActiveOnlyQuery674() +
      ' and ' +
      FC_M365_MASTER_RECORD_ID +
      ' > 0'
    );
  }

  function fetchM365Usage674Records674() {
    const app = kintone.app.getId();
    const fields = ['$id', FC_PC_NAME, FC_M365_MASTER_RECORD_ID, FC_ACCOUNT_TYPE];
    const base = buildM365Usage674Query674();
    const all = [];
    return new Promise(function (resolve, reject) {
      function page(off) {
        const q =
          base + ' order by ' + FC_M365_MASTER_RECORD_ID + ' asc, $id asc limit 500 offset ' + off;
        kintoneApiGet('/k/v1/records.json', { app: app, query: q, fields: fields })
          .then(function (res) {
            const recs = res.records || [];
            for (let i = 0; i < recs.length; i++) all.push(recs[i]);
            if (recs.length < 500) resolve(all);
            else page(off + 500);
          })
          .catch(reject);
      }
      page(0);
    });
  }

  function fetchM671RecordsByIds674(masterIds) {
    const uniq = [];
    const seen = Object.create(null);
    for (let i = 0; i < (masterIds || []).length; i++) {
      const s = String(masterIds[i] || '').trim();
      if (!s || seen[s]) continue;
      seen[s] = true;
      uniq.push(s);
    }
    if (!uniq.length) return Promise.resolve([]);
    const all = [];
    const chunkSize = 100;
    function fetchChunk(start) {
      const chunk = uniq.slice(start, start + chunkSize);
      if (!chunk.length) return Promise.resolve(all);
      const q = '$id in (' + chunk.join(',') + ')';
      return kintoneApiGet('/k/v1/records.json', {
        app: APP_M365_MASTER,
        query: q,
        fields: ['$id', FC_M365_ID, 'usage_count', 'status'],
      }).then(function (res) {
        const recs = res.records || [];
        for (let j = 0; j < recs.length; j++) all.push(recs[j]);
        return fetchChunk(start + chunkSize);
      });
    }
    return fetchChunk(0);
  }

  function aggregateM365UsageFrom674Records674(records674) {
    const byMid = Object.create(null);
    for (let i = 0; i < (records674 || []).length; i++) {
      const rec = records674[i];
      const mid = String((rec[FC_M365_MASTER_RECORD_ID] && rec[FC_M365_MASTER_RECORD_ID].value) || '').trim();
      if (!mid) continue;
      if (!byMid[mid]) byMid[mid] = { mid: mid, pcs: [] };
      const rid = rec.$id && rec.$id.value;
      const pcName = String((rec[FC_PC_NAME] && rec[FC_PC_NAME].value) || '').trim();
      byMid[mid].pcs.push({ rid: rid, pcName: pcName || '（PC名なし）' });
    }
    return byMid;
  }

  function countUniquePcNamesM365Usage674(pcs) {
    const seen = Object.create(null);
    let n = 0;
    for (let i = 0; i < (pcs || []).length; i++) {
      const k = pcs[i].pcName;
      if (seen[k]) continue;
      seen[k] = true;
      n++;
    }
    return n;
  }

  function buildM365UsageRows674(byMid, map671, lim) {
    const rows = [];
    const mids = Object.keys(byMid || {});
    for (let i = 0; i < mids.length; i++) {
      const mid = mids[i];
      const agg = byMid[mid];
      const ledgerCount = countUniquePcNamesM365Usage674(agg.pcs);
      const r671 = map671[mid];
      const m365Id = r671 ? (r671[FC_M365_ID] && r671[FC_M365_ID].value) || '' : '';
      const masterUsage =
        r671 != null
          ? parseInt((r671.usage_count && r671.usage_count.value) || '0', 10) || 0
          : null;
      let status = r671 ? (r671.status && r671.status.value) || '' : '';
      if (!status) status = next671StatusFromUsage(ledgerCount, lim);
      rows.push({
        mid: mid,
        m365Id: m365Id,
        ledgerCount: ledgerCount,
        masterUsage: masterUsage,
        lim: lim,
        status: status,
        pcs: agg.pcs,
        mismatch: masterUsage !== null && masterUsage !== ledgerCount,
      });
    }
    rows.sort(function (a, b) {
      if (b.ledgerCount !== a.ledgerCount) return b.ledgerCount - a.ledgerCount;
      return Number(a.mid) - Number(b.mid);
    });
    return rows;
  }

  function appendM365UsagePcLinks674(td, pcs, appId) {
    for (let i = 0; i < (pcs || []).length; i++) {
      if (i > 0) td.appendChild(document.createTextNode(', '));
      const pc = pcs[i];
      const a = document.createElement('a');
      a.href =
        location.origin +
        '/k/' +
        encodeURIComponent(String(appId)) +
        '/show#record=' +
        encodeURIComponent(String(pc.rid));
      a.textContent = pc.pcName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:#2563eb;text-decoration:underline;font-weight:600;';
      td.appendChild(a);
    }
  }

  function closeM365UsagePanel674() {
    const p = document.getElementById(M365674_USAGE_PANEL_ID);
    if (p) p.remove();
    showList674Loading674(false);
  }

  function isM365UsageRowFull674(row, lim) {
    if (!row) return false;
    if (String(row.status || '') === '満杯') return true;
    return Number(row.ledgerCount || 0) >= lim;
  }

  function filterM365UsageRows674(rows, mode, lim) {
    const list = rows || [];
    if (mode === 'available') {
      return list.filter(function (r) {
        return !isM365UsageRowFull674(r, lim);
      });
    }
    if (mode === 'full') {
      return list.filter(function (r) {
        return isM365UsageRowFull674(r, lim);
      });
    }
    return list;
  }

  function openM365UsagePanel674() {
    if (!isSkyseaAdmin674()) return;
    closeM365UsagePanel674();
    closeList674ResultPanel674();
    closeSkysea674ListPanel674();
    closeSkyseaClientDeleteListPanel674();

    const panel = document.createElement('div');
    panel.id = M365674_USAGE_PANEL_ID;
    panel.style.cssText =
      'position:fixed;inset:0;z-index:2147482900;background:#f8fafc;display:flex;flex-direction:column;' +
      'font-family:system-ui,sans-serif;color:#0f172a;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'flex:0 0 auto;display:flex;gap:8px;align-items:center;padding:12px 16px;background:#4c1d95;color:#fff;';
    const title = document.createElement('div');
    title.style.cssText = 'flex:1;font-weight:700;line-height:1.45;';
    const titleMain = document.createElement('span');
    titleMain.textContent = 'M365利用状況';
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:12px;font-weight:600;opacity:.92;margin-top:2px;';
    sub.textContent = '1ライセンスあたり最大 5 台';
    title.appendChild(titleMain);
    title.appendChild(document.createElement('br'));
    title.appendChild(sub);
    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = '閉じる';
    btnClose.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #ddd6fe;background:#fff;color:#4c1d95;font-weight:700;cursor:pointer;';
    btnClose.addEventListener('click', closeM365UsagePanel674);
    toolbar.appendChild(title);
    toolbar.appendChild(btnClose);

    const filterBar = document.createElement('div');
    filterBar.style.cssText =
      'flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 16px;' +
      'background:#f5f3ff;border-bottom:1px solid #ddd6fe;';
    const filterLabel = document.createElement('span');
    filterLabel.style.cssText = 'font-size:12px;font-weight:800;color:#4c1d95;margin-right:4px;';
    filterLabel.textContent = '表示:';
    filterBar.appendChild(filterLabel);

    const filterState = { mode: 'available', lim: 5, allRows: [] };
    const filterBtns = [];

    function styleM365FilterBtn674(btn, active) {
      if (active) {
        btn.style.background = '#4c1d95';
        btn.style.color = '#fff';
        btn.style.borderColor = '#4c1d95';
      } else {
        btn.style.background = '#fff';
        btn.style.color = '#4c1d95';
        btn.style.borderColor = '#a78bfa';
      }
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;';
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;background:#fff;font-size:13px;';
    table.innerHTML =
      '<thead><tr style="background:#ede9fe;">' +
      '<th style="padding:8px;text-align:left;">番号</th>' +
      '<th style="padding:8px;text-align:left;">M365 ID</th>' +
      '<th style="padding:8px;text-align:left;">使用数</th>' +
      '<th style="padding:8px;text-align:left;">状態</th>' +
      '<th style="padding:8px;text-align:left;">利用PC</th>' +
      '</tr></thead>';
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    scroll.appendChild(table);

    const appId = kintone.app.getId();

    function renderM365UsageTable674(mode) {
      filterState.mode = mode || 'available';
      const lim = filterState.lim;
      const rows = filterM365UsageRows674(filterState.allRows, filterState.mode, lim);
      const modeLabel =
        filterState.mode === 'available'
          ? '利用可'
          : filterState.mode === 'full'
            ? '満杯'
            : 'すべて';
      titleMain.textContent =
        'M365利用状況（' +
        modeLabel +
        ' ' +
        String(rows.length) +
        ' / 全' +
        String(filterState.allRows.length) +
        '）';
      for (let bi = 0; bi < filterBtns.length; bi++) {
        styleM365FilterBtn674(filterBtns[bi], filterBtns[bi].dataset.mode === filterState.mode);
      }
      tbody.innerHTML = '';
      if (!filterState.allRows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.style.padding = '16px';
        td.textContent = '共有・JR端末で M365 管理マスタに紐づく PC はありません。';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }
      if (!rows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.style.padding = '16px';
        td.textContent =
          modeLabel + 'に該当するライセンスはありません（別の表示に切り替えてください）。';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }
      rows.forEach(function (row) {
        const tr = document.createElement('tr');
        tr.style.borderTop = '1px solid #ddd6fe';
        if (row.mismatch) tr.style.background = '#fefce8';
        function tdPlain(txt) {
          const c = document.createElement('td');
          c.style.padding = '8px';
          c.textContent = txt || '';
          return c;
        }
        tr.appendChild(tdPlain(row.mid));
        tr.appendChild(tdPlain(row.m365Id));
        const tdUse = document.createElement('td');
        tdUse.style.padding = '8px';
        const full = isM365UsageRowFull674(row, lim);
        if (full) tdUse.style.background = '#fee2e2';
        tdUse.appendChild(document.createTextNode(String(row.ledgerCount) + '/' + String(lim)));
        if (row.mismatch) {
          const note = document.createElement('span');
          note.style.cssText = 'display:block;font-size:11px;color:#92400e;margin-top:2px;';
          note.textContent =
            '台帳' + String(row.ledgerCount) + '／マスタ' + String(row.masterUsage);
          tdUse.appendChild(note);
        }
        tr.appendChild(tdUse);
        tr.appendChild(tdPlain(row.status));
        const tdPc = document.createElement('td');
        tdPc.style.padding = '8px';
        appendM365UsagePcLinks674(tdPc, row.pcs, appId);
        tr.appendChild(tdPc);
        tbody.appendChild(tr);
      });
    }

    [
      { mode: 'available', label: '利用可' },
      { mode: 'full', label: '満杯' },
      { mode: 'all', label: 'すべて' },
    ].forEach(function (def) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.mode = def.mode;
      b.textContent = def.label;
      b.style.cssText =
        'padding:6px 14px;border-radius:6px;border:2px solid #a78bfa;font-weight:800;cursor:pointer;font-size:13px;';
      styleM365FilterBtn674(b, def.mode === 'available');
      b.addEventListener('click', function () {
        renderM365UsageTable674(def.mode);
      });
      filterBtns.push(b);
      filterBar.appendChild(b);
    });

    panel.appendChild(toolbar);
    panel.appendChild(filterBar);
    panel.appendChild(scroll);
    document.body.appendChild(panel);

    showList674Loading674(true);
    Promise.all([loadEnv670Map(), fetchM365Usage674Records674()])
      .then(function (res) {
        const envMap = res[0];
        const rec674 = res[1];
        const lim = parseInt(envMap.M365_LICENSE_LIMIT || '5', 10) || 5;
        sub.textContent = '1ライセンスあたり最大 ' + String(lim) + ' 台';
        table.querySelector('th:nth-child(3)').textContent = '使用数（上限' + String(lim) + '）';
        const byMid = aggregateM365UsageFrom674Records674(rec674);
        const mids = Object.keys(byMid);
        return fetchM671RecordsByIds674(mids).then(function (rec671List) {
          const map671 = Object.create(null);
          for (let i = 0; i < rec671List.length; i++) {
            const r = rec671List[i];
            const id = r.$id && r.$id.value;
            if (id) map671[String(id)] = r;
          }
          return { lim: lim, rows: buildM365UsageRows674(byMid, map671, lim) };
        });
      })
      .then(function (payload) {
        showList674Loading674(false);
        filterState.lim = payload.lim;
        filterState.allRows = payload.rows || [];
        renderM365UsageTable674('available');
      })
      .catch(function (e) {
        showList674Loading674(false);
        window.alert('取得失敗: ' + formatKintoneApiError674(e));
        closeM365UsagePanel674();
      });
  }

  function openSkyseaClientDeleteListPanel674() {
    if (!isSkyseaAdmin674()) return;
    closeSkyseaClientDeleteListPanel674();
    closeList674ResultPanel674();
    closeSkysea674ListPanel674();

    const panel = document.createElement('div');
    panel.id = SKYSEA674_CLIENT_DELETE_PANEL_ID;
    panel.style.cssText =
      'position:fixed;inset:0;z-index:2147482900;background:#f8fafc;display:flex;flex-direction:column;' +
      'font-family:system-ui,sans-serif;color:#0f172a;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'flex:0 0 auto;display:flex;gap:8px;align-items:center;padding:12px 16px;background:#7f1d1d;color:#fff;';
    const title = document.createElement('div');
    title.style.cssText = 'flex:1;font-weight:700;';
    title.textContent = 'SKYSEAクライアント削除対応';
    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = '閉じる';
    btnClose.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #fecaca;background:#fff;color:#7f1d1d;font-weight:700;cursor:pointer;';
    btnClose.addEventListener('click', closeSkyseaClientDeleteListPanel674);
    toolbar.appendChild(title);
    toolbar.appendChild(btnClose);

    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow:auto;padding:12px 16px;';
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;background:#fff;font-size:13px;';
    table.innerHTML =
      '<thead><tr style="background:#fee2e2;">' +
      '<th style="padding:8px;text-align:left;">所属</th>' +
      '<th style="padding:8px;text-align:left;">利用者</th>' +
      '<th style="padding:8px;text-align:left;">PC名</th>' +
      '<th style="padding:8px;text-align:left;">状態</th>' +
      '<th style="padding:8px;text-align:left;">操作</th>' +
      '</tr></thead>';
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    scroll.appendChild(table);
    panel.appendChild(toolbar);
    panel.appendChild(scroll);
    document.body.appendChild(panel);

    showList674Loading674(true, 'SKYSEA削除未了を取得中…');
    fetchSkyseaClientDeletePendingRecords674()
      .then(function (rows) {
        showList674Loading674(false);
        title.textContent = 'SKYSEAクライアント削除対応（未了 ' + rows.length + '件）';
        tbody.innerHTML = '';
        if (!rows.length) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 5;
          td.style.padding = '16px';
          td.textContent = '未了の対象はありません。';
          tr.appendChild(td);
          tbody.appendChild(tr);
          return;
        }
        rows.forEach(function (rec) {
          const tr = document.createElement('tr');
          tr.style.borderTop = '1px solid #fecaca';
          function td(txt) {
            const c = document.createElement('td');
            c.style.padding = '8px';
            c.textContent = txt || '';
            return c;
          }
          tr.appendChild(td(cell674PlainForSearch(rec, FC_DEPT_NAME)));
          tr.appendChild(td(cell674PlainForSearch(rec, FC_USER_NAME)));
          tr.appendChild(td(cell674PlainForSearch(rec, FC_PC_NAME)));
          tr.appendChild(td(cell674PlainForSearch(rec, FC_PC_STATUS)));
          const tdAct = document.createElement('td');
          tdAct.style.padding = '8px';
          const btnDone = document.createElement('button');
          btnDone.type = 'button';
          btnDone.textContent = '完了';
          btnDone.style.cssText =
            'padding:4px 12px;border-radius:6px;border:none;background:#059669;color:#fff;font-weight:700;cursor:pointer;';
          btnDone.addEventListener('click', function () {
            btnDone.disabled = true;
            const rid = rec.$id && rec.$id.value;
            const rev = rec.$revision && rec.$revision.value;
            completeSkyseaClientDelete674(rid, rev)
              .then(function () {
                tr.remove();
                refresh674SkyseaClientDeleteBanner674();
                const remain = tbody.querySelectorAll('tr').length;
                title.textContent = 'SKYSEAクライアント削除対応（未了 ' + remain + '件）';
              })
              .catch(function (e) {
                btnDone.disabled = false;
                window.alert('完了処理に失敗: ' + formatKintoneApiError674(e));
              });
          });
          tdAct.appendChild(btnDone);
          tr.appendChild(tdAct);
          tbody.appendChild(tr);
        });
      })
      .catch(function (e) {
        showList674Loading674(false);
        window.alert('取得失敗: ' + formatKintoneApiError674(e));
        closeSkyseaClientDeleteListPanel674();
      });
  }

  function refresh674SkyseaClientDeleteBanner674() {
    const old = document.getElementById(SKYSEA674_CLIENT_DELETE_BANNER_ID);
    if (old) old.remove();
    if (!isSkyseaAdmin674()) return;
    countSkyseaClientDeletePending674().then(function (n) {
      if (!n) return;
      const banner = document.createElement('div');
      banner.id = SKYSEA674_CLIENT_DELETE_BANNER_ID;
      banner.setAttribute('role', 'alert');
      banner.style.cssText =
        'margin:0 0 10px;padding:10px 14px;background:#fef2f2;border:2px solid #b91c1c;border-radius:8px;' +
        'color:#991b1b;font-size:13px;font-weight:700;cursor:pointer;line-height:1.45;';
      banner.textContent =
        'SKYSEAアカウント削除しなければいけない対象が残っています（' + String(n) + '件）';
      banner.title = 'クリックで SKYSEAクライアント削除対応リストを開く';
      banner.addEventListener('click', function () {
        openSkyseaClientDeleteListPanel674();
      });
      const wrap = document.getElementById(SEARCH674_WRAP_ID);
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(banner, wrap);
      }
    });
  }

  function buildSkysea674ListQuery674(doneMode) {
    const done =
      doneMode === SKYSEA_MANUAL_DONE_COMPLETE
        ? SKYSEA_MANUAL_DONE_COMPLETE
        : SKYSEA_MANUAL_DONE_PENDING;
    // 個人のみ。廃棄・取消に加え **保管も対象外**（浜田 2026-08-06）
    return (
      FC_ACCOUNT_TYPE +
      ' in ("' +
      escapeQueryValue(TYPE_PERSONAL) +
      '") and ' +
      FC_PC_STATUS +
      ' not in ("' +
      escapeQueryValue(PC_STATUS_DISPOSED_674) +
      '", "' +
      escapeQueryValue(PC_STATUS_CANCELLED_674) +
      '", "' +
      escapeQueryValue(PC_STATUS_STORAGE) +
      '") and ' +
      FC_SKYSEA_MANUAL_DONE +
      ' in ("' +
      escapeQueryValue(done) +
      '")'
    );
  }

  function fetchSkysea674ListRecords674(doneMode) {
    const app = kintone.app.getId();
    const fields = ['$id', '$revision', FC_SKYSEA_MANUAL_DATE].concat(
      SKYSEA674_EXPORT_COLS.map(function (c) {
        return c.code;
      }),
    );
    const base = buildSkysea674ListQuery674(doneMode);
    const all = [];
    return new Promise(function (resolve, reject) {
      function page(off) {
        const order =
          ' order by ' + FC_DEPT_NAME + ' asc, ' + FC_PC_NAME + ' asc limit 500 offset ' + off;
        const q = base + order;
        kintone
          .api(kintone.api.url('/k/v1/records', true), 'GET', { app: app, query: q, fields: fields })
          .then(function (res) {
            const recs = res.records || [];
            for (let i = 0; i < recs.length; i++) all.push(recs[i]);
            if (recs.length < 500) resolve(all);
            else page(off + 500);
          })
          .catch(reject);
      }
      page(0);
    });
  }

  function uniqueDeptNamesFromSkysea674Records674(records) {
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < records.length; i++) {
      const d = cell674PlainForSearch(records[i], FC_DEPT_NAME) || '（所属なし）';
      if (seen[d]) continue;
      seen[d] = true;
      out.push(d);
    }
    return out;
  }

  /** S-DEPT-MASTER-01: 所属セレクトは App680（sort_no）正。レコード出現集合だけから組み立てない */
  /** 680マスタ全所属＋レコード側の余剰所属。件数は現在タブの対象件数 */
  function buildSkysea674DeptOptions674(records, rankMap, masterRows) {
    const filtered = filterSkysea674RecordsExcludeDepts674(records);
    const counts = Object.create(null);
    for (let i = 0; i < filtered.length; i++) {
      const d = cell674PlainForSearch(filtered[i], FC_DEPT_NAME) || '（所属なし）';
      counts[d] = (counts[d] || 0) + 1;
    }
    const seen = Object.create(null);
    const names = [];
    for (let i = 0; i < (masterRows || []).length; i++) {
      const name = String((masterRows[i] && masterRows[i].dept_name) || '').trim();
      if (!name || seen[name] || isSkysea674ExcludedDept674(name)) continue;
      seen[name] = true;
      names.push(name);
    }
    const extras = uniqueDeptNamesFromSkysea674Records674(filtered);
    for (let i = 0; i < extras.length; i++) {
      if (seen[extras[i]] || isSkysea674ExcludedDept674(extras[i])) continue;
      seen[extras[i]] = true;
      names.push(extras[i]);
    }
    return sortSkysea674DeptNamesByMaster674(names, rankMap).map(function (name) {
      return { name: name, count: counts[name] || 0 };
    });
  }

  /** App 680 `sort_no` 順の順位マップ（同一所属名は先勝ち） */
  function buildSkysea674DeptRankMap674(masterRows) {
    const map = Object.create(null);
    for (let i = 0; i < (masterRows || []).length; i++) {
      const name = String((masterRows[i] && masterRows[i].dept_name) || '').trim();
      if (!name) continue;
      if (map[name] == null) map[name] = i;
    }
    return map;
  }

  function sortSkysea674DeptNamesByMaster674(depts, rankMap) {
    const map = rankMap || Object.create(null);
    return depts.slice().sort(function (a, b) {
      if (a === '（所属なし）' && b !== '（所属なし）') return 1;
      if (b === '（所属なし）' && a !== '（所属なし）') return -1;
      const ra = map[a] != null ? map[a] : 99999;
      const rb = map[b] != null ? map[b] : 99999;
      if (ra !== rb) return ra - rb;
      return String(a).localeCompare(String(b), 'ja');
    });
  }

  function sortSkysea674RecordsByMaster674(records, rankMap) {
    const map = rankMap || Object.create(null);
    return records.slice().sort(function (a, b) {
      const da = cell674PlainForSearch(a, FC_DEPT_NAME) || '（所属なし）';
      const db = cell674PlainForSearch(b, FC_DEPT_NAME) || '（所属なし）';
      if (da === '（所属なし）' && db !== '（所属なし）') return 1;
      if (db === '（所属なし）' && da !== '（所属なし）') return -1;
      const ra = map[da] != null ? map[da] : 99999;
      const rb = map[db] != null ? map[db] : 99999;
      if (ra !== rb) return ra - rb;
      if (da !== db) return String(da).localeCompare(String(db), 'ja');
      const pa = cell674PlainForSearch(a, FC_PC_NAME);
      const pb = cell674PlainForSearch(b, FC_PC_NAME);
      return String(pa).localeCompare(String(pb), 'ja');
    });
  }

  function formatSkysea674SummaryRate674(done, total) {
    if (!total) return '—';
    const pct = Math.round((done / total) * 1000) / 10;
    return String(pct) + '%';
  }

  /** 完了・未了を所属別に集計（個人 SCOPE は fetch 側で同一） */
  function aggregateSkysea674DeptSummary674(doneRecs, pendingRecs, rankMap) {
    const counts = Object.create(null);
    function bump(recs, key) {
      for (let i = 0; i < (recs || []).length; i++) {
        const d = cell674PlainForSearch(recs[i], FC_DEPT_NAME) || '（所属なし）';
        if (isSkysea674ExcludedDept674(d)) continue;
        if (!counts[d]) counts[d] = { done: 0, pending: 0 };
        counts[d][key]++;
      }
    }
    bump(doneRecs, 'done');
    bump(pendingRecs, 'pending');
    const depts = sortSkysea674DeptNamesByMaster674(Object.keys(counts), rankMap);
    let totalDone = 0;
    let totalPending = 0;
    const rows = depts.map(function (dept) {
      const c = counts[dept] || { done: 0, pending: 0 };
      const done = c.done || 0;
      const pending = c.pending || 0;
      const total = done + pending;
      totalDone += done;
      totalPending += pending;
      return {
        dept: dept,
        done: done,
        pending: pending,
        total: total,
        rate: formatSkysea674SummaryRate674(done, total),
      };
    });
    const grandTotal = totalDone + totalPending;
    return {
      rows: rows,
      totals: {
        done: totalDone,
        pending: totalPending,
        total: grandTotal,
        rate: formatSkysea674SummaryRate674(totalDone, grandTotal),
      },
    };
  }

  function renderSkysea674SummaryTable674(hostEl, summary) {
    if (!hostEl) return;
    while (hostEl.firstChild) hostEl.removeChild(hostEl.firstChild);
    const data = summary || { rows: [], totals: { done: 0, pending: 0, total: 0, rate: '—' } };
    const totals = data.totals || { done: 0, pending: 0, total: 0, rate: '—' };

    const banner = document.createElement('div');
    banner.style.cssText =
      'display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;margin-bottom:8px;font-size:12px;font-weight:700;color:#0f172a;';
    banner.innerHTML =
      '<span>完了合計 <span style="color:#0d9488;">' +
      totals.done +
      '</span></span>' +
      '<span>未了合計 <span style="color:#b45309;">' +
      totals.pending +
      '</span></span>' +
      '<span>計 <span style="color:#334155;">' +
      totals.total +
      '</span></span>' +
      '<span>完了率 <span style="color:#1d4ed8;">' +
      totals.rate +
      '</span></span>';
    hostEl.appendChild(banner);

    const caption = document.createElement('div');
    caption.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:6px;';
    caption.textContent = '個人PC・保管/廃棄/取消除外';
    hostEl.appendChild(caption);

    const scroll = document.createElement('div');
    scroll.style.cssText = 'max-height:240px;overflow:auto;border:1px solid #cbd5e1;border-radius:4px;background:#fff;';

    const table = document.createElement('table');
    table.className = 'npl674-skysea-summary-table';
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['所属', '完了', '未了', '計', '完了率'].forEach(function (label, idx) {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.cssText =
        'position:sticky;top:0;z-index:1;background:#e2e8f0;border:1px solid #cbd5e1;padding:5px 8px;text-align:' +
        (idx === 0 ? 'left' : 'right') +
        ';white-space:nowrap;font-weight:700;';
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rows = data.rows || [];
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.style.cssText =
        'padding:12px 8px;text-align:center;color:#64748b;border:1px solid #e2e8f0;';
      td.textContent = '集計対象がありません';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const tr = document.createElement('tr');
        tr.style.background = i % 2 ? '#f8fafc' : '#fff';
        const cells = [
          { text: row.dept, align: 'left' },
          { text: String(row.done), align: 'right' },
          { text: String(row.pending), align: 'right' },
          { text: String(row.total), align: 'right' },
          { text: row.rate, align: 'right' },
        ];
        for (let ci = 0; ci < cells.length; ci++) {
          const td = document.createElement('td');
          td.textContent = cells[ci].text;
          td.style.cssText =
            'border:1px solid #e2e8f0;padding:4px 8px;text-align:' +
            cells[ci].align +
            ';vertical-align:top;word-break:break-word;';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      const trTot = document.createElement('tr');
      trTot.style.cssText = 'background:#e2e8f0;font-weight:700;';
      const totCells = [
        { text: '合計', align: 'left' },
        { text: String(totals.done), align: 'right' },
        { text: String(totals.pending), align: 'right' },
        { text: String(totals.total), align: 'right' },
        { text: totals.rate, align: 'right' },
      ];
      for (let ti = 0; ti < totCells.length; ti++) {
        const td = document.createElement('td');
        td.textContent = totCells[ti].text;
        td.style.cssText =
          'border:1px solid #cbd5e1;padding:5px 8px;text-align:' +
          totCells[ti].align +
          ';';
        trTot.appendChild(td);
      }
      tbody.appendChild(trTot);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    hostEl.appendChild(scroll);
  }

  function refreshSkysea674Summary674(panel) {
    const state = panel && panel.__nplSkysea;
    if (!state) return;
    const host = panel.querySelector('.npl674-skysea-summary');
    if (!host) return;

    function renderFromCache() {
      const summary = aggregateSkysea674DeptSummary674(
        state.summaryDoneRecs,
        state.summaryPendingRecs,
        state.deptRankMap,
      );
      renderSkysea674SummaryTable674(host, summary);
    }

    if (state.summaryDoneRecs && state.summaryPendingRecs) {
      renderFromCache();
      return;
    }

    host.textContent = '所属別集計を読み込み中…';
    Promise.all([
      fetchSkysea674ListRecords674(SKYSEA_MANUAL_DONE_COMPLETE),
      fetchSkysea674ListRecords674(SKYSEA_MANUAL_DONE_PENDING),
    ])
      .then(function (pair) {
        state.summaryDoneRecs = pair[0] || [];
        state.summaryPendingRecs = pair[1] || [];
        renderFromCache();
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] skysea summary', e);
        host.textContent = '所属別集計の取得に失敗しました';
      });
  }

  function adjustSkysea674SummaryCaches674(state, rec, fromDoneMode) {
    if (!state || !rec) return;
    const idStr = String((rec.$id && rec.$id.value) || '');
    if (!idStr) return;
    const filterId = function (list) {
      return (list || []).filter(function (r) {
        return String((r.$id && r.$id.value) || '') !== idStr;
      });
    };
    if (fromDoneMode === SKYSEA_MANUAL_DONE_PENDING) {
      state.summaryPendingRecs = filterId(state.summaryPendingRecs);
      state.summaryDoneRecs = (state.summaryDoneRecs || []).concat([rec]);
    } else if (fromDoneMode === SKYSEA_MANUAL_DONE_COMPLETE) {
      state.summaryDoneRecs = filterId(state.summaryDoneRecs);
      state.summaryPendingRecs = (state.summaryPendingRecs || []).concat([rec]);
    }
  }

  function readSelectedSkysea674Depts674(panel) {
    const selected = [];
    if (!panel) return selected;
    panel.querySelectorAll('input[type=checkbox][data-npl-skysea-dept]').forEach(function (cb) {
      if (cb.checked) selected.push(cb.value);
    });
    return selected;
  }

  function filterSkysea674RecordsByDepts674(records, selectedDepts) {
    if (!selectedDepts || !selectedDepts.length) return [];
    const set = new Set(selectedDepts);
    return records.filter(function (rec) {
      const d = cell674PlainForSearch(rec, FC_DEPT_NAME) || '（所属なし）';
      return set.has(d);
    });
  }

  function syncSkysea674ActionButtons674(panel) {
    if (!panel || !panel.__nplSkysea) return;
    const n = readSelectedSkysea674Depts674(panel).length;
    const disabled = n === 0;
    const buttons = [panel.__nplSkysea.btnPrint, panel.__nplSkysea.btnShowList];
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (!btn) continue;
      btn.disabled = disabled;
      btn.style.opacity = disabled ? '0.45' : '1';
      btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  }

  function updateSkysea674TitleCount674(panel, doneMode, count, viewLabel) {
    const titleEl = panel.querySelector('.npl674-skysea-title-count');
    if (!titleEl) return;
    const mode = doneMode || '';
    const suffix = viewLabel ? '・' + viewLabel : '';
    titleEl.textContent = 'SKYSEA対応一覧（' + mode + '・' + count + '件' + suffix + '）';
  }

  function rebuildSkysea674DeptBar674(panel, records, prevSelected) {
    const bar = panel.querySelector('.npl674-skysea-dept-bar');
    if (!bar) return;
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    const state = panel.__nplSkysea || {};
    const options = buildSkysea674DeptOptions674(
      records,
      state.deptRankMap,
      state.deptMasterRows,
    );
    const prev = prevSelected instanceof Set ? prevSelected : new Set(prevSelected || []);

    const lbl = document.createElement('div');
    lbl.style.cssText =
      'width:100%;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;';
    lbl.textContent = '①所属を選択（680全件・括弧内は件数）→ ②「リスト表示」';
    bar.appendChild(lbl);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;';
    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.textContent = '全選択';
    btnAll.style.cssText =
      'padding:2px 8px;border-radius:4px;border:1px solid #94a3b8;background:#fff;font-size:11px;cursor:pointer;font-weight:600;';
    btnAll.addEventListener('click', function () {
      bar.querySelectorAll('input[type=checkbox][data-npl-skysea-dept]').forEach(function (cb) {
        cb.checked = true;
      });
      syncSkysea674ActionButtons674(panel);
    });
    const btnNone = document.createElement('button');
    btnNone.type = 'button';
    btnNone.textContent = '全解除';
    btnNone.style.cssText =
      'padding:2px 8px;border-radius:4px;border:1px solid #94a3b8;background:#fff;font-size:11px;cursor:pointer;font-weight:600;';
    btnNone.addEventListener('click', function () {
      bar.querySelectorAll('input[type=checkbox][data-npl-skysea-dept]').forEach(function (cb) {
        cb.checked = false;
      });
      syncSkysea674ActionButtons674(panel);
    });
    const btnHas = document.createElement('button');
    btnHas.type = 'button';
    btnHas.textContent = '件数ありのみ選択';
    btnHas.style.cssText =
      'padding:2px 8px;border-radius:4px;border:1px solid #94a3b8;background:#fff;font-size:11px;cursor:pointer;font-weight:600;';
    btnHas.addEventListener('click', function () {
      bar.querySelectorAll('input[type=checkbox][data-npl-skysea-dept]').forEach(function (cb) {
        cb.checked = Number(cb.dataset.nplSkyseaCount || '0') > 0;
      });
      syncSkysea674ActionButtons674(panel);
    });
    actions.appendChild(btnAll);
    actions.appendChild(btnNone);
    actions.appendChild(btnHas);
    bar.appendChild(actions);

    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px 10px;';
    if (!options.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-size:12px;color:#64748b;';
      empty.textContent = '所属マスタ（680）を取得できませんでした。';
      bar.appendChild(empty);
      syncSkysea674ActionButtons674(panel);
      return;
    }
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const name = opt.name;
      const count = opt.count;
      const lab = document.createElement('label');
      lab.style.cssText =
        'display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;line-height:1.35;' +
        (count === 0 ? 'opacity:0.55;' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = name;
      cb.dataset.nplSkyseaDept = '1';
      cb.dataset.nplSkyseaCount = String(count);
      cb.checked = prev.size ? prev.has(name) : false;
      cb.addEventListener('change', function () {
        syncSkysea674ActionButtons674(panel);
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(name + '（' + count + '）'));
      grid.appendChild(lab);
    }
    bar.appendChild(grid);
    syncSkysea674ActionButtons674(panel);
  }

  function putSkysea674ManualDoneFromList674(panel, rec, btn) {
    if (!isSkyseaAdmin674()) return;
    const state = panel && panel.__nplSkysea;
    if (!state) return;
    const id = rec && rec.$id && rec.$id.value;
    if (!id) {
      window.alert('レコード番号が取得できません。');
      return;
    }
    const nextDone =
      state.doneMode === SKYSEA_MANUAL_DONE_PENDING
        ? SKYSEA_MANUAL_DONE_COMPLETE
        : SKYSEA_MANUAL_DONE_PENDING;
    const pc = cell674PlainForSearch(rec, FC_PC_NAME) || String(id);
    if (
      !window.confirm(
        '「' + pc + '」を「' + nextDone + '」にしますか？',
      )
    ) {
      return;
    }
    const record = {};
    record[FC_SKYSEA_MANUAL_DONE] = { value: nextDone };
    if (nextDone === SKYSEA_MANUAL_DONE_COMPLETE) {
      const curDate = String(cell674PlainForSearch(rec, FC_SKYSEA_MANUAL_DATE) || '').trim();
      if (!curDate) {
        record[FC_SKYSEA_MANUAL_DATE] = { value: todayYmd674() };
      }
    }
    const body = {
      app: kintone.app.getId(),
      id: id,
      record: record,
    };
    const rev = rec.$revision && rec.$revision.value;
    if (rev != null && String(rev).trim() !== '') {
      body.revision = String(rev);
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = '更新中…';
    }
    kintoneApiPut('/k/v1/record.json', body)
      .then(function () {
        const idStr = String(id);
        const fromDoneMode = state.doneMode;
        adjustSkysea674SummaryCaches674(state, rec, fromDoneMode);
        refreshSkysea674Summary674(panel);
        state.records = (state.records || []).filter(function (r) {
          return String((r.$id && r.$id.value) || '') !== idStr;
        });
        if (state.viewMode !== 'filtered') return;
        const selected = readSelectedSkysea674Depts674(panel);
        const view = sortSkysea674RecordsByMaster674(
          filterSkysea674RecordsByDepts674(state.records, selected),
          state.deptRankMap,
        );
        const tbody = getSkysea674ListTbody674(panel);
        if (!tbody) return;
        if (!view.length) {
          while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = SKYSEA674_EXPORT_COLS.length + 1;
          td.style.cssText =
            'padding:20px 16px;text-align:center;color:#475569;font-size:13px;border:1px solid #e2e8f0;';
          td.textContent = '選択した所属の表示対象はなくなりました（切替済）。';
          tr.appendChild(td);
          tbody.appendChild(tr);
          updateSkysea674TitleCount674(panel, state.doneMode, 0, '選択所属');
          return;
        }
        renderSkysea674TableBody674(tbody, view, panel);
        updateSkysea674TitleCount674(panel, state.doneMode, view.length, '選択所属');
      })
      .catch(function (e) {
        console.warn('[NEW-PC-LEDGER-V1] skysea list toggle', e);
        if (btn) {
          btn.disabled = false;
          btn.textContent =
            state.doneMode === SKYSEA_MANUAL_DONE_PENDING ? '完了にする' : '未了に戻す';
        }
        window.alert(
          '更新に失敗しました。\n' + (e && e.message ? e.message : String(e)),
        );
      });
  }

  function renderSkysea674TableBody674(tbody, records, panel) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const state = panel && panel.__nplSkysea;
    const toggleLabel =
      state && state.doneMode === SKYSEA_MANUAL_DONE_PENDING ? '完了にする' : '未了に戻す';
    for (let ri = 0; ri < records.length; ri++) {
      const rec = records[ri];
      const tr = document.createElement('tr');
      tr.style.background = ri % 2 ? '#f8fafc' : '#fff';
      tr.dataset.nplSkyseaDept = cell674PlainForSearch(rec, FC_DEPT_NAME) || '（所属なし）';
      SKYSEA674_EXPORT_COLS.forEach(function (col) {
        const td = document.createElement('td');
        td.textContent = cell674PlainForSearch(rec, col.code);
        td.style.cssText =
          'border:1px solid #e2e8f0;padding:6px 10px;vertical-align:top;word-break:break-word;';
        tr.appendChild(td);
      });
      const tdAct = document.createElement('td');
      tdAct.className = 'npl674-skysea-no-print';
      tdAct.style.cssText =
        'border:1px solid #e2e8f0;padding:6px 10px;vertical-align:middle;white-space:nowrap;';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = toggleLabel;
      btn.style.cssText =
        'padding:4px 10px;border-radius:4px;border:1px solid #64748b;background:#fff;font-size:12px;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', function () {
        putSkysea674ManualDoneFromList674(panel, rec, btn);
      });
      tdAct.appendChild(btn);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    }
  }

  function getSkysea674ListTbody674(panel) {
    if (!panel) return null;
    return panel.querySelector('.npl674-skysea-list-table tbody') ||
      panel.querySelector('.npl674-skysea-scroll tbody');
  }

  /** 所属未選択時の空表示（一覧は「リスト表示」後に出す） */
  function renderSkysea674EmptyHint674(panel, totalAvailable) {
    const tbody = getSkysea674ListTbody674(panel);
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = SKYSEA674_EXPORT_COLS.length + 1;
    td.style.cssText =
      'padding:28px 16px;text-align:center;color:#475569;font-size:14px;line-height:1.6;border:1px solid #e2e8f0;background:#fff;';
    const n = typeof totalAvailable === 'number' ? totalAvailable : 0;
    td.textContent =
      '上で所属を1つ以上選び、「リスト表示」を押すと一覧が出ます' +
      (n > 0 ? '（対象データ ' + n + ' 件）' : '') +
      '。';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function applySkysea674ListView674(panel, mode) {
    const state = panel && panel.__nplSkysea;
    if (!state) return;
    const tbody = getSkysea674ListTbody674(panel);
    if (!tbody) return;
    const all = state.records || [];
    if (mode === 'filtered') {
      const selected = readSelectedSkysea674Depts674(panel);
      if (!selected.length) {
        window.alert('表示する所属を1つ以上選んでください。');
        return;
      }
      const view = sortSkysea674RecordsByMaster674(
        filterSkysea674RecordsByDepts674(all, selected),
        state.deptRankMap,
      );
      if (!view.length) {
        window.alert('選択した所属に該当する行がありません。');
        renderSkysea674EmptyHint674(panel, all.length);
        state.viewMode = 'empty';
        updateSkysea674TitleCount674(panel, state.doneMode, 0, '未表示');
        return;
      }
      state.viewMode = 'filtered';
      renderSkysea674TableBody674(tbody, view, panel);
      updateSkysea674TitleCount674(panel, state.doneMode, view.length, '選択所属');
      return;
    }
    // 既定は空（所属選択→リスト表示）
    state.viewMode = 'empty';
    renderSkysea674EmptyHint674(panel, all.length);
    updateSkysea674TitleCount674(panel, state.doneMode, all.length, '所属選択待ち');
  }

  function printSkysea674List674(panel) {
    const state = panel && panel.__nplSkysea;
    if (!state) return;
    const selected = readSelectedSkysea674Depts674(panel);
    if (!selected.length) {
      window.alert('印刷する所属を1つ以上選んでください。');
      return;
    }
    const view = sortSkysea674RecordsByMaster674(
      filterSkysea674RecordsByDepts674(state.records || [], selected),
      state.deptRankMap,
    );
    if (!view.length) {
      window.alert('選択した所属に該当する行がありません。表がないときは印刷しません。');
      return;
    }
    // 画面にも同じ一覧を出しておく（操作感の一致）
    applySkysea674ListView674(panel, 'filtered');
    buildSkysea674PrintRoot674(view, state.doneMode);
    function cleanupPrint674() {
      removeSkysea674PrintRoot674();
      window.removeEventListener('afterprint', cleanupPrint674);
    }
    window.addEventListener('afterprint', cleanupPrint674);
    window.print();
    setTimeout(cleanupPrint674, 2000);
  }

  function loadSkysea674ListIntoPanel674(panel, doneMode) {
    const state = panel.__nplSkysea;
    if (!state) return;
    const prevSelected = new Set(readSelectedSkysea674Depts674(panel));
    const keepFiltered = state.viewMode === 'filtered' && prevSelected.size > 0;
    showList674Loading674(true);
    Promise.all([
      fetchSkysea674ListRecords674(SKYSEA_MANUAL_DONE_COMPLETE),
      fetchSkysea674ListRecords674(SKYSEA_MANUAL_DONE_PENDING),
      fetchDeptMasterRows674(),
    ])
      .then(function (triple) {
        showList674Loading674(false);
        const doneRecs = filterSkysea674RecordsExcludeDepts674(triple[0] || []);
        const pendingRecs = filterSkysea674RecordsExcludeDepts674(triple[1] || []);
        const master = triple[2] || [];
        state.summaryDoneRecs = doneRecs;
        state.summaryPendingRecs = pendingRecs;
        state.doneMode = doneMode;
        state.deptMasterRows = master;
        state.deptRankMap = buildSkysea674DeptRankMap674(master);
        const recs = doneMode === SKYSEA_MANUAL_DONE_COMPLETE ? doneRecs : pendingRecs;
        state.records = sortSkysea674RecordsByMaster674(recs, state.deptRankMap);
        const subEl = panel.querySelector('.npl674-skysea-sub');
        if (subEl) {
          subEl.textContent =
            '個人PCのみ（保管・廃棄・取消除外）／所属を選んで「リスト表示」／並び=680／パスワード列なし';
        }
        refreshSkysea674Summary674(panel);
        rebuildSkysea674DeptBar674(panel, state.records, prevSelected);
        if (keepFiltered) {
          applySkysea674ListView674(panel, 'filtered');
        } else {
          applySkysea674ListView674(panel, 'empty');
        }
        if (state.btnPending && state.btnComplete) {
          const isPending = doneMode === SKYSEA_MANUAL_DONE_PENDING;
          state.btnPending.style.background = isPending ? '#0d9488' : '#fff';
          state.btnPending.style.color = isPending ? '#fff' : '#0f172a';
          state.btnPending.setAttribute('aria-pressed', isPending ? 'true' : 'false');
          state.btnComplete.style.background = !isPending ? '#0d9488' : '#fff';
          state.btnComplete.style.color = !isPending ? '#fff' : '#0f172a';
          state.btnComplete.setAttribute('aria-pressed', !isPending ? 'true' : 'false');
        }
      })
      .catch(function (e) {
        showList674Loading674(false);
        console.warn('[NEW-PC-LEDGER-V1] skysea list', e);
        window.alert(
          'SKYSEA対応一覧の取得に失敗しました。フィールド追加・権限を確認してください。',
        );
      });
  }

  function openSkysea674ListPanel674() {
    if (!isSkyseaAdmin674()) return;
    closeList674ResultPanel674();
    closeSkysea674ListPanel674();
    ensureSkysea674PrintStyles674();

    const panel = document.createElement('div');
    panel.id = SKYSEA674_PANEL_ID;
    panel.style.cssText =
      'position:fixed;inset:0;z-index:2147482900;background:#f8fafc;display:flex;flex-direction:column;' +
      'font-family:system-ui,sans-serif;color:#0f172a;';

    const toolbar = document.createElement('div');
    toolbar.className = 'npl674-skysea-toolbar';
    toolbar.style.cssText =
      'flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 16px;' +
      'background:#0f172a;color:#fff;';

    const titleWrap = document.createElement('div');
    titleWrap.style.cssText = 'flex:1;min-width:200px;';
    const title = document.createElement('div');
    title.className = 'npl674-skysea-title-count';
    title.style.cssText = 'font-size:15px;font-weight:700;';
    title.textContent = 'SKYSEA対応一覧';
    const sub = document.createElement('div');
    sub.className = 'npl674-skysea-sub';
    sub.style.cssText = 'font-size:12px;font-weight:500;opacity:.9;margin-top:4px;';
    sub.textContent = '読み込み中…';
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);

    const toggleWrap = document.createElement('div');
    toggleWrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
    const btnPending = document.createElement('button');
    btnPending.type = 'button';
    btnPending.textContent = SKYSEA_MANUAL_DONE_PENDING;
    btnPending.setAttribute('aria-pressed', 'true');
    btnPending.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #94a3b8;background:#0d9488;color:#fff;font-weight:700;cursor:pointer;';
    const btnComplete = document.createElement('button');
    btnComplete.type = 'button';
    btnComplete.textContent = SKYSEA_MANUAL_DONE_COMPLETE;
    btnComplete.setAttribute('aria-pressed', 'false');
    btnComplete.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;';

    const btnShowList = document.createElement('button');
    btnShowList.type = 'button';
    btnShowList.textContent = 'リスト表示';
    btnShowList.disabled = true;
    btnShowList.title = '選択した所属の一覧を画面に出す';
    btnShowList.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#2563eb;color:#fff;font-weight:700;cursor:not-allowed;opacity:0.45;';
    btnShowList.addEventListener('click', function () {
      applySkysea674ListView674(panel, 'filtered');
    });

    const btnPrint = document.createElement('button');
    btnPrint.type = 'button';
    btnPrint.textContent = '印刷';
    btnPrint.disabled = true;
    btnPrint.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:#0d9488;color:#fff;font-weight:700;cursor:not-allowed;opacity:0.45;';
    btnPrint.addEventListener('click', function () {
      printSkysea674List674(panel);
    });

    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.textContent = '閉じる';
    btnClose.style.cssText =
      'padding:6px 14px;border-radius:6px;border:1px solid #94a3b8;background:#fff;color:#0f172a;font-weight:700;cursor:pointer;';
    btnClose.addEventListener('click', closeSkysea674ListPanel674);

    toolbar.appendChild(titleWrap);
    toolbar.appendChild(toggleWrap);
    toggleWrap.appendChild(btnPending);
    toggleWrap.appendChild(btnComplete);
    toolbar.appendChild(btnShowList);
    toolbar.appendChild(btnPrint);
    toolbar.appendChild(btnClose);

    const deptBar = document.createElement('div');
    deptBar.className = 'npl674-skysea-dept-bar';
    deptBar.style.cssText =
      'flex:0 0 auto;padding:10px 16px;background:#e2e8f0;border-bottom:1px solid #cbd5e1;';

    const summaryWrap = document.createElement('div');
    summaryWrap.className = 'npl674-skysea-summary npl674-skysea-no-print';
    summaryWrap.style.cssText =
      'flex:0 0 auto;padding:8px 16px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;';
    summaryWrap.textContent = '所属別集計を読み込み中…';

    const warn = document.createElement('div');
    warn.className = 'npl674-skysea-print-warn';
    warn.style.cssText =
      'display:none;padding:8px 16px;background:#fef3c7;color:#92400e;font-size:13px;font-weight:700;';
    warn.textContent = '社内チェック用・第三者提示禁止';

    const scroll = document.createElement('div');
    scroll.className = 'npl674-skysea-scroll';
    scroll.style.cssText = 'flex:1 1 auto;overflow:auto;padding:12px 16px 24px;';

    const table = document.createElement('table');
    table.className = 'npl674-skysea-list-table';
    table.style.cssText =
      'width:100%;border-collapse:collapse;background:#fff;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    SKYSEA674_EXPORT_COLS.forEach(function (col) {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.style.cssText =
        'position:sticky;top:0;background:#e2e8f0;border:1px solid #cbd5e1;padding:8px 10px;text-align:left;white-space:nowrap;';
      hr.appendChild(th);
    });
    const thAct = document.createElement('th');
    thAct.className = 'npl674-skysea-no-print';
    thAct.textContent = '操作';
    thAct.style.cssText =
      'position:sticky;top:0;background:#e2e8f0;border:1px solid #cbd5e1;padding:8px 10px;text-align:left;white-space:nowrap;';
    hr.appendChild(thAct);
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    scroll.appendChild(table);

    panel.appendChild(toolbar);
    panel.appendChild(summaryWrap);
    panel.appendChild(deptBar);
    panel.appendChild(warn);
    panel.appendChild(scroll);
    document.body.appendChild(panel);

    panel.__nplSkysea = {
      records: [],
      summaryDoneRecs: null,
      summaryPendingRecs: null,
      doneMode: SKYSEA_MANUAL_DONE_PENDING,
      deptRankMap: Object.create(null),
      deptMasterRows: [],
      viewMode: 'empty',
      btnPrint: btnPrint,
      btnShowList: btnShowList,
      btnPending: btnPending,
      btnComplete: btnComplete,
    };

    btnPending.addEventListener('click', function () {
      loadSkysea674ListIntoPanel674(panel, SKYSEA_MANUAL_DONE_PENDING);
    });
    btnComplete.addEventListener('click', function () {
      loadSkysea674ListIntoPanel674(panel, SKYSEA_MANUAL_DONE_COMPLETE);
    });

    loadSkysea674ListIntoPanel674(panel, SKYSEA_MANUAL_DONE_PENDING);
  }

  // --- 一覧：§4.8a 検索（キーワード + 種別チップ + 転用PC + M365切替/資産台帳 済・未 + datalist。SKYSEA チップは当面非表示・query 互換は維持） ---
  const SEARCH674_WRAP_ID = 'new-pc-ledger-674-index-search';
  const SEARCH674_WRAP_VER = '2026-08-10-v12a-p2-auto-count';
  const HUB674_STORAGE_KEY = 'npl674hub';
  const HUB674_HASH_PARAM = 'npl674hub';
  /** 一覧ハブ別のやさしい基調色（wrap のみ塗る・パネル二重塗りしない） */
  const HUB674_TONES = {
    ledger: { bg: '#faf6f1', accent: '#a16207', border: '#e8dcc8' },
    inventory: { bg: '#f0fdf4', accent: '#059669', border: '#bbf7d0' },
    admin: { bg: '#fffbeb', accent: '#b45309', border: '#fde68a' },
  };
  const SEARCH674_DL_ID = 'new-pc-ledger-674-search-datalist';
  /** 一覧 URL: キーワード原文（空白区切り AND 用）を query と併せて復元する */
  const SEARCH674_URL_KW_PARAM = 'npl674kw';
  /** 一覧 URL: 備考検索チェック（ON は `1`。キーワード空でも保持） */
  const SEARCH674_NOTE_URL_PARAM = 'npl674note';
  /** 一覧並び（`field:asc` / `field:desc`）。`query` の order by と併用して UI 復元 */
  const SEARCH674_SORT_URL_PARAM = 'npl674sort';

  const SEARCH674_SORT_PRESETS = [
    { value: '', label: '一覧の既定' },
    { value: '$id:desc', label: '新しい順（レコード番号↓）' },
    { value: '$id:asc', label: '古い順（レコード番号↑）' },
    { value: FC_PC_NAME + ':asc', label: 'PC名 A→Z' },
    { value: FC_PC_NAME + ':desc', label: 'PC名 Z→A' },
    { value: FC_USER_NAME + ':asc', label: '利用者名 A→Z' },
    { value: FC_USER_NAME + ':desc', label: '利用者名 Z→A' },
    { value: FC_DEPT_NAME + ':asc', label: '所属名 A→Z' },
    { value: FC_DEPT_NAME + ':desc', label: '所属名 Z→A' },
    { value: FC_GROUP_NAME + ':asc', label: '所属グループ A→Z' },
    { value: FC_GROUP_NAME + ':desc', label: '所属グループ Z→A' },
    { value: FC_LOGON_NAME + ':asc', label: 'Windows ID A→Z' },
    { value: FC_LOGON_NAME + ':desc', label: 'Windows ID Z→A' },
    { value: FC_PC_STATUS + ':asc', label: 'ステータス A→Z' },
    { value: FC_PC_STATUS + ':desc', label: 'ステータス Z→A' },
    { value: FC_ACCOUNT_TYPE + ':asc', label: '種別 A→Z' },
    { value: FC_ACCOUNT_TYPE + ':desc', label: '種別 Z→A' },
  ];

  const SEARCH674_SORT_ALLOWED_FIELDS = (function () {
    const s = new Set(['$id']);
    for (let si = 0; si < SEARCH674_SORT_PRESETS.length; si++) {
      const v = SEARCH674_SORT_PRESETS[si].value;
      if (!v) continue;
      const idx = v.lastIndexOf(':');
      if (idx > 0) s.add(v.slice(0, idx));
    }
    return s;
  })();

  function parse674SortSpec674(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    const idx = s.lastIndexOf(':');
    if (idx <= 0) return null;
    const field = s.slice(0, idx);
    const dirRaw = s.slice(idx + 1).toLowerCase();
    if (dirRaw !== 'asc' && dirRaw !== 'desc') return null;
    if (!SEARCH674_SORT_ALLOWED_FIELDS.has(field)) return null;
    return { field: field, dir: dirRaw };
  }

  function format674SortSpec674(spec) {
    if (!spec || !spec.field) return '';
    return spec.field + ':' + (spec.dir === 'asc' ? 'asc' : 'desc');
  }

  function strip674OrderByFromQuery674(raw) {
    return String(raw || '')
      .replace(/\s+order\s+by\s+[\s\S]*$/i, '')
      .trim();
  }

  function parse674SortFromQuery674(raw) {
    const m = /\border\s+by\s+([a-zA-Z0-9_$]+)\s+(asc|desc)/i.exec(String(raw || ''));
    if (!m) return null;
    return parse674SortSpec674(m[1] + ':' + m[2].toLowerCase());
  }

  function append674IndexOrderBy674(filterQuery, sortParsed) {
    if (!sortParsed || !sortParsed.field) {
      return String(filterQuery || '').trim();
    }
    const base = String(filterQuery || '').trim();
    const dir = sortParsed.dir === 'asc' ? 'asc' : 'desc';
    const orderClause = ' order by ' + sortParsed.field + ' ' + dir + ', $id ' + dir;
    if (!base) return orderClause.trim();
    return base + orderClause;
  }

  /** kintone 標準ヘッダー検索・一覧 URL が載せる **`?q=`**（当 customize の **`query`** とは別名） */
  const SEARCH674_KINTONE_NATIVE_Q_PARAM = 'q';

  /**
   * 削除済みフィールドの内部ID — 標準 `?q=` に残ると GAIA_IQ11（legacy_pc_name_594 系 2026-05 削除）
   * @see docs/plans/2026-04-21-new-pc-ledger-spec.md §4.8c
   */
  const NPL674_ORPHAN_NATIVE_Q_FIELD_IDS = ['f13459900'];

  function nativeQ674ReferencesOrphanField674(q) {
    const s = String(q || '');
    if (!s) return false;
    for (let oi = 0; oi < NPL674_ORPHAN_NATIVE_Q_FIELD_IDS.length; oi++) {
      if (s.indexOf(NPL674_ORPHAN_NATIVE_Q_FIELD_IDS[oi]) !== -1) return true;
    }
    return false;
  }

  /**
   * 標準 `?q=` が削除済み内部IDを参照しているとき URL から除去して再読込（エラー画面回避）
   * @returns {boolean} redirect した
   */
  function redirect674IfOrphanNativeQ674() {
    try {
      if (String(location.pathname || '').indexOf('/k/674') === -1) return false;
      const u = new URL(location.href);
      const qSearch = String(u.searchParams.get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '');
      let qHash = '';
      const hashQs = get674HashQueryString674(u.hash);
      if (hashQs) {
        try {
          qHash = String(new URLSearchParams(hashQs).get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '');
        } catch (_eH) {
          qHash = '';
        }
      }
      if (!nativeQ674ReferencesOrphanField674(qSearch) && !nativeQ674ReferencesOrphanField674(qHash)) {
        return false;
      }
      u.searchParams.delete(SEARCH674_KINTONE_NATIVE_Q_PARAM);
      strip674ListFilterParamsFromUrlHash674(u);
      if (u.hash && /sort_0=f/i.test(u.hash)) {
        u.hash = '';
      }
      location.replace(u.toString());
      return true;
    } catch (_e) {
      return false;
    }
  }

  redirect674IfOrphanNativeQ674();

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
    FC_WINDOWS_NAME,
    FC_M365_ID,
    FC_USER_NAME,
    FC_DEPT_NAME,
    FC_GROUP_NAME,
    FC_SHARED_TERMINAL_NAME,
    FC_NOTE,
    FC_NPL_DISPOSED_PC_COPY,
    FC_PC_STATUS,
  ];
  /** PC名系は kintone `like` 単語境界で KS002→KS0022 等が落ちるため compact 部分一致（627/594 同趣旨） */
  const SEARCH674_COMPACT_MATCH_FIELDS = [FC_PC_NAME, FC_WINDOWS_NAME, FC_LOGON_NAME];

  const SEARCH674_TYPE_CHIPS = [
    { value: TYPE_PERSONAL, label: '👤 個人' },
    { value: TYPE_SHARED, label: '🟦 共有' },
    { value: TYPE_JR, label: '🚆 JR端末' },
    { value: TYPE_SERVER, label: '🖥 サーバーNAS' },
    { value: TYPE_OTHER, label: '📦 その他' },
  ];

  /** PCステータス（全選択＝フィルタなし。取消は一覧対象外のためチップなし） */
  const SEARCH674_STATUS_CHIPS = [
    { value: PC_STATUS_IN_USE_674, label: '利用中' },
    { value: PC_STATUS_STORAGE, label: '保管' },
    { value: PC_STATUS_DISPOSED_674, label: '廃棄' },
  ];

  function init674DefaultStatusSet674() {
    return new Set([PC_STATUS_IN_USE_674]);
  }

  function init674AllStatusSet674() {
    return new Set(
      SEARCH674_STATUS_CHIPS.map(function (c) {
        return c.value;
      }),
    );
  }

  function append674StatusFilter674(parts, selectedStatuses674) {
    const statuses =
      selectedStatuses674 instanceof Set ? [...selectedStatuses674] : [];
    if (!statuses.length || statuses.length >= SEARCH674_STATUS_CHIPS.length) return;
    const quoted = statuses
      .map(function (s) {
        return '"' + escape674QueryLike(s) + '"';
      })
      .join(', ');
    parts.push('(' + FC_PC_STATUS + ' in (' + quoted + '))');
  }

  /** 取消は日常一覧から常に除外 */
  function append674HideCancelled674(parts) {
    parts.push(
      '(' + FC_PC_STATUS + ' not in ("' + escape674QueryLike(PC_STATUS_CANCELLED_674) + '"))',
    );
  }

  /** 一覧チップ: CHECK_BOX「済」のみ／未チェック（`not in ("済")`） */
  const SEARCH674_DONE_CB_FILTERS = [
    { key: 'm365', field: FC_M365_KIRIKAE, labelDone: 'M365切替: 済', labelNone: 'M365切替: 未' },
    { key: 'shisan', field: FC_SHISAN_DAICHO, labelDone: '資産台帳: 済', labelNone: '資産台帳: 未' },
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

  function normalize674SearchText674(s) {
    try {
      return String(s ?? '').normalize('NFKC');
    } catch (_e) {
      return String(s ?? '');
    }
  }

  /** 記号除去＋小文字（627 `build627PcNameIdQuery` と同趣旨） */
  function compact674SearchKey674(s) {
    return normalize674SearchText674(s)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  /** JBIS / KS / S-JBIS 等 PC 名接頭辞検索（M365 の @jbism… 等に誤ヒットしない） */
  function is674PcNamePrefixToken674(token) {
    const raw = String(token || '').trim();
    if (!raw || raw.indexOf('@') !== -1) return false;
    const c = compact674SearchKey674(raw);
    if (!c) return false;
    if (c.startsWith('sjbis')) return true;
    if (c.startsWith('jbis') || c === 'jbis') return true;
    if (c.startsWith('ks') || c === 'ks') return true;
    return false;
  }

  function pcName674MatchesPrefixToken674(pcName, token) {
    const pn = normalize674SearchText674(String(pcName || '')).trim();
    if (!pn) return false;
    const pnCompact = compact674SearchKey674(pn);
    const wantCompact = compact674SearchKey674(token);
    if (!wantCompact) return false;

    if (wantCompact.startsWith('ks')) {
      if (!/^KS/i.test(pn)) return false;
      return pnCompact.includes(wantCompact);
    }
    if (wantCompact.startsWith('sjbis') || /^s[\s-]*jbis/i.test(String(token || ''))) {
      if (!/^S-JBIS/i.test(pn) && !pnCompact.startsWith('sjbis')) return false;
      return pnCompact.includes(wantCompact);
    }
    if (wantCompact.startsWith('jbis') || /^jbis/i.test(String(token || ''))) {
      if (/^KS/i.test(pn)) return false;
      if (pnCompact.startsWith('jbis')) return pnCompact.includes(wantCompact);
      if (pnCompact.startsWith('sjbis')) {
        return wantCompact === 'jbis' || pnCompact.includes(wantCompact);
      }
      return false;
    }
    return pnCompact.includes(wantCompact);
  }

  function record674MatchesSearchToken674(rec, token) {
    const raw = String(token || '').trim();
    if (!raw) return false;
    if (is674PcNamePrefixToken674(raw)) {
      return pcName674MatchesPrefixToken674(cell674PlainForSearch(rec, FC_PC_NAME), raw);
    }
    const wantCompact = compact674SearchKey674(raw);
    const wantLower = normalize674SearchText674(raw).toLowerCase();
    for (let fi = 0; fi < SEARCH674_HINT_FIELDS.length; fi++) {
      const code = SEARCH674_HINT_FIELDS[fi];
      const v = cell674PlainForSearch(rec, code);
      if (!v) continue;
      if (code === FC_PC_STATUS) {
        const vs = v.toLowerCase();
        if (vs.includes(wantLower)) return true;
        if (wantLower === '廃止' && vs.includes('廃棄')) return true;
        continue;
      }
      if (SEARCH674_COMPACT_MATCH_FIELDS.indexOf(code) !== -1) {
        if (wantCompact && compact674SearchKey674(v).includes(wantCompact)) return true;
      } else if (v.toLowerCase().includes(wantLower)) {
        return true;
      }
    }
    return false;
  }

  function build674TokenIdQuery674(records, token) {
    const ids = [];
    const maxIds = 1000;
    for (let ri = 0; ri < records.length; ri++) {
      if (!record674MatchesSearchToken674(records[ri], token)) continue;
      const id = Number(records[ri].$id && records[ri].$id.value);
      if (!Number.isFinite(id)) continue;
      ids.push(id);
      if (ids.length >= maxIds) break;
    }
    return ids.length ? '$id in (' + ids.join(',') + ')' : '$id = -1';
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

  function escape674QueryRegex674(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** @returns {'checked'|'unchecked'|null} */
  function parse674CheckboxDoneFilter674(listQuery, fieldCode) {
    const raw = String(listQuery || '');
    if (!raw || !fieldCode) return null;
    const optEsc = escape674QueryRegex674(escape674QueryLike(SEARCH674_CB_DONE_OPT));
    const fcEsc = escape674QueryRegex674(fieldCode);
    const inRe = new RegExp(
      '\\(\\s*' + fcEsc + '\\s+in\\s*\\(\\s*"' + optEsc + '"\\s*\\)\\s*\\)',
    );
    const notInRe = new RegExp(
      '\\(\\s*' + fcEsc + '\\s+not\\s+in\\s*\\(\\s*"' + optEsc + '"\\s*\\)\\s*\\)',
    );
    if (inRe.test(raw)) return 'checked';
    if (notInRe.test(raw)) return 'unchecked';
    return null;
  }

  function append674CheckboxDoneFilter674(parts, fieldCode, mode) {
    if (!fieldCode || !mode) return;
    const q = '"' + escape674QueryLike(SEARCH674_CB_DONE_OPT) + '"';
    if (mode === 'checked') parts.push('(' + fieldCode + ' in (' + q + '))');
    else if (mode === 'unchecked') parts.push('(' + fieldCode + ' not in (' + q + '))');
  }

  /**
   * 一覧 URL の `query` を、検索バーの状態に分解（当バーが build した形式を想定。手編集 query は部分一致のみ反映）。
   * @returns {{ keyword: string, types: string[], transferOnly: boolean, cbFilters: Record<string, 'checked'|'unchecked'|null>, statuses: string[], sort: string }}
   */
  function parse674ListQueryToBarState674(listQuery) {
    const rawFull = String(listQuery || '').trim();
    const sortFromQ = parse674SortFromQuery674(rawFull);
    const raw = strip674OrderByFromQuery674(rawFull);
    const out = {
      keyword: '',
      types: [],
      transferOnly: false,
      cbFilters: { m365: null, shisan: null },
      statuses: [],
      depts: [],
      sort: sortFromQ ? format674SortSpec674(sortFromQ) : '',
    };
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

    const optEscForTransferRe = escape674QueryLike(FC_NPL_TRANSFER_MANUAL_OPT).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const transferRe = new RegExp(
      '\\(\\s*' + FC_NPL_TRANSFER_MANUAL + '\\s+in\\s*\\(\\s*"' + optEscForTransferRe + '"\\s*\\)\\s*\\)',
    );
    out.transferOnly = transferRe.test(raw);

    out.cbFilters.m365 = parse674CheckboxDoneFilter674(raw, FC_M365_KIRIKAE);
    out.cbFilters.shisan = parse674CheckboxDoneFilter674(raw, FC_SHISAN_DAICHO);

    const deptInRe = new RegExp(
      '\\(\\s*' + FC_DEPT_NAME + '\\s+in\\s*\\(([^)]*)\\)\\s*\\)',
    );
    const deptInM = deptInRe.exec(raw);
    if (deptInM) {
      out.depts = parse674QuotedListInner674(deptInM[1]);
    }

    const statusRe = new RegExp(
      '\\(\\s*' + FC_PC_STATUS + '\\s+in\\s*\\(([^)]*)\\)\\s*\\)',
    );
    const stm = statusRe.exec(raw);
    if (stm) {
      const candSt = parse674QuotedListInner674(stm[1]);
      const allowedSt = new Set(
        SEARCH674_STATUS_CHIPS.map(function (c) {
          return c.value;
        }),
      );
      for (let sti = 0; sti < candSt.length; sti++) {
        if (allowedSt.has(candSt[sti])) out.statuses.push(candSt[sti]);
      }
    }

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
    const urlSortParam = read.urlSort || '';
    const noteSearchOnly674 = read.urlNote === '1';
    let urlKwDecoded = '';
    if (urlKwParam) {
      try {
        urlKwDecoded = decodeURIComponent(urlKwParam);
      } catch (_e2) {
        urlKwDecoded = urlKwParam;
      }
    }
    const syncKey =
      urlQuery +
      '\n' +
      urlKwDecoded +
      '\n' +
      urlNativeQ +
      '\n' +
      urlSortParam +
      '\n' +
      (noteSearchOnly674 ? '1' : '');
    if (wrap.getAttribute('data-npl-synced-query') === syncKey) return;

    const effectiveListQuery = urlQuery || urlNativeQ;
    const st = parse674ListQueryToBarState674(effectiveListQuery);
    let kw = urlKwDecoded || st.keyword;
    if (!kw && urlNativeQ && !urlQuery) {
      kw = extract674KeywordFromNativeQ674(urlNativeQ);
    }
    const ref = wrap.__npl674;
    ref.inp.value = kw;
    if (ref.noteSearchBox) ref.noteSearchBox.checked = noteSearchOnly674;
    ref.selectedTypes.clear();
    for (let ti = 0; ti < st.types.length; ti++) ref.selectedTypes.add(st.types[ti]);
    if (ref.selectedDepts) {
      ref.selectedDepts.clear();
      const deptList = st.depts || [];
      for (let di = 0; di < deptList.length; di++) {
        if (deptList[di]) ref.selectedDepts.add(deptList[di]);
      }
      if (typeof ref.syncOrgBtn === 'function') ref.syncOrgBtn();
    }
    const kwFromUrlEarly =
      urlKwDecoded ||
      (urlNativeQ && !urlQuery ? extract674KeywordFromNativeQ674(urlNativeQ) : '');
    if (ref.transferBox) ref.transferBox.v = kwFromUrlEarly ? false : !!st.transferOnly;
    if (ref.cbFilterBoxes && st.cbFilters) {
      for (let cbi = 0; cbi < SEARCH674_DONE_CB_FILTERS.length; cbi++) {
        const defCb = SEARCH674_DONE_CB_FILTERS[cbi];
        const boxCb = ref.cbFilterBoxes[defCb.key];
        if (boxCb) boxCb.v = st.cbFilters[defCb.key] || null;
      }
    }
    ref.selectedStatuses.clear();
    if (st.statuses.length) {
      for (let sti = 0; sti < st.statuses.length; sti++) {
        ref.selectedStatuses.add(st.statuses[sti]);
      }
    } else if (noteSearchOnly674 || split674IndexKeywords674(kw).length) {
      init674AllStatusSet674().forEach(function (sv) {
        ref.selectedStatuses.add(sv);
      });
    } else {
      init674DefaultStatusSet674().forEach(function (sv) {
        ref.selectedStatuses.add(sv);
      });
    }
    ref.syncChips();
    if (ref.sortSel) {
      ref.sortSel.value = urlSortParam || st.sort || '$id:desc';
    }

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
    if (typeof ref.refreshMatchCount === 'function') {
      ref.refreshMatchCount();
    }
    if (typeof ref.updateActiveSummary === 'function') {
      ref.updateActiveSummary();
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

  function build674IndexListQuery(
    keyword,
    selectedTypes,
    transferOnly674,
    cbFilterBoxes674,
    recordsForKeyword674,
    selectedStatuses674,
    noteSearchOnly674,
    selectedDepts674,
  ) {
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
    if (transferOnly674) {
      parts.push('(' + FC_NPL_TRANSFER_MANUAL + ' in ("' + escape674QueryLike(FC_NPL_TRANSFER_MANUAL_OPT) + '"))');
    }
    append674StatusFilter674(parts, selectedStatuses674);
    append674HideCancelled674(parts);
    append674DeptNameInFilter674(parts, selectedDepts674);
    if (cbFilterBoxes674) {
      for (let fi = 0; fi < SEARCH674_DONE_CB_FILTERS.length; fi++) {
        const defF = SEARCH674_DONE_CB_FILTERS[fi];
        const boxF = cbFilterBoxes674[defF.key];
        if (boxF && boxF.v) append674CheckboxDoneFilter674(parts, defF.field, boxF.v);
      }
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
    if (noteSearchOnly674 && !tokens.length) {
      parts.push('(' + FC_NOTE + ' is not empty)');
    } else if (tokens.length) {
      if (noteSearchOnly674) {
        const noteTokenParts = tokens.map(function (tok) {
          return '(' + FC_NOTE + ' like "' + escape674QueryLike(tok) + '")';
        });
        parts.push('(' + noteTokenParts.join(' and ') + ')');
      } else {
        const useIdQuery =
          Array.isArray(recordsForKeyword674) && recordsForKeyword674.length > 0;
        const tokenParts = tokens.map(function (tok) {
          if (useIdQuery) {
            return '(' + build674TokenIdQuery674(recordsForKeyword674, tok) + ')';
          }
          const e = escape674QueryLike(tok);
          const ors = SEARCH674_HINT_FIELDS.map(function (c) {
            return '(' + c + ' like "' + e + '")';
          });
          return '(' + ors.join(' or ') + ')';
        });
        parts.push('(' + tokenParts.join(' and ') + ')');
      }
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
      if (!hp.has('query') && !hp.has(SEARCH674_URL_KW_PARAM) && !hp.has(SEARCH674_KINTONE_NATIVE_Q_PARAM) && !hp.has(SEARCH674_SORT_URL_PARAM) && !hp.has(SEARCH674_NOTE_URL_PARAM)) return;
      hp.delete('query');
      hp.delete(SEARCH674_URL_KW_PARAM);
      hp.delete(SEARCH674_KINTONE_NATIVE_Q_PARAM);
      hp.delete(SEARCH674_SORT_URL_PARAM);
      hp.delete(SEARCH674_NOTE_URL_PARAM);
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

  /** search 側を正として、hash に残った備考検索フラグだけを除去する */
  function strip674NoteSearchParamFromUrlHash674(u) {
    try {
      const h = u.hash;
      if (!h || h.indexOf('?') === -1) return;
      const qm = h.indexOf('?');
      const path = h.slice(0, qm);
      const hp = new URLSearchParams(h.slice(qm + 1));
      if (!hp.has(SEARCH674_NOTE_URL_PARAM)) return;
      hp.delete(SEARCH674_NOTE_URL_PARAM);
      const next = hp.toString();
      u.hash = next ? path + '?' + next : path;
    } catch (_e) {
      /* noop */
    }
  }

  /** ネイティブ条件クリアの画面遷移を妨げず、備考検索の UI と専用 URL フラグを先に解除する */
  function clear674NoteSearchUiAndUrl674() {
    const wrap = document.getElementById(SEARCH674_WRAP_ID);
    if (wrap && wrap.__npl674 && wrap.__npl674.noteSearchBox) {
      wrap.__npl674.noteSearchBox.checked = false;
      wrap.removeAttribute('data-npl-synced-query');
    }
    try {
      const u = new URL(location.href);
      u.searchParams.delete(SEARCH674_NOTE_URL_PARAM);
      strip674NoteSearchParamFromUrlHash674(u);
      if (typeof history.replaceState === 'function') {
        history.replaceState(history.state, '', u.toString());
      }
    } catch (_e) {
      /* noop */
    }
  }

  /**
   * 一覧の **`query` / `npl674kw` / `npl674note` / 標準 `q`** を **search と hash の両方**から読む（閲覧→戻る・絞り込み UI で片方だけ変わる場合のずれ対策）。
   * @returns {{ urlQuery: string, urlKwParam: string, urlNativeQ: string, urlSort: string, urlNote: string }}
   */
  function read674IndexSearchQueryAndKw674() {
    let u;
    try {
      u = new URL(location.href);
    } catch (_e) {
      return { urlQuery: '', urlKwParam: '', urlNativeQ: '', urlSort: '', urlNote: '' };
    }
    let urlQuery = String(u.searchParams.get('query') || '').trim();
    let urlKwParam = String(u.searchParams.get(SEARCH674_URL_KW_PARAM) || '').trim();
    let urlNativeQ = String(u.searchParams.get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '').trim();
    let urlSort = String(u.searchParams.get(SEARCH674_SORT_URL_PARAM) || '').trim();
    let urlNote = String(u.searchParams.get(SEARCH674_NOTE_URL_PARAM) || '').trim();
    const qh = get674HashQueryString674(u.hash);
    if (qh) {
      try {
        const hp = new URLSearchParams(qh);
        if (!urlQuery) urlQuery = String(hp.get('query') || '').trim();
        if (!urlKwParam) urlKwParam = String(hp.get(SEARCH674_URL_KW_PARAM) || '').trim();
        if (!urlNativeQ) urlNativeQ = String(hp.get(SEARCH674_KINTONE_NATIVE_Q_PARAM) || '').trim();
        if (!urlSort) urlSort = String(hp.get(SEARCH674_SORT_URL_PARAM) || '').trim();
        if (!urlNote) urlNote = String(hp.get(SEARCH674_NOTE_URL_PARAM) || '').trim();
      } catch (_e2) {
        /* noop */
      }
    }
    return { urlQuery: urlQuery, urlKwParam: urlKwParam, urlNativeQ: urlNativeQ, urlSort: urlSort, urlNote: urlNote };
  }

  /** カスタム検索バーの入力・チップのみ空にする（一覧の実効条件は触らない） */
  function clear674IndexSearchBarUi674(wrap) {
    const ref = wrap.__npl674;
    if (!ref) return;
    ref.inp.value = '';
    if (ref.noteSearchBox) ref.noteSearchBox.checked = false;
    ref.selectedTypes.clear();
    ref.selectedStatuses.clear();
    init674DefaultStatusSet674().forEach(function (sv) {
      ref.selectedStatuses.add(sv);
    });
    if (ref.selectedDepts) ref.selectedDepts.clear();
    if (typeof ref.syncOrgBtn === 'function') ref.syncOrgBtn();
    close674OrgPopover674();
    if (ref.transferBox) ref.transferBox.v = false;
    if (ref.sortSel) ref.sortSel.value = '';
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
      if (readSnap.urlQuery || readSnap.urlKwParam || readSnap.urlNativeQ || readSnap.urlNote) {
        navigate674ListWithQuery('', '', '', false);
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
        clear674NoteSearchUiAndUrl674();
        [120, 400, 900].forEach(function (ms) {
          setTimeout(request674IndexSearchHydrateFromUrl674, ms);
        });
      },
      true,
    );
  }

  function navigate674ListWithQuery(queryStr, rawKeywordForUrl, sortSpecStr, noteSearchOnly674) {
    let u;
    try {
      u = new URL(location.href);
    } catch (e) {
      return;
    }
    const filterQ = String(queryStr != null ? queryStr : '').trim();
    const sortVal = String(sortSpecStr != null ? sortSpecStr : '').trim();
    const sortParsed = parse674SortSpec674(sortVal);
    const fullQ = append674IndexOrderBy674(filterQ, sortParsed);
    strip674NoteSearchParamFromUrlHash674(u);
    if (fullQ) {
      u.searchParams.set('query', fullQ);
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
    if (sortVal && sortParsed) {
      u.searchParams.set(SEARCH674_SORT_URL_PARAM, format674SortSpec674(sortParsed));
    } else {
      u.searchParams.delete(SEARCH674_SORT_URL_PARAM);
    }
    if (noteSearchOnly674) {
      u.searchParams.set(SEARCH674_NOTE_URL_PARAM, '1');
    } else {
      u.searchParams.delete(SEARCH674_NOTE_URL_PARAM);
    }
    if (fullQ || kwPlain || noteSearchOnly674) {
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

  function parse674HubFromHash674() {
    try {
      const hash = String(window.location.hash || '').replace(/^#/, '');
      if (!hash) return null;
      const params = new URLSearchParams(hash);
      const v = params.get(HUB674_HASH_PARAM);
      if (v === 'ledger' || v === 'inventory' || v === 'admin') return v;
    } catch (_e) {
      /* ignore */
    }
    return null;
  }

  function resolve674InitialHub674(isAdmin) {
    const fromHash = parse674HubFromHash674();
    if (fromHash === 'admin' && !isAdmin) return 'ledger';
    if (fromHash) return fromHash;
    try {
      const saved = sessionStorage.getItem(HUB674_STORAGE_KEY);
      if (saved === 'admin' && !isAdmin) return 'ledger';
      if (saved === 'ledger' || saved === 'inventory' || saved === 'admin') return saved;
    } catch (_e2) {
      /* ignore */
    }
    return 'ledger';
  }

  function persist674Hub674(hub) {
    try {
      sessionStorage.setItem(HUB674_STORAGE_KEY, hub);
    } catch (_e) {
      /* ignore */
    }
    try {
      const hash = String(window.location.hash || '').replace(/^#/, '');
      const params = new URLSearchParams(hash);
      params.set(HUB674_HASH_PARAM, hub);
      const newHash = params.toString();
      if (hash !== newHash) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search + '#' + newHash,
        );
      }
    } catch (_e2) {
      /* ignore */
    }
  }

  function render674IndexSearchBar() {
    const existing = document.getElementById(SEARCH674_WRAP_ID);
    if (existing && existing.getAttribute('data-npl-ver') === SEARCH674_WRAP_VER) {
      hydrate674IndexSearchBarFromUrl674();
      if (existing.__npl674 && typeof existing.__npl674.refreshNextSerial === 'function') {
        existing.__npl674.refreshNextSerial();
      }
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
      'margin:0 0 12px 0;padding:10px 12px 12px;background:var(--npl-hub-bg,#faf6f1);border:1px solid var(--npl-hub-border,#e8dcc8);' +
      'border-radius:8px;font-family:system-ui,sans-serif;' +
      '--npl-hub-bg:#faf6f1;--npl-hub-border:#e8dcc8;--npl-accent:#a16207;--npl-muted:#64748b;--npl-ok:#059669;--npl-warn:#b45309;--npl-danger:#b91c1c;';

    const isAdmin674 = isSkyseaAdmin674();
    const hubTabBar = document.createElement('div');
    hubTabBar.setAttribute('role', 'tablist');
    hubTabBar.setAttribute('aria-label', '一覧ハブ');
    hubTabBar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:0;border-bottom:2px solid var(--npl-hub-border,#e8dcc8);margin-bottom:10px;';

    const hubPanels = Object.create(null);
    const hubTabButtons = [];

    function make674HubPanel674(hubKey) {
      const panel = document.createElement('div');
      panel.id = 'npl674-hub-' + hubKey;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'npl674-hub-tab-' + hubKey);
      panel.style.cssText = 'display:none;';
      hubPanels[hubKey] = panel;
      return panel;
    }

    function make674HubTab674(label, hubKey) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'npl674-hub-tab-' + hubKey;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', 'npl674-hub-' + hubKey);
      btn.dataset.npl674Hub = hubKey;
      btn.textContent = label;
      btn.style.cssText =
        'padding:10px 18px;border:none;background:transparent;font-size:15px;font-weight:800;' +
        'color:var(--npl-muted,#64748b);cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;' +
        'letter-spacing:0.02em;';
      hubTabButtons.push(btn);
      hubTabBar.appendChild(btn);
      return btn;
    }

    const ledgerPanel = make674HubPanel674('ledger');
    const inventoryPanel = make674HubPanel674('inventory');
    let adminPanel = null;
    make674HubTab674('台帳', 'ledger');
    make674HubTab674('棚卸', 'inventory');
    if (isAdmin674) {
      adminPanel = make674HubPanel674('admin');
      make674HubTab674('管理', 'admin');
    }

    const title = document.createElement('div');
    title.style.cssText =
      'font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px;line-height:1.5;letter-spacing:0.01em;';
    title.textContent =
      '上のタブで台帳・棚卸・管理を切り替えて利用できます。ここではキーワード・種別・ステータス・M365切替／資産台帳などで絞り込みます。';
    const nextSerialBar = document.createElement('div');
    nextSerialBar.id = 'npl674-index-next-serial-bar';
    nextSerialBar.setAttribute('aria-live', 'polite');
    nextSerialBar.style.cssText =
      'display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;margin-bottom:10px;' +
      'padding:10px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;' +
      'font-size:14px;color:#0f172a;line-height:1.45;';

    function render674NextSerialBar674(preview) {
      if (!preview) {
        nextSerialBar.innerHTML =
          '<span style="color:#b45309;font-size:14px;">次採番の取得に失敗しました（再読み込みしてください）</span>';
        return;
      }
      const valStyle =
        'font-size:17px;font-weight:800;letter-spacing:0.02em;font-family:Consolas,Monaco,ui-monospace,monospace;';
      const lblStyle = 'font-size:13px;color:#64748b;';
      const catStyle = 'font-size:15px;font-weight:800;';
      const headStyle = 'font-size:15px;font-weight:800;color:#0f172a;';
      nextSerialBar.innerHTML =
        '<div style="width:100%;margin-bottom:2px;">' +
        '<span style="' +
        headStyle +
        '">次採番</span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;">' +
        '<span style="' +
        catStyle +
        'color:#0369a1;">個人用</span>' +
        '<span style="' +
        lblStyle +
        '">PC名 <strong style="' +
        valStyle +
        'color:#0f172a;">' +
        preview.personalPc +
        '</strong></span>' +
        '<span style="' +
        lblStyle +
        '">Windows <strong style="' +
        valStyle +
        'color:#0f172a;">' +
        preview.personalWin +
        '</strong></span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;">' +
        '<span style="' +
        catStyle +
        'color:#6d28d9;">共有用</span>' +
        '<span style="' +
        lblStyle +
        '">PC名 <strong style="' +
        valStyle +
        'color:#0f172a;">' +
        preview.sharedPc +
        '</strong></span>' +
        '<span style="' +
        lblStyle +
        '">Windows <strong style="' +
        valStyle +
        'color:#0f172a;">' +
        preview.sharedWin +
        '</strong></span>' +
        '</div>';
    }

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';

    const inpKw = document.createElement('input');
    inpKw.type = 'text';
    inpKw.id = 'npl674-index-search-kw';
    inpKw.setAttribute('list', SEARCH674_DL_ID);
    inpKw.setAttribute('autocomplete', 'off');
    inpKw.placeholder = 'PC名 / 所属 / 利用者 / WindowsID / M365 など';
    inpKw.title = 'キーワード検索（複数語は空白区切り）。例: JBIS0123 浜田';
    inpKw.style.cssText =
      'min-width:260px;flex:1;max-width:480px;padding:6px 10px;border:1px solid #94a3b8;border-radius:6px;';

    const dl = document.createElement('datalist');
    dl.id = SEARCH674_DL_ID;

    const noteSearchLabel = document.createElement('label');
    noteSearchLabel.style.cssText =
      'display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #94a3b8;' +
      'border-radius:6px;background:#fff;font-size:12px;font-weight:700;color:#334155;cursor:pointer;';
    const noteSearchBox = document.createElement('input');
    noteSearchBox.type = 'checkbox';
    noteSearchBox.id = 'npl674-index-note-search';
    noteSearchBox.setAttribute('aria-label', '備考検索');
    noteSearchLabel.appendChild(noteSearchBox);
    noteSearchLabel.appendChild(document.createTextNode('備考検索'));

    const selectedDepts = new Set();
    const btnOrg = document.createElement('button');
    btnOrg.type = 'button';
    btnOrg.id = 'npl674-index-org-btn';
    btnOrg.textContent = '所属';
    btnOrg.setAttribute('aria-label', '所属で絞り込み');
    btnOrg.setAttribute('aria-haspopup', 'dialog');
    btnOrg.setAttribute('aria-pressed', 'false');
    btnOrg.style.cssText =
      'padding:5px 10px;border-radius:6px;border:1px solid #94a3b8;background:#fff;font-size:12px;font-weight:800;cursor:pointer;color:#0f172a;';
    function syncOrgBtn674() {
      const n = selectedDepts.size;
      const sum = format674DeptSelectionSummary674(selectedDepts);
      btnOrg.textContent = n ? '所属（' + String(n) + '）' : '所属';
      btnOrg.title = sum ? '選択中: ' + sum : '所属グループ／所属名で絞り込み';
      btnOrg.setAttribute('aria-pressed', n ? 'true' : 'false');
      btnOrg.style.background = n ? '#ede9fe' : '#fff';
      btnOrg.style.borderColor = n ? '#7c3aed' : '#94a3b8';
      btnOrg.style.color = n ? '#4c1d95' : '#0f172a';
    }
    btnOrg.addEventListener('click', function () {
      const existing = document.getElementById('npl674-org-popover');
      if (existing) {
        close674OrgPopover674();
        return;
      }
      open674OrgPopover674(btnOrg, selectedDepts, function () {
        syncOrgBtn674();
        updateActiveSummary674();
        scheduleApply674();
      });
    });
    syncOrgBtn674();

    const sortWrap = document.createElement('label');
    sortWrap.style.cssText =
      'display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#0f172a;' +
      'padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;';
    const sortLbl = document.createElement('span');
    sortLbl.textContent = '並び（現在）';
    const selSort = document.createElement('select');
    selSort.id = 'npl674-index-sort';
    selSort.setAttribute('aria-label', '一覧の並び順（既定は新しい順）');
    selSort.style.cssText =
      'padding:6px 8px;border:1px solid #64748b;border-radius:6px;background:#fff;font-size:12px;font-weight:700;max-width:220px;';
    for (let spi = 0; spi < SEARCH674_SORT_PRESETS.length; spi++) {
      const defSort = SEARCH674_SORT_PRESETS[spi];
      const opt = document.createElement('option');
      opt.value = defSort.value;
      opt.textContent = defSort.label;
      selSort.appendChild(opt);
    }
    selSort.value = '$id:desc';
    sortWrap.appendChild(sortLbl);
    sortWrap.appendChild(selSort);

    const btnGo = document.createElement('button');
    btnGo.type = 'button';
    btnGo.textContent = '絞り込み';
    btnGo.style.cssText =
      'padding:6px 14px;border-radius:6px;border:none;background:var(--npl-accent,#0f766e);color:#fff;font-weight:700;cursor:pointer;';

    const btnClr = document.createElement('button');
    btnClr.type = 'button';
    btnClr.textContent = '条件クリア';
    btnClr.setAttribute('aria-label', '検索条件をすべてクリアして既定（利用中・新しい順）に戻す');
    btnClr.style.cssText =
      'padding:7px 14px;border-radius:6px;border:2px solid #c2410c;background:#fff7ed;color:#9a3412;' +
      'font-weight:800;cursor:pointer;box-shadow:0 1px 0 rgba(194,65,12,.15);';

    const btnList = document.createElement('button');
    btnList.type = 'button';
    btnList.textContent = 'リスト一覧作成';
    btnList.setAttribute('aria-label', '条件を指定してリスト一覧を表示');
    btnList.style.cssText =
      'padding:6px 12px;border-radius:6px;border:none;background:var(--npl-accent,#0f766e);color:#fff;font-weight:700;cursor:pointer;';
    btnList.addEventListener('click', function () {
      openList674CreateModal674();
    });

    let btnSkyseaList = null;
    let btnSkyseaClientDelete = null;
    let btnM365Usage = null;
    if (isSkyseaAdmin674()) {
      btnSkyseaList = document.createElement('button');
      btnSkyseaList.type = 'button';
      btnSkyseaList.textContent = 'SKYSEA対応一覧';
      btnSkyseaList.setAttribute('aria-label', 'SKYSEA手動インストール対応一覧（admin専用）');
      btnSkyseaList.style.cssText =
        'padding:6px 12px;border-radius:6px;border:none;background:var(--npl-warn,#b45309);color:#fff;font-weight:700;cursor:pointer;';
      btnSkyseaList.addEventListener('click', function () {
        openSkysea674ListPanel674();
      });

      btnSkyseaClientDelete = document.createElement('button');
      btnSkyseaClientDelete.type = 'button';
      btnSkyseaClientDelete.textContent = 'SKYSEAクライアント削除対応';
      btnSkyseaClientDelete.setAttribute('aria-label', 'SKYSEAクライアント削除未了一覧（admin専用）');
      btnSkyseaClientDelete.style.cssText =
        'padding:6px 12px;border-radius:6px;border:none;background:var(--npl-danger,#b91c1c);color:#fff;font-weight:700;cursor:pointer;';
      btnSkyseaClientDelete.addEventListener('click', function () {
        openSkyseaClientDeleteListPanel674();
      });

      btnM365Usage = document.createElement('button');
      btnM365Usage.type = 'button';
      btnM365Usage.textContent = 'M365利用状況';
      btnM365Usage.setAttribute('aria-label', 'M365利用状況一覧（admin専用・674正本）');
      btnM365Usage.style.cssText =
        'padding:6px 12px;border-radius:6px;border:none;background:#6d28d9;color:#fff;font-weight:700;cursor:pointer;';
      btnM365Usage.addEventListener('click', function () {
        openM365UsagePanel674();
      });
    }

    const btnInvBulk = document.createElement('button');
    btnInvBulk.type = 'button';
    btnInvBulk.id = 'npl674-btn-inventory-bulk';
    btnInvBulk.textContent = '一括棚卸';
    btnInvBulk.style.cssText =
      'display:none;padding:6px 12px;border-radius:6px;border:none;background:var(--npl-ok,#059669);color:#fff;font-weight:700;cursor:pointer;';
    btnInvBulk.addEventListener('click', function () {
      openInventoryBulkModal674();
    });

    const btnInvUninv = document.createElement('button');
    btnInvUninv.type = 'button';
    btnInvUninv.id = 'npl674-btn-inventory-uninv';
    btnInvUninv.textContent = '未棚卸一覧';
    btnInvUninv.style.cssText =
      'display:none;padding:6px 12px;border-radius:6px;border:1px solid #047857;background:#ecfdf5;color:#047857;font-weight:700;cursor:pointer;';
    btnInvUninv.addEventListener('click', function () {
      openUninventoriedList674(null);
    });

    row.appendChild(inpKw);
    row.appendChild(dl);
    row.appendChild(noteSearchLabel);
    row.appendChild(btnOrg);
    row.appendChild(sortWrap);
    row.appendChild(btnGo);
    row.appendChild(btnClr);
    row.appendChild(btnList);

    const invPeriodHint = document.createElement('div');
    invPeriodHint.id = 'npl674-inv-period-hint';
    invPeriodHint.style.cssText =
      'font-size:14px;font-weight:700;color:#14532d;margin-bottom:10px;line-height:1.5;' +
      'padding:10px 12px;border-radius:6px;border:1px solid #86efac;background:#ecfdf5;';
    invPeriodHint.textContent = '棚卸期間を確認中…';
    ensureInventoryPeriodLoaded674().then(function (active) {
      const bounds = computeInventoryPeriodBounds674(npl674InventoryEnvMap674);
      const fiscalLabel = formatFiscalInventoryPeriodLabel674();
      const periodRange = bounds.start + ' 〜 ' + bounds.end;
      if (active) {
        invPeriodHint.style.color = '#14532d';
        invPeriodHint.style.borderColor = '#86efac';
        invPeriodHint.style.background = '#ecfdf5';
        invPeriodHint.textContent =
          '棚卸期間：' +
          periodRange +
          ' （年次参考: ' +
          fiscalLabel +
          '）。一括棚卸・未棚卸一覧が利用できます。';
      } else {
        invPeriodHint.style.color = '#92400e';
        invPeriodHint.style.borderColor = '#fcd34d';
        invPeriodHint.style.background = '#fffbeb';
        invPeriodHint.textContent =
          '現在は棚卸期間外です。棚卸期間：' +
          periodRange +
          ' （年次参考: ' +
          fiscalLabel +
          '）。棚卸状況一覧は通年で確認できます。';
      }
    });

    const invButtonRow = document.createElement('div');
    invButtonRow.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';
    invButtonRow.appendChild(btnInvBulk);
    invButtonRow.appendChild(btnInvUninv);

    let adminHint = null;
    let adminButtonRow = null;
    if (isAdmin674) {
      adminHint = document.createElement('div');
      adminHint.style.cssText = 'font-size:12px;color:#475569;margin-bottom:8px;line-height:1.45;';
      adminHint.textContent = 'SKYSEA / M365 管理機能（admin 専用）';
      adminButtonRow = document.createElement('div');
      adminButtonRow.style.cssText =
        'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;';
      if (btnSkyseaList) adminButtonRow.appendChild(btnSkyseaList);
      if (btnSkyseaClientDelete) adminButtonRow.appendChild(btnSkyseaClientDelete);
      if (btnM365Usage) adminButtonRow.appendChild(btnM365Usage);
    }

    const activeSummary = document.createElement('div');
    activeSummary.id = 'npl674-index-active-summary';
    activeSummary.setAttribute('aria-live', 'polite');
    activeSummary.style.cssText =
      'flex:1;min-width:220px;margin:0;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;' +
      'font-size:14px;font-weight:700;color:#0f172a;line-height:1.5;';

    const matchCountEl = document.createElement('div');
    matchCountEl.id = 'npl674-index-match-count';
    matchCountEl.setAttribute('aria-live', 'polite');
    matchCountEl.style.cssText =
      'flex:0 0 auto;margin:0;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;' +
      'font-size:14px;font-weight:800;color:#0f172a;line-height:1.5;white-space:nowrap;';
    matchCountEl.textContent = '該当件数: …';

    const summaryRow = document.createElement('div');
    summaryRow.id = 'npl674-index-summary-row';
    summaryRow.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:0 0 8px;';
    summaryRow.appendChild(activeSummary);
    summaryRow.appendChild(matchCountEl);

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
        updateActiveSummary674();
        scheduleApply674();
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
      scheduleApply674();
    });
    chipRow.appendChild(btnTransferChip);

    const selectedStatuses = init674DefaultStatusSet674();

    const cbFilterBoxes = { m365: { v: null }, shisan: { v: null } };

    function set674CbFilterMode674(key, mode) {
      const box = cbFilterBoxes[key];
      if (!box) return;
      box.v = box.v === mode ? null : mode;
      syncChips674();
      scheduleApply674();
    }

    SEARCH674_DONE_CB_FILTERS.forEach(function (defCb) {
      const btnDone = document.createElement('button');
      btnDone.type = 'button';
      btnDone.textContent = defCb.labelDone;
      btnDone.dataset.nplCbFilterKey = defCb.key;
      btnDone.dataset.nplCbFilterMode = 'checked';
      btnDone.className = 'npl674-index-chip';
      btnDone.setAttribute('aria-pressed', 'false');
      btnDone.style.cssText =
        'padding:4px 10px;border-radius:999px;border:1px solid #94a3b8;background:#fff;' +
        'font-size:12px;font-weight:700;cursor:pointer;color:#0f172a;';
      btnDone.addEventListener('click', function () {
        set674CbFilterMode674(defCb.key, 'checked');
      });
      chipRow.appendChild(btnDone);

      const btnNone = document.createElement('button');
      btnNone.type = 'button';
      btnNone.textContent = defCb.labelNone;
      btnNone.dataset.nplCbFilterKey = defCb.key;
      btnNone.dataset.nplCbFilterMode = 'unchecked';
      btnNone.className = 'npl674-index-chip';
      btnNone.setAttribute('aria-pressed', 'false');
      btnNone.style.cssText = btnDone.style.cssText;
      btnNone.addEventListener('click', function () {
        set674CbFilterMode674(defCb.key, 'unchecked');
      });
      chipRow.appendChild(btnNone);
    });

    const statusSep = document.createElement('span');
    statusSep.setAttribute('aria-hidden', 'true');
    statusSep.textContent = '|';
    statusSep.style.cssText = 'color:#cbd5e1;font-weight:700;margin:0 2px;';
    chipRow.appendChild(statusSep);

    const statusLabel = document.createElement('span');
    statusLabel.textContent = 'ステータス:';
    statusLabel.style.cssText = 'font-size:11px;font-weight:700;color:#475569;margin-right:2px;';
    chipRow.appendChild(statusLabel);

    SEARCH674_STATUS_CHIPS.forEach(function (defSt) {
      const bSt = document.createElement('button');
      bSt.type = 'button';
      bSt.textContent = defSt.label;
      bSt.dataset.statusValue = defSt.value;
      bSt.className = 'npl674-index-chip';
      bSt.setAttribute('aria-pressed', 'false');
      bSt.style.cssText =
        'padding:4px 10px;border-radius:999px;border:1px solid #94a3b8;background:#dcfce7;' +
        'font-size:12px;font-weight:700;cursor:pointer;color:#0f172a;';
      bSt.addEventListener('click', function () {
        const valSt = bSt.dataset.statusValue || '';
        if (selectedStatuses.has(valSt)) {
          if (selectedStatuses.size <= 1) return;
          selectedStatuses.delete(valSt);
        } else {
          selectedStatuses.add(valSt);
        }
        syncChips674();
        scheduleApply674();
      });
      chipRow.appendChild(bSt);
    });

    const skyChipRow = document.createElement('div');
    skyChipRow.style.cssText = 'display:none;';

    let matchCountSeq674 = 0;
    function refreshMatchCount674() {
      const seq = ++matchCountSeq674;
      matchCountEl.textContent = '該当件数: …';
      let cond = '';
      try {
        if (kintone.app && typeof kintone.app.getQueryCondition === 'function') {
          cond = String(kintone.app.getQueryCondition() || '').trim();
        }
      } catch (eCond) {
        /* noop */
      }
      const appId = kintone.app.getId();
      const q = (cond ? cond + ' ' : '') + 'limit 1';
      kintone
        .api(kintone.api.url('/k/v1/records', true), 'GET', {
          app: appId,
          query: q,
          totalCount: true,
          fields: ['$id'],
        })
        .then(function (res) {
          if (seq !== matchCountSeq674) return;
          const n = Number(res && res.totalCount != null ? res.totalCount : 0);
          matchCountEl.textContent = '該当件数: ' + n + '件';
        })
        .catch(function (e) {
          if (seq !== matchCountSeq674) return;
          console.warn('[NEW-PC-LEDGER-V1] match count', e);
          matchCountEl.textContent = '該当件数: —';
        });
    }

    function buildActiveConditionParts674() {
      const parts = [];
      const kw = String(inpKw.value || '').trim();
      if (kw) parts.push('キーワード「' + kw + '」');
      if (noteSearchBox.checked) parts.push('備考検索ON');
      if (selectedDepts.size) {
        parts.push('所属: ' + format674DeptSelectionSummary674(selectedDepts));
      }
      if (selectedTypes.size) {
        parts.push(
          '種別: ' +
            Array.from(selectedTypes)
              .map(function (t) {
                return t;
              })
              .join('・'),
        );
      } else {
        parts.push('種別: すべて');
      }
      if (selectedStatuses.size) {
        parts.push('ステータス: ' + Array.from(selectedStatuses).join('・'));
      }
      if (transferBox.v) parts.push('転用PCのみ');
      if (cbFilterBoxes.m365.v === 'checked') parts.push('M365切替 済');
      if (cbFilterBoxes.m365.v === 'unchecked') parts.push('M365切替 未');
      if (cbFilterBoxes.shisan.v === 'checked') parts.push('資産台帳 済');
      if (cbFilterBoxes.shisan.v === 'unchecked') parts.push('資産台帳 未');
      let sortLabel = '新しい順（レコード番号↓）';
      const sv = String(selSort.value || '');
      for (let si = 0; si < SEARCH674_SORT_PRESETS.length; si++) {
        if (SEARCH674_SORT_PRESETS[si].value === sv) {
          sortLabel = SEARCH674_SORT_PRESETS[si].label || sortLabel;
          break;
        }
      }
      parts.push('並び: ' + sortLabel);
      return parts;
    }

    const invLedgerCondWrap = document.createElement('div');
    invLedgerCondWrap.id = 'npl674-inv-ledger-cond-wrap';
    invLedgerCondWrap.style.cssText =
      'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px;' +
      'padding:10px 12px;border-radius:6px;border:1px solid #bbf7d0;background:#fff;';
    const invLedgerCondText = document.createElement('div');
    invLedgerCondText.id = 'npl674-inv-ledger-cond';
    invLedgerCondText.style.cssText =
      'flex:1;min-width:200px;font-size:13px;font-weight:700;color:#14532d;line-height:1.45;';
    const invLedgerGotoBtn = document.createElement('button');
    invLedgerGotoBtn.type = 'button';
    invLedgerGotoBtn.textContent = '台帳で条件変更';
    invLedgerGotoBtn.style.cssText =
      'padding:6px 12px;border-radius:6px;border:1px solid #047857;background:#ecfdf5;color:#047857;' +
      'font-weight:800;cursor:pointer;font-size:12px;';
    invLedgerCondWrap.appendChild(invLedgerCondText);
    invLedgerCondWrap.appendChild(invLedgerGotoBtn);

    function updateActiveSummary674() {
      const parts = buildActiveConditionParts674();
      const line = parts.join(' ／ ');
      activeSummary.textContent = 'いまの条件: ' + line;
      invLedgerCondText.textContent = '台帳側の条件: ' + line;
    }

    function syncChips674() {
      chipRow.querySelectorAll('button[data-type-value]').forEach(function (b) {
        const val = b.dataset.typeValue || '';
        const on = selectedTypes.has(val);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.style.background = on ? '#cffafe' : '#fff';
        b.style.borderColor = on ? '#0e7490' : '#94a3b8';
      });
      const tb = chipRow.querySelector('button[data-npl-transfer-chip]');
      if (tb) {
        const on = transferBox.v;
        tb.setAttribute('aria-pressed', on ? 'true' : 'false');
        tb.style.background = on ? '#ffedd5' : '#fff';
        tb.style.borderColor = on ? '#c2410c' : '#94a3b8';
      }
      chipRow.querySelectorAll('button[data-npl-cb-filter-key]').forEach(function (b) {
        const key = b.getAttribute('data-npl-cb-filter-key') || '';
        const mode = b.getAttribute('data-npl-cb-filter-mode') || '';
        const box = cbFilterBoxes[key];
        const on = box && box.v === mode;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (mode === 'checked') {
          b.style.background = on ? '#dbeafe' : '#fff';
          b.style.borderColor = on ? '#1d4ed8' : '#94a3b8';
        } else {
          b.style.background = on ? '#f1f5f9' : '#fff';
          b.style.borderColor = on ? '#475569' : '#94a3b8';
        }
      });
      chipRow.querySelectorAll('button[data-status-value]').forEach(function (b) {
        const valSt = b.dataset.statusValue || '';
        const onSt = selectedStatuses.has(valSt);
        b.setAttribute('aria-pressed', onSt ? 'true' : 'false');
        if (valSt === PC_STATUS_DISPOSED_674) {
          b.style.background = onSt ? '#f1f5f9' : '#fff';
          b.style.borderColor = onSt ? '#64748b' : '#94a3b8';
          b.style.color = onSt ? '#475569' : '#0f172a';
        } else {
          b.style.background = onSt ? '#dcfce7' : '#fff';
          b.style.borderColor = onSt ? '#15803d' : '#94a3b8';
          b.style.color = '#0f172a';
        }
      });
      updateActiveSummary674();
    }

    ledgerPanel.appendChild(title);
    ledgerPanel.appendChild(nextSerialBar);
    ledgerPanel.appendChild(row);
    ledgerPanel.appendChild(summaryRow);
    ledgerPanel.appendChild(chipRow);

    inventoryPanel.appendChild(invPeriodHint);
    inventoryPanel.appendChild(invLedgerCondWrap);
    inventoryPanel.appendChild(invButtonRow);
    ensureInventoryHubSummaryAccordion674(inventoryPanel);

    if (adminPanel && adminHint && adminButtonRow) {
      adminPanel.appendChild(adminHint);
      adminPanel.appendChild(adminButtonRow);
    }

    wrap.appendChild(hubTabBar);
    wrap.appendChild(ledgerPanel);
    wrap.appendChild(inventoryPanel);
    if (adminPanel) wrap.appendChild(adminPanel);

    let currentHub674 = resolve674InitialHub674(isAdmin674);
    function apply674HubTone674(hub) {
      const tone = HUB674_TONES[hub] || HUB674_TONES.ledger;
      wrap.style.setProperty('--npl-hub-bg', tone.bg);
      wrap.style.setProperty('--npl-hub-border', tone.border);
      wrap.style.setProperty('--npl-accent', tone.accent);
      wrap.style.background = tone.bg;
      wrap.style.borderColor = tone.border;
      hubTabBar.style.borderBottomColor = tone.border;
    }
    function apply674HubSwitch674(hub) {
      if (hub === 'admin' && !isAdmin674) hub = 'ledger';
      currentHub674 = hub;
      apply674HubTone674(hub);
      Object.keys(hubPanels).forEach(function (key) {
        const panel = hubPanels[key];
        if (panel) panel.style.display = key === hub ? '' : 'none';
      });
      hubTabButtons.forEach(function (tabBtn) {
        const key = tabBtn.dataset.npl674Hub || '';
        const selected = key === hub;
        tabBtn.setAttribute('aria-selected', selected ? 'true' : 'false');
        tabBtn.style.color = selected ? 'var(--npl-accent,#a16207)' : 'var(--npl-muted,#64748b)';
        tabBtn.style.borderBottomColor = selected ? 'var(--npl-accent,#a16207)' : 'transparent';
      });
      persist674Hub674(hub);
    }
    hubTabButtons.forEach(function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        apply674HubSwitch674(tabBtn.dataset.npl674Hub || 'ledger');
      });
    });
    apply674HubSwitch674(currentHub674);
    invLedgerGotoBtn.addEventListener('click', function () {
      apply674HubSwitch674('ledger');
    });

    let applyTimer674 = null;
    let applySeq674 = 0;
    const apply674 = function () {
      updateActiveSummary674();
      ensure674SearchCache()
        .then(function (recs) {
          const q = build674IndexListQuery(
            inpKw.value,
            selectedTypes,
            transferBox.v,
            cbFilterBoxes,
            recs,
            selectedStatuses,
            noteSearchBox.checked,
            selectedDepts,
          );
          navigate674ListWithQuery(q, inpKw.value, selSort.value, noteSearchBox.checked);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] index search apply', e);
          const q = build674IndexListQuery(
            inpKw.value,
            selectedTypes,
            transferBox.v,
            cbFilterBoxes,
            null,
            selectedStatuses,
            noteSearchBox.checked,
            selectedDepts,
          );
          navigate674ListWithQuery(q, inpKw.value, selSort.value, noteSearchBox.checked);
        });
    };

    function scheduleApply674() {
      updateActiveSummary674();
      if (applyTimer674) clearTimeout(applyTimer674);
      const seq = ++applySeq674;
      applyTimer674 = setTimeout(function () {
        applyTimer674 = null;
        if (seq !== applySeq674) return;
        apply674();
      }, 300);
    }

    selSort.addEventListener('change', function () {
      scheduleApply674();
    });

    btnGo.addEventListener('click', function () {
      if (applyTimer674) clearTimeout(applyTimer674);
      applySeq674 += 1;
      apply674();
    });
    noteSearchBox.addEventListener('change', function () {
      if (noteSearchBox.checked) {
        selectedStatuses.clear();
        init674AllStatusSet674().forEach(function (sv) {
          selectedStatuses.add(sv);
        });
        syncChips674();
      } else {
        updateActiveSummary674();
      }
      scheduleApply674();
    });
    btnClr.addEventListener('click', function () {
      inpKw.value = '';
      noteSearchBox.checked = false;
      selectedTypes.clear();
      selectedStatuses.clear();
      init674DefaultStatusSet674().forEach(function (sv) {
        selectedStatuses.add(sv);
      });
      transferBox.v = false;
      cbFilterBoxes.m365.v = null;
      cbFilterBoxes.shisan.v = null;
      selSort.value = '$id:desc';
      syncChips674();
      wrap.setAttribute('data-npl-synced-query', '');
      selectedDepts.clear();
      syncOrgBtn674();
      close674OrgPopover674();
      const q = build674IndexListQuery(
        '',
        selectedTypes,
        false,
        cbFilterBoxes,
        null,
        selectedStatuses,
        false,
        selectedDepts,
      );
      navigate674ListWithQuery(q, '', '$id:desc', false);
    });
    /**
     * Chrome 等で `<datalist>` を IME 変換中に書き換えると、ローマ字が確定して
     * 「ma」→「ま」が「mあ」になる（§4.8a）。変換中は list を外し候補更新しない。
     */
    let kwComposing674 = false;
    function refresh674KwDatalist674() {
      ensure674SearchCache()
        .then(function (recs) {
          if (kwComposing674) return;
          update674SearchDatalist(recs, inpKw.value);
        })
        .catch(function (e) {
          console.warn('[NEW-PC-LEDGER-V1] index search datalist', e);
        });
    }
    inpKw.addEventListener('compositionstart', function () {
      kwComposing674 = true;
      inpKw.removeAttribute('list');
    });
    inpKw.addEventListener('compositionend', function () {
      kwComposing674 = false;
      inpKw.setAttribute('list', SEARCH674_DL_ID);
      updateActiveSummary674();
      refresh674KwDatalist674();
    });

    inpKw.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        if (ev.isComposing || kwComposing674 || ev.keyCode === 229) return;
        ev.preventDefault();
        if (applyTimer674) clearTimeout(applyTimer674);
        applySeq674 += 1;
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
      noteSearchBox: noteSearchBox,
      sortSel: selSort,
      selectedTypes: selectedTypes,
      selectedStatuses: selectedStatuses,
      selectedDepts: selectedDepts,
      syncOrgBtn: syncOrgBtn674,
      transferBox: transferBox,
      cbFilterBoxes: cbFilterBoxes,
      syncChips: syncChips674,
      updateActiveSummary: updateActiveSummary674,
      refreshMatchCount: refreshMatchCount674,
      ensure674SearchCache: ensure674SearchCache,
      refreshNextSerial: function () {
        fetch674IndexNextSerialPreview674().then(render674NextSerialBar674);
      },
    };
    wrap.setAttribute('data-npl-synced-query', '');

    syncChips674();
    refreshMatchCount674();
    fetch674IndexNextSerialPreview674().then(render674NextSerialBar674);

    inpKw.addEventListener('input', function (ev) {
      if (kwComposing674 || (ev && ev.isComposing)) return;
      updateActiveSummary674();
      if (split674IndexKeywords674(inpKw.value).length) {
        selectedStatuses.clear();
        init674AllStatusSet674().forEach(function (sv) {
          selectedStatuses.add(sv);
        });
        syncChips674();
      }
      refresh674KwDatalist674();
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
      })
      .then(function () {
        wire674IndexInventoryButtons674();
        refresh674SkyseaClientDeleteBanner674();
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
  let npl674IndexStatusById674 = Object.create(null);

  function ensure674IndexStatusStyles674() {
    if (document.getElementById('npl674-index-status-styles')) return;
    const st = document.createElement('style');
    st.id = 'npl674-index-status-styles';
    st.textContent =
      '.recordlist-gaia tr.npl674-row-cancelled,.recordlist-gaia tr.npl674-row-cancelled td{background:#fef3c7!important;}' +
      '.recordlist-gaia tr.npl674-row-cancelled:hover,.recordlist-gaia tr.npl674-row-cancelled:hover td{background:#fde68a!important;}' +
      '.recordlist-gaia tr.npl674-row-disposed,.recordlist-gaia tr.npl674-row-disposed td{background:#f1f5f9!important;color:#64748b!important;}' +
      '.recordlist-gaia tr.npl674-row-disposed:hover,.recordlist-gaia tr.npl674-row-disposed:hover td{background:#e2e8f0!important;}';
    document.head.appendChild(st);
  }

  function extract674IndexRecordIdFromRow674(tr) {
    const a = tr.querySelector('a[href*="record="]');
    if (!a) return '';
    const m = String(a.getAttribute('href') || '').match(/record=(\d+)/);
    return m ? m[1] : '';
  }

  function paint674IndexListRows674() {
    ensure674IndexStatusStyles674();
    const rows = document.querySelectorAll('.recordlist-gaia tbody tr, tr.recordlist-row-gaia');
    rows.forEach(function (tr) {
      tr.classList.remove('npl674-row-cancelled', 'npl674-row-disposed');
      const id = extract674IndexRecordIdFromRow674(tr);
      if (!id) return;
      const st = npl674IndexStatusById674[id];
      if (st === PC_STATUS_CANCELLED_674) tr.classList.add('npl674-row-cancelled');
      else if (st === PC_STATUS_DISPOSED_674) tr.classList.add('npl674-row-disposed');
    });
  }

  function refresh674IndexStatusMap674() {
    const app = kintone.app.getId();
    const map = Object.create(null);
    function page(offset) {
      return kintone
        .api(kintone.api.url('/k/v1/records', true), 'GET', {
          app: app,
          query: '$id > 0 order by $id asc limit 500 offset ' + offset,
          fields: ['$id', FC_PC_STATUS],
        })
        .then(function (res) {
          const recs = res.records || [];
          recs.forEach(function (rec) {
            const id = rec.$id && rec.$id.value;
            const st = (rec[FC_PC_STATUS] && rec[FC_PC_STATUS].value) || '';
            if (id) map[String(id)] = String(st);
          });
          if (recs.length >= 500) return page(offset + 500);
        });
    }
    return page(0).then(function () {
      npl674IndexStatusById674 = map;
      paint674IndexListRows674();
    });
  }

  function schedule674IndexStatusPaint674() {
    refresh674IndexStatusMap674().catch(function (e) {
      console.warn('[NEW-PC-LEDGER-V1] index status paint', e);
    });
    [300, 800, 1500].forEach(function (ms) {
      setTimeout(paint674IndexListRows674, ms);
    });
  }

  function ensure674PcStatusBanner674(record) {
    const existing = document.getElementById('npl674-pc-status-banner');
    if (existing) existing.remove();
    if (!record) return;
    const st = readPcStatusLive674(record);
    if (!isPcStatusCancelled674(st) && st !== PC_STATUS_DISPOSED_674) return;
    const banner = document.createElement('div');
    banner.id = 'npl674-pc-status-banner';
    if (isPcStatusCancelled674(st)) {
      banner.style.cssText =
        'margin:8px 12px;padding:12px 16px;background:#fef3c7;border:2px solid #d97706;border-radius:8px;' +
        'color:#92400e;font-size:14px;font-weight:700;line-height:1.55;';
      banner.textContent =
        '⚠ 登録ミス取消 — このレコードは誤登録として取消されています（履歴保持・物理削除不可）。';
    } else {
      banner.style.cssText =
        'margin:8px 12px;padding:12px 16px;background:#f1f5f9;border:2px solid #94a3b8;border-radius:8px;' +
        'color:#475569;font-size:14px;font-weight:700;line-height:1.55;';
      banner.textContent = 'このレコードは廃棄済みです。';
    }
    const mount =
      document.querySelector('#new-pc-ledger-buttons') ||
      document.querySelector('.gaia-argoui-app-toolbar') ||
      document.querySelector('.layout-gaia');
    if (mount && mount.parentNode) {
      mount.parentNode.insertBefore(banner, mount.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function ensure674IndexHidesCancelledOnLoad674() {
    const read = read674IndexSearchQueryAndKw674();
    const urlQuery = String(read.urlQuery || '').trim();
    const nativeQ = String(read.urlNativeQ || '').trim();
    const effectiveQ = urlQuery || nativeQ;
    const st = parse674ListQueryToBarState674(effectiveQ);
    const cancelHiddenRe = new RegExp(
      FC_PC_STATUS + '\\s+not\\s+in\\s*\\([^)]*' + escape674QueryRegex674(escape674QueryLike(PC_STATUS_CANCELLED_674)) + '[^)]*\\)',
    );
    if (cancelHiddenRe.test(effectiveQ)) return;

    const defaultStatuses = init674DefaultStatusSet674();
    const defaultQ = build674IndexListQuery(
      '',
      new Set(),
      false,
      null,
      null,
      defaultStatuses,
      false,
    );
    if (!defaultQ) return;

    if (!effectiveQ) {
      navigate674ListWithQuery(defaultQ, '', '$id:desc', false);
      return;
    }

    if (!st.statuses.length) {
      const merged =
        '(' +
        FC_PC_STATUS +
        ' not in ("' +
        escape674QueryLike(PC_STATUS_CANCELLED_674) +
        '")) and ' +
        effectiveQ;
      let kw = '';
      if (read.urlKwParam) {
        try {
          kw = decodeURIComponent(read.urlKwParam);
        } catch (_e) {
          kw = read.urlKwParam;
        }
      }
      navigate674ListWithQuery(merged, kw, read.urlSort || '$id:desc', read.urlNote === '1');
    }
  }

  function onRecordIndexShow674(event) {
    if (redirect674IfOrphanNativeQ674()) return event;
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
    wire674IndexInventoryButtons674();
    refresh674SkyseaClientDeleteBanner674();
    schedule674IndexStatusPaint674();
    setTimeout(ensure674IndexHidesCancelledOnLoad674, 100);
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

  /**
   * 買替由来レコード（import_source=PC_REPLACE_FROM_674…）は機種情報必須。
   * 未入力なら保存不可（確認ダイアログでは抜けられない）。
   * @returns {boolean} true=通過 / false=event.error 設定済
   */
  function check674ReplaceFirstSaveHwGate674(event) {
    const importSrc = String((event.record[FC_IMPORT_SOURCE] && event.record[FC_IMPORT_SOURCE].value) || '').trim();
    if (importSrc.indexOf('PC_REPLACE_FROM_674') !== 0) return true;
    const missing = [];
    const fieldErrors = {};
    for (let i = 0; i < REPLACE_HW_REQUIRED_FIELDS_674.length; i++) {
      const code = REPLACE_HW_REQUIRED_FIELDS_674[i][0];
      const label = REPLACE_HW_REQUIRED_FIELDS_674[i][1];
      if (!trimmedScalarValue674(event.record, code)) {
        const m = '買替後は「' + label + '」を入力してください。';
        missing.push(label);
        fieldErrors[code] = m;
      }
    }
    if (!missing.length) return true;
    event.errors = Object.assign(event.errors || {}, fieldErrors);
    event.error =
      '買替後は機種情報（' + missing.join('・') + '）を入力しないと保存できません。';
    return false;
  }

  function onBeforeSubmit674(event) {
    if (!check674ReplaceFirstSaveHwGate674(event)) {
      return event;
    }
    ensureSkyseaManualDoneOnRecord674(event.record);
    try {
      ensureInventoryHistoryOnSubmit674(event);
    } catch (invErr) {
      event.error = invErr && invErr.message ? invErr.message : String(invErr);
      return event;
    }
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

      const pcNameSubmit674 = String(event.record[FC_PC_NAME]?.value || '').trim();
      if (type !== TYPE_PERSONAL && isPersonalStyleJbisPcName674(pcNameSubmit674)) {
        const okSharedJbis674 = window.confirm(
          '種別が「個人」以外ですが、PC名が個人JBIS形式（JBIS…）のままです。\n\n' +
            '個人から共有等へ転換する際、現場ラベルを維持することは運用上許容されています。\n' +
            '個人JBISの次採番は全種別の pc_name 走査で衝突回避済みです。\n\n' +
            '「OK」で保存すると、備考（note）に運用記録を1行追記します（既に同じ行があれば重複しません）。\n' +
            '「キャンセル」で保存を中止します。',
        );
        if (!okSharedJbis674) {
          event.error = '個人JBIS形式のPC名のまま保存するには確認が必要です。';
          resolve(event);
          return;
        }
        appendSharedJbisOpsNote674(event.record);
      }

      const vpnMsg = validateVpnFieldsNotManuallyChanged674(event);
      if (vpnMsg) {
        event.error = vpnMsg;
        event.errors = Object.assign(event.errors || {}, {
          [FC_VPN_ID]: vpnMsg,
          [FC_VPN_PW]: vpnMsg,
        });
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
              '同じPC名が既に登録されています（全く同一のPC名のみ登録不可）。別のPC名に変更してください。';
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

  /** §4.10.7 レコード物理削除禁止（アプリ権限 OFF + customize 二重ロック） */
  const blockDeleteEvents674 = [
    'app.record.detail.delete.submit',
    'app.record.index.delete.submit',
  ];
  const blockDeleteMessage674 =
    'PC台帳のレコードは削除できません。' +
    '登録ミスは「登録ミス取消」またはステータス「取消」、PC終了は「廃棄」、退職後は595連動で「保管」に変更してください。' +
    '（レコードは履歴として保持します）';

  function onBlockDelete674(event) {
    event.error = blockDeleteMessage674;
    return event;
  }

  kintone.events.on(blockDeleteEvents674, onBlockDelete674);
  if (typeof kintone.mobile !== 'undefined') {
    kintone.events.on(['mobile.app.record.detail.delete.submit'], onBlockDelete674);
  }

  install674EmptyFieldFocusAssist674();

  console.log(`[NEW-PC-LEDGER-V1] customize loaded BUILD=${BUILD}`);
  console.log(`[NEW-PC-LEDGER-V1] 関連アプリ: env=${APP_ENV_MASTER} m365=${APP_M365_MASTER} jbm=${APP_JBM_NUMBER} sjbm=${APP_SJBM_NUMBER} employee=${APP_EMPLOYEE}`);
})();
