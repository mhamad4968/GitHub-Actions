#!/usr/bin/env node
/**
 * constitution.mdc 鮮度（ローカル実体 or data/constitution-mdc-freshness-stamp.json）
 * 正本は gitignore — スタンプをリポで追跡（Phase 2-C）
 */
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mdc = path.join(root, '.cursor', 'rules', 'constitution.mdc');
const stampPath = path.join(root, 'data', 'constitution-mdc-freshness-stamp.json');
const regen = path.join(root, 'scripts', 'regenerate-constitution-rule.mjs');

function normalizeForHash(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/^> \*\*CONSTITUTION_MDC_GENERATED_AT\*\*:.*\n/gm, '');
}

function hashOfFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(normalizeForHash(text), 'utf8').digest('hex');
}

function main() {
  if (!fs.existsSync(stampPath)) {
    console.error('[verify-constitution-mdc-freshness] NG missing', stampPath);
    console.error('  → npm run rules:regenerate-constitution');
    process.exit(2);
  }
  const stamp = JSON.parse(fs.readFileSync(stampPath, 'utf8'));

  if (fs.existsSync(mdc)) {
    const text = fs.readFileSync(mdc, 'utf8');
    if (!/手編集禁止（Phase 2-C）/.test(text)) {
      console.error('[verify-constitution-mdc-freshness] NG missing hand-edit banner');
      process.exit(1);
    }
    const h = hashOfFile(mdc);
    if (h !== stamp.sha256) {
      console.error('[verify-constitution-mdc-freshness] NG hash mismatch (hand-edit or stale)');
      console.error('  → npm run rules:regenerate-constitution');
      process.exit(1);
    }
    const r = spawnSync(process.execPath, [regen, '--check'], { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) {
      process.stderr.write(r.stderr || r.stdout || '');
      process.exit(r.status || 1);
    }
    console.log('[verify-constitution-mdc-freshness] OK (local file matches stamp + regenerate)');
    process.exit(0);
  }

  console.log('[verify-constitution-mdc-freshness] OK (stamp only; local constitution.mdc not present)');
  console.log('  CI/clone: run npm run rules:regenerate-constitution on developer machine');
  process.exit(0);
}

main();
