# 運用改善 — 2026-08-03 夕反省 GO

> GO: `docs/approved-changes/2026-08-03-evening-reflection-hamada-go.md`  
> 憲法本文（AGENTS）は変更しない。

## 表示面マトリクス（A1 / A2 / O-SURF-01 / S-UI-SURF-01 / C-GO-PRINT）

「接続情報」「注意書き」「目立たせ文言」など **表示面が複数**ある依頼では、編集・Diff **前**にチャットへ次の **1 行**を出す:

```text
表示面: 画面=否 / 単票印刷=要 / 一覧印刷=否 / Excel=否 （曖昧→印刷優先仮置き・浜田確認）
```

| 規則 | 内容 |
|------|------|
| **曖昧時** | **印刷物優先**で案を出し確認（画面載せは明示依頼があるまでしない） |
| **初回 deploy** | 禁止・注意文言は **物理掲示に近い印刷面のみ**から始める（C-GO-PRINT / A2） |
| **§41** | 「どこに出すか」だけは G2 前でも確認可（C-41-SURF）。完了サマリを GO 待ちに出さない規律は維持 |

## 印刷ヘッダーの二重絞込（S-PRINT-FILTER-01）

一覧印刷が **画面絞込＋別モーダル**の二重系のとき、印刷ヘッダー要約に必ず:

- **画面（…）** — lifecycle / ステータス / 検索など画面側
- **モーダル部署=…** — 印刷モーダルで選んだ部署（画面の単一部署セレクトはモーダルが勝つ）

参照実装: `customize/jr-ipad-dash` の `listPrintFilterSummary`。

**dash 共通メモ（1 行）**: 二重絞込の一覧印刷はヘッダーに `画面(…)` と `モーダル…` を併記する。片方省略禁止。

## closed-v1 と微小 UI（O-CLOSED-01）

`data/cio-project-closures.json` の **closed-v1** でも、浜田の **明示依頼**があれば **微小 UI／印刷**は再開扱いでよい。

| 可 | 不可（別途大規模 GO） |
|----|----------------------|
| 注意文言・印刷ヘッダー・一覧印刷の絞込 UI | WF／採番／データモデル変更 |
| 表示面の限定・色・注記 | closures 解除なしの v1 再設計 |

**closures 解除**は大規模再開時のみ。詳細: `docs/runbooks/cio-project-closure-governance.md` §C。

## WAKE dirty（O-WAKE-01）

- 偽陽性 dirty は `WAKE_HANDOFF_ALLOWLIST` 追記を既定（本日 knowledge-wake 済）。
- 締め前は `SESSION-CLOCK.md`／翌日 pending 以外の意図しない dirty を 0 にする。

## MCP / 報告（M-5038-SURF / M-REPORT-01 / A3 / S-REPORT-A1）

| ID | 運用 |
|----|------|
| **M-5038-SURF** | customize／注意文言／印刷の §50-3-8 短問で **(a) に表示面漏れ（画面／単票印刷／一覧印刷／Excel）** を含める |
| **M-REPORT-01** | 報告下書きは IDE 手書きより **`npm run cio:report-draft` → 事実置換 → `cio:report-verify-response`** |
| **S-REPORT-A1** | □A1 は必ず `ダブルチェック（誰と・結果）`（括弧付き）。正例は `docs/session-report-checklist.md` §A1 |

## §50-3-8 突合メモ（2026-08-03・本 GO 実装）

1. 表示面は runbook＋薄い mdc＋checklist に固定。AGENTS 非置換。  
2. 短問 (a) に表示面漏れを定型化（`deepseek-cursor-spec-division.mdc`）。  
3. closed-v1 微小 UI は governance §C に明示。721 ヘッダーは画面／モーダル併記。
