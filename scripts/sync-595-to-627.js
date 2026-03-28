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

const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

function headersWithoutContentType(h) {
  const out = { ...h };
  delete out['Content-Type'];
  return out;
}

async function fetchWithTimeout(url, init, timeoutMs = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function api(path, method, body) {
  const url = new URL(`${baseUrl}${path}`);
  const res = await fetchWithTimeout(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

async function getRecords(app, query, fields) {
  console.log(`[sync] GET records app=${app} ...`);
  const params = new URLSearchParams();
  params.set('app', String(app));
  params.set('query', query);
  (fields || []).forEach((f, i) => params.set(`fields[${i}]`, f));
  const url = new URL(`${baseUrl}/k/v1/records.json?${params.toString()}`);
  const res = await fetchWithTimeout(url, { method: 'GET', headers: headersWithoutContentType(headers) });
  const text = await res.text();
  const json = JSON.parse(text);
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 800);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  console.log(`[sync] GET records app=${app} -> ${json.records?.length ?? 0}`);
  return json.records || [];
}

async function getOne(app, query, fields) {
  const recs = await getRecords(app, query, fields);
  return recs.length ? recs[0] : null;
}

// Apps
const APP_595 = 595;
const APP_626 = 626;
const APP_627 = 627;

// Field codes
const FC_MAIL = 'mail';
const FC_595_NAME = 'user_name';
const FC_595_DEPT = 'dept_name';
const FC_595_GROUP = 'group_name';
const FC_595_EMP_STATUS = 'employment_status';
const FC_595_TRANSFER_DATE = 'transfer_date';
const FC_595_TRANSFER_NOTE = 'transfer_note';
const FC_595_RETIRED_DATE = 'retired_date';
const FC_595_RETIRED_NOTE = 'retired_note';
const FC_595_LEDGER_CREATED = 'ledger_created';
const FC_595_LEDGER_RECORD_ID = 'ledger_record_id';
const LEDGER_CREATED_LABEL = '作成済み';

const FC_626_USED = 'used_count';
const USED_MARK = '〇';
const FC_626_LOGON = 'logon_name';
const FC_626_LOGON_PW = 'logon_pw';
const FC_626_GB_PW = 'gb_pw';
const FC_626_MAIL_PW = 'mail_pw';
const FC_626_M365_PW = 'ｍ365_pw'; // NOTE: full-width "ｍ"

const FC_627_NAME = 'user_name';
const FC_627_DEPT = 'dept_name';
const FC_627_GROUP = 'group_name';
const FC_627_EMP_STATUS = 'employment_status';
const FC_627_AD_LOGON = 'logon_name';
const FC_627_M365_ID = 'm365_id';
const FC_627_WINDOWS_PW = 'logon_pw';
const FC_627_GB_ID = 'gb_id';
const FC_627_GB_PW = 'gb_pw';
const FC_627_MAIL_ACCT = 'mail_acct';
const FC_627_MAIL_PW = 'mail_pw';
const FC_627_M365_PW = 'm365_pw';
const FC_627_WINDOWS_NAME = 'windows_name';
const FC_627_ACCOUNT_STATE = 'account_state';
const ACCOUNT_STATE_ACTIVE = '有効';
const ACCOUNT_STATE_RETIRED = '退職';
const ACCOUNT_STATE_DELETED = '削除';

const M365_DOMAIN = 'kensetsutoso01.onmicrosoft.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function mailLocalPart(mail) {
  const at = mail.indexOf('@');
  return at > 0 ? mail.slice(0, at) : '';
}

function deriveM365UpnFromMail(mail) {
  const local = mailLocalPart(mail);
  return local ? `${local}@${M365_DOMAIN}` : '';
}

async function ensure627({ mail, name, dept, group, empStatus }) {
  const existing = await getOne(APP_627, `${FC_MAIL} = "${esc(mail)}" limit 1`, ['$id']);
  if (existing) return { id: existing.$id.value, created: false };

  const record = {
    [FC_MAIL]: { value: mail },
    [FC_627_NAME]: { value: name || '' },
    [FC_627_DEPT]: { value: dept || '' },
    [FC_627_GROUP]: { value: group || '' },
  };
  if (empStatus) record[FC_627_EMP_STATUS] = { value: empStatus };
  const created = await api('/k/v1/record.json', 'POST', { app: APP_627, record });
  return { id: created.id, created: true };
}

async function find626ByMail(mail) {
  return await getOne(
    APP_626,
    `${FC_MAIL} = "${esc(mail)}" limit 1`,
    ['$id', '$revision', FC_626_LOGON, FC_626_LOGON_PW, FC_626_GB_PW, FC_626_MAIL_PW, FC_626_M365_PW]
  );
}

async function findUnused626() {
  // Always consume from the smallest AD logon name (e.g. jbm0001 -> jbm0002 ...)
  const query = `${FC_626_USED} not in ("${USED_MARK}") and ${FC_MAIL} = "" and ${FC_626_LOGON} != "" order by ${FC_626_LOGON} asc limit 1`;
  return await getOne(APP_626, query, ['$id', '$revision', FC_626_LOGON, FC_626_LOGON_PW, FC_626_GB_PW, FC_626_MAIL_PW, FC_626_M365_PW]);
}

async function claim626(unusedRec, mail) {
  await api('/k/v1/record.json', 'PUT', {
    app: APP_626,
    id: unusedRec.$id.value,
    revision: unusedRec.$revision.value,
    record: {
      [FC_MAIL]: { value: mail },
      [FC_626_USED]: { value: USED_MARK },
    },
  });
}

async function ensure626Claimed(mail) {
  const already = await find626ByMail(mail);
  if (already) return already;
  for (let i = 0; i < 10; i++) {
    const unused = await findUnused626();
    if (!unused) return null;
    try {
      await claim626(unused, mail);
      return unused;
    } catch {
      await sleep(200);
    }
  }
  return null;
}

async function patch627(ledgerId, patch) {
  // Avoid overriding manual "削除" state once set.
  if (patch[FC_627_ACCOUNT_STATE]?.value) {
    const current = await getOne(APP_627, `$id = "${esc(ledgerId)}" limit 1`, [FC_627_ACCOUNT_STATE]);
    const cur = String(current?.[FC_627_ACCOUNT_STATE]?.value || '').trim();
    if (cur === ACCOUNT_STATE_DELETED) {
      delete patch[FC_627_ACCOUNT_STATE];
    }
  }
  await api('/k/v1/record.json', 'PUT', { app: APP_627, id: ledgerId, record: patch });
}

async function mark595Done({ id595, ledgerId }) {
  await api('/k/v1/record.json', 'PUT', {
    app: APP_595,
    id: id595,
    record: {
      [FC_595_LEDGER_CREATED]: { value: [LEDGER_CREATED_LABEL] },
      [FC_595_LEDGER_RECORD_ID]: { value: String(ledgerId) },
    },
  });
}

export async function sync595To627({ limit = 100 } = {}) {
  const force = process.argv.includes('--force');
  console.log(`[sync] start limit=${limit} force=${force}`);
  const query = force
    ? `${FC_MAIL} != "" order by レコード番号 asc limit ${Number(limit)}`
    : `${FC_595_LEDGER_CREATED} not in ("${LEDGER_CREATED_LABEL}") and ${FC_MAIL} != "" order by レコード番号 asc limit ${Number(limit)}`;
  const recs = await getRecords(
    APP_595,
    query,
    ['$id', FC_MAIL, FC_595_NAME, FC_595_DEPT, FC_595_GROUP, FC_595_EMP_STATUS, FC_595_TRANSFER_DATE, FC_595_TRANSFER_NOTE, FC_595_RETIRED_DATE, FC_595_RETIRED_NOTE]
  );
  console.log(`[sync] target records=${recs.length}`);

  let ok = 0, skipped = 0, failed = 0;
  for (const r of recs) {
    const id595 = r.$id.value;
    const mail = (r[FC_MAIL]?.value || '').trim();
    if (!mail) { skipped++; continue; }
    try {
      console.log(`[sync] processing 595:$id=${id595} mail=${mail}`);
      const ledger = await ensure627({
        mail,
        name: r[FC_595_NAME]?.value,
        dept: r[FC_595_DEPT]?.value,
        group: r[FC_595_GROUP]?.value,
        empStatus: r[FC_595_EMP_STATUS]?.value,
      });

      const rec626 = await ensure626Claimed(mail);
      if (!rec626) throw new Error('626プール枯渇/競合で確保できません');

      const adLogon = (rec626[FC_626_LOGON]?.value || '').trim(); // WindowsID
      const m365 = deriveM365UpnFromMail(mail); // M365IDはメール@前＋ドメイン
      const local = mailLocalPart(mail);

      const winPw = (rec626[FC_626_LOGON_PW]?.value || '').trim();
      const gbPw = (rec626[FC_626_GB_PW]?.value || '').trim();
      const mailPw = (rec626[FC_626_MAIL_PW]?.value || '').trim();
      const m365Pw = (rec626[FC_626_M365_PW]?.value || '').trim();

      const patch = {};
      // Keep 627 master info in sync with 595 even when already created
      patch[FC_627_NAME] = { value: r[FC_595_NAME]?.value || '' };
      patch[FC_627_DEPT] = { value: r[FC_595_DEPT]?.value || '' };
      patch[FC_627_GROUP] = { value: r[FC_595_GROUP]?.value || '' };
      if (r[FC_595_EMP_STATUS]?.value) patch[FC_627_EMP_STATUS] = { value: r[FC_595_EMP_STATUS]?.value };

      // Account state rule: retire => stop (never override "削除")
      const emp = String(r[FC_595_EMP_STATUS]?.value || '').trim();
      const desiredState = emp === '退職' ? ACCOUNT_STATE_RETIRED : ACCOUNT_STATE_ACTIVE;
      patch[FC_627_ACCOUNT_STATE] = { value: desiredState };

      if (adLogon) patch[FC_627_AD_LOGON] = { value: adLogon };
      if (m365) patch[FC_627_M365_ID] = { value: m365 };
      if (local) {
        // ガリバーID、メールアカウントはメールの@前
        patch[FC_627_GB_ID] = { value: local };
        patch[FC_627_MAIL_ACCT] = { value: local };
        // Windowsアカウント名（要件: ADログオン名[メール@前]）
        if (adLogon) patch[FC_627_WINDOWS_NAME] = { value: `${adLogon}[${local}]` };
      }
      if (winPw) patch[FC_627_WINDOWS_PW] = { value: winPw };
      if (gbPw) patch[FC_627_GB_PW] = { value: gbPw };
      if (mailPw) patch[FC_627_MAIL_PW] = { value: mailPw };
      if (m365Pw) patch[FC_627_M365_PW] = { value: m365Pw };
      if (Object.keys(patch).length) await patch627(ledger.id, patch);

      if (!force) {
        await mark595Done({ id595, ledgerId: ledger.id });
      }
      ok++;
    } catch (e) {
      failed++;
      console.error('FAILED', { id595, mail, error: String(e) });
    }
  }

  console.log(`[sync] done ok=${ok} skipped=${skipped} failed=${failed}`);
  return { ok, skipped, failed, processed: recs.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : 100;
  const result = await sync595To627({ limit });
  console.log(result);
  if (result.failed) process.exit(1);
}

