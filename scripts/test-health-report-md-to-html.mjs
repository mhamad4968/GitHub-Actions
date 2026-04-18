/**
 * 手動: node scripts/test-health-report-md-to-html.mjs
 */
import assert from "node:assert/strict";
import { healthReportMarkdownToHtml } from "./lib/health-report-md-to-html.mjs";

const sample = `## システムヘルスチェック（kintone）

- **実行時刻（UTC）**: 2026-04-18T01:00:00.000Z
- **ドメイン**: \`jbis-kintone.cybozu.com\`

| アプリID | 論理名 | ポータルURL | API |
| --- | --- | --- | --- |
| 631 | ニュース | [開く](https://example.com/k/631/) | **NG** (403) |
`;

const html = healthReportMarkdownToHtml(sample);
assert.match(html, /システムヘルスチェック/);
assert.match(html, /<table/);
assert.match(html, /<strong>NG<\/strong>/);
assert.match(html, /href="https:\/\/example\.com\/k\/631\/"/);
assert.doesNotMatch(html, /<script/i);

console.log("test-health-report-md-to-html: OK");
