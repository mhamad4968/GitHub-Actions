import fs from 'node:fs';

const s = fs.readFileSync('customize/627/desktop.js', 'utf8');
const i0 = s.indexOf('  const esc627PrintHtml');
const i1 = s.indexOf('const resolve627PrintRecord');
console.log('i0', i0, 'i1', i1);
if (i0 < 0 || i1 < 0) throw new Error('markers not found');
const layout = `  const JBIS674_PRINT_LAYOUT = [
    [
      { label: '部署名', code: 'dept_name' },
      { label: '利用者名', code: 'user_name' },
      { label: 'PC名', code: 'pc_name' },
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

`;
let chunk = layout + s.slice(i0, i1);
chunk = chunk
  .replace(/627Print/g, '674Print')
  .replace(/jbis627/g, 'jbis674')
  .replace(/open627SystemInfoPrintWindow/g, 'open674SystemInfoPrintWindow')
  .replace(/FC627_ACCOUNT_TYPE/g, 'FC_ACCOUNT_TYPE')
  .replace(/const isShared = accTypeRaw === '共有アカウント';/, 'const isShared = accTypeRaw === TYPE_SHARED || accTypeRaw === TYPE_JR;')
  .replace(/label: '共有アカウント'/, "label: accTypeRaw || '共有・JR'")
  .replace(/title: 'アカウント管理台帳（共有）'/, "title: '新・PC台帳ver.1（共有・JR）'")
  .replace(/title: 'アカウント管理台帳',/, "title: '新・PC台帳ver.1',")
  .replace(/<title>アカウント台帳・システム情報<\/title>/, '<title>新・PC台帳・システム情報</title>');
chunk = chunk.replace(/JBIS627_PRINT_LAYOUT/g, 'JBIS674_PRINT_LAYOUT');
chunk = chunk.replace(/build627PrintTierHtml/g, 'build674PrintTierHtml');
chunk = chunk.replace(/get627PrintCellValue/g, 'get674PrintCellValue');
chunk = chunk.replace(/get627PrintFieldValue/g, 'get674PrintFieldValue');
chunk = chunk.replace(/isPrint627CellEmpty/g, 'isPrint674CellEmpty');
chunk = chunk.replace(/esc627PrintHtml/g, 'esc674PrintHtml');
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/print674-from627.js', chunk);
console.log('wrote tmp/print674-from627.js', chunk.length);
