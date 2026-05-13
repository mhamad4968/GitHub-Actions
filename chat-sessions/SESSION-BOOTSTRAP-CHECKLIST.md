# セッション引き継ぎ後 — 全棚卸しチェックリスト（AI 必須）

> **目的**: 経緯・「法律」に相当する制約・ルール・備わっている機能・MCP を **読み飛ばさず** 再確認し、浜田が気づかないまま **逆方向に進む事故** を防ぐ。  
> **憲法**: **開発は AI・確認は浜田**（`AGENTS.md` §35-1 / §56-1a）。本リストは **AI が実行・報告**する（浜田に全文チェックを押し付けない）。  
> **浜田運用の最優先**: `C:\Users\mhamada202408224\Desktop\AI緊急用\` の **儀式・read-pack**（**ファイル名の先頭番号＝読取順**）。例: `00-NEW-SESSION-STARTER_yyyymmdd.txt` / **`01`〜`06`-STARTER-…txt** / `07-HANDOFF-AI-FIVE-BLOCKS.md` / `08-INDEX.txt` … `20-SESSION-REPORT-CHECKLIST.txt` / `21-SESSION-BOOTSTRAP-CHECKLIST.txt` / `22-HANDOFF-HUMAN.txt` / `23-AI緊急用-README.txt` / **`24-handoff-log.md`** / **`25-checkpoint-latest.md`**（＋当日のみ `26-evening-reflection-*.md`）。本ファイルを更新したコミットでは **`npm run session-starter:sync-desktop`** を同一ターンで実行し、上記を必ず揃える（`/mnt/c` が無いときだけスキップ＋チャット 1 行。Windows ネイティブ Node では **`SESSION_STARTER_DESKTOP_DIR`** に実 Desktop パスを渡す）。
>
> **v3.27+ 恒久**: セッション初手の **項番 -1〜0（機械）と実行順**の**詳細正本**は **`NEW-SESSION-STARTER.md` 冒頭「■ 貼付単独で完走」** のみ。本チェックリストの下表は **鏡像**（追従）。**浜田の貼付はスターター全文＋任意 HANDOFF** に固定し増やさない。

---

## フェーズ 0 — 時刻（§39）

- [ ] 日付・曜日・「朝/昼/夜」に触れる前に **`date '+%Y-%m-%d %H:%M (%a)'`** を実行し、その出力を根拠にする。

---

## 日終わり（推奨・2026-04-26 追補）

> 正本: `chat-sessions/checkpoint-latest.md`「**日終わり（推奨）**」。

- [ ] **セッション報告**: `docs/session-report-checklist.md`（詳細）または Desktop **`20-SESSION-REPORT-CHECKLIST.txt`** で自己点検し、必要ならチャットに貼付（2026-05-06 起票）
- [ ] **`npm run session-starter:sync-desktop`**（儀式・read-pack・**25/26 引継ぎ正本** 一式。詳細は `checkpoint-latest.md` 項番 0b）
- [ ] **`npm run verify:desktop-ai-emergency-sync`**（成功時 **貼付推奨**行まで確認。チャットに 1 行要約してよい）
- [ ] **今日のチャットを閉じる前**に指示があれば **`npm run session:clock:clear`**（`SESSION-CLOCK.md` の **開始:** を **未設定**／§51-6 遵守事項 7）＋**`session:clock:web` は Ctrl+C**
- [ ] 時間があれば **`npm run session:bootstrap`** まで

---

## セッション切替の推奨フロー（浜田運用・2026-04-26 追補）

> 正本（詳細）: `chat-sessions/NEW-SESSION-STARTER.md` **「■ 貼付単独で完走」**。索引・日付整合: `chat-sessions/checkpoint-latest.md`「セッション切替後の自律復元」**項番 -1 / -0 / 0**。

| 順 | 誰 | すること |
|---|-----|----------|
| **-1** | **浜田** | 新チャット **1 通目**に **`AI緊急用\00-NEW-SESSION-STARTER_yyyymmdd.txt`（JST・常にこの 1 ファイル名）** の **全文**を貼る（**必須級・これだけで項番 -1 素材は足りる**）。**貼付推奨**は verify の最終行。`22-HANDOFF-HUMAN.txt` 5 行は **任意**（メモ用）。checkpoint をチャットに **重ねて貼らなくてよい**（v3.27）。 |
| **-0** | **浜田＋AI** | AI: ティア宣言＋スターター受領＋**次に着手すること**を **§41 一問だけ**確認。**浜田 OK が出るまで項番 0（verify/bootstrap）に着手しない**。詳細はスターター内 **「■ 貼付単独で完走」**。 |
| **0** | **AI** | **`npm run session:bootstrap`**（内包順: `verify:constitution-handoff` → **`verify:mandatory-read-gate`**（必読ファイル構造）→ **`verify:session-clock-health`**（§51-6-2 hooks / crontab node）→ **`session-starter:sync-desktop`**（`C:\Users\mhamada202408224\Desktop\AI緊急用` 都度メンテ）→ **`verify:desktop-ai-emergency-sync`**（バイト一致）→ `smoke:quiet`）。**全文貼付済みなら -0 OK 直後に実行**し、棚卸し Read（フェーズ 1）は **bootstrap 通過後**でよい。激短のみ verify だけは非推奨。 |

---

### 段階読解で「理解の時間」を確保する（推奨・2026-05-01）

**一度に多ファイルを浅く読まない**ときは、`chat-sessions/SESSION-READ-LADDER.md` に従う。**A. 共通五段階**＝プロジェクト着手前の **ルール理解のみ**（`SPEC.md` は読まない）。各段のあと **事前準備用テンプレ**で **「ルール・運用で何を理解したか」だけ**をチャットに残す。**B. プロジェクト確認**＝本題決定後の **仕様の小出し（B1-①…）と §41・GO**。下表「フェーズ 1」と**併用可**（矛盾時は `checkpoint-latest.md`「セッション切替後の自律復元」の項番順を優先）。

---

## フェーズ 1 — 経緯（いまどこまで）

| # | 読むファイル | 目的 |
|---|-------------|------|
| 1.1 | `chat-sessions/checkpoint-latest.md` 先頭〜**最終更新** | 現在地・自律復元 Read 順 |
| 1.2 | `chat-sessions/handoff-log.md` **末尾最大 3 ブロック** | 直前セッションの合意・GO・git 一行 |
| 1.3 | `chat-sessions/<本日または直近日付>.md` があれば | 当日タイムライン |
| 1.4 | 継続タスクの **実行計画（本題 1 つに対応）** | 次の 1 手・Tier B の有無。例: **PC 台帳**＝`docs/plans/2026-04-26-pc-ledger-day4-action.md` 等／**部署予実**＝`templates/yojitsu-budget-lite/SPEC.md` §10.1 ＋同ディレクトリ `docs/*.md`。**本題と無関係な plan は読まない**（項番 -0 と食い違うと項番 0.9） |

---

## フェーズ 1c — 部署予実（yojitsu）を本題にする場合（PC 台帳と混同しない）

> **目的**: セッション切替直後に **PC 台帳用の 1b・674・§4.2** を読みに行き、**予実の kintone 化**と手順を取り違える迷走を防ぐ。`checkpoint-latest.md` **項番 5A** と同義。

次のいずれかに当てはまる **着手前**に、**最低限**下表を Read 済みにする（**PC 台帳フェーズ 1b はスキップ可**）。

- [ ] **kintone** で **部署予実アプリの新規作成**（`kintone-add-app`）・フィールド設計・deploy・本番データ投入を行う
- [ ] `templates/yojitsu-budget-lite/SPEC.md` または同配下 `docs/*.md` を **仕様変更として**編集する
- [ ] **仕様確認デイ（読みのみ）**: **当日は kintone 書込・deploy に入らない**が、`SPEC.md` / `docs/*.md` の **読み合わせ・矛盾洗い**を本題にする（**知恵袋 → CIO 突合**・**§50-3-8**・**`handoff-log.md` 1 行**は **`checkpoint-latest.md`「部署予実・仕様確認デイ」**どおり）

| # | 読むファイル | 目的 |
|---|-------------|------|
| 1c.1 | `templates/yojitsu-budget-lite/SPEC.md`（**§9・§10.1** を含む） | 確定仕様・マイルストーン |
| 1c.2 | `templates/yojitsu-budget-lite/docs/yojitsu-master-and-field-plan.md` | マスタ要否・フィールド案 |
| 1c.3 | `templates/yojitsu-budget-lite/docs/yojitsu-migration-kyu-to-kintone.md` | 旧→kintone 投入方針 |
| 1c.4 | `templates/yojitsu-budget-lite/docs/shin-format-excel-layout.md` | Excel 列・二正本 |
| 1c.5 | `templates/yojitsu-budget-lite/docs/yojitsu-spec-session-checklist.md` | 仕様セッション用チェック |
| 1c.6 | `.cursor/rules/creation-timing-ask.mdc` | **作成着手前**のスペース・タイミング（§41） |

**§50-3-8（憲法・盲点・セッション切替後も再実行）**: 上表の **kintone 作成・フィールド・計算ロジック・複雑 customize** または **`SPEC.md` / `docs/*.md` の仕様変更編集**に**着手する直前**、必ず **DeepSeek** で盲点3点（型／SPEC 乖離／差異ロジック）を抽出し、**直後**に正本と突合した**約3行の突合メモ**をチャットに残す（`AGENTS.md` §50-3-8）。**新チャットに切り替わったら**、前セッションの突合メモだけで済ませず、**同じ作業区分に再入る直前に再度** §50-3-8 を実行する。

**Tier B**: `kintone-add-app` / `add-form-fields` / deploy / 本番レコード書込は従来どおり **浜田 GO 後に AI が実行**（§35-1 / §56-1a / TSB-024）。

**仕様確認デイ**: 上の **Read 表 1c.1〜1c.5** と **§50-3-8** は実施。**1c.6**（`creation-timing-ask`）は **「このデイでアプリ作成に着手する場合」**に必須。**終了時**は **`handoff-log.md`** に **確定／未確定**と **次セッション 1 行**（`checkpoint-latest.md` 表の通り）。

**§50-3-9（憲法・kintone MCP 失敗時）**: kintone 系 MCP が **構造エラー**を返したら **同一ツールを再試行せず**、**REST**（`scripts/` 実績パターンまたは `scripts/tmp-kintone-*.mjs`）へ移行して完遂する（詳細は `AGENTS.md` §50-3-9）。**タスク着手 1 ターン目の航海図**に **手段(第2)=REST** を併記する（§50-3-2）。

---

## フェーズ 1b — 新・PC台帳 ver.1 を触る場合（仕様書必読）

> **時刻・質疑タイミング**: AI は **`date -Is`（JST）**で時刻を取る。浜田が **19:15 JST 以降に 1 問ずつ**と指定した場合、それより前は **仕様の質問をチャットに出さない**（精読・正本誤記修正・機械ゲートのみ）。手順のキューは `2026-04-27-pc-ledger-1b-one-by-one.md` の「19:15 JST 以降」節。

> **Day4 手順書・チャット要約だけで判断しない**。正本は `docs/plans/2026-04-21-new-pc-ledger-spec.md`。**仕様を読まないままではアプリ枠（`kintone-add-app`）以降を設計根拠付きで進められない**（§2 の 35 フィールド・採番・SKYSEA 別枠はすべて正本に依存）。  
> **「今日は仕様確認しますか？」だけでターンを終えない**。仕様確認＝下の **1b-A〜C オーダー**を同一ターン内で完了し、**テンプレをチャットに貼るまで**。ここが空のまま **Tier B（`kintone-add-app` 等）に進むことは禁止**（オーダー通りに作れない）。  
> **進め方（浜田合意）**: AI が正本を **§4.2.2 マトリクス・§4.5 表まで含め通読**し、**表で既に答えている内容は質問しない**（行間・矛盾・実装ブレのみ）。**不明点を 1 ターン 1 問**で浜田に確認し、答えを反映してから次へ。**22:00 まで詰める日は同一晩に質疑・作業を続行**（翌日待ち必須としない／一覧は `2026-04-27-pc-ledger-1b-one-by-one.md` 冒頭）。

次のいずれかに当てはまる **着手前**に、**1b-A〜C すべて**を実施する。

- [ ] **kintone** の **アプリ新規作成（`kintone-add-app`）**、または App 674（新・PC台帳）の **フィールド追加・変更・deploy・ラベル適用**
- [ ] `scripts/data/pc-ledger-v1-ui-display-labels.json` / `pc-ledger-spec-4222-ui-labels.json` / `field-spec-diff` / `pc-ledger:apply-labels` を触る
- [ ] `customize/**/desktop.js`（新・PC台帳）の **自動生成・種別切替・バナー**等のロジック変更

**Read 範囲（最低）**: **§4.2.0**（浜田認識・コア vs SKYSEA）〜 **§4.4**（ボタン・表示切替）。迷ったら **§4.3 採番**まで広げる。

#### 1b-A Read（必須）

- [ ] `docs/plans/2026-04-21-new-pc-ledger-spec.md` の **§4.2.0〜§4.4** を Read 済み

#### 1b-B 機械ゲート（必須・同一ターン内）

- [ ] `npm run field-spec:generate -- --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md` を実行し、stderr に **`[field-spec-diff] generated 35 fields`** があること（≠35 なら正本か §2 を直してから再実行）
- [ ] ラベル JSON または `pc-ledger:apply-labels` を触るタスクなら **`npm run pc-ledger:verify-labels-spec`** = **OK**（触らないなら **対象外**とテンプレに書く）

#### 1b-C チャット報告テンプレ（必須・§37 簡潔でよい）

コピーして空欄を埋め、**同一ターン内**に貼る。

```
【1b 仕様確認オーダー完了】
- Read: §4.2.0〜4.4 済
- コア* vs SKYSEA 別枠: 説明可能（1行で可）
- field-spec:generate: 35 fields 確認済
- verify-labels: OK / 対象外
- 次: Tier B …（GO待ち or 実行内容）
```

---

## フェーズ 2 — ルール・憲法（迷ったらここ）

| # | 読む / すること | 目的 |
|---|----------------|------|
| 2.1 | `AGENTS.md` — **§0 索引**、**§35-1**、**§35-6**（成果物削除ゲート）、**§52**（Tier A/B）、**§56-1a** | 開発/確認分担・ゲート |
| 2.2 | `RULES-INDEX.md` — 冒頭「タスク開始時」表 + **セッション切替・文脈復元**節 | 逆引き |
| 2.3 | `WORKFLOW.md` Phase 0 のみ（着手前儀式） | タスク OS |
| 2.4 | `.cursor/rules/session-handoff.mdc` | 引き継ぎ漏れ防止・復元手順 6 |

- [ ] **§35-6（成果物削除・「古い」整理）**: 削除・正本移動を含む前に **復元可否（Git／ゴミ箱のみ等）**を一文で述べ、**浜田の明示承認または §41 一問**を得てから実行（詳細 **`AGENTS.md` §35-6**・`docs/troubleshooting.md` **TSB-031**）。日報・長文ログの **正本は `chat-sessions/`＋コミット**、Desktop `AI緊急用` は **`session-starter:sync-desktop` の控え**。

---

## フェーズ 3 — 「法律」に相当する制約（漏れやすい）

> 裁判法の条文ではなく、**守らないと契約・監査・個人情報・セキュリティで詰む境界**を指す。

| # | 参照 | 内容 |
|---|------|------|
| 3.1 | `AGENTS.md` **§18 セキュリティ**、**§17 / §17-2 / §17-3**（MCP・秘密） | 秘密の非露出・`mcp.json` 手順 |
| 3.2 | `AGENTS.md` **§52-8 / §52-8-1** | 高リスク shell・物理 block |
| 3.3 | `AGENTS.md` **§1-2-2**（API 制限・フォールバック禁止） | モデル異常時の停止報告 |
| 3.4 | `docs/troubleshooting.md`（TSB 目次 + 直近関連 ID） | 既知の地雷 |
| 3.5 | `kintone-apps.md`（触るアプリがある場合） | **単一の真実**（§2）・フィールド・権限 |
| 3.6 | 個人情報・CSV・エクスポートを触る場合 | `docs/` 内の該当設計・**一覧・JSON をチャットに貼らない**（権限・マスキングは §18・各計画書に従う） |

---

## フェーズ 4 — 備わっている機能（npm / cron / hooks）

| # | コマンドまたはファイル | 目的 |
|---|------------------------|------|
| 4.1 | `package.json` の `scripts` を **ざっと目視**（特に `smoke` / `verify:all` / `health-check` / `pc-ledger:*`） | 何が一発で回るか |
| 4.2 | `scripts/smoke-test.mjs` 先頭コメント（9 検査の内訳） | 機械ゲートの意味 |
| 4.3 | `scripts/health-check.mjs` がプローブする項目（S1–S16） | MCP・cron・RAG 等 |
| 4.4 | 必要なら `docs/troubleshooting.md` の cron / hook 系 TSB | 未起動 watcher 等 |

---

## フェーズ 5 — MCP（「全部」確認のやり方）

> Cursor がマウントする **MCP ツール記述子**はワークスペースごとに `~/.cursor/projects/<id>/mcps/<server>/tools/*.json` にある（本リポの Chat からは `call_mcp_tool` 前に schema を読む運用と同趣旨）。**一覧の正**は `health-check` の MCP probe（`npm run health-check`）と **`AGENTS.md` §50（想起儀式）**。

| # | すること | 目的 |
|---|----------|------|
| 5.1 | **`npm run health-check`** の MCP 節を読む（または JSON 出力があればそれ） | 接続・死蔵・exempt |
| 5.2 | `AGENTS.md` **§50 / §50-2** | どのタスクでどの MCP を使うか・死蔵判定 |
| 5.3 | `~/.cursor/mcp.json` を変更する予定がある場合のみ **§17-2 手順** | 破壊的操作の禁止 |
| 5.4 | 新しくツールを呼ぶ前に **該当 `tools/*.json` を Read**（MCP FileSystem 規約） | 引数ミス・認証漏れ防止 |
| 5.5 | `.cursor/rules/mcp-frontend-shadcn-chrome.mdc` ＋ **`mcp-server-use-triggers.mdc`** の **shadcn-ui / chrome-devtools** 行 | UI・FE デバッグ時の MCP 先出し（**descriptor** は `mcp-tool-discipline.mdc`） |
| 5.6 | WSL の `~/.cursor/mcp.json` を更新したら **`cd ~/kintone-ai-lab && npm run mcp:sync-cursor-windows`**（Windows 側と単一ソース） | TSB-028 再発防止 |

---

## フェーズ 5.5 — §51-6-2（セッション切替時刻の目印）

- [ ] **`chat-sessions/SESSION-SPLIT-REMINDER.md`** を Read（浜田=4h アラーム / AI=**【セッション切替】** 先頭行）
- [ ] **`npm run session:clock:set`** で **`chat-sessions/SESSION-CLOCK.md`** の `開始:` を更新（§51-6-2 **時間軸**の客観起点）
- [ ] **sessionStart hook** により **`session:clock:set` + `session:clock:watch`** が自動（`.cursor/hooks.json`）。無効環境のみ手動で `SESSION-SPLIT-REMINDER` 参照
- [ ] 長時間作業を始める前に **OS タイマー 4 時間**をセット（任意だが強く推奨）

## フェーズ 6 — 機械検証（**必須・Read だけで終わらせない**）

```bash
cd /path/to/kintone-ai-lab && npm run session:bootstrap
```

- [ ] 上記が **exit 0**（warn のみなら内容をチャットに要約し、続行可否を判断）
- [ ] **ng なら** その検査を直すまで本題の kintone 書込・憲法改定・hooks 変更に進まない
- [ ] **新チャットで時間がないとき**は最低 **`npm run verify:constitution-handoff`** → **`npm run verify:mandatory-read-gate`** を **Read より先**に実行（光速・TSB-024 ＋ 必読構造）。**いずれか ng なら本題に入らない**。
- [ ] **Desktop が無い環境・余剰時間の自律健全性**（Tier A）: **`npm run verify:agent-env`**（憲法→必読ゲート→`verify:all`→`smoke:quiet`。**Desktop 同期・`verify:session-clock-health` は含まない**＝`session:bootstrap` の代替ではない）。warn/ng があれば **1 件**だけ直す。
- [ ] **v3.27+・スターター全文貼付済み**: **項番 -0 で浜田 OK 後**に本フェーズの **`session:bootstrap` を最優先**。フェーズ 1 の棚卸し Read は **bootstrap 成功後**でよい（実行順の正本は `NEW-SESSION-STARTER.md` **「■ 貼付単独で完走」**）。

`session:bootstrap` は内部で **(A)** `verify-constitution-handoff.mjs`（**先頭・光速**）→ **(A2)** `mandatory-read-gate.mjs`（**必読ファイル構造**）→ **(A3)** `session-clock-health.mjs --strict`（**§51-6-2 壁時計** hooks / crontab node 整合）→ **(B)** `session-starter:sync-desktop`（浜田 Desktop **AI緊急用**）→ **(C)** `verify-desktop-ai-emergency-sync.mjs`（`.txt` とリポ正本のバイト一致）→ **(D)** **`npm run smoke:quiet`**（guard + 4 audit + verify:breaking + xref + health + rule-watcher + parallel + **verify:constitution-handoff** + **verify:mandatory-read-gate** + **verify:ci-rule-integrity** の **11 検査**）の順で実行する。

---

## フェーズ 7 — チャットでの報告義務（浜田が安心するため）

> **厳守（浜田 CEO・2026-05-06）**: **`session:bootstrap` 完了後**、または **引き継ぎ直後の棚卸しをチャットで報告するターン**は、**下の §1 先頭4行（§1-1〜§1-4）を応答の最上段に置いたうえで**、**番号 1〜8 および 4a を、この見出しどおりにすべて埋めた応答**だけを **有効な報告**とする。**`[§1-2-3 ティア判定]`・`【適用憲法】`・`[🎖️ 本セッション割当]`・`[ルール確認]` のいずれかが欠けるものも認めない**（`every-turn-rules-confirm.mdc` §1 の **CEO 受付ゲート**と同値）。**チェックシート（本条）なしの自由形式・「要点だけ」・項目の飛ばし・未実行の隠蔽**は **認めない**（`every-turn-rules-confirm.mdc` §1e と併記。**§1e の【セッション報告チェックシート】**は **別枠** — 報告ターンでは **そちらも** `docs/session-report-checklist.md` 正本に従う）。

AI は上記を終えたら **このターン内**で、次を **箇条書きで短く**報告する（長文禁止・§37 簡潔報告）。**必ずこの順序**: **§1-1〜§1-4（最上段）** → **1〜8 および 4a**。

**§1 先頭4行（`every-turn-rules-confirm.mdc` §1 と同一ラベル・同一順・応答の最上段・省略禁止）**

- **§1-1** **`[§1-2-3 ティア判定: L1|L2|L3]`** …（根拠 1 語以上。`AGENTS.md` §1-2-3-1）
- **§1-2** **`【適用憲法】`** …（今ターンで依拠する **`AGENTS.md` の §** を列挙した要約。**憲法スコープ外**なら `【適用憲法】§なし（…）` 等でよい）
- **§1-3** **`[🎖️ 本セッション割当]`** …（`CIO=… | DeepSeek=… | Kimi=… | OpenRouter=…`。未起用は `未使用`。**継続ターン**は「継続・前ターンと同割当」でよいが **1 行は必須**）
- **§1-4** **`[ルール確認]`** …（本棚卸しで **Read した正本**のパス。外部の正が主題なら **`mcp-server-use-triggers.mdc` Read 済み**または **`MCPスキップ:（理由1語以上）`** 等、`every-turn-rules-confirm.mdc` §1 に準拠）

1. **経緯**: checkpoint 最終更新 1 行の要約 + handoff から続くか  
2. **憲法**: §35-1 / §56-1a を再確認したこと  
3. **session:bootstrap**: ok / warn / ng（ng ならどれか）  
3b. **Desktop AI緊急用**: `verify:desktop-ai-emergency-sync` が **OK 全行**か **SKIP（フォルダ無し）**かを 1 行（セッション切替のメンテ確認）。**成功時は最終行の `貼付推奨（項番-1）:` をそのままチャットに貼ってよい**（案 D）  
4. **MCP**: health-check 上の active / 注意（1 行）  
4a. **フロント MCP（2026-05-06）**: 本題が **UI コンポーネント（Shadcn 等）**または **フロント不具合・表示確認**に該当する場合、**`shadcn-ui` / `chrome-devtools` を使った事実**を **1 行**（例: 「Shadcn で Button の import 確認」「DevTools で console の TypeError 1 件確認後に修正」）。**本題がフロントに関わらない**ときは **`フロントMCP: 対象外`** と明記。**フロント本題なのに未使用**なら **`フロントMCP未使用`＋理由 1 行**（例: 「MCP 赤・オフライン」）。**日次締め**を書くセッションでは、同趣旨の 1 行を **`SESSION-CLOSE-REPORT_yyyymmdd.txt` の §0 要約または §1 表**にも入れる（監査用・`SESSION-CLOSE-REPORT-20260504.txt` §6 と整合）。  
5. **次の 1 手**: 何をするか（Tier B なら GO 待ちと明記）  
6. **新・PC台帳を触る場合**: フェーズ **1b-C テンプレ**を貼ったうえで **1b 完了**と書く（テンプレ無しの「仕様確認しました」は不可。**未完了なら Tier B に進まない**）  
6b. **部署予実を触る場合**: フェーズ **1c** の Read をした旨を 1 行（**1c 対象外**なら「予実本題なし」と明記）  
7. **役割宣言（TSB-024 / 2026-04-26 追加 / 引き継ぎ要約耐性）**: 次の 1 行を必ず貼る  
   `(7) 役割宣言: deploy / apply / push / 検証コマンドの実行は私（AI）が行います。浜田には GO と画面目視の確認のみ依頼します（§35-1 / §56-1a / TSB-024）。`  
   これを宣言しないままターンを終えるのは禁止。**「再デプロイしてください」「手動アップロードで OK」「`npm run xxx` を実行してください」は §35-1 違反**（禁句一覧は `NEW-SESSION-STARTER.md` 最上段 🚨 ブロック）。
8. **§1-2-3-1 ティア宣言（再掲・モデル可視化）**: **§1-1 と同一内容**なら **`項目8: §1-1 と同一`** と **1 行**でよい。**Cursor でモデル切替**した本ターンだけは、**更新後のティア**を **1 行で再掲**（`AGENTS.md` §1-2-3-1・§1-2-3-2）。Tier B なのに L1/L2 だけ → L3 要否を自己点検。
8b. **🎖️ 本セッション割当（再掲）**: **§1-3 と同一内容**なら **`項目8b: §1-3 と同一`** と **1 行**でよい。**割当を変えた**ときだけ **§1-3 に足りない差分をここに 1 行**追記。**新チャット第 1 応答**の詳細運用は `NEW-SESSION-STARTER.md`・**read-pack `08-READ-06.txt` §10**。

---

## メンテナンス

- **`npm run verify:agent-env`** の中身（`package.json` の連鎖）を変えたら **フェーズ 6 の該当箇条書き**と **`RULES-INDEX.md` §57-5 行**を同期する。
- 新しい「必須検査」が `smoke-test.mjs` に入ったら **本ファイルフェーズ 6 の説明を同期**する。  
- 新しい永続ドキュが「引き継ぎ必読」になったら **フェーズ 1–2 の表に 1 行追加**する。
- **`NEW-SESSION-STARTER.md` / 本ファイルを編集して push した AI** は、**同一ターンで `npm run session-starter:sync-desktop` を必須**とし、続けて **`npm run verify:desktop-ai-emergency-sync`** で浜田が開く `AI緊急用\`（`00-NEW-SESSION-STARTER_yyyymmdd.txt` / `23-AI緊急用-README.txt` 等）をリポと揃えたことを確認する（§57-6）。WSL で `/mnt/c` が無い等のときだけ省略可＋チャットに理由 1 行。
