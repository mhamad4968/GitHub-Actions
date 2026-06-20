#!/usr/bin/env node
/**
 * VPN DB app 733 — vpn_domain ドロップダウン追加（3ドメイン統合 v1.1）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  FIELDS_PATH,
  VPN_DOMAIN_LIST,
  deployApp,
  fetchJson,
  getKintoneConfig,
  loadAppIds,
} from './lib/vpn-account-kintone.mjs';

function buildDomainOptions() {
  const options = {};
  VPN_DOMAIN_LIST.forEach((d, i) => {
    options[d] = { label: d, index: String(i) };
  });
  return options;
}

function patchFieldsJson() {
  const raw = JSON.parse(readFileSync(FIELDS_PATH, 'utf8'));
  raw.properties.vpn_domain = {
    type: 'DROP_DOWN',
    code: 'vpn_domain',
    label: 'VPNドメイン',
    required: false,
    noLabel: false,
    defaultValue: '',
    options: buildDomainOptions(),
  };
  writeFileSync(FIELDS_PATH, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  patchFieldsJson();
  console.log('vpn-account-db-fields.json updated (vpn_domain)');

  const appId = loadAppIds().dbAppId;
  if (!appId) {
    console.error('dbAppId missing — run vpn-account:setup first');
    process.exit(1);
  }

  const properties = {
    vpn_domain: {
      type: 'DROP_DOWN',
      code: 'vpn_domain',
      label: 'VPNドメイン',
      options: buildDomainOptions(),
    },
  };

  if (dryRun) {
    console.log(JSON.stringify({ appId, properties }, null, 2));
    return;
  }

  const { baseUrl, headers } = getKintoneConfig();
  const res = await fetchJson(`${baseUrl}/k/v1/preview/app/form/fields.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app: appId, properties }),
  });
  console.log(`kintone fields revision=${res.revision}`);
  await deployApp(baseUrl, headers, appId, res.revision);
  console.log(`deploy OK app=${appId}`);
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
