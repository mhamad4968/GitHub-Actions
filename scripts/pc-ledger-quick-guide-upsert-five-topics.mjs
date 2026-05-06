#!/usr/bin/env node
/**
 * 681 に「リスト一覧」「社員マスタ」「異動・退職」「PC買替」「PC保管」の各章を追加／本文更新する。
 *
 *   npx dotenv -e .env -e .env.proxy -- node scripts/pc-ledger-quick-guide-upsert-five-topics.mjs
 */
import 'dotenv/config';

const APP_ID = Number(process.env.PC_LEDGER_QUICK_GUIDE_APP_ID || 681);

/** @type {{ sort_no: string, midashi: string, honbun: string }[]} */
const CHAPTERS = [
  {
    sort_no: '2',
    midashi: 'リスト一覧について',
    honbun: [
      '「一覧を表示（編集・追加）」を押すと、いつもの一覧画面が出ます。行がずらっと並び、1行が1台のPC（または1件の台帳）を表します。',
      '',
      '・画面上の列は、PCの名前・利用者・所属など、会社が決めた項目が並びます。',
      '・一覧の上にある並べ替えや絞り込みが使えるときは、画面の案内にしたがってください。',
      '・行をクリックすると、その1件の詳細画面が開きます。内容を直すときも、まず行を開きます。',
      '',
      '※ 用語の細かい意味は、会社の手順書や担当への確認を正にしてください。',
    ].join('\n'),
  },
  {
    sort_no: '4',
    midashi: '社員マスタの仕様',
    honbun: [
      '「社員マスタ」は、社員の氏名・所属などの基本情報をまとめた台帳です。担当部署が内容を整えます。',
      '',
      '・新しいPC台帳で利用者名や所属を入れるとき、画面の案内にしたがって名前を検索して選べることがあります。そのときの元データが社員マスタです。',
      '・社員マスタの内容と、実際の所属や氏名がずれていると、入力支援がうまく動かなかったり、選べないことがあります。',
      '・氏名の修正や入退社の反映は、社員マスタの担当へ、決められた手順で依頼してください。',
      '',
      '※ 社員マスタの画面そのものの操作は、別の案内や担当者への確認を正にしてください。',
    ].join('\n'),
  },
  {
    sort_no: '5',
    midashi: '異動や退職した場合の対応',
    honbun: [
      '人が部署を移る（異動）したり、会社をやめる（退職）したりすると、「だれがそのPCを使うか」が変わることがあります。',
      '',
      '【異動】',
      '・利用者や所属が変わるときは、台帳を開いて、新しい内容に直してください。',
      '・誰が直すか（本人・事務・担当者）は、部署の決まりに従ってください。',
      '',
      '【退職】',
      '・退職する方が使っていたPCは、会社の手順にしたがって返却・移管します。データやパスワードなど、機密が残らないようにしてください。',
      '',
      '・手順が分からないときは、部署内で相談し、必要なら情報システムや社員マスタの担当に声をかけてください。',
    ].join('\n'),
  },
  {
    sort_no: '7',
    midashi: 'PC買替の対応について',
    honbun: [
      'PCの調子が悪い・寿命が来たなどで新しいPCに替えるときは、「古いPCの台帳を終える」と「新しいPCの台帳を始める」がセットになります。',
      '',
      '・発注・受け渡し・データの移し替えなどの流れは、会社で決まった手順に従ってください。',
      '・台帳では、新しいPCが手元に来たあとで、シールの番号や利用者・所属などを入れ直すことが多いです。画面の入力欄の説明に沿ってください。',
      '・古いPCを返却するときは、返却日や返却先の記入が必要な場合があります。案内に従ってください。',
      '',
      '※ 購入申請や見積のルールは、部署・会社の別資料を正にしてください。',
    ].join('\n'),
  },
  {
    sort_no: '8',
    midashi: 'PC保管について',
    honbun: [
      '予備のPCや、しばらく使わないPCは、鍵のかかる場所や、会社が決めた倉庫・棚へ保管してください。',
      '',
      '・だれの担当で、どこにあるかが後から分かるように、台帳の状態やラベル付けをきちんとしておきます。',
      '・貸し出し中のPCと同様、置き場所を共有しすぎない・私物と混ぜないなど、紛失や取り違えを防ぐ運用を心がけてください。',
      '・長期保管のあとに再利用するときは、起動確認や初期化の要否など、会社のルールに従ってください。',
      '',
      '※ セキュリティ区分の高い機器は、別ルールがある場合があります。',
    ].join('\n'),
  },
];

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
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' };
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  const ba = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
  authHeaders.Authorization = ba;
  jsonHeaders.Authorization = ba;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const msg = json?.code || json?.message ? `${json.code || ''} ${json.message || ''}`.trim() : text.slice(0, 1200);
    throw new Error(`HTTP ${res.status} ${res.statusText} ${msg}`.trim());
  }
  return json;
}

function escapeQueryValue(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function findByMidashi(midashi) {
  const q = `midashi = "${escapeQueryValue(midashi)}"`;
  const p = new URLSearchParams();
  p.set('app', String(APP_ID));
  p.set('query', q);
  p.append('fields[0]', '$id');
  p.append('fields[1]', 'midashi');
  const found = await fetchJson(`${baseUrl}/k/v1/records.json?${p}`, { method: 'GET', headers: { ...authHeaders } });
  return (found.records || [])[0] || null;
}

async function upsertOne(ch) {
  const row = await findByMidashi(ch.midashi);
  if (row) {
    await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({
        app: APP_ID,
        id: row.$id.value,
        record: {
          sort_no: { value: ch.sort_no },
          honbun: { value: ch.honbun },
        },
      }),
    });
    console.log(`[five-topics] PUT id=${row.$id.value} ${ch.midashi}`);
    return;
  }
  await fetchJson(`${baseUrl}/k/v1/records.json`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      app: APP_ID,
      records: [
        {
          sort_no: { value: ch.sort_no },
          midashi: { value: ch.midashi },
          honbun: { value: ch.honbun },
        },
      ],
    }),
  });
  console.log(`[five-topics] POST ${ch.midashi} sort=${ch.sort_no}`);
}

async function main() {
  for (const ch of CHAPTERS) {
    await upsertOne(ch);
  }
  console.log('[five-topics] 完了');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
