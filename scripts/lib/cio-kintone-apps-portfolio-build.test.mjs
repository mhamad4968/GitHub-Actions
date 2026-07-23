#!/usr/bin/env node
/** R-KAP-01 — kintone-apps BUILD パーサ回帰テスト + #S1 配線監査 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parsePortfolioDetailBuild,
  parsePortfolioDetailFileKey,
  parsePortfolioMachineBuild,
  parsePortfolioMachineFileKey,
  updatePortfolioDetailBuild,
} from './cio-kintone-apps-portfolio-build.mjs';
const sample736 =
  '| **実行予算書作成支援ツール　ver.01** | **736** | `customize/736/desktop.js` \\| `npm run deploy:736` | [link](url) **BUILD=`2026-06-26-736-ux-sticky-print-badges-v1`** rev **134** / fileKey **`abc`** |';

const sample745 =
  '| **JREクラウドアカウント台帳**（日常 UI・744 へ REST） | **745** | `customize/jre-cloud-account-dash/desktop.js` \\| `npm run deploy:745` | [link](url) **BUILD=`2026-06-26-jre-cloud-account-dash-agg-auto-open-v1`** rev **5** / fileKey **`def`** |';
const sample674WithHistory =
  '| 新・PC台帳 | **674** | `desktop.bundle.js` | **BUILD=`2026-07-17-674-current`** rev **261**。前 deploy **BUILD=`2026-06-19-674-history`** rev **243** |';

const machineMd =
  '| 736 | `2026-06-26-736-ux-sticky-print-badges-v1` | **134** | `abc` | note |\n' +
  '| 745 | `2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13` | **18** | `def` | note |';

assert.equal(parsePortfolioDetailBuild(sample736, '736'), '2026-06-26-736-ux-sticky-print-badges-v1');
assert.equal(parsePortfolioDetailBuild(sample745, '745'), '2026-06-26-jre-cloud-account-dash-agg-auto-open-v1');
assert.equal(parsePortfolioDetailBuild(sample674WithHistory, '674'), '2026-07-17-674-current');
assert.equal(parsePortfolioMachineBuild(machineMd, '736'), '2026-06-26-736-ux-sticky-print-badges-v1');
assert.equal(parsePortfolioMachineBuild(machineMd, '745'), '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13');

assert.equal(parsePortfolioMachineFileKey(machineMd, '736'), 'abc');
assert.equal(parsePortfolioMachineFileKey(machineMd, '745'), 'def');
assert.equal(parsePortfolioDetailFileKey(sample736, '736'), 'abc');
assert.equal(parsePortfolioDetailFileKey(sample745, '745'), 'def');

const updated = updatePortfolioDetailBuild(sample745, '745', '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13', '18');
assert.equal(updated.changed, true);
assert.equal(
  parsePortfolioDetailBuild(updated.md, '745'),
  '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13',
);
assert.match(updated.md, /rev \*\*18\*\*/);

// R-595-03 / #S1 — deploy garble 1 回リトライ配線監査（柱 F · spec P1c）
const deployRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployJs = fs.readFileSync(path.join(deployRoot, 'deploy-customization.js'), 'utf8');
assert.match(deployJs, /#S1/);
assert.match(deployJs, /verify garble/);
assert.match(deployJs, /sync-kintone-apps-build\.mjs/);
assert.match(deployJs, /verify-kintone-apps-live-build-sync\.mjs/);

console.log('[verify:cio-kintone-apps-portfolio-build] OK');