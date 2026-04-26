━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cursor トラブル対応メモ / 2026-04-23 制定 (v2 / 全面リライト)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

困ったら上から順に試す。それでもダメなら AI に状況を伝える。

正本: kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md
控え: C:\Users\mhamada202408224\Desktop\AI緊急用\CURSOR-トラブル対応メモ.txt

v1 (2026-04-19) からの主な強化:
- 新トラブル類型 ⑨〜⑬ 追加 (TSB-013/014/015 + R8/R9 教訓由来)
- 自動防衛仕組みを 8 cron + file-watcher 21 ファイル監視に更新
- 連絡先メモに新規 TSB-013/014/015 + R8/R9 + 戦略書 v1 追加

v2.1 (2026-04-25) 並列セッション + K-3（憲法ファイルリアルタイム監視）:
- **疑い**: 自分が触ってないのに AGENTS.md / RULES-INDEX.md 等が変わった → `docs/troubleshooting.md` **TSB-017**、  
  `logs/file-watcher/agents-md-changes.jsonl` を確認。**作業即中止** → 浜田連絡（§51-3）
- **watcher 更新後は必ず再起動**:  
  `cd /home/mhamada202408224/kintone-ai-lab && npm run watcher:stop && npm run watcher:start`  
  （古い PID のままだと K-3 の SHA256 監視が効かない）
- **稼働確認**: `npm run watcher:status` または `npm run watcher:rules-status`
- **全体診断**: `npm run smoke`（7 項目）

v2.2 (2026-04-26) Composer 2 silent fallback 防御（§1-2-2 / TSB-018）:
- **症状**: Cursor IDE chat に `Switched to Composer 2 after reaching API limit.` 表示  
  → Opus 4.7 のクレジット枯渇で自動的に composer-2 (軽量) に切り替えられた状態
- **AI 側挙動**: §47-E 連動で **即作業中断** → 浜田に「§1-2-2 違反検知」報告 → GO 待ち
- **浜田復旧手順 (30 秒)**: Cursor IDE → 設定 → Models で:
  1. `Auto` モデルピッカーを **OFF**
  2. `Auto-fallback to Composer/Sonnet on rate limit` 系を **OFF**
  3. `Use Auto model when limits reached` 系を **OFF**
  4. 有効モデル一覧で **`Opus 4.7 1M Extra High` のみ ON**、他は全 OFF
  5. Background agents モデルを Opus 4.7 系に固定（または無効化）
- **クレジット枯渇時**: エラー停止が正常。別モデル続行は浜田が明示 GO した時のみ（§1-2 例外 ①）
- **§57 改定プロセス（2026-04-26 N-2 制定）**: ルール改定は §57-1〜§57-9 を厳守

v2.3 (2026-04-26 07:05) Cursor Ultra クレジット予算管理（O-series / §1-2-2 + §1-2-3 + §1-2-4）:
- **§1-2-2 N-4 強化**: Composer 2 検知時に AI が **必ず 4 択 A-D を提示**（省略禁止）  
  - A: On-Demand 課金で Opus 継続（要 §1-2-2-1 設定 / 月 $130 cap）★★★ 推奨  
  - B: 本日の作業を停止 → 次回課金日まで待つ ★★  
  - C: 個人 Anthropic API key (BYOK) 投入 ★（ZDR 観点で kintone 業務には非推奨）  
  - D: その他（明示の別モデル一時利用 / プラン昇格 / `hi@cursor.com` 早期更新依頼）
- **§1-2-2-1 Cursor IDE 必須設定**（浜田のみ実施可 / 月 1 回 + 必要時）:  
  - cursor.com/billing → "Enable on-demand spending" を **ON**  
  - cursor.com/billing → Monthly spend limit を **$130** に設定
- **§1-2-3 Opus 内モデル使い分け**（コスト最適化）:  
  - 既定: **Opus 4.7 1M Extra High**（cost 1/3-1/5 / lint・refactor・既知 deploy・commit message）  
  - **Opus 4.7 1M Max Thinking**: §47-A 100% 証明・設計判断・複雑バグ修正・TSB 真因究明・憲法改定起案のみ  
  - AI が判定し Max Thinking 切替時は理由 1 行明示
- **§1-2-4 クレジット予算管理**（朝報 §0a に常時表示）:  
  - 月予算: L1 $400 (Ultra) + L2 $130 (On-Demand) = $530  
  - 浜田: 1 日 1 回 30 秒で cursor.com/billing の % を確認 → `npm run credit:set <pct>` で記録  
  - AI: 70% / 85% / 95% / 100% で 4 段階自発警告 + 線形回帰で枯渇日予測
- **CLI コマンド**:  
  - `npm run credit:set 65` — 今日の消費を 65% で記録  
  - `npm run credit:status` — 現在の状態（残日数 / 想定枯渇日 / AI 助言）  
  - `npm run credit:reset -- --day=14` — 課金日を毎月 14 日に設定（初回のみ）

v2.4 (2026-04-26 07:55) Cursor IDE Auto-Run + RACI bypass 防御（Q1 / TSB-019 連動）:
- **発見**: Settings → Agents タブで `Auto-Run Mode = Run Everything (Unsandboxed)` + Browser/MCP Protection OFF だった  
  → AI が kintone 本番 API・shell・file-write を **承認なし全自動執行できる構成** = §52 RACI Tier B 実効性ゼロ
- **暫定対処（浜田 07:48 完了）**: Auto-Run Mode 維持 + **Browser Protection: ON + MCP Tools Protection: ON ⭐**  
  → kintone MCP 経由の本番 API 書込が承認ゲート復活（基本自律 + 危険時のみ確認）
- **§1-2-2-1 拡張**: 4 → 8 項目 (A 課金 / B Models / C Agents / D Cloud Agents) — 詳細は AGENTS.md §1-2-2-1
- **§52-8 高リスク shell 暴走防止**:  
  - **AI が事前報告必須**: `rm -rf` / `git push --force` / `git reset --hard` / `npm install` (新規) / `npm uninstall` / `chmod -R` / `chown -R` / `sudo` 系 / `.env` 編集 / `~/.cursor/mcp.json` 編集 / docker・kubectl 系 / WSL 外への書込  
  - **AI が即実行可（事前報告不要 = 安全カテゴリ）**: 読取 (`ls`, `cat`, `grep`, `rg`, `find -print`) / 既知 npm スクリプト (`npm run smoke`, `health-check`, `guard:check`, `test`) / git 安全 (`git status/log/diff/add/commit/push origin main`) / session-lock (`scripts/session-lock.mjs`)  
  - **AI 報告様式（覚えておく）**:  
    ```
    ⚠️ §52-8 高リスク shell 検知 / 実行前 GO 確認
    - コマンド: <full command>
    - カテゴリ: <table 上のどれか>
    - 影響: <1 行説明>
    - ロールバック: <手順 or "不可逆">
    GO ですか?
    ```
- **TSB-019 詳細**: `docs/troubleshooting.md` 末尾セクション参照（事象 / 真因 / 影響 / 暫定 / 恒久 / 教訓 5 件）
- **後続**: Q-series 包括 Cursor 設定監査（残 5 タブ Hooks / Tools & MCPs / Rules-Skills-Subagents / Indexing & Docs / Plan & Usage）= PC 台帳完了後に実施

【浜田が違反検知したら / 例: AI が rm -rf を勝手に実行したら】
1. 即座にチャットで **「§52-8 違反です」** と AI に伝える
2. AI は §47-E 連動で即時謝罪 + 影響評価 + 復旧手順提示
3. 必要なら git revert / npm run restore:wiped / バックアップ復元
4. 違反を `logs/autonomy-decisions/` に記録 (再発防止)

v2.5 (2026-04-26 08:25) §51-4/§51-5 並列セッション疑い 4 軸機械判定（P4）:
- **目的**: 「並列セッションかも？」を AI 個別判断ではなく **客観的 4 軸スコア** で機械判定
- **検知 4 軸**:  
  ① watcher_pid 不一致 = +5（別 file-watcher が動いている = 別セッション物理証拠）  
  ② 同一ファイル 5 分以内 5+ 件編集 = +2（暴走編集の警告）  
  ③ session-lock 不在編集 = +3（L-1 規約違反 or 別セッション）  
  ④ 不審バックアップ命名（`.b7-pre-*` / `.tsb-*-pre-*` / `.proposal-pre-*` 等）= +4（TSB-017 パターン）
- **判定閾値**:  
  - 0-2 点: 🟢 静穏（通常運用）  
  - 3-4 点: 🟡 注意（朝報追記 / AI 開口一番に報告）  
  - 5-6 点: 🟠 警報（**作業中断 + 浜田 GO 待ち**）  
  - 7+ 点: 🔴 確定（即 abort + 段階 2 force kill 候補）
- **CLI コマンド**:  
  - `npm run audit:parallel` — 標準実行（テキスト出力）  
  - `npm run audit:parallel:explain` — 軸ごとの内訳詳細  
  - `npm run audit:parallel:json` — JSON（朝報・smoke-test 用）
- **統合**: `npm run smoke` の第 8 検査として組込（3-4 点 = warn / 5+ 点 = ng）  
  朝報 §5-5 末尾に detector 結果（軸ごとの内訳テーブル）が常時表示
- **誤検知抑制**: AI が「これは false positive」と判断したら `--ignore-suspicion=<reason>` で `logs/parallel-suspicion/false-positive.jsonl` に履歴化
- **警報以上の自動保全**: 5+ 点で `logs/parallel-suspicion/<JST>-score<N>.json` にスナップショット保存（後日 §51-3 段階 2 force kill 候補に追加）

【浜田が「並列っぽい」と感じたら】
1. WSL ターミナルで `cd /home/mhamada202408224/kintone-ai-lab && npm run audit:parallel:explain` を実行
2. スコアが 3+ 点なら AI に「§51-4 注意レベル」と伝える
3. AI は §47-E 連動で **即作業中断 + 状況報告** + ロールバック案提示

v2.6 (2026-04-26 08:45) §52-8-1 物理 block 層 / TSB-019 構造的根本対策（P5-1 / R1）:
- **目的**: §52-8 の高リスク shell（rm -rf / git push --force / sudo / .env 編集 等）を **AI が承認なしに実行できない** ように OS レベルで block
- **実装ファイル**:
  - `~/.cursor/hooks.json` ← `beforeShellExecution` フック設定（既存の preflight-reminder.sh と並存）
  - `~/.cursor/hooks/dangerous-shell-blocker.sh` ← 判定スクリプト（実行権限 +x 必要）
- **三層防御**: 第 1 層 AI 自己制約 (§52-8) + 第 2 層 IDE ゲート (§1-2-2-1 #6/#7) + **第 3 層 物理 block (§52-8-1)**
- **block されたら**:
  - Cursor IDE が `Rejected: Command execution was blocked by a hook` を表示
  - AI は即座に「§52-8 物理 block 検知」を浜田に報告 → GO 待ち
  - 浜田が「§52-8 例外 GO」と明示すれば AI は別経路（npm スクリプト化等）で実行
- **動作確認方法**（浜田用）:
  1. WSL ターミナルで `tail -20 /tmp/cursor-shell-blocker.log` を実行 → 直近の判定履歴が見える
  2. 例: `[2026-04-26 08:39:53 +0900] BLOCK category=秘密情報(.env 編集) cmd=echo "FOO=bar" > .env`
- **緊急停止（hook 自体が壊れた場合）**:
  ```bash
  mv ~/.cursor/hooks.json ~/.cursor/hooks.json.broken
  # Cursor を再起動 → hook なしで起動 → 復旧後は再構築
  ```
  または `mv ~/.cursor/hooks/dangerous-shell-blocker.sh ~/.cursor/hooks/dangerous-shell-blocker.sh.disabled`
- **設計仕様書**: `docs/cursor-hooks-design.md`（フル仕様 + 検証ログ + 復旧手順）
- **誤検知（false positive）の場合**:
  - 浜田は AI に「これは誤検知。`docs/cursor-hooks-design.md` の deny pattern を緩和して」と伝える
  - AI は §57 改定プロセスを経てから `dangerous-shell-blocker.sh` のパターンを修正

【浜田が「hook が誤って block する」と感じたら】
1. `tail /tmp/cursor-shell-blocker.log` で判定履歴を確認
2. 該当コマンドを AI に伝えて「§52-8-1 誤検知の可能性。パターン修正案を出して」と依頼
3. AI が緩和案を提示 → 浜田 GO → AI が `~/.cursor/hooks/dangerous-shell-blocker.sh` を修正（StrReplace 経由 = hook 対象外）

v2.7 (2026-04-26 09:55) Cursor Plan & Usage 監査 + 節約パッケージ全実施（P5-5 / S1-S5）:
- **発見**: Spending タブで On-Demand $235.94 / $300 (78.6%) + API 100% 枯渇 + Cursor IDE 側に 70/85/95% 警告 UI なし  
  → 4/29-5/3 頃 $300 突破見込み（このまま放置で月総額 $629 = ¥97,517）= **3 重大発見 F-11/F-12/F-13**
- **浜田操作 (実施済)**: Cursor IDE Settings → Spending → Monthly Limit を **$300 → $1000** へ引上げ済（Worst $1200/¥186,000 / 節約後想定 $430-500/¥66,000-78,000）
- **§1-2-3-1 制定（AI 自己宣言義務）**: タスク冒頭で `[§1-2-3 ティア判定: Extra High/Max Thinking]` 1 行明示が新ルール  
  → 浜田は AI が忘れたら「§1-2-3-1 ティア判定は?」と一言で促してください
- **§1-2-4 改定**: 3 系統警告（Total% / API% / On-Demand $）+ 80% 警告 新設  
  → 浜田は朝のブリーフィング時に **Spending タブのスクショも追加で送付** (4 値を AI が抽出 → 80% 超で警告)
- **§51-6 制定（セッション分割推奨）**: 朝/昼/夜で chat session 区切り推奨  
  → 浜田が「ここで区切ろう」と言えば AI は素直に新セッションへ誘導 / 同セッション 4h 超で AI から提案
- **節約パッケージ S1-S5**:  
  - S1: ルーチン (朝報・smoke 整理) は浜田が UI で **Composer 2 に切替**して実行（重要分析時のみ Opus に戻す）  
  - S2: CLAUDE.md 整理（要浜田判断 / 完全削除 / thin 化 / 維持 の 3 択 → 後述）  
  - S3: 浜田が UI で **既定モデルを Extra High に切替**（Max Thinking は手動切替に）  
  - S4: session 区切り運用 (上記 §51-6)  
  - S5: `.cursorignore` を 87 行 → 109 行に拡張（snapshot/archive 追記）
- **TSB-021 候補**: credit-budget.mjs に On-Demand 取得機能（Day 5-6 起票予定）

v2.8 (2026-04-26 10:13) S2 / B+: CLAUDE.md thin 化 + .cursorignore 追加（commit 046ec2d）:
- **CLAUDE.md**: 480 行 → 73 行（**92.4% 削減**）+ .cursorignore に追加 = Cursor Composer から実質遮断
- **節約効果**: 1 セッション ~13K → ~700 tokens (94%) / 月 ~369K tokens 節約
- 旧版復元: `git log --follow CLAUDE.md` から 046ec2d 以前を取得

v2.9 (2026-04-26 10:30) R-3 / v23.16: §1-2 改定「最適モデル原則」+ §1-2-3-2「AI 自律モデル選択」（commit 92b89d5）:
- **発端**: 浜田指示「使うモデルは一番最適 / こだわらない / AI 判断」+ Billing で **F-14 確定** (Max Thinking 59.4%)
- **§1-2-3-2 新設（AI 自律 3 段階選択）**: L1 Composer 2 (ルーチン) / L2 Extra High (既定) / L3 Max Thinking (重作業のみ)
- **silent fallback と区別**: AI が事前明示で Composer 2 選択 = 健全 / Cursor IDE が裏で自動切替 = §1-2-2 違反
- **浜田側**: 何もする必要なし (= AI が自律でティア宣言 + モデル選択。浜田はティア宣言を見て透明確認のみ)

v2.10 (2026-04-26 10:35) R-4 + R-5 / v23.17: §51-6-2 + §52-9 新設:
- **§51-6-2（AI 自律セッション切り命令権 / R-4）**: §51-6 「提案」→ 「命令」昇格。6 つの自律発動条件 (4h / 200 tool call / 重作業完了直後 / コスト 2x / Tier B 直前 / API 100%)
  - **浜田側**: AI から `[§51-6-2 命令発動]` を受けたら **新セッション開く義務** (1 回までは「もう少し続けて」で続行可 / 2 回目からは AI が §47-D で逆却下)
- **§52-9（Tier A 範囲 自律修正権 / R-5）**: ミス発見 → AI が確認なしで即修正実行 + 完了報告のみ
  - **浜田側**: 何もする必要なし (= 朝報や事後報告で `[§52-9 自律修正実施]` を確認するだけ)
  - **絶対対象外**: Tier B / §52-8 / §57 / scope 外 / Cursor IDE 設定変更 (これらは浜田 GO 維持)
- **PC 台帳 Day 4 時刻シフト**: 13:00 → **20:00** (重要案件継続中の慎重進行優先 / §51-6 夜セッション帯と整合)

【浜田が朝のブリーフィングで Spending スクショを送るとき】
1. Cursor IDE 起動 → Settings → Plan & Usage → Spending タブ
2. スクショして AI に貼付（「今日の Spending」とだけコメント可）
3. AI が 4 値抽出 (Total% / API% / On-Demand $X / Monthly Limit $Y) → JSON 記録 + 80% 超なら警告

【浜田が「セッション長すぎ / 区切ろう」と感じたら】
1. AI に「§51-6 区切ろう」と一言（または AI から `[§51-6-2 命令発動]` が来る）
2. AI は完了報告 + チェックポイント更新 + 「次セッションで NEW-SESSION-STARTER.md を貼ってください」と案内
3. 新チャットで NEW-SESSION-STARTER の v3.10 までを貼付 → 文脈復元


━━━ ① まず現状確認（30 秒）━━━━━━━━━━━━━━━━━━━━━━━━

WSL ターミナルで:

  cd /home/mhamada202408224/kintone-ai-lab
  npm run guard:check

→ 全 21 ファイル ✅ 健在 + MCP 全件 ✅ なら問題なし
→ 何か ❌ や 0 byte があれば自動復元される

【さらに詳しく診断したい時】
  PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" node scripts/health-check.mjs
  → 全 16 MCP probe + Node 整合 + cron + disk + mem + rag DB チェック


━━━ ② 「Request blocked by Anthropic」+ Undo All が出た ━━━━

⚠ 一番危険なパターン (TSB-006 の真犯人)

【絶対やる】
  1. ❌ Undo All は押さない（被害が広がる可能性）
  2. ✅ Review で内容を確認（何を変更しようとしてたか）
  3. ✅ エラー画面のスクショを保存（Request ID が原因究明の決定打）
  4. ✅ npm run guard:check で被害確認
  5. ✅ file-watcher が動いてれば自動復元しやすい（`npm run watcher:status` で PID 確認）

【リクエストが多すぎたとき】
  → AI に「ファイル数を分けて 5 個ずつ実行して」と頼む（AGENTS.md §47-5 大量編集ガード）


━━━ ③ MCP が赤い（rag / accessibility-scanner 等）━━━━━━━━

  cd /home/mhamada202408224/kintone-ai-lab
  npm run guard:check
  PATH="/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:$PATH" node scripts/health-check.mjs

→ MCP 全 16 件 ✅ になってるか確認

【それでも Cursor UI が赤い】
  Cursor を再起動（接続キャッシュが古い）

【再起動しても赤い】
  AI に「rag MCP が赤い、絶対パス確認して TSB-013 v2 教訓で」と頼む
  → §17-3 mcp.json command の絶対 path 標準化を確認

【cve-search だけ ❌ で他全部 ✅ の時】
  TSB-013 v2 真因 (cron 環境で uv が PATH not found) の可能性
  → AI に「health-check.mjs の env.PATH に ~/.local/bin 追加されてるか確認」と頼む
  → 既に対策済 (commit 21ef26a) なので通常は再発しないが、health-check.mjs 巻戻った場合は要確認


━━━ ④ ファイルが消えた / 0 byte 化 ━━━━━━━━━━━━━━━━━

  cd /home/mhamada202408224/kintone-ai-lab
  npm run restore:wiped

→ 自動で復元される（emergency-backup から）

【それでもダメ】
  git status で消えたファイルを確認
  git restore <ファイルパス>

【git からも消えてる】
  ~/.cursor-emergency-backup/ から手動コピー
  ls ~/.cursor-emergency-backup/

【最終手段】
  AI に「○○ファイルが消えた、復元して」と頼む


━━━ ⑤ 新しいチャットを開いた / 文脈が分からなくなった ━━━

C:\Users\mhamada202408224\Desktop\AI緊急用\NEW-SESSION-STARTER_yyyymmdd.txt（JST・常にこのファイル名）を開いて
中身（フル版）を新チャットにコピペするだけ。

→ AI が文脈・関係性・優先順位・主タスク・新ルール（R1-R9）を全部復元する
→ v3 (2026-04-23) は 4/24 PC 台帳 Day 1 + R1-R9 全反映済


━━━ ⑥ Cursor が固まった / 動かない ━━━━━━━━━━━━━━━━

  1. 該当のチャットウィンドウを閉じる
  2. Cursor アプリを再起動（タスクトレイから完全終了 → 再起動）
  3. 新チャット起動 + NEW-SESSION-STARTER_yyyymmdd.txt（verify 最終行の貼付推奨）を貼る


━━━ ⑦ AI が「忘れた？」みたいな反応をした ━━━━━━━━━━━

新チャットに以下をそのまま貼る:

  §42 違反。@kintone-ai-lab/chat-sessions/checkpoint-latest.md と
  直近の chat-sessions/<日付>.md を即座に Read して、
  過去ログ確認の宣言を 1 行出してから本題に戻って。


━━━ ⑧ 何かおかしいけど何が起きてるか分からない ━━━━━━

AI にこう聞く:

  状況を整理して。何が起きてる？必要なら npm run guard:check と health-check.mjs も走らせて。

→ AI が状況を診断して報告してくれる

【もっと厳重に「100% 問題ないを証明」してほしい】
  AI に「100% 問題ない証明して、1 つでも NG なら再検証して」と頼む
  → §47-A 発動 / Phase W テンプレ (30 ステップ深掘り) を AI が autonomous で実施


━━━ ⑨ MCP 起動失敗 / cron で MCP probe ❌ になる（TSB-013 v2 / 2026-04-23）━━━

【症状】
  - logs/health/cron.log で特定 MCP (cve-search 等) が ❌ 応答なし
  - 手動で MCP 実行すると ✅ 動く（手動は OK / cron で ❌ の乖離）

【真因】
  - mcp.json の command が PATH 依存（"command": "uv" など）
  - cron PATH (/NVM/bin:/usr/bin:/bin) に ~/.local/bin が含まれず uv not found

【対応】
  - AI に「TSB-013 v2 同型 / mcp.json の絶対 path 化検討」と頼む
  - 既に health-check.mjs に PATH 拡張対策済 (commit 21ef26a) なので通常は出ない
  - 出た場合は §17-3 絶対 path 標準化を新規 MCP に適用してない可能性


━━━ ⑩ 朝 cron で lint:customize が ❌（TSB-007 ep5 / 2026-04-23）━━━

【症状】
  - 朝の morning-prep.md で lint:customize が ESLint 6.4.0 で失敗（v9 or v10 のはず）
  - node_modules/.bin/eslint が消えている

【真因（修復済）】
  - auto-heal.mjs の `npm audit fix --omit=dev` が devDependencies を 4h ごとに prune
  - npm v7+ 仕様で --omit=dev = production-only モード = devDeps 削除

【対応（既に修復済 / commit 99c8360）】
  - auto-heal.mjs から --omit=dev 削除済
  - 万一再発したら npm install で復元 + AI に「ep5 系列再発 / auto-heal の --omit=dev チェック」と頼む

【予防】
  - S9 check-node-modules.mjs (4/23 朝 cron 適用済) で node_modules 完全性 4h ごと監視


━━━ ⑪ 2 つ指示で AI が混乱・エラーで止まった（R9 §51-2 / 2026-04-23）━━━

【症状】
  - 1 メッセージで複数依頼 → AI が並行処理で混乱・エラー
  - 過去 (2026-04-23 22:14 浜田反省) の経験あり

【予防】
  - 1 メッセージに 1 指示だけ書く（§51-2 浜田向けルール）
  - もし複数書いてしまった場合、AI が「1 つ目完了しました。次の○○ 進めますか？」と確認するはず（§51-2 義務）

【AI が並行処理しちゃった場合】
  - 「§51-2 違反です。1 つずつやり直して」と即指摘


━━━ ⑫ Web 検索 MCP が結果を返さない（TSB-015 / 2026-04-23）━━━

【症状】
  - google-search MCP で検索しても結果が常に空 / CAPTCHA 出る

【真因（修復済）】
  - Google bot 検知で headless ブラウザを CAPTCHA ブロック
  - 構造的問題（MCP 設計起因）

【対応（既に修復済 / commit 942848e + 0fd7477）】
  - google-search → duckduckgo-search に入替済 (4/23 21:35)
  - mcp_user-duckduckgo-search_search で動作 (Bing ベース / API key 不要)

【もし duckduckgo も結果空になったら】
  - AI に「Web 検索代替検討 / brave-search / serpapi 等」と頼む
  - 戦略書 docs/plans/2026-04-23-cli-evolution-v1.md の P3 セクション参照


━━━ ⑬ playwright / accessibility-scanner / google-search 系で起動失敗（TSB-014 / 2026-04-23）━━━

【症状】
  - "Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome"
  - "libnspr4.so: cannot open shared object file"

【真因（修復済）】
  - Chromium 本体 + system libraries (libnspr4 / libnss3 等) 未インストール
  - sudo 必要

【対応（既に修復済 / 浜田 sudo 22:09-22:25）】
  - sudo $(which npx) playwright install-deps chromium  ← system deps 20 packages
  - npx playwright install chrome                       ← Google Chrome 147 install
  - 完了後 mcp_user-playwright_browser_tabs で動作確認

【もし system deps が消えたら】
  - sudo apt install -y libnspr4 libnss3 libasound2t64 fonts-liberation で復元


━━━ 自動で守ってくれてる仕組み（覚えなくて OK / 2026-04-24 時点 8 cron + S12 v2 / S13 v2）━━━

- file-watcher: 重要 21 ファイル監視・5 秒で自動復元 (PID 41917 / 5 日連続稼働)
- wipe-guard: 15 分ごとに健康チェック・自動復元
- emergency-mirror: 4 時間ごと (17 */4) ~/.cursor-emergency-backup/ にコピー
- watchdog: file-watcher が死んだら 5 分以内に再起動 (+ @reboot)
- daily-morning-prep: 06:00 cron で apply-approved-changes + ヘルスチェック + ブリーフィング生成
- health-check: 4 時間ごと (33 */4) MCP 全件 probe + rag DB チェック + node_modules + MCP 死蔵 (S13 v2 統合)
- auto-heal: 4 時間ごと (43 */4) npm audit fix patch only (--omit=dev 削除済)
- backup-mcp: 00:00 daily で mcp.json + 自作 MCP コードを backups/mcp/ に世代保存

→ ユーザーが何もしなくても多重防衛が効いてる
→ 異常検知 → 朝のブリーフィング (docs/reports/<日付>-morning-prep.md) で先頭に 🚨 表示
→ 4/24 から「🛡 自己診断強化 (S9 + S12 wiring)」セクションも表示 (S13 v2 効果 / 13/16 active 3 exempt 表示)


━━━ ⑭ proposal が apply-approved-changes で「old_string 不一致」エラー (2026-04-24 制定) ━━━

【症状】
朝のブリーフィング「📋 昨夜承認分の自動実施結果」で `❌ old_string 不一致` 表示。
proposal は processed/ に移動済 (apply-approved-changes は failed でも移動する設計)。

【真因】
proposal 制定後にコード本体が編集されて、proposal の old_string が部分一致しなくなった。
4/24 朝の S13 = 4/23 制定時 → 4/23 早朝 TSB-012 修復で集計セクション直前に rag deep
check コードが挿入された → S13 の old_string が分離 → apply で完全一致せず ❌。

【自己対応 (AI に頼む)】
「S13 (or 該当 ID) を手動 apply してほしい」と AI に依頼。AI が以下を実行:
  1. processed/<日付>/<ID>.proposal.json から new_string を取り出す
  2. 現状コードの該当位置を Read で特定 (proposal の周辺コードを grep)
  3. StrReplace で手動挿入
  4. §11-5 3 段階検証 (① syntax / ② 手動 script / ③ cron シミュレート)
  5. fix commit + 翌朝 cron で実証

【予防】
proposal 制定時に「old_string にコード位置に依存しない狭めの context を選ぶ」
(例: `// ───── 集計 ─────\nconst summary = {` のような長文 context は危険 / 短い ID 句を含めるか line 数で固定)


━━━ ⑮ MCP 死蔵検知が「Windows-side で false positive」(2026-04-24 制定 / S12 v2 適用済) ━━━

【症状】
check-mcp-dormancy.mjs / health-check が github + office-powerpoint を「死蔵」⚠ と判定。
でも Cursor IDE では普通に使えてる。

【真因】
S12 は WSL 側 usage log のみ計測。Windows-side MCP (Cursor IDE 経由のみ動く) は
WSL log に現れないため常に shortCount=0 → 自動的に dormant 誤判定。

【対応 (4/24 18:00 適用済 / 自分でやる必要なし)】
~/.cursor/mcp.json に以下を追加:
  "github": { ... , "_meta": { "dormancy_exempt": true, "exempt_reason": "..." } }
  "office-powerpoint": { ... , "_meta": { ... } }
  "tavily": { ... , "_meta": { ... } } (有料 disabled)
→ S12 v2 が exempt status として分類 / dormant にカウントせず ⚪ exempt 表示。
→ 朝のブリーフィングで「✅ 13/16 active (3 exempt)」と表示される。

【新 MCP 追加時の注意】
WSL から呼べない MCP (Windows-only / Cursor IDE 専用) を追加したら必ず _meta.dormancy_exempt: true を追加。
mcp.json 編集は R4 §17-2 厳守 (backup + ensure_ascii=True + diff 確認)。


━━━ 連絡先メモ（2026-04-23 時点）━━━━━━━━━━━━━━━━━

【失敗事例集 (TSB)】
- 詳細手順: kintone-ai-lab/docs/troubleshooting.md
  TSB-006 (Anthropic block + Undo All wipe)
  TSB-007 ep1〜5 (eslint 系列 / ep5 = auto-heal --omit=dev 自爆 / 修復済)
  TSB-009 (画像系 dangling reference)
  TSB-010 (FAQ ポータル v2 失敗)
  TSB-011 (並行 Cursor チャット騒動)
  TSB-012 (rag MCP broken / 修復済)
  TSB-013 v1+v2 (cron uv PATH / 修復済)
  TSB-014 (Chrome system deps / 浜田 sudo 完了)
  TSB-015 (google-search 死蔵 → duckduckgo 入替)
  S12 v2 (Windows-side MCP false positive / 4/24 解消 / 上記 ⑮)
  S13 v2 (health-check 半完成 → 出力反映完成 / 4/24 / 上記 ⑭)

【リカバリ運用】
- 新セッション起動: kintone-ai-lab/chat-sessions/NEW-SESSION-STARTER.md (v3)
- 復元プロトコル: kintone-ai-lab/docs/agent-restore-checkpoint.md
- 現在地: kintone-ai-lab/chat-sessions/checkpoint-latest.md

【開発憲法】
- AGENTS.md (50+ ルール / §1-§51-2 + R1-R9)
- RULES-INDEX.md (§N 全件チェックリスト + MCP 活用 + 並列禁止)
- WORKFLOW.md (Phase 0-5)

【戦略書 (2026-04-23 制定)】
- MCP 強化戦略 v1.0: docs/plans/2026-04-23-mcp-strategy-v1.md
- CLI / 依存進化戦略 v1.1: docs/plans/2026-04-23-cli-evolution-v1.md
- MCP 状態管理: docs/mcp-status.md (16 MCP / 月次更新)

【新ルール (2026-04-23 制定 R1-R9)】
- R1 §51 並列処理禁止 / 1 タスク 1 操作原則 (第15章)
- R2 §11-5 修復系の段階的検証 3 段階
- R3 §50-2 死蔵 MCP 根絶ルール
- R4 §17-2 mcp.json 編集の最小差分手順
- R5 §17-3 mcp.json command の絶対 path 標準化
- R6 §47-A 「100% 証明」要求の 30 ステップ深掘り (Phase W テンプレ)
- R7 §47-B-2 段階的批判の容認 / 1 段階完璧主義禁止
- R8 §47-C 浜田認識不足判断の AI 否定権限
- R9 §51-2 浜田複数指示受領時の AI 1 つずつ確認


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
最終更新: 2026-04-26 v2.6 (P5-1 R1 §52-8-1 物理 block 層 / TSB-019 構造的根本対策 / ~/.cursor/hooks/dangerous-shell-blocker.sh / 三層防御確立)
このメモは C:\Users\mhamada202408224\Desktop\AI緊急用\CURSOR-トラブル対応メモ.txt
正本: kintone-ai-lab/chat-sessions/CURSOR-トラブル対応メモ.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
