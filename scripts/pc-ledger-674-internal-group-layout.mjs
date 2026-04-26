/**
 * App 674: 内部メタ 5 フィールドを kintone 標準フィールドグループ `internal_system_meta` 内へ移動する。
 *
 * 前提: `properties` に GROUP `internal_system_meta` が既に存在（add-form-fields 済み）。
 *
 *   npm run pc-ledger:674:layout-internal-group -- --dry-run
 *   npm run pc-ledger:674:layout-internal-group
 *
 * プレビュー layout を PUT し、**preview deploy** まで実行（651 手順と同型）。
 */
import 'dotenv/config';

const APP = 674;
const GROUP_CODE = 'internal_system_meta';
const CHILD_CODES = [
  'pc_serial_no',
  'import_source',
  'legacy_pc_name_594',
  'legacy_record_id_594',
  'created_at_jst',
];

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

function stripFieldsFromLayout(nodes, codes) {
  const set = new Set(codes);
  const cells = {};
  let changed = false;

  function walk(arr) {
    if (!Array.isArray(arr)) return;
    for (const node of arr) {
      if (!node || typeof node !== 'object') continue;
      if (node.type === 'ROW' && Array.isArray(node.fields)) {
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
      if (node.type === 'GROUP' && Array.isArray(node.layout)) {
        walk(node.layout);
      }
    }
  }

  walk(nodes);
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

function findOurGroupNode(nodes) {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node?.type === 'GROUP' && node.code === GROUP_CODE) return node;
  }
  return null;
}

function groupLayoutIsComplete(groupNode) {
  if (!groupNode || !Array.isArray(groupNode.layout)) return false;
  const s = collectCodesInGroupLayout(groupNode.layout);
  return CHILD_CODES.every((c) => s.has(c));
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
  const existing = findOurGroupNode(layout);

  if (existing && groupLayoutIsComplete(existing)) {
    console.log(`674: "${GROUP_CODE}" 内に内部メタ 5 件が既に配置済み。スキップ。`);
    return;
  }

  const { cells, changed } = stripFieldsFromLayout(layout, CHILD_CODES);
  if (!changed) {
    throw new Error(
      `674: レイアウトから内部メタを抜けませんでした（未配置または既に別 GROUP 内のみ等）。`
    );
  }
  for (const code of CHILD_CODES) {
    if (!cells[code]) throw new Error(`674: フィールド "${code}" がレイアウトに見つかりません。`);
  }

  const innerRows = CHILD_CODES.map((code) => ({
    type: 'ROW',
    fields: [cells[code]],
  }));

  let newLayout;
  if (existing && !groupLayoutIsComplete(existing)) {
    existing.layout = innerRows;
    newLayout = pruneEmptyRows(layout);
  } else {
    const groupBlock = {
      type: 'GROUP',
      code: GROUP_CODE,
      layout: innerRows,
    };
    const pruned = pruneEmptyRows(layout);
    newLayout = pruned.concat([groupBlock]);
  }

  if (dryRun) {
    console.log(JSON.stringify({ layout: newLayout }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  const rev = await putPreviewLayout(lay.revision, newLayout);
  await deployPreview(rev);
  await waitDeploy();
  console.log(`674: preview layout 更新 + deploy SUCCESS（GROUP "${GROUP_CODE}" 内に 5 フィールドを収容）revision=${rev}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
