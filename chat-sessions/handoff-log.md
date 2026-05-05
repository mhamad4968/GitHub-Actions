# 引き継ぎログ（短縮）

浜田さんはセッション切替時 **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文**を貼る（v3.27+ 正本）。`HANDOFF-HUMAN.txt` 5 行は **任意**。  
AI は、セッション切替・終了・浜田さんが引き継ぎテンプレを貼ったタイミングで **必ずこのファイルの末尾に新しいブロックを追記**する（追記のみ。過去ブロックは消さない）。

<!-- verify-constitution-handoff-anchor: TSB-024 v1 — DO NOT REMOVE (scripts/verify-constitution-handoff.mjs) -->

---

### 2026-04-26 19:25 JST

**浜田メモ（原文 / 本セッション内訓示）**:
> その辺はさっきもいいましたがあなたの役割です  
> 役割の理解はできていますか？  
> そこらへんの理解も含めてすべて引継ぎ時にしっかり理解してほしい。憲法やルール等が多々きめております

**経緯（簡潔 / §37）**:
- 新・PC 台帳 v1 §4.4 仕様揃え（共有用 自動生成ボタンを `共有 OR JR端末` で表示）→ `customize/new-pc-ledger-v1/desktop.js` 修正 → lint OK → push（`95bfbb6`）
- AI が締めで「再デプロイしてください / 手動アップロードでも OK」と書き **§35-1 / §56-1a 違反**（浜田指摘 ×2）
- 即訂正: `npm run deploy:674` を新設 + 実行 + 検証（live revision=9 / size 12004）+ push（`4e9a062`）
- 引き継ぎでも落ちないよう **物理ガード 4 ヶ所**追加: TSB-024 / NEW-SESSION-STARTER 最上段 🚨 / フェーズ 7 第 7 項 / 本ログ

**AI 補足（漏れ防止）**:
- `git`: `## main...origin/main` ahead 0（直前 push 済 / 本ターンの追記分は未 commit）
- `次の1手`: 本ターンの handoff / TSB-024 / NEW-SESSION-STARTER v3.18 / フェーズ 7 第 7 項 をまとめて 1 commit → push → `npm run session-starter:sync-desktop` → `npm run session:bootstrap` で機械検証
- `GO待ち`: なし（§52-9 範囲のドキュ整備 / 不可逆操作なし）
- `session-lock`: 未取得（憲法 5 ファイルを直接編集していない / NEW-SESSION-STARTER は復元・引継ぎ専用ドキュ）
- `関連パス`:
  - `docs/troubleshooting.md` **TSB-024**（アンチパターン全文 + 禁句リスト + 教訓 3）
  - `chat-sessions/NEW-SESSION-STARTER.md` v3.18 + 最上段 🚨 ブロック
  - `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7 第 7 項

**次セッションへの 1 行**: 開口一番に **役割宣言テンプレ（フェーズ 7 第 7 項）**を貼る。`deploy:<appId>` が未整備なら **AI が npm script を追加して実行**する（依頼しない）。`AGENTS.md §35-1 / §56-1a` 逆転禁止。

---

### 2026-04-26 19:37 JST

**浜田メモ（原文）**:
> 今回迷走してしまったことを反省し今後このようなことにならない仕組みを今日は作ってほしい。PC台帳系は今日はやらない。明日やることとします。

**経緯（簡潔 / §37）**:
- **PC 台帳コード・674 には未着手**（明日へ保留 / 本ターンは憲法・引き継ぎの **機械ゲートのみ**）
- `scripts/verify-constitution-handoff.mjs` 新設 + `npm run verify:constitution-handoff` + **smoke 第 9 検査**組込 + `session:bootstrap` 文言 9 連へ
- `.cursor/rules/constitution-handoff-gate.mdc`（`alwaysApply: true`）新設 + `session-handoff.mdc` に TSB-024 逆転禁止を追記
- `handoff-log.md` に **HTML アンカー**（`verify-constitution-handoff-anchor`）を恒久挿入
- `RULES-INDEX.md` セッション切替表に **TSB-024** 行追加、`docs/troubleshooting.md` TSB-024 の対策に **機械ゲート**追記
- `npm run smoke:quiet` = **ok 9 / warn 0 / ng 0**

**AI 補足（漏れ防止）**:
- `git`: 本ブロック追記後に commit 予定（未コミット）
- `次の1手`: 浜田: **Desktop の NEW-SESSION-STARTER_yyyymmdd.txt（JST・canonical）を開き直す**（`npm run session-starter:sync-desktop` 済前提）／明日: PC 台帳（Day5 予定）のみ
- `GO待ち`: なし
- `session-lock`: なし
- `関連パス`:
  - `scripts/verify-constitution-handoff.mjs`
  - `.cursor/rules/constitution-handoff-gate.mdc`
  - `scripts/smoke-test.mjs`（checks 配列 9 件目）

**次セッションへの 1 行**: `npm run session:bootstrap` が **9 検査**になったことを確認。憲法ドキュを削る編集後は必ず **緑**を取ってから Tier B へ。

---

### 2026-04-26 深夜 JST

**浜田メモ（原文）**:
> 明日やることはPC台帳が要件通りか確認→今日やる予定であったことで出来ていないことの対応→４/２７予定事項の実施ですね。今後はセッションを切り替えた際に今回のことにならないような仕組みで考慮もれはないですか？深く深く考えて再度検討し実行してほしい。

**経緯（簡潔 / §37）**:
- 明日オーダーを **`2026-04-27-pc-ledger-1b-one-by-one.md`「明日の公式オーダー」**に正本化（3 段: 要件確認 / 4/26 未完了 / 4/27 予定）
- **考慮漏れ対策（実装）**: `checkpoint-latest` **項番 0** = Read より前に `verify:constitution-handoff`／`session-bootstrap-verify` が **smoke 前に光速 verify**／`git-hooks/post-commit` が **commit 直後**に同検査＋ログ
- `SESSION-BOOTSTRAP` フェーズ 6・`constitution-handoff-gate.mdc`・`session-handoff.mdc`・`HANDOFF-HUMAN.txt` を同期
- `docs/troubleshooting.md` TSB-024 対策 **項 6** 追記

**AI 補足（漏れ防止）**:
- `git`: commit 直後（本ブロック後）
- `次の1手`: `npm run verify:constitution-handoff` && `npm run smoke:quiet` で回帰確認 → push → `session-starter:sync-desktop`
- `GO待ち`: なし
- `session-lock`: なし
- `関連パス`:
  - `scripts/session-bootstrap-verify.mjs`
  - `git-hooks/post-commit`
  - `chat-sessions/2026-04-27-pc-ledger-1b-one-by-one.md`

**次セッションへの 1 行**: チャット切替直後は **項番 0 → session:bootstrap**。**明日**は同ファイル「明日の公式オーダー」の **1→2→3**。

---

### 2026-04-27 JST — sessionStart hook で §51-6-2 の「1」「2」自動化

**経緯（簡潔）**:
- Cursor **`sessionStart`** 先頭で **`node .cursor/hooks/session-start-autopilot.mjs`** を実行。`npm run session:clock:set` を毎回走らせ、未稼働なら **`session:clock:watch`** をデタッチ起動（pid ファイルでシングルトン）。
- `session-clock-watch.mjs` に pid ロック、`verify-constitution-handoff` に `hooks.json` needle、`mandatory-read-gate` に `sessionStart hook` 文字列、`wipe-guard` CRITICAL に autopilot スクリプトを追加。
- `SESSION-SPLIT-REMINDER.md` / `checkpoint-latest.md` / `SESSION-BOOTSTRAP-CHECKLIST.md` / `session-handoff.mdc` を **hook が正本**と整合。

**AI 補足**:
- `次の1手`: 本変更を **1 commit** → 希望なら push → Desktop sync
- `関連パス`: `.cursor/hooks.json`, `.cursor/hooks/session-start-autopilot.mjs`, `scripts/session-clock-watch.mjs`

**次セッションへの 1 行**: 新 Composer では **`additional_context`** に自動済みが入る。**手打ち 1・2 は hook 無効時のみ**。

---

### 2026-04-27 JST — session:clock:health / 通知短文化 / crontab pin / bootstrap (1c)

**経緯**:
- **`npm run session:clock:health`** / **`verify:session-clock-health`**（`session:bootstrap` 1c 段追加）。`install-cron` が `logs/.session-clock-install-node` に node パスを保存 → ドリフト検知。
- 4h 通知タイトル・本文を短文化。`session-split-notify-audit.jsonl`（watch/cron・alerted/dup）。`SESSION_CLOCK_QUIET`、powershell 失敗ログ、Windows 用 `install-session-clock-windows.ps1`。
- `scripts/lib/session-clock-cron-node.mjs` 共通化、`desktop-notify` の darwin/win/console ベル経路整理。

**次セッション（引継ぎで覚えておくこと）**:
- **`npm run session:bootstrap` を通すと (1c)** で **`verify:session-clock-health`**（`scripts/session-clock-health.mjs --strict`）が **bootstrap 連鎖の中で自動実行**される。そこで **hooks（`hooks.json` 等）・crontab の session-split 行・install-pin（`logs/.session-clock-install-node`）と cron 行の node パス**を改めて機械確認できる。単発だけ欲しいときは **`npm run session:clock:health`** でも可。

**次の1手**: 項番 -0 の合意のあと **`session:bootstrap`**（上記 (1c) 同梱）。push は済（`8f08374`）。Desktop 控えは **`session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`** を checkpoint に従う。

---

### 2026-04-27 JST — 日終わり: セッション時計 WEB ＋予実レイアウト正本 ＋明日スターター

**経緯（簡潔）**:
- **セッション時計ローカル WEB**（`npm run session:clock:web`）: 30 秒更新が効かない件 → **Cache-Control: no-store**＋**`setInterval` で `location.reload()`**（`31ba08b`）。表示の経過が進まない件 → **各 GET 前に `node scripts/session-clock.mjs write-ticker`** を同期実行（`acf37c5`）。
- **予実たたき台**: Excel **新フォーマット**の列・行構造を `templates/yojitsu-budget-lite/docs/shin-format-excel-layout.md` に記載。`README.md` / `SPEC.template.md` からリンク（`24af3f8`）。
- **明日合意**: 4/28 は **十分な時間**で **予実の仕様のみ** を決める（案の詳細は明日ヒアリング）。**NEW-SESSION-STARTER v3.29**＝フル版に **次セッション優先**・**@ shin-format**・変更履歴を追記。**checkpoint-latest** の最終更新・浜田メモを同期。

**次セッションへの 1 行**: 新チャットは **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文** → **項番 -0** で「本題＝**予実仕様デイ**（または PC 台帳 CSV 側）」を確認 → **`session:bootstrap`** → `@shin-format-excel-layout.md` を予実の日は Read。

---

### 2026-04-28 JST — v3.30 一括（浜田「すべて承認」反映）

**経緯**:
- 前ターンの **P0–P3 案**を実装: 予実 **チェックリスト**・`shin-format` **二正本メンテ**・`SESSION-SPLIT` **WEB データ流 5 行**・`docs/session-clock-web-performance-notes.md`・`session-handoff` **日終わり例外**・`kintone-apps` **予実予定行**・`npm run yojitsu:excel-draft`（Python / openpyxl）。
- **セッション時計**: `session-clock-core.mjs` + `session-clock-write-ticker.mjs` に分離。**WEB は in-process** `writeTickerFile`（子プロセス廃止）。HTML に **TICKER mtime（UTC）**。
- `fmtDuration` の **分 floor** 挙動を **JSDoc** で明示（`session-clock-core.mjs`）。

**次セッションへの 1 行**: **v3.30** スターター＋`yojitsu-spec-session-checklist.md` を開き、**項番 -0** で予実本題 → `session:bootstrap` → 仕様合意後 **`kintone-apps` 1 行**を更新。

---

### 2026-04-28 JST — 朝: ブリーフィング + 健康100% + §51-4 誤警報修正

**浜田メモ（原文）**:
> 朝ブリーフィング / 健康診断100% / MCP・ツール更新（CURSOR.exe は自分で）

**経緯（簡潔）**:
- 新チャット: スターター受領。**項番 -0** は同一メッセージ内の依頼で本題合意済みと扱い **項番 0** へ。
- 初回 `session:bootstrap` は **SESSION-CLOCK 4h 超**で停止 → **`npm run session:clock:set`**（開始 2026-04-28 07:07 JST）後に **bootstrap 緑**（verify 連鎖 + Desktop sync + **smoke 10/10**）。
- **朝報** `docs/reports/2026-04-28-morning-prep.md` 読了: kintone:test・lint・audit・RAG 等 **緑**／旧ロジックの **§51-4 スコア7** は **watcher pid 再起動 + 単一 pid 連続保存**の誤検知と判明。
- **`scripts/parallel-session-detector.mjs`**: 軸1＝「3件以上の記録がある watcher_pid が **2 種類以上**」のときのみ +5。軸2＝同一5分窓に **複数 pid かつ 5件超** のときのみ +2。jsonl は **直近14日**に限定評価。→ **`npm run audit:parallel` 0点**・**`npm run smoke:quiet` 10/10**・**`npm run verify:all` 緑**。
- **`npm run health-check`**: 正常 23 / 異常 0。`npm run credit:status` 45% 記録（4/26）・通常運用継続。

**AI 補足（漏れ防止）**:
- `git`: 本ブロック＋並列検知修正・SESSION-CLOCK・RAG extra-docs 同期・朝報追跡を **commit 予定**。
- `次の1手`: 本題の **予実仕様デイ**（`shin-format-excel-layout.md` + `yojitsu-spec-session-checklist.md`）へ。PC 台帳 CSV との優先は checkpoint と §41 で再確認可。
- `GO待ち`: なし（本ターンは診断・検知ロジック修正のみ）。
- `session-lock`: なし。

**次セッションへの 1 行**: 新チャット直後は **時計 4h 超なら先に `session:clock:set`**。並列 **7点**が出たら **explain で軸内訳**を見てから判断（再起動残骸なら本修正後は静穏になる）。

---

### 2026-04-28 JST — 夕反省引き継ぎ正本（evening-reflect-queue）

**浜田メモ（原文）**:
> 夜の反省会で行うようにAI側で忘れずに引継ぎ出来るようにしておいてほしい。

**経緯（簡潔）**:
- **`chat-sessions/evening-reflect-queue.md`** 新設＝昼→夕の **固定正本**（チェックリスト形式）。
- **`scripts/evening-reflect.mjs`**: 雛形の **§1-M** にキュー全文を自動取り込み。**§1-L** 付近のテンプレ内バッククォート未エスケープを修正（SyntaxError 予防）。
- **`package.json`**: `npm run evening:reflect` エイリアス追加。
- **`HANDOFF-HUMAN.txt`**: AI 向けに正本パスと `npm run evening:reflect` を 1 行追記。
- **注意**: `evening-reflect.mjs` の D3 が **`NEW-SESSION-STARTER` の主タスク長表を自動サマリに置換**しうるため、**検証実行後は必要なら `NEW-SESSION-STARTER` を手で戻す**（本ターンは意図せぬ差分のため checkout 復元）。

**次セッションへの 1 行**: 夕方は **`npm run evening:reflect`** → 生成 md の **§1-M** と **`evening-reflect-queue.md`** を最初に読む → 消化したら正本で `[x]` か削除。

---

### 2026-04-28 JST — 午前終了（自律 Tier A 完・引継ぎ更新済み）

**浜田メモ（原文）**:
> 終わりましたら終わりと宣言してください。その後次のセッションへの引継ぎ準備をしてほしい。それで午前は終わりです。

**経緯（簡潔）**:
- **午前の本チャット**: 候補 verify 実行 → `smoke:quiet` が **audit:parallel ng**（jsonl で旧 watcher_pid **3 件**＋新 pid 多数が軸1 **+5**）。
- **修正**: `scripts/parallel-session-detector.mjs` 軸1に **副次件数床** `max(5,⌊主×12%⌋)` → 同条件で軸1 **0**・総点 **3（黄）**・smoke は **warn のみ**（**軸3**＝直近編集＋lock 不在で **+3** は残り）。
- **そのほか Tier A**: `audit-tsb-confirmed.mjs`（孤児 false 分離・名目/実質）／`evening-reflect-queue` の mcp-status **[x]**／`field-spec:diff` は **`--spec=docs/plans/2026-04-26-pc-ledger-day4-action.md`** ＋ snapshot で **44/44**。コミット例: `34b150f`（TSB 監査）`cd5a377`（軸1）。
- **引継ぎ**: `checkpoint-latest.md` **最終更新**＋本ブロック、`HANDOFF-HUMAN.txt` 5 行を **4/28 午前終了**用に更新。

**AI 補足（漏れ防止）**:
- `git`: 上記は **push 済み**（`main` 最新に軸1・TSB 監査含む）。本 handoff 追記を **commit/push** する。
- `次の1手`（午後）: **13:00 予実**（`shin-format-excel-layout.md` / checklist）。**夜**: `evening-reflect-queue` の朝報・読みやすさ。
- `GO待ち`: Tier B なし。
- `session-lock`: なし（憲法 5 ファイル直接編集なし）。

**次セッションへの 1 行**: 新チャットは **スターター全文** → **項番 -0** → **`session:clock:set`（4h 超なら先）** → **`npm run session:bootstrap`**；`smoke` が黄なら **軸3＝lock** を確認。

---

### 2026-04-28 JST — 本チャット終了（verify:agent-env・引継ぎ正本更新）

**浜田メモ（原文）**:
> よし、では引継ぎ準備ができたら終わりね。

**経緯（簡潔）**:
- **`npm run verify:agent-env`** 追加（`scripts/verify-agent-env.mjs`）＝憲法→必読ゲート→`verify:all`→`smoke:quiet`（Desktop 同期なし）。`mcp-tool-discipline`・`SESSION-BOOTSTRAP` フェーズ 6・`RULES-INDEX` §57-5・RAG 用 `RULES-INDEX` を同期。
- **自律エージェント向け環境改善**の文言整理（浜田端末ではなく **AI がリポで自走しやすい整え**が主語）。
- **引継ぎ**: `checkpoint-latest.md` **最終更新**、`HANDOFF-HUMAN.txt` 5 行、本ログを **本チャット終了**用に更新。実装 **`9685e74`** に続け **本 3 ファイルを 1 commit で push**。

**AI 補足**:
- `git`: 本ブロック＋checkpoint＋HANDOFF を **1 commit で push**（完了後 `git log -1` で確認）。
- `次の1手`: 上記 **次セッションへの 1 行** ＋ 任意 **`verify:agent-env`**。

**次セッションへの 1 行**: **`verify:agent-env`** で Tier A 健全性を一発確認できる（warn は smoke 従来どおり）。フル手順は **`session:bootstrap`**。

---

### 2026-04-28 JST — 部署予実（日程・マスタ案）＋Desktop「AI緊急用」1 ファイル集約（夜前）

**浜田メモ（要旨）**: 今日の作業をセッション切替後も分かるようまとめる。**Desktop\AI緊急用** は過去ファイルを削除し**最新版だけ**。**夜の反省会は約 20:00 JST** に再度入る（**セッションは変わる**）。

**経緯（簡潔）**:
- **部署予実（`templates/yojitsu-budget-lite/`）**: マイルストーン **4/29 アプリ作成（〜19:00 JST）**／4/30 項目確定／5/1 投入／5/2 機能／5/3 運用整理（`SPEC.md` §10.1）。**マスタ v1 は不要**（会社・工種・摘要は別アプリにしない。費用種別はドロップダウン）— `templates/yojitsu-budget-lite/docs/yojitsu-master-and-field-plan.md`・`SPEC.md` §6d。チェックリスト **§3b 読了 [x]**。関連コミット例: `7ffe29c` `218e2d5` `405124a` `de45591`。**`main` → `origin` は push 済み**。
- **Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用`**: `README.txt` / `HANDOFF-HUMAN.txt` / `SESSION-BOOTSTRAP-CHECKLIST.txt` / `NEW-SESSION-STARTER_20260428.txt` を削除。**残り 1 本**: `SESSION-HANDOFF-LATEST-2026-04-28.txt`（今日の全会話要約・20:00 再入場・儀式 4 ファイル復元手順・パス早見）。

**AI 補足**:
- `git`: 本ブロック＋`checkpoint-latest.md` **最終更新**を **commit / push**。
- `次の1手`（夜 **~20:00**）: **反省会**なら `evening-reflect-queue.md`／**予実続き**なら Desktop txt を貼って **項番 -0**。**`session:bootstrap`** 前に儀式用 `.txt` が必要なら **`npm run session-starter:sync-desktop`**（未復元だと `verify:desktop-ai-emergency-sync` が NG になり得る）。
- `GO待ち`: Tier B なし（4/29 kintone 作成まで）。

**次セッションへの 1 行**: **`SESSION-HANDOFF-LATEST-2026-04-28.txt`** を開くか全文貼る →（必要なら）**`session-starter:sync-desktop`** → **項番 -0** → **`npm run session:bootstrap`**。

---

### 2026-04-28 (Tue) JST 19:30 — 夜反省（§44）完了・運用開始 GO 受領・3 役連携の起点

**浜田メモ（要旨）**:
> 全部採用します。明日のセッション引き継ぎ書の更新はしました？ Desktop\AI緊急用 を最新版にして古いファイルは削除で OK。今日からは 3 名の連携プレイ等なども焦点になると思います。

**経緯（簡潔・本チャット 1 日分）**:
- **MCP 配線**: `~/.cursor/mcp.json` を WSL `npx` + 実在パッケージに修正（Kimi=`kimi-api-mcp`／DeepSeek=`mcp-deepseek`／OpenRouter=`@mcpservers/openrouterai`／`MOONSHOT_API_KEY`）。
- **憲法 v23.22**: **§50-3 CTO 運用規定**新設（コスト 2 レーン・**航海図 vs §51 実行**・**CEO 差し替え §50-3-3**・MCP 試行上限 3 回 or 5 分・サニタイズ・**検収コマンド併記 §50-3-6**・§41 一問 §50-3-7）。第15章 §51 に「§50-3 との関係」追記、`.cursorrules` + RULES-INDEX 同期。
- **憲法 v23.23**: **§1-2-3-3 CIO によるモデル最終判断**（CIO 未指定時は §1-2-3-1/2、明示時は CIO 優先・§35-1 不変）。**§51-6 遵守事項 5**＝切替直後の **`session:clock:set` 必須** + **`session:clock:web` URL を浜田にブラウザ開示**。§51-6-2 命令手順に「次セッション初手で遵守事項 5」追記。`NEW-SESSION-STARTER` 項番 4 ／ `SESSION-CLOCK.md` ／ `SESSION-SPLIT-REMINDER.md` ／ RULES-INDEX 同期。
- **`kintone-customize-deploy` 安定化**（赤の連発を収束）:
  - **路径**: 674 → `customize/new-pc-ledger-v1/desktop.js` 分岐（`deploy:674` の正本に整合）。
  - **APP 入力強化**: `KINTONE_APP` の **trim**、任意 **`KINTONE_CUSTOMIZE_SRC`** で路径上書き、`KINTONE_DEPLOY_APP_ID` を deploy/record に流用。
  - **paths**: `package.json` / `package-lock.json` を除外（依存更新だけで毎回赤くなるのを停止）。
  - **認証**: kintone 公式 [Update Customization](https://kintone.dev/en/docs/kintone/rest-api/apps/update-customization/) は API トークン不可 → `deploy-customize-api-token.js` を **ハイブリッド**化（**file=API トークン** / **preview & deploy=`KINTONE_USERNAME`+`PASSWORD`**）。ワークフローも対応 env を流す。
  - **結果**: run **#50 / Success / 21s**（commit `36a2793` 後）。674 に **`upload.js` 反映**を浜田目視 OK。
- **CEO 承認・運用開始 GO**: 検収コマンド `node scripts/verify-constitution-handoff.mjs` → **`✅ OK (憲法級ハンドオフ物理ガード健在)`**。
- **夜反省案 A〜H 全採用**（明日朝から **§57 改定プロセスで 1 件ずつ**実装。並列禁止 §51）:
  - **A** §51-2 並列風表現禁止句リスト（NG: 並行/同時に/3 人で/A・B・C）
  - **B** §41 一問先行テンプレ（kintone はアプリ ID／新規 or 既存／GitHub Environment 名を最初に確認）
  - **C** `session:bootstrap` 内に **`session:clock:set` の冪等内包**（post-commit 4h 警告の自爆防止）
  - **D** **TSB-025**「kintone customize 認証マトリクス」（file=トークン可 / preview customize=パスワード必須 / deploy=どちらも可）
  - **E** CI 赤再 push の **30 秒儀式**（§47-9 補強：失敗ログ Read → §41 一問 → 1 commit）
  - **F** §56 RACI に **CEO=浜田 / CTO=AI / CIO=浜田 兼務** を追記（モデル選択は CIO・コマンド実行は CTO・GO は CEO）
  - **G** 夜の 30 秒反省会テンプレ（5 行以内 / 良かった 1・反省 1・明日の 1 手）
  - **H** 朝報 §0 にコスト 2 レーン枠（数値はダッシュボード正本、朝報は 2 行表示）
- **Desktop メンテ（本ターン実施）**: 手前で `checkpoint-latest.md` / `HANDOFF-HUMAN.txt` を **本日 19:30 JST 反映**へ更新 → **`npm run session-starter:sync-desktop`** → 旧 **`SESSION-HANDOFF-LATEST-2026-04-28.txt` を削除** → **`npm run verify:desktop-ai-emergency-sync`** で機械整合確認。**儀式 4 ファイル**（`NEW-SESSION-STARTER_20260428.txt` / `SESSION-BOOTSTRAP-CHECKLIST.txt` / `HANDOFF-HUMAN.txt` / `README.txt`）に整理。

**反省点（明日朝の §57 改定で吸収）**:
- 「3 人で対応」など **並列風表現** → A 採用済。
- Secret 手順を A/B/C 並列で出した → A 採用済（1 つずつ）。
- アプリ ID（674）確認前にコード分岐を書いた → B 採用済。
- ワークフロー失敗を短時間に複数 commit → E 採用済。
- post-commit が壁時計 4h 超で警告（§51-6-2 自分の運用未踏） → C 採用済。
- kintone preview customize の認証仕様を最初に出せず → D 採用済。

**AI 補足（漏れ防止）**:
- `git`: 本ブロック＋`checkpoint-latest.md`＋`HANDOFF-HUMAN.txt`＋（Desktop sync は git 外）を **1 commit で push**。
- `次の1手（明朝 / 4/29 水）`: 新チャット → スターター全文 → 項番 -0 → **`session:clock:set`** → **`npm run session:bootstrap`**。OK 後、**A〜H を § 番号順に 1 件ずつ §57 で反映**（A→B→C→D→E→F→G→H）。**4/29 19:00 までに kintone アプリ作成のスペース決定**（CEO §41）。
- `GO待ち`: Tier B なし（A〜H は CEO 全採用済）。kintone 本番書込・PC 台帳作業は **朝の §41 確認後**。
- `session-lock`: 本ターンで憲法 5 ファイル直接編集あり（`AGENTS.md` / RULES-INDEX / `NEW-SESSION-STARTER` / `SESSION-CLOCK` / `SESSION-SPLIT-REMINDER`）。lock holder=`agents-50-3-ceo-2026-04-29` は **既に release 済**（前ターン）。

**次セッションへの 1 行**: スターター全文 → 項番 -0 → **`session:clock:set`** → **`npm run session:bootstrap`** → A〜H を **1 件ずつ** §57 で反映（並列禁止）。

---

### 2026-04-28 (Tue) JST 21:35 — kintone 632 完全復旧 + CIO 体制制定（21:00-21:35 延長セッション）

**浜田指示（要旨・時系列）**:
> 「632 が 4/25 分が上がってない」→「3 人で協力して」→「並列禁止」→「CIO で判断していい案件」→「アカウント情報も渡してある」→「自律で進めろ」→「作成は一気通貫、確認は浜田」→「OK」

**経緯（簡潔）**:
1. **真因特定**: 632 に target_week=2026-04-20 の $id=4 は存在（4/24 cron success 分）、ただし `summary_one_line` 等 6 フィールドが kintone アプリ側で未作成 → 一覧で「空」に見えた = サイレント部分欠損
2. **kintone GUI 側追加**: CIO 自律で password 認証 `preview/app/form/fields.json` POST → `deploy.json` POST → polling SUCCESS 確認 → 6 フィールド (`summary_one_line`, `internal_ref_news_count`, `internal_ref_record_id_min/max`, `internal_analysis_run_at`, `internal_github_run_id`) 追加完了 (rev 7→8)
3. **analyze 再実行 1 回目**: GAIA_AP15 (APIトークンとアプリ不一致)
4. **切り分け**: ローカル CLI で同 token PUT → 200 OK = ローカル token は 632 用で正常 → GitHub Secret 側ミスマッチと特定
5. **Secret 更新 1 回目**: `gh secret set KINTONE_API_TOKEN_ANALYZE` → 反映確認 (12:27:29Z)
6. **analyze 再実行 2 回目**: なお GAIA_AP15
7. **Secret 一覧解析**: `KINTONE_APP=2026-04-28T10:18:51Z` 更新を発見 → 朝に customize-deploy 用に **`KINTONE_APP=632`** に書き換えていた → analyze は `KINTONE_APP_ID=632` で起動して collect token (631 用) で 632 を読みに行き失敗
8. **Secret 復元**: `KINTONE_APP=631` に戻す
9. **analyze 再実行 3 回目**: **success 38s** → **新規 $id=5 (target_week=2026-04-27) が 6 フィールド完備で生成**（summary_one_line / internal_run_at=2026-04-28T21:32+09:00 / run_id=25052937094 / ref_news_count=9 / ref_id 240-249）

**CIO 体制制定（NEW-SESSION-STARTER.md 永続化・2 回更新）**:
- **役割**: CIO=本体 AI / Kimi=実務 / DeepSeek=知恵袋 / OpenRouter=保険 / 浜田=依頼者・確認者
- **「実行と確認の分離」**(CEO 21:35 直命): 作成・実装・実行・記録更新は CIO 自律で 1 ターン一気通貫 OK / §41 一問必須は「データ破壊大 / 費用嵩む / 仕様判断要」の 3 つだけ / 検収は浜田
- **CIO 自律権限**: GitHub Secret 更新・kintone REST 書込・workflow_dispatch・記録更新（破壊的でない限り GO 不要）

**§57 改定キュー（明日朝着手・優先度順）**:
- 既定 A〜H (昨晩 CEO 全採用)
- **新 I**: CIO 体制を §56 に正式追記（NEW-SESSION-STARTER の暫定永続化を本式化）
- **新 J**: `analyze.ts` に「期待フィールド存在 fail-fast」追加 (kintone REST のサイレント無視防止)
- **新 K**: kintone polling コードの `apps[0]` URL エンコード共通化 → TSB-027
- **新 L 最重要**: `KINTONE_APP` Secret 二重利用解消（`KINTONE_APP_FOR_COLLECT=631 固定` / `KINTONE_APP_FOR_DEPLOY=動的` に分離）— 今回の事故の恒久対策

**MCP 利用**: 0 円（構造的問題のため CIO 単独完結）

**残未処理（任意・浜田判断）**:
- $id=3 (4/13 週), $id=4 (4/20 週) のバックフィル — 来週以降の運用には影響なし

**AI 補足（漏れ防止）**:
- `git`: 本ターンの変更（NEW-SESSION-STARTER.md 2 回更新 + checkpoint + handoff + HANDOFF-HUMAN）を **1 commit で push**
- `次の1手（明朝 / 4/29 水）`: §57 改定 A→B→C→D→E→F→G→H→I→J→K→L の順で 1 件ずつ
- `GO待ち`: Tier B なし（CIO 自律権限の範囲内）
- `kintone 632 検収`: 浜田の目視確認待ち（依頼者ロール）

**次セッションへの 1 行**: スターター全文 → 項番 -0 → **`session:clock:set`** → **`session:bootstrap`** → §57 改定 **A〜L を 1 件ずつ** 順次反映（並列禁止 §51）。

---

### 2026-04-29 (Wed) JST 06:58 — CEO 浜田朝指示・5 強化要件を Cursor 流に統合（新セッション 1 ターン目）

**浜田指示（要旨）**:
> あなたが Claude Code v2.1.111 以上の環境で動作していることを確認してほしい。最新の最適化機能をフル活用し、最新仕様（v2.1.111準拠）に基づき動作環境と憲法（.cursorrules）をアップデートしてほしい：
> ① Effort=xhigh デフォルト ② Context=1M 俯瞰 ③ Permissions=fewer-permission-prompts ④ 航海図 3 要素（Goal/Constraints/Acceptance）必須 ⑤ Stop Hook で検証義務化 ⑥ MCP 厳格委譲（Kimi/DeepSeek/OpenRouter）

**CIO 開口の事実訂正（§47 鵜呑み禁止）**:
- WSL に **Claude Code CLI v2.1.114** インストール済（要求 v2.1.111 以上を充足）
- ただし **本セッションの AI = Cursor IDE 内の Claude Opus 4.7**（CLI とは別プロセス）
- `/fewer-permission-prompts` 等は CLI 固有 → 私には直接適用不可
- しかし CEO の 6 強化目的は **Cursor + 既存憲法 (§1-2-3 / §50-3 / 昨夜制定 CIO 体制) で同等達成可能** と CIO 判断 → Cursor 流に翻訳して即実装

**航海図（Goal / Constraints / Acceptance）**:
- **Goal**: 5 強化要件を `.cursorrules` + `NEW-SESSION-STARTER.md` に統合 + §57 改定キューに新 M 登録 + 1 commit push
- **Constraints**: §47-E 事実歪曲禁止 / §35-1 役割逆転禁止 / §51 + 並列 5 点チェック / CIO 体制（実行と確認の分離） / §50-3-1 出力閾値 / §50-3-5 サニタイズ
- **Acceptance**: (1) 5 ファイル編集完了 (2) Desktop 同期 byte 一致 (3) `verify:constitution-handoff` exit 0 (4) commit + push (5) 「憲法適合済み: [検証コマンド名]」併記 (6) CIO 決意の表明

**実装（CIO 自律・直列・一気通貫）**:
1. `.cursorrules` 冒頭に **「🎖️ CEO 4/29 朝指示・CIO 5 強化要件」**セクション新規追加（前提整理 + 1〜5 の Cursor 流実装 + NEW-SESSION-STARTER への参照）
2. `NEW-SESSION-STARTER.md` の CIO 体制ブロック内に **「📐 CEO 4/29 朝指示・5 強化要件」**最小参照を追加（次セッションでも自動再認識）
3. `checkpoint-latest.md` 最終更新を 4/29 朝のブロックに置換
4. 本ファイル末尾追加（このブロック）
5. `HANDOFF-HUMAN.txt` 5 行更新
6. Desktop 同期 (`session-starter:sync-desktop` + `verify:desktop-ai-emergency-sync`)
7. 検収 (`npm run verify:constitution-handoff`)
8. 1 commit + push

**§57 改定キュー（CIO 管理・優先度更新）**:
- **新 M（最優先・本日朝の CEO 直命）**: CEO 4/29 朝指示の 5 強化要件を `AGENTS.md` §50-3 に正式統合（`.cursorrules` の暫定永続化を本式化）
- A〜H（4/28 夜 CEO 全採用）
- 新 I（CIO 体制 §56 正式追記）/ 新 J（analyze.ts フィールド存在 fail-fast）/ 新 K（kintone polling URL エンコード共通化 → TSB-027）/ 新 L（KINTONE_APP Secret 二重利用解消・最重要）

**MCP 利用**: 0 円（憲法ドキュ更新のため CIO 直轄・外部 MCP 不要）

**AI 補足（漏れ防止）**:
- `git`: 5 ファイル（.cursorrules + NEW-SESSION-STARTER + checkpoint + handoff-log + HANDOFF-HUMAN）を **1 commit で push**
- `次の1手`: §57 改定 **M → A → B → ... → L** の順（1 件ずつ）。本日の CEO 指示が最優先
- `GO待ち`: なし（CIO 自律権限内・憲法ドキュ更新のみ）
- `Tier B`: なし

**次セッションへの 1 行**: スターター全文 → 項番 -0 → `session:clock:set` → `session:bootstrap` → §57 改定 **M → A〜L** を 1 件ずつ反映（並列禁止 §51）。`.cursorrules` 冒頭の CIO 5 強化要件と NEW-SESSION-STARTER.md の CIO 体制ブロックを必ず再認識。

---

## 2026-04-29 (Wed) JST 07:15 — Phase A（CLI 確認）+ Phase B（再発防止スクリプト化）完了

**ティア判定**: §1-2-3-1 = L2 Opus 4.7 1M Extra High（憲法級ドキュ＋スクリプト追加 / Tier A）

### CEO 朝指示 3 点（07:14 JST 受領）への対応

| # | 指示 | 結果 |
|---|---|---|
| 1 | CLI v2.1.111 以上準拠の確認 | ✅ v2.1.114 インストール確認。`--effort xhigh` / `--permission-mode bypassPermissions` / `fewer-permission-prompts` skill すべて存在。`~/.claude/settings.json` は空 (`{}`)。**CEO 判断「CLI 直接起動しない・AI 側運用確立済で OK」で永続化不要に確定** |
| 2 | 反省・仕組み見直し（並列発火事故の恒久対策） | ✅ 完了 push 済（commit `59b4bab`）|
| 3 | §57 改定 M（CEO 4/29 朝指示の §50-3 統合）「進めて OK」 | **保留**（CEO「のちほど確認」を受けて Phase C は CEO 確認待ち） |

### Phase A 結果（CLI v2.1.114 事実確認）

- CLI: `claude --version` = v2.1.114 ✅（要求 v2.1.111+ 充足）
- `--effort` choices: `low/medium/high/xhigh/max` ✅
- `--permission-mode` choices: `acceptEdits/auto/bypassPermissions/default/dontAsk/plan` ✅
- `~/.claude/settings.json`: `{}`（空・最適化未永続化）
- CEO 判断: **本セッション AI = Cursor 内 Opus 4.7 が `.cursorrules` 冒頭の CIO 5 強化要件と既存憲法（§1-2-3-2 / §50-3 / §51 / §52-8）で同等以上達成済 → 追加対応なし**

### Phase B 結果（並列発火事故の恒久対策）

#### 反省（CIO 自己分析）

- **認知バグ**: 「並列 5 点チェック ✅」と冒頭で宣言しながら、`sync→verify` を「副作用ゼロ」と誤判定して並列発火 → verify NG（HANDOFF-HUMAN.txt / README.txt 不一致）
- **真因**: チェックが人間の主観に依存。「どのコマンドが副作用か／依存か」の機械的紐付けがなかった
- **構造的弱点**: 同じ罠は次セッションの CIO（自分含む）も踏む可能性が高かった

#### 恒久対策（実装）

| # | 変更 | 効果 |
|---|---|---|
| 1 | `package.json` に `npm run desktop:sync-and-verify` 追加（`session-starter:sync-desktop && verify:desktop-ai-emergency-sync`） | 単一コマンド = 並列発火の余地ゼロ |
| 2 | `chat-sessions/NEW-SESSION-STARTER.md` の並列 5 点チェック「副作用ゼロか」「依存関係ゼロか」項目に**コマンド名そのもの**を NG 例として明記（2026-04-29 朝の事故を実例として記録） | 次セッションの CIO も同じ罠を回避 |

#### 検収（憲法適合済み: `npm run desktop:sync-and-verify`）

```text
[verify-desktop-ai-emergency-sync] OK NEW-SESSION-STARTER_20260429.txt
[verify-desktop-ai-emergency-sync] OK SESSION-BOOTSTRAP-CHECKLIST.txt
[verify-desktop-ai-emergency-sync] OK HANDOFF-HUMAN.txt
[verify-desktop-ai-emergency-sync] OK README.txt
[verify-desktop-ai-emergency-sync] ✅ 全ファイル一致
```

| 項目 | 値 |
|---|---|
| commit | `59b4bab` (chore(safety): add desktop:sync-and-verify combined script + 並列5点チェックに sync→verify NG 例を明記) |
| push | ✅ `93afb00..59b4bab  main -> main` |
| 変更ファイル | `package.json` + `chat-sessions/NEW-SESSION-STARTER.md`（1 commit 1 意味）|
| §51-3 lock | 取得 → release 済 |

### ⚠️ 異常検知 NG 2 件（Phase C 着手前に要対応・CEO 確認待ち）

post-commit hook が以下 2 件を NG 検知（**Phase B の commit 内容自体は OK**、リポ全体の整合性として要対応）。

| # | 検知 | 内容 | 原因仮説 |
|---|---|---|---|
| 1 | `verify:constitution-handoff` NG | `NEW-SESSION-STARTER.md` 冒頭 5200 文字に「(7) 役割宣言」見出しが**消えている** | 私の編集箇所（71 行目）と異なる**上部**で改変が起きた形跡（私の編集ではない） |
| 2 | `session-clock` NG | `SESSION-CLOCK.md` の開始時刻が `2026-04-28 21:29` に書き換わり、「2026-04-29 浜田 CIO 注意書き」も**削除**されている | 私の編集ではない（git 履歴調査要） |

**CIO 仮説**: 昨夜（4/28 21:29 JST）以降、私が知らない別経路で `SESSION-CLOCK.md` と `NEW-SESSION-STARTER.md` 冒頭が**一部巻き戻った**可能性。`git reflog` / `git log -- chat-sessions/...` での調査が必要。

### Phase C（§57 改定 M）保留状況

- 改定 M = CEO 4/29 朝指示の 5 強化要件を `AGENTS.md` §50-3 へ正式統合
- 暫定対応済（昨日 commit `93afb00`）: `.cursorrules` 冒頭 + `NEW-SESSION-STARTER.md` 内の最小参照
- 未実施: `AGENTS.md` §50-3 本文への正式追記（§57-1〜§57-6 改定プロセス遵守）
- ブロッカー: 上記異常 2 件を解消しないと §57-5 検証で確実に NG
- 推奨着手順: (1) 異常 2 件の原因特定・復元 (2) `session:clock:set` で壁時計リセット (3) Phase C 着手

### CIO 今後の運用宣言（再発防止）

- ✅ 並列発火前は **必ず**「並列 5 点チェック」を機械的に通す（コマンド名ベースで判定）
- ✅ sync→verify 系は今後 **`npm run desktop:sync-and-verify` を必ず使う**（個別呼出禁止）
- ✅ 憲法級ファイル（`AGENTS.md` / `RULES-INDEX.md` / `NEW-SESSION-STARTER.md` / `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md`）の編集前は **必ず session-lock 取得 → release**
- ✅ 異常検知時は **即停止して報告**、CEO 確認後に修復着手

**MCP 利用**: 0 円（CIO 単独完結）

**AI 補足（漏れ防止）**:
- `git`: 4 ファイル（package.json + NEW-SESSION-STARTER + 報告書新規 + checkpoint + handoff-log + HANDOFF-HUMAN）を **本ターン Phase B + 報告書面化の 2 commit で push**
- `次の1手`: CEO 確認後 → 異常 2 件の原因特定・復元 → Phase C（§57 改定 M）→ A〜L を 1 件ずつ
- `GO待ち`: 異常 2 件の対応方針 / Phase C 着手タイミング / 本日の優先タスク
- `Tier B`: なし（修復・改定すべて Tier A）

**次セッションへの 1 行**: 異常 2 件（NEW-SESSION-STARTER 冒頭「(7) 役割宣言」消失・SESSION-CLOCK 巻き戻り）を必ず確認し、`docs/reports/2026-04-29-morning-phase-b-completion.md` を Read してから着手。

---

## 2026-04-29 (Wed) JST 07:30 — 異常 2 件の真因特定・復元・恒久対策完了 (TSB-026)

**ティア判定**: §1-2-3-1 = L3 Opus 4.7 1M Max Thinking（**真因究明 = 不可逆／構造バグ調査** / Tier B 直前判定）

### CEO 直命

> 「異常検知 NG 2 件は対応し恒久対策までお願いします」（2026-04-29 07:20 JST）

CIO 自律で「実行と確認の分離」を適用し、調査 → 復元 → 恒久対策 → 検証 → TSB 起票まで一気通貫。

### 真因究明（CIO 自己反省ポイント）

**最初の仮説（誤り）**: 「悪意ある書き換え／別経路ロールバック／私の知らない誰か」

**真因（事実）**: **両方とも設計上の構造バグ**

| 異常 | 真因 | 機械的書換の仕組み |
|---|---|---|
| 1. NEW-SESSION-STARTER 冒頭 needle 消失 | `verify-constitution-handoff.mjs` は `headChars: 5200` で needle 検査するが、私の累積編集（4/28 夜 CIO 体制 + 4/29 朝 5 強化要件 + 4/29 朝 sync→verify NG 例）で冒頭が **10396 文字に肥大化** → `(7) 役割宣言` (line 110) が閾値超過位置に押し出された | 編集の累積による冒頭肥大化 |
| 2. SESSION-CLOCK 巻き戻り | `scripts/session-clock.mjs` の `writeClock()` (line 45-58) が **`HEADER + 開始:` で全文置換**。HEADER 定数に「2026-04-29 浜田 CIO 注意書き」は含まれていなかった → `set` のたびに人間追記が消える | HEADER 全置換書込（自動削除設計） |

**CIO の最初の仮説が誤っていた理由**: §47-E 事実歪曲禁止を本来適用すべきだった。`git log -p` / `git reflog` / 関連スクリプト本体を**読まずに**「謎の改変」と早合点した。20 分の調査で両方とも設計バグと判明。

### 復元 + 恒久対策（実装内容）

#### 異常 1: `(7) 役割宣言` 冒頭永続化

- `chat-sessions/NEW-SESSION-STARTER.md` line 24 周辺に **1 行要約**を新設（既存 line 110 のコードブロック自己宣言は後方互換で残置）
- §51-3 lock 取得 → release 済（`cio-2026-04-29-tsb026-restore`）
- `verify:constitution-handoff` → exit 0 ✅

#### 異常 2: `session-clock.mjs` HEADER に永続化

- `scripts/session-clock.mjs` の `HEADER` 定数に「2026-04-29（浜田 CIO）注意書き」を追加
- HEADER 内に明示: 「人間注意書きの追記はここ（scripts/session-clock.mjs の HEADER 定数）に行うこと」
- `npm run session:clock:set` 実行で `SESSION-CLOCK.md` を**注意書き含む状態で再生成**することを実機確認 ✅
- 開始時刻: `2026-04-29 07:25` (Asia/Tokyo) にリセット → `verify:mandatory-read-gate` exit 0 ✅

#### TSB-026 起票

- `docs/troubleshooting.md` に **TSB-026: 機械的書換による「人間注意書き」の構造的消失** を新規追加
- 目次にも 1 行追加（全 24 件中 root_cause_confirmed 23 件 ~96%）
- 関連 TSB: TSB-024（要約耐性）/ TSB-016（BREAKING 削除が undone）— 「機械的書換で人間制御が失われる」共通系列

### 検収（憲法適合済み: `npm run verify:constitution-handoff && npm run verify:mandatory-read-gate`）

```text
[verify-constitution-handoff] ✅ OK (憲法級ハンドオフ物理ガード健在)
[mandatory-read-gate] ✅ OK
[verify-desktop-ai-emergency-sync] ✅ 全ファイル一致（4 ファイル）
```

### CIO 教訓（次回以降）

1. **「冒頭 N 文字 needle 検査」は冒頭物理位置に依存**。文書を肥大化させるときは `verify` 検査位置の維持を機械的に意識する（commit は通り post-commit hook で警告のみ → 黙って違反する状態）
2. **「全置換書込スクリプト」は本文ではなく HEADER 定数を正本とせよ**。書込先のファイル本文に人間注記を置かない設計原則を徹底する
3. **異常検知時に「悪意ある書換」を仮説の最初に置かない**。まず `git log -p` / 関連スクリプトの書込ロジックを**読んで事実確認**する（§47-E 事実歪曲禁止）。CIO は本件で「謎の改変」と最初書いたが、20 分の調査で**設計バグ**と判明した。この反省は本セッションの 2 度目の自己批判（1 度目: sync→verify 並列発火事故）

**MCP 利用**: 0 円（CIO 単独完結・憲法ドキュ + scripts のみ）

**AI 補足（漏れ防止）**:
- `git`: 7 ファイル（scripts/session-clock.mjs + NEW-SESSION-STARTER + SESSION-CLOCK + docs/troubleshooting + checkpoint + handoff + HANDOFF-HUMAN）を **1 commit で push**
- `次の1手`: Phase C（§57 改定 M）は引き続き CEO 確認待ち。本日中に着手するか、別タスク（L = KINTONE_APP Secret 分離 / §41 = 4/29 19:00 までの kintone 部署予実アプリのスペース決定）を優先するかは CEO 判断
- `GO待ち`: なし（CIO 自律権限内・CEO 直命範囲内で完結）
- `Tier B`: なし

**次セッションへの 1 行**: TSB-026 で異常 2 件は完全解消・恒久対策済。次は §57 改定 M（CEO 4/29 朝指示の §50-3 統合）または優先順位 CEO 判断。`scripts/session-clock.mjs` HEADER は今後追記してはならない（HEADER 全置換特性）。

---

## 2026-04-29 (Wed) JST 13:18 — 引継ぎ準備完了（ゲート緑・継続可）

**ティア判定**: §1-2-3-1 = L2 Extra High（記録更新 + 壁時計リセット + verify 再実行）

### CEO ご質問への回答

> 「ミスとかバグはいいけど解消してるのか解消していなのであれば解消させる必要があるよね。セッション切替はいいけど継続処理しなければいけないのは引継ぎ準備は出来ているのか？」

**回答**:

1. **TSB-026 の真因（設計バグ 2 件）はリポ上で解消済み**（`7581e00`）。`verify:constitution-handoff` は常時 exit 0 を維持。
2. **午後に一時的に「未解消」に見えたもの**は、`verify:mandatory-read-gate` が §51-6-2（壁時計 4h 超）で exit 2 になった点であり、**バグではなく仕様通り**。
3. **継続のための解消**: `npm run session:clock:set` を再実行（開始 **2026-04-29 13:17** JST）→ **`verify:mandatory-read-gate` exit 0** を再取得。
4. **引継ぎ準備**: `checkpoint-latest.md` 最終更新・`HANDOFF-HUMAN.txt` 5 行・本 handoff 末尾・`SESSION-CLOCK.md` を更新済み。新チャットは項番 -1 → -0 → **AI が `session:clock:set` + `session:clock:web` URL 提示** → `session:bootstrap`。Desktop は `npm run desktop:sync-and-verify`。

**検収（憲法適合済み: `npm run verify:constitution-handoff && npm run verify:mandatory-read-gate`）**: 両 exit 0。

**次セッションへの 1 行**: スターター全文貼付 → 項番 -0 → AI が壁時計 set+web → `session:bootstrap` → Phase C / L / §41 は CEO 優先順位に従う。

---

### 2026-04-29 (Wed) JST 13:35 — CIO: smoke 2 件解消・`session:bootstrap` 緑回復（浜田 CEO 指示）

**浜田メモ（原文）**: 「上記2点をCIO判断で完了をまずさせて。その後今日やることを済ませてその後問題点の解消をしようか」

**AI 補足（漏れ防止）**:
- `git`: `main` 上で `scripts/check-mcp-dormancy.mjs` / `scripts/parallel-session-detector.mjs` / `chat-sessions/checkpoint-latest.md` / `HANDOFF-HUMAN.txt` / `evening-reflect-queue.md` / `handoff-log.md` を **同一 commit 予定**（`.rag`・`templates` 等の既存ローカル変更は **含めない**）
- `次の1手`: CEO **本日優先順位**確定後 → **§57 改定を 1 件ずつ**（Phase C / L / §41 の順は CEO 判断）。任意: `daily-morning-prep.mjs` で朝報再生成（evening-reflect-queue 参照）
- `GO待ち`: Tier B なし。**§57 憲法改定の中身**は CEO 確定後に着手
- `session-lock`: なし
- `関連パス`: `scripts/check-mcp-dormancy.mjs` / `scripts/parallel-session-detector.mjs` / `chat-sessions/checkpoint-latest.md`

**検収（憲法適合済み: `npm run session:bootstrap`）**: exit 0（`smoke:quiet` 10/10 ok）

**次セッションへの 1 行**: bootstrap 緑維持。次は CEO 優先順位 → §57 1 件ずつ。並列検知の閾値変更は **真の均衡並列**では従来どおり上がり得るため、朝報の古い §51-4 数値は **再生成または翌 cron** で追随可。

---

### 2026-04-29 (Wed) JST 16:25 — セッション終了引継ぎ（浜田 ~19:00 までシャットダウン）

**浜田メモ（原文）**: 「では19：00くらいまでシャットダウンするのでセッション終了の引継ぎ準備を行って報告してほしい。」

**AI 補足（漏れ防止）**:
- `git`: `main...origin/main`。**未コミット変更が多い**（例: `AGENTS.md` / `RULES-INDEX.md` / `chat-sessions/NEW-SESSION-STARTER.md` / `chat-sessions/checkpoint-latest.md` / `chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` / `.cursor/rules/session-handoff.mdc` / `.rag/extra-docs/*` / `kintone-apps.md` / `templates/yojitsu-budget-lite/docs/*` / `docs/plans/*` / `chat-sessions/SESSION-CLOCK.md` 等）。**再開後**: 内容を確認し **commit 単位**を CEO/CIO で決めてから push 推奨（混在コミット回避）。
- `次の1手`: **~19:00 JST 再開** — Desktop **`NEW-SESSION-STARTER_20260429.txt` 全文**（貼付推奨は `verify:desktop-ai-emergency-sync` 最終行）→ **項番 -0**（本題＝**部署予実 5A** 等を §41 一問）→ **`npm run session:clock:set`**（hook 無効時のみ手動）→ **`npm run session:clock:web`**（URL をチャット転記・浜田ブラウザ）→ **`npm run session:bootstrap`**。予実/kintone/計算ロジック/複雑 customize に入る**直前**に **`§50-3-8`**（DeepSeek 盲点3点＋**約3行突合メモ**・**新チャットでは必ず再実行**）。**kintone アプリ作成**前は **配置スペース**（`.cursor/rules/creation-timing-ask.mdc` §41）。
- `GO待ち`: **Tier B**（`kintone-add-app` 等）は従来どおり **浜田 GO 後に CIO が実行**。スペース未決なら作成着手しない。
- `session-lock`: なし
- `関連パス`: `AGENTS.md`（§50-3-8）/ `chat-sessions/NEW-SESSION-STARTER.md`（v3.32）/ `templates/yojitsu-budget-lite/SPEC.md` §10.1

**検収（憲法適合済み: `npm run verify:constitution-handoff`）**: exit 0（本ターン実施）。

**Desktop（CIO 義務）**: `npm run session-starter:sync-desktop` → `npm run verify:desktop-ai-emergency-sync` を実施し、結果をチャット報告に含める（`/mnt/c` 不在時は SKIP＋理由 1 行）。

**次セッションへの 1 行**: ~19:00 再開 → スターター全文 → -0 → 壁時計 set+web → bootstrap → **§50-3-8** → 予実本題（5A）／未コミットは再開後に整理 commit。

---

### 2026-04-30 (Wed) JST — §50-3-9 運用反映（提案 A–E）＋ `tmp-kintone-*` 証跡

**AI 補足（§50-3-9 証跡）**: **`scripts/tmp-kintone-*.mjs` は本セッションでは未作成**（該当なし）。

**実施内容（要約）**:
- **A**: `docs/plans/2026-04-26-pc-ledger-day4-action.md`「AI 引継ぎ」に **§50-3-9 補足（項番 6）** を追記。
- **B**: `chat-sessions/checkpoint-latest.md` に **部署予実・航海図テンプレ**（Goal / 手段1 MCP / 手段2 REST / Constraints / Acceptance）を新設。
- **D+E**: `AGENTS.md` §50-3-9 に **証跡（チャット or `handoff-log` 1 行）**および**期待値の言語化**を追記（`.rag/extra-docs/AGENTS.md` 同期）。`SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1c** に §50-3-9 段落。
- **C**: リポ差分を **`[FEAT] v23.25 §50-3-9 運用反映・yojitsu・checkpoint`** で **commit / `origin/main` push 済み**（`384a195`）。続けて push 記録の追記のみ **`b214144`**。

**次セッションへの 1 行**: 航海図に **手段(第2)=REST** を先に並べる。**§50-3-9**・**§50-3-8**（フィールド・計算・複雑 customize 着手直前）をセットで実行。

---

### 2026-04-30 (Wed) JST — PC 台帳仕様 GO（個人×保管・廃棄削除）

**浜田メモ（要約）**: GO。**廃棄**はデータ不要のため 594 から削除。**保管 PC** は個人種別のままアカウント情報なしで移行希望。

**AI 補足（正本）**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` に **§4.1a（個人×保管）**、**§4.4 / §4.5** の表示条件、**§7.4.3**（廃棄＝594 削除・627 紐付け整理は浜田）、**§7.4.6・§8.1** の B-1 生成文言、**§13** 改訂履歴を追記。**§4.2.0** の 595 一文を §4.1a と整合。

**次の一手**: 674 の **`user_name` 必須**が CSV 空欄と両立するか確認 → 要なら **Tier B GO** のうえフォーム調整。**`customize/new-pc-ledger-v1/desktop.js`** に **保管個人のアカウント非表示・個人用自動生成の表示条件**を実装。**B-1 CSV** は JOIN 分岐を仕様どおり実装。

**検収（憲法適合済み）**: ドキュ追記のみのため **該当 npm 未実行**（次ターンの `session:bootstrap` 等で可）。

**次セッションへの 1 行**: 仕様は §4.1a 正本済み → customize + 674 必須緩和 + B-1 スクリプトを順に。

---

### 2026-04-30 (Wed) JST — B-1 GO: 674 取込ドラフト CSV + マッピング表 v0

**浜田メモ**: GO。

**実施内容**:
- `docs/plans/2026-04-30-b1-field-mapping-to-674.md`（§7.4.7 整合のマッピング表ドラフト v0）。
- `scripts/build-b1-import-csv.mjs` + `npm run pc-ledger:b1-import-csv` → `C:\tmp\new-pc-ledger\b1-import-674-draft-*.csv`、`*-dryrun.txt`、`*-exceptions.csv`（layout API 列順）。
- 仕様書 §7.4.7（5）にマッピング表リンク、§13 に 1 行。

**次の一手**: ドライランの **pc_name 重複**（`JBIS0053-202602`）を浜田確認。**本番取込は未実施**（ドラフトのみ）。

**次セッションへの 1 行**: 重複解消後に取込リハ → 件数 272 検収。

---

### 2026-04-30 (Wed) JST — 594 重複 PC 名削除（JBIS0053-202602）

**浜田判断**: `JBIS0053-202602` の重複は **五十嵐　益夫**側の入力ミス → **削除で OK**。

**実施（CIO）**:
- **627** `$id=572`（`pc_594_record_id=248`・五十嵐）を先に削除。
- **594** `$id=248`（五十嵐・同一 PC 名の誤行）を削除。
- 残存: **594 `$id=250`**（高橋　成典）のみが `JBIS0053-202602`。
- `npm run pc-ledger:b1-import-csv` / `pc-ledger:b1-review-csv` 再生成 → **B-1 271 件**、ドライラン **warnings 0**。

---

### 2026-04-30 (Wed) JST — §50-3-10・595 索引検索・Desktop 正本・dry-run runbook

**浜田メモ（要約）**: 提案 A–D をすべて進める。**セッション切替の準備**。**`C:\Users\mhamada202408224\Desktop\AI緊急用`** に最新版を入れ、旧 `NEW-SESSION-STARTER_*` は削除。

**実施内容（要約）**:
- **`AGENTS.md` §50-3-10**（`.cursorrules` 鏡像: 完全覚醒・MCP 可視性・検索語義・Kimi 30 行＋Opus フォールバック）。**`.cursorrules`** に kintone `like` と **`docs/runbooks/dry-run-apply-checklist.md`** への参照。**`docs/runbooks/dry-run-apply-checklist.md`** 新設。
- **`customize/595/desktop.js`**: 索引フルスキャン上限 **2000**、`totalCount` 事前取得で超過時はアラート＋スキップ、検索中の **busy 文言**（ボタン「検索中…」・ステータス「一覧を取得しています…」）。BUILD 文字列更新。
- **`scripts/lib/session-starter-desktop.mjs`**: **`pruneNonCanonicalStarterDesktopFiles`**（当日 canonical のみ残し、他日付・当日 `_2` 等を削除）。
- **`scripts/sync-session-starter-to-desktop.mjs`**: 同期後に **prune** 実行・削除ログ。
- **`RULES-INDEX.md`**: §50-3 行・長い参照行に **§50-3-10** を反映。
- **`chat-sessions/checkpoint-latest.md`**: 最終更新（Desktop prune・§50-3-10・595・runbook）を追記。

**次の一手**: **`npm run desktop:sync-and-verify`**（または `session-starter:sync-desktop` + `verify:desktop-ai-emergency-sync`）で **AI緊急用** を正本化。**595** は **`npm run deploy:595`** で本番反映（未実施なら次ターン）。変更一式は **commit / push**。

**次セッションへの 1 行**: Desktop の **`NEW-SESSION-STARTER_20260430.txt`（canonical）** を貼付ターンで Read。**dry-run → apply** は **`docs/runbooks/dry-run-apply-checklist.md`**。**595** 一覧検索は **2000 件超**でフルスキャンしない。

---

### 2026-05-01 10:57 JST

**浜田メモ（原文）**:
> 一旦落としますのでセッション切替の準備をお願いしたい。

**AI 補足（漏れ防止）**:
- `git`: `## main...origin/main` — 作業ツリー **変更多数**（`customize/new-pc-ledger-v1/desktop.js`・`package.json`・各種 `.cursor/rules`・新規 `scripts/export-674-honsya-account-clear-csv.mjs` ほか）。**未 commit** のまま混在の可能性あり（`git status -sb` で要確認）。
- `次の1手`:
  - 新チャット初手: Desktop **`NEW-SESSION-STARTER_yyyymmdd.txt` 全文**貼付 → `chat-sessions/NEW-SESSION-STARTER.md` を **Read で通読** → 項番 **-0** で次の一手を **一問**確認し **浜田 OK** 後に **`npm run session:bootstrap`**（憲法・必読ゲート・時計・Desktop 同期・smoke）。
  - **674 honsya 用 CSV**: `npm run pc-ledger:674:export-honsya-account-clear-csv` → 既定 **`C:\tmp\new-pc-ledger\674-honsya-account-clear-template-<JST日付>.csv`**。1 行目は **フォーム API のフィールド名（label）**。対象クエリは **`group_name = "honsya"`** のみ。アカウント列はテンプレで **空**（手入力→一括更新想定）。
  - **674 customize（本セッション系）**: 595 候補確定時は **所属は空欄のみ補完**（手入力維持）。共有 671 満杯の自動切替で **手入力 M365 ID/PW があるときは上書きせずエラー**。アカウント自動生成は従来どおり **空欄のみ merge**。
- `GO待ち`: **Tier B 系の明示 GO は本ログブロック範囲では未記載**（次セッションで要確認）。
- `session-lock`: **なし**
- `関連パス`:
  - `customize/new-pc-ledger-v1/desktop.js`（上記挙動・BUILD 文字列）
  - `scripts/export-674-honsya-account-clear-csv.mjs`（既定出力 `/mnt/c/tmp/new-pc-ledger/`）
  - `chat-sessions/NEW-SESSION-STARTER.md`（貼付単独完走の正本）

**次セッションへの 1 行**: スターター貼付 → Read 通読 → **-0 OK** → `session:bootstrap` → 続く本題（674 手直し CSV 取込の検収や未 commit の整理など）。

---

### 2026-05-01 (Thu) JST — 日締め・明日は部署予実（仕様確認デイ）・MCP markdownify 恒久化

**浜田メモ（要約）**: 提案 A〜D **すべて対応**。セッション切替の引継ぎ準備。残り時間 **4h 壁時計**内に完了。

**実施内容（CIO）**:
- **予実・仕様確認デイ**: `chat-sessions/checkpoint-latest.md` に **運用表**（知恵袋→CIO→`handoff-log`・朝イチ verify）。`SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1c** に **読みのみデイ**の条件と **1c.6 の適用境界**を追記。`NEW-SESSION-STARTER.md` に **📋 仕様確認デイ** 1 節。`.cursor/rules/deepseek-cursor-spec-division.mdc` に **締め／明日朝チェックリスト**＋**§57 は改定キュー委譲**を明記。
- **TSB**: `docs/troubleshooting.md` **TSB-029**（`@iflow-mcp/markdownify-mcp` の **`preinstall.js` 欠落 publish**＋対策: **`npm install -g --ignore-scripts @0.0.2`**＋**`node …/dist/index.js` 直起動**＋`UV_PATH`／NVM 替え時メンテ）。目次表に **TSB-028・TSB-029** 行、集計 **26 件**。`RULES-INDEX.md` に **TSB-029** 索引 1 行。
- **MCP（ユーザー環境・リポ外）**: `C:\Users\mhamada202408224\.cursor\mcp.json` の `markdownify` は **WSL `node` 直実行**で **接続成功**まで確認済み（ログ `connected: true`）。再発時は **TSB-029**。
- **憲法**: **`AGENTS.md` 本文は未改変**（§57 I の本文合流は **改定フロー待ち**）。

**AI 補足**:
- `次の1手`（明日）: 項番 **-0** で本題を **「部署予実・仕様確認デイ（SPEC のどの範囲か）」**に一文固定 → **フェーズ 1c + checkpoint 表** → 知恵袋 → CIO 突合（**§50-3-8**）→ **`handoff-log` 1 行**。
- `GO待ち`: 読みのみデイでは **§41 三条件に該当するときのみ**。
- `session-lock`: なし
- `関連パス`: `docs/troubleshooting.md`（TSB-029）／`checkpoint-latest.md`（仕様確認デイ・Markdownify メンテ）／`.cursor/rules/deepseek-cursor-spec-division.mdc`

**次セッションへの 1 行**: スターター貼付 → **verify:constitution-handoff / mandatory-read-gate 緑** → **-0** で予実仕様確認デイの範囲一文 → **知恵袋 → CIO 突合**（`[役割: CIO セカンドオピニオン / §50-3-8 突合]`）→ `handoff-log` 追記。

---

### 2026-05-02 (Sat) JST — CIO 運用ループ（常時想起）+ 軽検査 npm 一本化

**実施内容（CIO）**:
- **`.cursor/rules/cio-operating-loop.mdc`** を新設（`alwaysApply: true`）。正シェルは **`~/kintone-ai-lab`（WSL）**、朝は **`docs/reports/<JST>-morning-prep.md`**、追徴は **`npm run cio:quick-health`**、Desktop 更新後は **`npm run desktop:sync-and-verify`** を優先する旨を固定。
- **`package.json`**: `cio:quick-health` = `kintone:test` && `guard:check`。
- **`RULES-INDEX.md`**: §0 直後の表に **（Cursor）`cio-operating-loop.mdc`** 行を追加（索引から辿れるようにする）。

**次セッションへの 1 行**: 朝イチは **morning-prep Read** → 気になるとき **`npm run cio:quick-health`** → セッション本格は従来どおり **スターター + -0 + `session:bootstrap`**。

---

### 2026-05-02 (Sat) JST — READ-07（浜田 CEO のお願い）を read-pack に統合

**実施内容（CIO）**:
- Desktop の **`濱田からお願い（切実な・・・）.txt`** の思いを **`desktop-ai-emergency-read-pack/READ-07.txt`** に正本化（Project Rules 厳守・壁時計・🎖️分業・GitHub Actions 速修・健全性優先・承認不要の確認許可）。
- **READ-01** 手順4を **〜07** に拡張（READ-07 直後 **`【READ-07 読了】` 1 行**）。**INDEX / README-read-pack / SESSION-READ-LADDER / `session-read-ladder-two-phase.mdc` / `cio-operating-loop.mdc` / AI緊急用-README / RULES-INDEX** を同期。

**次セッションへの 1 行**: 朝は **morning-prep** のあと **READ-07** を Read（短くてよい）→ 第0手では **02〜07** 昇順の流れどおり。

---

### 2026-05-02 JST — 部署予実 SPEC（変動費・ダッシュ主操作・実装方針）

**実施内容（CIO）**:
- `templates/yojitsu-budget-lite/SPEC.md` に **§6e** を新設（変動費中心明細＝月次「予算」非運用、monthly_breakdown の扱い、案Aの適用範囲、ダッシュ678＋APIで677永続化、段階導入、無理なら代替明示、監査UI）。
- **§6b** A+B 節、**§6c** 項3、冒頭**状態**、**§11** を §6e と整合。

**次セッションへの 1 行**: yojitsu-master-and-field-plan.md と **§6e** を突合し、677 フィールド設計へ（着手直前 **§50-3-8**）。

---

### 2026-05-02 JST（追記）— フィールド案と SPEC 6e 突合 GO

<!-- handoff: field-plan-6e-20260502 -->

- `templates/yojitsu-budget-lite/docs/yojitsu-master-and-field-plan.md`: **4.1** 費用種別×`monthly_breakdown`、**7** ダッシュ 678＋API→677。根拠に SPEC 6e・7。
- `SPEC.md` **6d**: 上記ドキュメントへのポインタ。

**次の 1 手**: 677 にレコード直下＋サブテーブル追加（着手直前 **50-3-8**）。

---

### 2026-05-02 JST（追記）— 677 batch1 フィールド本番反映

<!-- handoff: 677-batch1-20260502 -->

- **DeepSeek**: CALC は数値フィールド後の batch2。DROP_DOWN はラベル＝キー運用に注意。
- **実行**: `scripts/yojitsu-677-add-batch1-preview.mjs` + `scripts/data/yojitsu-677-batch1-properties.json`、preview revision **3** → deploy **SUCCESS**。
- **検証**: `npm run app:fields 677` → **21 フィールド**（業務フィールド 13 追加）。
- **npm**: `yojitsu:677:batch1-preview` を `package.json` に追加。

**batch2（DeepSeek合意）**: `monthly_breakdown` / `payment_breakdown` は **1 POST に内包フィールド全部 → deploy 1 回**。レコード直下 CALC はサブテーブル後。

---

### 2026-05-02 JST（追記）— 677 batch2（月次内訳・支払内訳・変動費表示 CALC）

<!-- handoff: 677-batch2-20260502 -->

- **DeepSeek**: サブテーブル内 month_utilization の CALC 式（ゼロ除算回避）は有効。サブテーブルは **1 POST + deploy 1 回**。
- **実行**: `scripts/yojitsu-677-add-batch2-preview.mjs` + `scripts/data/yojitsu-677-batch2-properties.json`、preview revision **4** → deploy **SUCCESS**。
- **検証**: `npm run app:fields 677` → **24 フィールド**（`monthly_breakdown` / `payment_breakdown` / `variable_budget_total_display` 含む）。
- **npm**: `yojitsu:677:batch2-preview` を `package.json` に追加。

**次の 1 手**: フォームレイアウト（§6b）要否の判断。678 ダッシュ・保存時 JS ロールアップ・12 行初期データは未着手。batch3 があれば SPEC / backlog と突合。

---

### 2026-05-02 JST（追記）— 仕様確認デイ（文書パス整合・677 突合メモ）

- **§6d 正本パス**: `SPEC.md` §6d・チェックリスト・移行 md・batch2 スクリプトヘッダの誤参照を、リポ実体の **`templates/yojitsu-budget-lite/docs/yojitsu-master-and-field-plan.md`** に統一（ルート `docs/` に同名ファイルは無し）。
- **§50-3-8 突合（CIO・3 行）**: （1）固定費中心行は案A＋677 の `month_utilization` CALC で整合。（2）変動費中心行は **§4.1** どおり **月次 KPI は別定義** — 現 CALC は **暫定**（678 や JS 確定時に置換候補）。（3）`month_actual` は SPEC 上 **支払内訳ロールアップ派生** — **保存時 JS 未実装**の間は手入力と二系統になり得る旨を backlog／実装タスクへ。

**次の 1 手（本日残り）**: 知恵袋に **変動費中心行の `month_utilization` 最終式**と **12 行初期化**を質問票化 → CIO 突合 → Tier B に入る前に **項番 -0** で範囲固定。

---

### 2026-05-02 JST（追記）— `user-markdownify` -32000 再発と硬化（TSB-029）

- **事象**: Cursor MCP `user-markdownify` が **`Connection closed`（-32000）**。
- **対応**: WSL で **`npm install -g --ignore-scripts @iflow-mcp/markdownify-mcp@0.0.2`** を実施。Windows **`C:\Users\mhamada202408224\.cursor\mcp.json`** の `markdownify` を **`npx` 廃止 → `env -i` + `node …/dist/index.js` + `UV_PATH`** に復帰。WSL 正本 **`~/.cursor/mcp.json`** に **`markdownify` ブロックを新設**（従来欠落）。
- **再発防止（リポ）**: `scripts/sync-cursor-mcp-windows-from-wsl.mjs` の生成文を TSB-029 形に修正。`scripts/verify-cursor-mcp-windows.mjs` で **`npx @iflow-mcp/markdownify-mcp` を NG** とし機械検知。`docs/troubleshooting.md` **TSB-029** に **2026-05-02 追補**節を追加。
- **確認**: `node scripts/verify-cursor-mcp-windows.mjs`（WSL から `/mnt/c/.../mcp.json`）**OK**。Cursor は **Reload Window** 後、MCP ログで `markdownify` が緑になることを確認。

**次の 1 手**: Cursor **Reload Window** → `user-markdownify` 接続確認。NVM を **24.14.1 以外**に上げ替えたらグローバル再インストール + 両 `mcp.json` の `node` フルパス更新。

---

### 2026-05-05 JST（追記）— 朝ブリーフィング後の健全性・read-pack・GitHub

<!-- handoff: health-briefing-20260505 -->

- **DeepSeek**: morning-prep の前提ズレ・`smoke:quiet` の終了コード明示・ブランチ保護の罠を盲点として確認（CIO は `git fetch` 済・`echo EXIT=$?` で bootstrap/smoke を記録）。
- **朝ブリーフィング**: `docs/reports/2026-05-05-morning-prep.md` — Phase 2 正常 27 / 異常 0 / 警告 1（MCP 死蔵参考）/ スキップ 4。§46 緑扱いで継続可。
- **session:bootstrap**: exit **0**（憲法 verify・mandatory gate・**session-clock-health strict**・Desktop sync・smoke 10/10）。初回は **watch pid 無し** → **`npm run session:clock:watch`** をバックグラウンド起動 → health で **✅ process responds** に復帰。
- **read-pack**: リポに **READ-02〜05 が欠落**していたため Desktop 控えから **`chat-sessions/desktop-ai-emergency-read-pack/`** へ復元。`session-starter:sync-desktop` で **READ-01〜07 全同期**を確認。
- **kintone-apps / RAG**: 678 行に **再デプロイ rev 109 / BUILD manual-app-guide-name** 等を追記。`.rag/extra-docs/kintone-apps.md` と同内容。`rag:mirror:canonical-docs` は既に一致。
- **GitHub Actions**: `gh run list` — **直近の失敗は 2026-05-03 の古い push**（以降 success 連鎖）。本 push `edbb5c0` は **paths フィルタ**により `kintone-customize-deploy` **未起動**（`customize/**` 非変更のため想定内）。
- **コミット / push**: `edbb5c0` — `chore: restore read-pack READ-02..05, wall clock, 678 deploy log`。push 後 **sync-desktop + verify:desktop** 実施。

**次の 1 手**: PC 台帳レーン着手時は **項番 -0** で 5B 固定 → 1b オーダー。`session:clock:web` は別ターミナルで稼働中ならその URL を正とする。

---

### 2026-05-05 JST（追記）— 備わり機能・MCP 棚卸しと依存更新

- **`session:bootstrap`**: exit **0**（本追記前に再実行済み）。
- **`npm run health-check`**: 異常 **0**（MCP は WSL から疎通可のものは ✅／github・office-ppt・tavily・figma は設計どおりスキップ or disabled）。
- **業務活用の目安**: `docs/mcp-status.md` 一覧＋`SESSION-CLOSE-REPORT` §6 優先表＋`READ-06` 実務チェックリストを正。**`call_mcp_tool` 前は descriptor Read**（§51 直列）。
- **依存更新**: ルートで **`npm update`**（`npm audit fix --force` は **未実施** — `@kintone/cli` 経由 axios moderate は **公式修正待ち**、`docs/reports/2026-05-04-toolchain-cli-git-closeout.md` と同方針）。**`security-next-automation`** で **`npm update`**（nodemailer / openai 等、**audit 0**）。
- **ドキュ**: `docs/mcp-status.md` 最終更新行を本日に。

**次の 1 手**: 浜田さん本日の目的の **項番 -0 すり合わせ**。

---

## OPEN（アップデート・依存・計測）— AI が毎セッション先に読む課題リスト

<!-- OPEN-TRACK: deps-credit-mcp-20260505 — 解消したら本節を更新 or 末尾に CLOSED 行 -->

| ID | 状態 | リスク | 内容 | 次アクション |
|----|------|--------|------|--------------|
| **O-1** | **CLOSED** 2026-05-05 | — | **`npm audit` moderate（axios）解消**: `@kintone/cli@1.19.2` は **既に npm latest** で `npm update` では解消不可。**`package.json` `overrides`** で **`@kintone/rest-api-client@6.1.6`**（公式が `axios@1.15.0`）を強制。**`npm audit` → 0**。**`npm audit fix --force` は未使用**。 | 将来 **CLI が 6.1.6+ を直依存**したら overrides を外して再 `npm install` 可否を確認。 |
| **O-2** | **CLOSED** 2026-05-05 | — | **billing 実数反映済み**: Plan & Usage スクショで **Total 71%** → `npm run credit:set 71` + `data/credit-usage.json` **note** 追記（45% placeholder 解消）。 | 翌営業日以降も **1 日 1 回** `credit:set`（§1-2-4）。 |
| **O-3** | **MONITOR（AI 担当）** | 低 | **グローバル MCP**（`~/.cursor/mcp.json`）— **2026-05-05**: `npm view` で **`@colorsandfonts/mcp@1.1.0` = registry latest**、`@iflow-mcp/markdownify-mcp` **グローバル 0.0.2 = latest**。`@modelcontextprotocol/server-*` は **非ピン `npx -y`** で都度解決。**本日の変更なし**（浜田への一問は不要・CIO 委任）。 | **AI**: 月次 or MCP 変更時に再 `npm view`。**ピン上げるとき**は §17-2・`docs/mcp-status.md`・TSB-029（markdownify は **node 直起動**維持）。 |
| **O-4** | CLOSED（参考） | — | ルート **`npm update`** + **`security-next-automation` `npm update`** は実施済み（`e1a74d9`）。smoke **緑**。 | 継続: 変更後は smoke + 必要なら bootstrap。 |
| **O-5** | OPEN | **中〜高** | **Included API 100% 消化済み** → On-Demand 課金継続。**2026-05-05 時点 On-Demand $388.51 / $1,000 cap**、Ultra 次回リセット **5/15 まで残11日**。枯渇予測・§1-2-2/§1-2-3 の前提に直結。 | CIO が上限・モデル既定（Max Thinking 抑制等）を監視。`npm run credit:status` / morning-prep JSON を参照。TSB-021（On-Demand $ 正式追跡）は未実装のまま追跡。 |

**CIO 判断で浜田 GO 済み（本メッセージ）**: **O-4** の方針継続、**`audit fix --force` しない**、**semver 内 `npm update`**、**RAG `rag:ingest:all` 実施済み**（別コミット・ログ参照）。

---

### 2026-05-05 JST（追記）— アップデート実施／残課題の GO 整理（浜田指示）

- **実施済み（GO 範囲）**: ルート・`security-next-automation` の **`npm update`**、`docs/mcp-status.md` 更新、`rag:ingest:all`、`credit:set`（暫定）、関連 **git push**。
- **残課題・監視（OPEN 表）**: **O-3 グローバル MCP（MONITOR・AI 担当）**、**O-5 API 枯渇 + On-Demand 金額**（**O-1 axios・O-2 credit % は CLOSED**）。
- **確認は 1 件ずつ**: 次チャット以降、AI は **OPEN 表の上から**未確認項目を **§41 一問**で浜田に確認する。

### 2026-05-05 JST（追記）— クレジット確認（Plan & Usage スクショ）

- 浜田提供の **Settings → Plan & Usage** に基づき **71%** を記録（警告レベル **70% 到達** 🟡）。
- **O-5** として **API 100% 使用済み + On-Demand $388.51** を OPEN 表に追加（課金・運用リスクの常時可視化）。

### 2026-05-05 JST（追記）— `kintone-apps.md` 678 行・本番照合（浜田 **はい**）

- **本番 customize** の `BUILD` **`2026-05-04-678-manual-app-guide-name`** と **`customize/678/desktop.js`** が一致することを確認済み。
- **CIO**: 台帳運用について **「はい」で GO**（以降の追記・RAG ミラーはこの前提でよい）。**注意**: `kintone-apps.md` 678 行末に **5/5 以降の deploy 記述**があるが、**本番 JS の BUILD は上記のまま**のため、**後段は本番未反映の可能性** — 次回 `deploy:678` 後は **BUILD / fileKey / revision** を必ず突き合わせて台帳を更新すること。

### 2026-05-05 JST（追記）— O-1 axios（浜田「いいえ」→ 調査・対応）

- **調査**: `@kintone/cli` **1.19.2 = レジストリ latest**。CLI は **`@kintone/rest-api-client@6.1.4` を直依存固定**のため **`npm update @kintone/cli` では axios 未更新**。
- **判断**: 公式 **`@kintone/rest-api-client@6.1.6`**（`axios@1.15.0`）へ **`package.json` `overrides`** で揃える（`npm audit fix --force` は未使用）。**`npm audit` 0**・**`smoke:quiet` 10/10** を確認。

### 2026-05-05 JST（追記）— O-3 グローバル MCP（浜田「こちらで確認・必要なら上げて」）

- **`npm view` 確認**: **`@colorsandfonts/mcp`** は **1.1.0 が latest**（`mcp.json` のピンと一致）→ **変更なし**。
- **`@iflow-mcp/markdownify-mcp`**: グローバル実装 **0.0.2 = npm latest**（TSB-029 の **node 直起動**維持）→ **変更なし**。
- **`@modelcontextprotocol/server-{filesystem,memory,sequential-thinking}`**: 設定は **`npx -y` 非ピン**のため実行時に最新系へ解決。**ファイル上げのみ不要**。
- **方針**: 以降 **AI が必要時に `npm view` と `docs/mcp-status.md` を更新**。浜田への **§41 一問は出さない**（OPEN 表 O-3 を **MONITOR（AI 担当）** に変更）。

### 2026-05-05 JST（追記）— 678 台帳ずれ是正（浜田指示）／overrides 運用正本

- **`kintone-apps.md`**: 表の直後に **「678 本番 customize の実効ビルド」**節を追加。**本番 BUILD = `2026-05-04-678-manual-app-guide-name`** と、**5/5〜5/7 の連記は本番未反映の先行ログ**を明示。**`npm run rag:mirror:canonical-docs`** で `.rag/extra-docs` に反映。
- **`overrides`**: 除去条件・手順の正本を **`docs/reports/kintone-cli-rest-api-override.md`** に新設（**CLI が `rest-api-client` 6.1.6+ を直依存**したら overrides 削除 → install → audit → smoke）。

### 2026-05-05 JST（追記）— `deploy:678` 本番 live 同期（浜田 GO）

- **`npm run deploy:678`**: **Deploy SUCCESS** / fileKey **`6074bbd9-62bf-4746-b522-ec4ebcdeba12`** / revision **`110`** / **BUILD=`2026-05-04-678-manual-app-guide-name`**（`customize/678/desktop.js` HEAD）。
- **`kintone-apps.md`**: 表 678 行末に上記を追記。**「678 本番 customizeの実効ビルド」**節を **rev 110** に更新（5/5〜5/7 連記は **現行バンドルに無いメモ**と明記）。**`rag:mirror:canonical-docs`** 実施。

### 2026-05-05 JST（追記）— 674: 595 検索フィールド直下ボタン（セッション継続）

- **本題**: フォーカス自動起動の取りこぼし代替として、**個人（非保管）**の **user_name / dept_name / group_name** 各 `getFieldElement` ルート末尾に **「595で氏名・所属を検索」**（`openEmployee595SearchModal674`）を **遅延 4 回**マウント。閲覧（detail）では除去のみ。
- **`npm run deploy:674`**: **SUCCESS** / fileKey **`09d55a9b-ebe6-4450-a065-2bd5fc669160`** / preview revision **`107`** / **BUILD=`2026-05-05-pc-ledger-595-field-adjacent-btn`**。
- **`kintone-apps.md`**: 674 行・Actions 表を更新。`session:bootstrap` 緑。

### 2026-05-05 JST（追記）— 674: 595 はボタン押下のみ（浜田仕様）

- **方針**: 社員名検索（595）は **登録担当者が望んだときだけ**＝**明示ボタンのみ**。`run674EmptyFieldAssistFromPointer674` から **個人の自動 `openEmployee595SearchModal674` を削除**。共有・JR の **680** フォーカス自動は据え置き。
- **`npm run deploy:674`**: **SUCCESS** / fileKey **`18c7d9cd-f01c-44b1-bc04-3bd4611910b1`** / revision **`108`** / **BUILD=`2026-05-05-pc-ledger-595-on-demand-only`**。

### 2026-05-05 JST（追記）— 674: 595 入力支援の条件を仕様正本に集約（CIO）

- **正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.1a・§4.4・§4.2.0**。実装は **`isPersonal595AssistEnabled674(record)`**（`readAccountTypeLive674`＋`readPcStatusLive674` で **個人かつ pc_status≠保管**）に **595 モーダル・ヘッダ／直下ボタン・利用者名候補・個人用自動生成・保存前 user_name 595 検証・595 双方向リンク eligible** を統一。
- **`npm run deploy:674`**: **SUCCESS** / fileKey **`e6374d94-049d-4714-a79c-e31e041178a3`** / revision **`109`** / **BUILD=`2026-05-05-pc-ledger-595-assist-spec-gate`**。

### 2026-05-05 JST（追記）— 674: 個人×保管はヘッダ「全フィールドリセット」のみ（浜田）

- **目的**: 余計なボタンを出さない。**新規・編集**かつ **`isPersonalStored`** のとき **`injectButtons`** で **PC買替・印刷を出さない**（**閲覧 detail** は従来どおり PC買替・印刷のみ）。
- **`npm run deploy:674`**: **SUCCESS** / fileKey **`659b0f75-1710-4afc-bd8a-f748a7e7efe0`** / revision **`110`** / **BUILD=`2026-05-05-pc-ledger-personal-stored-header-min`**。

### 2026-05-05 JST（追記）— 674: 保管ヘッダは種別横断で一律（浜田整理）

- **`isPcStatusStorage674`**: `readPcStatusLive674 === 保管`。**新規・編集×保管**（個人/共有/JR）→ ヘッダは **全フィールドリセットのみ**（共有自動生成・595 も出さない）。**閲覧×保管**→ カスタムバー **非表示**（空なら `appendChild` しない）。**非保管**→ 従来（種別別＋PC買替・印刷／閲覧は PC買替・印刷）。
- **`npm run deploy:674`**: **SUCCESS** / fileKey **`754231f0-c513-448e-b0dc-858c5200734a`** / revision **`111`** / **BUILD=`2026-05-05-pc-ledger-storage-header-reset-only`**。

### 2026-05-05 JST（追記）— 674: 入力支援（セッション切替前の継続意向 → OPEN）

- **切替前の浜田意向**: 「入力支援」まわりは**時間切れのため引き続き一緒に詰めたい**（チャット上）。**2026-05-05 後半**: §4.2.0b に沿い **クリック→confirm→595/680** を実装（下記「§4.2.0b 入力支援を 674 に実装」）。旧 **680 フォーカス自動**は廃止。
- **いまの本番正**: `kintone-apps.md` 674 行 — **BUILD=`2026-05-05-pc-ledger-input-assist-click-confirm`** / fileKey **`549f5c09-25b6-419d-a395-6b27d09ede76`** / revision **`112`**（`npm run deploy:674` **SUCCESS**）。
- **次の一手（OPEN・残り）**: (1) 現場でまだ起きるなら **種別・ステータス・新規/編集**＋**手順3行**を追記。(2) **共有・JR の利用者名クリック**で検索を出すかは浜田一問（下記「未確認」）。

### 2026-05-05 JST（追記）— 入力支援 UX の正本欠落の是正（浜田指摘）

- **浜田の指摘**: 「入力支援」は**保管ヘッダの話ではない**。**決めた仕様**は、**利用者名・所属名・所属グループをクリックしたとき**に**入力支援を希望するかユーザーへ促し**、**はい**の場合に**社員名・所属名・所属グループ等の検索画面**が出ること。これが記録に無いのは**おかしい**のではないか、という問い。
- **事実**: 上記の**クリック→承諾確認→はいで検索**は、**2026-05-05 まで** `2026-04-21-new-pc-ledger-spec.md` および本 handoff の**OPEN 記述に明示されていなかった**（§4.2.0b は 595 反映・ヘルプ帯中心で、起動トリガーは書いていなかった）。**記録抜け**であり、§139（矛盾時は正本へ合意後に反映）に照らして**是正した**。
- **正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0b** に **「入力支援の起動 UX」** を追記（§13 改訂履歴 **2026-05-05**）。**同日**: 本条に **`desktop.js` を実装で整合**（§4.2.0b bullet に実装注記）。

### 2026-05-05 JST（追記）— §4.2.0b 入力支援を 674 に実装（クリック→confirm）

- **実装**: `customize/new-pc-ledger-v1/desktop.js` **BUILD=`2026-05-05-pc-ledger-input-assist-click-confirm`**. 利用者名・所属名・所属グループの **click**（capture）→ `window.confirm` → OK で **595**（`isPersonal595AssistEnabled674`）または **680**（共有・JR・所属欄・従来どおり dept/group 未充足時のみ）。**保管**は `isPcStatusStorage674` でガード。**フォーカス／pointerdown では起動しない**（旧 680 自動フォーカス廃止）。**ヘッダ「社員名を検索（595）」・「所属候補から入力」・フィールド直下 595 ボタン**は確認省略。
- **正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.2.0b 入力支援 bullet を実装注記付きで更新済み。
- **未確認（浜田へ 1 問）**: **共有・JR の「利用者名」クリック**でも 680 または別の検索を出す必要はあるか（現状は **所属名・所属グループ** のクリックのみ 680）。
- **deploy**: **`npm run deploy:674` SUCCESS** / fileKey **`549f5c09-25b6-419d-a395-6b27d09ede76`** / revision **`112`**。`kintone-apps.md` 674 行・Actions 反映済み。

