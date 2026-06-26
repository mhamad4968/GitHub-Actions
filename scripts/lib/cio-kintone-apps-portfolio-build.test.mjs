#!/usr/bin/env node
/** R-KAP-01 — kintone-apps BUILD パーサ回帰テスト */
import assert from 'node:assert/strict';
import {
  parsePortfolioDetailBuild,
  parsePortfolioMachineBuild,
  updatePortfolioDetailBuild,
} from './cio-kintone-apps-portfolio-build.mjs';

const sample736 =
  '| **実行予算書作成支援ツール　ver.01** | **736** | `customize/736/desktop.js` \\| `npm run deploy:736` | [link](url) **BUILD=`2026-06-26-736-ux-sticky-print-badges-v1`** rev **134** / fileKey **`abc`** |';

const sample745 =
  '| **JREクラウドアカウント台帳**（日常 UI・744 へ REST） | **745** | `customize/jre-cloud-account-dash/desktop.js` \\| `npm run deploy:745` | [link](url) **BUILD=`2026-06-26-jre-cloud-account-dash-agg-auto-open-v1`** rev **5** / fileKey **`def`** |';

const machineMd =
  '| 736 | `2026-06-26-736-ux-sticky-print-badges-v1` | **134** | `abc` | note |\n' +
  '| 745 | `2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13` | **18** | `def` | note |';

assert.equal(parsePortfolioDetailBuild(sample736, '736'), '2026-06-26-736-ux-sticky-print-badges-v1');
assert.equal(parsePortfolioDetailBuild(sample745, '745'), '2026-06-26-jre-cloud-account-dash-agg-auto-open-v1');
assert.equal(parsePortfolioMachineBuild(machineMd, '736'), '2026-06-26-736-ux-sticky-print-badges-v1');
assert.equal(parsePortfolioMachineBuild(machineMd, '745'), '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13');

const updated = updatePortfolioDetailBuild(sample745, '745', '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13', '18');
assert.equal(updated.changed, true);
assert.equal(
  parsePortfolioDetailBuild(updated.md, '745'),
  '2026-06-26-jre-cloud-account-dash-dept-dash-branch-v13',
);
assert.match(updated.md, /rev \*\*18\*\*/);

console.log('[verify:cio-kintone-apps-portfolio-build] OK');
