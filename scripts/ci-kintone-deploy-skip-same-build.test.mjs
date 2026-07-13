#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'ci-kintone-deploy-skip-same-build.mjs');
const regPath = path.join(root, 'data', 'cio-live-builds.json');

function run(appId, srcPath, extra = []) {
  return spawnSync(process.execPath, [script, appId, srcPath, ...extra], {
    cwd: root,
    encoding: 'utf8',
  });
}

const tmp = mkdtempSync(path.join(tmpdir(), 'wd-skip-build-'));
const src = path.join(tmp, 'desktop.js');
writeFileSync(src, 'var BUILD = "test-build-skip-xyz";\n');

const reg = JSON.parse(readFileSync(regPath, 'utf8'));
const orig688 = reg.apps?.['688'] ? { ...reg.apps['688'] } : null;
reg.apps = reg.apps || {};
reg.apps['688'] = { ...reg.apps['688'], build: 'test-build-skip-xyz' };
writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');

try {
  const skip = run('688', src);
  assert.equal(skip.status, 1, 'same BUILD should exit 1');
  assert.match(skip.stdout, /SKIP/);

  const deploy = run('688', src, ['--force']);
  assert.equal(deploy.status, 0, '--force should exit 0');
  assert.match(deploy.stdout, /DEPLOY/);

  writeFileSync(src, 'var BUILD = "test-build-skip-other";\n');
  const diff = run('688', src);
  assert.equal(diff.status, 0, 'different BUILD should exit 0');
} finally {
  if (orig688) reg.apps['688'] = orig688;
  else delete reg.apps['688'];
  writeFileSync(regPath, JSON.stringify(reg, null, 2) + '\n');
}

console.log('[ci-kintone-deploy-skip-same-build.test] OK');
