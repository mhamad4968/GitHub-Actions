#!/usr/bin/env node
/**
 * beforeShellExecution — 方式B 4AI統制インターロック（タスクA+B）
 * deploy / git commit / customize 書込系の直前にログ・証跡を検査
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const INTERLOCK_CMD_PATTERNS = [
  /\bnpm\s+run\s+deploy:/i,
  /\bnode\s+scripts\/deploy-customization/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+push\b/i,
];

function runGuard(scriptName, extraArgs = []) {
  const script = path.join(root, 'scripts', scriptName);
  const r = spawnSync(process.execPath, [script, ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function deny(message, agentMessage) {
  console.log(
    JSON.stringify({
      permission: 'deny',
      user_message: message,
      agent_message: agentMessage,
    }),
  );
  process.exit(2);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => {
  raw += c;
});
process.stdin.on('end', () => {
  if (process.env.SKIP_CIO_MODE_B_INTERLOCK === '1') {
    console.log(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    console.log(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  const command = String(input.command || '');
  if (!command || !INTERLOCK_CMD_PATTERNS.some((p) => p.test(command))) {
    console.log(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  const composer = runGuard('cio-composer-silent-fallback-guard.mjs');
  if (composer.status !== 0) {
    deny(
      composer.stderr || composer.stdout || 'Composer silent fallback detected',
      'Blocked: cio-composer-silent-fallback-guard (Mode-B §1-2-2)',
    );
  }

  const staged = /\bgit\s+commit\b/i.test(command);
  const deploy = /\bdeploy:/i.test(command) || /deploy-customization/i.test(command);
  if (staged || deploy) {
    const args = staged ? ['--staged'] : ['--force-check'];
    const ds = runGuard('cio-deepseek-5038-evidence-guard.mjs', args);
    if (ds.status !== 0) {
      deny(
        ds.stderr ||
          ds.stdout ||
          '【警告】方式B違反：DeepSeek §50-3-8 証跡なし。CIO（Opus 4.7）へ盲点チェックを依頼してください。',
        'Blocked: cio-deepseek-5038-evidence-guard — stamp or chat evidence required',
      );
    }
  }

  console.log(JSON.stringify({ permission: 'allow' }));
  process.exit(0);
});
