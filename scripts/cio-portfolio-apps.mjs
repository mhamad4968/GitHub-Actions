/**
 * customize ポートフォリオ監査・同期の対象アプリ（単一正本）。
 * 監査: cio-audit-customize-portfolio.mjs / 同期: cio-sync-portfolio-deploy.mjs / 快照: cio-snapshot-portfolio-apps.mjs
 *
 * 627: 674 移行後に削除済（浜田確認 2026-06-10）— 監査対象外。リポ customize/627 は参照用に残置。
 * 668: kintone 上削除済（2026-06）— 監査対象外。リポ customize/ops-guide は参照用に残置。
 */
export const PORTFOLIO_CUSTOMIZE = [
  { id: "677", rel: "customize/677/desktop.js", deploy: "deploy:677" },
  { id: "678", rel: "customize/678/desktop.js", deploy: "deploy:678" },
  { id: "679", rel: "customize/679/desktop.js", deploy: "deploy:679" },
  { id: "682", rel: "customize/682/desktop.js", deploy: "deploy:682" },
  { id: "683", rel: "customize/683/desktop.js", deploy: "deploy:683" },
  { id: "686", rel: "customize/686/desktop.js", deploy: "deploy:686" },
  { id: "706", rel: "customize/nonconformance-db/desktop.js", deploy: "deploy:706" },
  { id: "707", rel: "customize/nonconformance-dash/desktop.js", deploy: "deploy:707" },
  { id: "708", rel: "customize/external-it-checksheet-db/desktop.js", deploy: "deploy:708" },
  { id: "709", rel: "customize/external-it-checksheet-dash/desktop.js", deploy: "deploy:709" },
  { id: "710", rel: "customize/new-system-intro-db/desktop.js", deploy: "deploy:710" },
  { id: "711", rel: "customize/new-system-intro-dash/desktop.js", deploy: "deploy:711" },
];

export const PORTFOLIO_APP_IDS = PORTFOLIO_CUSTOMIZE.map((p) => p.id);

/** 月次 live-schema 追加対象（BUILD 監査 PORTFOLIO 外の registry 台帳） */
export const LIVE_SCHEMA_MONTHLY_EXTRA_IDS = ['714', '715', '716', '717', '718', '719', '733', '734', '737', '738'];

/** 月次 live-schema 監査対象 — PORTFOLIO + Space21 台帳（単一正本・全 customize 走査禁止） */
export const LIVE_SCHEMA_MONTHLY_IDS = [
  ...new Set([...PORTFOLIO_APP_IDS, ...LIVE_SCHEMA_MONTHLY_EXTRA_IDS]),
];

/**
 * kintone 削除済み・参照のみ — live-schema / 月次から除外。
 * リポ customize/ は残置可（git 履歴・Runbook 参照用）。
 */
export const LIVE_SCHEMA_EXCLUDED_IDS = ['594', '626', '627', '651', '652', '653', '668', '681'];

/** revision スナップショット対象（予実＋ユーザサポート） */
export const PORTFOLIO_SNAPSHOT_IDS = ["677", "678", "679", "682", "683"];
