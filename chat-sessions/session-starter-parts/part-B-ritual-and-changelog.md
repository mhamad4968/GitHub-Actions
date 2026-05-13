# NEW-SESSION-STARTER 分割 2/6 — ritual-and-changelog

> 正本ハブ: `chat-sessions/NEW-SESSION-STARTER.md`（貼付用・短縮版）
> 親ファイル: v3.35 まで monolithic → **v3.36** より分割（2026-05-07 CIO）

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
新チャット起動の儀式 / 2026-04-23 制定 (v3 / 全面リライト)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 貼付単独で完走（checkpoint 項番 -1 〜 項番 0 機械部分・本文内正本）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**方針（v3.36）**: 浜田は **ハブ**（Desktop の **`00-NEW-SESSION-STARTER_yyyymmdd.txt`**）を **新チャット 1 通目**に貼れば **項番 -1 の入口**は足りる（短く読める）。**旧「単一ファイル全文」と同値の細則**は **Part A〜F**（`session-starter-parts/*.md`／Desktop **`01`〜`06`-STARTER-part-*.txt**）にあり、**AI が順に Read** して復元する（下記手順 2）。任意で **Part C「■ フル版」ブロック**を追加貼付してもよい。`22-HANDOFF-HUMAN.txt` 5 行は **任意**。

**AI がこのチャット内だけで守る順序（checkpoint 項番 -0 〜 0 と同値）**:

1. **頭出し**: 応答 **先頭**に `[§1-2-3 ティア判定: …]`。**続けて** **`【適用憲法】`** を **1 行**（§ 番号の要約。スターター受領直後は `§1-2-3-1` `§35-1` 等でよい）。**その後**に `[🎖️ 本セッション割当] CIO=本体 | DeepSeek=… | Kimi=… | OpenRouter=…` を **1 行**（未起用は `未使用`）。**スターター全文を受領した**旨を一言。
2. **スターター分割パートの通読（必須・読み飛ばし禁止）**: 浜田が **ハブのみ**貼っていても、**チャット貼付だけを「読んだ」とみなさない**。必ず **`chat-sessions/session-starter-parts/part-A`〜`part-F` をこの順で** Read する（各ファイルが長いときは **`offset` / `limit` を繰り返し**、**抜け・重複を残さない**）。**要約や記憶だけで手順 3 以降に進まない**。
2b. **前日の締め報告（任意・2026-05-04）**: 同じ JST 日付または直前の営業日に **`chat-sessions/SESSION-CLOSE-REPORT_yyyymmdd.txt`**（または Desktop 同名）があれば、**項番 -0 の前**に **Read ツールで通読**（反省・次アクションの取りこぼし防止。無ければスキップ可＋チャットに「CLOSE 無し」1 語でよい）。
3. **項番 -0（開始ゲート）**: 手順 2（および任意 2b）完了後、ツールで `chat-sessions/checkpoint-latest.md` の **「最終更新」先頭 1 行**と `chat-sessions/handoff-log.md` の **末尾見出し 1 ブロック**を読む。浜田が `HANDOFF-HUMAN` を貼っていればその **「次にやる1つ」** も採用。**§41 で一問だけ**: 「本日の本題（これから着手する次の一手）は ○○で合っていますか？」**浜田の OK**（はい／OK／進めて／1 行の修正指示）が返るまで、`verify:*`・**`npm run session:bootstrap`**・本題の **副作用**（Tier B・deploy・kintone 本番書込等）に **着手しない**。
4. **項番 0（機械ゲート一括）**: リポルートで **`npm run session:bootstrap` を 1 回実行**するだけでよい。内部の直列は **`(1)`** `verify:constitution-handoff` → **`(1b)`** `verify:mandatory-read-gate`（必読構造＋ `session:split-check` 等）→ **`(1c)`** `verify:session-clock-health --strict`（**hooks・crontab の session-split 行・`logs/.session-clock-install-node` と cron 行の node 整合**）→ **`npm run session-starter:sync-desktop`** → **`verify:desktop-ai-emergency-sync`** → **`(4)`** `smoke:quiet`（11 連）。終了コードと WARN/NG をチャットに **短く要約**（詳細は `SESSION-BOOTSTRAP-CHECKLIST.md` フェーズ 7）。
5. **壁時計（客観起点・2026-04-29 CIO 運用 / `AGENTS.md` §51-6 遵守事項 6）**: **新チャット（セッション切替）ごとに、AI は `npm run session:clock:set` を必ず実行する**（hook が先に走っていても再実行してよい。実行後 **`SESSION-CLOCK.md` の `開始:` をチャットに 1 行報告**）。続けて **`npm run session:clock:web` をバックグラウンド起動**し、ターミナルに出た **`[session-clock-web] 開く: http://127.0.0.1:…` をチャットへ転記**し、浜田に **ブラウザで開く**よう促す（**毎回表示 URL を正とする**／`SESSION-SPLIT-REMINDER.md`）。**実行タイミング**: 項番 0（`session:bootstrap`）の **直後**が既定（health が壁時計を読む流れと両立）。bootstrap 前に set する必要がある特殊環境は §41 一問。**セッション終了時**は遵守事項 **7** に従い **`npm run session:clock:clear`**（**開始:** を **未設定**）＋ **`session:clock:web` ターミナルは Ctrl+C**。

**文脈復元（@ Read）**: **項番 0 が通ったあと**、本題に入る前に **下記「■ フル版」内の @ リスト**を読む（パスはファイル内の通り。PC 台帳を触らない日は仕様書の @ はスキップ可）。**Read だけで終わらず**、合意した本題へ進む。

**本題スイッチ（迷走防止 / 2026-04-29）**: 項番 -0 の **§41 一問**で、本題が **「部署予実」か「新・PC台帳」か** を先に一言で固定する。**部署予実のみ**のセッションでは `checkpoint-latest.md` **項番 5A** と `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1c** の正本だけを追い、**674・§4.2・フェーズ 1b は触るまで Read しない**。**PC 台帳を触る日**だけ従来どおり **項番 5B**＋フェーズ **1b**。**§50-3-8**: 部署予実で **kintone 作成・フィールド設計・計算ロジック・複雑 customize** に入る**直前**は、**セッション切替直後の新チャット**でも **DeepSeek 盲点抽出＋約3行突合メモ**を**必ず再実行**する（前セッションのチャットだけでスキップしない）。

**例外**: 浜田が **追加メモ**（`HANDOFF-HUMAN`・独自箇条書き）を貼った場合は、**項番 -0 の「本題」** に織り込む。憲法改定・並列編集・Tier B GO は従来どおり `AGENTS.md` / `SESSION-BOOTSTRAP` のまま。

**改定ルール（恒久・浜田指示「今後はすべてそう」）**: セッション初手の **項番 -1〜0（機械）および -0→bootstrap→@ Read の順**を変えるときは **本節（「■ 貼付単独で完走」）を唯一の詳細正本として先に更新**する。`checkpoint-latest.md`・`SESSION-BOOTSTRAP-CHECKLIST.md`・`RULES-INDEX.md`・`.cursor/rules/session-handoff.mdc`・`SESSION-SPLIT-REMINDER.md`・`HANDOFF-HUMAN.txt` は **本節と矛盾しない短い鏡像・リンクに留め、浜田への貼付義務を増やさない**（**ハブ 1 貼付＋任意 HANDOFF** が既定。細則は Part A〜F）。

---

**単独貼付の範囲**: 上記 **■ 貼付単独で完走** が **項番 -1〜項番 0（機械）**の正本。チャットに `checkpoint-latest.md` を **別添しなくてよい**（AI はツールで読む）。続く **@ Read** で文脈を厚くしてから本題へ。

**浜田が毎回最初に開く場所（運用上いちばん大事）**: `C:\Users\mhamada202408224\Desktop\AI緊急用\` の **`00-NEW-SESSION-STARTER_yyyymmdd.txt`**（**JST 8 桁・ハブ正本**。旧名 `NEW-SESSION-STARTER_*.txt` は同期で掃除）。**貼付推奨**は **`npm run verify:desktop-ai-emergency-sync` の最終行**（または `session-starter:sync-desktop` の「貼付推奨」行）。フォルダ説明は **`23-AI緊急用-README.txt`**。**セッション切替時はハブを 1 通目に貼る**（細則は AI が Part A〜F で Read）。貼ったあと **本日の一手**を **§41 一問**で確認し、**浜田 OK 後**に項番 0（**`npm run session:bootstrap`**）。**CIO 義務**: スターター系をリポで触った **同一ターン**で **`npm run session-starter:sync-desktop`**（§35-1・TSB-024）。**日終わり**にも sync → verify。

**補足（2026-04-28 / v3.36 で追補）**: Desktop に集約 txt のみある場合も、**先に `session-starter:sync-desktop`** で **ハブ＋`01`〜`06`-STARTER-…txt＋儀式（07/17/18/19）＋ read-pack** を復元してから **ハブ貼付 → 項番 -0 → bootstrap**。Git 正本: **ハブ** `chat-sessions/NEW-SESSION-STARTER.md` と **Part** `chat-sessions/session-starter-parts/part-*.md`。`/mnt/c` 不可時は CIO がチャットに 1 行（復帰後に npm 再実行）。

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
- **新チャット初手の Read 順**は `chat-sessions/checkpoint-latest.md` の **「セッション切替後の自律復元」** を正本とする（checkpoint → 本条 v3.8+ → `handoff-log` 末尾 → **項番 5（本題別・5A 予実 / 5B PC 台帳）** → `RULES-INDEX` 索引行）。**実行順（-0 → bootstrap → Read）**は **v3.27** の **「■ 貼付単独で完走」** を上書き正本とする。  
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
- **浜田**: `HANDOFF-HUMAN.txt`（5行）は **任意**（v3.27 以降・正本は **NEW-SESSION-STARTER 全文貼付**）
- **AI**: 同ターンで `chat-sessions/handoff-log.md` 末尾へ必ず追記（`.cursor/rules/session-handoff.mdc` / 漏れ禁止）
- **checkpoint-latest.md** に手順リンク済み

v3.26 (2026-04-26) **canonical 固定 + 貼付推奨ログ + README + 日終わり**（浜田「案 A〜D 全部」）:
- **案 C**: 常に **`NEW-SESSION-STARTER_yyyymmdd.txt`** に正本を書く。内容が変わる sync のときだけ旧 **`yyyymmdd.txt`** を **`_2`…** に退避してから上書き。
- **案 D**: **`verify:desktop-ai-emergency-sync`** の **成功時最終行**に **`貼付推奨（項番-1）:`** を出す。`session-starter:sync-desktop` にも **貼付推奨**行。
- **案 B**: リポ `chat-sessions/AI緊急用-README.txt` → Desktop **`23-AI緊急用-README.txt`** を sync/verify 対象に追加。
- **案 A**: `checkpoint-latest.md` に **「日終わり（推奨）」**（sync → verify または bootstrap）。

v3.27 (2026-04-27) **貼付単独で完走**（浜田指示）:
- **本文冒頭**に **「■ 貼付単独で完走」** を追加 = `checkpoint-latest.md` **項番 -1〜項番 0（機械）**の同値正本を **NEW-SESSION-STARTER 内に内包**。
- 浜田は **フル版から末尾まで（Desktop txt 全文）だけ**貼れば開始素材は足りる。`HANDOFF-HUMAN` は任意。
- AI は **項番 -0 OK → `session:bootstrap`（内包 (1c) session-clock-health strict）→ @ Read → 本題**。**先に全部 Read してから bootstrap** は廃止。

v3.28 (2026-04-27) **単一正本の恒久運用**（浜田「今後はすべてそう」）:
- **「■ 貼付単独で完走」** を今後も **詳細手順の唯一正本**とし、他ドキュは追随のみ（二重正本禁止・貼付増やさない）。

v3.29 (2026-04-28) **明日＝部署予実の仕様デイ**（浜田合意・十分な時間）:
- **4/28 本題の既定候補**: **予算・実績・修正（予実）**の **仕様だけ** をゼロベースで決める（kintone 化の範囲・入力者・集計の置き場・一次ソース）。実装は合意後でよい。
- **Excel 正本**: `C:\tmp\予算管理\2026年度システム推進室_年間予算案20260123.xlsx` シート **`新フォーマット`**（WSL: `/mnt/c/tmp/予算管理/…` 同ファイル）。
- **列構造の要約（リポ）**: `templates/yojitsu-budget-lite/docs/shin-format-excel-layout.md`（12 ヶ月×四つ柱＋明細キー列・集計列の説明）。
- **薄い雛形**: `templates/yojitsu-budget-lite/README.md` / `SPEC.template.md`（複製先で `SPEC.md`）。
- **§51-6-2 セッション時計 WEB**（4/27 改修）: ブラウザ再読込で経過が進むよう **各 GET 前に `write-ticker`**＋**キャッシュ抑止**＋**30 秒 `location.reload()`**（`scripts/session-clock-web.mjs`）。

v3.30 (2026-04-28) **本日承認分のフォロー一式**（浜田「すべて承認」）:
- **予実**: `shin-format-excel-layout.md` に **Excel↔md 二正本のメンテ表**／**`yojitsu-spec-session-checklist.md`**（仕様デイ用）／`npm run yojitsu:excel-draft`（列見出しドラフト・openpyxl）。
- **時計 WEB**: `writeTickerFile` を **`lib/session-clock-write-ticker.mjs`** に共通化（WEB は **in-process**・子プロセス廃止）。**TICKER の mtime（UTC）**を HTML に表示。負荷メモ **`docs/session-clock-web-performance-notes.md`**。`SESSION-SPLIT-REMINDER` に **データの流れ 5 行**。
- **`fmtDuration`**: 経過と残りは **それぞれ分 floor** のため表示上の分の和が 240 に見えないことがある旨を **コメントで明示**（`session-clock-core.mjs`）。
- **`session-handoff.mdc`**: **日終わり・明示依頼＋チャット合意**ならドラフト省略可の **例外 1 行**。
- **`SESSION-CLOCK.md`**: **壁時計 set で差分が出うる**。**コミットに含めるかは任意**（未コミット＝異常とは限らない）。
- **`kintone-apps.md`**: **部署予実（予定）**行＋「仕様合意後にアプリ ID を追記」の運用一文。

v3.31 (2026-04-28) **部署予実＝実装フェーズ手前＋Desktop 一時集約**:
- **予実仕様**: 4/28 時点で **仕様フェーズ完了**（`SPEC.md` §9・移行 md 列対応・チェックリスト）。**実装マイルストーン**（`SPEC.md` §10.1）: **4/29（水）約 19:00 JST〜** kintone **アプリ作成**（着手前に **配置スペース** 合意・`.cursor/rules/creation-timing-ask.mdc`）／**4/30** 項目・フィールド確定／**5/1** 予算データ投入／**5/2** 便利機能／**5/3** 運用・ダッシュ注意・リンク集／**5/11** 運用開始目安。
- **マスタ v1**: 会社・工種・摘要は **別マスタ不要**（費用種別はドロップダウン）。`templates/yojitsu-budget-lite/docs/yojitsu-master-and-field-plan.md`・`SPEC.md` §6d。チェックリスト §3b **[x]**（浜田読了）。
- **Desktop `AI緊急用`**: セッション切替用に **`SESSION-HANDOFF-LATEST-2026-04-28.txt` のみ**残した時間帯あり。**儀式 4 本**は **`npm run session-starter:sync-desktop`** で再展開。**再展開前**は `verify:desktop-ai-emergency-sync` が **NG になり得る**（先に sync）。
- **夜の再入場**: 浜田 **約 20:00 JST**（反省会など）— **新セッション**になる日は `checkpoint-latest.md` **最終更新**と **集約 txt** を **項番 -0** の文脈に含める。

v3.32 (2026-04-29) **憲法 §50-3-8（DeepSeek 盲点＋突合メモ）をスターターに常設**:
- **CEO 合意**: 着手前ルーチンを憲法 **§50-3-8** に明文化済（`AGENTS.md` v23.24）。本スターターに **一行リマインダ**（CEO 朝指示 7 番・DeepSeek 行・**本題スイッチ**）＋**セッション切替後は前チャットの突合で代替せず再実行**を追記。
- **引き継ぎ**: `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1c**・`checkpoint-latest.md` **項番 5A**・`session-handoff.mdc` に **§50-3-8 再実行**を鏡像。
- **verify ゲート**: 冒頭 🚨 内に **`[§1-2-3 ティア判定` / `§1-2-3-1`** の 1 行リマインダを置き、`verify:constitution-handoff` の先頭 5200 字検査を満たす。
- **CIO=Desktop sync**: `session-starter:sync-desktop` は **CIO（AI）義務**。「浜田依頼」「浜田が npm」等の表現を撤去（§35-1・TSB-024）。

v3.33 (2026-04-30) **憲法 §50-3-9（kintone MCP の自律的フォールバック）**（`AGENTS.md` v23.25）:
- **構造エラー**（スキーマ・戻り値不一致）→ **同一 kintone MCP を再試行しない** → 即 **REST**（`scripts/` 既存パターン or `tmp-kintone-*.mjs`）。**通信エラー**→ **1 回のみ**再試行 → 失敗なら REST。**検知ターン先頭**で「MCP エラーにより REST 手順へ移行」。一時スクリプトは完了時 **削除または正規名昇格**。
- **航海図**: kintone MCP を手段(第1)にするとき **手段(第2)=REST を併記**（§50-3-2 接続条）。
- **冒頭 🚨**: CEO 朝指示に **8 番（§50-3-9）** を追加。

v3.34 (2026-05-02) **🎖️ 軽量相談の既定＋相談のみの 🎖️ 例**（CEO 承認・SESSION-DAILY §4 H・I）:
- **冒頭 🎖️ 節**: タスク単位の **DeepSeek 1 問既定**、スキップ時 **理由 1 行**、Kimi は長文差分時のみ、OpenRouter はフォールバック。**相談のみターン**の **`[🎖️ 本セッション割当]` 1 行サンプル**を明記（浜田目視用）。
- **read-pack**: `desktop-ai-emergency-read-pack` に **READ-02〜06** を正本として追加（`INDEX.txt` に SESSION-DAILY 行・§10 注記）。

v3.35 (2026-05-02) **コード変更時は編集前に意見取得**（CEO 意図の明文化）:
- **🎖️ 軽量相談**節に、**コード変更**の定義と **編集ツール実行前**（または同一ターンの早い段階）で DeepSeek 1 問を済ませる旨を追記。**後編集の形式相談**を避ける。
- **`.cursorrules` §B** / **`deepseek-cursor-spec-division.mdc`** / **`08-READ-06.txt` §10** に同趣旨の 1 行を同期。

v3.25 (2026-04-26) **Desktop スターター控えのファイル名 = メンテ日（JST）＋枝番**（浜田指示）※ **v3.26 で運用確定**（枝番最大を貼る方式から **常に yyyymmdd.txt** へ）:
- 参照用に履歴のみ残す。

v3.24 (2026-04-26) **「次にやること」確認 → 浜田 OK → 開始（項番 -0 開始ゲート）**（浜田指示）:
- **項番 -0**: AI が **次の一手**を **§41 一問**で確認。**浜田の OK が返るまで** `verify` / `session:bootstrap` / 本題に **着手しない**。
- **項番 0.9**: bootstrap 後に合意と状況が **ズレたときだけ**再一問（副作用ある実行の直前）。

v3.23 (2026-04-26) **Desktop `AI緊急用` の都度メンテ＋セッション切替時の AI 確認義務**（浜田指示）:
- **正本パス**: `C:\Users\mhamada202408224\Desktop\AI緊急用`（WSL: `/mnt/c/Users/mhamada202408224/Desktop/AI緊急用`）。**セッション切替のたび**に AI が **メンテ済みか確認**（`checkpoint-latest.md` **項番 0b**）。
- **`npm run session-starter:sync-desktop`** で `.txt` 3 本をリポと揃え、**`npm run verify:desktop-ai-emergency-sync`** でバイト一致（フォルダ無し環境は SKIP＋チャット 1 行）。
- **`npm run session:bootstrap`** に sync + verify を組込（憲法 verify の直後）。
- **2026-05-02 CEO 追補**: **メンテをするたび**（儀式・read-pack・HANDOFF／BOOTSTRAP／checkpoint／handoff をリポで触った**ターンの締め**、**日終わり**、**push 前**）に **Desktop 控えをリポと同内容**にする。**セッション切替に限定しない**。まとめてよいときは **`npm run desktop:sync-and-verify`**。

v3.22 (2026-04-26) **セッション切替＝先にスターター貼付（項番 -1/-0）**（浜田提案・採用）:
- **推奨フロー**: 新チャット **1 通目**に `NEW-SESSION-STARTER_yyyymmdd.txt`（**JST・常にこのファイル名**）**全文** → AI と本題 **§41 一問**（**項番 -0**）→ **`verify` / `session:bootstrap`（項番 0）**
- **`checkpoint-latest.md`** に **項番 -1 / -0** を追記（機械検査 `verify-constitution-handoff` にも必須フレーズとして組込）
- **`HANDOFF-HUMAN.txt`** / **`SESSION-BOOTSTRAP-CHECKLIST`** / **`session-handoff.mdc`** / **`constitution-handoff-gate.mdc`** を同期

v3.21 (2026-04-26) **§1-2-3-1 ティア宣言の可視化**（浜田「モデル切替時も分かりやすく」）:
- **NEW-SESSION-STARTER** 最上段 🚨 に **毎ターン先頭の `[§1-2-3 ティア判定: …]`**＋モデル切替時の再宣言・浜田の見方を明記
- **`constitution-handoff-gate.mdc`** に **浜田（確認）**節（無いターンは指摘可）
- **`SESSION-BOOTSTRAP-CHECKLIST` フェーズ 7 第 8 項**（ティア宣言必須）
- **`verify-constitution-handoff.mjs`** に必須フレーズ追加（ドキュ欠落で即 ng）

v3.20 (2026-04-26 深夜) **セッション切替の考慮漏れ潰し**（浜田「深く再検討し実行」）:
- **`checkpoint-latest.md` 項番 0** = **Read より前**に `npm run verify:constitution-handoff`（光速ガード）
- **`session:bootstrap`** = 先に verify 単体 → 続けて smoke 9 連（長い検査の前に憲法を二重確認）
- **`git-hooks/post-commit`** = commit 直後に verify（憲法ドキュ誤削除を push 前に検知・ログ `logs/git-hooks/post-commit.log`）
- **`2026-04-27-pc-ledger-1b-one-by-one.md`** に **「明日の公式オーダー」**（要件確認 → 4/26 未完了 → 4/27 予定）を追記
- **`HANDOFF-HUMAN.txt`** に AI 向け 1 行テンプレを追記（任意貼付）

v3.19 (2026-04-26 19:37) **機械ゲート**（迷走再発防止 / 浜田「仕組みを今日作って」）:
- **`scripts/verify-constitution-handoff.mjs`** + `npm run verify:constitution-handoff` — 必須フレーズ（TSB-024 / §35-1 / 役割宣言テンプレ等）が欠けたら **即 exit 2**
- **`npm run smoke:quiet` 第 9 検査**に組込 → `npm run session:bootstrap` でも自動実行
- **`.cursor/rules/constitution-handoff-gate.mdc`**（**`alwaysApply: false` + `globs`**）— TSB-024 系想起（禁句・§1-2-3-1）。**常時 true 核は `cio-constitution.mdc` のみ**（2026-05-09 薄型化追記）
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
- **Desktop（最優先）**: 浜田が参照する `AI緊急用\` の **`00-NEW-SESSION-STARTER_yyyymmdd.txt`**（儀式・**canonical**）および **`01`〜`06`-STARTER-…txt** / **`07-HANDOFF-AI-FIVE-BLOCKS.md` / `21-SESSION-BOOTSTRAP-CHECKLIST.txt` / `22-HANDOFF-HUMAN.txt` / `23-AI緊急用-README.txt`**（＋ read-pack **`08`〜`20`**・儀式同期 **`21`〜`23`**・鏡 **`24-handoff-log.md` / `25-checkpoint-latest.md`**・当日のみ **`26-evening-…md`**）を、本ファイルをコミットした **同一ターン**で **`npm run session-starter:sync-desktop`** により必ず更新する。未マウント時はスキップ＋チャット 1 行（後で再実行）。
- **目的**: 浜田が気づかないまま逆方向に進む事故を減らす（確認負荷は人に押し付けない）。

v3.13 (2026-04-26) PC 台帳仕様の正本固定 + セッション切替後もブレない管理:
- **フィールド設計・説明の正本**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0 〜 §4.4**（**着手前に Read**／v3.15・`SESSION-BOOTSTRAP` フェーズ 1b と同趣旨）。**画面上の短文ラベル**は `scripts/data/pc-ledger-v1-ui-display-labels.json`（長文はフォームに載せない）。
- **浜田 = 確認のみ（仕様の目視全文チェックは人に押し付けない）**／**Tier B は GO のみ人が出す**。整合は **AI が `npm run pc-ledger:verify-labels-spec`** で機械ゲート。**デプロイ・フィールド適用・snapshot 等のコマンド実行は GO 後も従来どおり AI が行う**（「やらない」「できない」にしない）。
- **何が追加され何が変わったか**: `docs/plans/2026-04-26-pc-ledger-label-spec-changelog.md`（コミット別・全フィールド対照表）
- **憲法級（変更禁止）**: **開発は AI・確認は浜田**（`AGENTS.md` **§35-1** / **§56-1a**）。逆転しない。
- **新チャットでも迷わない**: `chat-sessions/checkpoint-latest.md` の **「正本主義（PC 台帳 ver.1）」** と `RULES-INDEX.md` の **「セッション切替・文脈復元」** 表の該当行を Read 順に含める。

