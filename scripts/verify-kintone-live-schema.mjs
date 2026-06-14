#!/usr/bin/env node
/**
 * 実機 kintone スキーマ × customize/** ライブ Linter（§50-3-11 第12層・拡張案1）
 * npm run verify:kintone-live-schema [-- --app 678] [--portfolio] [--offline-skip]
 */
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditApp,
  loadAllowlist,
  listCustomizeJsFiles,
  extractFromFile,
  printFieldIssues,
} from './lib/kintone-field-extract.mjs';
import {
  discoverLiveSchemaApps,
  fetchLiveFormSchema,
  loadDotenv,
} from './lib/kintone-live-schema.mjs';
import { loadRegistry } from './lib/kintone-field-extract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
const appFilter = args.includes('--app') ? args[args.indexOf('--app') + 1] : null;
const portfolio = args.includes('--portfolio');
const offlineSkip = args.includes('--offline-skip');

function auditAgainstLive(appMeta, liveSchema, parentLiveSchema) {
  const allowlist = loadAllowlist(root);
  const allowGlobal = new Set([...(allowlist.global || []), 'trim', 'split', 'map', 'filter']);
  const liveCodes = new Set(liveSchema.fieldCodes);
  if (parentLiveSchema) {
    for (const c of parentLiveSchema.fieldCodes) liveCodes.add(c);
  }
  const issues = [];
  const files = [];

  for (const dir of appMeta.customizeDirs) {
    files.push(...listCustomizeJsFiles(root, allowlist, dir).filter((f) => !/\.bundle\.js$/i.test(f)));
  }
  if (!files.length) return { ok: true, issues: [], files, warning: 'customize JS 無し' };

  const seen = new Map();
  for (const rel of files) {
    for (const hit of extractFromFile(root, rel, allowGlobal)) {
      const prev = seen.get(hit.code);
      if (!prev || hit.confidence === 'high') seen.set(hit.code, hit);
    }
  }

  for (const hit of seen.values()) {
    if (liveCodes.has(hit.code)) continue;
    const severity = hit.confidence === 'high' ? 'error' : 'warn';
    issues.push({
      ...hit,
      severity,
      message: `実機に存在しないフィールド \`${hit.code}\` (${hit.confidence}) — app ${appMeta.appId} revision ${liveSchema.revision}`,
    });
  }

  for (const lk of liveSchema.lookups) {
    for (const m of lk.fieldMappings || []) {
      if (m.field && seen.has(m.field) && !liveCodes.has(m.field)) {
        issues.push({
          code: m.field,
          confidence: 'high',
          file: '(lookup mapping)',
          line: 0,
          severity: 'error',
          message: `ルックアップ \`${lk.field}\` の mapping \`${m.field}\` が実機に無し`,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues, files, liveFieldCount: liveCodes.size };
}

function printLiveIssues(issues) {
  for (const i of issues) {
    const color = i.severity === 'warn' ? YELLOW : RED;
    console.error(`${color}[verify:kintone-live-schema] ${i.message}${RESET}`);
    if (i.file && i.line) console.error(`  at ${i.file}:${i.line} (${i.confidence})`);
  }
}

async function main() {
  loadDotenv(root);
  const registry = loadRegistry(root);
  const apps = discoverLiveSchemaApps(root, { appFilter, portfolio, allCustomize: portfolio });

  if (!apps.length) {
    console.error('[verify:kintone-live-schema] NG 監査対象 app 無し — --app または registry を確認');
    process.exit(1);
  }

  let ng = 0;
  let audited = 0;

  for (const appMeta of apps) {
    let liveSchema;
    let parentLiveSchema = null;
    try {
      liveSchema = await fetchLiveFormSchema(appMeta.appId);
      const reg = registry.apps?.[appMeta.appId];
      if (reg?.inheritsRecordFieldsFrom) {
        parentLiveSchema = await fetchLiveFormSchema(reg.inheritsRecordFieldsFrom);
      }
    } catch (e) {
      if (offlineSkip) {
        console.warn(`[verify:kintone-live-schema] SKIP app=${appMeta.appId} — ${e.message}`);
        continue;
      }
      console.error(`${RED}[verify:kintone-live-schema] NG app=${appMeta.appId} API — ${e.message}${RESET}`);
      ng += 1;
      continue;
    }

    const result = auditAgainstLive(appMeta, liveSchema, parentLiveSchema);
    audited += 1;
    console.log(
      `[verify:kintone-live-schema] app=${appMeta.appId} files=${result.files?.length ?? 0} liveFields=${result.liveFieldCount} revision=${liveSchema.revision}`,
    );
    if (result.warning) console.log(`[verify:kintone-live-schema] WARN ${result.warning}`);

    if (!result.ok) {
      printLiveIssues(result.issues);
      ng += result.issues.length;
    }
  }

  if (!audited && offlineSkip) {
    console.log('[verify:kintone-live-schema] OK (all skipped offline)');
    process.exit(0);
  }

  if (ng) {
    console.error(`${RED}[verify:kintone-live-schema] NG ${ng} 件 — Warning 0 未達・本番 PUT ロック${RESET}`);
    process.exit(1);
  }
  console.log('[verify:kintone-live-schema] OK — 実機スキーマと customize 完全一致（Warning 0）');
  process.exit(0);
}

main().catch((e) => {
  console.error('[verify:kintone-live-schema] FATAL', e.message);
  process.exit(1);
});
