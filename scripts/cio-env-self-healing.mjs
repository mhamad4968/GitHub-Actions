#!/usr/bin/env node
/**
 * 拡張案2 — Self-Healing Env（暗号化バックアップ → .env 自動補完）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selfHealEnv } from './lib/cio-env-self-healing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'data', 'cio-env-manifest.json');

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const result = selfHealEnv(root, manifest);

  if (result.healed?.length) {
    console.log('[cio:env:self-healing] merged keys:', result.healed.join(', '));
  }

  if (!result.ok) {
    console.error('[cio:env:self-healing] NG', result.message);
    if (result.issues?.length) {
      for (const i of result.issues) console.error(`  - ${i.key}: ${i.label || i.key}`);
    }
    process.exit(1);
  }

  console.log('[cio:env:self-healing] OK', result.message);
  try {
    execSync('npm run verify:cio-env-integrity', { cwd: root, stdio: 'inherit', shell: true });
  } catch {
    process.exit(1);
  }
  process.exit(0);
}

main();
