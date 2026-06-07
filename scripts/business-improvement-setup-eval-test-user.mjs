#!/usr/bin/env node
/**
 * 業務改善 — dev アカウントを評価者としてテスト設定（697 + 700）
 * Usage: npx dotenv -e .env -e .env.proxy -- node scripts/business-improvement-setup-eval-test-user.mjs
 */
import { getKintoneConfig, fetchJson, loadAppIds } from './lib/business-improvement-kintone.mjs';

const TEST_DEPT = process.env.BI_TEST_DEPT || '【WFテスト】開発検証用';
const TEST_TITLE = '[評価UIテスト] admin評価確認用';

function userSelect(code) {
  return { value: [{ code }] };
}

function buildEvaluators(devUser) {
  return {
    部長評価者: userSelect(devUser),
    支店長評価者: userSelect(devUser),
    人事部長評価者: userSelect(devUser),
  };
}

async function advanceToManager(baseUrl, headers, appId, id) {
  await fetchJson(`${baseUrl}/k/v1/record/status.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ app: String(appId), id: String(id), action: 'Apply' }),
  });
}

async function createTestProposal(baseUrl, headers, appId, devUser, testDept) {
  const created = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      app: String(appId),
      record: {
        部署: { value: testDept },
        社員名: { value: 'テスト太郎' },
        提案種別: { value: '業務改善提案' },
        提案件名: { value: TEST_TITLE },
        目的: { value: '評価UI確認用（自動作成）' },
        現状: { value: 'テスト' },
        問題点: { value: 'テスト' },
        改善案: { value: 'テスト' },
        効果: { value: 'テスト' },
        提案者一覧: {
          value: [{
            value: {
              提案者所属: { value: testDept },
              提案者名: { value: 'テスト太郎' },
            },
          }],
        },
        ...buildEvaluators(devUser),
      },
    }),
  });
  const id = created.id;
  await advanceToManager(baseUrl, headers, appId, id);
  return id;
}

async function main() {
  const { baseUrl, headers, username: devUser } = getKintoneConfig();
  const { settingsAppId, proposalAppId } = loadAppIds();
  console.log('[setup-eval-test] devUser=', devUser);

  const commonRes = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${settingsAppId}&query=${encodeURIComponent('order by $id asc limit 500')}&fields[0]=record_kind&fields[1]=dept_name&fields[2]=manager_login&fields[3]=branch_manager_login&fields[4]=hr_director_login&fields[5]=$id`,
    { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
  );
  const common = (commonRes.records || []).find((r) => r.record_kind?.value === '共通設定');
  if (!common) throw new Error('697 共通設定レコードが見つかりません');

  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(settingsAppId),
      id: common.$id.value,
      record: { hr_director_login: { value: devUser } },
    }),
  });
  console.log('[setup-eval-test] 697 hr_director_login ->', devUser);

  const deptRow =
    (commonRes.records || []).find((r) => r.record_kind?.value === '所属行' && r.dept_name?.value === TEST_DEPT) ||
    (commonRes.records || []).find((r) => r.record_kind?.value === '所属行');
  if (!deptRow) throw new Error('697 所属行がありません');
  if (deptRow.dept_name?.value !== TEST_DEPT) {
    console.log('[setup-eval-test] WARN: テスト部署未検出。先頭所属行を使用:', deptRow.dept_name?.value);
  }
  const testDept = deptRow.dept_name.value;

  await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      app: String(settingsAppId),
      id: deptRow.$id.value,
      record: {
        manager_login: { value: devUser },
        branch_manager_login: { value: devUser },
      },
    }),
  });
  console.log('[setup-eval-test] 697 所属行', testDept, '-> manager/branch =', devUser);

  let proposals = await fetchJson(
    `${baseUrl}/k/v1/records.json?app=${proposalAppId}&query=${encodeURIComponent('order by $id desc limit 10')}&fields[0]=$id&fields[1]=部署&fields[2]=ステータス&fields[3]=提案件名&fields[4]=部長評価者&fields[5]=支店長評価者&fields[6]=人事部長評価者`,
    { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
  );
  let records = proposals.records || [];

  if (!records.length || process.argv.includes('--fresh-record')) {
    const id = await createTestProposal(baseUrl, headers, proposalAppId, devUser, testDept);
    console.log('[setup-eval-test] 700 テストレコード作成 + Mgr:', id);
    proposals = await fetchJson(
      `${baseUrl}/k/v1/records.json?app=${proposalAppId}&query=${encodeURIComponent(`$id = ${id}`)}&fields[0]=$id&fields[1]=部署&fields[2]=ステータス&fields[3]=提案件名`,
      { method: 'GET', headers: { ...headers, 'Content-Type': undefined } },
    );
    records = proposals.records || [];
  } else {
    for (const rec of records) {
      const id = rec.$id.value;
      const patch = { ...buildEvaluators(devUser) };
      if (!rec['部署']?.value) patch['部署'] = { value: testDept };
      await fetchJson(`${baseUrl}/k/v1/record.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ app: String(proposalAppId), id, record: patch }),
      });
      if (rec['ステータス']?.value === 'Draft' || rec['ステータス']?.value === 'unprocessed') {
        await advanceToManager(baseUrl, headers, proposalAppId, id);
        console.log('[setup-eval-test] Draft -> Mgr:', id);
      }
    }
    console.log('[setup-eval-test] 700 直近', records.length, '件に評価者設定');
  }

  const sample = records[0];
  const recordId = sample.$id.value;
  const editUrl = `${baseUrl}/k/${proposalAppId}/show#record=${recordId}&mode=edit`;

  console.log(JSON.stringify({
    devUser,
    testDept,
    sampleRecordId: recordId,
    sampleStatus: sample['ステータス']?.value,
    sampleTitle: sample['提案件名']?.value,
    steps: [
      `${baseUrl}/k/${proposalAppId}/ に admin でログイン`,
      `レコード ${recordId} を開き「編集」をクリック`,
      '茶色の評価UIが表示されることを確認',
    ],
    editUrl,
  }, null, 2));
}

main().catch((e) => {
  console.error('[setup-eval-test] NG', e.message);
  process.exit(1);
});
