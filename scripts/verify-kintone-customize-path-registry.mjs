#!/usr/bin/env node
/**
 * R37 — customize パス registry の整合（ディスク実在 + field-registry 一致）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getCustomizeDirToApp } from './lib/kintone-customize-path-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const mappings = getCustomizeDirToApp(root);

  for (const [dir, appId] of Object.entries(mappings)) {
    const rel = path.join('customize', dir, 'desktop.js');
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`registry ${dir}→${appId} だが ${rel} 不在`);
    }
    if (!/^\d+$/.test(String(appId))) {
      issues.push(`appId 非数値: ${dir}→${appId}`);
    }
  }

  const fieldRegPath = path.join(root, 'data/kintone-field-registry.json');
  if (fs.existsSync(fieldRegPath)) {
    const fieldReg = JSON.parse(fs.readFileSync(fieldRegPath, 'utf8'));
    for (const [appId, meta] of Object.entries(fieldReg.apps || {})) {
      for (const dir of meta.customizeDirs || []) {
        const expected = mappings[dir];
        if (expected && expected !== String(appId)) {
          issues.push(
            `field-registry ${appId}.customizeDirs ${dir} と registry mappings ${expected} が不一致`,
          );
        }
      }
    }
  }

  const live = getCustomizeDirToApp(root);
  const count = Object.keys(live).length;
  if (count < 20) {
    issues.push(`mappings 件数が少なすぎる (${count})`);
  }

  if (issues.length) {
    console.error('[verify:kintone-customize-path-registry] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log(`[verify:kintone-customize-path-registry] OK R37 ${count} mappings`);
  process.exit(0);
}

main();
