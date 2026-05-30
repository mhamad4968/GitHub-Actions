#!/usr/bin/env node
/**
 * kintone フィールドコード自動マッピング Linter（第11層・タスク①）
 * npm run verify:kintone-fields [-- --app 678] [--medium-fail]
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditApp, loadRegistry, printFieldIssues } from './lib/kintone-field-extract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function main() {
  const appIdx = args.indexOf('--app');
  const appFilter = appIdx >= 0 ? args[appIdx + 1] : null;
  const mediumFail = args.includes('--medium-fail');

  const registry = loadRegistry(root);
  const appIds = appFilter ? [appFilter] : Object.keys(registry.apps || {});

  let ng = 0;
  for (const appId of appIds) {
    const result = auditApp(root, registry, appId, { mediumFail });
    if (result.skipped) continue;
    if (result.warning) console.log(`[verify:kintone-fields] WARN ${result.warning}`);
    console.log(`[verify:kintone-fields] app=${appId} files=${result.files?.length ?? 0} registered=${result.registered?.length ?? 0}`);
    if (!result.ok) {
      printFieldIssues(result.blocking);
      ng += result.blocking.length;
    }
  }

  if (ng) {
    console.error(`[verify:kintone-fields] NG ${ng} 件 — 本番 PUT ロック（registry 更新または allowlist）`);
    process.exit(1);
  }
  console.log('[verify:kintone-fields] OK');
  process.exit(0);
}

main();
