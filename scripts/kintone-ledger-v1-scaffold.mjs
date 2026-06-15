#!/usr/bin/env node
/**
 * 台帳 v1 クローズ用ドキュメント雛形（scaffold）
 *
 * Usage:
 *   npm run kintone:ledger-v1-scaffold -- --id jr-ipad-ledger --label "JR iPad" --apps 720,721 --dirs jr-ipad-db,jr-ipad-dash --date 2026-06-15
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const out = { id: '', label: '', apps: '', dirs: '', date: new Date().toISOString().slice(0, 10), spec: '' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id') out.id = args[++i] || '';
    else if (args[i] === '--label') out.label = args[++i] || '';
    else if (args[i] === '--apps') out.apps = args[++i] || '';
    else if (args[i] === '--dirs') out.dirs = args[++i] || '';
    else if (args[i] === '--date') out.date = args[++i] || out.date;
    else if (args[i] === '--spec') out.spec = args[++i] || '';
  }
  return out;
}

function main() {
  const a = parseArgs();
  if (!a.id || !a.label || !a.apps || !a.dirs) {
    console.error('Required: --id --label --apps --dirs');
    process.exit(1);
  }
  const appList = a.apps.split(',').map((s) => s.trim());
  const dirList = a.dirs.split(',').map((s) => s.trim());
  const specName = a.spec || `docs/plans/${a.date}-${a.id}-kintone-spec.md`;
  const completion = `docs/reports/${a.date}-${a.id}-completion.md`;

  const completionMd = `# ${a.label} — 完成サマリー（${a.date}）

**仕様正本**: \`${specName}\`

## アプリ

| ID | customize dir |
|----|---------------|
${appList.map((id, i) => `| ${id} | \`customize/${dirList[i] || '?'}\` |`).join('\n')}

## クローズチェック

- [ ] \`npm run verify:kintone-project-close-gate\`
- [ ] \`npm run cio:project:close -- --verify\`
- [ ] \`kintone-apps.md\` に **v1 完成**
- [ ] \`data/cio-project-closures.json\` 登録
`;

  const closureJson = {
    id: a.id,
    laneId: a.id,
    label: a.label,
    status: 'closed-v1',
    closedAt: a.date,
    completionReport: completion,
    kintoneAppsStateMarker: 'v1 完成',
    forbiddenNextTaskPatterns: [a.label, ...appList],
    note: 'scaffold 生成 — パターン・note を編集して登録',
  };

  const outDir = path.join(root, 'docs/reports');
  fs.mkdirSync(outDir, { recursive: true });
  const completionPath = path.join(root, completion);
  if (!fs.existsSync(completionPath)) {
    fs.writeFileSync(completionPath, completionMd, 'utf8');
    console.log(`wrote ${completion}`);
  } else {
    console.log(`skip exists ${completion}`);
  }

  console.log('\n--- closure JSON snippet ---\n');
  console.log(JSON.stringify(closureJson, null, 2));
  console.log('\n--- checkpoint 凍結行案 ---\n');
  console.log(`| **${a.label} 720/721 の v1 再実装**（クローズ後の無断再開） | v2 — 浜田 GO 後 |`);
  process.exit(0);
}

main();
