/**
 * 674 の honsya 件数と代表 1 件のフィールド有無を表示（検収用・秘密は出さない）。
 * npx dotenv -e .env -e .env.proxy -- node scripts/verify-674-honsya-sample.mjs
 */
function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');

const authHeaders = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  authHeaders.Authorization =
    'Basic ' +
    Buffer.from(
      `${process.env.KINTONE_BASIC_AUTH_USERNAME}:${process.env.KINTONE_BASIC_AUTH_PASSWORD}`,
      'utf8',
    ).toString('base64');
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: authHeaders });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) throw new Error(`${res.status} ${json?.message || text.slice(0, 500)}`);
  return json;
}

const rn = process.argv[2] || '268';

const q1 = 'group_name = "honsya" limit 1 offset 0';
const j1 = await fetchJson(
  `${baseUrl}/k/v1/records.json?app=674&query=${encodeURIComponent(q1)}&totalCount=true`,
);
console.log('honsya_totalCount', j1.totalCount);

const q2 = `group_name = "honsya" and レコード番号 = "${rn}" limit 1`;
const j2 = await fetchJson(
  `${baseUrl}/k/v1/records.json?app=674&query=${encodeURIComponent(q2)}&fields[0]=mail&fields[1]=logon_name&fields[2]=pc_name`,
);
const rec = (j2.records || [])[0];
if (!rec) {
  console.log(`spot_レコード番号=${rn}: no row`);
  process.exit(0);
}
const mail = (rec.mail && rec.mail.value) || '';
const logon = (rec.logon_name && rec.logon_name.value) || '';
const pc = (rec.pc_name && rec.pc_name.value) || '';
console.log(`spot_レコード番号=${rn}`, {
  mail_filled: Boolean(String(mail).trim()),
  logon_filled: Boolean(String(logon).trim()),
  pc_name: pc,
});
