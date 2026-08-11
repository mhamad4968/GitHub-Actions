/**
 * App 674: `latest_inventory_date` だけを `internal_system_meta` グループ内へ移す（他レイアウトは維持）。
 *
 *   npm run pc-ledger:674:move-latest-inv-internal -- --dry-run
 *   npm run pc-ledger:674:move-latest-inv-internal
 */
import 'dotenv/config';

const APP = 674;
const GROUP_CODE = 'internal_system_meta';
const TARGET = 'latest_inventory_date';

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

function findFieldCell(nodes, code, out = { cell: null, inGroup: false }) {
  if (!Array.isArray(nodes)) return out;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'ROW' && Array.isArray(node.fields)) {
      for (const f of node.fields) {
        if (f && f.code === code) {
          out.cell = {
            type: f.type,
            code: f.code,
            size: f.size && typeof f.size === 'object' ? f.size : { width: '193' },
          };
        }
      }
    }
    if (node.type === 'GROUP' && Array.isArray(node.layout)) {
      const before = out.cell;
      findFieldCell(node.layout, code, out);
      if (!before && out.cell && node.code === GROUP_CODE) out.inGroup = true;
    }
  }
  return out;
}

function stripCode(nodes, code) {
  if (!Array.isArray(nodes)) return nodes;
  const out = [];
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'GROUP' && Array.isArray(node.layout)) {
      node.layout = stripCode(node.layout, code);
      out.push(node);
      continue;
    }
    if (node.type === 'ROW' && Array.isArray(node.fields)) {
      node.fields = node.fields.filter((f) => !(f && f.code === code));
      if (node.fields.length) out.push(node);
      continue;
    }
    out.push(node);
  }
  return out;
}

function findGroup(nodes, code) {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node?.type === 'GROUP' && node.code === code) return node;
  }
  return null;
}

function groupHasCode(groupNode, code) {
  if (!groupNode || !Array.isArray(groupNode.layout)) return false;
  const found = findFieldCell(groupNode.layout, code);
  return !!found.cell;
}

async function getPreviewLayout() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, {
    headers: authHeaders,
  });
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
  const group = findGroup(layout, GROUP_CODE);
  if (!group) throw new Error(`GROUP ${GROUP_CODE} がレイアウトにありません`);

  if (groupHasCode(group, TARGET)) {
    console.log(`674: "${TARGET}" は既に "${GROUP_CODE}" 内。スキップ。`);
    return;
  }

  const found = findFieldCell(layout, TARGET);
  if (!found.cell) throw new Error(`674: レイアウトに "${TARGET}" が見つかりません`);

  let next = stripCode(layout, TARGET);
  const g2 = findGroup(next, GROUP_CODE);
  if (!g2) throw new Error('strip 後に GROUP が消えています');
  if (!Array.isArray(g2.layout)) g2.layout = [];
  g2.layout.push({ type: 'ROW', fields: [found.cell] });

  if (dryRun) {
    console.log(JSON.stringify({ moved: TARGET, into: GROUP_CODE, cell: found.cell }, null, 2));
    console.error('[674] dry-run: PUT していません');
    return;
  }

  const rev = await putPreviewLayout(lay.revision, next);
  await deployPreview(rev);
  await waitDeploy();
  console.log(
    `674: "${TARGET}" → "${GROUP_CODE}" へ移動 + deploy SUCCESS revision=${rev}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
