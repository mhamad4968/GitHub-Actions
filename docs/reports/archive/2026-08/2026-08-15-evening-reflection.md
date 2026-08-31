# 🌙 本日のまとめ・反省 — 2026-08-15 (Sat) 20:08

> スコープ正本: `docs/runbooks/evening-reflection-scope.md` / day-close ③: 運用・体制・MCP・ルール・憲法  
> 第2者: DeepSeek（締め MCP-1・5観点の過不足）  
> **GO**: 浜田全承認（2026-08-15「すべて承認します」）。見送り MCP-2 / CON-1。正本 `docs/approved-changes/2026-08-15-evening-reflection-hamada-go.md`

---

## 📊 1. 自動収集ファクト

### 1-A. git の状態
**`git status`（未コミット）**:
```text
M chat-sessions/SESSION-CLOCK.md
```

**今日のコミット**:
```text
90db1065 chore(checkpoint): sync Git line after heal
bf09b401 fix(credit): refuse reset-day usage drops into the previous billing period
5463f641 chore(checkpoint): sync Git line after commit
7ed36044 fix(credit): archive June-August usage on billing reset day 15 and start new period at 1%
91ec901f chore(handoff): sync bridge + WAKE artifacts after cold-start
5cff02b7 chore(handoff): sync bridge + WAKE artifacts after cold-start
913823b4 chore(checkpoint): sync Git line after commit
5a822ab9 fix(checkpoint): LF-count freeze-zone minChars and include rollup scripts in WAKE allowlist
8562a59c chore(handoff): sync bridge + WAKE artifacts after cold-start
67999bb3 chore(handoff): sync bridge + WAKE artifacts after cold-start
4c529a05 chore(session): sync checkpoint Git + handoff bridge
a3e5080a chore(session): close morning 2026-08-15 after 715 visual OK.
09f6aaeb chore(checkpoint): sync Git line after commit
46625a07 sync(715): align list departments with cleaned app 680.
dceac332 feat(715): show list department picks in two columns.
6cb8349c chore(checkpoint): sync Git line after commit
c2932845 feat(715): keep filter accordion closed until opened.
a28f9906 feat(715): pick list departments from app 680 like 674, including construction units.
a533b060 chore(checkpoint): sync Git line after commit
d1717280 feat(715): color dept/user filters and fold them in an accordion.
```

### 1-B. kintone-apps.md 本日の追記
_(本日の追記なし)_

### 1-C. 朝ブリーフィングの警告
- ⚠️ 本文に ## 1 件の TSB セクションがあるが目次にない (drift)
- ### ⚠️ RAG ingest
- - ❌ npm outdated
- - ❌ RAG ingest

### 1-D. cron ログの失敗痕跡
- [2026-08-14T21:00:49.080Z]   exit=1 stdout=150B stderr=98B platform=win32 elapsed=1.9s
- [2026-08-14T21:00:51.721Z]   exit=1 stdout=3542B stderr=81B platform=win32 elapsed=0.4s

### 1-E. 会話履歴の量
本日更新された transcripts（参考）:
```text
C:\Users\mhamada202408224\.cursor\projects\1786571573611\agent-transcripts\27222007-5422-4e4a-a61e-633d4991bcba\27222007-5422-4e4a-a61e-633d4991bcba.jsonl (193399 bytes)
C:\Users\mhamada202408224\.cursor\projects\1786571573611\agent-transcripts\46bd896d-bf53-4211-9aed-234dd384455c\46bd896d-bf53-4211-9aed-234dd384455c.jsonl (326591 bytes)
C:\Users\mhamada202408224\.cursor\projects\1786571573611\agent-transcripts\46bd896d-bf53-4211-9aed-234dd384455c\subagents\80e4d07e-8859-4bc5-a9ee-d1ceebe2747d.jsonl (21987 bytes)
C:\Users\mhamada202408224\.cursor\projects\1786571573611\agent-transcripts\46bd896d-bf53-4211-9aed-234dd384455c\subagents\4fe25de4-ede5-4ffb-a9c4-cb2b70c4d11a.jsonl (9792 bytes)
C:\Users\mhamada202408224\.cursor\projects\1786571573611\agent-transcripts\46bd896d-bf53-4211-9aed-234dd384455c\subagents\a5628f61-ba16-4898-b136-9637ca2583ae.jsonl (9005 bytes)
```

### 1-F. 保留中の改善提案
_(保留中の提案なし)_

### 1-M. 夕反省キュー（引き継ぎ正本・chat-sessions/evening-reflect-queue.md）

> AI は **§2 以降で本節のチェック項目を処理**し、完了したら **正本キュー**で `- [x]` にするか行を削除すること。

# 夕反省までの引き継ぎキュー（正本）

> **目的**: 昼に「夜の反省会で」と積んだ項目を、**別チャット・別日でも漏れない**ようにする。  
> **運用**: 項目の追加・チェック・削除は **AI がコミット**（浜田は `HANDOFF-HUMAN.txt` の「次にやる1つ」でも可・AI がここへ転記）。  
> **取り込み**: `npm run evening:reflect`（= `node scripts/evening-reflect.mjs`）が **`docs/reports/<当日>-evening-reflection.md` の §1-M に本ファイル全文を貼る**。  
> **消化後**: 対応した行を **`- [x]` にするか削除**。空になったら `_（アクティブなし）_` 1 行だけ残してよい。  
> **毎夜固定（§44 / 2026-05-06）**: 反省レポート雛形の **§1-N（毎夜必須議題・憲法運用レビュー）** を **浜田と必ず議論**する（**CIO 二人体制・§1c・MCP・検証不足・ルールと実態**）。議論の結論は **§2 または §4 に 1 行以上** 残す。`AGENTS.md` **§44** 手順 2 参照。  
> **上書き防止（2026-05-05 夕反省承認 #D1）**: §2〜§5 を手で書いた **あと**に **`npm run evening:reflect`** を **再実行しない**（雛形で上書きされる）。追記は **エディタで直接** `docs/reports/YYYY-MM-DD-evening-reflection.md` を編集するか、再生成後に **もう一度 §2〜§5 を埋める**。  
> **出力方針（2026-05-05 浜田）**: **朝報・夕反省の本文はチャット貼付を主**とする。PDF 単体配布は行わない（保管場所が分かりにくいため）。

## アクティブ（未消化）

- [x] **【夜必達 · 2026-07-11 浜田】憲法改善をすべてやり切る** — 7/11 夜完了（lifecycle-v2 · verify 全緑 · push 済）
- [x] **【夜 · 2026-07-12】736 UI-BACKLOG-02** 列幅ドラッグ — 浜田目視 OK · CLOSED · rev186
- [x] **【夜 · 2026-07-12】体制更新の不具合修正** — WARN 整頓 · D-CHKPT-02 · smoke/bootstrap GREEN

- [x] **§51-6-2 壁時計**・**`[憲法適合]`** の運用（朝の習慣・区切り宣言）— **2026-07-04 浜田 GO（#D1）**: sessionStart/sessionEnd hook + `session:clock.mjs` CRLF 書き出し（#S3）で pre-commit 違反解消。議題は **§1-N 憲法運用レビュー** に集約。
- [x] **朝報** `docs/reports/YYYY-MM-DD-morning-prep.md` **未生成日の扱い** — **2026-07-07 GO**: `docs/runbooks/morning-prep-missing-day.md`
- [x] **薄型憲法・常時枠（2026-05-09 CIO）**: **YAML 常時注入は `cio-constitution.mdc` のみ**へ集約。分割 `.mdc` は **`false` + `globs`（または glob なし）**。`npm run verify:thin-rule-messaging` を smoke に追加。旧「10→11 枚」議題は **方針転換によりクローズ**（履歴議論は `handoff-log.md` 等に残存しうるが **現行正本は `cio-constitution` + verify**）。

## 完了（参照用・削除してよい）

- [x] **`docs/mcp-status.md`（4/28 追随）**（2026-05-05）: 見出し **最終更新 2026-04-28**・「表の鮮度」・自律向けルール追記済み。行ごとの使用回数は月次／イベント時まで据え置き。
- [x] **朝報 §51-4 スナップ更新**（2026-05-05）: キュー記載は 4/28 版を指していたが、`daily-morning-prep.mjs` は**当日日付のみ**出力。承認どおり **`node scripts/daily-morning-prep.mjs`** を実行し **`docs/reports/2026-05-05-morning-prep.md`**（§51-4 含む）を再生成した。4/28 分は `docs/reports/archive/2026-04/` 参照。
- **朝報の読みやすさ（見送り 2026-05-05 浜田）**: 先頭1枚サマリ・PDF 化・`daily-morning-prep.mjs` 構成見直しは**実施しない**。朝・夜は**チャット貼付**で運用。

### 1-N. 毎夜必須議題（憲法運用レビュー・浜田と必ず議論）

> **2026-05-06 明文化（CEO 指示）**: 夜の反省会（**§44**）で **毎回** 次を **口頭または同一チャットで扱う**（飛ばさない）。議論したら **§2 または §4 に「今日の結論」1 行以上** 残す（形骸化防止）。

- [x] **CIO 二人体制**: クレジット誤認の是正で DeepSeek（急落閾値）。締めは DeepSeek MCP-1。本体だけで締めていない
- [x] **§1c（仕様・検証）**: 今夜は台帳期間の訂正。customize/SPEC は未決を確定と言い換えていない
- [x] **MCP**: DeepSeek 使用。kintone MCP 未使用。`mcp:chat-stamp` 済
- [x] **「直った」検証不足**: `test:credit-budget-reset-guard` 6 件 OK。live `credit:status` は新期間 1%
- [x] **ルールと実態のズレ**: 課金日 1% を UI 内訳と誤認した。`credit:set` 急落拒否で実態を寄せた（#S1 反映済）

### 1-G. 直近 TSB（参考）
直近の TSB（参考・学習リソース）:
- TSB-041 — kintone DROP_DOWN 変更後 deploy 前 PUT で CB_VA01（2026-06-28 制定 / D-NAS-04 GO）
- TSB-040 — HeyGen 日本語 TTS 誤読・phonetic 長文 failed・クレジット枯渇（2026-06-28 制定 / video-gen パイロット）
- TSB-042 — kintone 一意 SINGLE_LINE_TEXT の 64 字制限で CB_VA01（2026-07-21 制定 / 実行予算 Ver.02 Phase C）

### 1-K. 未参照ルール統廃合候補
_(出力から未参照ルール行を抽出できず)_



### 1-L. §55・憲法改訂フォロー（D3 / 週次でも可）

<!-- 浜田チェック不要・自己申告用。AI が埋める。 -->

- [x] **§55-4/§55-5 整合**: AGENTS.md [BREAKING] なし。`_（該当なし）_`

---

## 2. 失敗（事実）

| # | 事実 |
|---|------|
| F1 | Plan & Usage の Cursor Models 1% を旧期間の UI 内訳と誤認し、`credit:set 1` を旧 period に書いた。正は課金日 8/15 の新期間開始 |
| F2 | Windows 再起動後、中身が HEAD と同一の assume-unchanged 2 ファイルが dirty に見え、close-git-warn が未コミット扱いした |

憲法運用レビュー（本日の結論）: 主因は **F1 課金日と UI 内訳の混同**。ガード（#S1）は今夜実装済。F2 は偽 dirty。

---

## 5. ③ 改善案 — 運用・体制・MCP・ルール・憲法

day-close ③の正本はこの5観点。脚本ID（A/#S）は手段であり、承認の主表ではない。

### 5-B 運用

| ID | 内容 | 失敗 | 状態 |
|----|------|------|------|
| **OPS-1** | Plan & Usage を受けたら **Total% と Resets 残日**で期間を決める。Cursor Models / Other Models は内訳。急落＋残日が約31日なら `credit:reset --now` のあと `credit:set` | F1 | **反映済** |
| **OPS-2** | 再起動後の `git status` dirty は、working tree と HEAD の hash を突合してから残件と報告する。中身同一なら偽 dirty | F2 | **反映済** |

### 5-A 体制

| ID | 内容 | 失敗 | 状態 |
|----|------|------|------|
| **ORG-1** | ③のチャットは **運用→体制→MCP→ルール→憲法** を先に出す。脚本A/#Sを主表にしない | 今夜の③抜け | **反映済** |
| **ORG-2** | 課金期間の判定は CIO が `reset_day` 正本と突合する。浜田に「内訳ですか」と聞き返して責任を移さない | F1 | **反映済** |

### 5-C MCP

| ID | 内容 | 失敗 | 状態 |
|----|------|------|------|
| **MCP-1** | 締めターンは DeepSeek を過不足1問に使う | （実施済） | **維持** |
| **MCP-2** | 課金ダッシュボード用の新 MCP は作らない。正本はスクショの Total%。§1-2-4 どおり公開 API なし | F1 | **見送り提案** |

### 5-D ルール

| ID | 内容 | 失敗 | 状態 |
|----|------|------|------|
| **RULE-1** | medal 行はレーン固定。本文で Subagent 未使用 | （維持） | **維持** |
| **RULE-2** | Plan & Usage 受領時は `docs/runbooks/cursor-plan-usage-watch.md`「月次リセット vs UI 内訳」を手順にする | F1 | **反映済** |
| **RULE-3** | close-git-warn は hash が HEAD と同一なら残件に数えない | F2 | **反映済** |

### 5-E 憲法

| ID | 内容 | 失敗 | 状態 |
|----|------|------|------|
| **CON-1** | AGENTS.md 大改訂はしない | — | **見送り提案** |
| **CON-2** | §1-2-4 の「混同禁止」1段落は今夜追記済。これ以上の憲法拡張はしない | F1 | **維持** |
| **CON-3** | ③の新規実装は GO 後。#S1（`credit:set` 急落拒否）は指摘是正として先行した例外 | F1 | **維持** |

---

## 3. 行動（自己規律・③の手段ではない）

| ID | 内容 | 状態 |
|----|------|------|
| **A1** | OPS-1 を毎回のスクショ受領で実行する | OPS-1 に含む |

## 4. 脚本（GO 後のリポ変更・③の手段）

| ID | 内容 | 状態 |
|----|------|------|
| **#S1** | `credit:set` 期間未ロール＋急落拒否 | **反映済**（`bf09b401`） |
| **#S2** | RULE-3 の実装（hash 同一は残件外） | RULE-3 に含む。GO 後 |

---

## 6. 反映先（承認後）

- OPS-1 / RULE-2: `docs/runbooks/cursor-plan-usage-watch.md`（本文済）＋運用徹底
- ORG-1: day-close ③のチャット順（本ファイル＋次回から）
- RULE-3 / #S2: `scripts/verify-session-close-git-warn.mjs`
- GO 記録先: `docs/approved-changes/2026-08-15-evening-reflection-hamada-go.md`

**出さないもの（スコープ）**: レーン宣言の提案・第1手・スケジュール案。

---

## ~~🌅 明日へ~~（使用禁止 — 2026-05-30）

<!-- 次アクション・レーン・第1手は checkpoint / handoff / 当日 -0 へ。ここには書かない。 -->
