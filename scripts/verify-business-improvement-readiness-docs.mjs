#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifier = path.join(root, 'scripts', 'business-improvement-verify-readiness-docs.mjs');
const files = [
  'docs/plans/2026-05-23-business-improvement-proposal-spec.md',
  'docs/runbooks/business-improvement-closed-v1-ux.md',
  'docs/reports/2026-07-17-business-improvement-operation-readiness.md',
  'kintone-apps.md',
  'data/cio-project-closures.json',
  'data/cio-live-builds.json',
  'customize/business-improvement-proposal/desktop.js',
];

function copyFixture(tempRoot) {
  for (const rel of files) {
    const target = path.join(tempRoot, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, rel), target);
  }
}

function run(tempRoot) {
  return spawnSync(process.execPath, [verifier, '--root', tempRoot], {
    cwd: root,
    encoding: 'utf8',
  });
}

function output(result) {
  return `${result.stdout || ''}${result.stderr || ''}`;
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bi-readiness-docs-'));
try {
  copyFixture(tempRoot);
  const green1 = run(tempRoot);
  if (green1.status !== 0) throw new Error(`initial fixture should pass:\n${output(green1)}`);

  const reportRel = 'docs/reports/2026-07-17-business-improvement-operation-readiness.md';
  const reportPath = path.join(tempRoot, reportRel);
  const original = fs.readFileSync(reportPath, 'utf8');
  fs.writeFileSync(
    reportPath,
    original.replace('SYSTEM_SIDE_OPERATION_READINESS: OK', 'SYSTEM_SIDE_OPERATION_READINESS: BROKEN'),
    'utf8',
  );
  const red = run(tempRoot);
  if (red.status === 0) throw new Error('mutated fixture unexpectedly passed');
  if (!/missing readiness OK marker/.test(output(red))) {
    throw new Error(`mutation failed without expected diagnosis:\n${output(red)}`);
  }

  fs.copyFileSync(path.join(root, reportRel), reportPath);
  const green2 = run(tempRoot);
  if (green2.status !== 0) throw new Error(`restored fixture should pass:\n${output(green2)}`);

  console.log('[verify:business-improvement-readiness-docs] OK (green/red/green)');
} catch (error) {
  console.error(`[verify:business-improvement-readiness-docs] NG: ${error.message}`);
  process.exitCode = 1;
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
