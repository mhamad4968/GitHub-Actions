/**
 * C-4 プレビュー生成スクリプト（本番投入前の見栄え確認用）
 * 生成先: tmp/c4-preview/*.html
 *
 * 実装: customize/627/desktop.js の `open627SystemInfoPrintWindow` と
 *       同じテンプレート/テーマロジックをローカル用に再現する。
 * 用途: ブラウザで開いて 3 パターンの見た目を確認する。
 *
 * 実行:
 *   node scripts/preview-c4-print.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'tmp', 'c4-preview');

const PRINT_LAYOUT = [
  [
    { label: '部署名', code: 'dept_name' },
    { label: '社員名', code: 'user_name' },
    { label: 'PC名', code: 'PC_name' },
  ],
  [
    { label: 'メールアドレス', code: 'mail' },
    { label: 'メールアカウント', code: 'mail_acct' },
    { label: 'メールパスワード', code: 'mail_pw' },
  ],
  [
    { label: 'WindowsID', code: 'logon_name' },
    { label: 'Windowsパスワード', code: 'logon_pw' },
  ],
  [
    { label: 'サイボウズID', code: 'sb_id' },
    { label: 'サイボウズパスワード', code: 'sb_pw' },
  ],
  [
    { label: 'ガリバーID', code: 'gb_id' },
    { label: 'ガリバーパスワード', code: 'gb_pw' },
  ],
  [
    { label: 'M365ID', code: 'm365_id' },
    { label: 'M365パスワード', code: 'm365_pw' },
  ],
  [
    { label: 'VPN ID(KDDI)', code: 'vpn_id' },
    { label: 'VPNパスワード', code: 'vpn_pw' },
  ],
];

const escHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const cellVal = (rec, code) => String(rec[code] ?? '');

// C-4 v3.1: ハイフン系記号 (---, ----, ー, —, －, ‐, –, ―, ｰ) と空白だけの文字列を「実質空」と判定
const isCellEmpty = (raw) =>
  /^[\s\u002D\u2010\u2013\u2014\u2015\u30FC\uFF70\uFF0D]*$/u.test(String(raw ?? ''));

const buildTier = (rec, cells, idx) => {
  const isLead = idx === 0;
  if (!isLead) {
    const allEmpty = cells.every((c) => isCellEmpty(cellVal(rec, c.code)));
    if (allEmpty) return '';
  }
  let cls = 'jbis627-tier';
  if (isLead) cls += ' jbis627-tier--lead';
  const ncol = cells.length;
  if (ncol === 3) cls += ' jbis627-tier--cols3';
  else if (ncol === 2) {
    cls += ' jbis627-tier--cols2';
    if (cells[0]?.code === 'm365_id') cls += ' jbis627-tier--m365';
  }
  const cellsHtml = cells.map((cell) => {
    const raw = cellVal(rec, cell.code);
    const empty = isCellEmpty(raw);
    const val = empty ? '---' : raw.trim();
    const dim = empty ? ' style="color:#94a3b8;font-style:italic"' : '';
    return `<div class="jbis627-cell"><div class="jbis627-lab">${escHtml(cell.label)}</div><div class="jbis627-val"${dim}>${escHtml(val)}</div></div>`;
  }).join('');
  return `<div class="${cls}">${cellsHtml}</div>`;
};

const personalTheme = {
  label: '個人アカウント',
  title: 'アカウント管理台帳',
  subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
  notice: 'アカウント情報の管理は個人の責任で行ってください。'
    + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
  heroBg: '#d1fae5',
  heroFg: '#134e4a',
  heroBorder: '#a7f3d0',
  heroSub: '#365f52',
  noticeBorder: '#0d9488',
  noticeBg: '#d1fae5',
  noticeFg: '#134e4a',
  badgeBg: '#ecfdf5',
  badgeBorder: '#86efac',
  badgeFg: '#166534',
  cardBorder: '#bbf7d0',
  bodyBg: '#ecfdf5',
  tierLeadBg: '#f0fdf4',
  tierLeadBorder: '#dcfce7',
  tierEvenBg: '#f7fef9',
  shadowColor: 'rgba(15,118,110,.12)',
};

const sharedTheme = {
  label: '共有アカウント',
  title: 'アカウント管理台帳（共有）',
  subtitle: 'システム情報（印刷用）。本紙は機密性の高い内容を含みます。',
  notice: '本アカウントは複数メンバーで<b>共有して利用するID/PW</b>です。'
    + 'ID・パスワードを変更した場合は<b>関係者全員に必ず共有</b>してください。'
    + '印刷物の紛失・置き忘れ・第三者への提示がないよう、適切に保管してください。',
  heroBg: '#ffe4e6',
  heroFg: '#881337',
  heroBorder: '#fecdd3',
  heroSub: '#9f1239',
  noticeBorder: '#e11d48',
  noticeBg: '#ffe4e6',
  noticeFg: '#881337',
  badgeBg: '#fff1f2',
  badgeBorder: '#fda4af',
  badgeFg: '#9f1239',
  cardBorder: '#fecdd3',
  bodyBg: '#fff1f2',
  tierLeadBg: '#fff5f7',
  tierLeadBorder: '#ffe4e6',
  tierEvenBg: '#fff8f9',
  shadowColor: 'rgba(159,18,57,.12)',
};

const buildHtml = (rec, theme, recNo) => {
  const bodyInner = PRINT_LAYOUT.map((tier, i) => buildTier(rec, tier, i)).filter(Boolean).join('');
  const metaLine = `${recNo ? `No. ${escHtml(recNo)} \u00b7 ` : ''}${escHtml(new Date().toLocaleString('ja-JP'))}`;
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>アカウント台帳・システム情報（プレビュー）</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&amp;display=swap">
<style>
:root{
--hero-bg:${theme.heroBg};--hero-fg:${theme.heroFg};--hero-border:${theme.heroBorder};--hero-sub:${theme.heroSub};
--notice-border:${theme.noticeBorder};--notice-bg:${theme.noticeBg};--notice-fg:${theme.noticeFg};
--badge-bg:${theme.badgeBg};--badge-border:${theme.badgeBorder};--badge-fg:${theme.badgeFg};
--card-border:${theme.cardBorder};--body-bg:${theme.bodyBg};
--tier-lead-bg:${theme.tierLeadBg};--tier-lead-border:${theme.tierLeadBorder};--tier-even-bg:${theme.tierEvenBg};
--shadow-color:${theme.shadowColor};
}
*{box-sizing:border-box;}
body{margin:0;padding:28px 20px 40px;background:var(--body-bg);font-family:"Noto Sans JP",system-ui,sans-serif;color:#0f172a;}
.jbis627-wrap{max-width:880px;margin:0 auto;}
.jbis627-hero{background:var(--hero-bg);color:var(--hero-fg);padding:26px 28px 22px;border-radius:18px 18px 0 0;
border:1px solid var(--hero-border);border-bottom:none;box-shadow:0 10px 28px var(--shadow-color);position:relative;}
.jbis627-hero h1{margin:0;font-size:1.35rem;font-weight:700;letter-spacing:.02em;}
.jbis627-hero p{margin:10px 0 0;font-size:12px;font-weight:500;line-height:1.65;color:var(--hero-sub);}
.jbis627-badge{display:inline-block;margin-top:12px;padding:4px 12px;border-radius:999px;
background:var(--badge-bg);font-size:11px;font-weight:700;letter-spacing:.04em;
border:1px solid var(--badge-border);color:var(--badge-fg);}
.jbis627-notice{margin:0;padding:14px 18px 16px;border-left:4px solid var(--notice-border);background:var(--notice-bg);
border-bottom:1px solid var(--hero-border);}
.jbis627-notice p{margin:0;font-size:12px;font-weight:600;line-height:1.7;color:var(--notice-fg);}
.jbis627-card{background:#fff;border-radius:0 0 18px 18px;box-shadow:0 18px 40px rgba(15,23,42,.08);
overflow:hidden;border:1px solid var(--card-border);border-top:none;}
.jbis627-tier{display:grid;gap:0;padding:0;border-bottom:1px solid #e2e8f0;}
.jbis627-tier--cols1{grid-template-columns:1fr;}
.jbis627-tier--cols2{grid-template-columns:1fr 1fr;}
.jbis627-tier--cols3{grid-template-columns:1fr 1fr 1fr;}
.jbis627-tier--m365{grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);}
.jbis627-tier--memo .jbis627-cell--memo{min-height:0;padding:18px 20px 22px;border-right:none;}
.jbis627-lab--memo{text-transform:none;letter-spacing:0.04em;font-size:11px;font-weight:700;color:#475569;margin-bottom:8px;line-height:1.35;}
.jbis627-memo-space{min-height:72px;border:1px dashed #94a3b8;border-radius:6px;background:#f8fafc;margin-top:10px;}
.jbis627-tier:last-child{border-bottom:none;}
.jbis627-cell{padding:18px 20px 20px;background:#fff;border-right:1px solid #f1f5f9;min-height:92px;}
.jbis627-cell:last-child{border-right:none;}
.jbis627-tier:nth-child(even) .jbis627-cell{background:var(--tier-even-bg);}
.jbis627-tier--lead .jbis627-cell{background:var(--tier-lead-bg);padding:22px 22px 24px;min-height:108px;border-right:1px solid var(--tier-lead-border);}
.jbis627-tier--lead .jbis627-lab{font-size:12px;font-weight:700;color:#475569;letter-spacing:.06em;text-transform:none;margin-bottom:10px;}
.jbis627-tier--lead .jbis627-val{font-size:1.35rem;font-weight:700;line-height:1.45;color:#0f172a;}
.jbis627-lab{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;line-height:1.3;}
.jbis627-val{font-size:14px;font-weight:600;line-height:1.55;color:#0f172a;word-break:break-word;min-height:1.4em;font-feature-settings:"tnum";}
.jbis627-foot{margin-top:22px;text-align:center;font-size:11px;color:#64748b;font-weight:500;}
</style></head><body>
<div class="jbis627-wrap">
<header class="jbis627-hero">
<h1>${escHtml(theme.title)}</h1>
<p>${escHtml(theme.subtitle)}</p>
<span class="jbis627-badge">${escHtml(theme.label)}</span>
</header>
<aside class="jbis627-notice" role="note">
<p>${theme.notice}</p>
</aside>
<div class="jbis627-card">
${bodyInner}
<div class="jbis627-tier jbis627-tier--cols1 jbis627-tier--memo">
<div class="jbis627-cell jbis627-cell--memo">
<div class="jbis627-lab jbis627-lab--memo">その他・メモ（手書き用）</div>
<div class="jbis627-memo-space" aria-hidden="true"></div>
</div></div>
</div>
<p class="jbis627-foot">${metaLine} ・ <strong>これはプレビューです（実際の印刷とほぼ同じ見た目）</strong></p>
</div></body></html>`;
};

const recPersonalFull = {
  dept_name: 'IT サポート',
  user_name: '山田 太郎',
  PC_name: 'jrejs-tokyo123',
  mail: 't.yamada@example.co.jp',
  mail_acct: 't.yamada',
  mail_pw: 'Mail!Pass1',
  logon_name: 't.yamada',
  logon_pw: 'Logon@Pass2',
  sb_id: 't.yamada',
  sb_pw: 'Sybz#Pass3',
  gb_id: 't.yamada',
  gb_pw: 'Glvr$Pass4',
  m365_id: 't.yamada@jrjis.onmicrosoft.com',
  m365_pw: 'M365%Pass5',
  vpn_id: 'jrjis_vpn_001',
  vpn_pw: 'Vpn^Pass6',
};
const recPersonalNoVpn = { ...recPersonalFull, vpn_id: '', vpn_pw: '' };
// 実データに準拠: 過去運用で「未使用」を示すため `----` が手入力されているレコードを再現
const recShared = {
  dept_name: '本社',
  user_name: '本社管理者',
  PC_name: 'JBIS0055-202602',
  mail: '', mail_acct: '----', mail_pw: '----',
  logon_name: 'jbm0055', logon_pw: 'jbm0055',
  sb_id: '----', sb_pw: '----',
  gb_id: '----', gb_pw: '----',
  m365_id: 'jbis001@kensetsutoso01.onmicrosoft.com', m365_pw: 'kent2511K#',
  vpn_id: '', vpn_pw: '',
};

const indexHtml = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>C-4 印刷帳票プレビュー</title>
<style>
body{font-family:"Noto Sans JP",system-ui,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px;line-height:1.7;}
.wrap{max-width:780px;margin:0 auto;}
h1{font-size:1.4rem;margin:0 0 6px;}
.sub{color:#64748b;font-size:13px;margin-bottom:24px;}
.card{background:#fff;border-radius:12px;padding:20px 22px;margin:14px 0;box-shadow:0 4px 14px rgba(15,23,42,.06);border:1px solid #e2e8f0;}
.card h2{margin:0 0 6px;font-size:1.05rem;}
.card .desc{color:#475569;font-size:13px;margin-bottom:10px;}
.card a{display:inline-block;padding:8px 14px;background:#0d9488;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;}
.card a:hover{background:#0f766e;}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;}
.tag-green{background:#d1fae5;color:#166534;}
.tag-rose{background:#ffe4e6;color:#9f1239;}
.note{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:18px 0;font-size:13px;}
</style></head><body><div class="wrap">
<h1>C-4 印刷帳票プレビュー</h1>
<p class="sub">本番投入前の見た目確認用です。実際のシステム情報印刷とほぼ同じ HTML/CSS で出力しています。</p>

<div class="note">
<strong>確認のポイント</strong><br>
① 個人アカウントは <span class="tag tag-green">緑</span> テーマで表示される<br>
② 共有アカウントは <span class="tag tag-rose">ローズ</span> テーマで表示される<br>
③ 値が空欄の段（VPN・サイボウズなど）は印刷物に出ない<br>
④ 1段目（部署名/社員名/PC名）は常に出る
</div>

<div class="card">
<h2><span class="tag tag-green">個人</span>VPN あり（フル項目）</h2>
<p class="desc">全段フル入力ケース。VPN もガリバーもサイボウズも全部出ます。</p>
<a href="./personal-with-vpn.html" target="_blank">プレビューを開く →</a>
</div>

<div class="card">
<h2><span class="tag tag-green">個人</span>VPN なし（実務で多いケース）</h2>
<p class="desc">VPN ID/PW が空のため、<strong>VPN 段が自動で消えます</strong>。他は出ます。</p>
<a href="./personal-no-vpn.html" target="_blank">プレビューを開く →</a>
</div>

<div class="card">
<h2><span class="tag tag-rose">共有</span>WindowsID + M365 のみ</h2>
<p class="desc">メール・サイボウズ・ガリバー・VPN が空のため、それらの段は消え、<strong>Windows と M365 の2段だけ</strong>になります。ヘッダのローズ色と「共有アカウント」バッジで一目で識別できます。</p>
<a href="./shared-account.html" target="_blank">プレビューを開く →</a>
</div>

<p class="sub" style="margin-top:24px;">※ Ctrl+P で実際の印刷プレビューも確認できます。</p>
</div></body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'index.html'), indexHtml, 'utf8');
writeFileSync(resolve(OUT_DIR, 'personal-with-vpn.html'), buildHtml(recPersonalFull, personalTheme, '12345'), 'utf8');
writeFileSync(resolve(OUT_DIR, 'personal-no-vpn.html'), buildHtml(recPersonalNoVpn, personalTheme, '12346'), 'utf8');
writeFileSync(resolve(OUT_DIR, 'shared-account.html'), buildHtml(recShared, sharedTheme, '67890'), 'utf8');

console.log('✅ プレビュー生成完了:');
console.log(`   ${OUT_DIR}/index.html`);
console.log(`   ${OUT_DIR}/personal-with-vpn.html`);
console.log(`   ${OUT_DIR}/personal-no-vpn.html`);
console.log(`   ${OUT_DIR}/shared-account.html`);
