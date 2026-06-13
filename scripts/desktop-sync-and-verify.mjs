#!/usr/bin/env node
/**
 * Desktop 同期 + 検証チェーン（package.json の && 連鎖を Node 直列化 — Windows cmd フラッシュ回避）
 * @see scripts/lib/win-hidden-spawn.mjs
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runNodeScriptSync, runNpmScriptSync } from './lib/win-hidden-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runStep(label, fn) {
  const r = fn();
  if (r.status !== 0) {
    console.error(`[desktop:sync-and-verify] NG ${label} exit=${r.status ?? 1}`);
    process.exit(typeof r.status === 'number' && r.status !== 0 ? r.status : 1);
  }
}

console.log('=== desktop:sync-and-verify（hidden spawn 直列）===');

runStep('session-starter:sync-desktop', () =>
  runNpmScriptSync(root, 'session-starter:sync-desktop', [], { stdio: 'inherit' }),
);
runStep('verify:desktop-ai-emergency-sync', () =>
  runNpmScriptSync(root, 'verify:desktop-ai-emergency-sync', [], { stdio: 'inherit' }),
);
runStep('verify-evening-reflection-scope', () =>
  runNodeScriptSync(root, 'scripts/verify-evening-reflection-scope.mjs', ['--today-if-exists'], {
    stdio: 'inherit',
  }),
);
runStep('verify-checkpoint-project-closure', () =>
  runNodeScriptSync(root, 'scripts/verify-checkpoint-project-closure.mjs', [], { stdio: 'inherit' }),
);
runStep('verify-session-close-git-warn', () =>
  runNodeScriptSync(root, 'scripts/verify-session-close-git-warn.mjs', [], { stdio: 'inherit' }),
);
runStep('mcp:sync-cursor-windows', () =>
  runNpmScriptSync(root, 'mcp:sync-cursor-windows', [], { stdio: 'inherit' }),
);
runStep('verify:cursor-mcp-windows', () =>
  runNpmScriptSync(root, 'verify:cursor-mcp-windows', [], { stdio: 'inherit' }),
);

console.log('[desktop:sync-and-verify] OK');
process.exit(0);
