# MCP / ツール統廃合 — 完全仕様 v3（2026-07-11）

> **地位**: 7/11 運用最適化デー · MCP 見直し正本。憲法 § 改変なし（第3 plan 層）。  
> **実装**: **浜田全承認予定（2026-07-11）· コード/mcp.json 変更は本 spec §10 フェーズ順**  
> **版**: **v3.1**（R5 合議 · 全員 GO · verify 対象明文化 · Cold 検証タイミング · §8.2/8.4 関係整理）
> **上位**: `docs/mcp-status.md` / `data/cio-mcp-manifest.json` / `docs/runbooks/ai-team-tool-routing-v2.md` / [`2026-07-11-ai-team-ops-optimization-spec.md`](2026-07-11-ai-team-ops-optimization-spec.md)

---

## §0 CEO 1ページ（浜田向け）

### 0.1 目的

MCP **28 本**は「常時 ON」としては多すぎる。**能力退行なし**を第一に、**削除 2 + Cold 6 + コード統合**で日常 **≈15 本**に抑える。

### 0.2 数字（確定）

| 項目 | 値 |
|------|-----|
| 登録 MCP | 28 → **26**（−2） |
| registry 必須 10 | **維持**（削減不可） |
| 削除 | **mintlify** · **cyber-news**（runbook 改定後） |
| Cold（disabled 常態） | 6 グループ · intent で一時 ON |
| 削除不可 | **office-word/ppt** · **kintone-space** · doc-lane 一式 |

### 0.3 浜田作業

**全案承認予定**（2026-07-11 表明）→ 実装は AI チームが §10 順で実施 · **目視・GO は Tier B のみ**（mcp.json 変更）。

---

## §1 AI チーム合意記録（R1–R2 · 2026-07-11）

| 役割 | モデル | 合意 | 1行 |
|------|--------|:----:|-----|
| ① CIO | Opus 4.8 | GO | 能力マトリクス v2 · 退行なし削除 2 本 · Cold+O1–O4 |
| ⑤ DeepSeek | deepseek-chat | GO | ロールバック・競合・退行テストを △表に反映 |
| ③ OpenRouter | gpt-4.1-mini | GO | プロファイル検証・runbook 先行を採用（**幻覚 npm は却下**） |
| ④ Kimi | CIO 代行突合 | GO | doc-lane 削除不可 · office-word 維持を再確認 |
| **CEO** | 浜田 | **全承認予定** | AI チーム案を前提に §10 実装可 |

**合議ラウンド**: 4（v0 → v2 能力退行 → R3 スクリプト正本 → **R4 正本網羅 + 残留運用カバー**）。

### §1.1 R3 合議追記（2026-07-11）

| 役割 | 合意 | R3 で確定した追加 |
|------|:----:|-------------------|
| ⑤ DeepSeek | GO | 退行定義明文化 · 削除前スクリプト正本化を必須化 |
| ③ OpenRouter | GO | sync/overlay 依存（**採用**）· Feature Toggle/OPA（**却下**） |
| ④ Kimi | CIO 代行 | 2026-05-17 cyber-news 留置 GO の **上書き理由**を spec に明記 |
| ① CIO | GO | **△9–△12** 追加 · §10 順序修正 |

### §1.2 R4 合議追記（2026-07-11）

| 役割 | 合意 | R4 で確定した追加 |
|------|:----:|-------------------|
| ⑤ DeepSeek | GO | **△13–17** · **§8.2 運用カバー** · **§8.3 DEL 前ゲート** |
| ③ OpenRouter | GO | `verify:mcp-deleted-refs` 採用（**幻覚 npm 追加なし**） |
| ④ Kimi | CIO 代行 | constitution S14 **needles のみ** · 履歴 morning-prep **触らない** |
| ① CIO | GO | **SCR-6/7/8** · Tier B 浜田 3 項チェック §8.4 |

### §1.3 R5 合議追記（2026-07-11 · 実装前最終）

| 役割 | 合意 | R5 で確定した追加 |
|------|:----:|-------------------|
| ⑤ DeepSeek | **GO** | `verify:mcp-deleted-refs` 対象 = **本統廃合 DEL 2 件のみ**（過去削除分は対象外） |
| ③ OpenRouter | **GO** | ops P0–P2 は **別 commit** で先 push · DEL verify NG 時ログは stderr 先頭 30 件（実装済） |
| ④ Kimi | CIO 代行 | §8.4 は **Tier B 人間 3 項**（エイリアス保持ではない）· §8.2 と **競合なし** |
| ① CIO | **GO** | **Cold 6 グループ検証 = P5 一括** · §2.1 重複整理 · **v3.1 全員合意** |

**合議ラウンド**: 5（**実装前最終 · 全員 GO**）。

---

## §2.1 「退行なし」の定義（R3 追加）

次の **いずれかが満たされなくなる** 状態を退行とみなす（削除・Cold 禁止）:

1. **intent 代替** — `cio:tool:route` の category から、同等以上の情報/操作が **MCP / npm / gh / WebFetch** のいずれかで取得できる  
2. **verify 同等** — 当該レーンの `verify:*` / `cio:mcp:gate` が **exit 0** を維持  
3. **runbook 手順** — doc-lane · 月次セキュリティ · deploy 前 gate が **手順どおり完走**  
4. **Protected** — office-word/ppt · kintone-space · registry 10 は **常に上記を満たす**

**2026-05-17 CEO GO（cyber-news 留置）** は、本 spec **2026-07-11 浜田全承認** により **DEL-2 + runbook 改定** で supersede（理由: cve-search + DDG で同等 · 日常 MCP 削減）。

**設計原則（4）**: 能力退行なし · 安全（bak/gate/Tier B）· 確実（既存 verify のみ）· 效率（日常 ON 削減 + O1/O2 統合）

## §3 現状スナップ（2026-07-11 実測）

| 指標 | 値 |
|------|-----|
| MCP 登録 | 28 |
| `cio:health` | GREEN · MCP 6/6 |
| 7日 active | 5（deepseek/kimi/openrouter/kintone/kintone-schema-mcp） |
| 7日 dormant | 3（office-word · context7 · git-history-mcp） |
| 削除候補（dormancy 機械） | 0 |

---

## §4 三層モデル

```
Core 10 … registry 必須（常時 ON）
Warm 6 … kintone-schema-mcp, git-history-mcp, eslint-mcp, repo-tree, figma, rag
Cold 6 … chrome-devtools, shadcn-ui, colors-fonts, accessibility-scanner, github, kintone-dev+context7（プロファイルで束ね）
Protected … office-word, office-powerpoint, kintone-space（削除・Cold 常態禁止）
```

**プロファイル `governance`（運用日）**: Core10 + Warm の schema/git-history/eslint/repo-tree ≈ **14–15 ON**

---

## §5 能力退行マトリクス（要約）

| 判定 | MCP |
|------|-----|
| **Core（削除不可）** | deepseek, kimi, openrouter, memory, sequential-thinking, rag, markdownify, kintone, playwright, duckduckgo-search |
| **Protected（削除不可）** | office-word, office-powerpoint, kintone-space |
| **Keep / Cold 可** | figma, shadcn-ui, colors-fonts, chrome-devtools, accessibility-scanner, github, kintone-dev, context7, eslint-mcp, repo-tree, kintone-schema-mcp, git-history-mcp |
| **Delete（退行なし）** | mintlify → Web+repo 編集 |
| **Delete（runbook 後）** | cyber-news → cve-search + DDG |

詳細: v2 チャット合議記録（handoff §2026-07-11 MCP）。

---

## §6 統廃合フェーズ

### 6.0 Phase SCR — スクリプト正本（DEL より先 · R3 必須）

| ID | 触る正本 | 内容 |
|----|----------|------|
| SCR-1 | `scripts/sync-cursor-mcp-windows-from-wsl.mjs` | `cyber-news` 硬编码ブロック削除 |
| SCR-2 | `scripts/lib/repo-mcp-overlays.mjs` · `.cursor/mcp.json` | `mintlify` 除去 |
| SCR-3 | `scripts/verify-cio-mcp-registry.mjs` · `data/cio-mcp-manifest.json` | recommended から DEL 対象除去 |
| SCR-4 | `scripts/check-mcp-dormancy.mjs` · `scripts/verify-cursor-mcp-windows.mjs` | exempt/overlay needles 更新 |
| SCR-5 | `scripts/refresh-mcp-status-usage.mjs` | 台帳行定義から DEL 対象除去 |
| **SCR-6** | `monthly-security-rounds.mjs` · `monthly-security-report.md` · `constitution.mdc` S14 needles · `AGENTS.md` §50 表 | cyber-news 手順 → **cve-search + duckduckgo-search** |
| **SCR-7** | `cio-mcp-four-ai-matrix.json` · `cio-ai-team-tool-routing.json` | DEL 対象を mcpAllow / security-cve route から除去 |
| **SCR-8** | `security-next-automation/README.md` · `check-mcp-dormancy.mjs` cyber-news exempt | 削除対象の **dormancy exempt / README 補助表** 除去 |

**検証**: `verify:cio-mcp-registry` · `verify:cursor-mcp-windows` · `node scripts/check-mcp-dormancy.mjs` · **`verify:mcp-deleted-refs`**

### 6.1 Phase DEL-1 — mintlify 削除

| 項目 | 内容 |
|------|------|
| 失う能力 | IDE から Mintlify checkout/PR |
| 代替 | リポ `docs/` 直接編集 · Mintlify Web デプロイ |
| 触る正本 | `~/.cursor/mcp.json` · `.cursor/mcp.json` · `data/cio-mcp-manifest.json` · `data/cio-mcp-four-ai-matrix.json` · `mcp-server-use-triggers.mdc` · overlay スクリプト |
| 検証 | `verify:cio-mcp-registry` · `cio:health` · `verify:mcp-four-ai-alignment` |

### 6.2 Phase DEL-2 — cyber-news 削除

| 項目 | 内容 |
|------|------|
| 失う能力 | フィード型セキュリティニュース一括 |
| 代替 | `cve-search` MCP（`vul_last_cves` 等）+ `duckduckgo-search` / WebFetch |
| **先行必須** | SCR-6 完走 · `security-news-response.mdc` · `AGENTS.md` §50 想起 · `cio-ai-team-tool-routing.json` · `docs/constitution/12-mcp-usage.md` · **`constitution.mdc` S14 needles** |
| 退行確認 | 月次セキュリティ巡回 **dry-run 1 回**（cve-search のみで同等情報取得） |
| 検証 | 上記 + `verify:cio-tool-routing-infra` · `check-mcp-dormancy.mjs` |

### 6.3 Phase COLD — プロファイル 6 グループ

| ID | disabled 常態 | 復活トリガー（intent / npm） |
|----|---------------|------------------------------|
| C1 | chrome-devtools | `frontend-ui` · FE バグ |
| C2 | shadcn-ui | customize FE · shadcn 追加 |
| C3 | colors-fonts | `design-figma` |
| C4 | accessibility-scanner | `accessibility-audit` · customize 検収 |
| C5 | github | `github-ci` · **gh 失敗時のみ** ON |
| C6 | kintone-dev, context7 | `kintone-schema-live` · `library-docs` |

**新規**: `data/cio-mcp-profiles.json` + `npm run cio:mcp:profile -- --apply governance|kintone|fe|doc-lane|security`

| 検証 | `verify:cio-mcp-manifest` needles · 適用後 `cio:mcp:env` · `node scripts/check-mcp-dormancy.mjs` |

### 6.4 Protected — 触らない

- **office-word / office-powerpoint** — doc-lane Phase1–2 GO · `verify:doc-lane-*`  
- **kintone-space** — `cio:mcp:gate` · Space 48 probe · ポータル作業

---

## §7 コード最適化（O1–O4）

| ID | 内容 | 正本 | 検証 |
|----|------|------|------|
| **O1** | kintone REST 統合 — `scripts/lib/kintone-live-schema.mjs` の `getKintoneConfig` / POST を MCP から import（**新規 lib 乱立禁止**） | `mcp/kintone-schema-mcp/index.mjs` thin 化 | `verify:kintone-live-schema` |
| **O2** | git-history 統合 — `git-history-core.mjs` 抽出 ← `git-history-alignment.mjs` + MCP handlers | `mcp/git-history-mcp/index.mjs` | `verify:git-history-alignment` |
| **O3** | `cio:mcp:profile` — Cold ON/OFF 機械化 | `data/cio-mcp-profiles.json` | `verify:cio-mcp-manifest` |
| **O4** | kintone-space npm REST ラッパー（**将来** MCP 削減の保険 · 本フェーズでは space MCP 維持） | `scripts/kintone-space-api.mjs` 新規 | `kintone:probe-space -- 48` |

---

## §8 △ / リスク対策一覧（R2 確定）

| ID | △ / リスク | 対策 | 残留 |
|----|------------|------|------|
| △1 | mcp.json 変更で IDE 旧プロセス残留 | 変更後 **Reload Window** 1 行を runbook 固定 | 低 |
| △2 | DEL-2 で月次セキュリティ手順が cyber-news 前提 | runbook **先行改定** + dry-run 1 回 | 低 |
| △3 | Cold 化で intent 時に MCP 未 ON | `cio:mcp:profile` が intent→profile マップ · 失敗時 `MCPスキップ` テンプレ | 低 |
| △4 | O1/O2 統合で MCP と npm 結果不一致 | **同一 lib import** · フェーズごと verify | 低 |
| △5 | WSL/Win 二重 mcp.json ドリフト | DEL/COLD 後 **`mcp:sync-cursor-windows` 必須** | 中→低 |
| △6 | github 削除 vs gh 代替 | **github は Cold のみ**（DEL しない）· WSL は gh 第一 | 低 |
| △7 | 外部 AI 幻覚 npm（OpenRouter 案） | **CIO 検収** · 検証は `package.json` 既存 script のみ | 低 |
| △8 | doc-lane 誤削除 | Protected リスト + verify needles 固定 | 低 |
| **△9** | **`mcp:sync-cursor-windows` が cyber-news を硬编码再注入** | DEL-2 **前に** `sync-cursor-mcp-windows-from-wsl.mjs` から除去 | **高→低** |
| **△10** | **mintlify overlay が `repo-mcp-overlays.mjs` / `verify-cursor-mcp-windows` で復活** | DEL-1 **前に** overlay リスト・`.cursor/mcp.json`・verify needles 更新 | **高→低** |
| **△11** | **`verify-cio-mcp-registry` RECOMMENDED に削除対象が残る** | manifest/registry/dormancy exempt を **同 commit** で更新 | 中→低 |
| **△12** | **運用最適化 P0–P2 未 commit と MCP P0 並行** | 同一セッションで **spec 2 本 + 実装** を commit 分割（ops / mcp） | 低 |
| **△13** | 月次スケルトン/憲法 S14 が cyber-news 前提 | **SCR-6** + `monthly-security-rounds --dry-run` | 低 |
| **△14** | matrix/routing に DEL 対象 stale | **SCR-7** + O3 route フィルタ（disabled 提案禁止） | 低 |
| **△15** | constitution 大量埋込の誤想起 | S14 **needles のみ**更新 · 履歴節は **superseded 1 行** · 全184 hit 一括改変 **禁止** | 低 |
| **△16** | sync が WSL 非依存で cyber-news 硬注入 | SCR-1 + **§8.2 #2 双方向 mcp.json** | 低 |
| **△17** | verify が routing 退行未検知 | **`verify:mcp-deleted-refs`** + DEL 前ゲート §8.3 | 低 |
| R01 | ロールバック不能 | `%USERPROFILE%\.cursor\mcp.json.bak.<ISO>` 自動作成手順 §8.1 | 低 |
| R02 | registry 10 誤削除 | `verify:cio-mcp-registry` exit 2 で停止 | 低 |

### 8.2 残留リスクの運用カバー（R4 確定 · 100% 自動化不能分）

| # | 残留（万全にならない点） | 運用カバー（確定） | 担当 | タイミング |
|---|--------------------------|-------------------|------|------------|
| **1** | IDE 旧 MCP プロセス残留（△1） | Tier B 後 **Cursor Reload Window 必須** → `cio:mcp:gate` 再実行 | 浜田 | P3/P4/P5 各 Tier B 直後 |
| **2** | WSL/Win 二重 mcp.json（△5/16） | DEL 時 **両方**から DEL 対象キー削除 → `npm run mcp:sync-cursor-windows` → gate | AI + 浜田目視 | P3/P4 |
| **3** | cyber-news 2 週 disabled 観察（P4） | checkpoint **`disabledUntil: YYYY-MM-DD`** 1 行 · handoff 日付 · **DEL-2 は日付以降のみ** | CIO | P4 開始〜2週 |
| **4** | 月次能力 dry-run（△2/13） | DEL-2 前ターン: AI が **cve-search `vul_last_cves` + DDG 1 件**取得 · handoff に URL 1 行 | CIO | P4 出口 |
| **5** | constitution 履歴節（△15） | S14 先頭に `<!-- superseded 2026-07-11 MCP spec v3 · cyber-news→cve-search+DDG -->` · **他節は不触** | AI | SCR-6 |
| **6** | 履歴 morning-prep / plans（アーカイブ） | **grep 対象外**（`verify:mcp-deleted-refs` 除外パス）· 改変 **禁止** | — | 常時 |
| **7** | Cold intent 時 MCP 未 ON（△3） | `cio:mcp:profile -- --apply <intent>` を turn-start 契約 3 行目に追記 · 失敗時 **`MCPスキップ: profile=<名> 未適用`** | AI | P5 以降 |
| **8** | routing が削除 MCP を提案（△14/17） | SCR-7 + **`cio:tool:route -- --intent security`** が cyber-news **ゼロ**を DEL 前ゲートで確認 | AI | §8.3 |
| **9** | ロールバック要否 | Tier B 直前に **`mcp.json.bak.<ISO>`** 自動 copy（手順 §8.1）· NG 時 **5 行で復旧** | AI | Tier B 直前 |

**原則**: 上表 **#1–#4・#8** が未実施のまま DEL-2 に進むことを **禁止**（CIO 判断 · 浜田は Tier B のみ）。

### 8.3 DEL 前ゲート（P2.5 出口 = P3/P4 入口 · 機械固定）

**`verify:mcp-deleted-refs` 対象スコープ（R5 確定）**: 本統廃合で削除する **`mintlify` · `cyber-news` の 2 件のみ**。過去統廃合で既に削除済みの MCP 名は **対象外**（grep コスト・誤 NG 防止）。

**P3（mintlify）・P4（cyber-news disabled/DEL）の直前**に、次を **順番固定 · すべて exit 0**:

```powershell
npm run verify:mcp-deleted-refs
npm run verify:cio-mcp-registry
npm run verify:cursor-mcp-windows
node scripts/check-mcp-dormancy.mjs
npm run verify:cio-mcp-manifest
npm run verify:mcp-four-ai-alignment
npm run verify:cio-tool-routing-infra
node scripts/monthly-security-rounds.mjs --dry-run
npm run cio:tool:route -- --intent "CVE 脆弱性"
```

**NG 時**: DEL **中止** · SCR 差戻し · handoff 1 行。

**P4 DEL-2 本体追加**（disabled 2 週経過後）:

```powershell
npm run cio:mcp:gate
npm run cio:health
```

### 8.4 Tier B — 浜田 3 項チェック（人間 · 各 30 秒）

> **§8.2 との関係（R5）**: §8.2 は **AI/CIO 運用 9 項** · §8.4 は **浜田が Tier B で Yes/No する 3 項**。**競合なし**（エイリアス保持期間等は **規定しない** · DEL 前ゲート exit 0 が前提）。

mcp.json 変更 GO の前に、浜田が **Yes/No のみ**確認:

1. **バックアップ**: `%USERPROFILE%\.cursor\mcp.json.bak.*` が **直近 5 分以内**に存在する  
2. **DEL 前ゲート**: AI が §8.3 の **全コマンド exit 0** をチャットに貼付済み  
3. **Reload 予約**: 変更後 **Reload Window** する旨を AI が 1 行宣言済み  

3 項すべて Yes → **Tier B GO** · 1 項でも No → **保留**

### 8.1 ロールバック（5 行）

1. `copy mcp.json.bak.<timestamp>` → `%USERPROFILE%\.cursor\mcp.json`  
2. `npm run mcp:sync-cursor-windows`  
3. Cursor **Reload Window**  
4. `npm run cio:mcp:gate`  
5. handoff 1 行追記

---

## §9 ブラウザ系決定木（統合しない · M-A1）

```
ログイン後 E2E / DOM スモーク → playwright
WCAG / axe / キーボード → accessibility-scanner（intent 時 profile ON）
DevTools / Lighthouse / 深コンソール → chrome-devtools（intent 時 profile ON）
```

正本追加先: `.cursor/rules/mcp-server-use-triggers.mdc` · `ai-team-tool-routing-v2.md` §付録

---

## §10 実装フェーズ（浜田全承認 · 順序固定）

| Phase | 内容 | Tier | 検証 |
|-------|------|------|------|
| **P0** | O1 kintone MCP thin 化 | A | `verify:kintone-live-schema` |
| **P1** | O2 git-history-core 抽出 | A | `verify:git-history-alignment` |
| **P2** | O3 profiles JSON + `cio:mcp:profile` + 決定木 doc | A | `verify:cio-mcp-manifest` · `verify:cio-tool-routing-infra` |
| **P2.5** | **SCR スクリプト正本**（§6.0 SCR-1〜8） | A | **§8.3 DEL 前ゲート全 OK** |
| **P3** | DEL-1 mintlify 削除（**SCR 後**） | B | ✅ **CLOSED** 2026-07-11 実施 · **浜田追認 GO 2026-07-15**（稼働正本ゼロ · `verify:mcp-deleted-refs`） |
| **P4** | runbook 改定 + cyber-news **disabled 2 週**（§8.2 #3 日付記録）→ DEL-2（**SCR + 前ゲート後**） | B | §6.2 + §8.3 + §8.4 + dry-run |
| **P5** | COLD プロファイル適用 · **Cold 6 グループ一括検証** | B | §6.3 検証 + `check-mcp-dormancy` + profile 適用後 gate |
| **P6** | O4 kintone-space npm ラッパー（任意 · 保険） | A | `kintone:probe-space` |

**禁止**: P3 以前の mcp.json 削除 · Protected MCP 削除 · registry 10 削減

### §10.1 commit 分割（R5 · △12 確定 · 本 push 範囲）

| commit | 内容 | 実装 |
|--------|------|:----:|
| **C1** | 運用最適化 spec + **P0–P2 実装** | 本 push |
| **C2** | MCP 統廃合 spec v3.1 + `verify:mcp-deleted-refs` + checkpoint/handoff | 本 push |
| C3以降 | §10 P0–P6 コード（**浜田 implement 合図後**） | 別 push |

**本 push 範囲**: **C1 + C2 のみ**（mcp.json 変更 **なし** · Tier B 未実施）

---

## §11 一括検証（実装完了後）

```powershell
npm run verify:mcp-deleted-refs
npm run verify:cio-mcp-registry
npm run cio:mcp:gate
npm run cio:health
npm run verify:cio-mcp-manifest
npm run verify:mcp-four-ai-alignment
node scripts/check-mcp-dormancy.mjs
```

---

## 付録 A — 関連正本

| パス |
|------|
| `docs/plans/2026-05-17-mcp-optimization-plan.md` |
| `docs/runbooks/doc-lane-autonomous-governance.md` |
| `docs/runbooks/cio-friday-mcp-status-refresh-4ai.md` |
| `scripts/check-mcp-dormancy.mjs` |
| `scripts/apply-repo-mcp-overlays-windows.mjs` |
| `scripts/verify-mcp-deleted-refs.mjs` |

---

## 改定履歴

| 日付 | 内容 |
|------|------|
| 2026-07-11 | v1 — R2 合議 · 浜田全承認予定 · 能力退行なし確定 |
| 2026-07-11 | v2 — R3 合議 · △9–12 · SCR 先行 · 退行定義 §2.1 · cyber-news 2週 disabled 経由 |
| 2026-07-11 | v3.1 — R5 合議 · 全員 GO · verify スコープ · Cold=P5 · §8.2/8.4 · §10.1 commit 分割 |
