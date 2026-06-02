#!/usr/bin/env node
/**
 * GHA 定期ジョブが cio-deploy-preflight-guard 経由の deploy 前に 5038 証跡を必ず含むことを検査。
 * 再発防止: 682-graph-monthly-refresh が bundled npm のみを呼ぶこと。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowsDir = path.join(root, '.github', 'workflows');

/** @type {Array<{ file: string, required: RegExp[], forbidden?: RegExp[] }>} */
const RULES = [
  {
    file: '682-graph-monthly-refresh.yml',
    required: [/682:graph-monthly:gha/],
    forbidden: [/682:graph-monthly:scheduled/],
  },
];

function stripYamlComments(text) {
  return text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

function main() {
  let ng = 0;
  for (const rule of RULES) {
    const abs = path.join(workflowsDir, rule.file);
    if (!fs.existsSync(abs)) {
      console.error(`[verify-gha-periodic-workflows] NG missing ${rule.file}`);
      ng += 1;
      continue;
    }
    const raw = fs.readFileSync(abs, 'utf8');
    const text = stripYamlComments(raw);
    let fileOk = true;
    for (const re of rule.required) {
      if (!re.test(text)) {
        console.error(`[verify-gha-periodic-workflows] NG ${rule.file} must match ${re}`);
        fileOk = false;
      }
    }
    for (const re of rule.forbidden || []) {
      if (re.test(text)) {
        console.error(
          `[verify-gha-periodic-workflows] NG ${rule.file} must not call ${re} directly (use bundled npm with 5038 stamp)`,
        );
        fileOk = false;
      }
    }
    if (fileOk) {
      console.log(`[verify-gha-periodic-workflows] OK ${rule.file}`);
    } else {
      ng += 1;
    }
  }

  if (ng > 0) {
    console.error('[verify-gha-periodic-workflows] 正本: docs/runbooks/cio-gha-periodic-5038-stamp.md');
    process.exit(1);
  }
  console.log('[verify-gha-periodic-workflows] OK');
  process.exit(0);
}

main();
