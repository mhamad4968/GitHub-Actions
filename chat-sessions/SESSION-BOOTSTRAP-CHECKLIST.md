# セッション引き継ぎ後 — 全棚卸しチェックリスト（AI 必須）

> **目的**: 経緯・「法律」に相当する制約・ルール・備わっている機能・MCP を **読み飛ばさず** 再確認し、浜田が気づかないまま **逆方向に進む事故** を防ぐ。  
> **憲法**: **開発は AI・確認は浜田**（`AGENTS.md` §35-1 / §56-1a）。本リストは **AI が実行・報告**する（浜田に全文チェックを押し付けない）。  
> **浜田運用の最優先**: `C:\Users\mhamada202408224\Desktop\AI緊急用\` の `.txt`。本ファイルを更新したコミットでは **`npm run session-starter:sync-desktop`** を同一ターンで実行し、`SESSION-BOOTSTRAP-CHECKLIST.txt` を必ず揃える（`/mnt/c` が無いときだけスキップ＋チャット 1 行）。

---

## フェーズ 0 — 時刻（§39）

- [ ] 日付・曜日・「朝/昼/夜」に触れる前に **`date '+%Y-%m-%d %H:%M (%a)'`** を実行し、その出力を根拠にする。

---

## フェーズ 1 — 経緯（いまどこまで）

| # | 読むファイル | 目的 |
|---|-------------|------|
| 1.1 | `chat-sessions/checkpoint-latest.md` 先頭〜**最終更新** | 現在地・自律復元 Read 順 |
| 1.2 | `chat-sessions/handoff-log.md` **末尾最大 3 ブロック** | 直前セッションの合意・GO・git 一行 |
| 1.3 | `chat-sessions/<本日または直近日付>.md` があれば | 当日タイムライン |
| 1.4 | 継続タスクの **実行計画**（例: `docs/plans/2026-04-26-pc-ledger-day4-action.md`） | 次の 1 手・Tier B の有無 |

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
| 2.1 | `AGENTS.md` — **§0 索引**、**§35-1**、**§52**（Tier A/B）、**§56-1a** | 開発/確認分担・ゲート |
| 2.2 | `RULES-INDEX.md` — 冒頭「タスク開始時」表 + **セッション切替・文脈復元**節 | 逆引き |
| 2.3 | `WORKFLOW.md` Phase 0 のみ（着手前儀式） | タスク OS |
| 2.4 | `.cursor/rules/session-handoff.mdc` | 引き継ぎ漏れ防止・復元手順 6 |

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
| 4.2 | `scripts/smoke-test.mjs` 先頭コメント（8 検査の内訳） | 機械ゲートの意味 |
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

---

## フェーズ 6 — 機械検証（**必須・Read だけで終わらせない**）

```bash
cd /path/to/kintone-ai-lab && npm run session:bootstrap
```

- [ ] 上記が **exit 0**（warn のみなら内容をチャットに要約し、続行可否を判断）
- [ ] **ng なら** その検査を直すまで本題の kintone 書込・憲法改定・hooks 変更に進まない

`session:bootstrap` は内部で **`npm run smoke:quiet`**（guard + 4 audit + verify:breaking + xref + health + rule-watcher + parallel）を実行する。

---

## フェーズ 7 — チャットでの報告義務（浜田が安心するため）

AI は上記を終えたら **このターン内**で、次を **箇条書きで短く**報告する（長文禁止・§37 簡潔報告）:

1. **経緯**: checkpoint 最終更新 1 行の要約 + handoff から続くか  
2. **憲法**: §35-1 / §56-1a を再確認したこと  
3. **session:bootstrap**: ok / warn / ng（ng ならどれか）  
4. **MCP**: health-check 上の active / 注意（1 行）  
5. **次の 1 手**: 何をするか（Tier B なら GO 待ちと明記）  
6. **新・PC台帳を触る場合**: フェーズ **1b-C テンプレ**を貼ったうえで **1b 完了**と書く（テンプレ無しの「仕様確認しました」は不可。**未完了なら Tier B に進まない**）  
7. **役割宣言（TSB-024 / 2026-04-26 追加 / 引き継ぎ要約耐性）**: 次の 1 行を必ず貼る  
   `(7) 役割宣言: deploy / apply / push / 検証コマンドの実行は私（AI）が行います。浜田には GO と画面目視の確認のみ依頼します（§35-1 / §56-1a / TSB-024）。`  
   これを宣言しないままターンを終えるのは禁止。**「再デプロイしてください」「手動アップロードで OK」「`npm run xxx` を実行してください」は §35-1 違反**（禁句一覧は `NEW-SESSION-STARTER.md` 最上段 🚨 ブロック）。

---

## メンテナンス

- 新しい「必須検査」が `smoke-test.mjs` に入ったら **本ファイルフェーズ 6 の説明を同期**する。  
- 新しい永続ドキュが「引き継ぎ必読」になったら **フェーズ 1–2 の表に 1 行追加**する。
- **`NEW-SESSION-STARTER.md` / 本ファイルを編集して push した AI** は、**同一ターンで `npm run session-starter:sync-desktop` を必須**とし、浜田が開く `AI緊急用\*.txt` をリポと揃える（§57-6）。WSL で `/mnt/c` が無い等のときだけ省略可＋チャットに理由 1 行。
