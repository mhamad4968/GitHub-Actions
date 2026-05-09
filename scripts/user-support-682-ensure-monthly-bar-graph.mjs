#!/usr/bin/env node
/**
 * App 682: §5.1 相当の集計グラフ（**縦棒 COLUMN**・`day_total` SUM・`record_date` **MONTH**）を
 * **該当月＝Asia/Tokyo の今月**・**先頭＝今月の 6 暦月前の 1 日**〜**今月末**の filter で維持し、preview deploy まで行う。
 * 既存グラフは GET した内容をマージ（**省略すると削除**される API 仕様のため、対象キー以外は全件再送）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user-support-682-ensure-monthly-bar-graph.mjs --dry-run
 *   npm run cio:preflight:682 -- --note "682 graph COLUMN 7mo" && npm run 682:graph-monthly
 *   CI: 同一ジョブで preflight のあと `npm run 682:graph-monthly:scheduled`（`.github/workflows/682-graph-monthly-refresh.yml`）
 */
import 'dotenv/config';

const APP = 682;
const GRAPH_KEY = '682_day_total_monthly';
const FC_DATE = 'record_date';
const FC_TOTAL = 'day_total';

function requireEnv(k) {
  const v = process.env[k];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${k}`);
  return String(v).trim();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** JST 暦の「今月」 */
function jstNowYearMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parseInt(
    parts.find(function (p) {
      return p.type === 'year';
    }).value,
    10,
  );
  const mo = parseInt(
    parts.find(function (p) {
      return p.type === 'month';
    }).value,
    10,
  );
  return { y: y, m: mo };
}

function addMonthsCal(year, month1to12, delta) {
  const idx = year * 12 + month1to12 - 1 + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

/**
 * 該当月＝JST 今月。範囲＝その月の **6 暦月前** の月初 〜 **今月** の月末（月次グループでは最大 **7 本**の棒が立つ想定）。
 */
function rollingRecordDateFilterCond() {
  const endYm = jstNowYearMonth();
  const startYm = addMonthsCal(endYm.y, endYm.m, -6);
  const from = startYm.y + '-' + pad2(startYm.m) + '-01';
  const dim = daysInMonth(endYm.y, endYm.m);
  const to = endYm.y + '-' + pad2(endYm.m) + '-' + pad2(dim);
  return 'record_date >= "' + from + '" and record_date <= "' + to + '"';
}

function buildAuthHeaders() {
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    headers.Authorization = `Basic ${Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64')}`;
  }
  return headers;
}

function jsonHeaders() {
  return { ...buildAuthHeaders(), 'Content-Type': 'application/json' };
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');

async function fetchJson(method, path, query, body) {
  const u = new URL(`${baseUrl}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      u.searchParams.set(k, String(v));
    }
  }
  const opt = { method, headers: body ? jsonHeaders() : buildAuthHeaders() };
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(u, opt);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 500);
    throw new Error(`HTTP ${res.status} ${path} ${msg}`);
  }
  return json;
}

function isUpToDate(r, desiredFilter) {
  if (!r || r.chartType !== 'COLUMN') return false;
  if (r.chartMode !== 'NORMAL') return false;
  if (!Array.isArray(r.groups) || r.groups.length !== 1) return false;
  const g = r.groups[0];
  if (g.code !== FC_DATE || g.per !== 'MONTH') return false;
  if (!Array.isArray(r.aggregations) || r.aggregations.length !== 1) return false;
  const a = r.aggregations[0];
  if (a.type !== 'SUM' || a.code !== FC_TOTAL) return false;
  const fc = r.filterCond != null ? String(r.filterCond).trim() : '';
  return fc === desiredFilter;
}

function stripReportForPut(r) {
  const o = {
    chartType: r.chartType,
    name: r.name,
    index: String(r.index),
  };
  if (r.chartMode != null) o.chartMode = r.chartMode;
  if (Array.isArray(r.groups)) o.groups = r.groups;
  if (Array.isArray(r.aggregations)) o.aggregations = r.aggregations;
  o.filterCond = r.filterCond != null && r.filterCond !== '' ? r.filterCond : '';
  if (Array.isArray(r.sorts)) o.sorts = r.sorts;
  if (Object.prototype.hasOwnProperty.call(r, 'periodicReport')) {
    o.periodicReport = r.periodicReport;
  }
  return o;
}

function buildNewGraph(prevReports, desiredFilter) {
  let indexStr;
  if (prevReports[GRAPH_KEY] != null && prevReports[GRAPH_KEY].index != null) {
    indexStr = String(prevReports[GRAPH_KEY].index);
  } else {
    let maxIdx = -1;
    for (const k of Object.keys(prevReports)) {
      const n = parseInt(String(prevReports[k].index), 10);
      if (Number.isFinite(n) && n > maxIdx) maxIdx = n;
    }
    indexStr = String(maxIdx + 1);
  }
  return {
    chartType: 'COLUMN',
    chartMode: 'NORMAL',
    name: GRAPH_KEY,
    index: indexStr,
    groups: [{ code: FC_DATE, per: 'MONTH' }],
    aggregations: [{ type: 'SUM', code: FC_TOTAL }],
    filterCond: desiredFilter,
    sorts: [{ by: 'GROUP1', order: 'ASC' }],
    periodicReport: null,
  };
}

async function waitDeploy(headers) {
  for (let i = 0; i < 90; i += 1) {
    const stUrl = new URL(`${baseUrl}/k/v1/preview/app/deploy.json`);
    stUrl.searchParams.set('apps[0]', String(APP));
    const stRes = await fetch(stUrl, { headers });
    const stJson = await stRes.json();
    const st = stRes.ok && stJson.apps?.[0] ? stJson.apps[0].status : null;
    if (st === 'SUCCESS') return;
    if (st === 'FAIL' || st === 'CANCEL') throw new Error(`deploy status ${st}`);
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error('deploy timeout');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const h = buildAuthHeaders();
  const desiredFilter = rollingRecordDateFilterCond();

  const live = await fetchJson('GET', '/k/v1/app/reports.json', { app: APP, lang: 'ja' }, null);
  const reports = live.reports && typeof live.reports === 'object' ? live.reports : {};
  const existing = reports[GRAPH_KEY];
  if (existing && isUpToDate(existing, desiredFilter)) {
    console.log(`[682-graph] 既に最新（COLUMN・7 暦月 filter）: key=${GRAPH_KEY} id=${existing.id || ''}`);
    console.log(`[682-graph] filter=${desiredFilter}`);
    return;
  }

  if (dryRun) {
    const preview = await fetchJson('GET', '/k/v1/preview/app/reports.json', { app: APP, lang: 'ja' }, null);
    const prevReports =
      preview.reports && typeof preview.reports === 'object' ? preview.reports : reports;
    const would = buildNewGraph(prevReports, desiredFilter);
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          rollingFilter: desiredFilter,
          anchorNote: '該当月=JST 今月、先頭=今月の 6 暦月前の 1 日',
          existingKeys: Object.keys(prevReports),
          wouldSet: { [GRAPH_KEY]: would },
        },
        null,
        2,
      ),
    );
    console.error('[682-graph] dry-run: PUT していません');
    return;
  }

  const preview = await fetchJson('GET', '/k/v1/preview/app/reports.json', { app: APP, lang: 'ja' }, null);
  const prevRev = preview.revision != null ? preview.revision : live.revision;
  const prevReports =
    preview.reports && typeof preview.reports === 'object' ? preview.reports : reports;

  const merged = {};
  for (const k of Object.keys(prevReports)) {
    if (k === GRAPH_KEY) continue;
    merged[k] = stripReportForPut(prevReports[k]);
  }
  merged[GRAPH_KEY] = buildNewGraph(prevReports, desiredFilter);

  console.log(
    `[682-graph] PUT preview/app/reports.json app=${APP} revision=${prevRev} graphs=${Object.keys(merged).length} filter=${desiredFilter}`,
  );
  const putBody = { app: APP, reports: merged, revision: prevRev };
  const putRes = await fetch(`${baseUrl}/k/v1/preview/app/reports.json`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(putBody),
  });
  const putText = await putRes.text();
  const putJson = JSON.parse(putText);
  if (!putRes.ok) {
    throw new Error(`PUT reports: ${putJson.code || putRes.status} ${putJson.message || putText.slice(0, 600)}`);
  }
  const newRev = putJson.revision;
  console.log(`[682-graph] PUT OK revision=${newRev}`);

  const depRes = await fetch(`${baseUrl}/k/v1/preview/app/deploy.json`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ apps: [{ app: APP, revision: newRev }] }),
  });
  const depJson = await depRes.json();
  if (!depRes.ok) throw new Error(`deploy POST: ${depJson.code} ${depJson.message}`);

  await waitDeploy(h);
  console.log('[682-graph] deploy SUCCESS（COLUMN・日合計・7 暦月 filter）');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
