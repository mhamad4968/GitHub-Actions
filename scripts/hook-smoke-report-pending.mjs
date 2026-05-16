#!/usr/bin/env node
/**
 * report-checksheet-pending.mjs の手元スモーク用。
 * PowerShell の `echo '{...}' | node …` では stdin が空扱いになり additional_context が付かないことがあるため、
 * JSON を spawn の input で渡す（CIO 判断で scripts 化）。
 *
 * 用法: node scripts/hook-smoke-report-pending.mjs ["プロンプト文言…"]
 *   既定プロンプト: 本日の報告をします
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hook = path.join(root, '.cursor/hooks/report-checksheet-pending.mjs');
const prompt = process.argv.slice(2).join(' ').trim() || '本日の報告をします';

const r = spawnSync(process.execPath, [hook], {
  cwd: root,
  input: `${JSON.stringify({ prompt })}\n`,
  encoding: 'utf8',
  env: { ...process.env },
});

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(typeof r.status === 'number' && r.status !== null ? r.status : 2);
