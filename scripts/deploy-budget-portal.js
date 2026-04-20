/**
 * 予算ポータル関連の desktop JS を順にデプロイする。
 * ダッシュボードアプリは .env の KINTONE_BUDGET_DASHBOARD_APP_ID があれば含める（無ければスキップして警告）。
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dashboardId = process.env.KINTONE_BUDGET_DASHBOARD_APP_ID?.trim();
const steps = [];
if (dashboardId && /^\d+$/.test(dashboardId)) {
  steps.push([dashboardId, join(root, 'customize/budget-portal/dashboard-desktop.js')]);
} else {
  console.warn('[deploy-budget-portal] KINTONE_BUDGET_DASHBOARD_APP_ID 未設定のためダッシュボードはスキップ（budget:create-dashboard 後に .env へ追記）');
}
steps.push(
  ['649', join(root, 'customize/budget-portal/jbis-budget-nav.js')],
  ['650', join(root, 'customize/budget-portal/jbis-budget-nav.js')],
  ['651', join(root, 'customize/651/desktop.js')],
  ['652', join(root, 'customize/652/desktop.js')],
  ['653', join(root, 'customize/653/desktop.js')],
);

for (const [appId, jsPath] of steps) {
  console.log(`[deploy-budget-portal] app=${appId} ← ${jsPath}`);
  const r = spawnSync(process.execPath, [join(root, 'scripts/deploy-customization.js'), appId, jsPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: root,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}
console.log('[deploy-budget-portal] 完了');
