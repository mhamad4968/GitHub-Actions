#!/usr/bin/env node
/** jikkou-yosan-calc-core.mjs + customize/736/desktop.ui.js → desktop.js */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = process.env.JIKKOU_YOSAN_BUILD || '2026-06-18-jikkou-yosan-v10-bidir-codes';

function prepareCore() {
  const layout = readFileSync(path.join(root, 'scripts/jikkou-yosan-excel-cost-layout.mjs'), 'utf8');
  let core = readFileSync(path.join(root, 'scripts/jikkou-yosan-calc-core.mjs'), 'utf8');
  const start = core.indexOf('// BROWSER_CORE_START');
  core = core.slice(0, start);
  const strip = (src) => src
    .replace(/^import[\s\S]*?;\s*\r?\n/gm, '')
    .replace(/^export\s+\{[\s\S]*?\}\s+from\s+[^;]+;\s*\r?\n/gm, '')
    .replace(/^export function /gm, '  function ')
    .replace(/^export const /gm, '  const ')
    .replace(/^export /gm, '  ');
  return strip(layout) + strip(core);
}

const ui = readFileSync(path.join(root, 'customize/736/desktop.ui.js'), 'utf8');
const costTemplate = readFileSync(path.join(root, 'scripts/data/jikkou-yosan-default-cost-template.json'), 'utf8');
const masterId = process.env.JIKKOU_YOSAN_MASTER_APP_ID || '735';
const out = `/**
 * 【実行予算書】ver.01 — BUILD ${BUILD}
 * Master app: ${masterId}
 */
(function () {
  'use strict';
  const BUILD = '${BUILD}';
  const APP_MASTER = ${masterId};
  const DEFAULT_COST_TEMPLATE = ${costTemplate.trim()};

${prepareCore()}
${ui}
})();
`;

const outPath = path.join(root, 'customize/736/desktop.js');
writeFileSync(outPath, out, 'utf8');
execSync(`node --check "${outPath}"`, { stdio: 'inherit' });
console.log('Wrote', outPath);
