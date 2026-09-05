#!/usr/bin/env node
/**
 * kintone-apps.md ## アプリ一覧 の appId が
 * data/kintone-ai-team-app-registry.json に無いと RED。
 * オフラインのみ（kintone API 禁止）。月次 LIVE audit 前の漏れ防止（2026-09-05 F1 776）。
 *
 * Usage: npm run verify:kintone-ai-team-registry-parity
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { KINTONE_AI_TEAM_SCOPE_IDS } from './lib/kintone-ai-team-app-registry.mjs';
import {
  findManagedIdsMissingFromRegistry,
  parseManagedAppsFromMarkdown,
} from './lib/kintone-app-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdownPath = path.join(root, 'kintone-apps.md');

const markdown = fs.readFileSync(markdownPath, 'utf8');
const managedApps = parseManagedAppsFromMarkdown(markdown);
const missing = findManagedIdsMissingFromRegistry(
  managedApps,
  KINTONE_AI_TEAM_SCOPE_IDS,
);

if (missing.length) {
  console.error(
    `[verify:kintone-ai-team-registry-parity] NG kintone-apps.md の管理IDが data/kintone-ai-team-app-registry.json に未登録: ${missing.join(', ')}`,
  );
  process.exit(1);
}

console.log(
  `[verify:kintone-ai-team-registry-parity] OK listed=${managedApps.length} scope=${KINTONE_AI_TEAM_SCOPE_IDS.length}`,
);
