#!/usr/bin/env node
/** Phase 3 検証 — 新③ ご利用ガイド */
import { fetchJson, getKintoneConfig, loadAppIds, GUIDE_APP_NAME } from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const { guideAppId, settingsAppId, employeeAppId } = loadAppIds();
  if (!guideAppId) throw new Error('guideAppId missing — run business-improvement:create-guide-app');

  const appUrl = `${baseUrl}/k/v1/app.json?id=${guideAppId}`;
  const app = await fetchJson(appUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });

  const custUrl = `${baseUrl}/k/v1/preview/app/customize.json?app=${guideAppId}`;
  const cust = await fetchJson(custUrl, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const desktop = (cust.desktop || {}).js || [];
  const hasJs = desktop.some((u) => String(u).includes('business-improvement-guide') || String(u).includes('desktop.js'));

  console.log(
    JSON.stringify(
      {
        guideAppId,
        settingsAppId,
        employeeAppId,
        name: app.name,
        expectedName: GUIDE_APP_NAME,
        customizeDesktopJsCount: desktop.length,
        customizeHasGuideJs: hasJs,
        url: `${baseUrl}/k/${guideAppId}/`,
      },
      null,
      2,
    ),
  );

  if (app.name !== GUIDE_APP_NAME) throw new Error(`app name mismatch: ${app.name}`);
  if (!hasJs && desktop.length === 0) {
    console.warn('[verify] customize JS not deployed yet — run deploy:guide after create');
  }
  console.log('[verify] Phase3 guide app OK');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
