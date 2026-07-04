#!/usr/bin/env node
/**
 * B-3b — desktop.ui.js → desktop.js 同期ゲート（build 漏れ・deploy 先祖返り防止）
 *
 * - syncAnchors: ui の特徴文字列が desktop.js に含まれること
 * - mtime: desktop.js が desktop.ui.js より古くないこと（--skip-mtime で deploy 直後のみ緩和可）
 *
 * deploy-gate は build-desktop の後に本ゲートを実行すること。
 */
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const invPath = path.join(root, 'scripts/data/jikkou-yosan-ux-invariants.json');
const skipMtime = process.argv.includes('--skip-mtime');

function loadInv() {
  return JSON.parse(readFileSync(invPath, 'utf8'));
}

function main() {
  const inv = loadInv();
  const uiRel = inv.files?.ui || 'customize/736/desktop.ui.js';
  const builtRel = inv.files?.built || 'customize/736/desktop.js';
  const uiAbs = path.join(root, uiRel);
  const builtAbs = path.join(root, builtRel);

  if (!existsSync(uiAbs) || !existsSync(builtAbs)) {
    console.error('[jikkou-yosan:ui-js-sync-gate] NG missing ui or built file');
    process.exit(1);
  }

  const uiSrc = readFileSync(uiAbs, 'utf8');
  const builtSrc = readFileSync(builtAbs, 'utf8');
  const fails = [];

  for (const anchor of inv.syncAnchors || []) {
    if (!uiSrc.includes(anchor)) {
      fails.push(`ui missing anchor: ${anchor.slice(0, 60)}…`);
    } else if (!builtSrc.includes(anchor)) {
      fails.push(`built missing anchor from ui: ${anchor.slice(0, 60)}… → npm run jikkou-yosan:build-desktop`);
    }
  }

  if (!skipMtime) {
    const uiM = statSync(uiAbs).mtimeMs;
    const builtM = statSync(builtAbs).mtimeMs;
    if (builtM + 500 < uiM) {
      fails.push(
        `desktop.js older than desktop.ui.js (${Math.round((uiM - builtM) / 1000)}s) — run npm run jikkou-yosan:build-desktop`,
      );
    }
  }

  if (fails.length) {
    console.error('[jikkou-yosan:ui-js-sync-gate] FAIL');
    for (const f of fails) console.error('  -', f);
    process.exit(1);
  }

  console.log('[jikkou-yosan:ui-js-sync-gate] OK', { ui: uiRel, built: builtRel, anchors: (inv.syncAnchors || []).length });
}

main();
