#!/usr/bin/env node
/**
 * check-dom-injection.mjs
 *
 * Web UI（特に kintone）に DOM 要素を挿入する前の事前チェッカ。
 *
 * 使い方:
 *   node scripts/check-dom-injection.mjs <URL> [<挿入予定 selector>]
 *
 * 動作:
 *   1. URL に GET リクエスト（HTTP 状態確認）
 *   2. raw HTML 内に挿入予定 selector の手がかり（class/id 名）が存在するか検索
 *   3. kintone は JS 描画なので raw HTML だけでは不十分 → Playwright MCP の手順を案内
 *
 * WORKFLOW.md Phase 1（DOM 挿入トリガー）から呼ばれる。
 * cron からは呼ばれない（手動 / AI 駆動）。
 */
import process from 'node:process';

const [, , url, selector] = process.argv;

if (!url) {
  console.error('usage: node scripts/check-dom-injection.mjs <URL> [<selector>]');
  process.exit(2);
}

const out = [];
out.push(`## DOM 挿入事前チェック`);
out.push('');
out.push(`- 対象 URL: \`${url}\``);
if (selector) out.push(`- 挿入予定 selector: \`${selector}\``);
out.push('');

let status = 0;
let bodySnippet = '';
let contentType = '';

try {
  const res = await fetch(url, { redirect: 'follow' });
  status = res.status;
  contentType = res.headers.get('content-type') || '(unknown)';
  const body = await res.text();
  bodySnippet = body.slice(0, 5000);
  out.push(`### 1. HTTP 応答`);
  out.push('');
  out.push(`- status: **${status}**`);
  out.push(`- content-type: ${contentType}`);
  out.push(`- body 長: ${body.length} bytes`);
  out.push('');
} catch (e) {
  out.push(`### 1. HTTP 応答`);
  out.push('');
  out.push(`❌ fetch 失敗: ${e.message}`);
  out.push('');
}

// 2. selector の手がかり検索（raw HTML）
if (selector) {
  out.push(`### 2. raw HTML 内 selector ヒント検索`);
  out.push('');
  const tokens = selector.match(/[#.][\w-]+/g) || [];
  if (tokens.length === 0) {
    out.push('(selector からトークンを抽出できませんでした)');
  } else {
    for (const t of tokens) {
      const needle = t.slice(1);
      const found = bodySnippet.includes(needle);
      out.push(`- \`${t}\` → ${found ? '✅ raw HTML に出現' : '⚠ raw HTML には未出現（JS 描画かも）'}`);
    }
  }
  out.push('');
}

// 3. kintone の場合は Playwright MCP 案内
out.push(`### 3. 推奨フォローアップ（kintone 等の JS 描画 UI）`);
out.push('');
out.push('raw HTML だけでは Kintone のヘッダースロット等の真の DOM は確認できません。AI は以下を実行してください:');
out.push('');
out.push('```');
out.push('# Playwright MCP（user-playwright）で対象 URL を開く');
out.push('# DOM 描画後に以下を確認:');
out.push('#   - kintone.app.record.getHeaderMenuSpaceElement() の実体');
out.push('#   - kintone.app.getHeaderSpaceElement() の実体');
out.push('#   - 既存の挿入済み要素との配置干渉');
out.push('#   - 挿入後の clientHeight 変化（クリッピング検知）');
out.push('```');
out.push('');

console.log(out.join('\n'));
process.exit(status >= 200 && status < 400 ? 0 : 1);
