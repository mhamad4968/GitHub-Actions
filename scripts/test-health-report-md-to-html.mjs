/**
 * 手動: node scripts/test-health-report-md-to-html.mjs
 */
import assert from "node:assert/strict";
import { healthReportMarkdownToHtml } from "./lib/health-report-md-to-html.mjs";

const sample = `## システムヘルスチェック（kintone）

- **実行時刻（UTC）**: 2026-04-18T01:00:00.000Z
- **ドメイン**: \`jbis-kintone.cybozu.com\`

| App ID | アプリ名 | レコード数 | 24h変動 | ステータス | 最終更新 |
| --- | --- | --- | --- | --- | --- |
| 631 | ニュース | 120 | 3 | **異常** | 2026/4/18 10:00 |
`;

const html = healthReportMarkdownToHtml(sample);
assert.match(html, /システムヘルスチェック/);
assert.match(html, /<table/);
assert.match(html, /<strong>異常<\/strong>/);
assert.match(html, /font-size:15px/);
assert.match(html, /レコード数/);
assert.doesNotMatch(html, /<script/i);

console.log("test-health-report-md-to-html: OK");
