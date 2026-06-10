/**
 * customize ポートフォリオ監査・同期の対象アプリ（単一正本）。
 * 監査: cio-audit-customize-portfolio.mjs / 同期: cio-sync-portfolio-deploy.mjs / 快照: cio-snapshot-portfolio-apps.mjs
 *
 * 627: 2026-06-10 テナント削除確認（GAIA_AP01）— 監査対象外。リポ customize/627 は参照用に残置。
 */
export const PORTFOLIO_CUSTOMIZE = [
  { id: "668", rel: "customize/ops-guide/desktop.js", deploy: "deploy:668" },
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

/** revision スナップショット対象（予実＋ユーザサポート） */
export const PORTFOLIO_SNAPSHOT_IDS = ["677", "678", "679", "682", "683"];
