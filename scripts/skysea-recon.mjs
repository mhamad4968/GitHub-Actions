/**
 * SKYSEA × kintone 594 突合スクリプト（Phase 1: 可視化のみ・read-only）
 *
 * 入力:
 *   - data/skysea/installed-pcs-YYYY-MM-DD.csv  ← SKYSEA 管理機エクスポート (cp932)
 *   - kintone 594 個人現役 PC 一覧                ← API GET (read-only)
 *
 * 出力:
 *   - data/skysea/needs-install-YYYY-MM-DD.csv         ← 🔴 要インストール（kintone あり / SKYSEA 無し）
 *   - data/skysea/already-installed-YYYY-MM-DD.csv     ← 🟢 正常（両方あり）
 *   - data/skysea/orphan-in-skysea-YYYY-MM-DD.csv      ← 🟡 SKYSEA のみ（kintone 廃止漏れ等）
 *   - 集計レポートを stdout に出力
 *
 * 副作用なし: kintone への書き込みは一切行わない。
 *
 * 実行: npm run skysea:recon
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';

// ===== 設定 =====
// JST (Asia/Tokyo) 基準で YYYY-MM-DD を生成 (UTC ベースだと深夜帯に前日扱いになる罠を回避)
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
const SKYSEA_CSV = `data/skysea/installed-pcs-${TODAY}.csv`;
const OUT_NEEDS_INSTALL = `data/skysea/needs-install-${TODAY}.csv`;
const OUT_ALREADY = `data/skysea/already-installed-${TODAY}.csv`;
const OUT_ORPHAN = `data/skysea/orphan-in-skysea-${TODAY}.csv`;

// サーバー類除外キーワード（端末機タイプ列に含まれていたら除外）
const SERVER_EXCLUDE_KEYWORDS = [
  '管理機',
  'データサーバー',
  'マスターサーバー',
  'ログ解析サーバー',
  'ログ収集サーバー',
];

// ===== kintone 接続準備（既存 kintone-connection-test.js と同パターン）=====
function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v);
}
let baseUrl = requireEnv('KINTONE_BASE_URL').trim().replace(/\/+$/, '');
baseUrl = baseUrl.replace(/\/k$/i, '');
const user = requireEnv('KINTONE_USERNAME');
const pass = requireEnv('KINTONE_PASSWORD');
// GET には Content-Type を付けない
// (kintone は GET で Content-Type: application/json を見ると body 期待モードに入り 400 を返す罠)
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${user}:${pass}`, 'utf8').toString('base64'),
};
if (process.env.KINTONE_BASIC_AUTH_USERNAME && process.env.KINTONE_BASIC_AUTH_PASSWORD) {
  const bu = String(process.env.KINTONE_BASIC_AUTH_USERNAME);
  const bp = String(process.env.KINTONE_BASIC_AUTH_PASSWORD);
  headers.Authorization = `Basic ${Buffer.from(`${bu}:${bp}`, 'utf8').toString('base64')}`;
}

// ===== CSV 簡易パーサ（カンマ区切り・ダブルクォート対応）=====
function parseCsv(text) {
  const lines = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (cur.length || lines.length === 0 || lines[lines.length - 1].length > 0) lines.push(cur);
      cur = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      cur += ch;
    }
  }
  if (cur.length) lines.push(cur);
  // 各行を列に分割
  const rows = lines.map((line) => {
    const cols = [];
    let c = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { c += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        cols.push(c); c = '';
      } else {
        c += ch;
      }
    }
    cols.push(c);
    return cols;
  });
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).filter((r) => r.some((c) => c && c.length > 0)).map((r) => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
}

// ===== CSV 出力（UTF-8 with BOM = Excel で文字化けしない）=====
function writeCsvUtf8Bom(filePath, rows, header) {
  const bom = '\uFEFF';
  const escape = (v) => {
    const s = (v ?? '').toString();
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [header.join(',')];
  for (const r of rows) lines.push(header.map((h) => escape(r[h])).join(','));
  fs.writeFileSync(filePath, bom + lines.join('\r\n'), 'utf8');
}

// ===== PC 名正規化（突合精度向上のため大文字化＋前後空白除去）=====
function normalize(name) {
  return (name ?? '').toString().trim().toUpperCase();
}

// ===== PC_name の社内 PC 命名規則チェック (KS or JBIS で始まる)=====
// 安全網: 万一 type=個人 だが命名規則違反の PC が混入していた場合の検出用
function isOurNamingConvention(name) {
  const u = (name || '').toString().trim().toUpperCase();
  return u.startsWith('KS') || u.startsWith('JBIS');
}

// ===== kintone 594 から個人現役 PC 取得 =====
async function fetchKintonePersonalActive() {
  const all = [];
  let offset = 0;
  const LIMIT = 500;
  while (true) {
    // 個人 type / 廃止 off / 使用中
    // - type は RADIO_BUTTON → in/not in のみ (= は GAIA_IQ03 で不可)
    // - abolished_flag は CHECK_BOX → in/not in (複数値対応)
    // - status は RADIO_BUTTON → in (保管・廃棄を除外し、使用中のみ)
    // - kintone クエリ構文: where 句 → order by → limit/offset の順序厳守
    const query = `type in ("個人") and abolished_flag not in ("廃止") and status in ("使用中") order by PC_name asc limit ${LIMIT} offset ${offset}`;
    const url = `${baseUrl}/k/v1/records.json?app=594&query=${encodeURIComponent(query)}` +
      `&fields[0]=$id&fields[1]=PC_name&fields[2]=user_name&fields[3]=type` +
      `&fields[4]=status&fields[5]=abolished_flag&fields[6]=mail&fields[7]=dept_name`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`kintone API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    all.push(...data.records);
    if (data.records.length < LIMIT) break;
    offset += LIMIT;
    if (offset > 5000) throw new Error('Safety break: 5000+ records');
  }
  return all;
}

// ===== メイン =====
async function main() {
  console.log(`# SKYSEA × kintone 594 突合レポート (${TODAY})`);
  console.log('');

  // --- Step 1: SKYSEA CSV 読込 ---
  if (!fs.existsSync(SKYSEA_CSV)) {
    throw new Error(`SKYSEA CSV not found: ${SKYSEA_CSV}\n  → SKYSEA 管理機からハードウェア一覧を CSV エクスポートして配置してください`);
  }
  const buf = fs.readFileSync(SKYSEA_CSV);
  const text = iconv.decode(buf, 'cp932');
  const skyseaAll = parseCsv(text);
  console.log(`## Step 1: SKYSEA CSV 読込`);
  console.log(`- ファイル: \`${SKYSEA_CSV}\``);
  console.log(`- 全レコード: ${skyseaAll.length} 件`);

  // --- Step 2: サーバー類除外 ---
  const skyseaPCs = skyseaAll.filter((r) => {
    const t = (r['端末機タイプ'] || '');
    return !SERVER_EXCLUDE_KEYWORDS.some((kw) => t.includes(kw));
  });
  const excluded = skyseaAll.length - skyseaPCs.length;
  console.log(`- 除外 (サーバー類): ${excluded} 件`);
  console.log(`- 突合対象 SKYSEA PC: ${skyseaPCs.length} 件`);
  console.log('');

  // --- Step 3: kintone 594 個人現役 PC 取得 ---
  console.log(`## Step 2: kintone 594 個人現役 PC 取得`);
  console.log(`- 抽出条件: type=個人 / 廃止 off / status=使用中`);
  const kintonePCs = await fetchKintonePersonalActive();
  const kintoneWithName = kintonePCs.filter((r) => normalize(r.PC_name?.value).length > 0);
  console.log(`- 取得件数: ${kintonePCs.length} 件`);
  console.log(`- うち PC_name あり: ${kintoneWithName.length} 件`);

  // 安全網: 命名規則 (KS/JBIS) チェック
  const conformant = kintoneWithName.filter((r) => isOurNamingConvention(r.PC_name.value));
  const violators = kintoneWithName.filter((r) => !isOurNamingConvention(r.PC_name.value));
  console.log(`- 命名規則 (KS/JBIS) 適合: ${conformant.length} 件`);
  if (violators.length > 0) {
    console.log(`- ⚠ 命名規則違反 (要確認): ${violators.length} 件`);
    violators.slice(0, 5).forEach((r) => console.log(`    - ${r.PC_name.value}`));
    if (violators.length > 5) console.log(`    ... 他 ${violators.length - 5} 件`);
  }
  console.log('');

  // --- Step 4: 突合 ---
  const skyMap = new Map();
  const skyDup = [];
  for (const r of skyseaPCs) {
    const key = normalize(r['コンピューター名']);
    if (!key) continue;
    if (skyMap.has(key)) skyDup.push(key);
    else skyMap.set(key, r);
  }

  const kinMap = new Map();
  const kinDup = [];
  for (const r of kintoneWithName) {
    const key = normalize(r.PC_name.value);
    if (kinMap.has(key)) kinDup.push(key);
    else kinMap.set(key, r);
  }

  const okBoth = []; // 両方あり
  const needInstall = []; // kintone のみ = 要インストール
  const orphanInSkysea = []; // SKYSEA のみ = kintone 側マスタ更新候補

  for (const [name, kr] of kinMap) {
    if (skyMap.has(name)) {
      okBoth.push({
        PC_name: kr.PC_name.value,
        user_name_kintone: kr.user_name?.value || '',
        user_name_skysea: skyMap.get(name)['表示名'] || '',
        dept_kintone: kr.dept_name?.value || '',
        dept_skysea: skyMap.get(name)['部署名'] || '',
        kintone_record_id: kr.$id?.value || '',
        skysea_last_boot: skyMap.get(name)['最終起動日時'] || '',
        skysea_version: skyMap.get(name)['SKYSEA Client View端末機バージョン'] || '',
      });
    } else {
      needInstall.push({
        PC_name: kr.PC_name.value,
        user_name: kr.user_name?.value || '',
        dept_name: kr.dept_name?.value || '',
        mail: kr.mail?.value || '',
        kintone_record_id: kr.$id?.value || '',
      });
    }
  }
  for (const [name, sr] of skyMap) {
    if (!kinMap.has(name)) {
      const pcName = sr['コンピューター名'] || '';
      const u = pcName.trim().toUpperCase();
      // 推定原因タグ (精査の手がかり)
      let 推定原因 = '';
      if (u.startsWith('KS') || u.startsWith('JBIS')) {
        推定原因 = 'kintone 側マスタ更新漏れの可能性 (廃却 / 共有移行 / 保管移行)';
      } else if (u.startsWith('JREJS')) {
        推定原因 = 'JR 端末 (個人 type 対象外・正常)';
      } else if (u.startsWith('SERVER')) {
        推定原因 = 'サーバー類 (除外漏れ要確認)';
      } else {
        推定原因 = '命名規則外 (要個別確認)';
      }
      orphanInSkysea.push({
        コンピューター名: pcName,
        prefix: u.match(/^[A-Z]+/) ? u.match(/^[A-Z]+/)[0] : '',
        推定原因,
        表示名: sr['表示名'] || '',
        部署名: sr['部署名'] || '',
        最終起動日時: sr['最終起動日時'] || '',
        端末機タイプ: sr['端末機タイプ'] || '',
        ログオンユーザー: sr['ログオンユーザー'] || '',
      });
    }
  }

  // --- Step 5: 結果出力 ---
  fs.mkdirSync(path.dirname(OUT_NEEDS_INSTALL), { recursive: true });
  writeCsvUtf8Bom(OUT_NEEDS_INSTALL, needInstall,
    ['PC_name','user_name','dept_name','mail','kintone_record_id']);
  writeCsvUtf8Bom(OUT_ALREADY, okBoth,
    ['PC_name','user_name_kintone','user_name_skysea','dept_kintone','dept_skysea','kintone_record_id','skysea_last_boot','skysea_version']);
  writeCsvUtf8Bom(OUT_ORPHAN, orphanInSkysea,
    ['コンピューター名','prefix','推定原因','表示名','部署名','最終起動日時','端末機タイプ','ログオンユーザー']);

  // --- Step 6: 集計レポート ---
  console.log(`## Step 3: 突合結果`);
  console.log('');
  console.log(`| 分類 | 件数 | 出力ファイル |`);
  console.log(`|---|---|---|`);
  console.log(`| 🟢 両方あり (正常) | ${okBoth.length} | \`${OUT_ALREADY}\` |`);
  console.log(`| 🔴 **要インストール** (kintone あり / SKYSEA 無し) | **${needInstall.length}** | \`${OUT_NEEDS_INSTALL}\` |`);
  console.log(`| 🟡 SKYSEA のみ (kintone 側マスタ更新候補) | ${orphanInSkysea.length} | \`${OUT_ORPHAN}\` |`);
  console.log('');
  console.log(`## Step 4: ライセンス充足チェック`);
  const licenseTotal = 241;
  const licenseUsed = 158;
  const licenseRemain = licenseTotal - licenseUsed;
  console.log(`- 保有ライセンス: ${licenseTotal}`);
  console.log(`- 現在使用中: ${licenseUsed}`);
  console.log(`- **残ライセンス: ${licenseRemain}**`);
  console.log(`- 要インストール: **${needInstall.length}**`);
  if (needInstall.length <= licenseRemain) {
    console.log(`- 判定: ✅ **ライセンス内で全インストール可能** (残 ${licenseRemain - needInstall.length} ライセンスの余裕あり)`);
  } else {
    console.log(`- 判定: ⚠️ **ライセンス不足** (${needInstall.length - licenseRemain} ライセンス追加発注が必要)`);
  }
  console.log('');

  if (skyDup.length || kinDup.length) {
    console.log(`## Step 5: ⚠ 重複検出 (要対処)`);
    if (skyDup.length) console.log(`- SKYSEA 内 PC_name 重複: ${skyDup.length} 件 (${skyDup.slice(0,5).join(', ')}${skyDup.length>5?', ...':''})`);
    if (kinDup.length) console.log(`- kintone 内 PC_name 重複: ${kinDup.length} 件 (${kinDup.slice(0,5).join(', ')}${kinDup.length>5?', ...':''})`);
    console.log('');
  }

  // 要インストール上位 10 件サンプル (匿名化)
  if (needInstall.length > 0) {
    console.log(`## Step 6: 🔴 要インストール 上位 5 件サンプル (PC名のみ表示)`);
    needInstall.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.PC_name}  (${r.dept_name || '部署不明'})`);
    });
    if (needInstall.length > 5) console.log(`  ... 他 ${needInstall.length - 5} 件 → CSV ご確認ください`);
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
