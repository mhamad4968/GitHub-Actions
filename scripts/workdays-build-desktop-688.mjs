#!/usr/bin/env node
/** workdays-calc-core.mjs + customize/688/desktop.ui.js → customize/688/desktop.js */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = process.env.WORKDAYS_BUILD || '2026-05-17-688-workdays-dash-v4-syntax-fix';

const core = readFileSync(path.join(root, 'scripts/workdays-calc-core.mjs'), 'utf8')
  .replace(/^\/\*\*[\s\S]*?\*\/\r?\n/, '')
  .replace(/^export function /gm, '  function ')
  .replace(/^export /gm, '  ');

const ui = readFileSync(path.join(root, 'customize/688/desktop.ui.js'), 'utf8');

const out = `/**
 * 工事稼働日数ダッシュ（688）— データ正本アプリ 687 / SPEC-v1 §6.2
 *   npm run deploy:688
 * 計算コア: scripts/workdays-calc-core.mjs
 */
(function () {
  'use strict';

  const BUILD = '${BUILD}';

${core}

${ui}
})();
`;

const outPath = path.join(root, 'customize/688/desktop.js');
writeFileSync(outPath, out, 'utf8');
try {
  execSync(`node --check "${outPath}"`, { stdio: 'inherit' });
} catch {
  process.exit(1);
}
console.log('Wrote customize/688/desktop.js BUILD=' + BUILD);
