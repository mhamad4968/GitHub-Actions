#!/usr/bin/env node
/**
 * META チャーター Desktop read-pack 31–33 整合
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  META_CHARTER_DESKTOP_MAX_PREFIX,
  META_CHARTER_DESKTOP_SYNC,
} from './lib/constitution-meta-charters-desktop.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readPackDir = path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack');

function main() {
  const issues = [];
  const cold = fs.readFileSync(path.join(root, 'scripts/sync-session-starter-to-desktop.mjs'), 'utf8');
  if (!cold.includes('generate-constitution-meta-charters-desktop.mjs')) {
    issues.push('sync-session-starter-to-desktop missing meta-charters generator');
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['constitution:sync-meta-charters-desktop']) {
    issues.push('package.json missing constitution:sync-meta-charters-desktop');
  }

  const indexPath = path.join(readPackDir, '08-INDEX.txt');
  if (fs.existsSync(indexPath)) {
    const index = fs.readFileSync(indexPath, 'utf8');
    for (const { desktop } of META_CHARTER_DESKTOP_SYNC) {
      if (!index.includes(desktop)) issues.push(`08-INDEX.txt missing ${desktop}`);
    }
    if (!index.includes('31〜33')) issues.push('08-INDEX.txt missing 31〜33 range note');
  } else {
    issues.push('missing 08-INDEX.txt');
  }

  for (const { desktop, src, needle } of META_CHARTER_DESKTOP_SYNC) {
    const srcPath = path.join(root, src);
    const packPath = path.join(readPackDir, desktop);
    if (!fs.existsSync(srcPath)) {
      issues.push(`missing source ${src}`);
      continue;
    }
    if (!fs.existsSync(packPath)) {
      issues.push(`missing read-pack ${desktop} — run constitution:sync-meta-charters-desktop`);
      continue;
    }
    const packText = fs.readFileSync(packPath, 'utf8').replace(/\r\n/g, '\n');
    const srcBody = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n').trim();
    if (!packText.includes(needle)) {
      issues.push(`${desktop} missing needle "${needle}"`);
    }
    if (!packText.includes(src)) {
      issues.push(`${desktop} missing source pointer ${src}`);
    }
    const bodyStart = packText.indexOf('# ');
    const packBody = bodyStart >= 0 ? packText.slice(bodyStart).trim() : packText.trim();
    if (packBody !== srcBody) {
      issues.push(`${desktop} stale vs ${src} — run constitution:sync-meta-charters-desktop`);
    }
  }

  if (META_CHARTER_DESKTOP_MAX_PREFIX < 33) {
    issues.push('META_CHARTER_DESKTOP_MAX_PREFIX too low');
  }

  if (issues.length) {
    console.error('[verify:constitution-meta-charters-desktop] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log(
    `[verify:constitution-meta-charters-desktop] OK (${META_CHARTER_DESKTOP_SYNC.length} charters · 31–33)`,
  );
  process.exit(0);
}

main();
