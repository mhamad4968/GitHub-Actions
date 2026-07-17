#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generator = path.join(root, 'scripts', 'cio-report-draft.mjs');
const verifier = path.join(root, 'scripts', 'cio-chat-report-selfcheck.mjs');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-report-draft-'));
const draft = path.join(tempDir, 'draft.md');

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

function combined(result) {
  return `${result.stdout || ''}${result.stderr || ''}`;
}

try {
  const generated = run(generator, ['--out', draft]);
  if (generated.status !== 0) throw new Error(`generation failed:\n${combined(generated)}`);

  const verified = run(verifier, [
    '--require-ceo-block',
    '--strict-head',
    '--require-v2',
    '--require-a1',
    '--check-medal-line',
    '--file',
    draft,
  ]);
  if (verified.status !== 0) throw new Error(`strict verifier failed:\n${combined(verified)}`);

  const overwrite = run(generator, ['--out', draft]);
  if (overwrite.status === 0) throw new Error('overwrite without --force unexpectedly succeeded');
  if (!/output exists; use --force/.test(combined(overwrite))) {
    throw new Error(`overwrite refusal diagnosis missing:\n${combined(overwrite)}`);
  }

  console.log('[verify:cio-report-draft] OK (strict verification + overwrite refusal)');
} catch (error) {
  console.error(`[verify:cio-report-draft] NG: ${error.message}`);
  process.exitCode = 1;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
