#!/usr/bin/env node
import {
  ANNUAL_APP_NAME,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAnnualFieldProperties,
  loadAppIds,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  let appId = state.annualAppId;
  if (!appId) {
    const found = await findAppByName(baseUrl, headers, ANNUAL_APP_NAME);
    if (!found) throw new Error('annual app not found');
    appId = Number(found.appId);
  }
  const properties = loadAnnualFieldProperties();
  const cur = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json?app=${appId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const existing = new Set(Object.keys(cur.properties || {}));
  const toAdd = {};
  Object.entries(properties).forEach(([code, def]) => {
    if (!existing.has(code)) toAdd[code] = def;
  });
  if (!Object.keys(toAdd).length) {
    console.log(`app=${appId} all fields exist`);
    saveAppIds({ ...state, annualAppId: appId });
    return;
  }
  for (const [code, def] of Object.entries(toAdd)) {
    try {
      const put = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ app: appId, properties: { [code]: def } }),
      });
      console.log(`OK ${code} rev=${put.revision}`);
    } catch (e) {
      console.error(`FAIL ${code}:`, e.message);
      process.exit(1);
    }
  }
  await deployApp(baseUrl, headers, appId);
  saveAppIds({ ...state, annualAppId: appId });
  console.log(`deploy OK app=${appId}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
