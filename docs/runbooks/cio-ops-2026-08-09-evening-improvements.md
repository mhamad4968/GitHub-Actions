# CIO Ops — 2026-08-09 夕反省改善（浜田全承認）

> 正本パッケージ。上位: `docs/runbooks/session-lifecycle-v2.md`（O-WAKE 系）。本ファイルは **下位運用**。  
> GO: `docs/approved-changes/2026-08-09-evening-reflection-hamada-go.md`  
> 仕様: `docs/plans/2026-08-09-evening-improvements-spec.md`

## R3 — 偽陽性レーン文言辞書

| 表示 | 意味 | 人手是正？ |
|------|------|------------|
| **INFO** / healed / Self-Heal 成功 | 自動修復中または修復済み | **不要**（見た目の赤行≠欠陥） |
| **WARN** | 環境注意（RAM・Notepad・任意タスク等） | 状況次第。毎日必須ではない |
| **❌ / NG** | スクリプト失敗・人手確認必須 | **要** |

WAKE の `#D-CLOSE-02` 日付スキップ（`--wake-context`）・grandparent fold は **検査混同の防止**であり失敗ではない。

## T1 — cold-start 成功経路

- 成功経路ログは **INFO／healed／✅**。失敗のみ **❌**。
- 報告では OPS-1 テンプレで分類する（下節）。

## OPS-1 — cold-start 完了報告（≤3 行）

```
[cold-start 見た目分類]
INFO/healed: <例: Self-Heal / wake-context skip / fold>
WARN: <無なら「無」>
NG: <無なら「無」— ある場合のみ是正>
```

## OPS-2 — tip 追加後の締め前確認

セッション中に **credit / lock / handoff 以外 tip** を足したら、締め前に次のいずれか:

1. `npm run cio:session:export-handoff`（bridge 再生成）
2. または `npm run cio:wake:handoff-commit`（契約どおり re-export 含む）

checklist 1 項としてチャットに残す。

## R1 — WAKE tip 変更の宣言

allowlist 外 tip（lock / credit 等）を足すとき、PR またはチャットに **1 行**:

- `再export: する` または
- `wake-fold: --wake-context に依存`

両方無言は禁止。

## R2 — Done 宣言の二層

| 層 | 書き方 |
|----|--------|
| **実装完了** | ローカル差分・テスト緑まで |
| **ゲート固定完了** | pre-push / GHA / `test:wake` 配線まで |

後者未了なら **「ローカル済・CI未」** と書く。混ぜない。

## T3 / ORG-1 — Composer・Subagent 受入

検収チャットに必須:

1. **差分要約**（触ったパス）
2. **順序契約 1 行**（先／後／再 export 有無）
3. **副作用**（bridge・allowlist・ゲート）

コードを読まない「完了」受入は禁止。

## ORG-2 — 希望対応スコープ

「他にない？」「希望対応」でも **スコープ上限 1 本**。超過は次ターンまたは夕反省案へ。

## T5 / RULE-2 — 報告

1. 下書きは先に `npm run cio:report-draft -- --out <path>` または medal／□A1 テンプレ固定から始める。
2. `cio:report-verify-response` **初回 NG** は失敗に数え、**同一ターン**で修正→再 verify までを完了定義に含める。

## MCP-1 / MCP-2

- **MCP-1**: WAKE／scripts 変更の §50-3-8 短問に **「順序・再export・ゲート漏れ」** を含める。
- **MCP-2**: Kimi が汎用語のときは **CIO が lab 具体へ再翻訳した案だけ**を正本に載せる（生出力を夕反省正本にしない）。

## CON-1 / CON-2

- **CON-1**: AGENTS.md 大改訂しない（見送り）。
- **CON-2**: `constitution-brief-card` と本 runbook／cold-start にポインタのみ（憲法本文非置換）。
