#!/usr/bin/env node
/**
 * S-DOM-SCOPE-01: customize 内の panel.querySelector('tbody') 裸指定を検出
 *   node scripts/verify-dom-scope-tbody.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'customize');
const bad = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      walk(p);
      continue;
    }
    if (!/\.(js|mjs)$/.test(name)) continue;
    if (name.endsWith('.bundle.js')) continue;
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/querySelector\(\s*['"]tbody['"]\s*\)/.test(line)) {
        // allow if comment says scoped helper nearby — still flag for review
        bad.push(`${p}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

walk(root);
if (bad.length) {
  console.error('[verify-dom-scope-tbody] NG — bare querySelector("tbody") found:');
  bad.forEach((b) => console.error(' ', b));
  console.error('Use class-scoped selectors (S-DOM-SCOPE-01).');
  process.exit(1);
}
console.log('[verify-dom-scope-tbody] OK');
