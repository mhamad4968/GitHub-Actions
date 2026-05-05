# TSB（Troubleshooting Bulletin）— 失敗事例と教訓集

> **目的**: 同じ失敗を二度と繰り返さないため、踏んだ落とし穴・原因・対策・教訓を **TSB-XXX 形式** で蓄積する。
> **連動**: AGENTS.md §21（知見のフィードバック）/ WORKFLOW.md Phase 5（記録）/ RULES-INDEX.md（随時メモ索引）。
> **更新ルール**: 障害・不具合を解決したら必ず追記。**既存 TSB は削除しない**（追記のみ）。RAG ingest で検索可能にする。

---

## 目次（2026-04-25 全件再構築 / 2026-05-01 TSB-028・TSB-029 目次表追記 / 2026-05-02 TSB-030 追記 / 2026-05-04 TSB-031 追記 / 2026-05-06 TSB-032 追記 / F-2 自己改善目標 #2 = 真因 1 文 + root_cause_confirmed フラグ追加）

> **真因 1 文ルール**: 各 TSB は **「真因を 1 文で説明できる」状態でなければ root_cause_confirmed = false** とする。false の TSB は再発監視優先。
> **status 凡例**: ✅ Resolved（恒久対策済）/ 🟡 Mitigated（暫定対策のみ）/ 🔴 Open（未解決）/ ♻️ Recurring（同系列複数 episode）

| TSB ID | 日付 | テーマ | 真因 (1 文) | status | root_cause_confirmed | 影響範囲 |
|---|---|---|---|---|---|---|
| TSB-001 | 履歴参照 | fileKey 問題 | **2026-04-25 掘削結果**: 元事象の詳細記録自体が `docs/asset-management-logic.md` にも残っておらず、4/19 D1-proposal でも「詳細未記載」と明記されていた孤児 TSB（fileKey は `scripts/create-shucccho-seisan-app.js`/`deploy-customization.js` の customize アップロード後の `/k/v1/file.json` 応答内 key 名 = 直近の運用では問題発生せず） | 🟡 | **false (孤児)** | 594 |
| TSB-004 | 履歴参照 | 文字化け修復ロジック | kintone API レスポンスの添付ファイル名文字エンコーディングが環境依存（cp932/UTF-8 mix）で JS 側修復ロジック (decodeURIComponent / TextDecoder) では完全網羅できないため、2 回修復試行後に保存名を ASCII 固定にピボットして根治した | ✅ | true | 全般（添付ファイル名）|
| TSB-005 | 2026-04-19 | セッション間継続性の構造的脆弱性 | チャットがポリシーブロックで途絶した際、復元アンカーの鮮度を機械的に監視する仕組みが無かったため AI が経緯喪失した | ✅ | true | 全プロジェクト |
| TSB-006 | 2026-04-19 09:02 | scripts/ 9 + WORKFLOW.md + AGENTS.md §42-§49 wipe | Cursor の "Request blocked by Anthropic" 時に進行中の編集が途中状態のままロールバックされ複数ファイルが 0 byte 化した | ✅ | true | scripts / docs |
| TSB-007 | 2026-04-19 | ESLint v6 vs flat config 不整合 | リポは ESLint 8+ flat config 形式の `eslint.config.js` を使用するが node_modules の ESLint が v6.4.0 で flat config 非対応 | ✅ | true | lint:customize |
| TSB-007 続編 | 2026-04-21 制定 / 2026-04-25 解消 | eslint v10 新 recommended の後始末 | v6→v10 アップグレード時に新規 recommended ルール 2 件が既存コード 5 件にヒット → 一時 off → 4 日後に修正 | ✅ | true | customize/ 5 箇所 |
| TSB-007 ep3 | 2026-04-22 22:00 | node_modules/eslint 消失で再失敗 | v10→v9 ダウングレード時に Cursor シェル node v20 が v9 engine 要件を満たさず npm install が silent fail し node_modules 不整合 | ✅ | true | lint:customize |
| TSB-007 ep4 | 2026-04-23 03:36 | node_modules/eslint 再消失 | ep3 予防策 (R15/R16/S9) を proposal キュー化したが適用は朝 cron 待ち = 8h ウィンドウで silent fail 同症状再発 | ✅ | true | lint:customize |
| TSB-007 ep5 | 2026-04-23 19:58 | auto-heal 自爆で devDeps 4h ごと prune | `scripts/auto-heal.mjs` の `npm audit fix --omit=dev` が cron 4h ごとに devDeps を削ぎ落とし node_modules を破壊していた | ✅ | true | lint:customize / npm 全体 |
| TSB-009 | 2026-04-21 | Chrome 92+ で window.open(blob:URL) ブロック | Chrome 92+ のセキュリティ制限で blob: URL を新規タブで開く操作が一律ブロックされる | ✅ | true | FAQ ポータル / 投稿画像 |
| TSB-010 | 2026-04-22 | 投稿後 URL.revokeObjectURL の dangling reference | reload 後の `<img src="blob:...">` が DOM に残っているうちに blob URL を revoke してしまい、その後のクリックで解放済参照を踏む | ✅ | true | FAQ ポータル / Lightbox |
| TSB-011 | 2026-04-22 21:48 | 並行 Cursor チャット騒動 | Cursor UI に「同一リポを触っている他チャット数」表示がなく、浜田が同テンプレを 2 窓に貼ったため並行起動に誰も気付かなかった | ✅ | true | リポ全体 |
| TSB-012 | 2026-04-23 03:00→03:30 解消 | rag MCP documentCount=0 | mcp-local-rag v0.13.0 の server mode は `--db-path` / `--cache-dir` CLI 引数を完全に無視し env vars (`DB_PATH`/`CACHE_DIR`) のみを読むため ingest 側 (CLI subcommand mode) は `.rag/lancedb` に書込むが server 側は `process.cwd()/lancedb` (空) を見て `documentCount: 0` を返していた | ✅ | true | rag MCP |
| TSB-013 | 2026-04-23 20:30→21:00 真因確定 | cron 環境で uv 系 MCP (cve-search) が PATH not found 誤検知 | crontab の PATH に `~/.local/bin` が含まれず cron 実行時のみ uv バイナリ起動失敗 (v1 timeout 仮説は副因に過ぎなかった) | ✅ | true | cve-search MCP / cron |
| TSB-014 | 2026-04-23 21:15→21:30 解消 | ブラウザ系 3 MCP の system deps + Chrome 不足 | WSL に Chromium 自体 + system libraries (libnspr4 / libnss3 / libatk1.0 等) 未インストールで playwright が起動できなかった | ✅ | true | playwright / a11y-scanner / google-search |
| TSB-015 | 2026-04-23 21:30→21:40 解消 | google-search MCP の Google bot 検知で実用度 0 | Google スクレイピング型 MCP は Google の bot 検知で結果が常に空配列になり頭打ち（duckduckgo-search に入替で死蔵根絶） | ✅ | true | search MCP |
| TSB-016 | 2026-04-25 09:00 検出 / H-2 で発見 | BREAKING 削除が 1.5h 後の無関係 commit で無自覚に undone | 4/25 5:41 commit `5f928dd` [BREAKING] で Ch.17 (§53 第二意見系 293 行) を削除したが、7:24 commit `6bac959` (主目的 = §35-5 task-log 制定) が AGENTS.md 末尾に **299 行を追加** = Ch.17 全体が誤って復活していた / 2 commit 間で連続検証 (post-commit hash 比較 / 章数カウント) が無かったため誰も気付かず 1.5h 放置 → H-2 AGENTS.md 章調査で発見 | ✅ | true | AGENTS.md / セッション認識 |
| TSB-017 | 2026-04-25 11:03 検出 / B-7 提案中に発見 | **§51 並列禁止違反** — 別 Cursor セッションが現セッション AI の B-7 提案テキストを読み実行 | 11:03 私が §47-D 追記提案中に grep したら **§47-D 既追加 + RULES-INDEX.md も連動編集 + `.b7-pre-...` バックアップ 2 件**を発見。`.b7-pre` 命名は私が B-7 提案メッセージで書いた手順 (`cp AGENTS.md AGENTS.md.b7-pre`) を文字通り実行した証拠 = 別セッション関与確定。AGENTS.md mtime 10:58:57 / RULES-INDEX.md 10:59:11 / 連動編集 / 35 行 AI 風文体 = 別 AI による完璧な実装。証拠 2 件は `backups/tsb-017-evidence/` に保全 | ✅ | true | AGENTS.md / RULES-INDEX.md / **§51 並列セッション** |
| TSB-018 | 2026-04-26 06:33 検出 / N-3 / 浜田朝ブリーフィング | **Cursor IDE の API 制限到達時の silent fallback** — Opus 4.7 → composer-2 へ自動切替（§1-2 違反の構造的温床） | 浜田が `Switched to Composer 2 after reaching API limit.` を IDE chat で受領。Opus クレジット枯渇時に Cursor IDE が低コスト composer-2 へユーザー GO なく切替する既定挙動。CLI 側 `composer-2-fast` 罠（§1-2-1 で documented）とは別ソース。§1-2-2 を制定し IDE 設定 5 項目（Auto / Auto-fallback / Use Auto on limits / 有効モデル一覧 / Background agents）の必須状態を明文化 + 検知時 AI 即時中断ルール化 | ✅ | true | Cursor IDE / §1-2 単一モデル前提 |
| TSB-019 | 2026-04-26 07:42 検出 / Q1 / §1-2-2-1 設定検証中に発見 | **Cursor IDE Auto-Run Mode = "Run Everything (Unsandboxed)" + Browser/MCP Protection OFF が §52 RACI Tier B を構造的に bypass** — kintone 本番 API 書込含む全 MCP ツール・shell・file-write が浜田 GO なしに実行可能だった | §1-2-2-1 (Cursor IDE 必須設定) の verify 中に Agents タブを浜田に開いてもらい発見。`Auto-Run Mode = Run Everything (Unsandboxed)` + `Browser Protection: OFF` + `MCP Tools Protection: OFF` の三重 OFF 構成で、AI Agent が shell・file-write・MCP ツール（**kintone MCP / filesystem / memory / playwright 等含む**）を **承認プロンプト無しで全自動実行する状態**だった。AGENTS.md §52 RACI が「Tier B (irreversible) は浜田の明示 GO 必須」と規定していても **IDE レベルで bypass されており実効性ゼロ**。過去の TSB-006 (Undo All 破壊) / TSB-017 (並列セッション勝手書換) もこの設定と相互作用していた可能性大。対処: Auto-Run Mode は「基本自律 + 危険時確認」浜田判断で `Run Everything` 維持しつつ、**Browser Protection: ON + MCP Tools Protection: ON** に変更（kintone 本番 API は MCP 経由のため MCP Protection ON で構造的にゲート）。§1-2-2-1 を 5 → 8 項目に拡張、§52 RACI に「shell 暴走防止 = 高リスクコマンドは事前報告」追記 | ✅ | true | Cursor IDE 全体 / §52 RACI / kintone 本番 |
| TSB-022 | 2026-04-26 | dangerous-shell-blocker.sh heredoc 誤検知 | `dangerous-shell-blocker.sh` がコマンド全文（heredoc 本文含む）へ deny regex を適用し、**heredoc 内の文字列**が `git rebase` 等の危険パターンに一致して誤検知していた | ✅ | true | Cursor Hooks / §52-8-1 |
| TSB-023 | 2026-04-26 | kintone MCP `kintone-add-app` 直後に「未公開？」確認が冗長 | `add-app` は **プレビュー先行**でライブ `app.json` が 404 になりうるが、AI がドキュメント未読のまま浜田へ「まだ公開してない？」と聞き、セッション切替後も同質問が再発する構造だった | ✅ | true | kintone MCP / PC 台帳 Day4 |
| TSB-024 | 2026-04-26 | AI がデプロイ等 Tier B 実行を浜田に委ねる禁句 | 会話要約で **§35-1 / §56-1a** が脱落し「コード=AI・反映=浜田」誤分担が再構築され「再デプロイしてください」「手動アップロードで OK」等が再発した | ✅ | true | kintone 反映 / 引き継ぎ |
| TSB-026 | 2026-04-29 07:15 検出 / 07:25 解消 | 機械的書換による「人間注意書き」の構造的消失 | **NEW-SESSION-STARTER 冒頭の累積編集で hand 5200 needle が押し出され**、かつ **`session:clock:set` が HEADER 全置換で人間追記注意書きを上書き**して、要約耐性ガードが構造的に失われた（恒久対策: NEW-SESSION-STARTER 冒頭に `(7) 役割宣言` 永続追加 + `session-clock.mjs` HEADER 定数に注意書き永続化） | ✅ | true | 憲法級ハンドオフ / SESSION-CLOCK |
| TSB-028 | 2026-05-01 | Windows Cursor の `mcp.json` が WSL 正本とズレて MCP 全赤化 | **Windows と WSL に二重の `mcp.json` があり片方だけ更新**される／同期スクリプトの **`command`/`args` 合成バグ**で `filesystem` が壊れる等、**パス体系の混在**で MCP 起動が失敗する | ✅ | true | Cursor MCP 全体 |
| TSB-029 | 2026-05-01 | `user-markdownify`（`@iflow-mcp/markdownify-mcp`）stdio 即死 | **npm 公開 tarball に `preinstall.js` が含まれないのに `package.json` が `preinstall` を定義**しており、`npm install -g`（スクリプト有効）や **`npx` 展開のライフサイクルが失敗して子が即終了**する（副因として Windows `_npx` 掃除 EPERM ログも出うる） | ✅ | true | Cursor MCP `markdownify` |
| TSB-030 | 2026-05-02 | GitHub Actions `security-next-*` が **GAIA_AP15**（403）で失敗 | **GitHub Environment `kintone-collect` の API トークン（`KINTONE_API_TOKEN_COLLECT` / `KINTONE_API_TOKEN_ANALYZE` 等）が、ワークフローが参照するアプリ ID（`KINTONE_APP`・`KINTONE_REPORT_APP_ID`）と kintone 上で一致しておらず** REST が **403 GAIA_AP15** を返している | 🟡 | true | `.github/workflows/main.yml` / `daily-collect.yml` / `security-next-automation/` |
| TSB-031 | 2026-05-04 | Desktop のセッション日報を **Git 未収容のまま削除**しリポから復元不能にした | **正本を Desktop のみに置いた状態で「古い」整理とファイル削除を同一ターンに走らせ**、バックアップ・コミットなしで消したため **組織の履歴がチャット外に残らなかった** | ✅ | true | セッション日報・HANDOFF・read-pack・憲法 §35-6 |
| TSB-032 | 2026-05-06 | **`constitution-gates` CI が `constitution.mdc` 欠落で連続 failure** | **`verify-constitution-handoff.mjs` が `.cursor/rules/constitution.mdc` の存在を要求する一方、同ファイルが `.gitignore` でリポ非追跡**のため、GitHub checkout 上にファイルが来ず needle 検査が即 NG になった | ✅ | true | `.github/workflows/constitution-gates.yml` / `verify-constitution-handoff` |

**集計** (2026-05-06 時点 / TSB-032 追記):
- 全 **29** 件中 **root_cause_confirmed = true: 28 件** / **false (孤児): 1 件**
- 5 月目標 (F-2 自己批判 §54-5) = カバレッジ 100% を TSB-019 真因確定 (Cursor IDE Agents 設定) で **95% 前後を維持**（分母は TSB セクション数に追随）
- 残 false: **TSB-001 のみ** = 孤児 TSB（4/19 D1-proposal でも「詳細未記載」）= 真因不明のまま記録止まり

> **注**: TSB-002, TSB-003, TSB-008 はファイル不在時の記載漏れ。発見次第追記。

### TSB 新設の閾値（運用・2026-05-06 追補）

**CIO 起案・浜田承認（チャット）に基づく**。外部 MCP への丸投げではなく、**本文の編集と索引更新は本体 AI**。

| 状況 | 記録の置き場 |
|------|----------------|
| **単発・手順が自明・再発見込み低** | **新規 TSB にしない**。既存 TSB へ **1 行追記**、または **`handoff-log.md` のみ**（重複長文は避ける）。 |
| **再発しうる／CI・憲法ゲート／複数セッションで同じ穴** | **新規 TSB**（**真因 1 文**＋事象・対策・検証コマンド・関連リンク）。**本文は短く**、詳細はコミット・workflow へ委ねる。 |
| **handoff と TSB の両方** | **同じ長文を二重に貼らない**。正本は **TSB**、handoff は **`TSB-0xx` 参照 + 事実 1〜3 行**で足りる。 |

---

## TSB-005 — セッション間継続性の構造的脆弱性（2026-04-19 制定）

### 事象

2026-04-19 朝、SKYSEA × kintone 594 突合作業中にチャットがポリシーブロックで途絶。新セッション開始後、AI は今朝の経緯を完全に喪失した状態で再起動。残骸の CSV ファイル 4 本から作業を推測するしかない状態に陥った。

さらに、復元アンカーであるはずの `chat-sessions/checkpoint-latest.md` が **2026-04-10 で 10 日間更新停止**しており、セッション復元プロトコル自体が機能していなかった。

### 根本原因

| # | 原因 | 詳細 |
|---|---|---|
| 1 | **セッション締めの儀式が AI と人間の意思に依存** | `CLAUDE.md` 「『忘れた』防止」節は「席を離れる前に一言だけ」運用。突発的な中断（ポリシーブロック・タイムアウト）に対応できない構造 |
| 2 | **チャット履歴の自動永続化なし** | Cursor / Claude はチャット全文を自動保存しない。`chat-sessions/<日付>.md` は人間または AI が手動で書く前提 |
| 3 | **checkpoint-latest.md の鮮度監視なし** | 10 日間放置されても朝ブリーフィングが警告しなかった |
| 4 | **agent-transcripts へのアクセスが不安定** | 複数のプロジェクト ID 配下に分散しており、新セッションから過去の自分の transcripts を見つけにくい |
| 5 | **RAG が `chat-sessions/` を ingest 対象外** | 過去会話を意味検索できない |

### 対策（Phase A 緊急止血 — 2026-04-19 実施）

1. `chat-sessions/2026-04-19.md` を作成し、本日の経緯と決定事項を全記録
2. `chat-sessions/checkpoint-latest.md` を 2026-04-19 現在地で更新（旧版は `chat-sessions/checkpoints/2026-04-10-budget-654-finalize.md` に退避）
3. `kintone-apps.md` 末尾履歴に 1 行追記
4. `.rag/extra-docs/persist-policies.md` を正本同期（旧版は `.rag/extra-docs/_archive/` に退避）
5. 本ファイル `docs/troubleshooting.md` を新規作成

### 構造的予防（Phase B — 別セッションで提案予定）

| # | 提案 | 効果 |
|---|---|---|
| B-1 | `scripts/session-snapshot.mjs` 新規 | 任意タイミングでチャット要点を `chat-sessions/<日付>.md` に追記 |
| B-2 | `scripts/daily-morning-prep.mjs` に「checkpoint 7日以上古い時 🚨」ロジック | 放置を朝に必ず気付ける |
| B-3 | `chat-sessions/` を RAG ingest 対象に追加 | 過去会話を意味検索可能に（API トークン等の grep 除外を併設） |
| B-4 | 夕反省サイクル（§44）に「checkpoint 更新提案」を必須項目化 | 締め忘れの最終防衛線 |

### 憲法化（Phase C — 別セッションで提案予定）

- `AGENTS.md` §40（欠番埋め）または §50 として **「セッション継続性義務」** を新設
- §46（朝ルーチン）/ §47-§49（思考の三本柱）/ §45（タスク完遂）と並ぶ最上位原則として定着

### 教訓（Lessons Learned）

1. **「気をつける」では絶対に解決しない**。儀式の遵守が AI と人間の意思に依存している時点で、構造的脆弱性。
2. **復元アンカーの鮮度を機械的に監視する仕組み**が必要。10 日間気付かなかったのは朝ブリーフィングの責務範囲外だった。
3. **「気づいていたが言わなかった」は §49 違反**。今後は同種の脆弱性を発見したら即指摘する。
4. **2 階層索引（ホーム RULES-INDEX + リポ RULES-INDEX）**の存在を見落とすと §0「ルール索引参照義務」自体を踏まない結果になる。新セッションでは両方を確認する。
5. **派生コピー（`.rag/extra-docs/`）は正本と乖離しうる**。RAG ingest 前に同期チェックする運用が必要。

---

## TSB-006 — scripts/ 9 ファイル + WORKFLOW.md + AGENTS.md §42-§49 wipe（2026-04-19 09:02 同時刻）

### 事象

2026-04-19 09:02:00 ちょうどに、リポ内の以下が**全部 0 byte / 古い版に巻き戻った**。

| パス | 被害 | 行数（被害前 → 被害後）|
|---|---|---|
| `scripts/auto-heal.mjs` | 0 byte | ? → 0 |
| `scripts/health-check.mjs` | 0 byte | ? → 0 |
| `scripts/version-up.mjs` | 0 byte | ? → 0 |
| `scripts/apply-approved-changes.mjs` | 0 byte | ? → 0 |
| `scripts/daily-morning-prep.mjs` | 0 byte | ? → 0（バックアップから復元）|
| `scripts/evening-reflect.mjs` | 0 byte | ? → 0（バックアップから復元）|
| `scripts/audit-rules.mjs` | 0 byte | ? → 0 |
| `scripts/scan-plans.mjs` | 0 byte | ? → 0 |
| `scripts/skysea-recon.mjs` | 0 byte | 334 → 0（context から復元）|
| `scripts/install-morning-cron.sh` | 0 byte | ? → 0 |
| `scripts/debug-skysea-fields.mjs` | 0 byte | ? → 0 |
| `WORKFLOW.md` | 0 byte | 261 → 0（context から復元）|
| `AGENTS.md` | 古い版に巻き戻し | 669 → 444（v17 → v10 / §42-§49 全消失） |
| `docs/approved-changes/README.md` | 0 byte | ? → 0 |

### 根本原因（**特定済み・2026-04-19 浜田スクショ提供**）

**Cursor の "Request blocked by Anthropic" 時の編集ロールバック挙動**。

#### 確定した事実

- 浜田が当日のエラー画面スクショを 2 枚提供:
  - Request ID `a969dba9-3c47-4416-8b01-eb9a37b6f0e7`
  - Request ID `b62293ee-c6e5-4538-8ec0-22da096910c3`
- どちらも **"25 Files | Undo All | Review"** ボタン付きで「Request blocked by Anthropic」表示
- 浜田の発言: 「今の指示がポリシーに触れてしまったようです。言葉を少し柔らかくします」（リトライ時）
- 当日のファイル wipe 数（11 scripts + WORKFLOW.md + AGENTS.md §42-§49 の partial + approved-changes/README.md = ~14）と画面上の "25 Files" は**同一バッチ編集を指す**（残り 11 はおそらく軽微な編集や読み取りのみ）

#### 発生メカニズム

```
1. AI（前セッション）が 1 ターンで 25 ファイルの一括編集を実行しようとした
   ↓
2. プロンプト内容が Anthropic Usage Policy に抵触し、API 側でブロック
   ↓
3. Cursor は中断時の状態を扱えず、編集適用が中途半端で停止
   または "Undo All" 動作で 25 ファイルが不整合状態に
   （ファイル truncate 済み + 内容書込前で停止 = 0 byte 化）
   ↓
4. 浜田が「言葉を柔らかくします」でリトライしたが、damage は既に発生
   ↓
5. ファイルの mtime 09:02 = ロールバック / 中断完了時刻

これで「タイムスタンプ秒一致」+「複数ファイル同時 wipe」+「mtime 09:02 sharp」
が完全に説明つく。
```

#### 容疑から外れたもの

- ❌ OneDrive 同期 — サインインしてないから同期エンジン未起動（2026-04-19 確認）
- ❌ Cursor crash recovery — タイミングがセッション起動と一致するように見えたが、実際は edit blocking
- ❌ WSL fs cache 不具合 — 同上
- ❌ 拡張機能の初期化処理 — 同上

### 対策（実施済み・2026-04-19）

#### A. 即時止血
- 私（AI）の context から復元: `WORKFLOW.md` (261 行) / `AGENTS.md §42-§49` / `skysea-recon.mjs` (334 行)
- バックアップから復元: `daily-morning-prep.mjs` (11984 byte 06:32 版) / `evening-reflect.mjs` (9193 byte 06:32 版)
- 履歴仕様から再実装: `auto-heal.mjs` / `health-check.mjs` / `version-up.mjs` / `apply-approved-changes.mjs` / `audit-rules.mjs` / `scan-plans.mjs` / `install-morning-cron.sh` / `debug-skysea-fields.mjs`

#### B. リアルタイム監視
- `scripts/file-watcher.mjs` 新規 — Node の `fs.watch`（inotify ベース）で 23 重要ファイルを常時監視
- 0 byte 化検出時に 5 秒待って `~/.cursor-emergency-backup/` から自動復元
- WSL 起動時に自動起動（`@reboot scripts/watcher-watchdog.sh`）+ 5 分ごと watchdog で死活監視

#### C. 定期ヘルスチェック
- `scripts/wipe-guard.mjs` 新規 — 15 分ごと cron で実行
- 重要ファイルが空 / 欠落していたら `~/.cursor-emergency-backup/` または最新 `backups/<日付>/` から自動復元
- 全結果を `logs/wipe-guard/<日付>.log` に記録

#### D. 多層バックアップ
- `~/.cursor-emergency-backup/`（リポ外・別パス）に 30 ファイルをミラー（`scripts/emergency-mirror.mjs`）
- 4 時間ごと cron で自動更新（`17 */4 * * *`）
- 既存 `backups/<YYYY-MM-DD-HHMMSS>/`（`backup-workspace.js`）も継続
- git の untracked → staged 化（次の commit で永続保護）

#### E. 復元コマンド
- `npm run restore:wiped` — 手動復元（人間向け markdown レポート）
- `npm run restore:wiped:dry` — ドライラン
- `npm run guard:check` — wipe-guard 単発実行
- `npm run guard:mirror` — emergency-mirror 単発実行

### 教訓（追加）

6. **タイムスタンプ秒一致 = 同一プロセス**。複数ファイルが秒単位で同時刻 wipe されたら、必ず同一プロセス（cron / 同期 / Cursor 内部）の仕業。原因究明は「次にこれが起きた瞬間を捕まえる」継続監視が最強。
7. **ファイル編集中の中間状態 = 一瞬 0 byte**。エディタ保存は「truncate → 内容書き込み」の 2 ステップ。検知ロジックには **5 秒待ち**を入れて誤判定を防ぐ。
8. **「自動復元」と「自動上書き」は違う**。emergency-mirror は **src が 0 byte なら mirror しない** 安全装置を持つ（0 byte で上書きすると emergency-backup も死ぬ）。auto-heal も wipe 検知時は復元せず人間判断を要求（自分で誤判断して上書きしない）。
9. **AI のセッション context もバックアップ**。新セッションが始まる前に重要ファイルを Read しておくと、wipe された時に Write で復元できる。逆に「忙しいから読まずに進む」は危険。
10. **AI の 1 ターン編集は 10 ファイル以下が目安**（特にポリシー境界に触れそうな話題）。Anthropic Usage Policy ブロック時に Cursor の edit-application が中途半端に止まると、ターゲットファイル群が 0 byte 化する。バッチ編集を分割すれば爆発半径が小さくなる。
11. **"Request blocked by Anthropic" + "Undo All | Review" が出たら、Undo All を押す前に Review で内容確認**。即 `npm run guard:check` で被害確認（file-watcher が動いてれば既に自動復元しているはず）。
12. **エラー画面のスクショは命綱**。今回 浜田のスクショ（Request ID 付き）が真犯人特定の決定打になった。次回も同様のエラーが出たら **必ずスクショを撮って共有**。Request ID が分かれば Anthropic に問い合わせも可能。

### 関連ルール

- `AGENTS.md §42`（セッション冒頭の過去ログ確認義務）
- `AGENTS.md §47-§49`（思考の三本柱）
- `chat-sessions/2026-04-19.md`（本件の詳細経緯）
- `chat-sessions/NEW-SESSION-STARTER.md`（新セッション起動の儀式）
- `scripts/file-watcher.mjs` `scripts/wipe-guard.mjs` `scripts/emergency-mirror.mjs` `scripts/restore-wiped.mjs` `scripts/watcher-watchdog.sh`

---

## TSB-007 — ESLint 6 vs flat config (eslint.config.js) 不整合（2026-04-19 検出）

### 事象

`npm run lint:customize` 実行時に「ESLint couldn't find a configuration file」エラー。

```
ESLint: 6.4.0.
ESLint couldn't find a configuration file.
```

### 根本原因

- リポジトリには `eslint.config.js` (ESLint 8+ の flat config 形式) が存在
- しかし node_modules に入っている ESLint は **6.4.0**（古い）→ flat config 非対応
- ESLint 6 は `.eslintrc.*` 形式を期待

### 対策

`package.json` で ESLint 8 以降に upgrade が必要。

```bash
npm install --save-dev eslint@latest
# または
npm install --save-dev eslint@8
```

ただし本番 CI や customize/ コードへの影響を確認してから実施することを推奨。

### 影響

- `npm run lint:customize` が失敗（朝ブリーフィングで ❌ 表示）
- 本番動作には影響なし（lint は静的解析のみ）

### 関連

- `docs/dependency-upgrade-backlog.md` に記録予定（依存パッケージ更新案件として）

---

## TSB テンプレート（新規追加時にコピー）

```markdown
## TSB-NNN — タイトル（YYYY-MM-DD 制定）

### 事象
<何が起きたか / どこで気付いたか>

### 根本原因
| # | 原因 | 詳細 |
|---|---|---|
| 1 | ... | ... |

### 対策（実施済み）
1. ...
2. ...

### 予防（提案 / 別タスク）
| # | 提案 | 効果 |
|---|---|---|
| 1 | ... | ... |

### 教訓（Lessons Learned）
1. ...
2. ...

### 関連ルール
- ...
```

---

## メンテナンス

- 新規 TSB を追加したら **`RULES-INDEX.md` の随時メモ**に「日付 + TSB-NNN + 1行要約」を追記
- 月次で **RAG 再 ingest**: `npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/`
- **既存 TSB は削除しない**。古くなった内容は「**廃止**: 2026-XX-XX」と先頭にマークするのみ

---

## TSB-010 — 投稿後 URL.revokeObjectURL の dangling reference 問題（2026-04-22 制定）

### 症状
投稿成功 + 画面リロード後に、表示された画像をクリックして Lightbox を開こうとすると `ERR_FILE_NOT_FOUND` エラーが発生し画像が表示されない。

### 真因
投稿成功後に `self.reload().then(() => { Object.keys(_blobUrlMap).forEach(k => URL.revokeObjectURL(_blobUrlMap[k])); _blobUrlMap = {}; })` のような revoke 処理を実行していたが、reload で再描画された `<img src="blob:...">` がまだ DOM に残っているうちに blob URL が解放されてしまい、その後のクリック（`openImageLightbox(this.src, ...)`）で **解放済み blob URL を参照する dangling reference** エラーが発生する。

### 検出方法
ブラウザ DevTools の Console に以下が出る:
```
9cfa2534-35a7-42ec-a0cb-bf3f940f5287:1
GET blob:http://server:port/9cfa2534-... net::ERR_FILE_NOT_FOUND
openImageLightbox @ (index):397
(anonymous) @ (index):477
```
UUID が src にそのまま出ている = blob URL のリソース ID 部分が解放されている証拠。

### 修正
投稿後の `URL.revokeObjectURL` 一括実行を **廃止**。blob URL はページ閉じた時にブラウザが自動 GC で解放するため、メモリリークは 1 セッション内のみで実害なし。`_blobUrlMap` / `_blobNameMap` も持ち越しで OK（次の D&D で個別 set される / clear すると closure が古いキーを引けなくなる副作用もあった）。修正コミット: `e7b0a89`。

### 教訓（改善案 #3 §11-3 修正前 30 秒影響分析と連動）
4/21 Lightbox 修正時に `_blobUrlMap` を grep して revoke 箇所のライフサイクルを確認していれば発見できた。修正対象だけ見て影響範囲を追わない近視眼が原因。次回からは §11-3 に従って修正前 30 秒影響分析を実施する。

### 関連
- TSB-009: Chrome 92+ で window.open(blob:URL, '_blank') ブロック（2026-04-21 制定 / 同じ FAQ ポータルの問題）
- AGENTS.md §11-2 信頼度ラベル / §11-3 修正前 30 秒影響分析（2026-04-22 制定 / 改善案 #2 + #3）

---

## TSB-009 — Chrome 92+ で window.open(blob:URL, '_blank') がブロックされる（2026-04-21 制定）

### 症状
- HTML フォーム内で `<input type=file>` や drop でアップロードした画像 (blob: URL 化) を `window.open(blob:..., '_blank')` で別タブ表示しようとすると **`Not allowed to load local resource: blob:http://...`** エラー + ERR_FILE_NOT_FOUND。
- ドロップ・貼り付け自体は成功するが「クリックで拡大」だけが失敗する見え方。

### 発生事例（2026-04-21 19:00 / FAQ ポータル）
- `scripts/faq-portal-full.html` の 4 箇所で `window.open(this.src, '_blank')` を使用。Chrome 92+ で blob: URL の新規タブ表示はセキュリティ制限でブロック。

### 根本原因
**Chrome 92+ のセキュリティ制限**: blob: URL を新規タブで開く操作 (window.open / target=_blank) はブロックされる。CSP / Cross-Origin 関連でなく、純粋な URL スキーム制限。

### 解決パターン 3 択
1. ⭐ **同一ページ内 Lightbox 表示**: 黒オーバーレイ + 拡大画像で表示。blob: でも http: でも安全に動作。今回採用。
2. **dataURL 化**: 画像を Base64 dataURL に変換してから別タブ表示。大きい画像でメモリ消費。
3. **正規 URL 発行**: 画像を即サーバへアップロード → 戻ってきた URL を表示。実装重い・通信増える。

### 修正コード例（FAQ ポータル）
```javascript
// 修正前 (NG)
img.addEventListener('click', function () {
  if (this.src) window.open(this.src, '_blank');  // ← Chrome 92+ でブロック
});

// 修正後 (OK)
img.addEventListener('click', function () {
  openImageLightbox(this.src, this.alt);  // ← Lightbox で同一ページ内表示
});
```

### 教訓
- 動的に生成された blob URL を **新規タブで開く** 設計は将来も使えない
- **「拡大表示」は同一ページ内の Lightbox / モーダル方式** が将来安全
- セキュリティ制限は OS / ブラウザ更新で増える方向 → 「将来制限される可能性」を先回り設計するのが §49 の精神

---

## TSB-007 続編 — eslint v10 新規 recommended ルールの後始末（2026-04-21 追記 / 2026-04-25 解消）

### 状況
2026-04-21 に `npm install --save-dev eslint@latest` で v6.4.0 → v10.2.1 にアップグレード成功。TSB-007 の lint:customize 7 日連続失敗は解消。ただし v10 で recommended に入った 2 ルールが既存コードに 5 件ヒットしたため一時的に off にしていた。

### 一時 off 中のルールと該当箇所（履歴）
| ルール | 該当箇所 |
|---|---|
| `no-useless-assignment` | customize/594/desktop.js 1716 (pool) / 3484 (recs594) / 3485 (recs627) / customize/627/desktop.js 2625 (recs627) |
| `no-irregular-whitespace` | customize/594/desktop.js 2714 |

### 解消（2026-04-25 / 浜田 Tier A 承認 / A-3 完遂）
| 箇所 | 修正内容 | 安全性検証 |
|---|---|---|
| 594:1716 | `let pool = null;` → `let pool;` | 直後の `if/else` 両分岐で必ず `pool = ...` 上書きされるため初期値不要 |
| 594:2714 | `[\s　]` → `[\s\u3000]` | 全角空白 (U+3000) を Unicode escape 化。正規表現セマンティクス完全同一 |
| 594:3484-3485 | `let recs594 = []; let recs627 = [];` → `let recs594, recs627;` | 直後の destructuring `[recs594, recs627] = await Promise.all(...)` で必ず上書き、catch は `return` で早期離脱 |
| 627:2625 | `let recs627 = [];` → `let recs627;` | 直後の `recs627 = await dupFetchAll627();` で上書き、catch は `return` で早期離脱 |

`eslint.config.js` の 2 行 off 削除 → recommended 既定 (error) に復帰。`npm run lint:customize` exit 0 / 出力 0 行を確認。

### 教訓
- 「一時 off + TODO」は風化しやすい。**続編 TSB として明示・期限付き**で残したことで 4 日後に確実に回収できた
- 修正前に `--rule` 一時上書きで現行違反を検出 → コードと TSB の line 番号一致を確認 → 4 日経過してもコードが安定していることを保証 → 安心して修正

---

## TSB-007 episode 3 — node_modules/eslint 消失で lint:customize 再失敗（2026-04-22 22:00 検出）

### 症状
4/22 夕方の健康診断で `npm run lint:customize` がまた失敗。原因特定に手間取った末、真因は `node_modules/eslint/` 自体の消失と判明。

### 真因（複数仮説の合成）
| # | 仮説 | 確度 |
|---|---|---|
| 1 | 9c6481c (4/22 18:23) で eslint v10 → v9.39.4 ダウングレード時、Cursor シェル node v20.18.2 が v9 の engine 要件を満たさず `npm install --save-dev eslint@latest` が **silent fail**。`package.json` だけ更新され `node_modules/eslint/` は不整合 or 撤去 | **本命（直接原因）** |
| 2 | `scripts/health-check.mjs` の `self_check` が `scripts/*.mjs` と `AGENTS.md` のみ検査し **`node_modules/` 完全性を検査しない設計穴** → 朝の cron で異常検知できず | **本命（検知盲点）** |
| 3 | Cursor 環境 / `npm prune` / 強制 GC | 低（直接証拠なし） |

### 修正（実施済み / 4/22 夜）
1. `npm ci`（or `npm install`）で再インストール → `node_modules/eslint v9.39.4` 復活確認
2. `npm run lint:customize` 通過確認

### 予防（提案 / 朝 cron で 4/23 自動適用予定）
| ID | 内容 | 効果 |
|---|---|---|
| R15 | AGENTS.md §46 Phase 2 表に `check-node-modules.mjs` 追加 | ルール明文化 |
| R16 | AGENTS.md §46 Phase 3 自動可リストに「依存欠損検知時の `npm ci` 再実行」追加 | auto-heal 拡張 |
| S9 | `scripts/check-node-modules.mjs` 新規（package.json deps と node_modules/<pkg>/package.json バージョン一致 + critical bins 存在検証 / `--json` 対応） | 検知の自動化 |

### 教訓（Lessons Learned / §11-3 修正前 30 秒影響分析と連動）
1. **パッケージ操作 = post-install 必須儀式化**: `npm install <pkg>` 後は必ず `node_modules/<pkg>/package.json` の `version` を確認する（5 秒で済む）
2. **engine 要件不一致時の silent fail**: npm は engine 要件 NG でも warning だけ出して成功風 exit する場合がある。**install 後の version 確認は 100% 必須**
3. **健康診断は「自分自身」も診ろ**: `health-check.mjs` の self_check が node_modules を見ていなかった = 診断ツールの盲点を診断する習慣（メタ診断）が不足

### 関連
- TSB-007（2026-04-19 制定 / 元祖）/ TSB-007 続編（2026-04-21）
- AGENTS.md §11-3 修正前 30 秒影響分析（改善案 #3 / 4/22 制定）
- proposal: docs/approved-changes/2026-04-23/{R15,R16,S9}-*.proposal.json

---

## TSB-014 — ブラウザ系 3 MCP の system deps + Chrome 不足（2026-04-23 21:15 検出 / 21:30 解消 / 浜田 sudo 実施 + AI 検証）

### ✅ 解消ステータス (2026-04-23 21:30)
- **playwright**: ✅ Chrome 147.0.7727.116 で `browser_tabs` 動作確認
- **accessibility-scanner**: ✅ 同上 (内部で同 Chrome 使用)
- **google-search**: 🟡 起動 ✅ / Chromium 動作 ✅ / Google 結果常に空 = **構造的別案件 (TSB-015 候補)** = headless ブラウザ bot 検知のため。今夜の TSB-014 主目的 (4/26 PC 台帳 customize 用) は達成

### 修復経緯 (2 段階 / 浜田 sudo 必須)

**段階 1 (浜田 21:14 実施)**: system deps 一括 install
```bash
cd ~/kintone-ai-lab && PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" sudo $(which npx) playwright install-deps chromium
```
- 20 packages 新規 (libnspr4 / libnss3 / libasound2t64 / fonts 系) / 35.6 MB / エラー 0

**段階 2 (浜田 21:25 実施)**: Google Chrome 本体 install
```bash
cd ~/kintone-ai-lab && PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" npx playwright install chrome
```
- npx 内部で sudo 自動昇格 (浜田パスワード再要求なし) / google-chrome-stable 147.0.7727.116 が `/opt/google/chrome/` + `/usr/bin/google-chrome-stable` に install / 125 MB

### 検証 (AI 実 call / 21:30)
- `mcp_user-playwright_browser_tabs(action="list")` → ✅ `[{0: (current) [](about:blank)}]`
- `mcp_user-accessibility-scanner_browser_tabs(action="list")` → ✅ 同様
- `mcp_user-google-search_search(query="kintone")` → 🟡 結果空 (CAPTCHA エラー消失 / 起動 OK / Google bot 検知問題)
- `health-check.mjs` → 正常 19 / 異常 0 / 警告 0 / 全 MCP ✅

### 教訓
1. **`install-deps chromium` だけでは不足 / `install chrome` で本体追加が必要**: @playwright/mcp は Google 商用 Chrome を要求するため Chromium バイナリだけでは起動しない
2. **私の前回判断「ブラウザ本体は ms-playwright cache にあるから不要」は不正確**: ms-playwright cache の `chromium-1217` は Chromium / `/opt/google/chrome/chrome` の Chrome は別物
3. **実証は 1 件ずつ**: 1 件 NG → 「他も同じ」と推測せず**全件実 call で検証する**
4. **google-search 構造的限界**: Google スクレイピング型 MCP は headless 検知で実用度低い → 別案件 (TSB-015 / S14 月次巡回時に再検討 / brave-search / serpapi 等代替検討)

### 関連
- `docs/mcp-status.md` の playwright / accessibility-scanner / google-search エントリを ✅ active に更新済 (本 TSB 解消後)
- 4/26 PC 台帳 customize 動作確認 + a11y 検査が予定通り実施可能に

---

## TSB-015 — google-search MCP の Google bot 検知で実用度 0 → duckduckgo-search に入替（2026-04-23 21:30 検出 / 21:40 解消 / 浜田指示で死蔵根絶方針）

### 症状
TSB-014 解消後の MCP 全件実 call 検証で `google-search` MCP が:
- 起動 ✅ / Chromium 動作 ✅
- ただし `mcp_user-google-search_search` の結果が**常に空配列** (CAPTCHA エラーは消失したが Google bot 検知で結果隠蔽)
- 過去 30 日 0 回使用 + 構造的に解消困難 = 死蔵 MCP

### 浜田判断 (2026-04-23 21:30)
「使っていない理由は？入れているのであれば使いたい。他に有用なものがあれば入れ替えて削除がいいのでは？」
→ 死蔵根絶方針 = 削除 + 代替導入

### §47 私の正直回答 (使わなかった真の理由)
1. Cursor 標準 WebSearch / WebFetch が Claude セッションで使えるため MCP 呼ぶ動機が薄かった (= MCP の存在意義を半分奪っていた)
2. AGENTS.md §33-A 事前調査優先順で 4 番手 (rag → fetch → tavily → google-search)
3. §50 MCP Recall Ritual が 4/22 まで未制定 = 想起トリガー不在

### 代替候補比較
| 候補 | API key | 無料枠 | bot 検知 | 結果品質 | 導入工数 |
|---|---|---|---|---|---|
| brave-search | 必要 (無料取得) | 2,000 q/月 | なし | ★★★★ | 15 分 |
| **duckduckgo-search (採用)** | 不要 | 無制限 | 緩 | ★★★ (Bing ベース) | 5 分 |
| serpapi | 必要 | 100 q/月 | なし | ★★★★★ | 15 分 + 課金リスク |
| tavily 再有効化 | 必要 | 課金確定 (4/23 02:30) | なし | ★★★★ | 課金判断 |

→ A 案 (duckduckgo-search) 採用 / 浜田負担最小 / API key 不要で即動作。

### 修復 (実施済 / 2026-04-23 21:35)
1. `bash scripts/backup-mcp.sh` で `backups/mcp/20260423-212946/` バックアップ取得
2. `~/.cursor/mcp.json` から `google-search` 削除 + `duckduckgo-search` 追加
   ```json
   "duckduckgo-search": {
     "command": "/home/mhamada202408224/.local/bin/uvx",
     "args": ["duckduckgo-mcp-server"],
     "env": { "DDG_REGION": "jp-ja" }
   }
   ```
3. **uvx 絶対 path 指定** (TSB-013 v2 教訓 = path 依存回避 / cron でも動く)
4. inline backup `~/.cursor/mcp.json.bak-ddg-swap-20260423T123011Z` も保存

### 検証手順 (Cursor 再起動後 = 浜田操作後 AI 実 call)
- `mcp_user-duckduckgo-search_search(query="kintone REST API")` → 結果取得確認
- `health-check.mjs` → 全 MCP ✅ 確認

### 教訓
1. **「入れてるなら使え / 使わないなら入替/削除」死蔵根絶方針** (浜田指摘) は AGENTS.md §50 MCP Recall Ritual の精神と整合
2. **MCP の本来価値は cron / 月次巡回 / 他 AI からも統一インターフェイス**: Cursor 標準 WebSearch は Claude セッションのみ / MCP は CLI / cron で永続価値
3. **代替検討時の選定軸**: API key 要否 / 無料枠 / bot 検知 / 結果品質 / 導入工数 / 既存資産 (uvx 等) の活用
4. **uvx 絶対 path 指定**を新規 MCP 設定の標準パターンに (TSB-013 v2 教訓継承)

### 関連
- TSB-013 v2 (uv PATH 不足) と同じく cron 環境差シリーズ / 絶対 path 採用が共通対策
- TSB-014 (Chrome 系 system deps 不足 / 4/23 21:30 解消) の延長で発見

---

## TSB-014 (旧記録) — 2026-04-23 21:15 検出時の初期記録（解消済 / 上記参照）

### 症状
Phase W (浜田 21:00「100% 問題ない証明して」依頼) の MCP 全件実 call で 3 件失敗:
1. `playwright` `browser_tabs` → `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`
2. `accessibility-scanner` `browser_tabs` → 同上 (内部で playwright 使用)
3. `google-search` `search` → `libnspr4.so: cannot open shared object file: No such file or directory`

### 真因
- WSL Linux (Ubuntu 24.04?) に **Chromium 自体 + Chromium 用 system libraries (libnspr4 / libnss3 / libatk1.0 等) が未インストール**
- Cursor 環境で過去 (Apr 17-19) は問題なかった可能性 = 何らかの理由で消失または初回未インストール
- `npx playwright install chrome` を実行しようとしたが **sudo パスワード要求**で autonomous 不可

### 影響範囲 (限定的)
- 4/26 PC 台帳 customize 動作確認時に必要 (§26 視覚的自己検診 / §27 a11y) → **3 日後**
- 普段の開発では未使用 = 即時影響なし
- MCP 接続自体は OK (initialize 応答返ってる) = MCP インフラ健全

### 浜田アクション要 (浜田が WSL で sudo 実行してください)

```bash
# Option A: 公式 playwright 推奨インストール (--with-deps で system deps + browser を一括)
sudo $(which npx) playwright install --with-deps chrome

# Option B: 手動で system deps + chromium インストール
sudo apt update
sudo apt install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libgbm1 libpango-1.0-0 libdrm2 libxkbcommon0 libxshmfence1 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libasound2t64 \
  fonts-liberation
npx playwright install chrome  # browser 本体
```

### 検証手順 (修復後)
```bash
# playwright 動作確認 (浜田 / AI 双方)
node -e "const {chromium}=require('playwright'); chromium.launch().then(b=>{b.close(); console.log('playwright OK')})"

# AI 側で MCP 実 call 再試
mcp_user-playwright_browser_tabs(action="list")  # → エラーなし
mcp_user-google-search_search(query="test")       # → 結果取得
```

### 期日
- **必須**: 4/26 (PC 台帳 customize 動作確認 Day) までに完了
- **推奨**: 4/24 朝以降の任意タイミング (浜田の都合の良いとき)
- **遅延した場合の影響**: §26 視覚自己検診・§27 a11y 検査が手動実機確認に降格 = 工数 +30 分程度

### 関連
- Phase W 検証で発見: `chat-sessions/2026-04-23.md`「21:00-21:30 Phase W」セクション
- TSB-013 v2 真因 (uv PATH 不足) と同じく cron 環境差シリーズの兄弟
- AGENTS.md §50 MCP Recall Ritual で playwright / a11y-scanner / google-search を「Tier 1 (4/26 必須)」と分類済 (`docs/mcp-status.md`)

---

## TSB-013 — cron 環境で uv 系 MCP (cve-search) が PATH not found で誤検知（2026-04-23 20:30 v1 / 21:00 v2 真因特定 / autonomous 修復）

### 症状
`logs/health/cron.log` の最新出力で `cve-search ❌ 応答なし (exit=null stderr=)` が記録されていた。一方、私が手動で `node scripts/health-check.mjs` を実行すると同じ cve-search が ✅ になる、また直接 `mcp_user-cve-search_vul_db_update_status` を実 call すると即応答する。**実害ではないが false negative 警報が出続ける**。

### 真因 v1 (2026-04-23 20:30 / 誤判断 = 副因に過ぎなかった)
当初は「`scripts/health-check.mjs` line 89 の MCP probe timeout = 30 秒では cve-search の cold start (NVD DB 2.2M records 読込) に間に合わない」と判断し、timeout を 60 秒に延長 (commit 8013f2b)。しかし 20:33 cron も同じ ❌ を出し続けた = **timeout は真因ではなく、別の構造的問題が隠れていた**。

### 真因 v2 (2026-04-23 21:00 / 浜田 Phase W 「100% 証明」要求で深掘り判明 / 確定)
`mcp.json` で cve-search の起動コマンドは `command: "uv"` (Python uvx package manager / 絶対パス無)。`uv` バイナリは `~/.local/bin/uv` に存在するが、**crontab の PATH = `/NVM_v24:/usr/bin:/bin` には `~/.local/bin` が含まれていない**。結果:
- 手動 / Cursor 経由実行時 = `~/.local/bin` が PATH にあり uv 起動成功 = ✅
- cron 実行時 = uv not found → spawnSync exit=null / stdout 空 → ❌ 誤検知

44 秒で `spawnSync` が完了 (timeout 60s 未到達) = process が**そもそも起動していない**ことの証拠だった。timeout の問題ではなかった。

### 修復（実施済 / 2026-04-23 20:31 v1 + 21:00 v2）

**v1 修復 (commit 8013f2b)**: `scripts/health-check.mjs` line 89 の `timeout: 30_000` → `timeout: 60_000` (副因対策 / 念のため維持)

**v2 修復 (本筋)**: `scripts/health-check.mjs` MCP probe 内で **`env.PATH` 先頭に `~/.local/bin` を必ず追加**。cron / 手動どちらの環境でも uv 系 MCP が起動可能に。検証: cron シミュレート (env -i + cron PATH) で実行 → 修正後 cve-search ✅ / 正常 19 / 異常 0。

### 教訓 (Phase W で更新)
1. **cron 環境差を疑え**: 「手動 OK / cron NG」の乖離は **timeout じゃなく PATH** が真因のことが多い
2. **`exit=null` は process 異常終了**: spawnSync timeout なら exit=null + 経過時間 ≒ timeout 値になるはず。本件は 44 秒で exit=null = uv 起動失敗 (PATH not found) のサインだった
3. **修復後の検証は cron 環境で実証必須**: `env -i PATH=cron値 bash -c '...'` で必ず cron 状態を再現してから「治った」と言う
4. **私の誤判断 = 浜田 §47 二段階発動で救済**: v1 修復で「治った」と確信していたが、Phase W 「100% 証明」要求で **20:33 cron が修正後でも ❌ だった**ことに気付き v2 真因に到達。Phase V → Phase W で 2 段階の浜田批判が必要だった = 1 段階目で完全な確信を持つのは慢心
5. **uv 系 MCP のリスト化必要**: cve-search 以外にも uv で起動する MCP がある可能性 / 今後 mcp.json 追加時は `command: "uv"` パターンに警戒

### 関連
- `scripts/health-check.mjs` (line 74-105 = PATH 拡張 + timeout 60s)
- 過去ログ: `logs/health/cron.log`
- TSB-007 ep5 と同じく「自分の修復ロジックが誤判定を生む」系列 / **v1 修復が表層症状に過ぎなかった点でも ep5 と同型** (ep5 の R15/R16/S9 が表層対策で ep5 真因まで届かなかったのと同じ構造)
- v2 真因 = 浜田の「100% 問題ない証明して」(Phase W) で深掘りに至った

---

## TSB-007 episode 5 — auto-heal 自爆 (`npm audit fix --omit=dev`) で devDeps が 4h ごと prune（2026-04-23 19:58 真因特定 / autonomous 修復）

### 症状
4/23 朝 cron (06:00) の `lint:customize` がまた v6.4.0 で失敗。03:36 に `npm install` で v9.39.4 復活させたばかりだったが、わずか **2 時間 24 分後** (next auto-heal cron の 04:43) に再消失。19:58 に浜田の状況報告依頼で発覚し ep5 認定 + 真因特定。

### 真因（確定）
`scripts/auto-heal.mjs` line 90/93 の以下コマンドが本犯人。

```bash
npm audit fix --omit=dev --audit-level=moderate
```

- npm v7+ の仕様: `--omit=dev` 付き `npm install` / `npm audit fix` は **devDependencies を node_modules から prune する**（production-only 状態に強制移行）
- `eslint` は devDependency → 4 時間ごとの auto-heal cron (`43 */4 * * *`) で**毎回**消失
- ep1〜ep4 の真因と複合: 「ep4 までは npm v7+ 仕様の認識欠落 + ep3 の予防策 (R15/R16/S9) が proposal キュー待ちで未適用窓 → 再発」と分析していたが、**実は予防策があってもなくても auto-heal がトリガーで毎 4h 確実に再発する構造的問題**だった

### 修復（実施済み / 4/23 19:58 〜 20:03）
1. **緊急復元**: `npm install` → eslint v9.39.4 復活 / lint:customize 0 errors
2. **根本修正**: `scripts/auto-heal.mjs` line 90/93 から `--omit=dev` 削除 + 削除理由の inline コメント追加
3. **検証**: 修正後の `node scripts/auto-heal.mjs` 実行 → eslint v9.39.4 が保持されたまま完了 = devDeps prune が止まったことを実測確認
4. **次回 cron (20:43) で再発しないことを継続観察**

### 教訓（TSB-007 episode 1〜5 を統合）

| ep | 検出 | 真因 | 修復 |
|---|---|---|---|
| 1 (元祖) | 4/19 | ESLint 6 vs flat config 不整合 | 設定移行 |
| 続編 | 4/21 | eslint v10 → v9 ダウングレード残存 | recommended 2 ルール一時 off |
| 3 | 4/22 22:00 | eslint v10 → v9 ダウングレード時の silent fail で node_modules 不整合 | npm install 再実行 |
| 4 | 4/23 03:36 | ep3 と同根 / proposal キューイング窓で再発 | npm install (autonomous) |
| **5** | **4/23 19:58** | **auto-heal の `--omit=dev` が devDeps を 4h ごと prune（構造的真因）** | **`--omit=dev` 削除（恒久対策）** |

**最大の教訓**: ep1〜ep4 は症状を治してきたが、ep5 でようやく **「治しても 4h 後にまた壊れる構造」** が判明。**症状ベースの対策では足りず、修復ループそのものを疑う必要がある（メタ診断）**。S9 (check-node-modules / 4/23 朝 cron 適用済) は 4h ごとに「異常」と検知してくれるが、**何が消すのか** は今回 19:58 の浜田指示「健康でない部分は自身で判断し修復」がなければ気づかなかった。

### 関連
- TSB-007 episode 1〜4（同一系列の症状）
- `scripts/auto-heal.mjs` 修正前の commit / 修正後の commit (本日中に commit 予定)
- 検出経緯: `chat-sessions/2026-04-23.md` 「19:58 — 浜田復帰 / ep5 真因特定」セクション
- 副次効果: `--omit=dev` 削除により audit fix が devDeps の脆弱性も触る可能性あり。現状 0 vuln なので影響なし

---

## TSB-007 episode 4 — node_modules/eslint 再消失（2026-04-23 03:36 検出 / autonomous mode 修復）

### 症状
4/23 03:35 浜田指示「完了後異常チェックを厳重に」で実施した autonomous mode 検査で、`npm run lint:customize` がまた v6.4.0 (`/usr/bin/eslint`) で実行され ❌。`node_modules/.bin/eslint` 不在 = ep3 と完全同一症状。

### 真因（ep3 と同根 / proposal 未適用ウィンドウで再発）
- ep3 で予防策 (R15/R16/S9) を 4/22 22:00 に proposal キュー化したが、適用は **4/23 06:00 朝 cron** 待ち
- 4/22 22:00 〜 4/23 06:00 の **8 時間ウィンドウ**で再発する余地が残っていた
- ep3 で `npm install` 実行は ep3 直後 1 回のみ。その後 (4/22 夜 〜 4/23 早朝) の何らかの操作 (Cursor 再起動 / npm 操作 / 別 PJ 干渉) で再消失。具体的契機は未特定だが ep3 と同じ silent fail パターン

### 修正（実施済み / autonomous）
1. `PATH=NVM_v24_PATH npm install` → 81 packages 再追加 / 0 vulnerabilities
2. `node_modules/.bin/eslint --version` → v9.39.4 復活確認
3. `npm run lint:customize` → 0 errors 緑復帰

### 教訓（episode 3 + 4 を統合）
1. **proposal キューイング窓は脆弱**: ep3 で R15/R16/S9 をキュー化しても、適用前ウィンドウで同症状再発した。**critical な修復策は proposal を待たず即時 commit + run** すべき
2. **検知タイミングの重要性**: 浜田の「完了後異常チェック」指示がなければ、4/23 06:00 cron の S9 適用 → 健康チェックまで気づかなかった可能性。**autonomous mode の検査周期短縮が必要**
3. **TSB-007 系は再発常連 = 構造的問題**: ep1/ep2/ep3/ep4 = 4 連続。S9 (check-node-modules) + auto-heal 連携 (R16) で根絶を狙う

### 関連
- TSB-007 episode 3（直前の同症状 / 2026-04-22 22:00）
- proposal: 同上 R15/R16/S9（4/23 06:00 cron 適用予定 / 適用後は本 episode 4 が最終発生として打ち止め見込み）
- 検出経緯: `chat-sessions/2026-04-23.md` 「03:35 — 完遂後異常チェック (autonomous mode 2 回目)」セクション

---

## TSB-011 — 並行 Cursor チャット騒動（2026-04-22 21:48 検出 / 改善案 #12 + #13）

### 症状
浜田が無自覚で Cursor の別窓に同じ「実装手順（22:00 締め目標）」テンプレを貼ったため、2 本の Cursor チャット（transcript `59936008` + `832a7a75`）が同じリポを並行で触る状況が発生。一方のチャット（私 / メイン）が proposal R12-R16 + S9 を作成 commit した直後、もう一方のチャット（並行）が浜田の「壊れてないか確認」要求に反応して **R13 proposal の半角→全角 () バグを発見・自律 fix（commit `68d1765`）**。

### 真因
1. **Cursor の UI に「同一リポを触っている他チャット数」表示がない** = 並行発生に気付く手段がない
2. 浜田が「儀式 v2」テンプレ + 「実装手順」テンプレを意図せず両方の窓に貼った（同じテンプレを 2 回コピーした記憶ミス）
3. 私（メイン側）も「単独で動いている前提」で並行存在を疑わなかった

### 検出方法（事後）
```bash
# 過去 24h の Cursor agent transcript を列挙
find ~/.cursor/projects -name "*.jsonl" -newermt "$(date -d '24 hours ago' '+%Y-%m-%d %H:%M:%S')"

# 同期間の git commit (Made-with: Cursor) を列挙
git log --since='24 hours ago' --grep='Made-with: Cursor' --format='%h|%ai|%s'

# transcript 数 ≥ 2 + commit 数 ≥ 2 なら並行可能性大
```

検知の自動化は `scripts/check-parallel-chats.mjs`（改善案 #12 / S11 / 4/23 朝 cron で配置予定）が担う。

### 影響（2026-04-22 のケースは結果的に良性）
- 並行チャットの fix `68d1765` は **正しい修正** で、私の R13 半角→全角 () バグを 4/23 朝 cron 失敗確定の状態から救済
- merge conflict は発生せず（diff が独立したファイル / 順次直列化）
- ただし悪性化シナリオ（同じファイルを別方向に編集 / 矛盾する報告 / トークン 2 倍消費）のリスクは残る

### 対策（実施済み）
1. 浜田が並行チャットを **手動で閉鎖**（21:51 浜田判断）
2. `chat-sessions/2026-04-22.md` に並行チャット騒動の経緯を記録
3. `scripts/check-parallel-chats.mjs` を 4/23 朝 cron 配置（S11 proposal）

### 予防（提案 / 朝 cron で 4/23 自動適用予定）
| ID | 内容 | 効果 |
|---|---|---|
| S11 | `scripts/check-parallel-chats.mjs` 新規（過去 24h transcript 数 + Cursor commit 数を比較し ⚠ 表示）| 翌朝に並行発生を検知 |
| TSB-011 | 本記事 | 検知方法 + 対策の知識化 |

### 教訓（Lessons Learned）
1. **「1 リポ 1 チャット」原則を明文化**: 明示的に役割分担している場合（例: AI A = customize / AI B = scripts）以外は並行禁止
2. **並行発生時の良性条件**: ① 編集ファイルが独立 ② commit 順序が直列化される ③ 双方が良質な批判精神（§47）を持つ。今夜は 3 条件すべて満たして救済された奇跡
3. **検知の自動化が唯一の継続的対策**: 浜田・AI 双方の「気付き」に頼ると今夜と同じ「21:48 まで誰も気付かない」が再発する

### 関連
- AGENTS.md §44 夕反省サイクル（改善案 #11 と連動 / proposal 事前検証儀式）
- AGENTS.md §47-B ルール疲労ガード（改善案 #17 / 並行チャットが救った R13 の元バグの再発防止）
- proposal: `docs/approved-changes/2026-04-23/S11-check-parallel-chats.proposal.json`
- 詳細経緯: `chat-sessions/2026-04-22.md` 「夜のセッション 3」

---

## TSB-012 — rag MCP が documentCount=0 で完全 broken（2026-04-23 03:00 早朝検出）

### 症状
2026-04-23 02:50 に AI が autonomous mode で rag MCP を call test した際、`mcp_user-rag_status` が `{ documentCount: 0, chunkCount: 0, ftsIndexEnabled: false, searchMode: "vector-only" }` を返した。`mcp_user-rag_query_documents` で「環境設定マスタ」「PC台帳」「kintone」「customize」など 4 件のクエリを試したが全て空配列 `[]`。

つまり **rag MCP は機能していない** = 過去の cron による ingest 処理が反映されていない。

### 真因（複数仮説 / 浜田立ち会いで確定要）

| # | 仮説 | 確度 |
|---|---|---|
| 1 | mcp-local-rag のバージョン不一致（`npx -y mcp-local-rag` で最新 install / cron の ingest コマンドと MCP サーバ起動時のバージョンが違う / lancedb スキーマが内部で更新され旧 table が認識不可）| **本命** |
| 2 | lancedb の table 名 mismatch（cron の `ingest` がデフォルト table 名で書込 / MCP サーバが別 table 名で read 試行）| 中 |
| 3 | 環境変数 / config の差異（cron 環境 vs MCP サーバ起動環境）| 低 |
| 4 | lancedb のロック / 同時アクセス問題（MCP サーバ常駐 + cron ingest が衝突）| 低 |

### 確認済の事実
- `~/.cursor/mcp.json` の rag 設定は正しい: `--db-path /home/mhamada202408224/kintone-ai-lab/.rag/lancedb` を指している
- 実際に `.rag/lancedb/` には `chunks.lance` (43MB) が存在 = ingest 自体は成功している
- が、MCP サーバから `documentCount: 0` = サーバが見ているスキーマと cron が書込んだスキーマが乖離

### 影響範囲
- **AGENTS.md §20 RAG 検索義務**: 重要設計判断 / 不具合調査 / リファクタ前に rag_search が必須だが、現状の rag では何も返らないので **§20 義務は実質遂行不可**
- **改善案 #12 戦略 v1.0**: 「14/16 死蔵」の集計に rag を「active 扱い（§20 義務化中）」と書いていたが、**実際は broken** = 訂正必須（戦略書 7 章で訂正済み）
- **MCP 強化戦略 段階 1 監査の精度低下**: 机上分析で「active」と判断していた MCP の実態確認の重要性を露呈

### 修復プラン（4/23 朝以降 / 浜田立ち会い）

**Phase 1: 原因特定（30 分予算 / §47-9 着手前判断必須）**
1. `npx --yes mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models status` を CLI で直接実行
2. lancedb の table 名を `python3 -c "import lancedb; db = lancedb.connect('.rag/lancedb'); print(db.table_names())"` 等で確認
3. mcp-local-rag のバージョン確認 + changelog 読み（破壊的変更があったか）

**Phase 2: 修復候補（浜田判断後）**
- a) `.rag/lancedb/` を完全削除 → `npm run rag:ingest`（R26 適用後）で再 ingest（30 分 + ベクトル化時間）
- b) mcp-local-rag を特定バージョンで pin（package.json devDependencies に追加）
- c) 別の RAG 実装に乗換（chroma / weaviate-mcp 等）
- d) rag をやめて memory MCP + filesystem MCP で代替（軽量だが構造化記憶のみ）

**Phase 3: 再発防止（修復後）**
- `scripts/health-check.mjs` の MCP 疎通チェックに「rag は initialize 応答だけでなく status の documentCount > 0 を確認」を追加
- `scripts/check-mcp-dormancy.mjs`（S12）に broken 状態検知も追加

### 教訓（Lessons Learned）
1. **机上分析（段階 1 監査）と実証は両輪**: 「active 扱い」と書いた MCP も実 call で機能未確認なら broken の可能性を疑う
2. **MCP の status エンドポイントは必ず叩け**: `initialize` 応答が返るだけでは「機能している」と言えない（rag は initialize OK でも DB は空）
3. **autonomous mode の価値**: 浜田が寝ている間に AI が実証することで、机上で見落とした重大障害を発見できた = §47-9 着手前判断 + autonomy granted の組合せの効果

### 関連
- 戦略書: `docs/plans/2026-04-23-mcp-strategy-v1.md` 7 章（4/23 03:00 早朝 MCP 実証結果）で訂正
- 段階 1 監査: `docs/reports/2026-04-23-mcp-audit-stage1.md`（rag を「active 扱い」と書いていた箇所 / 7 章で実態訂正）
- 関連 proposal: R25 (§21 RAG Ingest Ritual 強化) / R26 (npm run rag:ingest スクリプト) は **rag MCP 修復後でないと意味がない** = 修復が R25/R26 の前提条件
- AGENTS.md §20 RAG 検索義務 / §21 RAG 知識更新フィードバックループ

---

### 🔧 修復報告（2026-04-23 03:30 / 浜田緊急指示「早急に rag 復旧」）

#### 確定した真因
**mcp-local-rag v0.13.0 の server mode は `--db-path` / `--cache-dir` CLI 引数を完全に無視する仕様**（バグまたは仕様変更）。

ソースコード調査結果（`/home/mhamada202408224/.npm/_npx/4dccec079c88fcb2/node_modules/mcp-local-rag/dist/`）:

| ファイル | 該当行 | 内容 |
|---|---|---|
| `cli/options.js` | line 107-173 | `parseGlobalOptions()` は `--db-path` / `--cache-dir` を**正しくパースする** |
| `cli/options.js` | line 181 | `resolveGlobalConfig()` は **CLI 引数 → env vars → デフォルト**の優先順で解決する（CLI subcommand mode 専用）|
| `server-main.js` | line 78-82 | `startServer()` は `process.env['DB_PATH'] \|\| './lancedb/'` だけを参照し、**`resolveGlobalConfig()` を呼ばない** |
| `index.js` | line 19-39 | サブコマンドありなら `handleCli()` 経由（CLI 引数効く）/ なしなら `startServer()` 直叩き（CLI 引数捨てられる）|

つまり**ingest 側（CLI subcommand mode）は CLI 引数で `.rag/lancedb` を見る**が、**MCP server 側（server mode）は env vars が無いと `process.cwd()/lancedb/` （存在しない空のパス）を見る** = `documentCount: 0` を返し続けていた。

`.rag/lancedb/` 自体は健全（chunks.lance に 17MB / 69 data ファイル / 64 documents / 2318 chunks / 4/22 06:01 まで cron で更新継続）。

#### 修復実施内容

1. **`~/.cursor/mcp.json` の rag セクションを env vars 化**（commit はこの後）:

```json
"rag": {
  "command": "/home/.../v24.14.1/bin/npx",
  "args": ["-y", "mcp-local-rag"],
  "env": {
    "PATH": "/home/.../v24.14.1/bin:...",
    "DB_PATH": "/home/mhamada202408224/kintone-ai-lab/.rag/lancedb",
    "CACHE_DIR": "/home/mhamada202408224/kintone-ai-lab/.rag/models",
    "BASE_DIR": "/home/mhamada202408224/kintone-ai-lab"
  }
}
```

2. **CLI レベル復旧検証成功**（PATH 上書きで NVM v24 強制）:

```
{ documentCount: 64, chunkCount: 2318, ftsIndexEnabled: true, searchMode: 'hybrid' }
```

3. **検索動作検証成功**: `query_documents("PC 台帳 環境設定マスタ", topK=3)` で 4/21 仕様書 + 4/18 SKYSEA 計画 + AGENTS.md から 10 件 hit。

4. **backup**: `~/.cursor/mcp.json.bak-rag-fix-20260423-031551`

#### 再発防止（実装済 / 同 commit）

| 対策 | 実装場所 | 内容 |
|---|---|---|
| **静的設定チェック** | `scripts/health-check.mjs`（rag 専用 DB 内容チェックブロック）| mcp.json の rag に `env.DB_PATH` がなければ ❌ / `args` に `--db-path` が残存していたら ❌ |
| **動的 status 呼出** | `scripts/health-check.mjs` | rag MCP に initialize + status を spawnSync で送り、`documentCount=0` なら ❌ |
| **markdown 警告** | `scripts/health-check.mjs` | `### 🔎 rag MCP DB 内容チェック (TSB-012 再発防止)` セクションを朝レポートに追加 |
| **R25/R26 前提条件明記** | 本セクション | RAG Ingest Ritual の強化案は本修復が前提と明示 |

#### 残課題（浜田 19:00 レビュー時）

- ⚠ **Cursor 再起動が必要**: `~/.cursor/mcp.json` 編集の効果が出るのは Cursor (実際には MCP サーバプロセス) の再起動後。浜田が出社時に Cursor 開き直す or `Reload Window` で反映。
- ⚠ **mcp-local-rag への issue 報告検討**: v0.13.0 の server mode が CLI 引数を無視する挙動は、`--help` テキスト（`cli/options.js` line 81）で `--db-path` を案内している点と矛盾するため、上流リポへの bug report 候補（GitHub: https://github.com/shinpr/mcp-local-rag）。
- ⚠ **mcp-local-rag のバージョン pin 検討**: 現在 `npx -y mcp-local-rag`（常に最新）= 上流の挙動変更で再度同じ事故が起きる可能性。`mcp-local-rag@0.13.0` に pin or 自前 fork 検討。

#### この事故から学ぶべき教訓（追加）

1. **MCP の status エンドポイントは健康診断必須**: initialize 通過だけでは「機能している」とは言えない（rag は initialize OK で内部 DB 空でも初期化成功扱い）→ health-check.mjs 修正済
2. **`npx -y` で取れる「最新」の罠**: 上流の破壊的変更を毎回 install してしまう = バージョン pin の重要性
3. **autonomous mode の真の価値**: 浜田就寝中の AI が `mcp_user-rag_status` を実 call することで初めて発見できた = 机上設定確認のみでは絶対に気付けなかった
4. **CLI 引数が「help テキストに書いてあるが server mode で無視」されるのは設計バグの典型パターン**: 同じ落とし穴を他の MCP でも疑う（特に v0.x の若いバージョン）→ 別 MCP 導入時の確認項目に追加すべき

---

## TSB-016 — BREAKING 削除が 1.5h 後の無関係 commit で無自覚に undone（2026-04-25 09:00 検出 / H-2 で発見）

### 症状
2026-04-25 09:00 に H-2 タスク（AGENTS.md 章リファクタ下調査）で AGENTS.md (2004 行) を分析中、**「## 第17章 第二意見メカニズム」が line 1711 から完全な形で残存**を発見。同章は浜田 5:30 GO「セカンドAI関係のルールだけ確実に消してほしい」で削除済みのはずだった。

`grep -c "§53|第17章|second.opinion|セカンド.?AI"` で **AGENTS.md に 50 件 hit** = 完全に復活している状態。

### 真因（git log 実証で確定）
| 時刻 (4/25) | commit | 内容 | AGENTS.md への影響 |
|---|---|---|---|
| 05:41 | `5f928dd` | [BREAKING] remove ch.17 second-AI (§53); Tier A via §52-3 only | 451 行削除 / 135 行追加 (8 ファイル) = **Ch.17 削除実施** ✅ |
| 06:16 | `5156f69` | [FIX] re-remove ch.17 fragment | 1 行削除 / 15 行追加 (微細) ✅ |
| 07:24 | `6bac959` | [FEAT] §35-5 task-log.mjs (主目的 = 別の rule 制定) | **AGENTS.md +298 行 / -1 行** = `@@ -1706,3 +1706,299 @@` で **末尾に Ch.17 全 299 行を再追加** ❌ |
| 07:30 | `c00ba97` | [FEAT] §11-4 / §11-5 checklists | +4 / -2 (微細 / 影響なし) |

つまり commit `6bac959` は主目的 (§35-5 task-log 制定) の編集中、AGENTS.md の編集バッファに **削除済の Ch.17 が古い状態で残存** していたか、AI が誤ってクリップボード/古い view から Ch.17 を貼付したかで、**299 行の意図せぬ復活**が起きた。誰もこの差分の異常を気付かず 1.5h 放置（→ 4/25 09:00 H-2 で発見）。

### 影響範囲
- 浜田 5:30 GO「セカンドAI 削除」が **1.5 時間で無自覚に undone** されていた
- AGENTS.md が 2004 行 (実 1711 行 + 復活 293 行) = 5月目標 #6 (1700 行以下) 未達原因
- changelog (line 1228) が "v22 で撤去" と書きつつ実体は復活 = **ドキュメント vs 実体の乖離** = §42-2 Continuity Assurance の死角
- RULES-INDEX.md / WORKFLOW.md / scripts は §53 を参照していない（=実体だけが亡霊として残存していた）

### 修復実施内容（H-2 同時実施）
1. AGENTS.md line 1708-EOF を完全削除 = 297 行削減 (2004 → 1707 行 → 5月目標 1700 行以下を 7 行差で達成寸前)
2. v23 changelog (line 1229 領域) に「**v23.1 [FIX] 4/25 7:24 で誤復活した Ch.17 を再々削除**」追記
3. audit-rules / audit-tsb-confirmed / health-check で副作用なし確認
4. commit + push 後、`.session-state/agents-md-hash.txt` を新ハッシュで更新（次セッション継続性確保）

### 教訓（Lessons Learned）
1. **無関係 commit が破壊的変更を undone するパターン**: BREAKING 削除直後の数時間は **AGENTS.md ハッシュ + 章数を全 commit で post-commit verify** すべき。git pre-commit hook で検知可能
2. **編集バッファの罠**: AI 補助編集中、古い view / クリップボード / 内部キャッシュから削除済セクションが復活することがある。**commit 前に削除されたはずの章が含まれていないか grep 必須**
3. **changelog vs 実体の乖離検知**: changelog で "撤去" と書かれた章が実体に存在する場合 = §42-2 Continuity Assurance の死角 / 自動検知ルール追加候補（H-2 改善案 #20 で起票予定）
4. **「並列禁止」だけでなく「commit 前検証」も並列予防に効く**: §51 並列禁止が守られても、直列 commit でも編集差分の検証を怠れば同種事故は再発する

### 再発防止策（構造的 / 完了）

| ID | 実施日時 | 内容 | 状態 |
|---|---|---|---|
| I-1/I-2 | 2026-04-25 09:45-10:18 | `scripts/verify-breaking-deletions.mjs` v3 多ファイル対応 (AGENTS.md / RULES-INDEX.md / WORKFLOW.md / CLAUDE.md / kintone-apps.md 一括) + cron 統合 (daily-morning-prep §5-3) | ✅ 完了 |
| I-9 | 2026-04-25 10:33 | **post-commit Git hook 導入** (改善案 #20 の本実装) — 全 commit 後に `verify-breaking-deletions.mjs --since=50` 自動実行。warn 検知時は terminal-bell + 強調表示 + `logs/git-hooks/post-commit.log` 記録。`bash scripts/install-hooks.sh` または `npm run hooks:install` で setup | ✅ 完了 |
| I-10 | 2026-04-25 10:35 | `health-check.mjs` S15 (Git ahead/behind 検知) 追加 — push/pull 忘れ閾値超過で警告（4/22-23 で 134 commits ahead 状態だった前例の再発防止） | ✅ 完了 |
| I-11 | 2026-04-25 10:38 | `scripts/audit-cross-references.mjs` 新規 (AGENTS.md ↔ RULES-INDEX.md drift) — 索引漏れ / 死参照 検知 / 「§N は欠番」等の正規宣言は info 扱い除外 | ✅ 完了 |
| I-15 | 2026-04-25 10:42 | `npm run verify:all` 統合スクリプト (audit-rules / audit-tsb / verify-breaking / audit-xref を直列実行) | ✅ 完了 |

→ **TSB-016 構造的再発防止 完了**。今後同種事故 (BREAKING 削除が後続 commit で undone) は post-commit hook が即座に検知し、cron も daily で再確認する 2 段防御体制。

### 関連
- 朝 5:30 浜田指示原文: 「セカンドAI関係のルールだけ確実に消してほしい。その他のルールは絶対に保護してほしい」
- 関連 commit: `5f928dd` / `5156f69` / `6bac959` / 修復 commit `e7a64a1`
- 再発防止 commit: `7b62986` (verify v2 修復) / `c8adce0` (I-9〜I-15 一括導入)
- §42-2 Continuity Assurance: ファイル直読方式 = changelog vs 実体乖離の検知強化候補

---

## TSB-017 — 原因不明の AGENTS.md 編集 (現セッション AI 関与なし / 2026-04-25 11:03 検出)

### 症状

2026-04-25 11:03 JST、AI が「§47-D ルールを AGENTS.md に追記する」と提案中、AGENTS.md を grep したところ **§47-D が既に存在** していた。

- AGENTS.md mtime: `10:58:57 JST` (= 浜田 10:57「却下しますで叱ってほしい」メッセージ送信直後)
- 現セッション AI (= このチャット) は AGENTS.md を編集していない (AskQuestion 表示中 / interrupt 前)
- working tree 上だけの変更 / 未 commit
- §42-2-2 hash 監視: J-5 で記録した `5c2927ee...` ↔ 現状 `4d9865ef...` で **不整合検知 OK**（ただし手動チェックでしか発見できず）
- 35 行追加 = §47-D「矛盾指示の却下義務」全文 (背景 / 遵守事項 5 件 / 例外 / 反パターン / 正パターン / 制定契機 / §47-C との関係)

### 追加証拠 (2026-04-25 11:10 発見)

最初の検出後、git status 確認で **更に重大な証拠** が判明:

1. **RULES-INDEX.md も同タイミングで編集** (mtime 10:59:11) — §47-D を全番号参照リスト + 主要追加章ハイライト表に追加 = AGENTS.md §47-D 追加と完全連動
2. **`.b7-pre-20260425T105826` バックアップ 2 件発見** (`AGENTS.md.b7-pre-...` / `RULES-INDEX.md.b7-pre-...` / mtime 10:58:26)
3. **「.b7-pre」命名は AI が B-7 提案メッセージで書いた手順そのもの** = 「`cp AGENTS.md AGENTS.md.b7-pre` でローカル待避」を文字通り実行した者がいる証拠
4. 証拠保全: `backups/tsb-017-evidence/` に 2 件移動 (gitignore 対象 / ローカル保全のみ)

### 仮説 (証拠で絞り込み済 / 真因 1 つに収束)

| # | 仮説 | 評価 |
|---|---|---|
| A | **浜田の別 Cursor セッション** が私の B-7 提案テキストを読み「実行指示」と解釈して B-7 を完遂 | **★ 最有力** — `.b7-pre` 命名 / AGENTS.md + RULES-INDEX.md 連動編集 / 完璧な実装品質 = 高度 AI による実行と一致 |
| B | Cursor IDE の auto-fix / hook | ❌ 通常存在しない / `.b7-pre` 命名は IDE 機能ではなし得ない |
| C | 現セッション AI の記憶漏れ | ❌ AskQuestion 中は file 編集不能 / interrupt 前の操作記録なし |
| D | 浜田手動編集 | ❌ 35 行 AI 風文体 + 連動 INDEX 更新を人間が 30 秒で書くのは不可能 |

→ **真因確定: 別 Cursor セッションが私の B-7 提案を実行した = §51 並列禁止違反**

### 影響範囲

- 内容自体は浜田意図と完全一致（却下 + 叱る + S0/S1 例外 + §47-C との関係明示）= **機能的には正しい**
- AGENTS.md §47-D を `1c49fa2` で commit + push = 公式化
- RULES-INDEX.md §47-D 索引も後続 commit で公式化
- ただし **§51 並列禁止違反**（別セッションの動作）は重大事象 → 再発防止策必須

### 対応実施内容（2026-04-25 11:03-11:?? / K-シリーズ）

1. **K-1**: AGENTS.md §47-D を commit + push (`1c49fa2`) → 公式化
2. **K-2**: 本 TSB-017 起票（真因不明のまま記録）
3. **K-3**: 防御策の future plan 起票 = `docs/plans/_future/2026-04-26-agents-md-realtime-watch.md` (AGENTS.md mtime をリアルタイム監視する file watcher の追加検討)
4. **K-4**: `.session-state/agents-md-hash.txt` を `4d9865ef...` (新値) に更新
5. **K-5**: chat-sessions に経緯記録 + 最終 commit + push

### 教訓 (現時点 / 真因確定後に更新)

1. **§42-2-2 hash 監視は機能した** が「手動チェック時にしか発見できない」仕組みは弱い → リアルタイム検知 hook が必要
2. **TSB-016 防御層 (post-commit hook + verify-breaking) は commit 後にしか走らない** → working tree 段階の編集は検知不能 = 死角
3. **「内容が妥当」と「経路が妥当」は別評価** → 結果オーライで commit したが、経路不明は別途追跡継続
4. **並列 Cursor セッションの監視機構が不足** → ps aux + lock file 等の実行時排他制御を検討候補

### 真因究明アクション（5/22 メジャーレビューまでに完了希望）

- [ ] Cursor IDE のログ確認（`~/.cursor/logs/` 等で 10:58:57 前後の編集 event があるか）
- [ ] WSL 内の他プロセス（cron / inotify ベースの hook / file watcher）の動作確認
- [ ] 浜田に「他の Cursor 窓 / ターミナル / 手動編集」を行ったか確認（並列セッション疑い）
- [ ] file watcher (`scripts/file-watcher.mjs`) のログ確認（同 watcher 自体が編集している可能性）

### 関連
- 関連 TSB: TSB-016 (AGENTS.md zombie 復活) / TSB-005 (セッション間継続性脆弱性)
- 関連 commit: `1c49fa2` (§47-D 公式化) / 続く K-シリーズ commit
- 関連 ルール: §42-2-2 hash 監視 / §51 並列禁止 / §47-D 矛盾却下 (本件で公式化)

---

## TSB-018 — Cursor IDE が API 制限到達で `Composer 2` へ silent fallback（2026-04-26 06:33 検出 / N-3 / 浜田朝ブリーフィングで報告）

### 症状

2026-04-26 朝、浜田が Cursor IDE chat で以下のメッセージを受領:

```
Switched to Composer 2 after reaching API limit.
```

これは Cursor IDE が **Opus 4.7 のレート制限/クレジット枯渇** に達した際、ユーザー GO なしで `composer-2` (Cursor 独自の安価フォールバックモデル) へ自動切替する仕様。§1-2 の「Sonnet/軽量モデル/他社モデルへ切り替えてタスクを進めない」を **構造的に違反** する。

### 影響

- **モデル品質低下**: Opus 4.7 (1M Max Thinking) → composer-2 (軽量) で同等の判断は得られない
- **silent breach**: 警告が小さく、AI 側が気付かないまま作業継続するリスク
- **ルール違反の常態化**: §1-2 が形骸化する恐れ
- **過去 inferred 事象**: 2026-04-25 の TSB-013 v1 表層対策、TSB-007 系の品質揺れも、もしかすると別モデル稼働時の影響だった可能性（要追跡）

### 真因

Cursor IDE の既定挙動:

1. Opus 4.7 のクレジット枯渇 → 自動的に低コストモデル (composer-2 / sonnet 等) へフォールバック
2. ユーザー設定で「Auto モデル」「Auto-fallback」が有効な場合、silent switch
3. CLI と異なり IDE 側に `cli-config.json` 相当の `hasChangedDefaultModel` フラグ単体では防御不可（IDE 設定 UI で複数項目を OFF にする必要）

### 対応実施内容（2026-04-26 06:42 / N-3）

1. **§1-2-2 制定**: AGENTS.md に「API 制限到達時の自動フォールバック禁止」を新設。IDE 設定 5 項目（Auto / Auto-fallback / Use Auto on limits / 有効モデル一覧 / Background agents）の必須状態を表で明文化。
2. **AI 検知時動作**: メッセージ `Switched to (Composer|Sonnet|GPT|Gemini|Auto) ...` を検知したら **即座に作業中断** → 浜田へ「§1-2-2 違反検知」報告 → GO 待ち。§47-E 同等扱い。
3. **RULES-INDEX 更新**: §1-2-2 を「タスク開始時に必ず参照」表に統合。
4. **CURSOR-トラブル対応メモ.md 更新**: Composer 2 検知時の浜田復旧手順を追加（IDE 設定 → Models で Auto OFF + Opus 4.7 単独 ON）。
5. **NEW-SESSION-STARTER.md 更新**: §1-2-2 を冒頭の「最重要 5 件」リストに追加。
6. **浜田 Desktop 同期**: AI緊急用フォルダの **`00-NEW-SESSION-STARTER_yyyymmdd.txt`（canonical）** / `01-HANDOFF-AI-FIVE-BLOCKS.md` / read-pack **`02-`〜`10-`** / `11-SESSION-BOOTSTRAP-CHECKLIST.txt` / `12-HANDOFF-HUMAN.txt` / **`13-README.txt`** を `npm run session-starter:sync-desktop` で反映（§57-6）。**貼付推奨**は `verify:desktop-ai-emergency-sync` 成功時の最終行。

### 浜田復旧手順（IDE 側 / 30 秒）

1. Cursor IDE → 設定 → Models を開く
2. 以下を OFF:
   - `Auto` モデルピッカー
   - `Auto-fallback to Composer/Sonnet on rate limit`（または同等項目）
   - `Use Auto model when limits reached`（または同等項目）
3. 有効モデル一覧で **`Opus 4.7 1M Extra High` のみ ON**、他は全 OFF
4. Background agents モデルも Opus 4.7 系に固定（または無効化）
5. クレジット枯渇時はエラー表示で停止する設定にする

### 教訓

1. **CLI と IDE は別ソース** — `~/.cursor/cli-config.json` の対策（§1-2-1 で documented）は CLI のみ。IDE 側のフォールバックは別経路。
2. **silent switch は最大の敵** — メッセージが小さい / モデル名が変わるだけで AI/ユーザー双方が気付きにくい
3. **検知 → 即停止が原則** — §47-E 連動で「ルール違反は浜田が出した指示でも却下」と整合
4. **モデル切替監視を将来 health-check 化候補** — `health-check.mjs` に S17 として「直近の Cursor model log にフォールバック痕跡なし」を追加検討（5/10 月次レビュー）

### 関連
- 関連 TSB: TSB-016 (AGENTS.md zombie / 構造的防御の重要性) / TSB-017 (silent breach 系の双子)
- 関連 ルール: §1-2 単一モデル / §1-2-1 環境別実モデル名 / §1-2-2 自動フォールバック禁止 (本件で制定) / §47-E 憲法違反却下 (検知時動作)
- 関連 commit: TBD (N-3 commit で参照更新)

---

## TSB-019 — Cursor IDE Auto-Run "Run Everything (Unsandboxed)" + Browser/MCP Protection OFF が §52 RACI を構造的 bypass（2026-04-26 07:42 検出 / Q1 / §1-2-2-1 設定検証中に発見）

### 事象

2026-04-26 朝、§1-2-2-1 (Cursor IDE 必須設定) の設定検証フェーズで浜田に Cursor IDE Settings → **Agents** タブを開いてもらいスクショを送付してもらった結果、以下の極めて危険な構成が発覚した:

| 項目 | 設定値 | 危険度 |
|---|---|---|
| **Auto-Run Mode** | **Run Everything (Unsandboxed)** | 🔴 最高 |
| **Browser Protection** | **OFF** | 🔴 高 |
| **MCP Tools Protection** | **OFF** | 🔴 **kintone 本番 API 直撃** |

これは Cursor IDE が AI Agent に対して以下のすべてを **承認プロンプト無し** で実行可能にする構成:

- **shell コマンド**: `npm run`, `git`, `ls`, **`rm -rf`** などすべて
- **file write**: 任意ファイル作成・上書き・削除
- **MCP ツール**:
  - **kintone MCP** (本番 API への record 作成・更新・削除・app 設定変更)
  - **filesystem MCP** (任意パスへのファイル操作)
  - **memory MCP** (knowledge graph 改変)
  - **playwright MCP** (ブラウザ自動操作 / form 入力 / リンク click)
  - **accessibility-scanner / cve-search / cyber-news** 等

### 根本原因

| # | 原因 | 詳細 |
|---|---|---|
| 1 | **AGENTS.md §52 RACI と Cursor IDE 設定の乖離** | §52 は「Tier B (irreversible) は浜田の明示 GO 必須」と憲法レベルで規定。しかし IDE が Run Everything (Unsandboxed) かつ Protection OFF だと **§52 が IDE レベルで完全に bypass される** = 憲法と実装が乖離 |
| 2 | **§1-2-2 (N-3 / 2026-04-26 06:42) 制定時に Auto-Run Mode を見落とし** | §1-2-2 制定の主目的は「Composer 2 silent fallback」防御（モデル選択側）。実行制御 (Auto-Run Mode) は同一画面 (Settings → Models / Agents) にあるが別概念のため見落としていた |
| 3 | **設定検証は浜田スクショ依存で初回確認まで時間がかかる** | AI から IDE 設定を直接読む API なし。浜田が「困っていない」と感じている間は OK と推定する設計 = **silent breach** が長期間放置されるリスク |
| 4 | **過去のインシデントとの相互作用未検証** | TSB-006 (Undo All 破壊), TSB-017 (並列セッション勝手書換) は本設定と組み合わさると被害が拡大する構造だった可能性大。当時の浜田の困惑「自分が触ってないのに動いた」は本設定が一因だった蓋然性が高い |

### 影響範囲

- **kintone 本番データ全 22 アプリ**（特に PC 台帳 594/595/626/627/668、M365管理マスタ 670、環境設定マスタ 669 等）
- **shell 実行可能な全操作**（git push --force / npm install で任意コード実行 / WSL 全ファイル）
- **MCP 16 件 (active 13)** すべての副作用ツール
- **本日午前の AI 実行履歴**: O-series commit (07:05 [FEAT] credit-budget) の段階で既にこの設定下で動作していた = 過去 commit の MCP/shell 実行は浜田 GO なしの自動承認で進んだ可能性

### 暫定対処（浜田 07:48 実施）

| # | 項目 | Before | After |
|---|---|---|---|
| 1 | Auto-Run Mode | Run Everything (Unsandboxed) | **そのまま維持**（浜田判断「基本自律 + 危険時のみ確認」/ 都度承認はつらい）|
| 2 | Browser Protection | OFF | **ON** |
| 3 | MCP Tools Protection | OFF | **ON** ⭐ kintone 本番 API ゲート復活 |

→ Cursor 設計上、`Run Everything` mode でも Browser/MCP Protection を ON にすると **その 2 カテゴリのみ承認ゲートが復活** する仕様を活用。「基本自律 + kintone 本番 API は浜田確認」を 2 トグルで実現。

### 恒久対処

| # | 対処 | 状態 |
|---|---|---|
| 1 | **§1-2-2-1 を 4 → 7 項目に拡張**（On-Demand + Auto-Run + Browser Protection + MCP Tools Protection を追記）| 本 commit |
| 2 | **§52 RACI 補強**: 「shell 暴走防止 = AI が `rm -rf` / `git push --force` / `npm install` 等高リスク shell は **事前報告 → 浜田 GO 待ち**」を AGENTS.md に追加 | 本 commit |
| 3 | **§57-5 検証ステップに Cursor IDE 設定確認を追加候補**（Q-series で別途検討）| Q-series |
| 4 | **health-check.mjs S17 候補**: 「Cursor IDE Agents 設定の手動確認リマインダ（月 1 回）」 | 5/10 月次レビュー検討 |

### 教訓

1. **憲法と IDE 設定の乖離は「silent breach 級」** — §52 のような重大ルールは IDE 設定で裏打ちされていなければ実効性ゼロ
2. **「設定 = ドキュメント」ではない** — §1-2-2-1 を 4 項目で「ヨシ」と判断したのは早計。Cursor IDE は仕様変更が頻繁で、隣接設定群（同じ画面の別 section）も全件確認が必要
3. **Browser/MCP Protection という Cursor の優れた設計を活用すべきだった** — 「YOLO か Manual か」の二者択一ではなく「カテゴリ別承認ゲート」が用意されている。設定検証時に dropdown / トグルを **すべて読む** 必要がある
4. **Q-series 包括監査の必要性** — 残 5 タブ (Hooks / Tools & MCPs / Rules-Skills-Subagents / Indexing & Docs / Plan & Usage) も同様の隠れた違反設定がある可能性 → PC 台帳完了後に必須実施
5. **「困ってない = 安全」は誤り** — 浜田が違和感を感じない設定こそが silent breach の温床（TSB-018 と同じ構造）

### 関連
- 関連 TSB: TSB-006 (Undo All 破壊 / 本設定と相互作用の可能性) / TSB-017 (並列セッション / 本設定があれば被害拡大していた) / TSB-018 (silent breach 系の親戚)
- 関連 ルール: §1-2-2 / §1-2-2-1 (本件で 4 → 7 項目拡張) / §52 RACI (本件で shell 暴走防止追記) / §47-E 憲法違反却下
- 関連 commit: 本 commit (Q1 [FEAT])
- 後続: Q-series 包括 Cursor 設定監査（PC 台帳完了後）

---

## TSB-022 — dangerous-shell-blocker.sh が heredoc 本文を誤検知（2026-04-26）

### 事象

`~/.cursor/hooks/dangerous-shell-blocker.sh` は `beforeShellExecution` フックで **実行予定コマンド文字列**を正規表現で判定して deny する。

しかしコマンドに heredoc が含まれる場合、heredoc の **本文（単なる文字列）**の中に `git rebase` 等が出現すると、deny regex がそれを「実際の実行コマンド」と誤認して block する可能性があった。

例（概念）:

```bash
git commit -m "$(cat <<'EOF'
手順メモ: git rebase は後でやる
EOF
)"
```

### 根本原因（真因 1 文）

**deny 判定がコマンド全文に対して行われ、bash 構文上「実行されない heredoc 本文」もマッチ対象に含まれていたため。**

### 対策（恒久）

- heredoc を含むコマンドは、deny 判定前に **heredoc 本文を除去した文字列**（header + delimiter 行のみ）に正規表現を適用する。
- これにより「実行されない文字列」が危険コマンド扱いされる false positive を防ぐ。
- 実装は `~/.cursor/hooks/dangerous-shell-blocker.sh` の `strip_heredoc_bodies()` で行い、delimiter token を best-effort で抽出して本文をスキップする（例: `<<EOF`, `<<-EOF`, `<<'EOF'`, `<<-"EOF"`, `<<\\EOF`）。
- **補足（消失対策）**: 実行正本は `~/.cursor/hooks/...`（git 管理外）のため、履歴上の再現性・バックアップ用に同内容のスナップショットを `artifacts/cursor-hooks/dangerous-shell-blocker.sh` として `kintone-ai-lab` 側に保持する（コメント 1 行差のみ）。
- 既知の限界: bash 構文を完全解析しているわけではないため、特殊な heredoc（delimiter が変数展開、空白を含む等）は想定外。hook は fail-open のため、その場合でも **誤 block よりは通す** 振る舞いになる。

### 教訓

1. regex ベースの hook は bash 構文を完全解析できないため、**「実行される部分だけを見る」前処理**が必要。
2. heredoc を含む複雑な 1 行コマンド（特に commit message 生成）は、`git commit -F /tmp/<msg>.txt` のように分離するとさらに安全。

### 関連

- 関連仕様: `docs/cursor-hooks-design.md`（誤検知履歴）
- 関連ルール: `AGENTS.md §52-8 / §52-8-1`

---

## TSB-023 — kintone MCP `kintone-add-app` 直後の「未公開？」が冗長（2026-04-26）

### 事象

PC 台帳 Day4 Step1 で MCP `kintone-add-app` 実行後、ブラウザの **`/k/<新appId>/`** やスペース 21 のアプリ一覧に **新アプリが見えず**、**「まだ公開していないのでは」**という認識になった。

### 根本原因（真因 1 文）

**`kintone-add-app` はプレビュー（pre-live）にアプリを作るため、初回 `kintone-deploy-app` までライブ REST・レコード URL が空に見えるのが正常挙動なのに、その前提がドキュメント化されておらず、AI が浜田へ冗長確認するしかなかった。**

### 対策（恒久）

1. **正本**: `docs/plans/2026-04-26-pc-ledger-day4-action.md` に **「AI 引継ぎ: kintone-add-app 直後に…」** 節を追加（REST 手順・`thread` 非対応・`revision-snapshot` のプレビューフォールバック）。
2. **スターター**: `chat-sessions/NEW-SESSION-STARTER.md` **v3.8** で要約＋上記への誘導。
3. **復元**: `chat-sessions/checkpoint-latest.md` に **「セッション切替後の自律復元」**（Read 順）を追加。
4. **索引**: `RULES-INDEX.md` に **「セッション切替・文脈復元」** 表を追加。
5. **引き継ぎルール**: `.cursor/rules/session-handoff.mdc` に **手順 6（自律復元）** を追加。
6. **スクリプト**: `scripts/revision-snapshot.mjs` がライブ 404 時に **プレビュー API**へフォールバック（`preview_environment_only`）。

### 教訓

1. **浜田へ聞く前に** `GET /k/v1/preview/app/settings.json?app=<id>` の `name` と MCP 戻り値 `app` で事実確認する。
2. **MCP スキーマ**は `thread` を持たない。掲示スレッドは **手動**前提を計画に書く。
3. **セッション切替**ごとに同じ説明を繰り返さないよう、**索引 1 行**から正本へ飛ばす。

### 関連

- 正本（詳細）: `docs/plans/2026-04-26-pc-ledger-day4-action.md`（AI 引継ぎ節）
- 索引: `RULES-INDEX.md`（セッション切替・文脈復元）
- 当日ログ: `chat-sessions/2026-04-26-pc-ledger-day4.md`

---

## TSB-024 — AI が浜田にデプロイ等 Tier B 実行を委ねるアンチパターン（2026-04-26 19:20 検出）

### 事象

新・PC 台帳 v1 の §4.4 仕様揃え修正（`customize/new-pc-ledger-v1/desktop.js`）後、AI が回答末尾に「**デプロイ: 674 にこの JS を載せている場合は、いつもどおり再デプロイしてください。`deploy:674` 用スクリプトがなければ手動アップロードで問題ありません。**」と書いて締めた。浜田の指摘 ×2 で訂正し、AI 自身で `npm run deploy:674` を新設＋実行＋検証した。

### 根本原因（真因 1 文）

**会話要約（context summary）で `AGENTS.md §35-1` / `§56-1a`（=「開発は AI・確認は浜田・逆転禁止」）が脱落し、引き継いだ AI が「コード変更 = AI / 反映実行 = 浜田」という誤った分担を再構築してしまった**（`checkpoint-latest.md` `RULES-INDEX.md` `NEW-SESSION-STARTER v3.13` には明記されていたが、要約段階で削られた）。

### 対策（恒久）

1. **TSB（本条）**: 引き継ぎ要約から落ちないよう、アンチパターンを「絶対やらない例文付き」で記録する。
2. **NEW-SESSION-STARTER v3.18**: 文書の **最上段**（v 番号より上）に **🚨 憲法級ブロック**を新設し、`AGENTS.md §35-1 / §56-1a` を 5 行で再宣言＋禁句サンプル（「再デプロイしてください」「手動アップロードで問題ありません」「`npm run xxx` を実行してください」）を列挙。Desktop 緊急用 `.txt` も `npm run session-starter:sync-desktop` で同期。
3. **SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 7**: チャット報告 6 項目に **「(7) 役割宣言: deploy / apply / push / 検証は AI 自身が実行する。浜田には GO と目視確認のみ依頼する」** を追記。AI は新セッション 1 ターン目でこれを声に出して引き継ぎ完了の証跡にする。
4. **handoff-log.md**: 本件を「禁句アンチパターン」として記録（次の AI が末尾 3 件読みで必ず触れる）。
5. **機械ゲート（2026-04-26 夜追補 + 2026-04-28）**: `scripts/verify-constitution-handoff.mjs` → `npm run smoke:quiet` **第 9 検査**（必須フレーズ欠落で即 ng）。`handoff-log.md` に HTML コメント **アンカー**（要約で消えにくい）。`.cursor/rules/constitution-handoff-gate.mdc`（`alwaysApply: true`）で毎ターン想起。**加えて** `scripts/mandatory-read-gate.mjs` を **`npm run verify:mandatory-read-gate`** および `session:bootstrap` の憲法 verify **直後**に組込（**第 10 検査**／checkpoint **最終更新**・handoff 見出し・`HANDOFF-HUMAN` テンプレ・`SESSION-BOOTSTRAP` 冒頭・`AGENTS.md` 最小サイズで、議論だけでは防げない **未読了進行を exit 2**）。
6. **光速 + commit 後（2026-04-26 深夜追補）**: `session-bootstrap-verify.mjs` が **smoke の前に** `verify-constitution-handoff` → **`mandatory-read-gate`** を単独実行（長い smoke を待たずに憲法欠落・必読正本欠落を即検知）。`git-hooks/post-commit` が **commit 直後**にも同スクリプトを実行しログ追記（憲法ドキュを誤削除して push する前にローカルで気づく）。

### 教訓

1. **「再デプロイしてください」「手動アップロードでも OK」は §35-1 違反**。`deploy:<appId>` が無いなら **AI が npm script を追加して**そのまま実行する。
2. **「動作確認だけ依頼」は OK**（ボタン表示・バナー・色味・UX）。「**コマンド実行を依頼**」は **NG**。境界を毎ターン意識する。
3. **要約耐性のあるルールは TSB 化する**: §35-1 は条文上「変更禁止」だが、conversation summarizer は重み付けに条文番号を渡せない。**禁句リスト形式**で書くと要約後も生き残りやすい。

### 関連

- 憲法: `AGENTS.md` §35-1（自律型エンジニアリング）/ §56-1a（開発と確認の絶対分担）
- 索引: `RULES-INDEX.md`「タスク開始時に必ず参照」表 / 「セッション切替・文脈復元」表
- 引き継ぎ: `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 / `.cursor/rules/session-handoff.mdc`
- 緊急用: `chat-sessions/NEW-SESSION-STARTER.md` v3.18（最上段 🚨 憲法級ブロック）
- 直近実例: `npm run deploy:674` 新設 commit `4e9a062`（事後対応）
- 機械検証: `npm run verify:constitution-handoff` / **`npm run verify:mandatory-read-gate`** / `npm run session:bootstrap`（smoke 内蔵・**10 検査**）

---

## TSB-026 — 機械的書換による「人間注意書き」の構造的消失（2026-04-29 07:15 検出 / 07:25 恒久対策）

### 事象

2026-04-29 朝、Phase B（並列発火事故の恒久対策）commit `59b4bab` の post-commit hook で **2 件の NG が同時検知**された：

1. **`verify:constitution-handoff` NG**: `chat-sessions/NEW-SESSION-STARTER.md` 冒頭 5200 文字に **`(7) 役割宣言`** needle が見つからない（`scripts/verify-constitution-handoff.mjs` line 47）
2. **`session-clock` NG**: `chat-sessions/SESSION-CLOCK.md` から「**2026-04-29（浜田 CIO）注意書き**」が**削除**され、開始時刻が `2026-04-28 21:29` に巻き戻っていた（私の編集ではない）

CIO の最初の仮説は「悪意ある書き換え／別経路ロールバック」だったが、`git log` / `git reflog` 調査で**両方とも設計上の構造バグ**と判明した。

### 根本原因（真因 1 文）

**機械的書換（編集の累積で冒頭が肥大化／`session:clock:set` の HEADER 全置換）が、人間が後から追加した「冒頭付近の見出し・注意書き」を物理的に押し出したり上書きしたりして、要約耐性ガード（needles 検査・運用注記）を構造的に失わせた**。

| 異常 | 機械的書換の仕組み | 失われたもの |
|---|---|---|
| 1. NEW-SESSION-STARTER 冒頭 | 私の累積編集（4/28 夜 CIO 体制 / 4/29 朝 5 強化要件 / 4/29 朝 sync→verify NG 例）で冒頭が **10396 文字に肥大化** | `(7) 役割宣言` が `line 110`（冒頭 5200 文字超）に押し出され、`verify` の needle 検査に引っ掛からなくなった |
| 2. SESSION-CLOCK.md 巻き戻り | `scripts/session-clock.mjs` の `writeClock()` (line 45-58) が **`HEADER + 開始:` で全文置換**する設計。HEADER 定数に「2026-04-29 浜田 CIO 注意書き」は含まれていなかった | `npm run session:clock:set` を呼ぶたび、ファイル本文に追記された人間注意書きが**自動削除される** |

### 対策（恒久）

1. **異常 1 の対策（NEW-SESSION-STARTER 冒頭）**:
   - **`(7) 役割宣言` を冒頭 (line 24 周辺)** に短い 1 行要約として**永続追加**（既存 line 110 のコードブロック自己宣言は後方互換で残置）
   - **運用ルール**: 今後 NEW-SESSION-STARTER.md 冒頭に大きなブロックを追加するときは、**`verify:constitution-handoff` の needle 検査位置（冒頭 5200 文字）に重要 needle が残っているか**を必ず確認する
   - **将来検討**: `verify-constitution-handoff.mjs` の `headChars: 5200` を実態に合わせて引き上げ（現状 5200 でぎりぎり、6500 程度が緩衝）。本 TSB では運用解で対応し、閾値変更は §57 改定に委ねる

2. **異常 2 の対策（SESSION-CLOCK.md HEADER 全置換）**:
   - **`scripts/session-clock.mjs` の `HEADER` 定数に「2026-04-29 浜田 CIO 注意書き」を永続化**：set 実行時の HEADER 全置換でも自動復元される
   - **HEADER 内に明示**：「人間注意書きの追記はここ（scripts/session-clock.mjs の HEADER 定数）に行うこと」と HEADER 自身に書き込み、次の AI/人間が `SESSION-CLOCK.md` 本文に追記しないよう誘導
   - **本質的設計原則**: `set` で全置換されるファイルは、本文に人間注記を置かず、**スクリプトの HEADER 定数を正本**とする

3. **検証（憲法適合済み）**:
   - `npm run verify:constitution-handoff` → exit 0 ✅
   - `npm run verify:mandatory-read-gate` → exit 0 ✅
   - `npm run session:clock:set` 実行 → SESSION-CLOCK.md HEADER に注意書きが**自動復元**されることを実機確認 ✅

### 教訓

1. **「冒頭 N 文字の needle 検査」は冒頭の物理位置に依存する**。文書を肥大化させるときは、`verify` 検査位置の維持を**機械的に意識**しないと silent fail する（commit は通り post-commit hook で警告のみ）。
2. **「全置換書込スクリプト」は人間追記を構造的に失わせる**。書込先のファイル本文に人間注記を置かず、**スクリプトの HEADER 定数（コードレビュー対象）を正本**とせよ。
3. **異常検知時に「悪意ある書換」「別経路ロールバック」を仮説の最初に置かない**。まず `git log -p` / `git diff` / 関連スクリプトの書込ロジックを **読んで事実確認**する（§47-E 事実歪曲禁止の応用）。CIO は本件で「謎の改変」と最初書いたが、20 分の調査で**設計バグ**と判明した。

### 関連

- 憲法: `AGENTS.md` §35-1 / §56-1a / TSB-024（要約耐性 4 点ガード）
- 検証スクリプト: `scripts/verify-constitution-handoff.mjs` (line 40-50 needles) / `scripts/session-clock.mjs` (line 32-41 HEADER) / `scripts/lib/session-clock-core.mjs` (parseClock)
- 当該 commit: `59b4bab`（事象検知）/ Phase B 復元 commit（本 TSB と同 commit で push 予定）
- 索引: `RULES-INDEX.md`（更新予定）/ `chat-sessions/NEW-SESSION-STARTER.md` line 24 周辺（冒頭永続化）
- 関連: TSB-024（要約耐性アンチパターン）/ TSB-016（BREAKING 削除が無自覚に undone）— 「機械的書換で人間制御が失われる」共通系列

---

## TSB-028 — Windows Cursor の `mcp.json` が WSL 正本とズレて MCP 全赤化（2026-05-01 検出 / 同日 恒久対策）

### 事象

Windows 上の Cursor の MCP 一覧で **filesystem / kintone-space / markdownify** などが **赤（Error）**。一方 WSL で `npm run health-check` は緑。

### 根本原因（2 層）

1. **二重ファイル**: Cursor（Windows）は `C:\Users\<user>\.cursor\mcp.json` を読むが、作業正本は WSL の `~/.cursor/mcp.json` にあり、**手編集・別ツールで片方だけ更新**されると定義が食い違う。
2. **誤生成バグ**: WSL→Windows 同期を試みたスクリプトが **`filesystem` の `command` に `args[0]`（`-y`）を代入**し、`command: "-y"` になった。あわせて **`/mnt/c` / `C:\` / `/home` が混在**し、Windows ネイティブの `npx` 系 MCP が起動不能になった。
3. **起動形態**: `kintone-space` を **`wsl -e node` のみ**にすると、Cursor の `env` が子 `node` に届かず認証失敗しうる。**`markdownify`** は Windows の古い `node` で `npx` が落ちうる。

### 恒久対策

1. **正本**: **`~/.cursor/mcp.json`（WSL）**のみを人間・CIO が編集する。Windows 側は **生成物**とみなす。
2. **同期**: `npm run mcp:sync-cursor-windows`（`scripts/sync-cursor-mcp-windows-from-wsl.mjs`）で Windows `mcp.json` を **常に同じ変換規則**から再生成する（バックアップ `.bak-<timestamp>` 付き）。
3. **検証**: `npm run verify:cursor-mcp-windows`（`scripts/verify-cursor-mcp-windows.mjs`）で **`filesystem.command === "npx"`**、パスが **Windows ドライブ形式**、`kintone-space` が **`bash -lc`** 等を機械判定。
4. **運用フック**: `npm run desktop:sync-and-verify` と **`npm run session:bootstrap`** に **verify を組み込み**（`/mnt/c` 不在時は SKIP）。赤が出たらまず **`npm run mcp:sync-cursor-windows`** → Cursor **Reload Window**。

### 教訓

- **`mcp.json` の `command` と `args` を合成するときは `server.command` を正本にする**（`args[0]` を command にしない）。
- **WSL と Windows でパス体系が違う**ため、同期は **明示の変換関数**＋**検証スクリプト**のセットで持つ。

---

## TSB-029 — `user-markdownify`（`@iflow-mcp/markdownify-mcp`）が stdio で即終了（2026-05-01 検出 / 同日 恒久対策）

### 事象

Cursor の MCP ログで **`Connection failed: MCP error -32000: Connection closed`**。初期ログでは Windows の `npm-cache\_npx` 下で **`EPERM: operation not permitted, rmdir`**（掃除失敗）も混在した。

### 根本原因（真因 1 文）

**`package.json` に `"preinstall": "node preinstall.js"` がある一方、npm に公開されている tarball の `files` は `dist` のみで `preinstall.js` が同梱されておらず**、**ライフサイクルが必ず失敗するパッケージ状態**だった（`npm install -g` 既定・`npx` の展開経路で顕在化）。副因として **Windows ホストの `npx` とキャッシュロック**がログに出ることもある。

### 恒久対策（WSL 起動・CIO 実装済み）

1. **WSL 上で** `npm install -g --ignore-scripts @iflow-mcp/markdownify-mcp@0.0.2`（**`--ignore-scripts` 必須**）。
2. **`mcp.json` の `markdownify`**: `npx` を使わず、**`wsl.exe` + `bash -lc` + `exec env -i … /path/to/node …/node_modules/@iflow-mcp/markdownify-mcp/dist/index.js`** で起動（**`UV_PATH`** を `~/.local/bin/uv` 等で明示。**`PATH` は `env -i` 内で Linux のみ**）。
3. **NVM で Node を上げ替えたら**: グローバルパッケージの **`node` フルパス**が変わるため、**(a) 新 Node で `npm install -g --ignore-scripts …` を再実行**し、**(b) `mcp.json` の `node` パスを更新**（手順チェック: `checkpoint-latest.md` **「Markdownify MCP（NVM メンテ）」**）。

### 2026-05-02 追補（再発と硬化）

- **再発**: Cursor MCP ログで再度 **`MCP error -32000: Connection closed`**（`user-markdownify`）。**`C:\Users\<user>\.cursor\mcp.json`** の `markdownify` が **`npx -y @iflow-mcp/markdownify-mcp@latest` に戻っており**、本条の恒久対策と不一致だった。あわせて WSL 側で **グローバル `@iflow-mcp/markdownify-mcp` が未インストール**だと、`node …/dist/index.js` 直起動でも即死しうる。
- **WSL 正本の穴**: **`~/.cursor/mcp.json` に `markdownify` サーバ定義が存在しなかった**（Windows 側だけ定義され、同期・手編集で片側化しやすい）。**TSB-028** の「WSL を正本」と整合させるため、**WSL 用も `node` + `dist/index.js` + `UV_PATH`** で追加した。
- **リポ側の再発防止**: `scripts/sync-cursor-mcp-windows-from-wsl.mjs` が **`markdownify` を再び `npx` で生成**していたため **本条どおり `env -i` + `node` 直起動**に修正。`scripts/verify-cursor-mcp-windows.mjs` で **`npx @iflow-mcp/markdownify-mcp` を機械的に禁止**し、`env -i` と `dist/index.js` の存在を必須化した（`npm run verify:cursor-mcp-windows`）。

### 教訓

- **stdio が即死するときは「キャッシュ EPERM」だけに寄せず**、`npm pack` で ** tarball 中身と `package.json` scripts** を確認する。
- **`npx` 依存をやめ `node` 直起動**にすると、Cursor↔WSL 間の **PATH 汚染の影響を減らせる**。
- **Upstream の `preinstall` が直るまで `@latest` 追従は慎重に**（現状は **0.0.2 + ignore-scripts** を正とする）。

### 関連

- **TSB-028**（`mcp.json` 二重定義・同期）／`npm run verify:cursor-mcp-windows`／`npm run mcp:sync-cursor-windows`
- 正本（ユーザー環境）: **`C:\Users\<user>\.cursor\mcp.json`** の `markdownify` ブロック（リポ外。秘密はコミットしない）

---

## TSB-030 — GitHub Actions `security-next-kintone` / `security-next-daily-collect` が **GAIA_AP15**（403）で失敗（2026-05-02 検出）

### 事象

`gh run list` で **schedule** 実行の **security-next-kintone**（`analyze`）および **security-next-daily-collect**（`collect`）が **failure**。ログ例: run `25210258504` / `25210156439`。

### 根本原因（真因 1 文）

**GitHub Actions の Environment `kintone-collect` に設定された API トークンが、ワークフローがアクセスする kintone アプリ ID と一致しておらず**、`@kintone/rest-api-client` が **HTTP 403 `[GAIA_AP15] APIトークンとアプリ（id: …）の組み合わせが正しくありません`** で落ちている。

### 確認手順（浜田 / 管理者・リポ外）

1. GitHub → **Settings → Environments → `kintone-collect` → Environment secrets** で **`KINTONE_DOMAIN`** / **`KINTONE_APP`**（ニュース用アプリ ID）/ **`KINTONE_REPORT_APP_ID`**（レポート用）/ **`KINTONE_API_TOKEN_COLLECT`** / **`KINTONE_API_TOKEN_ANALYZE`**（および従来 **`KINTONE_API_TOKEN`** を使う場合）が **意図したアプリに対応しているか**を見直す。
2. kintone 管理画面で **各アプリの API トークン**を再発行し、**そのアプリ専用の権限**（`analyze` は 631 読取 + 632 書込の二系統）に合わせて Secret を更新する（詳細は `security-next-automation/src/lib/config.ts` のコメントと `.github/workflows/main.yml` の `env:` ブロック）。
3. 修正後 **`workflow_dispatch`** で `security-next-kintone` の **collect / analyze** を手動再実行し **success** を確認する。

### 恒久対策（コード側の補助）

- 本 TSB を索引に残し、**失敗ログに GAIA_AP15 が出たら Secret 見直しを最優先**とする（READ-07「GitHub のワークフローでエラーが出ていたら速やかに直す」と整合）。

### 教訓

- **403 GAIA_AP15 は「REST のバグ」ではなくトークンとアプリの組み合わせ不一致**がほとんど。CI の赤は **まず Secrets とアプリ ID**。
- **Environment secrets と Repository secrets の取り違え**でも `env` が空になりうる（ワークフロー内の `::error::` メッセージ参照）。

### 関連

- `.github/workflows/main.yml` / `.github/workflows/daily-collect.yml` / `security-next-automation/`

---

## TSB-031 — Desktop 上のセッション日報を Git 未収容のまま削除しリポから復元不能にした（2026-05-04 検出 / 同日 恒久対策）

### 事象

`C:\Users\mhamada202408224\Desktop\AI緊急用\` にあった **`SESSION-DAILY-REPORT_20260503.txt`**（長文セッション日報）を、**リポジトリの `chat-sessions/` に一度もコミットしていない状態**で削除した。Git 履歴が無いため **リポからの復元は不可**（残るとすれば **端末のゴミ箱のみ**）。

### 根本原因（真因 1 文）

**正本を Desktop のみに置いた状態で「古い」「整理」とファイル削除を同一判断にし、復元経路（Git／バックアップ）を確認せず実行した**ため、組織の証跡がチャットとリポの両方から失われた。

### 恒久対策（憲法・運用）

- **`AGENTS.md` §35-6**（セッション成果物の削除と「古い」整理のゲート）を制定: 削除前に **対象パスと復元手段**を一文で述べ、**浜田の明示承認または §41 一問**。ミス発覚時は **リカバリを浜田と相談**。
- **`SESSION-DAILY-REPORT_*.txt` の正本は `chat-sessions/` に置きコミット**し、Desktop は **`npm run session-starter:sync-desktop` による控え**とする。
- **実行前チェック**: 削除・正本移動の前は **§50-3-8 または DeepSeek／Kimi** を原則スキップしない（手順に復元経路がある掃除のみ例外）。
- **機械ガード**: `npm run verify:constitution-handoff` が **`AGENTS.md` 本文・`docs/troubleshooting.md` の本条・`SESSION-BOOTSTRAP-CHECKLIST.md`・スターター冒頭**に §35-6／TSB-031 のキーワードが残ることを検査する。

### 教訓

- **Desktop はバックアップ装置ではない**（同期スクリプトや手整理で消える）。
- **「古い」は削除命令ではない**。長文ログ・日報・HANDOFF は **正本の置き場所を先に決めてから**整理する。

### 関連

- `chat-sessions/SESSION-DAILY-REPORT-20260504.txt` §5（経緯・反省の詳細）
- `RULES-INDEX.md` §35 行（§35-6 索引）

---

## TSB-032 — `constitution-gates` CI が `.cursor/rules/constitution.mdc` 欠落で `verify-constitution-handoff` 連続 failure（2026-05-06 検出 / 同日 恒久対策）

### 事象

`mhamad4968/GitHub-Actions` の **`constitution-gates`** workflow（`push` → `main`）が **`node scripts/verify-constitution-handoff.mjs`** で **exit 2**。ログ例: **`constitution-mdc-thin-policy: missing file: .cursor/rules/constitution.mdc`**。

### 根本原因（真因 1 文）

**`verify-constitution-handoff.mjs` は網羅版 `.cursor/rules/constitution.mdc` の存在と先頭 needle を要求するが、同パスは `.gitignore` によりリポに含まれず checkout では常に欠落する**ため、runner 上では検査が成立しない。

### 恒久対策

1. **`.github/workflows/constitution-gates.yml`** の **`verify-constitution-handoff` 直前**に **`bash scripts/regenerate-constitution-rule.sh`** を追加し、**runner 内のみ** `constitution.mdc` を生成してから検証する（**常時想起の正は `constitution-brief-card.mdc`**。網羅版は **必要時 Read / ローカル regen** の運用は不変）。
2. **`on.push.paths`** に **`scripts/regenerate-constitution-rule.sh`** を追加し、スクリプト変更時も workflow が走るようにする。

### 検証

- ローカル: **`rm -f .cursor/rules/constitution.mdc && bash scripts/regenerate-constitution-rule.sh && node scripts/verify-constitution-handoff.mjs`** → **exit 0**。
- GitHub: push **`ad14c15`** 後の run が **`completed` / `success`**（`constitution-gates`）。

### 教訓

- **gitignore された生成物を verify が前提にする場合、CI では生成ステップを明示する**（「ローカルではあるが CI では無い」系の落とし穴）。
- **薄型カードと網羅版の役割分担**（`NEW-SESSION-STARTER.md` 冒頭記載）を崩さず、**CI だけ生成コストを払う**のが安全。

### 関連

- `.gitignore`（`.cursor/rules/constitution.mdc` 行）
- `scripts/regenerate-constitution-rule.sh`
- `commit ad14c15`（workflow 変更）

