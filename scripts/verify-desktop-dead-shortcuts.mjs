#!/usr/bin/env node
/**
 * R38 — Desktop 死ショートカット検査（ローカル専用・CI は skip）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveShortcutTarget(lnkPath) {
  if (process.platform !== 'win32') return null;
  const ps = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `$s = (New-Object -ComObject WScript.Shell).CreateShortcut('${lnkPath.replace(/'/g, "''")}'); $s.TargetPath`,
    ],
    { encoding: 'utf8', timeout: 15_000 },
  );
  return (ps.stdout || '').trim() || null;
}

function main() {
  if (process.env.CI === 'true' || process.platform !== 'win32') {
    console.log('[verify:desktop-dead-shortcuts] SKIP (CI or non-Windows)');
    process.exit(0);
  }
  if (process.env.SKIP_DESKTOP_DEAD_SHORTCUTS === '1') {
    console.log('[verify:desktop-dead-shortcuts] SKIP (SKIP_DESKTOP_DEAD_SHORTCUTS=1)');
    process.exit(0);
  }

  const desktop = path.join(os.homedir(), 'Desktop');
  if (!fs.existsSync(desktop)) {
    console.log('[verify:desktop-dead-shortcuts] SKIP (Desktop なし)');
    process.exit(0);
  }

  const dead = [];
  for (const ent of fs.readdirSync(desktop, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.toLowerCase().endsWith('.lnk')) continue;
    const lnk = path.join(desktop, ent.name);
    const target = resolveShortcutTarget(lnk);
    if (!target) continue;
    if (!fs.existsSync(target)) {
      dead.push({ name: ent.name, target });
    }
  }

  if (dead.length) {
    console.error('[verify:desktop-dead-shortcuts] NG', dead.length);
    for (const d of dead) console.error(`  - ${d.name} → ${d.target}`);
    process.exit(1);
  }
  console.log('[verify:desktop-dead-shortcuts] OK R38 死ショートカットなし');
  process.exit(0);
}

main();
