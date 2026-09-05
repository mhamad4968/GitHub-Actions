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
  ['種別列ラベル', /種別（選択）/],
  ['詳細列ラベル', /詳細（入力）／材料（選択）/],
  ['コード表階層マスタ', /JY2_NAME_HIERARCHY/],
  ['費目自動セット', /jy2ApplyHimokuDefaultToDetails/],
  ['工事系費目メニュー', /constructionHimokuMenu/],
  ['費目7マスタ仮設機械経費', /"仮設機械経費"/],
  ['ブロック追加フォーカス', /focusBlockId/],
  ['費目→種別紐付け', /jy2TypesForHimoku/],
  ['工種解決は名称優先', /if \(name && byName\[name\]\) return byName\[name\];[\s\S]{0,200}if \(code && byCode\[code\]\) return byCode\[code\];/],
  ['工事メニュー厳密判定', /契約工事型/],
  ['候補順はマスタ整理順', /マスタ整理正本|JY2_SYSTEM_WORK_MASTER|五十音ソートしない/],
  ['システム工種リスト順', /jy2ApplyWorkTypeCodeTableOrder|JY2_SYSTEM_WORK_NAMES/],
  ['システム工種マスタ', /JY2_SYSTEM_WORK_MASTER/],
  ['レンタルは11600', /"11600"\s*:\s*\{[\s\S]{0,160}"workTypeName":\s*"（塗）レンタル"/],
  ['区分マップに11600', /"11600"\s*:\s*"施工"/],
  ['工種番号完全一致で即時反映', /commitExactOption/],
  ['重複commit抑止', /lastCommitted/],
  ['再描画を次フレームに集約', /scheduleRerender/],
  ['非表示予実の遅延更新', /actualsDirty/],
  ['保存時App2再GET省略', /loadedDetailRecords/],
  ['種別ダッシュ固定判定', /jy2HimokuUsesDashType/],
  ['種別ダッシュ自動補完', /jy2NormalizeDashTypeDetails/],
  ['種別ダッシュ選択不可', /dashTypeFixed[\s\S]{0,280}jy2LockedValueControl\(documentRef,\s*["']－["']\)/],
  ['固定セル不可バッジ', /function\s+jy2LockedValueControl\s*\(/],
  ['固定セル不可ホバー', /入力不可（固定）/],
  ['固定セル不可は▼なし', /jy2-locked-badge[\s\S]{0,120}textContent = ["']不可["']/],
  ['帳票で不可を隠す', /@media print\{\.jy2-locked-badge\{display:none/],
  ['ブロック部分差し替え', /replaceOneBlock|onlyBlockId|findDetailBlockEl/],
  ['行ボタンの mousedown 抑止', /mousedown[\s\S]{0,120}preventDefault/],
  ['フォーカス復元', /jy2RestoreFieldFocus/],
  ['総括遅延更新', /summaryDirty/],
  ['タブ表示時flush', /flushSummaryIfDirty/],
  ['単一種別の自動選択', /jy2SoleTypeForHimoku|jy2NormalizeSoleTypeDetails/],
  ['タブ名は工事原価管理', /工事原価管理/],
  ['原価管理タブ非表示ゲート', /JY2_HIDE_COST_MGMT_TAB\s*=\s*true/],
  ['追加工事⑤は工事メニュー', /"workTypeName":\s*"（塗）追加工事⑤"[\s\S]{0,400}"constructionMenu":\s*true/],
  ['追加工事⑤コード14500', /"14500"\s*:\s*"施工"/],
  ['会社名はI∪J', /データマスタ I∪J|I∪J（会社名リスト/],
];

const missing = checks.filter(([, re]) => !re.test(source)).map(([name]) => name);
if (missing.length) {
  console.error(`[verify-jikkou-v2-ui-smoke] NG: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[verify-jikkou-v2-ui-smoke] OK + partial-block-render');
