#!/usr/bin/env node
/**
 * システム推進室ポータル — 設定レコード seed（§3 初回一覧）
 */
import {
  fetchJson,
  getKintoneConfig,
  loadAppIds,
  loadSeedRows,
  saveAppIds,
} from './lib/space48-portal-kintone.mjs';

const TAB_KINTONE = {
  bi: '業務改善提案',
  ledger: '台帳',
  ops: '運用',
  info: '情報',
  other: 'その他',
};

const LINK_TYPE_KINTONE = {
  app: 'アプリ',
  space: 'スペース',
  external: 'URL',
  url: 'URL',
};

function linkRow(row) {
  const activeVal = row.active ? ['有効'] : [];
  const appId = row.app_id != null && row.app_id !== '' ? String(row.app_id) : '';
  return {
    value: {
      portal_tab: { value: TAB_KINTONE[row.tab] || row.tab },
      title: { value: row.title },
      description: { value: row.description || '' },
      link_type: { value: LINK_TYPE_KINTONE[row.link_type] || row.link_type },
      app_id: { value: appId },
      link_url: { value: row.url || '' },
      sort_no: { value: String(row.sort_no != null ? row.sort_no : 0) },
      active: { value: activeVal },
    },
  };
}

async function main() {
  const force = process.argv.includes('--force');
  const { baseUrl, headers } = getKintoneConfig();
  const state = loadAppIds();
  const appId = state.portalAppId;
  if (!appId) {
    console.error('portalAppId missing. Run space48-portal:create-app first.');
    process.exit(1);
  }

  const q = encodeURIComponent('record_kind in ("共通設定")');
  const existing = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}`, {
    method: 'GET',
    headers: { ...headers, 'Content-Type': undefined },
  });

  if ((existing.records || []).length > 0 && !force) {
    console.log(`設定レコード既存: id=${existing.records[0].$id.value} — skip`);
    return;
  }

  const links = loadSeedRows();
  const record = {
    record_kind: { value: '共通設定' },
    portal_links: { value: links.map(linkRow) },
  };

  const res = await fetchJson(`${baseUrl}/k/v1/record.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, record }),
  });
  console.log(`設定レコード作成 id=${res.id} links=${links.length}`);
  saveAppIds({ ...state, portalAppId: appId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
