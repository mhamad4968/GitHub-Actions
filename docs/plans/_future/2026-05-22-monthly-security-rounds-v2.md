# 月次セキュリティ巡回 v2: MCP 自動呼出による完全自動化

**制定日**: 2026-04-25 (Sat) 09:20 / H-3 タスク
**実施予定日**: 2026-05-22 (Fri) メジャーレビュー枠
**契機**: 4/25 E-2 dry-run で v1 の限界（スケルトン生成のみ / AI による手動データ貼付必要）が明確化
**対象スクリプト**: `scripts/monthly-security-rounds.mjs` (現 v1 = 130 行 / 5/1 cron 初回稼働予定)

---

## 🎯 v1 の限界と v2 の目標

### v1 の現状（4/25 E-2 で実証）

`node scripts/monthly-security-rounds.mjs` 実行 →
- 出力: `docs/reports/<YYYY-MM>-security-rounds.md` の **スケルトン**（プレースホルダ`<!-- ここに cyber-news の結果を貼付 -->`）
- 5/1 cron 起動 → スケルトン生成完了で exit 0 / **データ部分は AI が手動で MCP 呼出 → 貼付**が必要
- E-2 dry-run では人間 (AI) 介在で 6 分作業:
  - `mcp_user-cyber-news_get_news_briefs(category=vulnerabilities, maxBriefs=5)` x 2 回
  - `mcp_user-cve-search_vul_vendor_product_cve(vendor=nodejs, product=nodejs)` x 1 回
  - 結果を markdown に整形して貼付

### v2 の目標

**「cron 一発で完成版報告書」** = 朝 06:30 cron 実行 → 6:31 に完成版が `docs/reports/2026-05-security-rounds.md` に出力 → AI/浜田は内容確認のみ。

**達成基準**:
1. 人間（AI）介在なしで完成版（プレースホルダなし）を生成
2. cyber-news + cve-search の MCP を script から直接呼出
3. 例外時はスケルトン版にフォールバック (`status: degraded`) して exit 0（朝 cron を止めない）
4. 出力 byte 数: v1 = 1675 byte / v2 = 4-8 KB 程度（実データ込）

---

## 🏗️ アーキテクチャ選定

### 選択肢 A: AI 連携型（半自動）
- script は v1 のまま / `--ai-mode` フラグで AI 用の指示書を stdout に出力
- AI が読んで MCP 呼出 → 貼付スクリプト発行
- 課題: AI 介在前提 = 朝 cron で「完成」しない / dependence on AI session

### 選択肢 B: Node MCP クライアント型（自動）✅ **採択**
- script 内で MCP server を spawn + JSON-RPC で initialize → tools/call
- パターン既存: `scripts/health-check.mjs` line 155-180 で `mcp-local-rag` の status を同方式で呼出 (ragServer.command + jsonrpc)
- メリット: 朝 cron で完結 / AI 不要 / 浜田の認知負荷ゼロ
- 課題: cyber-news / cve-search の env (PATH 等) を script に伝播必要 (TSB-013 で実証済 = `~/.local/bin` PATH を含める)

### 選択肢 C: GitHub Actions 化
- 月次 cron を GitHub Actions に移行 / Action workflow から MCP 呼出
- 課題: GitHub runner 上で MCP server 環境再現が困難 / オーバーエンジニアリング

**結論**: B を採択。実績ある health-check.mjs パターンを踏襲。

---

## 🔧 v2 実装内容

### 1. ヘルパー関数 `callMcp(server, tool, args, options)` 追加

```js
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function loadMcpConfig() {
  const mcpJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.cursor', 'mcp.json'), 'utf8'));
  return mcpJson.mcpServers || {};
}

function callMcp(serverName, toolName, args, { timeoutMs = 60_000 } = {}) {
  const cfg = loadMcpConfig()[serverName];
  if (!cfg || cfg.disabled) return { ok: false, reason: 'server-disabled-or-missing', data: null };

  const reqs = [
    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {},
        clientInfo: { name: 'monthly-sec-rounds-v2', version: '2.0' } } }),
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: toolName, arguments: args } }),
  ].join('\n') + '\n';

  const res = spawnSync(cfg.command, cfg.args || [], {
    input: reqs,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, ...(cfg.env || {}) },
  });

  const lines = (res.stdout || '').split('\n').filter(Boolean);
  for (const line of lines.reverse()) {
    try {
      const obj = JSON.parse(line);
      if (obj.id === 2 && obj.result) return { ok: true, reason: null, data: obj.result };
      if (obj.id === 2 && obj.error) return { ok: false, reason: `mcp-error: ${obj.error.message}`, data: null };
    } catch { /* skip */ }
  }
  return { ok: false, reason: `parse-failed (exit=${res.status})`, data: null };
}
```

### 2. データ取得セクション（Stage 1: 脆弱性ニュース）

```js
const vulnNews = callMcp('user-cyber-news', 'get_news_briefs', {
  category: 'vulnerabilities',
  maxBriefs: 5,
  dateFrom: prevMonthFirstDay,
  dateTo: prevMonthLastDay,
});
const generalNews = callMcp('user-cyber-news', 'get_news_briefs', {
  category: 'cyber',
  maxBriefs: 5,
  dateFrom: prevMonthFirstDay,
  dateTo: prevMonthLastDay,
});
```

### 3. データ取得セクション（Stage 2: 当社利用 vendor の CVE）

```js
const targetVendors = [
  { vendor: 'nodejs', product: 'nodejs', label: 'Node.js (npm 全体 + 内部 script)' },
  { vendor: 'microsoft', product: 'edge_chromium', label: 'Edge (浜田 PC 主ブラウザ)' },
  { vendor: 'cybozu', product: 'kintone', label: 'kintone (本業 / 浜田管理)' },
];
const cveResults = targetVendors.map((t) => ({
  ...t,
  result: callMcp('user-cve-search', 'vul_vendor_product_cve', { vendor: t.vendor, product: t.product }),
}));
```

### 4. 当社現用バージョンとの照合（Stage 3: actionable 評価）

```js
const currentVersions = {
  nodejs: process.versions.node,
  npm: spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout.trim(),
  edge: '(浜田手動確認 → 5/1 までに更新フィールド追加検討)',
  kintone: '(cloud SaaS / 自動更新)',
};

function classifyCveAgainstCurrent(cve, currentVersion) {
  const fixedVer = cve.fixed_in;
  if (!fixedVer || !currentVersion) return 'unknown';
  return semver.lt(currentVersion, fixedVer) ? 'EXPOSED' : 'PATCHED';
}
```

### 5. Markdown 生成（Stage 4: 整形済出力）

```js
const md = renderTemplate({
  yearMonth: prevYM,
  vulnNews: vulnNews.data?.briefs || [],
  generalNews: generalNews.data?.briefs || [],
  cveResults: cveResults.map((r) => ({
    ...r,
    classified: r.result.ok ? r.result.data.cves.map((c) => classifyCveAgainstCurrent(c, currentVersions[r.vendor])) : [],
  })),
  currentVersions,
  generated_at: new Date().toISOString(),
});
fs.writeFileSync(outFile, md);
```

### 6. degraded フォールバック

MCP 呼出のいずれかが ok=false の場合:
- 該当セクションは v1 形式（プレースホルダ + reason）に fallback
- ヘッダに `**Status**: degraded (詳細: ...)` 追加
- exit 0 維持（朝 cron を止めない / TSB-013 学習）

---

## 📋 受入基準 (Acceptance Criteria)

- [ ] `node scripts/monthly-security-rounds.mjs --dry-run` で MCP 呼出を実行し完成版 markdown を生成
- [ ] v1 と差し替えた状態で 5/22 dry-run → cve-search / cyber-news 両方の実データが出力
- [ ] `env -i HOME=... PATH=...` で cron 環境シミュレートし成功（§11-5 段階 3）
- [ ] MCP 不通時に degraded fallback で exit 0
- [ ] 出力サイズ 4-8 KB / 主要 4 セクション（脆弱性 / 一般 / CVE / 当社照合）が全て埋まる
- [ ] `Cybozu / kintone` の CVE 取得テスト成功（v1 で未確認）

---

## 🧪 検証計画 (§11-5 3 段階)

| 段階 | コマンド | 期待 |
|------|----------|------|
| 1. 直接 | `node scripts/monthly-security-rounds.mjs --dry-run --month=2026-05` | exit 0 / md 生成 |
| 2. 手動 | `bash -c 'node scripts/monthly-security-rounds.mjs --dry-run'` | 同上 |
| 3. cron sim | `env -i HOME=$HOME PATH=$PATH:~/.local/bin bash -c 'node ...'` | 同上 (TSB-013 防止) |

合格時に v1 をリネーム（`monthly-security-rounds.v1.mjs.archive`）し v2 を `monthly-security-rounds.mjs` に昇格。

---

## ⏰ スケジュール

| 日付 | マイルストーン |
|------|----------------|
| 2026-05-01 (Fri) | v1 cron 初回稼働 (現状ママ / スケルトン版 / AI 手動完成) |
| 2026-05-22 (Fri) | メジャーレビュー枠で v2 実装 + 検証 + 切替 |
| 2026-05-22 22:00 | v2 deploy 完了 |
| 2026-06-01 (Mon) | v2 cron 初回稼働 (5月分の完成版報告書 自動生成) |

---

## 🛡️ リスクと対策

| リスク | 対策 |
|--------|------|
| MCP server spawn 時の env 不足 (TSB-013 再発) | callMcp 内で `~/.local/bin` を PATH に強制追加 / cron sim で事前検証 |
| MCP のタイムアウト （60s 超） | timeoutMs を引数化 / fallback 即発動 |
| cyber-news API rate limit | maxBriefs 5 件以下 / 月 1 回呼出 = rate 余裕 |
| CVE データの量爆発 (491 件等) | 上位 6 件に絞る / severity フィルタ追加可 |
| degraded 状態で誰も気付かない | 朝 cron 出力に `[degraded]` プレフィックス + 浜田 morning 報告で強調 |

---

## 📚 参考実装

- `scripts/health-check.mjs` line 155-180: ragServer の status 呼出パターン (initialize + tools/call の 2 リクエスト)
- `mcps/user-cyber-news/tools/get_news_briefs.json`: パラメータ仕様
- `mcps/user-cve-search/tools/vul_vendor_product_cve.json`: パラメータ仕様
- E-2 (4/25 08:11) で実 MCP データ収集の実証済 (`docs/reports/2026-04-security-rounds.md`)

---

## 🎓 学び (4/25 H-3 設計時の reflection)

- **「半完成」状態の予兆**: v1 がスケルトンのみ生成 = E-2 で気付いた / 4/24 朝 Phase Z の S13 v1 と同パターン → 実装時は **「人手介入必要箇所」を必ずコメントで明示** (`// TODO_v2: AI/manual paste required`) してドキュメント化
- **v1 → v2 の昇格基準**: 「cron で完結すること」「AI 介在ゼロ」を明文化 = 死蔵 v1 の発見遅延を防止
- **MCP spawn パターンの再利用性**: health-check.mjs で確立済の `spawn → jsonrpc → parse` パターンを `scripts/lib/mcp-client.mjs` 共通モジュール化候補（5/22 で同時検討）
