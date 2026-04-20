/**
 * 651 予算: 摘要・明細・突合キーをフォーム最下部へ移動（フィールド定義・コードは変更しない）。
 *
 *   npm run budget:651-move-summary-bottom
 */
import 'dotenv/config';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
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

const APP = 651;
/** 下にまとめて置く順（上からこの順で並ぶ） */
const BOTTOM_ORDER = ['summary', 'summary_detail', 'matching_key'];

/**
 * レイアウトツリーから対象フィールドのセルを抜き取る（ROW / GROUP を再帰）。
 * @returns {{ cells: Record<string, object>, changed: boolean }}
 */
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
      const inner = pruneEmptyRows(node.layout);
      node.layout = inner;
      out.push(node);
      continue;
    }
    if (node.type === 'ROW') {
      if (node.fields && node.fields.length > 0) {
        out.push(node);
      }
      continue;
    }
    out.push(node);
  }
  return out;
}

function layoutEndsWithSummaryBlock(layout) {
  const codes = [...BOTTOM_ORDER].reverse();
  let need = [...codes];
  for (let i = layout.length - 1; i >= 0 && need.length; i--) {
    const row = layout[i];
    if (row?.type !== 'ROW' || !row.fields?.length) continue;
    if (row.fields.length !== 1) return false;
    const c = row.fields[0].code;
    if (c !== need[0]) return false;
    need.shift();
  }
  return need.length === 0;
}

async function getPreviewLayout() {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json?app=${APP}`, { headers: authHeaders });
  const j = await res.json();
  if (!res.ok) throw new Error(`GET layout: ${j.code} ${j.message}`);
  return j;
}

async function putPreviewLayout(revision, layout) {
  const res = await fetch(`${baseUrl}/k/v1/preview/app/form/layout.json`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ app: APP, revision, layout }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PUT layout: ${j.code} ${j.message}`);
  return j.revision;
}

async function deploy(revision) {
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
  const lay = await getPreviewLayout();
  const layout = JSON.parse(JSON.stringify(lay.layout));

  if (layoutEndsWithSummaryBlock(layout)) {
    console.log('651: summary / summary_detail / matching_key は既にフォーム末尾の 3 行です。スキップ。');
    await deploy(lay.revision);
    await waitDeploy();
    return;
  }

  const { cells, changed } = stripFieldsFromLayout(layout, BOTTOM_ORDER);
  if (!changed) {
    throw new Error('651: 対象フィールドをレイアウトから見つけられませんでした（GROUP 内のみ等）。');
  }

  for (const code of BOTTOM_ORDER) {
    if (!cells[code]) {
      throw new Error(`651: フィールド "${code}" がレイアウトにありません。`);
    }
  }

  const tailRows = BOTTOM_ORDER.map((code) => ({
    type: 'ROW',
    fields: [cells[code]],
  }));

  const pruned = pruneEmptyRows(layout);
  const newLayout = pruned.concat(tailRows);

  const rev = await putPreviewLayout(lay.revision, newLayout);
  await deploy(rev);
  await waitDeploy();
  console.log('651: 摘要・明細・突合キーをフォーム最下部へ移動しました。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
