# 🔬 MCP 強化戦略 — 段階 2: 10 次元深掘り分析

**作成**: 2026-04-23 (Thu) 02:25 JST
**対象**: 段階 1 監査 (`docs/reports/2026-04-23-mcp-audit-stage1.md`) で抽出した 10 次元
**目的**: 各次元で「現状 / 課題 / 改善案 A/B/C / §48 推奨」を提示し、段階 3 で proposal 化する内容を確定する
**§47-9 適用**: 着手前判断完了（浜田 4/22 22:00 締め後の追加依頼 / a スコープ = 全 16 MCP 網羅 / 19:00 戻り）

---

## 📌 段階 1 訂正

段階 1 §6.1 で「RAG index は 9 日古い (4/14)」と記載したが**誤り**。実際は `daily-morning-prep.mjs` が朝 06:00 cron で `mcp-local-rag ingest docs/` + `ingest .rag/extra-docs/` を自動実行している（line 178-196）。`chunks.lance/_transactions/_versions/_indices/_deletions` は **2026-04-22 06:01 更新**で健全。

ただし**新たな課題**として確認: **同日中に追記した docs（TSB-010 21:22 / TSB-007 ep3 21:36 / TSB-011 22:13）は翌朝 06:00 まで RAG に反映されない** = タイムラグ最大 24h。段階 3 で対策案を proposal 化する。

---

## 次元 1: kintone 一極集中の分散戦略（最重要）

### 現状
- kintone (公式 MCP) = 過去 30 日 38 回（94.7% 占有）
- kintone-dev (自作) = 0 回
- kintone-space (自作) = 0 回
- → 公式 MCP が「使える機能」をほぼ全カバーしているため、自作 2 件が活用されない構造

### 課題
1. 自作 MCP の存在意義が不明（特に kintone-dev）= **削除候補 vs 役割明確化**の判断が宙ぶらりん
2. PC 台帳 PJ 4/23-26 で **5 個のアプリ作成 + フィールド設計 + ビュー設定 + customize 配置** を行うが、kintone-dev / kintone-space の **アプリ作成系ツール**を活用すれば公式 MCP より高速の可能性
3. 公式 kintone MCP の負荷が高すぎる（38/40 = 95%）= 1 ツールに依存しすぎ

### 改善案
**A. 自作 2 件削除 + 公式 1 本化**
- メリ: 設定 simple / メンテ不要 / 認知負荷↓
- デメ: 自作の独自機能（推定 = アプリ一括作成 / スペース直配置）を捨てる
- 想定リスク: 公式 MCP が将来 breaking change した時に逃げ場がない

**B. 役割明確化 + ドキュメント化（推奨候補 1）**
- 公式 `kintone` = レコード CRUD / フィールド読取 中心
- `kintone-dev` = アプリ作成 / フォーム編集 / デプロイ系
- `kintone-space` = スペース管理 / アプリ配置 / スレッド操作
- 各 MCP の `describe tools` を AI が確認 → AGENTS.md に役割マトリクス記載

**C. PC 台帳 PJ で実戦投入（推奨候補 2）**
- 4/23 環境設定マスタ作成 = `kintone-dev` で挑戦
- スペース 21 への配置 = `kintone-space` で挑戦
- 結果次第で自作 MCP の価値判定 → 不要なら 5/13 後に削除

### 私の §48 推奨: **B + C の併用**
- 段階 3 proposal: ① 各 MCP の `describe tools` 結果を `docs/mcp-roles.md` にカタログ化 ② 4/23 朝 PC 台帳 Day 1 で kintone-dev / kintone-space を必ず 1 回ずつ試す → 結果記録

---

## 次元 2: 死蔵 MCP 14 件の「想起トリガー」設計

### 現状
- 14/16 (87.5%) MCP が過去 30 日 0 回使用
- 原因: ① AI（私）が存在を忘れる ② Cursor 標準ツールで先に解決してしまう ③ MCP 起動の認知コスト > 機能便益

### 課題
- **「いつ MCP X を使うべきか」の積極的ガイドが AGENTS.md にない**（§20 RAG のみ）
- AI（私）の自己想起に頼ると永遠に使われない構造的問題

### 改善案
**A. AGENTS.md §50 新設「MCP 想起儀式」**（最重要）
タスク開始時の 30 秒儀式に「該当 MCP がないか」を確認するチェックリストを義務化:

| シーン | 該当 MCP |
|---|---|
| URL 取得 | fetch（ただし Cursor 標準 WebFetch で代替可なら不要）|
| Web 検索 | google-search / tavily |
| 過去設計判断調査 | rag（§20 と統合）|
| アクセシビリティ検査 | accessibility-scanner |
| ブラウザ自動操作 / E2E | playwright |
| CVE 脆弱性確認 | cve-search |
| PowerPoint 生成 | office-powerpoint（Win 必要）|
| GitHub 操作 | github（Win 必要）|
| サイバーニュース | cyber-news |
| 段階的思考 | sequential-thinking |
| セッション横断記憶 | memory |
| ファイル操作 | filesystem（Cursor 標準で代替可なので原則使わない）|

**B. health-check.mjs に「死蔵 MCP 警告」追加**
- 過去 7 日使用 0 回の MCP を朝ブリーフィングに ⚠ 表示
- 浜田 / AI 双方が「使ってない」を可視化 → 削除 or 活性化判断

**C. 朝ブリーフィングに「今日の MCP 推奨」を 1 件ランダム表示**
- 死蔵 MCP の中から 1 件選んで「今日はこの MCP を 1 回試そう」と提示
- 強制力低めで自然に試す機会を作る

### 私の §48 推奨: **A + B（C は段階 4 以降）**
- A は AGENTS.md §50 として制定（ただし §47-B ルール疲労ガード適用 = 「ルール総数増えるリスク」併記）
- B は scripts/health-check.mjs 拡張 = 即実装可能
- C は精神論的なので様子見

---

## 次元 3: RAG 自動 ingest の同日反映遅延

### 現状
- 朝 06:00 cron で `daily-morning-prep.mjs` が `ingest docs/` 実行 → 健全
- ただし**同日中に追加した docs（例: 4/22 21:22 の TSB-010）は翌朝 06:00 まで RAG に反映されない**
- → 同日 23:00 に「TSB-010 を rag_search で引け」と指示しても出てこない

### 課題
- 「即時性が求められる調査」（同日のバグ調査 / トラブル対応）で RAG が使い物にならない
- AI（私）が「RAG は使えない」とラベル付けして §20 義務を後回しにする悪循環

### 改善案
**A. 手動 ingest コマンドの簡略化（推奨）**
- `npm run rag:ingest` を package.json に追加 = `npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/` のラッパー
- 私（AI）が dump 後に必ず叩く儀式を AGENTS.md §21 に追加

**B. file-watcher 拡張**
- 既に `scripts/file-watcher.mjs` が稼働中（PID 41917 / Apr19~）
- これに「docs/troubleshooting.md or docs/plans/*.md が変更されたら 5 分後に rag ingest を呼ぶ」機能を追加
- 副作用: ingest 中の RAG MCP query 失敗の可能性（要検証）

**C. 1 時間 cron で増分 ingest**
- 別 cron ジョブで 1 時間ごとに `ingest docs/` を呼ぶ
- 副作用: 不要時も毎時 ingest = リソース消費

### 私の §48 推奨: **A（即時 / 低リスク）+ §21 への明文化**
- B は副作用検証が必要なので段階 4 以降
- C は無駄が多い

---

## 次元 4: mcp.json セキュリティ（平文パスワード問題）

### 現状
```json
"kintone": {
  "env": {
    "KINTONE_PASSWORD": "kent2511"  // 平文
  }
}
"kintone-space": {
  "env": {
    "KINTONE_PASSWORD": "kent2511"  // 同上
  }
}
```

### 課題
1. `cat ~/.cursor/mcp.json` で誰でも閲覧可能
2. mcp.json の git バックアップが取られたら漏洩リスク（実際 `scripts/backup-mcp.sh` が `kintone-ai-lab/backups/mcp/` に保存している = git tracked なら最悪）
3. cron ログ等にも引きずられる可能性

### 改善案
**A. .env 経由化（推奨）**
- mcp.json: `"KINTONE_PASSWORD": "${KINTONE_PASSWORD}"`
- Cursor の env 解決機能で `.env` から展開
- ただし **Cursor MCP の env 解決仕様を確認必要**（公式 docs: https://docs.cursor.com/context/model-context-protocol）

**B. 一時的に mcp.json 削除 + 起動時生成**
- mcp.json テンプレート + 起動 wrapper script で `.env` を読んで mcp.json を組み立て → Cursor 起動
- 重い対応 / Cursor 既存の起動シーケンスと干渉のリスク

**C. 現状維持 + git backup から exclude**
- `kintone-ai-lab/backups/mcp/` を `.gitignore` に追加
- 漏洩リスクの最大の経路を塞ぐ

### 私の §48 推奨: **C を即時 + A を 5 月以降に Cursor MCP 仕様調査の上で実施**
- C はリスクの 80% を吸収（最重要 + 即時 + 低工数）
- A は仕様調査必要 = 5 月以降

---

## 次元 5: tavily disabled の宙ぶらりん解消

### 現状
- mcp.json に `"disabled": true` で記載 / 理由・期間・再評価日の記録なし
- google-search MCP が稼働中 = 機能的に冗長の可能性

### 改善案
**A. 廃止（削除）**
- google-search で代替可能なら mcp.json から完全削除
- 簡潔 / メンテ不要

**B. 再有効化**
- API キー確認 + 課金状態確認 → 再有効化
- google-search との使い分けを明確化

**C. 状態管理台帳に記録 + 5/16 再判断**
- `docs/mcp-status.md` 作成 / disabled の理由・期間・再評価日を記録
- 後で「なんで止まってるんだっけ」が必ず起きる問題を解決

### 私の §48 推奨: **C（管理化）+ 5/16 浜田判断で A or B**
- C は記録だけなのでリスクゼロ
- A/B は浜田の判断材料が必要（API キー / 課金 / 業務上の必要性）

---

## 次元 6: PC 台帳 PJ × 全 16 MCP 活用マトリクス

### マトリクス（4/23 木 ~ 5/13 水 までの 21 日間）

| MCP | Day 1<br>(4/23 環境設定マスタ) | Day 2<br>(4/24 M365管理マスタ) | Day 3<br>(4/25 新・PC台帳ver.1) | Day 4<br>(4/26 customize) | 移行<br>(4/30-5/2) | 試運用<br>(5/7-12) | 本番<br>(5/13~) |
|---|---|---|---|---|---|---|---|
| **kintone** (公式) | ✅ レコード CRUD | ✅ 同 | ✅ 同 | ✅ 同 | ✅ 一括 import | ✅ 状態確認 | ✅ 通常運用 |
| **kintone-dev** (自作) | ⭐ アプリ作成試験 | ⭐ 同 | ⭐ 同 | - | - | - | - |
| **kintone-space** (自作) | ⭐ スペース 21 配置試験 | ⭐ 同 | ⭐ 同 | - | - | - | - |
| **rag** | ⭐ §20 義務（過去設計確認）| ⭐ 同 | ⭐ 同 | - | - | - | ⭐ 月次再 ingest |
| **filesystem** | △ Cursor 標準で代替 | △ | △ | △ | △ | △ | - |
| **memory** | ⭐ 設計判断記憶 | ⭐ 同 | ⭐ 同 | - | - | - | ⭐ 長期記憶 |
| **sequential-thinking** | ⭐ 大型設計判断 | ⭐ 同 | ⭐ 同 | - | - | - | - |
| **playwright** | - | - | - | ⭐ customize E2E | - | ⭐ 試運用テスト | - |
| **accessibility-scanner** | - | - | - | ⭐ UI a11y チェック | - | - | - |
| **cve-search** | - | - | - | △ 依存パッケージ脆弱性 | - | - | △ 月次 |
| **fetch** | - | - | - | △ Cursor 標準で代替 | - | - | - |
| **google-search** | - | - | - | △ 公式 docs 確認 | - | - | - |
| **github** | △ Win 起動 | △ | △ | △ | △ | △ | △ |
| **office-powerpoint** | - | - | - | - | - | - | △ 月次レポート |
| **cyber-news** | - | - | - | - | - | - | △ 週次 |
| **tavily** | ⏸ disabled | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ |

凡例: ⭐ 必須 / ✅ 通常活用 / △ 候補 / - 該当なし / ⏸ disabled

### キーアクション（PC 台帳 PJ 内で必ず試す）
1. **4/23 朝**: kintone-dev で 環境設定マスタ作成試験 + 結果記録
2. **4/23 朝**: kintone-space で スペース 21 配置試験 + 結果記録
3. **4/23 朝**: rag_search で「環境設定マスタ 仕様」検索 → 過去判断引用
4. **4/23 朝**: memory で「PC 台帳 PJ Day 1 の重要決定」を保存（試験）
5. **4/26**: playwright で customize 動作 E2E 試験
6. **4/26**: accessibility-scanner で kintone UI チェック

---

## 次元 7: MCP 統合パターン（連鎖活用）

### 現状
- 各 MCP を単独で使う発想に留まっている
- 「sequential-thinking → rag → memory」の連鎖などの設計パターンが未開発

### 提案する 5 つの統合パターン

#### パターン A: 大型設計判断（PC 台帳 v3 等）
```
1. sequential-thinking: 段階的に論点を分解
2. rag: 過去の類似設計判断を検索
3. memory: 暫定結論を保存（後セッションで参照）
4. (浜田判断後) memory: 確定結論を上書き保存
```

#### パターン B: バグ調査
```
1. rag: 過去に類似 TSB がないか検索（§20 義務）
2. (なければ) sequential-thinking: 仮説を 5 つ並列に出す
3. (検証後) docs/troubleshooting.md に TSB-XXX 追記
4. (即時) npm run rag:ingest で当日反映（次元 3 提案）
```

#### パターン C: kintone アプリ作成（PC 台帳 PJ）
```
1. kintone-dev: アプリ作成 + フィールド一括設計
2. kintone-space: スペース 21 に配置
3. kintone (公式): フィールド検証 + サンプルレコード追加
4. memory: 作成記録を保存（後参照用）
```

#### パターン D: 経理 FAQ 等の Web UI 改修
```
1. accessibility-scanner: 改修前の現状検査
2. (改修後) playwright: E2E で動作確認
3. accessibility-scanner: 改修後再検査 → 改善 / 悪化判定
```

#### パターン E: セキュリティ巡回（月次）
```
1. cve-search: 依存パッケージ全件スキャン
2. cyber-news: 直近 30 日の重大ニュース取得
3. (issues あれば) docs/reports/<月>-security-review.md に記録
4. rag: 過去の同型対応を検索
```

### 私の §48 推奨
- パターン A / B / C を AGENTS.md に追記（「典型ワークフロー」セクション新設）
- パターン D / E は 5/13 本番運用後に試行

---

## 次元 8: 新規 MCP 候補

### 検討候補

| 候補 MCP | 用途 | 優先度 | 理由 |
|---|---|---|---|
| **slack-mcp** | Slack 通知 / 取得 | 中 | 浜田が Slack 使ってるか不明（要確認）|
| **notion-mcp** | Notion 操作 | 低 | 浜田は Notion 使ってない（kintone がメイン）|
| **linear-mcp** | Linear (issue tracker) | 低 | issue tracker は GitHub Issues + チャットで間に合ってる |
| **postgres-mcp / sqlite-mcp** | DB 直接操作 | 中 | kintone が DB なので不要だが、ローカルで logs/task-estimates.jsonl を query したい時に便利 |
| **git-history-mcp** | git 履歴の高度検索 | 中 | `git log --grep` で十分 / でも「過去 30 日で TSB に言及した commit」のような複雑検索が便利 |
| **excel-mcp** | Excel 直接操作 | 高 | 浜田は **kintone と Excel 両方使う** = M365 ライセンス管理 / 経理 FAQ で頻出 / **新規導入候補 1** |
| **chrome-bookmark-mcp** | ブラウザブックマーク参照 | 低 | 用途限定的 |
| **claude-code-cli-bridge** | Claude Code CLI 連携 | 低 | 既に並行チャット騒動の温床（TSB-011）= 増やさない |

### 私の §48 推奨
- **excel-mcp**: 浜田の業務（M365 5 台ライセンス管理 + 経理 FAQ）に直結 → 5 月以降に検討候補（PC 台帳 PJ 完了後）
- **slack-mcp**: 浜田に「Slack 使ってる？」を聞いてから判断（情報待ち）
- 他は**追加しない方針**（§47-B ルール疲労ガードの趣旨と整合 / MCP 16 → 17+ の肥大化防止）

---

## 次元 9: コスト効率（外部 API 課金 / トークン消費）

### 現状
| MCP | 課金 | 月間想定コスト |
|---|---|---|
| kintone (公式) | API call 数 = kintone ライセンス内なら無料 | ¥0 |
| kintone-dev / kintone-space (自作) | 同上 | ¥0 |
| google-search | Google Custom Search API = 月 100 回まで無料 / 超えたら $5/1000 query | 過去 30 日 0 回 = ¥0 |
| tavily | 月 1000 回無料枠あり / 超えたら課金 | disabled = ¥0 |
| cve-search | 完全無料 (NIST NVD 公開 API) | ¥0 |
| fetch / memory / filesystem / sequential-thinking | 完全無料（ローカル）| ¥0 |
| rag | 完全無料（ローカル LanceDB）| ¥0 |
| accessibility-scanner | 完全無料（ローカル）| ¥0 |
| playwright | 完全無料（ローカルブラウザ）| ¥0 |
| cyber-news | 各種 RSS / 公開 API = 無料 | ¥0 |
| github / office-powerpoint | Win 起動 / 課金なし | ¥0 |

### 結論
- **現状の月額 MCP コスト = ¥0**（素晴らしい）
- 注意点: google-search が万が一月 100 回超えたら課金開始（現状リスク低 = 過去 30 日 0 回）
- 新規 MCP 候補（excel-mcp 等）導入時はコスト確認必須

---

## 次元 10: 5/13 本番運用後の MCP 活用（運用自動化）

### 5/13 以降の業務想定
1. PC 台帳の日常運用（新 PC 登録 / 退職処理 / アカウント追加）
2. M365 ライセンス枯渇監視
3. 旧 594/627/626/667 の書込ロック確認
4. SKYSEA 計画開始（5/17~）
5. サブエージェント PoC-1 再議論（5/16）

### MCP 活用案
| 業務 | MCP 活用 |
|---|---|
| **日次 M365 5 台ライセンス監視** | kintone（自動 query）+ memory（前日比較）+ slack-mcp（アラート / 導入時）|
| **旧アプリ書込検知** | kintone（rev 比較）+ playwright（UI 経由テスト）|
| **SKYSEA × kintone 突合** | kintone + filesystem（CSV 経由）+ rag（過去設計参照）|
| **月次セキュリティレビュー** | cve-search + cyber-news + rag（過去対応参照）|
| **経理 FAQ 改修** | playwright + accessibility-scanner（次元 7 パターン D）|
| **PowerPoint 月次報告** | office-powerpoint（Win 起動 / 浜田が直接使用）|

### 私の §48 推奨
- 5/13 本番運用開始**前後**で、上記表をベースに「業務 × MCP マトリクス v2」を作成
- これは **段階 3 の戦略書 v1.0 に「将来運用想定」セクション**として記載

---

## 段階 2 結論 — 段階 3 で proposal 化する内容（最大 5 件）

### 必須 proposal（4/23 朝 cron 適用 → 4/24 朝 cron 適用 想定）

| ID | カテゴリ | 内容 | 次元 | 想定工数 |
|---|---|---|---|---|
| **R24** | R | AGENTS.md §50 新設「MCP 想起儀式」(タスク開始時のチェックリスト) | 次元 2 | 段階 3 で 15 分 |
| **R25** | R | AGENTS.md §21 補強「docs/troubleshooting.md 追記直後に手動 RAG ingest 義務」+ package.json に `npm run rag:ingest` 追加 | 次元 3 | 15 分 |
| **S12** | S | health-check.mjs 拡張: 過去 7 日使用 0 回の MCP を「死蔵警告」表示（新規 file_write or 既存 string_replace どちらか）| 次元 2 | 30 分 |
| **D12** | D | docs/mcp-status.md 新規作成（tavily disabled 理由・各 MCP の役割マトリクス・次回再評価日 等の状態管理台帳）| 次元 1 + 5 | 20 分 |
| **D13** | D | docs/plans/2026-04-23-mcp-strategy-v1.md 新規作成 (戦略書 v1.0 = 段階 3 そのもの) | 全次元 | 60 分 |

### 任意 proposal（5 月以降 / 浜田判断後）
- mcp.json `.gitignore` 追加 + 平文パスワード `.env` 経由化（次元 4）
- excel-mcp 導入評価（次元 8）
- slack-mcp 導入判断（次元 8 / 情報待ち）

### 段階 3 進行予定
段階 3 (戦略書 v1.0 統合) → 03:30 JST 着手 → 04:30 JST 完成見込み

→ 浜田が今日 19:00 戻った時点で **戦略書 + proposal 5 件** が commit 済の状態。
