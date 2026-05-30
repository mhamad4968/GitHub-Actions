#!/usr/bin/env node
/**
 * Windows: ~/.cursor/hooks.json + hooks/*.mjs をインストール（壁時計 sessionStart 自動化）
 *
 *   npm run cursor:hooks:install-user-windows
 *   npm run cursor:hooks:install-user-windows -- --dry-run
 *
 * 背景: リポ .cursor/hooks.json だけではワークスペース未一致時に sessionStart が走らない。
 * user-global delegate で CURSOR_PROJECT_DIR 配下の autopilot を起動する（docs/cursor-hooks-design.md）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

const userCursor = path.join(os.homedir(), '.cursor');
const hooksDir = path.join(userCursor, 'hooks');
const hooksJson = path.join(userCursor, 'hooks.json');
const artifactDir = path.join(root, 'artifacts', 'cursor-hooks');

const DELEGATES = [
  'resolve-repo-root.mjs',
  'session-start-autopilot-delegate.mjs',
  'session-end-autopilot-delegate.mjs',
  'session-timer-delegate.mjs',
];

function nodeCmd(relInHooksDir) {
  const abs = path.join(hooksDir, relInHooksDir).replace(/\\/g, '/');
  return `node "${abs}"`;
}

function buildHooksConfig() {
  return {
    version: 1,
    hooks: {
      sessionStart: [
        { command: nodeCmd('session-start-autopilot-delegate.mjs'), timeout: 35, failClosed: false },
      ],
      sessionEnd: [
        { command: nodeCmd('session-end-autopilot-delegate.mjs'), timeout: 25, failClosed: false },
      ],
      beforeSubmitPrompt: [
        { command: nodeCmd('session-timer-delegate.mjs'), timeout: 8, failClosed: false },
      ],
    },
  };
}

function main() {
  for (const name of DELEGATES) {
    const src = path.join(artifactDir, name);
    if (!fs.existsSync(src)) {
      console.error(`[install-cursor-user-hooks] missing artifact: ${src}`);
      process.exit(1);
    }
  }

  const cfg = buildHooksConfig();
  console.log('[install-cursor-user-hooks] target:', hooksJson);
  console.log('[install-cursor-user-hooks] hooks dir:', hooksDir);

  if (dryRun) {
    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  fs.mkdirSync(hooksDir, { recursive: true });
  for (const name of DELEGATES) {
    const src = path.join(artifactDir, name);
    const dest = path.join(hooksDir, name);
    fs.copyFileSync(src, dest);
    console.log(`  copied ${name}`);
  }

  if (fs.existsSync(hooksJson)) {
    const bak = `${hooksJson}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.copyFileSync(hooksJson, bak);
    console.log(`  backup ${path.basename(bak)}`);
  }

  fs.writeFileSync(hooksJson, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  console.log('[install-cursor-user-hooks] ✅ wrote hooks.json');
  console.log('[install-cursor-user-hooks] 次: Cursor を一度終了 → 再起動 → kintone-ai-lab をワークスペースで開く');
  console.log('[install-cursor-user-hooks] 確認: logs/session-start-hook.log に新しい行が付くこと');
}

main();
