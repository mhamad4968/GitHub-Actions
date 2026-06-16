#!/usr/bin/env node
/**
 * 台帳 v1 クローズ用ドキュメント雛形（scaffold）— R41/R43/R45/R46 拡張
 *
 * Usage:
 *   npm run kintone:ledger-v1-scaffold -- --id jr-ipad-ledger --label "JR iPad" --apps 720,721 --dirs jr-ipad-db,jr-ipad-dash --date 2026-06-15
 *   npm run kintone:ledger-v1-scaffold -- --id my-ledger --label "My" --apps 800,801 --dirs my-db,my-dash --emit-scripts
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const out = {
    id: '',
    label: '',
    apps: '',
    dirs: '',
    date: new Date().toISOString().slice(0, 10),
    spec: '',
    emitScripts: false,
  };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id') out.id = args[++i] || '';
    else if (args[i] === '--label') out.label = args[++i] || '';
    else if (args[i] === '--apps') out.apps = args[++i] || '';
    else if (args[i] === '--dirs') out.dirs = args[++i] || '';
    else if (args[i] === '--date') out.date = args[++i] || out.date;
    else if (args[i] === '--spec') out.spec = args[++i] || '';
    else if (args[i] === '--emit-scripts') out.emitScripts = true;
  }
  return out;
}

function laneSlug(id) {
  return id.replace(/-ledger$/, '').replace(/-/g, '_');
}

function main() {
  const a = parseArgs();
  if (!a.id || !a.label || !a.apps || !a.dirs) {
    console.error('Required: --id --label --apps --dirs');
    process.exit(1);
  }
  const appList = a.apps.split(',').map((s) => s.trim());
  const dirList = a.dirs.split(',').map((s) => s.trim());
  const dbApp = appList[0];
  const dashApp = appList[1] || '?';
  const dbDir = dirList[0] || '?';
  const dashDir = dirList[1] || '?';
  const laneKebab = a.id.replace(/-ledger$/, '');
  const specName = a.spec || `docs/plans/${a.date}-${a.id}-kintone-spec.md`;
  const completion = `docs/reports/${a.date}-${a.id}-completion.md`;
  const templateSpec = 'docs/plans/_TEMPLATE-kintone-ledger-spec.md';

  const completionMd = `# ${a.label} — 完成サマリー（${a.date}）

**仕様正本**: \`${specName}\`
**クローズ checklist**: \`docs/runbooks/kintone-ledger-v1-closure-checklist.md\`（R41）

## アプリ

| ID | customize dir |
|----|---------------|
${appList.map((id, i) => `| ${id} | \`customize/${dirList[i] || '?'}\` |`).join('\n')}

## クローズチェック（R41）

- [ ] 完成サマリー（本ファイル）
- [ ] SPEC 状態 **v1 完成 — CLOSED**
- [ ] \`data/cio-project-closures.json\` 登録
- [ ] \`kintone-apps.md\` + live-builds + registry
- [ ] checkpoint 先頭 + handoff 末尾 + SESSION-CLOSE
- [ ] \`npm run lint:customize\`
- [ ] \`npm run verify:kintone-project-close-gate\`
- [ ] \`npm run verify:checkpoint-project-closure\`
- [ ] \`npm run cio:project:close -- --verify\`
- [ ] \`npm run cio:session:close-git -- --execute --auto-stage --message "[CLOSE] …"\`
- [ ] GitHub CI success（\`gh run list --branch main\`）
`;

  const closureJson = {
    id: a.id,
    laneId: a.id,
    label: a.label,
    status: 'closed-v1',
    closedAt: a.date,
    completionReport: completion,
    kintoneAppsSection: `${a.label}（${appList.join('/')})`,
    kintoneAppsStateMarker: 'v1 完成',
    forbiddenNextTaskPatterns: [a.label, laneKebab, ...appList],
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

  const specPath = path.join(root, specName);
  if (!fs.existsSync(specPath) && fs.existsSync(path.join(root, templateSpec))) {
    let specTpl = fs.readFileSync(path.join(root, templateSpec), 'utf8');
    specTpl = specTpl.replace('<プロジェクト名>', a.label);
    specTpl = specTpl.replace('YYYY-MM-DD', a.date);
    fs.mkdirSync(path.dirname(specPath), { recursive: true });
    fs.writeFileSync(specPath, specTpl, 'utf8');
    console.log(`wrote ${specName} (from template)`);
  }

  if (a.emitScripts) {
    const syncScript = `scripts/${laneKebab}-sync-dash-db-id.mjs`;
    const bundleScript = `scripts/${laneKebab}-bundle-dash.mjs`;
    const appIdsJson = `scripts/data/${laneKebab}-app-ids.json`;

    const syncContent = `#!/usr/bin/env node
/** R43 — APP_DB sync from ${appIdsJson} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppIdsFromJson, patchAppDbInDashSrc } from './lib/kintone-sync-dash-db-id.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dbAppId, dashAppId } = loadAppIdsFromJson(path.join(root, '${appIdsJson}'));
if (!dbAppId) {
  console.error('dbAppId missing');
  process.exit(1);
}
patchAppDbInDashSrc({
  dashSrcPath: path.join(root, 'customize/${dashDir}/desktop.src.js'),
  dbAppId,
});
console.log('patched APP_DB=' + dbAppId, 'dashAppId=' + dashAppId);
`;

    const bundleContent = `#!/usr/bin/env node
/** R43 — sync → bundle → lint */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleDashWithSync } from './lib/kintone-bundle-dash-with-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
bundleDashWithSync({
  root,
  syncScriptRel: '${syncScript}',
  dashDirRel: 'customize/${dashDir}',
});
`;

    for (const [rel, content] of [
      [syncScript, syncContent],
      [bundleScript, bundleContent],
    ]) {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content, 'utf8');
        console.log(`wrote ${rel}`);
      }
    }

    const idsPath = path.join(root, appIdsJson);
    if (!fs.existsSync(idsPath)) {
      fs.mkdirSync(path.dirname(idsPath), { recursive: true });
      fs.writeFileSync(
        idsPath,
        JSON.stringify({ dbAppId: Number(dbApp) || 0, dashAppId: Number(dashApp) || 0 }, null, 2) + '\n',
        'utf8',
      );
      console.log(`wrote ${appIdsJson}`);
    }

    console.log('\n--- npm scripts 案 ---');
    console.log(`"${laneKebab}:sync-dash": "node ${syncScript}"`);
    console.log(`"${laneKebab}:bundle-dash": "node ${bundleScript}"`);
    console.log(`"deploy:${dbApp}": "node scripts/kintone-deploy-customize.mjs --app ${dbApp}"`);
    console.log(`"deploy:${dashApp}": "node scripts/kintone-deploy-customize.mjs --app ${dashApp}"`);
  }

  console.log('\n--- closure JSON snippet ---\n');
  console.log(JSON.stringify(closureJson, null, 2));
  console.log('\n--- checkpoint 凍結行案 ---\n');
  console.log(`| **${a.label} ${appList.join('/')} の v1 再実装**（クローズ後の無断再開） | v2 — 浜田 GO 後 |`);
  console.log(`\n正本: docs/runbooks/kintone-ledger-v1-closure-checklist.md`);
  process.exit(0);
}

main();
