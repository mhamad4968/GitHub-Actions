#!/usr/bin/env node
/** User-global beforeSubmitPrompt — 経過/4h 残りを additional_context 注入 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveKintoneAiLabRoot } from './resolve-repo-root.mjs';

const root = resolveKintoneAiLabRoot();
if (!root) {
  process.stdout.write(`${JSON.stringify({ additional_context: '' })}\n`);
  process.exit(0);
}

const cli = path.join(root, 'scripts', 'session-clock.mjs');
if (!fs.existsSync(cli)) {
  process.stdout.write(`${JSON.stringify({ additional_context: '' })}\n`);
  process.exit(0);
}

const r = spawnSync(process.execPath, [cli, 'prompt-hook'], {
  cwd: root,
  stdio: ['inherit', 'inherit', 'inherit'],
  shell: false,
});
process.exit(typeof r.status === 'number' ? r.status : 0);
