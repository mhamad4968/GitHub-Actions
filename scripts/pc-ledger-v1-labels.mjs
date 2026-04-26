/**
 * 新・PC台帳ver.1 — フィールド code → 画面表示ラベル
 * 正本: docs/plans/2026-04-21-new-pc-ledger-spec.md §4.2
 * §4.2.1・4.2.3・4.2.4 は仕様書「説明」「内容」列の原文。
 * §4.2.2 はマトリクスのみのため UI 短文は scripts/data/pc-ledger-spec-4222-ui-labels.json と同期。
 * 整合検証: npm run pc-ledger:verify-labels-spec
 */
export const PC_LEDGER_V1_LABELS = {
  pc_name: 'PC 名（個人=JBIS****-YYYYMM / 共有=S-JBIS****-YYYYMM / JR=手入力）',
  pc_serial_no: 'PC 連番（種別別自動採番、新規発番分のみ）',
  serial: 'シリアル番号',
  account_type: '種別 (個人 / 共有 / JR端末 / サーバーNAS / その他)',
  pc_status: 'ステータス (利用中 / 保管 / 廃棄)',
  user_name: '利用者名（595 ルックアップ）',
  dept_name: '所属名（595 から自動引用）',
  group_name: '所属グループ（595 から自動引用）',
  shared_terminal_name: '共有端末名（共有/JR で必須・手入力）',
  purchase_date: '購入日',
  latest_inventory_date: '最新棚卸日',
  note: '備考',
  logon_name: 'WindowsID',
  logon_pw: 'ログオン初期PW',
  windows_name: 'Windows名',
  mail: 'メール（595 から）',
  mail_acct: 'mailの@前',
  mail_pw: 'メール初期PW',
  m365_id: 'M365 ID',
  m365_pw: 'M365 PW',
  gb_id: 'Google（Business）ID',
  gb_pw: 'Google（Business）PW',
  sb_id: 'SmartHR ID',
  sb_pw: 'SmartHR PW',
  vpn_id: 'VPN ID',
  vpn_pw: 'VPN PW',
  skysea_status: '未確認 / インストール済 / 未インストール / インストール対象外',
  skysea_checked_at: 'SKYSEA 最終確認日時',
  skysea_install_log: 'SKYSEA インストール履歴',
  skysea_target_flag: '配信対象フラグ',
  m365_master_record_id: '紐付き M365管理マスタ レコード番号（共有/JR のみ）',
  import_source: '取込元',
  legacy_pc_name_594: '旧PC名（594）',
  legacy_record_id_594: '旧レコードID（594）',
  created_at_jst: '作成日時（JST）',
};
