#!/usr/bin/env node
/**
 * CIO 環境増強ワンショット（MCP・4AI台帳・健康・任意 Desktop）。
 *
 * 用法:
 *   node scripts/cio-env-enhance.mjs           # 標準（gate + 4AI + overlay）
 *   node scripts/cio-env-enhance.mjs --quick   # health + cio:mcp:env + 4AI のみ
 *   node scripts/cio-env-enhance.mjs --full    # 上記 + verify:cio-four-ai-governance
 *   node scripts/cio-env-enhance.mjs --desktop  # 末尾に desktop:sync-and-verify
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = new Set(process.argv.slice(2));
const quick = argv.has('--quick');
const full = argv.has('--full');
const desktop = argv.has('--desktop');

function runNpm(script) {
  console.log(`\n[cio-env-enhance] >>> npm run ${script}\n`);
  const r = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit', shell: true });
  return typeof r.status === 'number' ? r.status : 2;
}

function runNode(rel) {
  console.log(`\n[cio-env-enhance] >>> node ${rel}\n`);
  const r = spawnSync(process.execPath, [path.join(root, rel)], { cwd: root, stdio: 'inherit' });
  return typeof r.status === 'number' ? r.status : 2;
}

console.log('=== cio:env:enhance（MCP・環境増強）===');
console.log(`mode: ${quick ? 'quick' : full ? 'full' : 'standard'}${desktop ? ' +desktop' : ''}\n`);

const steps = [
  ['health-check', () => runNpm('health-check')],
  ...(quick
    ? [['cio:mcp:env', () => runNpm('cio:mcp:env')]]
    : [
        ['cio:mcp:gate', () => runNpm('cio:mcp:gate')],
        ['mcp:overlays', () => runNode('scripts/apply-repo-mcp-overlays-windows.mjs')],
        ['verify:cursor-mcp-windows', () => runNpm('verify:cursor-mcp-windows')],
      ]),
  ['verify:mcp-four-ai-alignment', () => runNpm('verify:mcp-four-ai-alignment')],
  ...(full ? [['verify:cio-four-ai-governance', () => runNpm('verify:cio-four-ai-governance')]] : []),
  ...(desktop ? [['desktop:sync-and-verify', () => runNpm('desktop:sync-and-verify')]] : []),
];

let bad = false;
for (const [name, fn] of steps) {
  const st = fn();
  if (st !== 0) {
    console.error(`[cio-env-enhance] NG step=${name} exit=${st}`);
    bad = true;
    break;
  }
  console.log(`[cio-env-enhance] OK step=${name}`);
}

if (bad) {
  process.exit(2);
}
console.log('\n[cio-env-enhance] ✅ 環境増強ゲート完了');
console.log('[cio-env-enhance] 日常軽量: npm run cio:mcp:env | 週次: npm run cio:mcp:gate | 金曜: npm run mcp-status:refresh-usage');
process.exit(0);
