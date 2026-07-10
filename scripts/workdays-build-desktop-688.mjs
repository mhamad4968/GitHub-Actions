#!/usr/bin/env node
/** workdays-calc-core.mjs + customize/688/desktop.ui.js → customize/688/desktop.js */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = process.env.WORKDAYS_BUILD || '2026-07-10-688-wbgt-heat-reference';

function prepareRef5yrForBrowser() {
  const ref = JSON.parse(
    readFileSync(path.join(root, 'scripts/data/workdays-5yr-omiya.json'), 'utf8'),
  );
  return '  const REF5YR = ' + JSON.stringify(ref) + ';\n\n';
}

function prepareCoreForBrowser() {
  const holidayDates = JSON.parse(
    readFileSync(path.join(root, 'scripts/data/jp-holidays.json'), 'utf8'),
  ).dates;
  const holidayBlock =
    '  const JP_HOLIDAY_YMD = ' +
    JSON.stringify(Object.fromEntries(holidayDates.map((d) => [d, true]))) +
    ';\n\n';
  let core = readFileSync(path.join(root, 'scripts/workdays-calc-core.mjs'), 'utf8');
  const start = core.indexOf('// BROWSER_CORE_START');
  if (start < 0) throw new Error('BROWSER_CORE_START marker missing');
  core = core.slice(start + '// BROWSER_CORE_START'.length + 1);
  core = core
    .replace(/^export function jpHolidayYmdForBundle[\s\S]*?\n\}\n\n/gm, '')
    .replace(/^export function /gm, '  function ')
    .replace(/^export /gm, '  ');
  return holidayBlock + core;
}

function prepareHeatForBrowser() {
  let heat = readFileSync(path.join(root, 'scripts/workdays-heat-reference.mjs'), 'utf8');
  const marker = '// BROWSER_HEAT_START';
  const cut = heat.indexOf(marker);
  if (cut < 0) throw new Error('BROWSER_HEAT_START marker missing in workdays-heat-reference.mjs');
  heat = heat.slice(0, cut);
  heat = heat.replace(/^import[\s\S]*?;\s*\r?\n/gm, '');
  heat = heat.replace(/^export const /gm, '  const ');
  heat = heat.replace(/^export function /gm, '  function ');
  return heat + '\n';
}

const ui = readFileSync(path.join(root, 'customize/688/desktop.ui.js'), 'utf8');

const out = `/**
 * 工事稼働日数ダッシュ（688）— データ正本アプリ 687 / Excel 準拠
 *   npm run deploy:688
 * 計算コア: scripts/workdays-calc-core.mjs
 */
(function () {
  'use strict';

  const BUILD = '${BUILD}';

${prepareRef5yrForBrowser()}${prepareCoreForBrowser()}${prepareHeatForBrowser()}
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
