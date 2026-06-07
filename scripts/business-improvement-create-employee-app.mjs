#!/usr/bin/env node
/**
 * 業務改善 — 新② 社員マスタアプリ作成（Space 5 / thread 7）
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EMPLOYEE_APP_NAME,
  SPACE_ID,
  THREAD_ID,
  deployApp,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAppIds,
  restrictAppToDevUser,
  saveAppIds,
} from './lib/business-improvement-kintone.mjs';

const FIELDS_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'business-improvement-employee-fields.json');

function loadEmployeeFieldProperties() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  if (!raw.properties) throw new Error('business-improvement-employee-fields.json: missing properties');
  return raw.properties;
}

async function setAppSettings(baseUrl, headers, appId, name) {
  const body = {
    app: String(appId),
    name,
    description: '業務改善 ver.02 社員マスタ（595ミラー・編集不可想定）。日次 sync: business-improvement:sync-595',
    theme: 'WHITE',
  };
  const j = await fetchJson(`${baseUrl}/k/v1/preview/app/settings.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return j.revision;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipAcl = process.argv.includes('--skip-acl');
  const { baseUrl, headers, username } = getKintoneConfig();
  const properties = loadEmployeeFieldProperties();
  const state = loadAppIds();

  const existing = await findAppByName(baseUrl, headers, EMPLOYEE_APP_NAME);
  if (existing) {
    const appId = Number(existing.appId);
    console.log(`既存 社員マスタ: appId=${appId} URL=${baseUrl}/k/${appId}/`);
    saveAppIds({ ...state, employeeAppId: appId });
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ name: EMPLOYEE_APP_NAME, space: SPACE_ID, thread: THREAD_ID, fieldCount: 4 }, null, 2));
    return;
  }

  console.log(`作成開始: "${EMPLOYEE_APP_NAME}" space=${SPACE_ID} thread=${THREAD_ID}`);

  const add = await fetchJson(`${baseUrl}/k/v1/preview/app.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: EMPLOYEE_APP_NAME, space: SPACE_ID, thread: THREAD_ID }),
  });
  const appId = Number(add.app);
  console.log(`app=${appId} revision=${add.revision}`);

  await deployApp(baseUrl, headers, appId);

  const fieldsRes = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`フィールド追加 revision=${fieldsRes.revision}`);

  const settingsRev = await setAppSettings(baseUrl, headers, appId, EMPLOYEE_APP_NAME);
  await deployApp(baseUrl, headers, appId, settingsRev);

  if (!skipAcl) {
    await restrictAppToDevUser(baseUrl, headers, appId, username);
    console.log(`ACL: dev-only (${username})`);
  }

  console.log(`APP_ID=${appId}`);
  console.log(`URL=${baseUrl}/k/${appId}/`);
  saveAppIds({ ...state, employeeAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
