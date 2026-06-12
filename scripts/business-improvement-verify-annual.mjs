#!/usr/bin/env node
/**
 * 新⑤ 年次処理 — フィールド・集計ロジックの smoke verify
 */
import {
  ANNUAL_APP_NAME,
  fetchJson,
  findAppByName,
  getKintoneConfig,
  loadAnnualFieldProperties,
  loadAppIds,
} from './lib/business-improvement-kintone.mjs';
import { aggregateAnnual, countsMatch, fiscalYearLabel } from './lib/business-improvement-annual-aggregate.mjs';

const REQUIRED_ANNUAL = Object.keys(loadAnnualFieldProperties());
const REQUIRED_PROPOSAL = ['提案種別', '提案日', '完了日', '提案件名', '表彰ランク_最終', '付与ポイント', '提案者一覧'];

async function main() {
  const { baseUrl, headers } = getKintoneConfig();
  const ids = loadAppIds();
  let annualId = ids.annualAppId;
  if (!annualId) {
    const found = await findAppByName(baseUrl, headers, ANNUAL_APP_NAME);
    if (!found) throw new Error('annual app not found — run business-improvement:create-annual-app');
    annualId = Number(found.appId);
  }
  const proposalId = ids.proposalAppId || 700;

  const annualFields = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${annualId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });
  const proposalFields = await fetchJson(`${baseUrl}/k/v1/app/form/fields.json?app=${proposalId}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  const annualCodes = Object.keys(annualFields.properties || {});
  const proposalCodes = Object.keys(proposalFields.properties || {});

  const missingAnnual = REQUIRED_ANNUAL.filter((c) => !annualCodes.includes(c));
  const missingProposal = REQUIRED_PROPOSAL.filter((c) => !proposalCodes.includes(c));

  if (missingAnnual.length) throw new Error(`annual missing fields: ${missingAnnual.join(', ')}`);
  if (missingProposal.length) throw new Error(`proposal missing fields: ${missingProposal.join(', ')}`);

  const sample = aggregateAnnual([
    {
      $id: { value: '1' },
      ステータス: { value: '完了' },
      提案種別: { value: '業務改善提案' },
      提案日: { value: '2024-11-01' },
      完了日: { value: '2025-06-10' },
      提案件名: { value: 'テスト' },
      表彰ランク_最終: { value: 'B' },
      付与ポイント: { value: '1000' },
      提案者一覧: { value: [{ value: { 提案者所属: { value: '総務部' }, 提案者名: { value: '山田太郎' } } }] },
    },
  ], 2025, '2026-04-15');

  if (!countsMatch(sample)) throw new Error('aggregate sample counts mismatch');
  if (sample.table1.carryover.biz !== 1) throw new Error('expected carryover biz=1');

  console.log(JSON.stringify({
    ok: true,
    annualAppId: annualId,
    proposalAppId: proposalId,
    fiscalYearLabel: fiscalYearLabel(2025),
    sampleCounts: sample.counts,
  }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
