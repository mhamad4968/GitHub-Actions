#!/usr/bin/env node
/**
 * User-global sessionStart (Windows ネイティブ) — リポの session-start-autopilot.mjs を委譲
 * @see docs/cursor-hooks-design.md
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveKintoneAiLabRoot } from './resolve-repo-root.mjs';

const root = resolveKintoneAiLabRoot();
if (!root) {
  process.stdout.write(`${JSON.stringify({ additional_context: '' })}\n`);
  process.exit(0);
}

const auto = path.join(root, '.cursor', 'hooks', 'session-start-autopilot.mjs');
if (!fs.existsSync(auto)) {
  process.stdout.write(`${JSON.stringify({ additional_context: '' })}\n`);
  process.exit(0);
}

const r = spawnSync(process.execPath, [auto], {
  cwd: root,
  stdio: ['inherit', 'inherit', 'inherit'],
  shell: false,
});
process.exit(typeof r.status === 'number' ? r.status : 1);
