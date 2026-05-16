/**
 * App 674: ルートレイアウト上の入力フィールドを、標準フィールドグループ 3 つへ収容する。
 *
 * 前提: `pc-ledger-674-add-ux-section-groups-preview` 済み（properties に GROUP 3 件）。
 * internal_system_meta / skysea_system_meta 内のフィールドは触れない（ルートのみ strip）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-674-ux-section-groups-layout.mjs -- --dry-run
 *   npm run pc-ledger:674:layout-ux-section-groups
 *
 * 移動後、グループはフォーム末尾に並びます。必要なら kintone フォーム設定でドラッグして先頭へ移動してください。
 */
import 'dotenv/config';

const APP = 674;

/** 末尾に並べる順（識別 → アカウント → 機器） */
const GROUP_ORDER = ['pc_ledger_g_identity', 'pc_ledger_g_account', 'pc_ledger_g_hardware'];

/** 各グループに入れるフィールド（上から 1 行 1 フィールドで配置） */
const LAYOUT_FIELD_ORDER = {
  pc_ledger_g_identity: [
    'pc_name',
    'shared_terminal_name',
    'account_type',
    'pc_status',
    'user_name',
    'dept_name',
    'group_name',
    'purchase_date',
    'purchase_amount',
    'purchase_vendor',
    'purchase_vendor_other',
    'latest_inventory_date',
  ],
  pc_ledger_g_account: [
    'windows_name',
    'logon_name',
    'logon_pw',
    'mail',
    'mail_acct',
    'mail_pw',
    'm365_id',
    'm365_pw',
    'gb_id',
    'gb_pw',
    'sb_id',
    'sb_pw',
    'emp_id',
    'm365_master_record_id',
    'vpn_id',
    'vpn_pw',
  ],
  pc_ledger_g_hardware: [
    'serial',
    'extra_info_1',
    'extra_info_2',
    'fixed_ip_1',
    'fixed_ip_2',
    'manufacturer',
    'manufacturing_no',
    'model_name',
    'note',
  ],
};

const ALL_FIELD_CODES = Array.from(
  new Set(GROUP_ORDER.flatMap((g) => LAYOUT_FIELD_ORDER[g] || [])),
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

function collectCodesInGroupLayout(groupLayout) {
  const s = new Set();
  function w(arr) {
    if (!Array.isArray(arr)) return;
    for (const node of arr) {
      if (node?.type === 'ROW' && node.fields) {
        for (const f of node.fields) {
          if (f?.code) s.add(f.code);
        }
      }
      if (node?.type === 'GROUP' && node.layout) w(node.layout);
    }
  }
  w(groupLayout);
  return s;
}

function findGroupNode(nodes, code) {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node?.type === 'GROUP' && node.code === code) return node;
  }
  return null;
}

function identityGroupLooksMigrated(layout) {
  const g = findGroupNode(layout, 'pc_ledger_g_identity');
  if (!g || !Array.isArray(g.layout)) return false;
  return collectCodesInGroupLayout(g.layout).has('pc_name');
}

function removeUxGroupsFromRoot(layout, codesSet) {
  if (!Array.isArray(layout)) return [];
  return layout.filter((n) => !(n?.type === 'GROUP' && codesSet.has(n.code)));
}

/** ルート直下の ROW のみから対象コードを抜く（他グループ内は触れない） */
function stripFromRootOnly(layout, codes) {
  const set = new Set(codes);
  const cells = {};
  let changed = false;
  if (!Array.isArray(layout)) return { cells, changed };
  for (const node of layout) {
    if (node?.type === 'ROW' && Array.isArray(node.fields)) {
      const next = [];
      for (const f of node.fields) {
        if (f && set.has(f.code)) {
          cells[f.code] = {
            type: f.type,
            code: f.code,
            size: f.size && typeof f.size === 'object' ? f.size : { width: '193' },
          };
          changed = true;
        } else {
          next.push(f);
        }
      }
      node.fields = next;
    }
  }
  return { cells, changed };
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

function buildInnerRows(orderedCodes, cells) {
  const rows = [];
  for (const code of orderedCodes) {
    if (!cells[code]) continue;
    rows.push({ type: 'ROW', fields: [cells[code]] });
  }
  return rows;
}

async function getPreviewLayout() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET preview layout: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT preview layout: ${j.code} ${j.message}`);
  return j.revision;
}

async function deployPreview(revision) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ apps: [{ app: APP, revision }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`deploy: ${j.code} ${j.message}`);
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

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const lay = await getPreviewLayout();
  const layout = JSON.parse(JSON.stringify(lay.layout));

  if (identityGroupLooksMigrated(layout)) {
    console.log('674: pc_ledger_g_identity 内に pc_name あり。既に UX グループ移動済みとみなしスキップ。');
    return;
  }

  const uxSet = new Set(GROUP_ORDER);
  let L = removeUxGroupsFromRoot(layout, uxSet);
  const { cells, changed } = stripFromRootOnly(L, ALL_FIELD_CODES);

  if (!changed) {
    throw new Error(
      '674: ルートから対象フィールドを 1 件も抜けませんでした。フィールドコードが違うか、既に別グループ内のみにあります。',
    );
  }

  const missing = ALL_FIELD_CODES.filter((c) => !cells[c]);
  if (missing.length) {
    console.warn(`674: ルートに無かったためスキップしたコード（${missing.length} 件）: ${missing.join(', ')}`);
  }

  const blocks = GROUP_ORDER.map((code) => ({
    type: 'GROUP',
    code,
    layout: buildInnerRows(LAYOUT_FIELD_ORDER[code] || [], cells),
  }));

  for (const b of blocks) {
    if (!b.layout.length) {
      console.warn(`674: 警告: グループ "${b.code}" に入れるフィールドが 0 件でした。`);
    }
  }

  const pruned = pruneEmptyRows(L);
  const newLayout = pruned.concat(blocks);

  if (dryRun) {
    console.log(JSON.stringify({ layout: newLayout }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  const rev = await putPreviewLayout(lay.revision, newLayout);
  await deployPreview(rev);
  await waitDeploy();
  console.log(`674: UX セクション 3 グループへ移動 + preview deploy SUCCESS revision=${rev}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
