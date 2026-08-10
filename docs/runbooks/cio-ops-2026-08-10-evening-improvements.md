# CIO Ops — 2026-08-10 夕反省改善（浜田全対応）

> 正本パッケージ。**08-09 ops は上書きしない**（併存）。上位: `docs/runbooks/session-lifecycle-v2.md`。  
> GO: `docs/approved-changes/2026-08-10-evening-reflection-hamada-go.md`  
> 仕様: `docs/plans/2026-08-10-evening-improvements-spec.md`  
> ネタ運用詳細: `docs/runbooks/keiei-kaigi-neta-from-security-next.md`

## T1 / R1 — §41（意見交換）

- 意見交換ターンは **1問→合意→次** のみ。
- 開始時にチャットで §41 を自己宣言してよい。
- **表が2つ以上**、または「あるべき姿＋比較＋推奨」を一度に書く案は **送信前に削る**。

## T2 — 既知再説明禁止

- 631／701／R7／`C:\tmp` の「いまあるもの」列挙は、浜田が求めたとき以外出さない。
- 入るのは **利用方法・分岐点・確認1問** だけ。

## T6 / ORG-3 / R3 — ネタ ≠ 経営会議レポート

| 依頼フレーズ例 | レーン |
|----------------|--------|
| 「経営会議〇月の**ネタ**を作って」 | ネタのみ（本 runbook／neta runbook） |
| 「経営会議レポートを作って」等 | R7 doc-lane（`keiei-kaigi-security-report.md`） |

同一ターンで混ぜない。ネタ完了後もレポート本体へ勝手に進まない。

## ORG-1 / MCP-1 / CON-3 — 第2者のタイミング

- 意見交換の進行役は **CIO**。
- DeepSeek（§50-3-8）は **分岐が1つ決まった後**の盲点3点のみ。
- 初回長文の下書き増幅に MCP を使わない。

## ORG-2 — 利用者

ネタ成果物の利用者は **浜田＋AI のみ**。部員向け701改修・新アプリは別案件（相談・GO後）。

## OPS-1 / OPS-2 — ネタ作成

1. 依頼月 → 前月 `published_date`
2. **UX 入口=701**、**REST 正本=631** を作業開始時に1行明示
3. おすすめ度降順・件数固定なし
4. 保存先: `C:\tmp\資料作成\ネタ保存用\yyyymmdd\`

## T3 / R2 / OPS-3 — 省略禁止

- DOCX／表セルの `…`／三点リーダ切り **禁止**。
- 原因・被害額・現状が無いときは **「未確定（調査中）」**。
- 納品前チェック: 成果物に `…` が無いか（機械または目視1項）。

## T5 / R4 / RULE-2 — 報告

1. 先に `npm run cio:report:draft -- --out <path>`（□A1 許容語彙サンプル付き）。
2. 事実置換後 `npm run cio:report-verify-response -- --file <path>`。
3. 初回 NG は失敗に数え、**同一ターン**で再 verify まで完了。

## MCP-2 — ネタ時の DeepSeek

品質観点のみ（空欄表記・件数過多・701/631 混同）。列設計の再発明はさせない。

## MCP-3 / CON-1 — 見送り

- 新 MCP サーバー追加なし。
- AGENTS.md 大改訂なし（brief-card／薄い mdc のポインタのみ）。

## CON-2 — 憲法ポインタ

`.cursor/rules/constitution-brief-card.mdc` に **§41** と **ネタレーン分離** の1〜2行。本文置換しない。
