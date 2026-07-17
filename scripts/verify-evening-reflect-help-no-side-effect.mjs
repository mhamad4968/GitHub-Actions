#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sessionStarterDesktopDirCandidates } from './lib/session-starter-desktop-dir.mjs';
import {
  SESSION_STARTER_EVENING_UPDATE_REL,
  SESSION_STARTER_PART_C_DESKTOP,
} from './lib/session-starter-parts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function snapshotFile(filePath) {
  if (!fs.existsSync(filePath)) return { exists: false };
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return { exists: true, type: 'non-file', mtimeMs: stat.mtimeMs };
  const content = fs.readFileSync(filePath);
  return {
    exists: true,
    type: 'file',
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    hash: crypto.createHash('sha256').update(content).digest('hex'),
    content: content.toString('base64'),
  };
}

function gitOutput(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result.stdout;
}

function gitSnapshot() {
  return {
    status: gitOutput(['status', '--porcelain=v1', '-uall']),
    worktreeDiff: gitOutput(['diff', '--no-ext-diff', '--binary']),
    indexDiff: gitOutput(['diff', '--cached', '--no-ext-diff', '--binary']),
  };
}

function main() {
  const watched = [
    path.join(root, 'docs', 'reports', `${todayIso()}-evening-reflection.md`),
    path.join(root, SESSION_STARTER_EVENING_UPDATE_REL),
    path.join(root, 'chat-sessions', 'NEW-SESSION-STARTER.md'),
    ...sessionStarterDesktopDirCandidates().flatMap((dir) => [
      path.join(dir, SESSION_STARTER_PART_C_DESKTOP),
      ...(() => {
        if (!fs.existsSync(dir)) return [];
        return fs
          .readdirSync(dir)
          .filter((name) => /^NEW-SESSION-STARTER.*\.txt$/i.test(name))
          .map((name) => path.join(dir, name));
      })(),
    ]),
  ];
  const paths = [...new Set(watched.map((p) => path.resolve(p)))];
  const beforeGit = gitSnapshot();
  const beforeFiles = new Map(paths.map((p) => [p, snapshotFile(p)]));

  const result = spawnSync(process.execPath, ['scripts/evening-reflect.mjs', '--help'], {
    cwd: root,
    encoding: 'utf8',
  });

  const afterGit = gitSnapshot();
  const changed = paths.filter(
    (p) => JSON.stringify(beforeFiles.get(p)) !== JSON.stringify(snapshotFile(p)),
  );
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const failures = [];
  if (result.status !== 0) failures.push(`--help exit=${result.status}`);
  if (!/Usage:\s+node scripts\/evening-reflect\.mjs/i.test(output)) {
    failures.push('usage output missing');
  }
  if (JSON.stringify(beforeGit) !== JSON.stringify(afterGit)) {
    failures.push('repository status or exact Git diff changed');
  }
  if (changed.length) failures.push(`watched files changed: ${changed.join(', ')}`);

  if (failures.length) {
    console.error('[verify:evening-reflect-help-no-side-effect] NG');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }
  console.log(
    `[verify:evening-reflect-help-no-side-effect] OK (${paths.length} files; dirty tree supported)`,
  );
}

main();
