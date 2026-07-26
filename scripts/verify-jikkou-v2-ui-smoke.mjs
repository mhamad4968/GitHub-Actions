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
  ['諸経費自動計算(R-11)', /overheadFromDetails/],
  ['諸経費率10%', /OVERHEAD_RATE_PERCENT/],
  ['諸経費根拠の行内表示(案B)', /jy2-footer-basis/],
  ['諸経費単価注意書き', /諸経費の単価は明細金額の合計です/],
  ['諸経費根拠文言', /明細金額合計 ×\$\{footerRow\.ratePercent\}%/],
  ['費目列ラベル', /費目（選択）/],
  ['種別（補助）列ラベル', /種別（補助）（選択）/],
  ['定義及び品名列ラベル', /定義及び品名（入力）/],
  ['コード表階層マスタ', /JY2_NAME_HIERARCHY/],
  ['費目自動セット', /jy2ApplyHimokuDefaultToDetails/],
  ['工事系費目メニュー', /constructionHimokuMenu/],
  ['予備費費目', /"予備費"/],
  ['ブロック追加フォーカス', /focusBlockId/],
  ['費目→種別紐付け', /jy2TypesForHimoku/],
  ['工種解決は名称優先', /if \(name && byName\[name\]\) return byName\[name\];\s*\n\s*if \(code && byCode\[code\]\) return byCode\[code\];/],
  ['工事メニュー厳密判定', /契約工事型/],
];

const missing = checks.filter(([, re]) => !re.test(source)).map(([name]) => name);
if (missing.length) {
  console.error(`[verify-jikkou-v2-ui-smoke] NG: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[verify-jikkou-v2-ui-smoke] OK + add-block-focus + strict-code-table');
