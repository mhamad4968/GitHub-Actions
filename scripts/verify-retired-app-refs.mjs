#!/usr/bin/env node
/**
 * 削除済（retired）アプリ ID が、稼働中 customize / フィールド台帳に
 * REST・URL 代入として残っていないかを検査する。
 *
 * 背景: 596（PC採番マスタ）削除後も 674 買替が参照し続けた事故（2026-08-11）。
 * 棚卸（audit:kintone-app-inventory）は live 有無のみ見ており、コード参照は見ない。
 *
 * Usage: npm run verify:retired-app-refs
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { KINTONE_AI_TEAM_RETIRED_IDS } from './lib/kintone-ai-team-app-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = fileURLToPath(import.meta.url);

/** 履歴 customize（deploy 対象外）— 参照が残っていても本検査の対象外 */
const EXCLUDE_DIR_PREFIXES = [
  ...KINTONE_AI_TEAM_RETIRED_IDS.map((id) => path.join('customize', id) + path.sep),
  path.join('customize', 'ops-guide') + path.sep,
];

const EXCLUDE_BASENAMES = new Set([
  'verify-retired-app-refs.mjs',
  'kintone-ai-team-app-registry.json',
  'kintone-app-inventory-latest.json',
]);

const SCAN_ROOTS = [
  path.join(root, 'customize'),
  path.join(root, 'data', 'kintone-field-registry.json'),
];

function isExcludedRel(relPosix) {
  const base = path.basename(relPosix);
  if (EXCLUDE_BASENAMES.has(base)) return true;
  if (base.endsWith('.bundle.js')) return true;
  const relOs = relPosix.split('/').join(path.sep);
  for (const prefix of EXCLUDE_DIR_PREFIXES) {
    if (relOs.startsWith(prefix) || relOs + path.sep === prefix) return true;
  }
  return false;
}

function collectFiles(abs, out) {
  if (!fs.existsSync(abs)) return;
  const st = fs.statSync(abs);
  if (st.isFile()) {
    out.push(abs);
    return;
  }
  if (!st.isDirectory()) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    collectFiles(path.join(abs, ent.name), out);
  }
}

/**
 * 実行時参照とみなすパターン（履歴コメントの「596」単独言及は除外）
 * @param {string} appId
 */
function buildPatterns(appId) {
  const id = String(appId);
  return [
    new RegExp(`\\bapp\\s*:\\s*['"]${id}['"]`),
    new RegExp(`\\bapp\\s*:\\s*${id}\\b`),
    new RegExp(`\\bappId\\s*:\\s*['"]${id}['"]`),
    new RegExp(`\\bAPP_[A-Z0-9_]+\\s*=\\s*['"]${id}['"]`),
    new RegExp(`/k/${id}/`),
    new RegExp(`['"]${id}['"]\\s*:\\s*\\[`), // relatedAppFieldCodes["596"]: [...]
  ];
}

function scanFile(abs, patternsById) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (isExcludedRel(rel)) return [];
  if (abs === SELF) return [];
  if (!/\.(js|mjs|cjs|ts|json)$/i.test(abs)) return [];

  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch {
    return [];
  }

  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const [appId, patterns] of patternsById) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      // 行コメントのみの履歴言及は許可（「削除済」「テナント削除」等）
      if (/^(\/\/|\*)/.test(trimmed) && /削除|retired|legacy|参照用|履歴/i.test(trimmed)) {
        continue;
      }
      for (const re of patterns) {
        if (re.test(line)) {
          hits.push({ rel, line: i + 1, appId, snippet: trimmed.slice(0, 160) });
          break;
        }
      }
    }
  }
  return hits;
}

function main() {
  const patternsById = new Map(
    KINTONE_AI_TEAM_RETIRED_IDS.map((id) => [id, buildPatterns(id)]),
  );

  const files = [];
  for (const rootPath of SCAN_ROOTS) collectFiles(rootPath, files);

  const hits = [];
  for (const abs of files) {
    hits.push(...scanFile(abs, patternsById));
  }

  if (hits.length) {
    console.error(
      `[verify:retired-app-refs] NG ${hits.length} active ref(s) to retired appId(s)`,
    );
    for (const h of hits.slice(0, 40)) {
      console.error(`  ${h.rel}:${h.line} app=${h.appId}  ${h.snippet}`);
    }
    if (hits.length > 40) console.error(`  ... and ${hits.length - 40} more`);
    console.error(
      '  fix: remove REST/URL to deleted apps, or move path under retired customize/, or register intentional allow only after Hamada GO',
    );
    process.exit(1);
  }

  console.log(
    `[verify:retired-app-refs] OK no active REST/URL refs to ${KINTONE_AI_TEAM_RETIRED_IDS.length} retired appIds`,
  );
}

main();
