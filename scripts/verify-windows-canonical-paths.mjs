#!/usr/bin/env node
/**
 * R34 — Windows 正本パス台帳の実在確認（ローカル専用・CI は skip）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REG = path.join(root, 'data/windows-canonical-paths.json');

function expand(p) {
  return p.replace(/%USERPROFILE%/g, os.homedir());
}

function main() {
  if (process.env.CI === 'true' || process.platform !== 'win32') {
    console.log('[verify:windows-canonical-paths] SKIP (CI or non-Windows)');
    process.exit(0);
  }
  if (process.env.SKIP_WINDOWS_CANONICAL_PATHS === '1') {
    console.log('[verify:windows-canonical-paths] SKIP (SKIP_WINDOWS_CANONICAL_PATHS=1)');
    process.exit(0);
  }

  const issues = [];
  if (!fs.existsSync(REG)) {
    console.error('[verify:windows-canonical-paths] NG missing registry');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(REG, 'utf8'));

  const canonical = cfg.canonicalRepoClone;
  if (!canonical || !fs.existsSync(canonical)) {
    issues.push(`正本 clone 不在: ${canonical}`);
  } else if (!fs.existsSync(path.join(canonical, '.git'))) {
    issues.push(`正本 clone に .git なし: ${canonical}`);
  }

  for (const fp of cfg.forbiddenPaths || []) {
    if (fs.existsSync(fp)) issues.push(`禁止パスが残存: ${fp}`);
  }

  for (const fp of cfg.forbiddenDuplicateClones || []) {
    const abs = expand(fp);
    if (fs.existsSync(abs)) issues.push(`重複 clone 残存: ${abs}`);
  }

  for (const fp of cfg.requiredLocalPaths || []) {
    if (!fs.existsSync(fp)) issues.push(`必須パス不在: ${fp}`);
  }

  const desktop = path.join(os.homedir(), 'Desktop');
  for (const dir of cfg.desktopRequiredDirs || []) {
    const p = path.join(desktop, dir);
    if (!fs.existsSync(p)) issues.push(`Desktop 必須不在: ${p}`);
  }

  if (issues.length) {
    console.error('[verify:windows-canonical-paths] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:windows-canonical-paths] OK R34 正本・禁止・必須パス');
  process.exit(0);
}

main();
