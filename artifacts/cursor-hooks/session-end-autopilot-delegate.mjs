#!/usr/bin/env node
/** User-global sessionEnd — リポの session-end-autopilot.mjs を委譲 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveKintoneAiLabRoot } from './resolve-repo-root.mjs';

const root = resolveKintoneAiLabRoot();
if (!root) {
  process.stdout.write(`${JSON.stringify({ additional_context: '' })}\n`);
  process.exit(0);
}

const auto = path.join(root, '.cursor', 'hooks', 'session-end-autopilot.mjs');
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
