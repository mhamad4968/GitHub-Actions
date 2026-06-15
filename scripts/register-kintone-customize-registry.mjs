#!/usr/bin/env node
/**
 * customize → appId registry 登録（実装 setup 時に実行）
 *
 * Usage:
 *   node scripts/register-kintone-customize-registry.mjs --dir jr-ipad-db --app 720
 *   node scripts/register-kintone-customize-registry.mjs --dir jr-ipad-dash --app 721 --bundle-npm jr-ipad:bundle-dash
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCustomizeRegistryMapping } from './lib/ensure-kintone-customize-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs() {
  const out = { dir: '', app: '', bundleNpm: '', dryRun: false };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir') out.dir = args[++i] || '';
    else if (args[i] === '--app') out.app = args[++i] || '';
    else if (args[i] === '--bundle-npm') out.bundleNpm = args[++i] || '';
    else if (args[i] === '--dry-run') out.dryRun = true;
  }
  return out;
}

function main() {
  const args = parseArgs();
  if (!args.dir || !args.app) {
    console.error('Usage: --dir <name> --app <id> [--bundle-npm <npm-script>]');
    process.exit(1);
  }
  const result = ensureCustomizeRegistryMapping({
    dir: args.dir,
    appId: args.app,
    bundleNpm: args.bundleNpm || undefined,
    root,
    dryRun: args.dryRun,
  });
  if (!result.changed) {
    console.log(`[register-kintone-customize-registry] OK unchanged ${args.dir}→${args.app}`);
    process.exit(0);
  }
  if (result.dryRun) {
    console.log(`[register-kintone-customize-registry] dry-run would update ${args.dir}→${args.app}`);
    process.exit(0);
  }
  const verify = spawnSync('npm', ['run', 'verify:kintone-customize-path-registry', '--silent'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  if (verify.status !== 0) {
    console.error(verify.stdout || verify.stderr);
    process.exit(1);
  }
  console.log(`[register-kintone-customize-registry] OK ${args.dir}→${args.app}`);
  process.exit(0);
}

main();
