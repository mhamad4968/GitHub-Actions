# 🌙 本日のまとめ・反省 — 2026-07-04 (Sat) 21:24

> 本ファイルは `scripts/evening-reflect.mjs` が生成した雛形です。
> AI（私）はこの内容を読み、要因分析と改善提案（#R1/#S1/#D1...）を追記してユーザーへ提示します。
> ユーザーが「#R1 承認」「#S1 却下」等で返答 → AI が `docs/approved-changes/<明日>/` に承認済み JSON を作成 → 翌朝 06:00 cron が自動実施。

---

## 📊 1. 自動収集ファクト

### 1-A. git の状態
**`git status`（未コミット）**:
```text
M chat-sessions/checkpoint-latest.md
 M chat-sessions/handoff-log.md
 M docs/handoff/latest-session-bridge.json
 M docs/knowledge/debug-tips.md
```

**今日のコミット**:
```text
2b59e4e docs(736): 機能改善予定を課題メモ §9.2.2 に追記
9e9dc3d docs(checkpoint): push済 abd971e 反映
abd971e fix(698): eslint unused q init in mount698EmpFilterBar
9a94ad8 feat(bi+736): 698在籍フィルタ・700後段評価折りたたみ・736行メニューrev168
603212f docs(handoff): 736 Phase 0c session switch prep
5bc0b6c fix(session): SESSION-CLOCK CRLF + clock reset for new session
087a3cf feat(736): spec row menu Phase 0c all tables (rev163)
a32af38 docs(kintone): Actions デプロイ記録 [skip ci]
330dd73 feat(736): spec row menu add-above Phase 0b (rev161)
2677f73 docs(kintone): Actions デプロイ記録 [skip ci]
7a152e5 fix(736): spec row menu opens on click (rev159)
e2cc4fc docs(kintone): Actions デプロイ記録 [skip ci]
380ce94 feat(736): spec row context menu Phase 0a (rev157)
4caf3ff docs(kintone): Actions デプロイ記録 [skip ci]
ba2bb27 docs(736): fix live fileKey for rev155 in kintone-apps.md
f4a2967 feat(736): print summary mode label and UX regression gates (rev155)
5dc9793 docs(kintone): Actions デプロイ記録 [skip ci]
f6220f1 feat(736): v2d UX — sticky toolbar, per-block removed rows, prominent diff UI
30d309e docs(kintone): Actions デプロイ記録 [skip ci]
386d84c fix(736): print bar layout flex column prevents grid squeeze
```

### 1-B. kintone-apps.md 本日の追記
_(本日の追記なし)_

### 1-C. 朝ブリーフィングの警告
- ### ❌ npm audit
- ⚠️ 本文に ## 4 件の TSB セクションがあるが目次にない (drift)
- - **MCP 死蔵検知 (S12)**: ⚠️ 死蔵 3 / 削除候補 0 (過去 7 日) — 参考のみ (21 exempt)
- - ❌ npm audit
- - ❌ npm outdated

### 1-D. cron ログの失敗痕跡
- [2026-07-03T21:00:11.593Z]   exit=1 stdout=1250B stderr=98B platform=win32 elapsed=1.3s
- [2026-07-03T21:00:13.006Z]   exit=1 stdout=150B stderr=98B platform=win32 elapsed=1.4s

### 1-E. 会話履歴の量
_(transcripts 未取得)_

### 1-F. 保留中の改善提案
- `2026-07-02-V1-nodemailer.proposal.json` [V] (no title) — status=pending

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

- [ ] **§51-6-2 壁時計**・**`[憲法適合]`** の運用（朝の習慣・区切り宣言）— **夜の反省会で議題化**（2026-05-06 浜田指示）。
- [ ] **朝報** `docs/reports/YYYY-MM-DD-morning-prep.md` **未生成日の扱い**（自動生成の要否・手動時のルール）— **夜の反省会で議題化**（2026-05-06 浜田指示）。
- [x] **薄型憲法・常時枠（2026-05-09 CIO）**: **YAML 常時注入は `cio-constitution.mdc` のみ**へ集約。分割 `.mdc` は **`false` + `globs`（または glob なし）**。`npm run verify:thin-rule-messaging` を smoke に追加。旧「10→11 枚」議題は **方針転換によりクローズ**（履歴議論は `handoff-log.md` 等に残存しうるが **現行正本は `cio-constitution` + verify**）。

## 完了（参照用・削除してよい）

- [x] **`docs/mcp-status.md`（4/28 追随）**（2026-05-05）: 見出し **最終更新 2026-04-28**・「表の鮮度」・自律向けルール追記済み。行ごとの使用回数は月次／イベント時まで据え置き。
- [x] **朝報 §51-4 スナップ更新**（2026-05-05）: キュー記載は 4/28 版を指していたが、`daily-morning-prep.mjs` は**当日日付のみ**出力。承認どおり **`node scripts/daily-morning-prep.mjs`** を実行し **`docs/reports/2026-05-05-morning-prep.md`**（§51-4 含む）を再生成した。4/28 分は `docs/reports/archive/2026-04/` 参照。
- **朝報の読みやすさ（見送り 2026-05-05 浜田）**: 先頭1枚サマリ・PDF 化・`daily-morning-prep.mjs` 構成見直しは**実施しない**。朝・夜は**チャット貼付**で運用。

### 1-N. 毎夜必須議題（憲法運用レビュー・浜田と必ず議論）

> **2026-05-06 明文化（CEO 指示）**: 夜の反省会（**§44**）で **毎回** 次を **口頭または同一チャットで扱う**（飛ばさない）。議論したら **§2 または §4 に「今日の結論」1 行以上** 残す（形骸化防止）。

- [ ] **CIO 二人体制**: その日 **第2者（DeepSeek/Kimi）** を実際に挟んだか／**§50-3-8 スキップ理由**は妥当か／**本体だけで締めていないか**
- [ ] **§1c（仕様・検証）**: **`[仕様状態:]`** / **`[検証2者:]`** を出すべき場面で出しているか／**未決・仮決を確定と言い換えていないか**
- [ ] **MCP**: **`mcp-server-use-triggers.mdc`** を Read してから止まっているか／**`MCPスキップ:`** は理由付きか／**`npm run mcp:chat-stamp`** を使う場面で使ったか
- [ ] **「直った」検証不足**: 再発の芽がないか（具体例 0〜1 件でよい）
- [ ] **ルールと実態のズレ**: **`constitution-brief-card.mdc`** / **`every-turn-rules-confirm.mdc`** について、今日 **ほつれた点があれば 1 点** だけメモしたか

### 1-G. 直近 TSB（参考）
直近の TSB（参考・学習リソース）:
- TSB-039 — Windows で `verify:kintone-live-schema` OK 後に Node UV assertion crash（2026-06-24 制定 / R736-01 GO）
- TSB-041 — kintone DROP_DOWN 変更後 deploy 前 PUT で CB_VA01（2026-06-28 制定 / D-NAS-04 GO）
- TSB-040 — HeyGen 日本語 TTS 誤読・phonetic 長文 failed・クレジット枯渇（2026-06-28 制定 / video-gen パイロット）

### 1-K. 未参照ルール統廃合候補
_(出力から未参照ルール行を抽出できず)_



### 1-L. §55・憲法改訂フォロー（D3 / 週次でも可）

<!-- 浜田チェック不要・自己申告用。AI が埋める。 -->

- [ ] **§55-4/§55-5 整合**: 本日 AGENTS.md / RULES-INDEX を [BREAKING] 更新した場合、セーフモード・解除条件と矛盾がないかを 1 行で確認した
- 該当なし → `_（該当なし）_`

---

## 📝 2. 今日やったこと（AI が記入）

- **736** Phase 0c 行メニュー受け入れ GO → rev168（fixed popover 等）。Phase 1 スケジュール GO（7/11・7/18・7/25）。課題メモ §9.2.2 追記
- **698** 一覧 **在籍/退職/すべて** pill（通常=在籍）deploy rev19
- **700** **Q-UX-12** 支店長/本社評価＝合計・最終優先・評価項目折りたたみ deploy rev146（浜田目視 OK）
- 仕様・runbook・checkpoint・handoff 更新、git **`2b59e4e`** push 済

**§1-N 今日の結論（1行）**: 本番 deploy 後は同一セッション commit/push を徹底したが、kintone-apps 機械表の garble と Actions deploy 記録 push 競合が残った — 明日午前の整理対象。

---

## ✅ 3. うまくいったこと（AI が記入）

- 698/700 の UX 要望を **595 同型パターン**・**`<details>` 折りたたみ**で短時間実装し、浜田目視 OK
- 736 Phase 0c → Phase 1 まで **課題メモ正本化**（`jikkou-yosan-spec.md` §9.2.2）
- pre-push eslint が 698 の unused var を捕捉 → push 前修正
- constitution-gates CI は本日 push すべて **success**

---

## ⚠️ 4. 詰まった・失敗したこと（AI が記入）

| 事象 | 原因 | 学び |
|------|------|------|
| deploy:698 verify-kintone-apps NG（garble） | sync スクリプトが rev 重複マーカー生成 | deploy 直後 `sync:kintone-apps-build --strict` を必須化 |
| checkpoint post-commit NG（preamble 短い） | 手動更新で bootstrap 行削除 | close 前に mandatory-read-gate を意識 |
| GH Actions `kintone-customize-deploy` 1件 failure | ローカル push と Actions 記録 push の競合 | workflow で pull --rebase 再試行 |
| Windows `verify-kintone-live-schema` UV crash | 既知（TSB-039） | SKIP 証跡をチャットに残す運用継続 |

---

## 🚀 5. 改善提案（**ミス削減限定**・AI が記入。ユーザー承認待ち）

| ID | カテゴリ | 提案（どの失敗を防ぐか） | 想定リスク | 翌朝自動実施可? |
|---|---|---|---|---|
| #R1 | R | **deploy 後ゲート**: `sync:kintone-apps-build --strict` + `verify-kintone-apps-live-build-sync` を close-git チェックリストに明記（garble/不一致の再発防止） | 低 | ○ |
| #S1 | S | **Actions deploy 記録**: `kintone-customize-deploy` の push 前に `git pull --rebase` 失敗時 **1回リトライ**（今日の race 防止） | 低 | ○ |
| #S2 | S | **checkpoint 更新テンプレ**: close 時は bootstrap 必須行ブロックを **機械コピー**（`verify:checkpoint-handoff-template` 連動）— preamble 2800字未満 NG 防止 | 低 | ○ |
| #D1 | D | **evening-reflect-queue**: §51-6-2 壁時計項目を **運用安定後 [x] クローズ**（毎夜議題の形骸化防止） | 低 | 手動 |

> カテゴリ: **R**=ルール改善 / **S**=スクリプト改善 / **D**=ドキュメント / **C**=customize 改修(deploy 除く) / **K**=kintone API 操作

### ユーザー応答方法
- 個別: 「#R1 承認」「#S1 却下」「#D1 修正して: <修正内容>」
- 一括: 「全部承認」「Rカテゴリだけ承認」

**浜田応答（2026-07-04 21:30）**: **全部承認** → 即時実施済。正本: `docs/approved-changes/2026-07-05-evening-hamada-go.md`

---

## ~~🌅 明日へ~~（使用禁止 — 2026-05-30）

<!-- 次アクション・レーン・第1手は checkpoint / handoff / 当日 -0 へ。ここには書かない。 -->
