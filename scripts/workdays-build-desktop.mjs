#!/usr/bin/env node
/** workdays-calc-core.mjs + UI → customize/687/desktop.js */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = process.env.WORKDAYS_BUILD || '2026-05-17-687-dash-link-v1';

const core = readFileSync(path.join(root, 'scripts/workdays-calc-core.mjs'), 'utf8')
  .replace(/^\/\*\*[\s\S]*?\*\/\r?\n/, '')
  .replace(/^export function /gm, '  function ')
  .replace(/^export /gm, '  ');

const ui = readFileSync(path.join(root, 'customize/687/desktop.ui.slim.js'), 'utf8');

const out = `/**
 * 工事稼働日数算出（687）— SPEC-v1 準拠
 *   npm run deploy:687
 * 計算コア同期: scripts/workdays-calc-core.mjs（node scripts/workdays-build-desktop.mjs）
 */
(function () {
  'use strict';

  const BUILD = '${BUILD}';

${core}

${ui}
})();
`;

writeFileSync(path.join(root, 'customize/687/desktop.js'), out, 'utf8');
console.log('Wrote customize/687/desktop.js BUILD=' + BUILD);
