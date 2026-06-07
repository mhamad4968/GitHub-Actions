#!/usr/bin/env node
/**
 * 700 既存レコードの評価者を dev ユーザー(admin)へ一括修正 + WF作業者同期
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/business-improvement-fix-evaluators-admin.mjs [--id=4]
 */
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/business-improvement-kintone.mjs';

function userSelect(code) {
  return { value: [{ code }] };
}

function parseIdArg() {
  const m = process.argv.find((a) => a.startsWith('--id='));
  return m ? m.split('=')[1] : null;
}

async function main() {
  const { baseUrl, headers, username: devUser } = getKintoneConfig();
  const { proposalAppId } = loadAppIds();
  const onlyId = parseIdArg();
  const query = onlyId ? `$id = ${onlyId}` : 'order by $id asc limit 50';
  const url =
    `${baseUrl}/k/v1/records.json?app=${proposalAppId}` +
    `&query=${encodeURIComponent(query)}` +
    '&fields[0]=$id&fields[1]=提案件名&fields[2]=ステータス&fields[3]=部署' +
    '&fields[4]=部長評価者&fields[5]=支店長評価者&fields[6]=人事部長評価者&fields[7]=申請者';
  const res = await fetchJson(url, { method: 'GET', headers: { ...headers, 'Content-Type': undefined } });
  const records = res.records || [];
  if (!records.length) {
    console.log('[fix-evaluators] 対象レコードなし');
    return;
  }

  for (const rec of records) {
    const id = rec.$id.value;
    const patch = {
      部長評価者: userSelect(devUser),
      支店長評価者: userSelect(devUser),
      人事部長評価者: userSelect(devUser),
    };
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: String(proposalAppId), id, record: patch }),
    });
    console.log('[fix-evaluators] 700 #' + id, '評価者 ->', devUser, '|', rec['提案件名']?.value);

    try {
      await fetchJson(`${baseUrl}/k/v1/record/assignees.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          app: String(proposalAppId),
          id: String(id),
          assignees: [devUser],
        }),
      });
      console.log('[fix-evaluators] 700 #' + id, 'WF作業者 ->', devUser);
    } catch (e) {
      console.warn('[fix-evaluators] 700 #' + id, '作業者更新スキップ:', e.message.split('\n')[0]);
    }
  }

  console.log(JSON.stringify({ fixed: records.length, devUser, proposalAppId }, null, 2));
}

main().catch((e) => {
  console.error('[fix-evaluators] NG', e.message);
  process.exit(1);
});
