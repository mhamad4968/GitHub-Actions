# 夕反省 — 2026-08-09

> スコープ正本: `docs/runbooks/evening-reflection-scope.md`  
> **GO**: 未承認（浜田承認待ち）  
> 第2者: DeepSeek（案の盲点）／Kimi（深掘り・汎用語多め→CIOが lab 具体に再翻訳）

## 0. GitHub 確認（本日）

| 項目 | 結果 |
|------|------|
| 直近 push（WAKE／gates） | constitution-gates / cursor-env-gates / kintone-customize-deploy **success** |
| open Issue | **0** |
| `verify:github-constitution-gates` | **OK** tip=`f48a0a9d` |
| cancelled | concurrency `cancel-in-progress`（後続 success で置換）— **是正不要** |
| failure 履歴 | `682-graph-monthly-refresh` 08-01 schedule 失敗は **08-01／08-06 dispatch で success 再走済** — 本日新規 NG なし |

**本日の GitHub 不具合是正**: なし（緑維持）。

---

## 1. 失敗（事実）

| # | 事実 |
|---|------|
| 1 | cold-start ログの Self-Heal／#D-CLOSE-02／Desktop WARN を「毎日人手是正が要る欠陥」と錯覚しうる状態を、長い間「見た目エラー」のまま残していた |
| 2 | `lock heal` を handoff **前**に移した初案で **re-export を欠き**、bridge が grandparent になる悪化経路を一度入れ得た（CIO が後追いで lock→re-export→handoff に修正） |
| 3 | Composer に実装を任せたあと、順序バグを **本体 CIO の再読で発見**した（第2者／差分レビューが順序契約まで届いていなかった） |
| 4 | 報告下書きで □A1 ラベル形式・🎖️ medal-line 不一致により `cio:report-verify-response` を初回 NG にした |
| 5 | 「他にない？」に対し磨きを続け、価値はあったが **ゲート配線まで足す判断が後追い**になり、Done 宣言が二度に割れた |

---

## 2. 改善案（ミス削減）— 行動・脚本

| ID | 内容 | 状態 |
|----|------|------|
| **T1** | cold-start 成功経路のログは **INFO／healed**、失敗のみ ❌（本日一部反映済） | **一部済** → 承認で残り表記統一 |
| **T2** | `cio-wake-handoff-commit` 契約テスト: **lock→re-export→handoff** の文字列順序を必須（本日配線済） | **反映済** |
| **T3** | Composer 成果物の受入チェックに「**順序契約 1 行**（先／後／再export有無）」を必須 | **承認待ち** |
| **T4** | `test:wake` を pre-push parity + cursor-env-gates に固定（本日反映済） | **反映済** |
| **T5** | 報告下書きは先に `cio:report-draft` または medal／□A1 テンプレ固定から始める | **承認待ち** |

---

## 3. 改善案 — ルール・脚本

| ID | 内容 | 状態 |
|----|------|------|
| **R1** | WAKE tip 変更ルール: allowlist 外 tip（lock/credit）を足すときは **必ず bridge re-export または `--wake-context` fold のどちらを使うか**を PR／チャット 1 行で宣言 | **承認待ち** |
| **R2** | 「Done」宣言ルール: **実装完了**と**ゲート固定完了**を分け、後者未了なら「ローカル済・CI未」と書く | **承認待ち** |
| **R3** | 偽陽性レーンの文言辞書（INFO=自動修復中／WARN=環境注意／NG=人手またはスクリプト失敗）を runbook 1 節に固定 | **承認待ち** |

---

## 4. §体制・運用・MCP・ルール・憲法（深い検討・承認用）

### 4-A 体制

| ID | 内容 | 因果（再発防止） | 状態 |
|----|------|------------------|------|
| **ORG-1** | Subagent（Composer）実装の検収は CIO が「差分要約＋**順序／副作用契約**」を必ずチャットに残す（コード読まない受入禁止） | #3 — 後追い発見を受入ゲートに前倒し | **承認待ち** |
| **ORG-2** | 「希望対応」ターンでも **スコープ上限 1 本**（例: ゲート配線のみ）。超過は次ターン or 夕反省案へ | #5 — Done の二度割れ抑制 | **承認待ち** |

### 4-B 運用

| ID | 内容 | 因果 | 状態 |
|----|------|------|------|
| **OPS-1** | cold-start 完了報告テンプレに「見た目の赤行＝分類（INFO/WARN/NG）」を 3 行以内で必須 | #1 — 毎日人手是正錯覚の防止 | **承認待ち** |
| **OPS-2** | セッション中の tip 追加 commit（credit 等）後は、締め前に `export-handoff` or `:wake` 確認を checklist 1 項 | bridge 親ずれの締め前検知 | **承認待ち**（credit ログ注記は本日済） |

### 4-C MCP

| ID | 内容 | 因果 | 状態 |
|----|------|------|------|
| **MCP-1** | 新 MCP サーバー追加は見送り維持。既存 DeepSeek 短問に「**順序・再export・ゲート漏れ**」観点を WAKE／scripts 変更時の定型に 1 語追加 | #2/#3 — §50-3-8 が型だけでなく順序契約を見る | **承認待ち** |
| **MCP-2** | Kimi 深掘りが汎用語になった場合、CIO は **lab 具体へ再翻訳した案だけ**を夕反省に載せる（生出力を正本にしない） | 本日 Kimi が抽象案に寄った事実 | **承認待ち**（運用メモ） |

### 4-D ルール

| ID | 内容 | 因果 | 状態 |
|----|------|------|------|
| **RULE-1** | `R1`+`R2`+`R3` を `.cursor/rules` の薄い globs ルール（wake/handoff scripts）に 1 ファイルで追加してもよい | 散読ではなく編集時想起 | **承認待ち** |
| **RULE-2** | 報告 verify 初回 NG を「失敗」に数え、同一ターンでテンプレ修正→再 verify までを完了定義に含める | #4 | **承認待ち** |

### 4-E 憲法

| ID | 内容 | 因果 | 状態 |
|----|------|------|------|
| **CON-1** | **AGENTS.md 大改訂はしない**（本日の主因は憲法不足ではなく **検査混同・順序契約・ログ語彙**） | 08-08 と同型の結論 | **見送り推奨** |
| **CON-2** | 憲法運用は `constitution-brief-card` または cold-start runbook に「偽陽性≠欠陥」「lock 後 re-export」の **1〜2 行ポインタ**のみ（本文非置換） | 要約耐性を保ちつつ再発防止 | **承認待ち** |

### 1-N 憲法運用レビュー（本日の結論）

- 主因は **WAKE 検査と締め検査の混同**、**tip 順序契約の欠落**、**ログ語彙が人を誤解させること**。条文不足ではない。
- 薄い runbook／verify／pre-push／§50-3-8 定型拡張で足りる。新 MCP・AGENTS 大改定は不要。

---

## 5. すでに本日反映済み（承認不要・参考）

- `--wake-context`（日付偽陽性）／grandparent fold（lock/credit tip）
- lock → re-export → handoff
- GHA deploy 記録時 rag mirror
- Self-Heal 成功の INFO 化、Desktop RAM/Notepad soft-tune
- `test:wake` スイート＋ pre-push／cursor-env-gates 配線
- credit:set の bridge 注記、HANDOFF-HUMAN 追記

---

## 6. 承認のお願い（浜田）

実装・対応は **浜田の承認と依頼後**に行います。  
候補の見方:

| 優先イメージ | ID |
|--------------|-----|
| すぐ効く薄いもの | OPS-1, R3, T3, RULE-2 |
| 体制の型 | ORG-1, ORG-2, R2 |
| MCP 定型 | MCP-1 |
| 憲法 | CON-1（見送り）／CON-2（ポインタのみ） |

**出さないもの（スコープ）**: 明日のレーン・第1手・スケジュール案。
