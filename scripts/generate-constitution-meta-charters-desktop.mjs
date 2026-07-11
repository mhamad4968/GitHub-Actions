#!/usr/bin/env node
/**
 * META 憲法チャーター 26/27/28 → read-pack 31–33（Desktop 控え）
 * @see npm run constitution:sync-meta-charters-desktop
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { META_CHARTER_DESKTOP_SYNC } from './lib/constitution-meta-charters-desktop.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} repoRoot
 * @returns {{ desktop: string, ok: boolean }[]}
 */
export function generateMetaChartersDesktopFiles(repoRoot = root) {
  const ymd = new Date().toISOString().slice(0, 10);
  const packDir = path.join(repoRoot, 'chat-sessions/desktop-ai-emergency-read-pack');
  fs.mkdirSync(packDir, { recursive: true });
  const results = [];

  for (const { desktop, src } of META_CHARTER_DESKTOP_SYNC) {
    const srcPath = path.join(repoRoot, src);
    if (!fs.existsSync(srcPath)) {
      results.push({ desktop, ok: false });
      continue;
    }
    const body = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
    const header = [
      `【Desktop 控え · META チャーター】`,
      `生成: ${ymd} JST — npm run constitution:sync-meta-charters-desktop`,
      `正本: ${src}`,
      `※ AGENTS.md 非置換 · 矛盾時はリポ正本を優先`,
      '',
    ].join('\r\n');
    const outPath = path.join(packDir, desktop);
    fs.writeFileSync(outPath, `${header}${body.replace(/\n/g, '\r\n')}\r\n`, 'utf8');
    results.push({ desktop, ok: true });
  }
  return results;
}

function main() {
  const results = generateMetaChartersDesktopFiles(root);
  const bad = results.filter((r) => !r.ok);
  if (bad.length) {
    console.error('[constitution:sync-meta-charters-desktop] NG missing sources:', bad.map((b) => b.desktop).join(', '));
    process.exit(2);
  }
  console.log(
    '[constitution:sync-meta-charters-desktop] OK →',
    results.map((r) => r.desktop).join(', '),
  );
  process.exit(0);
}

main();
