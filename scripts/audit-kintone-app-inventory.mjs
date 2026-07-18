#!/usr/bin/env node
/**
 * kintone 全アプリ棚卸（読み取り専用）。
 *
 * - 管理対象の消失 / 削除済み appId の再出現: NG
 * - 台帳未掲載 / 前回からの追加・削除・名称変更: 要確認（非ブロック）
 * - --write: latest JSON / Markdown を更新
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { kintoneGetJson } from './lib/kintone-read-client.mjs';
import {
  KINTONE_AI_TEAM_RETIRED_IDS,
  KINTONE_AI_TEAM_SCOPE_IDS,
} from './lib/kintone-ai-team-app-registry.mjs';
import {
  classifyInventory,
  normalizeLiveApp,
  parseManagedAppsFromMarkdown,
} from './lib/kintone-app-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdownPath = path.join(root, 'kintone-apps.md');
const jsonReportPath = path.join(root, 'data', 'kintone-app-inventory-latest.json');
const mdReportPath = path.join(root, 'docs', 'reports', 'kintone-app-inventory-latest.md');
const write = process.argv.includes('--write');
const resetBaseline = process.argv.includes('--reset-baseline');

function loadAiTeamScopeIds(managedApps) {
  const scope = new Set(KINTONE_AI_TEAM_SCOPE_IDS);
  const missing = managedApps.map((app) => String(app.appId)).filter((appId) => !scope.has(appId));
  if (missing.length) {
    throw new Error(
      `kintone-apps.md の管理IDが data/kintone-ai-team-app-registry.json に未登録: ${missing.join(', ')}`,
    );
  }
  return [...KINTONE_AI_TEAM_SCOPE_IDS];
}

async function fetchAllApps() {
  const apps = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const query = new URLSearchParams({ offset: String(offset), limit: '100' });
    const json = await kintoneGetJson(`/k/v1/apps.json?${query.toString()}`);
    const page = Array.isArray(json?.apps) ? json.apps : [];
    apps.push(...page.map(normalizeLiveApp));
    if (page.length < 100) return apps;
  }
  throw new Error('kintone apps pagination exceeded 10,000 apps');
}

function loadPreviousLiveApps() {
  if (resetBaseline) return [];
  if (!fs.existsSync(jsonReportPath)) return [];
  try {
    const json = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
    return Array.isArray(json.liveApps) ? json.liveApps : [];
  } catch (error) {
    throw new Error(`前回棚卸 JSON を読めません: ${error.message}`);
  }
}

function bullet(app, suffix = '') {
  const name = app.live?.name ?? app.name ?? app.logicalName ?? '';
  return `- ${app.appId}: ${name}${suffix}`;
}

function renderMarkdown(report) {
  const lines = [
    '# kintone アプリ棚卸（latest）',
    '',
    `- 実行日時: ${report.generatedAt}`,
    `- AIチーム管理対象（live）: ${report.counts.live}`,
    `- リポジトリ管理対象: ${report.counts.managed}`,
    `- テナント全件取得数: ${report.counts.tenantFetched}（比較・保存対象外を含む）`,
    '- 対象範囲: data/kintone-ai-team-app-registry.json 登録appIdのみ',
    `- registry外: ${report.counts.tenantFetched - report.counts.live}件（比較・保存・停止判定の対象外）`,
    `- 判定: **${report.ok ? 'OK' : 'NG'}**`,
    '- 自動削除: **なし**（要確認項目は人が判断）',
    '',
    '## NG',
    '',
  ];

  if (
    !report.result.activeMissing.length &&
    !report.result.retiredPresent.length &&
    !report.result.trackedMissing.length
  ) {
    lines.push('- なし');
  }
  for (const app of report.result.activeMissing) {
    lines.push(bullet(app, ' — 管理対象だが live 不在'));
  }
  for (const app of report.result.retiredPresent) {
    lines.push(bullet(app, ' — 削除済み台帳なのに live に再出現'));
  }
  for (const app of report.result.trackedMissing) {
    lines.push(bullet(app, ' — AIチーム管理レジストリ掲載だが live 不在'));
  }

  lines.push('', '## 前回からの変化（要確認）', '');
  if (
    !report.result.newSinceLast.length &&
    !report.result.removedSinceLast.length &&
    !report.result.nameChanges.length
  ) {
    lines.push('- なし（初回基準作成時を含む）');
  }
  for (const app of report.result.newSinceLast) lines.push(bullet(app, ' — 新規出現'));
  for (const app of report.result.removedSinceLast) lines.push(bullet(app, ' — live から消失'));
  for (const app of report.result.nameChanges) {
    lines.push(`- ${app.appId}: 「${app.previousName}」→「${app.currentName}」`);
  }

  lines.push('', '## AIチーム管理証跡あり・アプリ一覧未掲載（要確認・非ブロック）', '');
  if (!report.result.unlistedLive.length) lines.push('- なし');
  for (const app of report.result.unlistedLive) lines.push(bullet(app));

  lines.push('', '## 正常', '');
  lines.push(`- 管理対象・live 一致: ${report.result.activePresent.length} 件`);
  lines.push(`- 削除済み・live 不在: ${report.result.retiredAbsent.length} 件`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function toCrlf(text) {
  return text.replace(/\r?\n/g, '\r\n');
}

function printList(label, rows, suffix) {
  if (!rows.length) return;
  console.log(`[audit:kintone-app-inventory] ${label} ${rows.length}`);
  for (const app of rows.slice(0, 30)) {
    console.log(`  - ${app.appId} ${app.live?.name ?? app.name ?? app.logicalName ?? ''}${suffix}`);
  }
  if (rows.length > 30) console.log(`  ...ほか ${rows.length - 30} 件`);
}

async function main() {
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const managedApps = parseManagedAppsFromMarkdown(markdown);
  const scopeIds = loadAiTeamScopeIds(managedApps);
  const previousLiveApps = loadPreviousLiveApps();
  const tenantLiveApps = await fetchAllApps();
  const scope = new Set(scopeIds);
  const liveApps = tenantLiveApps.filter((app) => scope.has(String(app.appId)));
  const result = classifyInventory({
    managedApps,
    retiredIds: KINTONE_AI_TEAM_RETIRED_IDS,
    scopeIds,
    liveApps,
    previousLiveApps,
  });

  const generatedAt = new Date().toISOString();
  const report = {
    version: 1,
    generatedAt,
    ok: result.ok,
    counts: {
      live: liveApps.length,
      tenantFetched: tenantLiveApps.length,
      scope: scopeIds.length,
      managed: managedApps.length,
      activePresent: result.activePresent.length,
      activeMissing: result.activeMissing.length,
      retiredAbsent: result.retiredAbsent.length,
      retiredPresent: result.retiredPresent.length,
      trackedMissing: result.trackedMissing.length,
      unlistedLive: result.unlistedLive.length,
      newSinceLast: result.newSinceLast.length,
      removedSinceLast: result.removedSinceLast.length,
      nameChanges: result.nameChanges.length,
    },
    result,
    liveApps,
  };

  console.log(
    `[audit:kintone-app-inventory] tenant=${tenantLiveApps.length} ai-scope=${scopeIds.length} live=${liveApps.length} managed=${managedApps.length} active=${result.activePresent.length} retired=${result.retiredAbsent.length}`,
  );
  printList('NG active-missing', result.activeMissing, ' — live 不在');
  printList('NG retired-present', result.retiredPresent, ' — 削除済みなのに live 存在');
  printList('NG tracked-missing', result.trackedMissing, ' — AIチーム管理証跡あり・live 不在');
  printList('WARN new-since-last', result.newSinceLast, ' — 新規出現');
  printList('WARN removed-since-last', result.removedSinceLast, ' — 前回から消失');
  if (result.nameChanges.length) {
    console.log(`[audit:kintone-app-inventory] WARN name-changed ${result.nameChanges.length}`);
    for (const app of result.nameChanges.slice(0, 30)) {
      console.log(`  - ${app.appId} "${app.previousName}" -> "${app.currentName}"`);
    }
  }
  printList('REVIEW unlisted-live', result.unlistedLive, ' — kintone-apps.md 未掲載');

  if (write) {
    fs.mkdirSync(path.dirname(mdReportPath), { recursive: true });
    fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    fs.writeFileSync(mdReportPath, toCrlf(renderMarkdown(report)), 'utf8');
    console.log(
      `[audit:kintone-app-inventory] wrote ${path.relative(root, jsonReportPath)}, ${path.relative(root, mdReportPath)}`,
    );
  }

  console.log(`[audit:kintone-app-inventory] ${result.ok ? 'OK' : 'NG'}`);
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(`[audit:kintone-app-inventory] ERROR ${error.message}`);
  process.exit(2);
});
