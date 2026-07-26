#!/usr/bin/env node
/**
 * App756 の最小 UI スモーク（P2）。
 * 認証済み実機に依存せず、bundle に「打鍵候補」と「スクロール維持」の
 * 配線が残っていることを deploy 前に決定的に検査する。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = path.join(root, 'customize', 'jikkou-yosan-v2-app1', 'desktop.js');
const source = fs.readFileSync(bundlePath, 'utf8');

const checks = [
  ['datalist作成', /createElement\(["']datalist["']\)/],
  ['input list紐付け', /setAttribute\(["']list["'],\s*listId\)/],
  ['datalist一意ID', /jy2-dl-\$\{\+\+JY2_COMBO_UID\}/],
  ['reload前スクロール退避', /function\s+jy2StoreScrollForReload\s*\(/],
  ['reload後スクロール復元', /function\s+jy2ConsumeStoredScroll\s*\(/],
  ['再描画前後スクロール保持', /function\s+jy2CaptureScroll\s*\([\s\S]*?function\s+jy2ApplyScroll\s*\(/],
  ['非表示pane縦移動抑止', /function\s+jy2PaneIsVisible\s*\(/],
  ['工種→区分マップ', /JY2_COST_CATEGORY_BY_WORK_TYPE_CODE/],
  ['工種→区分解決', /function\s+jy2ResolveCostCategoryFromWorkType\s*\(/],
  ['11100は保安', /["']11100["']\s*:\s*["']保安["']/],
  ['10100は施工', /["']10100["']\s*:\s*["']施工["']/],
  ['給与氏名列', /氏名（入力）/],
  ['給与氏名保存', /salary_person_name/],
  ['給与氏名全角空白正規化', /normalizedSalaryPersonName/],
  ['給与氏名空白なし警告', /jy2MarkSalaryNameSpaceWarning/],
];

const missing = checks.filter(([, re]) => !re.test(source)).map(([name]) => name);
if (missing.length) {
  console.error(`[verify-jikkou-v2-ui-smoke] NG: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[verify-jikkou-v2-ui-smoke] OK datalist + scroll-preserve + worktype-cost-auto + salary-name-space');
