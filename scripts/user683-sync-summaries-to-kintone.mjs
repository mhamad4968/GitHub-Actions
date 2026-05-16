#!/usr/bin/env node
/**
 * 683 用: 682 を REST で取得 → Claude（Anthropic Messages API）で週次＋月次要約 → kintone に UPSERT（ブラウザ不要）。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user683-sync-summaries-to-kintone.mjs --dry-run
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user683-sync-summaries-to-kintone.mjs --apply
 *   npx dotenv -e .env -e .env.proxy -- node scripts/user683-sync-summaries-to-kintone.mjs --apply --prev-month
 *   （`--prev-month` は JST の**前月**を対象。毎月 1 日（翌暦月の 1 日に先月分を投入する定時ジョブ等）向け。`--year` / `--month` と併用不可）
 *
 * 要約キャッシュ用フィールドを **USER683_SUMMARY_APP**（既定 683）に手動作成すること。
 * フィールドコード: `docs/runbooks/user683-summary-job.md` 参照。
 *
 * 認証: `KINTONE_BASE_URL` + `KINTONE_USERNAME` / `KINTONE_PASSWORD`（682 監査スクリプトと同型）。
 * Claude: `ANTHROPIC_API_KEY`（必須）`ANTHROPIC_MODEL`（既定 claude-opus-4-7）`USER683_CLAUDE_TIMEOUT_MS`（既定 120000）
 */
import 'dotenv/config';

const APP682 = 682;
const SUMMARY_APP = Number(process.env.USER683_SUMMARY_APP || 683);
const FC_YM = process.env.USER683_FC_YM || 'user683_dash_ym';
const FC_W1 = process.env.USER683_FC_W1 || 'user683_week_1';
const FC_W2 = process.env.USER683_FC_W2 || 'user683_week_2';
const FC_W3 = process.env.USER683_FC_W3 || 'user683_week_3';
const FC_W4 = process.env.USER683_FC_W4 || 'user683_week_4';
const FC_W5 = process.env.USER683_FC_W5 || 'user683_week_5';
const FC_W6 = process.env.USER683_FC_W6 || 'user683_week_6';
const FC_MONTH = process.env.USER683_FC_MONTH || 'user683_month';
const FC_WEEK_CODES = [FC_W1, FC_W2, FC_W3, FC_W4, FC_W5, FC_W6];

const FC_DATE = 'record_date';
const FC_DAY_TOTAL = 'day_total';
const FC_AM = 'am_count';
const FC_PM = 'pm_count';
const FC_AM_TEXT = 'am_correspondence';
const FC_PM_TEXT = 'pm_correspondence';
const RELAY_DAY_CORPUS_MAX_LEN = 3200;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_PROMPT_WEEK =
  '以下は社内ユーザサポートの週次対応メモの抜粋です。当社の会計年度は**4月末が期末・5月が期首**（暦月のみの比較だけで終わらせず、必要ならその週が会計年度のどの位置かに触れてよい。コーパスに無い「21日締め」等の変形会計月は捏造しない）。週内に**年末年始・ゴールデンウィーク・秋分の日前後の連休（いわゆるシルバーウィーク）**など稼働日が少ない期間が含まれる場合は、件数・負荷の変動をその文脈で読むこと。日本語で、箇条書き3点以内・合計200字以内で要約してください。コーパスに無い数値は書かないこと。余計な前置きは不要。\n\n';
const CLAUDE_PROMPT_MONTH =
  '【前月の月次要約】と【当月の対応メモ抜粋】が続きます。当社の会計年度は**4月末が期末・5月が期首**である（暦月ベースの前月比に加え、必要ならその暦月が会計年度上どの位置かに一言触れてよい。例: 4月＝期末月、5月＝新年度期首、1〜3月＝期末に向けた後半、5〜12月＝期中。コーパスに無い変形会計カレンダーや四半期名は付け加えない）。当月のコーパスに**年末年始・ゴールデンウィーク・秋分の日前後の連休（シルバーウィーク）**など大型休暇が含まれる場合は、稼働日減による件数・相談量の変動を疑い、コーパスに根拠がある範囲で言及すること（根拠が無いときは断定しない）。日本語で、冒頭1〜3文で前月と比べた所感（件数・相談内容・負荷の増減など）を必ず書き、その後に箇条書き3点以内で当月の要点をまとめてください。コーパスに明示されていない数値は書かないでください。全体は350字程度を目安（やや超過可）。前月要約が空または「要約キャッシュなし」のときは「前月比:（初月または欠）」の1行でよいです。余計な前置きは不要。\n\n';
const ANTHROPIC_MODEL = (process.env.ANTHROPIC_MODEL || 'claude-opus-4-7').trim();
const CLAUDE_MS = Number(process.env.USER683_CLAUDE_TIMEOUT_MS || 120000);

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** JST の暦年・暦月（1〜12） */
function jstCalendarYearMonthNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = Number(parts.find((p) => p.type === 'year').value);
  const m = Number(parts.find((p) => p.type === 'month').value);
  return { y, m };
}

/** 直前の暦月（JST 基準の y,m から） */
function prevCalendarMonth(y, m) {
  if (m <= 1) return { year: y - 1, month: 12 };
  return { year: y, month: m - 1 };
}

function parseArgs() {
  let year = null;
  let month = null;
  let dryRun = false;
  let apply = false;
  let prevMonth = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--year' && argv[i + 1]) year = Number(argv[++i]);
    else if (argv[i] === '--month' && argv[i + 1]) month = Number(argv[++i]);
    else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--apply') apply = true;
    else if (argv[i] === '--prev-month') prevMonth = true;
  }
  if (dryRun && apply) throw new Error('Use only one of --dry-run or --apply');
  if (!dryRun && !apply) dryRun = true;
  if (prevMonth && (year != null || month != null)) {
    throw new Error('Use only one of --prev-month or --year/--month');
  }
  if (prevMonth) {
    const cur = jstCalendarYearMonthNow();
    const p = prevCalendarMonth(cur.y, cur.m);
    year = p.year;
    month = p.month;
  } else if (year == null || month == null) {
    const cur = jstCalendarYearMonthNow();
    year = year ?? cur.y;
    month = month ?? cur.m;
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error('Invalid --year / --month');
  }
  return { year, month, dryRun, apply, prevMonth };
}

function calendarDaysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

function jstYmdToUtcNoonMs(year, month1to12, day) {
  return Date.UTC(year, month1to12 - 1, day, 12, 0, 0);
}

function jstWeekdaySun0(year, month1to12, day) {
  const s = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(new Date(jstYmdToUtcNoonMs(year, month1to12, day)));
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[s] != null ? map[s] : 0;
}

function weekBlockRangesSunSatInMonth(ym) {
  const dim = calendarDaysInMonth(ym.y, ym.m);
  const ranges = [];
  let curD = 1;
  while (curD <= dim) {
    const sun0 = jstWeekdaySun0(ym.y, ym.m, curD);
    const weekStartD = curD - sun0;
    const weekEndD = weekStartD + 6;
    const seg0 = weekStartD < 1 ? 1 : weekStartD;
    const seg1 = weekEndD > dim ? dim : weekEndD;
    ranges.push([seg0, seg1]);
    curD = seg1 + 1;
  }
  return ranges.length > 6 ? ranges.slice(0, 6) : ranges;
}

function weekSlotCountForYm(ym) {
  return weekBlockRangesSunSatInMonth(ym).length;
}

function formatYmdShortWday(isoYmd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd);
  if (!m) return isoYmd;
  const mo = String(parseInt(m[2], 10));
  const day = String(parseInt(m[3], 10));
  const wd = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    weekday: 'short',
  }).format(new Date(jstYmdToUtcNoonMs(Number(m[1]), Number(m[2]), Number(m[3]))));
  return m[1] + '/' + mo + '/' + day + '(' + wd + ')';
}

function normalizeSummaryWhitespace(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateOneLine(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function mergeCorrespondenceForRelay(amRaw, pmRaw) {
  const am = normalizeSummaryWhitespace(amRaw || '');
  const pm = normalizeSummaryWhitespace(pmRaw || '');
  if (!am && !pm) return '';
  let merged = '';
  if (am && pm && am === pm) merged = am;
  else if (!am) merged = pm;
  else if (!pm) merged = am;
  else merged = am + ' ' + pm;
  return truncateOneLine(merged, RELAY_DAY_CORPUS_MAX_LEN);
}

function recordDateYmd(rec) {
  const cell = rec[FC_DATE];
  if (!cell || cell.value == null) return '';
  return String(cell.value).slice(0, 10);
}

function toNumCell(cell) {
  if (!cell || cell.value == null || String(cell.value).trim() === '') return 0;
  const n = Number(cell.value);
  return Number.isFinite(n) ? n : 0;
}

function getCellText(rec, code) {
  const c = rec[code];
  if (!c || c.value == null) return '';
  return String(c.value);
}

function aggregate682ByYmd(records) {
  const map = {};
  for (let i = 0; i < records.length; i += 1) {
    const ymd = recordDateYmd(records[i]);
    if (!ymd) continue;
    if (!map[ymd]) map[ymd] = { am: 0, pm: 0, dt: 0, rows: 0, amRaw: '', pmRaw: '' };
    map[ymd].am += toNumCell(records[i][FC_AM]);
    map[ymd].pm += toNumCell(records[i][FC_PM]);
    map[ymd].dt += toNumCell(records[i][FC_DAY_TOTAL]);
    map[ymd].rows += 1;
    const at = getCellText(records[i], FC_AM_TEXT);
    const pt = getCellText(records[i], FC_PM_TEXT);
    if (at) map[ymd].amRaw += (map[ymd].amRaw ? '\n' : '') + at;
    if (pt) map[ymd].pmRaw += (map[ymd].pmRaw ? '\n' : '') + pt;
  }
  const keys = Object.keys(map);
  for (let k = 0; k < keys.length; k += 1) {
    const o = map[keys[k]];
    o.relayLine = mergeCorrespondenceForRelay(o.amRaw, o.pmRaw);
  }
  return map;
}

function collectCorpusForDayRange(ym, dim, d0, d1, byDay) {
  const parts = [];
  const hi = Math.min(d1, dim);
  for (let d = d0; d <= hi; d += 1) {
    const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
    const x = byDay[ymd];
    if (x && x.relayLine) parts.push(formatYmdShortWday(ymd) + ': ' + x.relayLine);
  }
  return parts.join('\n');
}

function buildRelayPayload(ym, dim, byDay) {
  const ranges = weekBlockRangesSunSatInMonth(ym);
  const weeks = [];
  for (let wi = 0; wi < ranges.length; wi += 1) {
    const d0 = ranges[wi][0];
    const d1 = ranges[wi][1];
    const label = String(ym.m) + '/' + String(d0) + '〜' + String(ym.m) + '/' + String(d1) + '週次';
    const corpus = collectCorpusForDayRange(ym, dim, d0, d1, byDay);
    weeks.push({ label, corpus });
  }
  const monthParts = [];
  for (let d = 1; d <= dim; d += 1) {
    const ymd = ym.y + '-' + pad2(ym.m) + '-' + pad2(d);
    const x = byDay[ymd];
    if (x && x.relayLine) monthParts.push(formatYmdShortWday(ymd) + ': ' + x.relayLine);
  }
  return { weeks, month: { label: ym.y + '年' + ym.m + '月', corpus: monthParts.join('\n') } };
}

function buildAuthHeaders() {
  const user = requireEnv('KINTONE_USERNAME');
  const pass = requireEnv('KINTONE_PASSWORD');
  const headers = {
    'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  };
  if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
    const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
    const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
    headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  }
  return headers;
}

function jsonHeaders() {
  return { ...buildAuthHeaders(), 'Content-Type': 'application/json' };
}

function normalizeBaseUrl() {
  let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/k$/i, '');
  return baseUrl;
}

async function fetchJson(method, url, headers, body) {
  const h = { ...headers };
  if (method === 'GET' || method === 'HEAD') delete h['Content-Type'];
  const res = await fetch(url, { method, headers: h, body: body != null ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 600);
    throw new Error(`HTTP ${res.status} ${msg}`);
  }
  return json;
}

async function fetch682MonthRecords(baseUrl, headers, year, month) {
  const dim = calendarDaysInMonth(year, month);
  const from = `${year}-${pad2(month)}-01`;
  const to = `${year}-${pad2(month)}-${pad2(dim)}`;
  const query = `record_date >= "${from}" and record_date <= "${to}" order by record_date asc`;
  /** 682 監査スクリプトと同型の GET（fields は公式の連番形式のみ列挙） */
  const fields = [FC_DATE, FC_DAY_TOTAL, FC_AM, FC_PM, FC_AM_TEXT, FC_PM_TEXT];
  const all = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const u = new URL(`${baseUrl}/k/v1/records.json`);
    u.searchParams.set('app', String(APP682));
    u.searchParams.set('query', query);
    u.searchParams.set('totalCount', 'true');
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('offset', String(offset));
    for (let fi = 0; fi < fields.length; fi += 1) {
      u.searchParams.append(`fields[${fi}]`, fields[fi]);
    }
    const data = await fetchJson('GET', u.toString(), headers, null);
    const batch = Array.isArray(data.records) ? data.records : [];
    for (const r of batch) all.push(r);
    const total = Number(data.totalCount != null ? data.totalCount : all.length);
    offset += batch.length;
    if (batch.length === 0 || offset >= total) break;
  }
  return { records: all, dim };
}

async function claudeSummarizeOnce(kind, promptCorpus) {
  const p = (promptCorpus || '').trim();
  if (!p) return '（集計対象の要約元テキストがありません）';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    return '（Claude API キー未設定: ANTHROPIC_API_KEY）';
  }
  const model = ANTHROPIC_MODEL;
  const prompt = kind === 'month' ? CLAUDE_PROMPT_MONTH + p : CLAUDE_PROMPT_WEEK + p;
  const maxTokens = kind === 'month' ? 420 : 320;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), CLAUDE_MS);
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': String(apiKey).trim(),
        'anthropic-version': '2023-06-01',
      },
      signal: ac.signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const rawText = await res.text();
    if (!res.ok) {
      const tail = rawText.replace(/\s+/g, ' ').trim().slice(0, 220);
      const who = ' [sync-job model=' + model + ']';
      return '（Claude HTTP ' + res.status + (tail ? ' body: ' + tail : '') + '）' + who;
    }
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return rawText.trim().slice(0, 500);
    }
    const blocks = data && data.content;
    if (!Array.isArray(blocks)) return '';
    const parts = [];
    for (let bi = 0; bi < blocks.length; bi += 1) {
      const b = blocks[bi];
      if (b && typeof b === 'object' && b.type === 'text') {
        parts.push(String(b.text != null ? b.text : ''));
      }
    }
    return parts.join('').trim();
  } catch (e) {
    const name = e && e.name === 'AbortError' ? 'timeout' : String((e && e.message) || e);
    return '（Claude エラー: ' + name + '） [sync-job model=' + model + ']';
  } finally {
    clearTimeout(t);
  }
}

/** 要約キャッシュアプリから指定暦月の月次要約テキストのみ取得（無ければ空） */
async function fetchSummaryMonthText(baseUrl, headers, year, month1to12) {
  const ymKey = `${year}-${pad2(month1to12)}`;
  const q = `${FC_YM} = "${ymKey}" limit 1`;
  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', String(SUMMARY_APP));
  u.searchParams.set('query', q);
  u.searchParams.append('fields[0]', FC_YM);
  u.searchParams.append('fields[1]', FC_MONTH);
  const data = await fetchJson('GET', u.toString(), headers, null);
  const recs = Array.isArray(data.records) ? data.records : [];
  if (!recs.length) return '';
  const r0 = recs[0];
  const cell = r0[FC_MONTH];
  if (!cell || cell.value == null) return '';
  return String(cell.value).trim().slice(0, 4000);
}

function wrapMonthCorpusForLlm(prevYmKey, prevMonthSummaryText, currentYmKey, currentCorpus) {
  const prevBlock =
    (prevMonthSummaryText && String(prevMonthSummaryText).trim()) ||
    '（要約キャッシュなし・初回または未取得）';
  return (
    '【前月の月次要約（' +
    prevYmKey +
    '）】\n' +
    prevBlock +
    '\n\n【当月（' +
    currentYmKey +
    '）の対応メモ抜粋】\n' +
    String(currentCorpus || '').trim()
  );
}

async function findExistingSummaryRecord(baseUrl, headers, ymKey) {
  const q = `${FC_YM} = "${ymKey}" limit 1`;
  const u = new URL(`${baseUrl}/k/v1/records.json`);
  u.searchParams.set('app', String(SUMMARY_APP));
  u.searchParams.set('query', q);
  u.searchParams.append('fields[0]', FC_YM);
  u.searchParams.append('fields[1]', '$id');
  u.searchParams.append('fields[2]', '$revision');
  const data = await fetchJson('GET', u.toString(), headers, null);
  const recs = Array.isArray(data.records) ? data.records : [];
  if (!recs.length) return null;
  const r0 = recs[0];
  const id = r0.$id && r0.$id.value != null ? String(r0.$id.value) : null;
  const revision = r0.$revision && r0.$revision.value != null ? String(r0.$revision.value) : null;
  if (!id) return null;
  return { id, revision };
}

function recordBody(ymKey, weekTexts, monthText) {
  const r = {
    [FC_YM]: { value: ymKey },
    [FC_MONTH]: { value: monthText || '' },
  };
  for (let i = 0; i < FC_WEEK_CODES.length; i += 1) {
    r[FC_WEEK_CODES[i]] = { value: weekTexts[i] || '' };
  }
  return r;
}

async function main() {
  const { year, month, dryRun, apply, prevMonth } = parseArgs();
  const ym = { y: year, m: month };
  const ymKey = `${year}-${pad2(month)}`;
  const baseUrl = normalizeBaseUrl();
  const headers = buildAuthHeaders();

  console.log(
    `[user683-sync] app682=${APP682} summaryApp=${SUMMARY_APP} ym=${ymKey} mode=${dryRun ? 'dry-run' : 'apply'}${prevMonth ? ' prev-month=JST前月' : ''}`,
  );
  if (prevMonth && dryRun) {
    process.stderr.write(
      '[user683-sync] --prev-month: 先月のコーパス確認のみ。kintone 投入は同じく --prev-month に --apply を付けて実行。\n',
    );
  }

  const { records, dim } = await fetch682MonthRecords(baseUrl, headers, year, month);
  console.log(`[user683-sync] 682 records fetched: ${records.length} dim=${dim}`);

  const byDay = aggregate682ByYmd(records);
  const payload = buildRelayPayload(ym, dim, byDay);
  const nWeek = weekSlotCountForYm(ym);
  const corpusLens = payload.weeks.map((w) => (w.corpus || '').length);
  console.log(`[user683-sync] corpus chars per week (${nWeek}): ${corpusLens.join(', ')} month=${(payload.month.corpus || '').length}`);

  if (dryRun) {
    console.log('[user683-sync] dry-run: Claude / kintone 書き込みは行いません。--apply で実行。');
    return;
  }

  const weekSummaries = [];
  for (let i = 0; i < nWeek; i += 1) {
    const c = payload.weeks[i] && payload.weeks[i].corpus != null ? String(payload.weeks[i].corpus) : '';
    process.stderr.write(`[user683-sync] Claude week ${i + 1}/${nWeek} …\n`);
    weekSummaries.push(await claudeSummarizeOnce('week', c));
  }
  const pm = prevCalendarMonth(year, month);
  const prevYmKey = `${pm.year}-${pad2(pm.month)}`;
  let prevMonthSummaryText = '';
  try {
    prevMonthSummaryText = await fetchSummaryMonthText(baseUrl, headers, pm.year, pm.month);
  } catch (e) {
    console.warn('[user683-sync] prev month summary fetch failed:', String((e && e.message) || e));
  }
  console.log(
    `[user683-sync] prev month ym=${prevYmKey} month-field-chars=${(prevMonthSummaryText || '').length}`,
  );
  const monthCorpusForLlm = wrapMonthCorpusForLlm(
    prevYmKey,
    prevMonthSummaryText,
    ymKey,
    payload.month && payload.month.corpus != null ? String(payload.month.corpus) : '',
  );
  process.stderr.write('[user683-sync] Claude month …\n');
  const monthSummary = await claudeSummarizeOnce('month', monthCorpusForLlm);

  const existing = await findExistingSummaryRecord(baseUrl, headers, ymKey);
  const body = recordBody(ymKey, weekSummaries, monthSummary);

  if (existing) {
    const put = {
      app: SUMMARY_APP,
      id: existing.id,
      record: body,
    };
    if (existing.revision != null) put.revision = existing.revision;
    await fetchJson('PUT', `${baseUrl}/k/v1/record.json`, jsonHeaders(), put);
    console.log(`[user683-sync] PUT record.json OK id=${existing.id}`);
  } else {
    await fetchJson('POST', `${baseUrl}/k/v1/record.json`, jsonHeaders(), {
      app: SUMMARY_APP,
      record: body,
    });
    console.log('[user683-sync] POST record.json OK (new record)');
  }
}

main().catch((e) => {
  console.error('[user683-sync] FATAL', e);
  process.exit(1);
});
