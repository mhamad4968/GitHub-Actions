#!/usr/bin/env node
/**
 * App756 Ver.02 のソースタグと bundle BUILD の一致を検査する。
 * shell に残った JIKKOU_YOSAN_V2_BUILD が旧値を注入する事故を deploy 前に止める。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'customize', 'jikkou-yosan-v2-app1');
const uiPath = path.join(dir, 'desktop.ui.js');
const bundlePath = path.join(dir, 'desktop.js');

function matchTag(text, re, label) {
  const m = text.match(re);
  if (!m) {
    console.error(`[verify-jikkou-v2-build-tag] NG ${label} が見つかりません`);
    process.exit(1);
  }
  return m[1].trim();
}

const ui = fs.readFileSync(uiPath, 'utf8');
const bundle = fs.readFileSync(bundlePath, 'utf8');
const sourceTag = matchTag(ui, /@JY_V2_BUILD\s+(\S+)/, 'desktop.ui.js @JY_V2_BUILD');
const bundleConst = matchTag(
  bundle,
  /const\s+BUILD\s*=\s*["']([^"']+)["']/,
  'desktop.js const BUILD',
);
const bundledSourceTag = matchTag(
  bundle,
  /@JY_V2_BUILD\s+(\S+)/,
  'desktop.js 内 @JY_V2_BUILD',
);

if (sourceTag !== bundleConst || sourceTag !== bundledSourceTag) {
  console.error('[verify-jikkou-v2-build-tag] NG BUILD 不一致 — deploy 禁止');
  console.error(`  source=${sourceTag}`);
  console.error(`  bundleConst=${bundleConst}`);
  console.error(`  bundledSource=${bundledSourceTag}`);
  console.error('  対応: Remove-Item Env:\\JIKKOU_YOSAN_V2_BUILD; npm run jikkou-yosan:v2-build-desktop');
  process.exit(1);
}

console.log(`[verify-jikkou-v2-build-tag] OK BUILD=${sourceTag}`);
