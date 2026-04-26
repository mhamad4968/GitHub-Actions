━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 憲法級（要約耐性ブロック） / 2026-04-26 v3.18 / TSB-024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**役割分担は逆転禁止**（`AGENTS.md` **§35-1** / **§56-1a** / RULES-INDEX 1 行目級）:

- **開発 = AI**: 設計・実装・テスト・**デプロイ実行**・lint・push・kintone API 書込・revision-snapshot・apply-labels・customize 反映・検証コマンドの実行と結果確認・再試行
- **確認 = 浜田**: GO（承認）/ 仕様判断 / 最終検収（ボタン表示・バナー・UX の目視チェック）

**🚫 AI が絶対に書いてはいけない禁句（TSB-024 / 引き継ぎ要約からも落とさない）**:

- 「再デプロイしてください」「アップロードしてください」「適用してください」
- 「`npm run xxx` を実行してください」「`git push` してください」
- 「手動アップロードで問題ありません」「いつもどおり浜田さん側でお願いします」
- 「コマンドだけお願いします」（コマンド実行依頼は §35-1 違反）

**✅ 正しい締め方の例**:

- 「`npm run deploy:674` まで実行し、live revision=9 を確認しました。ブラウザで以下の表示確認だけお願いします: ...」
- 「`npm run pc-ledger:apply-labels` 実行 → 35 fields OK。kintone 画面で短文ラベルが反映されているかだけ目視ください。」

**境界（迷ったら）**: コード書く・コマンド打つ・API 叩く・結果検証する → **全部 AI**。仕様の最終判断・GO・画面の目視 → **浜田**。`deploy:<appId>` が package.json に無いなら **AI が追加して使う**（依頼しない）。

**新セッション 1 ターン目の自己宣言**（フェーズ 7 報告テンプレ §7 / 漏れ防止）:

```
(7) 役割宣言: deploy / apply / push / 検証コマンドの実行は私（AI）が行います。
    浜田には GO と画面目視の確認のみ依頼します（§35-1 / §56-1a / TSB-024）。
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
新チャット起動の儀式 / 2026-04-23 制定 (v3 / 全面リライト)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

このファイルの中身を新しい Cursor チャットにそのまま貼るだけで、
AI がゼロから今までの文脈を完全復元する。

**浜田が毎回最初に開く場所（運用上いちばん大事）**: `C:\Users\mhamada202408224\Desktop\AI緊急用\NEW-SESSION-STARTER.txt`（メモ帳）。ここが **最優先で最新**になるよう、AI は本ファイルを編集して **push する同一ターン**で必ず **`npm run session-starter:sync-desktop`** を実行する（浜田依頼）。**リポだけ更新して Desktop を古いままにしない**。
Git 上の編集正本: `kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md`（差分・履歴用。`.md` と `.txt` は自動同期しないため、上記 npm が橋渡し）。`/mnt/c` が無くコピーできないときはチャットに「AI緊急用の .txt は未更新（理由）」と 1 行書き、環境復帰後に npm を再実行する。

v2 (2026-04-19) からの主な強化:
- 主タスク: SKYSEA → 新・PC 台帳 ver.1 (4/24 環境設定マスタ Day 1)
- ルール追加: §47-A / §47-B-2 / §47-C / §50 / §50-2 / §51 / §51-2 / §11-5 / §17-2 / §17-3
- 新ツール: jq / ripgrep / uv 0.11.7 / gh 2.91 / git 2.54
- 自動化基盤強化: 8 cron + file-watcher 21 ファイル監視
- MCP 16 件 (active 13 + skip 3 / google-search → duckduckgo-search 入替済 / Chrome 147 + libnspr4 等 sudo install 済)

v3.1 (2026-04-25) 憲法・並列防御（緊急用メモ同期 / Desktop 控えと常に同内容）:
- §47-D **矛盾指示は却下**（折衷・部分着手禁止。浜田が「却下して叱って」と明示）
- §47-E **憲法違反指示も却下**（ルール改定の明示がない限り。改定なら §54-1 BREAKING 手順へ）
- §51-3 **並列セッション対策**: 憲法ファイル（AGENTS.md 等 5 件）を編集する前に  
  `node scripts/session-lock.mjs acquire --manual --holder=<作業ID>` → 完了後 `release`
- **K-3**: `npm run watcher:start` で `file-watcher.mjs` 常駐推奨。憲法 5 ファイルの SHA256 変化は  
  `logs/file-watcher/agents-md-changes.jsonl` に記録。**watcher または file-watcher.mjs を更新したら必ず**  
  `npm run watcher:stop && npm run watcher:start`（古いプロセスのまま K-3 が無効なことがある）
- 朝〜作業前の一発確認: `npm run smoke`（**7 検査** = guard + 4 audit + health + rule-watcher）
- 参考: `docs/troubleshooting.md` **TSB-017**（別 Cursor セッションによる並列編集インシデント）

v3.2 (2026-04-26) Composer 2 silent fallback 防御 + §57 改定プロセス:
- §1-2-2 **API 制限到達時の自動フォールバック禁止**（N-3 / TSB-018）  
  → `Switched to (Composer|Sonnet|GPT|Gemini|Auto) ...` 検知で **即作業中断 + 浜田報告**（§47-E 連動）
- §57 **憲法改定プロセス**（N-2）= §54-1（ラベル）と §57（手順）の役割分担。  
  改定は §57-1 提起 → §57-2 起案 → §57-3 ラベル決定 → §57-4 適用（並列禁止 / ファイル編集順序）→  
  §57-5 検証（audit-rules + audit-tsb + verify-breaking + audit-xref + health-check + smoke-test）→  
  §57-6 周知（changelog + NEW-SESSION-STARTER + CURSOR-トラブル対応メモ + 浜田 Desktop 同期）
- npm scripts 別名追加: `npm run audit:rules` / `npm run health-check` / `npm run smoke-test`

v3.3 (2026-04-26 07:05) Cursor Ultra クレジット予算管理（O-series / 浜田「甲：フル実装」承認）:
- §1-2-2 **N-4 強化**: Composer 2 検知時の **4 択 A-D 提示**（A=On-Demand 継続 / B=停止 / C=BYOK / D=その他）  
  + §1-2-2-1 Cursor IDE 必須設定（**On-Demand ON + Spend Cap $130 = ¥20,000**）
- §1-2-3 **Opus 内モデル使い分け**（N-5）: 既定 **Extra High**（cost 1/3-1/5）/  
  **Max Thinking** は §47-A 100% 証明・設計判断・複雑バグ修正・TSB 真因究明・憲法改定起案のみ  
  → タスク開始時に AI が判定 / Max Thinking 切替時は理由 1 行明示
- §1-2-4 **クレジット予算管理**（N-6）: 月予算 L1 $400 + L2 $130 = **$530**  
  → 1 日 1 回 30 秒で `npm run credit:set <pct>` / 70-85-95-100% 4 段階自発警告  
  → 朝報 §0a に「直近% / 残日数 / 想定枯渇日 / AI 助言」を常時表示  
  → 役割分担: AI が予測・記録・警告・ルール維持 / 浜田は %貼付 + Cursor 設定変更 + 支払い
- npm scripts 追加: `npm run credit:set` / `npm run credit:status` / `npm run credit:reset`
- 実装: `scripts/credit-budget.mjs` + `data/credit-usage.json` + `daily-morning-prep.mjs §0a` 統合

v3.4 (2026-04-26 07:55) Cursor IDE Auto-Run + RACI bypass 防御（Q1 / TSB-019 連動）:
- **発見**: §1-2-2-1 設定検証中に Cursor IDE Settings → Agents タブで `Auto-Run Mode = Run Everything (Unsandboxed)` + `Browser Protection: OFF` + `MCP Tools Protection: OFF` 三重 OFF を発見  
  → §52 RACI Tier B (kintone 本番 API 等) が **IDE レベルで構造的 bypass されていた憲法違反級 silent breach**
- **暫定対処（浜田 07:48 実施）**: Auto-Run Mode 維持（基本自律 + 都度承認回避）/ **Browser Protection: ON + MCP Tools Protection: ON ⭐**  
  → kintone MCP 経由の本番 API 書込が承認ゲート復活
- **§1-2-2-1 拡張**: 4 → 8 項目 (A 課金 / B Models / C Agents / D Cloud Agents)
- **§52-8 新設**: 高リスク shell 暴走防止 = `rm -rf` / `git push --force` / `npm install` (新規) / `chmod -R` / `sudo` / `.env` 編集 等は **事前報告 → 浜田 GO 待ち** 必須  
  例外: 読取系 (`ls`, `cat`, `grep`) / 既知 npm スクリプト (`npm run smoke` 等) / git 安全 (`git status/log/diff/add/commit/push origin main`)
- **TSB-019 起票**: 真因 + 暫定対処 + 恒久対処 + 教訓 5 件 (詳細は `docs/troubleshooting.md`)
- **後続**: Q-series 包括 Cursor 設定監査（残 5 タブ Hooks / Tools & MCPs / Rules-Skills / Indexing / Plan & Usage）= PC 台帳完了後

v3.5 (2026-04-26 08:25) §51-4/§51-5 並列セッション疑い 4 軸機械判定（P4）:
- **§51-4 制定**: 並列セッション疑いを **4 軸 + スコア** で機械判定（AI 個別判断 → 客観基準）  
  軸1: watcher_pid 不一致 +5 / 軸2: 同一ファイル 5 分以内 5+ 件編集 +2 / 軸3: session-lock 不在編集 +3 / 軸4: 不審バックアップ +4  
  閾値: 0-2 静穏 / 3-4 注意 / 5-6 警報 (作業中断 + 浜田 GO 待ち) / 7+ 確定 (即 abort)
- **§51-5 制定**: 警報以上で `logs/parallel-suspicion/<JST>-score<N>.json` に snapshot 保全  
  誤検知は `--ignore-suspicion=<reason>` で `false-positive.jsonl` に履歴化
- **実装**: `scripts/parallel-session-detector.mjs` / `npm run audit:parallel` (= `audit:parallel:json` / `audit:parallel:explain`)
- **統合**: smoke-test 第 8 検査として組込（3-4 点 = warn / 5+ 点 = ng）+ 朝報 §5-5 末尾に detector 結果統合
- **AI 開口一番ルール**: 起動時に `npm run audit:parallel` で 0 点 (🟢 静穏) を確認 / 3+ 点なら浜田に即報告

v3.6 (2026-04-26 08:45) §52-8-1 物理 block 層 / TSB-019 構造的根本対策（P5-1 / R1）:
- **§52-8-1 制定**: §52-8 高リスク shell を **OS レベル物理 block** = 三層防御確立  
  第 1 層 AI 自己制約 (§52-8) + 第 2 層 IDE ゲート (§1-2-2-1 #6/#7) + **第 3 層 物理 block (本条 = §52-8-1)**
- **実装**: `~/.cursor/hooks.json` に `beforeShellExecution` フック追加 + `~/.cursor/hooks/dangerous-shell-blocker.sh` 新規  
  Cursor IDE が `Rejected: Command execution was blocked by a hook` を表示 = AI が承認なしで実行不可
- **deny カテゴリ**: rm -rf (絶対パス/危険ターゲット) / git 破壊系 (push --force / reset --hard / rebase 等) / chmod -R / sudo / docker rm / kubectl delete / .env 編集 / mcp.json 編集 / SSH 鍵 / **Hooks 自身の改ざん防止** ⭐
- **allow カテゴリ**: 読取系 / 既知 npm スクリプト / git 安全 / session-lock / 単発検証
- **block 時 AI 動作**: 即 浜田に「§52-8 物理 block 検知」を報告 → GO 待ち / 誤検知なら §57 改定プロセスでパターン緩和提案
- **構造的盲点**: hook は shell のみ → StrReplace 経由の hooks 改ざんは対象外 → §52-8 第 1 層で「hooks 編集前は浜田 GO 必須」を内在化
- **設計仕様書**: `docs/cursor-hooks-design.md` (hooks.json 全文 / blocker.sh 全文 / 検証 11 件 / 復旧手順)
- **検証**: 単独テスト 10/10 + Cursor IDE 経由 `rm -rf /tmp/<not-exist>` 実証 = 物理 block 動作確認済

v3.7 (2026-04-26 09:55) Cursor Plan & Usage 監査 + 節約パッケージ全実施（P5-5 / S1-S5）:
- **発見**: Spending タブで On-Demand $235.94 / $300 (78.6%) + API 100% 枯渇 + Cursor IDE 側に 70/85/95% 警告 UI なし  
  → 4/29-5/3 頃 $300 突破見込み = **3 重大発見 F-11/F-12/F-13**
- **§1-2-3-1 制定（AI 自己宣言義務）**: タスク冒頭で必ず `[§1-2-3 ティア判定: Extra High/Max Thinking]` を 1 行明示 + 根拠 1 行  
  Max Thinking で実行中に「これはルーチン」と気付いたら自発的に「Extra High に切替を」と通知（= F-13 形骸化対策）
- **§1-2-4 改定**: 月予算 L1 $200 + L2 **$1000 引上げ**（旧 $130）= Worst $1200/¥186,000 / 節約後 $430-500/¥66,000-78,000  
  3 系統 (Total% / API% / On-Demand $) / 70-80-85-95-100% 5 段階警告 / 朝の Spending スクショ抽出 必須化  
  API 系統 100% 単独到達 = §1-2-2 連動（Composer 2 fallback トリガ）
- **§51-6 制定（セッション分割推奨）**: 朝 06-10 / 昼 12:30-17 / 夜 19-22 で chat session 区切り推奨  
  同セッション 4h or 200 tool call 超で AI 提案 / PC 台帳 deploy 等 不可逆操作直前は必ず新セッション  
  §51-3 並列禁止と補完関係 = 時間軸分割は推奨（F-13 教訓 = 連続 6h 稼働で API 12 日完全枯渇）
- **節約パッケージ S1-S5**: S1 ルーチン Composer 2 許容 / S2 CLAUDE.md 整理（要浜田判断） / S3 Extra High 既定徹底 / S4 session 区切り / S5 .cursorignore 強化（snapshot/archive 追記 → 109 行）
- **TSB-021 候補**: credit-budget.mjs に On-Demand 取得機能追加（Day 5-6）
- **浜田操作**: Cursor IDE Settings → Spending → Monthly Limit を **$300 → $1000** へ引上げ済  
  Models タブの Extra High 既定切替（S3 反映）も実施推奨
- **logs/autonomy-decisions/P5-5-plan-usage-2026-04-26.md** に詳細記録

v3.8 (2026-04-26) kintone MCP `kintone-add-app` とプレビュー／本番の見え方（Day4 教訓）:
- **AI は浜田に「まだ公開？」を先に聞かない**: 本条 + `docs/plans/2026-04-26-pc-ledger-day4-action.md` の **「AI 引継ぎ: kintone-add-app 直後に…」** を読む。  
- **事実**: `add-app` 直後は **プレビュー先行** → ライブ `app.json` は **404 になりうる** / `/k/<id>/` やスペース一覧に **出ないことがある**（正常範囲）。確認は **`GET /k/v1/preview/app/settings.json?app=<id>`** の `name` と MCP の `app`。  
- **MCP 制約**: **`thread` は渡せない**（`name` + `space` のみ）。defaultThread 23 は **手動**。  
- **snapshot**: `revision-snapshot.mjs` は未デプロイ IDで **プレビューにフォールバック**（`preview_environment_only`）。

v3.9 (2026-04-26) セッション切替でも文脈を失わない（浜田「自律的に引き継ぎ」）:
- **新チャット初手の Read 順**は `chat-sessions/checkpoint-latest.md` の **「セッション切替後の自律復元」** を正本とする（checkpoint → 本条 v3.8+ → `handoff-log` 末尾 → Day4 plan → `RULES-INDEX` 索引行）。  
- **TSB-023**: `docs/troubleshooting.md`（冗長な「未公開？」確認の根絶と索引化）。

v3.8 (2026-04-26 10:13) S2 / B+: CLAUDE.md thin 化 + .cursorignore 追加（commit 046ec2d）:
- **CLAUDE.md**: 480 行 / 54.6 KB → 73 行 / 4.15 KB（**92.4% 削減**）= Cursor Composer から実質遮断
- **.cursorignore**: CLAUDE.md を index 除外（109 → 117 行）= semantic search で引かれる ~13K tokens を完全節約
- 残置内容 = Claude Code (ターミナル CLI) 特化 = Implementation Starter コピペ + Schema Retrieval Strict + 行末コード保持原則 + 黄金サイクル骨子
- **節約効果**: 1 セッション ~13K → ~700 tokens (94%) / 月 ~369K tokens 節約見込
- 旧版復元 = `git log --follow CLAUDE.md` で 046ec2d 以前を取得可能

v3.9 (2026-04-26 10:30) R-3 / v23.16: §1-2 改定「最適モデル原則」+ §1-2-3-2 新設「AI 自律モデル選択」（commit 92b89d5）:
- **発端**: 浜田 10:22「使うモデルは一番最適な方法で行ってほしい。絶対にこのモデルを使うというこだわりはしない。適時 AI 側で判断してほしい」+ Billing スクショで **F-14 確定** (Max Thinking 59.4% / Extra High 40.8% / Composer 2 等 0.6%)
- **§1-2 改定**: 「単一モデル / Opus 4.7」→ 「**最適モデル原則 / Opus 4.7 デフォルト枠**」へ転換。「こだわらない」の意味を 3 行で具体化
- **§1-2-3-2 新設（AI 自律モデル選択）**: 3 段階表 (L1 Composer 2 / L2 Extra High / L3 Max Thinking) + 1 秒判定フロー (単純→L1 / 不可逆→L3 / 既定→L2) + 安全弁 4 項 + 運用例 6 件 (commit→L1 / 監査続き→L2 / Day N deploy→L3) + 期待効果 (Max Thinking 59.4%→20-30% / Composer 2 0.6%→30-40% / API token 1/2-1/3)
- **silent fallback と区別**: AI が事前明示で Composer 2 選択 (= 健全) ≠ Cursor IDE が裏で自動切替 (= §1-2-2 違反 / 4 択提示必須)。**ティア宣言が両者を区別する証跡**
- **data/credit-usage.json 更新**: budget_usd_total 530 → 1200 / l1 400 → 200 (Ultra 月額) / l2 130 → 1000 (On-Demand) / 4/26 record = Total 45% / On-Demand $241.34 / $1000

v3.10 (2026-04-26 10:35) R-4 + R-5 / v23.17: §51-6-2 + §52-9 新設（commit 同 v23.17）:
- **発端**: 浜田 10:30「セッションを切ることは重要 / 命令指示権限を与える」+「ミスや発見があれば即座にこちらに確認しないで進めてよい」
- **§51-6-2 制定（AI 自律セッション切り命令権 / R-4）**: §51-6 の「提案」を「命令」に昇格。6 つの自律発動条件 (4h / 200 tool call / 重作業完了直後 / コスト 2x / Tier B 直前 / API 100%)。命令文言 = `[§51-6-2 命令発動] 発動条件 / 理由 / 命令 / 引き継ぎ`。浜田却下時は §47-D で逆却下。
- **§52-9 制定（Tier A 範囲ミス発見時の自律修正権 / R-5）**: §52-4 Conservative Default の **能動的反対側補完**。適用範囲 = Tier A のみ即修正可。絶対対象外 = Tier B / §52-8 / §57 / scope 外 / Cursor IDE 設定変更。完了報告 + `logs/autonomy-decisions/auto-fix-*.md` 事後トレース義務。
- **PC 台帳 Day 4 時刻シフト**: 13:00 → **20:00** (浜田指示 / R-3/R-4/R-5 案件継続中の慎重進行優先 / §51-6 夜セッション帯と整合 / Day 4 着手前は §51-6-2 で必ず新セッション)

v3.11 (2026-04-26 12:20) §0 定義 + TSB-022 追記 + 日次ログ整備:
- **§0 定義（audit-rules 破断解消）**: `AGENTS.md` に **§0 RULES-INDEX 即答カード参照**を追加 + `kintone-ai-lab/RULES-INDEX.md` に §0 行を追加（索引駆動の入口を明文化）
- **TSB-022（Hooks / heredoc 誤検知）起票＋恒久案追記**: `docs/troubleshooting.md` + `docs/cursor-hooks-design.md`（deny 判定前に heredoc 本文 strip / 限界=bash完全解析不可 / fail-open）
- **日次**: `kintone-ai-lab/chat-sessions/2026-04-26.md` 作成 + `kintone-ai-lab/chat-sessions/checkpoint-latest.md` 最終追記
- **機械監査（ローカル）**: `npm run verify:all` + `npm run smoke:quiet` = ✅

v3.12 (2026-04-26) 人間5行引き継ぎ + AI 追記義務:
- **浜田**: `chat-sessions/HANDOFF-HUMAN.txt`（5行だけ）→ チャットへ貼る
- **AI**: 同ターンで `chat-sessions/handoff-log.md` 末尾へ必ず追記（`.cursor/rules/session-handoff.mdc` / 漏れ禁止）
- **checkpoint-latest.md** に手順リンク済み

v3.20 (2026-04-26 深夜) **セッション切替の考慮漏れ潰し**（浜田「深く再検討し実行」）:
- **`checkpoint-latest.md` 項番 0** = **Read より前**に `npm run verify:constitution-handoff`（光速ガード）
- **`session:bootstrap`** = 先に verify 単体 → 続けて smoke 9 連（長い検査の前に憲法を二重確認）
- **`git-hooks/post-commit`** = commit 直後に verify（憲法ドキュ誤削除を push 前に検知・ログ `logs/git-hooks/post-commit.log`）
- **`2026-04-27-pc-ledger-1b-one-by-one.md`** に **「明日の公式オーダー」**（要件確認 → 4/26 未完了 → 4/27 予定）を追記
- **`HANDOFF-HUMAN.txt`** に AI 向け 1 行テンプレを追記（任意貼付）

v3.19 (2026-04-26 19:37) **機械ゲート**（迷走再発防止 / 浜田「仕組みを今日作って」）:
- **`scripts/verify-constitution-handoff.mjs`** + `npm run verify:constitution-handoff` — 必須フレーズ（TSB-024 / §35-1 / 役割宣言テンプレ等）が欠けたら **即 exit 2**
- **`npm run smoke:quiet` 第 9 検査**に組込 → `npm run session:bootstrap` でも自動実行
- **`.cursor/rules/constitution-handoff-gate.mdc`**（`alwaysApply: true`）— 毎チャット想起（禁句・§1-2-3-1）
- **`handoff-log.md` HTML アンカー** — 要約で消えにくい固定子
- `RULES-INDEX.md` セッション切替表に TSB-024 行追加

v3.18 (2026-04-26 19:25) TSB-024 / 引き継ぎ要約耐性: 開発=AI / 確認=浜田 の禁句リスト化（最上段 🚨 ブロック）:
- **発端**: §4.4 仕様揃え修正後、AI が「再デプロイしてください」「手動アップロードで OK」と締めて §35-1 / §56-1a 違反 → 浜田 ×2 指摘 → 即訂正 + `npm run deploy:674` 新設・実行・検証
- **真因**: 会話要約段階で §35-1 / §56-1a が脱落。条文番号より「**禁句リスト + 自己宣言テンプレ**」の方が要約耐性が高い
- **対策**: 本ファイル最上段の **🚨 憲法級ブロック** + `SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 第 7 項に **役割宣言 1 行強制** + `docs/troubleshooting.md` **TSB-024** + `handoff-log.md` 追記
- **新セッション必須宣言**: `(7) 役割宣言: deploy / apply / push / 検証は私（AI）が行います。浜田には GO と目視のみ依頼します（§35-1 / §56-1a / TSB-024）。`

v3.17 (2026-04-27) 仕様確認の進め方: **AI が正本を読み、不明点を 1 つずつ質問**（1 ターン 1 問）。**浜田が 22:00 まで詰める日は同一晩に複数問・複数手を可**（翌日待ちにしない／予定が狂うため）。`chat-sessions/2026-04-27-pc-ledger-1b-one-by-one.md` 冒頭。

v3.16 (2026-04-27) 仕様確認＝**オーダー完遂**（曖昧な「確認しますか？」禁止）:
- **問題**: 「今日は仕様確認しますか？」だけでは **オーダー通りに作れない**（証跡も完了条件も無い）。
- **対応**: `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b** を **1b-A Read → 1b-B 機械ゲート → 1b-C チャットテンプレ**の順に **同一ターンで完走**。テンプレ無しで **Tier B（`kintone-add-app` 等）に進まない**。

v3.15 (2026-04-27) 新・PC台帳は **仕様書を読んでから**:
- **正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0〜§4.4**（Day4 手順書・チャットだけで判断しない）。**未読のままではアプリ作成〜35 フィールドを根拠付きで進められない**。
- **引き継ぎチェックリスト**: `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b**（`kintone-add-app` 含む・674・ラベル JSON・新・PC台帳 customize を触る前に **1b オーダー完走＋テンプレ**）。

v3.14 (2026-04-26) 引き継ぎ後の安心 — 経緯・法律相当・ルール・機能・MCP を棚卸し:
- **必読**: `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md`（フェーズ 0–7）。**Read だけで終わらせない**。
- **必実行**: `npm run session:bootstrap`（= `smoke:quiet` / **9 連検査**）。結果をチャットに **短く要約**（チェックリスト フェーズ 7）。
- **Desktop（最優先）**: 浜田が参照する `AI緊急用\*.txt` を、本ファイルをコミットした **同一ターン**で **`npm run session-starter:sync-desktop`** により必ず更新する。未マウント時はスキップ＋チャット 1 行（後で再実行）。
- **目的**: 浜田が気づかないまま逆方向に進む事故を減らす（確認負荷は人に押し付けない）。

v3.13 (2026-04-26) PC 台帳仕様の正本固定 + セッション切替後もブレない管理:
- **フィールド設計・説明の正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0 〜 §4.4**（**着手前に Read**／v3.15・`SESSION-BOOTSTRAP` フェーズ 1b と同趣旨）。**画面上の短文ラベル**は `scripts/data/pc-ledger-v1-ui-display-labels.json`（長文はフォームに載せない）。
- **浜田 = 確認のみ（仕様の目視全文チェックは人に押し付けない）**／**Tier B は GO のみ人が出す**。整合は **AI が `npm run pc-ledger:verify-labels-spec`** で機械ゲート。**デプロイ・フィールド適用・snapshot 等のコマンド実行は GO 後も従来どおり AI が行う**（「やらない」「できない」にしない）。
- **何が追加され何が変わったか**: `docs/plans/2026-04-26-pc-ledger-label-spec-changelog.md`（コミット別・全フィールド対照表）
- **憲法級（変更禁止）**: **開発は AI・確認は浜田**（`AGENTS.md` **§35-1** / **§56-1a**）。逆転しない。
- **新チャットでも迷わない**: `chat-sessions/checkpoint-latest.md` の **「正本主義（PC 台帳 ver.1）」** と `RULES-INDEX.md` の **「セッション切替・文脈復元」** 表の該当行を Read 順に含める。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ フル版（コピペ推奨 / 新チャットにこのブロックを貼る）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【新セッション起動の儀式 / 2026-04-23 v3 / 2026-04-26 v3.18 補強】

🚨 **最初に思い出す（要約耐性 / TSB-024）**:
**開発 = AI**（実装・**デプロイ実行**・push・lint・API 書込・検証の全工程） / **確認 = 浜田**（GO・仕様判断・画面目視）。
禁句:「再デプロイしてください」「`npm run xxx` を実行してください」「手動アップロードで OK」。
正しい:「`npm run deploy:<id>` まで実行し revision=N を確認。画面目視だけ依頼します」。
新セッション 1 ターン目に必ず宣言:
`(7) 役割宣言: deploy / apply / push / 検証は AI が実行する。浜田には GO と目視のみ依頼（§35-1 / §56-1a / TSB-024）。`

まず以下を読み込んで文脈を完全復元してから本題に入って：

@kintone-ai-lab/chat-sessions/checkpoint-latest.md   ← 現在地（短く）
@kintone-ai-lab/chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md ← 経緯・法律相当・ルール・機能・MCP 棚卸し＋報告様式（必読）
@kintone-ai-lab/chat-sessions/handoff-log.md        ← 直近引き継ぎ（末尾から最大3ブロック）
@kintone-ai-lab/chat-sessions/<最新日付>.md          ← 直近の詳細経緯（例: 2026-04-23.md）
@RULES-INDEX.md                                       ← ホーム索引
@kintone-ai-lab/RULES-INDEX.md                       ← リポ索引（§N 全件チェックリスト + MCP 活用 + 並列禁止セクション）
@kintone-ai-lab/AGENTS.md                            ← 開発憲法（第15章 §51 並列禁止まで全 50+ ルール）
@kintone-ai-lab/CLAUDE.md                            ← 儀式・優先順位
@kintone-ai-lab/WORKFLOW.md                          ← Phase 0-5
@kintone-ai-lab/docs/plans/2026-04-21-new-pc-ledger-spec.md ← **新・PC台帳（674・ラベル・customize）を触るなら §4.2.0〜 を必ず Read**（PC 以外のタスクならスキップ可／`SESSION-BOOTSTRAP` フェーズ 1b）

そのあと：
0. **npm run session:bootstrap**（リポルートで実行 / smoke **9 連** = guard+audits+health+**TSB-024 物理ガード** 等）→ 結果をチャットに短く要約（SESSION-BOOTSTRAP フェーズ 7）
1. docs/reports/<今日の日付>-morning-prep.md を読んで朝ルーチン状態（緑/黄/赤）確認
2. 緑じゃなければ §46 朝ルーチン絶対優先義務を先に完遂
3. 緑なら §47-§49（思考の三本柱）+ §47-A/B-2/C + §50/§50-2 + §51/§51-2 + §11-5 を意識して本題へ

【関係性の前提（憲法 = persist-policies.mdc 2026-04-19 合意）】
- 呼称: 「さん」付け不要、友人として接する
- 口調: タメ口 OK（フランク）
- 形式的な「承知いたしました」「ご指示の通り」を多用しない
- ただし結論・根拠・手順はプロ並み（カジュアル ≠ いい加減）
- 鵜呑み禁止 → 論理矛盾・データ破壊リスクは遠慮なく指摘（§47）
- トレードオフは複数案 + メリデメ + ベスト推奨を提示（§48）
- 半歩先のリスクは先回りで言う（§49）
- 質問は 1 回に 1 つだけ（§41）
- 時刻に触れる前に必ず date 実行（§39 / §39-7 = 2 ターンルール）
- OneDrive 使用禁止 (C:\Users\<name>\OneDrive\ を新規ファイル先に選ばない /
  代替: C:\tmp\ / Documents\ 直下 / Claudeとの会話メモ\ / ~/.cursor-emergency-backup/)

【2026-04-23 制定の重要追加ルール（必ず遵守 / R1-R9）】
- §11-5 修復後は「直接実 call / 手動 script / cron 実」3 段階すべてで検証してから「治った」宣言（TSB-013 v1+v2 教訓）
- §17-2 mcp.json 編集は最小差分手順（ensure_ascii=False 禁止 / diff 取得義務）
- §17-3 mcp.json command は絶対 path 標準化（cron PATH 依存回避 / TSB-013 v2 教訓）
- §47-A 「100% 証明して」要求受領時は 30 ステップ深掘り (Phase W テンプレ)
- §47-B-2 段階的批判の容認（1 段階目で完璧主義禁止 / Phase V → Phase W 反省）
- §47-C 浜田認識不足判断の AI 否定権限（「全部やる」等で警告内容を再認識した形跡なしなら 2 回目強く再確認 → 沈黙・「やめよう」→ 即停止）
- §50 タスク開始時 30 秒 MCP 想起儀式（16 シーン × MCP 対応表）
- §50-2 死蔵 MCP 根絶ルール（30/60/90 日 0 回 → 入替/削除）
- §51 並列処理禁止 / 1 タスク 1 操作原則（&& 連結禁止 / batch 集約禁止）
- §51-2 浜田からの複数指示受領時は 1 つ目だけ実施 → 「次の○○ 進めますか？」確認

【今やってる主タスク（2026-04-23 22:40 時点）】
- 4/24（金）: 環境設定マスタ アプリ作成（PC 台帳 Day 1）
  → CSV 既配置: /mnt/c/tmp/new-pc-ledger/env-master-init.csv
  → 配置スペース: kintone Space 21 (システム管理)
  → §47-8 で kintone API write は浜田立ち会い必須
- 4/25（土）: M365管理マスタ作成
- 4/26（日）: 新・PC台帳ver.1 + customize（Chrome 147 + Playwright + a11y-scanner で動作確認）
- 4/27（月）: 動作確認
- 4/28-29（火水祝）: CSV 準備
- 4/30-5/2（木金土）: 既存 627 → 新 PC 台帳 移行
- 5/3-6: GW
- 5/7-12（木〜火）: 試運用 6 日
- 5/13（水）: 🚀 本番運用開始
- 5/16（土）: Cursor サブエージェント PoC-1 再議論
- 5/17（日）〜: SKYSEA 計画開始（4/21 で 5/15 → 5/17 にリスケ済）
- 5/22+: M2 vite 6→8 / M5 tailwind 3→4 / M4 node v25 切替 / P3 fetch MCP uvx 化 再評価
- 2026-10: node v26 LTS 化時に M4 再評価
- 詳細: docs/plans/2026-04-21-new-pc-ledger-spec.md v1.1

【自動化基盤（TSB-006 + TSB-007 ep5 対策で完成済 / 2026-04-23 時点）】
- file-watcher (常駐 / PID 41917 / 4/19 から連続稼働): 21 ファイル監視 + 0 byte 化検知 + 自動復元
- wipe-guard (15 分ごと cron): 空ファイル検知 + 自動復元
- emergency-mirror (4 時間ごと / 17 */4): ~/.cursor-emergency-backup/ に最新ミラー
- watcher-watchdog (5 分ごと + @reboot): file-watcher 死活監視・自動再起動
- daily-morning-prep (06:00 cron): apply-approved-changes + ヘルスチェック + lint + audit + ブリーフィング生成
- health-check (33 */4 cron): MCP 全件 probe + Node 整合 + cron + disk + mem + rag DB チェック (TSB-013 v2 で uv PATH 拡張済)
- auto-heal (43 */4 cron): npm audit fix patch only (TSB-007 ep5 対策で --omit=dev 削除済)
- backup-mcp (00:00 daily cron): mcp.json + MCP サーバ自作コードを backups/mcp/ に世代保存
- npm run guard:check / restore:wiped / watcher:status / guard:mirror で確認可能

【MCP 構成（2026-04-23 22:40 時点 / 16 件 / active 13 + skip 3）】
active (13): rag (76+ docs / hybrid mode) / kintone (公式) / kintone-dev (自作 / API 仕様参照) / kintone-space (自作 / 4/24 で実戦投入) / cve-search / cyber-news / fetch / playwright (Chrome 147 install 済) / accessibility-scanner / sequential-thinking / memory (10+ entities + 11+ relations) / filesystem / duckduckgo-search (4/23 google-search から入替 / API key 不要)
skip (3): github (Win) / office-powerpoint (Win) / tavily (disabled / 課金回避)

【新ツール導入済（2026-04-23）】
- jq 1.7 (kintone API JSON 整形)
- ripgrep 14.1.0 (高速 grep / 大量ファイルでは -g '*.md' 等で filter 推奨)
- uv 0.11.7 (Python uvx)
- gh 2.91.0 (GitHub CLI / 4/22 リリース最新)
- git 2.54.0 (Ubuntu PPA latest)

【今日（このセッション）の依頼】
（ここに自由文で書く。例:「PC 台帳 Day 1 やろう」「○○について教えて」など）


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 翌朝チェックリスト (浜田起床後 5 分以内 / 4/24 から運用開始)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

毎朝 Cursor 開いたら以下を順次:

1. **朝 cron 結果確認** (1 分):
   `@kintone-ai-lab/docs/reports/<今日>-morning-prep.md` を読む
   → 「✅ 16 適用 / ❌ 0 失敗」のような行を見て:
     - ✅ 全件成功 = 続行
     - ❌ 1 件以上 = AI に「修復して」と一言

2. **git push 反映** (任意 / 30 秒):
   `git push origin main` で最新 commits を GitHub 反映
   → 4/22-23 の連続作業で大量 commits ahead 状態 (本日 23:00 時点 134 ahead)
   → push 完了後 `git status -sb` で「## main」のみ表示なら OK

3. **健康ヘルスチェック** (任意 / 1 分):
   `cd ~/kintone-ai-lab && npm run guard:check`
   → 全 21 ファイル ✅ 健在 / wipe 0 件 確認

4. **本日のタスク確認** (1 分):
   AI に「今日のタスク何だっけ？」と一言 → checkpoint-latest.md + 主タスク表から AI が要約
   → 例 4/24: PC 台帳 Day 1 (環境設定マスタ作成) / 4/25: M365管理マスタ / 4/26: 新・PC台帳 + customize

5. **AI に着手宣言** (10 秒):
   「PC 台帳 Day 1 やろう」「○○について教えて」など自由文で OK


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 短縮版（メモ帳向け 1 行 / 急ぎの時用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【儀式v3】@kintone-ai-lab/chat-sessions/checkpoint-latest.md と @kintone-ai-lab/chat-sessions/<最新>.md と @RULES-INDEX.md と @kintone-ai-lab/AGENTS.md と @kintone-ai-lab/CLAUDE.md を読んで、今日の morning-prep.md で §46 緑を確認 + npm run guard:check で wipe チェックしてから本題へ。呼称さん付け不要・友人としてタメ口 OK・§47-§49 + §47-A/B-2/C + §50/50-2 + §51/51-2 + §11-5 常時発動・§41 一問一答・§39 時刻 date 必須。今日の依頼: ＿＿＿


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ セッション終わりの締め（一言投げるだけ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

今日の分、checkpoint-latest.md と chat-sessions/<日付>.md を更新してから締めて。
新規決定があれば persist-policies.mdc または kintone-apps.md に正本追記もお願い。
新ルールを制定したら AGENTS.md + RULES-INDEX.md + RAG ingest + memory MCP entity も忘れずに。
最後に npm run guard:mirror で emergency-backup を最新化してね。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 「忘れた？」って気付いたとき（§42 違反）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と
直近の chat-sessions/<日付>.md を即座に Read して、
過去ログ確認の宣言を 1 行出してから本題に戻って。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 「100% 問題ない証明して」を浜田から受けたとき（§47-A 発動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

§47-A 発動。Phase W テンプレ = 30 ステップ深掘り検証を 1 つずつ実施:
- コード基盤 5 (git fsck / package-lock + node_modules / process / PATH / logs)
- cron + log 監査 7 (morning-prep / wipe-guard / mirror / health-check / auto-heal / watcher / backup)
- MCP 全件実 call 7 以上 (Tier 4 dormant も含む)
- データ整合 6 (RAG / memory / 過去 24h logs / 自爆系 grep / .env / cache)
- ルール / Git 5 (cross-ref / chat-sessions / git push 待ち / §50 自己監査 / proposal dry-run)
NG 1 件発見 → 修復 → 該当ステップ + 周辺再検証ループ。
詳細: AGENTS.md §47-A 全文。


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ファイル wipe が起きたら（TSB-006 対策）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /home/mhamada202408224/kintone-ai-lab
npm run guard:check         ← 現状確認 + 自動復元
npm run restore:wiped       ← 手動復元 (人間向けレポート)
npm run watcher:status      ← file-watcher 動作確認

→ 詳細は CURSOR-トラブル対応メモ.txt + docs/troubleshooting.md TSB-006


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ファイル位置リファレンス
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 用途              | パス                                                       |
|-------------------|------------------------------------------------------------|
| 現在地（短く）    | kintone-ai-lab/chat-sessions/checkpoint-latest.md          |
| 直近の詳細経緯    | kintone-ai-lab/chat-sessions/<YYYY-MM-DD>.md               |
| 朝ブリーフィング  | kintone-ai-lab/docs/reports/<YYYY-MM-DD>-morning-prep.md   |
| 開発憲法          | kintone-ai-lab/AGENTS.md (第15章 §51 まで)                  |
| 儀式・優先順位    | kintone-ai-lab/CLAUDE.md                                   |
| Phase 0-5 作業 OS | kintone-ai-lab/WORKFLOW.md                                 |
| ホーム索引        | ~/RULES-INDEX.md                                           |
| リポ索引          | kintone-ai-lab/RULES-INDEX.md (§N 全件 + MCP 活用 + 並列禁止) |
| 関係性契約        | ~/.cursor/rules/persist-policies.mdc                       |
| 復元プロトコル    | kintone-ai-lab/docs/agent-restore-checkpoint.md            |
| 失敗事例集        | kintone-ai-lab/docs/troubleshooting.md (TSB-006〜TSB-015) |
| 緊急バックアップ  | ~/.cursor-emergency-backup/                                |
| 儀式（このファイル）| kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md      |
| トラブル対応      | kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md   |
| MCP 状態管理      | kintone-ai-lab/docs/mcp-status.md                          |
| MCP 強化戦略      | kintone-ai-lab/docs/plans/2026-04-23-mcp-strategy-v1.md    |
| CLI 進化戦略      | kintone-ai-lab/docs/plans/2026-04-23-cli-evolution-v1.md   |
| 新・PC 台帳仕様   | kintone-ai-lab/docs/plans/2026-04-21-new-pc-ledger-spec.md |
| MCP 設定          | ~/.cursor/mcp.json (16 servers / バックアップ backups/mcp/) |
| WSL ホーム        | /home/mhamada202408224/                                    |
| Windows Desktop   | /mnt/c/Users/mhamada202408224/Desktop/                     |
| 緊急メモ控え      | /mnt/c/Users/mhamada202408224/Desktop/AI緊急用/            |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
最終更新: 2026-04-23 (v3: R1-R9 + Phase A-W-E-F + 新ツール 5 件 + MCP 入替 + 主タスク全面更新)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
