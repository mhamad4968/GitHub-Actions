/**
 * App 674: SKYSEA 手動管理フィールド追加 → グループ配置 → フィールド権限(admin) → 既存レコード未了初期化
 *
 *   npm run pc-ledger:674:skysea-manual-setup -- --dry-run
 *   npm run pc-ledger:674:skysea-manual-setup
 *   npm run pc-ledger:674:skysea-manual-setup -- --skip-bulk
 *
 * 正本: docs/plans/2026-08-06-skysea-manual-install-674-ledger-spec.md
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP = 674;
const GROUP_CODE = 'skysea_system_meta';
const MANUAL_CODES = ['skysea_manual_done', 'skysea_manual_date', 'skysea_manual_handler'];
const LEGACY_CODES = ['skysea_status', 'skysea_checked_at', 'skysea_install_log', 'skysea_target_flag'];
const ACL_CODES = [...MANUAL_CODES, ...LEGACY_CODES];
const FRAGMENT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
  'pc-ledger-674-add-skysea-manual-properties.json',
);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  const ba = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

async function api(method, apiPath, body) {
  const res = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: body ? jsonHeaders : authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${apiPath}: ${j.code || res.status} ${j.message || JSON.stringify(j)}`);
  }
  return j;
}

async function waitDeploy() {
  for (let i = 0; i < 90; i++) {
    const u = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    u.searchParams.set('apps[0]', String(APP));
    const res = await fetch(u, { headers: authHeaders });
    const j = await res.json();
    const st = res.ok && j.apps?.[0] ? j.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('deploy timeout');
}

async function deployPreview(revision) {
  await api('POST', '/k/v1/preview/app/deploy.json', {
    apps: [{ app: APP, revision: revision != null ? String(revision) : undefined }],
  });
  await waitDeploy();
}

function stripFieldsFromLayoutOutsideGroup(nodes, codes, groupCode) {
  const set = new Set(codes);
  const cells = {};
  function walk(arr, insideTargetGroup) {
    if (!Array.isArray(arr)) return;
    for (const node of arr) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'ROW' && Array.isArray(node.fields)) {
        if (!insideTargetGroup) {
          const next = [];
          for (const f of node.fields) {
            if (f && set.has(f.code)) {
              cells[f.code] = {
                type: f.type,
                code: f.code,
                size: f.size && typeof f.size === 'object' ? f.size : { width: '193' },
              };
            } else {
              next.push(f);
            }
          }
          node.fields = next;
        }
      }
      if (node.type === 'GROUP' && Array.isArray(node.layout)) {
        walk(node.layout, insideTargetGroup || node.code === groupCode);
      }
    }
  }
  walk(nodes, false);
  return cells;
}

function pruneEmptyRows(nodes) {
  if (!Array.isArray(nodes)) return nodes;
  const out = [];
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'GROUP' && Array.isArray(node.layout)) {
      node.layout = pruneEmptyRows(node.layout);
      out.push(node);
      continue;
    }
    if (node.type === 'ROW') {
      if (node.fields && node.fields.length > 0) out.push(node);
      continue;
    }
    out.push(node);
  }
  return out;
}

function findGroup(layout, code) {
  for (const node of layout || []) {
    if (node?.type === 'GROUP' && node.code === code) return node;
    if (node?.type === 'GROUP' && Array.isArray(node.layout)) {
      const nested = findGroup(node.layout, code);
      if (nested) return nested;
    }
  }
  return null;
}

function codesInGroup(groupLayout) {
  const s = new Set();
  function w(arr) {
    if (!Array.isArray(arr)) return;
    for (const node of arr) {
      if (node?.type === 'ROW' && node.fields) {
        for (const f of node.fields) if (f?.code) s.add(f.code);
      }
      if (node?.type === 'GROUP' && node.layout) w(node.layout);
    }
  }
  w(groupLayout);
  return s;
}

async function ensureFields(dryRun) {
  const raw = JSON.parse(readFileSync(FRAGMENT_PATH, 'utf8'));
  const properties = raw.properties;
  const cur = await api('GET', `/k/v1/preview/app/form/fields.json?app=${APP}`);
  const toAdd = {};
  for (const code of MANUAL_CODES) {
    if (cur.properties?.[code]) {
      console.log(`[fields] skip exists: ${code}`);
    } else {
      toAdd[code] = properties[code];
    }
  }
  if (!Object.keys(toAdd).length) {
    console.log('[fields] nothing to add');
    return cur.revision;
  }
  if (dryRun) {
    console.log('[fields] dry-run would POST', Object.keys(toAdd));
    return cur.revision;
  }
  const j = await api('POST', '/k/v1/preview/app/form/fields.json', { app: APP, properties: toAdd });
  console.log(`[fields] POST ok revision=${j.revision} codes=${Object.keys(toAdd).join(',')}`);
  return j.revision;
}

async function ensureLayout(dryRun) {
  const layoutRes = await api('GET', `/k/v1/preview/app/form/layout.json?app=${APP}`);
  const layout = layoutRes.layout;
  const group = findGroup(layout, GROUP_CODE);
  if (!group) throw new Error(`GROUP ${GROUP_CODE} not found — run skysea group setup first`);

  const cells = stripFieldsFromLayoutOutsideGroup(layout, MANUAL_CODES, GROUP_CODE);
  const fieldsMeta = await api('GET', `/k/v1/preview/app/form/fields.json?app=${APP}`);
  for (const code of MANUAL_CODES) {
    if (!cells[code] && fieldsMeta.properties?.[code]) {
      cells[code] = {
        type: fieldsMeta.properties[code].type,
        code,
        size: { width: '193' },
      };
    }
  }

  const inGroup = codesInGroup(group.layout);
  const missing = MANUAL_CODES.filter((c) => fieldsMeta.properties?.[c] && !inGroup.has(c));
  if (!missing.length) {
    const present = MANUAL_CODES.filter((c) => fieldsMeta.properties?.[c]);
    if (!present.length) {
      console.log('[layout] skip — manual fields not in properties yet');
    } else {
      console.log('[layout] manual fields already in group');
    }
    return layoutRes.revision;
  }

  if (!Array.isArray(group.layout)) group.layout = [];
  for (const code of missing) {
    const cell = cells[code] || {
      type: fieldsMeta.properties[code].type,
      code,
      size: { width: '193' },
    };
    group.layout.push({ type: 'ROW', fields: [cell] });
  }
  const nextLayout = pruneEmptyRows(layout);

  if (dryRun) {
    console.log('[layout] dry-run would move into group:', missing.join(','));
    return layoutRes.revision;
  }
  const j = await api('PUT', '/k/v1/preview/app/form/layout.json', {
    app: APP,
    layout: nextLayout,
  });
  console.log(`[layout] PUT ok revision=${j.revision} added=${missing.join(',')}`);
  return j.revision;
}

async function ensureFieldAcl(dryRun) {
  // everyone NONE を明示（PUT は当該フィールドの rights を置換するため欠落させない）
  const rights = ACL_CODES.map((code) => ({
    code,
    entities: [
      {
        accessibility: 'WRITE',
        entity: { type: 'USER', code: 'admin' },
      },
      {
        accessibility: 'NONE',
        entity: { type: 'GROUP', code: 'everyone' },
      },
    ],
  }));
  if (dryRun) {
    console.log('[acl] dry-run would PUT field acl for', ACL_CODES.join(','));
    return;
  }
  const j = await api('PUT', '/k/v1/preview/field/acl.json', { app: APP, rights });
  console.log(`[acl] PUT ok revision=${j.revision} (preview deploy included by API)`);
  await waitDeploy();
}

async function bulkInitMishoryo(dryRun) {
  const live = await api('GET', `/k/v1/app/form/fields.json?app=${APP}`);
  if (!live.properties?.skysea_manual_done) {
    console.log('[bulk] skip — skysea_manual_done not live yet (deploy form first)');
    return;
  }
  // 注意: kintone の `not in ("完了","未了")` は空 DROP_DOWN を拾わないことがある。
  // 個人・廃棄/取消除外を全件取得し、クライアント側で空だけ未了にする。
  const query = 'account_type in ("個人") and pc_status not in ("廃棄","取消")';
  let offset = 0;
  let total = 0;
  for (;;) {
    const j = await api(
      'GET',
      `/k/v1/records.json?app=${APP}&query=${encodeURIComponent(`${query} order by $id asc limit 100 offset ${offset}`)}&fields[0]=$id&fields[1]=skysea_manual_done&fields[2]=dept_name`,
    );
    const records = (j.records || []).filter((r) => {
      const v = r.skysea_manual_done && r.skysea_manual_done.value;
      return v == null || String(v).trim() === '';
    });
    if (!(j.records || []).length) break;
    if (records.length) {
      const updates = records.map((r) => ({
        id: r.$id.value,
        record: { skysea_manual_done: { value: '未了' } },
      }));
      if (dryRun) {
        console.log(`[bulk] dry-run would update ${updates.length} (offset=${offset})`);
      } else {
        await api('PUT', '/k/v1/records.json', { app: APP, records: updates });
        console.log(`[bulk] updated ${updates.length} (offset=${offset})`);
      }
      total += updates.length;
    } else {
      console.log(`[bulk] no empty at offset=${offset}`);
    }
    if ((j.records || []).length < 100) break;
    offset += 100;
  }
  console.log(`[bulk] total=${total}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipBulk = process.argv.includes('--skip-bulk');
  const skipAcl = process.argv.includes('--skip-acl');

  console.log(`[674 skysea-manual] start dryRun=${dryRun}`);

  let rev = await ensureFields(dryRun);
  rev = await ensureLayout(dryRun);

  if (!dryRun) {
    await deployPreview(rev);
    console.log('[deploy] form SUCCESS');
  } else {
    console.log('[deploy] dry-run skip');
  }

  if (!skipAcl) {
    await ensureFieldAcl(dryRun);
  } else {
    console.log('[acl] skipped');
  }

  if (!skipBulk) {
    await bulkInitMishoryo(dryRun);
  } else {
    console.log('[bulk] skipped');
  }

  console.log('[674 skysea-manual] DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
